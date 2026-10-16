import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from its previous value to `target` (ease-out), for dashboard figures.
 * Returns the target immediately when the user prefers reduced motion.
 */
export default function useCountUp(target, duration = 900) {
  // Start from 0 so the first render counts up (no flash of the final value)
  const [value, setValue] = useState(() =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? target : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    fromRef.current = target;
    if (reduce || from === target) {
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
