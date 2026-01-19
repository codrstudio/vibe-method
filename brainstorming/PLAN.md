# PLAN - Report Humanization

Plano de implementacao estilo bazaar: funciona a cada passo.

**Caso de uso:** Humanizacao de relatorios de plantao da Cia. Cuidadores

**Fork:** `D:\sources\codr.studio\cia-dashboard-vibe`

---

## Iteracao 1: Prova de Conceito

**Objetivo:** Relatorio entra, mensagem humanizada sai

```
Input (texto) → Writer → Reviewer → Output (console)
```

- [ ] Camada LLM minima (uma funcao que chama Ollama/OpenRouter)
- [ ] biz-writer que recebe texto e retorna mensagem
- [ ] biz-reviewer que recebe mensagem e retorna approved/rejected
- [ ] Script de teste que roda o fluxo

**Entrega:** `npm run test:biz-report` funciona

---

## Iteracao 2: API Funcional

**Objetivo:** Chamada HTTP processa relatorio

```
POST /api/biz-reports → processa → retorna resultado
```

- [ ] Schema biz-report no banco
- [ ] Rota API que recebe relatorio
- [ ] Persiste e processa
- [ ] Retorna mensagem humanizada

**Entrega:** Postman/curl funciona

---

## Iteracao 3: Fluxo Completo

**Objetivo:** Retry + revisao humana

```
Writer → Reviewer → [rejected?] → retry ou fila humana
```

- [ ] Logica de retry (ate 2x)
- [ ] Fila de revisao quando falha
- [ ] Status tracking (pending → processing → approved/rejected)

**Entrega:** Fluxo de 9 etapas funciona

---

## Iteracao 4: Interface

**Objetivo:** Humano consegue usar

- [ ] Tela de fila de revisao
- [ ] Editor de correcao
- [ ] Geracao de PDF

**Entrega:** Revisor consegue trabalhar

---

## Iteracao 5: Producao

**Objetivo:** Roda sozinho

- [ ] Scheduling (horarios de envio)
- [ ] Notificacoes (WhatsApp/Email)
- [ ] Metricas e alertas

**Entrega:** Sistema autonomo

---

## Referencias

- `brainstorming/caso-de-uso/report-humanization.md` - Feature spec
- `brainstorming/platform-derivation-analysis.md` - Analise da plataforma
- `brainstorming/platform-derivation-analysis-02.md` - Modulos e layout

**Fork specs:**
- `cia-dashboard-vibe/specs/features/report-humanization.md`
- `cia-dashboard-vibe/specs/entities/report.yaml`
- `cia-dashboard-vibe/specs/agents/writer.md`
- `cia-dashboard-vibe/specs/agents/reviewer.md`
- `cia-dashboard-vibe/specs/AI-INSTRUCTIONS.md`
