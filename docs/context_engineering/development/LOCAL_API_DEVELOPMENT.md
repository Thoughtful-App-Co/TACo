# Local API Development with Wrangler

This guide explains how to develop and test Cloudflare Pages Functions locally using Wrangler.

## Overview

The Tempo app uses Cloudflare Pages Functions for API endpoints. To develop these locally, we use:

- **Vite** (port 3000) - Frontend development server
- **Wrangler** (port 8787) - Cloudflare Pages Functions emulator
- **Concurrently** - Runs both servers simultaneously

## Quick Start

### 1. Build the Site

Before starting the dev servers, build the site once:

```bash
pnpm run build
```

This creates the `dist/` folder with your static site and copies the `functions/` directory.

### 2. Start Development Servers

Run both servers with a single command:

```bash
pnpm run dev
```

This starts:

- Vite dev server on http://localhost:3000
- Wrangler Pages dev server on http://localhost:8787

Vite automatically proxies `/api/*` requests to Wrangler.

### 3. Open the App

Navigate to http://localhost:3000 in your browser.

## How It Works

### Request Flow

```
Browser → http://localhost:3000/api/tasks/process
          ↓ (Vite proxy)
        http://localhost:8787/api/tasks/process
          ↓ (Wrangler executes)
        functions/api/tasks/process.ts
```

### API Key Handling

The "Bring Your Own Key" feature works as follows:

1. User enters API key in Settings (stored in localStorage)
2. Frontend sends API key in `X-API-Key` header with each request
3. Backend checks header first, falls back to `ANTHROPIC_API_KEY` env var
4. Anthropic SDK uses the provided key

## Configuration Files

### `wrangler.toml`

Configures Wrangler for local development:

```toml
name = "thoughtful-app-co-local"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"
```

### `vite.config.ts`

Configures Vite to proxy API requests:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8787',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### `.dev.vars` (Optional)

For shared API keys in local development:

```bash
# Copy from .dev.vars.example
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Note:** With "Bring Your Own Key", this is optional. The API key can be provided through the UI.

## Development Workflow

### Making Changes to Functions

1. Edit files in `functions/`
2. Run `pnpm run build` to copy changes to `dist/functions/`
3. Wrangler will automatically reload

**Tip:** You may need to restart `pnpm run dev` after major function changes.

### Making Changes to Frontend

1. Edit files in `src/`
2. Vite will hot-reload automatically
3. No need to rebuild

### Testing API Endpoints

#### Using the UI

1. Configure API key in Settings
2. Use the Brain Dump feature
3. Check browser DevTools Network tab

#### Using cURL

```bash
curl -X POST http://localhost:8787/api/tasks/process \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-ant-your-key-here" \
  -d '{"tasks": ["test task 1", "test task 2"]}'
```

## Troubleshooting

### Port Already in Use

If port 3000 or 8787 is in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or specify different port
pnpm run dev:vite -- --port 3001
```

### Functions Not Found (404)

1. Ensure you ran `pnpm run build` first
2. Check that `dist/functions/` exists
3. Restart `pnpm run dev`

### API Key Not Working

1. Check browser localStorage in DevTools
2. Verify `X-API-Key` header in Network tab
3. Check Wrangler console output for errors

### Wrangler Errors

```bash
# Clear Wrangler cache
rm -rf .wrangler/

# Reinstall Wrangler
pnpm install -D wrangler
```

### CORS Errors

Wrangler should handle CORS automatically. If you see CORS errors:

1. Check that Vite proxy is configured correctly
2. Ensure you're accessing via http://localhost:3000 (not 8787)

## Alternative: Run Servers Separately

If you prefer separate terminals:

```bash
# Terminal 1 - Frontend
pnpm run dev:vite

# Terminal 2 - API Functions
pnpm run dev:wrangler
```

## Environment Variables

### Local Development

- **UI Provided**: API key from Settings (recommended)
- **`.dev.vars`**: Shared API key for team development
- **Environment**: System environment variables

### Production (Cloudflare Pages)

Set in Cloudflare Pages Dashboard:

- Settings → Environment Variables
- Add `ANTHROPIC_API_KEY`

## Advanced

### Custom Wrangler Configuration

Edit `wrangler.toml` for advanced options:

```toml
[env.development]
# Custom environment variables
[vars]
NODE_ENV = "development"
CUSTOM_VAR = "value"
```

### Debugging Functions

Add `console.log()` statements in your functions. Output appears in the Wrangler terminal.

### Testing Without Wrangler

For quick frontend-only development, you can mock the API:

1. Create `src/mocks/api.ts`
2. Use conditional imports based on environment
3. Skip Wrangler entirely

## Additional Resources

- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)

## Getting Help

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review terminal output for error messages
3. Check browser DevTools Console and Network tabs
4. Verify all configuration files are correct

---

**Ready to code?** Run `pnpm run dev` and start building! 🚀
