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
      // 使用Promise封装http请求，添加超时和状态码检查
      const data = await new Promise((resolve, reject) => {
        const request = http
          .get(apiUrl, res => {
            // 检查 HTTP 状态码
            if (res.statusCode !== 200) {
              logger.error('HTTP request failed', {
                code,
                asset_type,
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
              });
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
              return;
            }

            let body = '';
            res.on('data', chunk => (body += chunk));
            res.on('end', () => {
              try {
                // 记录原始响应以便调试
                if (body.length > 0 && body.length < 200) {
                  logger.debug('API response body', { code, asset_type, body });
                }

                const jsonData = JSON.parse(body);
                logger.debug('API response received', {
                  code,
                  asset_type,
                  dataLength: jsonData?.length,
                });
                resolve(jsonData);
              } catch (err) {
                logger.error('JSON parse failed', {
                  code,
                  asset_type,
                  error: err.message,
                  bodyPreview: body.substring(0, 100),
                });
                reject(err);
              }
            });
          })
          .on('error', err => {
            logger.error('HTTP request error', { code, asset_type, error: err.message });
            reject(err);
          })
          .on('timeout', () => {
            request.destroy();
            const timeoutError = new Error('Request timeout after 30 seconds');
            logger.error('HTTP request timeout', { code, asset_type });
            reject(timeoutError);
          });

        // 设置 30 秒超时
        request.setTimeout(30000);
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
    logger.info('Starting price data synchronization');

    try {
      // 从数据库获取所有持仓中的资产代码（去重）
      const positionDao = require('../dao/positionDao');
      const positions = await positionDao.findAll();

      if (!positions || positions.length === 0) {
        logger.info('No positions found, skipping price sync');
        return { success: true, message: '没有持仓数据，无需同步价格' };
      }

      // 去重获取所有唯一的资产代码
      const uniqueAssets = new Map();
      positions.forEach(pos => {
        const key = `${pos.code}_${pos.assetType || pos.asset_type}`;
        if (!uniqueAssets.has(key)) {
          uniqueAssets.set(key, {
            code: pos.code,
            assetType: pos.assetType || pos.asset_type,
          });
        }
      });

      logger.info(`Found ${uniqueAssets.size} unique assets to sync`);

      // 同步每个资产的价格
      let successCount = 0;
      let failCount = 0;
      const timestamp = new Date().toISOString();

      for (const [, asset] of uniqueAssets) {
        try {
          const price = await this.fetchLatestPrice(asset.code, asset.assetType);

          if (price > 0) {
            // 保存价格到数据库
            await this.priceDao.createPriceData(asset.code, asset.assetType, price, timestamp);
            successCount++;
            logger.info(`Synced price for ${asset.code}: ${price}`);
          } else {
            failCount++;
            logger.warn(`Failed to fetch price for ${asset.code}, got 0`);
          }
        } catch (error) {
          failCount++;
          logger.error(`Error syncing price for ${asset.code}:`, error);
        }
      }

      logger.info(`Price sync completed: ${successCount} success, ${failCount} failed`);

      return {
        success: true,
        message: `价格同步完成：成功 ${successCount} 个，失败 ${failCount} 个`,
        details: {
          total: uniqueAssets.size,
          success: successCount,
          failed: failCount,
        },
      };
    } catch (error) {
      logger.error('Price sync failed:', error);
      throw new AppError('同步价格数据失败', 'SYNC_PRICE_DATA_FAILED', 500);
    }
  }
}

// 默认导出实例
const priceDao = require('../dao/priceDao');
module.exports = new PriceService(priceDao);
