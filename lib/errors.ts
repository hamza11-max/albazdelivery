import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message)
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, message)
    Object.setPrototypeOf(this, TooManyRequestsError.prototype)
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId: string
  }
}

// Success response helper
export function successResponse<T>(data: T, statusCode = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    { status: statusCode }
  )
}

// Error response helper
export function errorResponse(
  error: unknown,
  statusCode?: number,
  request?: Request
): NextResponse<ApiResponse> {
  // Log error for monitoring
  console.error('[API Error]:', error)

  // Import audit logging dynamically to avoid circular dependencies
  if (request && error instanceof Error) {
    import('@/root/lib/security/audit-log').then(({ auditSecurityEvent, getClientInfo }) => {
      if (error instanceof UnauthorizedError) {
        auditSecurityEvent('UNAUTHORIZED_ACCESS', undefined, undefined, request as any, {
          message: error.message,
        })
      } else if (error instanceof ValidationError) {
        auditSecurityEvent('VALIDATION_ERROR', undefined, undefined, request as any, {
          message: error.message,
        })
      }
    }).catch(() => {
      // Silently fail audit logging to prevent breaking error handling
    })
  }

    // Handle Zod validation errors (duck-typed)
    // Some environments bundle multiple copies of `zod` which can make
    // `instanceof ZodError` unreliable. Detect Zod-like structures instead.
    const maybeZod = (err: unknown) => {
      if (!err || typeof err !== 'object') return false
      const e: any = err
      if (e instanceof ZodError) return true
      if (e && (Array.isArray(e.errors) || Array.isArray(e.issues))) return true
      if (e && typeof e.name === 'string' && e.name === 'ZodError') return true
      return false
    }

    if (maybeZod(error)) {
      const e: any = error
      const items = Array.isArray(e.errors) ? e.errors : Array.isArray(e.issues) ? e.issues : []
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: items.map((errItem: any) => ({
              path: Array.isArray(errItem.path) ? errItem.path.join('.') : String(errItem.path || ''),
              message: errItem.message || String(errItem || ''),
            })),
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      )
    }

  // Handle Prisma errors (narrow at runtime to avoid blanket `any` casts)
  const isPrismaError = (err: unknown): err is { code: string; meta?: any } => {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as { code?: unknown }).code === 'string'
    )
  }

  if (isPrismaError(error)) {
    const prismaError = error
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A record with this data already exists',
            details: prismaError.meta,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 409 }
      )
    }

    // Foreign key constraint failed (referenced record does not exist)
    if (prismaError.code === 'P2003') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Subscription not found. Create a subscription for the vendor first.',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      )
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 404 }
      )
    }

    // Database connection / schema errors (e.g. migrations not run, table missing)
    if (['P1001', 'P1002', 'P1012', 'P2021'].includes(prismaError.code)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message:
              process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
                ? (prismaError as Error).message
                : 'Database configuration error. Ensure migrations are run and the database is reachable.',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 503 }
      )
    }
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: error.constructor.name.replace('Error', '').toUpperCase(),
          message: error.message,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: error.statusCode }
    )
  }

  // Handle generic errors
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred'

  // Show detailed errors in development and test environments
  const showDetailedError = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: showDetailedError ? message : 'Internal server error',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    { status: statusCode || 500 }
  )
}

// Async handler wrapper to catch errors
export function asyncHandler(
  fn: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any) => {
    try {
      return await fn(req, context)
    } catch (error) {
      return errorResponse(error)
    }
  }
}
