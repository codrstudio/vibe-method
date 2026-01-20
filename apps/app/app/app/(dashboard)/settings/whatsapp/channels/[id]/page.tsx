"use client"

/**
 * WhatsApp Channel Detail Page
 *
 * Pagina de detalhes de um numero WhatsApp, incluindo QR code e atribuicoes.
 * Updated: 2026-01-20 - Added conditional UI for simulator provider
 */

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import {
  ConnectionStatus,
  QrCodeViewer,
  AssignDialog,
  TestMessageForm,
  SimulatorConnectionPanel,
} from "@/components/whatsapp"
import { useWhatsAppChannel } from "@/hooks/use-whatsapp-channel"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Phone,
  Link as LinkIcon,
  History,
  RefreshCw,
  Loader2,
  FlaskConical,
  Smartphone,
} from "lucide-react"
import type { ChannelStatus } from "@/hooks/use-whatsapp-channel"

interface Channel {
  id: string
  name: string
  description: string | null
  instanceName: string
  instanceId: string | null
  phoneNumber: string | null
  status: ChannelStatus
  statusReason: string | null
  qrCode: string | null
  qrCodeExpiresAt: string | null
  retryCount: number
  provider: "evolution" | "simulator"
  createdAt: string
  updatedAt: string
}

interface Assignment {
  id: string
  channelId: string
  operationId: string
  userId: string | null
  priority: number
  isActive: boolean
  notificationEmail: string | null
  notificationPhone: string | null
  createdAt: string
  operation?: {
    id: string
    slug: string
    name: string
    nature: "system" | "user"
  }
}

interface Operation {
  id: string
  slug: string
  name: string
  nature: "system" | "user"
}

interface ChannelEvent {
  id: string
  eventType: string
  payload: Record<string, unknown>
  createdAt: string
}

async function fetchChannel(id: string): Promise<Channel & { assignments: Assignment[] }> {
  const res = await fetch(`/api/whatsapp/channels/${id}`)
  if (!res.ok) throw new Error("Failed to fetch channel")
  const data = await res.json()
  return data.data
}

async function fetchOperations(): Promise<Operation[]> {
  const res = await fetch("/api/whatsapp/operations")
  if (!res.ok) throw new Error("Failed to fetch operations")
  const data = await res.json()
  return data.data?.operations ?? []
}

async function fetchEvents(channelId: string): Promise<ChannelEvent[]> {
  const res = await fetch(`/api/whatsapp/channels/${channelId}/events`)
  if (!res.ok) throw new Error("Failed to fetch events")
  const data = await res.json()
  return data.data?.events ?? []
}

async function refreshQrCode(channelId: string): Promise<void> {
  const res = await fetch("/api/whatsapp/channels/qr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId }),
  })
  if (!res.ok) throw new Error("Failed to refresh QR code")
}

async function createAssignment(data: {
  channelId: string
  operationId: string
  userId?: string
  priority: number
  notificationEmail?: string
  notificationPhone?: string
}): Promise<Assignment> {
  const res = await fetch("/api/whatsapp/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create assignment")
  const result = await res.json()
  return result.data.assignment
}

async function deleteAssignment(assignmentId: string): Promise<void> {
  const res = await fetch(`/api/whatsapp/assignments/${assignmentId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete assignment")
}

async function sendTestMessage(
  channelId: string,
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const res = await fetch("/api/whatsapp/test-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId, to, text }),
  })
  const data = await res.json()
  if (!res.ok) {
    return { success: false, error: data.error || "Failed to send message" }
  }
  return { success: true, messageId: data.data?.messageId }
}

export default function WhatsAppChannelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const channelId = params.id as string

  const [showAssignDialog, setShowAssignDialog] = useState(false)

  // Fetch channel data
  const { data: channelData, isLoading } = useQuery({
    queryKey: ["whatsapp-channel", channelId],
    queryFn: () => fetchChannel(channelId),
    refetchInterval: 10000, // Refresh every 10s
  })

  // Fetch operations for assignment dialog
  const { data: operations = [] } = useQuery({
    queryKey: ["whatsapp-operations"],
    queryFn: fetchOperations,
  })

  // Fetch events
  const { data: events = [] } = useQuery({
    queryKey: ["whatsapp-channel-events", channelId],
    queryFn: () => fetchEvents(channelId),
    refetchInterval: 30000,
  })

  // Real-time updates
  const { state: realtimeState } = useWhatsAppChannel({
    channelId,
    initialStatus: channelData?.status,
    initialQrCode: channelData?.qrCode,
  })

  // Mutations
  const refreshMutation = useMutation({
    mutationFn: () => refreshQrCode(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-channel", channelId] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-channel", channelId] })
    },
  })

  const unassignMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-channel", channelId] })
    },
  })

  // Merge server data with realtime state
  const channel = channelData
    ? {
        ...channelData,
        status: realtimeState.status,
        qrCode: realtimeState.qrCode ?? channelData.qrCode,
        qrCodeExpiresAt: realtimeState.qrCodeExpiresAt ?? channelData.qrCodeExpiresAt,
        phoneNumber: realtimeState.phoneNumber ?? channelData.phoneNumber,
        provider: channelData.provider || "evolution", // Default to evolution for backwards compatibility
      }
    : null

  const isConnected = channel?.status === "connected"
  const isSimulator = channel?.provider === "simulator"

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Canal não encontrado</p>
        <Button asChild variant="outline">
          <Link href="/app/settings/whatsapp/channels">Voltar</Link>
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
          { label: "WhatsApp", href: "/app/settings/whatsapp" },
          { label: "Números", href: "/app/settings/whatsapp/channels" },
        ]}
        currentPage={channel.name}
      />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Back & Title */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <Link
                href="/app/settings/whatsapp/channels"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                  {channel.name}
                </h1>
                {isSimulator ? (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 gap-1">
                    <FlaskConical className="h-3 w-3" />
                    Simulador
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 gap-1">
                    <Smartphone className="h-3 w-3" />
                    Evolution
                  </Badge>
                )}
              </div>
              {channel.description && (
                <p className="text-sm text-muted-foreground">{channel.description}</p>
              )}
            </div>
            <ConnectionStatus
              status={channel.status}
              retryCount={realtimeState.retryCount}
              maxRetries={realtimeState.maxRetries}
            />
          </div>

          <Separator />

          {/* Info Row */}
          <div className="flex flex-wrap gap-4 text-sm">
            {channel.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{channel.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span>{channel.assignments?.length ?? 0} atribuição(ões)</span>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue={isConnected ? "assignments" : "connect"}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="connect">Conexão</TabsTrigger>
              <TabsTrigger value="assignments">Atribuições</TabsTrigger>
              <TabsTrigger value="test" disabled={!isConnected}>
                Teste
              </TabsTrigger>
              <TabsTrigger value="events">Histórico</TabsTrigger>
            </TabsList>

            {/* Connection Tab */}
            <TabsContent value="connect" className="space-y-4">
              {isSimulator ? (
                <SimulatorConnectionPanel
                  channelId={channel.id}
                  instanceName={channel.instanceName}
                  status={channel.status}
                  phoneNumber={channel.phoneNumber}
                  onStatusChange={() => {
                    queryClient.invalidateQueries({ queryKey: ["whatsapp-channel", channelId] })
                  }}
                />
              ) : isConnected ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Conectado</CardTitle>
                    <CardDescription>
                      Este número está conectado e pronto para uso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Número: {channel.phoneNumber || "N/A"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => refreshMutation.mutate()}
                      disabled={refreshMutation.isPending}
                    >
                      {refreshMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Reconectar (Gerar novo QR)
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex justify-center">
                  <QrCodeViewer
                    qrCode={channel.qrCode}
                    expiresAt={channel.qrCodeExpiresAt}
                    onRefresh={() => refreshMutation.mutate()}
                    isRefreshing={refreshMutation.isPending}
                  />
                </div>
              )}

              {channel.statusReason && (
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                  <CardContent className="p-4">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      {channel.statusReason}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Atribuições de Operação</h3>
                <Button onClick={() => setShowAssignDialog(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Atribuir
                </Button>
              </div>

              {channel.assignments && channel.assignments.length > 0 ? (
                <div className="space-y-2">
                  {channel.assignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">
                            {assignment.operation?.name || "Operação"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.operation?.slug} | Prioridade:{" "}
                            {assignment.priority}
                          </p>
                          {(assignment.notificationEmail ||
                            assignment.notificationPhone) && (
                            <p className="text-xs text-muted-foreground">
                              Alertas:{" "}
                              {[
                                assignment.notificationEmail,
                                assignment.notificationPhone,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={assignment.isActive ? "default" : "secondary"}>
                            {assignment.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Remover esta atribuição?")) {
                                unassignMutation.mutate(assignment.id)
                              }
                            }}
                            disabled={unassignMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <LinkIcon className="mx-auto mb-2 h-8 w-8" />
                    <p>Nenhuma atribuição configurada</p>
                    <p className="text-sm">
                      Atribua este número a uma operação para começar a usar
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Test Tab */}
            <TabsContent value="test">
              <TestMessageForm
                channelId={channel.id}
                channelName={channel.name}
                onSend={(to, text) => sendTestMessage(channel.id, to, text)}
              />
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Histórico de Eventos</h3>
              </div>

              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{event.eventType}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <History className="mx-auto mb-2 h-8 w-8" />
                    <p>Nenhum evento registrado</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Assign Dialog */}
      <AssignDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        channelId={channel.id}
        channelName={channel.name}
        operations={operations}
        onAssign={async (data) => {
          await assignMutation.mutateAsync({
            channelId: channel.id,
            ...data,
          })
        }}
      />
    </div>
  )
}
