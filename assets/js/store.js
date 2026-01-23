// Store for managing game data
let games = [];
let loading = true;
let error = null;

// Load games from JSON
export async function loadGames() {
    try {
        loading = true;
        error = null;
        const response = await fetch('assets/data/games.json');
        if (!response.ok) {
            throw new Error('Failed to load games');
        }
        games = await response.json();
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
