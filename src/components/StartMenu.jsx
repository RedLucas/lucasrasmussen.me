import StartButton from './StartButton.jsx';
import StartActions from './StartActions.jsx';
import styles from './StartMenu.module.scss';

export default function StartMenu({ expanded, onToggle, buttonRef, ref }) {
  return (
    <div className={styles.start} ref={ref}>
      <StartButton expanded={expanded} onToggle={onToggle} ref={buttonRef} />
      <StartActions />
    </div>
  );
}
