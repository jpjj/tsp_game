/**
 * EventHandlers.js
 * Updated with improved touch support for mobile devices
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
        this.isMobile = this.detectMobile();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoved = false;
        this.clickDelay = 300; // ms to wait to distinguish between tap and scroll

        // Bind event handlers to maintain 'this' context
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleCanvasTouchStart = this.handleCanvasTouchStart.bind(this);
        this.handleCanvasTouchMove = this.handleCanvasTouchMove.bind(this);
        this.handleCanvasTouchEnd = this.handleCanvasTouchEnd.bind(this);
        this.handleUndoClick = this.handleUndoClick.bind(this);
        this.handleResetPathClick = this.handleResetPathClick.bind(this);
        this.handleClearBestClick = this.handleClearBestClick.bind(this);
        this.handleNearestNeighborClick = this.handleNearestNeighborClick.bind(this);
        this.handleOptimalClick = this.handleOptimalClick.bind(this);
        this.handleEnhancedClick = this.handleEnhancedClick.bind(this);
        this.handleNewGameClick = this.handleNewGameClick.bind(this);
        this.handleDifficultyChange = this.handleDifficultyChange.bind(this);
        this.handleCustomCitiesChange = this.handleCustomCitiesChange.bind(this);
        this.handleCitySizeChange = this.handleCitySizeChange.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
    }

    /**
     * Detect if the device is mobile
     * @returns {boolean} True if the device is likely mobile
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth <= 768;
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Canvas events - different handling for mobile vs desktop
        if (this.isMobile) {
            this.dom.canvas.addEventListener('touchstart', this.handleCanvasTouchStart, { passive: false });
            this.dom.canvas.addEventListener('touchmove', this.handleCanvasTouchMove, { passive: true });
            this.dom.canvas.addEventListener('touchend', this.handleCanvasTouchEnd);
        } else {
            this.dom.canvas.addEventListener('click', this.handleCanvasClick);
        }

        // Button events - add touch handling for mobile
        this.dom.undoButton.addEventListener('click', this.handleUndoClick);
        this.dom.resetPathButton.addEventListener('click', this.handleResetPathClick);
        this.dom.clearBestButton.addEventListener('click', this.handleClearBestClick);
        this.dom.nearestNeighborButton.addEventListener('click', this.handleNearestNeighborClick);
        this.dom.optimalButton.addEventListener('click', this.handleOptimalClick);
        this.dom.enhancedButton.addEventListener('click', this.handleEnhancedClick);
        this.dom.newGameButton.addEventListener('click', this.handleNewGameClick);

        // Select and input events
        this.dom.difficultySelect.addEventListener('change', this.handleDifficultyChange);
        this.dom.customCitiesInput.addEventListener('change', this.handleCustomCitiesChange);
        this.dom.citySizeInput.addEventListener('input', this.handleCitySizeChange);

        // Window events
        window.addEventListener('resize', this.handleWindowResize);

        // On mobile, make city size larger by default for better touch targets
        if (this.isMobile && this.gameState.citySize < 10) {
            this.gameState.updateCitySize(10);
            this.dom.citySizeInput.value = 10;
            this.dom.citySizeValue.textContent = 10;
        }
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        if (this.isMobile) {
            this.dom.canvas.removeEventListener('touchstart', this.handleCanvasTouchStart);
            this.dom.canvas.removeEventListener('touchmove', this.handleCanvasTouchMove);
            this.dom.canvas.removeEventListener('touchend', this.handleCanvasTouchEnd);
        } else {
            this.dom.canvas.removeEventListener('click', this.handleCanvasClick);
        }

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
     * Handle canvas touchstart event
     * @param {TouchEvent} event - The touchstart event
     */
    handleCanvasTouchStart(event) {
        // Prevent default to avoid page scrolling when interacting with the canvas
        if (event.cancelable) {
            event.preventDefault();
        }

        if (!this.gameState.gameStarted || event.touches.length !== 1) return;

        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchMoved = false;
    }

    /**
     * Handle canvas touchmove event
     * @param {TouchEvent} event - The touchmove event
     */
    handleCanvasTouchMove(event) {
        if (!this.gameState.gameStarted || event.touches.length !== 1) return;

        const touch = event.touches[0];
        const moveThreshold = 10; // pixels

        // Check if touch has moved significantly
        if (Math.abs(touch.clientX - this.touchStartX) > moveThreshold ||
            Math.abs(touch.clientY - this.touchStartY) > moveThreshold) {
            this.touchMoved = true;
        }
    }

    /**
     * Handle canvas touchend event
     * @param {TouchEvent} event - The touchend event
     */
    handleCanvasTouchEnd(event) {
        if (!this.gameState.gameStarted) return;

        // Only handle the touch if it wasn't a scroll attempt
        if (!this.touchMoved) {
            // Create a synthetic event to pass to the click handler
            const syntheticEvent = {
                clientX: this.touchStartX,
                clientY: this.touchStartY
            };

            // Use a small delay to ensure it wasn't the start of a scroll
            setTimeout(() => {
                this.handleCanvasClick(syntheticEvent);
            }, 10);
        }
    }

    /**
     * Handle canvas click event
     * @param {MouseEvent|Object} event - The click event or synthetic event from touch
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

                // Show completion message - use a more mobile-friendly approach if on mobile
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
     * Handle new game button click with improved mobile performance
     */
    handleNewGameClick() {
        const difficultyValue = this.dom.difficultySelect.value;
        const customCityCount = parseInt(this.dom.customCitiesInput.value);

        // For mobile, limit the maximum number of cities to prevent performance issues
        let adjustedCustomCityCount = customCityCount;
        if (this.isMobile && customCityCount > 50) {
            adjustedCustomCityCount = 50;
            this.dom.customCitiesInput.value = 50;
            alert("On mobile devices, the maximum number of cities is limited to 50 for performance reasons.");
        }

        // Show loading indicator
        this.showLoadingIndicator();

        // Use setTimeout to allow the UI to update before intensive operations
        setTimeout(() => {
            try {
                const numCities = this.gameState.resetGame(
                    difficultyValue,
                    adjustedCustomCityCount,
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

                // Use another setTimeout to precalculate solutions without blocking UI
                this.calculateSolutionsAsync();
            } catch (error) {
                console.error("Error initializing game:", error);
                alert("There was a problem starting the game. Please try with fewer cities.");
            } finally {
                this.hideLoadingIndicator();
                this.renderer.drawGame();
            }
        }, 50);
    }

    /**
     * Calculate algorithm solutions asynchronously in chunks
     */
    calculateSolutionsAsync() {
        // First calculate nearest neighbor (usually faster)
        setTimeout(() => {
            try {
                this.algorithms.calculateNearestNeighborSolution();
                this.dom.nnLengthElement.textContent =
                    this.gameState.calculatePathLength(this.gameState.nearestNeighborPath).toFixed(2);

                // Then calculate 2-opt solution
                setTimeout(() => {
                    try {
                        this.algorithms.calculateTwoOptSolution();
                        this.dom.optimalLengthElement.textContent =
                            this.gameState.calculatePathLength(this.gameState.optimalPath).toFixed(2);
                        this.dom.enhancedLengthElement.textContent = "N/A"; // Reset enhanced length
                    } catch (error) {
                        console.error("Error calculating 2-opt solution:", error);
                        this.dom.optimalLengthElement.textContent = "Error";
                    }
                }, 50);
            } catch (error) {
                console.error("Error calculating nearest neighbor solution:", error);
                this.dom.nnLengthElement.textContent = "Error";
            }
        }, 50);
    }

    /**
     * Show loading indicator while game initializes
     */
    showLoadingIndicator() {
        // Create loading indicator if it doesn't exist
        if (!this.loadingIndicator) {
            this.loadingIndicator = document.createElement('div');
            this.loadingIndicator.className = 'loading-indicator';
            this.loadingIndicator.textContent = 'Generating cities...';
            this.loadingIndicator.style.position = 'absolute';
            this.loadingIndicator.style.top = '50%';
            this.loadingIndicator.style.left = '50%';
            this.loadingIndicator.style.transform = 'translate(-50%, -50%)';
            this.loadingIndicator.style.padding = '1rem 2rem';
            this.loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.loadingIndicator.style.color = 'white';
            this.loadingIndicator.style.borderRadius = 'var(--border-radius)';
            this.loadingIndicator.style.zIndex = '100';
        }

        // Add to DOM
        const canvasContainer = this.dom.canvas.parentElement;
        canvasContainer.style.position = 'relative';
        canvasContainer.appendChild(this.loadingIndicator);

        // Disable buttons during loading
        this.dom.newGameButton.disabled = true;
        this.dom.nearestNeighborButton.disabled = true;
        this.dom.optimalButton.disabled = true;
        this.dom.enhancedButton.disabled = true;
    }

    /**
     * Hide loading indicator when finished
     */
    hideLoadingIndicator() {
        if (this.loadingIndicator && this.loadingIndicator.parentElement) {
            this.loadingIndicator.parentElement.removeChild(this.loadingIndicator);
        }

        // Re-enable buttons
        this.dom.newGameButton.disabled = false;
        this.dom.nearestNeighborButton.disabled = false;
        this.dom.optimalButton.disabled = false;
        this.dom.enhancedButton.disabled = false;
    }

    /**
     * Handle difficulty selection change
     */
    handleDifficultyChange() {
        const selectedDifficulty = this.dom.difficultySelect.value;
        if (selectedDifficulty === 'custom') {
            this.dom.customCitiesContainer.style.display = 'flex';
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

        // For mobile, enforce a lower maximum
        const maxCities = this.isMobile ? 50 : 100;

        // Ensure value is between 5 and maxCities
        value = Math.max(5, Math.min(maxCities, value));
        this.dom.customCitiesInput.value = value;
        this.gameState.difficulty.custom = value;
        this.dom.totalCitiesElement.textContent = value;
    }

    /**
     * Handle city size slider change
     * @param {Event} e - Input event
     */
    handleCitySizeChange(e) {
        // For mobile, enforce a minimum city size for better touch targets
        const minSize = this.isMobile ? 8 : 4;
        const newSize = Math.max(minSize, parseInt(e.target.value));
        this.gameState.updateCitySize(newSize);
        this.dom.citySizeValue.textContent = newSize;
        this.dom.citySizeInput.value = newSize;
        if (this.gameState.gameStarted) {
            this.renderer.drawGame();
        }
    }

    /**
     * Handle window resize event
     */
    handleWindowResize() {
        // Check if mobile status has changed
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();

        // If mobile status changed, we need to update event listeners
        if (wasMobile !== this.isMobile) {
            this.removeEventListeners();
            this.setupEventListeners();
        }

        this.renderer.resizeCanvas();
    }
}

export default EventHandlers;