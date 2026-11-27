/**
 * 无 API Key 的 Agent 最小实现（Mock 模型）
 *
 * 结构和一个真实 Agent 完全一致：
 *   1. 把 messages + 工具定义（schemas）交给模型
 *   2. 模型返回 tool_calls → 本地执行工具
 *   3. 把工具结果以 role: 'tool' 回填到 messages
 *   4. 再次请求模型，直到模型不再调用工具
 *
 * 接真实模型时，只需要把 mockLLM 换成
 * POST /api/llm/chat/completions 的 fetch，循环和回填逻辑不用动。
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 工具定义：告诉模型「有哪些工具、参数长什么样」
export const toolSchemas = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '查询指定城市的实时天气',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称，如 北京' }
        },
        required: ['city']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_time',
      description: '获取当前时间',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
]

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆']

const WEATHER = {
  北京: { temp: 22, desc: '晴' },
  上海: { temp: 25, desc: '多云' },
  广州: { temp: 29, desc: '小雨' },
  深圳: { temp: 28, desc: '阴' },
  杭州: { temp: 24, desc: '多云' },
  成都: { temp: 21, desc: '阴' }
}

// 工具的真实实现：模型只会生成参数，真正执行在这里
export const toolImpls = {
  async get_weather({ city }) {
    const weather = WEATHER[city] || { temp: 20, desc: '晴' }
    return { city, ...weather, unit: '℃' }
  },
  async get_time() {
    return {
      now: new Date().toLocaleString('zh-CN', { hour12: false }),
      timezone: 'Asia/Shanghai'
    }
  }
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

let callSeq = 0

// 用几条规则冒充大模型：根据用户问题决定「调哪个工具 / 直接回答」
function mockLLM(messages) {
  const last = messages[messages.length - 1]

  // 上一轮已经有工具结果 → 组织最终回答
  if (last.role === 'tool') {
    const parts = []
    for (const message of messages) {
      if (message.role !== 'tool') continue
      const data = safeParse(message.content)
      if (data.temp !== undefined) {
        parts.push(`${data.city}现在 ${data.temp}℃，${data.desc}`)
      }
      if (data.now) {
        parts.push(`当前时间是 ${data.now}`)
      }
    }
    return {
      role: 'assistant',
      content: parts.length
        ? `根据工具返回的结果：${parts.join('；')}。`
        : '工具没有返回可用数据。'
    }
  }

  const text = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join('\n')

  const toolCalls = []

  if (/天气|气温|温度/.test(text)) {
    const city = CITIES.find((item) => text.includes(item)) || '北京'
    toolCalls.push({
      id: `call_${++callSeq}`,
      type: 'function',
      function: {
        name: 'get_weather',
        arguments: JSON.stringify({ city })
      }
    })
  }

  if (/几点|时间|日期/.test(text)) {
    toolCalls.push({
      id: `call_${++callSeq}`,
      type: 'function',
      function: {
        name: 'get_time',
        arguments: '{}'
      }
    })
  }

  if (toolCalls.length) {
    // 和真实模型一样：content 为空，只给 tool_calls
    return { role: 'assistant', content: null, tool_calls: toolCalls }
  }

  return {
    role: 'assistant',
    content: '你好，我是这个 Demo 里的模拟模型。试试问我「北京天气怎么样」或「现在几点了」。'
  }
}

/**
 * Agent 主循环
 * @param {string} userText 用户输入
 * @param {object} options
 * @param {Array}  options.messages 外部传入的消息数组（会被原地修改，便于页面展示完整上下文）
 * @param {number} options.maxRounds 最大循环轮数，防止死循环
 * @param {Function} options.onEvent 每一步的回调，用于 UI 展示
 * @param {number} options.delay 模拟模型思考耗时
 * @returns {Promise<string>} 最终回答
 */
export async function runAgent(
  userText,
  { messages = [], maxRounds = 4, onEvent = () => {}, delay = 450 } = {}
) {
  messages.push({ role: 'user', content: userText })

  for (let round = 1; round <= maxRounds; round++) {
    onEvent({ round, type: 'request' })
    await sleep(delay)

    const reply = mockLLM(messages)
    messages.push(reply)

    const toolCalls = (reply.tool_calls || []).map((call) => ({
      id: call.id,
      name: call.function.name,
      args: safeParse(call.function.arguments)
    }))

    onEvent({ round, type: 'decision', toolCalls })

    if (!toolCalls.length) {
      onEvent({ round, type: 'answer', content: reply.content })
      return reply.content
    }

    for (const call of toolCalls) {
      const result = await toolImpls[call.name](call.args)
      onEvent({ round, type: 'tool_result', name: call.name, result })
      await sleep(delay)
      // 关键：回填时必须带 tool_call_id
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
