# App Versioning Guide

This project uses individual versioning for each app module. Each app maintains its own version, changelog, and release cycle.

## Version Structure

Each app has:

- **VERSION.json** - Contains app metadata and version information
- **CHANGELOG.md** - Detailed changelog following Keep a Changelog format

## Semantic Versioning

All apps follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** - Breaking changes
- **MINOR** - New functionality (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

Version format: `MAJOR.MINOR.PATCH`

## Apps and Current Versions

| App        | Version | Location                     |
| ---------- | ------- | ---------------------------- |
| Tempo      | 1.1.0   | `src/components/tempo/`      |
| Friendly   | 1.0.0   | `src/components/friendly/`   |
| Augment    | 1.0.0   | `src/components/augment/`    |
| LOL        | 1.0.0   | `src/components/lol/`        |
| Manifest   | 1.0.0   | `src/components/manifest/`   |
| Nurture    | 1.0.0   | `src/components/nurture/`    |
| JustInCase | 1.0.0   | `src/components/justincase/` |

## Updating an App Version

1. Update the `version` field in the app's `VERSION.json`
2. Add a new entry to the app's `CHANGELOG.md` with:
   - Release date
   - Added features
   - Changed features
   - Fixed bugs
   - Security updates
3. Commit changes with a message like: `bump: tempo app to 1.1.0`

## Example VERSION.json

```json
{
  "app": "Tempo",
  "version": "1.1.0",
  "releaseDate": "2025-12-03",
  "changelog": "CHANGELOG.md"
}
```

## Example CHANGELOG.md Entry

```markdown
## [1.1.0] - 2025-12-03

### Added

- New feature X

### Changed

- Updated feature Y

### Fixed

- Bug fix Z

### Security

- Security patch info
```

## Accessing Version Info Programmatically

To use version information in your app components, import the VERSION.json file:

```typescript
import VERSION from './VERSION.json';

console.log(`${VERSION.app} v${VERSION.version}`); // "Tempo v1.1.0"
```
