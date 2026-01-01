// --- combatRender.js ---
// 戰鬥畫面渲染與特效
// [Patch] Added Boss Slash Visuals
// [Patch] Added Warning Zone Rendering & Beautified Damage Text
// [Patch] Added Fr (Fissure) & Ra (Smite) Visuals

function spawnParticles(x, y, count, color) {
    for(let i=0; i<count; i++) {
        let ang=Math.random()*6.28, spd=Math.random()*3+1;
        particles.push({x:x, y:y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, life:1.0, color:color});
    }
}

function drawCombatEffects() {
    CTX.globalCompositeOperation = 'lighter';
    projectiles.forEach(p => {
        CTX.shadowBlur=10; CTX.shadowColor=p.color;
        
        if(p.type==='bullet' || p.type==='cluster_frag' || p.type==='turret_bullet') {
            let grd = CTX.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.size);
            grd.addColorStop(0, '#fff'); grd.addColorStop(0.5, p.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
            CTX.fillStyle = grd;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
        } 
        else if(p.type === 'enemy_bullet') {
            let grd = CTX.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.size);
            grd.addColorStop(0, '#ffcccc'); 
            grd.addColorStop(0.4, '#ff0000'); 
            grd.addColorStop(1, 'rgba(50,0,0,0)');
            CTX.fillStyle = grd;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
            CTX.fillStyle = '#fff';
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size*0.3, 0, 6.28); CTX.fill();
        }
        else if(p.type==='shard') { 
            CTX.fillStyle = '#fff';
            CTX.beginPath();
            let ang = Math.atan2(p.vy, p.vx);
            CTX.moveTo(p.x + Math.cos(ang)*p.size*2, p.y + Math.sin(ang)*p.size*2);
            CTX.lineTo(p.x + Math.cos(ang+2)*p.size, p.y + Math.sin(ang+2)*p.size);
            CTX.lineTo(p.x - Math.cos(ang)*p.size, p.y - Math.sin(ang)*p.size);
            CTX.lineTo(p.x + Math.cos(ang-2)*p.size, p.y + Math.sin(ang-2)*p.size);
            CTX.fill();
        }
        else if(p.type==='cloud') { 
            let grd = CTX.createRadialGradient(p.x, p.y, p.size*0.2, p.x, p.y, p.size);
            grd.addColorStop(0, 'rgba(200, 255, 0, 0.4)'); 
            grd.addColorStop(0.6, 'rgba(100, 200, 0, 0.2)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            CTX.fillStyle = grd;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
        }
        else if(p.type==='cluster_bomb') {
            let grd = CTX.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.size);
            grd.addColorStop(0, '#fff'); grd.addColorStop(0.3, '#ff00ff'); grd.addColorStop(1, '#440088');
            CTX.fillStyle = grd;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
        }
        else if(p.type==='heavy_slug') { 
            let grd = CTX.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.size);
            grd.addColorStop(0, '#000'); grd.addColorStop(0.7, '#444'); grd.addColorStop(1, 'rgba(0,0,0,0.5)');
            CTX.fillStyle = grd;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
            CTX.strokeStyle = '#000'; CTX.lineWidth = 1;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size*1.2, 0, 6.28); CTX.stroke();
        }
        else if(p.type==='gravity_zone') { 
            let grd = CTX.createRadialGradient(p.x, p.y, p.size*0.1, p.x, p.y, p.size);
            grd.addColorStop(0, '#000'); 
            grd.addColorStop(0.5, 'rgba(42, 0, 51, 0.6)'); 
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            CTX.fillStyle = grd;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
            
            CTX.strokeStyle = '#aa00ff'; CTX.lineWidth = 2; CTX.shadowBlur = 5; CTX.shadowColor = '#aa00ff';
            let offset = (Date.now() / 1000 * 30) % p.size;
            let r = p.size - offset;
            if(r > 0) { CTX.beginPath(); CTX.arc(p.x, p.y, r, 0, 6.28); CTX.stroke(); }
            
            let r2 = p.size - ((offset + p.size/2) % p.size);
            if(r2 > 0) { CTX.globalAlpha=0.5; CTX.beginPath(); CTX.arc(p.x, p.y, r2, 0, 6.28); CTX.stroke(); CTX.globalAlpha=1; }
        }
        else if(p.type==='ion_arc') { 
            CTX.strokeStyle = '#aaddff';
            CTX.lineWidth = p.size;
            CTX.beginPath();
            CTX.moveTo(p.x - p.vx*0.05, p.y - p.vy*0.05); 
            let midX = p.x - p.vx*0.025 + (Math.random()-0.5)*10;
            let midY = p.y - p.vy*0.025 + (Math.random()-0.5)*10;
            CTX.lineTo(midX, midY);
            CTX.lineTo(p.x, p.y); 
            CTX.stroke();
            CTX.fillStyle = '#fff';
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size*0.8, 0, 6.28); CTX.fill();
        }
        else if(p.type==='corrosive_flask') {
            CTX.fillStyle = p.color;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
            CTX.fillStyle = 'rgba(255,255,255,0.8)';
            CTX.beginPath(); CTX.arc(p.x-2, p.y-2, p.size*0.4, 0, 6.28); CTX.fill(); 
        }
        else if(p.type==='acid_pool') {
            CTX.globalAlpha = 0.7;
            let grd = CTX.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grd.addColorStop(0, '#ff4400'); grd.addColorStop(0.7, '#a03000'); grd.addColorStop(1, 'rgba(100,20,0,0)');
            CTX.fillStyle = grd;
            CTX.beginPath(); 
            for(let i=0; i<=6.28; i+=0.4) {
                let r = p.size + Math.sin(Date.now()/1000*5 + i + p.x)*3;
                let px = p.x + Math.cos(i)*r;
                let py = p.y + Math.sin(i)*r;
                if(i===0) CTX.moveTo(px,py); else CTX.lineTo(px,py);
            }
            CTX.fill();
            if(Math.random()<0.1) {
                CTX.fillStyle='rgba(255,100,0,0.8)';
                let bx = p.x + (Math.random()-0.5)*p.size*1.5;
                let by = p.y + (Math.random()-0.5)*p.size*1.5;
                CTX.beginPath(); CTX.arc(bx, by, Math.random()*3+1, 0, 6.28); CTX.fill();
            }
        }
        else if(p.type==='firework_rocket') {
            CTX.shadowBlur = 15; CTX.shadowColor = '#00ff00';
            CTX.fillStyle = '#fff';
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
            CTX.strokeStyle = '#33ff33'; CTX.lineWidth=2;
            CTX.beginPath(); CTX.moveTo(p.x, p.y); CTX.lineTo(p.x-p.vx*0.1, p.y-p.vy*0.1); CTX.stroke();
        }
        else if(p.type==='explosion_instant') {
            let maxLife = p.maxLife || 0.2; 
            let progress = 1 - (p.life / maxLife); 
            if (progress < 0) progress = 0;
            if (progress > 1) progress = 1;

            CTX.shadowBlur = 20; CTX.shadowColor = p.color;
            CTX.lineWidth = 4 * (1 - progress);
            CTX.strokeStyle = p.color;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.maxSize * progress, 0, 6.28); CTX.stroke();
            
            CTX.globalAlpha = 0.4 * (1 - progress);
            CTX.fillStyle = p.color;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.maxSize * progress * 0.8, 0, 6.28); CTX.fill();
        }
        else if(p.type === 'phosphorus_explosion') {
            let maxLife = p.maxLife || 0.4;
            let progress = 1 - (p.life / maxLife); 
            CTX.globalAlpha = 1.0 - progress;
            CTX.fillStyle = '#fff';
            CTX.beginPath(); CTX.arc(p.x, p.y, p.maxSize * 0.4, 0, 6.28); CTX.fill();
            CTX.globalAlpha = 0.8 * (1 - progress);
            let grd = CTX.createRadialGradient(p.x, p.y, p.maxSize*0.2, p.x, p.y, p.maxSize*progress);
            grd.addColorStop(0, '#ffff00'); 
            grd.addColorStop(0.5, '#ff5500'); 
            grd.addColorStop(1, 'rgba(255, 0, 0, 0)');
            CTX.fillStyle = grd;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.maxSize * progress, 0, 6.28); CTX.fill();
            CTX.globalAlpha = 1.0 * (1 - progress);
            CTX.strokeStyle = '#ffaa00';
            CTX.lineWidth = 6 * (1 - progress);
            CTX.beginPath(); CTX.arc(p.x, p.y, p.maxSize * progress * 1.2, 0, 6.28); CTX.stroke();
        }
        else if(p.type==='warning_zone') {
            let maxLife = p.maxLife || 1.0;
            let progress = 1 - (p.life / maxLife); 
            CTX.fillStyle = p.color; 
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
            CTX.strokeStyle = '#fff'; CTX.lineWidth = 2;
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.stroke();
            CTX.fillStyle = 'rgba(255, 255, 255, 0.3)';
            CTX.beginPath(); 
            CTX.moveTo(p.x, p.y);
            CTX.arc(p.x, p.y, p.size, -Math.PI/2, -Math.PI/2 + (Math.PI*2 * progress));
            CTX.lineTo(p.x, p.y);
            CTX.fill();
        }
        else if(p.type==='laser') {
            CTX.save();
            CTX.lineWidth = p.size;
            CTX.lineCap = 'round';
            CTX.strokeStyle = p.color;
            CTX.shadowBlur = 20;
            CTX.shadowColor = '#ff0000';
            CTX.globalAlpha = p.life / p.maxLife; 
            CTX.beginPath(); CTX.moveTo(p.x, p.y); CTX.lineTo(p.endX, p.endY); CTX.stroke();
            CTX.lineWidth = p.size * 0.4; CTX.strokeStyle = '#fff'; CTX.stroke();
            CTX.restore();
        }
        else if(p.type==='cryo_shot') {
             let grd = CTX.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.size);
             grd.addColorStop(0, '#fff'); grd.addColorStop(0.5, '#00ccff'); grd.addColorStop(1, 'rgba(0,0,255,0)');
             CTX.fillStyle = grd;
             CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
        }
        else if(p.type==='orbit') { 
             CTX.strokeStyle = p.color; CTX.lineWidth = 2;
             CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.stroke();
             CTX.beginPath(); CTX.arc(p.x, p.y, p.size*0.6, 0, 6.28); CTX.fill();
        } 
        else if(p.type==='wave') { 
             CTX.strokeStyle=p.color; CTX.lineWidth= 4;
             let alpha = Math.max(0, 1 - (p.size/p.maxSize));
             CTX.globalAlpha = alpha;
             CTX.fillStyle = 'rgba(0, 136, 255, 0.2)';
             CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
             CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.stroke();
        } 
        else if(p.type==='pool') {
            CTX.globalAlpha = 0.6;
            let grd = CTX.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grd.addColorStop(0, p.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
            CTX.fillStyle = grd;
            CTX.beginPath(); 
            for(let i=0; i<=6.28; i+=0.5) {
                let r = p.size + Math.sin(Date.now()/1000*10 + i)*2;
                let px = p.x + Math.cos(i)*r;
                let py = p.y + Math.sin(i)*r;
                if(i===0) CTX.moveTo(px,py); else CTX.lineTo(px,py);
            }
            CTX.fill();
        }
        else if(p.type==='slash') { 
            CTX.save();
            CTX.translate(player.x, player.y);
            CTX.rotate(p.ang);
            let progress = 1 - (p.life / p.maxLife); 
            let alpha = Math.max(0, 1 - Math.pow(progress, 3));
            CTX.globalAlpha = alpha;
            let outerRadius = p.size;
            let innerRadius = p.size * 0.4;
            let angleSpread = Math.PI; 
            let grd = CTX.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
            grd.addColorStop(0, 'rgba(255,255,255,0)');
            grd.addColorStop(0.7, 'rgba(200,240,255,0.9)');
            grd.addColorStop(1, 'rgba(255,255,255,1)');
            CTX.fillStyle = grd; CTX.shadowBlur = 20; CTX.shadowColor = '#00ffff';
            CTX.beginPath();
            CTX.arc(0, 0, outerRadius, -angleSpread/2, angleSpread/2, false);
            CTX.bezierCurveTo(
                Math.cos(angleSpread/2)*innerRadius*1.5, Math.sin(angleSpread/2)*innerRadius*1.5,
                Math.cos(-angleSpread/2)*innerRadius*1.5, Math.sin(-angleSpread/2)*innerRadius*1.5,
                Math.cos(-angleSpread/2)*outerRadius, Math.sin(-angleSpread/2)*outerRadius
            );
            CTX.beginPath();
            CTX.arc(0, 0, outerRadius, -angleSpread/2, angleSpread/2, false);
            CTX.arc(0, 0, innerRadius, angleSpread/2, -angleSpread/2, true);
            CTX.closePath(); CTX.fill(); CTX.strokeStyle = '#fff'; CTX.lineWidth = 2; CTX.stroke(); CTX.restore();
        }
        // [New Visual] Boss Slash (Dark Red)
        else if(p.type === 'boss_slash') {
            CTX.save();
            CTX.translate(p.x, p.y);
            CTX.rotate(p.angle);
            
            let progress = 1 - (p.life / p.maxLife); 
            let alpha = Math.max(0, 1 - Math.pow(progress, 3));
            CTX.globalAlpha = alpha;
            
            let outerRadius = p.size;
            let innerRadius = p.size * 0.2;
            let angleSpread = Math.PI / 2; // 90度扇形

            let grd = CTX.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
            grd.addColorStop(0, 'rgba(255, 0, 0, 0)');
            grd.addColorStop(0.5, 'rgba(200, 0, 0, 0.8)');
            grd.addColorStop(1, 'rgba(255, 100, 100, 1)');

            CTX.fillStyle = grd; 
            CTX.shadowBlur = 30; CTX.shadowColor = '#ff0000';
            
            CTX.beginPath();
            CTX.moveTo(0,0);
            CTX.arc(0, 0, outerRadius, -angleSpread/2, angleSpread/2, false);
            CTX.closePath();
            CTX.fill(); 
            
            // 刀光
            CTX.strokeStyle = '#fff'; CTX.lineWidth = 4;
            CTX.beginPath();
            CTX.arc(0, 0, outerRadius * 0.9, -angleSpread/2, angleSpread/2, false);
            CTX.stroke();

            CTX.restore();
        }
        else if(p.type === 'volatile_remnant') {
            let blink = Math.floor(Date.now() / 100) % 2 === 0;
            CTX.fillStyle = blink ? '#ff4400' : '#550000';
            CTX.beginPath(); CTX.arc(p.x, p.y, p.size, 0, 6.28); CTX.fill();
            CTX.strokeStyle = '#ff0000'; CTX.lineWidth = 2;
            CTX.beginPath(); 
            let ringSize = p.size + (p.size * 2 * (1 - p.life)); 
            CTX.arc(p.x, p.y, ringSize, 0, 6.28); 
            CTX.stroke();
            CTX.font = '10px Orbitron'; CTX.fillStyle = '#fff'; CTX.fillText("!", p.x-2, p.y+3);
        }
        else if(p.type === 'turret') {
            let pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
            CTX.save();
            CTX.translate(p.x, p.y);
            CTX.strokeStyle = p.color; CTX.globalAlpha = 0.5;
            CTX.beginPath(); CTX.arc(0, 0, p.size * 1.5, 0, 6.28); CTX.stroke();
            CTX.globalAlpha = 1;
            CTX.rotate(Date.now() / 1000); 
            CTX.fillStyle = 'rgba(255, 200, 255, 0.8)';
            CTX.shadowBlur = 15; CTX.shadowColor = p.color;
            CTX.beginPath();
            CTX.moveTo(0, -p.size * pulse);
            CTX.lineTo(p.size * 0.8, 0);
            CTX.lineTo(0, p.size * pulse);
            CTX.lineTo(-p.size * 0.8, 0);
            CTX.closePath();
            CTX.fill();
            CTX.strokeStyle = '#fff'; CTX.lineWidth = 2; CTX.stroke();
            CTX.restore();
        }
        else if(p.type === 'boomerang') {
            CTX.save();
            CTX.translate(p.x, p.y);
            CTX.rotate(p.ang); 
            let speed = Math.hypot(p.vx, p.vy);
            if (speed > 1) { CTX.shadowBlur = 15; CTX.shadowColor = '#ff0055'; }
            CTX.strokeStyle = p.color; CTX.lineWidth = 4;
            CTX.beginPath(); CTX.arc(0, 0, p.size, 0, 6.28); CTX.stroke();
            CTX.fillStyle = '#ff88aa'; CTX.beginPath(); CTX.arc(0, 0, p.size * 0.4, 0, 6.28); CTX.fill();
            CTX.fillStyle = '#fff';
            for(let k=0; k<3; k++) {
                CTX.rotate(2.09); 
                CTX.beginPath(); CTX.moveTo(p.size, 0); CTX.lineTo(p.size+5, 2); CTX.lineTo(p.size, 4); CTX.fill();
            }
            CTX.restore();
        }
        else if(p.type === 'spiral_orb') {
             CTX.save();
             CTX.translate(p.x, p.y);
             CTX.rotate(Date.now()/500); 
             let pulse = 1 + Math.sin(Date.now()/200)*0.2;
             let displaySize = (p.currentSize || p.size) * pulse;
             let grd = CTX.createRadialGradient(0, 0, 2, 0, 0, displaySize);
             grd.addColorStop(0, '#fff'); grd.addColorStop(0.4, '#aa00cc'); grd.addColorStop(1, 'rgba(100,0,150,0)');
             CTX.shadowBlur = 20; CTX.shadowColor = '#aa00cc';
             CTX.fillStyle = grd;
             CTX.beginPath(); CTX.arc(0, 0, displaySize, 0, 6.28); CTX.fill();
             CTX.rotate(-Date.now()/500); 
             CTX.strokeStyle = 'rgba(200, 100, 255, 0.3)';
             CTX.lineWidth = 2;
             CTX.beginPath();
             for(let i=0; i<3; i++) {
                 let t = i * 0.5;
                 let lx = Math.cos(p.angle - t) * (p.radius - t*10);
                 let ly = Math.sin(p.angle - t) * (p.radius - t*10);
                 let dx = lx - (p.x - p.centerX); 
                 let dy = ly - (p.y - p.centerY);
                 if(i===0) CTX.moveTo(dx, dy); else CTX.lineTo(dx, dy);
             }
             CTX.stroke();
             CTX.restore();
        }
        else if(p.type === 'phosphorus_thrust') {
             CTX.save();
             CTX.translate(p.x, p.y);
             CTX.rotate(p.angle);
             
             let progress = 1 - (p.life / p.maxLife); 
             let fade = 1;
             if(progress > 0.7) fade = 1 - ((progress - 0.7) / 0.3);
             
             CTX.globalAlpha = fade;
             CTX.shadowBlur = 20; CTX.shadowColor = '#ff5500';
             
             CTX.fillStyle = '#fff';
             CTX.beginPath();
             CTX.moveTo(10, 0); 
             CTX.lineTo(-60 - p.size, p.size * 0.4); 
             CTX.lineTo(-40 - p.size, 0); 
             CTX.lineTo(-60 - p.size, -p.size * 0.4); 
             CTX.closePath();
             CTX.fill();

             CTX.strokeStyle = '#ffaa00';
             CTX.lineWidth = 3;
             CTX.stroke();
             
             CTX.restore();
        }
        else if(p.type === 'phosphorus_breach') {
             CTX.save();
             CTX.translate(p.x, p.y);
             let pulse = 1 + Math.sin(Date.now() / 40) * 0.4;
             CTX.scale(pulse, pulse);
             CTX.shadowBlur = 25; CTX.shadowColor = '#ff0000';
             CTX.fillStyle = '#ffaa00';
             CTX.beginPath(); CTX.arc(0, 0, 8, 0, 6.28); CTX.fill();
             CTX.strokeStyle = '#ff3300'; CTX.lineWidth = 3;
             CTX.beginPath(); CTX.arc(0, 0, 14, 0, 6.28); CTX.stroke();
             CTX.rotate(-Date.now()/100);
             CTX.strokeStyle = '#fff'; CTX.lineWidth = 1;
             CTX.setLineDash([4, 4]);
             CTX.beginPath(); CTX.arc(0, 0, 20, 0, 6.28); CTX.stroke();
             CTX.restore();
        }
        else if(p.type === 'helium_whirlwind') {
             CTX.save();
             CTX.translate(p.x, p.y);
             CTX.rotate(p.angle || 0);
             CTX.globalAlpha = 0.6;
             CTX.shadowBlur = 15; CTX.shadowColor = '#00ffff';
             for(let k=0; k<3; k++) {
                 CTX.rotate(2.09); 
                 let grd = CTX.createLinearGradient(0, 0, p.size, 0);
                 grd.addColorStop(0, 'rgba(0, 255, 255, 0)');
                 grd.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
                 grd.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
                 CTX.fillStyle = grd;
                 CTX.beginPath();
                 CTX.moveTo(0, 0);
                 CTX.quadraticCurveTo(p.size*0.5, p.size*0.5, p.size, 0);
                 CTX.quadraticCurveTo(p.size*0.5, -p.size*0.2, 0, 0);
                 CTX.fill();
             }
             CTX.fillStyle = 'rgba(200, 255, 255, 0.5)';
             CTX.beginPath(); CTX.arc(0, 0, p.size * 0.2, 0, 6.28); CTX.fill();
             CTX.restore();
        }
        // [New Visual] Fissure Wave (Francium) - Jagged ground crack
        else if(p.type === 'fissure_wave') {
            CTX.save();
            CTX.translate(p.x, p.y);
            CTX.rotate(p.angle);
            
            let progress = 1 - (p.life / p.maxLife);
            let len = p.size * 3.5; 
            
            CTX.shadowBlur = 20; CTX.shadowColor = '#ff4400';
            CTX.strokeStyle = '#ffaa00';
            CTX.lineWidth = 3;
            CTX.beginPath();
            CTX.moveTo(0, 0);
            
            // Generate jagged line
            let segments = 6;
            let segLen = len / segments;
            for(let i=1; i<=segments; i++) {
                let offset = (Math.sin(i * 132.5 + Date.now()/100) * 15);
                CTX.lineTo(i * segLen, offset);
            }
            CTX.stroke();

            // Glow effect
            CTX.globalAlpha = 0.4;
            CTX.fillStyle = '#ff3300';
            CTX.beginPath();
            CTX.moveTo(0, -10);
            CTX.lineTo(len, 0);
            CTX.lineTo(0, 10);
            CTX.fill();

            CTX.restore();
        }
        // [New Visual] Smite Bolt (Radium) - Lightning strike
        else if(p.type === 'smite_bolt') {
            let progress = 1 - (p.life / p.maxLife);
            let alpha = 1;
            if(progress > 0.5) alpha = 1 - ((progress-0.5)*2);

            CTX.save();
            CTX.globalAlpha = alpha;
            CTX.shadowBlur = 20; CTX.shadowColor = '#aaffff';
            CTX.strokeStyle = '#ffffff';
            
            // Main Bolt
            CTX.lineWidth = p.size * 0.08;
            CTX.beginPath();
            CTX.moveTo(p.x, p.y);
            CTX.lineTo(p.x, p.y - 600); 
            CTX.stroke();

            // Branch arcs
            CTX.lineWidth = 2;
            CTX.beginPath();
            CTX.moveTo(p.x, p.y - 300);
            CTX.lineTo(p.x + 50, p.y - 150);
            CTX.moveTo(p.x, p.y - 200);
            CTX.lineTo(p.x - 40, p.y - 100);
            CTX.stroke();

            // Impact Ring
            CTX.beginPath();
            CTX.ellipse(p.x, p.y, p.size * progress * 1.2, p.size * 0.3 * progress * 1.2, 0, 0, 6.28);
            CTX.fillStyle = 'rgba(200, 255, 255, 0.5)';
            CTX.fill();
            CTX.strokeStyle = '#aaffff';
            CTX.lineWidth = 3;
            CTX.stroke();

            CTX.restore();
        }

        CTX.globalAlpha = 1;
    });
    CTX.globalAlpha=1; CTX.globalCompositeOperation='source-over'; CTX.shadowBlur=0;
    
    // Damage Numbers
    dmgNums = dmgNums.filter(d => d.life > 0); 
    dmgNums.forEach(d => { 
        d.y -= 0.6; 
        d.life -= 0.02; 
        
        CTX.save();
        CTX.globalAlpha = Math.min(1, d.life); 
        
        let fontSize = d.size;
        let fontStyle = "bold";
        if(d.isCrit) { fontSize += 6; fontStyle = "italic bold"; } 

        CTX.font = `${fontStyle} ${fontSize}px Orbitron`;
        CTX.textAlign = "center";
        
        CTX.lineWidth = 3;
        CTX.strokeStyle = 'rgba(0,0,0,0.8)';
        CTX.strokeText(d.val, d.x, d.y);
        
        CTX.fillStyle = d.color;
        CTX.fillText(d.val, d.x, d.y);
        
        CTX.restore();
    });
    CTX.globalAlpha=1;
}