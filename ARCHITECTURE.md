# 架构说明

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户浏览器                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Vue 3 前端应用                          │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │   App.vue    │  │ ConfigModal  │  │ TreeViz  │ │   │
│  │  │              │  │              │  │          │ │   │
│  │  │  - fetch()   │  │  - fetch()   │  │  - SVG   │ │   │
│  │  │  - 状态管理   │  │  - 配置管理   │  │  - 动画  │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │   │
│  │                                                       │   │
│  │  localStorage (配置存储)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            │ HTTPS                           │
│                            ▼                                 │
└─────────────────────────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────┼────────────────────────────────┐
│                  Cloudflare Workers                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              llm.js (Workers API)                    │   │
│  │                                                       │   │
│  │  export default {                                    │   │
│  │    async fetch(request) {                           │   │
│  │      // 路由处理                                     │   │
│  │      if (path === '/api/generate') { ... }         │   │
│  │      if (path === '/api/test') { ... }             │   │
│  │    }                                                 │   │
│  │  }                                                   │   │
│  │                                                       │   │
│  │  - CORS 处理                                         │   │
│  │  - 错误处理                                          │   │
│  │  - API 调用封装                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            │ HTTPS                           │
│                            ▼                                 │
└─────────────────────────────────────────────────────────────┘
                             │
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   OpenAI     │    │  Anthropic   │    │  自定义 API   │
│   GPT-4      │    │  Claude 3    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 📦 组件结构

### 前端组件

```
src/
├── App.vue                          # 主应用组件
│   ├── 状态管理 (ref, computed)
│   ├── 配置管理 (getApiConfig, setApiConfig)
│   ├── API 调用 (fetch)
│   └── 生命周期管理
│
├── components/
│   ├── ConfigModal.vue              # 配置中心
│   │   ├── 表单管理
│   │   ├── API 测试 (fetch)
│   │   └── 配置验证
│   │
│   └── DecisionTreeVisualization.vue # 树形可视化
│       ├── SVG 渲染
│       ├── 布局算法
│       └── 动画效果
│
├── services/
│   └── llm.js                       # Workers API 实现
│       ├── export default { fetch }
│       ├── API 路由处理
│       └── LLM 调用封装
│
├── main.js                          # 应用入口
└── style.css                        # 全局样式
```

## 🔄 数据流

### 1. 生成决策树流程

```
用户输入问题
    ↓
App.vue: generateDecisionTree()
    ↓
fetch POST /api/generate
    ↓
Workers: llm.js fetch()
    ↓
路由匹配: /api/generate
    ↓
获取配置: config.provider
    ↓
┌─────────────────────────────┐
│  provider === 'mock'?       │
│  ├─ Yes → generateMockTree  │
│  └─ No  → callLLMApi        │
└─────────────────────────────┘
    ↓
callOpenAI / callAnthropic / callCustomApi
    ↓
返回 JSON 决策树
    ↓
Workers: Response(JSON)
    ↓
App.vue: 接收并渲染
    ↓
DecisionTreeVisualization: 可视化
```

### 2. 测试连接流程

```
用户点击测试
    ↓
ConfigModal.vue: testConnection()
    ↓
fetch POST /api/test
    ↓
Workers: llm.js fetch()
    ↓
路由匹配: /api/test
    ↓
testApiConnection(config)
    ↓
尝试调用 LLM API
    ↓
返回测试结果
    ↓
ConfigModal: 显示结果
```

### 3. 配置管理流程

```
用户修改配置
    ↓
ConfigModal: localConfig
    ↓
用户保存
    ↓
emit('save', config)
    ↓
App.vue: saveConfig()
    ↓
setApiConfig(config)
    ↓
localStorage.setItem()
    ↓
apiConfig.value = config
```

## 🌐 API 端点

### POST /api/generate

**请求**：
```json
{
  "question": "用户的决策问题",
  "config": {
    "provider": "openai|anthropic|custom|mock",
    "apiKey": "sk-...",
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

**响应**：
```json
{
  "question": "第一个问题",
  "options": [
    {
      "text": "选项1",
      "next": { ... }
    },
    {
      "text": "选项2",
      "result": "最终结果"
    }
  ]
}
```

### POST /api/test

**请求**：
```json
{
  "config": {
    "provider": "openai",
    "apiKey": "sk-...",
    "model": "gpt-4"
  }
}
```

**响应**：
```json
{
  "success": true,
  "message": "API 连接成功"
}
```

## 🔐 安全架构

### 前端安全

```
┌─────────────────────────────────┐
│         浏览器环境               │
│                                  │
│  ✅ 配置存储在 localStorage      │
│  ✅ 仅存储配置，不存储敏感数据   │
│  ✅ HTTPS 加密传输               │
│  ❌ 不直接调用 LLM API           │
└─────────────────────────────────┘
```

### Workers 安全

```
┌─────────────────────────────────┐
│      Cloudflare Workers         │
│                                  │
│  ✅ API Key 可存储在 Secrets     │
│  ✅ CORS 策略控制                │
│  ✅ 速率限制（可选）             │
│  ✅ 请求验证                     │
│  ✅ 错误信息过滤                 │
└─────────────────────────────────┘
```

### 通信安全

```
浏览器 ←→ Workers ←→ LLM API
  │          │          │
  │          │          │
HTTPS      HTTPS      HTTPS
  │          │          │
  │          │          │
  └──────────┴──────────┘
     端到端加密
```

## 📊 状态管理

### App.vue 状态

```javascript
// 应用状态
const stage = ref('input')           // 当前阶段
const loading = ref(false)           // 加载状态
const showConfigModal = ref(false)   // 模态框显示

// 决策树状态
const decisionTree = ref(null)       // 完整决策树
const currentNode = ref(null)        // 当前节点
const currentNodeId = ref('node-0')  // 当前节点ID
const visitedNodeIds = ref([])       // 已访问节点

// 用户数据
const userQuestion = ref('')         // 用户问题
const decisionPath = ref([])         // 决策路径
const finalResult = ref('')          // 最终结果
const apiConfig = ref({})            // API 配置
```

### ConfigModal 状态

```javascript
const localConfig = ref({})          // 本地配置
const showApiKey = ref(false)        // 显示密钥
const testing = ref(false)           // 测试中
const testResult = ref(null)         // 测试结果
```

## 🎨 渲染流程

### 初始渲染

```
main.js
  ↓
createApp(App)
  ↓
App.vue mounted
  ↓
加载配置: getApiConfig()
  ↓
渲染输入界面
```

### 决策树渲染

```
用户提交问题
  ↓
调用 API
  ↓
接收决策树数据
  ↓
stage = 'decision'
  ↓
渲染 DecisionTreeVisualization
  ↓
计算布局: calculateTreeLayout()
  ↓
渲染 SVG
  ↓
应用动画
```

### 结果渲染

```
用户完成选择
  ↓
stage = 'result'
  ↓
显示最终结果
  ↓
显示决策路径
  ↓
显示完整树形图
```

## 🚀 部署架构

### 开发环境

```
┌──────────────┐         ┌──────────────┐
│  localhost   │         │  localhost   │
│   :5173      │ ──────> │   :8787      │
│  (Vite)      │         │ (Wrangler)   │
└──────────────┘         └──────────────┘
   前端开发服务器            Workers 本地服务
```

### 生产环境

```
┌──────────────────┐         ┌──────────────────┐
│   Vercel/        │         │   Cloudflare     │
│   Netlify        │ ──────> │   Workers        │
│   (静态托管)      │         │   (边缘计算)      │
└──────────────────┘         └──────────────────┘
   全球 CDN 分发               全球边缘节点
```

## 🔧 技术栈

### 前端

- **框架**: Vue 3 (Composition API)
- **构建**: Vite 5
- **样式**: CSS3 (动画、渐变、滤镜)
- **图形**: SVG (树形可视化)
- **存储**: localStorage (配置管理)

### 后端

- **平台**: Cloudflare Workers
- **运行时**: V8 JavaScript Engine
- **部署**: Wrangler CLI
- **存储**: KV (可选，用于缓存)

### API

- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **自定义**: 兼容 OpenAI 格式的 API

## 📈 性能优化

### 前端优化

1. **代码分割**: 按需加载组件
2. **CSS 动画**: 使用 GPU 加速
3. **SVG 优化**: 元素复用，减少 DOM 操作
4. **缓存策略**: localStorage 配置缓存

### Workers 优化

1. **边缘计算**: 全球分布式部署
2. **KV 缓存**: 缓存常见问题的决策树
3. **并发处理**: 异步 API 调用
4. **错误处理**: 快速失败和回退

## 🔄 扩展性

### 添加新的 LLM 服务商

1. 在 `llm.js` 中添加新的调用函数
2. 在 `ConfigModal.vue` 中添加选项
3. 更新配置类型定义

### 添加新的 API 端点

1. 在 `llm.js` 的 `fetch()` 中添加路由
2. 实现处理逻辑
3. 在前端添加对应的 fetch 调用

### 添加缓存层

1. 配置 KV 命名空间
2. 在 Workers 中实现缓存逻辑
3. 设置合理的过期时间

## 📚 相关文档

- [开发指南](DEVELOPMENT.md)
- [部署指南](DEPLOYMENT_GUIDE.md)
- [Workers 详解](CLOUDFLARE_WORKERS.md)
- [配置指南](CONFIG_GUIDE.md)
