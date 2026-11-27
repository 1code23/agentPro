import { createApp } from 'vue'
import ElementPlus from 'element-plus'
// Element Plus 样式
import 'element-plus/dist/index.css'
// 中文语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 全部图标组件
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// 全局注册所有 Element Plus 图标，模板中可直接 <IconName /> 使用
for (const [iconName, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(iconName, component)
}

// 注册 Element Plus 并指定中文语言
app.use(ElementPlus, { locale: zhCn })

// 注册路由
app.use(router)

app.mount('#app')
