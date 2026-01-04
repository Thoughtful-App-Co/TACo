/**
 * Paper Trail - Entity Service
 * Extracts entities from articles for graph visualization
 * Supports simple keyword extraction or AI-powered entity recognition
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import {
  Article,
  Entity,
  EntityType,
  EntityGraph,
  Relation,
} from '../../../schemas/papertrail.schema';
import { ApiConfigService } from './api-config.service';
import { logger } from '../../../lib/logger';

const ENTITIES_KEY = 'papertrail-entities';

// =============================================================================
// SIMPLE EXTRACTION (NO AI)
// =============================================================================

// Common words to exclude from entity extraction
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'he',
  'she',
  'they',
  'we',
  'you',
  'i',
  'my',
  'your',
  'his',
  'her',
  'their',
  'our',
  'who',
  'what',
  'when',
  'where',
  'why',
  'how',
  'which',
  'there',
  'here',
  'all',
  'any',
  'both',
  'each',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'not',
  'only',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'also',
  'now',
  'new',
  'says',
  'said',
  'after',
  'before',
  'about',
  'over',
  'into',
  'through',
  'during',
  'against',
  'between',
  'under',
  'above',
  'up',
  'down',
  'out',
  'off',
  'then',
]);

/**
 * Extract potential entities using simple heuristics
 */
function extractSimpleEntities(text: string): { name: string; type: EntityType }[] {
  const entities: { name: string; type: EntityType }[] = [];
  const words = text.split(/\s+/);

  // Find capitalized word sequences (potential proper nouns)
  let currentPhrase: string[] = [];

  for (const word of words) {
    const cleaned = word.replace(/[^a-zA-Z'-]/g, '');

    if (
      cleaned.length > 1 &&
      cleaned[0] === cleaned[0].toUpperCase() &&
      cleaned[0] !== cleaned[0].toLowerCase()
    ) {
      // Capitalized word
      if (!STOP_WORDS.has(cleaned.toLowerCase())) {
        currentPhrase.push(cleaned);
      }
    } else {
      // Not capitalized - save current phrase if exists
      if (currentPhrase.length > 0) {
        const phrase = currentPhrase.join(' ');
        if (phrase.length > 2) {
          entities.push({
            name: phrase,
            type: guessEntityType(phrase),
          });
        }
        currentPhrase = [];
      }
    }
  }

  // Don't forget the last phrase
  if (currentPhrase.length > 0) {
    const phrase = currentPhrase.join(' ');
    if (phrase.length > 2) {
      entities.push({
        name: phrase,
        type: guessEntityType(phrase),
      });
    }
  }

  return entities;
}

/**
 * Guess entity type based on patterns
 */
function guessEntityType(name: string): EntityType {
  const lower = name.toLowerCase();

  // Organization indicators
  const orgIndicators = [
    'inc',
    'corp',
    'company',
    'group',
    'llc',
    'ltd',
    'association',
    'foundation',
  ];
  if (orgIndicators.some((ind) => lower.includes(ind))) {
    return 'organization';
  }

  // Location indicators (very basic)
  const locationIndicators = ['city', 'state', 'country', 'street', 'avenue', 'road'];
  if (locationIndicators.some((ind) => lower.includes(ind))) {
    return 'location';
  }

  // If it's likely a person name (2-3 capitalized words)
  const words = name.split(' ');
  if (words.length >= 2 && words.length <= 3 && words.every((w) => w[0] === w[0].toUpperCase())) {
    return 'person';
  }

  // Default to topic
  return 'topic';
}

/**
 * Generate entity ID from name
 */
function entityId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// =============================================================================
// AI-POWERED EXTRACTION
// =============================================================================

const EXTRACTION_PROMPT = `Extract named entities from the following news headlines and descriptions. 
For each entity, identify its type: person, organization, location, or topic.
Return JSON array: [{"name": "Entity Name", "type": "person|organization|location|topic"}]
Only return the JSON array, no other text.

Text to analyze:
`;

/**
 * Extract entities using AI
 */
async function extractWithAI(
  text: string,
  config: { baseUrl: string; apiKey: string; model: string }
): Promise<{ name: string; type: EntityType }[]> {
  try {
    // Determine if it's Anthropic or OpenAI-compatible
    const isAnthropic = config.baseUrl.includes('anthropic');

    if (isAnthropic) {
      const response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: EXTRACTION_PROMPT + text }],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '[]';
      return JSON.parse(content);
    } else {
      // OpenAI-compatible (OpenAI, Groq, Ollama)
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: EXTRACTION_PROMPT + text }],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      return JSON.parse(content);
    }
  } catch (error) {
    logger.news.error('AI extraction failed:', error);
    return [];
  }
}

// =============================================================================
// ENTITY SERVICE
// =============================================================================

export const EntityService = {
  /**
   * Get the current entity graph
   */
  getGraph(): EntityGraph | null {
    try {
      const stored = localStorage.getItem(ENTITIES_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.news.error('Failed to parse entity graph:', error);
      return null;
    }
  },

  /**
   * Save entity graph
   */
  saveGraph(graph: EntityGraph): void {
    try {
      localStorage.setItem(ENTITIES_KEY, JSON.stringify(graph));
    } catch (error) {
      logger.news.error('Failed to save entity graph:', error);
    }
  },

  /**
   * Build entity graph from articles
   */
  async buildGraph(articles: Article[]): Promise<EntityGraph> {
    const aiConfig = ApiConfigService.getAIConfig();
    const entitiesMap = new Map<string, Entity>();
    const relationsMap = new Map<string, Relation>();

    for (const article of articles) {
      const text = `${article.title}. ${article.description || ''}`;

      // Extract entities (AI or simple)
      let rawEntities: { name: string; type: EntityType }[];

      if (aiConfig) {
        rawEntities = await extractWithAI(text, aiConfig);
        // Fallback to simple if AI returns nothing
        if (rawEntities.length === 0) {
          rawEntities = extractSimpleEntities(text);
        }
      } else {
        rawEntities = extractSimpleEntities(text);
      }

      // Also add the source as an entity
      rawEntities.push({
        name: article.source.name,
        type: 'source',
      });

      // Process extracted entities
      const articleEntityIds: string[] = [];

      for (const raw of rawEntities) {
        const id = entityId(raw.name);

        if (entitiesMap.has(id)) {
          // Update existing entity
          const entity = entitiesMap.get(id)!;
          if (!entity.articleIds.includes(article.id)) {
            entity.articleIds.push(article.id);
            entity.mentionCount++;
          }
        } else {
          // Create new entity
          entitiesMap.set(id, {
            id,
            name: raw.name,
            type: raw.type,
            articleIds: [article.id],
            mentionCount: 1,
          });
        }

        articleEntityIds.push(id);
      }

      // Build relations (co-occurrence within same article)
      for (let i = 0; i < articleEntityIds.length; i++) {
        for (let j = i + 1; j < articleEntityIds.length; j++) {
          const sourceId = articleEntityIds[i];
          const targetId = articleEntityIds[j];
          const relationKey = [sourceId, targetId].sort().join('::');

          if (relationsMap.has(relationKey)) {
            relationsMap.get(relationKey)!.strength++;
          } else {
            relationsMap.set(relationKey, {
              sourceId,
              targetId,
              strength: 1,
            });
          }
        }
      }
    }

    // Convert to arrays and filter weak entities
    const entities = Array.from(entitiesMap.values())
      .filter((e) => e.mentionCount >= 1) // Could increase threshold
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 50); // Limit for performance

    const entityIds = new Set(entities.map((e) => e.id));
    const relations = Array.from(relationsMap.values())
      .filter((r) => entityIds.has(r.sourceId) && entityIds.has(r.targetId))
      .sort((a, b) => b.strength - a.strength);

    const graph: EntityGraph = {
      entities,
      relations,
      lastUpdated: new Date().toISOString(),
    };

    this.saveGraph(graph);
    logger.news.info(`Built graph: ${entities.length} entities, ${relations.length} relations`);

    return graph;
  },

  /**
   * Clear the entity graph
   */
  clearGraph(): void {
    try {
      localStorage.removeItem(ENTITIES_KEY);
    } catch (error) {
      logger.news.error('Failed to clear entity graph:', error);
    }
  },

  /**
   * Get entities related to a specific entity
   */
  getRelatedEntities(entityId: string): Entity[] {
    const graph = this.getGraph();
    if (!graph) return [];

    const relatedIds = new Set<string>();

    for (const relation of graph.relations) {
      if (relation.sourceId === entityId) {
        relatedIds.add(relation.targetId);
      } else if (relation.targetId === entityId) {
        relatedIds.add(relation.sourceId);
      }
    }

    return graph.entities.filter((e) => relatedIds.has(e.id));
  },

  /**
   * Get articles for an entity
   */
  getEntityArticles(entityId: string): string[] {
    const graph = this.getGraph();
    if (!graph) return [];

    const entity = graph.entities.find((e) => e.id === entityId);
    return entity?.articleIds || [];
  },
} as const;
