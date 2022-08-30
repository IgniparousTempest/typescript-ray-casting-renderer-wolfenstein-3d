import {Game} from './Game';
import {OverviewMap} from './OverviewMap';
import {Player} from './utils/Player';
import {Configuration, RendererTypes} from './utils/Configuration';

let game: Game | null = null;

export function main(canvas: HTMLCanvasElement, config: HTMLHtmlElement, getConfig: () => Configuration) {
    const ROWS = 10;
    const COLUMNS = 10;

    if (!game) {
        const overviewMap = new OverviewMap(COLUMNS, ROWS);

        // Set the initial Game Map
        const _ = 0
        const X = 1
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

        const player = new Player(2.5, 3.5, Math.PI / 4.0);
        game = new Game(canvas, wallMatrix, overviewMap, player, getConfig());
    }

    game.render();

    // Add event listeners
    config.addEventListener('change', (event) => configOnChange(event, getConfig()), false);
    canvas.addEventListener('click', game.onClick.bind(game), false);
    window.addEventListener('keydown', canvasOnKeyDown, false);
}

function configOnChange(event: Event, config: Configuration) {
    game?.setConfig(config);
    game?.render();
}

function canvasOnKeyDown(event: KeyboardEvent) {
    switch (event.key) {
        case 'w':
            game?.forwardPlayer(0.25);
            break;
        case 's':
            game?.forwardPlayer(-0.25);
            break;
        case 'a':
        case 'q':
            game?.rotatePlayer(-Math.PI / 10);
            break;
        case 'd':
        case 'e':
            game?.rotatePlayer(Math.PI / 10);
            break;
        default:
            return;
    }
    game?.render();
}
