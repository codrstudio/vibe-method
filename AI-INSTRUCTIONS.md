# AI Instructions

Formato e estrutura do arquivo `CLAUDE.md` - instruções para IA.

---

## Visão Geral

O `CLAUDE.md` é o arquivo de contexto que a IA lê ao iniciar uma sessão. Ele fornece todo o conhecimento necessário para a IA ser produtiva no projeto.

**Princípio**: A IA não conhece seu projeto. O CLAUDE.md é a única fonte de verdade.

---

## Estrutura Recomendada

```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Desenvolvimento Local
[Como rodar o projeto localmente]

## Comandos
[Scripts npm/make disponíveis]

## Arquitetura
[Diagrama e explicação dos componentes]

## Regras Críticas
[O que a IA NUNCA deve fazer]

## Variáveis de Ambiente
[Como funcionam os .env]

## Estrutura de Arquivos
[Mapa do projeto]

## Docker Init Containers
[Matriz de consistência entre ambientes - se aplicável]

## Troubleshooting
[Problemas comuns e soluções]

## Notas
[Regras gerais]
```

---

## Seções Detalhadas

### 1. Desenvolvimento Local

**Propósito**: A IA precisa saber como rodar o projeto.

```markdown
## Desenvolvimento Local

\`\`\`bash
# Comando para iniciar
npm run dev

# Comando para parar
npm run dev:stop
\`\`\`

### Portas

| Serviço | Porta |
|---------|-------|
| App | 3000 |
| API | 3001 |
| Database | 5432 |
```

### 2. Comandos

**Propósito**: Scripts disponíveis no projeto.

```markdown
## Comandos

\`\`\`bash
npm install          # Instalar dependências
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run test         # Rodar testes
npm run db:migrate   # Executar migrations
npm run db:seed      # Popular banco
\`\`\`
```

### 3. Arquitetura

**Propósito**: A IA precisa entender as partes do sistema.

```markdown
## Arquitetura

\`\`\`
┌─────────────┐     ┌─────────────┐
│   FRONTEND  │────►│   BACKEND   │
│  (Next.js)  │◄────│  (Node.js)  │
└─────────────┘     └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  DATABASE   │
                    │ (PostgreSQL)│
                    └─────────────┘
\`\`\`

| Componente | Tech | Descrição |
|------------|------|-----------|
| Frontend | Next.js 15 | Interface web |
| Backend | Node.js | API REST |
| Database | PostgreSQL | Persistência |
```

### 4. Regras Críticas

**Propósito**: O que a IA NUNCA deve fazer. Seja específico.

```markdown
## Regras Críticas

### Portas
**NUNCA** alterar as portas do projeto. Se ocupada, parar e reportar.

### Processos
**NUNCA** matar processos Node diretamente (kill, taskkill).

### Git
**PROIBIDO** usar comandos destrutivos:
- `git checkout` (sem branch)
- `git restore`
- `git clean`
- `git reset --hard`

### Secrets
**NUNCA** commitar arquivos com secrets:
- `.env.secrets`
- `.env.local`
- Arquivos com tokens/senhas
```

### 5. Variáveis de Ambiente

**Propósito**: Padrão de configuração do projeto.

```markdown
## Variáveis de Ambiente

\`\`\`
.env                # Config base (commitado)
.env.{environment}  # Por ambiente (commitado)
.env.secrets        # Secrets (NÃO commitado)
.env.example        # Template para novos devs
\`\`\`

**Regras:**
- NUNCA colocar secrets em `.env`
- `.env.secrets` sobrescreve tudo
- Copiar `.env.example` para `.env.secrets` e preencher
```

### 6. Estrutura de Arquivos

**Propósito**: Mapa do projeto para orientação.

```markdown
## Estrutura de Arquivos

\`\`\`
/
├── CLAUDE.md           # Este arquivo
├── PLAN.md             # Plano de execução atual
├── .env                # Config base
├── specs/              # Especificações
│   ├── user-stories.md
│   ├── requirements.md
│   └── design.md
├── app/                # Código fonte
├── database/           # Migrations
└── scripts/            # Automação
\`\`\`
```

### 7. Troubleshooting

**Propósito**: Problemas comuns que a IA vai encontrar.

```markdown
## Troubleshooting

### Porta ocupada
\`\`\`bash
# Verificar quem usa a porta
lsof -i :3000

# Parar container específico
docker stop container-name
\`\`\`

### Erro de conexão com banco
Verificar se DATABASE_URL está correto em `.env.secrets`.
```

### 8. Notas

**Propósito**: Regras gerais e lembretes.

```markdown
## Notas

- Arquivos temporários apenas em `.tmp/`
- Referências: `US001`, `REQ014`, `DES030`
- Sistema em pt-BR
- Encoding: UTF-8
```

### 9. Docker Init Containers

**Propósito**: Documentar containers de inicialização para garantir consistência entre ambientes.

**Quando usar**: Projetos com Docker Compose que possuem containers auxiliares de setup.

```markdown
## Docker Init Containers

Containers que executam uma vez para preparar o ambiente.

### Matriz de Consistência

| Container | dev | staging | production | Função |
|-----------|-----|---------|------------|--------|
| init | ✅ | ✅ | ✅ | Cria estrutura de pastas |
| evolution-init | ✅ | ✅ | ✅ | Configura WhatsApp |
| n8n-init | ✅ | ✅ | ✅ | Importa workflows |
| seed | ❌ | ✅ | ❌ | Popular banco (staging only) |

### Permissões por Ambiente

| Ambiente | Estratégia |
|----------|------------|
| **dev** | `chmod 777` (permissivo para desenvolvimento) |
| **staging/prod** | `chown` específico + `chmod` restritivo |

Exemplo production:
\`\`\`yaml
command: |
  sh -c "
    mkdir -p /data/redis /data/postgres /data/n8n &&
    chown -R 70:70 /data/postgres && chmod 700 /data/postgres &&
    chown -R 1000:1000 /data/n8n &&
    chmod -R 777 /data/redis &&
    echo 'Init complete'
  "
\`\`\`

### Regra de Ouro

**Ao criar/modificar um init container em um ambiente, SEMPRE verificar se os outros ambientes precisam da mesma alteração.**

Arquivos a verificar:
- `docker-compose.dev.yml`
- `docker-compose.staging.yml`
- `docker-compose.yml` (production)
```

**Por que documentar:**
- Init containers são invisíveis no dia-a-dia (rodam uma vez)
- Fácil esquecer de replicar em todos os ambientes
- Inconsistências causam bugs difíceis de debugar
- A matriz visual facilita auditoria

---

## Seções Opcionais

Dependendo do projeto, adicionar:

| Seção | Quando usar |
|-------|-------------|
| **Usuários de Teste** | App com autenticação |
| **Deploy** | Projeto com CI/CD |
| **APIs Externas** | Integrações |
| **Fluxo de Login** | Auth complexo (para Playwright) |
| **WhatsApp/Webhooks** | Integrações messaging |
| **Docker Init Containers** | Projetos com múltiplos docker-compose |

---

## Anti-patterns

**NÃO faça:**

```markdown
❌ Instruções vagas
"Cuidado com o banco de dados"

❌ Documentação extensa demais
[500 linhas de texto corrido]

❌ Informações desatualizadas
"Usar Node 14" (quando projeto usa Node 20)
```

**FAÇA:**

```markdown
✅ Instruções específicas
"NUNCA deletar registros da tabela users sem WHERE"

✅ Tabelas e listas
| Comando | Descrição |
|---------|-----------|
| npm run dev | Inicia desenvolvimento |

✅ Manter atualizado
Atualizar CLAUDE.md quando arquitetura mudar
```

---

## Checklist

### Novo Projeto
- [ ] CLAUDE.md criado na raiz
- [ ] Comandos de desenvolvimento documentados
- [ ] Portas listadas
- [ ] Arquitetura com diagrama
- [ ] Regras críticas definidas
- [ ] Estrutura de arquivos mapeada
- [ ] Docker init containers documentados (se aplicável)

### Manutenção
- [ ] CLAUDE.md atualizado quando arquitetura muda
- [ ] Novos comandos documentados
- [ ] Troubleshooting expandido conforme problemas surgem
- [ ] Matriz de init containers atualizada ao adicionar/remover containers
