# Monitoring Settings

Dashboard de saude e status dos servicos do sistema.

---

## O Problema Universal

Sistemas com infraestrutura propria (banco, cache, APIs externas, bots) precisam de visibilidade sobre o status de cada componente. Sem monitoramento, problemas sao descobertos quando usuarios reclamam - tarde demais.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Quais servicos compoe o sistema?**
   - Banco de dados (PostgreSQL, MySQL)
   - Cache (Redis)
   - APIs externas (Evolution, OpenRouter)
   - Servicos internos (Backbone, Workers)

2. **Quais metricas indicam saude?**
   - Conexao OK/Falha
   - Latencia (tempo de resposta)
   - Uso de recursos (CPU, memoria, disco)
   - Fila de processamento

3. **Quem precisa ver isso?**
   - Geralmente apenas Admin
   - Ou equipe tecnica

4. **Qual a frequencia de atualizacao?**
   - Tempo real (polling 10-30s)?
   - Sob demanda (botao refresh)?

5. **O que fazer quando algo falha?**
   - Apenas mostrar status?
   - Tentar reconectar?
   - Notificar responsavel?

---

## Anatomia

### Dashboard de Status

```
┌─────────────────────────────────────────────────────────────┐
│ Saude do Sistema                          [Atualizar] 🔄    │
│ Ultima verificacao: ha 30 segundos                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ● SISTEMA OPERACIONAL                                   ││
│ │   Todos os servicos funcionando                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ SERVICOS                                                    │
│ ┌───────────────────┬──────────────────────────────────────┐│
│ │ ● PostgreSQL      │ Conectado - 3ms                     ││
│ ├───────────────────┼──────────────────────────────────────┤│
│ │ ● Redis           │ Conectado - 1ms                     ││
│ ├───────────────────┼──────────────────────────────────────┤│
│ │ ● Evolution API   │ Conectado - 45ms                    ││
│ ├───────────────────┼──────────────────────────────────────┤│
│ │ ● Backbone        │ Conectado - 12ms                    ││
│ ├───────────────────┼──────────────────────────────────────┤│
│ │ ○ OpenRouter      │ Erro - Timeout apos 5s              ││
│ └───────────────────┴──────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Estados de Servico

| Estado | Icone | Cor | Significado |
|--------|-------|-----|-------------|
| Healthy | ● | Verde | Funcionando normalmente |
| Degraded | ◐ | Amarelo | Funcionando com lentidao ou erros parciais |
| Unhealthy | ○ | Vermelho | Falha ou indisponivel |
| Unknown | ? | Cinza | Nao foi possivel verificar |

---

## O que Monitorar

### Por Tipo de Servico

| Servico | Verificacao | Metricas |
|---------|-------------|----------|
| **Database** | SELECT 1 | Latencia, conexoes ativas |
| **Redis** | PING | Latencia, memoria usada |
| **API Externa** | GET /health ou endpoint especifico | Latencia, status code |
| **Worker/Background** | Heartbeat ou fila | Jobs pendentes, ultimo processado |
| **Bot/Automacao** | Status da sessao | Mensagens/hora, erros recentes |

### Metricas Opcionais

- **CPU/Memoria**: Se hospedagem permitir
- **Disco**: Espaco disponivel
- **Logs recentes**: Ultimos erros
- **Uptime**: Tempo desde ultimo restart

---

## Variacoes por Dominio

| Aspecto | Clinica com Bot | SaaS Simples | Sistema Complexo |
|---------|-----------------|--------------|------------------|
| **Servicos** | DB, Redis, Evolution, Backbone | DB apenas | DB, Cache, Workers, APIs |
| **Criticidade** | WhatsApp = critico | DB = critico | Depende do servico |
| **Frequencia** | 30s (bot ativo) | Sob demanda | 10s (tempo real) |
| **Quem ve** | Admin | Admin | Admin + DevOps |

---

## Implementacao

### API Endpoint

```
GET /api/settings/health

Response:
{
  "code": 200,
  "data": {
    "status": "healthy" | "degraded" | "unhealthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": [
      {
        "name": "PostgreSQL",
        "status": "healthy",
        "latency_ms": 3,
        "message": null
      },
      {
        "name": "OpenRouter",
        "status": "unhealthy",
        "latency_ms": null,
        "message": "Timeout after 5000ms"
      }
    ]
  }
}
```

### Logica de Status Geral

```
SE todos healthy → status = "healthy"
SE algum unhealthy mas sistema funciona → status = "degraded"
SE servico critico unhealthy → status = "unhealthy"
```

### Backend - Health Checks

```typescript
// Pseudo-codigo

async function checkDatabase(): ServiceHealth {
  const start = Date.now();
  try {
    await db.query("SELECT 1");
    return {
      name: "PostgreSQL",
      status: "healthy",
      latency_ms: Date.now() - start
    };
  } catch (error) {
    return {
      name: "PostgreSQL",
      status: "unhealthy",
      message: error.message
    };
  }
}

async function checkRedis(): ServiceHealth {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      name: "Redis",
      status: "healthy",
      latency_ms: Date.now() - start
    };
  } catch (error) {
    return {
      name: "Redis",
      status: "unhealthy",
      message: error.message
    };
  }
}

async function checkExternalAPI(url: string, name: string): ServiceHealth {
  const start = Date.now();
  try {
    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return {
      name,
      status: "healthy",
      latency_ms: Date.now() - start
    };
  } catch (error) {
    return {
      name,
      status: "unhealthy",
      message: error.message
    };
  }
}
```

---

## Principios de Design

### 1. Admin Only

Monitoramento expoe detalhes de infraestrutura. Restringir a admins.

### 2. Nao Bloquear

Se um servico demora para responder, nao travar toda a verificacao. Usar timeouts e paralelismo.

### 3. Informacao Acionavel

"Erro" nao ajuda. "PostgreSQL: Connection refused em localhost:5432" ajuda a diagnosticar.

### 4. Auto-refresh Opcional

Polling automatico consome recursos. Oferecer botao manual e opcao de auto-refresh.

### 5. Degradado vs Falha

Distinguir "funciona mas lento" (degraded) de "nao funciona" (unhealthy). Ajuda a priorizar.

### 6. Nao Expor Secrets

Mensagens de erro podem conter strings de conexao. Sanitizar antes de exibir.

---

## Anti-patterns

### "Verificar tudo em serie"
**Problema:** Se um servico trava, toda verificacao trava.
**Solucao:** Paralelizar com Promise.all e timeouts individuais.

### "Polling muito frequente"
**Problema:** Sobrecarrega servicos sendo verificados.
**Solucao:** Intervalo minimo de 10-30s. Ou sob demanda.

### "Esconder quando saudavel"
**Problema:** Usuario nao sabe se esta funcionando.
**Solucao:** Sempre mostrar status, mesmo quando tudo OK.

### "Falhar silenciosamente"
**Problema:** Servico cai e ninguem sabe.
**Solucao:** Alertas para admins quando status muda para unhealthy.

---

## Exemplo: Dashboard Completo

```
/settings/health

┌─────────────────────────────────────────────────────────────┐
│ Saude do Sistema                                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ● SISTEMA OPERACIONAL                   [Atualizar]     ││
│ │                                                         ││
│ │ Todos os 5 servicos funcionando.                        ││
│ │ Ultima verificacao: 15/01/2024 10:30:45                 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ BANCO DE DADOS                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ● PostgreSQL                                          │  │
│ │   Conectado | Latencia: 3ms | Conexoes: 12/100        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ CACHE                                                       │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ● Redis                                               │  │
│ │   Conectado | Latencia: 1ms | Memoria: 45MB           │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ INTEGRACOES                                                 │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ● Evolution API (WhatsApp)                            │  │
│ │   Conectado | Latencia: 45ms | Instancia: online      │  │
│ └───────────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ● OpenRouter (LLM)                                    │  │
│ │   Conectado | Latencia: 230ms | Modelo: gpt-4o-mini   │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ SERVICOS INTERNOS                                           │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ● Backbone                                            │  │
│ │   Conectado | Latencia: 12ms | Jobs: 0 pendentes      │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ℹ️ Auto-refresh a cada 30 segundos                     ││
│ │    [ ] Desativar auto-refresh                          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
