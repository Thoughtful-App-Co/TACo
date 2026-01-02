/**
 * Prosper Module - Compensation & Career Tracking for Tenure
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// Store
export { prosperStore } from './store';

// Main View
export { ProsperView } from './components/ProsperView';

// Components
export { ProsperSidebar } from './components/ProsperSidebar';
export { DashboardView } from './components/DashboardView';
export { YourWorthView } from './components/YourWorthView';
export { JournalView } from './components/JournalView';
export { ReviewsView } from './components/ReviewsView';
export { ExportView } from './components/ExportView';

// Theme
export { prosperTenure, prosperColors, prosperGradients } from './theme/prosper-tenure';

// Services
export {
  getSalaryBenchmark,
  getRateLimitStatus,
  clearBenchmarkCache,
  prefetchCommonBenchmarks,
} from './services/salary-benchmark.service';
