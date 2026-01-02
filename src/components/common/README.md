# Common Components

Shared, reusable UI components used across the TACo application.

## RegionUnavailableMessage

A user-friendly component that displays a helpful notice when labor market features are unavailable for a user's geographic region.

### Features

- **Two Display Modes**: Full informative message or compact inline notice
- **Accessible**: Proper ARIA labels and semantic HTML
- **Customizable**: Support for custom messages and styling
- **Informative**: Shows current coverage and expansion roadmap
- **Non-intrusive**: Friendly info-level styling (blue, not error red)

### Usage

#### Basic Full Mode

```tsx
import { RegionUnavailableMessage } from '@/components/common';

<RegionUnavailableMessage countryCode="CA" countryName="Canada" />;
```

#### Compact Mode (Inline)

```tsx
<RegionUnavailableMessage countryCode="GB" countryName="United Kingdom" compact />
```

#### Without Region List

```tsx
<RegionUnavailableMessage countryCode="JP" countryName="Japan" showSupportedRegions={false} />
```

#### Custom Message

```tsx
<RegionUnavailableMessage
  countryCode="DE"
  countryName="Germany"
  customMessage="Labor market insights coming soon to your region!"
/>
```

### Props

| Prop                   | Type      | Default      | Description                                                     |
| ---------------------- | --------- | ------------ | --------------------------------------------------------------- |
| `countryCode`          | `string`  | **required** | ISO 3166-1 alpha-2 country code (e.g., "US", "CA")              |
| `countryName`          | `string`  | **required** | Human-readable country name for display                         |
| `compact`              | `boolean` | `false`      | Enable compact inline mode                                      |
| `customMessage`        | `string`  | `undefined`  | Override default message text                                   |
| `showSupportedRegions` | `boolean` | `true`       | Show list of supported and coming soon regions (full mode only) |
| `class`                | `string`  | `undefined`  | Additional CSS class for customization                          |

### Utility Functions

#### `isLaborMarketAvailable(countryCode: string): boolean`

Check if labor market data is available for a country.

```tsx
import { isLaborMarketAvailable } from '@/components/common';

if (!isLaborMarketAvailable(userCountry)) {
  // Show region unavailable message
}
```

#### `getSupportedRegionName(countryCode: string): string | null`

Get the human-readable name for a supported region.

```tsx
import { getSupportedRegionName } from '@/components/common';

const regionName = getSupportedRegionName('US'); // "United States"
```

### Integration Examples

#### In a Feature Card

```tsx
function LaborMarketWidget({ userCountry }: Props) {
  return (
    <div class="feature-card">
      <h3>Market Insights</h3>
      <Show
        when={isLaborMarketAvailable(userCountry)}
        fallback={
          <RegionUnavailableMessage
            countryCode={userCountry}
            countryName={getCountryName(userCountry)}
          />
        }
      >
        {/* Show actual labor market data */}
      </Show>
    </div>
  );
}
```

#### Inline Notice

```tsx
function SalarySection({ userLocation }: Props) {
  return (
    <div>
      <h4>Salary Insights</h4>
      <Show when={!isLaborMarketAvailable(userLocation.country)}>
        <RegionUnavailableMessage
          countryCode={userLocation.country}
          countryName={userLocation.countryName}
          compact
        />
      </Show>
      {/* Rest of component */}
    </div>
  );
}
```

### Styling

The component uses semantic colors from `@/theme/semantic-colors`:

- Background: `semanticColors.info.bg` (rgba(59, 130, 246, 0.15))
- Border: `semanticColors.info.border` (rgba(59, 130, 246, 0.3))
- Text: `semanticColors.info.dark` (#2563EB)

Customize via the `class` prop:

```tsx
<RegionUnavailableMessage countryCode="FR" countryName="France" class="custom-notice" />
```

### Accessibility

- Uses semantic HTML (`<h3>`, `<p>`, `<ul>`)
- Proper ARIA attributes (`role="status"`, `aria-live="polite"`)
- Hidden decorative elements (`aria-hidden="true"`)
- Descriptive labels for screen readers

### Supported Regions

Current configuration supports:

- ✅ **United States** (Bureau of Labor Statistics)

Coming soon:

- 🔜 European Union (Eurostat)
- 🔜 Canada (Statistics Canada)
- 🔜 United Kingdom (ONS)
- 🔜 Australia (ABS)

To update supported regions, edit the constants in `RegionUnavailableMessage.tsx`:

- `SUPPORTED_REGIONS` - Currently available
- `COMING_SOON_REGIONS` - In development

### Testing

See `RegionUnavailableMessage.example.tsx` for comprehensive usage examples covering all configurations.

---

**Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.**
