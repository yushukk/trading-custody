const db = require('../utils/database');

class PriceDao {
  async findByCodeAndType(code, assetType) {
    return await db.all(
      'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY timestamp DESC LIMIT 1',
      [code, assetType]
    );
  }

  async createPriceData(code, assetType, current_price, timestamp) {
    await db.run(
      'INSERT INTO price_data (code, asset_type, current_price, timestamp) VALUES (?, ?, ?, ?)',
      [code, assetType, current_price, timestamp]
    );
  }

  async deleteOldData(cutoffDate) {
    await db.run('DELETE FROM price_data WHERE timestamp < ?', [cutoffDate]);
  }

  async getLatestPrice(code, assetType) {
    const result = await db.get(
      'SELECT current_price FROM price_data WHERE code = ? AND asset_type = ? ORDER BY timestamp DESC LIMIT 1',
      [code, assetType]
    );
    return result ? result.current_price : 0;
  }

  async getAllPricesByCode(code, assetType) {
    return await db.all(
      'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY timestamp DESC',
      [code, assetType]
    );
  }
}

module.exports = new PriceDao();
