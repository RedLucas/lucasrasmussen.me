import type { CSSProperties } from 'react';
import sprite from './sprite.module.scss';

export interface SpriteProps {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  // Target rendered height in px — width follows from the frame's own
  // aspect ratio rather than being forced square, since these are real
  // sprites with meaningful proportions (a worm reads very differently
  // from a bear).
  size: number;
  duration?: number;
  pixelated?: boolean;
  style?: CSSProperties;
}

// Cycles a horizontal sprite strip via steps() on background-position —
// the same technique underneath every 2D-game walk/flap cycle. The strip's
// background-size is set to frameCount*100% of this element's own box (one
// frame == one box-width), so animating background-position-x from 0% to
// 100% steps through exactly `frameCount` evenly-spaced samples landing on
// each frame boundary in turn, then snaps back to frame 0 for the next
// loop.
export default function Sprite({
  src,
  frameWidth,
  frameHeight,
  frameCount,
  size,
  duration = 1,
  pixelated = false,
  style,
}: SpriteProps) {
  const width = (frameWidth / frameHeight) * size;
  const animated = frameCount > 1;
  const className = [animated ? sprite.animated : '', pixelated ? sprite.pixelated : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className || undefined}
      style={{
        width,
        height: size,
        backgroundImage: `url(${src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: animated ? `${frameCount * 100}% 100%` : '100% 100%',
        animation: animated
          ? `${sprite.spriteStep} ${duration}s steps(${frameCount}) infinite`
          : undefined,
        ...style,
      }}
    />
  );
}
