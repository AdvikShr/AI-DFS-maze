# MazeLab: DFS Maze Solver

A small browser app that solves grid mazes with depth-first search and lets you watch every step. It is plain HTML, CSS and JavaScript, so there is nothing to install and no build step.

## What it does

- Solves a maze with an explicit-stack DFS (no recursion).
- Plays the search back one step at a time: play, pause, next, previous, reset, with an adjustable speed.
- Colors cells by state so you can see what the search is doing: current cell, visited cells, dead ends, the active branch on the stack, and the final path.
- Shows stats as it runs: nodes explored, solution depth, path length, stack size and current step.
- Lets you pick the start and goal by clicking, or randomize them.
- Loads a fixed 13x13 sample maze, or generates a new one at 9x9, 13x13, 17x17 or 21x21.
- Lets you change the order DFS tries neighbors in. Different orders find different paths through the same maze.

## Running it

Open `index.html` in any modern browser. That is all.

If you prefer to serve it locally:

```
python -m http.server 8000
```

then go to http://localhost:8000.

## Controls

| Control | What it does |
| --- | --- |
| Play / Pause | Run the search automatically, or stop it |
| Next / Prev | Move forward or back one step |
| Reset Search | Clear the search but keep the maze and endpoints |
| Speed slider | 10 ms to 500 ms per step |
| Set Start / Set Goal | Click this, then click a corridor cell |
| Randomize Positions | Pick two random corridor cells |
| Load Sample Maze | Go back to the built-in 13x13 maze |
| New Maze | Generate a random maze at the selected size |
| Neighbor Priority | Choose the order DFS tries directions |

Keyboard: `Space` play/pause, `Right arrow` next step, `Left arrow` previous step, `R` reset.

## Color legend

| Element | Look |
| --- | --- |
| Start | Green circle with "S" |
| Goal | Red circle with "G" |
| Current cell | Orange pulse |
| Active branch (the stack) | Yellow line from start to the current cell |
| Visited | Light blue tint |
| Dead end | Light red tint with a cross |
| Final path | Green line from start to goal |
| Walls | Dark lines |

## How the search works

`DFSSolver` in `dfs.js` keeps a stack of cells. Each stack entry remembers its list of neighbors and how far through that list it has gotten.

1. Push the start cell and mark it visited.
2. Look at the cell on top of the stack. If it has an unvisited neighbor, mark that neighbor visited, record its parent, and push it.
3. If the neighbor is the goal, follow the parent links back to the start to get the path, and stop.
4. If the top cell has no unvisited neighbors, it is a dead end. Pop it and mark it as one. The cell below becomes the top again, which is the backtrack.
5. If the stack empties without reaching the goal, there is no path.

The whole search runs up front and every step is stored as a snapshot. The UI just moves through those snapshots, which is why stepping backward works.

DFS finds a path, not necessarily the shortest one. The random mazes are generated with a randomized DFS backtracker and then a few extra walls are removed to create loops (see `loopFactor` in `maze.js`). On a maze with loops the path DFS returns can be much longer than the best one, and the neighbor priority setting will change it.

Solution depth is the number of moves from start to goal. Path length is the number of cells, which is depth + 1.

## Project layout

```
index.html    page layout and controls
style.css     styling
script.js     canvas drawing, playback, and UI event handling
dfs.js        the DFS solver, step snapshots, path reconstruction
maze.js       maze model, the 13x13 sample maze, random maze generator
test_dfs.js   Node tests for the solver and the maze
```

## Maze representation

Each cell stores its walls as a bitmask:

| Wall | Bit |
| --- | --- |
| North | `0x1` |
| East | `0x2` |
| South | `0x4` |
| West | `0x8` |

Row 0 is the top of the maze, so north is up. The sample maze has an opening at the top, `(0, 6)`, and one at the bottom, `(12, 6)`. By default the search runs from the bottom opening to the top one. A wall between two neighboring cells has to be set on both cells, and `maze.js` checks that when a maze is loaded.

## Tests

```
node test_dfs.js
```

There are 23 checks. They cover:

- the sample maze's walls being consistent between neighboring cells
- the sample maze's exits being where they should be
- DFS finding a path through the sample maze, that path being continuous and wall-free, and the search hitting at least one dead end
- the edge case where start and goal are the same cell
- an unreachable goal returning no path
- generated mazes being consistent and always solvable

## Notes

- Start and goal have to be corridor cells inside the grid.
- The whole search is computed before playback begins, which is fine for the supported maze sizes but is not meant for huge grids.
