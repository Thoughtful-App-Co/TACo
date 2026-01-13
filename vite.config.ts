import { defineConfig, Plugin } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';

// =============================================================================
// PRODUCTION LOG STRIPPING
// =============================================================================
// Removes console.log, console.debug, and console.trace in production builds
// Keeps console.warn and console.error for error reporting
// =============================================================================

function stripConsoleLogs(): Plugin {
  return {
    name: 'strip-console-logs',
    apply: 'build',
    enforce: 'post',
    transform(code, id) {
      // Only process JS/TS files
      if (!/\.(js|ts|jsx|tsx)$/.test(id)) return null;
      // Skip node_modules
      if (id.includes('node_modules')) return null;

      // Remove console.log, console.debug, console.trace, console.info
      // Preserves console.warn and console.error
      const transformed = code
        // Match console.log/debug/trace/info with various argument patterns
        // Handles: console.log('msg'), console.log('msg', obj), console.log(`template`)
        .replace(/console\.(log|debug|trace|info)\s*\([^)]*\);?/g, '/* stripped */')
        // Handle multi-line console calls
        .replace(/console\.(log|debug|trace|info)\s*\(\s*[\s\S]*?\);?/g, (match) => {
          // Only replace if it looks like a complete console call
          const openParens = (match.match(/\(/g) || []).length;
          const closeParens = (match.match(/\)/g) || []).length;
          if (openParens === closeParens) {
            return '/* stripped */';
          }
          return match;
        });

      if (transformed !== code) {
        return { code: transformed, map: null };
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    solidPlugin(),
    stripConsoleLogs(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/**/*', 'tempo/**/*', 'tenure/**/*', 'icons/**/*', '*.png', '*.ico'],
      workbox: {
        // Increase limit for larger bundles (will be reduced after code splitting optimizations)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,otf}'],
        navigateFallback: '/index.html',
        // Allow all navigation requests except /api/* routes
        // This ensures deep routes like /tenure/prospect/pipeline work with the service worker
        navigateFallbackAllowlist: [/^\/(?!api\/).*/],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Google Fonts webfont files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
          // Local fonts
          {
            urlPattern: /\/fonts\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
          // Images (icons, logos)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          // AI API - Network only (no caching, needs fresh responses)
          {
            urlPattern: /\/api\/ai/i,
            handler: 'NetworkOnly',
          },
          // Labor market data - Network first with cache fallback
          {
            urlPattern: /\/api\/labor-market/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'labor-market-api',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
          // News API - Stale while revalidate
          {
            urlPattern: /\/api\/news/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'news-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
          // Resume/Tasks API - Network first
          {
            urlPattern: /\/api\/(resume|tasks)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-api',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
        ],
      },
      // We'll use dynamic manifests per app
      manifest: false,
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Code splitting strategy for optimal bundle sizes and caching
        // Dependencies are split into vendor chunks that rarely change
        manualChunks: {
          // Core framework (~40KB) - Changes only on SolidJS upgrades
          'vendor-solid': ['solid-js', 'solid-js/web', '@solidjs/router'],
          // UI components library (~12KB) - Stable
          'vendor-kobalte': ['@kobalte/core'],
          // Document parsing - Lazy-loaded via dynamic imports
          // unpdf: serverless-optimized PDF extraction (includes bundled PDF.js, no CDN deps)
          // Note: unpdf's internal pdfjs will be auto-split into a separate chunk
          // mammoth: DOCX text extraction
          'vendor-docs': ['unpdf', 'mammoth'],
          // NLP libraries (empty chunk) - Fully lazy-loaded via dynamic imports
          'vendor-nlp': ['wink-nlp', 'wink-eng-lite-web-model', 'keyword-extractor'],
          // D3 visualization (~79KB, down from ~500KB via selective imports)
          'vendor-d3': ['d3', 'd3-sankey', 'd3-shape'],
          // Icons (~147KB) - Compresses to 16KB gzipped
          'vendor-icons': ['phosphor-solid', 'solid-phosphor'],
          // Utilities (~24KB) - Stable dependencies
          'vendor-utils': [
            'date-fns',
            'nanoid',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
          ],
        },
      },
    },
  },
});
