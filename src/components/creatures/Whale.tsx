import whaleImg from '../../assets/creatures/whale_swim.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// An 8-frame dive/surface swim cycle (multi-licensed CC-BY 4.0/OGA-BY
// 3.0/CC0 orca sheet) — the body genuinely arches frame to frame. A whale's
// stroke is slow and powerful.
export default function Whale({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={whaleImg}
      frameWidth={140}
      frameHeight={50}
      frameCount={8}
      size={size}
      duration={2.4}
      style={style}
    />
  );
}
