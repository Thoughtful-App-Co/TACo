/**
 * Pipeline Module - Job Application Tracking for Augment
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// Store
export { pipelineStore } from './store';

// Components
export { PipelineView } from './components';
export { PipelineDashboard } from './components';
export { ProfileBuilder } from './components';
export { JobInput } from './components';
export { SyncSettings } from './components';
export { Sidebar } from './components';
export type { SidebarView } from './components';

// UI
export { FluidCard, StatusBadge, AgingIndicator, ScoreBadge } from './ui';

// Theme
export {
  liquidAugment,
  pipelineKeyframes,
  statusColors,
  agingColors,
} from './theme/liquid-augment';
