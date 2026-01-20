#!/usr/bin/env node
/**
 * Database Migration Script
 *
 * Roda migrations e seeds no banco especificado.
 *
 * Uso:
 *   npm run migrate:main      # Migrations + seeds no banco main
 *   npm run migrate:analytics # Migrations no banco analytics
 *
 * Env vars (via dotenv-cli):
 *   POSTGRES_MAIN_HOST, POSTGRES_MAIN_PORT, POSTGRES_MAIN_USER, etc.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Qual banco rodar (main ou analytics)
const target = process.argv[2] || 'main';

// Para dev local, o host é localhost (não o interno do docker)
const getHost = (envHost) => {
  if (!envHost) return 'localhost';
  return envHost.includes('.internal') ? 'localhost' : envHost;
};

const configs = {
  main: {
    host: getHost(process.env.POSTGRES_MAIN_HOST),
    port: parseInt(process.env.POSTGRES_MAIN_PORT || '8050'),
    user: process.env.POSTGRES_MAIN_USER,
    password: process.env.POSTGRES_MAIN_PASSWORD,
    database: process.env.POSTGRES_MAIN_DB,
    migrationsDir: path.join(rootDir, 'database/main/migrations'),
    seedsDir: path.join(rootDir, 'database/main/seeds'),
  },
  analytics: {
    host: getHost(process.env.POSTGRES_ANALYTICS_HOST),
    port: parseInt(process.env.POSTGRES_ANALYTICS_PORT || '8058'),
    user: process.env.POSTGRES_ANALYTICS_USER,
    password: process.env.POSTGRES_ANALYTICS_PASSWORD,
    database: process.env.POSTGRES_ANALYTICS_DB,
    migrationsDir: path.join(rootDir, 'database/analytics/migrations'),
    seedsDir: path.join(rootDir, 'database/analytics/seeds'),
  },
};

const config = configs[target];

if (!config) {
  console.error(`Target desconhecido: ${target}`);
  console.error('Use: main ou analytics');
  process.exit(1);
}

async function connect() {
  const client = new pg.Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });
  await client.connect();
  return client;
}

async function executeSqlFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
}

async function runMigrations(client) {
  if (!fs.existsSync(config.migrationsDir)) {
    console.log('  Nenhum diretorio de migrations encontrado');
    return;
  }

  const files = fs.readdirSync(config.migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('  Nenhuma migration encontrada');
    return;
  }

  console.log(`  Encontradas ${files.length} migration(s)`);

  for (const file of files) {
    process.stdout.write(`  ${file}... `);
    try {
      await executeSqlFile(client, path.join(config.migrationsDir, file));
      console.log('ok');
    } catch (err) {
      // Ignora erros de "já existe"
      if (['42P07', '42710', '23505', '42P01'].includes(err.code)) {
        console.log('skipped (already exists)');
      } else {
        console.log(`ERRO: ${err.message}`);
      }
    }
  }
}

async function runSeeds(client) {
  if (!fs.existsSync(config.seedsDir)) {
    console.log('  Nenhum diretorio de seeds encontrado');
    return;
  }

  const files = fs.readdirSync(config.seedsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('  Nenhum seed encontrado');
    return;
  }

  console.log(`  Encontrados ${files.length} seed(s)`);

  for (const file of files) {
    process.stdout.write(`  ${file}... `);
    try {
      await executeSqlFile(client, path.join(config.seedsDir, file));
      console.log('ok');
    } catch (err) {
      if (err.code === '23505') {
        console.log('skipped (data exists)');
      } else {
        console.log(`ERRO: ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log(`  Database Migration: ${target.toUpperCase()}`);
  console.log('='.repeat(50));
  console.log(`\nHost: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}\n`);

  let client;

  try {
    console.log('[1/2] Rodando migrations...');
    client = await connect();
    await runMigrations(client);
    await client.end();

    console.log('\n[2/2] Rodando seeds...');
    client = await connect();
    await runSeeds(client);
    await client.end();

    console.log('\n' + '='.repeat(50));
    console.log('  Migrations concluidas com sucesso!');
    console.log('='.repeat(50) + '\n');

  } catch (err) {
    console.error(`\nErro: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
      console.error('Verifique se o banco esta rodando (docker:up)');
    }
    process.exit(1);
  }
}

main();
