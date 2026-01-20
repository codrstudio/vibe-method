# Iteracao 2: API Funcional

## Objetivo

Chamada HTTP processa relatorio e retorna mensagem humanizada.

```
POST /api/biz-reports → processa → retorna resultado
```

**Entrega:** `curl POST /api/biz-reports` funciona

---

# [x] - 2.1: Schema biz-report no banco

**O que voce deve fazer:**

Criar spec da entidade biz-report com campos de input, output e status.

**Arquivo:** `specs/entities/biz-report.yaml`

**Conteudo esperado:**

```yaml
name: biz-report
description: Relatorio de plantao humanizado

fields:
  # Input
  - id: uuid
  - original_text: string, required
  - original_data: json
  - turno: enum(diurno, noturno, 24h), required
  - context_type: enum(normal, observacao, especial, incidente), required
  - special_note: string?

  # Assistido (denormalizado)
  - assistido_nome: string, required
  - assistido_apelido: string?
  - assistido_condicoes: string[]
  - assistido_preferencias: string[]

  # Output
  - humanized_message: string?
  - pdf_data: json?

  # Status
  - status: enum(pending, processing, approved, rejected, failed), default: pending
  - attempt: integer, default: 0
  - reviewer_feedback: string[]

  # Audit
  - created_at: timestamp, default: now
  - updated_at: timestamp, default: now
  - processed_at: timestamp?
  - approved_at: timestamp?

indexes:
  - status
  - created_at DESC
```

---

**Prompt para IA:**

```
Leia specs/entities/biz-report.yaml e gere:
1. Migration em database/main/migrations/100_biz_reports.sql
2. Schema Zod em packages/types/src/schemas/biz-report.ts
3. Atualize packages/types/src/index.ts com o export

Siga o padrao biz-* conforme specs/AI-INSTRUCTIONS.md
```

---

# [x] - 2.2: Spec da rota API

**O que voce deve fazer:**

Definir contrato da API de biz-reports com endpoints e payloads.

**Arquivo:** `specs/apis/biz-reports.yaml`

**Conteudo esperado:**

```yaml
name: biz-reports
base_path: /api/biz-reports
description: API para processamento de relatorios humanizados

endpoints:
  - method: POST
    path: /
    description: Criar e processar relatorio
    auth: required
    input:
      original_text: string, required
      original_data: object?
      turno: enum(diurno, noturno, 24h), required
      context_type: enum(normal, observacao, especial, incidente), required
      special_note: string?
      assistido:
        nome: string, required
        apelido: string?
        condicoes: string[]
        preferencias: string[]
    output:
      id: uuid
      status: string
      humanized_message: string?
      quality_score: number?

  - method: GET
    path: /:id
    description: Consultar status e resultado
    auth: required
    output:
      id: uuid
      status: string
      humanized_message: string?
      pdf_data: object?
      attempt: number
      created_at: timestamp
      processed_at: timestamp?
```

---

**Prompt para IA:**

```
Leia specs/apis/biz-reports.yaml e specs/entities/biz-report.yaml e gere:
1. Rota Fastify em apps/backbone/src/routes/biz-reports.ts
2. Use WorkflowExecution para auditoria
3. Integre com invokeBizWriter e invokeBizReviewer
4. Registre a rota em apps/backbone/src/index.ts

Fluxo do POST:
1. Validar input com Zod
2. Inserir no banco com status 'pending'
3. Chamar invokeBizWriter
4. Chamar invokeBizReviewer
5. Atualizar status (approved/rejected)
6. Retornar resultado
```

---

# [ ] - 2.3: Testar via curl

**O que voce deve fazer:**

Executar teste manual para validar o fluxo completo.

**Comando:**

```bash
curl -X POST http://localhost:3001/api/biz-reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "original_text": "Paciente alimentou-se bem no almoco. Humor estavel. Dormiu bem.",
    "turno": "diurno",
    "context_type": "normal",
    "assistido": {
      "nome": "Jose da Silva",
      "apelido": "Seu Jose",
      "condicoes": ["Alzheimer leve"],
      "preferencias": ["Gosta de musica"]
    }
  }'
```

**Resposta esperada:**

```json
{
  "id": "uuid",
  "status": "approved",
  "humanized_message": "Boa noite! Hoje o Seu Jose teve um dia tranquilo...",
  "quality_score": 85
}
```

---

**Prompt para IA:**

```
Execute o curl acima e valide:
1. Retorna 200 com mensagem humanizada
2. Status eh approved ou rejected
3. Registro existe no banco (SELECT * FROM biz_reports WHERE id = 'uuid')
4. WorkflowExecution registrou a execucao
```

---

# Checklist Final

- [ ] Spec `specs/entities/biz-report.yaml` criado
- [ ] Spec `specs/apis/biz-reports.yaml` criado
- [ ] Migration gerada e executada
- [ ] Types gerados e exportados
- [ ] Rota funcionando
- [ ] curl retorna mensagem humanizada

---

# Arquivos

| Tipo | Arquivo | Quem |
|------|---------|------|
| Spec | `specs/entities/biz-report.yaml` | Humano |
| Spec | `specs/apis/biz-reports.yaml` | Humano |
| Codigo | `database/main/migrations/100_biz_reports.sql` | IA |
| Codigo | `packages/types/src/schemas/biz-report.ts` | IA |
| Codigo | `apps/backbone/src/routes/biz-reports.ts` | IA |
