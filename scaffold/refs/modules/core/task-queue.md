# Task Queue (Inbox)

Fila de itens que requerem acao humana.

---

## O Problema Universal

Todo sistema tem situacoes que a automacao nao resolve. Escalacoes de bot, aprovacoes pendentes, excecoes. Sem uma fila organizada, esses itens se perdem em emails, planilhas ou memoria.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Que tipos de itens entram na fila?**
   - Escalacoes de automacao?
   - Solicitacoes de usuarios/clientes?
   - Alertas do sistema?
   - Aprovacoes pendentes?

2. **De onde vem cada tipo?**
   - Bot/automacao criou
   - Usuario criou manualmente
   - Sistema detectou anomalia
   - Webhook externo

3. **Como priorizar?**
   - Por urgencia (critico > alto > medio > baixo)?
   - Por tempo (FIFO, mais antigo primeiro)?
   - Por tipo (certos tipos sempre primeiro)?
   - Por SLA (prazo de resposta)?

4. **Quem pode trabalhar nos itens?**
   - Qualquer usuario (first-come-first-served)?
   - Atribuicao especifica (designado para fulano)?
   - Por competencia (tipo X vai para equipe Y)?

5. **Qual o ciclo de vida?**
   - Estados possiveis: pendente, em andamento, resolvido, descartado?
   - Pode reabrir item fechado?
   - Historico e auditoria?

6. **O que acontece se nao resolver?**
   - Expira automaticamente?
   - Escala para nivel superior?
   - Apenas fica pendente?

---

## Anatomia

### Estados Tipicos

```
[Pendente] ──> [Em Andamento] ──> [Resolvido]
     │              │
     │              └──> [Descartado]
     │
     └──> [Descartado]
```

| Estado | Significado | Cor |
|--------|-------------|-----|
| Pendente | Aguardando alguem assumir | Amarelo |
| Em Andamento | Alguem esta trabalhando | Azul |
| Resolvido | Concluido com sucesso | Verde |
| Descartado | Fechado sem acao | Cinza |

### Visualizacoes

**Lista** - Tradicional, compacta
```
┌─────────────────────────────────────────────────────────────┐
│ Inbox                                    [Filtros] [+ Nova] │
├─────────────────────────────────────────────────────────────┤
│ [!] Paciente reclama de atraso           [Urgente] ha 5min  │
│ [ ] Confirmacao pendente - Maria         [Media]   ha 15min │
│ [ ] Reagendamento solicitado             [Media]   ha 1h    │
│ [✓] Duvida sobre pagamento               [Baixa]   ha 2h    │
└─────────────────────────────────────────────────────────────┘
```

**Kanban** - Visual, arrastar e soltar
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   PENDENTE   │ EM ANDAMENTO │  RESOLVIDO   │  DESCARTADO  │
│     (3)      │     (1)      │     (5)      │     (2)      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │
│ │ [!] Item │ │ │ [ ] Item │ │ │ [✓] Item │ │ │ [-] Item │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘ │
│ ┌──────────┐ │              │ ┌──────────┐ │ ┌──────────┐ │
│ │ [ ] Item │ │              │ │ [✓] Item │ │ │ [-] Item │ │
│ └──────────┘ │              │ └──────────┘ │ └──────────┘ │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## Variacoes por Dominio

| Aspecto | Clinica (Inbox) | Escola (Solicitacoes) | Suporte (Tickets) | Aprovacoes |
|---------|-----------------|----------------------|-------------------|------------|
| **Nome** | Tarefas | Solicitacoes | Tickets | Aprovacoes |
| **Rota** | /inbox | /solicitacoes | /tickets | /aprovacoes |
| **Tipos** | escalacao, confirmacao, reclamacao | matricula, documento, duvida | bug, feature, suporte | compra, ferias, reembolso |
| **Origem** | bot WhatsApp | portal pais | clientes | funcionarios |
| **Prioridade** | urgencia medica | prazo resposta | SLA do plano | valor/impacto |
| **Atribuicao** | recepcionista | departamento | especialidade | aprovador |

---

## Campos do Item

### Obrigatorios

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | Identificador unico |
| type | string | Tipo do item (enum) |
| status | string | Estado atual (enum) |
| priority | string | Prioridade (enum) |
| title | string | Titulo curto |
| created_at | timestamp | Quando foi criado |

### Opcionais

| Campo | Tipo | Notas |
|-------|------|-------|
| summary | string | Descricao detalhada |
| assigned_to | uuid | Quem esta trabalhando |
| assigned_at | timestamp | Quando foi atribuido |
| completed_at | timestamp | Quando foi resolvido |
| due_at | timestamp | Prazo (SLA) |
| patient_id | uuid | Referencia a entidade relacionada |
| conversation_id | uuid | Conversa origem (se bot) |
| metadata | json | Dados adicionais |

---

## Fluxos

### Item Criado por Automacao

```
1. Bot recebe mensagem que nao consegue processar
2. Bot cria item no Task Queue:
   - type: "escalation"
   - priority: baseada em palavras-chave
   - summary: contexto da conversa
   - conversation_id: link para conversa
3. Item aparece como "Pendente"
4. Recepcionista ve e assume (Em Andamento)
5. Resolve a situacao
6. Marca como "Resolvido"
```

### Item Criado Manualmente

```
1. Usuario clica "Nova Tarefa"
2. Preenche tipo, prioridade, descricao
3. Opcionalmente atribui a alguem
4. Item criado como "Pendente" ou "Em Andamento"
```

### Arrastar no Kanban

```
1. Usuario arrasta card de "Pendente" para "Em Andamento"
2. Sistema automaticamente:
   - Define assigned_to = usuario atual
   - Define assigned_at = agora
3. Usuario arrasta de "Em Andamento" para "Resolvido"
4. Sistema define completed_at = agora
```

---

## Principios de Design

### 1. Prioridade Visual

Itens urgentes devem "gritar". Use cor, icone, posicao. Nao deixar urgente se misturar com baixa prioridade.

### 2. Contexto no Card

O card deve ter informacao suficiente para decidir se vale abrir. Titulo + prioridade + tempo + origem.

### 3. Acao com Um Clique

"Assumir" e "Resolver" devem ser acoes rapidas. Nao exigir formulario para cada acao.

### 4. Filtros Persistentes

Usuario que so quer ver "minhas tarefas" ou "urgentes" nao deve refiltrar toda vez que volta.

### 5. Contadores no Menu

Badge no menu mostrando quantas pendentes. Usuario sabe se precisa olhar sem abrir a tela.

### 6. Mobile Kanban

Em mobile, Kanban vira tabs horizontais (uma coluna por vez). Swipe para mudar status.

---

## Anti-patterns

### "Fila unica sem priorizacao"
**Problema:** Tudo misturado, urgente se perde.
**Solucao:** Prioridade obrigatoria, ordenar por ela.

### "Atribuicao obrigatoria"
**Problema:** Ninguem assume ate alguem designar.
**Solucao:** Permitir "primeiro que pegar" ou atribuicao opcional.

### "Sem historico"
**Problema:** Nao sabe quem fez o que, quando.
**Solucao:** Log de transicoes de estado.

### "Estados demais"
**Problema:** Usuario confuso com muitas opcoes.
**Solucao:** 4 estados basicos. Adicionar so se necessario.

### "Notificacao para tudo"
**Problema:** Fadiga de alertas, usuario ignora.
**Solucao:** Notificar apenas urgentes ou atribuidas.

---

## Exemplo: Inbox de Clinica

```
TIPOS:
- human_request: Paciente pediu atendente humano
- confirmation_timeout: Confirmacao expirou sem resposta
- low_confidence: Bot nao entendeu a mensagem
- complex_scheduling: Agendamento complexo
- complaint: Reclamacao do paciente
- urgent: Paciente marcou como urgente

PRIORIDADES:
- urgent: Vermelho, sempre no topo
- high: Laranja
- medium: Amarelo
- low: Cinza

FLUXO KANBAN:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   PENDENTE   │ EM ANDAMENTO │  RESOLVIDO   │  DESCARTADO  │
│     (3)      │     (1)      │    (hoje)    │   (hoje)     │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ [!] Maria    │ [ ] Joao     │ [✓] Pedro    │ [-] Spam     │
│ Reclamacao   │ Reagendar    │ Confirmou    │              │
│ ha 5min      │ Ana          │ ha 1h        │              │
│              │              │              │              │
│ [ ] Carlos   │              │ [✓] Lucia    │              │
│ Confirmacao  │              │ Duvida       │              │
│ ha 20min     │              │ ha 2h        │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

DETALHE DO ITEM:
┌─────────────────────────────────────────────────────────────┐
│ Reclamacao - Maria Silva                             [X]    │
├─────────────────────────────────────────────────────────────┤
│ [!] Urgente                                    ha 5 minutos │
│                                                             │
│ RESUMO:                                                     │
│ Paciente reclamou de atraso na consulta de ontem.          │
│ Pediu falar com atendente.                                  │
│                                                             │
│ CONVERSA:                                                   │
│ [Ver conversa completa]                                     │
│                                                             │
│ PACIENTE:                                                   │
│ Maria Silva - (32) 99999-0000                              │
│ [Ver ficha]                                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Assumir]  [Resolver]  [Descartar]                         │
└─────────────────────────────────────────────────────────────┘
```
