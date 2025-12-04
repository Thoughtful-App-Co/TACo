import { z } from 'zod';

// =============================================================================
// PAPER TRAIL - NON-LINEAR LIVING NEWS
// =============================================================================
//
// Paper Trail reimagines how we consume current events. Instead of the
// traditional breaking-news cycle where stories are consumed and forgotten,
// Paper Trail treats every story as a living document that:
//
// 1. EVOLVES - Stories grow and change over time with full version history
// 2. CONNECTS - Entity graphs reveal relationships between stories, people, events
// 3. CORRECTS - Transparent tracking of corrections, updates, and retractions
// 4. BALANCES - Multiple perspectives without false equivalence
//
// This is not a news aggregator or service—it's a new way to understand
// the continuously evolving narrative of current events.
//
// =============================================================================

// =============================================================================
// NEWS PROVIDER CONFIGURATION
// =============================================================================

export const NewsProviderSchema = z.enum([
  'guardian',
  'gnews',
  'thenewsapi',
  'currentsapi',
  'mediastack',
]);

export type NewsProvider = z.infer<typeof NewsProviderSchema>;

// Provider metadata for UI
export const NEWS_PROVIDERS: Record<
  NewsProvider,
  {
    name: string;
    freeLimit: string;
    registerUrl: string;
    keyPlaceholder: string;
  }
> = {
  guardian: {
    name: 'The Guardian',
    freeLimit: '5,000/day',
    registerUrl: 'https://open-platform.theguardian.com/access/',
    keyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
  gnews: {
    name: 'GNews',
    freeLimit: '100/day',
    registerUrl: 'https://gnews.io/',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  thenewsapi: {
    name: 'TheNewsAPI',
    freeLimit: '100/day',
    registerUrl: 'https://www.thenewsapi.com/',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  currentsapi: {
    name: 'CurrentsAPI',
    freeLimit: '600/month',
    registerUrl: 'https://currentsapi.services/',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  mediastack: {
    name: 'MediaStack',
    freeLimit: '500/month',
    registerUrl: 'https://mediastack.com/',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
};

// =============================================================================
// API CONFIGURATION (stored in localStorage)
// =============================================================================

export const ApiConfigSchema = z.object({
  // Optional AI for entity extraction (OpenAI-compatible)
  // News is fetched server-side - no user API keys needed
  aiEnabled: z.boolean().default(false),
  aiBaseUrl: z.string().optional(), // e.g., "https://api.anthropic.com/v1"
  aiApiKey: z.string().optional(),
  aiModel: z.string().optional(), // e.g., "claude-3-haiku-20240307"

  // Metadata
  lastUpdated: z.string().optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

// AI provider presets
export const AI_PRESETS: Record<string, { name: string; baseUrl: string; models: string[] }> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  ollama: {
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3.1', 'mistral', 'phi3'],
  },
};

// =============================================================================
// ARTICLE (normalized from any provider)
// =============================================================================

export const ArticleSourceSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
});

export const ArticleSchema = z.object({
  id: z.string(), // Generated hash of URL
  title: z.string(),
  description: z.string().nullable(),
  url: z.string().url(),
  imageUrl: z.string().nullable(),
  publishedAt: z.string(), // ISO date
  source: ArticleSourceSchema,
  author: z.string().nullable(),
  provider: NewsProviderSchema, // Which API it came from
  fetchedAt: z.string(), // When we fetched it
});

export type Article = z.infer<typeof ArticleSchema>;
export type ArticleSource = z.infer<typeof ArticleSourceSchema>;

// =============================================================================
// STORY EVOLUTION (the living document history)
// =============================================================================
//
// Every story is a living document. This tracks how stories evolve over time,
// making the news cycle transparent and non-linear.

export const ChangeTypeSchema = z.enum([
  'update',
  'correction',
  'retraction',
  'clarification',
  'development',
]);

export type ChangeType = z.infer<typeof ChangeTypeSchema>;

export const ChangelogEntrySchema = z.object({
  id: z.string(),
  articleId: z.string(),
  articleUrl: z.string(),
  articleTitle: z.string(), // Current title for reference
  field: z.enum(['title', 'description', 'content', 'headline']),
  previousValue: z.string(),
  newValue: z.string(),
  detectedAt: z.string(), // ISO date
  changeType: ChangeTypeSchema,
  significance: z.enum(['minor', 'moderate', 'major']).optional(), // How significant is this change?
});

export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

// Change type display metadata - reflects the living nature of stories
export const CHANGE_TYPES: Record<
  ChangeType,
  { label: string; color: string; icon: string; description: string }
> = {
  update: {
    label: 'Updated',
    color: '#6B7280',
    icon: 'pencil',
    description: 'New information added',
  },
  correction: {
    label: 'Corrected',
    color: '#D4A800',
    icon: 'warning',
    description: 'Factual error fixed',
  },
  retraction: {
    label: 'Retracted',
    color: '#DC2626',
    icon: 'x-circle',
    description: 'Story withdrawn',
  },
  clarification: {
    label: 'Clarified',
    color: '#2563EB',
    icon: 'info',
    description: 'Context added',
  },
  development: {
    label: 'Developed',
    color: '#059669',
    icon: 'arrow-up',
    description: 'Story evolved with new events',
  },
};

// =============================================================================
// ENTITIES (for graph visualization)
// =============================================================================

export const EntityTypeSchema = z.enum(['topic', 'person', 'organization', 'location', 'source']);

export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: EntityTypeSchema,
  articleIds: z.array(z.string()),
  mentionCount: z.number(),
});

export type Entity = z.infer<typeof EntitySchema>;

export const RelationSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  strength: z.number(), // Co-occurrence count
});

export type Relation = z.infer<typeof RelationSchema>;

// Entity graph (combined)
export const EntityGraphSchema = z.object({
  entities: z.array(EntitySchema),
  relations: z.array(RelationSchema),
  lastUpdated: z.string(),
});

export type EntityGraph = z.infer<typeof EntityGraphSchema>;

// =============================================================================
// USER PREFERENCES
// =============================================================================

export const PreferencesSchema = z.object({
  categories: z.array(z.string()), // Filter topics
  sources: z.array(z.string()), // Filter sources
  country: z.string().default('us'), // Default country for news
});

export type Preferences = z.infer<typeof PreferencesSchema>;

// =============================================================================
// APP STATE
// =============================================================================

export const AppStateSchema = z.object({
  articles: z.array(ArticleSchema),
  changelog: z.array(ChangelogEntrySchema),
  entityGraph: EntityGraphSchema.nullable(),
  preferences: PreferencesSchema,
  lastFetchedAt: z.string().nullable(),
});

export type AppState = z.infer<typeof AppStateSchema>;
