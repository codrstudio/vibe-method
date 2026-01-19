# PLAN: WhatsApp Simulator (wa-sim)

## Contexto

O sistema WhatsApp funciona com Evolution API real. Porém, nem sempre há Evolution disponível ou o cliente ainda não tem número.

**Objetivo**: Criar um simulador como **serviço separado** (`apps/wa-sim`), sempre disponível em paralelo ao Evolution. O usuário pode usar o simulador enquanto aguarda configurar o número real.

**Decisão Arquitetural**: Serviço separado (não dentro do backbone) porque:
- Stack enxuta, sem carregar dependências do backbone
- Pode ligar/desligar independente
- Segue o padrão do sockets
- Isolamento de falhas
- Dispara webhooks via HTTP pro backbone (valida fluxo real)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                           SISTEMA                               │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │    WA-SIM       │    │    BACKBONE     │    │  EVOLUTION  │ │
│  │   (fake evo)    │───►│                 │◄───│   (real)    │ │
│  │                 │    │ webhook-handler │    │             │ │
│  │ - state         │    │                 │    │             │ │
│  │ - fake api      │    │                 │    │             │ │
│  │ - webhooks      │    │                 │    │             │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│          │                      ▲                     │        │
│          │                      │                     │        │
│          └──── POST /webhook ───┴─────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

**Decisão de Roteamento** (por canal):

```typescript
// Cada canal pode usar evolution ou simulator
channel.provider = 'evolution' | 'simulator'

// evolution-client.ts decide baseado no canal
if (channel.provider === 'simulator') {
  return fetch(`${WA_SIM_URL}/...`)  // wa-sim
} else {
  return evolutionFetch(...)  // Evolution real
}
```

---

## Estrutura do Projeto

```
apps/wa-sim/
├── src/
│   ├── types.ts              # Tipos do simulador
│   ├── state.ts              # Estado em memória (singleton)
│   ├── webhook-emitter.ts    # Dispara webhooks para backbone
│   ├── api.ts                # Fake Evolution API
│   ├── routes.ts             # Rotas HTTP
│   └── index.ts              # Servidor Fastify
├── package.json
└── tsconfig.json
```

---

## Tarefas

### Sprint 1: Estrutura Base

- [x] Criar pasta `apps/wa-sim`
- [x] Criar `package.json`
- [x] Criar `tsconfig.json`
- [x] Criar `src/types.ts`
- [x] Criar `src/state.ts`
- [x] Criar `src/index.ts` (exports)

### Sprint 2: Webhook e API

- [x] Criar `src/webhook-emitter.ts`
- [x] Criar `src/api.ts`
- [x] Criar `src/routes.ts`
- [x] Criar `src/server.ts` (Fastify)

### Sprint 3: Integração

- [x] Criar migration `016_channel_provider.sql`
- [x] Modificar `evolution-client.ts` para rotear por provider
- [x] Adicionar script no `package.json` root
- [x] Adicionar wa-sim no `.env`
- [x] Adicionar wa-sim nos `docker-compose` files
- [x] Criar `Dockerfile`
- [x] Atualizar `types.ts` do backbone com provider
- [x] Atualizar `repository.ts` com provider

### Sprint 4: Testes

- [ ] Testar criação de instância
- [ ] Testar conexão simulada
- [ ] Testar envio de mensagem
- [ ] Testar webhook chegando no backbone

---

## Detalhes de Implementação

### Tipos (`types.ts`)

```typescript
export interface SimulatedInstance {
  instanceName: string
  instanceId: string
  channelId: string | null
  status: 'qr_pending' | 'connecting' | 'connected' | 'disconnected'
  phoneNumber: string | null
  qrCode: string | null
  qrCodeExpiresAt: Date | null
  createdAt: Date
  messages: SimulatedMessage[]
  stats: InstanceStats
}

export interface SimulatedMessage {
  id: string
  direction: 'inbound' | 'outbound'
  remoteJid: string
  text: string
  timestamp: Date
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
}

export interface InstanceStats {
  messagesInbound: number
  messagesOutbound: number
  connectionsTotal: number
  disconnectionsTotal: number
  lastActivity: Date | null
}

export interface SimulatorStats {
  instancesTotal: number
  instancesConnected: number
  instancesPending: number
  messagesInboundTotal: number
  messagesOutboundTotal: number
  uptimeMs: number
}
```

### Configuração

```env
# apps/wa-sim/.env
PORT=8003
BACKBONE_WEBHOOK_URL=http://localhost:8002/backbone/whatsapp/webhook
```

### Porta

- **wa-sim**: 8003 (seguindo sequência: app=3000, backbone=8002, sockets=8001)

---

## Verificação

```bash
# 1. Iniciar wa-sim
npm run dev:wa-sim

# 2. Verificar status
curl http://localhost:8003/status

# 3. Criar instância fake
curl -X POST http://localhost:8003/instance/create \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "test_channel"}'

# 4. Simular conexão
curl -X POST http://localhost:8003/instance/test_channel/connect \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+5511999887766"}'

# 5. Simular mensagem recebida
curl -X POST http://localhost:8003/instance/test_channel/message \
  -H "Content-Type: application/json" \
  -d '{"from": "+5511988776655", "text": "Olá!"}'
```

---

## Notas

1. **Estado em Memória**: Reiniciar wa-sim limpa estado (intencional para dev/test)
2. **Provider por Canal**: Cada canal escolhe seu provider independentemente
3. **Webhook via HTTP**: wa-sim faz POST pro backbone igual Evolution faria
4. **Sempre Disponível**: wa-sim inicia independente, não precisa de Evolution
