(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});
  const {
    MeshBuilder, RED_PAL, GREEN_PAL,
    addTransformed, cylPts, addWheel, addTrackPod, addCanvasTarp, addInsigniaSide
  } = FL.MESH_CORE;

  // =========================================================================
  // RED DOMINION (8 UNITS)
  // =========================================================================
  function buildRedUnits(M) {
    const p = RED_PAL;

    // R1: RECON BUGGY
    {
      const b = new MeshBuilder();
      b.bevelBox(0, 0, 4.4, 30, 12.5, 3.0, 0.7, p.dark, 0, 0, 0.72, 0.92);
      b.bevelWedge(10.5, 0, 5.2, 13, 12.2, 10, 9.6, 4.8, 1.0, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(17.8, 0, 5.6, 2.8, 13.5, 2.6, 0.6, p.dark);
      for (const s of [-1, 1]) b.box(18.8, s * 4.5, 6.2, 1.6, 2.4, 2.2, p.lamp, 1, 4);
      for (const s of [-1, 1]) {
        b.bevelBox(0, s * 6.4, 8.2, 13, 2.2, 5.0, 0.6, p.shade, 0, 0, 0.78, 0.96);
        addInsigniaSide(b, 0, s * 7.5, 8.3, s, p);
      }
      b.bevelBox(-1.5, 0, 7.6, 8, 8.5, 4.2, 0.6, p.dark);
      b.bevelWedge(-11.5, 0, 5.4, 12, 13.6, 10, 11.4, 5.8, 1.1, p.main, 0, 0, 0.80, 1.0);
      for (const s of [-1, 1]) b.cylX(-17.5, s * 4.2, 9.2, 1.2, 1.4, 6.0, 8, p.silver);
      for (const s of [-1, 1]) {
        cylPts(b, 12.5, 0, 4.6, 12.5, s * 10.6, 4.6, 1.2, 1.2, 6, p.sub);
        cylPts(b, -11.5, 0, 5.4, -11.5, s * 11.2, 5.4, 1.3, 1.3, 6, p.sub);
        addWheel(b, 12.5, s * 10.8, 4.8, 4.8, 3.8, p, s);
        addWheel(b, -11.5, s * 11.4, 5.5, 5.5, 4.4, p, s);
      }
      for (const s of [-1, 1]) {
        cylPts(b, 6.0, s * 5.6, 9.8, 2.5, s * 5.2, 18.2, 1.0, 1.0, 8, p.dark);
        cylPts(b, 2.5, s * 5.2, 18.2, -5.5, s * 5.2, 18.2, 1.0, 1.0, 8, p.dark);
        cylPts(b, -5.5, s * 5.2, 18.2, -13.0, s * 5.6, 10.5, 1.0, 1.0, 8, p.dark);
      }
      cylPts(b, 2.5, -5.2, 18.2, 2.5, 5.2, 18.2, 1.0, 1.0, 8, p.dark);
      cylPts(b, -5.5, -5.2, 18.2, -5.5, 5.2, 18.2, 1.0, 1.0, 8, p.dark);
      b.cylZ(-1.5, 0, 18.0, 4.2, 3.8, 1.8, 10, p.sub);
      M.red_buggy_hull = b.finish();

      const t = new MeshBuilder();
      t.bevelBox(0, 0, 2.2, 7.6, 5.4, 4.2, 0.7, p.dark, 0, 0, 0.80, 1.0);
      t.bevelBox(-1.0, 4.0, 2.2, 4.4, 2.8, 3.2, 0.5, p.amber);
      t.cylX(3.5, 0, 2.5, 1.3, 1.1, 11.5, 8, p.sub);
      t.cylX(14.5, 0, 2.5, 1.6, 1.3, 2.4, 8, p.dark);
      M.red_buggy_turret = t.finish();
    }

    // R2: LIGHT TANK
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) addTrackPod(b, -17.5, 17.5, s * 13.0, 6.2, 9.2, 4, p, p.main);
      b.bevelWedge(-1.0, 0, 3.6, 33, 20, 28, 18.5, 9.6, 1.8, p.main, 0, 0, 0.80, 1.0);
      b.wedge(14.5, 0, 3.8, 10.5, 19.2, 4.5, 17.0, 7.8, p.main, 0, -3.2, 0, 0.78, 1.0);
      b.box(18.2, -5.0, 9.6, 2.2, 2.2, 2.2, p.lamp, 1, 4);
      b.bevelBox(-12.0, 0, 13.4, 9.0, 14.0, 2.2, 0.5, p.dark);
      b.box(9.5, 4.5, 12.2, 3.0, 3.4, 1.0, p.white, 0, 4);
      M.red_light_tank_hull = b.finish();

      const t = new MeshBuilder();
      t.bevelWedge(-1.0, 0, 0, 19.5, 17.5, 14.5, 13.0, 8.2, 2.0, p.main, 0, 0, 0.82, 1.0);
      t.cylZ(-2.5, -2.2, 7.8, 3.4, 3.0, 2.2, 10, p.hi);
      t.bevelBox(8.2, 0, 4.2, 4.2, 6.8, 4.8, 0.8, p.sub);
      for (const s of [-1, 1]) addInsigniaSide(t, -1.5, s * 8.4, 4.4, s, p);
      M.red_light_tank_turret = t.finish();

      const bar = new MeshBuilder();
      bar.cylX(8.5, 0, 4.5, 1.65, 1.45, 16.5, 10, p.sub);
      bar.cylX(23.5, 0, 4.5, 2.0, 1.85, 2.4, 8, p.dark);
      M.red_light_tank_barrel = bar.finish();
    }

    // R3: HALF-TRACK TANK
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        addTrackPod(b, -17.5, 1.0, s * 12.8, 5.8, 9.2, 3, p, p.main);
        cylPts(b, 13.5, 0, 4.6, 13.5, s * 11.4, 4.6, 1.3, 1.3, 6, p.sub);
        addWheel(b, 13.5, s * 11.8, 4.6, 4.6, 3.6, p, s);
        b.bevelBox(13.5, s * 11.4, 9.8, 8.6, 4.2, 1.8, 0.5, p.main);
      }
      b.bevelWedge(12.2, 0, 4.2, 13.5, 13.8, 12.5, 11.4, 6.6, 1.3, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(19.0, 0, 6.8, 2.0, 8.6, 4.6, 0.4, p.dark);
      for (const s of [-1, 1]) b.box(19.3, s * 5.6, 6.6, 1.6, 2.1, 2.1, p.lamp, 1, 4);
      b.bevelWedge(3.5, 0, 4.8, 9.0, 18.2, 7.6, 16.6, 10.6, 1.3, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(7.2, 0, 12.6, 1.6, 11.8, 3.0, 0.3, p.glass, 0, 4);
      b.bevelBox(-8.5, 0, 8.4, 18.0, 20.5, 8.2, 1.6, p.main, 0, 0, 0.80, 1.0);
      M.red_halftrack_hull = b.finish();

      const t = new MeshBuilder();
      t.bevelWedge(0, 0, 0, 16.0, 15.2, 12.8, 12.4, 8.4, 1.8, p.main, 0, 0, 0.82, 1.0);
      t.cylZ(-1.5, 0, 8.0, 3.2, 2.8, 2.0, 10, p.hi);
      t.bevelBox(6.8, 0, 4.4, 3.6, 6.2, 4.6, 0.6, p.sub);
      for (const s of [-1, 1]) addInsigniaSide(t, -1.0, s * 7.2, 4.4, s, p);
      M.red_halftrack_turret = t.finish();

      const bar = new MeshBuilder();
      bar.cylX(7.2, 0, 4.4, 1.6, 1.45, 16.0, 10, p.sub);
      M.red_halftrack_barrel = bar.finish();
    }

    // R4: TRACKED CARRIER
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) addTrackPod(b, -19.5, 19.5, s * 13.5, 6.6, 10.2, 4, p, null);
      b.bevelBox(0, 0, 6.6, 36.5, 22.0, 4.2, 0.8, p.dark, 0, 0, 0.72, 0.90);
      b.bevelWedge(11.5, 0, 8.4, 13.0, 21.6, 11.5, 20.4, 15.0, 1.6, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(17.8, 0, 12.5, 2.0, 13.5, 6.0, 0.5, p.dark);
      for (const s of [-1, 1]) {
        b.box(18.5, s * 7.6, 10.6, 1.8, 2.6, 2.2, p.lamp, 1, 4);
        b.bevelBox(12.2, s * 10.6, 18.6, 5.2, 1.2, 4.2, 0.2, p.glass, 0, 4);
      }
      b.bevelBox(17.1, 0, 18.8, 1.4, 15.8, 4.6, 0.3, p.glass, 0, 4);
      b.box(17.1, 0, 18.8, 1.7, 1.4, 4.8, p.main);
      b.bevelBox(-7.5, 0, 16.6, 23.0, 22.6, 16.8, 1.8, p.main, 0, 0, 0.80, 1.0);
      for (const rx of [-15, -7.5, 0]) {
        b.bevelBox(rx, 0, 25.1, 2.4, 21.0, 1.4, 0.4, p.shade);
        for (const s of [-1, 1]) b.bevelBox(rx, s * 11.2, 17.5, 2.6, 1.0, 12.0, 0.3, p.shade);
      }
      b.cylZ(-10.5, 4.0, 25.0, 3.6, 3.2, 2.2, 10, p.dark);
      b.bevelBox(-4.0, -5.0, 25.4, 7.0, 4.0, 2.0, 0.4, p.silver);
      for (const s of [-1, 1]) addInsigniaSide(b, 10.0, s * 10.8, 13.2, s, p);
      M.red_apc_truck_hull = b.finish();
    }

    // R5: FLAME SIEGE TANK
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        addTrackPod(b, -19.5, 19.5, s * 14.5, 6.6, 10.2, 4, p, p.main);
        b.bevelWedge(0, s * 15.2, 4.5, 39.0, 6.0, 36.0, 5.2, 7.6, 1.2, p.main, 0, 0, 0.82, 1.0);
        addInsigniaSide(b, 4.0, s * 17.8, 8.8, s, p);
      }
      b.bevelWedge(-1.0, 0, 4.2, 37.5, 23.5, 32.0, 21.5, 11.0, 2.0, p.main, 0, 0, 0.80, 1.0);
      b.wedge(16.5, 0, 4.2, 11, 21, 5, 19, 8.2, p.main, 0, -3.5, 0, 0.78, 1.0);
      b.box(20.2, 0, 9.6, 2.2, 6.8, 2.4, p.lamp, 1, 4);
      M.red_flame_tank_hull = b.finish();

      const t = new MeshBuilder();
      t.bevelWedge(1.5, 0, 0, 20.5, 19.5, 15.5, 15.0, 9.2, 2.0, p.main, 0, 0, 0.82, 1.0);
      t.cylZ(1.0, 0, 9.0, 3.6, 3.2, 2.2, 10, p.hi);
      t.bevelBox(10.0, 0, 4.6, 4.4, 7.2, 5.2, 0.8, p.dark);
      for (const s of [-1, 1]) {
        addInsigniaSide(t, 1.5, s * 9.5, 4.8, s, p);
        const tankCyl = new MeshBuilder();
        tankCyl.cylX(-5.2, 0, 0, 3.1, 3.1, 10.5, 12, p.silver, 0, 0);
        tankCyl.sphere(-5.2, 0, 0, 2.4, 3.1, 3.1, 10, 6, p.silver);
        tankCyl.sphere(5.2, 0, 0, 2.4, 3.1, 3.1, 10, 6, p.silver);
        tankCyl.cylX(-2.5, 0, 0, 3.4, 3.4, 1.4, 10, p.dark);
        tankCyl.cylX(1.5, 0, 0, 3.4, 3.4, 1.4, 10, p.dark);
        addTransformed(t, tankCyl, -10.5, s * 4.4, 5.5, 0, 0.36, 0);
      }
      M.red_flame_tank_turret = t.finish();

      const bar = new MeshBuilder();
      bar.cylX(11.0, 0, 4.8, 2.0, 1.8, 13.5, 10, p.sub);
      bar.cylX(23.5, 0, 4.8, 2.5, 2.7, 3.4, 10, p.dark);
      bar.box(26.6, 0, 4.8, 1.6, 2.2, 2.2, p.glow, 0.9, 4);
      M.red_flame_tank_barrel = bar.finish();
    }

    // R6: RED 6x6 SUPPLY TRUCK
    {
      const b = new MeshBuilder();
      b.bevelBox(-1.0, 0, 6.2, 36.5, 19.0, 3.4, 0.6, p.dark);
      for (const s of [-1, 1]) {
        addWheel(b, 13.5, s * 10.6, 4.6, 4.6, 3.6, p, s);
        addWheel(b, -4.5, s * 10.6, 4.6, 4.6, 3.8, p, s);
        addWheel(b, -14.2, s * 10.6, 4.6, 4.6, 3.8, p, s);
        b.bevelBox(13.5, s * 10.4, 9.5, 9.0, 4.4, 1.8, 0.5, p.main);
      }
      b.bevelWedge(14.5, 0, 7.6, 10.5, 15.0, 9.5, 13.5, 6.4, 1.2, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(19.6, 0, 10.6, 1.8, 9.8, 5.2, 0.4, p.amber);
      b.bevelBox(19.8, 0, 6.8, 2.4, 19.8, 2.4, 0.4, p.main);
      for (const s of [-1, 1]) b.box(20.4, s * 7.2, 7.2, 1.8, 2.4, 2.2, p.lamp, 1, 4);
      b.bevelBox(7.2, 0, 14.8, 8.6, 18.6, 14.0, 1.3, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(11.3, 0, 17.8, 1.4, 14.8, 4.4, 0.2, p.glass, 0, 4);
      for (const s of [-1, 1]) {
        b.bevelBox(7.2, s * 9.3, 17.6, 4.8, 1.0, 4.0, 0.2, p.glass, 0, 4);
        addInsigniaSide(b, 7.2, s * 9.3, 11.4, s, p);
      }
      b.bevelBox(-9.5, 0, 9.4, 22.5, 20.6, 4.2, 0.8, p.shade);
      addCanvasTarp(b, -20.0, 1.0, 0, 19.8, 11.4, 13.8, 3, p);
      M.red_supply_truck_hull = b.finish();
    }

    // R7: SIEGE MORTAR
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        addTrackPod(b, -19.5, 19.5, s * 14.5, 6.8, 10.2, 4, p, p.main);
        addInsigniaSide(b, 6.0, s * 17.6, 9.0, s, p);
      }
      b.bevelWedge(0, 0, 4.4, 37.0, 23.0, 32.0, 21.5, 10.6, 2.0, p.main, 0, 0, 0.80, 1.0);
      b.wedge(16.5, 0, 4.4, 10, 20.5, 5, 18, 7.6, p.main, 0, -3.2, 0, 0.78, 1.0);
      for (const s of [-1, 1]) b.box(20.0, s * 6.5, 8.6, 2.0, 2.4, 2.2, p.lamp, 1, 4);
      b.cylZ(-1.0, 0, 14.2, 11.0, 10.5, 2.4, 12, p.dark);
      M.red_mortar_hull = b.finish();

      const t = new MeshBuilder();
      for (const s of [-1, 1]) {
        t.bevelWedge(0, s * 8.2, 0, 20.0, 5.4, 16.0, 4.4, 9.5, 1.2, p.main, 0, 0, 0.82, 1.0);
        addInsigniaSide(t, -1.0, s * 10.6, 4.6, s, p);
      }
      t.bevelBox(-8.5, 0, 5.2, 8.0, 19.5, 9.0, 1.4, p.shade);
      t.bevelBox(0, 0, 2.4, 14.0, 13.0, 4.6, 0.8, p.dark);
      M.red_mortar_turret = t.finish();

      const gun = new MeshBuilder();
      const rawTube = new MeshBuilder();
      rawTube.cylX(-6.5, 0, 0, 5.6, 6.0, 15.5, 14, p.silver, 0, 0);
      rawTube.cylX(7.5, 0, 0, 6.9, 6.9, 3.2, 14, p.silver, 0, 0);
      rawTube.cylX(9.2, 0, 0, 4.6, 4.6, 2.0, 12, p.dark, 0, 0);
      rawTube.cylX(-7.5, 0, 0, 6.2, 5.6, 3.2, 12, p.dark, 0, 0);
      addTransformed(gun, rawTube, 2.0, 0, 7.0, 0, -0.66, 0);
      M.red_mortar_barrel = gun.finish();
    }

    // R8: OBSIDIAN ORB DISRUPTOR
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        addTrackPod(b, -19.5, 4.0, s * 13.5, 6.2, 9.6, 3, p, p.main);
        addWheel(b, 13.2, s * 11.4, 4.6, 4.6, 3.6, p, s);
      }
      b.bevelBox(-1.0, 0, 6.2, 36.5, 20.5, 4.4, 0.8, p.dark);
      b.bevelWedge(11.5, 0, 7.6, 13.5, 19.8, 10.8, 18.2, 13.0, 1.6, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(16.6, 0, 15.8, 1.4, 14.4, 3.8, 0.3, p.glass, 0, 4);
      b.box(16.6, 0, 15.8, 1.7, 1.4, 4.0, p.main);
      for (const s of [-1, 1]) {
        b.box(18.5, s * 6.5, 9.4, 1.8, 2.4, 2.2, p.lamp, 1, 4);
        addInsigniaSide(b, 10.5, s * 9.8, 11.2, s, p);
      }
      b.bevelBox(-8.5, 0, 9.4, 21.0, 22.5, 3.6, 0.8, p.main, 0, 0, 0.80, 1.0);
      b.cylZ(-8.5, 0, 11.0, 9.2, 9.0, 2.2, 14, p.dark);
      M.red_orb_disruptor_hull = b.finish();

      const t = new MeshBuilder();
      t.cylZ(0, 0, 0, 8.6, 7.6, 3.2, 12, p.sub);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI * 0.5 + Math.PI * 0.25;
        const claw = new MeshBuilder();
        claw.bevelBox(0, 0, 4.5, 2.4, 2.8, 8.5, 0.5, p.dark);
        claw.bevelBox(-1.1, 0, 9.5, 2.8, 2.2, 3.8, 0.5, p.sub);
        addTransformed(t, claw, Math.cos(a) * 7.8, Math.sin(a) * 7.8, 2.0, 0, 0, a);
      }
      t.sphere(0, 0, 3.8, 1.6, 1.6, 1.6, 8, 5, p.glow, 1, 4);
      M.red_orb_disruptor_turret = t.finish();

      const orb = new MeshBuilder();
      orb.sphere(0, 0, 0, 7.6, 7.6, 7.6, 16, 10, p.obsidian, 0, 4);
      orb.torusZ(0, 0, -2.5, 6.2, 0.9, 14, 6, p.dark, 0, 0);
      M.red_orb_disruptor_orb = orb.finish();
    }
  }

  // =========================================================================
  // OLIVE VANGUARD (8 UNITS)
  // =========================================================================
  function buildGreenUnits(M) {
    const p = GREEN_PAL;

    // G1: RECON 4x4 HUMVEE
    {
      const b = new MeshBuilder();
      b.bevelBox(0, 0, 5.2, 32, 17.5, 3.4, 0.6, p.dark);
      for (const s of [-1, 1]) {
        addWheel(b, 11.8, s * 11.0, 4.8, 4.8, 3.8, p, s);
        addWheel(b, -11.5, s * 11.0, 4.8, 4.8, 3.8, p, s);
        b.bevelBox(11.8, s * 10.6, 9.8, 9.5, 4.0, 1.6, 0.5, p.main);
        b.bevelBox(-11.5, s * 10.6, 9.8, 9.5, 4.0, 1.6, 0.5, p.main);
      }
      b.bevelWedge(11.5, 0, 6.8, 13.5, 20.0, 12.2, 18.5, 6.4, 1.2, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(18.0, 0, 9.8, 1.8, 12.5, 4.2, 0.4, p.dark);
      for (const s of [-1, 1]) b.box(18.2, s * 7.4, 9.8, 1.6, 2.4, 2.0, p.lamp, 1, 4);
      b.bevelWedge(-2.5, 0, 7.6, 17.5, 20.2, 13.0, 18.0, 10.4, 1.4, p.main, 0, 0, 0.82, 1.0);
      const ws = new MeshBuilder();
      ws.bevelBox(0, 0, 0, 1.4, 15.6, 4.4, 0.2, p.glass, 0, 4);
      ws.box(0.2, 0, 0, 1.4, 1.2, 4.6, p.main);
      addTransformed(b, ws, 5.4, 0, 15.2, 0, -0.28, 0);
      b.wedge(-13.5, 0, 8.2, 9.5, 18.8, 5.0, 17.4, 8.2, p.main, 0, 3.0, 0, 0.80, 1.0);
      for (const s of [-1, 1]) {
        b.bevelBox(-0.5, s * 9.8, 14.5, 7.6, 1.2, 3.6, 0.2, p.glass, 0, 4);
        addInsigniaSide(b, -0.5, s * 10.0, 10.2, s, p);
      }
      b.cylZ(-1.5, 0, 17.6, 4.6, 4.4, 1.6, 10, p.sub);
      M.green_humvee_hull = b.finish();

      const t = new MeshBuilder();
      t.bevelBox(0, 0, 2.2, 7.8, 4.6, 3.8, 0.6, p.dark);
      t.bevelBox(-1.0, 3.6, 2.2, 4.6, 2.6, 3.0, 0.5, p.shade);
      t.cylX(3.5, 0, 2.6, 1.2, 1.0, 12.0, 8, p.dark);
      t.cylX(7.5, 0, 2.6, 1.5, 1.4, 2.0, 8, p.sub);
      M.green_humvee_turret = t.finish();
    }

    // G2: MEDIUM TANK
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        addTrackPod(b, -18.5, 18.5, s * 13.5, 6.2, 9.6, 5, p, p.main);
        addInsigniaSide(b, -1.0, s * 15.8, 10.8, s, p);
      }
      b.bevelWedge(0, 0, 4.0, 34.5, 21.5, 29.0, 19.5, 10.4, 2.0, p.main, 0, 0, 0.80, 1.0);
      b.wedge(15.5, 0, 4.2, 11, 19.5, 5, 17, 8.2, p.main, 0, -3.5, 0, 0.78, 1.0);
      for (const s of [-1, 1]) b.box(19.2, s * 6.5, 9.2, 2.0, 2.4, 2.2, p.lamp, 1, 4);
      b.box(16.2, -3.5, 10.5, 3.4, 1.6, 1.6, p.dark);
      b.bevelBox(-12.5, 0, 14.0, 8.5, 14.5, 2.2, 0.5, p.shade);
      M.green_medium_tank_hull = b.finish();

      const t = new MeshBuilder();
      t.bevelWedge(-1.0, 0, 0, 20.0, 18.0, 15.0, 13.8, 8.6, 2.0, p.main, 0, 0, 0.82, 1.0);
      t.bevelBox(-10.2, 0, 4.2, 6.2, 13.5, 6.2, 1.2, p.main);
      t.cylZ(-1.5, 3.0, 8.2, 3.6, 3.2, 2.2, 10, p.hi);
      t.bevelBox(8.6, 0, 4.4, 4.0, 6.6, 4.8, 0.7, p.shade);
      for (const s of [-1, 1]) addInsigniaSide(t, -1.5, s * 8.6, 4.4, s, p);
      M.green_medium_tank_turret = t.finish();

      const bar = new MeshBuilder();
      bar.cylX(9.0, 0, 4.6, 1.7, 1.5, 17.5, 10, p.sub);
      bar.cylX(25.0, 0, 4.6, 2.1, 1.9, 2.2, 8, p.dark);
      M.green_medium_tank_barrel = bar.finish();
    }

    // G3: MISSILE CARRIER
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        addTrackPod(b, -18.5, 3.0, s * 12.8, 5.8, 9.4, 3, p, p.main);
        addWheel(b, 13.0, s * 11.2, 4.6, 4.6, 3.6, p, s);
      }
      b.bevelBox(0, 0, 6.0, 36.0, 19.5, 4.0, 0.7, p.dark);
      b.bevelWedge(11.5, 0, 7.6, 13.0, 19.0, 10.5, 17.5, 13.0, 1.4, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(16.6, 0, 16.0, 1.4, 13.8, 3.8, 0.2, p.glass, 0, 4);
      for (const s of [-1, 1]) {
        b.box(18.2, s * 6.4, 9.2, 1.8, 2.4, 2.2, p.lamp, 1, 4);
        addInsigniaSide(b, 10.5, s * 9.4, 11.4, s, p);
      }
      b.bevelBox(-8.5, 0, 9.0, 19.5, 20.5, 3.8, 0.7, p.shade);
      b.cylZ(-7.5, 0, 10.8, 7.5, 7.5, 2.2, 12, p.dark);
      M.green_missile_truck_hull = b.finish();

      const t = new MeshBuilder();
      t.bevelBox(0, 0, 2.4, 11.0, 11.0, 4.4, 0.7, p.dark);
      const rail = new MeshBuilder();
      rail.bevelBox(0, 0, -2.5, 22.0, 5.4, 2.4, 0.4, p.sub);
      rail.cylX(-9.0, 0, 2.5, 3.4, 3.4, 16.0, 12, p.main, 0, 0);
      rail.cylX(7.0, 0, 2.5, 3.4, 2.8, 3.6, 12, p.white, 0, 4);
      rail.cylX(10.6, 0, 2.5, 2.8, 0.5, 6.2, 12, p.glow, 0, 4);
      rail.box(-7.5, 0, 2.5, 4.4, 9.4, 1.1, p.shade);
      rail.box(-7.5, 0, 2.5, 4.4, 1.1, 9.4, p.shade);
      addTransformed(t, rail, 0.5, 0, 9.8, 0, -0.58, 0);
      M.green_missile_truck_turret = t.finish();
    }

    // G4: 8x8 WHEELED APC
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        for (const wx of [-14.0, -4.8, 4.4, 13.6]) addWheel(b, wx, s * 11.4, 4.4, 4.4, 3.4, p, s);
        b.bevelWedge(0, s * 10.2, 9.6, 39.5, 4.8, 35.5, 4.2, 4.8, 0.9, p.main, 0, 0, 0.80, 1.0);
        addInsigniaSide(b, -4.0, s * 12.2, 12.2, s, p);
      }
      b.bevelWedge(-1.0, 0, 5.2, 39.5, 19.5, 33.0, 17.5, 13.6, 2.2, p.main, 0, 0, 0.80, 1.0);
      b.wedge(19.0, 0, 5.2, 9.5, 18.0, 4.0, 14.5, 9.8, p.main, 0, -3.5, 0, 0.78, 1.0);
      for (const s of [-1, 1]) {
        b.box(21.6, s * 5.8, 8.2, 1.8, 2.4, 2.0, p.lamp, 1, 4);
        b.bevelBox(14.5, s * 3.8, 14.8, 1.8, 4.8, 2.4, 0.2, p.glass, 0, 4);
      }
      b.cylZ(-10.0, 3.5, 18.4, 3.4, 3.0, 1.8, 10, p.shade);
      b.bevelBox(-19.5, 0, 12.2, 2.5, 13.5, 7.6, 0.5, p.shade);
      M.green_apc_8x8_hull = b.finish();

      const t = new MeshBuilder();
      t.cylZ(0, 0, 0, 4.8, 4.2, 2.6, 10, p.sub);
      t.bevelBox(0, 0, 3.2, 5.2, 4.2, 3.0, 0.5, p.dark);
      t.cylX(2.4, 0, 3.4, 1.0, 0.85, 8.5, 8, p.dark);
      M.green_apc_8x8_turret = t.finish();
    }

    // G5: ION HEAVY TANK
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        addTrackPod(b, -20.5, 20.5, s * 14.0, 6.4, 9.8, 5, p, p.main);
        addInsigniaSide(b, 4.0, s * 16.5, 9.8, s, p);
      }
      b.bevelWedge(-0.5, 0, 4.2, 38.5, 21.5, 32.0, 19.5, 10.0, 2.0, p.main, 0, 0, 0.80, 1.0);
      b.wedge(18.0, 0, 4.2, 11, 20, 5, 17, 7.8, p.main, 0, -3.5, 0, 0.78, 1.0);
      for (const s of [-1, 1]) b.box(21.6, s * 6.5, 8.8, 2.0, 2.4, 2.2, p.lamp, 1, 4);
      b.bevelBox(-14.5, 0, 14.0, 9.5, 14.5, 2.4, 0.5, p.dark);
      M.green_ion_tank_hull = b.finish();

      const t = new MeshBuilder();
      t.bevelWedge(0, 0, 0, 22.5, 18.0, 17.5, 14.5, 8.6, 2.0, p.main, 0, 0, 0.82, 1.0);
      t.bevelBox(-11.5, 0, 5.0, 7.6, 15.5, 6.6, 1.0, p.brown, 0, 0, 0.78, 0.96);
      t.cylY(-14.2, -6.5, 7.8, 2.2, 2.2, 13.0, 10, p.tanDark);
      t.cylZ(-1.0, 3.0, 8.2, 3.4, 3.0, 2.2, 10, p.hi);
      t.bevelBox(10.5, 0, 4.4, 4.4, 7.0, 5.2, 0.8, p.dark);
      for (const s of [-1, 1]) addInsigniaSide(t, 1.0, s * 8.8, 4.6, s, p);
      M.green_ion_tank_turret = t.finish();

      const bar = new MeshBuilder();
      bar.cylX(11.0, 0, 4.6, 2.35, 2.15, 16.5, 12, p.ion, 0.92, 4);
      bar.cylX(12.0, 0, 4.6, 2.6, 2.6, 2.2, 10, p.dark);
      bar.cylX(20.5, 0, 4.6, 2.5, 2.5, 1.8, 10, p.sub);
      M.green_ion_tank_barrel = bar.finish();
    }

    // G6: OLIVE 6x6 SUPPLY TRUCK
    {
      const b = new MeshBuilder();
      b.bevelBox(-1.0, 0, 6.2, 36.5, 19.0, 3.4, 0.6, p.dark);
      for (const s of [-1, 1]) {
        addWheel(b, 13.5, s * 10.6, 4.6, 4.6, 3.6, p, s);
        addWheel(b, -4.5, s * 10.6, 4.6, 4.6, 3.8, p, s);
        addWheel(b, -14.2, s * 10.6, 4.6, 4.6, 3.8, p, s);
        b.bevelBox(13.5, s * 10.4, 9.5, 9.0, 4.4, 1.8, 0.5, p.main);
      }
      b.bevelWedge(14.5, 0, 7.6, 10.8, 14.8, 9.8, 13.6, 6.4, 1.2, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(19.7, 0, 10.6, 1.6, 10.2, 5.2, 0.4, p.dark);
      b.bevelBox(19.8, 0, 6.8, 2.4, 19.8, 2.4, 0.4, p.shade);
      for (const s of [-1, 1]) b.box(20.4, s * 7.2, 7.2, 1.8, 2.4, 2.2, p.lamp, 1, 4);
      b.bevelBox(7.2, 0, 14.8, 8.6, 18.6, 14.0, 1.3, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(11.3, 0, 17.8, 1.4, 14.8, 4.4, 0.2, p.glass, 0, 4);
      for (const s of [-1, 1]) {
        b.bevelBox(7.2, s * 9.3, 17.6, 4.8, 1.0, 4.0, 0.2, p.glass, 0, 4);
        addInsigniaSide(b, 7.2, s * 9.3, 11.4, s, p);
      }
      b.bevelBox(-9.5, 0, 9.4, 22.5, 20.6, 4.4, 0.8, p.shade);
      addCanvasTarp(b, -20.0, 1.0, 0, 19.8, 11.4, 13.8, 3, p);
      M.green_supply_truck_hull = b.finish();
    }

    // G7: CYCLOPS LASER TANK
    {
      const b = new MeshBuilder();
      for (const s of [-1, 1]) {
        addTrackPod(b, -18.5, 18.5, s * 13.5, 6.2, 9.6, 4, p, p.main);
        addInsigniaSide(b, 5.0, s * 15.8, 10.2, s, p);
      }
      b.bevelWedge(0, 0, 4.0, 35.0, 21.5, 30.0, 19.8, 9.6, 1.8, p.main, 0, 0, 0.80, 1.0);
      b.wedge(16.0, 0, 4.2, 10, 19.5, 4.5, 17, 7.6, p.main, 0, -3.2, 0, 0.78, 1.0);
      for (const s of [-1, 1]) b.box(19.5, s * 6.5, 8.6, 2.0, 2.4, 2.2, p.lamp, 1, 4);
      M.green_laser_tank_hull = b.finish();

      const t = new MeshBuilder();
      t.cylZ(0, 0, 0, 10.8, 10.2, 10.4, 14, p.main, 0, 0, 0, false, 0.82, 1.0);
      t.cylZ(0, 0, 9.8, 9.6, 7.8, 2.4, 14, p.hi);
      t.cylZ(-2.5, -2.5, 11.8, 2.8, 2.4, 2.2, 10, p.shade);
      t.cylZ(-5.0, 5.5, 10.5, 0.6, 0.4, 9.0, 6, p.silver);
      t.cylX(7.5, 0, 5.6, 4.8, 4.8, 3.8, 12, p.dark);
      t.sphere(11.0, 0, 5.6, 2.4, 3.5, 3.5, 12, 8, p.glow, 0.96, 4);
      M.green_laser_tank_turret = t.finish();
    }

    // G8: EMP RADAR TRUCK
    {
      const b = new MeshBuilder();
      b.bevelBox(-1.0, 0, 6.0, 36.0, 19.5, 3.6, 0.6, p.dark);
      for (const s of [-1, 1]) {
        addWheel(b, 12.2, s * 10.8, 4.5, 4.5, 3.6, p, s);
        addWheel(b, -4.5, s * 10.8, 4.5, 4.5, 3.6, p, s);
        addWheel(b, -14.2, s * 10.8, 4.5, 4.5, 3.6, p, s);
      }
      b.bevelWedge(11.5, 0, 7.6, 12.8, 19.0, 11.4, 17.8, 12.8, 1.4, p.main, 0, 0, 0.82, 1.0);
      b.bevelBox(17.1, 0, 16.0, 1.4, 14.4, 4.0, 0.2, p.glass, 0, 4);
      b.box(17.1, 0, 16.0, 1.7, 1.2, 4.2, p.main);
      for (const s of [-1, 1]) {
        b.box(18.0, s * 6.5, 9.2, 1.8, 2.4, 2.2, p.lamp, 1, 4);
        addInsigniaSide(b, 10.5, s * 9.4, 11.2, s, p);
      }
      b.bevelBox(-8.5, 0, 9.0, 19.5, 20.5, 3.6, 0.7, p.shade);
      b.cylZ(-8.5, 0, 10.8, 8.6, 8.6, 2.2, 12, p.dark);
      M.green_radar_truck_hull = b.finish();

      const t = new MeshBuilder();
      t.cylZ(0, 0, 0, 7.8, 7.2, 2.8, 12, p.sub);
      t.cylZ(0, 0, 2.4, 2.6, 1.8, 19.5, 10, p.dark);
      t.sphere(0, 0, 11.5, 2.9, 2.9, 3.6, 10, 6, p.glow, 0.92, 4);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI * 0.5 + Math.PI * 0.25;
        cylPts(t, Math.cos(a) * 6.8, Math.sin(a) * 6.8, 2.4, 0, 0, 23.0, 0.9, 0.65, 8, p.silver, 0, 0);
      }
      t.torusZ(0, 0, 8.5, 5.4, 1.05, 14, 6, p.dark);
      t.torusZ(0, 0, 15.0, 3.6, 0.95, 14, 6, p.silver);
      t.sphere(0, 0, 24.2, 2.0, 2.0, 2.0, 10, 6, p.glow, 1, 4);
      M.green_radar_truck_turret = t.finish();
    }
  }

  function buildUnitMeshes() {
    const M = {};
    buildRedUnits(M);
    buildGreenUnits(M);
    return M;
  }

  FL.UNIT_MESHES = { buildUnitMeshes };
})();
