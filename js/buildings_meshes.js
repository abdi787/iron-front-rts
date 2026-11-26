(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});
  const { MeshBuilder, RED_PAL, NEUTRAL_PAL, addInsigniaSide } = FL.MESH_CORE;

  // =========================================================================
  // DIESELPUNK MILITARY BASE BUILDINGS & DESERT PROPS
  // Faction-parameterized bunkers, diesel generators, supply depots, motorpools,
  // workshops, radar bunkers, asymmetric Tier-2 heavy turrets, oil derricks.
  // =========================================================================

  function buildFactionBuildings(pal, factionKey) {
    const B = {};
    const CONCRETE = [0.46, 0.45, 0.42];
    const SANDBAG = pal.tan;
    const SANDBAG_D = pal.tanDark;

    // 1. HQ — Reinforced Sandbagged Command Bunker + Rotating Comms Mast
    {
      const b = new MeshBuilder();
      b.cylZ(0, 0, 0, 47, 45, 7.5, 8, CONCRETE, 0, Math.PI / 8, 0, true, 0.74, 0.94);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        b.bevelBox(sx * 31, sy * 31, 9.5, 16, 16, 12.5, 1.8, SANDBAG, 0, 0, 0.76, 0.96);
      }
      b.bevelWedge(0, 0, 6.5, 66, 66, 54, 54, 19.5, 2.6, CONCRETE, 0, 0, 0.78, 1.0);
      b.bevelWedge(0, 0, 24.5, 50, 50, 42, 42, 10.5, 2.0, pal.main, 0, 0, 0.82, 1.0);
      b.bevelBox(0, 0, 37.5, 28, 28, 6.5, 1.4, pal.sub, 0, 0, 0.84, 1.0);
      // Armored bunker observation slits + entrance bay
      b.bevelBox(28.5, 0, 14.0, 6.5, 24, 15.0, 1.0, pal.dark, 0, 0, 0.72, 0.90);
      b.bevelBox(25.6, 0, 30.0, 2.2, 24, 3.8, 0.3, pal.glass, 0, 4);
      for (const s of [-1, 1]) {
        b.bevelBox(0, s * 25.5, 30.0, 20, 2.2, 3.6, 0.3, pal.glass, 0, 4);
        addInsigniaSide(b, -8, s * 29.8, 18.0, s, pal);
      }
      b.box(32.0, 0, 8.2, 8.0, 28.0, 2.2, pal.amber, 0, 2); // hazard loading threshold
      B.bld_hq = b.finish();

      const h = new MeshBuilder();
      h.cylZ(0, 0, 0, 4.8, 4.2, 9.5, 10, pal.dark);
      h.dish(0, 0, 12.5, 12.5, 5.2, 12, pal.silver, pal.sub);
      h.sphere(0, 0, 13.0, 1.8, 1.8, 1.8, 8, 5, pal.glow, 0.95, 4);
      B.bld_hq_head = h.finish();
    }

    // 2. DIESEL GENERATOR — Twin Riveted Steel Fuel Silos + Dual Smokestacks
    {
      const b = new MeshBuilder();
      b.bevelBox(0, 0, 3.8, 58, 54, 7.6, 1.5, CONCRETE, 0, 0, 0.74, 0.94);
      b.bevelBox(-6, 0, 14.0, 26, 40, 16.5, 1.8, pal.main, 0, 0, 0.80, 1.0);
      b.bevelBox(-6, 0, 23.0, 24, 38, 3.2, 0.8, pal.sub);
      for (const s of [-1, 1]) {
        // Riveted diesel fuel tank silos
        b.cylZ(14, s * 14, 7.0, 10.5, 10.2, 24.0, 14, pal.sub, 0, 0, 0, false, 0.78, 1.0);
        b.cylZ(14, s * 14, 16.0, 11.2, 11.2, 3.2, 14, pal.main);
        b.cylZ(14, s * 14, 29.5, 8.4, 6.2, 4.2, 12, pal.dark);
        // Smokestacks with hazard collar
        b.cylZ(-15, s * 12, 22.0, 3.8, 3.2, 16.5, 10, pal.dark);
        b.cylZ(-15, s * 12, 34.5, 4.1, 4.1, 3.2, 10, pal.amber, 0, 2);
      }
      b.box(7.2, 0, 15.0, 2.4, 18.0, 5.0, pal.amber, 0, 2);
      B.bld_generator = b.finish();
    }

    // 3. SUPPLY DEPOT — Loading Dock + Corrugated Warehouse + Canvas Awning + Crates
    {
      const b = new MeshBuilder();
      b.bevelBox(0, 0, 4.0, 74, 72, 8.0, 1.6, CONCRETE, 0, 0, 0.74, 0.94);
      b.bevelBox(28, 0, 8.8, 14, 38, 3.2, 0.6, pal.amber, 0, 2);
      // Corrugated warehouse building
      b.bevelBox(-10, -8, 19.5, 44, 46, 23.0, 2.2, pal.main, 0, 0, 0.80, 1.0);
      for (const rx of [-26, -16, -6, 4]) {
        b.bevelBox(rx, -8, 31.4, 3.2, 44, 1.8, 0.5, pal.shade);
      }
      // Canvas awning over unloading bay
      b.bevelBox(18, -8, 22.5, 18, 32, 4.2, 0.8, SANDBAG);
      for (const sy of [-21, 5]) b.cylZ(25, sy, 8, 1.4, 1.4, 14.5, 8, pal.dark);
      // Stacked supply crates & yellow/red fuel drums
      b.bevelBox(-8, 24, 13.0, 16, 16, 10.0, 0.8, SANDBAG_D);
      b.bevelBox(-10, 23, 21.5, 11, 11, 7.5, 0.7, pal.brown);
      for (const fx of [10, 18]) for (const fy of [18, 26]) {
        b.cylZ(fx, fy, 8.0, 3.0, 3.0, 7.6, 10, pal.amber);
      }
      B.bld_depot = b.finish();
    }

    // 4. MOTORPOOL — Armored Tank Hangar + Overhead Steel Gantry + Service Ramp
    {
      const b = new MeshBuilder();
      b.bevelBox(0, 0, 4.2, 82, 80, 8.4, 1.8, CONCRETE, 0, 0, 0.74, 0.94);
      b.bevelBox(24, 0, 9.0, 28, 36, 2.4, 0.5, pal.sub, 0, 2);
      for (const s of [-1, 1]) {
        b.bevelBox(-4, s * 26, 20.5, 62, 22, 25.0, 2.2, pal.main, 0, 0, 0.80, 1.0);
        b.bevelBox(-4, s * 26, 33.8, 56, 16, 3.6, 1.0, pal.shade);
        addInsigniaSide(b, 8, s * 37.2, 21, s, pal);
      }
      // Rear main armored bay
      b.bevelBox(-22, 0, 23.0, 28, 56, 29.0, 2.4, pal.sub, 0, 0, 0.80, 1.0);
      b.bevelBox(-9, 0, 16.0, 6.0, 26, 15.0, 0.6, pal.dark); // dark hangar door recess
      // Gantry crane bridge
      b.bevelBox(10, 0, 40.5, 14, 68, 7.2, 1.2, pal.amber, 0, 0, 0.86, 1.0);
      for (const s of [-1, 1]) b.bevelBox(10, s * 28, 34.0, 9, 8, 10.0, 1.0, pal.dark);
      B.bld_motorpool = b.finish();
    }

    // 5. AT BUNKER — Sandbagged Concrete Ring + Rotating Anti-Tank Turret
    {
      const base = new MeshBuilder();
      base.cylZ(0, 0, 0, 24.5, 22.5, 7.5, 10, SANDBAG, 0, Math.PI / 10, 0, true, 0.74, 0.94);
      base.cylZ(0, 0, 6.5, 18.0, 16.5, 7.0, 12, CONCRETE, 0, 0, 0, false, 0.80, 0.98);
      B.bld_bunker = base.finish();

      const head = new MeshBuilder();
      head.bevelWedge(0, 0, 0, 20.5, 19.5, 15.5, 15.0, 9.6, 1.8, pal.main, 0, 0, 0.84, 1.0);
      head.cylZ(-2.5, 0, 9.2, 3.4, 3.0, 2.2, 10, pal.sub);
      head.cylX(7.5, 0, 4.8, 2.2, 1.9, 19.5, 10, pal.silver);
      head.cylX(25.5, 0, 4.8, 2.8, 2.5, 2.6, 8, pal.dark);
      B.bld_bunker_head = head.finish();
    }

    // 6. FIELD WORKSHOP — Concrete Repair Pad + Steel Jib Crane + Mechanic Shed
    {
      const b = new MeshBuilder();
      b.bevelBox(0, 0, 3.8, 66, 66, 7.6, 1.5, CONCRETE, 0, 0, 0.76, 0.96);
      b.box(2, 0, 8.0, 28, 8.0, 1.2, pal.amber, 0, 0);
      b.box(2, 0, 8.0, 8.0, 28, 1.2, pal.amber, 0, 0);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        b.cylZ(sx * 26, sy * 26, 7, 3.8, 3.4, 11.5, 8, pal.dark);
      }
      b.bevelBox(-23, 0, 20.0, 16, 44, 24.5, 2.0, pal.main, 0, 0, 0.80, 1.0);
      b.bevelBox(-5, 0, 31.5, 38, 12.5, 5.5, 1.0, pal.sub, 0, 0, 0.86, 1.0);
      b.bevelBox(12, 16, 11.5, 10, 10, 7.0, 0.8, pal.brown);
      B.bld_workshop = b.finish();
    }

    // 7. COMMAND CENTER (TECH RADAR) — Armored Comms Bunker + Parabolic Radar Dish
    {
      const b = new MeshBuilder();
      b.cylZ(0, 0, 0, 37, 35, 8.0, 8, CONCRETE, 0, Math.PI / 8, 0, true, 0.74, 0.94);
      b.bevelBox(0, 0, 18.0, 52, 48, 20.0, 2.4, pal.main, 0, 0, 0.80, 1.0);
      b.bevelBox(0, 0, 29.5, 34, 34, 6.0, 1.4, pal.sub, 0, 0, 0.86, 1.0);
      b.bevelBox(26.5, 0, 18.0, 2.2, 28, 5.5, 0.3, pal.glass, 0, 4);
      for (const s of [-1, 1]) b.bevelBox(0, s * 24.5, 18.0, 24, 2.2, 5.5, 0.3, pal.glass, 0, 4);
      B.bld_command = b.finish();

      const dish = new MeshBuilder();
      dish.cylZ(0, 0, 0, 5.8, 5.2, 7.2, 12, pal.sub);
      dish.cylZ(-2.5, 0, 6, 2.8, 2.6, 12, 10, pal.dark);
      dish.dish(0, 0, 18, 17.5, 7.8, 14, pal.silver, pal.dark);
      dish.cylX(1, 0, 19, 1.8, 1.4, 10.5, 10, pal.glow, 0.85, 4);
      B.bld_command_head = dish.finish();
    }

    // 8. TIER-2 HEAVY DEFENSE — Fortified Ring + Asymmetric Turret (Red Twin Howitzer vs Green Twin Ion Battery)
    {
      const base = new MeshBuilder();
      base.cylZ(0, 0, 0, 26.5, 24.5, 9.5, 8, SANDBAG, 0, Math.PI / 8, 0, true, 0.72, 0.92);
      base.cylZ(0, 0, 8.5, 20.0, 18.0, 9.5, 10, CONCRETE, 0, 0, 0, false, 0.78, 0.96);
      base.bevelBox(0, 0, 13.5, 42, 10, 4.5, 0.7, pal.amber, 0, 2);
      base.bevelBox(0, 0, 13.5, 10, 42, 4.5, 0.7, pal.amber, 0, 2);
      B.bld_heavyGun = base.finish();

      const head = new MeshBuilder();
      if (factionKey === 'green') {
        head.bevelWedge(0, 0, 0, 22.5, 22.0, 17.5, 17.0, 12.0, 2.2, pal.main, 0, 0, 0.84, 1.0);
        head.bevelBox(-9.5, 0, 6.2, 8.5, 18.0, 8.5, 1.2, pal.brown);
        for (const s of [-1, 1]) {
          head.cylX(7.5, s * 5.0, 6.2, 2.4, 2.1, 18.5, 12, pal.ion, 0.92, 4);
          head.cylX(10.0, s * 5.0, 6.2, 2.8, 2.8, 2.4, 10, pal.dark);
        }
      } else {
        head.bevelWedge(0, 0, 0, 23.0, 22.5, 17.5, 17.5, 12.5, 2.2, RED_PAL.main, 0, 0, 0.84, 1.0);
        head.bevelBox(-10.0, 0, 6.5, 8.0, 18.5, 9.0, 1.2, pal.dark);
        for (const s of [-1, 1]) {
          head.cylX(7.5, s * 5.2, 6.4, 2.8, 2.6, 17.5, 12, pal.silver);
          head.cylX(22.5, s * 5.2, 6.4, 3.6, 3.6, 3.0, 10, pal.dark);
        }
        head.sphere(0, 0, 13.0, 3.2, 3.2, 3.2, 10, 6, pal.glow, 0.95, 4);
      }
      B.bld_heavyGun_head = head.finish();
    }

    // 9. OIL OUTPOST / CAPTURE POINT DERRICK
    {
      const d = new MeshBuilder();
      d.cylZ(0, 0, 0, 28, 27, 6.0, 8, CONCRETE, 0, Math.PI / 8, 0, true, 0.74, 0.94);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        d.wedge(sx * 12, sy * 12, 5, 4.6, 4.6, 3.1, 3.1, 42, pal.sub, 0, -sx * 6, 0, 0.78, 1.0);
      }
      d.bevelBox(0, 0, 26, 22.5, 22.5, 4.4, 0.9, pal.main);
      d.bevelBox(6, 11, 39, 10.5, 2.2, 6.5, 0.3, pal.main, 0, 4);
      d.cylZ(0, 0, 45, 5.4, 5.4, 6.0, 10, factionKey === 'neutral' ? pal.amber : pal.main, 0.4, 0, 4);
      d.sphere(0, 0, 52, 2.6, 2.6, 2.6, 10, 6, factionKey === 'neutral' ? NEUTRAL_PAL.glow : pal.glow, 0.95, 4);
      B.outpost = d.finish();
    }

    return B;
  }

  function buildPropMeshes() {
    const P = { supply: [], rock: [] };
    const pallet = [0.48, 0.34, 0.22];
    const palletAlt = [0.41, 0.29, 0.19];
    const woodDark = [0.31, 0.21, 0.14];
    const crateO = [0.44, 0.48, 0.26];
    const crateODark = [0.32, 0.36, 0.19];
    const tarpT = [0.82, 0.67, 0.36];
    const tarpDark = [0.60, 0.47, 0.23];
    const ammoCol = [0.56, 0.54, 0.46];
    const drumY = [0.89, 0.65, 0.18];
    const drumR = [0.76, 0.21, 0.18];
    const drumRim = [0.20, 0.19, 0.18];
    const mesa1 = [0.54, 0.39, 0.27];
    const mesa2 = [0.44, 0.32, 0.23];

    for (let v = 0; v < 2; v++) {
      const s = v === 0 ? 1 : -1;

      const base = new MeshBuilder();
      for (const sy of [-8.0, 0, 8.0]) {
        base.bevelBox(0, sy, 1.1, 26.5, 3.6, 2.2, 0.3, woodDark, 0, 0, 0.70, 0.88);
      }
      const plankXs = [-10.2, -3.4, 3.4, 10.2];
      plankXs.forEach((px, idx) => {
        base.bevelBox(px, 0, 3.3, 5.8, 24.5, 2.2, 0.4, idx % 2 === 0 ? pallet : palletAlt, 0, 0, 0.76, 0.96);
      });

      const items = [];

      // 0: Main olive crate (remains until depleted)
      const c0 = new MeshBuilder();
      c0.bevelBox(-4.8 * s, -4.5, 9.6, 13.0, 12.0, 10.4, 0.9, crateO, 0, 0, 0.80, 1.0);
      c0.bevelBox(-4.8 * s, -4.5, 14.6, 13.6, 12.6, 1.6, 0.4, crateODark, 0, 0, 0.82, 1.0);
      items.push(c0.finish());

      // 1: Tan tarped container
      const c1 = new MeshBuilder();
      c1.bevelBox(5.2 * s, 4.8, 10.9, 11.4, 11.4, 13.0, 1.0, tarpT, 0, 0, 0.82, 1.0);
      c1.box(5.2 * s, 4.8, 11.2, 11.8, 2.2, 12.8, tarpDark, 0, 0, 0.78, 0.96);
      items.push(c1.finish());

      // 2: Yellow fuel drum
      const d0 = new MeshBuilder();
      d0.cylZ(-6.6 * s, 6.4, 4.4, 3.5, 3.5, 9.6, 10, drumY, 0, 0);
      d0.cylZ(-6.6 * s, 6.4, 8.6, 3.75, 3.75, 1.3, 10, drumRim, 0, 0);
      items.push(d0.finish());

      // 3: Red fuel drum
      const d1 = new MeshBuilder();
      d1.cylZ(6.6 * s, -6.2, 4.4, 3.5, 3.5, 9.6, 10, drumR, 0, 0);
      d1.cylZ(6.6 * s, -6.2, 8.6, 3.75, 3.75, 1.3, 10, drumRim, 0, 0);
      items.push(d1.finish());

      // 4: Stacked ammo crate on olive container
      const c2 = new MeshBuilder();
      c2.bevelBox(-4.8 * s, -4.5, 18.1, 8.2, 7.2, 5.4, 0.6, ammoCol, 0, 0, 0.82, 1.0);
      c2.box(-4.8 * s, -4.5, 18.2, 8.5, 1.8, 1.6, drumY, 0, 0, 0.85, 1.0);
      items.push(c2.finish());

      // 5: Top red keg on tan container
      const d2 = new MeshBuilder();
      d2.cylZ(5.2 * s, 4.8, 17.6, 2.7, 2.7, 6.2, 10, drumR, 0, 0);
      d2.cylZ(5.2 * s, 4.8, 23.8, 1.0, 1.0, 0.9, 8, drumRim, 0, 0);
      items.push(d2.finish());

      P.supply.push({ base: base.finish(), items });
    }

    for (let v = 0; v < 3; v++) {
      const b = new MeshBuilder();
      const s = v === 1 ? -1 : 1;
      b.bevelWedge(0, 0, 0, 44, 38, 28, 22, 18 + v * 3, 2.5, mesa1, 0, 3, 0.74, 1.0);
      b.bevelWedge(s * 12, -8, 0, 24, 22, 13, 12, 13, 1.8, mesa2, 0, 3, 0.74, 0.96);
      b.bevelWedge(-s * 10, 9, 0, 22, 20, 12, 11, 15, 1.8, mesa2, 0, 3, 0.74, 0.96);
      P.rock.push(b.finish());
    }
    return P;
  }

  FL.BUILDING_MESHES = { buildFactionBuildings, buildPropMeshes };
})();
