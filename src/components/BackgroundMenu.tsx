import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPanorama, faCheck } from '@fortawesome/free-solid-svg-icons';
import styles from './BackgroundMenu.module.scss';

export interface BackgroundMenuTheme {
  id: string;
  label: string;
}

export interface BackgroundMenuProps {
  themes: BackgroundMenuTheme[];
  activeId: string;
  onSelect: (id: string) => void;
}

// Mirrors the idioms App.tsx already uses for the résumé modal (Escape to
// close + refocus the trigger, ref-containment for outside-click/blur to
// dismiss, moving focus in on open) rather than inventing new ones for what
// is, structurally, the same "small dismissable overlay" problem.
export default function BackgroundMenu({ themes, activeId, onSelect }: BackgroundMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;

    const activeIndex = themes.findIndex((theme) => theme.id === activeId);
    itemRefs.current[activeIndex >= 0 ? activeIndex : 0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = itemRefs.current;
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
        return;
      }
      const currentIndex = items.findIndex((el) => el === document.activeElement);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === 'End') {
        const lastItem = items[items.length - 1];
        event.preventDefault();
        lastItem?.focus();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open, themes, activeId]);

  // Tab-ing focus out of the menu (not just clicking away) should close it
  // too — relatedTarget is the element focus is moving to. Only acts when
  // relatedTarget is an actual element: on iOS Safari, buttons don't
  // reliably receive focus from a tap, so tapping a different menu item can
  // blur the previously-focused one with relatedTarget null — treating that
  // as "focus left the menu" would close it before the tap's own click/
  // onSelect had a chance to fire, silently eating the selection.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget && !wrapperRef.current?.contains(event.relatedTarget)) {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef} onBlur={handleBlur}>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change background"
        onClick={() => setOpen((current) => !current)}
      >
        <FontAwesomeIcon icon={faPanorama} />
      </button>
      {open && (
        <div role="menu" aria-label="Background themes" className={styles.menu}>
          {themes.map((theme, index) => (
            <button
              key={theme.id}
              type="button"
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="menuitemradio"
              aria-checked={theme.id === activeId}
              className={styles.item}
              onClick={() => {
                onSelect(theme.id);
                close();
              }}
            >
              <span className={styles.checkSlot}>
                {theme.id === activeId && <FontAwesomeIcon icon={faCheck} />}
              </span>
              {theme.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
