// Store for managing game data
let games = [];
let error = null;

// Load games from individual JSON files in assets/data/games/
export async function loadGames() {
    try {
        error = null;

        // Load the index file to get list of game files
        const indexResponse = await fetch('assets/data/games/index.json');
        if (!indexResponse.ok) {
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
                    return isValidGame(game) ? game : null;
                }
                // Return null if response is not ok (404, 500, etc.)
                return null;
            } catch (err) {
                console.warn(`Failed to load game file ${filename}:`, err);
                return null;
            }
        });

        const results = await Promise.all(loadPromises);
        games = results.filter(game => game !== null);
        return games;
    } catch (err) {
        error = err.message;
        console.error('Error loading games:', err);
        return [];
    }
}

// Validate required fields so a broken JSON file cannot break the whole list
function isValidGame(game) {
    return Boolean(
        game &&
        typeof game.slug === 'string' && game.slug.length > 0 &&
        typeof game.title === 'string' && game.title.length > 0
    );
}

// Get all games
export function getGames() {
    return games;
}

// Get a game by slug
export function getGame(slug) {
    return games.find(game => game.slug === slug);
}

// Get error state
export function getError() {
    return error;
}
