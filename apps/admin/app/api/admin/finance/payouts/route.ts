/** Mirrored from `app/api/admin/finance/payouts/route.ts` for workspace deployment. */
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/root/lib/prisma'
import { csrfProtection } from '../../../../../lib/csrf'
import { successResponse, errorResponse, ForbiddenError, UnauthorizedError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import {
  auditFinancialAdminAction,
  FinancialAuditActions,
} from '@/root/lib/security/financial-audit'

const createPayoutSchema = z
  .object({
    vendorId: z.string().cuid(),
    periodLabel: z.string().min(1).max(200),
    grossAmount: z.number().nonnegative(),
    feesAmount: z.number().nonnegative(),
    netAmount: z.number(),
    status: z.string().min(1).max(64),
    etaLabel: z.string().min(1).max(200),
  })
  .refine(
    (d) => Math.abs(d.netAmount - (d.grossAmount - d.feesAmount)) < 0.01,
    { message: 'netAmount must equal grossAmount - feesAmount', path: ['netAmount'] }
  )

function csvEscape(v: string | number): string {
  const s = String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can access payout ledger')
    }

    const { searchParams } = request.nextUrl
    const vendorIdFilter = searchParams.get('vendorId')
    const format = searchParams.get('format')
    const take = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 500)

    if (vendorIdFilter) {
      try {
        z.string().cuid().parse(vendorIdFilter)
      } catch {
        return errorResponse(new Error('Invalid vendorId'), 400)
      }
    }

    const rows = await prisma.vendorPayout.findMany({
      where: vendorIdFilter ? { vendorId: vendorIdFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        vendor: { select: { id: true, email: true, name: true } },
      },
    })

    if (format === 'csv') {
      const header =
        'id,vendorId,vendorEmail,periodLabel,grossAmount,feesAmount,netAmount,status,etaLabel,createdAt'
      const lines = rows.map((r) =>
        [
          csvEscape(r.id),
          csvEscape(r.vendorId),
          csvEscape(r.vendor.email),
          csvEscape(r.periodLabel),
          csvEscape(r.grossAmount),
          csvEscape(r.feesAmount),
          csvEscape(r.netAmount),
          csvEscape(r.status),
          csvEscape(r.etaLabel),
          csvEscape(r.createdAt.toISOString()),
        ].join(',')
      )
      const body = [header, ...lines].join('\r\n')
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="vendor-payouts.csv"',
        },
      })
    }

    return successResponse({
      payouts: rows.map((r) => ({
        id: r.id,
        vendorId: r.vendorId,
        vendor: r.vendor,
        periodLabel: r.periodLabel,
        grossAmount: r.grossAmount,
        feesAmount: r.feesAmount,
        netAmount: r.netAmount,
        status: r.status,
        etaLabel: r.etaLabel,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) {
    return csrfResponse
  }

  try {
    await applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    if (String(session.user.role ?? '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenError('Only admins can record payouts')
    }

    const body = createPayoutSchema.parse(await request.json())

    const vendor = await prisma.user.findUnique({
      where: { id: body.vendorId },
      select: { id: true, role: true },
    })
    if (!vendor || vendor.role !== 'VENDOR') {
      return errorResponse(new Error('Vendor not found'), 404)
    }

    const payout = await prisma.vendorPayout.create({
      data: {
        vendorId: body.vendorId,
        periodLabel: body.periodLabel,
        grossAmount: body.grossAmount,
        feesAmount: body.feesAmount,
        netAmount: body.netAmount,
        status: body.status,
        etaLabel: body.etaLabel,
      },
    })

    await auditFinancialAdminAction(
      FinancialAuditActions.PAYOUT_RECORD_CREATED,
      'VENDOR_PAYOUT',
      payout.id,
      session.user.id,
      request,
      {
        vendorId: body.vendorId,
        periodLabel: body.periodLabel,
        netAmount: body.netAmount,
        status: body.status,
      }
    )

    return successResponse({ payout }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}
