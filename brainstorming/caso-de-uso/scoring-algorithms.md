# Feature: Scoring Algorithms

Algoritmos de pontuacao padronizados para candidatos, matches e classificacao de guardioes.

**Prefixo:** SCORE

---

## Design

### DES-SCORE-001: Candidate Confidence Score

Score de confianca para triagem automatica de candidatos.

**Implementacao:**
- Score de 0-100% calculado com pesos:
  - **Experiencia previa (30%):** tempo de atuacao e tipos de casos
  - **Formulario completo (25%):** consistencia e integridade das respostas
  - **Habilidades tecnicas (20%):** medicacao, curativos, sondas, etc.
  - **Proximidade geografica (15%):** distancia ate regiao de interesse
  - **Coerencia (10%):** verificacao cruzada de informacoes
- Threshold >= 80%: convite automatico para entrevista
- Threshold < 80%: revisao humana na fila de aprovacoes

**Trade-offs:**
- Pesos fixos podem nao refletir todas situacoes
- Mas garante criterios objetivos e imparciais

**Refs:** brainstorming/Recrutamento Automatizado.md

---

### DES-SCORE-002: Match Compatibility Score

Score de adequacao candidato-assistido para matching inteligente.

**Implementacao:**
- Score de 0-100% com pesos:
  - **Experiencia relevante (30%):** tempo e casos semelhantes ao assistido
  - **Proximidade geografica (20%):** ate 3km = pontuacao maxima
  - **Disponibilidade (15%):** compatibilidade de escala e flexibilidade
  - **Habilidades tecnicas (15%):** cuidados especificos necessarios
  - **Historico de sucesso (10%):** retencao, avaliacoes, NPS
  - **Soft skills (10%):** empatia, comunicacao, paciencia (da Memoria de Entrevista)
- Retorna top 5 candidatos ordenados por score
- Inclui explicacao textual para cada score

**Trade-offs:**
- Requer dados de multiplas fontes (curriculo, entrevistas, historico)
- Mas matching muito mais preciso que selecao manual

**Refs:** brainstorming/Matching Inteligente.md
**Depends:** DES-MEMORY-001 (soft skills da entrevista)

---

### DES-SCORE-003: Guardian Classification System

Sistema de classificacao de guardioes por taxa de falhas.

**Implementacao:**
- Formula: `(falhas / oportunidades) * 100%`
- Janela de analise: ultimos 7 dias
- Classificacao por cores:
  - **Verde (0-10%):** Confiavel, sem lembrete preventivo
  - **Amarelo (11-50%):** Precisa apoio, lembretes preventivos e corretivos
  - **Vermelho (51-100%):** Alto risco, alertas fortes e notificacao gestores
- Analise separada por momento (entrada, almoco, saida)
- Reclassificacao automatica a cada 6 horas

**Trade-offs:**
- Janela de 7 dias pode ser curta para alguns casos
- Mas reflete comportamento recente e permite recuperacao rapida

**Refs:** brainstorming/Assistente de Expectativas.md

---

### DES-SCORE-004: Score Calculation Engine

Motor centralizado para calculo de scores.

**Implementacao:**
- Servico em `apps/agents/` ou `apps/backbone/`
- Interface generica: `calculateScore(type, data, weights?)`
- Tipos suportados: `candidate`, `match`, `guardian`
- Pesos configuraveis via banco de dados
- Cache de calculos recentes em Redis (TTL 1h)
- Log de cada calculo para auditoria

**Trade-offs:**
- Centralizacao pode criar gargalo
- Mas garante consistencia e facilita ajuste de pesos

---

### DES-SCORE-005: Score Explanation Generator

Geracao de explicacoes textuais para scores.

**Implementacao:**
- Para cada score, gerar texto explicativo
- Formato: pontos fortes, pontos de atencao
- Exemplo: "94% - 3 anos com pacientes acamados, mora a 2km, disponivel 24/48h. Atencao: nao dirige."
- Pode usar LLM para gerar explicacoes mais naturais
- Armazenar explicacao junto com score

**Trade-offs:**
- Custo de LLM para cada explicacao
- Mas transparencia essencial para revisores

---

### DES-SCORE-006: Threshold Configuration

Configuracao de thresholds por tipo de score.

**Implementacao:**
- Tabela `score_thresholds`:
  - `type`: candidate, match, guardian
  - `level`: auto_approve, review, reject (candidate) | green, yellow, red (guardian)
  - `min_value`, `max_value`: faixa do threshold
  - `action`: acao a tomar quando score nesta faixa
- Administradores podem ajustar via interface
- Historico de alteracoes para auditoria

**Trade-offs:**
- Thresholds mal configurados podem gerar falsos positivos/negativos
- Mas flexibilidade para ajustar conforme operacao

---

### DES-SCORE-007: Score History and Analytics

Historico de scores para analise de tendencias.

**Implementacao:**
- Armazenar cada score calculado com timestamp
- Permitir consulta de evolucao de score por entidade
- Metricas agregadas: media, distribuicao, tendencia
- Dashboard de analytics de scores para gestores
- Dados para treinar/ajustar pesos futuramente

**Trade-offs:**
- Volume de dados pode crescer rapidamente
- Mas essencial para melhoria continua dos algoritmos

---

### DES-SCORE-008: Weighted Average Calculator

Calculadora de media ponderada reutilizavel.

**Implementacao:**
```typescript
interface ScoreCriteria {
  name: string;
  value: number; // 0-100
  weight: number; // 0-1, soma = 1
}

function calculateWeightedScore(criteria: ScoreCriteria[]): number {
  return criteria.reduce((sum, c) => sum + c.value * c.weight, 0);
}
```
- Validacao: soma dos pesos deve ser 1
- Suporte a criterios eliminatorios (score 0 = elimina)
- Retorna breakdown por criterio para explicacao

**Trade-offs:**
- Media ponderada simples pode nao capturar interacoes complexas
- Mas interpretavel e ajustavel por humanos

---

## Dependencias

**Infraestrutura:**
- PostgreSQL (historico de scores, thresholds)
- Redis (cache de calculos)

**Depends:**
- DES-DATA-003 (dados para calculos)
- DES-PRIME-001 (dados do legado)
