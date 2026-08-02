import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A flying dove/bird, seen in true side profile like the hawk: body
// horizontal and facing right, a single wing swept up from the shoulder
// (see Hawk.tsx for why this isn't a mirrored pair above and below the
// body), with a small fanned tail behind.
export default function Dove({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(46,26)">
        <g className={rig.wing} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -7,-22 L 3,-17 L 5,-4 Z" />
        </g>
      </g>

      {/* Body, head, tail — static silhouette. */}
      <ellipse cx="48" cy="30" rx="13" ry="8" />
      <circle cx="65" cy="28" r="6.5" />
      <path d="M 32,24 L 20,30 L 32,36 Z" />
    </svg>
  );
}
