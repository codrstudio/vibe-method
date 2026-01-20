# Iteracao 5: Revisao Humana

## Objetivo

Criar fila de revisao para relatorios que a IA nao conseguiu aprovar apos 2 tentativas.

```
[biz.reports failed] → [Notifica responsavel] → [Dashboard revisao] → [Aprova/Edita/Fallback]
```

**Entrega:** Responsavel consegue revisar, editar e aprovar relatorios via dashboard

---

## Fluxo de Revisao

```
┌─────────────────────────────────────────────────────────────────────┐
│                         biz.reports                                 │
│                       [status = failed]                             │
├─────────────────────────────────────────────────────────────────────┤
│   id: uuid                                                          │
│   humanized_message: "Mensagem com problemas..."                    │
│   reviewer_feedback: ["Muito formal", "Falta empatia"]              │
│   attempt: 2  ◄─── ja tentou 2x                                     │
│   status: "failed"  ◄─── buscar estes                               │
│   failed_at: timestamp                                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Detectar novos 'failed'
                              │ 2. Notificar responsavel
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Notificacao WhatsApp                             │
├─────────────────────────────────────────────────────────────────────┤
│   "Ola! Temos 3 relatorios aguardando revisao.                      │
│    Acesse: https://dashboard.../revisao                             │
│    Timeout em 30 minutos."                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Responsavel acessa dashboard
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Dashboard de Revisao                             │
├─────────────────────────────────────────────────────────────────────┤
│   Lista de relatorios pendentes:                                    │
│   - Dona Maria (diurno) - feedback: "muito formal"                  │
│   - Sr. Jose (noturno) - feedback: "falta contexto"                 │
│                                                                     │
│   Acoes por relatorio:                                              │
│   [Aprovar como esta] [Editar e Aprovar] [Usar Fallback]            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────┴─────────┐
                    │                   │
              [Aprovado]           [Timeout 30min]
                    │                   │
                    ▼                   ▼
          ┌─────────────┐      ┌─────────────────┐
          │ status =    │      │ Fallback:       │
          │ 'approved'  │      │ PDF tecnico +   │
          │             │      │ msg padrao      │
          └─────────────┘      └─────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
                    [Envia via WhatsApp]
                    (Iteracao 4)
```

---

## Status do Relatorio

```
pending → processing → approved ────────────────────→ sent
                    ↓
               rejected (attempt < 2) → pending (retry)
                    ↓
               rejected (attempt >= 2) → failed → review → approved → sent
                                              ↓
                                         fallback → sent
```

Novos status a adicionar:
- `review` - aguardando revisao humana
- `fallback` - usou mensagem padrao

---

# [ ] - 5.1: Adicionar campos e status para revisao

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie migration 105_biz_reports_review.sql para:

1. Adicionar novos valores ao enum biz.report_status:
   - 'review' (aguardando revisao humana)
   - 'fallback' (usou mensagem padrao)

2. Adicionar campos em biz.reports:
   - review_started_at TIMESTAMPTZ (quando entrou na fila)
   - review_completed_at TIMESTAMPTZ (quando foi revisado)
   - reviewed_by UUID REFERENCES auth.users (quem revisou)
   - review_action VARCHAR(20) (approved_as_is, edited, fallback, timeout)
   - edited_message TEXT (mensagem editada pelo revisor)
   - fallback_used BOOLEAN DEFAULT FALSE

3. Criar indice para busca de relatorios em revisao:
   CREATE INDEX idx_biz_reports_review ON biz.reports(status, review_started_at)
   WHERE status IN ('failed', 'review');
```

---

# [ ] - 5.2: Criar API de revisao

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/api/biz-review.ts com endpoints:

1. GET /api/biz/review/pending
   - Retorna relatorios com status 'failed' ou 'review'
   - Inclui: id, assistido_nome, turno, humanized_message, reviewer_feedback, failed_at
   - Ordenado por failed_at ASC (mais antigo primeiro)

2. POST /api/biz/review/:id/approve
   - Body: { action: 'approve_as_is' | 'edit', edited_message?: string }
   - Se action='approve_as_is': usa humanized_message existente
   - Se action='edit': usa edited_message do body
   - UPDATE status = 'approved', review_completed_at = NOW()
   - Salva reviewed_by, review_action

3. POST /api/biz/review/:id/fallback
   - Marca para usar mensagem padrao
   - UPDATE status = 'fallback', fallback_used = TRUE
   - Gera mensagem padrao: "Segue o relatorio de plantao de {assistido_nome}."

4. GET /api/biz/review/stats
   - Retorna contadores: pending, reviewed_today, fallback_count

Usar middleware de autenticacao existente.
Registrar rotas no router principal.
```

---

# [ ] - 5.3: Criar worker de notificacao

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/scripts/biz-notify-review.ts e npm script "biz:notify-review".

O script deve:

1. Buscar relatorios com status = 'failed' que ainda nao foram notificados
   (review_started_at IS NULL)

2. Para cada relatorio encontrado:
   - UPDATE status = 'review', review_started_at = NOW()

3. Se encontrou relatorios:
   - Buscar telefone do responsavel (config ou env: BIZ_REVIEW_PHONE)
   - Enviar notificacao via whatsappService:
     "Ola! Temos {N} relatorio(s) aguardando revisao.
      Acesse: {DASHBOARD_URL}/revisao
      Timeout em 30 minutos."

4. Log: quantidade notificada, telefone destino

Usar:
- whatsappService para enviar (operacao 'biz-notifications' ou criar nova)
- db para queries
```

---

# [ ] - 5.4: Criar worker de timeout/fallback

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/scripts/biz-review-timeout.ts e npm script "biz:review-timeout".

O script deve:

1. Buscar relatorios com:
   - status = 'review'
   - review_started_at < NOW() - INTERVAL '30 minutes'
   (timeout de 30 minutos)

2. Para cada relatorio em timeout:
   - UPDATE status = 'fallback'
   - SET fallback_used = TRUE
   - SET review_action = 'timeout'
   - SET humanized_message = mensagem padrao:
     "Prezada familia, segue o relatorio de plantao de {assistido_nome}.

      [Conteudo tecnico do pdf_data]

      Atenciosamente,
      Equipe Cia. Cuidadores"

3. Log: quantidade processada, ids afetados

4. Resumo no final

Este script deve rodar periodicamente (ex: a cada 5 minutos).
```

---

# [ ] - 5.5: Criar tela de revisao no dashboard

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie pagina de revisao em apps/app/src/app/(dashboard)/revisao/page.tsx.

A pagina deve:

1. Layout:
   - Header: "Revisao de Relatorios" + contador de pendentes
   - Lista de cards com relatorios pendentes
   - Stats no topo (pendentes, revisados hoje, fallbacks)

2. Card de relatorio:
   - Nome do assistido, turno, data
   - Mensagem humanizada atual (readonly textarea)
   - Feedback do reviewer (lista de problemas)
   - Timer mostrando tempo restante ate timeout
   - Botoes: [Aprovar] [Editar] [Usar Fallback]

3. Modal de edicao:
   - Textarea editavel com a mensagem
   - Preview lado a lado (original vs editado)
   - Botoes: [Cancelar] [Salvar e Aprovar]

4. Feedback visual:
   - Toast de sucesso/erro
   - Card some da lista apos acao
   - Contador atualiza automaticamente

Usar:
- shadcn/ui para componentes
- React Query para fetch/mutations
- Endpoints de /api/biz/review/*
```

---

# [ ] - 5.6: Testar fluxo completo

**Executar em sequencia:**

```bash
# 1. Simular relatorio failed (ou aguardar processamento real)

# 2. Rodar notificacao
npm run biz:notify-review

# 3. Acessar dashboard e revisar
# http://localhost:3000/revisao

# 4. Testar timeout (aguardar 30min ou ajustar para teste)
npm run biz:review-timeout

# 5. Verificar envio
npm run biz:send-reports
```

**Validar:**
- Notificacao chega no WhatsApp do responsavel
- Dashboard mostra relatorios pendentes
- Edicao funciona e salva corretamente
- Timeout aplica fallback automaticamente
- Relatorios aprovados/fallback sao enviados

---

# Checklist Final

- [ ] Migration 105 criada (novos status e campos)
- [ ] API de revisao funciona (/api/biz/review/*)
- [ ] Worker de notificacao funciona
- [ ] Worker de timeout funciona
- [ ] Tela de revisao no dashboard
- [ ] Fluxo completo testado

---

# Arquivos

| Tipo | Arquivo | Quem |
|------|---------|------|
| Migration | `database/main/migrations/105_biz_reports_review.sql` | IA |
| API | `apps/backbone/src/api/biz-review.ts` | IA |
| Script | `apps/backbone/src/scripts/biz-notify-review.ts` | IA |
| Script | `apps/backbone/src/scripts/biz-review-timeout.ts` | IA |
| UI | `apps/app/src/app/(dashboard)/revisao/page.tsx` | IA |
| Config | `package.json` (npm scripts) | IA |

---

# Configuracoes Necessarias

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| BIZ_REVIEW_PHONE | Telefone do responsavel | +5511999999999 |
| BIZ_REVIEW_TIMEOUT_MINUTES | Timeout em minutos | 30 |
| DASHBOARD_URL | URL do dashboard | https://dashboard.ciacuidadores.com.br |

---

# Notas

- O timeout de 30 minutos e configuravel via env
- Fallback garante que familia sempre recebe algo
- Workers de notificacao e timeout devem rodar via scheduler (iteracao 6)
- Considerar: notificacao de lembrete aos 15 minutos?
