# Plano: Menu Contextual com "Sair" no WhatsApp Simulator

## Objetivo
Adicionar forma de voltar para `/app` através de um menu contextual que:
- **Mobile**: aparece tanto na Sidebar quanto no ChatHeader
- **Desktop**: aparece apenas no ChatHeader (comportamento atual)

## Arquivos a Modificar

1. `apps/wa-sim-ui/src/components/sidebar/Sidebar.tsx`
2. `apps/wa-sim-ui/src/components/chat/ChatHeader.tsx`

## Implementação

### 1. Sidebar.tsx - Adicionar menu mobile-only

Adicionar botão de menu (⋮) que aparece apenas em mobile (`md:hidden`):

```tsx
// Novo estado
const [showMenu, setShowMenu] = useState(false)

// No header, após os botões existentes, adicionar:
<div className="relative md:hidden">
  <button
    onClick={() => setShowMenu(!showMenu)}
    className="p-2 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
    title="Menu"
  >
    <MoreVertical className="w-5 h-5" />
  </button>

  {showMenu && (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
      <div className="absolute right-0 top-full mt-1 bg-wa-bg-dropdown rounded-lg shadow-lg border border-wa-border py-1 z-20 min-w-[120px]">
        <button
          onClick={() => window.location.href = '/app'}
          className="w-full px-4 py-2 text-left text-sm text-wa-text-primary hover:bg-wa-bg-hover flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </>
  )}
</div>
```

### 2. ChatHeader.tsx - Adicionar opção "Sair" no menu existente

Adicionar item "Sair" como último item do menu dropdown existente:

```tsx
// Após o botão "Remover", adicionar separador e "Sair":
<div className="border-t border-wa-border my-1" />
<button
  onClick={() => window.location.href = '/app'}
  className="w-full px-4 py-2 text-left text-sm text-wa-text-primary hover:bg-wa-bg-hover flex items-center gap-2"
>
  <LogOut className="w-4 h-4" />
  Sair
</button>
```

## Imports Necessários

- **Sidebar.tsx**: Adicionar `MoreVertical, LogOut` ao import do lucide-react
- **ChatHeader.tsx**: Adicionar `LogOut` ao import do lucide-react

## Verificação

- [ ] Abrir http://localhost:8000/app/wa/channels/wa_xxx em viewport mobile (375px)
- [ ] Verificar que o menu (⋮) aparece na sidebar
- [ ] Clicar no menu e verificar opção "Sair"
- [ ] Clicar em "Sair" e verificar redirecionamento para `/app`
- [ ] Selecionar um contato, verificar menu no chat com opção "Sair"
- [ ] Redimensionar para desktop (1280px)
- [ ] Verificar que menu da sidebar não aparece em desktop
- [ ] Verificar que menu do chat continua funcionando com "Sair"
