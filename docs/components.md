# 组件使用文档

## UserFundPosition组件

### 功能描述
用户资金与持仓展示组件，显示用户的资金余额、持仓明细和交易记录。

### 使用方法
```jsx
import UserFundPosition from '../components/UserFundPosition';

function App() {
  return (
    <UserFundPosition />
  );
}
```

### Props
无

### 状态管理
- `fundInfo`: 资金信息，包括余额和最近的资金流水
- `positions`: 持仓信息列表
- `loading`: 加载状态
- `consolidatedPositions`: 整合后的持仓信息
- `tradeHistory`: 交易历史记录

## FundManagement组件

### 功能描述
资金管理组件，管理员可以为用户设置初始资金、追加资金或取出资金。

### 使用方法
```jsx
import FundManagement from '../components/FundManagement';

function App() {
  return (
    <FundManagement />
  );
}
```

### Props
无

### 状态管理
- `users`: 用户列表
- `selectedUserId`: 选中的用户ID
- `balance`: 当前余额
- `operationType`: 操作类型（initial, deposit, withdraw）
- `amount`: 操作金额
- `remark`: 备注信息
- `logs`: 资金流水记录

## PositionManagement组件

### 功能描述
持仓管理组件，管理员可以为用户添加买入或卖出的持仓记录。

### 使用方法
```jsx
import PositionManagement from '../components/PositionManagement';

function App() {
  return (
    <PositionManagement />
  );
}
```

### Props
无

### 状态管理
- `users`: 用户列表
- `selectedUserId`: 选中的用户ID
- `positions`: 持仓记录
- `form`: 表单实例

## UserManagement组件

### 功能描述
用户管理组件，管理员可以查看、创建和删除用户。

### 使用方法
```jsx
import UserManagement from '../components/UserManagement';

function App() {
  return (
    <UserManagement />
  );
}
```

### Props
无

### 状态管理
- `users`: 用户列表
- `showCreateForm`: 是否显示创建用户表单
- `newUser`: 新用户信息

## Login组件

### 功能描述
登录组件，用户可以通过输入用户名和密码进行登录。

### 使用方法
```jsx
import Login from '../components/Login';

function App() {
  return (
    <Login />
  );
}
```

### Props
无

### 状态管理
- `username`: 用户名
- `password`: 密码

## ChangePassword组件

### 功能描述
修改密码组件，用户可以修改自己的登录密码。

### 使用方法
```jsx
import ChangePassword from '../components/ChangePassword';

function App() {
  return (
    <ChangePassword />
  );
}
```

### Props
无

### 状态管理
- `currentPassword`: 当前密码
- `newPassword`: 新密码
- `confirmPassword`: 确认新密码