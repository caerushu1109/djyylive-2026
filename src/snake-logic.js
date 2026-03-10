export const GRID_SIZE = 16;
export const INITIAL_DIRECTION = "right";
export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createInitialSnake() {
  return [
    { x: 2, y: 8 },
    { x: 1, y: 8 },
    { x: 0, y: 8 },
  ];
}

export function createInitialState(random = Math.random) {
  const snake = createInitialSnake();
  return {
    gridSize: GRID_SIZE,
    snake,
    direction: INITIAL_DIRECTION,
    queuedDirection: INITIAL_DIRECTION,
    food: placeFood(snake, GRID_SIZE, random),
    score: 0,
    status: "ready",
  };
}

export function queueDirection(state, nextDirection) {
  if (!(nextDirection in DIRECTIONS)) {
    return state;
  }

  const blockedDirection = state.snake.length > 1 ? state.direction : null;
  if (blockedDirection && OPPOSITES[blockedDirection] === nextDirection) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  };
}

export function stepGame(state, random = Math.random) {
  if (
    state.status === "game-over" ||
    state.status === "paused" ||
    state.status === "ready"
  ) {
    return state;
  }

  const direction = canTurn(state.direction, state.queuedDirection)
    ? state.queuedDirection
    : state.direction;
  const vector = DIRECTIONS[direction];
  const nextHead = {
    x: state.snake[0].x + vector.x,
    y: state.snake[0].y + vector.y,
  };

  const hasFood = state.food !== null;
  const ateFood = hasFood && nextHead.x === state.food.x && nextHead.y === state.food.y;
  const collisionBody = ateFood ? state.snake : state.snake.slice(0, -1);

  if (hitsBoundary(nextHead, state.gridSize) || hitsSnake(nextHead, collisionBody)) {
    return {
      ...state,
      direction,
      queuedDirection: direction,
      status: "game-over",
    };
  }

  const nextSnake = [nextHead, ...state.snake];

  if (!ateFood) {
    nextSnake.pop();
  }

  const nextFood = ateFood ? placeFood(nextSnake, state.gridSize, random) : state.food;

  return {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: direction,
    food: nextFood,
    score: ateFood ? state.score + 1 : state.score,
    status: nextFood === null ? "game-over" : "running",
  };
}

export function togglePause(state) {
  if (state.status === "game-over" || state.status === "ready") {
    return state;
  }

  return {
    ...state,
    status: state.status === "paused" ? "running" : "paused",
  };
}

export function placeFood(snake, gridSize, random = Math.random) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  const index = Math.floor(random() * openCells.length);
  return openCells[index];
}

export function canTurn(currentDirection, nextDirection) {
  return currentDirection === nextDirection || OPPOSITES[currentDirection] !== nextDirection;
}

export function hitsBoundary(position, gridSize) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize
  );
}

export function hitsSnake(position, snake) {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}
