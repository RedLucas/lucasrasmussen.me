import { useMemo } from 'react';
import type { IconType } from 'react-icons';
import { getSceneSeed } from '../seed';
import styles from './Creature.module.scss';

export type CreatureMotion = 'flap' | 'bob' | 'undulate';

export interface CreatureProps {
  Normal: IconType;
  Alien: IconType;
  normalColor: string;
  alienColor: string;
  spaceMode: boolean;
  size: number;
  top: string;
  // Defaults to `top` — most pairs occupy the same band, but a few (e.g. a
  // bear walking the ice horizon cross-fading to a manta gliding through the
  // aurora well above it) need the alien variant somewhere else entirely.
  alienTop?: string;
  duration: number;
  motion: CreatureMotion;
  // Defaults to `motion` — most pairs share a gait, but a few (e.g. a
  // walking camel cross-fading to an undulating sandworm) need their own.
  alienMotion?: CreatureMotion;
  reverse?: boolean;
  mirrored?: boolean;
  glow?: boolean;
}

// A small vector silhouette (from react-icons' game-icons collection —
// professionally drawn and immediately recognizable, unlike a hand-rolled
// shader silhouette) drifting across its theme, cross-fading to an alien
// counterpart in space mode exactly like every other space-mode element in
// these scenes. Positioned as a plain DOM overlay above the WebGL canvas
// rather than drawn inside the shader — there's no way to sample the
// shader's own terrain-height function from here, so ground-walking
// creatures sit at a fixed height near the horizon rather than tracking the
// exact procedural ridge silhouette underneath them.
//
// Normal and Alien each get their own independent, fully-positioned track
// rather than sharing one parent — a nested "position within a position"
// would need the alien variant's own `top` to resolve as a percentage of
// its wrapper's height, but that wrapper's height collapses to 0 once its
// own children are absolutely positioned. Two independent tracks sidestep
// that entirely, and since both use the exact same animation-duration/delay,
// they move in perfect horizontal lockstep — it still reads as one creature
// cross-fading in place, not two drifting independently.
export default function Creature({
  Normal,
  Alien,
  normalColor,
  alienColor,
  spaceMode,
  size,
  top,
  alienTop,
  duration,
  motion,
  alienMotion,
  reverse = false,
  mirrored = false,
  glow = false,
}: CreatureProps) {
  // A negative animation-delay starts the loop partway through instead of
  // at its beginning, so creatures don't all sync to the same phase — the
  // one stable per-session seed already used for the procedural scenes
  // gives each creature its own offset without a fresh RNG call per render.
  const delay = useMemo(() => -((getSceneSeed() * 37 + duration) % duration), [duration]);

  const flipStyle = mirrored ? { transform: 'scaleX(-1)' } : undefined;
  // A tight blur: at these icon sizes (~35-45px) anything wider reads as a
  // soft blob rather than a silhouette with a glowing edge.
  const alienFlipStyle = glow
    ? { ...flipStyle, filter: `drop-shadow(0 0 3px ${alienColor})` }
    : flipStyle;

  const trackClass = `${styles.track} ${reverse ? styles.reverse : ''}`;
  const animationDuration = `${duration}s`;
  const animationDelay = `${delay}s`;

  return (
    <>
      <div
        className={trackClass}
        aria-hidden="true"
        style={{
          top,
          width: size,
          height: size,
          opacity: spaceMode ? 0 : 1,
          animationDuration,
          animationDelay,
        }}
      >
        <div className={`${styles.icon} ${styles[motion]}`}>
          <Normal size={size} color={normalColor} style={flipStyle} />
        </div>
      </div>
      <div
        className={trackClass}
        aria-hidden="true"
        style={{
          top: alienTop ?? top,
          width: size,
          height: size,
          opacity: spaceMode ? 1 : 0,
          animationDuration,
          animationDelay,
        }}
      >
        <div className={`${styles.icon} ${styles[alienMotion ?? motion]}`}>
          <Alien size={size} color={alienColor} style={alienFlipStyle} />
        </div>
      </div>
    </>
  );
}
