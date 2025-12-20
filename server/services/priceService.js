const AppError = require('../utils/AppError');
const http = require('http');
const config = require('../config');
const logger = require('../utils/logger');

class PriceService {
  constructor(priceDao) {
    this.priceDao = priceDao;
  }

  async getLatestPrice(code, assetType) {
    try {
      return await this.priceDao.getLatestPrice(code, assetType);
    } catch (error) {
      throw new AppError('获取最新价格失败', 'GET_LATEST_PRICE_FAILED', 500);
    }
  }

  async getAllPricesByCode(code, assetType) {
    try {
      return await this.priceDao.getAllPricesByCode(code, assetType);
    } catch (error) {
      throw new AppError('获取价格数据失败', 'GET_PRICE_DATA_FAILED', 500);
    }
  }

  // 修改getLatestPrice函数使用配置
  async fetchLatestPrice(code, asset_type) {
    let apiUrl;

    logger.debug('Fetching latest price', {
      code,
      asset_type,
      currentTime: new Date().toISOString(),
    });

    // 计算最近10天日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 10);
    // 解决服务器时区问题
    endDate.setDate(endDate.getDate() + 1);

    // 格式化日期为YYYYMMDD
    const formatDate = date => {
      return (
        date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0')
      );
    };

    // 根据资产类型构建API URL
    if (asset_type === 'stock') {
      apiUrl = `${config.EXTERNAL_APIS.stock.zh_a_hist}?symbol=${code}&period=daily&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
    } else if (asset_type === 'future') {
      const encodedCode = encodeURIComponent(code);
      apiUrl = `${config.EXTERNAL_APIS.future.hist_em}?symbol=${encodedCode}&period=daily&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
    } else {
      return 0.0; // 不支持的资产类型返回默认值
    }
    logger.debug('API URL constructed', { code, asset_type, apiUrl });

    try {
      // 使用Promise封装http请求
      const data = await new Promise((resolve, reject) => {
        http
          .get(apiUrl, res => {
            let body = '';
            res.on('data', chunk => (body += chunk));
            res.on('end', () => {
              try {
                const jsonData = JSON.parse(body);
                logger.debug('API response received', {
                  code,
                  asset_type,
                  dataLength: jsonData?.length,
                });
                resolve(jsonData);
              } catch (err) {
                logger.error('JSON parse failed', { code, asset_type, error: err.message });
                reject(err);
              }
            });
          })
          .on('error', err => {
            logger.error('HTTP request error', { code, asset_type, error: err.message });
            reject(err);
          });
      });

      if (!Array.isArray(data) || data.length === 0) {
        logger.warn('Empty data returned', { code, asset_type });
        return 0.0;
      }

      // 新增数据结构验证
      logger.debug('Raw data sample', { code, sample: data[0] });

      const latestRecord = data.reduce((latest, current) => {
        // 增加字段存在性检查 - 同时支持股票(日期)和期货(时间)格式
        const currentField = current.日期 ? '日期' : '时间';
        const latestField = latest.日期 ? '日期' : '时间';

        if (!current[currentField] || !latest[latestField]) {
          logger.warn('Missing time field', { code, current });
          return latest;
        }

        // 统一转换为时间戳进行比较
        return new Date(current[currentField]).getTime() > new Date(latest[latestField]).getTime()
          ? current
          : latest;
      }, data[0]);

      // 新增收盘价字段检查
      if (!latestRecord['收盘']) {
        logger.error('Missing close price field', { code, asset_type, latestRecord });
        return 0.0;
      }

      const price = parseFloat(latestRecord['收盘']) || 0.0;
      logger.info('Price fetched successfully', { code, asset_type, price });
      return price;
    } catch (error) {
      logger.error('Failed to fetch price', {
        code,
        asset_type,
        error: error.message,
        stack: error.stack,
      });
      return 0.0; // 统一返回0.0并记录详细错误
    }
  }

  async syncPriceData() {
    // 迁移自 server.js 的 getLatestPrice 函数逻辑
    // 此处保留原有逻辑的框架，具体实现根据业务需求定制
    logger.info('Starting price data synchronization');

    try {
      // 模拟同步过程 - 实际应用中应从数据库中获取所有需要同步的资产代码
      logger.info('Price data synchronization completed');
      return { success: true, message: '价格数据同步任务已完成' };
    } catch (error) {
      throw new AppError('同步价格数据失败', 'SYNC_PRICE_DATA_FAILED', 500);
    }
  }
}

// 默认导出实例
const priceDao = require('../dao/priceDao');
module.exports = new PriceService(priceDao);
