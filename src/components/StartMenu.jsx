import StartButton from './StartButton.jsx';
import StartActions from './StartActions.jsx';
import styles from './StartMenu.module.scss';

export default function StartMenu({
  expanded,
  onToggle,
  buttonRef,
  ref,
  themes,
  activeThemeId,
  onSelectTheme,
  spaceMode,
  onToggleSpaceMode,
}) {
  return (
    <div className={styles.start} ref={ref}>
      <StartButton expanded={expanded} onToggle={onToggle} ref={buttonRef} />
      <StartActions
        themes={themes}
        activeThemeId={activeThemeId}
        onSelectTheme={onSelectTheme}
        spaceMode={spaceMode}
        onToggleSpaceMode={onToggleSpaceMode}
      />
    </div>
  );
}
