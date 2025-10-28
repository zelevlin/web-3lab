export class GameController {
    constructor({
        engine,
        scoreManager,
        boardView,
        dialogManager,
        controlPanel,
        stateRepository,
        leaderboardRepository,
        storageKey,
        leaderboardKey
    }) {
        this.engine = engine;
        this.scoreManager = scoreManager;
        this.boardView = boardView;
        this.dialogManager = dialogManager;
        this.controlPanel = controlPanel;
        this.stateRepository = stateRepository;
        this.leaderboardRepository = leaderboardRepository;
        this.storageKey = storageKey;
        this.leaderboardKey = leaderboardKey;
        this.isOverlayVisible = false;
        this.isRecordSaved = false;
        this.keyboardHandler = (event) => {
            this.handleKeydown(event);
        };
    }

    initialize() {
        this.controlPanel.attach(this.boardView.root);
        this.registerControlPanelHandlers();
        this.registerDialogHandlers();
        this.registerKeyboardHandlers();
        this.restoreState();
    }

    registerControlPanelHandlers() {
        this.controlPanel.onNewGame(() => {
            this.startNewGame();
        });
        this.controlPanel.onUndo(() => {
            this.performUndo();
        });
        this.controlPanel.onLeaderboard(() => {
            this.showLeaderboard();
        });
        this.controlPanel.onDirection((direction) => {
            this.handleMove(direction);
        });
    }

    registerDialogHandlers() {
        this.dialogManager.onSave((name) => {
            this.saveRecord(name);
        });
        this.dialogManager.onRestart(() => {
            this.dialogManager.hide();
            this.isOverlayVisible = false;
            this.controlPanel.setHidden(false);
            this.startNewGame();
        });
        this.dialogManager.onClose(() => {
            this.isOverlayVisible = false;
            this.controlPanel.setHidden(false);
        });
    }

    registerKeyboardHandlers() {
        window.addEventListener('keydown', this.keyboardHandler);
    }

    restoreState() {
        const state = this.stateRepository.loadState(this.storageKey);
        if (!state) {
            const snapshot = this.engine.startNewGame();
            this.boardView.render(snapshot);
            this.controlPanel.setUndoEnabled(false);
            this.dialogManager.hide();
            this.controlPanel.setHidden(false);
            this.isOverlayVisible = false;
            this.saveState();
            return;
        }
        this.isRecordSaved = Boolean(state.isRecordSaved);
        this.engine.restore(state.engine);
        const snapshot = this.engine.getSnapshot();
        this.boardView.render(snapshot);
        const undoAvailable = this.engine.history && this.engine.history.length > 0 && snapshot.status !== 'over';
        this.controlPanel.setUndoEnabled(Boolean(undoAvailable));
        if (snapshot.status === 'over') {
            this.showGameOver(snapshot.score.current, true);
        } else {
            this.dialogManager.hide();
            this.controlPanel.setHidden(false);
            this.isOverlayVisible = false;
        }
    }

    startNewGame() {
        this.isRecordSaved = false;
        this.dialogManager.hide();
        const snapshot = this.engine.startNewGame();
        this.boardView.render(snapshot);
        this.controlPanel.setUndoEnabled(false);
        this.controlPanel.setHidden(false);
        this.isOverlayVisible = false;
        this.saveState();
    }

    handleKeydown(event) {
        if (this.isOverlayVisible) {
            return;
        }
        const keyMap = {
            ArrowUp: 'up',
            ArrowRight: 'right',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            w: 'up',
            d: 'right',
            s: 'down',
            a: 'left'
        };
        const direction = keyMap[event.key];
        if (!direction) {
            return;
        }
        event.preventDefault();
        this.handleMove(direction);
    }

    handleMove(direction) {
        if (this.isOverlayVisible) {
            return;
        }
        const result = this.engine.move(direction);
        if (!result || !result.moved) {
            return;
        }
        const snapshot = this.engine.getSnapshot();
        this.boardView.render(snapshot);
        this.controlPanel.setUndoEnabled(this.engine.history.length > 0 && snapshot.status !== 'over');
        if (snapshot.status === 'over') {
            this.showGameOver(snapshot.score.current, this.isRecordSaved);
        }
        this.saveState();
    }

    performUndo() {
        if (this.isOverlayVisible) {
            return;
        }
        const snapshot = this.engine.undo();
        if (!snapshot) {
            return;
        }
        this.boardView.render(snapshot);
        this.controlPanel.setUndoEnabled(this.engine.history.length > 0 && snapshot.status !== 'over');
        this.saveState();
    }

    showGameOver(score, recordAlreadySaved) {
        this.isOverlayVisible = true;
        this.controlPanel.setHidden(true);
        this.dialogManager.showGameOver(score);
        if (recordAlreadySaved) {
            this.dialogManager.confirmRecordSaved();
        }
    }

    showLeaderboard() {
        this.isOverlayVisible = true;
        this.controlPanel.setHidden(true);
        const records = this.leaderboardRepository.getRecords(this.leaderboardKey);
        this.dialogManager.showLeaderboard(records);
    }

    saveRecord(name) {
        if (this.isRecordSaved) {
            return;
        }
        const snapshot = this.engine.getSnapshot();
        const record = {
            name,
            score: snapshot.score.current,
            date: new Date().toISOString()
        };
        this.leaderboardRepository.addRecord(this.leaderboardKey, record);
        this.isRecordSaved = true;
        this.dialogManager.confirmRecordSaved();
        this.saveState();
    }

    saveState() {
        const state = {
            engine: this.engine.serialize(),
            isRecordSaved: this.isRecordSaved
        };
        this.stateRepository.saveState(this.storageKey, state);
    }
}
