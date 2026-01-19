#!/usr/bin/env node
/**
 * Script de inicializacao do n8n
 *
 * - Aguarda o n8n ficar pronto
 * - Cria usuario admin se necessario (primeiro uso)
 * - Faz login para obter sessao
 * - Verifica se workflows base existem
 * - Importa workflows ausentes de /workflows/*.json
 * - Ativa workflows que devem estar ativos
 *
 * Env vars:
 *   N8N_HOST (default: n8n.internal)
 *   N8N_PORT (default: 5678)
 *   N8N_ADMIN_EMAIL (default: admin@localhost)
 *   N8N_ADMIN_PASSWORD (default: Admin123)
 *   WORKFLOWS_DIR (default: /app/workflows)
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = process.env.WORKFLOWS_DIR || join(__dirname, '..', 'workflows');
const N8N_URL = `http://${process.env.N8N_HOST || 'n8n.internal'}:${process.env.N8N_PORT || '5678'}`;

const N8N_ADMIN_EMAIL = process.env.N8N_ADMIN_EMAIL || 'admin@localhost';
const N8N_ADMIN_PASSWORD = process.env.N8N_ADMIN_PASSWORD || 'Admin123';

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = {
  info: (msg) => console.log('[INFO] ' + msg),
  ok: (msg) => console.log('[OK] ' + msg),
  warn: (msg) => console.warn('[WARN] ' + msg),
  error: (msg) => console.error('[ERROR] ' + msg),
};

async function safeJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { _raw: text, _parseError: true }; }
}

// Session cookie management
let sessionCookie = null;

async function fetchWithCookies(url, options = {}) {
  const headers = { ...options.headers };
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const res = await fetch(url, { ...options, headers });

  // Capture session cookie
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  return res;
}

async function waitForN8n(maxAttempts = 60) {
  console.log(`Aguardando n8n em ${N8N_URL}...`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${N8N_URL}/healthz`);
      if (res.ok) {
        console.log('n8n esta pronto!');
        return true;
      }
    } catch (e) {
      // Still not ready
    }
    await sleep(1000);
    process.stdout.write('.');
  }

  console.error('\nn8n nao ficou pronto a tempo');
  return false;
}

async function checkSetupNeeded() {
  try {
    const res = await fetch(`${N8N_URL}/rest/settings`);
    const data = await safeJson(res);
    if (data._parseError) {
      log.warn('Resposta inesperada de /rest/settings');
      return true;
    }
    const needsSetup = data.data?.userManagement?.showSetupOnFirstLoad === true;
    log.info('Setup necessario: ' + needsSetup);
    return needsSetup;
  } catch (e) {
    log.warn('Erro ao verificar setup: ' + e.message);
    return true;
  }
}

async function createOwner() {
  log.info('Criando usuario admin: ' + N8N_ADMIN_EMAIL + '...');
  const res = await fetch(`${N8N_URL}/rest/owner/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: N8N_ADMIN_EMAIL,
      firstName: 'Admin',
      lastName: 'CIA',
      password: N8N_ADMIN_PASSWORD
    })
  });
  const body = await safeJson(res);
  if (res.ok) {
    log.ok('Usuario admin criado!');
    return true;
  } else {
    log.error('Erro ao criar admin (' + res.status + '): ' + (body.message || body._raw?.substring(0, 200)));
    return false;
  }
}

async function login() {
  log.info('Fazendo login como ' + N8N_ADMIN_EMAIL + '...');
  const res = await fetchWithCookies(`${N8N_URL}/rest/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrLdapLoginId: N8N_ADMIN_EMAIL,
      password: N8N_ADMIN_PASSWORD
    })
  });
  const body = await safeJson(res);
  if (!res.ok) {
    log.error('Login falhou (' + res.status + '): ' + (body.message || body._raw?.substring(0, 200)));
    return false;
  }
  log.ok('Login realizado!');
  return true;
}

async function validateSession() {
  log.info('Validando sessao...');
  const res = await fetchWithCookies(`${N8N_URL}/rest/users`);
  if (!res.ok) {
    log.error('Sessao invalida (' + res.status + ')');
    return false;
  }
  log.ok('Sessao validada!');
  return true;
}

async function getExistingWorkflows() {
  try {
    const res = await fetchWithCookies(`${N8N_URL}/rest/workflows`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    return [];
  }
}

async function importWorkflow(workflow) {
  try {
    const res = await fetchWithCookies(`${N8N_URL}/rest/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...workflow, active: false })
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`Erro ao importar ${workflow.name}:`, error);
      return null;
    }

    const result = await res.json();
    const data = result.data || result;
    console.log(`Workflow "${workflow.name}" importado (ID: ${data.id})`);
    return data;
  } catch (e) {
    console.error(`Erro ao importar ${workflow.name}:`, e.message);
    return null;
  }
}

async function updateWorkflow(id, workflow, versionId) {
  try {
    const res = await fetchWithCookies(`${N8N_URL}/rest/workflows/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || {},
        versionId
      })
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`Erro ao atualizar ${workflow.name}:`, error.substring(0, 100));
      return null;
    }

    const result = await res.json();
    const data = result.data || result;
    console.log(`Workflow "${workflow.name}" atualizado (ID: ${data.id})`);
    return data;
  } catch (e) {
    console.error(`Erro ao atualizar ${workflow.name}:`, e.message);
    return null;
  }
}

async function activateWorkflow(id, versionId) {
  try {
    let res = await fetchWithCookies(`${N8N_URL}/rest/workflows/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true, versionId })
    });

    if (!res.ok) {
      res = await fetchWithCookies(`${N8N_URL}/rest/workflows/${id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
    }

    if (res.ok) {
      console.log(`  -> Workflow ${id} ativado`);
      return true;
    } else {
      const error = await res.text();
      console.error(`  -> Erro ao ativar workflow ${id}: ${error.substring(0, 100)}`);
    }
  } catch (e) {
    console.error(`  -> Erro ao ativar workflow ${id}:`, e.message);
  }
  return false;
}

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  CIA DASHBOARD - n8n Initialization');
  console.log('='.repeat(50) + '\n');

  console.log(`URL: ${N8N_URL}`);
  console.log(`Admin: ${N8N_ADMIN_EMAIL}`);
  console.log(`Workflows dir: ${WORKFLOWS_DIR}`);

  if (!await waitForN8n()) {
    process.exit(1);
  }

  log.info('Aguardando API estabilizar...');
  await sleep(3000);

  let authenticated = false;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log('\n--- Tentativa ' + attempt + '/' + MAX_RETRIES + ' ---\n');

    const needsSetup = await checkSetupNeeded();
    if (needsSetup) {
      const created = await createOwner();
      if (!created) {
        log.warn('Falha ao criar owner, tentando novamente...');
        await sleep(RETRY_DELAY);
        continue;
      }
    }

    if (!await login()) {
      log.warn('Falha no login, tentando novamente...');
      await sleep(RETRY_DELAY);
      continue;
    }

    if (!await validateSession()) {
      log.warn('Sessao invalida apos login, tentando novamente...');
      await sleep(RETRY_DELAY);
      continue;
    }

    authenticated = true;
    break;
  }

  if (!authenticated) {
    log.error('Falha na autenticacao apos ' + MAX_RETRIES + ' tentativas');
    process.exit(1);
  }

  // List existing workflows
  const existing = await getExistingWorkflows();
  const existingNames = new Set(existing.map(w => w.name));
  console.log(`\nWorkflows existentes: ${existing.length}`);

  // Read workflows from directory
  let workflowFiles = [];
  if (existsSync(WORKFLOWS_DIR)) {
    try {
      workflowFiles = readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json'));
    } catch (e) {
      console.log('Erro ao ler diretorio de workflows:', e.message);
    }
  } else {
    console.log('Diretorio de workflows nao encontrado:', WORKFLOWS_DIR);
  }

  console.log(`Workflows no repositorio: ${workflowFiles.length}`);

  // Build map of existing workflows by name
  const existingByName = new Map(existing.map(w => [w.name, w]));

  // Import missing workflows and activate as needed
  for (const file of workflowFiles) {
    const filePath = join(WORKFLOWS_DIR, file);
    const workflow = JSON.parse(readFileSync(filePath, 'utf-8'));
    const shouldBeActive = workflow.active === true;

    // Check if workflow already exists
    const existingWorkflow = existingByName.get(workflow.name);
    if (existingWorkflow) {
      // Update existing workflow
      const updated = await updateWorkflow(existingWorkflow.id, workflow, existingWorkflow.versionId);
      if (updated && shouldBeActive && !updated.active) {
        await activateWorkflow(updated.id, updated.versionId);
      }
      continue;
    }

    // Import new workflow
    delete workflow.active;

    const imported = await importWorkflow(workflow);

    if (imported && shouldBeActive && imported.id) {
      await activateWorkflow(imported.id, imported.versionId);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('  n8n initialized successfully!');
  console.log('='.repeat(50));
  console.log(`\nAdmin: ${N8N_ADMIN_EMAIL}`);
  console.log(`Password: ${N8N_ADMIN_PASSWORD}`);
  console.log('');
}

main().catch((e) => {
  log.error('Erro fatal: ' + e.message);
  console.error(e.stack);
  process.exit(1);
});
