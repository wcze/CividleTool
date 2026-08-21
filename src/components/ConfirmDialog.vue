<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="confirm-overlay"
      @click.self="visible = false"
    >
      <div class="confirm-panel" role="alertdialog" aria-modal="true">
        <div class="confirm-title">
          {{ title }}
        </div>
        <div class="confirm-message">
          <slot>{{ message }}</slot>
        </div>
        <div class="confirm-actions">
          <button type="button" class="confirm-btn cancel" @click="visible = false">
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="confirm-btn ok"
            :class="{ danger }"
            @click="onConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// 通用确认框组件（通过 v-model 控制显示/隐藏）
// 用法：<ConfirmDialog v-model="show" title="标题" message="内容" @confirm="...">...</ConfirmDialog>
const visible = defineModel({ type: Boolean, default: false })

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  danger: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm'])

function onConfirm() {
  emit('confirm')
  visible.value = false
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: confirm-fade 0.18s ease;
}

.confirm-panel {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 400px;
  padding: 20px 22px 16px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
  animation: confirm-pop 0.2s ease;
}

.confirm-title {
  color: #1a2332;
  font-size: 16px;
  font-weight: 600;
}

.confirm-message {
  margin-top: 10px;
  color: #6b7a8f;
  font-size: 13px;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.confirm-btn {
  height: 36px;
  padding: 0 18px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease, opacity 150ms ease;
}

.confirm-btn.cancel {
  background: #eef2f7;
  color: #6b7a8f;
}

.confirm-btn.cancel:hover {
  background: #e4e9f0;
  color: #1a2332;
}

.confirm-btn.ok {
  background: #4a90d9;
  color: #ffffff;
}

.confirm-btn.ok:hover {
  background: #3d7fc4;
}

.confirm-btn.ok.danger {
  background: #4a90d9;
}

.confirm-btn.ok.danger:hover {
  background: #3d7fc4;
}

@keyframes confirm-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes confirm-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
