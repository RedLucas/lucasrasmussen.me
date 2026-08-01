import StartButton from './StartButton.jsx';
import StartActions from './StartActions.jsx';
import styles from './StartMenu.module.scss';

export default function StartMenu({ onLogoClick }) {
  return (
    <div className={styles.start}>
      <StartButton onClick={onLogoClick} />
      <StartActions />
    </div>
  );
}
