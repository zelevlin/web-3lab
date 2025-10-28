import { Tile } from './Tile.js';

export class Grid {
    constructor(size = 4) {
        this.size = size;
        this.cells = this.createEmptyGrid();
    }

    createEmptyGrid() {
        // Создаём двумерный массив указанного размера, заполненный null.
        const cells = [];
        for (let row = 0; row < this.size; row += 1) {
            const rowCells = [];
            for (let column = 0; column < this.size; column += 1) {
                rowCells.push(null);
            }
            cells.push(rowCells);
        }
        return cells;
    }

    eachCell(callback) {
        for (let row = 0; row < this.size; row += 1) {
            for (let column = 0; column < this.size; column += 1) {
                callback(row, column, this.cells[row][column]);
            }
        }
    }

    cellAvailable(row, column) {
        return this.cells[row][column] === null;
    }

    insertTile(tile) {
        if (this.isWithinBounds(tile.row, tile.column)) {
            // Помещаем плитку в сетку по текущим координатам.
            this.cells[tile.row][tile.column] = tile;
        }
    }

    removeTile(tile) {
        if (this.isWithinBounds(tile.row, tile.column)) {
            this.cells[tile.row][tile.column] = null;
        }
    }

    isWithinBounds(row, column) {
        return row >= 0 && row < this.size && column >= 0 && column < this.size;
    }

    randomAvailableCell() {
        const cells = this.availableCells();
        if (cells.length === 0) {
            return null;
        }
        // Выбираем случайную свободную ячейку.
        const index = Math.floor(Math.random() * cells.length);
        return cells[index];
    }

    availableCells() {
        const cells = [];
        this.eachCell((row, column, tile) => {
            if (!tile) {
                cells.push({ row, column });
            }
        });
        return cells;
    }

    cellsAvailable() {
        return this.availableCells().length > 0;
    }

    prepareTiles() {
        this.eachCell((row, column, tile) => {
            if (tile) {
                // Перед новым ходом сбрасываем служебные флаги тайлов.
                tile.resetFlags();
            }
        });
    }

    moveTile(tile, row, column) {
        this.cells[tile.row][tile.column] = null;
        tile.setPosition(row, column);
        this.cells[row][column] = tile;
    }

    clone() {
        const newGrid = new Grid(this.size);
        this.eachCell((row, column, tile) => {
            if (tile) {
                // Копируем каждую плитку, чтобы история состояний была независимой.
                newGrid.cells[row][column] = tile.clone();
            }
        });
        return newGrid;
    }

    serialize() {
        const serializedCells = [];
        this.eachCell((row, column, tile) => {
            if (!serializedCells[row]) {
                serializedCells[row] = [];
            }
            serializedCells[row][column] = tile
                ? {
                    id: tile.id,
                    row: tile.row,
                    column: tile.column,
                    value: tile.value
                }
                : null;
        });
        return {
            size: this.size,
            cells: serializedCells
        };
    }

    static deserialize(data) {
        const grid = new Grid(data.size);
        for (let row = 0; row < data.size; row += 1) {
            for (let column = 0; column < data.size; column += 1) {
                const cell = data.cells[row][column];
                if (cell) {
                    // Восстанавливаем объекты плиток из «плоской» структуры.
                    const tile = new Tile(cell.row, cell.column, cell.value);
                    tile.id = cell.id;
                    grid.cells[row][column] = tile;
                }
            }
        }
        Grid.updateTileIdCounter(data);
        return grid;
    }

    static updateTileIdCounter(data) {
        let maxId = 0;
        for (let row = 0; row < data.size; row += 1) {
            for (let column = 0; column < data.size; column += 1) {
                const cell = data.cells[row][column];
                if (cell) {
                    const numericPart = Number(cell.id.split('-')[1]);
                    if (!Number.isNaN(numericPart)) {
                        maxId = Math.max(maxId, numericPart);
                    }
                }
            }
        }
        if (maxId > Tile.lastId) {
            // Обновляем счётчик идентификаторов, чтобы не возникло конфликтов.
            Tile.lastId = maxId;
        }
    }
}
