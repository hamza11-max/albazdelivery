import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { ChatMessage } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticket = db.getSupportTicket(params.id)

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString(),
        messages: ticket.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching ticket:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, assignedTo, message, senderId, senderRole, senderName } = body

    let ticket = db.getSupportTicket(params.id)
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 })
    }

    // Add message if provided
    if (message && senderId) {
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId: params.id,
        senderId,
        senderRole,
        senderName,
        message,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      ticket = db.addMessageToTicket(params.id, chatMessage) || ticket
    }

    // Update status if provided
    if (status) {
      ticket = db.updateSupportTicketStatus(params.id, status, assignedTo) || ticket
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString(),
        messages: ticket.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error("[v0] Error updating ticket:", error)
    return NextResponse.json({ success: false, error: "Failed to update ticket" }, { status: 500 })
  }
}
