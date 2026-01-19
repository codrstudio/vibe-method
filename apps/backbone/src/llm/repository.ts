import { db } from '../lib/index.js';
import type {
  LLMIntent,
  LLMBinding,
  LLMIntentWithBinding,
  CreateBindingInput,
  UpdateBindingInput,
  IntentProfile,
} from './types.js';

// =============================================================================
// Intents Repository
// =============================================================================

export const intentsRepository = {
  async findAll(): Promise<LLMIntent[]> {
    return db.query<LLMIntent>(
      `SELECT
         id, slug, title, subtitle, description, icon,
         profile,
         declared_by as "declaredBy",
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM llm_intents
       ORDER BY title ASC`
    );
  },

  async findBySlug(slug: string): Promise<LLMIntent | null> {
    return db.queryOne<LLMIntent>(
      `SELECT
         id, slug, title, subtitle, description, icon,
         profile,
         declared_by as "declaredBy",
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM llm_intents
       WHERE slug = $1`,
      [slug]
    );
  },

  async findById(id: string): Promise<LLMIntent | null> {
    return db.queryOne<LLMIntent>(
      `SELECT
         id, slug, title, subtitle, description, icon,
         profile,
         declared_by as "declaredBy",
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM llm_intents
       WHERE id = $1`,
      [id]
    );
  },

  async findAllWithBindings(): Promise<LLMIntentWithBinding[]> {
    const rows = await db.query<
      LLMIntent & {
        bindingId: string | null;
        bindingProvider: string | null;
        bindingModel: string | null;
        bindingTemperature: number | null;
        bindingMaxTokens: number | null;
        bindingIsActive: boolean | null;
        bindingPriority: number | null;
        bindingCreatedAt: string | null;
        bindingUpdatedAt: string | null;
        bindingCreatedBy: string | null;
      }
    >(
      `SELECT
         i.id, i.slug, i.title, i.subtitle, i.description, i.icon,
         i.profile,
         i.declared_by as "declaredBy",
         i.created_at as "createdAt",
         i.updated_at as "updatedAt",
         b.id as "bindingId",
         b.provider as "bindingProvider",
         b.model as "bindingModel",
         b.temperature as "bindingTemperature",
         b.max_tokens as "bindingMaxTokens",
         b.is_active as "bindingIsActive",
         b.priority as "bindingPriority",
         b.created_at as "bindingCreatedAt",
         b.updated_at as "bindingUpdatedAt",
         b.created_by as "bindingCreatedBy"
       FROM llm_intents i
       LEFT JOIN llm_bindings b ON b.intent_id = i.id AND b.is_active = true
       ORDER BY i.title ASC`
    );

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      icon: row.icon,
      profile: row.profile,
      declaredBy: row.declaredBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      binding: row.bindingId
        ? {
            id: row.bindingId,
            intentId: row.id,
            provider: row.bindingProvider!,
            model: row.bindingModel!,
            temperature: row.bindingTemperature,
            maxTokens: row.bindingMaxTokens,
            isActive: row.bindingIsActive!,
            priority: row.bindingPriority!,
            createdAt: row.bindingCreatedAt!,
            updatedAt: row.bindingUpdatedAt!,
            createdBy: row.bindingCreatedBy,
          }
        : null,
    }));
  },
};

// =============================================================================
// Bindings Repository
// =============================================================================

export const bindingsRepository = {
  async findById(id: string): Promise<LLMBinding | null> {
    return db.queryOne<LLMBinding>(
      `SELECT
         id,
         intent_id as "intentId",
         provider, model,
         temperature,
         max_tokens as "maxTokens",
         is_active as "isActive",
         priority,
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"
       FROM llm_bindings
       WHERE id = $1`,
      [id]
    );
  },

  async findByIntent(intentId: string, activeOnly = true): Promise<LLMBinding[]> {
    const whereClause = activeOnly
      ? 'WHERE intent_id = $1 AND is_active = true'
      : 'WHERE intent_id = $1';

    return db.query<LLMBinding>(
      `SELECT
         id,
         intent_id as "intentId",
         provider, model,
         temperature,
         max_tokens as "maxTokens",
         is_active as "isActive",
         priority,
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"
       FROM llm_bindings
       ${whereClause}
       ORDER BY priority DESC`,
      [intentId]
    );
  },

  async findByIntentSlug(slug: string): Promise<LLMBinding | null> {
    return db.queryOne<LLMBinding>(
      `SELECT
         b.id,
         b.intent_id as "intentId",
         b.provider, b.model,
         b.temperature,
         b.max_tokens as "maxTokens",
         b.is_active as "isActive",
         b.priority,
         b.created_at as "createdAt",
         b.updated_at as "updatedAt",
         b.created_by as "createdBy"
       FROM llm_bindings b
       JOIN llm_intents i ON b.intent_id = i.id
       WHERE i.slug = $1 AND b.is_active = true
       ORDER BY b.priority DESC
       LIMIT 1`,
      [slug]
    );
  },

  async create(input: CreateBindingInput): Promise<LLMBinding> {
    // Deactivate existing bindings for this intent
    await db.execute(
      `UPDATE llm_bindings SET is_active = false WHERE intent_id = $1`,
      [input.intentId]
    );

    const [binding] = await db.query<LLMBinding>(
      `INSERT INTO llm_bindings (intent_id, provider, model, temperature, max_tokens, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         intent_id as "intentId",
         provider, model,
         temperature,
         max_tokens as "maxTokens",
         is_active as "isActive",
         priority,
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"`,
      [
        input.intentId,
        input.provider,
        input.model,
        input.temperature ?? null,
        input.maxTokens ?? null,
        input.createdBy ?? null,
      ]
    );

    return binding;
  },

  async update(id: string, updates: UpdateBindingInput): Promise<LLMBinding | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.provider !== undefined) {
      setClauses.push(`provider = $${paramIndex++}`);
      values.push(updates.provider);
    }

    if (updates.model !== undefined) {
      setClauses.push(`model = $${paramIndex++}`);
      values.push(updates.model);
    }

    if (updates.temperature !== undefined) {
      setClauses.push(`temperature = $${paramIndex++}`);
      values.push(updates.temperature);
    }

    if (updates.maxTokens !== undefined) {
      setClauses.push(`max_tokens = $${paramIndex++}`);
      values.push(updates.maxTokens);
    }

    if (updates.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    if (updates.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex++}`);
      values.push(updates.priority);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const [binding] = await db.query<LLMBinding>(
      `UPDATE llm_bindings
       SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING
         id,
         intent_id as "intentId",
         provider, model,
         temperature,
         max_tokens as "maxTokens",
         is_active as "isActive",
         priority,
         created_at as "createdAt",
         updated_at as "updatedAt",
         created_by as "createdBy"`,
      values
    );

    return binding ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const count = await db.execute(`DELETE FROM llm_bindings WHERE id = $1`, [id]);
    return count > 0;
  },

  async setActive(id: string, intentId: string): Promise<LLMBinding | null> {
    // Deactivate all bindings for intent
    await db.execute(
      `UPDATE llm_bindings SET is_active = false WHERE intent_id = $1`,
      [intentId]
    );

    // Activate the specified binding
    return this.update(id, { isActive: true });
  },
};
