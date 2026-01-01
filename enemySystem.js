// --- enemySystem.js ---
// 敵人生成、波次管理、敵人AI (POE Style State Machine)
// [Patch] Boss Wave Logic Added

let enemies = [];
let waveTimer = 30; 
let waveMaxTime = 30;
let isWaveActive = false;
let currentWave = 1;
let spawnTimer = 0;

// 定義敵人狀態
const STATE = {
    CHASE: 0,    // 追逐玩家
    PREPARE: 1,  // 攻擊前搖 (Windup)
    ATTACK: 2,   // 攻擊判定 (Active)
    RECOVERY: 3  // 攻擊後搖 (Cooldown)
};

function startWave(waveNum) {
    currentWave = waveNum;
    waveMaxTime = 30 + Math.min(120, (waveNum - 1) * 10); 
    waveTimer = waveMaxTime;
    
    gameState = 'PLAY';
    isWaveActive = true;
    
    enemies = [];
    projectiles = []; 
    particles = [];
    spawnTimer = 0;
    
    updateCombatBar();
    showToast(`第 ${currentWave} 波開始!`);
    document.getElementById('ui-wave-num').innerText = currentWave;

    // [New] BOSS 波次檢查
    if(currentWave === 5) {
        spawnBoss('prototype'); // 生成原型 BOSS
    }
}

function endWave() {
    // 如果 BOSS 還在，不能結束波次
    if(activeBoss) return;

    isWaveActive = false;
    enemies = []; 
    projectiles = [];
    showToast("波次結束! 進入實驗室");
    
    player.gold += 150 + (currentWave * 50);
    openShop();
}

// 根據波次決定生成的怪物類型權重
function getWaveEnemyTypes() {
    let types = ['scavenger'];
    if(currentWave >= 2) types.push('kamikaze'); // Wave 2+ 自爆怪
    if(currentWave >= 3) types.push('sniper');
    if(currentWave >= 4) types.push('skirmisher'); // Wave 4+ 游擊怪
    if(currentWave >= 6) types.push('tank');
    if(currentWave >= 8) types.push('assassin');
    return types;
}

// [Improved] 更好的數值平衡公式
function getWaveStatMultiplier(wave) {
    return {
        hp: 1 + (Math.pow(wave, 1.6) * 0.15),
        dmg: 1 + (wave * 0.15)
    };
}

// 產生一小群敵人
function spawnWaveCluster() {
    let types = getWaveEnemyTypes();
    let typeKey = types[Math.floor(Math.random() * types.length)];
    let def = ENEMIES_DB[typeKey];
    
    // 使用新公式
    let mult = getWaveStatMultiplier(currentWave);
    
    // 一群 2~5 隻
    let count = 2 + Math.floor(Math.random() * 3) + Math.floor(currentWave / 5);
    
    let angleBase = Math.random() * 6.28;
    let distBase = Math.max(SCREEN_W, SCREEN_H) * 0.75;
    
    for(let i=0; i<count; i++) {
        let angle = angleBase + (Math.random() - 0.5) * 0.6; 
        let dist = distBase + (Math.random() - 0.5) * 100;
        
        let rarity = 'normal';
        let rarityMult = 1;
        let colorOverlay = null;
        
        if(Math.random() < 0.15) { rarity = 'magic'; rarityMult = 2; colorOverlay = '#aaaaff'; } 
        if(Math.random() < 0.03) { rarity = 'rare'; rarityMult = 4; colorOverlay = '#ffffaa'; } 

        let maxHp = Math.floor(def.baseHp * mult.hp * rarityMult * 2.0); 
        let dmg = def.baseDmg * mult.dmg * rarityMult;

        enemies.push({
            x: player.x + Math.cos(angle) * dist,
            y: player.y + Math.sin(angle) * dist,
            type: typeKey,
            def: def,
            
            hp: maxHp,
            maxHp: maxHp,
            spd: def.baseSpd * (0.9 + Math.random() * 0.2),
            dmg: dmg,
            
            size: def.size * (rarity === 'rare' ? 1.4 : 1),
            angle: 0,
            
            state: STATE.CHASE,
            stateTimer: 0, 
            
            animFrame: Math.random() * 100,
            rarity: rarity,
            colorOverlay: colorOverlay,
            flash: 0 
        });
    }
}

function updateEnemies(dt) {
    if(isWaveActive) {
        // 如果有 BOSS，暫停波次計時與小怪生成
        if(activeBoss) {
            // Boss 戰期間不倒數，或者顯示 Boss 血條
        } else {
            waveTimer -= dt;
            if(waveTimer <= 0) {
                waveTimer = 0;
                endWave();
                return; 
            }
            spawnTimer -= dt;
            if(spawnTimer <= 0) {
                spawnWaveCluster();
                spawnTimer = Math.max(0.5, 3.0 - (currentWave * 0.15)); 
            }
        }
    }

    enemies.forEach((e, i) => {
        if(!e) return;

        updateEnemyAI(e, dt);
        
        e.animFrame += dt * 60; // 更新動畫幀
        if(e.flash > 0) e.flash--;
        
        if(e.hp <= 0) {
            handleEnemyDeath(e, i);
        }
    });
    enemies = enemies.filter(e => e);
}

// --- [修改] enemySystem.js ---

// --- [修改] enemySystem.js ---

function handleEnemyDeath(e, i) {
    player.kills++;
    player.xp += e.def.xp;
    if(player.xp >= player.nextLvlXp) levelUp();

    let rng = Math.random();
    // 根據稀有度決定掉落倍率 (普通=1, 藍色=2, 黃色=5)
    let dropBonus = (e.rarity === 'rare' ? 5 : (e.rarity === 'magic' ? 2 : 1));
    
    // --- 1. 基礎掉落 (裝備 或 金幣) ---
    // 這部分保持原始互斥邏輯，確保經濟平衡
    if(rng < (0.008 * dropBonus) + (currentWave*0.001)) {
        pickUpEquipment();
    }
    else if(rng < 0.35 * dropBonus) {
        player.gold += (10 + Math.floor(currentWave*2)) * dropBonus;
    }

    // --- 2. 特殊道具掉落 (獨立判定) ---
    // 修改為獨立的 if 判斷，讓一隻怪有機會同時掉落多種道具

    // 鏈接器 (原始設定: 總機率2%中的60% = 1.2%)
    if(Math.random() < 0.05 * dropBonus) {
        addMaterialToInventory('linker');
    }

    // 打孔鑽 (原始設定: 總機率2%中的40% = 0.8%)
    if(Math.random() < 0.05 * dropBonus) {
        addMaterialToInventory('socket_drill');
    }

    spawnParticles(e.x, e.y, 8, e.def.color);
    
    // 自爆怪死亡時的殘骸邏輯
    if(e.def.ai === 'volatile') {
        projectiles.push({
            x: e.x, y: e.y, vx:0, vy:0,
            life: 1.0, 
            size: e.size * 1.5,
            type: 'volatile_remnant', 
            dmg: e.dmg,
            color: '#ff4400'
        });
    }

    enemies[i] = null;
}

// [AI Logic]
function updateEnemyAI(e, dt) {
    let dist = Math.hypot(player.x - e.x, player.y - e.y);
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let targetAngle = Math.atan2(dy, dx);

    // 總是更新面向 (除非在攻擊硬直中)
    if(e.state !== STATE.ATTACK && e.state !== STATE.RECOVERY) {
        let diff = targetAngle - e.angle;
        while (diff <= -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        e.angle += diff * 0.15;
    }

    // [AI] 群體分離 (Separation)
    let sepX = 0, sepY = 0;
    enemies.forEach(other => {
        if (other && other !== e) {
            let odx = e.x - other.x;
            let ody = e.y - other.y;
            let odistSq = odx*odx + ody*ody;
            let minSep = (e.size + other.size) * 1.2;
            if (odistSq < minSep * minSep && odistSq > 0.1) {
                let d = Math.sqrt(odistSq);
                let push = (minSep - d) / d;
                sepX += odx * push;
                sepY += ody * push;
            }
        }
    });

    switch (e.def.ai) {
        case 'skirmisher': // 環繞型 AI
            let desiredDist = 200;
            let moveDir = 0; // 1: 前進, -1: 後退
            
            if (dist > desiredDist + 50) moveDir = 1;
            else if (dist < desiredDist - 50) moveDir = -1;
            
            // 側向移動 (環繞)
            let orbitX = -Math.sin(targetAngle);
            let orbitY = Math.cos(targetAngle);
            
            let mx = Math.cos(e.angle) * moveDir + orbitX * 0.8 + sepX;
            let my = Math.sin(e.angle) * moveDir + orbitY * 0.8 + sepY;
            
            // 攻擊邏輯
            if(dist < 300 && e.state === STATE.CHASE) {
                e.attackCooldown = (e.attackCooldown || 0) - dt;
                if(e.attackCooldown <= 0) {
                     e.state = STATE.PREPARE;
                     e.stateTimer = e.def.windup;
                }
            }
            
            if(e.state === STATE.CHASE) {
                let len = Math.hypot(mx, my);
                if(len > 0.1) {
                    e.x += (mx/len) * e.spd * (dt*60);
                    e.y += (my/len) * e.spd * (dt*60);
                }
            }
            break;

        case 'volatile': // 自爆型 AI
             if(e.state === STATE.CHASE) {
                 if(dist <= e.def.attackRange + 10) {
                     e.state = STATE.PREPARE;
                     e.stateTimer = e.def.windup;
                 } else {
                     let vx = Math.cos(e.angle) + sepX;
                     let vy = Math.sin(e.angle) + sepY;
                     let len = Math.hypot(vx, vy);
                     if(len > 0.1) {
                        e.x += (vx/len) * e.spd * (dt*60) * 1.2; // 衝刺時稍快
                        e.y += (vy/len) * e.spd * (dt*60) * 1.2;
                     }
                 }
             }
             break;
             
        default: // 標準追逐
             if(e.state === STATE.CHASE) {
                if (dist <= e.def.attackRange) {
                    e.state = STATE.PREPARE;
                    e.stateTimer = e.def.windup; 
                } else {
                    let vx = Math.cos(e.angle) + sepX;
                    let vy = Math.sin(e.angle) + sepY;
                    let len = Math.hypot(vx, vy);
                    if(len > 0.1) {
                         e.x += (vx/len) * e.spd * (dt*60);
                         e.y += (vy/len) * e.spd * (dt*60);
                    }
                }
             }
             break;
    }

    if(e.state === STATE.PREPARE) {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
            e.state = STATE.ATTACK;
            performAttack(e);
        }
    } else if(e.state === STATE.ATTACK) {
        e.state = STATE.RECOVERY;
        e.stateTimer = e.def.cooldown;
        if(e.def.ai === 'skirmisher') e.attackCooldown = e.def.cooldown;
    } else if(e.state === STATE.RECOVERY) {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
            e.state = STATE.CHASE;
        }
    }
}

function performAttack(e) {
    if(e.def.ai === 'ranged_basic' || e.def.ai === 'skirmisher') {
        projectiles.push({
            x: e.x, y: e.y,
            vx: Math.cos(e.angle) * 7, vy: Math.sin(e.angle) * 7,
            life: 2.0, size: 6, dmg: e.dmg,
            type: 'enemy_bullet', color: e.def.color,
            isEnemy: true 
        });
    } 
    else if (e.def.ai === 'volatile') {
        // 成功接近玩家後的自爆 (這是主動攻擊，不可避免，除非玩家在 Windup 期間殺死它)
        // 但如果玩家在 Windup 期間殺死它，就會觸發 handleEnemyDeath 的延遲爆炸
        spawnExplosion(e.x, e.y, 80, e.dmg, e.def.color);
        e.hp = 0; 
    }
    else {
        let dist = Math.hypot(player.x - e.x, player.y - e.y);
        if(dist <= e.def.attackRange + 15) {
            player.hp -= e.dmg;
            spawnParticles(player.x, player.y, 5, '#ff0000');
            dmgNums.push({x: player.x, y: player.y - 20, val: "-" + Math.floor(e.dmg), life: 1.0, color: '#ff0000', size: 16});
            if(player.hp <= 0) gameOver();
        }
    }
}

function spawnExplosion(x, y, radius, dmg, color) {
    projectiles.push({
        x: x, y: y, vx:0, vy:0, life:0.2, size: radius, maxSize: radius, 
        dmg: dmg, type: 'explosion_instant', color: color, isEnemy: true
    });
    // 立即傷害判定 (如果是敵人主動自爆)
    let dist = Math.hypot(player.x - x, player.y - y);
    if(dist < radius + player.radius) {
        player.hp -= dmg;
        dmgNums.push({x: player.x, y: player.y - 20, val: "-" + Math.floor(dmg), life: 1.0, color: '#ff0000', size: 18});
        if(player.hp <= 0) gameOver();
    }
}

// [Visual Overhaul] 重寫敵人繪製函數
function drawEnemyVisuals(e) {
    let vis = e.def.visual;
    let color = e.colorOverlay || e.def.color;
    let pulse = Math.sin(e.animFrame * 0.1) * 0.1 + 1; 

    if (e.state === STATE.PREPARE) {
        if(Math.floor(Date.now() / 50) % 2 === 0) color = '#fff';
    }

    CTX.fillStyle = color;
    CTX.strokeStyle = '#000';
    CTX.lineWidth = 2;

    switch(vis) {
        case 'spiky_circle': 
            CTX.beginPath();
            for(let i=0; i<8; i++) {
                let ang = (i / 8) * 6.28 + e.animFrame*0.05;
                let r = (i%2===0) ? e.size * 1.2 : e.size * 0.8;
                let px = Math.cos(ang) * r;
                let py = Math.sin(ang) * r;
                if(i===0) CTX.moveTo(px, py); else CTX.lineTo(px, py);
            }
            CTX.closePath();
            CTX.fill(); CTX.stroke();
            CTX.fillStyle = '#000'; CTX.beginPath(); CTX.arc(0,0, e.size*0.4, 0, 6.28); CTX.fill();
            break;

        case 'heavy_hexagon': 
            CTX.beginPath();
            for(let i=0; i<6; i++) {
                let ang = (i / 6) * 6.28;
                let px = Math.cos(ang) * e.size;
                let py = Math.sin(ang) * e.size;
                if(i===0) CTX.moveTo(px, py); else CTX.lineTo(px, py);
            }
            CTX.closePath();
            CTX.fill(); CTX.stroke();
            CTX.strokeStyle = '#fff'; CTX.lineWidth=1; CTX.strokeRect(-e.size*0.4, -e.size*0.4, e.size*0.8, e.size*0.8);
            break;

        case 'triangle_eye': 
            CTX.beginPath();
            CTX.moveTo(e.size * 1.2, 0);
            CTX.lineTo(-e.size * 0.8, e.size * 0.8);
            CTX.lineTo(-e.size * 0.5, 0);
            CTX.lineTo(-e.size * 0.8, -e.size * 0.8);
            CTX.closePath();
            CTX.fill(); CTX.stroke();
            CTX.fillStyle = '#fff'; CTX.beginPath(); CTX.arc(0, 0, e.size*0.3, 0, 6.28); CTX.fill();
            if(e.state === STATE.PREPARE) {
                CTX.strokeStyle = '#f00'; CTX.lineWidth = 1; CTX.setLineDash([2, 2]);
                CTX.beginPath(); CTX.moveTo(10, 0); CTX.lineTo(200, 0); CTX.stroke();
                CTX.setLineDash([]);
            }
            break;
            
        case 'pulsing_star': 
            CTX.rotate(e.animFrame * 0.2); 
            CTX.beginPath();
            for(let i=0; i<4; i++) {
                let ang = (i / 4) * 6.28;
                let px = Math.cos(ang) * e.size * 1.3;
                let py = Math.sin(ang) * e.size * 1.3;
                CTX.lineTo(px, py);
                let ang2 = ang + 0.785;
                CTX.lineTo(Math.cos(ang2)*e.size*0.4, Math.sin(ang2)*e.size*0.4);
            }
            CTX.closePath();
            CTX.fill(); CTX.stroke();
            break;

        case 'volatile_wisp': 
            let r = e.size * pulse;
            CTX.beginPath(); CTX.arc(0, 0, r, 0, 6.28); CTX.fill(); 
            CTX.strokeStyle = '#fff'; CTX.lineWidth = 1; CTX.stroke();
            CTX.fillStyle = '#fff'; CTX.beginPath(); CTX.arc(Math.random()*4-2, Math.random()*4-2, e.size*0.4, 0, 6.28); CTX.fill();
            break;

        case 'orbit_drone': 
            CTX.beginPath(); CTX.arc(0, 0, e.size*0.6, 0, 6.28); CTX.fill(); CTX.stroke();
            CTX.strokeStyle = color; CTX.lineWidth = 2;
            CTX.beginPath(); CTX.arc(0, 0, e.size, e.animFrame*0.1, e.animFrame*0.1 + 4); CTX.stroke();
            break;

        default: 
            CTX.beginPath(); CTX.arc(0, 0, e.size, 0, 6.28); CTX.fill(); CTX.stroke();
    }
}

function drawEnemies() {
    enemies.forEach(e => {
        if(!e) return;
        CTX.save();
        CTX.translate(e.x, e.y);
        CTX.rotate(e.angle);
        
        drawEnemyVisuals(e);

        if(e.hp < e.maxHp) {
            CTX.rotate(-e.angle); 
            CTX.fillStyle = '#550000';
            CTX.fillRect(-15, -e.size - 10, 30, 4);
            CTX.fillStyle = '#ff0000';
            CTX.fillRect(-15, -e.size - 10, 30 * Math.max(0, e.hp / e.maxHp), 4);
        }
        CTX.restore();
    });
}

function getNearestEnemy() {
    let minD=800, target=null;
    // [Modified] 優先鎖定 BOSS
    if(activeBoss) {
        let d = Math.hypot(activeBoss.x - player.x, activeBoss.y - player.y);
        if(d < minD) return activeBoss; // 讓 Boss 成為優先目標
    }

    enemies.forEach(e => { 
        if(!e) return;
        let d=Math.hypot(e.x-player.x, e.y-player.y); 
        if(d<minD) { minD=d; target=e; } 
    });
    return target;
}