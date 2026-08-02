import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A gliding hawk, seen in profile: body horizontal with the head facing
// right (the default drift direction), wings spread above and below the
// shoulder rather than left/right — a bird moving sideways across the
// screen has to face sideways too, not stand on end.
export default function Hawk({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(46,30)">
        <g className={rig.wingSlow} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -8,-32 L 4,-26 L 8,-8 Z" />
        </g>
      </g>
      <g transform="translate(46,30)">
        <g className={rig.wingSlowMirror} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -8,32 L 4,26 L 8,8 Z" />
        </g>
      </g>

      {/* Body, head, beak, tail — static silhouette. */}
      <ellipse cx="46" cy="30" rx="16" ry="7" />
      <circle cx="66" cy="28" r="6" />
      <path d="M 70,25 L 79,28 L 70,31 Z" />
      <path d="M 32,24 L 18,30 L 32,36 Z" />
    </svg>
  );
}
