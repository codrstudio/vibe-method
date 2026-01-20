#!/usr/bin/env node
/**
 * PostgreSQL ANALYTICS Initialization Script
 *
 * Garante que o banco OLAP (modelo estrela) esta no estado correto.
 * - Cria database se nao existir
 * - Cria schemas se nao existirem
 * - Cria extensoes necessarias
 * - Cria tabelas dimensao e fato
 *
 * Env vars:
 *   POSTGRES_HOST (default: postgres-analytics.internal)
 *   POSTGRES_PORT (default: 5432)
 *   POSTGRES_ANALYTICS_SUPERUSER / POSTGRES_ANALYTICS_SUPERUSER_PASSWORD
 *   POSTGRES_ANALYTICS_USER / POSTGRES_ANALYTICS_PASSWORD
 *   POSTGRES_ANALYTICS_DB
 *   ENVIRONMENT (default: development)
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: process.env.POSTGRES_HOST || 'postgres-analytics.internal',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  superuser: process.env.POSTGRES_ANALYTICS_SUPERUSER,
  superpassword: process.env.POSTGRES_ANALYTICS_SUPERUSER_PASSWORD,
  user: process.env.POSTGRES_ANALYTICS_USER,
  password: process.env.POSTGRES_ANALYTICS_PASSWORD ,
  database: process.env.POSTGRES_ANALYTICS_DB,
  environment: process.env.ENVIRONMENT,
};

// Extensoes para criar
const EXTENSIONS = ['uuid-ossp'];

// SQL para criar tabelas OLAP (modelo estrela)
const TABLES_SQL = `
-- ============================================================================
-- DIMENSOES
-- ============================================================================

-- Dimensao Tempo
CREATE TABLE IF NOT EXISTS dim_tempo (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL UNIQUE,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    trimestre INTEGER NOT NULL,
    semestre INTEGER NOT NULL,
    dia_semana INTEGER NOT NULL,
    dia_semana_nome VARCHAR(20) NOT NULL,
    mes_nome VARCHAR(20) NOT NULL,
    eh_fim_semana BOOLEAN NOT NULL,
    eh_feriado BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_dim_tempo_data ON dim_tempo(data);
CREATE INDEX IF NOT EXISTS idx_dim_tempo_ano_mes ON dim_tempo(ano, mes);

-- Dimensao Funcionario
CREATE TABLE IF NOT EXISTS dim_funcionario (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    funcao VARCHAR(100),
    status VARCHAR(50),
    data_admissao DATE,
    data_demissao DATE,
    unidade_id INTEGER,
    unidade_nome VARCHAR(255),
    -- SCD Type 2
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE DEFAULT '9999-12-31',
    is_current BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_dim_funcionario_id ON dim_funcionario(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_dim_funcionario_current ON dim_funcionario(is_current);

-- Dimensao Assistido
CREATE TABLE IF NOT EXISTS dim_assistido (
    id SERIAL PRIMARY KEY,
    assistido_id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    sexo VARCHAR(20),
    status VARCHAR(50),
    contratante_id INTEGER,
    contratante_nome VARCHAR(255),
    -- SCD Type 2
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE DEFAULT '9999-12-31',
    is_current BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_dim_assistido_id ON dim_assistido(assistido_id);
CREATE INDEX IF NOT EXISTS idx_dim_assistido_current ON dim_assistido(is_current);

-- Dimensao Contratante
CREATE TABLE IF NOT EXISTS dim_contratante (
    id SERIAL PRIMARY KEY,
    contratante_id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    -- SCD Type 2
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE DEFAULT '9999-12-31',
    is_current BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_dim_contratante_id ON dim_contratante(contratante_id);
CREATE INDEX IF NOT EXISTS idx_dim_contratante_current ON dim_contratante(is_current);

-- Dimensao Servico
CREATE TABLE IF NOT EXISTS dim_servico (
    id SERIAL PRIMARY KEY,
    servico_id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    categoria VARCHAR(100),
    -- SCD Type 1
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dim_servico_id ON dim_servico(servico_id);

-- ============================================================================
-- FATOS
-- ============================================================================

-- Fato Escala (plantoes realizados)
CREATE TABLE IF NOT EXISTS fato_escala (
    id SERIAL PRIMARY KEY,
    tempo_id INTEGER REFERENCES dim_tempo(id),
    funcionario_id INTEGER REFERENCES dim_funcionario(id),
    assistido_id INTEGER REFERENCES dim_assistido(id),
    contratante_id INTEGER REFERENCES dim_contratante(id),
    servico_id INTEGER REFERENCES dim_servico(id),
    -- Metricas
    horas_previstas DECIMAL(5,2),
    horas_realizadas DECIMAL(5,2),
    valor_hora DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    qtd_faltas INTEGER DEFAULT 0,
    qtd_atrasos INTEGER DEFAULT 0,
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fato_escala_tempo ON fato_escala(tempo_id);
CREATE INDEX IF NOT EXISTS idx_fato_escala_funcionario ON fato_escala(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_fato_escala_assistido ON fato_escala(assistido_id);

-- Fato Financeiro (receitas e despesas)
CREATE TABLE IF NOT EXISTS fato_financeiro (
    id SERIAL PRIMARY KEY,
    tempo_id INTEGER REFERENCES dim_tempo(id),
    contratante_id INTEGER REFERENCES dim_contratante(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    categoria VARCHAR(100),
    -- Metricas
    valor_previsto DECIMAL(12,2),
    valor_realizado DECIMAL(12,2),
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fato_financeiro_tempo ON fato_financeiro(tempo_id);
CREATE INDEX IF NOT EXISTS idx_fato_financeiro_tipo ON fato_financeiro(tipo);

-- Fato Atendimento (interacoes com assistidos)
CREATE TABLE IF NOT EXISTS fato_atendimento (
    id SERIAL PRIMARY KEY,
    tempo_id INTEGER REFERENCES dim_tempo(id),
    funcionario_id INTEGER REFERENCES dim_funcionario(id),
    assistido_id INTEGER REFERENCES dim_assistido(id),
    tipo_atendimento VARCHAR(100),
    -- Metricas
    duracao_minutos INTEGER,
    satisfacao_score INTEGER CHECK (satisfacao_score BETWEEN 1 AND 5),
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fato_atendimento_tempo ON fato_atendimento(tempo_id);
CREATE INDEX IF NOT EXISTS idx_fato_atendimento_assistido ON fato_atendimento(assistido_id);

-- ============================================================================
-- FUNCOES AUXILIARES
-- ============================================================================

-- Funcao para popular dim_tempo
CREATE OR REPLACE FUNCTION populate_dim_tempo(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    d DATE;
    count INTEGER := 0;
BEGIN
    d := start_date;
    WHILE d <= end_date LOOP
        INSERT INTO dim_tempo (data, ano, mes, dia, trimestre, semestre, dia_semana, dia_semana_nome, mes_nome, eh_fim_semana)
        VALUES (
            d,
            EXTRACT(YEAR FROM d),
            EXTRACT(MONTH FROM d),
            EXTRACT(DAY FROM d),
            EXTRACT(QUARTER FROM d),
            CASE WHEN EXTRACT(MONTH FROM d) <= 6 THEN 1 ELSE 2 END,
            EXTRACT(DOW FROM d),
            TO_CHAR(d, 'Day'),
            TO_CHAR(d, 'Month'),
            EXTRACT(DOW FROM d) IN (0, 6)
        )
        ON CONFLICT (data) DO NOTHING;
        d := d + 1;
        count := count + 1;
    END LOOP;
    RETURN count;
END;
$$ LANGUAGE plpgsql;
`;

// Seed: popular dim_tempo com datas de 2020 a 2030
const SEED_SQL = `
-- Popular dimensao tempo (2020-2030)
SELECT populate_dim_tempo('2020-01-01'::DATE, '2030-12-31'::DATE);
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
  console.log('  CIA DASHBOARD - PostgreSQL ANALYTICS Init');
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
    // [1/5] Criar usuario da aplicacao
    console.log('\n[1/5] Checking application user...');
    client = await connect('postgres');

    process.stdout.write(`      ${config.user}: `);
    if (await userExists(client, config.user)) {
      console.log('exists');
    } else {
      await client.query(`CREATE USER "${config.user}" WITH PASSWORD '${config.password}'`);
      console.log('created');
    }

    await client.end();

    // [2/5] Criar database
    console.log('\n[2/5] Checking database...');
    client = await connect('postgres');

    process.stdout.write(`      ${config.database}: `);
    if (await databaseExists(client, config.database)) {
      console.log('exists');
    } else {
      await client.query(`CREATE DATABASE "${config.database}" OWNER "${config.user}"`);
      console.log('created');
    }

    await client.query(`GRANT ALL PRIVILEGES ON DATABASE "${config.database}" TO "${config.user}"`);
    await client.end();

    // [3/5] Criar extensoes
    console.log('\n[3/5] Creating extensions...');
    client = await connect(config.database);

    for (const ext of EXTENSIONS) {
      process.stdout.write(`      ${ext}: `);
      if (await extensionExists(client, ext)) {
        console.log('exists');
      } else {
        await client.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
        console.log('created');
      }
    }

    await client.end();

    // [4/5] Criar tabelas OLAP
    console.log('\n[4/5] Creating OLAP tables...');
    client = await connect(config.database);

    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      if (files.length > 0) {
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
        console.log('      No migration files found, using inline SQL...');
        if (!(await tableExists(client, 'dim_tempo'))) {
          await client.query(TABLES_SQL);
          console.log('      OLAP tables created');
        } else {
          console.log('      Tables already exist');
        }
      }
    } else {
      console.log('      Migrations dir not found, using inline SQL...');
      if (!(await tableExists(client, 'dim_tempo'))) {
        await client.query(TABLES_SQL);
        console.log('      OLAP tables created');
      } else {
        console.log('      Tables already exist');
      }
    }

    // Grant permissions
    await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${config.user}"`);
    await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${config.user}"`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${config.user}"`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${config.user}"`);

    await client.end();

    // [5/5] Popular dim_tempo
    console.log('\n[5/5] Populating dim_tempo...');
    client = await connect(config.database);

    const result = await client.query(`SELECT COUNT(*) FROM dim_tempo`);
    if (parseInt(result.rows[0].count) === 0) {
      console.log('      Populating dates 2020-2030...');
      await client.query(SEED_SQL);
      const count = await client.query(`SELECT COUNT(*) FROM dim_tempo`);
      console.log(`      Inserted ${count.rows[0].count} dates`);
    } else {
      console.log(`      dim_tempo already has ${result.rows[0].count} records`);
    }

    await client.end();

    console.log('\n' + '='.repeat(50));
    console.log('  PostgreSQL ANALYTICS initialized successfully!');
    console.log('='.repeat(50));
    console.log(`\nDatabase: ${config.database}`);
    console.log(`Environment: ${config.environment}`);
    console.log('\nOLAP Tables:');
    console.log('  Dimensions: dim_tempo, dim_funcionario, dim_assistido, dim_contratante, dim_servico');
    console.log('  Facts: fato_escala, fato_financeiro, fato_atendimento');
    console.log('');

  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

main();
