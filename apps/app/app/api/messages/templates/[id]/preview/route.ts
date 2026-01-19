import { NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

interface MessageTemplate {
  id: string
  name: string
  channels: {
    email?: {
      enabled: boolean
      subject?: string
      body_html?: string
      body_text?: string
    }
  }
  variables: Array<{
    key: string
    label: string
    example?: string
  }>
}

// Variáveis globais
const globalVars = {
  app_name: process.env.APP_NAME || "CIA Dashboard",
  app_url: process.env.APP_BASE_URL || "http://localhost:8000",
  current_year: new Date().getFullYear().toString(),
  support_email: process.env.SUPPORT_EMAIL || "suporte@example.com",
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  const allVars = { ...globalVars, ...variables }
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return allVars[key as keyof typeof allVars] ?? match
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const channel = body.channel || "email"
    const inputVars = body.variables || {}

    const template = await queryOne<MessageTemplate>(
      `SELECT id, name, channels, variables
       FROM message_templates
       WHERE id = $1`,
      [id]
    )

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Usa exemplos das variáveis se não fornecidas
    const variables: Record<string, string> = { ...inputVars }
    for (const v of template.variables) {
      if (!variables[v.key] && v.example) {
        variables[v.key] = v.example
      }
    }

    if (channel === "email" && template.channels.email) {
      const emailConfig = template.channels.email
      return NextResponse.json({
        data: {
          channel: "email",
          rendered: {
            to: variables.user_email || "exemplo@email.com",
            subject: renderTemplate(emailConfig.subject || "", variables),
            html: renderTemplate(emailConfig.body_html || "", variables),
            text: renderTemplate(emailConfig.body_text || "", variables),
          },
        },
      })
    }

    return NextResponse.json(
      { error: "Channel not enabled" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Failed to preview template:", error)
    return NextResponse.json(
      { error: "Failed to preview template" },
      { status: 500 }
    )
  }
}
