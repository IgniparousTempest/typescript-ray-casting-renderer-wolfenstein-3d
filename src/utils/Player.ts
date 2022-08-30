import {Vector2d} from './Vector2d';

export class Player {
    gridX: number
    gridY: number
    angle: number

    constructor(x: number, y: number, angle: number) {
        this.gridX = x;
        this.gridY = y;
        this.angle = angle;
    }
}
