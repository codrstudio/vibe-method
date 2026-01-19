# Real-time (Socket Layer)

Comunicacao bidirecional em tempo real entre servidor e clientes.

---

## Indice

1. [Por que Sockets Existem](#por-que-sockets-existem) - Latencia zero
2. [Quando Usar](#quando-usar) - Regra de decisao
3. [Arquitetura](#arquitetura) - Principios estruturais
4. [Estrutura](#estrutura) - Organizacao de pastas
5. [Conceitos](#conceitos) - Namespaces, Rooms, Eventos
6. [Fluxo de Eventos](#fluxo-de-eventos) - Negocio vs Efemeros
7. [Presenca](#presenca) - Estados, Heartbeat, Grace Period
8. [Autenticacao](#autenticacao) - JWT no handshake
9. [Eventos Padrao](#eventos-padrao) - Catalogo
10. [Escala Horizontal](#escala-horizontal) - Redis Adapter
11. [Boas Praticas](#boas-praticas) - DO e DON'T

---

## Por que Sockets Existem

Sockets resolvem um problema que polling nao consegue: **latencia zero**.

| Cenario | Polling (10s) | Sockets |
|---------|---------------|---------|
| Usuario envia mensagem | Outro ve em ate 10s | Outro ve instantaneamente |
| Atendente fica online | Lista atualiza em ate 10s | Lista atualiza na hora |
| "Digitando..." | Impossivel | Funciona |

**Polling** faz o cliente perguntar "tem novidade?" repetidamente.
**Sockets** fazem o servidor avisar "chegou novidade" quando acontece.

---

## Quando Usar

### Regra de Decisao

```
Se o usuario ESPERA resposta instantanea → Sockets
Se o usuario TOLERA alguns segundos      → Polling
```

### Tabela de Decisao

| Feature | Expectativa | Solucao |
|---------|-------------|---------|
| Dashboard de metricas | Atualiza periodicamente | Polling 30s |
| Lista de notificacoes | Atualiza quando olho | Polling 30s |
| Contador de tarefas | Aproximado | Polling 30s |
| **Chat** | Mensagem chega na hora | **Sockets** |
| **"Fulano digitando..."** | Aparece enquanto digita | **Sockets** |
| **Presenca online/away** | Status atualiza na hora | **Sockets** |
| **Fila de atendimento** | Notificacao imediata | **Sockets** |

### Quando NAO Usar

- Dados que mudam pouco (config, perfil)
- Listas que o usuario consulta sob demanda
- Metricas agregadas (atualizacao periodica e suficiente)
- Qualquer coisa onde 10-30s de delay e aceitavel

---

## Arquitetura

### Principio 1: Servidor Standalone

Socket server roda **separado** do app principal.

```
apps/
├── app/           # Next.js (porta XX00)
└── sockets/       # Socket.io (porta XX01)  ← processo separado
```

**Por que:**
- Escala independente (sockets consomem mais RAM por conexao)
- Deploy isolado (atualizar app nao derruba conexoes)
- Responsabilidade unica

### Principio 2: Redis como Barramento

Socket server **nao acessa banco**. Recebe eventos via Redis.

```
┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│   Backbone   │──publish─▶   Redis    │◀─subscribe─│   Sockets    │
│              │         │   Pub/Sub   │         │              │
│  (regras de  │         └─────────────┘         │  (broadcast  │
│   negocio)   │                                 │  para clients)│
└──────────────┘                                 └──────────────┘
```

**Por que:**
- Desacoplamento (sockets nao conhecem regras de negocio)
- Escala horizontal (multiplas instancias compartilham Redis)
- Resiliencia (backbone continua mesmo se sockets reiniciar)

---

## Estrutura

```
apps/sockets/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Portas, Redis URL
│   │
│   ├── server/
│   │   ├── index.ts          # Inicializacao Socket.io
│   │   ├── types.ts          # Tipos de eventos
│   │   └── middleware/
│   │       └── auth.ts       # JWT no handshake
│   │
│   └── namespaces/
│       ├── hub.ts            # /hub (equipe interna)
│       └── portal.ts         # /portal (clientes externos)
│
├── package.json
└── Dockerfile
```

---

## Conceitos

### Namespaces

Separam audiencias com regras de acesso diferentes.

```typescript
const hub = io.of('/hub');       // Equipe: atendentes, admins
const portal = io.of('/portal'); // Clientes externos
```

| Namespace | Quem conecta | Eventos disponiveis |
|-----------|--------------|---------------------|
| `/hub` | Equipe interna | Todos (presenca, fila, chat) |
| `/portal` | Clientes | Apenas chat proprio |

### Rooms

Agrupam conexoes para broadcast direcionado.

```typescript
socket.join(`user:${userId}`);      // Eventos privados
socket.join(`thread:${threadId}`);  // Participantes de conversa
socket.join('presence:attendants'); // Todos atendentes
```

| Padrao | Uso |
|--------|-----|
| `user:{id}` | Notificacoes privadas |
| `thread:{id}` | Mensagens de uma conversa |
| `presence:{grupo}` | Status de um grupo |

### Eventos

| Direcao | Exemplos |
|---------|----------|
| Client → Server | `typing:start`, `join:thread`, `heartbeat` |
| Server → Client | `thread:message`, `queue:new`, `attendant:online` |

---

## Fluxo de Eventos

### Eventos de Negocio (via Redis)

Mudancas de estado passam pelo backbone e Redis.

```
1. Backbone executa operacao (aceitar chat)
2. Backbone publica no Redis: { event: 'chat:accepted', data: {...} }
3. Socket server recebe (subscriber)
4. Socket server emite para rooms apropriadas
5. Clients recebem o evento
```

### Eventos Efemeros (via Socket direto)

Eventos de alta frequencia sem persistencia.

```
1. Client emite: typing:start
2. Server retransmite para room: thread:typing
3. Outros clients recebem
```

| Tipo | Via | Exemplos |
|------|-----|----------|
| Negocio | Redis | Mensagem, aceitar chat, mudar status |
| Efemero | Socket direto | Typing, cursor position |

---

## Presenca

### Estados

```
offline ──connect──▶ online ──timeout──▶ away ──disconnect──▶ offline
```

### Heartbeat

Client envia sinal periodico para confirmar que esta vivo.

```typescript
// Client - a cada 30 segundos
setInterval(() => socket.emit('heartbeat'), 30000);
```

### Grace Period

Tempo de tolerancia apos desconexao antes de marcar offline.

```
Desconexao abrupta (rede caiu)
    │
    ├─ 60 segundos de espera
    │
    ├─ Reconectou? → Restaura status
    └─ Nao reconectou? → Marca offline
```

| Parametro | Valor Recomendado |
|-----------|-------------------|
| Heartbeat | 30s |
| Grace period | 60s |
| TTL Redis | 300s |

---

## Autenticacao

JWT validado **no handshake**, nao por evento.

```typescript
// Middleware
function authMiddleware(socket, next) {
  const token = socket.handshake.auth.token;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error('Token invalido'));
  }
}

// Aplicar no namespace
hub.use(authMiddleware);
portal.use(authMiddleware);

// Client
const socket = io('/hub', {
  auth: { token: sessionToken }
});
```

---

## Eventos Padrao

### Presenca

| Evento | Direcao | Descricao |
|--------|---------|-----------|
| `presence:online` | C→S | Ficar disponivel |
| `presence:away` | C→S | Pausar |
| `heartbeat` | C→S | Renovar TTL |
| `attendant:online` | S→C | Alguem entrou |
| `attendant:offline` | S→C | Alguem saiu |
| `attendant:away` | S→C | Alguem pausou |

### Fila

| Evento | Direcao | Descricao |
|--------|---------|-----------|
| `queue:new` | S→C | Novo item esperando |
| `queue:taken` | S→C | Item foi pego |
| `queue:updated` | S→C | Fila mudou |

### Thread/Chat

| Evento | Direcao | Descricao |
|--------|---------|-----------|
| `join:thread` | C→S | Entrar na room |
| `leave:thread` | C→S | Sair da room |
| `typing:start` | C→S | Comecou a digitar |
| `typing:stop` | C→S | Parou de digitar |
| `thread:message` | S→C | Nova mensagem |
| `thread:typing` | S→C | Alguem digitando |
| `chat:accepted` | S→C | Atendente entrou |
| `chat:ended` | S→C | Chat encerrado |

---

## Escala Horizontal

Para multiplas instancias, usar Redis Adapter.

```typescript
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

```
Load Balancer (sticky sessions)
        │
   ┌────┼────┐
   ▼    ▼    ▼
Socket Socket Socket
   └────┼────┘
        ▼
      Redis
```

**Requisitos:**
- Sticky sessions no load balancer
- Redis Adapter configurado
- Todas instancias conectadas ao mesmo Redis

---

## Frontend Hook

Hook para usar sockets no Next.js:

```typescript
// hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export function useSocket(namespace: '/hub' | '/portal') {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;

    const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}${namespace}`, {
      auth: { token: session.accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socketRef.current = socket;

    // Heartbeat
    const heartbeat = setInterval(() => {
      socket.emit('heartbeat');
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
    };
  }, [session?.accessToken, namespace]);

  return { socket: socketRef.current, connected };
}
```

---

## Boas Praticas

### DO

- Servidor socket separado do app
- Redis para eventos de negocio
- Socket direto para eventos efemeros
- Heartbeat + grace period
- Autenticar no handshake
- Namespaces para separar audiencias
- Tipar todos os eventos

### DON'T

- Socket server acessar banco
- Eventos de alta frequencia via Redis
- Confiar em conexao permanente
- Estado critico apenas em memoria
- Usar socket quando polling resolve
- Autenticar em cada evento

---

## Checklist

Ao implementar feature real-time:

- [ ] Avaliar se polling resolve
- [ ] Definir namespace (/hub ou /portal)
- [ ] Definir rooms para broadcast
- [ ] Definir eventos (C→S e S→C)
- [ ] Tipar payloads
- [ ] Implementar handler no namespace
- [ ] Implementar publisher no backbone
- [ ] Criar hook no frontend
- [ ] Testar reconexao
- [ ] Documentar eventos no CLAUDE.md
