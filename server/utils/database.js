const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const config = require('../config');
const migrator = require('../migrations/migrator');

class Database {
  constructor() {
    this.db = new sqlite3.Database(config.DATABASE_PATH);
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }
  
  async transaction(callback) {
    await this.run('BEGIN TRANSACTION');
    try {
      await callback();
      await this.run('COMMIT');
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }
  
  async initialize() {
    // 执行数据库迁移
    await migrator.migrate();
  }
}

module.exports = new Database();