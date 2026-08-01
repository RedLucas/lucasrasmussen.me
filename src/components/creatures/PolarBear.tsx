import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A walking bear: same opposed-leg-swing rig as the camel, under a
// rounder, shorter-necked silhouette.
export default function PolarBear({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(33,42)">
        <g className={rig.legA} style={{ transformOrigin: '0 0' }}>
          <line
            x1="0"
            y1="0"
            x2="-6"
            y2="17"
            stroke={color}
            strokeWidth="6.5"
            strokeLinecap="round"
          />
        </g>
      </g>
      <g transform="translate(63,42)">
        <g className={rig.legB} style={{ transformOrigin: '0 0' }}>
          <line
            x1="0"
            y1="0"
            x2="6"
            y2="17"
            stroke={color}
            strokeWidth="6.5"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* Torso, neck, head, ears — static silhouette. */}
      <ellipse cx="46" cy="32" rx="25" ry="15" />
      <line x1="66" y1="26" x2="76" y2="18" stroke={color} strokeWidth="13" strokeLinecap="round" />
      <circle cx="80" cy="15" r="9" />
      <circle cx="74" cy="7" r="3" />
      <circle cx="86" cy="7" r="3" />
    </svg>
  );
}
