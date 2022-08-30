var RAYCASTING = (() => {
    const defines = {};
    const entry = [null];
    function define(name, dependencies, factory) {
        defines[name] = { dependencies, factory };
        entry[0] = name;
    }
    define("require", ["exports"], (exports) => {
        Object.defineProperty(exports, "__cjsModule", { value: true });
        Object.defineProperty(exports, "default", { value: (name) => resolve(name) });
    });
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    define("utils/Vector2d", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Vector2d = void 0;
        class Vector2d {
            constructor(x, y) {
                this.x = x;
                this.y = y;
            }
        }
        exports.Vector2d = Vector2d;
    });
    define("utils/constants", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.PLAYER_FOV = void 0;
        exports.PLAYER_FOV = Math.PI / 2.0;
    });
    define("utils/Player", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Player = void 0;
        class Player {
            constructor(x, y, angle) {
                this.gridX = x;
                this.gridY = y;
                this.angle = angle;
            }
        }
        exports.Player = Player;
    });
    define("utils/Raycaster", ["require", "exports", "utils/Vector2d", "utils/constants"], function (require, exports, Vector2d_1, constants_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Raycaster = void 0;
        class Raycaster {
            static cast(wallMatrix, startGridX, startGridY, rayAngle) {
                // Ray 2D components
                const rayDirX = Math.cos(rayAngle);
                const rayDirY = Math.sin(rayAngle);
                // Step in this direction
                const dirSignX = rayDirX > 0 ? 1 : -1;
                const dirSignY = rayDirY > 0 ? 1 : -1;
                // Get the integer tile coordinates (closest edge)
                let tileX = Math.floor(startGridX);
                let tileY = Math.floor(startGridY);
                let tileNextX = dirSignX > 0 ? Math.ceil(startGridX) : Math.floor(startGridX);
                let tileNextY = dirSignY > 0 ? Math.ceil(startGridY) : Math.floor(startGridY);
                // Position of the ray cast
                let curX = startGridX;
                let curY = startGridY;
                let t = 0;
                while (tileNextX > 0 && tileNextX <= wallMatrix[0].length && tileNextY > 0 && tileNextY <= wallMatrix.length) {
                    // Distance to next cell edges
                    const dtX = (tileNextX - curX) / rayDirX;
                    const dtY = (tileNextY - curY) / rayDirY;
                    if (dtX < dtY) {
                        t = t + dtX;
                        tileNextX = tileNextX + dirSignX;
                        tileX = tileX + dirSignX;
                    }
                    else {
                        t = t + dtY;
                        tileNextY = tileNextY + dirSignY;
                        tileY = tileY + dirSignY;
                    }
                    // New grid intercept point
                    curX = startGridX + rayDirX * t;
                    curY = startGridY + rayDirY * t;
                    // The ray hit a wall
                    if (wallMatrix[tileY][tileX] > 0) {
                        return {
                            hitPosition: new Vector2d_1.Vector2d(curX, curY),
                            tileX: tileX,
                            tileY: tileY,
                            tileValue: wallMatrix[tileY][tileX],
                            euclideanDistance: t,
                            perpendicularDistance: NaN
                        };
                    }
                }
                return null;
            }
            static *sweep(wallMatrix, player, screenWidth) {
                const leftAngle = player.angle - constants_1.PLAYER_FOV / 2.0;
                const anglePerPixel = constants_1.PLAYER_FOV / screenWidth;
                for (let x = 0; x < screenWidth; x++) {
                    const result = Raycaster.cast(wallMatrix, player.gridX, player.gridY, leftAngle + anglePerPixel * x);
                    yield result;
                }
            }
        }
        exports.Raycaster = Raycaster;
    });
    define("utils/Configuration", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
    });
    define("Camera", ["require", "exports", "utils/Raycaster"], function (require, exports, Raycaster_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Camera = void 0;
        function hexToRbg(c) {
            const r = parseInt(c.substring(1, 3), 16);
            const g = parseInt(c.substring(3, 5), 16);
            const b = parseInt(c.substring(5), 16);
            return { r: r, g: g, b: b };
        }
        function colourInterpolate(c1, c2, p) {
            const r = Math.min(c1.r, c2.r) + (Math.max(c1.r, c2.r) - Math.min(c1.r, c2.r)) * p;
            const g = Math.min(c1.g, c2.g) + (Math.max(c1.g, c2.g) - Math.min(c1.g, c2.g)) * p;
            const b = Math.min(c1.b, c2.b) + (Math.max(c1.b, c2.b) - Math.min(c1.b, c2.b)) * p;
            return `rgba(${r}, ${g}, ${b}, 1)`;
        }
        function getImage(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield fetch(path);
                const fileBlob = yield response.blob();
                const bitmap = yield createImageBitmap(fileBlob);
                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const context = canvas.getContext('2d');
                context.drawImage(bitmap, 0, 0);
                return context.getImageData(0, 0, bitmap.width, bitmap.height);
            });
        }
        class Camera {
            constructor() {
                this.textures = {
                    wall1: null,
                    wall2: null
                };
                getImage('./wall.png').then(value => this.textures.wall1 = value);
                getImage('./wall2.png').then(value => this.textures.wall2 = value);
            }
            renderBackground(canvas) {
                const ctx = canvas.getContext('2d');
                const top = 0;
                const middle = canvas.height / 4;
                const bottom = canvas.height / 2;
                // Sky
                let colourStart = hexToRbg('#00c4ff');
                let colourEnd = hexToRbg('#0000ff');
                for (let y = top; y < middle; y++) {
                    ctx.beginPath();
                    ctx.strokeStyle = colourInterpolate(colourEnd, colourStart, y / (middle - top));
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
                // Grass
                colourStart = hexToRbg('#22ff00');
                colourEnd = hexToRbg('#020700');
                for (let y = middle; y < bottom; y++) {
                    ctx.beginPath();
                    ctx.strokeStyle = colourInterpolate(colourEnd, colourStart, (y - middle) / (bottom - middle));
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
            }
            render2dColour(canvas, player, wallMatrix) {
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height / 2;
                ctx.beginPath();
                ctx.strokeStyle = '#707070';
                let x = 0;
                for (let collision of Raycaster_1.Raycaster.sweep(wallMatrix, player, width)) {
                    if (collision) {
                        const lineHeight = Math.round(height / collision.euclideanDistance);
                        ctx.moveTo(x, Math.max(0, height / 2 - lineHeight / 2));
                        ctx.lineTo(x, Math.min(height, height / 2 + lineHeight / 2));
                    }
                    x++;
                }
                ctx.stroke();
            }
            render2dColourShaded(canvas, player, wallMatrix) {
                this.renderBackground(canvas);
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height / 2;
                const foreground = hexToRbg('#c2c2c2');
                const background = hexToRbg('#000000');
                let x = 0;
                for (let collision of Raycaster_1.Raycaster.sweep(wallMatrix, player, width)) {
                    if (collision) {
                        const lineHeight = Math.round(height / collision.euclideanDistance);
                        ctx.beginPath();
                        ctx.fillStyle = colourInterpolate(foreground, background, Math.min(1 / collision.euclideanDistance, 1));
                        ctx.fillRect(x, Math.max(0, height / 2 - lineHeight / 2), 1, Math.min(height, lineHeight));
                        ctx.fill();
                    }
                    x++;
                }
            }
            render2dTextured(canvas, player, wallMatrix) {
                this.renderBackground(canvas);
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height / 2;
                let x = 0;
                for (let collision of Raycaster_1.Raycaster.sweep(wallMatrix, player, width)) {
                    if (collision) {
                        const lineHeight = Math.round(height / collision.euclideanDistance);
                        const texture = this.textures.wall2;
                        if (texture === null)
                            return;
                        const dX = collision.hitPosition.x % 1;
                        const dY = collision.hitPosition.y % 1;
                        // Is horizontal or vertical wall
                        const texX = (() => {
                            if (Math.abs(collision.hitPosition.x - collision.tileX) <= 0.000001 || Math.round(collision.hitPosition.x) - 1 === collision.tileX)
                                return Math.round(texture.width * dY);
                            else
                                return Math.round(texture.width * dX);
                        })();
                        ctx.beginPath();
                        const colTop = height / 2 - lineHeight / 2;
                        const colBottom = height / 2 + lineHeight / 2;
                        const colTruncatedTop = Math.max(0, colTop);
                        const colTruncatedBottom = Math.min(height, colBottom);
                        for (let y = colTruncatedTop; y < colTruncatedBottom; y++) {
                            const yPercent = (y - colTop) / (colBottom - colTop);
                            const texY = Math.round(texture.height * yPercent);
                            const pixelIndex = texture.width * texY * 4 + texX * 4;
                            const r = texture.data[pixelIndex];
                            const g = texture.data[pixelIndex + 1];
                            const b = texture.data[pixelIndex + 2];
                            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
                            ctx.fillRect(x, y, 1, 1);
                        }
                        ctx.fill();
                    }
                    x++;
                }
            }
            render(canvas, player, wallMatrix, configuration) {
                if (configuration.selectedRenderer === 'solid')
                    this.render2dColour(canvas, player, wallMatrix);
                else if (configuration.selectedRenderer === 'shaded')
                    this.render2dColourShaded(canvas, player, wallMatrix);
                else
                    this.render2dTextured(canvas, player, wallMatrix);
            }
        }
        exports.Camera = Camera;
    });
    define("utils/Pair", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Pair = void 0;
        class Pair {
            constructor(first, second) {
                this.first = first;
                this.second = second;
            }
        }
        exports.Pair = Pair;
    });
    define("utils/Rect", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Rect = void 0;
        class Rect {
            constructor(x, y, width, height) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
            }
            includes(x, y) {
                return x >= this.x && x <= this.x + this.width
                    && y >= this.y && y <= this.y + this.height;
            }
        }
        exports.Rect = Rect;
    });
    define("OverviewMap", ["require", "exports", "utils/Pair", "utils/Rect", "utils/Vector2d", "utils/constants"], function (require, exports, Pair_1, Rect_1, Vector2d_2, constants_2) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.OverviewMap = void 0;
        class OverviewMapConstants {
            constructor() {
                this.playerMarkerRadius = 5;
                this.playerHeadingLength = 15;
            }
        }
        class OverviewMap {
            constructor(columns, rows) {
                this.constants = new OverviewMapConstants();
                this.cells = [];
                this.gridLinesRows = [];
                this.gridLinesColumns = [];
                this.columns = columns;
                this.rows = rows;
                this.player = { pos: new Vector2d_2.Vector2d(0, 0), angle: 0 };
                // create cells
                for (let row = 0; row < rows + 1; row++) {
                    for (let col = 0; col < columns + 1; col++) {
                        this.cells.push(new Rect_1.Rect(0, 0, 0, 0));
                    }
                }
                // create grid lines
                for (let row = 0; row < rows + 1; row++) {
                    this.gridLinesRows.push(new Pair_1.Pair(new Vector2d_2.Vector2d(0, 0), new Vector2d_2.Vector2d(0, 0)));
                }
                for (let col = 0; col < columns + 1; col++) {
                    this.gridLinesColumns.push(new Pair_1.Pair(new Vector2d_2.Vector2d(0, 0), new Vector2d_2.Vector2d(0, 0)));
                }
            }
            resizeGrid(canvas) {
                const size = Math.min(canvas.width / 2.0, canvas.height / 2.0);
                const offsetX = canvas.width / 2.0 - size;
                const offsetY = canvas.height / 2.0 - size;
                const startX = 0 + offsetX / 2.0;
                const startY = canvas.height / 2.0 + offsetY / 2.0;
                const endX = canvas.width / 2.0 - offsetX / 2.0;
                const endY = canvas.height - offsetY / 2.0;
                const cellWidth = (endX - startX) / this.rows;
                const cellHeight = (endY - startY) / this.columns;
                // Resize cells
                for (let row = 0; row < this.rows + 1; row++) {
                    for (let col = 0; col < this.columns + 1; col++) {
                        const x = startX + cellWidth * col;
                        const y = startY + cellHeight * row;
                        const cell = this.atXY(col, row);
                        cell.x = x;
                        cell.y = y;
                        cell.width = cellWidth;
                        cell.height = cellHeight;
                    }
                }
                // Resize grid lines
                for (let row = 0; row < this.rows + 1; row++) {
                    this.gridLinesRows[row] = {
                        first: { x: startX, y: startY + cellHeight * row },
                        second: { x: endX, y: startY + cellHeight * row }
                    };
                    for (let col = 0; col < this.columns + 1; col++) {
                        this.gridLinesColumns[col] = {
                            first: { x: startX + cellWidth * col, y: startY },
                            second: { x: startX + cellWidth * col, y: endY }
                        };
                    }
                }
            }
            atXY(cellX, cellY) {
                return this.cells[cellY * this.columns + cellX];
            }
            atCanvasXY(canvasX, canvasY) {
                for (let y = 0; y < this.rows; y++) {
                    for (let x = 0; x < this.rows; x++) {
                        const cell = this.atXY(x, y);
                        if (cell.includes(canvasX, canvasY)) {
                            return new Vector2d_2.Vector2d(x, y);
                        }
                    }
                }
                return null;
            }
            render(canvas, wallMatrix, rays, configuration) {
                const ctx = canvas.getContext('2d');
                // Draw gid lines
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#000000';
                for (const row of this.gridLinesRows) {
                    ctx.moveTo(row.first.x, row.first.y);
                    ctx.lineTo(row.second.x, row.second.y);
                }
                for (const col of this.gridLinesColumns) {
                    ctx.moveTo(col.first.x, col.first.y);
                    ctx.lineTo(col.second.x, col.second.y);
                }
                ctx.stroke(); // Render it
                // Filled in cells
                ctx.beginPath();
                ctx.fillStyle = '#000000';
                for (let y = 0; y < this.rows; y++) {
                    for (let x = 0; x < this.rows; x++) {
                        if (wallMatrix[y][x]) {
                            const cell = this.atXY(x, y);
                            ctx.rect(cell.x, cell.y, cell.width, cell.height);
                        }
                    }
                }
                ctx.fill(); // Render it
                // Debug text for cells
                if (configuration.showMapCoordinates) {
                    ctx.beginPath();
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    for (let y = 0; y < this.rows; y++) {
                        for (let x = 0; x < this.rows; x++) {
                            const cell = this.atXY(x, y);
                            if (wallMatrix[y][x]) {
                                ctx.fillStyle = '#ffffff';
                            }
                            else {
                                ctx.fillStyle = '#000000';
                            }
                            ctx.fillText(`${x}, ${y}`, cell.x + cell.width / 2.0, cell.y + cell.height / 2.0);
                        }
                    }
                    ctx.fill(); // Render it
                }
                // Player field of view
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0,255,0,0.25)';
                ctx.moveTo(this.player.pos.x, this.player.pos.y);
                for (const collision of rays) {
                    if (!collision)
                        continue;
                    const tile = this.atXY(collision.tileX, collision.tileY);
                    ctx.lineTo(tile.x + tile.width * (collision.hitPosition.x - collision.tileX), tile.y + tile.height * (collision.hitPosition.y - collision.tileY));
                }
                ctx.lineTo(this.player.pos.x, this.player.pos.y);
                ctx.fill(); // Render it
                // Player field of view
                ctx.beginPath();
                ctx.strokeStyle = '#00ff00';
                ctx.moveTo(this.player.pos.x, this.player.pos.y);
                ctx.lineTo(this.player.pos.x + Math.cos(this.player.angle - constants_2.PLAYER_FOV / 2.0) * 100, this.player.pos.y + Math.sin(this.player.angle - constants_2.PLAYER_FOV / 2.0) * 100);
                ctx.moveTo(this.player.pos.x, this.player.pos.y);
                ctx.lineTo(this.player.pos.x + Math.cos(this.player.angle + constants_2.PLAYER_FOV / 2.0) * 100, this.player.pos.y + Math.sin(this.player.angle + constants_2.PLAYER_FOV / 2.0) * 100);
                ctx.stroke(); // Render it
                // Player marker
                ctx.beginPath();
                ctx.fillStyle = '#ff0000';
                ctx.arc(this.player.pos.x, this.player.pos.y, this.constants.playerMarkerRadius, 0, Math.PI * 2);
                ctx.fill(); // Render it
                // Player heading
                ctx.beginPath();
                ctx.strokeStyle = "#ff0000";
                ctx.moveTo(this.player.pos.x, this.player.pos.y);
                ctx.lineTo(this.player.pos.x + Math.cos(this.player.angle) * this.constants.playerHeadingLength, this.player.pos.y + Math.sin(this.player.angle) * this.constants.playerHeadingLength);
                ctx.stroke(); // Render it
            }
            setPlayer(cellX, cellY, angle) {
                const playerCell = this.atXY(Math.floor(cellX), Math.floor(cellY));
                this.player.pos.x = playerCell.x + playerCell.width * (cellX % 1);
                this.player.pos.y = playerCell.y + playerCell.height * (cellY % 1);
                this.player.angle = angle;
            }
        }
        exports.OverviewMap = OverviewMap;
    });
    define("Game", ["require", "exports", "Camera", "utils/Raycaster"], function (require, exports, Camera_1, Raycaster_2) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.Game = void 0;
        class Game {
            constructor(canvas, wallMatrix, overviewMap, player, config) {
                this.canvas = canvas;
                this.wallMatrix = wallMatrix;
                this.overviewMap = overviewMap;
                this.player = player;
                this.camera = new Camera_1.Camera();
                this.config = config;
                this.resize();
            }
            onClick(event) {
                const bounds = this.canvas.getBoundingClientRect();
                const relativeX = event.clientX - bounds.left; //x position within the element.
                const relativeY = event.clientY - bounds.top; //y position within the element.
                const index = this.overviewMap.atCanvasXY(relativeX, relativeY);
                if (index) {
                    this.wallMatrix[index.y][index.x] = (this.wallMatrix[index.y][index.x] + 1) % 2;
                    this.render();
                }
            }
            rotatePlayer(deltaAngle) {
                this.player.angle += deltaAngle;
                this.player.angle %= Math.PI * 2.0;
                this.overviewMap.setPlayer(this.player.gridX, this.player.gridY, this.player.angle);
            }
            forwardPlayer(distance) {
                // Perform collision detection
                const hit = Raycaster_2.Raycaster.cast(this.wallMatrix, this.player.gridX, this.player.gridY, this.player.angle);
                if (hit && hit.euclideanDistance < distance) {
                    distance = hit.euclideanDistance;
                }
                this.player.gridX += Math.cos(this.player.angle) * distance;
                this.player.gridY += Math.sin(this.player.angle) * distance;
                this.overviewMap.setPlayer(this.player.gridX, this.player.gridY, this.player.angle);
            }
            setConfig(config) {
                this.config = config;
            }
            resize() {
                this.overviewMap.resizeGrid(this.canvas);
                this.overviewMap.setPlayer(this.player.gridX, this.player.gridY, this.player.angle);
            }
            render() {
                const ctx = this.canvas.getContext('2d');
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                const rays = Raycaster_2.Raycaster.sweep(this.wallMatrix, this.player, this.canvas.width);
                this.overviewMap.render(this.canvas, this.wallMatrix, rays, this.config);
                this.camera.render(this.canvas, this.player, this.wallMatrix, this.config);
            }
        }
        exports.Game = Game;
    });
    define("main", ["require", "exports", "Game", "OverviewMap", "utils/Player"], function (require, exports, Game_1, OverviewMap_1, Player_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.main = void 0;
        let game = null;
        function main(canvas, config, getConfig) {
            const ROWS = 10;
            const COLUMNS = 10;
            if (!game) {
                const overviewMap = new OverviewMap_1.OverviewMap(COLUMNS, ROWS);
                // Set the initial Game Map
                const _ = 0;
                const X = 1;
                const wallMatrix = [
                    [X, X, X, X, X, X, X, X, X, X],
                    [X, _, _, _, _, _, _, _, _, X],
                    [X, _, X, X, X, X, X, X, X, X],
                    [X, _, _, _, _, _, _, _, _, X],
                    [X, _, _, X, _, X, _, X, _, X],
                    [X, _, _, _, _, _, _, X, _, X],
                    [X, _, _, _, _, X, _, _, _, X],
                    [X, _, _, _, _, X, X, X, _, X],
                    [X, _, _, _, _, X, _, _, _, X],
                    [X, X, X, X, X, X, X, X, X, X],
                ];
                const player = new Player_1.Player(2.5, 3.5, Math.PI / 4.0);
                game = new Game_1.Game(canvas, wallMatrix, overviewMap, player, getConfig());
            }
            game.render();
            // Add event listeners
            config.addEventListener('change', (event) => configOnChange(event, getConfig()), false);
            canvas.addEventListener('click', game.onClick.bind(game), false);
            window.addEventListener('keydown', canvasOnKeyDown, false);
        }
        exports.main = main;
        function configOnChange(event, config) {
            game === null || game === void 0 ? void 0 : game.setConfig(config);
            game === null || game === void 0 ? void 0 : game.render();
        }
        function canvasOnKeyDown(event) {
            switch (event.key) {
                case 'w':
                    game === null || game === void 0 ? void 0 : game.forwardPlayer(0.25);
                    break;
                case 'a':
                    break;
                case 's':
                    game === null || game === void 0 ? void 0 : game.forwardPlayer(-0.25);
                    break;
                case 'd':
                    break;
                case 'q':
                    game === null || game === void 0 ? void 0 : game.rotatePlayer(-Math.PI / 10);
                    break;
                case 'e':
                    game === null || game === void 0 ? void 0 : game.rotatePlayer(Math.PI / 10);
                    break;
                default:
                    return;
            }
            game === null || game === void 0 ? void 0 : game.render();
        }
    });
    
    'marker:resolver';

    function get_define(name) {
        if (defines[name]) {
            return defines[name];
        }
        else if (defines[name + '/index']) {
            return defines[name + '/index'];
        }
        else {
            const dependencies = ['exports'];
            const factory = (exports) => {
                try {
                    Object.defineProperty(exports, "__cjsModule", { value: true });
                    Object.defineProperty(exports, "default", { value: require(name) });
                }
                catch (_a) {
                    throw Error(['module "', name, '" not found.'].join(''));
                }
            };
            return { dependencies, factory };
        }
    }
    const instances = {};
    function resolve(name) {
        if (instances[name]) {
            return instances[name];
        }
        if (name === 'exports') {
            return {};
        }
        const define = get_define(name);
        if (typeof define.factory !== 'function') {
            return define.factory;
        }
        instances[name] = {};
        const dependencies = define.dependencies.map(name => resolve(name));
        define.factory(...dependencies);
        const exports = dependencies[define.dependencies.indexOf('exports')];
        instances[name] = (exports['__cjsModule']) ? exports.default : exports;
        return instances[name];
    }
    if (entry[0] !== null) {
        return resolve(entry[0]);
    }
})();