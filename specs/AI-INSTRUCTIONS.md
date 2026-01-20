# AI Instructions

Instrucoes para a IA gerar codigo a partir dos specs sem modificar o motor da plataforma.

> **IMPORTANTE**: Se existir `AI-INSTRUCTIONS.local.md` neste diretorio, leia-o apos este arquivo. Instrucoes locais complementam ou sobrescrevem as instrucoes base.

---

## Regra de Ouro: Motor vs Negocio

```
biz-*     → Negocio (fork) → LIVRE para criar/modificar
sem biz-  → Motor (plataforma) → REQUER APROVACAO
```

### Antes de Modificar Arquivo do Motor

Se precisar modificar arquivo sem prefixo `biz-`:

1. **Peca aprovacao** (se bypass permissions estiver off):
   - Qual arquivo precisa modificar
   - Por que precisa modificar
   - Qual o impacto

2. **Crie platform-request** (SEMPRE, mesmo com bypass on):
   - `specs/platform-requests/{numero}-{titulo}.md`
   - Documenta a necessidade para evolucao da plataforma

3. **Implemente a mudanca**

### Formato do Platform Request

```markdown
# Platform Request: {Titulo}

## Contexto
{O que estava fazendo quando precisou modificar}

## Arquivo Afetado
{Caminho do arquivo do motor}

## Problema
{Por que a modificacao foi necessaria}

## Solucao Sugerida
{Como a plataforma poderia resolver isso elegantemente}

## Workaround Implementado
{O que foi feito agora para destravar}
```

### Exemplo (com aprovacao)

```
AI: Preciso adicionar export em agents/index.ts para expor biz-writer.
    Este arquivo eh do motor (sem prefixo biz-).

    Justificativa: O agente precisa ser importavel por outros modulos.
    Impacto: Pode causar conflito no upstream merge.

    Posso prosseguir?

Usuario: Sim

AI: Criando specs/platform-requests/001-agent-export-registry.md
    Implementando export em agents/index.ts
```

### Exemplo (com bypass on)

```
AI: Modificando arquivo do motor: agents/index.ts
    Criando specs/platform-requests/001-agent-export-registry.md
    Implementando export em agents/index.ts
```

**Nota**: Com bypass on, a aprovacao eh pulada mas o platform-request eh criado.

---

## Prefixo de Negocio: `biz-`

Todo codigo de negocio DEVE usar o prefixo `biz-` para distinguir do motor.

| Origem | Pattern | Exemplo |
|--------|---------|---------|
| Motor | `{nome}` | `copilot`, `user.ts`, `001_users.sql` |
| Negocio | `biz-{nome}` | `biz-writer`, `biz-report.ts`, `100_biz_reports.sql` |

**Em diferentes cases:**
```
PascalCase:    BizReport, BizAssistido
camelCase:     bizReport, bizAssistido
kebab-case:    biz-report, biz-writer
snake_case:    biz_report, biz_assistido
SCREAMING:     BIZ_REPORT, BIZ_STATUS
```

**Migrations:**
- `0XX` → Motor (nao modificar)
- `1XX+` → Negocio (gerar aqui)

---

## Schema de Banco: `biz`

Tabelas de negocio vao no schema `biz` para nao conflitar com tabelas do motor.

```
Motor (plataforma)     → schema public
Negocio (fork)         → schema biz
```

**Exemplos:**
```sql
-- Motor (public)
public.users
public.workflow_executions
public.llm_bindings

-- Negocio (biz)
biz.reports
biz.assistidos
biz.cuidadores
```

**Na migration:**
```sql
-- CORRETO
CREATE TABLE biz.reports (...)

-- ERRADO
CREATE TABLE biz_reports (...)
CREATE TABLE public.biz_reports (...)
```

**Prerequisito:** O schema `biz` eh criado pela migration `099_biz_schema.sql` do motor.

---

## Monorepo: Instalacao de Pacotes

Este projeto usa monorepo com workspaces. **NUNCA** instale pacotes na raiz.

**ERRADO:**
```bash
npm install mysql2 --save
```

**CORRETO:**
```bash
npm install mysql2 --save --workspace=@workspace/backbone
npm install zod --save --workspace=@workspace/types
```

**Workspaces disponiveis:**
- `@workspace/backbone` - Backend/API
- `@workspace/app` - Frontend Next.js
- `@workspace/types` - Tipos compartilhados

**Verificar onde instalar:**
- Pacote usado so no backend → `@workspace/backbone`
- Pacote usado so no frontend → `@workspace/app`
- Tipos/schemas compartilhados → `@workspace/types`

---

## Principio Fundamental

```
MOTOR (estavel)  +  ARTEFATO (declarativo)  =  SISTEMA
     |                     |
     |                     └── specs/ (IA le e gera codigo)
     |
     └── apps/lib/, packages/ (IA NAO modifica)
```

**O motor eh infraestrutura. O artefato eh comportamento.**

A IA gera codigo de NEGOCIO consumindo artefatos. A IA NAO modifica codigo de MOTOR.

---

## O Que Eh Motor (NAO MODIFICAR)

Estes arquivos/pastas sao INFRAESTRUTURA da plataforma. A IA NAO deve modificar:

### apps/app/ (Frontend)
```
src/lib/                    # Conexoes, utils, auth
src/lib/db/                 # Pool PostgreSQL
src/lib/auth/               # NextAuth config
src/components/ui/          # shadcn components base
src/middleware.ts           # Middleware de rotas
```

### apps/backbone/ (Backend)
```
src/index.ts                # Fastify server setup
src/lib/                    # DB, cache, utils
src/pulse/                  # Observabilidade
src/llm/                    # Camada LLM
src/services/_*.ts          # Servicos base (notifications, scheduling)
src/agents/_runner.ts       # Executor de agentes
src/actions/_registry.ts    # Registry de actions
```

### packages/
```
packages/types/src/index.ts     # Re-exports (so adicionar, nao modificar)
packages/types/src/constants/   # Constantes base
```

### Outros
```
database/migrations/00*.sql     # Migrations base do motor
methodology/                    # Documentacao do metodo
refs/                           # Referencias de implementacao
```

---

## O Que Eh Artefato (GERAR/MODIFICAR)

Estes arquivos sao de NEGOCIO. A IA DEVE criar/modificar:

### specs/ (Definicoes - humano + IA definem)
```
specs/entities/*.yaml           # Entidades de negocio
specs/features/*.md             # User Stories, Requirements, Design
specs/agents/*.md               # Prompts e specs de agentes
specs/workflows/*.yaml          # Fluxos de negocio
specs/permissions/*.yaml        # Roles e permissoes
specs/company/*.md              # Contexto da empresa
```

### Codigo Gerado (IA gera a partir de specs)
```
# A partir de specs/entities/
packages/types/src/schemas/biz-{entity}.ts    # Schema Zod
database/migrations/1XX_biz_{entity}.sql      # Tabelas

# A partir de specs/agents/
apps/backbone/src/agents/biz-{agent}/         # Grafo LangGraph
  ├── index.ts
  ├── graph.ts
  ├── nodes/
  └── types.ts

# A partir de specs/features/
apps/app/src/app/(app)/biz-{feature}/         # Paginas
apps/app/src/app/api/biz-{feature}/           # API routes
apps/app/src/components/biz-{feature}/        # Components de UI

# A partir de specs/workflows/
apps/backbone/src/actions/biz-{workflow}/     # Actions de negocio
```

---

## Fluxo de Geracao

### 1. Entidade -> Schema + Migration + API

```
ENTRADA: specs/entities/report.yaml
    |
    v
GERAR:
  1. packages/types/src/schemas/biz-report.ts      # Schema Zod
  2. database/migrations/100_biz_reports.sql       # CREATE TABLE
  3. apps/app/src/app/api/biz-reports/route.ts    # CRUD endpoints
```

**Exemplo de Schema Zod:**
```typescript
// packages/types/src/schemas/biz-report.ts
import { z } from 'zod';

export const BizReportStatusSchema = z.enum([
  'pending', 'processing', 'approved', 'rejected', 'sent', 'failed'
]);

export const BizReportSchema = z.object({
  id: z.string().uuid(),
  external_id: z.string(),
  assistido_id: z.string().uuid(),
  // ... campos do yaml
  status: BizReportStatusSchema,
  created_at: z.string().datetime(),
});

export type BizReport = z.infer<typeof BizReportSchema>;
export type BizReportStatus = z.infer<typeof BizReportStatusSchema>;
```

**Atualizar index.ts (APENAS ADICIONAR):**
```typescript
// packages/types/src/index.ts
// ... exports existentes ...
export * from './schemas/biz-report';  // ADICIONAR LINHA
```

### 2. Agent Spec -> Grafo LangGraph

```
ENTRADA: specs/agents/writer.md
    |
    v
GERAR:
  apps/backbone/src/agents/biz-writer/
    ├── index.ts          # Export publico
    ├── graph.ts          # Definicao do grafo
    ├── nodes/
    │   ├── classify-context.ts
    │   ├── generate-message.ts
    │   ├── extract-clinical.ts
    │   └── format-output.ts
    ├── prompts.ts        # System prompts
    └── types.ts          # Tipos do agente
```

**Exemplo de grafo:**
```typescript
// apps/backbone/src/agents/biz-writer/graph.ts
import { StateGraph } from '@langchain/langgraph';
import { classifyContext } from './nodes/classify-context';
import { generateMessage } from './nodes/generate-message';
// ...

export const bizWriterGraph = new StateGraph({...})
  .addNode('classify_context', classifyContext)
  .addNode('generate_message', generateMessage)
  .addEdge('classify_context', 'generate_message')
  // ...
  .compile();
```

### 3. Feature -> Paginas + Components

```
ENTRADA: specs/features/report-humanization.md
    |
    v
GERAR:
  apps/app/src/app/(app)/biz-reports/
    ├── page.tsx              # Lista de relatorios
    ├── [id]/page.tsx         # Detalhe
    └── review/page.tsx       # Fila de revisao

  apps/app/src/components/biz-reports/
    ├── report-list.tsx
    ├── report-detail.tsx
    ├── report-editor.tsx
    └── review-queue.tsx
```

### 4. Workflow -> Actions

```
ENTRADA: specs/workflows/report-flow.yaml
    |
    v
GERAR:
  apps/backbone/src/actions/biz-report/
    ├── index.ts              # Exports
    ├── process.ts            # Action principal
    ├── retry.ts              # Retry apos rejeicao
    ├── approve.ts            # Aprovacao humana
    └── send.ts               # Envio para familia
```

---

## Regras de Geracao

### Nomenclatura

| Tipo | Pattern | Exemplo |
|------|---------|---------|
| Schema | `Biz{Entity}Schema` | `BizReportSchema` |
| Type | `Biz{Entity}` | `BizReport` |
| Migration | `1XX_biz_{entity}.sql` | `100_biz_reports.sql` |
| Agent folder | `biz-{agent}/` | `biz-writer/` |
| Action folder | `biz-{workflow}/` | `biz-report/` |
| Page folder | `biz-{feature}/` | `biz-reports/` |
| Component | `{component}.tsx` | `report-list.tsx` |
| Schema file | `biz-{entity}.ts` | `biz-report.ts` |

### Imports

```typescript
// CORRETO - importar de packages
import { BizReport, BizReportSchema } from '@projeto/types';

// ERRADO - importar direto do arquivo
import { BizReport } from '../../../packages/types/src/schemas/biz-report';
```

### UI Components

```typescript
// OBRIGATORIO - usar shadcn
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// PROIBIDO - HTML nativo para UI
<button>Click</button>  // NAO
<div className="border rounded">  // NAO para cards
```

### API Routes

```typescript
// PADRAO - usar authOptions e tratamento de erro
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

---

## Checklist Antes de Gerar

Antes de gerar codigo, a IA DEVE verificar:

- [ ] Li o spec correspondente em `specs/`?
- [ ] O codigo vai para pasta de NEGOCIO, nao de MOTOR?
- [ ] Estou usando imports de `@projeto/types`?
- [ ] Estou usando shadcn components (nao HTML nativo)?
- [ ] A migration tem numero sequencial correto?
- [ ] Atualizei o `index.ts` do types (so adicionar export)?

---

## Checklist Apos Gerar

Apos gerar codigo, a IA DEVE:

- [ ] Executar migration se criou SQL
- [ ] Verificar se app compila (`npm run build`)
- [ ] Atualizar PLAN.md se existir
- [ ] Registrar decisao em `specs/snippets/` se relevante

---

## Exemplo Completo: Nova Entidade

**1. Humano cria spec:**
```yaml
# specs/entities/assistido.yaml
name: assistido
fields:
  - id: uuid
  - nome: string
  - apelido: string?
  - data_nascimento: date
  - condicoes: string[]
```

**2. IA gera schema:**
```typescript
// packages/types/src/schemas/biz-assistido.ts
import { z } from 'zod';

export const BizAssistidoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(2),
  apelido: z.string().optional(),
  data_nascimento: z.string().date(),
  condicoes: z.array(z.string()),
});

export type BizAssistido = z.infer<typeof BizAssistidoSchema>;
```

**3. IA atualiza index (APENAS ADICIONA):**
```typescript
// packages/types/src/index.ts
export * from './schemas/biz-assistido';  // NOVA LINHA
```

**4. IA gera migration:**
```sql
-- database/migrations/101_biz_assistidos.sql
CREATE TABLE IF NOT EXISTS biz_assistidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  apelido VARCHAR(255),
  data_nascimento DATE NOT NULL,
  condicoes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_biz_assistidos_nome ON biz_assistidos(nome);
```

**5. IA gera API route:**
```typescript
// apps/app/src/app/api/biz-assistidos/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { BizAssistidoSchema } from '@projeto/types';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db.query('SELECT * FROM biz_assistidos ORDER BY nome');
  return NextResponse.json({ data: result.rows });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validated = BizAssistidoSchema.omit({ id: true }).parse(body);

  const result = await db.query(
    'INSERT INTO biz_assistidos (nome, apelido, data_nascimento, condicoes) VALUES ($1, $2, $3, $4) RETURNING *',
    [validated.nome, validated.apelido, validated.data_nascimento, validated.condicoes]
  );

  return NextResponse.json({ data: result.rows[0] }, { status: 201 });
}
```

---

## LLM Intents

Intents declaram **o que** o agente precisa do LLM, sem especificar provider/model.

### Intents Disponiveis (Motor)

| Intent | Uso | Quando usar |
|--------|-----|-------------|
| `classify` | Categorizacao | Triagem, analise de intencao |
| `generate` | Criacao de conteudo | Escrita, respostas, mensagens |
| `extract` | Extracao estruturada | Dados de texto livre |
| `plan` | Planejamento | Sequencia de acoes |
| `decide` | Decisao | Aprovado/rejeitado, escolha |

### Uso no Codigo Gerado

```typescript
// apps/backbone/src/agents/biz-writer/nodes/generate-message.ts
import { llmService } from '@/lib/llm';

export async function generateMessage(state: BizWriterState) {
  // Resolve intent -> LLM configurado
  const llm = llmService.createLLM('generate');

  const response = await llm.invoke([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: state.reportContent }
  ]);

  return { ...state, message: response.content };
}
```

```typescript
// apps/backbone/src/agents/biz-reviewer/nodes/evaluate.ts
import { llmService } from '@/lib/llm';

export async function evaluate(state: BizReviewerState) {
  // decide retorna structured output
  const llm = llmService.createLLM('decide');

  const response = await llm.invoke([
    { role: 'system', content: REVIEWER_PROMPT },
    { role: 'user', content: state.message }
  ]);

  // Parsed JSON: { approved: boolean, reason: string, score: number }
  return { ...state, evaluation: JSON.parse(response.content) };
}
```

### Mapeamento Agent -> Intent

| Agent | Node | Intent |
|-------|------|--------|
| biz-writer | classify_context | `classify` |
| biz-writer | generate_message | `generate` |
| biz-writer | extract_clinical | `extract` |
| biz-reviewer | evaluate | `decide` |

### Criando Intent de Negocio (Raro)

Se os intents base nao cobrem o caso:

```sql
-- database/migrations/110_biz_intents.sql
INSERT INTO llm_intents (slug, title, subtitle, icon, description, profile, declared_by)
VALUES (
  'biz-humanize',
  'Humanizar',
  'Texto tecnico para familiar',
  'heart',
  'Transforma linguagem tecnica em comunicacao afetuosa para familias.',
  '{"minParams":"13b","priority":"quality"}',
  'seed'
);
```

**Na maioria dos casos, `generate` + `decide` cobrem os casos de uso.**

---

## Referencias

- `methodology/` - Principios e workflows do metodo
- `refs/shadcn-v4/` - Padroes de componentes UI
- `specs/company/profile.md` - Tom de voz e contexto da empresa
- `specs/features/` - User Stories e Requirements
