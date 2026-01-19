"use client"

/**
 * WhatsApp Operations List Page
 *
 * Lista todas as operacoes (canais) de WhatsApp configuradas no sistema.
 */

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { ChevronRight, Radio, Users, Server } from "lucide-react"

interface Operation {
  id: string
  slug: string
  name: string
  description: string | null
  nature: "system" | "user"
  eventInterests: string[]
  createdAt: string
}

async function fetchOperations(): Promise<Operation[]> {
  const res = await fetch("/api/whatsapp/operations")
  if (!res.ok) throw new Error("Failed to fetch operations")
  const data = await res.json()
  return data.data?.operations ?? []
}

export default function WhatsAppOperationsPage() {
  const { data: operations = [], isLoading } = useQuery({
    queryKey: ["whatsapp-operations"],
    queryFn: fetchOperations,
  })

  const systemOperations = operations.filter((o) => o.nature === "system")
  const userOperations = operations.filter((o) => o.nature === "user")

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[
          { label: "Início", href: "/app" },
          { label: "Configurações", href: "/app/settings" },
          { label: "WhatsApp", href: "/app/settings/whatsapp" },
        ]}
        currentPage="Operações"
      />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Operações WhatsApp
            </h1>
            <p className="text-sm text-muted-foreground">
              Operações são definidas via artefatos do projeto e representam
              pontos de uso do WhatsApp pelo sistema
            </p>
          </div>

          <Separator />

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-5 w-32 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* System Operations */}
          {!isLoading && systemOperations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Operações de Sistema</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Compartilhadas entre todos os usuários. Um número atribuído
                serve toda a operação.
              </p>

              <div className="grid gap-4">
                {systemOperations.map((operation) => (
                  <Link
                    key={operation.id}
                    href={`/app/settings/whatsapp/operations/${operation.slug}`}
                  >
                    <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {operation.name}
                            </CardTitle>
                            {operation.description && (
                              <CardDescription>
                                {operation.description}
                              </CardDescription>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{operation.slug}</Badge>
                          {operation.eventInterests.length > 0 && (
                            <Badge variant="outline">
                              {operation.eventInterests.length} evento(s)
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* User Operations */}
          {!isLoading && userOperations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Operações por Usuário</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Cada usuário pode ter seu próprio número atribuído.
              </p>

              <div className="grid gap-4">
                {userOperations.map((operation) => (
                  <Link
                    key={operation.id}
                    href={`/app/settings/whatsapp/operations/${operation.slug}`}
                  >
                    <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {operation.name}
                            </CardTitle>
                            {operation.description && (
                              <CardDescription>
                                {operation.description}
                              </CardDescription>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{operation.slug}</Badge>
                          <Badge variant="outline">Por usuário</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && operations.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Radio className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Nenhuma operação configurada
                </h3>
                <p className="max-w-sm text-center text-muted-foreground">
                  Operações são definidas via seeds do banco de dados. Configure
                  operações em <code>database/main/seeds/</code> do seu projeto.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">O que são operações?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Operações</strong> representam pontos de uso do WhatsApp
                pelo sistema. Exemplos:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>
                  <code>recruitment-gatekeeper</code> - Recepção de candidatos
                </li>
                <li>
                  <code>recruitment-worker</code> - Comunicação com candidatos
                  por recrutador
                </li>
                <li>
                  <code>support-bot</code> - Atendimento automatizado
                </li>
              </ul>
              <p>
                Atribuindo um número a uma operação, o sistema sabe qual número
                usar para cada caso de uso.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
