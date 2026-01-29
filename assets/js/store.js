// Store for managing game data
let games = [];
let loading = true;
let error = null;

// Load games from individual JSON files in assets/data/games/
export async function loadGames() {
    try {
        loading = true;
        error = null;
        
        // Load the index file to get list of game files
        const indexResponse = await fetch('assets/data/games/index.json');
        if (!indexResponse.ok) {
            // Fallback: try loading from old games.json
            try {
                const fallbackResponse = await fetch('assets/data/games.json');
                if (fallbackResponse.ok) {
                    games = await fallbackResponse.json();
                    loading = false;
                    return games;
                }
            } catch (err) {
                console.warn('Failed to load from fallback games.json:', err);
            }
            throw new Error('Failed to load game index');
        }
        
        const gameFiles = await indexResponse.json();
        
        // Validate that index.json contains an array
        if (!Array.isArray(gameFiles)) {
            throw new Error('Invalid game index format: expected an array');
        }
        
        const gamesDir = 'assets/data/games/';
        
        // Load all individual game files
        const loadPromises = gameFiles.map(async (filename) => {
            try {
                const response = await fetch(`${gamesDir}${filename}`);
                if (response.ok) {
                    const game = await response.json();
                    return game;
                }
                // Return null if response is not ok (404, 500, etc.)
                return null;
            } catch (err) {
                console.warn(`Failed to load game file ${filename}:`, err);
                return null;
            }
        });
        
        const results = await Promise.all(loadPromises);
        const loadedGames = results.filter(game => game !== null);
        
        games = loadedGames;
        loading = false;
        return games;
    } catch (err) {
        error = err.message;
        loading = false;
        console.error('Error loading games:', err);
        return [];
    }
}

// Get all games
export function getGames() {
    return games;
}

// Get a game by slug
export function getGame(slug) {
    return games.find(game => game.slug === slug);
}

// Get loading state
export function isLoading() {
    return loading;
}

// Get error state
export function getError() {
    return error;
}
