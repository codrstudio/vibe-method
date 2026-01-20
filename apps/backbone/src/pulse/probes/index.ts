import { dbShallowProbe, dbDeepProbe } from './db.probe.js';
import { redisShallowProbe, redisDeepProbe } from './redis.probe.js';
import { llmShallowProbe, llmDeepProbe } from './llm.probe.js';
import { ollamaShallowProbe, ollamaDeepProbe } from './ollama.probe.js';
import { knowledgeShallowProbe, knowledgeDeepProbe } from './knowledge.probe.js';
import { whatsappShallowProbe, whatsappDeepProbe } from './whatsapp.probe.js';
import { llmSanityShallowProbe, llmSanityDeepProbe } from './llm-sanity.probe.js';
import { schedulerShallowProbe, schedulerDeepProbe } from './scheduler.probe.js';
import type { HealthProbe, ProbeResult } from '../types.js';

const shallowProbes: HealthProbe[] = [
  dbShallowProbe,
  redisShallowProbe,
  llmShallowProbe,
  ollamaShallowProbe,
  whatsappShallowProbe,
  llmSanityShallowProbe,
  schedulerShallowProbe,
];

const deepProbes: HealthProbe[] = [
  dbDeepProbe,
  redisDeepProbe,
  llmDeepProbe,
  ollamaDeepProbe,
  knowledgeDeepProbe,
  whatsappDeepProbe,
  llmSanityDeepProbe,
  schedulerDeepProbe,
];

const allProbes: Record<string, { shallow: HealthProbe; deep: HealthProbe }> = {
  database: { shallow: dbShallowProbe, deep: dbDeepProbe },
  redis: { shallow: redisShallowProbe, deep: redisDeepProbe },
  llm: { shallow: llmShallowProbe, deep: llmDeepProbe },
  ollama: { shallow: ollamaShallowProbe, deep: ollamaDeepProbe },
  knowledge: { shallow: knowledgeShallowProbe, deep: knowledgeDeepProbe },
  whatsapp: { shallow: whatsappShallowProbe, deep: whatsappDeepProbe },
  'llm-sanity': { shallow: llmSanityShallowProbe, deep: llmSanityDeepProbe },
  scheduler: { shallow: schedulerShallowProbe, deep: schedulerDeepProbe },
};

export async function runProbes(options?: { deep?: boolean }): Promise<ProbeResult[]> {
  const probes = options?.deep ? deepProbes : shallowProbes;
  return Promise.all(probes.map((p) => p.check()));
}

export async function runDeepProbes(): Promise<ProbeResult[]> {
  return runProbes({ deep: true });
}

export async function runProbe(name: string, deep = false): Promise<ProbeResult | null> {
  const probe = allProbes[name];
  if (!probe) return null;
  return deep ? probe.deep.check() : probe.shallow.check();
}

export function getProbeNames(): string[] {
  return Object.keys(allProbes);
}

export {
  dbShallowProbe,
  dbDeepProbe,
  redisShallowProbe,
  redisDeepProbe,
  llmShallowProbe,
  llmDeepProbe,
  ollamaShallowProbe,
  ollamaDeepProbe,
  knowledgeShallowProbe,
  knowledgeDeepProbe,
  whatsappShallowProbe,
  whatsappDeepProbe,
  llmSanityShallowProbe,
  llmSanityDeepProbe,
};
