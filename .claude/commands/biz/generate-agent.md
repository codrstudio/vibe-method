Gere o agente `$ARGUMENTS` seguindo estas instrucoes:

## 1. Ler Contexto (OBRIGATORIO)

Leia ANTES de gerar codigo:

1. `methodology/06-ia/AGENTES.md` - Como criar agentes LangGraph
2. `specs/AI-INSTRUCTIONS.md` - Regras de geracao
3. `specs/AI-INSTRUCTIONS.local.md` - Instrucoes do projeto (se existir)
4. `specs/agents/$ARGUMENTS.md` - Spec do agente

## 2. Salvar Plano

Antes de gerar codigo, salvar plano em:

```
plans/$ARGUMENTS/PLAN.md
```

## 3. Seguir Anatomia

Conforme `methodology/06-ia/AGENTES.md`, criar em `apps/backbone/src/agents/$ARGUMENTS/`:

```
$ARGUMENTS/
├── index.ts      # StateGraph + invoke()
├── types.ts      # State annotation + Zod schemas
└── prompt.ts     # Builder de prompts
```

Se necessario, criar nodes em `nodes/` conforme spec do agente.

## 4. Regras Tecnicas

- Usar `llmService.createLLM(intent)` para LLM - NUNCA hardcode
- Tipos com prefixo do agente: `BizWriterState`, `BizWriterInput`
- Todo nodo DEVE ter fallback (nunca quebrar o fluxo)
- Usar lazy compile (nao compilar no top-level)
- Implementar WorkflowExecution para auditoria
- Usar metricas: `incCounter`, `startTimer`

## 5. Apos Gerar

- Executar `npm run build`
- Validar qualidade conforme checklist abaixo

## 6. Validar Funcionamento

**Opcao A - Se existir npm script de teste:**
```bash
npm run test:$ARGUMENTS
```

**Opcao B - Se o servidor estiver rodando:**
Testar via API (se o agente tiver endpoint associado).

**Opcao C - Validacao minima:**
- `npm run build` passa sem erros
- Tipos exportados corretamente
- Checklist de qualidade OK

> **NAO criar scripts de teste manuais em .tmp/** - usar infraestrutura existente.

---

## 7. Checklist de Qualidade (OBRIGATORIO)

Apos gerar o agente, valide TODOS os criterios abaixo.

### Criterios Tecnicos

| Criterio | Descricao | Obrigatorio |
|----------|-----------|-------------|
| LangGraph | Usa `StateGraph` e `Annotation` de `@langchain/langgraph` | Sim |
| Nodos separados | Cada responsabilidade em um nodo distinto | Sim |
| Fallbacks | Todo nodo tem try/catch com fallback sensato | Sim |
| llmService(intent) | Usa `llmService.createLLM(intent)`, nunca hardcode | Sim |
| Tipos prefixados | Todos os tipos com prefixo `Biz{Agent}*` | Sim |
| Schemas Zod | Input/Output definidos com Zod em `types.ts` | Sim |
| Metricas | Usa `incCounter` e `startTimer` para observabilidade | Sim |
| WorkflowExecution | Rastreia cada execucao para auditoria | Sim |
| Lazy compile | Compila grafo sob demanda, nao no top-level | Sim |

### Aspectos de Qualidade

| Aspecto | Descricao | Como Validar |
|---------|-----------|--------------|
| Funcional | Agente executa sem erros | `npm run build` passa |
| Observavel | Metricas de latencia e contadores | Verificar `incCounter`/`startTimer` |
| Auditavel | Execucoes sao persistidas para analise | Verificar `WorkflowExecution.save()` |
| Rastreavel | Input/output de cada nodo registrado | Verificar `stepSuccess`/`stepFailed` |

### Formato de Validacao

Ao finalizar, apresente o resultado assim:

```
## Validacao de Qualidade: {nome-do-agente}

### Criterios Tecnicos

| Criterio           | Status |
|--------------------|--------|
| LangGraph          | ✅/❌  |
| Nodos separados    | ✅/❌  |
| Fallbacks          | ✅/❌  |
| llmService(intent) | ✅/❌  |
| Tipos prefixados   | ✅/❌  |
| Schemas Zod        | ✅/❌  |
| Metricas           | ✅/❌  |
| WorkflowExecution  | ✅/❌  |
| Lazy compile       | ✅/❌  |

### Aspectos de Qualidade

| Aspecto    | Status |
|------------|--------|
| Funcional  | ✅/❌  |
| Observavel | ✅/❌  |
| Auditavel  | ✅/❌  |
| Rastreavel | ✅/❌  |
```

Se algum criterio falhar, corrija antes de finalizar.
