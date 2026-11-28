# IRON FRONT — Red Dominion vs Olive Vanguard

Браузерная RTS-игра с процедурным 3D→Pixel-Art рендерингом (`20 FPS`, `32` направления поворота) и скевоморфным командным интерфейсом, полностью на чистом HTML5, CSS и JavaScript без сборщиков и зависимостей.

## Фракции
- **Red Dominion** — Багги, Огнемёт, Мортира, Чёрная Сфера и базовые подразделения/постройки.
- **Olive Vanguard** — Хамви, БТР 8×8, Ракета, Циклоп, Ион и базовые подразделения/постройки.

## Страницы
- `index.html` — основная игра (выбор фракции, карты/сектора, уровня сложности и бой; поддержка импорта `.json` карт; предпросмотр всех 20 3D→Pixel курсоров: `index.html?cursors=1`).
- `editor.html` — **Map Maker**: визуальный WYSIWYG-конструктор карт (5 биомов, живое зеркалирование, валидатор баланса и проходимости, тест-бой в 1 клик, экспорт/импорт JSON).
- `showcase.html` — интерактивный 3D ↔ Pixel Art шоукейс 16 юнитов.
- `docs.html` — техническая документация, спецификация JSON-карт и контекст-брифинг для разработчиков и AI-агентов.

## Карты и валидатор (для людей и AI-агентов)
Встроенные карты хранятся в `maps/*.json` (реестр — `maps/manifest.json`) в едином декларативном формате `schemaVersion: 1` с поддержкой 5 биомов (`steppe`, `desert`, `tundra`, `ashland`, `marsh`) и авто-симметрии (`autoMirror: true`).

Проверка всех карт (или одного файла) из терминала:

```bash
node scripts/validate_maps.mjs
node scripts/validate_maps.mjs maps/my_map.json
node scripts/validate_maps.mjs --sync-builtin
```

## Управление
- **ЛКМ** — выбор юнита / рамка выделения
- **ПКМ** — приказ движения или атаки
- **WASD / Стрелки** — перемещение камеры
- **1–3** — группы отрядов
- **Q..M** — заказ техники
- **4..0** — строительство сооружений
- **R** — поворот здания перед установкой (`0° / 90° / 180° / 270°`)
- **F** — атака-штурм
- **H** — стоп
- **T / G** — авиаразведка / артудар
- **Home** — камера к штабу
- **P** — пауза

## Локальный запуск
Проект состоит из статических файлов и не требует сборки:

```bash
python3 -m http.server 8080
```

После запуска откройте в браузере `http://localhost:8080/` (и `http://localhost:8080/showcase.html` для шоукейса).

## Структура проекта
```text
.
├── index.html
├── editor.html
├── editor.css
├── showcase.html
├── docs.html
├── style.css
├── maps/
│   ├── manifest.json
│   ├── sector_04.json
│   ├── frostline_pass.json
│   ├── dune_citadel.json
│   ├── ash_foundry.json
│   └── marsh_delta.json
├── scripts/
│   └── validate_maps.mjs
└── js/
    ├── maps.js
    ├── maps_builtin.js
    ├── mesh_core.js
    ├── units_meshes.js
    ├── buildings_meshes.js
    ├── sim.js
    ├── renderer3d.js
    ├── cursors.js
    ├── fog.js
    ├── particles.js
    ├── sound.js
    ├── renderer.js
    ├── main.js
    └── editor.js
```
