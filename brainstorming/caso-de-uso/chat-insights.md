# Feature: Chat Insights

Chat que responde perguntas sobre dados operacionais e gera analises em linguagem natural.

**Prefixo:** CHAT

---

## User Stories

### US-CHAT-001: Fazer Pergunta em Linguagem Natural

**Como** membro da equipe,
**Quero** fazer perguntas sobre dados operacionais em linguagem natural,
**Para** obter analises sem precisar de conhecimento tecnico.

**Criterios de Aceite:**
- [ ] Campo de texto para digitar pergunta
- [ ] Resposta em linguagem natural com dados de suporte
- [ ] Tempo de resposta < 10 segundos para perguntas simples
- [ ] Sugestoes de perguntas relacionadas

---

### US-CHAT-002: Ver Insights Proativos

**Como** coordenador,
**Quero** receber perguntas estrategicas geradas automaticamente,
**Para** nao perder problemas ou oportunidades importantes.

**Criterios de Aceite:**
- [ ] 3-5 perguntas estrategicas exibidas ao acessar o chat
- [ ] Perguntas baseadas em anomalias e tendencias detectadas
- [ ] Ranqueadas por relevancia
- [ ] Clicar na pergunta inicia conversa com resposta

---

### US-CHAT-003: Visualizar Graficos na Resposta

**Como** usuario,
**Quero** ver graficos junto com as respostas,
**Para** entender melhor os dados apresentados.

**Criterios de Aceite:**
- [ ] Graficos gerados dinamicamente quando relevante
- [ ] Tipos: linha, barra, pizza
- [ ] Possibilidade de expandir grafico
- [ ] Exportar grafico como PNG

---

### US-CHAT-004: Continuar Conversa com Contexto

**Como** usuario,
**Quero** fazer perguntas de acompanhamento,
**Para** aprofundar a analise sem repetir contexto.

**Criterios de Aceite:**
- [ ] Chat mantem contexto da conversa
- [ ] Posso referenciar dados da resposta anterior
- [ ] Historico da sessao visivel na lateral
- [ ] Posso iniciar nova conversa a qualquer momento

---

## Requirements

### REQ-CHAT-001: Tipos de Perguntas Suportadas

O chat deve suportar cinco categorias de perguntas.

**Regras:**
1. **Diagnostico:** Investigar causas ("Por que a taxa de contratacoes caiu?")
2. **Comparacao:** Comparar periodos, canais, segmentos ("Instagram vs Facebook")
3. **Exploracao:** Descobrir correlacoes ("Experiencia influencia permanencia?")
4. **Predicao:** Projecoes baseadas em historico ("Quantos candidatos para a meta?")
5. **Recomendacao:** Sugestoes de acao ("Como reduzir tempo de contratacao?")

---

### REQ-CHAT-002: Processo de Analise

Assistente deve seguir processo estruturado para responder.

**Regras:**
1. Interpretar pergunta e extrair intencao
2. Definir ferramentas e dados necessarios
3. Coletar dados historicos e atuais
4. Calcular estatisticas (medias, taxas, totais)
5. Comparar periodos e segmentos
6. Encontrar correlacoes e padroes
7. Gerar visualizacoes quando aplicavel
8. Redigir resposta com contexto, dados, insights e recomendacoes
9. Apresentar em linguagem clara

---

### REQ-CHAT-003: Modo Proativo

Agente estrategista deve rodar diariamente.

**Regras:**
- Executa as 8h ou quando indicador cruza threshold
- Analisa todos os indicadores vs historico
- Identifica anomalias e tendencias
- Formula 3-5 perguntas estrategicas
- Ranqueia por relevancia para a operacao
- Armazena para exibicao no chat

---

### REQ-CHAT-004: Modo Reativo

Chat disponivel 24h para perguntas ad-hoc.

**Regras:**
- Botao flutuante acessivel de qualquer pagina
- Conversas salvas por sessao
- Exportar conversa em PDF ou texto
- Sem limite de perguntas por usuario

---

### REQ-CHAT-005: Fontes de Dados

Chat deve ter acesso a dados operacionais.

**Regras:**
- Dados de candidatos (curriculos, entrevistas, contratacoes)
- Dados de guardioes (ponto, aderencia, desempenho)
- Dados de relatorios (enviados, aprovados, rejeitados)
- Metricas financeiras (faturamento, inadimplencia)
- Respeitar permissoes do usuario para cada fonte

---

### REQ-CHAT-006: Qualidade das Respostas

Respostas devem seguir padrao de qualidade.

**Regras:**
- Incluir dados de suporte para afirmacoes
- Citar periodo dos dados utilizados
- Explicar metodologia quando relevante
- Indicar limitacoes ou incertezas
- Sugerir acoes concretas quando aplicavel

---

### REQ-CHAT-007: Limites de Seguranca

Chat deve respeitar limites de seguranca.

**Regras:**
- Nao expor dados de outros usuarios sem permissao
- Nao executar actions destrutivas automaticamente
- Log de todas as perguntas e respostas
- Rate limit de queries ao banco (proteger performance)

---

### REQ-CHAT-008: Sugestoes de Perguntas

Interface deve sugerir perguntas para orientar usuario.

**Regras:**
- Exibir sugestoes na tela inicial do chat
- Sugestoes contextuais baseadas em pagina atual
- Exemplos por categoria (diagnostico, comparacao, etc)
- Clicar na sugestao preenche campo de pergunta

---

## Design

### DES-CHAT-001: Dual Agent Architecture

Dois agentes para modo proativo e reativo.

**Implementacao:**
- **Agente Estrategista:** Worker que roda diariamente, analisa indicadores, gera perguntas
- **Assistente Analista:** Copilot que responde perguntas do usuario em tempo real
- Ambos compartilham tools de consulta a dados
- Estrategista alimenta cache de insights para Analista

**Trade-offs:**
- Dois agentes para manter
- Mas separacao clara de responsabilidades

**Refs:** DES-AGENT-002, DES-AGENT-004

---

### DES-CHAT-002: Tool Set for Analysis

Ferramentas disponiveis para os agentes.

**Implementacao:**
- `query_database`: Consulta dados agregados
- `calculate_statistics`: Medias, desvios, percentis
- `compare_periods`: Comparacao temporal
- `find_correlations`: Analise de correlacao
- `generate_chart`: Cria visualizacao
- `run_simulation`: Simula cenarios
- `search_records`: Busca registros especificos

**Trade-offs:**
- Muitas tools para LLM escolher
- Mas flexibilidade para diversos tipos de analise

---

### DES-CHAT-003: Response Streaming

Streaming de respostas para UX responsiva.

**Implementacao:**
- Server-Sent Events para envio incremental
- Texto aparece conforme gerado
- Graficos carregam ao final
- Indicador de "pensando" enquanto processa

**Trade-offs:**
- Complexidade de streaming
- Mas UX muito superior a esperar resposta completa

---

### DES-CHAT-004: Context Management

Gerenciamento de contexto da conversa.

**Implementacao:**
- Historico de mensagens mantido em Redis
- TTL de 1 hora por sessao
- Maximo de 10 mensagens de contexto
- Sumarizacao automatica se exceder limite

**Trade-offs:**
- Contexto limitado pode perder informacao
- Mas evita custo excessivo de tokens

---

### DES-CHAT-005: Insight Cache

Cache de insights proativos.

**Implementacao:**
- Insights gerados pelo Estrategista salvos em Redis
- TTL de 24 horas
- Atualizados quando Estrategista roda
- Exibidos na UI do chat

**Trade-offs:**
- Insights podem ficar desatualizados
- Mas evita reprocessamento a cada acesso

---

### DES-CHAT-006: Chart Generation

Geracao dinamica de graficos.

**Implementacao:**
- Tool retorna especificacao JSON do grafico
- Frontend renderiza com Recharts/Tremor
- Tipos: line, bar, pie, area
- Dados limitados a 100 pontos por grafico

**Trade-offs:**
- Graficos gerados podem nao ser perfeitos
- Mas automatiza visualizacao sem intervencao humana

---

### DES-CHAT-007: Permission-Aware Queries

Queries respeitam permissoes do usuario.

**Implementacao:**
- Contexto do agente inclui permissoes do usuario
- Tools filtram dados baseado em escopo
- Escopo `own` limita a dados do proprio usuario
- Erro claro se usuario pede dados sem permissao

**Trade-offs:**
- Verificacao em cada query
- Mas seguranca garantida

**Depends:** DES-AUTH-007

---

### DES-CHAT-008: Conversation Export

Exportacao de conversas.

**Implementacao:**
- Botao "Exportar" na interface do chat
- Formatos: PDF (formatado) e TXT (plain text)
- Inclui perguntas, respostas e graficos
- Metadados: usuario, data, sessao

**Trade-offs:**
- Geracao de PDF pode ser lenta
- Mas util para compartilhar analises

---

### DES-CHAT-009: Question Suggestions Engine

Motor de sugestoes de perguntas.

**Implementacao:**
- Sugestoes estaticas por categoria (cadastradas)
- Sugestoes dinamicas baseadas em pagina atual
- Sugestoes do Estrategista (insights proativos)
- Rotacao de sugestoes para evitar repeticao

**Trade-offs:**
- Sugestoes podem nao ser relevantes
- Mas orientam usuarios novos

---

### DES-CHAT-010: Analytics Logging

Log de uso do chat para melhorias.

**Implementacao:**
- Log de perguntas (sem dados sensiveis)
- Metricas: tempo de resposta, satisfacao (thumbs)
- Perguntas sem resposta satisfatoria para review
- Dashboard de analytics do chat para admins

**Trade-offs:**
- Storage adicional para logs
- Mas essencial para melhorar qualidade

---

## Dependencias

**Libs:**
- `@langchain/langgraph` - Orquestracao
- `recharts` ou `@tremor/react` - Graficos

**Infraestrutura:**
- Redis (cache, contexto)
- PostgreSQL Analytics (dados)
- Ollama/OpenRouter (LLM)

**Depends:**
- DES-AGENT-004 (Copilot)
- DES-AGENT-005 (Worker)
- DES-DATA-003 (Analytics DB)
- DES-AUTH-007 (Permissoes)
