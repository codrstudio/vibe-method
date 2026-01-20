"use client"

/**
 * WhatsApp Operation Detail Page
 *
 * Pagina de detalhes de uma operacao WhatsApp, permitindo atribuir canais.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Phone,
  Link as LinkIcon,
  Server,
  Users,
  Loader2,
  Radio,
} from "lucide-react"

interface Channel {
  id: string
  name: string
  description: string | null
  instanceName: string
  phoneNumber: string | null
  status: string
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
}

interface ChannelWithAssignment {
  channel: Channel
  assignment: Assignment
}

interface Operation {
  id: string
  slug: string
  name: string
  description: string | null
  nature: "system" | "user"
  eventInterests: string[]
  createdAt: string
  channels: ChannelWithAssignment[]
}

async function fetchOperation(slug: string): Promise<Operation> {
  const res = await fetch(`/api/whatsapp/operations/${slug}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error("Operation not found")
    throw new Error("Failed to fetch operation")
  }
  const data = await res.json()
  return data.data
}

async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch("/api/whatsapp/channels")
  if (!res.ok) throw new Error("Failed to fetch channels")
  const data = await res.json()
  return data.data?.channels ?? []
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
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create assignment")
  }
  const result = await res.json()
  return result.data.assignment
}

async function deleteAssignment(assignmentId: string): Promise<void> {
  const res = await fetch(`/api/whatsapp/assignments/${assignmentId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete assignment")
}

export default function WhatsAppOperationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const slug = params.slug as string

  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedChannelId, setSelectedChannelId] = useState<string>("")
  const [priority, setPriority] = useState("0")
  const [notificationEmail, setNotificationEmail] = useState("")
  const [notificationPhone, setNotificationPhone] = useState("")

  // Fetch operation data
  const {
    data: operation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["whatsapp-operation", slug],
    queryFn: () => fetchOperation(slug),
    retry: false,
  })

  // Fetch all channels for assignment
  const { data: allChannels = [] } = useQuery({
    queryKey: ["whatsapp-channels"],
    queryFn: fetchChannels,
  })

  // Filter out already assigned channels
  const availableChannels = allChannels.filter(
    (channel) =>
      !operation?.channels.some((c) => c.channel.id === channel.id)
  )

  // Mutations
  const assignMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-operation", slug] })
      setShowAssignDialog(false)
      resetForm()
    },
  })

  const unassignMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-operation", slug] })
    },
  })

  function resetForm() {
    setSelectedChannelId("")
    setPriority("0")
    setNotificationEmail("")
    setNotificationPhone("")
  }

  function handleAssign() {
    if (!operation || !selectedChannelId) return

    assignMutation.mutate({
      channelId: selectedChannelId,
      operationId: operation.id,
      priority: parseInt(priority, 10),
      notificationEmail: notificationEmail || undefined,
      notificationPhone: notificationPhone || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !operation) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Radio className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          {error?.message || "Operacao nao encontrada"}
        </p>
        <Button asChild variant="outline">
          <Link href="/app/settings/whatsapp/operations">Voltar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[
          { label: "Inicio", href: "/app" },
          { label: "Configuracoes", href: "/app/settings" },
          { label: "WhatsApp", href: "/app/settings/whatsapp" },
          { label: "Operacoes", href: "/app/settings/whatsapp/operations" },
        ]}
        currentPage={operation.name}
      />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Back & Title */}
          <div className="space-y-1">
            <Link
              href="/app/settings/whatsapp/operations"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                  {operation.name}
                </h1>
                {operation.description && (
                  <p className="text-sm text-muted-foreground">
                    {operation.description}
                  </p>
                )}
              </div>
              <Badge variant={operation.nature === "system" ? "default" : "secondary"}>
                {operation.nature === "system" ? (
                  <Server className="mr-1 h-3 w-3" />
                ) : (
                  <Users className="mr-1 h-3 w-3" />
                )}
                {operation.nature === "system" ? "Sistema" : "Por usuario"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Info Row */}
          <div className="flex flex-wrap gap-4 text-sm">
            <Badge variant="outline">{operation.slug}</Badge>
            {operation.eventInterests.length > 0 && (
              <Badge variant="outline">
                {operation.eventInterests.length} evento(s)
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{operation.channels.length} canal(is) atribuido(s)</span>
            </div>
          </div>

          {/* Assigned Channels */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Canais Atribuidos</CardTitle>
                  <CardDescription>
                    Numeros de WhatsApp que servem esta operacao
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAssignDialog(true)}
                  size="sm"
                  disabled={availableChannels.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Atribuir Canal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {operation.channels.length > 0 ? (
                <div className="space-y-3">
                  {operation.channels.map(({ channel, assignment }) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{channel.name}</p>
                          <Badge
                            variant={
                              channel.status === "connected"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {channel.status === "connected"
                              ? "Conectado"
                              : channel.status}
                          </Badge>
                        </div>
                        {channel.phoneNumber && (
                          <p className="text-sm text-muted-foreground">
                            {channel.phoneNumber}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Prioridade: {assignment.priority}
                          {(assignment.notificationEmail ||
                            assignment.notificationPhone) && (
                            <>
                              {" | "}
                              Alertas:{" "}
                              {[
                                assignment.notificationEmail,
                                assignment.notificationPhone,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={assignment.isActive ? "default" : "outline"}
                        >
                          {assignment.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Remover esta atribuicao?")) {
                              unassignMutation.mutate(assignment.id)
                            }
                          }}
                          disabled={unassignMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <LinkIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhum canal atribuido
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Atribua um numero de WhatsApp para esta operacao comecar a
                    funcionar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* No Channels Available Warning */}
          {availableChannels.length === 0 && allChannels.length === 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
              <CardContent className="p-4">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Nenhum canal WhatsApp cadastrado.{" "}
                  <Link
                    href="/app/settings/whatsapp/channels/new"
                    className="underline"
                  >
                    Cadastre um canal
                  </Link>{" "}
                  antes de atribuir a esta operacao.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Event Interests */}
          {operation.eventInterests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Eventos de Interesse</CardTitle>
                <CardDescription>
                  Eventos que esta operacao processa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {operation.eventInterests.map((event) => (
                    <Badge key={event} variant="outline">
                      {event}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sobre esta operacao</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              {operation.nature === "system" ? (
                <>
                  <p>
                    Esta e uma <strong>operacao de sistema</strong>. Um unico
                    numero de WhatsApp atribuido serve todos os usuarios do
                    sistema.
                  </p>
                  <p>
                    Exemplo: um numero de recepcao que todos os candidatos usam
                    para iniciar contato.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Esta e uma <strong>operacao por usuario</strong>. Cada
                    usuario pode ter seu proprio numero atribuido.
                  </p>
                  <p>
                    Exemplo: cada recrutador usa seu proprio numero para
                    comunicacao com candidatos.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Canal</DialogTitle>
            <DialogDescription>
              Selecione um canal WhatsApp para atribuir a operacao{" "}
              <strong>{operation.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel">Canal WhatsApp</Label>
              <Select
                value={selectedChannelId}
                onValueChange={setSelectedChannelId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                      {channel.phoneNumber && ` (${channel.phoneNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Menor numero = maior prioridade
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email para alertas (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="alerts@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone para alertas (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={notificationPhone}
                onChange={(e) => setNotificationPhone(e.target.value)}
                placeholder="+5511999999999"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedChannelId || assignMutation.isPending}
            >
              {assignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
