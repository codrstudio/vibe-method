import type { Instance, Message, SimulatorStats } from '../types'

const WA_SIM_URL = 'http://localhost:8003'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const api = {
  // Status do simulador
  async getStatus(): Promise<{ active: boolean; stats: SimulatorStats }> {
    const res = await fetch(`${WA_SIM_URL}/status`)
    return res.json()
  },

  // Listar instancias
  async getInstances(): Promise<{ data: Instance[] }> {
    const res = await fetch(`${WA_SIM_URL}/instances`)
    return res.json()
  },

  // Buscar mensagens de uma instancia
  async getMessages(instanceName: string, limit = 100): Promise<{ data: Message[] }> {
    const res = await fetch(`${WA_SIM_URL}/instances/${instanceName}/messages?limit=${limit}`)
    return res.json()
  },

  // Enviar mensagem (simula cliente enviando)
  async sendMessage(instanceName: string, from: string, text: string): Promise<{ success: boolean; messageId: string }> {
    const res = await fetch(`${WA_SIM_URL}/instances/${instanceName}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, text })
    })
    return res.json()
  },

  // Enviar documento (por ora, como mensagem com emoji)
  async sendDocument(instanceName: string, from: string, file: File): Promise<{ success: boolean; messageId: string }> {
    const text = `[Documento] ${file.name} (${formatFileSize(file.size)})`
    return this.sendMessage(instanceName, from, text)
  }
}
