const { Maze, DIRECTIONS } = require('./maze.js');
const { DFSSolver } = require('./dfs.js');

function runTests() {
    console.log('=== MAZELAB DFS AUTOMATED TEST SUITE ===\n');
    let passCount = 0;
    let failCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`[PASS] ${message}`);
            passCount++;
        } else {
            console.error(`[FAIL] ${message}`);
            failCount++;
        }
    }

    // 1. Sample Maze Wall Validation
    const maze = new Maze(13, 13);
    const valResult = maze.loadSampleMaze();
    assert(valResult.valid, 'Sample maze shared walls are 100% consistent across all 169 cells');

    // 2. Exits validation
    assert(maze.exits.length === 2, 'Sample maze boundary exits correctly identified (North and South)');
    assert(maze.exits[0].r === 0 && maze.exits[0].c === 6, 'North exit at visual (0, 6)');
    assert(maze.exits[1].r === 12 && maze.exits[1].c === 6, 'South exit at visual (12, 6)');

    // 3. DFS on Sample Maze from South Exit (12, 6) to North Exit (0, 6)
    const start = { r: 12, c: 6 };
    const goal = { r: 0, c: 6 };
    const solver = new DFSSolver(maze, start, goal, ['UP', 'RIGHT', 'DOWN', 'LEFT']);

    assert(solver.isSolved === true, 'DFS successfully found a path from South exit to North exit');
    assert(solver.finalPath !== null && solver.finalPath.length > 0, 'Final path reconstructed');
    assert(solver.finalPath[0].r === start.r && solver.finalPath[0].c === start.c, 'Path starts at start cell');
    const lastCell = solver.finalPath[solver.finalPath.length - 1];
    assert(lastCell.r === goal.r && lastCell.c === goal.c, 'Path ends at goal cell');
    assert(solver.solutionDepth === solver.finalPath.length - 1, `Solution depth (${solver.solutionDepth}) equals path cells - 1`);
    assert(solver.pathLength === solver.finalPath.length, `Path length (${solver.pathLength}) equals cell count`);

    // Verify every step in final path is traversable
    let pathTraversable = true;
    for (let i = 0; i < solver.finalPath.length - 1; i++) {
        const c1 = solver.finalPath[i];
        const c2 = solver.finalPath[i + 1];
        const dr = c2.r - c1.r;
        const dc = c2.c - c1.c;
        let dir;
        if (dr === -1 && dc === 0) dir = DIRECTIONS.UP;
        else if (dr === 1 && dc === 0) dir = DIRECTIONS.DOWN;
        else if (dr === 0 && dc === 1) dir = DIRECTIONS.RIGHT;
        else if (dr === 0 && dc === -1) dir = DIRECTIONS.LEFT;

        if (!dir || !maze.canMove(c1.r, c1.c, dir)) {
            pathTraversable = false;
            console.error(`Invalid move between (${c1.r},${c1.c}) and (${c2.r},${c2.c})`);
            break;
        }
    }
    assert(pathTraversable, 'Every transition along the final DFS path is physically traversable with no walls');

    // 4. Test Step History and Dead-Ends
    const hasDeadEnds = solver.steps.some(s => s.action === 'DEAD_END');
    assert(hasDeadEnds, 'DFS correctly encountered, marked, and backtracked through dead ends');
    const finalStep = solver.steps[solver.steps.length - 1];
    assert(finalStep.action === 'GOAL_REACHED', 'Final recorded step action is GOAL_REACHED');

    // 5. Test Start == Goal
    const sameSolver = new DFSSolver(maze, { r: 5, c: 5 }, { r: 5, c: 5 });
    assert(sameSolver.isSolved === true, 'Start == Goal is immediately solved');
    assert(sameSolver.solutionDepth === 0, 'Solution depth is 0 when start == goal');
    assert(sameSolver.nodesExplored === 1, 'Nodes explored is 1 when start == goal');
    assert(sameSolver.pathLength === 1, 'Path length is 1 when start == goal');

    // 6. Test Unreachable Goal
    const walledMaze = new Maze(5, 5);
    walledMaze.generateRandom(5, 5);
    // Isolate cell (0, 0) by walling it completely
    walledMaze.grid[0][0].walls = { north: true, east: true, south: true, west: true };
    walledMaze.grid[0][1].walls.west = true;
    walledMaze.grid[1][0].walls.north = true;

    const unreachSolver = new DFSSolver(walledMaze, { r: 0, c: 0 }, { r: 4, c: 4 });
    assert(unreachSolver.isSolved === false, 'DFS reports failure when goal is unreachable');
    assert(unreachSolver.finalPath === null, 'Final path is null for unreachable goal');
    assert(unreachSolver.solutionDepth === 0, 'Solution depth is 0 for unreachable goal');
    assert(unreachSolver.steps[unreachSolver.steps.length - 1].action === 'NO_SOLUTION', 'Final step action is NO_SOLUTION');

    // 7. Test Random Maze Generation
    const randMaze = new Maze(15, 15);
    const randVal = randMaze.generateRandom(15, 15);
    assert(randVal.valid, 'Generated 15x15 random maze has 100% consistent shared walls');
    const randSolver = new DFSSolver(randMaze, { r: 0, c: 0 }, { r: 14, c: 14 });
    assert(randSolver.isSolved === true, 'Random maze generation guarantees a connected solution path');

    console.log(`\nTest Summary: ${passCount} Passed, ${failCount} Failed.`);
    if (failCount > 0) {
        process.exit(1);
    }
}

runTests();
