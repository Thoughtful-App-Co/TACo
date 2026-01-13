# RegionUnavailableMessage - Quick Start

## Installation

No installation needed - component is already in your codebase!

## Import

```tsx
import { RegionUnavailableMessage } from '@/components/common';
```

## Basic Usage

### Full Display

```tsx
<RegionUnavailableMessage countryCode="CA" countryName="Canada" />
```

### Compact Display

```tsx
<RegionUnavailableMessage countryCode="GB" countryName="United Kingdom" compact />
```

## Common Patterns

### 1. Feature Gate

```tsx
import { isLaborMarketAvailable, RegionUnavailableMessage } from '@/components/common';

function LaborMarketFeature({ userCountry, countryName }) {
  return (
    <Show
      when={isLaborMarketAvailable(userCountry)}
      fallback={<RegionUnavailableMessage countryCode={userCountry} countryName={countryName} />}
    >
      <LaborMarketWidget />
    </Show>
  );
}
```

### 2. Inline Notice

```tsx
function SalarySection({ region }) {
  return (
    <div>
      <h4>Salary Insights</h4>
      <Show when={!isLaborMarketAvailable(region.code)}>
        <RegionUnavailableMessage countryCode={region.code} countryName={region.name} compact />
      </Show>
      {/* ... */}
    </div>
  );
}
```

### 3. Custom Message

```tsx
<RegionUnavailableMessage
  countryCode="DE"
  countryName="Germany"
  customMessage="Market insights coming to Europe in Q2 2026!"
  showSupportedRegions={false}
/>
```

## Props Reference

| Prop                   | Type    | Required | Default |
| ---------------------- | ------- | -------- | ------- |
| `countryCode`          | string  | ✅       | -       |
| `countryName`          | string  | ✅       | -       |
| `compact`              | boolean | ❌       | `false` |
| `customMessage`        | string  | ❌       | -       |
| `showSupportedRegions` | boolean | ❌       | `true`  |
| `class`                | string  | ❌       | -       |

## Utility Functions

```tsx
import { isLaborMarketAvailable, getSupportedRegionName } from '@/components/common';

// Check availability
const isAvailable = isLaborMarketAvailable('US'); // true
const isAvailable2 = isLaborMarketAvailable('CA'); // false

// Get region name
const name = getSupportedRegionName('US'); // "United States"
const name2 = getSupportedRegionName('CA'); // null
```

## Supported Regions

Currently: `US` (United States only)

Coming soon: `EU`, `CA`, `GB`, `AU`

## Need Help?

- Full docs: `src/components/common/README.md`
- Examples: `src/components/common/RegionUnavailableMessage.example.tsx`
- Visual guide: `src/components/common/VISUAL_GUIDE.md`

---

**Ready to use!** 🚀
