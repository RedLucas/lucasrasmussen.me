import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A walking camel: two legs swinging in opposition (a real diagonal gait,
// not a symmetric bob) beneath a static torso/hump/neck/head silhouette.
export default function Camel({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 70" style={style} fill={color}>
      <g transform="translate(35,45)">
        <g className={rig.legA} style={{ transformOrigin: '0 0' }}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="11"
            stroke={color}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <g transform="translate(0,11)">
            <g className={rig.kneeA} style={{ transformOrigin: '0 0' }}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="11"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>
      </g>
      <g transform="translate(61,45)">
        <g className={rig.legB} style={{ transformOrigin: '0 0' }}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="11"
            stroke={color}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <g transform="translate(0,11)">
            <g className={rig.kneeB} style={{ transformOrigin: '0 0' }}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="11"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>
      </g>

      {/* Tail */}
      <line x1="24" y1="34" x2="16" y2="45" stroke={color} strokeWidth="3" strokeLinecap="round" />

      {/* Torso, hump, neck, head — static silhouette. */}
      <ellipse cx="48" cy="36" rx="23" ry="13" />
      <ellipse cx="41" cy="21" rx="10" ry="10" />
      <line x1="64" y1="30" x2="84" y2="8" stroke={color} strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="87" cy="6" rx="7" ry="5" />
    </svg>
  );
}
