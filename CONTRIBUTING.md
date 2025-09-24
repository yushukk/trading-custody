# 贡献指南

感谢您对 Trading Custody System 项目的兴趣！我们欢迎各种形式的贡献。

## 开发环境设置

1. Fork 项目仓库
2. 克隆您的 Fork：
   ```bash
   git clone https://github.com/your-username/trading-custody.git
   cd trading-custody
   ```
3. 安装依赖：
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```
4. 创建功能分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 代码规范

### JavaScript/JSX 规范
- 遵循 Airbnb JavaScript 风格指南
- 使用 ESLint 进行代码检查
- 函数和变量使用 camelCase 命名
- 组件和构造函数使用 PascalCase 命名

### CSS 规范
- 使用 CSS Modules 或 BEM 命名约定
- 优先使用 CSS 变量定义颜色和间距
- 避免使用内联样式

### Git 提交信息
- 使用清晰、简洁的提交信息
- 以动词开头（如：Add, Fix, Update, Remove）
- 首字母大写，使用现在时

## 开发流程

1. 确保您在正确的分支上工作
2. 编写代码并确保遵循项目规范
3. 添加或更新测试（如果适用）
4. 运行测试确保所有测试通过：
   ```bash
   npm test
   npm run test:server
   npm run test:e2e
   ```
5. 提交更改并推送您的分支
6. 创建 Pull Request

## 测试

### 单元测试
- 前端单元测试使用 Jest 和 React Testing Library
- 后端单元测试使用 Jest
- 新功能应包含相应的单元测试

### 集成测试
- API 集成测试位于 `server/tests/integration`
- 测试应覆盖主要的 API 端点

### 端到端测试
- 使用 Cypress 进行端到端测试
- 测试文件位于 `cypress/e2e`

## 报告问题

### Bug 报告
在提交 bug 报告时，请包含以下信息：
1. 清晰的描述问题
2. 重现步骤
3. 预期行为和实际行为
4. 环境信息（操作系统、浏览器、Node.js 版本等）
5. 相关的截图或错误日志

### 功能请求
我们欢迎功能请求！请提供：
1. 详细的功能描述
2. 解决的问题或满足的需求
3. 可能的实现方案（如果有的话）

## 代码审查

所有 Pull Request 都需要通过代码审查。审查时会关注：
- 代码质量和可读性
- 是否符合项目规范
- 测试覆盖率
- 文档更新

## 文档

- 更新相关文档以反映代码变更
- 新功能应包含使用说明
- API 变更应更新相应的 API 文档

## 问题和讨论

如有任何问题或需要讨论，请：
1. 查看现有的 Issues
2. 创建新的 Issue 进行讨论
3. 在相关 Issue 中进行交流

再次感谢您的贡献！