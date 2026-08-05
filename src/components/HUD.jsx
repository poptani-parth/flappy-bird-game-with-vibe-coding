import React from 'react';
import { Pause, Play, RotateCw, Volume2, VolumeX, Home } from 'lucide-react';
import useAnimatedCounter from '../hooks/useAnimatedCounter';

const HUD = ({
  score,
  bestScore,
  gameState,
  countdown,
  onStart,
  onTogglePause,
  onToggleSound,
  soundOn,
}) => {
  const animatedScore = useAnimatedCounter(score, 300);
  const animatedBestScore = useAnimatedCounter(bestScore, 300);

  const renderOverlay = () => {
    if (gameState === 'idle') {
      return (
        <div className="overlay-container">
          <div className="overlay-card">
            <h1>Flappy Bird</h1>
            <p>Best Score: {animatedBestScore}</p>
            <button className="action-button" onClick={onStart}>
              <Play size={20} />
              <span>Play</span>
            </button>
          </div>
        </div>
      );
    }

    if (gameState === 'countdown' && countdown > 0) {
      return (
        <div className="overlay-container" style={{ background: 'none' }}>
          <span className="countdown-text">{countdown}</span>
        </div>
      );
    }

    if (gameState === 'paused') {
      return (
        <div className="overlay-container">
          <div className="overlay-card">
            <h2>Paused</h2>
            <p>Tap the game area or press Space to resume.</p>
          </div>
        </div>
      );
    }

    if (gameState === 'gameover') {
      return (
        <div className="overlay-container">
          <div className="overlay-card">
            <h2>Game Over</h2>
            <p>Score: {score}</p>
            <p>Best: {bestScore}</p>
            <button className="action-button" onClick={onStart}>
              <RotateCw size={20} />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="hud">
      {/* Full-screen Overlays */}
      {renderOverlay()}
    </div>
  );
};

export default React.memo(HUD);