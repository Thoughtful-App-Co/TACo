/**
 * Modal - Reusable modal dialog component
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, JSX } from 'solid-js';
import { IconX } from '../../pipeline/ui/Icons';

/**
 * Theme type for Modal component styling
 */
export interface ThemeType {
  colors: {
    primary: string;
    secondary: string;
    text: string;
    textMuted: string;
    background: string;
    surface: string;
    border: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  currentTheme: () => ThemeType;
  maxWidth?: string;
}

// Animation keyframes for modal fade-in
const modalKeyframes = `
  @keyframes modal-fade-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes modal-backdrop-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const Modal: Component<ModalProps> = (props) => {
  const theme = () => props.currentTheme();
  const maxWidth = () => props.maxWidth || '560px';

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const backdropStyle = (): JSX.CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    'backdrop-filter': 'blur(8px)',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'z-index': 1000,
    padding: '20px',
    animation: 'modal-backdrop-fade 0.2s ease-out forwards',
  });

  const modalContainerStyle = (): JSX.CSSProperties => ({
    background: theme().colors.surface,
    'border-radius': '16px',
    'max-width': maxWidth(),
    width: '100%',
    'max-height': '90vh',
    display: 'flex',
    'flex-direction': 'column',
    border: `1px solid ${theme().colors.border}`,
    'box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    animation: 'modal-fade-in 0.25s ease-out forwards',
  });

  const headerStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    padding: '20px 24px',
    'border-bottom': `1px solid ${theme().colors.border}`,
    'flex-shrink': 0,
  });

  const titleStyle = (): JSX.CSSProperties => ({
    margin: 0,
    'font-size': '20px',
    'font-family': theme().fonts.heading,
    'font-weight': '600',
    color: theme().colors.text,
  });

  const closeButtonStyle = (): JSX.CSSProperties => ({
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    color: theme().colors.textMuted,
    transition: 'color 0.15s ease',
    'border-radius': '6px',
  });

  const contentStyle = (): JSX.CSSProperties => ({
    padding: '24px',
    overflow: 'auto',
    flex: 1,
  });

  return (
    <Show when={props.isOpen}>
      <style>{modalKeyframes}</style>
      <div style={backdropStyle()} onClick={handleBackdropClick}>
        <div style={modalContainerStyle()}>
          {/* Header */}
          <div style={headerStyle()}>
            <h2 style={titleStyle()}>{props.title}</h2>
            <button
              onClick={props.onClose}
              style={closeButtonStyle()}
              onMouseOver={(e) => {
                e.currentTarget.style.color = theme().colors.text;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = theme().colors.textMuted;
              }}
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Content - scrollable */}
          <div style={contentStyle()}>{props.children}</div>
        </div>
      </div>
    </Show>
  );
};

export default Modal;
