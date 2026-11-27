<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const formRef = ref(null)

// 表单数据模型
const form = reactive({
  name: '',
  deviceType: '',
  level: 'A',
  notify: [],
  enabled: true,
  speed: 40,
  date: ''
})

// 下拉选项
const deviceTypes = [
  { value: 'pump', label: '水泵' },
  { value: 'fan', label: '风机' },
  { value: 'motor', label: '电机' },
  { value: 'sensor', label: '传感器' }
]

// 复选选项
const notifyOptions = [
  { value: 'sms', label: '短信通知' },
  { value: 'mail', label: '邮件通知' },
  { value: 'webhook', label: 'Webhook' }
]

// 校验规则
const rules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }]
}

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('表单校验通过，提交成功（演示）')
    } else {
      ElMessage.error('表单校验未通过，请检查必填项')
    }
  })
}

const handleReset = () => {
  formRef.value.resetFields()
}
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span class="card-title">表单 Form</span>
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
      style="max-width: 640px"
    >
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入设备名称" clearable />
      </el-form-item>

      <el-form-item label="设备类型" prop="deviceType">
        <el-select v-model="form.deviceType" placeholder="请选择" style="width: 100%">
          <el-option
            v-for="item in deviceTypes"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="优先级">
        <el-radio-group v-model="form.level">
          <el-radio value="A">A级</el-radio>
          <el-radio value="B">B级</el-radio>
          <el-radio value="C">C级</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="通知方式">
        <el-checkbox-group v-model="form.notify">
          <el-checkbox v-for="item in notifyOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="启用设备">
        <el-switch v-model="form.enabled" />
      </el-form-item>

      <el-form-item label="运行阈值">
        <el-slider v-model="form.speed" style="width: 240px" />
        <span class="value-tip">{{ form.speed }}</span>
      </el-form-item>

      <el-form-item label="投产日期">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.card-title {
  font-weight: 600;
}

.value-tip {
  margin-left: 12px;
  color: #606266;
}
</style>
