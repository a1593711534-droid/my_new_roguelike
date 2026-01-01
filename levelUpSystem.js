// --- levelUpSystem.js ---
// 升級系統邏輯

function levelUp() {
    player.nextLvlXp = Math.floor(player.nextLvlXp * 1.2 + 50);
    player.level++;
    player.maxHp += 20;
    player.hp = player.maxHp;

    rerollCost.lvl = 0;
    document.getElementById('cost-reroll-lvl').innerText = "100";

    levelUpOptions = []; 
    
    gameState = 'PAUSE';
    document.getElementById('joystick-area').style.display='none';
    document.getElementById('levelup-modal').style.display='flex'; 
    
    levelUpSelection = -1; 
    document.getElementById('btn-lvl-confirm').disabled = true; 
    document.getElementById('btn-lvl-confirm').classList.remove('btn-gold');
    document.getElementById('lvl-info-container').style.display = 'none';
    document.getElementById('lvl-placeholder').style.display = 'flex';
    document.getElementById('lvl-gold-display').innerText = player.gold;

    renderLevelUp();
}

function rerollLevelUp() {
    let cost = (rerollCost.lvl + 1) * 100;
    if(player.gold >= cost) {
        player.gold -= cost;
        rerollCost.lvl++;
        levelUpOptions = []; 
        renderLevelUp(); 
        
        document.getElementById('cost-reroll-lvl').innerText = (rerollCost.lvl + 1) * 100;
        document.getElementById('ui-gold').innerText = player.gold;
        document.getElementById('shop-gold-display').innerText = player.gold;
        document.getElementById('lvl-gold-display').innerText = player.gold;
        
        levelUpSelection = -1;
        document.getElementById('btn-lvl-confirm').disabled = true; 
        document.getElementById('btn-lvl-confirm').classList.remove('btn-gold');
        document.getElementById('lvl-info-container').style.display = 'none';
        document.getElementById('lvl-placeholder').style.display = 'flex';
    } else {
        showToast("金幣不足");
    }
}

function renderLevelUp() {
    const el = document.getElementById('levelup-cards'); el.innerHTML = '';
    
    if(levelUpOptions.length === 0) {
        for(let i=0; i<3; i++) {
            levelUpOptions.push(generateReward());
        }
    }

    levelUpOptions.forEach((item, idx) => {
        let extraClass = '';
        if(item.type === 'equipment') {
            let max = item.data.def.maxSockets;
            let current = item.data.sockets.length;
            if(current >= max) extraClass = ' tier-legendary';
            else if(current >= max - 1) extraClass = ' tier-rare';
            else extraClass = ' tier-common';
        }

        let card = document.createElement('div');
        card.className = 'card' + (item.type==='equipment'?' weapon-card':'') + extraClass + (idx === levelUpSelection ? ' selected' : '');
        
        if(item.type==='equipment') {
            let socketInfo = `${item.data.sockets.length}/${item.data.def.maxSockets}孔`;
            let tierLabel = `<div class="tier-label">${item.data.def.name}</div>`;
            card.innerHTML = `<div class="el-symbol">${item.data.def.icon}</div><div class="el-cn" style="font-size:12px;">${item.data.def.tier}</div>${tierLabel}<div class="price-tag">${socketInfo}</div>`;
        } else {
            let tag = '';
            if(item.data.def.type==='active') tag = '<div class="el-equip">A</div>';
            if(item.data.def.type==='support') tag = '<div class="el-equip" style="background:#00ccff; color:#000;">S</div>';
            // [Fix] 這裡原本寫死 Lv.1，已修改為讀取 item.data.level
            card.innerHTML = `<div class="el-symbol">${item.data.def.s}</div><div class="el-cn">${item.data.def.cn}</div><div class="el-lvl">Lv.${item.data.level}</div>${tag}`;
        }
        card.onclick = () => selectLevelUpItem(idx);
        el.appendChild(card);
    });
}

function selectLevelUpItem(idx) {
    levelUpSelection = idx;
    const btn = document.getElementById('btn-lvl-confirm');
    btn.disabled = false;
    btn.classList.add('btn-gold');
    const item = levelUpOptions[idx];
    
    document.getElementById('lvl-placeholder').style.display = 'none';
    document.getElementById('lvl-info-container').style.display = 'flex';
    
    if(item.type === 'equipment') {
        let max = item.data.def.maxSockets;
        let tierColor = max >= 6 ? '#ffd700' : (max >= 4 ? '#00ccff' : '#fff');
        document.getElementById('lvl-info-name').innerHTML = `<span style="color:${tierColor}">${item.data.def.name}</span>`;
        document.getElementById('lvl-meta-row').innerHTML = `<span class="type-badge weapon-type">裝備</span>`;
        document.getElementById('lvl-info-desc').innerText = `類型: ${item.data.type}\n孔數: ${item.data.sockets.length} / ${max}\n\n選擇後將自動放入背包。`;
        document.getElementById('lvl-info-effect').innerText = "裝備可鑲嵌元素核心。";
    } else {
        let def = item.data.def;
        // [Fix] 這裡原本寫死 1，已修改為讀取 item.data.level
        let level = item.data.level; 
        document.getElementById('lvl-info-name').innerText = `${def.s} ${def.cn} (Lv.${level})`;
        let metaRow = '';
        if(def.type === 'active') {
            metaRow += `<span class="type-badge active-type">主動技能</span>`;
            if(def.tags) def.tags.forEach(t => metaRow += `<span class="tag-pill">${t}</span>`);
        } else {
            metaRow += `<span class="type-badge support-type">輔助技能</span>`;
            if(def.supportTags) def.supportTags.forEach(t => metaRow += `<span class="tag-pill">${t==='all'?'通用':t}</span>`);
        }
        document.getElementById('lvl-meta-row').innerHTML = metaRow;
        document.getElementById('lvl-info-desc').innerText = def.desc || "標準化學元素素材。";
        let stats = calculateEffectStats(def, level);
        document.getElementById('lvl-info-effect').innerHTML = stats.text;
    }
    renderLevelUp();
}

function confirmLevelUp() {
    if(levelUpSelection === -1) return;
    let item = levelUpOptions[levelUpSelection];
    player.inventory.push(item.data);
    showToast(`已放入背包: ${item.data.def.name || item.data.def.cn}`);
    closeLevelUp();
}

function closeLevelUp() { 
    document.getElementById('levelup-modal').style.display='none'; 
    document.getElementById('joystick-area').style.display='block';
    gameState = 'PLAY';
    lastTime = performance.now();
    loop(lastTime);
}