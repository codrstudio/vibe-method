import { Sidebar } from '../sidebar/Sidebar'
import { ChatArea } from '../chat/ChatArea'
import { useSocket } from '../../hooks/useSocket'

export function AppShell() {
  // Inicializa conexao Socket
  useSocket()

  return (
    <div className="flex h-screen bg-wa-bg-header">
      {/* Sidebar */}
      <aside className="w-[400px] border-r border-wa-border flex flex-col bg-white">
        <Sidebar />
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        <ChatArea />
      </main>
    </div>
  )
}
