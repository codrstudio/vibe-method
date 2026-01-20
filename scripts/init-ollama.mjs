#!/usr/bin/env node
/**
 * Script de inicializacao do Ollama
 *
 * - Aguarda o Ollama ficar pronto
 * - Le lista de modelos da config
 * - Filtra modelos por parametros e quantizacao
 * - Faz pull dos modelos selecionados
 * - Verifica modelos disponiveis
 *
 * Env vars:
 *   OLLAMA_HOST (obrigatoria)
 *   OLLAMA_PORT (obrigatoria)
 *   OLLAMA_MAX_PARAMS (opcional - default: 13B)
 *   OLLAMA_ALLOWED_QUANTS (opcional - default: q4_K_M,q4_K_S,q5_K_M)
 *   OLLAMA_PULL_CONCURRENCY (opcional - default: 1)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuracao via env vars
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'ollama.internal';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
const OLLAMA_URL = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;

// Limites de hardware
const OLLAMA_MAX_PARAMS = process.env.OLLAMA_MAX_PARAMS || '13B';
const OLLAMA_ALLOWED_QUANTS = (process.env.OLLAMA_ALLOWED_QUANTS || 'q4_K_M,q4_K_S,q5_K_M').split(',').map(s => s.trim().toLowerCase());
const PULL_CONCURRENCY = parseInt(process.env.OLLAMA_PULL_CONCURRENCY || '1', 10);

// Parse max params (ex: "13B" -> 13, "7B" -> 7)
function parseParams(paramStr) {
  if (!paramStr) return Infinity;
  const match = paramStr.toString().match(/^(\d+(?:\.\d+)?)(B|b)?$/i);
  if (!match) return Infinity;
  return parseFloat(match[1]);
}

const MAX_PARAMS_BILLIONS = parseParams(OLLAMA_MAX_PARAMS);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load models config
function loadModelsConfig() {
  const configPaths = [
    '/app/config/ollama-models.json',
    join(__dirname, '../config/ollama-models.json'),
    join(__dirname, './ollama-models.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      console.log(`Carregando config de: ${configPath}`);
      const content = readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
  }

  console.warn('Config nao encontrada, usando lista padrao');
  return {
    models: [
      { name: 'llama3.2:3b', params: '3B', description: 'Fast, general purpose' },
      { name: 'llama3.1:8b', params: '8B', description: 'Balanced performance' },
    ]
  };
}

// Check if model passes filters
function modelPassesFilters(model) {
  const modelParams = parseParams(model.params);

  // Check params limit
  if (modelParams > MAX_PARAMS_BILLIONS) {
    console.log(`  [SKIP] ${model.name}: ${model.params} > ${OLLAMA_MAX_PARAMS}`);
    return false;
  }

  // Check quantization if specified in model name
  if (model.quant) {
    const quantLower = model.quant.toLowerCase();
    if (!OLLAMA_ALLOWED_QUANTS.includes(quantLower) && !OLLAMA_ALLOWED_QUANTS.includes('all')) {
      console.log(`  [SKIP] ${model.name}: quant ${model.quant} not in allowed list`);
      return false;
    }
  }

  return true;
}

async function waitForOllama(maxAttempts = 60) {
  console.log(`Aguardando Ollama em ${OLLAMA_URL}...`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${OLLAMA_URL}/`);
      if (res.ok || res.status === 200) {
        console.log('Ollama esta pronto!');
        return true;
      }
    } catch (e) {
      // Still not ready
    }
    await sleep(1000);
    process.stdout.write('.');
  }

  console.error('\nOllama nao ficou pronto a tempo');
  return false;
}

async function listLocalModels() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map(m => m.name);
  } catch (e) {
    return [];
  }
}

async function pullModel(modelName) {
  console.log(`\n  [PULL] Baixando ${modelName}...`);
  const startTime = Date.now();

  try {
    const res = await fetch(`${OLLAMA_URL}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: false })
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`  [ERRO] ${modelName}: ${error}`);
      return false;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  [OK] ${modelName} baixado em ${elapsed}s`);
    return true;
  } catch (e) {
    console.error(`  [ERRO] ${modelName}: ${e.message}`);
    return false;
  }
}

async function pullModelWithProgress(modelName) {
  console.log(`\n  [PULL] Baixando ${modelName}...`);
  const startTime = Date.now();

  try {
    const res = await fetch(`${OLLAMA_URL}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true })
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`  [ERRO] ${modelName}: ${error}`);
      return false;
    }

    // Process streaming response
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let lastProgress = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.status) {
            const progress = data.completed && data.total
              ? ` (${Math.round(data.completed / data.total * 100)}%)`
              : '';
            const newProgress = `${data.status}${progress}`;
            if (newProgress !== lastProgress) {
              process.stdout.write(`\r         ${newProgress.padEnd(60)}`);
              lastProgress = newProgress;
            }
          }
          if (data.error) {
            console.error(`\n  [ERRO] ${modelName}: ${data.error}`);
            return false;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n  [OK] ${modelName} baixado em ${elapsed}s`);
    return true;
  } catch (e) {
    console.error(`\n  [ERRO] ${modelName}: ${e.message}`);
    return false;
  }
}

async function pullModelsWithConcurrency(models, concurrency) {
  const results = [];
  const queue = [...models];

  async function worker() {
    while (queue.length > 0) {
      const model = queue.shift();
      if (model) {
        const success = await pullModelWithProgress(model.name);
        results.push({ model: model.name, success });
      }
    }
  }

  // Start workers
  const workers = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

async function verifyModels(expectedModels) {
  console.log('\nVerificando modelos instalados...');
  const localModels = await listLocalModels();

  console.log(`\nModelos disponiveis (${localModels.length}):`);
  for (const model of localModels) {
    console.log(`  - ${model}`);
  }

  const missing = expectedModels.filter(m => {
    // Check if any local model matches (considering tags)
    return !localModels.some(local =>
      local === m.name ||
      local.startsWith(m.name.split(':')[0] + ':')
    );
  });

  if (missing.length > 0) {
    console.warn(`\nModelos nao encontrados (${missing.length}):`);
    for (const m of missing) {
      console.warn(`  - ${m.name}`);
    }
  }

  return missing.length === 0;
}

async function main() {
  console.log('='.repeat(50));
  console.log('  CIA DASHBOARD - Ollama Initialization');
  console.log('='.repeat(50));
  console.log(`\nURL: ${OLLAMA_URL}`);
  console.log(`Max params: ${OLLAMA_MAX_PARAMS}`);
  console.log(`Allowed quants: ${OLLAMA_ALLOWED_QUANTS.join(', ')}`);
  console.log(`Concurrency: ${PULL_CONCURRENCY}`);

  // Wait for Ollama to be ready
  const ready = await waitForOllama();
  if (!ready) {
    process.exit(1);
  }

  // Additional delay to ensure API is fully available
  await sleep(2000);

  // Load models config
  const config = loadModelsConfig();
  console.log(`\nModelos na config: ${config.models.length}`);

  // Filter models
  console.log('\nFiltrando modelos por hardware...');
  const filteredModels = config.models.filter(modelPassesFilters);
  console.log(`Modelos apos filtro: ${filteredModels.length}`);

  if (filteredModels.length === 0) {
    console.log('\nNenhum modelo passou nos filtros. Verifique a config.');
    process.exit(0);
  }

  // Check which models are already installed
  const localModels = await listLocalModels();
  console.log(`\nModelos ja instalados: ${localModels.length}`);

  const modelsToPull = filteredModels.filter(m => {
    const isInstalled = localModels.some(local =>
      local === m.name ||
      local === m.name.split(':')[0] + ':latest'
    );
    if (isInstalled) {
      console.log(`  [OK] ${m.name} ja instalado`);
    }
    return !isInstalled;
  });

  if (modelsToPull.length === 0) {
    console.log('\nTodos os modelos ja estao instalados!');
  } else {
    console.log(`\nModelos para baixar: ${modelsToPull.length}`);
    for (const m of modelsToPull) {
      console.log(`  - ${m.name} (${m.params}): ${m.description || ''}`);
    }

    // Pull models
    console.log('\nIniciando download dos modelos...');
    const results = await pullModelsWithConcurrency(modelsToPull, PULL_CONCURRENCY);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`\nResultado: ${successful} sucesso, ${failed} falha(s)`);
  }

  // Verify final state
  const allGood = await verifyModels(filteredModels);

  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('  Ollama initialized successfully!');
  } else {
    console.log('  Ollama initialized with warnings');
  }
  console.log('='.repeat(50));
  console.log('');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
