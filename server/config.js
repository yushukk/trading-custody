// server/config.js
module.exports = {
  PORT: process.env.SERVER_PORT || 3001,
  DATABASE_PATH: process.env.DATABASE_PATH || './server/database.db',
  EXTERNAL_APIS: {
    stock: {
      zh_a_hist: 'http://23.95.205.223:18201/api/public/stock_zh_a_hist'
    },
    future: {
      hist_em: 'http://23.95.205.223:18201/api/public/futures_hist_em'
    }
  },
  CRON_SCHEDULE: {
    price_sync: '0 17 * * *' // 每天17:00执行
  }
};