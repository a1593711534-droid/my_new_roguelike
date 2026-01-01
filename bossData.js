// --- bossData.js ---
// BOSS 數據層: 定義屬性、階段、技能池

const BOSS_DB = {
    'prototype': {
        name: "謊言魔神", 
        baseHp: 10000,
        baseDmg: 40,
        size: 90,          // 極巨化體型
        color: '#22ff00',
        visual: {
            type: 'demon_lord', 
            primaryColor: '#44ff00',
            secondaryColor: '#003300'
        },
        phases: [
            {
                threshold: 0.0, 
                // 技能組合: 衝鋒(位移) + 砸地(大範圍) + 轟炸(全圖) + 連擊(近戰壓制)
                skills: ['tyrant_charge', 'calamity_smash', 'fel_bombardment', 'tyrant_combo'], 
                interval: 1.0, 
                speedScale: 1.5 // 基礎速度提升
            }
        ]
    }
};

// [New] 技能耐力消耗表 (Action Points)
const BOSS_SKILL_COSTS = {
    'tyrant_charge': 25,     // 衝鋒：消耗中等
    'calamity_smash': 65,    // 全螢幕大招：消耗極大 (放完通常會力竭)
    'fel_bombardment': 40,   // 轟炸：消耗高
    'tyrant_combo': 30       // [Modified] 近戰連擊：啟動消耗降低，改為每刀判定消耗
};