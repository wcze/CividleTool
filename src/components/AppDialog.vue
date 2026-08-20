<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="dialog-overlay"
      @click.self="visible = false"
    >
      <div class="dialog-panel" role="dialog" aria-modal="true" :aria-label="title">
        <div class="dialog-header">
          <h3>{{ title }}</h3>
          <button type="button" class="dialog-close" @click="visible = false">✕</button>
        </div>
        <div class="dialog-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// 通用弹窗组件（通过 v-model 控制显示/隐藏）
// 用法：<AppDialog v-model="show" title="标题"><img src="..." /></AppDialog>
const visible = defineModel({ type: Boolean, default: false })

defineProps({
  title: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: dialog-fade 0.18s ease;
}

.dialog-panel {
  background: #ffffff;
  border-radius: 16px;
  max-width: min(760px, 100%);
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
  overflow: hidden;
  animation: dialog-pop 0.2s ease;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #eef2f6;
}

.dialog-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a2332;
  margin: 0;
}

.dialog-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f0f5fe;
  border: 1px solid #dce6f2;
  color: #6b7a8f;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: #e4e9f0;
  color: #1a2332;
}

.dialog-body {
  padding: 16px 18px 20px;
  overflow: auto;
}

.dialog-body img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
}

@keyframes dialog-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dialog-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 移动端适配：弹窗改为底部弹出 */
@media (max-width: 600px) {
  .dialog-overlay {
    padding: 12px;
    align-items: flex-end;
  }
  .dialog-panel {
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
  }
}
</style>
