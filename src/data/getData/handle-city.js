// src/data/getData/handle-city.js
// 同步脚本：处理 .temp 下的 CityDefinitions.js 成 city.json，并覆盖 src/data/city.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输入 / 输出路径
const CITY_SRC = path.join(__dirname, '.temp', 'CityDefinitions.js');
const OUT = path.join(__dirname, '..', 'city.json');

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

// 提取整段字段对象体：key: { ... } -> { key: body }
function extractObjectField(body, key) {
  const m = body.match(new RegExp(key + '\\s*:\\s*\\{'));
  if (!m) return null;
  const open = m.index + m[0].length - 1; // '{' 的位置
  let depth = 0;
  for (let i = open; i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return body.slice(open + 1, i);
    }
  }
  return null;
}

// 解析对象字面量：{ A: 1, B: 2 } -> { A: 1, B: 2 }，也兼容末尾单独的 ": value"
function parseNumericMap(body) {
  const obj = {};
  for (const [, k, v] of body.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([\d.]+)/g)) {
    obj[k] = parseFloat(v);
  }
  return obj;
}

// 解析对象字面量：{ Building: "Tech", ... } -> { Building: "Tech" }
function parseStringMap(body) {
  const obj = {};
  for (const [, k, v] of body.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*"([^"]*)"/g)) {
    obj[k] = v;
  }
  return obj;
}

// 解析数值字段：<key>: <number>
function parseNumberField(body, key) {
  const m = body.match(new RegExp(key + '\\s*:\\s*([\\d.]+)'));
  return m ? parseFloat(m[1]) : undefined;
}

// 解析 i18n 键字段：<key>: () => $t(L.xxx) -> "xxx"
function parseI18nField(body, key) {
  const m = body.match(new RegExp(key + '\\s*:\\s*\\(\\)\\s*=>\\s*\\$t\\(L\\.(\\w+)\\)'));
  return m ? m[1] : undefined;
}

// 解析自然奇观全集：兼容 { A, B: true, C } 缩写法（无 : 表示键即值，为真）
// 返回有序数组（保留定义顺序）
function parseNaturalWonders(body) {
  const field = extractObjectField(body, 'naturalWonders');
  if (!field) return [];
  const wonders = [];
  // 匹配两种形式：`Alps:`（值紧随其后）或 `Alps` 缩写法 / `Alps: true`
  const re = /([A-Za-z_$][\w$]*)(\s*:\s*([A-Za-z_$][\w$]*|true|false))?/g;
  let m;
  while ((m = re.exec(field)) !== null) {
    const name = m[1];
    if (!name) continue;
    const val = m[3];
    // 仅收录断言存在（true）或缩写法（无值）的奇观；显式 false 不收录
    const isPresent = !m[2] || val === 'true' || (val && val !== 'false');
    if (isPresent && !wonders.includes(name)) {
      wonders.push(name);
    }
  }
  return wonders;
}

// 解析 uniqueEffects：() => [$t(L.xxx), ...] -> ["xxx", ...]
function parseUniqueEffects(body) {
  const m = body.match(/uniqueEffects\s*:\s*\(\)\s*=>\s*\[([\s\S]*?)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/\$t\(L\.(\w+)\)/g)].map((x) => x[1]);
}

// ---------- 主流程 ----------

function main() {
  if (!fs.existsSync(CITY_SRC)) {
    console.error(`❌ 找不到源文件: ${CITY_SRC}`);
    console.error('   请先运行 downloadFiles.js 下载 CityDefinitions.js');
    process.exit(1);
  }

  const src = fs.readFileSync(CITY_SRC, 'utf8');

  // CityDefinitions 类体内的城市对象（跳过导出/类块，直接取每个 city = {...} 块）
  const cities = extractObjectBlocks(src).map(({ name, body }) => {
    const size = parseNumberField(body, 'size');
    const sizeOld = parseNumberField(body, 'sizeOld');
    const wonderField = extractObjectField(body, 'naturalWonders');

    const item = {
      id: name,
      name: parseI18nField(body, 'name') ?? name,
    };

    // 物产分布
    const depositsField = extractObjectField(body, 'deposits');
    if (depositsField) {
      item.deposits = parseNumericMap(depositsField);
    }

    // 大小：优先 size，其次 sizeOld
    if (size !== undefined) item.size = size;
    else if (sizeOld !== undefined) item.size = sizeOld;
    if (sizeOld !== undefined) item.sizeOld = sizeOld;

    // 首都建筑名
    const buildingNamesField = extractObjectField(body, 'buildingNames');
    if (buildingNamesField) {
      const hq = parseI18nField(body, 'Headquarter');
      // Headquarter 在 buildingNames 内部，直接读键
      const hqM = buildingNamesField.match(/Headquarter\s*:\s*\(\)\s*=>\s*\$t\(L\.(\w+)\)/);
      item.headquarter = hqM ? hqM[1] : hq;
    }

    // 独特建筑
    const ubField = extractObjectField(body, 'uniqueBuildings');
    if (ubField && ubField.trim() !== '') {
      item.uniqueBuildings = parseStringMap(ubField);
    }

    // 自然奇观（仅在存在字段时输出）
    if (wonderField && parseNaturalWonders(body).length > 0) {
      item.naturalWonders = parseNaturalWonders(body);
    }

    // 需要伟人等级
    const gp = parseNumberField(body, 'requireGreatPeopleLevel');
    if (gp !== undefined) item.requireGreatPeopleLevel = gp;

    // 需要支持者礼包（requireSupporterPack 为裸缩写法，出现即 true）
    if (/requireSupporterPack\s*[,}]/.test(body) || /requireSupporterPack\s*:/.test(body)) {
      item.requireSupporterPack = true;
    }

    // 节日描述
    const festival = parseI18nField(body, 'festivalDesc');
    if (festival) item.festivalDesc = festival;

    // 独特效果
    const effects = parseUniqueEffects(body);
    if (effects.length > 0) item.uniqueEffects = effects;

    return item;
  });

  const json = JSON.stringify(cities, null, 2) + '\n';

  fs.writeFileSync(OUT, json, 'utf8');
  console.log(`✅ 已生成并覆盖: ${OUT}`);
  console.log(`   共 ${cities.length} 个城市`);
  for (const c of cities) {
    console.log(`   - ${c.id} (size=${c.size}${c.requireSupporterPack ? ', 支持者礼包' : ''})`);
  }
}

main();
