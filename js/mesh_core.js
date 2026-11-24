(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});

  const RED_PAL = {
    main:     [0.80, 0.17, 0.14],
    hi:       [0.91, 0.28, 0.22],
    shade:    [0.54, 0.11, 0.10],
    sub:      [0.37, 0.39, 0.44],
    silver:   [0.70, 0.74, 0.80],
    dark:     [0.16, 0.16, 0.19],
    glass:    [0.14, 0.42, 0.88],
    tan:      [0.85, 0.69, 0.36],
    tanDark:  [0.64, 0.49, 0.23],
    brown:    [0.50, 0.32, 0.20],
    white:    [0.94, 0.94, 0.94],
    lamp:     [1.00, 0.86, 0.30],
    amber:    [0.93, 0.65, 0.18],
    ion:      [1.00, 0.34, 0.20],
    glow:     [1.00, 0.22, 0.18],
    obsidian: [0.13, 0.14, 0.17]
  };

  const GREEN_PAL = {
    main:     [0.42, 0.49, 0.20],
    hi:       [0.53, 0.60, 0.26],
    shade:    [0.27, 0.33, 0.13],
    sub:      [0.38, 0.40, 0.36],
    silver:   [0.68, 0.71, 0.69],
    dark:     [0.16, 0.17, 0.16],
    glass:    [0.15, 0.43, 0.84],
    tan:      [0.84, 0.68, 0.36],
    tanDark:  [0.62, 0.48, 0.23],
    brown:    [0.49, 0.31, 0.19],
    white:    [0.94, 0.94, 0.92],
    lamp:     [1.00, 0.86, 0.32],
    amber:    [0.88, 0.64, 0.20],
    ion:      [0.16, 0.56, 1.00],
    glow:     [1.00, 0.20, 0.16],
    obsidian: [0.15, 0.16, 0.15]
  };

  const NEUTRAL_PAL = {
    main:     [0.58, 0.53, 0.44],
    hi:       [0.68, 0.63, 0.52],
    shade:    [0.40, 0.36, 0.29],
    sub:      [0.42, 0.41, 0.39],
    silver:   [0.68, 0.69, 0.67],
    dark:     [0.19, 0.18, 0.17],
    glass:    [0.18, 0.42, 0.74],
    tan:      [0.82, 0.68, 0.38],
    tanDark:  [0.60, 0.47, 0.24],
    brown:    [0.48, 0.33, 0.21],
    white:    [0.90, 0.89, 0.85],
    lamp:     [1.00, 0.84, 0.32],
    amber:    [0.89, 0.65, 0.22],
    ion:      [0.35, 0.78, 0.94],
    glow:     [0.95, 0.74, 0.22],
    obsidian: [0.16, 0.16, 0.17]
  };

  // =========================================================================
  // PROCEDURAL 3D MESH BUILDER (12 floats / 48 bytes per vertex)
  // [x, y, z, nx, ny, nz, r, g, b, emissive, matId, vAo]
  // matId: 0=armor/concrete grain, 1=ribbed track/rubber, 2=hazard stripes,
  //        3=layered terrain/carapace, 4=clean/glass/emissive specular
  // =========================================================================
  class MeshBuilder {
    constructor() {
      this.verts = [];
      this.minZ = 1e9;
      this.maxZ = -1e9;
    }

    pushVert(p, n, col, em, mat, ao) {
      this.verts.push(p[0], p[1], p[2], n[0], n[1], n[2], col[0], col[1], col[2], em, mat, ao);
      if (p[2] < this.minZ) this.minZ = p[2];
      if (p[2] > this.maxZ) this.maxZ = p[2];
    }

    pushTri(a, b, c, na, nb, nc, col, em = 0, mat = 0, aoA = 1, aoB = 1, aoC = 1) {
      this.pushVert(a, na, col, em, mat, aoA);
      this.pushVert(b, nb, col, em, mat, aoB);
      this.pushVert(c, nc, col, em, mat, aoC);
    }

    pushFlatQuad(a, b, c, d, col, em = 0, mat = 0, aoBot = 1, aoTop = 1) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      const n = [nx / l, ny / l, nz / l];
      this.pushTri(a, b, c, n, n, n, col, em, mat, aoBot, aoBot, aoTop);
      this.pushTri(a, c, d, n, n, n, col, em, mat, aoBot, aoTop, aoTop);
    }

    pushSmoothQuad(a, b, c, d, na, nb, nc, nd, col, em = 0, mat = 0, aoA = 1, aoB = 1, aoC = 1, aoD = 1) {
      this.pushTri(a, b, c, na, nb, nc, col, em, mat, aoA, aoB, aoC);
      this.pushTri(a, c, d, na, nc, nd, col, em, mat, aoA, aoC, aoD);
    }

    wedge(cx, cy, z0, sx0, sy0, sx1, sy1, h, col, em = 0, shiftTopX = 0, mat = 0, aoBot = 0.84, aoTop = 1.0) {
      const z1 = z0 + h;
      const hx0 = sx0 * 0.5, hy0 = sy0 * 0.5;
      const hx1 = sx1 * 0.5, hy1 = sy1 * 0.5;
      const tx = cx + shiftTopX;
      const b0 = [cx - hx0, cy - hy0, z0], b1 = [cx + hx0, cy - hy0, z0];
      const b2 = [cx + hx0, cy + hy0, z0], b3 = [cx - hx0, cy + hy0, z0];
      const t0 = [tx - hx1, cy - hy1, z1], t1 = [tx + hx1, cy - hy1, z1];
      const t2 = [tx + hx1, cy + hy1, z1], t3 = [tx - hx1, cy + hy1, z1];
      this.pushFlatQuad(t0, t1, t2, t3, col, em, mat, aoTop, aoTop);
      this.pushFlatQuad(b3, b2, b1, b0, col, em, mat, aoBot, aoBot);
      this.pushFlatQuad(b1, b2, t2, t1, col, em, mat, aoBot, aoTop);
      this.pushFlatQuad(b3, b0, t0, t3, col, em, mat, aoBot, aoTop);
      this.pushFlatQuad(b2, b3, t3, t2, col, em, mat, aoBot, aoTop);
      this.pushFlatQuad(b0, b1, t1, t0, col, em, mat, aoBot, aoTop);
    }

    bevelBox(cx, cy, cz, sx, sy, sz, bev, col, em = 0, mat = 0, aoBot = 0.84, aoTop = 1.0) {
      const b = Math.min(bev, sx * 0.28, sy * 0.28, sz * 0.30);
      if (b < 0.35) {
        this.wedge(cx, cy, cz - sz * 0.5, sx, sy, sx, sy, sz, col, em, 0, mat, aoBot, aoTop);
        return;
      }
      const z0 = cz - sz * 0.5;
      const midH = sz - 2 * b;
      const aoMidL = aoBot + (aoTop - aoBot) * 0.25;
      const aoMidH = aoBot + (aoTop - aoBot) * 0.88;
      this.wedge(cx, cy, z0, sx - 2 * b, sy - 2 * b, sx, sy, b, col, em, 0, mat, aoBot, aoMidL);
      this.wedge(cx, cy, z0 + b, sx, sy, sx, sy, midH, col, em, 0, mat, aoMidL, aoMidH);
      this.wedge(cx, cy, z0 + b + midH, sx, sy, sx - 2 * b, sy - 2 * b, b, col, em, 0, mat, aoMidH, aoTop);
    }

    bevelWedge(cx, cy, z0, sx0, sy0, sx1, sy1, h, bev, col, em = 0, mat = 0, aoBot = 0.82, aoTop = 1.0) {
      const b = Math.min(bev, sx1 * 0.26, sy1 * 0.26, h * 0.28);
      if (b < 0.35) {
        this.wedge(cx, cy, z0, sx0, sy0, sx1, sy1, h, col, em, 0, mat, aoBot, aoTop);
        return;
      }
      const mainH = h - b;
      const aoRim = aoBot + (aoTop - aoBot) * 0.88;
      this.wedge(cx, cy, z0, sx0, sy0, sx1, sy1, mainH, col, em, 0, mat, aoBot, aoRim);
      this.wedge(cx, cy, z0 + mainH, sx1, sy1, sx1 - 2 * b, sy1 - 2 * b, b, col, em, 0, mat, aoRim, aoTop);
    }

    box(cx, cy, cz, sx, sy, sz, col, em = 0, mat = 0, aoBot = 0.86, aoTop = 1.0) {
      this.wedge(cx, cy, cz - sz * 0.5, sx, sy, sx, sy, sz, col, em, 0, mat, aoBot, aoTop);
    }

    cylZ(cx, cy, z0, r0, r1, h, segs, col, em = 0, rotOffset = 0, mat = 0, flat = false, aoBot = 0.82, aoTop = 1.0) {
      const z1 = z0 + h;
      const slopeZ = (r0 - r1) / Math.max(0.001, h);
      const nLen = Math.hypot(1, slopeZ);
      const nz = slopeZ / nLen, nr = 1 / nLen;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2 + rotOffset;
        const a1 = ((i + 1) / segs) * Math.PI * 2 + rotOffset;
        const c0 = Math.cos(a0), s0 = Math.sin(a0);
        const c1 = Math.cos(a1), s1 = Math.sin(a1);
        const b0 = [cx + c0 * r0, cy + s0 * r0, z0];
        const b1 = [cx + c1 * r0, cy + s1 * r0, z0];
        const t1 = [cx + c1 * r1, cy + s1 * r1, z1];
        const t0 = [cx + c0 * r1, cy + s0 * r1, z1];
        if (flat) {
          this.pushFlatQuad(b0, b1, t1, t0, col, em, mat, aoBot, aoTop);
        } else {
          const n0 = [c0 * nr, s0 * nr, nz];
          const n1 = [c1 * nr, s1 * nr, nz];
          this.pushSmoothQuad(b0, b1, t1, t0, n0, n1, n1, n0, col, em, mat, aoBot, aoBot, aoTop, aoTop);
        }
        if (r1 > 0.01) this.pushTri([cx, cy, z1], t0, t1, [0, 0, 1], [0, 0, 1], [0, 0, 1], col, em, mat, aoTop, aoTop, aoTop);
        if (r0 > 0.01) this.pushTri([cx, cy, z0], b1, b0, [0, 0, -1], [0, 0, -1], [0, 0, -1], col, em, mat, aoBot, aoBot, aoBot);
      }
    }

    cylX(x0, cy, cz, r0, r1, len, segs, col, em = 0, mat = 0) {
      const x1 = x0 + len;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0);
        const c1 = Math.cos(a1), s1 = Math.sin(a1);
        const p0 = [x0, cy + c0 * r0, cz + s0 * r0];
        const p1 = [x0, cy + c1 * r0, cz + s1 * r0];
        const q1 = [x1, cy + c1 * r1, cz + s1 * r1];
        const q0 = [x1, cy + c0 * r1, cz + s0 * r1];
        const n0 = [0, c0, s0], n1 = [0, c1, s1];
        const ao0 = s0 < 0 ? 0.78 : 1.0, ao1 = s1 < 0 ? 0.78 : 1.0;
        this.pushSmoothQuad(p0, p1, q1, q0, n0, n1, n1, n0, col, em, mat, ao0, ao1, ao1, ao0);
        if (r1 > 0.01) this.pushTri([x1, cy, cz], q0, q1, [1, 0, 0], [1, 0, 0], [1, 0, 0], col, em, mat, 1, 1, 1);
        if (r0 > 0.01) this.pushTri([x0, cy, cz], p1, p0, [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], col, em, mat, 0.85, 0.85, 0.85);
      }
    }

    cylY(cx, y0, cz, r0, r1, len, segs, col, em = 0, mat = 0) {
      const y1 = y0 + len;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0);
        const c1 = Math.cos(a1), s1 = Math.sin(a1);
        const p0 = [cx + c0 * r0, y0, cz + s0 * r0];
        const p1 = [cx + c1 * r0, y0, cz + s1 * r0];
        const q1 = [cx + c1 * r1, y1, cz + s1 * r1];
        const q0 = [cx + c0 * r1, y1, cz + s0 * r1];
        const n0 = [c0, 0, s0], n1 = [c1, 0, s1];
        const ao0 = s0 < 0 ? 0.72 : 1.0, ao1 = s1 < 0 ? 0.72 : 1.0;
        this.pushSmoothQuad(p0, q0, q1, p1, n0, n0, n1, n1, col, em, mat, ao0, ao0, ao1, ao1);
        if (r1 > 0.01) this.pushTri([cx, y1, cz], q1, q0, [0, 1, 0], [0, 1, 0], [0, 1, 0], col, em, mat, 0.92, 0.92, 0.92);
        if (r0 > 0.01) this.pushTri([cx, y0, cz], p0, p1, [0, -1, 0], [0, -1, 0], [0, -1, 0], col, em, mat, 0.92, 0.92, 0.92);
      }
    }

    torusZ(cx, cy, cz, R, r, segM, segT, col, em = 0, mat = 0) {
      for (let i = 0; i < segM; i++) {
        const a0 = (i / segM) * Math.PI * 2, a1 = ((i + 1) / segM) * Math.PI * 2;
        const ca0 = Math.cos(a0), sa0 = Math.sin(a0), ca1 = Math.cos(a1), sa1 = Math.sin(a1);
        for (let j = 0; j < segT; j++) {
          const b0 = (j / segT) * Math.PI * 2, b1 = ((j + 1) / segT) * Math.PI * 2;
          const cb0 = Math.cos(b0), sb0 = Math.sin(b0), cb1 = Math.cos(b1), sb1 = Math.sin(b1);
          const p00 = [cx + (R + r * cb0) * ca0, cy + (R + r * cb0) * sa0, cz + r * sb0];
          const p10 = [cx + (R + r * cb0) * ca1, cy + (R + r * cb0) * sa1, cz + r * sb0];
          const p11 = [cx + (R + r * cb1) * ca1, cy + (R + r * cb1) * sa1, cz + r * sb1];
          const p01 = [cx + (R + r * cb1) * ca0, cy + (R + r * cb1) * sa0, cz + r * sb1];
          const n00 = [cb0 * ca0, cb0 * sa0, sb0], n10 = [cb0 * ca1, cb0 * sa1, sb0];
          const n11 = [cb1 * ca1, cb1 * sa1, sb1], n01 = [cb1 * ca0, cb1 * sa0, sb1];
          const ao0 = sb0 < 0 ? 0.72 : 1.0, ao1 = sb1 < 0 ? 0.72 : 1.0;
          this.pushSmoothQuad(p00, p10, p11, p01, n00, n10, n11, n01, col, em, mat, ao0, ao0, ao1, ao1);
        }
      }
    }

    sphere(cx, cy, cz, rx, ry, rz, segU, segV, col, em = 0, mat = 0) {
      const ptN = (u, v) => {
        const phi = u * Math.PI * 2;
        const th = (v - 0.5) * Math.PI;
        const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(phi), sp = Math.sin(phi);
        const dx = cp * ct * rx, dy = sp * ct * ry, dz = st * rz;
        const nx = dx / (rx * rx), ny = dy / (ry * ry), nz = dz / (rz * rz);
        const nl = Math.hypot(nx, ny, nz) || 1;
        return { p: [cx + dx, cy + dy, cz + dz], n: [nx / nl, ny / nl, nz / nl], ao: st < -0.2 ? 0.76 : 1.0 };
      };
      for (let iv = 0; iv < segV; iv++) {
        const v0 = iv / segV, v1 = (iv + 1) / segV;
        for (let iu = 0; iu < segU; iu++) {
          const u0 = iu / segU, u1 = (iu + 1) / segU;
          const a = ptN(u0, v0), b = ptN(u1, v0), c = ptN(u1, v1), d = ptN(u0, v1);
          if (iv > 0) this.pushTri(a.p, b.p, c.p, a.n, b.n, c.n, col, em, mat, a.ao, b.ao, c.ao);
          if (iv < segV - 1) this.pushTri(a.p, c.p, d.p, a.n, c.n, d.n, col, em, mat, a.ao, c.ao, d.ao);
        }
      }
    }

    dish(cx, cy, cz, radius, depth, segs, colInner, colOuter) {
      const tilt = 0.56, ct = Math.cos(tilt), st = Math.sin(tilt);
      const tf = (lx, ly, lz) => [cx + lx * ct - lz * st, cy + ly, cz + lx * st + lz * ct];
      const rings = 4;
      for (let ir = 0; ir < rings; ir++) {
        const r0 = (ir / rings) * radius, r1 = ((ir + 1) / rings) * radius;
        const x0 = (r0 * r0) / (radius * radius) * depth;
        const x1 = (r1 * r1) / (radius * radius) * depth;
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
          const p00 = tf(x0, Math.cos(a0) * r0, Math.sin(a0) * r0);
          const p10 = tf(x1, Math.cos(a0) * r1, Math.sin(a0) * r1);
          const p11 = tf(x1, Math.cos(a1) * r1, Math.sin(a1) * r1);
          const p01 = tf(x0, Math.cos(a1) * r0, Math.sin(a1) * r0);
          const col = ir === rings - 1 ? colOuter : colInner;
          this.pushFlatQuad(p00, p01, p11, p10, col, 0, 0, 0.85, 1.0);
          const q00 = tf(x0 - 2.4, Math.cos(a0) * r0, Math.sin(a0) * r0);
          const q10 = tf(x1 - 2.4, Math.cos(a0) * r1, Math.sin(a0) * r1);
          const q11 = tf(x1 - 2.4, Math.cos(a1) * r1, Math.sin(a1) * r1);
          const q01 = tf(x0 - 2.4, Math.cos(a1) * r0, Math.sin(a1) * r0);
          this.pushFlatQuad(q00, q10, q11, q01, colOuter, 0, 0, 0.78, 0.92);
        }
      }
    }

    finish() {
      return {
        data: new Float32Array(this.verts),
        count: this.verts.length / 12,
        minZ: this.minZ === 1e9 ? 0 : this.minZ,
        maxZ: this.maxZ === -1e9 ? 1 : this.maxZ
      };
    }
  }

  function addTransformed(dst, src, tx = 0, ty = 0, tz = 0, rx = 0, ry = 0, rz = 0) {
    const cx = Math.cos(rx), sxr = Math.sin(rx);
    const cy = Math.cos(ry), syr = Math.sin(ry);
    const cz = Math.cos(rz), szr = Math.sin(rz);
    const m00 = cz * cy, m01 = cz * syr * sxr - szr * cx, m02 = cz * syr * cx + szr * sxr;
    const m10 = szr * cy, m11 = szr * syr * sxr + cz * cx, m12 = szr * syr * cx - cz * sxr;
    const m20 = -syr, m21 = cy * sxr, m22 = cy * cx;

    const v = src.verts;
    for (let i = 0; i < v.length; i += 12) {
      const px = v[i], py = v[i + 1], pz = v[i + 2];
      const nx = v[i + 3], ny = v[i + 4], nz = v[i + 5];
      dst.pushVert(
        [m00 * px + m01 * py + m02 * pz + tx, m10 * px + m11 * py + m12 * pz + ty, m20 * px + m21 * py + m22 * pz + tz],
        [m00 * nx + m01 * ny + m02 * nz, m10 * nx + m11 * ny + m12 * nz, m20 * nx + m21 * ny + m22 * nz],
        [v[i + 6], v[i + 7], v[i + 8]], v[i + 9], v[i + 10], v[i + 11]
      );
    }
  }

  function cylPts(b, x0, y0, z0, x1, y1, z1, r0, r1, segs, col, em = 0, mat = 0) {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    const len = Math.hypot(dx, dy, dz);
    if (len < 0.01) return;
    const wx = dx / len, wy = dy / len, wz = dz / len;
    let ux, uy, uz;
    if (Math.abs(wz) < 0.9) {
      const rl = Math.hypot(-wy, wx) || 1;
      ux = -wy / rl; uy = wx / rl; uz = 0;
    } else {
      const rl = Math.hypot(wz, -wy) || 1;
      ux = 0; uy = -wz / rl; uz = wy / rl;
    }
    const vx = wy * uz - wz * uy;
    const vy = wz * ux - wx * uz;
    const vz = wx * uy - wy * ux;

    const tmp = new MeshBuilder();
    tmp.cylZ(0, 0, 0, r0, r1, len, segs, col, em, 0, mat, false, 0.85, 1.0);
    const v = tmp.verts;
    for (let i = 0; i < v.length; i += 12) {
      const lx = v[i], ly = v[i + 1], lz = v[i + 2];
      const lnx = v[i + 3], lny = v[i + 4], lnz = v[i + 5];
      b.pushVert(
        [ux * lx + vx * ly + wx * lz + x0, uy * lx + vy * ly + wy * lz + y0, uz * lx + vz * ly + wz * lz + z0],
        [ux * lnx + vx * lny + wx * lnz, uy * lnx + vy * lny + wy * lnz, uz * lnx + vz * lny + wz * lnz],
        [v[i + 6], v[i + 7], v[i + 8]], v[i + 9], v[i + 10], v[i + 11]
      );
    }
  }

  function addWheel(b, cx, yCenter, cz, r, w, pal, outSign) {
    const y0 = yCenter - w * 0.5;
    b.cylY(cx, y0, cz, r, r, w, 12, pal.dark, 0, 1);
    const rimY0 = outSign > 0 ? y0 + w * 0.15 : y0 - 0.35;
    b.cylY(cx, rimY0, cz, r * 0.56, r * 0.56, w * 0.85 + 0.35, 10, pal.sub, 0, 0);
    const hubY = outSign > 0 ? y0 + w * 0.45 : y0 - 0.6;
    b.cylY(cx, hubY, cz, r * 0.28, r * 0.28, w * 0.55 + 0.6, 8, pal.silver, 0, 0);
  }

  function addTrackPod(b, x0, x1, yCenter, w, h, bogies, pal, skirtCol = null, lowerWheels = true) {
    const midX = (x0 + x1) * 0.5;
    const len = x1 - x0;
    const r = h * 0.5;
    const cz = r;
    const y0 = yCenter - w * 0.5;
    b.bevelBox(midX, yCenter, cz, len - h * 0.6, w, h, 1.1, pal.dark, 0, 1, 0.68, 0.94);
    b.cylY(x1 - r, y0, cz, r, r, w, 10, pal.dark, 0, 1);
    b.cylY(x0 + r, y0, cz, r, r, w, 10, pal.dark, 0, 1);

    if (lowerWheels) {
      const wheelR = r * 0.56;
      for (let i = 0; i < bogies; i++) {
        const wx = (x0 + r * 1.1) + (i / Math.max(1, bogies - 1)) * (len - r * 2.2);
        b.cylY(wx, y0 - 0.35, wheelR + 0.5, wheelR, wheelR, w + 0.7, 10, pal.sub, 0, 0);
        b.cylY(wx, y0 - 0.55, wheelR + 0.5, wheelR * 0.48, wheelR * 0.48, w + 1.1, 8, pal.silver, 0, 0);
      }
    }

    if (skirtCol) {
      b.bevelBox(midX, yCenter, h - 0.6, len + 2.2, w + 1.4, 3.8, 0.9, skirtCol, 0, 0, 0.84, 1.0);
    }
  }

  function addCanvasTarp(b, x0, x1, cy, w, zBase, h, ribs, pal) {
    const r = w * 0.5;
    const archH = Math.min(r * 0.56, h * 0.45);
    const wallH = Math.max(2.0, h - archH);
    const squishZ = archH / Math.max(0.1, r);
    const span = x1 - x0;
    const segLen = span / ribs;
    for (let i = 0; i < ribs; i++) {
      const rx = x0 + (i + 0.5) * segLen;
      const sx = segLen * 0.90;
      const arch = new MeshBuilder();
      arch.bevelBox(0, 0, zBase + wallH * 0.5, sx, w, wallH, 0.7, pal.tan, 0, 0, 0.80, 0.96);
      const dome = new MeshBuilder();
      dome.cylX(-sx * 0.47, 0, 0, r, r, sx * 0.94, 12, pal.tan, 0, 0);
      const dv = dome.verts;
      for (let j = 0; j < dv.length; j += 12) {
        const nz = dv[j + 5] / squishZ;
        const nl = Math.hypot(dv[j + 3], dv[j + 4], nz) || 1;
        b.pushVert(
          [rx + dv[j], cy + dv[j + 1], zBase + wallH - 0.3 + Math.max(0, dv[j + 2]) * squishZ],
          [dv[j + 3] / nl, dv[j + 4] / nl, nz / nl],
          [dv[j + 6], dv[j + 7], dv[j + 8]], dv[j + 9], dv[j + 10], dv[j + 11]
        );
      }
      addTransformed(b, arch, rx, cy, 0);
      if (i < ribs - 1) {
        const seamX = x0 + (i + 1) * segLen;
        b.bevelBox(seamX, cy, zBase + (wallH + archH * 0.65) * 0.5, segLen * 0.16, w * 0.94, wallH + archH * 0.65, 0.35, pal.tanDark, 0, 0, 0.70, 0.86);
      }
    }
  }

  function addInsigniaSide(b, cx, sideY, cz, outSign, pal) {
    b.box(cx, sideY + outSign * 0.3, cz, 3.4, 0.9, 3.4, pal.white, 0, 4, 0.95, 1.0);
    b.box(cx, sideY + outSign * 0.55, cz, 1.6, 0.8, 1.6, pal.main, 0, 4, 0.95, 1.0);
  }

  FL.MESH_CORE = {
    MeshBuilder, RED_PAL, GREEN_PAL, NEUTRAL_PAL,
    addTransformed, cylPts, addWheel, addTrackPod, addCanvasTarp, addInsigniaSide
  };
})();
