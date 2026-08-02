import butterflyImg from '../../assets/creatures/butterfly.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// A 4-frame open-to-folded flap cycle (CC-BY 3.0/4.0) — the source art's
// own glowing blue coloring happens to read as bioluminescent, which fits
// this creature's role as the rainforest's alien counterpart. Butterflies
// flutter quickly and a little erratically, quicker than a bird's steady
// wingbeat.
export default function Butterfly({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={butterflyImg}
      frameWidth={174}
      frameHeight={200}
      frameCount={4}
      size={size}
      duration={0.35}
      style={style}
    />
  );
}
