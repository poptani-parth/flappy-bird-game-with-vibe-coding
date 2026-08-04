// --- Game Constants ---
const BIRD_X_POSITION = 70;
const BIRD_SIZE = 38;
const BIRD_RADIUS = BIRD_SIZE / 2;
const PIPE_WIDTH = 60; // As requested

// --- Physics Parameters ---
const GRAVITY = 0.22; // Smoother gravity
const JUMP_STRENGTH = -6.8; // Reduced jump strength
const MAX_VELOCITY = 10;
const MIN_VELOCITY = -12;
const ROTATION_UP_LIMIT = -25;
const ROTATION_DOWN_LIMIT = 90;
const ROTATION_RATE = 5;
const COLLISION_TOLERANCE = 10; // 4-6px tolerance

export const initialBirdState = {
  y: 300, // Centered for new canvas height
  velocity: 0,
  rotation: 0,
};

/**
 * Updates the bird's state for the current frame.
 * @param {object} bird - The current bird state.
 * @param {number} deltaTime - The time elapsed since the last frame.
 * @param {boolean} isJumping - Whether a jump was triggered this frame.
 * @returns {object} The new bird state.
 */
export function updateBird(bird, deltaTime, isJumping) {
  let { y, velocity, rotation } = bird;

  if (isJumping) {
    velocity = JUMP_STRENGTH;
  } else {
    velocity += GRAVITY * deltaTime;
  }

  velocity = Math.max(MIN_VELOCITY, Math.min(MAX_VELOCITY, velocity));
  y += velocity * deltaTime;

  // Smooth rotation based on velocity
  if (velocity < 0) {
    rotation = Math.max(ROTATION_UP_LIMIT, rotation - ROTATION_RATE * deltaTime * 1.2);
  } else if (y < 720) { // Stop rotating when hitting the ground
    rotation = Math.min(ROTATION_DOWN_LIMIT, rotation + ROTATION_RATE * deltaTime);
  }

  return { ...bird, y, velocity, rotation };
}

/**
 * Checks for collisions between the bird and the environment (pipes, ground, ceiling).
 * @param {object} bird - The current bird state.
 * @param {Array<object>} pipes - The array of active pipes.
 * @param {number} pipeGap - The vertical gap between pipes.
 * @param {number} canvasHeight - The height of the game canvas.
 * @returns {boolean} True if a collision is detected, false otherwise.
 */
export function checkCollision(bird, pipes, pipeGap, canvasHeight) {
  const birdCircle = {
    x: BIRD_X_POSITION,
    y: bird.y,
    radius: BIRD_RADIUS - COLLISION_TOLERANCE,
  };

  // 1. Ground and Ceiling Collision
  if (birdCircle.y + birdCircle.radius > canvasHeight - 92 || birdCircle.y - birdCircle.radius < 0) {
    return true;
  }

  // 2. Pipe Collision
  for (const pipe of pipes) {
    // --- CRITICAL FIX: Skip pipes that are already behind the bird ---
    // This prevents the "game over after pass" bug.
    if (pipe.passed) {
      continue;
    }
    // Define the two pipe rectangles for collision detection
    const topPipeRect = {
      x: pipe.x,
      y: 0,
      width: PIPE_WIDTH,
      height: pipe.gapY,
    };

    const bottomPipeRect = {
      x: pipe.x,
      y: pipe.gapY + pipeGap,
      width: PIPE_WIDTH,
      height: canvasHeight - (pipe.gapY + pipeGap),
    };

    // Perform circle-vs-rectangle collision check
    if (
      isCircleCollidingWithRect(birdCircle, topPipeRect) ||
      isCircleCollidingWithRect(birdCircle, bottomPipeRect)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Helper function for precise circle-vs-rectangle collision detection.
 */
function isCircleCollidingWithRect(circle, rect) {
  // Find the closest point on the rectangle to the circle's center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate the distance between the circle's center and this closest point
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // If the distance is less than the circle's radius, a collision has occurred
  return distanceSquared < circle.radius * circle.radius;
}