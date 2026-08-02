import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A swimming whale: a wide, flat tail fluke swishing up and down from its
// own base (the same rotating `.tail` rig as the fish, just oriented
// horizontally so the same left/right rotation reads as an up/down stroke).
export default function Whale({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 50" style={style} fill={color}>
      <g transform="translate(64,25)">
        <g className={rig.tail} style={{ transformOrigin: '0 0', animationDuration: '1.6s' }}>
          <path d="M 0,0 L 22,-9 L 16,0 L 22,9 Z" />
        </g>
      </g>

      {/* Body and dorsal fin — static silhouette. */}
      <ellipse cx="34" cy="25" rx="30" ry="12" />
      <path d="M 30,13 L 38,2 L 44,14 Z" />
    </svg>
  );
}
