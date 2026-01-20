#!/usr/bin/env node
/**
 * PostgreSQL MAIN Initialization Script
 *
 * Garante que o banco transacional esta no estado correto.
 * - Cria databases se nao existirem
 * - Cria schemas se nao existirem
 * - Cria extensoes necessarias
 * - Executa migrations em ordem (database/migrations/*.sql)
 * - Executa seed basico
 *
 * Env vars:
 *   POSTGRES_HOST (default: postgres-main.internal)
 *   POSTGRES_PORT (default: 5432)
 *   POSTGRES_MAIN_SUPERUSER / POSTGRES_MAIN_SUPERUSER_PASSWORD
 *   POSTGRES_MAIN_USER / POSTGRES_MAIN_PASSWORD
 *   POSTGRES_MAIN_DB (default: main)
 *   ENVIRONMENT (default: development)
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  superuser: process.env.POSTGRES_MAIN_SUPERUSER,
  superpassword: process.env.POSTGRES_MAIN_SUPERUSER_PASSWORD,
  user: process.env.POSTGRES_MAIN_USER,
  password: process.env.POSTGRES_MAIN_PASSWORD,
  database: process.env.POSTGRES_MAIN_DB,
  environment: process.env.ENVIRONMENT,
};

// Databases para criar (main + evolution)
const DATABASES = [config.database, 'evolution'];

// Schemas para criar em cada database
const SCHEMAS = {
  [config.database]: ['public', 'n8n'],
};

// Extensoes para criar
const EXTENSIONS = ['uuid-ossp', 'pgcrypto'];

// SQL para criar tabelas base
const TABLES_SQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMPTZ,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    image TEXT,
    role VARCHAR(50) DEFAULT 'operator',
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- User roles table (multi-role) - roles definidos via artefato
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Accounts table (OAuth)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(255),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Tenant config table
CREATE TABLE IF NOT EXISTS tenant_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    nome_curto VARCHAR(50),
    slogan VARCHAR(200),
    logo_url VARCHAR(500),
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'Sao Paulo',
    uf VARCHAR(2) DEFAULT 'SP',
    cep VARCHAR(9),
    telefone_fixo VARCHAR(20),
    telefone_whatsapp VARCHAR(20),
    email VARCHAR(200),
    instagram VARCHAR(100),
    horario_abertura TIME DEFAULT '08:00',
    horario_fechamento TIME DEFAULT '18:00',
    dias_funcionamento VARCHAR(50) DEFAULT 'seg-sex',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Functions
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(SELECT role FROM user_roles WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = p_role);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_config_updated_at ON tenant_config;
CREATE TRIGGER update_tenant_config_updated_at
    BEFORE UPDATE ON tenant_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

// Seed basico (usuarios de teste)
// Hash bcrypt de "12345678"
const BCRYPT_HASH = '$2b$10$KBRyeq41bzUNMZMF99yoSuoGV28d0DJPkgOPBabNj4d0D.WxUdYhG';

const SEED_SQL = `
-- =============================================================================
-- SEED BASE DO MOTOR (usuarios genericos para teste)
-- Usuarios especificos do negocio devem ser criados via artefatos
-- =============================================================================

-- Admin user (acesso total ao sistema)
INSERT INTO users (id, email, password_hash, name, role, is_active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@mail.com',
    '${BCRYPT_HASH}',
    'Admin',
    'admin',
    TRUE
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Buscar ID do usuario admin (pode ser diferente se ja existia)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'admin@mail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Operator user (acesso basico)
INSERT INTO users (id, email, password_hash, name, role, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'operator@mail.com',
    '${BCRYPT_HASH}',
    'Operator',
    'operator',
    TRUE
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Buscar ID do usuario operator (pode ser diferente se ja existia)
INSERT INTO user_roles (user_id, role)
SELECT id, 'operator' FROM users WHERE email = 'operator@mail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================================================
-- NOTA: Tenant config e usuarios adicionais devem ser definidos em artefatos
-- do projeto e carregados via seeds especificos em data/seeds/
-- =============================================================================
`;

async function connect(database = 'postgres', asSuperuser = true) {
  const client = new pg.Client({
    host: config.host,
    port: config.port,
    user: asSuperuser ? config.superuser : config.user,
    password: asSuperuser ? config.superpassword : config.password,
    database,
  });
  await client.connect();
  return client;
}

async function executeSqlFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
}

async function databaseExists(client, dbname) {
  const result = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbname]
  );
  return result.rows.length > 0;
}

async function userExists(client, username) {
  const result = await client.query(
    `SELECT 1 FROM pg_roles WHERE rolname = $1`,
    [username]
  );
  return result.rows.length > 0;
}

async function schemaExists(client, schemaName) {
  const result = await client.query(
    `SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`,
    [schemaName]
  );
  return result.rows.length > 0;
}

async function extensionExists(client, extName) {
  const result = await client.query(
    `SELECT 1 FROM pg_extension WHERE extname = $1`,
    [extName]
  );
  return result.rows.length > 0;
}

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return result.rows.length > 0;
}

async function waitForPostgres(maxAttempts = 30) {
  console.log(`Aguardando PostgreSQL em ${config.host}:${config.port}...`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const client = await connect('postgres');
      await client.end();
      console.log('PostgreSQL esta pronto!');
      return true;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }
  }

  console.error('\nPostgreSQL nao ficou pronto a tempo');
  return false;
}

async function main() {
  console.log('='.repeat(50));
  console.log('  CIA DASHBOARD - PostgreSQL MAIN Initialization');
  console.log('='.repeat(50));
  console.log(`\nHost: ${config.host}:${config.port}`);
  console.log(`Superuser: ${config.superuser}`);
  console.log(`App User: ${config.user}`);
  console.log(`Database: ${config.database}`);
  console.log(`Environment: ${config.environment}\n`);

  // Aguardar PostgreSQL
  const ready = await waitForPostgres();
  if (!ready) {
    process.exit(1);
  }

  let client;

  try {
    // [1/6] Criar usuario da aplicacao
    console.log('\n[1/6] Checking application user...');
    client = await connect('postgres');

    process.stdout.write(`      ${config.user}: `);
    if (await userExists(client, config.user)) {
      console.log('exists');
    } else {
      await client.query(`CREATE USER "${config.user}" WITH PASSWORD '${config.password}'`);
      console.log('created');
    }

    await client.end();

    // [2/6] Criar databases
    console.log('\n[2/6] Checking databases...');
    client = await connect('postgres');

    for (const dbname of DATABASES) {
      process.stdout.write(`      ${dbname}: `);
      if (await databaseExists(client, dbname)) {
        console.log('exists');
      } else {
        await client.query(`CREATE DATABASE "${dbname}" OWNER "${config.user}"`);
        console.log('created');
      }
    }

    // Grant all privileges
    for (const dbname of DATABASES) {
      await client.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbname}" TO "${config.user}"`);
    }

    await client.end();

    // [3/6] Criar extensoes
    console.log('\n[3/6] Creating extensions...');
    for (const dbname of DATABASES) {
      console.log(`      Database: ${dbname}`);
      client = await connect(dbname);

      for (const ext of EXTENSIONS) {
        process.stdout.write(`        ${ext}: `);
        if (await extensionExists(client, ext)) {
          console.log('exists');
        } else {
          await client.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
          console.log('created');
        }
      }

      await client.end();
    }

    // [4/6] Criar schemas
    console.log('\n[4/6] Creating schemas...');
    for (const [dbname, schemas] of Object.entries(SCHEMAS)) {
      console.log(`      Database: ${dbname}`);
      client = await connect(dbname);

      for (const schema of schemas) {
        if (schema === 'public') continue;

        process.stdout.write(`        ${schema}: `);
        if (await schemaExists(client, schema)) {
          console.log('exists');
        } else {
          await client.query(`CREATE SCHEMA "${schema}" AUTHORIZATION "${config.user}"`);
          console.log('created');
        }
      }

      // Grant schema permissions
      for (const schema of schemas) {
        await client.query(`GRANT ALL ON SCHEMA "${schema}" TO "${config.user}"`);
      }

      await client.end();
    }

    // [5/6] Executar migrations
    console.log('\n[5/6] Running migrations...');
    client = await connect(config.database);

    // Primeiro, executar TABLES_SQL se tabela users nao existe
    if (!(await tableExists(client, 'users'))) {
      console.log('      Creating base tables...');
      await client.query(TABLES_SQL);
      console.log('      Base tables created');
    } else {
      console.log('      Base tables already exist');
    }

    // Depois, executar migration files de database/migrations/
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      if (files.length > 0) {
        console.log(`      Found ${files.length} migration file(s)`);
        for (const file of files) {
          process.stdout.write(`      ${file}... `);
          try {
            await executeSqlFile(client, path.join(migrationsDir, file));
            console.log('ok');
          } catch (err) {
            if (err.code === '42P07' || err.code === '42710' || err.code === '23505') {
              console.log('skipped (already exists)');
            } else {
              console.log(`error: ${err.message}`);
            }
          }
        }
      } else {
        console.log('      No migration files found');
      }
    } else {
      console.log('      Migrations dir not found at database/migrations/');
    }

    // Grant table permissions
    await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${config.user}"`);
    await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${config.user}"`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${config.user}"`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${config.user}"`);

    await client.end();

    // [6/6] Executar seeds
    console.log('\n[6/6] Running seeds...');
    client = await connect(config.database);

    console.log('      Running base seed...');
    await client.query(SEED_SQL);
    console.log('      Base seed complete');

    // Executar seed files de database/seeds/
    const seedsDir = path.join(__dirname, 'seeds');
    if (fs.existsSync(seedsDir)) {
      const seedFiles = fs.readdirSync(seedsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      if (seedFiles.length > 0) {
        console.log(`      Found ${seedFiles.length} seed file(s)`);
        for (const file of seedFiles) {
          process.stdout.write(`      ${file}... `);
          try {
            await executeSqlFile(client, path.join(seedsDir, file));
            console.log('ok');
          } catch (err) {
            if (err.code === '23505') {
              console.log('skipped (data exists)');
            } else {
              console.log(`error: ${err.message}`);
            }
          }
        }
      }
    }

    await client.end();

    console.log('\n' + '='.repeat(50));
    console.log('  PostgreSQL MAIN initialized successfully!');
    console.log('='.repeat(50));
    console.log(`\nDatabases: ${DATABASES.join(', ')}`);
    console.log(`Schemas: ${Object.values(SCHEMAS).flat().join(', ')}`);
    console.log(`Environment: ${config.environment}`);

    console.log('\nUsers (senha: 12345678):');
    console.log('  - admin@mail.com (admin)');
    console.log('  - operator@mail.com (operator)');
    console.log('');

  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

main();
