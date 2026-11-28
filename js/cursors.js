(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});
  const { MeshBuilder, addTransformed } = FL.MESH_CORE;

  // =========================================================================
  // 3D -> PIXEL-ART HARDWARE CSS CURSOR SYSTEM
  // Builds procedural faceted 3D meshes in MeshBuilder and bakes them via the
  // real WebGL 2-pass outline shader (32x32 PNG data URLs) for zero-latency
  // hardware OS cursors across every tactical RTS & Map Maker state.
  // =========================================================================

  const STEEL_HI = [0.88, 0.88, 0.84];
  const STEEL_MID = [0.56, 0.55, 0.52];
  const STEEL_DARK = [0.26, 0.25, 0.24];
  const BRASS_HI = [0.99, 0.82, 0.30];
  const BRASS_MID = [0.84, 0.61, 0.17];
  const BRASS_DARK = [0.48, 0.35, 0.13];
  const RED_BRIGHT = [0.96, 0.28, 0.24];
  const RED_GLOW = [1.00, 0.45, 0.30];
  const RED_DARK = [0.56, 0.13, 0.12];
  const OLIVE_BRIGHT = [0.64, 0.86, 0.28];
  const LIME_GLOW = [0.58, 0.96, 0.34];
  const LIME_MID = [0.32, 0.76, 0.24];
  const AMBER_GLOW = [1.00, 0.84, 0.24];
  const ORANGE_GLOW = [1.00, 0.54, 0.16];

  // Helper: True faceted 3D military chevron/dart pointing along +X with peaked center spine
  function addFacetedDart(b, tipX, backX, notchX, halfW, z0, zEdge, zPeak, col, em = 0, mat = 0) {
    const tipB = [tipX, 0, z0];
    const lwB = [backX, -halfW, z0];
    const rwB = [backX, halfW, z0];
    const ntB = [notchX, 0, z0];

    const tipT = [tipX, 0, zEdge];
    const lwT = [backX, -halfW, zEdge];
    const rwT = [backX, halfW, zEdge];
    const ntT = [notchX, 0, zEdge];
    const peakMid = [(tipX * 0.45 + notchX * 0.55), 0, zPeak];

    // Upper faceted 3D roof with CCW winding so both slopes have upward (+Z) normals!
    b.pushFlatQuad(tipT, peakMid, ntT, lwT, col, em, mat, 0.90, 1.0);
    b.pushFlatQuad(tipT, rwT, ntT, peakMid, col, em, mat, 0.88, 1.0);
    // Outward-facing side walls
    b.pushFlatQuad(tipB, tipT, lwT, lwB, col, em, mat, 0.76, 0.95);
    b.pushFlatQuad(rwB, rwT, tipT, tipB, col, em, mat, 0.76, 0.95);
    b.pushFlatQuad(lwB, lwT, ntT, ntB, col, em, mat, 0.72, 0.90);
    b.pushFlatQuad(ntB, ntT, rwT, rwB, col, em, mat, 0.72, 0.90);
    // Underside (-Z normal)
    b.pushFlatQuad(tipB, lwB, ntB, rwB, col, em, mat, 0.70, 0.75);
  }

  // 1. Armored 3D military pointer arrow (sharp tip aligned right on top-left pixel 3,3)
  function buildPointerMesh(accentCol, bodyCol, tailCol) {
    const raw = new MeshBuilder();
    // Main faceted dart pointing along +X (tip at +13.5)
    addFacetedDart(raw, 13.5, -5.5, -1.8, 7.6, 0.6, 3.0, 5.4, bodyCol, 0.10, 0);
    // Bright tip highlight bevel
    addFacetedDart(raw, 13.5, 4.8, 6.6, 3.2, 2.8, 4.2, 5.8, STEEL_HI, 0.40, 4);
    // Glowing faction core diamond ridge along spine
    raw.bevelBox(2.2, 0, 4.9, 7.8, 2.8, 2.2, 0.45, accentCol, 0.65, 4, 0.90, 1.0);
    // Armored tail handle
    raw.bevelBox(-6.6, 0, 2.2, 7.6, 3.4, 2.8, 0.5, tailCol, 0.16, 0, 0.82, 1.0);

    const out = new MeshBuilder();
    // Rotate toward top-left and shift so metallic nose sits directly at hotspot (3,3)
    addTransformed(out, raw, -3.4, -4.6, 0, 0, 0, -2.26);
    return out.finish();
  }

  // 2. Select cursor: 4 chunky 3D corner targeting brackets
  function buildSelectMesh() {
    const b = new MeshBuilder();
    const d = 8.4;
    const arm = 5.4;
    const th = 2.4;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        b.bevelBox(sx * (d - arm * 0.5 + th * 0.5), sy * d * 1.12, 2.6, arm, th, 3.2, 0.45, LIME_GLOW, 0.48, 4, 0.86, 1.0);
        b.bevelBox(sx * d, sy * (d - arm * 0.5 + th * 0.5) * 1.16, 2.6, th, arm * 1.25, 3.2, 0.45, LIME_GLOW, 0.48, 4, 0.86, 1.0);
        b.box(sx * d, sy * d * 1.12, 4.4, 2.2, 2.4, 1.4, BRASS_HI, 0.50, 4);
      }
    }
    return b.finish();
  }

  // 3. Move order cursor: 4 inward-pointing faceted 3D emerald chevrons + amber center pip
  function buildMoveMesh() {
    const b = new MeshBuilder();
    b.cylZ(0, 0, 1.6, 2.1, 1.8, 3.4, 8, AMBER_GLOW, 0.82, 0, 4);
    const dart = new MeshBuilder();
    addFacetedDart(dart, 4.2, -2.8, -0.8, 4.4, 0.8, 2.8, 4.8, LIME_MID, 0.16, 0);
    addFacetedDart(dart, 3.8, -1.0, 0.2, 2.4, 2.8, 4.0, 5.2, LIME_GLOW, 0.65, 4);
    const dirs = [
      [8.6, 0, Math.PI],
      [-8.6, 0, 0],
      [0, 11.2, -Math.PI * 0.5],
      [0, -11.2, Math.PI * 0.5]
    ];
    for (const [x, y, rz] of dirs) {
      addTransformed(b, dart, x, y, 0, 0, 0, rz);
    }
    return b.finish();
  }

  // 4. Attack / Assault cursor: 3D crimson tactical crosshair reticle
  function buildAttackMesh() {
    const b = new MeshBuilder();
    const ring = new MeshBuilder();
    ring.torusZ(0, 0, 2.6, 8.6, 1.65, 16, 6, RED_DARK, 0.18, 0);
    ring.torusZ(0, 0, 3.6, 8.6, 1.05, 16, 6, RED_BRIGHT, 0.55, 4);
    addTransformed(b, ring, 0, 0, 0, 0, 0, 0);

    const fin = new MeshBuilder();
    fin.bevelBox(0, 0, 3.0, 6.4, 2.4, 3.2, 0.4, RED_GLOW, 0.65, 4, 0.90, 1.0);
    fin.box(2.4, 0, 3.0, 2.0, 1.8, 2.6, STEEL_HI, 0.25, 0);
    addTransformed(b, fin, 9.2, 0, 0, 0, 0, 0);
    addTransformed(b, fin, -9.2, 0, 0, 0, 0, Math.PI);
    addTransformed(b, fin, 0, 11.2, 0, 0, 0, Math.PI * 0.5);
    addTransformed(b, fin, 0, -11.2, 0, 0, 0, -Math.PI * 0.5);

    b.sphere(0, 0, 3.4, 1.7, 1.7, 1.7, 8, 5, AMBER_GLOW, 0.92, 4);
    return b.finish();
  }

  // 5. Harvest / Salvage cursor: 3D golden supply crate + pickup brackets
  function buildHarvestMesh() {
    const b = new MeshBuilder();
    b.bevelBox(0, 0, 1.2, 13.5, 15.0, 2.4, 0.4, BRASS_DARK, 0, 0, 0.78, 0.96);
    b.bevelBox(0, 0, 4.6, 10.6, 11.8, 5.8, 0.8, BRASS_HI, 0.35, 0, 0.86, 1.0);
    b.box(0, 0, 4.9, 11.2, 2.4, 5.4, STEEL_DARK, 0, 2);
    b.box(0, 0, 4.9, 2.4, 12.4, 5.4, STEEL_DARK, 0, 2);
    b.cylZ(0, 0, 7.6, 2.4, 2.0, 1.8, 8, AMBER_GLOW, 0.78, 0, 4);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      b.box(sx * 9.5, sy * 11.0, 2.5, 2.4, 2.8, 2.2, LIME_GLOW, 0.65, 4);
    }
    return b.finish();
  }

  // 6. Rally Point cursor: 3D brass military pennant flag on steel ring
  function buildRallyMesh() {
    const b = new MeshBuilder();
    b.torusZ(0, 2, 1.6, 6.2, 1.35, 12, 6, BRASS_MID, 0.35, 0);
    b.cylZ(-2.5, 1.5, 1.4, 1.45, 1.25, 16.0, 8, STEEL_HI, 0.25, 0, 4);
    b.sphere(-2.5, 1.5, 17.8, 2.0, 2.0, 2.0, 8, 5, BRASS_HI, 0.75, 4);
    b.bevelBox(4.2, 1.5, 13.5, 11.0, 2.6, 6.6, 0.6, AMBER_GLOW, 0.55, 4, 0.90, 1.0);
    b.box(4.2, 1.5, 13.5, 11.4, 2.9, 1.8, RED_BRIGHT, 0.45, 4);
    return b.finish();
  }

  // 7. Build OK cursor: 3D tilted steel & lime construction wrench inside green ring
  function buildBuildOkMesh() {
    const b = new MeshBuilder();
    b.torusZ(0, 0, 1.6, 9.2, 1.35, 14, 6, LIME_GLOW, 0.60, 4);
    const w = new MeshBuilder();
    w.bevelBox(0, 0, 0, 3.4, 12.6, 3.0, 0.5, STEEL_HI, 0.25, 4, 0.88, 1.0);
    w.bevelBox(0, -6.4, 0, 6.8, 3.6, 3.2, 0.5, LIME_GLOW, 0.48, 4, 0.90, 1.0);
    w.box(-2.4, -8.8, 0, 2.2, 3.2, 3.0, STEEL_HI, 0.25, 4);
    w.box(2.4, -8.8, 0, 2.2, 3.2, 3.0, STEEL_HI, 0.25, 4);
    w.cylZ(0, 6.6, -1.5, 2.8, 2.8, 3.0, 8, BRASS_HI, 0.40, 0, 4);
    addTransformed(b, w, 0, 0, 5.2, 0, 0, -0.78);
    return b.finish();
  }

  // 8. Build Blocked / Forbidden / Erase cursor: 3D armored red X-cross
  function buildBlockedMesh() {
    const b = new MeshBuilder();
    const bar = new MeshBuilder();
    bar.bevelBox(0, 0, 2.8, 19.5, 4.4, 3.8, 0.65, RED_BRIGHT, 0.48, 4, 0.88, 1.0);
    bar.box(0, 0, 4.9, 17.5, 2.0, 1.2, RED_GLOW, 0.72, 4);
    addTransformed(b, bar, 0, 0, 0, 0, 0, Math.PI * 0.25);
    addTransformed(b, bar, 0, 0, 0, 0, 0, -Math.PI * 0.25);
    return b.finish();
  }

  // 9. Recon Sweep cursor: 3D golden radar dish/reticle
  function buildReconMesh() {
    const b = new MeshBuilder();
    b.torusZ(0, 0, 2.0, 9.6, 1.4, 16, 6, BRASS_HI, 0.62, 4);
    b.torusZ(0, 0, 2.6, 5.0, 1.0, 12, 6, AMBER_GLOW, 0.70, 4);
    const arm = new MeshBuilder();
    arm.bevelBox(4.8, 0, 3.8, 9.4, 2.2, 2.2, 0.4, AMBER_GLOW, 0.85, 4);
    addTransformed(b, arm, 0, 0, 0, 0, 0, -0.65);
    b.sphere(0, 0, 4.2, 2.1, 2.1, 2.1, 8, 5, STEEL_HI, 0.85, 4);
    return b.finish();
  }

  // 10. Artillery Barrage cursor: 3D heavy bombardment double-ring + X-fins
  function buildStrikeMesh() {
    const b = new MeshBuilder();
    b.torusZ(0, 0, 2.2, 9.8, 1.6, 16, 6, RED_BRIGHT, 0.62, 4);
    b.torusZ(0, 0, 3.2, 5.2, 1.2, 12, 6, ORANGE_GLOW, 0.78, 4);
    const fin = new MeshBuilder();
    fin.bevelBox(7.8, 0, 3.6, 5.6, 2.4, 2.6, 0.4, AMBER_GLOW, 0.75, 4);
    for (let i = 0; i < 4; i++) {
      addTransformed(b, fin, 0, 0, 0, 0, 0, Math.PI * 0.25 + i * Math.PI * 0.5);
    }
    b.sphere(0, 0, 4.4, 2.2, 2.2, 2.2, 8, 5, RED_GLOW, 0.95, 4);
    return b.finish();
  }

  // 11. 8-Direction Edge-Pan Camera Scroll Cursor (double faceted 3D military chevron arrow)
  function buildEdgeArrowMesh(angleRad) {
    const raw = new MeshBuilder();
    // Main armored dark steel arrowhead pointing along +X (tip at +11.2)
    addFacetedDart(raw, 11.4, -2.5, 1.2, 8.8, 0.8, 3.2, 5.6, STEEL_MID, 0.08, 0);
    // Raised glowing brass front chevron inlay
    addFacetedDart(raw, 11.0, 0.2, 3.2, 6.0, 3.0, 4.4, 6.2, BRASS_HI, 0.58, 4);
    // Rear trailing military chevron booster
    addFacetedDart(raw, -0.8, -9.2, -5.6, 6.8, 0.8, 2.8, 4.8, STEEL_DARK, 0.05, 0);
    addFacetedDart(raw, -1.4, -7.8, -4.8, 4.6, 2.6, 3.8, 5.2, AMBER_GLOW, 0.50, 4);

    const rot = new MeshBuilder();
    addTransformed(rot, raw, 0, 0, 0, 0, 0, angleRad);
    return rot.finish();
  }

  const PAN_DIRS = [
    { key: 'pan_e',  ang: 0,               hx: 27, hy: 16, sx: 1.06, sy: 1.18, span: 27 },
    { key: 'pan_se', ang: Math.PI * 0.25,  hx: 26, hy: 26, sx: 1.08, sy: 1.24, span: 27 },
    { key: 'pan_s',  ang: Math.PI * 0.5,   hx: 16, hy: 27, sx: 1.10, sy: 1.36, span: 27 },
    { key: 'pan_sw', ang: Math.PI * 0.75,  hx: 5,  hy: 26, sx: 1.08, sy: 1.24, span: 27 },
    { key: 'pan_w',  ang: Math.PI,         hx: 4,  hy: 16, sx: 1.06, sy: 1.18, span: 27 },
    { key: 'pan_nw', ang: -Math.PI * 0.75, hx: 5,  hy: 5,  sx: 1.08, sy: 1.24, span: 27 },
    { key: 'pan_n',  ang: -Math.PI * 0.5,  hx: 16, hy: 4,  sx: 1.10, sy: 1.36, span: 27 },
    { key: 'pan_ne', ang: -Math.PI * 0.25, hx: 26, hy: 5,  sx: 1.08, sy: 1.24, span: 27 }
  ];

  class CursorSystem {
    constructor(renderer3d, opts = {}) {
      this.renderer3d = renderer3d;
      this.targetEl = opts.targetEl || null;
      this.faction = opts.faction || 'red';
      this.urls = {};
      this.cssValues = {};
      this.activeCanvasState = null;
      this.activeEdgeState = null;

      this.bakeAll();
      this.injectStyles();
      this.setFaction(this.faction);
      if (typeof window !== 'undefined' && window.location && window.location.search.includes('cursors=1')) {
        this.mountPreviewOverlay();
      }
    }

    mountPreviewOverlay() {
      const wrap = document.createElement('div');
      wrap.id = 'cursorPreviewSheet';
      wrap.style.cssText = 'position:fixed;inset:12px;z-index:9999;background:#171310;border:2px solid #ebb83a;border-radius:6px;padding:12px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:8px;align-content:start;font-family:monospace;color:#f3e8d2;';
      for (const [key, url] of Object.entries(this.urls)) {
        const cssVal = this.cssValues[key];
        const m = cssVal.match(/\)\s+(\d+)\s+(\d+),/);
        const hx = m ? Number(m[1]) : 16;
        const hy = m ? Number(m[2]) : 16;
        const card = document.createElement('div');
        card.style.cssText = `background:#241e18;border:1px solid #4d4438;border-radius:4px;padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:${cssVal};`;
        card.innerHTML = `
          <div style="position:relative;width:96px;height:96px;background:repeating-conic-gradient(#1b1713 0 25%,#26201a 0 50%) 50%/12px 12px;border:1px solid #0e0c0a;">
            <img src="${url}" width="96" height="96" style="display:block;width:96px;height:96px;image-rendering:pixelated;" alt="${key}" />
            <span style="position:absolute;left:${hx * 3}px;top:0;width:1px;height:96px;background:rgba(56,189,248,0.55);pointer-events:none;"></span>
            <span style="position:absolute;top:${hy * 3}px;left:0;height:1px;width:96px;background:rgba(56,189,248,0.55);pointer-events:none;"></span>
          </div>
          <strong style="font-size:10px;color:#ebb83a;">${key}</strong>
          <small style="font-size:9px;color:#a69b88;">hot (${hx},${hy})</small>
        `;
        wrap.appendChild(card);
      }
      document.body.appendChild(wrap);
    }

    bakeOne(mesh, hx, hy, fallback = 'default', bakeOpts = {}) {
      const url = this.renderer3d.bakeMeshIcon(
        [{ mesh, sx: bakeOpts.sx ?? 1, sy: bakeOpts.sy ?? 1, sz: bakeOpts.sz ?? 1 }],
        {
          width: 32,
          height: 32,
          span: bakeOpts.span || 30,
          camX: bakeOpts.camX || 0,
          camY: bakeOpts.camY !== undefined ? bakeOpts.camY : -2.6,
          shadow: bakeOpts.shadow !== false
        }
      );
      return { url, css: `url("${url}") ${hx} ${hy}, ${fallback}` };
    }

    bakeAll() {
      const register = (key, mesh, hx, hy, fallback, opts) => {
        const baked = this.bakeOne(mesh, hx, hy, fallback, opts);
        this.urls[key] = baked.url;
        this.cssValues[key] = baked.css;
      };

      register('default_red', buildPointerMesh(RED_BRIGHT, STEEL_MID, BRASS_MID), 3, 3, 'default', { span: 28, camX: -0.6, camY: -3.2 });
      register('default_green', buildPointerMesh(OLIVE_BRIGHT, STEEL_MID, BRASS_MID), 3, 3, 'default', { span: 28, camX: -0.6, camY: -3.2 });
      register('ui', buildPointerMesh(AMBER_GLOW, BRASS_MID, STEEL_MID), 3, 3, 'pointer', { span: 28, camX: -0.6, camY: -3.2 });
      register('select', buildSelectMesh(), 16, 16, 'pointer', { span: 30, camY: -2.4 });
      register('move', buildMoveMesh(), 16, 16, 'crosshair', { span: 30, camY: -2.4 });
      register('attack', buildAttackMesh(), 16, 16, 'crosshair', { span: 32, camY: -2.6 });
      register('harvest', buildHarvestMesh(), 16, 16, 'cell', { span: 30, camY: -3.2 });
      register('rally', buildRallyMesh(), 16, 21, 'crosshair', { span: 32, camX: -1.6, camY: -6.2 });
      register('build_ok', buildBuildOkMesh(), 16, 16, 'copy', { span: 30, camY: -2.8 });
      register('build_bad', buildBlockedMesh(), 16, 16, 'not-allowed', { span: 30, camY: -2.6 });
      register('recon', buildReconMesh(), 16, 16, 'crosshair', { span: 30, camY: -2.4 });
      register('strike', buildStrikeMesh(), 16, 16, 'crosshair', { span: 30, camY: -2.6 });

      for (const d of PAN_DIRS) {
        const arrowMesh = buildEdgeArrowMesh(d.ang);
        register(d.key, arrowMesh, d.hx, d.hy, 'move', {
          span: d.span || 27,
          camX: 0,
          camY: -2.6,
          sx: d.sx,
          sy: d.sy
        });
      }
    }

    injectStyles() {
      let styleEl = document.getElementById('ironFrontCursorStyles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'ironFrontCursorStyles';
        document.head.appendChild(styleEl);
      }

      const vars = Object.entries(this.cssValues)
        .map(([k, v]) => `  --cur-${k.replace(/_/g, '-')}: ${v};`)
        .join('\n');

      const panRules = PAN_DIRS.map(
        (d) => `body[data-edge-cursor="${d.key}"], body[data-edge-cursor="${d.key}"] * { cursor: var(--cur-${d.key.replace(/_/g, '-')}) !important; }`
      ).join('\n');

      styleEl.textContent = `
:root {
${vars}
  --cur-default: var(--cur-default-red);
}
body.fac-green {
  --cur-default: var(--cur-default-green);
}
html, body {
  cursor: var(--cur-default);
}
a, button, .mech-btn, .cta-btn, .fac-card, .map-card, .cameo-card, .cameo-cancel,
.cg-btn, .dock-tab, .seg-group button, .rack-fold,
.ed-btn, .ed-tool, .ed-biome-btn, .ed-seg button, .ed-issue, .ed-check-inline, select {
  cursor: var(--cur-ui);
}
button:disabled, .mech-btn:disabled, .cameo-card:disabled, .cameo-card.is-disabled, .ed-btn:disabled {
  cursor: var(--cur-build-bad);
}
input[type="text"], input[type="number"], textarea {
  cursor: text;
}
#minimapCanvas, #edMinimapCanvas {
  cursor: var(--cur-recon);
}
${panRules}
`;
    }

    setFaction(faction) {
      this.faction = faction === 'green' ? 'green' : 'red';
      document.documentElement.style.setProperty(
        '--cur-default',
        this.faction === 'green' ? this.cssValues.default_green : this.cssValues.default_red
      );
      if (this.activeCanvasState === 'default' && this.targetEl) {
        this.targetEl.style.cursor = this.faction === 'green' ? this.cssValues.default_green : this.cssValues.default_red;
      }
    }

    setEdgePan(ex, ey) {
      let key = null;
      if (ex !== 0 || ey !== 0) {
        const sx = ex < -0.15 ? -1 : ex > 0.15 ? 1 : 0;
        const sy = ey < -0.15 ? -1 : ey > 0.15 ? 1 : 0;
        if (sx === 0 && sy < 0) key = 'pan_n';
        else if (sx > 0 && sy < 0) key = 'pan_ne';
        else if (sx > 0 && sy === 0) key = 'pan_e';
        else if (sx > 0 && sy > 0) key = 'pan_se';
        else if (sx === 0 && sy > 0) key = 'pan_s';
        else if (sx < 0 && sy > 0) key = 'pan_sw';
        else if (sx < 0 && sy === 0) key = 'pan_w';
        else if (sx < 0 && sy < 0) key = 'pan_nw';
      }
      if (key === this.activeEdgeState) return;
      this.activeEdgeState = key;
      if (key) document.body.setAttribute('data-edge-cursor', key);
      else document.body.removeAttribute('data-edge-cursor');
    }

    setCanvasState(stateName) {
      const next = stateName || 'default';
      if (next === this.activeCanvasState) return;
      this.activeCanvasState = next;
      if (!this.targetEl) return;
      if (next === 'default') {
        this.targetEl.style.cursor = this.faction === 'green' ? this.cssValues.default_green : this.cssValues.default_red;
      } else {
        this.targetEl.style.cursor = this.cssValues[next] || this.cssValues.default_red;
      }
    }

    resolveGameCursor(sim, worldPt, opts = {}) {
      if (!sim || sim.phase !== 'playing' || !worldPt) return 'default';
      if (opts.isDraggingBox) return 'select';

      if (sim.activePowerMode === 'reconSweep') return 'recon';
      if (sim.activePowerMode === 'artilleryBarrage') return 'strike';

      const pf = sim.playerFaction;
      const ef = sim.enemyFaction;
      const { UNIT_SPECS, BUILDING_SPECS } = FL.CONSTANTS;

      if (sim.placementMode) {
        const ok = sim.canPlaceBuilding(pf, sim.placementMode, worldPt.x, worldPt.y).ok;
        return ok ? 'build_ok' : 'build_bad';
      }

      if (sim.attackMoveMode) return 'attack';

      let hasSelCombat = false;
      let hasSelHarvester = false;
      for (const u of sim.units) {
        if (u.faction === pf && u.selected && u.koTimer <= 0) {
          if (UNIT_SPECS[u.kind].isHarvester) hasSelHarvester = true;
          else hasSelCombat = true;
        }
      }
      const hasSelUnits = hasSelCombat || hasSelHarvester;
      const hasSelProducer = !hasSelUnits && sim.buildings.some(
        (b) => b.faction === pf && b.selected && b.koTimer <= 0 && BUILDING_SPECS[b.kind].produces.length > 0
      );

      const wx = worldPt.x;
      const wy = worldPt.y;
      const fog = sim.demoMode ? null : sim.fog;

      // Enemy hover (strictly Fog-of-War safe so hidden enemies never leak!)
      if (hasSelCombat) {
        for (const u of sim.units) {
          if (u.faction !== ef || u.koTimer > 0) continue;
          if (fog && !fog.isVisible(u.x, u.y)) continue;
          if (Math.hypot(u.x - wx, u.y - wy) <= UNIT_SPECS[u.kind].radius + 14) return 'attack';
        }
        for (const b of sim.buildings) {
          if (b.faction !== ef || b.koTimer > 0) continue;
          if (fog && !fog.isExplored(b.x, b.y)) continue;
          if (Math.hypot(b.x - wx, b.y - wy) <= BUILDING_SPECS[b.kind].radius + 12) return 'attack';
        }
      }

      // Harvester over supply node or salvage wreck
      if (hasSelHarvester) {
        for (const o of sim.supplyNodes) {
          if (o.amount <= 0) continue;
          if (fog && !fog.isExplored(o.x, o.y)) continue;
          if (Math.hypot(o.x - wx, o.y - wy) <= 34) return 'harvest';
        }
        for (const w of sim.wrecks) {
          if (w.supplyValue <= 0) continue;
          if (fog && !fog.isVisible(w.x, w.y)) continue;
          if (Math.hypot(w.x - wx, w.y - wy) <= 28) return 'harvest';
        }
      }

      // Hovering friendly unit or building -> select brackets
      for (const u of sim.units) {
        if (u.faction !== pf || u.koTimer > 0) continue;
        if (Math.hypot(u.x - wx, u.y - wy) <= UNIT_SPECS[u.kind].radius + 10) return 'select';
      }
      for (const b of sim.buildings) {
        if (b.faction !== pf || b.koTimer > 0) continue;
        if (Math.hypot(b.x - wx, b.y - wy) <= BUILDING_SPECS[b.kind].radius + 10) return 'select';
      }

      if (hasSelUnits) return 'move';
      if (hasSelProducer) return 'rally';
      return 'default';
    }
  }

  FL.CursorSystem = CursorSystem;
})();
