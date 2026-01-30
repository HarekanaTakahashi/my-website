'use strict';

import { GAME_CONFIG } from '../config/daifugo-config.js';
import { CardUtils } from './card.js';

/**
 * GameRules class for validating plays and game state
 */
export class GameRules {
    constructor() {
        this.isRevolution = false;
    }
    
    /**
     * Check if a play is valid
     * @param {Card[]} cards - Cards to play
     * @param {Card[]} fieldCards - Current cards on the field
     * @returns {boolean}
     */
    isValidPlay(cards, fieldCards) {
        if (cards.length === 0) return false;
        
        // Check if all cards are the same rank
        if (!CardUtils.areSameRank(cards)) return false;
        
        // If field is empty, any valid combination is OK
        if (!fieldCards || fieldCards.length === 0) return true;
        
        // Must play same number of cards
        if (cards.length !== fieldCards.length) return false;
        
        // Must be stronger than field cards
        return this.isStronger(cards, fieldCards);
    }
    
    /**
     * Check if play cards are stronger than field cards
     */
    isStronger(playCards, fieldCards) {
        const playStrength = this.getPlayStrength(playCards);
        const fieldStrength = this.getPlayStrength(fieldCards);
        return playStrength > fieldStrength;
    }
    
    /**
     * Get the strength of a card combination
     */
    getPlayStrength(cards) {
        // For same-rank combinations, use the strength of any non-joker card
        // Joker acts as the highest card
        const nonJokers = cards.filter(c => !c.isJoker);
        if (nonJokers.length === 0) {
            // All jokers - maximum strength
            return GAME_CONFIG.NORMAL_STRENGTH['JOKER'];
        }
        return nonJokers[0].getStrength(this.isRevolution);
    }
    
    /**
     * Check if playing these cards triggers 8-giri
     */
    isEightCut(cards) {
        return CardUtils.containsEight(cards);
    }
    
    /**
     * Check if playing these cards triggers a revolution
     */
    checkRevolution(cards) {
        if (cards.length >= GAME_CONFIG.REVOLUTION_CARD_COUNT && CardUtils.areSameRank(cards)) {
            this.isRevolution = !this.isRevolution;
            return true;
        }
        return false;
    }
    
    /**
     * Check if this is a forbidden finish (反則上がり)
     */
    isForbiddenFinish(cards, remainingHandSize) {
        // Only check if this play would empty the hand
        if (remainingHandSize !== cards.length) return false;
        
        // Check for forbidden cards
        for (const card of cards) {
            if (card.isForbiddenFinish(this.isRevolution)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Reset revolution state for new game
     */
    reset() {
        this.isRevolution = false;
    }
}

/**
 * Player class representing a game player
 */
export class Player {
    constructor(id, name, isHuman = false) {
        this.id = id;
        this.name = name;
        this.isHuman = isHuman;
        this.hand = [];
        this.ranking = null;      // Previous game ranking (0-3)
        this.finishOrder = null;  // Order of finishing in current game
        this.isOut = false;       // True if player has finished or been eliminated
        this.wasDaifugo = false;  // True if player was Daifugo last game
    }
    
    /**
     * Set the player's hand
     */
    setHand(cards) {
        this.hand = cards;
    }
    
    /**
     * Remove cards from hand
     */
    removeCards(cards) {
        const cardIds = new Set(cards.map(c => c.id));
        this.hand = this.hand.filter(c => !cardIds.has(c.id));
    }
    
    /**
     * Add cards to hand
     */
    addCards(cards) {
        this.hand.push(...cards);
    }
    
    /**
     * Sort hand by strength
     */
    sortHand(isRevolution) {
        this.hand = CardUtils.sortByStrength(this.hand, isRevolution);
    }
    
    /**
     * Check if player has finished (empty hand)
     */
    hasFinished() {
        return this.hand.length === 0 && !this.isOut;
    }
    
    /**
     * Reset for new round
     */
    resetForRound() {
        this.hand = [];
        this.finishOrder = null;
        this.isOut = false;
    }
    
    /**
     * Get the strongest N cards (for card exchange)
     */
    getStrongestCards(count, isRevolution) {
        return CardUtils.findStrongestCards(this.hand, count, isRevolution);
    }
}

/**
 * CPU AI for making decisions
 */
export class CpuAI {
    /**
     * Decide which cards to play
     * @param {Player} player - The CPU player
     * @param {Card[]} fieldCards - Current field cards
     * @param {GameRules} rules - Game rules instance
     * @returns {Card[]} Cards to play, or empty array for pass
     */
    static decidePlay(player, fieldCards, rules) {
        const validPlays = CpuAI.findValidPlays(player.hand, fieldCards, rules);
        
        if (validPlays.length === 0) return [];
        
        // Strategy: play the weakest valid combination
        // Sort plays by strength
        validPlays.sort((a, b) => {
            const strengthA = rules.getPlayStrength(a);
            const strengthB = rules.getPlayStrength(b);
            return strengthA - strengthB;
        });
        
        // Check for forbidden finish
        const play = validPlays[0];
        if (rules.isForbiddenFinish(play, player.hand.length)) {
            // Try to find a non-forbidden play
            for (const p of validPlays) {
                if (!rules.isForbiddenFinish(p, player.hand.length)) {
                    return p;
                }
            }
            // All plays are forbidden - pass instead
            return [];
        }
        
        return play;
    }
    
    /**
     * Find all valid plays from a hand
     */
    static findValidPlays(hand, fieldCards, rules) {
        const validPlays = [];
        const targetCount = fieldCards && fieldCards.length > 0 ? fieldCards.length : null;
        
        // Group cards by rank
        const groups = CardUtils.groupByRank(hand);
        const jokers = groups.get('JOKER') || [];
        groups.delete('JOKER');
        
        // For each rank group, try combinations with/without jokers
        for (const [rank, cards] of groups) {
            if (targetCount === null) {
                // Can play any count from 1 to group size + jokers
                for (let count = 1; count <= cards.length + jokers.length; count++) {
                    const combos = CpuAI.getCombinations(cards, jokers, count);
                    for (const combo of combos) {
                        if (rules.isValidPlay(combo, fieldCards)) {
                            validPlays.push(combo);
                        }
                    }
                }
            } else {
                // Must match target count
                const combos = CpuAI.getCombinations(cards, jokers, targetCount);
                for (const combo of combos) {
                    if (rules.isValidPlay(combo, fieldCards)) {
                        validPlays.push(combo);
                    }
                }
            }
        }
        
        // Joker-only plays (only if field is empty or matches count)
        if (jokers.length > 0) {
            if (targetCount === null || targetCount <= jokers.length) {
                const jokerCount = targetCount || 1;
                if (jokerCount <= jokers.length) {
                    const jokerPlay = jokers.slice(0, jokerCount);
                    if (rules.isValidPlay(jokerPlay, fieldCards)) {
                        validPlays.push(jokerPlay);
                    }
                }
            }
        }
        
        return validPlays;
    }
    
    /**
     * Get combinations of cards plus jokers to reach a target count
     */
    static getCombinations(cards, jokers, targetCount) {
        const results = [];
        const maxFromCards = Math.min(cards.length, targetCount);
        const minFromCards = Math.max(0, targetCount - jokers.length);
        
        for (let cardCount = minFromCards; cardCount <= maxFromCards; cardCount++) {
            const jokerCount = targetCount - cardCount;
            if (jokerCount > jokers.length) continue;
            
            // Get all combinations of cardCount cards
            const cardCombos = CpuAI.choose(cards, cardCount);
            for (const cardCombo of cardCombos) {
                const combo = [...cardCombo, ...jokers.slice(0, jokerCount)];
                results.push(combo);
            }
        }
        
        return results;
    }
    
    /**
     * Generate all combinations of n elements from array
     */
    static choose(arr, n) {
        if (n === 0) return [[]];
        if (arr.length < n) return [];
        if (arr.length === n) return [arr.slice()];
        
        const results = [];
        for (let i = 0; i <= arr.length - n; i++) {
            const rest = CpuAI.choose(arr.slice(i + 1), n - 1);
            for (const combo of rest) {
                results.push([arr[i], ...combo]);
            }
        }
        return results;
    }
    
    /**
     * Select cards to give away during exchange (give weakest)
     */
    static selectCardsToGive(player, count, isRevolution) {
        const sorted = CardUtils.sortByStrength(player.hand, isRevolution);
        return sorted.slice(0, count);
    }
}
