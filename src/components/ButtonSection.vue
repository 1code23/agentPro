<script setup>
import { ref } from 'vue'

// 加载状态演示
const loading = ref(false)
const handleLoad = () => {
  loading.value = true
  setTimeout(() => (loading.value = false), 2000)
}
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span class="card-title">按钮 Button</span>
    </template>

    <!-- 常用类型 -->
    <div class="block">
      <div class="label">常用类型</div>
      <el-button>默认按钮</el-button>
      <el-button type="primary">主要按钮</el-button>
      <el-button type="success">成功按钮</el-button>
      <el-button type="warning">警告按钮</el-button>
      <el-button type="danger">危险按钮</el-button>
      <el-button type="info">信息按钮</el-button>
    </div>

    <!-- 朴素 / 虚线 / 文字 / 链接 -->
    <div class="block">
      <div class="label">朴素、虚线、文字、链接</div>
      <el-button plain>朴素</el-button>
      <el-button type="primary" plain>朴素主要</el-button>
      <el-button type="success" dashed>虚线</el-button>
      <el-button type="primary" text>文字按钮</el-button>
      <el-button type="danger" text>危险文字</el-button>
      <el-button type="primary" link>链接按钮</el-button>
    </div>

    <!-- 尺寸与圆角 -->
    <div class="block">
      <div class="label">尺寸</div>
      <el-button size="large" type="primary">大尺寸</el-button>
      <el-button size="default" type="primary">默认</el-button>
      <el-button size="small" type="primary">小尺寸</el-button>
      <el-button round type="success">圆角</el-button>
      <el-button circle type="danger">
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>

    <!-- 图标 / 加载 / 禁用 -->
    <div class="block">
      <div class="label">图标、加载、禁用</div>
      <el-button type="primary" :icon="'Search'">搜索</el-button>
      <el-button type="success" :icon="'Edit'">编辑</el-button>
      <el-button type="warning" :loading="loading" @click="handleLoad">
        点击加载
      </el-button>
      <el-button disabled>禁用按钮</el-button>
    </div>

    <!-- 按钮组 -->
    <div class="block">
      <div class="label">按钮组</div>
      <el-button-group>
        <el-button :icon="'ArrowLeft'">上一页</el-button>
        <el-button :icon="'ArrowRight'">下一页</el-button>
      </el-button-group>
    </div>
  </el-card>
</template>

<style scoped>
.block {
  margin-bottom: 20px;
}

.block:last-child {
  margin-bottom: 0;
}

.label {
  margin-bottom: 10px;
  font-size: 13px;
  color: #909399;
}

.card-title {
  font-weight: 600;
}

.el-button {
  margin: 0 8px 8px 0;
}
</style>
