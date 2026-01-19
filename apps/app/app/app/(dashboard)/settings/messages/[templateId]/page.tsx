"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Eye,
  Mail,
  MessageSquare,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { TemplateEditor } from "@/components/messages/template-editor"
import { VariablePicker } from "@/components/messages/variable-picker"
import { EmailPreview } from "@/components/messages/email-preview"

interface MessageTemplate {
  id: string
  name: string
  description: string | null
  category: string
  channels: {
    email?: {
      enabled: boolean
      subject?: string
      body_html?: string
      body_text?: string
    }
    whatsapp?: {
      enabled: boolean
      body?: string | null
    }
  }
  variables: Array<{
    key: string
    label: string
    example?: string
    required?: boolean
  }>
  settings: Record<string, unknown>
  source: "default" | "custom"
}

async function fetchTemplate(id: string): Promise<MessageTemplate> {
  const res = await fetch(`/api/messages/templates/${id}`)
  if (!res.ok) throw new Error("Template not found")
  const data = await res.json()
  return data.data
}

async function updateTemplate(
  id: string,
  data: Partial<MessageTemplate>
): Promise<MessageTemplate> {
  const res = await fetch(`/api/messages/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update template")
  const result = await res.json()
  return result.data
}

async function resetTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/messages/templates/${id}/reset`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to reset template")
}

async function previewTemplate(
  id: string,
  channel: string
): Promise<{
  channel: string
  rendered: {
    to: string
    subject: string
    html: string
    text: string
  }
}> {
  const res = await fetch(`/api/messages/templates/${id}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
  })
  if (!res.ok) throw new Error("Failed to preview template")
  const data = await res.json()
  return data.data
}

export default function TemplateEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [activeChannel, setActiveChannel] = useState<"email" | "whatsapp">("email")
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    from: string
    to: string
    subject: string
    html: string
  } | null>(null)

  // Form state
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const { data: template, isLoading } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => fetchTemplate(templateId),
  })

  // Initialize form when template loads
  useState(() => {
    if (template?.channels.email) {
      setSubject(template.channels.email.subject || "")
      setBodyHtml(template.channels.email.body_html || "")
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<MessageTemplate>) =>
      updateTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] })
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      setHasChanges(false)
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => resetTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] })
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      setHasChanges(false)
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      channels: {
        ...template?.channels,
        email: {
          ...template?.channels.email,
          enabled: true,
          subject,
          body_html: bodyHtml,
        },
      },
    })
  }

  const handlePreview = async () => {
    try {
      const data = await previewTemplate(templateId, activeChannel)
      if (data.channel === "email") {
        setPreviewData({
          from: "noreply@example.com",
          to: data.rendered.to,
          subject: data.rendered.subject,
          html: data.rendered.html,
        })
        setShowPreview(true)
      }
    } catch (error) {
      console.error("Preview failed:", error)
    }
  }

  const handleInsertVariable = (variable: string) => {
    // Insere a variável na posição do cursor
    // Por simplicidade, adiciona ao final do subject
    setSubject((prev) => prev + variable)
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Template não encontrado</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[
          { label: "Início", href: "/app" },
          { label: "Configurações", href: "/app/settings" },
          { label: "Mensagens", href: "/app/settings/messages" },
        ]}
        currentPage={template.name}
        actions={
          <>
            {template.source === "custom" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Restaurar padrão
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </>
        }
      />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Editor Area */}
            <div className="space-y-6">
              {/* Template Info */}
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-semibold">{template.name}</h1>
                {template.source === "custom" && (
                  <Badge variant="outline">Personalizado</Badge>
                )}
              </div>

              {template.description && (
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              )}

              <Separator />

              {/* Channel Tabs */}
              <Tabs
                value={activeChannel}
                onValueChange={(v) => setActiveChannel(v as "email" | "whatsapp")}
              >
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                    {template.channels.email?.enabled && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        Ativo
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="gap-2" disabled>
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                    <Badge variant="outline" className="ml-1 h-5 px-1.5">
                      Em breve
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="mt-6 space-y-6">
                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      value={subject || template.channels.email?.subject || ""}
                      onChange={(e) => {
                        setSubject(e.target.value)
                        setHasChanges(true)
                      }}
                      placeholder="Assunto do email"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{variavel}}"} para inserir valores dinâmicos
                    </p>
                  </div>

                  {/* Body Editor */}
                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <TemplateEditor
                      content={bodyHtml || template.channels.email?.body_html || ""}
                      onChange={(html) => {
                        setBodyHtml(html)
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">
                        Editor de WhatsApp em desenvolvimento
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <VariablePicker
                variables={template.variables}
                onInsert={handleInsertVariable}
              />

              {/* Settings */}
              {Object.keys(template.settings).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Configurações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {Object.entries(template.settings).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Preview Dialog */}
      <EmailPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        preview={previewData}
      />
    </div>
  )
}
