# Integration Settings

Conexoes com sistemas externos (WhatsApp, Google, APIs).

---

## O Problema Universal

Sistemas modernos nao vivem isolados. Integram com WhatsApp para mensagens, Google para calendarios, gateways para pagamentos. Sem uma area clara para gerenciar essas integracoes, usuarios nao sabem o status nem como configurar.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Quais integracoes o sistema tem/tera?**
   - Mensageria: WhatsApp, Telegram, SMS
   - Calendarios: Google Calendar, Outlook
   - Pagamentos: Stripe, PagSeguro, PIX
   - Outros: Webhooks, APIs customizadas

2. **Qual o fluxo de configuracao?**
   - OAuth (usuario autoriza)?
   - API Key (admin insere)?
   - QR Code (WhatsApp)?

3. **Quem pode configurar?**
   - Geralmente apenas Admin
   - Algumas por usuario (ex: Google Calendar pessoal)

4. **Como mostrar status?**
   - Conectado/Desconectado
   - Ultimo sync
   - Erros recentes

5. **O que acontece quando falha?**
   - Retry automatico?
   - Notificar admin?
   - Degradacao graceful?

---

## Anatomia

### Listagem de Integracoes

```
┌─────────────────────────────────────────────────────────────┐
│ Integracoes                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [WhatsApp Icon]  WhatsApp                               ││
│ │ Conectado como +55 32 99999-0000        [Configurar]    ││
│ │ ● Online                                                ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Google Icon]  Google Calendar                          ││
│ │ Nao configurado                         [Conectar]      ││
│ │ ○ Desconectado                                          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Webhook Icon]  Webhooks                                ││
│ │ 3 webhooks ativos                       [Gerenciar]     ││
│ │ ● Funcionando                                           ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pagina de Integracao Especifica

Pode ser rota separada (`/settings/whatsapp`) ou modal/drawer.

---

## Tipos de Integracao

### 1. QR Code (WhatsApp)

**Fluxo:**
```
1. Usuario clica "Conectar"
2. Sistema gera QR Code via Evolution/Baileys
3. Usuario escaneia com WhatsApp
4. Polling verifica conexao
5. Quando conectado, mostra perfil vinculado
```

**Estados:**
- `not_configured` - Nunca conectou
- `open` - Conectado e funcionando
- `close` - Desconectado (sessao expirou)
- `connecting` - Aguardando scan do QR

**UI:**
```
┌─────────────────────────────────────────────────────────────┐
│ WhatsApp                                             [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Para conectar, escaneie o QR Code com seu WhatsApp:        │
│                                                             │
│              ┌───────────────────────┐                     │
│              │                       │                     │
│              │      [QR CODE]        │                     │
│              │                       │                     │
│              └───────────────────────┘                     │
│                                                             │
│ Ou use o codigo: ABC-123-XYZ                               │
│                                                             │
│ Aguardando conexao...                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. OAuth (Google, Microsoft)

**Fluxo:**
```
1. Usuario clica "Conectar com Google"
2. Redirect para tela de autorizacao Google
3. Usuario autoriza escopos solicitados
4. Callback com codigo de autorizacao
5. Sistema troca por access/refresh tokens
6. Armazena tokens criptografados
```

**Estados:**
- `not_connected` - Nunca autorizou
- `connected` - Tokens validos
- `expired` - Refresh token expirou (reautorizar)
- `revoked` - Usuario revogou acesso

**UI:**
```
┌─────────────────────────────────────────────────────────────┐
│ Google Calendar                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Conectado como: joao@gmail.com                             │
│ Calendario: Consultorio                                     │
│ Ultimo sync: ha 5 minutos                                   │
│                                                             │
│ [Trocar conta]  [Desconectar]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. API Key (Webhooks, Servicos)

**Fluxo:**
```
1. Usuario gera API Key no servico externo
2. Cola no campo de configuracao
3. Sistema valida com request de teste
4. Se valido, armazena criptografado
```

**UI:**
```
┌─────────────────────────────────────────────────────────────┐
│ Configurar Webhook                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ URL do Webhook *                                            │
│ [https://seu-servidor.com/webhook________________]          │
│                                                             │
│ Secret (opcional)                                           │
│ [________________________] [Gerar]                          │
│                                                             │
│ Eventos                                                     │
│ [ ] Novo agendamento                                        │
│ [ ] Agendamento cancelado                                   │
│ [x] Mensagem recebida                                       │
│                                                             │
│                              [Cancelar]  [Salvar]           │
└─────────────────────────────────────────────────────────────┘
```

---

## Variacoes por Dominio

| Integracao | Clinica | Escola | E-commerce | SaaS |
|------------|---------|--------|------------|------|
| **WhatsApp** | Confirmacoes, bot | Comunicados | Pedidos | Suporte |
| **Google Calendar** | Agenda medico | - | - | Reunioes |
| **Pagamentos** | Consultas | Mensalidades | Checkout | Assinatura |
| **Webhooks** | Notificacoes | - | Pedidos | Eventos |

---

## Principios de Design

### 1. Status Visivel

Sempre mostrar claramente: conectado, desconectado, erro. Usar cores (verde, cinza, vermelho) e icones.

### 2. Erros Acionaveis

"Erro" nao ajuda. "Token expirado. Clique para reconectar" ajuda. Sempre oferecer acao.

### 3. Polling Moderado

QR Code precisa polling para detectar scan. Use intervalo razoavel (3-5s) e timeout (5min).

### 4. Seguranca de Tokens

- Nunca mostrar tokens completos na UI
- Armazenar criptografado
- Permitir revogar/regenerar

### 5. Admin Only (geralmente)

Integracoes afetam todo o sistema. Restringir a admins. Excecao: integracao pessoal (Google Calendar do usuario).

### 6. Degradacao Graceful

Se integracao falha, sistema continua funcionando sem ela. Nao travar funcionalidade principal.

---

## Anti-patterns

### "Mostrar token completo"
**Problema:** Seguranca comprometida se alguem ve a tela.
**Solucao:** Mostrar apenas ultimos 4 caracteres ou asteriscos.

### "Polling infinito"
**Problema:** Desperdicar recursos, lentidao.
**Solucao:** Timeout apos X minutos. Usuario pode reiniciar.

### "Erro generico"
**Problema:** Usuario nao sabe o que fazer.
**Solucao:** Mensagem especifica com acao sugerida.

### "Integracao obrigatoria"
**Problema:** Sistema nao funciona sem WhatsApp conectado.
**Solucao:** Funcionalidade principal deve funcionar sem integracoes.

---

## Exemplo: WhatsApp Completo

```
ESTADOS E TRANSICOES:

not_configured ─────[Gerar QR]────> connecting
connecting ─────[Scan OK]────> open
connecting ─────[Timeout]────> not_configured
open ─────[Sessao expirou]────> close
close ─────[Reconectar]────> connecting
open ─────[Desconectar]────> not_configured


UI POR ESTADO:

[not_configured]
┌────────────────────────────────────────┐
│ WhatsApp nao conectado                 │
│                                        │
│ Conecte seu WhatsApp para enviar       │
│ confirmacoes automaticas.              │
│                                        │
│              [Conectar]                │
└────────────────────────────────────────┘

[connecting]
┌────────────────────────────────────────┐
│ Escaneie o QR Code                     │
│                                        │
│         ┌──────────────┐               │
│         │   [QR CODE]  │               │
│         └──────────────┘               │
│                                        │
│ Aguardando... (expira em 4:32)         │
│                                        │
│              [Cancelar]                │
└────────────────────────────────────────┘

[open]
┌────────────────────────────────────────┐
│ ● WhatsApp Conectado                   │
│                                        │
│ [Avatar] +55 32 99999-0000             │
│          Nome do Perfil                │
│                                        │
│ [Desconectar]                          │
└────────────────────────────────────────┘

[close]
┌────────────────────────────────────────┐
│ ○ WhatsApp Desconectado                │
│                                        │
│ A sessao expirou. Reconecte para       │
│ continuar enviando mensagens.          │
│                                        │
│              [Reconectar]              │
└────────────────────────────────────────┘
```
