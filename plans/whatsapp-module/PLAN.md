# PLAN: Modulo de Gestao WhatsApp Evolution

## Status: Implementado

## Resumo

Modulo para gerenciar canais de WhatsApp via Evolution API, com:
- **Canais** (operations): Pontos de uso do WhatsApp pelo sistema
- **Numeros** (channels): Instancias Evolution com telefones conectados
- **Atribuicoes** (channel_operations): Associacao canal <-> numero

---

## Sprint 1: Fundacao

- [x] Migration 013 (campos QR, eventos, notificacao)
- [x] Service: types.ts + repository.ts
- [x] Service: evolution-client.ts

## Sprint 2: Core + Alertas

- [x] Service: alert-service.ts (email, SMS, push)
- [x] Service: webhook-handler.ts (debounce, reconexao, alertas)
- [x] Service: service.ts (orquestra)
- [x] Rota webhook /webhooks/evolution

## Sprint 3: Actions

- [x] Actions: listChannels, createChannel, deleteChannel
- [x] Actions: getQrCode, refreshQrCode
- [x] Actions: listOperations, assignChannel, unassignChannel
- [x] Actions: sendTestMessage
- [x] Re-export em catalog/index.ts

## Sprint 4: Real-time

- [x] Socket events no hub namespace (join/leave whatsapp)
- [x] Broadcast de alertas (whatsapp:alert)
- [x] Hook useWhatsAppChannel

## Sprint 5: Frontend

- [x] Componentes: qr-code-viewer, connection-status, channel-card
- [x] Componentes: assign-dialog, test-message-form
- [x] Paginas: dashboard, channels, operations
- [ ] Toast de alertas + badge no menu (pendente)

---

## Arquivos Criados

| Arquivo | Proposito |
|---------|-----------|
| `database/main/migrations/013_whatsapp_enhancements.sql` | Campos QR + eventos + notificacao |
| `apps/backbone/src/services/whatsapp/types.ts` | Schemas Zod |
| `apps/backbone/src/services/whatsapp/repository.ts` | Queries SQL |
| `apps/backbone/src/services/whatsapp/evolution-client.ts` | HTTP client Evolution |
| `apps/backbone/src/services/whatsapp/webhook-handler.ts` | Processa webhooks + reconexao |
| `apps/backbone/src/services/whatsapp/alert-service.ts` | Envia alertas |
| `apps/backbone/src/services/whatsapp/service.ts` | Orquestra logica |
| `apps/backbone/src/services/whatsapp/index.ts` | Exports |
| `apps/backbone/src/actions/catalog/whatsapp/*.ts` | 9 Actions |
| `apps/backbone/src/routes/webhooks/evolution.ts` | Endpoint webhook |
| `apps/backbone/src/routes/webhooks/index.ts` | Webhook routes index |
| `apps/sockets/src/namespaces/hub.ts` | Socket events WhatsApp (atualizado) |
| `apps/sockets/src/server/types.ts` | Tipos de eventos (atualizado) |
| `apps/app/app/settings/whatsapp/page.tsx` | Dashboard |
| `apps/app/app/settings/whatsapp/channels/page.tsx` | Lista de numeros |
| `apps/app/app/settings/whatsapp/channels/new/page.tsx` | Criar numero |
| `apps/app/app/settings/whatsapp/channels/[id]/page.tsx` | Detalhes do numero |
| `apps/app/app/settings/whatsapp/operations/page.tsx` | Lista de operacoes |
| `apps/app/components/whatsapp/*.tsx` | 5 Componentes UI |
| `apps/app/hooks/use-whatsapp-channel.ts` | Hooks real-time |
| `apps/app/components/ui/select.tsx` | Componente Select (shadcn) |
| `apps/app/components/ui/textarea.tsx` | Componente Textarea (shadcn) |

---

## Verificacao Final

### Backend
- [ ] Migration 013 roda sem erros
- [ ] Actions aparecem em GET /backbone/act/catalog
- [ ] Webhook recebe eventos do Evolution
- [ ] Real-time emite para rooms corretas
- [ ] Debounce de 5s funciona

### Sistema de Alertas
- [ ] Alerta email enviado quando status = degraded
- [ ] Alerta email+sms enviado quando status = disconnected
- [ ] Notificacao in-app criada para usuarios afetados
- [ ] Broadcast whatsapp:alert emitido
- [ ] Reconexao automatica funciona (backoff 5,15,30,60,120s)
- [ ] Apos 5 tentativas falhas → status disconnected + alerta critico

### Frontend
- [ ] Dashboard lista numeros e canais
- [ ] QR code aparece ao criar numero
- [ ] Status atualiza em tempo real
- [ ] Toast vermelho aparece em degraded/disconnected
- [ ] Badge no menu indica canais com problema
- [ ] Atribuicao funciona (system e user)
- [ ] Campos notification_email e notification_phone editaveis
- [ ] Teste de envio dispara mensagem

### Integracao End-to-End
- [ ] Escanear QR conecta numero
- [ ] Status muda de qr_pending → connecting → connected
- [ ] Deslogar no celular (401) → status disconnected + alerta
- [ ] Simular connectionLost (408) → status degraded → retry → connected
- [ ] Mensagem de teste chega no destino

---

## Proximos Passos

1. **Rodar migration 013** para criar os novos campos no banco
2. **Configurar variaveis de ambiente**:
   - `EVOLUTION_API_URL` - URL da Evolution API
   - `EVOLUTION_API_KEY` - API key da Evolution
3. **Criar operacoes via seed** em `database/main/seeds/` do projeto
4. **Testar integracao** com Evolution API real
5. **Adicionar toast de alertas** no layout principal
