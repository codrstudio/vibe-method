# Iteracao 2: Fonte de Dados

## Objetivo

Conectar no MySQL do PrimeCare e popular biz.reports com relatorios pendentes.

```
[MySQL PrimeCare] → [Sync] → [biz.reports status=pending]
```

**Entrega:** Script que le do PrimeCare e popula biz.reports

---

# [x] - 2.1: Configurar conexao MySQL

**O que voce deve fazer:**

Configurar variaveis de ambiente para conexao com MySQL externo.

**Arquivo:** `.env.development` (adicionar)

**Conteudo esperado:**

```env
# PrimeCare MySQL (banco externo - somente leitura)
PRIMECARE_MYSQL_HOST=
PRIMECARE_MYSQL_PORT=3306
PRIMECARE_MYSQL_USER=
PRIMECARE_MYSQL_PASSWORD=
PRIMECARE_MYSQL_DATABASE=
```

---

**Prompt para IA:**

```
Use as variaveis de ambiente em .env.secrets BIZ_*
Crie um modulo de conexao em apps/backbone/src/lib/biz-primecare-db.ts
- Use mysql2/promise
- Pool de conexoes
- Funcao para testar conexao
- Exportar pool para uso em queries
- Prefixo Biz nos tipos exportados
```

---

# [x] - 2.2: Mapear estrutura PrimeCare

**Ja documentado em:** `database/primecare/`

Estrutura existente:
- `tables/` - SQL de todas as tabelas
- `entities/` - Documentacao das entidades
- `concepts/` - Conceitos do dominio

**Tabelas relevantes para relatorios:**
- `evolucao_guardiao_assistidos.sql` - Evolucoes do cuidador
- `evolucao_supervisor_assistidos.sql` - Evolucoes do supervisor
- `assistidos.sql` - Dados do assistido
- `rotinas.sql` - Rotinas registradas

---

# [x] - 2.3: Criar sync script

**O que voce deve fazer:**

Criar script que sincroniza relatorios do PrimeCare para biz.reports.

## Fluxo de Sincronizacao

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PrimeCare (MySQL)                            │
│                        [somente leitura]                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   evolucao_guardiao_assistidos        assistidos                    │
│   ┌─────────────────────────┐        ┌─────────────────┐            │
│   │ id                      │        │ id              │            │
│   │ assistido_id ───────────┼───────►│ nome            │            │
│   │ texto (relatorio)       │        │ apelido         │            │
│   │ turno                   │        │ condicoes       │            │
│   │ created_at              │        │ preferencias    │            │
│   └─────────────────────────┘        └─────────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Query: SELECT novos do turno
                              │ 2. JOIN: dados do assistido
                              │ 3. Mapear campos
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     biz-sync-primecare.ts                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Mapeamento:                                                       │
│   ┌────────────────────────┐    ┌────────────────────────┐          │
│   │ PrimeCare              │ →  │ biz.reports            │          │
│   ├────────────────────────┤    ├────────────────────────┤          │
│   │ evolucao.id            │    │ primecare_id           │          │
│   │ evolucao.texto         │    │ original_text          │          │
│   │ evolucao.turno         │    │ turno                  │          │
│   │ assistido.nome         │    │ assistido_nome         │          │
│   │ assistido.apelido      │    │ assistido_apelido      │          │
│   │ evolucao.created_at    │    │ created_at             │          │
│   │ -                       │    │ status = 'pending'     │          │
│   └────────────────────────┘    └────────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. Validar com BizReportInputSchema
                              │ 5. INSERT se primecare_id nao existe
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Nosso Banco (Postgres)                         │
│                        [leitura/escrita]                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   biz.reports                                                       │
│   ┌─────────────────────────────────────────┐                       │
│   │ id (uuid)                               │                       │
│   │ primecare_id (controle duplicacao) ◄────┼── novo campo          │
│   │ original_text                           │                       │
│   │ turno                                   │                       │
│   │ assistido_nome                          │                       │
│   │ status = 'pending'  ────────────────────┼── pronto p/ Writer    │
│   │ ...                                     │                       │
│   └─────────────────────────────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Controle de Duplicacao

Adicionar campo `primecare_id` em `biz.reports`:
- Armazena o ID original do PrimeCare
- UNIQUE constraint evita duplicatas
- Query: `WHERE primecare_id NOT IN (SELECT primecare_id FROM biz.reports)`

---

**Prompt para IA:**

```
Leia database/primecare/tables/ para entender a estrutura e crie:

1. Migration para adicionar campo primecare_id em biz.reports:
   - database/main/migrations/101_biz_reports_primecare_id.sql
   - Campo: primecare_id BIGINT UNIQUE (ID origem do PrimeCare)

2. Script em scripts/biz-sync-primecare.ts:
   - Conecta no MySQL via biz-primecare-db.ts
   - Query evolucoes do turno atual com JOIN assistidos
   - Filtra apenas IDs que nao existem em biz.reports
   - Mapeia e valida com BizReportInputSchema
   - Insere em biz.reports com status 'pending'
   - Log de quantos registros sincronizados

Usar:
- biz-primecare-db.ts para conexao MySQL (somente leitura)
- db (postgres) para inserir em biz.reports
- BizReportInputSchema para validar dados
```

---

# [x] - 2.4: Testar sync

**O que voce deve fazer:**

Executar sync e validar que dados foram populados.

**Comando:**

```bash
dotenv -o -e .env -e .env.development -e .env.secrets -- npx tsx scripts/biz-sync-primecare.ts
```

**Validar:**

```sql
SELECT * FROM biz.reports WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;
```

---

# Checklist Final

- [x] Conexao MySQL configurada e testada
- [x] Mapeamento PrimeCare documentado
- [x] Script de sync criado
- [x] Dados populados em biz.reports

---

# Arquivos

| Tipo | Arquivo | Quem |
|------|---------|------|
| Config | `.env.secrets` (vars MySQL) | Humano |
| Docs | `database/primecare/` | Ja existe |
| Codigo | `apps/backbone/src/lib/biz-primecare-db.ts` | IA |
| Codigo | `scripts/biz-sync-primecare.ts` | IA |

---

# Bloqueadores

- **Acesso ao MySQL PrimeCare** - Precisa de credenciais e IP liberado
