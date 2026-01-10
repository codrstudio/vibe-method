# Design Docs

Documentos de decisão de arquitetura, estrutura e vocabulário conceitual.

---

## Visão Geral

Design docs definem **conceitos referenciáveis** que criam vocabulário consistente para o projeto.

```
specs/
├── design.md            # Mapa: partes do sistema e conexões
│
├── design-ux.md         # Vocabulário: interface
├── design-api.md        # Vocabulário: APIs
├── design-workflow.md   # Vocabulário: automações
├── design-data.md       # Vocabulário: entidades
└── design-infra.md      # Vocabulário: infraestrutura
```

---

## design.md - Mapa do Projeto

**Propósito**: Visão de alto nível. A IA olha aqui primeiro para entender as partes que compõem o sistema.

**Conteúdo**:
- Componentes principais
- Como se conectam
- Responsabilidade de cada parte
- Diagrama de arquitetura

**Exemplo**:
```markdown
# Design

Visão geral da arquitetura do sistema.

## Componentes

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CANAL     │────►│   BACKBONE  │────►│    BRAIN    │
│ (WhatsApp)  │◄────│ (Orquestração)│◄──│    (LLM)    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   PORTAL    │
                    │ (Dashboard) │
                    └─────────────┘

| Componente | Responsabilidade | Tech |
|------------|------------------|------|
| CANAL | Gateway WhatsApp | Evolution API |
| BACKBONE | Orquestração de fluxos | n8n |
| BRAIN | Processamento de linguagem | OpenRouter |
| PORTAL | Interface web | Next.js |

## Detalhamentos

- Interface: [design-ux.md](./design-ux.md)
- APIs: [design-api.md](./design-api.md)
- Automações: [design-workflow.md](./design-workflow.md)
- Entidades: [design-data.md](./design-data.md)
- Infraestrutura: [design-infra.md](./design-infra.md)
```

---

## design-{area}.md - Vocabulário por Área

**Propósito**: Definir conceitos referenciáveis de uma área específica.

**Não é código** - código vai em `snippets/`. Aqui é **conceito**:
- O que é
- Para que serve
- Quando usar
- Quando NÃO usar
- Nome canônico (ID único ou classe)

### Prefixos por Área

| Arquivo | Prefixo | Descrição |
|---------|---------|-----------|
| design-ux.md | UX | Interface, componentes, padrões visuais |
| design-api.md | API | Endpoints, contratos, autenticação |
| design-workflow.md | WF | Fluxos de automação, handlers |
| design-data.md | DATA | Entidades, relacionamentos, estados |
| design-infra.md | INFRA | Containers, redes, deploy |

### Formato de Entrada

```markdown
### {PREFIX}{NNN}: {Nome Canônico}

**Tipo**: {único | classe}
**ID/Class**: `{identificador}`

**O que é**: [descrição concisa]

**Para que serve**: [propósito]

**Quando usar**:
- Situação 1
- Situação 2

**Quando NÃO usar**:
- Situação 1
- Situação 2

**Variações**: [se houver]

**Refs**: [outras referências relacionadas]
```

---

## Exemplo: design-ux.md

> **Nota**: Os exemplos abaixo são ilustrativos para demonstrar o formato.
> Cada projeto define seu próprio vocabulário conforme necessidade.

```markdown
# Design UX

Vocabulário de interface do usuário.

---

## Navegação

### UX001: App Sidebar

**Tipo**: único
**ID**: `#app-sidebar`

**O que é**: Barra lateral principal de navegação.

**Para que serve**: Acesso aos módulos do sistema e ações do usuário.

**Estrutura**:
- Header (brand)
- Content (menu de navegação)
- Footer (user menu)

**Quando usar**:
- Layout autenticado (app)

**Quando NÃO usar**:
- Páginas públicas
- Fluxo de autenticação

**Refs**: DES054

---

### UX002: Breadcrumb Bar

**Tipo**: classe
**Class**: `.breadcrumb-bar`

**O que é**: Barra de navegação hierárquica mostrando caminho atual.

**Para que serve**: Orientação do usuário em páginas com profundidade > 1.

**Quando usar**:
- Páginas de detalhe (ex: Paciente > João Silva)
- Páginas de configuração aninhadas
- Qualquer página com parent lógico

**Quando NÃO usar**:
- Páginas de primeiro nível (Timeline, Inbox, Pulse)
- Modais

**Refs**: -

---

### UX003: Empty State

**Tipo**: classe
**Class**: `.empty-state`

**O que é**: Feedback visual quando uma lista ou área está vazia.

**Para que serve**: Informar o usuário e sugerir ação.

**Estrutura**:
- Ilustração ou ícone (opcional)
- Título
- Descrição
- CTA (opcional)

**Quando usar**:
- Listas vazias
- Resultados de busca sem match
- Primeiro uso de funcionalidade

**Quando NÃO usar**:
- Erros (usar Error State)
- Carregamento (usar Skeleton)

**Refs**: -

---

### UX004: Floating Action Button (FAB)

**Tipo**: único por página
**ID**: `#fab-{page}`

**O que é**: Botão flutuante para ação primária contextual.

**Para que serve**: Acesso rápido à ação mais importante da página.

**Posição**: Fixo, bottom-right, acima da navegação mobile.

**Quando usar**:
- Páginas com ação de criação clara
- Uma ação primária por página

**Quando NÃO usar**:
- Múltiplas ações igualmente importantes
- Páginas de detalhe/edição

**Refs**: DES (specs/calendar.md - Estados do FAB)

---

## Feedback

### UX010: Toast Notification

**Tipo**: classe
**Class**: `.toast`

**O que é**: Notificação temporária não-bloqueante.

**Para que serve**: Feedback de ações (sucesso, erro, info).

**Duração**: 3-5 segundos, dismiss manual ou automático.

**Quando usar**:
- Confirmação de ação concluída
- Erros não-críticos
- Informações contextuais

**Quando NÃO usar**:
- Erros críticos que bloqueiam fluxo
- Informações que precisam de ação

**Refs**: -

---

## Índice de Referência

| Código | Nome | Tipo |
|--------|------|------|
| UX001 | App Sidebar | único |
| UX002 | Breadcrumb Bar | classe |
| UX003 | Empty State | classe |
| UX004 | Floating Action Button | único |
| UX010 | Toast Notification | classe |
```

---

## Exemplo: design-workflow.md

> **Nota**: Exemplo ilustrativo para demonstrar o formato.

```markdown
# Design Workflow

Vocabulário de automações (n8n).

---

## Handlers

### WF001: Message Handler

**O que é**: Workflow que processa mensagens recebidas do WhatsApp.

**Para que serve**: Rotear mensagens para processamento adequado.

**Trigger**: Webhook do Evolution API.

**Quando usar**:
- Toda mensagem entrante passa por aqui

**Fluxo**:
1. Recebe webhook
2. Valida origem
3. Identifica conversa
4. Roteia para processamento

**Refs**: REQ010, DES020

---

### WF002: Escalation Handler

**O que é**: Workflow que cria tarefas quando IA não consegue resolver.

**Para que serve**: Transferir para atendimento humano.

**Trigger**: Chamado pelo Message Handler.

**Quando usar**:
- Confiança da IA < 70%
- Palavras-chave de urgência
- Solicitação explícita de humano

**Refs**: REQ016, REQ017

---

## Índice de Referência

| Código | Nome | Trigger |
|--------|------|---------|
| WF001 | Message Handler | Webhook Evolution |
| WF002 | Escalation Handler | Interno |
```

---

## Fluxo de Uso

### Antes de Implementar

```
IA recebe tarefa: "Criar página de listagem de pacientes"
     │
     ▼
Consulta design.md → Entende que é parte do PORTAL
     │
     ▼
Consulta design-ux.md → Encontra conceitos relevantes:
  - UX003: Empty State (para lista vazia)
  - UX004: FAB (para ação de criar)
  - UX010: Toast (para feedback)
     │
     ▼
Implementa usando vocabulário consistente
```

### Criando Novo Conceito

```
IA precisa de algo que não existe no vocabulário
     │
     ▼
ANTES de implementar:
  1. Define o conceito
  2. Escolhe nome canônico
  3. Documenta em design-{area}.md
  4. Implementa usando o nome definido
     │
     ▼
Conceito disponível para reutilização futura
```

---

## Relação com Outros Documentos

```
┌─────────────────┐
│  user-stories   │  O QUE o usuário quer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  requirements   │  O QUE o sistema faz
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  design.md      │  COMO (visão geral, partes)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  design-*.md    │  COMO (vocabulário por área)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  snippets/      │  COMO (código reutilizável)
└─────────────────┘
```

---

## Anti-patterns

**NÃO faça:**

```markdown
❌ Inventar nome sem documentar
// Código usa "navigation-breadcrumb" sem entrada em design-ux.md

❌ Código no design doc
### UX002: Breadcrumb Bar
```tsx
export function Breadcrumb() { ... }  // Isso vai em snippets/
```

❌ Conceito sem ID
### Breadcrumb Bar  // Falta o código UX002
```

**FAÇA:**

```markdown
✅ Documentar antes de implementar
1. Criar entrada UX002 em design-ux.md
2. Implementar usando nome documentado
3. Criar snippet com código se reutilizável

✅ Apenas conceito no design doc
### UX002: Breadcrumb Bar
**O que é**: Barra de navegação hierárquica...

✅ Sempre com ID referenciável
### UX002: Breadcrumb Bar
```

---

## Checklist

### Novo Conceito
- [ ] Conceito tem ID único (UX001, WF001, etc.)?
- [ ] Nome canônico definido?
- [ ] "O que é" está claro?
- [ ] "Quando usar" está definido?
- [ ] "Quando NÃO usar" está definido?
- [ ] Adicionado ao índice de referência?

### Implementação
- [ ] Conceito já existe em design-*.md?
- [ ] Se não existe, documentar ANTES de implementar?
- [ ] Usando nome canônico no código?
- [ ] Snippet criado se código for reutilizável?
