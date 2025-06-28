# Trading Custody System

## 简介
基于React和Express的交易与托管管理系统，支持用户登录、资金管理、持仓管理及管理员功能。

## 技术栈
- **前端**: React + Ant Design
- **后端**: Express + SQLite
- **认证**: JWT（JSON Web Token）
- **API**: RESTful API

## 核心功能
1. **用户系统**
   - 登录认证（用户名/密码）
   - 密码修改
   - 用户角色（普通用户/管理员）

2. **资金管理**
   - 设置初始资金
   - 追加/取出资金
   - 实时余额显示
   - 资金流水记录

3. **持仓管理**
   - 添加股票/期货/基金持仓
   - 买入/卖出操作
   - 持仓记录展示

4. **管理员功能**
   - 用户管理（增删改查）
   - 所有资金/持仓数据访问权限

## 运行步骤
1. 安装依赖
   ```bash
   npm install
   cd server
   npm install

wget https://raw.githubusercontent.com/yushukk/trading-custody/refs/heads/login/deploy_backend.sh

npx kill-port 3001