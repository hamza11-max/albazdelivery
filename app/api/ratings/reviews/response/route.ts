import { db } from "@/lib/db"
import type { VendorResponse } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reviewId, vendorId, response } = body

    if (!reviewId || !vendorId || !response) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const vendorResponse: VendorResponse = {
      id: `response-${Date.now()}`,
      reviewId,
      vendorId,
      response,
      createdAt: new Date(),
    }

    db.createVendorResponse(vendorResponse)

    return Response.json({ success: true, response: vendorResponse })
  } catch (error) {
    console.error("[v0] Error creating vendor response:", error)
    return Response.json({ success: false, error: "Failed to create response" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get("reviewId")

    if (!reviewId) {
      return Response.json({ success: false, error: "Missing reviewId" }, { status: 400 })
    }

    const responses = db.getReviewResponses(reviewId)

    return Response.json({ success: true, responses })
  } catch (error) {
    console.error("[v0] Error fetching vendor responses:", error)
    return Response.json({ success: false, error: "Failed to fetch responses" }, { status: 500 })
  }
}
