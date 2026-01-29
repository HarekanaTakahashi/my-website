'use strict';

// Import game configuration
import { GAME_CONFIG } from './config/luck-test-config.js';

class LuckTestGame {
    constructor() {
        this.score = 0;
        this.bestScore = this.loadBestScore();
        this.gameActive = false;
        this.correctChoice = null;
        
        // DOM elements
        this.currentScoreElement = document.getElementById('current-score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameInfoElement = document.getElementById('game-info');
        this.choicesContainer = document.getElementById('choices-container');
        this.resultContainer = document.getElementById('result-container');
        this.resultMessage = document.getElementById('result-message');
        this.leftBtn = document.getElementById('left-btn');
        this.rightBtn = document.getElementById('right-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.gameMessageElement = document.getElementById('game-message');
        this.messageTitleElement = document.getElementById('message-title');
        this.messageTextElement = document.getElementById('message-text');
        this.tryAgainBtn = document.getElementById('try-again-btn');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.startNewGame();
    }
    
    setupEventListeners() {
        this.leftBtn.addEventListener('click', () => this.handleChoice('left'));
        this.rightBtn.addEventListener('click', () => this.handleChoice('right'));
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.tryAgainBtn.addEventListener('click', () => {
            this.hideGameMessage();
            this.startNewGame();
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.handleChoice('left');
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.handleChoice('right');
            }
        });
    }
    
    startNewGame() {
        this.score = 0;
        this.gameActive = true;
        this.updateDisplay();
        this.prepareNewRound();
    }
    
    prepareNewRound() {
        // Randomly determine which choice is correct
        this.correctChoice = Math.random() < GAME_CONFIG.CORRECT_PROBABILITY ? 'left' : 'right';
        
        // Reset UI
        this.gameInfoElement.textContent = GAME_CONFIG.MESSAGES.INSTRUCTION;
        this.resultContainer.classList.remove('show');
        this.choicesContainer.style.display = 'flex';
        this.leftBtn.disabled = false;
        this.rightBtn.disabled = false;
        
        // Add fade-in animation
        this.choicesContainer.classList.remove('fade-out');
        this.choicesContainer.classList.add('fade-in');
    }
    
    async handleChoice(choice) {
        if (!this.gameActive) return;
        
        // Disable buttons during animation
        this.leftBtn.disabled = true;
        this.rightBtn.disabled = true;
        this.gameActive = false;
        
        const isCorrect = choice === this.correctChoice;
        
        // Fade out choices
        this.choicesContainer.classList.remove('fade-in');
        this.choicesContainer.classList.add('fade-out');
        
        await this.sleep(GAME_CONFIG.ANIMATION.FADE_OUT_DURATION);
        
        // Hide choices and show result
        this.choicesContainer.style.display = 'none';
        this.showResult(isCorrect);
        
        await this.sleep(GAME_CONFIG.ANIMATION.RESULT_DELAY);
        
        if (isCorrect) {
            // Correct answer - increment score and continue
            this.score++;
            this.updateScore();
            
            // Check for new best score
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.saveBestScore();
                this.updateBestScore();
            }
            
            await this.sleep(GAME_CONFIG.ANIMATION.NEXT_ROUND_DELAY);
            
            // Fade out result
            this.resultContainer.classList.add('fade-out');
            await this.sleep(GAME_CONFIG.ANIMATION.FADE_OUT_DURATION);
            
            // Start next round
            this.gameActive = true;
            this.prepareNewRound();
        } else {
            // Wrong answer - game over
            await this.sleep(GAME_CONFIG.ANIMATION.NEXT_ROUND_DELAY);
            this.showGameOver();
        }
    }
    
    showResult(isCorrect) {
        this.resultContainer.classList.remove('fade-out');
        this.resultContainer.classList.add('show', 'fade-in');
        this.resultMessage.textContent = isCorrect ? 
            GAME_CONFIG.MESSAGES.CORRECT : 
            GAME_CONFIG.MESSAGES.WRONG;
        this.resultMessage.className = 'result-message ' + (isCorrect ? 'correct' : 'wrong');
    }
    
    showGameOver() {
        this.messageTitleElement.textContent = GAME_CONFIG.MESSAGES.GAME_OVER;
        
        let message = `連続正解数: ${this.score}回`;
        if (this.score === this.bestScore && this.score > 0) {
            message += '\n🎉 新記録達成！';
        }
        
        this.messageTextElement.textContent = message;
        this.gameMessageElement.classList.add('show');
    }
    
    hideGameMessage() {
        this.gameMessageElement.classList.remove('show');
    }
    
    updateDisplay() {
        this.updateScore();
        this.updateBestScore();
    }
    
    updateScore() {
        this.currentScoreElement.textContent = this.score;
    }
    
    updateBestScore() {
        this.bestScoreElement.textContent = this.bestScore;
    }
    
    loadBestScore() {
        const stored = localStorage.getItem(GAME_CONFIG.STORAGE_KEY);
        return stored ? parseInt(stored, 10) : 0;
    }
    
    saveBestScore() {
        localStorage.setItem(GAME_CONFIG.STORAGE_KEY, this.bestScore.toString());
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LuckTestGame();
});
