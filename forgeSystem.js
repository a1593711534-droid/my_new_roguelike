// --- forgeSystem.js ---
// 鍛造系統、裝備管理與寶石融合
// [Patch] Revised UI: Fusion Multi-select, No Group Check, Destroy on Fail
// [Patch] Fixed Socket Click Interaction

function renderForge() {
    const sel = document.getElementById('equipment-list-v'); sel.innerHTML = '';
    const statusHeader = document.getElementById('forge-status-header');
    
    // 渲染右側裝備欄
    EQUIP_SLOTS_DEF.forEach((slotDef, idx) => {
        let eq = player.equipment[idx];
        let isSelected = (forgeState.mode === 'equipped' && forgeState.equipSlotIdx === idx);
        
        let div = document.createElement('div'); 
        div.className = 'e-icon-box' + (isSelected ? ' selected' : '');
        
        // 檢查是否處於 "待確認裝備" 狀態
        let isPendingThisSlot = (forgeState.pendingEquip && forgeState.pendingEquip.slotIdx === idx);

        let isLocked = false;
        if(slotDef.id === 'off' && player.equipment[4] && player.equipment[4].type === 'main_2h') {
            isLocked = true;
            div.classList.add('locked');
            div.innerHTML = `<span style="font-size:12px; color:#555;">🚫</span>`;
        } else if(eq) {
            div.innerHTML = `${eq.def.icon}<div class="slot-label">${slotDef.name}</div>`;
            let borderC = '#333';
            if(eq.def.maxSockets >= 6) borderC = '#aa8800';
            else if(eq.def.maxSockets >= 4) borderC = '#006699';
            div.style.borderColor = borderC;
        } else {
            div.innerHTML = `<span style="opacity:0.2">${slotDef.icon}</span><div class="slot-label">${slotDef.name}</div>`;
        }

        // 如果是待確認狀態，覆蓋顯示勾勾按鈕
        if (isPendingThisSlot) {
            div.classList.add('pending-state');
            div.innerHTML += `<div class="action-check-btn" onclick="event.stopPropagation(); executePendingAction()">✔</div>`;
        }

        if(!isLocked) {
            div.onclick = (e) => { 
                e.stopPropagation(); 
                
                // 邏輯修改：如果有選中的背包裝備
                if (forgeState.selectedInvUuid) {
                    let invItem = player.inventory.find(i => i.uuid === forgeState.selectedInvUuid);
                    if (invItem && invItem.slotId) { 
                        // 檢查部位是否符合
                        let canEquip = false;
                        if (invItem.slotId === slotDef.id) canEquip = true;
                        if (invItem.slotId === 'main' && slotDef.id === 'main') canEquip = true;
                        if (slotDef.id === 'off' && invItem.type === 'main_1h') canEquip = true;

                        if (canEquip) {
                            if (!player.equipment[idx]) {
                                equipGear(idx, invItem);
                                forgeState.selectedInvUuid = null; 
                            } else {
                                forgeState.pendingEquip = { slotIdx: idx, invUuid: invItem.uuid };
                                forgeState.pendingSocket = null; 
                                showToast("點擊勾勾確認替換");
                            }
                            
                            renderForge(); 
                            renderInventoryStrip(); 
                            return; 
                        } else {
                            showToast(`部位不符: 需要 ${slotDef.name}`);
                            return;
                        }
                    }
                }

                // 一般選取邏輯
                forgeState.mode = 'equipped';
                forgeState.equipSlotIdx = idx; 
                forgeState.targetUuid = null;
                forgeState.selectedSocketIdx = -1; 
                forgeState.pendingEquip = null;
                forgeState.pendingSocket = null;
                
                updateInfoPanel(null, null);
                renderForge(); 
                renderInventoryStrip(); 
            };
        }
        sel.appendChild(div);
    });

    let targetItem = null;
    let targetName = "";
    
    if (forgeState.mode === 'equipped') {
        targetItem = player.equipment[forgeState.equipSlotIdx];
        let slotName = EQUIP_SLOTS_DEF[forgeState.equipSlotIdx].name;
        targetName = `[已裝備] ${slotName}`;
        if(targetItem) targetName += ` - ${targetItem.def.name}`;
    } else if (forgeState.mode === 'inventory' && forgeState.targetUuid) {
        targetItem = player.inventory.find(i => i.uuid === forgeState.targetUuid);
        if(targetItem) targetName = `[背包] ${targetItem.def.name}`;
        else {
            forgeState.mode = 'equipped';
            forgeState.equipSlotIdx = 4;
            renderForge(); return;
        }
    }

    statusHeader.innerText = targetName;
    statusHeader.style.color = (forgeState.mode === 'inventory') ? '#ffd700' : '#888';
    statusHeader.style.borderColor = (forgeState.mode === 'inventory') ? '#ffd700' : '#333';

    const area = document.getElementById('socket-area'); area.innerHTML = '';
    const btnUnsocket = document.getElementById('btn-unsocket-gem');
    const btnUnequip = document.getElementById('btn-unequip-gear');
    
    if(!targetItem) {
        area.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#444;font-size:12px;flex-direction:column;"><span>空欄位</span><span style="font-size:9px;color:#333;margin-top:5px;">請選擇裝備</span></div>';
        if(btnUnsocket) btnUnsocket.disabled = true;
        if(btnUnequip) btnUnequip.disabled = true;
        return;
    }
    
    if(btnUnequip) {
        if (forgeState.mode === 'inventory') {
            btnUnequip.disabled = true;
            btnUnequip.classList.remove('btn-danger');
        } else {
            btnUnequip.disabled = false;
            btnUnequip.classList.add('btn-danger');
        }
    }

    const cx = 85, cy = 85, r = 55; 
    
    // Render Links
    targetItem.links.forEach(l => {
        if(l[0]<targetItem.sockets.length && l[1]<targetItem.sockets.length) {
            let n = targetItem.sockets.length;
            let a1 = (l[0]/n)*Math.PI*2 - Math.PI/2;
            let a2 = (l[1]/n)*Math.PI*2 - Math.PI/2;
            let x1 = cx + Math.cos(a1)*r, y1 = cy + Math.sin(a1)*r;
            let x2 = cx + Math.cos(a2)*r, y2 = cy + Math.sin(a2)*r;

            let dx=x2-x1, dy=y2-y1, dist=Math.hypot(dx,dy), ang=Math.atan2(dy,dx);
            let line = document.createElement('div'); line.className = 'link-line';
            line.style.width=dist+'px'; line.style.left=x1+'px'; line.style.top=y1+'px'; line.style.transform=`rotate(${ang}rad)`;
            if(targetItem.sockets[l[0]].item && targetItem.sockets[l[1]].item) line.classList.add('active');
            area.appendChild(line);
        }
    });

    let socketCount = targetItem.sockets.length;
    targetItem.sockets.forEach((s, idx) => {
        let angle = (idx / socketCount) * Math.PI * 2 - Math.PI / 2;
        let px = cx + Math.cos(angle) * r;
        let py = cy + Math.sin(angle) * r;

        let div = document.createElement('div'); 
        div.className = 'socket' + (s.item?' has-item':'') + (forgeState.selectedSocketIdx===idx?' selected':'');
        div.style.left=(px-17)+'px'; div.style.top=(py-17)+'px'; 
        
        let isPendingThisSocket = (forgeState.pendingSocket && forgeState.pendingSocket.socketIdx === idx);

        if(s.item) {
            let gemClass = 'gem';
            if(s.item.def.type === 'active') gemClass += ' active';
            if(s.item.def.type === 'support') gemClass += ' support';
            let gem = document.createElement('div'); 
            gem.className=gemClass; 
            gem.innerHTML=`${s.item.def.s}<div class="gem-lvl">${s.item.level}</div>`; 
            div.appendChild(gem);
        }

        if (isPendingThisSocket) {
             div.classList.add('pending-state');
             div.innerHTML += `<div class="action-check-btn small" onclick="event.stopPropagation(); executePendingAction()">✔</div>`;
        }

        div.onclick = (e) => { e.stopPropagation(); socketClick(idx); };
        area.appendChild(div);
    });
    
    if(forgeState.selectedSocketIdx !== -1 && targetItem.sockets[forgeState.selectedSocketIdx].item) {
        if(btnUnsocket) {
            btnUnsocket.disabled = false;
            btnUnsocket.classList.add('btn-danger');
        }
    } else {
        if(btnUnsocket) {
            btnUnsocket.disabled = true;
            btnUnsocket.classList.remove('btn-danger');
        }
    }
}

function executePendingAction() {
    if (forgeState.pendingEquip) {
        let invItem = player.inventory.find(i => i.uuid === forgeState.pendingEquip.invUuid);
        if(invItem) {
            equipGear(forgeState.pendingEquip.slotIdx, invItem);
        }
        forgeState.pendingEquip = null;
        forgeState.selectedInvUuid = null; 
    } 
    else if (forgeState.pendingSocket) {
        let eq = getTargetItem();
        let invIdx = player.inventory.findIndex(inv => inv.uuid === forgeState.pendingSocket.invUuid);
        let socketIdx = forgeState.pendingSocket.socketIdx;

        if (eq && invIdx > -1 && socketIdx > -1) {
            if (eq.sockets[socketIdx].item) {
                 eq.sockets[socketIdx].item.timestamp = Date.now();
                 player.inventory.push(eq.sockets[socketIdx].item);
            }
            eq.sockets[socketIdx].item = player.inventory[invIdx];
            player.inventory.splice(invIdx, 1);
            showToast("鑲嵌成功");
        }
        
        forgeState.pendingSocket = null;
        forgeState.selectedInvUuid = null;
        forgeState.selectedSocketIdx = socketIdx;
        
        if (eq && eq.sockets[socketIdx].item) {
            updateInfoPanel(eq.sockets[socketIdx].item.def, 'element', eq.sockets[socketIdx].item.level);
        }
        updateCombatBar();
    }

    renderForge();
    renderInventoryStrip();
}

function getTargetItem() {
    if (forgeState.mode === 'inventory') {
        return player.inventory.find(i => i.uuid === forgeState.targetUuid);
    } else {
        return player.equipment[forgeState.equipSlotIdx];
    }
}

function socketClick(idx) {
    const eq = getTargetItem();
    if(!eq || idx >= eq.sockets.length) return;

    shopState.selectedIdx = -1; renderShopTab();

    // [修改] 需求 6: 修正點選鑲嵌區的邏輯
    // 如果有選中的 "背包裝備" (slotId存在)，這是不合理操作 (裝備不能鑲嵌進孔)，
    // 原本會擋住並報錯，現在改為「忽略該選取」，直接視為使用者想點擊鑲孔 (查看/選中孔)
    if (forgeState.selectedInvUuid) {
        let invItem = player.inventory.find(inv => inv.uuid === forgeState.selectedInvUuid);
        if (invItem && invItem.slotId) {
             // 默默清除裝備選取，不跳警告，直接進入下方的 Socket 選取邏輯
             forgeState.selectedInvUuid = null;
        }
    }

    // 正常的鑲嵌邏輯
    if (forgeState.selectedInvUuid) {
        let invItem = player.inventory.find(inv => inv.uuid === forgeState.selectedInvUuid);
        if (invItem && !invItem.slotId) { // 確保是元素
             
             if (!eq.sockets[idx].item) {
                 let invIdx = player.inventory.findIndex(inv => inv.uuid === forgeState.selectedInvUuid);
                 if (invIdx > -1) {
                     eq.sockets[idx].item = player.inventory[invIdx];
                     player.inventory.splice(invIdx, 1);
                     showToast("鑲嵌成功");
                     
                     forgeState.selectedInvUuid = null; 
                     forgeState.selectedSocketIdx = idx; 
                     updateInfoPanel(eq.sockets[idx].item.def, 'element', eq.sockets[idx].item.level);
                     updateCombatBar();
                     renderForge();
                     renderInventoryStrip();
                     return;
                 }
             } else {
                 forgeState.pendingSocket = { socketIdx: idx, invUuid: invItem.uuid };
                 forgeState.pendingEquip = null;
                 forgeState.selectedSocketIdx = -1;
                 renderForge();
                 showToast("點擊勾勾確認替換");
                 return;
             }
        }
    }

    // 點擊 Socket 查看資訊
    if(eq.sockets[idx].item) {
        forgeState.selectedSocketIdx = idx;
        forgeState.selectedInvUuid = null; 
        forgeState.pendingSocket = null; 
        
        updateInfoPanel(eq.sockets[idx].item.def, 'element', eq.sockets[idx].item.level);
        
        if(forgeState.mode === 'equipped' && eq.sockets[idx].item.def.type === 'active') {
            let linked = getLinkedSupports(eq, idx);
            let eff = document.getElementById('dash-info-effect');
            if(linked.length > 0) {
                 eff.innerHTML += "<br><br><span style='color:#d4af37'>[已生效連結]:</span>";
                 linked.forEach(e => { 
                     let stats = calculateEffectStats(e, e.level);
                     eff.innerHTML += `<br>+ ${e.cn} Lv.${e.level}: ${stats.text}`; 
                 });
            }
        }
        renderForge();
        renderInventoryStrip();
    }
    else {
        // 點擊空孔 (且沒選寶石)
        forgeState.selectedSocketIdx = idx;
        forgeState.selectedInvUuid = null;
        forgeState.pendingSocket = null;
        updateInfoPanel(null, null);
        renderForge(); renderInventoryStrip();
    }
}

function equipGear(slotIdx, invItem) {
    let invIdx = player.inventory.findIndex(i => i.uuid === invItem.uuid);
    if(invIdx === -1) return;
    player.inventory.splice(invIdx, 1); 

    let oldEquip = player.equipment[slotIdx];
    
    if(invItem.type === 'main_2h') {
        if(oldEquip) player.inventory.push(oldEquip);
        let offhand = player.equipment[5];
        if(offhand) {
            player.inventory.push(offhand);
            player.equipment[5] = null;
            showToast("雙手武器佔用副手，已自動卸下");
        }
    } 
    else if (slotIdx === 5) { 
        if(player.equipment[4] && player.equipment[4].type === 'main_2h') {
            player.inventory.push(player.equipment[4]);
            player.equipment[4] = null;
            showToast("卸下雙手武器以裝備副手");
        }
        if(oldEquip) player.inventory.push(oldEquip);
    }
    else {
        if(oldEquip) player.inventory.push(oldEquip);
    }

    player.equipment[slotIdx] = invItem;
    
    forgeState.mode = 'equipped';
    forgeState.targetUuid = null;
    forgeState.selectedInvUuid = null;
    forgeState.equipSlotIdx = slotIdx;
    
    showToast(`已裝備: ${invItem.def.name}`);
    updateCombatBar();
    renderForge();
    renderInventoryStrip();
}

function unequipGear() {
    if (forgeState.mode === 'inventory') return; 

    let slotIdx = forgeState.equipSlotIdx;
    let eq = player.equipment[slotIdx];
    if(!eq) return;

    eq.timestamp = Date.now(); 
    player.inventory.push(eq);
    player.equipment[slotIdx] = null;

    showToast("裝備已卸下");
    forgeState.selectedSocketIdx = -1;
    updateInfoPanel(null, null);
    
    updateCombatBar();
    renderForge();
    renderInventoryStrip();
}

function unsocketItem() {
    const eq = getTargetItem();
    let idx = forgeState.selectedSocketIdx;
    if(eq && idx !== -1 && eq.sockets[idx].item) {
        let newItem = eq.sockets[idx].item;
        newItem.timestamp = Date.now();
        player.inventory.push(newItem);
        
        eq.sockets[idx].item = null;
        forgeState.selectedSocketIdx = -1;
        updateInfoPanel(null, null);
        renderForge();
        renderInventoryStrip();
        showToast("寶石已拆卸");
    }
}

function forgeAction(type) {
    let eq = getTargetItem();
    if(!eq) return;

    if(type==='socket') {
        if(player.gold < 100) { showToast("金幣不足"); return; }
        let maxS = eq.def.maxSockets;
        player.gold -= 100;
        eq.sockets.forEach(s => { 
            if(s.item) { s.item.timestamp = Date.now(); player.inventory.push(s.item); }
        });
        
        let n = Math.floor(Math.random() * maxS) + 1;
        if(Math.random() < 0.1) n = maxS;

        eq.sockets=[]; for(let k=0; k<n; k++) eq.sockets.push({item:null});
        eq.links=[]; for(let k=0; k<n-1; k++) if(Math.random()<0.5) eq.links.push([k,k+1]);
        showToast(`洗孔完成: ${n}孔`);
    } else {
        if(player.gold < 80) { showToast("金幣不足"); return; }
        player.gold -= 80;
        eq.links=[];
        for(let k=0; k<eq.sockets.length-1; k++) if(Math.random()<0.6) eq.links.push([k,k+1]);
        showToast("鏈路重置");
    }
    
    document.getElementById('shop-gold-display').innerText = player.gold;
    forgeState.selectedSocketIdx = -1;
    updateInfoPanel(null, null);
    renderForge();
    renderInventoryStrip();
}

// [修改] 融合區點擊主體邏輯 (4a)
function placeSelectionInFusion(slotType) {
    if (slotType !== 'main') return;

    let selectedItem = null;
    let source = null;

    // 嘗試從當前選取中獲取物件
    if (forgeState.selectedInvUuid) {
        selectedItem = player.inventory.find(i => i.uuid === forgeState.selectedInvUuid);
        if(selectedItem && selectedItem.slotId) {
             showToast("裝備無法進行融合"); return;
        }
        source = 'inv';
    } else if (forgeState.selectedSocketIdx !== -1) {
        let eq = getTargetItem();
        if (eq && eq.sockets[forgeState.selectedSocketIdx].item) {
            selectedItem = eq.sockets[forgeState.selectedSocketIdx].item;
            source = 'socket';
        }
    }

    // 邏輯: 
    // 1. 如果有選取物件 -> 放入主體 (若已有主體則替換)
    // 2. 如果沒有選取物件，且目前主體有東西 -> 清空主體 (4a: 再點一次清空)
    
    if (selectedItem) {
        if (selectedItem.level >= 20) {
            showToast("該核心已達最大等級 (Lv.20)");
            return;
        }
        
        // 設定主體
        fusionState.main = { item: selectedItem, source: source, socketIdx: forgeState.selectedSocketIdx };
        // 切換主體時，清空素材
        fusionState.subs = [];
        
        // 清除原本的選取狀態，讓畫面更乾淨
        forgeState.selectedInvUuid = null;
        forgeState.selectedSocketIdx = -1;
        
        renderFusionUI();
        renderInventoryStrip(); // 更新背包顯示 (高亮主體)
        
    } else {
        // 沒選東西，點擊主體 -> 清空
        if (fusionState.main) {
            fusionState.main = null;
            fusionState.subs = [];
            renderFusionUI();
            renderInventoryStrip();
        }
    }
}

// [修改] 融合 UI 渲染 (移除等級預覽, 支援多素材列表)
function renderFusionUI() {
    const fMain = document.getElementById('f-main');
    fMain.className = fusionState.main ? 'f-slot filled' : 'f-slot';
    
    // 渲染主體
    let mainHtml = '<span style="font-size:10px;color:#555;">空</span>';
    if(fusionState.main) {
        mainHtml = `<span style="font-size:24px;color:#fff">${fusionState.main.item.def.s}</span><span style="font-size:10px;color:#aaa">Lv${fusionState.main.item.level}</span>`;
        if(fusionState.main.source === 'socket') mainHtml += `<div class="el-equip" style="top:-5px; right:-5px; left:auto;">E</div>`;
    }
    fMain.innerHTML = mainHtml;

    // 渲染素材列表 (4b)
    const listContainer = document.getElementById('f-materials-list');
    listContainer.innerHTML = '';
    
    if (fusionState.subs.length === 0) {
         if (fusionState.main) {
             listContainer.innerHTML = '<span style="font-size:10px; color:#666; margin-top:10px;">請點擊背包選取素材</span>';
         } else {
             listContainer.innerHTML = '<span style="font-size:10px; color:#444; margin-top:10px;">請先設定主體</span>';
         }
    } else {
        fusionState.subs.forEach(sub => {
            let div = document.createElement('div');
            div.className = 'f-sub-icon'; // 需要在 CSS 定義或直接用 style
            div.style.cssText = "width:30px; height:30px; background:rgba(0,0,0,0.5); border:1px solid #d4af37; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; margin:2px;";
            div.innerHTML = `<span style="font-size:12px; font-weight:bold; color:#fff;">${sub.def.s}</span><span style="font-size:8px; color:#aaa;">${sub.level}</span>`;
            listContainer.appendChild(div);
        });
    }

    // 移除預覽 (3) - 這裡不做任何預測顯示
    document.getElementById('fusion-msg').innerText = "";
    
    // 按鈕狀態
    let canFuse = (fusionState.main && fusionState.subs.length > 0);
    document.getElementById('btn-fuse-confirm').disabled = !canFuse;
    document.getElementById('btn-fuse-cancel').disabled = (fusionState.subs.length === 0);
}

// [修改] 融合執行 (5: 無族群檢查, 失敗銷毀)
function doFusion() {
    if(!fusionState.main || fusionState.subs.length === 0) return;
    
    let mainItem = fusionState.main.item;
    let successCount = 0;
    let failCount = 0;
    
    // 複製一份，因為要操作 inventory
    let subsProcess = [...fusionState.subs];

    subsProcess.forEach(subItem => {
         let subUuid = subItem.uuid;
         
         // 判斷是否同族 (5: 不提示，直接判斷)
         let isSameGroup = (mainItem.def.g === subItem.def.g);
         
         if (isSameGroup) {
             // 成功: 提升等級 (這裡簡單做: 加總等級，但有上限)
             let gain = subItem.level;
             mainItem.level += gain;
             if(mainItem.level > 20) mainItem.level = 20;
             successCount++;
         } else {
             // 失敗: 銷毀
             failCount++;
             // 可以加入銷毀特效 (這裡用 Toast 簡單呈現)
         }

         // 從背包移除素材
         let idx = player.inventory.findIndex(i => i.uuid === subUuid);
         if(idx !== -1) {
             player.inventory.splice(idx, 1);
         }
    });

    // 結算訊息
    if(successCount > 0 && failCount === 0) {
        showToast(`融合成功! 等級提升`);
    } else if (successCount > 0 && failCount > 0) {
        showToast(`部分成功! ${failCount} 個素材因排斥而損毀`);
    } else {
        showToast(`融合失敗! ${failCount} 個素材全部損毀`);
    }

    // 清空素材，保留主體 (4c 邏輯的延伸: 執行後也清空素材)
    fusionState.subs = [];
    
    // 更新介面
    renderFusionUI();
    renderInventoryStrip();
    renderForge(); // 如果主體是鑲嵌中的，更新其數值顯示
    updateCombatBar();
}

// [修改] 取消融合 (4c)
function cancelFusion() {
    // 僅清空素材，保留主體
    fusionState.subs = [];
    renderFusionUI();
    renderInventoryStrip(); // 更新背包選取狀態
}