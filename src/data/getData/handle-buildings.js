// src/data/getData/handleFile.js
// 同步脚本：处理 .temp 下的 BuildingDefinitions.js / TechDefinitions.js 成 buildings.json，并覆盖 src/data/buildings.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输入 / 输出路径
const BUILDING_SRC = path.join(__dirname, '.temp', 'BuildingDefinitions.js');
const TECH_SRC = path.join(__dirname, '.temp', 'TechDefinitions.js');
const TIMED_SRC = path.join(__dirname, '.temp', 'TimedBuildingUnlock.js');
const CITY_SRC = path.join(__dirname, '.temp', 'CityDefinitions.js');
const PRICES_SRC = path.join(__dirname, '..', 'prices.json');
const OUT = path.join(__dirname, '..', 'buildings.json');

// 默认升级倍率
const DEFAULT_MULT = 1.5;

// ---------- 解析工具 ----------

// 提取所有 "Name = { ... };" 对象字面量块（花括号配对，支持嵌套）
function extractObjectBlocks(text) {
  const blocks = [];
  const re = /^\s*([A-Za-z_$][\w$]*)\s*=\s*\{/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    const open = m.index + m[0].length - 1; // '{' 的位置
    let depth = 0;
    let i = open;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const semi = text.indexOf(';', i);
          const end = semi > i ? semi : i;
          blocks.push({ name, body: text.slice(open + 1, i) });
          re.lastIndex = end + 1;
          break;
        }
      }
    }
  }
  return blocks;
}

// 解析 "const <key>... = { Name: 5, ... };" 数值映射表
function parseNumberMap(text, key) {
  const map = {};
  const m = text.match(new RegExp(key + '[^=]*=\\s*\\{([^}]*)\\}', 'm'));
  if (m) {
    for (const [, k, v] of m[1].matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([\d.]+)/g)) {
      map[k] = parseFloat(v);
    }
  }
  return map;
}

// 提取 build_resources：优先用 construction，没有则用 input；数值统一 ×10
function extractBuildResources(body) {
  const m = body.match(/construction:\s*\{([^}]*)\}/) || body.match(/input:\s*\{([^}]*)\}/);
  if (!m) return [];
  const items = [];
  for (const [, resource, count] of m[1].matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([\d.]+)/g)) {
    items.push({ resource, count: String(parseFloat(count) * 10) });
  }
  return items;
}

// 提取 construction 原始权重（不缩放）：[{ resource, weight }]
function extractConstructionWeights(body) {
  const m = body.match(/construction:\s*\{([^}]*)\}/);
  if (!m) return [];
  const items = [];
  for (const [, resource, weight] of m[1].matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([\d.]+)/g)) {
    items.push({ resource, weight: parseFloat(weight) });
  }
  return items;
}

// 奇观成本倍率（与游戏 getWonderCostMultiplier 一致）
function getWonderCostMultiplier(techIdx, ageIdx) {
  return Math.round(
    300 +
      10 * Math.pow(ageIdx, 3) * Math.pow(techIdx, 2) +
      (100 * Math.pow(5, ageIdx) * Math.pow(1.5, techIdx)) / Math.pow(techIdx, 2)
  );
}

// 提取对象字面量里某个数组字段（如 unlockBuilding: ["A", "B"]）
function extractStringArray(body, key) {
  const m = body.match(new RegExp(key + ':\\s*\\[([^\\]]*)\\]'));
  if (!m) return [];
  return [...m[1].matchAll(/"([A-Za-z_$][\w$]*)"|'([A-Za-z_$][\w$]*)'/g)].map(
    (x) => x[1] || x[2]
  );
}

// ---------- 科技 / 时代解析 ----------

// 解析时代定义：AgeName = { idx, from, to, ... }
function parseAges(techSrc) {
  const ages = [];
  const ageRe = /(\w+Age)\s*=\s*\{\s*idx:\s*(\d+)\s*,[^}]*?from:\s*(\d+)\s*,[^}]*?to:\s*(\d+)\s*,/g;
  let am;
  while ((am = ageRe.exec(techSrc)) !== null) {
    ages.push({ id: am[1], idx: parseInt(am[2]), from: parseInt(am[3]), to: parseInt(am[4]) });
  }
  return ages;
}

// 从 TechDefinitions.js 构建：tech 名 -> { column, age_id, age_index }
function buildTechInfo(techSrc, ages) {
  const techInfo = {};
  const techBlocks = extractObjectBlocks(techSrc).filter(({ name }) => name !== 'TechAgeDefinitions');
  for (const { name, body } of techBlocks) {
    const colMatch = body.match(/column:\s*(\d+)/);
    if (!colMatch) continue;
    const column = parseInt(colMatch[1]);
    const age = ages.find((a) => column >= a.from && column <= a.to);
    techInfo[name] = {
      column,
      age_id: age ? age.id : undefined,
      age_index: age ? age.idx : undefined,
    };
  }
  return techInfo;
}

// 构建 building 名 -> { column, age_id, age_index } 反查表
// 来源一：TechDefinitions 各科技的 unlockBuilding
// 来源二：TimedBuildingUnlock 的 { building: { tech } }
function buildTechLookup(techSrc, timedSrc) {
  const ages = parseAges(techSrc);
  const techInfo = buildTechInfo(techSrc, ages);

  const lookup = {};

  // 来源一：unlockBuilding
  const techBlocks = extractObjectBlocks(techSrc).filter(({ name }) => name !== 'TechAgeDefinitions');
  for (const { name, body } of techBlocks) {
    const info = techInfo[name];
    if (!info) continue;
    for (const building of extractStringArray(body, 'unlockBuilding')) {
      lookup[building] = { ...info, tech: name };
    }
  }

  // 来源二：TimedBuildingUnlock（若存在）
  if (timedSrc) {
    // TimedBuildingUnlock = { BuildingName: { tech: "TechName", ... }, ... }
    const entries = [...timedSrc.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*\{\s*tech\s*:\s*"([A-Za-z_$][\w$]*)"/g)];
    for (const [, building, tech] of entries) {
      const info = techInfo[tech];
      if (info) lookup[building] = { ...info, tech };
    }
  }

  return lookup;
}

// 解析 CityDefinitions.js：提取城市名键和 uniqueBuildings 映射
// 返回 { cityNameById, buildingLookup } 其中 buildingLookup[building] = { city, tech }
function buildCityLookup(citySrc) {
  const cityBlocks = extractObjectBlocks(citySrc);
  const buildingLookup = {};

  for (const { name, body } of cityBlocks) {
    const cityNameMatch = body.match(/name:\s*\(\)\s*=>\s*\$t\(L\.(\w+)\)/);
    const cityName = cityNameMatch ? cityNameMatch[1] : name;

    // uniqueBuildings: { Building: "Tech", ... }
    const ubMatch = body.match(/uniqueBuildings:\s*\{([^}]*)\}/);
    if (ubMatch) {
      for (const [, building, tech] of ubMatch[1].matchAll(/([A-Za-z_$][\w$]*)\s*:\s*"([A-Za-z_$][\w$]*)"/g)) {
        buildingLookup[building] = { city: name, cityName, tech };
      }
    }
  }

  return buildingLookup;
}

// ---------- 主流程 ----------

function main() {
  if (!fs.existsSync(BUILDING_SRC)) {
    console.error(`❌ 找不到源文件: ${BUILDING_SRC}`);
    console.error('   请先运行 downloadFile.js 下载 BuildingDefinitions.js');
    process.exit(1);
  }

  const buildingSrc = fs.readFileSync(BUILDING_SRC, 'utf8');

  // 奇观升级倍率覆盖表（其余默认 1.5）
  const wonderCostBase = parseNumberMap(buildingSrc, 'WonderCostBase');

  // 科技反查表（TechDefinitions + TimedBuildingUnlock）
  let techLookup = {};
  let techInfoByName = {};
  if (fs.existsSync(TECH_SRC)) {
    const techSrc = fs.readFileSync(TECH_SRC, 'utf8');
    const timedSrc = fs.existsSync(TIMED_SRC) ? fs.readFileSync(TIMED_SRC, 'utf8') : null;
    techLookup = buildTechLookup(techSrc, timedSrc);
    techInfoByName = buildTechInfo(techSrc, parseAges(techSrc));
  }

  // 城市文明映射（CityDefinitions）：建筑 -> { city, cityName, tech }
  let cityLookup = {};
  if (fs.existsSync(CITY_SRC)) {
    cityLookup = buildCityLookup(fs.readFileSync(CITY_SRC, 'utf8'));
  }

  // 物品单价表（prices.json）：Material 名 -> 单价
  const prices = fs.existsSync(PRICES_SRC)
    ? JSON.parse(fs.readFileSync(PRICES_SRC, 'utf8'))
    : {};

  const buildings = extractObjectBlocks(buildingSrc)
    // 排除自然奇观；保留 construction 或 input 任一非空的建筑
    .filter(({ body }) => {
      if (/special:\s*BuildingSpecial\.NaturalWonder/.test(body)) return false
      const hasField = (key) => {
        const m = body.match(new RegExp(key + ':\\s*\\{([^}]*)\\}'))
        return !!m && m[1].trim() !== ''
      }
      return hasField('construction') || hasField('input')
    })
    .map(({ name, body }) => {
      const item = {
        building: name,
        mult: wonderCostBase[name] !== undefined ? String(wonderCostBase[name]) : String(DEFAULT_MULT),
        build_resources: extractBuildResources(body)
      }
      // 仅给奇观（WorldWonder）追加年龄字段，并按成本公式计算真实消耗
      if (/special:\s*BuildingSpecial\.WorldWonder/.test(body)) {
        // 反查来源：优先 unlockBuilding/TimedBuildingUnlock，其次城市 uniqueBuildings
        let lookup = techLookup[name]
        const cityInfo = cityLookup[name]
        if (cityInfo) {
          // 存文明名（如 Chinese/Dutch），便于 tGame 本地化翻译
          item.city = cityInfo.cityName
          if (!lookup && cityInfo.tech) {
            const info = techInfoByName[cityInfo.tech]
            if (info) lookup = { ...info, tech: cityInfo.tech }
          }
        }
        if (lookup && lookup.age_id !== undefined && lookup.column > 0) {
          item.age = lookup.age_id
          item.age_index = lookup.age_index
          item.column = lookup.column
          item.tech = lookup.tech
          // 真实消耗 = 成本倍率 × 权重 / 物品单价
          const multiplier = getWonderCostMultiplier(lookup.column, lookup.age_index)
          item.build_resources = extractConstructionWeights(body).map(({ resource, weight }) => ({
            resource,
            count: String(Math.round((multiplier * weight) / (prices[resource] ?? 1)))
          }))
          // 基础建造者能力 = 材料总量 / (500×(age_index^1.5+3) + 50×column^1.5)
          const totalAmount = item.build_resources.reduce(
            (sum, r) => sum + parseFloat(r.count),
            0
          )
          const denom = 500 * (Math.pow(lookup.age_index, 1.5) + 3) + 50 * Math.pow(lookup.column, 1.5)
          item.builder_init = totalAmount / denom
        }
      }
      return item
    });

  const json = JSON.stringify(buildings, null, 2) + '\n';

  fs.writeFileSync(OUT, json, 'utf8');
  console.log(`✅ 已生成并覆盖: ${OUT}`);
  console.log(`   共 ${buildings.length} 个建筑`);
}

main();
