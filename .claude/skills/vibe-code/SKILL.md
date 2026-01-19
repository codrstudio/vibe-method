---
name: vibe-code
description: Gerar codigo seguindo Vibe Method. Usar ao escrever, editar ou criar codigo fonte, componentes, funcoes, APIs, workflows ou qualquer implementacao.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Vibe Code - Geracao de Codigo

Antes de escrever qualquer codigo, voce DEVE internalizar a filosofia do Vibe Method.

## Leitura Obrigatoria

Consulte estes arquivos antes de implementar:

1. `methodology/README.md` - Visao geral do metodo
2. `methodology/01-filosofia/PRINCIPIOS.md` - 10 principios fundamentais
3. `methodology/01-filosofia/WORKFLOWS.md` - Estrutura de nodos e contratos

---

## Principios Core (Resumo)

### 1. Codigo e Motor, Nao Produto

```
SISTEMA <-> motor <-> ARTEFATO <-> ferramenta <-> NEGOCIO
```

- **Motor**: Codigo que le, valida, executa (estavel)
- **Artefato**: Definicao declarativa de comportamento (muda frequentemente)
- Codigo NAO carrega regras de negocio

### 2. Artefato e Fonte de Verdade

- Quer entender o sistema? Leia os artefatos
- Quer mudar o sistema? Mude os artefatos
- Se uma decisao exige codigo para ser alterada, esta no lugar errado

### 3. Workflow > Algoritmo

| Algoritmo | Workflow |
|-----------|----------|
| Logica escondida | Estrutura visivel |
| Funcoes aninhadas | Nodos nomeados |
| Stack traces | Erros localizaveis |
| Refatorar codigo | Editar artefato |

### 4. Nodo = Unidade Atomica

- **Nomeado**: Tem identidade semantica
- **Propositado**: Uma responsabilidade
- **Contratado**: Entrada e saida definidas
- **Resultante**: Sempre produz saida (sucesso ou erro)

### 5. Resultado e Saida, Nao Excecao

```typescript
// PADRAO CORRETO
type Result<T, E> =
  | { ok: true; valor: T }
  | { ok: false; erro: E };

// Erro e saida estruturada, nao throw
return { ok: false, erro: { tipo: 'SEM_ESTOQUE', item: 'ABC' } };
```

---

## Perguntas Antes de Implementar

1. **Isso e regra de negocio?** → Se sim, deve ser artefato
2. **Isso muda com frequencia?** → Se sim, deve ser artefato
3. **Quem precisa mudar isso?** → Se nao-programador, deve ser artefato
4. **O motor ja existe?** → Se sim, use-o. Se nao, crie motor generico
5. **Estou aumentando ou reduzindo complexidade?**

---

## Anti-Padroes a Evitar

### Regra Disfarada de Codigo

```typescript
// ERRADO
const discount = isFirstPurchase ? 0.1 : isPremium ? 0.05 : 0;

// CERTO
const discount = pricingRules.getDiscount(customer);
// pricing-rules.yaml define os valores
```

### Motor que Conhece o Negocio

```typescript
// ERRADO
if (workflow.type === 'onboarding') {
  // logica especifica
}

// CERTO
for (const step of workflow.steps) {
  await this.executeStep(step); // generico
}
```

### Nodo que Faz Duas Coisas

```
// ERRADO
validar-e-salvar-dados

// CERTO
validar-dados → salvar-dados
```

### Hardcoded Permissions

```typescript
// ERRADO
if (user.role === 'admin' || user.role === 'manager') { ... }

// CERTO
const allowedRoles = config.permissions[action].roles;
if (allowedRoles.includes(user.role)) { ... }
```

---

## Checklist de Implementacao

Antes de finalizar codigo:

- [ ] Regras de negocio estao em artefatos, nao em codigo
- [ ] Cada funcao/nodo tem uma responsabilidade
- [ ] Contratos de entrada/saida estao tipados
- [ ] Erros sao saidas estruturadas (Result pattern)
- [ ] Nomes sao semanticos (descrevem o que faz)
- [ ] Motor e generico, nao conhece casos especificos
- [ ] Codigo pode ser testado isoladamente

---

## Estrutura de Codigo Esperada

### Funcao/Nodo Bem Estruturado

```typescript
interface ProcessarPedidoInput {
  cliente_id: string;
  itens: Item[];
}

interface ProcessarPedidoOutput {
  pedido_id: string;
  status: 'confirmado' | 'pendente';
}

interface ProcessarPedidoErro {
  tipo: 'CLIENTE_NAO_ENCONTRADO' | 'SEM_ESTOQUE' | 'ERRO_SISTEMA';
  detalhes: Record<string, unknown>;
}

async function processarPedido(
  input: ProcessarPedidoInput
): Promise<Result<ProcessarPedidoOutput, ProcessarPedidoErro>> {
  // Implementacao...
}
```

### Workflow Declarativo

```yaml
# workflow.yaml (artefato)
name: processar-pedido
steps:
  - validar-cliente
  - verificar-estoque
  - reservar-estoque
  - gerar-nf:
      modelo: nf-padrao
  - notificar:
      canal: email
      template: confirmacao-pedido
```

---

## Lembre-se

> "Voce esta aumentando complexidade ou reduzindo?"
>
> - Se esta codificando regra de negocio → esta no lugar errado
> - Se esta entregando motor e ferramenta → esta pensando como ferramenteiro
