'use strict';

import { GAME_CONFIG } from '../config/daifugo-config.js';

/**
 * Card class representing a playing card
 */
export class Card {
    constructor(suit, rank, isJoker = false) {
        this.suit = suit;
        this.rank = rank;
        this.isJoker = isJoker;
        this.id = isJoker ? 'joker' : `${suit}-${rank}`;
    }
    
    /**
     * Get the strength of the card based on current game state
     */
    getStrength(isRevolution) {
        if (this.isJoker) {
            return GAME_CONFIG.NORMAL_STRENGTH['JOKER'];
        }
        return isRevolution 
            ? GAME_CONFIG.REVOLUTION_STRENGTH[this.rank]
            : GAME_CONFIG.NORMAL_STRENGTH[this.rank];
    }
    
    /**
     * Check if this card is the 8 (for 8-giri)
     */
    isEight() {
        return this.rank === GAME_CONFIG.EIGHT_CUT_RANK;
    }
    
    /**
     * Get display text for the card
     */
    getDisplayText() {
        if (this.isJoker) return '🃏';
        return `${this.suit}${this.rank}`;
    }
    
    /**
     * Check if this card is a forbidden finish card
     */
    isForbiddenFinish(isRevolution) {
        if (this.isJoker) return true;
        if (this.rank === GAME_CONFIG.EIGHT_CUT_RANK) return true;
        if (isRevolution) {
            return this.rank === '3';
        }
        return this.rank === '2';
    }
}

/**
 * Deck class for managing the card deck
 */
export class Deck {
    constructor() {
        this.cards = [];
        this.createDeck();
    }
    
    /**
     * Create a standard 53-card deck (52 + 1 Joker)
     */
    createDeck() {
        this.cards = [];
        
        // Add regular cards
        for (const suit of GAME_CONFIG.SUITS) {
            for (const rank of GAME_CONFIG.RANKS) {
                this.cards.push(new Card(suit, rank, false));
            }
        }
        
        // Add one Joker
        this.cards.push(new Card(null, null, true));
    }
    
    /**
     * Shuffle the deck using Fisher-Yates algorithm
     */
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    /**
     * Deal cards to players
     * @param {number} playerCount - Number of players
     * @returns {Card[][]} Array of hands for each player
     */
    deal(playerCount) {
        this.shuffle();
        const hands = Array.from({ length: playerCount }, () => []);
        
        this.cards.forEach((card, index) => {
            hands[index % playerCount].push(card);
        });
        
        return hands;
    }
}

/**
 * Utility functions for card operations
 */
export const CardUtils = {
    /**
     * Sort cards by strength
     */
    sortByStrength(cards, isRevolution) {
        return [...cards].sort((a, b) => a.getStrength(isRevolution) - b.getStrength(isRevolution));
    },
    
    /**
     * Group cards by rank
     */
    groupByRank(cards) {
        const groups = new Map();
        for (const card of cards) {
            const key = card.isJoker ? 'JOKER' : card.rank;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(card);
        }
        return groups;
    },
    
    /**
     * Check if cards are all the same rank (or include joker as wild)
     */
    areSameRank(cards) {
        const nonJokers = cards.filter(c => !c.isJoker);
        if (nonJokers.length === 0) return true;
        const firstRank = nonJokers[0].rank;
        return nonJokers.every(c => c.rank === firstRank);
    },
    
    /**
     * Get the effective rank of a card set (for comparison)
     */
    getEffectiveRank(cards) {
        const nonJokers = cards.filter(c => !c.isJoker);
        if (nonJokers.length === 0) return null;
        return nonJokers[0].rank;
    },
    
    /**
     * Find the strongest cards in a hand
     */
    findStrongestCards(cards, count, isRevolution) {
        const sorted = CardUtils.sortByStrength(cards, isRevolution);
        return sorted.slice(-count);
    },
    
    /**
     * Check if playing these cards would trigger a revolution
     */
    triggersRevolution(cards) {
        if (cards.length < GAME_CONFIG.REVOLUTION_CARD_COUNT) return false;
        return CardUtils.areSameRank(cards);
    },
    
    /**
     * Check if cards contain an 8 (for 8-giri)
     */
    containsEight(cards) {
        return cards.some(c => c.isEight());
    }
};
