/**
 * SankeyView - Visual flow diagram showing application pipeline progression
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo, For, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidAugment, statusColors } from '../theme/liquid-augment';
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

// Define the flow stages for the Sankey diagram
const FLOW_STAGES: ApplicationStatus[][] = [
  ['saved'],
  ['applied'],
  ['screening'],
  ['interviewing'],
  ['offered'],
  ['accepted', 'rejected', 'withdrawn'],
];

// Node positions for SVG rendering
interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  status: ApplicationStatus;
  count: number;
}

export const SankeyView: Component<SankeyViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const applications = () => pipelineStore.state.applications;

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

  // Calculate flow between stages based on status history
  const flowData = createMemo(() => {
    const flows: { from: ApplicationStatus; to: ApplicationStatus; count: number }[] = [];
    const flowMap = new Map<string, number>();

    // Analyze status history to understand flow
    for (const app of applications()) {
      if (app.statusHistory && app.statusHistory.length > 1) {
        for (let i = 0; i < app.statusHistory.length - 1; i++) {
          const from = app.statusHistory[i].status;
          const to = app.statusHistory[i + 1].status;
          const key = `${from}->${to}`;
          flowMap.set(key, (flowMap.get(key) || 0) + 1);
        }
      }
    }

    // Convert map to array
    flowMap.forEach((count, key) => {
      const [from, to] = key.split('->') as [ApplicationStatus, ApplicationStatus];
      flows.push({ from, to, count });
    });

    // If no history, create implied flows from current status
    if (flows.length === 0) {
      const counts = statusCounts();
      // Create linear flow assumption
      if (counts.applied > 0) flows.push({ from: 'saved', to: 'applied', count: counts.applied });
      if (counts.screening > 0)
        flows.push({ from: 'applied', to: 'screening', count: counts.screening });
      if (counts.interviewing > 0)
        flows.push({ from: 'screening', to: 'interviewing', count: counts.interviewing });
      if (counts.offered > 0)
        flows.push({ from: 'interviewing', to: 'offered', count: counts.offered });
      if (counts.accepted > 0)
        flows.push({ from: 'offered', to: 'accepted', count: counts.accepted });
      if (counts.rejected > 0)
        flows.push({ from: 'interviewing', to: 'rejected', count: counts.rejected });
    }

    return flows;
  });

  // Calculate node positions
  const nodePositions = createMemo(() => {
    const nodes: NodePosition[] = [];
    const counts = statusCounts();
    const totalApps = applications().length || 1;

    const svgWidth = 800;
    const svgHeight = 400;
    const nodeWidth = 100;
    const stageGap = (svgWidth - nodeWidth) / (FLOW_STAGES.length - 1);

    FLOW_STAGES.forEach((stageStatuses, stageIndex) => {
      const x = stageIndex * stageGap;
      const stageHeight = svgHeight - 60;

      // Calculate vertical distribution for statuses in this stage
      // Calculate y offset for centering
      let currentY = 30;

      stageStatuses.forEach((status) => {
        const count = counts[status];
        const height = Math.max(30, (count / Math.max(totalApps, 1)) * stageHeight * 0.8);

        nodes.push({
          x,
          y: currentY,
          width: nodeWidth,
          height,
          status,
          count,
        });

        currentY += height + 20;
      });
    });

    return nodes;
  });

  // Get color for status
  const getStatusColor = (status: ApplicationStatus) => {
    return statusColors[status]?.text || '#FFFFFF';
  };

  // Get applications for a specific status
  const getApplicationsForStatus = (status: ApplicationStatus) => {
    return applications().filter((app) => app.status === status);
  };

  return (
    <div>
      {/* Sankey Diagram */}
      <FluidCard
        variant="elevated"
        style={{
          'margin-bottom': '24px',
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(25, 25, 30, 0.95), rgba(15, 15, 20, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.03), transparent)',
            'pointer-events': 'none',
          }}
        />
        <h3
          style={{
            margin: '0 0 24px',
            'font-size': '20px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: '#FFFFFF',
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
            position: 'relative',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '4px',
              height: '24px',
              background: 'linear-gradient(180deg, #60A5FA, #8B5CF6)',
              'border-radius': '2px',
            }}
          />
          Application Flow
        </h3>

        <Show
          when={applications().length > 0}
          fallback={
            <div
              style={{
                'text-align': 'center',
                padding: '60px 20px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <p style={{ 'font-family': "'Space Grotesk', system-ui, sans-serif" }}>
                Add jobs to see your prospecting flow
              </p>
            </div>
          }
        >
          <svg
            width="100%"
            viewBox="0 0 800 400"
            style={{
              'max-width': '100%',
              height: 'auto',
              overflow: 'visible',
            }}
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="flowGradientBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#60A5FA" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#22D3EE" stop-opacity="0.6" />
              </linearGradient>
              <linearGradient id="flowGradientPurple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#A78BFA" stop-opacity="0.6" />
              </linearGradient>
              <linearGradient id="flowGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#34D399" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#10B981" stop-opacity="0.6" />
              </linearGradient>
              <linearGradient id="flowGradientYellow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#F59E0B" stop-opacity="0.6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Flow paths */}
            <For each={flowData()}>
              {(flow) => {
                const fromNode = nodePositions().find((n) => n.status === flow.from);
                const toNode = nodePositions().find((n) => n.status === flow.to);

                if (!fromNode || !toNode || flow.count === 0) return null;

                const pathHeight = Math.max(6, flow.count * 10);
                const fromX = fromNode.x + fromNode.width;
                const fromY = fromNode.y + fromNode.height / 2;
                const toX = toNode.x;
                const toY = toNode.y + toNode.height / 2;
                const midX = (fromX + toX) / 2;

                // Bezier curve path
                const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

                return (
                  <g style={{ transition: 'all 0.3s ease' }}>
                    {/* Outer glow */}
                    <path
                      d={path}
                      fill="none"
                      stroke={getStatusColor(flow.to)}
                      stroke-width={pathHeight + 4}
                      stroke-opacity="0.1"
                      stroke-linecap="round"
                    />
                    {/* Main flow */}
                    <path
                      d={path}
                      fill="none"
                      stroke={getStatusColor(flow.to)}
                      stroke-width={pathHeight}
                      stroke-opacity="0.35"
                      stroke-linecap="round"
                    />
                    {/* Inner highlight */}
                    <path
                      d={path}
                      fill="none"
                      stroke={getStatusColor(flow.to)}
                      stroke-width={Math.max(3, pathHeight / 3)}
                      stroke-opacity="0.9"
                      stroke-linecap="round"
                      filter="url(#glow)"
                    />
                  </g>
                );
              }}
            </For>

            {/* Nodes */}
            <For each={nodePositions()}>
              {(node) => (
                <g
                  class="sankey-node"
                  style={{ cursor: node.count > 0 ? 'pointer' : 'default' }}
                  onClick={() => {
                    const apps = getApplicationsForStatus(node.status);
                    if (apps.length > 0) props.onSelectJob(apps[0]);
                  }}
                >
                  {/* Node glow */}
                  <Show when={node.count > 0}>
                    <rect
                      x={node.x - 2}
                      y={node.y - 2}
                      width={node.width + 4}
                      height={node.height + 4}
                      rx="10"
                      fill="none"
                      stroke={getStatusColor(node.status)}
                      stroke-width="1"
                      stroke-opacity="0.3"
                      filter="url(#glow)"
                    />
                  </Show>
                  {/* Node background */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx="8"
                    fill={
                      node.count > 0
                        ? `url(#flowGradient${node.status === 'interviewing' ? 'Purple' : node.status === 'offered' || node.status === 'accepted' ? 'Green' : node.status === 'screening' ? 'Blue' : 'Blue'})`
                        : 'rgba(255,255,255,0.03)'
                    }
                    fill-opacity={node.count > 0 ? 0.15 : 0.5}
                    stroke={getStatusColor(node.status)}
                    stroke-width={node.count > 0 ? 2 : 1}
                    stroke-opacity={node.count > 0 ? 0.9 : 0.15}
                  />

                  {/* Status label */}
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2 - 8}
                    text-anchor="middle"
                    fill="#FFFFFF"
                    font-size="11"
                    font-family="'Space Grotesk', system-ui, sans-serif"
                    font-weight="500"
                    opacity={node.count > 0 ? 1 : 0.35}
                  >
                    {STATUS_LABELS[node.status]}
                  </text>

                  {/* Count */}
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2 + 12}
                    text-anchor="middle"
                    fill={node.count > 0 ? getStatusColor(node.status) : 'rgba(255,255,255,0.2)'}
                    font-size="20"
                    font-family="'Playfair Display', Georgia, serif"
                    font-weight="700"
                  >
                    {node.count}
                  </text>
                </g>
              )}
            </For>
          </svg>
        </Show>
      </FluidCard>

      {/* Status Cards - Quick Overview */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
        }}
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
  const color = () => statusColors[props.status]?.text || '#FFFFFF';

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
        padding: '18px',
        cursor: props.count > 0 ? 'pointer' : 'default',
        opacity: props.count > 0 ? 1 : 0.4,
        border: `1px solid ${props.count > 0 ? `${color()}35` : 'rgba(255, 255, 255, 0.06)'}`,
        background:
          props.count > 0
            ? `linear-gradient(135deg, ${color()}08, transparent)`
            : 'rgba(20, 20, 25, 0.6)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent */}
      <Show when={props.count > 0}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${color()}60, transparent)`,
            'border-radius': '0 0 2px 2px',
          }}
        />
      </Show>
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            'font-size': '32px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '700',
            color: props.count > 0 ? color() : 'rgba(255, 255, 255, 0.25)',
            'text-shadow': props.count > 0 ? `0 0 20px ${color()}40` : 'none',
          }}
        >
          {props.count}
        </div>
        <div
          style={{
            'font-size': '11px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'text-transform': 'uppercase',
            'letter-spacing': '0.08em',
            color: props.count > 0 ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.35)',
            'font-weight': '500',
          }}
        >
          {STATUS_LABELS[props.status]}
        </div>

        {/* Recent application preview */}
        <Show when={props.applications.length > 0}>
          <div
            style={{
              'margin-top': '10px',
              'padding-top': '10px',
              'border-top': `1px solid ${color()}20`,
              width: '100%',
            }}
          >
            <div
              style={{
                'font-size': '12px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: '#FFFFFF',
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'font-weight': '500',
              }}
            >
              {props.applications[0].companyName}
            </div>
            <div
              style={{
                'font-size': '11px',
                color: 'rgba(255, 255, 255, 0.45)',
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'margin-top': '2px',
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
