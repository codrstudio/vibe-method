# Workflows

Estrutura visivel de processamento com nodos, contratos e observabilidade.

---

## Indice

1. [Algoritmo vs Workflow](#algoritmo-vs-workflow) - A diferenca fundamental
2. [Propriedades do Workflow](#propriedades-do-workflow) - Caracteristicas
3. [Nodo](#nodo) - Unidade de processamento
4. [Contrato](#contrato) - Entrada e saida definidas
5. [Observabilidade](#observabilidade) - Rastreamento de execucao
6. [Progressao](#progressao) - Evolucao do pensamento

---

## Algoritmo vs Workflow

### Algoritmo Tradicional

Funcoes chamam funcoes. Condicionais aninhados. Logica entrelacada e invisivel.

```
funcao A
  |-- chama B
  |     |-- chama C
  |     |-- if/else
  |-- chama D
        |-- try/catch
```

**Problemas:**

- Logica escondida no codigo
- Difícil de visualizar fluxo
- Nao tem identidade
- Erros se perdem em stack traces
- Impossivel acompanhar execucao em tempo real

### Workflow

Estrutura visivel com partes nomeadas.

```
┌─────────────────────────────────────────────────────┐
│                    WORKFLOW                          │
│   ┌────────┐    ┌────────┐    ┌────────┐           │
│   │ Nodo A │ -> │ Nodo B │ -> │ Nodo C │           │
│   └────────┘    └────────┘    └────────┘           │
└─────────────────────────────────────────────────────┘
```

**Vantagens:**

- Estrutura visivel
- Cada parte tem nome
- Fluxo claro
- Erros localizaveis
- Execucao rastreavel

---

## Propriedades do Workflow

| Propriedade | Descricao |
|-------------|-----------|
| **Estruturado** | Tem forma, e visualizavel |
| **Nomeado** | Tem identidade, e referenciavel |
| **Direcionado** | Tem fluxo, ordem |
| **Delimitado** | Tem inicio e fim |
| **Composto** | Feito de partes (nodos ou sub-workflows) |
| **Observavel** | Pode-se acompanhar a execucao |

### Estruturado

Um workflow tem forma. Pode ser desenhado, diagramado, visualizado. A estrutura e explicita, nao deduzida do codigo.

```yaml
# workflow.yaml - estrutura explicita
name: processar-pedido
steps:
  - validar-dados
  - reservar-estoque
  - gerar-nf
  - notificar-cliente
```

### Nomeado

Tem identidade. Pode ser referenciado em logs, metricas, alertas.

```
workflow: processar-pedido
execucao: exec_abc123
```

### Direcionado

Tem fluxo. Sabe-se a ordem das operacoes.

```
validar → reservar → gerar-nf → notificar
```

### Delimitado

Tem inicio e fim. Sabe-se quando comecou, quando terminou.

```
inicio: 2024-01-15T10:30:00
fim: 2024-01-15T10:30:45
duracao: 45s
```

### Composto

Feito de partes menores. Nodos ou sub-workflows.

```
workflow: onboarding
  └── sub-workflow: validar-documentos
        └── nodo: validar-cpf
        └── nodo: validar-endereco
  └── sub-workflow: criar-conta
```

### Observavel

Pode-se acompanhar a execucao. Logs estruturados, metricas, dashboards.

---

## Nodo

### Definicao

Nodo e a menor unidade de um workflow. Tem:

- **Nome** - identificavel, referenciavel
- **Proposito** - por que existe, o que faz
- **Contrato** - o que recebe, o que devolve

### Propriedades do Nodo

| Propriedade | Descricao |
|-------------|-----------|
| **Nomeado** | Tem identidade |
| **Propositado** | Tem razao de existir |
| **Contratado** | Entrada e saida definidas |
| **Atomico** | Uma responsabilidade |
| **Resultante** | Sempre produz saida (sucesso ou erro) |
| **Rastreavel** | Sabe-se o que entrou e saiu |

### Atomicidade

Um nodo faz uma coisa. Se faz duas, sao dois nodos.

```
# ERRADO: nodo faz duas coisas
validar-e-salvar-dados

# CERTO: dois nodos
validar-dados → salvar-dados
```

### Identificabilidade

Todo nodo tem nome. Nomes sao semanticos, descrevem o que o nodo faz.

```
# BOM
validar-cpf
reservar-estoque
enviar-email-confirmacao

# RUIM
step1
processamento
handler
```

---

## Contrato

### Entrada e Saida

Todo nodo tem contrato explicito. O que recebe, o que devolve.

```
entrada -> [nodo] -> saida | erro
```

### Resultado como Saida

**Resultado e sempre saida.** Erro nao e excecao que some. E saida estruturada.

```typescript
// Sucesso
{ ok: true, valor: { pedido_id: "123", status: "confirmado" } }

// Falha
{ ok: false, erro: { tipo: "SEM_ESTOQUE", item: "ABC", disponivel: 0 } }
```

### Padroes de Resultado

```typescript
// Padrao Result
type Result<T, E> =
  | { ok: true; valor: T }
  | { ok: false; erro: E };

// Exemplo de uso
async function reservarEstoque(input: ReservaInput): Promise<Result<Reserva, ReservaErro>> {
  const disponivel = await verificarDisponibilidade(input.item);

  if (disponivel < input.quantidade) {
    return {
      ok: false,
      erro: {
        tipo: 'SEM_ESTOQUE',
        item: input.item,
        solicitado: input.quantidade,
        disponivel,
      }
    };
  }

  const reserva = await criarReserva(input);
  return { ok: true, valor: reserva };
}
```

### Tipagem de Contrato

```typescript
// Tipos explicitos
interface ReservarEstoqueInput {
  item_id: string;
  quantidade: number;
}

interface ReservarEstoqueOutput {
  reserva_id: string;
  valido_ate: string;
}

interface ReservarEstoqueErro {
  tipo: 'SEM_ESTOQUE' | 'ITEM_NAO_EXISTE' | 'ERRO_SISTEMA';
  detalhes: Record<string, unknown>;
}

// Nodo com contrato tipado
const reservarEstoque: Nodo<
  ReservarEstoqueInput,
  ReservarEstoqueOutput,
  ReservarEstoqueErro
> = {
  nome: 'reservar-estoque',
  proposito: 'Reserva quantidade de item no estoque',
  executar: async (input) => { /* ... */ }
};
```

---

## Observabilidade

### Registro de Execucao

Cada execucao de workflow pode ser registrada com detalhes.

```
workflow: processar-pedido
execucao: exec_abc123
inicio: 2024-01-15T10:30:00Z

┌─────────────────────────────────────────────────────┐
│ nodo: validar-dados                                  │
│ entrada: { cliente: "123", itens: [...] }           │
│ saida: { ok: true, valor: { validado: true } }      │
│ duracao: 12ms                                        │
└─────────────────────────────────────────────────────┘
                         |
                         v
┌─────────────────────────────────────────────────────┐
│ nodo: reservar-estoque                               │
│ entrada: { itens: [...] }                            │
│ saida: { ok: false, erro: { tipo: "SEM_ESTOQUE" } } │
│ duracao: 45ms                                        │
└─────────────────────────────────────────────────────┘

fim: 2024-01-15T10:30:00.057Z
duracao_total: 57ms
status: FALHA (reservar-estoque)
```

### Beneficios

Quando falha, voce sabe:

- **Onde** - qual nodo falhou
- **O que entrou** - dados de entrada
- **O que saiu** - erro estruturado
- **Quanto demorou** - duracao do nodo

### Niveis de Observabilidade

```typescript
type LogLevel = 'off' | 'errors' | 'results' | 'full';

interface WorkflowConfig {
  nome: string;
  observabilidade: LogLevel;
}
```

| Nivel | O que registra |
|-------|----------------|
| `off` | Nada |
| `errors` | Apenas falhas |
| `results` | Resultados (ok/erro) |
| `full` | Entrada, saida, duracao, tudo |

**Regra:** Observabilidade e configuravel. Sistema robusto → reduz registro. Investigando → liga de volta.

### Implementacao

```typescript
// lib/execution.ts

interface ExecutionStep {
  nodo: string;
  status: 'success' | 'failed';
  entrada: unknown;
  saida: unknown;
  duracao_ms: number;
  timestamp: string;
}

interface WorkflowExecution {
  id: string;
  workflow: string;
  steps: ExecutionStep[];
  inicio: string;
  fim: string;
  duracao_total_ms: number;
  status: 'success' | 'failed';
  erro_em?: string;
}

async function executarWorkflow(workflow: Workflow, input: unknown): Promise<WorkflowExecution> {
  const execucao: WorkflowExecution = {
    id: gerarId(),
    workflow: workflow.nome,
    steps: [],
    inicio: new Date().toISOString(),
    fim: '',
    duracao_total_ms: 0,
    status: 'success',
  };

  let estado = input;

  for (const nodo of workflow.nodos) {
    const inicio = Date.now();

    try {
      const resultado = await nodo.executar(estado);
      const duracao = Date.now() - inicio;

      execucao.steps.push({
        nodo: nodo.nome,
        status: resultado.ok ? 'success' : 'failed',
        entrada: estado,
        saida: resultado,
        duracao_ms: duracao,
        timestamp: new Date().toISOString(),
      });

      if (!resultado.ok) {
        execucao.status = 'failed';
        execucao.erro_em = nodo.nome;
        break;
      }

      estado = resultado.valor;
    } catch (error) {
      execucao.steps.push({
        nodo: nodo.nome,
        status: 'failed',
        entrada: estado,
        saida: { erro: error.message },
        duracao_ms: Date.now() - inicio,
        timestamp: new Date().toISOString(),
      });
      execucao.status = 'failed';
      execucao.erro_em = nodo.nome;
      break;
    }
  }

  execucao.fim = new Date().toISOString();
  execucao.duracao_total_ms = execucao.steps.reduce((acc, s) => acc + s.duracao_ms, 0);

  await salvarExecucao(execucao);
  return execucao;
}
```

---

## Progressao

### Evolucao do Pensamento

```
algoritmo tradicional -> workflow -> workflow + ferramentaria
     (escondido)         (visivel)      (governavel)
```

| Nivel | Caracteristica |
|-------|----------------|
| **Algoritmo** | Logica escondida no codigo |
| **Workflow** | Logica visivel e estruturada |
| **Workflow + Ferramentaria** | Logica governavel pelo negocio |

### Nivel 1: Algoritmo

```typescript
// Logica escondida
async function processarPedido(pedido) {
  const cliente = await buscarCliente(pedido.cliente_id);
  if (!cliente) throw new Error('Cliente nao encontrado');

  for (const item of pedido.itens) {
    const estoque = await verificarEstoque(item.id);
    if (estoque < item.qtd) throw new Error('Sem estoque');
    await reservar(item.id, item.qtd);
  }

  const nf = await gerarNF(pedido, cliente);
  await enviarEmail(cliente.email, nf);

  return { sucesso: true };
}
```

### Nivel 2: Workflow

```typescript
// Logica visivel
const processarPedidoWorkflow = criarWorkflow({
  nome: 'processar-pedido',
  nodos: [
    buscarClienteNodo,
    verificarEstoqueNodo,
    reservarEstoqueNodo,
    gerarNFNodo,
    notificarClienteNodo,
  ],
});
```

### Nivel 3: Workflow + Ferramentaria

```yaml
# Logica governavel (artefato)
nome: processar-pedido
passos:
  - buscar-cliente
  - verificar-estoque
  - reservar-estoque
  - gerar-nf:
      modelo: nf-padrao
  - notificar:
      canal: email
      template: confirmacao-pedido
```

O negocio pode mudar o modelo de NF ou o template de email sem programador.

---

## Comparacao Final

| Aspecto | Algoritmo | Workflow |
|---------|-----------|----------|
| Estrutura | Escondida | Visivel |
| Identidade | Nenhuma | Nomeado |
| Erro | Stack trace | Nodo especifico |
| Rastreamento | Logs dispersos | Execucao unificada |
| Mudanca | Refatorar codigo | Editar artefato |
| Teste | Unitario | Estrutural |

---

## Checklist

Ao projetar workflow:

- [ ] Cada nodo tem nome semantico
- [ ] Cada nodo tem uma responsabilidade
- [ ] Contratos de entrada/saida estao definidos
- [ ] Erros sao saidas estruturadas, nao excecoes
- [ ] Observabilidade esta configurada
- [ ] Workflow pode ser visualizado
- [ ] Execucoes sao rastreaveis
