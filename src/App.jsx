import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { Tooltip } from 'react-tooltip';
import StartMenu from './components/StartMenu.jsx';
import LandscapeBg from './components/LandscapeBg.jsx';
import Grid from './components/Grid.jsx';
import Resume from './components/Resume.jsx';
import { TOOLTIP_ID } from './constants.js';
import logo from './assets/img/lucasrasmussen-logo.svg';
import styles from './App.module.scss';
import 'react-tooltip/dist/react-tooltip.css';

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const [showResume, setShowResume] = useState(false);

  // Clicking the start button grows the modal via a CSS transition. Only once
  // that transition has finished do we swap the logo out for the resume, so it
  // never renders at the small logo size. `transition: all` fires one event per
  // animated property; re-setting the same value is a no-op in React, so the
  // extra events are harmless.
  const handleTransitionEnd = () => {
    if (expanded) setShowResume(true);
  };

  return (
    <div className={styles.app}>
      <LandscapeBg />
      <div
        className={`${styles.modal} ${expanded ? styles.resume : styles.logo}`}
        onTransitionEnd={handleTransitionEnd}
      >
        {showResume ? (
          <Resume />
        ) : (
          <img className={styles.pulser} src={logo} alt="Lucas Rasmussen" />
        )}
      </div>
      <Routes>
        <Route path="/" element={<Grid />} />
      </Routes>
      <StartMenu onLogoClick={() => setExpanded(true)} />
      <Tooltip id={TOOLTIP_ID} className="app-tooltip" classNameArrow="app-tooltip-arrow" />
    </div>
  );
}
