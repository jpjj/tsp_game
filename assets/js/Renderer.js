/**
 * Enhanced Renderer.js with better mobile support
 * Handles rendering the TSP game on the canvas
 */

class Renderer {
    /**
     * Initialize the renderer
     * @param {HTMLCanvasElement} canvas - The canvas element to draw on
     * @param {GameState} gameState - Reference to the game state
     */
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.canvasRatio = 0.6; // Height to width ratio
        this.touchRadius = 30; // Larger radius for touch detection
        this.isMobile = this.detectMobile();

        // For touch devices, handle both touch and click events
        if (this.isMobile) {
            this.setupTouchHandling();
        }
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
     * Set up improved touch handling for mobile devices
     */
    setupTouchHandling() {
        // Already set up in EventHandlers, but we can enhance the renderer for touch
        this.touchRadius = Math.max(this.gameState.citySize * 2, 30);
    }

    /**
     * Resize the canvas to fit the container
     */
    resizeCanvas() {
        const container = document.querySelector('.game-container');
        if (!container) return;

        // Get container width accounting for padding
        const containerStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(containerStyle.paddingLeft);
        const paddingRight = parseFloat(containerStyle.paddingRight);
        const containerWidth = container.clientWidth - paddingLeft - paddingRight;

        // Mobile-first approach - always make canvas full width of container
        this.canvas.width = containerWidth;

        // Maintain aspect ratio
        this.canvas.height = containerWidth * this.canvasRatio;

        // If we're on mobile, ensure cities are scaled appropriately
        if (this.isMobile && this.gameState.gameStarted) {
            // Ensure city size is appropriate for mobile view
            this.gameState.updateCitySize(Math.max(8, this.gameState.citySize));
        }

        // When resizing, redraw the game
        if (this.gameState.gameStarted) {
            this.drawGame();
        }

        // For debugging
        console.log(`Canvas resized: ${this.canvas.width}x${this.canvas.height}, Mobile: ${this.isMobile}`);
    }
    /**
     * Draw the game state on the canvas
     */
    drawGame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawPath();
        this.drawCities();
    }

    /**
     * Draw the current path on the canvas
     */
    drawPath() {
        if (this.gameState.path.length > 1) {
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = this.isMobile ? 4 : 3; // Thicker lines on mobile
            this.ctx.beginPath();

            const startCity = this.gameState.cities[this.gameState.path[0]];
            this.ctx.moveTo(startCity.x, startCity.y);

            for (let i = 1; i < this.gameState.path.length; i++) {
                const city = this.gameState.cities[this.gameState.path[i]];
                this.ctx.lineTo(city.x, city.y);
            }

            this.ctx.stroke();
        }
    }

    /**
     * Draw the cities on the canvas
     */
    drawCities() {
        // Adjust city size for mobile
        const citySize = this.isMobile
            ? Math.max(10, this.gameState.citySize) // Ensure cities are not too small on mobile
            : this.gameState.citySize;

        for (let i = 0; i < this.gameState.cities.length; i++) {
            const city = this.gameState.cities[i];

            // Different appearance for cities in the path
            if (this.gameState.path.includes(i)) {
                const index = this.gameState.path.indexOf(i);

                // Different color for first and last city in path
                if (index === 0 || (index === this.gameState.path.length - 1 && this.gameState.path[0] === this.gameState.path[this.gameState.path.length - 1])) {
                    this.ctx.fillStyle = '#27ae60'; // Green for start/end
                } else {
                    this.ctx.fillStyle = '#3498db'; // Blue for visited
                }
            } else {
                this.ctx.fillStyle = '#e74c3c'; // Red for unvisited
            }

            // Add glow for current city
            if (this.gameState.path.length > 0 && i === this.gameState.path[this.gameState.path.length - 1]) {
                this.ctx.shadowColor = '#f39c12';
                this.ctx.shadowBlur = this.isMobile ? 10 : 15;
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.beginPath();
            this.ctx.arc(city.x, city.y, citySize, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw city number - adjust font size for mobile
            this.ctx.fillStyle = 'white';
            const fontSize = this.isMobile
                ? Math.max(10, citySize - 2)
                : Math.max(10, this.gameState.citySize - 2);
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(i.toString(), city.x, city.y);
        }

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    /**
     * Convert canvas coordinates from mouse or touch event to game coordinates
     * @param {MouseEvent|TouchEvent} event - Mouse or touch event
     * @returns {Object} Coordinates in game space
     */
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;

        // Handle both mouse and touch events
        if (event.touches && event.touches.length > 0) {
            // Touch event
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // Mouse event
            clientX = event.clientX;
            clientY = event.clientY;
        }

        return {
            x: (clientX - rect.left) * (this.canvas.width / rect.width),
            y: (clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }
}

export default Renderer;