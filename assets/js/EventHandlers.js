/**
 * EventHandlers.js
 * Manages UI event handlers for the TSP game
 */

/**
 * Class to handle game UI events
 * @exports EventHandlers
 */
class EventHandlers {
    /**
     * Initialize the event handlers
     * @param {GameState} gameState - Reference to the game state
     * @param {Renderer} renderer - Reference to the renderer
     * @param {TspAlgorithms} algorithms - Reference to the algorithms
     * @param {Object} domElements - Object containing DOM element references
     */
    constructor(gameState, renderer, algorithms, domElements) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.algorithms = algorithms;
        this.dom = domElements;

        // Bind event handlers to maintain 'this' context
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleUndoClick = this.handleUndoClick.bind(this);
        this.handleResetPathClick = this.handleResetPathClick.bind(this);
        this.handleClearBestClick = this.handleClearBestClick.bind(this);
        this.handleNearestNeighborClick = this.handleNearestNeighborClick.bind(this);
        this.handleOptimalClick = this.handleOptimalClick.bind(this);
        this.handleEnhancedClick = this.handleEnhancedClick.bind(this); // New handler for enhanced solution
        this.handleNewGameClick = this.handleNewGameClick.bind(this);
        this.handleDifficultyChange = this.handleDifficultyChange.bind(this);
        this.handleCustomCitiesChange = this.handleCustomCitiesChange.bind(this);
        this.handleCitySizeChange = this.handleCitySizeChange.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Canvas events
        this.dom.canvas.addEventListener('click', this.handleCanvasClick);

        // Button events
        this.dom.undoButton.addEventListener('click', this.handleUndoClick);
        this.dom.resetPathButton.addEventListener('click', this.handleResetPathClick);
        this.dom.clearBestButton.addEventListener('click', this.handleClearBestClick);
        this.dom.nearestNeighborButton.addEventListener('click', this.handleNearestNeighborClick);
        this.dom.optimalButton.addEventListener('click', this.handleOptimalClick);
        this.dom.enhancedButton.addEventListener('click', this.handleEnhancedClick); // New button for enhanced solution
        this.dom.newGameButton.addEventListener('click', this.handleNewGameClick);

        // Select and input events
        this.dom.difficultySelect.addEventListener('change', this.handleDifficultyChange);
        this.dom.customCitiesInput.addEventListener('change', this.handleCustomCitiesChange);
        this.dom.citySizeInput.addEventListener('input', this.handleCitySizeChange);

        // Window events
        window.addEventListener('resize', this.handleWindowResize);
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        this.dom.canvas.removeEventListener('click', this.handleCanvasClick);
        this.dom.undoButton.removeEventListener('click', this.handleUndoClick);
        this.dom.resetPathButton.removeEventListener('click', this.handleResetPathClick);
        this.dom.clearBestButton.removeEventListener('click', this.handleClearBestClick);
        this.dom.nearestNeighborButton.removeEventListener('click', this.handleNearestNeighborClick);
        this.dom.optimalButton.removeEventListener('click', this.handleOptimalClick);
        this.dom.enhancedButton.removeEventListener('click', this.handleEnhancedClick);
        this.dom.newGameButton.removeEventListener('click', this.handleNewGameClick);
        this.dom.difficultySelect.removeEventListener('change', this.handleDifficultyChange);
        this.dom.customCitiesInput.removeEventListener('change', this.handleCustomCitiesChange);
        this.dom.citySizeInput.removeEventListener('input', this.handleCitySizeChange);
        window.removeEventListener('resize', this.handleWindowResize);
    }

    /**
     * Handle canvas click event
     * @param {MouseEvent} event - The click event
     */
    handleCanvasClick(event) {
        if (!this.gameState.gameStarted) return;

        const coords = this.renderer.getCanvasCoordinates(event);
        const result = this.gameState.handleCityClick(coords.x, coords.y);

        if (result) {
            if (result.action === 'add-city') {
                // Update cities visited count
                this.dom.citiesVisitedElement.textContent = this.gameState.path.length;

                // Update current path length
                this.dom.currentLengthElement.textContent = result.pathLength.toFixed(2);

                // Enable undo button
                this.dom.undoButton.disabled = false;
            } else if (result.action === 'complete-tour') {
                // Update UI
                this.dom.citiesVisitedElement.textContent = this.gameState.path.length - 1; // -1 because last city is repeated
                this.dom.currentLengthElement.textContent = result.pathLength.toFixed(2);

                // Update best path if needed
                if (result.newBest) {
                    this.dom.bestLengthElement.textContent = this.gameState.bestPathLength.toFixed(2);
                }

                // Show completion message
                let message = `Tour completed! Your path length: ${result.pathLength.toFixed(2)}\n`;
                message += `Nearest Neighbor: ${result.nnLength.toFixed(2)}\n`;
                message += `2-Opt Solution: ${result.optimalLength.toFixed(2)}\n`;

                // If enhanced solution is calculated, include it in the message
                if (result.enhancedLength !== Infinity) {
                    message += `Enhanced Solution: ${result.enhancedLength.toFixed(2)}\n\n`;
                } else {
                    message += '\n';
                }

                if (result.enhancedLength !== Infinity && result.pathLength <= result.enhancedLength) {
                    message += "Outstanding! You beat or matched the Enhanced algorithm!";
                } else if (result.pathLength <= result.optimalLength) {
                    message += "Impressive! You beat or matched the 2-Opt algorithm!";
                } else if (result.pathLength <= result.nnLength) {
                    message += "Great job! You beat the Nearest Neighbor algorithm!";
                } else {
                    message += "Keep trying! Can you beat the algorithms?";
                }

                setTimeout(() => {
                    alert(message);
                }, 100);
            }

            // Redraw the game
            this.renderer.drawGame();
        }
    }

    /**
     * Handle undo button click
     */
    handleUndoClick() {
        const result = this.gameState.undoLastCity();

        this.dom.citiesVisitedElement.textContent = this.gameState.path.length;

        if (result.pathLength > 0) {
            this.dom.currentLengthElement.textContent = result.pathLength.toFixed(2);
        } else {
            this.dom.currentLengthElement.textContent = "0";
        }

        this.dom.undoButton.disabled = result.isEmpty;
        this.renderer.drawGame();
    }

    /**
     * Handle reset path button click
     */
    handleResetPathClick() {
        this.gameState.resetPath();
        this.dom.citiesVisitedElement.textContent = 0;
        this.dom.currentLengthElement.textContent = "0";
        this.dom.undoButton.disabled = true;
        this.renderer.drawGame();
    }

    /**
     * Handle clear best path button click
     */
    handleClearBestClick() {
        this.gameState.clearBestPath();
        this.dom.bestLengthElement.textContent = "N/A";
    }

    /**
     * Handle nearest neighbor button click
     */
    handleNearestNeighborClick() {
        this.gameState.resetPath();

        const pathLength = this.algorithms.applyNearestNeighborSolution();

        // Update UI
        this.dom.citiesVisitedElement.textContent = this.gameState.path.length - 1; // -1 because last city is repeated
        this.dom.currentLengthElement.textContent = pathLength.toFixed(2);

        // Update best path display if needed
        if (pathLength < this.gameState.bestPathLength) {
            this.dom.bestLengthElement.textContent = pathLength.toFixed(2);
        }

        // Enable undo button
        this.dom.undoButton.disabled = false;

        this.renderer.drawGame();
    }

    /**
     * Handle optimal button click
     */
    handleOptimalClick() {
        this.gameState.resetPath();

        const pathLength = this.algorithms.applyTwoOptSolution();

        // Update UI
        this.dom.citiesVisitedElement.textContent = this.gameState.path.length - 1; // -1 because last city is repeated
        this.dom.currentLengthElement.textContent = pathLength.toFixed(2);

        // Update best path display
        this.dom.bestLengthElement.textContent = pathLength.toFixed(2);

        // Enable undo button
        this.dom.undoButton.disabled = false;

        this.renderer.drawGame();
    }

    /**
     * Handle enhanced button click
     */
    handleEnhancedClick() {
        // Show calculating indicator on the button
        const originalText = this.dom.enhancedButton.textContent;
        this.dom.enhancedButton.textContent = "Calculating...";
        this.dom.enhancedButton.disabled = true;

        // Use setTimeout to allow the UI to update before the intensive calculation
        setTimeout(() => {
            this.gameState.resetPath();

            // Apply the enhanced solution
            const pathLength = this.algorithms.applyEnhancedSolution();

            // Update UI
            this.dom.citiesVisitedElement.textContent = this.gameState.path.length - 1; // -1 because last city is repeated
            this.dom.currentLengthElement.textContent = pathLength.toFixed(2);
            this.dom.enhancedLengthElement.textContent = pathLength.toFixed(2);

            // Update best path display
            this.dom.bestLengthElement.textContent = pathLength.toFixed(2);

            // Enable undo button
            this.dom.undoButton.disabled = false;

            // Reset button text and state
            this.dom.enhancedButton.textContent = originalText;
            this.dom.enhancedButton.disabled = false;

            this.renderer.drawGame();
        }, 10); // Short delay to allow UI update
    }

    /**
     * Handle new game button click
     */
    handleNewGameClick() {
        const difficultyValue = this.dom.difficultySelect.value;
        const customCityCount = parseInt(this.dom.customCitiesInput.value);

        const numCities = this.gameState.resetGame(
            difficultyValue,
            customCityCount,
            this.dom.canvas.width,
            this.dom.canvas.height
        );

        // Update DOM elements
        this.dom.totalCitiesElement.textContent = numCities;
        this.dom.citiesVisitedElement.textContent = 0;
        this.dom.currentLengthElement.textContent = "0";

        if (this.gameState.bestPathLength !== Infinity) {
            this.dom.bestLengthElement.textContent = this.gameState.bestPathLength.toFixed(2);
        } else {
            this.dom.bestLengthElement.textContent = "N/A";
        }

        // Disable undo button
        this.dom.undoButton.disabled = true;

        // Precalculate solutions
        this.algorithms.calculateNearestNeighborSolution();
        this.algorithms.calculateTwoOptSolution();

        // Update solution lengths
        this.dom.nnLengthElement.textContent =
            this.gameState.calculatePathLength(this.gameState.nearestNeighborPath).toFixed(2);
        this.dom.optimalLengthElement.textContent =
            this.gameState.calculatePathLength(this.gameState.optimalPath).toFixed(2);
        this.dom.enhancedLengthElement.textContent = "N/A"; // Reset enhanced length

        this.renderer.drawGame();
    }

    /**
     * Handle difficulty selection change
     */
    handleDifficultyChange() {
        const selectedDifficulty = this.dom.difficultySelect.value;
        if (selectedDifficulty === 'custom') {
            this.dom.customCitiesContainer.style.display = 'block';
            this.gameState.difficulty.custom = parseInt(this.dom.customCitiesInput.value);
            this.dom.totalCitiesElement.textContent = this.gameState.difficulty.custom;
        } else {
            this.dom.customCitiesContainer.style.display = 'none';
            this.dom.totalCitiesElement.textContent = this.gameState.difficulty[selectedDifficulty];
        }
    }

    /**
     * Handle custom cities input change
     */
    handleCustomCitiesChange() {
        let value = parseInt(this.dom.customCitiesInput.value);
        // Ensure value is between 5 and 100
        value = Math.max(5, Math.min(100, value));
        this.dom.customCitiesInput.value = value;
        this.gameState.difficulty.custom = value;
        this.dom.totalCitiesElement.textContent = value;
    }

    /**
     * Handle city size slider change
     * @param {Event} e - Input event
     */
    handleCitySizeChange(e) {
        const newSize = parseInt(e.target.value);
        this.gameState.updateCitySize(newSize);
        this.dom.citySizeValue.textContent = newSize;
        if (this.gameState.gameStarted) {
            this.renderer.drawGame();
        }
    }

    /**
     * Handle window resize event
     */
    handleWindowResize() {
        this.renderer.resizeCanvas();
    }
}

export default EventHandlers;