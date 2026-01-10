# Patterns

Padroes transversais aplicaveis a qualquer modulo.

---

## Visao Geral

Patterns sao conceitos que aparecem em multiplos modulos e dominios. Diferente de Settings (onde configurar) ou Core (o que fazer), Patterns sao o "como pensar" sobre problemas recorrentes.

### Patterns Documentados

| Pattern | Proposito | Documento |
|---------|-----------|-----------|
| **Naming** | Vocabulario por dominio | [naming.md](./naming.md) |
| **Permissions** | Controle de acesso | [permissions.md](./permissions.md) |
| **States** | Maquinas de estado | [states.md](./states.md) |

---

## Quando Usar Cada Pattern

```
SE preciso traduzir conceitos para o dominio:
  └── Naming (paciente vs aluno vs cliente)

SE preciso controlar quem ve/faz o que:
  └── Permissions (roles, acesso, visibilidade)

SE entidade tem ciclo de vida:
  └── States (pendente → ativo → concluido)
```

---

## Principios de Patterns

### 1. Patterns Sao Ferramentas de Pensamento

Nao copie cegamente. Entenda o problema que o pattern resolve e adapte para seu contexto.

### 2. Consistencia Importa

Se escolheu um pattern, use em todo o sistema. Misturar abordagens confunde.

### 3. Simplicidade Primeiro

Comece com a versao mais simples do pattern. Adicione complexidade apenas quando necessario.

### 4. Documente Decisoes

Quando adaptar um pattern, documente por que. Ajuda quem vier depois (inclusive voce).
