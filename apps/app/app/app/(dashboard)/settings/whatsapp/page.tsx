"use client"

/**
 * WhatsApp Dashboard Page
 *
 * Visao geral dos canais WhatsApp registrados e operacoes.
 */

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Phone,
  Plus,
  Radio,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { ChannelCard } from "@/components/whatsapp"
import { useWhatsAppAlerts } from "@/hooks/use-whatsapp-channel"
import type { ChannelStatus } from "@/hooks/use-whatsapp-channel"

interface Channel {
  id: string
  name: string
  description: string | null
  instanceName: string
  phoneNumber: string | null
  status: ChannelStatus
  createdAt: string
  assignments?: unknown[]
}

interface Operation {
  id: string
  slug: string
  name: string
  nature: "system" | "user"
}

async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch("/api/whatsapp/channels")
  if (!res.ok) throw new Error("Failed to fetch channels")
  const data = await res.json()
  return data.data?.channels ?? []
}

async function fetchOperations(): Promise<Operation[]> {
  const res = await fetch("/api/whatsapp/operations")
  if (!res.ok) throw new Error("Failed to fetch operations")
  const data = await res.json()
  return data.data?.operations ?? []
}

export default function WhatsAppDashboardPage() {
  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["whatsapp-channels"],
    queryFn: fetchChannels,
  })

  const { data: operations = [], isLoading: operationsLoading } = useQuery({
    queryKey: ["whatsapp-operations"],
    queryFn: fetchOperations,
  })

  const { alerts } = useWhatsAppAlerts()

  // Stats
  const connectedCount = channels.filter((c) => c.status === "connected").length
  const degradedCount = channels.filter((c) => c.status === "degraded").length
  const disconnectedCount = channels.filter(
    (c) => c.status === "disconnected" || c.status === "qr_pending"
  ).length

  const isLoading = channelsLoading || operationsLoading

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[
          { label: "Início", href: "/app" },
          { label: "Configurações", href: "/app/settings" },
        ]}
        currentPage="WhatsApp"
      />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Title */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                WhatsApp
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie numeros e canais de operacao WhatsApp
              </p>
            </div>
            <Button asChild>
              <Link href="/app/settings/whatsapp/channels/new">
                <Plus className="mr-2 h-4 w-4" />
                Novo Canal
              </Link>
            </Button>
          </div>

          <Separator />

          {/* Alerts Banner */}
          {alerts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
              <CardContent className="flex items-center gap-4 p-4">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    {alerts.length} alerta(s) recente(s)
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    {alerts[alerts.length - 1]?.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Conectados
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connectedCount}</div>
                <p className="text-xs text-muted-foreground">
                  numeros operacionais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Com Problemas
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{degradedCount}</div>
                <p className="text-xs text-muted-foreground">
                  tentando reconectar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Desconectados
                </CardTitle>
                <Radio className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{disconnectedCount}</div>
                <p className="text-xs text-muted-foreground">
                  requerem QR code
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Channels Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Numeros Registrados</h2>
              <Link
                href="/app/settings/whatsapp/channels"
                className="text-sm text-muted-foreground hover:underline"
              >
                Ver todos
                <ChevronRight className="inline h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 w-32 rounded bg-muted" />
                      <div className="h-4 w-48 rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : channels.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {channels.slice(0, 6).map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    id={channel.id}
                    name={channel.name}
                    description={channel.description}
                    status={channel.status}
                    phoneNumber={channel.phoneNumber}
                    assignmentsCount={channel.assignments?.length ?? 0}
                    createdAt={channel.createdAt}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Phone className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Nenhum numero registrado
                  </h3>
                  <p className="text-muted-foreground">
                    Registre seu primeiro numero WhatsApp
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/app/settings/whatsapp/channels/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Numero
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Operations Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Canais de Operacao</h2>
              <Link
                href="/app/settings/whatsapp/operations"
                className="text-sm text-muted-foreground hover:underline"
              >
                Ver todos
                <ChevronRight className="inline h-4 w-4" />
              </Link>
            </div>

            {operationsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-5 w-32 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : operations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {operations.slice(0, 4).map((operation) => (
                  <Link
                    key={operation.id}
                    href={`/app/settings/whatsapp/operations/${operation.slug}`}
                  >
                    <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{operation.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {operation.slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {operation.nature === "system" ? "Sistema" : "Usuario"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Nenhuma operacao configurada. Operacoes sao definidas via
                  artefatos do projeto.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
