-- Seed: 004_llm_intents.sql
-- Description: Intents iniciais para uso de LLM
-- Date: 2026-01-19

INSERT INTO llm_intents (slug, title, subtitle, icon, description, profile, declared_by)
VALUES
  (
    'classify',
    'Classificar',
    'Analise de intencao e urgencia',
    'tag',
    'Classifica mensagens por intencao, urgencia e contexto. Usado pelo triager.',
    '{"maxParams":"13b","requiresJSON":true,"priority":"speed"}',
    'seed'
  ),
  (
    'generate',
    'Gerar Resposta',
    'Geracao de texto contextualizado',
    'message-square',
    'Gera respostas baseadas em contexto recuperado. Usado pelo copilot.',
    '{"minParams":"13b","priority":"quality"}',
    'seed'
  ),
  (
    'extract',
    'Extrair Dados',
    'Extracao estruturada de informacoes',
    'database',
    'Extrai entidades e dados estruturados de texto livre.',
    '{"maxParams":"13b","requiresJSON":true,"priority":"speed"}',
    'seed'
  ),
  (
    'plan',
    'Planejar Acoes',
    'Planejamento de proximos passos',
    'list-todo',
    'Planeja sequencia de acoes baseado em contexto. Usado pelo triager.',
    '{"minParams":"7b","maxParams":"70b","requiresJSON":true}',
    'seed'
  ),
  (
    'decide',
    'Decidir',
    'Tomada de decisao com justificativa',
    'git-branch',
    'Toma decisoes explicaveis entre opcoes disponiveis.',
    '{"minParams":"13b","requiresJSON":true}',
    'seed'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  profile = EXCLUDED.profile;

-- Default bindings (funciona out of the box)
-- classify: ollama/llama3.2:3b - Alta frequência, rápido, custo zero
-- extract: ollama/qwen2.5:7b - Bom em JSON estruturado, custo zero
-- generate: openrouter/anthropic/claude-3-haiku - Qualidade, barato
-- plan: openrouter/anthropic/claude-3.5-sonnet - Raciocínio complexo
-- decide: openrouter/openai/gpt-4o-mini - Confiável, barato
INSERT INTO llm_bindings (intent_id, provider, model, temperature, is_active, priority)
SELECT id, 'ollama', 'llama3.2:3b', 0.3, true, 0 FROM llm_intents WHERE slug = 'classify'
UNION ALL
SELECT id, 'ollama', 'qwen2.5:7b', 0.2, true, 0 FROM llm_intents WHERE slug = 'extract'
UNION ALL
SELECT id, 'openrouter', 'anthropic/claude-3-haiku', 0.7, true, 0 FROM llm_intents WHERE slug = 'generate'
UNION ALL
SELECT id, 'openrouter', 'anthropic/claude-3.5-sonnet', 0.3, true, 0 FROM llm_intents WHERE slug = 'plan'
UNION ALL
SELECT id, 'openrouter', 'openai/gpt-4o-mini', 0.3, true, 0 FROM llm_intents WHERE slug = 'decide'
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Seed 004_llm_intents.sql completed successfully';
END $$;
