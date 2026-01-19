# Feature: Interview Memory

Gravacao, transcricao e analise automatica de entrevistas de candidatos.

**Prefixo:** MEMORY

---

## User Stories

### US-MEMORY-001: Autorizar Gravacao

**Como** candidato,
**Quero** autorizar ou negar a gravacao da minha entrevista,
**Para** ter controle sobre meus dados.

**Criterios de Aceite:**
- [ ] Bot solicita autorizacao antes da entrevista
- [ ] Candidato responde "Sim" ou "Nao"
- [ ] Se negar, entrevista ocorre sem gravacao
- [ ] Consentimento registrado com timestamp

---

### US-MEMORY-002: Conduzir Entrevista sem Anotacoes

**Como** entrevistador,
**Quero** me dedicar a conversa sem anotar detalhes,
**Para** ter interacao mais natural com o candidato.

**Criterios de Aceite:**
- [ ] Gravacao automatica se autorizada
- [ ] Entrevistador focado apenas na conversa
- [ ] Dados extraidos automaticamente apos entrevista

---

### US-MEMORY-003: Consultar Analise da Entrevista

**Como** recrutador,
**Quero** ver a analise estruturada da entrevista,
**Para** tomar decisao embasada sobre o candidato.

**Criterios de Aceite:**
- [ ] 8 categorias de dados extraidas
- [ ] Resumo textual para consulta rapida
- [ ] Trechos da gravacao marcados
- [ ] Dados salvos no perfil do candidato

---

### US-MEMORY-004: Solicitar Exclusao de Gravacao

**Como** candidato,
**Quero** solicitar exclusao da minha gravacao,
**Para** exercer meu direito de privacidade.

**Criterios de Aceite:**
- [ ] Canal para solicitar exclusao (WhatsApp)
- [ ] Atendimento em ate 48h
- [ ] Confirmacao de exclusao
- [ ] Dados extraidos podem ser mantidos (anonimizados)

---

## Requirements

### REQ-MEMORY-001: Oito Categorias de Extracao

IA deve extrair oito categorias de informacao da entrevista.

**Regras:**
1. Experiencia e qualificacao
2. Caracteristicas comportamentais (soft skills)
3. Disponibilidade real
4. Motivacao e expectativas
5. Formacao e certificados
6. Historico profissional
7. Sinais de alerta (red flags)
8. Destaques positivos (green flags)

---

### REQ-MEMORY-002: Tempo de Processamento

Analise deve estar disponivel em tempo aceitavel.

**Regras:**
- Transcricao + analise em ate 30 minutos
- Notificacao a equipe quando concluido
- Status visivel no perfil do candidato

---

### REQ-MEMORY-003: Consentimento LGPD

Gravacao requer consentimento expresso do candidato.

**Regras:**
- Solicitacao clara e explicita
- Registro de resposta com timestamp
- Sem gravacao se negado
- Possibilidade de revogar a qualquer momento

**Refs:** DES-LGPD-003

---

### REQ-MEMORY-004: Retencao de Gravacoes

Gravacoes devem ter prazo de retencao definido.

**Regras:**
- Maximo 30 dias apos decisao de contratacao
- Exclusao automatica apos prazo
- Exclusao manual a pedido do candidato (48h)
- Dados extraidos podem ser mantidos separadamente

**Refs:** DES-LGPD-004

---

### REQ-MEMORY-005: Integracao com Matching

Dados extraidos devem alimentar algoritmo de matching.

**Regras:**
- Soft skills disponiveis para score de match
- Experiencia especifica (Alzheimer, acamado) para filtros
- Red flags considerados na priorizacao
- Green flags aumentam score

**Refs:** DES-SCORE-002

---

## Design

### DES-MEMORY-001: Recording Architecture

Arquitetura de gravacao de entrevistas.

**Implementacao:**
- Integracao com Google Meet ou similar
- Gravacao automatica quando consentimento dado
- Armazenamento temporario em storage seguro
- Criptografia em transito e repouso

**Trade-offs:**
- Dependencia de servico de videoconferencia
- Mas qualidade de audio superior

---

### DES-MEMORY-002: Transcription Pipeline

Pipeline de transcricao de audio.

**Implementacao:**
- Whisper (OpenAI) ou similar para transcricao
- Suporte a portugues brasileiro
- Identificacao de falantes (diarizacao)
- Timestamp por segmento de fala

**Trade-offs:**
- Custo por minuto de audio
- Mas precisao muito superior a alternativas

---

### DES-MEMORY-003: Information Extraction Agent

Agente de extracao de informacoes.

**Implementacao:**
- LLM analisa transcricao completa
- Prompt estruturado para extrair 8 categorias
- Formato de saida JSON estruturado
- Validacao de completude antes de salvar

**Trade-offs:**
- Custo de tokens (transcricoes longas)
- Mas extracao muito mais completa que manual

---

### DES-MEMORY-004: Candidate Profile Integration

Integracao com perfil do candidato.

**Implementacao:**
- Dados extraidos salvos no PostgreSQL
- Vinculados ao candidato por ID
- Versionamento se multiplas entrevistas
- Indices para busca por habilidades/experiencia

**Trade-offs:**
- Estrutura de dados complexa
- Mas possibilita buscas avancadas

---

### DES-MEMORY-005: Highlight Markers

Sistema de marcacao de trechos relevantes.

**Implementacao:**
- LLM identifica trechos importantes durante extracao
- Salva timestamp de inicio e fim
- Player permite pular para trecho
- Categorias: red flag, green flag, experiencia relevante

**Trade-offs:**
- Armazenar gravacao por mais tempo
- Mas demonstracoes futuras facilitadas

---

## Dependencias

**Fontes:** brainstorming/Memória de Entrevista.md

**Libs:**
- OpenAI Whisper - Transcricao
- Google Meet API ou similar - Gravacao

**Depends:**
- DES-LGPD-003 (consentimento)
- DES-LGPD-004 (retencao)
- DES-SCORE-002 (matching)
- DES-RECRUIT-001 (bot WhatsApp)
