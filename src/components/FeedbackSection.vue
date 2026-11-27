<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 对话框显隐
const dialogVisible = ref(false)

// 进度条演示数据
const progress = ref(70)

// 各类消息提示：btnType 为按钮类型（无 error），msgType 为 ElMessage 类型（支持 error）
const messages = [
  { label: '成功', btnType: 'success', msgType: 'success' },
  { label: '警告', btnType: 'warning', msgType: 'warning' },
  { label: '错误', btnType: 'danger', msgType: 'error' },
  { label: '信息', btnType: 'info', msgType: 'info' }
]

const showMessage = (type) => {
  ElMessage({ type, message: `这是一条${type}提示消息` })
}

const handleConfirm = () => {
  dialogVisible.value = false
  ElMessage.success('已确认操作')
}
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span class="card-title">反馈与展示</span>
    </template>

    <!-- 消息提示 -->
    <div class="block">
      <div class="label">消息提示 Message</div>
      <el-button
        v-for="m in messages"
        :key="m.msgType"
        :type="m.btnType"
        @click="showMessage(m.msgType)"
      >
        {{ m.label }}提示
      </el-button>
    </div>

    <!-- 对话框 -->
    <div class="block">
      <div class="label">对话框 Dialog</div>
      <el-button type="primary" @click="dialogVisible = true">打开对话框</el-button>
      <el-dialog v-model="dialogVisible" title="操作确认" width="420px">
        <p>确定要执行该操作吗？此为演示内容。</p>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- 标签 -->
    <div class="block">
      <div class="label">标签 Tag</div>
      <el-tag type="success">正常</el-tag>
      <el-tag type="warning" closable>预警</el-tag>
      <el-tag type="danger" closable>故障</el-tag>
      <el-tag type="info" effect="dark">归档</el-tag>
      <el-tag type="primary" effect="plain">默认</el-tag>
    </div>

    <!-- 进度条 -->
    <div class="block">
      <div class="label">进度条 Progress</div>
      <el-progress :percentage="progress" />
      <el-progress type="circle" :percentage="progress" :width="70" />
      <el-progress type="dashboard" :percentage="progress" />
    </div>

    <!-- 描述列表 -->
    <div class="block">
      <div class="label">描述列表 Descriptions</div>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="设备编号">DT-001</el-descriptions-item>
        <el-descriptions-item label="负责人">张三</el-descriptions-item>
        <el-descriptions-item label="所属车间">一号车间</el-descriptions-item>
        <el-descriptions-item label="安装日期">2026-01-15</el-descriptions-item>
        <el-descriptions-item label="运行状态">正常</el-descriptions-item>
        <el-descriptions-item label="维保周期">90 天</el-descriptions-item>
      </el-descriptions>
    </div>
  </el-card>
</template>

<style scoped>
.block {
  margin-bottom: 24px;
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

.el-button,
.el-tag,
.el-progress {
  margin: 0 8px 8px 0;
}
</style>
