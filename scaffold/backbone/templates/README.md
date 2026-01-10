# Templates

Templates de mensagens para usuarios finais.

## Proposito

Mensagens padronizadas enviadas para usuarios via:
- WhatsApp
- Email
- Push notifications
- SMS

## Estrutura

```
templates/
├── README.md           # Este arquivo
├── welcome.ts          # Mensagem de boas-vindas
├── confirmation.ts     # Confirmacao de acao
├── reminder.ts         # Lembretes
└── ...                 # Outros templates
```

## Formato

```typescript
// templates/welcome.ts

export interface WelcomeData {
  userName: string;
  appName: string;
}

export function welcome(data: WelcomeData): string {
  return `Ola ${data.userName}! 👋

Bem-vindo ao ${data.appName}.

Como posso ajudar?`;
}
```

## Uso

```typescript
import { welcome } from './templates/welcome.js';

const message = welcome({
  userName: 'Maria',
  appName: 'Meu App',
});

await sendWhatsApp(phone, message);
```

## Dicas

- Mantenha mensagens curtas e claras
- Use emojis com moderacao
- Teste em diferentes tamanhos de tela
- Considere limites de caracteres (WhatsApp: 4096, SMS: 160)
- Evite formatacao complexa em canais que nao suportam
