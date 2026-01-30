import { TETROMINOS } from '../config/tetris-config.js';

export class RandomGenerator {
    constructor() {
        this.bag = [];
        this.nextPieces = [];
    }
    
    generateBag() {
        const pieces = Object.keys(TETROMINOS);
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        return pieces;
    }
    
    getNextPiece() {
        if (this.bag.length === 0) {
            this.bag = this.generateBag();
        }
        return this.bag.pop();
    }
    
    fillNextQueue(count = 5) {
        while (this.nextPieces.length < count) {
            this.nextPieces.push(this.getNextPiece());
        }
    }
    
    popNext() {
        this.fillNextQueue();
        const piece = this.nextPieces.shift();
        this.fillNextQueue();
        return piece;
    }
    
    peekNext(count = 3) {
        this.fillNextQueue();
        return this.nextPieces.slice(0, count);
    }
    
    reset() {
        this.bag = [];
        this.nextPieces = [];
    }
}
