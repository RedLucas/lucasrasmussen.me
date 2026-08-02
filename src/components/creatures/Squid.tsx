import squidImg from '../../assets/creatures/squid.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// 3 distinct tentacle poses (CC0) cycled as a loose idle wiggle — not an
// authored walk cycle, but a real pose change frame to frame rather than
// one static shape. Squid drift slowly between short bursts, so this stays
// unhurried.
export default function Squid({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={squidImg}
      frameWidth={246}
      frameHeight={275}
      frameCount={3}
      size={size}
      duration={1.4}
      style={style}
    />
  );
}
