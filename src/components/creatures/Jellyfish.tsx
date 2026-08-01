import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

const TENTACLE_X = [-16, -8, 0, 8, 16];

// A jellyfish: a dome bell pulsing for propulsion, trailing a fan of
// tentacles that wave on staggered delays.
export default function Jellyfish({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      {TENTACLE_X.map((dx, i) => (
        <g key={dx} transform={`translate(${50 + dx},28)`}>
          <g
            className={rig.tentacle}
            style={{ transformOrigin: '0 0', animationDelay: `${i * -0.16}s` }}
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="26"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </g>
      ))}

      <g transform="translate(50,18)">
        <g className={rig.pulse} style={{ transformOrigin: '0 0' }}>
          <path d="M -22,4 C -22,-14 22,-14 22,4 C 14,10 -14,10 -22,4 Z" />
        </g>
      </g>
    </svg>
  );
}
