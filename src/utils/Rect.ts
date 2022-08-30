export class Rect {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    includes(x: number, y: number) {
        return x >= this.x && x <= this.x + this.width
            && y >= this.y && y <= this.y + this.height;
    }
}
