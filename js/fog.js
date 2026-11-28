(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});

  const FOG_TILE = 32;
  const FOG_UNEXPLORED = 0;
  const FOG_EXPLORED = 1;
  const FOG_VISIBLE = 2;

  class FogOfWar {
    constructor(worldW, worldH) {
      this.canvas = document.createElement('canvas');
      this.cols = 0;
      this.rows = 0;
      this.grid = null;
      this.resize(worldW, worldH);
    }

    resize(worldW, worldH) {
      this.worldW = worldW;
      this.worldH = worldH;
      const cols = Math.max(1, Math.ceil(worldW / FOG_TILE));
      const rows = Math.max(1, Math.ceil(worldH / FOG_TILE));
      if (this.cols === cols && this.rows === rows && this.grid) {
        this.reset();
        return;
      }
      this.cols = cols;
      this.rows = rows;
      this.grid = new Uint8Array(this.cols * this.rows);
      this.canvas.width = this.cols;
      this.canvas.height = this.rows;
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.img = this.ctx.createImageData(this.cols, this.rows);
      this.pix32 = new Uint32Array(this.img.data.buffer);
      this.dirty = true;
    }

    reset() {
      this.grid.fill(FOG_UNEXPLORED);
      this.dirty = true;
    }

    revealCircle(wx, wy, radius) {
      const rTiles = Math.ceil(radius / FOG_TILE);
      const cx = Math.floor(wx / FOG_TILE);
      const cy = Math.floor(wy / FOG_TILE);
      const r2 = radius * radius;
      const y0 = Math.max(0, cy - rTiles);
      const y1 = Math.min(this.rows - 1, cy + rTiles);
      const x0 = Math.max(0, cx - rTiles);
      const x1 = Math.min(this.cols - 1, cx + rTiles);

      for (let ty = y0; ty <= y1; ty++) {
        const dy = (ty + 0.5) * FOG_TILE - wy;
        const row = ty * this.cols;
        for (let tx = x0; tx <= x1; tx++) {
          const dx = (tx + 0.5) * FOG_TILE - wx;
          if (dx * dx + dy * dy <= r2) {
            this.grid[row + tx] = FOG_VISIBLE;
          }
        }
      }
    }

    update(units, buildings, radarScans, playerFaction, unitSpecs, bldSpecs) {
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i] === FOG_VISIBLE) this.grid[i] = FOG_EXPLORED;
      }
      for (const u of units) {
        if (u.faction === playerFaction && u.koTimer <= 0) {
          this.revealCircle(u.x, u.y, unitSpecs[u.kind].sight);
        }
      }
      for (const b of buildings) {
        if (b.faction === playerFaction && b.koTimer <= 0) {
          const s = bldSpecs[b.kind].sight;
          this.revealCircle(b.x, b.y, b.buildProgress < 1 ? s * 0.65 : s);
        }
      }
      for (const scan of radarScans) {
        if (scan.remaining > 0) this.revealCircle(scan.x, scan.y, scan.radius);
      }
      this.dirty = true;
    }

    getStateAtWorld(x, y) {
      const tx = Math.max(0, Math.min(this.cols - 1, Math.floor(x / FOG_TILE)));
      const ty = Math.max(0, Math.min(this.rows - 1, Math.floor(y / FOG_TILE)));
      return this.grid[ty * this.cols + tx];
    }

    isVisible(x, y) { return this.getStateAtWorld(x, y) === FOG_VISIBLE; }
    isExplored(x, y) { return this.getStateAtWorld(x, y) >= FOG_EXPLORED; }

    syncTexture() {
      if (!this.dirty) return;
      this.dirty = false;
      const g = this.grid;
      const p = this.pix32;
      // ABGR little-endian: warm sepia-charcoal military fog
      const UNEXP = (242 << 24) | (16 << 16) | (20 << 8) | 25;
      const EXPL = (118 << 24) | (14 << 16) | (18 << 8) | 22;
      for (let i = 0; i < g.length; i++) {
        const s = g[i];
        p[i] = s === FOG_VISIBLE ? 0 : s === FOG_EXPLORED ? EXPL : UNEXP;
      }
      this.ctx.putImageData(this.img, 0, 0);
    }

    renderWorld(ctx, camX, camY, zoom, vw, vh) {
      this.syncTexture();
      const camLeft = camX - vw / (2 * zoom);
      const camTop = camY - vh / (2 * zoom);
      const dx = Math.round(-camLeft * zoom);
      const dy = Math.round(-camTop * zoom);
      const dw = Math.round(this.cols * FOG_TILE * zoom);
      const dh = Math.round(this.rows * FOG_TILE * zoom);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.canvas, dx, dy, dw, dh);
      ctx.restore();
    }

    renderMinimap(ctx, w, h) {
      this.syncTexture();
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.canvas, 0, 0, w, h);
      ctx.restore();
    }
  }

  FL.FogOfWar = FogOfWar;
})();
