# PLAN: wa-sim-ui MVP

## Contexto

O wa-sim (motor do simulador) já está funcionando na porta 8003. Agora precisamos de uma **interface visual** similar ao WhatsApp Web para:

1. Simular o lado do "cliente" (quem recebe/envia mensagens)
2. Testar fluxos de WhatsApp sem depender de número real
3. Permitir testes automatizados e manuais
4. Futuramente: integrar IA que responde automaticamente

**Princípio chave**: wa-sim continua independente. A UI é apenas visualização - se fechar, mensagens continuam acumulando no wa-sim.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        wa-sim (motor)                           │
│                         porta 8003                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Estado    │  │  Mensagens  │  │   Webhooks → Backbone   │ │
│  │  Instâncias │  │  Acumuladas │  │   (sempre dispara)      │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘ │
│         │                │                                      │
│         │         Socket.IO Server (NOVO)                       │
│         │                │                                      │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          │    ┌───────────┴───────────┐
          │    │     WebSocket         │
          │    │                       │
    ┌─────┴────▼──────────────────────┴────┐
    │            wa-sim-ui                  │
    │            porta 8004                 │
    │                                       │
    │  ┌─────────┐  ┌──────────────────┐   │
    │  │ Sidebar │  │    Chat Area     │   │
    │  │Contatos │  │  - Mensagens     │   │
    │  │+ Badge  │  │  - Input         │   │
    │  │         │  │  - Arquivos      │   │
    │  └─────────┘  └──────────────────┘   │
    └──────────────────────────────────────┘
```

---

## MVP - Escopo

### Incluído no MVP

| Feature | Descrição |
|---------|-----------|
| **Lista de contatos** | Sidebar com contatos pré-definidos + CRUD |
| **Badge não lidas** | Indicador de mensagens não lidas por contato |
| **Área de chat** | Exibir histórico de mensagens |
| **Enviar mensagem** | Input para enviar texto |
| **Enviar documento** | Upload de PDF/arquivos |
| **Receber mensagens** | Real-time via Socket |
| **Status de mensagem** | ✓ enviado, ✓✓ entregue, ✓✓ azul lido |
| **Seletor de instância** | Dropdown para escolher qual número simular |
| **Tema verde WhatsApp** | Visual similar ao WhatsApp Web |

### Fora do MVP (Fase 2)

- Typing indicator
- Reply/quote
- Busca no histórico
- Emojis picker
- Audio simulado
- Grupos
- Notificação sonora
- Dark mode

---

## Ordem de Implementação

1. [x] Salvar plano
2. [ ] Criar estrutura do projeto wa-sim-ui
3. [ ] Adicionar Socket.IO ao wa-sim existente
4. [ ] Implementar stores (Zustand)
5. [ ] Criar componentes básicos (layout, sidebar, chat)
6. [ ] Conectar Socket.IO para real-time
7. [ ] Implementar envio de mensagens
8. [ ] Implementar upload de arquivos
9. [ ] Adicionar CRUD de contatos
10. [ ] Ajustar visual (tema, badges, status)
11. [ ] Testar fluxo completo
