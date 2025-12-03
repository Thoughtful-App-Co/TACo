# Setup & Installation Guide

Welcome to Tempo development! This guide will help you get your development environment set up.

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 9+** or **yarn 1.22+** - Usually included with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** - VS Code, WebStorm, or your preference

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/thoughtful-app-co/tempo.git
cd tempo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Git Hooks

```bash
npx husky install
```

### 4. Build the Project

Before starting development, build the project once:

```bash
npm run build
```

This compiles the frontend and copies Cloudflare Functions to `dist/`.

### 5. Start Development Server

```bash
npm run dev
```

This starts **two servers**:

- **Vite** (Frontend) at http://localhost:3000
- **Wrangler** (API Functions) at http://localhost:8787

Open http://localhost:3000 in your browser.

## Detailed Installation

See [INSTALLATION.md](./INSTALLATION.md) for detailed setup instructions including:

- IDE configuration
- Environment variables
- Troubleshooting
- Development tools

## Next Steps

1. **Read the Development Guide** - [Development Guide](../development/DEVELOPMENT.md)
2. **Understand the Architecture** - [Architecture](../development/ARCHITECTURE.md)
3. **Review Design System** - [Design System](../design/DESIGN_SYSTEM.md)

## Key Commands

```bash
npm run dev              # Start dev servers (Vite + Wrangler)
npm run dev:vite         # Start only Vite dev server
npm run dev:wrangler     # Start only Wrangler dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
npm run validate         # Run all checks + build
```

## API Development

For detailed information on local API development:

- See [LOCAL_API_DEVELOPMENT.md](../development/LOCAL_API_DEVELOPMENT.md)

## Common Issues

**Port 3000 or 8787 already in use?**

```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev:vite -- --port 3001
```

**Functions returning 404?**

```bash
# Rebuild and restart
npm run build
npm run dev
```

**Dependencies not installing?**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Git hooks not running?**

```bash
npx husky install
```

## Need Help?

- Check [INSTALLATION.md](./INSTALLATION.md) for detailed setup
- See [Development Guide](../development/DEVELOPMENT.md)
- Review [Troubleshooting](../development/DEVELOPMENT.md#troubleshooting)

---

**Ready to code?** Start with the [Development Guide](../development/DEVELOPMENT.md)!
