import { ref } from 'vue'

// 移动端侧边栏抽屉（汉堡菜单）是否打开
// 按钮在 App.vue 标题栏，抽屉在 ToolContainer.vue，用共享状态联动
export const drawerOpen = ref(false)
