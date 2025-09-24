# 变更日志

所有针对 Trading Custody System 的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，
版本控制遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [Unreleased]

### 新增
- 添加了完整的开源项目文档
- 添加了贡献指南
- 添加了行为准则
- 添加了变更日志

### 修改
- 重构了 README 文件，使其更符合开源项目标准
- 优化了 CSS 结构和组织
- 改进了组件样式管理

### 修复
- 修复了样式文件中的重复代码
- 清理了未使用的 CSS 类

## [1.0.0] - 2025-09-23

### 新增
- 初始版本发布
- 用户认证系统（JWT）
- 资金管理功能
- 持仓管理功能
- 管理员后台系统
- 响应式前端界面
- 完整的测试套件（单元测试、集成测试、端到端测试）

### 技术特性
- 前端：React + Ant Design + React Router
- 后端：Express + SQLite
- 认证：JWT
- 测试：Jest + Cypress
- 构建工具：Create React App + Concurrently