<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 表格模拟数据
const tableData = ref([
  { id: 'DT-001', name: '一号机组', temp: 45, rpm: 1200, status: 'normal' },
  { id: 'DT-002', name: '二号机组', temp: 78, rpm: 1450, status: 'warning' },
  { id: 'DT-003', name: '三号机组', temp: 86, rpm: 1500, status: 'error' },
  { id: 'DT-004', name: '四号机组', temp: 52, rpm: 1180, status: 'normal' },
  { id: 'DT-005', name: '五号机组', temp: 61, rpm: 1320, status: 'warning' }
])

// 状态映射：文案 + 标签类型
const statusMap = {
  normal: { text: '正常', type: 'success' },
  warning: { text: '预警', type: 'warning' },
  error: { text: '故障', type: 'danger' }
}

const handleView = (row) => {
  ElMessage.info(`查看设备：${row.id}（${row.name}）`)
}

const handleDelete = (row) => {
  ElMessage.warning(`删除设备：${row.id}（演示，未真正删除）`)
}
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span class="card-title">表格 Table</span>
    </template>

    <el-table :data="tableData" border stripe style="width: 100%">
      <el-table-column prop="id" label="设备编号" width="110" />
      <el-table-column prop="name" label="设备名称" min-width="120" />
      <el-table-column prop="temp" label="核心温度(℃)" width="110" sortable />
      <el-table-column prop="rpm" label="转速(RPM)" width="110" sortable />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status].type" effect="light">
            {{ statusMap[row.status].text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页演示 -->
    <el-pagination
      class="pager"
      layout="total, prev, pager, next, jumper"
      :total="50"
      :page-size="10"
      background
    />
  </el-card>
</template>

<style scoped>
.card-title {
  font-weight: 600;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
