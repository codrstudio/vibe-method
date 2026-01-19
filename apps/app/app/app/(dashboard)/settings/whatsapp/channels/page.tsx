"use client"

/**
 * WhatsApp Channels List Page
 *
 * Lista todos os numeros WhatsApp registrados.
 */

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Phone, Plus, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { ChannelCard } from "@/components/whatsapp"
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

async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch("/api/whatsapp/channels")
  if (!res.ok) throw new Error("Failed to fetch channels")
  const data = await res.json()
  // Handle both response formats:
  // - Backend returns { data: [...] } (array directly)
  // - Expected format is { data: { channels: [...] } }
  if (data.data && Array.isArray(data.data)) {
    return data.data
  }
  return data.data?.channels ?? []
}

async function deleteChannel(channelId: string): Promise<void> {
  const res = await fetch(`/api/whatsapp/channels/${channelId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete channel")
}

async function refreshQrCode(channelId: string): Promise<void> {
  const res = await fetch("/api/whatsapp/channels/qr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId }),
  })
  if (!res.ok) throw new Error("Failed to refresh QR code")
}

type StatusFilter = "all" | ChannelStatus

export default function WhatsAppChannelsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["whatsapp-channels"],
    queryFn: fetchChannels,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-channels"] })
    },
  })

  const refreshMutation = useMutation({
    mutationFn: refreshQrCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-channels"] })
    },
  })

  // Filter channels
  const filteredChannels = channels.filter((channel) => {
    const matchesSearch =
      channel.name.toLowerCase().includes(search.toLowerCase()) ||
      channel.phoneNumber?.includes(search) ||
      channel.description?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || channel.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: channels.length,
    connected: channels.filter((c) => c.status === "connected").length,
    degraded: channels.filter((c) => c.status === "degraded").length,
    disconnected: channels.filter((c) => c.status === "disconnected").length,
    qr_pending: channels.filter((c) => c.status === "qr_pending").length,
    connecting: channels.filter((c) => c.status === "connecting").length,
  }

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar
        items={[
          { label: "Início", href: "/app" },
          { label: "Configurações", href: "/app/settings" },
          { label: "WhatsApp", href: "/app/settings/whatsapp" },
        ]}
        currentPage="Números"
      />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Title */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Números WhatsApp
              </h1>
              <p className="text-sm text-muted-foreground">
                {channels.length} número(s) registrado(s)
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

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar números..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {(
                ["all", "connected", "degraded", "disconnected", "qr_pending"] as StatusFilter[]
              ).map((status) => (
                <Badge
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" && "Todos"}
                  {status === "connected" && "Conectados"}
                  {status === "degraded" && "Degradados"}
                  {status === "disconnected" && "Desconectados"}
                  {status === "qr_pending" && "Aguardando QR"}
                  {" "}
                  ({statusCounts[status]})
                </Badge>
              ))}
            </div>
          </div>

          {/* Channels Grid */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-5 w-32 rounded bg-muted" />
                      <div className="h-4 w-48 rounded bg-muted" />
                      <div className="h-8 rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredChannels.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  id={channel.id}
                  name={channel.name}
                  description={channel.description}
                  status={channel.status}
                  phoneNumber={channel.phoneNumber}
                  assignmentsCount={channel.assignments?.length ?? 0}
                  createdAt={channel.createdAt}
                  onRefreshQr={() => refreshMutation.mutate(channel.id)}
                  onDelete={() => {
                    if (confirm(`Excluir "${channel.name}"? Esta ação não pode ser desfeita.`)) {
                      deleteMutation.mutate(channel.id)
                    }
                  }}
                  isLoading={deleteMutation.isPending || refreshMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Phone className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  {search || statusFilter !== "all"
                    ? "Nenhum número encontrado"
                    : "Nenhum número registrado"}
                </h3>
                <p className="text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? "Tente ajustar os filtros"
                    : "Registre seu primeiro número WhatsApp"}
                </p>
                {!search && statusFilter === "all" && (
                  <Button asChild className="mt-4">
                    <Link href="/app/settings/whatsapp/channels/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Número
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
