/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { App, LandingPage, AppPage } from './App';

// Global styles
const globalStyles = document.createElement('style');
globalStyles.textContent = `
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
`;
document.head.appendChild(globalStyles);

const root = document.getElementById('root');

if (root) {
  render(() => (
    <Router root={App}>
      <Route path="/" component={LandingPage} />
      <Route path="/:appId" component={AppPage} />
    </Router>
  ), root);
}
