# Sync Upstream

Sincroniza o repositorio local com o upstream remoto.

## Argumentos

- `--fetch-only`: Apenas baixa e mostra novidades, sem fazer merge

## Instrucoes

Execute os seguintes passos:

### 1. Verificar upstream

```bash
git remote -v | grep upstream
```

Se upstream NAO estiver configurado, adicione automaticamente:

```bash
git remote add upstream https://github.com/codrstudio/vibe-method.git
```

Informe ao usuario que o upstream foi configurado.

### 2. Fetch upstream

```bash
git fetch upstream
```

### 3. Mostrar commits novos

```bash
git log HEAD..upstream/main --oneline
```

Informe ao usuario quantos commits novos estao disponiveis.

### 4. Merge (se nao for --fetch-only)

Se `$ARGUMENTS` contiver `--fetch-only`:
- Informe que o fetch foi concluido
- Liste os commits novos disponiveis
- **NAO faca merge**

Caso contrario:
- Execute o merge:
```bash
git merge upstream/main
```
- Informe o resultado do merge

### 5. Resumo

Mostre um resumo do que foi feito:
- Branch atual
- Upstream configurado (se foi adicionado nesta execucao)
- Commits sincronizados (ou disponiveis se --fetch-only)
- Status do merge (se aplicavel)
