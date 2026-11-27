<template>
  <el-container class="layout">
    <!-- 侧边导航 -->
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon><Star /></el-icon>
        <span>Element Plus Demo</span>
      </div>
      <el-menu :default-active="active" class="menu" @select="onSelect">
        <el-menu-item v-for="item in menus" :key="item.index" :index="item.index">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <span class="title">{{ currentTitle }}</span>
        <el-tag type="info" effect="plain">{{ currentTag }}</el-tag>
      </el-header>

      <!-- 内容区：首页展示组件，/agent 展示 Agent Demo -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 左侧菜单当前选中项
const active = ref('buttons')

// 菜单项配置：组件区用 index 与 section 的 id 对应，Agent Demo 用 path 走路由
const menus = [
  { index: 'buttons', label: '按钮 Button', icon: 'Pointer' },
  { index: 'table', label: '表格 Table', icon: 'Grid' },
  { index: 'form', label: '表单 Form', icon: 'Document' },
  { index: 'feedback', label: '反馈与展示', icon: 'Bell' },
  { index: 'agent', label: 'Agent Demo', icon: 'ChatDotRound', path: '/agent' },
  { index: 'deepseek', label: 'DeepSeek Demo', icon: 'MagicStick', path: '/deepseek' }
]

const currentTitle = computed(() => {
  if (route.path === '/agent') return 'Vue3 + 前端 Agent 最小 Demo'
  if (route.path === '/deepseek') return 'Vue3 + DeepSeek 真实模型 Demo'
  return 'Vue3 + Element Plus 组件展示 Demo'
})

const currentTag = computed(() => {
  if (route.path === '/agent') return 'Mock 模型 · 无 Key'
  if (route.path === '/deepseek') return 'DeepSeek · function calling'
  return '纯前端 · Vite 构建'
})

// 菜单点击：组件区滚动定位，Agent Demo 走路由跳转
const onSelect = async (index) => {
  active.value = index
  const target = menus.find((item) => item.index === index)

  if (target?.path) {
    router.push(target.path)
    return
  }

  if (route.path !== '/') {
    await router.push('/')
    await nextTick()
  }
  document.getElementById(index)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 直接访问子页面时同步菜单高亮
watch(
  () => route.path,
  (path) => {
    if (path === '/agent') active.value = 'agent'
    if (path === '/deepseek') active.value = 'deepseek'
  },
  { immediate: true }
)
</script>

<style scoped>
.layout {
  height: 100%;
}

.aside {
  background-color: #001529;
  color: #fff;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.menu {
  border-right: none;
  background-color: #001529;
}

.menu :deep(.el-menu-item) {
  color: #bfcbd9;
}

.menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background-color: #1890ff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.main {
  padding: 20px;
}
</style>
