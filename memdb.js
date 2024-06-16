// @ts-check

/**
 * @typedef {import('./types').StoreFormat} StoreFormat
 */

class MemDB {
  /** @type {Map<string, StoreFormat>} */
  dbCache = new Map();

  /**
   * @param {string} db - Database name
   * @param {string} tab - Table name
   * @returns {StoreFormat | null} The store format object or null if not found
   */
  query(db, tab) {
    const dbtabpath = `${db}@${tab}`;
    return this.dbCache.get(dbtabpath) ?? null;
  }

  /**
   * @param {string} db - Database name
   * @param {string} tab - Table name
   */
  delete(db, tab) {
    const dbtabpath = `${db}@${tab}`;
    this.dbCache.delete(dbtabpath);
  }

  /**
   * Updates the data for the specified database and table.
   * @param {string} db - Database name
   * @param {string} tab - Table name
   * @param {Object} data - Data to store
   */
  update(db, tab, data) {
    const dbtabpath = `${db}@${tab}`;
    var storeData = this.dbCache.get(dbtabpath);
    if (storeData) {
      storeData.mts = (new Date()).getTime();
      storeData.data = data;
    } else {
      const ts = (new Date()).getTime();
      storeData = { cts: ts, mts: ts, data: data };
    }
    this.dbCache.set(dbtabpath, storeData);
  }
}

module.exports = MemDB