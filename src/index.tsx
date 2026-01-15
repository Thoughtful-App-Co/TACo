/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route, Navigate } from '@solidjs/router';
import { App, LandingPage, AppPage } from './App';
import { PricingPage } from './components/PricingPage';
import { InvestorsPage } from './components/InvestorsPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { SettingsPage } from './components/SettingsPage';
import { HomePage } from './components/HomePage';
import { AuthProvider } from './lib/auth-context';
import { TempoApp } from './components/tempo/TempoApp';

// Initialize PWA service worker
import { initPWA } from './lib/pwa/register';
import { initInstallPrompt } from './lib/pwa/install-prompt';

// Initialize PWA
initPWA();
initInstallPrompt();

// Global styles
const globalStyles = document.createElement('style');
globalStyles.textContent = `
  /* Geist Sans - Variable Font */
  @font-face {
    font-family: 'Geist';
    src: url('/fonts/GeistVF.woff') format('woff');
    font-weight: 100 900;
    font-display: swap;
    font-style: normal;
  }

  /* Geist Mono - Variable Font */
  @font-face {
    font-family: 'Geist Mono';
    src: url('/fonts/GeistMonoVF.woff') format('woff');
    font-weight: 100 900;
    font-display: swap;
    font-style: normal;
  }

  /* Shupp - Brand Font */
  @font-face {
    font-family: 'Shupp';
    src: url('/fonts/Shupp.otf') format('opentype');
    font-weight: 400;
    font-display: swap;
    font-style: normal;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: #0A0A0F;
    color: #FAFAFA;
  }
  
  button {
    font-family: inherit;
  }
  
   /* Navigation dropdown animation */
   @keyframes dropdownFadeIn {
     from {
       opacity: 0;
       transform: translateX(-50%) translateY(-8px);
     }
     to {
       opacity: 1;
       transform: translateX(-50%) translateY(0);
     }
   }
   
   /* Mobile menu slide down animation */
   @keyframes slideDown {
     from {
       opacity: 0;
       transform: translateY(-8px);
     }
     to {
       opacity: 1;
       transform: translateY(0);
     }
   }
   
   /* Fade in animation */
   @keyframes fadeIn {
     from { opacity: 0; }
     to { opacity: 1; }
   }
   
   /* Tooltip animation */
   @keyframes tooltipFadeIn {
     from {
       opacity: 0;
       transform: translateX(-50%) translateY(4px);
     }
     to {
       opacity: 1;
       transform: translateX(-50%) translateY(0);
     }
   }
   
   /* Tooltip gradient border flow animation */
   @keyframes tooltipBorderFlow {
     0% {
       background-position: 0% 50%;
     }
     100% {
       background-position: 300% 50%;
     }
   }

   /* Spin animation */
   @keyframes spin {
     from { transform: rotate(0deg); }
     to { transform: rotate(360deg); }
   }

   /* Bounce animation */
   @keyframes bounce {
     0%, 100% { transform: translateY(0); }
     50% { transform: translateY(-4px); }
   }

   /* Slide Up animation */
   @keyframes slideUp {
     from { 
       opacity: 0;
       transform: translateY(20px);
     }
     to { 
       opacity: 1;
       transform: translateY(0);
     }
   }
  
  /* Focus visible for keyboard navigation */
  :focus-visible {
    outline: none;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
   /* Respect reduced motion preferences */
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
     html {
       scroll-behavior: auto;
     }
   }

   /* Responsive breakpoints */
   @media (max-width: 768px) {
     body {
       font-size: 14px;
     }
   }

   @media (max-width: 640px) {
     body {
       font-size: 13px;
     }
   }
`;
document.head.appendChild(globalStyles);

const root = document.getElementById('root');

if (root) {
  render(
    () => (
      <AuthProvider>
        <Router root={App}>
          <Route path="/" component={LandingPage} />
          <Route path="/home" component={HomePage} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/investors" component={InvestorsPage} />
          <Route path="/privacy" component={PrivacyPolicyPage} />
          <Route path="/terms" component={TermsOfServicePage} />
          <Route path="/settings" component={SettingsPage} />

          {/* Tempo app with nested routes */}
          <Route path="/tempo">
            <Route path="/" component={() => <Navigate href="/tempo/create" />} />
            <Route path="/create" component={TempoApp} />
            <Route path="/sessions" component={TempoApp} />
            <Route path="/sessions/:date" component={TempoApp} />
          </Route>

          {/* Echoprax app with nested routes */}
          <Route path="/echoprax">
            <Route path="/" component={AppPage} />
            <Route path="/workout/:workoutId" component={AppPage} />
            <Route path="/builder" component={AppPage} />
            <Route path="/builder/:workoutId" component={AppPage} />
            <Route path="/generator" component={AppPage} />
            <Route path="/areas" component={AppPage} />
            <Route path="/areas/:areaId" component={AppPage} />
            <Route path="/settings" component={AppPage} />
          </Route>

          {/* All other app routes - :appId handles base path, /* captures any sub-paths */}
          <Route path="/:appId/*" component={AppPage} />
        </Router>
      </AuthProvider>
    ),
    root
  );
}
