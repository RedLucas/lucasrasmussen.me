import jellyfishImg from '../../assets/creatures/jellyfish.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// A 12-frame bell-pulse sheet (CC-BY-SA 3.0/4.0) — jellyfish drift on a
// slow, rhythmic pulse.
export default function Jellyfish({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={jellyfishImg}
      frameWidth={32}
      frameHeight={49}
      frameCount={12}
      size={size}
      duration={3}
      style={style}
    />
  );
}
