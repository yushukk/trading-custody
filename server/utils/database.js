const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const config = require('../config');

class Database {
  constructor(dbPath = config.DATABASE_PATH) {
    this.dbPath = dbPath;
    // 只有在真正需要时才创建数据库连接
    this._db = null;
  }

  // 延迟初始化数据库连接
  get db() {
    if (!this._db) {
      this._db = new sqlite3.Database(this.dbPath);
    }
    return this._db;
  }

  get run() {
    return promisify(this.db.run.bind(this.db));
  }

  get get() {
    return promisify(this.db.get.bind(this.db));
  }

  get all() {
    return promisify(this.db.all.bind(this.db));
  }

  async transaction(callback) {
    const run = promisify(this.db.run.bind(this.db));
    await run('BEGIN TRANSACTION');
    try {
      await callback();
      await run('COMMIT');
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  }

  async initialize() {
    // 动态导入 Migrator 以避免循环依赖
    const Migrator = require('../migrations/migrator');
    const migrator = new Migrator(this.dbPath);
    // 执行数据库迁移
    await migrator.migrate();
  }

  close(callback) {
    if (this._db) {
      this._db.close(callback);
    } else if (callback) {
      callback();
    }
  }
}

// 导出实例
const databaseInstance = new Database();

module.exports = databaseInstance;
module.exports.default = databaseInstance;
module.exports.Database = Database;
