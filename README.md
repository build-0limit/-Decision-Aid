# 🧠 智能决策助手

### 本项目由阿里云ESA提供加速、计算和保护
![esa](./esa.png)

### Vibe Coding with Kiro
![kiro](./kiro.jpg)

一个由LLM驱动的交互式决策树应用，帮助用户做出更明智的选择。

## ✨ 功能特点

- 🤖 **AI驱动**：支持多种LLM服务（OpenAI、Anthropic、自定义API）
- ⚙️ **配置中心**：可视化配置界面，轻松管理API密钥和参数
- 🌳 **树形可视化**：实时展示完整的决策树结构
- ✨ **动画效果**：流畅的节点切换和路径高亮动画
- 📊 **实时追踪**：当前节点脉冲动画，已访问路径高亮显示
- 🔗 **分享功能**：一键生成分享链接，让他人查看你的决策过程
- 🎨 **美观界面**：现代化的渐变设计和流畅动画
- 🔄 **可回退**：支持返回上一步重新选择
- 💾 **本地存储**：配置自动保存到浏览器
- 📱 **响应式设计**：完美适配各种设备
- ⚡ **逐层生成**：根据用户选择动态生成决策树，更快更智能

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 🔧 配置LLM API

### 方式一：使用配置中心（推荐）

1. 启动应用后，点击右上角的"⚙️ 配置"按钮
2. 在配置中心选择你的LLM服务商：
   - **OpenAI**：支持 GPT-4、GPT-4 Turbo、GPT-3.5 Turbo
   - **Anthropic**：支持 Claude 3 系列模型
   - **自定义 API**：兼容 OpenAI 格式的任何 API
   - **演示模式**：使用模拟数据（无需 API）
3. 输入你的 API Key
4. 调整参数（模型、Temperature 等）
5. 点击"测试连接"验证配置
6. 保存配置

### 方式二：环境变量（可选）

创建 `.env` 文件：

```env
VITE_LLM_PROVIDER=openai
VITE_OPENAI_API_KEY=your_api_key_here
VITE_OPENAI_MODEL=gpt-4
```

### 支持的LLM服务

#### OpenAI
- 获取 API Key：https://platform.openai.com/api-keys
- 支持模型：GPT-4、GPT-4 Turbo、GPT-3.5 Turbo

#### Anthropic Claude
- 获取 API Key：https://console.anthropic.com/
- 支持模型：Claude 3 Opus、Sonnet、Haiku

#### 自定义 API
- 任何兼容 OpenAI 格式的 API 端点
- 支持自定义模型名称

## 📁 项目结构

```
decision-tree-app/
├── src/
│   ├── components/
│   │   ├── DecisionTreeVisualization.vue  # 树形可视化组件
│   │   └── ConfigModal.vue                # 配置中心组件
│   ├── services/
│   │   └── llm.js        # LLM服务接口
│   ├── App.vue           # 主应用组件
│   ├── main.js           # 应用入口
│   └── style.css         # 全局样式
├── index.html            # HTML模板
├── package.json          # 项目配置
├── vite.config.js        # Vite配置
└── README.md             # 项目文档
```

## 🎯 使用流程

1. **配置 API**（可选）：点击右上角配置按钮，设置你的 LLM API
2. **输入问题**：在首页输入你的决策问题
3. **生成决策树**：AI分析问题并生成决策树的第一层
4. **查看树形结构**：完整的决策树以可视化形式展示
5. **逐步选择**：根据提示在决策树上进行选择，系统会动态生成下一层
6. **实时追踪**：已访问的路径会高亮显示，连接线有流动动画
7. **获得结果**：完成所有选择后得到最终建议
8. **查看路径**：回顾你的完整决策路径
9. **分享决策**：点击"分享决策树"按钮，生成分享链接发送给他人

## 🔗 分享功能

### 创建分享
1. 完成决策后，在结果页面点击"🔗 分享决策树"按钮
2. 系统自动生成唯一的分享链接
3. 点击"复制链接"按钮，将链接分享给他人

### 查看分享
1. 打开分享链接（格式：`https://your-domain.com/share/{code}`）
2. 自动加载分享的决策树
3. 查看完整的决策树可视化、决策路径和最终结果
4. 只读模式，不可修改

### 部署要求
分享功能需要部署配置 KV 存储：

## 🎨 设计特色

- 渐变背景和卡片阴影
- SVG树形可视化，自动布局
- 当前节点脉冲动画效果
- 已访问路径高亮和流动动画
- 节点悬停交互效果
- 流畅的过渡动画
- 清晰的视觉层次
- 友好的交互反馈
- 现代化的色彩搭配

## 📝 自定义决策树

### 使用演示模式
在配置中心选择"演示模式"，系统会根据问题关键词生成预设的决策树。

### 使用真实 LLM
配置你的 API 后，LLM 会根据问题动态生成个性化的决策树。

### 自定义模拟数据
编辑 `src/services/llm.js` 中的 `generateMockDecisionTree` 函数来自定义演示数据。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License
