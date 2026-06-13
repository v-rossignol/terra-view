import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ContainerSize {
  width: number;
  height: number;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateSize = (width: number, height: number) => {
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      updateSize(width, height);
    });

    observer.observe(element);
    updateSize(element.clientWidth, element.clientHeight);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, size };
}
