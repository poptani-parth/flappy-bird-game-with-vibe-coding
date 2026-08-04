import { useState, useEffect, useRef } from 'react';

const useAnimatedCounter = (targetValue, duration = 500) => {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const valueRef = useRef(targetValue);

  useEffect(() => {
    const previousValue = valueRef.current;
    if (previousValue === targetValue) return;

    valueRef.current = targetValue;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsedTime = time - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const animatedValue = Math.round(previousValue + (targetValue - previousValue) * progress);
      setCurrentValue(animatedValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return currentValue;
};

export default useAnimatedCounter;