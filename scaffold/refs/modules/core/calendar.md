# Calendar (Timeline)

Agendamento e alocacao de recursos escassos.

---

## O Problema Universal

Recursos escassos (tempo de pessoas, espacos, equipamentos) precisam ser alocados. Quando dois clientes querem o mesmo horario, alguem fica sem. Sem um sistema de agendamento, conflitos geram frustração e perda de receita.

---

## Perguntas de Descoberta

Antes de implementar, responda:

1. **O que esta sendo agendado?**
   - Tempo de pessoas (medico, professor, tecnico)?
   - Espacos (sala, quadra, auditorio)?
   - Equipamentos (maquina, veiculo)?
   - Combinacao (pessoa + sala)?

2. **Quem sao os "provedores"?**
   - Profissionais internos (funcionarios)?
   - Recursos fisicos (salas, equipamentos)?
   - Ambos combinados?

3. **Como agendamentos sao criados?**
   - Cliente agenda diretamente (self-service)?
   - Operador agenda para cliente (atendimento)?
   - Sistema agenda automaticamente (grade fixa)?
   - Bot agenda via conversa?

4. **Quais estados um agendamento pode ter?**
   - Apenas agendado/realizado?
   - Com confirmacao (agendado → confirmado → realizado)?
   - Com cancelamento (quem pode cancelar)?
   - Com no-show (falta)?

5. **Existe confirmacao?**
   - Automatica (WhatsApp, SMS, email)?
   - Manual (ligacao)?
   - Nao existe?

6. **Qual a granularidade?**
   - 5 minutos (alta precisao)?
   - 15-30 minutos (servicos)?
   - 1 hora (reunioes)?
   - Dia inteiro (reservas)?

7. **Qual o horizonte de agendamento?**
   - Mesmo dia (walk-in)?
   - Ate X dias no futuro?
   - Ate X meses no futuro?

8. **Existe disponibilidade configuravel?**
   - Horarios fixos (grade semanal)?
   - Bloqueios (ferias, feriados)?
   - Excecoes (dia especifico diferente)?

---

## Anatomia

### Entidades Principais

```
PROVIDER (quem/o que oferece tempo)
  - id, name, type
  - availability (grade de horarios)
  - appointments (agendamentos)

APPOINTMENT (evento agendado)
  - id, provider_id, client_id
  - start_time, end_time
  - status, type
  - notes

AVAILABILITY (quando esta disponivel)
  - provider_id
  - day_of_week ou specific_date
  - start_time, end_time
  - is_exception (bloqueio ou adicao)
```

### Estados Tipicos

```
[Agendado] ──> [Confirmado] ──> [Realizado]
     │              │
     │              └──> [Falta]
     │
     └──> [Cancelado]
```

| Estado | Significado | Cor |
|--------|-------------|-----|
| Agendado | Criado, aguardando confirmacao | Amarelo |
| Confirmado | Cliente confirmou presenca | Azul |
| Realizado | Aconteceu conforme planejado | Verde |
| Cancelado | Desmarcado (cliente ou provedor) | Cinza |
| Falta | Cliente nao compareceu | Vermelho |

### Visualizacoes

**Dia** - Linha do tempo vertical
```
┌─────────────────────────────────────────────────────────────┐
│ [<] Segunda, 15 Jan 2024 [>]          [Dia] [Semana] [Mes] │
├─────────────────────────────────────────────────────────────┤
│ 08:00 │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 08:30 │ ┌────────────────────────────────────────────────┐ │
│ 09:00 │ │ Maria Silva                                    │ │
│ 09:30 │ │ Consulta                          [Confirmado] │ │
│ 10:00 │ └────────────────────────────────────────────────┘ │
│ 10:30 │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 11:00 │ ┌────────────────────────────────────────────────┐ │
│ 11:30 │ │ Joao Pereira                                   │ │
│ 12:00 │ │ Retorno                            [Agendado]  │ │
│       │ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Semana** - Colunas por dia
```
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ Seg  │ Ter  │ Qua  │ Qui  │ Sex  │ Sab  │ Dom  │
│  15  │  16  │  17  │  18  │  19  │  20  │  21  │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ ██   │      │ ██   │ ██   │      │ ░░░░ │ ░░░░ │
│ ██   │ ██   │      │ ██   │ ██   │ ░░░░ │ ░░░░ │
│      │ ██   │ ██   │      │ ██   │ ░░░░ │ ░░░░ │
│ ██   │      │ ██   │ ██   │      │ ░░░░ │ ░░░░ │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘
  ██ = agendamento    ░░ = indisponivel
```

**Mes** - Grade de dias
```
┌─────────────────────────────────────────────────────────────┐
│                      Janeiro 2024                           │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ Seg │ Ter │ Qua │ Qui │ Sex │ Sab │ Dom │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │
│ (3) │ (5) │ (2) │ (4) │ (6) │  -  │  -  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │
│ (4) │ (3) │ (5) │ (2) │ (4) │  -  │  -  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  (N) = quantidade de agendamentos
```

---

## Variacoes por Dominio

| Aspecto | Clinica | Escola | Coworking | Servicos |
|---------|---------|--------|-----------|----------|
| **O que** | Consulta | Aula | Sala | Visita tecnica |
| **Provedor** | Medico | Professor + Sala | Sala | Tecnico |
| **Cliente** | Paciente | Aluno (fixo) | Membro | Cliente |
| **Criacao** | Paciente/Recepcionista | Automatico (grade) | Cliente | Cliente/Central |
| **Duracao tipica** | 30-60 min | 45-50 min | 1-8 horas | 1-4 horas |
| **Confirmacao** | WhatsApp 24h antes | Chamada/presenca | - | WhatsApp dia anterior |
| **No-show** | Importante (cobranca?) | Falta registrada | - | Reagendamento |
| **Recorrencia** | Raro | Semanal fixa | Comum | Raro |
| **Rota** | /timeline | /grade, /horarios | /reservas | /agenda |

### Exemplos de Nomenclatura

| Generico | Clinica | Escola | Coworking | Academia |
|----------|---------|--------|-----------|----------|
| Agendamento | Consulta | Aula | Reserva | Treino |
| Provedor | Medico | Professor | Sala | Personal |
| Cliente | Paciente | Aluno | Membro | Aluno |
| Cancelar | Desmarcar | - | Liberar | Desmarcar |
| No-show | Falta | Falta | - | Falta |

---

## Fluxos

### Agendar (via Operador)

```
1. Operador seleciona dia/horario no calendario
2. Modal de agendamento abre com horario pre-preenchido
3. Operador busca/seleciona cliente
4. Seleciona tipo de agendamento
5. Opcionalmente seleciona provedor especifico
6. Adiciona notas se necessario
7. Confirma criacao
8. Agendamento aparece no calendario
9. (Opcional) Sistema envia confirmacao automatica
```

### Agendar (Self-Service)

```
1. Cliente acessa area de agendamento (portal ou bot)
2. Seleciona tipo de servico
3. Seleciona provedor (ou "qualquer disponivel")
4. Ve horarios disponiveis
5. Seleciona horario
6. Confirma dados
7. Recebe confirmacao (email, WhatsApp)
```

### Confirmar (Automatico)

```
1. X horas antes do agendamento
2. Sistema envia mensagem de confirmacao
3. Cliente responde (Sim/Nao/Reagendar)
4. Sistema atualiza status:
   - Sim → Confirmado
   - Nao → Cancelado (libera horario)
   - Reagendar → Cria tarefa no Inbox
```

### Cancelar

```
1. Cliente solicita cancelamento (portal, WhatsApp, telefone)
2. Sistema verifica politica:
   - Dentro do prazo → Cancela automatico
   - Fora do prazo → Requer aprovacao ou cobra taxa
3. Horario liberado
4. Provedor notificado (opcional)
```

### Registrar Comparecimento

```
1. No horario do agendamento
2. Operador marca como:
   - Realizado (cliente veio)
   - Falta (nao compareceu)
3. Sistema registra para metricas
4. (Opcional) Aciona fluxo de falta (cobranca, bloqueio)
```

---

## Configuracao de Disponibilidade

### Grade Semanal

```
MODELO:
provider_id: uuid
day_of_week: 0-6 (domingo=0)
start_time: "08:00"
end_time: "12:00"

EXEMPLO (Dr. Silva):
| Dia | Manha | Tarde |
|-----|-------|-------|
| Seg | 08-12 | 14-18 |
| Ter | 08-12 | -     |
| Qua | 08-12 | 14-18 |
| Qui | 08-12 | -     |
| Sex | 08-12 | 14-18 |
| Sab | -     | -     |
| Dom | -     | -     |
```

### Bloqueios e Excecoes

```
BLOQUEIO (nao disponivel em data especifica):
provider_id: uuid
date: "2024-01-20"
start_time: null (dia inteiro)
end_time: null
reason: "Ferias"

EXCECAO (disponivel em horario extra):
provider_id: uuid
date: "2024-01-21"
start_time: "14:00"
end_time: "18:00"
reason: "Plantao especial"
```

### Calculo de Disponibilidade

```
PARA VERIFICAR SE HORARIO X ESTA DISPONIVEL:

1. Buscar grade semanal do provedor para dia_da_semana(X)
2. Verificar se X esta dentro de algum periodo da grade
3. Verificar se existe bloqueio para data(X)
4. Verificar se existe agendamento conflitante
5. SE passou em todos → DISPONIVEL
```

---

## Principios de Design

### 1. Visualizacao e a Funcionalidade Principal

O calendario e mais visualizacao do que formulario. Investir pesado em UX de:
- Navegacao entre dias/semanas/meses
- Visualizacao clara de ocupacao vs disponibilidade
- Criacao rapida (clique no horario vazio)

### 2. Mobile e Desktop Sao Diferentes

**Desktop:** Visualizacao ampla, ver semana inteira, multiplos provedores
**Mobile:** Um dia por vez, scroll vertical, acoes via swipe

Nao tente fazer a mesma UI para ambos. Adapte.

### 3. Horarios Vagos Sao Oportunidades

Mostrar claramente onde ha espaco. Horarios vagos sao receita perdida. A UI deve "empurrar" para preencher.

### 4. Conflitos Sao Proibidos

Sistema NUNCA deve permitir dois agendamentos no mesmo horario/provedor. Validar no backend, nao confiar no frontend.

### 5. Confirmacao Reduz No-Show

Sistemas com confirmacao automatica tem 30-50% menos faltas. Vale o investimento.

### 6. Historico Importa

Manter historico de agendamentos passados. Permite:
- Ver frequencia do cliente
- Calcular taxa de no-show
- Gerar metricas de ocupacao

---

## Anti-patterns

### "Calendario sem restricao de conflito"
**Problema:** Dois agendamentos no mesmo horario.
**Solucao:** Validar disponibilidade no backend antes de salvar.

### "Disponibilidade hardcoded"
**Problema:** "Segunda a sexta, 8-18h" para todos.
**Solucao:** Disponibilidade configuravel por provedor.

### "Sem estados intermediarios"
**Problema:** Agendamento vai direto para Realizado.
**Solucao:** Fluxo completo com Confirmacao quando necessario.

### "Mobile = Desktop comprimido"
**Problema:** Calendario de semana ilegivel em celular.
**Solucao:** Visualizacao diferente para mobile (dia unico, lista).

### "Criar agendamento = 10 campos"
**Problema:** Demora para agendar algo simples.
**Solucao:** Modal minimo: cliente + horario + tipo. Resto opcional.

### "Sem indicacao de ocupacao"
**Problema:** Usuario nao sabe se dia esta cheio ou vazio.
**Solucao:** Indicadores visuais de ocupacao (cores, badges, porcentagem).

---

## Exemplo: Timeline de Clinica

```
/timeline

VISUALIZACAO DIA:
┌─────────────────────────────────────────────────────────────┐
│ [<] Quarta, 15 Jan 2024 [>]                                 │
│                                                             │
│ [Dr. Carlos ▾]              [Dia] [Semana] [Mes]   [+ Novo] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 08:00 ─────────────────────────────────────────────────────│
│       │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 08:30 ─────────────────────────────────────────────────────│
│       │ ┌────────────────────────────────────────────────┐ │
│ 09:00 │ │ ● Maria Silva - Consulta                      │ │
│       │ │ Confirmado                    [Ver] [Editar]  │ │
│ 09:30 │ └────────────────────────────────────────────────┘ │
│       │                                                    │
│ 10:00 ─────────────────────────────────────────────────────│
│       │ ┌────────────────────────────────────────────────┐ │
│ 10:30 │ │ ○ Joao Pereira - Retorno                      │ │
│       │ │ Aguardando confirmacao        [Ver] [Editar]  │ │
│ 11:00 │ └────────────────────────────────────────────────┘ │
│       │                                                    │
│ 11:30 ─────────────────────────────────────────────────────│
│       │           [ + Agendar neste horario ]              │
│ 12:00 ─────────────────────────────────────────────────────│
│       │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ALMOCO ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ 13:00 ─────────────────────────────────────────────────────│
│       │                                                    │
│ 14:00 ─────────────────────────────────────────────────────│
│                                                             │
└─────────────────────────────────────────────────────────────┘

MODAL DE AGENDAMENTO:
┌─────────────────────────────────────────────────────────────┐
│ Novo Agendamento                                     [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Paciente *                                                  │
│ [Buscar paciente...                              ] [+ Novo] │
│                                                             │
│ Tipo *                                                      │
│ ( ) Consulta    ( ) Retorno    ( ) Exame                   │
│                                                             │
│ Profissional                                                │
│ [Dr. Carlos Mendes                               ▾]         │
│                                                             │
│ Data e Horario                                              │
│ [15/01/2024]  [11:30]  Duracao: [30 min ▾]                 │
│                                                             │
│ Observacoes                                                 │
│ [                                                         ] │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancelar]  [Agendar]          │
└─────────────────────────────────────────────────────────────┘

LEGENDA DE STATUS:
● Verde = Confirmado
○ Amarelo = Aguardando confirmacao
░ Cinza claro = Disponivel
▓ Cinza escuro = Bloqueado/Indisponivel
✗ Vermelho = Falta
```
