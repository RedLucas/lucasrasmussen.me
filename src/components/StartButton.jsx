import { TOOLTIP_ID } from '../constants.js';
import logo from '../assets/img/lucasrasmussen-logo.svg';
import styles from './StartButton.module.scss';

export default function StartButton({ expanded, onToggle, ref }) {
  const label = expanded ? 'Close Résumé' : 'Open Résumé';

  return (
    <button
      ref={ref}
      type="button"
      className={styles.button}
      onClick={onToggle}
      aria-label={label}
      data-tooltip-id={TOOLTIP_ID}
      data-tooltip-content={label}
      data-tooltip-place="top-end"
    >
      <img src={logo} alt="" />
    </button>
  );
}
