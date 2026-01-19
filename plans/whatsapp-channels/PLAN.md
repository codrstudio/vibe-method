# PLAN: Módulo Channels - WhatsApp Integration

**Status: IMPLEMENTADO** - 2026-01-19

## Sprints Status

| Sprint | Descrição | Status |
|--------|-----------|--------|
| Sprint 1 | API Routes no Next.js (Bridge) | [x] Concluído |
| Sprint 2 | HTTP Routes no Backbone | [x] Concluído |
| Sprint 3 | Logging de Mensagens | [x] Concluído |
| Sprint 4 | Triggers (Recebimento) | [x] Concluído |
| Sprint 5 | Integração com Pulse | [x] Concluído |

---

## Contexto

O backbone já possui infraestrutura de WhatsApp em `apps/backbone/src/services/whatsapp/`:
- `evolution-client.ts` - Cliente HTTP para Evolution API
- `repository.ts` - Acesso ao banco (channels, operations, assignments, events)
- `webhook-handler.ts` - Processa eventos do Evolution
- `types.ts` - Schemas Zod

**Problema**: O frontend faz requests para `/api/whatsapp/channels` (Next.js), mas essas rotas não existem. O serviço do backbone existe, mas não está exposto via HTTP.

---

## Modelo Definido

```
┌──────────────────────┐         ┌──────────────────────┐
│      OPERATION       │   1:1   │        CANAL         │
│                      │◄───────►│                      │
│ - event_interests[]  │         │ - instance_name      │
│ - send_only?         │         │ - status             │
│ - configs de uso     │         │ - qr_code            │
└──────────────────────┘         └──────────────────────┘
```

**API Channels oferece:**
- `send(operationId, channelId, target, message)` → Envia mensagem
- `trigger` → Notifica ouvintes quando recebe mensagem

**Logging:**
- Conteúdo completo das mensagens
- Anexos: apenas metadados (tipo, tamanho) - não armazena binário
- Configurável para desativar

---

## Sprint 1: API Routes no Next.js (Bridge)

O frontend já está implementado e espera APIs em `/api/whatsapp/*`.
Criar rotas no Next.js que fazem proxy para o backbone.

### Arquivos a Criar

| Arquivo | Método | Propósito |
|---------|--------|-----------|
| `apps/app/app/api/whatsapp/channels/route.ts` | GET, POST | Listar e criar canais |
| `apps/app/app/api/whatsapp/channels/[id]/route.ts` | GET, DELETE | Detalhes e remover canal |
| `apps/app/app/api/whatsapp/channels/qr/route.ts` | POST | Refresh QR code |
| `apps/app/app/api/whatsapp/operations/route.ts` | GET | Listar operações |
| `apps/app/app/api/whatsapp/assignments/route.ts` | POST | Criar atribuição |
| `apps/app/app/api/whatsapp/assignments/[id]/route.ts` | DELETE | Remover atribuição |
| `apps/app/app/api/whatsapp/test-message/route.ts` | POST | Enviar mensagem teste |

### Padrão de Implementação

```typescript
// Exemplo: apps/app/app/api/whatsapp/channels/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'

const BACKBONE_URL = process.env.BACKBONE_INTERNAL_URL

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${BACKBONE_URL}/whatsapp/channels`, {
    headers: { 'x-user-id': session.user.id }
  })
  return NextResponse.json(await res.json())
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const res = await fetch(`${BACKBONE_URL}/whatsapp/channels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': session.user.id
    },
    body: JSON.stringify(body)
  })
  return NextResponse.json(await res.json())
}
```

---

## Sprint 2: HTTP Routes no Backbone

Expor o `whatsappService` via HTTP.

### Arquivo: `apps/backbone/src/routes/whatsapp.ts`

```typescript
// Rotas HTTP
GET  /backbone/whatsapp/channels              → listChannels()
POST /backbone/whatsapp/channels              → createChannel(name, description)
GET  /backbone/whatsapp/channels/:id          → getChannel(id)
DELETE /backbone/whatsapp/channels/:id        → deleteChannel(id)
POST /backbone/whatsapp/channels/:id/qr       → refreshQrCode(id)
POST /backbone/whatsapp/channels/:id/disconnect → disconnectChannel(id)

GET  /backbone/whatsapp/operations            → listOperations()
GET  /backbone/whatsapp/operations/:slug      → getOperationBySlug(slug)

POST /backbone/whatsapp/assignments           → assignChannel(channelId, operationId, ...)
DELETE /backbone/whatsapp/assignments/:id     → unassignChannel(id)

POST /backbone/whatsapp/send                  → sendMessage(operationId, channelId, target, message)
POST /backbone/whatsapp/test                  → sendTestMessage(channelId, to, text)
```

### Registrar em `apps/backbone/src/index.ts`

```typescript
import { whatsappRoutes } from './routes/whatsapp'
// ...
app.register(whatsappRoutes, { prefix: '/backbone/whatsapp' })
```

---

## Sprint 3: Logging de Mensagens

### Migration: `database/main/migrations/014_message_logs.sql`

```sql
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  operation_id UUID REFERENCES operations(id) ON DELETE SET NULL,
  direction VARCHAR(10) NOT NULL, -- 'inbound' | 'outbound'
  remote_jid VARCHAR(50) NOT NULL, -- número whatsapp
  message_id VARCHAR(100), -- ID da mensagem no WhatsApp
  message_type VARCHAR(20) NOT NULL, -- 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker'
  content TEXT, -- conteúdo textual (null se anexo)
  attachment_info JSONB, -- { type, mimetype, size, filename } para anexos
  status VARCHAR(20), -- 'sent' | 'delivered' | 'read' | 'failed'
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_logs_channel ON message_logs(channel_id);
CREATE INDEX idx_message_logs_created ON message_logs(created_at);
CREATE INDEX idx_message_logs_remote ON message_logs(remote_jid);

-- Configuração de logging
ALTER TABLE channels ADD COLUMN logging_enabled BOOLEAN DEFAULT true;
```

### Repository: `apps/backbone/src/services/whatsapp/message-logs-repository.ts`

```typescript
export const messageLogsRepository = {
  create(input: CreateMessageLogInput): Promise<MessageLog>
  findByChannel(channelId: string, limit?: number): Promise<MessageLog[]>
  findByRemote(remoteJid: string, limit?: number): Promise<MessageLog[]>
  updateStatus(messageId: string, status: string): Promise<void>
}
```

### Integrar no webhook-handler.ts

No handler de `MESSAGES_UPSERT`:
```typescript
// Se logging habilitado para o canal
if (channel.loggingEnabled) {
  await messageLogsRepository.create({
    channelId,
    operationId: assignment?.operationId,
    direction: 'inbound',
    remoteJid: message.key.remoteJid,
    messageId: message.key.id,
    messageType: detectMessageType(message),
    content: extractTextContent(message),
    attachmentInfo: extractAttachmentInfo(message), // { type, mimetype, size }
    metadata: { ... }
  })
}
```

No `sendMessage`:
```typescript
// Antes de enviar
const logEntry = await messageLogsRepository.create({
  channelId,
  operationId,
  direction: 'outbound',
  remoteJid: target,
  messageType: 'text',
  content: message,
  status: 'sent'
})

// Após enviar
await messageLogsRepository.updateStatus(logEntry.id, result.success ? 'sent' : 'failed')
```

---

## Sprint 4: Triggers (Recebimento)

O webhook-handler já processa `MESSAGES_UPSERT`. Precisamos:
1. Rotear para operações interessadas
2. Emitir via Socket para ouvintes

### Atualizar webhook-handler.ts

```typescript
async function handleMessageUpsert(channelId: string, data: any) {
  const channel = await channelsRepository.findById(channelId)
  if (!channel) return

  // 1. Log se habilitado
  if (channel.loggingEnabled) {
    await logMessage(channelId, 'inbound', data)
  }

  // 2. Buscar assignment (1:1 com operation)
  const assignment = await assignmentsRepository.findByChannel(channelId)
  if (!assignment?.length) return

  const operation = await operationsRepository.findById(assignment[0].operationId)
  if (!operation) return

  // 3. Verificar se operation tem interesse em MESSAGES_UPSERT
  if (!operation.eventInterests.includes('MESSAGES_UPSERT')) return

  // 4. Emitir trigger para ouvintes
  const triggerPayload = {
    channelId,
    operationId: operation.id,
    operationSlug: operation.slug,
    message: {
      id: data.key.id,
      from: data.key.remoteJid,
      type: detectMessageType(data),
      content: extractTextContent(data),
      timestamp: data.messageTimestamp
    }
  }

  // Emite para room específica do canal
  emitToRoom(`whatsapp:${channelId}`, 'whatsapp:message_received', triggerPayload)

  // Emite para room da operação (todos interessados nessa operação)
  emitToRoom(`operation:${operation.slug}`, 'whatsapp:trigger', triggerPayload)

  incCounter('whatsapp.triggers.emitted')
}
```

### Socket Events Adicionais

```typescript
// Client → Server (join room de operação)
'join:operation': (payload: { operationSlug: string }) => void
'leave:operation': (payload: { operationSlug: string }) => void

// Server → Client
'whatsapp:trigger': (payload: TriggerPayload) => void
```

---

## Sprint 5: Integração com Pulse

### Probes WhatsApp

#### Arquivo: `apps/backbone/src/pulse/probes/whatsapp.ts`

```typescript
import { evolutionClient } from '@/services/whatsapp/evolution-client'
import { channelsRepository } from '@/services/whatsapp/repository'

export async function whatsappShallowProbe(): Promise<ProbeResult> {
  // Verifica se Evolution está configurado
  const hasConfig = !!process.env.EVOLUTION_API_URL && !!process.env.EVOLUTION_API_KEY

  return {
    name: 'whatsapp',
    status: hasConfig ? 'healthy' : 'degraded',
    message: hasConfig ? 'Evolution API configured' : 'Evolution API not configured',
    details: {
      evolutionUrl: process.env.EVOLUTION_API_URL ? 'configured' : 'missing',
      apiKey: process.env.EVOLUTION_API_KEY ? 'configured' : 'missing'
    }
  }
}

export async function whatsappDeepProbe(): Promise<ProbeResult> {
  const start = Date.now()

  try {
    // 1. Verificar Evolution API disponível
    const healthy = await evolutionClient.healthCheck()
    if (!healthy) {
      return {
        name: 'whatsapp',
        status: 'unhealthy',
        message: 'Evolution API unreachable',
        latencyMs: Date.now() - start
      }
    }

    // 2. Contar canais por status
    const channels = await channelsRepository.findAll()
    const byStatus = channels.reduce((acc, ch) => {
      acc[ch.status] = (acc[ch.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 3. Determinar status geral
    const hasDisconnected = byStatus.disconnected > 0
    const hasDegraded = byStatus.degraded > 0

    return {
      name: 'whatsapp',
      status: hasDisconnected ? 'degraded' : (hasDegraded ? 'degraded' : 'healthy'),
      message: `${channels.length} channels (${byStatus.connected || 0} connected)`,
      latencyMs: Date.now() - start,
      details: {
        total: channels.length,
        byStatus,
        evolutionHealthy: true
      }
    }
  } catch (error) {
    return {
      name: 'whatsapp',
      status: 'unhealthy',
      message: error.message,
      latencyMs: Date.now() - start
    }
  }
}
```

### Métricas WhatsApp

Já existem algumas, adicionar:

```typescript
// Em evolution-client.ts
incCounter('whatsapp.evolution.requests', { method, endpoint })
incCounter('whatsapp.evolution.errors', { method, endpoint, status })

// Em webhook-handler.ts
incCounter('whatsapp.webhooks.received', { event })
incCounter('whatsapp.messages.inbound')
incCounter('whatsapp.triggers.emitted')

// Em service.ts (send)
incCounter('whatsapp.messages.outbound')
incCounter('whatsapp.messages.outbound.success')
incCounter('whatsapp.messages.outbound.errors')
observeHistogram('whatsapp.send.latency', durationMs)

// Em message-logs-repository.ts
incCounter('whatsapp.logs.created', { direction })
```

### Registrar Probes

```typescript
// apps/backbone/src/pulse/probes/index.ts
import { whatsappShallowProbe, whatsappDeepProbe } from './whatsapp'

export const shallowProbes = {
  // ... existentes
  whatsapp: whatsappShallowProbe,
}

export const deepProbes = {
  // ... existentes
  whatsapp: whatsappDeepProbe,
}
```

---

## Verificação

### 1. API Routes (Next.js)
```bash
# Deve retornar lista de canais (pode ser vazia)
curl http://localhost:8000/api/whatsapp/channels
```

### 2. Backbone Routes
```bash
# Deve retornar lista de canais
curl http://localhost:8002/backbone/whatsapp/channels

# Deve retornar operações
curl http://localhost:8002/backbone/whatsapp/operations
```

### 3. Criar Canal
```bash
curl -X POST http://localhost:8002/backbone/whatsapp/channels \
  -H "Content-Type: application/json" \
  -d '{"name": "Canal Teste", "description": "Teste"}'
```

### 4. Pulse Probes
```bash
# Deve incluir whatsapp probe
curl http://localhost:8002/backbone/pulse/probes
curl http://localhost:8002/backbone/pulse/probes/deep
```

### 5. Teste E2E com Playwright
Executar `.tmp/playwright/test-whatsapp-channel.mjs` após implementação.

---

## Arquivos Modificados/Criados

### Criar
- `apps/app/app/api/whatsapp/channels/route.ts`
- `apps/app/app/api/whatsapp/channels/[id]/route.ts`
- `apps/app/app/api/whatsapp/channels/qr/route.ts`
- `apps/app/app/api/whatsapp/operations/route.ts`
- `apps/app/app/api/whatsapp/assignments/route.ts`
- `apps/app/app/api/whatsapp/assignments/[id]/route.ts`
- `apps/app/app/api/whatsapp/test-message/route.ts`
- `apps/backbone/src/routes/whatsapp.ts`
- `apps/backbone/src/pulse/probes/whatsapp.ts`
- `apps/backbone/src/services/whatsapp/message-logs-repository.ts`
- `database/main/migrations/014_message_logs.sql`

### Modificar
- `apps/backbone/src/index.ts` (registrar rotas whatsapp)
- `apps/backbone/src/pulse/probes/index.ts` (registrar probe whatsapp)
- `apps/backbone/src/services/whatsapp/webhook-handler.ts` (logging + triggers)
- `apps/backbone/src/services/whatsapp/service.ts` (logging no send)
- `apps/backbone/src/services/whatsapp/types.ts` (novos tipos)
- `apps/sockets/src/server/types.ts` (novos eventos)
