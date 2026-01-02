// --- weaponSystem.js ---
// 武器發射邏輯與數值計算

// [修改] weaponSystem.js
// 增加 weaponStats 參數，套用武器的傷害倍率與暴擊率

function fireElement(elDef, level, supports, weaponStats = { dmgMult: 1.0, crit: 0 }) {
    let type = elDef.attack.type;
    
    let bonusLevels = 0;
    supports.forEach(sup => {
        if(sup.effect.type === 'plus_level') {
            let base = sup.effect.base || 0;
            bonusLevels += Math.floor(base + ((sup.level - 1) * (sup.effect.growth || 0)));
        }
    });

    let calcLevel = level + bonusLevels;
    
    // 基礎傷害計算
    let baseDmg = 10 * Math.pow(1.08, calcLevel - 1);
    
    // 初始化變數
    let sizeScale = 1;
    let velocityScale = 1;
    let durationScale = 1; 
    let areaScale = 1;
    
    // [修改] 暴擊率加上武器加成
    let critChance = 0.05 + (weaponStats.crit || 0); 
    
    let projCount = 1;
    let speedMod = 1; 
    
    let pierceCount = elDef.nativePierce || 0; 
    let knockbackVal = 0; 
    let multishotAdd = 0; 
    let bounceCount = 0; 
    let homingVal = 0; 
    let executeThreshold = 0; 
    let forkCount = 0; 
    
    let critDmgBonus = 0; 
    let corpseExplodeChance = 0; 
    let corpseExplodeDmgScale = 0; 
    let repeatCount = 0; // Multistrike 支援

    // [修改] 傷害倍率乘上武器加成
    let dmgMultiplier = 1.0 * (weaponStats.dmgMult || 1.0); 

    let nativeMult = elDef.dmgMult || 1.0;
    let nativeArea = elDef.areaRatio || 1.0;
    let aftershockChance = 0;

    supports.forEach(sup => {
        let sLvl = sup.level || 1;
        let growthMult = sLvl - 1; 
        
        let base = sup.effect.base || 0;
        let growth = sup.effect.growth || 0;

        if(sup.effect.type === 'dmg') {
            let bonus = base + (growthMult * growth);
            dmgMultiplier *= (1 + bonus); 
        }
        if(sup.effect.type === 'velocity') { 
            let bonus = base + (growthMult * growth);
            velocityScale += bonus;
        }
        if(sup.effect.type === 'area') { 
            let bonus = base + (growthMult * growth);
            areaScale += bonus; 
            sizeScale += (bonus * 0.6); 
        }
        if(sup.effect.type === 'crit') { 
            let bonus = base + (growthMult * growth);
            critChance += bonus; 
        }
        if(sup.effect.type === 'speed') {
            let bonus = base + (growthMult * growth);
            speedMod += bonus;
        }
        if(sup.effect.type === 'pierce') {
            pierceCount += (base + Math.floor(growthMult * growth));
        }
        if(sup.effect.type === 'knockback') {
            let bonus = base + (growthMult * growth);
            knockbackVal += bonus;
        }
        if(sup.effect.type === 'multishot') {
            multishotAdd += 2; 
            let reduction = base + (growthMult * growth); 
            if(reduction < 0) reduction = 0; 
            dmgMultiplier *= (1 - reduction);
        }
        if(sup.effect.type === 'bounce') {
            bounceCount += (base + Math.floor(growthMult * growth));
        }
        if(sup.effect.type === 'homing') {
            let bonus = base + (growthMult * growth);
            homingVal += bonus; 
        }
        if(sup.effect.type === 'execute') {
            let bonus = base + (growthMult * growth);
            executeThreshold += bonus; 
        }
        if(sup.effect.type === 'crit_dmg') {
            let bonus = base + (growthMult * growth);
            critDmgBonus += bonus;
        }
        if(sup.effect.type === 'corpse_explosion') {
            let bonus = base + (growthMult * growth);
            corpseExplodeChance += bonus;
            corpseExplodeDmgScale = 0.5 + (growthMult * 0.05); 
        }
        if(sup.effect.type === 'duration') {
            let bonus = base + (growthMult * growth);
            durationScale += bonus;
        }
        if(sup.effect.type === 'fork') {
            forkCount += (base + Math.floor(growthMult * growth));
        }
        if(sup.effect.type === 'swiftness') {
             let moreDmg = base + (growthMult * growth);
             let lessDur = 0.20 + (growthMult * 0.01); 
             if(lessDur > 0.6) lessDur = 0.6;
             dmgMultiplier *= (1 + moreDmg);
             durationScale *= (1 - lessDur);
        }
        if(sup.effect.type === 'multistrike') {
            let speedBonus = base + (growthMult * growth);
            speedMod *= (1 + speedBonus); // More Attack Speed
            dmgMultiplier *= 0.7; // 30% Less Damage balance
            repeatCount += 1; // Repeat once (Total 2 hits)
        }
        if(sup.effect.type === 'concentrated') {
            let dmgBonus = base + (growthMult * growth);
            dmgMultiplier *= (1 + dmgBonus); // More Damage
            areaScale *= 0.7; // 30% Less Area
        }
        // [New Support] In (Indium): Aftershock (Melee Only)
        if(sup.effect.type === 'aftershock') {
            // base 0.5 (50%) chance, +5% per level
            let chance = base + (growthMult * growth);
            if(chance > 1.0) chance = 1.0;
            // 將此機率存入一個變數，稍後傳給 projectile
            // 注意：我們需要在 fireElement 函數開頭宣告 let aftershockChance = 0;
            if(typeof aftershockChance === 'undefined') window.aftershockChance = 0; // 防呆
            aftershockChance += chance;
        }

        // [New Support] Te (Tellurium): Heavy Ammo (Projectile Only)
        if(sup.effect.type === 'heavy_ammo') {
            let pwr = base + (growthMult * growth); // 0.3 + ...
            dmgMultiplier *= (1 + pwr);      // More Damage
            knockbackVal += (3 + pwr * 5);   // Huge Knockback bonus
            velocityScale *= (1 - 0.3);      // 30% Less Speed
        }
    });

    let dmg = baseDmg * dmgMultiplier * nativeMult;
    let baseCritMult = 1.5; 
    let finalCritMult = baseCritMult + critDmgBonus;
    
    if(type === 'ion_arc' && pierceCount > 0) {
        bounceCount += pierceCount;
        pierceCount = 0;
    }
    
    if(executeThreshold > 0.15) executeThreshold = 0.15; 

    let totalProj = projCount + multishotAdd;
    if(type === 'shotgun') totalProj = 3 + multishotAdd;
    
    // [Modified] 哨塔固定為 1 個，多重投射的效果改為傳遞給哨塔屬性
    if(type === 'turret') totalProj = 1; 

    if(type === 'boomerang') totalProj = 1 + multishotAdd;
    if(type === 'spiral_orb') totalProj = 1 + multishotAdd;
    if(type === 'thrust') totalProj = 1; 
    if(type === 'whirlwind') totalProj = 1;
    if(type === 'fissure') totalProj = 1; 
    if(type === 'smite') totalProj = 1; 

    let finalAreaMult = areaScale * nativeArea;

    let isCrit = Math.random() < critChance;
    let finalDmg = dmg;
    if (isCrit) finalDmg *= finalCritMult;

    // Helper to spawn attacks (for Multistrike repeating)
    const spawnAttack = (projIndex, repeatIndex) => {
        // 1. 投射物 (火球/氫)
        if(type === 'projectile') { 
            let t = getNearestEnemy();
            let ang = Math.random()*6.28;
            if(t) ang = Math.atan2(t.y-player.y, t.x-player.x);
            
            if(totalProj > 1) {
                let spread = 0.4; 
                let startAng = ang - spread/2;
                ang = startAng + (spread / (totalProj > 1 ? totalProj-1 : 1)) * projIndex;
            } else {
                ang += (Math.random()-0.5)*0.1;
            }

            let baseSpeed = 12;
            let baseLife = 0.65;

            let spd = baseSpeed * velocityScale; 
            let lifeTime = (baseLife / velocityScale); 
            
            projectiles.push({
                x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                life: lifeTime, size:5*sizeScale, dmg: finalDmg, type:'bullet', color:'#ff5500', 
                isCrit:isCrit, pierce: pierceCount, knockback: knockbackVal, bounce: bounceCount,
                homing: homingVal, execute: executeThreshold, fork: forkCount,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        } 
        // 2. 冰凍 (氮)
        else if(type === 'cryo') { 
            let t = getNearestEnemy();
            let ang = Math.random()*6.28;
            if(t) ang = Math.atan2(t.y-player.y, t.x-player.x);
            
            if(totalProj > 1) {
                let spread = 0.5;
                let startAng = ang - spread/2;
                ang = startAng + (spread / (totalProj-1)) * projIndex;
            } else {
                 ang += (Math.random()-0.5)*0.2;
            }

            let baseSpeed = 10;
            let baseLife = 0.75; 

            let spd = baseSpeed * velocityScale;
            let lifeTime = (baseLife / velocityScale);

            projectiles.push({
                x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                life: lifeTime, size:6*sizeScale, dmg:finalDmg, type:'cryo_shot', areaScale: finalAreaMult, 
                isCrit:isCrit, pierce: pierceCount, knockback: knockbackVal, bounce: bounceCount,
                homing: homingVal, execute: executeThreshold, fork: forkCount,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale,
                durationScale: durationScale 
            });
        }
        // 3. 地面 (磷 - 舊版相容)
        else if(type === 'pool') { 
            let t = getNearestEnemy();
            let tx = player.x, ty = player.y;
            if(t) { tx = t.x; ty = t.y; }
            if(projIndex > 0) { tx += (Math.random()-0.5) * 100; ty += (Math.random()-0.5) * 100; }

            projectiles.push({
                x:tx, y:ty, vx:0, vy:0, 
                life: 4 * durationScale, 
                size:5, maxSize: 60 * finalAreaMult, 
                dmg: finalDmg, 
                type:'pool', color:'#33ff00', isCrit:isCrit, knockback: knockbackVal, hitTimers: new Map(),
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 4. 環繞 (氦 - 舊版相容)
        else if(type === 'orbit') { 
            let spd = 4 * velocityScale;
            projectiles.push({
                x:player.x, y:player.y, vx:0, vy:0, 
                life: 3 * durationScale, 
                size:8*sizeScale, 
                dmg: finalDmg, 
                type:'orbit', ang:Date.now()/1000*spd + (projIndex*(6.28/totalProj)), 
                color:'#00ffcc', areaScale: finalAreaMult, isCrit:isCrit, knockback: knockbackVal,
                pierce: pierceCount, 
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        } 
        // 5. 範圍 (氧)
        else if(type === 'area') { 
            projectiles.push({
                x:player.x, y:player.y, vx:0, vy:0, life:0.5, size:10, maxSize:120*finalAreaMult * (1 + projIndex*0.1), 
                dmg: finalDmg, 
                type:'wave', color:'#0088ff', isCrit:isCrit, knockback: knockbackVal,
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        } 
        // 6. 近戰 (碳)
        else if(type === 'melee') { 
            let t = getNearestEnemy();
            let baseAng = player.facing; 
            if(elDef.autoAim && t) {
                baseAng = Math.atan2(t.y - player.y, t.x - player.x);
            }
            
            let finalSize = 60 * finalAreaMult;
            let ang = baseAng;
            
            if(totalProj > 1) {
                let spread = 1.5; 
                let startAng = baseAng - spread/2;
                ang = startAng + (spread / (totalProj-1)) * projIndex;
            }
            if(repeatCount > 0 && repeatIndex % 2 === 1) {
                ang += 0.2; 
            }

            let life = 0.25 / speedMod; 
            
            projectiles.push({
                x:player.x, y:player.y, ang:ang, vx:Math.cos(ang)*2, vy:Math.sin(ang)*2, 
                life:life, maxLife:life, size:finalSize, 
                dmg: finalDmg, 
                pierce: 999, 
                type:'slash', 
                color:'#ffffff', isCrit:isCrit, knockback: knockbackVal,
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 7. 雷射 (氖)
        else if(type === 'laser') {
            let t = getNearestEnemy();
            let baseAng = player.facing;
            if(t) baseAng = Math.atan2(t.y - player.y, t.x - player.x);
            let ang = baseAng;
            if(totalProj > 1) {
                let spread = 0.5;
                let startAng = baseAng - spread/2;
                ang = startAng + (spread / (totalProj-1)) * projIndex;
            }
            
            let range = 450 * velocityScale; 
            let endX = player.x + Math.cos(ang) * range;
            let endY = player.y + Math.sin(ang) * range;
            
            enemies.forEach(e => {
                let A = player.x - e.x, B = player.y - e.y, C = endX - player.x, D = endY - player.y;
                let dot = A * C + B * D, len_sq = C * C + D * D, param = -dot / len_sq;
                let xx, yy;
                if (param < 0) { xx = player.x; yy = player.y; }
                else if (param > 1) { xx = endX; yy = endY; }
                else { xx = player.x + param * C; yy = player.y + param * D; }
                let dx = e.x - xx, dy = e.y - yy, dist = Math.hypot(dx, dy);

                if (dist < (10 * sizeScale) + e.size) {
                    if(executeThreshold > 0 && e.hp < e.maxHp * executeThreshold) {
                         e.hp = 0;
                         dmgNums.push({x:e.x, y:e.y, val:"EXECUTE", life:1, color:'#cc00ff', size:18});
                    } else {
                        applyDamage(e, finalDmg, isCrit, executeThreshold, '#ff3333', corpseExplodeChance, finalDmg*corpseExplodeDmgScale);
                    }
                    spawnParticles(e.x, e.y, 3, '#ff3333');
                    if(knockbackVal > 0) {
                        e.x += Math.cos(ang) * knockbackVal * 5;
                        e.y += Math.sin(ang) * knockbackVal * 5;
                    }
                }
            });

            projectiles.push({
                x: player.x, y: player.y, endX: endX, endY: endY,
                life: 0.2, maxLife: 0.2, size: 4 * sizeScale, 
                type: 'laser', color: '#ff0033'
            });
        }
        // 8. 集束炸彈 (鉀)
        else if(type === 'cluster') {
            let t = getNearestEnemy();
            let ang = Math.random()*6.28;
            if(t) ang = Math.atan2(t.y-player.y, t.x-player.x);
            
            if(totalProj > 1) {
                let spread = 0.6;
                let startAng = ang - spread/2;
                ang = startAng + (spread / (totalProj-1)) * projIndex;
            } else {
                ang += (Math.random()-0.5)*0.2;
            }
            let baseSpeed = 10;
            let baseLife = 0.75; 

            let spd = baseSpeed * velocityScale;
            let lifeTime = (baseLife / velocityScale);
            
            projectiles.push({
                x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                life: lifeTime, size: 8 * sizeScale, dmg: finalDmg, 
                type: 'cluster_bomb', color: '#aa00ff',
                isCrit: isCrit, pierce: pierceCount, knockback: knockbackVal, bounce: bounceCount,
                subDmg: finalDmg * 0.5, areaScale: finalAreaMult, subCount: 4 + Math.floor(finalAreaMult),
                homing: homingVal, execute: executeThreshold, fork: forkCount,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 9. 晶體霰彈 (矽)
        else if(type === 'shotgun') {
            let baseAng = player.facing;
            let t = getNearestEnemy();
            if(t) baseAng = Math.atan2(t.y - player.y, t.x - player.x);

            let spread = 0.8; 
            let startAng = baseAng - spread/2;
            let ang = startAng + (spread / (totalProj-1)) * projIndex;
            
            let baseSpeed = 14;
            let baseLife = 0.4; 

            let spd = baseSpeed * velocityScale;
            let lifeTime = (baseLife / velocityScale);
            
            projectiles.push({
                x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                life:life, size: 4 * sizeScale, 
                dmg: finalDmg, 
                type:'shard', color:'#ffffff', 
                isCrit:isCrit, pierce: 2 + pierceCount, knockback: knockbackVal + 2, bounce: bounceCount,
                homing: homingVal * 0.5,
                execute: executeThreshold, fork: forkCount,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 10. 毒雲 (氯)
        else if(type === 'cloud') {
            let t = getNearestEnemy();
            let ang = Math.random()*6.28;
            if(t) ang = Math.atan2(t.y-player.y, t.x-player.x);
            
            if(totalProj > 1) {
                let spread = 0.6;
                let startAng = ang - spread/2;
                ang = startAng + (spread / (totalProj-1)) * projIndex;
            }
            let baseSpeed = 3; 
            let baseLife = 1.6 * durationScale;

            let spd = baseSpeed * velocityScale;
            let lifeTime = (baseLife / velocityScale);

            projectiles.push({
                x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                life: lifeTime,
                size: 25 * finalAreaMult, 
                dmg: finalDmg, 
                type: 'cloud', color: '#ccff00',
                isCrit: isCrit, pierce: 999, knockback: knockbackVal, hitTimers: new Map(),
                homing: homingVal * 0.2, 
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 11. 離子閃電 (氙 Xe)
        else if(type === 'ion_arc') {
            let t = getNearestEnemy();
            let ang = Math.random()*6.28;
            if(t) ang = Math.atan2(t.y-player.y, t.x-player.x);
            
            if(totalProj > 1) {
                let spread = 0.6;
                let startAng = ang - spread/2;
                ang = startAng + (spread / (totalProj-1)) * projIndex;
            }

            let baseSpeed = 18; 
            let baseLife = 0.4; 

            let spd = baseSpeed * velocityScale;
            let lifeTime = (baseLife / velocityScale);

            let chains = 3 + bounceCount;
            
            projectiles.push({
                x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                life: lifeTime, size: 3 * sizeScale, dmg: finalDmg, 
                type: 'ion_arc', color: '#88aaff',
                isCrit: isCrit, pierce: 0, knockback: knockbackVal, 
                bounce: chains, 
                homing: homingVal + 0.1, 
                execute: executeThreshold,
                chainRange: 250 * finalAreaMult,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 12. 重力坍縮 (鉛 Pb)
        else if(type === 'heavy_slug') {
            let t = getNearestEnemy();
            let ang = Math.random()*6.28;
            if(t) ang = Math.atan2(t.y-player.y, t.x-player.x);
            
            if(totalProj > 1) {
                let spread = 0.4;
                let startAng = ang - spread/2;
                ang = startAng + (spread / (totalProj-1)) * projIndex;
            }

            let baseSpeed = 5; 
            let baseLife = 1.5; 

            let spd = baseSpeed * velocityScale;
            let lifeTime = (baseLife / velocityScale);
            
            projectiles.push({
                x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                life: lifeTime, size: 10 * sizeScale, 
                dmg: finalDmg, 
                type: 'heavy_slug', color: '#444455',
                isCrit: isCrit, pierce: pierceCount, 
                knockback: -3, 
                bounce: bounceCount,
                homing: homingVal * 0.5,
                execute: executeThreshold, fork: forkCount,
                gravityForce: 1.5 + knockbackVal * 0.5, 
                areaScale: finalAreaMult,
                durationScale: durationScale,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 13. 腐蝕燒瓶 (溴 Br)
        else if(type === 'corrosive_flask') {
             let t = getNearestEnemy();
             let ang = Math.random()*6.28;
             if(t) ang = Math.atan2(t.y-player.y, t.x-player.x);
             
             if(totalProj > 1) {
                 let spread = 0.5;
                 let startAng = ang - spread/2;
                 ang = startAng + (spread / (totalProj-1)) * projIndex;
             }
             let baseSpeed = 11;
             let baseLife = 0.7; 

             let spd = baseSpeed * velocityScale;
             let lifeTime = (baseLife / velocityScale);

             projectiles.push({
                 x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                 life: lifeTime, size: 6 * sizeScale, dmg: finalDmg, 
                 type: 'corrosive_flask', color: '#a03000',
                 isCrit: isCrit, pierce: pierceCount, knockback: knockbackVal,
                 bounce: bounceCount, 
                 homing: homingVal * 0.3,
                 execute: executeThreshold, fork: forkCount,
                 areaScale: finalAreaMult,
                 durationScale: durationScale, 
                 corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
             });
        }
        // 14. 鋇光煙火 (鋇 Ba)
        else if(type === 'firework') {
            let t = getNearestEnemy();
            let ang = Math.random()*6.28;
            if(t) ang = Math.atan2(t.y-player.y, t.x-player.x);
            
            if(totalProj > 1) {
                 let spread = 0.4;
                 let startAng = ang - spread/2;
                 ang = startAng + (spread / (totalProj-1)) * projIndex;
             }
             let baseSpeed = 6;
             let baseLife = 1.25;

             let spd = baseSpeed * velocityScale;
             let lifeTime = (baseLife / velocityScale);

            projectiles.push({
                x:player.x, y:player.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, 
                life: lifeTime, size: 5 * sizeScale, 
                dmg: finalDmg, 
                type: 'firework_rocket', color: '#33ff33',
                isCrit: isCrit, pierce: pierceCount, knockback: knockbackVal, bounce: bounceCount,
                homing: homingVal * 0.8, 
                execute: executeThreshold, fork: forkCount,
                areaScale: finalAreaMult,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 15. 稜鏡哨塔 (鉍 Bi)
        else if(type === 'turret') {
            let rx = player.x + (Math.random()-0.5) * 80;
            let ry = player.y + (Math.random()-0.5) * 80;
            
            let lifeTime = 6.0 * durationScale; 

            projectiles.push({
                x: rx, y: ry, vx: 0, vy: 0, 
                life: lifeTime, maxLife: lifeTime,
                size: 10 * sizeScale, 
                dmg: finalDmg, 
                type: 'turret', color: '#ffccff',
                isCrit: isCrit, pierce: pierceCount, knockback: knockbackVal, bounce: bounceCount,
                homing: homingVal, execute: executeThreshold, fork: forkCount,
                fireTimer: 0, 
                areaScale: finalAreaMult, velocityScale: velocityScale, 
                multishot: multishotAdd, // 傳遞多重投射數量給哨塔實體
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 16. 螺旋星雲 (銣 Rb)
        else if(type === 'spiral_orb') {
             let startAng = (Math.PI * 2 / totalProj) * projIndex + (Date.now()/1000); 
             let lifeTime = 4.0 * durationScale;
             
             projectiles.push({
                 x: player.x, y: player.y, 
                 vx: 0, vy: 0, 
                 centerX: player.x, centerY: player.y, 
                 angle: startAng,
                 radius: 10, 
                 life: lifeTime, maxLife: lifeTime,
                 size: 15 * sizeScale, 
                 dmg: finalDmg, 
                 type: 'spiral_orb', color: '#aa00cc',
                 isCrit: isCrit, pierce: 999, 
                 knockback: knockbackVal,
                 hitTimers: new Map(),
                 expansionRate: 60 * velocityScale, 
                 rotationSpeed: 3.0 * velocityScale, 
                 areaScale: finalAreaMult,
                 execute: executeThreshold,
                 corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
             });
        }
        // 17. 白磷突刺 (磷 P)
        else if(type === 'thrust') {
            let t = getNearestEnemy();
            let baseAng = player.facing;
            if(t) baseAng = Math.atan2(t.y - player.y, t.x - player.x);
            
            let baseSpeed = 20; 
            let baseLife = 0.15; 

            let spd = baseSpeed * velocityScale;
            let lifeTime = (baseLife / velocityScale);

            let spawnX = player.x;
            let spawnY = player.y;

            projectiles.push({
                x: spawnX, y: spawnY, 
                vx: Math.cos(baseAng) * spd, vy: Math.sin(baseAng) * spd, 
                angle: baseAng,
                life: lifeTime, maxLife: lifeTime,
                size: 20 * finalAreaMult, 
                dmg: finalDmg, 
                type: 'phosphorus_thrust', color: '#fffec8', 
                isCrit: isCrit, 
                pierce: 999, 
                knockback: knockbackVal + 2, 
                hitList: [], 
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale,
                explosionDmg: finalDmg * 2.0, 
                explosionArea: finalAreaMult,
                durationScale: durationScale
            });
        }
        // 18. 超流體旋風 (氦 He)
        else if(type === 'whirlwind') {
            let lifeTime = 3.0 * durationScale; 
            
            let existing = projectiles.find(p => p.type === 'helium_whirlwind' && p.ownerId === player);
            if(existing) {
                existing.life = lifeTime;
                existing.maxLife = lifeTime;
                existing.dmg = finalDmg; 
                existing.areaScale = finalAreaMult;
                return;
            }

            projectiles.push({
                x: player.x, y: player.y, 
                vx: 0, vy: 0, 
                life: lifeTime, maxLife: lifeTime,
                size: 50 * finalAreaMult, 
                dmg: finalDmg, 
                type: 'helium_whirlwind', color: '#00ffff', 
                isCrit: isCrit, 
                pierce: 999, 
                hitTimers: new Map(), 
                tickRate: 0.15 / speedMod, 
                pullForce: 0.8, 
                ownerId: player, 
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 19. 原子裂地 (鍅 Fr)
        else if(type === 'fissure') {
            let t = getNearestEnemy();
            let ang = player.facing;
            if(elDef.autoAim && t) ang = Math.atan2(t.y - player.y, t.x - player.x);
            
            if(repeatCount > 0 && repeatIndex % 2 === 1) {
                ang += (Math.random() - 0.5) * 0.4;
            }

            let baseSpeed = 10;
            let baseLife = 0.35 * durationScale; 

            let spd = baseSpeed * velocityScale;
            let lifeTime = (baseLife / velocityScale);

            projectiles.push({
                x: player.x, y: player.y, 
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, 
                angle: ang,
                life: lifeTime, maxLife: lifeTime,
                size: 30 * finalAreaMult, 
                dmg: finalDmg, 
                type: 'fissure_wave', 
                color: '#ff4400', 
                isCrit: isCrit, 
                pierce: 999, 
                knockback: knockbackVal + 5, 
                hitList: [],
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });
        }
        // 20. 鐳光重擊 (鐳 Ra)
        else if(type === 'smite') {
            let t = getNearestEnemy();
            let ang = player.facing;
            let targetX = player.x + Math.cos(ang) * 60;
            let targetY = player.y + Math.sin(ang) * 60;
            
            if(elDef.autoAim && t) {
                ang = Math.atan2(t.y - player.y, t.x - player.x);
                let dist = Math.hypot(t.x - player.x, t.y - player.y);
                if(dist < 150) { 
                    targetX = t.x; targetY = t.y;
                } else {
                    targetX = player.x + Math.cos(ang) * 120;
                    targetY = player.y + Math.sin(ang) * 120;
                }
            }

            projectiles.push({
                x: player.x, y: player.y, 
                vx: Math.cos(ang)*2, vy: Math.sin(ang)*2,
                ang: ang,
                life: 0.2, maxLife: 0.2, 
                size: 50 * finalAreaMult, 
                dmg: finalDmg, 
                type: 'slash', 
                color: '#ffffaa', 
                pierce: 999, isCrit: isCrit, knockback: knockbackVal,
                execute: executeThreshold, corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
            });

            setTimeout(() => {
                projectiles.push({
                    x: targetX, y: targetY, vx: 0, vy: 0,
                    life: 0.5, maxLife: 0.5,
                    size: 80 * finalAreaMult,
                    dmg: finalDmg * 1.2, 
                    type: 'smite_bolt', 
                    color: '#aaffff',
                    isCrit: isCrit,
                    hitList: [],
                    knockback: knockbackVal,
                    execute: executeThreshold, corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale
                });
            }, 100); 
        }

        // [weaponSystem.js] - 插入於 spawnAttack 函數內的攻擊類型判斷區

        // [New Active] Ge: 晶體新星 (Crystal Nova)
        // 360度發射短距離尖刺，不會移動，類似一种瞬間的 "Thrust" 陣列
        else if(type === 'crystal_nova') {
            // 基礎數量 8，受 multishot 影響
            let spikeCount = 8 + Math.floor(totalProj * 2); 
            
            for(let k=0; k<spikeCount; k++) {
                let ang = (Math.PI * 2 / spikeCount) * k;
                // 稍微隨機偏移
                if(repeatCount > 0) ang += 0.2;

                let lifeTime = 0.25; // 短暫存在
                let dist = 60 * finalAreaMult; 

                projectiles.push({
                    x: player.x, y: player.y, 
                    vx: Math.cos(ang) * (dist/lifeTime/60), // 計算速度以在 lifeTime 內達到 dist
                    vy: Math.sin(ang) * (dist/lifeTime/60), 
                    life: lifeTime, maxLife: lifeTime,
                    size: 15 * finalAreaMult, 
                    dmg: finalDmg, 
                    type: 'crystal_spike', // 對應 physics 與 render
                    color: '#e6e6fa', // 淡紫色/晶體色
                    isCrit: isCrit, 
                    pierce: 999, 
                    knockback: knockbackVal + 8, // 基礎擊退很高
                    hitList: [],
                    execute: executeThreshold,
                    corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale,
                    // 傳遞餘震機率
                    aftershockChance: aftershockChance,
                    aftershockDmg: finalDmg * 0.5
                });
            }
        }

        // [New Active] Po: 劇毒鞭笞 (Toxic Lash)
        // 揮出一條長鞭，判定為一個彎曲的形狀或一連串的點
        else if(type === 'whip') {
            let t = getNearestEnemy();
            let baseAng = player.facing; 
            if(elDef.autoAim && t) {
                baseAng = Math.atan2(t.y - player.y, t.x - player.x);
            }
            
            // 根據投射物數量扇形分佈
            let ang = baseAng;
            if(totalProj > 1) {
                let spread = 0.8; 
                let startAng = baseAng - spread/2;
                ang = startAng + (spread / (totalProj-1)) * projIndex;
            }

            let range = 180 * finalAreaMult;
            let lifeTime = 0.3;

            projectiles.push({
                x: player.x, y: player.y,
                vx: Math.cos(ang) * 2, vy: Math.sin(ang) * 2, // 稍微移動一點
                angle: ang,
                life: lifeTime, maxLife: lifeTime,
                size: range, // size 在這裡是長度
                dmg: finalDmg,
                type: 'whip_slash',
                color: '#88ff00',
                isCrit: isCrit,
                pierce: 999,
                knockback: knockbackVal + 1,
                hitList: [],
                execute: executeThreshold,
                corpseExplode: corpseExplodeChance, corpseDmg: finalDmg * corpseExplodeDmgScale,
                // 傳遞餘震機率
                aftershockChance: aftershockChance,
                aftershockDmg: finalDmg * 0.5
            });
        }
    };

    for(let i = 0; i < totalProj; i++) {
        spawnAttack(i, 0);

        if(repeatCount > 0) {
            let delayPerHit = 200 / speedMod; 
            for(let r = 1; r <= repeatCount; r++) {
                setTimeout(() => {
                    spawnAttack(i, r); 
                }, delayPerHit * r);
            }
        }
    }
}