// --- shopSystem.js ---
// 商店系統邏輯
// [Fix] Reverted to fully random items (Elements/Equipment mixed)
// [Fix] UI Layout issues resolved in HTML/CSS
// [Fix] Price calculation logic aligned with generateReward wrapper
// [Fix] Added missing UI update for Reroll Cost (Now displays 50, 100, 150...)

function openShop() {
    gameState='SHOP'; 
    document.getElementById('shop-modal').style.display='flex'; 
    document.getElementById('joystick-area').style.display = 'none';
    document.getElementById('combat-bar').style.display = 'none';
    
    shopState.rerollCount = 0; 
    shopState.items = []; 
    
    document.getElementById('shop-gold-display').innerText = player.gold;
    
    if(shopState.items.length===0) fillShopItems();
    
    shopState.selectedIdx = -1; 
    forgeState.selectedInvUuid = null; 
    forgeState.selectedSocketIdx = -1;
    forgeState.targetUuid = null;
    forgeState.mode = 'equipped'; 
    forgeState.equipSlotIdx = 4;
    forgeState.pendingEquip = null; 

    fusionState.main = null; 
    fusionState.subs = [];

    updateInfoPanel(null, null);
    renderShopTab();
    renderForge();
    renderFusionUI(); 
    renderInventoryStrip();
}

// [Fix] 配合 generateReward 的回傳結構 { type: 'element'/'equipment', data: ... } 進行計價
function calculateItemPrice(itemWrapper) {
    if (itemWrapper.type === 'element') {
        let item = itemWrapper.data;
        let base = 100;
        let mult = Math.pow(1.5, item.level - 1);
        return Math.floor(base * mult);
    } else {
        // Equipment
        let item = itemWrapper.data;
        let price = 150;
        if (item.sockets) price += item.sockets.length * 50;
        if (item.links) price += item.links.length * 30;
        return price;
    }
}

// [Fix] 改回完全隨機生成 (使用 inventory.js 的 generateReward)
function fillShopItems() {
    shopState.items = [];
    let count = 6; 
    
    for(let i=0; i<count; i++) {
        // 傳入 currentWave + 2 讓商店稍微賣好一點的東西
        let reward = generateReward(currentWave + 2);
        let price = calculateItemPrice(reward);
        
        shopState.items.push({ item: reward, price: price, sold: false });
    }
}

function renderShopTab() {
    const grid = document.getElementById('shop-cards');
    grid.innerHTML = '';
    
    shopState.items.forEach((obj, idx) => {
        let item = obj.item.data; // 取出實際資料
        let extraClass = '';
        
        // 判斷稀有度光暈
        if(obj.item.type === 'equipment') {
            let max = item.def.maxSockets;
            if(max >= 6) extraClass = ' tier-legendary';
            else if(max >= 4) extraClass = ' tier-rare';
            else extraClass = ' tier-common';
        }

        let div = document.createElement('div');
        div.className = 'card' + (shopState.selectedIdx === idx ? ' selected' : '') + (obj.sold ? ' sold-out' : '') + extraClass;
        
        if(obj.item.type === 'equipment') div.classList.add('weapon-card');

        let displayName = item.def.cn || item.def.name;
        
        // 根據類型渲染卡片內容
        if(obj.item.type === 'element') {
            let tag = '';
            if(item.def.type==='active') tag = '<div class="el-equip">A</div>';
            if(item.def.type==='support') tag = '<div class="el-equip" style="background:#00ccff; color:#000;">S</div>';
            
            div.innerHTML = `
                <div class="el-symbol">${item.def.s}</div>
                <div class="el-cn">${displayName}</div>
                <div class="price-tag">$${obj.price}</div>
                ${tag}
                <div class="el-lvl">Lv.${item.level}</div>
            `;
        } else {
            // Equipment
            let sCount = item.sockets ? item.sockets.length : 0;
            let lCount = item.links ? item.links.length : 0;
            let socketInfo = `${sCount}/${item.def.maxSockets}孔`;
            let linkInfo = lCount > 0 ? ` ${lCount}連` : '';
            let tierLabel = `<div class="tier-label">${item.def.name}</div>`;

            div.innerHTML = `
                <div class="el-symbol">${item.def.icon}</div>
                <div class="el-cn" style="font-size:11px;">${item.def.tier || '標準'}</div>
                ${tierLabel}
                <div class="price-tag">$${obj.price} <span style="color:#666">|</span> ${socketInfo}${linkInfo}</div>
            `;
        }

        if(!obj.sold) {
            div.onclick = () => {
                shopState.selectedIdx = idx;
                updateBuyButton();
                renderShopTab();
                
                if(obj.item.type === 'element') {
                    updateInfoPanel(item.def, 'element', item.level);
                } else {
                    updateInfoPanel(item, 'equipment', 1);
                }
            };
        }
        grid.appendChild(div);
    });
    
    // [CRITICAL FIX] 更新刷新按鈕上的價格文字
    document.getElementById('cost-reroll-shop').innerText = (shopState.rerollCount+1)*50;

    updateBuyButton();
}

function updateBuyButton() {
    let btn = document.getElementById('btn-buy-confirm');
    if(shopState.selectedIdx === -1) {
        btn.innerText = "購買";
        btn.disabled = true;
        btn.classList.remove('btn-gold');
        return;
    }
    
    let obj = shopState.items[shopState.selectedIdx];
    if(obj.sold) {
        btn.innerText = "已售出";
        btn.disabled = true;
        btn.classList.remove('btn-gold');
    } else {
        if(player.gold >= obj.price) {
            btn.classList.add('btn-gold');
            btn.innerText = `購買 ($${obj.price})`;
            btn.disabled = false;
        } else {
            btn.classList.remove('btn-gold');
            btn.innerText = "金幣不足";
            btn.disabled = true;
        }
    }
}

function buySelectedShopItem() {
    if(shopState.selectedIdx === -1) return;
    let obj = shopState.items[shopState.selectedIdx];
    if(obj.sold) return;
    
    if(player.gold >= obj.price) {
        player.inventory.push(obj.item.data); 
        player.gold -= obj.price;
        obj.sold = true;
        document.getElementById('shop-gold-display').innerText = player.gold;
        updateBuyButton(); renderShopTab(); renderInventoryStrip(); renderForge();
        showToast("購買成功!");
    } else { showToast("金幣不足"); }
}

function rerollShop() {
    let c = (shopState.rerollCount+1)*50;
    if(player.gold >= c) {
        player.gold -= c; shopState.rerollCount++; shopState.selectedIdx = -1;
        fillShopItems();
        document.getElementById('shop-gold-display').innerText = player.gold;
        updateBuyButton(); renderShopTab(); updateInfoPanel(null, null);
    } else { showToast("金幣不足"); }
}

function closeShop() {
    document.getElementById('shop-modal').style.display='none';
    
    document.getElementById('joystick-area').style.display = 'block';
    document.getElementById('combat-bar').style.display = 'flex';
    
    fusionState.main = null;
    fusionState.subs = [];
    
    gameState = 'PLAY';
    startWave(currentWave + 1);
    
    // Restart loop
    lastTime = performance.now();
    loop(lastTime);
}