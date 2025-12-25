"use strict";

// TODO:
//   - save textarea edits across reloads?
//   - update URL to save links
//   - fix H1 title
//   - max size for controls? min size for controls?
//   - instructions
//   - fix on safari
//   - clean up main
//   - when typing lowercase into textarea cursor jumps to end
//   - speed slider not in sync sometimes?
//   - react-style render function which checks all state and updates all UI
//   - disable bigger and smaller buttons when at limits

// TurtleGeneration represents one cohort of sea turtles that are born during
// the same step.  This cohort will never grow or shrink, and will always
// execute the same DNA command at the same time, so we group them together for
// better performance.  TurtleGeneration is a struct-of-arrays, meaning each
// individual turle is represented as an index within all of the arrays tracking
// turtle attributes.
class TurtleGeneration {
  constructor(capacity) {
    this.length = 0;
    this.x = new Int32Array(capacity);
    this.y = new Int32Array(capacity);
    this.dx = new Int32Array(capacity);
    this.dy = new Int32Array(capacity);
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
      // Pooping makes the spot 20% darker.
      poopBuffer.data[j * 4 + 0] -= 0x33;
      poopBuffer.data[j * 4 + 1] -= 0x33;
      poopBuffer.data[j * 4 + 2] -= 0x33;
    }
  }

  clean(poopBuffer, size) {
    for (let i = 0; i < this.length; i++) {
      const j = this.x[i] + this.y[i] * size;
      // Cleaning makes the spot 33% lighter, but with some variation in red and
      // blue depending on direction to give a nice rainbow effect.
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
  static #turtleStyles = {
    F: [
      "#99cc66", "#7fcc66", "#66cc66",
      "#7fcc66", "#66cc66", "#66cc7f",
      "#66cc66", "#66cc7f", "#66cc99"
    ],
    L: [
      "#99cc66", "#7fcc66", "#66cc66",
      "#7fcc66", "#66cc66", "#66cc7f",
      "#66cc66", "#66cc7f", "#66cc99"
    ],
    R: [
      "#99cc66", "#7fcc66", "#66cc66",
      "#7fcc66", "#66cc66", "#66cc7f",
      "#66cc66", "#66cc7f", "#66cc99"
    ],
    C: [
      "#6699cc", "#6699cc", "#6699cc",
      "#6699cc", "#6699cc", "#6699cc",
      "#6699cc", "#6699cc", "#6699cc"
    ],
    B: [
      "#9966cc", "#9966cc", "#9966cc",
      "#9966cc", "#9966cc", "#9966cc",
      "#9966cc", "#9966cc", "#9966cc"
    ],
    P: [
      "#cc9966", "#cc9966", "#cc9966",
      "#cc9966", "#cc9966", "#cc9966",
      "#cc9966", "#cc9966", "#cc9966"
    ],
  };

  draw(ctx, cmd) {
    const fillStyle = TurtleGeneration.#turtleStyles[cmd];
    for (let i = 0; i < this.length; i++) {
      ctx.fillStyle = fillStyle[(this.dx[i] + 1) + (this.dy[i] + 1) * 3];
      ctx.fillRect(this.x[i], this.y[i], 1, 1);
    }
  }
}

// Simulation is a singleton class that holds all of the sea turtle generations
// and their positions within the DNA program.  Simulation also applies DNA
// commands to each sea turtle generation, tracks some stats, and handles
// drawing the turtles and poop to the canvas.
class Simulation {
  constructor(dna, scale, canvas) {
    this.dna = dna;
    this.size = 1 << scale;
    this.turtleGens = new Array(this.dna.length + 1);
    const defaultTurtleGenSize = Math.max(16, this.size);
    for (let g = 0; g < this.turtleGens.length; g++) {
      this.turtleGens[g] = new TurtleGeneration(defaultTurtleGenSize);
    }
    this.babyG = this.turtleGens.length - 1;
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
    this.dna = dna;
    const defaultTurtleGenSize = Math.max(16, this.size);
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
    // Logically move all turtle generations forward to the next DNA command,
    // including the baby generation, by moving the baby generation position
    // backward to point at the oldest generation, which dies and is
    // reincarnated as babies.
    this.babyG--;
    if (this.babyG < 0) {
      this.babyG = this.turtleGens.length - 1;
    }
    const babyGen = this.turtleGens[this.babyG];
    // Reset the newly-reincarnated baby generation.
    this.turtles -= babyGen.length;
    babyGen.reset();
    // Perform the next DNA command for all turtle generations.
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

// Playback is a singleton class that holds the state for the animation loop.
class Playback {
  constructor(sim, speed, updateUI, pauseBtn) {
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
    // pause is whether a pause has been requested.
    this.pause = false;
    // running is whether there is an animate call scheduled.
    this.running = false;
    this.updateUI = updateUI;
    this.pauseBtn = pauseBtn;
  }

  // restart schedules the first call to animate if it is not currently
  // scheduled.  (If playback is paused, restart does nothing.)
  restart() {
    if (!this.pause && !this.running) {
      this.running = true;
      this.accumulator = 0;
      requestAnimationFrame(time => this.animate(time, time - this.stepMS));
    }
  }

  playPause() {
    this.pause = !this.pause;
    // TODO: move this out?
    this.pauseBtn.textContent = this.pause ? "\u25B6\uFE0E" : "\u23F8\uFE0E";
    this.restart();
  }

  setSpeed(speed) {
    this.speed = speed;
    this.stepMS = 2 ** -this.speed * 16;
  }

  // animate is the animation loop, or game loop.  It is scheduled once per
  // frame while playback is running.
  animate(curTime, prevTime) {
    if (this.sim.turtles < 1 || this.pause) {
      this.running = false;
      this.updateUI();
      return;
    }
    let elapsed = curTime - prevTime;
    this.accumulator += elapsed;
    // Discover the frameMS for this system.
    this.frameMS = 0.9 * this.frameMS + 0.1 * elapsed;

    if (this.speed < -3) {
      this.sim.step();
      this.updateUI();
      this.running = false;
      this.pause = true;
      this.pauseBtn.textContent = "\u25B6\uFE0E";
      return;
    }

    const budget = this.frameMS - 2;
    const loopStart = performance.now();
    while (this.accumulator >= this.stepMS) {
      this.sim.step();
      this.accumulator -= this.stepMS;
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

// Scenario
class Scenario {
  constructor(dnaTextArea, speedRange) {
    this.params = new URLSearchParams(window.location.search);

    this.dna = dnaTextArea.value;
    // validate the DNA here?
    if (this.params.has('dna')) {
      const upper = this.params.get('dna').toUpperCase();
      const notAllowed = /[^FLRPBC]/g;
      this.dna = upper.replace(notAllowed, "");
      this.store('dna', this.dna.toLowerCase());
      dnaTextArea.value = this.dna;
    }

    this.speed = parseInt(speedRange.value);
    if (this.params.has('speed')) {
      this.setSpeed(this.params.get('speed'));
      speedRange.value = this.speed.toString();
    }

    this.scale = 6;
    if (this.params.has('scale')) {
      const parsedScale = parseInt(this.params.get('scale'));
      if (!Number.isNaN(parsedScale)) {
        this.scale = Math.min(10, Math.max(2, parsedScale));
      }
      this.store('scale', this.scale.toString());
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
    window.history.replaceState({}, "", url);
  }

  dnaInput(dnaTextArea, text) {
    const upper = text.toUpperCase();
    const notAllowed = /[^FLRPBC]/g;
    dnaTextArea.setRangeText(upper.replace(notAllowed, ""));
    this.dna = dnaTextArea.value;
    this.store('dna', this.dna.toLowerCase());
  }

  dnaButton(dnaTextArea, letter) {
    dnaTextArea.setRangeText(letter);
    this.store('dna', this.dna.toLowerCase());
  }

  dnaDelete(dnaTextArea) {
    const start = dnaTextArea.selectionStart;
    const end = dnaTextArea.selectionEnd;
    if (start === end) {
      dnaTextArea.setRangeText("", start - 1, end, 'start');
    } else {
      dnaTextArea.setRangeText("");
    }
    this.dna = dnaTextArea.value;
    this.store('dna', this.dna.toLowerCase());
  }

  setSpeed(speed) {
    const parsedSpeed = parseInt(speed);
    if (!Number.isNaN(parsedSpeed)) {
      this.speed = Math.min(3, Math.max(-4, parsed));
    }
    this.store('speed', this.speed.toString());
  }

  bigger() {
    if (this.scale <= 2) {
      return false;
    }
    this.scale--;
    this.store('scale', this.scale.toString());
    return true;
  }

  smaller() {
    if (this.scale >= 10) {
      return false;
    }
    this.scale++;
    this.store('scale', this.scale.toString());
    return true;
  }
}

function main() {
  const urlParams  = new URLSearchParams(window.location.search);

  const seaCanvas  = document.getElementById("sea");
  const turtlesOut = document.getElementById("turtles");
  const stepsOut   = document.getElementById("steps");
  const birthsOut  = document.getElementById("births");
  const dnaTextbox = document.getElementById("dna");

  const ctrlH2 = document.getElementById("ctrl");
  const speedRange = document.getElementById("speed");
  //const scaleRange = document.getElementById("scale");
  const restartBtn = document.getElementById("restart");
  const pauseBtn   = document.getElementById("pause");
  //const fasterBtn  = document.getElementById("faster");
  //const slowerBtn  = document.getElementById("slower");
  const speedModal = document.getElementById("speed-modal");
  //const scaleModal = document.getElementById("scale-modal");
  const forwardBtn = document.getElementById("forward");
  const leftBtn    = document.getElementById("left");
  const rightBtn   = document.getElementById("right");
  const poopBtn    = document.getElementById("poop");
  const babyBtn    = document.getElementById("baby");
  const delBtn     = document.getElementById("delete");
  const cleanBtn   = document.getElementById("clean");
  const biggerBtn  = document.getElementById("bigger");
  const smallerBtn = document.getElementById("smaller");

  const notAllowed = /[^FLRPBC]/g;

  let dna = dnaTextbox.value;
  if (urlParams.has('dna')) {
    const upper = urlParams.get('dna').toUpperCase();
    const filtered = upper.replace(notAllowed, "");
    dnaTextbox.value = filtered;
    dna = filtered;
    if (dna.toLowerCase() !== urlParams.get('dna')) {
      urlParams.set('dna', dna.toLowerCase());
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${urlParams}`
      );
    }
  }

  let scale = 6;
  if (urlParams.has('scale')) {
    const parsed = parseInt(urlParams.get('scale'));
    if (!Number.isNaN(parsed)) {
      scale = Math.min(10, Math.max(2, parsed));
      if (scale.toString() !== urlParams.get('scale')) {
        urlParams.set('scale', scale.toString());
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}?${urlParams}`
        );
      }
    }
  }

  const sim = new Simulation(dna, scale, seaCanvas);

  const updateUI = () => {
    sim.draw();
    turtlesOut.value = sim.turtles;
    stepsOut.value = sim.steps;
    birthsOut.value = sim.births;
  };

  const playback = new Playback(sim, 0, updateUI, pauseBtn);

  let speedMode = false;
  //let scaleMode = false;
  speedModal.addEventListener("click", () => {
    if (speedMode) {
      ctrlH2.style.display = "inline-grid";
      speedRange.style.display = "none";
      //speedModal.style.color = "";
      speedMode = false;
    } else {
      ctrlH2.style.display = "none";
      //scaleRange.style.display = "none";
      //scaleModal.style.color = "";
      speedRange.style.display = "inline-grid";
      //speedModal.style.color = "red";
      //scaleMode = false;
      speedMode = true;
    }
  });

  const speeds = ["0\u00D7", "\u215B\u00D7", "\u00BC\u00D7", "\u00BD\u00D7", "1\u00D7", "2\u00D7", "4\u00D7", "8\u00D7"];
  speedRange.addEventListener("input", () => {
    const speed = parseInt(speedRange.value);
    speedModal.textContent = speeds[speed + 4];
    playback.setSpeed(speed);
  });

  /*
    scaleModal.addEventListener("click", () => {
    if (scaleMode) {
    ctrlH2.style.display = "inline-grid";
    scaleRange.style.display = "none";
    scaleModal.style.color = "";
    scaleMode = false;
    } else {
    ctrlH2.style.display = "none";
    speedRange.style.display = "none";
    speedModal.style.color = "";
    scaleRange.style.display = "inline-grid";
    scaleModal.style.color = "red";
    speedMode = false;
    scaleMode = true;
    }
    });

    const scales = ["\u25A1\u00B2", "\u25A1\u00B3", "\u25A1\u2074", "\u25A1\u2075", "\u25A1\u2076", "\u25A1\u2077", "\u25A1\u2078", "\u25A1\u2079", "\u25A1\u00B9\u2070"];
    scaleRange.addEventListener("input", () => {
    const scaleSet = parseInt(scaleRange.value);
    scaleModal.textContent = scales[scaleSet - 2];
    if (scale === scaleSet) {
    return;
    }
    scale = scaleSet;
    sim.resetScale(scale);
    updateUI();
    playback.restart();
    });
  */

  const dnaChange = () => {
    if (dna === dnaTextbox.value) {
      return;
    }
    dna = dnaTextbox.value;
    sim.resetDNA(dna);
    updateUI();
    playback.restart();
    if (urlParams.has('dna')) {
      if (dna !== '') {
        urlParams.set('dna', dna.toLowerCase());
      } else {
        urlParams.delete('dna');
      }
    } else if (dna !== '') {
      urlParams.append('dna', dna.toLowerCase());
    }
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${urlParams}`
    );
  };

  dnaTextbox.addEventListener("input", () => {
    const upper = dnaTextbox.value.toUpperCase();
    const filtered = upper.replace(notAllowed, "");
    if (dnaTextbox.value !== filtered) {
      dnaTextbox.value = filtered;
    }
    dnaChange();
  });

  forwardBtn.addEventListener("click", () => {
    dnaTextbox.value += "F";
    dnaChange();
  });
  leftBtn.addEventListener("click", () => {
    dnaTextbox.value += "L";
    dnaChange();
  });
  rightBtn.addEventListener("click", () => {
    dnaTextbox.value += "R";
    dnaChange();
  });
  poopBtn.addEventListener("click", () => {
    dnaTextbox.value += "P";
    dnaChange();
  });
  babyBtn.addEventListener("click", () => {
    dnaTextbox.value += "B";
    dnaChange();
  });
  cleanBtn.addEventListener("click", () => {
    dnaTextbox.value += "C";
    dnaChange();
  });
  delBtn.addEventListener("click", () => {
    if (dnaTextbox.selectionStart !== dnaTextbox.selectionEnd) {
      dnaTextbox.setRangeText("");
    } else {
      dnaTextbox.value = dnaTextbox.value.slice(0, -1);
    }
    dnaChange();
  });

  biggerBtn.addEventListener("click", () => {
    if (scale <= 2) {
      return;
    }
    scale--;
    sim.resetScale(scale);
    updateUI();
    playback.restart();
    if (urlParams.has('scale')) {
      urlParams.set('scale', scale.toString());
    } else {
      urlParams.append('scale', scale.toString());
    }
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${urlParams}`
    );
  });
  smallerBtn.addEventListener("click", () => {
    if (scale >= 10) {
      return;
    }
    scale++;
    sim.resetScale(scale);
    updateUI();
    playback.restart();
    if (urlParams.has('scale')) {
      urlParams.set('scale', scale.toString());
    } else {
      urlParams.append('scale', scale.toString());
    }
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${urlParams}`
    );
  });

  restartBtn.addEventListener("click", () => {
    sim.reset();
    updateUI();
    playback.restart();
  });

  pauseBtn.addEventListener("click", () => playback.playPause());
  //fasterBtn.addEventListener("click", () => playback.faster());
  //slowerBtn.addEventListener("click", () => playback.slower());

  playback.restart();

  // instead of state changes calling into UI code, we want:
  // 1. a. initialize model state from URL or other stuff
  //    b. ask UI to redraw itself
  // 2. a. buttons -> change model state
  //    b. and then ask UI to redraw itself, it looks at whatever model state
}

document.addEventListener("DOMContentLoaded", main)

// From Matilda: CLCLLRPRPFBFBLCLCRPRPFBFBRPLFBCPRLFBC
// From Michael: FFFFFFFFFFFFFFFFFFFFFFPFFFFFFFFRBFFFB
// Bug? BBFFLLRRPPCCBBFFLLRRPPCCBBFFLLRRPPCCBFLRPC
// another from Matilda: BFLBFLRPCRPCLLLRRRPPPCCCBBBFFF

// From Abbie: FFFLFFFBPFFFBCFFBFFB
// From Michael: FFFFFFFFFFPPFFFFFFFFRBFBLC
// CFFFFFFFFFFFFFFPFPFPRRFPRRFPFPFFFFFFFFPFPFPLLFPLLFPFPBLLB
// FPPFPFPRRFPFPFPFPLLFPFPFPFPCLLFPFPCCCPFPFPFPRRBLCLLLBRPPPFPPFPPFPPFPPPFPPPFPPPFPPPFPPPFPFFPFCCCRCCCFFPFPFPPFPFPFPFPRRBCC
// FPFPFPFPRRBLLBLLFPPCFFFFFFFFPCFRPPBFBFBFBFBFRPC
// FPFPLFPFPBRRRRFFLLFPFPBC
