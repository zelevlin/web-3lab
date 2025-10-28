export class LeaderboardRepository {
    constructor(storage) {
        this.storage = storage;
    }

    getRecords(key) {
        try {
            const raw = this.storage.getItem(key);
            if (!raw) {
                return [];
            }
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
                return data;
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    addRecord(key, record) {
        const records = this.getRecords(key);
        records.push(record);
        records.sort((first, second) => {
            if (second.score !== first.score) {
                return second.score - first.score;
            }
            return new Date(second.date).getTime() - new Date(first.date).getTime();
        });
        while (records.length > 10) {
            records.pop();
        }
        this.saveRecords(key, records);
        return records;
    }

    saveRecords(key, records) {
        try {
            this.storage.setItem(key, JSON.stringify(records));
        } catch (error) {
            // Игнорируем невозможность сохранения.
        }
    }
}
