import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { createMockRequest, generateCuid } from "@/__tests__/helpers/test-utils"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    vendorStaffMember: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock("@/root/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    vendorStaffMember: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(async () => null),
}))
jest.mock("@/root/lib/auth", () => ({
  auth: jest.fn(async () => null),
}))

const mockGetSession = jest.fn()

jest.mock("@/lib/get-session-from-request", () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSession(...args),
}))
jest.mock("@/root/lib/get-session-from-request", () => ({
  getSessionFromRequest: (...args: unknown[]) => mockGetSession(...args),
}))

jest.mock("@/lib/rate-limit", () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {} },
}))
jest.mock("@/root/lib/rate-limit", () => ({
  applyRateLimit: jest.fn(),
  rateLimitConfigs: { api: {} },
}))

jest.mock("@/lib/vendor-accounting-local", () => ({
  listExpenses: jest.fn(() => []),
  listOfflineSalesInRange: jest.fn(() => []),
  summarizeSales: jest.fn(() => ({})),
  exportAccountingCsv: jest.fn(() => "csv"),
  addExpense: jest.fn(),
}))

jest.mock("@/lib/guest-orders-store", () => ({
  listTables: jest.fn(() => []),
  addTable: jest.fn(),
  deleteTable: jest.fn(),
  listGuestOrders: jest.fn(() => []),
  updateGuestOrderStatus: jest.fn(),
}))

describe("shop-type feature gates", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  async function mockOwnerShopType(shopType: string) {
    const { prisma } = await import("@/root/lib/prisma")
    ;(prisma.vendorStaffMember.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ shopType })
    const rootPrisma = await import("@/lib/prisma")
    ;(rootPrisma.prisma.vendorStaffMember.findUnique as jest.Mock).mockResolvedValue(null)
    ;(rootPrisma.prisma.user.findUnique as jest.Mock).mockResolvedValue({ shopType })
  }

  it("GET accounting summary returns 403 for retail shop type", async () => {
    const vendorId = generateCuid()
    mockGetSession.mockResolvedValue({
      user: { id: vendorId, role: "VENDOR", email: "retail@x.com" },
    })
    await mockOwnerShopType("retail")

    const { GET } = await import("@/apps/vendor/app/api/vendor/accounting/summary/route")
    const request = createMockRequest(
      "http://localhost:3001/api/vendor/accounting/summary"
    )
    const response = await GET(request)
    expect(response.status).toBe(403)
  })

  it("GET accounting summary returns 200 for restaurant shop type", async () => {
    const vendorId = generateCuid()
    mockGetSession.mockResolvedValue({
      user: { id: vendorId, role: "VENDOR", email: "rest@x.com" },
    })
    await mockOwnerShopType("restaurant")

    const { GET } = await import("@/apps/vendor/app/api/vendor/accounting/summary/route")
    const request = createMockRequest(
      "http://localhost:3001/api/vendor/accounting/summary"
    )
    const response = await GET(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it("GET restaurant tables returns 403 for retail shop type", async () => {
    const vendorId = generateCuid()
    mockGetSession.mockResolvedValue({
      user: { id: vendorId, role: "VENDOR", email: "retail@x.com" },
    })
    await mockOwnerShopType("retail")

    const { GET } = await import("@/apps/vendor/app/api/vendor/restaurant/tables/route")
    const request = createMockRequest("http://localhost:3001/api/vendor/restaurant/tables")
    const response = await GET(request)
    expect(response.status).toBe(403)
  })
})
