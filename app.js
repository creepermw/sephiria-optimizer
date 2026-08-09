// ============================================================
// Sephiria 配装优化器 · 核心逻辑 + UI
// 优化模型(简化):
//   - 背包为 W×H 网格, 物品(神器)与石板均占 1 格
//   - 石板对指定相对位置的格子内的神器进行 等级+N/-N
//   - 神器生效等级 = 1 + Σ(影响该格的石板等级), ≤0 失效(0 分)
//   - 目标: 最大化 Σ(神器.value × 生效等级)
// 算法: 两阶段 Beam Search (先石板布局, 再固定石板放物品)
// ============================================================

(() => {
'use strict';

// ---------------- 数据 ---------------- //
const { ARTIFACTS, TABLETS, TABLET_PRESETS, BUILD_PRESETS, RARITY_LABEL } =
  typeof window !== 'undefined' ? window.SEPHIRIA_DATA : require('./data.js');

// ---------------- 状态 ---------------- //
const state = {
  W: 6, H: 4,
  build: 'physical',
  owned: {},        // itemId -> true
  tablets: {},      // tabletId -> true
  customCells: {},  // tabletId -> [{dx,dy,lv}] 用户自定义石板效果
  solving: false,
};

// ---------------- 通用 ---------------- //
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = id => ARTIFACTS.find(a => a.id === id);
const byTabletId = id => TABLETS.find(t => t.id === id);

// 流派权重 -> 物品价值
function itemValue(item) {
  const w = BUILD_PRESETS[state.build].tags;
  let sum = 0, n = 0;
  for (const t of item.tags) { sum += (w[t] ?? 1); n++; }
  return Math.round(item.value * sum / Math.max(1, n) * 10) / 10;
}

// 石板旋转: cells 绕原点旋转 k×90°
function rotateCells(cells, k) {
  if (!cells) return null;
  const r = k % 4;
  if (r === 0) return cells;
  return cells.map(({ dx, dy, lv }) => {
    // 90° 顺时针: (x,y) -> (y,-x)
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

// 一个完整方案: { items: [{id, r, c}], tablets: [{id, r, c, rot}], score }
function emptyBoard() {
  return Array.from({ length: state.H }, () => Array(state.W).fill(null));
}

function effLevel(board, r, c) {
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
  return Math.max(0, lv);
}

// 等级图: 每格等级 = 1 + Σ石板影响 (石板布局固定时不变)
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
    s += itemValue(byId(p.id)) * Math.max(0, lm[p.r][p.c]);
  }
  return s;
}

// beam search
// 两阶段: 先探索石板布局(石板数量少), 再固定石板放置物品。
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

  // 阶段 2: 固定每种石板布局, 放置物品 (等级图不变, 增量计分)
  let best = null;
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
          const v = itemValue(byId(id));
          for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
            if (board[r][c]) continue;
            const nb = board.map(row => row.slice());
            nb[r][c] = { kind: 'item', id, r, c };
            const pl = placements.concat([{ kind: 'item', id, r, c }]);
            const nscore = score + v * Math.max(0, lm[r][c]);
            next.push({ board: nb, placements: pl, iList: rest, score: nscore });
          }
        }
      }
      if (!next.length) break;
      next.sort((a, b) => b.score - a.score);
      beam = next.slice(0, BEAM);
    }
    if (!best || beam[0].score > best.score) best = { board: beam[0].board, placements: beam[0].placements, score: beam[0].score };
  }
  return best || { placements: [], board: emptyBoard(), score: 0 };
}

// ---------------- 渲染: 物品列表 ---------------- //
function renderItemList() {
  const q = ($('#search')?.value || '').toLowerCase();
  const rar = $('#rarityFilter')?.value || 'all';
  const wrap = $('#itemList');
  const items = ARTIFACTS.filter(a =>
    (rar === 'all' || a.rarity === rar) &&
    (!q || a.name.toLowerCase().includes(q) || (a.nameZh || '').includes(q))
  );
  wrap.innerHTML = items.map(a => `
    <label class="item-row r-${a.rarity} ${state.owned[a.id] ? 'on' : ''}">
      <input type="checkbox" data-id="${a.id}" ${state.owned[a.id] ? 'checked' : ''}>
      <span class="rarity-badge">${RARITY_LABEL[a.rarity]}</span>
      <span class="item-name" title="${esc(a.effect)}">${esc(a.nameZh || a.name)}</span>
      <span class="item-val">${itemValue(a)}</span>
    </label>`).join('') || '<div class="empty">没有匹配的物品</div>';
  wrap.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      state.owned[inp.dataset.id] = inp.checked;
      renderItemList();
      updateCounts();
    });
  });
}

function renderTabletList() {
  const wrap = $('#tabletList');
  wrap.innerHTML = TABLETS.map(t => `
    <div class="item-row tablet-row ${state.tablets[t.id] ? 'on' : ''}">
      <input type="checkbox" data-id="${t.id}" ${state.tablets[t.id] ? 'checked' : ''}>
      <span class="item-name" title="${esc(t.note || '')}">${esc(t.nameZh || t.name)}</span>
      <span class="item-val ${t.cells || state.customCells[t.id] ? 'has-cell' : 'no-cell'}">${t.cells || state.customCells[t.id] ? '有效果' : '待补'}</span>
      <button class="edit-btn" data-id="${t.id}" title="自定义效果">✏️</button>
    </div>`).join('');
  wrap.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('click', e => e.stopPropagation());
    inp.addEventListener('change', () => {
      state.tablets[inp.dataset.id] = inp.checked;
      renderTabletList();
      updateCounts();
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
  $('#itemCount').textContent = Object.keys(state.owned).filter(k => state.owned[k]).length;
  $('#tabletCount').textContent = Object.keys(state.tablets).filter(k => state.tablets[k]).length;
}

// ---------------- 渲染: 棋盘 ---------------- //
function renderBoard(placements, highlight) {
  const board = emptyBoard();
  for (const p of placements || []) board[p.r][p.c] = p;
  const wrap = $('#board');
  wrap.style.gridTemplateColumns = `repeat(${state.W}, var(--cell))`;
  let html = '';
  const cellsOf = t => tabletCells(t.id, t.rot) || [];
  for (let r = 0; r < state.H; r++) {
    for (let c = 0; c < state.W; c++) {
      const p = board[r][c];
      if (!p) { html += `<div class="cell empty"></div>`; continue; }
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
        const lv = effLevel(board, r, c);
        const off = lv <= 0;
        html += `<div class="cell item r-${a.rarity} ${off ? 'off' : ''} ${highlight && highlight.some(h => h[0] === r && h[1] === c) ? 'hl' : ''}" title="${esc(a.nameZh || a.name)}: ${esc(a.effect)}">
          <div class="i-name">${esc(a.nameZh || a.name)}</div>
          <div class="i-lv">Lv.${lv} <b>${Math.round(itemValue(a) * lv)}</b></div>
        </div>`;
      }
    }
  }
  wrap.innerHTML = html;
}

// ---------------- 求解流程 ---------------- //
function runSolve() {
  if (state.solving) return;
  const itemIds = Object.keys(state.owned).filter(k => state.owned[k]);
  const tabletIds = Object.keys(state.tablets).filter(k => state.tablets[k]);
  if (!itemIds.length) { alert('先勾选你背包里有的物品'); return; }
  // 提示: 勾选了但无效果数据的石板不参与优化
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
    const result = solve(itemIds, tabletIds);
    const ms = Math.round(performance.now() - t0);
    state.solving = false;
    $('#solveBtn').disabled = false;
    $('#solveBtn').textContent = '求解最优摆放';
    const placed = result.placements;
    renderBoard(placed);
    const placedItems = placed.filter(p => p.kind === 'item');
    const placedTablets = placed.filter(p => p.kind === 'tablet');
    const totalVal = placedItems.reduce((s, p) => s + itemValue(byId(p.id)) * effLevel(result.board, p.r, p.c), 0);
    $('#resultMeta').innerHTML =
      `总评分 <b>${Math.round(totalVal)}</b> · 放置 ${placedItems.length} 物品 + ${placedTablets.length} 石板 · 求解耗时 ${ms}ms` +
      `<div class="board-summary">` +
      placedItems.map(p => {
        const a = byId(p.id); const lv = effLevel(result.board, p.r, p.c);
        return `<span class="chip r-${a.rarity} ${lv <= 0 ? 'off' : ''}" title="${esc(a.effect)}">${esc(a.nameZh || a.name)} Lv${lv}</span>`;
      }).join('') + `</div>`;
  }, 30);
}

// ---------------- 分享: URL hash ---------------- //
function exportState() {
  const items = Object.keys(state.owned).filter(k => state.owned[k]);
  const tablets = Object.keys(state.tablets).filter(k => state.tablets[k]);
  const custom = {};
  for (const [id, cells] of Object.entries(state.customCells)) if (cells) custom[id] = cells;
  return { v: 1, W: state.W, H: state.H, build: state.build, items, tablets, custom };
}

function toShareURL() {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(exportState()))));
  return location.origin + location.pathname + '#s=' + b64;
}

function importFromURL() {
  const m = location.hash.match(/#s=([\w=]+)/);
  if (!m) return;
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if (!d || d.v !== 1) return;
    state.W = d.W || 6; state.H = d.H || 4;
    state.build = d.build || 'physical';
    state.owned = {}; (d.items || []).forEach(id => { if (byId(id)) state.owned[id] = true; });
    state.tablets = {}; (d.tablets || []).forEach(id => { if (byTabletId(id)) state.tablets[id] = true; });
    state.customCells = d.custom || {};
    $('#gridW').value = state.W; $('#gridH').value = state.H;
    $('#buildSelect').value = state.build;
    renderItemList(); renderTabletList(); updateCounts();
  } catch (e) { console.warn('bad share url', e); }
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
          cells.splice(i, 1); // 同值再点 -> 删除
        } else if (i >= 0) {
          cells[i].lv = v;    // 已有 -> 改成当前数值
        } else if (v !== 0) {
          cells.push({ dx: c, dy: r, lv: v });
        }
        state.customCells[id] = cells.length ? cells.slice() : null;
        openTabletEditor(id); renderTabletList();
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
    openTabletEditor(editingTablet); renderTabletList();
  });
}

// ---------------- 初始化 ---------------- //
function init() {
  $('#gridW').addEventListener('change', e => { state.W = Math.min(12, Math.max(3, +e.target.value || 6)); $('#gridW').value = state.W; });
  $('#gridH').addEventListener('change', e => { state.H = Math.min(10, Math.max(2, +e.target.value || 4)); $('#gridH').value = state.H; });
  $('#buildSelect').addEventListener('change', e => { state.build = e.target.value; renderItemList(); });
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
    if (!confirm('清空所有勾选?')) return;
    state.owned = {}; state.tablets = {}; state.customCells = {};
    renderItemList(); renderTabletList(); updateCounts();
  });
  $('#loadPresetBtn').addEventListener('click', () => {
    const sel = $('#presetSelect').value;
    const p = TABLET_PRESETS.find(x => x.id === sel);
    if (!p) return;
    const names = prompt('把这个效果应用到哪个石板?\n(填石板ID或名字, 如 Justice)', '');
    if (!names) return;
    const t = TABLETS.find(x => x.id === names || x.name === names || x.nameZh === names);
    if (!t) { alert('没找到这个石板'); return; }
    state.customCells[t.id] = p.cells.map(cl => ({ ...cl }));
    renderTabletList();
  });
  $('#tabletList').addEventListener('click', e => {
    const row = e.target.closest('.tablet-row');
    if (row && e.target.tagName !== 'INPUT' && !e.target.closest('.edit-btn')) {
      const inp = row.querySelector('input');
      // 打开编辑器 = 要用这个石板, 自动勾选
      state.tablets[inp.dataset.id] = true;
      inp.checked = true;
      renderTabletList();
      updateCounts();
      openTabletEditor(inp.dataset.id);
    }
  });
  bindTabletEditorControls();

  // 预设选择器填充
  $('#presetSelect').innerHTML = TABLET_PRESETS.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

  importFromURL();
  renderItemList(); renderTabletList(); updateCounts();
}

document.addEventListener('DOMContentLoaded', init);
})();
