// --- combatState.js ---
// 戰鬥系統全域狀態

let projectiles = [];
let particles = [];
let dmgNums = [];
let activeBoss = null; // 新增: 當前活動的BOSS物件 (沒有則為 null)