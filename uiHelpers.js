// --- uiHelpers.js ---
// UI 輔助函數：數值計算、資訊面板、技能欄顯示

function calculateEffectStats(def, level) {
    if(!def) return { text: "", subText: "" };
    
    let displayLevel = level;
    let growthMult = displayLevel - 1;
    let val = 0;
    let text = "";

    if (def.type === 'active') {
        let base = 10; 
        let growthCurve = Math.pow(1.08, growthMult); 
        
        let multiplier = def.dmgMult || 1.0;
        let dmg = Math.floor(base * growthCurve * multiplier);
        
        let color = '#fff';
        if(multiplier >= 2.0) color = '#ff5555'; 
        if(multiplier < 0.8) color = '#88ccff';  

        return { text: `基礎傷害: <span style="color:${color}; font-weight:bold;">${dmg}</span>`, subText: `` };
    } else if (def.type === 'support') {
        
        let base = def.effect.base || 0;
        let growth = def.effect.growth || 0;

        if(def.effect.type === 'speed') { 
            val = base + (growthMult * growth); 
            text = `施法速度 <span style="color:#00ff00">+${Math.round(val*100)}%</span>`; 
        } 
        else if (def.effect.type === 'area') { 
            val = base + (growthMult * growth); 
            text = `技能範圍 <span style="color:#00ff00">+${Math.round(val*100)}%</span>`; 
        } 
        else if (def.effect.type === 'dmg') { 
            val = base + (growthMult * growth); 
            text = `造成傷害 <span style="color:#00ff00">+${Math.round(val*100)}%</span> (More)`; 
        } 
        else if (def.effect.type === 'velocity') { 
            val = base + (growthMult * growth); 
            text = `投射物速度 <span style="color:#00ff00">+${Math.round(val*100)}%</span>`; 
        } 
        else if (def.effect.type === 'crit') { 
            val = base + (growthMult * growth); 
            text = `基礎暴擊率 <span style="color:#00ff00">+${(val*100).toFixed(1)}%</span>`; 
        } 
        else if (def.effect.type === 'cdr') { 
            val = base + (growthMult * growth); 
            text = `冷卻回復率 <span style="color:#00ff00">+${Math.round(val*100)}%</span>`; 
        } 
        else if (def.effect.type === 'pierce') { 
            val = base + Math.floor(growthMult * growth); 
            text = `穿透數量 <span style="color:#00ff00">+${val}</span>`; 
        } 
        else if (def.effect.type === 'knockback') { 
            val = base + (growthMult * growth); 
            text = `擊退距離 <span style="color:#00ff00">+${Math.round(val*100)}%</span>`; 
        } 
        else if (def.effect.type === 'multishot') { 
            let reduction = base + (growthMult * growth);
            if(reduction < 0) reduction = 0;
            let pct = Math.round(reduction * 100);
            text = `投射物數量 <span style="color:#00ff00">+2</span><br>造成傷害 <span style="color:#ff5555">-${pct}%</span> (Less)`; 
        } 
        else if (def.effect.type === 'bounce') { 
            val = base + Math.floor(growthMult * growth); 
            text = `連鎖次數 <span style="color:#00ff00">+${val}</span>`; 
        } 
        else if (def.effect.type === 'homing') { 
            val = base + (growthMult * growth); 
            text = `導引能力 <span style="color:#00ff00">+${Math.round(val*100)}%</span>`; 
        } 
        else if (def.effect.type === 'execute') { 
            val = base + (growthMult * growth); 
            text = `處決生命 < <span style="color:#ff0000; font-weight:bold;">${(val*100).toFixed(1)}%</span>`; 
        } 
        else if (def.effect.type === 'crit_dmg') { 
            val = base + (growthMult * growth); 
            text = `暴擊傷害 <span style="color:#ff00ff">+${Math.round(val*100)}%</span>`; 
        } 
        else if (def.effect.type === 'corpse_explosion') { 
            val = base + (growthMult * growth); 
            text = `<span style="color:#ffaaaa; font-weight:bold;">${Math.round(val*100)}%</span> 機率屍體爆炸`; 
        }
        else if (def.effect.type === 'plus_level') {
            val = base + Math.floor(growthMult * growth); 
            text = `連結的主動技能等級 <span style="color:#d4af37; font-weight:bold;">+${val}</span>`;
        }
        else if (def.effect.type === 'duration') {
            val = base + (growthMult * growth);
            text = `持續時間 <span style="color:#00ff00">+${Math.round(val*100)}%</span>`;
        }
        else if (def.effect.type === 'fork') {
            val = base + Math.floor(growthMult * growth);
            text = `分裂次數 <span style="color:#00ff00">+${val}</span> (擊中後分裂)`;
        }
        // [Existing] Li (Swiftness)
        else if (def.effect.type === 'swiftness') {
             val = base + (growthMult * growth); // More Dmg
             let durRed = 0.20 + (growthMult * 0.01); 
             if(durRed > 0.6) durRed = 0.6;
             
             text = `造成傷害 <span style="color:#00ff00">+${Math.round(val*100)}%</span> (More)<br>持續時間 <span style="color:#ff5555">-${Math.round(durRed*100)}%</span> (Less)`;
        }
        // [New Fix] Ga (Multistrike)
        else if (def.effect.type === 'multistrike') {
            val = base + (growthMult * growth);
            text = `近戰攻速 <span style="color:#00ff00">+${Math.round(val*100)}%</span><br>近戰傷害 <span style="color:#ff5555">-30%</span> (Less)<br>重複攻擊一次`;
        }
        // [New Fix] Rn (Concentrated Effect)
        else if (def.effect.type === 'concentrated') {
            val = base + (growthMult * growth);
            text = `造成傷害 <span style="color:#00ff00">+${Math.round(val*100)}%</span> (More)<br>技能範圍 <span style="color:#ff5555">-30%</span> (Less)`;
        }
        else if (def.effect.type === 'multicast') {
             val = base + (growthMult * growth);
             text = `多重施法機率 <span style="color:#00ff00">+${Math.round(val*100)}%</span> (瞬間連發)`;
        }

        return { text: text, subText: "" };
    }
    return { text: "", subText: "" };
}

function updateInfoPanel(def, type, level = 1, shopObj=null) {
    const prefix = "dash";
    
    if(!def && !shopObj) {
        document.getElementById(prefix + '-info-name').innerText = "等待指令";
        document.getElementById(prefix + '-meta-row').innerHTML = `<span class="type-badge" style="color:#666; border-color:#333;">系統待機</span>`;
        document.getElementById(prefix + '-info-desc').innerText = "請選擇項目後，點擊右側融合槽進行配置。";
        document.getElementById(prefix + '-info-effect').innerText = "";
        return;
    }

    if(type === 'equipment' && shopObj) { 
        let item = shopObj.item.data;
        let tierColor = item.def.maxSockets >= 6 ? '#ffd700' : (item.def.maxSockets >= 4 ? '#00ccff' : '#fff');
        document.getElementById(prefix + '-info-name').innerHTML = `<span style="color:${tierColor}">${item.def.name}</span>`;
        document.getElementById(prefix + '-meta-row').innerHTML = `<span class="type-badge weapon-type">裝備</span> <span class="tag-pill">${item.type}</span>`;
        document.getElementById(prefix + '-info-desc').innerText = `品質: ${item.def.tier}\n最大擴充: ${item.def.maxSockets} 孔\n目前孔數: ${item.sockets.length}\n購買將存入裝備背包。`;
        document.getElementById(prefix + '-info-effect').innerText = "裝備可鑲嵌元素以發動技能。";
    } 
    else if (type === 'equipment') { 
        let item = def; 
        let tierColor = item.def.maxSockets >= 6 ? '#ffd700' : (item.def.maxSockets >= 4 ? '#00ccff' : '#fff');
        document.getElementById(prefix + '-info-name').innerHTML = `<span style="color:${tierColor}">${item.def.name}</span>`;
        document.getElementById(prefix + '-meta-row').innerHTML = `<span class="type-badge weapon-type">裝備</span> <span class="tag-pill">${item.type}</span>`;
        
        let hasGems = item.sockets.filter(s=>s.item).length;
        document.getElementById(prefix + '-info-desc').innerText = `品質: ${item.def.tier}\n最大擴充: ${item.def.maxSockets} 孔\n鑲嵌寶石: ${hasGems} 顆\n\n點擊右側裝備欄位可穿戴此裝備。`;
        document.getElementById(prefix + '-info-effect').innerText = "提示：穿戴時會自動交換當前裝備。";
    }
    else { 
        document.getElementById(prefix + '-info-name').innerText = `${def.s} ${def.cn} (Lv.${level})`;
        let metaRow = '';
        if(def.type === 'active') {
            metaRow += `<span class="type-badge active-type">主動技能</span>`;
            if(def.tags) def.tags.forEach(t => metaRow += `<span class="tag-pill">${t}</span>`);
        } else {
            metaRow += `<span class="type-badge support-type">輔助技能</span>`;
            if(def.supportTags) def.supportTags.forEach(t => metaRow += `<span class="tag-pill">${t==='all'?'通用':t}</span>`);
        }
        document.getElementById(prefix + '-meta-row').innerHTML = metaRow;
        document.getElementById(prefix + '-info-desc').innerText = def.desc || "標準化學元素素材。";
        let stats = calculateEffectStats(def, level);
        let effText = "";
        if(def.type === 'active') effText = `攻擊模式: ${def.attack.name}<br>${stats.text}`;
        if(def.type === 'support') effText = `效果: ${stats.text}`;
        document.getElementById(prefix + '-info-effect').innerHTML = effText;
    }
}

function updateCombatBar() {
    const bar = document.getElementById('combat-bar');
    bar.innerHTML = '';
    
    player.equipment.forEach((eq, eqIdx) => {
        if(!eq) return;
        eq.sockets.forEach((s, sIdx) => {
            if(s.item && s.item.def.type === 'active') {
                let slot = document.createElement('div');
                slot.className = 'skill-slot';
                slot.innerHTML = `<span class="icon">${s.item.def.s}</span><span class="lvl-badge">${s.item.level}</span>`;
                slot.onclick = (e) => {
                    e.stopPropagation();
                    showSkillDetailPopup(eq, sIdx);
                };
                bar.appendChild(slot);
            }
        });
    });
}

function showSkillDetailPopup(equip, sIdx) {
    const popup = document.getElementById('skill-detail-popup');
    const activeItem = equip.sockets[sIdx].item;
    const supports = getLinkedSupports(equip, sIdx); 

    let html = `
        <div class="sd-header">
            <div class="sd-icon">${activeItem.def.s}</div>
            <div>
                <div class="sd-title">${activeItem.def.cn} (Lv.${activeItem.level})</div>
                <div style="font-size:10px; color:#666; font-family:'Noto Sans TC';">${activeItem.def.attack.name}</div>
            </div>
        </div>
        <div class="sd-list">
    `;

    if(supports.length === 0) {
        html += `<div class="sd-item" style="color:#666; justify-content:center; font-family:'Noto Sans TC';">無有效輔助</div>`;
    } else {
        supports.forEach(sup => {
            let stats = calculateEffectStats(sup, sup.level);
            html += `
                <div class="sd-item">
                    <div class="dot"></div>
                    <div style="flex:1;">
                        <span style="color:#fff;">${sup.cn} (Lv.${sup.level})</span> <span style="color:#00ccff; font-size:10px;">${stats.text}</span>
                    </div>
                </div>
            `;
        });
    }
    html += `</div>`;

    popup.innerHTML = html;
    popup.style.display = 'block';
}

// --- [Updated] Gear & Inventory Viewer Logic (Replace previous version in uiHelpers.js) ---

// 1. 開啟裝備檢視器
function openGearViewer() {
    const modal = document.getElementById('gear-viewer-modal');
    if(!modal) return;
    
    const pauseOverlay = document.getElementById('pause-overlay');
    if(pauseOverlay && pauseOverlay.style.display !== 'none') {
        pauseOverlay.dataset.wasOpen = 'true';
        pauseOverlay.style.display = 'none';
    }

    modal.style.display = 'flex';
    
    // 預設開啟 Loadout 分頁
    switchGearView('loadout');
    
    // 重置資訊欄
    document.getElementById('gv-info-placeholder').style.display = 'flex';
    document.getElementById('gv-info-content').style.display = 'none';
}

// 2. 關閉裝備檢視器
function closeGearViewer() {
    const modal = document.getElementById('gear-viewer-modal');
    if(modal) modal.style.display = 'none';

    const pauseOverlay = document.getElementById('pause-overlay');
    if(pauseOverlay && pauseOverlay.dataset.wasOpen === 'true') {
        pauseOverlay.style.display = 'flex';
        delete pauseOverlay.dataset.wasOpen;
    }
}

// 3. 切換視圖分頁 (Loadout vs Inventory)
function switchGearView(viewName) {
    // 按鈕狀態更新
    document.getElementById('tab-btn-loadout').className = viewName === 'loadout' ? 'gv-tab active' : 'gv-tab';
    document.getElementById('tab-btn-inventory').className = viewName === 'inventory' ? 'gv-tab active' : 'gv-tab';

    // 顯示區域切換
    document.getElementById('gv-view-loadout').style.display = viewName === 'loadout' ? 'flex' : 'none';
    document.getElementById('gv-view-inventory').style.display = viewName === 'inventory' ? 'flex' : 'none';

    // 根據視圖渲染內容
    if(viewName === 'loadout') {
        renderGearViewerSlots();
    } else {
        renderGearViewerInventory();
    }
}

// 4. 渲染 [裝備中] 網格
function renderGearViewerSlots() {
    const container = document.getElementById('gv-slots-area');
    if(!container) return;
    container.innerHTML = '';

    EQUIP_SLOTS_DEF.forEach((slotDef, idx) => {
        const eq = player.equipment[idx];
        const card = document.createElement('div');
        card.className = 'gv-card';
        
        let equipName = eq ? eq.def.name : '未裝備';
        let equipColor = eq ? '#fff' : '#555';
        if(eq) {
            if(eq.def.maxSockets >= 6) equipColor = '#ffd700';
            else if(eq.def.maxSockets >= 4) equipColor = '#00ccff';
        }

        let html = `
            <div class="gv-card-header">
                <div class="gv-card-icon">${slotDef.icon}</div>
                <div style="overflow:hidden;">
                    <div style="font-size:10px; color:#888; font-family:'Orbitron'; text-transform:uppercase;">${slotDef.name}</div>
                    <div style="font-weight:bold; color:${equipColor}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${equipName}</div>
                </div>
            </div>
        `;

        let socketsHtml = `<div class="gv-socket-row">`;
        if(eq) {
            eq.sockets.forEach((s, sIdx) => {
                let gemHtml = '';
                let socketClass = 'gv-socket';
                
                if(s.item) {
                    if(s.item.def.type === 'active') socketClass += ' active';
                    else socketClass += ' support';
                    gemHtml = `<span style="font-size:12px; font-weight:bold; color:#fff;">${s.item.def.s}</span>`;
                } else {
                    gemHtml = `<span style="font-size:10px; color:#333;">○</span>`;
                }
                
                // data 屬性用於點擊事件
                socketsHtml += `<div class="${socketClass}" data-slot-idx="${idx}" data-socket-idx="${sIdx}">${gemHtml}</div>`;
            });
        } else {
            socketsHtml += `<span style="font-size:10px; color:#444;">-- EMPTY SLOT --</span>`;
        }
        socketsHtml += `</div>`;

        card.innerHTML = html + socketsHtml;

        // 點擊裝備本體
        card.onclick = () => {
            document.querySelectorAll('.gv-card, .gv-inv-item').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            displayGearDetail(eq, 'equipment');
        };

        container.appendChild(card);
    });

    // 點擊鑲嵌的寶石
    container.querySelectorAll('.gv-socket').forEach(sock => {
        sock.onclick = (e) => {
            e.stopPropagation();
            const slotIdx = sock.dataset.slotIdx;
            const socketIdx = sock.dataset.socketIdx;
            const eq = player.equipment[slotIdx];
            if(eq && eq.sockets[socketIdx].item) {
                // 強調顯示：重置所有選取，並在 UI 上標示當前查看的是寶石
                document.querySelectorAll('.gv-card, .gv-inv-item').forEach(c => c.classList.remove('selected'));
                // 這裡我們不特別標記 DOM，直接顯示資訊
                displayGearDetail(eq.sockets[socketIdx].item, 'element');
            }
        };
    });
}

// 5. [New] 渲染 [背包] 網格
function renderGearViewerInventory() {
    const container = document.getElementById('gv-inventory-area');
    if(!container) return;
    container.innerHTML = '';

    if(player.inventory.length === 0) {
        container.innerHTML = `<div style="width:100%; text-align:center; color:#555; padding:20px;">背包是空的</div>`;
        return;
    }

    // 複製並排序 (裝備 -> 主動 -> 輔助)
    let sortedInv = [...player.inventory].sort((a, b) => {
        let typeOrder = { 'equipment': 1, 'main_1h': 1, 'main_2h': 1, 'active': 2, 'support': 3 };
        let ta = a.slotId ? 'equipment' : a.type; // 處理裝備類型的判斷
        let tb = b.slotId ? 'equipment' : b.type;
        return (typeOrder[ta] || 99) - (typeOrder[tb] || 99);
    });

    sortedInv.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gv-inv-item';
        
        let icon = '';
        let name = '';
        let subInfo = '';
        let color = '#fff';

        if(item.slotId || item.type === 'equipment' || item.type === 'main_1h' || item.type === 'main_2h') {
            // 裝備
            icon = item.def.icon;
            name = item.def.name;
            subInfo = `<span style="color:#aaa;">${item.sockets.length}孔</span>`;
            if(item.def.maxSockets >= 6) color = '#ffd700';
            else if(item.def.maxSockets >= 4) color = '#00ccff';
        } else {
            // 元素 (Active/Support)
            icon = item.def.s;
            name = item.def.cn;
            subInfo = `<div class="gv-inv-lvl">Lv.${item.level}</div>`;
            color = item.def.type === 'active' ? '#ff5555' : '#55ff55';
            
            // 加入等級顯示在樣式中
            div.style.borderColor = color;
        }

        div.innerHTML = `
            <div class="gv-inv-icon" style="color:${color}; font-family:'Orbitron'">${icon}</div>
            <div class="gv-inv-name">${name}</div>
            ${subInfo}
        `;

        div.onclick = () => {
            document.querySelectorAll('.gv-card, .gv-inv-item').forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
            
            // 判斷類型並顯示
            if(item.slotId || item.type.includes('main')) {
                displayGearDetail(item, 'equipment');
            } else {
                displayGearDetail(item, 'element');
            }
        };

        container.appendChild(div);
    });
}

// 6. 顯示詳細資訊 (包含正確的數值計算)
function displayGearDetail(item, type) {
    const placeholder = document.getElementById('gv-info-placeholder');
    const content = document.getElementById('gv-info-content');
    
    if(!item) {
        placeholder.style.display = 'flex';
        content.style.display = 'none';
        return;
    }

    placeholder.style.display = 'none';
    content.style.display = 'flex';

    const title = document.getElementById('gv-info-title');
    const badges = document.getElementById('gv-info-badges');
    const typeTxt = document.getElementById('gv-info-type');
    const desc = document.getElementById('gv-info-desc');
    const stats = document.getElementById('gv-info-stats');

    if(type === 'equipment') {
        title.innerText = item.def.name;
        title.style.color = item.def.maxSockets >= 6 ? '#ffd700' : (item.def.maxSockets >= 4 ? '#00ccff' : '#fff');
        
        badges.innerHTML = `<span class="type-badge weapon-type">EQUIPMENT</span>`;
        
        let partName = item.slotId ? item.slotId.toUpperCase() : 'UNKNOWN';
        typeTxt.innerHTML = `<span style="color:#aaa;">部位: </span> ${partName} <span style="color:#666;">|</span> <span style="color:#aaa;">TIER: </span> ${item.def.tier || 'Standard'}`;
        
        desc.innerText = item.def.desc || "無特別說明的標準制式裝備。";
        
        let sCount = item.sockets.length;
        let lCount = item.links.length;
        let usedS = item.sockets.filter(s=>s.item).length;
        
        stats.innerHTML = `
            <div class="stat-row"><span class="stat-label">最大插槽:</span> <span class="stat-highlight" style="color:#fff">${item.def.maxSockets}</span></div>
            <div class="stat-row"><span class="stat-label">當前孔數:</span> <span class="stat-highlight" style="color:#fff">${sCount}</span></div>
            <div class="stat-row"><span class="stat-label">已鑲嵌:</span> <span class="stat-highlight" style="color:${usedS>0?'#0f0':'#888'}">${usedS}</span></div>
            <div class="stat-row"><span class="stat-label">能量連結:</span> <span class="stat-highlight" style="color:#d4af37">${lCount}</span></div>
        `;

    } else if (type === 'element') {
        // 顯示元素詳細資訊 (包含數值計算)
        title.innerText = `${item.def.cn} ${item.def.n}`;
        title.style.color = item.def.type === 'active' ? '#ff5555' : '#55ff55';
        
        badges.innerHTML = `<span class="tag-pill" style="background:#222; border:1px solid #777;">Lv.${item.level}</span>`;
        
        let typeBadge = item.def.type === 'active' 
            ? `<span class="type-badge active-type">ACTIVE SKILL</span>` 
            : `<span class="type-badge support-type">SUPPORT</span>`;
        
        typeTxt.innerHTML = typeBadge;
        desc.innerText = item.def.desc || "標準元素核心。";
        
        // [Key Update] 呼叫 calculateEffectStats 並傳入正確的 item.level
        // 這會確保返回的文字描述包含等級加成後的數值
        let effectData = calculateEffectStats(item.def, item.level);
        
        let extraInfo = "";
        if(item.def.type === 'active') {
            extraInfo = `
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);">
                    <div class="stat-row"><span class="stat-label">攻擊模式:</span> <span style="color:#fff;">${item.def.attack.name}</span></div>
                    <div style="margin-top:5px; font-size:12px; color:#888;">${item.def.tags ? item.def.tags.join(' • ') : ''}</div>
                </div>`;
        } else {
             extraInfo = `
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);">
                    <div style="margin-top:5px; font-size:12px; color:#888;">支援標籤: ${item.def.supportTags ? item.def.supportTags.join(' • ') : 'All'}</div>
                </div>`;
        }
        
        stats.innerHTML = effectData.text + extraInfo;
    }
}