# Vibe Tooling

Suite de ferramentas dev-time do **Vibe Method** para edição de artefatos.

## Filosofia

```
FULLSTACK ↔ engine ↔ ARTIFACT ↔ tooling ↔ BUSINESS
```

**Tooling** = ferramentas dev-time que permitem editar artefatos.
**Completamente isolado** do projeto principal.

## Requisitos

- Node.js 18+
- npm
- Navegador com suporte a File System Access API (Chrome, Edge)

## Uso

```bash
# Linux/macOS
./launch.sh

# Windows
npm install  # primeira vez
npm run dev
```

Acesse: http://localhost:5173

## Ferramentas Disponíveis

### Brand Editor

Editor visual para `specs/brand/*/brand.json`.

**Funcionalidades:**
- Listar todos os brands disponíveis
- Indicação clara do brand atual do sistema
- Editar paletas (light/dark) com color picker robusto
- Editar tokens semânticos
- Preview em tempo real
- Salvar direto no arquivo original
- Download de backup

**Operações:**
| CRUD | Suporte |
|------|---------|
| **R** - Read | Lista brands, indica atual |
| **U** - Update | Editor completo com save |
| **C** - Create | Não suportado ainda |
| **D** - Delete | Não suportado ainda |

## Stack

| Tech | Versão | Motivo |
|------|--------|--------|
| Vite | 5.x | Dev server rápido |
| React | 18.x | Componentes |
| TypeScript | 5.x | Type safety |
| Tailwind | 3.x | Styling |
| react-colorful | latest | Color picker |

## Estrutura

```
tooling/
├── launch.sh              # Script de inicialização
├── package.json           # Dependências isoladas
├── src/
│   ├── main.tsx
│   ├── App.tsx            # Layout ferramentaria + theme switch
│   ├── index.css
│   ├── hooks/
│   │   └── useTheme.ts    # Light/Dark/System
│   ├── components/
│   │   ├── ThemeSwitcher.tsx
│   │   └── ui/            # Componentes base
│   ├── lib/utils.ts
│   └── tools/
│       └── brand-editor/  # Primeira ferramenta
```

## Tema

Suporta três modos de tema:
- **Claro** - Tema light
- **Escuro** - Tema dark
- **Sistema** - Segue preferência do OS

A preferência é salva em `localStorage`.

## Adicionar Nova Ferramenta

1. Criar pasta em `src/tools/<nome>/`
2. Criar `index.tsx` como entry point
3. Adicionar no array `TOOLS` em `App.tsx`
