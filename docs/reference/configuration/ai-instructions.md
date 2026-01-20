# AI Instructions

Arquivos que instruem a IA sobre como gerar codigo no projeto.

---

## Arquivos

| Arquivo | Escopo | Quem edita |
|---------|--------|------------|
| `specs/AI-INSTRUCTIONS.md` | Framework | Plataforma (motor) |
| `specs/AI-INSTRUCTIONS.local.md` | Projeto | Cliente (fork) |

---

## Hierarquia

```
AI-INSTRUCTIONS.md          # Base (nao modificar)
    ↓
AI-INSTRUCTIONS.local.md    # Complementa/sobrescreve (opcional)
```

A IA deve:
1. Ler `AI-INSTRUCTIONS.md` primeiro
2. Se existir `.local.md`, ler em seguida
3. Instrucoes locais tem precedencia em caso de conflito

---

## Conteudo Base (Framework)

O arquivo base define:

- Prefixo de negocio (`biz-`)
- Separacao motor vs artefato
- Pastas que nao modificar
- Pastas para gerar codigo
- Fluxos de geracao (entity → schema → migration)
- Regras de nomenclatura
- Uso de LLM intents

---

## Conteudo Local (Projeto)

O arquivo local define:

- Banco de dados especifico (MySQL, SQLite, etc)
- Variaveis de ambiente do projeto
- Mapeamento de tabelas legadas
- Contexto da empresa/cliente
- Excecoes as regras base

---

## Exemplo .local.md

```markdown
# AI Instructions (Local)

## Banco de Dados
Este projeto usa MySQL.
Configuracao em `.env.secrets`.

## Tabelas Legadas
- `pacientes` - Ler, nao modificar
- `relatorios` - Ler, nao modificar

## Contexto
Consultar `specs/company/profile.md` para tom de comunicacao.
```

---

## Arquivos Relacionados

| Arquivo | Conteudo |
|---------|----------|
| `specs/AI-INSTRUCTIONS.md` | Instrucoes base |
| `specs/AI-INSTRUCTIONS.local.md` | Instrucoes do projeto |
| `specs/company/profile.md` | Contexto da empresa |
