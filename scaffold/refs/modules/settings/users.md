# Users Settings

Gestao de usuarios que acessam o sistema.

---

## O Problema Universal

Sistemas multi-usuario precisam controlar quem acessa e o que cada um pode fazer. Sem gestao de usuarios, ou todos podem tudo (inseguro) ou ninguem pode nada (improdutivo).

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Quais papeis existem na operacao?**
   - Nao assuma (admin/user). Pergunte ao cliente.
   - Exemplos: dono, gestor, recepcionista, tecnico, visualizador

2. **Como usuarios sao criados?**
   - Admin cria manualmente?
   - Convite por email?
   - Auto-registro?

3. **Que dados do usuario sao necessarios?**
   - Nome, email (minimo)
   - Telefone, avatar?
   - Vinculo com outra entidade? (medico → provider)

4. **Como funciona a autenticacao?**
   - Senha tradicional?
   - OTP por email/SMS/WhatsApp?
   - SSO/OAuth?

5. **Como resetar acesso?**
   - Admin gera nova senha?
   - Envia codigo por email/WhatsApp?
   - Link de recuperacao?

6. **Usuarios podem ser desativados?**
   - Soft delete (desativa) vs hard delete?
   - O que acontece com dados vinculados?

7. **Quem pode gerenciar usuarios?**
   - Apenas admin?
   - Gestores de equipe?

---

## Anatomia

### Listagem de Usuarios

```
┌─────────────────────────────────────────────────────────────┐
│ Usuarios                               [+ Novo Usuario]     │
├─────────────────────────────────────────────────────────────┤
│ [Grid/Lista toggle]                    [Filtros] [Busca]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Avatar  │  │ Avatar  │  │ Avatar  │  │ Avatar  │       │
│  │ Nome    │  │ Nome    │  │ Nome    │  │ Nome    │       │
│  │ [Role]  │  │ [Role]  │  │ [Role]  │  │ [Role]  │       │
│  │ email   │  │ email   │  │ email   │  │ email   │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Modal de Criacao/Edicao

```
┌─────────────────────────────────────────────────────────────┐
│ Novo Usuario                                         [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nome *                                                      │
│ [________________________]                                  │
│                                                             │
│ Email *                                                     │
│ [________________________]                                  │
│                                                             │
│ Telefone                                                    │
│ [________________________]                                  │
│                                                             │
│ Papeis *                                                    │
│ [ ] Admin    [ ] Gestor    [ ] Operador                    │
│                                                             │
│ Vinculo (se aplicavel)                                      │
│ [Select: Vincular a profissional...]                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancelar]  [Criar Usuario]    │
└─────────────────────────────────────────────────────────────┘
```

### Acoes por Usuario

| Acao | Quando Disponivel |
|------|-------------------|
| Editar | Sempre (para quem pode) |
| Resetar Acesso | Usuario ativo |
| Desativar | Usuario ativo, nao e o proprio |
| Reativar | Usuario desativado |

---

## Variacoes por Dominio

| Aspecto | Clinica | Escola | SaaS B2B |
|---------|---------|--------|----------|
| **Papeis tipicos** | admin, gestor, recepcionista, medico | admin, diretor, professor, secretaria | admin, membro, visualizador |
| **Vinculo** | Usuario-Medico (provider) | Usuario-Professor | - |
| **Convite** | Admin cria | Admin cria | Convite por email |
| **Reset** | Senha ou WhatsApp OTP | Senha ou Email OTP | Email link |

---

## Campos do Usuario

### Obrigatorios

| Campo | Tipo | Notas |
|-------|------|-------|
| name | string | Nome de exibicao |
| email | string | Unico, usado para login |
| roles | string[] | Lista de papeis |

### Opcionais

| Campo | Tipo | Notas |
|-------|------|-------|
| phone | string | Para OTP ou contato |
| avatar_url | string | Foto do perfil |
| provider_id | uuid | Vinculo com entidade (medico, professor) |
| is_active | boolean | Soft delete |
| must_change_password | boolean | Forca troca no proximo login |

---

## Fluxos

### Criar Usuario

```
1. Admin clica "Novo Usuario"
2. Preenche nome, email, papeis
3. Sistema cria usuario com senha temporaria
4. Modal mostra senha para copiar
5. Admin envia credenciais ao usuario (fora do sistema)
6. Usuario faz login e troca senha (must_change_password)
```

### Resetar Acesso

```
1. Admin clica "Resetar Acesso" no usuario
2. Escolhe metodo: Nova Senha ou OTP
3. Se Nova Senha:
   - Sistema gera senha temporaria
   - Modal mostra para copiar
4. Se OTP:
   - Escolhe canal: Email, WhatsApp, SMS
   - Sistema envia codigo
5. Usuario usa credencial para acessar
```

### Desativar Usuario

```
1. Admin clica "Desativar"
2. Confirmacao: "Usuario nao podera mais acessar"
3. Sistema marca is_active = false
4. Usuario aparece em "Desativados" ou some da lista
5. Dados vinculados permanecem (soft delete)
```

---

## Principios de Design

### 1. Papeis sao do Dominio

Nao use "admin/user" generico. Descubra os papeis reais: recepcionista, medico, gestor. Use esses nomes na UI.

### 2. Multi-Role

Um usuario pode ter multiplos papeis. Medico que tambem e gestor. Use checkboxes, nao radio buttons.

### 3. Vinculo com Entidades

Em alguns dominios, usuario e apenas "acesso" para outra entidade. Medico existe independente do usuario. O usuario e o "login" do medico.

### 4. Senha Temporaria Visivel

Ao criar usuario, mostre a senha temporaria uma unica vez. Nao envie por email automaticamente (pode ser interceptado).

### 5. Soft Delete

Nunca delete usuarios permanentemente. Desative. Dados historicos dependem do usuario existir.

### 6. Nao Edite o Proprio

Admin nao deve poder desativar a si mesmo. Previna acoes destrutivas no proprio usuario.

---

## Anti-patterns

### "Roles fixos: admin e user"
**Problema:** Nao reflete a realidade do negocio.
**Solucao:** Descubra os papeis reais e use-os.

### "Enviar senha por email"
**Problema:** Email pode ser interceptado.
**Solucao:** Mostre senha uma vez na tela. Admin copia e envia por canal seguro.

### "Delete permanente"
**Problema:** Dados historicos ficam orfaos.
**Solucao:** Soft delete (is_active = false).

### "Criar usuario sem senha"
**Problema:** Conta fica acessivel sem autenticacao.
**Solucao:** Sempre gerar senha temporaria ou enviar convite com link unico.

---

## Exemplo: Fluxo Completo

```
CENARIO: Clinica contrata nova recepcionista

1. Admin acessa /settings/users
2. Clica [+ Novo Usuario]
3. Preenche:
   - Nome: Maria Silva
   - Email: maria@email.com
   - Telefone: (32) 99999-0000
   - Papeis: [x] Recepcionista
4. Clica [Criar Usuario]
5. Modal aparece:
   ┌────────────────────────────────────────┐
   │ Usuario criado com sucesso!            │
   │                                        │
   │ Senha temporaria:                      │
   │ ┌──────────────────────────────────┐  │
   │ │ Abc12345                    [Copy]│  │
   │ └──────────────────────────────────┘  │
   │                                        │
   │ Envie estas credenciais para o        │
   │ usuario. Ele devera trocar a senha    │
   │ no primeiro acesso.                   │
   │                                        │
   │                           [Fechar]     │
   └────────────────────────────────────────┘
6. Admin envia credenciais via WhatsApp para Maria
7. Maria faz login com email + senha temporaria
8. Sistema forca troca de senha
9. Maria define nova senha e acessa o sistema
```
