'use strict';

import { DEFAULT_GROUPS, GAME_CONFIG } from './config/gacha-config.js';

class GachaSimulator {
    constructor() {
        this.currency = GAME_CONFIG.GACHA.INITIAL_CURRENCY;
        this.totalCount = 0;
        this.groups = this.loadGroups();
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
        this.groupsEditor = document.getElementById('groups-editor');
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
    
    loadGroups() {
        const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEY_GROUPS);
        if (saved) {
            return JSON.parse(saved);
        }
        // Deep copy to avoid reference issues
        return JSON.parse(JSON.stringify(DEFAULT_GROUPS));
    }
    
    saveGroups() {
        localStorage.setItem(GAME_CONFIG.STORAGE_KEY_GROUPS, JSON.stringify(this.groups));
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
        // Calculate total probability from all groups
        const totalProb = this.groups.reduce((sum, group) => sum + group.probability, 0);
        
        // Select a group based on probability
        let random = Math.random() * totalProb;
        let selectedGroup = null;
        
        for (const group of this.groups) {
            random -= group.probability;
            if (random <= 0) {
                selectedGroup = group;
                break;
            }
        }
        
        // Fallback to first group if none selected
        if (!selectedGroup || !selectedGroup.subgroups || selectedGroup.subgroups.length === 0) {
            selectedGroup = this.groups[0];
        }
        
        // Calculate total probability from subgroups
        const subgroupTotal = selectedGroup.subgroups.reduce((sum, sub) => sum + sub.probability, 0);
        
        // Select a subgroup based on probability
        random = Math.random() * subgroupTotal;
        let selectedSubgroup = null;
        
        for (const subgroup of selectedGroup.subgroups) {
            random -= subgroup.probability;
            if (random <= 0) {
                selectedSubgroup = subgroup;
                break;
            }
        }
        
        // Fallback to first subgroup
        if (!selectedSubgroup || !selectedSubgroup.items || selectedSubgroup.items.length === 0) {
            selectedSubgroup = selectedGroup.subgroups[0];
        }
        
        // Randomly select an item from the subgroup (equal probability)
        const items = selectedSubgroup.items;
        const randomIndex = Math.floor(Math.random() * items.length);
        const selectedItem = items[randomIndex];
        
        // Return item with group/subgroup info for display
        return {
            name: selectedItem.name,
            groupId: selectedGroup.id,
            groupName: selectedGroup.name,
            groupColor: selectedGroup.color,
            subgroupName: selectedSubgroup.name
        };
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
        card.className = `result-card`;
        card.style.setProperty('--group-color', item.groupColor);
        
        const groupNameDiv = document.createElement('div');
        groupNameDiv.className = 'card-group';
        groupNameDiv.textContent = item.groupName;
        groupNameDiv.style.color = item.groupColor;
        
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = item.name;
        
        const subgroupDiv = document.createElement('div');
        subgroupDiv.className = 'card-subgroup';
        subgroupDiv.textContent = item.subgroupName;
        
        card.appendChild(groupNameDiv);
        card.appendChild(name);
        card.appendChild(subgroupDiv);
        
        return card;
    }
    
    addToHistory(item) {
        this.history.unshift({
            item: item,
            timestamp: Date.now()
        });
        
        // Keep only last MAX_SIZE items
        if (this.history.length > GAME_CONFIG.HISTORY.MAX_SIZE) {
            this.history = this.history.slice(0, GAME_CONFIG.HISTORY.MAX_SIZE);
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
        
        this.probabilityTable.innerHTML = '';
        
        // Calculate total probability
        const totalProb = this.groups.reduce((sum, group) => sum + group.probability, 0);
        
        // Add total probability display
        const totalDiv = document.createElement('div');
        totalDiv.style.padding = '10px';
        totalDiv.style.borderBottom = '2px solid #667eea';
        totalDiv.style.marginBottom = '10px';
        totalDiv.style.fontWeight = 'bold';
        totalDiv.style.textAlign = 'center';
        totalDiv.style.color = totalProb === 100 ? '#4caf50' : '#ff9800';
        totalDiv.textContent = `合計: ${totalProb.toFixed(1)}%`;
        this.probabilityTable.appendChild(totalDiv);
        
        // Display each group
        this.groups.forEach(group => {
            const probItem = document.createElement('div');
            probItem.className = 'prob-item';
            probItem.style.borderLeft = `4px solid ${group.color}`;
            probItem.style.paddingLeft = '8px';
            
            const groupDiv = document.createElement('div');
            groupDiv.className = 'prob-rarity';
            groupDiv.style.color = group.color;
            groupDiv.style.fontWeight = 'bold';
            groupDiv.textContent = group.name;
            
            const percentage = document.createElement('div');
            percentage.className = 'prob-percentage';
            percentage.textContent = `${group.probability.toFixed(1)}%`;
            
            probItem.appendChild(groupDiv);
            probItem.appendChild(percentage);
            this.probabilityTable.appendChild(probItem);
        });
    }
    
    updateButtonStates() {
        this.singleGachaBtn.disabled = this.currency < GAME_CONFIG.GACHA.SINGLE_COST;
        this.multiGachaBtn.disabled = this.currency < GAME_CONFIG.GACHA.MULTI_COST;
    }
    
    resetCurrency() {
        this.currency = GAME_CONFIG.GACHA.INITIAL_CURRENCY;
        this.updateDisplay();
    }
    
    // Settings Modal Methods
    openSettingsModal() {
        this.settingsModal.classList.add('show');
        this.animationToggle.checked = this.settings.animationEnabled;
        this.probabilityToggle.checked = this.settings.showProbability;
        this.renderRarityProbsEditor();
        this.renderItemsEditor();
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.remove('show');
    }
    
    renderRarityProbsEditor() {
        this.rarityProbsEditor.innerHTML = '';
        
        // Calculate and display total
        const totalProb = Object.values(this.rarityProbabilities).reduce((sum, prob) => sum + prob, 0);
        const totalDiv = document.createElement('div');
        totalDiv.style.padding = '10px';
        totalDiv.style.marginBottom = '10px';
        totalDiv.style.background = '#f5f7fa';
        totalDiv.style.borderRadius = '6px';
        totalDiv.style.fontWeight = 'bold';
        totalDiv.style.textAlign = 'center';
        totalDiv.style.color = totalProb === 100 ? '#4caf50' : '#ff9800';
        totalDiv.id = 'total-prob-display';
        totalDiv.textContent = `確率合計: ${totalProb.toFixed(1)}%`;
        this.rarityProbsEditor.appendChild(totalDiv);
        
        // Render rarity probability inputs
        [5, 4, 3, 2, 1].forEach(rarity => {
            const row = document.createElement('div');
            row.className = 'rarity-prob-row';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '10px';
            row.style.padding = '10px';
            row.style.background = 'white';
            row.style.borderRadius = '6px';
            row.style.marginBottom = '8px';
            
            const label = document.createElement('label');
            label.style.flex = '1';
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '8px';
            label.style.fontWeight = 'bold';
            
            const stars = document.createElement('span');
            stars.textContent = GAME_CONFIG.RARITY[rarity].stars;
            stars.style.color = GAME_CONFIG.RARITY[rarity].color;
            
            const rarityName = document.createElement('span');
            rarityName.textContent = GAME_CONFIG.RARITY[rarity].name;
            
            // Count items in this rarity
            const itemCount = this.items.filter(item => item.rarity === rarity).length;
            const countSpan = document.createElement('span');
            countSpan.style.fontSize = '0.85rem';
            countSpan.style.color = '#666';
            countSpan.textContent = `(${itemCount}個)`;
            
            label.appendChild(stars);
            label.appendChild(rarityName);
            label.appendChild(countSpan);
            
            const input = document.createElement('input');
            input.type = 'number';
            input.value = this.rarityProbabilities[rarity] || 0;
            input.step = '0.1';
            input.min = '0';
            input.max = '100';
            input.style.width = '100px';
            input.style.padding = '8px';
            input.style.border = '1px solid #ddd';
            input.style.borderRadius = '4px';
            input.dataset.rarity = rarity;
            
            // Add event listener to update total in real-time
            input.addEventListener('input', () => this.updateTotalProbDisplay());
            
            const unit = document.createElement('span');
            unit.textContent = '%';
            unit.style.fontWeight = 'bold';
            
            row.appendChild(label);
            row.appendChild(input);
            row.appendChild(unit);
            
            this.rarityProbsEditor.appendChild(row);
        });
    }
    
    updateTotalProbDisplay() {
        const inputs = this.rarityProbsEditor.querySelectorAll('input[data-rarity]');
        let total = 0;
        inputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            total += value;
        });
        
        const totalDiv = document.getElementById('total-prob-display');
        if (totalDiv) {
            totalDiv.textContent = `確率合計: ${total.toFixed(1)}%`;
            totalDiv.style.color = total === 100 ? '#4caf50' : '#ff9800';
        }
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
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item-btn';
            deleteBtn.textContent = '削除';
            deleteBtn.dataset.index = index;
            deleteBtn.addEventListener('click', () => this.deleteItem(index));
            
            row.appendChild(nameInput);
            row.appendChild(raritySelect);
            row.appendChild(deleteBtn);
            
            this.itemsEditor.appendChild(row);
        });
    }
    
    addItemRow() {
        this.items.push({
            name: '新しいアイテム',
            rarity: 3
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
        
        // Update rarity probabilities
        const rarityInputs = this.rarityProbsEditor.querySelectorAll('input[data-rarity]');
        rarityInputs.forEach(input => {
            const rarity = parseInt(input.dataset.rarity);
            const value = parseFloat(input.value);
            if (isNaN(value) || value < 0) {
                alert('確率は0以上の数値を入力してください');
                throw new Error('Invalid probability value');
            }
            this.rarityProbabilities[rarity] = value;
        });
        
        // Update items from editor
        const inputs = this.itemsEditor.querySelectorAll('input, select');
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            const field = input.dataset.field;
            
            if (field === 'name') {
                const value = input.value.trim();
                if (!value) {
                    alert('アイテム名を入力してください');
                    throw new Error('Item name is required');
                }
                this.items[index].name = value;
            } else if (field === 'rarity') {
                this.items[index].rarity = parseInt(input.value);
            }
        });
        
        this.saveItems();
        this.saveRarityProbabilities();
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
        this.rarityProbabilities = { ...DEFAULT_RARITY_PROBABILITIES };
        this.settings = { ...GAME_CONFIG.DEFAULT_SETTINGS };
        this.saveItems();
        this.saveRarityProbabilities();
        this.saveSettingsToStorage();
        this.renderRarityProbsEditor();
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
        
        this.history.slice(0, GAME_CONFIG.HISTORY.DISPLAY_COUNT).forEach(entry => {
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
