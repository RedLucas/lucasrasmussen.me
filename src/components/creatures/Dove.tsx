import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A flying dove/bird: same synchronized wing-pair rig as the hawk, with a
// rounder body and a small fanned tail.
export default function Dove({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(50,28)">
        <g className={rig.wing} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -34,-7 L -28,4 L -8,6 Z" />
        </g>
      </g>
      <g transform="translate(50,28)">
        <g className={rig.wingMirror} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L 34,-7 L 28,4 L 8,6 Z" />
        </g>
      </g>

      {/* Body, head, tail — static silhouette. */}
      <ellipse cx="49" cy="33" rx="9" ry="12" />
      <circle cx="52" cy="18" r="6.5" />
      <path d="M 44,42 L 49,54 L 54,42 Z" />
    </svg>
  );
}
