import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

// A chain of overlapping segments, each pivoting from its own anchor with a
// phase-delayed copy of the same rotation keyframe — the delay is what
// makes the bend visibly travel down the body as a wave, rather than every
// segment rocking in lockstep.
const SEGMENTS = [0, 1, 2, 3];
const SEGMENT_SPACING = 20;
const SEGMENT_LENGTH = 26;

export default function SandWorm({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 36" style={style} fill={color}>
      {SEGMENTS.map((i) => (
        <g key={i} transform={`translate(${8 + i * SEGMENT_SPACING},18)`}>
          <g
            className={rig.segment}
            style={{ transformOrigin: '0 0', animationDelay: `${i * -0.22}s` }}
          >
            <line
              x1="0"
              y1="0"
              x2={SEGMENT_LENGTH}
              y2="0"
              stroke={color}
              strokeWidth={12 - i * 1.6}
              strokeLinecap="round"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}
