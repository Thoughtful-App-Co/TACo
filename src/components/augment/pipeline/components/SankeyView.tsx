/**
 * SankeyView - Visual flow diagram showing application pipeline progression
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * Uses d3-sankey for proper Sankey layout calculations where node heights
 * are proportional to their values (application counts).
 */

import { Component, createMemo, createSignal, For, Show } from 'solid-js';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { pipelineStore } from '../store';
import { liquidAugment, statusColors, pipelineAnimations } from '../theme/liquid-augment';
import { FluidCard } from '../ui';
import {
  JobApplication,
  ApplicationStatus,
  ACTIVE_STATUSES,
  STATUS_LABELS,
} from '../../../../schemas/pipeline.schema';

interface SankeyViewProps {
  currentTheme: () => Partial<typeof liquidAugment> & typeof liquidAugment;
  onSelectJob: (job: JobApplication) => void;
}

// Node data for d3-sankey
interface SankeyNodeData {
  id: ApplicationStatus;
  name: string;
  count: number;
  color: string;
}

// Link data for d3-sankey
interface SankeyLinkData {
  source: ApplicationStatus;
  target: ApplicationStatus;
  value: number;
}

// Flow stages reference (used for understanding pipeline structure)
// ['saved'] -> ['applied'] -> ['screening'] -> ['interviewing'] -> ['offered'] -> ['accepted', 'rejected', 'withdrawn']

// Design tokens
const SANKEY_DESIGN = {
  fonts: {
    heading: liquidAugment.fonts.heading,
    body: liquidAugment.fonts.body,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
  },
  timing: {
    fast: pipelineAnimations.fast,
    normal: pipelineAnimations.normal,
  },
  svg: {
    width: 900,
    height: 400,
    nodeWidth: 24,
    nodePadding: 16,
    margin: { top: 40, right: 20, bottom: 20, left: 20 },
  },
};

export const SankeyView: Component<SankeyViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const applications = () => pipelineStore.state.applications;

  // Interactive state
  const [hoveredNode, setHoveredNode] = createSignal<ApplicationStatus | null>(null);
  const [hoveredLink, setHoveredLink] = createSignal<string | null>(null);

  // Count applications by status
  const statusCounts = createMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      saved: 0,
      applied: 0,
      screening: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const app of applications()) {
      counts[app.status]++;
    }

    return counts;
  });

  // Build the Sankey graph data
  const sankeyData = createMemo(() => {
    const counts = statusCounts();
    const apps = applications();

    // Create nodes for each status that has applications or is a key stage
    const nodes: SankeyNodeData[] = [];
    const nodeIdMap = new Map<ApplicationStatus, number>();

    // Always include these core stages
    const coreStatuses: ApplicationStatus[] = [
      'saved',
      'applied',
      'screening',
      'interviewing',
      'offered',
      'accepted',
      'rejected',
    ];

    coreStatuses.forEach((status) => {
      // Include if has count OR is in the linear path and adjacent nodes have counts
      const hasCount = counts[status] > 0;
      const isInPath =
        status === 'saved' ||
        status === 'applied' ||
        status === 'screening' ||
        status === 'interviewing' ||
        status === 'offered';

      if (hasCount || isInPath) {
        nodeIdMap.set(status, nodes.length);
        nodes.push({
          id: status,
          name: STATUS_LABELS[status],
          count: counts[status],
          color: statusColors[status]?.text || '#FFFFFF',
        });
      }
    });

    // Build links based on status history or implied flow
    const linkMap = new Map<string, number>();

    // Analyze actual status history
    for (const app of apps) {
      if (app.statusHistory && app.statusHistory.length > 1) {
        for (let i = 0; i < app.statusHistory.length - 1; i++) {
          const from = app.statusHistory[i].status;
          const to = app.statusHistory[i + 1].status;
          // Only create link if both nodes exist
          if (nodeIdMap.has(from) && nodeIdMap.has(to)) {
            const key = `${from}->${to}`;
            linkMap.set(key, (linkMap.get(key) || 0) + 1);
          }
        }
      }
    }

    // If no history, create implied flows based on current counts
    // The idea: applications "flow" forward through the pipeline
    if (linkMap.size === 0) {
      // Calculate cumulative flow - each stage's count represents what flowed there
      // For Sankey, we need to show the flow between adjacent stages

      // Flow from saved -> applied (everyone who applied came from saved)
      if (counts.applied > 0) {
        linkMap.set('saved->applied', counts.applied);
      }

      // Flow from applied -> screening
      if (counts.screening > 0) {
        linkMap.set('applied->screening', counts.screening);
      }

      // Flow from screening -> interviewing
      if (counts.interviewing > 0) {
        linkMap.set('screening->interviewing', counts.interviewing);
      }

      // Flow from interviewing -> offered
      if (counts.offered > 0) {
        linkMap.set('interviewing->offered', counts.offered);
      }

      // Flow from offered -> accepted
      if (counts.accepted > 0) {
        linkMap.set('offered->accepted', counts.accepted);
      }

      // Flow from interviewing -> rejected
      if (counts.rejected > 0) {
        linkMap.set('interviewing->rejected', counts.rejected);
      }

      // If we still have no links but have applications, create minimal links
      // to show the nodes in proper positions
      if (linkMap.size === 0 && apps.length > 0) {
        // Find the furthest stage with applications and create a chain
        const stageOrder: ApplicationStatus[] = [
          'saved',
          'applied',
          'screening',
          'interviewing',
          'offered',
        ];
        let lastStageWithApps = -1;

        stageOrder.forEach((status, idx) => {
          if (counts[status] > 0) {
            lastStageWithApps = idx;
          }
        });

        // Create links from saved to the furthest stage
        for (let i = 0; i < lastStageWithApps; i++) {
          const from = stageOrder[i];
          const to = stageOrder[i + 1];
          // Use the count of whichever has more to ensure visible links
          const flowValue = Math.max(counts[from], counts[to], 1);
          linkMap.set(`${from}->${to}`, flowValue);
        }
      }
    }

    // Convert to links array
    const links: SankeyLinkData[] = [];
    linkMap.forEach((value, key) => {
      const [from, to] = key.split('->') as [ApplicationStatus, ApplicationStatus];
      if (value > 0) {
        links.push({ source: from, target: to, value });
      }
    });

    return { nodes, links, nodeIdMap };
  });

  // Calculate Sankey layout using d3-sankey
  const sankeyLayout = createMemo(() => {
    const { nodes, links } = sankeyData();
    const { svg } = SANKEY_DESIGN;

    if (nodes.length === 0) {
      return { nodes: [], links: [] };
    }

    // Create the sankey layout generator
    const sankeyGenerator = sankey<SankeyNodeData, SankeyLinkData>()
      .nodeId((d) => d.id)
      .nodeWidth(svg.nodeWidth)
      .nodePadding(svg.nodePadding)
      .extent([
        [svg.margin.left, svg.margin.top],
        [svg.width - svg.margin.right, svg.height - svg.margin.bottom],
      ])
      .nodeSort((a, b) => {
        // Custom sort to maintain logical order within columns
        const order: ApplicationStatus[] = [
          'saved',
          'applied',
          'screening',
          'interviewing',
          'offered',
          'accepted',
          'rejected',
          'withdrawn',
        ];
        return order.indexOf(a.id) - order.indexOf(b.id);
      });

    // Generate the layout
    try {
      // d3-sankey requires at least one link to position nodes properly
      // If we have nodes but no links, we need to handle this case
      if (links.length === 0) {
        // Return nodes with manual positioning when no links exist
        const nodeCount = nodes.length;
        const availableWidth = svg.width - svg.margin.left - svg.margin.right - svg.nodeWidth;
        const stepX = nodeCount > 1 ? availableWidth / (nodeCount - 1) : 0;

        const positionedNodes = nodes.map((node, i) => ({
          ...node,
          x0: svg.margin.left + i * stepX,
          x1: svg.margin.left + i * stepX + svg.nodeWidth,
          y0: svg.margin.top + 50,
          y1: svg.margin.top + 50 + Math.max(40, node.count * 30),
          sourceLinks: [],
          targetLinks: [],
          value: node.count,
          index: i,
          depth: i,
          height: 0,
          layer: i,
        }));

        return { nodes: positionedNodes, links: [] };
      }

      const graph = sankeyGenerator({
        nodes: nodes.map((d) => ({ ...d })),
        links: links.map((d) => ({ ...d })),
      });

      return graph;
    } catch (e) {
      // Fallback if sankey fails (e.g., circular dependencies)
      console.warn('Sankey layout failed:', e);

      // Return nodes with basic positioning
      const positionedNodes = nodes.map((node, i) => ({
        ...node,
        x0: svg.margin.left + i * 150,
        x1: svg.margin.left + i * 150 + svg.nodeWidth,
        y0: svg.margin.top + 50,
        y1: svg.margin.top + 50 + Math.max(40, node.count * 30),
        sourceLinks: [],
        targetLinks: [],
        value: node.count,
        index: i,
        depth: i,
        height: 0,
        layer: i,
      }));

      return { nodes: positionedNodes, links: [] };
    }
  });

  // Get link path generator
  const linkPath = sankeyLinkHorizontal();

  // Get applications for a specific status
  const getApplicationsForStatus = (status: ApplicationStatus) => {
    return applications().filter((app) => app.status === status);
  };

  // Check highlight state
  const isNodeHighlighted = (nodeId: ApplicationStatus) => {
    const hovered = hoveredNode();
    const link = hoveredLink();
    if (!hovered && !link) return null;
    if (hovered === nodeId) return true;
    if (link && (link.startsWith(`${nodeId}->`) || link.endsWith(`->${nodeId}`))) return true;
    return false;
  };

  return (
    <div
      role="region"
      aria-label="Application Pipeline Flow Diagram"
      style={{ 'font-family': SANKEY_DESIGN.fonts.body }}
    >
      {/* Sankey Diagram Card */}
      <FluidCard
        variant="elevated"
        style={{
          'margin-bottom': `${SANKEY_DESIGN.spacing.lg}px`,
          padding: `${SANKEY_DESIGN.spacing.xl}px`,
          background: `linear-gradient(145deg, 
            ${liquidAugment.glass.background}, 
            rgba(15, 15, 22, 0.98))`,
          border: liquidAugment.glass.border,
          'border-radius': `${SANKEY_DESIGN.radii.lg}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: `linear-gradient(180deg, ${statusColors.applied.text}06, transparent)`,
            'pointer-events': 'none',
          }}
        />

        {/* Header */}
        <header
          style={{
            margin: `0 0 ${SANKEY_DESIGN.spacing.lg}px`,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            position: 'relative',
          }}
        >
          <h3
            style={{
              margin: 0,
              'font-size': '22px',
              'font-family': SANKEY_DESIGN.fonts.heading,
              'font-weight': '600',
              color: liquidAugment.colors.text,
              display: 'flex',
              'align-items': 'center',
              gap: `${SANKEY_DESIGN.spacing.md}px`,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '4px',
                height: '28px',
                background: `linear-gradient(180deg, 
                  ${statusColors.applied.text}, 
                  ${statusColors.interviewing.text})`,
                'border-radius': '2px',
              }}
            />
            Application Flow
          </h3>

          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: `${SANKEY_DESIGN.spacing.md}px`,
              'font-size': '13px',
              color: liquidAugment.colors.textMuted,
            }}
          >
            <span style={{ opacity: 0.7 }}>Total: {applications().length}</span>
            <Show when={statusCounts().interviewing > 0}>
              <span
                style={{
                  padding: '4px 10px',
                  background: `${statusColors.interviewing.text}15`,
                  'border-radius': '9999px',
                  color: statusColors.interviewing.text,
                  'font-weight': '500',
                }}
              >
                {statusCounts().interviewing} interviewing
              </span>
            </Show>
          </div>
        </header>

        {/* Sankey SVG */}
        <Show
          when={applications().length > 0}
          fallback={
            <div
              style={{
                'text-align': 'center',
                padding: `${SANKEY_DESIGN.spacing.xl * 2}px ${SANKEY_DESIGN.spacing.lg}px`,
                color: liquidAugment.colors.textMuted,
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  'border-radius': '16px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v7M14 17h6" />
                </svg>
              </div>
              <p style={{ margin: 0, 'font-size': '15px' }}>
                Add jobs to visualize your pipeline flow
              </p>
              <p style={{ margin: '8px 0 0', 'font-size': '13px', opacity: 0.6 }}>
                Node heights will reflect application counts
              </p>
            </div>
          }
        >
          <svg
            width="100%"
            viewBox={`0 0 ${SANKEY_DESIGN.svg.width} ${SANKEY_DESIGN.svg.height}`}
            style={{ 'max-width': '100%', height: 'auto', overflow: 'visible' }}
            role="img"
            aria-label="Sankey diagram showing application flow between pipeline stages"
          >
            <defs>
              {/* Glow filter */}
              <filter id="sankey-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradient definitions for each status */}
              <For each={Object.keys(statusColors) as ApplicationStatus[]}>
                {(status) => (
                  <linearGradient
                    id={`sankey-gradient-${status}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stop-color={statusColors[status].text} stop-opacity="0.9" />
                    <stop offset="100%" stop-color={statusColors[status].text} stop-opacity="0.6" />
                  </linearGradient>
                )}
              </For>
            </defs>

            {/* Render Links */}
            <g class="sankey-links" fill="none">
              <For
                each={
                  sankeyLayout().links as Array<
                    SankeyLink<SankeyNodeData, SankeyLinkData> & {
                      source: SankeyNode<SankeyNodeData, SankeyLinkData>;
                      target: SankeyNode<SankeyNodeData, SankeyLinkData>;
                    }
                  >
                }
              >
                {(link) => {
                  const sourceNode = link.source;
                  const targetNode = link.target;
                  const linkId = `${sourceNode.id}->${targetNode.id}`;
                  const isHighlighted =
                    hoveredLink() === linkId ||
                    hoveredNode() === sourceNode.id ||
                    hoveredNode() === targetNode.id;

                  const pathD = linkPath(link as never);
                  const strokeColor = targetNode.color;

                  return (
                    <g
                      style={{
                        cursor: 'pointer',
                        transition: `opacity ${SANKEY_DESIGN.timing.fast}`,
                      }}
                      onMouseEnter={() => setHoveredLink(linkId)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      {/* Link background for hover area */}
                      <path
                        d={pathD || ''}
                        stroke={strokeColor}
                        stroke-width={Math.max((link.width || 0) + 8, 12)}
                        stroke-opacity="0"
                      />

                      {/* Outer glow */}
                      <path
                        d={pathD || ''}
                        stroke={strokeColor}
                        stroke-width={(link.width || 0) + 4}
                        stroke-opacity={isHighlighted ? 0.2 : 0.05}
                        style={{ transition: `stroke-opacity ${SANKEY_DESIGN.timing.fast}` }}
                      />

                      {/* Main link */}
                      <path
                        d={pathD || ''}
                        stroke={strokeColor}
                        stroke-width={link.width || 0}
                        stroke-opacity={isHighlighted ? 0.7 : 0.35}
                        style={{ transition: `stroke-opacity ${SANKEY_DESIGN.timing.fast}` }}
                      />

                      {/* Inner highlight */}
                      <path
                        d={pathD || ''}
                        stroke={strokeColor}
                        stroke-width={Math.max(2, (link.width || 0) / 4)}
                        stroke-opacity={isHighlighted ? 1 : 0.6}
                        filter={isHighlighted ? 'url(#sankey-glow)' : undefined}
                        style={{ transition: `stroke-opacity ${SANKEY_DESIGN.timing.fast}` }}
                      />

                      {/* Flow count on hover */}
                      <Show when={isHighlighted && link.value > 0}>
                        <text
                          x={((sourceNode.x1 || 0) + (targetNode.x0 || 0)) / 2}
                          y={((link.y0 || 0) + (link.y1 || 0)) / 2 - 8}
                          text-anchor="middle"
                          fill={strokeColor}
                          font-size="13"
                          font-family={SANKEY_DESIGN.fonts.body}
                          font-weight="600"
                        >
                          {link.value}
                        </text>
                      </Show>
                    </g>
                  );
                }}
              </For>
            </g>

            {/* Render Nodes */}
            <g class="sankey-nodes">
              <For each={sankeyLayout().nodes as Array<SankeyNode<SankeyNodeData, SankeyLinkData>>}>
                {(node) => {
                  const nodeWidth = (node.x1 || 0) - (node.x0 || 0);
                  const nodeHeight = (node.y1 || 0) - (node.y0 || 0);
                  const highlighted = isNodeHighlighted(node.id);
                  const hasApps = node.count > 0;

                  return (
                    <g
                      class="sankey-node"
                      style={{
                        cursor: hasApps ? 'pointer' : 'default',
                        transition: `transform ${SANKEY_DESIGN.timing.normal}`,
                      }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => {
                        const apps = getApplicationsForStatus(node.id);
                        if (apps.length > 0) props.onSelectJob(apps[0]);
                      }}
                      tabIndex={hasApps ? 0 : -1}
                      role="button"
                      aria-label={`${node.name}: ${node.count} applications`}
                    >
                      {/* Node glow */}
                      <Show when={hasApps && highlighted === true}>
                        <rect
                          x={(node.x0 || 0) - 3}
                          y={(node.y0 || 0) - 3}
                          width={nodeWidth + 6}
                          height={nodeHeight + 6}
                          rx="6"
                          fill="none"
                          stroke={node.color}
                          stroke-width="2"
                          stroke-opacity="0.4"
                          filter="url(#sankey-glow)"
                        />
                      </Show>

                      {/* Node rectangle */}
                      <rect
                        x={node.x0 || 0}
                        y={node.y0 || 0}
                        width={nodeWidth}
                        height={nodeHeight}
                        rx="4"
                        fill={
                          hasApps ? `url(#sankey-gradient-${node.id})` : 'rgba(255,255,255,0.05)'
                        }
                        stroke={node.color}
                        stroke-width={hasApps ? (highlighted === true ? 2 : 1) : 0.5}
                        stroke-opacity={hasApps ? (highlighted === true ? 1 : 0.6) : 0.2}
                        style={{ transition: `all ${SANKEY_DESIGN.timing.fast}` }}
                      />

                      {/* Node label - right of node */}
                      <text
                        x={(node.x1 || 0) + 8}
                        y={(node.y0 || 0) + nodeHeight / 2}
                        dominant-baseline="middle"
                        fill={hasApps ? liquidAugment.colors.text : liquidAugment.colors.textMuted}
                        font-size="12"
                        font-family={SANKEY_DESIGN.fonts.body}
                        font-weight="500"
                        opacity={hasApps ? 1 : 0.5}
                      >
                        {node.name}
                      </text>

                      {/* Count badge - inside or next to node */}
                      <Show when={node.count > 0}>
                        <text
                          x={(node.x1 || 0) + 8}
                          y={(node.y0 || 0) + nodeHeight / 2 + 16}
                          dominant-baseline="middle"
                          fill={node.color}
                          font-size="14"
                          font-family={SANKEY_DESIGN.fonts.heading}
                          font-weight="700"
                        >
                          {node.count}
                        </text>
                      </Show>
                    </g>
                  );
                }}
              </For>
            </g>
          </svg>
        </Show>
      </FluidCard>

      {/* Status Cards Grid */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: `${SANKEY_DESIGN.spacing.md}px`,
        }}
        role="list"
        aria-label="Status summary cards"
      >
        <For each={ACTIVE_STATUSES}>
          {(status) => (
            <StatusCard
              status={status}
              count={statusCounts()[status]}
              applications={getApplicationsForStatus(status)}
              theme={theme}
              onSelectJob={props.onSelectJob}
            />
          )}
        </For>
      </div>
    </div>
  );
};

// Status card sub-component
interface StatusCardProps {
  status: ApplicationStatus;
  count: number;
  applications: JobApplication[];
  theme: () => typeof liquidAugment;
  onSelectJob: (job: JobApplication) => void;
}

const StatusCard: Component<StatusCardProps> = (props) => {
  const color = () => statusColors[props.status]?.text || liquidAugment.colors.text;
  const hasApps = () => props.count > 0;

  return (
    <FluidCard
      hoverable
      glowColor={color()}
      onClick={() => {
        if (props.applications.length > 0) {
          props.onSelectJob(props.applications[0]);
        }
      }}
      style={{
        padding: `${SANKEY_DESIGN.spacing.lg}px ${SANKEY_DESIGN.spacing.md}px`,
        cursor: hasApps() ? 'pointer' : 'default',
        opacity: hasApps() ? 1 : 0.45,
        border: `1px solid ${hasApps() ? `${color()}30` : 'rgba(255, 255, 255, 0.05)'}`,
        background: hasApps()
          ? `linear-gradient(145deg, ${color()}0A, transparent 70%)`
          : 'rgba(18, 18, 24, 0.5)',
        'border-radius': `${SANKEY_DESIGN.radii.lg}px`,
        position: 'relative',
        overflow: 'hidden',
        transition: `all ${SANKEY_DESIGN.timing.normal}`,
      }}
    >
      {/* Top accent */}
      <Show when={hasApps()}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${color()}50, transparent)`,
            'border-radius': '0 0 2px 2px',
          }}
        />
      </Show>

      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          gap: `${SANKEY_DESIGN.spacing.sm}px`,
        }}
      >
        <div
          style={{
            'font-size': '36px',
            'font-family': SANKEY_DESIGN.fonts.heading,
            'font-weight': '700',
            color: hasApps() ? color() : 'rgba(255, 255, 255, 0.2)',
            'text-shadow': hasApps() ? `0 0 24px ${color()}30` : 'none',
            'line-height': '1',
          }}
        >
          {props.count}
        </div>

        <div
          style={{
            'font-size': '11px',
            'font-family': SANKEY_DESIGN.fonts.body,
            'text-transform': 'uppercase',
            'letter-spacing': '0.1em',
            color: hasApps() ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)',
            'font-weight': '500',
          }}
        >
          {STATUS_LABELS[props.status]}
        </div>

        <Show when={props.applications.length > 0}>
          <div
            style={{
              'margin-top': `${SANKEY_DESIGN.spacing.sm}px`,
              'padding-top': `${SANKEY_DESIGN.spacing.sm}px`,
              'border-top': `1px solid ${color()}18`,
              width: '100%',
            }}
          >
            <div
              style={{
                'font-size': '12px',
                'font-family': SANKEY_DESIGN.fonts.body,
                color: liquidAugment.colors.text,
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'font-weight': '500',
                'text-align': 'center',
              }}
            >
              {props.applications[0].companyName}
            </div>
            <div
              style={{
                'font-size': '11px',
                'font-family': SANKEY_DESIGN.fonts.body,
                color: liquidAugment.colors.textMuted,
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'margin-top': '2px',
                'text-align': 'center',
              }}
            >
              {props.applications[0].roleName}
            </div>
          </div>
        </Show>
      </div>
    </FluidCard>
  );
};

export default SankeyView;
