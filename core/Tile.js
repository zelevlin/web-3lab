export class Tile {
    static lastId = 0;

    constructor(row, column, value, options = {}) {
        // Генерируем уникальный идентификатор, чтобы отслеживать тайл при рендере.
        this.id = Tile.generateId();
        this.row = row;
        this.column = column;
        this.value = value;
        this.isNew = Boolean(options.isNew);
        this.justMerged = Boolean(options.justMerged);
        this.previousPosition = null;
    }

    static generateId() {
        Tile.lastId += 1;
        return `tile-${Tile.lastId}`;
    }

    setPosition(row, column) {
        // Сохраняем предыдущие координаты для плавной анимации.
        this.previousPosition = { row: this.row, column: this.column };
        this.row = row;
        this.column = column;
    }

    updateValue(newValue) {
        this.value = newValue;
    }

    markAsMerged() {
        this.justMerged = true;
    }

    markAsNew() {
        this.isNew = true;
    }

    resetFlags() {
        this.isNew = false;
        this.justMerged = false;
        this.previousPosition = null;
    }

    clone() {
        const options = {
            isNew: this.isNew,
            justMerged: this.justMerged
        };
        const tile = new Tile(this.row, this.column, this.value, options);
        tile.id = this.id;
        tile.previousPosition = this.previousPosition
            ? { row: this.previousPosition.row, column: this.previousPosition.column }
            : null;
        return tile;
    }
}
