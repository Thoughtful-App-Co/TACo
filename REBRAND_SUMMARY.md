# Augment → Tenure Rebrand Summary

## Files Renamed

- `src/components/augment/` → `src/components/tenure/`
- `src/components/augment/AugmentApp.tsx` → `src/components/tenure/TenureApp.tsx`
- `src/schemas/augment.schema.ts` → `src/schemas/tenure.schema.ts`
- `src/components/tenure/pipeline/theme/liquid-augment.ts` → `liquid-tenure.ts`

## Code Changes

- All import paths updated from `augment` to `tenure`
- Theme variables renamed: `liquidAugment` → `liquidTenure`, `augmentKeyframes` → `tenureKeyframes`
- Component name updated: `AugmentApp` → `TenureApp`
- App route updated: `/augment` → `/tenure`
- AppTab type updated: `'augment'` → `'tenure'`

## Branding Updates

- App name: "Augment" → "Tenure"
- Tagline: "Amplify Your Strengths" → "Eternal Career Companion"
- Description: "Career intelligence & job tracking" → "Eternal Career Companion"
- Elevator pitch updated to: "Your always-on career companion. Discover what you want, prepare for opportunities, track applications with a smart pipeline, and stay ready for what's next — whether you're actively searching or happily employed."

## Preserved for Backwards Compatibility

- localStorage keys remain as `augment_*` to preserve existing user data
