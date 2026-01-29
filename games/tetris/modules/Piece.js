import { TETROMINOS, SRS_KICK_DATA } from '../config/tetris-config.js';

export class Piece {
    constructor(type) {
        const tetromino = TETROMINOS[type];
        this.type = type;
        this.color = tetromino.color;
        this.name = tetromino.name;
        // Store the base shape for each rotation state
        this.baseShape = tetromino.shape;
        this.rotation = 0;
    }
    
    getShape() {
        return this.rotateMatrix(this.baseShape, this.rotation);
    }
    
    rotateMatrix(matrix, times) {
        let result = matrix;
        for (let i = 0; i < times; i++) {
            const n = result.length;
            const rotated = Array.from({ length: n }, () => Array(n).fill(0));
            
            for (let row = 0; row < n; row++) {
                for (let col = 0; col < n; col++) {
                    rotated[col][n - 1 - row] = result[row][col];
                }
            }
            result = rotated;
        }
        return result;
    }
    
    rotate(direction, currentX, currentY, board) {
        const oldRotation = this.rotation;
        const newRotation = (this.rotation + direction + 4) % 4;
        const rotatedShape = this.rotateMatrix(this.baseShape, newRotation);
        
        // Get appropriate kick data
        const kickData = this.type === 'I' ? SRS_KICK_DATA.I : 
                        this.type === 'O' ? SRS_KICK_DATA.O : 
                        SRS_KICK_DATA.JLSTZ;
        
        const rotationKey = this.getRotationKey(oldRotation, newRotation);
        const kicks = kickData[rotationKey];
        
        // Try each kick offset
        for (const [offsetX, offsetY] of kicks) {
            const newX = currentX + offsetX;
            const newY = currentY - offsetY;
            
            if (board.isValidPosition(newX, newY, rotatedShape)) {
                this.rotation = newRotation;
                return { success: true, x: newX, y: newY };
            }
        }
        
        return { success: false, x: currentX, y: currentY };
    }
    
    getRotationKey(oldRotation, newRotation) {
        const rotationNames = ['0', 'R', '2', 'L'];
        return `${rotationNames[oldRotation]}->${rotationNames[newRotation]}`;
    }
}
