export class Metrics {
    private counters: Record<string, number> = {};

    increment(key: string): void {
        this.counters[key] = (this.counters[key] || 0) + 1;
    }

    snapshot(): Record<string, number> {
        return Object.assign({}, this.counters);
    }
}

export const metrics = new Metrics();
