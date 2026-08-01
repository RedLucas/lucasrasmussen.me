import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShower } from '@fortawesome/free-solid-svg-icons';
import { TOOLTIP_ID } from '../constants.js';
import styles from './StartActions.module.scss';

function clearCache() {
  window.localStorage.clear();
  window.location.reload();
}

const actions = [
  {
    name: 'Clear Cache',
    action: clearCache,
    icon: faShower,
    tooltip: 'Clean Caches',
  },
];

export default function StartActions() {
  return (
    <div className={styles.actions}>
      {actions
        .filter((action) => action.icon)
        .map((action) => (
          <button
            key={action.name}
            type="button"
            aria-label={action.name}
            className={styles.action}
            onClick={action.action}
            data-tooltip-id={TOOLTIP_ID}
            data-tooltip-content={action.tooltip}
            data-tooltip-place="top-start"
          >
            <FontAwesomeIcon icon={action.icon} />
          </button>
        ))}
    </div>
  );
}
