# Dream Making 小程序 🎨

一个基于微信小程序的AI图片生成应用，使用Coze工作流API实现智能图片生成功能。

## 🌟 功能特性

- **智能图片生成**: 基于文本描述生成精美图片
- **随机抽卡模式**: 支持随机生成模式
- **响应式设计**: 适配各种屏幕尺寸
- **错误处理**: 完善的错误处理和用户提示
- **请求重试**: 智能重试机制，提高成功率
- **性能优化**: 请求频率控制和超时处理

## 🛠️ 技术栈

- **前端**: 微信小程序原生开发
- **API**: Coze工作流API
- **语言**: JavaScript/WXML/WXSS
- **工具**: 微信开发者工具

## 📁 项目结构

```
Dream_making/
├── pages/                  # 页面文件
│   └── index/              # 主页面
│       ├── index.js        # 页面逻辑
│       ├── index.json      # 页面配置
│       ├── index.wxml      # 页面结构
│       └── index.wxss      # 页面样式
├── components/             # 自定义组件
│   └── navigation-bar/     # 导航栏组件
├── assets/                 # 静态资源
├── test/                   # 测试文件
│   ├── api-request-improved-test.js    # API改进测试
│   ├── error-fix-verification.js       # 错误修复验证
│   ├── coze-api-test.js               # Node.js环境测试
│   └── miniprogram-api-test.js        # 小程序环境测试
├── app.js                  # 小程序入口文件
├── app.json               # 全局配置
├── app.wxss               # 全局样式
└── project.config.json    # 项目配置
```

## 🚀 快速开始

### 环境要求

- 微信开发者工具
- 有效的Coze API Token
- 微信小程序开发者账号

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/Kenneth-cs/Dream-marking.git
   cd Dream-marking
   ```

2. **配置API**
   - 打开 `pages/index/index.js`
   - 在 `API_CONFIG` 中更新你的API Token:
   ```javascript
   API_CONFIG: {
     AUTH_TOKEN: 'Bearer your_api_token_here',
     // 其他配置...
   }
   ```

3. **导入项目**
   - 打开微信开发者工具
   - 选择"导入项目"
   - 选择项目目录并填写AppID

4. **运行项目**
   - 点击"编译"按钮
   - 在模拟器中预览效果

## 🔧 API配置

### Coze工作流配置

```javascript
API_CONFIG: {
  BASE_URL: 'https://api.coze.cn/v1/workflow/run',
  WORKFLOW_ID: 'your_workflow_id',
  APP_ID: 'your_app_id',
  AUTH_TOKEN: 'Bearer your_token',
  TIMEOUT: 30000,
  MAX_RETRIES: 3
}
```

### 请求参数

- `workflow_id`: Coze工作流ID
- `app_id`: 应用ID
- `parameters.input`: 用户输入的提示词
- `is_async`: 是否异步执行（默认false）

## 🧪 测试

项目包含多个测试文件用于验证功能：

### 运行小程序环境测试

在微信开发者工具控制台中运行：

```javascript
const test = require('./test/miniprogram-api-test.js');
test.testMiniprogramAPI();
```

### 运行综合测试

```javascript
test.runComprehensiveTest();
```

### Node.js环境测试

```bash
node test/coze-api-test.js
```

## 🔄 最近更新

### v2.0.0 (2025-11-14)

**🔧 重大改进**
- **API请求重构**: 完全重构了API请求架构，提高稳定性和可维护性
- **错误处理增强**: 智能错误分类和用户友好提示
- **响应解析优化**: 支持多种API响应格式，提高兼容性

**🐛 问题修复**
- 修复User-Agent头部设置导致的请求失败
- 修复API响应格式解析错误
- 修复ES6模块语法兼容性问题

**✨ 新功能**
- 添加智能重试机制
- 添加请求性能监控
- 添加详细的日志记录
- 添加多种测试环境支持

## 📊 功能特点

### 智能重试机制

- **频率限制**: 遇到429错误时递增延迟重试
- **网络错误**: 网络问题时自动重试
- **认证错误**: 认证失败不重试，避免无效请求

### 响应格式兼容

支持多种API响应格式：
- 标准格式: `{msg: 'Success', data: '...'}`
- 新格式: `{code: 0, data: {...}}`
- 直接数据格式
- 嵌套结果格式

### 错误处理

- 频率限制 → "请求过于频繁，请稍后再试"
- 认证失败 → "API认证失败，请检查token"
- 网络错误 → "网络连接异常，请检查网络后重试"
- 响应异常 → "API响应格式异常，请稍后重试"

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 开发日志

### 问题解决记录

1. **User-Agent头部问题**
   - 问题: `Refused to set unsafe header "User-Agent"`
   - 解决: 移除微信小程序不支持的User-Agent头部

2. **API响应解析问题**
   - 问题: `API响应格式无效，未获取到图片URL`
   - 解决: 增强响应解析逻辑，支持多种数据格式

3. **ES6模块兼容性**
   - 问题: `Cannot use 'import.meta' outside a module`
   - 解决: 转换为CommonJS格式，创建小程序专用测试文件

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- GitHub: [@Kenneth-cs](https://github.com/Kenneth-cs)
- 项目链接: [https://github.com/Kenneth-cs/Dream-marking](https://github.com/Kenneth-cs/Dream-marking)

## 🙏 致谢

- 感谢 Coze 提供的AI工作流API
- 感谢微信小程序平台
- 感谢所有贡献者和测试用户

---

⭐ 如果这个项目对你有帮助，请给它一个星标！