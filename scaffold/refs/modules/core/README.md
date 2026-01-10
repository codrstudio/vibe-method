# Core Modules

Modulos centrais que implementam a funcionalidade principal do sistema.

---

## Visao Geral

Core modules sao onde o negocio acontece. Diferente de Settings (configuracao) e User (perfil/acesso), Core e onde usuarios executam tarefas e geram valor.

### Modulos Core

| Modulo | Proposito | Documento |
|--------|-----------|-----------|
| **Task Queue** | Fila de trabalho humano (inbox) | [task-queue.md](./task-queue.md) |
| **Calendar** | Agendamento de recursos (timeline) | [calendar.md](./calendar.md) |
| **Metrics** | Metricas e relatorios (pulse) | [metrics.md](./metrics.md) |
| **Automation** | Monitoramento de bot/IA | [automation.md](./automation.md) |

---

## Quando Cada Modulo se Aplica

```
SE ha itens que requerem acao humana:
  └── Task Queue (inbox, tickets, solicitacoes)

SE ha alocacao de tempo/recursos:
  └── Calendar (agenda, reservas, escalas)

SE gestores precisam de visibilidade:
  └── Metrics (KPIs, relatorios, dashboards)

SE ha automacao/IA no sistema:
  └── Automation (monitoramento, logs, status)
```

---

## Estrutura de Rotas Tipica

```
/inbox          # Task Queue - fila de trabalho
/timeline       # Calendar - agenda/calendario
/pulse          # Metrics - metricas e KPIs
/automations    # Automation - monitoramento de IA
```

**Nota:** Nomes de rotas podem variar por dominio:
- `/inbox` pode ser `/tickets`, `/solicitacoes`, `/pendencias`
- `/timeline` pode ser `/agenda`, `/calendario`, `/reservas`

---

## Relacao entre Modulos

```
                    ┌───────────────┐
                    │   CALENDAR    │
                    │ (agendamento) │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  TASK QUEUE   │ │   METRICS     │ │  AUTOMATION   │
    │ (pendencias   │ │ (analisa o    │ │ (processa     │
    │  do calendar) │ │  calendar)    │ │  automatico)  │
    └───────────────┘ └───────────────┘ └───────────────┘
```

**Exemplo de fluxo:**
1. **Automation** recebe mensagem WhatsApp
2. Bot tenta agendar consulta
3. Se nao consegue, cria item no **Task Queue**
4. Humano resolve e cria agendamento no **Calendar**
5. **Metrics** mostra taxa de agendamentos automaticos vs manuais

---

## Principios de Core

### 1. Mobile-First

Core e onde usuarios passam a maior parte do tempo. Deve funcionar perfeitamente em celular.

### 2. Tempo Real (quando possivel)

Atualizacoes devem aparecer sem refresh manual. Use polling ou WebSockets.

### 3. Acoes Rapidas

Acoes frequentes devem ser rapidas. FAB para criar, swipe para completar.

### 4. Estados Claros

Todo item tem estado (pendente, em andamento, concluido). Visualizar claramente.

### 5. Filtros Persistentes

Usuarios voltam ao modulo com frequencia. Lembrar filtros selecionados.
