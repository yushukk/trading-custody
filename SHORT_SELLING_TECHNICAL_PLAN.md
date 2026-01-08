# 空仓（做空）功能技术方案

## 一、需求概述

当前系统不支持持有空仓，本次需求需要添加空仓（做空）功能。**使用负数数量表示空仓**，所有资产类型（股票、期货、基金）都支持做空，不做资产类型限制。

### 业务规则
- **空仓表示方式**：持有负数数量的资产表示空仓
- **做空操作**：卖出操作在没有持仓或持仓不足时，形成空仓（负数持仓）
- **平空操作**：买入操作可以平掉空仓，使负数持仓趋向于0或转为正数持仓
- **所有资产支持**：股票、期货、基金都可以做空

## 二、现状分析

### 2.1 当前限制点

通过代码分析，发现以下位置存在数量必须为正数的限制：

1. **后端验证层**
   - `server/services/positionService.js` (第50行)
     - 验证：`parsedQuantity <= 0` 时抛出错误
   - `server/utils/errorCodes.js` (第21行)
     - 错误码：`POSITION_005` - "数量必须为正数"

2. **后端盈亏计算逻辑**
   - `server/services/positionService.js` (第73-158行)
     - `calculatePositionProfit()` 方法使用队列算法（FIFO）计算盈亏
     - 当前逻辑假设：买入增加持仓，卖出减少持仓
     - **不支持负数持仓的盈亏计算**

3. **前端展示层**
   - `src/components/UserFundPosition.jsx` (第504行)
     - 成本展示：`position.quantity > 0 ? ... : '-'`（负数时不显示成本）
   
4. **数据库层**
   - `server/migrations/000_init_database.sql` (第53行)
     - `quantity INTEGER NOT NULL` - 定义为整数类型，支持负数，无需修改

5. **测试层**
   - `server/tests/unit/positionService.test.js` (第108-119行)
     - 测试用例验证负数数量会抛出错误

### 2.2 核心业务逻辑

**当前盈亏计算逻辑（FIFO队列）**：
- 买入：将持仓加入队列 `queue.push({ price, quantity })`
- 卖出：从队列头部依次取出持仓进行匹配，计算已实现盈亏
- 未实现盈亏：队列剩余持仓 × (最新价格 - 平均成本)

**问题**：该逻辑无法处理空仓场景（负数持仓）

## 三、技术方案

### 3.1 设计思路

采用**扩展现有队列算法**的方式，支持多空双向持仓计算：

1. **持仓状态分类**
   - 正数持仓：多头仓位（持有资产）
   - 负数持仓：空头仓位（借入并卖出资产）
   - 零持仓：无持仓

2. **操作语义调整**
   - **买入(buy)**
     - 有空仓：平空仓（减少负数持仓，向0靠近）
     - 无空仓：开多仓或加多仓（增加正数持仓）
   
   - **卖出(sell)**
     - 有多仓：平多仓（减少正数持仓，向0靠近）
     - 无多仓：开空仓或加空仓（增加负数持仓）

3. **盈亏计算调整**
   - **多仓盈亏**：(卖出价 - 买入价) × 数量 - 手续费
   - **空仓盈亏**：(开空价 - 平空价) × 数量 - 手续费
   - **未实现盈亏**
     - 多仓：剩余数量 × (最新价 - 平均成本)
     - 空仓：剩余数量 × (平均开空价 - 最新价)（注意符号）

### 3.2 改造方案

#### 方案一：双队列法（推荐）✅

**核心思想**：维护两个独立的队列，分别处理多仓和空仓

```javascript
const longQueue = [];  // 多仓队列：存储买入的持仓
const shortQueue = []; // 空仓队列：存储卖出（做空）的持仓

// 处理买入操作
if (operation === 'buy') {
  // 1. 先平空仓
  if (shortQueue.length > 0) {
    // 平空逻辑：计算平空盈亏 = (开空价 - 平空价) × 数量
  }
  // 2. 剩余数量开多仓
  if (remaining > 0) {
    longQueue.push({ price, quantity: remaining });
  }
}

// 处理卖出操作
if (operation === 'sell') {
  // 1. 先平多仓
  if (longQueue.length > 0) {
    // 平多逻辑：计算平多盈亏 = (卖出价 - 买入价) × 数量
  }
  // 2. 剩余数量开空仓
  if (remaining > 0) {
    shortQueue.push({ price, quantity: remaining });
  }
}

// 计算当前持仓数量
const currentQuantity = 
  longQueue.reduce((sum, item) => sum + item.quantity, 0) -
  shortQueue.reduce((sum, item) => sum + item.quantity, 0);

// 计算未实现盈亏
if (currentQuantity > 0) {
  // 多仓未实现盈亏
  unrealizedPnL = longQueue中的计算...
} else if (currentQuantity < 0) {
  // 空仓未实现盈亏（注意符号）
  unrealizedPnL = shortQueue中的计算...
}
```

**优点**：
- 逻辑清晰，易于理解和维护
- 多空仓位分离，不会混淆
- 盈亏计算准确
- 扩展性好

**缺点**：
- 代码改动相对较大

### 3.3 需要修改的文件清单

#### 后端修改（7个文件）

1. **`server/services/positionService.js`** ⭐⭐⭐
   - 移除数量必须为正数的验证（第50-52行）
   - 重写 `calculatePositionProfit()` 方法，实现双队列算法（第73-158行）

2. **`server/utils/errorCodes.js`** ⭐
   - 修改 `POSITION_005` 错误码描述（第21行）
   - 从"数量必须为正数"改为"数量不能为0"或"数量格式错误"

3. **`server/tests/unit/positionService.test.js`** ⭐⭐
   - 修改现有测试用例（移除负数验证测试）
   - 新增空仓场景测试用例：
     - 卖出开空仓
     - 买入平空仓
     - 多空转换
     - 空仓盈亏计算
     - 负数持仓展示

4. **`server/tests/integration/positionApi.test.js`** ⭐
   - 新增集成测试用例：完整的做空流程测试

5. **`docs/api.md`** ⭐
   - 更新持仓管理API文档
   - 说明支持负数持仓（空仓）

#### 前端修改（4个文件）

6. **`src/components/UserFundPosition.jsx`** ⭐⭐
   - 修改成本价显示逻辑（第504行）
     - 当前：`position.quantity > 0 ? ... : '-'`
     - 修改后：同时支持多仓和空仓的成本显示
   - 修改持仓数量显示（第451行）
     - 负数显示为红色并加上"空"字标识
   - 修改盈亏颜色逻辑（第473行）
     - 空仓盈亏颜色：价格下跌为盈利（红色），上涨为亏损（绿色）

7. **`src/components/PositionManagement.jsx`** ⭐
   - 更新添加持仓表单的验证提示
   - 数量输入框支持负数输入（可选：或保持正数，通过操作类型来决定正负）

8. **`src/hooks/usePosition.js`** ⭐
   - 确保能正确处理负数数量的持仓数据

#### 测试修改（2个文件）

9. **`tests/cypress/e2e/positionManagement.cy.js`** ⭐
   - 新增E2E测试：做空流程完整测试

10. **`tests/cypress/e2e/userDashboard.cy.js`** ⭐
    - 新增E2E测试：用户查看空仓持仓

#### 文档修改（3个文件）

11. **`docs/CODING_STANDARDS.md`** （可选）
    - 补充空仓业务逻辑说明

12. **`README.md`** ⭐
    - 更新功能说明，标注支持做空功能

13. **`SHORT_SELLING_TECHNICAL_PLAN.md`**（本文件）
    - 技术方案文档

## 四、实施计划

### 4.1 开发步骤

**阶段一：后端核心逻辑开发**（优先级最高）
1. ✅ 创建功能分支：`feature/short-selling-support`
2. ✅ 编写技术方案文档
3. 修改后端验证逻辑（移除正数限制）
4. 重写盈亏计算逻辑（双队列算法）
5. 运行单元测试，修复失败的测试

**阶段二：测试用例开发**
6. 编写空仓场景单元测试
7. 编写集成测试
8. 运行所有测试，确保通过

**阶段三：前端展示层开发**
9. 修改持仓展示组件
10. 修改持仓管理组件
11. 手动测试前端功能

**阶段四：E2E测试**
12. 编写E2E测试用例
13. 运行E2E测试

**阶段五：文档更新和发布**
14. 更新API文档
15. 更新README
16. 代码审查
17. 合并到主分支

### 4.2 测试用例设计

#### 单元测试用例

**`positionService.test.js`**

1. ✅ ~~应该拒绝负数数量~~ → 删除此测试
2. **新增**：应该接受负数数量（卖出开空仓）
3. **新增**：卖出超过持仓数量，形成空仓
4. **新增**：买入平空仓，减少空仓数量
5. **新增**：买入完全平掉空仓
6. **新增**：买入超过空仓数量，形成多仓
7. **新增**：多仓 → 空仓 → 多仓的完整流程
8. **新增**：空仓盈亏计算正确性
9. **新增**：空仓未实现盈亏计算正确性
10. **新增**：混合交易（多空频繁切换）的盈亏计算

#### 集成测试用例

**`positionApi.test.js`**

1. **新增**：POST /api/positions/:userId - 创建空仓（卖出操作）
2. **新增**：GET /api/positions/profit/:userId - 返回正确的空仓持仓数量（负数）
3. **新增**：完整做空流程：卖出开空 → 价格变动 → 买入平空 → 验证盈亏

#### E2E测试用例

**`positionManagement.cy.js`**

1. **新增**：管理员添加空仓交易记录
2. **新增**：空仓记录在列表中正确显示

**`userDashboard.cy.js`**

1. **新增**：用户查看空仓持仓明细
2. **新增**：空仓盈亏正确显示
3. **新增**：空仓成本价正确显示

### 4.3 风险评估

| 风险项 | 风险等级 | 应对措施 |
|--------|---------|---------|
| 盈亏计算逻辑复杂，容易出错 | 高 | 编写详细的单元测试，覆盖各种边界场景 |
| 现有功能回归问题 | 中 | 运行完整的测试套件，确保所有测试通过 |
| 前端展示逻辑遗漏 | 中 | 手动测试所有相关页面 |
| 性能影响 | 低 | 双队列算法复杂度仍为O(n)，无明显性能影响 |
| 数据库迁移 | 无 | 数据库字段已支持负数，无需迁移 |

### 4.4 回滚方案

如果上线后发现重大问题，可以通过以下方式回滚：

1. **代码回滚**：切换回主分支，重新部署
2. **数据兼容性**：新功能向后兼容，旧数据（全是正数）仍可正常工作
3. **数据清理**：如有负数持仓数据需要清理，可通过SQL查询：
   ```sql
   -- 查询所有空仓记录
   SELECT * FROM positions WHERE quantity < 0;
   
   -- 如需删除（谨慎操作）
   DELETE FROM positions WHERE quantity < 0;
   ```

## 五、关键代码示例

### 5.1 双队列盈亏计算算法（伪代码）

```javascript
async calculatePositionProfit(userId) {
  const transactions = await this.positionDao.findByUserId(userId);
  const positionsMap = {};
  
  // 按资产代码分组
  transactions.forEach(tx => {
    if (!positionsMap[tx.code]) positionsMap[tx.code] = [];
    positionsMap[tx.code].push(tx);
  });

  const results = [];

  for (const [code, transactions] of Object.entries(positionsMap)) {
    let realizedPnL = 0;
    let totalFee = 0;
    const longQueue = [];   // 多仓队列
    const shortQueue = [];  // 空仓队列

    transactions.forEach(tx => {
      const { operation, price, quantity, fee = 0 } = tx;
      totalFee += fee;

      if (operation === 'buy') {
        let remaining = quantity;
        
        // 1. 先平空仓
        while (remaining > 0 && shortQueue.length > 0) {
          const head = shortQueue[0];
          const tradeQty = Math.min(head.quantity, remaining);
          
          // 空仓盈亏 = (开空价 - 平空价) × 数量
          const pnl = (head.price - price) * tradeQty;
          realizedPnL += pnl;
          
          remaining -= tradeQty;
          head.quantity -= tradeQty;
          if (head.quantity === 0) shortQueue.shift();
        }
        
        // 2. 剩余数量开多仓
        if (remaining > 0) {
          longQueue.push({ price, quantity: remaining });
        }
        
      } else if (operation === 'sell') {
        let remaining = quantity;
        
        // 1. 先平多仓
        while (remaining > 0 && longQueue.length > 0) {
          const head = longQueue[0];
          const tradeQty = Math.min(head.quantity, remaining);
          
          // 多仓盈亏 = (卖出价 - 买入价) × 数量
          const pnl = (price - head.price) * tradeQty;
          realizedPnL += pnl;
          
          remaining -= tradeQty;
          head.quantity -= tradeQty;
          if (head.quantity === 0) longQueue.shift();
        }
        
        // 2. 剩余数量开空仓
        if (remaining > 0) {
          shortQueue.push({ price, quantity: remaining });
        }
      }
    });

    // 减去总手续费
    realizedPnL -= totalFee;

    // 计算当前持仓数量（正数=多仓，负数=空仓）
    const longQty = longQueue.reduce((sum, item) => sum + item.quantity, 0);
    const shortQty = shortQueue.reduce((sum, item) => sum + item.quantity, 0);
    const currentQuantity = longQty - shortQty;

    // 获取最新价格
    const latestPrice = await this.priceService.getLatestPrice(
      code, 
      transactions[0].assetType
    );

    // 计算未实现盈亏
    let unrealizedPnL = 0;
    if (longQty > 0) {
      // 多仓未实现盈亏
      const totalCost = longQueue.reduce((sum, item) => 
        sum + item.price * item.quantity, 0
      );
      const avgCost = totalCost / longQty;
      unrealizedPnL += longQty * (latestPrice - avgCost);
    }
    if (shortQty > 0) {
      // 空仓未实现盈亏（注意符号）
      const totalShortRevenue = shortQueue.reduce((sum, item) => 
        sum + item.price * item.quantity, 0
      );
      const avgShortPrice = totalShortRevenue / shortQty;
      unrealizedPnL += shortQty * (avgShortPrice - latestPrice);
    }

    results.push({
      code,
      name: transactions[0].name,
      assetType: transactions[0].assetType,
      quantity: currentQuantity,  // 可能为负数
      totalPnL: realizedPnL + unrealizedPnL,
      realizedPnL,
      unrealizedPnL,
      latestPrice,
      fee: totalFee,
    });
  }

  return results;
}
```

### 5.2 前端展示逻辑

```jsx
// UserFundPosition.jsx
// 数量显示
<div style={{
  fontSize: '15px',
  fontWeight: 500,
  color: position.quantity >= 0 ? '#333' : '#f5222d', // 负数用红色
}}>
  {position.quantity >= 0 ? position.quantity : `${position.quantity} 空`}
</div>

// 成本价显示
<div>
  现价: ¥{position.price.toFixed(2)} | 成本: 
  {position.quantity !== 0 
    ? `¥${position.costBasis.toFixed(2)}`
    : '-'
  }
</div>

// 盈亏颜色（多空一致：盈利红色，亏损绿色）
<div style={{
  color: position.totalPnL >= 0 ? '#f5222d' : '#52c41a',
}}>
  ¥{position.totalPnL.toFixed(2)}
</div>
```

## 六、验收标准

### 6.1 功能验收

- [ ] 可以创建空仓（卖出操作在无持仓时形成负数持仓）
- [ ] 可以平空仓（买入操作减少空仓数量）
- [ ] 空仓盈亏计算正确
  - [ ] 价格下跌时空仓盈利
  - [ ] 价格上涨时空仓亏损
- [ ] 前端正确显示负数持仓
- [ ] 前端正确显示空仓成本价
- [ ] 前端正确显示空仓盈亏
- [ ] 支持多空频繁切换
- [ ] 所有资产类型（股票、期货、基金）都可以做空

### 6.2 测试验收

- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 所有E2E测试通过
- [ ] 测试覆盖率 > 80%

### 6.3 性能验收

- [ ] 盈亏计算接口响应时间 < 500ms
- [ ] 持仓列表加载时间 < 1s

### 6.4 兼容性验收

- [ ] 现有多仓功能不受影响
- [ ] 旧数据（全是正数）正常工作
- [ ] 不同浏览器正常显示

## 七、总结

本方案采用**双队列算法**支持多空双向持仓，核心思想是：
1. 用两个独立队列分别管理多仓和空仓
2. 买入操作优先平空仓，剩余开多仓
3. 卖出操作优先平多仓，剩余开空仓
4. 当前持仓 = 多仓总量 - 空仓总量（可能为负数）

该方案具有以下优点：
- ✅ 逻辑清晰，易于理解
- ✅ 盈亏计算准确
- ✅ 向后兼容，不影响现有功能
- ✅ 扩展性好，易于维护

预计开发时间：**2-3个工作日**
- 后端开发：1天
- 测试开发：0.5天
- 前端开发：0.5天
- 联调测试：1天

---

**文档版本**：v1.0  
**创建时间**：2026-01-08  
**创建人**：AI Assistant  
**分支名称**：feature/short-selling-support
