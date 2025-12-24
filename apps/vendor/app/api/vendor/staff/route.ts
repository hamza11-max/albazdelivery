import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/root/lib/auth"

// GET /api/vendor/staff - Get all staff members
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // In production, fetch from database
    // For now, return from localStorage or create default staff
    const defaultStaff = [
      {
        id: "staff-owner",
        name: session.user.name || "Owner",
        email: session.user.email || "",
        role: "owner",
      },
    ]

    // Try to get from a database or return default
    return NextResponse.json({
      success: true,
      staff: defaultStaff,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch staff" },
      { status: 500 }
    )
  }
}

// POST /api/vendor/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, role, password } = body

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // In production, save to database with hashed password
    // For now, just return success
    return NextResponse.json({
      success: true,
      staff: {
        id: `staff-${Date.now()}`,
        name,
        email,
        role,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create staff" },
      { status: 500 }
    )
  }
}

// PUT /api/vendor/staff - Update staff member
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, email, role, password } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Staff ID required" },
        { status: 400 }
      )
    }

    // In production, update in database
    return NextResponse.json({
      success: true,
      staff: {
        id,
        name: name || "",
        email: email || "",
        role: role || "staff",
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update staff" },
      { status: 500 }
    )
  }
}

// DELETE /api/vendor/staff - Delete staff member
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Staff ID required" },
        { status: 400 }
      )
    }

    // In production, delete from database
    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete staff" },
      { status: 500 }
    )
  }
}

