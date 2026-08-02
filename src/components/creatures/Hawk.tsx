import birdImg from '../../assets/creatures/bird_fly.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// A genuine 4-pose flap cycle (CC0), extracted by content bounding-box
// (the source row's frames aren't on an even grid — an earlier version
// assumed one and got overlapping "double bird" frames) from the flying
// row of a larger bird sprite sheet. A hawk spends most of its time gliding
// on a slow, deliberate wingbeat rather than fluttering like a small bird,
// so this cycles much slower than Dove's.
export default function Hawk({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={birdImg}
      frameWidth={46}
      frameHeight={32}
      frameCount={4}
      size={size}
      duration={1.0}
      style={style}
    />
  );
}
