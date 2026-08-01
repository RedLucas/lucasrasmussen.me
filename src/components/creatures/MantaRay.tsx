import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// An alien sky-manta gliding through the aurora: broad, flat wings undulate
// slowly together, with a long thin tail trailing behind.
export default function MantaRay({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(48,30)">
        <g className={rig.wingSlow} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,-4 L -40,-14 L -36,4 L -8,8 Z" />
        </g>
      </g>
      <g transform="translate(48,30)">
        <g className={rig.wingSlowMirror} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,-4 L 40,-14 L 36,4 L 8,8 Z" />
        </g>
      </g>

      {/* Body and tail — static silhouette. */}
      <ellipse cx="48" cy="30" rx="9" ry="7" />
      <line
        x1="54"
        y1="34"
        x2="80"
        y2="46"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
