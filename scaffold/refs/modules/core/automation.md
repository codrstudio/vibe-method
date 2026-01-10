# Automation (Bot/IA)

Monitoramento e controle de automacoes.

---

## O Problema Universal

Sistemas com automacao (bots, IA, workflows) precisam de visibilidade. Quando a automacao funciona, e invisivel. Quando falha, ninguem sabe ate alguem reclamar. Monitoramento permite intervir antes do problema escalar.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Quais automacoes existem no sistema?**
   - Bot de atendimento (WhatsApp, Telegram, Chat)?
   - Workflows automaticos (notificacoes, lembretes)?
   - Integracoes (sincronizacao de dados)?
   - Jobs agendados (relatorios, backups)?

2. **O que define "funcionando"?**
   - Bot conectado e respondendo?
   - Jobs executando no horario?
   - Taxa de sucesso acima de X%?

3. **O que a automacao faz?**
   - Responde perguntas?
   - Agenda compromissos?
   - Envia notificacoes?
   - Processa dados?

4. **Quando a automacao deve escalar para humano?**
   - Nao entendeu a mensagem?
   - Solicitacao complexa?
   - Cliente pediu atendente?
   - Erro no processamento?

5. **Quem monitora as automacoes?**
   - Admin apenas?
   - Equipe de operacoes?
   - Suporte tecnico?

6. **Quais metricas sao importantes?**
   - Mensagens processadas?
   - Taxa de resolucao automatica?
   - Tempo de resposta?
   - Erros e falhas?

---

## Anatomia

### Componentes de Monitoramento

```
┌─────────────────────────────────────────────────────────────┐
│ Automacoes                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ STATUS GERAL                                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ● Todas as automacoes funcionando                       ││
│ │   Ultima verificacao: ha 2 minutos                      ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ AUTOMACOES ATIVAS                                           │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ● Bot WhatsApp                                          ││
│ │   Online | 234 mensagens hoje | 89% resolucao           ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ● Lembretes de Confirmacao                              ││
│ │   Ativo | 45 enviados hoje | Proximo: 18:00             ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ○ Sincronizacao Google Calendar                         ││
│ │   Erro | Ultimo sync: ha 2 horas | [Reconectar]         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ CONVERSAS RECENTES (se aplicavel)                          │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ +55 32 99999-0001 | "Quero agendar consulta" | ha 5min  ││
│ │ +55 32 99999-0002 | "Qual horario disponivel" | ha 12min││
│ │ +55 32 99999-0003 | [Escalado] Reclamacao     | ha 15min││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Estados de Automacao

| Estado | Icone | Cor | Significado |
|--------|-------|-----|-------------|
| Online/Ativo | ● | Verde | Funcionando normalmente |
| Degradado | ◐ | Amarelo | Funcionando com problemas |
| Offline/Erro | ○ | Vermelho | Parado ou falhando |
| Pausado | ⏸ | Cinza | Desativado intencionalmente |

### Metricas de Bot

```
┌─────────────────────────────────────────────────────────────┐
│ Bot WhatsApp - Metricas                     [Ultimas 24h ▾] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│ │ Mensagens │ │ Conversas │ │ Resolucao │ │ Escalacoes│    │
│ │    234    │ │     45    │ │    89%    │ │     5     │    │
│ │  recebidas│ │  iniciadas│ │automatica │ │ p/ humano │    │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                             │
│ INTENCOES MAIS COMUNS                                       │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Agendamento         45%  ████████████████████           ││
│ │ Confirmacao         25%  ██████████████                 ││
│ │ Informacoes         15%  ████████                       ││
│ │ Reclamacao           8%  █████                          ││
│ │ Outros               7%  ████                           ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ TEMPO DE RESPOSTA                                           │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Medio: 2.3s | P95: 5.1s | Maximo: 12.4s                 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Variacoes por Dominio

| Aspecto | Clinica | E-commerce | Suporte | Financeiro |
|---------|---------|------------|---------|------------|
| **Automacao principal** | Bot WhatsApp | Chatbot site | Bot Telegram | Alertas |
| **Objetivo** | Agendamento | Vendas/FAQ | Tickets | Notificacoes |
| **Escalacao** | Recepcionista | Atendente | Agente | Analista |
| **Metrica chave** | Agendamentos automaticos | Vendas via bot | Tickets resolvidos | Alertas processados |
| **Integracao** | Calendario | Carrinho | Ticketing | Transacoes |

### Tipos de Automacao

| Tipo | Exemplos | O que Monitorar |
|------|----------|-----------------|
| **Bot conversacional** | WhatsApp, Telegram, Chat | Status conexao, mensagens, resolucao |
| **Notificacoes** | Lembretes, confirmacoes | Enviados, entregues, falhas |
| **Workflows** | Aprovacoes, escalacoes | Executados, pendentes, erros |
| **Sincronizacao** | Calendar sync, CRM sync | Ultimo sync, conflitos, erros |
| **Jobs agendados** | Relatorios, backups | Ultima execucao, proxima, status |

---

## Fluxos

### Monitoramento de Bot

```
1. Bot recebe mensagem de usuario
2. Processa e responde
3. Log registrado:
   - Mensagem recebida
   - Intencao detectada
   - Resposta enviada
   - Tempo de processamento
4. Se escalou → Tarefa criada no Inbox
5. Dashboard atualiza metricas em tempo real
```

### Tratamento de Falha

```
1. Bot detecta problema (conexao perdida, erro API)
2. Tenta reconectar automaticamente (3x)
3. Se falhar:
   - Status muda para "Offline"
   - Alerta enviado para admin
   - Log de erro registrado
4. Admin pode:
   - Ver logs de erro
   - Reconectar manualmente
   - Desativar temporariamente
```

### Visualizacao de Conversa

```
1. Admin clica em conversa recente
2. Modal abre com:
   - Historico completo da conversa
   - Intencoes detectadas em cada mensagem
   - Acoes tomadas pelo bot
   - Se houve escalacao e motivo
3. Admin pode:
   - Assumir a conversa
   - Marcar para revisao
   - Exportar historico
```

---

## Metricas Importantes

### Bot Conversacional

| Metrica | O que Mede | Bom vs Ruim |
|---------|------------|-------------|
| **Taxa de resolucao** | % conversas resolvidas sem humano | >80% bom, <50% ruim |
| **Taxa de escalacao** | % que precisou de humano | <20% bom, >40% ruim |
| **Tempo de resposta** | Segundos para responder | <3s bom, >10s ruim |
| **Conversas/dia** | Volume de atendimento | Depende do negocio |
| **Satisfacao** | NPS ou rating pos-conversa | >4/5 bom |

### Jobs e Workflows

| Metrica | O que Mede | Bom vs Ruim |
|---------|------------|-------------|
| **Taxa de sucesso** | % execucoes sem erro | >99% bom, <95% ruim |
| **Tempo de execucao** | Duracao do job | Dentro do esperado |
| **Fila pendente** | Itens aguardando | 0 ideal, crescendo = problema |
| **Ultimo sucesso** | Quando executou OK | Recente = bom |

---

## Principios de Design

### 1. Status Visivel em Um Olhar

O gestor deve saber se a automacao esta funcionando sem clicar em nada. Banner verde/vermelho no topo da pagina.

### 2. Alertas Proativos

Nao espere o gestor abrir o dashboard. Notifique quando:
- Bot ficou offline
- Taxa de erro subiu
- Fila cresceu demais

### 3. Logs Acessiveis

Quando algo falha, o admin precisa investigar. Logs devem ser:
- Filtravies (por data, tipo, status)
- Legiveis (nao dump tecnico)
- Exportaveis

### 4. Acoes Rapidas

Se o bot caiu, o admin quer reconectar com um clique. Nao fazer navegar por 5 telas.

### 5. Contexto da Conversa

Ao ver uma conversa escalada, o humano precisa do contexto completo:
- O que o usuario pediu
- O que o bot respondeu
- Por que escalou

### 6. Pausar vs Desligar

Permitir pausar automacao temporariamente (manutencao) sem "desligar" completamente.

---

## Anti-patterns

### "Automacao invisivel"
**Problema:** Bot funciona (ou nao) e ninguem sabe.
**Solucao:** Dashboard de status sempre visivel.

### "Logs tecnicos demais"
**Problema:** Admin ve "Error: ECONNREFUSED" e nao entende.
**Solucao:** Mensagens humanas: "Nao foi possivel conectar ao WhatsApp".

### "Sem historico de conversas"
**Problema:** Humano assume e nao sabe o contexto.
**Solucao:** Mostrar conversa completa ao escalar.

### "Reconexao manual apenas"
**Problema:** Bot cai as 3h da manha e fica offline ate alguem ver.
**Solucao:** Retry automatico + alerta se persistir.

### "Metricas sem acao"
**Problema:** Dashboard mostra "Taxa de erro: 45%" mas nao explica por que.
**Solucao:** Drill-down para ver erros especificos.

### "Tudo ou nada"
**Problema:** So pode ligar ou desligar a automacao inteira.
**Solucao:** Controle granular (pausar tipo especifico, horario, etc).

---

## Exemplo: Automations de Clinica

```
/automations

┌─────────────────────────────────────────────────────────────┐
│ Automacoes                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ● SISTEMA OPERACIONAL                                   ││
│ │   Todas as automacoes funcionando                       ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ BOT WHATSAPP                                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ● Online                        [Pausar] [Configurar]   ││
│ │                                                         ││
│ │ Conectado como: +55 32 8411-0531                        ││
│ │ Ultima mensagem: ha 2 minutos                           ││
│ │                                                         ││
│ │ HOJE                                                    ││
│ │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐││
│ │ │ Mensagens │ │ Conversas │ │ Resolucao │ │ Escaladas │││
│ │ │    156    │ │     32    │ │    87%    │ │     4     │││
│ │ └───────────┘ └───────────┘ └───────────┘ └───────────┘││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ LEMBRETES DE CONFIRMACAO                                    │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ● Ativo                          [Pausar] [Configurar]  ││
│ │                                                         ││
│ │ Enviados hoje: 23 | Confirmados: 18 | Sem resposta: 5   ││
│ │ Proximo envio: 18:00 (8 pacientes)                      ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ CONVERSAS RECENTES                                          │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ +55 32 99999-1234                              ha 5min  ││
│ │ "Quero agendar uma consulta para amanha"                ││
│ │ [●] Agendamento criado automaticamente                  ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ +55 32 99999-5678                              ha 12min ││
│ │ "Preciso remarcar minha consulta"                       ││
│ │ [●] Reagendado para quinta-feira                        ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ +55 32 99999-9012                              ha 18min ││
│ │ "Quero falar com atendente"                             ││
│ │ [!] Escalado para Inbox                      [Ver]      ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [Ver todas as conversas]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

DETALHE DA CONVERSA (Modal):
┌─────────────────────────────────────────────────────────────┐
│ Conversa com +55 32 99999-1234                       [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [14:32] Usuario:                                            │
│ Oi, quero agendar uma consulta para amanha                 │
│ → Intencao: agendamento                                     │
│                                                             │
│ [14:32] Bot:                                                │
│ Ola! Vou te ajudar a agendar. Qual especialidade?          │
│                                                             │
│ [14:33] Usuario:                                            │
│ Clinico geral                                               │
│ → Intencao: especialidade                                   │
│                                                             │
│ [14:33] Bot:                                                │
│ Temos os seguintes horarios disponiveis amanha:            │
│ - 09:00 com Dr. Carlos                                      │
│ - 14:30 com Dra. Ana                                        │
│ Qual prefere?                                               │
│                                                             │
│ [14:34] Usuario:                                            │
│ 09:00                                                       │
│ → Intencao: selecao_horario                                │
│                                                             │
│ [14:34] Bot:                                                │
│ Perfeito! Agendei sua consulta para amanha as 09:00        │
│ com Dr. Carlos. Ate la!                                     │
│ → Acao: appointment_created (id: abc123)                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Tempo total: 2min | Mensagens: 4 | Resolucao: Automatica   │
│                                                             │
│ [Assumir conversa]  [Marcar para revisao]  [Exportar]      │
└─────────────────────────────────────────────────────────────┘
```
