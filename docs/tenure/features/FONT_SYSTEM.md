# Official Font System

**Effective Date:** December 22, 2025

## Font Hierarchy

All Thoughtful App Co. applications now use a consistent three-tier font system:

### 1. **Heading Font: Dosis**

- **Family:** `'Dosis', system-ui, sans-serif`
- **Weight:** Bold to Extra Bold (600-800)
- **Usage:** Main headings, titles, primary labels
- **Character:** Rounded, friendly, bold sans-serif with excellent readability
- **Examples:**
  - App titles (e.g., "Tenure")
  - Section headings (h1, h2)
  - Archetype titles
  - Navigation headers
  - Card titles

### 2. **Sub-Heading Font: Gafata (Bold)**

- **Family:** `'Gafata', Georgia, serif`
- **Weight:** Bold (700) - applied via CSS
- **Usage:** Sub-headings, secondary labels, emphasized text
- **Character:** Elegant serif with clean lines and excellent screen legibility
- **Examples:**
  - Section sub-titles
  - Category labels
  - Card metadata
  - Tab labels
  - Button text (when emphasized)

### 3. **Body Font: Gafata (Light)**

- **Family:** `'Gafata', Georgia, serif`
- **Weight:** Regular/Light (400) - Gafata's default weight
- **Usage:** Body text, descriptions, general UI text
- **Character:** Same elegant serif as sub-headings, lighter weight for comfortable reading
- **Examples:**
  - Paragraphs
  - Descriptions
  - Form inputs
  - Button text (default)
  - List items
  - Tooltips
  - Badge text

## Implementation

Fonts are loaded via Google Fonts in `index.html`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Dosis:wght@200;300;400;500;600;700;800&family=Gafata&display=swap"
  rel="stylesheet"
/>
```

**Note:** Gafata only has one weight (400/regular) available from Google Fonts. The bold effect for sub-headings is achieved through CSS `font-weight: 700` which the browser will synthesize.

## Theme Configuration

All theme files (`src/theme/*.ts`) now define:

```typescript
fonts: {
  heading: "'Dosis', system-ui, sans-serif",
  subheading: "'Gafata', Georgia, serif",
  body: "'Gafata', Georgia, serif",
}
```

## Updated Themes

- ✅ Maximalist (Tenure)
- ✅ Biophilic (Nurture)
- ✅ Brutalist (Manifest)
- ✅ Daylight (JustInCase)
- ✅ Liquid (Friendly)
- ✅ Papermorphic (LOL)
- ✅ Tempo
- ✅ ZenTouch

## Typography Guidelines

### Heading Examples

```css
font-family: 'Dosis', system-ui, sans-serif;
font-weight: 700-800;
font-size: 32px-56px;
text-transform: uppercase (optional);
letter-spacing: 1-2px (optional);
```

### Sub-Heading Examples

```css
font-family: 'Gafata', Georgia, serif;
font-weight: 700; /* Bold effect */
font-size: 18px-24px;
letter-spacing: 0.5px (optional);
```

### Body Text Examples

```css
font-family: 'Gafata', Georgia, serif;
font-weight: 400; /* Regular/Light */
font-size: 15px-18px; /* Increased for better readability */
line-height: 1.5-1.6;
```

## Font Pairing Rationale

**Dosis + Gafata** creates a harmonious contrast:

- **Dosis** (sans-serif): Modern, bold, geometric - perfect for attention-grabbing headings
- **Gafata** (serif): Elegant, readable, refined - excellent for both sub-headings and body text
- The pairing balances **boldness** (Dosis) with **sophistication** (Gafata)
- Unified body/sub-heading font (Gafata) with weight variation creates visual hierarchy while maintaining consistency

## Accessibility

- All fonts maintain WCAG AA contrast ratios
- Minimum body text size: 15px (increased for better readability)
- Standard body text: 17-18px
- Fallback fonts ensure cross-platform compatibility
- Gafata's clear letterforms provide excellent screen readability
- Dosis's rounded geometric design is highly legible at all sizes

## Component-Specific Implementations

### Tenure Main App (TenureApp.tsx)

- Uses maximalist theme fonts directly
- Body text: 15px-18px
- Sub-headings: 18px-24px
- Headings: 32px-56px

### Pipeline/Prospect View (liquidTenure)

- Uses liquidTenure theme which inherits from maximalist
- Fonts automatically sync with maximalist theme
- Same Dosis + Gafata pairing throughout

## Migration Notes

Previous font families have been replaced system-wide:

- ~~Oxygen Mono~~ → **Dosis** (heading)
- ~~Source Sans Pro~~ → **Gafata Bold** (sub-heading)
- ~~Rubik~~ → **Gafata** (body)

All components will automatically inherit these fonts through the theme system.
