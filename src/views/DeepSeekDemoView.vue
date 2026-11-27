<template>
  <div class="deepseek-demo">
    <el-card shadow="never" class="intro">
      <div class="intro-head">
        <div class="intro-text">
          <h3 class="intro-title">DeepSeek 真实模型 Demo</h3>
          <p class="intro-desc">
            请求经由 Vite dev 代理转发到 DeepSeek，Authorization 在代理层注入；前端只发同源请求，Key 不会进入代码和打包产物。
          </p>
        </div>
        <div class="intro-tags">
          <el-tag type="success" effect="plain">deepseek-chat</el-tag>
          <el-tag type="info" effect="plain">function calling</el-tag>
        </div>
      </div>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="如果出现 401 / Authentication Fails，说明 .env.local 里的 DEEPSEEK_API_KEY 无效，换一个有效的 sk- 开头的 Key 即可。"
      />
    </el-card>

    <el-alert
      v-if="error"
      class="error"
      type="error"
      :closable="false"
      show-icon
      :title="error"
    />

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="panel-head">
              <span class="panel-title">对话</span>
              <span v-if="usageTotal.total" class="usage">
                tokens：{{ usageTotal.prompt }} + {{ usageTotal.completion }}
              </span>
            </div>
          </template>

          <div ref="listRef" class="chat-list">
            <div v-if="!chat.length" class="chat-empty">
              试试需要工具的问题：天气类会触发 get_weather，时间类会触发 get_time
            </div>
            <div
              v-for="(message, index) in chat"
              :key="index"
              class="bubble-row"
              :class="message.role"
            >
              <div class="bubble" :class="message.role">{{ message.content }}</div>
            </div>
            <div v-if="loading" class="bubble-row assistant">
              <div class="bubble assistant pending">DeepSeek 正在思考…</div>
            </div>
          </div>

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

          <div class="composer">
            <el-input
              v-model="input"
              placeholder="问点需要工具的问题，如：北京和上海哪个更热？"
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
            发送后这里会显示每一轮的真实请求、模型决策和工具执行
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
            <el-collapse-item title="查看 messages 数组（发给模型的内容）" name="messages">
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
import { runDeepSeekAgent, MODEL } from '../agent/deepseek'

const chat = ref([])
const steps = ref([])
const protocol = ref([])
const input = ref('')
const loading = ref(false)
const round = ref(0)
const error = ref('')
const listRef = ref(null)
const usageTotal = ref({ prompt: 0, completion: 0, total: 0 })

const presets = ['北京天气怎么样？', '现在几点了？', '查一下上海天气和时间', '你好，简单介绍一下你自己']

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

const handleEvent = (event) => {
  round.value = Math.max(round.value, event.round || 0)

  if (event.type === 'request') {
    pushStep({ title: `第 ${event.round} 轮 · 请求 ${MODEL}`, color: 'info' })
    return
  }

  if (event.type === 'decision') {
    if (event.usage) {
      usageTotal.value = {
        prompt: usageTotal.value.prompt + (event.usage.prompt_tokens || 0),
        completion: usageTotal.value.completion + (event.usage.completion_tokens || 0),
        total: usageTotal.value.total + (event.usage.total_tokens || 0)
      }
    }

    const hasTools = event.toolCalls.length > 0
    pushStep({
      title: hasTools
        ? `第 ${event.round} 轮 · 模型决定调用 ${event.toolCalls.length} 个工具（${event.elapsed}ms）`
        : `第 ${event.round} 轮 · 模型生成回答（${event.elapsed}ms）`,
      detail: hasTools
        ? event.toolCalls.map((call) => `${call.name}(${JSON.stringify(call.args)})`).join('\n')
        : null,
      color: hasTools ? 'primary' : 'success'
    })
    return
  }

  if (event.type === 'tool_result') {
    pushStep({
      title: `执行工具 ${event.name}`,
      detail: `参数：${JSON.stringify(event.args)}\n返回：${JSON.stringify(event.result, null, 2)}`,
      color: 'success'
    })
    return
  }

  if (event.type === 'answer') {
    pushStep({
      title: `第 ${event.round} 轮 · 没有 tool_calls，循环结束`,
      detail: '最终回答见左侧对话',
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
  error.value = ''
  chat.value.push({ role: 'user', content: text })
  scrollToBottom()

  loading.value = true
  steps.value = []
  protocol.value = []
  round.value = 0
  usageTotal.value = { prompt: 0, completion: 0, total: 0 }

  try {
    const answer = await runDeepSeekAgent(text, { messages: protocol.value, onEvent: handleEvent })
    chat.value.push({ role: 'assistant', content: answer })
  } catch (err) {
    error.value = err.message
    chat.value.push({ role: 'assistant', content: `请求失败：${err.message}` })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.deepseek-demo {
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

.intro-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.error {
  margin-bottom: 16px;
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

.usage {
  color: #909399;
  font-size: 12px;
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

.bubble.pending {
  color: #909399;
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
  max-height: 160px;
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
