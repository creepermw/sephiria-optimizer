// ============================================================
// Sephiria 配装优化器 · 核心逻辑 + UI
// 优化模型(简化):
//   - 背包为 W×H 网格, 物品(神器)与石板均占 1 格, 部分格子可能被占用
//   - 石板对指定相对位置的格子内的神器进行 等级+N/-N
//   - 神器生效等级 = 1 + Σ石板影响, 截断到 [0, maxLevel]
//   - 神器价值 = 基础价值 × 流派/武器权重 × 套装加成
//   - 目标: 最大化 Σ(神器价值 × 生效等级)
// 算法: 两阶段 Beam Search (先石板布局, 再固定石板放物品), 输出 Top3 方案
// ============================================================

(() => {
'use strict';

// ---------------- 数据 ---------------- //
const { ARTIFACTS, TABLETS, TABLET_PRESETS, BUILD_PRESETS, RARITY_LABEL, SETS, SET_OF, WEAPONS, defaultMaxLevel } =
  typeof window !== 'undefined' ? window.SEPHIRIA_DATA : require('./data.js');

const STORE_KEY = 'sephiria_optimizer_saves_v2';

// ---------------- 状态 ---------------- //
const state = {
  W: 6, H: 4,
  build: 'physical',
  weapon: 'none',
  owned: {},        // itemId -> true
  tablets: {},      // tabletId -> true
  customCells: {},  // tabletId -> [{dx,dy,lv}] 用户自定义石板效果
  occupied: {},     // "r,c" -> true  已占用格子
  customItems: [],  // 玩家自录神器 {id,nameZh,rarity,tags,value,effect,maxLevel}
  maxLevels: {},    // itemId -> maxLevel 覆盖
  solving: false,
  results: [],      // Top3 方案 [{placements, score}]
  resultIdx: 0,
};

// ---------------- 通用 ---------------- //
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TAG_NAMES = { atk: '攻击', spd: '攻速', crit: '暴击率', cdmg: '暴击伤害', elem: '元素', trig: '触发', surv: '生存', mp: '蓝量', eco: '经济', util: '功能' };
const ALL_TAGS = Object.keys(TAG_NAMES);

function byId(id) {
  if (id.startsWith('c_')) return state.customItems.find(a => a.id === id);
  return ARTIFACTS.find(a => a.id === id);
}
const byTabletId = id => TABLETS.find(t => t.id === id);

// 勾选集合 (含自定义物品)
function ownedIds() { return Object.keys(state.owned).filter(k => state.owned[k]); }

// 套装加成: 基于勾选集合中同套装物品数量
function setBonusOf(item) {
  const sid = SET_OF[item.id];
  if (!sid) return 1;
  const count = ownedIds().filter(id => SET_OF[id] === sid).length;
  return count >= 2 ? Math.min(1.6, 1 + (count - 1) * 0.15) : 1;
}

// 流派×武器权重 -> 物品价值
function itemValue(item) {
  const bw = BUILD_PRESETS[state.build].tags;
  const ww = WEAPONS[state.weapon]?.tags || WEAPONS.none.tags;
  let sum = 0, n = 0;
  for (const t of item.tags) { sum += (bw[t] ?? 1) * (ww[t] ?? 1); n++; }
  const base = Math.round(item.value * sum / Math.max(1, n) * 10) / 10;
  return Math.round(base * setBonusOf(item) * 10) / 10;
}

function maxLevelOf(item) {
  if (state.maxLevels[item.id] != null) return state.maxLevels[item.id];
  return item.maxLevel || defaultMaxLevel(item.rarity);
}

// 石板旋转: cells 绕原点旋转 k×90°
function rotateCells(cells, k) {
  if (!cells) return null;
  const r = k % 4;
  if (r === 0) return cells;
  return cells.map(({ dx, dy, lv }) => {
    let x = dx, y = dy;
    for (let i = 0; i < r; i++) { const t = x; x = y; y = -t; }
    return { dx: x, dy: y, lv };
  });
}

// ---------------- 优化器 ---------------- //
function tabletCells(id, rot) {
  const c = state.customCells[id] || byTabletId(id).cells;
  return c ? rotateCells(c, rot) : null;
}

function emptyBoard() {
  const b = Array.from({ length: state.H }, () => Array(state.W).fill(null));
  for (const key of Object.keys(state.occupied)) {
    const [r, c] = key.split(',').map(Number);
    if (r < state.H && c < state.W) b[r][c] = { kind: 'blocked' };
  }
  return b;
}

function effLevel(board, r, c, item) {
  let lv = 1;
  for (const t of board.flat()) {
    if (!t || t.kind !== 'tablet') continue;
    const cells = tabletCells(t.id, t.rot);
    if (!cells) continue;
    for (const cell of cells) {
      const cr = t.r + cell.dy, cc = t.c + cell.dx;
      if (cr === r && cc === c) lv += cell.lv;
    }
  }
  if (item) lv = Math.min(lv, maxLevelOf(item));
  return Math.max(0, lv);
}

function levelMap(board) {
  const lm = Array.from({ length: state.H }, () => Array(state.W).fill(1));
  for (const row of board) for (const t of row) {
    if (!t || t.kind !== 'tablet') continue;
    const cells = tabletCells(t.id, t.rot) || [];
    for (const cell of cells) {
      const r = t.r + cell.dy, c = t.c + cell.dx;
      if (r >= 0 && r < state.H && c >= 0 && c < state.W) lm[r][c] += cell.lv;
    }
  }
  return lm;
}

function scoreOf(placements, board) {
  const lm = levelMap(board);
  let s = 0;
  for (const p of placements) {
    if (p.kind !== 'item') continue;
    const item = byId(p.id);
    s += itemValue(item) * Math.max(0, Math.min(lm[p.r][p.c], maxLevelOf(item)));
  }
  return s;
}

// beam search: 两阶段, 返回 Top3 方案
function solve(itemIds, tabletIds) {
  const W = state.W, H = state.H;
  const total = itemIds.length + tabletIds.length;
  const BEAM = Math.min(220, 60 * total);
  const tabletOnly = tabletIds.filter(id => (state.customCells[id] || byTabletId(id).cells));

  // 阶段 1: 石板布局
  let tBeam = [{ board: emptyBoard(), placements: [], tList: tabletOnly.slice(), score: 0 }];
  for (let step = 0; step < tabletOnly.length; step++) {
    const next = [];
    for (const cand of tBeam) {
      const { board, placements, tList } = cand;
      for (let i = 0; i < tList.length; i++) {
        const id = tList[i];
        const rest = tList.slice(0, i).concat(tList.slice(i + 1));
        const cells0 = state.customCells[id] || byTabletId(id).cells;
        for (let rot = 0; rot < 4; rot++) {
          const cells = rotateCells(cells0, rot);
          for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
            if (board[r][c]) continue;
            let inBoard = 0, conflict = false;
            for (const cell of cells) {
              const rr = r + cell.dy, cc = c + cell.dx;
              if (rr >= 0 && rr < H && cc >= 0 && cc < W) {
                inBoard++;
                if (board[rr][cc]) conflict = true;
              }
            }
            if (!inBoard || conflict) continue;
            const nb = board.map(row => row.slice());
            nb[r][c] = { kind: 'tablet', id, rot, r, c };
            const pl = placements.concat([{ kind: 'tablet', id, r, c, rot }]);
            next.push({ board: nb, placements: pl, tList: rest, score: scoreOf(pl, nb) });
          }
        }
      }
    }
    if (!next.length) break;
    next.sort((a, b) => b.score - a.score);
    tBeam = next.slice(0, BEAM);
  }

  // 阶段 2: 固定每种石板布局, 放置物品 (等级图不变, 增量计分), 收集每布局最优
  const candidates = [];
  const tabletLayouts = tBeam.slice(0, Math.min(tBeam.length, 15));
  for (const t0 of tabletLayouts) {
    const lm = levelMap(t0.board);
    let beam = [{ board: t0.board, placements: t0.placements.slice(), iList: itemIds.slice(), score: t0.score }];
    for (let step = 0; step < itemIds.length; step++) {
      const next = [];
      for (const cand of beam) {
        const { board, placements, iList, score } = cand;
        for (let i = 0; i < iList.length; i++) {
          const id = iList[i];
          const rest = iList.slice(0, i).concat(iList.slice(i + 1));
          const item = byId(id);
          const v = itemValue(item);
          const cap = maxLevelOf(item);
          for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
            if (board[r][c]) continue;
            const nb = board.map(row => row.slice());
            nb[r][c] = { kind: 'item', id, r, c };
            const pl = placements.concat([{ kind: 'item', id, r, c }]);
            const nscore = score + v * Math.max(0, Math.min(lm[r][c], cap));
            next.push({ board: nb, placements: pl, iList: rest, score: nscore });
          }
        }
      }
      if (!next.length) break;
      next.sort((a, b) => b.score - a.score);
      beam = next.slice(0, BEAM);
    }
    if (beam.length) candidates.push({ board: beam[0].board, placements: beam[0].placements, score: beam[0].score });
  }

  // 去重并按分数排序取 Top3
  candidates.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const top = [];
  for (const cand of candidates) {
    const sig = cand.placements.map(p => `${p.kind}:${p.id}:${p.r},${p.c}${p.rot != null ? ':' + p.rot : ''}`).sort().join('|');
    if (seen.has(sig)) continue;
    seen.add(sig);
    top.push(cand);
    if (top.length >= 3) break;
  }
  return top.length ? top : [{ placements: [], board: emptyBoard(), score: 0 }];
}

// ---------------- 渲染: 物品列表 ---------------- //
function allItems() {
  return ARTIFACTS.concat(state.customItems);
}

function renderItemList() {
  const q = ($('#search')?.value || '').toLowerCase();
  const rar = $('#rarityFilter')?.value || 'all';
  const wrap = $('#itemList');
  const items = allItems().filter(a =>
    (rar === 'all' || a.rarity === rar) &&
    (!q || a.name.toLowerCase().includes(q) || (a.nameZh || '').includes(q))
  );
  wrap.innerHTML = items.map(a => {
    const sid = SET_OF[a.id];
    const setTag = sid ? `<span class="set-tag">${esc(SETS[sid].name)}</span>` : '';
    return `
    <label class="item-row r-${a.rarity} ${state.owned[a.id] ? 'on' : ''}">
      <input type="checkbox" data-id="${a.id}" ${state.owned[a.id] ? 'checked' : ''}>
      <span class="rarity-badge">${RARITY_LABEL[a.rarity]}</span>
      <span class="item-name" title="${esc(a.effect)}">${esc(a.nameZh || a.name)}${a.id.startsWith('c_') ? ' ✎' : ''}</span>
      ${setTag}
      <span class="item-val">${itemValue(a)}</span>
    </label>`;
  }).join('') || '<div class="empty">没有匹配的物品</div>';
  wrap.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      state.owned[inp.dataset.id] = inp.checked;
      renderItemList();
      updateCounts();
      scheduleSave();
    });
  });
}

function renderTabletList() {
  const wrap = $('#tabletList');
  wrap.innerHTML = TABLETS.map(t => {
    const has = t.cells || state.customCells[t.id];
    const effText = state.customCells[t.id] ? '自定义' : (t.eff || '待补');
    return `
    <div class="item-row tablet-row ${state.tablets[t.id] ? 'on' : ''}">
      <input type="checkbox" data-id="${t.id}" ${state.tablets[t.id] ? 'checked' : ''}>
      <span class="item-name" title="${esc(t.note || '')}">${esc(t.nameZh || t.name)}</span>
      <span class="item-val ${has ? 'has-cell' : 'no-cell'}" title="${esc(effText)}">${esc(effText)}</span>
      <button class="edit-btn" data-id="${t.id}" title="自定义效果">✏️</button>
    </div>`;
  }).join('');
  wrap.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('click', e => e.stopPropagation());
    inp.addEventListener('change', () => {
      state.tablets[inp.dataset.id] = inp.checked;
      renderTabletList();
      updateCounts();
      scheduleSave();
      // 勾选后若无效果数据, 自动打开编辑器引导补全
      if (inp.checked && !(state.customCells[inp.dataset.id] || byTabletId(inp.dataset.id).cells)) {
        openTabletEditor(inp.dataset.id);
      }
    });
  });
  wrap.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      state.tablets[btn.dataset.id] = true;
      const inp = wrap.querySelector(`input[data-id="${btn.dataset.id}"]`);
      if (inp) inp.checked = true;
      updateCounts();
      openTabletEditor(btn.dataset.id);
    });
  });
}

function updateCounts() {
  $('#itemCount').textContent = ownedIds().length;
  $('#tabletCount').textContent = Object.keys(state.tablets).filter(k => state.tablets[k]).length;
}

// ---------------- 详情面板 ---------------- //
function showDetail(obj) {
  const panel = $('#detailPanel');
  if (!obj) { panel.innerHTML = '<p class="hint">点击左侧列表中的物品或石板, 这里会显示完整效果与数值。</p>'; return; }
  if (obj.kind === 'item') {
    const a = byId(obj.id);
    const v = itemValue(a);
    const sid = SET_OF[a.id];
    const setText = sid ? ` · 套装: ${SETS[sid].name}` : '';
    const setDetail = sid ? `<div class="detail-cells">${SETS[sid].ids.filter(id => state.owned[id] || byId(id)?.id === a.id).map(id => { const it = byId(id); return it ? `<span class="cell-chip pos">${esc(it.nameZh || it.name)}${state.owned[id] ? '' : ' (未勾)'}</span>` : ''; }).join('')}</div>` : '';
    panel.innerHTML = `
      <div class="detail-head r-${a.rarity}">
        <span class="rarity-badge">${RARITY_LABEL[a.rarity]}</span>
        <b>${esc(a.nameZh || a.name)}</b>
        <span class="detail-val">价值 <b>${v}</b></span>
      </div>
      <div class="detail-tags">${a.tags.map(t => `<span class="tag">${TAG_NAMES[t] || t}</span>`).join('')}<span class="tag">上限Lv${maxLevelOf(a)}</span></div>
      <div class="detail-effect">${esc(a.effect)}</div>
      ${setText ? `<div class="detail-meta">套装: ${esc(SETS[sid].name)} (同套装≥2件, 每件价值+15%/件, 最多+60%)</div>${setDetail}` : ''}
      <div class="detail-meta">稀有度: ${RARITY_LABEL[a.rarity]} · 数据来源: ${a.src === 'wiki' ? 'Miraheze Wiki' : (a.src === 'nga' ? 'NGA社区' : '玩家自定义')}</div>`;
  } else {
    const t = byTabletId(obj.id);
    const cells = state.customCells[obj.id] || t.cells;
    panel.innerHTML = `
      <div class="detail-head">
        <b>${esc(t.nameZh || t.name)}</b>
        <span class="detail-val">${cells ? '有效果数据' : '无效果数据'}</span>
      </div>
      <div class="detail-effect">${esc(t.eff || '暂无效果数据, 可点击 ✏️ 自定义')}</div>
      <div class="detail-cells">${cells ? cells.map(c => `<span class="cell-chip ${c.lv > 0 ? 'pos' : 'neg'}">${c.lv > 0 ? '+' : ''}${c.lv} @ (${c.dx},${c.dy})</span>`).join('') : '—'}</div>
      <div class="detail-meta">${esc(t.note || '')}</div>`;
  }
}

function bindDetail() {
  $('#itemList').addEventListener('click', e => {
    const row = e.target.closest('.item-row');
    if (!row || e.target.tagName === 'INPUT') return;
    showDetail({ kind: 'item', id: row.querySelector('input').dataset.id });
  });
  $('#tabletList').addEventListener('click', e => {
    const row = e.target.closest('.tablet-row');
    if (!row || e.target.tagName === 'INPUT' || e.target.closest('.edit-btn')) return;
    showDetail({ kind: 'tablet', id: row.querySelector('input').dataset.id });
  });
}

// ---------------- 渲染: 棋盘 ---------------- //
function renderBoard(placements, highlight) {
  const board = emptyBoard();
  for (const p of placements || []) if (p.r != null && p.c != null) board[p.r][p.c] = p;
  const wrap = $('#board');
  wrap.style.gridTemplateColumns = `repeat(${state.W}, var(--cell))`;
  let html = '';
  const cellsOf = t => tabletCells(t.id, t.rot) || [];
  for (let r = 0; r < state.H; r++) {
    for (let c = 0; c < state.W; c++) {
      const p = board[r][c];
      if (!p) { html += `<div class="cell empty"></div>`; continue; }
      if (p.kind === 'blocked') {
        html += `<div class="cell blocked" title="已占用格子 (求解时避开)">✕</div>`;
        continue;
      }
      if (p.kind === 'tablet') {
        const affected = cellsOf(p).map(cl => `${p.r + cl.dy},${p.c + cl.dx}`).filter(s => {
          const [rr, cc] = s.split(',').map(Number);
          return rr >= 0 && rr < state.H && cc >= 0 && cc < state.W;
        });
        html += `<div class="cell tablet" title="${esc((byTabletId(p.id)?.nameZh || byTabletId(p.id)?.name || p.id))} (旋转${p.rot * 90}°)">
          <div class="t-name">${esc((byTabletId(p.id)?.nameZh || '石板'))}</div>
          <div class="t-cells">${affected.map(s => `<i data-pos="${s}">${s.replace(',', ',')}</i>`).join('')}</div>
        </div>`;
      } else {
        const a = byId(p.id);
        if (!a) continue;
        const lv = effLevel(board, r, c, a);
        const off = lv <= 0;
        html += `<div class="cell item r-${a.rarity} ${off ? 'off' : ''} ${highlight && highlight.some(h => h[0] === r && h[1] === c) ? 'hl' : ''}" title="${esc(a.nameZh || a.name)}: ${esc(a.effect)}">
          <div class="i-name">${esc(a.nameZh || a.name)}</div>
          <div class="i-lv">Lv.${lv}/${maxLevelOf(a)} <b>${Math.round(itemValue(a) * lv)}</b></div>
        </div>`;
      }
    }
  }
  wrap.innerHTML = html;
}

// ---------------- 求解流程 ---------------- //
function runSolve() {
  if (state.solving) return;
  const itemIds = ownedIds();
  const tabletIds = Object.keys(state.tablets).filter(k => state.tablets[k]);
  if (!itemIds.length) { alert('先勾选你背包里有的物品'); return; }
  const noEffect = tabletIds.filter(id => !(state.customCells[id] || byTabletId(id).cells));
  if (noEffect.length) {
    if (confirm(`以下石板还没有效果数据, 将不参与优化:\n${noEffect.map(id => byTabletId(id).nameZh).join('、')}\n\n要打开编辑器补全效果吗?`)) {
      openTabletEditor(noEffect[0]);
      return;
    }
  }
  state.solving = true;
  $('#solveBtn').disabled = true;
  $('#solveBtn').textContent = '求解中…';
  $('#resultMeta').textContent = '';
  setTimeout(() => {
    const t0 = performance.now();
    state.results = solve(itemIds, tabletIds);
    const ms = Math.round(performance.now() - t0);
    state.solving = false;
    state.resultIdx = 0;
    $('#solveBtn').disabled = false;
    $('#solveBtn').textContent = '求解最优摆放';
    renderResult(ms);
  }, 30);
}

function renderResult(ms) {
  const result = state.results[state.resultIdx] || state.results[0];
  const placed = result.placements;
  renderBoard(placed);
  const placedItems = placed.filter(p => p.kind === 'item');
  const placedTablets = placed.filter(p => p.kind === 'tablet');
  const totalVal = placedItems.reduce((s, p) => {
    const a = byId(p.id);
    return s + itemValue(a) * effLevel(result.board, p.r, p.c, a);
  }, 0);
  const nav = state.results.length > 1
    ? `<div class="plan-nav">方案: ${state.results.map((_, i) => `<button class="plan-btn ${i === state.resultIdx ? 'on' : ''}" data-idx="${i}">${i + 1}</button>`).join('')}</div>`
    : '';
  $('#resultMeta').innerHTML =
    `${nav}<div>总评分 <b>${Math.round(totalVal)}</b> · 放置 ${placedItems.length} 物品 + ${placedTablets.length} 石板 · 求解耗时 ${ms}ms</div>` +
    `<div class="board-summary">` +
    placedItems.map(p => {
      const a = byId(p.id); const lv = effLevel(result.board, p.r, p.c, a);
      return `<span class="chip r-${a.rarity} ${lv <= 0 ? 'off' : ''}" title="${esc(a.effect)}">${esc(a.nameZh || a.name)} Lv${lv}</span>`;
    }).join('') + `</div>`;
  $('#resultMeta').querySelectorAll('.plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.resultIdx = +btn.dataset.idx;
      renderResult(ms);
    });
  });
}

// ---------------- 占用格子编辑 ---------------- //
function renderOccupiedEditor() {
  const wrap = $('#occupiedGrid');
  wrap.style.gridTemplateColumns = `repeat(${state.W}, var(--ocell))`;
  let html = '';
  for (let r = 0; r < state.H; r++) {
    for (let c = 0; c < state.W; c++) {
      const key = `${r},${c}`;
      const occ = state.occupied[key];
      html += `<div class="oc-cell ${occ ? 'on' : ''}" data-key="${key}" title="点击切换占用">${occ ? '✕' : ''}</div>`;
    }
  }
  wrap.innerHTML = html;
  wrap.querySelectorAll('.oc-cell').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.key;
      if (state.occupied[key]) delete state.occupied[key];
      else state.occupied[key] = true;
      renderOccupiedEditor();
      scheduleSave();
    });
  });
}

// ---------------- 自定义物品 ---------------- //
function openCustomItemModal() {
  $('#ciModal').style.display = 'flex';
  $('#ciName').focus();
}
function closeCustomItemModal() { $('#ciModal').style.display = 'none'; }
function saveCustomItem() {
  const name = $('#ciName').value.trim();
  const rarity = $('#ciRarity').value;
  const value = Math.max(1, Math.min(100, +$('#ciValue').value || 10));
  const maxLevel = Math.max(1, Math.min(15, +$('#ciMaxLevel').value || 5));
  const effect = $('#ciEffect').value.trim() || '玩家自定义神器';
  const tags = ALL_TAGS.filter(t => document.querySelector(`#ciTags input[value="${t}"]`)?.checked);
  if (!name) { alert('请输入名称'); return; }
  if (!tags.length) { alert('至少选择一个效果标签'); return; }
  state.customItems.push({ id: 'c_' + Date.now().toString(36), name, nameZh: name, rarity, tags, value, effect, maxLevel, src: 'custom' });
  closeCustomItemModal();
  $('#ciName').value = ''; $('#ciValue').value = '30'; $('#ciMaxLevel').value = '5'; $('#ciEffect').value = '';
  renderItemList();
  scheduleSave();
}

// ---------------- 存档 (localStorage) ---------------- //
function snapshot() {
  return {
    v: 2, W: state.W, H: state.H, build: state.build, weapon: state.weapon,
    owned: { ...state.owned }, tablets: { ...state.tablets },
    customCells: JSON.parse(JSON.stringify(state.customCells)),
    occupied: { ...state.occupied },
    customItems: JSON.parse(JSON.stringify(state.customItems)),
    maxLevels: { ...state.maxLevels },
  };
}

function restore(snap) {
  if (!snap) return;
  state.W = snap.W || 6; state.H = snap.H || 4;
  state.build = snap.build || 'physical';
  state.weapon = snap.weapon || 'none';
  state.owned = { ...(snap.owned || {}) };
  state.tablets = { ...(snap.tablets || {}) };
  state.customCells = JSON.parse(JSON.stringify(snap.customCells || {}));
  state.occupied = { ...(snap.occupied || {}) };
  state.customItems = JSON.parse(JSON.stringify(snap.customItems || []));
  state.maxLevels = { ...(snap.maxLevels || {}) };
  $('#gridW').value = state.W; $('#gridH').value = state.H;
  $('#buildSelect').value = state.build;
  $('#weaponSelect').value = state.weapon;
  renderItemList(); renderTabletList(); updateCounts(); renderOccupiedEditor();
}

let saves = { current: '默认存档', list: {} };
function loadSaves() {
  try { saves = JSON.parse(localStorage.getItem(STORE_KEY)) || { current: '默认存档', list: {} }; }
  catch (e) { saves = { current: '默认存档', list: {} }; }
  if (!saves.list) saves.list = {};
  if (!saves.current || !saves.list[saves.current]) { saves.current = '默认存档'; saves.list['默认存档'] = snapshot(); }
}
let saveTimer = null;
function clearSaveTimer() { clearTimeout(saveTimer); saveTimer = null; }
function scheduleSave() {
  clearSaveTimer();
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saves.list[saves.current] = snapshot();
    localStorage.setItem(STORE_KEY, JSON.stringify(saves));
    renderSaveUI();
  }, 400);
}
function saveNow() {
  clearSaveTimer();
  saves.list[saves.current] = snapshot();
  localStorage.setItem(STORE_KEY, JSON.stringify(saves));
  renderSaveUI();
}
function switchSave(name) {
  clearSaveTimer();
  saves.list[saves.current] = snapshot();
  saves.current = name;
  restore(saves.list[name]);
  saveNow();
}
function deleteSave(name) {
  if (!confirm(`删除存档「${name}」?`)) return;
  delete saves.list[name];
  if (saves.current === name) { saves.current = '默认存档'; saves.list['默认存档'] = snapshot(); }
  localStorage.setItem(STORE_KEY, JSON.stringify(saves));
  renderSaveUI();
}
function renderSaveUI() {
  const sel = $('#saveSelect');
  const opts = Object.keys(saves.list).map(n => `<option value="${esc(n)}" ${n === saves.current ? 'selected' : ''}>${esc(n)}</option>`).join('');
  sel.innerHTML = opts || '<option value="">(无)</option>';
  $('#saveNameInput').value = saves.current;
}

// ---------------- 分享: URL hash / 导入导出 ---------------- //
function exportState() {
  return snapshot();
}

function toShareURL() {
  const d = exportState();
  delete d.v;
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(d))));
  return location.origin + location.pathname + '#s=' + b64;
}

function importFromURL() {
  const m = location.hash.match(/#s=([\w=]+)/);
  if (!m) return;
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if (!d) return;
    restore(d);
  } catch (e) { console.warn('bad share url', e); }
}

function exportFile() {
  const blob = new Blob([JSON.stringify({ ...exportState(), v: 2 }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sephiria-build-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (!d || !d.owned) throw new Error('bad file');
      restore(d);
      saveNow();
      alert('导入成功');
    } catch (e) { alert('文件格式不对: ' + e.message); }
  };
  reader.readAsText(file);
}

// ---------------- 自定义石板编辑器 ---------------- //
let editingTablet = null;
function openTabletEditor(id) {
  editingTablet = id;
  const t = byTabletId(id);
  const cells = state.customCells[id] || t.cells || [];
  const grid = $('#tabletEditorGrid');
  const radius = Math.max(1, Math.min(5, +(grid.dataset.radius || 2)));
  const n = radius * 2 + 1;
  grid.style.gridTemplateColumns = `repeat(${n}, 44px)`;
  grid.innerHTML = '';
  for (let r = -radius; r <= radius; r++) {
    for (let c = -radius; c <= radius; c++) {
      const cell = cells.find(cl => cl.dx === c && cl.dy === r);
      const isOrigin = r === 0 && c === 0;
      const el = document.createElement('div');
      el.className = 'te-cell' + (cell ? ` lv${cell.lv > 0 ? 'p' : 'n'}` : '') + (isOrigin ? ' origin' : '');
      el.textContent = cell ? (cell.lv > 0 ? '+' + cell.lv : String(cell.lv)) : (isOrigin ? '板' : '');
      el.addEventListener('click', () => {
        if (isOrigin) return;
        const v = +($('#teValue')?.value || 1);
        const i = cells.findIndex(cl => cl.dx === c && cl.dy === r);
        if (i >= 0 && cells[i].lv === v) {
          cells.splice(i, 1);
        } else if (i >= 0) {
          cells[i].lv = v;
        } else if (v !== 0) {
          cells.push({ dx: c, dy: r, lv: v });
        }
        state.customCells[id] = cells.length ? cells.slice() : null;
        openTabletEditor(id); renderTabletList(); scheduleSave();
      });
      grid.appendChild(el);
    }
  }
  $('#tabletEditorTitle').textContent = `自定义石板: ${t.nameZh || t.name}`;
  $('#tabletEditor').style.display = 'block';
}

function closeTabletEditor() { $('#tabletEditor').style.display = 'none'; editingTablet = null; }

function bindTabletEditorControls() {
  const grid = $('#tabletEditorGrid');
  $('#teRadius').addEventListener('change', e => {
    grid.dataset.radius = e.target.value;
    if (editingTablet) openTabletEditor(editingTablet);
  });
  $('#teValue').addEventListener('change', () => {
    if (editingTablet) openTabletEditor(editingTablet);
  });
  $('#tabletEditorClose').addEventListener('click', closeTabletEditor);
  $('#tabletEditorClear').addEventListener('click', () => {
    if (!editingTablet) return;
    state.customCells[editingTablet] = null;
    openTabletEditor(editingTablet); renderTabletList(); scheduleSave();
  });
}

// ---------------- 初始化 ---------------- //
function init() {
  $('#gridW').addEventListener('change', e => {
    state.W = Math.min(12, Math.max(3, +e.target.value || 6));
    $('#gridW').value = state.W; renderOccupiedEditor(); scheduleSave();
  });
  $('#gridH').addEventListener('change', e => {
    state.H = Math.min(10, Math.max(2, +e.target.value || 4));
    $('#gridH').value = state.H; renderOccupiedEditor(); scheduleSave();
  });
  $('#buildSelect').addEventListener('change', e => { state.build = e.target.value; renderItemList(); scheduleSave(); });
  $('#weaponSelect').addEventListener('change', e => { state.weapon = e.target.value; renderItemList(); scheduleSave(); });
  $('#search').addEventListener('input', renderItemList);
  $('#rarityFilter').addEventListener('change', renderItemList);
  $('#solveBtn').addEventListener('click', runSolve);
  $('#shareBtn').addEventListener('click', () => {
    const url = toShareURL();
    history.replaceState(null, '', url);
    navigator.clipboard?.writeText(url).then(() => {
      $('#shareBtn').textContent = '已复制!'; setTimeout(() => $('#shareBtn').textContent = '复制分享链接', 1500);
    }).catch(() => prompt('复制这个链接分享给其他玩家:', url));
  });
  $('#clearBtn').addEventListener('click', () => {
    if (!confirm(`清空所有勾选?\n(当前存档「${saves.current}」会被覆盖为空白状态)`)) return;
    state.owned = {}; state.tablets = {}; state.customCells = {};
    renderItemList(); renderTabletList(); updateCounts(); scheduleSave();
  });
  $('#addItemBtn').addEventListener('click', openCustomItemModal);
  $('#ciClose').addEventListener('click', closeCustomItemModal);
  $('#ciSave').addEventListener('click', saveCustomItem);
  $('#ciTags').innerHTML = ALL_TAGS.map(t => `<label><input type="checkbox" value="${t}">${TAG_NAMES[t]}</label>`).join('');
  $('#exportBtn').addEventListener('click', exportFile);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', e => {
    if (e.target.files[0]) importFile(e.target.files[0]);
    e.target.value = '';
  });
  $('#saveNowBtn').addEventListener('click', () => {
    const name = $('#saveNameInput').value.trim() || '默认存档';
    clearSaveTimer();
    saves.list[name] = snapshot();
    saves.current = name;
    localStorage.setItem(STORE_KEY, JSON.stringify(saves));
    renderSaveUI();
  });
  $('#saveDeleteBtn').addEventListener('click', () => deleteSave(saves.current));
  $('#saveSelect').addEventListener('change', e => { if (e.target.value) switchSave(e.target.value); });
  $('#loadPresetBtn').addEventListener('click', () => {
    const sel = $('#presetSelect').value;
    const p = TABLET_PRESETS.find(x => x.id === sel);
    if (!p) return;
    const names = prompt('把这个效果应用到哪个石板?\n(填石板ID或名字, 如 Justice)', '');
    if (!names) return;
    const t = TABLETS.find(x => x.id === names || x.name === names || x.nameZh === names);
    if (!t) { alert('没找到这个石板'); return; }
    state.customCells[t.id] = p.cells.map(cl => ({ ...cl }));
    renderTabletList(); scheduleSave();
  });
  $('#tabletList').addEventListener('click', e => {
    const row = e.target.closest('.tablet-row');
    if (row && e.target.tagName !== 'INPUT' && !e.target.closest('.edit-btn')) {
      const inp = row.querySelector('input');
      state.tablets[inp.dataset.id] = true;
      inp.checked = true;
      renderTabletList();
      updateCounts();
      openTabletEditor(inp.dataset.id);
    }
  });
  bindTabletEditorControls();
  bindDetail();

  $('#presetSelect').innerHTML = TABLET_PRESETS.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('#buildSelect').innerHTML = Object.entries(BUILD_PRESETS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('');
  $('#weaponSelect').innerHTML = Object.entries(WEAPONS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('');

  loadSaves();
  restore(saves.list[saves.current]);
  importFromURL(); // 最后应用 URL 状态 (若存在则覆盖存档)
  renderSaveUI();
}

document.addEventListener('DOMContentLoaded', init);
})();
