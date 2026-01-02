# Market Salary Comparison (v2)

## Status

**Deferred to MVP 2**  
**Feature Flag:** `V2_FLAGS.MARKET_COMPARISON = false`  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** O\*NET Web Services API, BLS API (registered)

---

## Overview

Compare user's salary history against Bureau of Labor Statistics (BLS) wage percentiles to provide data-driven compensation insights. Show where a user's salary falls relative to market averages for their occupation and geography.

---

## Current State (Implemented but Gated)

### ✅ Infrastructure Complete

- **Chart Overlay System:** Line chart component supports percentile band overlays
- **BLS API Integration:** Full service layer with caching (`services/bls.ts`)
- **Salary Benchmark Service:** Hybrid client/server API strategy with rate limiting
- **Rate Limiting:** 25 client-side calls/day per IP + 500 server-side calls/day shared pool
- **localStorage Caching:** 24-hour TTL for benchmark data
- **UI Toggle:** "Show Market Comparison" button exists in `YourWorthView`
- **Data Schema:** `MarketBenchmark` and `CompensationSnapshot` types defined

### ❌ Missing Components

- **SOC Code Association:** No UI to select/auto-detect SOC code on salary entries
- **Benchmark Fetching Trigger:** `getSalaryBenchmark()` never called
- **Market Data Population:** `getCompensationSnapshots()` always returns `undefined` for `marketData`
- **Geographic Filtering:** No state/metro area selection in salary entry forms

---

## Implementation Gap Analysis

### Problem

The market comparison toggle exists and the chart can render overlay lines, but the feature shows **no data** because:

1. **Salary entries don't capture `socCode`**
   - `SalaryEntry` schema has optional `socCode: string` field
   - Forms never ask user to select occupation code
   - Field always `undefined` when saved

2. **No trigger to fetch benchmarks**
   - `getSalaryBenchmark(socCode, areaCode)` exists but is never called
   - Store's `updateMarketBenchmark()` action unused
   - `benchmarks` object in `SalaryHistory` remains empty

3. **Snapshot generation can't find data**
   ```typescript
   // From store.ts getCompensationSnapshots():
   const benchmark = entry.socCode ? state.salaryHistory!.benchmarks[entry.socCode] : undefined;
   ```
   Since `entry.socCode` is always undefined, benchmark lookup fails.

---

## v2 Implementation Plan

### Phase 1: SOC Code Mapping (1 week)

**Goal:** Enable users to associate job titles with Standard Occupational Classification codes

#### 1.1 Job Title → SOC Crosswalk

- Integrate O\*NET Web Services API
- Create `services/onet-crosswalk.ts` with title search
- Implement fuzzy matching for job titles (e.g., "Software Engineer" → SOC 15-1252)
- Cache common title mappings in localStorage

**Files to Modify:**

- `src/services/onet.ts` (extend existing O\*NET integration)
- Create `src/data/soc-crosswalk.ts` (offline fallback for common titles)

#### 1.2 Salary Entry Form Updates

- Add SOC code autocomplete field to `YearlyEntryForm`
- Add SOC code autocomplete to `RangeEntryForm`
- Display occupation title when code selected
- Validate SOC code format (XX-XXXX)

**Files to Modify:**

- `src/components/tenure/prosper/components/YourWorthView.tsx`
  - Add `<SocCodeSelector />` component
  - Auto-populate from job title if possible

#### 1.3 Resume Position Integration

- Suggest SOC code based on linked resume position
- Use job title from master resume if available
- Pre-fill dropdown with likely matches

**Files to Modify:**

- `src/components/tenure/prosper/components/YourWorthView.tsx`
- `src/components/tenure/prepare/store.ts` (read position data)

---

### Phase 2: Benchmark Fetching (3-5 days)

**Goal:** Automatically fetch and cache BLS data when user saves salary entry

#### 2.1 Fetch Trigger on Save

- Call `getSalaryBenchmark(socCode)` after salary entry creation
- Store result via `prosperStore.updateMarketBenchmark(socCode, benchmark)`
- Show loading state during fetch
- Handle errors gracefully (fallback to no comparison)

**Logic:**

```typescript
// In YearlyEntryForm onSubmit:
if (socCode) {
  const benchmarkResult = await getSalaryBenchmark(socCode, areaCode);
  if (benchmarkResult.success && benchmarkResult.data) {
    prosperStore.updateMarketBenchmark(socCode, benchmarkResult.data);
  }
}
```

#### 2.2 Background Prefetch (Optional)

- Prefetch benchmarks for all resume positions on app load
- Warm cache proactively
- Respect rate limits (don't exceed 25/day)

---

### Phase 3: Geographic Filtering (3 days)

**Goal:** Allow state/metro-level wage comparisons

#### 3.1 Add Location to Salary Entries

- Optional state dropdown (50 US states)
- Optional MSA dropdown (top 50 metro areas)
- Store `areaCode` on `SalaryEntry`

**Schema Update:**

```typescript
interface SalaryEntry {
  ...
  stateCode?: string;      // e.g., "CA"
  msaKey?: string;         // e.g., "SF-metro"
  areaCode?: string;       // BLS area code (e.g., "S0600000" for CA)
}
```

#### 3.2 Area-Specific Benchmark Fetch

- Pass `areaCode` to `getSalaryBenchmark(socCode, areaCode)`
- Cache per-area benchmarks separately
- Show both national and local comparison in chart

---

### Phase 4: UI Enhancements (2 days)

#### 4.1 Chart Overlay Lines

- Render 25th, 50th (median), 75th percentile bands
- Color-code: 10th-25th (red), 25th-median (yellow), median-75th (green), 75th-90th (blue)
- Show user's percentile position on hover

#### 4.2 Percentile Badge

- Display user's salary percentile (e.g., "68th percentile")
- Color-code: <25th (red), 25-50 (yellow), 50-75 (green), >75 (blue)

#### 4.3 Comparison Toggle State

- Persist toggle state in store
- Default to OFF (user opts in)
- Show info tooltip explaining data source

---

## Feature Flag Removal Checklist

Before setting `V2_FLAGS.MARKET_COMPARISON = true`:

- [ ] SOC code selector integrated in salary forms
- [ ] Benchmark fetching working on entry save
- [ ] Chart overlays rendering correctly with real data
- [ ] Rate limiting respected (no quota exhaustion)
- [ ] Error handling tested (API down, invalid SOC, etc.)
- [ ] Geographic filtering functional (state/MSA)
- [ ] User documentation written (how to interpret percentiles)
- [ ] BLS data attribution displayed (legal requirement)
- [ ] Offline mode graceful degradation

---

## Data Sources

### Bureau of Labor Statistics (BLS)

- **Endpoint:** Occupational Employment Statistics (OES)
- **Coverage:** 800+ SOC occupations, national + state + metro
- **Update Frequency:** Annual (May release)
- **Free Tier:** 25 requests/day unregistered, 500/day registered
- **Attribution Required:** Yes ("Data from U.S. Bureau of Labor Statistics")

### O\*NET Web Services

- **Purpose:** Job title → SOC code mapping
- **Coverage:** 1,000+ occupations
- **Free Tier:** Unlimited (with registration)
- **Integration:** Already used in Discover module

---

## Alternative Approaches Considered

### 1. **Static SOC Code List** (Rejected)

- Pro: No O\*NET API dependency
- Con: Poor UX (800+ dropdown), no fuzzy search
- **Decision:** Use O\*NET autocomplete instead

### 2. **OpenAI Job Title Classification** (Rejected)

- Pro: High accuracy with GPT-4
- Con: API costs, latency, privacy concerns
- **Decision:** Use O\*NET (free, privacy-first)

### 3. **Manual SOC Entry** (Fallback Plan)

- Allow advanced users to enter SOC codes directly
- Show "Find my SOC code" link to BLS search page
- Use as fallback if O\*NET crosswalk fails

---

## Open Questions

1. **Should we show historical BLS data (multi-year)?**
   - Currently only fetch latest year
   - Could show how market median changed over time
   - Requires multiple API calls per occupation

2. **Cost of Living Adjustment?**
   - BLS data is nominal (not COL-adjusted)
   - Could integrate Census cost-of-living index
   - Deferred to v3 (adds complexity)

3. **International Users?**
   - BLS is US-only
   - Could add Eurostat for EU users
   - Feature gate by geolocation already exists

---

## Success Metrics (Post-Launch)

- [ ] 50%+ of salary entries have SOC code associated
- [ ] Market comparison toggle enabled by 30%+ of users
- [ ] <1% API rate limit errors
- [ ] Average cache hit rate >80% (reduces API load)
- [ ] User feedback: "Helps me understand my compensation" (survey)

---

## Related Documentation

- `/docs/tenure/features/v1/FEATURE_MANIFEST.md` - Shipped features
- `/docs/tenure/features/BLS_API_FIX_SUMMARY.md` - BLS integration history
- `src/services/bls.ts` - BLS service implementation
- `src/components/tenure/prosper/services/salary-benchmark.service.ts` - Benchmark service
