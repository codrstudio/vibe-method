# Entity Settings

Configuracoes da entidade principal do sistema - a "dona" de tudo.

---

## O Problema Universal

Todo sistema tem uma entidade que "possui" os dados e operacoes. Em multi-tenant, e o tenant. Em single-tenant, e a empresa/organizacao do usuario.

Sem configuracoes bem definidas dessa entidade, o sistema parece generico e impessoal.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Qual nome o usuario usa para "a empresa"?**
   - Clinica, escola, embarcacao, loja, workspace, organizacao?
   - Use esse nome na rota: `/settings/clinic`, `/settings/school`, etc.

2. **Quais dados identificam essa entidade?**
   - Nome e obrigatorio
   - CNPJ/documento fiscal? (Brasil: quase sempre)
   - Identificadores especificos do segmento?

3. **Existe endereco fisico?**
   - Se sim: rua, numero, bairro, cidade, estado, CEP
   - Link para Google Maps?
   - Ponto de referencia?

4. **Existe horario de funcionamento?**
   - Dias da semana com abertura/fechamento?
   - Periodos (letivos, safra, temporada)?
   - Feriados?

5. **Quais configuracoes sao especificas do segmento?**
   - Clinica: convenios aceitos, especialidades
   - Escola: niveis de ensino, turnos
   - Marinha: bandeira, capacidade, porto base
   - Delivery: raio de entrega, taxa minima

6. **Quem pode editar essas configuracoes?**
   - Geralmente: Admin e Gestor
   - Quem pode apenas VER?

---

## Anatomia

### Secoes Tipicas

```
┌─────────────────────────────────────────────────────┐
│ INFORMACOES BASICAS                                 │
│ Nome*, Documento fiscal, Contato                    │
├─────────────────────────────────────────────────────┤
│ LOCALIZACAO (se aplicavel)                          │
│ CEP, Endereco, Cidade, Estado, Maps                 │
├─────────────────────────────────────────────────────┤
│ HORARIOS (se aplicavel)                             │
│ Dias da semana, Abertura/Fechamento                 │
├─────────────────────────────────────────────────────┤
│ ESPECIFICO DO SEGMENTO                              │
│ [Campos que variam por dominio]                     │
└─────────────────────────────────────────────────────┘
```

### Organizacao em Abas

Para muitos campos, usar abas:

```
[Geral] [Localizacao] [Horarios] [Pagamentos] [Estrutura]
```

---

## Variacoes por Dominio

| Aspecto | Clinica | Escola | Marinha | SaaS B2B |
|---------|---------|--------|---------|----------|
| **Rota** | /settings/clinic | /settings/school | /settings/vessel | /settings/workspace |
| **Nome da aba** | Clinica | Escola | Embarcacao | Workspace |
| **Identificador** | CNPJ | CNPJ + Codigo MEC | Numero IMO | - |
| **Endereco** | Sim | Sim | Porto base | Nao |
| **Horario** | Funcionamento | Periodos letivos | Escalas | - |
| **Especifico** | Convenios, especialidades | Niveis, turnos, cursos | Bandeira, capacidade, tipo | Plano, limites, billing |

---

## Campos Comuns

### Informacoes Basicas

| Campo | Tipo | Obrigatorio | Notas |
|-------|------|-------------|-------|
| name | string | Sim | Nome de exibicao |
| phone | string | Nao | Telefone principal |
| phone_secondary | string | Nao | Telefone alternativo |
| email | string | Nao | Email de contato |
| document | string | Depende | CNPJ, IMO, etc. |

### Localizacao (se aplicavel)

| Campo | Tipo | Notas |
|-------|------|-------|
| address_zip | string | CEP - pode auto-completar |
| address_street | string | Rua/Avenida |
| address_number | string | Numero |
| address_complement | string | Complemento |
| address_neighborhood | string | Bairro |
| address_city | string | Cidade |
| address_state | string | UF (select) |
| address_reference | string | Ponto de referencia |
| address_maps_url | string | Link Google Maps |

### Horarios (se aplicavel)

| Campo | Tipo | Notas |
|-------|------|-------|
| hours | json | Objeto com dias e horarios |
| timezone | string | Fuso horario |

Estrutura tipica de `hours`:
```json
{
  "monday": { "open": "08:00", "close": "18:00" },
  "tuesday": { "open": "08:00", "close": "18:00" },
  "saturday": { "open": "08:00", "close": "12:00" },
  "sunday": null
}
```

---

## Principios de Design

### 1. Nome da Rota e do Dominio

A rota DEVE usar o vocabulario do usuario. `/settings/clinic` para clinica, `/settings/school` para escola. NUNCA `/settings/organization` generico.

### 2. Campos Condicionais

Nem todo campo faz sentido para todo dominio. Endereco e irrelevante para SaaS. Horario e irrelevante para operacoes 24h. Descubra antes de implementar.

### 3. Auto-complete de CEP

Para enderecos brasileiros, integrar com ViaCEP ou similar. Usuario digita CEP, sistema preenche rua/bairro/cidade/estado.

### 4. Validacao Contextual

- CNPJ: validar formato e digito verificador
- CEP: validar formato (99999-999)
- Email: validar formato
- Telefone: mascara apropriada

### 5. Permissao de Edicao

Muitos podem VER, poucos podem EDITAR. UI deve desabilitar campos ou esconder botao "Salvar" para quem nao pode editar.

---

## Anti-patterns

### "Vou chamar de Company"
**Problema:** Termo generico nao ressoa com usuario.
**Solucao:** Descubra como o usuario chama e use esse nome.

### "Todo mundo precisa de endereco"
**Problema:** Campos desnecessarios poluem a interface.
**Solucao:** So adicione campos que fazem sentido para o dominio.

### "Deixa tudo editavel"
**Problema:** Dados criticos podem ser alterados por engano.
**Solucao:** Restringir edicao a papeis apropriados.

### "Um formulario gigante"
**Problema:** Usuario se perde em dezenas de campos.
**Solucao:** Agrupar em abas ou secoes logicas.

---

## Exemplo: Estrutura para Clinica

```
/settings/clinic

[Informacoes] [Localizacao] [Horarios] [Pagamentos] [Estrutura]

INFORMACOES:
- Nome da clinica *
- Telefone
- WhatsApp
- Email
- CNPJ

LOCALIZACAO:
- CEP (auto-complete)
- Rua, Numero, Bairro
- Cidade, Estado
- Ponto de referencia
- Link Google Maps

HORARIOS:
- Segunda a Sexta: [toggle] [abertura] - [fechamento]
- Sabado: [toggle] [abertura] - [fechamento]
- Domingo: [toggle] fechado

PAGAMENTOS:
- Formas aceitas: [ ] Dinheiro [ ] Credito [ ] Debito [ ] PIX
- Parcelamento: [toggle] Ate [select] parcelas

ESTRUTURA:
- [ ] Laboratorio proprio
- [ ] Raio-X
- [ ] Ultrassom
- [ ] Acessibilidade
- Estacionamento: [select: Nao/Gratuito/Pago]
```

---

## Exemplo: Estrutura para SaaS B2B

```
/settings/workspace

[Geral] [Plano] [Limites] [Branding]

GERAL:
- Nome do workspace *
- Slug (URL)
- Fuso horario

PLANO:
- Plano atual: [badge]
- Valido ate: [data]
- [Upgrade] [Cancelar]

LIMITES:
- Usuarios: 5/10 usados
- Armazenamento: 2.3GB/5GB
- API calls: 8,234/10,000 (mes)

BRANDING:
- Logo
- Cor primaria
- Dominio customizado
```
