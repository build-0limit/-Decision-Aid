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
      return { ...JSON.parse(saved) }
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
async function callLLMApi(question, config) {
  const systemPrompt = `你是一个决策助手。根据用户的问题，生成一个决策树。
决策树的格式必须严格遵循以下JSON结构：
{
  "question": "第一个问题",
  "options": [
    {
      "text": "选项1",
      "next": { 下一个节点，结构相同 }
    },
    {
      "text": "选项2",
      "result": "最终结果说明"
    }
  ]
}

规则：
1. 每个节点必须有 question 和 options
2. 每个选项必须有 text
3. 选项要么有 next（指向下一个节点），要么有 result（最终结果）
4. 决策树深度建议2-4层
5. 每个节点的选项数量建议2-4个
6. 确保决策树逻辑清晰，能引导用户得到有价值的结论
7. 只返回JSON，不要有其他文字说明`

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
export async function callOpenAI(question, systemPrompt, config) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${config.apiKey}'
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
export async function callAnthropic(question, systemPrompt, config) {
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
export async function callCustomApi(question, systemPrompt, config) {
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
 * 模拟决策树生成（用于演示）
 * 在生产环境中，替换为真实的LLM API调用
 */
function generateMockDecisionTree(question) {
  // 根据问题关键词生成不同的决策树
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes('工作') || lowerQuestion.includes('城市')) {
    return {
      question: '你最看重工作的哪个方面？',
      options: [
        {
          text: '职业发展机会',
          next: {
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
        },
        {
          text: '生活成本和质量',
          next: {
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
        },
        {
          text: '气候和环境',
          next: {
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
      ]
    }
  } else if (lowerQuestion.includes('买') || lowerQuestion.includes('购')) {
    return {
      question: '你的预算范围是多少？',
      options: [
        {
          text: '5000元以下',
          next: {
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
        },
        {
          text: '5000-10000元',
          next: {
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
        },
        {
          text: '10000元以上',
          result: '预算充足的情况下，建议购买旗舰级产品，如MacBook Pro、高端游戏本或专业工作站，可以获得最佳体验。'
        }
      ]
    }
  } else {
    // 通用决策树模板
    return {
      question: '请先考虑这个问题的优先级',
      options: [
        {
          text: '非常紧急，需要立即决定',
          next: {
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
        },
        {
          text: '不太紧急，可以慢慢考虑',
          next: {
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
        },
        {
          text: '只是想听听建议',
          result: '建议你列出所有可能的选项，分析每个选项的优缺点，考虑自己的实际情况和长远目标，最终选择最适合自己的方案。'
        }
      ]
    }
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

/**
 * 调用真实LLM API的示例函数（已弃用，请使用上面的实现）
 */
/*
import axios from 'axios'

export async function generateDecisionTreeFromLLM(question) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `你是一个决策助手。根据用户的问题，生成一个决策树。
          决策树的格式如下：
          {
            "question": "第一个问题",
            "options": [
              {
                "text": "选项1",
                "next": { 下一个节点 } 或 "result": "最终结果"
              }
            ]
          }
          确保决策树逻辑清晰，每个分支都能引导用户得到有价值的结论。`
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const content = response.data.choices[0].message.content
    return JSON.parse(content)
  } catch (error) {
    console.error('LLM API调用失败:', error)
    throw error
  }
}
*/

export default{
};