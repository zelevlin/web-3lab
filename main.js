import { GameController } from './app/GameController.js';
import { StateRepository } from './storage/StateRepository.js';
import { LeaderboardRepository } from './storage/LeaderboardRepository.js';
import { GameEngine } from './core/GameEngine.js';
import { ScoreManager } from './core/ScoreManager.js';
import { BoardView } from './ui/BoardView.js';
import { DialogManager } from './ui/DialogManager.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { StyleManager } from './ui/StyleManager.js';

const styleManager = new StyleManager();
styleManager.inject();

const stateRepository = new StateRepository(window.localStorage);
const leaderboardRepository = new LeaderboardRepository(window.localStorage);
const scoreManager = new ScoreManager();
const engine = new GameEngine(scoreManager);
const boardView = new BoardView(document);
const dialogManager = new DialogManager(document);
const controlPanel = new ControlPanel(document);

const controller = new GameController({
    engine,
    scoreManager,
    boardView,
    dialogManager,
    controlPanel,
    stateRepository,
    leaderboardRepository,
    storageKey: 'game-2048-state',
    leaderboardKey: 'game-2048-leaderboard'
});

controller.initialize();
