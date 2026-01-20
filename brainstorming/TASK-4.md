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

# [x] - 4.1: Criar funcao para buscar contatos no PrimeCare

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

# [x] - 4.2: Configurar operacao WhatsApp para envio de relatorios

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

O motor JA TEM camada de WhatsApp em apps/backbone/src/services/whatsapp/.
NAO CRIE biz-whatsapp.ts - use o whatsappService existente.

O sistema usa:
- Operations = tipos de uso (ex: "notificacoes", "suporte")
- Channels = numeros WhatsApp conectados
- Assignments = liga canais a operacoes

Para enviar relatorios:

1. Criar migration 104_biz_whatsapp_operation.sql para registrar operacao:
   INSERT INTO whatsapp_operations (slug, name, description, nature)
   VALUES ('biz-reports', 'Relatorios de Plantao', 'Envio de relatorios humanizados para familias', 'system');

2. No codigo, usar:
   import { whatsappService } from '../../services/whatsapp/index.js';

   await whatsappService.sendMessage('biz-reports', telefone, mensagem);

Nota: Um canal WhatsApp precisa estar conectado e atribuido a operacao 'biz-reports'.
Isso eh feito via dashboard (UI) ou seed.
```

---

# [x] - 4.3: Criar worker de envio

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
- whatsappService (do motor) para enviar
- biz-pdf.ts para gerar PDF
- db (postgres) para queries
```

---

# [x] - 4.4: Gerar PDF do relatorio

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

**Status:** Aguardando canal WhatsApp real conectado

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

- [x] Funcao getContactsForAssistido funciona
- [x] Campos de WhatsApp em biz.reports existem
- [x] Operacao 'biz-reports' criada no WhatsApp
- [ ] Canal WhatsApp conectado e atribuido *(pendente: config manual)*
- [x] PDF gerado corretamente
- [x] Worker de envio funciona
- [ ] Status atualiza para 'sent' *(pendente: teste real)*

---

# Arquivos

| Tipo | Arquivo | Quem |
|------|---------|------|
| Migration | `database/main/migrations/103_biz_reports_whatsapp.sql` | IA |
| Migration | `database/main/migrations/104_biz_whatsapp_operation.sql` | IA |
| Codigo | `apps/backbone/src/lib/biz-primecare-contacts.ts` | IA |
| Codigo | `apps/backbone/src/lib/biz-pdf.ts` | IA |
| Codigo | `scripts/biz-send-reports.ts` | IA |
| Config | `package.json` (npm script) | IA |

---

# Dependencias Externas

| Dependencia | Status | Notas |
|-------------|--------|-------|
| Evolution API | Ja existe | Camada WhatsApp do motor |
| Canal conectado | Pendente | Precisa conectar numero e atribuir a operacao |

---

# Notas

- WhatsApp Business API requer aprovacao da Meta (~1-2 semanas)
- Enquanto aguarda, pode testar com sandbox/test numbers
- Este worker sera chamado pelo scheduler na iteracao 6
- **Email sera implementado no futuro** - por enquanto so WhatsApp
