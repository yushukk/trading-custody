const db = require('../utils/database');

class PositionDao {
  async findByUserId(userId) {
    return await db.all(
      `SELECT id, user_id as userId, code, name, asset_type as assetType, operation, price, quantity, timestamp, fee FROM positions WHERE user_id = ? ORDER BY timestamp ASC`,
      [userId]
    );
  }

  async create(positionData) {
    const { userId, assetType, code, name, operation, price, quantity, timestamp, fee } =
      positionData;
    const result = await db.run(
      `INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, code, name, assetType, operation, price, quantity, timestamp, fee]
    );
    return result.lastID;
  }

  async deleteByUserId(userId) {
    await db.run('DELETE FROM positions WHERE user_id = ?', [userId]);
  }

  async deleteById(id) {
    await db.run('DELETE FROM positions WHERE id = ?', [id]);
  }

  async findById(id) {
    return await db.get(
      'SELECT id, user_id as userId, code, name, asset_type as assetType, operation, price, quantity, timestamp, fee FROM positions WHERE id = ?',
      [id]
    );
  }

  async findByCodeAndUser(userId, code, assetType) {
    return await db.get(
      'SELECT id, user_id as userId, code, name, asset_type as assetType, operation, price, quantity, timestamp, fee FROM positions WHERE user_id = ? AND code = ? AND asset_type = ?',
      [userId, code, assetType]
    );
  }

  async getAllUsersPositions() {
    return await db.all(
      `SELECT p.id, p.user_id as userId, p.code, p.name, p.asset_type as assetType, p.operation, p.price, p.quantity, p.timestamp, p.fee, u.name as user_name, u.email as user_email
       FROM positions p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.user_id, p.timestamp DESC`
    );
  }
}

module.exports = new PositionDao();
