# Prompts

System prompts reutilizaveis para LLMs.

## Proposito

Armazena prompts longos separados do codigo para:
- Facilitar ajustes sem recompilar
- Permitir versionamento independente
- Carregar dinamicamente em runtime

## Estrutura

```
prompts/
├── README.md           # Este arquivo
├── assistant.yaml      # Prompt do agente principal
├── classifier.yaml     # Prompt de classificacao
└── ...                 # Outros prompts
```

## Formato (YAML)

```yaml
name: assistant
version: 1.0
description: Prompt do agente de atendimento

system: |
  Voce e um assistente virtual.

  ## Regras
  - Seja educado
  - Responda em portugues

  ## Contexto
  Data atual: {{current_datetime}}
  Usuario: {{user_name}}

variables:
  - current_datetime
  - user_name
```

## Uso no Codigo

```typescript
import { loadPrompt } from './nodes/prompts.js';

const prompt = await loadPrompt('assistant', {
  current_datetime: new Date().toISOString(),
  user_name: 'Joao',
});
```

## Dicas

- Use `{{variavel}}` para placeholders
- Documente as variaveis esperadas
- Versione prompts importantes
- Teste prompts isoladamente antes de integrar
