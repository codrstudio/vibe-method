"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Mail,
  MessageSquare,
  Bell,
  Shield,
  ChevronRight,
  Settings2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"

interface MessageTemplate {
  id: string
  name: string
  description: string | null
  category: string
  channels: {
    email?: { enabled: boolean }
    whatsapp?: { enabled: boolean }
  }
  source: "default" | "custom"
}

const categoryIcons: Record<string, React.ElementType> = {
  auth: Shield,
  notification: Bell,
  alert: Bell,
  transactional: Mail,
}

const categoryLabels: Record<string, string> = {
  auth: "Autenticação",
  notification: "Notificações",
  alert: "Alertas",
  transactional: "Transacionais",
}

async function fetchTemplates(): Promise<MessageTemplate[]> {
  const res = await fetch("/api/messages/templates")
  if (!res.ok) throw new Error("Failed to fetch templates")
  const data = await res.json()
  return data.data
}

export default function MessagesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
  })

  const categories = templates
    ? [...new Set(templates.map((t) => t.category))]
    : []

  const filteredTemplates = selectedCategory
    ? templates?.filter((t) => t.category === selectedCategory)
    : templates

  const groupedTemplates = filteredTemplates?.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category].push(template)
      return acc
    },
    {} as Record<string, MessageTemplate[]>
  )

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[
          { label: "Início", href: "/app" },
          { label: "Configurações", href: "/app/settings" },
        ]}
        currentPage="Mensagens"
      />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Templates de Mensagens
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalize as mensagens enviadas pelo sistema
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {categories.map((category) => {
              const Icon = categoryIcons[category] || Settings2
              return (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer gap-1"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon className="h-3 w-3" />
                  {categoryLabels[category] || category}
                </Badge>
              )
            })}
          </div>

          <Separator />

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 w-32 rounded bg-muted" />
                    <div className="h-4 w-48 rounded bg-muted" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Templates Grid */}
          {groupedTemplates &&
            Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category] || category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryTemplates.map((template) => (
                    <Link
                      key={template.id}
                      href={`/app/settings/messages/${template.id}`}
                    >
                      <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base">
                                {template.name}
                              </CardTitle>
                              {template.description && (
                                <CardDescription className="text-sm">
                                  {template.description}
                                </CardDescription>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2">
                            {template.channels.email?.enabled && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Mail className="h-3 w-3" />
                                Email
                              </Badge>
                            )}
                            {template.channels.whatsapp?.enabled && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <MessageSquare className="h-3 w-3" />
                                WhatsApp
                              </Badge>
                            )}
                            {template.source === "custom" && (
                              <Badge variant="outline" className="text-xs">
                                Personalizado
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

          {/* Empty State */}
          {!isLoading && (!templates || templates.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nenhum template encontrado
                </h3>
                <p className="text-muted-foreground">
                  Execute as migrations para criar os templates padrão
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
