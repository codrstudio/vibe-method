# Permissions

Controle de acesso e autorizacao.

---

## O Problema Universal

Nem todos podem ver ou fazer tudo. Admin configura o sistema. Operador executa tarefas. Visualizador apenas ve. Sem controle de acesso, ou tudo fica aberto (inseguro) ou fechado demais (improdutivo).

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Quais papeis existem na operacao?**
   - Nao assuma admin/user. Pergunte ao cliente.
   - Quais funcoes diferentes existem no dia a dia?
   - Medico, recepcionista, gestor, diretor?

2. **O que cada papel precisa fazer?**
   - Listar as tarefas de cada funcao
   - O que cada um faz no dia a dia?

3. **O que cada papel NAO deve ver/fazer?**
   - Recepcionista ve dados financeiros?
   - Operador configura o sistema?

4. **Existe hierarquia?**
   - Gestor pode tudo que operador pode?
   - Admin e "super" de todos?

5. **Permissoes sao fixas ou configuraveis?**
   - Predefinidas por papel?
   - Admin pode criar papeis customizados?

6. **Existe escopo?**
   - Medico ve apenas seus pacientes?
   - Gestor ve apenas sua unidade?

---

## Modelos de Permissao

### 1. Role-Based (RBAC)

Permissoes atribuidas a papeis. Usuario herda do papel.

```
PAPEIS:
- Admin: todas as permissoes
- Gestor: operacao + metricas
- Operador: apenas operacao
- Visualizador: apenas leitura

USUARIOS:
- Maria (Operador) → pode: ver agenda, criar agendamento
- Joao (Gestor) → pode: tudo de operador + ver metricas
- Carlos (Admin) → pode: tudo
```

**Quando usar:** Maioria dos sistemas. Simples e suficiente.

### 2. Permission-Based

Permissoes atribuidas diretamente a usuarios.

```
PERMISSOES:
- appointments:read
- appointments:create
- appointments:update
- appointments:delete
- metrics:read
- settings:manage

USUARIOS:
- Maria: appointments:read, appointments:create
- Joao: appointments:*, metrics:read
- Carlos: *
```

**Quando usar:** Sistemas que precisam de granularidade fina.

### 3. Hibrido (Role + Permissions)

Papel define base, permissoes individuais ajustam.

```
PAPEIS COM PERMISSOES BASE:
- Operador: appointments:read, appointments:create
- Gestor: Operador + metrics:read

USUARIOS:
- Maria (Operador) → base do papel
- Joao (Operador) + metrics:read → papel + extra
- Carlos (Gestor) - appointments:delete → papel - remocao
```

**Quando usar:** Quando regras base nao atendem todos os casos.

### 4. Attribute-Based (ABAC)

Permissoes baseadas em atributos do contexto.

```
REGRAS:
- Medico pode ver pacientes SE paciente.medico_id == medico.id
- Gestor pode ver metricas SE metrica.unidade_id == gestor.unidade_id
- Operador pode editar agendamento SE agendamento.created_by == operador.id

CONTEXTO:
- Quem esta pedindo (usuario)
- O que esta pedindo (recurso)
- Relacao entre eles
```

**Quando usar:** Multi-tenant, escopo por unidade, dados sensiveis.

---

## Anatomia de Permissoes

### Estrutura Basica

```
RECURSO      ACAO       PAPEL
────────────────────────────────────
appointments read       operador, gestor, admin
appointments create     operador, gestor, admin
appointments update     operador, gestor, admin
appointments delete     gestor, admin
metrics      read       gestor, admin
settings     manage     admin
users        manage     admin
```

### Matriz de Permissoes

| Recurso | Acao | Admin | Gestor | Operador | Visualizador |
|---------|------|-------|--------|----------|--------------|
| **Timeline** | ver | ✓ | ✓ | ✓ | ✓ |
| **Timeline** | criar | ✓ | ✓ | ✓ | - |
| **Timeline** | editar | ✓ | ✓ | ✓ | - |
| **Timeline** | deletar | ✓ | ✓ | - | - |
| **Inbox** | ver | ✓ | ✓ | ✓ | - |
| **Inbox** | assumir | ✓ | ✓ | ✓ | - |
| **Inbox** | resolver | ✓ | ✓ | ✓ | - |
| **Pulse** | ver | ✓ | ✓ | - | - |
| **Pulse** | exportar | ✓ | ✓ | - | - |
| **Settings** | ver | ✓ | - | - | - |
| **Settings** | editar | ✓ | - | - | - |
| **Users** | ver | ✓ | - | - | - |
| **Users** | gerenciar | ✓ | - | - | - |

---

## Variacoes por Dominio

| Dominio | Papeis Tipicos | Escopo |
|---------|---------------|--------|
| **Clinica** | Admin, Gestor, Recepcionista, Medico | Por profissional |
| **Escola** | Admin, Diretor, Coordenador, Professor, Secretaria | Por turma/serie |
| **E-commerce** | Admin, Gerente, Vendedor, Atendente | Por loja |
| **SaaS** | Owner, Admin, Member, Viewer | Por workspace |
| **Multi-tenant** | Super Admin, Tenant Admin, User | Por tenant |

### Papeis por Dominio

**Clinica:**
```
Admin: Tudo
Gestor: Operacao + Metricas + Usuarios (leitura)
Recepcionista: Timeline + Inbox + Pacientes
Medico: Seus pacientes + Sua agenda
```

**Escola:**
```
Admin: Tudo
Diretor: Tudo exceto configuracoes tecnicas
Coordenador: Por serie/nivel
Professor: Suas turmas + Notas
Secretaria: Matriculas + Documentos
```

**E-commerce:**
```
Admin: Tudo
Gerente: Pedidos + Produtos + Relatorios
Vendedor: Pedidos + Clientes
Atendente: Clientes + Tickets
```

---

## Implementacao

### Verificacao no Frontend

```typescript
// Componente que verifica permissao
function CanAccess({ permission, children }) {
  const { user } = useAuth();

  if (!hasPermission(user, permission)) {
    return null; // ou componente de "sem acesso"
  }

  return children;
}

// Uso
<CanAccess permission="settings:manage">
  <SettingsButton />
</CanAccess>
```

### Verificacao no Backend

```typescript
// Middleware de permissao
function requirePermission(permission: string) {
  return (req, res, next) => {
    const user = req.user;

    if (!hasPermission(user, permission)) {
      return res.status(403).json({
        code: 403,
        message: 'Sem permissao para esta acao',
        reason: 'FORBIDDEN'
      });
    }

    next();
  };
}

// Uso na rota
app.delete('/api/appointments/:id',
  requirePermission('appointments:delete'),
  deleteAppointment
);
```

### Verificacao com Escopo

```typescript
// Verificar se usuario pode acessar ESTE recurso especifico
async function canAccessAppointment(user, appointmentId) {
  const appointment = await getAppointment(appointmentId);

  // Admin pode tudo
  if (user.role === 'admin') return true;

  // Medico so ve seus proprios
  if (user.role === 'medico') {
    return appointment.provider_id === user.provider_id;
  }

  // Operador ve todos da clinica
  if (user.role === 'operador') {
    return appointment.clinic_id === user.clinic_id;
  }

  return false;
}
```

---

## Principios de Design

### 1. Deny by Default

Se permissao nao foi explicitamente concedida, negar. Nunca assumir que pode.

### 2. Frontend Esconde, Backend Bloqueia

Frontend pode esconder botoes, mas backend DEVE verificar. Usuario pode burlar frontend.

### 3. Minimo Privilegio

Usuario deve ter apenas as permissoes necessarias para sua funcao. Nao dar "admin" para todo mundo.

### 4. Auditoria

Registrar quem fez o que, quando. Especialmente acoes sensiveis.

### 5. Papeis do Dominio

Use nomes que o cliente entende. "Recepcionista" e melhor que "Operator Level 2".

### 6. Nao Hardcodar Roles

Evite `if (user.role === 'admin')`. Prefira `if (hasPermission(user, 'settings:manage'))`.

---

## Anti-patterns

### "if (user.role === 'admin')"
**Problema:** Hardcoded. Dificil de manter.
**Solucao:** Verificar permissao, nao papel diretamente.

### "Apenas no frontend"
**Problema:** Botao escondido mas API aberta.
**Solucao:** SEMPRE verificar no backend.

### "Todos sao admin"
**Problema:** Sem controle real.
**Solucao:** Definir papeis realistas desde o inicio.

### "Permissoes muito granulares"
**Problema:** 200 permissoes individuais. Impossivel gerenciar.
**Solucao:** Agrupar em papeis. Granularidade apenas onde necessario.

### "Papel unico: admin e user"
**Problema:** Nao reflete a realidade do negocio.
**Solucao:** Descobrir papeis reais com o cliente.

### "Sem escopo"
**Problema:** Medico ve pacientes de outros medicos.
**Solucao:** Implementar escopo (ver apenas "seus" recursos).

---

## Exemplo: Permissoes de Clinica

```
PAPEIS E PERMISSOES:

ADMIN
├── appointments:* (criar, ver, editar, deletar)
├── patients:* (criar, ver, editar, deletar)
├── inbox:* (ver, assumir, resolver, atribuir)
├── metrics:* (ver, exportar)
├── settings:* (clinica, usuarios, integracoes)
└── users:* (criar, editar, desativar)

GESTOR
├── appointments:* (criar, ver, editar, deletar)
├── patients:* (criar, ver, editar)
├── inbox:* (ver, assumir, resolver, atribuir)
├── metrics:read (apenas visualizar)
├── users:read (apenas visualizar)
└── automations:read (apenas visualizar)

RECEPCIONISTA
├── appointments:create, read, update
├── patients:create, read, update
├── inbox:read, claim, resolve
└── automations:read

MEDICO (com escopo)
├── appointments:read (apenas seus)
├── patients:read (apenas seus)
└── inbox:read (apenas seus)


MATRIZ VISUAL:

┌─────────────────┬───────┬────────┬──────────────┬────────┐
│ Funcionalidade  │ Admin │ Gestor │ Recepcionista│ Medico │
├─────────────────┼───────┼────────┼──────────────┼────────┤
│ Timeline        │       │        │              │        │
│  ├─ Ver         │   ✓   │   ✓    │      ✓       │ ✓ (1)  │
│  ├─ Criar       │   ✓   │   ✓    │      ✓       │   -    │
│  ├─ Editar      │   ✓   │   ✓    │      ✓       │   -    │
│  └─ Deletar     │   ✓   │   ✓    │      -       │   -    │
├─────────────────┼───────┼────────┼──────────────┼────────┤
│ Inbox           │       │        │              │        │
│  ├─ Ver         │   ✓   │   ✓    │      ✓       │ ✓ (1)  │
│  ├─ Assumir     │   ✓   │   ✓    │      ✓       │   -    │
│  ├─ Resolver    │   ✓   │   ✓    │      ✓       │   -    │
│  └─ Atribuir    │   ✓   │   ✓    │      -       │   -    │
├─────────────────┼───────┼────────┼──────────────┼────────┤
│ Pulse           │       │        │              │        │
│  ├─ Ver         │   ✓   │   ✓    │      -       │   -    │
│  └─ Exportar    │   ✓   │   ✓    │      -       │   -    │
├─────────────────┼───────┼────────┼──────────────┼────────┤
│ Automations     │       │        │              │        │
│  ├─ Ver         │   ✓   │   ✓    │      ✓       │   -    │
│  └─ Configurar  │   ✓   │   -    │      -       │   -    │
├─────────────────┼───────┼────────┼──────────────┼────────┤
│ Settings        │       │        │              │        │
│  ├─ Ver         │   ✓   │   -    │      -       │   -    │
│  └─ Editar      │   ✓   │   -    │      -       │   -    │
├─────────────────┼───────┼────────┼──────────────┼────────┤
│ Users           │       │        │              │        │
│  ├─ Ver         │   ✓   │   ✓    │      -       │   -    │
│  └─ Gerenciar   │   ✓   │   -    │      -       │   -    │
└─────────────────┴───────┴────────┴──────────────┴────────┘

(1) = Com escopo (apenas seus proprios pacientes/consultas)


VERIFICACAO DE ESCOPO (Medico):

// Medico so ve consultas onde ele eh o provider
async function getAppointmentsForDoctor(userId) {
  const user = await getUser(userId);

  return db.appointments.findMany({
    where: {
      provider_id: user.provider_id  // Escopo: apenas seus
    }
  });
}

// Medico so ve pacientes que ja atendeu
async function getPatientsForDoctor(userId) {
  const user = await getUser(userId);

  return db.patients.findMany({
    where: {
      appointments: {
        some: {
          provider_id: user.provider_id
        }
      }
    }
  });
}
```
