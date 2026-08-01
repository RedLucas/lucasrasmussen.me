import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPanorama, faCheck } from '@fortawesome/free-solid-svg-icons';
import { TOOLTIP_ID } from '../constants.js';
import styles from './BackgroundMenu.module.scss';

// Mirrors the idioms App.jsx already uses for the résumé modal (Escape to
// close + refocus the trigger, ref-containment for outside-click/blur to
// dismiss, moving focus in on open) rather than inventing new ones for what
// is, structurally, the same "small dismissable overlay" problem.
export default function BackgroundMenu({ themes, activeId, onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  const activeTheme = themes.find((theme) => theme.id === activeId) ?? themes[0];

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;

    const activeIndex = themes.findIndex((theme) => theme.id === activeId);
    itemRefs.current[activeIndex >= 0 ? activeIndex : 0]?.focus();

    const handleKeyDown = (event) => {
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
        event.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open, themes, activeId]);

  // Tab-ing focus out of the menu (not just clicking away) should close it
  // too — relatedTarget is the element focus is moving to.
  const handleBlur = (event) => {
    if (!wrapperRef.current?.contains(event.relatedTarget)) setOpen(false);
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
        data-tooltip-id={TOOLTIP_ID}
        data-tooltip-content={`Background: ${activeTheme.label}`}
        data-tooltip-place="top-start"
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
