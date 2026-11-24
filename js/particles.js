(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});

  class EffectsPool {
    constructor() {
      this.particles = [];
      this.decals = [];
      this.texts = [];
      this.beams = [];
      this.rings = [];
    }

    clear() {
      this.particles.length = 0;
      this.decals.length = 0;
      this.texts.length = 0;
      this.beams.length = 0;
      this.rings.length = 0;
    }

    spawnParticle(x, y, z, vx, vy, vz, size, color, life, gravity = 0) {
      if (this.particles.length > 440) this.particles.shift();
      this.particles.push({ x, y, z, vx, vy, vz, size, color, life, maxLife: life, gravity });
    }

    spawnRing(x, y, maxRadius, color, life = 0.34) {
      if (this.rings.length > 48) this.rings.shift();
      this.rings.push({ x, y, maxRadius, color, life, maxLife: life });
    }

    spawnFlameJet(x1, y1, z1, x2, y2, z2) {
      const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
      for (let i = 0; i < 6; i++) {
        const t = 0.25 + (i / 6) * 0.75;
        const jitter = (Math.random() - 0.5) * 24;
        const col = i < 2 ? '#FEF08A' : i < 4 ? '#FB923C' : '#DC2626';
        this.spawnParticle(
          x1 + dx * t + jitter * 0.3,
          y1 + dy * t + jitter * 0.3,
          z1 + dz * t,
          dx * 1.1 + jitter,
          dy * 1.1 + jitter,
          18 + Math.random() * 24,
          4 + Math.random() * 3.5,
          col,
          0.18 + Math.random() * 0.14,
          -25
        );
      }
    }

    spawnExplosion(x, y, heavy = false) {
      const count = heavy ? 24 : 13;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (heavy ? 50 : 30) + Math.random() * (heavy ? 135 : 85);
        const col = i % 3 === 0 ? '#FEF08A' : i % 3 === 1 ? '#F97316' : '#52525B';
        this.spawnParticle(
          x + (Math.random() - 0.5) * 10,
          y + (Math.random() - 0.5) * 10,
          6 + Math.random() * 12,
          Math.cos(a) * sp,
          Math.sin(a) * sp,
          40 + Math.random() * 115,
          heavy ? 4 + Math.random() * 4 : 3 + Math.random() * 3,
          col,
          0.35 + Math.random() * 0.45,
          240
        );
      }
      if (heavy) this.spawnRing(x, y, 52, '#F97316', 0.32);
      this.addDecal(x, y, heavy ? 26 : 16, 'crater', 18);
    }

    spawnMuzzleFlash(x, y, z, angle, color = '#FDE047') {
      for (let i = 0; i < 4; i++) {
        const a = angle + (Math.random() - 0.5) * 0.55;
        const sp = 55 + Math.random() * 55;
        this.spawnParticle(x, y, z, Math.cos(a) * sp, Math.sin(a) * sp, 10, 3, color, 0.14, 0);
      }
    }

    spawnBeam(x1, y1, z1, x2, y2, z2, color, jagged = false, life = 0.18) {
      this.beams.push({ x1, y1, z1, x2, y2, z2, color, jagged, life, maxLife: life, seed: Math.random() * 100 });
    }

    addDecal(x, y, radius, kind, life = 12) {
      if (this.decals.length > 260) this.decals.shift();
      this.decals.push({ x, y, radius, kind, life, maxLife: life });
    }

    spawnText(x, y, text, color = '#FACC15') {
      this.texts.push({ x, y, text, color, life: 1.15, maxLife: 1.15 });
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        p.vz -= p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z = Math.max(0, p.z + p.vz * dt);
      }
      for (let i = this.decals.length - 1; i >= 0; i--) {
        const d = this.decals[i];
        d.life -= dt;
        if (d.life <= 0) this.decals.splice(i, 1);
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.life -= dt;
        t.y -= 20 * dt;
        if (t.life <= 0) this.texts.splice(i, 1);
      }
      for (let i = this.beams.length - 1; i >= 0; i--) {
        const b = this.beams[i];
        b.life -= dt;
        if (b.life <= 0) this.beams.splice(i, 1);
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.life -= dt;
        if (r.life <= 0) this.rings.splice(i, 1);
      }
    }
  }

  FL.EffectsPool = EffectsPool;
})();
