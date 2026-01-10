# States

Maquinas de estado e transicoes.

---

## O Problema Universal

Entidades em sistemas tem ciclo de vida. Um pedido comeca como "novo", vai para "em processamento", e termina "entregue" ou "cancelado". Sem estados bem definidos, a logica fica espalhada, bugs aparecem, e usuarios ficam confusos sobre o que significa cada situacao.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Quais entidades tem ciclo de vida?**
   - Agendamento? (agendado → confirmado → realizado)
   - Tarefa? (pendente → em andamento → concluido)
   - Pedido? (novo → pago → enviado → entregue)
   - Usuario? (ativo → inativo)

2. **Quais sao os estados possiveis?**
   - Liste todos os estados para cada entidade
   - Existe estado inicial obrigatorio?
   - Existe estado final (terminal)?

3. **Quais transicoes sao permitidas?**
   - De quais estados pode ir para quais?
   - Existem transicoes proibidas?
   - Pode voltar para estado anterior?

4. **Quem pode fazer cada transicao?**
   - Usuario comum?
   - Sistema automaticamente?
   - Apenas admin?

5. **O que acontece em cada transicao?**
   - Notificacao?
   - Atualizacao de dados?
   - Trigger de outro processo?

6. **Como visualizar o estado?**
   - Cor? Icone? Badge?
   - Consistente em todo o sistema?

---

## Anatomia de Estados

### Componentes

```
ESTADO
├── Nome (identificador tecnico): "confirmed"
├── Label (exibicao): "Confirmado"
├── Cor: azul
├── Icone: ●
├── Descricao: "Cliente confirmou presenca"
└── Terminal: false

TRANSICAO
├── De: "scheduled"
├── Para: "confirmed"
├── Acao: "confirm"
├── Quem pode: ["system", "operador", "cliente"]
└── Side effects: ["enviar_notificacao", "atualizar_metricas"]
```

### Diagrama de Estados

```
         ┌─────────────┐
         │   INICIAL   │
         │ (scheduled) │
         └──────┬──────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌───────────────┐  ┌───────────────┐
│  CONFIRMADO   │  │   CANCELADO   │
│  (confirmed)  │  │  (cancelled)  │
└───────┬───────┘  └───────────────┘
        │                 ▲
        │                 │
┌───────┴───────┐         │
│               │         │
▼               ▼         │
┌───────────────┐  ┌──────┴────────┐
│   REALIZADO   │  │     FALTA     │
│  (completed)  │  │   (no_show)   │
└───────────────┘  └───────────────┘
```

---

## Exemplos por Dominio

### Agendamento (Clinica)

```
ESTADOS:
- scheduled (Agendado) - Amarelo
- confirmed (Confirmado) - Azul
- completed (Realizado) - Verde
- no_show (Falta) - Vermelho
- cancelled (Cancelado) - Cinza

TRANSICOES:
scheduled → confirmed  (cliente confirma ou sistema confirma)
scheduled → cancelled  (cliente ou operador cancela)
confirmed → completed  (operador marca como realizado)
confirmed → no_show    (operador marca como falta)
confirmed → cancelled  (cliente ou operador cancela)

REGRAS:
- Cancelamento ate X horas antes
- Falta so pode ser registrada apos horario
- Realizado so pode ser marcado no dia
```

### Tarefa (Inbox)

```
ESTADOS:
- pending (Pendente) - Amarelo
- in_progress (Em Andamento) - Azul
- resolved (Resolvido) - Verde
- discarded (Descartado) - Cinza

TRANSICOES:
pending → in_progress  (operador assume)
pending → discarded    (operador descarta)
in_progress → resolved (operador resolve)
in_progress → pending  (operador devolve)
in_progress → discarded (operador descarta)

REGRAS:
- Assumir atribui ao operador
- Resolver requer comentario (opcional)
- Descartar requer motivo
```

### Pedido (E-commerce)

```
ESTADOS:
- pending_payment (Aguardando Pagamento)
- paid (Pago)
- processing (Em Preparacao)
- shipped (Enviado)
- delivered (Entregue)
- cancelled (Cancelado)
- refunded (Reembolsado)

TRANSICOES:
pending_payment → paid       (gateway confirma)
pending_payment → cancelled  (timeout ou cliente)
paid → processing           (operador inicia)
paid → cancelled            (cliente ou admin)
paid → refunded             (admin)
processing → shipped        (operador despacha)
shipped → delivered         (transportadora confirma)
delivered → refunded        (admin - devolucao)

REGRAS:
- Cancelamento so ate "processing"
- Reembolso so apos pagamento
- Entrega confirma automaticamente apos X dias
```

### Usuario

```
ESTADOS:
- pending (Pendente) - aguardando ativacao
- active (Ativo) - pode usar sistema
- suspended (Suspenso) - bloqueado temporariamente
- inactive (Inativo) - desativado permanentemente

TRANSICOES:
pending → active      (ativa conta)
active → suspended    (admin suspende)
active → inactive     (admin desativa)
suspended → active    (admin reativa)
suspended → inactive  (admin desativa)

REGRAS:
- Usuario nao pode desativar a si mesmo
- Inativo e soft delete (dados preservados)
```

---

## Implementacao

### Enum de Estados

```typescript
// Estados como enum
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled'
}

// Metadados dos estados
export const APPOINTMENT_STATUS_META = {
  [AppointmentStatus.SCHEDULED]: {
    label: 'Agendado',
    color: 'yellow',
    icon: '○',
    terminal: false
  },
  [AppointmentStatus.CONFIRMED]: {
    label: 'Confirmado',
    color: 'blue',
    icon: '●',
    terminal: false
  },
  [AppointmentStatus.COMPLETED]: {
    label: 'Realizado',
    color: 'green',
    icon: '✓',
    terminal: true
  },
  [AppointmentStatus.NO_SHOW]: {
    label: 'Falta',
    color: 'red',
    icon: '✗',
    terminal: true
  },
  [AppointmentStatus.CANCELLED]: {
    label: 'Cancelado',
    color: 'gray',
    icon: '-',
    terminal: true
  }
};
```

### Maquina de Estados

```typescript
// Transicoes permitidas
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED
  ],
  [AppointmentStatus.COMPLETED]: [], // Terminal
  [AppointmentStatus.NO_SHOW]: [],   // Terminal
  [AppointmentStatus.CANCELLED]: []  // Terminal
};

// Verificar se transicao e valida
function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

// Executar transicao
async function transition(
  appointment: Appointment,
  newStatus: AppointmentStatus,
  userId: string
): Promise<Appointment> {
  if (!canTransition(appointment.status, newStatus)) {
    throw new Error(
      `Transicao invalida: ${appointment.status} → ${newStatus}`
    );
  }

  // Atualizar status
  const updated = await db.appointment.update({
    where: { id: appointment.id },
    data: {
      status: newStatus,
      updated_at: new Date(),
      updated_by: userId
    }
  });

  // Side effects
  await handleTransitionEffects(appointment, newStatus);

  // Log de auditoria
  await logTransition(appointment.id, appointment.status, newStatus, userId);

  return updated;
}
```

### Side Effects por Transicao

```typescript
async function handleTransitionEffects(
  appointment: Appointment,
  newStatus: AppointmentStatus
) {
  switch (newStatus) {
    case AppointmentStatus.CONFIRMED:
      // Enviar confirmacao ao paciente
      await sendConfirmationNotification(appointment);
      break;

    case AppointmentStatus.CANCELLED:
      // Liberar horario, notificar interessados
      await releaseTimeSlot(appointment);
      await notifyCancellation(appointment);
      break;

    case AppointmentStatus.NO_SHOW:
      // Atualizar metricas, possivel bloqueio
      await recordNoShow(appointment);
      await checkPatientNoShowCount(appointment.patient_id);
      break;

    case AppointmentStatus.COMPLETED:
      // Atualizar metricas de ocupacao
      await updateOccupancyMetrics(appointment);
      break;
  }
}
```

### Componente de Status

```tsx
// Badge de status reutilizavel
function StatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = APPOINTMENT_STATUS_META[status];

  return (
    <span className={`badge badge-${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

// Dropdown de transicao
function StatusTransition({
  appointment,
  onTransition
}: {
  appointment: Appointment;
  onTransition: (status: AppointmentStatus) => void;
}) {
  const availableTransitions = TRANSITIONS[appointment.status];

  if (availableTransitions.length === 0) {
    return <StatusBadge status={appointment.status} />;
  }

  return (
    <select
      value={appointment.status}
      onChange={(e) => onTransition(e.target.value as AppointmentStatus)}
    >
      <option value={appointment.status}>
        {APPOINTMENT_STATUS_META[appointment.status].label}
      </option>
      {availableTransitions.map((status) => (
        <option key={status} value={status}>
          → {APPOINTMENT_STATUS_META[status].label}
        </option>
      ))}
    </select>
  );
}
```

---

## Principios de Design

### 1. Estados Explicitos

Cada estado deve ter significado claro. "Em processamento" e vago. "Aguardando pagamento" e preciso.

### 2. Transicoes Controladas

Nao permitir pular estados. Se precisa ir de A para C, passar por B. Exceto se realmente fizer sentido pular.

### 3. Estados Terminais

Identificar estados finais (sem transicoes de saida). Ajuda a entender o ciclo de vida.

### 4. Consistencia Visual

Mesma cor/icone para mesmo tipo de estado em todo o sistema. Verde = sucesso. Vermelho = problema.

### 5. Auditoria de Transicoes

Registrar quem mudou, quando, de qual para qual. Essencial para debug e compliance.

### 6. Regras de Negocio na Transicao

Validacoes devem estar na funcao de transicao, nao espalhadas pelo codigo.

---

## Anti-patterns

### "Status como string livre"
**Problema:** Qualquer valor pode ser salvo. Typos, inconsistencia.
**Solucao:** Enum com valores fixos.

### "Transicao sem validacao"
**Problema:** `appointment.status = 'completed'` direto.
**Solucao:** Funcao de transicao que valida.

### "Estados demais"
**Problema:** 15 estados, ninguem entende a diferenca.
**Solucao:** Comecar com o minimo. Adicionar apenas quando necessario.

### "Cores inconsistentes"
**Problema:** Verde significa "ativo" em um lugar, "pendente" em outro.
**Solucao:** Padrao de cores documentado e seguido.

### "Sem historico"
**Problema:** Nao sabe como chegou naquele estado.
**Solucao:** Log de transicoes com timestamp e usuario.

### "Regras espalhadas"
**Problema:** "Nao pode cancelar" verificado em 5 lugares diferentes.
**Solucao:** Centralizar em `canTransition()`.

---

## Exemplo: Estados Completos de Clinica

```
AGENDAMENTO
═══════════════════════════════════════════════════════════

ESTADOS:
┌────────────┬─────────────┬─────────┬───────┬──────────┐
│ Estado     │ Label       │ Cor     │ Icone │ Terminal │
├────────────┼─────────────┼─────────┼───────┼──────────┤
│ scheduled  │ Agendado    │ yellow  │ ○     │ false    │
│ confirmed  │ Confirmado  │ blue    │ ●     │ false    │
│ completed  │ Realizado   │ green   │ ✓     │ true     │
│ no_show    │ Falta       │ red     │ ✗     │ true     │
│ cancelled  │ Cancelado   │ gray    │ -     │ true     │
└────────────┴─────────────┴─────────┴───────┴──────────┘

TRANSICOES:
scheduled ──┬──> confirmed  (confirmar)
            └──> cancelled  (cancelar)

confirmed ──┬──> completed  (realizar)
            ├──> no_show    (registrar falta)
            └──> cancelled  (cancelar)

REGRAS:
- Cancelar: ate 2h antes do horario
- Registrar falta: apenas apos horario passar
- Realizar: apenas no dia do agendamento

SIDE EFFECTS:
- scheduled → confirmed: notificar paciente
- * → cancelled: liberar horario, notificar
- * → no_show: incrementar contador de faltas


TAREFA (INBOX)
═══════════════════════════════════════════════════════════

ESTADOS:
┌─────────────┬──────────────┬─────────┬───────┬──────────┐
│ Estado      │ Label        │ Cor     │ Icone │ Terminal │
├─────────────┼──────────────┼─────────┼───────┼──────────┤
│ pending     │ Pendente     │ yellow  │ ○     │ false    │
│ in_progress │ Em Andamento │ blue    │ ●     │ false    │
│ resolved    │ Resolvido    │ green   │ ✓     │ true     │
│ discarded   │ Descartado   │ gray    │ -     │ true     │
└─────────────┴──────────────┴─────────┴───────┴──────────┘

TRANSICOES:
pending ──┬──> in_progress  (assumir)
          └──> discarded    (descartar)

in_progress ──┬──> resolved   (resolver)
              ├──> pending    (devolver)
              └──> discarded  (descartar)

SIDE EFFECTS:
- pending → in_progress: atribuir a quem assumiu
- in_progress → resolved: registrar resolucao
- * → discarded: registrar motivo


USUARIO
═══════════════════════════════════════════════════════════

ESTADOS:
┌───────────┬────────────┬─────────┬───────┬──────────┐
│ Estado    │ Label      │ Cor     │ Icone │ Terminal │
├───────────┼────────────┼─────────┼───────┼──────────┤
│ pending   │ Pendente   │ yellow  │ ○     │ false    │
│ active    │ Ativo      │ green   │ ●     │ false    │
│ suspended │ Suspenso   │ orange  │ ⏸     │ false    │
│ inactive  │ Inativo    │ gray    │ -     │ true     │
└───────────┴────────────┴─────────┴───────┴──────────┘

TRANSICOES:
pending ──> active      (ativar apos primeiro login)

active ──┬──> suspended  (admin suspende)
         └──> inactive   (admin desativa)

suspended ──┬──> active   (admin reativa)
            └──> inactive (admin desativa)

REGRAS:
- Apenas admin pode suspender/desativar
- Usuario nao pode desativar a si mesmo
- Inactive eh soft delete
```
