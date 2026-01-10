C-TURTL
=======

Here is a small turtle graphics game I made for my kids.

Move the turtle by writing instructions into its DNA.

- **F**: move the turtle **forward**
- **L**: rotate the turtle 45° **left** (counter-clockwise)
- **R**: rotate the turtle 45° **right** (clockwise)
- **B**: make a **baby** turtle
- **P**: **poop**
- **C**: **clean** up the poop

The turtle dies at the end of the DNA.  Baby turtles start over at the beginning
of the DNA.

Here are some examples:
- [PFRBPPLFPFPPPCFPPCFPC][17]
- [FFFLFFFBPFFFBCFFBFBFPPC][4]
- [FPFPLFPFPBRRRRFFLLFPFPBC][9]
- [FFFFFFFFFFPPFFFFFFFFRBFBLC][5]
- [BFRRRBRRRBLFFFFPPFFFFPPPPCCCPFRB][13]
- [CLCLLRPRPFBFBLCLCRPRPFBFBRPLFBCPRLFBC][6]
- [PFPFPRPFPFPPFPPPFFFFFCFFFLFFFFFFFBFBRB][16]
- [PFRBLFFFFFFFFFFFFPLLLLFFFFFFFFFFFFLCFPB][12]
- [FPFPFPFPRRBLLBLLFPPCFFFFFFFFPCFRPPBFBFBFBFBFRPC][8]
- [PFPPPRPRBLLPFPFPFFPFPFFFPFPPFPRRBFCCFFFFFFFCCLLB][14]
- [RPBFPRFPFFFFFFFFPFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFPBC][11]
- [CFFFFFFFFFFFFFFPFPFPRRFPRRFPFPFFFFFFFFPFPFPLLFPLLFPFPBLLB][3]
- [PFPRBLLLCLLLFFBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC][15]
- [PFPPFPPPRRFPPPPFPPPPPFFFFFFFFFFFFFFFFFFFFFFFCFCFBFFFFFFFFFFFFFFFFFFFFFFCFFB][17]
- [FPPFPFPRRFPFPFPFPLLFPFPFPFPCLLFPFPCCCPFPFPFPRRBLCLLLBRPPPFPPFPPFPPFPPPFPPPFPPPFPPPFPPPFPFFPFCCCRCCCFFPFPFPPFPFPFPFPRRBCC][7]
- [FCPPPFPPPCBRRRFFFPFPFPFPFPFPFPFFPRBCRRFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFRPFFFFFFFFFFFFBC][10]

This was inspired by Isabel Beach's [L-systems and Turtle Graphics][1] and Susam
Pal's [CFRS[]][2].


Thanks to:
- Matilda for the Clean instruction
- Vaelatern for the loop option

Michael Erickson

[17]: https://michae2.github.io/c-turtl/?dna=pfrbpplfpfpppcfppcfpc&scale=4&speed=-2
[4]: https://michae2.github.io/c-turtl/?dna=ffflfffbpfffbcffbfbfppc&scale=7&speed=0
[9]: https://michae2.github.io/c-turtl/?dna=fpfplfpfpbrrrrffllfpfpbc&scale=5&speed=-1
[5]: https://michae2.github.io/c-turtl/?dna=ffffffffffppffffffffrbfblc&scale=7&speed=1
[13]: https://michae2.github.io/c-turtl/?dna=bfrrrbrrrblffffppffffppppcccpfrb&scale=6&speed=0
[6]: https://michae2.github.io/c-turtl/?dna=clcllrprpfbfblclcrprpfbfbrplfbcprlfbc&scale=5&speed=0
[16]: https://michae2.github.io/c-turtl/?dna=pfpfprpfpfppfpppfffffcffflfffffffbfbrb&scale=9&speed=2
[12]: https://michae2.github.io/c-turtl/?dna=pfrblffffffffffffpllllfffffffffffflcfpb&scale=6&speed=0
[8]: https://michae2.github.io/c-turtl/?dna=fpfpfpfprrbllbllfppcffffffffpcfrppbfbfbfbfbfrpc&scale=7&speed=0
[14]: https://michae2.github.io/c-turtl/?dna=pfppprprbllpfpfpffpfpfffpfppfprrbfccfffffffccllb&scale=8&speed=2
[11]: https://michae2.github.io/c-turtl/?dna=rpbfprfpffffffffpffffffffffffffffffffffffffffffpbc&scale=7&speed=0
[3]: https://michae2.github.io/c-turtl/?dna=cffffffffffffffpfpfprrfprrfpfpffffffffpfpfpllfpllfpfpbllb&scale=5&speed=0
[15]: https://michae2.github.io/c-turtl/?dna=pfprblllclllffbffffffffffffffffffffffffffffffffffffffffffffffffffffffc&scale=8&speed=1
[17]: https://michae2.github.io/c-turtl/?dna=pfppfppprrfppppfpppppfffffffffffffffffffffffcfcfbffffffffffffffffffffffcffb&scale=4&speed=-2
[7]: https://michae2.github.io/c-turtl/?dna=fppfpfprrfpfpfpfpllfpfpfpfpcllfpfpcccpfpfpfprrblclllbrpppfppfppfppfpppfpppfpppfpppfpppfpffpfcccrcccffpfpfppfpfpfpfprrbcc&scale=5&speed=0
[10]: https://michae2.github.io/c-turtl/?dna=fcpppfpppcbrrrfffpfpfpfpfpfpfpffprbcrrffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffrpffffffffffffbc&scale=10&speed=2
[1]: https://ibeach.github.io/turtle/
[2]: https://susam.net/cfrs.html
