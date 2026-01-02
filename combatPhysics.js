// --- combatPhysics.js ---
// 戰鬥物理模擬、碰撞偵測與傷害系統
// [Patch] Added Boss Slash Physics
// [Patch] REMOVED Constant Boss Body Damage (Only enabled during charge)
// [Patch] Added Fr (Fissure) & Ra (Smite) Collision Logic
// [Patch] Turret now supports Multishot (Shotgun Fire)

function triggerPayloadEffect(p) {
    if(p.type === 'cluster_bomb') {
        for(let k=0; k<p.subCount; k++) {
            let subAng = (Math.PI * 2 / p.subCount) * k + Math.random();
            let subSpd = 6;
            projectiles.push({
                x: p.x, y: p.y, vx: Math.cos(subAng)*subSpd, vy: Math.sin(subAng)*subSpd,
                life: 0.6, size: 4, dmg: p.subDmg, type: 'cluster_frag', color: '#cc66ff',
                isCrit: p.isCrit, pierce: 1, knockback: p.knockback, bounce: p.bounce,
                homing: p.homing, execute: p.execute, corpseExplode: p.corpseExplode, corpseDmg: p.corpseDmg,
                hitList: []
            });
        }
        spawnParticles(p.x, p.y, 10, '#aa00ff');
    }
    else if(p.type === 'corrosive_flask') {
        projectiles.push({
            x:p.x, y:p.y, vx:0, vy:0, 
            life: 3.0 * (p.durationScale || 1), 
            size:10, maxSize: 50 * p.areaScale,
            dmg: p.dmg * 0.3, type: 'acid_pool', color: '#a03000',
            isCrit: p.isCrit, 
            hitTimers: new Map(), execute: p.execute, corpseExplode: p.corpseExplode, corpseDmg: p.corpseDmg
        });
        spawnParticles(p.x, p.y, 8, '#a03000');
    }
    else if(p.type === 'firework_rocket') {
        let lifeTime = 0.15;
        projectiles.push({
            x:p.x, y:p.y, vx:0, vy:0, life:lifeTime, maxLife: lifeTime,
            size:10, maxSize: 80 * p.areaScale,
            dmg: p.dmg, type: 'explosion_instant', color: '#33ff33', isCrit: p.isCrit,
            execute: p.execute, corpseExplode: p.corpseExplode, corpseDmg: p.corpseDmg, knockback: p.knockback,
            hitList: [] 
        });
        for(let k=0; k<20; k++) {
            let fa = Math.random()*6.28, fs = Math.random()*5+2;
            particles.push({x:p.x, y:p.y, vx:Math.cos(fa)*fs, vy:Math.sin(fa)*fs, life:1.5, color: Math.random()>0.5?'#33ff33':'#ccffcc'});
        }
    }
    else if(p.type === 'heavy_slug') {
        projectiles.push({
            x:p.x, y:p.y, vx:0, vy:0, 
            life: 3.0 * (p.durationScale || 1), 
            size:10, maxSize: 80 * p.areaScale, 
            dmg: p.dmg * 0.1, 
            type: 'gravity_zone', color: '#000', 
            isCrit: p.isCrit,
            hitTimers: new Map(), gravityForce: p.gravityForce, execute: p.execute,
            corpseExplode: p.corpseExplode, corpseDmg: p.corpseDmg
        });
        spawnParticles(p.x, p.y, 10, '#000');
    }
    else if(p.type === 'volatile_remnant') {
        let lifeTime = 0.2;
        projectiles.push({
            x: p.x, y: p.y, vx:0, vy:0, life:lifeTime, maxLife: lifeTime,
            size: 80, maxSize: 80, 
            dmg: p.dmg, type: 'explosion_instant', color: '#ff4400', 
            isEnemy: true, hitList: [] 
        });
        spawnParticles(p.x, p.y, 15, '#ff4400');
    }
    else if(p.type === 'cryo_shot') {
        projectiles.push({
            x:p.x, y:p.y, vx:0, vy:0, 
            life: 2 * (p.durationScale || 1), 
            size:10, maxSize:50*p.areaScale, dmg:p.dmg, type:'pool', color:'#00ffff', 
            isCrit: p.isCrit,
            execute: p.execute, corpseExplode: p.corpseExplode, corpseDmg: p.corpseDmg,
            hitTimers: new Map()
        });
        spawnParticles(p.x,p.y, 5 * (p.areaScale||1), p.color);
    }
}

function triggerStickyBomb(p) {
    if(p.targetEnemy) {
        p.targetEnemy.hasStickyBomb = false;
    }
    projectiles.push({
        x: p.x, y: p.y, vx:0, vy:0,
        life: 0.4, maxLife: 0.4, 
        size: 70 * (p.areaScale || 1), maxSize: 90 * (p.areaScale || 1),
        dmg: p.dmg, 
        type: 'phosphorus_explosion', color: '#ff5500',
        isCrit: p.isCrit, execute: p.execute, 
        corpseExplode: p.corpseExplode, corpseDmg: p.corpseDmg,
        knockback: 10, hitList: []
    });
    spawnParticles(p.x, p.y, 20, '#ffaa00');
}

function updateCombat(dt) {
    for(let i=particles.length-1; i>=0; i--) { 
        let p=particles[i]; 
        p.x += p.vx * (dt * 60); 
        p.y += p.vy * (dt * 60); 
        p.life-=0.05 * (dt * 60); 
        if(p.life<=0) particles.splice(i,1); 
    }
    
    for(let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        
        if (p.type === 'boomerang' && p.returnState === 1) {
             if(p.life < 1.0) p.life = 1.0; 
        } else {
             p.life -= dt;
        }

        if(!p.isEnemy && p.homing && p.homing > 0 && p.vx !== undefined && p.type !== 'cloud' && p.type !== 'turret' && p.type !== 'spiral_orb' && p.type !== 'phosphorus_thrust' && p.type !== 'helium_whirlwind' && p.type !== 'fissure_wave') {
            let target = getNearestEnemy(); 
            if(target) {
                let desiredAng = Math.atan2(target.y - p.y, target.x - p.x);
                let currentAng = Math.atan2(p.vy, p.vx);
                let diff = desiredAng - currentAng;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                let turnSpeed = p.homing * 0.15 * (dt * 60);
                if (Math.abs(diff) < turnSpeed) currentAng = desiredAng;
                else currentAng += Math.sign(diff) * turnSpeed;
                let spd = Math.hypot(p.vx, p.vy);
                p.vx = Math.cos(currentAng) * spd;
                p.vy = Math.sin(currentAng) * spd;
            }
        }

        if(p.type === 'helium_whirlwind') {
            p.x = player.x; 
            p.y = player.y;
            p.angle = (p.angle || 0) + 12 * dt; 
            if(Math.random() < 0.4) {
                 let ang = Math.random() * 6.28;
                 let dist = p.size * (0.5 + Math.random()*0.5);
                 particles.push({
                     x: p.x + Math.cos(ang)*dist, y: p.y + Math.sin(ang)*dist,
                     vx: -Math.cos(ang)*2, vy: -Math.sin(ang)*2, 
                     life: 0.5, color: '#00ffff'
                 });
            }
        }
        else if(p.type === 'phosphorus_breach') {
            if(p.targetEnemy && p.targetEnemy.hp > 0) {
                p.x = p.targetEnemy.x;
                p.y = p.targetEnemy.y;
                if(Math.random() < 0.3) spawnParticles(p.x, p.y, 1, '#ff3300');
            } else {
                p.life = 0; 
                triggerStickyBomb(p);
            }
        }
        else if(p.type === 'phosphorus_thrust') {
             p.x += p.vx * dt * 60;
             p.y += p.vy * dt * 60;
             spawnParticles(p.x, p.y, 2, '#ffaa00');
        }
        else if(p.type === 'crystal_spike') {
             p.x += p.vx * dt * 60;
             p.y += p.vy * dt * 60;
             // 留下殘影
             if(Math.random() < 0.2) {
                 particles.push({x:p.x, y:p.y, vx:0, vy:0, life:0.3, color:p.color, size:2});
             }
        }
        else if(p.type === 'whip_slash') {
            // 鞭子跟隨玩家移動
            let dx = p.x - player.x;
            let dy = p.y - player.y;
            p.x = player.x + dx; 
            p.y = player.y + dy;
            // 角度稍微擺動
            // p.angle += 0.1; 
        }
        else if(p.type === 'astatine_scythe') {
            // 鐮刀跟隨玩家移動，但保持相對角度
            let dx = p.x - player.x;
            let dy = p.y - player.y;
            // 讓它稍微前進一點產生揮砍感
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
        }
        else if(p.type === 'cesium_fist') {
            // 拳頭快速跟隨玩家並向前
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
        }
        else if(p.type === 'boomerang') {
            if (p.returnState !== 1) {
                p.vx *= (1 - 0.02 * (dt * 60));
                p.vy *= (1 - 0.02 * (dt * 60));
                let speed = Math.hypot(p.vx, p.vy);
                if (speed < 2 || p.life < 1.0) { p.returnState = 1; }
            }
            if (p.returnState === 1) {
                let dx = player.x - p.x, dy = player.y - p.y;
                let dist = Math.hypot(dx, dy);
                if (dist < player.radius + 15) {
                    p.life = 0; spawnParticles(p.x, p.y, 5, '#ff0055'); showToast("Catch!");
                } else {
                    let angleToPlayer = Math.atan2(dy, dx);
                    let currentSpeed = Math.hypot(p.vx, p.vy);
                    let targetSpeed = 14; 
                    if (currentSpeed < targetSpeed) currentSpeed += 0.8 * (dt * 60); 
                    p.vx = Math.cos(angleToPlayer) * currentSpeed;
                    p.vy = Math.sin(angleToPlayer) * currentSpeed;
                }
            }
            p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.ang = (p.ang || 0) + 0.5;
            spawnParticles(p.x, p.y, 1, '#ff0055');
        }
        else if(p.type === 'turret') {
            p.fireTimer -= dt;
            if(p.fireTimer <= 0) {
                p.fireTimer = 0.5; 
                let target = getNearestEnemy();
                if(target) {
                    let baseAng = Math.atan2(target.y - p.y, target.x - p.x);
                    let spd = 10 * (p.velocityScale || 1);
                    
                    // [Modified] 讀取 multishot 數值進行散彈發射
                    let extraShots = p.multishot || 0;
                    let totalShots = 1 + extraShots;

                    for(let k=0; k<totalShots; k++) {
                        let ang = baseAng;
                        if(totalShots > 1) {
                            let spread = 0.5; // 30度左右的擴散角
                            let startAng = baseAng - spread/2;
                            ang = startAng + (spread / (totalShots-1)) * k;
                        }

                        projectiles.push({
                            x: p.x, y: p.y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
                            life: 1.0, size: 4, dmg: p.dmg, type: 'turret_bullet', color: '#aaffff',
                            isCrit: p.isCrit, pierce: p.pierce, knockback: p.knockback, bounce: p.bounce,
                            homing: p.homing, execute: p.execute, fork: p.fork,
                            corpseExplode: p.corpseExplode, corpseDmg: p.corpseDmg
                        });
                    }
                }
            }
        }
        else if(p.type === 'spiral_orb') {
            p.angle += p.rotationSpeed * dt;
            p.radius += p.expansionRate * dt;
            p.x = p.centerX + Math.cos(p.angle) * p.radius;
            p.y = p.centerY + Math.sin(p.angle) * p.radius;
            let progress = 1 - (p.life / p.maxLife);
            p.currentSize = p.size * (1 + progress * 0.5);
            if(Math.random() < 0.3) {
                 particles.push({ x: p.x + (Math.random()-0.5)*p.currentSize, y: p.y + (Math.random()-0.5)*p.currentSize, vx: 0, vy: 0, life: 0.5, color: '#aa00cc' });
            }
        }
        else if(p.type === 'boss_slash') {
             if(p.owner) {
                 p.x = p.owner.x;
                 p.y = p.owner.y;
             }
        }
        else if(p.type === 'fissure_wave') {
             p.x += p.vx * dt * 60;
             p.y += p.vy * dt * 60;
             if(Math.random() < 0.3) {
                 spawnParticles(p.x, p.y, 2, '#ffaa00');
             }
        }
        else if(p.type==='bullet' || p.type==='enemy_bullet' || p.type==='cluster_bomb' || p.type==='cluster_frag' || p.type==='shard' || p.type==='cloud' || p.type==='ion_arc' || p.type==='heavy_slug' || p.type==='corrosive_flask' || p.type==='firework_rocket' || p.type==='turret_bullet') { 
            p.x+=p.vx*dt*60; p.y+=p.vy*dt*60; 
            
            if(p.type === 'cloud' && Math.random() < 0.3) {
                 particles.push({x: p.x + (Math.random()-0.5)*p.size, y: p.y + (Math.random()-0.5)*p.size, vx: p.vx*0.1, vy: p.vy*0.1, life: 0.8, color: '#ccff00'});
            }
            if(p.type === 'ion_arc' && Math.random() < 0.4) {
                 particles.push({x: p.x, y: p.y, vx:0, vy:0, life:0.3, color:'#fff'});
            }
            if(p.type === 'firework_rocket' && Math.random() < 0.5) {
                 particles.push({x: p.x, y: p.y, vx:-p.vx*0.2, vy:-p.vy*0.2, life:0.5, color:'#66ff66'});
            }
        }
        else if(p.type==='cryo_shot') { 
            p.x+=p.vx*dt*60; p.y+=p.vy*dt*60; 
            spawnParticles(p.x, p.y, 1, '#aaddff'); 
            if(p.life <= 0 && !p.cancelledPayload) { triggerPayloadEffect(p); }
        }
        else if(p.type==='orbit') { 
            let r = 70 * (p.areaScale || 1);
            p.x=player.x+Math.cos(p.ang+Date.now()/1000*6)*r; 
            p.y=player.y+Math.sin(p.ang+Date.now()/1000*6)*r; 
        }
        else if(p.type==='wave') { 
            let growth = (p.maxSize - 10) / 0.5 * dt; 
            p.size += growth;
            if(!p.fixedPos) { p.x=player.x; p.y=player.y; }
        }
        else if(p.type==='pool' || p.type==='gravity_zone' || p.type==='acid_pool') { 
            if(p.size < p.maxSize) p.size += 2; 
        }
        else if(p.type==='slash') { p.x=player.x+Math.cos(p.ang)*40; p.y=player.y+Math.sin(p.ang)*40; }
        
        if(p.life <= 0 && !p.cancelledPayload) {
             if(p.type === 'cluster_bomb' || p.type === 'corrosive_flask' || p.type === 'firework_rocket' || p.type === 'volatile_remnant') {
                 p.hitTarget = null;
                 triggerPayloadEffect(p);
             }
             if(p.type === 'phosphorus_breach') {
                 triggerStickyBomb(p);
             }
        }
    }
    
    projectiles = projectiles.filter(p => p.life > 0 && p.type !== 'cryo_shot_dead'); 

    // --- [COLLISION LIST PREPARATION] ---
    let targets = [...enemies];
    if(activeBoss && activeBoss.state !== 0 && activeBoss.state !== 5) { 
        targets.push(activeBoss);
    }

    // 3. Collision Detection
    projectiles.forEach(p => {
        if (!p.hitList) p.hitList = [];
        
        // --- A. 敵人子彈/技能 擊中玩家 ---
        if (p.isEnemy) {
            if (player.isDashing) return; 
            
            if (p.type === 'boss_slash') {
                if (p.hitList.includes('player')) return; 
                
                let dist = Math.hypot(player.x - p.x, player.y - p.y);
                if (dist < p.size) {
                    let angleToPlayer = Math.atan2(player.y - p.y, player.x - p.x);
                    let angleDiff = angleToPlayer - p.angle;
                    while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    
                    if (Math.abs(angleDiff) < Math.PI / 4) {
                        player.hp -= p.dmg;
                        spawnParticles(player.x, player.y, 8, '#ff0000');
                        dmgNums.push({x: player.x, y: player.y - 20, val: "-" + Math.floor(p.dmg), life: 1.0, color: '#ff0000', size: 20});
                        
                        if(p.knockback) {
                            let kAng = Math.atan2(player.y - p.y, player.x - p.x);
                            player.x += Math.cos(kAng) * p.knockback;
                            player.y += Math.sin(kAng) * p.knockback;
                        }

                        p.hitList.push('player');
                        if(player.hp <= 0) gameOver();
                    }
                }
                return;
            }

            let dist = Math.hypot(p.x - player.x, p.y - player.y);
            let hitRadius = p.size;
            if (p.type === 'explosion_instant') hitRadius = p.maxSize || p.size;
            
            if(dist < hitRadius + player.radius) {
                if(p.type === 'explosion_instant' && p.hitList.includes('player')) return;
                player.hp -= p.dmg;
                spawnParticles(player.x, player.y, 8, '#ff0000');
                dmgNums.push({
                    x: player.x, y: player.y - 20, 
                    val: "-" + Math.floor(p.dmg), life: 1.0, color: '#ff0000', size: 16
                });
                
                if(p.knockback) {
                    let kAng = Math.atan2(player.y - p.y, player.x - p.x);
                    player.x += Math.cos(kAng) * p.knockback;
                    player.y += Math.sin(kAng) * p.knockback;
                }

                if (p.type === 'explosion_instant') p.hitList.push('player');
                else p.life = 0; 
                if(player.hp <= 0) gameOver();
            }
            return; 
        }
        
        // --- BOSS 身體碰撞 (修正版) ---
        if(activeBoss && activeBoss.state !== 0 && activeBoss.state !== 5) {
            let dist = Math.hypot(activeBoss.x - player.x, activeBoss.y - player.y);
            if(dist < activeBoss.def.size + player.radius) {
                if (!player.isDashing) {
                    // 1. 物理推擠 (保留，防止穿模)
                    let pushAngle = Math.atan2(player.y - activeBoss.y, player.x - activeBoss.x);
                    player.x += Math.cos(pushAngle) * 5;
                    player.y += Math.sin(pushAngle) * 5;
                    
                    // 2. 傷害判定 (僅當 isBodyDamageActive 為真時才受傷)
                    if(activeBoss.isBodyDamageActive) {
                        player.hp -= activeBoss.dmg * 0.1; 
                        if(Math.random() < 0.3) {
                            dmgNums.push({x: player.x, y: player.y-20, val: "-" + Math.floor(activeBoss.dmg*0.1), life:0.5, color:'#f00', size:14});
                        }
                        if(player.hp <= 0) gameOver();
                    }
                }
            }
        }

        // --- B. 玩家技能擊中敵人 (DoT / Zone 類型) ---
        if(p.type === 'gravity_zone') {
            targets.forEach(e => {
                let dx = p.x - e.x, dy = p.y - e.y;
                let dist = Math.hypot(dx, dy);
                if(dist < p.size) {
                    let angle = Math.atan2(dy, dx);
                    let resistance = (e === activeBoss) ? 0.1 : 1.0;
                    let force = p.gravityForce * (1 - dist/p.size) * resistance; 
                    e.x += Math.cos(angle) * force * (dt*60);
                    e.y += Math.sin(angle) * force * (dt*60);
                    let now = Date.now();
                    let lastHit = p.hitTimers.get(e) || 0;
                    if(now - lastHit > 800) {
                        applyDamage(e, p.dmg, p.isCrit, p.execute, '#888', p.corpseExplode, p.corpseDmg);
                        p.hitTimers.set(e, now);
                    }
                }
            });
        }
        else if(p.type === 'acid_pool') {
            targets.forEach(e => {
                let dist = Math.hypot(p.x - e.x, p.y - e.y);
                if(dist < p.size) {
                    e.vulnTimer = 60; 
                    let now = Date.now();
                    let lastHit = p.hitTimers.get(e) || 0;
                    if(now - lastHit > 500) { 
                        applyDamage(e, p.dmg, p.isCrit, p.execute, '#a03000', p.corpseExplode, p.corpseDmg);
                        p.hitTimers.set(e, now);
                    }
                }
            });
        }
        else if(p.type === 'pool') {
            targets.forEach(e => {
                let dist = Math.hypot(p.x - e.x, p.y - e.y);
                if(dist < p.size) {
                    let now = Date.now();
                    if(!p.hitTimers) p.hitTimers = new Map();
                    let lastHit = p.hitTimers.get(e) || 0;
                    if(now - lastHit > 250) { 
                        applyDamage(e, p.dmg, p.isCrit, p.execute, '#33ff00', p.corpseExplode, p.corpseDmg);
                        p.hitTimers.set(e, now);
                        if(Math.random()<0.3) spawnParticles(e.x, e.y, 2, '#33ff00');
                        if(p.knockback && p.knockback > 0) {
                             let resistance = (e === activeBoss) ? 0.05 : 1.0;
                             let kAng = Math.atan2(e.y - p.y, e.x - p.x);
                             e.x += Math.cos(kAng) * p.knockback * 2 * resistance; 
                             e.y += Math.sin(kAng) * p.knockback * 2 * resistance;
                        }
                    }
                }
            });
        }
        else if(p.type === 'boomerang') {
             targets.forEach(e => {
                let dist = Math.hypot(p.x - e.x, p.y - e.y);
                if(dist < p.size + e.size) {
                    let now = Date.now();
                    if(!p.hitTimers) p.hitTimers = new Map();
                    let lastHit = p.hitTimers.get(e) || 0;
                    if(now - lastHit > 200) { 
                        applyDamage(e, p.dmg, p.isCrit, p.execute, '#ff0055', p.corpseExplode, p.corpseDmg);
                        p.hitTimers.set(e, now);
                        spawnParticles(e.x, e.y, 3, '#ff0055');
                        if(p.knockback) {
                             let kAng = Math.atan2(e.y - p.y, e.x - p.x);
                             e.x += Math.cos(kAng) * p.knockback * 2; 
                             e.y += Math.sin(kAng) * p.knockback * 2;
                        }

                        if(p.fork && p.fork > 0) {
                            p.fork--;
                            let spd = p.initialSpeed || 14; 
                            let baseAng = Math.atan2(p.vy, p.vx);
                            if(Math.abs(p.vx) < 0.1 && Math.abs(p.vy) < 0.1) { baseAng = Math.random() * 6.28; }
                            spawnParticles(p.x, p.y, 10, '#ffccff');
                            for(let k=-1; k<=1; k+=2) {
                                let fAng = baseAng + (k * 0.5); 
                                let child = { ...p };
                                child.vx = Math.cos(fAng) * spd; child.vy = Math.sin(fAng) * spd;
                                child.size = Math.max(3, p.size * 0.6); child.dmg = p.dmg * 0.6; 
                                child.life = 1.5; child.pierce = 999; child.fork = 0; child.returnState = 0; 
                                child.hitTimers = new Map(); child.hitTimers.set(e, now + 500); 
                                projectiles.push(child);
                            }
                        }
                    }
                }
             });
        }
        else if(p.type === 'spiral_orb') {
             let hitRadius = p.currentSize || p.size;
             targets.forEach(e => {
                let dist = Math.hypot(p.x - e.x, p.y - e.y);
                if(dist < hitRadius + e.size) {
                    let now = Date.now();
                    if(!p.hitTimers) p.hitTimers = new Map();
                    let lastHit = p.hitTimers.get(e) || 0;
                    if(now - lastHit > 200) { 
                        applyDamage(e, p.dmg, p.isCrit, p.execute, '#cc00ff', p.corpseExplode, p.corpseDmg);
                        p.hitTimers.set(e, now);
                        spawnParticles(e.x, e.y, 2, '#cc00ff');
                        if(p.knockback) {
                             let kAng = Math.atan2(e.y - p.centerY, e.x - p.centerX);
                             e.x += Math.cos(kAng) * p.knockback * 2; 
                             e.y += Math.sin(kAng) * p.knockback * 2;
                        }
                    }
                }
             });
        }
        else if(p.type === 'helium_whirlwind') {
            let pullRange = p.size + 80;
            targets.forEach(e => {
                let dist = Math.hypot(player.x - e.x, player.y - e.y);
                if(dist < pullRange && dist > 20) {
                     let angle = Math.atan2(player.y - e.y, player.x - e.x);
                     let resistance = (e === activeBoss) ? 0.05 : 1.0;
                     e.x += Math.cos(angle) * p.pullForce * resistance * (dt*60);
                     e.y += Math.sin(angle) * p.pullForce * resistance * (dt*60);
                }

                if(dist < p.size + e.size) {
                    let now = Date.now();
                    if(!p.hitTimers) p.hitTimers = new Map();
                    let lastHit = p.hitTimers.get(e) || 0;
                    let interval = p.tickRate * 1000;
                    
                    if(now - lastHit > interval) {
                        applyDamage(e, p.dmg, p.isCrit, p.execute, '#00ffff', p.corpseExplode, p.corpseDmg);
                        p.hitTimers.set(e, now);
                        spawnParticles(e.x, e.y, 1, '#00ffff');
                    }
                }
            });
        }

        // 一般碰撞與瞬間爆炸
        targets.forEach(e => {
            if(e.vulnTimer && e.vulnTimer > 0) { e.vulnTimer--; if(Math.random() < 0.1) spawnParticles(e.x, e.y, 1, '#a03000'); }
            if(p.type === 'laser' || p.type === 'gravity_zone' || p.type === 'acid_pool' || p.type === 'pool' || p.type === 'volatile_remnant' || p.type === 'warning_zone' || p.type === 'turret' || p.type === 'boomerang' || p.type === 'spiral_orb' || p.type === 'helium_whirlwind' || p.type === 'phosphorus_breach') return; 

            let hitbox = e === activeBoss ? e.def.size : e.size;
            let hit=false, dist=Math.hypot(p.x-e.x, p.y-e.y);
            let hitSize = (p.type === 'explosion_instant' || p.type === 'phosphorus_explosion' || p.type === 'smite_bolt') ? p.maxSize : (p.size + hitbox);
            
            if(p.type === 'smite_bolt') hitSize = p.size; // Smite size fix

            if(dist < hitSize) hit=true;
            if(hit) {
                // 原有的 slash 判定
                if(p.type === 'slash') {
                    let dx = e.x - player.x, dy = e.y - player.y;
                    let angleToEnemy = Math.atan2(dy, dx);
                    let angleDiff = angleToEnemy - p.ang;
                    while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    if (Math.abs(angleDiff) > Math.PI / 2) hit = false;
                }
                // [新增] 釙-鞭笞的角度檢測 (修復打到背後的問題)
                else if(p.type === 'whip_slash') {
                    let dx = e.x - player.x, dy = e.y - player.y;
                    let angleToEnemy = Math.atan2(dy, dx);
                    let angleDiff = angleToEnemy - p.angle; // 注意: whip 使用 p.angle
                    while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    // 限制角度 (1.0 弧度約等於 57度，左右各57度即扇形寬度)
                    if (Math.abs(angleDiff) > 1.0) hit = false;
                }
            }
            
            if(hit) {
                if(p.type === 'cloud') {
                    let now = Date.now();
                    let lastHit = p.hitTimers.get(e) || 0;
                    if(now - lastHit > 200) { 
                        applyDamage(e, p.dmg, p.isCrit, p.execute, '#ccff00', p.corpseExplode, p.corpseDmg);
                        p.hitTimers.set(e, now);
                        if(p.knockback > 0) {
                             let kAng = Math.atan2(e.y - p.y, e.x - p.x);
                             e.x += Math.cos(kAng) * p.knockback * 2; 
                             e.y += Math.sin(kAng) * p.knockback * 2;
                        }
                    }
                    return; 
                }

                if(p.type === 'explosion_instant' || p.type === 'phosphorus_explosion' || p.type === 'smite_bolt') { 
                     if(!p.hitList.includes(e)) {
                         applyDamage(e, p.dmg, p.isCrit, p.execute, p.color, p.corpseExplode, p.corpseDmg);
                         p.hitList.push(e); 
                         if(p.knockback) {
                             let kAng = Math.atan2(e.y - p.y, e.x - p.x);
                             if(p.type === 'smite_bolt') kAng = Math.atan2(e.y - p.y, e.x - p.x); // Radial knockback
                             e.x += Math.cos(kAng) * p.knockback * 5; 
                             e.y += Math.sin(kAng) * p.knockback * 5;
                         }
                     }
                }
                else if(!p.hitList.includes(e)) {
                    let shouldDestroy = true;
                    
                    if (p.type === 'heavy_slug') {
                         applyDamage(e, p.dmg, p.isCrit, p.execute, p.color, p.corpseExplode, p.corpseDmg);
                    } else if (p.type === 'cryo_shot') {
                         applyDamage(e, p.dmg, false, p.execute, '#00ffff', p.corpseExplode, p.corpseDmg);
                         spawnParticles(e.x,e.y, 5 * (p.areaScale||1), p.color);
                    } else {
                         applyDamage(e, p.dmg, p.isCrit, p.execute, p.color, p.corpseExplode, p.corpseDmg);
                         if(p.aftershockChance && Math.random() < p.aftershockChance) {
                        // 觸發餘震，位置在敵人身上
                        triggerAftershock(e.x, e.y, p.aftershockDmg || (p.dmg * 0.5), p.areaScale, p.isCrit);
                        // 避免重複觸發 (如果是穿透性攻擊，每次命中獨立計算，但為了效能可以設限)
                        // 這裡我們允許每次命中都判定
                    }

                    // [Custom Feature] Specific Logic for New Types
                    if(p.type === 'crystal_spike') {
                        // 晶體尖刺不銷毀，直到壽命結束 (pierce 999 已經在 weaponSystem 設定)
                        if(!p.hitList.includes(e)) {
                            p.hitList.push(e);
                            // 強制極大擊退
                            let kAng = Math.atan2(e.y - player.y, e.x - player.x);
                            e.x += Math.cos(kAng) * p.knockback * 4; 
                            e.y += Math.sin(kAng) * p.knockback * 4;
                        }
                    }
                    else if(p.type === 'whip_slash') {
                         if(!p.hitList.includes(e)) {
                            p.hitList.push(e);
                            // 額外 DoT 效果可以用現有的 acid_pool 模擬，或直接給傷害
                            // 這裡直接給予額外的一次性毒素傷害模擬 DoT
                            applyDamage(e, p.dmg * 0.3, false, 0, '#88ff00');
                        }
                    }
                    // [New Effect] Cs: Chain Lightning Trigger
                    if(p.triggerChain) {
                        // 產生一個離子閃電，從敵人位置射出，尋找下一個敵人
                        let chainP = {
                            x: e.x, y: e.y, vx: 0, vy: 0,
                            life: 0.3, size: 2, dmg: p.chainDmg,
                            type: 'ion_arc', color: '#88aaff',
                            isCrit: p.isCrit, pierce: 0, knockback: 0,
                            bounce: 2, // 彈跳2次
                            chainRange: p.chainRange,
                            hitList: [e] // 避免打到自己
                        };
                        // 立即尋找第一個彈跳目標給予速度，否則 ion_arc 邏輯會刪除它
                        let target = null, minD = p.chainRange;
                        targets.forEach(other => {
                            if(other !== e) {
                                let d = Math.hypot(other.x - e.x, other.y - e.y);
                                if(d < minD) { minD = d; target = other; }
                            }
                        });
                        if(target) {
                            let ang = Math.atan2(target.y - e.y, target.x - e.x);
                            chainP.vx = Math.cos(ang) * 15; chainP.vy = Math.sin(ang) * 15;
                            projectiles.push(chainP);
                        } else {
                            // 沒目標就隨機射
                            let ang = Math.random()*6.28;
                            chainP.vx = Math.cos(ang) * 15; chainP.vy = Math.sin(ang) * 15;
                            projectiles.push(chainP);
                        }
                    }

                    // [New Effect] Tl: Thallium Cloud Spawn
                    if(p.spawnCloudRatio && p.spawnCloudRatio > 0) {
                         projectiles.push({
                            x: e.x, y: e.y, vx: 0, vy: 0,
                            life: 2.0, // 持續2秒
                            size: 40 * (p.areaScale || 1), 
                            dmg: p.dmg * p.spawnCloudRatio, // 傷害比例
                            type: 'cloud', color: '#00ff00', // 重用 cloud 邏輯
                            isCrit: false, pierce: 999, knockback: 0,
                            hitTimers: new Map()
                        });
                    }

                    // [New Effect] At: Astatine Pull (Vacuum)
                    if(p.type === 'astatine_scythe') {
                        // 強制吸入效果 (覆寫 knockback)
                        let pullAng = Math.atan2(p.y - e.y, p.x - e.x); // 指向中心
                        e.x += Math.cos(pullAng) * p.pullForce * 5;
                        e.y += Math.sin(pullAng) * p.pullForce * 5;
                        p.knockback = 0; // 確保不會被推開
                    }
                         let pCount = (p.isCrit?8:3) * (p.areaScale || 1);
                         spawnParticles(e.x,e.y, pCount, p.color);
                         if(p.knockback > 0) {
                            let kAng = (p.type==='slash' || p.type==='wave' || p.type==='fissure_wave') ? Math.atan2(e.y - player.y, e.x - player.x) : Math.atan2(p.vy, p.vx);
                            if(p.type==='fissure_wave') kAng = p.angle;
                            e.x += Math.cos(kAng) * p.knockback * 5; e.y += Math.sin(kAng) * p.knockback * 5;
                         }
                    }

                    let forked = false;
                    if(p.fork && p.fork > 0) {
                        p.fork--;
                        forked = true;
                        let baseAng = Math.atan2(p.vy, p.vx);
                        let spd = Math.hypot(p.vx, p.vy);
                        for(let k=-1; k<=1; k+=2) {
                            let fAng = baseAng + (k * 0.4); 
                            let child = { ...p };
                            child.x = p.x; child.y = p.y;
                            child.vx = Math.cos(fAng) * spd; child.vy = Math.sin(fAng) * spd;
                            child.life = p.life * 0.8; child.dmg = p.dmg * 0.6; 
                            child.size = Math.max(2, p.size * 0.7);
                            child.areaScale = (p.areaScale || 1) * 0.7; 
                            child.pierce = 0; child.fork = 0; 
                            child.hitList = [e]; 
                            child.hitTimers = new Map();
                            if(child.subDmg) child.subDmg *= 0.6;
                            projectiles.push(child);
                        }
                        shouldDestroy = true; 
                        p.cancelledPayload = true; 
                    }

                    if(!forked) {
                        if(p.type === 'phosphorus_thrust') {
                             shouldDestroy = false;
                             p.hitList.push(e);
                             
                             if(!e.hasStickyBomb) {
                                 e.hasStickyBomb = true; 
                                 projectiles.push({
                                     x: e.x, y: e.y, vx:0, vy:0,
                                     life: 1.2 * (p.durationScale || 1), 
                                     type: 'phosphorus_breach', 
                                     targetEnemy: e, 
                                     dmg: p.explosionDmg, 
                                     areaScale: p.explosionArea,
                                     isCrit: p.isCrit, execute: p.execute,
                                     corpseExplode: p.corpseExplode, corpseDmg: p.corpseDmg
                                 });
                             }
                        }
                        else if(p.pierce && p.pierce > 0) {
                            p.pierce--; 
                            shouldDestroy = false;
                            p.hitList.push(e); 
                        } 
                        else if (p.bounce && p.bounce > 0) {
                            p.bounce--;
                            shouldDestroy = false;
                            p.hitList.push(e); 
                        }
                        else if(p.type === 'wave' || p.type === 'fissure_wave') {
                             shouldDestroy = false;
                             p.hitList.push(e);
                        }
                    }

                    if(!shouldDestroy && !forked && p.hitList.includes(e) && (p.bounce !== undefined)) { 
                         let target = null;
                         let minD = p.type === 'ion_arc' ? p.chainRange : 400; 
                         targets.forEach(other => {
                            if(other !== e && !p.hitList.includes(other)) { 
                                let d = Math.hypot(other.x - p.x, other.y - p.y);
                                if(d < minD) { minD = d; target = other; }
                            }
                         });
                         if(target) {
                            let ang = Math.atan2(target.y - p.y, target.x - p.x);
                            let currentSpd = Math.hypot(p.vx, p.vy);
                            p.vx = Math.cos(ang) * currentSpd;
                            p.vy = Math.sin(ang) * currentSpd;
                            if(p.type === 'ion_arc') { p.x = e.x; p.y = e.y; }
                         } else {
                            if(p.type === 'ion_arc') p.life = 0; 
                            else { p.vx = -p.vx; p.vy = -p.vy; } 
                         }
                    }

                    if(shouldDestroy) {
                        p.life = 0;
                        if(!p.cancelledPayload) {
                            if(p.type === 'cryo_shot') triggerPayloadEffect(p);
                            if(p.type === 'cluster_bomb' || p.type === 'heavy_slug' || p.type === 'corrosive_flask' || p.type === 'firework_rocket') {
                                p.hitTarget = e;
                                triggerPayloadEffect(p);
                            }
                        }
                        if(p.type === 'cryo_shot') p.type = 'cryo_shot_dead'; 
                    }
                }
            }
        });
    });
}

function applyDamage(e, dmg, isCrit, executeThreshold, color='#fff', corpseChance=0, corpseDmg=0) {
    if(e.vulnTimer > 0) {
        dmg *= 1.3; 
        color = '#ff8800'; 
    }

    let effExecute = executeThreshold;
    if(e === activeBoss) effExecute *= 0.1; 

    if(effExecute && effExecute > 0 && e.hp < e.maxHp * effExecute) {
        e.hp = 0;
        dmgNums.push({x:e.x, y:e.y, val:"EXECUTE", life:1, color:'#cc00ff', size:18});
        spawnParticles(e.x, e.y, 15, '#cc00ff');
    } else {
        e.hp -= dmg;
        e.flash = 3; 
        dmgNums.push({
            x:e.x, y:e.y, val:Math.floor(dmg), life:1, 
            color: isCrit?'#ff0':color, size: isCrit?24:16, isCrit: isCrit 
        });
    }

    if(e !== activeBoss && e.hp <= 0 && corpseChance > 0 && Math.random() < corpseChance) {
        let lifeTime = 0.1;
        projectiles.push({
            x:e.x, y:e.y, vx:0, vy:0, life:lifeTime, maxLife: lifeTime,
            size:1, maxSize:60, 
            dmg: corpseDmg, type: 'explosion_instant', color: '#ffaaaa',
            isCrit: false, knockback: 3, hitList: [] 
        });
        spawnParticles(e.x, e.y, 8, '#ffaaaa');
        showToast("Chain Reaction!");
    }
}

// [combatPhysics.js] - 新增此函數
function triggerAftershock(x, y, dmg, scale, isCrit) {
    projectiles.push({
        x: x, y: y, vx: 0, vy: 0,
        life: 0.3, maxLife: 0.3,
        size: 40 * (scale || 1), maxSize: 60 * (scale || 1),
        dmg: dmg,
        type: 'explosion_instant', // 復用現有的爆炸邏輯
        color: '#aaaaaa', // 物理灰白色
        isCrit: isCrit,
        hitList: [],
        knockback: 2
    });
    // 簡單的特效
    spawnParticles(x, y, 5, '#aaaaaa');
}
