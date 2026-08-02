import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFeather } from '@fortawesome/free-solid-svg-icons';
import styles from './CreditsMenu.module.scss';

interface Credit {
  creature: string;
  title: string;
  author: string;
  license: string;
  url: string;
}

// Only the CC-BY/CC-BY-SA assets are listed — those licenses require
// attribution. The rest of the creature art (camel, bird, squid, sandworm)
// is CC0 and needs none. Same dismissable-overlay idiom as BackgroundMenu:
// outside click/blur/Escape closes it, focus returns to the trigger.
const CREDITS: Credit[] = [
  {
    creature: 'Polar bear',
    title: 'Polar Bear Idle and Movement',
    author: 'Kirill Krysov (submitted by qubodup)',
    license: 'CC-BY-SA 3.0',
    url: 'https://opengameart.org/content/polar-bear-idle-and-movement',
  },
  {
    creature: 'Butterfly',
    title: 'Butterfly animation',
    author: 'Flixberry Entertainment',
    license: 'CC-BY 3.0/4.0',
    url: 'https://opengameart.org/content/butterfly-animation',
  },
  {
    creature: 'Jellyfish',
    title: 'Jellyfish',
    author: 'StendhalGame',
    license: 'CC-BY-SA 3.0/4.0',
    url: 'https://opengameart.org/content/jellyfish',
  },
  {
    creature: 'Wyvern',
    title: 'Flying Dragon Rework',
    author: 'AntumDeluge',
    license: 'CC-BY 3.0',
    url: 'https://opengameart.org/content/flying-dragon-rework',
  },
  {
    creature: 'Sky manta',
    title: 'Stingray Sprite - animated 4-directional',
    author: 'Sevarihk',
    license: 'CC-BY 4.0',
    url: 'https://opengameart.org/content/stingray-sprite-animated-4-directional',
  },
];

export default function CreditsMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget && !wrapperRef.current?.contains(event.relatedTarget)) {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef} onBlur={handleBlur}>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Art credits"
        onClick={() => setOpen((current) => !current)}
      >
        <FontAwesomeIcon icon={faFeather} />
      </button>
      {open && (
        <div role="dialog" aria-label="Background creature art credits" className={styles.panel}>
          <p className={styles.intro}>
            Background creatures use open-licensed art. Public-domain (CC0) pieces need no credit;
            these do:
          </p>
          <ul className={styles.list}>
            {CREDITS.map((credit) => (
              <li key={credit.url}>
                <a href={credit.url} target="_blank" rel="noreferrer">
                  {credit.title}
                </a>{' '}
                — {credit.author} ({credit.license})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
