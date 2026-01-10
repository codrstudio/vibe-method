# Settings

Framework para a area de configuracoes do sistema.

---

## Visao Geral

Settings e onde o usuario configura "o que o sistema sabe" sobre o negocio. Diferente de areas operacionais (onde coisas acontecem), Settings e sobre definir parametros.

### Modulos de Settings

| Modulo | Proposito | Documento |
|--------|-----------|-----------|
| **Entity** | Dados da "dona" do sistema | [entity.md](./entity.md) |
| **Users** | Quem pode acessar e fazer o que | [users.md](./users.md) |
| **Integrations** | Conexoes com sistemas externos | [integrations.md](./integrations.md) |
| **Monitoring** | Saude e status do sistema | [monitoring.md](./monitoring.md) |

---

## Quando Cada Modulo se Aplica

```
SEMPRE:
  └── Entity (todo sistema tem uma "dona")

SE MULTI-USUARIO:
  └── Users (gestao de quem acessa)

SE INTEGRA COM EXTERNOS:
  └── Integrations (WhatsApp, Google, APIs)

SE TEM INFRAESTRUTURA PROPRIA:
  └── Monitoring (health checks, logs)
```

---

## Estrutura de Rotas Tipica

```
/settings
├── /{entity}         # clinic, school, vessel, workspace...
├── /users            # Gestao de usuarios
├── /integrations     # Ou rotas especificas: /whatsapp, /google
└── /health           # Monitoramento (admin only)
```

**Nota:** O nome da rota `/settings/{entity}` varia por dominio. Veja [entity.md](./entity.md).

---

## Permissoes Tipicas

| Modulo | Quem Acessa | Quem Edita |
|--------|-------------|------------|
| Entity | Todos | Admin, Gestor |
| Users | Admin, Gestor | Admin, Gestor |
| Integrations | Admin | Admin |
| Monitoring | Admin | - (somente leitura) |

**Importante:** Estas sao permissoes TIPICAS. Sempre descubra os papeis reais do negocio.

---

## Navegacao em Settings

### Desktop

Sidebar fixa com itens agrupados logicamente:

```
┌─────────────────┬──────────────────────────────┐
│ SETTINGS        │                              │
│                 │   [Conteudo da secao ativa]  │
│ ● Empresa       │                              │
│   Usuarios      │                              │
│   Integracoes   │                              │
│   Sistema       │                              │
│                 │                              │
└─────────────────┴──────────────────────────────┘
```

### Mobile

Tabs horizontais ou lista de navegacao:

```
┌────────────────────────────────────────────────┐
│ < Configuracoes                                │
├────────────────────────────────────────────────┤
│ [Empresa] [Usuarios] [Integracoes] [Sistema]   │
├────────────────────────────────────────────────┤
│                                                │
│           [Conteudo da secao ativa]            │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Principios de Settings

### 1. Leitura e Edicao Separadas

Muitos usuarios podem VER configuracoes, poucos podem EDITAR. UI deve refletir isso (campos desabilitados, badges de permissao).

### 2. Salvamento Explicito

Settings nao sao operacoes - usuario espera controle sobre quando salvar. Use botao "Salvar" explicito, nao auto-save.

### 3. Feedback de Mudancas

Mostrar claramente quando ha mudancas nao salvas. Prevenir saida acidental.

### 4. Agrupamento Logico

Agrupar campos relacionados em abas ou secoes. Evitar formularios infinitos.

### 5. Admin-First para Integracoes

Integracoes externas (APIs, webhooks) sao complexas. Restringir a admins.
