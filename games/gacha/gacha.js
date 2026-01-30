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
        this.renderGroupsEditor();
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.remove('show');
    }
    
    renderGroupsEditor() {
        this.groupsEditor.innerHTML = '';
        
        // Calculate and display total probability
        const totalProb = this.groups.reduce((sum, group) => sum + group.probability, 0);
        const totalDiv = document.createElement('div');
        totalDiv.id = 'total-prob-display';
        totalDiv.style.padding = '15px';
        totalDiv.style.marginBottom = '15px';
        totalDiv.style.background = '#f5f7fa';
        totalDiv.style.borderRadius = '8px';
        totalDiv.style.fontWeight = 'bold';
        totalDiv.style.textAlign = 'center';
        totalDiv.style.fontSize = '1.1rem';
        totalDiv.style.color = totalProb === 100 ? '#4caf50' : '#ff9800';
        totalDiv.textContent = `確率合計: ${totalProb.toFixed(1)}%`;
        this.groupsEditor.appendChild(totalDiv);
        
        // Render each group
        this.groups.forEach((group, groupIndex) => {
            this.renderGroupSection(group, groupIndex);
        });
        
        // Add group button
        const addGroupBtn = document.createElement('button');
        addGroupBtn.className = 'add-group-btn';
        addGroupBtn.style.cssText = 'width: 100%; padding: 12px; margin-top: 15px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;';
        addGroupBtn.textContent = '+ グループ追加';
        addGroupBtn.addEventListener('click', () => this.addGroup());
        this.groupsEditor.appendChild(addGroupBtn);
    }
    
    renderGroupSection(group, groupIndex) {
        const groupSection = document.createElement('div');
        groupSection.className = 'group-section';
        groupSection.style.cssText = 'margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid ' + group.color;
        
        // Group header with name, color, probability
        const groupHeader = document.createElement('div');
        groupHeader.style.cssText = 'display: flex; gap: 10px; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #eee;';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = group.name;
        nameInput.placeholder = 'グループ名';
        nameInput.style.cssText = 'flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;';
        nameInput.dataset.groupIndex = groupIndex;
        nameInput.dataset.field = 'name';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = group.color;
        colorInput.style.cssText = 'width: 50px; height: 38px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;';
        colorInput.dataset.groupIndex = groupIndex;
        colorInput.dataset.field = 'color';
        colorInput.addEventListener('change', () => this.updateTotalProbDisplay());
        
        const probInput = document.createElement('input');
        probInput.type = 'number';
        probInput.value = group.probability;
        probInput.step = '0.1';
        probInput.min = '0';
        probInput.style.cssText = 'width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;';
        probInput.dataset.groupIndex = groupIndex;
        probInput.dataset.field = 'probability';
        probInput.addEventListener('input', () => this.updateTotalProbDisplay());
        
        const percentSpan = document.createElement('span');
        percentSpan.textContent = '%';
        percentSpan.style.fontWeight = 'bold';
        
        const deleteGroupBtn = document.createElement('button');
        deleteGroupBtn.textContent = '削除';
        deleteGroupBtn.style.cssText = 'padding: 8px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;';
        deleteGroupBtn.addEventListener('click', () => this.deleteGroup(groupIndex));
        
        groupHeader.appendChild(nameInput);
        groupHeader.appendChild(colorInput);
        groupHeader.appendChild(probInput);
        groupHeader.appendChild(percentSpan);
        groupHeader.appendChild(deleteGroupBtn);
        groupSection.appendChild(groupHeader);
        
        // Subgroups section
        const subgroupsLabel = document.createElement('h4');
        subgroupsLabel.textContent = 'サブグループ';
        subgroupsLabel.style.cssText = 'margin: 10px 0; font-size: 0.9rem; color: #666;';
        groupSection.appendChild(subgroupsLabel);
        
        group.subgroups.forEach((subgroup, subgroupIndex) => {
            this.renderSubgroupSection(subgroup, groupIndex, subgroupIndex, groupSection);
        });
        
        // Add subgroup button
        const addSubgroupBtn = document.createElement('button');
        addSubgroupBtn.textContent = '+ サブグループ追加';
        addSubgroupBtn.style.cssText = 'width: 100%; padding: 8px; margin-top: 10px; background: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer;';
        addSubgroupBtn.addEventListener('click', () => this.addSubgroup(groupIndex));
        groupSection.appendChild(addSubgroupBtn);
        
        this.groupsEditor.appendChild(groupSection);
    }
    
    renderSubgroupSection(subgroup, groupIndex, subgroupIndex, parentElement) {
        const subgroupDiv = document.createElement('div');
        subgroupDiv.style.cssText = 'margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 6px;';
        
        // Subgroup header
        const subgroupHeader = document.createElement('div');
        subgroupHeader.style.cssText = 'display: flex; gap: 10px; align-items: center; margin-bottom: 10px;';
        
        const subNameInput = document.createElement('input');
        subNameInput.type = 'text';
        subNameInput.value = subgroup.name;
        subNameInput.placeholder = 'サブグループ名';
        subNameInput.style.cssText = 'flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;';
        subNameInput.dataset.groupIndex = groupIndex;
        subNameInput.dataset.subgroupIndex = subgroupIndex;
        subNameInput.dataset.field = 'name';
        
        const subProbInput = document.createElement('input');
        subProbInput.type = 'number';
        subProbInput.value = subgroup.probability;
        subProbInput.step = '0.1';
        subProbInput.min = '0';
        subProbInput.style.cssText = 'width: 70px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;';
        subProbInput.dataset.groupIndex = groupIndex;
        subProbInput.dataset.subgroupIndex = subgroupIndex;
        subProbInput.dataset.field = 'probability';
        
        const subPercentSpan = document.createElement('span');
        subPercentSpan.textContent = '%';
        subPercentSpan.style.fontSize = '0.9rem';
        
        const deleteSubgroupBtn = document.createElement('button');
        deleteSubgroupBtn.textContent = '削除';
        deleteSubgroupBtn.style.cssText = 'padding: 6px 10px; background: #ff5722; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;';
        deleteSubgroupBtn.addEventListener('click', () => this.deleteSubgroup(groupIndex, subgroupIndex));
        
        subgroupHeader.appendChild(subNameInput);
        subgroupHeader.appendChild(subProbInput);
        subgroupHeader.appendChild(subPercentSpan);
        subgroupHeader.appendChild(deleteSubgroupBtn);
        subgroupDiv.appendChild(subgroupHeader);
        
        // Items in subgroup
        const itemsLabel = document.createElement('div');
        itemsLabel.textContent = 'アイテム:';
        itemsLabel.style.cssText = 'font-size: 0.85rem; color: #666; margin-bottom: 5px;';
        subgroupDiv.appendChild(itemsLabel);
        
        subgroup.items.forEach((item, itemIndex) => {
            this.renderItemRow(item, groupIndex, subgroupIndex, itemIndex, subgroupDiv);
        });
        
        // Add item button
        const addItemBtn = document.createElement('button');
        addItemBtn.textContent = '+ アイテム追加';
        addItemBtn.style.cssText = 'width: 100%; padding: 6px; margin-top: 5px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;';
        addItemBtn.addEventListener('click', () => this.addItem(groupIndex, subgroupIndex));
        subgroupDiv.appendChild(addItemBtn);
        
        parentElement.appendChild(subgroupDiv);
    }
    
    renderItemRow(item, groupIndex, subgroupIndex, itemIndex, parentElement) {
        const itemRow = document.createElement('div');
        itemRow.style.cssText = 'display: flex; gap: 5px; align-items: center; margin: 5px 0;';
        
        const itemNameInput = document.createElement('input');
        itemNameInput.type = 'text';
        itemNameInput.value = item.name;
        itemNameInput.placeholder = 'アイテム名';
        itemNameInput.style.cssText = 'flex: 1; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 0.9rem;';
        itemNameInput.dataset.groupIndex = groupIndex;
        itemNameInput.dataset.subgroupIndex = subgroupIndex;
        itemNameInput.dataset.itemIndex = itemIndex;
        
        const deleteItemBtn = document.createElement('button');
        deleteItemBtn.textContent = '×';
        deleteItemBtn.style.cssText = 'padding: 5px 10px; background: #e91e63; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;';
        deleteItemBtn.addEventListener('click', () => this.deleteItem(groupIndex, subgroupIndex, itemIndex));
        
        itemRow.appendChild(itemNameInput);
        itemRow.appendChild(deleteItemBtn);
        parentElement.appendChild(itemRow);
    }
    
    updateTotalProbDisplay() {
        const totalProb = this.groups.reduce((sum, group) => sum + group.probability, 0);
        const totalDiv = document.getElementById('total-prob-display');
        if (totalDiv) {
            totalDiv.textContent = `確率合計: ${totalProb.toFixed(1)}%`;
            totalDiv.style.color = totalProb === 100 ? '#4caf50' : '#ff9800';
        }
    }
    
    addGroup() {
        const newGroup = {
            id: 'group-' + Date.now(),
            name: '新しいグループ',
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            probability: 10.0,
            subgroups: [
                {
                    id: 'subgroup-' + Date.now(),
                    name: '通常',
                    probability: 100,
                    items: [{ name: '新しいアイテム' }]
                }
            ]
        };
        this.groups.push(newGroup);
        this.renderGroupsEditor();
    }
    
    deleteGroup(groupIndex) {
        if (this.groups.length <= 1) {
            alert('最低1つのグループが必要です');
            return;
        }
        if (confirm('このグループを削除しますか？')) {
            this.groups.splice(groupIndex, 1);
            this.renderGroupsEditor();
        }
    }
    
    addSubgroup(groupIndex) {
        const newSubgroup = {
            id: 'subgroup-' + Date.now(),
            name: '新しいサブグループ',
            probability: 50,
            items: [{ name: '新しいアイテム' }]
        };
        this.groups[groupIndex].subgroups.push(newSubgroup);
        this.renderGroupsEditor();
    }
    
    deleteSubgroup(groupIndex, subgroupIndex) {
        if (this.groups[groupIndex].subgroups.length <= 1) {
            alert('最低1つのサブグループが必要です');
            return;
        }
        if (confirm('このサブグループを削除しますか？')) {
            this.groups[groupIndex].subgroups.splice(subgroupIndex, 1);
            this.renderGroupsEditor();
        }
    }
    
    addItem(groupIndex, subgroupIndex) {
        this.groups[groupIndex].subgroups[subgroupIndex].items.push({ name: '新しいアイテム' });
        this.renderGroupsEditor();
    }
    
    deleteItem(groupIndex, subgroupIndex, itemIndex) {
        if (this.groups[groupIndex].subgroups[subgroupIndex].items.length <= 1) {
            alert('最低1つのアイテムが必要です');
            return;
        }
        this.groups[groupIndex].subgroups[subgroupIndex].items.splice(itemIndex, 1);
        this.renderGroupsEditor();
    }
    
    saveSettings() {
        // Update settings from checkboxes
        this.settings.animationEnabled = this.animationToggle.checked;
        this.settings.showProbability = this.probabilityToggle.checked;
        
        // Update groups from editor
        const groupInputs = this.groupsEditor.querySelectorAll('input');
        groupInputs.forEach(input => {
            const groupIndex = input.dataset.groupIndex;
            const subgroupIndex = input.dataset.subgroupIndex;
            const itemIndex = input.dataset.itemIndex;
            const field = input.dataset.field;
            
            if (groupIndex !== undefined && subgroupIndex === undefined && itemIndex === undefined) {
                // Group level
                if (field === 'name') {
                    this.groups[groupIndex].name = input.value.trim();
                } else if (field === 'color') {
                    this.groups[groupIndex].color = input.value;
                } else if (field === 'probability') {
                    this.groups[groupIndex].probability = parseFloat(input.value) || 0;
                }
            } else if (groupIndex !== undefined && subgroupIndex !== undefined && itemIndex === undefined) {
                // Subgroup level
                if (field === 'name') {
                    this.groups[groupIndex].subgroups[subgroupIndex].name = input.value.trim();
                } else if (field === 'probability') {
                    this.groups[groupIndex].subgroups[subgroupIndex].probability = parseFloat(input.value) || 0;
                }
            } else if (groupIndex !== undefined && subgroupIndex !== undefined && itemIndex !== undefined) {
                // Item level
                this.groups[groupIndex].subgroups[subgroupIndex].items[itemIndex].name = input.value.trim();
            }
        });
        
        this.saveGroups();
        this.saveSettingsToStorage();
        this.updateDisplay();
        this.closeSettingsModal();
        alert(GAME_CONFIG.MESSAGES.SAVE_SUCCESS);
    }
    
    resetSettings() {
        if (!confirm(GAME_CONFIG.MESSAGES.RESET_CONFIRM)) {
            return;
        }
        
        this.groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
        this.settings = { ...GAME_CONFIG.DEFAULT_SETTINGS };
        this.saveGroups();
        this.saveSettingsToStorage();
        this.renderGroupsEditor();
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
        // Calculate statistics by group
        const groupCount = {};
        this.groups.forEach(group => {
            groupCount[group.id] = 0;
        });
        
        this.history.forEach(entry => {
            if (entry.item.groupId && groupCount[entry.item.groupId] !== undefined) {
                groupCount[entry.item.groupId]++;
            }
        });
        
        // Display stats
        this.historyStats.innerHTML = '';
        this.groups.forEach(group => {
            if (groupCount[group.id] > 0) {
                const stat = document.createElement('div');
                stat.className = 'history-stat';
                
                const label = document.createElement('div');
                label.className = 'history-stat-label';
                label.textContent = group.name;
                label.style.color = group.color;
                
                const value = document.createElement('div');
                value.className = 'history-stat-value';
                value.textContent = groupCount[group.id];
                
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
            name.style.color = entry.item.groupColor || '#666';
            
            const info = document.createElement('div');
            info.className = 'history-item-info';
            info.textContent = entry.item.groupName || '';
            
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
