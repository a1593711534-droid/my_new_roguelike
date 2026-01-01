// --- inventory.js ---
// 物品生成、管理與背包 UI 渲染
// [Fix] Reverted pickUpEquipment to ONLY drop Equipment (like original)
// [Fix] Increased 2H Weapon drop rate inside weighted generation (1% -> ~5% total, 50% split in main)
// [Fix] Restored "Lucky Drop" level variance (+2~5 levels)

function generateUUID() {
    return Math.random().toString(36).substr(2, 9);
}

function calculateDropLevel() {
    let level = 1;
    let upgradeChance = 0.1 + (Math.min(50, currentWave) * 0.01);
    let maxRolls = 2 + Math.floor(currentWave / 5);

    for(let i=0; i<maxRolls; i++) {
        if(Math.random() < upgradeChance) {
            level++;
            if(Math.random() < 0.15) level++;
        }
    }
    
    // [Fix] 還原原始的幸運掉落機制 (隨機增加 2~5 等，而非固定 2 等)
    if(Math.random() < 0.01) {
        level += Math.floor(Math.random() * 4) + 2;
    }
    
    if(level > 20) level = 20; 
    return level;
}

function createInvItem(def, lvl=null) { 
    let finalLvl = lvl ? lvl : calculateDropLevel();
    let safeDef = { ...def };
    if(!safeDef.name) safeDef.name = safeDef.cn; 

    return { 
        uuid: generateUUID(), 
        def: safeDef, 
        level: finalLvl, 
        type: def.type,
        timestamp: Date.now(),
        timer: 0 
    }; 
}

function createEquipmentInstance(typeStr) {
    let slotType = 'main'; 
    let maxSockets = 3;
    let name = "裝備";
    let tierName = "標準";
    let icon = "📦";

    if(typeStr === 'head') { slotType='head'; maxSockets=4; name="戰術頭盔"; icon='⛑️'; }
    if(typeStr === 'body') { slotType='body'; maxSockets=6; name="納米裝甲"; icon='👕'; }
    if(typeStr === 'gloves') { slotType='gloves'; maxSockets=4; name="動力手套"; icon='🧤'; }
    if(typeStr === 'legs') { slotType='legs'; maxSockets=4; name="外骨骼"; icon='👢'; }
    if(typeStr === 'main_1h') { slotType='main'; maxSockets=3; name="單手劍"; icon='⚔️'; }
    if(typeStr === 'main_2h') { slotType='main'; maxSockets=6; name="雙手巨劍"; icon='🗡️'; tierName="重型"; }
    if(typeStr === 'offhand') { slotType='off'; maxSockets=3; name="能量盾"; icon='🛡️'; }

    let def = { 
        icon: icon, 
        name: name, 
        tier: tierName, 
        maxSockets: maxSockets,
        s: icon, 
        cn: name,
        type: 'equipment'
    };

    return { 
        uuid: generateUUID(), 
        type: typeStr, 
        slotId: slotType, 
        def: def, 
        sockets: [{item:null}], 
        links: [],
        timestamp: Date.now()
    };
}

function generateWeightedEquipment(waveBonus = 0) {
    let parts = ['head','body','gloves','legs','main','off'];
    let weights = [20, 15, 20, 20, 10, 15]; 
    let totalW = weights.reduce((a,b)=>a+b,0);
    let r = Math.random() * totalW;
    let selectedPart = 'head';
    let sum = 0;
    for(let i=0; i<parts.length; i++) {
        sum += weights[i];
        if(r < sum) { selectedPart = parts[i]; break; }
    }
    
    let originalDef = EQUIP_SLOTS_DEF.find(s => s.id === selectedPart);
    
    let name = originalDef.name;
    let tier = "標準";
    let icon = originalDef.icon;
    let maxS = originalDef.maxSockets;
    let typeStr = "equipment"; 

    if(selectedPart === 'head') name = "戰術頭盔";
    if(selectedPart === 'body') name = "納米裝甲";
    if(selectedPart === 'gloves') name = "動力手套";
    if(selectedPart === 'legs') name = "外骨骼";
    if(selectedPart === 'off') name = "能量盾";
    
    if(selectedPart === 'main') {
        // [Fix] 將雙手武器機率從 10% 提升回 50%
        // 這確保了在選中主手武器時，有一半機率是雙手巨劍 (模擬舊版 1/7 vs 1/7 的比例)
        if(Math.random() < 0.5) {
             name = "雙手巨劍";
             tier = "重型";
             icon = "🗡️";
             maxS = 6;
             typeStr = "main_2h";
        } else {
             name = "單手劍";
             typeStr = "main_1h";
        }
    }

    let safeDef = { 
        ...originalDef,
        name: name,
        tier: tier,
        icon: icon,
        maxSockets: maxS,
        s: icon,
        cn: name,
        type: 'equipment'
    };

    let sockets = [];
    let socketChance = 0.4 + (currentWave * 0.01) + (waveBonus * 0.02);
    let sCount = 1;
    for(let k=1; k<maxS; k++) {
        if(Math.random() < socketChance) sCount++;
    }
    // 雙手武器至少 2 孔
    if(typeStr === 'main_2h' && sCount < 2) sCount = 2;
    if(sCount > maxS) sCount = maxS;

    for(let k=0; k<sCount; k++) sockets.push({item: null});

    let links = [];
    let linkChance = 0.3 + (currentWave * 0.01);
    for(let k=0; k<sCount-1; k++) {
        if(Math.random() < linkChance) links.push([k, k+1]);
    }
    
    return {
        uuid: generateUUID(),
        slotId: selectedPart,
        type: typeStr,
        def: safeDef,
        sockets: sockets,
        links: links,
        level: 1, 
        timestamp: Date.now() 
    };
}

function generateReward(wave) {
    if (Math.random() < 0.3) {
        let eq = generateWeightedEquipment(wave);
        return { type: 'equipment', data: eq }; 
    } else {
        let pool = ELEMENTS_DB.filter(e => e.type === 'active' || e.type === 'support');
        let pick = pool[Math.floor(Math.random() * pool.length)];
        let item = createInvItem(pick); 
        return { type: 'element', data: item };
    }
}

function pickUpEquipment() {
    // [Fix] 這裡還原為只掉落裝備 (Original Behavior)
    // 移除了產生元素的邏輯
    let newItem = generateWeightedEquipment();
    showToast(`獲得裝備: ${newItem.def.name}`);
    
    player.inventory.push(newItem);
    updateCombatBar();
    
    if(gameState === 'SHOP') {
        renderInventoryStrip();
    }
}

function getLinkedSupports(equip, startSocketIdx) {
    if (!equip) return [];
    
    let visited = new Set();
    let queue = [startSocketIdx];
    let supports = [];
    let foundTypes = new Set();
    
    let activeItem = equip.sockets[startSocketIdx].item;
    if(!activeItem) return [];
    let activeTags = activeItem.def.tags || [];

    visited.add(startSocketIdx);

    while(queue.length > 0) {
        let curr = queue.shift();
        let item = equip.sockets[curr].item;
        
        if(item && item.def.type === 'support' && curr !== startSocketIdx) {
            if(!foundTypes.has(item.def.id)) {
                let supportRequired = item.def.supportTags || [];
                let isCompatible = false;
                if(supportRequired.includes('all')) isCompatible = true;
                else {
                    isCompatible = supportRequired.some(t => activeTags.includes(t));
                }

                if(isCompatible) {
                    supports.push({ ...item.def, level: item.level });
                    foundTypes.add(item.def.id);
                }
            }
        }
        
        equip.links.forEach(link => {
            let next = -1;
            if(link[0] === curr) next = link[1];
            if(link[1] === curr) next = link[0];
            if(next !== -1 && !visited.has(next) && next < equip.sockets.length) {
                visited.add(next);
                queue.push(next);
            }
        });
    }
    return supports;
}

function toggleInvSort(category, type) {
    let state = invSortState[category];
    
    if (category === 'equipment' && type === 'method') {
        if(state.method === 'type') state.method = 'time';
        else if(state.method === 'time') state.method = 'gem';
        else state.method = 'type';
    } else if (type === 'method') {
        state.method = (state.method === 'name') ? 'time' : 'name';
    } else {
        state.order = (state.order === 'asc') ? 'desc' : 'asc';
    }
    renderInventoryStrip();
}

function sortInventory(items, category) {
    let state = invSortState[category];
    let orderMult = state.order === 'asc' ? 1 : -1;

    return items.sort((a, b) => {
        let res = 0;
        if (category === 'equipment') {
            if(state.method === 'type') {
                let orderA = SLOT_ORDER[a.slotId] || 99;
                let orderB = SLOT_ORDER[b.slotId] || 99;
                res = orderA - orderB;
            } else if(state.method === 'gem') {
                let hasGemA = a.sockets.some(s=>s.item) ? 1 : 0;
                let hasGemB = b.sockets.some(s=>s.item) ? 1 : 0;
                res = hasGemA - hasGemB;
            } else { 
                res = (a.timestamp || 0) - (b.timestamp || 0);
            }
        } else {
            let nameA = a.def.s || "";
            let nameB = b.def.s || "";
            if (state.method === 'name') {
                res = nameA.localeCompare(nameB);
            } else {
                res = (a.timestamp || 0) - (b.timestamp || 0);
            }
        }
        return res * orderMult;
    });
}

function renderInventoryStrip() {
    let actives = player.inventory.filter(i => i.type === 'active');
    let supports = player.inventory.filter(i => i.type === 'support');
    let equips = player.inventory.filter(i => i.slotId); 

    sortInventory(actives, 'active');
    sortInventory(supports, 'support');
    sortInventory(equips, 'equipment');
    
    const updateBtns = (containerId, state, category) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        const btns = container.parentElement.querySelectorAll('.sort-btn');
        if(btns.length < 2) return;
        
        if(category === 'equipment') {
             btns[0].innerText = state.method.toUpperCase();
        } else {
             btns[0].innerText = state.method === 'name' ? 'TYPE' : 'TIME';
        }
        btns[1].innerText = state.order === 'asc' ? '▲' : '▼';
    };

    updateBtns('inv-active-list', invSortState.active, 'active');
    updateBtns('inv-support-list', invSortState.support, 'support');
    updateBtns('inv-equip-list', invSortState.equipment, 'equipment');

    const renderItem = (item, containerId) => {
        let container = document.getElementById(containerId);
        let div = document.createElement('div');
        
        let isSelected = (forgeState.selectedInvUuid === item.uuid);
        let isTarget = (forgeState.targetUuid === item.uuid);
        let isPending = (forgeState.pendingEquip && forgeState.pendingEquip.invUuid === item.uuid); 
        
        let isFusionMain = (fusionState.main && fusionState.main.item.uuid === item.uuid);
        let isFusionSub = (fusionState.subs && fusionState.subs.some(sub => sub.uuid === item.uuid));

        div.className = 'inv-item';
        
        if (isFusionMain) {
            div.classList.add('selected'); 
            div.style.borderColor = '#00ffff'; 
            div.style.boxShadow = '0 0 10px #00ffff';
        } 
        else if (isFusionSub) {
             div.style.borderColor = '#d4af37'; 
             div.style.backgroundColor = 'rgba(212, 175, 55, 0.3)';
             div.innerHTML += `<div style="position:absolute; top:0; right:0; color:#0f0; font-size:10px; background:rgba(0,0,0,0.8); border-radius:0 0 0 4px; padding:0 2px;">✔</div>`;
        }
        else if (isSelected || isTarget || isPending) {
            div.classList.add('selected');
        }

        if(item.type === 'active' || item.type === 'support') {
            let color = item.type === 'active' ? '#f55' : '#55f';
            div.innerHTML += `<span style="color:${color}; font-weight:bold; font-family:'Orbitron';">${item.def.s}</span><span style="font-size:9px; color:#aaa;">Lv${item.level}</span>`;
        } else {
            let borderColor = '#444';
            if(item.def.maxSockets >= 6) borderColor = '#aa8800';
            else if(item.def.maxSockets >= 4) borderColor = '#006699';
            div.style.borderColor = borderColor;
            
            if(item.sockets && item.sockets.some(s => s.item)) {
                div.innerHTML += `<div class="socket-indicator"></div>`; 
            }
            div.innerHTML += `<span class="inv-icon">${item.def.icon}</span><span style="font-size:9px; color:#aaa;">${item.def.name}</span>`;
        }

        div.onclick = (e) => {
            e.stopPropagation();

            if (fusionState.main) {
                if (fusionState.main.item.uuid === item.uuid) return;
                if (item.slotId) {
                    showToast("裝備無法作為融合素材");
                    return;
                }
                let idx = fusionState.subs.findIndex(s => s.uuid === item.uuid);
                if (idx >= 0) {
                    fusionState.subs.splice(idx, 1);
                } else {
                    fusionState.subs.push(item);
                    updateInfoPanel(item.def, 'element', item.level);
                }
                renderFusionUI(); 
                renderInventoryStrip(); 
                return; 
            }

            if(item.slotId) {
                if(forgeState.mode === 'inventory' && forgeState.targetUuid === item.uuid) {
                     // toggle
                } 
                else {
                    forgeState.mode = 'inventory';
                    forgeState.targetUuid = item.uuid;
                    forgeState.equipSlotIdx = -1; 
                    forgeState.selectedInvUuid = item.uuid; 
                    forgeState.selectedSocketIdx = -1;
                    forgeState.pendingEquip = null;
                }
                updateInfoPanel(item, 'equipment', 1);
            } else {
                if(forgeState.selectedInvUuid === item.uuid) {
                    forgeState.selectedInvUuid = null;
                    updateInfoPanel(null, null);
                } else {
                    forgeState.selectedInvUuid = item.uuid;
                    updateInfoPanel(item.def, 'element', item.level);
                    
                    let eff = document.getElementById('dash-info-effect');
                    if(eff) {
                        eff.innerHTML += `<br><span style="color:#d4af37; font-size:10px; margin-top:5px; display:block;">(點擊融合槽放入，或點擊裝備孔進行鑲嵌)</span>`;
                    }
                }
            }
            renderInventoryStrip();
            renderForge(); 
        };
        container.appendChild(div);
    };

    document.getElementById('inv-active-list').innerHTML = '';
    document.getElementById('inv-support-list').innerHTML = '';
    document.getElementById('inv-equip-list').innerHTML = '';

    actives.forEach(i => renderItem(i, 'inv-active-list'));
    supports.forEach(i => renderItem(i, 'inv-support-list'));
    equips.forEach(i => renderItem(i, 'inv-equip-list'));
}