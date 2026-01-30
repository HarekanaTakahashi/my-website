'use strict';

import { GAME_CONFIG } from '../config/daifugo-config.js';
import { Deck, CardUtils } from './card.js';
import { GameRules, Player, CpuAI } from './game-logic.js';

/**
 * GameController manages the overall game state and flow
 */
export class GameController {
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
        this.rules = new GameRules();
        this.players = [];
        this.currentPlayerIndex = 0;
        this.fieldCards = [];
        this.lastPlayedBy = null;
        this.passCount = 0;
        this.finishCount = 0;
        this.gamePhase = 'idle'; // idle, playing, exchange, finished
        this.roundNumber = 1;
        this.message = '';
        this.selectedCards = [];
        this.exchangeState = null;
        
        this.initPlayers();
    }
    
    /**
     * Initialize players
     */
    initPlayers() {
        this.players = GAME_CONFIG.PLAYER_NAMES.map((name, i) => 
            new Player(i, name, i === 0)
        );
    }
    
    /**
     * Start a new game
     */
    startGame() {
        this.roundNumber = 1;
        this.rules.reset();
        this.players.forEach(p => {
            p.ranking = null;
            p.wasDaifugo = false;
        });
        this.startRound();
    }
    
    /**
     * Start a new round
     */
    startRound() {
        // Reset state
        this.fieldCards = [];
        this.lastPlayedBy = null;
        this.passCount = 0;
        this.finishCount = 0;
        this.selectedCards = [];
        this.exchangeState = null;
        
        // Reset players for round
        this.players.forEach(p => p.resetForRound());
        
        // Deal cards
        const deck = new Deck();
        const hands = deck.deal(GAME_CONFIG.PLAYER_COUNT);
        this.players.forEach((player, i) => {
            player.setHand(hands[i]);
            player.sortHand(this.rules.isRevolution);
        });
        
        // Check for card exchange
        if (this.roundNumber > 1 && this.needsExchange()) {
            this.gamePhase = 'exchange';
            this.performExchange();
        } else {
            this.gamePhase = 'playing';
            this.currentPlayerIndex = this.findStartingPlayer();
            this.message = this.getCurrentPlayer().isHuman 
                ? GAME_CONFIG.MESSAGES.YOUR_TURN 
                : `${this.getCurrentPlayer().name}${GAME_CONFIG.MESSAGES.CPU_TURN}`;
            this.onUpdate();
            this.checkCpuTurn();
        }
    }
    
    /**
     * Check if card exchange is needed
     */
    needsExchange() {
        return this.players.some(p => p.ranking !== null);
    }
    
    /**
     * Perform card exchange between rankings
     */
    performExchange() {
        const byRanking = [...this.players].sort((a, b) => 
            (a.ranking ?? 99) - (b.ranking ?? 99)
        );
        
        // 大富豪(0) ↔ 大貧民(3): exchange 2 cards
        const daifugo = byRanking.find(p => p.ranking === 0);
        const daihinmin = byRanking.find(p => p.ranking === 3);
        if (daifugo && daihinmin) {
            this.exchangeCards(daifugo, daihinmin, GAME_CONFIG.EXCHANGE.DAIFUGO_DAIHINMIN);
        }
        
        // 富豪(1) ↔ 貧民(2): exchange 1 card
        const fugo = byRanking.find(p => p.ranking === 1);
        const hinmin = byRanking.find(p => p.ranking === 2);
        if (fugo && hinmin) {
            this.exchangeCards(fugo, hinmin, GAME_CONFIG.EXCHANGE.FUGO_HINMIN);
        }
        
        // Mark previous daifugo for miyako-ochi check
        if (daifugo) {
            daifugo.wasDaifugo = true;
        }
        
        // Sort hands after exchange
        this.players.forEach(p => p.sortHand(this.rules.isRevolution));
        
        // Start playing
        this.gamePhase = 'playing';
        this.currentPlayerIndex = this.findStartingPlayer();
        this.message = GAME_CONFIG.MESSAGES.CARD_EXCHANGE + '完了！ ' + 
            (this.getCurrentPlayer().isHuman 
                ? GAME_CONFIG.MESSAGES.YOUR_TURN 
                : `${this.getCurrentPlayer().name}${GAME_CONFIG.MESSAGES.CPU_TURN}`);
        this.onUpdate();
        
        setTimeout(() => this.checkCpuTurn(), GAME_CONFIG.DELAYS.MESSAGE_DISPLAY);
    }
    
    /**
     * Exchange cards between rich and poor players
     */
    exchangeCards(richPlayer, poorPlayer, count) {
        // Poor gives strongest cards
        const strongCards = poorPlayer.getStrongestCards(count, this.rules.isRevolution);
        poorPlayer.removeCards(strongCards);
        richPlayer.addCards(strongCards);
        
        // Rich gives weakest cards (CPU) or selected cards (human handled separately)
        const weakCards = CpuAI.selectCardsToGive(richPlayer, count, this.rules.isRevolution);
        richPlayer.removeCards(weakCards);
        poorPlayer.addCards(weakCards);
    }
    
    /**
     * Find the starting player (has ♦3 or lowest card)
     */
    findStartingPlayer() {
        // First player with ♦3
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].hand.some(c => c.suit === '♦' && c.rank === '3')) {
                return i;
            }
        }
        // Fallback: first active player
        return this.players.findIndex(p => !p.isOut);
    }
    
    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    /**
     * Toggle card selection (for human player)
     */
    toggleCardSelection(card) {
        if (this.gamePhase !== 'playing') return;
        if (!this.getCurrentPlayer().isHuman) return;
        
        const index = this.selectedCards.findIndex(c => c.id === card.id);
        if (index >= 0) {
            this.selectedCards.splice(index, 1);
        } else {
            // Only allow same-rank cards
            if (this.selectedCards.length > 0) {
                const firstRank = this.selectedCards[0].isJoker ? null : this.selectedCards[0].rank;
                const newRank = card.isJoker ? null : card.rank;
                if (firstRank !== null && newRank !== null && firstRank !== newRank) {
                    // Clear selection and start with new card
                    this.selectedCards = [card];
                    this.onUpdate();
                    return;
                }
            }
            this.selectedCards.push(card);
        }
        this.onUpdate();
    }
    
    /**
     * Play the selected cards (human player)
     */
    playSelectedCards() {
        if (this.gamePhase !== 'playing') return;
        if (!this.getCurrentPlayer().isHuman) return;
        if (this.selectedCards.length === 0) return;
        
        if (!this.rules.isValidPlay(this.selectedCards, this.fieldCards)) {
            this.message = 'その組み合わせは出せません';
            this.onUpdate();
            return;
        }
        
        this.playCards(this.selectedCards);
    }
    
    /**
     * Pass turn (human player)
     */
    pass() {
        if (this.gamePhase !== 'playing') return;
        if (!this.getCurrentPlayer().isHuman) return;
        
        this.handlePass();
    }
    
    /**
     * Play cards for current player
     */
    playCards(cards) {
        const player = this.getCurrentPlayer();
        
        // Check for forbidden finish
        if (this.rules.isForbiddenFinish(cards, player.hand.length)) {
            this.handleForbiddenFinish(player);
            return;
        }
        
        // Remove cards from hand
        player.removeCards(cards);
        
        // Update field
        this.fieldCards = cards;
        this.lastPlayedBy = player.id;
        this.passCount = 0;
        this.selectedCards = [];
        
        // Check for revolution
        const isRevolution = this.rules.checkRevolution(cards);
        if (isRevolution) {
            this.message = GAME_CONFIG.MESSAGES.REVOLUTION;
            this.players.forEach(p => p.sortHand(this.rules.isRevolution));
        }
        
        // Check for 8-giri
        const isEightCut = this.rules.isEightCut(cards);
        if (isEightCut) {
            this.message = GAME_CONFIG.MESSAGES.EIGHT_CUT;
        }
        
        // Check if player finished
        if (player.hand.length === 0) {
            this.handlePlayerFinish(player);
        }
        
        this.onUpdate();
        
        // Handle 8-giri
        if (isEightCut) {
            setTimeout(() => {
                this.clearField();
                // Same player continues after 8-giri
                this.checkCpuTurn();
            }, GAME_CONFIG.DELAYS.FIELD_CLEAR);
            return;
        }
        
        // Next turn
        setTimeout(() => this.nextTurn(), GAME_CONFIG.DELAYS.CARD_PLAY);
    }
    
    /**
     * Handle pass
     */
    handlePass() {
        const player = this.getCurrentPlayer();
        this.passCount++;
        this.selectedCards = [];
        
        // Count active players
        const activePlayers = this.players.filter(p => !p.isOut).length;
        
        // Check if field should be cleared (all other players passed)
        if (this.passCount >= activePlayers - 1) {
            this.message = GAME_CONFIG.MESSAGES.FIELD_CLEARED;
            this.onUpdate();
            
            setTimeout(() => {
                this.clearField();
                // Last player who played becomes current
                const lastPlayer = this.players.find(p => p.id === this.lastPlayedBy);
                if (lastPlayer && !lastPlayer.isOut) {
                    this.currentPlayerIndex = lastPlayer.id;
                }
                this.checkCpuTurn();
            }, GAME_CONFIG.DELAYS.FIELD_CLEAR);
            return;
        }
        
        this.onUpdate();
        this.nextTurn();
    }
    
    /**
     * Clear the field
     */
    clearField() {
        this.fieldCards = [];
        this.passCount = 0;
        this.message = this.getCurrentPlayer().isHuman 
            ? GAME_CONFIG.MESSAGES.YOUR_TURN 
            : `${this.getCurrentPlayer().name}${GAME_CONFIG.MESSAGES.CPU_TURN}`;
        this.onUpdate();
    }
    
    /**
     * Handle player finishing
     */
    handlePlayerFinish(player) {
        player.finishOrder = this.finishCount;
        player.isOut = true;
        this.finishCount++;
        
        // Check for miyako-ochi
        if (this.checkMiyakoOchi()) return;
        
        // Check if game is over
        if (this.finishCount >= GAME_CONFIG.PLAYER_COUNT - 1) {
            this.endRound();
        }
    }
    
    /**
     * Check for miyako-ochi (都落ち)
     */
    checkMiyakoOchi() {
        // If someone finished before the previous daifugo
        if (this.finishCount === 1) {
            const finishedPlayer = this.players.find(p => p.finishOrder === 0);
            const previousDaifugo = this.players.find(p => p.wasDaifugo);
            
            if (previousDaifugo && !previousDaifugo.isOut && 
                finishedPlayer.id !== previousDaifugo.id) {
                // Miyako-ochi! Previous daifugo becomes daihinmin
                this.message = `${previousDaifugo.name}: ${GAME_CONFIG.MESSAGES.MIYAKO_OCHI}`;
                previousDaifugo.isOut = true;
                previousDaifugo.finishOrder = GAME_CONFIG.PLAYER_COUNT - 1;
                previousDaifugo.hand = [];
                this.onUpdate();
                return true;
            }
        }
        return false;
    }
    
    /**
     * Handle forbidden finish
     */
    handleForbiddenFinish(player) {
        this.message = `${player.name}: ${GAME_CONFIG.MESSAGES.FORBIDDEN_FINISH}`;
        player.isOut = true;
        player.finishOrder = GAME_CONFIG.PLAYER_COUNT - 1;
        player.hand = [];
        this.selectedCards = [];
        this.fieldCards = [];
        this.passCount = 0;
        
        this.onUpdate();
        
        // Check if game should end
        if (this.finishCount + 1 >= GAME_CONFIG.PLAYER_COUNT - 1) {
            setTimeout(() => this.endRound(), GAME_CONFIG.DELAYS.ROUND_END);
            return;
        }
        
        setTimeout(() => this.nextTurn(), GAME_CONFIG.DELAYS.MESSAGE_DISPLAY);
    }
    
    /**
     * Move to next turn
     */
    nextTurn() {
        // Find next active player
        let nextIndex = (this.currentPlayerIndex + 1) % GAME_CONFIG.PLAYER_COUNT;
        let attempts = 0;
        
        while (this.players[nextIndex].isOut && attempts < GAME_CONFIG.PLAYER_COUNT) {
            nextIndex = (nextIndex + 1) % GAME_CONFIG.PLAYER_COUNT;
            attempts++;
        }
        
        this.currentPlayerIndex = nextIndex;
        this.message = this.getCurrentPlayer().isHuman 
            ? GAME_CONFIG.MESSAGES.YOUR_TURN 
            : `${this.getCurrentPlayer().name}${GAME_CONFIG.MESSAGES.CPU_TURN}`;
        
        this.onUpdate();
        this.checkCpuTurn();
    }
    
    /**
     * Check if it's CPU's turn and process
     */
    checkCpuTurn() {
        const player = this.getCurrentPlayer();
        if (player.isOut || player.isHuman || this.gamePhase !== 'playing') return;
        
        setTimeout(() => {
            const play = CpuAI.decidePlay(player, this.fieldCards, this.rules);
            if (play.length > 0) {
                this.playCards(play);
            } else {
                this.handlePass();
            }
        }, GAME_CONFIG.DELAYS.CPU_THINK);
    }
    
    /**
     * End the current round
     */
    endRound() {
        this.gamePhase = 'finished';
        
        // Assign rankings based on finish order
        const finished = this.players
            .filter(p => p.finishOrder !== null)
            .sort((a, b) => a.finishOrder - b.finishOrder);
        
        // Assign remaining players who didn't finish
        const notFinished = this.players.filter(p => p.finishOrder === null);
        finished.push(...notFinished);
        
        finished.forEach((player, index) => {
            player.ranking = index;
        });
        
        // Check human player result
        const humanPlayer = this.players[0];
        const humanRank = GAME_CONFIG.RANKINGS[humanPlayer.ranking];
        this.message = `${GAME_CONFIG.MESSAGES.GAME_OVER}！ あなたは「${humanRank}」です！`;
        
        this.onUpdate();
    }
    
    /**
     * Start next round
     */
    nextRound() {
        this.roundNumber++;
        this.startRound();
    }
    
    /**
     * Check if card is selected
     */
    isCardSelected(card) {
        return this.selectedCards.some(c => c.id === card.id);
    }
    
    /**
     * Get game state for rendering
     */
    getState() {
        return {
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            fieldCards: this.fieldCards,
            message: this.message,
            gamePhase: this.gamePhase,
            roundNumber: this.roundNumber,
            isRevolution: this.rules.isRevolution,
            selectedCards: this.selectedCards
        };
    }
}
