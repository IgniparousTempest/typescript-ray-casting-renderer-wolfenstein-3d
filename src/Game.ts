import {Camera} from './Camera';
import {OverviewMap} from './OverviewMap';
import {Player} from './utils/Player';
import {Configuration} from './utils/Configuration';
import {Raycaster} from "./utils/Raycaster";

export class Game {
    canvas: HTMLCanvasElement;
    wallMatrix: number[][];
    overviewMap: OverviewMap;
    player: Player;
    camera: Camera;
    config: Configuration;

    constructor(canvas: HTMLCanvasElement, wallMatrix: number[][], overviewMap: OverviewMap, player: Player, config: Configuration) {
        this.canvas = canvas;
        this.wallMatrix = wallMatrix;
        this.overviewMap = overviewMap;
        this.player = player;
        this.camera = new Camera();
        this.config = config;

        this.resize();
    }

    onClick(event: MouseEvent) {
        const bounds = this.canvas.getBoundingClientRect();
        const relativeX = event.clientX - bounds.left; //x position within the element.
        const relativeY = event.clientY - bounds.top;  //y position within the element.

        const index = this.overviewMap.atCanvasXY(relativeX, relativeY);
        if (index) {
            this.wallMatrix[index.y][index.x] = (this.wallMatrix[index.y][index.x] + 1) % 2;
            this.render();
        }
    }

    rotatePlayer(deltaAngle: number) {
        this.player.angle += deltaAngle;
        this.player.angle %= Math.PI * 2.0;
        this.overviewMap.setPlayer(this.player.gridX, this.player.gridY, this.player.angle);
    }

    forwardPlayer(distance: number) {
        // Perform collision detection
        const hit = Raycaster.cast(this.wallMatrix, this.player.gridX, this.player.gridY, this.player.angle);
        if (hit && hit.euclideanDistance < distance) {
            distance = hit.euclideanDistance;
        }
        this.player.gridX += Math.cos(this.player.angle) * distance;
        this.player.gridY += Math.sin(this.player.angle) * distance;
        this.overviewMap.setPlayer(this.player.gridX, this.player.gridY, this.player.angle);
    }

    setConfig(config: Configuration) {
        this.config = config;
    }

    resize() {
        this.overviewMap.resizeGrid(this.canvas);
        this.overviewMap.setPlayer(this.player.gridX, this.player.gridY, this.player.angle);

    }

    render() {
        const ctx = this.canvas.getContext('2d')!;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const rays = Raycaster.sweep(this.wallMatrix, this.player, this.canvas.width);

        this.overviewMap.render(this.canvas, this.wallMatrix, rays, this.config);
        this.camera.render(this.canvas, this.player, this.wallMatrix, this.config);
    }
}
