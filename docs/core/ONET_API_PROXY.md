# O\*NET API Proxy

Production-ready Cloudflare Pages Function that proxies O\*NET Web Services API calls.

## Overview

The O*NET API proxy (`/api/onet/*`) provides secure, rate-limited access to the O*NET Web Services API. It keeps the O*NET API key server-side and implements per-IP rate limiting to prevent abuse.

## Features

- ✅ **Comprehensive endpoint coverage** - All major O\*NET endpoints supported
- ✅ **Rate limiting** - 10 requests per minute per IP address
- ✅ **Secure** - API key stored server-side as Cloudflare secret
- ✅ **CORS enabled** - Works from any frontend origin
- ✅ **Error handling** - User-friendly error messages with proper HTTP codes
- ✅ **Logging** - Debug-friendly console logging
- ✅ **TypeScript** - Fully typed with proper interfaces

## Supported Endpoints

### Career Search & Details

#### 1. Career Search

Search for careers by keyword.

```http
GET /api/onet/search?keyword=nurse
```

**Response:**

```json
{
  "success": true,
  "data": {
    "career": [
      {
        "code": "29-1141.00",
        "title": "Registered Nurses",
        "href": "https://services.onetcenter.org/ws/mnm/careers/29-1141.00",
        "tags": {
          "bright_outlook": true
        }
      }
    ]
  },
  "rateLimit": {
    "remaining": 9,
    "resetAt": "2025-01-02T14:35:00.000Z"
  }
}
```

#### 2. Career Details

Get detailed information about a specific career.

```http
GET /api/onet/careers/29-1141.00
```

#### 3. Job Outlook

Get salary and outlook data for a career.

```http
GET /api/onet/careers/29-1141.00/job_outlook
```

#### 4. Career Skills

Get the top skills required for a career.

```http
GET /api/onet/careers/29-1141.00/skills
```

### Interest Profiler (RIASEC Assessment)

#### 5. Get Questions

Retrieve interest profiler questions (60 total).

```http
GET /api/onet/interestprofiler/questions?start=1&end=60
```

**Response:**

```json
{
  "success": true,
  "data": {
    "question": [
      {
        "index": 1,
        "area": "realistic",
        "text": "Build kitchen cabinets"
      }
    ]
  },
  "rateLimit": {
    "remaining": 8,
    "resetAt": "2025-01-02T14:35:00.000Z"
  }
}
```

#### 6. Calculate Results

Submit answers and get RIASEC scores.

```http
GET /api/onet/interestprofiler/results?answers=4333221...
```

**Answer format:** String of 60 digits (1-5 scale), e.g., "433322144..."

**Response:**

```json
{
  "success": true,
  "data": {
    "result": [
      {
        "code": "realistic",
        "title": "Realistic",
        "score": 23,
        "description": "Realistic occupations frequently involve work activities..."
      }
    ]
  }
}
```

#### 7. Get Career Matches

Get career recommendations based on RIASEC scores.

```http
GET /api/onet/interestprofiler/careers?realistic=23&investigative=31&artistic=18&social=42&enterprising=15&conventional=21
```

### Occupation Details (Resume Mutation)

These endpoints provide detailed occupation data for resume customization.

#### 8. Skills

```http
GET /api/onet/occupations/29-1141.00/summary/skills
```

#### 9. Knowledge

```http
GET /api/onet/occupations/29-1141.00/summary/knowledge
```

#### 10. Abilities

```http
GET /api/onet/occupations/29-1141.00/summary/abilities
```

#### 11. Technology Skills

```http
GET /api/onet/occupations/29-1141.00/summary/technology_skills
```

#### 12. Tasks

```http
GET /api/onet/occupations/29-1141.00/summary/tasks
```

### Occupation Search

#### 13. Search by Keyword

Search the occupation database (uses different endpoint than career search).

```http
GET /api/onet/occupation-search?keyword=software
```

## Rate Limiting

The API enforces **10 requests per minute per IP address**.

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: Thu, 02 Jan 2025 14:35:00 GMT
```

### Rate Limit Exceeded

When exceeded, returns HTTP 429:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": "2025-01-02T14:35:00.000Z"
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message here",
  "statusCode": 404
}
```

### Common Error Codes

| Code | Meaning      | Example                             |
| ---- | ------------ | ----------------------------------- |
| 404  | Not found    | Invalid endpoint or occupation code |
| 429  | Rate limited | Too many requests from IP           |
| 500  | Server error | API key not configured              |
| 502  | Bad gateway  | O\*NET API is down or unreachable   |

## Setup

### 1. Get O\*NET API Key

1. Visit https://services.onetcenter.org/reference/
2. Register for an account
3. Request an API key

### 2. Configure Secret

**Note:** `ONET_API_KEY` is a **shared secret** (same for all environments). Unlike environment-specific secrets like JWT or Stripe keys, you only need ONE O\*NET API key that works for local, staging, and production.

#### For Local Development

Create or update `.dev.vars`:

```bash
# O*NET API Key (shared secret - same for all environments)
ONET_API_KEY=your-onet-api-key-here
```

#### For Cloudflare Pages (Staging & Production)

Since Cloudflare Pages secrets are shared between preview and production, you only need to set `ONET_API_KEY` once:

**Option 1: Using Wrangler CLI**

```bash
# Set once - automatically available to both preview and production
wrangler secret put ONET_API_KEY
```

**Option 2: Via Cloudflare Dashboard**

1. Go to **Workers & Pages** → **TACo**
2. Click **Settings** → **Environment Variables**
3. Add `ONET_API_KEY` with your API key
4. Select **"All environments"** or add it once (it's shared anyway)

#### Why No TEST/LIVE Suffix?

Unlike JWT secrets or Stripe keys, O\*NET API keys don't have separate test/live modes. The same key is used for all environments, so we don't need the TEST/LIVE suffix pattern.

**Shared Secrets** (no suffix needed):

- `ONET_API_KEY` ✓
- `RESEND_API_KEY` ✓
- `ANTHROPIC_API_KEY` ✓
- `BLS_API_KEY` ✓
- `GUARDIAN_API_KEY` ✓
- `GNEWS_API_KEY` ✓

**Environment-Specific Secrets** (need TEST/LIVE suffix):

- `JWT_SECRET_TEST` / `JWT_SECRET_PROD` ✓
- `STRIPE_SECRET_KEY_TEST` / `STRIPE_SECRET_KEY_LIVE` ✓
- `STRIPE_WEBHOOK_SECRET_TEST` / `STRIPE_WEBHOOK_SECRET_LIVE` ✓

### 3. Verify Configuration

Test the endpoint locally:

```bash
curl http://localhost:8787/api/onet/search?keyword=nurse
```

Expected response:

```json
{
  "success": true,
  "data": { ... },
  "rateLimit": { ... }
}
```

## Usage Examples

### Frontend (Fetch API)

```typescript
async function searchCareers(keyword: string) {
  const response = await fetch(`/api/onet/search?keyword=${encodeURIComponent(keyword)}`);

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}
```

### Handling Rate Limits

```typescript
async function fetchWithRetry(url: string) {
  const response = await fetch(url);
  const result = await response.json();

  if (response.status === 429) {
    const resetAt = new Date(result.retryAfter);
    const waitMs = resetAt.getTime() - Date.now();

    console.log(`Rate limited. Retrying in ${waitMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));

    return fetchWithRetry(url);
  }

  return result;
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'solid-js';

function useCareerSearch(keyword: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!keyword) return;

    setLoading(true);
    setError(null);

    fetch(`/api/onet/search?keyword=${encodeURIComponent(keyword)}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [keyword]);

  return { data, loading, error };
}
```

## Migrating from Direct O\*NET Calls

If you're currently calling O\*NET directly from `src/services/onet.ts`:

### Before (Direct API Call)

```typescript
const response = await fetch(`https://services.onetcenter.org/ws/mnm/search?keyword=${keyword}`, {
  headers: { Authorization: `Basic ${btoa(API_KEY + ':')}` },
});
```

### After (Proxy)

```typescript
const response = await fetch(`/api/onet/search?keyword=${keyword}`);
```

**Benefits:**

- API key stays server-side (more secure)
- Rate limiting prevents abuse
- Consistent error handling
- CORS automatically handled

## Monitoring

### Cloudflare Analytics

View API usage in Cloudflare Dashboard:

1. Workers & Pages → TACo
2. Analytics → Requests tab
3. Filter by `/api/onet/*`

### Rate Limit Monitoring

Check KV namespace for rate limit data:

```bash
wrangler kv:key list --binding RATE_LIMIT --prefix "ratelimit:onet:"
```

### Logs

View function logs:

```bash
wrangler tail --env production
```

Filter for O\*NET logs:

```bash
wrangler tail --env production | grep "\[O\*NET\]"
```

## Troubleshooting

### API Key Not Configured

**Error:** `O*NET API is not configured. Please contact support.`

**Solution:** Set the `ONET_API_KEY` secret (see Setup section)

### Rate Limit Too Aggressive

If 10 requests/minute is too low, edit `functions/api/onet.ts`:

```typescript
const RATE_LIMIT_MAX = 20; // Increase to 20 req/min
```

### KV Namespace Not Bound

**Error:** `Cannot read property 'get' of undefined`

**Solution:** Verify `RATE_LIMIT` KV namespace is bound in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-namespace-id"
```

### CORS Errors

The proxy includes CORS headers by default. If you still see CORS errors:

1. Check that you're calling `/api/onet/*` (not the O\*NET URL directly)
2. Verify the request is going through the Cloudflare Pages domain
3. Check browser console for the actual CORS error

### O\*NET API Authentication Failed

**Error:** `O*NET API authentication failed`

**Solution:**

1. Verify your API key is correct
2. Check that your O\*NET account is active
3. Ensure you haven't exceeded O\*NET's daily limits

## Performance

### Expected Latency

| Metric                | Value      |
| --------------------- | ---------- |
| Rate limit check (KV) | ~5-20ms    |
| O\*NET API call       | ~100-500ms |
| Total response time   | ~150-600ms |

### Caching Recommendations

Consider caching frequently accessed data in your frontend:

```typescript
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCachedCareer(code: string) {
  const cached = localStorage.getItem(`career:${code}`);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  return null;
}
```

## Security

### API Key Protection

- ✅ API key stored as Cloudflare secret (encrypted at rest)
- ✅ Never exposed in client-side code
- ✅ Not logged in console output

### Rate Limiting

- ✅ Per-IP rate limiting prevents abuse
- ✅ Uses Cloudflare KV for distributed enforcement
- ✅ Automatic cleanup of expired rate limit data

### Input Validation

- ✅ Query parameters are URL-encoded
- ✅ Invalid endpoints return 404
- ✅ Malformed requests return 400

## Future Enhancements

Potential improvements:

- [ ] Response caching (24-hour TTL for career data)
- [ ] Request logging to Analytics Engine
- [ ] User-based rate limiting (in addition to IP)
- [ ] Webhook support for data updates
- [ ] GraphQL wrapper for complex queries

## Related Documentation

- [O\*NET Web Services API Reference](https://services.onetcenter.org/reference/)
- [Local API Development Guide](../context_engineering/development/LOCAL_API_DEVELOPMENT.md)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review function logs with `wrangler tail`
3. Verify configuration in `wrangler.toml` and `.dev.vars`
4. Contact the development team

---

**Last updated:** January 2, 2025  
**Maintained by:** Thoughtful App Co. Development Team
