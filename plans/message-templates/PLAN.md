# PLAN: Editor de Templates de Mensagens

Sistema de personalização de mensagens do sistema com editor WYSIWYG e suporte a variáveis dinâmicas.

---

## Contexto

**Problema**: Mensagens enviadas pelo sistema (OTP, notificações, alertas) estão hardcoded no código. Para mudar o texto de um email, precisa de desenvolvedor.

**Solução**: Editor visual onde o especificador personaliza templates sem tocar em código. Mensagens viram artefatos consumidos pelo motor de envio.

**Filosofia**: `SISTEMA <-> motor <-> ARTEFATO <-> ferramenta <-> NEGOCIO`

---

## Escopo

### Incluso
- [x] Rota `/settings/messages`
- [ ] Editor WYSIWYG com TipTap
- [ ] Sistema de variáveis como chips inline
- [ ] Preview de email em tempo real
- [ ] Storage híbrido (YAML seed + banco para customizações)
- [ ] Suporte multi-canal (email agora, whatsapp futuro)

### Fora do Escopo
- [ ] Editor de templates WhatsApp (fase 2)
- [ ] Versionamento de templates
- [ ] A/B testing de mensagens
- [ ] Editor de templates push notification

---

## Dependências

### Pacotes Novos
```bash
npm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-mention --filter app
```

### Infraestrutura Existente
- SMTP configurado (.env)
- shadcn/ui como base de componentes
- Redis para cache de templates

---

## Estrutura de Arquivos

```
apps/app/
├── app/settings/
│   ├── layout.tsx                    # Layout settings
│   └── messages/
│       ├── page.tsx                  # Lista de templates
│       └── [templateId]/
│           └── page.tsx              # Editor do template
├── components/messages/
│   ├── template-editor.tsx           # Editor TipTap principal
│   ├── template-toolbar.tsx          # Toolbar (B, I, U, H1, etc)
│   ├── template-list.tsx             # Sidebar com categorias
│   ├── variable-picker.tsx           # Lista de variáveis
│   ├── variable-node.tsx             # Chip de variável (TipTap node)
│   ├── variable-extension.ts         # Extensão TipTap para variáveis
│   ├── channel-toggle.tsx            # Toggle email/whatsapp
│   ├── email-preview.tsx             # Modal preview
│   └── template-form.tsx             # Form wrapper

specs/messages/
├── _schema.yaml                       # Schema do template
├── otp-login.yaml                     # Template: OTP de login
├── welcome.yaml                       # Template: Boas-vindas
└── password-reset.yaml                # Template: Reset de senha

database/main/migrations/
└── XXXX_create_message_templates.sql  # Tabela de templates

apps/backbone/src/
├── modules/messages/
│   ├── messages.module.ts
│   ├── messages.service.ts            # Motor de envio
│   ├── messages.controller.ts         # API endpoints
│   ├── templates.service.ts           # CRUD templates
│   └── dto/
│       ├── send-message.dto.ts
│       └── template.dto.ts
```

---

## Schema do Artefato

```yaml
# specs/messages/_schema.yaml
type: object
required: [id, name, category, channels, variables]
properties:
  id:
    type: string
    pattern: "^[a-z0-9-]+$"
  name:
    type: string
  category:
    type: string
    enum: [auth, notification, alert, transactional]
  channels:
    type: object
    properties:
      email:
        type: object
        properties:
          enabled: { type: boolean }
          subject: { type: string }
          body_html: { type: string }
          body_text: { type: string }
      whatsapp:
        type: object
        properties:
          enabled: { type: boolean }
          body: { type: string }
  variables:
    type: array
    items:
      type: object
      properties:
        key: { type: string }
        label: { type: string }
        example: { type: string }
  settings:
    type: object
```

---

## Variáveis de Ambiente

```env
# Controle de métodos de autenticação
AUTH_IDENTITY_METHODS=email,document-id
AUTH_IDENTITY_ENABLED=email

AUTH_VALIDATION_METHODS=password,otp-email,otp-whatsapp
AUTH_VALIDATION_ENABLED=password,otp-email

# OTP Settings
OTP_LENGTH=6
OTP_TTL_MINUTES=5
```

---

## Tarefas

### Fase 1: Infraestrutura

- [x] **ENV-001**: Adicionar variáveis de controle de auth no .env
- [x] **DB-001**: Criar migration `message_templates`
- [x] **DB-002**: Criar migration `message_logs` (auditoria)
- [x] **SEED-001**: Criar seeds com templates padrão
- [x] **SPEC-001**: Criar schema YAML em `specs/messages/_schema.yaml`
- [x] **SPEC-002**: Criar template `otp-login.yaml`
- [x] **SPEC-003**: Criar template `welcome.yaml`
- [x] **SPEC-004**: Criar template `password-reset.yaml`

### Fase 2: Backend (Motor)

- [x] **API-001**: Criar módulo `messages` no backbone
- [x] **API-002**: Endpoint `GET /messages/templates` - listar templates
- [x] **API-003**: Endpoint `GET /messages/templates/:id` - buscar template
- [x] **API-004**: Endpoint `PUT /messages/templates/:id` - atualizar template
- [x] **API-005**: Endpoint `POST /messages/templates/:id/reset` - voltar ao padrão
- [x] **API-006**: Endpoint `POST /messages/templates/:id/preview` - gerar preview
- [x] **SVC-001**: Criar `TemplatesService` - CRUD com fallback para YAML
- [x] **SVC-002**: Criar `MessagesService` - motor de envio
- [x] **SVC-003**: Criar `EmailService` - envio SMTP
- [x] **SVC-004**: Implementar renderização de template (sintaxe {{var}})

### Fase 3: Frontend (Ferramenta)

- [x] **UI-001**: Instalar dependências TipTap
- [x] **UI-002**: Criar layout `/settings`
- [x] **UI-003**: Criar página `/settings/messages`
- [x] **UI-004**: Lista de templates integrada na page
- [ ] **UI-005**: Criar extensão TipTap para variáveis `variable-extension.ts` (futuro)
- [ ] **UI-006**: Criar componente `variable-node.tsx` (chip visual) (futuro)
- [x] **UI-007**: Criar componente `variable-picker.tsx`
- [x] **UI-008**: Criar componente `template-toolbar.tsx`
- [x] **UI-009**: Criar componente `template-editor.tsx`
- [x] **UI-010**: Criar componente `email-preview.tsx`
- [ ] **UI-011**: Criar componente `channel-toggle.tsx` (futuro - WhatsApp)
- [x] **UI-012**: Criar página `/settings/messages/[templateId]`
- [x] **UI-013**: Integrar com API (React Query)
- [x] **UI-014**: Adicionar menu Settings na sidebar

### Fase 4: OTP Flow

- [x] **OTP-001**: Criar endpoint `POST /auth/otp/request` - gera e envia OTP
- [x] **OTP-002**: Criar endpoint `POST /auth/otp/verify` - valida OTP
- [x] **OTP-003**: Integrar OTP no fluxo de login existente
- [x] **OTP-004**: Armazenar OTP no Redis com TTL
- [x] **OTP-005**: Adicionar rate limiting para requests de OTP

### Fase 5: Testes e Documentação

- [ ] **TEST-001**: Testes unitários do motor de templates
- [ ] **TEST-002**: Testes de integração do fluxo OTP
- [ ] **TEST-003**: Testes E2E do editor de templates
- [ ] **DOC-001**: Documentar API de mensagens
- [ ] **DOC-002**: Guia de uso para especificadores

---

## Modelo de Dados

### Tabela: message_templates

```sql
CREATE TABLE message_templates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  channels JSONB NOT NULL,
  variables JSONB NOT NULL,
  settings JSONB DEFAULT '{}',
  source VARCHAR(20) DEFAULT 'default', -- 'default' | 'custom'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Index para busca por categoria
CREATE INDEX idx_templates_category ON message_templates(category);
```

### Tabela: message_logs

```sql
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(50) REFERENCES message_templates(id),
  channel VARCHAR(20) NOT NULL, -- 'email' | 'whatsapp'
  recipient VARCHAR(255) NOT NULL,
  variables JSONB NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'sent' | 'failed' | 'bounced'
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para auditoria
CREATE INDEX idx_logs_template ON message_logs(template_id);
CREATE INDEX idx_logs_recipient ON message_logs(recipient);
CREATE INDEX idx_logs_sent_at ON message_logs(sent_at);
```

---

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/messages/templates` | Lista todos os templates |
| GET | `/messages/templates/:id` | Busca template por ID |
| PUT | `/messages/templates/:id` | Atualiza template |
| POST | `/messages/templates/:id/reset` | Volta ao template padrão |
| POST | `/messages/templates/:id/preview` | Gera preview com dados exemplo |
| POST | `/auth/otp/request` | Solicita OTP (envia email) |
| POST | `/auth/otp/verify` | Valida OTP |

---

## Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Especificador│────>│   Editor    │────>│   Banco     │
│  (humano)   │     │  (TipTap)   │     │ (templates) │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuário   │<────│    SMTP     │<────│   Motor     │
│  (recebe)   │     │  (envio)    │     │ (renderiza) │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Critérios de Aceite

### Editor
- [ ] Especificador consegue editar texto com formatação (negrito, itálico, títulos)
- [ ] Variáveis aparecem como chips visuais no editor
- [ ] Clicar na variável da sidebar insere no cursor
- [ ] Preview mostra email renderizado com dados exemplo
- [ ] Salvar persiste no banco
- [ ] Reset volta ao template original do YAML

### OTP
- [ ] Usuário recebe email com código de 6 dígitos
- [ ] Código expira em 5 minutos
- [ ] Máximo 3 tentativas de validação
- [ ] Rate limit: 1 request por minuto por email

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| TipTap complexo de customizar | Começar com toolbar básica, evoluir |
| Template com XSS | Sanitizar HTML no backend antes de salvar |
| Email não chega | Implementar logs detalhados e retry |
| Performance com muitos templates | Cache Redis dos templates ativos |

---

## Referências

- [TipTap Documentation](https://tiptap.dev/docs)
- [TipTap Mention Extension](https://tiptap.dev/docs/editor/api/nodes/mention)
- [Handlebars Templates](https://handlebarsjs.com/)
- specs/messages/_schema.yaml (a criar)

---

## Histórico

| Data | Autor | Mudança |
|------|-------|---------|
| 2025-01-18 | Claude | Criação do plano |
