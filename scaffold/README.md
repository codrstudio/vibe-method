# Scaffold

Template inicial para novos projetos usando o AI-First Development Method.

## Uso

```bash
# Copiar scaffold para novo projeto
cp -r method/scaffold/* /path/to/new-project/

# Personalizar CLAUDE.md com contexto do projeto
# Iniciar fase de brainstorming
# Seguir fluxo de fases
```

## Estrutura

```
scaffold/
├── CLAUDE.md              # Template de instruções para IA
├── README.md              # Este arquivo
├── brainstorming/         # Diretório para material bruto
│   └── .gitkeep
└── specs/                 # Templates de especificação
    ├── user-stories.md    # Template de User Stories
    ├── requirements.md    # Template de Requirements
    └── design.md          # Template de Design
```

## Próximos Passos Após Copiar

1. **Personalizar CLAUDE.md**
   - Atualizar comandos de desenvolvimento
   - Definir portas do projeto
   - Documentar arquitetura
   - Adicionar regras críticas específicas

2. **Adicionar Material ao Brainstorming**
   - Reunir anotações, screenshots, referências
   - Documentar conversas com cliente/stakeholders

3. **Extrair Specs do Brainstorming**
   - Criar User Stories (US001, US002...)
   - Derivar Requirements (REQ001, NFR001...)
   - Documentar decisões de Design (DES001...)

4. **Criar PLAN.md**
   - Checklist de execução com referências
   - Seguir formato de `method/PLAN-FORMAT.md`

5. **Implementar**
   - Seguir PLAN.md
   - Marcar tarefas como concluídas
   - Consultar specs antes de implementar
