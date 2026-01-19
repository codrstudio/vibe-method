"use client"

/**
 * New WhatsApp Channel Page
 *
 * Pagina para registrar um novo numero WhatsApp.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { Loader2, Phone, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CreateChannelResponse {
  data: {
    channel: {
      id: string
      name: string
      instanceName: string
      status: string
    }
  }
}

async function createChannel(data: {
  name: string
  description?: string
}): Promise<CreateChannelResponse> {
  const res = await fetch("/api/whatsapp/channels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create channel")
  }
  return res.json()
}

export default function NewWhatsAppChannelPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const mutation = useMutation({
    mutationFn: createChannel,
    onSuccess: (data) => {
      router.push(`/app/settings/whatsapp/channels/${data.data.channel.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    mutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    })
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
        currentPage="Novo"
      />

      {/* Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Back Link */}
          <Link
            href="/app/settings/whatsapp/channels"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
          </Link>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Registrar Novo Canal
              </CardTitle>
              <CardDescription>
                Crie uma nova instância WhatsApp para conectar um número
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Canal</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Atendimento Principal"
                    disabled={mutation.isPending}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Um nome descritivo para identificar este número
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Número usado para atendimento ao cliente"
                    rows={3}
                    disabled={mutation.isPending}
                  />
                </div>

                {/* Error */}
                {mutation.isError && (
                  <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
                    <p className="font-medium">Erro ao criar canal</p>
                    <p className="text-sm">{mutation.error.message}</p>
                  </div>
                )}

                {/* Actions */}
                <Separator />

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={mutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={mutation.isPending || !name.trim()}>
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar e Conectar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                1. Após criar o canal, um QR code será exibido para você escanear
                com seu WhatsApp.
              </p>
              <p>
                2. Abra o WhatsApp no celular, vá em Configurações &gt; Aparelhos
                conectados &gt; Conectar aparelho.
              </p>
              <p>
                3. Escaneie o QR code para conectar o número a este sistema.
              </p>
              <p>
                4. Após conectado, você poderá atribuir este número a operações
                específicas.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
