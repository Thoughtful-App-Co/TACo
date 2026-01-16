# Development Guide

Guidelines and best practices for developing TACo applications.

## Getting Started

1. Follow [Setup Guide](../setup/README.md)
2. Read [Architecture](./ARCHITECTURE.md)
3. Review [Design System](../design/DESIGN_SYSTEM.md)

## Development Workflow

### Daily Development

```bash
# Start dev server
pnpm run dev

# In another terminal, watch for linting issues
pnpm run lint:fix

# Format code
pnpm run format
```

### Before Committing

```bash
# Run all checks
pnpm run validate

# This runs:
# - pnpm run type-check (TypeScript)
# - pnpm run lint (ESLint)
# - pnpm run format:check (Prettier)
# - pnpm run build (Vite build)
```

### Creating a Feature

1. Create a feature branch:

   ```bash
   git checkout -b feat/your-feature
   ```

2. Develop your feature
3. Run validation:

   ```bash
   pnpm run validate
   ```

4. Commit with meaningful message:

   ```bash
   git commit -m "feat(component): add new feature"
   ```

5. Push and create pull request:
   ```bash
   git push origin feat/your-feature
   ```

## Code Style

### TypeScript

- Use explicit types (avoid `any`)
- Use `const` instead of `let` or `var`
- Use arrow functions `() => {}`

### Solid.js

- Use `createSignal` for state
- Use `createEffect` for side effects
- Use `createMemo` for computed values
- Use `Show` and `For` for conditionals and loops
- Avoid React patterns like `useState`
- **ALWAYS use `<Portal>` for tooltips** (see below)

### Tooltips (MANDATORY)

**ALL tooltips MUST use SolidJS Portal.** This is a project-wide requirement.

```typescript
import { Portal } from 'solid-js/web';

<Portal>
  <Show when={showTooltip()}>
    <div style={{ position: 'fixed', left: `${x}px`, top: `${y}px`, 'z-index': 10000 }}>
      {/* Tooltip content */}
    </div>
  </Show>
</Portal>
```

**Why:** Parent containers with `transform`, `filter`, or `overflow: hidden` break `position: fixed` positioning. Portal renders the tooltip at document root, escaping these container issues.

**Full documentation:** See [Tooltip Positioning Guide](../design/TOOLTIP_POSITIONING.md)

### Formatting

- 2-space indentation
- Single quotes for strings
- 100-character line limit
- Trailing commas

Prettier and ESLint handle this automatically on commit.

## Component Development

### Creating a New Component

1. Create component file in appropriate folder:

   ```
   src/components/tempo/[section]/ComponentName.tsx
   ```

2. Follow component structure:

   ```typescript
   import { Component, JSX } from 'solid-js'

   interface ComponentProps {
     // Your props here
   }

   export const ComponentName: Component<ComponentProps> = (props) => {
     return (
       <div style={{ /* inline styles */ }}>
         {/* Component content */}
       </div>
     )
   }
   ```

3. Use design tokens from `tempo-design.ts`:

   ```typescript
   import { tempoDesign } from '../../theme/tempo-design';

   // Use tokens
   color: tempoDesign.colors.primary;
   padding: tempoDesign.spacing.lg;
   ```

4. Export from index file for easy imports

## Testing

Currently, the project uses manual testing. For future automated testing:

```bash
pnpm install --save-dev vitest
pnpm run test
```

## Debugging

### Browser DevTools

1. Open DevTools (F12)
2. Go to Sources tab
3. Set breakpoints in TypeScript files
4. DevTools maps to original sources via sourcemaps

### Console Logging

```typescript
console.log('Debug message:', value); // Will warn in eslint
console.error('Error:', error); // Allowed
```

## Performance Tips

1. **Use `createMemo`** for expensive computations
2. **Lazy load components** with dynamic imports
3. **Avoid unnecessary re-renders** with Solid's reactivity
4. **Monitor bundle size** with `pnpm run build`

## Commits & PRs

### Commit Messages

Follow conventional commits:

```
type(scope): subject

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Dependencies, configs

**Example:**

```
feat(tempo-app): add responsive grid layout

- Implement media queries for mobile/tablet/desktop
- Add CSS classes for responsive behavior
- Update TempoApp component

Closes #123
```

### Pull Requests

1. Create meaningful PR title
2. Describe changes in PR body
3. Link related issues
4. Request code review
5. Ensure all CI checks pass
6. Merge after approval

## Project Structure

See [Architecture](./ARCHITECTURE.md) for detailed structure.

## Useful Commands

```bash
pnpm run dev              # Start dev server
pnpm run build           # Production build
pnpm run preview         # Preview production build locally
pnpm run lint            # Check code with ESLint
pnpm run lint:fix        # Auto-fix ESLint issues
pnpm run format          # Format code with Prettier
pnpm run format:check    # Check formatting
pnpm run type-check      # TypeScript type checking
pnpm run validate        # Run all checks + build
```

## Troubleshooting

### Issue: Changes not reflecting in browser

**Solution:**

- Save file (auto-save should work)
- Check browser console for errors
- Hard refresh (Ctrl/Cmd + Shift + R)
- Restart dev server

### Issue: Build fails locally but passes CI

**Solution:**

```bash
# Clear build cache
rm -rf dist .vite node_modules/.vite

# Rebuild
pnpm run build
```

### Issue: Type errors in editor but build succeeds

**Solution:**

- Restart IDE
- Reload TypeScript language service
- Check `tsconfig.json` is correct

## Resources

- [Solid.js Docs](https://docs.solidjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

---

**Questions?** Check the main [docs README](../README.md) or ask the team!
