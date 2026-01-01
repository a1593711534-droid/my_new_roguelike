// --- bossSystem.js ---
// BOSS 控制器: 生成、狀態機、階段管理
// [Patch] AI Logic: Stamina System (Action Points) & Exhaustion
// [Patch] AI Logic: Aggressive Chase vs Tactical Kite
// [Fix] Fixed Tyrant Charge "Braking" Bug (Logic separation)

// BOSS 狀態枚舉
const BOSS_STATE = {
    SPAWNING: 0, // 出場動畫中 (無敵)
    IDLE: 1,     // 尋找目標 / 移動 (AI 決策核心)
    WINDUP: 2,   // 技能前搖 (提示)
    ACTIVE: 3,   // 技能釋放中
    RECOVERY: 4, // 技能後搖 (硬直)
    DYING: 5     // 死亡動畫
};

// AI 行為模式
const AI_MODE = {
    CHASE: 0,    // 積極追擊 (高移速)
    KITE: 1      // 保持距離/遊走 (低移速)
};

function spawnBoss(bossId) {
    let def = BOSS_DB[bossId];
    if(!def) { console.error("Boss ID not found:", bossId); return; }

    showToast(`警告: ${def.name} 接近中!`);

    activeBoss = {
        def: def,
        x: SCREEN_W / 2,
        y: -100, // 從上方生成
        
        hp: def.baseHp,
        maxHp: def.baseHp,
        dmg: def.baseDmg,
        
        state: BOSS_STATE.SPAWNING,
        stateTimer: 3.0, 
        
        currentPhaseIdx: 0,
        skillTimer: 1.5, 
        
        vx: 0, vy: 0, 
        angle: Math.PI / 2,
        
        animFrame: 0,
        flash: 0,

        // [AI Props]
        aiMode: AI_MODE.CHASE,
        aiTimer: 0, 
        
        // [New] 耐力系統
        stamina: 100,
        maxStamina: 100,
        isExhausted: false, // 是否力竭
        
        // [New] 身體傷害開關 (預設關閉，只有衝鋒時開啟)
        isBodyDamageActive: false,
        isCharging: false // 衝鋒狀態標記
    };
}

function updateBoss(dt) {
    if(!activeBoss) return;
    
    let b = activeBoss;
    b.animFrame += dt * 60;
    if(b.flash > 0) b.flash--;

    // 0. 死亡處理
    if(b.hp <= 0 && b.state !== BOSS_STATE.DYING) {
        b.state = BOSS_STATE.DYING;
        b.stateTimer = 2.0; 
        projectiles = projectiles.filter(p => !p.isEnemy);
        showToast("BOSS 已被擊潰!");
    }

    if(b.state === BOSS_STATE.DYING) {
        b.stateTimer -= dt;
        spawnParticles(b.x + (Math.random()-0.5)*b.def.size, b.y + (Math.random()-0.5)*b.def.size, 2, '#fff');
        if(b.stateTimer <= 0) {
            handleBossDefeat();
        }
        return;
    }

    // 1. 出場階段
    if(b.state === BOSS_STATE.SPAWNING) {
        let targetY = SCREEN_H * 0.25;
        b.y += (targetY - b.y) * 2.0 * dt;
        b.stateTimer -= dt;
        if(b.stateTimer <= 0) {
            b.state = BOSS_STATE.IDLE;
        }
        return;
    }

    // [New] 耐力回復機制
    // 力竭時回復速度極快 (40/sec)，正常時較慢 (15/sec)
    let regenRate = b.isExhausted ? 40 : 10;
    if(b.stamina < b.maxStamina) {
        b.stamina += regenRate * dt;
        if(b.stamina > b.maxStamina) b.stamina = b.maxStamina;
        
        // 從力竭中恢復
        if(b.isExhausted && b.stamina >= b.maxStamina) {
            b.isExhausted = false;
            b.flash = 5; // 恢復提示
            // showToast("BOSS 恢復了架勢!"); 
        }
    }

    // 2. 階段檢測
    let hpPct = b.hp / b.maxHp;
    let phases = b.def.phases;
    let phaseIdx = 0;
    for(let i = phases.length - 1; i >= 0; i--) {
        if(hpPct <= phases[i].threshold) {
            phaseIdx = i;
            break;
        }
    }
    b.currentPhaseIdx = phaseIdx;
    let currentPhase = phases[phaseIdx];

    // 3. 物理與 AI 移動邏輯
    // [FIX] 關鍵修正: 只有在「沒有衝鋒(!b.isCharging)」時，AI 才能控制速度
    if((b.state === BOSS_STATE.IDLE || b.state === BOSS_STATE.RECOVERY) && !b.isCharging) {
        
        // AI 模式切換邏輯
        b.aiTimer -= dt;
        if(b.aiTimer <= 0) {
            b.aiMode = (Math.random() < 0.7) ? AI_MODE.CHASE : AI_MODE.KITE;
            b.aiTimer = 2.0 + Math.random() * 2.0; 
        }

        // [Override] 如果力竭，強制進入遊走模式 (休息)
        if(b.isExhausted) {
            b.aiMode = AI_MODE.KITE;
        }

        let dx = player.x - b.x;
        let dy = player.y - b.y;
        let dist = Math.hypot(dx, dy);
        let desiredSpeed = 0;

        if(b.aiMode === AI_MODE.CHASE) {
            let meleeRange = 180;
            if(dist > meleeRange) {
                desiredSpeed = 3.5 * (currentPhase.speedScale || 1.2); 
            } else {
                desiredSpeed = 0.5; 
            }
        } else {
            // 遊走模式 (Kite)
            let kiteDist = 450;
            if(dist < kiteDist - 50) {
                desiredSpeed = -2.0; // 後退
            } else if (dist > kiteDist + 50) {
                desiredSpeed = 2.0;
            } else {
                desiredSpeed = 0.5;
            }
        }

        let angle = Math.atan2(dy, dx);
        if(b.aiMode === AI_MODE.KITE && Math.abs(desiredSpeed) < 1.0) {
             angle += Math.PI / 2; // 環繞
             desiredSpeed = 1.5;
        }

        let ax = Math.cos(angle) * desiredSpeed;
        let ay = Math.sin(angle) * desiredSpeed;
        
        b.vx += (ax - b.vx) * 0.1;
        b.vy += (ay - b.vy) * 0.1;

        b.x += b.vx * (dt * 60);
        b.y += b.vy * (dt * 60);
    }
    else if (b.isCharging) {
        // [FIX] 衝鋒模式: 純物理移動，不執行摩擦力減速
        b.x += b.vx * (dt * 60);
        b.y += b.vy * (dt * 60);
    }
    else {
        // 其他狀態 (WINDUP 等) 的自然摩擦力
        if(b.state !== BOSS_STATE.IDLE && b.state !== BOSS_STATE.RECOVERY) {
            b.vx *= 0.9; b.vy *= 0.9;
        }
    }

    b.x = Math.max(b.def.size, Math.min(SCREEN_W - b.def.size, b.x));
    b.y = Math.max(b.def.size, Math.min(SCREEN_H - b.def.size, b.y));

    // 4. 戰鬥狀態機
    if(b.state === BOSS_STATE.IDLE) {
        b.skillTimer -= dt;
        
        // 嘗試發動攻擊
        if(b.skillTimer <= 0) {
            // 如果已經力竭，不能攻擊，等待耐力回滿
            if(b.isExhausted) {
                b.skillTimer = 0.5; // 每 0.5 秒檢查一次
                return;
            }

            let dist = Math.hypot(player.x - b.x, player.y - b.y);
            let pool = currentPhase.skills;
            let chosenSkill = null;

            if(dist < 250 && pool.includes('tyrant_combo') && Math.random() < 0.7) {
                chosenSkill = 'tyrant_combo';
            } else {
                chosenSkill = pool[Math.floor(Math.random() * pool.length)];
            }
            
            // [Check] 耐力檢定
            let cost = BOSS_SKILL_COSTS[chosenSkill] || 0;
            
            if(b.stamina < cost) {
                // 耐力不足 -> 進入力竭狀態
                b.isExhausted = true;
                b.aiMode = AI_MODE.KITE; // 立即轉身逃跑
                b.skillTimer = 1.0; 
                // showToast("BOSS 力竭喘息中...");
            } else {
                // 耐力足夠 -> 發動攻擊
                b.stamina -= cost;
                b.nextSkill = chosenSkill;
                b.state = BOSS_STATE.WINDUP;
                b.stateTimer = 0.8; 
                
                if(chosenSkill === 'tyrant_combo') b.stateTimer = 0.4;
            }
        }
    }
    else if(b.state === BOSS_STATE.WINDUP) {
        b.stateTimer -= dt;
        if(b.stateTimer <= 0) {
            b.state = BOSS_STATE.ACTIVE;
            // 執行技能
            let func = BOSS_PATTERNS[b.nextSkill];
            let recoveryTime = 1.0;
            if(func) {
                recoveryTime = func(b, player);
            }
            // 進入後搖
            b.state = BOSS_STATE.RECOVERY;
            
            // [Bonus] 如果還非常有精神 (耐力 > 50)，後搖時間減半 (瘋狗模式)
            if(b.stamina > 50) recoveryTime *= 0.5;
            
            b.stateTimer = recoveryTime;
        }
    }
    else if(b.state === BOSS_STATE.RECOVERY) {
        b.stateTimer -= dt;
        if(b.stateTimer <= 0) {
            b.state = BOSS_STATE.IDLE;
            b.skillTimer = currentPhase.interval;
        }
    }
}

function handleBossDefeat() {
    player.gold += 500;
    let rareDrop = generateWeightedEquipment();
    player.inventory.push(rareDrop);
    showToast(`BOSS 擊殺! 獲得 ${rareDrop.def.name}`);
    activeBoss = null;
    endWave(); 
}