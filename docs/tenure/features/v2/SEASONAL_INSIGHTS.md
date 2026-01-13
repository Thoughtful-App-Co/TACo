# Seasonal Hiring Insights (v2)

## Status

**Planned for v2**  
**Feature Flag:** `seasonalInsights`  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** BLS JOLTS data, O\*NET industry classification

---

## Overview

Transform the existing static seasonal hiring guidance into a comprehensive, personalized seasonal intelligence system. Currently shows generic month-by-month hiring scores—v2 will provide industry-specific, geography-aware, and user-personalized seasonal recommendations.

---

## Current State (v1 - Shipped)

### ✅ Implemented

- **Seasonal Insight Card:** Shows current month's hiring score (1-10) with generic recommendation
- **Seasonal Modal:** Full 12-month guide with hiring activity scores
- **Static Data:** Monthly scores based on Fortune 500 hiring data 2019-2024
- **Click-through UX:** "Click for full seasonal guide" opens modal
- **Data Sources Cited:** BLS, SHRM, CareerPlug (displayed in modal footer)

### 📍 Component Locations

- `src/components/tenure/pipeline/trends/components/PredictiveInsights.tsx` (main card)
- `src/components/tenure/pipeline/trends/components/SeasonalInsightsModal.tsx` (detail modal)
- `src/components/tenure/pipeline/trends/trends-benchmarks.ts` (static data)

### ❌ Current Limitations

- Generic scores (not industry-specific)
- No geographic adjustments
- No personalization based on user's application history
- No actionable scheduling/planning features
- Cards stack vertically, wasting horizontal real estate

---

## v2 Feature Roadmap

### Tier 1: High-Impact Features

#### 1. Industry-Specific Seasonal Patterns

Different industries have different hiring cycles:

- **Tech:** Relatively consistent year-round
- **Retail:** Peak pre-holiday (Sep-Nov)
- **Healthcare:** Q1 budget cycles
- **Education:** Spring hiring (Feb-Apr)
- **Finance:** Post-bonus season (Feb-Apr)

**Implementation:**

- Add `SEASONAL_BENCHMARKS.BY_INDUSTRY` with scores per industry/month
- User selects target industry in Prepare module or onboarding
- Dynamically adjust seasonal scores based on their industry
- Show "Your industry ([Industry]) peaks in [months]" messaging

**Data Sources:** BLS JOLTS by industry, LinkedIn Workforce Reports

#### 2. Geographic Seasonal Adjustments

Hiring patterns vary by region:

- **DC Metro:** Government fiscal year cycles (Oct start)
- **Tech Hubs (SF, Seattle, Austin):** More consistent
- **Seasonal Tourism Areas:** Inverse patterns

**Implementation:**

- Leverage existing `geographic-codes.ts` data
- Add metro-level seasonal modifiers
- Cross-reference user's location (from Prepare or geolocation)
- "In [Metro Area], hiring peaks [X weeks earlier/later] than national average"

#### 3. Predictive Application Scheduler

Turn insights into action with smart application timing:

- **Schedule Surge Mode:** Queue applications for optimal windows
- **Calendar Integration:** Show "green zones" for applications
- **Push Notifications:** "Hiring activity picking up next week—good time to apply"
- **Weekly/Monthly Targets:** Adjusted by seasonal score

#### 4. Seasonal Strategy Playbook

Different seasons require different tactics:

| Season                  | Strategy Focus                                 |
| ----------------------- | ---------------------------------------------- |
| Peak (Feb, Sep)         | Volume mode—maximize applications (15-20/week) |
| Good (Jan, Mar, Oct)    | Maintain optimal pace (10-15/week)             |
| Moderate (Apr-Jun, Nov) | Quality focus (8-12 tailored apps/week)        |
| Slow (Jul-Aug, Dec)     | Networking & skill-building (5-8 apps/week)    |

**Format:** Interactive checklists, not just text

#### 5. Historical Performance Overlay

Show user's own data against seasonal patterns:

- "Your response rate in February was 12% vs 4% in July"
- Visualize application volume/success by month
- "You historically perform best in [month]"
- Personalized recommendations based on their patterns

---

### Tier 2: Premium/Differentiating Features

#### 6. Real-Time Hiring Pulse

Live indicators beyond static seasonal scores:

- Job posting velocity (accelerating/decelerating this week?)
- LinkedIn/Indeed job posting trends (if API available)
- Layoff tracker integration (sector contracting warnings)
- "Market momentum" score updated weekly

#### 7. Company-Specific Hiring Cycles

Enterprise companies have predictable patterns tied to fiscal years:

- Database of major employers' fiscal year ends
- "Amazon typically opens headcount in Q1 (Jan-Mar)"
- "Banks hire heavily post-bonus season (Feb-Apr)"
- User can add target companies for personalized timing

#### 8. Counter-Cyclical Opportunity Finder

When everyone zigs, zag:

- **Low Competition Alerts:** Fewer applicants in slow seasons = better odds
- Industries/roles that buck seasonal trends
- "Stealth apply" strategy for December
- Contrarian timing recommendations with data backing

#### 9. Seasonal Salary Intelligence

Timing affects negotiation leverage:

- "Offers made in Q4 average 8% lower (budget constraints)"
- "Q1 hires have more negotiating room (fresh budgets)"
- Optimal timing for different salary brackets/levels
- "Delay your start date to [month] for better package"

#### 10. Hiring Manager Availability Predictor

Model when decision-makers are actually available:

- School vacation calendars (parents unavailable)
- Major holiday windows
- Conference seasons by industry
- "Best days/weeks to reach hiring managers this month"

---

### Tier 3: Engagement & Retention Features

#### 11. Seasonal Goals & Achievements

Gamify seasonal strategy:

- "February Champion": Apply to 20 jobs during peak season
- "Summer Networker": Complete 10 networking activities during slow season
- Monthly challenges aligned with optimal seasonal activities
- Streaks that account for seasonality (relaxed targets in slow months)

#### 12. Seasonal Notifications & Nudges

Proactive guidance throughout the year:

- "Peak season starts in 2 weeks—prepare your materials"
- "Slow season ahead—good time to update your resume"
- "Your industry hiring is accelerating this week"
- Weekly seasonal briefing (opt-in)

#### 13. Year-in-Review / Planning Mode

Annual planning feature:

- Full-year calendar view with personalized seasonal scores
- "Your optimal application windows for 2026"
- Goal setting aligned with seasonal patterns
- Export to calendar

---

## UI/UX Improvements

### Layout Redesign (PredictiveInsights Component)

**Problem:** Three cards stack vertically, wasting horizontal real estate.

**Current Layout (Grade: C):**

```
┌─────────────────────────────────────────────┐
│         Success Probability                 │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│         Time to Offer                       │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│         Seasonal Insight                    │
└─────────────────────────────────────────────┘
```

**Proposed Layout: 2/3 + 1/3 Asymmetric Grid (Grade: A):**

```
┌─────────────────────────────┬──────────────────┐
│                             │  Time to Offer   │
│    Success Probability      ├──────────────────┤
│    (Hero with large gauge)  │ Seasonal Insight │
│                             │                  │
└─────────────────────────────┴──────────────────┘
```

**Design Rubric Assessment:**

| Criterion     | Before | After | Improvement                                                      |
| ------------- | ------ | ----- | ---------------------------------------------------------------- |
| Layout & Grid | C      | A     | Uses proper 2-column grid with intentional asymmetry             |
| Hierarchy     | B      | A     | Success Probability clearly becomes the hero metric              |
| Redundancy    | C      | B     | Grouping Time + Seasonal visually connects "supporting insights" |
| Spacing       | B      | A     | Equal-height columns create visual balance                       |

**Responsive Behavior:**

- Desktop (>1024px): 2/3 + 1/3 layout
- Tablet (768-1024px): 1/2 + 1/2 layout
- Mobile (<768px): Stack vertically (current behavior)

---

## Implementation Plan

### Phase 1: Layout Redesign (3-5 days)

- [ ] Create new `PredictiveInsightsV2.tsx` component
- [ ] Implement responsive grid layout
- [ ] Add section header "Predictive Insights"
- [ ] Feature flag wrapper for A/B testing

### Phase 2: Industry-Specific Patterns (1 week)

- [ ] Extend `SEASONAL_BENCHMARKS` with `BY_INDUSTRY` data
- [ ] Add industry selector to Prepare module
- [ ] Create `getIndustrySeasonalScore(industry, month)` function
- [ ] Update SeasonalInsightsModal with industry dropdown

### Phase 3: Geographic Adjustments (3-5 days)

- [ ] Add metro-level seasonal modifiers to benchmarks
- [ ] Integrate with existing geolocation service
- [ ] Display location-adjusted recommendations
- [ ] Handle international users (graceful degradation)

### Phase 4: Historical Overlay (1 week)

- [ ] Aggregate user's application data by month
- [ ] Calculate personal response rates by season
- [ ] Create overlay visualization on seasonal chart
- [ ] Generate personalized insights ("You do best in X")

### Phase 5: Strategy Playbook (3-5 days)

- [ ] Create seasonal checklist content
- [ ] Build interactive checklist component
- [ ] Track completion for gamification
- [ ] Export/share capability

---

## Feature Flag Integration

### Feature Gate Definition

```typescript
// In src/lib/feature-gates.ts

export type V2Feature = 'laborMarket' | 'salaryBenchmark' | 'matches' | 'seasonalInsights'; // NEW

export function isSeasonalInsightsEnabled(): boolean {
  // Initially disabled in production
  // Enable via localStorage for testing: localStorage.setItem('v2_seasonalInsights', 'true')
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('v2_seasonalInsights');
    if (override === 'true') return true;
    if (override === 'false') return false;
  }

  // Default: disabled until v2 launch
  return false;
}
```

### Usage in Components

```tsx
// In TrendsTab or InsightsView
import { isSeasonalInsightsEnabled } from '@/lib/feature-gates';

const TrendsTab = () => {
  const useV2Layout = isSeasonalInsightsEnabled();

  return (
    <div>
      <TrendsHeroChart ... />

      {useV2Layout ? (
        <PredictiveInsightsV2 ... />
      ) : (
        <PredictiveInsights ... />
      )}
    </div>
  );
};
```

---

## Data Sources

### Primary Sources (Already Integrated)

- **Bureau of Labor Statistics (BLS):** National employment data, JOLTS
- **SHRM:** HR research and hiring trends
- **CareerPlug:** Application volume analysis (10M+ applications)

### Additional Sources for v2

- **LinkedIn Workforce Reports:** Industry-specific hiring trends
- **Indeed Hiring Lab:** Real-time job posting data
- **Glassdoor Economic Research:** Seasonal salary patterns
- **Conference calendars:** Industry-specific (CES, AWS re:Invent, etc.)

---

## Success Metrics (Post-Launch)

- [ ] Seasonal modal open rate increases 20%+
- [ ] Users with industry set: 40%+ of active users
- [ ] Application volume correlates with seasonal recommendations
- [ ] User feedback: "Seasonal insights helped me time my search" (survey)
- [ ] Reduced support questions about "when to apply"

---

## Related Documentation

- `/docs/tenure/features/v2/MARKET_COMPARISON.md` - Related BLS integration
- `/docs/tenure/features/v1/FEATURE_MANIFEST.md` - Shipped features
- `src/components/tenure/pipeline/trends/trends-benchmarks.ts` - Current implementation
- `src/lib/feature-gates.ts` - Feature flag system
