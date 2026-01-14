<template>
  <div class="tree-visualization">
    <div class="tree-container" ref="containerRef">
      <svg ref="svgRef" :width="svgWidth" :height="svgHeight">
        <defs>
          <!-- 渐变定义 -->
          <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
          
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
          
          <linearGradient id="resultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4caf50;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#45a049;stop-opacity:1" />
          </linearGradient>
          
          <!-- 发光滤镜 -->
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <!-- 阴影滤镜 -->
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- 连接线 -->
        <g class="links">
          <path
            v-for="(link, index) in links"
            :key="'link-' + index"
            :d="link.path"
            :class="['link', { 
              'link-active': link.isActive, 
              'link-visited': link.isVisited,
              'link-future': link.isFuture 
            }]"
            :style="{ animationDelay: `${index * 0.1}s` }"
          />
        </g>
        
        <!-- 节点背景光晕（仅当前节点） -->
        <g class="node-glows">
          <circle
            v-for="(node, index) in nodes"
            v-show="node.isCurrent"
            :key="'glow-' + index"
            :cx="node.x"
            :cy="node.y"
            :r="50"
            class="node-glow"
          />
        </g>
        
        <!-- 节点 -->
        <g class="nodes">
          <g
            v-for="(node, index) in nodes"
            :key="'node-' + index"
            :transform="`translate(${node.x}, ${node.y})`"
            :class="['node', { 
              'node-current': node.isCurrent, 
              'node-visited': node.isVisited,
              'node-result': node.isResult,
              'node-future': !node.isVisited && !node.isCurrent
            }]"
            :style="{ animationDelay: `${index * 0.05}s` }"
            @click="handleNodeClick(node)"
            @mouseenter="handleNodeHover(node, true)"
            @mouseleave="handleNodeHover(node, false)"
          >
          
            <!-- 节点外圈（装饰） -->
            <circle
              v-if="node.isCurrent"
              :r="node.isResult ? 32 : 38"
              class="node-outer-ring"
            />
            
            <!-- 节点圆圈 -->
            <circle
              :r="getNodeRadius(node)"
              :class="['node-circle', { 'pulse': node.isCurrent }]"
              filter="url(#shadow)"
            />
            
            <!-- 节点图标背景 -->
            <circle
              v-if="node.isCurrent || node.isResult"
              :r="getNodeRadius(node) * 0.6"
              class="icon-bg"
            />
            
            <!-- 节点图标 -->
            <text
              class="node-icon"
              text-anchor="middle"
              dy="0.35em"
              :style="{ fontSize: getIconSize(node) + 'px' }"
            >
              {{ getNodeIcon(node) }}
            </text>
            
            <!-- 节点标签背景 -->
            <rect
              v-if="node.label"
              :x="-getTextWidth(node.label) / 2 - 8"
              :y="getNodeRadius(node) + 8"
              :width="getTextWidth(node.label) + 16"
              :height="28"
              rx="14"
              class="label-bg"
            />
            
            <!-- 节点标签 -->
            <text
              v-if="node.label"
              class="node-label"
              text-anchor="middle"
              :y="getNodeRadius(node) + 26"
            >
              {{ truncateText(node.label, 20) }}
            </text>
            
            <!-- 节点序号（已访问） -->
            <text
              v-if="node.isVisited && node.visitOrder !== undefined"
              class="visit-order"
              text-anchor="middle"
              :y="-getNodeRadius(node) - 8"
            >
              {{ node.visitOrder }}
            </text>
          </g>
        </g>
      </svg>
    </div>
    
    <!-- 图例 -->
    <div class="tree-legend">
      <div class="legend-item">
        <span class="legend-icon">👉</span>
        <span class="legend-text">当前位置</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon">✓</span>
        <span class="legend-text">已访问</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon">❓</span>
        <span class="legend-text">未访问</span>
      </div>
      <div class="legend-item">
        <span class="legend-icon">🎯</span>
        <span class="legend-text">结果</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  treeData: {
    type: Object,
    required: true
  },
  currentNodeId: {
    type: String,
    required: true
  },
  visitedNodes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['node-click'])

const svgRef = ref(null)
const containerRef = ref(null)
const svgWidth = ref(1200)
const svgHeight = ref(700)
const nodes = ref([])
const links = ref([])
const hoveredNode = ref(null)

// 计算树的布局 - 改进的算法
function calculateTreeLayout(tree) {
  const nodeList = []
  const linkList = []
  let nodeIdCounter = 0
  const visitOrderMap = new Map()
  
  // 为已访问节点分配序号
  props.visitedNodes.forEach((nodeId, index) => {
    visitOrderMap.set(nodeId, index + 1)
  })
  
  // 第一遍遍历：计算每层的节点数量
  const levelCounts = new Map()
  function countNodes(node, depth = 0) {
    levelCounts.set(depth, (levelCounts.get(depth) || 0) + 1)
    if (node.options && node.options.length > 0) {
      node.options.forEach(option => {
        if (option.next) {
          countNodes(option.next, depth + 1)
        } else if (option.result) {
          countNodes(option, depth + 1)
        }
      })
    }
  }
  countNodes(tree)
  
  // 第二遍遍历：计算节点位置
  const levelIndices = new Map()
  
  function traverse(node, depth = 0, parentX = null, parentY = null, parentId = null, siblingIndex = 0, totalSiblings = 1) {
    const nodeId = `node-${nodeIdCounter++}`
    
    // 改进的垂直间距
    const baseHeight = 150
    const levelHeight = depth === 0 ? 80 : baseHeight
    const y = depth === 0 ? 60 : 60 + depth * levelHeight
    
    // 改进的水平布局
    const currentLevelIndex = levelIndices.get(depth) || 0
    levelIndices.set(depth, currentLevelIndex + 1)
    
    const nodesInLevel = levelCounts.get(depth) || 1
    const levelWidth = Math.max(800, nodesInLevel * 180)
    const spacing = levelWidth / (nodesInLevel + 1)
    const x = (svgWidth.value - levelWidth) / 2 + spacing * (currentLevelIndex + 1)
    
    const nodeData = {
      id: nodeId,
      label: node.question || node.text || node.result || '',
      x,
      y,
      depth,
      isCurrent: nodeId === props.currentNodeId,
      isVisited: props.visitedNodes.includes(nodeId),
      isResult: !!node.result,
      visitOrder: visitOrderMap.get(nodeId),
      data: node
    }
    
    nodeList.push(nodeData)
    
    // 创建连接线
    if (parentX !== null && parentY !== null) {
      const isOnPath = nodeData.isCurrent || nodeData.isVisited
      const parentVisited = nodeList.find(n => n.x === parentX && n.y === parentY)?.isVisited
      
      linkList.push({
        source: { x: parentX, y: parentY },
        target: { x, y },
        path: createSmoothPath(parentX, parentY, x, y),
        isActive: nodeData.isCurrent,
        isVisited: nodeData.isVisited && parentVisited,
        isFuture: !isOnPath
      })
    }
    
    // 递归处理子节点
    if (node.options && node.options.length > 0) {
      node.options.forEach((option, index) => {
        if (option.next) {
          traverse(option.next, depth + 1, x, y, nodeId, index, node.options.length)
        } else if (option.result) {
          traverse(option, depth + 1, x, y, nodeId, index, node.options.length)
        }
      })
    }
  }
  
  traverse(tree)
  
  // 动态调整SVG尺寸
  const maxDepth = Math.max(...nodeList.map(n => n.depth))
  const maxX = Math.max(...nodeList.map(n => n.x))
  const minX = Math.min(...nodeList.map(n => n.x))
  
  svgHeight.value = Math.max(700, (maxDepth + 1) * 150 + 150)
  svgWidth.value = Math.max(1200, maxX - minX + 300)
  
  return { nodes: nodeList, links: linkList }
}

// 创建平滑曲线路径
function createSmoothPath(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  
  // 使用更自然的贝塞尔曲线
  const controlPointOffset = Math.abs(dy) * 0.6
  const cx1 = x1
  const cy1 = y1 + controlPointOffset
  const cx2 = x2
  const cy2 = y2 - controlPointOffset
  
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
}

// 获取节点图标
function getNodeIcon(node) {
  if (node.isResult) return '🎯'
  if (node.isCurrent) return '👉'
  if (node.isVisited) return '✓'
  return '❓'
}

// 获取节点半径
function getNodeRadius(node) {
  if (node.isResult) return 28
  if (node.isCurrent) return 32
  if (node.isVisited) return 24
  return 20
}

// 获取图标大小
function getIconSize(node) {
  if (node.isResult) return 24
  if (node.isCurrent) return 26
  return 20
}

// 截断文本
function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 估算文本宽度
function getTextWidth(text) {
  const truncated = truncateText(text, 20)
  return truncated.length * 7 // 粗略估算
}

// 处理节点点击
function handleNodeClick(node) {
  emit('node-click', node)
}

// 处理节点悬停
function handleNodeHover(node, isHovering) {
  hoveredNode.value = isHovering ? node : null
}

// 更新树布局
function updateTree() {
  if (!props.treeData) return
  
  const layout = calculateTreeLayout(props.treeData)
  
  // 使用动画更新节点和连接线
  nodes.value = layout.nodes
  links.value = layout.links
}

// 监听数据变化
watch(() => [props.treeData, props.currentNodeId, props.visitedNodes], () => {
  nextTick(() => {
    updateTree()
  })
}, { deep: true, immediate: true })

// 响应式调整
onMounted(() => {
  const updateSize = () => {
    if (containerRef.value) {
      const containerWidth = containerRef.value.clientWidth
      svgWidth.value = Math.max(1200, containerWidth - 40)
      updateTree()
    }
  }
  
  updateSize()
  window.addEventListener('resize', updateSize)
  
  return () => {
    window.removeEventListener('resize', updateSize)
  }
})
</script>

<style scoped>
.tree-visualization {
  width: 100%;
  background: white;
  border-radius: 20px;
  padding: 30px 20px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  position: relative;
}

.tree-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 20px;
}

svg {
  display: block;
  margin: 0 auto;
}

/* 连接线样式 */
.link {
  fill: none;
  stroke: #e8e8e8;
  stroke-width: 2.5;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  animation: linkFadeIn 0.5s ease-out forwards;
}

@keyframes linkFadeIn {
  to {
    opacity: 1;
  }
}

.link-future {
  stroke: #e8e8e8;
  stroke-width: 2;
  stroke-dasharray: 5, 5;
  opacity: 0.4;
}

.link-visited {
  stroke: #9e9e9e;
  stroke-width: 3.5;
  opacity: 1;
}

.link-active {
  stroke: url(#activeGradient);
  stroke-width: 5;
  opacity: 1;
  filter: url(#glow);
  animation: flowAnimation 2s linear infinite;
}

@keyframes flowAnimation {
  0% {
    stroke-dasharray: 15 10;
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dasharray: 15 10;
    stroke-dashoffset: 25;
  }
}

/* 节点光晕 */
.node-glow {
  fill: #667eea;
  opacity: 0.15;
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.15;
    transform: scale(1);
  }
  50% {
    opacity: 0.25;
    transform: scale(1.2);
  }
}

/* 节点样式 */
.node {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  animation: nodeFadeIn 0.5s ease-out forwards;
}

@keyframes nodeFadeIn {
  to {
    opacity: 1;
  }
}

.node-outer-ring {
  fill: none;
  stroke: #667eea;
  stroke-width: 2;
  opacity: 0.3;
  animation: ringPulse 2s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% {
    opacity: 0.3;
    stroke-width: 2;
  }
  50% {
    opacity: 0.6;
    stroke-width: 3;
  }
}

.node-circle {
  fill: #f5f5f5;
  stroke: #d0d0d0;
  stroke-width: 2.5;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-future .node-circle {
  fill: #fafafa;
  stroke: #e0e0e0;
  stroke-width: 2;
  opacity: 0.6;
}

.node:hover .node-circle {
  transform: scale(1.15);
  filter: url(#shadow);
}

.node-visited .node-circle {
  fill: #e0e0e0;
  stroke: #9e9e9e;
  stroke-width: 3;
}

.node-current .node-circle {
  fill: url(#nodeGradient);
  stroke: #5568d3;
  stroke-width: 3.5;
  filter: url(#glow);
}

.node-result .node-circle {
  fill: url(#resultGradient);
  stroke: #45a049;
  stroke-width: 3.5;
  filter: url(#glow);
}

.icon-bg {
  fill: rgba(255, 255, 255, 0.3);
}

/* 脉冲动画 */
.pulse {
  animation: pulseAnimation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulseAnimation {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
}

/* 节点图标 */
.node-icon {
  font-size: 20px;
  pointer-events: none;
  user-select: none;
  transition: all 0.3s ease;
}

.node-current .node-icon {
  font-size: 26px;
  animation: bounceIcon 1.5s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

@keyframes bounceIcon {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.node-result .node-icon {
  font-size: 24px;
  animation: rotateIcon 3s ease-in-out infinite;
}

@keyframes rotateIcon {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

/* 标签背景 */
.label-bg {
  fill: white;
  opacity: 0.95;
  filter: url(#shadow);
  transition: all 0.3s ease;
}

.node:hover .label-bg {
  opacity: 1;
  fill: #f5f5f5;
}

.node-current .label-bg {
  fill: #667eea;
  opacity: 0.15;
}

.node-result .label-bg {
  fill: #4caf50;
  opacity: 0.15;
}

/* 节点标签 */
.node-label {
  font-size: 13px;
  fill: #333;
  pointer-events: none;
  user-select: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.node-current .node-label {
  fill: #667eea;
  font-weight: 700;
  font-size: 14px;
}

.node-result .node-label {
  fill: #4caf50;
  font-weight: 700;
  font-size: 14px;
}

.node-future .node-label {
  fill: #999;
  font-weight: 500;
}

/* 访问序号 */
.visit-order {
  font-size: 11px;
  font-weight: 700;
  fill: white;
  background: #667eea;
  padding: 2px 6px;
  border-radius: 10px;
}

/* 图例 */
.tree-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 15px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.legend-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.legend-icon {
  font-size: 18px;
}

.legend-text {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

/* 滚动条样式 */
.tree-container::-webkit-scrollbar {
  height: 10px;
}

.tree-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
  margin: 0 10px;
}

.tree-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.tree-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
}

/* 响应式 */
@media (max-width: 768px) {
  .tree-visualization {
    padding: 20px 10px 15px;
  }
  
  .tree-legend {
    gap: 15px;
    padding: 12px;
  }
  
  .legend-item {
    padding: 6px 12px;
  }
  
  .legend-icon {
    font-size: 16px;
  }
  
  .legend-text {
    font-size: 12px;
  }
}
</style>
