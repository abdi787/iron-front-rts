(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});
  const {
    WORLD_WIDTH, WORLD_HEIGHT, UNIT_SPECS, BUILDING_SPECS,
    getBuildingClearanceRect, getPropClearanceRect, rectsOverlap
  } = FL.CONSTANTS;

  function traceRoadPath(ctx, points, scaleX, scaleY, smooth) {
    if (!points || points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0] * scaleX, points[0][1] * scaleY);
    if (smooth && points.length >= 3) {
      for (let i = 1; i < points.length - 1; i++) {
        const x1 = points[i][0] * scaleX;
        const y1 = points[i][1] * scaleY;
        const mx = ((points[i][0] + points[i + 1][0]) * 0.5) * scaleX;
        const my = ((points[i][1] + points[i + 1][1]) * 0.5) * scaleY;
        ctx.quadraticCurveTo(x1, y1, mx, my);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last[0] * scaleX, last[1] * scaleY);
    } else {
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] * scaleX, points[i][1] * scaleY);
      }
    }
  }

  class GameRenderer {
    constructor(renderer3d) {
      this.renderer3d = renderer3d;
      this.terrainCanvas = null;
      this._terrainKey = null;
      this.ensureTerrain(FL.MAPS ? FL.MAPS.getDefaultMap() : null, true);
    }

    getTerrainSignature(mapData) {
      if (!mapData) return 'default';
      const w = mapData.size ? mapData.size.w : WORLD_WIDTH;
      const h = mapData.size ? mapData.size.h : WORLD_HEIGHT;
      const roadsSig = JSON.stringify(mapData.roads || []);
      const padsSig = JSON.stringify(mapData.expandedPads || mapData.pads || []);
      return `${mapData.id || ''}|${w}x${h}|${mapData.biome || 'steppe'}|${mapData.seed || 0}|${roadsSig}|${padsSig}`;
    }

    ensureTerrain(mapData, force = false) {
      const expanded = mapData && FL.MAPS && !mapData.expandedPads ? FL.MAPS.expandMap(mapData) : mapData;
      const sig = this.getTerrainSignature(expanded);
      if (!force && this.terrainCanvas && this._terrainKey === sig) return;
      this._terrainKey = sig;
      this.terrainCanvas = this.bakeTerrain(expanded);
    }

    bakeTerrain(mapData) {
      const worldW = (mapData && mapData.size && mapData.size.w) || WORLD_WIDTH;
      const worldH = (mapData && mapData.size && mapData.size.h) || WORLD_HEIGHT;
      const biome = FL.MAPS ? FL.MAPS.getBiome(mapData && mapData.biome) : null;
      const pal = (biome && biome.terrain) || {
        base: '#896644', hi: '#95724E', lo: '#7A593A',
        speckDark: '#6D4F33', speckLight: '#A37F58', flora1: '#5F663D', flora2: '#747C4B',
        roadOuter: '#735335', roadInner: '#7D5B3B',
        padBorder: '#6B4E34', padA: '#736C60', padB: '#6B6458', padTop: '#857E70', padStripe: '#D4A942',
        border: '#3B2C1F', voidBg: '#231C16'
      };
      const seed = (mapData && Number.isFinite(mapData.seed)) ? mapData.seed : 4201;

      const scale = 2;
      const w = Math.ceil(worldW / scale);
      const h = Math.ceil(worldH / scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = pal.base;
      ctx.fillRect(0, 0, w, h);

      const phaseA = ((seed * 131) % 360) * 0.01745;
      const phaseB = ((seed * 257) % 360) * 0.01745;
      const hash = (x, y) => {
        let n = Math.imul(x + seed * 17, 374761393) + Math.imul(y - seed * 31, 668265263);
        n = Math.imul(n ^ (n >>> 13), 1274126177);
        return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
      };

      const tile = 16;
      for (let ty = 0; ty < h; ty += tile) {
        for (let tx = 0; tx < w; tx += tile) {
          const v = Math.sin(tx * 0.011 + ty * 0.008 + phaseA) * 0.5 + Math.cos(tx * 0.006 - ty * 0.014 + phaseB) * 0.5;
          if (v > 0.36) { ctx.fillStyle = pal.hi; ctx.fillRect(tx, ty, tile, tile); }
          else if (v < -0.34) { ctx.fillStyle = pal.lo; ctx.fillRect(tx, ty, tile, tile); }

          const r = hash(tx, ty);
          if (r > 0.85) { ctx.fillStyle = pal.speckDark; ctx.fillRect(tx + 4, ty + 6, 5, 3); }
          else if (r < 0.10) { ctx.fillStyle = pal.speckLight; ctx.fillRect(tx + 8, ty + 4, 4, 2); }
          else if (r > 0.47 && r < 0.505) {
            ctx.fillStyle = pal.flora1; ctx.fillRect(tx + 6, ty + 7, 4, 3);
            ctx.fillStyle = pal.flora2; ctx.fillRect(tx + 7, ty + 6, 2, 2);
          }
        }
      }

      // Parametric convoy roads
      const roads = (mapData && mapData.roads) || [];
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const road of roads) {
        if (!road.points || road.points.length < 2) continue;
        const outerW = Math.max(8, (road.width || 60) / scale);
        const innerW = Math.max(4, outerW * 0.47);
        ctx.strokeStyle = pal.roadOuter;
        ctx.lineWidth = outerW;
        traceRoadPath(ctx, road.points, 1 / scale, 1 / scale, road.smooth !== false);
        ctx.stroke();

        ctx.strokeStyle = pal.roadInner;
        ctx.lineWidth = innerW;
        traceRoadPath(ctx, road.points, 1 / scale, 1 / scale, road.smooth !== false);
        ctx.stroke();
      }

      // Parametric concrete base & staging pads
      const drawPad = (pad) => {
        const pw = Math.max(32, Math.round((pad.w || 368) / (scale * 16)) * 16);
        const ph = Math.max(32, Math.round((pad.h || 268) / (scale * 16)) * 16);
        const x0 = Math.round(pad.x / scale - pw / 2);
        const y0 = Math.round(pad.y / scale - ph / 2);
        ctx.fillStyle = pal.padBorder;
        ctx.fillRect(x0 - 8, y0 - 8, pw + 16, ph + 16);
        for (let py = 0; py < ph; py += 16) {
          for (let px = 0; px < pw; px += 16) {
            if ((px === 0 || px === pw - 16) && (py === 0 || py === ph - 16)) continue;
            ctx.fillStyle = ((px / 16 + py / 16) % 2 === 0) ? pal.padA : pal.padB;
            ctx.fillRect(x0 + px, y0 + py, 15, 15);
            ctx.fillStyle = pal.padTop;
            ctx.fillRect(x0 + px, y0 + py, 15, 1);
          }
        }
        ctx.fillStyle = pal.padStripe;
        ctx.fillRect(x0 + 16, y0 + 2, 14, 2);
        ctx.fillRect(x0 + pw - 30, y0 + 2, 14, 2);
      };

      const pads = (mapData && mapData.expandedPads) || [];
      for (const pad of pads) drawPad(pad);

      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      return c;
    }

    renderWorld(ctx, vw, vh, sim, effects, cam, dragBox, hoverWorld, longPress) {
      const worldW = sim.worldW || WORLD_WIDTH;
      const worldH = sim.worldH || WORLD_HEIGHT;
      const biome = FL.MAPS ? FL.MAPS.getBiome(sim.currentMap && sim.currentMap.biome) : null;
      this.ensureTerrain(sim.currentMap);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = (biome && biome.terrain && biome.terrain.voidBg) || '#231C16';
      ctx.fillRect(0, 0, vw, vh);

      const shake = (sim.cameraTrauma || 0) * (sim.cameraTrauma || 0) * 13;
      const sx = shake > 0.1 ? (Math.random() * 2 - 1) * shake : 0;
      const sy = shake > 0.1 ? (Math.random() * 2 - 1) * shake : 0;

      const z = cam.zoom;
      const camLeft = cam.x - vw / (2 * z) + sx;
      const camTop = cam.y - vh / (2 * z) + sy;
      const fog = sim.demoMode ? null : sim.fog;
      const pf = sim.playerFaction;

      ctx.save();
      ctx.scale(z, z);
      ctx.translate(-camLeft, -camTop);

      const visMinX = Math.max(0, camLeft);
      const visMinY = Math.max(0, camTop);
      const visMaxX = Math.min(worldW, camLeft + vw / z);
      const visMaxY = Math.min(worldH, camTop + vh / z);
      if (this.terrainCanvas && visMaxX > visMinX && visMaxY > visMinY) {
        ctx.drawImage(
          this.terrainCanvas,
          visMinX / 2, visMinY / 2, (visMaxX - visMinX) / 2, (visMaxY - visMinY) / 2,
          visMinX, visMinY, visMaxX - visMinX, visMaxY - visMinY
        );
      }

      for (const d of effects.decals) {
        ctx.globalAlpha = Math.min(1, d.life / d.maxLife) * 0.45;
        if (d.kind === 'track') {
          ctx.fillStyle = '#533B25';
          ctx.fillRect(d.x - 4, d.y - 3, 8, 6);
        } else {
          ctx.fillStyle = '#2C2017';
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.radius, d.radius * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      for (const cp of sim.capturePoints) {
        const col = cp.owner === 'red' ? '#EF4444' : cp.owner === 'green' ? '#84CC16' : '#EAB308';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.ellipse(cp.x, cp.y, cp.radius, cp.radius * 0.70, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        if (cp.progress > 0 && cp.progress < 1) {
          const capF = cp.capturingFaction || cp.owner;
          ctx.strokeStyle = capF === 'red' ? '#FCA5A5' : '#BEF264';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(cp.x, cp.y, cp.radius - 6, (cp.radius - 6) * 0.70, 0, -Math.PI * 0.5, -Math.PI * 0.5 + cp.progress * Math.PI * 2);
          ctx.stroke();
        }
      }

      for (const u of sim.units) {
        if (!u.selected || u.koTimer > 0) continue;
        const r = UNIT_SPECS[u.kind].radius + 7;
        ctx.strokeStyle = u.faction === 'red' ? '#FBBF24' : '#A3E635';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(u.x, u.y + 2, r, r * 0.70, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (const b of sim.buildings) {
        if (!b.selected || b.koTimer > 0) continue;
        const r = BUILDING_SPECS[b.kind].radius + 8;
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + 4, r, r * 0.70, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (BUILDING_SPECS[b.kind].produces.length > 0) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
          ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.rallyX, b.rallyY); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(b.rallyX - 3, b.rallyY - 3, 6, 6);
        }
      }
      let placementCheck = null;
      let ghostRect = null;
      if (sim.placementMode && hoverWorld) {
        const spec = BUILDING_SPECS[sim.placementMode];
        placementCheck = sim.canPlaceBuilding(pf, sim.placementMode, hoverWorld.x, hoverWorld.y);
        ghostRect = getBuildingClearanceRect(sim.placementMode, hoverWorld.x, hoverWorld.y, sim.placementDir);
        const ok = placementCheck.ok;

        ctx.strokeStyle = ok ? 'rgba(132, 204, 22, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        ctx.fillStyle = ok ? 'rgba(132, 204, 22, 0.16)' : 'rgba(239, 68, 68, 0.16)';
        ctx.lineWidth = 2;
        ctx.fillRect(hoverWorld.x - ghostRect.hw, hoverWorld.y - ghostRect.hh, ghostRect.hw * 2, ghostRect.hh * 2);
        ctx.strokeRect(hoverWorld.x - ghostRect.hw, hoverWorld.y - ghostRect.hh, ghostRect.hw * 2, ghostRect.hh * 2);
        const fRad = sim.getPlacementRad();
        const fx = hoverWorld.x + Math.cos(fRad) * (ghostRect.hw + 8);
        const fy = hoverWorld.y + Math.sin(fRad) * (ghostRect.hh + 8);
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(fRad);
        ctx.fillStyle = ok ? '#BEF264' : '#FCA5A5';
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        if (spec.range > 0 || spec.repairRadius) {
          const rr = spec.range || spec.repairRadius;
          ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.arc(hoverWorld.x, hoverWorld.y, rr, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      for (const m of sim.orderMarkers) {
        const t = m.life / m.maxLife;
        const col = m.kind === 'attack' ? '#EF4444' : m.kind === 'harvest' ? '#FACC15' : '#84CC16';
        ctx.strokeStyle = col;
        ctx.globalAlpha = t;
        ctx.lineWidth = 2;
        const rad = 6 + (1 - t) * 18;
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, rad, rad * 0.70, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const scene = this.renderer3d.renderScene(vw, vh, sim, cam, sx, sy, hoverWorld);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        scene.canvas,
        0, 0, scene.canvas.width, scene.canvas.height,
        scene.x, scene.y, scene.w, scene.h
      );

      for (const rb of sim.repairBeams) {
        ctx.strokeStyle = rb.color || '#34D399';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(rb.x1, rb.y1); ctx.lineTo(rb.x2, rb.y2); ctx.stroke();
        ctx.setLineDash([]);
      }

      for (const b of effects.beams) {
        ctx.save();
        ctx.globalAlpha = b.life / b.maxLife;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.jagged ? 3 : 3.5;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1 - b.z1 * 0.73);
        if (b.jagged) {
          const steps = 6;
          for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const jx = Math.sin(b.seed + i * 17.3 + sim.elapsedTime * 50) * 12;
            const jy = Math.cos(b.seed + i * 11.7 + sim.elapsedTime * 45) * 9;
            ctx.lineTo(b.x1 + (b.x2 - b.x1) * t + jx, (b.y1 - b.z1 * 0.73) + ((b.y2 - b.z2 * 0.73) - (b.y1 - b.z1 * 0.73)) * t + jy);
          }
        }
        ctx.lineTo(b.x2, b.y2 - b.z2 * 0.73);
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      for (const r of effects.rings) {
        const p = 1 - r.life / r.maxLife;
        ctx.save();
        ctx.globalAlpha = clamp(r.life / r.maxLife, 0, 1) * 0.85;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const rad = 8 + p * (r.maxRadius - 8);
        ctx.ellipse(r.x, r.y, rad, rad * 0.72, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const p of sim.projectiles) {
        const py = p.y - p.z * 0.73;
        ctx.fillStyle = p.elite ? '#FDE047'
          : p.kind === 'missile' ? '#FB7185'
          : p.kind === 'mortar' ? '#F97316'
          : p.kind === 'shell' ? '#FBBF24' : '#FEF9C3';
        const sz = p.kind === 'mortar' ? 4.8 : p.kind === 'missile' ? 4.2 : p.kind === 'shell' ? 3.5 : 2.5;
        ctx.beginPath(); ctx.arc(p.x, py, sz, 0, Math.PI * 2); ctx.fill();
      }

      for (const rs of sim.activeRadarScans) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.58)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(rs.x, rs.y, rs.radius, 0, Math.PI * 2); ctx.stroke();
      }
      for (const as of sim.activeAirstrikes) {
        const p = 1 - as.delay / as.totalDelay;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(as.x, as.y, as.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(as.x, as.y, as.radius * (1 - p), 0, Math.PI * 2); ctx.stroke();
      }
      if (sim.activePowerMode && hoverWorld) {
        const rad = sim.activePowerMode === 'reconSweep' ? 360 : 160;
        ctx.strokeStyle = sim.activePowerMode === 'reconSweep' ? '#FACC15' : '#EF4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.arc(hoverWorld.x, hoverWorld.y, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (sim.placementMode && hoverWorld && placementCheck && ghostRect) {
        const ok = placementCheck.ok;

        if (!ok && placementCheck.reason === 'Слишком далеко от базы') {
          ctx.save();
          ctx.strokeStyle = 'rgba(132, 204, 22, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([8, 6]);
          for (const b of sim.buildings) {
            if (b.faction !== pf || b.koTimer > 0) continue;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 380, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        const drawClearanceRect = (rect, hit) => {
          const rx = Math.round(rect.x - rect.padHw) + 0.5;
          const ry = Math.round(rect.y - rect.padHh) + 0.5;
          const rw = Math.round(rect.padHw * 2);
          const rh = Math.round(rect.padHh * 2);
          ctx.save();
          if (hit) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.94)';
            ctx.lineWidth = 2.2;
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeRect(rx, ry, rw, rh);
          } else {
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.52)';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([5, 4]);
            ctx.strokeRect(rx, ry, rw, rh);
          }
          ctx.restore();
        };

        for (const b of sim.buildings) {
          if (b.koTimer > 0) continue;
          const bRect = getBuildingClearanceRect(b.kind, b.x, b.y, b.facingDir);
          const hit = rectsOverlap(ghostRect, bRect);
          if (hit || Math.hypot(b.x - hoverWorld.x, b.y - hoverWorld.y) < 320) drawClearanceRect(bRect, hit);
        }
        for (const r of sim.obstacles) {
          const rRect = getPropClearanceRect(r.x, r.y, r.radius, 6, 5);
          const hit = rectsOverlap(ghostRect, rRect);
          if (hit || Math.hypot(r.x - hoverWorld.x, r.y - hoverWorld.y) < 220) drawClearanceRect(rRect, hit);
        }
        for (const s of sim.supplyNodes) {
          if (s.amount <= 0) continue;
          const sRect = getPropClearanceRect(s.x, s.y, s.radius, 5, 4);
          const hit = rectsOverlap(ghostRect, sRect);
          if (hit || Math.hypot(s.x - hoverWorld.x, s.y - hoverWorld.y) < 220) drawClearanceRect(sRect, hit);
        }
        for (const cp of sim.capturePoints) {
          const cpRect = getPropClearanceRect(cp.x, cp.y, cp.radius, 5, 4);
          const hit = rectsOverlap(ghostRect, cpRect);
          if (hit || Math.hypot(cp.x - hoverWorld.x, cp.y - hoverWorld.y) < 260) drawClearanceRect(cpRect, hit);
        }

        const gx = Math.round(hoverWorld.x - ghostRect.padHw) + 0.5;
        const gy = Math.round(hoverWorld.y - ghostRect.padHh) + 0.5;
        ctx.save();
        ctx.strokeStyle = ok ? 'rgba(132, 204, 22, 0.85)' : 'rgba(239, 68, 68, 0.95)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(gx, gy, Math.round(ghostRect.padHw * 2), Math.round(ghostRect.padHh * 2));
        ctx.restore();

        if (!ok && placementCheck.reason) {
          ctx.save();
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          const tw = ctx.measureText(placementCheck.reason).width + 12;
          const ly = hoverWorld.y + ghostRect.padHh + 16;
          ctx.fillStyle = 'rgba(20, 12, 12, 0.92)';
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.lineWidth = 1;
          ctx.fillRect(hoverWorld.x - tw * 0.5, ly - 10, tw, 14);
          ctx.strokeRect(hoverWorld.x - tw * 0.5, ly - 10, tw, 14);
          ctx.fillStyle = '#FCA5A5';
          ctx.fillText(placementCheck.reason, hoverWorld.x, ly);
          ctx.restore();
        }
      }

      for (const pt of effects.particles) {
        ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size * 0.5, pt.y - pt.z * 0.73 - pt.size * 0.5, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;

      for (const b of sim.buildings) {
        if (b.koTimer > 0) continue;
        if (b.faction !== pf && fog && !fog.isVisible(b.x, b.y)) continue;
        const specB = BUILDING_SPECS[b.kind];
        const bTop = b.y - specB.radius - 26;
        const bBot = b.y + specB.radius * 0.68 + 4;
        this.drawHpBar(ctx, b.x, bTop, 54, b.hp, b.maxHp, b.displayHp, b.faction, pf, b.selected || b.hp < b.maxHp);

        // Bottom horizontal status bars directly beneath buildings (build / train)
        if (b.buildProgress < 1) {
          const pctTxt = `${Math.round(b.buildProgress * 100)}%`;
          this.drawWorldBar(ctx, b.x, bBot, 54, b.buildProgress, '#FACC15', {
            animateTime: sim.elapsedTime, badgeText: pctTxt, badgeColor: '#FDE68A'
          });
        } else if (b.faction === pf && b.queue.length > 0) {
          const q0 = b.queue[0];
          const prog = 1 - q0.remaining / Math.max(0.01, q0.total);
          const powered = sim.isBuildingPowered(b);
          const qTxt = b.queue.length > 1 ? `×${b.queue.length}` : `${Math.round(prog * 100)}%`;
          this.drawWorldBar(ctx, b.x, bBot, 54, prog, '#38BDF8', {
            paused: !powered,
            animateTime: powered ? sim.elapsedTime : undefined,
            badgeText: !powered ? '⚡' : qTxt,
            badgeColor: !powered ? '#FCA5A5' : '#BAE6FD'
          });
        }
      }
      for (const u of sim.units) {
        if (u.koTimer > 0) continue;
        if (u.faction !== pf && fog && !fog.isVisible(u.x, u.y)) continue;
        const spec = UNIT_SPECS[u.kind];
        const uTop = u.y - spec.radius - 20;
        const uBot = u.y + spec.radius * 0.72 + 4;
        this.drawHpBar(ctx, u.x, uTop, 32, u.hp, u.maxHp, u.displayHp, u.faction, pf, u.selected || u.hp < u.maxHp, u.rank, u.controlGroup);
        if (spec.isHarvester && u.supplyCarried > 0) {
          ctx.fillStyle = '#141118'; ctx.fillRect(u.x - 14, u.y - spec.radius - 14, 28, 3);
          ctx.fillStyle = '#FACC15'; ctx.fillRect(u.x - 14, u.y - spec.radius - 14, 28 * (u.supplyCarried / spec.supplyCapacity), 3);
        }

        // Bottom horizontal status bar beneath units (materializing / repairing / auto-repairing)
        if (u.spawnProg < 1) {
          this.drawWorldBar(ctx, u.x, uBot, 34, u.spawnProg, '#38BDF8', { animateTime: sim.elapsedTime });
        } else if (u.isRepairing) {
          this.drawWorldBar(ctx, u.x, uBot, 34, u.hp / u.maxHp, '#34D399', {
            animateTime: sim.elapsedTime, wrenchTime: sim.elapsedTime, wrenchMode: u.repairKind || 'auto'
          });
        }
      }

      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      for (const tx of effects.texts) {
        ctx.globalAlpha = Math.min(1, tx.life / tx.maxLife);
        ctx.fillStyle = '#141118'; ctx.fillText(tx.text, tx.x + 1, tx.y + 1);
        ctx.fillStyle = tx.color; ctx.fillText(tx.text, tx.x, tx.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (!sim.demoMode && sim.fog) {
        sim.fog.renderWorld(ctx, cam.x, cam.y, cam.zoom, vw, vh);
      }

      if (dragBox && dragBox.active) {
        const x0 = Math.min(dragBox.startX, dragBox.currX);
        const y0 = Math.min(dragBox.startY, dragBox.currY);
        const bw = Math.abs(dragBox.currX - dragBox.startX);
        const bh = Math.abs(dragBox.currY - dragBox.startY);
        ctx.fillStyle = pf === 'red' ? 'rgba(234, 179, 8, 0.14)' : 'rgba(132, 204, 22, 0.14)';
        ctx.strokeStyle = pf === 'red' ? '#FBBF24' : '#A3E635';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x0, y0, bw, bh);
        ctx.strokeRect(x0, y0, bw, bh);
      }

      if (longPress && longPress.active && longPress.progress > 0) {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(longPress.x, longPress.y, 26, -Math.PI * 0.5, -Math.PI * 0.5 + longPress.progress * Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    drawHpBar(ctx, x, y, w, hp, maxHp, displayHp, faction, playerFaction, show, rank = 0, cg = null) {
      if (!show && rank === 0 && !cg) return;
      const x0 = Math.round(x - w * 0.5);
      if (show) {
        ctx.fillStyle = '#141118';
        ctx.fillRect(x0 - 1, y - 1, w + 2, 5);
        if (displayHp > hp) {
          ctx.fillStyle = '#FDE68A';
          ctx.fillRect(x0, y, Math.round(w * (displayHp / maxHp)), 3);
        }
        const ratio = Math.max(0, Math.min(1, hp / maxHp));
        ctx.fillStyle = faction === 'red' ? '#EF4444' : '#84CC16';
        ctx.fillRect(x0, y, Math.round(w * ratio), 3);
      }
      if (rank > 0) {
        ctx.fillStyle = '#FACC15';
        for (let i = 0; i < rank; i++) ctx.fillRect(x0 + i * 5, y - 5, 3, 3);
      }
      if (cg) {
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(String(cg), x0 - 2, y + 4);
      }
    }

    drawWorldBar(ctx, x, y, w, ratio, color, opts = {}) {
      const r = clamp(ratio, 0, 1);
      const x0 = Math.round(x - w * 0.5);
      const y0 = Math.round(y);
      ctx.save();
      ctx.fillStyle = '#141118';
      ctx.fillRect(x0 - 1, y0 - 1, w + 2, 6);
      ctx.fillStyle = '#262019';
      ctx.fillRect(x0, y0, w, 4);

      if (opts.paused) {
        ctx.fillStyle = '#991B1B';
        ctx.fillRect(x0, y0, Math.round(w * r), 4);
        ctx.fillStyle = '#EF4444';
        for (let sx = 0; sx < w; sx += 6) ctx.fillRect(x0 + sx, y0, 3, 4);
      } else {
        const fw = Math.round(w * r);
        if (fw > 0) {
          ctx.fillStyle = color;
          ctx.fillRect(x0, y0, fw, 4);
          if (opts.animateTime !== undefined && fw >= 6) {
            const gx = Math.floor(((opts.animateTime * 36) % Math.max(8, fw))) - 2;
            const sx = Math.max(x0, x0 + gx);
            const sw = Math.min(4, x0 + fw - sx);
            if (sw > 0) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
              ctx.fillRect(sx, y0, sw, 4);
            }
          }
        }
      }

      if (opts.wrenchTime !== undefined) {
        this.drawMiniWrench(ctx, x0 - 6, y0 + 2, opts.wrenchTime, opts.wrenchMode || 'auto');
      }
      if (opts.badgeText) {
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#141118';
        ctx.fillText(opts.badgeText, x0 + w + 4, y0 + 5);
        ctx.fillStyle = opts.badgeColor || '#EFE6D2';
        ctx.fillText(opts.badgeText, x0 + w + 3, y0 + 4);
      }
      ctx.restore();
    }

    drawMiniWrench(ctx, x, y, t, mode = 'auto') {
      const col = mode === 'auto' ? '#34D399' : '#FACC15';
      const step = Math.round(Math.sin(Math.floor(t * 10) / 10 * 10.5));
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (step !== 0) ctx.rotate(step * 0.35);
      ctx.fillStyle = '#141118';
      ctx.fillRect(-3, -5, 6, 9);
      ctx.fillStyle = col;
      ctx.fillRect(-1, -1, 2, 4);
      ctx.fillRect(-2, -4, 1, 3);
      ctx.fillRect(1, -4, 1, 3);
      ctx.fillRect(-2, -2, 4, 1);
      ctx.restore();
    }

    renderMinimap(ctx, w, h, sim, cam, vw, vh) {
      const worldW = sim.worldW || WORLD_WIDTH;
      const worldH = sim.worldH || WORLD_HEIGHT;
      const biome = FL.MAPS ? FL.MAPS.getBiome(sim.currentMap && sim.currentMap.biome) : null;
      const mm = (biome && biome.minimap) || { bg: '#4A3A29', grid: 'rgba(212, 169, 66, 0.08)', road: '#5C452F', pad: '#696256', rock: '#33261A' };

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = mm.bg;
      ctx.fillRect(0, 0, w, h);
      const sx = w / worldW, sy = h / worldH;

      // Subtle roads and concrete pads on tactical radar
      if (sim.currentMap) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = mm.road;
        for (const road of sim.currentMap.roads || []) {
          if (!road.points || road.points.length < 2) continue;
          ctx.lineWidth = Math.max(1.5, (road.width || 60) * sx);
          traceRoadPath(ctx, road.points, sx, sy, road.smooth !== false);
          ctx.stroke();
        }
        ctx.fillStyle = mm.pad;
        for (const pad of sim.currentMap.expandedPads || []) {
          const pw = (pad.w || 368) * sx;
          const ph = (pad.h || 268) * sy;
          ctx.fillRect(pad.x * sx - pw * 0.5, pad.y * sy - ph * 0.5, pw, ph);
        }
        ctx.restore();
      }

      ctx.strokeStyle = mm.grid;
      ctx.lineWidth = 1;
      for (let gx = w * 0.25; gx < w; gx += w * 0.25) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let gy = h * 0.25; gy < h; gy += h * 0.25) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      for (const r of sim.obstacles) {
        ctx.fillStyle = mm.rock;
        const rw = Math.max(3, r.radius * sx * 1.6);
        const rh = Math.max(3, r.radius * sy * 1.6);
        ctx.fillRect(r.x * sx - rw * 0.5, r.y * sy - rh * 0.5, rw, rh);
      }
      for (const o of sim.supplyNodes) {
        if (o.amount <= 0) continue;
        ctx.fillStyle = '#EAB308';
        ctx.fillRect(o.x * sx - 1.5, o.y * sy - 1.5, 3, 3);
      }
      for (const cp of sim.capturePoints) {
        ctx.fillStyle = cp.owner === 'red' ? '#EF4444' : cp.owner === 'green' ? '#84CC16' : '#FBBF24';
        ctx.fillRect(cp.x * sx - 3, cp.y * sy - 3, 6, 6);
      }
      const pf = sim.playerFaction;
      for (const b of sim.buildings) {
        if (b.koTimer > 0) continue;
        if (b.faction !== pf && sim.fog && !sim.fog.isExplored(b.x, b.y)) continue;
        ctx.fillStyle = b.faction === 'red' ? '#EF4444' : '#84CC16';
        ctx.fillRect(b.x * sx - 3, b.y * sy - 3, 6, 6);
      }
      for (const u of sim.units) {
        if (u.koTimer > 0) continue;
        if (u.faction !== pf && sim.fog && !sim.fog.isVisible(u.x, u.y)) continue;
        ctx.fillStyle = u.faction === 'red' ? '#FCA5A5' : '#BEF264';
        ctx.fillRect(u.x * sx - 1.5, u.y * sy - 1.5, 3, 3);
      }

      if (sim.fog && !sim.demoMode) sim.fog.renderMinimap(ctx, w, h);

      const camL = (cam.x - vw / (2 * cam.zoom)) * sx;
      const camT = (cam.y - vh / (2 * cam.zoom)) * sy;
      const camW = (vw / cam.zoom) * sx;
      const camH = (vh / cam.zoom) * sy;
      ctx.strokeStyle = '#EFE6D2';
      ctx.lineWidth = 1;
      ctx.strokeRect(camL, camT, camW, camH);
    }
  }

  GameRenderer.renderMapThumbnail = function renderMapThumbnail(canvas, rawMap) {
    if (!canvas || !rawMap) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const map = FL.MAPS ? FL.MAPS.expandMap(rawMap) : rawMap;
    const worldW = (map.size && map.size.w) || WORLD_WIDTH;
    const worldH = (map.size && map.size.h) || WORLD_HEIGHT;
    const biome = FL.MAPS ? FL.MAPS.getBiome(map.biome) : null;
    const mm = (biome && biome.minimap) || { bg: '#4A3A29', grid: 'rgba(212,169,66,0.10)', road: '#5C452F', pad: '#696256', rock: '#2E2217' };

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = mm.bg;
    ctx.fillRect(0, 0, w, h);

    // Letterbox preserving exact aspect ratio inside preview box
    const scale = Math.min((w - 6) / worldW, (h - 6) / worldH);
    const ox = (w - worldW * scale) * 0.5;
    const oy = (h - worldH * scale) * 0.5;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = (biome && biome.terrain && biome.terrain.lo) || mm.bg;
    ctx.globalAlpha = 0.32;
    ctx.fillRect(0, 0, worldW * scale, worldH * scale);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = mm.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, worldW * scale - 1, worldH * scale - 1);

    // Roads
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = mm.road;
    for (const road of map.roads || []) {
      if (!road.points || road.points.length < 2) continue;
      ctx.lineWidth = Math.max(1.5, (road.width || 60) * scale);
      traceRoadPath(ctx, road.points, scale, scale, road.smooth !== false);
      ctx.stroke();
    }

    // Pads
    ctx.fillStyle = mm.pad;
    for (const pad of map.expandedPads || []) {
      const pw = Math.max(4, (pad.w || 368) * scale);
      const ph = Math.max(3, (pad.h || 268) * scale);
      ctx.fillRect(pad.x * scale - pw * 0.5, pad.y * scale - ph * 0.5, pw, ph);
    }

    // Rocks
    ctx.fillStyle = mm.rock;
    for (const r of map.obstacles || []) {
      const rr = Math.max(1.5, r.radius * scale);
      ctx.beginPath();
      ctx.arc(r.x * scale, r.y * scale, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Supplies
    ctx.fillStyle = '#FACC15';
    for (const s of map.expandedSupplyNodes || []) {
      ctx.fillRect(s.x * scale - 1, s.y * scale - 1, 2.2, 2.2);
    }

    // Capture points
    ctx.fillStyle = '#F59E0B';
    for (const cp of map.capturePoints || []) {
      ctx.fillRect(cp.x * scale - 2.5, cp.y * scale - 2.5, 5, 5);
    }

    // Spawns
    for (const sp of map.spawns || []) {
      ctx.fillStyle = sp.slot === 'enemy' ? '#84CC16' : '#EF4444';
      ctx.strokeStyle = '#120E0B';
      ctx.lineWidth = 1;
      ctx.fillRect(sp.x * scale - 3.5, sp.y * scale - 3.5, 7, 7);
      ctx.strokeRect(sp.x * scale - 3.5, sp.y * scale - 3.5, 7, 7);
    }

    ctx.restore();
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  FL.GameRenderer = GameRenderer;
})();
