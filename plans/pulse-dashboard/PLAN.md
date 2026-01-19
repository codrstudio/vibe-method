# Plano: Pulse Dashboard - Página Infraestrutura

## Objetivo

Redesign completo da página `/app/system/health/backbone` para ser a página de excelência do Pulse.

**Título:** Infraestrutura
**Subtítulo:** Backend, APIs e componentes

### Decisões

- **Real-time:** Polling tradicional (10s) + refresh manual
- **Alertas:** Somente leitura

---

## Endpoints do Pulse Utilizados

| Endpoint | Uso |
|----------|-----|
| `GET /pulse` | Overview: status, uptime, probes, alertas |
| `GET /pulse/probes/deep` | Detalhes de todos os probes |
| `GET /pulse/llm` | Status OpenRouter + Ollama |
| `GET /pulse/modules` | Métricas por módulo |
| `GET /pulse/alerts` | Alertas configurados + eventos |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Health > Infraestrutura                 │
│ Actions: [Refresh] [Última atualização: 12:34:56]               │
├─────────────────────────────────────────────────────────────────┤
│ Infraestrutura                                                  │
│ Backend, APIs e componentes                                     │
├─────────────────────────────────────────────────────────────────┤
│ OVERVIEW: [Status] [Uptime] [Probes OK] [Alertas Ativos]       │
├─────────────────────────────────────────────────────────────────┤
│ TABS: [Probes] [LLM] [Métricas] [Alertas]                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist

### Fase 1: Hook
- [x] Criar `_hooks/use-pulse.ts` (substitui use-health.ts)

### Fase 2: Componentes
- [x] Criar `_components/pulse-overview.tsx`
- [x] Criar `_components/probe-card.tsx`
- [x] Criar `_components/llm-panel.tsx`
- [x] Criar `_components/alerts-panel.tsx`
- [x] Criar `_components/metrics-panel.tsx`

### Fase 3: Página
- [x] Reescrever `page.tsx`

### Fase 4: Cleanup
- [x] Deletar `_hooks/use-health.ts`
- [x] Deletar `_components/health-overview.tsx`
- [x] Deletar `_components/component-card.tsx`
- [x] Deletar `_components/connection-status.tsx`

---

## Verificação

1. Acessar `/app/system/health/backbone`
2. Verificar tabs funcionando
3. Verificar polling (10s)
4. Verificar refresh manual

### Testes Realizados (Playwright)

- [x] Login funciona corretamente
- [x] `/app/system/health` - Título "Status do Sistema", cards funcionando
- [x] `/app/system/health/backbone` - Título "Infraestrutura", subtítulo presente
- [x] Overview card com Status, Uptime, Probes, Alertas
- [x] Tab Probes funcionando
- [x] Tab LLM funcionando (empty state quando sem provedores)
- [x] Tab Métricas funcionando (empty state quando sem dados)
- [x] Tab Alertas funcionando (cards "Alertas Configurados" e "Eventos Recentes")
- [x] Botão Atualizar funcionando
- [x] Null safety corrigida em todos os componentes

---

## Arquivos Finais

```
backbone/
├── page.tsx                          # Página principal com tabs
├── _hooks/
│   └── use-pulse.ts                  # Hook unificado para Pulse API
└── _components/
    ├── pulse-overview.tsx            # Card de overview
    ├── probe-card.tsx                # Card individual de probe
    ├── llm-panel.tsx                 # Painel OpenRouter + Ollama
    ├── alerts-panel.tsx              # Painel de alertas
    ├── metrics-panel.tsx             # Wrapper para ModuleCards
    ├── module-card.tsx               # Card de módulo (mantido)
    ├── status-badge.tsx              # Badge de status (mantido)
    └── empty-state.tsx               # Estado vazio (mantido)
```
