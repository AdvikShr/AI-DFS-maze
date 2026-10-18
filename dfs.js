/**
 * MazeLab — dfs.js
 * Genuine Depth First Search (DFS) implementation with step recording,
 * dead-end detection, backtracking, path reconstruction, and metrics.
 */

class DFSSolver {
    constructor(maze, start, goal, order = ['UP', 'RIGHT', 'DOWN', 'LEFT']) {
        this.maze = maze;
        this.start = { r: start.r, c: start.c };
        this.goal = { r: goal.r, c: goal.c };
        this.order = order;

        // Results
        this.steps = [];
        this.finalPath = null;
        this.isSolved = false;
        this.nodesExplored = 0;
        this.solutionDepth = 0;
        this.pathLength = 0;
        this.totalSteps = 0;

        this.execute();
    }

    cellKey(r, c) {
        return `${r},${c}`;
    }

    execute() {
        const { r: startR, c: startC } = this.start;
        const { r: goalR, c: goalC } = this.goal;

        // Validation
        if (!this.maze.isValidCell(startR, startC) || !this.maze.isValidCell(goalR, goalC)) {
            throw new Error(`Invalid start (${startR}, ${startC}) or goal (${goalR}, ${goalC}) coordinates.`);
        }

        this.steps = [];
        const visitedSet = new Set();
        const deadEndSet = new Set();
        const parentMap = new Map(); // key -> { r, c }

        // Explicit DFS Stack:
        // Each entry: { r, c, neighborIndex: 0, neighbors: [...] }
        const startKey = this.cellKey(startR, startC);
        visitedSet.add(startKey);

        const startNeighbors = this.maze.getValidNeighbors(startR, startC, this.order);
        const stack = [{
            r: startR,
            c: startC,
            neighborIndex: 0,
            neighbors: startNeighbors
        }];

        // Helper to record a snapshot of the current state
        const recordStep = (action, current, status, description, finalPath = null) => {
            const activeStackPath = stack.map(item => ({ r: item.r, c: item.c }));
            this.steps.push({
                stepIndex: this.steps.length,
                action,
                current: { ...current },
                activeStack: activeStackPath,
                visited: Array.from(visitedSet).map(k => {
                    const [r, c] = k.split(',').map(Number);
                    return { r, c };
                }),
                deadEnds: Array.from(deadEndSet).map(k => {
                    const [r, c] = k.split(',').map(Number);
                    return { r, c };
                }),
                finalPath: finalPath ? [...finalPath] : null,
                nodesExplored: visitedSet.size,
                stackSize: stack.length,
                depth: finalPath ? Math.max(0, finalPath.length - 1) : Math.max(0, stack.length - 1),
                status,
                description
            });
        };

        // Initial Start Step
        recordStep(
            'START',
            { r: startR, c: startC },
            'READY',
            `Started DFS from Start cell (${startR}, ${startC}). Goal is (${goalR}, ${goalC}).`
        );

        // Edge Case: Start is Goal
        if (startR === goalR && startC === goalC) {
            this.finalPath = [{ r: startR, c: startC }];
            this.isSolved = true;
            this.nodesExplored = 1;
            this.solutionDepth = 0;
            this.pathLength = 1;

            recordStep(
                'GOAL_REACHED',
                { r: startR, c: startC },
                'GOAL_REACHED',
                `Start cell is identical to Goal (${startR}, ${startC})! Path depth is 0.`,
                this.finalPath
            );
            this.totalSteps = this.steps.length;
            return;
        }

        // DFS Traversal Loop
        while (stack.length > 0) {
            const top = stack[stack.length - 1];

            // Find next unvisited neighbor
            let foundNeighbor = null;
            while (top.neighborIndex < top.neighbors.length) {
                const cand = top.neighbors[top.neighborIndex];
                top.neighborIndex++;
                const candKey = this.cellKey(cand.r, cand.c);
                if (!visitedSet.has(candKey)) {
                    foundNeighbor = cand;
                    break;
                }
            }

            if (foundNeighbor) {
                // Explore unvisited neighbor
                const nKey = this.cellKey(foundNeighbor.r, foundNeighbor.c);
                visitedSet.add(nKey);
                parentMap.set(nKey, { r: top.r, c: top.c });

                const nextNeighbors = this.maze.getValidNeighbors(foundNeighbor.r, foundNeighbor.c, this.order);
                stack.push({
                    r: foundNeighbor.r,
                    c: foundNeighbor.c,
                    neighborIndex: 0,
                    neighbors: nextNeighbors
                });

                // Check if this new cell is the goal
                if (foundNeighbor.r === goalR && foundNeighbor.c === goalC) {
                    // Reconstruct path
                    const path = [];
                    let currKey = nKey;
                    while (currKey) {
                        const [cr, cc] = currKey.split(',').map(Number);
                        path.push({ r: cr, c: cc });
                        const p = parentMap.get(currKey);
                        currKey = p ? this.cellKey(p.r, p.c) : null;
                    }
                    path.reverse();

                    this.finalPath = path;
                    this.isSolved = true;
                    this.nodesExplored = visitedSet.size;
                    this.solutionDepth = path.length - 1; // number of edges
                    this.pathLength = path.length;

                    recordStep(
                        'GOAL_REACHED',
                        { r: foundNeighbor.r, c: foundNeighbor.c },
                        'GOAL_REACHED',
                        `Goal (${goalR}, ${goalC}) reached via ${foundNeighbor.direction}! Solution depth: ${this.solutionDepth} edges (${this.pathLength} cells).`,
                        this.finalPath
                    );
                    break;
                } else {
                    recordStep(
                        'EXPLORE',
                        { r: foundNeighbor.r, c: foundNeighbor.c },
                        'SEARCHING',
                        `Advanced ${foundNeighbor.direction} into (${foundNeighbor.r}, ${foundNeighbor.c}). Stack depth: ${stack.length}.`
                    );
                }
            } else {
                // No unvisited neighbors: DEAD END!
                const deadCell = stack.pop();
                const deadKey = this.cellKey(deadCell.r, deadCell.c);
                deadEndSet.add(deadKey);

                if (stack.length > 0) {
                    const backtrackParent = stack[stack.length - 1];
                    recordStep(
                        'DEAD_END',
                        { r: deadCell.r, c: deadCell.c },
                        'BACKTRACKING',
                        `Dead end at (${deadCell.r}, ${deadCell.c}): no unvisited corridors. Backtracking to parent (${backtrackParent.r}, ${backtrackParent.c}).`
                    );
                } else {
                    // Stack empty, no parent left
                    recordStep(
                        'DEAD_END',
                        { r: deadCell.r, c: deadCell.c },
                        'BACKTRACKING',
                        `Dead end at (${deadCell.r}, ${deadCell.c}). Stack exhausted.`
                    );
                }
            }
        }

        // If not solved and stack emptied
        if (!this.isSolved) {
            this.finalPath = null;
            this.nodesExplored = visitedSet.size;
            this.solutionDepth = 0;
            this.pathLength = 0;

            recordStep(
                'NO_SOLUTION',
                this.start,
                'NO_SOLUTION',
                `DFS complete: Goal (${goalR}, ${goalC}) is unreachable from Start (${startR}, ${startC}). Total nodes explored: ${this.nodesExplored}.`
            );
        }

        this.totalSteps = this.steps.length;
    }

    getStep(index) {
        if (index < 0) return this.steps[0];
        if (index >= this.steps.length) return this.steps[this.steps.length - 1];
        return this.steps[index];
    }
}

// Export for Node.js testing and browser window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DFSSolver };
}
