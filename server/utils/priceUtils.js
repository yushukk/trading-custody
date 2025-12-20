const http = require('http');
const config = require('../config');
const db = require('./database');

/**
 * 从数据库获取最新价格
 * @param {string} code - 资产代码
 * @param {string} asset_type - 资产类型
 * @returns {Promise<number>} 最新价格Promise
 */
function getDbLatestPrice(code, asset_type) {
  return new Promise(resolve => {
    db.get(
      'SELECT current_price FROM price_data WHERE code = ? AND asset_type = ?',
      [code, asset_type],
      (err, row) => {
        if (err) {
          console.error(`数据库查询失败 ${code}(${asset_type}):`, err.message);
          resolve(0); // 出错时返回 0
        } else {
          resolve(parseFloat(row?.current_price) || 0);
        }
      }
    );
  });
}

/**
 * 从外部API获取最新价格
 * @param {string} code - 资产代码
 * @param {string} asset_type - 资产类型
 * @returns {Promise<number>} 最新价格Promise
 */
async function getLatestPrice(code, asset_type) {
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

/**
 * 同步价格数据
 */
function syncPriceData() {
  console.log('开始同步最新价格数据...');

  db.all('SELECT DISTINCT code, asset_type FROM positions', [], async (err, rows) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return;
    }

    for (const row of rows) {
      try {
        console.log(`正在获取 ${row.code}(${row.asset_type}) 的最新价格...`); // 新增开始日志
        const latestPrice = await getLatestPrice(row.code, row.asset_type);

        if (latestPrice <= 0) {
          console.warn(`无效价格跳过更新 ${row.code}: ${latestPrice}`); // 新增警告
          continue;
        }

        db.run(
          'INSERT OR REPLACE INTO price_data (code, asset_type, current_price) VALUES (?, ?, ?)',
          [row.code, row.asset_type, latestPrice],
          function (err) {
            if (err) {
              console.error(`价格更新失败 ${row.code}(${row.asset_type}):`, err.message); // 新增详细错误
            } else {
              console.log(`价格更新成功 ${row.code}: ${latestPrice}`); // 新增成功日志
            }
          }
        );
      } catch (error) {
        console.error(`处理异常 ${row.code}(${row.asset_type}):`, error.message); // 新增错误处理
      }
    }
  });
}

module.exports = {
  getDbLatestPrice,
  getLatestPrice,
  syncPriceData,
};
