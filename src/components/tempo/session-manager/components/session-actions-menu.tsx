import { Component, createSignal, Show, onCleanup } from 'solid-js';
import { DotsThreeVertical, PencilSimple, Copy, Trash } from 'phosphor-solid';
import { Button } from '../../ui/button';
import { tempoDesign } from '../../theme/tempo-design';
import type { Session } from '../../lib/types';
import { logger } from '../../../../lib/logger';

const log = logger.create('SessionActionsMenu');

interface SessionActionsMenuProps {
  session: Session;
  onEdit?: (session: Session) => void;
  onDelete?: (session: Session) => void;
  onDuplicate?: (session: Session) => void;
}

export const SessionActionsMenu: Component<SessionActionsMenuProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let menuRef: HTMLDivElement | undefined;
  let triggerRef: HTMLButtonElement | undefined;

  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuRef &&
      triggerRef &&
      !menuRef.contains(event.target as Node) &&
      !triggerRef.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  const setupClickOutsideListener = () => {
    document.addEventListener('click', handleClickOutside);
  };

  const removeClickOutsideListener = () => {
    document.removeEventListener('click', handleClickOutside);
  };

  // Clean up listener on component unmount
  onCleanup(() => {
    removeClickOutsideListener();
  });

  const toggleMenu = (event: MouseEvent) => {
    event.stopPropagation();
    const newState = !isOpen();
    setIsOpen(newState);

    if (newState) {
      // Add listener when menu opens
      setupClickOutsideListener();
    } else {
      // Remove listener when menu closes
      removeClickOutsideListener();
    }
  };

  const handleAction = (
    action: 'edit' | 'delete' | 'duplicate',
    callback?: (session: Session) => void
  ) => {
    return (event: MouseEvent) => {
      event.stopPropagation();
      setIsOpen(false);
      removeClickOutsideListener();

      if (callback) {
        log.debug(`Action triggered: ${action}`, { sessionDate: props.session.date });
        callback(props.session);
      }
    };
  };

  const menuItemBaseStyle = {
    display: 'flex',
    'align-items': 'center',
    gap: tempoDesign.spacing.sm,
    width: '100%',
    padding: `${tempoDesign.spacing.sm} ${tempoDesign.spacing.md}`,
    background: 'transparent',
    border: 'none',
    color: tempoDesign.colors.foreground,
    'font-size': tempoDesign.typography.sizes.sm,
    'font-family': tempoDesign.typography.fontFamily,
    cursor: 'pointer',
    transition: `background ${tempoDesign.transitions.fast}`,
    'text-align': 'left' as const,
  };

  const menuItemDestructiveStyle = {
    ...menuItemBaseStyle,
    color: tempoDesign.colors.destructive,
  };

  return (
    <div style={{ position: 'relative' }}>
      <Button
        ref={triggerRef}
        variant="icon"
        size="icon"
        onClick={toggleMenu}
        aria-label="Session actions"
        aria-expanded={isOpen()}
        aria-haspopup="true"
      >
        <DotsThreeVertical size={20} weight="bold" />
      </Button>

      <Show when={isOpen()}>
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            'margin-top': tempoDesign.spacing.xs,
            'min-width': '160px',
            background: tempoDesign.colors.card,
            border: `1px solid ${tempoDesign.colors.cardBorder}`,
            'border-radius': tempoDesign.radius.md,
            'box-shadow': tempoDesign.shadows.lg,
            'z-index': '50',
            overflow: 'hidden',
          }}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Edit Session */}
          <button
            style={menuItemBaseStyle}
            onClick={handleAction('edit', props.onEdit)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tempoDesign.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            role="menuitem"
          >
            <PencilSimple size={16} />
            <span>Edit Session</span>
          </button>

          {/* Duplicate Session */}
          <button
            style={menuItemBaseStyle}
            onClick={handleAction('duplicate', props.onDuplicate)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tempoDesign.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            role="menuitem"
          >
            <Copy size={16} />
            <span>Duplicate Session</span>
          </button>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: tempoDesign.colors.border,
              margin: `${tempoDesign.spacing.xs} 0`,
            }}
          />

          {/* Delete Session */}
          <button
            style={menuItemDestructiveStyle}
            onClick={handleAction('delete', props.onDelete)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            role="menuitem"
          >
            <Trash size={16} />
            <span>Delete Session</span>
          </button>
        </div>
      </Show>
    </div>
  );
};

export default SessionActionsMenu;
