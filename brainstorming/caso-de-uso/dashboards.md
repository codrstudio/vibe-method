# Feature: Dashboards

Paineis com indicadores e KPIs em tempo real para visualizacao de metricas operacionais.

**Prefixo:** DASH

---

## User Stories

### US-DASH-001: Visualizar Funil de Recrutamento

**Como** coordenador de recrutamento,
**Quero** visualizar o funil de conversao do processo de contratacao,
**Para** identificar em quais etapas ha maior perda de candidatos.

**Criterios de Aceite:**
- [ ] Exibe taxa de conversao geral (ex: 3,7%)
- [ ] Mostra percentual de candidatos em cada etapa
- [ ] Destaca etapa com maior perda
- [ ] Permite filtrar por periodo

---

### US-DASH-002: Acompanhar Taxa de No-Show

**Como** coordenador de recrutamento,
**Quero** ver a taxa de no-show nas entrevistas,
**Para** avaliar eficacia dos lembretes e tomar acoes corretivas.

**Criterios de Aceite:**
- [ ] Cartao com taxa atual vs meta (<18%)
- [ ] Indica se esta dentro ou fora da meta
- [ ] Mostra total de entrevistas agendadas, faltas e presencas
- [ ] Permite comparar com periodos anteriores

---

### US-DASH-003: Analisar Performance por Canal

**Como** coordenador de marketing,
**Quero** comparar desempenho de canais de captacao,
**Para** decidir onde investir recursos.

**Criterios de Aceite:**
- [ ] Lista canais com numero de candidatos e contratacoes
- [ ] Mostra taxa de conversao por canal
- [ ] Exibe custo estimado por candidato e por contratado
- [ ] Permite ordenar por metrica

---

### US-DASH-004: Monitorar Tempo de Contratacao

**Como** gestor de operacoes,
**Quero** acompanhar o tempo medio de contratacao,
**Para** garantir que processos estao dentro do prazo esperado.

**Criterios de Aceite:**
- [ ] Velocimetro com tempo medio atual vs meta (2 dias)
- [ ] Lista de ultimas contratacoes com tempo individual
- [ ] Destaque para processos acima do prazo
- [ ] Tendencia de evolucao temporal

---

### US-DASH-005: Ver Status Operacional da Semana

**Como** coordenador,
**Quero** ver o status operacional dos proximos 7 dias,
**Para** me preparar para a semana e evitar surpresas.

**Criterios de Aceite:**
- [ ] Entrevistas agendadas para a semana
- [ ] Novos curriculos recebidos
- [ ] Alerta se semana estiver com poucas entrevistas
- [ ] Atalho para agendar mais entrevistas

---

## Requirements

### REQ-DASH-001: Atualizacao Periodica

Os dashboards devem ser atualizados automaticamente a cada 6 horas.

**Regras:**
- Sincronizacao com PrimeCare API a cada 6h
- Usuario pode forcar atualizacao manual
- Exibir timestamp da ultima atualizacao
- Alertar se dados estiverem desatualizados (>12h)

---

### REQ-DASH-002: Filtros por Periodo

Usuario deve poder filtrar dados por diferentes periodos.

**Regras:**
- Opcoes: hoje, ultimos 7 dias, ultimos 30 dias, mes atual, custom
- Filtro aplica a todos os indicadores da pagina
- Manter filtro selecionado durante sessao
- Permitir comparacao entre dois periodos

---

### REQ-DASH-003: Exportacao de Dados

Usuario deve poder exportar dados dos dashboards.

**Regras:**
- Formato CSV para dados tabulares
- Formato PNG para graficos
- Respeitar filtros aplicados na exportacao
- Registrar exportacao em log de auditoria

---

### REQ-DASH-004: Alertas Inteligentes

Sistema deve identificar anomalias e gerar alertas.

**Regras:**
- Classificar por criticidade: vermelho (critico), amarelo (atencao), azul (info)
- Cada alerta inclui: descricao, impacto, recomendacao de acao
- Alertas persistem ate serem resolvidos ou dispensados
- Notificar responsavel quando alerta critico for gerado

**Refs:** REQ-NOTIFY-001

---

### REQ-DASH-005: Responsividade

Dashboards devem funcionar em desktop e mobile.

**Regras:**
- Layout adaptavel para diferentes tamanhos de tela
- Graficos redimensionaveis
- Navegacao touch-friendly em mobile
- PWA instalavel no celular

---

### REQ-DASH-006: Controle de Acesso

Dashboards devem respeitar permissoes do usuario.

**Regras:**
- Usuarios so veem metricas que tem permissao
- Escopo `own` filtra dados do proprio usuario
- Administradores veem todos os dados
- Log de acesso a dashboards

**Refs:** DES-AUTH-007

---

### REQ-DASH-007: Performance de Carregamento

Dashboards devem carregar em tempo aceitavel.

**Regras:**
- Tempo de carregamento inicial < 3 segundos
- Indicadores de loading durante carregamento
- Cache de dados frequentes
- Lazy loading para graficos abaixo da dobra

---

### REQ-DASH-008: Melhores Horarios para Entrevistas

Exibir analise de no-show por horario.

**Regras:**
- Grafico com taxa de no-show por faixa horaria
- Recomendacao de melhores horarios
- Comparacao manha vs tarde
- Dados baseados em historico de pelo menos 30 dias

---

## Design

### DES-DASH-001: Dashboard Layout System

Sistema de layout baseado em grid responsivo.

**Implementacao:**
- CSS Grid com areas nomeadas
- Cards colapsaveis para cada secao
- Sidebar com filtros globais
- Header com periodo selecionado e botao de atualizacao

**Trade-offs:**
- Grid system pode ser complexo
- Mas flexibilidade para reorganizar layout

---

### DES-DASH-002: Chart Library

Biblioteca de visualizacao de dados.

**Implementacao:**
- Recharts ou Tremor para graficos React
- Tipos: linha, barra, area, pizza, velocimetro
- Cores consistentes com design system
- Tooltip interativo com detalhes

**Trade-offs:**
- Dependencia de biblioteca terceira
- Mas acelera desenvolvimento e garante qualidade visual

---

### DES-DASH-003: Data Aggregation Layer

Camada de agregacao de dados para dashboards.

**Implementacao:**
- Queries pre-agregadas no PostgreSQL Analytics
- Materialized views para metricas complexas
- Cache em Redis para queries frequentes
- API endpoint dedicado: `GET /api/dashboard/{type}`

**Trade-offs:**
- Dados podem ter atraso (D-1)
- Mas queries rapidas mesmo com grande volume

**Depends:** DES-DATA-003

---

### DES-DASH-004: Real-time Updates

Atualizacoes em tempo real para metricas criticas.

**Implementacao:**
- WebSocket via Socket.io para push de atualizacoes
- Evento `dashboard:update` quando metricas mudam
- Indicador visual de "dados atualizados"
- Fallback para polling se WebSocket indisponivel

**Trade-offs:**
- Complexidade de manter conexao WebSocket
- Mas UX superior com dados sempre atualizados

---

### DES-DASH-005: Alert Detection Engine

Motor de deteccao de alertas.

**Implementacao:**
- Worker agent que roda a cada sync de dados
- Regras configuráveis por tipo de metrica
- Thresholds definidos em banco de dados
- Alertas persistidos com status (ativo, resolvido, dispensado)

**Trade-offs:**
- Regras podem gerar falsos positivos
- Mas captura problemas antes que escalem

---

### DES-DASH-006: Dashboard Permissions

Permissoes granulares para dashboards.

**Implementacao:**
- Permissao por tipo de dashboard: `dashboard.{tipo}:read`
- Permissao para exportar: `dashboard.{tipo}:export`
- Escopo para filtrar dados: `null` ou `own`
- UI esconde dashboards sem permissao

**Trade-offs:**
- Matriz de permissoes pode ficar complexa
- Mas controle fino sobre acesso a informacoes

**Depends:** DES-AUTH-007

---

## Dependencias

**Libs:**
- `recharts` ou `@tremor/react` - Graficos
- `socket.io-client` - WebSocket client

**Infraestrutura:**
- PostgreSQL Analytics (dados agregados)
- Redis (cache)
- Socket.io (real-time)

**Depends:**
- DES-AUTH-001 (autenticacao)
- DES-DATA-003 (analytics database)
- DES-NOTIFY-001 (alertas)
