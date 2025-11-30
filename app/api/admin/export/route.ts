import { NextRequest } from 'next/server'
import { prisma } from '@/root/lib/prisma'
import { successResponse, errorResponse, UnauthorizedError, ForbiddenError } from '@/root/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/root/lib/rate-limit'
import { auth } from '@/root/lib/auth'
import { z } from 'zod'

const exportSchema = z.object({
  type: z.enum(['users', 'orders', 'audit-logs']),
  format: z.enum(['csv', 'json']).default('csv'),
  filters: z.object({
    role: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
})

// POST /api/admin/export - Export data
export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)

    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }

    if (session.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can export data')
    }

    const body = await request.json()
    const { type, format, filters } = exportSchema.parse(body)

    let data: any[] = []
    let filename = ''

    if (type === 'users') {
      const where: any = {}
      if (filters?.role) where.role = filters.role
      if (filters?.status) where.status = filters.status
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          city: true,
          address: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      data = users
      filename = `users_${new Date().toISOString().split('T')[0]}.${format}`
    } else if (type === 'orders') {
      const where: any = {}
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
      }

      const orders = await prisma.order.findMany({
        where,
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          customerId: true,
          vendorId: true,
          driverId: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      data = orders
      filename = `orders_${new Date().toISOString().split('T')[0]}.${format}`
    } else if (type === 'audit-logs') {
      const where: any = {}
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {}
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
      }

      const logs = await prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          userId: true,
          userRole: true,
          action: true,
          resource: true,
          resourceId: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10000, // Limit for export
      })

      data = logs
      filename = `audit-logs_${new Date().toISOString().split('T')[0]}.${format}`
    }

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return errorResponse(new Error('No data to export'), 400)
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              if (value === null || value === undefined) return ''
              if (typeof value === 'object') return JSON.stringify(value)
              return String(value).replace(/"/g, '""')
            })
            .map((v) => `"${v}"`)
            .join(',')
        ),
      ]

      const csv = csvRows.join('\n')
      const csvBuffer = Buffer.from(csv, 'utf-8')

      return new Response(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else {
      // JSON format
      return successResponse({
        data,
        filename,
        count: data.length,
      })
    }
  } catch (error) {
    return errorResponse(error)
  }
}

