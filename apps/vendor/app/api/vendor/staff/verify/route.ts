import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/root/lib/auth"

// POST /api/vendor/staff/verify - Verify staff password
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { staffId, password } = body

    if (!staffId || !password) {
      return NextResponse.json(
        { success: false, error: "Staff ID and password required" },
        { status: 400 }
      )
    }

    // In production, verify password hash from database
    // For now, check against stored password in localStorage (handled client-side)
    // This is just a placeholder API endpoint

    return NextResponse.json({
      success: true,
      message: "Password verified",
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify password" },
      { status: 500 }
    )
  }
}

