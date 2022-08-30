declare module "utils/Vector2d" {
    export class Vector2d {
        x: number;
        y: number;
        constructor(x: number, y: number);
    }
}
declare module "utils/constants" {
    export const PLAYER_FOV: number;
}
declare module "utils/Player" {
    export class Player {
        gridX: number;
        gridY: number;
        angle: number;
        constructor(x: number, y: number, angle: number);
    }
}
declare module "utils/Raycaster" {
    import { Vector2d } from "utils/Vector2d";
    import { Player } from "utils/Player";
    export interface RaycastHit {
        hitPosition: Vector2d;
        tileX: number;
        tileY: number;
        tileValue: number;
        euclideanDistance: number;
        perpendicularDistance: number;
    }
    export class Raycaster {
        static cast(wallMatrix: number[][], startGridX: number, startGridY: number, rayAngle: number): RaycastHit | null;
        static sweep(wallMatrix: number[][], player: Player, screenWidth: number): Generator<RaycastHit | null>;
    }
}
declare module "utils/Configuration" {
    export type RendererTypes = 'solid' | 'shaded' | 'textured';
    export interface Configuration {
        showMapCoordinates: boolean;
        selectedRenderer: RendererTypes;
    }
}
declare module "Camera" {
    import { Player } from "utils/Player";
    import { Configuration } from "utils/Configuration";
    export class Camera {
        textures: {
            wall1: ImageData | null;
            wall2: ImageData | null;
        };
        constructor();
        renderBackground(canvas: HTMLCanvasElement): void;
        render2dColour(canvas: HTMLCanvasElement, player: Player, wallMatrix: number[][]): void;
        render2dColourShaded(canvas: HTMLCanvasElement, player: Player, wallMatrix: number[][]): void;
        render2dTextured(canvas: HTMLCanvasElement, player: Player, wallMatrix: number[][]): void;
        render(canvas: HTMLCanvasElement, player: Player, wallMatrix: number[][], configuration: Configuration): void;
    }
}
declare module "utils/Pair" {
    export class Pair<T> {
        first: T;
        second: T;
        constructor(first: T, second: T);
    }
}
declare module "utils/Rect" {
    export class Rect {
        x: number;
        y: number;
        width: number;
        height: number;
        constructor(x: number, y: number, width: number, height: number);
        includes(x: number, y: number): boolean;
    }
}
declare module "OverviewMap" {
    import { Rect } from "utils/Rect";
    import { Vector2d } from "utils/Vector2d";
    import { Configuration } from "utils/Configuration";
    import { RaycastHit } from "utils/Raycaster";
    export class OverviewMap {
        private constants;
        private readonly cells;
        private readonly gridLinesRows;
        private readonly gridLinesColumns;
        readonly columns: number;
        readonly rows: number;
        readonly player: {
            pos: Vector2d;
            angle: number;
        };
        constructor(columns: number, rows: number);
        resizeGrid(canvas: HTMLCanvasElement): void;
        atXY(cellX: number, cellY: number): Rect;
        atCanvasXY(canvasX: number, canvasY: number): Vector2d | null;
        render(canvas: HTMLCanvasElement, wallMatrix: number[][], rays: Generator<RaycastHit | null>, configuration: Configuration): void;
        setPlayer(cellX: number, cellY: number, angle: number): void;
    }
}
declare module "Game" {
    import { Camera } from "Camera";
    import { OverviewMap } from "OverviewMap";
    import { Player } from "utils/Player";
    import { Configuration } from "utils/Configuration";
    export class Game {
        canvas: HTMLCanvasElement;
        wallMatrix: number[][];
        overviewMap: OverviewMap;
        player: Player;
        camera: Camera;
        config: Configuration;
        constructor(canvas: HTMLCanvasElement, wallMatrix: number[][], overviewMap: OverviewMap, player: Player, config: Configuration);
        onClick(event: MouseEvent): void;
        rotatePlayer(deltaAngle: number): void;
        forwardPlayer(distance: number): void;
        setConfig(config: Configuration): void;
        resize(): void;
        render(): void;
    }
}
declare module "main" {
    import { Configuration } from "utils/Configuration";
    export function main(canvas: HTMLCanvasElement, config: HTMLHtmlElement, getConfig: () => Configuration): void;
}
