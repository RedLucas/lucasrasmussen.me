import birdImg from '../../assets/creatures/bird_fly.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// A genuine flap cycle (CC0), cropped from the flying row of a larger bird
// sprite sheet — wings visibly change position frame to frame rather than
// one flat shape pivoting as a whole. A hawk spends most of its time
// gliding on a slow, deliberate wingbeat rather than fluttering like a
// small bird, so this cycles much slower than Dove's.
export default function Hawk({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={birdImg}
      frameWidth={46}
      frameHeight={32}
      frameCount={9}
      size={size}
      duration={1.8}
      style={style}
    />
  );
}
