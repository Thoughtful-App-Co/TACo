# SEO Actions Checklist - Q1 2026

## Completed Infrastructure

- [x] `sitemap.xml` - All routes with priority weighting
- [x] `robots.txt` - Comprehensive crawler rules (search engines + AI/LLM bots)
- [x] `llms.txt` - AI agent context file
- [x] JSON-LD structured data (Organization, WebSite, WebPage, SoftwareApplication)

---

## Search Console Submissions

### Google Search Console
- [ ] Verify domain ownership at [search.google.com/search-console](https://search.google.com/search-console)
- [ ] Submit sitemap: `https://www.thoughtfulappo.co/sitemap.xml`
- [ ] Request indexing for priority pages (`/`, `/tempo`, `/tenure`)
- [ ] Set up email alerts for indexing issues
- [ ] Review Core Web Vitals report after 7 days

### Brave Search
- [ ] Submit site at [search.brave.com/webmasters](https://search.brave.com/webmasters)
- [ ] Verify domain ownership
- [ ] Submit sitemap URL

### Bing Webmaster Tools
- [ ] Verify at [bing.com/webmasters](https://www.bing.com/webmasters)
- [ ] Import settings from Google Search Console (option available)
- [ ] Submit sitemap

### IndexNow (Instant Indexing)
- [ ] Generate IndexNow API key
- [ ] Add key file to `/public/{key}.txt`
- [ ] Configure automatic pings on content updates (optional)

---

## Structured Data Validation

- [ ] Test JSON-LD at [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Fix any validation errors reported
- [ ] Test with [Schema.org Validator](https://validator.schema.org/)

---

## Social Profiles (for `sameAs` in JSON-LD)

Update `index.html` JSON-LD `sameAs` array when profiles are created:

- [ ] Twitter/X profile URL
- [ ] LinkedIn company page URL
- [ ] GitHub organization URL
- [ ] Product Hunt page URL (if launched)

---

## App-Specific OG Images

Create unique social preview images for each app:

- [ ] `/public/og-tempo.png` (1200x630)
- [ ] `/public/og-tenure.png` (1200x630)
- [ ] `/public/og-echoprax.png` (1200x630)
- [ ] `/public/og-justincase.png` (1200x630)
- [ ] `/public/og-friendly.png` (1200x630)
- [ ] `/public/og-nurture.png` (1200x630)

---

## Dynamic Meta Tags (Code Implementation)

Implement per-route meta tag updates in SolidJS:

- [ ] Create `useSEO()` hook or utility for dynamic meta management
- [ ] Add unique `<title>` per route
- [ ] Add unique `<meta name="description">` per route
- [ ] Add `<link rel="canonical">` per route
- [ ] Update `og:title`, `og:description`, `og:image` per route
- [ ] Update `twitter:title`, `twitter:description`, `twitter:image` per route

---

## Content SEO

### Landing Page (`/`)
- [ ] Ensure H1 contains primary keyword
- [ ] Add alt text to all images
- [ ] Internal links to all app pages

### App Pages
- [ ] Each app page has unique H1
- [ ] Feature descriptions are crawlable (not hidden in modals)
- [ ] FAQ sections with proper heading hierarchy

### Legal Pages
- [ ] Ensure `/privacy-policy` and `/terms-of-service` are indexable
- [ ] Add `lastmod` dates to sitemap for these pages

---

## Performance SEO

- [ ] Run Lighthouse audit, target 90+ Performance score
- [ ] Verify LCP (Largest Contentful Paint) < 2.5s
- [ ] Verify CLS (Cumulative Layout Shift) < 0.1
- [ ] Verify INP (Interaction to Next Paint) < 200ms
- [ ] Enable text compression (gzip/brotli) - verify via Cloudflare
- [ ] Preload critical fonts

---

## Monitoring Setup

- [ ] Set up Google Search Console email notifications
- [ ] Monitor 404 errors weekly
- [ ] Track indexed pages count monthly
- [ ] Set up uptime monitoring (e.g., BetterStack, UptimeRobot)

---

## LLM/AI Search Optimization

- [ ] Verify `llms.txt` is accessible at `https://www.thoughtfulappo.co/llms.txt`
- [ ] Test site in ChatGPT web browsing
- [ ] Test site in Perplexity
- [ ] Test site in Google AI Overview (SGE)
- [ ] Update `llms.txt` when new apps are added

---

## Sitemap Maintenance

When adding new routes:

- [ ] Add new URL to `public/sitemap.xml`
- [ ] Set appropriate `<priority>` (1.0 = homepage, 0.9 = main apps, 0.7-0.8 = secondary)
- [ ] Set appropriate `<changefreq>` (weekly for apps, monthly for static pages)
- [ ] Ping search engines after sitemap update (or rely on scheduled crawls)

---

## Optional Enhancements

### Breadcrumb Schema
- [ ] Add `BreadcrumbList` JSON-LD for nested routes

### FAQ Schema
- [ ] Add `FAQPage` JSON-LD on landing page or app pages

### Security.txt
- [ ] Create `/.well-known/security.txt` for trust signals

### Humans.txt
- [ ] Create `/humans.txt` crediting team (optional, low priority)

---

## Reference Links

| Resource | URL |
|----------|-----|
| Google Search Console | https://search.google.com/search-console |
| Brave Webmaster Tools | https://search.brave.com/webmasters |
| Bing Webmaster Tools | https://www.bing.com/webmasters |
| Rich Results Test | https://search.google.com/test/rich-results |
| Schema.org Validator | https://validator.schema.org/ |
| PageSpeed Insights | https://pagespeed.web.dev/ |
| IndexNow | https://www.indexnow.org/ |
