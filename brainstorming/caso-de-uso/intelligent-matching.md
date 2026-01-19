# Feature: Intelligent Matching

Matching inteligente candidato-assistido com score ponderado e top 5 resultados.

**Prefixo:** MATCH

---

## User Stories

### US-MATCH-001: Solicitar Match

**Como** responsavel pelo atendimento,
**Quero** solicitar candidatos para um assistido via formulario,
**Para** encontrar o cuidador ideal rapidamente.

**Criterios de Aceite:**
- [ ] Formulario com dados do assistido
- [ ] Confirmacao de recebimento
- [ ] Informacao de tempo estimado (2-5 min)
- [ ] Notificacao quando match pronto

---

### US-MATCH-002: Ver Top 5 Candidatos

**Como** responsavel pelo atendimento,
**Quero** ver os 5 melhores candidatos ordenados por score,
**Para** escolher o mais adequado.

**Criterios de Aceite:**
- [ ] Lista com 5 candidatos
- [ ] Score percentual para cada um
- [ ] Resumo de experiencia
- [ ] Pontos fortes e de atencao

---

### US-MATCH-003: Acionar Candidato

**Como** responsavel pelo atendimento,
**Quero** contatar o candidato escolhido imediatamente,
**Para** agilizar a contratacao.

**Criterios de Aceite:**
- [ ] Botao "Acionar" no cartao do candidato
- [ ] Mensagem automatica via WhatsApp
- [ ] Registro de acionamento no sistema
- [ ] Status atualizado para "em contato"

---

### US-MATCH-004: Ver Curriculo Completo

**Como** responsavel pelo atendimento,
**Quero** ver o curriculo completo do candidato,
**Para** validar informacoes antes de acionar.

**Criterios de Aceite:**
- [ ] Botao "Ver Curriculo" no cartao
- [ ] Modal com dados completos
- [ ] Dados da Memoria de Entrevista (se disponivel)
- [ ] Historico de matches anteriores

---

### US-MATCH-005: Solicitar Multiplos Matches

**Como** responsavel pelo atendimento,
**Quero** solicitar matches para varios assistidos de uma vez,
**Para** otimizar meu tempo.

**Criterios de Aceite:**
- [ ] Formulario aceita multiplos assistidos
- [ ] Processamento paralelo
- [ ] Resultados separados por assistido
- [ ] Notificacao consolidada quando todos prontos

---

## Requirements

### REQ-MATCH-001: Criterios de Score

Score deve ser calculado com pesos definidos.

**Regras:**
- Experiencia relevante: 30%
- Proximidade geografica: 20%
- Disponibilidade: 15%
- Habilidades tecnicas: 15%
- Historico de sucesso: 10%
- Soft skills: 10%

**Refs:** DES-SCORE-002

---

### REQ-MATCH-002: Filtros Eliminatorios

Candidatos devem ser filtrados antes do calculo de score.

**Regras:**
- Disponibilidade incompativel: eliminado
- Restricao medica conflitante: eliminado
- Distancia > 30km: eliminado (configuravel)
- Red flags criticos: eliminado ou penalizado

---

### REQ-MATCH-003: Tempo de Processamento

Match deve ser processado em tempo aceitavel.

**Regras:**
- Tempo maximo: 5 minutos
- Notificacao ao usuario quando pronto
- Exibir progresso se demorar mais que 1 min
- Timeout com mensagem de erro se exceder

---

### REQ-MATCH-004: Explicacao do Score

Cada score deve ter explicacao textual.

**Regras:**
- Resumo dos pontos fortes
- Pontos de atencao
- Justificativa para posicao no ranking
- Linguagem clara para nao-tecnicos

**Refs:** DES-SCORE-005

---

### REQ-MATCH-005: Historico de Matches

Sistema deve manter historico de matches.

**Regras:**
- Registrar cada solicitacao e resultado
- Feedback do responsavel (qual candidato escolheu)
- Metricas: taxa de aceitacao do #1, tempo ate contratacao
- Dados para melhorar algoritmo

---

### REQ-MATCH-006: Integracao com Memoria de Entrevista

Soft skills devem vir da Memoria de Entrevista.

**Regras:**
- Se candidato tem entrevista gravada, usar dados extraidos
- Se nao tem, usar dados do formulario de cadastro
- Peso de soft skills menor se dados incompletos

**Refs:** DES-MEMORY-001

---

## Design

### DES-MATCH-001: Match Request Flow

Fluxo de solicitacao de match.

**Implementacao:**
- Formulario coleta: assistido, idade, regiao, condicao, necessidades, escala, data inicio
- Cria job na fila Redis
- Retorna ID da solicitacao
- Worker processa assincronamente
- Notifica via WebSocket e WhatsApp quando pronto

**Trade-offs:**
- Processamento assincrono adiciona complexidade
- Mas necessario para volumes grandes de curriculos

---

### DES-MATCH-002: Candidate Filtering

Filtragem de candidatos.

**Implementacao:**
- Query inicial filtra por criterios eliminatorios
- Indice geografico para proximidade (PostGIS ou similar)
- Resultado: pool de candidatos elegiveis
- Log de quantos eliminados por criterio

**Trade-offs:**
- Filtros muito restritivos podem eliminar bons candidatos
- Mas reduz universo para score detalhado

---

### DES-MATCH-003: Score Calculation

Calculo de score para cada candidato.

**Implementacao:**
- Busca dados de cada candidato elegivel
- Calcula sub-scores por criterio
- Aplica pesos configuraveis
- Ordena por score final
- Retorna top 5

**Trade-offs:**
- Calcular para todos pode ser lento
- Mas precisao superior a amostragem

**Refs:** DES-SCORE-002

---

### DES-MATCH-004: Results Card Component

Componente de cartao de resultado.

**Implementacao:**
- Score percentual destacado
- Foto (se disponivel) ou avatar
- Nome, regiao, experiencia resumida
- Lista de pontos fortes (3-5)
- Lista de pontos de atencao (1-3)
- Botoes: "Ver Curriculo", "Acionar"

**Trade-offs:**
- Informacao condensada pode omitir detalhes
- Mas visao rapida para decisao inicial

---

### DES-MATCH-005: Contact Action

Acao de contatar candidato.

**Implementacao:**
- Ao clicar "Acionar", envia mensagem WhatsApp
- Template: "Ola [nome], temos uma oportunidade de trabalho..."
- Registra acionamento com timestamp
- Atualiza status do match para "em contato"
- Notifica responsavel se candidato responder

**Trade-offs:**
- Mensagem automatica pode parecer impessoal
- Mas agiliza significativamente o processo

---

## Dependencias

**Fontes:** brainstorming/Matching Inteligente Candidato-Assistido.md

**Depends:**
- DES-SCORE-002 (score de match)
- DES-MEMORY-001 (soft skills)
- DES-PRIME-001 (dados de curriculos)
- DES-NOTIFY-001 (notificacoes)
- DES-RECRUIT-001 (WhatsApp)
