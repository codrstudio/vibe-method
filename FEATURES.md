# Specs Format

Formato de especificações rastreáveis organizadas por **features**.

---

## Estrutura

```
specs/
└── features/
    ├── authentication.md   # US + REQ + DES
    ├── deliveries.md       # US + REQ
    ├── stack-patterns.md   # DES only
    └── ...
```

Cada feature é um arquivo markdown contendo as seções relevantes:

| Seção | Quando usar |
|-------|-------------|
| **User Stories** | Feature tem interação humana |
| **Requirements** | Feature tem regras de negócio |
| **Design** | Feature tem decisões de arquitetura/engenharia |

---

## O que é uma Feature?

Uma **feature** é um **domínio funcional coeso** do sistema.

### Características

| Critério | Descrição |
|----------|-----------|
| **Coesão** | Elementos são relacionados entre si |
| **Independência** | Pode ser entendida com mínimo contexto externo |
| **Boundary claro** | Você consegue dizer "isso pertence à feature X" |

### Como identificar features

1. Quais "áreas" o usuário vê no sistema? (menu, telas)
2. Quais domínios de negócio existem?
3. Quais funcionalidades podem ser ligadas/desligadas independentemente?
4. Quais padrões técnicos são transversais?

### Exemplos

**Sistema de entregas:**
- `deliveries` - Core do negócio (US + REQ)
- `settlements` - Fechamentos financeiros (US + REQ)
- `authentication` - Login e sessão (US + REQ + DES)
- `copilot` - Assistente IA (US + REQ + DES)
- `stack-patterns` - Padrões de código (DES only)

---

## User Stories (US)

### Quando usar

Quando a feature envolve **interação humana** — alguém faz algo no sistema.

### O que é

Captura O QUE o usuário quer e POR QUÊ, na perspectiva dele.

### Formato

```markdown
### US-{FEAT}-001: {Título}

**Como** {persona},
**Quero** {ação},
**Para** {benefício}.

**Critérios de Aceite:**
- [ ] Critério 1
- [ ] Critério 2
```

### Exemplo

```markdown
### US-AUTH-001: User Login

**Como** usuário,
**Quero** fazer login com email e senha,
**Para** acessar o sistema de forma segura.

**Critérios de Aceite:**
- [ ] Formulário com campos de email e senha
- [ ] Mensagem de erro clara para credenciais inválidas
- [ ] Redirecionamento para dashboard após sucesso
```

---

## Requirements (REQ)

### Quando usar

Quando a feature tem **regras de negócio** — o sistema deve se comportar de certa forma.

### O que é

Captura O QUE o sistema deve fazer, sem dizer COMO.

**Características:**
- Linguagem de negócio (PO/cliente entende)
- Agnóstico de tecnologia
- Descreve comportamento esperado
- Inclui requisitos funcionais E não-funcionais

### Teste: É Requirement?

Pergunte "por quê?" — se a resposta é **"porque o negócio precisa"**, é REQ.

### Formato

```markdown
### REQ-{FEAT}-001: {Título}

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
- Após 5 tentativas, bloquear por 15 minutos
- Exibir mensagem informando tempo restante
- Registrar tentativas em log de segurança
```

**Não-funcional (ainda é REQ!):**
```markdown
### REQ-AUTH-002: Session Expiration

Sessões devem expirar após 7 dias de inatividade.

**Regras:**
- Usuário deve ser redirecionado para login
- Dados não salvos devem gerar aviso antes de expirar
```

**Performance (ainda é REQ!):**
```markdown
### REQ-DELIV-010: Response Time

O tempo de resposta da listagem de entregas deve ser inferior a 200ms.

**Regras:**
- Medido no percentil 95
- Válido para até 10.000 registros
```

---

## Design (DES)

### Quando usar

Quando a feature envolve **decisões de arquitetura ou engenharia** — escolhas técnicas de implementação.

### O que é

Captura COMO o sistema vai implementar os requisitos.

**Características:**
- Linguagem técnica (dev entende)
- Específico de tecnologia
- Descreve solução escolhida
- Inclui justificativa

### Teste: É Design?

Pergunte "por quê?" — se a resposta é **"porque é a melhor solução técnica"**, é DES.

### Formato

```markdown
### DES-{FEAT}-001: {Título}

{Decisão técnica com justificativa}

**Implementação:**
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

**Implementação:**
- Key pattern: `ratelimit:login:{ip}`
- TTL: 60 segundos
- Incrementar contador a cada tentativa
- Bloquear quando counter > 5

**Trade-offs:**
- Redis adiciona dependência externa
- Mas permite rate limiting distribuído em múltiplas instâncias
```

**Padrão técnico:**
```markdown
### DES-STACK-001: API Response Format

Todas as APIs devem seguir formato padronizado de resposta.

**Implementação:**
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

## Requirement vs Design

| Aspecto | Requirement (REQ) | Design (DES) |
|---------|-------------------|--------------|
| **Pergunta** | O QUE o sistema deve fazer? | COMO vamos fazer? |
| **Linguagem** | Negócio (PO entende) | Técnica (dev entende) |
| **Tecnologia** | Não menciona | Especifica |
| **Validado por** | Cliente/PO | Equipe técnica |
| **Muda quando** | Negócio muda | Arquitetura muda |

### Exemplo lado a lado

```
REQUISITO (o quê):
  "O sistema deve limitar tentativas de login a 5 por minuto"
  → Qualquer pessoa entende
  → Não diz como implementar

DESIGN (como):
  "Usar Redis com key login:{ip} e TTL 60s, incrementando contador"
  → Só dev entende
  → Especifica a solução técnica
```

### Mais exemplos

| Requisito | Design |
|-----------|--------|
| Sessões expiram em 7 dias | JWT com exp claim + refresh token em httpOnly cookie |
| Resposta < 200ms | Cache Redis com invalidação por pub/sub |
| Senhas devem ser seguras | bcrypt com cost 12, validação regex no frontend |
| Dados sensíveis criptografados | AES-256-GCM, chaves em AWS KMS |

---

## Tipos de Feature

### Feature completa (US + REQ + DES)

Quando há interação humana, regras de negócio E decisões técnicas.

```markdown
# Feature: Authentication

Autenticação e gerenciamento de sessão.

---

## User Stories

### US-AUTH-001: User Login
...

---

## Requirements

### REQ-AUTH-001: Rate Limiting
...

---

## Design

### DES-AUTH-001: JWT Implementation
...
```

### Feature de negócio (US + REQ)

Quando há interação e regras, mas sem decisões de arquitetura específicas.

```markdown
# Feature: Deliveries

Gestão de entregas do sistema.

---

## User Stories

### US-DELIV-001: Create Delivery
...

---

## Requirements

### REQ-DELIV-001: Delivery Validation
...
```

### Feature técnica (DES only)

Quando é engenharia pura — padrões, convenções, stack.

```markdown
# Feature: Stack Patterns

Padrões técnicos e convenções do projeto.

---

## Design

### DES-STACK-001: API Response Format
...

### DES-STACK-002: Error Handling Pattern
...
```

---

## Convenção de IDs

### Formato

```
{TIPO}-{FEATURE}-{NÚMERO}

US-AUTH-001      # User Story de Authentication
REQ-AUTH-001     # Requirement de Authentication
DES-AUTH-001     # Design de Authentication
DES-STACK-001    # Design de Stack Patterns
```

### Prefixos sugeridos

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

---

## Referências Cruzadas

### Dentro da feature

```markdown
### REQ-AUTH-001: Rate Limiting

...

**Refs:** US-AUTH-001
**Impl:** DES-AUTH-001
```

### Entre features

```markdown
### REQ-PAY-001: Payment Authorization

O sistema deve validar sessão antes de processar pagamento.

**Depends:** REQ-AUTH-002 (session validation)
```

### No código

```typescript
// Implements REQ-AUTH-001: Rate Limiting
// Design: DES-AUTH-001
async function checkRateLimit(ip: string) {
  ...
}
```

### No commit

```
feat(auth): implement rate limiting

Implements REQ-AUTH-001
Design: DES-AUTH-001
```

---

## Processo: Brainstorming → Features

### Input (brainstorming/)

Material bruto: notas, briefings, conversas, screenshots.

### Output (specs/features/)

Um arquivo por feature identificada.

### Processo

```
1. Ler todo material de brainstorming
2. Identificar domínios funcionais (features)
3. Para cada feature:
   a. Criar arquivo {feature}.md
   b. Tem interação humana? → Extrair User Stories
   c. Tem regras de negócio? → Derivar Requirements
   d. Tem decisões técnicas? → Documentar Design
4. Identificar padrões transversais → Criar features técnicas
```

---

## Anti-patterns

### ❌ Misturar REQ e DES

```markdown
### REQ-AUTH-001: Login

O sistema deve autenticar usuários usando JWT com Redis para sessões.
```

**Problema:** Mistura o quê (autenticar) com como (JWT + Redis).

**Solução:** Separar em REQ + DES.

### ❌ Feature muito granular

```
features/
├── login.md
├── logout.md
├── password-reset.md
```

**Problema:** Fragmentação excessiva.

**Solução:** Agrupar em `authentication.md`.

### ❌ Feature muito ampla

```
features/
├── core.md       # Tudo
├── settings.md
```

**Problema:** Arquivo enorme, difícil navegar.

**Solução:** Dividir por domínios reais.

---

## Checklist

Antes de implementar:

- [ ] Features identificadas cobrem todo o sistema?
- [ ] Cada interação humana tem User Story?
- [ ] Cada regra de negócio tem Requirement?
- [ ] Decisões técnicas documentadas em Design?
- [ ] REQ não menciona tecnologia?
- [ ] DES tem justificativa?
- [ ] IDs seguem convenção `{TIPO}-{FEAT}-{NUM}`?
- [ ] Dependências entre features documentadas?
