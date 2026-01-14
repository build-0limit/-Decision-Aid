<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>⚙️ API 配置中心</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="config-section">
            <label class="config-label">
              <span class="label-text">选择 LLM 服务商</span>
              <span class="label-badge">必填</span>
            </label>
            <select v-model="localConfig.provider" class="config-select">
              <option value="mock">模拟数据（演示）</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="custom">自定义 API</option>
            </select>
          </div>

          <div v-if="localConfig.provider !== 'mock'" class="config-section">
            <label class="config-label">
              <span class="label-text">API Key</span>
              <span class="label-badge">必填</span>
            </label>
            <div class="input-with-icon">
              <input
                v-model="localConfig.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                class="config-input"
                :placeholder="getApiKeyPlaceholder()"
              />
              <button 
                class="toggle-visibility-btn" 
                @click="showApiKey = !showApiKey"
                type="button"
              >
                {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <p class="input-hint">
              {{ getApiKeyHint() }}
            </p>
          </div>

          <div v-if="localConfig.provider === 'openai'" class="config-section">
            <label class="config-label">
              <span class="label-text">模型</span>
            </label>
            <select v-model="localConfig.model" class="config-select">
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div v-if="localConfig.provider === 'anthropic'" class="config-section">
            <label class="config-label">
              <span class="label-text">模型</span>
            </label>
            <select v-model="localConfig.model" class="config-select">
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            </select>
          </div>

          <div v-if="localConfig.provider === 'custom'" class="config-section">
            <label class="config-label">
              <span class="label-text">API 端点</span>
              <span class="label-badge">必填</span>
            </label>
            <input
              v-model="localConfig.endpoint"
              type="url"
              class="config-input"
              placeholder="https://api.example.com/v1/chat/completions"
            />
            <p class="input-hint">
              输入完整的 API 端点 URL
            </p>
          </div>

          <div v-if="localConfig.provider === 'custom'" class="config-section">
            <label class="config-label">
              <span class="label-text">模型名称</span>
            </label>
            <input
              v-model="localConfig.model"
              type="text"
              class="config-input"
              placeholder="your-model-name"
            />
          </div>

          <div v-if="localConfig.provider !== 'mock'" class="config-section">
            <label class="config-label">
              <span class="label-text">Temperature</span>
              <span class="label-value">{{ localConfig.temperature }}</span>
            </label>
            <input
              v-model.number="localConfig.temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              class="config-slider"
            />
            <div class="slider-labels">
              <span>精确 (0)</span>
              <span>平衡 (1)</span>
              <span>创造 (2)</span>
            </div>
          </div>

          <div class="config-section">
            <label class="config-label">
              <span class="label-text">保存配置到本地</span>
            </label>
            <div class="checkbox-wrapper">
              <input
                v-model="localConfig.saveToLocal"
                type="checkbox"
                id="saveToLocal"
                class="config-checkbox"
              />
              <label for="saveToLocal" class="checkbox-label">
                下次自动加载配置（使用浏览器 localStorage）
              </label>
            </div>
          </div>

          <div v-if="testResult" class="test-result" :class="testResult.type">
            <span class="result-icon">{{ testResult.type === 'success' ? '✅' : '❌' }}</span>
            <span class="result-text">{{ testResult.message }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            class="btn btn-secondary" 
            @click="testConnection"
            :disabled="testing || !canTest"
          >
            <span v-if="testing">测试中...</span>
            <span v-else>🔍 测试连接</span>
          </button>
          <button 
            class="btn btn-primary" 
            @click="saveConfig"
            :disabled="!isValid"
          >
            💾 保存配置
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  config: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'save'])

const showApiKey = ref(false)
const testing = ref(false)
const testResult = ref(null)

const localConfig = ref({
  provider: 'mock',
  apiKey: '',
  model: 'gpt-4',
  endpoint: '',
  temperature: 0.7,
  saveToLocal: true,
  ...props.config
})

// 监听配置变化
watch(() => props.config, (newConfig) => {
  localConfig.value = { ...localConfig.value, ...newConfig }
}, { deep: true })

// 验证配置是否有效
const isValid = computed(() => {
  if (localConfig.value.provider === 'mock') return true
  if (!localConfig.value.apiKey) return false
  if (localConfig.value.provider === 'custom' && !localConfig.value.endpoint) return false
  return true
})

// 是否可以测试
const canTest = computed(() => {
  return localConfig.value.provider !== 'mock' && isValid.value
})

// 获取 API Key 占位符
function getApiKeyPlaceholder() {
  const placeholders = {
    openai: 'sk-...',
    anthropic: 'sk-ant-...',
    custom: '输入你的 API Key'
  }
  return placeholders[localConfig.value.provider] || '输入你的 API Key'
}

// 获取 API Key 提示
function getApiKeyHint() {
  const hints = {
    openai: '在 OpenAI 平台获取：https://platform.openai.com/api-keys',
    anthropic: '在 Anthropic 控制台获取：https://console.anthropic.com/',
    custom: '从你的 API 服务商获取 API Key'
  }
  return hints[localConfig.value.provider] || ''
}

// 测试连接
async function testConnection() {
  testing.value = true
  testResult.value = null
  
  try {
    // 模拟测试 API 连接
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 这里应该调用实际的 API 测试
    // const result = await testApiConnection(localConfig.value)
    
    testResult.value = {
      type: 'success',
      message: 'API 连接测试成功！'
    }
  } catch (error) {
    testResult.value = {
      type: 'error',
      message: `连接失败：${error.message}`
    }
  } finally {
    testing.value = false
  }
}

// 保存配置
function saveConfig() {
  emit('save', { ...localConfig.value })
  closeModal()
}

// 关闭模态框
function closeModal() {
  testResult.value = null
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 30px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #666;
}

.close-btn:hover {
  background: #f0f0f0;
  transform: rotate(90deg);
  color: #333;
}

.modal-body {
  padding: 30px;
  overflow-y: auto;
  flex: 1;
}

.config-section {
  margin-bottom: 24px;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.label-text {
  flex: 1;
}

.label-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.label-value {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 700;
}

.config-input,
.config-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background: white;
}

.config-input:focus,
.config-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-with-icon {
  position: relative;
}

.input-with-icon .config-input {
  padding-right: 50px;
}

.toggle-visibility-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.2rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.toggle-visibility-btn:hover {
  background: #f0f0f0;
}

.input-hint {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

.config-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.config-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.config-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.config-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.8rem;
  color: #999;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-label {
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
  user-select: none;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  margin-top: 20px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.test-result.success {
  background: #d4edda;
  border: 2px solid #c3e6cb;
  color: #155724;
}

.test-result.error {
  background: #f8d7da;
  border: 2px solid #f5c6cb;
  color: #721c24;
}

.result-icon {
  font-size: 1.5rem;
}

.result-text {
  flex: 1;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 30px;
  border-top: 2px solid #f0f0f0;
  background: #fafafa;
}

.btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover:not(:disabled) {
  background: #f0f0ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}

/* 滚动条样式 */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>
