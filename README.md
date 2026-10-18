# MazeLab — DFS-Based Maze Solver & Visualizer

A polished, high-performance GUI web application demonstrating genuine **Depth First Search (DFS)** pathfinding, live backtracking, and maze solving on grid mazes.

**MazeLab** demonstrates Depth First Search with step-by-step exploration, live stack tracking, dead-end detection with backtracking, and solution path reconstruction. It features a validated **13×13 sample maze** with boundary exits alongside a procedural maze generator (Randomized DFS Backtracker).

---

## 1. Assignment Requirements Compliance

| # | Mandatory Requirement | Implementation Details | Status |
|---|---|---|:---:|
| **1** | **Apply DFS to search for the goal** | Genuine stack-based Depth First Search (`DFSSolver` in `dfs.js`) with explicit LIFO stack, parent pointer mapping, and configurable neighbor priority (`Up → Right → Down → Left`). | **SATISFIED** |
| **2** | **Display search process step-by-step** | Deterministic snapshot-based step recording. Supports **Play**, **Pause**, **Resume**, **Next Step**, and **Previous Step**, plus a real-time **Speed Slider** (10 ms – 500 ms). | **SATISFIED** |
| **3** | **Different colours for cell states** | Dedicated color palette: Unexplored (neutral light grey `#f8fafc`), Visited (soft blue tint), Current Node (amber/orange glowing pulse `#f97316`), Active Exploration Path (yellow polyline `#f59e0b`), Dead Ends (soft red tint with red cross `#ef4444`), Start (emerald green 'S'), Goal (crimson red 'G'). | **SATISFIED** |
| **4** | **Display final path when goal is reached** | Reconstructed via recorded parent pointers from start to goal. Displayed as a glowing, high-contrast green polyline (`#10b981`) with highlighted corridor cells. | **SATISFIED** |
| **5** | **Report nodes explored and solution depth** | Real-time statistics cards: **Nodes Explored** (distinct cells visited), **Solution Depth** (number of edges from start to goal along the final DFS path), **Path Length** (cell count = depth + 1), **DFS Stack Size**, and **Current Step**. | **SATISFIED** |

---

## 2. Technology & Architecture

Built with 100% **plain HTML5, CSS3, and JavaScript (ES6+)**. No external libraries, frameworks, build tools, or databases are required.

### Project Structure
```
DFS_maze/
├── index.html       # Semantic HTML5 dashboard layout with accessible controls and live metrics
├── style.css        # Modern dark navy dashboard theme, glassmorphism cards, and high-contrast light maze
├── script.js       # UI controller, HTML5 Canvas renderer, playback state machine, and event handling
├── dfs.js          # Core stack-based DFS algorithm, snapshot recording, and path reconstruction
├── maze.js         # Maze model, 13×13 sample maze data validation, and procedural generator
├── test_dfs.js     # Automated Node.js unit test suite (23 test assertions)
└── README.md       # Comprehensive documentation and viva preparation guide
```

---

## 3. Launch Instructions

You can run MazeLab instantly in any modern browser (Chrome, Edge, Firefox, Safari).

### Option A: Direct Browser Launch (Simplest)
Double-click `index.html` in your file explorer, or right-click `index.html` → **Open with** → your browser of choice.

### Option B: Local Python HTTP Server
Open PowerShell or Terminal in the `DFS_maze` directory and run:
```bash
python -m http.server 8000
```
Then visit: [http://localhost:8000](http://localhost:8000)

### Option C: Node.js (npx serve)
```bash
npx serve .
```

---

## 4. Visual Color Legend & Design Hierarchy

| Element | Visual Appearance | Meaning / Role |
|---|---|---|
| **Start Cell** | Green Circle with letter **'S'** | Starting position of search (`start = (r, c)`) |
| **Goal Cell** | Red Circle with letter **'G'** | Target destination (`goal = (r, c)`) |
| **Current Node** | Glowing Amber / Orange Pulse | Active cell currently being evaluated by DFS |
| **Active Stack** | Glowing Yellow Polyline | Current branch from Start to Current Node stored in the DFS LIFO stack |
| **Visited Cells** | Soft Translucent Blue Tint | Corridor cells visited at least once during search |
| **Dead-End Cells** | Soft Red Tint with Red Cross | Cells with no unvisited traversable corridors; active path backtracks from here |
| **Final Solution** | Glowing Emerald Green Polyline | Reconstructed path from Start to Goal |
| **Walls** | Solid Dark Slate Lines (`#1e293b`) | Obstacles blocking movement between adjacent cells |
| **Corridors** | Crisp Light Grey / White (`#f8fafc`) | Walkable pathways with subtle grid guides |
| **Exit Portals** | Blue Directional Arrows | North Exit at `(0, 6)` and South Exit at `(12, 6)` |

---

## 5. User Controls & Interactions

### Playback & Step Controls
- **Play DFS / Pause**: Starts or halts automatic step execution.
- **Next Step**: Advances execution forward by exactly one algorithm step.
- **Prev Step**: Steps backward to the previous step state.
- **Reset Search**: Clears all search markings and restores initial unsearched state while retaining current maze and endpoints.
- **Speed Slider**: Real-time animation speed adjustment from **10 ms** (fast) to **500 ms** (slow).

### Endpoints Customization
- **Set Start**: Toggle mode, then click any corridor cell on the maze to place the Start marker.
- **Set Goal**: Toggle mode, then click any corridor cell on the maze to place the Goal marker.
- **Randomize Positions**: Automatically picks two distinct valid corridor cells.

### Maze Management
- **Load Sample Maze**: Restores the verified 13×13 sample maze with boundary exits.
- **New Maze**: Procedurally generates a new connected maze via Randomized DFS Backtracker.
- **Grid Size Selector**: Choose between **9×9**, **13×13**, **17×17**, or **21×21**.
- **DFS Neighbour Priority**: Switch exploration order (`Up → Right → Down → Left`, `Right → Down → Left → Up`, etc.).

### Keyboard Shortcuts
- `Space`: Play / Pause toggle
- `ArrowRight`: Next Step
- `ArrowLeft`: Previous Step
- `R`: Reset Search

---

## 6. Sample Maze Structure & Bitmask Wall Representation

The application includes a verified 13×13 sample maze with open boundary exits:
- **Wall Bitmask Representation**:
  - `WALL_N = 0x1` (Bit 0): North wall
  - `WALL_E = 0x2` (Bit 1): East wall
  - `WALL_S = 0x4` (Bit 2): South wall
  - `WALL_W = 0x8` (Bit 3): West wall
- **Coordinate System**:
  Screen coordinates use row 0 at the top (North) and row 12 at the bottom (South), ensuring North is physically Up and South is Down.
- **Boundary Exits**:
  - **North Exit**: Visual `(0, 6)` (Doorway open to the North)
  - **South Exit**: Visual `(12, 6)` (Doorway open to the South)
- **Shared Wall Consistency**:
  Validated across all 169 cells ($13 \times 13$). Every interior wall shared between adjacent cells (East-West and North-South) matches with 0 discrepancies.

---

## 7. AI Viva / College Presentation Guide

### Q1: What is Depth First Search (DFS)?
> **Answer**: Depth First Search is an uninformed graph traversal algorithm that explores as deep as possible along each branch before backtracking. It operates on a **Last-In, First-Out (LIFO)** stack.

### Q2: How does backtracking work in DFS?
> **Answer**: When the current cell has no unvisited, traversable neighbours (a dead end), that cell is popped from the DFS stack. The algorithm returns to the previous node at the top of the stack and continues exploring its next unvisited neighbour.

### Q3: Does DFS guarantee the shortest path?
> **Answer**: **No.** In a general graph or maze with cycles, DFS will return the first path it discovers according to its neighbour search order, which may be significantly longer than the optimal shortest path. (Breadth First Search, or BFS, guarantees the shortest path in unweighted graphs).

### Q4: What is the difference between Solution Depth and Path Length?
> **Answer**:
> - **Solution Depth**: The number of edges (transitions) from Start to Goal along the path.
> - **Path Length**: The number of nodes (cells) in the solution path.
> - $\text{Path Length} = \text{Solution Depth} + 1$. When Start equals Goal, Depth is 0 and Path Length is 1.

---

## 8. Automated Testing & Validation Summary

The project includes an automated test suite in `test_dfs.js` running on Node.js:
```bash
node test_dfs.js
```

### Test Results: 23 Passed, 0 Failed
1. **Sample Maze Shared Wall Consistency**: Verified all 169 cells have 100% reciprocal shared walls.
2. **Boundary Exits**: Verified North exit at `(0, 6)` and South exit at `(12, 6)`.
3. **Sample Maze South-to-North Traversal**: Verified solution found from `(12, 6)` to `(0, 6)`.
4. **Physical Traversability**: Verified every transition along the final path has no obstructing wall.
5. **Dead-End Detection**: Verified dead ends are properly flagged and backtracked.
6. **Reconstructed Path Integrity**: Verified path begins at Start and terminates at Goal.
7. **Start == Goal Handling**: Verified immediate resolution with depth = 0, nodes explored = 1.
8. **Unreachable Goal Handling**: Verified detection of isolated goals returning `NO_SOLUTION` and depth = 0.
9. **Procedural Random Mazes**: Verified 100% connectivity and wall consistency for procedural generation.
