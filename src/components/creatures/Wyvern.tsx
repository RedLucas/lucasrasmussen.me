import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A gliding wyvern, in profile: broader, more angular bat-like wings than
// the hawk's, spread above/below the shoulder and flapping slowly
// together, with a long tail trailing behind (left) and the head facing
// right (the default drift direction).
export default function Wyvern({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(48,30)">
        <g className={rig.wingSlow} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -16,-30 L -4,-40 L 2,-28 L 8,-34 L 6,-14 Z" />
        </g>
      </g>
      <g transform="translate(48,30)">
        <g className={rig.wingSlowMirror} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -16,30 L -4,40 L 2,28 L 8,34 L 6,14 Z" />
        </g>
      </g>

      {/* Body, tail, head — static silhouette. */}
      <path d="M 36,34 C 28,26 18,22 8,30 C 18,32 26,34 32,40 Z" />
      <ellipse cx="50" cy="30" rx="15" ry="8" />
      <circle cx="68" cy="28" r="6" />
      <path d="M 71,24 L 78,20 L 70,29 Z" />
    </svg>
  );
}
