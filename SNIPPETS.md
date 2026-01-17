# Snippets - Memória do Projeto

Decisões de implementação que a IA registra **DEPOIS** de implementar para manter consistência.

---

## Conceito

**Snippets** são a memória do projeto. Quando a IA toma uma decisão de implementação pela primeira vez, ela deve:

1. Implementar a solução
2. Criar um snippet documentando a decisão
3. Nas próximas vezes, consultar o snippet e fazer igual

```
Primeira vez: "Preciso de um date-picker"
         │
         ▼
┌─────────────────────────────────┐
│  IA implementa date-picker      │
│  Escolhe estilo, comportamento  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  IA cria snippet:               │
│  specs/snippets/date-picker.md  │
│  (documenta como fez)           │
└─────────────────────────────────┘

Segunda vez: "Preciso de um date-picker"
         │
         ▼
┌─────────────────────────────────┐
│  IA consulta snippet existente  │
│  Implementa IGUAL               │
│  (consistência garantida)       │
└─────────────────────────────────┘
```

---

## Estrutura

```
specs/
└── snippets/
    ├── ui/                    # Componentes de interface
    │   ├── date-picker.md     # Como usamos date-picker
    │   ├── data-table.md      # Como usamos tabelas
    │   ├── form-field.md      # Como usamos campos de form
    │   └── modal.md           # Como usamos modais
    │
    ├── patterns/              # Padrões de código
    │   ├── api-mutation.md    # Como fazemos mutations
    │   ├── form-validation.md # Como validamos forms
    │   └── error-toast.md     # Como exibimos erros
    │
    └── {domain}/              # Padrões específicos do domínio
        └── ...
```

---

## Quando gerar Snippet

| Situação | Gerar snippet? |
|----------|----------------|
| Usou componente pela primeira vez | **SIM** |
| Criou padrão de código reutilizável | **SIM** |
| Tomou decisão de estilo/comportamento | **SIM** |
| Código específico de uma tela | NÃO |
| Lógica de negócio única | NÃO |

### Regra de ouro

> Se vai usar de novo, crie snippet.
> Se é único, não precisa.

---

## Formato de um Snippet

```markdown
# {Nome do Componente/Padrão}

{O que é e quando usar - 1 linha}

---

## Aparência

{Descrição visual ou screenshot}

---

## Uso

```tsx
// Código de exemplo mostrando como usar
```

---

## Props/Variações

| Prop | Tipo | Descrição |
|------|------|-----------|
| ... | ... | ... |

---

## Decisões

- Por que escolhemos X em vez de Y
- Comportamentos específicos definidos
```

---

## Exemplo: snippets/ui/date-picker.md

```markdown
# Date Picker

Seletor de data usando shadcn/ui Calendar com Popover.

---

## Aparência

- Botão com ícone de calendário + data formatada
- Popover abre calendário abaixo
- Data formato: "dd/MM/yyyy"

---

## Uso

```tsx
import { DatePicker } from "@/components/ui/date-picker"

<DatePicker
  value={date}
  onChange={setDate}
  placeholder="Selecione uma data"
/>
```

---

## Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| value | Date | - | Data selecionada |
| onChange | (date: Date) => void | - | Callback de mudança |
| placeholder | string | "Selecione..." | Texto quando vazio |
| disabled | boolean | false | Desabilita seleção |
| minDate | Date | - | Data mínima permitida |
| maxDate | Date | - | Data máxima permitida |

---

## Decisões

- Formato brasileiro (dd/MM/yyyy) usando date-fns
- Semana começa no domingo
- Popover alinha à esquerda do botão
- Botão usa variant="outline"
```

---

## Exemplo: snippets/patterns/error-toast.md

```markdown
# Error Toast

Padrão de exibição de erros via toast notification.

---

## Uso

```tsx
import { toast } from "sonner"

// Erro genérico
toast.error("Não foi possível salvar")

// Erro com detalhes
toast.error("Erro ao salvar", {
  description: error.message,
})

// Erro com ação
toast.error("Sessão expirada", {
  action: {
    label: "Fazer login",
    onClick: () => router.push("/login"),
  },
})
```

---

## Decisões

- Usar `sonner` para toasts (não o toast do shadcn)
- Posição: bottom-right
- Duração: 5 segundos para erros
- Sempre incluir mensagem amigável (não mostrar erro técnico direto)
```

---

## Fluxo de Trabalho

### 1. Antes de Implementar

```
IA recebe: "Adiciona campo de data no form"
    │
    ▼
Verifica: specs/snippets/ui/
    │
    ├── Encontra: date-picker.md
    │       │
    │       ▼
    │   Usa o padrão existente
    │
    └── NÃO encontra
            │
            ▼
        Implementa nova solução
            │
            ▼
        Cria snippet
```

### 2. Criando Snippet

Após implementar algo novo:

```
IA implementou: Modal de confirmação
    │
    ▼
Pergunta: "Vou usar isso de novo?"
    │
    ├── SIM → Criar specs/snippets/ui/confirm-modal.md
    │
    └── NÃO → Não criar snippet
```

---

## Snippets vs Refs

| Aspecto | Snippets | Refs |
|---------|----------|------|
| **Quando** | DEPOIS de implementar | ANTES de implementar |
| **Origem** | Interna (decisões do projeto) | Externa (docs, designs) |
| **Propósito** | Manter consistência | Guiar implementação |
| **Quem cria** | IA (aprendizado) | Humano (curadoria) |
| **Conteúdo** | Código específico | Padrões, estruturas |

### Exemplo da relação

```
refs/ux/forms.md
    │
    │  "Formulários devem usar layout X,
    │   validação inline, botões à direita"
    │
    ▼
IA implementa form seguindo ref
    │
    ▼
snippets/ui/form-field.md
    │
    │  "Usamos FormField do react-hook-form
    │   com esse wrapper específico..."
    │
    ▼
Próximo form: consulta snippet, faz igual
```

---

## Instrução para IA

### Ao implementar algo novo:

1. **Consulte snippets existentes**: `specs/snippets/*`
2. **Se existe**: Use o padrão documentado
3. **Se não existe**:
   - Consulte refs relevantes
   - Implemente a solução
   - Avalie: "Vou usar de novo?"
   - Se sim: Crie snippet

### Ao criar snippet:

1. Criar arquivo em `specs/snippets/{categoria}/`
2. Documentar no formato padrão
3. Incluir código de exemplo funcional
4. Documentar decisões tomadas

### Manutenção:

- Se padrão mudar: Atualizar snippet
- Se snippet ficar obsoleto: Remover ou marcar deprecated
- Snippets devem refletir estado atual do código
