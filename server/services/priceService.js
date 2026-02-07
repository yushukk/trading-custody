const AppError = require('../utils/AppError');
const http = require('http');
const config = require('../config');
const logger = require('../utils/logger');

class PriceService {
  constructor(priceDao) {
    this.priceDao = priceDao;
    // 初始化同步锁
    if (!PriceService.syncInProgress) {
      PriceService.syncInProgress = false;
    }
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
    // 解决服务器时区问题，并考虑期货夜盘交易及节假日（最多覆盖5天假期）
    endDate.setDate(endDate.getDate() + 5);

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
      // 期货接口：传symbol和period参数
      apiUrl = `${config.EXTERNAL_APIS.future.zh_minute_sina}?symbol=${encodedCode}&period=60`;
    } else {
      return 0.0; // 不支持的资产类型返回默认值
    }
    logger.debug('API URL constructed', { code, asset_type, apiUrl });

    try {
      // 记录请求开始日志
      logger.info('Starting price request', {
        code,
        asset_type,
        url: apiUrl,
        timestamp: new Date().toISOString(),
      });

      // 使用Promise封装http请求，添加超时和状态码检查
      const data = await new Promise((resolve, reject) => {
        const request = http
          .get(apiUrl, res => {
            // 检查 HTTP 状态码
            if (res.statusCode !== 200) {
              logger.error('HTTP request failed', {
                code,
                asset_type,
                url: apiUrl,
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
            logger.error('HTTP request error', {
              code,
              asset_type,
              url: apiUrl,
              error: err.message,
            });
            reject(err);
          })
          .on('timeout', () => {
            request.destroy();
            const timeoutError = new Error('Request timeout after 30 seconds');
            logger.error('HTTP request timeout', {
              code,
              asset_type,
              url: apiUrl,
            });
            reject(timeoutError);
          });

        // 设置 30 秒超时
        request.setTimeout(30000);
      });

      if (!Array.isArray(data) || data.length === 0) {
        logger.warn('Empty data returned', { code, asset_type });
        return 0.0;
      }

      // 转换字段格式（新接口返回datetime字段，需要转换为date）
      let processedData = data;
      if (asset_type === 'future' && data[0]) {
        if (data[0].datetime) {
          // 新接口返回datetime字段，转换为date
          processedData = data.map(item => ({
            ...item,
            date: item.datetime,
          }));
        } else if (data[0].date || data[0]['时间'] || data[0]['日期']) {
          // 兼容旧格式
          if (data[0]['时间'] || data[0]['日期']) {
            processedData = data.map(item => this.convertFieldsToEnglish(item, asset_type));
          }
        }
      }

      // 新增数据结构验证
      logger.debug('Raw data sample', { code, sample: processedData[0] });

      const latestRecord = processedData.reduce((latest, current) => {
        // 支持date、datetime、日期、时间字段
        const currentField = current.date || current.datetime || current.日期 || current.时间;
        const latestField = latest.date || latest.datetime || latest.日期 || latest.时间;

        if (!currentField || !latestField) {
          logger.warn('Missing time field', { code, current });
          return latest;
        }

        // 统一转换为时间戳进行比较
        return new Date(currentField).getTime() > new Date(latestField).getTime()
          ? current
          : latest;
      }, processedData[0]);

      // 新增收盘价字段检查（支持英文和中文字段）
      const closePrice = latestRecord.close || latestRecord['收盘'];
      if (!closePrice) {
        logger.error('Missing close price field', { code, asset_type, latestRecord });
        return 0.0;
      }

      const price = parseFloat(closePrice) || 0.0;
      logger.info('Price fetched successfully', {
        code,
        asset_type,
        url: apiUrl,
        price,
        responseTime: new Date().toISOString(),
      });
      return price;
    } catch (error) {
      logger.error('Failed to fetch price', {
        code,
        asset_type,
        url: apiUrl,
        error: error.message,
        stack: error.stack,
      });
      return 0.0; // 统一返回0.0并记录详细错误
    }
  }

  // 字段转换方法
  convertFieldsToEnglish(item, asset_type) {
    if (asset_type === 'future') {
      const mapping = config.FIELD_MAPPING.future;
      const converted = {};

      for (const [chineseKey, englishKey] of Object.entries(mapping)) {
        if (item[chineseKey] !== undefined) {
          converted[englishKey] = item[chineseKey];
        }
      }

      return converted;
    }
    return item;
  }

  async syncPriceData(specificAssets = null) {
    // 检查是否已有同步任务在进行
    if (this.constructor.syncInProgress) {
      logger.warn('Price synchronization already in progress, skipping');
      return { success: false, message: '价格同步正在进行中，请稍后再试' };
    }

    this.constructor.syncInProgress = true;
    logger.info('Starting price data synchronization');

    try {
      let assetsToSync = [];

      if (specificAssets && Array.isArray(specificAssets) && specificAssets.length > 0) {
        // 使用前端传递的特定资产列表
        assetsToSync = specificAssets.filter(asset => asset.code && asset.assetType);
        logger.info(`Syncing specific assets from frontend: ${assetsToSync.length} assets`);
      } else {
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

        assetsToSync = Array.from(uniqueAssets.values());
      }

      if (assetsToSync.length === 0) {
        logger.info('No assets to sync');
        return { success: true, message: '没有需要同步的资产' };
      }

      logger.info(`Found ${assetsToSync.length} assets to sync`);

      // 串行同步每个资产的价格，添加延迟避免API限制
      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;
      const skippedAssets = [];
      const timestamp = new Date().toISOString();

      for (let i = 0; i < assetsToSync.length; i++) {
        const asset = assetsToSync[i];

        try {
          logger.info(
            `Syncing asset ${i + 1}/${assetsToSync.length}: ${asset.code} (${asset.assetType})`
          );

          const price = await this.fetchLatestPrice(asset.code, asset.assetType);

          if (price > 0) {
            // 保存价格到数据库
            await this.priceDao.createPriceData(asset.code, asset.assetType, price, timestamp);
            successCount++;
            logger.info(`Synced price for ${asset.code}: ${price}`);
          } else {
            // 价格获取失败，检查是否有历史价格数据
            const existingPrice = await this.priceDao.getLatestPrice(asset.code, asset.assetType);

            if (existingPrice > 0) {
              // 有历史价格，说明可能是期货合约已过期，跳过更新，保留最后有效价格
              skippedCount++;
              skippedAssets.push(asset.code);
              logger.info(
                `Skipped expired/inactive asset ${asset.code}, keeping last price: ${existingPrice}`
              );
            } else {
              // 没有历史价格，记录为真正的失败
              failCount++;
              logger.warn(`Failed to fetch price for ${asset.code}, no historical data available`);
            }
          }
        } catch (error) {
          // 发生错误时也检查是否有历史价格
          const existingPrice = await this.priceDao.getLatestPrice(asset.code, asset.assetType);

          if (existingPrice > 0) {
            skippedCount++;
            skippedAssets.push(asset.code);
            logger.info(
              `Skipped asset ${asset.code} due to error, keeping last price: ${existingPrice}`
            );
          } else {
            failCount++;
            logger.error(`Error syncing price for ${asset.code}:`, error);
          }
        }

        // 添加延迟，避免API请求过于频繁（除了最后一个）
        // 使用随机抖动机制应对akshare反爬机制：1-3秒随机延迟
        if (i < assetsToSync.length - 1) {
          const baseDelay = 1000; // 基础延迟1秒
          const jitter = Math.random() * 2000; // 0-2秒随机抖动
          const totalDelay = baseDelay + jitter; // 总延迟1-3秒

          logger.debug(
            `Waiting ${Math.round(totalDelay)}ms before next request to avoid anti-crawling`
          );
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
      }

      const summaryParts = [`成功 ${successCount} 个`];
      if (skippedCount > 0) {
        summaryParts.push(`跳过 ${skippedCount} 个`);
      }
      if (failCount > 0) {
        summaryParts.push(`失败 ${failCount} 个`);
      }

      logger.info(
        `Price sync completed: ${successCount} success, ${skippedCount} skipped, ${failCount} failed`
      );
      if (skippedAssets.length > 0) {
        logger.info(`Skipped assets (possibly expired): ${skippedAssets.join(', ')}`);
      }

      return {
        success: true,
        message: `价格同步完成：${summaryParts.join('，')}`,
        details: {
          total: assetsToSync.length,
          success: successCount,
          skipped: skippedCount,
          skippedAssets: skippedAssets,
          failed: failCount,
        },
      };
    } catch (error) {
      logger.error('Price sync failed:', error);
      return {
        success: false,
        message: '同步价格数据失败: ' + error.message,
        details: {
          total: 0,
          success: 0,
          skipped: 0,
          failed: 0,
        },
      };
    } finally {
      // 确保同步锁被释放
      PriceService.syncInProgress = false;
      logger.info('Price synchronization lock released');
    }
  }
}

// 默认导出实例
const priceDao = require('../dao/priceDao');
module.exports = new PriceService(priceDao);
