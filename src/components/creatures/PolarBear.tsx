import bearImg from '../../assets/creatures/bear_walk.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// An 8-frame walk cycle (CC-BY-SA 3.0) — a real drawn gait rather than a
// rigged pivot. A bear's walk is a slow, heavy lumber, not a brisk trot.
export default function PolarBear({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={bearImg}
      frameWidth={344}
      frameHeight={244}
      frameCount={8}
      size={size}
      duration={1.6}
      style={style}
    />
  );
}
