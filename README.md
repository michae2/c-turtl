C-TURTL
=======

Here is a little game I made for my kids, inspired by [Isabel Beach's L-systems
and Turtle Graphics][1] and [Susam Pal's CFRS\[\]][2]. I call it _C-TURTL_. In
this game you write the DNA for your turtle and then see what happens. The DNA
consists of six different letters, which are each an instruction for the turtle:

1. **F**: move the turtle **forward** one space.
2. **L**: rotate the turtle 45° **left** (counter-clockwise) in place.
3. **R**: rotate the turtle 45° **right** (clockwise) in place.
4. **B**: make a **baby** turtle.
5. **P**: **poop**.
6. **C**: **clean** up poop.

Each turtle follows the instructions in the DNA, performing one instruction at a
time. Baby turtles start at the beginning of the DNA. When a turtle finishes all
of the instructions in the DNA, it dies. The game always starts with one baby
turtle in the middle of the ocean, facing East (right).

I'm not much of an artist, so the turtles look like this:

    +------+
    |      |
    |      |
    +------+

Enjoy!

Michael Erickson
December 2025

[1]: https://ibeach.github.io/turtle/
[2]: https://susam.net/cfrs.html
