/**
 * Paper Trail - Interactive Entity Graph
 *
 * A zoomable, pannable graph visualization for exploring entity relationships.
 * Supports drill-down into entity details and connected articles.
 *
 * Features:
 * - Mouse wheel zoom with smooth transitions
 * - Click and drag to pan
 * - Click entity to see details and connections
 * - Double-click to zoom into entity cluster
 * - Hover to highlight connections
 * - Filter by entity type
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, createSignal, createMemo } from 'solid-js';
import { Entity, Relation, EntityType } from '../../../schemas/papertrail.schema';
import {
  papertrail,
  yellowScale,
  inkScale,
  graphTokens,
  motionTokens,
} from '../../../theme/papertrail';
import { EntityBadge } from '../ui/badge';
import { Button } from '../ui/button';

interface SimpleGraphProps {
  entities: Entity[];
  relations: Relation[];
  isBuilding: boolean;
  onBuildGraph: () => void;
  onEntityClick?: (entityId: string) => void;
}

interface PositionedEntity extends Entity {
  x: number;
  y: number;
  radius: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

// Force-directed layout parameters - EXTREME SPACING
const LAYOUT = {
  width: 3000,
  height: 2400,
  nodeSpacing: 400,
  centerForce: 0,
  repulsionForce: 25000,
  attractionForce: 0,
  iterations: 400,
};

export const SimpleGraph: Component<SimpleGraphProps> = (props) => {
  // View state
  const [transform, setTransform] = createSignal<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });

  // Selection state
  const [selectedEntity, setSelectedEntity] = createSignal<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = createSignal<string | null>(null);

  // Filter state
  const [activeFilters, setActiveFilters] = createSignal<Set<EntityType>>(
    new Set(['person', 'organization', 'topic', 'location', 'source'])
  );

  // Detail panel state
  const [showDetailPanel, setShowDetailPanel] = createSignal(false);

  let svgRef: SVGSVGElement | undefined;

  // Filter entities by active filters
  const filteredEntities = createMemo(() => {
    return props.entities.filter((e) => activeFilters().has(e.type));
  });

  // Force-directed layout calculation
  const positionedEntities = createMemo(() => {
    const entities = filteredEntities();
    if (entities.length === 0) return [];

    const { width, height } = LAYOUT;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize positions randomly across entire canvas
    const positions: PositionedEntity[] = entities.map((entity, i) => {
      const nodeRadius = 32; // 2x bigger nodes (was 16)

      // Spread nodes across entire canvas randomly
      const x = 200 + Math.random() * (width - 400);
      const y = 200 + Math.random() * (height - 400);

      return {
        ...entity,
        x,
        y,
        radius: nodeRadius,
      };
    });

    // Simple force-directed simulation
    for (let iter = 0; iter < LAYOUT.iterations; iter++) {
      // Repulsion between nodes - EXTREME REPULSION
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = LAYOUT.nodeSpacing;

          // ALWAYS apply massive repulsion
          const repulsionMultiplier = dist < minDist ? 0.8 : 0.15;
          const force = (LAYOUT.repulsionForce / (dist * dist)) * repulsionMultiplier;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          positions[i].x -= fx;
          positions[i].y -= fy;
          positions[j].x += fx;
          positions[j].y += fy;
        }
      }

      // Very gentle bounds constraint (only apply after repulsion settles)
      if (iter > LAYOUT.iterations * 0.7) {
        for (const pos of positions) {
          // Only pull back if way outside bounds
          const margin = 100;
          if (pos.x < margin) pos.x += (margin - pos.x) * 0.1;
          if (pos.x > width - margin) pos.x -= (pos.x - (width - margin)) * 0.1;
          if (pos.y < margin) pos.y += (margin - pos.y) * 0.1;
          if (pos.y > height - margin) pos.y -= (pos.y - (height - margin)) * 0.1;
        }
      }

      // NO EDGE ATTRACTION - edges can be any length
      // (Removed to maximize spacing)
    }

    return positions;
  });

  // Get connections for selected entity
  const selectedConnections = createMemo(() => {
    const selected = selectedEntity();
    if (!selected) return { entities: [], relations: [] };

    const connectedRelations = props.relations.filter(
      (r) => r.sourceId === selected || r.targetId === selected
    );

    const connectedIds = new Set<string>();
    connectedRelations.forEach((r) => {
      connectedIds.add(r.sourceId);
      connectedIds.add(r.targetId);
    });
    connectedIds.delete(selected);

    const connectedEntities = positionedEntities().filter((e) => connectedIds.has(e.id));

    return { entities: connectedEntities, relations: connectedRelations };
  });

  // Visible relations based on filtered entities
  const visibleRelations = createMemo(() => {
    const entityIds = new Set(positionedEntities().map((e) => e.id));
    return props.relations.filter((r) => entityIds.has(r.sourceId) && entityIds.has(r.targetId));
  });

  // Get entity by ID
  const getEntityById = (id: string) => positionedEntities().find((e) => e.id === id);

  // Zoom controls
  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    setTransform((prev) => {
      const newScale = Math.max(0.25, Math.min(4, prev.scale + delta));
      const scaleDiff = newScale - prev.scale;

      // Zoom toward center point
      const cx = centerX ?? LAYOUT.width / 2;
      const cy = centerY ?? LAYOUT.height / 2;

      return {
        scale: newScale,
        x: prev.x - cx * scaleDiff,
        y: prev.y - cy * scaleDiff,
      };
    });
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = svgRef?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - transform().x) / transform().scale;
    const mouseY = (e.clientY - rect.top - transform().y) / transform().scale;

    handleZoom(e.deltaY > 0 ? -0.1 : 0.1, mouseX, mouseY);
  };

  // Pan controls
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform().x, y: e.clientY - transform().y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart().x,
      y: e.clientY - dragStart().y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset view
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  // Zoom to fit all entities
  const zoomToFit = () => {
    const entities = positionedEntities();
    if (entities.length === 0) return;

    const bounds = {
      minX: Math.min(...entities.map((e) => e.x - e.radius)),
      maxX: Math.max(...entities.map((e) => e.x + e.radius)),
      minY: Math.min(...entities.map((e) => e.y - e.radius)),
      maxY: Math.max(...entities.map((e) => e.y + e.radius)),
    };

    const contentWidth = bounds.maxX - bounds.minX + 100;
    const contentHeight = bounds.maxY - bounds.minY + 100;

    const scaleX = LAYOUT.width / contentWidth;
    const scaleY = LAYOUT.height / contentHeight;
    const scale = Math.min(scaleX, scaleY, 2);

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    setTransform({
      scale,
      x: LAYOUT.width / 2 - centerX * scale,
      y: LAYOUT.height / 2 - centerY * scale,
    });
  };

  // Toggle entity type filter
  const toggleFilter = (type: EntityType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Handle entity selection
  const handleEntityClick = (e: MouseEvent, entityId: string) => {
    e.stopPropagation();
    if (selectedEntity() === entityId) {
      setSelectedEntity(null);
      setShowDetailPanel(false);
    } else {
      setSelectedEntity(entityId);
      setShowDetailPanel(true);
    }
    props.onEntityClick?.(entityId);
  };

  // Double-click to zoom to entity
  const handleEntityDoubleClick = (e: MouseEvent, entity: PositionedEntity) => {
    e.stopPropagation();
    setTransform({
      scale: 2,
      x: LAYOUT.width / 2 - entity.x * 2,
      y: LAYOUT.height / 2 - entity.y * 2,
    });
  };

  // Get node color based on state
  const getNodeColor = (
    type: EntityType,
    isSelected: boolean,
    isHovered: boolean,
    isConnected: boolean
  ) => {
    if (isSelected) return '#EF4444'; // Red for selected
    if (isHovered) return yellowScale[400];
    if (isConnected && selectedEntity()) return yellowScale[300];
    return graphTokens.node[type]?.fill || yellowScale[500];
  };

  // Check if entity is connected to selected
  const isConnectedToSelected = (entityId: string) => {
    return selectedConnections().entities.some((e) => e.id === entityId);
  };

  // Get edge opacity based on selection state
  const getEdgeStyle = (relation: Relation) => {
    const selected = selectedEntity();
    if (!selected) {
      return { stroke: inkScale.mid, opacity: 0.4, width: Math.min(relation.strength, 3) };
    }

    const isConnected = relation.sourceId === selected || relation.targetId === selected;
    if (isConnected) {
      return { stroke: '#EF4444', opacity: 1, width: Math.min(relation.strength + 1, 4) }; // Red for selected edges
    }

    return { stroke: inkScale.mid, opacity: 0.1, width: 1 };
  };

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'flex-wrap': 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 4px',
              'font-family': papertrail.fonts.heading,
              'font-size': '20px',
              'font-weight': 700,
              color: papertrail.colors.text,
            }}
          >
            Story Connections
          </h2>
          <p
            style={{
              margin: 0,
              'font-size': '13px',
              color: papertrail.colors.textMuted,
            }}
          >
            {positionedEntities().length} entities · {visibleRelations().length} connections
            {selectedEntity() && ` · ${selectedConnections().entities.length} linked`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={resetView}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={zoomToFit}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleZoom(0.25)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.25)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5v-2h14v2z" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={props.onBuildGraph}
            disabled={props.isBuilding}
          >
            {props.isBuilding ? 'Building...' : 'Rebuild'}
          </Button>
        </div>
      </div>

      {/* Entity Type Filters */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          'flex-wrap': 'wrap',
        }}
      >
        <For each={['person', 'organization', 'topic', 'location', 'source'] as EntityType[]}>
          {(type) => {
            const isActive = () => activeFilters().has(type);
            const count = () => props.entities.filter((e) => e.type === type).length;

            return (
              <button
                onClick={() => toggleFilter(type)}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: isActive() ? graphTokens.node[type]?.fill : 'transparent',
                  border: `2px solid ${isActive() ? graphTokens.node[type]?.stroke : papertrail.colors.border}`,
                  'border-radius': '16px',
                  cursor: 'pointer',
                  opacity: isActive() ? 1 : 0.5,
                  transition: `all ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    'border-radius': '50%',
                    background: graphTokens.node[type]?.fill,
                    border: isActive() ? '2px solid #000000' : 'none',
                  }}
                />
                <span
                  style={{
                    'font-size': '12px',
                    'font-weight': 500,
                    color: '#000000',
                    'text-transform': 'capitalize',
                  }}
                >
                  {type} ({count()})
                </span>
              </button>
            );
          }}
        </For>
      </div>

      {/* Empty State */}
      <Show when={props.entities.length === 0}>
        <div
          style={{
            padding: '48px 24px',
            'text-align': 'center',
            background: papertrail.colors.background,
            border: `1px solid ${papertrail.colors.border}`,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: yellowScale[50],
              'border-radius': '50%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill={yellowScale[500]}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h3
            style={{
              margin: '0 0 8px',
              'font-family': papertrail.fonts.heading,
              'font-size': '18px',
              color: papertrail.colors.text,
            }}
          >
            No Entities Yet
          </h3>
          <p
            style={{
              margin: '0 0 20px',
              'font-size': '14px',
              color: papertrail.colors.textMuted,
            }}
          >
            Fetch some news first, then click "Rebuild" to extract entities
          </p>
          <Button variant="accent" onClick={props.onBuildGraph} disabled={props.isBuilding}>
            Build Graph
          </Button>
        </div>
      </Show>

      {/* Graph Container */}
      <Show when={props.entities.length > 0}>
        <div style={{ display: 'flex', gap: '16px', 'flex-wrap': 'wrap' }}>
          {/* SVG Graph */}
          <div
            style={{
              flex: '1 1 500px',
              background: papertrail.colors.background,
              border: `1px solid ${papertrail.colors.border}`,
              overflow: 'hidden',
              cursor: isDragging() ? 'grabbing' : 'grab',
              position: 'relative',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Zoom indicator */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                'font-size': '11px',
                'border-radius': '4px',
                'z-index': 10,
                'pointer-events': 'none',
              }}
            >
              {Math.round(transform().scale * 100)}%
            </div>

            <svg
              ref={svgRef}
              width="100%"
              height="800"
              viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`}
              style={{ display: 'block' }}
              onWheel={handleWheel}
            >
              <g
                transform={`translate(${transform().x}, ${transform().y}) scale(${transform().scale})`}
              >
                {/* Relations (edges) */}
                <For each={visibleRelations()}>
                  {(relation) => {
                    const source = getEntityById(relation.sourceId);
                    const target = getEntityById(relation.targetId);
                    if (!source || !target) return null;

                    const style = getEdgeStyle(relation);
                    const scale = transform().scale;
                    const scaledWidth = () => style.width / scale;

                    return (
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={style.stroke}
                        stroke-width={scaledWidth()}
                        opacity={style.opacity}
                        style={{
                          transition: `all ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
                        }}
                      />
                    );
                  }}
                </For>

                {/* Entities (nodes) */}
                <For each={positionedEntities()}>
                  {(entity) => {
                    const isSelected = () => selectedEntity() === entity.id;
                    const isHovered = () => hoveredEntity() === entity.id;
                    const isConnected = () => isConnectedToSelected(entity.id);

                    // Semantic zoom: keep visual sizes consistent across zoom levels
                    const scale = transform().scale;
                    const scaledRadius = () => entity.radius / Math.sqrt(scale);
                    const scaledStrokeWidth = () => (isSelected() ? 5 : 4) / scale;
                    const scaledRingOffset = () => 10 / Math.sqrt(scale);
                    const scaledFontSize = () => (isSelected() ? 16 : 14) / scale;
                    const scaledTextOffset = () => entity.radius / Math.sqrt(scale) + 32 / scale;

                    return (
                      <g
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredEntity(entity.id)}
                        onMouseLeave={() => setHoveredEntity(null)}
                        onClick={(e) => handleEntityClick(e, entity.id)}
                        onDblClick={(e) => handleEntityDoubleClick(e, entity)}
                      >
                        {/* Selection ring */}
                        <Show when={isSelected() || isConnected()}>
                          <circle
                            cx={entity.x}
                            cy={entity.y}
                            r={scaledRadius() + scaledRingOffset()}
                            fill="none"
                            stroke={isSelected() ? '#EF4444' : yellowScale[300]}
                            stroke-width={scaledStrokeWidth()}
                            stroke-dasharray={
                              isConnected() && !isSelected() ? `${4 / scale},${4 / scale}` : 'none'
                            }
                            opacity={0.8}
                          />
                        </Show>

                        {/* Node circle */}
                        <circle
                          cx={entity.x}
                          cy={entity.y}
                          r={scaledRadius()}
                          fill={getNodeColor(entity.type, isSelected(), isHovered(), isConnected())}
                          stroke={
                            isSelected()
                              ? '#DC2626'
                              : graphTokens.node[entity.type]?.stroke || yellowScale[700]
                          }
                          stroke-width={scaledStrokeWidth()}
                          style={{
                            transition: `all ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
                          }}
                        />

                        {/* Label */}
                        <text
                          x={entity.x}
                          y={entity.y + scaledTextOffset()}
                          text-anchor="middle"
                          fill={isSelected() ? papertrail.colors.text : papertrail.colors.textMuted}
                          font-size={`${scaledFontSize()}`}
                          font-family={papertrail.fonts.heading}
                          font-weight={isSelected() ? 600 : 400}
                          style={{ 'pointer-events': 'none' }}
                        >
                          {entity.name.length > 20
                            ? entity.name.substring(0, 20) + '...'
                            : entity.name}
                          <title>{entity.name}</title>
                        </text>
                      </g>
                    );
                  }}
                </For>
              </g>
            </svg>

            {/* Instructions overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                padding: '6px 10px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                'font-size': '11px',
                'border-radius': '4px',
                'pointer-events': 'none',
              }}
            >
              Scroll to zoom · Drag to pan · Click node for details
            </div>
          </div>

          {/* Detail Panel */}
          <Show when={showDetailPanel() && selectedEntity()}>
            {(() => {
              const entity = positionedEntities().find((e) => e.id === selectedEntity());
              if (!entity) return null;

              const connections = selectedConnections();

              return (
                <div
                  style={{
                    flex: '0 0 280px',
                    background: papertrail.colors.surface,
                    border: `1px solid ${papertrail.colors.border}`,
                    'max-height': '700px',
                    'overflow-y': 'auto',
                  }}
                >
                  {/* Entity Header */}
                  <div
                    style={{
                      padding: '16px',
                      'border-bottom': `1px solid ${papertrail.colors.border}`,
                      background: yellowScale[50],
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        'align-items': 'flex-start',
                        'justify-content': 'space-between',
                        gap: '8px',
                        'margin-bottom': '8px',
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          'font-family': papertrail.fonts.heading,
                          'font-size': '16px',
                          'font-weight': 700,
                          color: papertrail.colors.text,
                          'line-height': 1.3,
                        }}
                      >
                        {entity.name}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedEntity(null);
                          setShowDetailPanel(false);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: papertrail.colors.textMuted,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                      <EntityBadge type={entity.type} />
                      <span style={{ 'font-size': '12px', color: papertrail.colors.textMuted }}>
                        {entity.mentionCount} mention{entity.mentionCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Connections */}
                  <div style={{ padding: '16px' }}>
                    <h4
                      style={{
                        margin: '0 0 12px',
                        'font-family': papertrail.fonts.heading,
                        'font-size': '13px',
                        'font-weight': 600,
                        color: papertrail.colors.textMuted,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.05em',
                      }}
                    >
                      Connected Entities ({connections.entities.length})
                    </h4>

                    <Show
                      when={connections.entities.length > 0}
                      fallback={
                        <p
                          style={{
                            'font-size': '13px',
                            color: papertrail.colors.textMuted,
                            margin: 0,
                          }}
                        >
                          No direct connections
                        </p>
                      }
                    >
                      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                        <For each={connections.entities.slice(0, 10)}>
                          {(connected) => {
                            const relation = connections.relations.find(
                              (r) =>
                                (r.sourceId === entity.id && r.targetId === connected.id) ||
                                (r.targetId === entity.id && r.sourceId === connected.id)
                            );

                            return (
                              <button
                                onClick={(e) => handleEntityClick(e, connected.id)}
                                style={{
                                  display: 'flex',
                                  'align-items': 'center',
                                  'justify-content': 'space-between',
                                  gap: '8px',
                                  padding: '8px 12px',
                                  background: papertrail.colors.background,
                                  border: `1px solid ${papertrail.colors.border}`,
                                  'border-radius': '4px',
                                  cursor: 'pointer',
                                  'text-align': 'left',
                                  width: '100%',
                                  transition: `all ${motionTokens.duration.fast}`,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '8px',
                                    flex: 1,
                                    'min-width': 0,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      'border-radius': '50%',
                                      background: graphTokens.node[connected.type]?.fill,
                                      'flex-shrink': 0,
                                    }}
                                  />
                                  <span
                                    style={{
                                      'font-size': '13px',
                                      color: papertrail.colors.text,
                                      overflow: 'hidden',
                                      'text-overflow': 'ellipsis',
                                      'white-space': 'nowrap',
                                    }}
                                  >
                                    {connected.name}
                                  </span>
                                </div>
                                <Show when={relation}>
                                  <span
                                    style={{
                                      'font-size': '11px',
                                      color: papertrail.colors.textMuted,
                                      'flex-shrink': 0,
                                    }}
                                  >
                                    ×{relation!.strength}
                                  </span>
                                </Show>
                              </button>
                            );
                          }}
                        </For>

                        <Show when={connections.entities.length > 10}>
                          <p
                            style={{
                              'font-size': '12px',
                              color: papertrail.colors.textMuted,
                              margin: '4px 0 0',
                            }}
                          >
                            +{connections.entities.length - 10} more connections
                          </p>
                        </Show>
                      </div>
                    </Show>
                  </div>

                  {/* Articles Section */}
                  <div style={{ padding: '0 16px 16px' }}>
                    <h4
                      style={{
                        margin: '0 0 12px',
                        'font-family': papertrail.fonts.heading,
                        'font-size': '13px',
                        'font-weight': 600,
                        color: papertrail.colors.textMuted,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.05em',
                      }}
                    >
                      Appears In ({entity.articleIds.length} stories)
                    </h4>
                    <p
                      style={{ 'font-size': '13px', color: papertrail.colors.textMuted, margin: 0 }}
                    >
                      Click to view related articles (coming soon)
                    </p>
                  </div>
                </div>
              );
            })()}
          </Show>
        </div>
      </Show>
    </div>
  );
};
