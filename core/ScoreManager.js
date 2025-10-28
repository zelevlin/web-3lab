export class ScoreManager {
    constructor() {
        this.current = 0;
        this.best = 0;
    }

    reset() {
        // Сбрасываем только текущий счёт, рекорд остаётся прежним.
        this.current = 0;
    }

    add(points) {
        if (points > 0) {
            this.current += points;
            if (this.current > this.best) {
                // Обновляем лучший результат по факту.
                this.best = this.current;
            }
        }
    }

    setCurrent(score) {
        this.current = score;
    }

    setBest(score) {
        this.best = score;
    }

    getSnapshot() {
        // Возвращаем копию значений, чтобы UI не менял их напрямую.
        return {
            current: this.current,
            best: this.best
        };
    }
}
