# Feature: Notification Escalation

Padrao de escalacao quando notificacoes nao sao respondidas.

**Prefixo:** ESCAL

---

## Design

### DES-ESCAL-001: Escalation Tiers

Niveis de escalacao baseados em tempo sem resposta.

**Implementacao:**
- **Tier 0 (0-15min):** Notificacao original, aguarda resposta
- **Tier 1 (15min):** Reenvio da notificacao com tom mais urgente
- **Tier 2 (30min):** Notificar supervisor direto
- **Tier 3 (1h):** Notificar gestor da area
- **Tier 4 (2h+):** Alerta critico para diretoria + registro de incidente

**Trade-offs:**
- Escalacao muito rapida pode gerar ruido
- Mas garante que problemas criticos nao sejam ignorados

**Refs:** brainstorming/Plataforma de Gestão.md, REQ-NOTIFY-005

---

### DES-ESCAL-002: Priority-Based Escalation Speed

Velocidade de escalacao baseada na prioridade.

**Implementacao:**
| Prioridade | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|------------|--------|--------|--------|--------|
| Critica    | 5min   | 15min  | 30min  | 1h     |
| Media      | 15min  | 30min  | 1h     | 2h     |
| Baixa      | 30min  | 1h     | 2h     | N/A    |

- Notificacoes de baixa prioridade nao escalam alem do Tier 3
- Prioridade critica tem janelas mais curtas

**Trade-offs:**
- Configuracao complexa de multiplas janelas
- Mas tratamento adequado por urgencia

---

### DES-ESCAL-003: Escalation Chain Configuration

Cadeia de escalacao configuravel por tipo de notificacao.

**Implementacao:**
- Tabela `escalation_chains`:
  - `notification_type`: tipo (ponto, relatorio, candidato, etc)
  - `tier`: nivel de escalacao
  - `delay_minutes`: tempo ate este tier
  - `target_role`: papel a notificar (supervisor, gestor, diretor)
  - `channel`: canal preferencial (push, whatsapp, email, telefone)
- Cada tipo pode ter cadeia diferente
- Administradores configuram via interface

**Trade-offs:**
- Muitas configuracoes para gerenciar
- Mas flexibilidade total por tipo de situacao

---

### DES-ESCAL-004: Reminder Scheduling

Sistema de lembretes preventivos e corretivos.

**Implementacao:**
- **Lembrete preventivo:** X minutos ANTES do prazo
  - Guardioes amarelo/vermelho: 15min antes
  - Entrevistas: 24h, 4h, 1h, 15min antes
- **Lembrete corretivo:** Apos prazo expirar sem acao
  - Tom mais urgente que preventivo
  - Inclui consequencias se nao agir
- Agendamento via cron jobs ou filas Redis

**Trade-offs:**
- Muitos lembretes podem irritar usuario
- Mas reduzem significativamente no-show e falhas

**Refs:** brainstorming/Assistente de Expectativas.md

---

### DES-ESCAL-005: Message Tone Escalation

Tom das mensagens progressivamente mais urgente.

**Implementacao:**
- **Tom 1 (normal):** "Lembrete: sua entrada deve ser registrada as 7h"
- **Tom 2 (atencao):** "Ainda nao registramos sua entrada. Por favor, bata o ponto agora"
- **Tom 3 (urgente):** "ATENCAO: Se nao registrar em 15min, perdera pontos do premio"
- **Tom 4 (critico):** "URGENTE: Falta de registro reportada a gestao. Entre em contato imediatamente"
- Templates por tom armazenados em banco

**Trade-offs:**
- Mensagens muito agressivas podem desmotivar
- Mas clareza sobre consequencias aumenta adesao

---

### DES-ESCAL-006: Escalation Halt Conditions

Condicoes que interrompem a escalacao.

**Implementacao:**
- Notificacao marcada como lida
- Acao executada (ponto batido, aprovacao feita)
- Excecao registrada e aprovada
- Usuario marcou como "nao aplicavel"
- Horario de nao perturbar ativo (pausa, nao cancela)
- Limite maximo de escalacoes atingido

**Trade-offs:**
- Muitas condicoes de parada podem deixar gaps
- Mas evita escalacoes desnecessarias

---

## Dependencias

**Depends:**
- DES-NOTIFY-001 (sistema de notificacoes)
- DES-AGENT-005 (workers para monitoramento)
- DES-SCORE-003 (classificacao de guardioes)
