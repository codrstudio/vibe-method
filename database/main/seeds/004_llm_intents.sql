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

DO $$
BEGIN
  RAISE NOTICE 'Seed 004_llm_intents.sql completed successfully';
END $$;
