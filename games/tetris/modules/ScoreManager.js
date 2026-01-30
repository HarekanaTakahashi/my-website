import { GAME_CONFIG, MESSAGES } from '../config/tetris-config.js';

export class ScoreManager {
    constructor() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.bestScore = parseInt(localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.BEST_SCORE) || '0');
        this.lastAction = '';
    }
    
    reset() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.lastAction = '';
    }
    
    addLines(clearedLines) {
        this.lines += clearedLines;
        this.level = Math.floor(this.lines / 10) + 1;
    }
    
    addScore(clearedLines, tSpin) {
        let points = 0;
        let actionText = '';
        
        if (tSpin.isTSpin) {
            if (tSpin.isMini) {
                points = GAME_CONFIG.SCORES.T_SPIN_MINI;
                actionText = MESSAGES.T_SPIN_MINI;
            } else if (clearedLines === 1) {
                points = GAME_CONFIG.SCORES.T_SPIN_SINGLE;
                actionText = `${MESSAGES.T_SPIN} ${MESSAGES.SINGLE}`;
            } else if (clearedLines === 2) {
                points = GAME_CONFIG.SCORES.T_SPIN_DOUBLE;
                actionText = `${MESSAGES.T_SPIN} ${MESSAGES.DOUBLE}`;
            } else if (clearedLines === 3) {
                points = GAME_CONFIG.SCORES.T_SPIN_TRIPLE;
                actionText = `${MESSAGES.T_SPIN} ${MESSAGES.TRIPLE}`;
            }
        } else if (clearedLines > 0) {
            switch (clearedLines) {
                case 1:
                    points = GAME_CONFIG.SCORES.SINGLE;
                    actionText = MESSAGES.SINGLE;
                    break;
                case 2:
                    points = GAME_CONFIG.SCORES.DOUBLE;
                    actionText = MESSAGES.DOUBLE;
                    break;
                case 3:
                    points = GAME_CONFIG.SCORES.TRIPLE;
                    actionText = MESSAGES.TRIPLE;
                    break;
                case 4:
                    points = GAME_CONFIG.SCORES.TETRIS;
                    actionText = MESSAGES.TETRIS;
                    break;
            }
        }
        
        if (points > 0) {
            this.score += points * this.level;
            this.lastAction = actionText;
        }
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.BEST_SCORE, this.bestScore.toString());
        }
    }
    
    addSoftDropScore() {
        this.score += GAME_CONFIG.SCORES.SOFT_DROP;
    }
    
    addHardDropScore(distance) {
        this.score += distance * GAME_CONFIG.SCORES.HARD_DROP;
    }
    
    getDropInterval() {
        return Math.max(100, GAME_CONFIG.INITIAL_DROP_INTERVAL - (this.level - 1) * 50);
    }
}
