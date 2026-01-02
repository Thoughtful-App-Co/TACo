import { createSignal } from 'solid-js';

// Global menu state - shared across all apps
const [isMenuOpen, setIsMenuOpen] = createSignal(false);

export const appMenuStore = {
  isOpen: isMenuOpen,
  open: () => setIsMenuOpen(true),
  close: () => setIsMenuOpen(false),
  toggle: () => setIsMenuOpen(!isMenuOpen()),
};
