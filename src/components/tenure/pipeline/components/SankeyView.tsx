/**
 * SankeyView - Visual flow diagram showing application pipeline progression
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * Uses d3-sankey for proper Sankey layout calculations where node heights
 * are proportional to their values (application counts).
 *
 * Key Features:
 * - Cumulative flow model: if an app is at stage N, it implies flow through stages 1 to N-1
 * - Ghost links for empty paths to show pipeline structure
 * - Gradient fills on links transitioning from source to target color
 * - Proper empty state with full pipeline structure visible
 */

import { Component, createMemo, createSignal, For, Show } from 'solid-js';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { pipelineStore } from '../store';
import { liquidTenure, statusColors, pipelineAnimations } from '../theme/liquid-tenure';
import { FluidCard } from '../ui';
import { SankeyTooltip } from './SankeyTooltip';
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
} from '../../../../schemas/pipeline.schema';

interface SankeyViewProps {
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
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
  isGhost: boolean; // Whether this is a ghost link (0 actual flow)
}

// Pipeline stages in order
const PIPELINE_STAGES: ApplicationStatus[] = [
  'saved',
  'applied',
  'screening',
  'interviewing',
  'offered',
];

// Terminal stages that branch from the main pipeline
const TERMINAL_STAGES: ApplicationStatus[] = ['accepted', 'rejected', 'withdrawn'];

// Stage index lookup for cumulative calculations
const STAGE_INDEX: Record<ApplicationStatus, number> = {
  saved: 0,
  applied: 1,
  screening: 2,
  interviewing: 3,
  offered: 4,
  accepted: 5,
  rejected: 5, // Same level as accepted (terminal)
  withdrawn: 5,
};

// Design tokens
const SANKEY_DESIGN = {
  fonts: {
    heading: liquidTenure.fonts.heading,
    body: liquidTenure.fonts.body,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 4,
    md: 4,
    lg: 4,
  },
  timing: {
    fast: pipelineAnimations.fast,
    normal: pipelineAnimations.normal,
  },
  svg: {
    width: 900,
    height: 400,
    nodeWidth: 24,
    nodePadding: 20,
    margin: { top: 40, right: 120, bottom: 20, left: 20 },
  },
  links: {
    minWidth: 4, // Minimum link width for visibility
    maxWidth: 60, // Maximum link width to maintain readability
    ghostOpacity: 0.1, // Opacity for ghost links
    normalOpacity: 0.45,
    hoverOpacity: 0.7,
  },
};

export const SankeyView: Component<SankeyViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const applications = () => pipelineStore.state.applications;

  // Interactive state
  const [hoveredNode, setHoveredNode] = createSignal<ApplicationStatus | null>(null);
  const [hoveredLink, setHoveredLink] = createSignal<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = createSignal({ x: 0, y: 0, alignRight: false });

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

  // Calculate cumulative "flow through" counts
  // An app at stage N implies it passed through stages 0 to N-1
  const flowThroughCounts = createMemo(() => {
    // For each stage, count apps that are at that stage OR beyond
    // saved: all apps (everyone starts here)
    // applied: apps at applied, screening, interviewing, offered, accepted, rejected
    // screening: apps at screening, interviewing, offered, accepted, (rejected if got to screening)
    // etc.

    const flowThrough: Record<ApplicationStatus, number> = {
      saved: 0,
      applied: 0,
      screening: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    // Count apps that reached each stage (cumulative)
    for (const app of applications()) {
      const currentStageIndex = STAGE_INDEX[app.status];

      // This app has "flowed through" all stages up to its current position
      for (let i = 0; i <= currentStageIndex && i < PIPELINE_STAGES.length; i++) {
        flowThrough[PIPELINE_STAGES[i]]++;
      }

      // Terminal stages get their exact counts
      if (app.status === 'accepted') flowThrough.accepted++;
      if (app.status === 'rejected') flowThrough.rejected++;
      if (app.status === 'withdrawn') flowThrough.withdrawn++;
    }

    return flowThrough;
  });

  // Build the Sankey graph data with cumulative flow links
  const sankeyData = createMemo(() => {
    const currentCounts = statusCounts();
    const flowThrough = flowThroughCounts();
    const hasAnyApplications = applications().length > 0;

    // Always create nodes for all pipeline stages (for structure visibility)
    const nodes: SankeyNodeData[] = [];
    const nodeIdMap = new Map<ApplicationStatus, number>();

    // Add main pipeline stages
    PIPELINE_STAGES.forEach((status) => {
      nodeIdMap.set(status, nodes.length);
      nodes.push({
        id: status,
        name: STATUS_LABELS[status],
        count: currentCounts[status],
        color: statusColors[status]?.text || '#FFFFFF',
      });
    });

    // Add terminal stages if they have applications, or always show accepted
    const terminalToShow: ApplicationStatus[] = ['accepted'];
    if (currentCounts.rejected > 0) terminalToShow.push('rejected');
    if (currentCounts.withdrawn > 0) terminalToShow.push('withdrawn');

    terminalToShow.forEach((status) => {
      nodeIdMap.set(status, nodes.length);
      nodes.push({
        id: status,
        name: STATUS_LABELS[status],
        count: currentCounts[status],
        color: statusColors[status]?.text || '#FFFFFF',
      });
    });

    // Build links with cumulative flow model
    const links: SankeyLinkData[] = [];

    // Main pipeline flow: saved -> applied -> screening -> interviewing -> offered
    for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
      const from = PIPELINE_STAGES[i];
      const to = PIPELINE_STAGES[i + 1];

      // Flow through this link = apps that reached the target stage or beyond
      // This represents how many apps "flowed through" this connection
      const targetFlowThrough = flowThrough[to];

      // Determine if this is a ghost link (no actual flow)
      const isGhost = targetFlowThrough === 0;

      // Value must be > 0 for d3-sankey, use 0.5 for ghost links
      const value = isGhost ? 0.5 : targetFlowThrough;

      links.push({
        source: from,
        target: to,
        value,
        isGhost,
      });
    }

    // Terminal branches from offered stage
    // offered -> accepted
    const acceptedFlow = currentCounts.accepted;
    links.push({
      source: 'offered',
      target: 'accepted',
      value: acceptedFlow > 0 ? acceptedFlow : 0.5,
      isGhost: acceptedFlow === 0,
    });

    // Add rejected link from interviewing if there are rejected apps
    // (Most rejections happen after interviews)
    if (currentCounts.rejected > 0 && nodeIdMap.has('rejected')) {
      links.push({
        source: 'interviewing',
        target: 'rejected',
        value: currentCounts.rejected,
        isGhost: false,
      });
    }

    // Add withdrawn link from applied if there are withdrawn apps
    if (currentCounts.withdrawn > 0 && nodeIdMap.has('withdrawn')) {
      links.push({
        source: 'applied',
        target: 'withdrawn',
        value: currentCounts.withdrawn,
        isGhost: false,
      });
    }

    return { nodes, links, nodeIdMap, hasAnyApplications };
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
        // Terminal stages should be sorted: accepted first, then rejected, then withdrawn
        if (TERMINAL_STAGES.includes(a.id) && TERMINAL_STAGES.includes(b.id)) {
          const terminalOrder = ['accepted', 'rejected', 'withdrawn'];
          return terminalOrder.indexOf(a.id) - terminalOrder.indexOf(b.id);
        }
        return STAGE_INDEX[a.id] - STAGE_INDEX[b.id];
      });

    try {
      const graph = sankeyGenerator({
        nodes: nodes.map((d) => ({ ...d })),
        links: links.map((d) => ({ ...d })),
      });

      return graph;
    } catch (e) {
      console.warn('Sankey layout failed:', e);

      // Fallback: position nodes manually in a horizontal line
      const nodeCount = nodes.length;
      const availableWidth = svg.width - svg.margin.left - svg.margin.right - svg.nodeWidth;
      const stepX = nodeCount > 1 ? availableWidth / (nodeCount - 1) : 0;

      const positionedNodes = nodes.map((node, i) => ({
        ...node,
        x0: svg.margin.left + i * stepX,
        x1: svg.margin.left + i * stepX + svg.nodeWidth,
        y0: svg.margin.top + 50,
        y1: svg.margin.top + 50 + Math.max(40, (node.count || 1) * 20),
        sourceLinks: [],
        targetLinks: [],
        value: node.count || 1,
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

  // Calculate link width with min/max constraints
  const getLinkWidth = (link: SankeyLink<SankeyNodeData, SankeyLinkData>) => {
    const baseWidth = link.width || 0;
    const { minWidth, maxWidth } = SANKEY_DESIGN.links;

    // For ghost links, use minimum width
    if ((link as unknown as SankeyLinkData).isGhost) {
      return minWidth;
    }

    return Math.max(minWidth, Math.min(maxWidth, baseWidth));
  };

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

  // Generate unique gradient IDs for links
  const getLinkGradientId = (sourceId: string, targetId: string) =>
    `sankey-link-gradient-${sourceId}-${targetId}`;

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
            ${liquidTenure.glass.background}, 
            rgba(15, 15, 22, 0.98))`,
          border: liquidTenure.glass.border,
          'border-radius': '4px',
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
              color: liquidTenure.colors.text,
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
              color: liquidTenure.colors.textMuted,
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

        {/* Sankey SVG - Always show structure, even when empty */}
        <div style={{ position: 'relative' }}>
          <svg
            width="100%"
            viewBox={`0 0 ${SANKEY_DESIGN.svg.width} ${SANKEY_DESIGN.svg.height}`}
            style={{ 'max-width': '100%', height: 'auto', overflow: 'visible' }}
            role="img"
            aria-label="Sankey diagram showing application flow between pipeline stages"
          >
            <defs>
              {/* Glow filter */}
              <filter id="sankey-glow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Subtle glow for hover */}
              <filter id="sankey-subtle-glow" x="-15%" y="-15%" width="130%" height="130%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Subtle node shadow for depth */}
              <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25" />
              </filter>

              {/* Node gradient definitions */}
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

              {/* Link gradient definitions - source to target color transition */}
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
                  return (
                    <linearGradient
                      id={getLinkGradientId(sourceNode.id, targetNode.id)}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stop-color={sourceNode.color} />
                      <stop offset="100%" stop-color={targetNode.color} />
                    </linearGradient>
                  );
                }}
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
                  const isGhost = (link as unknown as SankeyLinkData).isGhost;
                  const isHighlighted =
                    hoveredLink() === linkId ||
                    hoveredNode() === sourceNode.id ||
                    hoveredNode() === targetNode.id;

                  const pathD = linkPath(link as never);
                  const linkWidth = getLinkWidth(link);
                  const gradientId = getLinkGradientId(sourceNode.id, targetNode.id);

                  // Calculate opacity based on ghost/highlight state
                  const baseOpacity = isGhost
                    ? SANKEY_DESIGN.links.ghostOpacity
                    : SANKEY_DESIGN.links.normalOpacity;
                  const opacity = isHighlighted ? SANKEY_DESIGN.links.hoverOpacity : baseOpacity;

                  return (
                    <g
                      style={{
                        cursor: 'pointer',
                        transition: `opacity ${SANKEY_DESIGN.timing.fast}`,
                      }}
                      onMouseEnter={() => setHoveredLink(linkId)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      {/* Link background for larger hover area */}
                      <path
                        d={pathD || ''}
                        stroke="transparent"
                        stroke-width={Math.max(linkWidth + 12, 16)}
                      />

                      {/* Outer glow on hover */}
                      <Show when={isHighlighted && !isGhost}>
                        <path
                          d={pathD || ''}
                          stroke={`url(#${gradientId})`}
                          stroke-width={linkWidth * 1.2}
                          stroke-opacity={0.2}
                          filter="url(#sankey-subtle-glow)"
                          style={{ transition: `stroke-opacity ${SANKEY_DESIGN.timing.fast}` }}
                        />
                      </Show>

                      {/* Main link with gradient */}
                      <path
                        d={pathD || ''}
                        stroke={`url(#${gradientId})`}
                        stroke-width={linkWidth}
                        stroke-opacity={opacity}
                        stroke-linecap="round"
                        style={{
                          transition: `stroke-opacity ${SANKEY_DESIGN.timing.fast}, stroke-width ${SANKEY_DESIGN.timing.fast}`,
                        }}
                      />

                      {/* Inner highlight line for depth */}
                      <Show when={!isGhost}>
                        <path
                          d={pathD || ''}
                          stroke={targetNode.color}
                          stroke-width={Math.min(2, linkWidth * 0.15)}
                          stroke-opacity={isHighlighted ? 0.8 : 0.4}
                          stroke-linecap="round"
                          filter={isHighlighted ? 'url(#sankey-subtle-glow)' : undefined}
                          style={{ transition: `stroke-opacity ${SANKEY_DESIGN.timing.fast}` }}
                        />
                      </Show>

                      {/* Flow count label on hover */}
                      <Show when={isHighlighted && !isGhost && link.value > 0}>
                        <g>
                          {/* Background pill for readability */}
                          <rect
                            x={((sourceNode.x1 || 0) + (targetNode.x0 || 0)) / 2 - 16}
                            y={((link.y0 || 0) + (link.y1 || 0)) / 2 - 22}
                            width="32"
                            height="18"
                            rx="6"
                            fill="rgba(0, 0, 0, 0.7)"
                          />
                          <text
                            x={((sourceNode.x1 || 0) + (targetNode.x0 || 0)) / 2}
                            y={((link.y0 || 0) + (link.y1 || 0)) / 2 - 10}
                            text-anchor="middle"
                            fill={targetNode.color}
                            font-size="12"
                            font-family={SANKEY_DESIGN.fonts.body}
                            font-weight="600"
                          >
                            {Math.round(link.value)}
                          </text>
                        </g>
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
                  const nodeHeight = Math.max(30, (node.y1 || 0) - (node.y0 || 0));
                  const highlighted = isNodeHighlighted(node.id);
                  const hasApps = node.count > 0;

                  return (
                    <g
                      class="sankey-node"
                      style={{
                        cursor: hasApps ? 'pointer' : 'default',
                        transition: `transform ${SANKEY_DESIGN.timing.normal}`,
                      }}
                      onMouseEnter={(e) => {
                        if (hasApps) {
                          setHoveredNode(node.id);
                          const rect = (e.currentTarget as SVGGElement).getBoundingClientRect();
                          const tooltipWidth = 320;
                          const padding = 20;

                          const wouldOverflowRight =
                            rect.right + padding + tooltipWidth > window.innerWidth;

                          const tooltipX = wouldOverflowRight
                            ? rect.left - padding
                            : rect.right + padding;

                          setTooltipPosition({
                            x: tooltipX,
                            y: rect.top + rect.height / 2,
                            alignRight: wouldOverflowRight,
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => {
                        const apps = getApplicationsForStatus(node.id);
                        if (apps.length > 0) props.onSelectJob(apps[0]);
                      }}
                      tabIndex={hasApps ? 0 : -1}
                      role="button"
                      aria-label={`${node.name}: ${node.count} applications`}
                    >
                      {/* Node glow on hover */}
                      <Show when={hasApps && highlighted === true}>
                        <rect
                          x={(node.x0 || 0) - 4}
                          y={(node.y0 || 0) - 4}
                          width={nodeWidth + 8}
                          height={nodeHeight + 8}
                          rx="4"
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
                          hasApps ? `url(#sankey-gradient-${node.id})` : 'rgba(255,255,255,0.03)'
                        }
                        stroke={node.color}
                        stroke-width="1.5"
                        stroke-opacity={hasApps ? (highlighted === true ? 1 : 0.6) : 0.15}
                        filter={hasApps ? 'url(#node-shadow)' : undefined}
                        style={{ transition: `all ${SANKEY_DESIGN.timing.fast}` }}
                      />

                      {/* Node label - right of node */}
                      <text
                        x={(node.x1 || 0) + 10}
                        y={(node.y0 || 0) + nodeHeight / 2 - 6}
                        dominant-baseline="middle"
                        fill={hasApps ? liquidTenure.colors.text : liquidTenure.colors.textMuted}
                        font-size="12"
                        font-family={SANKEY_DESIGN.fonts.body}
                        font-weight="500"
                        opacity={hasApps ? 1 : 0.4}
                      >
                        {node.name}
                      </text>

                      {/* Count - below label */}
                      <text
                        x={(node.x1 || 0) + 10}
                        y={(node.y0 || 0) + nodeHeight / 2 + 10}
                        dominant-baseline="middle"
                        fill={hasApps ? node.color : 'rgba(255,255,255,0.2)'}
                        font-size="16"
                        font-family={SANKEY_DESIGN.fonts.heading}
                        font-weight="700"
                      >
                        {node.count}
                      </text>
                    </g>
                  );
                }}
              </For>
            </g>
          </svg>

          {/* Empty state overlay message */}
          <Show when={applications().length === 0}>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                'text-align': 'center',
                background: 'rgba(15, 15, 22, 0.9)',
                padding: `${SANKEY_DESIGN.spacing.lg}px ${SANKEY_DESIGN.spacing.xl}px`,
                'border-radius': '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                'backdrop-filter': 'blur(8px)',
                'max-width': '300px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  'border-radius': '12px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={statusColors.applied.text}
                  stroke-width="1.5"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <p
                style={{
                  margin: 0,
                  'font-size': '14px',
                  color: liquidTenure.colors.text,
                  'font-weight': '500',
                }}
              >
                Pipeline Flow Visualization
              </p>
              <p
                style={{
                  margin: '8px 0 0',
                  'font-size': '12px',
                  color: liquidTenure.colors.textMuted,
                }}
              >
                Add jobs to see how applications flow through your pipeline stages
              </p>
            </div>
          </Show>
        </div>

        {/* Node Hover Tooltip */}
        <Show when={hoveredNode()}>
          <SankeyTooltip
            status={hoveredNode()!}
            applications={getApplicationsForStatus(hoveredNode()!)}
            theme={theme}
            position={tooltipPosition()}
          />
        </Show>
      </FluidCard>
    </div>
  );
};

export default SankeyView;
