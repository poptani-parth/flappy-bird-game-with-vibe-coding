import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Bird from './components/Bird';
import Pipe from './components/Pipe';
import HUD from './components/HUD';
import Background from './components/Background'; // New component for background effects
import useGameLoop from './hooks/useGameLoop';
import { updateBird, checkCollision, initialBirdState } from './game/physics';

// --- New Desktop-First Dimensions ---
const CANVAS = { width: 520, height: 820 };
const PIPE_WIDTH = 60;
const PIPE_GAP = 210;
const PIPE_SPAWN_DISTANCE = 380; // Consistent spacing
const INITIAL_SPEED = 2.5;
const MAX_SPEED = 5.5;

/**
 * Creates a new pipe with a random vertical position.
 * @param {number} x - The initial x-position of the pipe.
 * @returns {object} A new pipe object.
 */
function createPipe(x) {
    const minGapY = 150;
    const maxGapY = CANVAS.height - PIPE_GAP - 150;

    const gapY = randomBetween(minGapY, maxGapY);

    return {
        x,
        gapY,
        passed: false,
    };
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export default function App() {
  const [gameState, setGameState] = useState('idle'); // idle, countdown, playing, gameover
  const [bird, setBird] = useState(initialBirdState);
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem('bestScore') || 0));
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [jumpQueued, setJumpQueued] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [soundOn, setSoundOn] = useState(true);

  // Persist best score to local storage
  useEffect(() => {
    localStorage.setItem('bestScore', String(bestScore));
  }, [bestScore]);

  // --- Game State Management ---

  const startGame = useCallback(() => {
    setBird(initialBirdState);
    // Ensure pipes spawn completely off-screen to start
    setPipes([
      createPipe(CANVAS.width + 250),
      createPipe(CANVAS.width + 250 + PIPE_SPAWN_DISTANCE),
    ]);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState('countdown');
    setCountdown(3);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (gameState !== 'countdown') return;
    const timer = setInterval(() => {
      setCountdown((val) => {
        if (val <= 1) {
          clearInterval(timer);
          setGameState('playing');
          return 0;
        }
        return val - 1;
      });
    }, 800); // Slightly faster countdown
    return () => clearInterval(timer);
  }, [gameState]);

  // --- User Input Handling ---

  const handleUserAction = useCallback(() => {
    if (gameState === 'playing') {
      setJumpQueued(true);
    } else if (gameState === 'idle' || gameState === 'gameover') {
      startGame();
    }
  }, [gameState, startGame]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleUserAction();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUserAction]);

  // --- Game Loop ---

  useGameLoop((delta) => {
    if (gameState !== 'playing') return;

    const gameSpeed = speed * delta;

    // 1. Update Bird Physics
    setBird((b) => {
      const newBird = updateBird(b, delta, jumpQueued);
      if (jumpQueued) setJumpQueued(false);
      return newBird;
    });

    // 2. Update Pipes
    setPipes((currentPipes) => {
      // Move existing pipes
      let newPipes = currentPipes.map((pipe) => ({ ...pipe, x: pipe.x - gameSpeed }));

      // Remove pipes that are off-screen
      newPipes = newPipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

      // Add a new pipe when the last one is far enough
      const lastPipe = newPipes[newPipes.length - 1];
      if (lastPipe && lastPipe.x < CANVAS.width - PIPE_SPAWN_DISTANCE) {
        newPipes.push(createPipe(lastPipe.x + PIPE_SPAWN_DISTANCE));
      }

      // 3. Update Score
      newPipes = newPipes.map((pipe) => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 70) { // BIRD_X_POSITION
          setScore((s) => {
            const newScore = s + 1;
            setBestScore((bs) => Math.max(bs, newScore));
            return newScore;
          });
          return { ...pipe, passed: true };
        }
        return pipe;
      });

      return newPipes;
    });

    // 4. Increase speed gradually
    setSpeed((s) => Math.min(MAX_SPEED, s + 0.0005 * delta));
  });

  // 5. Check for Collision
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (checkCollision(bird, pipes, PIPE_GAP, CANVAS.height)) {
      setGameState('gameover');
    }
  }, [bird, pipes, gameState]);

  return (
    <div
      className="app-shell"
      onClick={handleUserAction}
      style={{
        '--game-width': `${CANVAS.width}px`,
        '--game-height': `${CANVAS.height}px`,
      }}
    >
      <div className="game-stage">
        <Background speed={speed} />
        <Bird y={bird.y} rotation={bird.rotation} state={gameState} />
        {pipes.map((pipe, index) => (
          <Pipe
            key={index}
            x={pipe.x}
            gapY={pipe.gapY}
            gap={PIPE_GAP}
            width={PIPE_WIDTH}
          />
        ))}
        <HUD
          score={score}
          bestScore={bestScore}
          gameState={gameState}
          countdown={countdown}
          onStart={startGame}
          onTogglePause={() => setGameState(p => p === 'playing' ? 'paused' : 'playing')}
          onToggleSound={() => setSoundOn(s => !s)}
          soundOn={soundOn}
        />
      </div>
    </div>
  );
}