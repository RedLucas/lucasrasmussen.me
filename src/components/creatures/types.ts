import type { CSSProperties } from 'react';

// Every rigged creature below implements this shape so Creature.tsx can
// render Normal/Alien interchangeably regardless of which creature they are.
export interface CreatureSvgProps {
  size: number;
  color: string;
  style?: CSSProperties;
}
