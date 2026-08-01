import rig from './rig.module.scss';
import type { CreatureSvgProps } from './types';

interface FishProps {
  x: number;
  y: number;
  scale: number;
  color: string;
  delay: string;
}

// One small fish: an oval body with a triangular tail swishing from its
// own base — the building block FishSchool repeats a few times.
function Fish({ x, y, scale, color, delay }: FishProps) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <g transform="translate(-2,0)">
        <g className={rig.tail} style={{ transformOrigin: '0 0', animationDelay: delay }}>
          <path d="M 0,0 L -11,-6 L -11,6 Z" fill={color} />
        </g>
      </g>
      <ellipse cx="8" cy="0" rx="10" ry="5" fill={color} />
    </g>
  );
}

// A loose school of three fish, each swishing its own tail on a slightly
// different delay so they don't read as identical clones.
export default function FishSchool({ size, color, style }: CreatureSvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" style={style}>
      <Fish x={30} y={22} scale={1} color={color} delay="0s" />
      <Fish x={54} y={34} scale={0.8} color={color} delay="-0.25s" />
      <Fish x={22} y={40} scale={0.7} color={color} delay="-0.5s" />
    </svg>
  );
}
