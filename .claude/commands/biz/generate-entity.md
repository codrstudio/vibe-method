Gere a entidade `$ARGUMENTS` seguindo estas instrucoes:

## 1. Ler Contexto (OBRIGATORIO)

Leia ANTES de gerar codigo:

1. `specs/entities/$ARGUMENTS.yaml` - Spec da entidade
2. `specs/AI-INSTRUCTIONS.md` - Regras de geracao
3. `specs/AI-INSTRUCTIONS.local.md` - Instrucoes do projeto (se existir)

## 2. Gerar Migration

**Arquivo:** `database/main/migrations/1XX_biz_$ARGUMENTS.sql`

**Regras:**
- Numero sequencial (verificar ultimo 1XX existente)
- Prefixo `biz_` na tabela
- `gen_random_uuid()` para UUID
- `TIMESTAMPTZ` para timestamps
- Indices conforme spec

## 3. Gerar Schema Zod

**Arquivo:** `packages/types/src/schemas/biz-$ARGUMENTS.ts`

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
export * from './schemas/biz-$ARGUMENTS.js';
```

## 5. Validar

- Executar `npm run build`
- Verificar se types compilam sem erro

---

## Checklist de Qualidade

Apos gerar, valide:

| Criterio | Status |
|----------|--------|
| Migration segue padrao 1XX_biz_* | ✅/❌ |
| Tabela tem prefixo biz_ | ✅/❌ |
| Schema Zod com prefixo Biz* | ✅/❌ |
| Todos os campos do spec mapeados | ✅/❌ |
| Indices criados conforme spec | ✅/❌ |
| Export adicionado no index.ts | ✅/❌ |
| Build passa sem erros | ✅/❌ |
