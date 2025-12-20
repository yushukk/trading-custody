const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const config = require('../config');
const logger = require('./logger');

class Database {
  constructor(dbPath = config.DATABASE_PATH) {
    this.dbPath = dbPath;
    // 只有在真正需要时才创建数据库连接
    this._db = null;
    this.isInitialized = false;
  }

  // 延迟初始化数据库连接
  get db() {
    if (!this._db) {
      this._db = new sqlite3.Database(this.dbPath, err => {
        if (err) {
          logger.error('Database connection failed', { error: err.message });
          throw err;
        }
        logger.info('Database connection established', { dbPath: this.dbPath });
      });
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
    if (this.isInitialized) {
      logger.debug('Database already initialized');
      return;
    }

    try {
      // 确保数据库连接已建立
      const db = this.db;

      // 启用 WAL 模式以提升并发性能
      await new Promise((resolve, reject) => {
        db.run('PRAGMA journal_mode=WAL', err => {
          if (err) {
            logger.error('Failed to enable WAL mode', { error: err.message });
            reject(err);
          } else {
            logger.info('WAL mode enabled successfully');
            resolve();
          }
        });
      });

      // 设置其他性能优化参数
      await new Promise(resolve => {
        db.run('PRAGMA synchronous=NORMAL', err => {
          if (err) {
            logger.warn('Failed to set synchronous mode', { error: err.message });
          }
          resolve();
        });
      });

      await new Promise(resolve => {
        db.run('PRAGMA cache_size=10000', err => {
          if (err) {
            logger.warn('Failed to set cache size', { error: err.message });
          }
          resolve();
        });
      });

      await new Promise(resolve => {
        db.run('PRAGMA temp_store=MEMORY', err => {
          if (err) {
            logger.warn('Failed to set temp store', { error: err.message });
          }
          resolve();
        });
      });

      // 动态导入 Migrator 以避免循环依赖
      const Migrator = require('../migrations/migrator');
      const migrator = new Migrator(this.dbPath);
      // 执行数据库迁移
      await migrator.migrate();

      this.isInitialized = true;
      logger.info('Database initialized successfully with optimizations');
    } catch (error) {
      logger.error('Database initialization failed', { error: error.message, stack: error.stack });
      throw error;
    }
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
