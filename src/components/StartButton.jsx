import { TOOLTIP_ID } from '../constants.js';
import logo from '../assets/img/lucasrasmussen-logo.svg';
import styles from './StartButton.module.scss';

export default function StartButton({ onClick }) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      data-tooltip-id={TOOLTIP_ID}
      data-tooltip-content="Click Here!"
      data-tooltip-place="top-end"
    >
      <img src={logo} alt="Open resume" />
    </button>
  );
}
