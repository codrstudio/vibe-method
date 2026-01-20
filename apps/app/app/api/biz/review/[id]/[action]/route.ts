import { NextRequest, NextResponse } from "next/server"

const BACKBONE_URL = process.env.BACKBONE_URL || "http://localhost:8002"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id, action } = await params

    // Validate action
    if (!["approve", "reject", "fallback"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be approve, reject, or fallback" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))

    const response = await fetch(
      `${BACKBONE_URL}/backbone/biz/review/${id}/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || `Failed to ${action} report` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to process review action:", error)
    return NextResponse.json(
      { error: "Failed to process review action" },
      { status: 500 }
    )
  }
}
