# Evolution API - Gestao de Estado de Conexao

## Objetivo

Documentar como o Evolution API gerencia estados de conexao WhatsApp e definir estrategia para lidar com desconexoes.

---

## Arquitetura Evolution API

Evolution API usa [Baileys](https://github.com/WhiskeySockets/Baileys) como biblioteca base para protocolo WhatsApp Web.

```
┌─────────────────────────────────────────────────────────────┐
│                      EVOLUTION API                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   Instance Manager                       ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ││
│  │  │  Instance A  │  │  Instance B  │  │  Instance C  │  ││
│  │  │  (Baileys)   │  │  (Baileys)   │  │  (Baileys)   │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                               │
│                    Webhook Events                            │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               ▼
                        Nossa Aplicacao
```

---

## Estados de Conexao (Baileys)

### ConnectionState

```typescript
type ConnectionState = {
  connection: 'connecting' | 'open' | 'close';
  lastDisconnect?: {
    error: Error;
    date: Date;
  };
  isNewLogin?: boolean;
  qr?: string;  // Base64 do QR Code
  receivedPendingNotifications?: boolean;
}
```

### Fluxo de Estados

```
                    ┌─────────────┐
       Criar        │             │
      Instancia ───►│ connecting  │
                    │             │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ QR Code  │  │   open   │  │  close   │
        │ Gerado   │  │(sucesso) │  │ (falha)  │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
        Scan OK            │        Verifica
             │             │        Motivo
             └─────────────┤             │
                           │             ▼
                           │    ┌────────────────┐
                           │    │ DisconnectReason│
                           │    └────────────────┘
                           ▼
                    ┌─────────────┐
                    │    open     │◄──── Operacional
                    └──────┬──────┘
                           │
                    Meta desconecta
                           │
                           ▼
                    ┌─────────────┐
                    │   close     │
                    └──────┬──────┘
                           │
              Verifica DisconnectReason
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │loggedOut │     │ restart  │     │  outros  │
   │   401    │     │ Required │     │          │
   └────┬─────┘     └────┬─────┘     └────┬─────┘
        │                │                │
        ▼                ▼                ▼
   REQUER QR        RECONECTAR       RECONECTAR
   (manual)        AUTOMATICO        AUTOMATICO
```

---

## DisconnectReason (Baileys)

| Codigo | Nome | Descricao | Acao |
|--------|------|-----------|------|
| 401 | `loggedOut` | Usuario deslogou no celular ou foi banido | **REQUER QR CODE** |
| 403 | `forbidden` | Acesso proibido | Verificar credenciais |
| 408 | `timedOut` | Timeout de conexao | Reconectar automatico |
| 408 | `connectionLost` | Conexao perdida | Reconectar automatico |
| 411 | `multideviceMismatch` | Conflito de dispositivos | Verificar |
| 428 | `connectionClosed` | Conexao fechada | Reconectar automatico |
| 440 | `connectionReplaced` | Outra sessao aberta | **REQUER QR CODE** |
| 500 | `badSession` | Sessao corrompida | **REQUER QR CODE** |
| 503 | `unavailableService` | WhatsApp indisponivel | Aguardar e reconectar |
| 515 | `restartRequired` | Restart obrigatorio | Reconectar automatico |

### Classificacao

```
RECONEXAO AUTOMATICA (pode tentar sem QR):
- 408: timedOut, connectionLost
- 428: connectionClosed
- 503: unavailableService
- 515: restartRequired

RECONEXAO MANUAL (requer novo QR Code):
- 401: loggedOut
- 440: connectionReplaced
- 500: badSession
```

---

## Webhook Events (Evolution API)

### CONNECTION_UPDATE

Evento principal para monitorar estado da conexao.

**Endpoint:** `POST /connection-update`

**Payload:**
```json
{
  "event": "connection.update",
  "instance": "recruitment-01",
  "data": {
    "state": "open" | "close" | "connecting",
    "statusReason": 401 | 428 | 515 | ...,
    "isNewLogin": false
  },
  "destination": "https://nossa-api.com/webhook",
  "date_time": "2024-01-15T10:30:00.000Z"
}
```

### QRCODE_UPDATED

Evento quando QR Code e gerado/atualizado.

**Endpoint:** `POST /qrcode-updated`

**Payload:**
```json
{
  "event": "qrcode.updated",
  "instance": "recruitment-01",
  "data": {
    "qrcode": {
      "base64": "data:image/png;base64,iVBORw0KGgo...",
      "code": "2@abc..."
    }
  }
}
```

---

## Endpoints Evolution API

### Verificar Estado

```http
GET /instance/connectionState/{instance}
Authorization: apikey {EVOLUTION_API_KEY}
```

**Response:**
```json
{
  "instance": {
    "instanceName": "recruitment-01",
    "state": "open"
  }
}
```

### Gerar QR Code (Conectar)

```http
GET /instance/connect/{instance}
Authorization: apikey {EVOLUTION_API_KEY}
```

**Response:**
```json
{
  "base64": "data:image/png;base64,...",
  "code": "2@abc..."
}
```

### Desconectar (Logout)

```http
DELETE /instance/logout/{instance}
Authorization: apikey {EVOLUTION_API_KEY}
```

### Reiniciar Instancia

```http
PUT /instance/restart/{instance}
Authorization: apikey {EVOLUTION_API_KEY}
```

---

## Problemas Conhecidos

### 1. Estado oscila entre open/close

**Problema:** Apos enviar mensagem, estado muda para "close" incorretamente.

**Causa:** Bug no Baileys onde operacoes normais disparam evento de desconexao.

**Solucao:** Debounce nos eventos de estado - aguardar estabilizacao antes de reagir.

```typescript
// NAO reagir imediatamente a cada evento
// Aguardar 5s de estabilizacao
let stateDebounce: NodeJS.Timeout;

function onConnectionUpdate(state: string) {
  clearTimeout(stateDebounce);
  stateDebounce = setTimeout(() => {
    // Agora sim, estado estabilizou
    processStateChange(state);
  }, 5000);
}
```

### 2. Desconexao apos dias

**Problema:** Sessao desconecta apos 3-7 dias mesmo com celular conectado.

**Causa:** WhatsApp muda `client_revision` frequentemente, invalidando sessoes.

**Solucao:** Nenhuma garantida. Precisa de QR Code novamente.

### 3. QR Code expira

**Problema:** QR Code expira em ~60 segundos.

**Solucao:**
- Webhook QRCODE_UPDATED envia novo QR automaticamente
- UI deve atualizar em tempo real
- Usar WebSocket para push do QR

---

## Estrategia de Reconexao

### Algoritmo

```typescript
async function handleDisconnect(reason: number, instance: string) {
  // 1. Classifica o motivo
  const requiresQR = [401, 440, 500].includes(reason);

  if (requiresQR) {
    // 2a. Marca como desconectado, notifica admins
    await markChannelDisconnected(instance, reason);
    await notifyAdmins(instance, 'Canal desconectado - requer QR Code');
    return;
  }

  // 2b. Tenta reconexao automatica
  const maxRetries = 5;
  const backoff = [5, 15, 30, 60, 120]; // segundos

  for (let i = 0; i < maxRetries; i++) {
    await markChannelDegraded(instance, `Tentativa ${i + 1}/${maxRetries}`);
    await sleep(backoff[i] * 1000);

    try {
      await evolution.restart(instance);
      const state = await evolution.getConnectionState(instance);

      if (state === 'open') {
        await markChannelConnected(instance);
        await notifyAdmins(instance, 'Canal reconectado automaticamente');
        return;
      }
    } catch (error) {
      console.log(`Tentativa ${i + 1} falhou:`, error.message);
    }
  }

  // 3. Esgotou tentativas
  await markChannelDisconnected(instance, reason);
  await notifyAdmins(instance, 'Reconexao automatica falhou - requer QR Code');
}
```

### Backoff Exponencial

| Tentativa | Delay | Total Acumulado |
|-----------|-------|-----------------|
| 1 | 5s | 5s |
| 2 | 15s | 20s |
| 3 | 30s | 50s |
| 4 | 60s | 1m50s |
| 5 | 120s | 3m50s |

Apos ~4 minutos de tentativas, desiste e requer intervencao manual.

---

## Health Check

### Estrategia Dupla

1. **Webhook** (push): Evolution envia eventos em tempo real
2. **Polling** (pull): Verificacao periodica como backup

```typescript
// Job a cada 5 minutos
async function healthCheckJob() {
  const channels = await getActiveChannels();

  for (const channel of channels) {
    try {
      const state = await evolution.getConnectionState(channel.instance_name);

      if (state !== channel.status) {
        // Webhook pode ter falhado, atualiza estado
        await updateChannelStatus(channel.id, state);

        if (state === 'close') {
          // Inicia fluxo de reconexao
          handleDisconnect(428, channel.instance_name);
        }
      }

      await markHealthCheckOk(channel.id);

    } catch (error) {
      // Evolution API nao respondeu
      await markChannelDegraded(channel.id, 'Health check falhou');
    }
  }
}
```

---

## Notificacoes

### Matriz de Notificacao

| Evento | Quem Notificar | Canal |
|--------|----------------|-------|
| Degraded (tentando reconectar) | Admins do canal | Email/Push |
| Disconnected (requer QR) | Admins + Operadores afetados | Email/Push/SMS |
| Reconnected (sucesso) | Admins do canal | Email/Push |
| Health check falhou | Admins do sistema | Email |

### Template de Notificacao

**Titulo:** Canal WhatsApp Desconectado - Acao Necessaria

**Corpo:**
```
O canal "Recrutamento" foi desconectado do WhatsApp.

Motivo: Sessao expirada (codigo 401)
Operacoes afetadas:
- recruitment-gatekeeper
- recruitment-interview

Acao necessaria: Escanear novo QR Code

[Reconectar Agora]
```

---

## Referencias

- [Evolution API - Webhooks](https://doc.evolution-api.com/v2/en/configuration/webhooks)
- [Evolution API - Connection State](https://doc.evolution-api.com/v2/api-reference/instance-controller/connection-state)
- [Evolution API - Restart Instance](https://doc.evolution-api.com/v1/api-reference/instance-controller/restart-instance)
- [Baileys - DisconnectReason](https://baileys.wiki/docs/api/enumerations/DisconnectReason/)
- [Baileys - Connecting](https://baileys.wiki/docs/socket/connecting/)
- [GitHub Issue - Connection Closed](https://github.com/WhiskeySockets/Baileys/issues/1474)
- [GitHub Issue - Session Logged Out](https://github.com/WhiskeySockets/Baileys/issues/1965)

---

## Decisoes para Implementacao

### 1. Maquina de Estados do Canal

```
disconnected ──► qr_pending ──► connected
     ▲                              │
     │                              │
     │         ┌─────────┐          │
     └─────────│degraded │◄─────────┘
               └────┬────┘
                    │
              Retry falhou
                    │
                    ▼
              disconnected
```

### 2. Timeouts

| Acao | Timeout |
|------|---------|
| QR Code expira | 60s (WhatsApp define) |
| Debounce estado | 5s |
| Health check intervalo | 5min |
| Max tempo em degraded | 4min (5 tentativas) |

### 3. Persistencia

- Estado do canal: PostgreSQL (`channels.status`)
- QR Code atual: Redis (TTL 60s)
- Historico de eventos: PostgreSQL (`channel_events`)

### 4. Real-time UI

- WebSocket para push de QR Code
- WebSocket para status updates
- Polling como fallback (30s)
