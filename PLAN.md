# Plan Format

Formato de planos de execução para implementação guiada por IA.

---

## Propósito

O PLAN.md é o **elo entre specs e implementação**:

```
specs/features/     →    PLAN.md           →    código
(o que fazer)            (checklist)            (feito)
US-AUTH-001              - [ ] Tarefa           app/src/...
```

A IA lê o plano, pega uma tarefa, consulta as referências nas specs, e implementa.

---

## Regra de Ouro

> **O plano é um checklist, não documentação.**

A IA tende a ser prolixa e redocumentar o sistema no plano. Isso é **problemático**:
- Duplica informação (specs vs plano)
- Dificulta manutenção (alterar spec não atualiza plano)
- Polui o contexto da IA

**ERRADO:**
```markdown
## Fase 1: Autenticação

### Implementar login

O sistema de login deve permitir que usuários se autentiquem
usando email e senha. O fluxo consiste em...

- [ ] Criar página de login com campos email e senha
- [ ] Implementar validação de campos obrigatórios
- [ ] Criar endpoint POST /api/auth/login
...
```

**CERTO:**
```markdown
## Fase 1: Autenticação

- [ ] Implementar login (US-AUTH-001, REQ-AUTH-001)
- [ ] Implementar logout (US-AUTH-002, REQ-AUTH-002)
- [ ] Adicionar proteção de rotas (REQ-AUTH-003)
```

A descrição detalhada está nas specs. O plano só referencia.

---

## Formato

### Estrutura

```markdown
- [status] FASE N: Nome da Fase
  - [status] Tarefa
    - REF001: Nome da referência
    - REF002: Nome da referência
    - NOTA: Observação breve (opcional)
    - Implementado: caminho/arquivo (opcional)
```

### Estados

| Símbolo | Estado | Uso |
|---------|--------|-----|
| `[ ]` | Pending | Tarefa não iniciada |
| `[>]` | Pending | Alternativa para pending |
| `[-]` | In Progress | IA trabalhando nesta tarefa |
| `[x]` | Done | Tarefa concluída |
| `[!]` | Blocked | Tarefa bloqueada (dependência, dúvida) |

### Referências

Toda tarefa DEVE ter referências às specs como sub-itens:

```markdown
- [x] FASE 2: CANAL (WhatsApp Gateway)
  - [x] Configurar webhook para BACKBONE
    - DES-CANAL-001: Evolution Webhook Configuration
    - REQ-CANAL-001: Webhook Dispatch
    - NOTA: Webhook requer URL pública
  - [x] Implementar recepção de mensagens
    - REQ-CANAL-002: Message Reception
    - US-CANAL-001: Patient First Contact
    - Implementado: workflows/message-handler.json
  - [ ] Implementar envio de mensagens
    - REQ-CANAL-003: Message Sending
```

Tipos de referência:
- `US-{FEAT}-001: Nome` - User Story
- `REQ-{FEAT}-001: Nome` - Requirement (funcional ou não-funcional)
- `DES-{FEAT}-001: Nome` - Design Decision

Metadados opcionais:
- `NOTA: texto` - Observação importante
- `Implementado: caminho` - Onde foi implementado
- `Workflow: arquivo.json` - Workflow relacionado

---

## Fluxo de Trabalho

### 1. Criar Plano

A partir das specs, criar plano com fases e tarefas:

```markdown
- [ ] FASE 1: Setup
  - [ ] Configurar projeto Next.js
    - DES-STACK-001: Portal Technology Stack
  - [ ] Configurar banco de dados
    - DES-STACK-002: Database Architecture
    - REQ-INFRA-001: Docker Deployment

- [ ] FASE 2: Autenticação
  - [ ] Implementar login
    - US-AUTH-001: User Login
    - REQ-AUTH-001: Rate Limiting
  - [ ] Implementar logout
    - US-AUTH-002: User Logout
  - [ ] Proteger rotas autenticadas
    - REQ-AUTH-003: Route Protection

- [ ] FASE 3: Agendamentos
  - [ ] Listar horários disponíveis
    - US-APPT-001: Book Appointment
    - REQ-APPT-001: Availability Query
  - [ ] Criar agendamento
    - REQ-APPT-002: Appointment Creation
  - [ ] Cancelar agendamento
    - US-APPT-002: Cancel Appointment
```

### 2. Executar Tarefa

A IA:
1. Marca tarefa como `[-]` in progress
2. Lê as referências nas specs (US-APPT-001, REQ-APPT-001, etc.)
3. Implementa baseado nas specs
4. Adiciona metadado `Implementado:` quando concluir
5. Marca como `[x]` done

```markdown
- [x] FASE 3: Agendamentos
  - [x] Listar horários disponíveis
    - US-APPT-001: Book Appointment
    - REQ-APPT-001: Availability Query
    - Implementado: app/api/availability/route.ts
  - [-] Criar agendamento  ← trabalhando
    - REQ-APPT-002: Appointment Creation
  - [ ] Cancelar agendamento
    - US-APPT-002: Cancel Appointment
```

### 3. Pausar e Resumir

O plano permite pausar e retomar:
- Estado salvo no arquivo
- IA lê plano e continua de onde parou
- Contexto preservado pelas referências
- Metadados `Implementado:` ajudam na retomada

---

## Múltiplos Planos

Para projetos grandes, usar múltiplos arquivos:

```
plan/
├── PLAN-MVP.md           # Plano do MVP
├── PLAN-V2.md            # Plano da versão 2
└── PLAN-HOTFIX.md        # Correções urgentes
```

Ou na raiz:
```
PLAN.md                   # Plano atual/principal
PLAN-DONE.md              # Arquivo de planos concluídos
```

---

## Tarefas Bloqueadas

Quando uma tarefa está bloqueada, documentar o motivo brevemente:

```markdown
- [!] Integrar Google Calendar (REQ-APPT-003) - aguardando credenciais
- [!] Deploy staging (REQ-INFRA-002) - servidor indisponível
```

O bloqueio deve ser resolvido fora do plano (conversa, pesquisa, etc.).

---

## Subtarefas

Use subtarefas para quebrar tarefas complexas:

```markdown
- [-] Implementar fluxo de agendamento (US-APPT-001)
  - [x] Criar UI de seleção de horário
  - [-] Implementar endpoint de criação
  - [ ] Adicionar confirmação por WhatsApp
```

Manter máximo 2 níveis de profundidade.

---

## Template

```markdown
- [ ] FASE 1: [Nome da Fase]
  - [ ] [Tarefa]
    - [REF001]: [Nome da referência]
    - [REF002]: [Nome da referência]
  - [ ] [Tarefa]
    - [REF003]: [Nome da referência]

- [ ] FASE 2: [Nome da Fase]
  - [ ] [Tarefa]
    - [REF004]: [Nome da referência]
```

---

## Anti-patterns

**NÃO faça:**

```markdown
❌ Tarefas sem referências
- [ ] FASE 1: Setup
  - [ ] Implementar login
  - [ ] Criar banco de dados

❌ Descrições longas na tarefa
- [ ] FASE 1: Autenticação
  - [ ] Implementar sistema de login que permita ao usuário
        se autenticar usando email e senha, com validação...

❌ Redocumentar specs no plano
- [ ] FASE 1: Autenticação
  O módulo de autenticação é responsável por validar
  credenciais do usuário e gerar tokens JWT...
  - [ ] Criar página de login
```

**FAÇA:**

```markdown
✅ Tarefas com referências como sub-itens
- [ ] FASE 1: Autenticação
  - [ ] Implementar login
    - US-AUTH-001: User Login
    - REQ-AUTH-001: Rate Limiting
  - [ ] Implementar logout
    - US-AUTH-002: User Logout

✅ Metadados após conclusão
- [x] FASE 1: Autenticação
  - [x] Implementar login
    - US-AUTH-001: User Login
    - REQ-AUTH-001: Rate Limiting
    - Implementado: app/api/auth/login/route.ts
```

---

## Checklist: Plano Bem Escrito

- [ ] Todas as tarefas têm referências às specs?
- [ ] Nenhuma tarefa tem descrição longa?
- [ ] Não há redocumentação de specs?
- [ ] Fases estão em ordem lógica de execução?
- [ ] Subtarefas têm máximo 2 níveis?
