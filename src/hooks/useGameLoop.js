import { useEffect, useRef } from 'react';

export default function useGameLoop(callback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    const tick = (time) => {
      const delta = Math.min((time - lastTime) / 16.666, 4);
      lastTime = time;
      callbackRef.current(delta);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);
}