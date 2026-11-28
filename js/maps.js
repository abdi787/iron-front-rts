((root, factory) => {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.FRONTLINE = root.FRONTLINE || {};
    root.FRONTLINE.MAPS = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';

  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = 'iron_front_custom_maps_v1';
  const DRAFT_KEY = 'iron_front_editor_draft_v1';

  const MIN_WORLD_W = 1200;
  const MAX_WORLD_W = 4800;
  const MIN_WORLD_H = 1000;
  const MAX_WORLD_H = 3600;
  const BLD_Y_SCALE = 0.72;
  const DEFAULT_CAPTURE_RADIUS = 74;
  const DEFAULT_CAPTURE_RATE = 10;

  const BIOMES = {
    steppe: {
      id: 'steppe',
      name: 'Степной фронт',
      short: 'СТЕПЬ',
      desc: 'Классическая глинисто-степная полоса и просёлочные трассы.',
      swatch: 'linear-gradient(135deg, #95724E 0%, #896644 55%, #5F663D 100%)',
      rockTint: [1.0, 1.0, 1.0],
      terrain: {
        base: '#896644',
        hi: '#95724E',
        lo: '#7A593A',
        speckDark: '#6D4F33',
        speckLight: '#A37F58',
        flora1: '#5F663D',
        flora2: '#747C4B',
        roadOuter: '#735335',
        roadInner: '#7D5B3B',
        padBorder: '#6B4E34',
        padA: '#736C60',
        padB: '#6B6458',
        padTop: '#857E70',
        padStripe: '#D4A942',
        border: '#3B2C1F',
        voidBg: '#231C16'
      },
      minimap: {
        bg: '#4A3A29',
        grid: 'rgba(212, 169, 66, 0.08)',
        road: '#5C452F',
        pad: '#696256',
        rock: '#2E2217'
      }
    },
    desert: {
      id: 'desert',
      name: 'Выжженные дюны',
      short: 'ПУСТЫНЯ',
      desc: 'Охристые барханы, песчаник и выгоревшие караванные пути.',
      swatch: 'linear-gradient(135deg, #CFA972 0%, #B38B56 60%, #8B653B 100%)',
      rockTint: [1.14, 0.96, 0.80],
      terrain: {
        base: '#B38B56',
        hi: '#C59E67',
        lo: '#9F7845',
        speckDark: '#8B6539',
        speckLight: '#D5B27E',
        flora1: '#8D7C46',
        flora2: '#A39256',
        roadOuter: '#8E6A3D',
        roadInner: '#9D7747',
        padBorder: '#7D5C36',
        padA: '#8B8170',
        padB: '#807666',
        padTop: '#9E9482',
        padStripe: '#E5B23A',
        border: '#4D3721',
        voidBg: '#261D14'
      },
      minimap: {
        bg: '#644E31',
        grid: 'rgba(245, 203, 82, 0.09)',
        road: '#785A35',
        pad: '#7D7465',
        rock: '#3D2B1B'
      }
    },
    tundra: {
      id: 'tundra',
      name: 'Ледяной рубеж',
      short: 'ТУНДРА',
      desc: 'Снежные насты, мерзлота, редкий ельник и расчищенные тракты.',
      swatch: 'linear-gradient(135deg, #C7D4DC 0%, #98A7B0 55%, #5C6A73 100%)',
      rockTint: [0.80, 0.92, 1.06],
      terrain: {
        base: '#97A5AE',
        hi: '#B1BFC7',
        lo: '#81909A',
        speckDark: '#6C7A84',
        speckLight: '#C8D5DC',
        flora1: '#435847',
        flora2: '#556E59',
        roadOuter: '#6A655D',
        roadInner: '#7B766E',
        padBorder: '#58646C',
        padA: '#70777C',
        padB: '#666D73',
        padTop: '#879096',
        padStripe: '#E2B33E',
        border: '#2E3840',
        voidBg: '#161C21'
      },
      minimap: {
        bg: '#4A5760',
        grid: 'rgba(186, 230, 253, 0.10)',
        road: '#5C5852',
        pad: '#6A7177',
        rock: '#242D34'
      }
    },
    ashland: {
      id: 'ashland',
      name: 'Пепельная промзона',
      short: 'ПЕПЕЛ',
      desc: 'Шлаковые пустоши, угольная гарь, базальт и бетонные плацы.',
      swatch: 'linear-gradient(135deg, #645B56 0%, #4A4441 55%, #2D2928 100%)',
      rockTint: [0.64, 0.63, 0.67],
      terrain: {
        base: '#4E4844',
        hi: '#5D5550',
        lo: '#403B38',
        speckDark: '#312D2B',
        speckLight: '#6B625C',
        flora1: '#6D4935',
        flora2: '#82573E',
        roadOuter: '#3B3939',
        roadInner: '#474545',
        padBorder: '#302C2A',
        padA: '#5D5B58',
        padB: '#53514F',
        padTop: '#72706C',
        padStripe: '#E2A72E',
        border: '#1F1C1B',
        voidBg: '#141211'
      },
      minimap: {
        bg: '#2E2A28',
        grid: 'rgba(235, 184, 58, 0.08)',
        road: '#3D3B3B',
        pad: '#565451',
        rock: '#181615'
      }
    },
    marsh: {
      id: 'marsh',
      name: 'Болотный плацдарм',
      short: 'БОЛОТО',
      desc: 'Сырой торфяник, мшистые гряды и настилы через топи.',
      swatch: 'linear-gradient(135deg, #748455 0%, #5B6845 55%, #3C4830 100%)',
      rockTint: [0.82, 0.91, 0.76],
      terrain: {
        base: '#5D6847',
        hi: '#6D7953',
        lo: '#4D573B',
        speckDark: '#3E4730',
        speckLight: '#7A875E',
        flora1: '#3C5231',
        flora2: '#4E693F',
        roadOuter: '#5D4C38',
        roadInner: '#6D5942',
        padBorder: '#434C34',
        padA: '#686A5F',
        padB: '#5E6056',
        padTop: '#7B7E72',
        padStripe: '#D9AE43',
        border: '#242B1C',
        voidBg: '#151A12'
      },
      minimap: {
        bg: '#343D28',
        grid: 'rgba(163, 230, 53, 0.08)',
        road: '#4F4231',
        pad: '#5D5F55',
        rock: '#1E2417'
      }
    }
  };

  const BIOME_ORDER = ['steppe', 'desert', 'tundra', 'ashland', 'marsh'];

  const SUPPLY_PATTERNS = {
    standard: [[0, 0], [46, -18], [-44, 20], [34, 38], [-38, -32], [82, 16], [-78, -6]],
    line: [[-90, 0], [-45, 0], [0, 0], [45, 0], [90, 0], [-22, 38], [22, 38]],
    ring: [[0, 0], [48, 0], [-48, 0], [24, 40], [-24, 40], [24, -40], [-24, -40]]
  };

  const SIZE_PRESETS = [
    { id: 'small', label: 'Малая (2000×1400)', w: 2000, h: 1400 },
    { id: 'standard', label: 'Стандарт (2400×1600)', w: 2400, h: 1600 },
    { id: 'large', label: 'Большая (2800×1800)', w: 2800, h: 1800 },
    { id: 'huge', label: 'Огромная (3200×2000)', w: 3200, h: 2000 }
  ];

  const builtinCatalog = [];
  let manifestLoaded = false;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  const int = (v, fallback) => Math.round(num(v, fallback));
  const normDir = (d, fallback = 0) => (((int(d, fallback) % 4) + 4) % 4);

  function slugify(str) {
    const base = String(str || '')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё_-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return base || `map-${Date.now().toString(36)}`;
  }

  function getBiome(id) {
    return BIOMES[id] || BIOMES.steppe;
  }

  function defaultFacingToward(x, y, cx, cy) {
    const ang = Math.atan2(cy - y, cx - x);
    return normDir(Math.round(ang / (Math.PI * 0.5)), 0);
  }

  function mirrorPoint(x, y, w, h, symmetry) {
    if (symmetry === 'point') return { x: Math.round(w - x), y: Math.round(h - y) };
    if (symmetry === 'x') return { x: Math.round(w - x), y: Math.round(y) };
    if (symmetry === 'y') return { x: Math.round(x), y: Math.round(h - y) };
    return null;
  }

  function mirrorFacing(dir, symmetry) {
    const d = normDir(dir, 0);
    if (symmetry === 'point') return (d + 2) % 4;
    if (symmetry === 'x') return d === 0 ? 2 : d === 2 ? 0 : d;
    if (symmetry === 'y') return d === 1 ? 3 : d === 3 ? 1 : d;
    return d;
  }

  function isOnSymmetryFixedPoint(x, y, w, h, symmetry, tol = 26) {
    if (symmetry === 'point') return Math.hypot(x - w * 0.5, y - h * 0.5) <= tol;
    if (symmetry === 'x') return Math.abs(x - w * 0.5) <= tol;
    if (symmetry === 'y') return Math.abs(y - h * 0.5) <= tol;
    return false;
  }

  function getHqRect(x, y) {
    const hw = 45;
    const hh = 45 * BLD_Y_SCALE;
    return { x, y, hw, hh, padHw: hw + 12, padHh: hh + 9 };
  }

  function getPropRect(x, y, radius, padX = 5, padY = 4) {
    return { x, y, hw: radius, hh: radius * BLD_Y_SCALE, padHw: radius + padX, padHh: radius * BLD_Y_SCALE + padY };
  }

  function rectsOverlap(a, b) {
    return Math.abs(a.x - b.x) < a.padHw + b.padHw && Math.abs(a.y - b.y) < a.padHh + b.padHh;
  }

  function cloneJson(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizePad(p, fallbackX, fallbackY) {
    if (p === false || p === null) return null;
    if (p === true || p === undefined) {
      return { x: int(fallbackX, 420), y: int(fallbackY, 1220), w: 368, h: 268 };
    }
    return {
      x: int(p.x, fallbackX),
      y: int(p.y, fallbackY),
      w: clamp(int(p.w, 368), 96, 800),
      h: clamp(int(p.h, 268), 96, 800)
    };
  }

  function normalizeMap(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const sizeSrc = src.size && typeof src.size === 'object' ? src.size : {};
    const w = int(sizeSrc.w ?? src.width, 2400);
    const h = int(sizeSrc.h ?? src.height, 1600);
    const biome = typeof src.biome === 'string' ? src.biome : 'steppe';
    const symmetry = ['none', 'point', 'x', 'y'].includes(src.symmetry) ? src.symmetry : 'none';
    const autoMirror = Boolean(src.autoMirror && symmetry !== 'none');

    const spawns = Array.isArray(src.spawns)
      ? src.spawns.map((sp, i) => {
          const sx = int(sp.x, i === 0 ? 360 : w - 360);
          const sy = int(sp.y, i === 0 ? h - 360 : 360);
          const facing = sp.facing !== undefined && sp.facing !== null
            ? normDir(sp.facing, 0)
            : defaultFacingToward(sx, sy, w * 0.5, h * 0.5);
          const pad = sp.pad === false ? false : (sp.pad === true || sp.pad === undefined ? true : normalizePad(sp.pad, sx, sy));
          return {
            slot: sp.slot === 'enemy' ? 'enemy' : 'player',
            x: sx,
            y: sy,
            facing,
            pad
          };
        })
      : [];

    const pads = Array.isArray(src.pads)
      ? src.pads.map((p) => normalizePad(p, w * 0.5, h * 0.5)).filter(Boolean)
      : [];

    const roads = Array.isArray(src.roads)
      ? src.roads
          .map((r) => {
            const pts = Array.isArray(r.points)
              ? r.points
                  .map((pt) => (Array.isArray(pt) ? [int(pt[0], 0), int(pt[1], 0)] : [int(pt.x, 0), int(pt.y, 0)]))
                  .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1]))
              : [];
            return {
              width: clamp(int(r.width, 60), 20, 140),
              smooth: r.smooth !== false,
              points: pts
            };
          })
          .filter((r) => r.points.length >= 2)
      : [];

    const supplyClusters = Array.isArray(src.supplyClusters)
      ? src.supplyClusters.map((c) => ({
          x: int(c.x, w * 0.5),
          y: int(c.y, h * 0.5),
          count: clamp(int(c.count, 5), 1, 7),
          amount: clamp(int(c.amount, 850), 100, 5000),
          pattern: SUPPLY_PATTERNS[c.pattern] ? c.pattern : 'standard'
        }))
      : [];

    const supplyNodes = Array.isArray(src.supplyNodes)
      ? src.supplyNodes.map((n, i) => ({
          x: int(n.x, w * 0.5),
          y: int(n.y, h * 0.5),
          amount: clamp(int(n.amount, 850), 100, 5000),
          variant: normDir(n.variant, i) % 2
        }))
      : [];

    const capturePoints = Array.isArray(src.capturePoints)
      ? src.capturePoints.map((cp) => ({
          x: int(cp.x, w * 0.5),
          y: int(cp.y, h * 0.5),
          radius: clamp(int(cp.radius, DEFAULT_CAPTURE_RADIUS), 48, 120),
          rate: clamp(num(cp.rate, DEFAULT_CAPTURE_RATE), 2, 40),
          initialOwner: cp.initialOwner === 'player' || cp.initialOwner === 'enemy' ? cp.initialOwner : null
        }))
      : [];

    const obstacles = Array.isArray(src.obstacles)
      ? src.obstacles.map((o, i) => ({
          kind: o.kind === 'rock' ? 'rock' : 'rock',
          x: int(o.x, w * 0.5),
          y: int(o.y, h * 0.5),
          radius: clamp(int(o.radius, 28), 16, 64),
          variant: (((int(o.variant, i % 3) % 3) + 3) % 3)
        }))
      : [];

    const out = {
      schemaVersion: SCHEMA_VERSION,
      id: String(src.id || slugify(src.name || 'custom-map')),
      code: String(src.code || 'СЕК-00').slice(0, 16),
      name: String(src.name || 'Новая карта').slice(0, 64),
      author: String(src.author || 'Командир').slice(0, 40),
      description: String(src.description || '').slice(0, 220),
      size: { w, h },
      biome,
      seed: int(src.seed, 1001),
      symmetry,
      autoMirror,
      spawns,
      pads,
      roads,
      supplyClusters,
      supplyNodes,
      capturePoints,
      obstacles
    };

    if (src.rules && typeof src.rules === 'object') {
      out.rules = cloneJson(src.rules);
    }
    if (src.demo && typeof src.demo === 'object') {
      out.demo = cloneJson(src.demo);
    }
    if (src._source) out._source = src._source;
    return out;
  }

  function expandMap(raw) {
    const base = normalizeMap(raw);
    const { w, h } = base.size;
    const sym = base.autoMirror ? base.symmetry : 'none';

    const spawns = base.spawns.map((s) => ({ ...s, pad: s.pad && typeof s.pad === 'object' ? { ...s.pad } : s.pad }));
    if (sym !== 'none') {
      const pSpawn = spawns.find((s) => s.slot === 'player');
      const hasEnemy = spawns.some((s) => s.slot === 'enemy');
      if (pSpawn && !hasEnemy) {
        const mp = mirrorPoint(pSpawn.x, pSpawn.y, w, h, sym);
        let mPad = pSpawn.pad;
        if (mPad && typeof mPad === 'object') {
          const mpPad = mirrorPoint(mPad.x, mPad.y, w, h, sym);
          mPad = { x: mpPad.x, y: mpPad.y, w: mPad.w, h: mPad.h };
        }
        spawns.push({
          slot: 'enemy',
          x: mp.x,
          y: mp.y,
          facing: mirrorFacing(pSpawn.facing, sym),
          pad: mPad
        });
      }
    }

    const mirrorArray = (items, cloneFn) => {
      const result = items.map((item) => ({ ...item }));
      if (sym === 'none') return result;
      for (const item of items) {
        if (isOnSymmetryFixedPoint(item.x, item.y, w, h, sym)) continue;
        const mp = mirrorPoint(item.x, item.y, w, h, sym);
        if (!mp) continue;
        result.push(cloneFn(item, mp));
      }
      return result;
    };

    const pads = mirrorArray(base.pads, (p, mp) => ({ ...p, x: mp.x, y: mp.y }));
    const supplyClusters = mirrorArray(base.supplyClusters, (c, mp) => ({ ...c, x: mp.x, y: mp.y }));
    const rawSupplyNodes = mirrorArray(base.supplyNodes, (n, mp) => ({ ...n, x: mp.x, y: mp.y }));
    const capturePoints = mirrorArray(base.capturePoints, (cp, mp) => ({
      ...cp,
      x: mp.x,
      y: mp.y,
      initialOwner: cp.initialOwner === 'player' ? 'enemy' : cp.initialOwner === 'enemy' ? 'player' : null
    }));
    const obstacles = mirrorArray(base.obstacles, (o, mp) => ({ ...o, x: mp.x, y: mp.y }));

    const roads = base.roads.map((r) => ({ ...r, points: r.points.map((p) => [p[0], p[1]]) }));
    if (sym !== 'none') {
      for (const r of base.roads) {
        const mPts = r.points.map(([px, py]) => {
          const mp = mirrorPoint(px, py, w, h, sym);
          return [mp.x, mp.y];
        });
        const sameForward = r.points.every((pt, idx) => Math.hypot(pt[0] - mPts[idx][0], pt[1] - mPts[idx][1]) < 24);
        const sameReverse = r.points.every((pt, idx) => {
          const rp = mPts[mPts.length - 1 - idx];
          return Math.hypot(pt[0] - rp[0], pt[1] - rp[1]) < 24;
        });
        if (!sameForward && !sameReverse) {
          roads.push({ ...r, points: mPts });
        }
      }
    }

    // Expand supplyClusters + explicit supplyNodes into flat nodes
    const expandedSupplyNodes = [];
    for (const c of supplyClusters) {
      const offs = SUPPLY_PATTERNS[c.pattern] || SUPPLY_PATTERNS.standard;
      const n = Math.min(c.count, offs.length);
      for (let i = 0; i < n; i++) {
        expandedSupplyNodes.push({
          x: Math.round(c.x + offs[i][0]),
          y: Math.round(c.y + offs[i][1]),
          amount: c.amount,
          maxAmount: c.amount,
          variant: i % 2,
          radius: 19
        });
      }
    }
    for (const n of rawSupplyNodes) {
      expandedSupplyNodes.push({
        x: Math.round(n.x),
        y: Math.round(n.y),
        amount: n.amount,
        maxAmount: n.amount,
        variant: n.variant % 2,
        radius: 19
      });
    }

    // Expand spawn concrete pads + standalone pads
    const expandedPads = [];
    for (const sp of spawns) {
      if (sp.pad === false) continue;
      if (sp.pad && typeof sp.pad === 'object') {
        expandedPads.push({ ...sp.pad });
      } else {
        expandedPads.push({ x: sp.x, y: sp.y, w: 368, h: 268 });
      }
    }
    for (const p of pads) {
      expandedPads.push({ ...p });
    }

    return {
      ...base,
      spawns,
      pads,
      roads,
      supplyClusters,
      supplyNodes: rawSupplyNodes,
      capturePoints,
      obstacles,
      expandedSupplyNodes,
      expandedPads,
      biomeSpec: getBiome(base.biome)
    };
  }

  function applySymmetryBake(raw, symmetry) {
    const map = normalizeMap(raw);
    const sym = ['point', 'x', 'y'].includes(symmetry) ? symmetry : map.symmetry;
    if (!sym || sym === 'none') return map;
    const { w, h } = map.size;
    const isPlayerHalf = (x, y) => {
      if (sym === 'x') return x <= w * 0.5 + 24;
      if (sym === 'y') return y >= h * 0.5 - 24;
      // point symmetry: keep player's half relative to vector from enemy->player (default SW half)
      const pSpawn = map.spawns.find((s) => s.slot === 'player') || { x: w * 0.2, y: h * 0.8 };
      const vx = pSpawn.x - w * 0.5;
      const vy = pSpawn.y - h * 0.5;
      const dot = (x - w * 0.5) * vx + (y - h * 0.5) * vy;
      return dot >= -24 * Math.max(1, Math.hypot(vx, vy));
    };

    const pSpawn = map.spawns.find((s) => s.slot === 'player') || { slot: 'player', x: 360, y: h - 360, facing: 0, pad: true };
    const half = {
      ...map,
      symmetry: sym,
      autoMirror: true,
      spawns: [pSpawn],
      pads: map.pads.filter((p) => isPlayerHalf(p.x, p.y)),
      supplyClusters: map.supplyClusters.filter((c) => isPlayerHalf(c.x, c.y)),
      supplyNodes: map.supplyNodes.filter((n) => isPlayerHalf(n.x, n.y)),
      capturePoints: map.capturePoints.filter((cp) => isPlayerHalf(cp.x, cp.y)),
      obstacles: map.obstacles.filter((o) => isPlayerHalf(o.x, o.y))
    };
    const expanded = expandMap(half);
    return normalizeMap({
      ...expanded,
      autoMirror: false,
      symmetry: sym
    });
  }

  function validateMap(raw) {
    const errors = [];
    const warnings = [];
    const pushErr = (code, message, x, y) => errors.push({ level: 'error', code, message, x, y });
    const pushWarn = (code, message, x, y) => warnings.push({ level: 'warn', code, message, x, y });

    if (!raw || typeof raw !== 'object') {
      pushErr('INVALID_JSON', 'Карта должна быть JSON-объектом.');
      return { ok: false, errors, warnings, stats: null };
    }

    const rawW = num(raw.size?.w ?? raw.width, NaN);
    const rawH = num(raw.size?.h ?? raw.height, NaN);
    if (!Number.isFinite(rawW) || rawW < MIN_WORLD_W || rawW > MAX_WORLD_W) {
      pushErr('SIZE_W', `Ширина карты должна быть от ${MIN_WORLD_W} до ${MAX_WORLD_W} (сейчас ${rawW}).`);
    }
    if (!Number.isFinite(rawH) || rawH < MIN_WORLD_H || rawH > MAX_WORLD_H) {
      pushErr('SIZE_H', `Высота карты должна быть от ${MIN_WORLD_H} до ${MAX_WORLD_H} (сейчас ${rawH}).`);
    }
    if (raw.biome && !BIOMES[raw.biome]) {
      pushErr('UNKNOWN_BIOME', `Неизвестный биом "${raw.biome}". Доступны: ${BIOME_ORDER.join(', ')}.`);
    }

    const map = expandMap(raw);
    const { w, h } = map.size;

    const playerSpawns = map.spawns.filter((s) => s.slot === 'player');
    const enemySpawns = map.spawns.filter((s) => s.slot === 'enemy');
    if (playerSpawns.length !== 1) {
      pushErr('SPAWN_PLAYER', `Нужен ровно 1 спавн игрока (slot: "player"), сейчас: ${playerSpawns.length}.`);
    }
    if (enemySpawns.length !== 1) {
      pushErr('SPAWN_ENEMY', `Нужен ровно 1 спавн противника (slot: "enemy"), сейчас: ${enemySpawns.length}.`);
    }

    const pSpawn = playerSpawns[0] || null;
    const eSpawn = enemySpawns[0] || null;
    const hqDistance = pSpawn && eSpawn ? Math.round(Math.hypot(pSpawn.x - eSpawn.x, pSpawn.y - eSpawn.y)) : 0;

    for (const sp of map.spawns) {
      const label = sp.slot === 'player' ? 'Игрока' : 'Противника';
      if (sp.x < 120 || sp.x > w - 120 || sp.y < 120 || sp.y > h - 120) {
        pushErr('SPAWN_BOUNDS', `Штаб ${label} слишком близко к границе карты (мин. отступ 120).`, sp.x, sp.y);
      }
    }

    if (pSpawn && eSpawn) {
      if (hqDistance < 700) {
        pushErr('HQ_TOO_CLOSE', `Штабы слишком близко друг к другу (${hqDistance}u < 700u).`, (pSpawn.x + eSpawn.x) * 0.5, (pSpawn.y + eSpawn.y) * 0.5);
      } else if (hqDistance < 1050) {
        pushWarn('HQ_CLOSE', `Дистанция между штабами небольшая (${hqDistance}u) — возможен быстрый раш.`, (pSpawn.x + eSpawn.x) * 0.5, (pSpawn.y + eSpawn.y) * 0.5);
      }
    }

    // Check bounds & overlaps for obstacles, supplies, capture points
    for (let i = 0; i < map.obstacles.length; i++) {
      const r = map.obstacles[i];
      if (r.x < r.radius + 12 || r.x > w - r.radius - 12 || r.y < r.radius + 12 || r.y > h - r.radius - 12) {
        pushWarn('ROCK_BOUNDS', `Скала #${i + 1} касается края карты.`, r.x, r.y);
      }
      const rRect = getPropRect(r.x, r.y, r.radius, 6, 5);
      for (const sp of map.spawns) {
        if (rectsOverlap(getHqRect(sp.x, sp.y), rRect)) {
          pushErr('ROCK_ON_HQ', `Скала перекрывает точку спавна HQ (${sp.slot}).`, r.x, r.y);
        }
      }
      for (const cp of map.capturePoints) {
        if (Math.hypot(r.x - cp.x, r.y - cp.y) < r.radius + 36) {
          pushErr('ROCK_ON_OUTPOST', 'Скала перекрывает нефтевышку.', r.x, r.y);
        }
      }
      for (const s of map.expandedSupplyNodes) {
        if (Math.hypot(r.x - s.x, r.y - s.y) < r.radius + s.radius + 6) {
          pushErr('ROCK_ON_SUPPLY', 'Скала перекрывает склад припасов.', r.x, r.y);
        }
      }
    }

    for (let i = 0; i < map.capturePoints.length; i++) {
      const cp = map.capturePoints[i];
      if (cp.x < cp.radius + 16 || cp.x > w - cp.radius - 16 || cp.y < cp.radius + 16 || cp.y > h - cp.radius - 16) {
        pushErr('OUTPOST_BOUNDS', `Нефтевышка #${i + 1} выходит за границы карты.`, cp.x, cp.y);
      }
      for (const sp of map.spawns) {
        if (rectsOverlap(getHqRect(sp.x, sp.y), getPropRect(cp.x, cp.y, cp.radius, 5, 4))) {
          pushErr('OUTPOST_ON_HQ', `Нефтевышка перекрывает HQ (${sp.slot}).`, cp.x, cp.y);
        }
      }
      for (let j = i + 1; j < map.capturePoints.length; j++) {
        const cp2 = map.capturePoints[j];
        if (Math.hypot(cp.x - cp2.x, cp.y - cp2.y) < cp.radius + cp2.radius + 16) {
          pushWarn('OUTPOST_OVERLAP', 'Две нефтевышки стоят слишком близко друг к другу.', cp.x, cp.y);
        }
      }
    }

    for (const s of map.expandedSupplyNodes) {
      if (s.x < 30 || s.x > w - 30 || s.y < 30 || s.y > h - 30) {
        pushErr('SUPPLY_BOUNDS', 'Паллета припасов выходит за пределы карты.', s.x, s.y);
      }
      for (const sp of map.spawns) {
        if (rectsOverlap(getHqRect(sp.x, sp.y), getPropRect(s.x, s.y, s.radius, 5, 4))) {
          pushErr('SUPPLY_ON_HQ', `Припасы перекрывают HQ (${sp.slot}).`, s.x, s.y);
        }
      }
    }

    if (map.expandedSupplyNodes.length === 0) {
      pushErr('NO_SUPPLIES', 'На карте нет ни одного склада припасов.');
    }
    if (map.capturePoints.length === 0) {
      pushWarn('NO_OUTPOSTS', 'На карте нет нефтевышек (контрольных точек).');
    }

    // Count clear buildable spots (sized for Motorpool 88x88) within 380u of each HQ
    const countBuildSpots = (sp) => {
      if (!sp) return 0;
      const mpHw = 44, mpHh = 44 * BLD_Y_SCALE;
      let count = 0;
      for (let dy = -340; dy <= 340; dy += 64) {
        for (let dx = -340; dx <= 340; dx += 64) {
          if (dx * dx + dy * dy > 360 * 360) continue;
          const x = sp.x + dx;
          const y = sp.y + dy;
          if (x < mpHw + 20 || x > w - mpHw - 20 || y < mpHh + 16 || y > h - mpHh - 16) continue;
          const cand = { x, y, hw: mpHw, hh: mpHh, padHw: mpHw + 12, padHh: mpHh + 9 };
          if (rectsOverlap(cand, getHqRect(sp.x, sp.y))) continue;
          let blocked = false;
          for (const r of map.obstacles) {
            if (rectsOverlap(cand, getPropRect(r.x, r.y, r.radius, 6, 5))) { blocked = true; break; }
          }
          if (blocked) continue;
          for (const s of map.expandedSupplyNodes) {
            if (rectsOverlap(cand, getPropRect(s.x, s.y, s.radius, 5, 4))) { blocked = true; break; }
          }
          if (blocked) continue;
          for (const cp of map.capturePoints) {
            if (rectsOverlap(cand, getPropRect(cp.x, cp.y, cp.radius, 5, 4))) { blocked = true; break; }
          }
          if (!blocked) count++;
        }
      }
      return count;
    };

    const playerBuildSpots = countBuildSpots(pSpawn);
    const enemyBuildSpots = countBuildSpots(eSpawn);
    if (pSpawn && playerBuildSpots < 4) {
      pushErr('PLAYER_BASE_CRAMPED', `Вокруг штаба игрока слишком мало места для базы (свободных слотов: ${playerBuildSpots}).`, pSpawn.x, pSpawn.y);
    }
    if (eSpawn && enemyBuildSpots < 4) {
      pushErr('ENEMY_BASE_CRAMPED', `Вокруг штаба противника слишком мало места для базы (свободных слотов: ${enemyBuildSpots}).`, eSpawn.x, eSpawn.y);
    }

    // Coarse 48px passability grid BFS reachability check
    const cell = 48;
    const cols = Math.max(1, Math.ceil(w / cell));
    const rows = Math.max(1, Math.ceil(h / cell));
    const blockedGrid = new Uint8Array(cols * rows);
    for (const r of map.obstacles) {
      const rr = r.radius + 20;
      const c0 = Math.max(0, Math.floor((r.x - rr) / cell));
      const c1 = Math.min(cols - 1, Math.floor((r.x + rr) / cell));
      const r0 = Math.max(0, Math.floor((r.y - rr) / cell));
      const r1 = Math.min(rows - 1, Math.floor((r.y + rr) / cell));
      for (let gy = r0; gy <= r1; gy++) {
        const wy = (gy + 0.5) * cell;
        for (let gx = c0; gx <= c1; gx++) {
          const wx = (gx + 0.5) * cell;
          if ((wx - r.x) ** 2 + (wy - r.y) ** 2 <= rr * rr) {
            blockedGrid[gy * cols + gx] = 1;
          }
        }
      }
    }

    const toCell = (x, y) => [
      clamp(Math.floor(x / cell), 0, cols - 1),
      clamp(Math.floor(y / cell), 0, rows - 1)
    ];

    const bfsFrom = (sx, sy) => {
      const visited = new Uint8Array(cols * rows);
      const [sc, sr] = toCell(sx, sy);
      const startIdx = sr * cols + sc;
      visited[startIdx] = 1;
      const q = [startIdx];
      let head = 0;
      while (head < q.length) {
        const cur = q[head++];
        const cx = cur % cols;
        const cy = (cur - cx) / cols;
        const neighbors = [
          cx > 0 ? cur - 1 : -1,
          cx + 1 < cols ? cur + 1 : -1,
          cy > 0 ? cur - cols : -1,
          cy + 1 < rows ? cur + cols : -1
        ];
        for (const nb of neighbors) {
          if (nb >= 0 && !visited[nb] && !blockedGrid[nb]) {
            visited[nb] = 1;
            q.push(nb);
          }
        }
      }
      return visited;
    };

    const isReachable = (visited, wx, wy) => {
      const [cx, cy] = toCell(wx, wy);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && visited[ny * cols + nx]) return true;
        }
      }
      return false;
    };

    if (pSpawn && eSpawn && errors.length < 25) {
      const vis = bfsFrom(pSpawn.x, pSpawn.y);
      if (!isReachable(vis, eSpawn.x, eSpawn.y)) {
        pushErr('NO_PATH_BETWEEN_HQS', 'Между штабом игрока и штабом противника нет проходимого маршрута!', eSpawn.x, eSpawn.y);
      }
      for (let i = 0; i < map.capturePoints.length; i++) {
        const cp = map.capturePoints[i];
        if (!isReachable(vis, cp.x, cp.y)) {
          pushErr('OUTPOST_UNREACHABLE', `Нефтевышка #${i + 1} недостижима для наземной техники.`, cp.x, cp.y);
        }
      }
    }

    // Economy & balance telemetry
    let totalSupplies = 0;
    let playerNearSupplies = 0;
    let enemyNearSupplies = 0;
    let playerNearestSupplyDist = Infinity;
    let enemyNearestSupplyDist = Infinity;

    for (const s of map.expandedSupplyNodes) {
      totalSupplies += s.amount;
      if (pSpawn) {
        const dp = Math.hypot(s.x - pSpawn.x, s.y - pSpawn.y);
        if (dp < playerNearestSupplyDist) playerNearestSupplyDist = dp;
        if (dp <= 700) playerNearSupplies += s.amount;
      }
      if (eSpawn) {
        const de = Math.hypot(s.x - eSpawn.x, s.y - eSpawn.y);
        if (de < enemyNearestSupplyDist) enemyNearestSupplyDist = de;
        if (de <= 700) enemyNearSupplies += s.amount;
      }
    }

    if (pSpawn && Number.isFinite(playerNearestSupplyDist) && playerNearestSupplyDist > 750) {
      pushWarn('PLAYER_SUPPLY_FAR', `Ближайшие припасы игрока далеко (${Math.round(playerNearestSupplyDist)}u > 750u).`, pSpawn.x, pSpawn.y);
    }
    if (eSpawn && Number.isFinite(enemyNearestSupplyDist) && enemyNearestSupplyDist > 750) {
      pushWarn('ENEMY_SUPPLY_FAR', `Ближайшие припасы врага далеко (${Math.round(enemyNearestSupplyDist)}u > 750u).`, eSpawn.x, eSpawn.y);
    }
    if (pSpawn && eSpawn && (playerNearSupplies > 0 || enemyNearSupplies > 0)) {
      const hi = Math.max(playerNearSupplies, enemyNearSupplies);
      const lo = Math.min(playerNearSupplies, enemyNearSupplies);
      if (hi > 0 && lo / hi < 0.7) {
        pushWarn('ECON_ASYMMETRY', `Дисбаланс стартовых припасов (≤700u): игрок ${playerNearSupplies} vs враг ${enemyNearSupplies}.`);
      }
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      stats: {
        worldW: w,
        worldH: h,
        biome: map.biome,
        hqDistance,
        totalSupplies,
        playerNearSupplies,
        enemyNearSupplies,
        playerNearestSupplyDist: Number.isFinite(playerNearestSupplyDist) ? Math.round(playerNearestSupplyDist) : null,
        enemyNearestSupplyDist: Number.isFinite(enemyNearestSupplyDist) ? Math.round(enemyNearestSupplyDist) : null,
        capturePointCount: map.capturePoints.length,
        supplyClusterCount: map.supplyClusters.length,
        supplyNodeCount: map.expandedSupplyNodes.length,
        obstacleCount: map.obstacles.length,
        roadCount: map.roads.length,
        playerBuildSpots,
        enemyBuildSpots
      }
    };
  }

  function createBlankMap(opts = {}) {
    const w = clamp(int(opts.w, 2400), MIN_WORLD_W, MAX_WORLD_W);
    const h = clamp(int(opts.h, 1600), MIN_WORLD_H, MAX_WORLD_H);
    const biome = BIOMES[opts.biome] ? opts.biome : 'steppe';
    const symmetry = ['none', 'point', 'x', 'y'].includes(opts.symmetry) ? opts.symmetry : 'point';
    const seed = int(opts.seed, Math.floor(1000 + Math.random() * 8999));
    const marginX = Math.min(360, Math.round(w * 0.16));
    const marginY = Math.min(340, Math.round(h * 0.22));
    const pX = marginX;
    const pY = h - marginY;
    const ePos = symmetry === 'x'
      ? { x: w - pX, y: pY }
      : symmetry === 'y'
        ? { x: pX, y: h - pY }
        : { x: w - pX, y: h - pY };

    return normalizeMap({
      schemaVersion: SCHEMA_VERSION,
      id: opts.id || `custom-${Date.now().toString(36)}`,
      code: opts.code || 'СЕК-09',
      name: opts.name || 'Новый сектор',
      author: opts.author || 'Командир',
      description: opts.description || 'Пользовательская карта IRON FRONT.',
      size: { w, h },
      biome,
      seed,
      symmetry,
      autoMirror: false,
      spawns: [
        { slot: 'player', x: pX, y: pY, facing: defaultFacingToward(pX, pY, w * 0.5, h * 0.5), pad: true },
        { slot: 'enemy', x: ePos.x, y: ePos.y, facing: defaultFacingToward(ePos.x, ePos.y, w * 0.5, h * 0.5), pad: true }
      ],
      pads: [],
      roads: [
        { width: 58, smooth: true, points: [[pX, pY], [Math.round(w * 0.5), Math.round(h * 0.5)], [ePos.x, ePos.y]] }
      ],
      supplyClusters: [
        { x: Math.max(180, pX - 80), y: Math.max(220, pY - 260), count: 6, amount: 850, pattern: 'standard' },
        { x: Math.min(w - 180, ePos.x + 80), y: Math.min(h - 220, ePos.y + (ePos.y < h * 0.5 ? 260 : -260)), count: 6, amount: 850, pattern: 'standard' }
      ],
      supplyNodes: [],
      capturePoints: [
        { x: Math.round(w * 0.5), y: Math.round(h * 0.5), radius: DEFAULT_CAPTURE_RADIUS, rate: DEFAULT_CAPTURE_RATE }
      ],
      obstacles: []
    });
  }

  function registerBuiltinMaps(list) {
    if (!Array.isArray(list)) return;
    for (const raw of list) {
      const m = normalizeMap(raw);
      m._source = 'builtin';
      const idx = builtinCatalog.findIndex((x) => x.id === m.id);
      if (idx >= 0) builtinCatalog[idx] = m;
      else builtinCatalog.push(m);
    }
  }

  async function loadManifestMaps(basePath = 'maps/') {
    if (typeof fetch !== 'function') return builtinCatalog.slice();
    try {
      const res = await fetch(`${basePath}manifest.json`, { cache: 'no-cache' });
      if (!res.ok) return builtinCatalog.slice();
      const manifest = await res.json();
      const files = Array.isArray(manifest) ? manifest : (Array.isArray(manifest.maps) ? manifest.maps : []);
      const loaded = [];
      for (const entry of files) {
        const file = typeof entry === 'string' ? entry : entry.file;
        if (!file) continue;
        try {
          const mr = await fetch(`${basePath}${file}`, { cache: 'no-cache' });
          if (mr.ok) {
            const data = await mr.json();
            loaded.push(data);
          }
        } catch {
          // Ignore individual map fetch error and fall back to built-ins
        }
      }
      if (loaded.length > 0) {
        registerBuiltinMaps(loaded);
        manifestLoaded = true;
      }
    } catch {
      // Offline / file:// fallback cleanly uses js/maps_builtin.js
    }
    return builtinCatalog.slice();
  }

  function getCustomMaps() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => {
        const m = normalizeMap(item);
        m._source = 'custom';
        return m;
      });
    } catch {
      return [];
    }
  }

  function saveCustomMap(raw) {
    if (typeof localStorage === 'undefined') return null;
    const map = normalizeMap(raw);
    delete map._source;
    const list = getCustomMaps().map((m) => {
      const copy = { ...m };
      delete copy._source;
      return copy;
    });
    const idx = list.findIndex((m) => m.id === map.id);
    if (idx >= 0) list[idx] = map;
    else list.unshift(map);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return { ...map, _source: 'custom' };
  }

  function deleteCustomMap(id) {
    if (typeof localStorage === 'undefined') return false;
    const list = getCustomMaps().filter((m) => m.id !== id).map((m) => {
      const copy = { ...m };
      delete copy._source;
      return copy;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  }

  function saveDraftMap(raw) {
    if (typeof localStorage === 'undefined') return null;
    const map = normalizeMap(raw);
    delete map._source;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(map));
    return { ...map, _source: 'draft' };
  }

  function loadDraftMap() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const m = normalizeMap(JSON.parse(raw));
      m._source = 'draft';
      return m;
    } catch {
      return null;
    }
  }

  function getBuiltinMaps() {
    return builtinCatalog.map((m) => ({ ...cloneJson(m), _source: 'builtin' }));
  }

  function getAllMaps() {
    const builtins = getBuiltinMaps();
    const customs = getCustomMaps();
    return [...builtins, ...customs];
  }

  function getMapById(id) {
    if (id === 'draft') {
      return loadDraftMap() || getDefaultMap();
    }
    const all = getAllMaps();
    return all.find((m) => m.id === id) || null;
  }

  function getDefaultMap() {
    if (builtinCatalog.length > 0) return { ...cloneJson(builtinCatalog[0]), _source: 'builtin' };
    return createBlankMap({ id: 'sector-04', code: 'СЕК-04', name: 'Сектор-04: Перекрёсток' });
  }

  function stripRuntimeFields(raw) {
    const m = normalizeMap(raw);
    delete m._source;
    return m;
  }

  return {
    SCHEMA_VERSION,
    BIOMES,
    BIOME_ORDER,
    SUPPLY_PATTERNS,
    SIZE_PRESETS,
    STORAGE_KEY,
    DRAFT_KEY,
    getBiome,
    slugify,
    defaultFacingToward,
    mirrorPoint,
    mirrorFacing,
    isOnSymmetryFixedPoint,
    normalizeMap,
    expandMap,
    applySymmetryBake,
    validateMap,
    createBlankMap,
    stripRuntimeFields,
    registerBuiltinMaps,
    loadManifestMaps,
    isManifestLoaded: () => manifestLoaded,
    getBuiltinMaps,
    getCustomMaps,
    saveCustomMap,
    deleteCustomMap,
    saveDraftMap,
    loadDraftMap,
    getAllMaps,
    getMapById,
    getDefaultMap
  };
});
