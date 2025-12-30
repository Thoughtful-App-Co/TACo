# Tenure Routing System

## Overview

The Tenure app implements a **URL-based routing system** that provides persistent navigation across all views and sub-views. This means refreshing the page or sharing a link will maintain your exact location within the app.

**Date Implemented:** December 29, 2025  
**Related Issue:** Navigation state loss on refresh

---

## URL Structure

### Top-Level Routes

| URL                | View        | Description                                                        |
| ------------------ | ----------- | ------------------------------------------------------------------ |
| `/tenure`          | → Redirects | Redirects to user's default landing tab (configurable in Settings) |
| `/tenure/discover` | Discover    | RIASEC assessment and career recommendations                       |
| `/tenure/prepare`  | Prepare     | Resume builder and mutation tools                                  |
| `/tenure/prospect` | → Redirects | Redirects to default Prospect section (configurable in Settings)   |
| `/tenure/prosper`  | Prosper     | Career journal (coming soon)                                       |
| `/tenure/matches`  | Matches     | Job matches based on RIASEC scores                                 |

### Prospect Sub-Routes

Within the Prospect tool, there are **four main sections**:

| URL                          | Section     | Description                                                  |
| ---------------------------- | ----------- | ------------------------------------------------------------ |
| `/tenure/prospect/dashboard` | Dashboard   | Stats and recent activity overview                           |
| `/tenure/prospect/pipeline`  | Pipeline    | Kanban board and list views of job applications              |
| `/tenure/prospect/insights`  | → Redirects | Redirects to default Insights tab (configurable in Settings) |
| `/tenure/prospect/settings`  | Settings    | Sync, API config, and preferences                            |

### Insights Sub-Routes

Within the Insights section, there are **three tabs**:

| URL                                   | Tab       | Description                             |
| ------------------------------------- | --------- | --------------------------------------- |
| `/tenure/prospect/insights/flow`      | Flow      | Sankey diagram of pipeline flow         |
| `/tenure/prospect/insights/analytics` | Analytics | Conversion metrics and funnel analysis  |
| `/tenure/prospect/insights/trends`    | Trends    | Activity trends and predictive insights |

---

## Default Redirects

When navigating to a route without specifying a sub-route, the system redirects to user-configured defaults (or fallback defaults):

### /tenure (Root)

- **User Setting:** `settings.defaultLandingTab`
- **Options:** `discover` | `prepare` | `prospect` | `prosper`
- **Default:** `discover`
- **Example:** User sets default to `prospect` → `/tenure` redirects to `/tenure/prospect`

### /tenure/prospect

- **User Setting:** `settings.defaultProspectSection`
- **Options:** `dashboard` | `pipeline` | `insights` | `settings`
- **Default:** `pipeline`
- **Example:** User sets default to `dashboard` → `/tenure/prospect` redirects to `/tenure/prospect/dashboard`

### /tenure/prospect/insights

- **User Setting:** `settings.defaultInsightsTab`
- **Options:** `flow` | `analytics` | `trends`
- **Default:** `flow`
- **Example:** User sets default to `trends` → `/tenure/prospect/insights` redirects to `/tenure/prospect/insights/trends`

---

## How It Works

### Implementation Details

1. **URL Parsing**
   - Each view reads the current URL path using `useLocation()` from `@solidjs/router`
   - Path segments are parsed to determine active tab/section
   - Invalid paths fall back to configured defaults

2. **Navigation**
   - All navigation uses `navigate()` or `<A href={...}>` components
   - Tab clicks navigate to full URL paths (e.g., `/tenure/prospect/pipeline`)
   - Browser back/forward buttons work correctly

3. **State Management**
   - **No local state** for active tabs/sections
   - Active tab is derived from URL (via `createMemo()`)
   - Changes to URL automatically update active tab

### Example: PipelineView

```typescript
// Read section from URL
const activeSection = createMemo((): ProspectSection => {
  const path = location.pathname;
  const match = path.match(/\/tenure\/prospect\/([^/]+)/);

  if (match) {
    const section = match[1] as ProspectSection;
    if (['dashboard', 'pipeline', 'insights', 'settings'].includes(section)) {
      return section;
    }
  }

  // Fall back to user's configured default
  return pipelineStore.state.settings.defaultProspectSection || 'pipeline';
});

// Navigate via URL
<A href="/tenure/prospect/pipeline">Pipeline</A>
```

---

## User Configuration

Users can configure their default landing locations in **Prospect > Settings**:

### Default Landing Tab

Choose which tab appears when navigating to `/tenure`:

- **Discover** - RIASEC assessment
- **Prepare** - Resume tools
- **Prospect** - Job pipeline
- **Prosper** - Career journal

### Default Prospect Section

Choose which section appears when navigating to `/tenure/prospect`:

- **Dashboard** - Overview and stats
- **Pipeline** - Kanban board
- **Insights** - Analytics and trends
- **Settings** - Configuration

### Default Insights Tab

Choose which tab appears when navigating to `/tenure/prospect/insights`:

- **Flow** - Sankey diagram
- **Analytics** - Conversion metrics
- **Trends** - Activity over time

---

## Benefits

✅ **Persistent State** - Refreshing the page maintains your exact location  
✅ **Deep Linking** - Share URLs to specific views (e.g., `/tenure/prospect/insights/trends`)  
✅ **Browser History** - Back/forward buttons work correctly through all nested views  
✅ **User Control** - Configure default landing locations in Settings  
✅ **Bookmarkable** - Save URLs to frequently accessed views  
✅ **SEO Friendly** - Each view has a unique, meaningful URL

---

## Breaking Changes

⚠️ **Old bookmarks may redirect** - URLs like `/tenure/prospect` now redirect to `/tenure/prospect/pipeline` (or user's configured default)

⚠️ **State moved from component to URL** - Section/tab state is no longer stored in component signals, it's derived from the URL

---

## Future Extensibility

This routing structure is designed to be easily extensible:

### Adding Sub-Routes to Other Tabs

Want to add sub-views to **Discover** or **Prepare**? Simply:

1. **No route changes needed** - The existing `/:appId/*` wildcard handles all paths

2. Update the view component to read from URL:

   ```typescript
   const activeSubView = createMemo(() => {
     const match = location.pathname.match(/\/tenure\/discover\/(\w+)/);
     return match ? match[1] : 'assessment';
   });
   ```

3. Add navigation links:

   ```tsx
   <A href="/tenure/discover/results">View Results</A>
   ```

4. (Optional) Add redirect logic for base route:

   ```typescript
   createEffect(() => {
     if (location.pathname === '/tenure/discover') {
       navigate('/tenure/discover/assessment', { replace: true });
     }
   });
   ```

5. Update the view component to read from URL:

   ```typescript
   const activeSubView = createMemo(() => {
     const match = location.pathname.match(/\/discover\/(\w+)/);
     return match ? match[1] : 'assessment';
   });
   ```

6. Add navigation links:
   ```tsx
   <A href="/tenure/discover/results">View Results</A>
   ```

### Adding Deeper Nesting

Want to add sub-routes within Insights tabs? Follow the same pattern:

```
/tenure/prospect/insights/trends/seasonal
/tenure/prospect/insights/trends/weekly
```

---

## Schema Changes

### PipelineSettings Interface

```typescript
export interface PipelineSettings {
  // ... existing fields ...

  // Default landing tab for /tenure route
  defaultLandingTab: 'discover' | 'prepare' | 'prospect' | 'prosper';

  // Default Prospect section (for /tenure/prospect route)
  defaultProspectSection?: 'dashboard' | 'pipeline' | 'insights' | 'settings';

  // Default Insights tab (for /tenure/prospect/insights route)
  defaultInsightsTab?: 'flow' | 'analytics' | 'trends';
}
```

---

## Files Modified

### Core Routing

- `src/index.tsx` - Added tenure-specific routing structure
- `src/App.tsx` - No changes (still uses wildcard for non-tenure apps)

### Tenure App

- `src/components/tenure/TenureApp.tsx` - Already URL-based, updated path matching
- `src/components/tenure/pipeline/components/PipelineView.tsx` - Replaced state with URL parsing
- `src/components/tenure/pipeline/components/InsightsView.tsx` - Replaced state with URL parsing
- `src/components/tenure/pipeline/components/ProspectSidebar.tsx` - Changed buttons to `<A>` links

### Settings

- `src/schemas/pipeline.schema.ts` - Added `defaultProspectSection` and `defaultInsightsTab`
- `src/components/tenure/pipeline/components/SyncSettings.tsx` - Added UI controls for new defaults

---

## Testing Checklist

Test these scenarios to verify the routing works correctly:

- [ ] Navigate to `/tenure` → Redirects to your default landing tab
- [ ] Navigate to `/tenure/prospect` → Redirects to your default Prospect section
- [ ] Navigate to `/tenure/prospect/insights` → Redirects to your default Insights tab
- [ ] Click through all tabs and sections → URL updates correctly
- [ ] Refresh on any deep route (e.g., `/tenure/prospect/insights/trends`) → Stays on that view
- [ ] Use browser back/forward buttons → Navigation works correctly
- [ ] Change default settings → New defaults take effect on next navigation
- [ ] Share a deep link URL → Recipient lands on correct view

---

## Troubleshooting

### "I refreshed and landed on a different view"

Check your default settings in **Prospect > Settings**. The app redirects base routes (like `/tenure/prospect`) to your configured defaults.

### "My bookmarked URL doesn't work"

Old bookmarks to `/tenure/prospect` will now redirect to `/tenure/prospect/pipeline` (or your configured default). Update your bookmarks to point to specific sections.

### "The URL doesn't update when I navigate"

This is a bug. All navigation should update the URL. Check the browser console for errors and file an issue.

---

## Implementation Notes

### Why Not Use Nested `<Route>` Components?

We considered using SolidJS Router's nested `<Route>` and `<Outlet>` pattern, but opted for a simpler approach:

- **Less complex** - No need to extract views into separate route components
- **Flexible** - Easier to add conditional rendering within views
- **Migration path** - Minimal changes to existing component structure
- **Same result** - URL-based navigation works identically

If we need more complex routing in the future (e.g., route guards, lazy loading), we can refactor to use nested routes.

### Performance Considerations

- `createMemo()` ensures active tab/section is only recomputed when URL changes
- Navigation uses `replace: true` for redirects to avoid polluting browser history
- No unnecessary re-renders when URL doesn't match current view

---

## Support

For issues or questions about routing:

1. Check this documentation first
2. Review the "Troubleshooting" section above
3. File an issue on GitHub with:
   - Current URL
   - Expected behavior
   - Actual behavior
   - Steps to reproduce

---

**Last Updated:** December 29, 2025  
**Version:** 1.0.0  
**Maintainer:** Thoughtful App Co.
