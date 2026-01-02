// --- main.js ---
// 遊戲入口、輸入控制、主迴圈
// [Patch] Added Global Click Handler for clearing UI selections (Click empty space logic)

const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');
let SCREEN_W, SCREEN_H;

let gameState = 'INIT';
let player = {
    x: 0, y: 0, radius: 12, speed: 4, hp: 100, maxHp: 100,
    xp: 0, nextLvlXp: 50, level: 1, gold: 0, kills: 0, 
    inventory: [], 
    // [修改] 改為 6 格固定裝備欄 (對應 systems.js 的 EQUIP_SLOTS_DEF)
    // 0:Head, 1:Body, 2:Gloves, 3:Legs, 4:Main, 5:Off
    equipment: [null, null, null, null, null, null],
    facing: -Math.PI / 2,
    
    // [New] 閃避相關參數
    isDashing: false,
    dashTimer: 0,      // 閃避持續時間
    dashCooldown: 0,   // 冷卻時間
    maxDashCooldown: 2.0, // 冷卻秒數
    dashDuration: 0.25,   // 閃避動作秒數
    dashSpeedMult: 3.5,   // 閃避速度倍率
    dashVec: {x:0, y:0}   // 鎖定閃避方向
};

let lastTime=0;
let joy = { active: false, id: null, start:{x:0,y:0}, vec:{x:0,y:0} };
let keys = { w:false, a:false, s:false, d:false, space:false };
let isGameInitialized = false;

function init() {
    const list = document.getElementById('start-cards');
    if(!list) return; 

    if(isGameInitialized) return;
    isGameInitialized = true;

    window.addEventListener('resize', resize); 
    resize();
    initInput();
    
    list.innerHTML = '';
    
    // [UI Beautify] 增強初始選擇卡片的渲染
    STARTERS.forEach(s => {
        let def = ELEMENTS_DB.find(e => e.id === s.elId);
        if(!def) return;

        let div = document.createElement('div');
        div.className = 'card start-card'; 
        
        let tagsHtml = '';
        if(def.tags) {
            def.tags.forEach(t => tagsHtml += `<span class="tag-pill tiny">${t}</span>`);
        }

        div.innerHTML = `
            <div class="start-card-header">
                <div class="el-symbol large">${s.icon}</div>
                <div class="start-card-title">
                    <div class="el-cn" style="font-size:16px; color:#fff;">${s.name}</div>
                    <div style="font-size:10px; color:#888;">${def.n}</div>
                </div>
            </div>
            <div class="start-card-body">
                <div class="el-desc" style="font-size:12px; color:#ccc; margin-bottom:8px; line-height:1.4;">${def.desc}</div>
                <div style="display:flex; flex-wrap:wrap; gap:4px;">${tagsHtml}</div>
            </div>
        `;
        div.onclick = () => startGame(s.elId);
        list.appendChild(div);
    });
    
    // 全域點擊監聽 (處理 "點擊空白處取消選取")
    window.addEventListener('click', (e) => {
        // 只有在商店模式下才需要此邏輯
        if(gameState !== 'SHOP') return;

        // 檢查是否點擊了卡片、按鈕、裝備格、插槽等互動元素
        // 如果使用了 .closest() 找不到這些元素，代表點到了背景/空白處
        if(!e.target.closest('.card') && 
           !e.target.closest('.inv-item') && 
           !e.target.closest('.e-icon-box') && 
           !e.target.closest('.socket') && 
           !e.target.closest('.btn') && 
           !e.target.closest('.action-check-btn') && 
           !e.target.closest('.f-slot')) 
        {
            // 清除 Forge 相關的選取與 Pending 狀態
            let needsUpdate = false;
            
            if(forgeState.selectedInvUuid !== null) { forgeState.selectedInvUuid = null; needsUpdate = true; }
            if(forgeState.pendingEquip !== null) { forgeState.pendingEquip = null; needsUpdate = true; }
            if(forgeState.pendingSocket !== null) { forgeState.pendingSocket = null; needsUpdate = true; }
            if(shopState.selectedIdx !== -1) { shopState.selectedIdx = -1; needsUpdate = true; }
            
            // 如果有變更，重新渲染
            if(needsUpdate) {
                updateInfoPanel(null, null);
                renderInventoryStrip();
                renderForge();
                renderShopTab();
            }
        }
    });

    // 點擊空白處關閉技能詳情
    const closePopup = (e) => {
        if(!e.target.closest('#skill-detail-popup') && !e.target.closest('.skill-slot')) {
            document.getElementById('skill-detail-popup').style.display='none';
        }
    };
    document.addEventListener('touchstart', closePopup);
    document.addEventListener('click', closePopup);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
window.onload = () => setTimeout(init, 100);

function resize() {
    SCREEN_W = window.innerWidth; SCREEN_H = window.innerHeight;
    CANVAS.width = SCREEN_W; CANVAS.height = SCREEN_H;
}

// [修改] main.js
// 初始裝備改為 main_1h_generic

function startGame(elId) {
    player.gold = 9999999; 
    player.level = 1;
    player.xp = 0;
    player.nextLvlXp = 50;
    player.kills = 0;
    // 重置裝備欄
    player.equipment = [null, null, null, null, null, null];
    player.inventory = [];
    player.facing = -Math.PI / 2;
    // 重置閃避狀態
    player.isDashing = false;
    player.dashTimer = 0;
    player.dashCooldown = 0;

    currentWave = 1;
    
    // [修改] 創建初始裝備 (單手通用)
    let startWeapon = createEquipmentInstance('main_1h_generic');
    startWeapon.def.name = "新手短杖";
    let elDef = ELEMENTS_DB.find(e => e.id === elId);
    startWeapon.sockets[0].item = createInvItem(elDef, 1);
    
    // 裝備到主手 (Index 4)
    player.equipment[4] = startWeapon;
    
    player.x = SCREEN_W/2; player.y = SCREEN_H/2;
    document.getElementById('start-modal').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('dash-btn').style.display = 'flex'; // 顯示閃避按鈕
    
    startWave(1);
    
    lastTime = performance.now(); 
    loop(lastTime);
}

function restartGame() {
    location.reload();
}

function gameOver() {
    gameState = 'GAMEOVER'; document.getElementById('gameover-modal').style.display='flex';
    document.getElementById('dash-btn').style.display = 'none'; // 隱藏按鈕
    document.getElementById('score-time').innerText = `Wave ${currentWave}`;
    document.getElementById('score-kills').innerText = player.kills;
}

function initInput() {
    // 1. Joystick
    const area = document.getElementById('joystick-area');
    const base = document.getElementById('joy-base');
    const stick = document.getElementById('joy-stick');
    
    // 2. Dash Button
    const dashBtn = document.getElementById('dash-btn');

    // Keyboard Events
    window.addEventListener('keydown', e => {
        if(gameState !== 'PLAY') return;
        if(e.key==='w' || e.key==='W') keys.w=true;
        if(e.key==='a' || e.key==='A') keys.a=true;
        if(e.key==='s' || e.key==='S') keys.s=true;
        if(e.key==='d' || e.key==='D') keys.d=true;
        if(e.key===' ' || e.code === 'Space') keys.space=true;
    });
    window.addEventListener('keyup', e => {
        if(e.key==='w' || e.key==='W') keys.w=false;
        if(e.key==='a' || e.key==='A') keys.a=false;
        if(e.key==='s' || e.key==='S') keys.s=false;
        if(e.key==='d' || e.key==='D') keys.d=false;
        if(e.key===' ' || e.code === 'Space') keys.space=false;
    });

    // Joystick Touch Logic
    const handleStart = (e) => {
        if(gameState !== 'PLAY') return;
        // 確保不是點在閃避按鈕上 (雖然區域分開，但防呆)
        if(e.target.closest('#dash-btn')) return;

        if(joy.active) return;
        let t = e.changedTouches[0]; joy.active = true; joy.id = t.identifier;
        joy.start = {x:t.clientX, y:t.clientY}; joy.vec = {x:0,y:0};
        base.style.display = 'block'; base.style.left = (joy.start.x-55)+'px'; base.style.top = (joy.start.y-55)+'px';
        stick.style.transform = `translate(-50%, -50%)`;
    };
    
    area.addEventListener('touchstart', handleStart, {passive:false});
    
    area.addEventListener('touchmove', e=>{
        if(!joy.active) return; e.preventDefault();
        for(let i=0; i<e.changedTouches.length; i++){
            if(e.changedTouches[i].identifier === joy.id){
                let t = e.changedTouches[i];
                let dx = t.clientX - joy.start.x; let dy = t.clientY - joy.start.y;
                let dist = Math.hypot(dx,dy);
                if(dist>45) { dx=(dx/dist)*45; dy=(dy/dist)*45; }
                stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
                joy.vec = {x:dx/45, y:dy/45};
            }
        }
    }, {passive:false});
    
    const end = (e) => {
        if(!joy.active) return;
        for(let i=0; i<e.changedTouches.length; i++){
            if(e.changedTouches[i].identifier === joy.id){
                joy.active=false; joy.id=null; joy.vec={x:0,y:0}; base.style.display='none';
            }
        }
    }
    area.addEventListener('touchend', end);
    area.addEventListener('touchcancel', end);

    // Dash Button Touch Logic
    const handleDash = (e) => {
        e.preventDefault();
        e.stopPropagation();
        tryDash();
    };
    dashBtn.addEventListener('touchstart', handleDash, {passive:false});
    dashBtn.addEventListener('mousedown', handleDash); // For PC mouse testing
}

function tryDash() {
    if(gameState !== 'PLAY') return;
    if(player.isDashing) return;
    if(player.dashCooldown > 0) return;

    // Trigger Dash
    player.isDashing = true;
    player.dashTimer = player.dashDuration;
    player.dashCooldown = player.maxDashCooldown;
    
    // Determine Dash Direction
    // 優先使用當前移動方向，如果沒移動則使用面向
    let dx = 0, dy = 0;
    if (Math.abs(joy.vec.x) > 0.1 || Math.abs(joy.vec.y) > 0.1) {
        dx = joy.vec.x; dy = joy.vec.y;
    } else {
        if(keys.w) dy -= 1;
        if(keys.s) dy += 1;
        if(keys.a) dx -= 1;
        if(keys.d) dx += 1;
        
        if (dx === 0 && dy === 0) {
            // 如果完全沒按鍵，向目前面朝方向衝刺
            dx = Math.cos(player.facing);
            dy = Math.sin(player.facing);
        }
    }
    
    // Normalize
    let len = Math.hypot(dx, dy);
    if(len > 0) {
        player.dashVec = { x: dx/len, y: dy/len };
    } else {
        player.dashVec = { x: 1, y: 0 };
    }

    showToast("DASH!");
    // Visual effect: burst particles
    spawnParticles(player.x, player.y, 10, '#00ccff');
}

// --- 貼在 main.js 中，替換原本的 togglePause 與 resumeGame 函式 ---

function togglePause() {
    // [Fix] 防止在其他 UI 開啟時觸發暫停
    if(document.getElementById('levelup-modal').style.display === 'flex') return;
    if(document.getElementById('shop-modal').style.display === 'flex') return;
    if(document.getElementById('gear-viewer-modal').style.display === 'flex') return;

    if(gameState === 'PLAY') {
        gameState = 'PAUSE';
        document.getElementById('pause-overlay').style.display = 'flex';
        document.getElementById('dash-btn').style.display = 'none';
    }
}

function resumeGame() {
    const overlay = document.getElementById('pause-overlay');
    
    // [Fix] 放寬恢復條件：只要是 PAUSE 狀態，或者遮罩是顯示的 (修復狀態不同步的 BUG)，都允許恢復
    if(gameState === 'PAUSE' || (overlay && overlay.style.display !== 'none')) {
        gameState = 'PLAY';
        if(overlay) overlay.style.display = 'none';
        document.getElementById('skill-detail-popup').style.display = 'none';
        document.getElementById('dash-btn').style.display = 'flex';
        lastTime = performance.now();
        loop(lastTime);
    }
}

// --- Loop ---
function loop(timestamp) {
    if(gameState !== 'PLAY') return;
    let dt = (timestamp - lastTime)/1000;
    if(dt > 0.05) dt = 0.05; lastTime = timestamp; 
    
    update(dt); 
    draw();
    requestAnimationFrame(loop);
}

// [修改] main.js
// 在 update 中加入全域近戰限制檢查 (blockMelee)，並將武器數值傳入 fireElement

function update(dt) {
    // 0. Dash & Cooldown Logic
    if (player.dashCooldown > 0) {
        player.dashCooldown -= dt;
    }
    
    // Input Check for Dash (PC Spacebar)
    if (keys.space) {
        tryDash();
    }

    // [New] 檢查主手武器狀態 (全域近戰限制 & 數值讀取)
    let mainWeapon = player.equipment[4];
    let meleeBan = false;
    let weaponStats = { dmgMult: 1.0, speedMult: 1.0, crit: 0 };

    if(mainWeapon) {
        // 如果是遠程/非近戰武器，全域禁止近戰技能
        if(mainWeapon.type === 'main_1h_ranged' || mainWeapon.type === 'main_2h_ranged') {
            meleeBan = true;
        }
        // 讀取武器數值
        if(mainWeapon.stats) {
            weaponStats = mainWeapon.stats;
        }
    }

    // 1. Player Movement
    let moveX = 0, moveY = 0;
    
    if (player.isDashing) {
        // [Dashing State] 強制位移，無視輸入
        player.dashTimer -= dt;
        let speed = player.speed * player.dashSpeedMult;
        moveX = player.dashVec.x;
        moveY = player.dashVec.y;
        
        // 產生殘影粒子 (簡單版)
        if(Math.random() < 0.8) {
             particles.push({
                 x: player.x, y: player.y, 
                 vx: 0, vy: 0, 
                 life: 0.3, color: 'rgba(0, 204, 255, 0.5)', 
                 isGhost: true, radius: player.radius 
             });
        }

        if (player.dashTimer <= 0) {
            player.isDashing = false;
        }
    } else {
        // [Normal State]
        if(Math.abs(joy.vec.x)>0.1 || Math.abs(joy.vec.y)>0.1){
            moveX = joy.vec.x; moveY = joy.vec.y;
        } 
        else {
            if(keys.w) moveY -= 1;
            if(keys.s) moveY += 1;
            if(keys.a) moveX -= 1;
            if(keys.d) moveX += 1;
            if(moveX!==0 || moveY!==0){
                let len = Math.hypot(moveX, moveY);
                moveX/=len; moveY/=len;
            }
        }
    }

    if(moveX!==0 || moveY!==0){
        let currentSpeed = player.speed;
        if(player.isDashing) currentSpeed *= player.dashSpeedMult;
        
        player.x += moveX * currentSpeed * (dt * 60); 
        player.y += moveY * currentSpeed * (dt * 60);
        player.x = Math.max(15, Math.min(SCREEN_W-15, player.x)); player.y = Math.max(15, Math.min(SCREEN_H-15, player.y));
        
        // Dashing 時不改變面向，保持衝刺感
        if (!player.isDashing) {
            player.facing = Math.atan2(moveY, moveX);
        }
    }
    
    // 2. Equipment Skills Logic (Loop through all slots)
    player.equipment.forEach((eq, eqIdx) => {
        if(!eq) return; // 跳過空欄位

        eq.sockets.forEach((s, sIdx) => {
            if(s.item && s.item.def.type === 'active') {
                
                // [New] 檢查是否被全域禁止近戰 (如果該技能標籤包含 '近戰')
                if(meleeBan && s.item.def.tags && s.item.def.tags.includes('近戰')) {
                    return; // 跳過此技能
                }

                if(typeof s.item.timer === 'undefined') s.item.timer = 0;
                s.item.timer -= dt * 60; 

                if(s.item.timer <= 0) {
                    let baseCooldown = 60; 
                    let type = s.item.def.attack.type;
                    if(type === 'orbit') baseCooldown = 15;
                    else if(type === 'projectile') baseCooldown = 30;
                    else if(type === 'cryo') baseCooldown = 45; 
                    else if(type === 'pool') baseCooldown = 90; 
                    else if(type === 'corrosive_flask') baseCooldown = 50;
                    else if(type === 'firework') baseCooldown = 55;

                    let supports = getLinkedSupports(eq, sIdx);
                    let speedMod = 1;
                    let cdrMod = 0;
                    supports.forEach(sup => { 
                        let lvl = sup.level || 1;
                        let growthMult = lvl - 1;
                        let base = sup.effect.base || 0;
                        let growth = sup.effect.growth || 0;

                        if(sup.effect.type === 'speed') {
                            speedMod += (base + growthMult * growth);
                        }
                        if(sup.effect.type === 'cdr') {
                            cdrMod += (base + growthMult * growth);
                        }
                    });

                    // [Modified] 傳入 weaponStats 給 fireElement 計算傷害與暴擊
                    fireElement(s.item.def, s.item.level, supports, weaponStats);

                    baseCooldown /= speedMod; 
                    baseCooldown /= (1 + cdrMod);
                    
                    // [New] 套用武器攻速倍率 (SpeedMult 越高，CD 越短)
                    baseCooldown /= weaponStats.speedMult;

                    s.item.timer = baseCooldown;
                }
            }
        });
    });

    // 3. Delegate to Sub-systems
    updateEnemies(dt);
    updateBoss(dt); 
    updateCombat(dt);
    
    // UI Updates
    document.getElementById('ui-gold').innerText = player.gold;
    document.getElementById('ui-lvl').innerText = player.level;
    document.getElementById('ui-kills').innerText = player.kills;
    
    let t = Math.ceil(waveTimer);
    let m = Math.floor(t/60).toString().padStart(2,'0');
    let s = (t%60).toString().padStart(2,'0');
    document.getElementById('ui-time').innerText = `${m}:${s}`;
    
    document.getElementById('hp-fill').style.width = Math.max(0, (player.hp/player.maxHp)*100) + '%';
    document.getElementById('hp-text').innerText = `${Math.ceil(player.hp)}/${Math.ceil(player.maxHp)}`;
    document.getElementById('xp-fill').style.width = Math.min(100, (player.xp/player.nextLvlXp)*100) + '%';

    // Dash Button Visual Update
    updateDashButtonVisual();
}

function updateDashButtonVisual() {
    const overlay = document.getElementById('dash-cd-overlay');
    if (player.dashCooldown > 0) {
        overlay.style.display = 'block';
        // 簡單的高度遮罩或透明度
        let pct = (player.dashCooldown / player.maxDashCooldown) * 100;
        // 使用 clip-path 做圓餅圖倒數 (CSS中簡單定義了樣式，這裡可以做更精細的)
        // 這裡為了簡單，用 height 遮罩
        overlay.style.clipPath = `inset(${100-pct}% 0 0 0)`; 
        overlay.style.background = 'rgba(0,0,0,0.7)';
    } else {
        overlay.style.display = 'none';
    }
}

function draw() {
    CTX.fillStyle = '#050505'; CTX.fillRect(0, 0, SCREEN_W, SCREEN_H);
    
    // Grid (Fainter)
    CTX.strokeStyle = '#1a1a1a'; CTX.lineWidth = 1; CTX.beginPath();
    for(let i=0; i<SCREEN_W; i+=60) { CTX.moveTo(i,0); CTX.lineTo(i,SCREEN_H); }
    for(let i=0; i<SCREEN_H; i+=60) { CTX.moveTo(0,i); CTX.lineTo(SCREEN_W,i); }
    CTX.stroke();

    drawEnemies();
    drawBoss(); 

    // Draw Ghost Trails (custom drawing for ghosts stored in particles)
    // 這裡我們把殘影當作特殊粒子畫出來
    CTX.save();
    particles.forEach(p => {
        if (p.isGhost) {
            CTX.beginPath(); 
            CTX.arc(p.x, p.y, p.radius, 0, 6.28); 
            CTX.fillStyle = p.color; 
            CTX.fill();
        }
    });
    CTX.restore();

    // Player
    CTX.shadowBlur = 20; 
    CTX.shadowColor = player.isDashing ? '#00ffff' : '#00aaff'; 
    CTX.fillStyle = player.isDashing ? '#ccffff' : '#fff'; // 衝刺時變亮
    CTX.beginPath(); CTX.arc(player.x, player.y, player.radius, 0, 6.28); CTX.fill(); 
    CTX.shadowBlur = 0;

    // Visual Range Indicators (Iterate all equipment)
    let activeElements = [];
    player.equipment.forEach(eq => {
        if(eq) {
            eq.sockets.forEach(s => {
                if(s.item && s.item.def.type === 'active') activeElements.push(s.item.def.s);
            });
        }
    });
    
    const weaponDist = 38;
    activeElements.forEach((symbol, i) => {
        let count=activeElements.length, angle=(i/count)*Math.PI*2 + Date.now()/2000; 
        let wx=player.x+Math.cos(angle)*weaponDist, wy=player.y+Math.sin(angle)*weaponDist;
        
        CTX.shadowBlur=5; CTX.shadowColor='#d4af37';
        CTX.fillStyle='#111'; CTX.beginPath(); CTX.arc(wx, wy, 10, 0, 6.28); CTX.fill();
        CTX.strokeStyle='#d4af37'; CTX.lineWidth=1.5; CTX.stroke(); 
        
        CTX.shadowBlur=0;
        CTX.font='bold 10px Orbitron'; CTX.fillStyle='#fff'; CTX.textAlign='center'; CTX.textBaseline='middle'; 
        CTX.fillText(symbol, wx, wy);
    });

    drawCombatEffects();
}