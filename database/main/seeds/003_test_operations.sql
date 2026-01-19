-- Seed: 003_test_operations.sql
-- Description: Operacoes de teste para WhatsApp
-- Date: 2026-01-19

-- Operação de sistema para teste
INSERT INTO operations (slug, name, description, nature, event_interests, declared_by)
VALUES
  ('test-atendimento', 'Atendimento Teste', 'Operacao de teste para atendimento geral', 'system', ARRAY['MESSAGES_UPSERT', 'CONNECTION_UPDATE'], 'seed'),
  ('test-suporte', 'Suporte Teste', 'Operacao de teste para suporte ao usuario', 'system', ARRAY['MESSAGES_UPSERT'], 'seed')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  event_interests = EXCLUDED.event_interests;

DO $$
BEGIN
  RAISE NOTICE 'Seed 003_test_operations.sql completed successfully';
END $$;
