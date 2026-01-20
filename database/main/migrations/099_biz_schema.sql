-- Migration: 099_biz_schema
-- Description: Cria schema 'biz' para tabelas de negocio
-- 
-- O schema 'biz' isola tabelas de negocio (fork) das tabelas do motor (public).
-- Migrations de negocio (1XX+) devem criar tabelas em biz.*

-- Criar schema se nao existir
CREATE SCHEMA IF NOT EXISTS biz;

-- Comentario para documentacao
COMMENT ON SCHEMA biz IS 'Schema para tabelas de negocio - isolado do motor (public)';
