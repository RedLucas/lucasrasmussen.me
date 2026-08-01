import { useCallback, useEffect, useRef, useState } from 'react';
import { Route, Routes } from 'react-router';
import { Tooltip } from 'react-tooltip';
import StartMenu from './components/StartMenu.jsx';
import LandscapeBg from './components/LandscapeBg.jsx';
import Grid from './components/Grid.jsx';
import Resume from './components/Resume.jsx';
import BurnTransition from './components/BurnTransition.jsx';
import { TOOLTIP_ID } from './constants.js';
import logo from './assets/img/lucasrasmussen-logo.svg';
import styles from './App.module.scss';
import 'react-tooltip/dist/react-tooltip.css';

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [burning, setBurning] = useState(false);
  // Separate from `burning`: setup (compile/capture/texture-upload) can take
  // a while, especially on slower devices. Only flip the resume/modal hidden
  // once the shader is actually about to draw its first frame, so there's
  // never a window where the close button is gone, the resume is hidden, and
  // nothing has replaced it yet.
  const [burnReady, setBurnReady] = useState(false);

  // Containment checks for the backdrop-click dismiss (see handleBackdropClick).
  const modalRef = useRef(null);
  const startMenuRef = useRef(null);
  // Focus management: return focus to the trigger on close, move it into the
  // resume on open.
  const startButtonRef = useRef(null);
  const resumeRef = useRef(null);

  // The resume only mounts once showResume flips true, so its ref isn't
  // populated until after that commit — an effect waits for it correctly,
  // unlike closeResume's synchronous focus call above.
  useEffect(() => {
    if (showResume) resumeRef.current?.focus();
  }, [showResume]);

  // Starts the burn rather than closing immediately. All four dismiss paths
  // (X button, Escape, backdrop click, Start-button toggle) already funnel
  // through this, so none of them need to change.
  const closeResume = useCallback(() => {
    if (burning) return; // already closing — a second Escape/click is a no-op
    if (!showResume) {
      // Interrupted mid-open: the resume never fully appeared, so there's
      // nothing to burn — same instant collapse as before.
      setExpanded(false);
      startButtonRef.current?.focus();
      return;
    }
    setBurnReady(false);
    setBurning(true);
  }, [burning, showResume]);

  // Fired by BurnTransition once its shader is actually ready to paint —
  // only then is it safe to hide the live resume and make the modal
  // transparent, so the burn's first visible frame is the fire itself, not a
  // gap.
  const handleBurnReady = useCallback(() => setBurnReady(true), []);

  // The actual teardown, once BurnTransition finishes (or fails open).
  // Swaps content back to the logo before the shrink transition starts,
  // mirroring how opening only reveals the resume after the grow transition
  // has already finished — the resume is never visible except at full size.
  // The Start button is always mounted, so focusing it synchronously here is
  // safe.
  const handleBurnComplete = useCallback(() => {
    setBurning(false);
    setBurnReady(false);
    setShowResume(false);
    setExpanded(false);
    startButtonRef.current?.focus();
  }, []);

  const toggleResume = () => (expanded ? closeResume() : setExpanded(true));

  // Clicking the start button grows the modal via a CSS transition. Only once
  // that transition has finished do we swap the logo out for the resume, so it
  // never renders at the small logo size. `transition: all` fires one event per
  // animated property; re-setting the same value is a no-op in React, so the
  // extra events are harmless.
  const handleTransitionEnd = () => {
    if (expanded) setShowResume(true);
  };

  useEffect(() => {
    if (!expanded) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeResume();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded, closeResume]);

  // A plain `event.target === event.currentTarget` check doesn't work here:
  // LandscapeBg renders an absolutely-positioned <canvas> with no
  // pointer-events: none directly under everything, so target is that canvas
  // for any "empty space" click, never .app itself. Containment checks are
  // correct regardless of what's under the click.
  const handleBackdropClick = (event) => {
    if (!expanded) return;
    if (modalRef.current?.contains(event.target)) return;
    if (startMenuRef.current?.contains(event.target)) return;
    closeResume();
  };

  return (
    <div className={styles.app} onClick={handleBackdropClick}>
      <LandscapeBg />
      <div
        ref={modalRef}
        className={`${styles.modal} ${expanded ? styles.resume : styles.logo} ${burnReady ? styles.burning : ''}`}
        onTransitionEnd={handleTransitionEnd}
        role={showResume ? 'dialog' : undefined}
        aria-modal={showResume ? 'true' : undefined}
      >
        {showResume ? (
          <>
            {/* A plain wrapper, not a Resume prop — Resume stays purely
                about content; App owns modal chrome, including hiding it
                during the burn so burned-through regions reveal the
                landscape behind the (now-transparent) modal rather than the
                still-intact resume sitting underneath the burn canvas. */}
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
                <i className="fa fa-times" />
              </button>
            )}
            {burning && (
              <BurnTransition
                sourceNodeRef={resumeRef}
                onComplete={handleBurnComplete}
                onReady={handleBurnReady}
                durationMs={1100}
              />
            )}
          </>
        ) : (
          <img className={styles.pulser} src={logo} alt="Lucas Rasmussen" />
        )}
      </div>
      <Routes>
        <Route path="/" element={<Grid />} />
      </Routes>
      <StartMenu
        ref={startMenuRef}
        buttonRef={startButtonRef}
        expanded={expanded}
        onToggle={toggleResume}
      />
      <Tooltip id={TOOLTIP_ID} className="app-tooltip" classNameArrow="app-tooltip-arrow" />
    </div>
  );
}
