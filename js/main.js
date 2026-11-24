(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});
  const { WORLD_WIDTH, WORLD_HEIGHT, FACTION_INFO, FACTION_UNITS, BUILD_ORDER, UNIT_SPECS, BUILDING_SPECS } = FL.CONSTANTS;

  const EMBLEM_SVG = {
    red: '<svg width="20" height="12" viewBox="0 0 14 9" fill="none"><path d="M2 2C2 5 4 7.5 7 8C10 7.5 12 5 12 2" stroke="#fff" stroke-width="1.1"/><path d="M4.5 2.5L7 5.5L9.5 2.5L7 3.5Z" fill="#fff"/></svg>',
    green: '<svg width="20" height="12" viewBox="0 0 14 9" fill="none"><polygon points="7,1 8.1,3.5 10.8,3.6 8.6,5.2 9.4,7.8 7,6.2 4.6,7.8 5.4,5.2 3.2,3.6 5.9,3.5" fill="#fff"/><path d="M1 4.5H3.2M10.8 4.5H13" stroke="#fff" stroke-width="1.2"/></svg>'
  };

  function boot() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const minimapCanvas = document.getElementById('minimapCanvas');
    const minimapCtx = minimapCanvas.getContext('2d');

    const renderer3d = new FL.Pixel3DRenderer();
    const portraits = renderer3d.bakeAllPortraits();
    const sound = new FL.SoundEngine();
    const effects = new FL.EffectsPool();
    const fog = new FL.FogOfWar(WORLD_WIDTH, WORLD_HEIGHT);
    const sim = new FL.RtsSimulation({ effects, sound, fog });
    const renderer = new FL.GameRenderer(renderer3d);

    // Populate flagship unit cameos on the Title Screen Faction Cards!
    const fillCardPreview = (elId, keys) => {
      const el = document.getElementById(elId);
      if (el) el.innerHTML = keys.map((k) => `<img src="${portraits.units[k]}" alt="${UNIT_SPECS[k].name}" />`).join('');
    };
    fillCardPreview('redCardPreview', ['red_buggy', 'red_flame_tank', 'red_mortar', 'red_orb_disruptor']);
    fillCardPreview('greenCardPreview', ['green_humvee', 'green_missile_truck', 'green_laser_tank', 'green_ion_tank']);

    const cam = { x: 1200, y: 800, zoom: 1.0, vx: 0, vy: 0 };
    const clampCam = () => {
      const vw = canvas.clientWidth || window.innerWidth;
      const vh = canvas.clientHeight || window.innerHeight;
      const halfW = Math.min(WORLD_WIDTH * 0.48, vw / (2 * cam.zoom));
      const halfH = Math.min(WORLD_HEIGHT * 0.48, vh / (2 * cam.zoom));
      cam.x = Math.max(halfW * 0.4, Math.min(WORLD_WIDTH - halfW * 0.4, cam.x));
      cam.y = Math.max(halfH * 0.4, Math.min(WORLD_HEIGHT - halfH * 0.4, cam.y));
    };

    const screenToWorld = (sx, sy) => {
      const vw = canvas.clientWidth || window.innerWidth;
      const vh = canvas.clientHeight || window.innerHeight;
      return {
        x: cam.x + (sx - vw * 0.5) / cam.zoom,
        y: cam.y + (sy - vh * 0.5) / cam.zoom
      };
    };

    const titleScreen = document.getElementById('titleScreen');
    const hudRoot = document.getElementById('hudRoot');
    const statusModal = document.getElementById('statusModal');
    const unitDock = document.getElementById('unitDock');
    const buildDock = document.getElementById('buildDock');
    const unitSectionWrap = unitDock.closest('.dock-section');
    const buildSectionWrap = document.getElementById('buildSectionWrap');
    const selectionBar = document.getElementById('selectionBar');
    const modeBanner = document.getElementById('modeBanner');
    const modeBannerText = document.getElementById('modeBannerText');
    const confirmModeBtn = document.getElementById('confirmModeBtn');
    const alertBanner = document.getElementById('alertBanner');
    const minimapWrap = document.getElementById('minimapWrap');
    const tacRack = document.getElementById('tacRack');

    let selectedFaction = 'red';
    let selectedDiff = 'normal';
    let touchBoxMode = false;
    let mobileDockTab = 'units';
    let lastHoverWorld = { x: 460, y: 1140 };
    const dragBox = { active: false, startX: 0, startY: 0, currX: 0, currY: 0 };
    const longPress = { active: false, x: 0, y: 0, progress: 0 };
    const keys = new Set();

    let unitBtns = {};
    let activeUnitOrder = FACTION_UNITS.red;
    const buildBtns = {};

    function rebuildUnitDock(faction) {
      unitDock.innerHTML = '';
      unitBtns = {};
      activeUnitOrder = FACTION_UNITS[faction];
      for (const kind of activeUnitOrder) {
        const s = UNIT_SPECS[kind];
        const btn = document.createElement('button');
        btn.className = 'cameo-card';
        btn.title = `${s.name} — ${s.role}`;
        const tag = s.requiresTech ? '<span class="cameo-tag tech-req">СВЯЗЬ</span>' : '';
        btn.innerHTML = `
          <div class="cameo-viewport">
            <img class="cameo-img" src="${portraits.units[kind]}" alt="${s.name}" />
            <span class="cameo-hk">${s.hotkey}</span>
            ${tag}
            <span class="cameo-queue"></span>
            <div class="cameo-shutter" style="height:0%"></div>
          </div>
          <div class="cameo-foot">
            <span class="cameo-name">${s.name}</span>
            <span class="cameo-cost">${s.cost}</span>
          </div>
        `;
        btn.addEventListener('click', () => {
          sound.unlock();
          sim.queueUnit(sim.playerFaction, kind);
        });
        unitDock.appendChild(btn);
        unitBtns[kind] = {
          btn,
          shutter: btn.querySelector('.cameo-shutter'),
          queueEl: btn.querySelector('.cameo-queue')
        };
      }
    }

    function rebuildBuildDock(faction) {
      buildDock.innerHTML = '';
      for (const kind of Object.keys(buildBtns)) delete buildBtns[kind];
      for (const kind of BUILD_ORDER) {
        const s = BUILDING_SPECS[kind];
        const btn = document.createElement('button');
        btn.className = 'cameo-card';
        btn.title = `${s.name} — ${s.role}`;
        const pwrCls = s.powerDelta >= 0 ? 'pwr-pos' : '';
        const pwrLabel = s.powerDelta >= 0 ? `+${s.powerDelta}⚡` : `${s.powerDelta}⚡`;
        btn.innerHTML = `
          <div class="cameo-viewport">
            <img class="cameo-img" src="${portraits.buildings[faction][kind]}" alt="${s.name}" />
            <span class="cameo-hk">${s.hotkey}</span>
            <span class="cameo-tag ${pwrCls}">${pwrLabel}</span>
            <div class="cameo-shutter" style="height:0%"></div>
          </div>
          <div class="cameo-foot">
            <span class="cameo-name">${s.name}</span>
            <span class="cameo-cost">${s.cost}</span>
          </div>
        `;
        btn.addEventListener('click', () => {
          sound.unlock();
          sim.activePowerMode = null;
          sim.placementMode = sim.placementMode === kind ? null : kind;
          lastHoverWorld = { x: cam.x, y: cam.y };
          sound.playClick();
        });
        buildDock.appendChild(btn);
        buildBtns[kind] = {
          btn,
          shutter: btn.querySelector('.cameo-shutter')
        };
      }
    }

    function applyFactionTheme(fac) {
      document.body.classList.toggle('fac-red', fac === 'red');
      document.body.classList.toggle('fac-green', fac === 'green');
      const badge = document.getElementById('hudFactionSvg');
      badge.className = `flag-badge ${fac}`;
      badge.innerHTML = EMBLEM_SVG[fac];
      document.getElementById('hudFactionName').textContent = FACTION_INFO[fac].short;
      document.getElementById('modalEmblem').innerHTML = `<span class="flag-badge ${fac}">${EMBLEM_SVG[fac]}</span>`;
    }

    const syncDockTabs = () => {
      document.getElementById('tabUnitsBtn').classList.toggle('active', mobileDockTab === 'units');
      document.getElementById('tabBuildBtn').classList.toggle('active', mobileDockTab === 'build');
      unitSectionWrap.classList.toggle('mobile-hidden', mobileDockTab !== 'units');
      buildSectionWrap.classList.toggle('mobile-hidden', mobileDockTab !== 'build');
    };
    document.getElementById('tabUnitsBtn').addEventListener('click', () => { mobileDockTab = 'units'; syncDockTabs(); });
    document.getElementById('tabBuildBtn').addEventListener('click', () => { mobileDockTab = 'build'; syncDockTabs(); });
    syncDockTabs();

    document.getElementById('tacCollapseBtn').addEventListener('click', (e) => {
      const folded = tacRack.classList.toggle('collapsed');
      e.currentTarget.textContent = folded ? '▸' : '▾';
    });

    titleScreen.classList.remove('hidden');
    applyFactionTheme(selectedFaction);

    document.getElementById('facSelectGroup').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-fac]');
      if (!b) return;
      selectedFaction = b.dataset.fac;
      document.querySelectorAll('#facSelectGroup button').forEach((x) => x.classList.toggle('active', x === b));
      applyFactionTheme(selectedFaction);
    });

    document.getElementById('diffGroup').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-diff]');
      if (!b) return;
      selectedDiff = b.dataset.diff;
      document.querySelectorAll('#diffGroup button').forEach((x) => x.classList.toggle('active', x === b));
    });

    const startGame = () => {
      sound.unlock();
      sound.playBuild();
      dragBox.active = false;
      sim.startNewGame(selectedFaction, selectedDiff);
      applyFactionTheme(sim.playerFaction);
      rebuildUnitDock(sim.playerFaction);
      rebuildBuildDock(sim.playerFaction);
      cam.x = 460; cam.y = 1140;
      cam.zoom = window.innerWidth < 760 ? 0.85 : 1.0;
      cam.vx = 0; cam.vy = 0;
      clampCam();
      titleScreen.classList.add('hidden');
      statusModal.classList.add('hidden');
      hudRoot.classList.remove('hidden');
    };

    document.getElementById('startGameBtn').addEventListener('click', startGame);

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.().catch(() => {});
    };
    document.getElementById('titleFullscreenBtn').addEventListener('click', toggleFullscreen);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    document.getElementById('baseJumpBtn').addEventListener('click', () => {
      const hq = sim.getPlayerHq();
      if (hq) { cam.x = hq.x; cam.y = hq.y; clampCam(); }
    });
    document.getElementById('radarToggleBtn').addEventListener('click', (e) => {
      const open = minimapWrap.classList.toggle('mobile-open');
      e.currentTarget.classList.toggle('active', open);
    });
    document.getElementById('muteBtn').addEventListener('click', (e) => {
      sound.unlock();
      sound.setMuted(!sound.muted);
      e.currentTarget.textContent = sound.muted ? '🔇' : '🔊';
    });
    document.getElementById('pauseBtn').addEventListener('click', () => {
      if (sim.phase === 'playing') sim.phase = 'paused';
      else if (sim.phase === 'paused') sim.phase = 'playing';
    });

    document.querySelectorAll('.cg-btn').forEach((btn) => {
      const slot = Number(btn.dataset.cg);
      let holdTimer = null, savedHold = false;
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        savedHold = false;
        if (e.ctrlKey || e.metaKey) {
          savedHold = true;
          sim.saveControlGroup(slot);
          btn.classList.add('flash');
          setTimeout(() => btn.classList.remove('flash'), 350);
          return;
        }
        holdTimer = setTimeout(() => {
          savedHold = true;
          if (sim.saveControlGroup(slot) > 0) {
            btn.classList.add('flash');
            setTimeout(() => btn.classList.remove('flash'), 350);
            sound.playClick();
          }
        }, 420);
      });
      btn.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        if (!savedHold) {
          const n = sim.selectControlGroup(slot);
          if (n > 0) {
            const c = sim.getControlGroupCentroid(slot);
            if (c) { cam.x = c.x; cam.y = c.y; clampCam(); }
          }
        }
      });
      btn.addEventListener('pointercancel', () => { if (holdTimer) clearTimeout(holdTimer); });
    });

    document.getElementById('boxModeBtn').addEventListener('click', (e) => {
      touchBoxMode = !touchBoxMode;
      e.currentTarget.classList.toggle('active', touchBoxMode);
    });
    document.getElementById('allArmyBtn').addEventListener('click', () => {
      sim.selectAllCombat();
      sound.playClick();
    });
    document.getElementById('attackMoveBtn').addEventListener('click', () => {
      sim.attackMoveMode = !sim.attackMoveMode;
    });
    document.getElementById('holdBtn').addEventListener('click', () => sim.holdSelectedUnits());

    document.getElementById('pwrRadarBtn').addEventListener('click', () => {
      sim.placementMode = null;
      sim.activePowerMode = sim.activePowerMode === 'reconSweep' ? null : 'reconSweep';
      lastHoverWorld = { x: cam.x, y: cam.y };
    });
    document.getElementById('pwrStrikeBtn').addEventListener('click', () => {
      if (!sim.supportPowers.artilleryBarrage.unlocked) { sim.showAlert('Требуется Штаб-связь'); return; }
      sim.placementMode = null;
      sim.activePowerMode = sim.activePowerMode === 'artilleryBarrage' ? null : 'artilleryBarrage';
      lastHoverWorld = { x: cam.x, y: cam.y };
    });

    confirmModeBtn.addEventListener('click', () => {
      if (sim.placementMode) sim.placeBuilding(sim.playerFaction, sim.placementMode, lastHoverWorld.x, lastHoverWorld.y);
      else if (sim.activePowerMode) sim.triggerSupportPower(sim.activePowerMode, lastHoverWorld.x, lastHoverWorld.y);
    });
    document.getElementById('cancelModeBtn').addEventListener('click', () => {
      sim.placementMode = null;
      sim.activePowerMode = null;
    });

    document.getElementById('modalResumeBtn').addEventListener('click', () => {
      if (sim.phase === 'paused') sim.phase = 'playing';
    });
    document.getElementById('modalRestartBtn').addEventListener('click', startGame);
    document.getElementById('modalMenuBtn').addEventListener('click', () => {
      statusModal.classList.add('hidden');
      hudRoot.classList.add('hidden');
      titleScreen.classList.remove('hidden');
      sim.setupDemoBattle();
      cam.x = 1200; cam.y = 800; cam.zoom = 1.0;
    });

    const moveCamToMinimap = (e) => {
      const rect = minimapCanvas.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      cam.x = nx * WORLD_WIDTH;
      cam.y = ny * WORLD_HEIGHT;
      clampCam();
    };
    let minimapDrag = false;
    minimapCanvas.addEventListener('pointerdown', (e) => { e.stopPropagation(); minimapDrag = true; moveCamToMinimap(e); });
    window.addEventListener('pointermove', (e) => { if (minimapDrag) moveCamToMinimap(e); });
    window.addEventListener('pointerup', () => { minimapDrag = false; });

    // Pointer & Multi-Touch Controls
    const activeTouches = new Map();
    let touchState = null;
    let mouseDrag = false;
    let lastClickT = 0, lastClickPos = { x: 0, y: 0 };

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('wheel', (e) => {
      if (sim.phase !== 'playing') return;
      e.preventDefault();
      const before = screenToWorld(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      cam.zoom = Math.max(0.6, Math.min(1.6, cam.zoom * factor));
      const vw = canvas.clientWidth || window.innerWidth;
      const vh = canvas.clientHeight || window.innerHeight;
      cam.x = before.x - (e.clientX - vw * 0.5) / cam.zoom;
      cam.y = before.y - (e.clientY - vh * 0.5) / cam.zoom;
      clampCam();
    }, { passive: false });

    canvas.addEventListener('pointerdown', (e) => {
      if (sim.phase !== 'playing') return;
      sound.unlock();

      if (e.pointerType === 'touch') {
        activeTouches.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });
        if (activeTouches.size === 2) {
          touchState = { mode: 'pinch', pts: Array.from(activeTouches.values()) };
          dragBox.active = false;
          longPress.active = false;
          return;
        }
        touchState = {
          mode: touchBoxMode ? 'box' : 'pending',
          startX: e.clientX, startY: e.clientY,
          lastX: e.clientX, lastY: e.clientY,
          startT: performance.now()
        };
        if (touchBoxMode) {
          dragBox.active = true;
          dragBox.startX = dragBox.currX = e.clientX;
          dragBox.startY = dragBox.currY = e.clientY;
        }
        return;
      }

      const w = screenToWorld(e.clientX, e.clientY);
      lastHoverWorld = w;

      if (e.button === 2) {
        if (sim.placementMode || sim.activePowerMode) {
          sim.placementMode = null; sim.activePowerMode = null;
          return;
        }
        sim.issueCommand(w.x, w.y, sim.attackMoveMode);
        return;
      }

      if (e.button === 0) {
        if (sim.placementMode) {
          sim.placeBuilding(sim.playerFaction, sim.placementMode, w.x, w.y);
          return;
        }
        if (sim.activePowerMode) {
          sim.triggerSupportPower(sim.activePowerMode, w.x, w.y);
          return;
        }
        if (sim.attackMoveMode) {
          sim.issueCommand(w.x, w.y, true);
          return;
        }
        mouseDrag = true;
        dragBox.active = true;
        dragBox.startX = dragBox.currX = e.clientX;
        dragBox.startY = dragBox.currY = e.clientY;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (sim.phase !== 'playing') return;
      if (e.pointerType !== 'touch') {
        lastHoverWorld = screenToWorld(e.clientX, e.clientY);
        if (mouseDrag) { dragBox.currX = e.clientX; dragBox.currY = e.clientY; }
        return;
      }

      if (!activeTouches.has(e.pointerId)) return;
      activeTouches.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

      if (touchState && touchState.mode === 'pinch' && activeTouches.size === 2) {
        const curr = Array.from(activeTouches.values());
        const prev = touchState.pts;
        const d0 = Math.max(10, Math.hypot(prev[1].x - prev[0].x, prev[1].y - prev[0].y));
        const d1 = Math.max(10, Math.hypot(curr[1].x - curr[0].x, curr[1].y - curr[0].y));
        const pmx = (prev[0].x + prev[1].x) * 0.5, pmy = (prev[0].y + prev[1].y) * 0.5;
        const cmx = (curr[0].x + curr[1].x) * 0.5, cmy = (curr[0].y + curr[1].y) * 0.5;
        const vw = canvas.clientWidth || window.innerWidth;
        const vh = canvas.clientHeight || window.innerHeight;
        const anchorX = cam.x + (pmx - vw * 0.5) / cam.zoom;
        const anchorY = cam.y + (pmy - vh * 0.5) / cam.zoom;
        cam.zoom = Math.max(0.6, Math.min(1.6, cam.zoom * (d1 / d0)));
        cam.x = anchorX - (cmx - vw * 0.5) / cam.zoom;
        cam.y = anchorY - (cmy - vh * 0.5) / cam.zoom;
        clampCam();
        touchState.pts = curr;
        return;
      }

      if (!touchState) return;
      const dx = e.clientX - touchState.lastX;
      const dy = e.clientY - touchState.lastY;
      touchState.lastX = e.clientX;
      touchState.lastY = e.clientY;

      if (touchState.mode === 'box') {
        dragBox.currX = e.clientX; dragBox.currY = e.clientY;
        return;
      }

      const moved = Math.hypot(e.clientX - touchState.startX, e.clientY - touchState.startY);
      if (touchState.mode === 'pending' && moved > 14) {
        touchState.mode = 'pan';
        longPress.active = false;
      }

      if (touchState.mode === 'pan') {
        cam.x -= dx / cam.zoom;
        cam.y -= dy / cam.zoom;
        cam.vx = (-dx / cam.zoom) * 35;
        cam.vy = (-dy / cam.zoom) * 35;
        clampCam();
      }
    });

    const endPointer = (e) => {
      if (e.pointerType !== 'touch') {
        if (!mouseDrag) return;
        mouseDrag = false;
        dragBox.active = false;
        const w0 = screenToWorld(dragBox.startX, dragBox.startY);
        const w1 = screenToWorld(e.clientX, e.clientY);
        const now = performance.now();
        if (Math.hypot(e.clientX - dragBox.startX, e.clientY - dragBox.startY) < 10 &&
            now - lastClickT < 340 && Math.hypot(e.clientX - lastClickPos.x, e.clientY - lastClickPos.y) < 20) {
          const hit = sim.units.find((u) => u.faction === sim.playerFaction && u.koTimer <= 0 && Math.hypot(u.x - w1.x, u.y - w1.y) <= UNIT_SPECS[u.kind].radius + 12);
          if (hit) sim.selectUnitsOfType(hit.kind);
        } else {
          sim.selectInBox(w0.x, w0.y, w1.x, w1.y, e.shiftKey, 10);
        }
        lastClickT = now;
        lastClickPos = { x: e.clientX, y: e.clientY };
        return;
      }

      activeTouches.delete(e.pointerId);
      if (!touchState) return;
      longPress.active = false;

      if (touchState.mode === 'box') {
        dragBox.active = false;
        const w0 = screenToWorld(dragBox.startX, dragBox.startY);
        const w1 = screenToWorld(e.clientX, e.clientY);
        sim.selectInBox(w0.x, w0.y, w1.x, w1.y, false, 14);
        if (touchBoxMode) {
          touchBoxMode = false;
          document.getElementById('boxModeBtn').classList.remove('active');
        }
      } else if (touchState.mode === 'pending') {
        const w = screenToWorld(e.clientX, e.clientY);
        lastHoverWorld = w;
        if (sim.placementMode) {
          const check = sim.canPlaceBuilding(sim.playerFaction, sim.placementMode, w.x, w.y);
          if (check.ok) sim.placeBuilding(sim.playerFaction, sim.placementMode, w.x, w.y);
          else if (check.reason) sim.showAlert(check.reason);
        } else if (sim.activePowerMode) {
          sim.triggerSupportPower(sim.activePowerMode, w.x, w.y);
        } else {
          const pf = sim.playerFaction;
          const hitFriendly =
            sim.units.some((u) => u.faction === pf && u.koTimer <= 0 && Math.hypot(u.x - w.x, u.y - w.y) <= UNIT_SPECS[u.kind].radius + 16) ||
            sim.buildings.some((b) => b.faction === pf && b.koTimer <= 0 && Math.hypot(b.x - w.x, b.y - w.y) <= BUILDING_SPECS[b.kind].radius + 14);
          const hasSel = sim.units.some((u) => u.selected) || sim.buildings.some((b) => b.selected && BUILDING_SPECS[b.kind].produces.length > 0);
          if (sim.attackMoveMode || (!hitFriendly && hasSel)) {
            sim.issueCommand(w.x, w.y, sim.attackMoveMode);
          } else {
            sim.selectInBox(w.x, w.y, w.x, w.y, false, 16);
          }
        }
      }
      touchState = activeTouches.size === 1 ? { mode: 'pan', lastX: Array.from(activeTouches.values())[0].x, lastY: Array.from(activeTouches.values())[0].y } : null;
    };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);

    window.addEventListener('keydown', (e) => {
      if (sim.phase === 'title' && e.key === 'Enter') { startGame(); return; }
      if (sim.phase !== 'playing' && sim.phase !== 'paused') return;
      const k = e.key.toLowerCase();
      keys.add(k);

      if (k === 'p') {
        sim.phase = sim.phase === 'playing' ? 'paused' : 'playing';
      } else if (k === 'escape') {
        sim.placementMode = null; sim.activePowerMode = null; sim.attackMoveMode = false;
      } else if (k === 'f') {
        sim.attackMoveMode = !sim.attackMoveMode;
      } else if (k === 'h') {
        sim.holdSelectedUnits();
      } else if (k === 't') {
        sim.activePowerMode = sim.activePowerMode === 'reconSweep' ? null : 'reconSweep';
      } else if (k === 'g') {
        if (sim.supportPowers.artilleryBarrage.unlocked) {
          sim.activePowerMode = sim.activePowerMode === 'artilleryBarrage' ? null : 'artilleryBarrage';
        }
      } else if (k === 'home') {
        const hq = sim.getPlayerHq();
        if (hq) { cam.x = hq.x; cam.y = hq.y; clampCam(); }
      } else if (['1', '2', '3'].includes(k)) {
        const slot = Number(k);
        if (e.ctrlKey) sim.saveControlGroup(slot);
        else sim.selectControlGroup(slot);
      } else {
        for (const uk of activeUnitOrder) {
          if (UNIT_SPECS[uk].hotkey.toLowerCase() === k) sim.queueUnit(sim.playerFaction, uk);
        }
        for (const bk of BUILD_ORDER) {
          if (BUILDING_SPECS[bk].hotkey.toLowerCase() === k) {
            sim.activePowerMode = null;
            sim.placementMode = sim.placementMode === bk ? null : bk;
          }
        }
      }
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

    const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    let hudTick = 0;

    function syncHud() {
      const pf = sim.playerFaction;
      const ef = sim.enemyFaction;
      const pe = sim.economies[pf];

      document.getElementById('hudSupply').textContent = Math.floor(pe.supplies);
      document.getElementById('hudPower').textContent = `${pe.powerProduced}/${pe.powerConsumed}`;
      const pwrRatio = pe.powerProduced <= 0 ? 0 : Math.min(1, pe.powerProduced / Math.max(1, pe.powerConsumed));
      document.getElementById('pwrFillBar').style.width = `${Math.round(pwrRatio * 100)}%`;
      document.getElementById('hudPowerPill').classList.toggle('low-power', pe.powerConsumed > pe.powerProduced);

      const ownedOutposts = sim.capturePoints.filter((c) => c.owner === pf).length;
      document.getElementById('hudOutposts').textContent = `${ownedOutposts}/${sim.capturePoints.length}`;
      const pUnits = sim.units.filter((u) => u.faction === pf && u.koTimer <= 0).length;
      document.getElementById('hudUnits').textContent = pUnits;
      document.getElementById('hudTime').textContent = fmtTime(sim.elapsedTime);

      const eCount = sim.units.filter((u) => u.faction === ef && u.koTimer <= 0).length +
        sim.buildings.filter((b) => b.faction === ef && b.koTimer <= 0).length;
      document.getElementById('minimapEnemyCount').textContent = `Враг (${FACTION_INFO[ef].short}): ${eCount}`;

      if (sim.alertText) {
        alertBanner.textContent = sim.alertText;
        alertBanner.classList.remove('hidden');
      } else {
        alertBanner.classList.add('hidden');
      }

      if (sim.placementMode) {
        modeBannerText.textContent = `Постройка: ${BUILDING_SPECS[sim.placementMode].name}`;
        confirmModeBtn.textContent = 'Поставить';
        modeBanner.classList.remove('hidden');
      } else if (sim.activePowerMode) {
        modeBannerText.textContent = sim.activePowerMode === 'reconSweep' ? 'Авиа-разведка: цель' : 'Артудар: цель';
        confirmModeBtn.textContent = 'Запуск';
        modeBanner.classList.remove('hidden');
      } else {
        modeBanner.classList.add('hidden');
      }

      document.getElementById('attackMoveBtn').classList.toggle('active', sim.attackMoveMode);

      for (const slot of [1, 2, 3]) {
        const cnt = sim.units.filter((u) => u.faction === pf && u.koTimer <= 0 && u.controlGroup === slot).length;
        document.getElementById(`cgCount${slot}`).textContent = cnt;
      }

      const rs = sim.supportPowers.reconSweep;
      document.getElementById('pwrRadarCd').textContent = rs.ready ? 'Готов' : `${Math.ceil(rs.cooldown)}с`;
      document.getElementById('pwrRadarBtn').classList.toggle('active', sim.activePowerMode === 'reconSweep');

      const as = sim.supportPowers.artilleryBarrage;
      document.getElementById('pwrStrikeCd').textContent = !as.unlocked ? 'Связь' : as.ready ? 'Готов' : `${Math.ceil(as.cooldown)}с`;
      document.getElementById('pwrStrikeBtn').classList.toggle('active', sim.activePowerMode === 'artilleryBarrage');

      const hasHq = sim.buildings.some((b) => b.faction === pf && b.kind === 'hq' && b.koTimer <= 0);
      const hasFac = sim.buildings.some((b) => b.faction === pf && b.kind === 'motorpool' && b.koTimer <= 0 && b.buildProgress >= 1);
      const hasTech = sim.hasTech(pf, 'command');

      let anyUnitBusy = false;
      for (const kind of activeUnitOrder) {
        const s = UNIT_SPECS[kind];
        const entry = unitBtns[kind];
        if (!entry) continue;
        const { btn, shutter, queueEl } = entry;
        const prodOk = s.requiresBuilding === 'hq' ? hasHq : hasFac;
        const techOk = !s.requiresTech || hasTech;
        btn.disabled = !prodOk || !techOk || pe.supplies < s.cost;
        btn.classList.toggle('locked', !prodOk || !techOk);

        let qCount = 0;
        let firstItem = null;
        for (const b of sim.buildings) {
          if (b.faction !== pf || b.kind !== s.requiresBuilding) continue;
          for (const qi of b.queue) {
            if (qi.kind === kind) { qCount++; if (!firstItem && b.queue[0] === qi) firstItem = qi; }
          }
        }
        if (qCount > 0) anyUnitBusy = true;
        queueEl.textContent = qCount > 1 ? `×${qCount}` : qCount === 1 ? '1' : '';
        queueEl.classList.toggle('on', qCount > 0);
        btn.classList.toggle('active', !!firstItem);
        shutter.style.height = firstItem ? `${Math.round((1 - firstItem.remaining / firstItem.total) * 100)}%` : '0%';
      }
      document.getElementById('tabUnitsDot').classList.toggle('busy', anyUnitBusy);

      let anyBldBusy = false;
      for (const kind of BUILD_ORDER) {
        const s = BUILDING_SPECS[kind];
        const entry = buildBtns[kind];
        if (!entry) continue;
        const { btn, shutter } = entry;
        const techOk = !s.requiresTech || hasTech;
        btn.disabled = !hasHq || !techOk || pe.supplies < s.cost;
        btn.classList.toggle('locked', !techOk);
        const constructing = sim.buildings.find((b) => b.faction === pf && b.kind === kind && b.buildProgress < 1 && b.koTimer <= 0);
        if (constructing) anyBldBusy = true;
        btn.classList.toggle('active', sim.placementMode === kind || !!constructing);
        shutter.style.height = constructing ? `${Math.round(constructing.buildProgress * 100)}%` : '0%';
      }
      document.getElementById('tabBuildDot').classList.toggle('busy', !!sim.placementMode || anyBldBusy);

      const selUnits = sim.units.filter((u) => u.faction === pf && u.selected && u.koTimer <= 0);
      const selBld = sim.buildings.find((b) => b.faction === pf && b.selected && b.koTimer <= 0);
      if (selUnits.length > 0) {
        const counts = {};
        for (const u of selUnits) counts[u.kind] = (counts[u.kind] || 0) + 1;
        const summary = Object.entries(counts).map(([k, c]) => `${UNIT_SPECS[k].name}:${c}`).join(' · ');
        selectionBar.innerHTML = `<span>ОТРЯД (${selUnits.length}): ${summary}</span><button class="mech-btn small" id="clearSelBtn">Сброс</button>`;
        selectionBar.classList.remove('hidden');
        document.getElementById('clearSelBtn').onclick = () => { for (const u of sim.units) u.selected = false; };
      } else if (selBld) {
        const bs = BUILDING_SPECS[selBld.kind];
        const hpTxt = `${Math.ceil(selBld.hp)}/${selBld.maxHp}`;
        let html = `<span>${bs.name} · ${hpTxt} HP</span>`;
        if (selBld.hp < selBld.maxHp) {
          html += `<button class="mech-btn small ${selBld.repairing ? 'active' : ''}" id="repBldBtn">Ремонт</button>`;
        }
        if (bs.produces.length > 0) {
          html += `<button class="mech-btn small ${selBld.repeatQueue ? 'active' : ''}" id="repQBtn">Повтор</button>`;
        }
        if (bs.canSell) {
          html += `<button class="mech-btn small" id="sellBldBtn">Снос (+${Math.round(bs.cost * 0.5)})</button>`;
        }
        selectionBar.innerHTML = html;
        selectionBar.classList.remove('hidden');
        const rb = document.getElementById('repBldBtn'); if (rb) rb.onclick = () => sim.toggleRepairBuilding();
        const rq = document.getElementById('repQBtn'); if (rq) rq.onclick = () => sim.toggleRepeatBuilding();
        const sb = document.getElementById('sellBldBtn'); if (sb) sb.onclick = () => sim.sellSelectedBuilding();
      } else {
        selectionBar.classList.add('hidden');
      }

      if (sim.phase === 'paused' || sim.phase === 'gameover') {
        const isOver = sim.phase === 'gameover';
        const won = sim.outcome === 'victory';
        document.getElementById('modalBadge').textContent = isOver ? (won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ') : 'ПАУЗА';
        document.getElementById('modalTitle').textContent = isOver ? (won ? `${FACTION_INFO[ef].name.toUpperCase()} РАЗГРОМЛЕН` : 'ШТАБ УНИЧТОЖЕН') : 'ШТАБ НА ПАУЗЕ';
        document.getElementById('modalSubtitle').textContent = isOver
          ? `Фракция: ${FACTION_INFO[pf].name} · Время: ${fmtTime(sim.elapsedTime)}`
          : 'Командование ожидает дальнейших приказов.';
        document.getElementById('modalResumeBtn').classList.toggle('hidden', isOver);
        document.getElementById('modalStats').innerHTML = `
          <div class="stat-box"><small>Собрано припасов</small><strong>${Math.round(pe.harvested)}</strong></div>
          <div class="stat-box"><small>Построено техники</small><strong>${pe.built}</strong></div>
          <div class="stat-box"><small>Уничтожено врагов</small><strong>${pe.kills}</strong></div>
          <div class="stat-box"><small>Потери</small><strong>${pe.lost}</strong></div>
        `;
        statusModal.classList.remove('hidden');
      } else {
        statusModal.classList.add('hidden');
      }
    }

    let lastNow = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = canvas.clientWidth || window.innerWidth;
      const vh = canvas.clientHeight || window.innerHeight;
      const cw = Math.max(1, Math.round(vw * dpr));
      const ch = Math.max(1, Math.round(vh * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      if (sim.phase === 'playing') {
        const panSpd = 650 / cam.zoom;
        if (keys.has('w') || keys.has('arrowup')) cam.y -= panSpd * dt;
        if (keys.has('s') || keys.has('arrowdown')) cam.y += panSpd * dt;
        if (keys.has('a') || keys.has('arrowleft')) cam.x -= panSpd * dt;
        if (keys.has('d') || keys.has('arrowright')) cam.x += panSpd * dt;

        if (!touchState && (Math.abs(cam.vx) > 6 || Math.abs(cam.vy) > 6)) {
          cam.x += cam.vx * dt;
          cam.y += cam.vy * dt;
          const damp = Math.exp(-7.5 * dt);
          cam.vx *= damp; cam.vy *= damp;
        } else if (!touchState) {
          cam.vx = 0; cam.vy = 0;
        }
        clampCam();

        if (touchState && touchState.mode === 'pending') {
          const held = now - touchState.startT;
          if (held >= 230) {
            touchState.mode = 'box';
            longPress.active = false;
            dragBox.active = true;
            dragBox.startX = touchState.startX;
            dragBox.startY = touchState.startY;
            dragBox.currX = touchState.lastX;
            dragBox.currY = touchState.lastY;
          } else if (held >= 75) {
            longPress.active = true;
            longPress.x = touchState.lastX;
            longPress.y = touchState.lastY;
            longPress.progress = (held - 75) / 155;
          }
        }
      } else if (sim.phase === 'title') {
        cam.x = 1200 + Math.sin(sim.elapsedTime * 0.14) * 140;
        cam.y = 800 + Math.cos(sim.elapsedTime * 0.11) * 75;
      }

      sim.step(dt);

      ctx.save();
      ctx.scale(dpr, dpr);
      renderer.renderWorld(
        ctx, vw, vh, sim, effects, cam,
        dragBox, sim.phase === 'playing' ? lastHoverWorld : null,
        longPress
      );
      ctx.restore();

      hudTick += dt;
      if (hudTick >= 0.09) {
        hudTick = 0;
        if (sim.phase === 'playing' || sim.phase === 'paused' || sim.phase === 'gameover') {
          syncHud();
          renderer.renderMinimap(minimapCtx, minimapCanvas.width, minimapCanvas.height, sim, cam, vw, vh);
        }
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  boot();
})();
