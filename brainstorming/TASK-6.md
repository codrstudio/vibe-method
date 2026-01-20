# Iteracao 6: Producao

## Objetivo

Sistema autonomo rodando 24/7 com scheduler, metricas e alertas.

```
[Cron 12h/18h/20h] → [Pipeline completo] → [Metricas] → [Alertas]
```

**Entrega:** Sistema roda sozinho sem intervencao manual

---

## Pipeline Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SCHEDULER                                   │
│                    (12h, 18h, 20h)                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Trigger automatico
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    biz:sync-primecare                               │
│                    (Iteracao 2)                                     │
├─────────────────────────────────────────────────────────────────────┤
│   - Le relatorios do PrimeCare                                      │
│   - Insere em biz.reports com status 'pending'                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. Novos relatorios inseridos
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    biz:process-reports                              │
│                    (Iteracao 3)                                     │
├─────────────────────────────────────────────────────────────────────┤
│   - Processa pending com Writer + Reviewer                          │
│   - Retry ate 2x se rejected                                        │
│   - Status final: approved ou failed                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Relatorios processados
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    biz:notify-review                                │
│                    (Iteracao 5)                                     │
├─────────────────────────────────────────────────────────────────────┤
│   - Notifica responsavel sobre failed                               │
│   - Move para status 'review'                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. Aguarda revisao ou timeout
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    biz:review-timeout                               │
│                    (Iteracao 5 - roda a cada 5min)                  │
├─────────────────────────────────────────────────────────────────────┤
│   - Aplica fallback em reviews com timeout                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 5. Todos aprovados ou fallback
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    biz:send-reports                                 │
│                    (Iteracao 4)                                     │
├─────────────────────────────────────────────────────────────────────┤
│   - Envia approved/fallback via WhatsApp                            │
│   - Atualiza status para 'sent'                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 6. Coleta metricas
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    METRICAS + ALERTAS                               │
├─────────────────────────────────────────────────────────────────────┤
│   - Taxa de aprovacao                                               │
│   - Tempo medio de processamento                                    │
│   - Alertas de erro                                                 │
│   - Deteccao de padroes                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Horarios de Execucao

| Turno | Horario Sync | Relatorios |
|-------|--------------|------------|
| Diurno (manha) | 12:00 | Plantao 07h-12h |
| Diurno (tarde) | 18:00 | Plantao 12h-18h |
| Noturno | 20:00 | Plantao 18h-07h |

---

# [ ] - 6.1: Criar orquestrador do pipeline

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/scripts/biz-pipeline.ts e npm script "biz:pipeline".

O script deve orquestrar todo o fluxo em sequencia:

1. Etapa: Sync PrimeCare
   - Importa e executa logica de biz-sync-primecare
   - Log: "Etapa 1/4: Sync PrimeCare"
   - Captura: novos_relatorios

2. Etapa: Processar Relatorios
   - Importa e executa logica de biz-process-reports
   - Log: "Etapa 2/4: Processando relatorios"
   - Captura: approved, failed

3. Etapa: Notificar Revisao
   - Importa e executa logica de biz-notify-review
   - Log: "Etapa 3/4: Notificando revisoes"
   - Captura: notificados

4. Etapa: Enviar Relatorios
   - Importa e executa logica de biz-send-reports
   - Log: "Etapa 4/4: Enviando relatorios"
   - Captura: enviados, falhas

5. Resumo final:
   {
     timestamp,
     sync: { novos },
     process: { approved, failed },
     notify: { notificados },
     send: { enviados, falhas },
     duracao_total_ms
   }

6. Salvar execucao em biz.pipeline_runs (nova tabela)

Flags:
--dry-run: Simula sem executar
--skip-sync: Pula etapa de sync (usar relatorios existentes)
--skip-send: Pula etapa de envio (apenas processa)

Usar try/catch em cada etapa para nao parar pipeline inteiro se uma falhar.
```

---

# [ ] - 6.2: Criar tabela de execucoes e metricas

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie migration 106_biz_pipeline_metrics.sql com:

1. Tabela biz.pipeline_runs:
   CREATE TABLE biz.pipeline_runs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     completed_at TIMESTAMPTZ,
     status VARCHAR(20) NOT NULL DEFAULT 'running',  -- running, completed, failed
     trigger_type VARCHAR(20) NOT NULL,  -- scheduled, manual

     -- Metricas por etapa
     sync_count INT DEFAULT 0,
     process_approved INT DEFAULT 0,
     process_failed INT DEFAULT 0,
     notify_count INT DEFAULT 0,
     send_success INT DEFAULT 0,
     send_failed INT DEFAULT 0,

     -- Tempos
     duration_ms INT,
     sync_duration_ms INT,
     process_duration_ms INT,
     notify_duration_ms INT,
     send_duration_ms INT,

     -- Erros
     error_message TEXT,
     error_stage VARCHAR(20),

     -- Metadata
     metadata JSONB DEFAULT '{}'
   );

2. Tabela biz.daily_metrics (agregado diario):
   CREATE TABLE biz.daily_metrics (
     date DATE PRIMARY KEY,
     total_reports INT DEFAULT 0,
     approved_count INT DEFAULT 0,
     failed_count INT DEFAULT 0,
     fallback_count INT DEFAULT 0,
     sent_count INT DEFAULT 0,
     avg_process_time_ms INT,
     approval_rate DECIMAL(5,2),  -- percentual
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

3. Funcao para atualizar metricas diarias:
   CREATE OR REPLACE FUNCTION biz.update_daily_metrics(p_date DATE)
   RETURNS void AS $$
   -- Calcula e upsert metricas do dia
   $$ LANGUAGE plpgsql;

4. Indices para queries de dashboard.
```

---

# [ ] - 6.3: Criar API de metricas

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/api/biz-metrics.ts com endpoints:

1. GET /api/biz/metrics/today
   - Retorna metricas do dia atual
   - Fonte: biz.daily_metrics + contagem em tempo real

2. GET /api/biz/metrics/history?days=7
   - Retorna metricas dos ultimos N dias
   - Fonte: biz.daily_metrics

3. GET /api/biz/metrics/pipeline-runs?limit=10
   - Retorna ultimas execucoes do pipeline
   - Inclui: status, duracao, contadores por etapa

4. GET /api/biz/metrics/alerts
   - Retorna alertas ativos:
     - Taxa de aprovacao < 70%
     - Muitos fallbacks (> 20%)
     - Pipeline falhou
     - Relatorios em review ha muito tempo

Response padrao:
{
  today: {
    total: 45,
    approved: 40,
    failed: 3,
    fallback: 2,
    sent: 38,
    approval_rate: 88.9,
    avg_process_time_ms: 12500
  },
  alerts: [
    { type: 'low_approval_rate', message: '...', severity: 'warning' }
  ]
}

Registrar rotas no router principal.
```

---

# [ ] - 6.4: Configurar scheduler (node-cron ou similar)

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/scheduler/biz-scheduler.ts para agendar execucoes.

Opcao 1 - node-cron (se backbone roda continuamente):

import cron from 'node-cron';

// Pipeline principal: 12h, 18h, 20h
cron.schedule('0 12,18,20 * * *', () => runPipeline());

// Timeout de revisao: a cada 5 minutos
cron.schedule('*/5 * * * *', () => runReviewTimeout());

// Metricas diarias: meia-noite
cron.schedule('0 0 * * *', () => updateDailyMetrics());


Opcao 2 - Arquivo de config para cron externo:

Criar scripts/cron-config.md com:

# Crontab para BIZ Reports
0 12,18,20 * * * cd /app && npm run biz:pipeline >> /var/log/biz-pipeline.log 2>&1
*/5 * * * * cd /app && npm run biz:review-timeout >> /var/log/biz-review.log 2>&1
0 0 * * * cd /app && npm run biz:update-metrics >> /var/log/biz-metrics.log 2>&1


Opcao 3 - Integrar com sistema existente:

Verificar se ja existe scheduler na plataforma e integrar.

Criar npm script "biz:scheduler" que inicia o scheduler.
Documentar como rodar em producao.
```

---

# [ ] - 6.5: Criar sistema de alertas

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/lib/biz-alerts.ts com:

1. Tipos de alerta:
   - low_approval_rate: Taxa aprovacao < 70%
   - high_fallback_rate: Fallbacks > 20%
   - pipeline_failed: Pipeline falhou
   - review_stuck: Relatorios em review > 1 hora
   - send_failed: Muitas falhas de envio

2. Funcao checkAlerts(): Promise<Alert[]>
   - Verifica todas as condicoes
   - Retorna array de alertas ativos

3. Funcao sendAlertNotification(alert: Alert): Promise<void>
   - Envia alerta via WhatsApp para admin
   - Usa operacao 'biz-alerts' (criar se nao existir)

4. Criar migration 107_biz_alerts.sql:
   - Tabela biz.alerts para historico
   - Tabela biz.alert_config para thresholds configuraveis

5. Criar script biz:check-alerts que:
   - Roda checkAlerts()
   - Salva novos alertas
   - Notifica se severity = 'critical'
```

---

# [ ] - 6.6: Criar dashboard de operacoes

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie pagina de operacoes em apps/app/src/app/(dashboard)/biz/page.tsx.

A pagina deve ter:

1. Header:
   - Titulo "Central de Operacoes - Relatorios"
   - Status do sistema (online/offline)
   - Botao "Executar Pipeline Agora"

2. Cards de metricas (hoje):
   - Total de relatorios
   - Taxa de aprovacao (com indicador verde/amarelo/vermelho)
   - Enviados vs Pendentes
   - Tempo medio de processamento

3. Grafico de historico (7 dias):
   - Linha: total por dia
   - Barras: approved vs failed vs fallback

4. Lista de alertas ativos:
   - Card por alerta com severity, mensagem, acao sugerida
   - Botao para dispensar alerta

5. Ultimas execucoes do pipeline:
   - Tabela com: horario, status, duracao, contadores
   - Expandir para ver detalhes

6. Acoes rapidas:
   - [Executar Pipeline]
   - [Verificar Alertas]
   - [Ver Relatorios Pendentes]
   - [Ir para Revisao]

Usar:
- shadcn/ui para componentes
- recharts ou similar para graficos
- React Query para fetch
- Refresh automatico a cada 30s
```

---

# [ ] - 6.7: Criar deteccao de padroes

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie apps/backbone/src/lib/biz-patterns.ts com:

1. Detectar padroes nos relatorios:
   - Palavras de alerta: "queda", "febre", "emergencia", "hospital"
   - Mudanca de comportamento: "diferente do habitual", "preocupante"
   - Indicadores de saude: medicamentos, sinais vitais anormais

2. Funcao detectPatterns(reportText: string): Pattern[]
   - Analisa texto do relatorio
   - Retorna padroes encontrados com severidade

3. Funcao analyzeAssistidoHistory(assistidoId: string): Insight[]
   - Analisa ultimos N relatorios do assistido
   - Detecta tendencias (melhora, piora, estavel)
   - Retorna insights para a familia

4. Integrar no biz-writer:
   - Adicionar secao "Pontos de Atencao" na mensagem humanizada
   - Destacar padroes detectados

5. Criar tabela biz.detected_patterns:
   - report_id, pattern_type, severity, details, detected_at

Nota: Esta feature pode usar LLM para analise mais sofisticada.
Comecar com regex/keywords e evoluir depois.
```

---

# [ ] - 6.8: Documentar operacao em producao

**Prompt para IA (colar no fork):**

```
Leia specs/AI-INSTRUCTIONS.md antes de comecar.

Crie docs/biz-operations.md com:

1. Visao Geral
   - Arquitetura do sistema
   - Fluxo de dados
   - Componentes

2. Configuracao
   - Variaveis de ambiente necessarias
   - Conexoes de banco (Postgres + MySQL)
   - WhatsApp (Evolution API)

3. Comandos
   - npm run biz:pipeline (completo)
   - npm run biz:sync-primecare
   - npm run biz:process-reports
   - npm run biz:send-reports
   - npm run biz:notify-review
   - npm run biz:review-timeout
   - npm run biz:check-alerts

4. Scheduler
   - Horarios de execucao
   - Como configurar cron
   - Logs e monitoramento

5. Troubleshooting
   - Pipeline falhou
   - WhatsApp nao envia
   - Taxa de aprovacao baixa
   - Relatorios travados

6. Metricas e SLAs
   - Taxa de aprovacao esperada: > 80%
   - Tempo de processamento: < 30s por relatorio
   - Uptime: 99.9%

7. Contatos
   - Responsavel tecnico
   - Suporte WhatsApp
```

---

# [ ] - 6.9: Testar sistema completo

**Executar:**

```bash
# 1. Rodar pipeline completo manualmente
npm run biz:pipeline

# 2. Verificar metricas
curl http://localhost:3001/api/biz/metrics/today

# 3. Verificar alertas
npm run biz:check-alerts

# 4. Acessar dashboard
# http://localhost:3000/biz

# 5. Simular scheduler (deixar rodando)
npm run biz:scheduler
```

**Validar:**
- Pipeline executa todas as etapas
- Metricas sao coletadas corretamente
- Alertas disparam quando thresholds sao atingidos
- Dashboard mostra dados em tempo real
- Scheduler executa nos horarios corretos

---

# Checklist Final

- [ ] Orquestrador do pipeline funciona
- [ ] Tabelas de metricas criadas
- [ ] API de metricas funciona
- [ ] Scheduler configurado
- [ ] Sistema de alertas funciona
- [ ] Dashboard de operacoes criado
- [ ] Deteccao de padroes implementada
- [ ] Documentacao de producao criada
- [ ] Sistema completo testado

---

# Arquivos

| Tipo | Arquivo | Quem |
|------|---------|------|
| Script | `apps/backbone/src/scripts/biz-pipeline.ts` | IA |
| Migration | `database/main/migrations/106_biz_pipeline_metrics.sql` | IA |
| Migration | `database/main/migrations/107_biz_alerts.sql` | IA |
| API | `apps/backbone/src/api/biz-metrics.ts` | IA |
| Scheduler | `apps/backbone/src/scheduler/biz-scheduler.ts` | IA |
| Lib | `apps/backbone/src/lib/biz-alerts.ts` | IA |
| Lib | `apps/backbone/src/lib/biz-patterns.ts` | IA |
| UI | `apps/app/src/app/(dashboard)/biz/page.tsx` | IA |
| Docs | `docs/biz-operations.md` | IA |
| Config | `package.json` (npm scripts) | IA |

---

# Configuracoes de Producao

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| BIZ_ALERT_PHONE | Telefone do admin para alertas | +5511999999999 |
| BIZ_APPROVAL_THRESHOLD | Threshold taxa aprovacao | 70 |
| BIZ_FALLBACK_THRESHOLD | Threshold taxa fallback | 20 |
| BIZ_PIPELINE_TIMEOUT_MS | Timeout do pipeline | 300000 |

---

# Notas

- Scheduler pode ser node-cron interno ou cron externo (Docker/K8s)
- Metricas podem ser exportadas para Prometheus/Grafana se necessario
- Alertas criticos devem notificar imediatamente
- Considerar: integracao com Sentry para erros
- Considerar: backup automatico de biz.reports
