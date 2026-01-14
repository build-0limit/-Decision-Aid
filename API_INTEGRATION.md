# API 集成说明

## 🎯 概述

本项目支持多种 LLM 服务商，通过可视化配置中心轻松管理 API 配置，无需修改代码。

## 🔌 支持的服务商

### 1. OpenAI

#### 支持的模型
- `gpt-4` - 最强大的模型
- `gpt-4-turbo` - 更快更经济的 GPT-4
- `gpt-3.5-turbo` - 快速且经济

#### API 端点
```
https://api.openai.com/v1/chat/completions
```

#### 请求格式
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "系统提示词"
    },
    {
      "role": "user",
      "content": "用户问题"
    }
  ],
  "temperature": 0.7,
  "response_format": { "type": "json_object" }
}
```

#### 响应格式
```json
{
  "choices": [
    {
      "message": {
        "content": "JSON格式的决策树"
      }
    }
  ]
}
```

### 2. Anthropic Claude

#### 支持的模型
- `claude-3-opus-20240229` - 最强大的 Claude 模型
- `claude-3-sonnet-20240229` - 平衡性能和成本
- `claude-3-haiku-20240307` - 最快速和经济

#### API 端点
```
https://api.anthropic.com/v1/messages
```

#### 请求格式
```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 4096,
  "temperature": 0.7,
  "system": "系统提示词",
  "messages": [
    {
      "role": "user",
      "content": "用户问题"
    }
  ]
}
```

#### 响应格式
```json
{
  "content": [
    {
      "text": "包含JSON的文本响应"
    }
  ]
}
```

### 3. 自定义 API

#### 要求
- 兼容 OpenAI Chat Completions API 格式
- 支持 POST 请求
- 返回 JSON 格式响应

#### 示例端点
```
https://api.example.com/v1/chat/completions
https://your-proxy.com/openai/v1/chat/completions
```

## 📝 决策树 JSON 格式

### 标准格式
```json
{
  "question": "第一个问题",
  "options": [
    {
      "text": "选项1",
      "next": {
        "question": "下一个问题",
        "options": [...]
      }
    },
    {
      "text": "选项2",
      "result": "最终结果说明"
    }
  ]
}
```

### 字段说明
- `question` (string, 必需): 当前节点的问题
- `options` (array, 必需): 选项列表
  - `text` (string, 必需): 选项文本
  - `next` (object, 可选): 下一个节点（与 result 二选一）
  - `result` (string, 可选): 最终结果（与 next 二选一）

### 示例
```json
{
  "question": "你最看重工作的哪个方面？",
  "options": [
    {
      "text": "职业发展机会",
      "next": {
        "question": "你更倾向于哪种行业环境？",
        "options": [
          {
            "text": "互联网科技行业",
            "result": "建议选择北京或深圳"
          },
          {
            "text": "金融行业",
            "result": "建议选择上海"
          }
        ]
      }
    },
    {
      "text": "生活成本和质量",
      "result": "建议综合考虑收入和生活成本"
    }
  ]
}
```

## 🔧 实现细节

### 配置管理

#### 保存配置
```javascript
import { setApiConfig } from './services/llm'

setApiConfig({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4',
  temperature: 0.7,
  saveToLocal: true
})
```

#### 读取配置
```javascript
import { getApiConfig } from './services/llm'

const config = getApiConfig()
// 返回: { provider, apiKey, model, temperature, ... }
```

### API 调用

#### OpenAI
```javascript
async function callOpenAI(question, systemPrompt, config) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: config.temperature,
      response_format: { type: 'json_object' }
    })
  })
  
  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}
```

#### Anthropic
```javascript
async function callAnthropic(question, systemPrompt, config) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      temperature: config.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }]
    })
  })
  
  const data = await response.json()
  const content = data.content[0].text
  
  // 提取JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  return JSON.parse(jsonMatch[0])
}
```

### 错误处理

```javascript
try {
  const tree = await generateDecisionTreeFromLLM(question)
  // 使用决策树
} catch (error) {
  console.error('API调用失败:', error)
  // 回退到演示模式
  const tree = generateMockDecisionTree(question)
}
```

## 🔐 安全建议

### 生产环境
1. **使用环境变量**
   ```javascript
   const apiKey = import.meta.env.VITE_OPENAI_API_KEY
   ```

2. **后端代理**
   - 不要在前端直接暴露 API Key
   - 通过后端服务调用 LLM API
   - 实现速率限制和使用监控

3. **API Key 管理**
   - 定期轮换密钥
   - 设置使用限额
   - 监控异常使用

### 开发环境
1. **本地存储**
   - 仅用于开发和测试
   - 不要在公共电脑上保存

2. **测试连接**
   - 配置后先测试连接
   - 验证 API Key 有效性

## 📊 成本优化

### 模型选择
- **开发测试**: GPT-3.5 Turbo, Claude Haiku
- **生产环境**: GPT-4 Turbo, Claude Sonnet
- **高质量需求**: GPT-4, Claude Opus

### Temperature 设置
- **一致性优先**: 0.3-0.5
- **平衡**: 0.7 (推荐)
- **创造性**: 1.0-1.5

### 缓存策略
```javascript
// 缓存常见问题的决策树
const cache = new Map()

async function generateWithCache(question) {
  if (cache.has(question)) {
    return cache.get(question)
  }
  
  const tree = await generateDecisionTreeFromLLM(question)
  cache.set(question, tree)
  return tree
}
```

## 🧪 测试

### 测试 API 连接
```javascript
import { testApiConnection } from './services/llm'

const result = await testApiConnection({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4',
  temperature: 0.7
})

if (result.success) {
  console.log('连接成功')
} else {
  console.error('连接失败:', result.message)
}
```

### 模拟测试
```javascript
// 使用演示模式进行功能测试
const config = {
  provider: 'mock',
  saveToLocal: false
}

setApiConfig(config)
const tree = await generateDecisionTreeFromLLM('测试问题')
```

## 🔄 迁移指南

### 从环境变量迁移
```javascript
// 旧方式 (.env)
VITE_OPENAI_API_KEY=sk-...

// 新方式 (配置中心)
// 在 UI 中配置，或使用代码：
setApiConfig({
  provider: 'openai',
  apiKey: 'sk-...',
  saveToLocal: true
})
```

### 从硬编码迁移
```javascript
// 旧方式
const API_KEY = 'sk-...'

// 新方式
const config = getApiConfig()
const API_KEY = config.apiKey
```

## 📚 参考资源

### OpenAI
- 文档: https://platform.openai.com/docs
- API Keys: https://platform.openai.com/api-keys
- 定价: https://openai.com/pricing

### Anthropic
- 文档: https://docs.anthropic.com
- Console: https://console.anthropic.com
- 定价: https://www.anthropic.com/pricing

### 其他资源
- OpenAI API 兼容服务列表
- LLM 代理服务
- 本地部署方案
