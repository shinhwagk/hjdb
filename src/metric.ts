import { DBStore } from "./types"

export class Metric {
  metricTabUpdate = new Map<string, number>()
  metricTabQuery = new Map<string, number>()
  metricTabDelete = new Map<string, number>()
  metricError = 0


  public inc(type: 'update' | 'query' | 'delete', store: DBStore, db: string, sch: string, tab: string, val: number) {
    const key = `${store}@${db}@${sch}@${tab}`;
    const map = this._getMap(type);
    const currentVal = map.get(key) || 0;
    map.set(key, currentVal + val);
  }

  public incErr() {
    this.metricError += 1
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
      const [store, db, sch, tab] = key.split("@");
      metricLines.push(`${name}{store="${store}", db="${db}", sch="${sch}", tab="${tab}"} ${val}`);
    }
    if (metricLines.length >= 1) {
      metricLines.splice(0, 0, `# HELP ${name} Total number of ${name} operations`, `# TYPE ${name} counter`);
    }
    return metricLines
  }

  private formatErrorMetric() {
    if (this.metricError >= 1) {
      return [
        `# HELP hjdb_error Total number of hjdb_error operations`,
        `# TYPE hjdb_errorcounter`,
        `hjdb_error ${this.metricError}`
      ]
    } else { return [] }
  }

  public metrics(): string {
    const metrics: string[] = [];
    metrics.push(...this.formatMetrics('hjdb_update', this.metricTabUpdate));
    metrics.push(...this.formatMetrics('hjdb_query', this.metricTabQuery));
    metrics.push(...this.formatMetrics('hjdb_delete', this.metricTabDelete));
    metrics.push(...this.formatErrorMetric());

    return metrics.length >= 1 ? metrics.join("\n") + "\n" : "";
  }
}

