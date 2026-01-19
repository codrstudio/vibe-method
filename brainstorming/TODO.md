
## O que o Caso de Uso CONSOME

### Report Humanization precisa de:

- [ ] Dois agentes IA
    - status: specs criados (writer.md, reviewer.md), codigo nao gerado

    - backbone/agents/
    - prompts/writer.md, prompts/reviewer.md

- [ ] Chamadas LLM
    - status: motor pendente na plataforma, nao configurado

    - backbone/llm/
    - config de models (Ollama/OpenRouter)

- [ ] Envio WhatsApp/Email
    - status: motor existe na plataforma, nao configurado para o projeto

    - backbone/services/notifications
    - config de canais

- [ ] Fila de aprovação humana
    - status: motor existe (actions registry), action biz-report.review nao criada

    - backbone/actions/
    - action report.review

- [ ] Scheduling (horários)
    - status: motor existe na plataforma, regras nao configuradas

    - backbone/services/scheduling
    - regras de horário

- [ ] Geração PDF
    - status: nao implementado, precisa lib + template HTML

    - (lib adicional)
    - template HTML

- [ ] Dashboard revisor
    - status: nao implementado, aguardando codigo

    - apps/app/
    - rotas em (app)/review/

- [ ] Métricas de qualidade
    - status: motor existe (pulse), metricas de negocio nao configuradas

    - backbone/pulse/
    - métricas de negócio (taxa aprovação, tempo)

- [ ] Alertas de falha
    - status: motor existe (pulse/alerts), alertas de negocio nao configurados

    - backbone/pulse/alerts
    - alertas de negócio (rejeições, timeout)

- [ ] Detecção padrões
    - status: spec nao criado, codigo nao gerado

    - backbone/agents/
    - prompts/pattern-detector.md

