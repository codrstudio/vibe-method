#!/usr/bin/env node
/**
 * Script de inicializacao do Evolution API
 *
 * - Aguarda o Evolution ficar pronto
 * - Cria instancia se nao existir
 * - Configura Webhook para enviar eventos ao backbone
 * - Verifica configuracao final
 *
 * Env vars:
 *   EVOLUTION_HOST (obrigatoria)
 *   EVOLUTION_PORT (obrigatoria)
 *   EVOLUTION_API_KEY (obrigatoria)
 *   EVOLUTION_INSTANCE_NAME (obrigatoria)
 *   EVOLUTION_INSTANCE_TOKEN (opcional)
 *   BACKBONE_WEBHOOK_URL (obrigatoria)
 *   TENANT_PHONE (opcional - telefone para msg de rejeicao de chamada)
 */

// Configuracao via env vars
const EVOLUTION_HOST = process.env.EVOLUTION_HOST;
const EVOLUTION_PORT = process.env.EVOLUTION_PORT;
const EVOLUTION_URL = `http://${EVOLUTION_HOST}:${EVOLUTION_PORT}`;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME;
const EVOLUTION_INSTANCE_TOKEN = process.env.EVOLUTION_INSTANCE_TOKEN;

// URL do webhook backbone
const BACKBONE_WEBHOOK_URL = process.env.BACKBONE_WEBHOOK_URL;

// Telefone da empresa para mensagem de rejeicao de chamada
const TENANT_PHONE = process.env.TENANT_PHONE || '';

// Validar variaveis obrigatorias
if (!EVOLUTION_HOST || !EVOLUTION_PORT || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME || !BACKBONE_WEBHOOK_URL) {
  console.error('Variaveis de ambiente obrigatorias:');
  console.error('  EVOLUTION_HOST, EVOLUTION_PORT, EVOLUTION_API_KEY,');
  console.error('  EVOLUTION_INSTANCE_NAME, BACKBONE_WEBHOOK_URL');
  console.error('');
  console.error('Valores recebidos:');
  console.error(`  EVOLUTION_HOST: ${EVOLUTION_HOST || '(vazio)'}`);
  console.error(`  EVOLUTION_PORT: ${EVOLUTION_PORT || '(vazio)'}`);
  console.error(`  EVOLUTION_API_KEY: ${EVOLUTION_API_KEY ? '***' : '(vazio)'}`);
  console.error(`  EVOLUTION_INSTANCE_NAME: ${EVOLUTION_INSTANCE_NAME || '(vazio)'}`);
  console.error(`  BACKBONE_WEBHOOK_URL: ${BACKBONE_WEBHOOK_URL || '(vazio)'}`);
  process.exit(1);
}

// Eventos para enviar ao webhook
const WEBHOOK_EVENTS = [
  'MESSAGES_UPSERT',      // Mensagens novas/atualizadas
  'MESSAGES_UPDATE',      // Status de mensagens (delivered, read)
  'CONNECTION_UPDATE',    // Mudancas de conexao WhatsApp
  'QRCODE_UPDATED'        // QR code atualizado
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function evolutionFetch(endpoint, options = {}) {
  const url = `${EVOLUTION_URL}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
      ...options.headers,
    },
  });
}

async function waitForEvolution(maxAttempts = 60) {
  console.log(`Aguardando Evolution em ${EVOLUTION_URL}...`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${EVOLUTION_URL}/`);
      if (res.ok) {
        console.log('Evolution esta pronto!');
        return true;
      }
    } catch (e) {
      // Still not ready
    }
    await sleep(1000);
    process.stdout.write('.');
  }

  console.error('\nEvolution nao ficou pronto a tempo');
  return false;
}

async function getInstances() {
  try {
    const res = await evolutionFetch('/instance/fetchInstances');
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function instanceExists() {
  const instances = await getInstances();
  return instances.some(i => i.name === EVOLUTION_INSTANCE_NAME);
}

async function createInstance() {
  console.log(`\nCriando instancia "${EVOLUTION_INSTANCE_NAME}"...`);

  const body = {
    instanceName: EVOLUTION_INSTANCE_NAME,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS'
  };

  if (EVOLUTION_INSTANCE_TOKEN) {
    body.token = EVOLUTION_INSTANCE_TOKEN;
  }

  const res = await evolutionFetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(`Erro ao criar instancia: ${error}`);
    return false;
  }

  console.log('Instancia criada!');
  return true;
}

async function configureSettings() {
  console.log(`\nConfigurando settings da instancia "${EVOLUTION_INSTANCE_NAME}"...`);

  // Limite de 100 caracteres no banco do Evolution
  const msgCall = TENANT_PHONE
    ? `Atendemos so por texto. Ligue: ${TENANT_PHONE}`
    : 'Atendemos somente por mensagem de texto.';

  const res = await evolutionFetch(`/settings/set/${EVOLUTION_INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify({
      rejectCall: true,
      msgCall: msgCall,
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false
    })
  });

  if (res.ok) {
    console.log('Settings configuradas:');
    console.log('  - Always Online: ATIVADO');
    console.log('  - Ignore Groups: ATIVADO');
    console.log('  - Reject Call: ATIVADO');
    console.log(`  - Msg Call: "${msgCall}"`);
    return true;
  } else {
    const error = await res.text();
    console.error(`Erro ao configurar settings: ${error}`);
    return false;
  }
}

async function getWebhookConfig() {
  try {
    const res = await evolutionFetch(`/webhook/find/${EVOLUTION_INSTANCE_NAME}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function configureWebhook() {
  console.log(`\nConfigurando Webhook para instancia "${EVOLUTION_INSTANCE_NAME}"...`);
  console.log(`  URL: ${BACKBONE_WEBHOOK_URL}`);

  // Verificar configuracao atual
  const current = await getWebhookConfig();
  if (current && current.enabled === true && current.url === BACKBONE_WEBHOOK_URL) {
    console.log('Webhook ja esta configurado!');
    console.log(`  Eventos: ${JSON.stringify(current.events)}`);
    return true;
  }

  // Configurar Webhook
  const res = await evolutionFetch(`/webhook/set/${EVOLUTION_INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: BACKBONE_WEBHOOK_URL,
        webhookByEvents: false,
        webhookBase64: false,
        events: WEBHOOK_EVENTS
      }
    })
  });

  if (res.ok) {
    console.log('Webhook configurado!');
    console.log(`  Eventos: ${JSON.stringify(WEBHOOK_EVENTS)}`);
    return true;
  } else {
    const error = await res.text();
    console.error(`Erro ao configurar Webhook: ${error}`);
    return false;
  }
}

async function verifyConfiguration() {
  console.log('\nVerificando configuracao final...');

  const instances = await getInstances();
  const instance = instances.find(i => i.name === EVOLUTION_INSTANCE_NAME);

  if (!instance) {
    console.error('Instancia nao encontrada!');
    return false;
  }

  console.log(`\nInstancia: ${instance.name}`);
  console.log(`  Status: ${instance.connectionStatus || 'desconectado'}`);

  // Buscar config do webhook
  const webhookConfig = await getWebhookConfig();
  if (webhookConfig && webhookConfig.enabled) {
    console.log(`  Webhook: ATIVO`);
    console.log(`  Webhook URL: ${webhookConfig.url}`);
    console.log(`  Webhook events: ${JSON.stringify(webhookConfig.events)}`);
  } else {
    console.log(`  Webhook: NAO CONFIGURADO`);
    return false;
  }

  return true;
}

async function main() {
  console.log('='.repeat(50));
  console.log('  CIA DASHBOARD - Evolution API Initialization');
  console.log('='.repeat(50));
  console.log(`\nURL: ${EVOLUTION_URL}`);
  console.log(`Instancia: ${EVOLUTION_INSTANCE_NAME}`);
  console.log(`Webhook: ${BACKBONE_WEBHOOK_URL}`);

  // Wait for Evolution to be ready
  const ready = await waitForEvolution();
  if (!ready) {
    process.exit(1);
  }

  // Additional delay to ensure API is fully available
  await sleep(2000);

  // Check if instance exists
  const exists = await instanceExists();
  if (!exists) {
    const created = await createInstance();
    if (!created) {
      console.error('Falha ao criar instancia, abortando...');
      process.exit(1);
    }
    // Wait for instance to be ready
    await sleep(2000);
  } else {
    console.log(`\nInstancia "${EVOLUTION_INSTANCE_NAME}" ja existe.`);
  }

  // Configure Settings (sempre - garante que estao atualizadas)
  const settingsConfigured = await configureSettings();
  if (!settingsConfigured) {
    console.warn('Aviso: Settings nao foram configuradas');
  }

  // Configure Webhook
  const webhookConfigured = await configureWebhook();
  if (!webhookConfigured) {
    console.error('Falha ao configurar Webhook, abortando...');
    process.exit(1);
  }

  // Verify final configuration
  const verified = await verifyConfiguration();
  if (!verified) {
    console.error('Verificacao falhou!');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  console.log('  Evolution API initialized successfully!');
  console.log('='.repeat(50));
  console.log('');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
