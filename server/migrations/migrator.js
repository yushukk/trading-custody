const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

class Migrator {
  constructor(dbPath = config.DATABASE_PATH) {
    this.db = new sqlite3.Database(dbPath);
  }

  async init() {
    // 直接使用 sqlite3 的 run 方法来创建迁移表
    return new Promise((resolve, reject) => {
      this.db.run(
        `
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        err => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getExecutedMigrations() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT name FROM migrations ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });
  }

  async executeMigration(name, sql) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION', err => {
          if (err) {
            reject(err);
            return;
          }

          // 以更智能的方式拆分SQL语句，避免触发器和BEGIN/END块的分割
          const statements = this.splitSqlStatements(sql);
          let index = 0;

          const executeNext = () => {
            if (index >= statements.length) {
              // 所有语句执行完毕，插入迁移记录
              this.db.run('INSERT INTO migrations (name) VALUES (?)', [name], err => {
                if (err) {
                  this.db.run('ROLLBACK', () => reject(err));
                } else {
                  this.db.run('COMMIT', err => {
                    if (err) reject(err);
                    else resolve();
                  });
                }
              });
              return;
            }

            const stmt = statements[index].trim();
            if (stmt) {
              this.db.run(stmt, err => {
                if (err) {
                  // 如果是重复列名错误，忽略并继续执行下一个语句
                  if (err.message.includes('duplicate column name')) {
                    console.warn(`Ignoring duplicate column warning: ${stmt}`);
                    index++;
                    executeNext();
                  } else {
                    this.db.run('ROLLBACK', () => reject(err));
                  }
                } else {
                  index++;
                  executeNext();
                }
              });
            } else {
              index++;
              executeNext();
            }
          };

          executeNext();
        });
      });
    });
  }

  // 智能拆分SQL语句，考虑BEGIN/END块、触发器和函数等
  splitSqlStatements(sql) {
    const statements = [];
    let currentStatement = '';
    let inBlock = false;
    let quoteChar = null;
    let i = 0;

    while (i < sql.length) {
      const char = sql[i];
      const nextChar = sql[i + 1] || '';

      // 跳过注释
      if (char === '-' && nextChar === '-') {
        // 跳过行注释
        while (i < sql.length && sql[i] !== '\n') {
          i++;
        }
        continue;
      }

      // 跳过多行注释 (/* ... */)
      if (char === '/' && nextChar === '*') {
        i += 2;
        while (i < sql.length - 1) {
          if (sql[i] === '*' && sql[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }

      // 检查引号
      if (!quoteChar && (char === '"' || char === "'" || char === '`')) {
        quoteChar = char;
      } else if (char === quoteChar && nextChar !== quoteChar) {
        quoteChar = null;
      } else if (char === quoteChar && nextChar === quoteChar) {
        // 处理转义引号
        currentStatement += char + nextChar;
        i += 2;
        continue;
      }

      if (quoteChar) {
        currentStatement += char;
        i++;
        continue;
      }

      // 检查块的开始和结束
      if (!inBlock && sql.substring(i).startsWith('BEGIN')) {
        const wordEnd = i + 5;
        const nextNonWordChar = sql[wordEnd];
        if (!/[a-zA-Z0-9_]/.test(nextNonWordChar)) {
          inBlock = true;
        }
      }

      if (inBlock && sql.substring(i).startsWith('END')) {
        const wordEnd = i + 3;
        const nextNonWordChar = sql[wordEnd];
        if (!/[a-zA-Z0-9_]/.test(nextNonWordChar)) {
          inBlock = false;
        }
      }

      // 检查触发器定义开始
      if (!inBlock && sql.substring(i).toLowerCase().startsWith('create trigger')) {
        inBlock = true;
      }

      // 处理分号
      if (char === ';' && !inBlock) {
        statements.push(currentStatement);
        currentStatement = '';
        i++;
        continue;
      }

      currentStatement += char;
      i++;
    }

    if (currentStatement.trim()) {
      statements.push(currentStatement);
    }

    // 过滤空语句
    return statements.filter(stmt => stmt.trim() !== '');
  }

  async migrate() {
    await this.init();
    const executed = await this.getExecutedMigrations();
    const migrationFiles = fs
      .readdirSync(__dirname)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (!executed.includes(file)) {
        const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
        await this.executeMigration(file, sql);
        console.log(`Executed migration: ${file}`);
      }
    }
  }
}

module.exports = Migrator;
module.exports.default = new Migrator();
