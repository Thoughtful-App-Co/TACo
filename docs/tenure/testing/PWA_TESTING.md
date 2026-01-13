# PWA Testing Guide

This guide covers testing the Progressive Web App features of TACo applications.

## Quick Start

```bash
# Build and preview
pnpm build
pnpm preview
```

Then open http://localhost:4173 in Chrome.

## Lighthouse PWA Audit

1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **Progressive Web App** category
4. Click **Analyze page load**

### Expected Results

| Check          | Expected           |
| -------------- | ------------------ |
| Installable    | ✅ Yes             |
| PWA Optimized  | ✅ Yes             |
| Service Worker | ✅ Registered      |
| Manifest       | ✅ Valid           |
| HTTPS          | ✅ (in production) |

## Manual Testing Checklist

### Install Flow (Chrome/Edge)

- [ ] Visit `/tempo` at least 3 times
- [ ] Install banner appears at bottom
- [ ] Click "Install" triggers browser prompt
- [ ] App installs to desktop/home screen
- [ ] Installed app opens in standalone window

### Offline Mode

- [ ] Load the app online first
- [ ] Open DevTools > Network > Check "Offline"
- [ ] Refresh page - app still loads
- [ ] Navigate within app - works
- [ ] Create/edit data - saves locally
- [ ] Visit uncached route - shows offline.html
- [ ] Go back online - "Back online" toast appears

### iOS Testing

1. Open site in Safari on iPhone/iPad
2. Tap Share button
3. Scroll down, tap "Add to Home Screen"
4. Verify icon and name are correct
5. Open from home screen - should be fullscreen

### Manifest Switching

- [ ] Visit `/` - TACo manifest loads
- [ ] Visit `/tempo` - Tempo manifest loads (check DevTools > Application > Manifest)
- [ ] Visit `/tenure` - Tenure manifest loads
- [ ] Theme color in browser chrome changes per app

### Update Flow

1. Deploy a new version
2. Existing installed PWA detects update
3. Update modal appears with changelog
4. Click "Update Now" - app reloads with new version

## Browser Compatibility

| Browser          | Install     | Offline | Push |
| ---------------- | ----------- | ------- | ---- |
| Chrome (Desktop) | ✅          | ✅      | ✅   |
| Chrome (Android) | ✅          | ✅      | ✅   |
| Edge             | ✅          | ✅      | ✅   |
| Firefox          | ❌          | ✅      | ✅   |
| Safari (iOS)     | Add to Home | ✅      | ❌   |
| Safari (Mac)     | Add to Dock | ✅      | ❌   |

## Troubleshooting

### Service Worker Not Updating

```js
// In DevTools Console
navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
```

Then hard refresh (Ctrl+Shift+R).

### Manifest Not Loading

Check DevTools > Application > Manifest for errors.
Common issues:

- Icons not found (404)
- Invalid JSON syntax
- Missing required fields

### Cache Issues

DevTools > Application > Storage > Clear site data

## Files Reference

```
src/lib/pwa/
├── register.ts           # SW registration
├── manifest-switcher.ts  # Dynamic manifest
├── install-prompt.ts     # Install UX
├── offline-queue.ts      # Failed request retry
├── ios-meta.ts           # iOS support
├── push-notifications.ts # Push (needs VAPID)
└── changelog.ts          # Version history

public/
├── manifest.json         # TACo manifest
├── offline.html          # Offline fallback
├── tempo/manifest.json
├── tenure/manifest.json
└── icons/{taco,tempo,tenure}/
```

## Enabling Push Notifications

1. Generate VAPID keys:

   ```bash
   pnpm exec web-push generate-vapid-keys
   ```

2. Add to `.dev.vars`:

   ```
   VITE_VAPID_PUBLIC_KEY=your-public-key
   ```

3. Add same key to Cloudflare Pages dashboard for production.
