export default {
  nav: {
    home: '首页',
    openMenu: '打开菜单',
    about: '关于'
  },
  about: {
    title: '关于',
    close: '关闭',
    developer: '开发',
    dataSource: '数据来源',
    translationSource: '翻译来源',
    projectUrl: '项目地址',
    disclaimer: '本工具集由玩家自制，非官方发布，所有数据仅供参考。'
  },
  home: {
    subtitle: 'CivIdle 工具集',
    hintDesktop: '点击左侧菜单中的工具开始使用',
    hintMobile: '点击上方按钮打开菜单，选择工具',
    quickStart: '工具箱',
    steamSectionTitle: '关于游戏',
    developer: 'Fish Pond Studio 开发',
    freeToPlay: '免费游戏',
    free: '免费',
    visitSteam: '查看游戏详情',
    releaseDate: '发行日期：2025 年 12 月 5 日',
    tags: '挂机游戏 / 基地建设 / 自动化 / 历史 / 4X / 管理 / 资源管理'
  },
  sidebar: {
    title: '目录',
    backHome: '返回首页'
  },
  tools: {
    CalcBuildingsUpgrade: {
      name: '建筑升级计算器',
      description: '快速计算建筑升级成本与资源需求'
    },
    CalcExtraGreatPerson: {
      name: '伟人所需帝国价值',
      description: '计算第 N 个重生额外伟人所需要的帝国价值'
    }
  },
  calcBuildings: {
    title: '🏗️ 建筑资源',
    totalBuildings: '共 {count} 个建筑',
    subtitle: '搜索建筑名称，查看建造所需资源',
    searchPlaceholder: '搜索建筑...',
    foundCount: '找到 <strong>{count}</strong> 个建筑',
    noResults: '没有找到 "<strong>{keyword}</strong>" 相关的建筑',
    close: '关闭',
    currentLevel: '当前等级',
    targetLevel: '目标等级',
    buildingCount: '建筑数量',
    multiplier: '倍率',
    upgradeResources: '📊 升级所需资源',
    levelRange: '从 {current} → {target} 级',
    levelCount: '(共 {count} 级)',
    emptyResult: '⚠️ 请确保目标等级大于当前等级',
    buildResources: '📦 建造资源',
    builderCapacity: '建造者能力乘数',
    builderCapacityHelpAlt: '如何查看建造者能力乘数',
    unlockAge: '解锁时代',
    unlockTech: '解锁科技',
    unlockCity: '文明',
    builderInit: '基础建造者能力',
    builderPower: '建造者能力',
    buildTime: '建造所需时间',
    buildTimeDetail: '（共 {count} 次升级）',
    viewDetails: '查看详情',
    hideDetails: '收起详情',
    detailCurrent: '当前',
    detailTarget: '目标',
    detailTime: '耗时'
  },
  calcExtraGreatPerson: {
    title: '伟人所需帝国价值',
    description: '第 N 个伟人的获取成本 = 64M × N³',
    countLabel: '需要的额外伟人数量',
    countPlaceholder: '请输入数量',
    countHelp: '输入伟人数量，计算该伟人获取所需要的帝国价值',
    resultTitle: '最终结果',
    resultLabel: '第 {count} 个伟人的获取所需的帝国价值',
    tableTitle: '伟人明细',
    pageInfo: '第 {page} 页',
    thCount: '伟人数量',
    thFormula: '计算公式',
    thCost: '所需帝国价值',
    formulaCell: '64M × {index}³',
    prevPage: '上一页',
    nextPage: '下一页',
    equivalent: '折合 {amount} 个 {resource}',
    selectResource: '选择资源'
  },
  resourceSelect: {
    placeholder: '选择资源',
    searchPlaceholder: '搜索资源...',
    emptyText: '无匹配资源'
  }
}
