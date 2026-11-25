(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});
  const { RED_PAL, GREEN_PAL, NEUTRAL_PAL } = FL.MESH_CORE;
  const { buildUnitMeshes } = FL.UNIT_MESHES;
  const { buildFactionBuildings, buildPropMeshes } = FL.BUILDING_MESHES;

  // Authentic RTS sprite-sheet cadence: 20 FPS animation (exact 60Hz/3) + 32 rotation stops (11.25° each)
  const ANIM_FPS = 20;
  const ANGLE_STOPS = 32;
  const ANGLE_STEP = (Math.PI * 2) / ANGLE_STOPS;
  // Lock asset texel density in world space so zoom/viewport size never alters asset pixel resolution
  const PIXEL_WORLD = 1.0;
  const snapAngle = (a) => Math.round(a / ANGLE_STEP) * ANGLE_STEP;
  const snapTime = (t) => Math.floor(t * ANIM_FPS) / ANIM_FPS;
  const snapVal = (v, steps) => Math.round(v * steps) / steps;

  function mat4Id() {
    const m = new Float32Array(16);
    m[0] = m[5] = m[10] = m[15] = 1;
    return m;
  }
  function mat4Mul(out, a, b) {
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      out[c * 4]     = a[0] * b0 + a[4] * b1 + a[8]  * b2 + a[12] * b3;
      out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9]  * b2 + a[13] * b3;
      out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
  }
  function mat4TRS(out, tx, ty, tz, rx, ry, rz, sx = 1, sy = 1, sz = 1) {
    const cx = Math.cos(rx), sxr = Math.sin(rx);
    const cy = Math.cos(ry), syr = Math.sin(ry);
    const cz = Math.cos(rz), szr = Math.sin(rz);
    out[0] = (cz * cy) * sx;                  out[1] = (szr * cy) * sx;                  out[2]  = (-syr) * sx;     out[3]  = 0;
    out[4] = (cz * syr * sxr - szr * cx) * sy; out[5] = (szr * syr * sxr + cz * cx) * sy; out[6]  = (cy * sxr) * sy;   out[7]  = 0;
    out[8] = (cz * syr * cx + szr * sxr) * sz; out[9] = (szr * syr * cx - cz * sxr) * sz; out[10] = (cy * cx) * sz;    out[11] = 0;
    out[12] = tx;                              out[13] = ty;                              out[14] = tz;              out[15] = 1;
    return out;
  }

  const ENTITY_VERT = `
    precision mediump float;
    attribute vec3 aPos;
    attribute vec3 aNorm;
    attribute vec3 aCol;
    attribute float aEm;
    attribute float aMat;
    attribute float aAo;

    uniform mat4 uLocalMat;
    uniform vec2 uEntityPos;
    uniform vec2 uCamPos;
    uniform vec2 uViewSize;
    uniform float uShadowPass;
    uniform float uDestroy;
    uniform float uZMin;
    uniform float uZMax;
    uniform float uAirBias;

    varying vec3 vNorm;
    varying vec3 vCol;
    varying vec3 vModelPos;
    varying float vEm;
    varying float vMat;
    varying float vAo;
    varying float vNormZ;
    varying float vHeightZ;

    void main() {
      vec4 lp = uLocalMat * vec4(aPos, 1.0);
      vec3 wn = (uLocalMat * vec4(aNorm, 0.0)).xyz;
      vNormZ = clamp((lp.z - uZMin) / max(0.1, uZMax - uZMin), 0.0, 1.0);
      vModelPos = aPos;

      if (uDestroy > 0.001) {
        float amp = 2.4 * (1.0 - uDestroy * 0.6);
        lp.x += sin(uDestroy * 92.0 + lp.z * 0.3) * amp;
        lp.y += cos(uDestroy * 108.0 + lp.x * 0.3) * amp;
      }

      float ox = lp.x;
      float oy = lp.y;
      float oz = max(0.0, lp.z);
      vHeightZ = oz;

      if (uShadowPass > 0.5) {
        ox += oz * 0.72;
        oy -= oz * 0.36;
        oz = 0.0;
      }

      float sx = (uEntityPos.x + ox) - uCamPos.x;
      float sy = (uEntityPos.y - uCamPos.y) + oy * 0.68 - oz * 0.73;

      float ndcX = sx / (uViewSize.x * 0.5);
      float ndcY = -(sy / (uViewSize.y * 0.5));
      float ndcZ = uShadowPass > 0.5
        ? 0.95
        : clamp(-((uEntityPos.y - uCamPos.y) + oy * 0.73 + oz * 0.68) / 2600.0 - uAirBias, -0.92, 0.92);

      gl_Position = vec4(ndcX, ndcY, ndcZ, 1.0);
      vNorm = wn;
      vCol = aCol;
      vEm = aEm;
      vMat = aMat;
      vAo = aAo;
    }
  `;

  const ENTITY_FRAG = `
    precision mediump float;
    uniform float uShadowPass;
    uniform float uBuildProg;
    uniform float uHitFlash;
    uniform float uCharred;
    uniform float uHologram;
    uniform float uDestroy;

    varying vec3 vNorm;
    varying vec3 vCol;
    varying vec3 vModelPos;
    varying float vEm;
    varying float vMat;
    varying float vAo;
    varying float vNormZ;
    varying float vHeightZ;

    float hash3(vec3 p) {
      vec3 q = fract(p * vec3(0.1031, 0.1030, 0.0973));
      q += dot(q, q.yxz + 33.33);
      return fract((q.x + q.y) * q.z);
    }

    void main() {
      if (uBuildProg < 0.999 && vNormZ > uBuildProg) discard;
      if (uShadowPass > 0.5) {
        gl_FragColor = vec4(0.06, 0.05, 0.04, 0.44);
        return;
      }

      vec3 n = normalize(vNorm);
      vec3 L = normalize(vec3(-0.65, 0.26, 0.71));
      float rawDiff = clamp(dot(n, L), -0.35, 1.0);
      float normDiff = (rawDiff + 0.35) / 1.35;
      float qDiff = floor(normDiff * 14.0 + 0.5) / 14.0;

      float groundAo = mix(0.78, 1.0, clamp(vHeightZ / 7.5, 0.0, 1.0));
      float ao = vAo * groundAo;
      vec3 col = vCol;

      if (vEm < 0.8) {
        float grain = (hash3(floor(vModelPos * 0.62)) - 0.5) * 0.085;
        if (vMat > 0.5 && vMat < 1.5) {
          float rib = step(0.5, fract((vModelPos.x + vModelPos.z * 0.45) * 0.34));
          col *= mix(0.78, 1.18, rib);
        } else if (vMat > 1.5 && vMat < 2.5) {
          float st = step(0.5, fract((vModelPos.y + vModelPos.x * 0.5) * 0.22));
          col = mix(vec3(0.15, 0.16, 0.19), col, st);
        } else if (vMat > 2.5 && vMat < 3.5) {
          float seg = step(0.5, fract(vModelPos.x * 0.20 + vModelPos.z * 0.22));
          col *= mix(0.86, 1.08, seg);
        }
        if (vMat < 3.5) col += grain;

        float light = (0.37 + qDiff * 0.76) * ao;
        float shadowMix = clamp(1.0 - qDiff, 0.0, 1.0) * 0.32;
        col = col * light * (1.0 - shadowMix) + vec3(0.094, 0.105, 0.165) * shadowMix;

        float specThresh = vMat > 3.5 ? 0.70 : 0.78;
        float specAmt = vMat > 3.5 ? 0.90 : 0.46;
        if (qDiff > specThresh) {
          col = mix(col, vec3(1.0, 0.98, 0.94), (qDiff - specThresh) * specAmt);
        }
      }

      if (uCharred > 0.5) {
        float g = dot(col, vec3(0.30, 0.59, 0.11));
        col = vec3(g * 0.34, g * 0.32, g * 0.30);
      }

      if (uBuildProg < 0.999) {
        float edge = uBuildProg - vNormZ;
        if (edge < 0.085) col = mix(col, vec3(0.95, 0.78, 0.28), 0.82);
        else if (fract(vNormZ * 14.0) < 0.16) col *= 0.83;
      }

      if (uDestroy > 0.01) {
        float flash = clamp(1.0 - uDestroy * 3.8, 0.0, 1.0);
        float burn = clamp((uDestroy - 0.12) * 1.35, 0.0, 1.0);
        float g = dot(col, vec3(0.30, 0.59, 0.11));
        vec3 charred = vec3(g * 0.22, g * 0.20, g * 0.20);
        float crack = step(0.64, hash3(floor(vModelPos * 0.45)));
        vec3 ember = mix(charred, vec3(1.0, 0.36, 0.05), crack * (1.0 - uDestroy * 0.55));
        col = mix(col, ember, burn);
        col = mix(col, vec3(1.0, 0.86, 0.48), flash * 0.85);
      }

      if (uHitFlash > 0.01) {
        col = mix(col, vec3(1.0, 0.98, 0.90), uHitFlash * 0.78);
      }

      if (abs(uHologram) > 0.5) {
        vec3 hCol = uHologram > 0.0 ? vec3(0.28, 0.88, 0.54) : vec3(0.95, 0.28, 0.28);
        col = mix(col, hCol, 0.62);
        if (fract(vNormZ * 12.0) < 0.22) col *= 1.16;
      }

      float packedH = 0.58 + clamp(vHeightZ / 76.0, 0.0, 1.0) * 0.41;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), packedH);
    }
  `;

  const POST_VERT = `
    precision mediump float;
    attribute vec2 aQuad;
    varying vec2 vUv;
    void main() { vUv = aQuad * 0.5 + 0.5; gl_Position = vec4(aQuad, 0.0, 1.0); }
  `;

  const POST_FRAG = `
    precision mediump float;
    uniform sampler2D uTex;
    uniform vec2 uTexel;
    varying vec2 vUv;

    void main() {
      vec4 c = texture2D(uTex, vUv);
      float aL = texture2D(uTex, vUv - vec2(uTexel.x, 0.0)).a;
      float aR = texture2D(uTex, vUv + vec2(uTexel.x, 0.0)).a;
      float aU = texture2D(uTex, vUv + vec2(0.0, uTexel.y)).a;
      float aD = texture2D(uTex, vUv - vec2(0.0, uTexel.y)).a;

      if (c.a >= 0.56) {
        vec3 col = c.rgb;
        float stepH = 0.024;
        if ((aU >= 0.56 && aU - c.a > stepH) || (aL >= 0.56 && aL - c.a > stepH)) {
          col *= 0.72;
        } else if ((aD >= 0.56 && c.a - aD > stepH) || (aR >= 0.56 && c.a - aR > stepH)) {
          col = min(vec3(1.0), col * 1.08);
        }
        gl_FragColor = vec4(col, 1.0);
        return;
      }

      if (aL >= 0.56 || aR >= 0.56 || aU >= 0.56 || aD >= 0.56) {
        gl_FragColor = vec4(0.072, 0.066, 0.088, 1.0);
        return;
      }

      if (c.a > 0.1) {
        float sa = 0.36;
        gl_FragColor = vec4(c.rgb * sa, sa);
        return;
      }
      gl_FragColor = vec4(0.0);
    }
  `;

  function compileShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function createProgram(gl, vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  class Pixel3DRenderer {
    constructor() {
      this.canvas = document.createElement('canvas');
      this.gl = this.canvas.getContext('webgl', {
        alpha: true, antialias: false, depth: true, premultipliedAlpha: true, preserveDrawingBuffer: false
      });
      if (!this.gl) throw new Error('WebGL unavailable');

      const gl = this.gl;
      this.entProg = createProgram(gl, ENTITY_VERT, ENTITY_FRAG);
      this.postProg = createProgram(gl, POST_VERT, POST_FRAG);

      this.eLoc = {};
      ['aPos', 'aNorm', 'aCol', 'aEm', 'aMat', 'aAo'].forEach((k) => {
        this.eLoc[k] = gl.getAttribLocation(this.entProg, k);
      });
      [
        'uLocalMat', 'uEntityPos', 'uCamPos', 'uViewSize', 'uShadowPass',
        'uDestroy', 'uZMin', 'uZMax', 'uAirBias', 'uBuildProg', 'uHitFlash', 'uCharred', 'uHologram'
      ].forEach((k) => {
        this.eLoc[k] = gl.getUniformLocation(this.entProg, k);
      });

      this.pLoc = {
        aQuad: gl.getAttribLocation(this.postProg, 'aQuad'),
        uTex: gl.getUniformLocation(this.postProg, 'uTex'),
        uTexel: gl.getUniformLocation(this.postProg, 'uTexel')
      };

      this.quadVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);

      this.units = {};
      for (const [k, m] of Object.entries(buildUnitMeshes())) {
        this.units[k] = this.uploadMesh(m);
      }

      this.buildings = { red: {}, green: {}, neutral: {} };
      const palMap = { red: RED_PAL, green: GREEN_PAL, neutral: NEUTRAL_PAL };
      for (const fk of ['red', 'green', 'neutral']) {
        const rawB = buildFactionBuildings(palMap[fk], fk);
        for (const [k, m] of Object.entries(rawB)) this.buildings[fk][k] = this.uploadMesh(m);
      }

      const rawProps = buildPropMeshes();
      this.props = {
        supply: rawProps.supply.map((m) => this.uploadMesh(m)),
        rock: rawProps.rock.map((m) => this.uploadMesh(m))
      };

      this.fbo = null; this.fboTex = null; this.fboDepth = null;
      this.fboW = 0; this.fboH = 0;
      this.maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
      this.sceneOut = { canvas: this.canvas, x: 0, y: 0, w: 0, h: 0 };
      this.mA = mat4Id(); this.mB = mat4Id(); this.mC = mat4Id(); this.mD = mat4Id();
      this.drawCalls = [];
    }

    uploadMesh(m) {
      const gl = this.gl;
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, m.data, gl.STATIC_DRAW);
      return { vbo, count: m.count, minZ: m.minZ, maxZ: m.maxZ };
    }

    ensureFbo(w, h) {
      if (this.fboW === w && this.fboH === h) return;
      const gl = this.gl;
      if (this.fbo) gl.deleteFramebuffer(this.fbo);
      if (this.fboTex) gl.deleteTexture(this.fboTex);
      if (this.fboDepth) gl.deleteRenderbuffer(this.fboDepth);
      this.fboW = w; this.fboH = h;
      this.canvas.width = w; this.canvas.height = h;

      this.fboTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this.fboDepth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.fboDepth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);

      this.fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.fboDepth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    bindMesh(mesh) {
      const gl = this.gl;
      const L = this.eLoc;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
      gl.vertexAttribPointer(L.aPos, 3, gl.FLOAT, false, 48, 0);
      gl.vertexAttribPointer(L.aNorm, 3, gl.FLOAT, false, 48, 12);
      gl.vertexAttribPointer(L.aCol, 3, gl.FLOAT, false, 48, 24);
      gl.vertexAttribPointer(L.aEm, 1, gl.FLOAT, false, 48, 36);
      gl.vertexAttribPointer(L.aMat, 1, gl.FLOAT, false, 48, 40);
      gl.vertexAttribPointer(L.aAo, 1, gl.FLOAT, false, 48, 44);
    }

    pushPart(mesh, mat, ex, ey, opts) {
      this.drawCalls.push({
        mesh, mat: new Float32Array(mat), ex, ey,
        zMin: opts.zMin ?? mesh.minZ,
        zMax: opts.zMax ?? mesh.maxZ,
        buildProg: opts.buildProg ?? 1,
        hitFlash: opts.hitFlash ?? 0,
        charred: opts.charred ?? 0,
        hologram: opts.hologram ?? 0,
        destroy: opts.destroy ?? 0,
        shadow: opts.shadow !== false,
        airBias: opts.airBias ?? 0
      });
    }

    enqueueUnit(u, rawTime) {
      const M = this.units;
      const spd = Math.hypot(u.vx, u.vy);
      const time = snapTime(rawTime);
      const hAng = snapAngle(u.hullAngle);
      const tAng = snapAngle(u.turretAngle);
      const animP = (Math.floor((u.animPhase / 5) * ANIM_FPS) / ANIM_FPS) * 5;
      const rec = snapVal(u.recoil, 5);
      const ux = Math.round(u.x);
      const uy = Math.round(u.y);
      const buildProg = u.spawnProg !== undefined ? (u.spawnProg < 1 ? Math.floor(u.spawnProg * 14) / 14 : 1) : 1;
      const d = u.koTimer > 0 ? Math.floor(Math.min(1, 1 - u.koTimer / 0.48) * 12) / 12 : 0;
      const baseOpts = { buildProg, hitFlash: u.hitFlash > 0.1 ? 1 : 0, destroy: d };
      const driveBob = spd > 10 && d === 0 ? Math.abs(Math.sin(animP * 1.4)) * 0.65 : 0;
      const sink = d * 2.6;

      switch (u.kind) {
        case 'red_buggy': {
          const opts = { ...baseOpts, zMin: 0, zMax: 24 };
          mat4TRS(this.mA, 0, 0, driveBob - sink, d * 0.18, -d * 0.10, hAng);
          this.pushPart(M.red_buggy_hull, this.mA, ux, uy, opts);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 15 : 0;
          mat4TRS(this.mB, -rec * 2.2 * Math.cos(tAng), -rec * 2.2 * Math.sin(tAng), 17.5 + driveBob + popZ, d * 0.7, d * 0.5, snapAngle(tAng + d * 1.3));
          this.pushPart(M.red_buggy_turret, this.mB, ux, uy, opts);
          break;
        }
        case 'red_light_tank':
        case 'red_flame_tank':
        case 'green_medium_tank':
        case 'green_ion_tank': {
          const zMax = u.kind === 'red_flame_tank' || u.kind === 'green_ion_tank' ? 30 : 28;
          const opts = { ...baseOpts, zMin: 0, zMax };
          const tz = u.kind === 'red_light_tank' ? 12.6 : 13.8;
          const recAmp = (u.kind === 'red_flame_tank' || u.kind === 'green_ion_tank') ? 2.8 : 4.2;
          mat4TRS(this.mA, 0, 0, driveBob * 0.5 - sink, d * 0.14, -d * 0.08, hAng);
          this.pushPart(M[`${u.kind}_hull`], this.mA, ux, uy, opts);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 18 + d * 4 : 0;
          mat4TRS(this.mB, d * 6, -d * 4, tz + driveBob * 0.5 + popZ, d * 0.95, d * 0.55, snapAngle(tAng + d * 1.4));
          this.pushPart(M[`${u.kind}_turret`], this.mB, ux, uy, opts);
          mat4TRS(this.mC, -rec * recAmp, 0, 0, 0, 0, 0);
          mat4Mul(this.mD, this.mB, this.mC);
          this.pushPart(M[`${u.kind}_barrel`], this.mD, ux, uy, opts);
          break;
        }
        case 'red_halftrack': {
          const opts = { ...baseOpts, zMin: 0, zMax: 30 };
          mat4TRS(this.mA, 0, 0, driveBob * 0.6 - sink, d * 0.15, -d * 0.09, hAng);
          this.pushPart(M.red_halftrack_hull, this.mA, ux, uy, opts);
          const ox = -6.5 * Math.cos(hAng), oy = -6.5 * Math.sin(hAng);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 15 : 0;
          mat4TRS(this.mB, ox + d * 5, oy - d * 3, 12.5 + driveBob * 0.6 + popZ, d * 0.85, d * 0.5, snapAngle(tAng + d * 1.3));
          this.pushPart(M.red_halftrack_turret, this.mB, ux, uy, opts);
          mat4TRS(this.mC, -rec * 3.8, 0, 0, 0, 0, 0);
          mat4Mul(this.mD, this.mB, this.mC);
          this.pushPart(M.red_halftrack_barrel, this.mD, ux, uy, opts);
          break;
        }
        case 'red_apc_truck':
        case 'red_supply_truck':
        case 'green_supply_truck': {
          const opts = { ...baseOpts, zMin: 0, zMax: 30 };
          const rock = (spd > 8 || u.animPhase > 0) && d === 0 ? Math.sin(animP * 1.3) * 0.025 : 0;
          mat4TRS(this.mA, 0, 0, driveBob - sink, d * 0.16, rock - d * 0.1, hAng, 1, 1, Math.max(0.75, 1 - d * 0.22));
          this.pushPart(M[`${u.kind}_hull`], this.mA, ux, uy, opts);
          break;
        }
        case 'red_mortar': {
          const opts = { ...baseOpts, zMin: 0, zMax: 36 };
          const shockZ = rec > 0.2 ? -rec * 0.8 : 0;
          mat4TRS(this.mA, 0, 0, driveBob * 0.4 + shockZ - sink, d * 0.14, rec * 0.03 - d * 0.08, hAng);
          this.pushPart(M.red_mortar_hull, this.mA, ux, uy, opts);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 14 : 0;
          mat4TRS(this.mB, 0, 0, 14.8 + popZ, d * 0.75, -d * 0.45, snapAngle(tAng + d * 1.1));
          this.pushPart(M.red_mortar_turret, this.mB, ux, uy, opts);
          const kick = rec * 4.5;
          mat4TRS(this.mC, -kick * 0.79, 0, -kick * 0.61, 0, 0, 0);
          mat4Mul(this.mD, this.mB, this.mC);
          this.pushPart(M.red_mortar_barrel, this.mD, ux, uy, opts);
          break;
        }
        case 'red_orb_disruptor': {
          const opts = { ...baseOpts, zMin: 0, zMax: 38 };
          mat4TRS(this.mA, 0, 0, driveBob * 0.4 - sink, d * 0.14, -d * 0.08, hAng);
          this.pushPart(M.red_orb_disruptor_hull, this.mA, ux, uy, opts);
          const ox = -8.5 * Math.cos(hAng), oy = -8.5 * Math.sin(hAng);
          const spin = snapAngle(tAng + time * 0.9);
          mat4TRS(this.mB, ox, oy, 12.2 - sink, d * 0.5, d * 0.4, spin);
          this.pushPart(M.red_orb_disruptor_turret, this.mB, ux, uy, opts);
          const orbZ = 23.0 + Math.sin(time * 3.0 + u.id) * 1.3 + rec * 3.2 + (d > 0 ? Math.sin(d * Math.PI) * 16 : 0);
          mat4TRS(this.mC, ox + d * 5, oy - d * 4, orbZ, d * 1.2, 0, spin);
          this.pushPart(M.red_orb_disruptor_orb, this.mC, ux, uy, opts);
          break;
        }
        case 'green_humvee': {
          const opts = { ...baseOpts, zMin: 0, zMax: 26 };
          mat4TRS(this.mA, 0, 0, driveBob - sink, d * 0.18, -d * 0.10, hAng);
          this.pushPart(M.green_humvee_hull, this.mA, ux, uy, opts);
          const ox = -1.5 * Math.cos(hAng) - rec * 2.0 * Math.cos(tAng);
          const oy = -1.5 * Math.sin(hAng) - rec * 2.0 * Math.sin(tAng);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 14 : 0;
          mat4TRS(this.mB, ox, oy, 18.2 + driveBob + popZ, d * 0.7, d * 0.5, snapAngle(tAng + d * 1.3));
          this.pushPart(M.green_humvee_turret, this.mB, ux, uy, opts);
          break;
        }
        case 'green_missile_truck': {
          const opts = { ...baseOpts, zMin: 0, zMax: 38 };
          mat4TRS(this.mA, 0, 0, driveBob * 0.4 - sink, d * 0.15, -d * 0.08, hAng);
          this.pushPart(M.green_missile_truck_hull, this.mA, ux, uy, opts);
          const ox = -7.5 * Math.cos(hAng) - rec * 2.5 * Math.cos(tAng);
          const oy = -7.5 * Math.sin(hAng) - rec * 2.5 * Math.sin(tAng);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 14 : 0;
          mat4TRS(this.mB, ox, oy, 12.2 + driveBob * 0.4 + popZ, d * 0.7, -d * 0.4, snapAngle(tAng + d));
          this.pushPart(M.green_missile_truck_turret, this.mB, ux, uy, opts);
          break;
        }
        case 'green_apc_8x8': {
          const opts = { ...baseOpts, zMin: 0, zMax: 28 };
          mat4TRS(this.mA, 0, 0, driveBob * 0.6 - sink, d * 0.16, -d * 0.09, hAng);
          this.pushPart(M.green_apc_8x8_hull, this.mA, ux, uy, opts);
          const ox = -2.0 * Math.cos(hAng) - rec * 1.8 * Math.cos(tAng);
          const oy = -2.0 * Math.sin(hAng) - rec * 1.8 * Math.sin(tAng);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 12 : 0;
          mat4TRS(this.mB, ox, oy, 18.4 + driveBob * 0.6 + popZ, d * 0.6, d * 0.4, snapAngle(tAng + d * 1.2));
          this.pushPart(M.green_apc_8x8_turret, this.mB, ux, uy, opts);
          break;
        }
        case 'green_laser_tank': {
          const opts = { ...baseOpts, zMin: 0, zMax: 34 };
          mat4TRS(this.mA, 0, 0, driveBob * 0.5 - sink, d * 0.14, -d * 0.08, hAng);
          this.pushPart(M.green_laser_tank_hull, this.mA, ux, uy, opts);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 16 : 0;
          mat4TRS(this.mB, -rec * 1.8 * Math.cos(tAng), -rec * 1.8 * Math.sin(tAng), 12.8 + driveBob * 0.5 + popZ, d * 0.8, d * 0.5, snapAngle(tAng + d * 1.4));
          this.pushPart(M.green_laser_tank_turret, this.mB, ux, uy, opts);
          break;
        }
        case 'green_radar_truck': {
          const opts = { ...baseOpts, zMin: 0, zMax: 44 };
          mat4TRS(this.mA, 0, 0, driveBob * 0.4 - sink, d * 0.15, -d * 0.09, hAng);
          this.pushPart(M.green_radar_truck_hull, this.mA, ux, uy, opts);
          const ox = -8.5 * Math.cos(hAng), oy = -8.5 * Math.sin(hAng);
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 12 : 0;
          mat4TRS(this.mB, ox, oy, 12.2 + driveBob * 0.4 + popZ, d * 0.5, -d * 0.5, snapAngle(tAng + time * 1.6));
          this.pushPart(M.green_radar_truck_turret, this.mB, ux, uy, opts);
          break;
        }
      }
    }

    enqueueBuilding(b, rawTime, hologram = 0) {
      const M = this.buildings[b.faction] || this.buildings.neutral;
      const baseMesh = M[`bld_${b.kind}`];
      if (!baseMesh) return;
      const { BUILDING_SPECS } = FL.CONSTANTS;
      const spec = BUILDING_SPECS[b.kind];
      const time = snapTime(rawTime);
      const bAng = snapAngle(b.angle || 0);
      const bSteps = Math.max(12, Math.round(((spec && spec.buildTime) || 5) * ANIM_FPS));
      const bProg = b.buildProgress < 1 ? Math.floor(b.buildProgress * bSteps) / bSteps : 1;
      const d = b.koTimer > 0 ? Math.floor(Math.min(1, 1 - b.koTimer / 0.55) * 13) / 13 : 0;
      const collapseZ = -d * d * baseMesh.maxZ * 0.72;
      const scaleZ = Math.max(0.25, 1 - d * 0.55);
      const bx = Math.round(b.x);
      const by = Math.round(b.y);
      const baseAng = b.facingRad !== undefined ? b.facingRad : 0;
      const opts = {
        buildProg: bProg, hitFlash: (b.hitFlash || 0) > 0.1 ? 1 : 0, hologram, destroy: d,
        shadow: hologram === 0, zMin: baseMesh.minZ, zMax: baseMesh.maxZ
      };
      mat4TRS(this.mA, 0, 0, collapseZ, d * 0.14, -d * 0.12, baseAng, 1, 1, scaleZ);
      this.pushPart(baseMesh, this.mA, bx, by, opts);

      if (b.buildProgress >= 0.98) {
        if (b.kind === 'hq' && hologram === 0) {
          const ca = Math.cos(baseAng), sa = Math.sin(baseAng);
          mat4TRS(this.mB, -6 * ca - 6 * sa, -6 * sa + 6 * ca, 40 * scaleZ + collapseZ, d * 0.4, -d * 0.4, snapAngle(time * 0.9));
          this.pushPart(M.bld_hq_head, this.mB, bx, by, { ...opts, zMin: 0, zMax: 58 });
        } else if (b.kind === 'bunker') {
          const kick = snapVal(b.recoil || 0, 5) * 3.2;
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 14 : 0;
          mat4TRS(this.mB, -kick * Math.cos(bAng), -kick * Math.sin(bAng), 13 * scaleZ + collapseZ + popZ, d * 0.9, d * 0.5, snapAngle(bAng + d * 1.3));
          this.pushPart(M.bld_bunker_head, this.mB, bx, by, { ...opts, zMin: 0, zMax: 30 });
        } else if (b.kind === 'command') {
          mat4TRS(this.mB, 0, 0, 32 * scaleZ + collapseZ, d * 0.6, d * 0.4, bAng);
          this.pushPart(M.bld_command_head, this.mB, bx, by, { ...opts, zMin: 0, zMax: 65 });
        } else if (b.kind === 'heavyGun') {
          const kick = snapVal(b.recoil || 0, 5) * 3.8;
          const popZ = d > 0 ? Math.sin(d * Math.PI) * 16 : 0;
          mat4TRS(this.mB, -kick * Math.cos(bAng), -kick * Math.sin(bAng), 17 * scaleZ + collapseZ + popZ, d * 0.85, -d * 0.45, snapAngle(bAng + d * 1.2));
          this.pushPart(M.bld_heavyGun_head, this.mB, bx, by, { ...opts, zMin: 0, zMax: 42 });
        }
      }
    }

    renderScene(vw, vh, sim, cam, shakeX, shakeY, hoverWorld) {
      const gl = this.gl;
      const zoom = cam.zoom;
      const viewW = vw / zoom;
      const viewH = vh / zoom;
      const pixelWorld = PIXEL_WORLD;
      const worldW = (FL.CONSTANTS && FL.CONSTANTS.WORLD_WIDTH) || 2400;
      const worldH = (FL.CONSTANTS && FL.CONSTANTS.WORLD_HEIGHT) || 1600;
      const maxWorldTexW = Math.ceil((worldW + 360) / pixelWorld);
      const maxWorldTexH = Math.ceil((worldH + 360) / pixelWorld);

      const fboW = Math.max(2, Math.min(this.maxTexSize, maxWorldTexW, Math.ceil(viewW / pixelWorld) + 2));
      const fboH = Math.max(2, Math.min(this.maxTexSize, maxWorldTexH, Math.ceil(viewH / pixelWorld) + 2));

      const rawCamX = cam.x + shakeX;
      const rawCamY = cam.y + shakeY;
      let wx0 = Math.floor((rawCamX - fboW * pixelWorld * 0.5) / pixelWorld) * pixelWorld;
      let wy0 = Math.floor((rawCamY - fboH * pixelWorld * 0.5) / pixelWorld) * pixelWorld;
      const minX = Math.floor(-180 / pixelWorld) * pixelWorld;
      const maxX = Math.ceil((worldW + 180) / pixelWorld) * pixelWorld - fboW * pixelWorld;
      const minY = Math.floor(-180 / pixelWorld) * pixelWorld;
      const maxY = Math.ceil((worldH + 180) / pixelWorld) * pixelWorld - fboH * pixelWorld;
      if (minX <= maxX) wx0 = Math.max(minX, Math.min(maxX, wx0));
      if (minY <= maxY) wy0 = Math.max(minY, Math.min(maxY, wy0));

      const fboViewW = fboW * pixelWorld;
      const fboViewH = fboH * pixelWorld;
      const camX = wx0 + fboViewW * 0.5;
      const camY = wy0 + fboViewH * 0.5;
      this.ensureFbo(fboW, fboH);

      const visMinX = wx0 - 120, visMaxX = wx0 + fboViewW + 120;
      const visMinY = wy0 - 120, visMaxY = wy0 + fboViewH + 120;
      const inVis = (x, y) => x >= visMinX && x <= visMaxX && y >= visMinY && y <= visMaxY;
      const fog = sim.demoMode ? null : sim.fog;

      this.drawCalls.length = 0;

      for (const s of sim.supplyNodes) {
        if (s.amount <= 0 || !inVis(s.x, s.y)) continue;
        if (fog && !fog.isExplored(s.x, s.y)) continue;
        const sc = 0.65 + (s.amount / s.maxAmount) * 0.35;
        mat4TRS(this.mA, 0, 0, 0, 0, 0, s.variant * 1.1, sc, sc, sc);
        this.pushPart(this.props.supply[s.variant], this.mA, Math.round(s.x), Math.round(s.y), {});
      }
      for (const r of sim.obstacles) {
        if (!inVis(r.x, r.y)) continue;
        const sc = r.radius / 26;
        mat4TRS(this.mA, 0, 0, 0, 0, 0, r.variant * 1.1, sc, sc, sc);
        this.pushPart(this.props.rock[r.variant], this.mA, Math.round(r.x), Math.round(r.y), {});
      }
      for (const cp of sim.capturePoints) {
        if (!inVis(cp.x, cp.y)) continue;
        const owner = (!fog || fog.isVisible(cp.x, cp.y) || cp.owner === sim.playerFaction) ? (cp.owner || 'neutral') : 'neutral';
        mat4TRS(this.mA, 0, 0, 0, 0, 0, 0);
        this.pushPart(this.buildings[owner].outpost, this.mA, Math.round(cp.x), Math.round(cp.y), {});
      }
      for (const w of sim.wrecks) {
        if (w.supplyValue <= 0 || !inVis(w.x, w.y)) continue;
        if (fog && !fog.isVisible(w.x, w.y)) continue;
        const mesh = this.units[`${w.kind}_hull`];
        if (!mesh) continue;
        mat4TRS(this.mA, 0, 0, 0, 0.14, -0.08, snapAngle(w.hullAngle), 0.92, 0.92, 0.80);
        this.pushPart(mesh, this.mA, Math.round(w.x), Math.round(w.y), { charred: 1 });
      }
      for (const b of sim.buildings) {
        if (!inVis(b.x, b.y)) continue;
        if (b.faction !== sim.playerFaction && fog && !fog.isExplored(b.x, b.y)) continue;
        this.enqueueBuilding(b, sim.elapsedTime, 0);
      }
      for (const u of sim.units) {
        if (!inVis(u.x, u.y)) continue;
        if (u.faction !== sim.playerFaction && fog && !fog.isVisible(u.x, u.y)) continue;
        this.enqueueUnit(u, sim.elapsedTime);
      }
      if (sim.placementMode && hoverWorld) {
        const ok = sim.canPlaceBuilding(sim.playerFaction, sim.placementMode, hoverWorld.x, hoverWorld.y).ok;
        const pRad = sim.getPlacementRad();
        this.enqueueBuilding(
          { kind: sim.placementMode, faction: sim.playerFaction, x: hoverWorld.x, y: hoverWorld.y, buildProgress: 1, facingRad: pRad, angle: pRad, koTimer: 0 },
          sim.elapsedTime, ok ? 1 : -1
        );
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, fboW, fboH);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(this.entProg);
      const L = this.eLoc;
      gl.enableVertexAttribArray(L.aPos);
      gl.enableVertexAttribArray(L.aNorm);
      gl.enableVertexAttribArray(L.aCol);
      gl.enableVertexAttribArray(L.aEm);
      gl.enableVertexAttribArray(L.aMat);
      gl.enableVertexAttribArray(L.aAo);
      gl.uniform2f(L.uCamPos, camX, camY);
      gl.uniform2f(L.uViewSize, fboViewW, fboViewH);

      gl.depthFunc(gl.LESS);
      gl.uniform1f(L.uShadowPass, 1.0);
      for (let i = 0; i < this.drawCalls.length; i++) {
        const dc = this.drawCalls[i];
        if (!dc.shadow) continue;
        this.bindMesh(dc.mesh);
        gl.uniformMatrix4fv(L.uLocalMat, false, dc.mat);
        gl.uniform2f(L.uEntityPos, dc.ex, dc.ey);
        gl.uniform1f(L.uDestroy, dc.destroy);
        gl.uniform1f(L.uZMin, dc.zMin);
        gl.uniform1f(L.uZMax, dc.zMax);
        gl.uniform1f(L.uAirBias, 0);
        gl.uniform1f(L.uBuildProg, dc.buildProg);
        gl.drawArrays(gl.TRIANGLES, 0, dc.mesh.count);
      }

      gl.depthFunc(gl.LEQUAL);
      gl.uniform1f(L.uShadowPass, 0.0);
      for (let i = 0; i < this.drawCalls.length; i++) {
        const dc = this.drawCalls[i];
        this.bindMesh(dc.mesh);
        gl.uniformMatrix4fv(L.uLocalMat, false, dc.mat);
        gl.uniform2f(L.uEntityPos, dc.ex, dc.ey);
        gl.uniform1f(L.uDestroy, dc.destroy);
        gl.uniform1f(L.uZMin, dc.zMin);
        gl.uniform1f(L.uZMax, dc.zMax);
        gl.uniform1f(L.uAirBias, dc.airBias);
        gl.uniform1f(L.uBuildProg, dc.buildProg);
        gl.uniform1f(L.uHitFlash, dc.hitFlash);
        gl.uniform1f(L.uCharred, dc.charred);
        gl.uniform1f(L.uHologram, dc.hologram);
        gl.drawArrays(gl.TRIANGLES, 0, dc.mesh.count);
      }

      gl.disableVertexAttribArray(L.aPos);
      gl.disableVertexAttribArray(L.aNorm);
      gl.disableVertexAttribArray(L.aCol);
      gl.disableVertexAttribArray(L.aEm);
      gl.disableVertexAttribArray(L.aMat);
      gl.disableVertexAttribArray(L.aAo);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, fboW, fboH);
      gl.disable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this.postProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
      gl.uniform1i(this.pLoc.uTex, 0);
      gl.uniform2f(this.pLoc.uTexel, 1 / fboW, 1 / fboH);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
      gl.enableVertexAttribArray(this.pLoc.aQuad);
      gl.vertexAttribPointer(this.pLoc.aQuad, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(this.pLoc.aQuad);

      this.sceneOut.canvas = this.canvas;
      this.sceneOut.x = wx0;
      this.sceneOut.y = wy0;
      this.sceneOut.w = fboViewW;
      this.sceneOut.h = fboViewH;
      return this.sceneOut;
    }

    bakePortrait(spec) {
      const gl = this.gl;
      const w = 78, h = 62;
      this.ensureFbo(w, h);
      this.drawCalls.length = 0;

      if (spec.isBuilding) {
        this.enqueueBuilding(
          { kind: spec.kind, faction: spec.faction, x: 0, y: 0, buildProgress: 1, angle: -0.45, koTimer: 0 },
          0.35, 0
        );
      } else {
        this.enqueueUnit(
          {
            id: 1, kind: spec.kind, faction: spec.faction, x: 0, y: 0, vx: 0, vy: 0,
            hullAngle: 0.62, turretAngle: 0.25, animPhase: 0.4, recoil: 0,
            hitFlash: 0, koTimer: 0, spawnProg: 1, supplyCarried: 65
          },
          0.35
        );
      }

      const aspect = w / h;
      const viewH = spec.span;
      const viewW = viewH * aspect;
      const camX = spec.isBuilding ? 0.0 : 2.5;
      const camY = -spec.midZ * 0.73;

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(this.entProg);
      const L = this.eLoc;
      gl.enableVertexAttribArray(L.aPos);
      gl.enableVertexAttribArray(L.aNorm);
      gl.enableVertexAttribArray(L.aCol);
      gl.enableVertexAttribArray(L.aEm);
      gl.enableVertexAttribArray(L.aMat);
      gl.enableVertexAttribArray(L.aAo);
      gl.uniform2f(L.uCamPos, camX, camY);
      gl.uniform2f(L.uViewSize, viewW, viewH);

      gl.depthFunc(gl.LESS);
      gl.uniform1f(L.uShadowPass, 1.0);
      for (let i = 0; i < this.drawCalls.length; i++) {
        const dc = this.drawCalls[i];
        if (!dc.shadow) continue;
        this.bindMesh(dc.mesh);
        gl.uniformMatrix4fv(L.uLocalMat, false, dc.mat);
        gl.uniform2f(L.uEntityPos, dc.ex, dc.ey);
        gl.uniform1f(L.uDestroy, 0);
        gl.uniform1f(L.uZMin, dc.zMin);
        gl.uniform1f(L.uZMax, dc.zMax);
        gl.uniform1f(L.uAirBias, 0);
        gl.uniform1f(L.uBuildProg, 1);
        gl.drawArrays(gl.TRIANGLES, 0, dc.mesh.count);
      }

      gl.depthFunc(gl.LEQUAL);
      gl.uniform1f(L.uShadowPass, 0.0);
      for (let i = 0; i < this.drawCalls.length; i++) {
        const dc = this.drawCalls[i];
        this.bindMesh(dc.mesh);
        gl.uniformMatrix4fv(L.uLocalMat, false, dc.mat);
        gl.uniform2f(L.uEntityPos, dc.ex, dc.ey);
        gl.uniform1f(L.uDestroy, 0);
        gl.uniform1f(L.uZMin, dc.zMin);
        gl.uniform1f(L.uZMax, dc.zMax);
        gl.uniform1f(L.uAirBias, 0);
        gl.uniform1f(L.uBuildProg, 1);
        gl.uniform1f(L.uHitFlash, 0);
        gl.uniform1f(L.uCharred, 0);
        gl.uniform1f(L.uHologram, 0);
        gl.drawArrays(gl.TRIANGLES, 0, dc.mesh.count);
      }

      gl.disableVertexAttribArray(L.aPos);
      gl.disableVertexAttribArray(L.aNorm);
      gl.disableVertexAttribArray(L.aCol);
      gl.disableVertexAttribArray(L.aEm);
      gl.disableVertexAttribArray(L.aMat);
      gl.disableVertexAttribArray(L.aAo);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this.postProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
      gl.uniform1i(this.pLoc.uTex, 0);
      gl.uniform2f(this.pLoc.uTexel, 1 / w, 1 / h);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
      gl.enableVertexAttribArray(this.pLoc.aQuad);
      gl.vertexAttribPointer(this.pLoc.aQuad, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(this.pLoc.aQuad);

      if (!this._readBuf || this._readBuf.length !== w * h * 4) {
        this._readBuf = new Uint8Array(w * h * 4);
        this._tmpCanvas = document.createElement('canvas');
        this._tmpCanvas.width = w;
        this._tmpCanvas.height = h;
        this._tmpCtx = this._tmpCanvas.getContext('2d');
        this._tmpImg = this._tmpCtx.createImageData(w, h);
      }
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, this._readBuf);
      const src = this._readBuf;
      const dst = this._tmpImg.data;
      for (let y = 0; y < h; y++) {
        const sy = h - 1 - y;
        for (let x = 0; x < w; x++) {
          const si = (sy * w + x) * 4;
          const di = (y * w + x) * 4;
          const a = src[si + 3];
          if (a === 0) {
            dst[di] = dst[di + 1] = dst[di + 2] = dst[di + 3] = 0;
          } else if (a === 255) {
            dst[di] = src[si]; dst[di + 1] = src[si + 1]; dst[di + 2] = src[si + 2]; dst[di + 3] = 255;
          } else {
            const inv = 255 / a;
            dst[di] = Math.min(255, Math.round(src[si] * inv));
            dst[di + 1] = Math.min(255, Math.round(src[si + 1] * inv));
            dst[di + 2] = Math.min(255, Math.round(src[si + 2] * inv));
            dst[di + 3] = a;
          }
        }
      }
      this._tmpCtx.putImageData(this._tmpImg, 0, 0);
      return this._tmpCanvas.toDataURL('image/png');
    }

    bakeAllPortraits() {
      const unitCfg = {
        red_supply_truck: [62, 13], red_buggy: [54, 11], red_light_tank: [58, 12], red_halftrack: [58, 12],
        red_apc_truck: [64, 14], red_flame_tank: [64, 13], red_mortar: [64, 15], red_orb_disruptor: [64, 16],
        green_supply_truck: [62, 13], green_humvee: [54, 11], green_medium_tank: [60, 12], green_apc_8x8: [62, 12],
        green_missile_truck: [66, 16], green_laser_tank: [60, 13], green_ion_tank: [66, 13], green_radar_truck: [68, 18]
      };
      const bldCfg = {
        generator: [86, 18], depot: [104, 17], motorpool: [116, 20],
        bunker: [70, 14], workshop: [98, 17], command: [92, 22], heavyGun: [78, 17]
      };
      const out = { units: {}, buildings: { red: {}, green: {} } };
      for (const [k, [span, midZ]] of Object.entries(unitCfg)) {
        out.units[k] = this.bakePortrait({ isBuilding: false, kind: k, faction: k.startsWith('red') ? 'red' : 'green', span, midZ });
      }
      for (const fac of ['red', 'green']) {
        for (const [k, [span, midZ]] of Object.entries(bldCfg)) {
          out.buildings[fac][k] = this.bakePortrait({ isBuilding: true, kind: k, faction: fac, span, midZ });
        }
      }
      this.drawCalls.length = 0;
      this._readBuf = null;
      this._tmpCanvas = null;
      this._tmpCtx = null;
      this._tmpImg = null;
      return out;
    }
  }

  FL.Pixel3DRenderer = Pixel3DRenderer;
})();
