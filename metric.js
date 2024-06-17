// @ts-check

class Metric {
  /** @type {Map<string, number>} */
  metricTabUpdate = new Map()
  metricTabQuery = new Map()
  metricTabDelete = new Map()

  /**
   * @param {'update' | 'query' | 'delete'} type 
   * @param {'memory' | 'file'} store
   * @param {string} db 
   * @param {string} tab 
   * @param {number} val 
   */
  inc(type, store, db, tab, val) {
    const key = `${store}@${db}@${tab}`;
    const map = this._getMap(type);
    const currentVal = map.get(key) || 0;
    map.set(key, currentVal + val);
  }

  /**
   * @param {'update' | 'query' | 'delete'} type 
   * @returns {Map<string, number>}
   */
  _getMap(type) {
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

  /**
   * @returns {string}
   */
  metrics() {
    /** @type {string[]} */
    const metrics = [];
    /**
     * @param {string} metricName 
     * @param {Map<string, number>} map
     * @returns {string[]}
     */
    const formatMetrics = (metricName, map) => {
      const metricLines = [];
      for (const [key, val] of map.entries()) {
        const [store, db, tab] = key.split("@");
        metricLines.push(`${metricName}{store="${store}", db="${db}", tab="${tab}"} ${val}`);
      }
      if (metricLines.length >= 1) {
        metricLines.splice(0, 0, `# HELP ${metricName} Total number of ${metricName} operations`, `# TYPE ${metricName} counter`);
      }
      return metricLines
    };

    metrics.push(...formatMetrics('hjdb_update', this.metricTabUpdate));
    metrics.push(...formatMetrics('hjdb_query', this.metricTabQuery));
    metrics.push(...formatMetrics('hjdb_delete', this.metricTabDelete));

    return metrics.length >= 1 ? metrics.join("\n") + "\n" : "";
  }
}

module.exports = Metric