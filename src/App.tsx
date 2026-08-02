import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Route, Routes } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import StartMenu from './components/StartMenu';
import Grid from './components/Grid';
import Resume from './components/Resume';
import BurnTransition from './components/BurnTransition';
import { BACKGROUND_THEMES, useBackgroundTheme } from './backgrounds';
import { useSpaceMode } from './spaceMode';
import styles from './App.module.scss';

export default function App() {
  // There's no more grow/shrink morph, so opening and showing the resume
  // happen together — a single `open` state replaces the old
  // expanded/showResume pair entirely.
  const [open, setOpen] = useState(false);
  const { theme, themeId, selectTheme } = useBackgroundTheme();
  const { spaceMode, toggleSpaceMode } = useSpaceMode();
  const [burning, setBurning] = useState(false);
  // Separate from `burning`: setup (compile/capture/texture-upload) can take
  // a while, especially on slower devices. Only flip the resume/modal hidden
  // once the shader is actually about to draw its first frame, so there's
  // never a window where the close button is gone, the resume is hidden, and
  // nothing has replaced it yet.
  const [burnReady, setBurnReady] = useState(false);

  // Containment checks for the backdrop-click dismiss (see handleBackdropClick).
  const modalRef = useRef<HTMLDivElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);
  // Focus management: return focus to the trigger on close, move it into the
  // resume on open.
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const resumeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const el = resumeRef.current;
    if (!el) return undefined;
    // Focus needs to land here so keyboard/AT users get the newly-opened
    // content, but this specific call is scripted focus triggered from the
    // Résumé button's click handler, not a real keyboard interaction with
    // this element — Chromium's :focus-visible heuristic recognizes that
    // and stays quiet, but Safari's doesn't, so this alone was enough to
    // flash the accent outline around the whole panel on iOS. Suppress the
    // ring only for this one programmatic focus; it's cleared on the
    // panel's own next focus-related event, so a real subsequent keyboard
    // focus (tabbing away and back) still rings normally.
    el.dataset.justOpened = 'true';
    el.focus();
    const clearFlag = () => delete el.dataset.justOpened;
    el.addEventListener('focus', clearFlag, { once: true });
    el.addEventListener('blur', clearFlag, { once: true });
    return () => {
      el.removeEventListener('focus', clearFlag);
      el.removeEventListener('blur', clearFlag);
    };
  }, [open]);

  // Starts the burn rather than closing immediately. All four dismiss paths
  // (X button, Escape, backdrop click, Start-button toggle) already funnel
  // through this, so none of them need to change.
  const closeResume = useCallback(() => {
    if (burning || !open) return; // already closing, or nothing open to close
    setBurnReady(false);
    setBurning(true);
  }, [burning, open]);

  // Fired by BurnTransition once its shader is actually ready to paint —
  // only then is it safe to hide the live resume and make the modal
  // transparent, so the burn's first visible frame is the fire itself, not a
  // gap.
  const handleBurnReady = useCallback(() => setBurnReady(true), []);

  // The actual teardown, once BurnTransition (paper + lingering smoke)
  // finishes, or fails open. By this point the canvas has already faded to
  // nothing, so the modal can simply unmount rather than needing its own
  // closing transition. The Start button is always mounted, so focusing it
  // synchronously here is safe.
  const handleBurnComplete = useCallback(() => {
    setBurning(false);
    setBurnReady(false);
    setOpen(false);
    startButtonRef.current?.focus();
  }, []);

  const toggleResume = () => (open ? closeResume() : setOpen(true));

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeResume();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, closeResume]);

  // A plain `event.target === event.currentTarget` check doesn't work here:
  // LandscapeBg renders an absolutely-positioned <canvas> with no
  // pointer-events: none directly under everything, so target is that canvas
  // for any "empty space" click, never .app itself. Containment checks are
  // correct regardless of what's under the click.
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!open) return;
    const target = event.target as Node;
    if (modalRef.current?.contains(target)) return;
    if (startMenuRef.current?.contains(target)) return;
    closeResume();
  };

  return (
    <div className={styles.app} onClick={handleBackdropClick}>
      <theme.Component spaceMode={spaceMode} />
      {open && (
        <div
          ref={modalRef}
          className={`${styles.modal} ${burnReady ? styles.burning : ''}`}
          role="dialog"
          aria-modal="true"
        >
          {/* A plain wrapper, not a Resume prop — Resume stays purely about
              content; App owns modal chrome, including hiding it during the
              burn so burned-through regions reveal the landscape behind the
              (now-transparent) modal rather than the still-intact resume
              sitting underneath the burn canvas. */}
          <div className={burnReady ? styles.hiddenResume : undefined}>
            <Resume ref={resumeRef} />
          </div>
          {!burning && (
            <button
              type="button"
              className={styles.close}
              onClick={closeResume}
              aria-label="Close résumé"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      )}
      {/* A sibling of .modal, not a child — .modal has overflow:hidden for
          its ordinary (non-burning) layout, which would otherwise clip the
          burn's smoke dead at the résumé's own edges. This canvas covers
          the whole viewport instead and is told where the résumé itself
          sits (see BurnTransition.tsx's uRect), so the paper still burns in
          exactly the same place. */}
      {burning && (
        <BurnTransition
          sourceNodeRef={resumeRef}
          onComplete={handleBurnComplete}
          onReady={handleBurnReady}
          durationMs={1600}
        />
      )}
      <Routes>
        <Route path="/" element={<Grid />} />
      </Routes>
      <StartMenu
        ref={startMenuRef}
        buttonRef={startButtonRef}
        expanded={open}
        onToggle={toggleResume}
        themes={BACKGROUND_THEMES}
        activeThemeId={themeId}
        onSelectTheme={selectTheme}
        spaceMode={spaceMode}
        onToggleSpaceMode={toggleSpaceMode}
      />
    </div>
  );
}
