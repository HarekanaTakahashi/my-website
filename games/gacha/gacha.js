'use strict';

import { DEFAULT_ITEMS, GAME_CONFIG } from './config/gacha-config.js';

class GachaSimulator {
    constructor() {
        this.currency = 10000;
        this.totalCount = 0;
        this.items = this.loadItems();
        this.settings = this.loadSettings();
        this.history = this.loadHistory();
        
        this.initializeDOM();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    initializeDOM() {
        // Main UI elements
        this.currencyElement = document.getElementById('currency');
        this.totalCountElement = document.getElementById('total-count');
        this.singleGachaBtn = document.getElementById('single-gacha-btn');
        this.multiGachaBtn = document.getElementById('multi-gacha-btn');
        this.resultGrid = document.getElementById('result-grid');
        this.probabilityTable = document.getElementById('probability-table');
        
        // Settings modal
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeSettingsBtn = document.getElementById('close-settings-btn');
        this.animationToggle = document.getElementById('animation-toggle');
        this.probabilityToggle = document.getElementById('probability-toggle');
        this.itemsEditor = document.getElementById('items-editor');
        this.addItemBtn = document.getElementById('add-item-btn');
        this.saveSettingsBtn = document.getElementById('save-settings-btn');
        this.resetSettingsBtn = document.getElementById('reset-settings-btn');
        
        // History modal
        this.historyModal = document.getElementById('history-modal');
        this.historyBtn = document.getElementById('history-btn');
        this.closeHistoryBtn = document.getElementById('close-history-btn');
        this.historyStats = document.getElementById('history-stats');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history-btn');
        
        // Other buttons
        this.resetCurrencyBtn = document.getElementById('reset-currency-btn');
    }
    
    setupEventListeners() {
        // Gacha buttons
        this.singleGachaBtn.addEventListener('click', () => this.performGacha(1));
        this.multiGachaBtn.addEventListener('click', () => this.performGacha(GAME_CONFIG.GACHA.MULTI_COUNT));
        
        // Settings modal
        this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        this.addItemBtn.addEventListener('click', () => this.addItemRow());
        
        // History modal
        this.historyBtn.addEventListener('click', () => this.openHistoryModal());
        this.closeHistoryBtn.addEventListener('click', () => this.closeHistoryModal());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Other buttons
        this.resetCurrencyBtn.addEventListener('click', () => this.resetCurrency());
        
        // Close modals on outside click
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettingsModal();
        });
        this.historyModal.addEventListener('click', (e) => {
            if (e.target === this.historyModal) this.closeHistoryModal();
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettingsModal();
                this.closeHistoryModal();
            }
        });
    }
    
    loadItems() {
        const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY_ITEMS);
        return saved ? JSON.parse(saved) : [...DEFAULT_ITEMS];
    }
    
    saveItems() {
        localStorage.setItem(GAME_CONFIG.STORAGE_KEY_ITEMS, JSON.stringify(this.items));
    }
    
    loadSettings() {
        const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY_SETTINGS);
        return saved ? JSON.parse(saved) : { ...GAME_CONFIG.DEFAULT_SETTINGS };
    }
    
    saveSettingsToStorage() {
        localStorage.setItem(GAME_CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    }
    
    loadHistory() {
        const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY_HISTORY);
        return saved ? JSON.parse(saved) : [];
    }
    
    saveHistory() {
        localStorage.setItem(GAME_CONFIG.STORAGE_KEY_HISTORY, JSON.stringify(this.history));
    }
    
    performGacha(count) {
        const cost = count === 1 ? GAME_CONFIG.GACHA.SINGLE_COST : GAME_CONFIG.GACHA.MULTI_COST;
        
        if (this.currency < cost) {
            alert('石が足りません！');
            return;
        }
        
        this.currency -= cost;
        this.totalCount += count;
        
        const results = [];
        for (let i = 0; i < count; i++) {
            const item = this.drawItem();
            results.push(item);
            this.addToHistory(item);
        }
        
        this.displayResults(results);
        this.updateDisplay();
    }
    
    drawItem() {
        // Calculate total probability
        const totalProb = this.items.reduce((sum, item) => sum + item.probability, 0);
        
        // Generate random number
        let random = Math.random() * totalProb;
        
        // Select item based on probability
        for (const item of this.items) {
            random -= item.probability;
            if (random <= 0) {
                return { ...item };
            }
        }
        
        // Fallback to first item
        return { ...this.items[0] };
    }
    
    displayResults(results) {
        this.resultGrid.innerHTML = '';
        
        if (!this.settings.animationEnabled) {
            this.resultGrid.classList.add('no-animation');
        } else {
            this.resultGrid.classList.remove('no-animation');
        }
        
        results.forEach((item, index) => {
            setTimeout(() => {
                const card = this.createResultCard(item);
                this.resultGrid.appendChild(card);
            }, this.settings.animationEnabled ? index * GAME_CONFIG.ANIMATION.RESULT_DELAY : 0);
        });
    }
    
    createResultCard(item) {
        const card = document.createElement('div');
        card.className = `result-card rarity-${item.rarity}`;
        
        const stars = document.createElement('div');
        stars.className = 'card-stars';
        stars.textContent = GAME_CONFIG.RARITY[item.rarity].stars;
        
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = item.name;
        
        const rarity = document.createElement('div');
        rarity.className = 'card-rarity';
        rarity.textContent = GAME_CONFIG.RARITY[item.rarity].name;
        
        card.appendChild(stars);
        card.appendChild(name);
        card.appendChild(rarity);
        
        return card;
    }
    
    addToHistory(item) {
        this.history.unshift({
            item: item,
            timestamp: Date.now()
        });
        
        // Keep only last 100 items
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }
        
        this.saveHistory();
    }
    
    updateDisplay() {
        this.currencyElement.textContent = this.currency.toLocaleString();
        this.totalCountElement.textContent = this.totalCount.toLocaleString();
        this.updateProbabilityTable();
        this.updateButtonStates();
    }
    
    updateProbabilityTable() {
        if (!this.settings.showProbability) {
            this.probabilityTable.innerHTML = '<p style="text-align: center; color: #999;">確率表示OFF</p>';
            return;
        }
        
        // Group items by rarity
        const rarityGroups = {};
        this.items.forEach(item => {
            if (!rarityGroups[item.rarity]) {
                rarityGroups[item.rarity] = 0;
            }
            rarityGroups[item.rarity] += item.probability;
        });
        
        // Display grouped probabilities
        this.probabilityTable.innerHTML = '';
        [5, 4, 3, 2, 1].forEach(rarity => {
            if (rarityGroups[rarity]) {
                const probItem = document.createElement('div');
                probItem.className = 'prob-item';
                
                const rarityDiv = document.createElement('div');
                rarityDiv.className = 'prob-rarity';
                
                const stars = document.createElement('span');
                stars.className = 'prob-stars';
                stars.textContent = GAME_CONFIG.RARITY[rarity].stars;
                stars.style.color = GAME_CONFIG.RARITY[rarity].color;
                
                const name = document.createElement('span');
                name.textContent = GAME_CONFIG.RARITY[rarity].name;
                
                rarityDiv.appendChild(stars);
                rarityDiv.appendChild(name);
                
                const percentage = document.createElement('div');
                percentage.className = 'prob-percentage';
                percentage.textContent = `${rarityGroups[rarity].toFixed(1)}%`;
                
                probItem.appendChild(rarityDiv);
                probItem.appendChild(percentage);
                this.probabilityTable.appendChild(probItem);
            }
        });
    }
    
    updateButtonStates() {
        this.singleGachaBtn.disabled = this.currency < GAME_CONFIG.GACHA.SINGLE_COST;
        this.multiGachaBtn.disabled = this.currency < GAME_CONFIG.GACHA.MULTI_COST;
    }
    
    resetCurrency() {
        this.currency = 10000;
        this.updateDisplay();
    }
    
    // Settings Modal Methods
    openSettingsModal() {
        this.settingsModal.classList.add('show');
        this.animationToggle.checked = this.settings.animationEnabled;
        this.probabilityToggle.checked = this.settings.showProbability;
        this.renderItemsEditor();
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.remove('show');
    }
    
    renderItemsEditor() {
        this.itemsEditor.innerHTML = '';
        
        this.items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'item-row';
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = item.name;
            nameInput.placeholder = 'アイテム名';
            nameInput.dataset.index = index;
            nameInput.dataset.field = 'name';
            
            const raritySelect = document.createElement('select');
            raritySelect.dataset.index = index;
            raritySelect.dataset.field = 'rarity';
            for (let i = 1; i <= 5; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `★${i}`;
                if (i === item.rarity) option.selected = true;
                raritySelect.appendChild(option);
            }
            
            const probInput = document.createElement('input');
            probInput.type = 'number';
            probInput.value = item.probability;
            probInput.placeholder = '確率(%)';
            probInput.step = '0.1';
            probInput.min = '0';
            probInput.dataset.index = index;
            probInput.dataset.field = 'probability';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.textContent = '削除';
            deleteBtn.dataset.index = index;
            deleteBtn.addEventListener('click', () => this.deleteItem(index));
            
            row.appendChild(nameInput);
            row.appendChild(raritySelect);
            row.appendChild(probInput);
            row.appendChild(deleteBtn);
            
            this.itemsEditor.appendChild(row);
        });
    }
    
    addItemRow() {
        this.items.push({
            name: '新しいアイテム',
            rarity: 3,
            probability: 5.0
        });
        this.renderItemsEditor();
    }
    
    deleteItem(index) {
        if (this.items.length <= 1) {
            alert('最低1つのアイテムが必要です');
            return;
        }
        this.items.splice(index, 1);
        this.renderItemsEditor();
    }
    
    saveSettings() {
        // Update settings from checkboxes
        this.settings.animationEnabled = this.animationToggle.checked;
        this.settings.showProbability = this.probabilityToggle.checked;
        
        // Update items from editor
        const inputs = this.itemsEditor.querySelectorAll('input, select');
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            const field = input.dataset.field;
            
            if (field === 'name') {
                this.items[index].name = input.value;
            } else if (field === 'rarity') {
                this.items[index].rarity = parseInt(input.value);
            } else if (field === 'probability') {
                this.items[index].probability = parseFloat(input.value);
            }
        });
        
        // Validate total probability
        const totalProb = this.items.reduce((sum, item) => sum + item.probability, 0);
        if (Math.abs(totalProb - 100) > 0.1) {
            if (!confirm(`確率の合計が${totalProb.toFixed(1)}%です。このまま保存しますか？`)) {
                return;
            }
        }
        
        this.saveItems();
        this.saveSettingsToStorage();
        this.updateDisplay();
        this.closeSettingsModal();
        alert(GAME_CONFIG.MESSAGES.SAVE_SUCCESS);
    }
    
    resetSettings() {
        if (!confirm(GAME_CONFIG.MESSAGES.RESET_CONFIRM)) {
            return;
        }
        
        this.items = [...DEFAULT_ITEMS];
        this.settings = { ...GAME_CONFIG.DEFAULT_SETTINGS };
        this.saveItems();
        this.saveSettingsToStorage();
        this.renderItemsEditor();
        this.animationToggle.checked = this.settings.animationEnabled;
        this.probabilityToggle.checked = this.settings.showProbability;
        this.updateDisplay();
    }
    
    // History Modal Methods
    openHistoryModal() {
        this.historyModal.classList.add('show');
        this.renderHistory();
    }
    
    closeHistoryModal() {
        this.historyModal.classList.remove('show');
    }
    
    renderHistory() {
        // Calculate statistics
        const rarityCount = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        this.history.forEach(entry => {
            rarityCount[entry.item.rarity]++;
        });
        
        // Display stats
        this.historyStats.innerHTML = '';
        [5, 4, 3, 2, 1].forEach(rarity => {
            if (rarityCount[rarity] > 0) {
                const stat = document.createElement('div');
                stat.className = 'history-stat';
                
                const label = document.createElement('div');
                label.className = 'history-stat-label';
                label.textContent = GAME_CONFIG.RARITY[rarity].stars;
                label.style.color = GAME_CONFIG.RARITY[rarity].color;
                
                const value = document.createElement('div');
                value.className = 'history-stat-value';
                value.textContent = rarityCount[rarity];
                
                stat.appendChild(label);
                stat.appendChild(value);
                this.historyStats.appendChild(stat);
            }
        });
        
        // Display history list
        this.historyList.innerHTML = '';
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p style="text-align: center; color: #999;">履歴がありません</p>';
            return;
        }
        
        this.history.slice(0, 20).forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const name = document.createElement('div');
            name.className = 'history-item-name';
            name.textContent = entry.item.name;
            name.style.color = GAME_CONFIG.RARITY[entry.item.rarity].color;
            
            const info = document.createElement('div');
            info.className = 'history-item-info';
            info.textContent = GAME_CONFIG.RARITY[entry.item.rarity].stars;
            
            item.appendChild(name);
            item.appendChild(info);
            this.historyList.appendChild(item);
        });
    }
    
    clearHistory() {
        if (!confirm('履歴をすべて削除しますか？')) {
            return;
        }
        
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GachaSimulator();
});
