# Labor Market Widget Testing Guide

This guide provides comprehensive instructions for testing the Labor Market Widget functionality, including API integration, error handling, caching behavior, and debug features.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Enable Debug Mode](#2-enable-debug-mode)
3. [Test Cases](#3-test-cases)
4. [Console Commands for Testing](#4-console-commands-for-testing)
5. [Network Tab Inspection](#5-network-tab-inspection)
6. [Troubleshooting](#6-troubleshooting)
7. [Expected Debug Panel Output](#7-expected-debug-panel-output)

---

## 1. Prerequisites

Before testing the Labor Market Widget, ensure you have the following set up correctly.

### Get a BLS API Key

1. Visit the BLS Registration page: <https://data.bls.gov/registrationEngine/>
2. Fill out the registration form with your email and organization details
3. Submit the form and check your email for the API key
4. Save the API key securely - you'll need it for local development

> **Note**: The free tier allows 500 requests per day. For production use, consider requesting a higher limit.

### Set Up `.dev.vars` File

1. Copy the example file:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Edit `.dev.vars` and add your BLS API key:

   ```
   BLS_API_KEY=your_api_key_here
   ```

3. Ensure the file is in your project root directory (same level as `wrangler.toml`)

> **Important**: Never commit `.dev.vars` to version control. It should already be in `.gitignore`.

### Start the Dev Server with Wrangler

The Labor Market Widget requires Cloudflare Workers functions to run. Use wrangler to start the dev server:

```bash
# Install dependencies if you haven't already
pnpm install

# Start the dev server with wrangler
pnpm dev
```

Or if you need to start wrangler directly:

```bash
npx wrangler pages dev dist --compatibility-date=2024-01-01
```

> **Note**: The server must be restarted after any changes to `.dev.vars`.

---

## 2. Enable Debug Mode

Debug mode provides detailed information about API calls, cache behavior, and timing in the Labor Market Widget.

### Enable Debug Mode

Open your browser's Developer Console (F12 or Cmd+Opt+I) and run:

```javascript
localStorage.setItem('taco_debug_labor_market', 'true');
```

Then refresh the page. You should see a debug panel appear in the Labor Market Widget.

### Disable Debug Mode

To disable debug mode:

```javascript
localStorage.removeItem('taco_debug_labor_market');
```

Or set it to false:

```javascript
localStorage.setItem('taco_debug_labor_market', 'false');
```

Refresh the page to apply changes.

---

## 3. Test Cases

### Test 1: No API Key Configured

**Purpose**: Verify error handling when `BLS_API_KEY` is missing from environment variables.

**Steps**:

1. Remove or comment out `BLS_API_KEY` from `.dev.vars`:
   ```
   # BLS_API_KEY=your_api_key_here
   ```
2. Restart the dev server (required for env changes to take effect)
3. Navigate to the Dashboard page
4. Look for the Labor Market Widget

**Expected Result**:

- Error banner should display with message: "API key not configured"
- Banner should include setup instructions or link to documentation
- No data sections should be visible
- Debug panel (if enabled) should show error status

---

### Test 2: Valid API Key - Market Snapshot

**Purpose**: Verify the market snapshot section loads correctly with valid API credentials.

**Steps**:

1. Ensure `BLS_API_KEY` is properly set in `.dev.vars`
2. Restart the dev server
3. Navigate to the Dashboard page
4. Locate the Market Snapshot section in the Labor Market Widget

**Expected Result**:

- Market Snapshot section displays with data cards
- Cards should show:
  - **Unemployment Rate** (percentage)
  - **Job Openings** (number in millions)
  - **Inflation Rate** (CPI percentage)
  - **Total Employed** (number in millions)
- Data should have recent dates (within last 1-2 months)
- Debug panel should show:
  - `Status: success`
  - Timing information (e.g., `Time: 1,234ms`)
  - Cache status (`Cache: hit` or `Cache: miss`)

---

### Test 3: Rate Limit Handling

**Purpose**: Verify rate limit error handling and header inspection.

**Steps**:

1. This is difficult to test naturally (BLS allows 500 requests/day on free tier)
2. Alternative approach - inspect rate limit headers:
   - Open DevTools → Network tab
   - Filter by `/api/labor-market`
   - Make a request by loading or refreshing the widget
   - Click on the request and examine Response Headers

**Expected Result**:

- Response headers should include:
  - `X-RateLimit-Remaining`: Number of requests left
  - `X-RateLimit-Limit`: Maximum requests allowed
- If rate limited (429 status):
  - Error banner should display "Rate limit exceeded"
  - Retry button should be available
  - Message should indicate when to retry

---

### Test 4: Network Error Handling

**Purpose**: Verify the widget handles network failures gracefully.

**Steps**:

1. Load the Dashboard with the widget functioning normally
2. Open DevTools → Network tab
3. Click the "No throttling" dropdown and select **Offline**
4. Click the Refresh button in the widget footer (or refresh the page)
5. Observe the error state
6. Switch back to "Online" (or "No throttling")
7. Click the Retry button that should appear

**Expected Result**:

- When offline:
  - Network error banner should display
  - Message should indicate connection issue
  - Retry button should be visible
- When back online:
  - Clicking Retry should successfully load data
  - Error banner should disappear
  - Fresh data should display

---

### Test 5: Target Occupations Section

**Purpose**: Verify occupation data loads correctly based on user profile.

**Steps**:

**Part A - Without Occupations:**

1. Ensure your profile has no target occupations set
2. Navigate to the Dashboard
3. Look for the Target Occupations section

**Expected Result (Part A)**:

- Info message should display (e.g., "Add target occupations to see salary data")
- No occupation cards should be visible

**Part B - With Occupations:**

1. Go to your Profile settings
2. Add a target occupation using a valid SOC code (e.g., `15-1252` for Software Developers)
3. Save the profile changes
4. Navigate back to the Dashboard (or refresh)

**Expected Result (Part B)**:

- Occupation cards should display for each target occupation
- Each card should show:
  - Occupation title
  - Median annual salary
  - Employment outlook (growth percentage)
  - Job openings count
- Debug panel should show occupation data status

---

### Test 6: Regional Insights Section

**Purpose**: Verify regional wage comparisons display with location preferences.

**Steps**:

**Part A - Without Location Preferences:**

1. Ensure your profile has no location preferences set
2. Navigate to the Dashboard
3. Look for the Regional Insights section

**Expected Result (Part A)**:

- Info message should display (e.g., "Set location preferences to see regional data")
- No regional comparison data should be visible

**Part B - With Location Preferences:**

1. Go to your Profile settings
2. Set your current state (e.g., "California")
3. Add target states (e.g., "Texas", "Washington", "New York")
4. Save the profile changes
5. Navigate back to the Dashboard (or refresh)

**Expected Result (Part B)**:

- Regional comparison table/cards should display
- Data should show wage comparisons across selected regions
- Cost of living adjustments may be shown (if implemented)
- Debug panel should show regional data status

---

### Test 7: Cache Behavior

**Purpose**: Verify the 24-hour caching mechanism works correctly.

**Steps**:

**Part A - Initial Load:**

1. Clear existing cache (see console commands below)
2. Enable debug mode
3. Load the Dashboard
4. Note the timing in the debug panel

**Part B - Cached Load:**

1. Refresh the page (or navigate away and back)
2. Check the debug panel

**Expected Result (Part B)**:

- Debug panel should show `Cache: hit`
- Response time should be significantly faster
- Data should be identical to previous load

**Part C - Cache Clear:**

1. Run in console:
   ```javascript
   localStorage.removeItem('bls_cache_snapshot_labor_market');
   ```
2. Refresh the page
3. Check the debug panel

**Expected Result (Part C)**:

- Debug panel should show `Cache: miss`
- Fresh API call should be made
- Response time should be longer (network request)

---

### Test 8: Refresh Button

**Purpose**: Verify manual refresh clears cache and fetches fresh data.

**Steps**:

1. Load the Dashboard and wait for data to load (ensuring cache is populated)
2. Enable debug mode if not already enabled
3. Note the cache status in debug panel (should be `hit` on subsequent loads)
4. Click the "Refresh" button in the widget footer

**Expected Result**:

- Loading spinner should appear
- Cache should be cleared
- Fresh data should be fetched from BLS API
- Debug panel should show `Cache: miss` after refresh
- Updated timing information should display
- Data should refresh with latest values

---

## 4. Console Commands for Testing

Copy and paste these commands in your browser's Developer Console for testing and debugging.

### Debug Mode Controls

```javascript
// Enable debug mode
localStorage.setItem('taco_debug_labor_market', 'true');

// Disable debug mode
localStorage.removeItem('taco_debug_labor_market');

// Check if debug mode is enabled
console.log('Debug mode:', localStorage.getItem('taco_debug_labor_market') === 'true');
```

### Cache Management

```javascript
// Clear all BLS cache entries
Object.keys(localStorage)
  .filter((k) => k.startsWith('bls_cache'))
  .forEach((k) => {
    console.log('Removing:', k);
    localStorage.removeItem(k);
  });

// List all current cache entries
console.log(
  'Current BLS cache entries:',
  Object.keys(localStorage).filter((k) => k.startsWith('bls_cache'))
);

// Inspect a specific cache entry
const cacheKey = 'bls_cache_snapshot_labor_market';
const cached = localStorage.getItem(cacheKey);
if (cached) {
  console.log('Cache contents:', JSON.parse(cached));
} else {
  console.log('No cache found for:', cacheKey);
}
```

### Manual API Testing

```javascript
// Test the labor market API endpoint directly
fetch('/api/labor-market', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seriesid: ['LNS14000000'], // National unemployment rate
    startyear: '2023',
    endyear: '2024',
  }),
})
  .then((response) => {
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then((data) => console.log('Response:', data))
  .catch((error) => console.error('Error:', error));

// Test multiple series at once
fetch('/api/labor-market', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seriesid: [
      'LNS14000000', // Unemployment rate
      'JTS000000000000000JOL', // Job openings
      'CUUR0000SA0', // CPI (inflation)
    ],
    startyear: '2023',
    endyear: '2024',
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

### Utility Commands

```javascript
// Force a complete widget refresh (simulates user clicking refresh)
window.dispatchEvent(new CustomEvent('labor-market-refresh'));

// Check localStorage usage
const used = new Blob(Object.values(localStorage)).size;
console.log(`LocalStorage used: ${(used / 1024).toFixed(2)} KB`);
```

---

## 5. Network Tab Inspection

Use your browser's DevTools Network tab to inspect API calls and responses.

### How to Access

1. Open DevTools (F12 or Cmd+Opt+I)
2. Click the **Network** tab
3. Filter by "labor-market" to see only relevant requests

### Request: POST /api/labor-market

**What to check in the request:**

| Property     | Expected Value                               |
| ------------ | -------------------------------------------- |
| Method       | POST                                         |
| URL          | `/api/labor-market`                          |
| Content-Type | `application/json`                           |
| Request Body | JSON with `seriesid`, `startyear`, `endyear` |

**Response Headers to examine:**

| Header                  | Description                                 |
| ----------------------- | ------------------------------------------- |
| `X-RateLimit-Remaining` | Number of API calls remaining today         |
| `X-RateLimit-Limit`     | Maximum API calls allowed per day           |
| `X-Cache`               | `HIT` if served from cache, `MISS` if fresh |
| `Content-Type`          | Should be `application/json`                |

### Common HTTP Status Codes

| Status  | Meaning             | Action                                                             |
| ------- | ------------------- | ------------------------------------------------------------------ |
| **200** | Success             | Data loaded correctly                                              |
| **400** | Bad Request         | Check request body format; verify `seriesid` array is valid        |
| **401** | Unauthorized        | API key may be invalid or expired                                  |
| **429** | Rate Limited        | Too many requests; wait and retry later                            |
| **500** | Server Error        | Check if `BLS_API_KEY` is configured; check server logs            |
| **502** | Bad Gateway         | BLS API is down or returned error; check response body for details |
| **503** | Service Unavailable | BLS API temporarily unavailable; retry later                       |

### Example Network Inspection

1. Open Network tab
2. Load the Dashboard
3. Find the `labor-market` request
4. Click to expand
5. Check these tabs:
   - **Headers**: Verify request/response headers
   - **Payload**: See what was sent to the API
   - **Response**: See the raw API response
   - **Timing**: See breakdown of request timing

---

## 6. Troubleshooting

### Widget shows nothing (no error, no data)

**Symptoms**: The Labor Market Widget area is empty or shows a loading state indefinitely.

**Diagnosis Steps**:

1. Open browser console and check for JavaScript errors
2. Enable debug mode to see status information
3. Check Network tab for API calls to `/api/labor-market`
4. Verify `.dev.vars` exists and contains `BLS_API_KEY`

**Common Causes**:

- JavaScript error preventing render
- API call not being made
- Component not mounted properly

---

### "API key not configured" error

**Symptoms**: Error banner displays indicating the API key is missing.

**Solution**:

1. Create `.dev.vars` from the example:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
2. Edit `.dev.vars` and add your BLS API key:
   ```
   BLS_API_KEY=your_actual_api_key
   ```
3. **Important**: Restart the dev server - env changes require a restart
   ```bash
   # Stop the server (Ctrl+C) and restart
   pnpm dev
   ```

---

### Data shows but seems stale

**Symptoms**: Data displays but appears to be old (dates from weeks/months ago).

**Diagnosis**:

1. Enable debug mode and check cache age
2. BLS data itself may be 1-2 months behind (this is normal)

**Solutions**:

1. Click the Refresh button in the widget to force fresh data
2. Clear localStorage cache entries:
   ```javascript
   Object.keys(localStorage)
     .filter((k) => k.startsWith('bls_cache'))
     .forEach((k) => localStorage.removeItem(k));
   ```
3. Refresh the page

> **Note**: BLS data is typically released monthly with a 1-2 month delay. Seeing data from the previous month is expected behavior.

---

### Regional/Occupation sections are empty

**Symptoms**: These sections show placeholder messages instead of data.

**Cause**: These sections require profile data to function.

**Solutions**:

For **Target Occupations**:

1. Navigate to your Profile settings
2. Add at least one target occupation with a valid SOC code
3. Common SOC codes:
   - `15-1252` - Software Developers
   - `15-1211` - Computer Systems Analysts
   - `13-2011` - Accountants and Auditors
4. Save and return to Dashboard

For **Regional Insights**:

1. Navigate to your Profile settings
2. Set your current state/location
3. Add one or more target states for comparison
4. Save and return to Dashboard

---

### API returns 429 (Rate Limited)

**Symptoms**: Error message about rate limits; no data loads.

**Solutions**:

1. Wait until the rate limit resets (usually daily at midnight ET)
2. Check `X-RateLimit-Remaining` header to see current usage
3. For development, consider:
   - Using cached data more
   - Reducing unnecessary refreshes
   - Requesting a higher rate limit from BLS

---

### Slow Loading Times

**Symptoms**: Widget takes a long time (>5 seconds) to load data.

**Possible Causes**:

1. Cold start on Cloudflare Workers
2. Multiple API calls to BLS
3. BLS API slowness

**Solutions**:

1. Enable caching (should be automatic)
2. Check debug panel for timing breakdown
3. Consider if you're making too many series requests

---

## 7. Expected Debug Panel Output

When debug mode is enabled, a debug panel appears in the Labor Market Widget. Here's what you should see:

### Normal Operation (All Data Loading)

```
+---------------------------+
| Debug Mode                |
+---------------------------+
| Market Snapshot:          |
|   Status: * success       |
|   Cache:  miss            |
|   Time:   1,234ms         |
|                           |
| Occupation Data:          |
|   Status: * success       |
|   Cache:  hit             |
|   Time:   156ms           |
|                           |
| Regional Data:            |
|   Status: * success       |
|   Cache:  hit             |
|   Time:   89ms            |
+---------------------------+
```

### During Loading

```
+---------------------------+
| Debug Mode                |
+---------------------------+
| Market Snapshot:          |
|   Status: * pending       |
|   Cache:  -               |
|   Time:   -               |
+---------------------------+
```

### With Errors

```
+---------------------------+
| Debug Mode                |
+---------------------------+
| Market Snapshot:          |
|   Status: * error         |
|   Error:  API key missing |
|   Time:   45ms            |
+---------------------------+
```

### Status Indicators

| Symbol      | Meaning                          |
| ----------- | -------------------------------- |
| `* success` | Data loaded successfully (green) |
| `* pending` | Currently loading (yellow/amber) |
| `* error`   | Failed to load (red)             |
| `* skipped` | Not applicable (gray)            |

### Cache Values

| Value  | Meaning                             |
| ------ | ----------------------------------- |
| `hit`  | Data served from localStorage cache |
| `miss` | Fresh data fetched from API         |
| `-`    | Not applicable or still loading     |

### Time Values

- Displayed in milliseconds
- Includes both cache lookup and network time (if applicable)
- `-` indicates still loading or not applicable

---

## Additional Resources

- [BLS API Documentation](https://www.bls.gov/developers/)
- [BLS Series ID Lookup](https://www.bls.gov/help/hlpforma.htm)
- [SOC Code Reference](https://www.bls.gov/soc/)
- [Local Development Guide](../development/LOCAL_API_DEVELOPMENT.md)

---

_Last updated: December 2024_
