import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// An alien sky-manta gliding through the aurora, in profile: broad, flat
// wings spread above/below the body and undulate slowly together, with a
// long thin tail trailing behind (left) as it glides rightward.
export default function MantaRay({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(48,30)">
        <g className={rig.wingSlow} style={{ transformOrigin: '0 0' }}>
          <path d="M -4,0 L -14,-40 L 4,-36 L 8,-8 Z" />
        </g>
      </g>
      <g transform="translate(48,30)">
        <g className={rig.wingSlowMirror} style={{ transformOrigin: '0 0' }}>
          <path d="M -4,0 L -14,40 L 4,36 L 8,8 Z" />
        </g>
      </g>

      {/* Body and tail — static silhouette. */}
      <ellipse cx="48" cy="30" rx="8" ry="8" />
      <line
        x1="41"
        y1="31"
        x2="16"
        y2="38"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
