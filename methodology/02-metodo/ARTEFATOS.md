# Artefatos

Tipos de artefatos do Vibe Method e seus formatos.

---

## Indice

1. [Visao Geral](#visao-geral) - Mapa de artefatos
2. [Features](#features) - US + REQ + DES
3. [User Stories](#user-stories-us) - Interacoes humanas
4. [Requirements](#requirements-req) - Regras de negocio
5. [Design](#design-des) - Decisoes tecnicas
6. [Refs](#refs) - Padroes externos
7. [Snippets](#snippets) - Decisoes internas
8. [Plan](#plan) - Checklist de execucao
9. [Instructions](#instructions-claudemd) - Contexto para IA
10. [Convencao de IDs](#convencao-de-ids) - Sistema de referencias

---

## Visao Geral

| Artefato | Local | Proposito |
|----------|-------|-----------|
| **Features** | `specs/features/` | US + REQ + DES por dominio |
| **Refs** | `specs/refs/` | Padroes a consultar ANTES |
| **Snippets** | `specs/snippets/` | Decisoes registradas DEPOIS |
| **Plan** | `PLAN.md` | Checklist de execucao |
| **Instructions** | `CLAUDE.md` | Contexto para IA |

### Estrutura de Pastas

```
specs/
├── features/              # Especificacoes por dominio
│   ├── authentication.md  # US + REQ + DES
│   ├── deliveries.md      # US + REQ
│   └── stack-patterns.md  # DES only
├── refs/                  # Consultar ANTES de implementar
│   ├── ux/
│   ├── patterns/
│   └── stack/
└── snippets/              # Registrar DEPOIS de implementar
    ├── ui/
    └── patterns/
```

---

## Features

### O que e uma Feature

Uma **feature** e um **dominio funcional coeso** do sistema.

### Criterios de Feature

| Criterio | Descricao |
|----------|-----------|
| **Coesao** | Elementos sao relacionados entre si |
| **Independencia** | Pode ser entendida com minimo contexto externo |
| **Boundary claro** | Voce consegue dizer "isso pertence a feature X" |

### Como Identificar Features

1. Quais "areas" o usuario ve no sistema? (menu, telas)
2. Quais dominios de negocio existem?
3. Quais funcionalidades podem ser ligadas/desligadas independentemente?
4. Quais padroes tecnicos sao transversais?

### Tipos de Feature

| Tipo | Composicao | Exemplo |
|------|------------|---------|
| **Completa** | US + REQ + DES | authentication.md |
| **Negocio** | US + REQ | deliveries.md |
| **Tecnica** | DES only | stack-patterns.md |

### Quando Usar Cada Secao

| Secao | Quando usar |
|-------|-------------|
| **User Stories** | Feature tem interacao humana |
| **Requirements** | Feature tem regras de negocio |
| **Design** | Feature tem decisoes de arquitetura/engenharia |

### Template de Feature Completa

```markdown
# Feature: Authentication

Autenticacao e gerenciamento de sessao.

---

## User Stories

### US-AUTH-001: User Login
...

### US-AUTH-002: User Logout
...

---

## Requirements

### REQ-AUTH-001: Rate Limiting
...

### REQ-AUTH-002: Session Expiration
...

---

## Design

### DES-AUTH-001: JWT Implementation
...

### DES-AUTH-002: Refresh Token Flow
...
```

---

## User Stories (US)

### Quando Usar

Quando a feature envolve **interacao humana** - alguem faz algo no sistema.

### O que E

Captura O QUE o usuario quer e POR QUE, na perspectiva dele.

### Formato

```markdown
### US-{FEAT}-001: {Titulo}

**Como** {persona},
**Quero** {acao},
**Para** {beneficio}.

**Criterios de Aceite:**
- [ ] Criterio 1
- [ ] Criterio 2
```

### Exemplo

```markdown
### US-AUTH-001: User Login

**Como** usuario,
**Quero** fazer login com email e senha,
**Para** acessar o sistema de forma segura.

**Criterios de Aceite:**
- [ ] Formulario com campos de email e senha
- [ ] Mensagem de erro clara para credenciais invalidas
- [ ] Redirecionamento para dashboard apos sucesso
- [ ] Opcao "Lembrar-me" para manter sessao
```

### Boas Praticas

- Persona deve ser especifica (nao "usuario generico")
- Beneficio deve ser real (nao "para usar a feature")
- Criterios de aceite devem ser verificaveis
- Um US = uma interacao completa

---

## Requirements (REQ)

### Quando Usar

Quando a feature tem **regras de negocio** - o sistema deve se comportar de certa forma.

### O que E

Captura O QUE o sistema deve fazer, sem dizer COMO.

### Caracteristicas

- Linguagem de negocio (PO/cliente entende)
- Agnostico de tecnologia
- Descreve comportamento esperado
- Inclui requisitos funcionais E nao-funcionais

### Teste: E Requirement?

Pergunte "por que?" - se a resposta e **"porque o negocio precisa"**, e REQ.

### Formato

```markdown
### REQ-{FEAT}-001: {Titulo}

{O que o sistema deve fazer}

**Regras:**
- Regra 1
- Regra 2
```

### Exemplos

**Funcional:**
```markdown
### REQ-AUTH-001: Login Rate Limiting

O sistema deve limitar tentativas de login a 5 por minuto por IP.

**Regras:**
- Apos 5 tentativas, bloquear por 15 minutos
- Exibir mensagem informando tempo restante
- Registrar tentativas em log de seguranca
```

**Nao-funcional (ainda e REQ!):**
```markdown
### REQ-AUTH-002: Session Expiration

Sessoes devem expirar apos 7 dias de inatividade.

**Regras:**
- Usuario deve ser redirecionado para login
- Dados nao salvos devem gerar aviso antes de expirar
```

**Performance (ainda e REQ!):**
```markdown
### REQ-DELIV-010: Response Time

O tempo de resposta da listagem de entregas deve ser inferior a 200ms.

**Regras:**
- Medido no percentil 95
- Valido para ate 10.000 registros
```

---

## Design (DES)

### Quando Usar

Quando a feature envolve **decisoes de arquitetura ou engenharia** - escolhas tecnicas de implementacao.

### O que E

Captura COMO o sistema vai implementar os requisitos.

### Caracteristicas

- Linguagem tecnica (dev entende)
- Especifico de tecnologia
- Descreve solucao escolhida
- Inclui justificativa

### Teste: E Design?

Pergunte "por que?" - se a resposta e **"porque e a melhor solucao tecnica"**, e DES.

### Formato

```markdown
### DES-{FEAT}-001: {Titulo}

{Decisao tecnica com justificativa}

**Implementacao:**
- Detalhe 1
- Detalhe 2

**Trade-offs:**
- Vantagem
- Desvantagem aceita
```

### Exemplos

**Implementando um REQ:**
```markdown
### DES-AUTH-001: Rate Limiting Implementation

Usar Redis para rate limiting de login.

**Implementacao:**
- Key pattern: `ratelimit:login:{ip}`
- TTL: 60 segundos
- Incrementar contador a cada tentativa
- Bloquear quando counter > 5

**Trade-offs:**
- Redis adiciona dependencia externa
- Mas permite rate limiting distribuido em multiplas instancias
```

**Padrao tecnico:**
```markdown
### DES-STACK-001: API Response Format

Todas as APIs devem seguir formato padronizado de resposta.

**Implementacao:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Trade-offs:**
- Envelope adiciona bytes
- Mas simplifica tratamento de erro no frontend
```

---

## REQ vs DES

### Comparacao

| Aspecto | Requirement (REQ) | Design (DES) |
|---------|-------------------|--------------|
| **Pergunta** | O QUE o sistema deve fazer? | COMO vamos fazer? |
| **Linguagem** | Negocio (PO entende) | Tecnica (dev entende) |
| **Tecnologia** | Nao menciona | Especifica |
| **Validado por** | Cliente/PO | Equipe tecnica |
| **Muda quando** | Negocio muda | Arquitetura muda |

### Exemplo Lado a Lado

```
REQUISITO (o que):
  "O sistema deve limitar tentativas de login a 5 por minuto"
  → Qualquer pessoa entende
  → Nao diz como implementar

DESIGN (como):
  "Usar Redis com key login:{ip} e TTL 60s, incrementando contador"
  → So dev entende
  → Especifica a solucao tecnica
```

### Mais Exemplos

| Requisito | Design |
|-----------|--------|
| Sessoes expiram em 7 dias | JWT com exp claim + refresh token em httpOnly cookie |
| Resposta < 200ms | Cache Redis com invalidacao por pub/sub |
| Senhas devem ser seguras | bcrypt com cost 12, validacao regex no frontend |
| Dados sensiveis criptografados | AES-256-GCM, chaves em AWS KMS |

---

## Refs

### Conceito

Padroes externos que a IA consulta ANTES de implementar.

### Proposito

Evitar que a IA "invente" solucoes quando ja existem padroes definidos.

### Estrutura

```
specs/refs/
├── ux/                    # Padroes de interface
│   ├── dashboard.md
│   ├── forms.md
│   └── tables.md
├── patterns/              # Padroes de codigo
│   ├── api-calls.md
│   └── error-handling.md
└── stack/                 # Referencias de tecnologia
    ├── shadcn.md
    └── react-query.md
```

### Fluxo de Uso

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

### Quando Consultar

| Situacao | Refs |
|----------|------|
| Criar tela/pagina | `refs/ux/*` |
| Criar formulario | `refs/ux/forms.md` |
| Integrar API | `refs/patterns/api-calls.md` |
| Usar componente novo | `refs/stack/{lib}.md` |

### Formato de Ref

```markdown
# {Nome do Padrao}

{Descricao breve}

---

## Quando usar
- Situacao 1
- Situacao 2

## Quando NAO usar
- Situacao 1

---

## Estrutura
{Layout/organizacao}

---

## Exemplo
{Codigo ou visual}

---

## Checklist
- [ ] Item obrigatorio 1
- [ ] Item obrigatorio 2
```

---

## Snippets

### Conceito

Decisoes de implementacao registradas DEPOIS de implementar.

### Proposito

Manter consistencia nas proximas implementacoes similares.

### Estrutura

```
specs/snippets/
├── ui/                    # Componentes
│   ├── date-picker.md
│   ├── data-table.md
│   └── modal.md
└── patterns/              # Padroes
    ├── api-mutation.md
    └── form-validation.md
```

### Fluxo de Uso

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

### Quando Gerar

| Situacao | Gerar? |
|----------|--------|
| Usou componente pela primeira vez | SIM |
| Criou padrao reutilizavel | SIM |
| Codigo especifico de uma tela | NAO |
| Logica de negocio unica | NAO |

**Regra:** Se vai usar de novo, crie snippet.

### Formato de Snippet

```markdown
# {Nome}

{O que e e quando usar - 1 linha}

---

## Uso

```tsx
// Codigo de exemplo
```

---

## Props/Variacoes

| Prop | Tipo | Descricao |
|------|------|-----------|

---

## Decisoes

- Por que escolhemos X
- Comportamentos especificos
- Edge cases tratados
```

---

## Plan

### Conceito

Checklist de execucao que referencia specs.

```
specs/features/  ->  PLAN.md         ->  codigo
(o que fazer)        (checklist)         (feito)
```

### Formato

```markdown
# PLAN.md

## FASE N: Nome da Fase

- [status] Tarefa
  - REF001: Nome da referencia
  - NOTA: Observacao (opcional)
  - Implementado: caminho (apos concluir)
```

### Estados

| Simbolo | Estado |
|---------|--------|
| `[ ]` | Pending |
| `[-]` | In Progress |
| `[x]` | Done |
| `[!]` | Blocked |

### Exemplo Completo

```markdown
# PLAN.md

## FASE 1: Autenticacao

- [x] Implementar login
  - US-AUTH-001: User Login
  - REQ-AUTH-001: Rate Limiting
  - DES-AUTH-001: JWT Implementation
  - Implementado: app/src/app/(auth)/login/page.tsx

- [-] Implementar logout
  - US-AUTH-002: User Logout

- [ ] Implementar refresh token
  - REQ-AUTH-002: Session Expiration
  - DES-AUTH-002: Refresh Token Flow

## FASE 2: Core Business

- [!] Implementar CRUD entregas
  - US-DELIV-001: Create Delivery
  - NOTA: Bloqueado - aguardando definicao de campos
```

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

## Instructions (CLAUDE.md)

### Proposito

Contexto que a IA le ao iniciar sessao. Unica fonte de verdade sobre o projeto.

### Estrutura Recomendada

```markdown
# CLAUDE.md

## Projeto
[Nome e descricao]

## Comandos
[Scripts disponiveis]

## Portas
[Servicos e portas]

## Arquitetura
[Diagrama e componentes]

## Regras Criticas
[O que NUNCA fazer]

## Variaveis de Ambiente
[Padrao de .env]

## Estrutura
[Mapa do projeto]

## Troubleshooting
[Problemas comuns]
```

### Secoes Opcionais

| Secao | Quando usar |
|-------|-------------|
| Usuarios de Teste | App com auth |
| Docker Init Containers | Multiplos docker-compose |
| APIs Externas | Integracoes |
| Bases de Dados | Multiplas conexoes |

---

## Convencao de IDs

### Formato

```
{TIPO}-{FEATURE}-{NUMERO}

US-AUTH-001      # User Story de Authentication
REQ-AUTH-001     # Requirement de Authentication
DES-AUTH-001     # Design de Authentication
DES-STACK-001    # Design de Stack Patterns
```

### Prefixos Sugeridos

| Feature | Prefixo |
|---------|---------|
| authentication | AUTH |
| deliveries | DELIV |
| payments | PAY |
| settings | SETT |
| user-profile | PROF |
| permissions | PERM |
| stack-patterns | STACK |
| api-conventions | API |

### Referencias Cruzadas

**Dentro da feature:**
```markdown
### REQ-AUTH-001: Rate Limiting

...

**Refs:** US-AUTH-001
**Impl:** DES-AUTH-001
```

**Entre features:**
```markdown
### REQ-PAY-001: Payment Authorization

O sistema deve validar sessao antes de processar pagamento.

**Depends:** REQ-AUTH-002 (session validation)
```

**No codigo:**
```typescript
// Implements REQ-AUTH-001: Rate Limiting
// Design: DES-AUTH-001
async function checkRateLimit(ip: string) {
  ...
}
```

**No commit:**
```
feat(auth): implement rate limiting

Implements REQ-AUTH-001
Design: DES-AUTH-001
```

---

## Anti-patterns

### Misturar REQ e DES

```markdown
# ERRADO
### REQ-AUTH-001: Login

O sistema deve autenticar usuarios usando JWT com Redis para sessoes.
```

**Problema:** Mistura o que (autenticar) com como (JWT + Redis).
**Solucao:** Separar em REQ + DES.

### Feature muito granular

```
# ERRADO
features/
├── login.md
├── logout.md
├── password-reset.md
```

**Problema:** Fragmentacao excessiva.
**Solucao:** Agrupar em `authentication.md`.

### Feature muito ampla

```
# ERRADO
features/
├── core.md       # Tudo
├── settings.md
```

**Problema:** Arquivo enorme, dificil navegar.
**Solucao:** Dividir por dominios reais.

---

## Checklist

### Antes de Implementar

- [ ] Features identificadas cobrem todo o sistema?
- [ ] Cada interacao humana tem User Story?
- [ ] Cada regra de negocio tem Requirement?
- [ ] Decisoes tecnicas documentadas em Design?
- [ ] REQ nao menciona tecnologia?
- [ ] DES tem justificativa?
- [ ] IDs seguem convencao `{TIPO}-{FEAT}-{NUM}`?
- [ ] Dependencias entre features documentadas?
- [ ] Refs existem para padroes usados?
- [ ] Snippets existem para decisoes anteriores?
