import { Component, createSignal, createResource, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { marked } from 'marked';

interface LegalPageProps {
  title: string;
  markdownPath: string;
}

// Configure marked for legal documents
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown (tables, strikethrough, etc.)
  breaks: true, // Convert \n to <br>
});

/**
 * LegalPage - Shared component for Privacy Policy and Terms of Service
 *
 * Features:
 * - TACo-branded header with logo and navigation
 * - Clean, readable typography optimized for legal documents
 * - Rendered markdown content with proper formatting via marked
 * - Responsive design
 */
export const LegalPage: Component<LegalPageProps> = (props) => {
  const [isMobile] = createSignal(window.innerWidth <= 768);

  // Fetch and parse markdown content
  const [content] = createResource(async () => {
    const response = await fetch(props.markdownPath);
    if (!response.ok) {
      throw new Error(`Failed to load ${props.title}`);
    }
    const markdown = await response.text();
    return marked.parse(markdown) as string;
  });

  return (
    <div
      style={{
        'min-height': '100vh',
        background: 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 50%, #16213E 100%)',
        color: 'white',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: isMobile() ? '20px' : '24px 40px',
          'border-bottom': '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.3)',
          'backdrop-filter': 'blur(10px)',
        }}
      >
        <div
          style={{
            'max-width': '900px',
            margin: '0 auto',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
          }}
        >
          {/* Logo */}
          <A
            href="/"
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '12px',
              'text-decoration': 'none',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
                'border-radius': '10px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3C7.5 3 4 6 4 9C4 10.5 4.5 12 6 13.5C7.5 15 9.5 16 12 16C14.5 16 16.5 15 18 13.5C19.5 12 20 10.5 20 9C20 6 16.5 3 12 3Z"
                  fill="white"
                  opacity="0.95"
                />
                <path
                  d="M6 13C6 13 7 17 12 17C17 17 18 13 18 13"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  opacity="0.95"
                />
              </svg>
            </div>
            <span
              style={{
                'font-size': '18px',
                'font-weight': '600',
                color: 'white',
              }}
            >
              Thoughtful App Co.
            </span>
          </A>

          {/* Back to Home Link */}
          <A
            href="/"
            style={{
              'font-size': '14px',
              color: 'rgba(255,255,255,0.6)',
              'text-decoration': 'none',
              transition: 'color 0.2s ease',
              display: 'flex',
              'align-items': 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </A>
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          'max-width': '900px',
          margin: '0 auto',
          padding: isMobile() ? '32px 20px' : '60px 40px',
        }}
      >
        {/* Title */}
        <h1
          style={{
            'font-size': isMobile() ? '32px' : '42px',
            'font-weight': '700',
            'margin-bottom': '40px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            'background-clip': 'text',
          }}
        >
          {props.title}
        </h1>

        {/* Markdown Content */}
        <Show
          when={!content.loading && content()}
          fallback={
            <div
              style={{ 'text-align': 'center', padding: '60px 0', color: 'rgba(255,255,255,0.5)' }}
            >
              Loading...
            </div>
          }
        >
          <div
            style={{
              /* Legible font stack for legal documents */
              'font-family':
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              'font-size': '16px',
              'line-height': '1.8',
              color: 'rgba(255,255,255,0.9)',
            }}
            // eslint-disable-next-line solid/no-innerhtml
            innerHTML={content() || ''}
            class="legal-content"
          />
        </Show>

        {/* Back to Top */}
        <div style={{ 'margin-top': '60px', 'text-align': 'center' }}>
          <A
            href="/"
            style={{
              display: 'inline-flex',
              'align-items': 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              'border-radius': '8px',
              'font-size': '14px',
              'font-weight': '600',
              color: 'white',
              'text-decoration': 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            Back to Home
          </A>
        </div>
      </main>

      {/* Global styles for markdown content */}
      <style>
        {`
          .legal-content h1 {
            font-size: 32px;
            font-weight: 700;
            margin: 48px 0 24px;
            color: white;
          }
          .legal-content h2 {
            font-size: 24px;
            font-weight: 600;
            margin: 40px 0 20px;
            color: rgba(255,255,255,0.95);
          }
          .legal-content h3 {
            font-size: 20px;
            font-weight: 600;
            margin: 32px 0 16px;
            color: rgba(255,255,255,0.9);
          }
          .legal-content p {
            margin: 16px 0;
            color: rgba(255,255,255,0.8);
          }
          .legal-content strong {
            font-weight: 600;
            color: rgba(255,255,255,0.95);
          }
          .legal-content ul,
          .legal-content ol {
            margin: 16px 0;
            padding-left: 24px;
          }
          .legal-content li {
            margin: 8px 0;
            color: rgba(255,255,255,0.8);
          }
          .legal-content ul li {
            list-style-type: disc;
          }
          .legal-content ol li {
            list-style-type: decimal;
          }
          .legal-content a {
            color: #4ECDC4;
            text-decoration: underline;
            transition: color 0.2s ease;
          }
          .legal-content a:hover {
            color: #FFE66D;
          }
          .legal-content blockquote {
            margin: 24px 0;
            padding: 16px 24px;
            border-left: 4px solid #4ECDC4;
            background: rgba(255,255,255,0.03);
            font-style: italic;
            color: rgba(255,255,255,0.7);
          }
          .legal-content blockquote p {
            margin: 0;
          }
          .legal-content hr {
            border: none;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin: 32px 0;
          }
          .legal-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
          }
          .legal-content th,
          .legal-content td {
            padding: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            text-align: left;
          }
          .legal-content th {
            background: rgba(255,255,255,0.05);
            font-weight: 600;
            color: rgba(255,255,255,0.95);
          }
          .legal-content code {
            background: rgba(255,255,255,0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
          }
        `}
      </style>
    </div>
  );
};
