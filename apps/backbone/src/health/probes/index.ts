import { dbShallowProbe, dbDeepProbe } from './db.probe.js';
import { redisShallowProbe, redisDeepProbe } from './redis.probe.js';
import { llmShallowProbe, llmDeepProbe } from './llm.probe.js';
import { knowledgeShallowProbe, knowledgeDeepProbe } from './knowledge.probe.js';
import type { HealthProbe, ProbeResult } from '../types.js';

const shallowProbes: HealthProbe[] = [
  dbShallowProbe,
  redisShallowProbe,
  llmShallowProbe,
];

const deepProbes: HealthProbe[] = [
  dbDeepProbe,
  redisDeepProbe,
  llmDeepProbe,
  knowledgeDeepProbe,
];

export async function runProbes(options?: { deep?: boolean }): Promise<ProbeResult[]> {
  const probes = options?.deep ? deepProbes : shallowProbes;
  return Promise.all(probes.map((p) => p.check()));
}

export async function runDeepProbes(): Promise<ProbeResult[]> {
  return runProbes({ deep: true });
}

export {
  dbShallowProbe,
  dbDeepProbe,
  redisShallowProbe,
  redisDeepProbe,
  llmShallowProbe,
  llmDeepProbe,
  knowledgeShallowProbe,
  knowledgeDeepProbe,
};
