# User Modules

Area pessoal do usuario logado.

---

## Visao Geral

User modules sao a area "minha conta" do sistema. Diferente de Settings (configuracao do sistema) e Core (operacao), User e onde cada usuario gerencia suas proprias preferencias, seguranca e notificacoes.

### Modulos User

| Modulo | Proposito | Documento |
|--------|-----------|-----------|
| **Profile** | Dados pessoais e seguranca | [profile.md](./profile.md) |
| **Notifications** | Configuracao de alertas | [notifications.md](./notifications.md) |
| **Navigation** | Menu adaptavel a roles | [navigation.md](./navigation.md) |

---

## Quando Cada Modulo se Aplica

```
SE usuario pode editar seus dados:
  └── Profile (nome, email, senha, avatar)

SE sistema envia notificacoes:
  └── Notifications (preferencias de canais, frequencia)

SE existem diferentes papeis:
  └── Navigation (menu adaptado por role)
```

---

## Diferenca: User vs Settings

| Aspecto | User (Minha Conta) | Settings (Configuracoes) |
|---------|-------------------|--------------------------|
| **Quem acessa** | Qualquer usuario | Admin ou gestores |
| **Escopo** | Apenas o proprio usuario | Todo o sistema |
| **Exemplos** | Minha senha, minhas notificacoes | Usuarios do sistema, integracoes |
| **Rota tipica** | /profile, /notifications | /settings/* |

---

## Estrutura de Rotas Tipica

```
/profile           # Dados pessoais + seguranca
/notifications     # Preferencias de notificacao
```

**Nota:** Algumas implementacoes colocam tudo em um unico `/profile` com abas. Outras preferem rotas separadas. Ambas sao validas.

---

## Principios de User

### 1. Autonomia do Usuario

Usuario deve poder mudar seus dados sem depender de admin (exceto role/permissoes).

### 2. Seguranca Acessivel

Trocar senha, ver sessoes ativas, configurar 2FA - funcoes de seguranca devem ser faceis de encontrar.

### 3. Feedback Imediato

Ao salvar alteracoes, feedback claro: "Salvo" ou mensagem de erro especifica.

### 4. Defaults Sensiveis

Notificacoes devem vir com configuracao padrao razoavel. Usuario pode ajustar, mas nao deve ser obrigado.

### 5. Mobile-Friendly

Area de perfil e frequentemente acessada em mobile. UI deve funcionar bem em telas pequenas.
