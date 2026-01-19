# Feature: Notifications

Sistema de alertas multi-canal com niveis de prioridade.

**Prefixo:** NOTIFY

---

## User Stories

### US-NOTIFY-001: Receber Alerta Critico

**Como** coordenador,
**Quero** receber alertas criticos imediatamente,
**Para** tomar acoes urgentes sem atraso.

**Criterios de Aceite:**
- [ ] Notificacao push no navegador/celular
- [ ] Notificacao por WhatsApp
- [ ] Som de alerta na plataforma
- [ ] Destaque visual (vermelho) na lista de notificacoes

---

### US-NOTIFY-002: Gerenciar Preferencias de Notificacao

**Como** usuario,
**Quero** configurar quais notificacoes receber e por qual canal,
**Para** nao ser sobrecarregado com alertas irrelevantes.

**Criterios de Aceite:**
- [ ] Tela de configuracoes de notificacao
- [ ] Opcao por tipo de notificacao (recrutamento, relatorios, etc)
- [ ] Opcao por canal (in-app, push, WhatsApp, email)
- [ ] Opcao de horario de nao perturbar

---

### US-NOTIFY-003: Ver Historico de Notificacoes

**Como** usuario,
**Quero** acessar historico de notificacoes recebidas,
**Para** revisar alertas que posso ter perdido.

**Criterios de Aceite:**
- [ ] Lista cronologica de notificacoes
- [ ] Filtro por tipo e status (lida/nao lida)
- [ ] Busca por texto
- [ ] Marcar todas como lidas

---

### US-NOTIFY-004: Agir Diretamente da Notificacao

**Como** usuario,
**Quero** resolver pendencias diretamente da notificacao,
**Para** agilizar meu trabalho sem navegar pela plataforma.

**Criterios de Aceite:**
- [ ] Botao de acao primaria na notificacao (ex: "Aprovar", "Ver detalhes")
- [ ] Botao de dispensar/ignorar
- [ ] Deep link para contexto completo
- [ ] Confirmacao de acao executada

---

### US-NOTIFY-005: Receber Resumo Diario

**Como** gestor,
**Quero** receber um resumo diario das pendencias,
**Para** ter visao geral sem precisar acessar a plataforma.

**Criterios de Aceite:**
- [ ] Email matinal com resumo
- [ ] Itens pendentes agrupados por tipo
- [ ] Links diretos para cada item
- [ ] Opcao de desabilitar resumo

---

### US-NOTIFY-006: Ver Badge de Notificacoes Nao Lidas

**Como** usuario,
**Quero** ver quantas notificacoes tenho pendentes,
**Para** saber quando preciso verificar alertas.

**Criterios de Aceite:**
- [ ] Badge numerico no icone de notificacoes
- [ ] Badge atualizado em tempo real
- [ ] Badge zerado ao abrir painel de notificacoes
- [ ] Badge visivel no PWA instalado

---

## Requirements

### REQ-NOTIFY-001: Niveis de Prioridade

Notificacoes devem ter niveis de prioridade definidos.

**Regras:**
- **Critico (vermelho):** Exige acao imediata. Ex: guardiao nao bateu ponto, candidato alto score esperando, relatorio rejeitado 2x.
- **Medio (amarelo):** Resolver em ate 30 min. Ex: relatorio precisa revisao, entrevista sem confirmacao.
- **Baixo (azul):** Informativo. Ex: novo candidato inscrito, relatorio aprovado.

---

### REQ-NOTIFY-002: Canais de Entrega

Sistema deve suportar multiplos canais de entrega.

**Regras:**
- **In-app:** Painel na plataforma (sempre ativo)
- **Push:** Notificacao do navegador (opt-in)
- **WhatsApp:** Via Evolution API (configuravel)
- **Email:** Para resumos e notificacoes nao urgentes
- Usuario pode configurar canais por tipo de notificacao

---

### REQ-NOTIFY-003: Contexto da Notificacao

Cada notificacao deve incluir contexto suficiente para entender e agir.

**Regras:**
- Tipo de evento (recrutamento, relatorio, ponto, escala)
- Descricao clara do que aconteceu
- Sugestao de acao
- Link para contexto completo
- Timestamp de criacao

---

### REQ-NOTIFY-004: Persistencia de Status

Sistema deve rastrear status de cada notificacao.

**Regras:**
- Status: nao_lida, lida, acao_tomada, dispensada
- Registrar quem leu e quando
- Registrar qual acao foi tomada
- Historico disponivel por 90 dias

---

### REQ-NOTIFY-005: Escalacao Automatica

Notificacoes criticas devem escalar se nao resolvidas.

**Regras:**
- Se notificacao critica nao lida em 15 min, reenviar
- Se nao lida em 30 min, notificar supervisor
- Se nao lida em 1h, notificar gestor
- Log de cada escalacao

**Refs:** DES-ESCAL-001

---

### REQ-NOTIFY-006: Rate Limiting de Notificacoes

Evitar sobrecarga de notificacoes para o usuario.

**Regras:**
- Maximo de 1 notificacao push por minuto por usuario
- Agrupar notificacoes similares
- Digest de notificacoes de baixa prioridade a cada 15 min
- Respeitar horario de nao perturbar

---

### REQ-NOTIFY-007: Integracao com Fila de Aprovacoes

Notificacoes de aprovacao devem linkar para fila.

**Regras:**
- Deep link abre item especifico na fila
- Status da notificacao atualiza quando item aprovado/rejeitado
- Notificar se item expirar sem acao

**Refs:** REQ-QUEUE-001

---

### REQ-NOTIFY-008: Tempo Real

Notificacoes in-app devem aparecer em tempo real.

**Regras:**
- WebSocket para push de notificacoes
- Fallback para polling a cada 30s se WebSocket indisponivel
- Indicador visual de nova notificacao
- Som configuravel para alertas criticos

---

### REQ-NOTIFY-009: Preferencias Persistentes

Preferencias de notificacao devem ser salvas.

**Regras:**
- Persistir em banco de dados
- Sincronizar entre dispositivos
- Valores padrao sensiveis para novos usuarios
- Administrador pode definir padroes por papel

---

### REQ-NOTIFY-010: LGPD Compliance

Notificacoes devem seguir LGPD.

**Regras:**
- Consentimento para canais externos (WhatsApp, email)
- Opcao de revogar consentimento
- Dados de notificacao deletados com usuario
- Nao incluir dados sensiveis no corpo da notificacao externa

**Refs:** DES-LGPD-001

---

## Design

### DES-NOTIFY-001: Notification Service

Servico centralizado de notificacoes no Backbone.

**Implementacao:**
- Endpoint `POST /notifications` para criar notificacao
- Fila Redis para processamento assincrono
- Workers por canal (push, whatsapp, email)
- Retry com backoff para falhas de entrega

**Trade-offs:**
- Complexidade de multiplos workers
- Mas isolamento de falhas por canal

---

### DES-NOTIFY-002: Push Notification

Implementacao de push no navegador.

**Implementacao:**
- Service Worker para receber notificacoes
- VAPID keys para autenticacao
- Subscricao salva em banco
- Fallback para in-app se push nao suportado

**Trade-offs:**
- Requer HTTPS e Service Worker
- Mas alcanca usuario mesmo fora da plataforma

---

### DES-NOTIFY-003: WhatsApp Integration

Integracao com WhatsApp via Evolution.

**Implementacao:**
- Envio via Evolution API (porta XX55)
- Template de mensagem com variaveis
- Verificacao de numero valido antes de enviar
- Rate limit por numero (evitar spam)

**Trade-offs:**
- Custo por mensagem em alguns planos
- Mas canal com maior taxa de abertura

---

### DES-NOTIFY-004: Real-time Delivery

Entrega em tempo real via WebSocket.

**Implementacao:**
- Socket.io room por usuario
- Evento `notification:new` com payload completo
- Redis pub/sub para escalar entre instancias
- Client reconecta automaticamente se desconectar

**Trade-offs:**
- Conexoes persistentes consomem recursos
- Mas UX superior com notificacoes instantaneas

---

### DES-NOTIFY-005: Notification Database Schema

Schema para persistencia de notificacoes.

**Implementacao:**
```sql
notifications (
  id, user_id, type, priority, title, body,
  action_url, status, created_at, read_at, actioned_at
)
notification_preferences (
  user_id, type, channel_push, channel_whatsapp,
  channel_email, channel_inapp, quiet_hours_start, quiet_hours_end
)
```

**Trade-offs:**
- Tabela pode crescer muito
- Mas necessario para historico e auditoria

---

### DES-NOTIFY-006: Notification Grouping

Agrupamento de notificacoes similares.

**Implementacao:**
- Agrupar por tipo e entidade em janela de 5 min
- Ex: "3 novos candidatos" em vez de 3 notificacoes separadas
- Expandir grupo mostra itens individuais
- Prioridade do grupo = maior prioridade dos itens

**Trade-offs:**
- Logica adicional de agrupamento
- Mas reduz sobrecarga cognitiva do usuario

---

### DES-NOTIFY-007: Digest System

Sistema de resumos periodicos.

**Implementacao:**
- Worker que roda diariamente as 7h
- Agrupa notificacoes nao lidas por tipo
- Envia email com template HTML
- Link de unsubscribe no email

**Trade-offs:**
- Email pode ir para spam
- Mas util para usuarios que acessam pouco

---

### DES-NOTIFY-008: Escalation Engine

Motor de escalacao automatica.

**Implementacao:**
- Worker que verifica notificacoes criticas pendentes
- Roda a cada 5 minutos
- Thresholds configuraveis por tipo
- Log de cada escalacao em MongoDB

**Trade-offs:**
- Pode gerar ruido se mal configurado
- Mas garante que problemas criticos nao sejam ignorados

---

## Dependencias

**Libs:**
- `web-push` - Push notifications
- `socket.io` - Real-time
- `nodemailer` - Email

**Infraestrutura:**
- Redis (filas, pub/sub)
- PostgreSQL Main (persistencia)
- Evolution (WhatsApp)
- SMTP (email)

**Depends:**
- DES-AUTH-001 (autenticacao)
- DES-AGENT-005 (workers)
