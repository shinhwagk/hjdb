import { DBStore } from "./types"

export class Metric {
  metricTabUpdate = new Map<string, number>()
  metricTabQuery = new Map<string, number>()
  metricTabDelete = new Map<string, number>()

  public inc(type: 'update' | 'query' | 'delete', store: DBStore, db: string, tab: string, val: number) {
    const key = `${store}@${db}@${tab}`;
    const map = this._getMap(type);
    const currentVal = map.get(key) || 0;
    map.set(key, currentVal + val);
  }

  private _getMap(type: 'update' | 'query' | 'delete'): Map<string, number> {
    switch (type) {
      case 'update':
        return this.metricTabUpdate;
      case 'query':
        return this.metricTabQuery;
      case 'delete':
        return this.metricTabDelete;
      default:
        throw new Error('Invalid type specified');
    }
  }

  private formatMetrics(name: string, map: Map<string, number>) {
    const metricLines: string[] = [];
    for (const [key, val] of map.entries()) {
      const [store, db, tab] = key.split("@");
      metricLines.push(`${name}{store="${store}", db="${db}", tab="${tab}"} ${val}`);
    }
    if (metricLines.length >= 1) {
      metricLines.splice(0, 0, `# HELP ${name} Total number of ${name} operations`, `# TYPE ${name} counter`);
    }
    return metricLines
  }

  public metrics(): string {
    const metrics: string[] = [];
    metrics.push(...this.formatMetrics('hjdb_update', this.metricTabUpdate));
    metrics.push(...this.formatMetrics('hjdb_query', this.metricTabQuery));
    metrics.push(...this.formatMetrics('hjdb_delete', this.metricTabDelete));

    return metrics.length >= 1 ? metrics.join("\n") + "\n" : "";
  }
}

