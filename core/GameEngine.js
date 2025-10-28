import { Grid } from './Grid.js';
import { Tile } from './Tile.js';

export class GameEngine {
    constructor(scoreManager, size = 4) {
        this.size = size;
        this.scoreManager = scoreManager;
        this.grid = new Grid(size);
        this.status = 'idle';
        this.history = [];
        this.maximumHistoryLength = 20;
    }

    startNewGame() {
        // Полностью сбрасываем сетку и счёт перед новым матчем.
        this.grid = new Grid(this.size);
        this.history = [];
        this.scoreManager.reset();
        this.status = 'playing';
        const initialTiles = this.getInitialTileCount();
        for (let index = 0; index < initialTiles; index += 1) {
            this.addRandomTile();
        }
        return this.getSnapshot();
    }

    getInitialTileCount() {
        // В стартовом состоянии появляется от одной до трёх плиток.
        const minimum = 1;
        const maximum = 3;
        return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
    }

    addRandomTile() {
        if (!this.grid.cellsAvailable()) {
            return null;
        }
        // Генерируем значение плитки с вероятностью 90% для двойки.
        const value = Math.random() < 0.9 ? 2 : 4;
        const cell = this.grid.randomAvailableCell();
        if (!cell) {
            return null;
        }
        const tile = new Tile(cell.row, cell.column, value, { isNew: true });
        this.grid.insertTile(tile);
        return tile;
    }

    move(direction) {
        if (this.status === 'over') {
            return { moved: false, status: this.status };
        }
        // Преобразуем направление в вектор смещения по сетке.
        const vector = this.getVector(direction);
        if (!vector) {
            return { moved: false, status: this.status };
        }
        const traversals = this.buildTraversals(vector);
        let moved = false;
        let pointsGained = 0;

        const previousState = {
            grid: this.grid.clone(),
            score: this.scoreManager.current,
            status: this.status
        };

        this.grid.prepareTiles();

        for (let rowIndex = 0; rowIndex < traversals.rows.length; rowIndex += 1) {
            const row = traversals.rows[rowIndex];
            for (let columnIndex = 0; columnIndex < traversals.columns.length; columnIndex += 1) {
                const column = traversals.columns[columnIndex];
                const tile = this.grid.cells[row][column];
                if (!tile) {
                    continue;
                }

                const positions = this.findFarthestPosition({ row, column }, vector);
                const nextCell = this.getCell(positions.next.row, positions.next.column);

                if (nextCell && nextCell.value === tile.value && !nextCell.justMerged) {
                    // Зафиксирован контакт с плиткой того же значения — объединяем.
                    this.grid.removeTile(tile);
                    nextCell.updateValue(nextCell.value * 2);
                    nextCell.markAsMerged();
                    nextCell.previousPosition = { row, column };
                    pointsGained += nextCell.value;
                    moved = true;
                    if (nextCell.value === 2048) {
                        this.status = 'won';
                    }
                } else {
                    if (positions.farthest.row !== row || positions.farthest.column !== column) {
                        this.grid.moveTile(tile, positions.farthest.row, positions.farthest.column);
                        moved = true;
                    }
                }
            }
        }

        if (!moved) {
            // Не было перемещений — досрочно выходим.
            return { moved: false, status: this.status };
        }

        this.pushHistory(previousState);
        this.scoreManager.add(pointsGained);

        const newTilesCount = this.getNewTilesCount();
        const newTiles = [];
        for (let index = 0; index < newTilesCount; index += 1) {
            const newTile = this.addRandomTile();
            if (newTile) {
                newTiles.push(newTile);
            }
        }

        if (!this.movesAvailable()) {
            // Невозможно сделать следующий ход — игра окончена.
            this.status = 'over';
        } else if (this.status !== 'won') {
            this.status = 'playing';
        }

        return {
            moved: true,
            status: this.status,
            points: pointsGained,
            newTiles
        };
    }

    pushHistory(state) {
        this.history.push({
            grid: state.grid,
            score: state.score,
            status: state.status
        });
        if (this.history.length > this.maximumHistoryLength) {
            // Поддерживаем ограниченную глубину истории.
            this.history.shift();
        }
    }

    getVector(direction) {
        const vectors = {
            up: { row: -1, column: 0 },
            right: { row: 0, column: 1 },
            down: { row: 1, column: 0 },
            left: { row: 0, column: -1 }
        };
        return vectors[direction];
    }

    buildTraversals(vector) {
        const rows = [];
        const columns = [];

        // Заполняем массивы индексов, которые позже, при необходимости, разворачиваем.
        for (let index = 0; index < this.size; index += 1) {
            rows.push(index);
            columns.push(index);
        }

        if (vector.row === 1) {
            rows.reverse();
        }
        if (vector.column === 1) {
            columns.reverse();
        }

        return { rows, columns };
    }

    findFarthestPosition(position, vector) {
        const previous = { row: position.row, column: position.column };
        let currentRow = position.row;
        let currentColumn = position.column;

        while (true) {
            const nextRow = currentRow + vector.row;
            const nextColumn = currentColumn + vector.column;
            if (!this.grid.isWithinBounds(nextRow, nextColumn) || !this.grid.cellAvailable(nextRow, nextColumn)) {
                // Дальше или граница, или занятая клетка — останавливаемся.
                break;
            }
            previous.row = nextRow;
            previous.column = nextColumn;
            currentRow = nextRow;
            currentColumn = nextColumn;
        }

        return {
            farthest: { row: previous.row, column: previous.column },
            next: { row: previous.row + vector.row, column: previous.column + vector.column }
        };
    }

    getCell(row, column) {
        if (!this.grid.isWithinBounds(row, column)) {
            return null;
        }
        return this.grid.cells[row][column];
    }

    getNewTilesCount() {
        return Math.random() < 0.5 ? 1 : 2;
    }

    movesAvailable() {
        if (this.grid.cellsAvailable()) {
            return true;
        }
        // Свободных клеток нет — ищем потенциальные слияния.
        return this.tileMatchesAvailable();
    }

    tileMatchesAvailable() {
        for (let row = 0; row < this.size; row += 1) {
            for (let column = 0; column < this.size; column += 1) {
                const tile = this.grid.cells[row][column];
                if (!tile) {
                    continue;
                }
                const directions = [
                    { row: 0, column: 1 },
                    { row: 1, column: 0 },
                    { row: 0, column: -1 },
                    { row: -1, column: 0 }
                ];
                for (let index = 0; index < directions.length; index += 1) {
                    const vector = directions[index];
                    const cell = this.getCell(row + vector.row, column + vector.column);
                    if (cell && cell.value === tile.value) {
                        // Нашли пару одинаковых соседей.
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getSnapshot() {
        const tiles = [];
        this.grid.eachCell((row, column, tile) => {
            if (tile) {
                tiles.push({
                    id: tile.id,
                    value: tile.value,
                    row: tile.row,
                    column: tile.column,
                    isNew: tile.isNew,
                    justMerged: tile.justMerged,
                    previousPosition: tile.previousPosition
                });
            }
        });
        return {
            size: this.size,
            tiles,
            status: this.status,
            score: this.scoreManager.getSnapshot()
        };
    }

    undo() {
        if (this.history.length === 0 || this.status === 'over') {
            return null;
        }
        const previous = this.history.pop();
        // Копируем сетку, чтобы не привязываться к объектам из истории.
        this.grid = previous.grid.clone();
        this.scoreManager.setCurrent(previous.score);
        if (previous.score > this.scoreManager.best) {
            this.scoreManager.setBest(previous.score);
        }
        this.status = previous.status;
        return this.getSnapshot();
    }

    serialize() {
        return {
            grid: this.grid.serialize(),
            status: this.status,
            score: this.scoreManager.getSnapshot(),
            history: this.history.map((item) => ({
                // Каждое состояние истории сериализуем отдельно.
                grid: item.grid.serialize(),
                score: item.score,
                status: item.status
            }))
        };
    }

    restore(data) {
        this.grid = Grid.deserialize(data.grid);
        this.status = data.status;
        this.scoreManager.setCurrent(data.score.current);
        this.scoreManager.setBest(data.score.best);
        this.history = [];
        for (let index = 0; index < data.history.length; index += 1) {
            const historyItem = data.history[index];
            this.history.push({
                grid: Grid.deserialize(historyItem.grid),
                score: historyItem.score,
                status: historyItem.status
            });
        }
    }
}
