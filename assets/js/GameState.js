/**
 * GameState.js
 * Manages the state of the TSP game
 */

/**
 * Game state object and methods
 */
class GameState {
    /**
     * Initialize the game state
     */
    constructor() {
        this.cities = [];
        this.path = [];
        this.optimalPath = [];
        this.nearestNeighborPath = [];
        this.enhancedPath = []; // Added for the enhanced algorithm
        this.bestPathLength = Infinity;
        this.bestPath = [];
        this.citySize = 8;
        this.gameStarted = false;
        this.difficulty = {
            easy: 10,
            medium: 15,
            hard: 25,
            expert: 40,
            custom: 20
        };
    }

    /**
     * Reset the game state for a new game
     * @param {string} difficultyLevel - The selected difficulty level
     * @param {number} customCityCount - Custom city count (if applicable)
     * @param {number} canvasWidth - Canvas width for city placement
     * @param {number} canvasHeight - Canvas height for city placement
     */
    resetGame(difficultyLevel, customCityCount, canvasWidth, canvasHeight) {
        this.gameStarted = false;
        this.cities = [];
        this.path = [];
        this.optimalPath = [];
        this.nearestNeighborPath = [];
        this.enhancedPath = []; // Reset enhanced path

        // Keep best path between games if not cleared

        let numCities;
        if (difficultyLevel === 'custom') {
            numCities = customCityCount;
            this.difficulty.custom = numCities;
        } else {
            numCities = this.difficulty[difficultyLevel];
        }

        // Generate random cities
        this.generateCities(numCities, canvasWidth, canvasHeight);

        this.gameStarted = true;
        return numCities;
    }

    /**
     * Generate random cities for the game
     * @param {number} numCities - Number of cities to generate
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    generateCities(numCities, canvasWidth, canvasHeight) {
        for (let i = 0; i < numCities; i++) {
            const margin = Math.max(30, this.citySize * 2);
            const x = Math.random() * (canvasWidth - 2 * margin) + margin;
            const y = Math.random() * (canvasHeight - 2 * margin) + margin;

            // Ensure cities aren't too close together
            let tooClose = false;
            for (const city of this.cities) {
                const distance = this.calculateDistance(x, y, city.x, city.y);
                if (distance < this.citySize * 3) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                this.cities.push({ x, y, id: i });
            } else {
                // Try again for this city
                i--;
            }
        }
    }

    /**
     * Add a city to the current path
     * @param {number} cityId - The ID of the city to add
     * @returns {number} The current path length if more than 1 city in path, otherwise 0
     */
    addCityToPath(cityId) {
        this.path.push(cityId);

        // Calculate and return current path length
        if (this.path.length > 1) {
            return this.calculatePathLength(this.path);
        }
        return 0;
    }

    /**
     * Remove the last city from the path
     * @returns {Object} Object containing path length and whether path is empty
     */
    undoLastCity() {
        if (this.path.length > 0) {
            this.path.pop();

            let pathLength = 0;
            if (this.path.length > 1) {
                pathLength = this.calculatePathLength(this.path);
            }

            return {
                pathLength: pathLength,
                isEmpty: this.path.length === 0
            };
        }

        return {
            pathLength: 0,
            isEmpty: true
        };
    }

    /**
     * Reset the current path
     */
    resetPath() {
        this.path = [];
    }

    /**
     * Clear the best path
     */
    clearBestPath() {
        this.bestPathLength = Infinity;
        this.bestPath = [];
    }

    /**
     * Check if a city was clicked and handle the interaction
     * @param {number} x - X coordinate of click
     * @param {number} y - Y coordinate of click
     * @returns {Object|null} Result of the click action or null if no city clicked
     */
    handleCityClick(x, y) {
        // Find if a city was clicked
        for (const city of this.cities) {
            const dx = city.x - x;
            const dy = city.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.citySize + 5) {
                // Check if clicking on the first city to complete the tour
                if (this.path.length === this.cities.length - 1 && !this.path.includes(city.id)) {
                    // Add the clicked city
                    this.addCityToPath(city.id);
                    // Add the first city again to complete the tour
                    this.addCityToPath(this.path[0]);

                    // Check if this is the best path so far
                    const pathLength = this.calculatePathLength(this.path);
                    let newBest = false;

                    if (pathLength < this.bestPathLength) {
                        this.bestPathLength = pathLength;
                        this.bestPath = [...this.path];
                        newBest = true;
                    }

                    return {
                        action: 'complete-tour',
                        pathLength: pathLength,
                        newBest: newBest,
                        nnLength: this.calculatePathLength(this.nearestNeighborPath),
                        optimalLength: this.calculatePathLength(this.optimalPath),
                        enhancedLength: this.enhancedPath.length > 0 ? this.calculatePathLength(this.enhancedPath) : Infinity
                    };
                }
                // Check if the city is not already in the path (except for completing the tour)
                else if (!this.path.includes(city.id)) {
                    const pathLength = this.addCityToPath(city.id);
                    return {
                        action: 'add-city',
                        pathLength: pathLength
                    };
                }

                return {
                    action: 'already-visited'
                };
            }
        }

        return null; // No city clicked
    }

    /**
     * Calculate distance between two points
     * @param {number} x1 - X coordinate of first point
     * @param {number} y1 - Y coordinate of first point
     * @param {number} x2 - X coordinate of second point
     * @param {number} y2 - Y coordinate of second point
     * @returns {number} Distance between points
     */
    calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate total path length
     * @param {Array} path - Array of city IDs representing the path
     * @returns {number} Total path length
     */
    calculatePathLength(path) {
        if (!path || path.length <= 1) return 0;

        let length = 0;

        for (let i = 0; i < path.length - 1; i++) {
            const city1 = this.cities[path[i]];
            const city2 = this.cities[path[i + 1]];
            length += this.calculateDistance(city1.x, city1.y, city2.x, city2.y);
        }

        return length;
    }

    /**
     * Updates the city size
     * @param {number} size - New city size
     */
    updateCitySize(size) {
        this.citySize = size;
    }
}

// Export the GameState class
export default GameState;