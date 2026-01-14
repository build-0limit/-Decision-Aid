# 配置中心使用指南

## 📖 概述

配置中心允许你轻松管理 LLM API 配置，无需修改代码或环境变量。所有配置都保存在浏览器的 localStorage 中，下次访问时自动加载。

## 🚀 快速开始

### 1. 打开配置中心

点击页面右上角的 **⚙️ 配置** 按钮，打开配置模态框。

### 2. 选择服务商

从下拉菜单中选择你的 LLM 服务商：

#### 🎭 演示模式（默认）
- 无需 API Key
- 使用预设的模拟数据
- 适合快速体验和演示

#### 🤖 OpenAI
- 支持 GPT-4、GPT-4 Turbo、GPT-3.5 Turbo
- 需要 OpenAI API Key
- 获取地址：https://platform.openai.com/api-keys

#### 🧠 Anthropic Claude
- 支持 Claude 3 Opus、Sonnet、Haiku
- 需要 Anthropic API Key
- 获取地址：https://console.anthropic.com/

#### 🔧 自定义 API
- 支持任何兼容 OpenAI 格式的 API
- 需要提供完整的 API 端点 URL
- 适合使用代理或自建服务

### 3. 配置 API Key

1. 在 **API Key** 输入框中粘贴你的密钥
2. 点击眼睛图标可以显示/隐藏密钥
3. 配置会加密保存在本地浏览器中

### 4. 选择模型（可选）

根据你的需求选择合适的模型：

**OpenAI 模型：**
- **GPT-4**：最强大，适合复杂决策
- **GPT-4 Turbo**：速度更快，成本更低
- **GPT-3.5 Turbo**：快速且经济

**Anthropic 模型：**
- **Claude 3 Opus**：最强大的模型
- **Claude 3 Sonnet**：平衡性能和成本
- **Claude 3 Haiku**：最快速和经济

### 5. 调整 Temperature

使用滑块调整 Temperature 参数（0-2）：

- **0-0.5**：更精确、确定性强，适合需要一致性的决策
- **0.5-1.0**：平衡创造性和准确性（推荐）
- **1.0-2.0**：更有创造性，结果更多样化

### 6. 测试连接

配置完成后，点击 **🔍 测试连接** 按钮验证配置是否正确：

- ✅ 成功：显示绿色提示，可以保存配置
- ❌ 失败：显示红色错误信息，检查配置

### 7. 保存配置

1. 勾选"保存配置到本地"（推荐）
2. 点击 **💾 保存配置** 按钮
3. 配置会自动保存，下次访问时自动加载

## 🔐 安全性说明

### 本地存储
- API Key 保存在浏览器的 localStorage 中
- 数据仅存储在你的设备上
- 不会上传到任何服务器

### 建议
- 不要在公共电脑上保存 API Key
- 定期更换 API Key
- 使用完毕后可以清除浏览器数据

### 清除配置
如需清除保存的配置：
1. 打开配置中心
2. 取消勾选"保存配置到本地"
3. 保存配置
4. 或者清除浏览器的 localStorage

## 📋 配置示例

### OpenAI 配置
```
服务商：OpenAI
API Key：sk-proj-xxxxxxxxxxxxx
模型：GPT-4
Temperature：0.7
```

### Anthropic 配置
```
服务商：Anthropic Claude
API Key：sk-ant-xxxxxxxxxxxxx
模型：Claude 3 Sonnet
Temperature：0.7
```

### 自定义 API 配置
```
服务商：自定义 API
API Key：your-api-key
API 端点：https://api.example.com/v1/chat/completions
模型：your-model-name
Temperature：0.7
```

## 🐛 常见问题

### Q: 测试连接失败怎么办？
A: 检查以下几点：
- API Key 是否正确
- 网络连接是否正常
- API 端点 URL 是否正确（自定义 API）
- 账户是否有足够的额度

### Q: 配置保存后不生效？
A: 尝试：
- 刷新页面
- 清除浏览器缓存
- 重新保存配置

### Q: 可以同时配置多个服务商吗？
A: 目前只能使用一个服务商，但可以随时切换。

### Q: API Key 会泄露吗？
A: API Key 只保存在你的浏览器本地，不会发送到我们的服务器。但请注意：
- 不要在公共电脑上保存
- 不要截图分享配置界面
- 定期更换 API Key

### Q: 演示模式和真实 API 有什么区别？
A: 
- **演示模式**：使用预设的决策树模板，响应快，无成本
- **真实 API**：AI 动态生成决策树，更智能，更个性化

### Q: 如何获取 API Key？
A: 
- **OpenAI**：访问 https://platform.openai.com/api-keys
- **Anthropic**：访问 https://console.anthropic.com/
- **其他服务**：查看对应服务商的文档

## 💡 最佳实践

### 1. 选择合适的模型
- 简单决策：使用 GPT-3.5 或 Claude Haiku
- 复杂决策：使用 GPT-4 或 Claude Opus
- 平衡选择：使用 GPT-4 Turbo 或 Claude Sonnet

### 2. 调整 Temperature
- 需要一致性：0.3-0.5
- 日常使用：0.7（推荐）
- 需要创意：1.0-1.5

### 3. 成本控制
- 使用演示模式进行测试
- 选择经济型模型（GPT-3.5、Claude Haiku）
- 设置 API 使用限额

### 4. 安全建议
- 使用环境变量（生产环境）
- 定期轮换 API Key
- 监控 API 使用情况

## 🔄 配置迁移

### 从环境变量迁移
如果之前使用 `.env` 文件配置：
1. 打开配置中心
2. 手动输入相同的配置
3. 保存配置
4. 删除 `.env` 文件（可选）

### 导出配置
目前不支持导出配置文件，但你可以：
1. 截图保存配置（注意隐藏 API Key）
2. 手动记录配置参数

## 📞 获取帮助

如果遇到问题：
1. 查看本指南的常见问题部分
2. 检查浏览器控制台的错误信息
3. 查看 LLM 服务商的文档
4. 提交 Issue 到项目仓库

## 🎯 下一步

配置完成后：
1. 关闭配置模态框
2. 输入你的决策问题
3. 点击"生成决策树"
4. 开始你的智能决策之旅！
