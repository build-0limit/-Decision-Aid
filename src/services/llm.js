// LLM服务 - 生成决策树

// 默认配置
const DEFAULT_CONFIG = {
  provider: 'mock',
  apiKey: '',
  model: 'gpt-4',
  endpoint: '',
  temperature: 0.7,
  saveToLocal: true
}

// 配置管理
export function getApiConfig() {
  try {
    const saved = localStorage.getItem('llm_api_config')
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.error('Failed to load config:', error)
  }
  return { ...DEFAULT_CONFIG }
}

export function setApiConfig(config) {
  try {
    if (config.saveToLocal) {
      localStorage.setItem('llm_api_config', JSON.stringify(config))
    } else {
      localStorage.removeItem('llm_api_config')
    }
  } catch (error) {
    console.error('Failed to save config:', error)
  }
}

/**
 * 从LLM生成决策树
 * @param {string} question - 用户的决策问题
 * @returns {Promise<Object>} 决策树对象
 */
export async function generateDecisionTreeFromLLM(question) {
  const config = getApiConfig()
  
  // 如果使用模拟数据
  if (config.provider === 'mock') {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return generateMockDecisionTree(question)
  }
  
  // 调用真实的 LLM API
  try {
    return await callLLMApi(question, config)
  } catch (error) {
    console.error('LLM API调用失败:', error)
    // 失败时回退到模拟数据
    console.warn('回退到模拟数据模式')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return generateMockDecisionTree(question)
  }
}

/**
 * 调用真实LLM API
 */
async function callLLMApi(question, config, context = {}) {
  const systemPrompt = context.isFirstLevel 
    ? `你是一个决策助手。根据用户的问题，生成决策树的第一层。
决策树的格式必须严格遵循以下JSON结构：
{
  "question": "第一个问题",
  "options": [
    {
      "text": "选项1"
    },
    {
      "text": "选项2"
    }
  ]
}

规则：
1. 只生成一层，包含一个问题和2-4个选项
2. 每个选项只需要 text 字段，不需要 next 或 result
3. 问题要针对用户的决策需求
4. 选项要清晰、互斥
5. 只返回JSON，不要有其他文字说明`
    : `你是一个决策助手。根据用户之前的选择，生成决策树的下一层。

用户的原始问题：${question}
之前的选择路径：${context.previousChoices?.join(' → ')}
当前问题：${context.currentQuestion}
用户选择了：${context.selectedOption}

请生成下一层决策节点，格式如下：
{
  "question": "下一个问题",
  "options": [
    {
      "text": "选项1"
    },
    {
      "text": "选项2",
      "result": "如果这是最终答案，提供结果说明"
    }
  ]
}

规则：
1. 只生成一层，包含一个问题和2-4个选项
2. 如果某个选项是最终答案，添加 result 字段
3. 如果还需要继续决策，只提供 text 字段
4. 问题要基于之前的选择，逐步深入
5. 只返回JSON，不要有其他文字说明`

  if (config.provider === 'openai') {
    return await callOpenAI(question, systemPrompt, config)
  } else if (config.provider === 'anthropic') {
    return await callAnthropic(question, systemPrompt, config)
  } else if (config.provider === 'custom') {
    return await callCustomApi(question, systemPrompt, config)
  }
  
  throw new Error('不支持的服务商')
}

/**
 * 调用 OpenAI API
 */
async function callOpenAI(question, systemPrompt, config) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: config.temperature || 0.7,
      response_format: { type: 'json_object' }
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'OpenAI API 调用失败')
  }
  
  const data = await response.json()
  const content = data.choices[0].message.content
  return JSON.parse(content)
}

/**
 * 调用 Anthropic API
 */
async function callAnthropic(question, systemPrompt, config) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: config.temperature || 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: question }
      ]
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Anthropic API 调用失败')
  }
  
  const data = await response.json()
  const content = data.content[0].text
  
  // 提取JSON（Claude可能会在JSON前后添加文字）
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  
  return JSON.parse(content)
}

/**
 * 调用自定义 API
 */
async function callCustomApi(question, systemPrompt, config) {
  const response = await fetch(config.endpoint, {
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
      temperature: config.temperature || 0.7
    })
  })
  
  if (!response.ok) {
    throw new Error('自定义 API 调用失败')
  }
  
  const data = await response.json()
  
  // 尝试不同的响应格式
  let content = data.choices?.[0]?.message?.content || 
                data.content?.[0]?.text ||
                data.response ||
                data.text
  
  if (!content) {
    throw new Error('无法解析 API 响应')
  }
  
  // 尝试提取JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  
  return JSON.parse(content)
}

/**
 * 模拟决策树生成（用于演示）- 逐层生成版本
 */
function generateMockDecisionTree(question, context = {}) {
  const lowerQuestion = question.toLowerCase()
  
  // 第一层
  if (context.isFirstLevel) {
    if (lowerQuestion.includes('工作') || lowerQuestion.includes('城市')) {
      return {
        question: '你最看重工作的哪个方面？',
        options: [
          { text: '职业发展机会' },
          { text: '生活成本和质量' },
          { text: '气候和环境' }
        ]
      }
    } else if (lowerQuestion.includes('买') || lowerQuestion.includes('购')) {
      return {
        question: '你的预算范围是多少？',
        options: [
          { text: '5000元以下' },
          { text: '5000-10000元' },
          { text: '10000元以上' }
        ]
      }
    } else {
      return {
        question: '请先考虑这个问题的优先级',
        options: [
          { text: '非常紧急，需要立即决定' },
          { text: '不太紧急，可以慢慢考虑' },
          { text: '只是想听听建议' }
        ]
      }
    }
  }
  
  // 后续层 - 根据之前的选择生成
  const previousChoice = context.selectedOption
  
  // 工作城市决策
  if (previousChoice === '职业发展机会') {
    return {
      question: '你更倾向于哪种行业环境？',
      options: [
        {
          text: '互联网科技行业',
          result: '建议选择北京或深圳。北京有更多大型互联网公司总部，深圳则有腾讯等科技巨头，两地都有丰富的职业发展机会。'
        },
        {
          text: '金融行业',
          result: '建议选择上海。上海是中国的金融中心，拥有最多的金融机构和相关职位，职业发展空间大。'
        },
        {
          text: '创业环境',
          result: '建议选择深圳。深圳的创业氛围浓厚，政策支持力度大，适合有创业想法的人。'
        }
      ]
    }
  }
  
  if (previousChoice === '生活成本和质量') {
    return {
      question: '你的预算范围是？',
      options: [
        {
          text: '预算充足，追求高品质生活',
          result: '建议选择上海。上海的生活配套设施完善，国际化程度高，适合追求高品质生活的人群。'
        },
        {
          text: '希望性价比高',
          result: '建议选择深圳。相比北京上海，深圳的生活成本相对较低，同时气候宜人，生活质量不错。'
        }
      ]
    }
  }
  
  if (previousChoice === '气候和环境') {
    return {
      question: '你更喜欢什么样的气候？',
      options: [
        {
          text: '四季分明',
          result: '建议选择北京。北京四季分明，春秋季节尤其舒适，适合喜欢季节变化的人。'
        },
        {
          text: '温暖湿润',
          result: '建议选择深圳。深圳属于亚热带气候，全年温暖，冬天不冷，适合怕冷的人。'
        }
      ]
    }
  }
  
  // 购物决策
  if (previousChoice === '5000元以下') {
    return {
      question: '你主要用途是什么？',
      options: [
        {
          text: '日常办公学习',
          result: '建议购买中端笔记本电脑或平板电脑，性价比高，满足基本需求。'
        },
        {
          text: '娱乐游戏',
          result: '建议购买游戏主机或中端游戏手机，体验更好。'
        }
      ]
    }
  }
  
  if (previousChoice === '5000-10000元') {
    return {
      question: '你更看重什么？',
      options: [
        {
          text: '性能和配置',
          result: '建议购买高性能笔记本或台式机，可以满足专业工作和游戏需求。'
        },
        {
          text: '便携性',
          result: '建议购买轻薄本或高端平板，方便携带，性能也不错。'
        }
      ]
    }
  }
  
  if (previousChoice === '10000元以上') {
    return {
      question: '你的具体需求是？',
      options: [
        {
          text: '专业创作',
          result: '建议购买 MacBook Pro 或高端工作站，适合视频剪辑、设计等专业工作。'
        },
        {
          text: '高端游戏',
          result: '建议购买旗舰游戏本，配备最新显卡和处理器，畅玩所有游戏。'
        }
      ]
    }
  }
  
  // 通用决策
  if (previousChoice === '非常紧急，需要立即决定') {
    return {
      question: '你有足够的信息做决定吗？',
      options: [
        {
          text: '是的，信息充足',
          result: '建议根据现有信息快速做出决定，相信你的直觉和经验。'
        },
        {
          text: '不，还需要更多信息',
          result: '建议先快速收集关键信息，咨询相关专家或有经验的人，然后做决定。'
        }
      ]
    }
  }
  
  if (previousChoice === '不太紧急，可以慢慢考虑') {
    return {
      question: '这个决定的影响范围有多大？',
      options: [
        {
          text: '影响重大，关系到长远发展',
          result: '建议充分调研，列出各选项的利弊，必要时咨询专业人士，做出深思熟虑的决定。'
        },
        {
          text: '影响较小，可以调整',
          result: '建议先尝试一个方案，根据实际效果再调整，不必过度纠结。'
        }
      ]
    }
  }
  
  if (previousChoice === '只是想听听建议') {
    return {
      question: '你更倾向于哪种决策方式？',
      options: [
        {
          text: '理性分析',
          result: '建议列出所有可能的选项，分析每个选项的优缺点，用数据和逻辑做决定。'
        },
        {
          text: '直觉判断',
          result: '建议相信你的第一感觉，结合过往经验，快速做出选择。'
        }
      ]
    }
  }
  
  // 默认返回
  return {
    question: '需要更多信息来帮助你决策',
    options: [
      {
        text: '重新开始',
        result: '建议重新思考你的问题，提供更多背景信息。'
      }
    ]
  }
}

/**
 * 测试 API 连接
 */
export async function testApiConnection(config) {
  if (config.provider === 'mock') {
    return { success: true, message: '演示模式无需测试' }
  }
  
  try {
    const testQuestion = '测试连接'
    await callLLMApi(testQuestion, config)
    return { success: true, message: 'API 连接成功' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// Cloudflare Workers 格式导出（用于边缘计算部署）
export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname
    
    // API 路由
    if (path === '/api/generate' && request.method === 'POST') {
      const { question, config, context } = await request.json()
      
      let result
      if (config.provider === 'mock') {
        // 根据上下文生成单层决策树
        result = generateMockDecisionTree(question, context || {})
      } else {
        result = await callLLMApi(question, config, context || {})
      }
      
      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }
    
    if (path === '/api/test' && request.method === 'POST') {
      const { config } = await request.json()
      const result = await testApiConnection(config)
      
      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }
    
    // 默认响应
    return bad(404, "Not Found");
  }
}
