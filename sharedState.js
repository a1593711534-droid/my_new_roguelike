// --- sharedState.js ---
// 系統全域狀態定義

let shopState = { items: [], rerollCount: 0, selectedIdx: -1 };

// forgeState: 負責鍛造與裝備介面的狀態
let forgeState = { 
    mode: 'equipped', // 'equipped' or 'inventory'
    equipSlotIdx: 4,  // 當 mode='equipped' 時使用
    targetUuid: null, // 當 mode='inventory' 時使用
    selectedInvUuid: null, // 選擇的鑲嵌物(寶石) UUID (非裝備)
    selectedSocketIdx: -1,
    pendingEquip: null // 用於裝備確認狀態 { slotIdx: number, invUuid: string }
};

// [修改] 融合狀態改為支援多重素材
// main: 主體物件
// subs: 素材物件陣列 (Array of Items)
let fusionState = { main: null, subs: [] }; 

let rerollCost = { lvl: 0 };
let levelUpOptions = []; 
let levelUpSelection = -1; 

// 排序狀態
let invSortState = {
    active: { method: 'name', order: 'asc' }, 
    support: { method: 'name', order: 'asc' },
    equipment: { method: 'type', order: 'asc' } 
};

// 裝備部位定義
const EQUIP_SLOTS_DEF = [
    { id: 'head', name: '頭部', icon: '⛑️', maxSockets: 4 },
    { id: 'body', name: '身體', icon: '👕', maxSockets: 6 },
    { id: 'gloves', name: '手部', icon: '🧤', maxSockets: 4 },
    { id: 'legs', name: '腿部', icon: '👢', maxSockets: 4 },
    { id: 'main', name: '主手', icon: '⚔️', maxSockets: 3 }, 
    { id: 'off',  name: '副手', icon: '🛡️', maxSockets: 3 }
];

// 裝備排序權重
const SLOT_ORDER = { 'head':1, 'body':2, 'gloves':3, 'legs':4, 'main':5, 'off':6 };