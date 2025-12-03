# Linting and CI/CD Pipeline Documentation

## Overview

This project uses a comprehensive linting and continuous integration/continuous deployment (CI/CD) pipeline to maintain code quality, consistency, and reliability. The pipeline includes:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Husky** - Git hooks for pre-commit validation
- **GitHub Actions** - Automated CI/CD workflows
- **Cloudflare Pages** - Deployment integration

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git configured with proper credentials

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Initialize Git hooks:**

   ```bash
   npx husky install
   ```

   This sets up pre-commit hooks that automatically lint and format code before commits.

## Available Scripts

### Linting

**Run ESLint to check for code quality issues:**

```bash
npm run lint
```

**Automatically fix linting issues:**

```bash
npm run lint:fix
```

### Code Formatting

**Format code with Prettier:**

```bash
npm run format
```

**Check if code is properly formatted (without modifying):**

```bash
npm run format:check
```

### Type Checking

**Run TypeScript type checker:**

```bash
npm run type-check
```

### Full Validation

**Run all checks (type-check, lint, format-check, and build):**

```bash
npm run validate
```

This is the recommended command to run before pushing code.

## Configuration Files

### `.eslintrc.json`

ESLint configuration for Solid.js projects:

- Extends recommended ESLint rules
- Includes TypeScript support via `@typescript-eslint`
- Includes Solid.js-specific rules via `eslint-plugin-solid`
- Integrates with Prettier for formatting consistency
- Ignores `dist`, `node_modules`, `build`, `coverage`, `.vite`

**Key Rules:**

- `prettier/prettier`: Warns on formatting issues
- `@typescript-eslint/no-explicit-any`: Warns on `any` types
- `@typescript-eslint/no-unused-vars`: Warns on unused variables (ignores `_` prefixed)
- `no-console`: Warns on console usage (allows `warn` and `error`)
- `no-debugger`: Warns on debugger statements

### `.prettierrc.json`

Prettier configuration for consistent code formatting:

- 2-space indentation
- Single quotes
- 100-character line width
- Trailing commas (ES5 compatible)
- Semicolons enabled
- LF line endings

### `.editorconfig`

EditorConfig for cross-editor consistency:

- UTF-8 encoding
- LF line endings
- 2-space indentation for code files
- Preserves trailing whitespace in Markdown

### `package.json` - lint-staged

Lint-staged configuration for pre-commit hooks:

- Runs ESLint and Prettier on staged TypeScript/JavaScript files
- Runs Prettier on JSON and Markdown files
- Automatically fixes issues before commit

## Pre-Commit Hooks

### How It Works

When you commit code, Husky automatically runs the pre-commit hook which:

1. Runs `lint-staged` on all staged files
2. Executes ESLint with `--fix` flag to auto-correct issues
3. Runs Prettier to format code
4. Stages the fixed files
5. Allows the commit to proceed if all checks pass

### Bypassing Hooks (Not Recommended)

If you need to bypass pre-commit hooks:

```bash
git commit --no-verify
```

**Note:** This is not recommended as it defeats the purpose of the linting pipeline.

## GitHub Actions CI/CD Pipeline

### Workflows

#### 1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)

Runs on every push to `main` or `develop` branches and on pull requests.

**Jobs:**

- **Lint Code**
  - Runs ESLint on all source files
  - Checks code formatting with Prettier
  - Fails if linting or formatting issues are found

- **Type Check**
  - Runs TypeScript type checker
  - Ensures no type errors exist
  - Fails if type errors are found

- **Build Application**
  - Installs dependencies
  - Builds the application with Vite
  - Uploads build artifacts for 5 days
  - Depends on lint and type-check jobs passing

- **Full Validation**
  - Runs complete validation suite
  - Ensures all checks pass before deployment
  - Depends on build job passing

#### 2. **Deploy to Cloudflare Pages** (`.github/workflows/deploy.yml`)

Runs on push to `main` branch after CI/CD pipeline succeeds.

**Configuration:**

Requires the following GitHub secrets:

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_PROJECT_NAME` - Cloudflare Pages project name

**Steps:**

1. Checks out code
2. Sets up Node.js environment
3. Installs dependencies
4. Builds application
5. Deploys to Cloudflare Pages
6. Comments on PR with deployment status

### Setting Up GitHub Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_PROJECT_NAME`

### Workflow Status

Check workflow status in the GitHub Actions tab:

- Green checkmark: All checks passed
- Red X: One or more checks failed
- Yellow circle: Workflow in progress

## Best Practices

### Before Committing

1. **Run local validation:**

   ```bash
   npm run validate
   ```

2. **Fix any issues:**

   ```bash
   npm run lint:fix
   npm run format
   ```

3. **Verify type safety:**
   ```bash
   npm run type-check
   ```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Example:**

```
feat(tempo): add responsive grid layout

- Add media queries for mobile/tablet/desktop
- Implement CSS classes for responsive behavior
- Update TempoApp component with responsive styles

Closes #123
```

### Pull Requests

1. Ensure all GitHub Actions checks pass
2. Request code review from team members
3. Address review comments
4. Merge only after approval and all checks pass

## Troubleshooting

### ESLint Issues

**Problem:** ESLint fails with "Cannot find module" errors

**Solution:**

```bash
npm install
npm run lint:fix
```

**Problem:** ESLint rules are too strict

**Solution:** Modify `.eslintrc.json` to adjust rule severity:

- `"off"` - Disable rule
- `"warn"` - Warning (doesn't fail build)
- `"error"` - Error (fails build)

### Prettier Issues

**Problem:** Prettier conflicts with ESLint

**Solution:** This is already handled by `eslint-config-prettier`. If issues persist:

```bash
npm run format
npm run lint:fix
```

### Pre-Commit Hook Issues

**Problem:** Pre-commit hook fails but you want to commit anyway

**Solution:** Fix the issues first, then commit:

```bash
npm run lint:fix
npm run format
git add .
git commit -m "message"
```

### GitHub Actions Failures

**Problem:** GitHub Actions workflow fails

**Solution:**

1. Check the workflow logs in GitHub Actions tab
2. Run `npm run validate` locally to reproduce
3. Fix issues locally
4. Push changes to trigger workflow again

## Performance Optimization

### Faster Linting

For faster linting during development, lint only changed files:

```bash
npm run lint -- --fix src/components/tempo/TempoApp.tsx
```

### Caching

GitHub Actions automatically caches npm dependencies. To clear cache:

1. Go to Actions tab
2. Click "Clear all caches"

## Integration with IDEs

### VS Code

Install extensions:

- **ESLint** - `dbaeumer.vscode-eslint`
- **Prettier** - `esbenp.prettier-vscode`

Configure `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

### WebStorm/IntelliJ IDEA

1. Go to Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Enable ESLint
3. Go to Settings → Languages & Frameworks → JavaScript → Prettier
4. Enable Prettier
5. Set "Run for files" to `{**/*,*}.{js,ts,jsx,tsx,json,md}`

## Continuous Improvement

### Monitoring

- Check GitHub Actions dashboard regularly
- Review workflow logs for patterns
- Monitor build times and optimize if needed

### Updates

Keep linting tools updated:

```bash
npm update eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-solid
```

### Adding New Rules

To add new ESLint rules:

1. Update `.eslintrc.json`
2. Run `npm run lint:fix` to apply to existing code
3. Commit changes
4. Document the change in this file

## Resources

- [ESLint Documentation](https://eslint.org/docs/rules/)
- [Prettier Documentation](https://prettier.io/docs/en/index.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

## Support

For issues or questions:

1. Check this documentation
2. Review GitHub Actions logs
3. Run `npm run validate` locally
4. Consult team members or project maintainers
