# Iteracao 4: Entrega via WhatsApp

## Objetivo

Enviar relatorios aprovados para as familias via WhatsApp.

```
[biz.reports approved] → [WhatsApp API] → [status = sent]
```

**Entrega:** `npm run biz:send-reports` envia e atualiza status

---

## Fluxo de Entrega

```
┌─────────────────────────────────────────────────────────────────────┐
│                         biz.reports                                 │
│                      [status = approved]                            │
├─────────────────────────────────────────────────────────────────────┤
│   id: uuid                                                          │
│   primecare_id: bigint  ◄─── ID original do PrimeCare               │
│   humanized_message: "Bom dia! A Dona Maria..."                     │
│   pdf_data: { ... }                                                 │
│   assistido_nome: "Dona Maria"                                      │
│   status: "approved"  ◄─── buscar estes                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. SELECT WHERE status = 'approved'
                              │ 2. Usar primecare_id para buscar contatos
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PrimeCare MySQL (read-only)                      │
├─────────────────────────────────────────────────────────────────────┤
│   Via contratante (quem paga):                                      │
│   assistidos.contratante_id → contratantes                          │
│     - num_celular (WhatsApp)                                        │
│     - email                                                         │
│                                                                     │
│   Via contatos emergenciais:                                        │
│   contatos_emergenciais_assistidos.assistido_id                     │
│     - numero_celular (WhatsApp)                                     │
│     - nome, grau_parentesco                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Pegar celular do contratante
                              ▼
                    ┌─────────┴─────────┐
                    │                   │
              [whatsapp]            [email]
                    │                   │
                    ▼                   ▼
          ┌─────────────┐      ┌─────────────┐
          │ WhatsApp    │      │ Email       │
          │ Business    │      │ (FUTURO)    │
          │ API         │      │             │
          └─────────────┘      └─────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              │ 4. UPDATE status = 'sent'
                              │ 5. Salvar delivery_id, sent_at
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         biz.reports                                 │
│                        [status = sent]                              │
├─────────────────────────────────────────────────────────────────────┤
│   status: "sent"                                                    │
│   sent_at: timestamp                                                │
│   whatsapp_message_id: 'wamid_xxx'                                  │
│   sent_to_phone: '+5511999999999'                                   │
│   sent_to_name: 'Maria Silva'                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

# [ ] - 4.1: Criar funcao para buscar contatos no PrimeCare

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/lib/biz-primecare-contacts.ts com:

1. Funcao getContactsForAssistido(assistidoId: string) que retorna:
   {
     contratante?: { nome, celular, email },
     emergenciais: [{ nome, celular, parentesco }]
   }

2. Query no PrimeCare (MySQL read-only):
   - JOIN assistidos → contratantes para pegar dados do contratante
   - SELECT contatos_emergenciais_assistidos para contatos de emergencia

3. Usar biz-primecare-db.ts para conexao

Tambem criar migration 103_biz_reports_whatsapp.sql para adicionar campos em biz.reports:
- sent_at TIMESTAMPTZ
- whatsapp_message_id VARCHAR(255)
- sent_to_phone VARCHAR(20)
- sent_to_name VARCHAR(255)
```

---

# [ ] - 4.2: Integrar WhatsApp Business API

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/lib/biz-whatsapp.ts com:

1. Funcao sendWhatsAppMessage(to: string, message: string, pdfUrl?: string)
2. Usar WhatsApp Business API (Cloud API)
3. Variaveis de ambiente:
   - WHATSAPP_PHONE_NUMBER_ID
   - WHATSAPP_ACCESS_TOKEN
4. Retornar { success: boolean, messageId: string, error?: string }

Documentar as variaveis necessarias em .env.example ou README.
```

---

# [ ] - 4.3: Criar worker de envio

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie scripts/biz-send-reports.ts e npm script "biz:send-reports".

O script deve:

1. Busca relatorios com status = 'approved' (LIMIT 10)
2. Para cada relatorio:
   a. Buscar contato via getContactsForAssistido (PrimeCare)
   b. Usar celular do contratante (prioridade) ou primeiro emergencial
   c. Gerar PDF com generateReportPdf
   d. Enviar via sendWhatsAppMessage (mensagem + PDF)
   e. Se sucesso:
      - UPDATE status = 'sent'
      - Salvar sent_at, whatsapp_message_id, sent_to_phone, sent_to_name
   f. Se falha:
      - Log do erro
      - Manter status = 'approved' para retry
3. Log de cada envio (id, telefone, status)
4. Resumo no final (total, sent, failed)

Usar:
- biz-primecare-contacts.ts para buscar contatos
- biz-whatsapp.ts para enviar
- biz-pdf.ts para gerar PDF
- db (postgres) para queries
```

---

# [ ] - 4.4: Gerar PDF do relatorio

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/lib/biz-pdf.ts com:

1. Funcao generateReportPdf(pdfData: BizPdfData): Promise<Buffer>
2. Usar @react-pdf/renderer ou pdfkit
3. Layout profissional com:
   - Logo da empresa
   - Nome do assistido
   - Data/turno
   - Conteudo estruturado do pdf_data
4. Retornar Buffer do PDF

O PDF sera enviado como documento no WhatsApp.
```

---

# [ ] - 4.5: Testar envio

**Executar:**

```bash
npm run biz:send-reports
```

**Validar:**
- Relatorio aparece no WhatsApp do contato
- PDF anexado na mensagem
- Status atualizado para 'sent' no banco

---

# Checklist Final

- [ ] Funcao getContactsForAssistido funciona
- [ ] Campos de WhatsApp em biz.reports existem
- [ ] Integracao WhatsApp funciona
- [ ] PDF gerado corretamente
- [ ] Worker de envio funciona
- [ ] Status atualiza para 'sent'

---

# Arquivos

| Tipo | Arquivo | Quem |
|------|---------|------|
| Migration | `database/main/migrations/103_biz_reports_whatsapp.sql` | IA |
| Codigo | `apps/backbone/src/lib/biz-primecare-contacts.ts` | IA |
| Codigo | `apps/backbone/src/lib/biz-whatsapp.ts` | IA |
| Codigo | `apps/backbone/src/lib/biz-pdf.ts` | IA |
| Codigo | `scripts/biz-send-reports.ts` | IA |
| Config | `package.json` (npm script) | IA |

---

# Dependencias Externas

| Dependencia | Status | Notas |
|-------------|--------|-------|
| WhatsApp Business API | Pendente | Precisa conta Meta Business verificada |

---

# Notas

- WhatsApp Business API requer aprovacao da Meta (~1-2 semanas)
- Enquanto aguarda, pode testar com sandbox/test numbers
- Este worker sera chamado pelo scheduler na iteracao 6
- **Email sera implementado no futuro** - por enquanto so WhatsApp
