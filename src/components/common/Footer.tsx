import { Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { DoodleHeart, DoodleShield, DoodleSparkle, DoodlePeople } from './DoodleIcons';

interface AppInfo {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface FooterProps {
  apps: AppInfo[];
  isMobile?: () => boolean;
  navTokens?: {
    typography: {
      brandFamily: string;
    };
  };
}

/**
 * ExternalLinkIcon - Small icon to indicate links that open in new window
 */
const ExternalLinkIcon: Component<{ size?: number }> = (props) => {
  const size = props.size || 12;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      style={{ 'margin-left': '4px', opacity: 0.5 }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
};

/**
 * Footer - Shared footer component for all TACo pages
 *
 * Includes:
 * - Brand information and social links (GitHub, Discord, Bluesky)
 * - App directory
 * - Philosophy pillars
 * - Resource links
 * - Legal links
 * - External link indicators for links that open in new windows
 */
export const Footer: Component<FooterProps> = (props) => {
  const isMobile = props.isMobile || (() => window.innerWidth < 768);
  const navTokens = props.navTokens || {
    typography: {
      brandFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  };

  return (
    <footer
      style={{
        padding: isMobile() ? '40px 20px 32px' : '60px 24px 40px',
        background: 'rgba(0,0,0,0.3)',
        'border-top': '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          'max-width': '1200px',
          margin: '0 auto',
        }}
      >
        {/* Footer Grid */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': isMobile() ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile() ? '32px' : '40px',
            'margin-bottom': isMobile() ? '32px' : '48px',
          }}
        >
          {/* Brand Column */}
          <div>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '16px',
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
                <svg width="24" height="24" viewBox="0 0 512 512" fill="#000">
                  <path d="M282.07,185.04c-2.49-3.58-2.78-9.02-3.34-12.78-.4-2.1-.71-4.04-.73-6.32.04-4.88.97-9.8-.27-14.61-.38-2.47-.9-3.84-3.51-4.22-23.13-2.51-46.07-.01-69.24.63-2.13-.12-4.21-.55-6.35-.43-2.84.09-4.2,2.08-4.02,4.91-.05,4.75.98,9.26,1.75,13.97.42,4.9,1.04,10.12.49,14.99-.38,5.57,1.25,11.46.8,16.97-.52,5.46.25,11.06-.16,16.51-.24,3.6-.68,7.23-.16,10.95.27,1.68-.15,3.62.03,5.14,1.17,2.37,4.32,1.93,6.82,2.17,2.37.07,6.55.16,8.98.22,12.23.66,26.28.02,38.37.06,11.01.54,20.73.16,31.72.45,4.5.03,12.36-3.32,9.89,4.64-.74,2.25-2.95,3.62-4.83,4.98-3.55,2.46-7.39,5.56-10.7,8.23-6.89,5.02-13.67,9.47-20.35,14.75-4.97,3.71-9.59,6.52-13.89,10.75-5.18,4.13-9.56,9.49-14.14,14.39-1.71,1.74-3,2.37-4.68,3.93-2.23,2.11-4.34,4.5-6.68,6.46-5.78,5.44-12.34,9.93-18.3,15.19-7.16,5.53-5.59-5.85-6.09-9.89-.49-5.72-1.14-11.08-1.4-16.87-.14-12.73.64-25.55,1.61-38.19.35-3.95-.45-7.95-.91-11.89-.24-1.77.14-3.46-1.45-3.99-7.59-.76-15.85-.95-23.66-.5-10.93.5-28.36-.42-40.41,1.3-5.77,1.03-11.78-.2-17.65.62-5.24.56-10.33-1.97-4.82-7,1.92-1.91,5.07-2.81,7.10-4.76,10.5-12,21.17-23.83,31.51-35.96,5.84-7.21,13.29-13.01,20.17-19.38,4.81-5.13,9.87-10.19,14.76-15.10,1.92-1.65,3.91-3.07,5.48-4.78,1.78-1.86,3.61-4.31,4.43-6.87.54-1.6,1.25-3.25,2.28-4.58,10.65-11.33,21.83-22.46,31.78-34.37,10.87-10.87,22-21.64,32.81-32.56,5.04-5.08,8.84-10.55,13.92-15.56,3.42-2.77,5.59-7.78,9.68-9.44,5.5-.75,3.59,6.83,3.78,10.18-.43,12.27-.44,24.9-2.75,37.03l-.37,6.69c.03,10,1.77,20.59,2.8,30.49.64,2.86.16,5.83.48,8.73.41,2.05,2.41,2.75,4.38,2.91,11.06-.57,21.58,1.57,32.64,1.81,7.67-.11,16.11-.21,23.94-.46,4.94-.47,9.37-1.4,14.36-2.11,2.64-.35,7.09-1.59,7.81,1.91.76,5.45.23,10.4,0,16.03-.26,3.66.69,6.98.67,10.59-.02,3.58-.04,6.8-.44,10.36-1.78,13.18-2.69,26.41-1.64,39.79.38,5.57,4.47,11.28-4.61,9.99-4.55-.3-8.22-.73-12.39-.48-5.55.2-11.4,1.63-17.07,1.27-3.96-.23-9.41.42-13.77.15-4.94-.37-10.62-.44-15.38-.34-6.94-.87-14.35-1.13-21.16-1.18-2.42-.82-.34-4.3.59-5.79,1.78-2.64,2.2-4.58,1.96-7.4-.06-2.78.08-5.65.11-8.46.2-3.83.95-7...." />
                  <path d="M332.47,447.96c-13.69.21-27.51,2.18-41.32,1.21-4.64-.25-9.85.73-14.19-1.23-3.04-1.59-4.57-4.73-6.88-7.26-7.94-7.85-14.8-16.88-22.56-24.95-7.81-7.44-14.47-15.98-21.75-23.85-9.81-10.08-19.99-19.82-29.98-29.55-8.56-8.43,4.67-8.54,10.47-8.18,6.3.14,12.39-.38,18.65-.15,3.72.05,7.54.39,11.23-.12,7.32-.93,10.38-8.65,15.22-13.26,6.2-6.61,13.17-13.10,19.62-19.49,3.65-3.73,12.84-14.15,15.32-4.17.96,45.85-11.81,34.08,36.97,36.39,10.42-.02,20.84-.12,31.22.86,7.47.29,13.46,1.4,13.4,10.36.92,8.92,1.74,18.14,2.31,27.18,1.02,9.68,2.54,19.16,2.02,28.77-.17,4.69-.74,9.4-.64,14.09.53,7.78,1.06,12.15-8.35,11.44-4.74-.21-9.47.86-14.22,1.27-5.43.41-10.92.22-16.25.63h-.28ZM259.31,354.30c6.35-.36,14.03,1.04,19.72-2.47,2.15-1.76,2.28-5.29,2.6-8.45.57-5.34.69-10.75,1.07-16.03.42-5.79-1.61-7.67-6-3.12-8.27,7.63-16.78,15.16-24.6,23.27-8.11,8.58-.14,6.78,6.93,6.8h.28ZM295.55,418.88c5.1-5.55,10.94-10.69,15.89-16.48,7.3-8.32,15.78-15.82,23.68-23.50,6.26-5.7,13.74-10.04,20.08-15.64,1.03-.84,2.48-2.55,1.54-3.38-1.4-1.33-4.65-1.30-6.68-1.45-8.76-.59-17.77-.63-26.73-.56-10.74-.51-21.82-.36-32.57-.29-5.19-.23-8.1,2.02-8.23,7.38-.62,9.05-.75,17.75-.92,26.85-.01,9.69.79,19.41.59,29.09,0,2.85-.78,6.55-.05,9.31.92,2.11,3.04-.78,3.96-1.63,2.95-3.32,6.29-6.32,9.25-9.49l.20-.21ZM246.4,406.99c3.4,3.47,6.94,7.11,10.24,10.73,6.10,6.47,11.41,14.08,18.40,19.52,3.71,2.04,2.92-4.68,3.35-6.88.30-4.03.62-8.11.76-12.15.19-7.13-.63-14.43-.46-21.68.41-8.50-.26-16.97.39-25.47.06-4.32,2.40-12.54-4.07-12.75-11.94.25-24.04-.07-35.92,1.04-9.09-.46-19.06-.66-28.04-.02-2.08.25-5.42-.09-6.84,1.26-.35.47-.17,1.16.45,2.03,2.19,2.70,4.88,5.22,7.30,7.78,6.66,6.63,14.46,14.01,20.95,21.15,4.65,4.82,8.65,10.46,13.30,15.22l.19.19Z" />
                  <path d="M205.95,352.08c-10.93-3.6-10.3-15.43-3.77-23.03,8.59-10.56,18.41-20.09,28.31-29.42,12.53-11.93,24.27-24.61,38.04-35.16,6.87-5.99,14.74-19.27,25.18-12.39,12.52,8.75,3.86,22.67-3.77,31.72-4.35,5.48-9.27,10.72-14.08,15.90-6.25,6.89-13.15,12.14-19.61,18.12-7.11,6.86-13.85,14.24-20.93,21.12-7.53,7.33-17.90,16.36-29.11,13.20l-.25-.07ZM211.49,347.24c13.21-.96,31.36-24.75,41.34-33.93,8.87-7.84,17.91-15.82,25.69-25.02,5.11-6.46,22.85-23.39,13.70-31.07-4.51-2.54-9.65,2.56-12.95,5.53-3.31,3.05-6.84,5.69-10.39,8.34-9.34,6.67-16.98,15.18-25.18,23.15-5.01,4.80-10.34,9.61-15.23,14.59-7.81,8.13-16.19,16.06-22.72,25.48-3.89,5.76-2.30,12.94,5.51,12.93h.24Z" />
                  <path d="M247.59,230.67c-26.61,6.76-49.96-17.81-46.66-44.07,4.37-38.58,54.95-51.23,72.93-15.01,11.11,22.28-1.39,52.99-26.02,59.01l-.26.07ZM243.03,225.78c18.21-2.11,31.41-21.94,28.76-39.88-6.08-40.34-59.27-38.39-65.01,1.05-3.04,20.76,14.55,41.84,35.99,38.86l.27-.04Z" />
                </svg>
              </div>
              <span
                style={{
                  'font-size': '18px',
                  'font-weight': '400',
                  'font-family': navTokens.typography.brandFamily,
                  color: 'white',
                }}
              >
                Thoughtful App Co.
              </span>
            </div>
            <p
              style={{
                margin: '0 0 20px 0',
                'font-size': '14px',
                'line-height': '1.6',
                color: 'rgba(255,255,255,0.5)',
                'max-width': '280px',
              }}
            >
              Building technology that enables, not enslaves. An open contribution venture studio.
            </p>
            {/* Social Links */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* GitHub */}
              <a
                href="https://github.com/Thoughtful-App-Co"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                style={{
                  width: '36px',
                  height: '36px',
                  'border-radius': '8px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s ease',
                  'text-decoration': 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.gg/mnWCPNGR"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                style={{
                  width: '36px',
                  height: '36px',
                  'border-radius': '8px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s ease',
                  'text-decoration': 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              {/* Bluesky */}
              <a
                href="https://bsky.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Bluesky"
                style={{
                  width: '36px',
                  height: '36px',
                  'border-radius': '8px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s ease',
                  'text-decoration': 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </a>
            </div>

            {/* Podcast Plug */}
            <a
              href="https://humansonly.fm"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                'margin-top': '20px',
                padding: '12px 16px',
                background:
                  'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                'border-radius': '12px',
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'text-decoration': 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, rgba(255,107,107,0.25) 0%, rgba(78,205,196,0.25) 100%)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  'border-radius': '8px',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'flex-shrink': 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    'font-size': '13px',
                    'font-weight': '600',
                    color: 'white',
                    'line-height': '1.2',
                  }}
                >
                  Humans Only Podcast
                </div>
                <div
                  style={{
                    'font-size': '11px',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  humansonly.fm
                </div>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                style={{ 'margin-left': 'auto' }}
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          </div>

          {/* Apps Column */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                'font-size': '12px',
                'font-weight': '600',
                'letter-spacing': '1px',
                'text-transform': 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Apps
            </h4>
            <ul
              style={{
                margin: 0,
                padding: 0,
                'list-style': 'none',
                display: 'flex',
                'flex-direction': 'column',
                gap: '10px',
              }}
            >
              <For each={props.apps}>
                {(app) => (
                  <li>
                    <A
                      href={`/${app.id}`}
                      style={{
                        'font-size': '14px',
                        color: 'rgba(255,255,255,0.6)',
                        'text-decoration': 'none',
                        transition: 'color 0.2s ease',
                        display: 'inline-flex',
                        'align-items': 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          'border-radius': '50%',
                          background: app.color,
                        }}
                      />
                      {app.name}
                      <Show when={app.description}>
                        <span
                          style={{
                            'font-size': '11px',
                            color: 'rgba(255,255,255,0.3)',
                          }}
                        >
                          — {app.description}
                        </span>
                      </Show>
                    </A>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* Philosophy Column */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                'font-size': '12px',
                'font-weight': '600',
                'letter-spacing': '1px',
                'text-transform': 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Philosophy
            </h4>
            <ul
              style={{
                margin: 0,
                padding: 0,
                'list-style': 'none',
                display: 'flex',
                'flex-direction': 'column',
                gap: '12px',
              }}
            >
              <li style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                <DoodleHeart size={18} color="#FF6B6B" />
                <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                  Design for Human Good
                </span>
              </li>
              <li style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                <DoodleShield size={18} color="#4ECDC4" />
                <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                  Local-First Principles
                </span>
              </li>
              <li style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                <DoodleSparkle size={18} color="#FFE66D" />
                <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                  Anti-Dark Patterns
                </span>
              </li>
              <li style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                <DoodlePeople size={18} color="#9333EA" />
                <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                  Open Contribution
                </span>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4
              style={{
                margin: '0 0 16px 0',
                'font-size': '12px',
                'font-weight': '600',
                'letter-spacing': '1px',
                'text-transform': 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Resources
            </h4>
            <ul
              style={{
                margin: 0,
                padding: 0,
                'list-style': 'none',
                display: 'flex',
                'flex-direction': 'column',
                gap: '10px',
              }}
            >
              <li>
                <a
                  href="https://github.com/Thoughtful-App-Co/TACo"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.6)',
                    'text-decoration': 'none',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    'align-items': 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  Source Code
                  <ExternalLinkIcon />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Thoughtful-App-Co/TACo/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.6)',
                    'text-decoration': 'none',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    'align-items': 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  Report an Issue
                  <ExternalLinkIcon />
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/mnWCPNGR"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.6)',
                    'text-decoration': 'none',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    'align-items': 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  Discord Community
                  <ExternalLinkIcon />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Thoughtful-App-Co/TACo#contributing"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.6)',
                    'text-decoration': 'none',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    'align-items': 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  Contribute
                  <ExternalLinkIcon />
                </a>
              </li>
              <li>
                <A
                  href="/investors"
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255,255,255,0.6)',
                    'text-decoration': 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  Investors
                </A>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            'padding-top': isMobile() ? '20px' : '24px',
            'border-top': '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            'flex-direction': isMobile() ? 'column' : 'row',
            'justify-content': isMobile() ? 'center' : 'space-between',
            'align-items': 'center',
            'flex-wrap': 'wrap',
            gap: isMobile() ? '12px' : '16px',
            'text-align': isMobile() ? 'center' : 'left',
          }}
        >
          <p
            style={{
              margin: 0,
              'font-size': isMobile() ? '11px' : '13px',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            © {new Date().getFullYear()} Thoughtful App Co.
            {isMobile() ? '' : ' Technology for Human Good.'}
          </p>
          <div
            style={{
              display: 'flex',
              gap: isMobile() ? '16px' : '24px',
            }}
          >
            <A
              href="/pricing"
              style={{
                'font-size': '13px',
                color: 'rgba(255,255,255,0.3)',
                'text-decoration': 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              Pricing
            </A>
            <A
              href="/privacy"
              style={{
                'font-size': '13px',
                color: 'rgba(255,255,255,0.3)',
                'text-decoration': 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              Privacy
            </A>
            <A
              href="/terms"
              style={{
                'font-size': '13px',
                color: 'rgba(255,255,255,0.3)',
                'text-decoration': 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              Terms
            </A>
          </div>
        </div>
      </div>
    </footer>
  );
};
