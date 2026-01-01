// --- bossRender.js ---
// BOSS 視覺層: 繪製本體、特效、UI
// [Patch] Added Attack Telegraphs (Charge Line)
// [Patch] Added Stamina Bar UI

function drawBoss() {
    if(!activeBoss) return;
    let b = activeBoss;

    CTX.save();
    CTX.translate(b.x, b.y);

    if(b.flash > 0) {
        let shake = b.flash * 3;
        CTX.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
    }
    
    if(b.def.visual.type === 'demon_lord') {
        drawDemonLord(b);
    } else {
        CTX.fillStyle = b.def.color;
        CTX.beginPath(); CTX.arc(0,0, b.def.size, 0, 6.28); CTX.fill();
    }

    // [New] 暴君衝鋒預警線
    if(b.state === BOSS_STATE.WINDUP && b.nextSkill === 'tyrant_charge') {
        CTX.save();
        let ang = Math.atan2(player.y - b.y, player.x - b.x);
        CTX.rotate(ang);
        CTX.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        CTX.lineWidth = 4;
        CTX.setLineDash([20, 10]);
        CTX.beginPath();
        CTX.moveTo(0, 0);
        CTX.lineTo(800, 0); // 延伸 800px
        CTX.stroke();
        
        // 箭頭
        CTX.setLineDash([]);
        CTX.fillStyle = 'rgba(255, 0, 0, 0.6)';
        CTX.beginPath();
        CTX.moveTo(200, -10); CTX.lineTo(220, 0); CTX.lineTo(200, 10);
        CTX.fill();
        CTX.restore();
    }

    // 攻擊前搖：全螢幕變暗或聚氣特效
    if(b.state === BOSS_STATE.WINDUP) {
        b.flash = 2; 
        
        CTX.globalCompositeOperation = 'lighter';
        CTX.strokeStyle = '#ff0000';
        CTX.lineWidth = 3;
        CTX.beginPath();
        CTX.arc(0, 0, b.def.size * 1.5, 0, 6.28); 
        CTX.stroke();
        CTX.globalCompositeOperation = 'source-over';
    }
    
    CTX.restore();
    drawBossUI(b);
}

function drawDemonLord(b) {
    let t = b.animFrame;
    let size = b.def.size;
    let color = b.def.visual.primaryColor; 
    let dark = b.def.visual.secondaryColor; 
    
    CTX.save();
    CTX.shadowBlur = 50 + Math.sin(t * 0.1) * 20; 
    CTX.shadowColor = color;
    CTX.fillStyle = 'rgba(0, 0, 0, 0.8)';
    CTX.beginPath(); CTX.arc(0, 0, size * 0.9, 0, 6.28); CTX.fill();
    CTX.restore();

    let armOffset = Math.sin(t * 0.05) * 10;
    
    drawDemonArm(CTX, -size * 1.2, 20 + armOffset, -1, color, dark);
    drawDemonArm(CTX, size * 1.2, 20 + armOffset, 1, color, dark);

    CTX.fillStyle = dark;
    CTX.strokeStyle = color;
    CTX.lineWidth = 4;
    
    CTX.beginPath();
    CTX.moveTo(0, size * 0.6); 
    CTX.lineTo(size * 0.5, 0); 
    CTX.lineTo(size * 0.7, -size * 0.6); 
    CTX.lineTo(size * 0.3, -size * 0.4); 
    CTX.lineTo(0, -size * 0.2); 
    CTX.lineTo(-size * 0.3, -size * 0.4); 
    CTX.lineTo(-size * 0.7, -size * 0.6); 
    CTX.lineTo(-size * 0.5, 0); 
    CTX.closePath();
    
    CTX.fill();
    CTX.stroke();

    CTX.shadowBlur = 20; CTX.shadowColor = '#ffff00';
    CTX.fillStyle = '#ffff00'; 
    
    CTX.beginPath(); 
    CTX.ellipse(-20, -10, 8, 15, -0.2, 0, 6.28); 
    CTX.fill();
    CTX.beginPath(); 
    CTX.ellipse(20, -10, 8, 15, 0.2, 0, 6.28); 
    CTX.fill();
    
    let mouthOpen = 5 + Math.sin(t * 0.1) * 5;
    CTX.fillStyle = '#ccff00';
    CTX.beginPath();
    CTX.moveTo(-15, 30);
    CTX.lineTo(15, 30);
    CTX.lineTo(0, 30 + mouthOpen);
    CTX.fill();

    CTX.shadowBlur = 0;
}

function drawDemonArm(ctx, x, y, dir, color, dark) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1); 
    
    ctx.fillStyle = dark;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.28); ctx.fill(); ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(15, 60); 
    ctx.lineTo(40, 50); 
    ctx.lineTo(20, -10);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    ctx.shadowBlur = 10; ctx.shadowColor = color;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(15, 60); ctx.lineTo(20, 90); ctx.lineTo(25, 60);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
}

function drawBossUI(b) {
    let barW = SCREEN_W * 0.6;
    let barH = 12;
    let barX = (SCREEN_W - barW) / 2;
    let barY = 40; 
    
    // --- HP Bar ---
    CTX.fillStyle = 'rgba(0,0,0,0.8)';
    CTX.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    let pct = Math.max(0, b.hp / b.maxHp);
    CTX.fillStyle = '#aa00aa'; 
    CTX.fillRect(barX, barY, barW * pct, barH);
    CTX.strokeStyle = '#660066'; CTX.lineWidth = 2;
    CTX.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

    // --- [New] Stamina Bar (耐力條) ---
    // 位於血條下方，高度較細
    let stamH = 4;
    let stamY = barY + barH + 5; 
    
    // 背景
    CTX.fillStyle = 'rgba(0,0,0,0.8)';
    CTX.fillRect(barX - 2, stamY - 2, barW + 4, stamH + 4);
    
    // 填色
    // 使用 activeBoss.stamina / activeBoss.maxStamina
    let stamPct = Math.max(0, b.stamina / b.maxStamina);
    
    // 如果力竭(isExhausted)，顯示灰色，否則顯示黃色 (Action Points)
    if(b.isExhausted) CTX.fillStyle = '#777'; 
    else CTX.fillStyle = '#ffcc00'; 
    
    CTX.fillRect(barX, stamY, barW * stamPct, stamH);
    
    // 邊框
    CTX.strokeStyle = '#886600'; 
    CTX.lineWidth = 1;
    CTX.strokeRect(barX - 2, stamY - 2, barW + 4, stamH + 4);

    // Text Name (維持在血條上方)
    CTX.font = 'bold 14px Orbitron';
    CTX.fillStyle = '#fff';
    CTX.textAlign = 'center';
    CTX.fillText(b.def.name, SCREEN_W/2, barY - 8);
}