# Feature: Approval Queue

Fila centralizada para validacao humana de conteudos gerados por IA.

**Prefixo:** QUEUE

---

## User Stories

### US-QUEUE-001: Visualizar Itens Pendentes

**Como** revisor,
**Quero** ver todos os itens aguardando aprovacao em um so lugar,
**Para** processar pendencias de forma eficiente.

**Criterios de Aceite:**
- [ ] Lista de itens com icone de prioridade
- [ ] Tipo e descricao de cada item
- [ ] Tempo restante (relogio regressivo)
- [ ] Comentarios do agente de IA explicando pendencia

---

### US-QUEUE-002: Comparar Original e Sugestao

**Como** revisor,
**Quero** ver o conteudo original e a versao sugerida pela IA lado a lado,
**Para** avaliar a qualidade da sugestao.

**Criterios de Aceite:**
- [ ] Visualizacao side-by-side
- [ ] Destaque de diferencas (diff)
- [ ] Scroll sincronizado entre versoes
- [ ] Botao para alternar entre visualizacoes

---

### US-QUEUE-003: Editar Antes de Aprovar

**Como** revisor,
**Quero** editar o conteudo sugerido antes de aprovar,
**Para** corrigir pequenos problemas sem rejeitar.

**Criterios de Aceite:**
- [ ] Editor de texto inline
- [ ] Preview em tempo real
- [ ] Desfazer/refazer alteracoes
- [ ] Aprovar com edicao ou sem edicao

---

### US-QUEUE-004: Aprovar ou Rejeitar Rapidamente

**Como** revisor,
**Quero** aprovar ou rejeitar itens com poucos cliques,
**Para** processar a fila rapidamente.

**Criterios de Aceite:**
- [ ] Botoes de aprovar e rejeitar visiveis
- [ ] Atalhos de teclado (A para aprovar, R para rejeitar)
- [ ] Confirmacao para acoes irreversiveis
- [ ] Proximo item carrega automaticamente

---

### US-QUEUE-005: Pedir Mais Informacoes

**Como** revisor,
**Quero** solicitar informacoes adicionais ao autor,
**Para** tomar decisao com mais contexto.

**Criterios de Aceite:**
- [ ] Botao "Pedir mais informacoes"
- [ ] Campo para digitar pergunta
- [ ] Item fica em status "aguardando resposta"
- [ ] Notificacao enviada ao autor

---

## Requirements

### REQ-QUEUE-001: Tipos de Itens

Fila deve suportar diferentes tipos de itens para aprovacao.

**Regras:**
- **Relatorio:** Relatorio de plantao rejeitado ou com baixa confianca
- **Candidato:** Candidato com score baixo que precisa revisao
- **Ponto:** Excecao de ponto registrada por guardiao
- **Escala:** Conflito ou troca de plantao
- Cada tipo tem campos especificos para exibicao

---

### REQ-QUEUE-002: Prioridade e SLA

Itens devem ter prioridade e prazo para resolucao.

**Regras:**
- **Alta:** Resolver em ate 2 horas
- **Media:** Resolver em ate 4 horas
- **Baixa:** Resolver em ate 24 horas
- Exibir tempo restante com relogio regressivo
- Alertar quando item proximo de expirar

---

### REQ-QUEUE-003: Metricas da Fila

Exibir metricas de desempenho da fila.

**Regras:**
- Itens pendentes (total)
- Itens processados hoje
- Tempo medio de processamento
- Itens expirados
- Taxa de aprovacao vs rejeicao

---

### REQ-QUEUE-004: Filtros

Usuario deve poder filtrar a fila.

**Regras:**
- Filtrar por prioridade (alta, media, baixa)
- Filtrar por tipo (relatorio, candidato, ponto, escala)
- Filtrar por status (pendente, aguardando info)
- Ordenar por tempo restante ou data de criacao

---

### REQ-QUEUE-005: Comentarios do Agente

Cada item deve incluir explicacao do agente de IA.

**Regras:**
- Motivo pelo qual item esta na fila
- Sugestao de acao para o revisor
- Dados relevantes para decisao
- Historico de tentativas anteriores (se houver)

---

### REQ-QUEUE-006: Persistencia de Decisoes

Sistema deve registrar decisoes tomadas.

**Regras:**
- Registrar: quem aprovou/rejeitou, quando, motivo (se rejeitado)
- Se editado, guardar versao original e editada
- Historico disponivel para auditoria
- Metricas agregadas por revisor

---

### REQ-QUEUE-007: Integracao com Notificacoes

Fila deve gerar notificacoes relevantes.

**Regras:**
- Notificar quando novo item de alta prioridade chegar
- Notificar quando item proximo de expirar
- Notificar autor quando item aprovado/rejeitado
- Deep link da notificacao abre item especifico

**Refs:** REQ-NOTIFY-007

---

### REQ-QUEUE-008: Acoes Pos-Aprovacao

Sistema deve executar acoes apos aprovacao.

**Regras:**
- Relatorio aprovado: enviar para familia
- Candidato aprovado: mover para proxima etapa
- Ponto aprovado: ajustar registro no sistema
- Escala aprovada: atualizar grade de horarios

---

## Design

### DES-QUEUE-001: Queue Data Model

Modelo de dados para itens da fila.

**Implementacao:**
```sql
approval_items (
  id, type, priority, status, title, description,
  original_content, suggested_content, agent_comments,
  created_at, deadline_at, assigned_to,
  reviewed_by, reviewed_at, decision, review_notes
)
```

**Trade-offs:**
- Tabela pode crescer com volume alto
- Mas necessario para historico e metricas

---

### DES-QUEUE-002: Queue Service

Servico para gerenciamento da fila.

**Implementacao:**
- `POST /queue/items`: Criar item (chamado por agentes)
- `GET /queue/items`: Listar com filtros
- `GET /queue/items/:id`: Detalhes de item
- `POST /queue/items/:id/approve`: Aprovar
- `POST /queue/items/:id/reject`: Rejeitar
- `POST /queue/items/:id/request-info`: Pedir mais info

**Trade-offs:**
- Varios endpoints para manter
- Mas API clara e RESTful

---

### DES-QUEUE-003: Side-by-Side Viewer

Componente de visualizacao lado a lado.

**Implementacao:**
- Split pane com original (esquerda) e sugestao (direita)
- Biblioteca `react-diff-viewer` para destacar diferencas
- Toggle entre modo diff e modo lado a lado
- Modo mobile: tabs em vez de split

**Trade-offs:**
- Dependencia de biblioteca
- Mas visualizacao de diff e complexa de implementar

---

### DES-QUEUE-004: Inline Editor

Editor integrado para modificacoes.

**Implementacao:**
- Textarea com preview markdown
- Undo/redo com stack local
- Autosave em localStorage
- Validacao antes de submit

**Trade-offs:**
- Editor simples pode limitar formatacao
- Mas suficiente para maioria dos casos

---

### DES-QUEUE-005: Keyboard Shortcuts

Atalhos de teclado para produtividade.

**Implementacao:**
- `A`: Aprovar item atual
- `R`: Rejeitar item atual
- `E`: Entrar em modo edicao
- `N`: Proximo item
- `P`: Item anterior
- `?`: Mostrar ajuda de atalhos

**Trade-offs:**
- Conflito potencial com atalhos do navegador
- Mas aumenta muito produtividade de revisores frequentes

---

### DES-QUEUE-006: Real-time Updates

Atualizacoes em tempo real da fila.

**Implementacao:**
- WebSocket para novos itens e mudancas de status
- Indicador visual quando fila atualizada
- Lock otimista para evitar conflitos (dois revisores no mesmo item)
- Refresh automatico de metricas

**Trade-offs:**
- Complexidade de real-time
- Mas evita revisores trabalhando no mesmo item

---

## Dependencias

**Libs:**
- `react-diff-viewer` - Visualizacao de diff

**Infraestrutura:**
- PostgreSQL Main (persistencia)
- Redis (locks, cache)
- Socket.io (real-time)

**Depends:**
- DES-AUTH-001 (autenticacao)
- DES-AUTH-007 (permissoes)
- DES-NOTIFY-001 (notificacoes)
- DES-AGENT-002 (agentes que criam itens)
