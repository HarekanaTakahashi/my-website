'use strict';

/**
 * Color generation presets for balanced gameplay
 * These patterns ensure colors are distributed evenly over time
 */

/**
 * Generates a balanced color sequence using a bag system
 * Each bag contains multiple sets of all colors, shuffled
 * This prevents long droughts of specific colors
 */
export class ColorSetGenerator {
    constructor(colors) {
        this.colors = colors;
        this.bag = [];
        this.refillBag();
    }
    
    /**
     * Refills the bag with a balanced set of colors
     * Each color appears multiple times to create variety
     */
    refillBag() {
        const setsPerBag = 3; // Each color appears 3 times per bag
        const newBag = [];
        
        for (let i = 0; i < setsPerBag; i++) {
            for (const color of this.colors) {
                newBag.push(color);
            }
        }
        
        // Shuffle the bag using Fisher-Yates algorithm
        for (let i = newBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
        }
        
        this.bag = newBag;
    }
    
    /**
     * Gets the next color from the bag
     * Automatically refills when empty
     */
    getNextColor() {
        if (this.bag.length === 0) {
            this.refillBag();
        }
        return this.bag.pop();
    }
    
    /**
     * Generates a pair of colors for a piece
     */
    generatePair() {
        return [this.getNextColor(), this.getNextColor()];
    }
}
