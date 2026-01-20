# Plano: Modos de Teste para Canal WhatsApp

## Objetivo

Adicionar 3 modos de teste ao canal WhatsApp para facilitar desenvolvimento e debug:

| Modo | Campo DB | Comportamento |
|------|----------|---------------|
| **Echo** | `echo_enabled` | Mensagem recebida retorna ao remetente |
| **Echo-To** | `echo_to_number` | Mensagem recebida vai para número específico |
| **Redirect** | `redirect_to_number` | Mensagem enviada vai para número específico |

**Prioridade:** `echo_to_number` > `echo_enabled` (se echo_to preenchido, ignora echo_enabled)

---

## Arquivos a Modificar/Criar

### Database
- [x] `database/main/migrations/017_channel_test_modes.sql` (CRIAR)

### Backend
- [x] `apps/backbone/src/services/whatsapp/types.ts` (MODIFICAR)
- [x] `apps/backbone/src/services/whatsapp/repository.ts` (MODIFICAR)
- [x] `apps/backbone/src/services/whatsapp/webhook-handler.ts` (MODIFICAR - linha ~575)
- [x] `apps/backbone/src/services/whatsapp/service.ts` (MODIFICAR - linha ~448)
- [x] `apps/backbone/src/routes/whatsapp.ts` (MODIFICAR)

### Frontend
- [x] `apps/app/components/ui/switch.tsx` (CRIAR via shadcn)
- [x] `apps/app/app/api/whatsapp/channels/[id]/test-modes/route.ts` (CRIAR)
- [x] `apps/app/components/whatsapp/test-modes-card.tsx` (CRIAR)
- [x] `apps/app/components/whatsapp/index.ts` (MODIFICAR)
- [x] `apps/app/app/app/(dashboard)/settings/whatsapp/channels/[id]/page.tsx` (MODIFICAR)

---

## Implementação

### 1. Migration (017_channel_test_modes.sql)

```sql
ALTER TABLE channels ADD COLUMN IF NOT EXISTS echo_enabled BOOLEAN DEFAULT false;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS echo_to_number VARCHAR(20);
ALTER TABLE channels ADD COLUMN IF NOT EXISTS redirect_to_number VARCHAR(20);

COMMENT ON COLUMN channels.echo_enabled IS 'Modo echo: mensagem recebida retorna ao remetente';
COMMENT ON COLUMN channels.echo_to_number IS 'Modo echo-to: mensagem recebida retorna para este numero';
COMMENT ON COLUMN channels.redirect_to_number IS 'Modo redirect: mensagens enviadas vao para este numero';
```

### 2. Backend Types

Adicionar ao `ChannelSchema`:
```typescript
echoEnabled: z.boolean().default(false),
echoToNumber: z.string().nullable(),
redirectToNumber: z.string().nullable(),
```

### 3. Backend Repository

- Adicionar campos nos SELECTs (findById, findAll, etc.)
- Criar método `updateTestModes(id, updates)`

### 4. Backend Webhook Handler

Em `handleMessageReceived()` (após logging, antes de buscar assignment):

```typescript
// Echo-To tem prioridade
if (channel.echoToNumber) {
  await evolutionClient.sendTextMessage(channel.instanceName, channel.echoToNumber,
    `[ECHO-TO de ${key.remoteJid}]\n\n${textContent}`);
  return;
}

if (channel.echoEnabled) {
  await evolutionClient.sendTextMessage(channel.instanceName, key.remoteJid,
    `[ECHO]\n\n${textContent}`);
  return;
}
```

### 5. Backend Service

Em `sendMessage()` e `sendTestMessage()` (antes de enviar):

```typescript
let actualRecipient = to;
if (channel.redirectToNumber) {
  actualRecipient = channel.redirectToNumber;
}
```

### 6. Backend Route

Nova rota `PATCH /backbone/whatsapp/channels/:id/test-modes`

### 7. Frontend Switch

```bash
npx shadcn@latest add switch
```

### 8. Frontend API Route

`/api/whatsapp/channels/[id]/test-modes/route.ts` - Proxy PATCH para backbone

### 9. Frontend Component

`TestModesCard` com:
- Switch para echo_enabled
- Input + botão salvar para echo_to_number
- Input + botão salvar para redirect_to_number
- Badge indicando modo ativo

### 10. Frontend Page

Nova aba "Dev" com ícone FlaskConical, contendo TestModesCard

---

## Verificação

1. **Migration:** `npm run migrate:main` + verificar colunas no Adminer
2. **API Backend:**
   ```bash
   curl -X PATCH http://localhost:8002/backbone/whatsapp/channels/{id}/test-modes \
     -H "Content-Type: application/json" -d '{"echoEnabled": true}'
   ```
3. **Echo Mode:** Ativar → enviar msg no simulador → verificar retorno
4. **Echo-To:** Configurar número → enviar msg → verificar se vai pro número
5. **Redirect:** Configurar número → usar teste de envio → verificar destino
