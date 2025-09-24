const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

// 数据库文件路径
const dbPath = config.DATABASE_PATH;

// 创建并导出数据库连接
const db = new sqlite3.Database(dbPath);

module.exports = db;