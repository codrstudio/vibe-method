import { useContactStore } from '../../stores/contactStore'
import { useChatStore } from '../../stores/chatStore'
import { ContactItem } from './ContactItem'

interface ContactListProps {
  searchFilter: string
}

export function ContactList({ searchFilter }: ContactListProps) {
  const { contacts, selectedContactId, setSelectedContact } = useContactStore()
  const { messagesByContact, unreadByContact, markAsRead } = useChatStore()

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    contact.phone.includes(searchFilter)
  )

  // Ordena por ultima mensagem
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const messagesA = messagesByContact[a.id] || []
    const messagesB = messagesByContact[b.id] || []
    const lastA = messagesA[messagesA.length - 1]
    const lastB = messagesB[messagesB.length - 1]

    if (!lastA && !lastB) return 0
    if (!lastA) return 1
    if (!lastB) return -1

    return new Date(lastB.timestamp).getTime() - new Date(lastA.timestamp).getTime()
  })

  function handleSelectContact(contactId: string) {
    setSelectedContact(contactId)
    markAsRead(contactId)
  }

  if (sortedContacts.length === 0) {
    return (
      <div className="p-4 text-center text-wa-text-secondary">
        Nenhum contato encontrado
      </div>
    )
  }

  return (
    <div>
      {sortedContacts.map((contact) => {
        const messages = messagesByContact[contact.id] || []
        const lastMessage = messages[messages.length - 1]
        const unreadCount = unreadByContact[contact.id] || 0

        return (
          <ContactItem
            key={contact.id}
            contact={contact}
            isSelected={selectedContactId === contact.id}
            unreadCount={unreadCount}
            lastMessage={lastMessage}
            onClick={() => handleSelectContact(contact.id)}
          />
        )
      })}
    </div>
  )
}
