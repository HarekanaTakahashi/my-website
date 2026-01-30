export class TSpinDetector {
    constructor() {}
    
    check(piece, x, y, board, lastMoveWasRotation) {
        if (piece.type !== 'T' || !lastMoveWasRotation) {
            return { isTSpin: false, isMini: false };
        }
        
        // Check corners of T piece
        const corners = [
            [x, y],
            [x + 2, y],
            [x, y + 2],
            [x + 2, y + 2]
        ];
        
        let filledCorners = 0;
        for (const [cornerX, cornerY] of corners) {
            if (this.isCornerFilled(cornerX, cornerY, board)) {
                filledCorners++;
            }
        }
        
        if (filledCorners >= 3) {
            // Check if it's a mini T-Spin
            const frontCorners = this.getFrontCorners(piece.rotation, x, y);
            let filledFrontCorners = 0;
            for (const [cornerX, cornerY] of frontCorners) {
                if (this.isCornerFilled(cornerX, cornerY, board)) {
                    filledFrontCorners++;
                }
            }
            
            const isMini = filledFrontCorners < 2;
            return { isTSpin: true, isMini };
        }
        
        return { isTSpin: false, isMini: false };
    }
    
    isCornerFilled(x, y, board) {
        const BOARD_WIDTH = board.grid[0].length;
        const BOARD_HEIGHT = board.grid.length;
        
        if (x < 0 || x >= BOARD_WIDTH || 
            y < 0 || y >= BOARD_HEIGHT) {
            return true;
        }
        
        return board.grid[y][x] !== 0;
    }
    
    getFrontCorners(rotation, x, y) {
        switch (rotation) {
            case 0: return [[x, y], [x + 2, y]];
            case 1: return [[x + 2, y], [x + 2, y + 2]];
            case 2: return [[x + 2, y + 2], [x, y + 2]];
            case 3: return [[x, y + 2], [x, y]];
            default: return [[x, y], [x + 2, y]]; // Fallback to rotation 0
        }
    }
}
