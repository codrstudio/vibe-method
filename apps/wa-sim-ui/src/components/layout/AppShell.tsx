import { Sidebar } from '../sidebar/Sidebar'
import { ChatArea } from '../chat/ChatArea'
import { useSocket } from '../../hooks/useSocket'
import { useContactStore } from '../../stores/contactStore'

export function AppShell() {
  // Inicializa conexao Socket
  useSocket()

  const { selectedContactId } = useContactStore()

  return (
    <div className="flex h-screen bg-wa-bg-header">
      {/* Sidebar - hidden on mobile when contact selected */}
      <aside className={`
        w-full md:w-[400px] border-r border-wa-border flex flex-col bg-wa-bg-sidebar
        ${selectedContactId ? 'hidden md:flex' : 'flex'}
      `}>
        <Sidebar />
      </aside>

      {/* Chat Area - hidden on mobile when no contact selected */}
      <main className={`
        flex-1 flex flex-col
        ${selectedContactId ? 'flex' : 'hidden md:flex'}
      `}>
        <ChatArea />
      </main>
    </div>
  )
}
