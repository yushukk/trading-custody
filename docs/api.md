# API文档

## 用户相关接口

### 用户登录
- **URL**: `/api/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "token": "string",
    "role": "string",
    "id": "number"
  }
  ```

### 更新用户密码
- **URL**: `/api/update-password`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "username": "string",
    "newPassword": "string"
  }
  ```
- **响应**:
  ```json
  {
    "message": "Password updated successfully"
  }
  ```

### 获取所有用户
- **URL**: `/api/users`
- **方法**: `GET`
- **响应**:
  ```json
  [
    {
      "id": "number",
      "name": "string",
      "email": "string",
      "password": "string",
      "role": "string"
    }
  ]
  ```

### 创建用户
- **URL**: `/api/users`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "string"
  }
  ```
- **响应**:
  ```json
  {
    "id": "number",
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "string"
  }
  ```

### 根据ID更新用户密码
- **URL**: `/api/users/:id/password`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "newPassword": "string"
  }
  ```
- **响应**:
  ```json
  {
    "message": "Password updated successfully"
  }
  ```

### 删除用户
- **URL**: `/api/users/:id`
- **方法**: `DELETE`
- **响应**:
  ```json
  {
    "message": "User deleted successfully"
  }
  ```

## 资金相关接口

### 获取用户资金余额
- **URL**: `/api/funds/:userId`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "user_id": "number",
    "balance": "number"
  }
  ```

### 获取资金流水
- **URL**: `/api/funds/:userId/logs`
- **方法**: `GET`
- **响应**:
  ```json
  [
    {
      "id": "number",
      "user_id": "number",
      "type": "string",
      "amount": "number",
      "remark": "string",
      "timestamp": "string"
    }
  ]
  ```

### 处理资金操作
- **URL**: `/api/funds/:userId/:type`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "amount": "number",
    "remark": "string"
  }
  ```
- **响应**:
  ```json
  {
    "message": "操作成功",
    "balance": "number"
  }
  ```

## 持仓相关接口

### 获取用户持仓
- **URL**: `/api/positions/:userId`
- **方法**: `GET`
- **响应**:
  ```json
  [
    {
      "id": "number",
      "user_id": "number",
      "asset_type": "string",
      "code": "string",
      "name": "string",
      "operation": "string",
      "price": "number",
      "quantity": "number",
      "timestamp": "string",
      "fee": "number"
    }
  ]
  ```

### 添加持仓操作
- **URL**: `/api/positions/:userId`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "assetType": "string",
    "code": "string",
    "name": "string",
    "operation": "string",
    "price": "number",
    "quantity": "number",
    "timestamp": "string",
    "fee": "number"
  }
  ```
- **响应**:
  ```json
  {
    "message": "操作成功",
    "id": "number"
  }
  ```

### 获取持仓收益
- **URL**: `/api/positions/profit/:userId`
- **方法**: `GET`
- **响应**:
  ```json
  [
    {
      "code": "string",
      "name": "string",
      "assetType": "string",
      "quantity": "number",
      "totalPnL": "number",
      "realizedPnL": "number",
      "unrealizedPnL": "number",
      "latestPrice": "number",
      "fee": "number"
    }
  ]
  ```

### 删除用户持仓
- **URL**: `/api/positions/delete/:userId`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "message": "成功清除用户{id}的{n}条交易记录"
  }
  ```

### 同步价格数据
- **URL**: `/api/syncPriceData`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "message": "价格数据同步任务已触发"
  }
  ```