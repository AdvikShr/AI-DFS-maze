/**
 * MazeLab — maze.js
 * Maze representation, 13x13 sample maze data, and procedural maze generator.
 */

// Wall bitmask flags:
// Bit 0 (0x1) = North (Up)
// Bit 1 (0x2) = East (Right)
// Bit 2 (0x4) = South (Down)
// Bit 3 (0x8) = West (Left)
const WALL_N = 0x1;
const WALL_E = 0x2;
const WALL_S = 0x4;
const WALL_W = 0x8;

// Direction deltas for grid indexing [row, col] where row 0 is top, col 0 is left.
// Up: row - 1, Right: col + 1, Down: row + 1, Left: col - 1.
const DIRECTIONS = {
    UP: { name: 'Up', dr: -1, dc: 0, wallBit: WALL_N, opposite: 'DOWN', oppBit: WALL_S },
    RIGHT: { name: 'Right', dr: 0, dc: 1, wallBit: WALL_E, opposite: 'LEFT', oppBit: WALL_W },
    DOWN: { name: 'Down', dr: 1, dc: 0, wallBit: WALL_S, opposite: 'UP', oppBit: WALL_N },
    LEFT: { name: 'Left', dr: 0, dc: -1, wallBit: WALL_W, opposite: 'RIGHT', oppBit: WALL_E }
};

/**
 * Validated 13x13 wall bitmask matrix for the sample maze.
 * Screen coordinates: row 0 is top (North), row 12 is bottom (South).
 * North is physically Up, South is physically Down.
 */
const SAMPLE_RAW_WALLS = [
    [12, 6, 12, 6, 13, 4, 0, 4, 5, 6, 12, 5, 6],      // r=0 (South boundary in source, North exit at col 6)
    [10, 11, 10, 10, 12, 3, 8, 2, 12, 1, 1, 6, 10],   // r=1
    [8, 5, 3, 8, 1, 6, 9, 2, 9, 6, 13, 2, 10],        // r=2
    [10, 12, 4, 3, 12, 1, 4, 0, 6, 9, 4, 2, 10],      // r=3
    [10, 10, 8, 5, 3, 13, 2, 10, 9, 6, 10, 11, 10],   // r=4
    [8, 3, 9, 4, 5, 6, 8, 1, 6, 10, 9, 5, 2],         // r=5
    [10, 12, 4, 1, 6, 10, 9, 6, 10, 8, 5, 5, 2],      // r=6
    [8, 1, 2, 12, 3, 10, 12, 3, 9, 2, 12, 6, 10],     // r=7
    [9, 6, 10, 10, 12, 1, 2, 12, 5, 1, 0, 1, 3],      // r=8
    [14, 8, 1, 1, 3, 12, 1, 3, 12, 4, 2, 12, 6],      // r=9
    [8, 0, 4, 7, 12, 3, 12, 6, 10, 9, 1, 2, 10],      // r=10
    [10, 10, 9, 6, 10, 12, 2, 8, 1, 7, 12, 0, 2],     // r=11
    [9, 1, 5, 1, 1, 3, 8, 1, 5, 5, 3, 9, 3]           // r=12 (North boundary in source, South exit at col 6)
];

class Maze {
    constructor(rows = 13, cols = 13) {
        this.rows = rows;
        this.cols = cols;
        this.name = 'Custom Maze';
        // grid[r][c] = { r, c, walls: { north: bool, east: bool, south: bool, west: bool } }
        this.grid = [];
        this.exits = [];
        this.initEmpty();
    }

    initEmpty() {
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    r,
                    c,
                    walls: {
                        north: true,
                        east: true,
                        south: true,
                        west: true
                    }
                });
            }
            this.grid.push(row);
        }
    }

    /**
     * Loads the default 13x13 sample maze.
     * Maps coordinates to visual top-down coordinates:
     * visual_row = 12 - raw_row
     * North wall is Up, South wall is Down, East wall is Right, West wall is Left.
     */
    loadSampleMaze() {
        this.rows = 13;
        this.cols = 13;
        this.name = 'Sample Maze (13 × 13)';
        this.initEmpty();

        for (let visualRow = 0; visualRow < 13; visualRow++) {
            const rawRow = 12 - visualRow;
            for (let c = 0; c < 13; c++) {
                const mask = SAMPLE_RAW_WALLS[rawRow][c];
                const cell = this.grid[visualRow][c];
                cell.walls.north = (mask & WALL_N) !== 0;
                cell.walls.east = (mask & WALL_E) !== 0;
                cell.walls.south = (mask & WALL_S) !== 0;
                cell.walls.west = (mask & WALL_W) !== 0;
            }
        }

        // Two boundary exits:
        // Top boundary: visualRow = 0, col = 6, facing Up/North
        // Bottom boundary: visualRow = 12, col = 6, facing Down/South
        this.exits = [
            { r: 0, c: 6, direction: 'UP', label: 'North Exit' },
            { r: 12, c: 6, direction: 'DOWN', label: 'South Exit' }
        ];

        // Validate shared wall consistency
        const validation = this.validateWalls();
        if (!validation.valid) {
            console.warn('[MazeLab] Sample maze wall validation warnings:', validation.errors);
        }
        return validation;
    }

    /** Backwards compatibility alias */
    loadTask1A() {
        return this.loadSampleMaze();
    }

    /**
     * Checks if neighbouring cells share identical wall states.
     */
    validateWalls() {
        const errors = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];

                // Check East neighbor
                if (c + 1 < this.cols) {
                    const eastNeighbor = this.grid[r][c + 1];
                    if (cell.walls.east !== eastNeighbor.walls.west) {
                        errors.push(`Wall mismatch between (${r},${c}) East and (${r},${c+1}) West`);
                    }
                }

                // Check South neighbor
                if (r + 1 < this.rows) {
                    const southNeighbor = this.grid[r + 1][c];
                    if (cell.walls.south !== southNeighbor.walls.north) {
                        errors.push(`Wall mismatch between (${r},${c}) South and (${r+1},${c}) North`);
                    }
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            message: errors.length === 0 ? 'All shared walls are 100% consistent.' : `${errors.length} wall mismatches detected.`
        };
    }

    /**
     * Generates a fully connected maze using Randomized DFS Backtracker.
     * Guarantees a connected path between any two cells.
     * @param {number} rows 
     * @param {number} cols 
     * @param {number} loopFactor (0 = perfect maze/spanning tree, 0.1-0.2 = adds some cycles)
     */
    generateRandom(rows = 13, cols = 13, loopFactor = 0.05) {
        this.rows = rows;
        this.cols = cols;
        this.name = `Random Maze (${rows}x${cols})`;
        this.initEmpty();
        this.exits = [];

        // Track visited in generation
        const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
        const stack = [];

        const startR = Math.floor(Math.random() * rows);
        const startC = Math.floor(Math.random() * cols);

        visited[startR][startC] = true;
        stack.push({ r: startR, c: startC });

        const dirs = [
            DIRECTIONS.UP,
            DIRECTIONS.RIGHT,
            DIRECTIONS.DOWN,
            DIRECTIONS.LEFT
        ];

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            // Find unvisited neighbors
            const unvisitedNeighbors = [];

            for (const d of dirs) {
                const nr = current.r + d.dr;
                const nc = current.c + d.dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
                    unvisitedNeighbors.push({ r: nr, c: nc, dir: d });
                }
            }

            if (unvisitedNeighbors.length > 0) {
                // Pick random unvisited neighbor
                const chosen = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
                // Knock down wall between current and chosen
                this.removeWall(current.r, current.c, chosen.dir);

                visited[chosen.r][chosen.c] = true;
                stack.push({ r: chosen.r, c: chosen.c });
            } else {
                stack.pop();
            }
        }

        // Optional loop factor: knock down a small percentage of remaining walls to create alternative paths
        if (loopFactor > 0) {
            const totalInteriorWalls = rows * (cols - 1) + cols * (rows - 1);
            const extraRemovals = Math.floor(totalInteriorWalls * loopFactor);
            for (let i = 0; i < extraRemovals; i++) {
                const r = Math.floor(Math.random() * (rows - 1));
                const c = Math.floor(Math.random() * (cols - 1));
                const dir = Math.random() < 0.5 ? DIRECTIONS.RIGHT : DIRECTIONS.DOWN;
                this.removeWall(r, c, dir);
            }
        }

        return this.validateWalls();
    }

    /**
     * Removes wall between (r, c) and neighbor in direction dir.
     */
    removeWall(r, c, dir) {
        const nr = r + dir.dr;
        const nc = c + dir.dc;
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) return;

        const cell = this.grid[r][c];
        const neighbor = this.grid[nr][nc];

        if (dir.name === 'Up') {
            cell.walls.north = false;
            neighbor.walls.south = false;
        } else if (dir.name === 'Right') {
            cell.walls.east = false;
            neighbor.walls.west = false;
        } else if (dir.name === 'Down') {
            cell.walls.south = false;
            neighbor.walls.north = false;
        } else if (dir.name === 'Left') {
            cell.walls.west = false;
            neighbor.walls.east = false;
        }
    }

    /**
     * Adds wall between (r, c) and neighbor in direction dir.
     */
    addWall(r, c, dir) {
        const nr = r + dir.dr;
        const nc = c + dir.dc;
        const cell = this.grid[r][c];

        if (dir.name === 'Up') cell.walls.north = true;
        if (dir.name === 'Right') cell.walls.east = true;
        if (dir.name === 'Down') cell.walls.south = true;
        if (dir.name === 'Left') cell.walls.west = true;

        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            const neighbor = this.grid[nr][nc];
            if (dir.name === 'Up') neighbor.walls.south = true;
            if (dir.name === 'Right') neighbor.walls.west = true;
            if (dir.name === 'Down') neighbor.walls.north = true;
            if (dir.name === 'Left') neighbor.walls.east = true;
        }
    }

    /**
     * Checks if moving from (r, c) in direction dir is traversable (no wall and inside bounds).
     */
    canMove(r, c, dir) {
        const cell = this.grid[r][c];
        const nr = r + dir.dr;
        const nc = c + dir.dc;

        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) {
            return false;
        }

        if (dir.name === 'Up' && cell.walls.north) return false;
        if (dir.name === 'Right' && cell.walls.east) return false;
        if (dir.name === 'Down' && cell.walls.south) return false;
        if (dir.name === 'Left' && cell.walls.west) return false;

        return true;
    }

    /**
     * Returns valid adjacent traversable cells in the requested neighbor exploration order.
     */
    getValidNeighbors(r, c, order = ['UP', 'RIGHT', 'DOWN', 'LEFT']) {
        const neighbors = [];
        for (const dirKey of order) {
            const dir = DIRECTIONS[dirKey];
            if (this.canMove(r, c, dir)) {
                neighbors.push({
                    r: r + dir.dr,
                    c: c + dir.dc,
                    direction: dir.name,
                    dirKey
                });
            }
        }
        return neighbors;
    }

    isValidCell(r, c) {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }
}

// Export for Node.js testing and browser window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Maze, DIRECTIONS, WALL_N, WALL_E, WALL_S, WALL_W, SAMPLE_RAW_WALLS };
}
