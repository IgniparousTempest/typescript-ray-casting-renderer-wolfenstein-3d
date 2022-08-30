import {Vector2d} from './Vector2d';
import {PLAYER_FOV} from "./constants";
import {Player} from './Player';

export interface RaycastHit {
    hitPosition: Vector2d;
    tileX: number;
    tileY: number;
    tileValue: number;
    euclideanDistance: number;
    perpendicularDistance: number;
}

export class Raycaster {
    static cast(wallMatrix: number[][], startGridX: number, startGridY: number, rayAngle: number): RaycastHit | null {
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
            } else {
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
                    hitPosition: new Vector2d(curX, curY),
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

    static * sweep(wallMatrix: number[][], player: Player, screenWidth: number): Generator<RaycastHit | null> {
        const leftAngle = player.angle - PLAYER_FOV / 2.0;
        const anglePerPixel = PLAYER_FOV / screenWidth;

        for (let x = 0; x < screenWidth; x++) {
            const result = Raycaster.cast(wallMatrix, player.gridX, player.gridY, leftAngle + anglePerPixel * x);
            yield result;
        }
    }
}
