# Feature: Expectations Assistant

Assistente de expectativas com lembretes personalizados por classificacao de guardiao.

**Prefixo:** EXPECT

---

## User Stories

### US-EXPECT-001: Receber Lembrete Personalizado

**Como** guardiao,
**Quero** receber lembretes adaptados ao meu perfil,
**Para** nao esquecer de bater o ponto e manter meu premio.

**Criterios de Aceite:**
- [ ] Lembrete preventivo antes do horario (amarelo/vermelho)
- [ ] Lembrete corretivo se nao bater (todos)
- [ ] Tom adequado a minha classificacao
- [ ] Sem lembrete preventivo se sou verde

---

### US-EXPECT-002: Registrar Excecao

**Como** guardiao,
**Quero** informar quando tenho motivo para nao cumprir expectativa,
**Para** nao ser penalizado injustamente.

**Criterios de Aceite:**
- [ ] Informar via WhatsApp
- [ ] Excecao registrada no sistema
- [ ] Removido do monitoramento temporariamente
- [ ] Gestor recebe para aprovar/rejeitar

---

### US-EXPECT-003: Ver Quadro de Adesao

**Como** coordenador,
**Quero** ver quadro em tempo real de adesao,
**Para** saber quem esta cumprindo as expectativas.

**Criterios de Aceite:**
- [ ] Pontos esperados vs realizados
- [ ] Pendencias por nome
- [ ] Distribuicao verde/amarelo/vermelho
- [ ] Destaque para em risco de perder premio

---

### US-EXPECT-004: Consultar Padroes via Chat

**Como** gestor,
**Quero** perguntar sobre padroes de falhas via chat,
**Para** entender causas e tomar acoes.

**Criterios de Aceite:**
- [ ] Perguntas como "Quem esta em risco de perder o premio?"
- [ ] IA lista guardioes e sugere acoes
- [ ] Analise de habitos e contextos
- [ ] Propostas de solucao personalizadas

---

### US-EXPECT-005: Configurar Nova Expectativa

**Como** administrador,
**Quero** criar novas expectativas via interface,
**Para** monitorar outros tipos de tarefas sem programar.

**Criterios de Aceite:**
- [ ] Nome e descricao da expectativa
- [ ] Trigger (evento que dispara)
- [ ] Tolerancia (tempo aceitavel)
- [ ] Templates de notificacao por nivel
- [ ] Escalonamento para gestao

---

## Requirements

### REQ-EXPECT-001: Classificacao por Taxa de Falhas

Guardioes devem ser classificados por taxa de falhas.

**Regras:**
- Formula: (falhas / oportunidades) * 100%
- Janela: ultimos 7 dias
- Verde: 0-10% (confiaveis)
- Amarelo: 11-50% (precisam apoio)
- Vermelho: 51-100% (sempre esquecem)

**Refs:** DES-SCORE-003

---

### REQ-EXPECT-002: Analise por Momento

Cada momento (entrada, almoco, saida) deve ser analisado separadamente.

**Regras:**
- Guardiao pode ser verde de manha e amarelo no almoco
- Lembretes enviados apenas para momentos problematicos
- Dashboard mostra classificacao por momento

---

### REQ-EXPECT-003: Lembretes Preventivos e Corretivos

Sistema deve enviar dois tipos de lembrete.

**Regras:**
- **Preventivo:** X minutos antes do horario (amarelo/vermelho)
- **Corretivo:** Apos horario expirar sem acao (todos)
- Tom escalado por classificacao
- Verde: apenas corretivo delicado
- Vermelho: alertas fortes com consequencias

**Refs:** DES-ESCAL-004, DES-ESCAL-005

---

### REQ-EXPECT-004: Reclassificacao Automatica

Sistema deve reclassificar guardioes periodicamente.

**Regras:**
- Reclassificacao a cada 6 horas
- Baseada nos ultimos 7 dias
- Dashboard atualizado automaticamente
- Notificacao se guardiao mudar de nivel

---

### REQ-EXPECT-005: Framework Generico

Sistema deve ser generico para qualquer expectativa.

**Regras:**
- Configuravel via interface (sem codigo)
- Aplicavel a: ponto, relatorio, pesquisa, confirmacao, etc
- Cada expectativa tem seus proprios templates e thresholds
- Metricas separadas por expectativa

---

### REQ-EXPECT-006: Integracao com Fila de Aprovacoes

Excecoes devem ir para fila de aprovacoes.

**Regras:**
- Excecao registrada via WhatsApp
- Vai para fila com tipo "ponto"
- Gestor aprova ou rejeita
- Guardiao notificado da decisao

**Refs:** REQ-QUEUE-001

---

## Design

### DES-EXPECT-001: Expectation Framework

Framework generico de expectativas.

**Implementacao:**
- Tabela `expectations`:
  - `id`, `name`, `description`
  - `trigger_event`, `tolerance_minutes`
  - `preventive_offset_minutes`
  - `templates_by_level` (JSON)
  - `escalation_config` (JSON)
  - `active`
- Configuracao via interface admin
- Novos tipos sem alteracao de codigo

**Trade-offs:**
- Estrutura generica pode ser complexa
- Mas reutilizavel para muitos casos

---

### DES-EXPECT-002: Classification Engine

Motor de classificacao de guardioes.

**Implementacao:**
- Worker calcula taxa de falhas por guardiao/momento
- Janela de 7 dias (configuravel)
- Thresholds: 0-10% verde, 11-50% amarelo, 51-100% vermelho
- Resultado salvo em cache Redis
- Reclassificacao a cada 6 horas

**Trade-offs:**
- Processamento periodico
- Mas evita calculos em tempo real

**Refs:** DES-SCORE-003

---

### DES-EXPECT-003: Reminder Scheduler

Agendador de lembretes.

**Implementacao:**
- Busca proximas batidas de ponto no PrimeCare
- Agenda lembretes preventivos para amarelo/vermelho
- Agenda verificacao de lembrete corretivo para todos
- Jobs em fila Redis com horario de execucao

**Trade-offs:**
- Muitos jobs agendados
- Mas precisao de horarios garantida

---

### DES-EXPECT-004: Real-time Adhesion Dashboard

Dashboard de adesao em tempo real.

**Implementacao:**
- WebSocket para atualizacao ao vivo
- Metricas: esperados, realizados, pendentes
- Lista de guardioes com status atual
- Grafico de distribuicao por classificacao
- Filtros por equipe, regiao, expectativa

**Trade-offs:**
- Conexoes WebSocket para cada usuario
- Mas visibilidade em tempo real essencial

---

### DES-EXPECT-005: Exception Handler

Tratador de excecoes via WhatsApp.

**Implementacao:**
- Guardiao envia mensagem informando excecao
- Gatekeeper classifica como "excecao de expectativa"
- Cria item na fila de aprovacoes
- Remove guardiao do monitoramento temporariamente
- Notifica gestao para aprovar/rejeitar

**Trade-offs:**
- Depende de classificacao correta pelo gatekeeper
- Mas canal familiar para guardioes (WhatsApp)

---

## Dependencias

**Fontes:** brainstorming/Assistente de Expectativas.md

**Depends:**
- DES-SCORE-003 (classificacao)
- DES-ESCAL-001 a DES-ESCAL-006 (escalacao)
- DES-PRIME-001 (dados de ponto)
- DES-QUEUE-001 (fila de aprovacoes)
- DES-NOTIFY-001 (notificacoes)
- DES-CHAT-001 (consultas via chat)
