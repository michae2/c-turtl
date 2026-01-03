// Copyright (c) 2025 Michael Erickson.  All rights reserved.

'use strict';

// TurtleGeneration represents one cohort of sea turtles that are born during
// the same step.  This cohort will never grow or shrink, and will always
// execute the same DNA instruction at the same time, so we group them together
// for better performance.  TurtleGeneration is a struct-of-arrays, meaning each
// individual turle is represented as an index within all of the arrays tracking
// turtle attributes such as (x, y) position and direction.
class TurtleGeneration {
  static MIN_CAPACITY = 16;

  constructor(capacity) {
    const cap = Math.max(TurtleGeneration.MIN_CAPACITY, capacity);
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
      if ((babySet[j] & babySetMask) === 0) {
        babySet[j] |= babySetMask;
        babyGen.x[babyGen.length] = this.x[i];
        babyGen.y[babyGen.length] = this.y[i];
        babyGen.dx[babyGen.length] = this.dx[i];
        babyGen.dy[babyGen.length] = this.dy[i];
        babyGen.length++;
      }
    }
  }

  forward(sizeMask) {
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
    for (let i = 0; i < this.length; i++) {
      const j = this.x[i] + this.y[i] * size;
      // Pooping makes the spot 20% darker.  (This relies on the
      // Uint8ClampedArray clamping behavior.)
      poopBuffer.data[j * 4 + 0] -= 0x33;
      poopBuffer.data[j * 4 + 1] -= 0x33;
      poopBuffer.data[j * 4 + 2] -= 0x33;
    }
  }

  clean(poopBuffer, size) {
    for (let i = 0; i < this.length; i++) {
      const j = this.x[i] + this.y[i] * size;
      // Cleaning makes the spot 33% lighter, but with some variation in red and
      // blue depending on direction to give a nice rainbow effect.  (This
      // relies on the Uint8ClampedArray clamping behavior.)
      poopBuffer.data[j * 4 + 0] += 0x55 + 0x55 * this.dx[i];
      poopBuffer.data[j * 4 + 1] += 0x55;
      poopBuffer.data[j * 4 + 2] += 0x55 + 0x55 * this.dy[i];
    }
  }

  // Turtle colors are found in the 50%-saturation-60%-lightness color wheel:
  // - FLR colors are hsl( 90, 50%, 60%), or #99cc66, close to YellowGreen,
  //   all the way to hsl(150, 50%, 60%), or #66cc99, close to MediumAquaMarine
  // - and C color is hsl(210, 50%, 60%), or #6699cc, close to CornflowerBlue
  // - and B color is hsl(270, 50%, 60%), or #9966cc, close to MediumPurple
  // - and P color is hsl( 30, 50%, 60%), or #cc9966, close to Peru
  static #turtleStyles = Object.freeze({
    F: [
      '#99cc66', '#7fcc66', '#66cc66',
      '#7fcc66', '#66cc66', '#66cc7f',
      '#66cc66', '#66cc7f', '#66cc99'
    ],
    L: [
      '#99cc66', '#7fcc66', '#66cc66',
      '#7fcc66', '#66cc66', '#66cc7f',
      '#66cc66', '#66cc7f', '#66cc99'
    ],
    R: [
      '#99cc66', '#7fcc66', '#66cc66',
      '#7fcc66', '#66cc66', '#66cc7f',
      '#66cc66', '#66cc7f', '#66cc99'
    ],
    C: [
      '#6699cc', '#6699cc', '#6699cc',
      '#6699cc', '#6699cc', '#6699cc',
      '#6699cc', '#6699cc', '#6699cc'
    ],
    B: [
      '#9966cc', '#9966cc', '#9966cc',
      '#9966cc', '#9966cc', '#9966cc',
      '#9966cc', '#9966cc', '#9966cc'
    ],
    P: [
      '#cc9966', '#cc9966', '#cc9966',
      '#cc9966', '#cc9966', '#cc9966',
      '#cc9966', '#cc9966', '#cc9966'
    ],
  });

  draw(ctx, ins) {
    const fillStyle = TurtleGeneration.#turtleStyles[ins];
    for (let i = 0; i < this.length; i++) {
      ctx.fillStyle = fillStyle[(this.dx[i] + 1) + (this.dy[i] + 1) * 3];
      ctx.fillRect(this.x[i], this.y[i], 1, 1);
    }
  }
}

// Simulation is a singleton class that holds all of the sea turtle generations
// and their positions within the DNA program.  Simulation also applies DNA
// instructions to each sea turtle generation, tracks some stats, and handles
// drawing the turtles and poop to the canvas.
class Simulation {
  static INVALID = /[^FLRBPC]/g;

  constructor(dna, scale, canvas) {
    this.dna = dna.replaceAll(Simulation.INVALID, '');
    this.size = 1 << scale;
    this.turtleGens = new Array(this.dna.length + 1);
    const defaultTurtleGenCapacity = this.size;
    for (let g = 0; g < this.turtleGens.length; g++) {
      this.turtleGens[g] = new TurtleGeneration(defaultTurtleGenCapacity);
    }
    this.babyG = this.turtleGens.length - 1;
    // babySet keeps track of births, so that we never repeat the exact same
    // birth twice.  This ensures that the simulation eventually ends.
    const babySetLen = 1 << scale << scale;
    this.babySet = new Uint8Array(babySetLen);
    this.steps = 0;
    this.turtles = 0;
    this.births = 0;

    this.canvas = canvas;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d', {alpha: false});
    this.ctx.imageSmoothingEnabled = false;
    this.poopBuffer = this.ctx.createImageData(this.size, this.size);

    this.reset();
  }

  reset() {
    for (let g = 0; g < this.turtleGens.length; g++) {
      this.turtleGens[g].reset();
    }

    this.babyG = this.turtleGens.length - 1;
    this.babySet.fill(0);
    this.steps = 0;
    this.turtles = 0;
    this.births = 0;

    // Add the first turtle in the middle facing east.
    const halfway = this.size >> 1;
    this.turtleGens[this.babyG].tryAppend(halfway, halfway, 1, 0);
    this.babySet[halfway + halfway * this.size] = 1 << 4;
    this.turtles++;
    this.births++;

    this.poopBuffer.data.fill(0xff);
  }

  resetDNA(dna) {
    this.dna = dna.replaceAll(Simulation.INVALID, '');
    const defaultTurtleGenSize = this.size;
    while (this.turtleGens.length < this.dna.length + 1) {
      this.turtleGens.push(new TurtleGeneration(defaultTurtleGenSize));
    }
    this.turtleGens.length = this.dna.length + 1;
    this.reset();
  }

  resetScale(scale) {
    if (this.size !== 1 << scale) {
      this.size = 1 << scale;
      const babySetLen = 1 << scale << scale;
      if (this.babySet.length < babySetLen) {
        this.babySet = new Uint8Array(babySetLen);
      }
      this.canvas.width = this.size;
      this.canvas.height = this.size;
      this.ctx = this.canvas.getContext('2d', {alpha: false});
      this.ctx.imageSmoothingEnabled = false;
      this.poopBuffer = this.ctx.createImageData(this.size, this.size);
    }
    this.reset();
  }

  step() {
    // Logically move all turtle generations forward to the next DNA
    // instruction, including the baby generation, by moving the baby generation
    // position backward to point at the oldest generation, which dies and is
    // reincarnated as babies.
    this.babyG--;
    if (this.babyG < 0) {
      this.babyG = this.turtleGens.length - 1;
    }
    const babyGen = this.turtleGens[this.babyG];
    // Reset the newly-reincarnated baby generation.
    this.turtles -= babyGen.length;
    babyGen.reset();
    // Perform the next DNA instruction for all turtle generations.
    for (let i = 0; i < this.dna.length; i++) {
      const g = (this.babyG + 1 + i) % this.turtleGens.length;
      switch (this.dna[i]) {
      case 'B':
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
    // Update stats.
    this.steps++;
    this.turtles += babyGen.length;
    this.births += babyGen.length;
  }

  draw() {
    // Start with the poop layer.
    this.ctx.putImageData(this.poopBuffer, 0, 0);
    // Draw each turtle generation on top, youngest to oldest.
    this.turtleGens[this.babyG].draw(this.ctx, 'F');
    for (let i = 0; i < this.dna.length; i++) {
      const g = (this.babyG + 1 + i) % this.turtleGens.length;
      this.turtleGens[g].draw(this.ctx, this.dna[i]);
    }
  }
}

// Scenario is a singleton class that holds the state defining each possible
// game scenario.  This state is persisted in the URL query string, and Scenario
// is responsible for loading from and storing to the URL.
class Scenario {
  static MIN_SCALE = 2;
  static MAX_SCALE = 10;
  static DEFAULT_SCALE = 6;
  static MIN_SPEED = -4;
  static MAX_SPEED = 3;
  static DEFAULT_SPEED = 0;
  // Scenario.INVALID is a little more permissive than Simulation.INVALID: it
  // allows whitespace.
  static INVALID = /[^FLRBPC\s]/g;

  constructor(dnaTextarea, speedRange, loopBox) {
    this.params = new URLSearchParams(window.location.search);

    this.dna = dnaTextarea.value.toUpperCase().replaceAll(Scenario.INVALID, '');
    if (this.params.has('dna')) {
      this.setDNA(this.params.get('dna'));
    }
    dnaTextarea.value = this.dna;

    this.scale = Scenario.DEFAULT_SCALE;
    if (this.params.has('scale')) {
      const parsedScale = parseInt(this.params.get('scale'));
      if (!Number.isNaN(parsedScale)) {
        this.scale = Math.max(Scenario.MIN_SCALE, parsedScale);
        this.scale = Math.min(Scenario.MAX_SCALE, this.scale);
      }
      this.store('scale', this.scale.toString());
    }

    this.pause = false;
    if (this.params.has('pause')) {
      this.setPause(this.params.get('pause') === '1');
    }

    this.speed = parseInt(speedRange.value);
    if (this.params.has('speed')) {
      this.setSpeed(this.params.get('speed'));
      speedRange.value = this.speed.toString();
    }

    this.loop = false;
    if (this.params.has('loop')) {
      this.setLoop(this.params.get('loop') === '1');
      loopBox.checked = this.loop;
    }
  }

  store(param, value) {
    if (this.params.has(param)) {
      if (this.params.get(param) === value) {
        return;
      }
      this.params.set(param, value);
    } else {
      this.params.append(param, value);
    }
    const url = `${window.location.pathname}?${this.params}`;
    window.history.replaceState({}, '', url);
  }

  setDNA(dna) {
    const valid = dna.toUpperCase().replaceAll(Scenario.INVALID, '');
    if (this.dna === valid) {
      return false;
    }
    this.dna = valid;
    this.store('dna', this.dna.toLowerCase());
    return true;
  }

  zoomIn() {
    if (this.scale <= Scenario.MIN_SCALE) {
      return false;
    }
    this.scale--;
    this.store('scale', this.scale.toString());
    return true;
  }

  zoomOut() {
    if (this.scale >= Scenario.MAX_SCALE) {
      return false;
    }
    this.scale++;
    this.store('scale', this.scale.toString());
    return true;
  }

  setSpeed(speed) {
    const parsedSpeed = parseInt(speed);
    if (!Number.isNaN(parsedSpeed)) {
      this.speed = Math.max(Scenario.MIN_SPEED, parsedSpeed);
      this.speed = Math.min(Scenario.MAX_SPEED, this.speed);
    }
    this.store('speed', this.speed.toString());
    if (this.speed <= Scenario.MIN_SPEED) {
      this.setPause(true);
    }
  }

  setPause(pause) {
    this.pause = pause;
    this.store('pause', this.pause ? '1' : '0');
  }

  setLoop(loop) {
    this.loop = loop;
    this.store('loop', this.loop ? '1' : '0');
  }
}

// Playback is a singleton class that holds the state for the animation loop.
class Playback {
  static DEFAULT_FRAME_MS = 33;
  static SPEED_0_TARGET_MS = 16;
  static BUDGET_OVERHEAD_MS = 2;

  constructor(scenario, sim) {
    this.scenario = scenario;
    this.sim = sim;
    // frameMS is the minimum time between requestAnimationFrame callbacks for
    // this system.  We have to discover it as we run the game loop, since we
    // don't know the framerate of this system, so we start with something high
    // and then lower it.
    this.frameMS = Playback.DEFAULT_FRAME_MS;
    this.accumulator = 0;
    // running is whether there is an animate call scheduled.
    this.running = false;
    this.updateUI = () => {};
  }

  // restart schedules the first call to animate if it is not currently
  // scheduled.  (If playback is paused, restart does nothing.)
  restart() {
    if (!this.scenario.pause && !this.running) {
      this.running = true;
      this.accumulator = 0;
      const stepMS = 2 ** -this.scenario.speed * Playback.SPEED_0_TARGET_MS;
      requestAnimationFrame(time => this.animate(time, time - stepMS));
    }
  }

  // animate is the animation loop, or game loop.  It is scheduled once per
  // frame while playback is running.
  animate(curTime, prevTime) {
    if (this.scenario.pause || (this.sim.turtles < 1 && !this.scenario.loop)) {
      // Simulation is either paused or finished, so stop the animation.
      this.running = false;
      if (this.scenario.speed <= Scenario.MIN_SPEED) {
        // If we're in the debugging mode, need to set paused (see below).
        this.scenario.setPause(true);
      }
      this.updateUI();
      return;
    } else if (this.sim.turtles < 1 && this.scenario.loop) {
      // The simulation is finished but we're looping again, so spend one frame
      // in the reset state before continuing.
      this.sim.reset();
      if (this.scenario.speed <= Scenario.MIN_SPEED) {
        // If we're in the debugging mode, need to set paused (see below).
        this.running = false;
        this.scenario.setPause(true);
      } else {
        requestAnimationFrame(time => this.animate(time, curTime));
      }
      this.updateUI();
      return;
    }

    let elapsed = Math.max(0, curTime - prevTime);
    this.accumulator += elapsed;
    // Discover the frameMS for this system.
    this.frameMS = 0.9 * this.frameMS + 0.1 * elapsed;

    // At the minimum speed we enter a special debugging mode ("0x") in which
    // each click of the play button advances the simulation one step.
    if (this.scenario.speed <= Scenario.MIN_SPEED) {
      this.sim.step();
      this.running = false;
      this.scenario.setPause(true);
      this.updateUI();
      return;
    }

    // stepMS is the target duration of one step.
    const stepMS = 2 ** -this.scenario.speed * Playback.SPEED_0_TARGET_MS;

    const budget = Math.max(this.frameMS - Playback.BUDGET_OVERHEAD_MS, 0);
    const loopStart = performance.now();
    while (this.accumulator >= stepMS && this.sim.turtles >= 1) {
      this.sim.step();
      this.accumulator -= stepMS;
      // Bound the amount of work we do in case there was a long delay between
      // callbacks or we spent too long updating the simulation.
      if (performance.now() - loopStart > budget) {
        this.accumulator = 0;
        break;
      }
    }
    this.updateUI();
    requestAnimationFrame(time => this.animate(time, curTime));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const h1          = document.querySelector('h1');
  const seaCanvas   = document.getElementById('sea');
  const turtlesOut  = document.getElementById('turtles');
  const stepsOut    = document.getElementById('steps');
  const birthsOut   = document.getElementById('births');
  const dnaTextarea = document.getElementById('dna');
  const ctrlH2      = document.getElementById('ctrl');
  const speedRange  = document.getElementById('speed');
  const loop        = document.getElementById('loop');
  const loopBox     = document.getElementById('loopbox');
  const restartBtn  = document.getElementById('restart');
  const pauseBtn    = document.getElementById('pause');
  const pauseSpan   = pauseBtn.querySelector('span');
  const speedModal  = document.getElementById('speed-modal');
  const speedSpan   = speedModal.querySelector('span');
  const delBtn      = document.getElementById('delete');
  const forwardBtn  = document.getElementById('forward');
  const leftBtn     = document.getElementById('left');
  const rightBtn    = document.getElementById('right');
  const poopBtn     = document.getElementById('poop');
  const babyBtn     = document.getElementById('baby');
  const cleanBtn    = document.getElementById('clean');
  const biggerBtn   = document.getElementById('bigger');
  const smallerBtn  = document.getElementById('smaller');

  const scenario = new Scenario(dnaTextarea, speedRange, loopBox);
  const sim      = new Simulation(scenario.dna, scenario.scale, seaCanvas);
  const playback = new Playback(scenario, sim);

  const speeds = ['0\u00D7', '\u215B\u00D7', '\u00BC\u00D7', '\u00BD\u00D7',
                  '1\u00D7', '2\u00D7', '4\u00D7', '8\u00D7'];
  const updateUI = () => {
    sim.draw();
    turtlesOut.value = sim.turtles;
    stepsOut.value = sim.steps;
    birthsOut.value = sim.births;
    pauseSpan.textContent = scenario.pause ? '\u25B6\uFE0E' : '\u23F8\uFE0E';
    if (scenario.speed <= Scenario.MIN_SPEED) {
      pauseBtn.title = 'Step';
      pauseBtn.style.color = 'red';
      speedModal.style.color = 'red';
    } else {
      pauseBtn.title = scenario.pause ? 'Play' : 'Pause';
      pauseBtn.style.color = 'black';
      speedModal.style.color = 'black';
    }
    speedSpan.textContent = speeds[scenario.speed - Scenario.MIN_SPEED];
    if (!playback.running && scenario.dna === '') {
      h1.style.zIndex = 2;
    } else {
      h1.style.zIndex = 0;
    }
    biggerBtn.disabled = scenario.scale <= Scenario.MIN_SCALE;
    smallerBtn.disabled = scenario.scale >= Scenario.MAX_SCALE;
  };
  playback.updateUI = updateUI;

  restartBtn.addEventListener('click', () => {
    sim.reset();
    updateUI();
    playback.restart();
  });

  pauseBtn.addEventListener('click', () => {
    scenario.setPause(!scenario.pause);
    updateUI();
    playback.restart();
  });

  let speedMode = false;
  speedModal.addEventListener('click', () => {
    if (speedMode) {
      ctrlH2.style.display = 'block';
      speedRange.style.display = 'none';
      loop.style.display = 'none';
      forwardBtn.style.display = 'inline-block';
      leftBtn.style.display = 'inline-block';
      speedModal.classList.remove('modal');
      speedMode = false;
    } else {
      ctrlH2.style.display = 'none';
      speedRange.style.display = 'inline-block';
      loop.style.display = 'flex';
      forwardBtn.style.display = 'none';
      leftBtn.style.display = 'none';
      speedModal.classList.add('modal');
      speedMode = true;
    }
  });

  speedRange.addEventListener('input', () => {
    scenario.setSpeed(speedRange.value);
    updateUI();
  });

  loopBox.addEventListener('change', () => {
    scenario.setLoop(loopBox.checked);
    updateUI();
  });

  // We can implement deleteEdit using setRangeText, but it breaks the undo/redo
  // stack in most browsers.
  var deleteEdit = () => {
    const start = dnaTextarea.selectionStart;
    const end = dnaTextarea.selectionEnd;
    dnaTextarea.focus();
    if (start !== end) {
      dnaTextarea.setRangeText('', start, end, 'start');
    } else if (start > 0) {
      dnaTextarea.setRangeText('', start - 1, start, 'start');
    }
    if (scenario.setDNA(dnaTextarea.value)) {
      sim.resetDNA(scenario.dna);
      updateUI();
      playback.restart();
    }
  };
  // In most browsers execCommand('deleteBackward') plays better with the
  // undo/redo stack, so try to use that if it's still available.
  if (document.queryCommandSupported('deleteBackward')) {
    console.log('using execCommand(deleteBackward) for deleteEdit');
    deleteEdit = () => {
      dnaTextarea.focus();
      document.execCommand('deleteBackward');
    };
  } else if (document.queryCommandSupported('delete')) {
    console.log('using execCommand(delete) for deleteEdit');
    deleteEdit = () => {
      dnaTextarea.focus();
      document.execCommand('delete');
    };
  }
  delBtn.addEventListener('click', deleteEdit);

  // We can implement insertEdit using setRangeText, but it breaks the undo/redo
  // stack in most browsers.
  var insertEdit = (text) => {
    const start = dnaTextarea.selectionStart;
    const end = dnaTextarea.selectionEnd;
    dnaTextarea.focus();
    dnaTextarea.setRangeText(text, start, end, 'end');
    if (scenario.setDNA(dnaTextarea.value)) {
      sim.resetDNA(scenario.dna);
      updateUI();
      playback.restart();
    }
  };
  // In most browsers execCommand('insertText') plays better with the undo/redo
  // stack, so try to use that if it's still available.
  if (document.queryCommandSupported('insertText')) {
    console.log('using execCommand(insertText) for insertions');
    insertEdit = (text) => {
      dnaTextarea.focus();
      document.execCommand('insertText', false, text);
    };
  }
  forwardBtn.addEventListener('click', () => insertEdit('F'));
  leftBtn.addEventListener('click', () => insertEdit('L'));
  rightBtn.addEventListener('click', () => insertEdit('R'));
  babyBtn.addEventListener('click', () => insertEdit('B'));
  poopBtn.addEventListener('click', () => insertEdit('P'));
  cleanBtn.addEventListener('click', () => insertEdit('C'));

  // Try to catch invalid text insertions before they happen.
  dnaTextarea.addEventListener('beforeinput', (e) => {
    switch (e.inputType) {
    case 'insertText':
      break;
    case 'insertFromPaste':
      break;
    default:
      return;
    }
    if (!e.data) {
      return;
    }
    const valid = e.data.toUpperCase().replaceAll(Scenario.INVALID, '');
    if (valid === e.data) {
      return;
    }
    e.preventDefault();
    insertEdit(valid);
  });

  // Add an input handler as a fallback.  If this input handler writes to
  // dnaTextarea.value it breaks the undo/redo history, so hopefully it never
  // needs to.
  dnaTextarea.addEventListener('input', () => {
    const upper = dnaTextarea.value.toUpperCase();
    const valid = upper.replaceAll(Scenario.INVALID, '');
    if (valid !== dnaTextarea.value) {
      dnaTextarea.value = valid;
      // Do some math to figure out the correct selection range.
      const start = dnaTextarea.selectionStart;
      const end = dnaTextarea.selectionEnd;
      const sd = (upper.slice(0, start).match(Scenario.INVALID) || []).length;
      const ed = (upper.slice(0, end).match(Scenario.INVALID) || []).length;
      dnaTextarea.setSelectionRange(start - sd, end - ed);
    }
    if (scenario.setDNA(dnaTextarea.value)) {
      sim.resetDNA(scenario.dna);
      updateUI();
      playback.restart();
    }
  });

  biggerBtn.addEventListener('click', () => {
    if (scenario.zoomIn()) {
      sim.resetScale(scenario.scale);
      updateUI();
      playback.restart();
    }
  });
  smallerBtn.addEventListener('click', () => {
    if (scenario.zoomOut()) {
      sim.resetScale(scenario.scale);
      updateUI();
      playback.restart();
    }
  });

  // Start things up!
  updateUI();
  playback.restart();
});
