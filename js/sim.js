(() => {
  'use strict';
  const FL = (window.FRONTLINE = window.FRONTLINE || {});

  const WORLD_WIDTH = 2400;
  const WORLD_HEIGHT = 1600;
  const CAPTURE_POINT_RADIUS = 74;
  const CAPTURE_POINT_SUPPLY_RATE = 10;
  const CAPTURE_RATE_PER_SEC = 0.16;

  const FACTION_INFO = {
    red: {
      id: 'red',
      name: 'Red Dominion',
      short: 'ДОМИНИОН',
      color: '#E0463C',
      accent: '#EAB308',
      desc: 'Багги, танки, огнемёты, тяжёлые мортиры и Чёрная Сфера'
    },
    green: {
      id: 'green',
      name: 'Olive Vanguard',
      short: 'АВАНГАРД',
      color: '#87A343',
      accent: '#D4A942',
      desc: 'Хамви, БТР 8×8, ракетные ПУ, лазер-танки и ионные батареи'
    }
  };

  const FACTION_UNITS = {
    red: [
      'red_supply_truck', 'red_buggy', 'red_light_tank', 'red_halftrack',
      'red_apc_truck', 'red_flame_tank', 'red_mortar', 'red_orb_disruptor'
    ],
    green: [
      'green_supply_truck', 'green_humvee', 'green_medium_tank', 'green_apc_8x8',
      'green_missile_truck', 'green_laser_tank', 'green_ion_tank', 'green_radar_truck'
    ]
  };

  const BUILD_ORDER = ['generator', 'depot', 'motorpool', 'bunker', 'workshop', 'command', 'heavyGun'];

  const VETERANCY_SPECS = {
    0: { rank: 0, xp: 0,   dmgTaken: 1.00, rof: 1.00, dmgDeal: 1.00, regen: 0 },
    1: { rank: 1, xp: 90,  dmgTaken: 0.85, rof: 1.18, dmgDeal: 1.12, regen: 0 },
    2: { rank: 2, xp: 220, dmgTaken: 0.72, rof: 1.32, dmgDeal: 1.25, regen: 6 },
    3: { rank: 3, xp: 400, dmgTaken: 0.60, rof: 1.48, dmgDeal: 1.42, regen: 12 }
  };

  const UNIT_SPECS = {
    // === RED DOMINION ===
    red_supply_truck: {
      kind: 'red_supply_truck', faction: 'red', name: 'Снабженец', role: 'Сбор припасов', hotkey: 'Q',
      cost: 150, buildTime: 5.5, maxHp: 245, speed: 74, turnSpeed: 3.4, turretTurn: 0,
      radius: 18, range: 0, sight: 225, damage: 0, cooldown: 1, projSpeed: 0, splash: 0, burst: 0,
      isHarvester: true, supplyCapacity: 110, harvestRate: 34, requiresBuilding: 'hq', salvage: 0
    },
    red_buggy: {
      kind: 'red_buggy', faction: 'red', name: 'Багги', role: 'Быстрый разведчик', hotkey: 'Z',
      cost: 85, buildTime: 3.5, maxHp: 110, speed: 144, turnSpeed: 6.6, turretTurn: 7.5,
      radius: 13, range: 185, sight: 420, damage: 11, cooldown: 0.42, projSpeed: 560, splash: 0, burst: 2,
      projKind: 'bullet', requiresBuilding: 'motorpool', salvage: 35
    },
    red_light_tank: {
      kind: 'red_light_tank', faction: 'red', name: 'Лёгкий танк', role: 'Основной штурм', hotkey: 'X',
      cost: 165, buildTime: 5.8, maxHp: 265, speed: 88, turnSpeed: 3.8, turretTurn: 5.6,
      radius: 18, range: 245, sight: 290, damage: 35, cooldown: 1.22, projSpeed: 480, splash: 18, burst: 1,
      projKind: 'shell', requiresBuilding: 'motorpool', salvage: 65
    },
    red_halftrack: {
      kind: 'red_halftrack', faction: 'red', name: 'Полугусенич.', role: 'Штурм-САУ', hotkey: 'C',
      cost: 195, buildTime: 6.4, maxHp: 310, speed: 80, turnSpeed: 3.5, turretTurn: 5.2,
      radius: 18, range: 255, sight: 285, damage: 22, cooldown: 0.86, projSpeed: 510, splash: 16, burst: 2,
      projKind: 'shell', requiresBuilding: 'motorpool', salvage: 80
    },
    red_apc_truck: {
      kind: 'red_apc_truck', faction: 'red', name: 'БТР-рем.', role: 'Полевой ремонт + броня', hotkey: 'V',
      cost: 230, buildTime: 7.2, maxHp: 390, speed: 74, turnSpeed: 3.2, turretTurn: 0,
      radius: 19, range: 170, sight: 270, damage: 12, cooldown: 0.65, projSpeed: 520, splash: 0, burst: 2,
      projKind: 'bullet', repairAuraRadius: 165, repairAuraRate: 12, requiresBuilding: 'motorpool', salvage: 90
    },
    red_flame_tank: {
      kind: 'red_flame_tank', faction: 'red', name: 'Огнемёт', role: 'Выжигатель укреплений', hotkey: 'B',
      cost: 270, buildTime: 7.8, maxHp: 400, speed: 76, turnSpeed: 3.4, turretTurn: 5.5,
      radius: 19, range: 175, sight: 265, damage: 30, cooldown: 0.52, projSpeed: 900, splash: 34, burst: 1,
      vsBuildingMult: 1.35, projKind: 'flame', requiresBuilding: 'motorpool', salvage: 110
    },
    red_mortar: {
      kind: 'red_mortar', faction: 'red', name: 'Мортира', role: 'Осадная гаубица · Штаб-связь', hotkey: 'N',
      cost: 340, buildTime: 9.2, maxHp: 225, speed: 58, turnSpeed: 2.6, turretTurn: 3.6,
      radius: 20, range: 420, sight: 310, damage: 72, cooldown: 2.85, projSpeed: 260, splash: 66, burst: 1,
      projKind: 'mortar', requiresBuilding: 'motorpool', requiresTech: 'command', salvage: 130
    },
    red_orb_disruptor: {
      kind: 'red_orb_disruptor', faction: 'red', name: 'Чёрная Сфера', role: 'Ударная волна + замедление', hotkey: 'M',
      cost: 410, buildTime: 10.6, maxHp: 370, speed: 68, turnSpeed: 3.0, turretTurn: 4.8,
      radius: 20, range: 285, sight: 335, damage: 56, cooldown: 1.75, projSpeed: 1600, splash: 54, burst: 1,
      slowDur: 2.5, projKind: 'orb', requiresBuilding: 'motorpool', requiresTech: 'command', salvage: 155
    },

    // === OLIVE VANGUARD ===
    green_supply_truck: {
      kind: 'green_supply_truck', faction: 'green', name: 'Грузовик', role: 'Сбор припасов', hotkey: 'Q',
      cost: 150, buildTime: 5.5, maxHp: 245, speed: 74, turnSpeed: 3.4, turretTurn: 0,
      radius: 18, range: 0, sight: 225, damage: 0, cooldown: 1, projSpeed: 0, splash: 0, burst: 0,
      isHarvester: true, supplyCapacity: 110, harvestRate: 34, requiresBuilding: 'hq', salvage: 0
    },
    green_humvee: {
      kind: 'green_humvee', faction: 'green', name: 'Хамви', role: 'Манёвренный разведчик', hotkey: 'Z',
      cost: 90, buildTime: 3.6, maxHp: 125, speed: 138, turnSpeed: 6.2, turretTurn: 7.4,
      radius: 14, range: 190, sight: 420, damage: 11, cooldown: 0.42, projSpeed: 560, splash: 0, burst: 2,
      projKind: 'bullet', requiresBuilding: 'motorpool', salvage: 35
    },
    green_medium_tank: {
      kind: 'green_medium_tank', faction: 'green', name: 'Средний танк', role: 'Надёжный танк', hotkey: 'X',
      cost: 175, buildTime: 6.1, maxHp: 295, speed: 82, turnSpeed: 3.6, turretTurn: 5.4,
      radius: 18, range: 250, sight: 290, damage: 37, cooldown: 1.25, projSpeed: 480, splash: 20, burst: 1,
      projKind: 'shell', requiresBuilding: 'motorpool', salvage: 70
    },
    green_apc_8x8: {
      kind: 'green_apc_8x8', faction: 'green', name: 'БТР 8×8', role: 'Поддержка + автопушка', hotkey: 'C',
      cost: 215, buildTime: 6.8, maxHp: 340, speed: 92, turnSpeed: 4.0, turretTurn: 6.0,
      radius: 19, range: 225, sight: 300, damage: 18, cooldown: 0.72, projSpeed: 540, splash: 10, burst: 2,
      projKind: 'bullet', repairAuraRadius: 150, repairAuraRate: 10, requiresBuilding: 'motorpool', salvage: 85
    },
    green_missile_truck: {
      kind: 'green_missile_truck', faction: 'green', name: 'Ракета', role: 'Дальнобойный залп', hotkey: 'V',
      cost: 290, buildTime: 8.2, maxHp: 205, speed: 68, turnSpeed: 2.9, turretTurn: 3.8,
      radius: 19, range: 405, sight: 320, damage: 64, cooldown: 2.45, projSpeed: 315, splash: 58, burst: 1,
      projKind: 'missile', requiresBuilding: 'motorpool', salvage: 110
    },
    green_laser_tank: {
      kind: 'green_laser_tank', faction: 'green', name: 'Циклоп', role: 'Точный лазер', hotkey: 'B',
      cost: 310, buildTime: 8.6, maxHp: 350, speed: 78, turnSpeed: 3.4, turretTurn: 5.8,
      radius: 18, range: 275, sight: 305, damage: 44, cooldown: 1.05, projSpeed: 1600, splash: 0, burst: 1,
      projKind: 'laser', requiresBuilding: 'motorpool', salvage: 120
    },
    green_ion_tank: {
      kind: 'green_ion_tank', faction: 'green', name: 'Ион-танк', role: 'Тяжёлый ион · Штаб-связь', hotkey: 'N',
      cost: 390, buildTime: 10.2, maxHp: 465, speed: 68, turnSpeed: 3.0, turretTurn: 4.6,
      radius: 21, range: 305, sight: 320, damage: 66, cooldown: 1.48, projSpeed: 1600, splash: 28, burst: 1,
      projKind: 'ion', requiresBuilding: 'motorpool', requiresTech: 'command', salvage: 150
    },
    green_radar_truck: {
      kind: 'green_radar_truck', faction: 'green', name: 'РЭБ-вышка', role: 'EMP-разряд + обзор', hotkey: 'M',
      cost: 350, buildTime: 9.5, maxHp: 290, speed: 74, turnSpeed: 3.2, turretTurn: 5.0,
      radius: 19, range: 320, sight: 480, damage: 34, cooldown: 1.65, projSpeed: 1600, splash: 42, burst: 1,
      slowDur: 2.2, projKind: 'emp', requiresBuilding: 'motorpool', requiresTech: 'command', salvage: 135
    }
  };

  const BUILDING_SPECS = {
    hq: {
      kind: 'hq', name: 'Штаб-Бункер', role: 'База · Сбор припасов', hotkey: '',
      cost: 0, buildTime: 0, maxHp: 1500, radius: 44, footprintW: 90, footprintH: 90,
      powerDelta: 30, sight: 420, range: 0, damage: 0, cooldown: 0, buildable: false, canSell: false,
      produces: ['supply']
    },
    generator: {
      kind: 'generator', name: 'Дизель-ген.', role: '+50 энергии', hotkey: '4',
      cost: 110, buildTime: 3.4, maxHp: 450, radius: 30, footprintW: 64, footprintH: 64,
      powerDelta: 50, sight: 220, range: 0, damage: 0, cooldown: 0, buildable: true, canSell: true,
      produces: []
    },
    depot: {
      kind: 'depot', name: 'Склад', role: 'Приём + Грузовик', hotkey: '5',
      cost: 230, buildTime: 5.0, maxHp: 650, radius: 38, footprintW: 80, footprintH: 80,
      powerDelta: -15, sight: 245, range: 0, damage: 0, cooldown: 0, buildable: true, canSell: true,
      produces: []
    },
    motorpool: {
      kind: 'motorpool', name: 'Ангар', role: 'Производство техники', hotkey: '6',
      cost: 275, buildTime: 6.0, maxHp: 820, radius: 42, footprintW: 88, footprintH: 88,
      powerDelta: -20, sight: 260, range: 0, damage: 0, cooldown: 0, buildable: true, canSell: true,
      produces: ['combat']
    },
    bunker: {
      kind: 'bunker', name: 'ДОТ ПТО', role: 'Оборона базы', hotkey: '7',
      cost: 150, buildTime: 3.2, maxHp: 420, radius: 24, footprintW: 50, footprintH: 50,
      powerDelta: -15, sight: 330, range: 290, damage: 25, cooldown: 0.72, projSpeed: 590,
      buildable: true, canSell: true, produces: []
    },
    workshop: {
      kind: 'workshop', name: 'Рембаза', role: 'Починка рядом', hotkey: '8',
      cost: 195, buildTime: 4.3, maxHp: 530, radius: 34, footprintW: 72, footprintH: 72,
      powerDelta: -15, sight: 240, range: 0, damage: 0, cooldown: 0, buildable: true, canSell: true,
      produces: [], repairRadius: 195, repairRate: 30
    },
    command: {
      kind: 'command', name: 'Штаб-связь', role: 'Открывает элитную технику', hotkey: '9',
      cost: 315, buildTime: 5.6, maxHp: 590, radius: 36, footprintW: 74, footprintH: 74,
      powerDelta: -25, sight: 350, range: 0, damage: 0, cooldown: 0, buildable: true, canSell: true,
      produces: []
    },
    heavyGun: {
      kind: 'heavyGun', name: 'Батарея', role: 'Тяжёлый ДОТ · Связь', hotkey: '0',
      cost: 290, buildTime: 4.2, maxHp: 520, radius: 26, footprintW: 54, footprintH: 54,
      powerDelta: -25, sight: 375, range: 365, damage: 70, cooldown: 1.30, projSpeed: 640,
      buildable: true, canSell: true, produces: [], requiresTech: 'command'
    }
  };

  const SUPPORT_POWER_SPECS = {
    reconSweep: { kind: 'reconSweep', name: 'Разведка', maxCooldown: 35, radius: 360, duration: 10 },
    artilleryBarrage: { kind: 'artilleryBarrage', name: 'Артудар', maxCooldown: 55, radius: 160, duration: 2.0, damage: 250, requiresTech: 'command' }
  };

  const AI_PROFILES = {
    easy: {
      playerStartSup: 660, enemyStartSup: 300, startGen: 1, startBunkers: 1, startRecon: 1, startTanks: 1,
      passiveSup: 1, maxSupplyTrucks: 1, decInt: 5.8, prodMult: 0.70, armyCap: 7, maxBunkers: 2,
      techTime: 185, firstWave: 72, waveInt: 56, minSquad: 2, maxSquad: 4, useBarrage: false
    },
    normal: {
      playerStartSup: 520, enemyStartSup: 490, startGen: 2, startBunkers: 1, startRecon: 1, startTanks: 2,
      passiveSup: 4, maxSupplyTrucks: 2, decInt: 3.1, prodMult: 0.98, armyCap: 12, maxBunkers: 2,
      techTime: 115, firstWave: 44, waveInt: 35, minSquad: 3, maxSquad: 5, useBarrage: false
    },
    hard: {
      playerStartSup: 450, enemyStartSup: 680, startGen: 2, startBunkers: 2, startRecon: 2, startTanks: 2,
      passiveSup: 11, maxSupplyTrucks: 2, decInt: 1.7, prodMult: 1.15, armyCap: 18, maxBunkers: 3,
      techTime: 56, firstWave: 24, waveInt: 24, minSquad: 4, maxSquad: 8, useBarrage: true
    }
  };

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function normAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
  function stepAngle(cur, target, maxD) {
    const d = normAngle(target - cur);
    if (Math.abs(d) <= maxD) return target;
    return normAngle(cur + Math.sign(d) * maxD);
  }
  const distSq = (ax, ay, bx, by) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay);

  class RtsSimulation {
    constructor(opts = {}) {
      this.effects = opts.effects || null;
      this.sound = opts.sound || null;
      this.fog = opts.fog || null;

      this.phase = 'title';
      this.outcome = null;
      this.playerFaction = 'red';
      this.enemyFaction = 'green';
      this.difficulty = 'normal';
      this.elapsedTime = 0;
      this.demoMode = true;

      this.units = [];
      this.buildings = [];
      this.supplyNodes = [];
      this.obstacles = [];
      this.projectiles = [];
      this.orderMarkers = [];
      this.wrecks = [];
      this.capturePoints = [];
      this.activeRadarScans = [];
      this.activeAirstrikes = [];
      this.repairBeams = [];

      this.economies = { red: this.mkEcon(500), green: this.mkEcon(500) };
      this.placementMode = null;
      this.attackMoveMode = false;
      this.activePowerMode = null;
      this.supportPowers = this.mkPowers();
      this.alertText = null;
      this.alertTimer = 0;
      this.cameraTrauma = 0;
      this.nextId = 1;

      this.aiTimer = 0;
      this.aiWaveTimer = 28;
      this.aiWaveCount = 0;
      this.aiOutpostCd = 0;
      this.aiStrikeCd = 20;
      this.pendingOutcome = null;
      this.defeatDelay = 0;

      this.setupDemoBattle();
    }

    mkEcon(supplies) {
      return { supplies, powerProduced: 0, powerConsumed: 0, harvested: 0, built: 0, lost: 0, kills: 0 };
    }

    mkPowers() {
      return {
        reconSweep: { cooldown: 0, maxCooldown: 35, ready: true, unlocked: true, powered: true },
        artilleryBarrage: { cooldown: 0, maxCooldown: 55, ready: false, unlocked: false, powered: true }
      };
    }

    getSupplyUnitKind(faction) {
      return faction === 'red' ? 'red_supply_truck' : 'green_supply_truck';
    }

    clearWorld() {
      this.nextId = 1;
      this.units = []; this.buildings = []; this.supplyNodes = []; this.obstacles = [];
      this.projectiles = []; this.orderMarkers = []; this.wrecks = [];
      this.capturePoints = []; this.activeRadarScans = []; this.activeAirstrikes = [];
      this.repairBeams = [];
      this.placementMode = null; this.attackMoveMode = false; this.activePowerMode = null;
      this.supportPowers = this.mkPowers();
      this.alertText = null; this.alertTimer = 0; this.cameraTrauma = 0;
      this.elapsedTime = 0; this.outcome = null; this.pendingOutcome = null; this.defeatDelay = 0;
      this.aiTimer = 0; this.aiWaveCount = 0; this.aiOutpostCd = 0; this.aiStrikeCd = 20;
      this.effects && this.effects.clear();
      this.fog && this.fog.reset();
    }

    buildTerrainLayout() {
      const rocks = [
        [920, 440, 32, 0], [975, 470, 26, 1], [1025, 435, 24, 2],
        [1480, 1160, 32, 0], [1425, 1130, 26, 1], [1375, 1165, 24, 2],
        [840, 880, 30, 0], [888, 915, 24, 2],
        [1560, 720, 30, 0], [1512, 685, 24, 2],
        [540, 620, 26, 1], [1860, 980, 26, 1],
        [1190, 250, 28, 0], [1210, 1350, 28, 0]
      ];
      for (const [x, y, radius, variant] of rocks) {
        this.obstacles.push({ id: this.nextId++, x, y, radius, variant });
      }

      const addSup = (cx, cy, count, amt) => {
        const offs = [[0, 0], [46, -18], [-44, 20], [34, 38], [-38, -32], [82, 16], [-78, -6]];
        for (let i = 0; i < Math.min(count, offs.length); i++) {
          this.supplyNodes.push({
            id: this.nextId++, x: cx + offs[i][0], y: cy + offs[i][1],
            amount: amt, maxAmount: amt, variant: i % 2, radius: 19
          });
        }
      };
      addSup(250, 960, 6, 850);
      addSup(2150, 640, 6, 850);
      addSup(720, 280, 5, 1000);
      addSup(1680, 1320, 5, 1000);
      addSup(1200, 800, 4, 1200);

      for (const [x, y] of [[760, 560], [1200, 800], [1640, 1040]]) {
        this.capturePoints.push({
          id: this.nextId++, x, y, radius: CAPTURE_POINT_RADIUS,
          owner: null, capturingFaction: null, progress: 0,
          passiveRate: CAPTURE_POINT_SUPPLY_RATE, contested: false
        });
      }
    }

    setupDemoBattle() {
      this.clearWorld();
      this.demoMode = true;
      this.phase = 'title';
      this.playerFaction = 'red';
      this.enemyFaction = 'green';
      this.buildTerrainLayout();
      this.economies = { red: this.mkEcon(800), green: this.mkEcon(800) };

      this.spawnBuilding('red', 'hq', 360, 1240);
      this.spawnBuilding('red', 'generator', 160, 1280);
      this.spawnBuilding('red', 'generator', 160, 1190);
      this.spawnBuilding('red', 'motorpool', 540, 1220);
      this.spawnBuilding('red', 'command', 240, 1140);
      this.spawnBuilding('red', 'heavyGun', 630, 1090);

      this.spawnBuilding('green', 'hq', 2040, 360);
      this.spawnBuilding('green', 'generator', 2240, 320);
      this.spawnBuilding('green', 'generator', 2240, 410);
      this.spawnBuilding('green', 'motorpool', 1860, 380);
      this.spawnBuilding('green', 'command', 2160, 460);
      this.spawnBuilding('green', 'heavyGun', 1770, 510);

      for (const [k, x, y] of [
        ['red_light_tank', 960, 900], ['red_flame_tank', 920, 960], ['red_orb_disruptor', 1010, 850],
        ['red_mortar', 810, 1020], ['red_apc_truck', 890, 860], ['red_buggy', 1050, 930]
      ]) {
        const u = this.spawnUnit('red', k, x, y);
        u.order = 'attackMove'; u.targetX = 1320; u.targetY = 720;
      }

      for (const [k, x, y] of [
        ['green_medium_tank', 1420, 680], ['green_ion_tank', 1460, 630], ['green_laser_tank', 1380, 750],
        ['green_missile_truck', 1570, 590], ['green_radar_truck', 1480, 790], ['green_humvee', 1340, 690]
      ]) {
        const u = this.spawnUnit('green', k, x, y);
        u.order = 'attackMove'; u.targetX = 1080; u.targetY = 880;
      }
      this.recomputePower();
    }

    startNewGame(playerFaction = this.playerFaction, diff = this.difficulty) {
      this.difficulty = diff;
      this.playerFaction = playerFaction === 'green' ? 'green' : 'red';
      this.enemyFaction = this.playerFaction === 'red' ? 'green' : 'red';
      const pf = this.playerFaction;
      const ef = this.enemyFaction;
      const prof = AI_PROFILES[diff];

      this.clearWorld();
      this.demoMode = false;
      this.phase = 'playing';
      this.buildTerrainLayout();

      this.economies = {
        [pf]: this.mkEcon(prof.playerStartSup),
        [ef]: this.mkEcon(prof.enemyStartSup)
      };

      // Player SW Base
      this.spawnBuilding(pf, 'hq', 360, 1240, true);
      this.spawnBuilding(pf, 'generator', 220, 1260, true);
      this.spawnBuilding(pf, 'depot', 240, 1110, true);
      this.spawnBuilding(pf, 'motorpool', 540, 1230, true);
      this.spawnBuilding(pf, 'bunker', 625, 1105, true);

      const pSupply = this.getSupplyUnitKind(pf);
      const pRecon = pf === 'red' ? 'red_buggy' : 'green_humvee';
      const pTank = pf === 'red' ? 'red_light_tank' : 'green_medium_tank';
      this.spawnUnit(pf, pSupply, 280, 1040);
      this.spawnUnit(pf, pRecon, 560, 1120);
      this.spawnUnit(pf, pTank, 520, 1100);
      this.spawnUnit(pf, pTank, 610, 1200);

      // Enemy NE Base
      this.spawnBuilding(ef, 'hq', 2040, 360, true);
      for (let i = 0; i < prof.startGen; i++) {
        this.spawnBuilding(ef, 'generator', 2180, 340 + i * 95, true);
      }
      this.spawnBuilding(ef, 'depot', 2160, 490, true);
      this.spawnBuilding(ef, 'motorpool', 1860, 370, true);
      for (let i = 0; i < prof.startBunkers; i++) {
        this.spawnBuilding(ef, 'bunker', 1775 - i * 40, 495 + i * 75, true);
      }

      const eSupply = this.getSupplyUnitKind(ef);
      const eRecon = ef === 'red' ? 'red_buggy' : 'green_humvee';
      const eTank = ef === 'red' ? 'red_light_tank' : 'green_medium_tank';
      this.spawnUnit(ef, eSupply, 2120, 560);
      for (let i = 0; i < prof.startRecon; i++) this.spawnUnit(ef, eRecon, 1830 + i * 45, 480);
      for (let i = 0; i < prof.startTanks; i++) this.spawnUnit(ef, eTank, 1880 - i * 50, 460);

      this.aiWaveTimer = prof.firstWave;
      this.recomputePower();
      this.fog && this.fog.update(this.units, this.buildings, this.activeRadarScans, pf, UNIT_SPECS, BUILDING_SPECS);
    }

    spawnBuilding(faction, kind, x, y, built = true) {
      const spec = BUILDING_SPECS[kind];
      const isSwBase = x < 1200 && y > 800;
      const b = {
        id: this.nextId++, kind, faction, x, y,
        hp: spec.maxHp, maxHp: spec.maxHp, displayHp: spec.maxHp,
        angle: isSwBase ? -0.7 : 2.4,
        fireCooldown: 0, hitFlash: 0, recoil: 0,
        rallyX: isSwBase ? x + 95 : x - 95,
        rallyY: isSwBase ? y - 75 : y + 75,
        queue: [], selected: false, koTimer: 0,
        buildProgress: built ? 1 : 0.05,
        repairing: false, isRepairing: false, repeatQueue: false, repeatKind: null
      };
      this.buildings.push(b);
      this.recomputePower();
      return b;
    }

    spawnUnit(faction, kind, x, y, materialize = false) {
      const isSw = x < 1200 && y > 800;
      const ang = isSw ? -Math.PI * 0.25 : Math.PI * 0.75;
      const spec = UNIT_SPECS[kind];
      const u = {
        id: this.nextId++, kind, faction, x, y, vx: 0, vy: 0,
        hullAngle: ang, turretAngle: ang, turnVel: 0,
        hp: spec.maxHp, maxHp: spec.maxHp, displayHp: spec.maxHp,
        fireCooldown: 0, burstLeft: 0, burstTimer: 0,
        hitFlash: 0, recoil: 0, selected: false,
        order: 'idle', targetX: x, targetY: y,
        targetEntityId: null, targetSupplyId: null, targetWreckId: null,
        supplyCarried: 0, trackTimer: 0, animPhase: 0,
        slowTimer: 0,
        spawnProg: materialize ? 0.05 : 1,
        isRepairing: false, repairKind: null,
        koTimer: 0, rank: 0, xp: 0, lastCombatTime: -99, controlGroup: null
      };
      this.units.push(u);
      return u;
    }

    hasTech(faction, kind) {
      return this.buildings.some((b) => b.faction === faction && b.kind === kind && b.koTimer <= 0 && b.buildProgress >= 1);
    }

    isLowPower(faction) {
      const e = this.economies[faction];
      return !!(e && e.powerConsumed > e.powerProduced);
    }

    isBuildingPowered(b) {
      if (!b || b.koTimer > 0 || b.buildProgress < 1) return false;
      const spec = BUILDING_SPECS[b.kind];
      if (!spec || spec.powerDelta >= 0 || b.kind === 'depot') return true;
      return !this.isLowPower(b.faction);
    }

    recomputePower() {
      const wasLow = !this.demoMode && this.phase === 'playing' && this.isLowPower(this.playerFaction);
      for (const f of ['red', 'green']) {
        let prod = 0, cons = 0;
        for (const b of this.buildings) {
          if (b.faction !== f || b.koTimer > 0 || b.buildProgress < 1) continue;
          const spec = BUILDING_SPECS[b.kind];
          if (spec.powerDelta >= 0) prod += spec.powerDelta;
          else cons += -spec.powerDelta;
        }
        this.economies[f].powerProduced = prod;
        this.economies[f].powerConsumed = cons;
      }
      const pPowered = !this.isLowPower(this.playerFaction);
      this.supportPowers.artilleryBarrage.unlocked = this.hasTech(this.playerFaction, 'command');
      this.supportPowers.artilleryBarrage.powered = pPowered;
      this.supportPowers.artilleryBarrage.ready = this.supportPowers.artilleryBarrage.unlocked && pPowered && this.supportPowers.artilleryBarrage.cooldown <= 0;
      this.supportPowers.reconSweep.ready = this.supportPowers.reconSweep.cooldown <= 0;
      if (!this.demoMode && this.phase === 'playing' && !wasLow && !pPowered) {
        this.showAlert('НЕТ ЭНЕРГИИ: заводы и турели отключены!');
      }
    }

    getPowerFactor(faction) {
      return this.isLowPower(faction) ? 0.0 : 1.0;
    }

    showAlert(msg) {
      this.alertText = msg;
      this.alertTimer = 2.6;
    }

    canPlaceBuilding(faction, kind, x, y) {
      const spec = BUILDING_SPECS[kind];
      if (!spec || !spec.buildable) return { ok: false, reason: 'Нельзя строить' };
      if (spec.requiresTech && !this.hasTech(faction, spec.requiresTech)) return { ok: false, reason: 'Нужен Штаб-связь' };
      if (this.economies[faction].supplies < spec.cost) return { ok: false, reason: 'Недостаточно припасов' };

      const margin = spec.radius + 16;
      if (x < margin || x > WORLD_WIDTH - margin || y < margin || y > WORLD_HEIGHT - margin) {
        return { ok: false, reason: 'За границей сектора' };
      }
      let nearBase = false;
      for (const b of this.buildings) {
        if (b.faction !== faction || b.koTimer > 0) continue;
        const br = BUILDING_SPECS[b.kind].radius;
        const d = Math.hypot(b.x - x, b.y - y);
        if (d < br + spec.radius + 26) return { ok: false, reason: 'Занято постройкой' };
        if (d <= 380) nearBase = true;
      }
      if (!nearBase) return { ok: false, reason: 'Слишком далеко от базы' };

      for (const r of this.obstacles) {
        if (Math.hypot(r.x - x, r.y - y) < r.radius + spec.radius + 12) return { ok: false, reason: 'Скалы мешают' };
      }
      for (const s of this.supplyNodes) {
        if (Math.hypot(s.x - x, s.y - y) < s.radius + spec.radius + 10) return { ok: false, reason: 'Склад припасов' };
      }
      for (const cp of this.capturePoints) {
        if (Math.hypot(cp.x - x, cp.y - y) < cp.radius + spec.radius + 10) return { ok: false, reason: 'Зона вышки' };
      }
      return { ok: true };
    }

    placeBuilding(faction, kind, x, y) {
      const check = this.canPlaceBuilding(faction, kind, x, y);
      if (!check.ok) {
        if (faction === this.playerFaction && check.reason) this.showAlert(check.reason);
        return null;
      }
      const spec = BUILDING_SPECS[kind];
      this.economies[faction].supplies -= spec.cost;
      const b = this.spawnBuilding(faction, kind, x, y, false);
      if (faction === this.playerFaction) {
        this.placementMode = null;
        this.sound && this.sound.playBuild();
      }
      if (kind === 'depot') {
        const isSw = x < 1200 && y > 800;
        const hx = clamp(x + (isSw ? 68 : -68), 60, WORLD_WIDTH - 60);
        const hy = clamp(y + (isSw ? -68 : 68), 60, WORLD_HEIGHT - 60);
        const h = this.spawnUnit(faction, this.getSupplyUnitKind(faction), hx, hy);
        h.order = 'harvest';
      }
      return b;
    }

    queueUnit(faction, kind) {
      const spec = UNIT_SPECS[kind];
      if (!spec || spec.faction !== faction) return false;
      if (spec.requiresTech && !this.hasTech(faction, spec.requiresTech)) {
        if (faction === this.playerFaction) this.showAlert('Требуется Штаб-связь');
        return false;
      }
      const producers = this.buildings.filter(
        (b) => b.faction === faction && b.kind === spec.requiresBuilding && b.koTimer <= 0 && b.buildProgress >= 1
      );
      if (producers.length === 0) {
        if (faction === this.playerFaction) this.showAlert(spec.requiresBuilding === 'hq' ? 'Нужен Штаб-Бункер' : 'Постройте Ангар');
        return false;
      }
      if (this.economies[faction].supplies < spec.cost) {
        if (faction === this.playerFaction) this.showAlert('Недостаточно припасов');
        return false;
      }

      producers.sort((a, b) => a.queue.length - b.queue.length);
      const chosen = producers[0];
      if (chosen.queue.length >= 6) return false;

      this.economies[faction].supplies -= spec.cost;
      chosen.queue.push({ kind, total: spec.buildTime, remaining: spec.buildTime });
      if (faction === this.playerFaction) {
        if (!this.isBuildingPowered(chosen)) this.showAlert('Ангар обесточен: выпуск на паузе — постройте Дизель-ген.');
        this.sound && this.sound.playClick();
      }
      return true;
    }

    selectInBox(x0, y0, x1, y1, additive = false, clickTol = 12) {
      const pf = this.playerFaction;
      const minX = Math.min(x0, x1) - clickTol;
      const maxX = Math.max(x0, x1) + clickTol;
      const minY = Math.min(y0, y1) - clickTol;
      const maxY = Math.max(y0, y1) + clickTol;
      const isClick = Math.hypot(x1 - x0, y1 - y0) < 12;

      if (!additive) {
        for (const u of this.units) u.selected = false;
        for (const b of this.buildings) b.selected = false;
      }

      let foundUnit = false;
      for (const u of this.units) {
        if (u.faction !== pf || u.koTimer > 0) continue;
        const r = isClick ? UNIT_SPECS[u.kind].radius : 4;
        if (u.x >= minX - r && u.x <= maxX + r && u.y >= minY - r && u.y <= maxY + r) {
          u.selected = true;
          foundUnit = true;
          if (isClick) break;
        }
      }

      if (!foundUnit && isClick) {
        for (const b of this.buildings) {
          if (b.faction !== pf || b.koTimer > 0) continue;
          const br = BUILDING_SPECS[b.kind].radius;
          if (Math.hypot(b.x - x0, b.y - y0) <= br + 10) {
            b.selected = true;
            break;
          }
        }
      }
      this.sound && this.sound.playClick();
    }

    selectUnitsOfType(kind) {
      const pf = this.playerFaction;
      for (const b of this.buildings) b.selected = false;
      for (const u of this.units) {
        u.selected = (u.faction === pf && u.koTimer <= 0 && u.kind === kind);
      }
      this.sound && this.sound.playClick();
    }

    selectAllCombat() {
      const pf = this.playerFaction;
      for (const b of this.buildings) b.selected = false;
      let n = 0;
      for (const u of this.units) {
        if (u.faction === pf && u.koTimer <= 0 && !UNIT_SPECS[u.kind].isHarvester) {
          u.selected = true; n++;
        } else u.selected = false;
      }
      return n;
    }

    saveControlGroup(slot) {
      const pf = this.playerFaction;
      let count = 0;
      const anySelected = this.units.some((u) => u.faction === pf && u.selected && u.koTimer <= 0);
      if (!anySelected) return 0;
      for (const u of this.units) {
        if (u.controlGroup === slot) u.controlGroup = null;
        if (u.faction === pf && u.selected && u.koTimer <= 0) {
          u.controlGroup = slot; count++;
        }
      }
      return count;
    }

    selectControlGroup(slot) {
      const pf = this.playerFaction;
      for (const b of this.buildings) b.selected = false;
      let count = 0;
      for (const u of this.units) {
        const hit = u.faction === pf && u.koTimer <= 0 && u.controlGroup === slot;
        u.selected = hit;
        if (hit) count++;
      }
      return count;
    }

    getControlGroupCentroid(slot) {
      const pf = this.playerFaction;
      let sx = 0, sy = 0, n = 0;
      for (const u of this.units) {
        if (u.faction === pf && u.koTimer <= 0 && u.controlGroup === slot) {
          sx += u.x; sy += u.y; n++;
        }
      }
      return n > 0 ? { x: sx / n, y: sy / n } : null;
    }

    holdSelectedUnits() {
      const pf = this.playerFaction;
      for (const u of this.units) {
        if (u.faction === pf && u.selected && u.koTimer <= 0) {
          u.order = 'hold';
          u.vx = 0; u.vy = 0;
          u.targetEntityId = null;
        }
      }
      this.attackMoveMode = false;
    }

    toggleRepairBuilding() {
      const pf = this.playerFaction;
      for (const b of this.buildings) {
        if (b.faction === pf && b.selected && b.koTimer <= 0 && b.hp < b.maxHp) {
          b.repairing = !b.repairing;
        }
      }
    }

    toggleRepeatBuilding() {
      const pf = this.playerFaction;
      for (const b of this.buildings) {
        if (b.faction === pf && b.selected && BUILDING_SPECS[b.kind].produces.length > 0) {
          b.repeatQueue = !b.repeatQueue;
          if (b.queue[0]) b.repeatKind = b.queue[0].kind;
        }
      }
    }

    sellSelectedBuilding() {
      const pf = this.playerFaction;
      const idx = this.buildings.findIndex((b) => b.faction === pf && b.selected && b.koTimer <= 0 && BUILDING_SPECS[b.kind].canSell);
      if (idx === -1) return false;
      const b = this.buildings[idx];
      const refund = Math.round(BUILDING_SPECS[b.kind].cost * 0.5);
      this.economies[pf].supplies += refund;
      this.effects && this.effects.spawnText(b.x, b.y - 20, `+${refund}`, '#FBBF24');
      this.buildings.splice(idx, 1);
      this.recomputePower();
      this.sound && this.sound.playSupply();
      return true;
    }

    issueCommand(wx, wy, attackMove = false) {
      const pf = this.playerFaction;
      const ef = this.enemyFaction;
      const selB = this.buildings.find((b) => b.faction === pf && b.selected && BUILDING_SPECS[b.kind].produces.length > 0);
      const selUnits = this.units.filter((u) => u.faction === pf && u.selected && u.koTimer <= 0);

      if (selUnits.length === 0 && selB) {
        selB.rallyX = clamp(wx, 40, WORLD_WIDTH - 40);
        selB.rallyY = clamp(wy, 40, WORLD_HEIGHT - 40);
        this.orderMarkers.push({ x: selB.rallyX, y: selB.rallyY, kind: 'move', life: 0.7, maxLife: 0.7 });
        this.sound && this.sound.playClick();
        return;
      }
      if (selUnits.length === 0) return;

      let targetEnemy = null;
      for (const u of this.units) {
        if (u.faction === ef && u.koTimer <= 0 && Math.hypot(u.x - wx, u.y - wy) <= UNIT_SPECS[u.kind].radius + 14) {
          targetEnemy = u; break;
        }
      }
      if (!targetEnemy) {
        for (const b of this.buildings) {
          if (b.faction === ef && b.koTimer <= 0 && Math.hypot(b.x - wx, b.y - wy) <= BUILDING_SPECS[b.kind].radius + 12) {
            targetEnemy = b; break;
          }
        }
      }

      let targetSupply = null;
      for (const o of this.supplyNodes) {
        if (o.amount > 0 && Math.hypot(o.x - wx, o.y - wy) <= 32) { targetSupply = o; break; }
      }
      let targetWreck = null;
      for (const w of this.wrecks) {
        if (w.supplyValue > 0 && Math.hypot(w.x - wx, w.y - wy) <= 28) { targetWreck = w; break; }
      }

      const n = selUnits.length;
      const cols = Math.ceil(Math.sqrt(n));
      const spacing = 42;
      selUnits.forEach((u, idx) => {
        const spec = UNIT_SPECS[u.kind];
        if (spec.isHarvester && (targetSupply || targetWreck)) {
          u.order = 'harvest';
          u.targetSupplyId = targetSupply ? targetSupply.id : null;
          u.targetWreckId = targetWreck ? targetWreck.id : null;
          return;
        }
        if (targetEnemy && !spec.isHarvester) {
          u.order = 'attackTarget';
          u.targetEntityId = targetEnemy.id;
          return;
        }
        const row = Math.floor(idx / cols) - Math.floor((n - 1) / cols) * 0.5;
        const col = (idx % cols) - (cols - 1) * 0.5;
        u.order = attackMove ? 'attackMove' : 'move';
        u.targetEntityId = null;
        u.targetX = clamp(wx + col * spacing, 40, WORLD_WIDTH - 40);
        u.targetY = clamp(wy + row * spacing, 40, WORLD_HEIGHT - 40);
      });

      this.orderMarkers.push({
        x: targetEnemy ? targetEnemy.x : wx,
        y: targetEnemy ? targetEnemy.y : wy,
        kind: (targetEnemy || attackMove) ? 'attack' : (targetSupply || targetWreck) ? 'harvest' : 'move',
        life: 0.65, maxLife: 0.65
      });
      this.attackMoveMode = false;
      this.sound && this.sound.playClick();
    }

    triggerSupportPower(kind, wx, wy) {
      const st = this.supportPowers[kind];
      const spec = SUPPORT_POWER_SPECS[kind];
      if (!st) return false;
      if (kind === 'artilleryBarrage' && st.unlocked && !st.powered) {
        this.showAlert('Штаб-связь обесточен: постройте Дизель-ген.');
        this.activePowerMode = null;
        return false;
      }
      if (!st.ready) return false;
      const x = clamp(wx, 80, WORLD_WIDTH - 80);
      const y = clamp(wy, 80, WORLD_HEIGHT - 80);
      st.cooldown = st.maxCooldown;
      st.ready = false;
      this.activePowerMode = null;

      if (kind === 'reconSweep') {
        this.activeRadarScans.push({ id: this.nextId++, x, y, radius: spec.radius, remaining: spec.duration, duration: spec.duration });
        this.sound && this.sound.playSupply();
      } else if (kind === 'artilleryBarrage') {
        this.activeAirstrikes.push({
          id: this.nextId++, faction: this.playerFaction, x, y,
          radius: spec.radius, delay: spec.duration, totalDelay: spec.duration, damage: spec.damage
        });
        this.sound && this.sound.playRocket(0.14);
      }
      return true;
    }

    step(rawDt) {
      const dt = Math.min(0.05, Math.max(0, rawDt));
      if (this.phase === 'paused' || this.phase === 'gameover') return;
      this.elapsedTime += dt;
      if (this.alertTimer > 0) {
        this.alertTimer -= dt;
        if (this.alertTimer <= 0) this.alertText = null;
      }
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.4);
      this.repairBeams.length = 0;
      for (const b of this.buildings) b.isRepairing = false;
      for (const u of this.units) { u.isRepairing = false; u.repairKind = null; }

      this.updateCapturePoints(dt);
      this.updateSupportPowers(dt);
      this.updateBuildings(dt);
      this.updateUnits(dt);
      this.resolveCollisions(dt);
      this.updateProjectiles(dt);
      this.cleanupDestroyed(dt);
      this.effects && this.effects.update(dt);

      for (let i = this.orderMarkers.length - 1; i >= 0; i--) {
        this.orderMarkers[i].life -= dt;
        if (this.orderMarkers[i].life <= 0) this.orderMarkers.splice(i, 1);
      }

      if (this.demoMode) {
        this.updateDemoRespawns();
      } else {
        const prof = AI_PROFILES[this.difficulty];
        this.economies[this.enemyFaction].supplies += prof.passiveSup * dt;
        this.updateEnemyAi(dt);
        this.checkWinLoss(dt);
        this.fog && this.fog.update(this.units, this.buildings, this.activeRadarScans, this.playerFaction, UNIT_SPECS, BUILDING_SPECS);
      }
    }

    updateCapturePoints(dt) {
      for (const cp of this.capturePoints) {
        let rCount = 0, gCount = 0;
        for (const u of this.units) {
          if (u.koTimer > 0 || UNIT_SPECS[u.kind].isHarvester) continue;
          if (distSq(u.x, u.y, cp.x, cp.y) <= cp.radius * cp.radius) {
            if (u.faction === 'red') rCount++; else gCount++;
          }
        }
        cp.contested = rCount > 0 && gCount > 0;
        if (!cp.contested && (rCount > 0 || gCount > 0)) {
          const cap = rCount > 0 ? 'red' : 'green';
          const rate = CAPTURE_RATE_PER_SEC * Math.min(3, rCount + gCount) * dt;
          if (cp.owner === cap) {
            cp.progress = Math.min(1, cp.progress + rate);
          } else if (cp.owner === null) {
            if (cp.capturingFaction && cp.capturingFaction !== cap) {
              cp.progress -= rate;
              if (cp.progress <= 0) { cp.progress = 0; cp.capturingFaction = cap; }
            } else {
              cp.capturingFaction = cap;
              cp.progress += rate;
              if (cp.progress >= 1) {
                cp.progress = 1; cp.owner = cap; cp.capturingFaction = null;
                if (cap === this.playerFaction && !this.demoMode) {
                  this.showAlert('Нефтевышка захвачена (+10/с)');
                  this.sound && this.sound.playSupply();
                }
              }
            }
          } else {
            cp.progress -= rate;
            if (cp.progress <= 0) { cp.progress = 0; cp.owner = null; cp.capturingFaction = cap; }
          }
        }
        if (cp.owner && cp.progress >= 1) {
          this.economies[cp.owner].supplies += cp.passiveRate * dt;
        }
      }
    }

    updateSupportPowers(dt) {
      const pPowered = !this.isLowPower(this.playerFaction);
      for (const k of ['reconSweep', 'artilleryBarrage']) {
        const st = this.supportPowers[k];
        if (k === 'artilleryBarrage') st.powered = pPowered;
        if (st.cooldown > 0 && (k !== 'artilleryBarrage' || pPowered)) {
          st.cooldown = Math.max(0, st.cooldown - dt);
        }
        st.ready = (st.unlocked !== false) && (st.powered !== false) && st.cooldown <= 0;
      }
      for (let i = this.activeRadarScans.length - 1; i >= 0; i--) {
        this.activeRadarScans[i].remaining -= dt;
        if (this.activeRadarScans[i].remaining <= 0) this.activeRadarScans.splice(i, 1);
      }
      for (let i = this.activeAirstrikes.length - 1; i >= 0; i--) {
        const s = this.activeAirstrikes[i];
        s.delay -= dt;
        if (s.delay <= 0) {
          this.detonateBarrage(s);
          this.activeAirstrikes.splice(i, 1);
        }
      }
    }

    detonateBarrage(s) {
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.55);
      this.sound && this.sound.playExplosion(true);
      for (let i = 0; i < 5; i++) {
        const ox = (Math.random() - 0.5) * s.radius * 0.9;
        const oy = (Math.random() - 0.5) * s.radius * 0.9;
        this.effects && this.effects.spawnExplosion(s.x + ox, s.y + oy, true);
      }
      const enemy = s.faction === 'red' ? 'green' : 'red';
      const r2 = s.radius * s.radius;
      for (const u of this.units) {
        if (u.faction === enemy && u.koTimer <= 0 && distSq(u.x, u.y, s.x, s.y) <= r2) {
          this.applyDamage(u, s.damage, s.faction, null);
        }
      }
      for (const b of this.buildings) {
        if (b.faction === enemy && b.koTimer <= 0 && distSq(b.x, b.y, s.x, s.y) <= (s.radius + BUILDING_SPECS[b.kind].radius) ** 2) {
          this.applyDamage(b, s.damage * 0.85, s.faction, null);
        }
      }
    }

    updateBuildings(dt) {
      for (const b of this.buildings) {
        if (b.koTimer > 0) continue;
        const spec = BUILDING_SPECS[b.kind];
        b.hitFlash = Math.max(0, b.hitFlash - dt * 5);
        b.recoil = Math.max(0, b.recoil - dt * 6);
        b.displayHp += (b.hp - b.displayHp) * Math.min(1, dt * 8);

        if (b.buildProgress < 1) {
          const buildRate = spec.buildTime > 0 ? 1 / spec.buildTime : 1;
          b.buildProgress = Math.min(1, b.buildProgress + buildRate * dt);
          if (Math.random() < 0.25 && this.effects) {
            this.effects.spawnParticle(
              b.x + (Math.random() - 0.5) * spec.radius,
              b.y + (Math.random() - 0.5) * spec.radius,
              b.buildProgress * 36, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 35,
              2.5, '#FACC15', 0.28, 120
            );
          }
          if (b.buildProgress >= 1) {
            this.recomputePower();
            if (b.faction === this.playerFaction && !this.demoMode && spec.powerDelta > 0) {
              this.effects && this.effects.spawnText(b.x, b.y - 28, `+${spec.powerDelta} ⚡`, '#86EFAC');
              this.sound && this.sound.playSupply();
            }
          }
          continue;
        }

        if (b.repairing && b.hp < b.maxHp) {
          const heal = Math.min(b.maxHp - b.hp, 36 * dt);
          const cost = heal * 0.24;
          if (this.economies[b.faction].supplies >= cost) {
            this.economies[b.faction].supplies -= cost;
            b.hp += heal;
            b.isRepairing = true;
          } else {
            b.repairing = false;
          }
        } else if (b.hp >= b.maxHp) {
          b.repairing = false;
        }

        const powered = this.isBuildingPowered(b);
        if (b.kind === 'command' && powered) b.angle = normAngle(b.angle + dt * 1.45);

        if (b.queue.length > 0 && powered) {
          const speedMult = b.faction === this.enemyFaction && !this.demoMode ? AI_PROFILES[this.difficulty].prodMult : 1;
          const item = b.queue[0];
          item.remaining -= dt * speedMult;
          if (item.remaining <= 0) {
            b.queue.shift();
            const isSw = b.x < 1200 && b.y > 800;
            const sx = b.x + (isSw ? 46 : -46);
            const sy = b.y + (isSw ? -46 : 46);
            const u = this.spawnUnit(b.faction, item.kind, sx, sy, true);
            this.economies[b.faction].built++;
            if (UNIT_SPECS[u.kind].isHarvester) {
              u.order = 'harvest';
            } else {
              u.order = 'attackMove';
              u.targetX = b.rallyX + (Math.random() - 0.5) * 32;
              u.targetY = b.rallyY + (Math.random() - 0.5) * 32;
            }
            if (b.repeatQueue && b.repeatKind) {
              this.queueUnit(b.faction, b.repeatKind);
            }
          }
        }

        if (b.kind === 'workshop' && powered) {
          const r2 = spec.repairRadius * spec.repairRadius;
          for (const u of this.units) {
            if (u.faction === b.faction && u.koTimer <= 0 && u.hp < u.maxHp && distSq(u.x, u.y, b.x, b.y) <= r2) {
              u.hp = Math.min(u.maxHp, u.hp + spec.repairRate * dt);
              u.isRepairing = true;
              u.repairKind = 'field';
              this.repairBeams.push({ x1: b.x, y1: b.y - 24, x2: u.x, y2: u.y - 10, color: '#FACC15' });
              break;
            }
          }
        }

        if (spec.damage > 0 && powered) {
          b.fireCooldown = Math.max(0, b.fireCooldown - dt);
          const enemy = b.faction === 'red' ? 'green' : 'red';
          const target = this.findNearestEnemy(b.x, b.y, spec.range, enemy);
          if (target) {
            const aim = Math.atan2(target.y - b.y, target.x - b.x);
            b.angle = stepAngle(b.angle, aim, 6.2 * dt);
            if (b.fireCooldown <= 0 && Math.abs(normAngle(aim - b.angle)) < 0.35) {
              b.fireCooldown = spec.cooldown;
              b.recoil = 1;
              if (b.kind === 'heavyGun' && b.faction === 'green') {
                this.effects && this.effects.spawnBeam(b.x, b.y, 24, target.x, target.y, 12, '#38BDF8', false, 0.20);
                this.applyDamage(target, spec.damage, b.faction, null);
                this.sound && this.sound.playIon();
              } else if (b.kind === 'heavyGun' && b.faction === 'red') {
                this.fireProjectile(b.faction, 'shell', b.x + Math.cos(b.angle) * 26, b.y + Math.sin(b.angle) * 26, 20, target, spec.damage, 32, spec.projSpeed, null, false);
                this.sound && this.sound.playCannon();
              } else {
                this.fireProjectile(b.faction, 'shell', b.x + Math.cos(b.angle) * 24, b.y + Math.sin(b.angle) * 24, 16, target, spec.damage, 0, spec.projSpeed, null, false);
                this.sound && this.sound.playCannon(0.10);
              }
            }
          }
        }
      }
    }

    updateUnits(dt) {
      for (const u of this.units) {
        if (u.koTimer > 0) continue;
        const spec = UNIT_SPECS[u.kind];
        const vet = VETERANCY_SPECS[u.rank];

        u.hitFlash = Math.max(0, u.hitFlash - dt * 5);
        u.recoil = Math.max(0, u.recoil - dt * 5.2);
        if (u.spawnProg < 1) u.spawnProg = Math.min(1, u.spawnProg + dt * 1.7);
        u.displayHp += (u.hp - u.displayHp) * Math.min(1, dt * 8);
        const slowRof = u.slowTimer > 0 ? 0.72 : 1.0;
        u.fireCooldown = Math.max(0, u.fireCooldown - dt * vet.rof * slowRof);
        u.turnVel *= Math.exp(-8 * dt);

        if (u.slowTimer > 0) {
          u.slowTimer = Math.max(0, u.slowTimer - dt);
          if (Math.random() < 0.14 && this.effects) {
            this.effects.spawnParticle(u.x + (Math.random() - 0.5) * 14, u.y + (Math.random() - 0.5) * 14, 14, 0, 0, 22, 2.5, '#38BDF8', 0.22, 0);
          }
        }

        if (vet.regen > 0 && this.elapsedTime - u.lastCombatTime >= 5.0 && u.hp < u.maxHp) {
          u.hp = Math.min(u.maxHp, u.hp + vet.regen * dt);
          u.isRepairing = true;
          u.repairKind = u.repairKind || 'auto';
        }

        if (spec.repairAuraRadius > 0) {
          const r2 = spec.repairAuraRadius * spec.repairAuraRadius;
          for (const ally of this.units) {
            if (ally.id !== u.id && ally.faction === u.faction && ally.koTimer <= 0 && ally.hp < ally.maxHp && distSq(u.x, u.y, ally.x, ally.y) <= r2) {
              ally.hp = Math.min(ally.maxHp, ally.hp + spec.repairAuraRate * dt);
              ally.isRepairing = true;
              ally.repairKind = 'field';
              this.repairBeams.push({ x1: u.x, y1: u.y - 16, x2: ally.x, y2: ally.y - 10, color: '#34D399' });
              break;
            }
          }
        }

        if (spec.isHarvester) this.updateSupplyTruck(u, dt);
        else this.updateCombatUnit(u, dt);

        const spd = Math.hypot(u.vx, u.vy);
        if (spd > 12) {
          u.animPhase += dt * 4.5;
          u.trackTimer -= dt;
          if (u.trackTimer <= 0) {
            u.trackTimer = 0.28;
            this.effects && this.effects.addDecal(u.x, u.y, 5, 'track', 6);
          }
        }
      }
    }

    updateSupplyTruck(u, dt) {
      const spec = UNIT_SPECS[u.kind];
      if (u.order === 'idle') u.order = 'harvest';

      if (u.order === 'move') {
        if (this.steerToward(u, u.targetX, u.targetY, dt, 18)) u.order = 'harvest';
        return;
      }

      if (u.order === 'returnSupply' || u.supplyCarried >= spec.supplyCapacity) {
        u.order = 'returnSupply';
        const drop = this.findNearestDropoff(u.x, u.y, u.faction);
        if (!drop) return;
        const dropDist = BUILDING_SPECS[drop.kind].radius + spec.radius + 14;
        if (this.steerToward(u, drop.x, drop.y, dt, dropDist)) {
          const gain = Math.round(u.supplyCarried);
          if (gain > 0) {
            this.economies[u.faction].supplies += gain;
            this.economies[u.faction].harvested += gain;
            if (u.faction === this.playerFaction && !this.demoMode) {
              this.effects && this.effects.spawnText(drop.x, drop.y - 30, `+${gain}`, '#FACC15');
              this.sound && this.sound.playSupply();
            }
            u.supplyCarried = 0;
          }
          u.order = 'harvest';
        }
        return;
      }

      let wreck = u.targetWreckId ? this.wrecks.find((w) => w.id === u.targetWreckId && w.supplyValue > 0) : null;
      if (!wreck) wreck = this.findNearestWreck(u.x, u.y, 260);
      if (wreck) {
        u.targetWreckId = wreck.id;
        if (this.steerToward(u, wreck.x, wreck.y, dt, 30)) {
          u.animPhase += dt * 7;
          const take = Math.min(wreck.supplyValue, spec.supplyCapacity - u.supplyCarried, spec.harvestRate * 1.4 * dt);
          wreck.supplyValue -= take;
          u.supplyCarried += take;
          if (wreck.supplyValue <= 0.5) wreck.supplyValue = 0;
          if (u.supplyCarried >= spec.supplyCapacity - 0.5) { u.supplyCarried = spec.supplyCapacity; u.order = 'returnSupply'; }
        }
        return;
      }

      let node = u.targetSupplyId ? this.supplyNodes.find((o) => o.id === u.targetSupplyId && o.amount > 0) : null;
      if (!node) node = this.findNearestSupply(u.x, u.y);
      if (!node) {
        if (u.supplyCarried > 0) u.order = 'returnSupply';
        return;
      }
      u.targetSupplyId = node.id;
      if (this.steerToward(u, node.x, node.y, dt, 30)) {
        u.animPhase += dt * 7;
        const take = Math.min(node.amount, spec.supplyCapacity - u.supplyCarried, spec.harvestRate * dt);
        node.amount -= take;
        u.supplyCarried += take;
        if (Math.random() < 0.2 && this.effects) {
          this.effects.spawnParticle(node.x, node.y, 8, (Math.random() - 0.5) * 35, (Math.random() - 0.5) * 35, 35, 2.5, '#FACC15', 0.3, 120);
        }
        if (node.amount <= 0.5) node.amount = 0;
        if (u.supplyCarried >= spec.supplyCapacity - 0.5) { u.supplyCarried = spec.supplyCapacity; u.order = 'returnSupply'; }
      }
    }

    updateCombatUnit(u, dt) {
      const spec = UNIT_SPECS[u.kind];
      const vet = VETERANCY_SPECS[u.rank];
      const enemyFaction = u.faction === 'red' ? 'green' : 'red';

      if (u.burstLeft > 0) {
        u.burstTimer -= dt;
        if (u.burstTimer <= 0) {
          const tgt = u.targetEntityId ? this.getEntityById(u.targetEntityId) : this.findNearestEnemy(u.x, u.y, spec.range + 40, enemyFaction);
          if (tgt && tgt.koTimer <= 0) {
            this.launchUnitWeapon(u, spec, vet, tgt);
            u.burstLeft--;
            u.burstTimer = 0.14;
          } else {
            u.burstLeft = 0;
          }
        }
      }

      if (u.order === 'move') {
        if (this.steerToward(u, u.targetX, u.targetY, dt, 16)) u.order = 'idle';
        u.turretAngle = stepAngle(u.turretAngle, u.hullAngle, (spec.turretTurn || spec.turnSpeed) * dt);
        return;
      }

      let target = null;
      if (u.order === 'attackTarget' && u.targetEntityId) {
        target = this.getEntityById(u.targetEntityId);
        if (!target || target.koTimer > 0) {
          u.targetEntityId = null;
          u.order = 'idle';
          target = null;
        }
      }

      if (!target) {
        const scanRange = u.order === 'hold' ? spec.range : spec.range + 135;
        target = this.findNearestEnemy(u.x, u.y, scanRange, enemyFaction);
      }

      if (target) {
        const d = Math.hypot(target.x - u.x, target.y - u.y);
        const tgtRadius = target.kind && BUILDING_SPECS[target.kind] ? BUILDING_SPECS[target.kind].radius : UNIT_SPECS[target.kind].radius;
        const effectiveDist = d - tgtRadius;
        const aimAngle = Math.atan2(target.y - u.y, target.x - u.x);

        if (spec.turretTurn > 0) {
          u.turretAngle = stepAngle(u.turretAngle, aimAngle, spec.turretTurn * dt);
        } else {
          u.hullAngle = stepAngle(u.hullAngle, aimAngle, spec.turnSpeed * dt);
          u.turretAngle = u.hullAngle;
        }

        if (effectiveDist > spec.range * 0.94 && u.order !== 'hold') {
          this.steerToward(u, target.x, target.y, dt, spec.range * 0.78);
        } else {
          u.vx = 0; u.vy = 0;
        }

        if (effectiveDist <= spec.range + 10 && u.fireCooldown <= 0 && u.burstLeft <= 0) {
          const angleDiff = Math.abs(normAngle(aimAngle - u.turretAngle));
          if (angleDiff < 0.36) {
            u.fireCooldown = spec.cooldown;
            u.targetEntityId = target.id;
            this.launchUnitWeapon(u, spec, vet, target);
            if (spec.burst > 1) {
              u.burstLeft = spec.burst - 1;
              u.burstTimer = 0.14;
            }
          }
        }
      } else {
        if (u.order === 'attackMove') {
          if (this.steerToward(u, u.targetX, u.targetY, dt, 20)) u.order = 'idle';
        } else {
          u.vx = 0; u.vy = 0;
        }
        if (spec.turretTurn > 0) u.turretAngle = stepAngle(u.turretAngle, u.hullAngle, spec.turretTurn * 0.6 * dt);
      }
    }

    applySplashDamage(cx, cy, radius, baseDmg, attackerFaction, attackerUnitId, targetEntityId, slowDur = 0, vsBuildingMult = 1.0) {
      const enemy = attackerFaction === 'red' ? 'green' : 'red';
      for (const u of this.units) {
        if (u.faction === enemy && u.koTimer <= 0 && distSq(u.x, u.y, cx, cy) <= (radius + UNIT_SPECS[u.kind].radius) ** 2) {
          const falloff = u.id === targetEntityId ? 1.0 : 0.6;
          this.applyDamage(u, baseDmg * falloff, attackerFaction, attackerUnitId);
          if (slowDur > 0 && u.koTimer <= 0) u.slowTimer = Math.max(u.slowTimer, slowDur);
        }
      }
      for (const b of this.buildings) {
        if (b.faction === enemy && b.koTimer <= 0 && distSq(b.x, b.y, cx, cy) <= (radius + BUILDING_SPECS[b.kind].radius) ** 2) {
          this.applyDamage(b, baseDmg * 0.85 * vsBuildingMult, attackerFaction, attackerUnitId);
        }
      }
    }

    launchUnitWeapon(u, spec, vet, target) {
      u.recoil = 1;
      const dmg = spec.damage * vet.dmgDeal;
      const mzX = u.x + Math.cos(u.turretAngle) * (spec.radius + 8);
      const mzY = u.y + Math.sin(u.turretAngle) * (spec.radius + 8);
      const mzZ = 16;

      if (spec.projKind === 'flame') {
        this.effects && this.effects.spawnFlameJet(mzX, mzY, mzZ, target.x, target.y, 12);
        this.applySplashDamage(target.x, target.y, spec.splash, dmg, u.faction, u.id, target.id, 0, spec.vsBuildingMult || 1.0);
        this.sound && this.sound.playFlame();
        return;
      }
      if (spec.projKind === 'orb') {
        this.effects && this.effects.spawnBeam(u.x, u.y, 24, target.x, target.y, 12, '#EF4444', false, 0.24);
        this.effects && this.effects.spawnRing(target.x, target.y, spec.splash, '#EF4444', 0.36);
        this.applySplashDamage(target.x, target.y, spec.splash, dmg, u.faction, u.id, target.id, spec.slowDur || 0, 1.0);
        this.sound && this.sound.playEmp();
        return;
      }
      if (spec.projKind === 'emp') {
        this.effects && this.effects.spawnBeam(u.x, u.y, 34, target.x, target.y, 12, '#38BDF8', true, 0.24);
        this.effects && this.effects.spawnRing(target.x, target.y, spec.splash, '#38BDF8', 0.34);
        this.applySplashDamage(target.x, target.y, spec.splash, dmg, u.faction, u.id, target.id, spec.slowDur || 0, 1.0);
        this.sound && this.sound.playEmp();
        return;
      }
      if (spec.projKind === 'laser') {
        this.effects && this.effects.spawnBeam(mzX, mzY, 18, target.x, target.y, 12, '#FB7185', false, 0.18);
        this.effects && this.effects.spawnParticle(target.x, target.y, 12, 0, 0, 26, 4.5, '#FDA4AF', 0.18, 0);
        this.applyDamage(target, dmg, u.faction, u.id);
        this.sound && this.sound.playLaser();
        return;
      }
      if (spec.projKind === 'ion') {
        this.effects && this.effects.spawnBeam(mzX, mzY, 18, target.x, target.y, 12, '#38BDF8', false, 0.22);
        this.effects && this.effects.spawnRing(target.x, target.y, spec.splash, '#60A5FA', 0.26);
        this.applySplashDamage(target.x, target.y, spec.splash, dmg, u.faction, u.id, target.id, 0, 1.0);
        this.sound && this.sound.playIon();
        return;
      }

      this.effects && this.effects.spawnMuzzleFlash(mzX, mzY, mzZ, u.turretAngle);
      this.fireProjectile(u.faction, spec.projKind, mzX, mzY, mzZ, target, dmg, spec.splash, spec.projSpeed, u.id, u.rank >= 2);
      if (spec.projKind === 'bullet') this.sound && this.sound.playBullet();
      else if (spec.projKind === 'missile') this.sound && this.sound.playRocket();
      else if (spec.projKind === 'mortar') this.sound && this.sound.playMortar();
      else this.sound && this.sound.playCannon();
    }

    steerToward(u, tx, ty, dt, arriveDist) {
      const spec = UNIT_SPECS[u.kind];
      const dx = tx - u.x, dy = ty - u.y;
      const d = Math.hypot(dx, dy);
      if (d <= arriveDist) { u.vx = 0; u.vy = 0; return true; }

      let dirX = dx / d, dirY = dy / d;
      for (const r of this.obstacles) {
        const ox = u.x - r.x, oy = u.y - r.y;
        const od = Math.hypot(ox, oy);
        const avoid = r.radius + spec.radius + 26;
        if (od > 0.1 && od < avoid) {
          const push = (avoid - od) / avoid;
          dirX += (ox / od) * push * 1.6;
          dirY += (oy / od) * push * 1.6;
        }
      }
      for (const b of this.buildings) {
        if (b.koTimer > 0) continue;
        const ox = u.x - b.x, oy = u.y - b.y;
        const od = Math.hypot(ox, oy);
        const avoid = BUILDING_SPECS[b.kind].radius + spec.radius + 16;
        if (od > 0.1 && od < avoid) {
          const push = (avoid - od) / avoid;
          dirX += (ox / od) * push * 1.3;
          dirY += (oy / od) * push * 1.3;
        }
      }

      const slowMult = u.slowTimer > 0 ? 0.55 : 1.0;
      const targetAng = Math.atan2(dirY, dirX);
      const prevAng = u.hullAngle;
      u.hullAngle = stepAngle(u.hullAngle, targetAng, spec.turnSpeed * slowMult * dt);
      const angDelta = normAngle(u.hullAngle - prevAng);
      u.turnVel = clamp(u.turnVel * 0.8 + (dt > 0 ? angDelta / dt : 0) * 0.25, -4, 4);
      const fwdFactor = Math.max(0.25, Math.cos(normAngle(targetAng - u.hullAngle)));
      const spd = spec.speed * slowMult * fwdFactor;
      u.vx = Math.cos(u.hullAngle) * spd;
      u.vy = Math.sin(u.hullAngle) * spd;
      u.x = clamp(u.x + u.vx * dt, 30, WORLD_WIDTH - 30);
      u.y = clamp(u.y + u.vy * dt, 30, WORLD_HEIGHT - 30);
      return false;
    }

    resolveCollisions() {
      const len = this.units.length;
      for (let i = 0; i < len; i++) {
        const a = this.units[i];
        if (a.koTimer > 0) continue;
        const sa = UNIT_SPECS[a.kind];
        for (let j = i + 1; j < len; j++) {
          const b = this.units[j];
          if (b.koTimer > 0) continue;
          const sb = UNIT_SPECS[b.kind];
          const dx = b.x - a.x, dy = b.y - a.y;
          const minD = sa.radius + sb.radius + 3;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0.01 && d2 < minD * minD) {
            const d = Math.sqrt(d2);
            const push = (minD - d) * 0.45;
            const nx = dx / d, ny = dy / d;
            a.x = clamp(a.x - nx * push, 30, WORLD_WIDTH - 30);
            a.y = clamp(a.y - ny * push, 30, WORLD_HEIGHT - 30);
            b.x = clamp(b.x + nx * push, 30, WORLD_WIDTH - 30);
            b.y = clamp(b.y + ny * push, 30, WORLD_HEIGHT - 30);
          }
        }
        for (const r of this.obstacles) {
          const dx = a.x - r.x, dy = a.y - r.y;
          const minD = sa.radius + r.radius + 4;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0.01 && d2 < minD * minD) {
            const d = Math.sqrt(d2);
            a.x += (dx / d) * (minD - d);
            a.y += (dy / d) * (minD - d);
          }
        }
      }
    }

    fireProjectile(faction, kind, sx, sy, sz, target, dmg, splash, speed, attackerId, elite) {
      const dist = Math.max(12, Math.hypot(target.x - sx, target.y - sy));
      const dur = Math.max(0.08, dist / speed);
      this.projectiles.push({
        id: this.nextId++, faction, kind, x: sx, y: sy, z: sz,
        startX: sx, startY: sy, startZ: sz,
        targetX: target.x, targetY: target.y,
        damage: dmg, splashRadius: splash, targetEntityId: target.id,
        attackerUnitId: attackerId, elite, progress: 0, duration: dur
      });
    }

    updateProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.progress += dt / p.duration;
        const t = clamp(p.progress, 0, 1);
        p.x = p.startX + (p.targetX - p.startX) * t;
        p.y = p.startY + (p.targetY - p.startY) * t;
        const arc = p.kind === 'mortar' ? Math.sin(t * Math.PI) * 64
          : p.kind === 'missile' ? Math.sin(t * Math.PI) * 52
          : p.kind === 'shell' ? Math.sin(t * Math.PI) * 16 : 0;
        p.z = p.startZ * (1 - t) + 10 * t + arc;

        if ((p.kind === 'missile' || p.kind === 'mortar') && Math.random() < 0.65 && this.effects) {
          this.effects.spawnParticle(p.x, p.y, p.z, 0, 0, 12, p.kind === 'mortar' ? 3.2 : 2.5, '#D4D4D8', 0.28, 0);
        }

        if (p.progress >= 1) {
          this.detonateProjectile(p);
          this.projectiles.splice(i, 1);
        }
      }
    }

    detonateProjectile(p) {
      if (p.splashRadius > 0) {
        this.effects && this.effects.spawnExplosion(p.targetX, p.targetY, p.splashRadius >= 36);
        this.applySplashDamage(p.targetX, p.targetY, p.splashRadius, p.damage, p.faction, p.attackerUnitId, p.targetEntityId, 0, 1.0);
      } else {
        const t = p.targetEntityId ? this.getEntityById(p.targetEntityId) : null;
        if (t && t.koTimer <= 0 && distSq(t.x, t.y, p.targetX, p.targetY) < 42 * 42) {
          this.applyDamage(t, p.damage, p.faction, p.attackerUnitId);
        }
        this.effects && this.effects.spawnParticle(p.targetX, p.targetY, 8, 0, 0, 20, 4, '#FEF08A', 0.16, 0);
      }
    }

    applyDamage(target, amount, attackerFaction, attackerUnitId) {
      if (target.koTimer > 0) return;
      let mult = 1;
      if (target.rank !== undefined) {
        mult = VETERANCY_SPECS[target.rank].dmgTaken;
        target.lastCombatTime = this.elapsedTime;
      }
      const dmg = amount * mult;
      target.hp -= dmg;
      target.hitFlash = 1;

      if (attackerUnitId) {
        const atk = this.units.find((u) => u.id === attackerUnitId);
        if (atk && atk.koTimer <= 0) {
          atk.lastCombatTime = this.elapsedTime;
          atk.xp += dmg;
          if (atk.rank < 3 && atk.xp >= VETERANCY_SPECS[atk.rank + 1].xp) {
            atk.rank++;
            if (atk.faction === this.playerFaction && !this.demoMode) {
              this.effects && this.effects.spawnText(atk.x, atk.y - 24, `★ РАНГ ${atk.rank}`, '#FBBF24');
            }
          }
        }
      }

      if (target.hp <= 0) {
        target.hp = 0;
        const isBuilding = !!BUILDING_SPECS[target.kind];
        target.koTimer = isBuilding ? 0.55 : 0.48;
        target.selected = false;
        this.cameraTrauma = Math.min(1, this.cameraTrauma + (isBuilding ? 0.45 : 0.16));
        this.sound && this.sound.playExplosion(isBuilding);
        this.effects && this.effects.spawnExplosion(target.x, target.y, isBuilding);

        if (!isBuilding && UNIT_SPECS[target.kind].salvage > 0) {
          const val = UNIT_SPECS[target.kind].salvage;
          this.wrecks.push({
            id: this.nextId++, kind: target.kind, faction: target.faction,
            x: target.x, y: target.y, hullAngle: target.hullAngle,
            supplyValue: val, maxSupplyValue: val
          });
        }
        if (attackerFaction && attackerFaction !== target.faction) {
          this.economies[attackerFaction].kills++;
        }
        if (isBuilding) this.recomputePower();
        else this.economies[target.faction].lost++;
      }
    }

    cleanupDestroyed(dt) {
      for (let i = this.units.length - 1; i >= 0; i--) {
        const u = this.units[i];
        if (u.koTimer > 0) {
          if (Math.random() < 0.55 && this.effects) {
            this.effects.spawnParticle(
              u.x + (Math.random() - 0.5) * 14, u.y + (Math.random() - 0.5) * 14, 14,
              (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 48 + Math.random() * 40,
              Math.random() < 0.45 ? 4.5 : 3.0, Math.random() < 0.45 ? '#F97316' : '#3F3F46', 0.36, 40
            );
          }
          u.koTimer -= dt;
          if (u.koTimer <= 0) this.units.splice(i, 1);
        }
      }
      let bRemoved = false;
      for (let i = this.buildings.length - 1; i >= 0; i--) {
        const b = this.buildings[i];
        if (b.koTimer > 0) {
          if (Math.random() < 0.75 && this.effects) {
            this.effects.spawnParticle(
              b.x + (Math.random() - 0.5) * 34, b.y + (Math.random() - 0.5) * 34, 18,
              (Math.random() - 0.5) * 45, (Math.random() - 0.5) * 45, 55 + Math.random() * 55,
              Math.random() < 0.4 ? 5.5 : 4.5, Math.random() < 0.4 ? '#FB923C' : '#3F3F46', 0.44, 50
            );
          }
          b.koTimer -= dt;
          if (b.koTimer <= 0) { this.buildings.splice(i, 1); bRemoved = true; }
        }
      }
      if (bRemoved) this.recomputePower();
      for (let i = this.wrecks.length - 1; i >= 0; i--) {
        if (this.wrecks[i].supplyValue <= 0) this.wrecks.splice(i, 1);
      }
      for (let i = this.supplyNodes.length - 1; i >= 0; i--) {
        if (this.supplyNodes[i].amount <= 0) this.supplyNodes.splice(i, 1);
      }
    }

    updateDemoRespawns() {
      for (const f of ['red', 'green']) {
        const count = this.units.filter((u) => u.faction === f).length;
        if (count < 6) {
          const pool = FACTION_UNITS[f].slice(1);
          const k = pool[Math.floor(Math.random() * pool.length)];
          const bx = f === 'red' ? 540 : 1860;
          const by = f === 'red' ? 1160 : 440;
          const u = this.spawnUnit(f, k, bx + (Math.random() - 0.5) * 90, by + (Math.random() - 0.5) * 90);
          u.order = 'attackMove';
          u.targetX = 1200 + (Math.random() - 0.5) * 260;
          u.targetY = 800 + (Math.random() - 0.5) * 200;
        }
      }
    }

    updateEnemyAi(dt) {
      const ef = this.enemyFaction;
      const pf = this.playerFaction;
      const prof = AI_PROFILES[this.difficulty];
      this.aiTimer -= dt;
      this.aiWaveTimer -= dt;
      this.aiOutpostCd -= dt;
      this.aiStrikeCd -= dt;

      if (this.aiTimer <= 0) {
        this.aiTimer = prof.decInt;
        const eEcon = this.economies[ef];
        const has = (k) => this.buildings.some((b) => b.faction === ef && b.kind === k && b.koTimer <= 0);
        const countB = (k) => this.buildings.filter((b) => b.faction === ef && b.kind === k && b.koTimer <= 0).length;
        const genBuilding = this.buildings.some((b) => b.faction === ef && b.kind === 'generator' && b.buildProgress < 1 && b.koTimer <= 0);
        const lowPwr = this.isLowPower(ef);

        if ((lowPwr || eEcon.powerConsumed >= eEcon.powerProduced - 10) && !genBuilding && eEcon.supplies >= BUILDING_SPECS.generator.cost) {
          this.tryAiBuild('generator', 2160, 320);
        } else if (!lowPwr && !has('motorpool') && eEcon.supplies >= BUILDING_SPECS.motorpool.cost) {
          this.tryAiBuild('motorpool', 1860, 370);
        } else if (!lowPwr && this.elapsedTime > prof.techTime && !has('command') && eEcon.supplies >= BUILDING_SPECS.command.cost) {
          this.tryAiBuild('command', 2140, 460);
        } else if (!lowPwr && countB('bunker') < prof.maxBunkers && eEcon.supplies >= BUILDING_SPECS.bunker.cost) {
          this.tryAiBuild('bunker', 1760, 520);
        } else if (!lowPwr && this.hasTech(ef, 'command') && countB('heavyGun') < 2 && eEcon.supplies >= BUILDING_SPECS.heavyGun.cost) {
          this.tryAiBuild('heavyGun', 1780, 440);
        }

        const supKind = this.getSupplyUnitKind(ef);
        const harvs = this.units.filter((u) => u.faction === ef && u.kind === supKind).length;
        if (harvs < prof.maxSupplyTrucks && eEcon.supplies >= UNIT_SPECS[supKind].cost) {
          this.queueUnit(ef, supKind);
        }

        const combat = this.units.filter((u) => u.faction === ef && !UNIT_SPECS[u.kind].isHarvester).length;
        if (combat < prof.armyCap && has('motorpool')) {
          const allFacUnits = FACTION_UNITS[ef].filter((k) => !UNIT_SPECS[k].isHarvester);
          const available = allFacUnits.filter((k) => !UNIT_SPECS[k].requiresTech || this.hasTech(ef, UNIT_SPECS[k].requiresTech));
          const pick = available[Math.floor(Math.random() * available.length)];
          if (pick) this.queueUnit(ef, pick);
        }
      }

      if (this.aiOutpostCd <= 0) {
        this.aiOutpostCd = 24;
        const cp = this.capturePoints.find((c) => c.owner !== ef);
        const idle = this.units.filter((u) => u.faction === ef && !UNIT_SPECS[u.kind].isHarvester && u.order === 'idle').slice(0, 2);
        if (cp && idle.length > 0) {
          for (const u of idle) { u.order = 'attackMove'; u.targetX = cp.x; u.targetY = cp.y; }
        }
      }

      if (this.aiWaveTimer <= 0) {
        this.aiWaveTimer = Math.max(18, prof.waveInt - this.aiWaveCount * 1.1);
        const idle = this.units.filter((u) => u.faction === ef && !UNIT_SPECS[u.kind].isHarvester && u.order === 'idle');
        const squadSize = Math.min(prof.maxSquad, prof.minSquad + Math.floor(this.aiWaveCount * 0.6));
        if (idle.length >= squadSize) {
          this.aiWaveCount++;
          const target = this.getPlayerHq() || this.buildings.find((b) => b.faction === pf) || { x: 360, y: 1240 };
          for (const u of idle.slice(0, squadSize)) {
            u.order = 'attackMove';
            u.targetX = target.x + (Math.random() - 0.5) * 90;
            u.targetY = target.y + (Math.random() - 0.5) * 90;
          }
        }
      }

      if (prof.useBarrage && this.aiStrikeCd <= 0 && this.hasTech(ef, 'command')) {
        const tgt = this.units.find((u) => u.faction === pf && u.koTimer <= 0);
        if (tgt) {
          this.aiStrikeCd = 75;
          this.activeAirstrikes.push({
            id: this.nextId++, faction: ef, x: tgt.x, y: tgt.y,
            radius: 145, delay: 2.4, totalDelay: 2.4, damage: 200
          });
          this.showAlert('ВНИМАНИЕ: Вражеский артудар!');
        }
      }
    }

    tryAiBuild(kind, px, py) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const x = px + (Math.random() - 0.5) * 260;
        const y = py + (Math.random() - 0.5) * 260;
        if (this.canPlaceBuilding(this.enemyFaction, kind, x, y).ok) {
          return this.placeBuilding(this.enemyFaction, kind, x, y);
        }
      }
      return null;
    }

    checkWinLoss(dt) {
      const pBuildings = this.buildings.filter((b) => b.faction === this.playerFaction && b.koTimer <= 0).length;
      const eBuildings = this.buildings.filter((b) => b.faction === this.enemyFaction && b.koTimer <= 0).length;
      if (eBuildings === 0) {
        this.pendingOutcome = 'victory';
      } else if (pBuildings === 0) {
        this.pendingOutcome = 'defeat';
      }
      if (this.pendingOutcome) {
        this.defeatDelay += dt;
        if (this.defeatDelay >= 1.2) {
          this.outcome = this.pendingOutcome;
          this.phase = 'gameover';
        }
      }
    }

    findNearestEnemy(x, y, maxRange, enemyFaction) {
      let best = null, bestD2 = maxRange * maxRange;
      for (const u of this.units) {
        if (u.faction !== enemyFaction || u.koTimer > 0) continue;
        const d2 = distSq(x, y, u.x, u.y);
        if (d2 < bestD2) { bestD2 = d2; best = u; }
      }
      for (const b of this.buildings) {
        if (b.faction !== enemyFaction || b.koTimer > 0) continue;
        const r = BUILDING_SPECS[b.kind].radius;
        const d = Math.hypot(b.x - x, b.y - y) - r;
        if (d <= maxRange && d * d < bestD2) { bestD2 = d * d; best = b; }
      }
      return best;
    }

    findNearestSupply(x, y) {
      let best = null, bestD2 = Infinity;
      for (const o of this.supplyNodes) {
        if (o.amount <= 0) continue;
        const d2 = distSq(x, y, o.x, o.y);
        if (d2 < bestD2) { bestD2 = d2; best = o; }
      }
      return best;
    }

    findNearestWreck(x, y, maxRange = 260) {
      let best = null, bestD2 = maxRange * maxRange;
      for (const w of this.wrecks) {
        if (w.supplyValue <= 0) continue;
        const d2 = distSq(x, y, w.x, w.y);
        if (d2 < bestD2) { bestD2 = d2; best = w; }
      }
      return best;
    }

    findNearestDropoff(x, y, faction) {
      let best = null, bestD2 = Infinity;
      for (const b of this.buildings) {
        if (b.faction !== faction || b.koTimer > 0 || b.buildProgress < 1) continue;
        if (b.kind !== 'hq' && b.kind !== 'depot') continue;
        const d2 = distSq(x, y, b.x, b.y);
        if (d2 < bestD2) { bestD2 = d2; best = b; }
      }
      return best;
    }

    getPlayerHq() {
      return this.buildings.find((b) => b.faction === this.playerFaction && b.kind === 'hq' && b.koTimer <= 0) || null;
    }

    getEntityById(id) {
      return this.units.find((u) => u.id === id) || this.buildings.find((b) => b.id === id) || null;
    }
  }

  FL.CONSTANTS = {
    WORLD_WIDTH, WORLD_HEIGHT, FACTION_INFO, FACTION_UNITS, BUILD_ORDER,
    UNIT_SPECS, BUILDING_SPECS, SUPPORT_POWER_SPECS, VETERANCY_SPECS
  };
  FL.RtsSimulation = RtsSimulation;
})();
