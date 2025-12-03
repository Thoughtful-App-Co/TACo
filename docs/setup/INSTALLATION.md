# Installation Guide

Detailed instructions for setting up your Tempo development environment.

## Full Setup

### 1. Clone the Repository

```bash
git clone https://github.com/thoughtful-app-co/tempo.git
cd tempo
```

### 2. Install Node.js

Ensure you have Node.js 18+:

```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### 3. Install Dependencies

```bash
npm install
```

This installs all packages including:

- Solid.js framework
- Vite build tool
- TypeScript
- ESLint & Prettier (linting/formatting)
- Husky (git hooks)

### 4. Setup Git Hooks

```bash
npx husky install
```

This enables pre-commit hooks that automatically:

- Run ESLint on staged files
- Format code with Prettier
- Prevent commits with linting errors

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app running.

## IDE Setup

### VS Code

**Recommended Extensions:**

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **Solid.js Extension Pack** (`theia-ide.solidjs-snippets`)

**VS Code Settings** (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

### WebStorm / IntelliJ IDEA

1. Go to **Settings** → **Languages & Frameworks** → **JavaScript** → **Code Quality Tools** → **ESLint**
2. Enable ESLint
3. Go to **Settings** → **Languages & Frameworks** → **JavaScript** → **Prettier**
4. Enable Prettier with `Run for files: {**/*,*}.{js,ts,jsx,tsx,json,md}`

## Environment Variables

No environment variables required for local development. The app runs entirely client-side.

For deployment to Cloudflare Pages, see [Environment Variables](../deployment/ENVIRONMENT.md).

## Verify Installation

Run the following to verify everything is set up correctly:

```bash
npm run validate
```

This runs:

- TypeScript type checking
- ESLint linting
- Prettier format checking
- Production build

All should pass without errors.

## Common Issues & Troubleshooting

### Issue: `npm install` fails

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port 5173 is already in use

**Solution:**

```bash
# Use a different port
npm run dev -- --port 3000
```

### Issue: Git hooks not working

**Solution:**

```bash
# Reinstall Husky
npx husky uninstall
npx husky install
```

### Issue: ESLint or Prettier not working in editor

**Solution:**

1. Reload VS Code window (Cmd/Ctrl + K, Cmd/Ctrl + R)
2. Verify extensions are installed
3. Check `.vscode/settings.json` is properly configured

### Issue: TypeScript errors in editor but build succeeds

**Solution:**

1. Restart your IDE
2. Reload TypeScript language service
3. Delete `.eslintcache` file

## Next Steps

1. Read the [Setup Guide](./README.md)
2. Follow the [Development Guide](../development/DEVELOPMENT.md)
3. Review the [Design System](../design/DESIGN_SYSTEM.md)

## Getting Help

- Check [Development Guide](../development/DEVELOPMENT.md) for common issues
- Review [Linting & CI/CD](../development/LINTING_AND_CI_CD.md) docs
- See [CONTRIBUTING](../guides/CONTRIBUTING.md) for contribution guidelines

---

**Ready to code?** Start with `npm run dev` and navigate to `http://localhost:5173`!
