# Module Patterns

Framework de pensamento para construir modulos de sistema adaptaveis a qualquer nicho.

---

## Filosofia

> **A IA nao precisa de templates - precisa de frameworks de decisao.**

Esta documentacao **ensina a pensar**, nao prescreve implementacoes. Cada documento contem:

1. **O Problema Universal** - Por que esse modulo existe (independente do nicho)
2. **Perguntas de Descoberta** - O que investigar ANTES de implementar
3. **Variacoes por Dominio** - Como o padrao se manifesta em 3+ nichos
4. **Principios de Design** - Decisoes que guiam implementacao (o PORQUE)
5. **Anti-patterns** - O que NAO fazer e por que

---

## Como Usar

### 1. Identifique o Dominio

Antes de implementar qualquer modulo, execute o processo de [DISCOVERY.md](./DISCOVERY.md):
- Qual o segmento? (saude, educacao, logistica, etc)
- Qual o vocabulario nativo?
- Quem sao os stakeholders?

### 2. Selecione os Modulos Relevantes

Nem todo projeto precisa de todos os modulos. Use a matriz abaixo:

| Modulo | Quando Usar | Quando Pular |
|--------|-------------|--------------|
| **Settings/Entity** | Sempre | Nunca |
| **Settings/Users** | Multi-usuario | Single-tenant pessoal |
| **Settings/Integrations** | APIs externas | Sistema isolado |
| **Settings/Monitoring** | Infraestrutura propria | Serverless simples |
| **Core/Task Queue** | Acoes humanas pendentes | Tudo automatico |
| **Core/Calendar** | Agendamento de recursos | Sem alocacao de tempo |
| **Core/Metrics** | Gestao por dados | App simples |
| **Core/Automation** | Bot/IA no sistema | Sem automacao |
| **User/Profile** | Sempre | Nunca |
| **User/Notifications** | Eventos importantes | App trivial |
| **User/Navigation** | Sempre | Nunca |

### 3. Adapte ao Vocabulario

Use [patterns/naming.md](./patterns/naming.md) para traduzir conceitos genericos para a lingua do usuario.

### 4. Implemente

Consulte o documento do modulo para perguntas de descoberta e principios de design.

---

## Mapa de Modulos

```
                    ┌─────────────────────────────────────────┐
                    │              DISCOVERY                   │
                    │   (Processo antes de qualquer modulo)    │
                    └────────────────────┬────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│    SETTINGS     │            │      CORE       │            │      USER       │
│                 │            │                 │            │                 │
│ entity          │            │ task-queue      │            │ profile         │
│ users           │            │ calendar        │            │ notifications   │
│ integrations    │            │ metrics         │            │ navigation      │
│ monitoring      │            │ automation      │            │                 │
└─────────────────┘            └─────────────────┘            └─────────────────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │              PATTERNS                    │
                    │   naming | permissions | states          │
                    └─────────────────────────────────────────┘
```

---

## Estrutura de Arquivos

```
modules/
├── README.md                 # Este arquivo
├── DISCOVERY.md              # Meta-processo de descoberta
│
├── settings/
│   ├── README.md             # Visao geral de Settings
│   ├── entity.md             # A "dona" do sistema
│   ├── users.md              # Gestao de usuarios
│   ├── integrations.md       # Integracoes externas
│   └── monitoring.md         # Health/monitoramento
│
├── core/
│   ├── README.md             # Visao geral de Core
│   ├── task-queue.md         # Fila de trabalho (inbox)
│   ├── calendar.md           # Agendamento (timeline)
│   ├── metrics.md            # Metricas (pulse)
│   └── automation.md         # Monitoramento de IA/bot
│
├── user/
│   ├── README.md             # Visao geral de User
│   ├── profile.md            # Perfil + seguranca
│   ├── notifications.md      # Sistema de notificacoes
│   └── navigation.md         # Menu adaptavel a roles
│
└── patterns/
    ├── naming.md             # Nomenclatura por dominio
    ├── permissions.md        # Pensando sobre permissoes
    └── states.md             # Estados e transicoes
```

---

## Principios Gerais

### 1. Vocabulario do Usuario

O sistema deve falar a lingua do usuario. "Nova consulta" e melhor que "Novo evento" em uma clinica.

### 2. Permissoes Derivam do Negocio

Nao assuma roles fixos (admin, user). Descubra quem faz o que no negocio real.

### 3. Mobile-First

Todo modulo deve funcionar bem em dispositivos moveis. Desktop e bonus, nao requisito.

### 4. Menos e Mais

Cada modulo deve resolver UM problema bem. Evite modulos que fazem tudo.

### 5. Descoberta Antes de Implementacao

Pergunte antes de codar. Um modulo bem projetado economiza retrabalho.

---

## Teste Acido

Apos usar qualquer documento, pergunte:

> "Se eu aplicar isso para um app de [academia/escola/marinha/delivery], faz sentido?"

Se a resposta for "nao", o documento esta muito especifico.
