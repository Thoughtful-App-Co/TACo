/* @refresh reload */
import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';
import { App } from './App';

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
  
  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
document.head.appendChild(globalStyles);

const root = document.getElementById('root');

if (root) {
  render(() => (
    <Router>
      <App />
    </Router>
  ), root);
}
