# Metrics (Pulse)

Dashboard de metricas e KPIs do negocio.

---

## O Problema Universal

Gestores precisam saber se o negocio vai bem. Sem metricas, decisoes sao baseadas em intuicao ou "achismo". Com metricas, e possivel identificar tendencias, problemas e oportunidades antes que seja tarde.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Qual a pergunta principal que o gestor quer responder?**
   - "O negocio esta crescendo?"
   - "Estamos perdendo clientes?"
   - "A equipe esta produtiva?"
   - "Onde esta o gargalo?"

2. **Quais metricas demonstram valor?**
   - Receita, faturamento?
   - Quantidade (agendamentos, vendas, atendimentos)?
   - Ocupacao, utilizacao?
   - Satisfacao?

3. **Qual periodo de comparacao faz sentido?**
   - Dia atual vs ontem?
   - Semana atual vs anterior?
   - Mes atual vs anterior?
   - Mes atual vs mesmo mes ano anterior?

4. **Quais sao os KPIs criticos?**
   - O que indica SUCESSO no negocio?
   - O que indica PROBLEMA?
   - Existe meta/benchmark?

5. **Precisa de drill-down?**
   - Ver detalhes ao clicar na metrica?
   - Filtrar por periodo, provedor, tipo?

6. **Precisa de exportacao?**
   - PDF para reunioes?
   - Excel para analise?
   - Envio automatico por email?

7. **Metricas sao globais ou segmentadas?**
   - Por provedor (medico, vendedor)?
   - Por unidade (filial, loja)?
   - Por tipo de servico?

---

## Anatomia

### Estrutura de um Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ PULSE                                    [Periodo: Semana ▾]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ CARDS PRINCIPAIS (KPIs do momento)                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ KPI 1       │ │ KPI 2       │ │ KPI 3       │            │
│ │ 1.234       │ │ 89%         │ │ R$ 45.000   │            │
│ │ ▲ +12%      │ │ ▼ -3%       │ │ ▲ +8%       │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                             │
│ GRAFICO PRINCIPAL (tendencia ao longo do tempo)            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                                                         ││
│ │     ████                                                ││
│ │   ████████      ████                                    ││
│ │ ████████████  ████████  ████                           ││
│ │ ██████████████████████████████                         ││
│ │ Seg  Ter  Qua  Qui  Sex  Sab  Dom                      ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ DETALHAMENTOS (tabelas, rankings, breakdowns)              │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │ Por Provedor            │ │ Por Tipo                    ││
│ │ 1. Dr. Carlos   45      │ │ Consulta      60%           ││
│ │ 2. Dra. Ana     38      │ │ Retorno       25%           ││
│ │ 3. Dr. Ricardo  32      │ │ Exame         15%           ││
│ └─────────────────────────┘ └─────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tipos de Visualizacao

| Tipo | Quando Usar | Exemplo |
|------|-------------|---------|
| **Card KPI** | Numero unico importante | Total de vendas |
| **Grafico de linha** | Tendencia ao longo do tempo | Agendamentos por dia |
| **Grafico de barras** | Comparacao entre categorias | Vendas por vendedor |
| **Grafico de pizza** | Distribuicao percentual | Tipos de atendimento |
| **Tabela ranking** | Top N de algo | Melhores clientes |
| **Indicador (gauge)** | Meta vs realizado | Ocupacao |

### Componentes de um Card KPI

```
┌─────────────────────────────┐
│ Titulo do KPI               │  <- O que e
│                             │
│     1.234                   │  <- Valor atual
│                             │
│ ▲ +12% vs semana anterior   │  <- Variacao (opcional)
│                             │
│ Meta: 1.500 (82%)           │  <- Meta (opcional)
└─────────────────────────────┘
```

---

## Variacoes por Dominio

| Aspecto | Clinica | Escola | E-commerce | SaaS |
|---------|---------|--------|------------|------|
| **KPI principal** | Ocupacao | Frequencia | Conversao | MRR |
| **Metrica de receita** | Consultas/dia | Matriculas | Vendas | Assinaturas |
| **Metrica de perda** | Taxa no-show | Evasao | Abandono carrinho | Churn |
| **Metrica de satisfacao** | NPS | - | Reviews | NPS, CSAT |
| **Periodo tipico** | Dia/Semana | Bimestre/Ano | Dia/Mes | Mes |
| **Comparacao** | vs semana anterior | vs mesmo periodo ano anterior | vs mes anterior | vs mes anterior |
| **Segmentacao** | Por medico | Por turma/serie | Por categoria | Por plano |

### Exemplos de KPIs por Dominio

**Clinica:**
- Agendamentos (hoje, semana, mes)
- Taxa de ocupacao (% horarios preenchidos)
- Taxa de no-show (% faltas)
- Taxa de confirmacao (% que confirmaram)
- Tempo medio de espera

**Escola:**
- Frequencia (% presenca)
- Evasao (% que sairam)
- Notas medias
- Matriculas novas vs periodo anterior

**E-commerce:**
- Pedidos (quantidade, valor)
- Ticket medio
- Taxa de conversao (visitantes → compradores)
- Taxa de abandono de carrinho
- Produtos mais vendidos

**SaaS:**
- MRR (Monthly Recurring Revenue)
- Churn (% cancelamentos)
- LTV (Lifetime Value)
- CAC (Custo de Aquisicao)
- Usuarios ativos (DAU, MAU)

---

## Fluxos

### Carregar Dashboard

```
1. Usuario acessa /pulse (ou /metrics, /dashboard)
2. Sistema carrega periodo padrao (ex: ultima semana)
3. Faz requisicoes paralelas para cada metrica
4. Renderiza cards e graficos conforme dados chegam
5. Usuario pode alterar periodo ou filtros
6. Sistema recarrega dados com novos parametros
```

### Drill-Down

```
1. Usuario clica em card KPI (ex: "Agendamentos: 150")
2. Modal ou pagina de detalhe abre
3. Mostra breakdown:
   - Por dia
   - Por provedor
   - Por tipo
   - Por status
4. Permite filtrar e exportar
```

### Exportar Relatorio

```
1. Usuario clica "Exportar"
2. Escolhe formato (PDF, Excel)
3. Escolhe periodo e metricas
4. Sistema gera arquivo
5. Download automatico ou envio por email
```

---

## Calculo de Metricas

### Metricas Pre-Calculadas vs Tempo Real

**Pre-calculadas (recomendado para performance):**
```
- Rodar job noturno/horario que calcula metricas do dia
- Armazenar em tabela de metricas
- Dashboard le da tabela pre-calculada
- Rapido, consistente, economiza recursos
```

**Tempo real (quando necessario):**
```
- Calcular na hora da requisicao
- Usar para "hoje" quando dados mudam frequentemente
- Mais lento, mais carga no banco
```

### Tabela de Metricas Pre-Calculadas

```sql
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  metric_name VARCHAR NOT NULL,
  metric_value DECIMAL,
  dimensions JSONB,  -- {"provider_id": "...", "type": "..."}
  created_at TIMESTAMP
);

-- Exemplos:
-- date: 2024-01-15, metric_name: "appointments_count", value: 45
-- date: 2024-01-15, metric_name: "no_show_rate", value: 0.12
-- date: 2024-01-15, metric_name: "appointments_count", value: 15, dimensions: {"provider_id": "abc"}
```

### Formulas Comuns

```
TAXA DE OCUPACAO:
= agendamentos_realizados / horarios_disponiveis * 100

TAXA DE NO-SHOW:
= faltas / agendamentos_confirmados * 100

VARIACAO PERCENTUAL:
= (valor_atual - valor_anterior) / valor_anterior * 100

MEDIA MOVEL (7 dias):
= soma(ultimos_7_dias) / 7

CRESCIMENTO MES A MES:
= (valor_mes_atual - valor_mes_anterior) / valor_mes_anterior * 100
```

---

## Principios de Design

### 1. Responda UMA Pergunta Principal

Dashboards sobrecarregados confundem. O gestor quer saber "o negocio vai bem?" em um olhar. Destaque 3-5 KPIs principais no topo.

### 2. Contexto e Tudo

"150 agendamentos" nao significa nada sozinho. E bom ou ruim? Compare com:
- Periodo anterior (semana passada: 140 → ▲+7%)
- Meta (meta: 200 → 75%)
- Historico (media: 130 → acima da media)

### 3. Cores Comunicam

- **Verde**: Bom, crescimento, meta atingida
- **Vermelho**: Ruim, queda, abaixo da meta
- **Amarelo**: Atencao, neutro
- **Cinza**: Indisponivel, sem dados

Nao use cores aleatorias. Seja consistente.

### 4. Mobile = Cards Empilhados

Em mobile, dashboards complexos nao funcionam. Mostrar:
- KPIs principais em cards empilhados
- Grafico simplificado (ou ocultar)
- Acao de "ver mais" para detalhes

### 5. Loading States Importam

Metricas podem demorar. Mostrar:
- Skeleton enquanto carrega
- Erro especifico se falhar
- Timestamp "atualizado ha X minutos"

### 6. Permissoes por Metrica

Nem todos devem ver tudo:
- Admin: todas as metricas
- Gestor: metricas da equipe
- Operador: apenas suas proprias (se aplicavel)

---

## Anti-patterns

### "Dashboard com 50 metricas"
**Problema:** Information overload. Ninguem olha tudo.
**Solucao:** 3-5 KPIs principais. Resto em abas/drill-down.

### "Numero sem contexto"
**Problema:** "150" - e bom ou ruim?
**Solucao:** Sempre mostrar comparacao ou meta.

### "Grafico bonito mas inutil"
**Problema:** Grafico de pizza 3D com 15 fatias.
**Solucao:** Escolher visualizacao adequada ao dado.

### "Calcular tudo em tempo real"
**Problema:** Dashboard lento, sobrecarrega banco.
**Solucao:** Pre-calcular metricas historicas.

### "Mesmo dashboard para todos"
**Problema:** Recepcionista ve metricas financeiras.
**Solucao:** Dashboard adaptado por role.

### "Sem drill-down"
**Problema:** Ve o numero mas nao consegue investigar.
**Solucao:** Permitir clicar para ver detalhes.

---

## Exemplo: Pulse de Clinica

```
/pulse

┌─────────────────────────────────────────────────────────────┐
│ Pulse                                    Periodo: [Semana ▾]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│ │ Agendamentos│ │ Ocupacao    │ │ No-Show     │ │ Confirm.││
│ │             │ │             │ │             │ │         ││
│ │    152      │ │    78%      │ │    8%       │ │   92%   ││
│ │ ▲ +12%      │ │ ▲ +5pp      │ │ ▼ -2pp      │ │ ▲ +3pp  ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
│                                                             │
│ AGENDAMENTOS POR DIA                                        │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 35│         ████                                        ││
│ │ 30│   ████  ████  ████                                  ││
│ │ 25│   ████  ████  ████  ████                            ││
│ │ 20│   ████  ████  ████  ████  ████                      ││
│ │ 15│   ████  ████  ████  ████  ████  ░░░░                ││
│ │   └───Seg───Ter───Qua───Qui───Sex───Sab────             ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌────────────────────────┐  ┌────────────────────────────┐ │
│ │ POR PROFISSIONAL       │  │ POR TIPO                   │ │
│ ├────────────────────────┤  ├────────────────────────────┤ │
│ │ Dr. Carlos      45  ▲  │  │ Consulta         60%       │ │
│ │ Dra. Ana        42  ▲  │  │ Retorno          25%       │ │
│ │ Dr. Ricardo     35  ▼  │  │ Exame            15%       │ │
│ │ Dra. Paula      30  =  │  │                            │ │
│ └────────────────────────┘  └────────────────────────────┘ │
│                                                             │
│ ULTIMAS FALTAS                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Maria Silva      Qua 10:00   Dr. Carlos   [Reagendar]  ││
│ │ Joao Pereira     Ter 14:30   Dra. Ana     [Reagendar]  ││
│ │ Ana Costa        Seg 09:00   Dr. Ricardo  [Reagendar]  ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘

LEGENDA:
▲ = aumento vs periodo anterior
▼ = queda vs periodo anterior
= = sem mudanca
pp = pontos percentuais
```
