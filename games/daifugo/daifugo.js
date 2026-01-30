'use strict';

import { GAME_CONFIG } from './config/daifugo-config.js';
import { GameController } from './modules/game-controller.js';

/**
 * Daifugo UI Controller
 * Handles all DOM manipulation and user interactions
 */
class DaifugoUI {
    constructor() {
        this.game = null;
        
        // Cache DOM elements
        this.elements = {
            roundNumber: document.getElementById('round-number'),
            revolutionStatus: document.getElementById('revolution-status'),
            newGameBtn: document.getElementById('new-game-btn'),
            field: document.getElementById('field'),
            messageArea: document.getElementById('message-area'),
            playerHand: document.getElementById('player-hand'),
            playerStatus: document.getElementById('player-status'),
            playerArea: document.querySelector('.player-area'),
            playBtn: document.getElementById('play-btn'),
            passBtn: document.getElementById('pass-btn'),
            gameMessage: document.getElementById('game-message'),
            messageTitle: document.getElementById('message-title'),
            messageText: document.getElementById('message-text'),
            nextRoundBtn: document.getElementById('next-round-btn'),
            opponents: [
                {
                    element: document.getElementById('opponent-1'),
                    cards: document.getElementById('opponent-1-cards'),
                    status: document.getElementById('opponent-1-status')
                },
                {
                    element: document.getElementById('opponent-2'),
                    cards: document.getElementById('opponent-2-cards'),
                    status: document.getElementById('opponent-2-status')
                },
                {
                    element: document.getElementById('opponent-3'),
                    cards: document.getElementById('opponent-3-cards'),
                    status: document.getElementById('opponent-3-status')
                }
            ]
        };
        
        this.setupEventListeners();
        this.startNewGame();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.elements.playBtn.addEventListener('click', () => this.handlePlay());
        this.elements.passBtn.addEventListener('click', () => this.handlePass());
        this.elements.nextRoundBtn.addEventListener('click', () => this.handleNextRound());
    }
    
    /**
     * Start a new game
     */
    startNewGame() {
        this.hideMessage();
        this.game = new GameController(() => this.render());
        this.game.startGame();
    }
    
    /**
     * Handle play button click
     */
    handlePlay() {
        if (this.game) {
            this.game.playSelectedCards();
        }
    }
    
    /**
     * Handle pass button click
     */
    handlePass() {
        if (this.game) {
            this.game.pass();
        }
    }
    
    /**
     * Handle next round button click
     */
    handleNextRound() {
        if (this.game) {
            this.hideMessage();
            this.game.nextRound();
        }
    }
    
    /**
     * Render the entire game state
     */
    render() {
        const state = this.game.getState();
        
        this.renderRoundInfo(state);
        this.renderOpponents(state);
        this.renderField(state);
        this.renderMessage(state);
        this.renderPlayerHand(state);
        this.renderPlayerStatus(state);
        this.updateButtons(state);
        
        // Show end game message if finished
        if (state.gamePhase === 'finished') {
            this.showEndMessage(state);
        }
    }
    
    /**
     * Render round information
     */
    renderRoundInfo(state) {
        this.elements.roundNumber.textContent = state.roundNumber;
        this.elements.revolutionStatus.style.display = state.isRevolution ? 'flex' : 'none';
    }
    
    /**
     * Render opponent areas
     */
    renderOpponents(state) {
        for (let i = 0; i < 3; i++) {
            const playerIndex = i + 1; // CPU players are indices 1, 2, 3
            const player = state.players[playerIndex];
            const opponent = this.elements.opponents[i];
            
            // Update cards (show card backs)
            opponent.cards.innerHTML = '';
            if (!player.isOut) {
                const cardCount = Math.min(player.hand.length, 13);
                for (let j = 0; j < cardCount; j++) {
                    const cardBack = document.createElement('div');
                    cardBack.className = 'card-back';
                    opponent.cards.appendChild(cardBack);
                }
            }
            
            // Update status
            let statusText = '';
            if (player.isOut) {
                if (player.finishOrder !== null) {
                    const ranking = GAME_CONFIG.RANKINGS[player.finishOrder];
                    statusText = ranking || '終了';
                }
            } else if (player.ranking !== null) {
                statusText = `前回: ${GAME_CONFIG.RANKINGS[player.ranking]}`;
            }
            opponent.status.textContent = statusText;
            
            // Update current turn highlighting
            opponent.element.classList.toggle('current-turn', 
                state.currentPlayerIndex === playerIndex && !player.isOut);
            opponent.element.classList.toggle('finished', player.isOut);
        }
    }
    
    /**
     * Render the field
     */
    renderField(state) {
        this.elements.field.innerHTML = '';
        
        if (state.fieldCards && state.fieldCards.length > 0) {
            for (const card of state.fieldCards) {
                const cardEl = this.createCardElement(card, false);
                this.elements.field.appendChild(cardEl);
            }
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'field-placeholder';
            placeholder.textContent = '場にカードがありません';
            this.elements.field.appendChild(placeholder);
        }
    }
    
    /**
     * Render message
     */
    renderMessage(state) {
        this.elements.messageArea.textContent = state.message || '';
    }
    
    /**
     * Render player's hand
     */
    renderPlayerHand(state) {
        const player = state.players[0];
        this.elements.playerHand.innerHTML = '';
        
        for (const card of player.hand) {
            const cardEl = this.createCardElement(card, true);
            const isSelected = this.game.isCardSelected(card);
            cardEl.classList.toggle('selected', isSelected);
            
            cardEl.addEventListener('click', () => {
                this.game.toggleCardSelection(card);
            });
            
            this.elements.playerHand.appendChild(cardEl);
        }
        
        // Update current turn highlighting
        this.elements.playerArea.classList.toggle('current-turn',
            state.currentPlayerIndex === 0 && !player.isOut && state.gamePhase === 'playing');
    }
    
    /**
     * Render player status
     */
    renderPlayerStatus(state) {
        const player = state.players[0];
        let statusText = '';
        
        if (player.isOut) {
            if (player.finishOrder !== null) {
                const ranking = GAME_CONFIG.RANKINGS[player.finishOrder];
                statusText = ranking || '終了';
            }
        } else if (player.ranking !== null) {
            statusText = `前回: ${GAME_CONFIG.RANKINGS[player.ranking]}`;
        }
        
        this.elements.playerStatus.textContent = statusText;
    }
    
    /**
     * Update button states
     */
    updateButtons(state) {
        const isPlayerTurn = state.currentPlayerIndex === 0 && 
                            !state.players[0].isOut && 
                            state.gamePhase === 'playing';
        
        const hasSelection = state.selectedCards && state.selectedCards.length > 0;
        
        this.elements.playBtn.disabled = !isPlayerTurn || !hasSelection;
        this.elements.passBtn.disabled = !isPlayerTurn;
    }
    
    /**
     * Create a card DOM element
     */
    createCardElement(card, interactive = false) {
        const cardEl = document.createElement('div');
        
        if (card.isJoker) {
            cardEl.className = 'card joker';
            cardEl.innerHTML = '<span class="card-rank">🃏</span>';
        } else {
            const suitClass = GAME_CONFIG.SUIT_CLASSES[card.suit];
            cardEl.className = `card ${suitClass}`;
            cardEl.innerHTML = `
                <span class="card-suit">${card.suit}</span>
                <span class="card-rank">${card.rank}</span>
            `;
        }
        
        if (!interactive) {
            cardEl.style.cursor = 'default';
        }
        
        return cardEl;
    }
    
    /**
     * Show end of round message
     */
    showEndMessage(state) {
        const player = state.players[0];
        const ranking = GAME_CONFIG.RANKINGS[player.ranking];
        
        this.elements.messageTitle.textContent = GAME_CONFIG.MESSAGES.GAME_OVER;
        this.elements.messageText.textContent = `あなたは「${ranking}」になりました！`;
        this.elements.gameMessage.classList.add('visible');
    }
    
    /**
     * Hide the modal message
     */
    hideMessage() {
        this.elements.gameMessage.classList.remove('visible');
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => new DaifugoUI());
