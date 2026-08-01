import styles from './WaveOverlay.module.scss';

export interface WaveOverlayProps {
  top: string;
  color?: string;
}

// A thin, gently drifting wave-crest line — see the stylesheet's own
// comment for why this needs to exist as a separate DOM layer at all.
export default function WaveOverlay({ top, color = 'rgba(255,255,255,0.4)' }: WaveOverlayProps) {
  return (
    <svg
      className={styles.wave}
      style={{ top }}
      aria-hidden="true"
      viewBox="0 0 400 22"
      preserveAspectRatio="none"
    >
      <path
        d="M -20,11 C 20,3 60,19 100,11 C 140,3 180,19 220,11 C 260,3 300,19 340,11 C 380,3 420,19 460,11"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
