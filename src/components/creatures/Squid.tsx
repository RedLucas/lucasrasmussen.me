import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

const TENTACLE_X = [36, 43, 50, 57, 64];

// A squid: a mantle/head silhouette over a fan of trailing tentacles, each
// waving on its own delay so the motion visibly ripples across the fan
// rather than every tentacle swinging in lockstep.
export default function Squid({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style} fill={color}>
      {TENTACLE_X.map((x, i) => (
        <g key={x} transform={`translate(${x},30)`}>
          <g
            className={rig.tentacle}
            style={{ transformOrigin: '0 0', animationDelay: `${i * -0.14}s` }}
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="24"
              stroke={color}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        </g>
      ))}

      {/* Mantle — static silhouette. */}
      <path d="M 50,2 C 62,2 70,14 70,26 C 70,34 62,32 50,32 C 38,32 30,34 30,26 C 30,14 38,2 50,2 Z" />
    </svg>
  );
}
