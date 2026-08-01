import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A butterfly: each side's fore- and hind-wing move together as one unit,
// flapping in sync with the opposite side via the same wing/wingMirror
// pair used for birds.
export default function Butterfly({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(50,30)">
        <g className={rig.wing} style={{ transformOrigin: '0 0' }}>
          <ellipse cx="-16" cy="-8" rx="16" ry="11" />
          <ellipse cx="-13" cy="7" rx="11" ry="8" />
        </g>
      </g>
      <g transform="translate(50,30)">
        <g className={rig.wingMirror} style={{ transformOrigin: '0 0' }}>
          <ellipse cx="16" cy="-8" rx="16" ry="11" />
          <ellipse cx="13" cy="7" rx="11" ry="8" />
        </g>
      </g>

      {/* Body: thorax + abdomen, static. */}
      <line x1="50" y1="16" x2="50" y2="42" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
