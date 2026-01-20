-- Migration: Channel Test Modes
-- Adiciona campos para modos de teste no canal WhatsApp

ALTER TABLE channels ADD COLUMN IF NOT EXISTS echo_enabled BOOLEAN DEFAULT false;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS echo_to_number VARCHAR(20);
ALTER TABLE channels ADD COLUMN IF NOT EXISTS redirect_to_number VARCHAR(20);

COMMENT ON COLUMN channels.echo_enabled IS 'Modo echo: mensagem recebida retorna ao remetente';
COMMENT ON COLUMN channels.echo_to_number IS 'Modo echo-to: mensagem recebida retorna para este numero';
COMMENT ON COLUMN channels.redirect_to_number IS 'Modo redirect: mensagens enviadas vao para este numero';
