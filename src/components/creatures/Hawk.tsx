import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A gliding hawk: two wings flapping together (a fast, deep downstroke and
// a slower recovery) from a shared shoulder point, either side of a static
// body/head/tail silhouette.
export default function Hawk({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(50,26)">
        <g className={rig.wing} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -38,-9 L -32,3 L -10,7 Z" />
        </g>
      </g>
      <g transform="translate(50,26)">
        <g className={rig.wingMirror} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L 38,-9 L 32,3 L 10,7 Z" />
        </g>
      </g>

      {/* Body, head, beak, tail — static silhouette. */}
      <ellipse cx="50" cy="32" rx="7" ry="14" />
      <circle cx="50" cy="15" r="6" />
      <path d="M 47,10 L 40,12 L 47,15 Z" />
      <path d="M 44,44 L 50,58 L 56,44 Z" />
    </svg>
  );
}
