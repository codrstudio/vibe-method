import { NextRequest, NextResponse } from "next/server"

const BACKBONE_URL = process.env.BACKBONE_URL || "http://localhost:8002"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint") || "today"
    const days = searchParams.get("days")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")
    const recent = searchParams.get("recent")

    let url = `${BACKBONE_URL}/backbone/biz/metrics/${endpoint}`
    const params = new URLSearchParams()
    if (days) params.set("days", days)
    if (limit) params.set("limit", limit)
    if (offset) params.set("offset", offset)
    if (recent) params.set("recent", recent)
    if (params.toString()) url += `?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch metrics data" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch metrics data:", error)
    return NextResponse.json(
      { error: "Failed to fetch metrics data" },
      { status: 500 }
    )
  }
}
