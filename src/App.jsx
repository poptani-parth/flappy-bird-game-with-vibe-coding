import { useCallback, useEffect, useState } from 'react';
import { Pause, Play, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import Bird from './components/Bird';
import Pipe from './components/Pipe';
import HUD from './components/HUD';
import Background from './components/Background'; // New component for background effects
import useGameLoop from './hooks/useGameLoop';
import { updateBird, checkCollision, initialBirdState } from './game/physics';

// --- New Desktop-First Dimensions ---
const CANVAS = { width: 520, height: 820 };
const PIPE_WIDTH = 60;
const PIPE_SPAWN_DISTANCE = 380; // Consistent spacing
const INITIAL_SPEED = 2.5;
const MAX_SPEED = 5.5;
const DEFAULT_PIPE_GAP = 210;
const DEFAULT_BIRD_COLOR = '#ffd700';
const DEFAULT_PIPE_COLOR = '#3ba53a';
const DEFAULT_GAME_COLOR_TOP = '#7bb1ed';
const DEFAULT_GAME_COLOR_BOTTOM = '#a2d2ff';

/**
 * Creates a new pipe with a random vertical position.
 * @param {number} x - The initial x-position of the pipe.
 * @returns {object} A new pipe object.
 */
function createPipe(x, gap) {
    const minGapY = 150;
    const maxGapY = CANVAS.height - gap - 150;

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
  const [gameState, setGameState] = useState('idle'); // idle, countdown, playing, gameover, paused
  const [bird, setBird] = useState(initialBirdState);
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem('bestScore') || 0));
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [baseSpeed, setBaseSpeed] = useState(INITIAL_SPEED);
  const [pipeGap, setPipeGap] = useState(DEFAULT_PIPE_GAP);
  const [birdColor, setBirdColor] = useState(DEFAULT_BIRD_COLOR);
  const [pipeColor, setPipeColor] = useState(DEFAULT_PIPE_COLOR);
  const [gameColorTop, setGameColorTop] = useState(DEFAULT_GAME_COLOR_TOP);
  const [gameColorBottom, setGameColorBottom] = useState(DEFAULT_GAME_COLOR_BOTTOM);
  const [jumpQueued, setJumpQueued] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [soundOn, setSoundOn] = useState(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  // Persist best score to local storage
  useEffect(() => {
    localStorage.setItem('bestScore', String(bestScore));
  }, [bestScore]);

  // --- Game State Management ---

  const startGame = useCallback(() => {
    setBird(initialBirdState);
    // Ensure pipes spawn completely off-screen to start
    setPipes([
      createPipe(CANVAS.width + 250, pipeGap),
      createPipe(CANVAS.width + 250 + PIPE_SPAWN_DISTANCE, pipeGap),
    ]);
    setScore(0);
    setSpeed(baseSpeed);
    setGameState('countdown');
    setCountdown(3);
  }, [baseSpeed, pipeGap]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    setSpeed(baseSpeed);
  }, [baseSpeed, gameState]);

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
    } else if (gameState === 'paused') {
      setGameState('playing');
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
        newPipes.push(createPipe(lastPipe.x + PIPE_SPAWN_DISTANCE, pipeGap));
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
    if (checkCollision(bird, pipes, pipeGap, CANVAS.height)) {
      setGameState('gameover');
    }
  }, [bird, pipes, gameState]);

  const isPlaying = gameState === 'playing';

  const settingsPanel = (
    <aside className="panel settings-panel">
      <h2>Game Settings</h2>

      <div className="setting-group">
        <label htmlFor="bird-speed">Bird speed</label>
        <div className="setting-row">
          <input
            id="bird-speed"
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={baseSpeed}
            onChange={(event) => {
              const value = Number(event.target.value);
              setBaseSpeed(value);
              if (gameState === 'playing') setSpeed(value);
            }}
          />
          <span>{baseSpeed.toFixed(1)}</span>
        </div>
      </div>

      <div className="setting-group">
        <label htmlFor="pipe-gap">Pipe gap</label>
        <div className="setting-row">
          <input
            id="pipe-gap"
            type="range"
            min="140"
            max="300"
            step="10"
            value={pipeGap}
            onChange={(event) => setPipeGap(Number(event.target.value))}
          />
          <span>{pipeGap}px</span>
        </div>
      </div>

      <div className="setting-group">
        <label htmlFor="bird-color">Bird color</label>
        <input
          id="bird-color"
          type="color"
          value={birdColor}
          onChange={(event) => setBirdColor(event.target.value)}
        />
      </div>

      <div className="setting-group">
        <label htmlFor="pipe-color">Pipe color</label>
        <input
          id="pipe-color"
          type="color"
          value={pipeColor}
          onChange={(event) => setPipeColor(event.target.value)}
        />
      </div>

      <div className="setting-group">
        <label htmlFor="game-color-top">Game area top</label>
        <input
          id="game-color-top"
          type="color"
          value={gameColorTop}
          onChange={(event) => setGameColorTop(event.target.value)}
        />
      </div>

      <div className="setting-group">
        <label htmlFor="game-color-bottom">Game area bottom</label>
        <input
          id="game-color-bottom"
          type="color"
          value={gameColorBottom}
          onChange={(event) => setGameColorBottom(event.target.value)}
        />
      </div>
    </aside>
  );

  const controlsPanel = (
    <aside className="panel controls-panel">
      <h2>Game Controls</h2>

      <div className="status-row">
        <div className="status-card">
          <span>Status</span>
          <strong>{gameState === 'idle' ? 'Ready' : gameState === 'gameover' ? 'Game Over' : gameState === 'paused' ? 'Paused' : 'Playing'}</strong>
        </div>
        <div className="status-card">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div className="status-card">
          <span>Best</span>
          <strong>{bestScore}</strong>
        </div>
      </div>

      <div className="control-buttons">
        <button className="action-button" type="button" onClick={startGame}>
          <RefreshCcw size={18} /> Restart
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() => setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'))}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? 'Pause' : 'Resume'}
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() => setSoundOn((prev) => !prev)}
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          {soundOn ? 'Mute' : 'Sound'}
        </button>
      </div>

      <div className="control-note">
        Tap the game area or press <strong>Space</strong> to flap. Settings update instantly.
      </div>
    </aside>
  );

  return (
    <div
      className="app-shell"
      style={{
        '--game-width': `${CANVAS.width}px`,
        '--game-height': `${CANVAS.height}px`,
      }}
    >
      <div className="stage-layout">
        {settingsPanel}

        <div className="game-container">
          <div className="mobile-toolbar">
            <button className="tool-button" type="button" onClick={() => setShowSettingsDrawer(true)}>
              Settings
            </button>
            <button className="tool-button" type="button" onClick={() => setShowControlsDrawer(true)}>
              Controls
            </button>
          </div>

          <div className="game-stage-wrapper">
            <div
              className="game-stage"
              onClick={handleUserAction}
              style={{
                '--game-gradient-top': gameColorTop,
                '--game-gradient-bottom': gameColorBottom,
              }}
            >
              <Background speed={speed} />
              <Bird y={bird.y} rotation={bird.rotation} state={gameState} color={birdColor} />
              {pipes.map((pipe, index) => (
                <Pipe
                  key={index}
                  x={pipe.x}
                  gapY={pipe.gapY}
                  gap={pipeGap}
                  width={PIPE_WIDTH}
                  color={pipeColor}
                />
              ))}
              <HUD
                score={score}
                bestScore={bestScore}
                gameState={gameState}
                countdown={countdown}
                onStart={startGame}
                onTogglePause={() => setGameState((p) => (p === 'playing' ? 'paused' : 'playing'))}
                onToggleSound={() => setSoundOn((s) => !s)}
                soundOn={soundOn}
              />
            </div>
          </div>
        </div>

        {controlsPanel}
      </div>

      {showSettingsDrawer && (
        <div className="drawer-overlay" onClick={() => setShowSettingsDrawer(false)}>
          <div className="drawer-content" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button drawer-close-button" onClick={() => setShowSettingsDrawer(false)} aria-label="Close settings">
              ✕
            </button>
            {settingsPanel}
          </div>
        </div>
      )}

      {showControlsDrawer && (
        <div className="drawer-overlay" onClick={() => setShowControlsDrawer(false)}>
          <div className="drawer-content" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button drawer-close-button" onClick={() => setShowControlsDrawer(false)} aria-label="Close controls">
              ✕
            </button>
            {controlsPanel}
          </div>
        </div>
      )}
    </div>
  );
}
