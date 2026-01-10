# Notifications

Sistema de notificacoes e alertas.

---

## O Problema Universal

Usuarios precisam saber quando algo relevante acontece no sistema. Sem notificacoes, ficam "cegos" - perdem prazos, nao veem mensagens importantes, ignoram alertas criticos.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Quais eventos geram notificacao?**
   - Novo item na fila de trabalho?
   - Agendamento criado/alterado?
   - Mensagem recebida?
   - Alerta do sistema?
   - Tarefa atribuida?

2. **Quais canais de entrega?**
   - In-app (sino/badge)?
   - Push notification (mobile/desktop)?
   - Email?
   - WhatsApp/SMS?

3. **Usuario pode configurar?**
   - Ativar/desativar por tipo?
   - Escolher canal?
   - Definir horario (nao perturbe)?

4. **Qual a prioridade/urgencia?**
   - Tudo igual?
   - Urgente vs normal?
   - Critico (sempre notifica)?

5. **Existe agregacao?**
   - Uma notificacao por evento?
   - Resumo diario/horario?
   - Agrupar similares?

6. **Quanto tempo manter?**
   - Historico de X dias?
   - Apenas nao lidas?
   - Permanente?

---

## Anatomia

### Componentes do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  EVENTO          SISTEMA DE              CANAIS              │
│  GERADOR    ───► NOTIFICACOES    ───►   DE ENTREGA          │
│                                                              │
│  - Agendamento   - Filtra por            - In-app (sino)    │
│  - Mensagem        preferencias          - Push             │
│  - Tarefa        - Formata               - Email            │
│  - Alerta        - Roteia                - WhatsApp         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Centro de Notificacoes (In-App)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Notificacoes                              [Marcar lidas] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ HOJE                                                        │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ● Nova tarefa atribuida                        ha 5min  ││
│ │   Paciente solicitou atendente humano                   ││
│ │                                               [Ver] [x] ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ● Agendamento confirmado                       ha 1h    ││
│ │   Maria Silva confirmou consulta de amanha              ││
│ │                                               [Ver] [x] ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ONTEM                                                       │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ○ Lembrete: 3 confirmacoes pendentes          ontem     ││
│ │   Pacientes ainda nao confirmaram                       ││
│ │                                               [Ver] [x] ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [Ver todas]                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

● = nao lida    ○ = lida
```

### Configuracoes de Notificacao

```
┌─────────────────────────────────────────────────────────────┐
│ Preferencias de Notificacao                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ CANAIS                                                      │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Push notifications                              [ON]    ││
│ │ Receber alertas mesmo com app fechado                   ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Email                                           [OFF]   ││
│ │ Receber resumo por email                                ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ TIPOS DE NOTIFICACAO                                        │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Novas tarefas                                   [ON]    ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Agendamentos                                    [ON]    ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ Alertas do sistema                              [ON] 🔒 ││
│ │ (Nao pode desativar)                                    ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ HORARIO                                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Nao perturbe                                            ││
│ │ [22:00] ate [07:00]                             [ON]    ││
│ │ (Exceto alertas criticos)                               ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Variacoes por Dominio

| Aspecto | Clinica | E-commerce | Suporte | Financeiro |
|---------|---------|------------|---------|------------|
| **Eventos principais** | Agendamento, escalacao | Pedido, entrega | Ticket, resposta | Transacao, alerta |
| **Canal prioritario** | In-app + Push | Email + Push | In-app | Push + SMS |
| **Urgencia** | Escalacao = urgente | Pedido cancelado | SLA proximo | Fraude |
| **Agregacao** | Por paciente | Por pedido | Por ticket | Por conta |

### Tipos de Notificacao por Dominio

**Clinica:**
- Nova tarefa no Inbox (escalacao)
- Agendamento criado/alterado/cancelado
- Confirmacao recebida
- Paciente aguardando

**E-commerce:**
- Novo pedido
- Pagamento confirmado/recusado
- Produto despachado
- Avaliacao recebida

**Suporte:**
- Novo ticket
- Resposta do cliente
- SLA proximo de vencer
- Ticket resolvido

**Financeiro:**
- Transacao realizada
- Saldo baixo
- Pagamento recebido
- Alerta de fraude

---

## Fluxos

### Gerar Notificacao

```
1. Evento acontece no sistema (ex: novo agendamento)
2. Sistema identifica usuarios interessados:
   - Quem deve ser notificado? (owner, assignee, admin)
3. Para cada usuario:
   a. Verifica preferencias (tipo habilitado?)
   b. Verifica horario (dentro do "nao perturbe"?)
   c. Verifica canal (push habilitado?)
4. Cria registro de notificacao no banco
5. Envia para canais ativos:
   - In-app: sempre (atualiza badge)
   - Push: se habilitado e fora do "nao perturbe"
   - Email: se habilitado (pode agregar)
```

### Ler Notificacao

```
1. Usuario clica no sino (badge: 3)
2. Dropdown/drawer abre com lista
3. Usuario ve notificacoes (mais recentes primeiro)
4. Ao clicar em uma:
   - Marca como lida
   - Navega para item relacionado
5. Badge atualiza (3 → 2)
```

### Configurar Preferencias

```
1. Usuario acessa /notifications ou /profile > Notificacoes
2. Ve lista de tipos de notificacao
3. Para cada tipo, pode:
   - Ativar/desativar
   - Escolher canais (in-app, push, email)
4. Configura "nao perturbe" (opcional)
5. Salva preferencias
6. Sistema respeita nas proximas notificacoes
```

---

## Implementacao

### Modelo de Dados

```sql
-- Notificacao individual
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR NOT NULL,        -- 'task_assigned', 'appointment_created', etc
  title VARCHAR NOT NULL,
  body TEXT,
  data JSONB,                   -- {"appointment_id": "...", "action": "view"}
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);

-- Preferencias do usuario
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR NOT NULL,        -- 'task_assigned', 'appointment_created', etc
  in_app BOOLEAN DEFAULT true,
  push BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT false,
  UNIQUE(user_id, type)
);
```

### Canais de Entrega

| Canal | Quando Usar | Consideracoes |
|-------|-------------|---------------|
| **In-app** | Sempre | Badge + lista, usuario precisa estar logado |
| **Push** | Urgente | Requer permissao do navegador/app |
| **Email** | Resumos, registro | Pode demorar, usuario pode ignorar |
| **WhatsApp/SMS** | Critico | Custo, usar com moderacao |

### Push Notifications

```javascript
// Verificar suporte
if ('Notification' in window) {
  // Pedir permissao
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Registrar service worker
    // Inscrever para push
  }
}

// Enviar (backend)
webpush.sendNotification(subscription, JSON.stringify({
  title: 'Nova tarefa',
  body: 'Paciente solicitou atendente humano',
  icon: '/icon-192.png',
  data: { url: '/inbox/123' }
}));
```

---

## Principios de Design

### 1. Relevancia Acima de Volume

Notificacao que ninguem le e ruido. Notifique apenas o que importa para aquele usuario.

### 2. Acao Clara

Notificacao deve ter acao: "Ver tarefa", "Confirmar", "Responder". Nao apenas informar.

### 3. Agregacao Inteligente

"5 novos agendamentos" e melhor que 5 notificacoes separadas. Agrupe quando fizer sentido.

### 4. Respeitar Preferencias

Se usuario desativou, nao envie. Se esta no "nao perturbe", adie (exceto critico).

### 5. Feedback Visual

Badge no sino mostrando quantas nao lidas. Usuario sabe se precisa olhar sem abrir.

### 6. Persistencia

Notificacoes devem ser acessiveis depois. Usuario pode querer rever. Manter historico.

---

## Anti-patterns

### "Notificar tudo"
**Problema:** Fadiga de notificacao, usuario ignora.
**Solucao:** Apenas eventos importantes e acionaveis.

### "Push sem permissao"
**Problema:** Usuario nunca autorizou, notificacao nao chega.
**Solucao:** Pedir permissao de forma contextual, explicar beneficio.

### "Sem configuracao"
**Problema:** Usuario nao consegue ajustar.
**Solucao:** Permitir ativar/desativar por tipo e canal.

### "Notificacao sem contexto"
**Problema:** "Nova mensagem" - de quem? sobre o que?
**Solucao:** Incluir contexto: "Nova mensagem de Maria sobre consulta".

### "Links quebrados"
**Problema:** Clica na notificacao e vai para erro 404.
**Solucao:** Verificar que item existe antes de criar notificacao.

### "Spam de email"
**Problema:** 50 emails por dia.
**Solucao:** Agregar em resumo diario/horario.

---

## Exemplo: Notificacoes de Clinica

```
TIPOS DE NOTIFICACAO:

| Tipo | Titulo | Corpo | Canais Padrao |
|------|--------|-------|---------------|
| task_created | Nova tarefa | {paciente} solicitou atendente | in-app, push |
| task_assigned | Tarefa atribuida | Voce foi designado para {tarefa} | in-app, push |
| appointment_created | Novo agendamento | {paciente} agendou para {data} | in-app |
| appointment_confirmed | Agendamento confirmado | {paciente} confirmou consulta | in-app |
| appointment_cancelled | Agendamento cancelado | {paciente} cancelou consulta | in-app, push |
| system_alert | Alerta do sistema | {descricao do alerta} | in-app, push (forcado) |


DROPDOWN DE NOTIFICACOES:
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Notificacoes (3)                          [Marcar lidas]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ● Nova tarefa                                      ha 2min │
│   Maria Silva solicitou atendente humano                   │
│   → Escalar reclamacao sobre atraso                        │
│                                                   [Ver] [x]│
│ ─────────────────────────────────────────────────────────  │
│ ● Agendamento cancelado                           ha 15min │
│   Joao Pereira cancelou consulta de amanha                 │
│   → Horario 14:30 com Dr. Carlos liberado                  │
│                                                   [Ver] [x]│
│ ─────────────────────────────────────────────────────────  │
│ ● Confirmacao recebida                            ha 30min │
│   Ana Costa confirmou consulta de amanha                   │
│   → 09:00 com Dra. Ana                                     │
│                                                   [Ver] [x]│
│ ─────────────────────────────────────────────────────────  │
│ ○ Resumo do dia                                   ontem    │
│   12 agendamentos, 2 cancelamentos, 1 falta                │
│                                                   [Ver] [x]│
│                                                             │
│ [Ver todas as notificacoes]                                │
└─────────────────────────────────────────────────────────────┘


PREFERENCIAS:
┌─────────────────────────────────────────────────────────────┐
│ Preferencias de Notificacao                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ TAREFAS                                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Nova tarefa criada                       [In-app] [Push]││
│ │ Tarefa atribuida a mim                   [In-app] [Push]││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ AGENDAMENTOS                                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Novo agendamento                         [In-app] [ ]   ││
│ │ Agendamento confirmado                   [In-app] [ ]   ││
│ │ Agendamento cancelado                    [In-app] [Push]││
│ │ Falta registrada                         [In-app] [Push]││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ SISTEMA                                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Alertas do sistema                       [In-app] [Push]││
│ │ (Obrigatorio - nao pode desativar)              🔒      ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ HORARIO                                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [x] Ativar modo "Nao perturbe"                          ││
│ │     Das [22:00] ate [07:00]                             ││
│ │     (Alertas criticos ignoram esta configuracao)        ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                             [Salvar]        │
└─────────────────────────────────────────────────────────────┘
```
