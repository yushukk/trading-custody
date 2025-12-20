const db = require('../utils/database');

class FundDao {
  async getBalance(userId) {
    const result = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM funds WHERE user_id = ?',
      [userId]
    );
    return result.balance;
  }

  async addFunds(userId, amount, timestamp) {
    const result = await db.run('INSERT INTO funds (user_id, amount, timestamp) VALUES (?, ?, ?)', [
      userId,
      amount,
      timestamp,
    ]);
    return result.lastID;
  }

  async getFundLogs(userId, limit = 5) {
    return await db.all(
      'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );
  }

  async addFundLog(userId, type, amount, balanceAfter, timestamp) {
    const result = await db.run(
      'INSERT INTO fund_logs (user_id, type, amount, balance_after, timestamp) VALUES (?, ?, ?, ?, ?)',
      [userId, type, amount, balanceAfter, timestamp]
    );
    return result.lastID;
  }
}

module.exports = new FundDao();
