import type { NextRequest } from "next/server"

/**
 * Root `lib/*` may be typed against a different `next` install than `apps/vendor`.
 * Cast through `unknown` so `applyRateLimit` and similar accept the request.
 */
export function asRootRequest(request: NextRequest): Request {
  return request as unknown as Request
}

/** For `getSessionFromRequest` and other helpers expecting the hoisted NextRequest type */
export function asRootNextRequest(request: NextRequest): NextRequest {
  return request as unknown as NextRequest
}
