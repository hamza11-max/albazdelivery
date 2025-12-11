import { NextRequest } from "next/server"
import { auth } from "@/root/lib/auth"
import { prisma } from "@/root/lib/prisma"
import { applyRateLimit, rateLimitConfigs } from "@/root/lib/rate-limit"
import { successResponse, errorResponse, UnauthorizedError } from "@/root/lib/errors"

const pickProfile = (user: any) => ({
  id: user.id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  address: user.address,
  city: user.city,
  description: user.shopType,
  logo: user.photoUrl,
  cover: user.licenseNumber, // repurposed for cover until dedicated column exists
})

export async function GET(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get("vendorId")
    const session = await auth().catch(() => null)

    // If vendorId provided, allow public/sanitized fetch for customer/admin/driver surfaces
    if (vendorId) {
      const user = await prisma.user.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          shopType: true,
          photoUrl: true,
          licenseNumber: true,
        },
      })
      if (!user) {
        throw new UnauthorizedError()
      }
      return successResponse({ profile: pickProfile(user) })
    }

    // Default: authenticated vendor fetches own profile
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        shopType: true,
        photoUrl: true,
        licenseNumber: true,
      },
    })
    if (!user) {
      throw new UnauthorizedError()
    }
    return successResponse({ profile: pickProfile(user) })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    applyRateLimit(request, rateLimitConfigs.api)
    const session = await auth()
    if (!session?.user) {
      throw new UnauthorizedError()
    }
    const body = await request.json()
    const { name, phone, email, address, city, description, logo, cover } = body || {}

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name ?? undefined,
        phone: phone ?? undefined,
        email: email ?? undefined,
        address: address ?? undefined,
        city: city ?? undefined,
        shopType: description ?? undefined,
        photoUrl: logo ?? undefined,
        licenseNumber: cover ?? undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        shopType: true,
        photoUrl: true,
        licenseNumber: true,
      },
    })

    return successResponse({ profile: pickProfile(updated) })
  } catch (error) {
    return errorResponse(error)
  }
}
