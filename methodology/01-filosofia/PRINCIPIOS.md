# Principios Fundamentais

Filosofia core do vibe-method: motor + artefato.

---

## Indice

1. [Manifesto](#manifesto) - 10 principios fundamentais
2. [Mindset do Ferramenteiro](#mindset-do-ferramenteiro) - O pensamento correto
3. [Sistema e Artefato](#sistema-e-artefato) - A relacao fundamental
4. [Ferramentaria](#ferramentaria) - Reducao de complexidade
5. [Perguntas Fundamentais](#perguntas-fundamentais) - O que sempre perguntar
6. [Anti-Padroes](#anti-padroes) - O que evitar

---

## Manifesto

### 10 Principios Fundamentais

**1. Codigo nao e produto. Codigo e infraestrutura.**

O codigo existe para criar capacidade, nao para resolver problemas diretamente. Ele e o motor. O que o motor faz depende do que ele consome.

**2. Decisoes de negocio nao pertencem ao codigo.**

Toda decisao que define comportamento - regras, fluxos, estruturas, criterios - deve existir como artefato. Se uma decisao exige codigo para ser alterada, ela esta no lugar errado.

**3. O artefato e o ponto de verdade.**

Quer entender o que o sistema faz? Leia os artefatos.
Quer mudar o que o sistema faz? Mude os artefatos.
O sistema se torna compreensivel pelo que consome, nao pelo que ele e.

**4. Ferramentas existem para gerar artefatos.**

Ferramentas nao entram no sistema. Elas produzem o que entra. Ferramenta pode ser descartavel, improvisada, temporaria. O artefato e o que persiste.

**5. Papeis distintos, projeto unico.**

| Papel | Responsabilidade |
|-------|------------------|
| Quem entende o problema | Define a solucao |
| Quem conhece o sistema | Desenha a ferramenta |
| Quem constroi a ferramenta | Entrega capacidade de producao |
| Quem integra o motor | Faz o sistema consumir os artefatos |

**6. O trabalho tecnico e criar meios, nao fins.**

A pergunta NAO e "como resolvo esse requisito?"
A pergunta E "que ferramenta permite que esse requisito vire artefato?"

**7. Mudar e editar, nao reescrever.**

Evolucao do sistema acontece alterando artefatos versionados. Nao exige refatoracao. Nao exige programador no caminho.

**8. Menos codigo, mais clareza.**

Codigo enxuto que consome artefatos declarativos e mais testavel, mais seguro, mais compreensivel do que codigo que carrega regra de negocio.

**9. Artefatos sao reformulaveis.**

Por serem declarativos e isolados, artefatos podem ser analisados, comparados, migrados, reescritos - por humanos ou por IA - sem risco de quebrar logica tecnica.

**10. O sistema emerge da combinacao.**

```
Motor + Artefatos = Sistema funcionando
```

O motor e estavel. Os artefatos sao vivos. O produto e a execucao dessa combinacao.

---

## Mindset do Ferramenteiro

### O Fundamento

Um sistema existe para resolver um negocio.

```
sistema <-> negocio
```

Essa relacao esconde uma tensao: quem entende do sistema nao entende do negocio. Quem entende do negocio nao entende do sistema.

### O Artefato como Contrato

```
sistema <-> artefato <-> negocio
```

O **artefato** e o contrato entre a engenharia de sistema e a engenharia de negocio. Ele permite que os dois lados conversem sem transferencia de responsabilidade.

| Lado | Define |
|------|--------|
| Engenheiro de sistema | Estrutura (forma, campos, validacoes) |
| Engenheiro de negocio | Conteudo (valores, regras expressas) |

### A Ferramentaria

```
SISTEMA <-> motor <-> ARTEFATO <-> ferramenta <-> NEGOCIO
```

O ferramenteiro reduz complexidade dos dois lados:

| Para | Entrega |
|------|---------|
| Sistema | **Motor** - le estrutura, valida conteudo, executa |
| Negocio | **Ferramenta** - produz conteudo valido sem conhecer a estrutura |

### O Papel do Ferramenteiro

O ferramenteiro pensa diferente:

| Pergunta Errada | Pergunta Certa |
|-----------------|----------------|
| "Como codifico essa regra?" | "Como essa regra vira artefato?" |
| "Como resolvo esse requisito?" | "Que ferramenta permite o negocio produzir isso sozinho?" |
| "Como o sistema processa isso?" | "Que motor permite o sistema consumir isso?" |

### A Pergunta Final

**Voce esta aumentando complexidade ou reduzindo?**

- Se esta codificando regra de negocio → esta transferindo responsabilidade pro lugar errado
- Se esta entregando motor e ferramenta → esta pensando como ferramenteiro

---

## Sistema e Artefato

### O Motor

O motor e a parte estavel do sistema. Ele:

- Le artefatos
- Valida estrutura
- Executa comportamento definido nos artefatos
- NAO contem regras de negocio

```typescript
// Motor: le config, executa workflow
const config = loadConfig('workflow.yaml');
const engine = new WorkflowEngine(config);
await engine.run(input);
```

### O Artefato

O artefato e a parte viva. Ele:

- Define comportamento
- E declarativo (descreve "o que", nao "como")
- E editavel sem programacao
- E versionavel

```yaml
# Artefato: define workflow
name: onboarding
steps:
  - send_email: welcome
  - wait: 3d
  - send_email: followup
```

### A Separacao

| Aspecto | Motor | Artefato |
|---------|-------|----------|
| Estabilidade | Estavel | Muda frequentemente |
| Quem edita | Desenvolvedor | Qualquer stakeholder |
| Conteudo | Logica de execucao | Regras de negocio |
| Teste | Unitario/integracao | Validacao de schema |

---

## Ferramentaria

### Reducao de Complexidade

```
Complexidade do Sistema    Complexidade do Negocio
         |                          |
         v                          v
      MOTOR                    FERRAMENTA
         |                          |
         v                          v
         └──────── ARTEFATO ────────┘
```

### Tipos de Ferramentas

| Ferramenta | Gera |
|------------|------|
| Editor visual de workflow | `workflow.yaml` |
| Formulario de regras | `rules.json` |
| CLI de templates | `template.md` |
| IDE de specs | `feature.md` |

### Tipos de Motores

| Motor | Consome |
|-------|---------|
| Workflow engine | `workflow.yaml` |
| Rules engine | `rules.json` |
| Template renderer | `template.md` |
| Feature interpreter | `feature.md` |

---

## Perguntas Fundamentais

Antes de implementar qualquer coisa, pergunte:

### 1. Isso e regra de negocio?

Se sim → deve ser artefato, nao codigo.

### 2. Isso muda com frequencia?

Se sim → deve ser artefato, nao codigo.

### 3. Quem precisa mudar isso?

Se nao-programador → deve ser artefato com ferramenta.

### 4. O motor ja existe?

Se sim → use-o.
Se nao → crie motor generico, nao solucao especifica.

### 5. A ferramenta ja existe?

Se sim → use-a.
Se nao → crie ferramenta que gera artefato valido.

---

## Anti-Padroes

### 1. Regra Disfarada de Codigo

```typescript
// ANTI-PADRAO
const discount = isFirstPurchase ? 0.1 : isPremium ? 0.05 : 0;

// PADRAO CORRETO
const discount = pricingRules.getDiscount(customer);
// pricing-rules.yaml define os valores
```

### 2. Configuracao Falsa

```typescript
// ANTI-PADRAO: config que ninguem edita
const config = {
  maxRetries: 3,
  timeout: 5000,
};

// PADRAO CORRETO: ou e constante ou e artefato
const MAX_RETRIES = 3; // Constante tecnica
const timeout = loadConfig('timeouts.yaml').api; // Artefato se negocio muda
```

### 3. Motor que Conhece o Negocio

```typescript
// ANTI-PADRAO
class WorkflowEngine {
  run(workflow) {
    if (workflow.type === 'onboarding') {
      // logica especifica de onboarding
    }
  }
}

// PADRAO CORRETO
class WorkflowEngine {
  run(workflow) {
    for (const step of workflow.steps) {
      await this.executeStep(step); // generico
    }
  }
}
```

---

## Diagnostico de Problemas

### Sinais de Codigo com Regras de Negocio

```typescript
// ERRADO: regra hardcoded
if (user.role === 'admin' || user.role === 'manager') {
  // ...
}

// CERTO: regra em artefato
const allowedRoles = config.permissions[action].roles;
if (allowedRoles.includes(user.role)) {
  // ...
}
```

### Sinais de Artefato bem Desenhado

- Pode ser editado por nao-programador
- Tem schema validavel
- E versionado no git
- Mudanca nao requer deploy

### Sinais de Motor bem Desenhado

- Nao contem `if` de negocio
- Aceita qualquer artefato valido
- Falha rapido com artefato invalido
- E testavel isoladamente

---

## Checklist de Avaliacao

Ao projetar nova feature:

- [ ] Identifiquei o que e regra de negocio
- [ ] Regras estao em artefatos, nao em codigo
- [ ] Artefatos tem schema definido
- [ ] Motor valida artefatos no startup
- [ ] Ferramenta existe (ou sera criada) para gerar artefatos
- [ ] Stakeholder pode mudar comportamento sem programador

---

## Resumo

```
┌─────────────────────────────────────────────────────────────┐
│                     VIBE METHOD                             │
│                                                             │
│   NEGOCIO ──ferramenta──> ARTEFATO <──motor── SISTEMA      │
│                              │                              │
│                         FONTE DE                            │
│                          VERDADE                            │
│                                                             │
│   • Codigo e infraestrutura                                 │
│   • Artefato e comportamento                                │
│   • Mudar = editar artefato                                 │
│   • Ferramenteiro reduz complexidade                        │
└─────────────────────────────────────────────────────────────┘
```
