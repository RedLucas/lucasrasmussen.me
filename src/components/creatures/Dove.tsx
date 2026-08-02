import birdImg from '../../assets/creatures/bird_fly.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// Reuses the same flying bird sheet as Hawk — no dedicated dove/hawk pair
// turned up under an open license, and the two never appear on screen
// together (different theme, different biome), so sharing the asset is
// harmless. A slight hue shift keeps it visually distinct on its own
// merits. Unlike the hawk, a small bird like this beats its wings quickly
// and continuously rather than gliding.
export default function Dove({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={birdImg}
      frameWidth={46}
      frameHeight={32}
      frameCount={9}
      size={size}
      duration={0.45}
      style={{ filter: 'hue-rotate(190deg) saturate(0.7) brightness(1.1)', ...style }}
    />
  );
}
