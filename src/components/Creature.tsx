import { useMemo, type ReactNode } from 'react';
import { getSceneSeed } from '../seed';
import styles from './Creature.module.scss';
import type { CreatureSvgProps } from './creatures/types';

type CreatureComponent = (props: CreatureSvgProps) => ReactNode;

export interface CreatureProps {
  Normal: CreatureComponent;
  Alien: CreatureComponent;
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
  // Whether this variant drifts a little in altitude/current on its own,
  // independent of its gait (see the `.wander` comment in the stylesheet).
  // Defaults to true — most creatures are airborne or aquatic. Ground
  // walkers (a camel, a bear) need this off, since they have to stay
  // pinned to the terrain line they're walking along rather than floating.
  wander?: boolean;
  // Defaults to `wander` — needed when the two variants differ (a grounded
  // bear cross-fading to a gliding manta).
  alienWander?: boolean;
  reverse?: boolean;
  mirrored?: boolean;
  glow?: boolean;
}

// A small rigged SVG creature (see ./creatures — a static body plus a
// handful of separately-animated parts, each pivoting from its own hip/
// shoulder/tail-base) drifting across its theme, cross-fading to an alien
// counterpart in space mode exactly like every other space-mode element in
// these scenes. Positioned as a plain DOM overlay above the WebGL canvas
// rather than drawn inside the shader — there's no way to sample the
// shader's own terrain-height function from here, so ground-walking
// creatures sit at a fixed height near the horizon rather than tracking the
// exact procedural ridge silhouette underneath them.
//
// Only two motion layers live here: `.track` drives horizontal drift
// (`left`/`right`, not `transform`), and an optional `.wander` wrapper
// drifts vertically on its own slow timescale for airborne/aquatic
// creatures. The actual gait (leg/wing/fin articulation) is internal to
// each creature component now, not applied externally — a single flat icon
// could only wobble as one rigid shape, but a multi-part rig needs each
// part animating independently, which has to live inside the SVG itself.
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
  wander = true,
  alienWander,
  reverse = false,
  mirrored = false,
  glow = false,
}: CreatureProps) {
  // Negative animation-delays start each loop partway through instead of at
  // its beginning, so creatures (and their independent wander drift) don't
  // all sync to the same phase — the one stable per-session seed already
  // used for the procedural scenes gives each its own offset without a
  // fresh RNG call per render. The wander delay/duration use different
  // multipliers than the drift delay so the two motions stay decorrelated
  // rather than lining up into one bigger, still-mechanical-looking cycle.
  const delay = useMemo(() => -((getSceneSeed() * 37 + duration) % duration), [duration]);
  const wanderDuration = useMemo(() => 5 + ((getSceneSeed() * 71) % 3), []);
  const wanderDelay = useMemo(
    () => -((getSceneSeed() * 113 + wanderDuration) % wanderDuration),
    [wanderDuration],
  );

  const flipStyle = mirrored ? { transform: 'scaleX(-1)' } : undefined;
  // A tight blur: at these icon sizes (~35-45px) anything wider reads as a
  // soft blob rather than a silhouette with a glowing edge.
  const alienFlipStyle = glow
    ? { ...flipStyle, filter: `drop-shadow(0 0 3px ${alienColor})` }
    : flipStyle;

  const trackClass = `${styles.track} ${reverse ? styles.reverse : ''}`;
  const animationDuration = `${duration}s`;
  const animationDelay = `${delay}s`;
  const wanderStyle = {
    animationDuration: `${wanderDuration}s`,
    animationDelay: `${wanderDelay}s`,
  };

  const normalWander = wander;
  const alienWanderResolved = alienWander ?? wander;

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
        {normalWander ? (
          <div className={styles.wander} style={wanderStyle}>
            <Normal size={size} color={normalColor} style={flipStyle} />
          </div>
        ) : (
          <Normal size={size} color={normalColor} style={flipStyle} />
        )}
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
        {alienWanderResolved ? (
          <div className={styles.wander} style={wanderStyle}>
            <Alien size={size} color={alienColor} style={alienFlipStyle} />
          </div>
        ) : (
          <Alien size={size} color={alienColor} style={alienFlipStyle} />
        )}
      </div>
    </>
  );
}
