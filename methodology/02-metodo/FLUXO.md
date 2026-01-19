# Fluxo de Trabalho

O processo do Vibe Method: de material bruto a codigo implementado.

---

## Indice

1. [Pipeline Principal](#pipeline-principal) - Visao geral
2. [Fase 1: Brainstorming → Specs](#fase-1-brainstorming--specs) - Extracao de especificacoes
3. [Fase 2: Specs → Plan](#fase-2-specs--plan) - Criacao do plano
4. [Fase 3: Plan → Codigo](#fase-3-plan--codigo) - Execucao
5. [Estados do Plano](#estados-do-plano) - Acompanhamento
6. [Ciclo Refs e Snippets](#ciclo-refs-e-snippets) - Antes e depois
7. [Multiplos Planos](#multiplos-planos) - Projetos grandes

---

## Pipeline Principal

```
BRAINSTORMING  -->  SPECS         -->  PLAN.md       -->  CODIGO
Material bruto     User Stories      Checklist com     Implementacao
do cliente         Requirements      referencias       guiada
                   Design Decs
```

### Pilares

| Pilar | Significado |
|-------|-------------|
| **Vibe-first** | Desenvolvimento fluido assistido por IA, sem friccao |
| **Incremental** | Fases progressivas: brainstorm → specs → plan → codigo |
| **Blueprint** | Context engineering: specs, instrucoes e estrutura rastreaveis |
| **Engineering** | Documentacao como codigo, versionada junto com o projeto |

### Principios Praticos

1. **Artefato e Verdade** - Quer entender o sistema? Leia os artefatos. Quer mudar? Mude os artefatos.
2. **Codigo e Motor** - Codigo consome artefatos, nao carrega regras de negocio.
3. **Contexto e Rei** - A IA precisa de contexto estruturado para tomar boas decisoes.
4. **Rastreabilidade** - Tudo e referenciavel por ID (US-AUTH-001, REQ-AUTH-001, DES-AUTH-001).
5. **Ferramenteiro** - Entregar motor e ferramenta, nao resolver o negocio diretamente.

---

## Fase 1: Brainstorming → Specs

### Entrada

Material bruto em `brainstorming/`:

- Notas de reuniao
- Briefings
- Screenshots
- Conversas
- Documentos do cliente
- Prototipos
- Emails
- Gravacoes transcritas

### Processo Detalhado

```
1. Ler TODO material de brainstorming
2. Identificar dominios funcionais (features)
3. Para cada feature:
   a. Criar arquivo {feature}.md em specs/features/
   b. Tem interacao humana? → Extrair User Stories
   c. Tem regras de negocio? → Derivar Requirements
   d. Tem decisoes tecnicas? → Documentar Design
4. Identificar padroes transversais → Criar features tecnicas
```

### Como Identificar Features

Perguntas guia:

1. Quais "areas" o usuario ve no sistema? (menu, telas)
2. Quais dominios de negocio existem?
3. Quais funcionalidades podem ser ligadas/desligadas independentemente?
4. Quais padroes tecnicos sao transversais?

### Criterios de Feature

| Criterio | Descricao |
|----------|-----------|
| **Coesao** | Elementos sao relacionados entre si |
| **Independencia** | Pode ser entendida com minimo contexto externo |
| **Boundary claro** | Voce consegue dizer "isso pertence a feature X" |

### Exemplos de Identificacao

**Sistema de entregas:**
- `deliveries` - Core do negocio (US + REQ)
- `settlements` - Fechamentos financeiros (US + REQ)
- `authentication` - Login e sessao (US + REQ + DES)
- `copilot` - Assistente IA (US + REQ + DES)
- `stack-patterns` - Padroes de codigo (DES only)

### Saida

Arquivos em `specs/features/`:
- Um arquivo por feature identificada
- Cada arquivo contem US + REQ + DES relevantes
- IDs unicos para cada item

---

## Fase 2: Specs → Plan

### Entrada

Specs completas em `specs/features/`

### Processo

```
1. Agrupar tarefas em fases logicas
2. Referenciar specs em cada tarefa (US-X, REQ-X, DES-X)
3. Ordenar por dependencias
4. Identificar bloqueios e riscos
```

### Saida

`PLAN.md` na raiz:

```markdown
# PLAN.md

## FASE 1: Autenticacao

- [ ] Implementar login
  - US-AUTH-001: User Login
  - REQ-AUTH-001: Rate Limiting
  - DES-AUTH-001: JWT Implementation

- [ ] Implementar logout
  - US-AUTH-002: User Logout

- [ ] Implementar refresh token
  - REQ-AUTH-002: Session Expiration
  - DES-AUTH-002: Refresh Token Flow

## FASE 2: Core Business

- [ ] Implementar CRUD entregas
  - US-DELIV-001: Create Delivery
  - REQ-DELIV-001: Delivery Validation
```

### Regra de Ouro

> **O plano e checklist, nao documentacao.**

Descricao detalhada esta nas specs. O plano so referencia.

### Anti-pattern

```markdown
# ERRADO - redocumenta specs
- [ ] Implementar login que permite usuarios se autenticarem
      usando email e senha com validacao de formato e
      mensagem de erro clara para credenciais invalidas

# CERTO - referencia specs
- [ ] Implementar login
  - US-AUTH-001: User Login
  - REQ-AUTH-001: Rate Limiting
```

---

## Fase 3: Plan → Codigo

### Processo de Execucao

```
1. Marcar tarefa como [-] in progress
2. Ler referencias nas specs (US-X, REQ-X, DES-X)
3. Consultar refs em specs/refs/
4. Consultar snippets em specs/snippets/
5. Implementar baseado nas especificacoes
6. Adicionar metadado "Implementado: caminho/arquivo"
7. Marcar como [x] done
8. Criar snippet se decisao nova reutilizavel
```

### Exemplo de Execucao

```markdown
# Antes
- [ ] Implementar login
  - US-AUTH-001: User Login

# Durante
- [-] Implementar login
  - US-AUTH-001: User Login

# Depois
- [x] Implementar login
  - US-AUTH-001: User Login
  - Implementado: app/src/app/(auth)/login/page.tsx
```

### Consulta de Referencias

Antes de implementar, verificar:

| Situacao | Refs |
|----------|------|
| Criar tela/pagina | `refs/ux/*` |
| Criar formulario | `refs/ux/forms.md` |
| Integrar API | `refs/patterns/api-calls.md` |
| Usar componente novo | `refs/stack/{lib}.md` |

### Criacao de Snippets

Apos implementar, se a decisao e reutilizavel:

| Situacao | Gerar? |
|----------|--------|
| Usou componente pela primeira vez | SIM |
| Criou padrao reutilizavel | SIM |
| Codigo especifico de uma tela | NAO |
| Logica de negocio unica | NAO |

**Regra:** Se vai usar de novo, crie snippet.

---

## Estados do Plano

### Simbolos

| Simbolo | Estado | Uso |
|---------|--------|-----|
| `[ ]` | Pending | Tarefa nao iniciada |
| `[-]` | In Progress | Trabalhando nesta tarefa |
| `[x]` | Done | Tarefa concluida |
| `[!]` | Blocked | Aguardando dependencia/decisao |

### Metadados

```markdown
- [x] Implementar feature
  - US-FEAT-001: User Story
  - REQ-FEAT-001: Requirement
  - Implementado: path/to/file.tsx
  - NOTA: Observacao relevante (opcional)
```

### Atualizacao

**IMPORTANTE:** Marcar tarefa como concluida IMEDIATAMENTE apos terminar.

Nunca acumular varios itens para marcar depois.

---

## Ciclo Refs e Snippets

```
ANTES de implementar          DEPOIS de implementar
        |                              |
        v                              v
┌───────────────┐              ┌───────────────┐
│  specs/refs/  │              │specs/snippets/│
│               │              │               │
│ "Como fazer"  │              │ "Como fizemos"│
│ (externo)     │              │ (interno)     │
└───────────────┘              └───────────────┘
```

### Comparacao

| Aspecto | Refs | Snippets |
|---------|------|----------|
| Quando | ANTES de implementar | DEPOIS de implementar |
| Origem | Externa (docs, designs, padroes) | Interna (decisoes do projeto) |
| Proposito | Guiar implementacao | Manter consistencia |
| Quem cria | Humano (curadoria) | IA (aprendizado) |
| Estabilidade | Estavel | Cresce com projeto |

### Fluxo de Refs

```
Pedido: "Cria uma dashboard"
         |
         v
┌─────────────────────────────┐
│ IA verifica specs/refs/ux/* │
│ Encontra: dashboard.md      │
│ Estuda o padrao             │
└─────────────────────────────┘
         |
         v
┌─────────────────────────────┐
│ Implementa seguindo padrao  │
│ (nao inventa do zero)       │
└─────────────────────────────┘
```

### Fluxo de Snippets

```
Primeira vez: "Preciso de um date-picker"
         |
         v
┌─────────────────────────────┐
│ IA implementa date-picker   │
│ Escolhe estilo, comportamento│
└─────────────────────────────┘
         |
         v
┌─────────────────────────────┐
│ IA cria snippet:            │
│ specs/snippets/date-picker.md│
└─────────────────────────────┘

Segunda vez: "Preciso de um date-picker"
         |
         v
┌─────────────────────────────┐
│ IA consulta snippet         │
│ Implementa IGUAL            │
└─────────────────────────────┘
```

---

## Multiplos Planos

### Quando Usar

Para projetos grandes, dividir em planos por escopo:

```
plans/
├── PLAN-MVP.md           # Plano do MVP
├── PLAN-V2.md            # Plano da versao 2
├── PLAN-HOTFIX.md        # Correcoes urgentes
└── PLAN-SPRINTS.md       # Plano por sprints
```

### Estrutura Alternativa

```
PLAN.md                   # Plano principal (link para outros)
plans/
├── phase-1-auth.md       # Fase 1: Autenticacao
├── phase-2-core.md       # Fase 2: Core Business
└── phase-3-ia.md         # Fase 3: Integracao IA
```

---

## Pausar e Resumir

O plano permite pausar e retomar trabalho:

1. **Estado salvo** - Tudo esta no arquivo PLAN.md
2. **Continuidade** - IA le plano e continua de onde parou
3. **Contexto preservado** - Referencias para specs mantem contexto
4. **Metadados** - `Implementado:` ajudam na retomada

### Exemplo de Retomada

```markdown
# Estado atual do plano

- [x] FASE 1: Autenticacao (completa)
- [-] FASE 2: Core Business
  - [x] CRUD entregas
  - [-] Calculo de frete  <-- Parou aqui
  - [ ] Notificacoes
- [ ] FASE 3: Integracao IA
```

IA le o plano, identifica tarefa `[-]` e continua.

---

## Quick Reference

### Iniciar Feature Nova

```bash
# 1. Criar specs
/vibe-feature AUTH

# 2. Consultar padroes existentes
/vibe-refs autenticacao

# 3. Criar plano
/vibe-plan

# 4. Executar
/execute-plan
```

### Durante Implementacao

| Acao | Comando |
|------|---------|
| Consultar referencia | Ler `specs/refs/{categoria}/{padrao}.md` |
| Consultar decisao anterior | Ler `specs/snippets/{tipo}/{nome}.md` |
| Registrar decisao nova | Criar snippet em `specs/snippets/` |
| Marcar tarefa concluida | Editar PLAN.md: `[ ]` → `[x]` |

### Regras de Ouro

1. Sempre consultar `specs/refs/` antes de criar algo novo
2. Sempre consultar `specs/snippets/` para manter consistencia
3. Sempre criar snippet se decisao nova e reutilizavel
4. Sempre marcar tarefa como concluida imediatamente
5. Nunca redocumentar specs no plano - apenas referenciar

---

## Checklist de Fase

### Fase 1: Brainstorming → Specs

- [ ] Li todo material de brainstorming
- [ ] Identifiquei todas as features
- [ ] Criei arquivo para cada feature
- [ ] Extrair User Stories (interacoes)
- [ ] Derivei Requirements (regras)
- [ ] Documentei Design (decisoes tecnicas)
- [ ] Criei features tecnicas (padroes)
- [ ] IDs seguem convencao

### Fase 2: Specs → Plan

- [ ] Agrupei tarefas em fases
- [ ] Cada tarefa referencia specs
- [ ] Ordenei por dependencias
- [ ] Identifiquei bloqueios
- [ ] Plano esta na raiz (PLAN.md)

### Fase 3: Plan → Codigo

- [ ] Marquei tarefa como [-]
- [ ] Li todas as referencias
- [ ] Consultei refs
- [ ] Consultei snippets
- [ ] Implementei
- [ ] Adicionei metadado Implementado:
- [ ] Marquei como [x]
- [ ] Criei snippet se necessario
