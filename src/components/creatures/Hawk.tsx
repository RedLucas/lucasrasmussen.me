import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A gliding hawk, seen in true side profile: body horizontal with the head
// facing right (the default drift direction), a single wing swept up from
// the shoulder. From the side, the near and far wing mostly overlap into
// one silhouette — mirroring a second wing below the shoulder (the previous
// version of this component) instead reads as a dorsal/top-down view, since
// that's exactly how a bird's left and right wings are arranged when seen
// from above with the body axis drawn horizontally.
export default function Hawk({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(44,27)">
        <g className={rig.wingSlow} style={{ transformOrigin: '0 0' }}>
          <path d="M 0,0 L -9,-25 L 3,-19 L 7,-5 Z" />
        </g>
      </g>

      {/* Body, head, beak, tail — static silhouette. */}
      <ellipse cx="46" cy="32" rx="16" ry="6" />
      <circle cx="66" cy="30" r="6" />
      <path d="M 70,27 L 79,30 L 70,33 Z" />
      <path d="M 32,26 L 18,32 L 32,38 Z" />
    </svg>
  );
}
