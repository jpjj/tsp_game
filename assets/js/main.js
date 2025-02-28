/**
 * main.js
 * Main entry point for the TSP game
 * 
 * This file initializes the game, creating instances of all required classes
 * and starting the game.
 */

import GameState from './GameState.js';
import Renderer from './Renderer.js';
import TspAlgorithms from './Algorithms.js';
import EventHandlers from './EventHandlers.js';
import { getDomElements } from './Utils.js';

/**
 * Initialize the game when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const domElements = getDomElements();

    // Create game state
    const gameState = new GameState();

    // Create renderer
    const renderer = new Renderer(domElements.canvas, gameState);

    // IMPORTANT FIX: Ensure canvas is properly sized before drawing any cities
    // This fixes the mobile display bug where cities aren't visible on initial load
    renderer.resizeCanvas();

    // Create algorithms
    const algorithms = new TspAlgorithms(gameState);

    // Create event handlers
    const eventHandlers = new EventHandlers(gameState, renderer, algorithms, domElements);

    // Set up event listeners
    eventHandlers.setupEventListeners();

    // Initialize first game
    const difficultyValue = domElements.difficultySelect.value;
    const customCityCount = parseInt(domElements.customCitiesInput.value || 20);

    // Wait for the canvas to be fully sized before generating cities
    setTimeout(() => {
        // Reset the game
        const numCities = gameState.resetGame(
            difficultyValue,
            customCityCount,
            domElements.canvas.width,
            domElements.canvas.height
        );

        // Update DOM elements
        domElements.totalCitiesElement.textContent = numCities;
        domElements.citiesVisitedElement.textContent = 0;
        domElements.currentLengthElement.textContent = "0";
        domElements.bestLengthElement.textContent = "N/A";

        // Disable undo button
        domElements.undoButton.disabled = true;

        // Precalculate solutions in the background for better initial loading
        setTimeout(() => {
            algorithms.calculateNearestNeighborSolution();
            algorithms.calculateTwoOptSolution();

            // Update solution lengths
            domElements.nnLengthElement.textContent =
                gameState.calculatePathLength(gameState.nearestNeighborPath).toFixed(2);
            domElements.optimalLengthElement.textContent =
                gameState.calculatePathLength(gameState.optimalPath).toFixed(2);
        }, 50);

        // Draw the initial game
        renderer.drawGame();
    }, 100); // Small delay to ensure the canvas is fully sized

    console.log('TSP Game initialized!');
});