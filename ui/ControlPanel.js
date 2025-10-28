export class ControlPanel {
    constructor(documentRef) {
        this.document = documentRef;
        this.root = this.document.createElement('section');
        this.root.className = 'control-panel';
        this.actionsContainer = null;
        this.newGameButton = null;
        this.undoButton = null;
        this.leaderboardButton = null;
        this.newGameCallbacks = [];
        this.undoCallbacks = [];
        this.leaderboardCallbacks = [];
        this.createLayout();
    }

    createLayout() {
        this.actionsContainer = this.document.createElement('div');
        this.actionsContainer.className = 'control-panel__actions';

        this.newGameButton = this.buildActionButton('Начать заново');
        this.newGameButton.addEventListener('click', () => {
            this.emitCallbacks(this.newGameCallbacks);
        });

        this.undoButton = this.buildActionButton('Отмена хода');
        this.undoButton.addEventListener('click', () => {
            if (this.undoButton.disabled) {
                return;
            }
            this.emitCallbacks(this.undoCallbacks);
        });

        this.leaderboardButton = this.buildActionButton('Лидеры');
        this.leaderboardButton.addEventListener('click', () => {
            this.emitCallbacks(this.leaderboardCallbacks);
        });

        this.actionsContainer.appendChild(this.newGameButton);
        this.actionsContainer.appendChild(this.undoButton);
        this.actionsContainer.appendChild(this.leaderboardButton);

        this.root.appendChild(this.actionsContainer);
    }

    buildActionButton(label) {
        const button = this.document.createElement('button');
        button.type = 'button';
        button.className = 'control-panel__button';
        button.textContent = label;
        return button;
    }

    attach(parent) {
        // Добавляем панель в корневой элемент, когда контроллер инициализируется.
        parent.appendChild(this.root);
    }

    onNewGame(callback) {
        this.newGameCallbacks.push(callback);
    }

    onUndo(callback) {
        this.undoCallbacks.push(callback);
    }

    onLeaderboard(callback) {
        this.leaderboardCallbacks.push(callback);
    }

    emitCallbacks(callbacks) {
        for (let index = 0; index < callbacks.length; index += 1) {
            callbacks[index]();
        }
    }

    setUndoEnabled(isEnabled) {
        this.undoButton.disabled = !isEnabled;
    }

    setHidden(hidden) {
        if (hidden) {
            this.root.setAttribute('data-hidden', 'true');
        } else {
            this.root.removeAttribute('data-hidden');
        }
    }
}
