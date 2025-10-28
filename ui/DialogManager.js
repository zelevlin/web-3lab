export class DialogManager {
    constructor(documentRef) {
        this.document = documentRef;
        this.overlay = this.document.createElement('div');
        this.overlay.className = 'dialog-overlay';
        this.gameOverDialog = null;
        this.leaderboardDialog = null;
        this.saveButton = null;
        this.nameInput = null;
        this.messageNode = null;
        this.scoreNode = null;
        this.resetButton = null;
        this.closeLeaderboardButton = null;
        this.leaderboardTableBody = null;
        this.leaderboardEmptyNode = null;
        this.saveCallbacks = [];
        this.restartCallbacks = [];
        this.closeCallbacks = [];
        this.initialize();
    }

    initialize() {
        this.gameOverDialog = this.createGameOverDialog();
        this.leaderboardDialog = this.createLeaderboardDialog();
        this.overlay.appendChild(this.gameOverDialog);
        this.overlay.appendChild(this.leaderboardDialog);
        this.document.body.appendChild(this.overlay);
    }

    createGameOverDialog() {
        const dialog = this.document.createElement('div');
        dialog.className = 'dialog';

        const title = this.document.createElement('h2');
        title.className = 'dialog__title';
        title.textContent = 'Игра окончена';

        this.messageNode = this.document.createElement('p');
        this.messageNode.className = 'dialog__message';
        this.messageNode.textContent = 'Вы можете сохранить результат и начать заново.';

        this.scoreNode = this.document.createElement('p');
        this.scoreNode.className = 'dialog__message';

        this.nameInput = this.document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = 'Введите имя';
        this.nameInput.className = 'dialog__input';
        this.nameInput.addEventListener('input', () => {
            this.updateSaveButtonState();
        });

        this.saveButton = this.document.createElement('button');
        this.saveButton.type = 'button';
        this.saveButton.className = 'dialog__button';
        this.saveButton.textContent = 'Сохранить результат';
        this.saveButton.disabled = true;
        this.saveButton.addEventListener('click', () => {
            const name = this.nameInput.value.trim();
            if (name.length === 0) {
                return;
            }
            this.emitSave(name);
        });

        this.resetButton = this.document.createElement('button');
        this.resetButton.type = 'button';
        this.resetButton.className = 'dialog__button';
        this.resetButton.textContent = 'Начать заново';
        this.resetButton.addEventListener('click', () => {
            this.emitRestart();
        });

        const actions = this.document.createElement('div');
        actions.className = 'dialog__actions';
        actions.appendChild(this.saveButton);
        actions.appendChild(this.resetButton);

        dialog.appendChild(title);
        dialog.appendChild(this.messageNode);
        dialog.appendChild(this.scoreNode);
        dialog.appendChild(this.nameInput);
        dialog.appendChild(actions);

        return dialog;
    }

    createLeaderboardDialog() {
        const dialog = this.document.createElement('div');
        dialog.className = 'dialog';

        const title = this.document.createElement('h2');
        title.className = 'dialog__title';
        title.textContent = 'Таблица лидеров';

        const table = this.document.createElement('table');
        table.className = 'dialog__table';
        const header = this.document.createElement('thead');
        const headerRow = this.document.createElement('tr');
        const nameHeader = this.document.createElement('th');
        nameHeader.textContent = 'Имя';
        const scoreHeader = this.document.createElement('th');
        scoreHeader.textContent = 'Очки';
        const dateHeader = this.document.createElement('th');
        dateHeader.textContent = 'Дата';
        headerRow.appendChild(nameHeader);
        headerRow.appendChild(scoreHeader);
        headerRow.appendChild(dateHeader);
        header.appendChild(headerRow);
        table.appendChild(header);

        const body = this.document.createElement('tbody');
        table.appendChild(body);
        this.leaderboardTableBody = body;

        this.leaderboardEmptyNode = this.document.createElement('p');
        this.leaderboardEmptyNode.className = 'dialog__empty';
        this.leaderboardEmptyNode.textContent = 'Пока нет сохранённых результатов.';

        this.closeLeaderboardButton = this.document.createElement('button');
        this.closeLeaderboardButton.type = 'button';
        this.closeLeaderboardButton.className = 'dialog__button';
        this.closeLeaderboardButton.textContent = 'Закрыть';
        this.closeLeaderboardButton.addEventListener('click', () => {
            this.hide();
            this.emitClose();
        });

        const actions = this.document.createElement('div');
        actions.className = 'dialog__actions';
        actions.appendChild(this.closeLeaderboardButton);

        dialog.appendChild(title);
        dialog.appendChild(table);
        dialog.appendChild(this.leaderboardEmptyNode);
        dialog.appendChild(actions);

        return dialog;
    }

    onSave(callback) {
        this.saveCallbacks.push(callback);
    }

    onRestart(callback) {
        this.restartCallbacks.push(callback);
    }

    onClose(callback) {
        this.closeCallbacks.push(callback);
    }

    emitSave(name) {
        for (let index = 0; index < this.saveCallbacks.length; index += 1) {
            this.saveCallbacks[index](name);
        }
    }

    emitRestart() {
        for (let index = 0; index < this.restartCallbacks.length; index += 1) {
            this.restartCallbacks[index]();
        }
    }

    emitClose() {
        for (let index = 0; index < this.closeCallbacks.length; index += 1) {
            this.closeCallbacks[index]();
        }
    }

    showGameOver(score) {
        this.overlay.classList.add('dialog-overlay--visible');
        this.showDialog(this.gameOverDialog);
        this.hideDialog(this.leaderboardDialog);
        this.messageNode.textContent = 'Вы можете сохранить результат и начать новую попытку.';
        this.scoreNode.textContent = `Ваш счёт: ${score}`;
        this.nameInput.value = '';
        this.nameInput.style.display = '';
        this.saveButton.style.display = '';
        this.saveButton.disabled = true;
        this.nameInput.disabled = false;
        this.nameInput.focus();
    }

    confirmRecordSaved() {
        this.messageNode.textContent = 'Ваш рекорд сохранён.';
        this.nameInput.style.display = 'none';
        this.saveButton.style.display = 'none';
    }

    showLeaderboard(records) {
        this.overlay.classList.add('dialog-overlay--visible');
        this.showDialog(this.leaderboardDialog);
        this.hideDialog(this.gameOverDialog);
        this.renderLeaderboard(records);
    }

    renderLeaderboard(records) {
        this.leaderboardTableBody.textContent = '';
        if (!records || records.length === 0) {
            this.leaderboardEmptyNode.style.display = '';
            return;
        }
        this.leaderboardEmptyNode.style.display = 'none';
        for (let index = 0; index < records.length; index += 1) {
            const record = records[index];
            const row = this.document.createElement('tr');

            const nameCell = this.document.createElement('td');
            nameCell.textContent = record.name;

            const scoreCell = this.document.createElement('td');
            scoreCell.textContent = String(record.score);

            const dateCell = this.document.createElement('td');
            const date = new Date(record.date);
            dateCell.textContent = date.toLocaleDateString();

            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);
            this.leaderboardTableBody.appendChild(row);
        }
    }

    hide() {
        this.overlay.classList.remove('dialog-overlay--visible');
        this.hideDialog(this.gameOverDialog);
        this.hideDialog(this.leaderboardDialog);
    }

    showDialog(dialog) {
        dialog.classList.add('dialog--visible');
    }

    hideDialog(dialog) {
        dialog.classList.remove('dialog--visible');
    }

    updateSaveButtonState() {
        const value = this.nameInput.value.trim();
        this.saveButton.disabled = value.length === 0;
    }
}
