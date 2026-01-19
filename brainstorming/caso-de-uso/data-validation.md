# Feature: Data Validation

Regras de validacao de dados entre sistemas e conteudos gerados.

**Prefixo:** VALID

---

## Design

### DES-VALID-001: Input Data Validation

Validacao de dados de entrada do legado e formularios.

**Implementacao:**
- Validacao de campos obrigatorios
- Correcao automatica de pequenos erros:
  - Telefone sem DDD: adicionar DDD da regiao
  - CPF com pontuacao: normalizar
  - Nome em minusculas: capitalizar
- Solicitacao de correcao para erros nao corrigiveis
- Log de todas as correcoes automaticas

**Trade-offs:**
- Correcao automatica pode introduzir erros
- Mas reduz fricao e melhora qualidade dos dados

**Refs:** brainstorming/Recrutamento Automatizado.md

---

### DES-VALID-002: Content Completeness Validation

Validacao de completude de conteudos gerados.

**Implementacao:**
- Checklists por tipo de conteudo:
  - Relatorio: data, paciente, cuidador, atividades, avaliacao clinica
  - Candidato: nome, telefone, regiao, experiencia, habilidades
  - Match: assistido, candidatos, scores, explicacoes
- Rejeicao com feedback especifico do que falta
- Permite ate 2 tentativas automaticas antes de humano

**Trade-offs:**
- Checklists rigidos podem rejeitar conteudo valido
- Mas garante padrao minimo de qualidade

**Refs:** brainstorming/Humanização de Relatórios.md

---

### DES-VALID-003: AI Content Validation

Validacao de conteudo gerado por IA.

**Implementacao:**
- Agente Validador (AI Reviewer) verifica:
  - Todas informacoes essenciais presentes
  - Nao inventou fatos (fidelidade ao original)
  - Gramatica e ortografia corretas
  - Tom adequado (empatico, respeitoso)
- Se rejeitar, retorna lista de itens a corrigir
- Gerador reescreve ate aprovacao

**Trade-offs:**
- Duas chamadas LLM por conteudo (custo)
- Mas qualidade muito superior

**Refs:** brainstorming/Humanização de Relatórios.md

---

### DES-VALID-004: Cross-System Data Consistency

Verificacao de consistencia entre sistemas.

**Implementacao:**
- Comparar dados do legado (MySQL) com novo sistema (PostgreSQL)
- Detectar divergencias em:
  - Dados de guardioes (cadastro vs escala)
  - Dados de assistidos (cadastro vs atendimentos)
  - Dados financeiros (faturamento vs pagamentos)
- Alertas quando divergencia detectada
- Relatorio periodico de inconsistencias

**Trade-offs:**
- Sincronizacao perfeita pode ser impossivel
- Mas visibilidade de divergencias essencial

**Depends:** DES-PRIME-001, DES-DATA-001

---

### DES-VALID-005: Schema Validation

Validacao de schemas de dados.

**Implementacao:**
- Schemas Zod para todas as entidades
- Validacao em runtime nas APIs
- Tipos TypeScript gerados dos schemas
- Mensagens de erro claras e acionaveis
- Documentacao automatica dos schemas

**Trade-offs:**
- Overhead de validacao em cada request
- Mas previne dados invalidos no banco

---

### DES-VALID-006: Business Rules Validation

Validacao de regras de negocio.

**Implementacao:**
- Regras por dominio:
  - Recrutamento: score minimo, documentos obrigatorios
  - Escalas: sem conflitos de horario, folgas respeitadas
  - Relatorios: prazo de envio, campos clinicos
  - Financeiro: valores dentro de faixas esperadas
- Validacao antes de persistir
- Bypass apenas com aprovacao de supervisor

**Trade-offs:**
- Regras podem ficar desatualizadas
- Mas garante integridade do negocio

---

## Dependencias

**Libs:**
- `zod` - Validacao de schemas

**Depends:**
- DES-PRIME-001 (dados do legado)
- DES-DATA-001 (arquitetura de dados)
- DES-AGENT-001 (agentes de validacao)
