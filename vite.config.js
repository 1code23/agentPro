import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    devtools: {
      // Remove this `apply` property to enable devtools for build as well
      apply: 'serve',
    },
    plugins: [vue()],
    server: {
      proxy: {
        // 浏览器请求 /api/deepseek/chat/completions 会被转发到 DeepSeek，
        // Authorization 在这里注入，Key 不会出现在前端代码里。
        '/api/deepseek': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
          headers: {
            Authorization: `Bearer ${env.DEEPSEEK_API_KEY || ''}`,
          },
        },
      },
    },
  }
})
