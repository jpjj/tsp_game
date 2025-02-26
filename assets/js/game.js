/**
 * Traveling Salesperson Game
 * An interactive game to solve the TSP problem
 */

// Game state
const state = {
    cities: [],
    path: [],
    optimalPath: [],
    nearestNeighborPath: [],
    bestPathLength: Infinity,
    bestPath: [],
    citySize: 8,
    gameStarted: false,
    difficulty: {
        easy: 10,
        medium: 15,
        hard: 25,
        expert: 40,
        custom: 20
    }
};

// DOM Elements
const canvas = document.getElementById('tsp-canvas');
const ctx = canvas.getContext('2d');
const citiesVisitedElement = document.getElementById('cities-visited');
const totalCitiesElement = document.getElementById('total-cities');
const currentLengthElement = document.getElementById('current-length');
const bestLengthElement = document.getElementById('best-length');
const nnLengthElement = document.getElementById('nn-length');
const optimalLengthElement = document.getElementById('optimal-length');
const undoButton = document.getElementById('undo-btn');
const resetPathButton = document.getElementById('reset-path-btn');
const clearBestButton = document.getElementById('clear-best-btn');
const nearestNeighborButton = document.getElementById('nearest-neighbor-btn');
const optimalButton = document.getElementById('optimal-btn');
const newGameButton = document.getElementById('new-game-btn');
const difficultySelect = document.getElementById('difficulty-select');
const customCitiesContainer = document.getElementById('custom-cities-container');
const customCitiesInput = document.getElementById('custom-cities');
const citySizeInput = document.getElementById('city-size');
const citySizeValue = document.getElementById('city-size-value');

/**
 * Make canvas responsive
 */
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth - 40; // Minus padding

    if (window.innerWidth <= 800) {
        canvas.width = containerWidth;
        canvas.height = containerWidth * 0.6;

        if (state.gameStarted) {
            drawGame();
        }
    }
}

/**
 * Initialize the game
 */
function initGame() {
    state.gameStarted = false;
    state.cities = [];
    state.path = [];
    state.optimalPath = [];
    state.nearestNeighborPath = [];

    // Keep best path between games if not cleared

    const difficultyValue = difficultySelect.value;
    let numCities;

    if (difficultyValue === 'custom') {
        numCities = parseInt(customCitiesInput.value);
        state.difficulty.custom = numCities;
    } else {
        numCities = state.difficulty[difficultyValue];
    }

    // Generate random cities
    for (let i = 0; i < numCities; i++) {
        const margin = Math.max(30, state.citySize * 2);
        const x = Math.random() * (canvas.width - 2 * margin) + margin;
        const y = Math.random() * (canvas.height - 2 * margin) + margin;

        // Ensure cities aren't too close together
        let tooClose = false;
        for (const city of state.cities) {
            const distance = calculateDistance(x, y, city.x, city.y);
            if (distance < state.citySize * 3) {
                tooClose = true;
                break;
            }
        }

        if (!tooClose) {
            state.cities.push({ x, y, id: i });
        } else {
            // Try again for this city
            i--;
        }
    }

    // Update stats
    totalCitiesElement.textContent = state.cities.length;
    citiesVisitedElement.textContent = 0;
    currentLengthElement.textContent = "0";

    if (state.bestPathLength !== Infinity) {
        bestLengthElement.textContent = state.bestPathLength.toFixed(2);
    } else {
        bestLengthElement.textContent = "N/A";
    }

    // Disable undo button
    undoButton.disabled = true;

    // Precalculate nearest neighbor solution
    calculateNearestNeighborSolution();
    nnLengthElement.textContent = calculatePathLength(state.nearestNeighborPath).toFixed(2);

    // Precalculate "optimal" solution (2-opt)
    calculateOptimalSolution();
    optimalLengthElement.textContent = calculatePathLength(state.optimalPath).toFixed(2);

    drawGame();
    state.gameStarted = true;
}

/**
 * Clear best path
 */
function clearBestPath() {
    state.bestPathLength = Infinity;
    state.bestPath = [];
    bestLengthElement.textContent = "N/A";
}

/**
 * Handle canvas clicks
 * @param {MouseEvent} event - The click event
 */
function handleCanvasClick(event) {
    if (!state.gameStarted) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    // Find if a city was clicked
    for (const city of state.cities) {
        const dx = city.x - x;
        const dy = city.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < state.citySize + 5) {
            // Check if clicking on the first city to complete the tour
            if (state.path.length === state.cities.length - 1 && !state.path.includes(city.id)) {
                addCityToPath(city.id);
                // Add the first city again to complete the tour
                addCityToPath(state.path[0]);

                // Check if this is the best path so far
                const pathLength = calculatePathLength(state.path);
                if (pathLength < state.bestPathLength) {
                    state.bestPathLength = pathLength;
                    state.bestPath = [...state.path];
                    bestLengthElement.textContent = state.bestPathLength.toFixed(2);
                }

                // Compare with algorithm solutions
                const nnLength = calculatePathLength(state.nearestNeighborPath);
                const optimalLength = calculatePathLength(state.optimalPath);

                let message = `Tour completed! Your path length: ${pathLength.toFixed(2)}\n`;
                message += `Nearest Neighbor: ${nnLength.toFixed(2)}\n`;
                message += `2-Opt Solution: ${optimalLength.toFixed(2)}\n\n`;

                if (pathLength <= optimalLength) {
                    message += "Impressive! You beat or matched the 2-Opt algorithm!";
                } else if (pathLength <= nnLength) {
                    message += "Great job! You beat the Nearest Neighbor algorithm!";
                } else {
                    message += "Keep trying! Can you beat the algorithms?";
                }

                setTimeout(() => {
                    alert(message);
                }, 100);
            }
            // Check if the city is not already in the path (except for completing the tour)
            else if (!state.path.includes(city.id)) {
                addCityToPath(city.id);
            }

            break;
        }
    }
}

/**
 * Add a city to the path
 * @param {number} cityId - The ID of the city to add
 */
function addCityToPath(cityId) {
    state.path.push(cityId);
    citiesVisitedElement.textContent = Math.min(state.path.length, state.cities.length);

    // Update current path length
    if (state.path.length > 1) {
        const pathLength = calculatePathLength(state.path);
        currentLengthElement.textContent = pathLength.toFixed(2);
    }

    // Enable undo button
    undoButton.disabled = false;

    drawGame();
}

/**
 * Undo last city
 */
function undoLastCity() {
    if (state.path.length > 0) {
        state.path.pop();
        citiesVisitedElement.textContent = state.path.length;

        // Update current path length
        if (state.path.length > 1) {
            const pathLength = calculatePathLength(state.path);
            currentLengthElement.textContent = pathLength.toFixed(2);
        } else {
            currentLengthElement.textContent = "0";
        }

        // Disable undo button if path is empty
        if (state.path.length === 0) {
            undoButton.disabled = true;
        }

        drawGame();
    }
}

/**
 * Reset path
 */
function resetPath() {
    state.path = [];
    citiesVisitedElement.textContent = 0;
    currentLengthElement.textContent = "0";
    undoButton.disabled = true;
    drawGame();
}

/**
 * Calculate nearest neighbor solution
 */
function calculateNearestNeighborSolution() {
    if (state.cities.length === 0) return;

    const visited = new Array(state.cities.length).fill(false);
    state.nearestNeighborPath = [0]; // Start with city 0
    visited[0] = true;

    while (state.nearestNeighborPath.length < state.cities.length) {
        const lastCity = state.nearestNeighborPath[state.nearestNeighborPath.length - 1];
        let nearestCity = -1;
        let shortestDistance = Infinity;

        for (let i = 0; i < state.cities.length; i++) {
            if (!visited[i]) {
                const distance = calculateDistance(
                    state.cities[lastCity].x, state.cities[lastCity].y,
                    state.cities[i].x, state.cities[i].y
                );

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestCity = i;
                }
            }
        }

        if (nearestCity !== -1) {
            state.nearestNeighborPath.push(nearestCity);
            visited[nearestCity] = true;
        }
    }

    // Return to the starting city
    state.nearestNeighborPath.push(state.nearestNeighborPath[0]);
}

/**
 * Show nearest neighbor solution
 */
function showNearestNeighborSolution() {
    resetPath();

    // Set path to nearest neighbor solution
    state.path = [...state.nearestNeighborPath];

    // Update stats
    citiesVisitedElement.textContent = Math.min(state.path.length, state.cities.length);

    if (state.path.length > 1) {
        const pathLength = calculatePathLength(state.path);
        currentLengthElement.textContent = pathLength.toFixed(2);

        // Update best path if this is better
        if (pathLength < state.bestPathLength) {
            state.bestPathLength = pathLength;
            state.bestPath = [...state.path];
            bestLengthElement.textContent = state.bestPathLength.toFixed(2);
        }
    }

    // Enable undo button
    undoButton.disabled = false;

    drawGame();
}

/**
 * Calculate a better solution using 2-opt
 */
function calculateOptimalSolution() {
    // Start with nearest neighbor solution
    state.optimalPath = [...state.nearestNeighborPath];

    // Apply 2-opt improvement
    let improvement = true;
    let iterations = 0;
    const maxIterations = Math.min(200, state.cities.length * 8); // Adjust based on city count

    while (improvement && iterations < maxIterations) {
        improvement = false;
        iterations++;

        for (let i = 1; i < state.optimalPath.length - 2; i++) {
            for (let j = i + 1; j < state.optimalPath.length - 1; j++) {
                // Check if swapping edges (i-1,i) and (j,j+1) improves the tour
                const a = state.optimalPath[i - 1];
                const b = state.optimalPath[i];
                const c = state.optimalPath[j];
                const d = state.optimalPath[j + 1];

                const d1 = calculateDistance(
                    state.cities[a].x, state.cities[a].y,
                    state.cities[b].x, state.cities[b].y
                ) + calculateDistance(
                    state.cities[c].x, state.cities[c].y,
                    state.cities[d].x, state.cities[d].y
                );

                const d2 = calculateDistance(
                    state.cities[a].x, state.cities[a].y,
                    state.cities[c].x, state.cities[c].y
                ) + calculateDistance(
                    state.cities[b].x, state.cities[b].y,
                    state.cities[d].x, state.cities[d].y
                );

                if (d2 < d1) {
                    // Reverse the path between i and j
                    const reversed = state.optimalPath.slice(i, j + 1).reverse();
                    state.optimalPath.splice(i, (j - i + 1), ...reversed);
                    improvement = true;
                    break; // Small optimization - restart outer loop after change
                }
            }
            if (improvement) break;
        }
    }
}

/**
 * Show "optimal" solution
 */
function showOptimalSolution() {
    resetPath();

    // Set path to optimal solution
    state.path = [...state.optimalPath];

    // Update stats
    citiesVisitedElement.textContent = Math.min(state.path.length, state.cities.length);

    if (state.path.length > 1) {
        const pathLength = calculatePathLength(state.path);
        currentLengthElement.textContent = pathLength.toFixed(2);

        // Update best path if this is better
        if (pathLength < state.bestPathLength) {
            state.bestPathLength = pathLength;
            state.bestPath = [...state.path];
            bestLengthElement.textContent = state.bestPathLength.toFixed(2);
        }
    }

    // Enable undo button
    undoButton.disabled = false;

    drawGame();
}

/**
 * Draw the game
 */
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges in the path
    if (state.path.length > 1) {
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const startCity = state.cities[state.path[0]];
        ctx.moveTo(startCity.x, startCity.y);

        for (let i = 1; i < state.path.length; i++) {
            const city = state.cities[state.path[i]];
            ctx.lineTo(city.x, city.y);
        }

        ctx.stroke();
    }

    // Draw cities
    for (let i = 0; i < state.cities.length; i++) {
        const city = state.cities[i];

        // Different appearance for cities in the path
        if (state.path.includes(i)) {
            const index = state.path.indexOf(i);

            // Different color for first and last city in path
            if (index === 0 || (index === state.path.length - 1 && state.path[0] === state.path[state.path.length - 1])) {
                ctx.fillStyle = '#27ae60'; // Green for start/end
            } else {
                ctx.fillStyle = '#3498db'; // Blue for visited
            }
        } else {
            ctx.fillStyle = '#e74c3c'; // Red for unvisited
        }

        // Add glow for current city
        if (state.path.length > 0 && i === state.path[state.path.length - 1]) {
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(city.x, city.y, state.citySize, 0, Math.PI * 2);
        ctx.fill();

        // Draw city number
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(10, state.citySize - 2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), city.x, city.y);
    }

    // Reset shadow
    ctx.shadowBlur = 0;
}

/**
 * Start a new game
 */
function startNewGame() {
    initGame();
}

/**
 * Calculate distance between two points
 * @param {number} x1 - X coordinate of first point
 * @param {number} y1 - Y coordinate of first point
 * @param {number} x2 - X coordinate of second point
 * @param {number} y2 - Y coordinate of second point
 * @returns {number} Distance between points
 */
function calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total path length
 * @param {Array} path - Array of city IDs representing the path
 * @returns {number} Total path length
 */
function calculatePathLength(path) {
    if (!path || path.length <= 1) return 0;

    let length = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const city1 = state.cities[path[i]];
        const city2 = state.cities[path[i + 1]];
        length += calculateDistance(city1.x, city1.y, city2.x, city2.y);
    }

    return length;
}

// Event listeners
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('click', handleCanvasClick);
undoButton.addEventListener('click', undoLastCity);
resetPathButton.addEventListener('click', resetPath);
clearBestButton.addEventListener('click', clearBestPath);
nearestNeighborButton.addEventListener('click', showNearestNeighborSolution);
optimalButton.addEventListener('click', showOptimalSolution);
newGameButton.addEventListener('click', startNewGame);

// Call resizeCanvas once on load
resizeCanvas();

difficultySelect.addEventListener('change', () => {
    const selectedDifficulty = difficultySelect.value;
    if (selectedDifficulty === 'custom') {
        customCitiesContainer.style.display = 'block';
        state.difficulty.custom = parseInt(customCitiesInput.value);
        totalCitiesElement.textContent = state.difficulty.custom;
    } else {
        customCitiesContainer.style.display = 'none';
        totalCitiesElement.textContent = state.difficulty[selectedDifficulty];
    }
});

customCitiesInput.addEventListener('change', () => {
    let value = parseInt(customCitiesInput.value);
    // Ensure value is between 5 and 100
    value = Math.max(5, Math.min(100, value));
    customCitiesInput.value = value;
    state.difficulty.custom = value;
    totalCitiesElement.textContent = value;
});

citySizeInput.addEventListener('input', (e) => {
    state.citySize = parseInt(e.target.value);
    citySizeValue.textContent = state.citySize;
    if (state.gameStarted) {
        drawGame();
    }
});