import {Pair} from './utils/Pair';
import {Rect} from './utils/Rect';
import {Vector2d} from './utils/Vector2d';
import {PLAYER_FOV} from './utils/constants';
import {Configuration} from './utils/Configuration';
import {RaycastHit} from "./utils/Raycaster";

class OverviewMapConstants {
    playerMarkerRadius: number = 5;
    playerHeadingLength: number = 15;
}

export class OverviewMap {
    private constants = new OverviewMapConstants();
    private readonly cells: Rect[] = [];
    private readonly gridLinesRows: Pair<Vector2d>[] = [];
    private readonly gridLinesColumns: Pair<Vector2d>[] = [];
    readonly columns: number;
    readonly rows: number;
    readonly player: { pos: Vector2d, angle: number };

    constructor(columns: number, rows: number) {
        this.columns = columns;
        this.rows = rows;
        this.player = { pos: new Vector2d(0, 0), angle: 0};

        // create cells
        for (let row = 0; row < rows + 1; row++) {
            for (let col = 0; col < columns + 1; col++) {
                this.cells.push(new Rect(0, 0, 0, 0));
            }
        }

        // create grid lines
        for (let row = 0; row < rows + 1; row++) {
            this.gridLinesRows.push(new Pair(new Vector2d(0, 0), new Vector2d(0, 0)));
        }
        for (let col = 0; col < columns + 1; col++) {
            this.gridLinesColumns.push(new Pair(new Vector2d(0, 0), new Vector2d(0, 0)));
        }
    }

    resizeGrid(canvas: HTMLCanvasElement) {
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
                first: {x: startX, y: startY + cellHeight * row},
                second: {x: endX, y: startY + cellHeight * row}
            };
            for (let col = 0; col < this.columns + 1; col++) {
                this.gridLinesColumns[col] = {
                    first: {x: startX + cellWidth * col, y: startY},
                    second: {x: startX + cellWidth * col, y: endY}
                };
            }
        }
    }

    atXY(cellX: number, cellY: number): Rect {
        return this.cells[cellY * this.columns + cellX];
    }

    atCanvasXY(canvasX: number, canvasY: number): Vector2d | null {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.rows; x++) {
                const cell = this.atXY(x, y);
                if (cell.includes(canvasX, canvasY)) {
                    return new Vector2d(x, y);
                }
            }
        }
        return null;
    }

    render(canvas: HTMLCanvasElement, wallMatrix: number[][], rays: Generator<RaycastHit | null>, configuration: Configuration) {
        const ctx = canvas.getContext('2d')!;

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
                    } else {
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
            if (!collision) continue;
            const tile = this.atXY(collision.tileX, collision.tileY);
            ctx.lineTo(tile.x + tile.width * (collision.hitPosition.x - collision.tileX), tile.y + tile.height * (collision.hitPosition.y - collision.tileY));
        }
        ctx.lineTo(this.player.pos.x, this.player.pos.y);
        ctx.fill(); // Render it

        // Player field of view
        ctx.beginPath();
        ctx.strokeStyle = '#00ff00';
        ctx.moveTo(this.player.pos.x, this.player.pos.y);
        ctx.lineTo(this.player.pos.x + Math.cos(this.player.angle - PLAYER_FOV / 2.0) * 100, this.player.pos.y + Math.sin(this.player.angle - PLAYER_FOV / 2.0) * 100);
        ctx.moveTo(this.player.pos.x, this.player.pos.y);
        ctx.lineTo(this.player.pos.x + Math.cos(this.player.angle + PLAYER_FOV / 2.0) * 100, this.player.pos.y + Math.sin(this.player.angle + PLAYER_FOV / 2.0) * 100);
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

    setPlayer(cellX: number, cellY: number, angle: number) {
        const playerCell = this.atXY(Math.floor(cellX), Math.floor(cellY));
        this.player.pos.x = playerCell.x + playerCell.width * (cellX % 1);
        this.player.pos.y = playerCell.y + playerCell.height * (cellY % 1);
        this.player.angle = angle;
    }
}
