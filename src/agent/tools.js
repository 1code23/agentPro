/**
 * 工具定义与实现（Mock 页和 DeepSeek 页共用）
 * - toolSchemas：发给模型的工具声明
 * - toolImpls：真正在浏览器里执行的函数
 */

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
