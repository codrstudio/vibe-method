# Discovery Framework

Processo de descoberta antes de implementar qualquer modulo do sistema.

---

## Por que Descoberta?

Implementar um modulo sem entender o contexto e como construir uma casa sem saber quem vai morar nela. O processo de descoberta revela:

- **Vocabulario**: Como o usuario chama as coisas?
- **Entidades**: Quais sao os "substantivos" do sistema?
- **Fluxos**: Quais sao os "verbos" do negocio?
- **Permissoes**: Quem pode fazer o que?
- **Prioridades**: O que importa mais?

---

## O Processo

### 1. IDENTIFICAR O DOMINIO

**Perguntas:**
- Qual o segmento/nicho? (saude, educacao, logistica, servicos, comercio)
- Qual o tamanho tipico da operacao? (1 pessoa, equipe pequena, empresa)
- Quem e o usuario principal? (dono, funcionario, cliente final)

**Por que importa:**
O dominio determina o vocabulario, as prioridades e os fluxos naturais do sistema.

**Exemplos:**

| Dominio | Usuario Principal | Prioridade |
|---------|-------------------|------------|
| Clinica medica | Recepcionista | Agendamento fluido |
| Escola | Secretaria | Matriculas e documentos |
| Marinha | Oficial de servico | Escalas e operacoes |
| Delivery | Dono do restaurante | Pedidos e entregas |
| SaaS | Admin do cliente | Configuracao e metricas |

---

### 2. MAPEAR VOCABULARIO

**Perguntas:**
- Como o usuario chama a "entidade principal"? (clinica, escola, embarcacao, loja)
- Como chama quem presta servico? (medico, professor, tecnico, entregador)
- Como chama quem recebe servico? (paciente, aluno, tripulante, cliente)
- Como chama o "evento principal"? (consulta, aula, operacao, pedido)

**Por que importa:**
O sistema deve falar a lingua do usuario. Termos genericos criam distancia.

**Framework de Traducao:**

| Conceito Generico | Pergunte |
|-------------------|----------|
| Entidade principal | "Como voce chama a sua [empresa/organizacao]?" |
| Provedor de servico | "Quem realiza o trabalho principal?" |
| Cliente/consumidor | "Quem e atendido/beneficiado?" |
| Evento agendado | "Como voce chama quando [provedor] atende [cliente]?" |
| Tarefa pendente | "O que fica na lista de 'a fazer'?" |

---

### 3. IDENTIFICAR ENTIDADES

**Perguntas:**
- Qual a entidade "dona" do sistema? (a empresa, organizacao, unidade)
- Quais entidades "orbitam" ao redor? (usuarios, clientes, recursos)
- Como se relacionam? (pertence a, trabalha em, atende)

**Por que importa:**
Entidades sao os "substantivos" do sistema. Definem a estrutura de dados e navegacao.

**Diagrama Mental:**

```
                    ┌───────────────┐
                    │   ENTIDADE    │
                    │   PRINCIPAL   │
                    │  (clinic,     │
                    │   school...)  │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    ┌───────────┐     ┌───────────┐     ┌───────────┐
    │ USUARIOS  │     │ CLIENTES  │     │ RECURSOS  │
    │ (quem     │     │ (quem e   │     │ (o que e  │
    │  opera)   │     │  atendido)│     │  alocado) │
    └───────────┘     └───────────┘     └───────────┘
```

**Exemplos:**

| Dominio | Principal | Usuarios | Clientes | Recursos |
|---------|-----------|----------|----------|----------|
| Clinica | clinic | staff, medicos | pacientes | salas, equipamentos |
| Escola | school | professores, secretaria | alunos | salas, turmas |
| Marinha | vessel | oficiais, tripulacao | - | escalas, operacoes |
| Coworking | space | gestores | membros | salas, mesas |

---

### 4. MAPEAR FLUXOS

**Perguntas:**
- Qual o fluxo principal do negocio? (o que gera valor)
- Quais fluxos secundarios suportam o principal?
- Onde ha atrito/dor no fluxo atual?
- O que acontece quando algo da errado?

**Por que importa:**
Fluxos sao os "verbos" do sistema. Definem as acoes e transicoes.

**Exemplo - Clinica:**

```
FLUXO PRINCIPAL: Agendamento → Confirmacao → Consulta → Pagamento

FLUXOS SECUNDARIOS:
- Cadastro de paciente
- Configuracao de horarios
- Geracao de relatorios

PONTOS DE ATRITO:
- Confirmacao manual por telefone
- No-show sem aviso
- Reagendamento trabalhoso
```

**Template:**

```
FLUXO PRINCIPAL: [etapa 1] → [etapa 2] → [etapa 3] → [resultado]

FLUXOS SECUNDARIOS:
- [fluxo de configuracao]
- [fluxo de excecao]
- [fluxo de relatorio]

PONTOS DE ATRITO:
- [onde demora]
- [onde erra]
- [onde frustra]
```

---

### 5. ESTABELECER PERMISSOES

**Perguntas:**
- Quais papeis existem na operacao? (nao assuma - pergunte)
- Para cada acao: quem pode fazer?
- Existe hierarquia? (quem "manda" em quem)
- Ha dados sensiveis? (quem pode ver)

**Por que importa:**
Permissoes mal definidas geram vazamentos de dados ou bloqueios de produtividade.

**Framework:**

| Papel | Pode VER | Pode CRIAR | Pode EDITAR | Pode DELETAR |
|-------|----------|------------|-------------|--------------|
| [papel 1] | | | | |
| [papel 2] | | | | |
| [papel 3] | | | | |

**Exemplo - Clinica:**

| Papel | Agenda | Pacientes | Financeiro | Usuarios |
|-------|--------|-----------|------------|----------|
| Admin | Tudo | Tudo | Tudo | Tudo |
| Medico | Propria | Proprios | Nao | Nao |
| Recepcionista | Tudo | Tudo | Ver | Nao |

---

### 6. PRIORIZAR MODULOS

**Perguntas:**
- Qual modulo resolve a maior dor?
- Qual modulo e pre-requisito de outros?
- Qual pode ser simplificado/adiado?
- Qual e "nice to have"?

**Por que importa:**
Nao tente construir tudo de uma vez. Priorize pelo impacto.

**Matriz de Priorizacao:**

| Modulo | Impacto | Complexidade | Prioridade |
|--------|---------|--------------|------------|
| [modulo] | Alto/Medio/Baixo | Alta/Media/Baixa | 1/2/3/4 |

**Regra Geral:**

```
SEMPRE:     entity, profile, navigation
GERALMENTE: users, calendar
AS VEZES:   metrics, notifications, task-queue
SE HOUVER:  integrations, automation, monitoring
```

---

## Checklist de Descoberta

Antes de implementar qualquer modulo:

- [ ] Identifiquei o dominio e usuario principal
- [ ] Mapeei o vocabulario nativo (nao uso termos genericos)
- [ ] Listei as entidades principais e como se relacionam
- [ ] Desenhei o fluxo principal e pontos de atrito
- [ ] Defini os papeis e o que cada um pode fazer
- [ ] Priorizei os modulos por impacto

---

## Anti-patterns de Descoberta

### "Eu sei o que o usuario precisa"
**Problema:** Assumir sem perguntar.
**Solucao:** Sempre validar vocabulario e fluxos com usuario real.

### "Vou fazer igual ao projeto anterior"
**Problema:** Copiar sem adaptar ao dominio.
**Solucao:** Cada dominio tem vocabulario e fluxos proprios.

### "Depois a gente ajusta"
**Problema:** Pular descoberta para "ganhar tempo".
**Solucao:** Descoberta mal feita gera retrabalho. Invista agora.

### "Todo sistema precisa de tudo"
**Problema:** Implementar modulos que nao serao usados.
**Solucao:** Comece pequeno. Adicione conforme necessidade real.

---

## Exemplo Completo

### Dominio: Academia de Ginastica

**1. Identificacao:**
- Segmento: Saude/Fitness
- Tamanho: Pequena (1-3 funcionarios)
- Usuario principal: Dono/Recepcionista

**2. Vocabulario:**
- Entidade: academia
- Provedor: professor/instrutor
- Cliente: aluno
- Evento: aula, treino

**3. Entidades:**
- Principal: academy
- Usuarios: owner, instructor
- Clientes: student (com plano)
- Recursos: aulas em grupo, horarios

**4. Fluxo Principal:**
```
Matricula → Plano → Check-in diario → Aulas/Treinos
```

**5. Permissoes:**
| Papel | Alunos | Financeiro | Aulas | Configuracao |
|-------|--------|------------|-------|--------------|
| Owner | Tudo | Tudo | Tudo | Tudo |
| Instructor | Ver proprios | Nao | Proprias | Nao |

**6. Modulos Priorizados:**
1. entity (academy settings)
2. calendar (horarios de aulas)
3. profile/navigation
4. metrics (frequencia, renovacoes)
5. notifications (vencimento plano)
