# Knowledge Base (KB)

Repositorio de documentacao com retrieval inteligente.

---

## Visao Geral

**KB** é a camada de documentacao do sistema. Armazena, indexa e serve documentos markdown para usuarios e agentes.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   EXTRACTION    │ ───► │    INDEXING     │ ───► │    RETRIEVAL    │
│                 │      │                 │      │                 │
│ Source → Folder │      │ Folder → DB     │      │ DB → API        │
│ GitLab/GitHub   │      │ Detecta mudanca │      │ Browse/Search   │
│ Full download   │      │ Metadata + FTS  │      │ Resolve links   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

| Aspecto | Valor |
|---------|-------|
| Localizacao | `apps/docs/` |
| Framework | Fastify |
| Porta (dev) | X075 |
| Storage | Volume Docker `/docs` |

### Desacoplamento

- **Extraction** nao sabe de Indexing
- **Indexing** nao sabe de Extraction (so observa a pasta)
- **Retrieval** nao sabe de nenhum dos dois (so consulta DB)

---

## Relacao com Agents

```
Agents = Consomem KB (retrieval)
KB = Fornece contexto (documentos)
```

O Copilot **consulta** KB para responder perguntas.
O Copilot **nunca** indexa ou extrai documentos.

```
┌─────────────┐                    ┌─────────────┐
│ apps/agents │───── search ──────▶│  apps/docs  │
│  (Copilot)  │◀──── results ──────│    (KB)     │
└─────────────┘                    └─────────────┘
```

---

## Hierarquia

```
Grupo (ex: "ajuda", "produto")
└── Library (ex: "manual", "api-docs")
    └── Documentos e anexos
```

### Estrutura de Armazenamento

```
/docs/{group}/{slug}/*.*
/docs/{group}/{slug}/_library.json  ← arquivo de controle
```

Exemplos:
- `/docs/ajuda/manual/README.md`
- `/docs/ajuda/manual/_library.json`
- `/docs/produto/api/endpoints/users.md`

---

## Tipos de Library

| Tipo | Pipeline | Indexing | Config UI |
|------|----------|----------|-----------|
| `builtin` | Nao tem (ja no compose) | Normal | Nao aparece |
| `synced` | GitLab/GitHub API | Normal | Configuravel |

### Builtin

Documentacao que ja vem com o sistema. Imutavel, sem sync.

```json
{
  "source": { "type": "builtin" }
}
```

### Synced

Documentacao sincronizada de repositorios externos.

```json
{
  "source": {
    "type": "gitlab",
    "project_id": 123,
    "branch": "main"
  }
}
```

---

## Estrutura de Pastas

```
apps/docs/
├── src/
│   ├── index.ts                    # Fastify server
│   ├── config.ts                   # Configuracao
│   │
│   ├── indexing/                   # Camada INDEXING
│   │   ├── index.ts                # Orchestrador
│   │   ├── scanner.ts              # Detecta mudancas via _library.json
│   │   └── parser.ts               # Extrai frontmatter, wikilinks
│   │
│   ├── pipeline/                   # Camada EXTRACTION
│   │   ├── collector.ts            # Download de fontes externas
│   │   ├── extractor.ts            # Processa arquivos
│   │   └── manifest.ts             # Gera _library.json
│   │
│   ├── retrieval/                  # Camada RETRIEVAL
│   │   ├── index.ts                # Browse, search, fetch
│   │   └── wikilink.ts             # Resolucao de links
│   │
│   ├── routes/                     # HTTP endpoints
│   │   ├── documents.ts            # GET /documents, /browse, /search
│   │   ├── libraries.ts            # CRUD libraries
│   │   ├── groups.ts               # CRUD groups
│   │   └── connectors.ts           # CRUD connectors
│   │
│   ├── jobs/                       # Tarefas agendadas
│   │   ├── index-scan.ts           # Polling de _library.json
│   │   └── sync.ts                 # Sync periodico
│   │
│   ├── services/                   # Logica de dominio
│   │   └── markdown.ts             # Renderizacao
│   │
│   └── db/
│       ├── index.ts
│       └── queries/
│           ├── documents.ts
│           ├── libraries.ts
│           └── groups.ts
│
└── package.json
```

---

## Proposito de Cada Pasta

### indexing/

**O que:** Detecta mudancas e indexa documentos no banco.

**Por que:** Separar deteccao de mudanca (checksum) do processamento (parse). Scanner observa `_library.json`, parser extrai metadata.

**Quando criar:** Novo tipo de processamento de documento.

```
indexing/
├── scanner.ts    # Compara checksums
├── parser.ts     # Extrai frontmatter, wikilinks
└── resolver.ts   # Resolve up/related links
```

---

### pipeline/

**O que:** Coleta documentos de fontes externas.

**Por que:** Isolar logica de integracao (GitLab, GitHub). Collector faz download, extractor processa, manifest gera `_library.json`.

**Quando criar:** Nova fonte de documentacao.

```
pipeline/
├── collector.ts   # Download via API
├── extractor.ts   # Unzip, organiza arquivos
└── manifest.ts    # Gera _library.json
```

---

### retrieval/

**O que:** Serve documentos para consumidores.

**Por que:** API unica para browse, search, fetch. Wikilink resolver permite navegacao estilo Obsidian.

**Quando criar:** Novo metodo de acesso a documentos.

```
retrieval/
├── index.ts      # Browse por audience/library/tags
├── search.ts     # Full-text search
└── wikilink.ts   # Resolve [[links]]
```

---

### jobs/

**O que:** Tarefas periodicas.

**Por que:** Index-scan verifica mudancas a cada minuto. Sync executa conforme cron de cada library.

**Quando criar:** Nova tarefa periodica.

```
jobs/
├── index-scan.ts   # Polling de checksums
└── sync.ts         # Sync de libraries
```

---

## Arquivo de Controle

Cada library tem um `_library.json` na raiz que controla a indexacao.

### Estrutura

```json
{
  "version": 1,
  "extracted_at": "2026-01-13T15:30:00Z",
  "source": {
    "type": "gitlab",
    "project_id": 123,
    "branch": "main",
    "commit": "abc123"
  },
  "files": [
    { "path": "README.md", "hash": "sha256:abc...", "size": 1234 },
    { "path": "guides/setup.md", "hash": "sha256:def...", "size": 567 }
  ],
  "checksum": "sha256:xyz..."
}
```

### Fluxo

```
1. EXTRACTION gera/atualiza _library.json apos download
2. INDEXING detecta mudanca no checksum (polling 1 min)
3. INDEXING processa apenas arquivos alterados (diff via files[])
```

---

## Indexacao em 3 Trilhos

```
┌───────────────┬───────────────┬─────────────────────────────────┐
│   TRILHO 1    │   TRILHO 2    │           TRILHO 3              │
│   Estrutura   │   Metadata    │          Full-text              │
├───────────────┼───────────────┼─────────────────────────────────┤
│ Instantanea   │ Rapida        │ Background                      │
├───────────────┼───────────────┼─────────────────────────────────┤
│ Indexa:       │ Indexa:       │ Indexa:                         │
│ - filename    │ - Frontmatter │ - Chunks de texto               │
│ - parent_path │ - up/related  │ - Meilisearch                   │
│ - Estrutura   │ - Tags        │                                 │
├───────────────┼───────────────┼─────────────────────────────────┤
│ Output:       │ Output:       │ Output:                         │
│ Arvore de     │ Filtros,      │ Busca textual                   │
│ navegacao     │ wikilinks     │                                 │
├───────────────┼───────────────┼─────────────────────────────────┤
│ Tolerancia:   │ Tolerancia:   │ Tolerancia:                     │
│ ZERO          │ Baixa         │ Alta                            │
└───────────────┴───────────────┴─────────────────────────────────┘
```

**Regra:** Trilhos 1 e 2 sao sincronos. Trilho 3 pode falhar sem impactar navegacao.

---

## Wikilinks

Suporte a links no formato Obsidian.

### Formatos Suportados

| Formato | Exemplo |
|---------|---------|
| Simples | `[[Setup]]` |
| Com pasta | `[[guides/Setup]]` |
| Relativo | `[[../api/Users]]` |
| Com alias | `[[Setup\|Configuracao Inicial]]` |

### Algoritmo de Resolucao

```
1. Parse wikilink
2. Se path relativo (../) → resolver diretamente
3. Se contem "/" → buscar por sufixo de path
4. Buscar por filename (exact → normalized)
5. Se multiplos → desambiguar por proximidade (ancestrais em comum)
```

### Campos de Relacionamento

| Campo | Direcao | Descricao |
|-------|---------|-----------|
| `up_links` | Documento → Pais | Hierarquia logica |
| `related_links` | Documento ↔ Relacionados | Links bidirecionais |
| `backlinks` | Quem menciona → Documento | Calculado em runtime |

---

## Frontmatter YAML

Documentos markdown suportam frontmatter para metadata estruturada.

### Formato

```markdown
---
title: Como criar uma thread
description: Guia passo a passo
tags: [threads, basico, iniciante]
audience: [atendentes, gestores]
aliases: [criar thread, nova thread]
up: ["[[Guias]]", "[[Documentacao]]"]
related: ["[[Como fechar thread]]", "[[SLA]]"]
---

# Conteudo do documento...
```

### Campos Suportados

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `title` | string | Titulo do documento |
| `description` | string | Descricao curta |
| `tags` | string[] | Tags para busca e filtro |
| `audience` | string[] | Categorias de audiencia |
| `aliases` | string[] | Nomes alternativos para resolucao |
| `up` | string[] | Documentos pais (wikilinks) |
| `related` | string[] | Documentos relacionados (wikilinks) |

---

## Conectores

Abstracao para fontes externas de documentacao.

### Schema

```typescript
interface Connector {
  id: string;
  name: string;
  type: 'gitlab' | 'github';
  config: {
    url: string;      // URL da instancia
    token: string;    // Access token
  };
  is_active: boolean;
  last_test_at: Date | null;
  last_test_status: 'success' | 'error' | null;
}
```

### Fluxo de Sync

```
1. Job dispara sync (cron ou manual)
2. Busca conector da library
3. GET /api/v4/projects/{project_id}/repository/archive
4. Extrai tarball na pasta da library
5. Gera _library.json com manifest
6. Indexing detecta mudanca e processa
```

**Regra:** Sempre usar ID numerico do projeto. Nunca usar path com `/`.

---

## Interface

### Paginas

| Pagina | Funcao |
|--------|--------|
| `/hub/docs` | Browse documentos por audience |
| `/hub/settings/docs` | CRUD Libraries + Groups |
| `/hub/settings/connectors` | CRUD Conectores |

### Componentes Principais

| Componente | Responsabilidade |
|------------|------------------|
| `LibraryBrowser` | Layout principal + navegacao |
| `DocumentTree` | Arvore hierarquica de pastas/arquivos |
| `DocumentViewer` | Renderiza markdown + wikilinks |
| `SearchBar` | Busca com autocomplete |
| `TagFilter` | Filtro por tags |
| `Breadcrumb` | Navegacao hierarquica |
| `RelatedDocs` | Sidebar com up/related/backlinks |

### Hooks (TanStack Query)

| Hook | Funcao |
|------|--------|
| `useDocsLibraries` | CRUD libraries |
| `useDocsDocuments` | Browse, fetch, search |
| `useDocsGroups` | CRUD groups |
| `useConnectors` | CRUD connectors |

---

## Volume Docker

O diretorio `/docs` é montado como volume para persistencia.

```yaml
# docker-compose.yml
services:
  docs:
    volumes:
      - ./data/docs:/docs
```

O volume contem **tudo**: builtin + synced libraries.

---

## Schemas

### Library

```typescript
interface Library {
  id: string;
  name: string;
  slug: string;                           // URL-safe
  description: string | null;

  // Organizacao
  group_id: string | null;
  type: 'builtin' | 'synced';

  // Fonte externa (se synced)
  connector_id: string | null;
  project_id: number | null;              // ID numerico GitLab/GitHub
  source_repo: string;                    // "org/repo"
  source_path: string;                    // "/docs"
  source_branch: string;                  // "main"

  // Audiencias
  audiences: ('devops' | 'customers' | 'copilot')[];

  // Sync
  sync_enabled: boolean;
  sync_cron: string;                      // "0 */6 * * *"
  last_sync_at: Date | null;
  last_sync_status: 'success' | 'error' | 'running' | null;

  // Indexacao
  last_indexed_checksum: string | null;
  last_indexed_at: Date | null;
  document_count: number;
}
```

### Document

```typescript
interface Document {
  id: string;
  library_id: string;

  // Caminho
  relative_path: string;                  // "guides/setup.md"
  filename: string;
  filename_normalized: string;            // lowercase, spaces → _
  parent_path: string;

  // Conteudo
  title: string | null;
  content: string;
  frontmatter: Record<string, unknown>;
  tags: string[];

  // Wikilinks
  aliases: string[];
  up_links: string[];
  related_links: string[];
}
```

### Group

```typescript
interface Group {
  id: string;
  name: string;
  slug: string;
}
```

---

## Checklist - Nova Library

- [ ] Criar grupo se necessario (Settings > Docs)
- [ ] Criar conector se synced (Settings > Connectors)
- [ ] Testar conexao do conector
- [ ] Criar library (Settings > Docs)
- [ ] Configurar source_repo, source_path, source_branch
- [ ] Definir audiences
- [ ] Configurar sync_cron se automatico
- [ ] Executar sync manual para validar
- [ ] Verificar documentos indexados

---

## Boas Praticas

### DO

- Usar `_library.json` como fonte de verdade para indexacao
- Separar as 3 camadas (extraction, indexing, retrieval)
- Implementar fallback no Trilho 3 (full-text pode falhar)
- Usar ID numerico do projeto (nunca path com `/`)
- Validar frontmatter com schema Zod
- Cachear resolucao de wikilinks

### DON'T

- Indexar diretamente de fonte externa (sempre via pasta local)
- Bypassar `_library.json` para detectar mudancas
- Usar path do projeto na URL do GitLab (`%2F` quebra no Nginx)
- Bloquear navegacao se full-text falhar
- Hardcodar audiences (usar enum do schema)
- Misturar logica de extraction em retrieval
