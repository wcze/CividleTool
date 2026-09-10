<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="dialog-overlay"
      :class="{ 'dialog-overlay-large': large && teleport, 'dialog-overlay-viewport': fullscreenToggle && teleport, 'dialog-overlay-page': !teleport }"
      :style="overlayStyle"
      @click.self="visible = false"
    >
      <div class="dialog-panel" :class="{ 'dialog-panel-large': large && teleport, 'dialog-panel-viewport': fullscreenToggle && teleport, 'dialog-panel-page': !teleport, 'dialog-panel-from-origin': animateFromOrigin }" role="dialog" aria-modal="true"
        :aria-label="title" :style="animateFromOrigin && origin ? { '--dialog-origin-x': `${origin.x}px`, '--dialog-origin-y': `${origin.y}px` } : {}">
        <div class="dialog-header">
          <h3>{{ title }}</h3>
          <button
            v-if="fullscreenToggle"
            type="button"
            class="dialog-fullscreen"
            @click="fullscreen = !fullscreen"
          >
            <svg v-if="!fullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 3V5H4V9H2V3H8ZM2 21V15H4V19H8V21H2ZM22 21H16V19H20V15H22V21ZM22 9H20V5H16V3H22V9Z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18 7H22V9H16V3H18V7ZM8 9H2V7H6V3H8V9ZM18 17V21H16V15H22V17H18ZM8 15V21H6V17H2V15H8Z" />
            </svg>
          </button>
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
import { computed } from 'vue'
// 通用弹窗组件（通过 v-model 控制显示/隐藏）
// 用法：<AppDialog v-model="show" title="标题"><img src="..." /></AppDialog>
const visible = defineModel({ type: Boolean, default: false })
const fullscreen = defineModel('fullscreen', { type: Boolean, default: true })

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  large: {
    type: Boolean,
    default: false
  },
  fullscreenToggle: {
    type: Boolean,
    default: false
  },
  teleport: {
    type: Boolean,
    default: true
  },
  origin: {
    type: Object,
    default: null
  },
  pageBounds: {
    type: Object,
    default: null
  },
  animateFromOrigin: {
    type: Boolean,
    default: false
  }
})

const overlayStyle = computed(() => ({
  ...(props.animateFromOrigin && props.origin && {
    '--dialog-origin-x': `${props.origin.x}px`,
    '--dialog-origin-y': `${props.origin.y}px`
  }),
  ...(!props.teleport && props.pageBounds && {
    top: `${props.pageBounds.top}px`,
    right: 'auto',
    bottom: 'auto',
    left: `${props.pageBounds.left}px`,
    width: `${props.pageBounds.width}px`,
    height: `${props.pageBounds.height}px`
  })
}))
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
  --dialog-origin-x: 50vw;
  --dialog-origin-y: 50vh;
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
  animation: dialog-pop 0.15s ease-out;
  transform-origin: center center;
}

.dialog-panel-large {
  width: 95vw;
  max-width: 1600px;
  height: 95vh;
  max-height: 95vh;
}

.dialog-panel-viewport {
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
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

.dialog-fullscreen {
  flex-shrink: 0;
  margin-left: auto;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f0f5fe;
  border: 1px solid #dce6f2;
  color: #6b7a8f;
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-fullscreen:hover {
  background: #e4e9f0;
  color: #1a2332;
}

.dialog-fullscreen svg {
  display: block;
  width: 16px;
  height: 16px;
  margin: auto;
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

.dialog-overlay-page {
  position: fixed;
  inset: 0;
  z-index: 20;
  padding: 0;
  align-items: stretch;
}

.dialog-overlay-viewport {
  padding: 0;
  align-items: stretch;
}

.dialog-panel-page {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  border-radius: 0;
  box-shadow: none;
}

.dialog-body :deep(img) {
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
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes dialog-pop-from-origin {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}

.dialog-panel-from-origin {
  animation: dialog-pop-from-origin 0.15s ease-out;
  transform-origin: var(--dialog-origin-x) var(--dialog-origin-y);
}

/* 移动端适配：弹窗改为底部弹出 */
@media (max-width: 600px) {
  .dialog-overlay {
    padding: 12px;
    align-items: flex-end;
  }
  .dialog-panel {
    width: 100%;
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
  }
  .dialog-overlay-large {
    padding: 0;
    align-items: stretch;
  }
  .dialog-overlay-viewport {
    padding: 0;
    align-items: stretch;
  }
  .dialog-panel-large {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  .dialog-overlay-page {
    padding: 0;
    align-items: stretch;
  }
  .dialog-panel-page {
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}
</style>
