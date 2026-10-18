/**
 * MazeLab — script.js
 * Visualizer controller, HTML5 Canvas rendering engine, playback controls,
 * real-time statistics, and user interactions.
 */

(function () {
    'use strict';

    // =========================================================================
    // APPLICATION STATE
    // =========================================================================
    let maze = new Maze(13, 13);
    let start = { r: 12, c: 6 }; // Default South Exit
    let goal = { r: 0, c: 6 };   // Default North Exit
    let neighborOrder = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

    let solver = null;
    let currentStepIndex = 0;
    let isPlaying = false;
    let animationTimer = null;
    let speedMs = 70; // Default step delay in milliseconds
    let currentMode = 'NONE'; // 'NONE' | 'SET_START' | 'SET_GOAL'
    let hoveredCell = null;

    // =========================================================================
    // DOM ELEMENTS
    // =========================================================================
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvasContainer');

    // Controls
    const btnPlay = document.getElementById('btnPlay');
    const btnNext = document.getElementById('btnNext');
    const btnPrev = document.getElementById('btnPrev');
    const btnResetSearch = document.getElementById('btnResetSearch');
    const btnSetStart = document.getElementById('btnSetStart');
    const btnSetGoal = document.getElementById('btnSetGoal');
    const btnRandomEndpoints = document.getElementById('btnRandomEndpoints');
    const btnLoadSample = document.getElementById('btnLoadSample') || document.getElementById('btnLoadTask1A');
    const btnGenerateRandom = document.getElementById('btnGenerateRandom');
    const mazeSizeSelect = document.getElementById('mazeSizeSelect');
    const orderSelect = document.getElementById('orderSelect');
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');

    // Labels & Badges
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const modeInstructionText = document.getElementById('modeInstructionText');
    const mazeNameLabel = document.getElementById('mazeNameLabel');
    const hoverCoords = document.getElementById('hoverCoords');
    const actionTicker = document.getElementById('actionTicker');

    // Statistics Cards
    const statExplored = document.getElementById('statExplored');
    const statDepth = document.getElementById('statDepth');
    const statPathLen = document.getElementById('statPathLen');
    const statStackSize = document.getElementById('statStackSize');
    const statStep = document.getElementById('statStep');
    const statStatus = document.getElementById('statStatus');

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    function initApp() {
        // Load default sample maze
        maze.loadSampleMaze();
        start = { r: 12, c: 6 };
        goal = { r: 0, c: 6 };

        setupEventListeners();
        setupAccordion();
        computeSearch();
        resizeCanvas();
        render();
        updateUI();
    }

    /**
     * Instantiates the DFSSolver and calculates the step history.
     */
    function computeSearch() {
        try {
            solver = new DFSSolver(maze, start, goal, neighborOrder);
            currentStepIndex = 0;
        } catch (err) {
            console.error('[MazeLab] Search computation error:', err);
        }
    }

    // =========================================================================
    // CANVAS RESIZING & HIGH-DPI SUPPORT
    // =========================================================================
    function resizeCanvas() {
        const rect = canvasContainer.getBoundingClientRect();
        // Keep a square aspect ratio
        const size = Math.min(rect.width || 600, 650);
        const dpr = window.devicePixelRatio || 1;

        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        canvas.width = Math.floor(size * dpr);
        canvas.height = Math.floor(size * dpr);

        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
        ctx.scale(dpr, dpr);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        render();
    });

    // =========================================================================
    // RENDERING PIPELINE
    // =========================================================================
    function render() {
        if (!maze || !solver) return;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.clearRect(0, 0, width, height);

        const rows = maze.rows;
        const cols = maze.cols;
        const cellW = width / cols;
        const cellH = height / rows;

        // Current snapshot from DFS solver
        const step = solver.getStep(currentStepIndex);

        // 1. Draw Maze Background & Corridors
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Subtle corridor grid guides
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let r = 0; r <= rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * cellH);
            ctx.lineTo(width, r * cellH);
            ctx.stroke();
        }
        for (let c = 0; c <= cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * cellW, 0);
            ctx.lineTo(c * cellW, height);
            ctx.stroke();
        }

        // 2. Draw Visited Cells (Subtle Blue Tint)
        if (step && step.visited) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.14)';
            for (const cell of step.visited) {
                ctx.fillRect(cell.c * cellW + 1, cell.r * cellH + 1, cellW - 2, cellH - 2);
            }
        }

        // 3. Draw Dead-End Cells (Red Markers)
        if (step && step.deadEnds) {
            for (const dead of step.deadEnds) {
                // Don't mark goal as dead-end
                if (dead.r === goal.r && dead.c === goal.c) continue;

                // Soft red cell tint
                ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
                ctx.fillRect(dead.c * cellW + 1, dead.r * cellH + 1, cellW - 2, cellH - 2);

                // Small red cross marker in dead-end cell
                const cx = dead.c * cellW + cellW / 2;
                const cy = dead.r * cellH + cellH / 2;
                const cr = Math.min(cellW, cellH) * 0.16;

                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx - cr, cy - cr);
                ctx.lineTo(cx + cr, cy + cr);
                ctx.moveTo(cx + cr, cy - cr);
                ctx.lineTo(cx - cr, cy + cr);
                ctx.stroke();
            }
        }

        // 4. Draw Active DFS Exploration Path (Yellow Polyline)
        if (step && step.activeStack && step.activeStack.length > 0 && !step.finalPath) {
            ctx.save();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = Math.max(3, cellW * 0.32);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
            ctx.shadowBlur = 8;

            ctx.beginPath();
            const first = step.activeStack[0];
            ctx.moveTo(first.c * cellW + cellW / 2, first.r * cellH + cellH / 2);
            for (let i = 1; i < step.activeStack.length; i++) {
                const pt = step.activeStack[i];
                ctx.lineTo(pt.c * cellW + cellW / 2, pt.r * cellH + cellH / 2);
            }
            ctx.stroke();
            ctx.restore();
        }

        // 5. Draw Final Solution Path (Vibrant Green Path)
        if (step && step.finalPath && step.finalPath.length > 0) {
            // Soft green glow behind path cells
            ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
            for (const pt of step.finalPath) {
                ctx.fillRect(pt.c * cellW + 1, pt.r * cellH + 1, cellW - 2, cellH - 2);
            }

            // Glowing green solution polyline
            ctx.save();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = Math.max(4, cellW * 0.42);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
            ctx.shadowBlur = 12;

            ctx.beginPath();
            const startPt = step.finalPath[0];
            ctx.moveTo(startPt.c * cellW + cellW / 2, startPt.r * cellH + cellH / 2);
            for (let i = 1; i < step.finalPath.length; i++) {
                const pt = step.finalPath[i];
                ctx.lineTo(pt.c * cellW + cellW / 2, pt.r * cellH + cellH / 2);
            }
            ctx.stroke();
            ctx.restore();
        }

        // 6. Draw Current Node Pulsing Indicator (Amber / Orange)
        if (step && step.current && !step.finalPath && currentStepIndex > 0) {
            const curr = step.current;
            const cx = curr.c * cellW + cellW / 2;
            const cy = curr.r * cellH + cellH / 2;
            const radius = Math.min(cellW, cellH) * 0.32;

            ctx.save();
            ctx.fillStyle = '#f97316';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner white dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 7. Draw Start & Goal Badges
        drawEndpointBadge(start.r, start.c, 'S', '#10b981', cellW, cellH);
        drawEndpointBadge(goal.r, goal.c, 'G', '#ef4444', cellW, cellH);

        // 8. Draw Boundary Exit Portal Indicators
        if (maze.exits && maze.exits.length > 0) {
            for (const exit of maze.exits) {
                drawExitPortal(exit, cellW, cellH, width, height);
            }
        }

        // 9. Draw Solid Maze Walls
        ctx.save();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = Math.max(2.5, Math.min(cellW, cellH) * 0.12);
        ctx.lineCap = 'square';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = maze.grid[r][c];
                const x1 = c * cellW;
                const y1 = r * cellH;
                const x2 = (c + 1) * cellW;
                const y2 = (r + 1) * cellH;

                if (cell.walls.north) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.stroke();
                }
                if (cell.walls.east) {
                    ctx.beginPath();
                    ctx.moveTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                if (cell.walls.south) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                if (cell.walls.west) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.stroke();
                }
            }
        }
        ctx.restore();

        // 10. Draw Hover Ring if cell is hovered
        if (hoveredCell && maze.isValidCell(hoveredCell.r, hoveredCell.c)) {
            const hx = hoveredCell.c * cellW;
            const hy = hoveredCell.r * cellH;
            ctx.save();
            ctx.strokeStyle = currentMode === 'SET_START' ? '#10b981' :
                              currentMode === 'SET_GOAL' ? '#ef4444' : '#3b82f6';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(hx + 2, hy + 2, cellW - 4, cellH - 4);
            ctx.restore();
        }
    }

    /**
     * Renders a circular badge with letter icon for Start ('S') or Goal ('G').
     */
    function drawEndpointBadge(r, c, letter, color, cellW, cellH) {
        const cx = c * cellW + cellW / 2;
        const cy = r * cellH + cellH / 2;
        const radius = Math.min(cellW, cellH) * 0.38;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // White border
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Text letter
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(radius * 1.15)}px var(--font-sans, sans-serif)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, cx, cy + 1);
        ctx.restore();
    }

    /**
     * Renders subtle exit indicators for boundary doorway exits.
     */
    function drawExitPortal(exit, cellW, cellH, totalW, totalH) {
        const cx = exit.c * cellW + cellW / 2;
        const cy = exit.r * cellH + cellH / 2;
        ctx.save();
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        if (exit.direction === 'UP') {
            // Arrow pointing up outside maze
            ctx.beginPath();
            ctx.moveTo(cx, 2);
            ctx.lineTo(cx - 5, 8);
            ctx.lineTo(cx + 5, 8);
            ctx.closePath();
            ctx.fill();
        } else if (exit.direction === 'DOWN') {
            // Arrow pointing down outside maze
            ctx.beginPath();
            ctx.moveTo(cx, totalH - 2);
            ctx.lineTo(cx - 5, totalH - 8);
            ctx.lineTo(cx + 5, totalH - 8);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    // =========================================================================
    // UI & STATISTICS UPDATE
    // =========================================================================
    function updateUI() {
        if (!solver) return;

        const totalSteps = solver.totalSteps;
        const step = solver.getStep(currentStepIndex);

        // Update Statistics
        statExplored.textContent = step ? step.nodesExplored : 0;
        statDepth.textContent = step ? step.depth : 0;
        statPathLen.textContent = step && step.finalPath ? step.finalPath.length : 0;
        statStackSize.textContent = step ? step.stackSize : 0;
        statStep.textContent = `${currentStepIndex + 1} / ${totalSteps}`;

        // Status Badge & Texts
        let currentStatus = step ? step.status : 'IDLE';
        statStatus.textContent = currentStatus;

        statusDot.className = 'status-dot';
        if (currentStatus === 'SEARCHING') {
            statusDot.classList.add('searching');
            statusText.textContent = `SEARCHING — Step ${currentStepIndex + 1}`;
        } else if (currentStatus === 'BACKTRACKING') {
            statusDot.classList.add('backtracking');
            statusText.textContent = `BACKTRACKING — Dead End at (${step.current.r}, ${step.current.c})`;
        } else if (currentStatus === 'GOAL_REACHED') {
            statusDot.classList.add('solved');
            statusText.textContent = `GOAL REACHED! Depth: ${solver.solutionDepth}`;
        } else if (currentStatus === 'NO_SOLUTION') {
            statusDot.classList.add('failed');
            statusText.textContent = 'NO PATH FOUND!';
        } else {
            statusText.textContent = 'IDLE — READY';
        }

        // Action Commentary Ticker
        if (step && step.description) {
            actionTicker.textContent = step.description;
        }

        // Button States
        btnPrev.disabled = currentStepIndex <= 0;
        btnNext.disabled = currentStepIndex >= totalSteps - 1;

        if (isPlaying) {
            btnPlay.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                </svg>
                Pause
            `;
            btnPlay.classList.add('btn-danger');
            btnPlay.classList.remove('btn-primary');
        } else {
            const isFinished = currentStepIndex >= totalSteps - 1 && currentStepIndex > 0;
            btnPlay.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                ${isFinished ? 'Replay DFS' : (currentStepIndex > 0 ? 'Resume DFS' : 'Play DFS')}
            `;
            btnPlay.classList.remove('btn-danger');
            btnPlay.classList.add('btn-primary');
        }

        // Mode instruction helper text
        if (currentMode === 'SET_START') {
            modeInstructionText.textContent = 'Click any cell on the maze to place START.';
            btnSetStart.classList.add('active-start');
            btnSetGoal.classList.remove('active-goal');
            canvasContainer.className = 'canvas-container picking-start';
        } else if (currentMode === 'SET_GOAL') {
            modeInstructionText.textContent = 'Click any cell on the maze to place GOAL.';
            btnSetGoal.classList.add('active-goal');
            btnSetStart.classList.remove('active-start');
            canvasContainer.className = 'canvas-container picking-goal';
        } else {
            modeInstructionText.textContent = 'Ready to run DFS or customize endpoints.';
            btnSetStart.classList.remove('active-start');
            btnSetGoal.classList.remove('active-goal');
            canvasContainer.className = 'canvas-container';
        }
    }

    // =========================================================================
    // PLAYBACK CONTROLS
    // =========================================================================
    function play() {
        if (!solver || solver.totalSteps <= 0) return;

        // If at the end, restart from beginning
        if (currentStepIndex >= solver.totalSteps - 1) {
            currentStepIndex = 0;
        }

        isPlaying = true;
        updateUI();

        // Run animation interval
        clearInterval(animationTimer);
        animationTimer = setInterval(() => {
            if (currentStepIndex < solver.totalSteps - 1) {
                currentStepIndex++;
                render();
                updateUI();
            } else {
                pause();
            }
        }, speedMs);
    }

    function pause() {
        isPlaying = false;
        clearInterval(animationTimer);
        animationTimer = null;
        updateUI();
    }

    function nextStep() {
        pause();
        if (solver && currentStepIndex < solver.totalSteps - 1) {
            currentStepIndex++;
            render();
            updateUI();
        }
    }

    function prevStep() {
        pause();
        if (solver && currentStepIndex > 0) {
            currentStepIndex--;
            render();
            updateUI();
        }
    }

    function resetSearch() {
        pause();
        currentStepIndex = 0;
        render();
        updateUI();
        actionTicker.textContent = `Search reset. Ready at Start (${start.r}, ${start.c}) and Goal (${goal.r}, ${goal.c}).`;
    }

    // =========================================================================
    // EVENT LISTENERS & INTERACTION
    // =========================================================================
    function setupEventListeners() {
        // Playback Buttons
        btnPlay.addEventListener('click', () => {
            if (isPlaying) {
                pause();
            } else {
                play();
            }
        });

        btnNext.addEventListener('click', nextStep);
        btnPrev.addEventListener('click', prevStep);
        btnResetSearch.addEventListener('click', resetSearch);

        // Speed Slider
        speedSlider.addEventListener('input', (e) => {
            speedMs = parseInt(e.target.value, 10);
            speedValue.textContent = `${speedMs} ms`;
            if (isPlaying) {
                // Instantly adapt interval without interrupting playback
                clearInterval(animationTimer);
                animationTimer = setInterval(() => {
                    if (currentStepIndex < solver.totalSteps - 1) {
                        currentStepIndex++;
                        render();
                        updateUI();
                    } else {
                        pause();
                    }
                }, speedMs);
            }
        });

        // Mode Toggles: Set Start / Set Goal
        btnSetStart.addEventListener('click', () => {
            pause();
            currentMode = currentMode === 'SET_START' ? 'NONE' : 'SET_START';
            updateUI();
            render();
        });

        btnSetGoal.addEventListener('click', () => {
            pause();
            currentMode = currentMode === 'SET_GOAL' ? 'NONE' : 'SET_GOAL';
            updateUI();
            render();
        });

        // Randomize Endpoints
        btnRandomEndpoints.addEventListener('click', () => {
            pause();
            currentMode = 'NONE';
            randomizeEndpoints();
        });

        // Load Sample Maze
        if (btnLoadSample) {
            btnLoadSample.addEventListener('click', () => {
                pause();
                currentMode = 'NONE';
                maze = new Maze(13, 13);
                maze.loadSampleMaze();
                mazeNameLabel.textContent = 'Sample Maze (13 × 13)';
                mazeSizeSelect.value = '13';
                start = { r: 12, c: 6 };
                goal = { r: 0, c: 6 };
                computeSearch();
                resizeCanvas();
                render();
                updateUI();
                actionTicker.textContent = 'Loaded 13×13 sample maze with verified walls and North/South exits.';
            });
        }

        // Generate Random Maze
        btnGenerateRandom.addEventListener('click', () => {
            pause();
            currentMode = 'NONE';
            const size = parseInt(mazeSizeSelect.value, 10);
            maze = new Maze(size, size);
            maze.generateRandom(size, size, 0.08); // Slight loop factor for rich exploration
            mazeNameLabel.textContent = `Random Maze (${size} × ${size})`;
            start = { r: 0, c: 0 };
            goal = { r: size - 1, c: size - 1 };
            computeSearch();
            resizeCanvas();
            render();
            updateUI();
            actionTicker.textContent = `Generated new fully-connected ${size}×${size} maze via DFS Backtracker.`;
        });

        // Maze Size Change
        mazeSizeSelect.addEventListener('change', () => {
            btnGenerateRandom.click();
        });

        // Neighbor Priority Order Change
        orderSelect.addEventListener('change', (e) => {
            pause();
            neighborOrder = e.target.value.split(',');
            computeSearch();
            render();
            updateUI();
            actionTicker.textContent = `Updated DFS neighbour search priority to: ${neighborOrder.join(' → ')}.`;
        });

        // Canvas Mouse Events: Hover and Click
        canvas.addEventListener('mousemove', handleCanvasMouseMove);
        canvas.addEventListener('mouseleave', () => {
            hoveredCell = null;
            hoverCoords.textContent = 'Hover: cell (—, —)';
            render();
        });

        canvas.addEventListener('click', handleCanvasClick);

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            // Ignore if active in input/select
            if (['INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;

            if (e.code === 'Space') {
                e.preventDefault();
                btnPlay.click();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                nextStep();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                prevStep();
            } else if (e.key === 'r' || e.key === 'R') {
                resetSearch();
            }
        });
    }

    /**
     * Converts mouse coordinates to maze cell (r, c).
     */
    function getCellFromMouseEvent(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellW = rect.width / maze.cols;
        const cellH = rect.height / maze.rows;

        const c = Math.floor(x / cellW);
        const r = Math.floor(y / cellH);

        if (maze.isValidCell(r, c)) {
            return { r, c };
        }
        return null;
    }

    function handleCanvasMouseMove(e) {
        const cell = getCellFromMouseEvent(e);
        if (cell) {
            hoveredCell = cell;
            hoverCoords.textContent = `Hover: cell (${cell.r}, ${cell.c})`;
            render();
        }
    }

    function handleCanvasClick(e) {
        const cell = getCellFromMouseEvent(e);
        if (!cell) return;

        if (currentMode === 'SET_START') {
            if (cell.r === goal.r && cell.c === goal.c) {
                actionTicker.textContent = 'Notice: Start and Goal placed on the same cell (depth = 0).';
            }
            start = { r: cell.r, c: cell.c };
            currentMode = 'NONE';
            computeSearch();
            render();
            updateUI();
            actionTicker.textContent = `Start positioned at (${start.r}, ${start.c}). Search recalculated.`;
        } else if (currentMode === 'SET_GOAL') {
            if (cell.r === start.r && cell.c === start.c) {
                actionTicker.textContent = 'Notice: Goal and Start placed on the same cell (depth = 0).';
            }
            goal = { r: cell.r, c: cell.c };
            currentMode = 'NONE';
            computeSearch();
            render();
            updateUI();
            actionTicker.textContent = `Goal positioned at (${goal.r}, ${goal.c}). Search recalculated.`;
        } else {
            // If user clicked without mode, toggle start/goal intuitively if clicked directly on them
            // Or show helpful hint
            actionTicker.textContent = `Selected cell (${cell.r}, ${cell.c}). Use "Set Start" or "Set Goal" to reposition endpoints.`;
        }
    }

    /**
     * Picks two distinct valid cells inside the maze.
     */
    function randomizeEndpoints() {
        let r1, c1, r2, c2;
        r1 = Math.floor(Math.random() * maze.rows);
        c1 = Math.floor(Math.random() * maze.cols);

        do {
            r2 = Math.floor(Math.random() * maze.rows);
            c2 = Math.floor(Math.random() * maze.cols);
        } while (r1 === r2 && c1 === c2);

        start = { r: r1, c: c1 };
        goal = { r: r2, c: c2 };

        computeSearch();
        render();
        updateUI();
        actionTicker.textContent = `Randomized endpoints: Start (${start.r}, ${start.c}) → Goal (${goal.r}, ${goal.c}).`;
    }

    /**
     * Accordion toggle for Educational / Viva theory items.
     */
    function setupAccordion() {
        const items = document.querySelectorAll('.edu-item');
        items.forEach((item) => {
            const header = item.querySelector('.edu-header');
            header.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                items.forEach(i => i.classList.remove('open'));
                if (!isOpen) {
                    item.classList.add('open');
                }
            });
        });
    }

    // Run on page load
    document.addEventListener('DOMContentLoaded', initApp);

})();
