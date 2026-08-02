import dragonImg from '../../assets/creatures/dragon_fly.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// A real 3-frame wingbeat cropped from a larger dragon sprite sheet
// (CC-BY 3.0, explicitly tagged wyvern/drake). A creature this size reads
// as powerful rather than frantic with a slow, heavy wingbeat — closer to
// a large soaring bird of prey than a hummingbird.
export default function Wyvern({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={dragonImg}
      frameWidth={184}
      frameHeight={107}
      frameCount={3}
      size={size}
      duration={1.3}
      style={style}
    />
  );
}
