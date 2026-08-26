import { t } from '../i18n'

// 工具列表唯一数据源：ToolLayout / About 等页面统一从这里读取，
// 避免在多处重复维护导致遗漏（例如漏掉某个工具）。
// 注意：内部调用了 t()，需在 computed 中调用以跟踪语言切换的响应式依赖。
export function getTools() {
  return [
    {
      id: 'CalcBuildingsUpgrade',
      name: t('tools.CalcBuildingsUpgrade.name'),
      description: t('tools.CalcBuildingsUpgrade.description')
    },
    {
      id: 'CalcExtraGreatPerson',
      name: t('tools.CalcExtraGreatPerson.name'),
      description: t('tools.CalcExtraGreatPerson.description')
    },
    {
      id: 'CalcWarehouseRatio',
      name: t('tools.CalcWarehouseRatio.name'),
      description: t('tools.CalcWarehouseRatio.description')
    },
     {
      id: 'FreeCivilization',
      name: t('tools.FreeCivilization.name'),
      description: t('tools.FreeCivilization.description')
    },
  ]
}
