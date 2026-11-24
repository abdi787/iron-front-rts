(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.unlocked = false;
      this.muted = false;
      this.lastShotTime = 0;
      this.noiseBuf = null;
    }

    unlock() {
      this.unlocked = true;
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) this.ctx = new AC();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      } catch {}
    }

    ensure() {
      if (this.muted || !this.unlocked || !this.ctx) return null;
      if (this.ctx.state !== 'running') return null;
      return this.ctx;
    }

    setMuted(m) { this.muted = m; }
    jitter(base, pct = 0.08) { return base * (1 + (Math.random() * 2 - 1) * pct); }

    playNoiseBurst(dur, vol, cutoff) {
      const ctx = this.ensure();
      if (!ctx) return;
      if (!this.noiseBuf) {
        const len = ctx.sampleRate * 0.5;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = cutoff;
      const g = ctx.createGain();
      const now = ctx.currentTime;
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(flt); flt.connect(g); g.connect(ctx.destination);
      src.start(now); src.stop(now + dur + 0.02);
    }

    playBullet(vol = 0.065) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (now - this.lastShotTime < 0.04) return;
      this.lastShotTime = now;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(this.jitter(370), now);
      o.frequency.exponentialRampToValueAtTime(110, now + 0.055);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.065);
    }

    playCannon(vol = 0.13) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(this.jitter(145), now);
      o.frequency.exponentialRampToValueAtTime(34, now + 0.22);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.25);
      this.playNoiseBurst(0.14, vol * 0.7, 540);
    }

    playFlame(vol = 0.11) {
      this.playNoiseBurst(0.24, vol, 920);
    }

    playMortar(vol = 0.16) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(this.jitter(105), now);
      o.frequency.exponentialRampToValueAtTime(26, now + 0.30);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.34);
      this.playNoiseBurst(0.18, vol * 0.65, 360);
    }

    playRocket(vol = 0.10) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(this.jitter(220), now);
      o.frequency.exponentialRampToValueAtTime(640, now + 0.16);
      g.gain.setValueAtTime(vol * 0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.21);
      this.playNoiseBurst(0.18, vol * 0.55, 1300);
    }

    playLaser(vol = 0.09) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(this.jitter(820), now);
      o.frequency.exponentialRampToValueAtTime(220, now + 0.12);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.14);
    }

    playIon(vol = 0.12) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(this.jitter(680), now);
      o.frequency.exponentialRampToValueAtTime(160, now + 0.18);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.20);
    }

    playEmp(vol = 0.12) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(this.jitter(960), now);
      o.frequency.exponentialRampToValueAtTime(190, now + 0.16);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.18);
    }

    playExplosion(heavy = false) {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const dur = heavy ? 0.46 : 0.26;
      const vol = heavy ? 0.20 : 0.12;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(this.jitter(heavy ? 88 : 122), now);
      o.frequency.exponentialRampToValueAtTime(22, now + dur);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + dur + 0.02);
      this.playNoiseBurst(dur * 0.85, vol * 0.8, heavy ? 400 : 680);
    }

    playBuild() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      [210, 290].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        const t = now + i * 0.06;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.11, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.14);
      });
    }

    playClick() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(520, now);
      g.gain.setValueAtTime(0.045, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.045);
    }

    playSupply() {
      const ctx = this.ensure();
      if (!ctx) return;
      const now = ctx.currentTime;
      [440, 620].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        const t = now + i * 0.05;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.13);
      });
    }
  }

  FL.SoundEngine = SoundEngine;
})();
