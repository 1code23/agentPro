/**
 * 真实 DeepSeek Agent
 *
 * 浏览器只请求同源的 /api/deepseek/...，由 Vite dev 代理注入 Authorization，
 * 因此 API Key 不会出现在前端代码和打包产物里。
 *
 * 生产环境需要换成自己的后端中转，思路完全一样。
 */

import { toolSchemas, toolImpls } from './tools'

const ENDPOINT = '/api/deepseek/chat/completions'
export const MODEL = 'deepseek-chat'

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * 调用一次 DeepSeek Chat Completions
 * @returns {Promise<{message: object, usage: object|null}>}
 */
export async function chatCompletion(messages, { model = MODEL } = {}) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      tools: toolSchemas,
      tool_choice: 'auto',
      temperature: 0.3,
      stream: false
    })
  })

  const raw = await response.text()
  let data = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    const detail = data?.error?.message || raw || response.statusText
    throw new Error(`HTTP ${response.status} · ${detail}`)
  }

  const message = data?.choices?.[0]?.message
  if (!message) {
    throw new Error(`模型返回格式异常：${raw.slice(0, 200)}`)
  }

  return { message, usage: data.usage || null }
}

/**
 * Agent 主循环：请求模型 → 执行 tool_calls → 回填 → 再请求
 */
export async function runDeepSeekAgent(
  userText,
  { messages = [], maxRounds = 5, onEvent = () => {} } = {}
) {
  messages.push({ role: 'user', content: userText })

  for (let round = 1; round <= maxRounds; round++) {
    onEvent({ round, type: 'request' })

    const startedAt = performance.now()
    const { message, usage } = await chatCompletion(messages)
    const elapsed = Math.round(performance.now() - startedAt)

    messages.push(message)

    const toolCalls = (message.tool_calls || []).map((call) => ({
      id: call.id,
      name: call.function.name,
      args: safeParse(call.function.arguments)
    }))

    onEvent({ round, type: 'decision', toolCalls, usage, elapsed })

    if (!toolCalls.length) {
      const content = message.content || '(模型没有返回文本)'
      onEvent({ round, type: 'answer', content })
      return content
    }

    for (const call of toolCalls) {
      const impl = toolImpls[call.name]
      const result = impl ? await impl(call.args) : { error: `未知工具：${call.name}` }
      onEvent({ round, type: 'tool_result', name: call.name, args: call.args, result })
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result)
      })
    }
  }

  const fallback = '已达到最大轮数，循环停止。'
  onEvent({ round: maxRounds, type: 'answer', content: fallback })
  return fallback
}
