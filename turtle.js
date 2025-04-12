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

function mod(n, m) {
    return ((n % m) + m) % m;
}

function fingerprint(t, width) {
    // todo: use bitmap instead of set
    return ((t.y * width + t.x) * 3 + t.dy + 1) * 3 + t.dx + 1;
}

function updateGen(cmd, turtleGen, babyGen, babySet, width, height) {
    switch (cmd) {
    case "B":
        for (let i = 0; i < turtleGen.length; i++) {
            const t = turtleGen[i];
            const f = fingerprint(t, width);
            if (!babySet.has(f)) {
                babySet.add(f);
                babyGen.push({x: t.x, y: t.y, dx: t.dx, dy: t.dy});
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
            // rotate counter-clockwise by 45 degrees:
            //
            //        dx  dy   a   b   c   d   e   f   g
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
            //   f = b - d / 2
            //   g = c + e / 2
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
            // rotate clockwise by 45 degrees:
            //
            //        dx  dy   m   n   o   p   q   r   s
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
            //   r = n + p / 2
            //   s = o - q / 2
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

document.addEventListener("DOMContentLoaded", function () {
    const sea = document.getElementById("sea");
    sea.width = 512;
    sea.height = 512;
    const ctx = sea.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, sea.height);
    gradient.addColorStop(0, "#177dcc");
    gradient.addColorStop(1, "#184275");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, sea.width, sea.height);

    const counter = document.getElementById("counter");
    const maxCounter = document.getElementById("maxcounter");
    const totalCounter = document.getElementById("totalcounter");

    //const program = "FFRBFFFB";
    //const program = "FFFFFFB";
    //const program = "PFLRRFFFFBPFFFB";
    //const program = "FRLLBPBFBFB";
    //const program = "FFFLLRLFFFLLFRRRRRFFFFFFFFFFFFFFFFFFFFFFFLLLFFFFFLLLFFFFFFFLLLB";
    //const program = "FFFLLRLFFFLLFRRRRRFFFFFFFFFFFFFFFFFFFFFFFLLLFFFFFLLLFFFFFFFLLLBFRB";
    //const program = "FFFLLRLFFFLLFRRRRRFFFFFFFFFFFFFFFPFFFFFFFFLLLFFFFFLLLFFFFFFFLLLBFRB";
    const program = "FFFFFFFFFFFFFFFFFFFFFFPFFFFFFFFRBFFFB";
    //const program = "FBPFRFLRB";
    //const program = "FRFLFPFBFB";
    //const program = "PPFLBFBR";
    //const program = "PPPPPPPFBPPBLFRRRFPPPB";
    //const program = "LFFFPFFFFRFFFRFFFFLFFFLFFFBFFFRFRFFFFLFLFFB";
    //const program = "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLLFRBFFFPLFRB";
    //const program = "FFFFFFFFFFFFPFFFFFFFFRB";
    //const program = "FRFFBFFFFBFFFFFFFFFFFFFFFFFFPB";
    //const program = "PFFFFFBFFFFFFFFRB";
    //const program = "FFFRFFFLFFBFFRFFLFFBFFLFFRFFLFFRB";
    //const program = "FFFRFFFLFFBFFRFFLFFBFFLFFRFFLFFRBFFRB";
    //const program = "PFFFFFFFFFFFFFFFFFRFFFFFFFFFFFLFFFFFFFRBFB";
    //const program = "PLFFRLLBFFFBPB";
    //const program = "PFFLLRRBRFB";
    //const program = "FFFFFFFFFFFFFFFFFFFFFPLLFLLBFFFFFFFFFRFFLFFFFFFFFFFFFFFPRRFRRB";
    //const program = "FRBLFRBLFRBLFRBLFRBLFRBLFRBLFRBLFRBLFRB";
    //const program = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRRBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRB";
    //const program = "PPPLLRLLFFFFFFFFFFFBLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
    //const program = "PFFRRFLLFB";
    //const program = "FBFBRFLFBPFRFB";
    //const program = "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPFFFFFFFFFFFFFBFFFBBFFFFFFFFFFFFB";
    //const program = "PRRFLLFBFRB";
    //const program = "BBBBPBPPPPFFFB";
    //const program = "FFFFFFFFFFFFFFFFFFFFFFPPPPFFFFFFFFRBFFFBFBPPPPPPFBBRBFPPB";
    //const program = "BBBBBPPPPPPPPPPPPFFFFFFPFFFFFFFFFFFPFFFFFFFFFFFPFPFPFPFPFPFPFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRLRLRLRFB";
    //const program = "FFFFFFFRFFFFFFFFFFFFFFFFFRFFFFFFFFFFFFFFFFFFBBPPFFPB";
    //const program = "PPBBLLFFRRBBPPBBPPFLFLBPPPPPBFFFFFFPPPPPPPPPPFFRFFPPPPPPPLRFBBFBBPPFPBBBBRBBPPPPPFPPBBBBBBPPPPPPPP";
    //const program = "";
    //const program = "FFFLLRLFFFLLFRRRRRFFFFFFFFFFFFFFFFFFFFFFFLLLFFFFFLLLFFFFFFFLLLBFRBPPPPPPPFBBBPPPPPPPPPPPPPPPPPPPPPPPPPFFFFFFFFFFLLLLLL";

    const turtleGens = new Array(program.length + 1)
    for (let i = 0; i < program.length + 1; i++) {
        turtleGens[i] = new Array();
    }
    let babyG = turtleGens.length - 1;
    const babySet = new Set();

    const firstTurtle = {
        x: sea.width / 2,
        y: sea.height / 2,
        dx: 1,
        dy: 0
    };
    babySet.add(fingerprint(firstTurtle, sea.width));
    turtleGens[babyG].push(firstTurtle);
    let turtles = 1;
    let maxTurtles = 1;

    function draw() {
        // draw babies
        drawGen(ctx, "", turtleGens[babyG]);
        // draw each turtle gen after they've finished their cmd
        for (let i = 0; i < program.length; i++) {
            const cmd = program[i];
            const g = mod(babyG + i + 1, turtleGens.length);
            const turtleGen = turtleGens[g];
            drawGen(ctx, cmd, turtleGen);
        }
        counter.textContent = turtles;
        maxCounter.textContent = maxTurtles;
        totalCounter.textContent = babySet.size;
    }

    function update() {
        // step all turtle gens forward in the program
        babyG = mod(babyG - 1, turtleGens.length);
        const babyGen = turtleGens[babyG];
        // reset baby gen
        turtles -= babyGen.length;
        babyGen.length = 0;
        // perform cmd for all turtle gens
        for (let i = 0; i < program.length; i++) {
            const cmd = program[i];
            const g = mod(babyG + i + 1, turtleGens.length);
            const turtleGen = turtleGens[g];
            updateGen(cmd, turtleGen, babyGen, babySet, sea.width, sea.height);
        }
        turtles += babyGen.length;
        if (turtles > maxTurtles) {
            maxTurtles = turtles;
        }
    }

    function animate() {
        draw();
        update();
        if (turtles > 0) {
            requestAnimationFrame(animate);
        } else {
            draw();
        }
    }
    animate();
});
