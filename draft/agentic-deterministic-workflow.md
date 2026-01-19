# Agentic Deterministic Workflow

> Draft de conceito - Workflow como artefato para construção e governança de agentes

---

## Conceito Central

**Deterministic Workflow** é um artefato declarativo que descreve o comportamento esperado de um sistema de agentes. Diferente de workflows programáticos (como N8n com nodos rígidos), este artefato funciona como **guardrails e conductors** - a IA mantém autonomia mas opera dentro de limites e direções definidos.

```
ESPECIFICAÇÃO  →  DETERMINISTIC WORKFLOW  →  AGENTES
   (o quê)            (como/limites)         (execução)
```

---

## Problema que Resolve

### Hoje

```
Spec → Agente (código)
       ↓
     Mudou spec?
       ↓
     Reescrever agente manualmente
```

### Com Deterministic Workflow

```
Spec → Deterministic Workflow (artefato) → Agente Builder (IA) → Agentes
                ↓                                                    ↓
         Mudou workflow?                                    Se policiam
                ↓                                           mutuamente
         IA refatora agentes automaticamente
```

---

## Arquitetura

### Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    ESPECIFICAÇÃO                        │
│           (User Stories, Requirements, Design)          │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│              DETERMINISTIC WORKFLOW                     │
│                    (Artefato)                           │
│                                                         │
│  • Guardrails: limites do que pode/não pode fazer       │
│  • Conductors: direção e sequência esperada             │
│  • Checkpoints: pontos de validação obrigatórios        │
│  • Handoffs: como agentes se comunicam                  │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   AGENT BUILDER                         │
│         (Claude Code, Codex, ou outra IA)               │
│                                                         │
│  Lê o artefato e:                                       │
│  • Cria agentes seguindo as regras                      │
│  • Refatora quando artefato muda                        │
│  • Injeta mecanismos de auto-policiamento               │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                ECOSSISTEMA DE AGENTES                   │
│                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│  │ Agent A │◄──►│ Agent B │◄──►│ Agent C │             │
│  └────┬────┘    └────┬────┘    └────┬────┘             │
│       │              │              │                   │
│       └──────────────┼──────────────┘                   │
│                      ▼                                  │
│              MUTUAL GOVERNANCE                          │
│        (agentes validam uns aos outros)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Estrutura do Artefato

### Exemplo: `workflows/order-processing.workflow.yaml`

```yaml
name: order-processing
version: 1.0.0
description: Processamento de pedidos do e-commerce

# Agentes envolvidos
agents:
  - id: validator
    role: Validar dados do pedido

  - id: inventory
    role: Verificar e reservar estoque

  - id: payment
    role: Processar pagamento

  - id: fulfillment
    role: Orquestrar entrega

# Guardrails - O que NÃO pode acontecer
guardrails:
  - never: Processar pagamento sem validação prévia
  - never: Reservar estoque sem pedido validado
  - never: Confirmar entrega sem pagamento aprovado
  - never: Expor dados sensíveis entre agentes
  - always: Logar todas as transições de estado
  - always: Timeout de 30s por operação

# Conductors - Sequência esperada (flexível, não rígida)
conductors:
  happy_path:
    - validator.validate_order
    - inventory.check_and_reserve
    - payment.process
    - fulfillment.dispatch

  on_error:
    inventory_fail:
      - notify_customer
      - suggest_alternatives
    payment_fail:
      - inventory.release_reservation
      - retry_with_different_method

# Checkpoints - Validações obrigatórias
checkpoints:
  - after: validator.validate_order
    assert: order.status == 'validated'

  - after: inventory.check_and_reserve
    assert: reservation.id exists

  - after: payment.process
    assert: transaction.status in ['approved', 'pending']

# Handoffs - Protocolo de comunicação
handoffs:
  validator_to_inventory:
    requires: [order_id, items, customer_id]

  inventory_to_payment:
    requires: [order_id, reservation_id, total_amount]

  payment_to_fulfillment:
    requires: [order_id, transaction_id, shipping_address]

# Governance - Auto-policiamento
governance:
  each_agent:
    - validate_input_schema
    - validate_output_schema
    - report_anomalies

  supervisor:
    agent: workflow_monitor
    checks:
      - checkpoint_compliance
      - guardrail_violations
      - timing_anomalies
```

---

## Fluxo de Uso

### 1. Especificar Workflow

```bash
# Humano ou IA cria/edita o artefato
vim workflows/order-processing.workflow.yaml
```

### 2. Agent Builder Gera Agentes

```bash
# IA (Claude Code, Codex) lê o artefato e gera código
vibe build-agents workflows/order-processing.workflow.yaml

# Saída:
# ✓ Generated: agents/validator/
# ✓ Generated: agents/inventory/
# ✓ Generated: agents/payment/
# ✓ Generated: agents/fulfillment/
# ✓ Generated: agents/workflow_monitor/
```

### 3. Mudança no Workflow

```bash
# Humano edita o workflow
# Adiciona novo guardrail: "never: processar pedidos acima de R$10k sem aprovação manual"

# IA detecta mudança e refatora
vibe sync-agents workflows/order-processing.workflow.yaml

# Saída:
# ✓ Detected change in guardrails
# ✓ Updated: agents/payment/ - added high_value_check
# ✓ Updated: agents/workflow_monitor/ - added high_value_alert
```

### 4. Execução com Governança

```bash
# Durante execução, agentes se policiam
[validator] ✓ Order validated: ORD-123
[inventory] ✓ Stock reserved: RES-456
[workflow_monitor] ⚠ Checkpoint passed: inventory complete
[payment] ✓ Payment processed: TXN-789
[workflow_monitor] ⚠ Checkpoint passed: payment complete
[fulfillment] ✓ Dispatch initiated: SHP-012
[workflow_monitor] ✓ Workflow completed successfully
```

---

## Diferencial: Guardrails vs Nodos

| Aspecto | N8n (Nodos) | Deterministic Workflow |
|---------|-------------|------------------------|
| Estrutura | Rígida, sequencial | Flexível, orientada a objetivos |
| IA | Executa passos | Decide como alcançar dentro dos limites |
| Mudança | Reconfigurar nodos | Editar artefato declarativo |
| Erro | Falha no nodo para tudo | Agente tenta alternativas dentro dos guardrails |
| Governança | Inexistente | Agentes se validam mutuamente |

---

## Benefícios

1. **Especificação vira código automaticamente** - Sem gap entre design e implementação
2. **Mudanças propagam** - Alterou o artefato, IA atualiza os agentes
3. **Governança distribuída** - Não depende de um orquestrador central frágil
4. **Autonomia com limites** - IA tem liberdade para decidir, mas dentro de boundaries claros
5. **Rastreabilidade** - Cada decisão do agente pode ser validada contra o workflow

---

## Próximos Passos

- [ ] Definir schema formal do artefato `.workflow.yaml`
- [ ] Criar Agent Builder que lê o artefato
- [ ] Implementar mecanismo de governance entre agentes
- [ ] Testar com workflow real (ex: onboarding de usuário)
- [ ] Documentar padrões de guardrails comuns

---

## Relação com Vibe Method

Este conceito é uma extensão natural do Vibe Method:

```
MANIFESTO: "Decisões de negócio não pertencem ao código"
           ↓
APLICAÇÃO: Workflow é artefato, não código de orquestração
           ↓
RESULTADO: Mudar comportamento = editar YAML, não refatorar código
```

O Deterministic Workflow é mais um tipo de artefato que o motor (agentes) consome.
