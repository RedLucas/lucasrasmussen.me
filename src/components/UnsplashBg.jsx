import { useEffect, useState } from 'react';
import { createApi } from 'unsplash-js';
import styles from './UnsplashBg.module.scss';

const CACHE_KEY = 'lucas-unsplash';
const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export default function UnsplashBg() {
  // The cached URL is known before the first paint, so seed state with it
  // rather than setting it from an effect.
  const [imgSrc, setImgSrc] = useState(() => window.localStorage.getItem(CACHE_KEY) ?? '');

  useEffect(() => {
    // Nothing to fetch if we already have a background, or if no key is set.
    if (imgSrc || !accessKey) return undefined;

    let cancelled = false;

    createApi({ accessKey })
      .GET('/photos/random', { params: { query: { orientation: 'landscape' } } })
      .then(({ data }) => {
        const photo = Array.isArray(data) ? data[0] : data;
        const url = photo?.urls?.full;
        if (!url || cancelled) return;

        // Wait for the image to decode before showing it, so the background
        // fades in fully formed rather than painting in as it downloads.
        const image = new Image();
        image.onload = () => {
          if (cancelled) return;
          window.localStorage.setItem(CACHE_KEY, url);
          setImgSrc(url);
        };
        image.src = url;
      })
      .catch(() => {
        // The background is decorative; leave the gradient in place on failure.
      });

    return () => {
      cancelled = true;
    };
  }, [imgSrc]);

  if (!imgSrc) return null;

  return (
    <div
      className={styles.bg}
      style={{ backgroundImage: `url(${imgSrc})` }}
    />
  );
}
