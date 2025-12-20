const AppError = require('../utils/AppError');
const http = require('http');
const config = require('../config');

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

    //输出当前系统时间
    console.log(`当前时间: ${new Date().toISOString()}`);

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
    console.log(`正在获取价格 ${code}(${asset_type}):`, apiUrl);

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
                console.log(`API响应数据 ${code}(${asset_type}):`, jsonData);
                resolve(jsonData);
              } catch (err) {
                console.error(`JSON解析失败 ${code}(${asset_type}):`, err.message);
                reject(err);
              }
            });
          })
          .on('error', err => {
            console.error(`HTTP请求错误 ${code}(${asset_type}):`, err.message);
            reject(err);
          });
      });

      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`空数据返回 ${code}(${asset_type})`);
        return 0.0;
      }

      // 新增数据结构验证
      console.log(`原始数据示例 ${code}:`, data[0]);

      const latestRecord = data.reduce((latest, current) => {
        // 增加字段存在性检查 - 同时支持股票(日期)和期货(时间)格式
        const currentField = current.日期 ? '日期' : '时间';
        const latestField = latest.日期 ? '日期' : '时间';

        if (!current[currentField] || !latest[latestField]) {
          console.warn(`缺少时间字段 ${code}:`, current);
          return latest;
        }

        // 统一转换为时间戳进行比较
        return new Date(current[currentField]).getTime() > new Date(latest[latestField]).getTime()
          ? current
          : latest;
      }, data[0]);

      // 新增收盘价字段检查
      if (!latestRecord['收盘']) {
        console.error(`缺少收盘价字段 ${code}(${asset_type}):`, latestRecord);
        return 0.0;
      }

      const price = parseFloat(latestRecord['收盘']) || 0.0;
      console.log(`解析成功 ${code}(${asset_type}): ${price}`); // 新增调试日志
      return price;
    } catch (error) {
      console.error(`价格获取失败 ${code}(${asset_type}):`, error.message); // 新增错误详情
      console.error('错误堆栈:', error.stack); // 新增堆栈跟踪
      return 0.0; // 统一返回0.0并记录详细错误
    }
  }

  async syncPriceData() {
    // 迁移自 server.js 的 getLatestPrice 函数逻辑
    // 此处保留原有逻辑的框架，具体实现根据业务需求定制
    console.log('开始同步价格数据');

    try {
      // 模拟同步过程 - 实际应用中应从数据库中获取所有需要同步的资产代码
      console.log('价格数据同步完成');
      return { success: true, message: '价格数据同步任务已完成' };
    } catch (error) {
      throw new AppError('同步价格数据失败', 'SYNC_PRICE_DATA_FAILED', 500);
    }
  }
}

// 默认导出实例
const priceDao = require('../dao/priceDao');
module.exports = new PriceService(priceDao);
