# Deployment Guide

Instructions for deploying Tempo to Cloudflare Pages.

## Prerequisites

- Cloudflare account
- GitHub repository with Tempo
- GitHub Actions workflows configured
- Cloudflare API token

## Setup

### 1. Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select "Pages"
3. Click "Create a project"
4. Connect your GitHub repository
5. Choose "tempo" repository
6. Configure build settings:
   - **Framework preset**: None (custom)
   - **Build command**: `pnpm run build`
   - **Build output directory**: `dist`

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions**

```
CLOUDFLARE_API_TOKEN      # From Cloudflare API tokens
CLOUDFLARE_ACCOUNT_ID     # From Cloudflare account
CLOUDFLARE_PROJECT_NAME   # Project name from Pages
```

### 3. Deploy

The deployment is automated via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions CI/CD runs
3. If all checks pass, automatically deploys to Cloudflare Pages
4. Live at `https://yourproject.pages.dev`

## Manual Deployment

If needed, deploy manually:

```bash
# Build the project
pnpm run build

# Install Wrangler
pnpm add -g @cloudflare/wrangler

# Deploy
wrangler pages deploy dist \
  --project-name=tempo \
  --account-id=YOUR_ACCOUNT_ID
```

## Custom Domain

1. In Cloudflare Pages project
2. Go to "Custom domains"
3. Add your domain
4. Follow DNS configuration

## Environment Variables

See [Environment Variables](./ENVIRONMENT.md)

## Rollback

If deployment has issues:

1. Cloudflare Pages keeps build history
2. Select previous build in Pages dashboard
3. Click "Rollback"

## Monitoring

### Check Deployment Status

1. GitHub Actions tab shows build logs
2. Cloudflare Pages dashboard shows deployments
3. Check live site functionality

### View Logs

```bash
# GitHub Actions logs
# Actions tab → deployment workflow → see all steps

# Cloudflare Pages logs
# Pages dashboard → Deployments → click build
```

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs for errors
2. Run `pnpm run validate` locally
3. Fix issues and push again

### Site Not Loading

1. Check Cloudflare Pages dashboard
2. Verify custom domain DNS settings
3. Check browser cache (hard refresh)
4. Check GitHub Actions for recent deployments

### TypeScript Errors in CI

```bash
pnpm run type-check
pnpm run lint
pnpm run build
```

## Performance

Cloudflare Pages provides:

- Global edge caching
- Auto-minification
- HTTP/2 push
- Automatic gzip compression

## Security

- HTTPS enforced
- DDoS protection
- WAF rules available
- API tokens with minimal permissions

## Disaster Recovery

### Data Backup

All data is stored in browser LocalStorage:

- Users have local backup
- No server-side data loss risk

### Code Rollback

1. Previous builds available in Pages history
2. Git history preserves all commits
3. GitHub allows rollback to any commit

## Future Deployments

For each deployment:

1. Develop on feature branch
2. Create pull request
3. GitHub Actions validates
4. Merge to main
5. Auto-deploys to Cloudflare Pages
6. Live immediately

---

See [Environment Variables](./ENVIRONMENT.md) for configuration details.
