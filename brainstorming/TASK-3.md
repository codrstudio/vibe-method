# Iteracao 3: Pipeline de Processamento

## Objetivo

Processar relatorios pendentes com Writer + Reviewer e logica de retry.

```
[biz.reports pending] → [Writer] → [Reviewer] → [approved/rejected/failed]
```

**Entrega:** `npm run biz:process-reports` processa e atualiza status

---

## Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────────────┐
│                         biz.reports                                 │
│                      [status = pending]                             │
├─────────────────────────────────────────────────────────────────────┤
│   id: uuid                                                          │
│   original_text: "paciente almoçou bem..."                          │
│   assistido_nome: "Dona Maria"                                      │
│   turno: "diurno"                                                   │
│   status: "pending"  ◄─── buscar estes                              │
│   attempt: 0                                                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. SELECT WHERE status = 'pending'
                              │ 2. UPDATE status = 'processing'
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         biz-writer                                  │
├─────────────────────────────────────────────────────────────────────┤
│   Input:                                                            │
│   - original_text                                                   │
│   - assistido (nome, apelido, condicoes, preferencias)              │
│   - turno, context_type                                             │
│                                                                     │
│   Output:                                                           │
│   - humanized_message (texto para WhatsApp)                         │
│   - pdf_data (dados estruturados para PDF)                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Gera mensagem + PDF data
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        biz-reviewer                                 │
├─────────────────────────────────────────────────────────────────────┤
│   Input:                                                            │
│   - original_text (para comparar)                                   │
│   - humanized_message (para validar)                                │
│                                                                     │
│   Output:                                                           │
│   - approved: boolean                                               │
│   - feedback: string[] (se rejeitado)                               │
│   - quality_score: number                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. Valida qualidade
                              ▼
                    ┌─────────┴─────────┐
                    │                   │
              [approved]           [rejected]
                    │                   │
                    ▼                   ▼
          ┌─────────────┐      ┌─────────────────┐
          │ status =    │      │ attempt < 2?    │
          │ 'approved'  │      └────────┬────────┘
          │             │               │
          │ Salva:      │         SIM   │   NAO
          │ - message   │           │       │
          │ - pdf_data  │           ▼       ▼
          │ - score     │      [retry]  [status =
          └─────────────┘               'failed']
```

## Logica de Retry

```
attempt 0 → Writer → Reviewer → rejected → increment attempt
attempt 1 → Writer (com feedback) → Reviewer → rejected → increment attempt
attempt 2 → Writer (com feedback) → Reviewer → rejected → status = 'failed'
```

**Maximo 2 retries** (3 tentativas no total).

Se `attempt >= 2` e ainda rejected → `status = 'failed'` (vai para fila humana na iteracao 5).

---

# [x] - 3.1: Criar worker de processamento

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie scripts/biz-process-reports.ts e npm script "biz:process-reports".

O script deve:

1. Busca relatorios com status = 'pending' (LIMIT 10 por execucao)
2. Para cada relatorio:
   a. UPDATE status = 'processing'
   b. Chama invokeBizWriter com os dados
   c. Chama invokeBizReviewer com o resultado
   d. Se approved:
      - UPDATE status = 'approved'
      - Salva humanized_message, pdf_data, quality_score
      - UPDATE processed_at = NOW()
   e. Se rejected E attempt < 2:
      - INCREMENT attempt
      - UPDATE status = 'pending' (volta pra fila com feedback)
      - Salva reviewer_feedback
   f. Se rejected E attempt >= 2:
      - UPDATE status = 'failed'
      - Salva reviewer_feedback

3. Log de cada processamento (id, status final, tempo)
4. Resumo no final (total, approved, failed)

Usar:
- invokeBizWriter de agents/biz-writer
- invokeBizReviewer de agents/biz-reviewer
- db (postgres) para queries
- WorkflowExecution para auditoria

IMPORTANTE: Importar apenas o necessario, evitar barrel imports.
```

---

# [x] - 3.2: Adicionar campos de tracking (se necessario)

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Verifique se biz.reports tem os campos quality_score e processed_at.
Se nao tiver, crie migration 102_biz_reports_tracking.sql para adicionar.
```

---

# [ ] - 3.3: Testar processamento

**Executar:**

```bash
npm run biz:process-reports
```

**Validar no banco:**

```sql
SELECT id, status, attempt, quality_score, processed_at
FROM biz.reports
ORDER BY processed_at DESC LIMIT 10;
```

---

# [ ] - 3.4: Testar retry

**Validar:**
- Relatorio rejeitado tem `attempt` incrementado
- Apos 2 rejeicoes, status vira 'failed'
- `reviewer_feedback` contem os motivos

---

# Checklist Final

- [ ] Script biz-process-reports.ts criado
- [ ] npm script configurado
- [ ] Campos de tracking existem
- [ ] Processamento funciona (pending → approved)
- [ ] Retry funciona (rejected → retry → approved ou failed)
- [ ] WorkflowExecution registra execucoes

---

# Arquivos

| Tipo | Arquivo | Quem |
|------|---------|------|
| Codigo | `scripts/biz-process-reports.ts` | IA |
| Migration | `database/main/migrations/102_biz_reports_tracking.sql` | IA (se necessario) |
| Config | `package.json` (npm script) | IA |

---

# Notas

- Este worker sera chamado pelo scheduler na iteracao 6
- Por enquanto, execucao manual via `npm run biz:process-reports`
- Relatorios 'failed' vao para fila humana na iteracao 5
