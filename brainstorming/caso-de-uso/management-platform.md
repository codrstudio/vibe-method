# Feature: Management Platform

Plataforma de gestao unificada que consolida todas as solucoes em um unico portal.

**Prefixo:** PLATFORM

---

## User Stories

### US-PLATFORM-001: Acessar Portal Unificado

**Como** membro da equipe,
**Quero** acessar todas as ferramentas em um unico portal,
**Para** nao precisar alternar entre sistemas.

**Criterios de Aceite:**
- [ ] Login unico para todas as solucoes
- [ ] Menu lateral com navegacao entre modulos
- [ ] Interface consistente em todo o portal
- [ ] Acesso via web e mobile (PWA)

---

### US-PLATFORM-002: Ver Dashboard Personalizado

**Como** usuario,
**Quero** ver um dashboard adaptado ao meu perfil,
**Para** focar no que e relevante para mim.

**Criterios de Aceite:**
- [ ] Widgets baseados em minhas permissoes
- [ ] Configuracao de widgets favoritos
- [ ] Ordem personalizavel
- [ ] Estado salvo entre sessoes

---

### US-PLATFORM-003: Receber Notificacoes Centralizadas

**Como** usuario,
**Quero** receber todas as notificacoes em um lugar,
**Para** nao perder alertas importantes.

**Criterios de Aceite:**
- [ ] Painel de notificacoes unificado
- [ ] Agrupamento por tipo/solucao
- [ ] Prioridade visual (critico/medio/baixo)
- [ ] Acoes rapidas direto da notificacao

---

### US-PLATFORM-004: Usar Chat de Qualquer Lugar

**Como** usuario,
**Quero** acessar o chat analitico de qualquer pagina,
**Para** tirar duvidas sem perder contexto.

**Criterios de Aceite:**
- [ ] Botao flutuante sempre visivel
- [ ] Chat abre em panel lateral
- [ ] Contexto da pagina atual disponivel
- [ ] Historico de conversas mantido

---

### US-PLATFORM-005: Instalar como App no Celular

**Como** usuario mobile,
**Quero** instalar a plataforma no celular,
**Para** acessar rapidamente e receber push.

**Criterios de Aceite:**
- [ ] PWA instalavel
- [ ] Icone na home do celular
- [ ] Push notifications funcionando
- [ ] Modo offline com dados basicos

---

## Requirements

### REQ-PLATFORM-001: Quatro Modulos Reutilizaveis

Plataforma deve ter quatro modulos core.

**Regras:**
1. **Dashboards:** Indicadores com filtros e exportacao
2. **Notificacoes:** Alertas multi-canal com prioridades
3. **Insights/Chat:** Perguntas em linguagem natural + proativo
4. **Fila de Aprovacoes:** Validacao humana de conteudo IA

**Refs:** DES-DASH-001, DES-NOTIFY-001, DES-CHAT-001, DES-QUEUE-001

---

### REQ-PLATFORM-002: Uso por Solucoes

Cada solucao deve usar os modulos de forma padronizada.

**Regras:**
| Solucao | Dashboard | Notify | Chat | Queue |
|---------|-----------|--------|------|-------|
| Recrutamento | Funil, no-show | Candidatos | No-show | Score baixo |
| Relatorios | Enviados | Rejeitados | NPS | Revisao |
| Expectativas | Adesao | Em risco | Padroes | Excecoes |
| Matching | Solicitacoes | Match pronto | Score | - |
| Financeiro | Faturamento | Cobranca | Churn | Ajustes |

---

### REQ-PLATFORM-003: Tres Personas Principais

Plataforma deve atender tres personas.

**Regras:**
- **Administrador/Coordenador:** Visao completa, aprovacoes, analytics
- **Supervisor de Campo:** Mobile-first, alertas, acompanhamento
- **Analista Financeiro:** Dashboards financeiros, previsoes

---

### REQ-PLATFORM-004: PWA com Push e Offline

Plataforma deve funcionar como PWA.

**Regras:**
- Instalavel no celular
- Push notifications para eventos criticos
- Modo offline com dados basicos cacheados
- Sincronizacao quando voltar online

---

### REQ-PLATFORM-005: LGPD e Controle de Acesso

Plataforma deve cumprir LGPD.

**Regras:**
- Login seguro com autenticacao multi-fator disponivel
- Permissoes definem o que usuario pode ver/editar
- Dados criptografados em transito e repouso
- Historico de acoes para auditoria

**Refs:** DES-AUTH-001, DES-LGPD-001

---

### REQ-PLATFORM-006: Interface Consistente

Interface deve ser consistente entre modulos.

**Regras:**
- Design system padronizado
- Componentes reutilizaveis
- Navegacao previsivel
- Feedback visual consistente

---

## Design

### DES-PLATFORM-001: Portal Shell Architecture

Arquitetura de shell do portal.

**Implementacao:**
- Next.js App Router
- Layout principal com sidebar e header
- Slot para conteudo de cada modulo
- Context providers no root (auth, theme, notifications)

**Trade-offs:**
- Single page app adiciona complexidade
- Mas experiencia de usuario muito superior

---

### DES-PLATFORM-002: Navigation System

Sistema de navegacao.

**Implementacao:**
- Sidebar com grupos de menu
- Itens filtrados por permissao
- Badge de notificacoes em itens relevantes
- Modo compacto para mobile

**Trade-offs:**
- Muitos itens podem confundir
- Mas organizacao por grupo mitiga

---

### DES-PLATFORM-003: Global Search

Busca global.

**Implementacao:**
- Cmd+K abre modal de busca
- Busca em: navegacao, entidades, documentos
- Resultados agrupados por tipo
- Historico de buscas recentes

**Trade-offs:**
- Indice de busca consome recursos
- Mas produtividade muito maior

---

### DES-PLATFORM-004: PWA Configuration

Configuracao de PWA.

**Implementacao:**
- Manifest.json com icones e cores
- Service worker para cache e offline
- Workbox para estrategias de cache
- Push via Web Push API

**Trade-offs:**
- Service worker adiciona complexidade
- Mas experiencia mobile nativa

---

### DES-PLATFORM-005: Theme System

Sistema de temas.

**Implementacao:**
- CSS variables para cores
- Tema claro e escuro
- Preferencia salva por usuario
- Respeita preferencia do sistema

**Trade-offs:**
- Manutencao de dois temas
- Mas acessibilidade e preferencia do usuario

---

### DES-PLATFORM-006: Widget System

Sistema de widgets para dashboard.

**Implementacao:**
- Widgets configurados por usuario
- Drag-and-drop para reordenar
- Tamanhos: small, medium, large
- Biblioteca de widgets disponiveis por permissao

**Trade-offs:**
- Flexibilidade pode gerar confusao
- Mas personalizacao aumenta adocao

---

## Dependencias

**Fontes:** brainstorming/Plataforma de Gestão para o CiaPrime.md

**Depends:**
- DES-AUTH-001 (autenticacao)
- DES-DASH-001 (dashboards)
- DES-NOTIFY-001 (notificacoes)
- DES-CHAT-001 (chat)
- DES-QUEUE-001 (fila de aprovacoes)
- DES-LGPD-001 (privacidade)
