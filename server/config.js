const envConfig = require('./config/env');

module.exports = {
  PORT: envConfig.port,
  DATABASE_PATH: envConfig.database.path,
  EXTERNAL_APIS: {
    stock: {
      zh_a_hist: envConfig.externalApis.stock || 'http://23.95.205.223:18201/api/public/stock_zh_a_hist'
    },
    future: {
      hist_em: envConfig.externalApis.future || 'http://23.95.205.223:18201/api/public/futures_hist_em'
    }
  },
  CRON_SCHEDULE: {
    price_sync: envConfig.cron.priceSync
  }
};