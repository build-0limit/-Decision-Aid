<template>
  <div class="app-container">
    <!-- 隐藏的 SVG 定义渐变 -->
    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
    
    <div class="header">
      <div class="header-content">
        <div>
          <h1>🧠 智能决策助手</h1>
          <p class="subtitle">让AI帮你做出更明智的选择</p>
        </div>
        <button class="config-btn" @click="openConfig" title="API 配置">
          <span class="config-icon">⚙️</span>
          <span class="config-text">配置</span>
        </button>
      </div>
      <div v-if="apiConfig.provider !== 'mock'" class="api-status">
        <span class="status-dot"></span>
        <span class="status-text">{{ getProviderName(apiConfig.provider) }}</span>
      </div>
    </div>

    <!-- 输入阶段 -->
    <div v-if="stage === 'input'" class="input-section">
      <div class="input-card">
        <label for="question">请输入你的决策问题：</label>
        <textarea
          id="question"
          v-model="userQuestion"
          placeholder="例如：我应该选择哪个城市工作？北京、上海还是深圳？"
          rows="4"
        ></textarea>
        <button 
          @click="generateDecisionTree" 
          :disabled="loading || !userQuestion.trim()"
          class="primary-btn"
        >
          <span v-if="loading" class="loading-content">
            <span class="spinner"></span>
            <span>AI 正在思考...</span>
          </span>
          <span v-else>生成决策树</span>
        </button>
      </div>
      
      <!-- 生成决策树加载动画 -->
      <transition name="fade">
        <div v-if="loading" class="loading-overlay">
          <div class="loading-animation">
            <div class="brain-icon">🧠</div>
            <div class="loading-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <p class="loading-text">AI 正在为你生成决策树...</p>
            <div class="loading-bar">
              <div class="loading-bar-fill"></div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 决策树阶段 -->
    <div v-if="stage === 'decision'" class="decision-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>

      <!-- 树形可视化 -->
      <DecisionTreeVisualization
        :tree-data="decisionTree"
        :current-node-id="currentNodeId"
        :visited-nodes="visitedNodeIds"
        @node-click="handleTreeNodeClick"
      />
      
      <div class="decision-card">
        <div class="question-header">
          <span class="step-indicator">步骤 {{ currentStep + 1 }} / {{ totalSteps }}</span>
          <h2>{{ currentNode.question }}</h2>
        </div>

        <div class="options-container">
          <button
            v-for="(option, index) in currentNode.options"
            :key="index"
            @click="selectOption(option)"
            class="option-btn"
            :disabled="loading"
          >
            <span class="option-icon">{{ getOptionIcon(index) }}</span>
            <span class="option-text">{{ option.text }}</span>
          </button>
        </div>

        <button @click="goBack" v-if="history.length > 0" class="back-btn" :disabled="loading">
          ← 返回上一步
        </button>
      </div>
      
      <!-- 动态生成下一层加载动画 -->
      <transition name="fade">
        <div v-if="loading" class="loading-overlay">
          <div class="loading-animation">
            <div class="tree-icon">🌳</div>
            <div class="loading-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <p class="loading-text">正在生成下一层决策...</p>
            <div class="loading-bar">
              <div class="loading-bar-fill"></div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 结果阶段 -->
    <div v-if="stage === 'result'" class="result-section">
      <!-- 最终树形可视化 -->
      <DecisionTreeVisualization
        :tree-data="decisionTree"
        :current-node-id="currentNodeId"
        :visited-nodes="visitedNodeIds"
      />

      <div class="result-card">
        <div class="result-icon">🎯</div>
        <h2>决策结果</h2>
        <div class="result-content">
          <p>{{ finalResult }}</p>
        </div>
        
        <div class="result-path">
          <h3>你的决策路径：</h3>
          <div class="path-steps">
            <div 
              v-for="(step, index) in decisionPath" 
              :key="index" 
              class="path-step"
              :style="{ '--index': index }"
            >
              <span class="path-number">{{ index + 1 }}</span>
              <span class="path-text">{{ step }}</span>
            </div>
          </div>
        </div>

        <!-- 分享功能 -->
        <div class="share-section">
          <button @click="shareDecision" class="share-btn" :disabled="shareLoading">
            <span v-if="!shareLoading">🔗 分享决策树</span>
            <span v-else class="loading-content">
              <span class="share-loading-text">正在生成分享链接...</span>
            </span>
          </button>
          
          <!-- 环形进度条 -->
          <div v-if="shareLoading" class="circular-progress-container">
            <svg class="circular-progress" viewBox="0 0 120 120">
              <circle
                class="progress-bg"
                cx="60"
                cy="60"
                r="54"
              />
              <circle
                class="progress-bar"
                cx="60"
                cy="60"
                r="54"
                :style="{
                  strokeDashoffset: 339.292 - (339.292 * shareProgress) / 100
                }"
              />
            </svg>
            <div class="progress-text">
              <div class="progress-percentage">{{ Math.round(shareProgress) }}%</div>
              <div class="progress-label">验证中</div>
            </div>
          </div>
          
          <div v-if="shareLink" class="share-result">
            <div class="share-link-container">
              <input 
                ref="shareLinkInput"
                type="text" 
                :value="shareLink" 
                readonly 
                class="share-link-input"
              />
              <button @click="copyShareLink" class="copy-btn">
                {{ copied ? '✓ 已复制' : '复制链接' }}
              </button>
            </div>
            <p class="share-hint">链接有效期 -- 天</p>
          </div>
        </div>

        <button @click="restart" class="primary-btn">
          开始新的决策
        </button>
      </div>
    </div>

    <!-- 查看分享阶段 -->
    <div v-if="stage === 'shared'" class="shared-section">
      <DecisionTreeVisualization
        :tree-data="sharedData.decisionTree"
        :current-node-id="sharedData.currentNodeId"
        :visited-nodes="sharedData.visitedNodes"
      />

      <div class="result-card">
        <div class="result-icon">🌐</div>
        <h2>分享的决策</h2>
        <div class="shared-question">
          <strong>问题：</strong>{{ sharedData.question }}
        </div>
        
        <div v-if="sharedData.finalResult" class="result-content">
          <p>{{ sharedData.finalResult }}</p>
        </div>
        
        <div v-if="sharedData.decisionPath && sharedData.decisionPath.length > 0" class="result-path">
          <h3>决策路径：</h3>
          <div class="path-steps">
            <div 
              v-for="(step, index) in sharedData.decisionPath" 
              :key="index" 
              class="path-step"
              :style="{ '--index': index }"
            >
              <span class="path-number">{{ index + 1 }}</span>
              <span class="path-text">{{ step }}</span>
            </div>
          </div>
        </div>

        <button @click="restart" class="primary-btn">
          创建我的决策
        </button>
      </div>
    </div>

    <!-- 配置模态框 -->
    <ConfigModal
      :show="showConfigModal"
      :config="apiConfig"
      @close="showConfigModal = false"
      @save="saveConfig"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DecisionTreeVisualization from './components/DecisionTreeVisualization.vue'
import ConfigModal from './components/ConfigModal.vue'

// 默认配置
const DEFAULT_CONFIG = {
  provider: 'mock',
  apiKey: '',
  model: 'gpt-4',
  endpoint: '',
  temperature: 0.7,
  saveToLocal: true
}

const stage = ref('input') // 'input', 'decision', 'result', 'shared'
const userQuestion = ref('')
const loading = ref(false)
const decisionTree = ref(null)
const currentNode = ref(null)
const currentNodeId = ref('node-0')
const visitedNodeIds = ref([])
const history = ref([])
const decisionPath = ref([])
const finalResult = ref('')
const currentStep = ref(0)
const showConfigModal = ref(false)
const apiConfig = ref(getApiConfig())

// 分享相关
const shareLoading = ref(false)
const shareLink = ref('')
const copied = ref(false)
const shareLinkInput = ref(null)
const shareProgress = ref(0)
const shareCode = ref('')
const sharedData = ref({
  question: '',
  decisionTree: null,
  decisionPath: [],
  finalResult: '',
  currentNodeId: 'node-0',
  visitedNodes: []
})

// 配置管理
function getApiConfig() {
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

function setApiConfig(config) {
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

const totalSteps = computed(() => {
  if (!decisionTree.value) return 0
  return estimateTreeDepth(decisionTree.value)
})

const progressPercentage = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.min((currentStep.value / totalSteps.value) * 100, 100)
})

function estimateTreeDepth(node, depth = 0) {
  if (!node.options || node.options.length === 0) return depth
  const maxDepth = Math.max(...node.options.map(opt => 
    opt.next ? estimateTreeDepth(opt.next, depth + 1) : depth + 1
  ))
  return maxDepth
}

async function generateDecisionTree() {
  loading.value = true
  try {
    const config = getApiConfig()
    
    // 调用 Workers API 生成第一层
    const response = await fetch(`/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion.value,
        config,
        context: {
          isFirstLevel: true,
          previousChoices: []
        }
      })
    })
    
    if (!response.ok) {
      throw new Error('API 调用失败')
    }
    
    const firstLevel = await response.json()
    decisionTree.value = firstLevel
    currentNode.value = firstLevel
    currentNodeId.value = 'node-0'
    visitedNodeIds.value = ['node-0']
    stage.value = 'decision'
    currentStep.value = 0
  } catch (error) {
    alert('生成决策树失败，请重试')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function selectOption(option) {
  decisionPath.value.push(option.text)
  currentStep.value++
  
  // 如果是结果节点，直接显示结果
  if (option.result) {
    finalResult.value = option.result
    const resultNodeId = calculateNodeId(option)
    currentNodeId.value = resultNodeId
    visitedNodeIds.value.push(resultNodeId)
    
    // 延迟显示结果，让用户看到最终节点的动画
    setTimeout(() => {
      stage.value = 'result'
    }, 800)
    return
  }
  
  // 如果已经有下一层节点，直接使用
  if (option.next) {
    history.value.push({ node: currentNode.value, nodeId: currentNodeId.value })
    currentNode.value = option.next
    
    const newNodeId = calculateNodeId(option)
    currentNodeId.value = newNodeId
    visitedNodeIds.value.push(newNodeId)
    return
  }
  
  // 否则，动态生成下一层
  loading.value = true
  try {
    const config = getApiConfig()
    
    // 调用 Workers API 生成下一层
    const response = await fetch(`/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion.value,
        config,
        context: {
          isFirstLevel: false,
          previousChoices: decisionPath.value,
          currentQuestion: currentNode.value.question,
          selectedOption: option.text
        }
      })
    })
    
    if (!response.ok) {
      throw new Error('生成下一层失败')
    }
    
    const nextLevel = await response.json()
    
    // 将新生成的节点附加到选项上
    option.next = nextLevel
    
    // 保存当前节点到历史
    history.value.push({ node: currentNode.value, nodeId: currentNodeId.value })
    
    // 移动到新节点
    currentNode.value = nextLevel
    const newNodeId = calculateNodeId(option)
    currentNodeId.value = newNodeId
    visitedNodeIds.value.push(newNodeId)
    
  } catch (error) {
    alert('生成下一层失败，请重试')
    console.error(error)
  } finally {
    loading.value = false
  }
}

function calculateNodeId(option) {
  // 简单的节点ID生成策略
  return `node-${visitedNodeIds.value.length}`
}

function goBack() {
  if (history.value.length > 0) {
    const previous = history.value.pop()
    currentNode.value = previous.node
    currentNodeId.value = previous.nodeId
    visitedNodeIds.value.pop()
    decisionPath.value.pop()
    currentStep.value--
  }
}

function restart() {
  stage.value = 'input'
  userQuestion.value = ''
  decisionTree.value = null
  currentNode.value = null
  currentNodeId.value = 'node-0'
  visitedNodeIds.value = []
  history.value = []
  decisionPath.value = []
  finalResult.value = ''
  currentStep.value = 0
  shareLink.value = ''
  copied.value = false
  shareProgress.value = 0
  shareCode.value = ''
}

// 分享决策树
async function shareDecision() {
  shareLoading.value = true
  shareProgress.value = 0
  shareCode.value = ''
  shareLink.value = ''
  
  try {
    // 1. 创建分享
    const response = await fetch('/api/shares', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion.value,
        decisionTree: decisionTree.value,
        decisionPath: decisionPath.value,
        finalResult: finalResult.value
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '分享失败')
    }

    const data = await response.json()
    shareCode.value = data.code
    const baseUrl = window.location.origin
    const link = `${baseUrl}/share/${data.code}`
    
    // 2. 轮询验证数据是否可用（最多5秒）
    const maxDuration = 5000 // 5秒
    const pollInterval = 1000 // 每1秒轮询一次
    const startTime = Date.now()
    let verified = false
    
    // 启动进度条动画
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      shareProgress.value = Math.min((elapsed / maxDuration) * 100, 100)
    }, 50)
    
    // 轮询检查数据
    while (Date.now() - startTime < maxDuration) {
      try {
        const checkResponse = await fetch(`/api/shares/${data.code}`)
        if (checkResponse.ok) {
          // 数据可用，提前返回
          verified = true
          clearInterval(progressInterval)
          shareProgress.value = 100
          break
        }
      } catch (error) {
        // 继续轮询
        console.log('轮询中...', error)
      }
      
      // 等待1秒后继续
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
    
    // 清理进度条
    clearInterval(progressInterval)
    
    // 确保进度条到达100%
    if (!verified) {
      shareProgress.value = 100
    }
    
    // 短暂延迟后显示链接（让用户看到100%的状态）
    await new Promise(resolve => setTimeout(resolve, 300))
    
    shareLink.value = link
  } catch (error) {
    alert('分享失败：' + error.message)
    console.error(error)
  } finally {
    shareLoading.value = false
    shareProgress.value = 0
  }
}

// 复制分享链接
async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案：选中文本
    if (shareLinkInput.value) {
      shareLinkInput.value.select()
      document.execCommand('copy')
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    }
  }
}

// 加载分享的决策树
async function loadSharedDecision(code) {
  loading.value = true
  try {
    const response = await fetch(`/api/shares/${code}`)
    
    if (!response.ok) {
      throw new Error('分享不存在/已过期/还未同步成功')
    }

    const data = await response.json()
    sharedData.value = {
      question: data.question,
      decisionTree: data.decisionTree,
      decisionPath: data.decisionPath || [],
      finalResult: data.finalResult || '',
      currentNodeId: 'node-0',
      visitedNodes: ['node-0']
    }
    
    stage.value = 'shared'
  } catch (error) {
    alert('加载分享失败：' + error.message)
    stage.value = 'input'
  } finally {
    loading.value = false
  }
}

function handleTreeNodeClick(node) {
  // 可以添加点击树节点的交互逻辑
  console.log('Tree node clicked:', node)
}

// 打开配置模态框
function openConfig() {
  showConfigModal.value = true
}

// 保存配置
function saveConfig(config) {
  setApiConfig(config)
  apiConfig.value = config
  showConfigModal.value = false
}

// 初始化时加载配置
onMounted(() => {
  apiConfig.value = getApiConfig()
  
  // 检查是否是分享链接
  const path = window.location.pathname
  const shareMatch = path.match(/^\/share\/([0-9a-zA-Z_-]{3,32})$/)
  if (shareMatch) {
    const code = shareMatch[1]
    loadSharedDecision(code)
  }
})

function getOptionIcon(index) {
  const icons = ['🔵', '🟢', '🟡', '🟣', '🔴', '🟠']
  return icons[index % icons.length]
}

// 获取服务商名称
function getProviderName(provider) {
  const names = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    custom: '自定义 API',
    mock: '演示模式'
  }
  return names[provider] || provider
}
</script>

<style scoped>
.app-container {
  width: 100%;
  max-width: 1200px;
}

.decision-section {
  width: 100%;
}

.header {
  margin-bottom: 40px;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 15px;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.config-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.config-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.config-icon {
  font-size: 1.2rem;
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  0%, 90% {
    transform: rotate(0deg);
  }
  95% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.api-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  font-size: 0.9rem;
  width: fit-content;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.status-text {
  font-weight: 600;
}

.input-card, .decision-card, .result-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-card label {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.input-card textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

.input-card textarea:focus {
  outline: none;
  border-color: #667eea;
}

.primary-btn {
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  margin-bottom: 30px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.question-header {
  margin-bottom: 30px;
}

.step-indicator {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  animation: fadeInDown 0.5s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.question-header h2 {
  font-size: 1.5rem;
  color: #333;
  line-height: 1.4;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.option-btn {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2.5px solid #dee2e6;
  border-radius: 16px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  position: relative;
  overflow: hidden;
}

.option-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.option-btn:hover::before {
  left: 100%;
}

.option-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
  transform: translateX(8px) scale(1.02);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.option-btn:active {
  transform: translateX(8px) scale(0.98);
}

.option-icon {
  font-size: 1.8rem;
  margin-right: 16px;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.option-btn:hover .option-icon {
  transform: scale(1.2) rotate(5deg);
}

.option-text {
  flex: 1;
  font-weight: 500;
}

.back-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  border: 2px solid #d0d0d0;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #555;
}

.back-btn:hover {
  background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);
  transform: translateX(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.result-icon {
  font-size: 5rem;
  text-align: center;
  margin-bottom: 20px;
  animation: zoomIn 0.6s cubic-bezier(0.4, 0, 0.2, 1), float 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.result-card h2 {
  text-align: center;
  font-size: 2rem;
  color: #333;
  margin-bottom: 20px;
}

.result-content {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 30px;
  border-radius: 16px;
  margin-bottom: 30px;
  border: 2px solid #dee2e6;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

.result-content p {
  font-size: 1.15rem;
  line-height: 1.8;
  color: #333;
  font-weight: 500;
}

.result-path h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #333;
}

.path-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

.path-step {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  animation: slideInLeft 0.5s ease-out backwards;
  animation-delay: calc(var(--index) * 0.1s);
}

.path-step:hover {
  transform: translateX(5px);
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.path-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.95rem;
  margin-right: 14px;
  box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3);
}

.path-text {
  flex: 1;
  color: #333;
  font-weight: 500;
  font-size: 1rem;
}

.share-section {
  margin: 30px 0;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  border: 2px solid #dee2e6;
}

.share-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.share-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
}

.share-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.share-loading-text {
  display: inline-block;
}

/* 环形进度条 */
.circular-progress-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 25px auto;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.circular-progress {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: #e0e0e0;
  stroke-width: 8;
}

.progress-bar {
  fill: none;
  stroke: url(#activeGradient);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 339.292;
  stroke-dashoffset: 339.292;
  transition: stroke-dashoffset 0.3s ease;
  filter: drop-shadow(0 0 6px rgba(102, 126, 234, 0.5));
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-percentage {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 4px;
}

.progress-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.share-result {
  margin-top: 15px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.share-link-container {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.share-link-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: monospace;
  background: white;
  color: #333;
}

.copy-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.share-hint {
  font-size: 0.85rem;
  color: #666;
  text-align: center;
  margin: 0;
}

/* 加载动画 */
.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 加载覆盖层 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-animation {
  background: white;
  border-radius: 24px;
  padding: 50px 60px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.brain-icon,
.tree-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: bounce 1.5s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.dot {
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  animation: dotPulse 1.4s ease-in-out infinite;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-text {
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
  margin-bottom: 25px;
}

.loading-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  background-size: 200% 100%;
  border-radius: 3px;
  animation: loadingProgress 1.5s ease-in-out infinite;
}

@keyframes loadingProgress {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.shared-section {
  width: 100%;
}

.shared-question {
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  margin-bottom: 20px;
  font-size: 1.1rem;
  line-height: 1.6;
}

.shared-question strong {
  color: #667eea;
  margin-right: 8px;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .input-card, .decision-card, .result-card {
    padding: 25px;
  }
  
  .share-link-container {
    flex-direction: column;
  }
  
  .copy-btn {
    width: 100%;
  }
}
</style>
