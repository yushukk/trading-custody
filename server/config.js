const envConfig = require('./config/env');

module.exports = {
  PORT: envConfig.port,
  DATABASE_PATH: envConfig.database.path,
  EXTERNAL_APIS: {
    stock: {
      zh_a_hist:
        envConfig.externalApis.stock || 'http://23.95.205.223:18201/api/public/stock_zh_a_hist',
    },
    future: {
      zh_minute_sina:
        envConfig.externalApis.future ||
        'http://192.168.31.69:18202/api/public/futures_zh_minute_sina',
    },
  },
  // 字段映射配置（新接口已返回英文字段，保留映射以兼容旧数据）
  FIELD_MAPPING: {
    future: {
      datetime: 'date',
      时间: 'date',
      日期: 'date',
      开盘: 'open',
      最高: 'high',
      最低: 'low',
      收盘: 'close',
      成交量: 'volume',
      持仓量: 'hold',
      结算价: 'settle',
    },
  },
  CRON_SCHEDULE: {
    price_sync: envConfig.cron.priceSync,
  },
};
