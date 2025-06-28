const turtleStyle = [
  "#0e8e81", "#179b85", "#1fa889",
  "#18a47f", "#1fbe89", "#26d793",
  "#20b57e", "#4abe93", "#5bc99c"
];

const poopStyle = [
  "#654645", "#6c4f46", "#745546",
  "#6f4946", "#755047", "#7b5d47",
  "#735646", "#755a47", "#7d6047"
];

// drawGen draws a turtle generation using the provided
// CanvasRenderingContext2D.
function drawGen(ctx, cmd, turtleGen) {
  switch (cmd) {
  case "P":
    for (let i = 0; i < turtleGen.length; i++) {
      const t = turtleGen[i];
      ctx.fillStyle = poopStyle[(t.dy + 1) * 3 + t.dx + 1];
      ctx.fillRect(t.x - 2, t.y - 2, 4, 4);
    }
    // fallthrough
  default:
    for (let i = 0; i < turtleGen.length; i++) {
      const t = turtleGen[i];
      ctx.fillStyle = turtleStyle[(t.dy + 1) * 3 + t.dx + 1];
      ctx.fillRect(t.x, t.y, 1, 1);
    }
    break;
  }
}

// mod is a true modulo, to use instead of JavaScript's remainder operator so
// that we don't get negative answers.
function mod(n, m) {
  return ((n % m) + m) % m;
}

// fingerprint uniquely identifies a possible turtle position and orientation.
function fingerprint(t, width) {
  // todo: use bitmap instead of set
  return ((t.y * width + t.x) * 3 + t.dy + 1) * 3 + t.dx + 1;
}

// updateGen updates all turtles in a turtle generation according to the
// provided DNA command. If the command is "B" then updateGen will add new
// turtles to the baby generation.
function updateGen(cmd, turtleGen, babyGen, babySet, width, height) {
  switch (cmd) {
  case "B":
    for (let i = 0; i < turtleGen.length; i++) {
      const t = turtleGen[i];
      const f = fingerprint(t, width);
      if (!babySet.has(f)) {
        babySet.add(f);
        babyGen.push({x: t.x, y: t.y, dx: t.dx, dy: t.dy, gen: t.gen + 1});
      }
    }
    break;
  case "F":
    for (let i = 0; i < turtleGen.length; i++) {
      const t = turtleGen[i];
      t.x = mod(t.x + t.dx, width);
      t.y = mod(t.y + t.dy, height);
    }
    break;
  case "L":
    for (let i = 0; i < turtleGen.length; i++) {
      const t = turtleGen[i];
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
      const a = t.dx * t.dy;
      const b = t.dx + t.dy;
      const c = t.dy - t.dx;
      const d = a * b;
      const e = a * c;
      t.dx = b - d / 2;
      t.dy = c + e / 2;
    }
    break;
  case "P":
    break;
  case "R":
    for (let i = 0; i < turtleGen.length; i++) {
      const t = turtleGen[i];
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
      const m = t.dx * t.dy;
      const n = t.dx - t.dy;
      const o = t.dy + t.dx;
      const p = m * n;
      const q = m * o;
      t.dx = n + p / 2;
      t.dy = o - q / 2;
    }
    break;
  }
}

class Simulation {
  constructor(dna, width, height) {
    this.dna = dna;
    this.width = width;
    this.height = height;
    this.turtleGens = new Array(dna.length + 1);
    for (let i = 0; i < this.turtleGens.length; i++) {
      this.turtleGens[i] = new Array();
    }
    this.babyG = this.turtleGens.length - 1;
    this.babySet = new Set();
    const firstTurtle = {
      x: width / 2,
      y: height / 2,
      dx: 1,
      dy: 0,
      gen: 1,
    };
    this.babySet.add(fingerprint(firstTurtle, width));
    this.turtleGens[this.babyG].push(firstTurtle);
    this.steps = 0;
    this.turtles = 1;
    this.peakTurtles = 1;
    this.totalTurtles = 1;
    this.generations = 1;
  }

  step() {
    // Logically move all generations forward to the next DNA command, including
    // the baby generation, by moving the baby generation position backward to
    // point at the oldest generation.
    this.babyG = mod(this.babyG - 1, this.turtleGens.length);
    const babyGen = this.turtleGens[this.babyG];
    // Reset the new baby generation.
    this.turtles -= babyGen.length;
    babyGen.length = 0;
    // Perform the next command for all generations.
    for (let i = 0; i < this.dna.length; i++) {
      const cmd = this.dna[i];
      const g = mod(this.babyG + 1 + i, this.turtleGens.length);
      const turtleGen = this.turtleGens[g];
      updateGen(cmd, turtleGen, babyGen, this.babySet, this.width, this.height);
    }
    // Update stats.
    this.steps++;
    this.turtles += babyGen.length;
    if (this.turtles > this.peakTurtles) {
      this.peakTurtles = this.turtles;
    }
    this.totalTurtles += babyGen.length;
    for (let i = 0; i < babyGen.length; i++) {
      const b = babyGen[i];
      if (b.gen > this.generations) {
        this.generations = b.gen;
      }
    }
  }

  draw(ctx) {
    // Draw baby generation.
    drawGen(ctx, "", this.turtleGens[this.babyG]);
    // Draw each generation after they've finished their command.
    for (let i = 0; i < this.dna.length; i++) {
      const cmd = this.dna[i];
      const g = mod(this.babyG + 1 + i, this.turtleGens.length);
      const turtleGen = this.turtleGens[g];
      drawGen(ctx, cmd, turtleGen);
    }
  }
}

// todo:
// if DNA changes, try to figure out where the change was
// and create new turtleGens array with insertions or deletions at those spots
// if copy and paste, move all turtles to beginning
//
// if size changes, re-mod turtle positions. need to use bitmap instead of
// babySet, then can re-mod bitmap as well
//
// how are we going to draw with speed > 0?
// need to gather collection of drawing commands?
// or simply keep drawing?
//
// poop should darken? make repeat poops better
//
// allow ocean size 0
//
// use typed arrays for each turtle gen
//
// draw turtles on top of poop? track pooped % separately from visited %?
//
// if turtles walk through poop, should something happen? track depth of poop?
//
// javascript loading bar? message when js disabled?

document.addEventListener("DOMContentLoaded", function () {
  const ocean = document.getElementById("ocean");
  const ctx = ocean.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, ocean.height);
  gradient.addColorStop(0, "#177dcc");
  gradient.addColorStop(1, "#184275");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ocean.width, ocean.height);

  const playbackStepsOutput = document.getElementById("steps");
  const playbackFPSOutput = document.getElementById("fps");
  const playbackSpeedOutput = document.getElementById("speed-output");
  const oceanVisitedOutput = document.getElementById("ocean-visited");
  const oceanSizeOutput = document.getElementById("size-output");
  const turtlesOutput = document.getElementById("turtles");
  const peakTurtlesOutput = document.getElementById("peak-turtles");
  const totalTurtlesOutput = document.getElementById("total-turtles");
  const generationsOutput = document.getElementById("generations");
  const dnaTextArea = document.getElementById("dna");

  const speed = 1;
  const dna = "FFFFFFFFFFFFFFFFFFFFFFPFFFFFFFFRBFFFB";
  dnaTextArea.textContent = dna;
  const sim = new Simulation(dna, ocean.width, ocean.height);

  function update() {
    sim.step();
  }
  function draw() {
    sim.draw(ctx);
    playbackStepsOutput.textContent = sim.steps.toString().padStart(7, '0');
    turtlesOutput.textContent = sim.turtles.toString().padStart(7, '0');
    peakTurtlesOutput.textContent = sim.peakTurtles.toString().padStart(7, '0');
    totalTurtlesOutput.textContent = sim.totalTurtles.toString().padStart(7, '0');
    generationsOutput.textContent = sim.generations.toString().padStart(7, '0');
  }
  function animate() {
    draw();
    update();
    if (sim.turtles > 0) {
      requestAnimationFrame(animate);
    } else {
      draw();
    }
  }
  animate();
});
