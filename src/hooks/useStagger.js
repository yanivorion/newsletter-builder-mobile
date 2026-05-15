import { useState, useEffect, useCallback, useRef } from 'react';

/** Keys that mean “no stagger surface mounted” — must not flip `visible` to true. */
function isInactiveStaggerKey(key) {
  if (key == null || key === false) return true;
  if (typeof key === 'string') {
    if (key === '' || key === 'hidden' || key === 'closed') return true;
    if (key.endsWith('-off')) return true;
  }
  return false;
}

/**
 * Returns an inline style object per child index that handles
 * staggered fade-in on mount (or when `key` changes).
 *
 *   const stagger = useStagger(itemCount, { delay: 40, baseDelay: 80 });
 *   items.map((item, i) => <div style={stagger(i)} … />)
 *
 * DESIGN.md: panel/list stagger — 350ms ease-out, baseDelay 80ms + index×40ms,
 * opacity + translateY(8px→0). Inactive keys skip the rAF reveal so the first
 * open frame starts from the hidden state (otherwise the entrance never runs).
 */
export function useStagger(count, {
  delay = 40,
  baseDelay = 80,
  duration = 350,
  distance = 8,
  /** 'y' = slide vertically; 'x' = slide horizontally (positive distance = from the right) */
  axis = 'y',
  key,
} = {}) {
  const [visible, setVisible] = useState(false);
  const prevKey = useRef(key);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (isInactiveStaggerKey(key)) {
      setVisible(false);
      prevKey.current = key;
      return;
    }
    if (reducedMotion) {
      setVisible(true);
      prevKey.current = key;
      return;
    }
    if (key !== prevKey.current) {
      setVisible(false);
      prevKey.current = key;
    }
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2 != null) cancelAnimationFrame(raf2);
    };
  }, [key, reducedMotion]);

  const getStyle = useCallback((index) => {
    const atRest = axis === 'x' ? 'translateX(0)' : 'translateY(0)';
    const hidden =
      axis === 'x'
        ? `translateX(${distance}px)`
        : `translateY(${distance}px)`;
    const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const staggerDelay = baseDelay + index * delay;

    if (reducedMotion) {
      return {
        opacity: visible ? 1 : 0,
        transform: atRest,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'none',
      };
    }
    if (visible) {
      return {
        opacity: 1,
        transform: atRest,
        pointerEvents: 'auto',
        transition: `opacity ${duration}ms ${ease} ${staggerDelay}ms, transform ${duration}ms ${ease} ${staggerDelay}ms`,
      };
    }
    return {
      opacity: 0,
      transform: hidden,
      pointerEvents: 'none',
      transition: 'none',
    };
  }, [visible, delay, baseDelay, duration, distance, axis, reducedMotion]);

  return getStyle;
}
