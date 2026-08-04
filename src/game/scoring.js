import { useState, useEffect } from 'react';

const SCORE_KEY = 'bestScore';

export const useScoring = () => {
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const savedScore = localStorage.getItem(SCORE_KEY);
    return savedScore ? parseInt(savedScore, 10) : 0;
  });

  const incrementScore = () => {
    setScore((prevScore) => {
      const newScore = prevScore + 1;
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem(SCORE_KEY, newScore);
      }
      return newScore;
    });
  };

  const resetScore = () => {
    setScore(0);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(SCORE_KEY, bestScore);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [bestScore]);

  return { score, bestScore, incrementScore, resetScore };
};