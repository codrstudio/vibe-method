import { z } from 'zod';

// =============================================================================
// Intent Profile
// =============================================================================

export const IntentProfileSchema = z.object({
  minParams: z.enum(['7b', '13b', '70b']).optional(),
  maxParams: z.enum(['7b', '13b', '70b']).optional(),
  requiresJSON: z.boolean().optional(),
  requiresVision: z.boolean().optional(),
  requiresTools: z.boolean().optional(),
  priority: z.enum(['speed', 'quality', 'cost']).optional(),
});

export type IntentProfile = z.infer<typeof IntentProfileSchema>;

// =============================================================================
// LLM Intent
// =============================================================================

export const LLMIntentSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  icon: z.string(),
  profile: IntentProfileSchema,
  declaredBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LLMIntent = z.infer<typeof LLMIntentSchema>;

// =============================================================================
// LLM Binding
// =============================================================================

export const LLMBindingSchema = z.object({
  id: z.string().uuid(),
  intentId: z.string().uuid(),
  provider: z.string(),
  model: z.string(),
  temperature: z.number().nullable(),
  maxTokens: z.number().nullable(),
  isActive: z.boolean(),
  priority: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().uuid().nullable(),
});

export type LLMBinding = z.infer<typeof LLMBindingSchema>;

// =============================================================================
// Catalog Types
// =============================================================================

export interface CatalogModel {
  id: string;
  name: string;
  params: string;
  capabilities: string[];
  costTier?: string;
}

export interface CatalogProvider {
  name: string;
  type: 'cloud' | 'embedded';
  baseUrl: string;
  models: CatalogModel[];
}

export interface ModelsCatalog {
  version: string;
  updatedAt: string;
  providers: Record<string, CatalogProvider>;
}

// =============================================================================
// Resolved LLM
// =============================================================================

export interface ResolvedLLM {
  provider: string;
  model: string;
  baseUrl: string;
  config: {
    temperature?: number;
    maxTokens?: number;
  };
}

// =============================================================================
// Input Types
// =============================================================================

export interface CreateBindingInput {
  intentId: string;
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  createdBy?: string;
}

export interface UpdateBindingInput {
  provider?: string;
  model?: string;
  temperature?: number | null;
  maxTokens?: number | null;
  isActive?: boolean;
  priority?: number;
}

// =============================================================================
// View Models
// =============================================================================

export interface LLMIntentWithBinding extends LLMIntent {
  binding: LLMBinding | null;
}

export interface CatalogModelWithProvider extends CatalogModel {
  provider: string;
  providerName: string;
  providerType: 'cloud' | 'embedded';
}
