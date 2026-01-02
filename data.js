// --- data.js ---
const ELEMENTS_DB = [
    // --- 原有主動 (Active) ---
    // [Balance] H: 傷害倍率 2.5
    {id:1, s:'H', cn:'氫', n:'Hydrogen', g:1, type:'active', desc:'高能燃料，接觸空氣燃燒。', attack:{type:'projectile', name:'烈焰火球'}, tags:['投射物','火'], dmgMult: 2.5},
    
    // [Balance] C: 傷害 3.0, 開啟自動瞄準 (autoAim)
    {id:6, s:'C', cn:'碳', n:'Carbon', g:14, type:'active', desc:'金剛石結構，堅硬無比的物理斬擊。', attack:{type:'melee', name:'金剛斬'}, tags:['近戰','物理','範圍'], dmgMult: 3.0, autoAim: true},
    
    // [Balance] O: 傷害 0.7
    {id:8, s:'O', cn:'氧', n:'Oxygen', g:16, type:'active', desc:'劇烈氧化反應，釋放廣域衝擊波。', attack:{type:'area', name:'氧化震波'}, tags:['範圍','物理'], dmgMult: 0.7},
    
    // [REWORK] He: 超流體旋風 (Helium)
    {id:2, s:'He', cn:'氦', n:'Helium', g:18, type:'active', desc:'【惰性氣體】進入超流體態，零摩擦力高速旋轉並牽引敵人。', attack:{type:'whirlwind', name:'超流體旋風'}, tags:['近戰','冰','持續','範圍'], dmgMult: 0.45},
    
    // [Balance] N: 傷害 0.9
    {id:7, s:'N', cn:'氮', n:'Nitrogen', g:15, type:'active', desc:'液態氮罐，極低溫急凍敵人。', attack:{type:'cryo', name:'絕對零度'}, tags:['投射物','範圍','冰','持續'], dmgMult: 0.9},
    
    // [REWORK] P: 白磷突刺 (Phosphorus)
    {id:15, s:'P', cn:'磷', n:'Phosphorus', g:15, type:'active', desc:'【非金屬】白磷接觸空氣自燃，突刺後將燃燒粒子嵌入敵人體內引爆。', attack:{type:'thrust', name:'白磷突刺'}, tags:['近戰','火','持續','範圍'], dmgMult: 1.0},

    // --- 舊有新增主動 ---
    // [Balance] Ne: 傷害 1.5
    {id:10, s:'Ne', cn:'氖', n:'Neon', g:18, type:'active', desc:'【惰性氣體】通電激發高能紅光，瞬間貫穿。', attack:{type:'laser', name:'氦氖雷射'}, tags:['法術','火','範圍'], dmgMult: 2.0},
    
    // [Balance] K: 傷害 0.9
    {id:19, s:'K', cn:'鉀', n:'Potassium', g:1, type:'active', desc:'【鹼金屬】活性極高，撞擊產生劇烈連鎖爆破。', attack:{type:'cluster', name:'紫焰爆破'}, tags:['投射物','範圍','火'], dmgMult: 0.9},
    
    // [Balance] Si: 傷害 1.0
    {id:14, s:'Si', cn:'矽', n:'Silicon', g:14, type:'active', desc:'【半導體】晶格結構重組，發射扇形晶體碎片。', attack:{type:'shotgun', name:'晶體霰彈'}, tags:['投射物','物理'], dmgMult: 1.0},
    
    // [Balance] Cl: 傷害 0.45, 範圍 1.8倍 (25->45)
    {id:17, s:'Cl', cn:'氯', n:'Chlorine', g:17, type:'active', desc:'【鹵素】釋放黃綠色劇毒氣體，緩慢飄移並持續腐蝕。', attack:{type:'cloud', name:'劇毒毒雲'}, tags:['持續','毒','氣體','範圍'], dmgMult: 0.45, areaRatio: 1.8},

    // --- 上次新增主動 ---
    // [Balance] Xe: 傷害 1.15
    {id:54, s:'Xe', cn:'氙', n:'Xenon', g:18, type:'active', desc:'【惰性氣體】高能離子化氣體，產生在敵人間跳躍的電弧。', attack:{type:'ion_arc', name:'離子閃電'}, tags:['投射物','法術','雷'], dmgMult: 1.15},
    
    // [Balance] Pb: 傷害 2.0 (大幅增加)
    {id:82, s:'Pb', cn:'鉛', n:'Lead', g:14, type:'active', desc:'【貧金屬】極高密度的重力彈，命中後產生強引力場吸入敵人。', attack:{type:'heavy_slug', name:'重力坍縮'}, tags:['投射物','範圍','物理','持續'], dmgMult: 2.0},

    // --- [BUG FIX] 主動元素 ---
    // [Balance] Br: 傷害 1.15
    {id:35, s:'Br', cn:'溴', n:'Bromine', g:17, type:'active', desc:'【鹵素】深紅棕色發煙液體，具強烈腐蝕性。', attack:{type:'corrosive_flask', name:'腐蝕燒瓶'}, tags:['投射物','範圍','毒','持續'], dmgMult: 1.15},
    
    // [Balance] Ba: 傷害 2.0
    {id:56, s:'Ba', cn:'鋇', n:'Barium', g:2, type:'active', desc:'【鹼土金屬】燃燒產生明亮蘋果綠焰色，煙火的主要成分。', attack:{type:'firework', name:'鋇光煙火'}, tags:['投射物','範圍','火'], dmgMult: 2.0},

    // --- [NEW] 本次新增主動 ---
    // [New Active] Bi: 鉍 (召喚哨塔)
    {id:83, s:'Bi', cn:'鉍', n:'Bismuth', g:15, type:'active', desc:'【貧金屬】彩虹色螺旋晶體，建構自動防禦哨塔。', attack:{type:'turret', name:'稜鏡哨塔'}, tags:['召喚','持續','投射物','物理'], dmgMult: 0.6},

    // [REWORK] Rb: 銣 (螺旋星雲)
    {id:37, s:'Rb', cn:'銣', n:'Rubidium', g:1, type:'active', desc:'【鹼金屬】不穩定的原子能階躍遷，釋放螺旋擴散的光譜星雲。', attack:{type:'spiral_orb', name:'銣光譜星雲'}, tags:['法術','火','範圍'], dmgMult: 1.5, nativePierce: 999},

    // --- [BATCH 1 NEW ACTIVE] ---
    // Fr (87): 原子裂地 (Sunder)
    {id:87, s:'Fr', cn:'鍅', n:'Francium', g:1, type:'active', desc:'【鹼金屬】極不穩定的放射性元素，敲擊地面引發毀滅性的熱能裂隙。', attack:{type:'fissure', name:'原子裂地'}, tags:['近戰','範圍','火','地面'], dmgMult: 2.2, autoAim: true},

    // Ra (88): 鐳光重擊 (Smite)
    {id:88, s:'Ra', cn:'鐳', n:'Radium', g:2, type:'active', desc:'【鹼土金屬】強烈的放射發光特性，揮擊時召喚淨化光束轟擊區域。', attack:{type:'smite', name:'鐳光重擊'}, tags:['近戰','範圍','雷'], dmgMult: 1.8, autoAim: true},

    // --- [CUSTOM REQUEST] New Melee Actives ---
    // Ge (32): 晶體新星 (Crystal Nova) - 360度近戰防禦
    {id:32, s:'Ge', cn:'鍺', n:'Germanium', g:14, type:'active', desc:'【類金屬】半導體晶格瞬間生長，向四周刺出排斥性晶刺。', attack:{type:'crystal_nova', name:'晶體新星'}, tags:['近戰','範圍','物理'], dmgMult: 1.4},
    
    // Po (84): 劇毒鞭笞 (Toxic Lash) - 中距離揮擊
    {id:84, s:'Po', cn:'釙', n:'Polonium', g:16, type:'active', desc:'【貧金屬】強烈的放射性毒素凝聚成鞭，揮擊前方扇形區域。', attack:{type:'whip', name:'劇毒鞭笞'}, tags:['近戰','範圍','毒'], dmgMult: 1.1, autoAim: true},

    {id:55, s:'Cs', cn:'銫', n:'Cesium', g:1, type:'active', desc:'【鹼金屬】高活性電子躍遷，極快拳速擊打敵人，並在接觸瞬間釋放連鎖電流。', attack:{type:'cesium_fist', name:'銫光雷拳'}, tags:['近戰','雷','單體'], dmgMult: 0.8},

    {id:85, s:'At', cn:'砈', n:'Astatine', g:17, type:'active', desc:'【鹵素】極稀有的放射性元素，揮舞巨大的虛空鐮刀，將周圍敵人強行吸入斬擊中心。', attack:{type:'astatine_scythe', name:'虛空鎌'}, tags:['近戰','範圍','持續'], dmgMult: 1.6},


    // --- 原有輔助 (Supports) - [數值重構] ---
    {id:3, s:'Li', cn:'鋰', n:'Lithium', g:1, type:'support', desc:'【鹼金屬】高活性的化學催化劑，以燃燒壽命為代價換取極限爆發。', effect:{type:'swiftness', base:0.30, growth:0.02}, supportTags:['持續']}, 
    
    {id:11, s:'Na', cn:'鈉', n:'Sodium', g:1, type:'support', desc:'【鹼金屬】遇水劇烈爆炸。', effect:{type:'area', base:0.15, growth:0.01}, supportTags:['範圍']},
    {id:12, s:'Mg', cn:'鎂', n:'Magnesium', g:2, type:'support', desc:'【鹼土金屬】燃燒發出耀眼白光。', effect:{type:'dmg', base:0.15, growth:0.01}, supportTags:['all']}, 
    {id:4, s:'Be', cn:'鈹', n:'Beryllium', g:2, type:'support', desc:'【鹼土金屬】輕量高剛性，優異的航太材料。', effect:{type:'velocity', base:0.20, growth:0.02}, supportTags:['投射物','氣體']}, 
    {id:9, s:'F', cn:'氟', n:'Fluorine', g:17, type:'support', desc:'【鹵素】電負性最強的元素，極高反應活性。', effect:{type:'crit', base:0.01, growth:0.001}, supportTags:['all']},
    {id:13, s:'Al', cn:'鋁', n:'Aluminium', g:13, type:'support', desc:'【貧金屬】輕量化合金，大幅減輕負擔。', effect:{type:'cdr', base:0.10, growth:0.005}, supportTags:['all']},
    
    {id:16, s:'S', cn:'硫', n:'Sulfur', g:16, type:'support', desc:'【非金屬】火藥關鍵成分，增強穿透力。', effect:{type:'pierce', base:1, growth:0.1}, supportTags:['投射物']},
    {id:20, s:'Ca', cn:'鈣', n:'Calcium', g:2, type:'support', desc:'【鹼土金屬】骨骼結構成分，賦予物理衝擊。', effect:{type:'knockback', base:0.5, growth:0.05}, supportTags:['投射物','近戰','範圍']},
    
    {id:5, s:'B', cn:'硼', n:'Boron', g:13, type:'support', desc:'【類金屬】特殊的籠狀分子結構，分裂投射物但分散能量。', effect:{type:'multishot', base:0.40, growth:-0.005}, supportTags:['投射物']},
    
    {id:53, s:'I', cn:'碘', n:'Iodine', g:17, type:'support', desc:'【鹵素】極易昇華的特性，使攻擊能在敵人未察覺間跳躍。', effect:{type:'bounce', base:1, growth:0.125}, supportTags:['投射物']},

    // --- 上次新增輔助 ---
    {id:38, s:'Sr', cn:'鍶', n:'Strontium', g:2, type:'support', desc:'【鹼土金屬】燃燒發出深紅光，如同曳光彈般指引目標。', effect:{type:'homing', base:0.1, growth:0.01}, supportTags:['投射物']},
    {id:33, s:'As', cn:'砷', n:'Arsenic', g:15, type:'support', desc:'【類金屬】著名的劇毒物質，直接收割虛弱的生命。', effect:{type:'execute', base:0.08, growth:0.004}, supportTags:['all']},

    // --- [本次新增] 輔助元素 ---
    {id:36, s:'Kr', cn:'氪', n:'Krypton', g:18, type:'support', desc:'【惰性氣體】用於高強度閃光燈，爆發出極強亮度。', effect:{type:'crit_dmg', base:0.30, growth:0.02}, supportTags:['all']},
    {id:34, s:'Se', cn:'硒', n:'Selenium', g:16, type:'support', desc:'【非金屬】光導電特性，能引發連鎖複製效應。', effect:{type:'corpse_explosion', base:0.20, growth:0.01}, supportTags:['all']},
    {id:79, s:'Au', cn:'金', n:'Gold', g:11, type:'support', desc:'【貴金屬】延展性極佳，強化核心結構。', effect:{type:'plus_level', base:1, growth:0}, supportTags:['all']},
    {id:50, s:'Sn', cn:'錫', n:'Tin', g:14, type:'support', desc:'【貧金屬】穩定的保護鍍層，延長化學反應時間。', effect:{type:'duration', base:0.25, growth:0.02}, supportTags:['持續','召喚','氣體','毒']},
    {id:51, s:'Sb', cn:'銻', n:'Antimony', g:15, type:'support', desc:'【類金屬】硬而脆的晶體結構，擊中目標後碎裂散射。', effect:{type:'fork', base:1, growth:0.1}, supportTags:['投射物']},

    // --- [BATCH 1 NEW SUPPORT] ---
    // Ga (31): 流體連擊 (Multistrike)
    {id:31, s:'Ga', cn:'鎵', n:'Gallium', g:13, type:'support', desc:'【貧金屬】熔點極低，如流體般連續運作。近戰攻擊將重複一次，並大幅提升攻速。', effect:{type:'multistrike', base:0.35, growth:0.01}, supportTags:['近戰']},

    // Rn (86): 高密度壓縮 (Concentrated Effect)
    {id:86, s:'Rn', cn:'氡', n:'Radon', g:18, type:'support', desc:'【惰性氣體】已知最重的氣體，將能量高密度壓縮以換取毀滅性破壞力。', effect:{type:'concentrated', base:0.40, growth:0.01}, supportTags:['範圍']},

    // --- [CUSTOM REQUEST] New Specific Supports ---
    // In (49): 餘震 (Aftershock) - 僅限近戰
    {id:49, s:'In', cn:'銦', n:'Indium', g:13, type:'support', desc:'【貧金屬】極佳的延展性將衝擊力傳導至地面。近戰命中時產生小範圍餘震。', effect:{type:'aftershock', base:0.5, growth:0.05}, supportTags:['近戰']},

    // Te (52): 重型彈藥 (Heavy Ammo) - 僅限投射物
    {id:52, s:'Te', cn:'碲', n:'Tellurium', g:16, type:'support', desc:'【類金屬】增加彈頭質量與動能，強化衝擊力但犧牲飛行速度。', effect:{type:'heavy_ammo', base:0.3, growth:0.02}, supportTags:['投射物']},

    {id:81, s:'Tl', cn:'鉈', n:'Thallium', g:13, type:'support', desc:'【貧金屬】劇毒重金屬，使近戰攻擊在命中點爆發出持續腐蝕的毒雲。', effect:{type:'thallium_decay', base:0.3, growth:0.02}, supportTags:['近戰']},

    {id:18, s:'Ar', cn:'氬', n:'Argon', g:18, type:'support', desc:'【惰性氣體】均勻擴散特性。投射物不再向前方發射，而是以環狀新星(Nova)向四周爆發。', effect:{type:'argon_nova', base:2, growth:0}, supportTags:['投射物']},


    // --- Fillers ---
    
];

const STARTERS = [
    { elId: 1, name: '氫 (火球)', icon: '🔥' },
    { elId: 6, name: '碳 (近戰)', icon: '⚔️' },
    { elId: 8, name: '氧 (震波)', icon: '💥' },
    { elId: 2, name: '氦 (旋風)', icon: '🌪️' },
    { elId: 7, name: '氮 (冰凍)', icon: '❄️' },
    { elId: 15, name: '磷 (突刺)', icon: '☄️' },
    { elId: 10, name: '氖 (雷射)', icon: '🔦' },
    { elId: 19, name: '鉀 (爆破)', icon: '💣' },
    { elId: 14, name: '矽 (霰彈)', icon: '💎' },
    { elId: 17, name: '氯 (毒雲)', icon: '🤢' },
    { elId: 54, name: '氙 (閃電)', icon: '⚡' },
    { elId: 82, name: '鉛 (重力)', icon: '⚫' },
    { elId: 35, name: '溴 (腐蝕)', icon: '🧪' },
    { elId: 56, name: '鋇 (煙火)', icon: '🎆' },
    { elId: 83, name: '鉍 (哨塔)', icon: '🗼' },
    { elId: 37, name: '銣 (星雲)', icon: '🌀' },
    { elId: 87, name: '鍅 (裂地)', icon: '🌋' },
    { elId: 88, name: '鐳 (懲擊)', icon: '✨' },
    { elId: 32, name: '鍺 (晶刺)', icon: '❄️' }, 
    { elId: 84, name: '釙 (毒鞭)', icon: '🐍' },
    { elId: 55, name: '銫 (雷拳)', icon: '🥊' },
    { elId: 85, name: '砈 (虛空)', icon: '🌑' }
];

const SOCKET_POS = [{x:60,y:30},{x:140,y:30},{x:140,y:100},{x:60,y:100},{x:60,y:170},{x:140,y:170}];

const ENEMIES_DB = {
    'scavenger': {
        name: '病毒體',
        baseHp: 15, baseSpd: 2.2, baseDmg: 8,
        size: 14, attackRange: 25, 
        windup: 0.3, cooldown: 1.0,
        color: '#a84444', 
        visual: 'spiky_circle', 
        xp: 5,
        ai: 'melee_basic'
    },
    'tank': {
        name: '幾何巨塔',
        baseHp: 60, baseSpd: 0.9, baseDmg: 20,
        size: 24, attackRange: 45, 
        windup: 0.8, cooldown: 2.0,
        color: '#446688', 
        visual: 'heavy_hexagon', 
        xp: 18,
        ai: 'melee_heavy'
    },
    'sniper': {
        name: '稜鏡射手',
        baseHp: 12, baseSpd: 1.6, baseDmg: 10,
        size: 14, attackRange: 320, 
        windup: 0.8, cooldown: 2.5,
        color: '#44aa44', 
        visual: 'triangle_eye', 
        xp: 10,
        ai: 'ranged_basic'
    },
    'assassin': {
        name: '虛空行者',
        baseHp: 25, baseSpd: 3.5, baseDmg: 12,
        size: 12, attackRange: 30,
        windup: 0.15, cooldown: 0.8,
        color: '#aa44aa', 
        visual: 'pulsing_star', 
        xp: 14,
        ai: 'melee_dash'
    },
    'kamikaze': {
        name: '不穩定光靈',
        baseHp: 10, baseSpd: 4.2, baseDmg: 40, 
        size: 13, attackRange: 20, 
        windup: 0.5, cooldown: 99, 
        color: '#ffaa00',
        visual: 'volatile_wisp', 
        xp: 12,
        ai: 'volatile' 
    },
    'skirmisher': {
        name: '軌道砲艇',
        baseHp: 20, baseSpd: 2.0, baseDmg: 8,
        size: 16, attackRange: 220, 
        windup: 0.5, cooldown: 1.5,
        color: '#00ffff',
        visual: 'orbit_drone', 
        xp: 15,
        ai: 'skirmisher' 
    }
};