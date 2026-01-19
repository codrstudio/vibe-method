# Feature: Recruitment

Recrutamento automatizado via bot WhatsApp com triagem, score e agendamento.

**Prefixo:** RECRUIT

---

## User Stories

### US-RECRUIT-001: Cadastrar Curriculo

**Como** candidato,
**Quero** enviar meus dados via formulario,
**Para** me inscrever para vaga de cuidador.

**Criterios de Aceite:**
- [ ] Formulario com nome, telefone, regiao, experiencia, habilidades
- [ ] Confirmacao de recebimento pelo bot
- [ ] Orientacao sobre proxima etapa

---

### US-RECRUIT-002: Receber Score Automatico

**Como** recrutador,
**Quero** que candidatos recebam score automaticamente,
**Para** priorizar os mais qualificados.

**Criterios de Aceite:**
- [ ] Score calculado com base em 5 criterios
- [ ] Candidatos >= 80% convidados automaticamente
- [ ] Candidatos < 80% enviados para revisao humana

---

### US-RECRUIT-003: Agendar Entrevista

**Como** candidato,
**Quero** escolher horario de entrevista dentre opcoes disponiveis,
**Para** me organizar para comparecer.

**Criterios de Aceite:**
- [ ] Bot apresenta horarios disponiveis
- [ ] Candidato escolhe horario
- [ ] Confirmacao com local/link e instrucoes

---

### US-RECRUIT-004: Receber Lembretes de Entrevista

**Como** candidato,
**Quero** receber lembretes antes da entrevista,
**Para** nao esquecer de comparecer.

**Criterios de Aceite:**
- [ ] Lembrete 24h antes
- [ ] Lembrete 4h antes
- [ ] Lembrete 1h antes
- [ ] Lembrete 15min antes
- [ ] Tom amigavel e personalizado

---

### US-RECRUIT-005: Reagendar Entrevista

**Como** candidato,
**Quero** reagendar minha entrevista se nao puder comparecer,
**Para** ter outra oportunidade.

**Criterios de Aceite:**
- [ ] Opcao de reagendar antes da entrevista
- [ ] Reagendamento automatico apos no-show
- [ ] Limite de reagendamentos (ex: 2x)

---

### US-RECRUIT-006: Receber Resultado da Entrevista

**Como** candidato,
**Quero** receber o resultado da minha entrevista,
**Para** saber os proximos passos.

**Criterios de Aceite:**
- [ ] Mensagem de aprovacao com convocacao para treinamento
- [ ] Mensagem de reprovacao com agradecimento
- [ ] Mensagem de reserva com explicacao

---

## Requirements

### REQ-RECRUIT-001: Score de Candidato

Sistema deve calcular score de confianca baseado em criterios ponderados.

**Regras:**
- Experiencia previa: 30%
- Formulario completo: 25%
- Habilidades tecnicas: 20%
- Proximidade geografica: 15%
- Coerencia: 10%
- Threshold automatico: >= 80%

**Refs:** DES-SCORE-001

---

### REQ-RECRUIT-002: Lembretes Automaticos

Sistema deve enviar lembretes em multiplos momentos antes da entrevista.

**Regras:**
- 24h, 4h, 1h e 15min antes
- Tom amigavel e personalizado
- Lembrete adicional se nao confirmar
- Via WhatsApp

---

### REQ-RECRUIT-003: Reagendamento por No-Show

Sistema deve oferecer reagendamento apos no-show.

**Regras:**
- Detectar no-show apos 15min do horario
- Enviar mensagem oferecendo novos horarios
- Registrar motivo se informado
- Maximo 2 reagendamentos por no-show

---

### REQ-RECRUIT-004: Fluxo de 12 Etapas

Processo de recrutamento deve seguir fluxo estruturado.

**Regras:**
1. Cadastro
2. Confirmacao de recebimento
3. Validacao de dados
4. Calculo de score
5. Classificacao (auto/revisao)
6. Agendamento
7. Envio de instrucoes
8. Lembretes
9. Entrevista
10. Notificacao de resultado
11. Solicitacao de feedback
12. Reagendamento (se necessario)

---

### REQ-RECRUIT-005: Revisao Humana de Score Baixo

Candidatos com score baixo devem ir para revisao humana.

**Regras:**
- Score < 80% vai para fila de aprovacoes
- Revisor pode aprovar, rejeitar ou pedir mais info
- Candidato notificado da decisao

**Refs:** REQ-QUEUE-001

---

### REQ-RECRUIT-006: Metricas de Recrutamento

Sistema deve rastrear metricas do processo.

**Regras:**
- Taxa de conversao por etapa
- Taxa de no-show
- Tempo medio de contratacao
- Performance por canal de captacao
- Disponivel em dashboard

**Refs:** DES-DASH-001

---

## Design

### DES-RECRUIT-001: WhatsApp Bot Architecture

Bot de WhatsApp para interacao com candidatos.

**Implementacao:**
- Evolution API para envio/recebimento
- Gatekeeper agent classifica mensagens
- State machine por candidato (etapa atual)
- Templates de mensagem por etapa
- Fallback para atendimento humano se necessario

**Trade-offs:**
- Dependencia de API externa (Evolution)
- Mas canal com maior engajamento

**Depends:** DES-AGENT-003, DES-PRIME-011

---

### DES-RECRUIT-002: Interview Scheduling System

Sistema de agendamento de entrevistas.

**Implementacao:**
- Integracao com agenda de entrevistadores
- Slots configuraveis por dia/hora
- Bloqueio de slot ao agendar
- Liberacao automatica se cancelar
- Notificacao de conflitos

**Trade-offs:**
- Requer gestao de disponibilidade
- Mas evita overbooking

---

### DES-RECRUIT-003: Candidate State Machine

Maquina de estados do candidato no funil.

**Implementacao:**
- Estados: cadastrado, validando, scored, agendado, confirmado, entrevistado, aprovado, reprovado, reserva, desistente
- Transicoes explicitas com validacao
- Historico de transicoes para auditoria
- Dashboard de funil baseado em estados

**Trade-offs:**
- Muitos estados para gerenciar
- Mas visibilidade total do funil

---

### DES-RECRUIT-004: Reminder Worker

Worker para envio de lembretes.

**Implementacao:**
- Cron job verifica entrevistas proximas
- Calcula quais lembretes enviar por candidato
- Envia via WhatsApp
- Marca lembrete como enviado
- Roda a cada 5 minutos

**Trade-offs:**
- Polling constante
- Mas simplicidade de implementacao

**Depends:** DES-AGENT-005

---

## Dependencias

**Fontes:** brainstorming/Recrutamento Automatizado.md

**Depends:**
- DES-SCORE-001 (score de candidato)
- DES-AGENT-003 (gatekeeper)
- DES-PRIME-011 (WhatsApp)
- DES-QUEUE-001 (fila de aprovacoes)
- DES-NOTIFY-001 (notificacoes)
