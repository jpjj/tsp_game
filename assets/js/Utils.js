/**
 * Utils.js
 * Utility functions for the TSP game
 */

/**
 * Creates a DOM element object with all needed game DOM elements
 * @param {void}
 * @returns {Object} Object containing references to DOM elements
 */
export function getDomElements() {
    return {
        canvas: document.getElementById('tsp-canvas'),
        citiesVisitedElement: document.getElementById('cities-visited'),
        totalCitiesElement: document.getElementById('total-cities'),
        currentLengthElement: document.getElementById('current-length'),
        bestLengthElement: document.getElementById('best-length'),
        nnLengthElement: document.getElementById('nn-length'),
        optimalLengthElement: document.getElementById('optimal-length'),
        undoButton: document.getElementById('undo-btn'),
        resetPathButton: document.getElementById('reset-path-btn'),
        clearBestButton: document.getElementById('clear-best-btn'),
        nearestNeighborButton: document.getElementById('nearest-neighbor-btn'),
        optimalButton: document.getElementById('optimal-btn'),
        newGameButton: document.getElementById('new-game-btn'),
        difficultySelect: document.getElementById('difficulty-select'),
        customCitiesContainer: document.getElementById('custom-cities-container'),
        customCitiesInput: document.getElementById('custom-cities'),
        citySizeInput: document.getElementById('city-size'),
        citySizeValue: document.getElementById('city-size-value')
    };
}

/**
 * Checks if a value is numeric
 * @param {*} value - Value to check
 * @returns {boolean} True if the value is numeric
 */
export function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Clamps a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowable value
 * @param {number} max - Maximum allowable value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Formats a number to a specified number of decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 2) {
    return value.toFixed(decimals);
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}