# PLAN: Actions Compliance

Refatoracao para garantir que todas as mutations passem pela camada Actions.

**Regra fundamental**: TODA mutation DEVE passar pela camada Actions.

---

## Status Atual

| Componente | Conformidade |
|------------|--------------|
| Sistema Total | ~55% |
| Backbone Services | ~70% |
| Frontend API | ~30% |

---

## Checklist de Refatoracao

### 1. [ ] `backbone/services/notifications` - CRUD direto sem Actions

**Problema**: Notifications service faz mutations diretas sem actions correspondentes no catalogo.

**Arquivos afetados**:
- `apps/backbone/src/services/notifications/repository.ts`
- `apps/backbone/src/services/notifications/service.ts`

**Mutations encontradas**:
```typescript
repository.create(data)
repository.update(id, userId, data)
repository.markRead(n.id, userId)
repository.delete(id, userId)
```

**Actions a criar**:
- [ ] `notifications.create` - Criar notificacao
- [ ] `notifications.update` - Atualizar notificacao
- [ ] `notifications.markAsRead` - Marcar como lida
- [ ] `notifications.markAllAsRead` - Marcar todas como lidas
- [ ] `notifications.delete` - Deletar notificacao

**Decisao pendente**: Notifications sao efeitos colaterais de outras actions (ex: thread.create gera notificacao) ou sao actions autonomas?

---

### 2. [ ] `app/api/notifications/*` - Mutations diretas ao DB

**Problema**: Frontend API routes acessam DB diretamente sem passar pelo Backbone.

**Arquivos afetados**:
- `apps/app/app/api/notifications/route.ts`
- `apps/app/app/api/notifications/[id]/read/route.ts`
- `apps/app/app/api/notifications/read-all/route.ts`
- `apps/app/app/api/notifications/[id]/route.ts`

**Fluxo atual** (errado):
```
Frontend → app/api/notifications → DB direto
```

**Fluxo esperado**:
```
Frontend → app/api/notifications → Backbone /act/execute → Action → DB
```

**Refatoracao**:
- [ ] Criar cliente HTTP para Backbone em `apps/app/lib/backbone-client.ts`
- [ ] Refatorar routes para chamar Backbone em vez de DB direto
- [ ] Remover imports de DB/Drizzle das routes de notifications

**Decisao pendente**: Frontend deve ter conexao com DB para queries (read) ou tudo passa pelo Backbone?

---

### 3. [ ] `app/api/messages/templates/*` - Mutations diretas ao DB

**Problema**: Routes de templates fazem UPDATE direto no banco.

**Arquivos afetados**:
- `apps/app/app/api/messages/templates/[id]/route.ts`
- `apps/app/app/api/messages/templates/[id]/reset/route.ts`

**Mutations encontradas**:
```typescript
// PUT - Update template
UPDATE message_templates SET ... WHERE id = ?

// POST reset - Reset template to default
UPDATE message_templates SET content = default_content WHERE id = ?
```

**Actions a criar**:
- [ ] `messages.updateTemplate` - Atualizar template
- [ ] `messages.resetTemplate` - Resetar para padrao

**Refatoracao**:
- [ ] Criar actions no catalogo `apps/backbone/src/actions/catalog/messages/`
- [ ] Refatorar routes para chamar Backbone

---

### 4. [ ] `backbone/services/whatsapp` - Mutations diretas no repository

**Problema**: WhatsApp service faz mutations diretas. Algumas actions existem mas nao cobrem todos os casos.

**Arquivos afetados**:
- `apps/backbone/src/services/whatsapp/repository.ts`
- `apps/backbone/src/services/whatsapp/service.ts`
- `apps/backbone/src/services/whatsapp/webhook-handler.ts`

**Mutations encontradas**:
```typescript
channelsRepository.create({ name, description, instanceName })
channelsRepository.updateStatus(channel.id, { status, qrCode })
channelsRepository.delete(channelId)
assignmentsRepository.create(input)
```

**Actions existentes** (parcial):
- `whatsapp.createChannel` - OK
- `whatsapp.assignChannel` - OK

**Actions faltantes**:
- [ ] `whatsapp.updateChannelStatus` - Atualizar status do canal
- [ ] `whatsapp.deleteChannel` - Deletar canal

**Decisao pendente**: `updateChannelStatus` e chamado pelo webhook (sistema) - deve ser action ou excecao?

---

### 5. [ ] `backbone/services/messages` - Logs criados inline

**Problema**: Message service cria logs de envio como efeito colateral durante o processo de envio.

**Arquivos afetados**:
- `apps/backbone/src/services/messages/repository.ts`
- `apps/backbone/src/services/messages/service.ts`

**Mutations encontradas**:
```typescript
logsRepository.create({ templateId, channel, recipient })
logsRepository.updateStatus(log.id, 'sent')
```

**Opcoes**:

**Opcao A**: Logs sao efeito colateral (manter como esta)
- Logs de auditoria nao precisam ser actions
- Sao gerados automaticamente pelo sistema
- Similar ao audit log das proprias Actions

**Opcao B**: Criar actions para logs
- [ ] `messages.createLog` - Registrar envio
- [ ] `messages.updateLogStatus` - Atualizar status

**Decisao pendente**: Logs de mensagens sao auditoria de sistema ou operacoes de negocio?

---

## Decisoes Arquiteturais Pendentes

| ID | Questao | Opcoes | Status |
|----|---------|--------|--------|
| D1 | Frontend pode fazer queries diretas ao DB? | (A) Sim, apenas reads / (B) Nao, tudo via Backbone | [ ] |
| D2 | Notifications sao actions autonomas ou efeitos colaterais? | (A) Autonomas / (B) Efeitos de outras actions | [ ] |
| D3 | Webhook updates (sistema) devem ser actions? | (A) Sim / (B) Nao, excecao documentada | [ ] |
| D4 | Message logs sao auditoria ou operacao de negocio? | (A) Auditoria (excecao) / (B) Operacao (criar actions) | [ ] |

---

## Ordem de Execucao Sugerida

1. **Resolver decisoes arquiteturais** - Definir D1-D4 antes de implementar
2. **Criar actions de notifications** - Maior gap atual
3. **Refatorar frontend notifications** - Depende de #2
4. **Criar actions de messages** - Templates + logs (se D4=B)
5. **Completar actions de whatsapp** - Menor prioridade (parcialmente ok)

---

## Excecoes Documentadas

| Modulo | Razao | Status |
|--------|-------|--------|
| `backbone/knowledge/indexer` | Motor interno de indexacao, nao iniciado por usuarios | Aceito |
| `backbone/actions/audit` | Logs de auditoria das proprias actions | Aceito |

---

## Referencias

- [ACTIONS.md](../../methodology/06-ia/ACTIONS.md) - Especificacao do modulo Actions
- [Regra Fundamental](../../methodology/06-ia/ACTIONS.md#regra-fundamental) - Por que tudo passa por Actions
