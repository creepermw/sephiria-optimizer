// ============================================================
// Sephiria 配装优化器 · 内置数据
// 数据来源:
//  A) sephiria.miraheze.org (46 个神器, infobox 结构化, 2024-2026)
//  B) NGA 玩家数据测算帖 tid=44470360 (中文名/效果/稀有度)
//  C) konachangame.com 简易图鉴 (石板名/稀有度)
// 数值(value)为按效果文本的相对估算, 非官方公式, 供优化排序用。
// 玩家可在 UI 中修改/添加物品, 并导出/导入 JSON 分享。
// ============================================================

// 稀有度: common=白 advanced=蓝 rare=金 legendary=红
// tags: atk 攻击 spd 攻速 crit 暴击 cdmg 爆伤 elem 元素 trig 触发
//       surv 生存 mp 蓝量 eco 经济 util 功能
// value: 0-100 相对价值 (估算)

const RARITY_LABEL = { common: '白', advanced: '蓝', rare: '金', legendary: '红' };

const ARTIFACTS = [
  // ---------- Common / 白 ----------
  { id: 'azure_pearl', name: 'Azure Pearl', nameZh: '天青珍珠', rarity: 'common', tags: ['trig'], value: 25,
    effect: '对 3 格外受伤的敌人施加侵蚀', src: 'wiki' },
  { id: 'broken_sapphire', name: 'Broken Sapphire', nameZh: '破碎蓝宝石', rarity: 'common', tags: ['elem', 'surv'], value: 20,
    effect: '减少 33/50/80% 摔落与陷阱伤害; 冰伤 +2/+3/+4', src: 'wiki' },
  { id: 'chalcedony_key', name: 'Chalcedony Key', nameZh: '玉髓钥匙', rarity: 'common', tags: ['elem'], value: 25,
    effect: '闪电伤害 +2~+14', src: 'wiki' },
  { id: 'charm_intelligence', name: 'Charm of Intelligence', nameZh: '睿智护身符', rarity: 'common', tags: ['elem'], value: 20,
    effect: '冰伤害 +1/+2/+4/+6', src: 'wiki' },
  { id: 'charm_skill', name: 'Charm of Skill', nameZh: '灵巧护身符', rarity: 'common', tags: ['util'], value: 25,
    effect: '移速 +4%~+40%', src: 'wiki' },
  { id: 'charm_strength', name: 'Charm of Strength', nameZh: '力量护身符', rarity: 'common', tags: ['atk'], value: 25,
    effect: '物理伤害 +2/+3/+4/+5', src: 'wiki' },
  { id: 'empty_hilt', name: 'Empty Hilt', nameZh: '空剑柄', rarity: 'common', tags: ['atk', 'eco'], value: 30,
    effect: '每 700 金币 全伤害 +10%~+15%', src: 'wiki' },
  { id: 'explosion_vest', name: 'Explosion Proof Vest', nameZh: '防爆背心', rarity: 'common', tags: ['trig', 'surv'], value: 20,
    effect: '受击时生成 1~5 个炸药(伤害 15)', src: 'wiki' },
  { id: 'kriton_seal', name: "Kriton's Seal", nameZh: '克里顿印章', rarity: 'common', tags: ['eco'], value: 35,
    effect: '金币获取 +10%/+25%/+50%', src: 'wiki' },
  { id: 'model_mast', name: 'Model Mast', nameZh: '桅杆模型', rarity: 'common', tags: ['elem'], value: 5,
    effect: '雷云消耗速度 +25%/+50%/+125% (负面为主)', src: 'wiki' },
  { id: 'mouse_mage_pendant', name: "Mouse Mage's Pendant", nameZh: '鼠法师吊坠', rarity: 'common', tags: ['trig'], value: 25,
    effect: '上方格子的魔法弹自动追踪敌人', src: 'wiki' },
  { id: 'shield_bag', name: 'Shield Bag', nameZh: '盾袋', rarity: 'common', tags: ['surv'], value: 30,
    effect: '格挡范围 +30%~+150%', src: 'wiki' },
  { id: 'slim_cushion', name: 'Slim Cushion', nameZh: '薄垫', rarity: 'common', tags: ['util'], value: 15,
    effect: '敌人受伤时几率提升移速 0.1(10秒)', src: 'wiki' },
  { id: 'stone_flower', name: 'Stone Flower', nameZh: '石花', rarity: 'common', tags: ['elem'], value: 15,
    effect: '雷云范围 +1/+5/+10 格', src: 'wiki' },
  { id: 'warm_stone', name: 'Warm Stone', nameZh: '暖石', rarity: 'common', tags: ['cdmg'], value: 30,
    effect: '暴击伤害 +5%/+10%/+20%/+35%/+50%', src: 'wiki' },
  { id: 'windgrass_scarf', name: 'Windgrass Scarf', nameZh: '风草围巾', rarity: 'common', tags: ['atk'], value: 25,
    effect: '冲刺攻击伤害 +30%/+45%/+60%/+80%', src: 'wiki' },
  { id: 'begonia_sachet', name: 'Begonia Sachet', nameZh: '秋海棠香囊', rarity: 'common', tags: ['trig'], value: 30,
    effect: '白稀有度中的宝藏, 低稀有度强力触发件', src: 'nga' },
  { id: 'silver_plate', name: 'Silver Plate', nameZh: '银盘子', rarity: 'common', tags: ['atk'], value: 30,
    effect: '独立乘区增伤件', src: 'nga' },
  { id: 'longing_amulet', name: 'Amulet of Longing', nameZh: '渴望护符', rarity: 'common', tags: ['crit'], value: 30,
    effect: '暴击率加成', src: 'nga' },
  { id: 'evil_bandage', name: 'Evil Bandage', nameZh: '邪恶绷带', rarity: 'common', tags: ['crit'], value: 30,
    effect: '暴击率加成', src: 'nga' },
  { id: 'withered_flower', name: 'Withered Flower', nameZh: '枯萎的花', rarity: 'common', tags: ['mp'], value: 25,
    effect: 'MP 相关, 神秘系可用', src: 'nga' },

  // ---------- Advanced / 蓝 ----------
  { id: 'balisong', name: 'Balisong', nameZh: '巴里松', rarity: 'advanced', tags: ['atk'], value: 55,
    effect: '对 1 格内敌人伤害 +15%/+30%/+60%/+100%', src: 'wiki' },
  { id: 'blue_ink_bottle', name: 'Blue Ink Bottle', nameZh: '蓝墨水瓶', rarity: 'advanced', tags: ['trig', 'eco'], value: 40,
    effect: '普通攻击施加侵蚀; 交易 +6~+12', src: 'wiki' },
  { id: 'blue_planet', name: 'Blue Planet', nameZh: '蓝色行星', rarity: 'advanced', tags: ['trig'], value: 50,
    effect: '召唤蓝色行星射击(伤害 12~62)', src: 'wiki' },
  { id: 'chakram', name: 'Chakram', nameZh: '环刃', rarity: 'advanced', tags: ['trig'], value: 50,
    effect: '发射 1~3 个环刃周期性攻击(伤害 15~30)', src: 'wiki' },
  { id: 'cloud_seed_arrowhead', name: 'Cloud Seed Arrowhead', nameZh: '云种箭镞', rarity: 'advanced', tags: ['elem'], value: 40,
    effect: '普通攻击每造成 550/400/300 伤害获得 1 雷云', src: 'wiki' },
  { id: 'cold_lock', name: 'Cold Lock', nameZh: '冰冷的锁', rarity: 'advanced', tags: ['atk'], value: 55,
    effect: '全伤害 +8%/+12%/+16%/+20%/+25%', src: 'wiki' },
  { id: 'golden_crown_arrogance', name: 'Golden Crown of Arrogance', nameZh: '傲慢金冠', rarity: 'advanced', tags: ['crit'], value: 50,
    effect: '连击最后一段暴击率 +15%~+100%', src: 'wiki' },
  { id: 'leaf_bird_leather', name: 'Leaf Bird Leather', nameZh: '叶鸟皮革', rarity: 'advanced', tags: ['elem', 'spd'], value: 45,
    effect: '普攻几率消耗 1 雷云; 攻速 +10%', src: 'wiki' },
  { id: 'magic_carrot', name: 'Magic Carrot', nameZh: '魔法胡萝卜', rarity: 'advanced', tags: ['elem'], value: 35,
    effect: '冰伤 +1~+7; 物理伤害 -1~-3', src: 'wiki' },
  { id: 'mini_ballista', name: 'Mini Ballista', nameZh: '迷你弩炮', rarity: 'advanced', tags: ['trig'], value: 55,
    effect: '召唤迷你弩炮射 1~5 支雷箭(几率获得雷云)', src: 'wiki' },
  { id: 'red_eyed_snake', name: 'Red-Eyed Snake', nameZh: '红眼蛇', rarity: 'advanced', tags: ['trig'], value: 60,
    effect: '普攻触发陨石, 造成 140%~700% 火伤害', src: 'wiki' },
  { id: 'red_mist', name: 'Red Mist', nameZh: '红雾', rarity: 'advanced', tags: ['trig', 'crit'], value: 50,
    effect: '暴击时生成持续攻击领域(伤害 4~16)', src: 'wiki' },
  { id: 'robe_yearning', name: 'Robe of Yearning', nameZh: '切望长袍', rarity: 'advanced', tags: ['elem'], value: 45,
    effect: '占用 20 MP: 魔法伤害 +5%/+12%/+20%', src: 'wiki' },
  { id: 'sapote_fruit', name: 'Sapote Fruit', nameZh: '萨波特果', rarity: 'advanced', tags: ['elem', 'mp'], value: 40,
    effect: '每第 3 次雷击恢复 3/6/10 MP', src: 'wiki' },
  { id: 'serens_letter', name: "Seren's Rushed Letter", nameZh: '瑟伦潦草的信', rarity: 'advanced', tags: ['mp', 'surv'], value: 45,
    effect: '每消耗 40 MP 获得 10~45 护盾(20秒)', src: 'wiki' },
  { id: 'sky_blue_planet', name: 'Sky Blue Planet', nameZh: '天蓝行星', rarity: 'advanced', tags: ['trig'], value: 55,
    effect: '召唤天蓝行星发射激光(伤害 20~125)', src: 'wiki' },
  { id: 'tiny_magic_conch', name: 'Tiny Magic Conch', nameZh: '小魔法海螺', rarity: 'advanced', tags: ['cdmg', 'elem'], value: 40,
    effect: '暴击伤害 +2%/+4%/+6%; 冰伤 +1/+2/+4', src: 'wiki' },
  { id: 'red_cloth_shard', name: 'Red Cloth Shard', nameZh: '红布碎片', rarity: 'advanced', tags: ['atk'], value: 55,
    effect: '敌人每有 1 种异常 全行动增伤 10% (最多 40%)', src: 'nga' },
  { id: 'snow_white_cloak', name: 'Snow White Cloak', nameZh: '纯白斗篷', rarity: 'advanced', tags: ['util'], value: 50,
    effect: '大幅延长 BUFF 持续时间 (骨剑等核心件)', src: 'nga' },
  { id: 'warrior_proof', name: 'Warrior\'s Proof', nameZh: '战士的证明', rarity: 'advanced', tags: ['spd'], value: 50,
    effect: '攻速加成 (坚固系)', src: 'nga' },
  { id: 'stair_model', name: 'Stair Model', nameZh: '阶梯模型', rarity: 'advanced', tags: ['spd'], value: 45,
    effect: '攻速+BUFF持续 (坚固系, 骨剑收益高)', src: 'nga' },
  { id: 'silver_bangle', name: 'Silver Bangle', nameZh: '银手镯', rarity: 'advanced', tags: ['spd'], value: 50,
    effect: '攻速加成', src: 'nga' },
  { id: 'thorn_amulet', name: 'Thorn Amulet', nameZh: '荆棘护符', rarity: 'advanced', tags: ['crit'], value: 50,
    effect: '暴击率加成 (坚固系)', src: 'nga' },
  { id: 'star_ruby', name: 'Star Ruby', nameZh: '星红宝石', rarity: 'advanced', tags: ['crit'], value: 45,
    effect: '暴击率加成', src: 'nga' },
  { id: 'obras_blood', name: "Obra's Blood", nameZh: '奥布拉斯之血', rarity: 'advanced', tags: ['mp'], value: 50,
    effect: 'MP 吸收', src: 'nga' },
  { id: 'blue_pearl', name: 'Blue Pearl', nameZh: '蓝珍珠', rarity: 'advanced', tags: ['mp'], value: 45,
    effect: 'MP 上限/恢复', src: 'nga' },
  { id: 'glass_hammer', name: 'Glass Hammer', nameZh: '玻璃锤', rarity: 'advanced', tags: ['atk'], value: 45,
    effect: '武器伤害提升(有代价)', src: 'nga' },
  { id: 'score_wind', name: 'Score of Wind', nameZh: '乐谱风', rarity: 'advanced', tags: ['util', 'atk'], value: 60,
    effect: '范围+走位+输出一体 (物理平A系必拿)', src: 'nga' },

  // ---------- Rare / 金 ----------
  { id: 'bicorn_pipe', name: 'Bicorn Pipe', nameZh: '双角兽笛', rarity: 'rare', tags: ['elem'], value: 70,
    effect: '攻击法术分裂 3 方向(每道伤害 -50%/-25%, 耗蓝+100%)', src: 'wiki' },
  { id: 'blood_stone_ring', name: 'Blood Stone Ring', nameZh: '血石戒指', rarity: 'rare', tags: ['surv'], value: 60,
    effect: '每 15/13/10 次击杀恢复 5 HP', src: 'wiki' },
  { id: 'broken_root', name: 'Broken Root', nameZh: '断根', rarity: 'rare', tags: ['mp'], value: 70,
    effect: '最大 MP +5/+10/+20/+35/+60', src: 'wiki' },
  { id: 'crimson_sunset', name: 'Crimson Sunset', nameZh: '绯红落日', rarity: 'rare', tags: ['atk'], value: 70,
    effect: '日刃 20%~100% 几率变大且伤害 +33%', src: 'wiki' },
  { id: 'fretted_clay_tablet', name: 'Fretted Clay Tablet', nameZh: '纹陶碑', rarity: 'rare', tags: ['elem'], value: 70,
    effect: '闪电暴击时获得 1/1/2/3 雷云', src: 'wiki' },
  { id: 'heart_carrot', name: 'Heart-Shaped Carrot', nameZh: '心形胡萝卜', rarity: 'rare', tags: ['surv', 'mp'], value: 65,
    effect: '最大 HP +5~+30; 最大 MP +5~+30', src: 'wiki' },
  { id: 'lightning_stone', name: 'Lightning Stone', nameZh: '闪电石', rarity: 'rare', tags: ['elem'], value: 70,
    effect: '完美格挡获得 1/3/7/15 雷云', src: 'wiki' },
  { id: 'pouch_black_tea', name: 'Pouch of Black Tea', nameZh: '红茶叶袋', rarity: 'rare', tags: ['atk', 'surv'], value: 75,
    effect: '小BOSS伤害 -20%; 击败小BOSS后全伤 +5%/+10%/+20%', src: 'wiki' },
  { id: 'sword_training_manual', name: 'Sword Training Manual', nameZh: '剑术教材', rarity: 'rare', tags: ['spd'], value: 80,
    effect: '攻击速度 +7%/+14%/+26%', src: 'wiki' },
  { id: 'voluspa', name: 'Völuspá', nameZh: '沃尔帕', rarity: 'rare', tags: ['trig'], value: 75,
    effect: '战斗中每 5 秒冰矛攻击, 伤害 20+冰伤 50%~350%', src: 'wiki' },
  { id: 'white_branch', name: 'White Branch', nameZh: '白枝', rarity: 'rare', tags: ['mp'], value: 70,
    effect: 'MP 恢复 +5/+9/+15/+22/+30', src: 'wiki' },
  { id: 'colorless_cube', name: 'Colorless Cube', nameZh: '无色立方体', rarity: 'rare', tags: ['atk'], value: 70,
    effect: '无视防御伤害 (攻速件兼输出)', src: 'nga' },
  { id: 'dull_bell', name: 'Dull Bell', nameZh: '钝化铃铛', rarity: 'rare', tags: ['trig'], value: 70,
    effect: '眩晕控制, 打断 BOSS 行动 (联机生存顶级)', src: 'nga' },
  { id: 'specimen_beak', name: 'Specimen Beak', nameZh: '标本喙', rarity: 'rare', tags: ['trig'], value: 65,
    effect: '暗影系触发件 (1.0 改版后)', src: 'nga' },
  { id: 'rabbit_guard_helmet', name: 'Rabbit Guard Helmet', nameZh: '兔子村警备头盔', rarity: 'rare', tags: ['atk'], value: 70,
    effect: '武器伤害提升', src: 'nga' },
  { id: 'glass_hammer_r', name: 'Glass Hammer (Rare)', nameZh: '玻璃锤(金)', rarity: 'rare', tags: ['atk'], value: 70,
    effect: '武器伤害提升(有代价)', src: 'nga' },

  // ---------- Legendary / 红 ----------
  { id: 'neutralizer_noir', name: 'Neutralizer Noir', nameZh: '中和者黑', rarity: 'legendary', tags: ['atk', 'surv', 'cdmg', 'eco'], value: 95,
    effect: '全伤 +10%~+40%; 减伤 +5%~+10%; 爆伤 +5%~+20%; 交易+幸运', src: 'wiki' },
  { id: 'white_crust_bread', name: 'White Crust Bread', nameZh: '白边面包', rarity: 'legendary', tags: ['surv'], value: 95,
    effect: '受伤后获得 0.5~1.8 秒无敌', src: 'wiki' },
  { id: 'black_scale', name: 'Black Scale', nameZh: '黑鳞片', rarity: 'legendary', tags: ['cdmg'], value: 85,
    effect: '暴击爆伤加成', src: 'nga' },
  { id: 'berut_sickle', name: 'Berut\'s Sickle', nameZh: '贝鲁特之镰', rarity: 'legendary', tags: ['cdmg'], value: 90,
    effect: '溢出暴击率转为处决几率', src: 'nga' },
  { id: 'humble_crown', name: 'Humble Crown', nameZh: '谦逊的王冠', rarity: 'legendary', tags: ['cdmg'], value: 85,
    effect: '爆伤加成 (尾刀大剑双王冠之一)', src: 'nga' },
  { id: 'arrogant_crown_red', name: 'Arrogant Crown (Red)', nameZh: '傲慢金冠(红)', rarity: 'legendary', tags: ['cdmg'], value: 85,
    effect: '爆伤加成 (与 wiki 蓝稀有度版本冲突, 以游戏内为准)', src: 'nga' },
  { id: 'balt_precision_glasses', name: "Balt's Precision Glasses", nameZh: '巴尔特的工作用精密眼镜', rarity: 'legendary', tags: ['crit'], value: 80,
    effect: '暴击率加成 (精密套装)', src: 'nga' },
];

// ---------- 石板 ----------
// 石板效果: 对相对位置(以石板为原点)的格子内的神器 等级+N / -N。
// cells: [{dx, dy, lv}]  dx=列偏移(右为正) dy=行偏移(下为正)
// 旋转 = 对 cells 做 90° 旋转。
// 数据来源: konachangame.com 图鉴截图 OCR 识别(2026-08), 方向/数值可能有误差,
// 可在 UI 编辑器中修正; eff 为人类可读摘要。
const TABLETS = [
  { id: 't_justice', name: 'Justice', nameZh: '正义', cells: [
      { dx: -1, dy: -2, lv: 1 }, { dx: -1, dy: -1, lv: 1 }, { dx: -1, dy: 0, lv: 1 }, { dx: -1, dy: 1, lv: 1 }, { dx: -1, dy: 2, lv: 1 },
      { dx: 1, dy: -2, lv: 1 }, { dx: 1, dy: -1, lv: 1 }, { dx: 1, dy: 0, lv: 1 }, { dx: 1, dy: 1, lv: 1 }, { dx: 1, dy: 2, lv: 1 },
    ], eff: '左、右两整列 +1', note: 'OCR识别' },
  { id: 't_simultaneity', name: 'Simultaneity', nameZh: '同时性', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: 0, dy: 1, lv: 1 }, { dx: 0, dy: 2, lv: 1 },
    ], eff: '垂直方向格子 +1', note: 'OCR识别' },
  { id: 't_bonding', name: 'Bonding', nameZh: '接合', cells: [
      { dx: 1, dy: 0, lv: 2 },
    ], eff: '单格 +2', note: 'OCR识别' },
  { id: 't_wave', name: 'Wave', nameZh: '波', cells: null, eff: '待补', note: '效果待补, 可自定义' },
  { id: 't_acclaim', name: 'Acclaim', nameZh: '欢呼', cells: [
      { dx: -1, dy: -1, lv: 1 }, { dx: 1, dy: -1, lv: 1 }, { dx: 0, dy: 1, lv: 1 },
    ], eff: '三角排列 3 格 +1', note: 'OCR识别' },
  { id: 't_fate', name: 'Fate', nameZh: '命运', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: -1, dy: 0, lv: 1 }, { dx: 1, dy: 0, lv: 1 }, { dx: 0, dy: 1, lv: 1 },
    ], eff: '菱形 4 格 +1', note: 'OCR识别' },
  { id: 't_approximation', name: 'Approximation', nameZh: '近似', cells: [
      { dx: -1, dy: -1, lv: 1 }, { dx: 1, dy: -1, lv: 1 }, { dx: 0, dy: 1, lv: 1 },
    ], eff: '三角排列 3 格 +1', note: 'OCR识别' },
  { id: 't_tricorne', name: 'Tricorne', nameZh: '三头', cells: [
      { dx: -1, dy: -1, lv: 1 }, { dx: 0, dy: -1, lv: 1 }, { dx: 1, dy: -1, lv: 1 },
    ], eff: '上方一行 3 格 +1', note: 'OCR识别' },
  { id: 't_advance', name: 'Advance', nameZh: '前进', cells: [
      { dx: -1, dy: 0, lv: 1 }, { dx: 1, dy: 0, lv: 1 },
    ], eff: '左、右 +1', note: 'OCR识别' },
  { id: 't_elation', name: 'Elation', nameZh: '高扬', cells: [
      { dx: -1, dy: 0, lv: 1 },
    ], eff: '左格 +1', note: 'OCR识别' },
  { id: 't_harmony', name: 'Harmony', nameZh: '和合', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: 1, dy: 0, lv: 1 }, { dx: -1, dy: 0, lv: -1 }, { dx: 0, dy: 1, lv: -1 },
    ], eff: '上+1 右+1 左-1 下-1', note: 'OCR识别' },
  { id: 't_nurture', name: 'Nurture', nameZh: '养育', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: -1, dy: 0, lv: 1 }, { dx: 0, dy: 1, lv: 1 }, { dx: 1, dy: 0, lv: -1 }, { dx: 1, dy: 1, lv: -1 },
    ], eff: '上+1 左+1 下+1 右-1 右下-1', note: 'OCR识别' },
  { id: 't_exploit', name: 'Exploit', nameZh: '榨取', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: 0, dy: 1, lv: -1 },
    ], eff: '上+1 下-1', note: 'OCR识别' },
  { id: 't_cohesion', name: 'Cohesion', nameZh: '凝聚', cells: [
      { dx: 0, dy: -1, lv: 3 }, { dx: 0, dy: -2, lv: -1 }, { dx: 0, dy: 1, lv: -1 }, { dx: 0, dy: 2, lv: -1 },
    ], eff: '上1格+3 同列其他-1', note: 'OCR识别' },
  { id: 't_binary', name: 'Binary Star', nameZh: '连星', cells: [
      { dx: -1, dy: 0, lv: 2 }, { dx: 1, dy: 0, lv: 2 },
    ], eff: '左、右 +2', note: 'OCR识别' },
  { id: 't_favor', name: 'Favor', nameZh: '好意', cells: [
      { dx: 0, dy: 2, lv: 1 }, { dx: 0, dy: 1, lv: 1 },
    ], eff: '下方格子 +1', note: 'OCR识别' },
  { id: 't_preparation', name: 'Preparation', nameZh: '准备', cells: [
      { dx: -1, dy: -1, lv: 1 }, { dx: 1, dy: 1, lv: 1 },
    ], eff: '左上、右下 +1', note: 'OCR识别' },
  { id: 't_wisdom', name: 'Wisdom', nameZh: '机知', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: 1, dy: 0, lv: 1 },
    ], eff: '上、右 +1', note: 'OCR识别' },
  { id: 't_handshake', name: 'Handshake', nameZh: '握手', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: 0, dy: 1, lv: 1 },
    ], eff: '上、下 +1', note: 'OCR识别' },
  { id: 't_hope', name: 'Hope', nameZh: '希望', cells: [
      { dx: -1, dy: 0, lv: 1 }, { dx: 1, dy: 0, lv: 1 },
    ], eff: '左、右 +1', note: 'OCR识别' },
  { id: 't_dedication', name: 'Dedication', nameZh: '献呈', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: -1, dy: 0, lv: 1 }, { dx: 1, dy: 0, lv: 1 }, { dx: 0, dy: 1, lv: 1 },
    ], eff: '上、下、左、右 +1', note: 'OCR识别' },
  { id: 't_rebellion', name: 'Rebellion', nameZh: '反抗', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: 1, dy: -1, lv: 1 }, { dx: -1, dy: 1, lv: 1 },
    ], eff: '上、右上、左下 +1', note: 'OCR识别' },
  { id: 't_future', name: 'Future', nameZh: '未来', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: -1, dy: 0, lv: 1 }, { dx: -1, dy: 1, lv: 1 }, { dx: 1, dy: 1, lv: 1 },
    ], eff: '上、左、左下、右下 +1', note: 'OCR识别' },
  { id: 't_mischief', name: 'Mischief', nameZh: '恶作剧', cells: [
      { dx: -1, dy: -1, lv: 1 }, { dx: 1, dy: -1, lv: -1 }, { dx: -1, dy: 0, lv: 1 }, { dx: -1, dy: 1, lv: 1 }, { dx: 1, dy: 1, lv: -1 },
    ], eff: '左上+1 右上-1 左中+1 左下+1 右下-1', note: 'OCR识别' },
  { id: 't_boundary', name: 'Boundary', nameZh: '境界', cells: [
      { dx: 0, dy: -1, lv: 1 }, { dx: 0, dy: -2, lv: 1 }, { dx: 0, dy: -3, lv: 1 }, { dx: 0, dy: -4, lv: 1 }, { dx: 0, dy: -5, lv: 1 }, { dx: 0, dy: -6, lv: 1 },
      { dx: 0, dy: 1, lv: 1 }, { dx: 0, dy: 2, lv: 1 }, { dx: 0, dy: 3, lv: 1 }, { dx: 0, dy: 4, lv: 1 }, { dx: 0, dy: 5, lv: 1 }, { dx: 0, dy: 6, lv: 1 },
    ], eff: '上、下整列 +1', note: 'OCR识别' },
  { id: 't_oath', name: 'Oath', nameZh: '誓言', cells: [
      { dx: 0, dy: -1, lv: 2 }, { dx: -1, dy: 0, lv: 1 }, { dx: 1, dy: 0, lv: 1 }, { dx: 0, dy: 1, lv: 1 },
    ], eff: '上格+2 左、右、下 +1', note: 'OCR识别' },
];

// 示例石板(根据 namu.wiki 机制描述的通用模板, 数值为占位示例, 可在 UI 中修改)
// 每个石板 cells 定义: 以石板所在格为原点
const TABLET_PRESETS = [
  { id: 'p_plus_row', name: '示例: 右方整行 +1', cells: [{ dx: 1, dy: 0, lv: 1 }, { dx: 2, dy: 0, lv: 1 }, { dx: 3, dy: 0, lv: 1 }] },
  { id: 'p_plus_col', name: '示例: 下方整列 +1', cells: [{ dx: 0, dy: 1, lv: 1 }, { dx: 0, dy: 2, lv: 1 }, { dx: 0, dy: 3, lv: 1 }] },
  { id: 'p_plus_cross', name: '示例: 十字 +1', cells: [{ dx: 1, dy: 0, lv: 1 }, { dx: -1, dy: 0, lv: 1 }, { dx: 0, dy: 1, lv: 1 }, { dx: 0, dy: -1, lv: 1 }] },
  { id: 'p_minus_ring', name: '示例: 斜角 -1 (负面)', cells: [{ dx: 1, dy: 1, lv: -1 }, { dx: -1, dy: 1, lv: -1 }, { dx: 1, dy: -1, lv: -1 }, { dx: -1, dy: -1, lv: -1 }] },
];

// ---------- 套装定义 ----------
// 每个物品的 set 字段对应下面的套装; 同套装 ≥2 件时, 每件价值加成 (count-1)*0.15 (封顶 60%)
// 来源: NGA 玩家测算帖 (套装归属可能随版本变动, 可在 data.js 修正)
const SETS = {
  sturdy:   { name: '坚固',  ids: ['warrior_proof', 'stair_model', 'silver_bangle', 'thorn_amulet', 'black_scale', 'colorless_cube'] },
  windsong: { name: '风之歌', ids: ['score_wind', 'windgrass_scarf'] },
  precision:{ name: '精密',  ids: ['balt_precision_glasses', 'longing_amulet', 'evil_bandage', 'warm_stone'] },
  mystic:   { name: '神秘',  ids: ['snow_white_cloak', 'withered_flower', 'star_ruby', 'obras_blood', 'blue_pearl', 'broken_root', 'white_branch'] },
  shadow:   { name: '暗影',  ids: ['specimen_beak'] },
  storm:    { name: '雷云',  ids: ['fretted_clay_tablet', 'lightning_stone', 'stone_flower', 'cloud_seed_arrowhead', 'leaf_bird_leather', 'mini_ballista', 'chalcedony_key', 'sapote_fruit'] },
};
// 物品 -> 套装id 映射 (由 SETS 生成)
const SET_OF = {};
for (const [sid, s] of Object.entries(SETS)) for (const id of s.ids) SET_OF[id] = sid;

// ---------- 武器联动权重 ----------
// 选择武器后, 与流派权重叠加: 有效权重 = 流派权重 × 武器权重
const WEAPONS = {
  none:        { label: '无/通用', tags: { atk: 1, spd: 1, crit: 1, cdmg: 1, trig: 1, elem: 1, surv: 1, mp: 1, eco: 1, util: 1 } },
  greatsword:  { label: '大剑(平A)', tags: { atk: 1.5, spd: 1.3, crit: 1.2, cdmg: 1.2, util: 1.1, trig: 0.8, elem: 0.5, surv: 0.8, mp: 0.6, eco: 0.7 } },
  bone_sword:  { label: '骨剑(位移BUFF)', tags: { util: 1.6, spd: 1.5, atk: 1.3, surv: 1.2, trig: 0.8, elem: 0.5, crit: 1.0, cdmg: 1.0, mp: 0.7, eco: 0.7 } },
  spiral:      { label: '螺旋剑(触发)', tags: { trig: 1.7, atk: 1.3, elem: 1.1, spd: 1.1, crit: 1.0, cdmg: 1.0, surv: 0.7, mp: 0.8, eco: 0.6, util: 0.8 } },
  finisher:    { label: '尾刀大剑(爆伤)', tags: { cdmg: 1.7, crit: 1.5, atk: 1.4, trig: 0.8, elem: 0.5, spd: 1.0, surv: 0.7, mp: 0.6, eco: 0.7, util: 0.9 } },
  staff:       { label: '法杖(魔法)', tags: { elem: 1.7, mp: 1.3, trig: 1.1, atk: 0.5, spd: 0.8, crit: 0.9, cdmg: 0.9, surv: 0.6, eco: 0.6, util: 0.7 } },
  crossbow:    { label: '弩(攻速)', tags: { spd: 1.6, trig: 1.3, atk: 1.2, crit: 1.1, cdmg: 1.1, elem: 0.9, surv: 0.6, mp: 0.6, eco: 0.7, util: 0.9 } },
};

// 等级上限 (按稀有度默认, 可在 UI/自定义物品中修改)
function defaultMaxLevel(rarity) {
  return { common: 3, advanced: 5, rare: 7, legendary: 9 }[rarity] || 5;
}

// 流派预设: tag -> 权重倍率 (调整后价值 = value × avg(权重[tags]))
const BUILD_PRESETS = {
  physical: { label: '物理平A', tags: { atk: 1.5, spd: 1.4, crit: 1.2, cdmg: 1.3, trig: 0.8, elem: 0.5, surv: 0.7, mp: 0.5, eco: 0.8, util: 1.0 } },
  trigger:  { label: '触发系',  tags: { trig: 1.6, atk: 1.0, spd: 1.1, crit: 1.0, cdmg: 1.0, elem: 1.2, surv: 0.7, mp: 0.7, eco: 0.7, util: 0.8 } },
  magic:    { label: '魔法系',  tags: { elem: 1.6, mp: 1.2, trig: 1.1, atk: 0.6, spd: 0.8, crit: 0.9, cdmg: 0.9, surv: 0.6, eco: 0.6, util: 0.7 } },
  survival: { label: '生存流',  tags: { surv: 1.6, mp: 1.0, util: 1.1, atk: 0.7, trig: 0.7, elem: 0.6, crit: 0.7, cdmg: 0.7, spd: 0.8, eco: 0.8 } },
  economy:  { label: '经济流',  tags: { eco: 1.7, util: 1.1, surv: 0.9, atk: 0.7, trig: 0.7, elem: 0.5, crit: 0.7, cdmg: 0.7, spd: 0.8, mp: 0.7 } },
  custom:   { label: '自定义',  tags: { atk: 1, spd: 1, crit: 1, cdmg: 1, trig: 1, elem: 1, surv: 1, mp: 1, eco: 1, util: 1 } },
};

if (typeof module !== 'undefined') module.exports = { ARTIFACTS, TABLETS, TABLET_PRESETS, BUILD_PRESETS, RARITY_LABEL, SETS, SET_OF, WEAPONS, defaultMaxLevel };
