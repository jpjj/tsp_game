/**
 * Renderer.js
 * Handles rendering the TSP game on the canvas
 */

/**
 * Class for rendering the TSP game
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
    }

    /**
     * Resize the canvas to fit the container
     */
    resizeCanvas() {
        const container = document.querySelector('.game-container');
        if (!container) return;

        const containerWidth = container.clientWidth - 40; // Minus padding

        if (window.innerWidth <= 800) {
            this.canvas.width = containerWidth;
            this.canvas.height = containerWidth * 0.6;

            if (this.gameState.gameStarted) {
                this.drawGame();
            }
        }
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
            this.ctx.lineWidth = 3;
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
                this.ctx.shadowBlur = 15;
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.beginPath();
            this.ctx.arc(city.x, city.y, this.gameState.citySize, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw city number
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${Math.max(10, this.gameState.citySize - 2)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(i.toString(), city.x, city.y);
        }

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    /**
     * Convert canvas coordinates from mouse event to game coordinates
     * @param {MouseEvent} event - Mouse event
     * @returns {Object} Coordinates in game space
     */
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }
}

export default Renderer;