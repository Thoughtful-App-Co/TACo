# Tenure Routing Implementation Summary

**Date:** December 29, 2025  
**Issue:** Navigation state loss on page refresh  
**Solution:** URL-based routing with user-configurable defaults

---

## Problem Statement

When refreshing the page on any Tenure view (e.g., on the Insights > Trends tab), the app would reset to default views because:

1. **Section state was component-local** - `Pipeline` had a `createSignal('pipeline')` for active section
2. **Tab state was component-local** - `Insights` had a `createSignal('flow')` for active tab
3. **URL didn't reflect nested views** - All views shared `/tenure/prospect` URL

This meant **browser refresh = state loss**, and **URLs couldn't be bookmarked or shared**.

---

## Solution Overview

Implemented **URL-based routing** where:

- Every view and sub-view has a **unique URL**
- Active sections/tabs are **derived from the URL** (not stored in state)
- Users can configure **default landing locations** in Settings
- **Refresh preserves state** and **URLs are shareable**

---

## Changes Made

### 1. Schema Updates

**File:** `src/schemas/pipeline.schema.ts`

Added two new optional settings to `PipelineSettings`:

```typescript
export interface PipelineSettings {
  // ... existing fields ...

  // Default Prospect section (for /tenure/prospect route)
  defaultProspectSection?: 'dashboard' | 'pipeline' | 'insights' | 'settings';

  // Default Insights tab (for /tenure/prospect/insights route)
  defaultInsightsTab?: 'flow' | 'analytics' | 'trends';
}
```

### 2. Routing Infrastructure

**File:** `src/index.tsx`

**No changes required.** The existing wildcard route structure already handles all Tenure routes:

```typescript
<Router root={App}>
  <Route path="/" component={LandingPage} />
  <Route path="/pricing" component={PricingPage} />
  {/* All app routes - handles /tenure/* and all sub-paths */}
  <Route path="/:appId/*" component={AppPage} />
</Router>
```

The wildcard `/*` captures all sub-paths like `/tenure/prospect/insights/flow`.

### 3. PipelineView (Prospect)

**File:** `src/components/tenure/pipeline/components/PipelineView.tsx`

**Before:**

```typescript
const [activeSection, setActiveSection] = createSignal<ProspectSection>('pipeline');
```

**After:**

```typescript
const activeSection = createMemo((): ProspectSection => {
  const path = location.pathname;
  const match = path.match(/\/tenure\/prospect\/([^/]+)/);

  if (match) {
    const section = match[1] as ProspectSection;
    if (['dashboard', 'pipeline', 'insights', 'settings'].includes(section)) {
      return section;
    }
  }

  return pipelineStore.state.settings.defaultProspectSection || 'pipeline';
});
```

**Key Changes:**

- ✅ Replaced `createSignal` with `createMemo` that reads from URL
- ✅ Added redirect logic: `/tenure/prospect` → `/tenure/prospect/pipeline` (or user default)
- ✅ Section change triggers navigation: `navigate(\`/tenure/prospect/${section}\`)`

### 4. InsightsView

**File:** `src/components/tenure/pipeline/components/InsightsView.tsx`

**Before:**

```typescript
const [activeTab, setActiveTab] = createSignal<InsightsTab>('flow');
```

**After:**

```typescript
const activeTab = createMemo((): InsightsTab => {
  const path = location.pathname;
  const match = path.match(/\/tenure\/prospect\/insights\/([^/]+)/);

  if (match) {
    const tab = match[1] as InsightsTab;
    if (['flow', 'analytics', 'trends'].includes(tab)) {
      return tab;
    }
  }

  return pipelineStore.state.settings.defaultInsightsTab || 'flow';
});
```

**Key Changes:**

- ✅ Replaced `createSignal` with `createMemo` that reads from URL
- ✅ Added redirect logic: `/tenure/prospect/insights` → `/tenure/prospect/insights/flow` (or user default)
- ✅ Tab clicks navigate to full URLs: `navigate(\`/tenure/prospect/insights/${tab}\`)`
- ✅ Keyboard navigation uses `navigate()` instead of `setActiveTab()`

### 5. ProspectSidebar

**File:** `src/components/tenure/pipeline/components/ProspectSidebar.tsx`

**Before:**

```typescript
<button onClick={() => handleNavClick(item.id)}>
  {item.label}
</button>
```

**After:**

```typescript
<A href={`/tenure/prospect/${item.id}`}>
  {item.label}
</A>
```

**Key Changes:**

- ✅ Replaced `<button>` with `<A>` (SolidJS Router link component)
- ✅ Removed `onSectionChange` callback (now navigates via href)
- ✅ Removed `handleNavClick` function (no longer needed)

### 6. Settings UI

**File:** `src/components/tenure/pipeline/components/SyncSettings.tsx`

Added two new settings cards:

1. **Default Prospect Section** - Choose dashboard, pipeline, insights, or settings
2. **Default Insights Tab** - Choose flow, analytics, or trends

Both follow the same pattern as the existing "Default Landing Tab" setting.

### 7. TenureApp

**File:** `src/components/tenure/TenureApp.tsx`

**Minor Update:**

```typescript
// Updated regex to handle sub-paths correctly
const match = path.match(/^\/tenure\/([^/]+)/); // Matches first segment only
```

This ensures `/tenure/prospect/pipeline` correctly identifies `prospect` as the feature ID.

---

## URL Structure (Final)

```
/tenure                                  → Redirects to user's default tab
/tenure/discover                         → Discover (RIASEC assessment)
/tenure/prepare                          → Prepare (Resume tools)
/tenure/prospect                         → Redirects to user's default Prospect section
/tenure/prospect/dashboard               → Prospect > Dashboard
/tenure/prospect/pipeline                → Prospect > Pipeline (Kanban)
/tenure/prospect/insights                → Redirects to user's default Insights tab
/tenure/prospect/insights/flow           → Insights > Flow (Sankey)
/tenure/prospect/insights/analytics      → Insights > Analytics (Metrics)
/tenure/prospect/insights/trends         → Insights > Trends (Time series)
/tenure/prospect/settings                → Prospect > Settings
/tenure/prosper                          → Prosper (Career journal)
/tenure/matches                          → Matches (Job matches)
```

---

## Testing

All navigation flows have been verified:

✅ Direct URL navigation works (e.g., typing `/tenure/prospect/insights/trends`)  
✅ Refresh preserves exact location  
✅ Browser back/forward buttons work correctly  
✅ Tab/section clicks update URL  
✅ Default redirects work (`/tenure/prospect` → `/tenure/prospect/pipeline`)  
✅ User-configured defaults are respected  
✅ Settings UI allows changing defaults  
✅ Deep links are shareable

---

## Migration Notes

### For Users

**No action required.** Old bookmarks will redirect to new URLs automatically.

Example:

- Old: `/tenure/prospect` (would reset on refresh)
- New: `/tenure/prospect/pipeline` (persists on refresh)

Users can configure their preferred defaults in **Prospect > Settings**.

### For Developers

**Breaking change:** Components no longer manage section/tab state locally.

If you're adding a new view with sub-sections:

1. **No routing changes needed** - The wildcard `/:appId/*` handles all paths
2. Use `createMemo()` to derive active subsection from URL:
   ```typescript
   const activeSubsection = createMemo(() => {
     const match = location.pathname.match(/\/tenure\/newview\/([^/]+)/);
     return match ? match[1] : 'default';
   });
   ```
3. Navigate via `<A href={...}>` or `navigate()`:
   ```typescript
   <A href="/tenure/newview/subsection">Go to Subsection</A>
   ```
4. Add default setting to schema (optional)
5. Add UI for default setting in SyncSettings (optional)

---

## Future Enhancements

Potential improvements for the future:

1. **Lazy loading** - Load route components on demand
2. **Route guards** - Protect routes that require profile setup
3. **Route metadata** - Add page titles and meta tags per route
4. **Breadcrumbs** - Auto-generate breadcrumb navigation from URL
5. **Route transitions** - Animate between views
6. **Deep sub-routes** - Add more nesting levels if needed (e.g., `/insights/trends/seasonal`)

---

## Performance Impact

**Positive:**

- ✅ `createMemo()` only recomputes when URL changes (not on every render)
- ✅ No unnecessary re-renders from local state updates
- ✅ Browser history properly tracked (better UX)

**Neutral:**

- No impact on bundle size
- No impact on initial load time
- Routing logic is minimal and fast

---

## Documentation

Full documentation available at:

- `/docs/tenure/navigation/ROUTING_SYSTEM.md` - Complete routing guide
- This file - Implementation summary

---

## Credits

**Implemented by:** Thoughtful App Co.  
**Date:** December 29, 2025  
**Approach:** URL-based routing with user-configurable defaults  
**Methodology:** Incremental refactor without component extraction

---

## Questions?

If you have questions about this implementation:

1. Read `/docs/tenure/navigation/ROUTING_SYSTEM.md`
2. Check the "Troubleshooting" section in that doc
3. Review code comments in modified files
4. File an issue on GitHub

---

**Status:** ✅ Complete and production-ready
