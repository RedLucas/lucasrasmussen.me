import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShower, faRocket } from '@fortawesome/free-solid-svg-icons';
import BackgroundMenu, { type BackgroundMenuTheme } from './BackgroundMenu';
import CreditsMenu from './CreditsMenu';
import styles from './StartActions.module.scss';

function clearCache() {
  window.localStorage.clear();
  window.location.reload();
}

export interface StartActionsProps {
  themes: BackgroundMenuTheme[];
  activeThemeId: string;
  onSelectTheme: (id: string) => void;
  spaceMode: boolean;
  onToggleSpaceMode: () => void;
}

// The background control isn't a one-shot action like the other two (it's a
// stateful dropdown), so it renders as its own <BackgroundMenu> in the same
// taskbar slot rather than living in a generic action list.
export default function StartActions({
  themes,
  activeThemeId,
  onSelectTheme,
  spaceMode,
  onToggleSpaceMode,
}: StartActionsProps) {
  return (
    <div className={styles.actions}>
      <button type="button" aria-label="Clear Cache" className={styles.action} onClick={clearCache}>
        <FontAwesomeIcon icon={faShower} />
      </button>
      <BackgroundMenu themes={themes} activeId={activeThemeId} onSelect={onSelectTheme} />
      <button
        type="button"
        aria-label="Space Mode"
        aria-pressed={spaceMode}
        className={styles.action}
        onClick={onToggleSpaceMode}
      >
        <FontAwesomeIcon icon={faRocket} />
      </button>
      <CreditsMenu />
    </div>
  );
}
