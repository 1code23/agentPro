<template>
  <div class="agent-demo">
    <el-card shadow="never" class="intro">
      <div class="intro-head">
        <div class="intro-text">
          <h3 class="intro-title">Agent 最小 Demo</h3>
          <p class="intro-desc">
            没有 API Key：用本地 Mock 模型模拟 function calling，把「模型决策 → 调用工具 → 回填结果 → 再决策」的循环完整跑一遍。
          </p>
        </div>
        <el-tag type="success" effect="plain">Mock · 无需网络</el-tag>
      </div>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="接入真实模型时，只需把 mockAgent.js 里的 mockLLM 换成 fetch('/api/llm/chat/completions')，循环与回填逻辑不用改。"
      />
    </el-card>

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="panel">
          <template #header>
            <span class="panel-title">对话</span>
          </template>
          <!-- 对话列表 -->
          <div ref="listRef" class="chat-list">
            <div v-if="!chat.length" class="chat-empty">试试下面的问题，同时观察右侧的执行过程</div>
            <div
              v-for="(message, index) in chat"
              :key="index"
              class="bubble-row"
              :class="message.role"
            >
              <div class="bubble" :class="message.role">{{ message.content }}</div>
            </div>
          </div>
          <!-- 问题快捷标签 -->
          <div class="presets">
            <el-tag
              v-for="question in presets"
              :key="question"
              class="preset"
              effect="plain"
              :class="{ disabled: loading }"
              @click="ask(question)"
            >
              {{ question }}
            </el-tag>
          </div>
          <!-- 问题输入框 -->
          <div class="composer">
            <el-input
              v-model="input"
              placeholder="问点需要工具的问题，如：北京天气怎么样"
              :disabled="loading"
              @keyup.enter="send"
            />
            <el-button type="primary" :loading="loading" @click="send">发送</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="panel-head">
              <span class="panel-title">执行过程</span>
              <el-tag v-if="round" size="small" type="info" effect="plain">共 {{ round }} 轮</el-tag>
            </div>
          </template>

          <div v-if="!steps.length" class="steps-empty">
            发送消息后，这里会显示每一轮模型决策和工具执行
          </div>
          <el-timeline v-else class="steps">
            <el-timeline-item
              v-for="(step, index) in steps"
              :key="index"
              :type="step.color"
              :hollow="step.hollow"
            >
              <div class="step-title">{{ step.title }}</div>
              <pre v-if="step.detail" class="step-detail">{{ step.detail }}</pre>
            </el-timeline-item>
          </el-timeline>

          <el-collapse v-if="protocol.length" class="protocol">
            <el-collapse-item title="查看 messages 数组（模型看到的上下文）" name="messages">
              <pre class="protocol-pre">{{ protocolText }}</pre>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { runAgent } from '../agent/mockAgent'

const chat = ref([])
const steps = ref([])
const protocol = ref([])
const input = ref('')
const loading = ref(false)
const round = ref(0)
const listRef = ref(null)

const presets = ['北京天气怎么样？', '现在几点了？', '查一下上海天气和时间', '你好']

const protocolText = computed(() => JSON.stringify(protocol.value, null, 2))

const scrollToBottom = async () => {
  await nextTick()
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

const pushStep = (step) => {
  steps.value.push(step)
}

// 把 Agent 循环里的每一步翻译成左侧时间线
const handleEvent = (event) => {
  round.value = Math.max(round.value, event.round || 0)

  if (event.type === 'request') {
    pushStep({
      title: `第 ${event.round} 轮 · 发送 messages + 工具定义`,
      color: 'info'
    })
    return
  }

  if (event.type === 'decision') {
    const hasTools = event.toolCalls.length > 0
    pushStep({
      title: hasTools
        ? `第 ${event.round} 轮 · 模型决定调用 ${event.toolCalls.length} 个工具`
        : `第 ${event.round} 轮 · 模型决定直接回答`,
      detail: hasTools
        ? event.toolCalls.map((call) => `${call.name}(${JSON.stringify(call.args)})`).join('\n')
        : null,
      color: hasTools ? 'primary' : 'info'
    })
    return
  }

  if (event.type === 'tool_result') {
    pushStep({
      title: `执行工具 ${event.name}`,
      detail: JSON.stringify(event.result, null, 2),
      color: 'success'
    })
    return
  }

  if (event.type === 'answer') {
    pushStep({
      title: `第 ${event.round} 轮 · 没有 tool_calls，循环结束`,
      detail: '模型生成最终回答（见左侧对话）',
      color: 'success',
      hollow: true
    })
  }
}

const ask = (question) => {
  if (loading.value) return
  input.value = question
  send()
}

const send = async () => {
  const text = input.value.trim()
  if (!text || loading.value) return

  input.value = ''
  chat.value.push({ role: 'user', content: text })
  scrollToBottom()

  loading.value = true
  steps.value = []
  protocol.value = []
  round.value = 0

  try {
    const answer = await runAgent(text, { messages: protocol.value, onEvent: handleEvent })
    chat.value.push({ role: 'assistant', content: answer })
  } catch (error) {
    chat.value.push({ role: 'assistant', content: `出错了：${error.message}` })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.agent-demo {
  text-align: left;
}

.intro {
  margin-bottom: 16px;
}

.intro-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.intro-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.intro-desc {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
}

.panel {
  height: 100%;
}

.panel-title {
  font-weight: 600;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-list {
  height: 340px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px;
}

.chat-empty,
.steps-empty {
  margin: auto;
  color: #909399;
  font-size: 13px;
  text-align: center;
  line-height: 1.7;
  padding: 24px 12px;
}

.bubble-row {
  display: flex;
}

.bubble-row.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f4f4f5;
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble.user {
  background: #1890ff;
  color: #fff;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}

.preset {
  cursor: pointer;
}

.preset.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.composer {
  display: flex;
  gap: 8px;
}

.steps {
  padding-left: 2px;
  max-height: 380px;
  overflow-y: auto;
}

.step-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  line-height: 1.6;
}

.step-detail {
  margin: 6px 0 0;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #606266;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 140px;
  overflow-y: auto;
}

.protocol {
  margin-top: 8px;
}

.protocol-pre {
  margin: 0;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 220px;
  overflow-y: auto;
}

@media (max-width: 992px) {
  .panel {
    margin-bottom: 16px;
  }
}
</style>
