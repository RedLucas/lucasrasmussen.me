import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { Tooltip } from 'react-tooltip';
import StartMenu from './components/StartMenu.jsx';
import LandscapeBg from './components/LandscapeBg.jsx';
import Grid from './components/Grid.jsx';
import { TOOLTIP_ID } from './constants.js';
import logo from './assets/img/lucasrasmussen-logo.svg';
import styles from './App.module.scss';
import 'react-tooltip/dist/react-tooltip.css';

const RESUME_URL = '//registry.jsonresume.org/redlucas';

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeReady, setResumeReady] = useState(false);

  // Clicking the start button grows the modal via a CSS transition. Only once
  // that transition has finished do we swap the logo out for the resume
  // iframe, so the iframe never renders at the small logo size. `transition:
  // all` fires one event per animated property; re-setting the same URL is a
  // no-op in React, so the extra events are harmless.
  const handleTransitionEnd = () => {
    if (expanded) setResumeUrl(RESUME_URL);
  };

  return (
    <div className={styles.app}>
      <LandscapeBg />
      <div
        className={`${styles.modal} ${expanded ? styles.resume : styles.logo}`}
        onTransitionEnd={handleTransitionEnd}
      >
        {resumeUrl ? (
          <iframe
            title="Resume"
            src={`${resumeUrl}?theme=flat`}
            className={resumeReady ? undefined : styles.hidden}
            onLoad={() => setResumeReady(true)}
          />
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
