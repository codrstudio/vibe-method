# PLAN - Report Humanization

Plano de implementacao estilo bazaar: funciona a cada passo.

**Caso de uso:** Humanizacao de relatorios de plantao da Cia. Cuidadores

**Fork:** `D:\sources\codr.studio\cia-dashboard-vibe`

---

## Fluxo Completo

```
[Scheduler]     Roda nos horarios: 12h, 18h, 20h
      |
      v
[PrimeCare]     Le relatorios do MySQL (banco externo)
      |
      v
[Writer]        Gera mensagem humanizada + PDF tecnico
      |
      v
[Reviewer]      Valida qualidade
      |
      +--[approved]--> [Envia WhatsApp/Email]
      |
      +--[rejected]--> [Retry 2x automatico]
                            |
                            +--[ainda rejected]--> [Fila humana 30min]
                                                        |
                                                        +--[timeout]--> [Fallback: PDF + msg padrao]
```

---

## Iteracao 1: Prova de Conceito ✅

**Objetivo:** Relatorio entra, mensagem humanizada sai

```
Input (texto) → Writer → Reviewer → Output (console)
```

- [x] Camada LLM minima (llmService com OpenRouter)
- [x] biz-writer que recebe texto e retorna mensagem
- [x] biz-reviewer que recebe mensagem e retorna approved/rejected
- [x] Script de teste que roda o fluxo

**Entrega:** `npm run test:biz-report` funciona

**Extras entregues:**
- [x] WorkflowExecution para auditoria
- [x] Checklist de qualidade para agentes
- [x] Schema biz.reports no banco (migration 100)
- [x] Types Zod para BizReport

---

## Iteracao 2: Fonte de Dados ✅

**Objetivo:** Ler relatorios do PrimeCare (MySQL externo)

```
[MySQL PrimeCare] → [Sync] → [biz.reports pendentes]
```

- [x] Conexao com MySQL externo (PrimeCare)
- [x] Query para buscar relatorios do turno
- [x] Mapear dados PrimeCare → BizReportInput
- [x] Inserir em biz.reports com status 'pending'

**Entrega:** `npm run biz:sync-primecare` funciona

---

## Iteracao 3: Pipeline de Processamento

**Objetivo:** Processar relatorios pendentes com retry

```
[biz.reports pending] → [Writer] → [Reviewer] → [approved/rejected]
```

- [x] Worker que processa relatorios pending
- [x] Logica de retry (ate 2x se rejected)
- [x] Atualizar status: pending → processing → approved/rejected/failed
- [x] Salvar humanized_message e pdf_data
- [ ] Lazy compile nos agentes
- [ ] WorkflowExecution (auditoria) nos agentes

**Entrega:** `npm run biz:process-reports` funciona

---

## Iteracao 4: Entrega (WhatsApp/Email)

**Objetivo:** Enviar relatorio aprovado para familia

```
[approved] → [WhatsApp API] ou [Email]
```

- [ ] Integracao WhatsApp Business API
- [ ] Integracao Email (Resend/SendGrid)
- [ ] Escolha de canal por familia
- [ ] Confirmacao de leitura

**Entrega:** Familia recebe mensagem + PDF

---

## Iteracao 5: Revisao Humana

**Objetivo:** Fila para casos que IA nao resolve

```
[rejected 2x] → [Notifica responsavel] → [Dashboard revisao] → [Aprova/Edita]
```

- [ ] Fila de revisao (relatorios com 2 rejeicoes)
- [ ] Notificacao WhatsApp para responsavel
- [ ] Tela de revisao com editor
- [ ] Timeout 30min → fallback automatico

**Entrega:** Responsavel consegue revisar e aprovar

---

## Iteracao 6: Producao

**Objetivo:** Sistema autonomo rodando

```
[Cron 12h/18h/20h] → [Pipeline completo] → [Metricas]
```

- [ ] Scheduler nos horarios corretos
- [ ] Deteccao de padroes (alertas)
- [ ] Metricas: taxa aprovacao, tempo processamento
- [ ] Monitoramento e alertas de erro

**Entrega:** Sistema roda sozinho 24/7

---

## Dependencias Externas

| Dependencia | Descricao | Status |
|-------------|-----------|--------|
| MySQL PrimeCare | Banco de dados com relatorios originais | Pendente acesso |
| WhatsApp Business API | Envio de mensagens | Pendente conta |
| Email (Resend/SendGrid) | Envio de emails | Pendente config |
| OpenRouter/GPT-4 | LLM para agentes | ✅ Configurado |

---

## Referencias

- `brainstorming/caso-de-uso/features/report-humanization.md` - Feature spec
- `.tmp/proposta.html` - Proposta comercial com fluxo detalhado

**Fork specs:**
- `cia-dashboard-vibe/specs/entities/biz-report.yaml`
- `cia-dashboard-vibe/specs/agents/biz-writer.md`
- `cia-dashboard-vibe/specs/agents/biz-reviewer.md`
