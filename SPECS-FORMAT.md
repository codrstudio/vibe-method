# Specs Format

Formato de especificações rastreáveis para desenvolvimento assistido por IA.

---

## Por que Specs Rastreáveis?

O maior problema de projetos de software é a **perda de rastreabilidade**: por que isso foi feito assim? O que motivou essa decisão? Quem pediu isso?

Specs rastreáveis resolvem isso:
- Cada requisito tem um **ID único** (US001, REQ014, DES030)
- IDs são **referenciados** no código, commits, e conversas com IA
- A IA pode **navegar** de uma implementação até sua origem

```
Código → "// Implements REQ014" → specs/requirements.md → "REQ014: Appointment Creation"
```

**Documentos sem IDs são difíceis de usar.** A IA não consegue referenciar "aquele parágrafo sobre autenticação no meio do calendar.md". Mas consegue referenciar "REQ040: User Authentication".

---

## Fase 1: Brainstorming → Specs

A primeira fase do método é **extrair specs do brainstorming**.

### Input (brainstorming/)

Material bruto coletado do cliente:
- Notas de reuniões
- Briefings
- Planilhas
- Documentos
- Screenshots
- Conversas

### Output (specs/)

Documentos estruturados e referenciáveis:
- `user-stories.md` - O QUE o usuário quer (US001, US002...)
- `requirements.md` - O QUE o sistema deve fazer (REQ001, NFR001...)
- `design.md` - COMO o sistema vai fazer (DES001, DES002...)

### Processo

```
1. Ler todo material de brainstorming
2. Identificar personas (quem usa o sistema)
3. Extrair histórias de usuário (US) por persona
4. Derivar requisitos funcionais (REQ) das histórias
5. Identificar requisitos não-funcionais (NFR)
6. Documentar decisões de design (DES) conforme arquitetura é definida
```

---

## Tipos de Specs

### User Stories (US)

**Propósito**: Capturar O QUE o usuário quer e POR QUÊ.

**Formato**:
```markdown
### US001: Phrasal Key

**Como** [persona],
**gostaria de** [ação],
**de forma a** [benefício].

**Critérios de Aceitação:**
- **Dado** [contexto]
- **Quando** [ação]
- **Então** [resultado esperado]
- **E** [resultado adicional]
```

**Regras**:
- ID sequencial com gaps por grupo (US001-009 Paciente, US010-019 Secretária, etc.)
- Phrasal Key em inglês, descritivo (ex: "Patient Book Appointment")
- Persona explícita no início
- Critérios de aceitação no formato Gherkin (Dado/Quando/Então)

**Exemplo**:
```markdown
### US002: Patient Book Appointment

**Como** paciente,
**gostaria de** agendar uma consulta via WhatsApp sem precisar ligar,
**de forma a** ter conveniência e agilidade no processo.

**Critérios de Aceitação:**
- **Dado** que solicito agendar uma consulta com um médico específico
- **Quando** o sistema identifica minha intenção de agendamento
- **Então** devo receber uma lista de horários disponíveis para escolher
- **E** ao escolher um horário, devo receber confirmação do agendamento
```

---

### Requirements - Funcionais (REQ)

**Propósito**: Capturar O QUE o sistema deve fazer.

**Formato**:
```markdown
#### REQ001: Phrasal Key

O sistema deve [ação com resultado esperado].
- Detalhe 1
- Detalhe 2
```

**Regras**:
- ID sequencial com gaps por módulo (REQ001-009 CANAL, REQ010-029 BACKBONE, etc.)
- Phrasal Key em inglês
- Verbo no imperativo ("deve", "must")
- Detalhes opcionais como sub-lista

**Exemplo**:
```markdown
#### REQ014: Appointment Creation

O sistema deve criar agendamentos no calendário quando paciente confirma horário.
- Bloquear horário na agenda do médico
- Armazenar dados do paciente (nome, telefone)
- Registrar origem (WhatsApp automático)
```

---

### Requirements - Não-Funcionais (NFR)

**Propósito**: Capturar COMO o sistema deve se comportar (qualidade).

**Categorias comuns**:
- Performance (tempo de resposta, throughput)
- Disponibilidade (uptime, recovery)
- Segurança (criptografia, acesso, compliance)
- Operacional (deploy, configuração, manutenção)
- Custo (limites operacionais)

**Formato**:
```markdown
#### NFR001: Phrasal Key

[Descrição do requisito de qualidade com métrica mensurável].
```

**Exemplo**:
```markdown
#### NFR001: Response Time

O tempo de resposta ao paciente deve ser inferior a 10 segundos.
```

---

### Design Decisions (DES)

**Propósito**: Documentar COMO o sistema vai implementar os requisitos.

**Formato**:
```markdown
### DES001: Phrasal Key

[Decisão de arquitetura/design com justificativa].
- Razão 1
- Razão 2

[Diagrama opcional em ASCII]
```

**Regras**:
- ID sequencial com gaps por área (DES001-009 Arquitetura, DES010-019 CANAL, etc.)
- Incluir JUSTIFICATIVA (por que essa escolha?)
- Diagramas ASCII quando ajudar visualização

**Exemplo**:
```markdown
### DES010: Evolution API Selection

Evolution API foi escolhida como gateway WhatsApp.
- Open-source e gratuito
- Self-hosted com controle total
- API REST completa
- Sem dependência de BSPs ou verificação Meta
```

---

## Índice de Referência

Todo documento de specs DEVE ter um **Índice de Referência** no final.

**Formato**:
```markdown
## Índice de Referência

| Código | Phrasal Key | Categoria |
|--------|-------------|-----------|
| US001 | Patient First Contact | Paciente |
| US002 | Patient Book Appointment | Paciente |
| REQ001 | Message Reception | CANAL |
| REQ002 | Message Sending | CANAL |
| NFR001 | Response Time | Performance |
| DES001 | Component Architecture | Arquitetura |
```

**Por que índice?**
- IA pode fazer busca rápida por ID ou keyword
- Visão geral de todas as specs em um lugar
- Detecta gaps na numeração (US007 faltando?)

---

## Referências Cruzadas

Specs devem referenciar outras specs quando relacionadas.

**No próprio spec**:
```markdown
### US002: Patient Book Appointment

...

**Refs:** REQ013, REQ014, DES020
```

**No código**:
```typescript
// Implements REQ014: Appointment Creation
async function createAppointment(data: AppointmentData) {
  ...
}
```

**No commit**:
```
feat(appointments): implement booking flow

Implements US002, REQ013, REQ014
```

**No PLAN.md**:
```markdown
- [ ] Implementar criação de agendamento (REQ014, DES020)
```

---

## Convenções de Numeração

### Gaps Intencionais

Use gaps na numeração para permitir inserções futuras:

```
US001-US009: Paciente
US010-US019: Secretária
US020-US029: Médico
US030-US039: Gestor

REQ001-REQ009: CANAL
REQ010-REQ029: BACKBONE
REQ030-REQ039: BRAIN
REQ040-REQ059: PORTAL
```

### Quando Criar Novo ID

- Nova funcionalidade → Novo ID
- Refinamento de existente → Atualizar ID existente
- Funcionalidade removida → Marcar como `[DEPRECATED]`, não reusar ID

---

## Anti-patterns

**NÃO faça:**

```markdown
# ❌ Documento sem IDs
## Autenticação
O sistema deve autenticar usuários...

## Agendamento
O sistema deve permitir agendamentos...
```

**Problema**: Como referenciar "Autenticação"? A IA não consegue citar isso precisamente.

**FAÇA:**

```markdown
# ✅ Documento com IDs
#### REQ040: User Authentication
O sistema deve autenticar usuários...

#### REQ014: Appointment Creation
O sistema deve criar agendamentos...
```

**Benefício**: `REQ040` é referência única e buscável.

---

## Documentos Auxiliares

Nem todo documento em `specs/` precisa ser referenciável. Alguns são auxiliares:

| Tipo | Exemplo | Precisa de IDs? |
|------|---------|-----------------|
| Core specs | user-stories.md, requirements.md, design.md | **SIM** |
| Padrões | api-response.md | Não (é referência de formato) |
| Configuração | environment.md | Não (é documentação operacional) |
| Detalhamento | calendar.md, whatsapp-connection.md | **Deveria ter** (são features complexas) |

**Regra**: Se o documento descreve funcionalidades que serão implementadas, use IDs.

---

## Template: Novo Projeto

Ao iniciar novo projeto, criar specs/ com estrutura mínima:

```markdown
# specs/user-stories.md

# User Stories

Histórias de usuário do [Nome do Projeto].

---

## [Persona 1]

### US001: [Phrasal Key]

**Como** [persona],
**gostaria de** [ação],
**de forma a** [benefício].

**Critérios de Aceitação:**
- **Dado** [contexto]
- **Quando** [ação]
- **Então** [resultado]

---

## Índice de Referência

| Código | Phrasal Key | Persona |
|--------|-------------|---------|
| US001 | ... | ... |
```

```markdown
# specs/requirements.md

# Requirements

Requisitos funcionais e não-funcionais do [Nome do Projeto].

---

## Requisitos Funcionais

### [Módulo 1]

#### REQ001: [Phrasal Key]

O sistema deve [ação].

---

## Requisitos Não-Funcionais

### Performance

#### NFR001: [Phrasal Key]

[Descrição com métrica].

---

## Índice de Referência

| Código | Phrasal Key | Categoria |
|--------|-------------|-----------|
| REQ001 | ... | ... |
| NFR001 | ... | ... |
```

---

## Checklist: Specs Completas

Antes de começar implementação:

- [ ] Todas as funcionalidades têm User Story?
- [ ] Todas as User Stories têm critérios de aceitação?
- [ ] Requirements cobrem todos os módulos do sistema?
- [ ] NFRs definem métricas mensuráveis?
- [ ] Decisões de arquitetura estão documentadas em DES?
- [ ] Todos os documentos têm Índice de Referência?
- [ ] IDs estão sendo usados em PLAN.md?
