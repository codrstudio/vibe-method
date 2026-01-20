import { useState } from 'react'
import { X } from 'lucide-react'
import { useContactStore } from '../../stores/contactStore'
import type { Contact } from '../../types'

interface ContactModalProps {
  contact?: Contact
  onClose: () => void
}

export function ContactModal({ contact, onClose }: ContactModalProps) {
  const [name, setName] = useState(contact?.name || '')
  const [phone, setPhone] = useState(contact?.phone || '')
  const [error, setError] = useState('')

  const { addContact, updateContact } = useContactStore()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome e obrigatorio')
      return
    }

    if (!phone.trim()) {
      setError('Telefone e obrigatorio')
      return
    }

    // Formata telefone
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+55' + formattedPhone.replace(/\D/g, '')
    }

    if (contact) {
      updateContact(contact.id, { name: name.trim(), phone: formattedPhone })
    } else {
      addContact({ name: name.trim(), phone: formattedPhone, avatar: null })
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-wa-overlay flex items-center justify-center z-50">
      <div className="bg-wa-bg-modal rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-wa-border">
          <h2 className="text-lg font-semibold text-wa-text-primary">
            {contact ? 'Editar Contato' : 'Novo Contato'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-wa-bg-hover text-wa-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-wa-text-primary mb-1">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Joao Cliente"
              className="w-full px-3 py-2 border border-wa-border rounded-lg text-sm bg-wa-bg-input text-wa-text-primary focus:outline-none focus:ring-2 focus:ring-wa-green-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-wa-text-primary mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 11999001001"
              className="w-full px-3 py-2 border border-wa-border rounded-lg text-sm bg-wa-bg-input text-wa-text-primary focus:outline-none focus:ring-2 focus:ring-wa-green-primary"
            />
            <p className="text-xs text-wa-text-secondary mt-1">
              Sera formatado automaticamente com +55
            </p>
          </div>

          {error && (
            <p className="text-sm text-wa-text-danger">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-wa-text-secondary hover:bg-wa-bg-hover rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-wa-green-primary text-white rounded-lg hover:bg-wa-green-dark"
            >
              {contact ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
