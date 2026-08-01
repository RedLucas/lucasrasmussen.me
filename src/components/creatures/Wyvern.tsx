import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A gliding wyvern: broader, more angular bat-like wings than the hawk's,
// flapping slowly together, plus a long tail trailing behind.
export default function Wyvern({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(48,28)">
        <g className={rig.wingSlow} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -30,-16 L -40,-4 L -28,2 L -34,8 L -14,6 Z" />
        </g>
      </g>
      <g transform="translate(48,28)">
        <g className={rig.wingSlowMirror} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L 30,-16 L 40,-4 L 28,2 L 34,8 L 14,6 Z" />
        </g>
      </g>

      {/* Body, head, tail — static silhouette. */}
      <path d="M 34,44 C 26,50 18,52 10,48 C 20,44 26,38 30,30 Z" />
      <ellipse cx="50" cy="32" rx="9" ry="13" />
      <circle cx="52" cy="14" r="6" />
      <path d="M 48,10 L 42,8 L 49,15 Z" />
    </svg>
  );
}
