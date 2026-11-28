(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});
  const MAPS = FL.MAPS;
  const { getBuildingClearanceRect, getPropClearanceRect } = FL.CONSTANTS;

  const DIR_LABELS = ['0° (Восток)', '90° (Юг)', '180° (Запад)', '270° (Север)'];
  const GRID_STEP = 20;

  function bootEditor() {
    const canvas = document.getElementById('editorCanvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const miniCanvas = document.getElementById('edMinimapCanvas');
    const miniCtx = miniCanvas.getContext('2d');

    const renderer3d = new FL.Pixel3DRenderer();
    const cursors = FL.CursorSystem ? new FL.CursorSystem(renderer3d, { targetEl: canvas, faction: 'red' }) : null;
    const renderer = new FL.GameRenderer(renderer3d);
    const effects = new FL.EffectsPool();

    // DOM elements
    const mapNameTop = document.getElementById('mapNameTop');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const gridToggleBtn = document.getElementById('gridToggleBtn');
    const overlayToggleBtn = document.getElementById('overlayToggleBtn');
    const fitViewBtn = document.getElementById('fitViewBtn');
    const symSeg = document.getElementById('symSeg');
    const bakeSymBtn = document.getElementById('bakeSymBtn');
    const loadMapSelect = document.getElementById('loadMapSelect');
    const newMapBtn = document.getElementById('newMapBtn');
    const saveCustomBtn = document.getElementById('saveCustomBtn');
    const openJsonBtn = document.getElementById('openJsonBtn');
    const testPlayBtn = document.getElementById('testPlayBtn');
    const toolList = document.getElementById('toolList');
    const brushBox = document.getElementById('brushBox');
    const roadBanner = document.getElementById('roadBanner');
    const roadBannerText = document.getElementById('roadBannerText');
    const finishRoadBtn = document.getElementById('finishRoadBtn');
    const cancelRoadBtn = document.getElementById('cancelRoadBtn');
    const toastBanner = document.getElementById('toastBanner');
    const statusCoords = document.getElementById('statusCoords');
    const statusToolHint = document.getElementById('statusToolHint');
    const statusSummary = document.getElementById('statusSummary');
    const edZoomReadout = document.getElementById('edZoomReadout');
    const edMinimapLabel = document.getElementById('edMinimapLabel');

    const selectionPanel = document.getElementById('selectionPanel');
    const selTitle = document.getElementById('selTitle');
    const selBody = document.getElementById('selBody');
    const deleteSelBtn = document.getElementById('deleteSelBtn');
    const valBadge = document.getElementById('valBadge');
    const valStats = document.getElementById('valStats');
    const valIssues = document.getElementById('valIssues');

    const mapCodeInput = document.getElementById('mapCodeInput');
    const mapIdInput = document.getElementById('mapIdInput');
    const mapDescInput = document.getElementById('mapDescInput');
    const biomeGrid = document.getElementById('biomeGrid');
    const sizePresets = document.getElementById('sizePresets');
    const sizeWInput = document.getElementById('sizeWInput');
    const sizeHInput = document.getElementById('sizeHInput');
    const seedInput = document.getElementById('seedInput');
    const randSeedBtn = document.getElementById('randSeedBtn');
    const customMapsList = document.getElementById('customMapsList');
    const customCountBadge = document.getElementById('customCountBadge');

    // Native <dialog> elements
    const jsonDialog = document.getElementById('jsonDialog');
    const jsonTextarea = document.getElementById('jsonTextarea');
    const jsonFeedback = document.getElementById('jsonFeedback');
    const jsonCopyBtn = document.getElementById('jsonCopyBtn');
    const jsonDownloadBtn = document.getElementById('jsonDownloadBtn');
    const jsonUploadBtn = document.getElementById('jsonUploadBtn');
    const jsonFileInput = document.getElementById('jsonFileInput');
    const jsonCompactMirrorCheck = document.getElementById('jsonCompactMirrorCheck');
    const jsonValidateBtn = document.getElementById('jsonValidateBtn');
    const jsonApplyBtn = document.getElementById('jsonApplyBtn');

    // Fallback for browsers without native <dialog closedby="any">
    if (jsonDialog && !('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e) => {
        const r = jsonDialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      jsonDialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e); });
      jsonDialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e)) jsonDialog.close();
      });
    }
    if (jsonDialog) {
      jsonDialog.addEventListener('close', () => { jsonDialog.returnValue = ''; });
    }

    // Editor state
    const state = {
      map: null,
      expanded: null,
      validation: null,
      tool: 'select',
      gridSnap: true,
      showOverlays: true,
      selection: null, // { type: 'spawn'|'supply'|'outpost'|'rock'|'pad'|'road', index, pointIndex? }
      activeRoad: null, // { points: [[x,y], ...], width, smooth }
      brush: {
        spawnFacing: 0,
        supplyCount: 6,
        supplyAmount: 850,
        supplyPattern: 'standard',
        outpostRadius: 74,
        outpostRate: 10,
        rockRadius: 30,
        rockVariant: 'auto', // 'auto' | 0 | 1 | 2
        roadWidth: 58,
        roadSmooth: true,
        padW: 320,
        padH: 240
      },
      undoStack: [],
      redoStack: []
    };

    const cam = { x: 1200, y: 800, zoom: 0.55 };
    const hoverWorld = { x: 1200, y: 800, inside: false };
    const keys = new Set();
    let toastTimer = null;
    let simClock = 0;

    // Preview simulation shell consumed directly by real GameRenderer + Pixel3DRenderer
    const previewSim = {
      worldW: 2400,
      worldH: 1600,
      currentMap: null,
      demoMode: true,
      playerFaction: 'red',
      enemyFaction: 'green',
      elapsedTime: 0,
      cameraTrauma: 0,
      placementMode: null,
      activePowerMode: null,
      fog: null,
      obstacles: [],
      supplyNodes: [],
      capturePoints: [],
      buildings: [],
      units: [],
      wrecks: [],
      projectiles: [],
      orderMarkers: [],
      repairBeams: [],
      activeRadarScans: [],
      activeAirstrikes: [],
      isBuildingPowered: () => true
    };

    function showToast(msg, isError = false) {
      toastBanner.textContent = msg;
      toastBanner.classList.toggle('error', isError);
      toastBanner.classList.remove('hidden');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastBanner.classList.add('hidden'), 2600);
    }

    function snap(v) {
      return state.gridSnap ? Math.round(v / GRID_STEP) * GRID_STEP : Math.round(v);
    }

    function clampWorld(x, y, margin = 20) {
      const { w, h } = state.map.size;
      return {
        x: Math.max(margin, Math.min(w - margin, snap(x))),
        y: Math.max(margin, Math.min(h - margin, snap(y)))
      };
    }

    function cloneMap(m) {
      return JSON.parse(JSON.stringify(m));
    }

    function pushUndo() {
      state.undoStack.push(cloneMap(state.map));
      if (state.undoStack.length > 60) state.undoStack.shift();
      state.redoStack.length = 0;
      syncHistoryButtons();
    }

    function syncHistoryButtons() {
      undoBtn.disabled = state.undoStack.length === 0;
      redoBtn.disabled = state.redoStack.length === 0;
    }

    function undo() {
      if (state.undoStack.length === 0) return;
      state.redoStack.push(cloneMap(state.map));
      state.map = state.undoStack.pop();
      state.selection = null;
      state.activeRoad = null;
      rebuildAll(true);
      syncHistoryButtons();
      showToast('Отменено');
    }

    function redo() {
      if (state.redoStack.length === 0) return;
      state.undoStack.push(cloneMap(state.map));
      state.map = state.redoStack.pop();
      state.selection = null;
      state.activeRoad = null;
      rebuildAll(true);
      syncHistoryButtons();
      showToast('Повторено');
    }

    function loadEditableMap(raw, resetHistory = true) {
      // Expand autoMirror maps into explicit editable objects so every single entity is selectable/movable
      const exp = MAPS.expandMap(raw);
      const editable = MAPS.normalizeMap({ ...exp, autoMirror: false });
      delete editable._source;
      state.map = editable;
      state.selection = null;
      state.activeRoad = null;
      if (resetHistory) {
        state.undoStack.length = 0;
        state.redoStack.length = 0;
        syncHistoryButtons();
      }
      rebuildAll(true);
      fitCamera();
    }

    function rebuildPreviewSim() {
      const exp = MAPS.expandMap(state.map);
      state.expanded = exp;
      previewSim.currentMap = exp;
      previewSim.worldW = exp.size.w;
      previewSim.worldH = exp.size.h;
      previewSim.obstacles = exp.obstacles.map((r, idx) => ({ id: idx + 1, ...r }));
      previewSim.supplyNodes = exp.expandedSupplyNodes.map((s, idx) => ({ id: 1000 + idx, ...s }));
      previewSim.capturePoints = exp.capturePoints.map((cp, idx) => ({
        id: 2000 + idx,
        x: cp.x, y: cp.y, radius: cp.radius,
        owner: cp.initialOwner === 'player' ? 'red' : cp.initialOwner === 'enemy' ? 'green' : null,
        capturingFaction: null, progress: cp.initialOwner ? 1 : 0,
        passiveRate: cp.rate, contested: false
      }));
      previewSim.buildings = exp.spawns.map((sp, idx) => {
        const fRad = (sp.facing || 0) * Math.PI * 0.5;
        return {
          id: 3000 + idx,
          kind: 'hq',
          faction: sp.slot === 'enemy' ? 'green' : 'red',
          x: sp.x, y: sp.y,
          hp: 1500, maxHp: 1500, displayHp: 1500,
          facingDir: sp.facing || 0,
          facingRad: fRad,
          angle: fRad,
          koTimer: 0, buildProgress: 1, selected: false,
          queue: [], hitFlash: 0, recoil: 0, isRepairing: false
        };
      });
      renderer.ensureTerrain(exp, true);

      // Update mini-radar aspect ratio
      const mw = 168;
      const mh = Math.max(88, Math.min(136, Math.round((mw * exp.size.h) / exp.size.w)));
      miniCanvas.width = mw;
      miniCanvas.height = mh;
      edMinimapLabel.textContent = exp.code || 'ОБЗОР';
    }

    function syncInspectorForms() {
      const m = state.map;
      mapNameTop.value = m.name;
      mapCodeInput.value = m.code;
      mapIdInput.value = m.id;
      mapDescInput.value = m.description;
      sizeWInput.value = m.size.w;
      sizeHInput.value = m.size.h;
      seedInput.value = m.seed;

      symSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.sym === m.symmetry));
      biomeGrid.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.biome === m.biome));
      sizePresets.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.w) === m.size.w && Number(b.dataset.h) === m.size.h);
      });

      const biome = MAPS.getBiome(m.biome);
      statusSummary.textContent = `${m.size.w}×${m.size.h} · ${biome.name} · Seed ${m.seed}`;
    }

    function syncValidationUi() {
      const res = MAPS.validateMap(state.map);
      state.validation = res;
      const st = res.stats;

      if (!res.ok) {
        valBadge.textContent = `ОШИБКИ: ${res.errors.length}`;
        valBadge.className = 'ed-val-badge err';
      } else if (res.warnings.length > 0) {
        valBadge.textContent = `СОВЕТЫ: ${res.warnings.length}`;
        valBadge.className = 'ed-val-badge warn';
      } else {
        valBadge.textContent = 'ГОТОВА К БОЮ';
        valBadge.className = 'ed-val-badge ok';
      }

      if (st) {
        valStats.innerHTML = `
          <div class="ed-stat"><small>Дистанция HQ</small><strong>${st.hqDistance}u</strong></div>
          <div class="ed-stat"><small>Нефтевышки</small><strong>${st.capturePointCount}</strong></div>
          <div class="ed-stat"><small>Старт. припасы (≤700u)</small><strong>${st.playerNearSupplies} / ${st.enemyNearSupplies}</strong></div>
          <div class="ed-stat"><small>Слоты базы (И / В)</small><strong>${st.playerBuildSpots} / ${st.enemyBuildSpots}</strong></div>
        `;
      } else {
        valStats.innerHTML = '';
      }

      valIssues.innerHTML = '';
      const allIssues = [...res.errors, ...res.warnings];
      if (allIssues.length === 0) {
        valIssues.innerHTML = '<div class="ed-issue-ok">✓ Проходимость, баланс и зоны строительства в норме.</div>';
      } else {
        for (const iss of allIssues) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `ed-issue ${iss.level === 'error' ? 'error' : 'warn'}`;
          btn.textContent = `${iss.level === 'error' ? '⛔' : '⚠'} ${iss.message}`;
          if (Number.isFinite(iss.x) && Number.isFinite(iss.y)) {
            btn.title = 'Перейти к объекту на карте';
            btn.addEventListener('click', () => {
              cam.x = iss.x;
              cam.y = iss.y;
              cam.zoom = Math.max(cam.zoom, 0.85);
            });
          }
          valIssues.appendChild(btn);
        }
      }
    }

    function syncSelectionPanel() {
      const sel = state.selection;
      if (!sel) {
        selectionPanel.classList.add('hidden');
        return;
      }
      const m = state.map;
      selectionPanel.classList.remove('hidden');
      deleteSelBtn.classList.toggle('hidden', sel.type === 'spawn');
      selBody.innerHTML = '';

      const addNumber = (label, val, min, max, step, onChange) => {
        const l = document.createElement('label');
        l.className = 'ed-field';
        l.innerHTML = `<span>${label}</span><input type="number" min="${min}" max="${max}" step="${step}" value="${val}" />`;
        const inp = l.querySelector('input');
        inp.addEventListener('change', () => {
          const n = Number(inp.value);
          if (!Number.isFinite(n)) return;
          pushUndo();
          onChange(Math.max(min, Math.min(max, n)));
          rebuildAll(false);
        });
        selBody.appendChild(l);
      };

      if (sel.type === 'spawn') {
        const sp = m.spawns[sel.index];
        if (!sp) { state.selection = null; selectionPanel.classList.add('hidden'); return; }
        selTitle.textContent = sp.slot === 'enemy' ? 'HQ ПРОТИВНИКА' : 'HQ ИГРОКА';
        const row = document.createElement('div');
        row.className = 'ed-row-2';
        selBody.appendChild(row);
        const mkCoord = (axis, max) => {
          const l = document.createElement('label');
          l.className = 'ed-field';
          l.innerHTML = `<span>${axis.toUpperCase()}</span><input type="number" min="120" max="${max}" step="10" value="${sp[axis]}" />`;
          l.querySelector('input').addEventListener('change', (e) => {
            pushUndo();
            sp[axis] = Math.max(120, Math.min(max, Math.round(Number(e.target.value) || sp[axis])));
            rebuildAll(false);
          });
          row.appendChild(l);
        };
        mkCoord('x', m.size.w - 120);
        mkCoord('y', m.size.h - 120);

        const dirWrap = document.createElement('label');
        dirWrap.className = 'ed-field';
        dirWrap.innerHTML = `<span>Ориентация выхода (R)</span><select>${DIR_LABELS.map((txt, d) => `<option value="${d}" ${sp.facing === d ? 'selected' : ''}>${txt}</option>`).join('')}</select>`;
        dirWrap.querySelector('select').addEventListener('change', (e) => {
          pushUndo();
          sp.facing = Number(e.target.value) % 4;
          rebuildAll(false);
        });
        selBody.appendChild(dirWrap);

        const padChk = document.createElement('label');
        padChk.className = 'ed-check-inline';
        padChk.innerHTML = `<input type="checkbox" ${sp.pad !== false ? 'checked' : ''} /><span>Бетонная площадка под HQ</span>`;
        padChk.querySelector('input').addEventListener('change', (e) => {
          pushUndo();
          sp.pad = e.target.checked ? true : false;
          rebuildAll(false);
        });
        selBody.appendChild(padChk);
      } else if (sel.type === 'supply') {
        const c = m.supplyClusters[sel.index];
        if (!c) { state.selection = null; selectionPanel.classList.add('hidden'); return; }
        selTitle.textContent = `КЛАСТЕР ПРИПАСОВ #${sel.index + 1}`;
        addNumber('Паллет в кластере (1–7)', c.count, 1, 7, 1, (v) => { c.count = Math.round(v); });
        addNumber('Припасов в паллете', c.amount, 200, 3000, 50, (v) => { c.amount = Math.round(v); });
        const patWrap = document.createElement('label');
        patWrap.className = 'ed-field';
        patWrap.innerHTML = `<span>Раскладка</span><select>
          <option value="standard" ${c.pattern === 'standard' ? 'selected' : ''}>Стандартная россыпь</option>
          <option value="line" ${c.pattern === 'line' ? 'selected' : ''}>Линия</option>
          <option value="ring" ${c.pattern === 'ring' ? 'selected' : ''}>Кольцо</option>
        </select>`;
        patWrap.querySelector('select').addEventListener('change', (e) => {
          pushUndo();
          c.pattern = e.target.value;
          rebuildAll(false);
        });
        selBody.appendChild(patWrap);
      } else if (sel.type === 'outpost') {
        const cp = m.capturePoints[sel.index];
        if (!cp) { state.selection = null; selectionPanel.classList.add('hidden'); return; }
        selTitle.textContent = `НЕФТЕВЫШКА #${sel.index + 1}`;
        addNumber('Доход (+припасов/сек)', cp.rate, 4, 30, 1, (v) => { cp.rate = Math.round(v); });
        addNumber('Радиус захвата', cp.radius, 52, 110, 2, (v) => { cp.radius = Math.round(v); });
      } else if (sel.type === 'rock') {
        const r = m.obstacles[sel.index];
        if (!r) { state.selection = null; selectionPanel.classList.add('hidden'); return; }
        selTitle.textContent = `СКАЛА #${sel.index + 1}`;
        addNumber('Радиус (18–56)', r.radius, 18, 56, 2, (v) => { r.radius = Math.round(v); });
        addNumber('Вариант модели (0–2)', r.variant, 0, 2, 1, (v) => { r.variant = Math.round(v) % 3; });
      } else if (sel.type === 'pad') {
        const p = m.pads[sel.index];
        if (!p) { state.selection = null; selectionPanel.classList.add('hidden'); return; }
        selTitle.textContent = `БЕТОННЫЙ ПЛАЦ #${sel.index + 1}`;
        addNumber('Ширина', p.w, 128, 720, 32, (v) => { p.w = Math.round(v); });
        addNumber('Высота', p.h, 128, 720, 32, (v) => { p.h = Math.round(v); });
      } else if (sel.type === 'road') {
        const rd = m.roads[sel.index];
        if (!rd) { state.selection = null; selectionPanel.classList.add('hidden'); return; }
        selTitle.textContent = `ДОРОГА #${sel.index + 1} (${rd.points.length} точ.)`;
        addNumber('Ширина дороги', rd.width, 24, 120, 4, (v) => { rd.width = Math.round(v); });
        const smChk = document.createElement('label');
        smChk.className = 'ed-check-inline';
        smChk.innerHTML = `<input type="checkbox" ${rd.smooth !== false ? 'checked' : ''} /><span>Плавные повороты</span>`;
        smChk.querySelector('input').addEventListener('change', (e) => {
          pushUndo();
          rd.smooth = e.target.checked;
          rebuildAll(false);
        });
        selBody.appendChild(smChk);
      }
    }

    function syncBrushPanel() {
      const t = state.tool;
      const b = state.brush;
      brushBox.innerHTML = '';

      const addRange = (label, value, min, max, step, unit, onInput) => {
        const wrap = document.createElement('label');
        wrap.className = 'ed-field';
        wrap.innerHTML = `<span>${label}: <strong style="color:var(--brass)">${value}${unit}</strong></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" />`;
        const valEl = wrap.querySelector('strong');
        wrap.querySelector('input').addEventListener('input', (e) => {
          const v = Number(e.target.value);
          valEl.textContent = `${v}${unit}`;
          onInput(v);
        });
        brushBox.appendChild(wrap);
      };

      const hints = {
        select: 'ЛКМ — выбрать и перетащить объект или точку дороги.',
        spawn_player: 'ЛКМ — разместить HQ игрока. Клавиша R — поворот выхода.',
        spawn_enemy: 'ЛКМ — разместить HQ противника. Клавиша R — поворот выхода.',
        supply: 'ЛКМ — поставить кластер припасов.',
        outpost: 'ЛКМ — поставить нефтевышку (контрольную точку).',
        rock: 'ЛКМ (или ведите мышью) — рисовать скалы.',
        road: 'ЛКМ — добавить точку дороги; ПКМ/Enter — завершить дорогу.',
        pad: 'ЛКМ — разместить бетонную площадку.',
        erase: 'ЛКМ (или ведите мышью) — удалить ближайший объект.'
      };
      statusToolHint.textContent = hints[t] || '';

      if (t === 'select') {
        brushBox.innerHTML = '<div class="ed-empty-note">Кликните по HQ, вышке, кластеру припасов, скале, плацу или узлу дороги для перемещения и настройки.</div>';
      } else if (t === 'spawn_player' || t === 'spawn_enemy') {
        const wrap = document.createElement('label');
        wrap.className = 'ed-field';
        wrap.innerHTML = `<span>Поворот выхода (R)</span><select>${DIR_LABELS.map((txt, d) => `<option value="${d}" ${b.spawnFacing === d ? 'selected' : ''}>${txt}</option>`).join('')}</select>`;
        wrap.querySelector('select').addEventListener('change', (e) => { b.spawnFacing = Number(e.target.value) % 4; });
        brushBox.appendChild(wrap);
      } else if (t === 'supply') {
        addRange('Паллет в кластере', b.supplyCount, 1, 7, 1, '', (v) => { b.supplyCount = v; });
        addRange('Объём паллеты', b.supplyAmount, 300, 2000, 50, '', (v) => { b.supplyAmount = v; });
        const pat = document.createElement('label');
        pat.className = 'ed-field';
        pat.innerHTML = `<span>Форма кластера</span><select>
          <option value="standard" ${b.supplyPattern === 'standard' ? 'selected' : ''}>Стандартная</option>
          <option value="line" ${b.supplyPattern === 'line' ? 'selected' : ''}>Линия</option>
          <option value="ring" ${b.supplyPattern === 'ring' ? 'selected' : ''}>Кольцо</option>
        </select>`;
        pat.querySelector('select').addEventListener('change', (e) => { b.supplyPattern = e.target.value; });
        brushBox.appendChild(pat);
      } else if (t === 'outpost') {
        addRange('Доход (+/с)', b.outpostRate, 5, 25, 1, '', (v) => { b.outpostRate = v; });
        addRange('Радиус захвата', b.outpostRadius, 56, 100, 2, 'u', (v) => { b.outpostRadius = v; });
      } else if (t === 'rock') {
        addRange('Радиус скалы', b.rockRadius, 18, 52, 2, 'u', (v) => { b.rockRadius = v; });
        const varSel = document.createElement('label');
        varSel.className = 'ed-field';
        varSel.innerHTML = `<span>Вариант меша</span><select>
          <option value="auto" ${b.rockVariant === 'auto' ? 'selected' : ''}>Случайный (0–2)</option>
          <option value="0" ${b.rockVariant === 0 ? 'selected' : ''}>Вариант 0</option>
          <option value="1" ${b.rockVariant === 1 ? 'selected' : ''}>Вариант 1</option>
          <option value="2" ${b.rockVariant === 2 ? 'selected' : ''}>Вариант 2</option>
        </select>`;
        varSel.querySelector('select').addEventListener('change', (e) => {
          b.rockVariant = e.target.value === 'auto' ? 'auto' : Number(e.target.value);
        });
        brushBox.appendChild(varSel);
      } else if (t === 'road') {
        addRange('Ширина дороги', b.roadWidth, 28, 108, 4, 'u', (v) => { b.roadWidth = v; });
        const sm = document.createElement('label');
        sm.className = 'ed-check-inline';
        sm.innerHTML = `<input type="checkbox" ${b.roadSmooth ? 'checked' : ''} /><span>Сглаживать повороты</span>`;
        sm.querySelector('input').addEventListener('change', (e) => { b.roadSmooth = e.target.checked; });
        brushBox.appendChild(sm);
      } else if (t === 'pad') {
        addRange('Ширина плаца', b.padW, 160, 560, 32, 'u', (v) => { b.padW = v; });
        addRange('Высота плаца', b.padH, 128, 448, 32, 'u', (v) => { b.padH = v; });
      } else if (t === 'erase') {
        brushBox.innerHTML = '<div class="ed-empty-note">Кликните или проведите по скалам, складам, вышкам, плацам или дорогам для удаления. HQ защищены от случайного стирания.</div>';
      }
    }

    function syncRoadBanner() {
      const ar = state.activeRoad;
      if (ar && ar.points.length > 0) {
        roadBannerText.textContent = `Дорога (${ar.points.length} точ.): ЛКМ — точка, ПКМ/Enter — готово`;
        roadBanner.classList.remove('hidden');
      } else {
        roadBanner.classList.add('hidden');
      }
    }

    function syncMapCatalogDropdowns() {
      const builtins = MAPS.getBuiltinMaps();
      const customs = MAPS.getCustomMaps();
      loadMapSelect.innerHTML = '';

      const addGroup = (label, list) => {
        if (list.length === 0) return;
        const og = document.createElement('optgroup');
        og.label = label;
        for (const m of list) {
          const opt = document.createElement('option');
          opt.value = `${m._source}:${m.id}`;
          opt.textContent = `${m.name} (${m.size.w}×${m.size.h})`;
          if (state.map && m.id === state.map.id) opt.selected = true;
          og.appendChild(opt);
        }
        loadMapSelect.appendChild(og);
      };
      addGroup('Встроенные карты', builtins);
      addGroup('Мои карты (локальные)', customs);

      customCountBadge.textContent = String(customs.length);
      customMapsList.innerHTML = '';
      if (customs.length === 0) {
        customMapsList.innerHTML = '<div class="ed-empty-note">Нет сохранённых карт. Нажмите «Сохранить» сверху, чтобы добавить карту в игру.</div>';
      } else {
        for (const cm of customs) {
          const row = document.createElement('div');
          row.className = 'ed-custom-item';
          row.innerHTML = `
            <div class="ed-custom-meta">
              <strong>${cm.name}</strong>
              <small>${cm.size.w}×${cm.size.h} · ${MAPS.getBiome(cm.biome).short}</small>
            </div>
            <div class="ed-custom-btns">
              <button type="button" class="ed-btn small" data-act="load">Откр.</button>
              <button type="button" class="ed-btn danger small" data-act="del" title="Удалить">✕</button>
            </div>
          `;
          row.querySelector('[data-act="load"]').addEventListener('click', () => {
            loadEditableMap(cm, true);
            showToast(`Открыта «${cm.name}»`);
          });
          row.querySelector('[data-act="del"]').addEventListener('click', () => {
            MAPS.deleteCustomMap(cm.id);
            syncMapCatalogDropdowns();
            showToast(`Удалена «${cm.name}»`);
          });
          customMapsList.appendChild(row);
        }
      }
    }

    function rebuildAll(syncForms = false) {
      rebuildPreviewSim();
      if (syncForms) syncInspectorForms();
      syncValidationUi();
      syncSelectionPanel();
      syncRoadBanner();
      MAPS.saveDraftMap(state.map);
    }

    function setTool(tool) {
      if (state.tool === 'road' && tool !== 'road') {
        finishActiveRoad();
      }
      state.tool = tool;
      if (tool !== 'select') state.selection = null;
      toolList.querySelectorAll('.ed-tool').forEach((btn) => btn.classList.toggle('active', btn.dataset.tool === tool));
      syncBrushPanel();
      syncSelectionPanel();
    }

    // Build static Biome & Size preset grids
    for (const bid of MAPS.BIOME_ORDER) {
      const b = MAPS.BIOMES[bid];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ed-biome-btn';
      btn.dataset.biome = bid;
      btn.title = `${b.name} — ${b.desc}`;
      btn.innerHTML = `<span class="swatch" style="background:${b.swatch}"></span><span>${b.short}</span>`;
      btn.addEventListener('click', () => {
        if (state.map.biome === bid) return;
        pushUndo();
        state.map.biome = bid;
        rebuildAll(true);
      });
      biomeGrid.appendChild(btn);
    }

    for (const sp of MAPS.SIZE_PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ed-btn small';
      btn.dataset.w = String(sp.w);
      btn.dataset.h = String(sp.h);
      btn.textContent = sp.label;
      btn.addEventListener('click', () => resizeMap(sp.w, sp.h));
      sizePresets.appendChild(btn);
    }

    function resizeMap(newW, newH) {
      const w = Math.max(1200, Math.min(4800, Math.round(newW / 100) * 100));
      const h = Math.max(1000, Math.min(3600, Math.round(newH / 100) * 100));
      if (w === state.map.size.w && h === state.map.size.h) return;
      pushUndo();
      const sx = w / state.map.size.w;
      const sy = h / state.map.size.h;
      state.map.size = { w, h };
      const scalePt = (o) => { o.x = Math.round(o.x * sx); o.y = Math.round(o.y * sy); };
      for (const sp of state.map.spawns) {
        scalePt(sp);
        if (sp.pad && typeof sp.pad === 'object') scalePt(sp.pad);
      }
      for (const p of state.map.pads) scalePt(p);
      for (const c of state.map.supplyClusters) scalePt(c);
      for (const n of state.map.supplyNodes) scalePt(n);
      for (const cp of state.map.capturePoints) scalePt(cp);
      for (const r of state.map.obstacles) scalePt(r);
      for (const rd of state.map.roads) {
        rd.points = rd.points.map(([x, y]) => [Math.round(x * sx), Math.round(y * sy)]);
      }
      rebuildAll(true);
      fitCamera();
    }

    // Mirror helpers for live symmetric editing
    function getMirrorPartner(x, y) {
      const sym = state.map.symmetry;
      if (!sym || sym === 'none') return null;
      const { w, h } = state.map.size;
      if (MAPS.isOnSymmetryFixedPoint(x, y, w, h, sym, 24)) return null;
      return MAPS.mirrorPoint(x, y, w, h, sym);
    }

    function findMirrorIndex(arr, x, y, skipIndex = -1) {
      const mp = getMirrorPartner(x, y);
      if (!mp) return -1;
      let best = -1, bestD = 36;
      for (let i = 0; i < arr.length; i++) {
        if (i === skipIndex) continue;
        const d = Math.hypot(arr[i].x - mp.x, arr[i].y - mp.y);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    }

    function finishActiveRoad() {
      const ar = state.activeRoad;
      state.activeRoad = null;
      if (!ar || ar.points.length < 2) {
        syncRoadBanner();
        return;
      }
      pushUndo();
      const rd = { width: ar.width, smooth: ar.smooth, points: ar.points.map((p) => [p[0], p[1]]) };
      state.map.roads.push(rd);
      const sym = state.map.symmetry;
      if (sym && sym !== 'none') {
        const { w, h } = state.map.size;
        const mPts = rd.points.map(([px, py]) => {
          const mp = MAPS.mirrorPoint(px, py, w, h, sym);
          return [mp.x, mp.y];
        });
        const sameF = rd.points.every((pt, idx) => Math.hypot(pt[0] - mPts[idx][0], pt[1] - mPts[idx][1]) < 24);
        const sameR = rd.points.every((pt, idx) => {
          const rp = mPts[mPts.length - 1 - idx];
          return Math.hypot(pt[0] - rp[0], pt[1] - rp[1]) < 24;
        });
        if (!sameF && !sameR) {
          state.map.roads.push({ width: rd.width, smooth: rd.smooth, points: mPts });
        }
      }
      rebuildAll(false);
    }

    function hitTest(wx, wy) {
      const m = state.map;
      // 1. Spawns
      for (let i = 0; i < m.spawns.length; i++) {
        if (Math.hypot(m.spawns[i].x - wx, m.spawns[i].y - wy) <= 52) return { type: 'spawn', index: i };
      }
      // 2. Capture points
      for (let i = 0; i < m.capturePoints.length; i++) {
        if (Math.hypot(m.capturePoints[i].x - wx, m.capturePoints[i].y - wy) <= 44) return { type: 'outpost', index: i };
      }
      // 3. Supply clusters
      for (let i = 0; i < m.supplyClusters.length; i++) {
        if (Math.hypot(m.supplyClusters[i].x - wx, m.supplyClusters[i].y - wy) <= 62) return { type: 'supply', index: i };
      }
      // 4. Rocks
      for (let i = m.obstacles.length - 1; i >= 0; i--) {
        const r = m.obstacles[i];
        if (Math.hypot(r.x - wx, r.y - wy) <= r.radius + 14) return { type: 'rock', index: i };
      }
      // 5. Road vertices
      for (let ri = 0; ri < m.roads.length; ri++) {
        const pts = m.roads[ri].points;
        for (let pi = 0; pi < pts.length; pi++) {
          if (Math.hypot(pts[pi][0] - wx, pts[pi][1] - wy) <= 24) {
            return { type: 'road', index: ri, pointIndex: pi };
          }
        }
      }
      // 6. Standalone pads
      for (let i = m.pads.length - 1; i >= 0; i--) {
        const p = m.pads[i];
        if (Math.abs(wx - p.x) <= p.w * 0.5 && Math.abs(wy - p.y) <= p.h * 0.5) return { type: 'pad', index: i };
      }
      return null;
    }

    function deleteSelection() {
      const sel = state.selection;
      if (!sel || sel.type === 'spawn') return;
      const m = state.map;
      pushUndo();
      if (sel.type === 'rock') {
        const item = m.obstacles[sel.index];
        const mi = item ? findMirrorIndex(m.obstacles, item.x, item.y, sel.index) : -1;
        const idxs = [sel.index, mi].filter((x) => x >= 0).sort((a, b) => b - a);
        for (const i of idxs) m.obstacles.splice(i, 1);
      } else if (sel.type === 'supply') {
        const item = m.supplyClusters[sel.index];
        const mi = item ? findMirrorIndex(m.supplyClusters, item.x, item.y, sel.index) : -1;
        const idxs = [sel.index, mi].filter((x) => x >= 0).sort((a, b) => b - a);
        for (const i of idxs) m.supplyClusters.splice(i, 1);
      } else if (sel.type === 'outpost') {
        const item = m.capturePoints[sel.index];
        const mi = item ? findMirrorIndex(m.capturePoints, item.x, item.y, sel.index) : -1;
        const idxs = [sel.index, mi].filter((x) => x >= 0).sort((a, b) => b - a);
        for (const i of idxs) m.capturePoints.splice(i, 1);
      } else if (sel.type === 'pad') {
        const item = m.pads[sel.index];
        const mi = item ? findMirrorIndex(m.pads, item.x, item.y, sel.index) : -1;
        const idxs = [sel.index, mi].filter((x) => x >= 0).sort((a, b) => b - a);
        for (const i of idxs) m.pads.splice(i, 1);
      } else if (sel.type === 'road') {
        m.roads.splice(sel.index, 1);
      }
      state.selection = null;
      rebuildAll(false);
    }

    function eraseAt(wx, wy, recordUndo = true) {
      const hit = hitTest(wx, wy);
      if (!hit || hit.type === 'spawn') return false;
      const m = state.map;
      if (recordUndo) pushUndo();
      if (hit.type === 'road' && hit.pointIndex !== undefined) {
        const rd = m.roads[hit.index];
        if (rd.points.length <= 2) m.roads.splice(hit.index, 1);
        else rd.points.splice(hit.pointIndex, 1);
      } else {
        const prevSel = state.selection;
        state.selection = hit;
        // Perform deletion without duplicate undo
        if (hit.type === 'rock') {
          const item = m.obstacles[hit.index];
          const mi = item ? findMirrorIndex(m.obstacles, item.x, item.y, hit.index) : -1;
          for (const i of [hit.index, mi].filter((x) => x >= 0).sort((a, b) => b - a)) m.obstacles.splice(i, 1);
        } else if (hit.type === 'supply') {
          const item = m.supplyClusters[hit.index];
          const mi = item ? findMirrorIndex(m.supplyClusters, item.x, item.y, hit.index) : -1;
          for (const i of [hit.index, mi].filter((x) => x >= 0).sort((a, b) => b - a)) m.supplyClusters.splice(i, 1);
        } else if (hit.type === 'outpost') {
          const item = m.capturePoints[hit.index];
          const mi = item ? findMirrorIndex(m.capturePoints, item.x, item.y, hit.index) : -1;
          for (const i of [hit.index, mi].filter((x) => x >= 0).sort((a, b) => b - a)) m.capturePoints.splice(i, 1);
        } else if (hit.type === 'pad') {
          const item = m.pads[hit.index];
          const mi = item ? findMirrorIndex(m.pads, item.x, item.y, hit.index) : -1;
          for (const i of [hit.index, mi].filter((x) => x >= 0).sort((a, b) => b - a)) m.pads.splice(i, 1);
        }
        state.selection = prevSel && prevSel.type === hit.type && prevSel.index === hit.index ? null : prevSel;
      }
      rebuildAll(false);
      return true;
    }

    function placeToolAt(wx, wy, recordUndo = true) {
      const m = state.map;
      const b = state.brush;
      const t = state.tool;
      const pt = clampWorld(wx, wy, t.startsWith('spawn') ? 130 : 40);

      if (t === 'spawn_player' || t === 'spawn_enemy') {
        const slot = t === 'spawn_player' ? 'player' : 'enemy';
        if (recordUndo) pushUndo();
        let sp = m.spawns.find((s) => s.slot === slot);
        if (!sp) {
          sp = { slot, x: pt.x, y: pt.y, facing: b.spawnFacing, pad: true };
          m.spawns.push(sp);
        } else {
          sp.x = pt.x;
          sp.y = pt.y;
          sp.facing = b.spawnFacing;
          if (sp.pad && typeof sp.pad === 'object') { sp.pad.x = pt.x; sp.pad.y = pt.y; }
        }
        const mp = getMirrorPartner(pt.x, pt.y);
        if (mp) {
          const otherSlot = slot === 'player' ? 'enemy' : 'player';
          let osp = m.spawns.find((s) => s.slot === otherSlot);
          const mFace = MAPS.mirrorFacing(b.spawnFacing, m.symmetry);
          if (!osp) {
            m.spawns.push({ slot: otherSlot, x: mp.x, y: mp.y, facing: mFace, pad: sp.pad === false ? false : true });
          } else {
            osp.x = mp.x;
            osp.y = mp.y;
            osp.facing = mFace;
            if (osp.pad && typeof osp.pad === 'object') { osp.pad.x = mp.x; osp.pad.y = mp.y; }
          }
        }
        rebuildAll(false);
        return;
      }

      if (t === 'supply') {
        if (recordUndo) pushUndo();
        const item = { x: pt.x, y: pt.y, count: b.supplyCount, amount: b.supplyAmount, pattern: b.supplyPattern };
        m.supplyClusters.push(item);
        const mp = getMirrorPartner(pt.x, pt.y);
        if (mp) m.supplyClusters.push({ ...item, x: mp.x, y: mp.y });
        rebuildAll(false);
        return;
      }

      if (t === 'outpost') {
        if (recordUndo) pushUndo();
        const item = { x: pt.x, y: pt.y, radius: b.outpostRadius, rate: b.outpostRate, initialOwner: null };
        m.capturePoints.push(item);
        const mp = getMirrorPartner(pt.x, pt.y);
        if (mp) m.capturePoints.push({ ...item, x: mp.x, y: mp.y });
        rebuildAll(false);
        return;
      }

      if (t === 'rock') {
        // Avoid stacking rocks directly on top of another rock while painting
        for (const r of m.obstacles) {
          if (Math.hypot(r.x - pt.x, r.y - pt.y) < Math.max(24, (r.radius + b.rockRadius) * 0.62)) return;
        }
        if (recordUndo) pushUndo();
        const variant = b.rockVariant === 'auto' ? Math.floor(Math.random() * 3) : b.rockVariant;
        const item = { kind: 'rock', x: pt.x, y: pt.y, radius: b.rockRadius, variant };
        m.obstacles.push(item);
        const mp = getMirrorPartner(pt.x, pt.y);
        if (mp) {
          const tooClose = m.obstacles.some((r) => Math.hypot(r.x - mp.x, r.y - mp.y) < Math.max(24, (r.radius + b.rockRadius) * 0.62));
          if (!tooClose) m.obstacles.push({ ...item, x: mp.x, y: mp.y });
        }
        rebuildAll(false);
        return;
      }

      if (t === 'pad') {
        if (recordUndo) pushUndo();
        const item = { x: pt.x, y: pt.y, w: b.padW, h: b.padH };
        m.pads.push(item);
        const mp = getMirrorPartner(pt.x, pt.y);
        if (mp) m.pads.push({ ...item, x: mp.x, y: mp.y });
        rebuildAll(false);
        return;
      }

      if (t === 'road') {
        if (!state.activeRoad) {
          state.activeRoad = { width: b.roadWidth, smooth: b.roadSmooth, points: [[pt.x, pt.y]] };
        } else {
          const last = state.activeRoad.points[state.activeRoad.points.length - 1];
          if (Math.hypot(last[0] - pt.x, last[1] - pt.y) >= 20) {
            state.activeRoad.points.push([pt.x, pt.y]);
          }
        }
        syncRoadBanner();
      }
    }

    // Camera coordinate helpers
    function screenToWorld(sx, sy) {
      const rect = canvas.getBoundingClientRect();
      const cx = sx - rect.left;
      const cy = sy - rect.top;
      return {
        x: cam.x + (cx - rect.width * 0.5) / cam.zoom,
        y: cam.y + (cy - rect.height * 0.5) / cam.zoom
      };
    }

    function fitCamera() {
      const rect = canvas.getBoundingClientRect();
      const vw = Math.max(200, rect.width || window.innerWidth - 520);
      const vh = Math.max(200, rect.height || window.innerHeight - 90);
      const { w, h } = state.map.size;
      cam.x = w * 0.5;
      cam.y = h * 0.5;
      cam.zoom = Math.max(0.28, Math.min(1.25, Math.min((vw - 60) / w, (vh - 60) / h)));
      edZoomReadout.textContent = `${Math.round(cam.zoom * 100)}%`;
    }

    // Pointer interaction on editor canvas
    let dragMode = null; // 'pan' | 'move' | 'paintRock' | 'erase'
    let dragStart = { sx: 0, sy: 0, camX: 0, camY: 0 };
    let moveMirrorIndex = -1;
    let moveUndoSaved = false;

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const before = screenToWorld(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      cam.zoom = Math.max(0.26, Math.min(1.8, cam.zoom * factor));
      const rect = canvas.getBoundingClientRect();
      cam.x = before.x - (e.clientX - rect.left - rect.width * 0.5) / cam.zoom;
      cam.y = before.y - (e.clientY - rect.top - rect.height * 0.5) / cam.zoom;
      edZoomReadout.textContent = `${Math.round(cam.zoom * 100)}%`;
    }, { passive: false });

    canvas.addEventListener('dblclick', (e) => {
      if (state.tool === 'road' && state.activeRoad) {
        e.preventDefault();
        finishActiveRoad();
      }
    });

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture?.(e.pointerId);
      const w = screenToWorld(e.clientX, e.clientY);
      hoverWorld.x = w.x;
      hoverWorld.y = w.y;
      hoverWorld.inside = true;

      // Middle click, Space+click, or Right click (except finalizing road) pans camera
      if (e.button === 1 || (e.button === 0 && keys.has(' '))) {
        dragMode = 'pan';
        dragStart = { sx: e.clientX, sy: e.clientY, camX: cam.x, camY: cam.y };
        return;
      }
      if (e.button === 2) {
        if (state.tool === 'road' && state.activeRoad) {
          finishActiveRoad();
          return;
        }
        dragMode = 'pan';
        dragStart = { sx: e.clientX, sy: e.clientY, camX: cam.x, camY: cam.y };
        return;
      }

      if (e.button !== 0) return;

      if (state.tool === 'select') {
        const hit = hitTest(w.x, w.y);
        state.selection = hit;
        syncSelectionPanel();
        if (hit) {
          dragMode = 'move';
          moveUndoSaved = false;
          moveMirrorIndex = -1;
          const m = state.map;
          if (hit.type === 'spawn') {
            const sp = m.spawns[hit.index];
            moveMirrorIndex = m.spawns.findIndex((s, i) => i !== hit.index && s.slot !== sp.slot);
          } else if (hit.type === 'rock') {
            moveMirrorIndex = findMirrorIndex(m.obstacles, m.obstacles[hit.index].x, m.obstacles[hit.index].y, hit.index);
          } else if (hit.type === 'supply') {
            moveMirrorIndex = findMirrorIndex(m.supplyClusters, m.supplyClusters[hit.index].x, m.supplyClusters[hit.index].y, hit.index);
          } else if (hit.type === 'outpost') {
            moveMirrorIndex = findMirrorIndex(m.capturePoints, m.capturePoints[hit.index].x, m.capturePoints[hit.index].y, hit.index);
          } else if (hit.type === 'pad') {
            moveMirrorIndex = findMirrorIndex(m.pads, m.pads[hit.index].x, m.pads[hit.index].y, hit.index);
          }
        }
        return;
      }

      if (state.tool === 'erase') {
        dragMode = 'erase';
        moveUndoSaved = false;
        if (eraseAt(w.x, w.y, true)) moveUndoSaved = true;
        return;
      }

      if (state.tool === 'rock') {
        dragMode = 'paintRock';
        pushUndo();
        placeToolAt(w.x, w.y, false);
        return;
      }

      placeToolAt(w.x, w.y, true);
    });

    canvas.addEventListener('pointermove', (e) => {
      const w = screenToWorld(e.clientX, e.clientY);
      hoverWorld.x = w.x;
      hoverWorld.y = w.y;
      hoverWorld.inside = true;
      statusCoords.textContent = `X: ${Math.round(w.x)} · Y: ${Math.round(w.y)}`;

      if (dragMode === 'pan') {
        cam.x = dragStart.camX - (e.clientX - dragStart.sx) / cam.zoom;
        cam.y = dragStart.camY - (e.clientY - dragStart.sy) / cam.zoom;
        return;
      }

      if (dragMode === 'paintRock') {
        placeToolAt(w.x, w.y, false);
        return;
      }

      if (dragMode === 'erase') {
        eraseAt(w.x, w.y, !moveUndoSaved);
        moveUndoSaved = true;
        return;
      }

      if (dragMode === 'move' && state.selection) {
        const sel = state.selection;
        const m = state.map;
        const pt = clampWorld(w.x, w.y, sel.type === 'spawn' ? 120 : 30);
        if (!moveUndoSaved) {
          pushUndo();
          moveUndoSaved = true;
        }
        const mp = getMirrorPartner(pt.x, pt.y);
        if (sel.type === 'spawn') {
          const sp = m.spawns[sel.index];
          sp.x = pt.x; sp.y = pt.y;
          if (sp.pad && typeof sp.pad === 'object') { sp.pad.x = pt.x; sp.pad.y = pt.y; }
          if (mp && moveMirrorIndex >= 0 && m.spawns[moveMirrorIndex]) {
            const osp = m.spawns[moveMirrorIndex];
            osp.x = mp.x; osp.y = mp.y;
            if (osp.pad && typeof osp.pad === 'object') { osp.pad.x = mp.x; osp.pad.y = mp.y; }
          }
        } else if (sel.type === 'rock') {
          m.obstacles[sel.index].x = pt.x; m.obstacles[sel.index].y = pt.y;
          if (mp && moveMirrorIndex >= 0 && m.obstacles[moveMirrorIndex]) {
            m.obstacles[moveMirrorIndex].x = mp.x; m.obstacles[moveMirrorIndex].y = mp.y;
          }
        } else if (sel.type === 'supply') {
          m.supplyClusters[sel.index].x = pt.x; m.supplyClusters[sel.index].y = pt.y;
          if (mp && moveMirrorIndex >= 0 && m.supplyClusters[moveMirrorIndex]) {
            m.supplyClusters[moveMirrorIndex].x = mp.x; m.supplyClusters[moveMirrorIndex].y = mp.y;
          }
        } else if (sel.type === 'outpost') {
          m.capturePoints[sel.index].x = pt.x; m.capturePoints[sel.index].y = pt.y;
          if (mp && moveMirrorIndex >= 0 && m.capturePoints[moveMirrorIndex]) {
            m.capturePoints[moveMirrorIndex].x = mp.x; m.capturePoints[moveMirrorIndex].y = mp.y;
          }
        } else if (sel.type === 'pad') {
          m.pads[sel.index].x = pt.x; m.pads[sel.index].y = pt.y;
          if (mp && moveMirrorIndex >= 0 && m.pads[moveMirrorIndex]) {
            m.pads[moveMirrorIndex].x = mp.x; m.pads[moveMirrorIndex].y = mp.y;
          }
        } else if (sel.type === 'road' && sel.pointIndex !== undefined) {
          m.roads[sel.index].points[sel.pointIndex] = [pt.x, pt.y];
        }
        rebuildAll(false);
      }
    });

    function syncEditorCursor() {
      if (!cursors) return;
      if (dragMode === 'pan' || dragMode === 'move' || keys.has(' ')) {
        cursors.setCanvasState('move');
        return;
      }
      const t = state.tool;
      if (t === 'select') {
        const hit = hoverWorld.inside ? hitTest(hoverWorld.x, hoverWorld.y) : null;
        cursors.setCanvasState(hit ? 'select' : 'default');
      } else if (t === 'erase') {
        cursors.setCanvasState('build_bad');
      } else if (t === 'supply') {
        cursors.setCanvasState('harvest');
      } else if (t === 'outpost' || t === 'spawn_player' || t === 'spawn_enemy') {
        cursors.setCanvasState('rally');
      } else {
        cursors.setCanvasState('build_ok');
      }
    }

    const endDrag = () => { dragMode = null; syncEditorCursor(); };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', () => { hoverWorld.inside = false; syncEditorCursor(); });

    // Mini-radar jump
    let miniDrag = false;
    const jumpMini = (e) => {
      const r = miniCanvas.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const ny = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      cam.x = nx * state.map.size.w;
      cam.y = ny * state.map.size.h;
    };
    miniCanvas.addEventListener('pointerdown', (e) => { miniDrag = true; jumpMini(e); });
    window.addEventListener('pointermove', (e) => { if (miniDrag) jumpMini(e); });
    window.addEventListener('pointerup', () => { miniDrag = false; });

    // Toolbar & Inspector events
    toolList.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-tool]');
      if (btn) setTool(btn.dataset.tool);
    });

    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    gridToggleBtn.addEventListener('click', () => {
      state.gridSnap = !state.gridSnap;
      gridToggleBtn.classList.toggle('active', state.gridSnap);
    });
    overlayToggleBtn.addEventListener('click', () => {
      state.showOverlays = !state.showOverlays;
      overlayToggleBtn.classList.toggle('active', state.showOverlays);
    });
    fitViewBtn.addEventListener('click', fitCamera);
    finishRoadBtn.addEventListener('click', finishActiveRoad);
    cancelRoadBtn.addEventListener('click', () => { state.activeRoad = null; syncRoadBanner(); });
    deleteSelBtn.addEventListener('click', deleteSelection);

    symSeg.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-sym]');
      if (!btn) return;
      state.map.symmetry = btn.dataset.sym;
      syncInspectorForms();
    });

    bakeSymBtn.addEventListener('click', () => {
      if (state.map.symmetry === 'none') {
        showToast('Сначала выберите режим симметрии (180°, X или Y).', true);
        return;
      }
      pushUndo();
      state.map = MAPS.applySymmetryBake(state.map, state.map.symmetry);
      state.selection = null;
      rebuildAll(true);
      showToast('Карта симметрично отзеркалена');
    });

    loadMapSelect.addEventListener('change', () => {
      const val = loadMapSelect.value;
      const [, id] = val.split(':');
      const m = MAPS.getMapById(id);
      if (m) {
        loadEditableMap(m, true);
        showToast(`Загружена карта «${m.name}»`);
      }
    });

    newMapBtn.addEventListener('click', () => {
      const blank = MAPS.createBlankMap({
        biome: state.map.biome,
        w: state.map.size.w,
        h: state.map.size.h,
        symmetry: state.map.symmetry === 'none' ? 'point' : state.map.symmetry
      });
      loadEditableMap(blank, true);
      showToast('Создана новая карта');
    });

    saveCustomBtn.addEventListener('click', () => {
      const clean = MAPS.stripRuntimeFields(state.map);
      // Avoid clobbering a built-in map id when saving as custom
      const isBuiltinId = MAPS.getBuiltinMaps().some((b) => b.id === clean.id);
      if (isBuiltinId) {
        clean.id = `${clean.id}-custom-${Date.now().toString(36).slice(-4)}`;
        state.map.id = clean.id;
        mapIdInput.value = clean.id;
      }
      MAPS.saveCustomMap(clean);
      syncMapCatalogDropdowns();
      showToast(`Карта «${clean.name}» сохранена в библиотеку`);
    });

    testPlayBtn.addEventListener('click', () => {
      const res = MAPS.validateMap(state.map);
      if (!res.ok) {
        const proceed = window.confirm(`В карте есть ошибки валидации (${res.errors.length}):\n• ${res.errors[0].message}\n\nВсё равно запустить тест-бой?`);
        if (!proceed) return;
      }
      MAPS.saveDraftMap(state.map);
      window.location.href = 'index.html?map=draft';
    });

    // Metadata inputs
    mapNameTop.addEventListener('input', () => {
      state.map.name = mapNameTop.value || 'Без названия';
      MAPS.saveDraftMap(state.map);
    });
    mapCodeInput.addEventListener('input', () => {
      state.map.code = mapCodeInput.value || 'СЕК-00';
      edMinimapLabel.textContent = state.map.code;
      MAPS.saveDraftMap(state.map);
    });
    mapIdInput.addEventListener('change', () => {
      state.map.id = MAPS.slugify(mapIdInput.value);
      mapIdInput.value = state.map.id;
      MAPS.saveDraftMap(state.map);
    });
    mapDescInput.addEventListener('input', () => {
      state.map.description = mapDescInput.value;
      MAPS.saveDraftMap(state.map);
    });
    sizeWInput.addEventListener('change', () => resizeMap(Number(sizeWInput.value), state.map.size.h));
    sizeHInput.addEventListener('change', () => resizeMap(state.map.size.w, Number(sizeHInput.value)));
    seedInput.addEventListener('change', () => {
      pushUndo();
      state.map.seed = Math.max(1, Math.round(Number(seedInput.value) || 1001));
      rebuildAll(true);
    });
    randSeedBtn.addEventListener('click', () => {
      pushUndo();
      state.map.seed = Math.floor(1000 + Math.random() * 89999);
      rebuildAll(true);
    });

    // JSON Modal logic
    function buildExportJson() {
      const clean = MAPS.stripRuntimeFields(state.map);
      if (jsonCompactMirrorCheck.checked && clean.symmetry !== 'none') {
        const { w, h } = clean.size;
        const pSpawn = clean.spawns.find((s) => s.slot === 'player') || { x: w * 0.2, y: h * 0.8 };
        const isHalf = (x, y) => {
          if (clean.symmetry === 'x') return x <= w * 0.5 + 24;
          if (clean.symmetry === 'y') return y >= h * 0.5 - 24;
          const vx = pSpawn.x - w * 0.5, vy = pSpawn.y - h * 0.5;
          return (x - w * 0.5) * vx + (y - h * 0.5) * vy >= -24 * Math.max(1, Math.hypot(vx, vy));
        };
        const compact = {
          ...clean,
          autoMirror: true,
          spawns: [pSpawn],
          pads: clean.pads.filter((p) => isHalf(p.x, p.y)),
          supplyClusters: clean.supplyClusters.filter((c) => isHalf(c.x, c.y)),
          supplyNodes: clean.supplyNodes.filter((n) => isHalf(n.x, n.y)),
          capturePoints: clean.capturePoints.filter((cp) => isHalf(cp.x, cp.y)),
          obstacles: clean.obstacles.filter((o) => isHalf(o.x, o.y))
        };
        return JSON.stringify(compact, null, 2);
      }
      return JSON.stringify(clean, null, 2);
    }

    openJsonBtn.addEventListener('click', () => {
      jsonTextarea.value = buildExportJson();
      jsonFeedback.textContent = '';
      jsonFeedback.classList.remove('error');
      jsonDialog.showModal();
    });

    jsonCompactMirrorCheck.addEventListener('change', () => {
      jsonTextarea.value = buildExportJson();
    });

    jsonCopyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(jsonTextarea.value);
        jsonFeedback.textContent = '✓ JSON скопирован в буфер обмена.';
        jsonFeedback.classList.remove('error');
      } catch {
        jsonTextarea.select();
        jsonFeedback.textContent = 'Выделено — нажмите Ctrl+C для копирования.';
        jsonFeedback.classList.remove('error');
      }
    });

    jsonDownloadBtn.addEventListener('click', () => {
      const blob = new Blob([jsonTextarea.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${MAPS.slugify(state.map.id)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    jsonUploadBtn.addEventListener('click', () => jsonFileInput.click());
    jsonFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      jsonFileInput.value = '';
      if (!file) return;
      jsonTextarea.value = await file.text();
      validateJsonText();
    });

    function validateJsonText() {
      try {
        const parsed = JSON.parse(jsonTextarea.value);
        const res = MAPS.validateMap(parsed);
        if (!res.ok) {
          jsonFeedback.textContent = `⛔ Ошибки (${res.errors.length}): ${res.errors.map((x) => x.message).join(' | ')}`;
          jsonFeedback.classList.add('error');
          return { parsed, res };
        }
        const warnTxt = res.warnings.length ? ` (советов: ${res.warnings.length})` : '';
        jsonFeedback.textContent = `✓ Валидация пройдена${warnTxt}: ${res.stats.worldW}×${res.stats.worldH}, ${res.stats.biome}, HQ dist ${res.stats.hqDistance}u.`;
        jsonFeedback.classList.remove('error');
        return { parsed, res };
      } catch (err) {
        jsonFeedback.textContent = `⛔ Ошибка синтаксиса JSON: ${err.message}`;
        jsonFeedback.classList.add('error');
        return null;
      }
    }

    jsonValidateBtn.addEventListener('click', validateJsonText);
    jsonApplyBtn.addEventListener('click', () => {
      const out = validateJsonText();
      if (!out) return;
      pushUndo();
      loadEditableMap(out.parsed, false);
      jsonDialog.close();
      showToast('Карта загружена из JSON');
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (jsonDialog.open) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (!inField) {
          e.preventDefault();
          if (e.shiftKey) redo(); else undo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (!inField) { e.preventDefault(); redo(); }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCustomBtn.click();
        return;
      }

      if (inField) return;
      const k = e.key.toLowerCase();
      keys.add(k);

      if (k === 'v') setTool('select');
      else if (k === '1') setTool('spawn_player');
      else if (k === '2') setTool('spawn_enemy');
      else if (k === '3') setTool('supply');
      else if (k === '4') setTool('outpost');
      else if (k === '5') setTool('rock');
      else if (k === '6') setTool('road');
      else if (k === '7') setTool('pad');
      else if (k === 'e' || k === '0') setTool('erase');
      else if (k === 'g') gridToggleBtn.click();
      else if (k === 'o') overlayToggleBtn.click();
      else if (k === 'f') fitCamera();
      else if (k === 'r') {
        if (state.selection && state.selection.type === 'spawn') {
          pushUndo();
          const sp = state.map.spawns[state.selection.index];
          sp.facing = (sp.facing + 1) % 4;
          rebuildAll(false);
        } else {
          state.brush.spawnFacing = (state.brush.spawnFacing + 1) % 4;
          syncBrushPanel();
        }
      } else if (k === 'enter' && state.tool === 'road' && state.activeRoad) {
        finishActiveRoad();
      } else if (k === 'escape') {
        if (state.activeRoad) { state.activeRoad = null; syncRoadBanner(); }
        else { state.selection = null; syncSelectionPanel(); }
      } else if ((k === 'delete' || k === 'backspace') && state.selection) {
        e.preventDefault();
        deleteSelection();
      }
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => keys.clear());

    // Render editor overlays in world space
    function drawEditorOverlays(vw, vh) {
      const m = state.map;
      const { w, h } = m.size;
      const z = cam.zoom;
      const camLeft = cam.x - vw / (2 * z);
      const camTop = cam.y - vh / (2 * z);

      ctx.save();
      ctx.scale(z, z);
      ctx.translate(-camLeft, -camTop);

      // Snap grid
      if (state.gridSnap && z >= 0.45) {
        const step = z >= 0.8 ? 40 : 80;
        ctx.strokeStyle = 'rgba(255, 245, 224, 0.06)';
        ctx.lineWidth = 1 / z;
        ctx.beginPath();
        for (let gx = step; gx < w; gx += step) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
        for (let gy = step; gy < h; gy += step) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
        ctx.stroke();
      }

      // Symmetry guide lines
      if (m.symmetry !== 'none') {
        ctx.save();
        ctx.strokeStyle = 'rgba(235, 184, 58, 0.42)';
        ctx.lineWidth = 1.5 / z;
        ctx.setLineDash([10 / z, 8 / z]);
        ctx.beginPath();
        if (m.symmetry === 'x' || m.symmetry === 'point') {
          ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h);
        }
        if (m.symmetry === 'y' || m.symmetry === 'point') {
          ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        if (m.symmetry === 'point') {
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.5, 18, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (state.showOverlays) {
        // HQ build radius (380u) & labels
        for (const sp of m.spawns) {
          const col = sp.slot === 'enemy' ? 'rgba(135, 163, 67, 0.65)' : 'rgba(224, 70, 60, 0.72)';
          ctx.save();
          ctx.strokeStyle = col;
          ctx.lineWidth = 2 / z;
          ctx.setLineDash([12 / z, 8 / z]);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 380, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          const rect = getBuildingClearanceRect('hq', sp.x, sp.y, sp.facing);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.5 / z;
          ctx.strokeRect(sp.x - rect.padHw, sp.y - rect.padHh, rect.padHw * 2, rect.padHh * 2);

          // Facing chevron
          const rad = (sp.facing || 0) * Math.PI * 0.5;
          ctx.save();
          ctx.translate(sp.x + Math.cos(rad) * 62, sp.y + Math.sin(rad) * 52);
          ctx.rotate(rad);
          ctx.fillStyle = sp.slot === 'enemy' ? '#BEF264' : '#FCA5A5';
          ctx.beginPath();
          ctx.moveTo(11, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.font = `bold ${Math.round(12 / z)}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#120f0c';
          const lbl = sp.slot === 'enemy' ? 'HQ ВРАГА' : 'HQ ИГРОКА';
          ctx.fillText(lbl, sp.x + 1, sp.y - 54 + 1);
          ctx.fillStyle = sp.slot === 'enemy' ? '#BEF264' : '#FCA5A5';
          ctx.fillText(lbl, sp.x, sp.y - 54);
          ctx.restore();
        }

        // Supply cluster anchors
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.lineWidth = 1.2 / z;
        for (const c of m.supplyClusters) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 26, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Road control nodes
        for (let ri = 0; ri < m.roads.length; ri++) {
          const rd = m.roads[ri];
          const isSelRoad = state.selection && state.selection.type === 'road' && state.selection.index === ri;
          ctx.strokeStyle = isSelRoad ? '#FBBF24' : 'rgba(243, 232, 210, 0.25)';
          ctx.lineWidth = (isSelRoad ? 2 : 1) / z;
          ctx.beginPath();
          rd.points.forEach(([px, py], i) => { if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
          ctx.stroke();
          for (let pi = 0; pi < rd.points.length; pi++) {
            const [px, py] = rd.points[pi];
            const isSelPt = isSelRoad && state.selection.pointIndex === pi;
            ctx.fillStyle = isSelPt ? '#FBBF24' : 'rgba(243, 232, 210, 0.65)';
            ctx.beginPath();
            ctx.arc(px, py, (isSelPt ? 7 : 4.5) / z, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Active unfinished road preview
      if (state.activeRoad && state.activeRoad.points.length > 0) {
        const pts = state.activeRoad.points;
        ctx.save();
        ctx.strokeStyle = 'rgba(235, 184, 58, 0.85)';
        ctx.lineWidth = Math.max(3 / z, state.activeRoad.width * 0.35);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([12 / z, 8 / z]);
        ctx.beginPath();
        pts.forEach(([px, py], i) => { if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
        if (hoverWorld.inside) {
          const hp = clampWorld(hoverWorld.x, hoverWorld.y, 30);
          ctx.lineTo(hp.x, hp.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        for (const [px, py] of pts) {
          ctx.fillStyle = '#FACC15';
          ctx.beginPath(); ctx.arc(px, py, 6 / z, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // Selected object highlight
      if (state.selection) {
        const sel = state.selection;
        ctx.save();
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2.5 / z;
        if (sel.type === 'spawn' && m.spawns[sel.index]) {
          const s = m.spawns[sel.index];
          ctx.beginPath(); ctx.arc(s.x, s.y, 58, 0, Math.PI * 2); ctx.stroke();
        } else if (sel.type === 'supply' && m.supplyClusters[sel.index]) {
          const c = m.supplyClusters[sel.index];
          ctx.beginPath(); ctx.arc(c.x, c.y, 76, 0, Math.PI * 2); ctx.stroke();
        } else if (sel.type === 'outpost' && m.capturePoints[sel.index]) {
          const cp = m.capturePoints[sel.index];
          ctx.beginPath(); ctx.arc(cp.x, cp.y, cp.radius + 8, 0, Math.PI * 2); ctx.stroke();
        } else if (sel.type === 'rock' && m.obstacles[sel.index]) {
          const r = m.obstacles[sel.index];
          const rr = getPropClearanceRect(r.x, r.y, r.radius, 6, 5);
          ctx.strokeRect(r.x - rr.padHw, r.y - rr.padHh, rr.padHw * 2, rr.padHh * 2);
        } else if (sel.type === 'pad' && m.pads[sel.index]) {
          const p = m.pads[sel.index];
          ctx.strokeRect(p.x - p.w * 0.5, p.y - p.h * 0.5, p.w, p.h);
        }
        ctx.restore();
      }

      // Validation issue markers directly on canvas
      if (state.validation) {
        const pulse = 0.6 + 0.4 * Math.sin(simClock * 6);
        for (const iss of [...state.validation.errors, ...state.validation.warnings]) {
          if (!Number.isFinite(iss.x) || !Number.isFinite(iss.y)) continue;
          ctx.save();
          ctx.strokeStyle = iss.level === 'error' ? `rgba(239, 68, 68, ${pulse})` : `rgba(250, 204, 21, ${pulse * 0.85})`;
          ctx.lineWidth = 3 / z;
          ctx.beginPath();
          ctx.arc(iss.x, iss.y, 34 + pulse * 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Live brush ghost cursor (+ mirror ghost!)
      if (hoverWorld.inside && state.tool !== 'select' && state.tool !== 'road') {
        const pt = clampWorld(hoverWorld.x, hoverWorld.y, state.tool.startsWith('spawn') ? 130 : 40);
        const drawGhost = (gx, gy, isMirror) => {
          ctx.save();
          ctx.globalAlpha = isMirror ? 0.48 : 0.82;
          ctx.strokeStyle = state.tool === 'erase' ? '#EF4444' : isMirror ? '#38BDF8' : '#FACC15';
          ctx.fillStyle = state.tool === 'erase' ? 'rgba(239,68,68,0.14)' : 'rgba(250,204,21,0.14)';
          ctx.lineWidth = 2 / z;
          if (state.tool === 'rock') {
            ctx.beginPath(); ctx.arc(gx, gy, state.brush.rockRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          } else if (state.tool === 'supply') {
            ctx.beginPath(); ctx.arc(gx, gy, 54, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          } else if (state.tool === 'outpost') {
            ctx.beginPath(); ctx.ellipse(gx, gy, state.brush.outpostRadius, state.brush.outpostRadius * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          } else if (state.tool === 'pad') {
            ctx.fillRect(gx - state.brush.padW * 0.5, gy - state.brush.padH * 0.5, state.brush.padW, state.brush.padH);
            ctx.strokeRect(gx - state.brush.padW * 0.5, gy - state.brush.padH * 0.5, state.brush.padW, state.brush.padH);
          } else if (state.tool === 'spawn_player' || state.tool === 'spawn_enemy') {
            ctx.strokeRect(gx - 45, gy - 32, 90, 64);
            ctx.setLineDash([8 / z, 6 / z]);
            ctx.beginPath(); ctx.arc(gx, gy, 380, 0, Math.PI * 2); ctx.stroke();
          } else if (state.tool === 'erase') {
            ctx.beginPath(); ctx.arc(gx, gy, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
          ctx.restore();
        };
        drawGhost(pt.x, pt.y, false);
        if (state.tool !== 'erase') {
          const mp = getMirrorPartner(pt.x, pt.y);
          if (mp) drawGhost(mp.x, mp.y, true);
        }
      }

      ctx.restore();
    }

    // Main animation loop
    let lastNow = performance.now();
    let miniTick = 0;

    function frame(now) {
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      simClock += dt;
      previewSim.elapsedTime = simClock;

      // WASD / Arrow panning
      let panX = 0, panY = 0;
      if (keys.has('w') || keys.has('arrowup')) panY -= 1;
      if (keys.has('s') || keys.has('arrowdown')) panY += 1;
      if (keys.has('a') || keys.has('arrowleft')) panX -= 1;
      if (keys.has('d') || keys.has('arrowright')) panX += 1;
      if (panX !== 0 || panY !== 0) {
        const len = Math.hypot(panX, panY);
        const spd = 760 / cam.zoom;
        cam.x += (panX / len) * spd * dt;
        cam.y += (panY / len) * spd * dt;
      }
      syncEditorCursor();

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const vw = Math.max(1, rect.width);
      const vh = Math.max(1, rect.height);
      const cw = Math.round(vw * dpr);
      const ch = Math.round(vh * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      renderer.renderWorld(ctx, vw, vh, previewSim, effects, cam, null, null, null);
      drawEditorOverlays(vw, vh);
      ctx.restore();

      miniTick += dt;
      if (miniTick >= 0.12) {
        miniTick = 0;
        renderer.renderMinimap(miniCtx, miniCanvas.width, miniCanvas.height, previewSim, cam, vw, vh);
      }

      requestAnimationFrame(frame);
    }

    // Boot initial map from ?map= param, draft, or default
    const params = new URLSearchParams(window.location.search);
    const reqId = params.get('map');
    const initial = (reqId && MAPS.getMapById(reqId)) || MAPS.getDefaultMap();
    loadEditableMap(initial, true);
    syncBrushPanel();
    syncMapCatalogDropdowns();

    MAPS.loadManifestMaps('maps/').then(() => {
      syncMapCatalogDropdowns();
      if (reqId && reqId !== 'draft') {
        const refreshed = MAPS.getMapById(reqId);
        if (refreshed && state.undoStack.length === 0) loadEditableMap(refreshed, true);
      }
    });

    requestAnimationFrame(frame);
  }

  bootEditor();
})();
