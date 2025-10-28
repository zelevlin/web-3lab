export class ControlPanel {
    constructor(documentRef) {
        this.document = documentRef;
        this.root = this.document.createElement('section');
        this.root.className = 'control-panel';
        this.actionsContainer = null;
        this.mobileContainer = null;
        this.newGameButton = null;
        this.undoButton = null;
        this.leaderboardButton = null;
        this.directionCallbacks = [];
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

        this.mobileContainer = this.document.createElement('div');
        this.mobileContainer.className = 'control-panel__mobile';
        this.createDirectionButton('↑', 'up', 'control-panel__mobile-button--up');
        this.createDirectionButton('←', 'left', 'control-panel__mobile-button--left');
        this.createDirectionButton('↓', 'down', 'control-panel__mobile-button--down');
        this.createDirectionButton('→', 'right', 'control-panel__mobile-button--right');

        this.root.appendChild(this.actionsContainer);
        this.root.appendChild(this.mobileContainer);
    }

    buildActionButton(label) {
        const button = this.document.createElement('button');
        button.type = 'button';
        button.className = 'control-panel__button';
        button.textContent = label;
        return button;
    }

    createDirectionButton(label, direction, modifierClass) {
        const button = this.document.createElement('button');
        button.type = 'button';
        button.className = `control-panel__mobile-button ${modifierClass}`;
        button.textContent = label;
        button.dataset.direction = direction;
        button.addEventListener('click', () => {
            this.emitDirection(direction);
        });
        this.mobileContainer.appendChild(button);
    }

    attach(parent) {
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

    onDirection(callback) {
        this.directionCallbacks.push(callback);
    }

    emitDirection(direction) {
        for (let index = 0; index < this.directionCallbacks.length; index += 1) {
            const callback = this.directionCallbacks[index];
            callback(direction);
        }
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
