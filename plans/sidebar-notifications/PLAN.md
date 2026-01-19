# Plano: Adicionar Badges de Notificação no Sidebar

## Objetivo
Levar os badges de notificação do mobile-header para o sidebar desktop, logo abaixo do brand, com layouts adaptativos para os estados expanded e collapsed.

## Layout Esperado

**Expanded SEM notificação (count = 0):**
```
| BRAND                       |
| 🔔  📋                       |  <- ícones lado a lado, cor padrão sidebar
```

**Expanded COM notificação (count > 0):**
```
| BRAND                       |
| [🔔 20] [📋 20]              |  <- barra pill com botões pill coloridos
```

**Collapsed:**
```
| BRAND-icon |
| 🔔 |        <- cor padrão ou semântica conforme count
| 📋 |
```

---

## Cores Semânticas (globals.css)

| Elemento | Token | Classe Tailwind | Quando Aplicar |
|----------|-------|-----------------|----------------|
| Notificações | `--warning` | `text-warning`, `bg-warning`, `bg-warning/15` | Apenas quando count > 0 |
| Tarefas | `--info` | `text-info`, `bg-info`, `bg-info/15` | Apenas quando count > 0 |
| Padrão | sidebar tokens | `text-sidebar-foreground`, `bg-sidebar-accent` | Quando count = 0 |

**Justificativa:**
- `warning` (amarelo/laranja): Alertas que pedem atenção
- `info` (azul): Pendências informativas a executar

Essas cores adaptam automaticamente entre light/dark mode.

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `apps/app/components/sidebar-notifications.tsx` | **Editar** |

---

## Tarefas

- [x] Criar componente `sidebar-notifications.tsx`
- [x] Integrar no `app-sidebar.tsx`
- [x] Corrigir para usar cores semânticas do tema
- [x] Corrigir layout para barra única (não justify-between)
- [x] Adicionar lógica condicional (cor só quando count > 0)
- [ ] Testar visualmente expanded e collapsed
