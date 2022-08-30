import {Raycaster} from './utils/Raycaster';
import {Player} from './utils/Player';
import {Configuration} from './utils/Configuration';

type Colour = {r: number, g: number, b: number};

function hexToRbg(c: string): Colour {
    const r = parseInt(c.substring(1, 3), 16);
    const g = parseInt(c.substring(3, 5), 16);
    const b = parseInt(c.substring(5), 16);
    return {r: r, g: g, b: b};
}

function colourInterpolate(c1: Colour, c2: Colour, p: number) {
    const r = Math.min(c1.r, c2.r) + (Math.max(c1.r, c2.r) - Math.min(c1.r, c2.r)) * p;
    const g = Math.min(c1.g, c2.g) + (Math.max(c1.g, c2.g) - Math.min(c1.g, c2.g)) * p;
    const b = Math.min(c1.b, c2.b) + (Math.max(c1.b, c2.b) - Math.min(c1.b, c2.b)) * p;

    return `rgba(${r}, ${g}, ${b}, 1)`;
}

async function getImage(path: string) {
    const response = await fetch(path);
    const fileBlob = await response.blob();
    const bitmap = await createImageBitmap(fileBlob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

export class Camera {
    textures: {
        wall1: ImageData | null,
        wall2: ImageData | null,
    };
    constructor() {
        this.textures = {
            wall1: null,
            wall2: null
        };
        getImage('./wall.png').then(value => this.textures.wall1 = value);
        getImage('./wall2.png').then(value => this.textures.wall2 = value);
    }

    renderBackground(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;

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

    render2dColour(canvas: HTMLCanvasElement, player: Player, wallMatrix: number[][]) {
        const ctx = canvas.getContext('2d')!;

        const width = canvas.width;
        const height = canvas.height / 2;
        ctx.beginPath();
        ctx.strokeStyle = '#707070';
        let x = 0;
        for (let collision of Raycaster.sweep(wallMatrix, player, width)) {
            if (collision) {
                const lineHeight = Math.round(height / collision.euclideanDistance);

                ctx.moveTo(x, Math.max(0, height / 2 - lineHeight / 2));
                ctx.lineTo(x, Math.min(height, height / 2 + lineHeight / 2));
            }
            x++;
        }
        ctx.stroke();
    }

    render2dColourShaded(canvas: HTMLCanvasElement, player: Player, wallMatrix: number[][]) {
        this.renderBackground(canvas);

        const ctx = canvas.getContext('2d')!;

        const width = canvas.width;
        const height = canvas.height / 2;
        const foreground = hexToRbg('#c2c2c2');
        const background = hexToRbg('#000000');
        let x = 0;
        for (let collision of Raycaster.sweep(wallMatrix, player, width)) {
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

    render2dTextured(canvas: HTMLCanvasElement, player: Player, wallMatrix: number[][]) {
        this.renderBackground(canvas);

        const ctx = canvas.getContext('2d')!;

        const width = canvas.width;
        const height = canvas.height / 2;
        let x = 0;
        for (let collision of Raycaster.sweep(wallMatrix, player, width)) {
            if (collision) {

                const lineHeight = Math.round(height / collision.euclideanDistance);
                const texture = this.textures.wall2;
                if (texture === null) return;
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

    render(canvas: HTMLCanvasElement, player: Player, wallMatrix: number[][], configuration: Configuration) {
        if (configuration.selectedRenderer === 'solid')
            this.render2dColour(canvas, player, wallMatrix);
        else if (configuration.selectedRenderer === 'shaded')
            this.render2dColourShaded(canvas, player, wallMatrix);
        else
            this.render2dTextured(canvas, player, wallMatrix);
    }
}
