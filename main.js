import { GameController } from './app/GameController.js';
import { StateRepository } from './storage/StateRepository.js';
import { LeaderboardRepository } from './storage/LeaderboardRepository.js';
import { GameEngine } from './core/GameEngine.js';
import { ScoreManager } from './core/ScoreManager.js';
import { BoardView } from './ui/BoardView.js';
import { DialogManager } from './ui/DialogManager.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { StyleManager } from './ui/StyleManager.js';
import { GestureController } from './ui/GestureController.js';

const styleManager = new StyleManager();
styleManager.inject();

// Заголовок страницы генерируем динамически, чтобы файл index.html оставался минимальным.
document.title = '2048';

// Инициализируем вспомогательные объекты.
const stateRepository = new StateRepository(window.localStorage);
const leaderboardRepository = new LeaderboardRepository(window.localStorage);
const scoreManager = new ScoreManager();
const engine = new GameEngine(scoreManager);
const boardView = new BoardView(document);
const dialogManager = new DialogManager(document);
const controlPanel = new ControlPanel(document);
const gestureController = new GestureController(boardView.getBoardElement());

// Основной контроллер получает ссылки на все модули и связывает их между собой.
const controller = new GameController({
    engine,
    scoreManager,
    boardView,
    dialogManager,
    controlPanel,
    gestureController,
    stateRepository,
    leaderboardRepository,
    storageKey: 'game-2048-state',
    leaderboardKey: 'game-2048-leaderboard'
});

// Запускаем игру.
controller.initialize();
