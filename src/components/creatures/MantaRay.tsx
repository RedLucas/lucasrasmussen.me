import rochenImg from '../../assets/creatures/manta_swim.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// A 4-frame side-profile swim cycle (CC-BY 4.0 stingray sheet) — the wings
// genuinely undulate frame to frame. Rays glide with slow, graceful wing
// undulation rather than a fast beat.
export default function MantaRay({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={rochenImg}
      frameWidth={69}
      frameHeight={49}
      frameCount={4}
      size={size}
      duration={2.2}
      style={style}
    />
  );
}
