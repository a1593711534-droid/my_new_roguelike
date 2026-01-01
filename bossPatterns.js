// --- bossPatterns.js ---
// BOSS 技能庫: 移動型災難版
// [Patch] Calamity Smash: Size increased by 1.5x
// [Patch] Tyrant Combo: Added Per-Slash Stamina Cost & Limited Turning Speed
// [Patch] Added Body Damage Toggle for Charge

const BOSS_PATTERNS = {
    // 技能 1: 暴君衝鋒 (Tyrant Charge) 
    'tyrant_charge': (boss, target) => {
        let ang = Math.atan2(target.y - boss.y, target.x - boss.x);
        
        boss.vx = Math.cos(ang) * 18; 
        boss.vy = Math.sin(ang) * 18;
        boss.isCharging = true; // 設定衝鋒標記 (這會讓 bossSystem 跳過 AI 移動)
        
        // [New] 衝鋒時開啟身體傷害判定
        boss.isBodyDamageActive = true; 
        
        let duration = 600; 
        let interval = 60; 
        
        let chargeTimer = setInterval(() => {
            if(!boss || boss.hp <= 0) { clearInterval(chargeTimer); return; }
            
            projectiles.push({
                x: boss.x, y: boss.y, vx: 0, vy: 0,
                life: 2.0, size: 40, maxSize: 60, 
                dmg: boss.dmg * 0.8, 
                type: 'pool', color: '#00ff44', 
                isEnemy: true, hitTimers: new Map() 
            });
            
            boss.flash = 2;
        }, interval);

        setTimeout(() => {
            clearInterval(chargeTimer);
            if(boss && boss.hp > 0) {
                // 停止衝鋒
                boss.vx = 0; boss.vy = 0; 
                boss.isCharging = false;
                // 關閉身體傷害
                boss.isBodyDamageActive = false;
            }
        }, duration);

        return 1.5; 
    },

    // 技能 2: 災厄重擊 (Calamity Smash)
    // [Mod] 範圍半徑擴大 1.5 倍
    'calamity_smash': (boss, target) => {
        let ang = Math.atan2(target.y - boss.y, target.x - boss.x);
        let startDist = boss.def.size; 
        
        for(let i=1; i<=14; i++) {
            let dist = startDist + (i * 120); // 間距加大
            let ex = boss.x + Math.cos(ang) * dist;
            let ey = boss.y + Math.sin(ang) * dist;
            
            let warningDuration = 400 + (i * 80); 
            let lifeTime = warningDuration / 1000; 

            projectiles.push({
                x: ex, y: ey, vx: 0, vy: 0,
                life: lifeTime, maxLife: lifeTime, 
                size: 90 * 1.5, // 視覺大小加大
                type: 'warning_zone', color: 'rgba(255, 30, 30, 0.5)' 
            });

            setTimeout(() => {
                if(!boss || boss.hp <= 0) return;
                
                let explLife = 0.5; 
                projectiles.push({
                    x: ex, y: ey, vx: 0, vy: 0,
                    life: explLife, maxLife: explLife,
                    size: 60 * 1.5, maxSize: 100 * 1.5, 
                    dmg: boss.dmg * 1.5, 
                    type: 'explosion_instant', color: '#ccff00',
                    isEnemy: true, hitList: []
                });
                
                if(i===14 && boss) boss.flash = 10; 
            }, warningDuration); 
        }
        return 2.5; 
    },

    // 技能 3: 魔能轟炸 (Fel Bombardment)
    'fel_bombardment': (boss, target) => {
        let count = 30; 
        
        for(let i=0; i<count; i++) {
            setTimeout(() => {
                if(!boss || boss.hp <= 0) return;
                
                let rx = Math.random() * SCREEN_W;
                let ry = Math.random() * SCREEN_H;
                let warnTime = 1.0; 

                projectiles.push({
                    x: rx, y: ry, vx: 0, vy: 0,
                    life: warnTime, maxLife: warnTime,
                    size: 80, 
                    dmg: 0, type: 'warning_zone', color: 'rgba(255, 0, 0, 0.5)', 
                    isEnemy: false
                });

                setTimeout(() => {
                    let explLife = 0.5;
                    projectiles.push({
                        x: rx, y: ry, vx: 0, vy: 0,
                        life: explLife, maxLife: explLife,
                        size: 50, maxSize: 85, 
                        dmg: boss.dmg,
                        type: 'explosion_instant', color: '#44ff00', 
                        isEnemy: true, hitList: []
                    });
                }, warnTime * 1000); 
                
            }, i * 60); 
        }
        return 2.5; 
    },

    // 技能 4: 暴君連斬 (Tyrant Combo)
    // [Mod] 實作逐次耐力消耗 & 轉向限制
    'tyrant_combo': (boss, target) => {
        let totalDuration = 1.0;
        let slashCost = 15; // 每一刀消耗的耐力

        const performSlash = (delay, angleOffset, isSmash, chanceToContinue) => {
            setTimeout(() => {
                if(!boss || boss.hp <= 0) return;
                
                // [Logic] 1. 耐力檢查
                if(boss.stamina < slashCost) {
                    boss.isExhausted = true; // 力竭
                    // 可以加一個力竭特效或文字
                    return; 
                }
                boss.stamina -= slashCost;

                // [Logic] 2. 轉向限制 (不再完美鎖定)
                let targetAng = Math.atan2(target.y - boss.y, target.x - boss.x);
                let currentAng = boss.angle;
                
                // 計算角度差 (-PI ~ PI)
                let diff = targetAng - currentAng;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                // 限制最大轉動幅度 (例如 45度 = 0.78弧度)
                // 第三刀如果是重擊(isSmash)，轉向能力更差，模擬蓄力笨重感
                let turnLimit = isSmash ? 0.5 : 1.0; 

                if(Math.abs(diff) > turnLimit) {
                    // 只能轉 turnLimit 這麼多
                    currentAng += Math.sign(diff) * turnLimit;
                } else {
                    // 角度在範圍內，直接對準
                    currentAng = targetAng;
                }
                
                // 更新 Boss 面向，確保視覺跟隨攻擊
                boss.angle = currentAng;
                
                // 計算實際攻擊角度 (加上揮砍的偏移量)
                let attackAngle = boss.angle + angleOffset;

                let warnTime = 0.4;
                let range = isSmash ? 250 : 200;
                
                let warnX = boss.x + Math.cos(attackAngle) * (range * 0.6);
                let warnY = boss.y + Math.sin(attackAngle) * (range * 0.6);

                projectiles.push({
                    x: warnX, y: warnY, vx: 0, vy: 0,
                    life: warnTime, maxLife: warnTime,
                    size: isSmash ? 120 : 90, 
                    type: 'warning_zone', color: 'rgba(255, 0, 0, 0.6)'
                });

                setTimeout(() => {
                    if(!boss || boss.hp <= 0) return;
                    
                    if(isSmash) {
                         projectiles.push({
                            x: warnX, y: warnY, vx:0, vy:0,
                            life: 0.4, maxLife: 0.4,
                            size: 100, maxSize: 160,
                            dmg: boss.dmg * 2.0,
                            type: 'explosion_instant', color: '#ff2200',
                            isEnemy: true, hitList: [], knockback: 20
                        });
                        boss.flash = 5;
                    } else {
                        projectiles.push({
                            x: boss.x, y: boss.y, 
                            vx: 0, vy: 0,
                            owner: boss, 
                            angle: attackAngle,
                            life: 0.3, maxLife: 0.3,
                            size: 220, 
                            dmg: boss.dmg * 1.2,
                            type: 'boss_slash', color: '#ff0000',
                            isEnemy: true, hitList: [], knockback: 10
                        });
                    }
                }, warnTime * 1000);

            }, delay);
            return Math.random() < chanceToContinue;
        };

        let continueTo2 = performSlash(0, -0.4, false, 0.8); // 第一刀
        totalDuration += 0.6;

        if(continueTo2) {
            let continueTo3 = performSlash(600, 0.4, false, 0.6); // 第二刀
            totalDuration += 0.6;
            
            if(continueTo3) {
                performSlash(1200, 0, true, 0); // 第三刀 (重擊)
                totalDuration += 1.0;
            }
        }

        return totalDuration;
    }
};