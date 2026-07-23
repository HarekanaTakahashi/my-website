import { loadGames, getGames } from './store.js';
import { renderHome, setupHomeListeners } from './views/home.js';
import { renderGame, setupGameListeners } from './views/game.js';
import { escapeHtml } from './utils.js';

// DOM elements
let sidebar;
let sidebarOverlay;
let sidebarMenu;
let viewContainer;
let menuBtn;
let homeBtn;

// Initialize the app
async function init() {
    // Get DOM elements
    sidebar = document.getElementById('sidebar');
    sidebarOverlay = document.getElementById('sidebar-overlay');
    sidebarMenu = document.getElementById('sidebar-menu');
    viewContainer = document.getElementById('view-container');
    menuBtn = document.getElementById('menu-btn');
    homeBtn = document.getElementById('home-btn');
    
    // Setup UI event listeners
    setupUIListeners();
    
    // Load games data
    await loadGames();
    
    // Update sidebar with games
    updateSidebar();
    
    // Setup routing
    setupRouting();
    
    // Handle initial route
    handleRoute();
}

// Setup UI event listeners
function setupUIListeners() {
    // Menu button - toggle sidebar
    menuBtn.addEventListener('click', () => {
        toggleSidebar();
    });
    
    // Home button - navigate to home
    homeBtn.addEventListener('click', () => {
        window.location.hash = '#/';
    });
    
    // Overlay - close sidebar
    sidebarOverlay.addEventListener('click', () => {
        closeSidebar();
    });
    
    // Escape key - close sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
    
    // Sidebar links - close sidebar on navigation
    // アイコン用の <span> をクリックした場合も拾えるよう closest() を使う
    sidebar.addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            closeSidebar();
        }
    });
}

// Toggle sidebar
function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// Open sidebar
function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
    sidebar.setAttribute('aria-hidden', 'false');
    sidebarOverlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'true');

    // フォーカスをサイドバー内に移動（キーボード操作用）
    const firstLink = sidebarMenu.querySelector('a');
    if (firstLink) firstLink.focus();
}

// Close sidebar
function closeSidebar() {
    const hadFocusInside = sidebar.contains(document.activeElement);

    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
    sidebar.setAttribute('aria-hidden', 'true');
    sidebarOverlay.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');

    // サイドバー内にフォーカスが残らないようメニューボタンへ戻す
    if (hadFocusInside) menuBtn.focus();
}

// Update sidebar with game links
function updateSidebar() {
    const games = getGames();
    const gamesHTML = games.map(game => `
        <li><a href="#/game/${escapeHtml(game.slug)}"><span class="nav-icon" aria-hidden="true">${escapeHtml(game.icon || '🎲')}</span>${escapeHtml(game.title)}</a></li>
    `).join('');
    
    // Insert games after the divider
    const divider = sidebarMenu.querySelector('.divider');
    if (divider && gamesHTML) {
        divider.insertAdjacentHTML('afterend', gamesHTML);
    }
}

// Setup routing
function setupRouting() {
    window.addEventListener('hashchange', handleRoute);
}

// Handle route changes
function handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.substring(1); // Remove #
    
    // Update active link in sidebar
    updateActiveLink(path);
    
    // Route to appropriate view
    if (path === '/' || path === '') {
        renderView(renderHome());
        const container = viewContainer;
        setupHomeListeners(container);
    } else if (path.startsWith('/game/')) {
        const slug = path.substring(6); // Remove /game/
        renderView(renderGame(slug));
        setupGameListeners(viewContainer);
    } else {
        // 404
        renderView(render404());
    }
}

// Render view content
function renderView(html) {
    viewContainer.innerHTML = html;
}

// Update active link in sidebar
function updateActiveLink(path) {
    const links = sidebarMenu.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href').substring(1); // Remove #
        if (href === path) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Render 404 page
function render404() {
    return `
        <div class="error-view">
            <h2>ページが見つかりません</h2>
            <p>お探しのページは存在しません。</p>
            <a href="#/" class="home-link">ホームに戻る</a>
        </div>
    `;
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
