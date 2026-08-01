import logo from '../assets/img/lucasrasmussen-logo.svg';
import styles from './StartButton.module.scss';

export default function StartButton({ expanded, onToggle, ref }) {
  const label = expanded ? 'Close Résumé' : 'Open Résumé';

  return (
    <button ref={ref} type="button" className={styles.button} onClick={onToggle} aria-label={label}>
      <img src={logo} alt="" />
    </button>
  );
}
