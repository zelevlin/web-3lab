export class GameController {
    constructor({
        engine,
        scoreManager,
        boardView,
        dialogManager,
        controlPanel,
        stateRepository,
        gestureController,
        leaderboardRepository,
        storageKey,
        leaderboardKey
    }) {
        // Игровой движок содержит бизнес-логику перемещений и слияний.
        this.engine = engine;
        // ScoreManager отвечает за подсчёт текущего и лучшего счёта.
        this.scoreManager = scoreManager;
        // BoardView занимается визуализацией состояния в DOM.
        this.boardView = boardView;
        // DialogManager управляет модальными окнами окончания игры и таблицы лидеров.
        this.dialogManager = dialogManager;
        // ControlPanel предоставляет кнопки управления.
        this.controlPanel = controlPanel;
        // GestureController реагирует на свайпы, если доступен (десктопу он не нужен).
        this.gestureController = gestureController || null;
        // Репозиторий состояния инкапсулирует работу с localStorage.
        this.stateRepository = stateRepository;
        // Репозиторий лидеров хранит и сортирует результаты.
        this.leaderboardRepository = leaderboardRepository;
        this.storageKey = storageKey;
        this.leaderboardKey = leaderboardKey;
        this.isOverlayVisible = false;
        this.isRecordSaved = false;
        // Привязываем обработчик клавиатуры к экземпляру, чтобы позже удалить слушатель.
        this.keyboardHandler = (event) => {
            this.handleKeydown(event);
        };
    }

    initialize() {
        // Панель управления крепим к корневому узлу BoardView.
        this.controlPanel.attach(this.boardView.root);
        this.registerControlPanelHandlers();
        this.registerDialogHandlers();
        this.registerKeyboardHandlers();
        this.registerGestureHandlers();
        this.restoreState();
    }

    registerControlPanelHandlers() {
        // Переназначаем кнопки панели на методы контроллера.
        this.controlPanel.onNewGame(() => {
            this.startNewGame();
        });
        this.controlPanel.onUndo(() => {
            this.performUndo();
        });
        this.controlPanel.onLeaderboard(() => {
            this.showLeaderboard();
        });
    }

    registerDialogHandlers() {
        // Диалог сохранения результата триггерит вызовы репозитория.
        this.dialogManager.onSave((name) => {
            this.saveRecord(name);
        });
        this.dialogManager.onRestart(() => {
            this.dialogManager.hide();
            this.isOverlayVisible = false;
            this.controlPanel.setHidden(false);
            if (this.gestureController) {
                this.gestureController.setEnabled(true);
            }
            this.startNewGame();
        });
        this.dialogManager.onClose(() => {
            this.isOverlayVisible = false;
            this.controlPanel.setHidden(false);
            if (this.gestureController) {
                this.gestureController.setEnabled(true);
            }
        });
    }

    registerKeyboardHandlers() {
        window.addEventListener('keydown', this.keyboardHandler);
    }

    registerGestureHandlers() {
        if (!this.gestureController) {
            return;
        }
        // Жесты обрабатывают только направления, сами координаты игре не нужны.
        this.gestureController.onDirection((direction) => {
            this.handleMove(direction);
        });
    }

    restoreState() {
        // При старте пытаемся восстановить сохранённую игру.
        const state = this.stateRepository.loadState(this.storageKey);
        if (!state) {
            // Нет сохранений — создаём новую игру.
            const snapshot = this.engine.startNewGame();
            this.boardView.render(snapshot);
            this.controlPanel.setUndoEnabled(false);
            this.dialogManager.hide();
            this.controlPanel.setHidden(false);
            this.isOverlayVisible = false;
            if (this.gestureController) {
                this.gestureController.setEnabled(true);
            }
            this.saveState();
            return;
        }
        this.isRecordSaved = Boolean(state.isRecordSaved);
        this.engine.restore(state.engine);
        // После восстановления рендерим снимок и приводим интерфейс в актуальное состояние.
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
            if (this.gestureController) {
                this.gestureController.setEnabled(true);
            }
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
        if (this.gestureController) {
            this.gestureController.setEnabled(true);
        }
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
            // Пока открыто модальное окно, ходить нельзя.
            return;
        }
        // Просим движок выполнить ход и проверяем, были ли изменения.
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
        // Undo берёт предыдущее состояние из стека истории.
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
        if (this.gestureController) {
            this.gestureController.setEnabled(false);
        }
        // Показываем диалог и, если рекорд уже сохранён, прячем поле ввода.
        this.dialogManager.showGameOver(score);
        if (recordAlreadySaved) {
            this.dialogManager.confirmRecordSaved();
        }
    }

    showLeaderboard() {
        this.isOverlayVisible = true;
        this.controlPanel.setHidden(true);
        if (this.gestureController) {
            this.gestureController.setEnabled(false);
        }
        // Берём отсортированный список и передаём во view.
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
        // Сохраняем сериализованное состояние в localStorage.
        const state = {
            engine: this.engine.serialize(),
            isRecordSaved: this.isRecordSaved
        };
        this.stateRepository.saveState(this.storageKey, state);
    }
}
