import { useEffect, useState } from 'react';

/** Returns a monotonic UTC timestamp updated every animation frame while active. */
export function useAnimationNow(active: boolean): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }

    let frameId = 0;

    const tick = () => {
      setNowMs(Date.now());
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [active]);

  return nowMs;
}
