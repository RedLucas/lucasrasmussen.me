import styles from './Grid.module.scss';

// Placeholder theme grid. It was disabled in the Vue app too (`grid: false`)
// and is kept as the `/` route so there's somewhere to hang real content.
const ENABLED = false;

const themes = [{ name: '' }, { name: '' }, { name: '' }];

export default function Grid() {
  if (!ENABLED) return null;

  return (
    <div className={styles.grid}>
      {themes.map((theme, index) => (
        <div key={index}>{theme.name}</div>
      ))}
    </div>
  );
}
