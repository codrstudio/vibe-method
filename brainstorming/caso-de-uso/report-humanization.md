# Feature: Report Humanization

Humanizacao de relatorios de plantao com duas IAs: mensagem para familia e PDF tecnico.

**Prefixo:** REPORT

---

## User Stories

### US-REPORT-001: Receber Relatorio Humanizado

**Como** familiar de assistido,
**Quero** receber mensagem acolhedora sobre o dia do meu ente querido,
**Para** me sentir informado e tranquilo.

**Criterios de Aceite:**
- [ ] Texto de 1-2 paragrafos
- [ ] Tom empatico e acolhedor
- [ ] Informacoes claras sobre atividades do dia
- [ ] Alertas suaves quando necessario

---

### US-REPORT-002: Receber Relatorio Tecnico

**Como** gestor de operacoes,
**Quero** relatorio tecnico estruturado em PDF,
**Para** ter documentacao formal para auditoria.

**Criterios de Aceite:**
- [ ] PDF com secoes padronizadas
- [ ] Tabela de avaliacao clinica
- [ ] Campos obrigatorios preenchidos
- [ ] Alertas destacados

---

### US-REPORT-003: Revisar Relatorio Rejeitado

**Como** responsavel pela revisao,
**Quero** editar relatorios que a IA rejeitou duas vezes,
**Para** garantir envio dentro do prazo.

**Criterios de Aceite:**
- [ ] Notificacao quando relatorio precisa revisao
- [ ] Editor para corrigir texto
- [ ] Prazo de 30 minutos para revisao
- [ ] Fallback para PDF tecnico se nao revisar

---

### US-REPORT-004: Receber Alerta de Padrao Detectado

**Como** responsavel pelo assistido,
**Quero** ser alertado quando IA detectar mudanca de padrao,
**Para** tomar providencias preventivas.

**Criterios de Aceite:**
- [ ] Deteccao de padroes em relatorios sucessivos
- [ ] Alerta para: recusa de alimentacao, quedas, febre, humor alterado
- [ ] Notificacao via WhatsApp ou dashboard
- [ ] Recomendacao de acao

---

## Requirements

### REQ-REPORT-001: Dois Agentes de IA

Sistema deve usar dois agentes para processar cada relatorio.

**Regras:**
- **Agente Gerador:** Reescreve texto humanizado + gera PDF tecnico
- **Agente Validador:** Verifica completude, fidelidade, gramatica, tom
- Se validador rejeitar, gerador reescreve (ate 2x automatico)
- Se 2 rejeicoes, escala para humano

---

### REQ-REPORT-002: Personalizacao por Contexto

Mensagem deve ser ajustada conforme contexto do dia.

**Regras:**
- **Dia normal:** Tom leve e alegre
- **Dia de observacao:** Linguagem mais tecnica
- **Dia especial:** Mensagem comemorativa (aniversario, passeio)
- **Dia com incidente:** Tom cuidadoso, descreve evento e providencias

---

### REQ-REPORT-003: Horarios de Envio

Relatorios devem ser enviados em horarios padrao.

**Regras:**
- Turno diurno: 12h-13h
- Turno noturno: 18h-19h
- Plantao 24h: primeiro as 12h, segundo as 20h
- Se familia nao ler, enviar lembrete

---

### REQ-REPORT-004: Fluxo de Nove Etapas

Processamento deve seguir fluxo estruturado.

**Regras:**
1. Criacao do relatorio original (PrimeCare)
2. Envio para Agente Gerador
3. Validacao pelo Agente Validador
4. Reenvio automatico se rejeitado
5. Intervencao humana se 2 rejeicoes (30min)
6. Fallback para PDF tecnico se ninguem revisar
7. Envio via canal preferido
8. Confirmacao de leitura
9. Registro e metricas

---

### REQ-REPORT-005: Metricas de Qualidade

Sistema deve rastrear metricas de processamento.

**Regras:**
- Taxa de aprovacao automatica (meta: >94%)
- Tempo medio de processamento
- Numero de rejeicoes por tipo de erro
- Reclamacoes de familias (meta: <5%)

---

### REQ-REPORT-006: Deteccao de Padroes

Sistema deve detectar mudancas de comportamento.

**Regras:**
- Analisar relatorios sucessivos (ultimos 7 dias)
- Detectar: recusa alimentacao, quedas, febre, troca medicamento, humor alterado
- Gerar alerta com recomendacao de acao
- Enviar via WhatsApp, email ou dashboard

---

## Design

### DES-REPORT-001: Dual Agent Architecture

Arquitetura com dois agentes de IA.

**Implementacao:**
- **Writer Agent:** Recebe relatorio original + contexto (assistido, condicoes, ultimo atendimento)
  - Output 1: Mensagem humanizada (1-2 paragrafos)
  - Output 2: PDF estruturado com tabela clinica
- **Reviewer Agent:** Valida outputs
  - Checa informacoes essenciais presentes
  - Verifica fidelidade ao original (nao inventou fatos)
  - Avalia gramatica, coerencia, tom
  - Retorna lista de correcoes se rejeitar

**Trade-offs:**
- Duas chamadas LLM por relatorio
- Mas qualidade muito superior

**Refs:** DES-VALID-003

---

### DES-REPORT-002: Tone Adaptation Engine

Motor de adaptacao de tom.

**Implementacao:**
- Classificador de contexto do dia (normal, observacao, especial, incidente)
- Templates de tom por classificacao
- Instrucoes especificas no prompt do Writer
- Validador verifica adequacao do tom

**Trade-offs:**
- Classificacao pode errar
- Mas mensagens muito mais apropriadas

---

### DES-REPORT-003: PDF Generation

Geracao de PDF tecnico.

**Implementacao:**
- Template HTML com campos estruturados
- Tabela de avaliacao clinica:
  - Alimentacao, hidratacao, humor, mobilidade, dor
- Secoes: data, paciente, cuidador, atividades, alertas
- Conversao HTML -> PDF (ex: puppeteer, wkhtmltopdf)
- Armazenamento em storage

**Trade-offs:**
- Geracao de PDF pode ser lenta
- Mas formato universalmente aceito

---

### DES-REPORT-004: Human Review Queue Integration

Integracao com fila de aprovacoes.

**Implementacao:**
- Relatorio rejeitado 2x vai para fila
- Tipo: "relatorio"
- Prioridade baseada em horario de envio
- Editor inline para correcoes
- Timeout de 30min para fallback

**Trade-offs:**
- Adiciona carga para revisores
- Mas garante qualidade em casos dificeis

**Depends:** DES-QUEUE-001

---

### DES-REPORT-005: Pattern Detection Worker

Worker para deteccao de padroes.

**Implementacao:**
- Analisa relatorios por assistido (janela 7 dias)
- Regras configuradas para cada tipo de padrao
- Usa LLM para analises complexas
- Gera alertas quando padrao detectado
- Roda apos cada novo relatorio processado

**Trade-offs:**
- Analise pode gerar falsos positivos
- Mas captura problemas antes de escalarem

---

## Dependencias

**Fontes:** brainstorming/Humanização de Relatórios.md

**Libs:**
- Puppeteer ou wkhtmltopdf - Geracao PDF
- OpenAI GPT-4 - Geracao e validacao

**Depends:**
- DES-PRIME-001 (dados do PrimeCare)
- DES-QUEUE-001 (fila de aprovacoes)
- DES-NOTIFY-001 (alertas)
- DES-VALID-003 (validacao de conteudo)
