"use strict";

// TurtleGeneration represents one cohort of sea turtles that are born during
// the same step.  This cohort will never grow or shrink, and will always
// execute the same DNA command at the same time, so we group them together for
// better performance.
class TurtleGeneration {
  constructor(cap) {
    this.length = 0;
    this.x = new Int32Array(cap);
    this.y = new Int32Array(cap);
    this.dx = new Int32Array(cap);
    this.dy = new Int32Array(cap);
  }

  reset() {
    this.length = 0;
  }

  tryAppend(x, y, dx, dy) {
    if (this.length === this.x.length) {
      return false
    }
    this.x[this.length] = x;
    this.y[this.length] = y;
    this.dx[this.length] = dx;
    this.dy[this.length] = dy;
    this.length++;
    return true;
  }

  baby(babyGen, babySet, size) {
    if (this.length > 0) {
      //console.log("baby:", this.length);
    }
    // If the baby generation doesn't have enough capacity, re-allocate to make
    // it big enough.
    if (babyGen.x.length - babyGen.length < this.length) {
      let cap = babyGen.x.length;
      do {
        cap *= 2;
      } while (cap - babyGen.length < this.length);
      const x = new Int32Array(cap);
      x.set(babyGen.x);
      babyGen.x = x;
      const y = new Int32Array(cap);
      y.set(babyGen.y);
      babyGen.y = y;
      const dx = new Int32Array(cap);
      dx.set(babyGen.dx);
      babyGen.dx = dx;
      const dy = new Int32Array(cap);
      dy.set(babyGen.dy);
      babyGen.dy = dy;
    }
    for (let i = 0; i < this.length; i++) {
      const j = this.x[i] + this.y[i] * size;
      // Each direction needs a separate bit in the babySetMask.
      //
      //        dx  dy   r   s
      //     E   1   0   1   4
      //    NE   1  -1  -2   2
      //     N   0  -1  -3   1
      //    NW  -1  -1  -4   0
      //     W  -1   0  -1   3
      //    SW  -1   1   2   5
      //     S   0   1   3   6
      //    SE   1   1   4   7
      //
      //   r = dx + dy * 3
      //   s = r + 3 + (r < 0)
      //
      const r = this.dx[i] + this.dy[i] * 3;
      const s = r + 3 + (r < 0);
      const babySetMask = 1 << s;
      //console.log(s, babySet[j]);
      if ((babySet[j] & babySetMask) === 0) {
        babySet[j] |= babySetMask;
        babyGen.x[babyGen.length] = this.x[i];
        babyGen.y[babyGen.length] = this.y[i];
        babyGen.dx[babyGen.length] = this.dx[i];
        babyGen.dy[babyGen.length] = this.dy[i];
        babyGen.length++;
      }
    }
    if (babyGen.length > 0) {
      //console.log("added babies:", babyGen.length);
    }
  }

  forward(sizeMask) {
    if (this.length > 0) {
      //console.log("forward:", this.length);
    }
    // To go forward we simply add dx to x and dy to y.
    for (let i = 0; i < this.length; i++) {
      this.x[i] = (this.x[i] + this.dx[i]) & sizeMask;
    }
    for (let i = 0; i < this.length; i++) {
      this.y[i] = (this.y[i] + this.dy[i]) & sizeMask;
    }
  }

  left() {
    for (let i = 0; i < this.length; i++) {
      // Rotate counter-clockwise by 45 degrees:
      //
      //        dx  dy   a   b   c   d   e  dx' dy'
      //     E   1   0   0   1  -1   0   0   1  -1  NE
      //    NE   1  -1  -1   0  -2   0   2   0  -1   N
      //     N   0  -1   0  -1  -1   0   0  -1  -1  NW
      //    NW  -1  -1   1  -2   0  -2   0  -1   0   W
      //     W  -1   0   0  -1   1   0   0  -1   1  SW
      //    SW  -1   1  -1   0   2   0  -2   0   1   S
      //     S   0   1   0   1   1   0   0   1   1  SE
      //    SE   1   1   1   2   0   2   0   1   0   E
      //
      //   a = dx * dy
      //   b = dx + dy
      //   c = dy - dx
      //   d = a * b
      //   e = a * c
      //   dx' = b - d / 2
      //   dy' = c + e / 2
      //
      const a = this.dx[i] * this.dy[i];
      const b = this.dx[i] + this.dy[i];
      const c = this.dy[i] - this.dx[i];
      const d = a * b;
      const e = a * c;
      this.dx[i] = b - d / 2;
      this.dy[i] = c + e / 2;
    }
  }

  right() {
    for (let i = 0; i < this.length; i++) {
      // Rotate clockwise by 45 degrees:
      //
      //        dx  dy   m   n   o   p   q  dx' dy'
      //     E   1   0   0   1   1   0   0   1   1  SE
      //    SE   1   1   1   0   2   0   2   0   1   S
      //     S   0   1   0  -1   1   0   0  -1   1  SW
      //    SW  -1   1  -1  -2   0   2   0  -1   0   W
      //     W  -1   0   0  -1  -1   0   0  -1  -1  NW
      //    NW  -1  -1   1   0  -2   0  -2   0  -1   N
      //     N   0  -1   0   1  -1   0   0   1  -1  NE
      //    NE   1  -1  -1   2   0  -2   0   1   0   E
      //
      //   m = dx * dy
      //   n = dx - dy
      //   o = dy + dx
      //   p = m * n
      //   q = m * o
      //   dx' = n + p / 2
      //   dy' = o - q / 2
      //
      const m = this.dx[i] * this.dy[i];
      const n = this.dx[i] - this.dy[i];
      const o = this.dy[i] + this.dx[i];
      const p = m * n;
      const q = m * o;
      this.dx[i] = n + p / 2;
      this.dy[i] = o - q / 2;
    }
  }

  poop(poopBuffer, size) {
    if (this.length > 0) {
      //console.log("poop:", this.length);
    }
    for (let i = 0; i < this.length; i++) {
      const j = this.x[i] + this.y[i] * size;
      poopBuffer.data[j * 4 + 0] -= 0x33;
      poopBuffer.data[j * 4 + 1] -= 0x33;
      poopBuffer.data[j * 4 + 2] -= 0x33;
    }
  }

  clean(poopBuffer, size) {
    for (let i = 0; i < this.length; i++) {
      const j = this.x[i] + this.y[i] * size;
      poopBuffer.data[j * 4 + 0] += 0x33;
      poopBuffer.data[j * 4 + 1] += 0x33;
      poopBuffer.data[j * 4 + 2] += 0x33;
    }
  }

  draw(ctx) {
    if (this.length > 0) {
      //console.log("draw:", this.length);
    }
    ctx.fillStyle = "#0e8e81";
    for (let i = 0; i < this.length; i++) {
      //console.log("fillRect", this.x[i], this.y[i]);
      ctx.fillRect(this.x[i], this.y[i], 1, 1);
    }
  }
}

// Simulation holds all of the sea turtle generations and their positions within
// the DNA program.  Simulation also applies DNA commands to each sea turtle
// generation, and tracks some stats.
class Simulation {
  constructor(dna, scale, ctx) {
    this.dna = dna;
    this.size = 1 << scale;
    this.turtleGens = new Array(this.dna.length + 1);
    const defaultTurtleGenSize = Math.max(16, this.size >> 2);
    for (let g = 0; g < this.turtleGens.length; g++) {
      this.turtleGens[g] = new TurtleGeneration(defaultTurtleGenSize);
    }
    this.babyG = this.turtleGens.length - 1;
    const babySetLen = 1 << scale << scale;
    this.babySet = new Uint8Array(babySetLen);
    this.steps = 0;
    this.turtles = 0;
    this.visited = 0;

    this.ctx = ctx;
    this.poopBuffer = this.ctx.createImageData(this.size, this.size);

    this.reset();
  }

  reset() {
    //console.log("reset");
    for (let g = 0; g < this.turtleGens.length; g++) {
      this.turtleGens[g].reset();
    }

    this.babyG = this.turtleGens.length - 1;
    this.babySet.fill(0);
    this.steps = 0;
    this.turtles = 0;
    this.visited = 0;

    // Add the first turtle in the middle facing east.
    const halfway = this.size >> 1;
    this.turtleGens[this.babyG].tryAppend(halfway, halfway, 1, 0);
    this.babySet[halfway + halfway * this.size] = 1 << 4;
    this.turtles++;
    this.visited++;

    this.poopBuffer.data.fill(0xff);
  }

  resetDNA(dna) {
    //console.log("resetDNA:", dna);
    this.dna = dna;
    const defaultTurtleGenSize = Math.max(16, this.size >> 2);
    while (this.turtleGens.length < this.dna.length + 1) {
      this.turtleGens.push(new TurtleGeneration(defaultTurtleGenSize));
    }
    this.turtleGens.length = this.dna.length + 1;
    this.reset();
  }

  resetScale(scale, ctx) {
    //console.log("resetScale:", scale);
    this.size = 1 << scale;
    const babySetLen = 1 << scale << scale;
    if (this.babySet.length < babySetLen) {
      this.babySet = new Uint8Array(babySetLen);
    }
    this.ctx = ctx;
    this.poopBuffer = this.ctx.createImageData(this.size, this.size);
    this.reset();
  }

  step() {
    // Logically move all turtle generations forward to the next DNA command,
    // including the baby generation, by moving the baby generation position
    // backward to point at the oldest generation, which dies and is
    // reincarnated as babies.
    this.babyG--;
    if (this.babyG < 0) {
      this.babyG = this.turtleGens.length - 1;
    }
    //console.log("babyG:", this.babyG);
    const babyGen = this.turtleGens[this.babyG];
    // Reset the newly-reincarnated baby generation.
    this.turtles -= babyGen.length;
    babyGen.reset();
    // Perform the next DNA command for all turtle generations.
    for (let i = 0; i < this.dna.length; i++) {
      const g = (this.babyG + 1 + i) % this.turtleGens.length;
      //console.log("DNA cmd:", i, this.dna[i], "on gen:", g);
      switch (this.dna[i]) {
      case 'B':
        //console.log(this.babyG, babyGen);
        this.turtleGens[g].baby(babyGen, this.babySet, this.size);
        break;
      case 'F':
        this.turtleGens[g].forward(this.size - 1);
        break;
      case 'L':
        this.turtleGens[g].left();
        break;
      case 'R':
        this.turtleGens[g].right();
        break;
      case 'P':
        this.turtleGens[g].poop(this.poopBuffer, this.size);
        break;
      case 'C':
        this.turtleGens[g].clean(this.poopBuffer, this.size);
        break;
      }
    }
    if (babyGen.length > 0) {
      //console.log("added total babies", babyGen.length);
    }
    // Update stats.
    this.steps++;
    this.turtles += babyGen.length;
    this.visited += babyGen.length;
  }

  draw() {
    // Start with the poop layer.
    this.ctx.putImageData(this.poopBuffer, 0, 0);
    // Draw each turtle generation on top.
    for (let g = 0; g < this.turtleGens.length; g++) {
      this.turtleGens[g].draw(this.ctx);
    }
  }
}

class Playback {
  constructor(sim, speed, updateUI) {
    this.sim = sim;
    this.speed = speed;
    // stepMS is the target duration of one step, with speed 0 having a target
    // duration of 16 ms.
    this.stepMS = 2 ** -this.speed * 16;
    // frameMS is the minimum time between requestAnimationFrame callbacks for
    // this system.  We have to discover it as we run the game loop, since we
    // don't know the framerate of this system, so we start with something high
    // and then lower it.
    this.frameMS = 33;
    this.accumulator = 0;
    this.pause = false;
    this.running = false;
    this.updateUI = updateUI;
  }

  restart() {
    if (!this.pause && !this.running) {
      requestAnimationFrame(time => this.animate(time, time - this.stepMS));
      this.accumulator = 0;
      this.running = true;
    }
  }

  playPause(pauseBtn) {
    this.pause = !this.pause;
    pauseBtn.textContent = this.pause ? "\u25B6\uFE0E" : "\u23F8\uFE0E";
    this.restart();
  }

  // Each call to faster doubles the speed of playback.
  faster() {
    if (this.speed < 5) {
      this.speed++;
      this.stepMS = 2 ** -this.speed * 16;
    }
  }

  // Each call to slower halves the speed of playback;
  slower() {
    if (this.speed > -5) {
      this.speed--;
      this.stepMS = 2 ** -this.speed * 16;
    }
  }

  // animate is the game loop.  It is called once per frame.
  animate(curTime, prevTime) {
    ////console.log("animate");
    if (this.sim.turtles < 1 || this.pause) {
      //console.log("stopping");
      this.running = false;
      this.updateUI();
      return;
    }
    let elapsed = curTime - prevTime;
    this.accumulator += elapsed;
    // Discover the frameMS for this system.
    //if (this.frameMS > elapsedMS && elapsedMS > 2) {
    //  this.frameMS = elapsedMS;
    //}
    this.frameMS = 0.9 * this.frameMS + 0.1 * elapsed;
    const budget = this.frameMS - 2;
    const loopStart = performance.now();
    while (this.accumulator >= this.stepMS) {
      this.sim.step();
      this.accumulator -= this.stepMS;
      // Bound the amount of work we do in case there was a long delay between
      // callbacks or we spent too long updating the simulation.
      if (performance.now() - loopStart > budget) {
        //console.log("hit budget");
        this.accumulator = 0;
        break;
      }
    }
    //console.log("drawing");
    this.sim.draw();
    this.updateUI();
    requestAnimationFrame(time => this.animate(time, curTime));
  }
}

function main() {
  const seaCanvas  = document.getElementById("sea");
  const turtlesOut = document.getElementById("turtles");
  const actionsOut = document.getElementById("actions");
  const visitedOut = document.getElementById("visited");
  const dnaTextbox = document.getElementById("dna");
  const restartBtn = document.getElementById("restart");
  const pauseBtn   = document.getElementById("pause");
  const fasterBtn  = document.getElementById("faster");
  const slowerBtn  = document.getElementById("slower");
  const forwardBtn = document.getElementById("forward");
  const leftBtn    = document.getElementById("left");
  const rightBtn   = document.getElementById("right");
  const poopBtn    = document.getElementById("poop");
  const babyBtn    = document.getElementById("baby");
  //const delBtn     = document.getElementById("delete");
  const cleanBtn   = document.getElementById("clean");
  const biggerBtn  = document.getElementById("bigger");
  const smallerBtn = document.getElementById("smaller");

  let scale = 8;
  seaCanvas.width = 1 << scale;
  seaCanvas.height = 1 << scale;
  let ctx = seaCanvas.getContext("2d", {alpha: false});
  ctx.imageSmoothingEnabled = false;
  const sim = new Simulation(dnaTextbox.value, scale, ctx);

  const updateUI = () => {
    turtlesOut.value = sim.turtles;
    actionsOut.value = sim.steps;
    visitedOut.value = sim.visited;
  };

  const playback = new Playback(sim, 0, updateUI);

  dnaTextbox.addEventListener("input", () => {
    sim.resetDNA(dnaTextbox.value);
    sim.draw();
    updateUI();
    playback.restart();
  });

  forwardBtn.addEventListener("click", () => {
    dnaTextbox.value += "F";
    sim.resetDNA(dnaTextbox.value);
    sim.draw();
    updateUI();
    playback.restart();
  });
  leftBtn.addEventListener("click", () => {
    dnaTextbox.value += "L";
    sim.resetDNA(dnaTextbox.value);
    sim.draw();
    updateUI();
    playback.restart();
  });
  rightBtn.addEventListener("click", () => {
    dnaTextbox.value += "R";
    sim.resetDNA(dnaTextbox.value);
    sim.draw();
    updateUI();
    playback.restart();
  });
  poopBtn.addEventListener("click", () => {
    dnaTextbox.value += "P";
    sim.resetDNA(dnaTextbox.value);
    sim.draw();
    updateUI();
    playback.restart();
  });
  babyBtn.addEventListener("click", () => {
    dnaTextbox.value += "B";
    sim.resetDNA(dnaTextbox.value);
    sim.draw();
    updateUI();
    playback.restart();
  });
  cleanBtn.addEventListener("click", () => {
    dnaTextbox.value += "C";
    sim.resetDNA(dnaTextbox.value);
    sim.draw();
    updateUI();
    playback.restart();
  });
  /*
  delBtn.addEventListener("click", () => {
    dnaTextbox.value = dnaTextbox.value.slice(0, -1);
    sim.resetDNA(dnaTextbox.value);
    sim.draw();
    updateUI();
    playback.restart();
    });
  */

  biggerBtn.addEventListener("click", () => {
    if (scale <= 2) {
      return;
    }
    scale--;
    seaCanvas.width = 1 << scale;
    seaCanvas.height = 1 << scale;
    ctx = seaCanvas.getContext("2d", {alpha: false});
    ctx.imageSmoothingEnabled = false;
    sim.resetScale(scale, ctx);
    sim.draw();
    updateUI();
    playback.restart();
  });
  smallerBtn.addEventListener("click", () => {
    if (scale >= 12) {
      return;
    }
    scale++;
    seaCanvas.width = 1 << scale;
    seaCanvas.height = 1 << scale;
    ctx = seaCanvas.getContext("2d", {alpha: false});
    ctx.imageSmoothingEnabled = false;
    sim.resetScale(scale, ctx);
    sim.draw();
    updateUI();
    playback.restart();
  });

  restartBtn.addEventListener("click", () => {
    sim.reset();
    sim.draw();
    updateUI();
    playback.restart();
  });

  pauseBtn.addEventListener("click", () => playback.playPause(pauseBtn));
  fasterBtn.addEventListener("click", () => playback.faster());
  slowerBtn.addEventListener("click", () => playback.slower());

  playback.restart();
}

document.addEventListener("DOMContentLoaded", main)

// From Matilda: CLCLLRPRPFBFBLCLCRPRPFBFBRPLFBCPRLFBC
// From Michael: FFFFFFFFFFFFFFFFFFFFFFPFFFFFFFFRBFFFB
