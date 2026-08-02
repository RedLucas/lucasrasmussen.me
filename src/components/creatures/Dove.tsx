import rig from './wingRig.module.scss';
import type { CreatureSvgProps } from './types';

// A flying dove/bird, in profile: same synchronized wing-pair rig as the
// hawk, body horizontal and facing right, with a small fanned tail behind.
// Reverted from a pixel-art sprite sheet back to a smooth CSS-rotated wing
// rig for the same reason as Hawk — see that component's comment. Unlike
// the hawk, a small bird like this beats its wings quickly and
// continuously rather than gliding.
export default function Dove({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(48,30)">
        <g className={rig.wing} style={{ transformOrigin: '0 0', animationDuration: '0.5s' }}>
          <path d="M 0,0 L -7,-30 L 4,-24 L 6,-7 Z" />
        </g>
      </g>
      <g transform="translate(48,30)">
        <g className={rig.wingMirror} style={{ transformOrigin: '0 0', animationDuration: '0.5s' }}>
          <path d="M 0,0 L -7,30 L 4,24 L 6,7 Z" />
        </g>
      </g>

      {/* Body, head, tail — static silhouette. */}
      <ellipse cx="48" cy="30" rx="13" ry="8" />
      <circle cx="65" cy="28" r="6.5" />
      <path d="M 32,24 L 20,30 L 32,36 Z" />
    </svg>
  );
}
