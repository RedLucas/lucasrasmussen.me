import type { Ref } from 'react';
import logo from '../assets/img/lucasrasmussen-logo.svg';
import styles from './StartButton.module.scss';

export interface StartButtonProps {
  expanded: boolean;
  onToggle: () => void;
  ref?: Ref<HTMLButtonElement> | undefined;
}

export default function StartButton({ expanded, onToggle, ref }: StartButtonProps) {
  const label = expanded ? 'Close Résumé' : 'Open Résumé';

  return (
    <button ref={ref} type="button" className={styles.button} onClick={onToggle} aria-label={label}>
      <img src={logo} alt="" />
    </button>
  );
}
