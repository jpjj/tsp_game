/**
 * Algorithms.js
 * Implementation of TSP algorithms
 */

/**
 * Class containing TSP algorithm implementations
 */
class TspAlgorithms {
    /**
     * Constructor takes a gameState reference to access city data
     * @param {GameState} gameState - Reference to the game state
     */
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Calculate nearest neighbor solution
     * @returns {Array} Array of city indices representing the path
     */
    calculateNearestNeighborSolution() {
        if (this.gameState.cities.length === 0) return [];

        const visited = new Array(this.gameState.cities.length).fill(false);
        const path = [0]; // Start with city 0
        visited[0] = true;

        while (path.length < this.gameState.cities.length) {
            const lastCity = path[path.length - 1];
            let nearestCity = -1;
            let shortestDistance = Infinity;

            for (let i = 0; i < this.gameState.cities.length; i++) {
                if (!visited[i]) {
                    const distance = this.gameState.calculateDistance(
                        this.gameState.cities[lastCity].x, this.gameState.cities[lastCity].y,
                        this.gameState.cities[i].x, this.gameState.cities[i].y
                    );

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestCity = i;
                    }
                }
            }

            if (nearestCity !== -1) {
                path.push(nearestCity);
                visited[nearestCity] = true;
            }
        }

        // Return to the starting city
        path.push(path[0]);

        this.gameState.nearestNeighborPath = [...path];
        return path;
    }

    /**
     * Calculate a better solution using 2-opt
     * @returns {Array} Array of city indices representing the improved path
     */
    calculateTwoOptSolution() {
        // Start with nearest neighbor solution if it's not calculated yet
        if (this.gameState.nearestNeighborPath.length === 0) {
            this.calculateNearestNeighborSolution();
        }

        // Copy the nearest neighbor path
        const path = [...this.gameState.nearestNeighborPath];

        // Apply 2-opt improvement
        let improvement = true;
        let iterations = 0;
        const maxIterations = Math.min(200, this.gameState.cities.length * 8); // Adjust based on city count

        while (improvement && iterations < maxIterations) {
            improvement = false;
            iterations++;

            for (let i = 1; i < path.length - 2; i++) {
                for (let j = i + 1; j < path.length - 1; j++) {
                    // Check if swapping edges (i-1,i) and (j,j+1) improves the tour
                    const a = path[i - 1];
                    const b = path[i];
                    const c = path[j];
                    const d = path[j + 1];

                    const d1 = this.gameState.calculateDistance(
                        this.gameState.cities[a].x, this.gameState.cities[a].y,
                        this.gameState.cities[b].x, this.gameState.cities[b].y
                    ) + this.gameState.calculateDistance(
                        this.gameState.cities[c].x, this.gameState.cities[c].y,
                        this.gameState.cities[d].x, this.gameState.cities[d].y
                    );

                    const d2 = this.gameState.calculateDistance(
                        this.gameState.cities[a].x, this.gameState.cities[a].y,
                        this.gameState.cities[c].x, this.gameState.cities[c].y
                    ) + this.gameState.calculateDistance(
                        this.gameState.cities[b].x, this.gameState.cities[b].y,
                        this.gameState.cities[d].x, this.gameState.cities[d].y
                    );

                    if (d2 < d1) {
                        // Reverse the path between i and j
                        const reversed = path.slice(i, j + 1).reverse();
                        path.splice(i, (j - i + 1), ...reversed);
                        improvement = true;
                        break; // Small optimization - restart outer loop after change
                    }
                }
                if (improvement) break;
            }
        }

        this.gameState.optimalPath = [...path];
        return path;
    }

    /**
     * Calculate an enhanced solution using a combination of 2-opt, city-swap, and Or-Opt
     * @returns {Array} Array of city indices representing the improved path
     */
    calculateEnhancedSolution() {
        // Start with nearest neighbor solution if it's not calculated yet
        if (this.gameState.nearestNeighborPath.length === 0) {
            this.calculateNearestNeighborSolution();
        }

        // Start with a copy of the nearest neighbor path or the 2-opt path if it exists
        let path = this.gameState.optimalPath.length > 0
            ? [...this.gameState.optimalPath]
            : [...this.gameState.nearestNeighborPath];

        // Calculate current path length for comparison
        let currentLength = this.calculatePathLength(path);

        // Set parameters for the local search
        let improvement = true;
        let iterations = 0;
        // Limit iterations based on number of cities to avoid excessive computation
        const maxIterations = Math.min(300, this.gameState.cities.length * 10);

        // For Or-Opt, define the maximum chain length to relocate
        const maxChainLength = Math.min(3, Math.floor(path.length / 5));

        // Main improvement loop
        while (improvement && iterations < maxIterations) {
            improvement = false;
            iterations++;

            // Try 2-opt moves
            let twoOptImproved = this.tryTwoOptMoves(path);
            if (twoOptImproved.improved) {
                path = twoOptImproved.path;
                improvement = true;
                continue; // If improved, restart the main loop
            }

            // Try city-swap moves
            let citySwapImproved = this.tryCitySwapMoves(path);
            if (citySwapImproved.improved) {
                path = citySwapImproved.path;
                improvement = true;
                continue; // If improved, restart the main loop
            }

            // Try Or-Opt moves for chains of length 1 to maxChainLength
            for (let chainLength = 1; chainLength <= maxChainLength; chainLength++) {
                let orOptImproved = this.tryOrOptMoves(path, chainLength);
                if (orOptImproved.improved) {
                    path = orOptImproved.path;
                    improvement = true;
                    break; // If improved, break and restart the main loop
                }
            }
        }

        // Store the enhanced path
        this.gameState.enhancedPath = [...path];

        return path;
    }

    /**
     * Try 2-opt moves on the given path
     * @param {Array} path - The current path
     * @returns {Object} Object with improved path and flag indicating if improvement was made
     */
    tryTwoOptMoves(path) {
        // Create a copy of the path to work with
        const newPath = [...path];

        // Try all possible 2-opt swaps
        for (let i = 1; i < newPath.length - 2; i++) {
            for (let j = i + 1; j < newPath.length - 1; j++) {
                const a = newPath[i - 1];
                const b = newPath[i];
                const c = newPath[j];
                const d = newPath[j + 1];

                const d1 = this.gameState.calculateDistance(
                    this.gameState.cities[a].x, this.gameState.cities[a].y,
                    this.gameState.cities[b].x, this.gameState.cities[b].y
                ) + this.gameState.calculateDistance(
                    this.gameState.cities[c].x, this.gameState.cities[c].y,
                    this.gameState.cities[d].x, this.gameState.cities[d].y
                );

                const d2 = this.gameState.calculateDistance(
                    this.gameState.cities[a].x, this.gameState.cities[a].y,
                    this.gameState.cities[c].x, this.gameState.cities[c].y
                ) + this.gameState.calculateDistance(
                    this.gameState.cities[b].x, this.gameState.cities[b].y,
                    this.gameState.cities[d].x, this.gameState.cities[d].y
                );

                if (d2 < d1) {
                    // Reverse the path between i and j
                    const reversed = newPath.slice(i, j + 1).reverse();
                    newPath.splice(i, (j - i + 1), ...reversed);
                    return { path: newPath, improved: true };
                }
            }
        }

        return { path: newPath, improved: false };
    }

    /**
     * Try city-swap moves on the given path
     * @param {Array} path - The current path
     * @returns {Object} Object with improved path and flag indicating if improvement was made
     */
    tryCitySwapMoves(path) {
        // Create a copy of the path to work with
        const newPath = [...path];
        const n = newPath.length;

        // We don't want to swap the first/last city (same city in TSP)
        // So we only consider indices 1 to n-2
        for (let i = 1; i < n - 2; i++) {
            for (let j = i + 1; j < n - 1; j++) {
                // Skip adjacent cities as swapping them is equivalent to a 2-opt move
                if (j === i + 1) continue;

                // Calculate current connections
                const prevI = newPath[i - 1];
                const currI = newPath[i];
                const nextI = newPath[i + 1];
                const prevJ = newPath[j - 1];
                const currJ = newPath[j];
                const nextJ = newPath[j + 1];

                // Current distance
                const currentDist =
                    this.gameState.calculateDistance(
                        this.gameState.cities[prevI].x, this.gameState.cities[prevI].y,
                        this.gameState.cities[currI].x, this.gameState.cities[currI].y
                    ) +
                    this.gameState.calculateDistance(
                        this.gameState.cities[currI].x, this.gameState.cities[currI].y,
                        this.gameState.cities[nextI].x, this.gameState.cities[nextI].y
                    ) +
                    this.gameState.calculateDistance(
                        this.gameState.cities[prevJ].x, this.gameState.cities[prevJ].y,
                        this.gameState.cities[currJ].x, this.gameState.cities[currJ].y
                    ) +
                    this.gameState.calculateDistance(
                        this.gameState.cities[currJ].x, this.gameState.cities[currJ].y,
                        this.gameState.cities[nextJ].x, this.gameState.cities[nextJ].y
                    );

                // New distance if we swap
                const newDist =
                    this.gameState.calculateDistance(
                        this.gameState.cities[prevI].x, this.gameState.cities[prevI].y,
                        this.gameState.cities[currJ].x, this.gameState.cities[currJ].y
                    ) +
                    this.gameState.calculateDistance(
                        this.gameState.cities[currJ].x, this.gameState.cities[currJ].y,
                        this.gameState.cities[nextI].x, this.gameState.cities[nextI].y
                    ) +
                    this.gameState.calculateDistance(
                        this.gameState.cities[prevJ].x, this.gameState.cities[prevJ].y,
                        this.gameState.cities[currI].x, this.gameState.cities[currI].y
                    ) +
                    this.gameState.calculateDistance(
                        this.gameState.cities[currI].x, this.gameState.cities[currI].y,
                        this.gameState.cities[nextJ].x, this.gameState.cities[nextJ].y
                    );

                if (newDist < currentDist) {
                    // Swap the cities
                    [newPath[i], newPath[j]] = [newPath[j], newPath[i]];
                    return { path: newPath, improved: true };
                }
            }
        }

        return { path: newPath, improved: false };
    }

    /**
     * Try Or-Opt moves on the given path
     * @param {Array} path - The current path
     * @param {number} chainLength - Length of the consecutive cities chain to relocate
     * @returns {Object} Object with improved path and flag indicating if improvement was made
     */
    tryOrOptMoves(path, chainLength) {
        // Create a copy of the path to work with
        const newPath = [...path];
        const n = newPath.length;

        // We don't want to mess with the first/last city (same city in TSP)
        // So we only consider indices 1 to n-2 for the chain start
        for (let i = 1; i <= n - 1 - chainLength; i++) {
            // Extract the chain
            const chain = newPath.slice(i, i + chainLength);
            const before = newPath[i - 1];
            const after = newPath[i + chainLength];

            // Calculate the cost of removing the chain
            const removeCost =
                this.gameState.calculateDistance(
                    this.gameState.cities[before].x, this.gameState.cities[before].y,
                    this.gameState.cities[after].x, this.gameState.cities[after].y
                ) -
                (
                    this.gameState.calculateDistance(
                        this.gameState.cities[before].x, this.gameState.cities[before].y,
                        this.gameState.cities[chain[0]].x, this.gameState.cities[chain[0]].y
                    ) +
                    this.gameState.calculateDistance(
                        this.gameState.cities[chain[chainLength - 1]].x, this.gameState.cities[chain[chainLength - 1]].y,
                        this.gameState.cities[after].x, this.gameState.cities[after].y
                    )
                );

            // Try to insert the chain at each position
            for (let j = 1; j < n - 1; j++) {
                // Skip positions within or adjacent to the chain
                if (j >= i - 1 && j <= i + chainLength) continue;

                const insertBefore = newPath[j];
                const insertAfter = newPath[j - 1];

                // Calculate the cost of inserting the chain
                const insertCost =
                    this.gameState.calculateDistance(
                        this.gameState.cities[insertAfter].x, this.gameState.cities[insertAfter].y,
                        this.gameState.cities[chain[0]].x, this.gameState.cities[chain[0]].y
                    ) +
                    this.gameState.calculateDistance(
                        this.gameState.cities[chain[chainLength - 1]].x, this.gameState.cities[chain[chainLength - 1]].y,
                        this.gameState.cities[insertBefore].x, this.gameState.cities[insertBefore].y
                    ) -
                    this.gameState.calculateDistance(
                        this.gameState.cities[insertAfter].x, this.gameState.cities[insertAfter].y,
                        this.gameState.cities[insertBefore].x, this.gameState.cities[insertBefore].y
                    );

                // If overall change is negative, we have an improvement
                if (removeCost + insertCost < -0.001) { // Small epsilon to handle floating point errors
                    // Create the new path by removing the chain and inserting it at new position
                    const tempPath = [...newPath];
                    tempPath.splice(i, chainLength); // Remove the chain

                    // Adjust j if it comes after i (since we removed elements)
                    const adjustedJ = j > i ? j - chainLength : j;

                    // Insert the chain at the new position
                    tempPath.splice(adjustedJ, 0, ...chain);

                    return { path: tempPath, improved: true };
                }
            }
        }

        return { path: newPath, improved: false };
    }

    /**
     * Calculate path length
     * @param {Array} path - Array of city indices
     * @returns {number} Total path length
     */
    calculatePathLength(path) {
        let length = 0;

        for (let i = 0; i < path.length - 1; i++) {
            const city1 = this.gameState.cities[path[i]];
            const city2 = this.gameState.cities[path[i + 1]];
            length += this.gameState.calculateDistance(city1.x, city1.y, city2.x, city2.y);
        }

        return length;
    }

    /**
     * Apply the nearest neighbor solution to the game state
     * @returns {number} The length of the nearest neighbor path
     */
    applyNearestNeighborSolution() {
        if (this.gameState.nearestNeighborPath.length === 0) {
            this.calculateNearestNeighborSolution();
        }

        this.gameState.path = [...this.gameState.nearestNeighborPath];
        const pathLength = this.gameState.calculatePathLength(this.gameState.path);

        // Update best path if this is better
        if (pathLength < this.gameState.bestPathLength) {
            this.gameState.bestPathLength = pathLength;
            this.gameState.bestPath = [...this.gameState.path];
        }

        return pathLength;
    }

    /**
     * Apply the two-opt solution to the game state
     * @returns {number} The length of the two-opt path
     */
    applyTwoOptSolution() {
        if (this.gameState.optimalPath.length === 0) {
            this.calculateTwoOptSolution();
        }

        this.gameState.path = [...this.gameState.optimalPath];
        const pathLength = this.gameState.calculatePathLength(this.gameState.path);

        // Update best path if this is better
        if (pathLength < this.gameState.bestPathLength) {
            this.gameState.bestPathLength = pathLength;
            this.gameState.bestPath = [...this.gameState.path];
        }

        return pathLength;
    }

    /**
     * Apply the enhanced solution to the game state
     * @returns {number} The length of the enhanced path
     */
    applyEnhancedSolution() {
        if (this.gameState.enhancedPath === undefined || this.gameState.enhancedPath.length === 0) {
            this.calculateEnhancedSolution();
        }

        this.gameState.path = [...this.gameState.enhancedPath];
        const pathLength = this.gameState.calculatePathLength(this.gameState.path);

        // Update best path if this is better
        if (pathLength < this.gameState.bestPathLength) {
            this.gameState.bestPathLength = pathLength;
            this.gameState.bestPath = [...this.gameState.path];
        }

        return pathLength;
    }
}

export default TspAlgorithms;