/**
 * CompletionModal.js
 * Handles the tour completion modal functionality
 */

class CompletionModal {
    /**
     * Initialize the completion modal
     * @param {GameState} gameState - Reference to the game state
     * @param {TspAlgorithms} algorithms - Reference to the TSP algorithms
     * @param {EventHandlers} eventHandlers - Reference to the event handlers
     */
    constructor(gameState, algorithms, eventHandlers) {
        this.gameState = gameState;
        this.algorithms = algorithms;
        this.eventHandlers = eventHandlers;
        this.modal = document.getElementById('completion-modal');
        this.closeBtn = this.modal.querySelector('.modal-close');
        this.tryAgainBtn = document.getElementById('try-again-btn');
        this.newCitiesBtn = document.getElementById('new-cities-btn');
        this.rankingsList = document.getElementById('rankings-list');
        this.userPathLength = document.getElementById('user-path-length');
        this.completionMessage = document.getElementById('completion-message');

        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the modal
     */
    setupEventListeners() {
        // Close modal when clicking X button
        this.closeBtn.addEventListener('click', () => this.close());

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Try again button resets the path but keeps same cities
        this.tryAgainBtn.addEventListener('click', () => {
            this.close();
            this.eventHandlers.handleResetPathClick();
        });

        // New cities button starts a new game
        this.newCitiesBtn.addEventListener('click', () => {
            this.close();
            this.eventHandlers.handleNewGameClick();
        });
    }

    /**
     * Show the completion modal with tour results
     * @param {Object} result - Tour completion result object
     */
    show(result) {
        // Ensure the enhanced solution is calculated if not already
        if (result.enhancedLength === Infinity) {
            // Show calculating indicator for enhanced solution
            const enhancedLengthElement = document.getElementById('enhanced-length');
            const originalText = enhancedLengthElement.textContent;
            enhancedLengthElement.textContent = "Calculating...";

            // Use setTimeout to allow the UI to update before the calculation
            setTimeout(() => {
                this.algorithms.calculateEnhancedSolution();
                result.enhancedLength = this.gameState.calculatePathLength(this.gameState.enhancedPath);
                enhancedLengthElement.textContent = result.enhancedLength.toFixed(2);
                this.updateModalContent(result);
            }, 10);
        } else {
            this.updateModalContent(result);
        }
    }

    /**
     * Update the modal content with tour results
     * @param {Object} result - Tour completion result object
     */
    updateModalContent(result) {
        // User's path length
        this.userPathLength.textContent = result.pathLength.toFixed(2);

        // Create array of all solutions for ranking
        const solutions = [
            { name: 'You', length: result.pathLength, isUser: true },
            { name: 'Nearest Neighbor', length: result.nnLength, isUser: false },
            { name: '2-Opt Solution', length: result.optimalLength, isUser: false },
            { name: 'Enhanced Solution', length: result.enhancedLength, isUser: false }
        ];

        // Sort solutions by path length (shortest first)
        solutions.sort((a, b) => a.length - b.length);

        // Create rankings HTML
        this.rankingsList.innerHTML = '';

        solutions.forEach((solution, index) => {
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item rank-${index + 1}`;

            // Medal emoji based on rank
            let medalEmoji = '';
            if (index === 0) medalEmoji = '🥇';
            else if (index === 1) medalEmoji = '🥈';
            else if (index === 2) medalEmoji = '🥉';
            else medalEmoji = '🏅';

            const nameClass = solution.isUser ? 'you' : '';

            rankingItem.innerHTML = `
                <div class="ranking-name ${nameClass}">
                    <span class="medal">${medalEmoji}</span>
                    ${solution.name}
                </div>
                <div class="ranking-value">${solution.length.toFixed(2)}</div>
            `;

            this.rankingsList.appendChild(rankingItem);
        });

        // Determine user's rank and create appropriate message
        const userRank = solutions.findIndex(s => s.isUser) + 1;
        let message = '';

        switch (userRank) {
            case 1:
                message = "🏆 Outstanding! You found the best solution, better than all algorithms! You are ready for an even harder <a href='https://jpjj.github.io/cvrp_game/' target='_blank'>CHALLENGE</a>!";
                break;
            case 2:
                if (solutions[0].name === 'Enhanced Solution') {
                    message = "🎯 Impressive! Only the Enhanced algorithm found a better path.";
                } else {
                    message = "🎯 Amazing! You outperformed most algorithms!";
                }
                break;
            case 3:
                message = "👍 Good job! You beat the Nearest Neighbor algorithm.";
                break;
            case 4:
                message = "🔄 Keep trying! With practice, you can beat the algorithms.";
                break;
        }

        this.completionMessage.innerHTML = message;

        // Show the modal
        this.modal.style.display = 'flex';
    }

    /**
     * Close the completion modal
     */
    close() {
        this.modal.style.display = 'none';
    }
}

export default CompletionModal;