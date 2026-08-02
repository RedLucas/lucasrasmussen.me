import wormImg from '../../assets/creatures/sandworm.png';
import Sprite from './Sprite';
import type { CreatureSvgProps } from './types';

// An 11-frame undulating crawl (CC0, subsampled from a 33-frame source gif)
// — segments visibly compress and legs shift in sequence rather than one
// rigid chain rocking in lockstep. A steady continuous crawl, quicker than
// the larger walking/swimming creatures since its many legs cycle fast.
export default function SandWorm({ size, style }: CreatureSvgProps) {
  return (
    <Sprite
      src={wormImg}
      frameWidth={565}
      frameHeight={149}
      frameCount={11}
      size={size}
      duration={1.4}
      style={style}
    />
  );
}
