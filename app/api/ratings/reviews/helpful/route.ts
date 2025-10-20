import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reviewId, helpful } = body

    if (!reviewId || helpful === undefined) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const review = db.updateReviewHelpful(reviewId, helpful)

    if (!review) {
      return Response.json({ success: false, error: "Review not found" }, { status: 404 })
    }

    return Response.json({ success: true, review })
  } catch (error) {
    console.error("[v0] Error updating review helpful:", error)
    return Response.json({ success: false, error: "Failed to update review" }, { status: 500 })
  }
}
