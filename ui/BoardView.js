const TILE_COLORS = {
    2: '#eee4da',
    4: '#ede0c8',
    8: '#f2b179',
    16: '#f59563',
    32: '#f67c5f',
    64: '#f65e3b',
    128: '#edcf72',
    256: '#edcc61',
    512: '#edc850',
    1024: '#edc53f',
    2048: '#edc22e'
};

export class BoardView {
    constructor(documentRef) {
        this.document = documentRef;
        this.root = this.document.createElement('main');
        this.headerTitle = null;
        this.scoreValue = null;
        this.bestValue = null;
        this.boardElement = null;
        this.gridLayer = null;
        this.tileLayer = null;
        this.tileElements = {};
        this.metrics = {
            gap: 12,
            tileSize: 0
        };
        this.size = 4;
        this.createLayout();
        window.addEventListener('resize', () => {
            this.refreshMetrics();
            this.refreshTilePositions();
        });
    }

    createLayout() {
        this.root.className = 'game-root';

        const header = this.document.createElement('header');
        header.className = 'game-header';

        this.headerTitle = this.document.createElement('h1');
        this.headerTitle.className = 'game-title';
        this.headerTitle.textContent = '2048';
        header.appendChild(this.headerTitle);

        const scorePanel = this.createScorePanel();

        const boardWrapper = this.document.createElement('section');
        boardWrapper.className = 'board-wrapper';

        this.boardElement = this.document.createElement('div');
        this.boardElement.className = 'board';
        this.gridLayer = this.document.createElement('div');
        this.gridLayer.className = 'board-grid';
        this.tileLayer = this.document.createElement('div');
        this.tileLayer.className = 'tile-layer';

        this.boardElement.appendChild(this.gridLayer);
        this.boardElement.appendChild(this.tileLayer);
        boardWrapper.appendChild(this.boardElement);

        this.root.appendChild(header);
        this.root.appendChild(scorePanel);
        this.root.appendChild(boardWrapper);

        this.document.body.appendChild(this.root);
        this.refreshMetrics();
        this.renderGridBackground(this.size);
    }

    createScorePanel() {
        const panel = this.document.createElement('section');
        panel.className = 'score-panel';

        const currentScoreBox = this.document.createElement('div');
        currentScoreBox.className = 'score-panel__box';
        const currentLabel = this.document.createElement('span');
        currentLabel.className = 'score-panel__label';
        currentLabel.textContent = 'Счёт';
        this.scoreValue = this.document.createElement('span');
        this.scoreValue.className = 'score-panel__value';
        currentScoreBox.appendChild(currentLabel);
        currentScoreBox.appendChild(this.scoreValue);

        const bestScoreBox = this.document.createElement('div');
        bestScoreBox.className = 'score-panel__box';
        const bestLabel = this.document.createElement('span');
        bestLabel.className = 'score-panel__label';
        bestLabel.textContent = 'Рекорд';
        this.bestValue = this.document.createElement('span');
        this.bestValue.className = 'score-panel__value';
        bestScoreBox.appendChild(bestLabel);
        bestScoreBox.appendChild(this.bestValue);

        panel.appendChild(currentScoreBox);
        panel.appendChild(bestScoreBox);
        return panel;
    }

    renderGridBackground(size) {
        this.gridLayer.textContent = '';
        for (let row = 0; row < size * size; row += 1) {
            const cell = this.document.createElement('div');
            cell.className = 'board-grid__cell';
            this.gridLayer.appendChild(cell);
        }
    }

    refreshMetrics() {
        const gap = getComputedStyle(this.boardElement).getPropertyValue('--grid-gap');
        const numericGap = Number.parseFloat(gap) || 12;
        const boardSize = this.boardElement.clientWidth;
        const contentSize = boardSize - numericGap * 2;
        const tileSize = (contentSize - numericGap * (this.size - 1)) / this.size;
        this.metrics.gap = numericGap;
        this.metrics.tileSize = tileSize;
    }

    refreshTilePositions() {
        const ids = Object.keys(this.tileElements);
        for (let index = 0; index < ids.length; index += 1) {
            const id = ids[index];
            const element = this.tileElements[id];
            if (!element.dataset.row || !element.dataset.column) {
                continue;
            }
            const row = Number(element.dataset.row);
            const column = Number(element.dataset.column);
            this.updateTileTransform(element, row, column);
        }
    }

    render(snapshot) {
        const sizeChanged = this.size !== snapshot.size;
        this.size = snapshot.size;
        if (this.boardElement) {
            this.boardElement.style.setProperty('--grid-size', String(this.size));
        }
        if (sizeChanged) {
            this.renderGridBackground(this.size);
        }
        this.refreshMetrics();
        this.updateScore(snapshot.score);
        this.renderTiles(snapshot.tiles);
    }

    updateScore(score) {
        if (this.scoreValue) {
            this.scoreValue.textContent = String(score.current);
        }
        if (this.bestValue) {
            this.bestValue.textContent = String(score.best);
        }
    }

    renderTiles(tiles) {
        const currentIds = {};
        for (let index = 0; index < tiles.length; index += 1) {
            const tile = tiles[index];
            currentIds[tile.id] = true;
            this.upsertTile(tile);
        }
        const existingIds = Object.keys(this.tileElements);
        for (let index = 0; index < existingIds.length; index += 1) {
            const id = existingIds[index];
            if (!currentIds[id]) {
                const element = this.tileElements[id];
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                delete this.tileElements[id];
            }
        }
    }

    upsertTile(tile) {
        let element = this.tileElements[tile.id];
        const isNewElement = !element;
        if (!element) {
            element = this.document.createElement('div');
            element.className = 'tile';
            const valueNode = this.document.createElement('span');
            valueNode.className = 'tile__value';
            element.appendChild(valueNode);
            this.tileLayer.appendChild(element);
            this.tileElements[tile.id] = element;
        }

        element.dataset.row = String(tile.row);
        element.dataset.column = String(tile.column);
        element.firstChild.textContent = String(tile.value);
        this.applyValueStyle(element, tile.value);
        this.toggleStateClass(element, 'tile--new', tile.isNew);
        this.toggleStateClass(element, 'tile--merged', tile.justMerged);
        this.updateTileTransform(element, tile.row, tile.column, tile.previousPosition, tile, {
            isNewElement
        });
    }

    applyValueStyle(element, value) {
        const classesToRemove = [];
        element.classList.forEach((className) => {
            if (className.startsWith('tile--value-')) {
                classesToRemove.push(className);
            }
        });
        for (let index = 0; index < classesToRemove.length; index += 1) {
            element.classList.remove(classesToRemove[index]);
        }
        const modifierClass = `tile--value-${value}`;
        element.classList.add(modifierClass);

        const background = TILE_COLORS[value] || '#3c3a32';
        element.style.backgroundColor = background;
        element.style.color = value <= 4 ? '#776e65' : '#f9f6f2';
    }

    toggleStateClass(element, className, shouldHave) {
        if (shouldHave) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }

    updateTileTransform(element, row, column, previousPosition, tile, options = {}) {
        const { isNewElement = false } = options;
        const hasPrevious =
            previousPosition &&
            Number.isFinite(previousPosition.row) &&
            Number.isFinite(previousPosition.column);
        const targetOffset = this.calculateOffset(row, column);
        if (tile && tile.justMerged && hasPrevious && !isNewElement) {
            this.animateMergeWithGhost(tile, previousPosition, targetOffset);
            element.classList.remove('tile--moving');
            element.style.transform = `translate(${targetOffset.x}px, ${targetOffset.y}px)`;
            return;
        }
        if (hasPrevious) {
            const startOffset = this.calculateOffset(previousPosition.row, previousPosition.column);
            element.style.transform = `translate(${startOffset.x}px, ${startOffset.y}px)`;
            element.classList.add('tile--moving');
            requestAnimationFrame(() => {
                element.style.transform = `translate(${targetOffset.x}px, ${targetOffset.y}px)`;
            });
        } else {
            element.classList.remove('tile--moving');
            element.style.transform = `translate(${targetOffset.x}px, ${targetOffset.y}px)`;
        }
    }

    calculateOffset(row, column) {
        const x = column * (this.metrics.tileSize + this.metrics.gap);
        const y = row * (this.metrics.tileSize + this.metrics.gap);
        return { x, y };
    }

    animateMergeWithGhost(tile, previousPosition, targetOffset) {
        const startOffset = this.calculateOffset(previousPosition.row, previousPosition.column);
        const ghost = this.document.createElement('div');
        ghost.className = 'tile tile--ghost';
        const valueNode = this.document.createElement('span');
        valueNode.className = 'tile__value';
        const rawSourceValue = tile.value / 2;
        const sourceValue = Number.isFinite(rawSourceValue) && rawSourceValue > 0 ? rawSourceValue : tile.value;
        valueNode.textContent = String(sourceValue);
        ghost.appendChild(valueNode);
        this.applyValueStyle(ghost, sourceValue);
        ghost.style.transform = `translate(${startOffset.x}px, ${startOffset.y}px)`;
        this.tileLayer.appendChild(ghost);
        ghost.getBoundingClientRect();
        requestAnimationFrame(() => {
            ghost.style.transform = `translate(${targetOffset.x}px, ${targetOffset.y}px)`;
        });
        const removeGhost = () => {
            if (ghost && ghost.parentNode) {
                ghost.parentNode.removeChild(ghost);
            }
        };
        ghost.addEventListener('transitionend', removeGhost, { once: true });
        ghost.addEventListener('animationend', removeGhost, { once: true });
        setTimeout(removeGhost, 400);
    }
}
