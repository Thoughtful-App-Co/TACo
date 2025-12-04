/**
 * Paper Trail - useEntities Hook
 * Manages entity graph state for visualization
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, createEffect } from 'solid-js';
import { Article, Entity, Relation } from '../../../schemas/papertrail.schema';
import { EntityService } from '../services/entity.service';

export interface UseEntitiesReturn {
  entities: () => Entity[];
  relations: () => Relation[];
  isBuilding: () => boolean;
  lastUpdated: () => string | null;
  buildGraph: (articles: Article[]) => Promise<void>;
  getRelatedEntities: (entityId: string) => Entity[];
  getEntityArticles: (entityId: string) => string[];
}

export function useEntities(): UseEntitiesReturn {
  const [entities, setEntities] = createSignal<Entity[]>([]);
  const [relations, setRelations] = createSignal<Relation[]>([]);
  const [isBuilding, setIsBuilding] = createSignal(false);
  const [lastUpdated, setLastUpdated] = createSignal<string | null>(null);

  // Load cached graph on mount
  createEffect(() => {
    const cached = EntityService.getGraph();
    if (cached) {
      setEntities(cached.entities);
      setRelations(cached.relations);
      setLastUpdated(cached.lastUpdated);
    }
  });

  const buildGraph = async (articles: Article[]) => {
    if (articles.length === 0) return;

    setIsBuilding(true);
    try {
      const graph = await EntityService.buildGraph(articles);
      setEntities(graph.entities);
      setRelations(graph.relations);
      setLastUpdated(graph.lastUpdated);
    } catch (error) {
      console.error('[PaperTrail] Failed to build graph:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  const getRelatedEntities = (entityId: string): Entity[] => {
    return EntityService.getRelatedEntities(entityId);
  };

  const getEntityArticles = (entityId: string): string[] => {
    return EntityService.getEntityArticles(entityId);
  };

  return {
    entities,
    relations,
    isBuilding,
    lastUpdated,
    buildGraph,
    getRelatedEntities,
    getEntityArticles,
  };
}
