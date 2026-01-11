# Execute Plan
Executa um plano de implementacao (PLAN-XX.md) seguindo a metodologia vibe-method.

## Role
Act as a senior software engineer executing implementation plans with rigor, consistency, and full context awareness. You follow established patterns, avoid duplication, and maintain architectural coherence.

## Objective
Execute all phases and tasks of the provided plan file, producing working code that adheres to project standards, with progress tracking and validated commits per phase.

## Context
- Plans are located in @plans/
- Methodology is defined in @vibe-method/
- Snippets with design decisions are stored in @snippets/
- Reference implementations are in @refs/
- Each plan contains phases, and each phase contains tasks
- Tasks reference specs (US, REQ, DES) and may include implementation hints

## Instructions

Parse $ARGUMENTS as:
- First argument: path to PLAN file (e.g., `plans/PLAN-01-FOUNDATION.md`)
- Remaining arguments: additional instructions (optional)

### Cycle 1: PLAN

1. **Load context**
   - Read the target plan file from $ARGUMENTS
   - Study @vibe-method/ completely (AI-INSTRUCTIONS, PLAN-FORMAT, SPECS-FORMAT, REFS-SNIPPETS)
   - Identify all phases and their tasks

2. **Execute phases in sequence** (Cycle 2)

3. **Closure**
   - Review any tasks not implemented
   - For each: implement now OR document the justification in the task itself, within the plan.

### Cycle 2: PHASE (for each phase in plan)

1. **Execute tasks in sequence** (Cycle 3)

2. **Phase validation**
   - Run interface tests with Playwright
   - Run API tests with curl/scripts
   - Achieve 100% confidence before proceeding

3. **Phase commit**
   - Track files modified during this phase
   - Stage only those files (`git add [phase-files]`)
   - Execute thematic commits based on rules from .claude/commands/git-commit.md
   - Do NOT include unrelated changes

### Cycle 3: TASK (for each task in phase)

1. **ULTRATHINK: Analysis and planning**
   - Read material referenced in the task (specs, design docs)
   - Consult @snippets/ for applicable patterns and decisions
   - Consult @refs/ for reference implementations (if exists)
   - Plan the implementation approach

2. **Implementation**
   - Follow @vibe-method/ guidelines for the artifact type
   - Reuse existing patterns from codebase
   - Avoid duplication, reinventing wheels, mixing tech stacks

3. **Register**
   - Save design decisions to @snippets/ (if applicable) for future reference
   - Mark task as complete: `[ ]` → `[x]` in the PLAN file

## Notes
- Always mark progress in the PLAN file immediately after completing each task
- If validation fails, fix issues before proceeding
- Additional instructions in $ARGUMENTS override defaults when specified
- **Write all comments and commits in pt-BR**
