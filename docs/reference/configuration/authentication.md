---
title: "Authentication Configuration"
description: "Setup completo das opcoes de login e metodos de autenticacao do sistema"
slug: "authentication"
category: "configuration"
tags: [authentication, login, security]
order: 1
toc: true
visible: true
searchable: true
keywords: [auth, login, jwt, otp, password, email, whatsapp, cpf, cnpj, cookie, session, token, AUTH_IDENTITY_ENABLED, AUTH_VALIDATION_ENABLED, OTP_LENGTH, JWT_SECRET]
status: published
version: "1.0"
related: [security/permissions, api/auth-endpoints]
---

# Authentication Configuration

Setup completo das opcoes de login e metodos de autenticacao do sistema.

---

## Visao Geral

O sistema de autenticacao e configurado por **variaveis de ambiente** que controlam:

1. **Identificadores** - Como o usuario se identifica (email, CPF/CNPJ)
2. **Metodos de Validacao** - Como confirma sua identidade (senha, OTP)
3. **Contextos** - Separacao entre equipe e cliente (JWT multi-contexto)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE LOGIN                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  IDENTIFICADOR        VALIDACAO           AUTENTICADO       │
│  ─────────────        ─────────           ────────────      │
│  - Email         →    - Password      →   JWT em cookie     │
│  - CPF/CNPJ           - OTP Email         httpOnly          │
│                       - OTP WhatsApp                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Identificadores

Controlam **qual campo** o usuario usa para se identificar na tela de login.

### Variaveis de Ambiente

| Variavel | Descricao | Valores |
|----------|-----------|---------|
| `AUTH_IDENTITY_METHODS` | Opcoes disponiveis no sistema | `email`, `document-id` |
| `AUTH_IDENTITY_ENABLED` | Opcoes habilitadas | Lista separada por virgula |
| `NEXT_PUBLIC_UI_ALLOW_CPF_CNPJ` | Exibe opcao CPF/CNPJ na UI | `true` ou `false` |

### Opcoes Disponiveis

| Identificador | Codigo | Descricao |
|---------------|--------|-----------|
| Email | `email` | Endereco de email do usuario |
| Documento | `document-id` | CPF ou CNPJ (Brasil) |

### Exemplos de Configuracao

```bash
# Apenas email (padrao)
AUTH_IDENTITY_ENABLED=email
NEXT_PUBLIC_UI_ALLOW_CPF_CNPJ=false

# Email + CPF/CNPJ
AUTH_IDENTITY_ENABLED=email,document-id
NEXT_PUBLIC_UI_ALLOW_CPF_CNPJ=true

# Apenas documento (sem email)
AUTH_IDENTITY_ENABLED=document-id
NEXT_PUBLIC_UI_ALLOW_CPF_CNPJ=true
```

> **Nota**: `NEXT_PUBLIC_UI_ALLOW_CPF_CNPJ` controla a UI do frontend. A variavel `AUTH_IDENTITY_ENABLED` e para validacao no backend.

---

## Metodos de Validacao

Controlam **como** o usuario confirma sua identidade apos informar o identificador.

### Variaveis de Ambiente

| Variavel | Descricao | Valores |
|----------|-----------|---------|
| `AUTH_VALIDATION_METHODS` | Opcoes disponiveis no sistema | `password`, `otp-email`, `otp-whatsapp` |
| `AUTH_VALIDATION_ENABLED` | Opcoes habilitadas | Lista separada por virgula |

### Opcoes Disponiveis

| Metodo | Codigo | Descricao |
|--------|--------|-----------|
| Senha | `password` | Senha cadastrada no sistema |
| OTP via Email | `otp-email` | Codigo de 6 digitos enviado por email |
| OTP via WhatsApp | `otp-whatsapp` | Codigo de 6 digitos enviado por WhatsApp |

### Exemplos de Configuracao

```bash
# Apenas senha
AUTH_VALIDATION_ENABLED=password

# Senha + OTP por email
AUTH_VALIDATION_ENABLED=password,otp-email

# Senha + ambos OTPs
AUTH_VALIDATION_ENABLED=password,otp-email,otp-whatsapp

# Apenas OTPs (passwordless)
AUTH_VALIDATION_ENABLED=otp-email,otp-whatsapp

# Apenas OTP por WhatsApp
AUTH_VALIDATION_ENABLED=otp-whatsapp
```

### Matriz de Combinacoes

| Cenario | `AUTH_VALIDATION_ENABLED` |
|---------|---------------------------|
| Tradicional (senha apenas) | `password` |
| Moderno (senha + email OTP) | `password,otp-email` |
| Completo (todos metodos) | `password,otp-email,otp-whatsapp` |
| Passwordless | `otp-email,otp-whatsapp` |
| WhatsApp-first | `otp-whatsapp,password` |

---

## Configuracao de OTP

Parametros especificos para autenticacao via codigo temporario.

### Variaveis de Ambiente

| Variavel | Descricao | Padrao | Valores |
|----------|-----------|--------|---------|
| `OTP_LENGTH` | Tamanho do codigo | `6` | 4-8 digitos |
| `OTP_TTL_MINUTES` | Tempo de validade | `5` | minutos |
| `OTP_MAX_ATTEMPTS` | Tentativas antes de bloquear | `3` | numero |
| `OTP_RATE_LIMIT_SECONDS` | Cooldown entre envios | `60` | segundos |

### Exemplo Completo

```bash
# Configuracao padrao
OTP_LENGTH=6
OTP_TTL_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_SECONDS=60
```

### Comportamento

1. Usuario solicita codigo OTP
2. Sistema gera codigo de `OTP_LENGTH` digitos
3. Codigo armazenado no Redis com TTL de `OTP_TTL_MINUTES`
4. Usuario tem `OTP_MAX_ATTEMPTS` tentativas para acertar
5. Novo codigo so pode ser solicitado apos `OTP_RATE_LIMIT_SECONDS`

```
Solicitacao    Tentativa 1    Tentativa 2    Tentativa 3    Bloqueado
    │              │              │              │              │
    ▼              ▼              ▼              ▼              ▼
 ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
 │ Gera │      │Errou │      │Errou │      │Errou │      │ Deve │
 │codigo│  →   │ 2    │  →   │ 1    │  →   │ 0    │  →   │pedir │
 │ OTP  │      │resta │      │resta │      │resta │      │ novo │
 └──────┘      └──────┘      └──────┘      └──────┘      └──────┘
```

---

## JWT Multi-Contexto

O sistema suporta dois contextos de autenticacao com configuracoes independentes.

### Contextos

| Contexto | Uso | Rotas |
|----------|-----|-------|
| **Team** | Equipe interna | `/dashboard`, `/hub`, `/app` |
| **Customer** | Portal do cliente | `/portal/*` |

### Variaveis por Contexto

#### Contexto Team (Equipe)

```bash
JWT_SECRET_TEAM=chave-secreta-minimo-32-caracteres
JWT_ACCESS_TTL_TEAM=900          # 15 minutos
JWT_REFRESH_TTL_TEAM=86400       # 24 horas
AUTH_COOKIE_ACCESS_TEAM=access-team
AUTH_COOKIE_REFRESH_TEAM=refresh-team
```

#### Contexto Customer (Cliente)

```bash
JWT_SECRET_CUSTOMER=outra-chave-secreta-32-caracteres
JWT_ACCESS_TTL_CUSTOMER=900      # 15 minutos
JWT_REFRESH_TTL_CUSTOMER=604800  # 7 dias
AUTH_COOKIE_ACCESS_CUSTOMER=access-customer
AUTH_COOKIE_REFRESH_CUSTOMER=refresh-customer
```

### Comparativo

| Aspecto | Team | Customer |
|---------|------|----------|
| Access Token TTL | 15 min | 15 min |
| Refresh Token TTL | 24 horas | 7 dias |
| Cookie Access | `access-team` | `access-customer` |
| Cookie Refresh | `refresh-team` | `refresh-customer` |
| JWT Secret | Separado | Separado |

> **Seguranca**: Cada contexto usa uma chave JWT diferente. Comprometimento de uma chave nao afeta o outro contexto.

---

## Configuracao Completa

Exemplo de `.env` com todas as variaveis de autenticacao:

```bash
# =============================================================================
# Authentication - Identificadores
# =============================================================================
AUTH_IDENTITY_METHODS=email,document-id
AUTH_IDENTITY_ENABLED=email
NEXT_PUBLIC_UI_ALLOW_CPF_CNPJ=false

# =============================================================================
# Authentication - Metodos de Validacao
# =============================================================================
AUTH_VALIDATION_METHODS=password,otp-email,otp-whatsapp
AUTH_VALIDATION_ENABLED=password,otp-email

# =============================================================================
# Authentication - OTP Settings
# =============================================================================
OTP_LENGTH=6
OTP_TTL_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_SECONDS=60

# =============================================================================
# Authentication - JWT Team Context
# =============================================================================
JWT_SECRET_TEAM=sua-chave-secreta-team-minimo-32-chars
JWT_ACCESS_TTL_TEAM=900
JWT_REFRESH_TTL_TEAM=86400
AUTH_COOKIE_ACCESS_TEAM=access-team
AUTH_COOKIE_REFRESH_TEAM=refresh-team

# =============================================================================
# Authentication - JWT Customer Context
# =============================================================================
JWT_SECRET_CUSTOMER=sua-chave-secreta-customer-32-chars
JWT_ACCESS_TTL_CUSTOMER=900
JWT_REFRESH_TTL_CUSTOMER=604800
AUTH_COOKIE_ACCESS_CUSTOMER=access-customer
AUTH_COOKIE_REFRESH_CUSTOMER=refresh-customer
```

---

## Gerando Chaves JWT

Use OpenSSL para gerar chaves seguras:

```bash
# Gerar chave de 32 bytes (256 bits)
openssl rand -base64 32

# Exemplo de saida
# K7xZ9pQmN3vL2wY8hR4tF6jB0cD5eA1gM9sU7iO3nP0=
```

> **Importante**: Nunca commite chaves JWT no repositorio. Use `.env.secrets` ou secrets manager.

---

## Endpoints de API

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/api/auth/login` | POST | Login com senha |
| `/api/auth/logout` | POST | Encerra sessao |
| `/api/auth/refresh` | POST | Renova access token |
| `/api/auth/me` | GET | Retorna usuario atual |
| `/api/auth/otp/request` | POST | Solicita codigo OTP |
| `/api/auth/otp/verify` | POST | Valida codigo OTP |

---

## Arquivos Relacionados

| Arquivo | Descricao |
|---------|-----------|
| `apps/app/app/(auth)/login/page.tsx` | UI de login |
| `apps/app/lib/auth/config.ts` | Configuracao de auth |
| `apps/app/middleware.ts` | Protecao de rotas |
| `apps/backbone/src/services/auth/otp.ts` | Servico OTP |
| `apps/backbone/src/routes/auth.ts` | Rotas de auth no backend |
| `specs/messages/otp-login.yaml` | Template de email OTP |

---

## Checklist de Configuracao

- [ ] Definir identificadores habilitados (`AUTH_IDENTITY_ENABLED`)
- [ ] Definir metodos de validacao (`AUTH_VALIDATION_ENABLED`)
- [ ] Configurar parametros OTP se usar OTP
- [ ] Gerar chaves JWT para cada contexto
- [ ] Configurar TTLs adequados ao caso de uso
- [ ] Testar fluxo completo de login
- [ ] Verificar templates de email/WhatsApp OTP
