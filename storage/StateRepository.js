export class StateRepository {
    constructor(storage) {
        this.storage = storage;
    }

    loadState(key) {
        try {
            const raw = this.storage.getItem(key);
            if (!raw) {
                return null;
            }
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    saveState(key, state) {
        try {
            const raw = JSON.stringify(state);
            this.storage.setItem(key, raw);
        } catch (error) {
            // Игнорируем ошибки записи, чтобы не ломать игровой процесс.
        }
    }

    clearState(key) {
        try {
            this.storage.removeItem(key);
        } catch (error) {
            // Ничего не делаем, если очистка невозможна.
        }
    }
}
