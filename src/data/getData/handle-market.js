// src/data/getData/handle-market.js
// 同步脚本：把 .temp 下的 TechDefinitions / UpgradeDefinitions / MaterialDefinitions
// 处理成 src/data/market.json，供 compute-resources.js 计算市场 resources 列表。
// 生成的字段：
//   techUnlock     : { 科技名: [解锁的建筑...] }（保持源文件顺序）
//   upgradeUnlock  : { 升级名: [解锁的建筑...] }（保持源文件顺序）
//   noPrice        : [无价格资源...]
//   noStorage      : [无仓储资源...]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输入 / 输出路径（.ts / .js 都兼容）
const TECH_SRC_JS = path.join(__dirname, '.temp', 'TechDefinitions.js');
const TECH_SRC_TS = path.join(__dirname, '.temp', 'TechDefinitions.ts');
const UPGRADE_SRC_JS = path.join(__dirname, '.temp', 'UpgradeDefinitions.js');
const UPGRADE_SRC_TS = path.join(__dirname, '.temp', 'UpgradeDefinitions.ts');
const MATERIAL_SRC_JS = path.join(__dirname, '.temp', 'MaterialDefinitions.js');
const MATERIAL_SRC_TS = path.join(__dirname, '.temp', 'MaterialDefinitions.ts');
const OUT = path.join(__dirname, '..', 'market.json');

// 解析 "Name = { ... }" 或 "Name: Type = { ... }" 对象字面量块（花括号配对，支持嵌套）
function extractObjectBlocks(text) {
  const blocks = [];
  const re = /^\s*([A-Za-z_$][\w$]*)\s*(?::\s*[A-Za-z_$][\w$]*)?\s*=\s*\{/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    const open = text.indexOf('{', m.index);
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

// 提取 unlockBuilding: ["A", "B"]
function extractUnlockBuilding(body) {
  const m = body.match(/unlockBuilding:\s*\[([^\]]*)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/"([A-Za-z_$][\w$]*)"|'([A-Za-z_$][\w$]*)'/g)].map(
    (x) => x[1] || x[2]
  );
}

// 解析 "NoPrice = { A, B, ... }" 之类的集合，返回名字数组
function parseSet(src, blockName) {
  const m = src.match(new RegExp(blockName + '\\s*=\\s*\\{([^}]*)\\}'));
  const list = [];
  if (m) {
    for (const [, k] of m[1].matchAll(/([A-Za-z_$][\w$]*)/g)) list.push(k);
  }
  return list;
}

// 优先用 .js，其次 .ts
function resolveSrc(jsPath, tsPath) {
  if (fs.existsSync(jsPath)) return fs.readFileSync(jsPath, 'utf8');
  if (fs.existsSync(tsPath)) return fs.readFileSync(tsPath, 'utf8');
  return null;
}

function main() {
  // 科技 -> 解锁建筑
  const techSrc = resolveSrc(TECH_SRC_JS, TECH_SRC_TS);
  if (!techSrc) {
    console.error(`❌ 找不到源文件: ${TECH_SRC_JS}`);
    console.error('   请先运行 downloadFile.js 下载 TechDefinitions');
    process.exit(1);
  }
  const techUnlock = {};
  for (const { name, body } of extractObjectBlocks(techSrc)) {
    const list = extractUnlockBuilding(body);
    if (list.length) techUnlock[name] = list;
  }

  // 升级 -> 解锁建筑（例如 Islam1 -> Mosque）
  const upgradeSrc = resolveSrc(UPGRADE_SRC_JS, UPGRADE_SRC_TS);
  if (!upgradeSrc) {
    console.error(`❌ 找不到源文件: ${UPGRADE_SRC_JS}`);
    console.error('   请先运行 downloadFile.js 下载 UpgradeDefinitions');
    process.exit(1);
  }
  const upgradeUnlock = {};
  for (const { name, body } of extractObjectBlocks(upgradeSrc)) {
    const list = extractUnlockBuilding(body);
    if (list.length) upgradeUnlock[name] = list;
  }

  // NoPrice / NoStorage
  const materialSrc = resolveSrc(MATERIAL_SRC_JS, MATERIAL_SRC_TS);
  if (!materialSrc) {
    console.error(`❌ 找不到源文件: ${MATERIAL_SRC_JS}`);
    console.error('   请先运行 downloadFile.js 下载 MaterialDefinitions');
    process.exit(1);
  }
  const noPrice = parseSet(materialSrc, 'NoPrice');
  const noStorage = parseSet(materialSrc, 'NoStorage');

  const data = { techUnlock, upgradeUnlock, noPrice, noStorage };
  const json = JSON.stringify(data, null, 2) + '\n';

  fs.writeFileSync(OUT, json, 'utf8');
  console.log(`✅ 已生成并覆盖: ${OUT}`);
  console.log(
    `   科技 ${Object.keys(techUnlock).length} 个，升级 ${Object.keys(upgradeUnlock).length} 个，NoPrice ${noPrice.length} 个，NoStorage ${noStorage.length} 个`
  );
}

main();
