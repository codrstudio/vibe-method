"use client"

/**
 * New WhatsApp Channel Page
 *
 * Pagina para registrar um novo numero WhatsApp.
 * Updated: 2026-01-20 - Added provider selector (Evolution/Simulator)
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BreadcrumbBar } from "@/components/breadcrumb-bar"
import { Loader2, Phone, ArrowLeft, Smartphone, FlaskConical } from "lucide-react"
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
  provider: "evolution" | "simulator"
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
  const response = await res.json()
  console.log("[CreateChannel] Raw API response:", JSON.stringify(response))
  // Handle both response formats:
  // - Backend returns { data: { id, ... } } (channel directly in data)
  // - Expected format is { data: { channel: { id, ... } } }
  if (response.data && response.data.id && !response.data.channel) {
    console.log("[CreateChannel] Transforming response to expected format")
    return { data: { channel: response.data } }
  }
  console.log("[CreateChannel] Returning response as-is")
  return response
}

export default function NewWhatsAppChannelPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [provider, setProvider] = useState<"evolution" | "simulator">("evolution")

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
      provider,
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

                {/* Provider */}
                <div className="space-y-3">
                  <Label>Tipo de Conexão</Label>
                  <RadioGroup
                    value={provider}
                    onValueChange={(value) => setProvider(value as "evolution" | "simulator")}
                    disabled={mutation.isPending}
                    className="grid gap-3"
                  >
                    <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="evolution" id="evolution" className="mt-1" />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="evolution" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Smartphone className="h-4 w-4" />
                          Evolution API (número real)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Conecte um número WhatsApp real para atendimento em produção.
                          Requer escaneamento de QR code.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="simulator" id="simulator" className="mt-1" />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="simulator" className="flex items-center gap-2 cursor-pointer font-medium">
                          <FlaskConical className="h-4 w-4" />
                          Simulador (ambiente de teste)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Use o simulador para testar fluxos sem um número real.
                          Ideal para desenvolvimento e homologação.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
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
                    Criar
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
              {provider === "evolution" ? (
                <>
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
                </>
              ) : (
                <>
                  <p>
                    1. Após criar o canal, você verá um painel de controle do simulador.
                  </p>
                  <p>
                    2. Clique em &quot;Conectar Simulador&quot; para ativar a instância.
                  </p>
                  <p>
                    3. Use o botão &quot;Abrir Simulador&quot; para acessar a interface de teste.
                  </p>
                  <p>
                    4. Na interface do simulador, você pode enviar e receber mensagens
                    como se fosse um usuário real do WhatsApp.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
