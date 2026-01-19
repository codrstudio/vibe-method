# Análise: Derivação da Plataforma para Múltiplos Sistemas

Data: 2026-01-19

## Contexto

Reflexão sobre como a plataforma vibe-method pode servir como base para derivar múltiplos sistemas de negócio, mantendo-se alheia ao business logic.

## Projetos Analisados

| Projeto | Domínio | Stack | Motor Comum |
|---------|---------|-------|-------------|
| **Coletivos** | Atendimento + Chat + IA | Next.js 16, Socket.io, LangGraph | Auth, DB Pool, shadcn, Zustand |
| **Agiliza** | Entregas + Motoboys + Central | Next.js 16, PostgreSQL, PWA | Auth, DB Pool, shadcn, Zustand |
| **Mais Vida** | Igreja + Membros + Kids + Eventos | Next.js 14, Supabase, PWA | Auth, DB (Supabase), shadcn, React Query |
| **Interclínicas** | Clínicas + Agendamentos + WhatsApp | Next.js 16, PostgreSQL, Backbone | Auth, DB Pool, shadcn, Zustand |

---

## O Que É Motor vs Negócio

### MOTOR (igual em todos)
- Conexão PostgreSQL com pool tipado
- NextAuth/Supabase Auth com JWT + roles
- shadcn/ui components
- Layout: Sidebar + AppShell
- State: Zustand (UI) + React Query (server)
- Middleware de rotas protegidas
- Padrão de API routes

### NEGÓCIO (varia)
- Entidades (Thread, Entrega, Member, Appointment)
- Máquinas de estado (status de entrega, estado de conversa)
- Prompts de IA (triager, copilot)
- Integrações (WhatsApp, Google Calendar, Evolution)
- Permissions específicas por domínio

---

## Abordagens Consideradas

### Abordagem 1: Sistema Federado
```
plataforma (core) ←→ módulo-negócio (runtime)
```

**Problema**: Os 4 projetos mostram que a fronteira não é clara. O negócio está entrelaçado em:
- Rotas de API (`/api/threads` vs `/api/entregas`)
- Schemas de banco (tabelas específicas)
- Components de UI (forms específicos)
- Tipos TypeScript (entidades de domínio)

Criar um sistema de plugins runtime exigiria abstrações pesadas. Veja o Coletivos: o backbone tem agents de IA acoplados ao domínio de atendimento. Não dá para plugar isso.

### Abordagem 2: Referência para IA Gerar Código
```
plataforma (specs) → IA → código final
```

**Problema**: Cada projeto diverge. Mais Vida usa Supabase; os outros usam pg direto. Agiliza não tem WebSocket; Coletivos tem. A IA precisaria de regras muito precisas.

---

## A Terceira Via: Template + Artefatos

O padrão que funciona:

```
MOTOR (código)     +    ARTEFATO (declarativo)    →    SISTEMA
├── auth/               ├── schema.sql
├── db/                 ├── permissions.json
├── components/ui/      ├── entities.ts
├── hooks/              ├── prompts/
└── lib/                └── workflows/
```

### Como funcionaria com vibe-method:

**1. Scaffold como template** (não como dependência)
```bash
# Novo projeto deriva do scaffold
cp -r vibe-method/scaffold novo-projeto/
```

**2. Motor permanece estável**
```
src/lib/db/postgres.ts      # Não muda
src/lib/auth/config.ts      # Configurável via env
src/components/ui/          # shadcn padrão
```

**3. Negócio é injetado via artefatos**
```
specs/entities/             # Define entidades
specs/permissions/          # Define RBAC
database/migrations/        # Schema específico
prompts/                    # IA específica
```

**4. IA usa artefatos para gerar código**
- Lê `specs/entities/patient.ts` → gera `src/types/patient.ts`
- Lê `specs/permissions/roles.json` → gera `src/lib/permissions/matrix.ts`
- Lê `prompts/triager.md` → gera `backbone/agents/triager/`

---

## Proposta Concreta

### 1. Manter Motor Genérico
```
packages/
├── db/               # Pool, query, transaction
├── auth/             # NextAuth config genérico
├── ui/               # shadcn components
└── utils/            # Helpers genéricos
```

### 2. Definir Contratos de Artefatos
```typescript
// specs/entities.schema.ts
interface EntitySpec {
  name: string
  fields: Field[]
  states?: StateMachine
  permissions: Permission[]
}

// specs/permissions.schema.ts
interface PermissionSpec {
  roles: Role[]
  matrix: Record<Role, Permission[]>
}
```

### 3. Gerar Código via IA + Specs
```
specs/entities/appointment.yaml
    ↓ (IA gera)
src/types/appointment.ts
src/app/api/appointments/route.ts
src/components/appointments/form.tsx
database/migrations/001_appointments.sql
```

---

## Aplicando aos 4 Projetos

### Coletivos → Spec de Atendimento
```yaml
# specs/entities/thread.yaml
name: thread
fields:
  - subject: string
  - status: enum(open, pending, closed)
  - customer_id: ref(customer)
  - assigned_to: ref(user)
states:
  open → pending → closed
permissions:
  - attendant: read, update
  - admin: read, update, delete
```

### Agiliza → Spec de Entregas
```yaml
# specs/entities/delivery.yaml
name: delivery
fields:
  - client_id: ref(client)
  - motoboy_id: ref(motoboy)
  - status: enum(pendente, em_andamento, entregue, cancelada)
  - fiado: boolean
states:
  pendente → em_andamento → entregue|cancelada
```

### Mais Vida → Spec de Membros
```yaml
# specs/entities/member.yaml
name: member
fields:
  - full_name: string
  - church_status: enum(membro, visitante, congregado)
  - roles: ref[](role)
```

### Interclínicas → Spec de Agendamentos
```yaml
# specs/entities/appointment.yaml
name: appointment
fields:
  - patient_id: ref(patient)
  - provider_id: ref(provider)
  - start_at: datetime
  - status: enum(scheduled, confirmed, completed, cancelled)
```

---

## Conclusão

A abordagem que faz sentido:

1. **Plataforma = Motor + Estrutura de Artefatos**
   - Não é uma dependência runtime
   - É um template + documentação + contratos

2. **Projeto = Fork da Plataforma + Artefatos Específicos**
   - O negócio entra via specs declarativos
   - A IA gera código seguindo os padrões documentados

3. **Evolução**
   - Melhorias no motor são cherry-picked para projetos
   - Artefatos são versionados junto com o projeto
   - Não há acoplamento de runtime

**A separação perfeita não existe no código - ela existe nos artefatos declarativos que o código consome.**

---

## Próximos Passos

- [ ] Definir schema formal para EntitySpec
- [ ] Definir schema formal para PermissionSpec
- [ ] Criar skill de IA para gerar código a partir de specs
- [ ] Documentar fluxo de derivação de novo projeto
