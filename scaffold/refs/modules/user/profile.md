# Profile

Dados pessoais e seguranca do usuario logado.

---

## O Problema Universal

Usuarios precisam gerenciar suas informacoes pessoais e seguranca. Sem uma area de perfil, dependem de admin para qualquer alteracao - ineficiente e frustrante.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Quais dados o usuario pode editar?**
   - Nome? (geralmente sim)
   - Email? (pode exigir verificacao)
   - Telefone?
   - Avatar/foto?

2. **Quais dados sao somente leitura?**
   - Email? (se usado como login)
   - Role/papel? (definido por admin)
   - ID/codigo?

3. **Como funciona a autenticacao?**
   - Senha tradicional?
   - OTP (email, SMS, WhatsApp)?
   - OAuth (Google, Microsoft)?
   - Multiplos metodos?

4. **Quais recursos de seguranca existem?**
   - Troca de senha?
   - 2FA/MFA?
   - Sessoes ativas?
   - Historico de acesso?

5. **Existe vinculo com outra entidade?**
   - Usuario e apenas "login" de um profissional?
   - Precisa exibir info da entidade vinculada?

6. **Avatar e configuravel?**
   - Upload de foto?
   - Gravatar?
   - Iniciais geradas?

---

## Anatomia

### Estrutura Tipica

```
┌─────────────────────────────────────────────────────────────┐
│ Meu Perfil                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ INFORMACOES PESSOAIS                                        │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                                                         ││
│ │     ┌───────┐                                           ││
│ │     │ Avatar│  Nome Completo                            ││
│ │     │  [📷] │  email@exemplo.com                        ││
│ │     └───────┘  Recepcionista                            ││
│ │                                                         ││
│ │ Nome                                                    ││
│ │ [Maria Silva_______________________________]            ││
│ │                                                         ││
│ │ Email                                                   ││
│ │ [maria@clinica.com_________________________] (readonly) ││
│ │                                                         ││
│ │ Telefone                                                ││
│ │ [(32) 99999-0000___________________________]            ││
│ │                                                         ││
│ │                                      [Salvar Alteracoes]││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ SEGURANCA                                                   │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                                                         ││
│ │ Senha                                                   ││
│ │ ●●●●●●●●                                   [Alterar]    ││
│ │                                                         ││
│ │ Autenticacao em duas etapas                             ││
│ │ Desativada                                 [Configurar] ││
│ │                                                         ││
│ │ Sessoes ativas                                          ││
│ │ 2 dispositivos                             [Gerenciar]  ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Secoes Tipicas

| Secao | Conteudo | Editavel |
|-------|----------|----------|
| **Informacoes pessoais** | Nome, email, telefone, avatar | Parcial |
| **Seguranca** | Senha, 2FA, sessoes | Sim |
| **Preferencias** | Idioma, tema, timezone | Sim |
| **Vinculo** | Info da entidade vinculada (medico, professor) | Nao |

---

## Variacoes por Dominio

| Aspecto | Clinica | Escola | SaaS | Marketplace |
|---------|---------|--------|------|-------------|
| **Vinculo** | Usuario-Medico | Usuario-Professor | - | Usuario-Vendedor |
| **Info extra** | CRM, especialidade | Disciplinas | Plano atual | Loja, ratings |
| **Avatar** | Opcional | Opcional | Recomendado | Obrigatorio |
| **2FA** | Opcional | Raro | Comum | Recomendado |
| **Sessoes** | Basico | Raro | Detalhado | Detalhado |

---

## Fluxos

### Editar Dados Pessoais

```
1. Usuario acessa /profile
2. Edita campos desejados
3. Clica "Salvar"
4. Sistema valida:
   - Campos obrigatorios preenchidos
   - Formato de email/telefone valido
5. Se valido → Salva e mostra "Alteracoes salvas"
6. Se invalido → Mostra erros especificos
```

### Alterar Senha

```
1. Usuario clica "Alterar senha"
2. Modal ou pagina abre
3. Preenche:
   - Senha atual (para confirmar identidade)
   - Nova senha
   - Confirmar nova senha
4. Sistema valida:
   - Senha atual correta
   - Nova senha atende requisitos
   - Confirmacao confere
5. Se valido → Atualiza e mostra "Senha alterada"
6. Opcionalmente encerra outras sessoes
```

### Alterar Avatar

```
1. Usuario clica no avatar ou icone de camera
2. Opcoes:
   - Upload de arquivo
   - Tirar foto (mobile)
   - Remover (voltar para iniciais)
3. Preview da imagem
4. Confirma
5. Sistema:
   - Redimensiona para tamanho padrao
   - Armazena (local ou CDN)
   - Atualiza referencia no banco
```

### Gerenciar Sessoes

```
1. Usuario clica "Gerenciar sessoes"
2. Lista de sessoes ativas:
   - Dispositivo/navegador
   - IP (opcional)
   - Ultima atividade
   - Localizacao aproximada (opcional)
3. Usuario pode:
   - Encerrar sessao especifica
   - Encerrar todas exceto atual
4. Sessao encerrada = usuario precisa fazer login novamente
```

---

## Seguranca

### Requisitos de Senha

Defina requisitos claros e mostre ao usuario:

```
Sua nova senha deve ter:
[✓] Minimo 8 caracteres
[✓] Pelo menos uma letra maiuscula
[✓] Pelo menos um numero
[ ] Pelo menos um caractere especial
```

### 2FA (Autenticacao em Duas Etapas)

**Metodos comuns:**
- App autenticador (Google Authenticator, Authy)
- SMS (menos seguro)
- Email (menos seguro)

**Fluxo de configuracao:**
```
1. Usuario clica "Configurar 2FA"
2. Escolhe metodo
3. Se app:
   - Mostra QR Code
   - Usuario escaneia
   - Digita codigo para confirmar
4. Sistema gera codigos de backup
5. Usuario salva codigos em local seguro
6. 2FA ativado
```

### Sessoes Ativas

```
┌─────────────────────────────────────────────────────────────┐
│ Sessoes Ativas                                       [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ● ESTA SESSAO                                               │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🖥️ Chrome no Windows                                    ││
│ │ Juiz de Fora, MG | ha 5 minutos                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ OUTRAS SESSOES                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 📱 Safari no iPhone                        [Encerrar]   ││
│ │ Juiz de Fora, MG | ha 2 horas                           ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 🖥️ Firefox no MacOS                        [Encerrar]   ││
│ │ Sao Paulo, SP | ha 3 dias                               ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│                          [Encerrar todas as outras sessoes] │
└─────────────────────────────────────────────────────────────┘
```

---

## Principios de Design

### 1. Feedback Imediato

Usuario deve saber que a acao funcionou. "Salvo com sucesso" ou erro especifico.

### 2. Confirmacao para Acoes Criticas

Alterar senha, encerrar sessoes, desativar 2FA - confirmar antes de executar.

### 3. Senha Atual para Mudancas Sensíveis

Mesmo logado, exigir senha atual antes de:
- Alterar senha
- Alterar email
- Desativar 2FA

Protege contra sessao sequestrada.

### 4. Avatar com Fallback

Se usuario nao tem foto, mostrar iniciais ou icone generico. Nunca imagem quebrada.

### 5. Mobile: Secoes Empilhadas

Em mobile, cada secao vira um card expandivel ou pagina separada.

### 6. Readonly Claro

Campos que usuario nao pode editar devem estar visivelmente desabilitados ou marcados.

---

## Anti-patterns

### "Editar email sem verificacao"
**Problema:** Usuario pode perder acesso se digitar errado.
**Solucao:** Enviar verificacao para novo email antes de atualizar.

### "Senha sem requisitos visiveis"
**Problema:** Usuario tenta senhas ate acertar.
**Solucao:** Mostrar requisitos em tempo real.

### "Alterar senha sem senha atual"
**Problema:** Se sessao foi sequestrada, atacante troca a senha.
**Solucao:** Sempre exigir senha atual.

### "Sessoes sem identificacao"
**Problema:** "3 sessoes ativas" - quais? onde?
**Solucao:** Mostrar dispositivo, local, ultima atividade.

### "2FA sem codigos de backup"
**Problema:** Usuario perde celular e fica sem acesso.
**Solucao:** Gerar codigos de backup na configuracao.

### "Avatar obrigatorio"
**Problema:** Usuario quer privacidade ou nao tem foto.
**Solucao:** Avatar opcional com fallback para iniciais.

---

## Exemplo: Profile de Clinica

```
/profile

┌─────────────────────────────────────────────────────────────┐
│ Meu Perfil                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                                                         ││
│ │   ┌─────────┐                                           ││
│ │   │   MS    │  Maria Silva                              ││
│ │   │   [📷]  │  maria@interclinicas.com                  ││
│ │   └─────────┘  Recepcionista                            ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ DADOS PESSOAIS                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                                                         ││
│ │ Nome completo                                           ││
│ │ [Maria Silva_______________________________]            ││
│ │                                                         ││
│ │ Email                                                   ││
│ │ [maria@interclinicas.com___________________] 🔒         ││
│ │ Para alterar o email, contate o administrador           ││
│ │                                                         ││
│ │ Telefone                                                ││
│ │ [(32) 99999-0000___________________________]            ││
│ │                                                         ││
│ │                                      [Salvar alteracoes]││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ SEGURANCA                                                   │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                                                         ││
│ │ Senha                                                   ││
│ │ Ultima alteracao: ha 30 dias               [Alterar]    ││
│ │                                                         ││
│ │ Sessoes ativas                                          ││
│ │ 2 dispositivos conectados                  [Gerenciar]  ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ VINCULO PROFISSIONAL                                        │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                                                         ││
│ │ Esta conta nao esta vinculada a um profissional.        ││
│ │                                                         ││
│ │ (Se voce e um medico ou profissional de saude,          ││
│ │  solicite o vinculo ao administrador)                   ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘

MODAL: ALTERAR SENHA
┌─────────────────────────────────────────────────────────────┐
│ Alterar Senha                                        [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Senha atual *                                               │
│ [________________________________] 👁                       │
│                                                             │
│ Nova senha *                                                │
│ [________________________________] 👁                       │
│                                                             │
│ Sua senha deve ter:                                         │
│ [✓] Minimo 8 caracteres                                    │
│ [✓] Pelo menos uma letra maiuscula                         │
│ [✓] Pelo menos um numero                                   │
│                                                             │
│ Confirmar nova senha *                                      │
│ [________________________________] 👁                       │
│                                                             │
│ [ ] Encerrar outras sessoes apos alterar                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancelar]  [Alterar Senha]    │
└─────────────────────────────────────────────────────────────┘
```
