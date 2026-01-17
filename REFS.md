# Refs - Sistema de Referências

Biblioteca de referências que a IA deve consultar **ANTES** de implementar.

---

## Conceito

**Refs** são padrões externos que guiam a IA. Em vez de "vibrar" e criar do zero, a IA deve:

1. Verificar se existe referência relevante em `specs/refs/`
2. Estudar as referências encontradas
3. Planejar a implementação baseada nelas
4. Implementar seguindo o padrão

```
Pedido: "Cria uma dashboard"
         │
         ▼
┌─────────────────────────────────┐
│  IA verifica specs/refs/ux/*   │
│  Encontra: dashboard-layout.md  │
│  Estuda o padrão               │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Implementa seguindo o padrão   │
│  (não inventa do zero)          │
└─────────────────────────────────┘
```

---

## Estrutura

```
specs/
└── refs/
    ├── ux/                    # Padrões de interface
    │   ├── dashboard.md       # Como fazer dashboards
    │   ├── forms.md           # Como fazer formulários
    │   ├── tables.md          # Como fazer tabelas
    │   └── navigation.md      # Como fazer navegação
    │
    ├── patterns/              # Padrões de código
    │   ├── api-calls.md       # Como chamar APIs
    │   ├── error-handling.md  # Como tratar erros
    │   └── validation.md      # Como validar dados
    │
    ├── stack/                 # Referências de tecnologia
    │   ├── shadcn.md          # Catálogo shadcn/ui
    │   ├── framer-motion.md   # Padrões de animação
    │   └── react-query.md     # Padrões de data fetching
    │
    └── {domain}/              # Referências específicas do domínio
        └── ...
```

---

## Quando a IA deve consultar refs

| Situação | Refs a consultar |
|----------|------------------|
| Criar tela/página | `refs/ux/*` |
| Criar formulário | `refs/ux/forms.md` |
| Criar tabela/lista | `refs/ux/tables.md` |
| Integrar API | `refs/patterns/api-calls.md` |
| Usar componente novo | `refs/stack/{lib}.md` |
| Implementar feature do domínio | `refs/{domain}/*` |

---

## Formato de uma Ref

```markdown
# {Nome do Padrão}

{Descrição breve do que é e quando usar}

---

## Quando usar

- Situação 1
- Situação 2

## Quando NÃO usar

- Situação 1
- Situação 2

---

## Estrutura

{Descrição da estrutura/layout/organização}

---

## Exemplo

{Exemplo visual ou código demonstrando o padrão}

---

## Variações

{Variações do padrão para diferentes contextos}

---

## Checklist

- [ ] Item 1 que deve ser seguido
- [ ] Item 2 que deve ser seguido
```

---

## Exemplo: refs/ux/dashboard.md

```markdown
# Dashboard Layout

Padrão de layout para dashboards e telas de overview.

---

## Quando usar

- Tela inicial após login
- Visão geral de métricas
- Resumo de atividades

## Quando NÃO usar

- Páginas de detalhe
- Formulários
- Listagens simples

---

## Estrutura

```
┌─────────────────────────────────────────────┐
│  Header: Título + Período + Ações           │
├─────────────────────────────────────────────┤
│  KPIs: 3-4 cards de métricas principais     │
├──────────────────────┬──────────────────────┤
│  Gráfico principal   │  Lista/Atividades    │
│  (70% largura)       │  (30% largura)       │
├──────────────────────┴──────────────────────┤
│  Tabela de dados recentes (opcional)        │
└─────────────────────────────────────────────┘
```

---

## KPI Cards

- Máximo 4 cards na linha
- Cada card: valor + label + variação (opcional)
- Cores: usar accent para destaque positivo

---

## Checklist

- [ ] Header com título descritivo
- [ ] Seletor de período (7d, 30d, 90d)
- [ ] KPIs acima do fold
- [ ] Gráfico com legenda clara
- [ ] Responsivo: stack vertical em mobile
```

---

## Fluxo de Trabalho

### 1. Antes de Implementar

```
IA recebe: "Cria página de relatórios"
    │
    ▼
Verifica: specs/refs/ux/
    │
    ├── Encontra: dashboard.md, tables.md
    │
    ▼
Estuda os padrões
    │
    ▼
Planeja: "Vou usar layout de dashboard com tabela de dados"
```

### 2. Durante Implementação

```
Segue estrutura definida em refs
    │
    ▼
Usa componentes conforme refs/stack/
    │
    ▼
Aplica padrões de refs/patterns/
```

### 3. Após Implementar

Se tomou decisão nova não coberta por refs:
→ Gerar snippet (ver SNIPPETS.md)

---

## Origem das Refs

Refs podem vir de várias fontes:

| Fonte | Exemplo |
|-------|---------|
| Documentação oficial | shadcn/ui docs |
| Design system | Padrões do Figma |
| Projeto de referência | Código de projeto similar |
| Decisão do time | "Sempre usar X para Y" |
| Pesquisa técnica | Artigos, tutoriais |

### Adicionando uma Ref

1. Identificar padrão que deve ser seguido
2. Criar arquivo em `specs/refs/{categoria}/`
3. Documentar no formato padrão
4. IA passa a consultar automaticamente

---

## Refs vs Snippets

| Aspecto | Refs | Snippets |
|---------|------|----------|
| **Quando** | ANTES de implementar | DEPOIS de implementar |
| **Origem** | Externa (docs, designs) | Interna (decisões do projeto) |
| **Propósito** | Guiar implementação | Manter consistência |
| **Quem cria** | Humano (curadoria) | IA (aprendizado) |
| **Conteúdo** | Padrões, estruturas | Código específico |

```
refs/ux/forms.md          →  "Como fazer formulários"
snippets/date-picker.md   →  "Como FIZEMOS o date-picker aqui"
```

---

## Instrução para IA

Quando receber uma tarefa de implementação:

1. **Identifique o tipo**: UI? API? Lógica?
2. **Consulte refs relevantes**: `specs/refs/{tipo}/*`
3. **Consulte snippets existentes**: `specs/snippets/*`
4. **Planeje baseado nas referências**
5. **Implemente seguindo os padrões**
6. **Gere snippet se decisão nova**

**NUNCA** implemente UI/componentes sem antes verificar:
- `specs/refs/ux/*`
- `specs/refs/stack/*`
- `specs/snippets/*`
