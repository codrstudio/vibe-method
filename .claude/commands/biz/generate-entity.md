Gere a entidade `$ARGUMENTS` seguindo estas instrucoes:

## 1. Ler Contexto (OBRIGATORIO)

Leia ANTES de gerar codigo:

1. `specs/entities/$ARGUMENTS.yaml` - Spec da entidade
2. `specs/AI-INSTRUCTIONS.md` - Regras de geracao
3. `specs/AI-INSTRUCTIONS.local.md` - Instrucoes do projeto (se existir)

## 2. Gerar Migration

**Arquivo:** `database/main/migrations/1XX_$ARGUMENTS.sql`

**Regras:**
- Numero sequencial (verificar ultimo 1XX existente)
- Tabela no schema `biz`: `CREATE TABLE biz.{nome}`
- NAO usar prefixo `biz_` no nome da tabela (o schema ja isola)
- `gen_random_uuid()` para UUID
- `TIMESTAMPTZ` para timestamps
- Indices conforme spec

**Exemplo:**
```sql
-- CORRETO
CREATE TABLE biz.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

CREATE INDEX idx_reports_status ON biz.reports(status);

-- ERRADO (nao usar prefixo, usar schema)
CREATE TABLE biz_reports (...)
CREATE TABLE public.biz_reports (...)
```

## 3. Gerar Schema Zod

**Arquivo:** `packages/types/src/schemas/$ARGUMENTS.ts`

> **NOTA**: O nome do arquivo usa `$ARGUMENTS` diretamente (ex: `biz-report.ts`).
> NAO adicione prefixo extra - o nome da entidade ja indica que e de negocio.

**Regras:**
- Prefixo `Biz` nos tipos: `BizReportSchema`, `BizReport`
- Schemas separados para Input e Output se necessario
- Enums como `z.enum([...])`
- Arrays como `z.array(...)`
- Opcionais com `?` no spec viram `.optional()`

## 4. Atualizar Exports

**Arquivo:** `packages/types/src/index.ts`

Adicionar:
```typescript
export * from './schemas/$ARGUMENTS.js';
```

## 5. Validar

- Executar `npm run build`
- Verificar se types compilam sem erro

---

## Checklist de Qualidade

Apos gerar, valide:

| Criterio | Status |
|----------|--------|
| Migration segue padrao 1XX_*.sql | ✅/❌ |
| Tabela no schema `biz.*` | ✅/❌ |
| Schema Zod com prefixo Biz* | ✅/❌ |
| Todos os campos do spec mapeados | ✅/❌ |
| Indices criados conforme spec | ✅/❌ |
| Export adicionado no index.ts | ✅/❌ |
| Build passa sem erros | ✅/❌ |
