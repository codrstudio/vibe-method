import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultContacts } from '../data/defaultContacts'
import type { Contact } from '../types'

interface ContactState {
  contacts: Contact[]
  selectedContactId: string | null

  setSelectedContact: (contactId: string | null) => void
  addContact: (contact: Omit<Contact, 'id'>) => void
  updateContact: (id: string, data: Partial<Contact>) => void
  deleteContact: (id: string) => void
  getContactByPhone: (phone: string) => Contact | undefined
}

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: defaultContacts,
      selectedContactId: null,

      setSelectedContact: (contactId) => set({ selectedContactId: contactId }),

      addContact: (contact) => set((state) => ({
        contacts: [...state.contacts, { ...contact, id: crypto.randomUUID() }]
      })),

      updateContact: (id, data) => set((state) => ({
        contacts: state.contacts.map(c => c.id === id ? { ...c, ...data } : c)
      })),

      deleteContact: (id) => set((state) => ({
        contacts: state.contacts.filter(c => c.id !== id),
        selectedContactId: state.selectedContactId === id ? null : state.selectedContactId
      })),

      getContactByPhone: (phone) => {
        const { contacts } = get()
        // Normaliza o numero para comparacao
        const normalizedPhone = phone.replace(/\D/g, '')
        return contacts.find(c => c.phone.replace(/\D/g, '').includes(normalizedPhone) || normalizedPhone.includes(c.phone.replace(/\D/g, '')))
      }
    }),
    { name: 'wa-sim-contacts' }
  )
)
