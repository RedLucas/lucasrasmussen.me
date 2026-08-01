import type { Ref } from 'react';
import StartButton from './StartButton';
import StartActions, { type StartActionsProps } from './StartActions';
import styles from './StartMenu.module.scss';

export interface StartMenuProps extends StartActionsProps {
  expanded: boolean;
  onToggle: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  ref?: Ref<HTMLDivElement>;
}

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
}: StartMenuProps) {
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
