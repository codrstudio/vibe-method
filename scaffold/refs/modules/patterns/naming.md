# Naming

Vocabulario e nomenclatura por dominio.

---

## O Problema Universal

Sistemas genericos usam termos genericos: "cliente", "entidade", "item". Usuarios nao se identificam. Um medico quer ver "pacientes", nao "clientes". Um professor quer ver "alunos", nao "usuarios".

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **Qual o vocabulario nativo do dominio?**
   - Como os usuarios chamam as coisas no dia a dia?
   - Que termos usam em conversas?
   - Qual a linguagem dos documentos oficiais?

2. **Quem e o "cliente" do sistema?**
   - Paciente? Aluno? Membro? Cliente mesmo?
   - Existe mais de um tipo?

3. **Quem e o "provedor" de servico?**
   - Medico? Professor? Vendedor? Tecnico?
   - Existe hierarquia (senior, junior)?

4. **O que e o "evento" principal?**
   - Consulta? Aula? Pedido? Atendimento?
   - Tem subtipos?

5. **Como chamar a "organizacao"?**
   - Clinica? Escola? Empresa? Loja?
   - Existe conceito de unidade/filial?

6. **Existem termos ambiguos?**
   - "Usuario" pode ser quem usa o sistema ou cliente?
   - "Conta" pode ser login ou financeiro?

---

## Framework de Traducao

### Tabela de Conceitos

| Conceito Generico | Clinica | Escola | E-commerce | Suporte | Academia | Salao |
|-------------------|---------|--------|------------|---------|----------|-------|
| **Organizacao** | Clinica | Escola | Loja | Central | Academia | Salao |
| **Cliente** | Paciente | Aluno | Cliente | Cliente | Aluno | Cliente |
| **Provedor** | Medico | Professor | Vendedor | Agente | Personal | Profissional |
| **Evento** | Consulta | Aula | Pedido | Ticket | Treino | Atendimento |
| **Agendamento** | Consulta | Horario | - | - | Agendamento | Horario |
| **Fila** | Inbox | Solicitacoes | Pedidos | Tickets | - | Fila |
| **Cancelar** | Desmarcar | - | Cancelar | Fechar | Desmarcar | Desmarcar |
| **Nao compareceu** | Falta | Falta | - | - | Falta | Falta |

### Traducao de Acoes

| Acao Generica | Clinica | Escola | E-commerce | Suporte |
|---------------|---------|--------|------------|---------|
| Criar cliente | Cadastrar paciente | Matricular aluno | Cadastrar cliente | Cadastrar cliente |
| Agendar | Marcar consulta | - | - | - |
| Confirmar | Confirmar presenca | Confirmar matricula | Confirmar pedido | - |
| Cancelar | Desmarcar | Cancelar matricula | Cancelar pedido | Fechar ticket |
| Concluir | Realizar consulta | - | Entregar pedido | Resolver ticket |

---

## Onde Aplicar

### 1. Rotas (URLs)

```
GENERICO           CLINICA           ESCOLA
/clients           /patients         /students
/providers         /doctors          /teachers
/appointments      /consultations    /schedule
/queue             /inbox            /requests
```

### 2. Textos de Interface

```
GENERICO                    CLINICA
"Novo cliente"              "Novo paciente"
"Selecione o provedor"      "Selecione o medico"
"Agendar evento"            "Marcar consulta"
"Cliente nao compareceu"    "Paciente faltou"
```

### 3. Mensagens de Sistema

```
GENERICO                              CLINICA
"Cliente criado com sucesso"          "Paciente cadastrado com sucesso"
"Agendamento confirmado"              "Consulta confirmada"
"O provedor nao esta disponivel"      "O medico nao esta disponivel"
```

### 4. Placeholders e Labels

```
GENERICO                    CLINICA
Buscar cliente...           Buscar paciente...
Nome do provedor            Nome do medico
Data do evento              Data da consulta
```

### 5. Mensagens de Erro

```
GENERICO                              CLINICA
"Cliente nao encontrado"              "Paciente nao encontrado"
"Horario ja ocupado"                  "Medico ja tem consulta nesse horario"
"Provedor indisponivel"               "Medico nao atende nesse dia"
```

---

## Estrategias de Implementacao

### 1. Arquivo de Traducoes (i18n)

```json
// pt-BR.json (clinica)
{
  "entities": {
    "client": "paciente",
    "clients": "pacientes",
    "provider": "medico",
    "providers": "medicos",
    "appointment": "consulta",
    "appointments": "consultas",
    "organization": "clinica"
  },
  "actions": {
    "newClient": "Novo paciente",
    "scheduleAppointment": "Marcar consulta",
    "cancelAppointment": "Desmarcar consulta",
    "clientNoShow": "Paciente faltou"
  },
  "messages": {
    "clientCreated": "Paciente cadastrado com sucesso",
    "appointmentConfirmed": "Consulta confirmada"
  }
}
```

### 2. Constantes Centralizadas

```typescript
// domain.ts
export const DOMAIN = {
  client: {
    singular: 'paciente',
    plural: 'pacientes',
    article: 'o'
  },
  provider: {
    singular: 'medico',
    plural: 'medicos',
    article: 'o'
  },
  appointment: {
    singular: 'consulta',
    plural: 'consultas',
    article: 'a'
  },
  organization: {
    singular: 'clinica',
    plural: 'clinicas',
    article: 'a'
  }
};

// Uso
const message = `${DOMAIN.client.article} ${DOMAIN.client.singular} foi cadastrado`;
// "o paciente foi cadastrado"
```

### 3. Componentes Parametrizados

```tsx
// Nao faca isso:
<Button>Novo Paciente</Button>

// Faca isso:
<Button>Novo {domain.client.singular}</Button>

// Ou com i18n:
<Button>{t('actions.newClient')}</Button>
```

---

## Principios de Naming

### 1. Usuario e a Fonte

O vocabulario vem do usuario, nao do desenvolvedor. Pergunte: "Como voce chama isso no dia a dia?"

### 2. Consistencia Total

Se escolheu "paciente", use em TODO lugar: rotas, botoes, mensagens, erros, logs. Misturar confunde.

### 3. Singular e Plural

Defina ambos. "Paciente" e "pacientes". Use corretamente conforme contexto.

### 4. Genero Gramatical

Em portugues, substantivos tem genero. "O paciente" vs "A consulta". Considere ao formar frases.

### 5. Evite Ambiguidade

Se "usuario" pode ser quem usa o sistema ou o cliente, escolha termos diferentes: "operador" e "paciente".

### 6. Documente o Glossario

Crie um glossario do projeto. Novos devs precisam saber o vocabulario.

---

## Anti-patterns

### "Misturar vocabularios"
**Problema:** "Novo paciente" em um lugar, "Novo cliente" em outro.
**Solucao:** Definir vocabulario uma vez e usar em todo lugar.

### "Termos tecnicos na UI"
**Problema:** "Entity created successfully".
**Solucao:** "Paciente cadastrado com sucesso".

### "Hardcodar texto"
**Problema:** Texto direto no codigo, dificil de mudar.
**Solucao:** Centralizar em arquivo de traducoes ou constantes.

### "Ignorar contexto"
**Problema:** "Deletar paciente" - som agressivo para saude.
**Solucao:** "Desativar cadastro" ou "Remover paciente".

### "Assumir vocabulario"
**Problema:** Usar "consulta" sem confirmar com cliente.
**Solucao:** Perguntar: "Voces chamam de consulta, atendimento, ou outro termo?"

---

## Exemplo: Glossario de Clinica

```
GLOSSARIO DO PROJETO: INTERCLINICAS

ENTIDADES PRINCIPAIS
--------------------
| Termo Tecnico | Termo de UI | Descricao |
|---------------|-------------|-----------|
| clinic | clinica | Organizacao dona do sistema |
| patient | paciente | Pessoa que recebe atendimento |
| provider | medico/profissional | Quem realiza o atendimento |
| appointment | consulta | Evento agendado |
| user | usuario | Quem acessa o sistema (operador) |

ACOES
-----
| Acao | Termo de UI |
|------|-------------|
| create_patient | Cadastrar paciente |
| schedule_appointment | Marcar consulta |
| confirm_appointment | Confirmar consulta |
| cancel_appointment | Desmarcar consulta |
| complete_appointment | Realizar consulta |
| register_no_show | Registrar falta |

STATUS
------
| Status Tecnico | Termo de UI | Cor |
|----------------|-------------|-----|
| scheduled | Agendado | Amarelo |
| confirmed | Confirmado | Azul |
| completed | Realizado | Verde |
| no_show | Falta | Vermelho |
| cancelled | Desmarcado | Cinza |

MENSAGENS
---------
| Contexto | Mensagem |
|----------|----------|
| Sucesso criar paciente | "Paciente cadastrado com sucesso" |
| Sucesso marcar consulta | "Consulta marcada com sucesso" |
| Erro paciente duplicado | "Ja existe um paciente com este CPF" |
| Erro horario ocupado | "O medico ja tem consulta neste horario" |
| Confirmacao cancelar | "Deseja desmarcar esta consulta?" |

ROTAS
-----
| Funcionalidade | Rota |
|----------------|------|
| Lista de pacientes | /patients |
| Detalhe do paciente | /patients/:id |
| Agenda | /timeline |
| Fila de tarefas | /inbox |
| Metricas | /pulse |
| Config da clinica | /settings/clinic |
```
