// @ts-check

class Metric {
  /** @type {Map<string, number>} */
  metricTabUpdate = new Map()
  metricTabQuery = new Map()
  metricTabDelete = new Map()

  /**
   * @param {'update' | 'query' | 'delete'} type 
   * @param {string} db 
   * @param {string} tab 
   * @param {number} val 
   */
  inc(type, db, tab, val) {
    const key = `${db}@${tab}`;
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
    const metrics = [];

    const formatMetrics = (metricName, map) => {
      const metricLines = [];
      for (const [key, val] of map.entries()) {
        const [db, tab] = key.split("@");
        metricLines.push(`${metricName}{db="${db}", tab="${tab}"} ${val}`);
      }
      return `
        # HELP ${metricName} Total number of ${metricName} operations
        # TYPE ${metricName} counter
        ${metricLines.join("\n")}
            `;
    };

    metrics.push(formatMetrics('hjdb_update', this.metricTabUpdate));
    metrics.push(formatMetrics('hjdb_query', this.metricTabQuery));
    metrics.push(formatMetrics('hjdb_delete', this.metricTabDelete));

    return metrics.join("\n");
  }
}

module.exports = Metric