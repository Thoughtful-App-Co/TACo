import { Component, JSX } from 'solid-js';
import { appMenuStore } from '../../stores/app-menu-store';

interface AppMenuTriggerProps {
  children: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
}

export const AppMenuTrigger: Component<AppMenuTriggerProps> = (props) => {
  return (
    <button
      onClick={() => appMenuStore.open()}
      aria-label="Open app menu"
      aria-haspopup="true"
      aria-expanded={appMenuStore.isOpen()}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        'align-items': 'center',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        ...props.style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.opacity = '0.9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '1';
      }}
      class={props.class}
    >
      {props.children}
    </button>
  );
};
