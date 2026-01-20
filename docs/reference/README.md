# Reference Library

Documentacao tecnica de referencia da plataforma Vibe Method.

---

## Navegacao

| Secao | Conteudo |
|-------|----------|
| [configuration/](./configuration/) | Autenticacao, variaveis de ambiente |
| [llm/](./llm/) | Intents, bindings, resolver |

---

## Estrutura

```
reference/
├── configuration/
│   ├── ai-instructions.md   # Instrucoes para IA (base + local)
│   └── authentication.md    # NextAuth, providers, sessao
│
└── llm/
    ├── intents.md           # Declaracao de intencao LLM
    ├── bindings.md          # Configuracao provider/model
    └── resolver.md          # Resolucao e uso no codigo
```

---

## Convencoes

**Arquivos**: Um arquivo por conceito. Nome descreve o conteudo.

**Estrutura interna**: Cada arquivo segue o padrao:
1. Titulo e descricao curta
2. Conceito (diagrama se aplicavel)
3. Uso pratico (codigo)
4. Arquivos relacionados

**Codigo**: Exemplos sao funcionais, nao pseudocodigo.

---

## Quando Consultar

- Antes de implementar feature que usa um motor
- Quando precisar entender como algo funciona
- Para verificar assinatura de funcao ou estrutura de dados

---

## Relacionados

| Recurso | Proposito |
|---------|-----------|
| `methodology/` | Filosofia e fluxo de trabalho |
| `specs/` | Artefatos de projeto (features, entities) |
| `brainstorming/` | Material de planejamento |
