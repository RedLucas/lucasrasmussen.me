import fishImg from '../../assets/creatures/fish.png';
import Sprite from './Sprite';
import sprite from './sprite.module.scss';
import type { CreatureSvgProps } from './types';

interface FishProps {
  left: number;
  top: number;
  scale: number;
  delay: string;
}

// No swim-cycle frames for this particular fish tile (it's one static pose
// out of a large color/accessory variant pack, not an authored animation) —
// each instance gets its own small side-to-side sway, staggered so the trio
// doesn't read as identical clones moving in lockstep. Small fish dart with
// quick, twitchy tail beats, not a slow drift.
function Fish({ left, top, scale, delay }: FishProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        transform: `scale(${scale})`,
      }}
    >
      <div className={sprite.swayFast} style={{ animationDelay: delay }}>
        <Sprite src={fishImg} frameWidth={60} frameHeight={56} frameCount={1} size={22} />
      </div>
    </div>
  );
}

// A loose school of three fish (CC0) at different positions/scales/delays.
export default function FishSchool({ size, style }: CreatureSvgProps) {
  return (
    <div style={{ position: 'relative', width: size * 1.6, height: size, ...style }}>
      <Fish left={5} top={10} scale={1} delay="0s" />
      <Fish left={45} top={35} scale={0.8} delay="-0.25s" />
      <Fish left={20} top={55} scale={0.7} delay="-0.5s" />
    </div>
  );
}
