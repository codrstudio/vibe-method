import { db } from '../../lib/db.js';
import type {
  MessageTemplate,
  MessageLog,
  UpdateTemplateInput,
  MessageChannel,
  MessageStatus,
} from './types.js';

// =============================================================================
// Templates Repository
// =============================================================================

export const templatesRepository = {
  /**
   * Lista todos os templates
   */
  async findAll(): Promise<MessageTemplate[]> {
    return db.query<MessageTemplate>(`
      SELECT
        id, name, description, category,
        channels, variables, settings, source,
        created_at, updated_at, updated_by
      FROM message_templates
      ORDER BY category, name
    `);
  },

  /**
   * Lista templates por categoria
   */
  async findByCategory(category: string): Promise<MessageTemplate[]> {
    return db.query<MessageTemplate>(
      `
      SELECT
        id, name, description, category,
        channels, variables, settings, source,
        created_at, updated_at, updated_by
      FROM message_templates
      WHERE category = $1
      ORDER BY name
    `,
      [category]
    );
  },

  /**
   * Busca template por ID
   */
  async findById(id: string): Promise<MessageTemplate | null> {
    return db.queryOne<MessageTemplate>(
      `
      SELECT
        id, name, description, category,
        channels, variables, settings, source,
        created_at, updated_at, updated_by
      FROM message_templates
      WHERE id = $1
    `,
      [id]
    );
  },

  /**
   * Atualiza template (marca como 'custom')
   */
  async update(
    id: string,
    data: UpdateTemplateInput,
    updatedBy?: string
  ): Promise<MessageTemplate | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }

    if (data.description !== undefined) {
      sets.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }

    if (data.channels !== undefined) {
      sets.push(`channels = $${paramIndex++}`);
      params.push(JSON.stringify(data.channels));
    }

    if (data.settings !== undefined) {
      sets.push(`settings = $${paramIndex++}`);
      params.push(JSON.stringify(data.settings));
    }

    // Sempre marca como custom quando editado
    sets.push(`source = 'custom'`);
    sets.push(`updated_at = NOW()`);

    if (updatedBy) {
      sets.push(`updated_by = $${paramIndex++}`);
      params.push(updatedBy);
    }

    params.push(id);

    const result = await db.query<MessageTemplate>(
      `
      UPDATE message_templates
      SET ${sets.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id, name, description, category,
        channels, variables, settings, source,
        created_at, updated_at, updated_by
    `,
      params
    );

    return result[0] ?? null;
  },

  /**
   * Reset template para padrão (recarrega do seed)
   * Na prática, deleta o registro e deixa o seed recriar
   * Ou podemos ter uma tabela de defaults
   */
  async resetToDefault(id: string): Promise<boolean> {
    // Marca source como 'default' para que o próximo seed sobrescreva
    const rowCount = await db.execute(
      `
      UPDATE message_templates
      SET source = 'default', updated_at = NOW()
      WHERE id = $1
    `,
      [id]
    );

    return rowCount > 0;
  },
};

// =============================================================================
// Message Logs Repository
// =============================================================================

export const logsRepository = {
  /**
   * Registra envio de mensagem
   */
  async create(data: {
    templateId: string | null;
    channel: MessageChannel;
    recipient: string;
    variables: Record<string, unknown>;
    status: MessageStatus;
    errorMessage?: string;
    errorCode?: string;
    metadata?: Record<string, unknown>;
  }): Promise<MessageLog> {
    const [log] = await db.query<MessageLog>(
      `
      INSERT INTO message_logs (
        template_id, channel, recipient, variables,
        status, error_message, error_code, metadata,
        sent_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        data.templateId,
        data.channel,
        data.recipient,
        JSON.stringify(data.variables),
        data.status,
        data.errorMessage ?? null,
        data.errorCode ?? null,
        JSON.stringify(data.metadata ?? {}),
        data.status === 'sent' ? new Date() : null,
      ]
    );

    return log;
  },

  /**
   * Atualiza status do log
   */
  async updateStatus(
    id: string,
    status: MessageStatus,
    error?: { message: string; code?: string }
  ): Promise<void> {
    await db.execute(
      `
      UPDATE message_logs
      SET
        status = $2,
        error_message = $3,
        error_code = $4,
        sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END
      WHERE id = $1
    `,
      [id, status, error?.message ?? null, error?.code ?? null]
    );
  },

  /**
   * Lista logs por template
   */
  async findByTemplate(
    templateId: string,
    limit = 50
  ): Promise<MessageLog[]> {
    return db.query<MessageLog>(
      `
      SELECT * FROM message_logs
      WHERE template_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
      [templateId, limit]
    );
  },

  /**
   * Lista logs por recipient
   */
  async findByRecipient(
    recipient: string,
    limit = 50
  ): Promise<MessageLog[]> {
    return db.query<MessageLog>(
      `
      SELECT * FROM message_logs
      WHERE recipient = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
      [recipient, limit]
    );
  },
};
