import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A butterfly, in profile: each side's fore- and hind-wing move together
// as one unit, spread above/below a horizontal body rather than left/right
// of a vertical one, flapping in sync via the same wing/wingMirror pair
// used for birds.
export default function Butterfly({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      <g transform="translate(44,30)">
        <g className={rig.wing} style={{ transformOrigin: '0 0' }}>
          <ellipse cx="-8" cy="-16" rx="11" ry="16" />
          <ellipse cx="7" cy="-13" rx="8" ry="11" />
        </g>
      </g>
      <g transform="translate(44,30)">
        <g className={rig.wingMirror} style={{ transformOrigin: '0 0' }}>
          <ellipse cx="-8" cy="16" rx="11" ry="16" />
          <ellipse cx="7" cy="13" rx="8" ry="11" />
        </g>
      </g>

      {/* Body: thorax + abdomen, static. */}
      <line x1="28" y1="30" x2="54" y2="30" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
