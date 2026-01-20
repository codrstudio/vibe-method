import { useInstanceStore } from '../../stores/instanceStore'

export function InstanceSelector() {
  const { instances, selectedInstance, setSelectedInstance, loading } = useInstanceStore()

  const connectedInstances = instances.filter(i => i.status === 'connected')

  if (loading) {
    return (
      <div className="text-sm text-wa-text-secondary">
        Carregando instancias...
      </div>
    )
  }

  if (connectedInstances.length === 0) {
    return (
      <div className="text-sm text-wa-text-secondary">
        Nenhuma instancia conectada
      </div>
    )
  }

  return (
    <select
      value={selectedInstance || ''}
      onChange={(e) => setSelectedInstance(e.target.value || null)}
      className="w-full px-3 py-2 text-sm bg-wa-bg-input text-wa-text-primary border border-wa-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wa-green-primary"
    >
      <option value="">Selecione uma instancia</option>
      {connectedInstances.map((instance) => (
        <option key={instance.instanceName} value={instance.instanceName}>
          {instance.instanceName} ({instance.phoneNumber || 'Sem numero'})
        </option>
      ))}
    </select>
  )
}
