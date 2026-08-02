import camelImg from '../../assets/creatures/camel.png';
import Sprite from './Sprite';
import sprite from './sprite.module.scss';
import type { CreatureSvgProps } from './types';

// No walk-cycle sprite sheet for a camel turned up anywhere with an open
// license — this is a single well-drawn static frame (CC0), given a small
// bob of its own so it doesn't read as a frozen sticker while it drifts.
// Camels plod along at an unhurried, rolling pace, so the bob is slow.
export default function Camel({ size, style }: CreatureSvgProps) {
  return (
    <div style={style}>
      <div className={sprite.bobSlow}>
        <Sprite src={camelImg} frameWidth={75} frameHeight={59} frameCount={1} size={size} />
      </div>
    </div>
  );
}
