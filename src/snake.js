/* "How about a break from AI?" Snake on a dot grid, in the footer's dialog. Loaded on first click. */
const W = 24, H = 12, TICK = 120;
const DIRS = { ArrowRight: 1, d: 1, ArrowLeft: -1, a: -1, ArrowDown: W, s: W, ArrowUp: -W, w: -W };

// One move of the game; pure so it can be checked on its own (see the self-check below).
// Returns the new state, or null when the snake hits a wall or itself.
export function advance({ snake, dir, food }) {
  const h = snake[0], x = (h % W) + (dir === 1 ? 1 : dir === -1 ? -1 : 0), y = Math.floor(h / W) + (dir === W ? 1 : dir === -W ? -1 : 0);
  if (x < 0 || x >= W || y < 0 || y >= H) return null;
  const n = y * W + x, ate = n === food;
  const body = ate ? snake : snake.slice(0, -1); // the tail moves away unless the snake grows
  if (body.includes(n)) return null;
  return { snake: [n, ...body], dir, food, ate };
}

export function initSnake(dialog, t = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k])) {
  const board = dialog.querySelector("#board"), score = dialog.querySelector("#score");
  board.style.setProperty("--w", W);
  board.innerHTML = "<i></i>".repeat(W * H);
  const cells = board.children;
  let state, next, timer, points;

  const spawn = () => {
    const free = [...cells].map((_, i) => i).filter((i) => !state.snake.includes(i));
    state.food = free[Math.floor(Math.random() * free.length)];
  };
  const draw = () => {
    for (const c of cells) c.className = "";
    state.snake.forEach((i, k) => (cells[i].className = k ? "s" : "s head"));
    if (state.food != null) cells[state.food].className = "food";
  };
  function step() {
    if (next !== -state.dir) state.dir = next; // no turning back on yourself
    const s = advance(state);
    if (!s) { clearInterval(timer); score.textContent = t("Game over. Score {n}", { n: points }); return; }
    state = s;
    if (s.ate) { points++; score.textContent = t("Score {n}", { n: points }); spawn(); }
    draw();
  }
  // A new round waits for the first key or swipe, so nobody loses before they've started.
  function start() {
    clearInterval(timer);
    timer = null;
    const mid = (H >> 1) * W + (W >> 2);
    state = { snake: [mid + 2, mid + 1, mid], dir: 1 };
    next = 1; points = 0;
    spawn(); draw();
    score.textContent = t("Press an arrow key or swipe to start");
  }
  const steer = (d) => {
    next = d;
    if (timer === null) { score.textContent = t("Score {n}", { n: 0 }); timer = setInterval(step, TICK); }
  };

  dialog.addEventListener("keydown", (e) => {
    const d = DIRS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (d) { e.preventDefault(); steer(d); }
  });
  let touch = null; // swipe on phones
  board.addEventListener("pointerdown", (e) => (touch = { x: e.clientX, y: e.clientY }));
  board.addEventListener("pointerup", (e) => {
    if (!touch) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) steer(Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : Math.sign(dy) * W);
    touch = null;
  });
  dialog.querySelector("#game-again").addEventListener("click", start);
  dialog.querySelector("#game-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => clearInterval(timer));
  return start;
}

// Self-check: moving, growing, and dying on a wall or on itself.
{
  const s = advance({ snake: [2, 1, 0], dir: 1, food: 3 });
  console.assert(s.ate && s.snake.join() === "3,2,1,0", "snake grows on food");
  console.assert(advance({ snake: [W - 1, W - 2], dir: 1, food: 0 }) === null, "snake dies on the wall");
  console.assert(advance({ snake: [W + 1, W + 2, 2, 1, 0], dir: -W, food: 99 }) === null, "snake dies on itself");
  console.assert(advance({ snake: [1, W + 1, W, 0], dir: -1, food: 99 }).snake.join() === `0,1,${W + 1},${W}`, "head may enter the cell the tail leaves");
}
