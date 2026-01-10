# Refs e Snippets

Sistema de conhecimento para consistência e eficiência no desenvolvimento assistido por IA.

---

## Visão Geral

```
┌─────────────┐                              ┌─────────────┐
│    refs/    │  ──── pesquisa ────►         │             │
│             │                              │   IA impl   │
│  Referências│                              │             │
│  externas   │                              └──────┬──────┘
└─────────────┘                                     │
       ▲                                            │ documenta
       │                                            ▼
       │ consulta se                         ┌─────────────┐
       │ não encontrar                       │  snippets/  │
       │                                     │             │
       └─────────────────────────────────────│ Aprendizado │
                       reutiliza             │   da IA     │
                                             └─────────────┘
```

**Fluxo:**
1. IA precisa implementar algo (ex: seletor de data)
2. IA busca em `snippets/` por labels relevantes
3. Se encontrar → reutiliza (consistência garantida)
4. Se não encontrar → pesquisa em `refs/`, implementa, documenta em `snippets/`

---

## refs/ - Referências de Pesquisa

### Propósito

Centralizar fontes de pesquisa para evitar:
- Fontes dispersas e não verificadas
- Versões misturadas de APIs
- Documentação desatualizada
- Decisões inconsistentes

### Estrutura

```
refs/
├── ux/                      # Referências de UX/UI
│   ├── date-picker.md       # Padrões de seletor de data
│   ├── mobile-nav.md        # Navegação mobile
│   └── forms.md             # Padrões de formulário
├── api/                     # Documentação de APIs
│   ├── whatsapp.md          # Evolution API
│   └── calendar.md          # Google Calendar
├── architecture/            # Padrões arquiteturais
│   └── offline-first.md     # PWA offline
└── libs/                    # Bibliotecas específicas
    ├── shadcn.md            # Componentes shadcn/ui
    └── date-fns.md          # Manipulação de datas
```

### Formato

```markdown
# [Nome da Referência]

**Fonte**: [URL ou origem]
**Versão**: [versão da API/lib se aplicável]
**Atualizado**: [data]

## Resumo

[Descrição breve do que esta referência cobre]

## Conteúdo

[Documentação, exemplos, padrões relevantes]

## Notas

[Observações importantes, limitações, gotchas]
```

### Quando Usar

A IA deve consultar `refs/` quando:
- Implementar integração com API externa
- Escolher biblioteca ou padrão
- Precisar de documentação específica de versão
- Planejar arquitetura de um módulo

---

## snippets/ - Aprendizado da IA

### Propósito

Documentar decisões de design para:
- Reutilização em implementações futuras
- Manter consistência visual/funcional
- Evitar pesquisa redundante
- Preservar contexto de decisões

### Estrutura

```
snippets/
├── README.md                # Índice e instruções
├── ux/                      # Padrões de interface
│   ├── date-picker.md
│   ├── password-input.md
│   └── segmented-control.md
├── patterns/                # Padrões de código
│   ├── api-route.md
│   └── form-validation.md
└── integrations/            # Integrações específicas
    └── whatsapp-send.md
```

### Formato

```markdown
# [Nome do Snippet]

**Name**: identificador-unico
**Tags**: tag1, tag2, tag3, tag4
**Created**: [data]
**Updated**: [data]

## Contexto

[Por que este padrão foi criado, qual problema resolve]

## Quando Usar

[Situações em que este snippet se aplica]

## Quando NÃO Usar

[Situações em que este snippet não é adequado]

## Implementação

[Código, componentes, configurações]

## Variações

[Alternativas ou adaptações comuns]

## Arquivos Relacionados

[Caminhos para implementações no projeto]
```

### Tags (Labels)

Tags são cruciais para a IA encontrar snippets relevantes.

**Formato de tags:**
- Substantivos no singular: `button`, `form`, `date`
- Verbos no infinitivo: `select`, `filter`, `navigate`
- Contextos: `mobile`, `desktop`, `offline`
- Componentes: `input`, `modal`, `card`

**Exemplo de tags eficazes:**
```markdown
**Tags**: date, picker, calendar, select, input, form, mobile, responsive
```

A IA busca por qualquer combinação dessas tags.

---

## Fluxo de Trabalho

### 1. Antes de Implementar

```
IA recebe tarefa: "Criar seletor de data para agendamento"
     │
     ▼
Buscar em snippets/ por tags: date, picker, calendar, select
     │
     ├── Encontrou? → Ler snippet, reutilizar padrão
     │
     └── Não encontrou? → Continuar para refs/
```

### 2. Pesquisar se Necessário

```
Buscar em refs/ por: date picker, calendar UI
     │
     ▼
Encontrou referência relevante? → Usar como base
     │
     └── Não encontrou? → Pesquisa externa (web)
```

### 3. Implementar

```
Implementar solução baseada em:
  - Snippet existente (prioridade 1)
  - Referência em refs/ (prioridade 2)
  - Pesquisa externa (último recurso)
```

### 4. Documentar

```
Após implementação bem-sucedida:
     │
     ├── Padrão novo? → Criar snippet com tags
     │
     ├── Padrão modificado? → Atualizar snippet existente
     │
     └── Referência externa usada? → Adicionar a refs/
```

---

## Exemplo Completo

### Situação

IA precisa criar um campo de senha com botão de revelar.

### 1. Busca em snippets/

```bash
# IA busca por tags: password, input, reveal, security, form
```

Encontra: `snippets/ux/password-input.md`

### 2. Conteúdo do Snippet

```markdown
# Password Input com Reveal

**Name**: password-input
**Tags**: password, input, reveal, security, form, authentication, login
**Created**: 2025-01-03

## Contexto

Campos de senha precisam de botão para revelar conteúdo.
Usuários frequentemente erram senhas longas sem feedback visual.

## Quando Usar

- Formulários de login
- Formulários de cadastro
- Alteração de senha
- Qualquer input type="password"

## Quando NÃO Usar

- Campos que não são senha
- Situações onde revelar compromete segurança (ex: tela compartilhada)

## Implementação

\`\`\`tsx
// Usar componente PasswordInput de @/components/ui/password-input
import { PasswordInput } from "@/components/ui/password-input"

<PasswordInput
  placeholder="Digite sua senha"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
\`\`\`

## Comportamento

- Botão de olho no canto direito
- Revelar enquanto pressiona (não toggle)
- Ícone muda de EyeOff para Eye durante reveal

## Arquivos Relacionados

- portal/src/components/ui/password-input.tsx
```

### 3. IA Reutiliza

A IA usa o componente documentado, garantindo:
- Consistência visual com outros campos de senha no app
- Mesmo comportamento (pressionar para revelar)
- Sem necessidade de pesquisar novamente

---

## Manutenção

### Quando Criar Novo Snippet

- Implementou padrão que será reutilizado
- Tomou decisão de design não óbvia
- Criou componente reutilizável
- Resolveu problema de forma específica

### Quando Atualizar Snippet

- Melhorou implementação existente
- Encontrou edge case não documentado
- API ou biblioteca mudou
- Feedback de uso revelou problema

### Quando Criar Nova Ref

- Usou documentação externa específica
- Integrou com API nova
- Adotou biblioteca não documentada
- Encontrou fonte autoritativa útil

---

## Anti-patterns

**NÃO faça:**

```markdown
❌ Snippet sem tags
# Date Picker
[implementação sem tags para busca]

❌ Snippet muito genérico
**Tags**: ui, component
[tags não ajudam a encontrar]

❌ Ref desatualizada
**Versão**: 1.0 (de 2022)
[versão antiga pode ter breaking changes]
```

**FAÇA:**

```markdown
✅ Snippet com tags específicas
**Tags**: date, picker, calendar, select, input, form, mobile, responsive, shadcn

✅ Ref com versão e data
**Fonte**: https://ui.shadcn.com/docs/components/calendar
**Versão**: shadcn/ui 0.8.0
**Atualizado**: 2025-01-06
```

---

## Checklist

### Novo Snippet
- [ ] Name único e descritivo?
- [ ] Tags suficientes para busca (5-10)?
- [ ] Contexto explica o "porquê"?
- [ ] Quando usar / não usar definidos?
- [ ] Código de implementação incluído?
- [ ] Arquivos relacionados listados?

### Nova Ref
- [ ] Fonte verificada e confiável?
- [ ] Versão especificada?
- [ ] Data de atualização?
- [ ] Conteúdo relevante extraído?
