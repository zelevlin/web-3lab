export class ScoreManager {
    constructor() {
        this.current = 0;
        this.best = 0;
    }

    reset() {
        this.current = 0;
    }

    add(points) {
        if (points > 0) {
            this.current += points;
            if (this.current > this.best) {
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
        return {
            current: this.current,
            best: this.best
        };
    }
}
