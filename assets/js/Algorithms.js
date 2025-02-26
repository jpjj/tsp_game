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
}

export default TspAlgorithms;