import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Marca como 'default' para que o próximo seed sobrescreva
    const result = await query(
      `UPDATE message_templates
       SET source = 'default', updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [id]
    )

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error("Failed to reset template:", error)
    return NextResponse.json(
      { error: "Failed to reset template" },
      { status: 500 }
    )
  }
}
