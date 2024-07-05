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

  private *formatMetrics(name: string, map: Map<string, number>): IterableIterator<string> {
    yield `# HELP ${name} Total number of ${name} operations`;
    yield `# TYPE ${name} counter`;
    for (const [key, value] of map.entries()) {
      const [store, db, sch, tab] = key.split("@");
      yield `${name}{store="${store}", db="${db}", sch="${sch}", tab="${tab}"} ${value}`;
    }
  }

  *metrics() {
    if (this.metricTabUpdate.size > 0) {
      yield* this.formatMetrics('hjdb_update', this.metricTabUpdate);
    }
    if (this.metricTabQuery.size > 0) {
      yield* this.formatMetrics('hjdb_query', this.metricTabQuery);
    }
    if (this.metricTabDelete.size > 0) {
      yield* this.formatMetrics('hjdb_delete', this.metricTabDelete);
    }
    if (this.metricError > 0) {
      yield `# HELP hjdb_error Total number of hjdb_error operations`;
      yield `# TYPE hjdb_error counter`;
      yield `hjdb_error ${this.metricError}`;
    }
  }
}

