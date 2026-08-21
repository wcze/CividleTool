// src/data/getData/handle-prices.js
// 同步脚本：根据 BuildingDefinitions / TechDefinitions / MaterialDefinitions
// 复现游戏 calculateTierAndPrice 的价格计算逻辑，生成 prices.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILDING_SRC_JS = path.join(__dirname, '.temp', 'BuildingDefinitions.js');
const BUILDING_SRC_TS = path.join(__dirname, '.temp', 'BuildingDefinitions.ts');
const TECH_SRC = path.join(__dirname, '.temp', 'TechDefinitions.js');
const TIMED_SRC = path.join(__dirname, '.temp', 'TimedBuildingUnlock.js');
const CITY_SRC = path.join(__dirname, '.temp', 'CityDefinitions.js');
const MATERIAL_SRC = path.join(__dirname, '.temp', 'MaterialDefinitions.js');
const OUT = path.join(__dirname, '..', 'prices.json');

const SCIENCE_VALUE = 0.2;
const KOTI_PRICE = 10000000;

// ---------- 解析工具 ----------

function extractObjectBlocks(text) {
  const blocks = [];
  // 兼容 js 格式（Name = {）与 ts 格式（Name: IBuildingDefinition = {）
  const re = /^\s*([A-Za-z_$][\w$]*)\s*(?::\s*[A-Za-z_$][\w$]*)?\s*=\s*\{/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    const open = m.index + m[0].length - 1;
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

// 解析对象字面量：{ A: 1, B: 2 } -> { A: 1, B: 2 }
function extractNumberMap(body) {
  const obj = {};
  for (const [, k, v] of body.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([\d.]+)/g)) {
    obj[k] = parseFloat(v);
  }
  return obj;
}

// 解析数组字段：["A", "B"]
function extractStringArray(body, key) {
  const m = body.match(new RegExp(key + ':\\s*\\[([^\\]]*)\\]'));
  if (!m) return [];
  return [...m[1].matchAll(/"([A-Za-z_$][\w$]*)"|'([A-Za-z_$][\w$]*)'/g)].map(
    (x) => x[1] || x[2]
  );
}

// ---------- 主流程 ----------

function main() {
  const buildingSrcPath = fs.existsSync(BUILDING_SRC_JS) ? BUILDING_SRC_JS : BUILDING_SRC_TS;
  if (!fs.existsSync(buildingSrcPath) || !fs.existsSync(TECH_SRC)) {
    console.error('❌ 缺少源文件，请先运行 downloadFiles.js');
    process.exit(1);
  }

  const buildingSrc = fs.readFileSync(buildingSrcPath, 'utf8');
  const techSrc = fs.readFileSync(TECH_SRC, 'utf8');
  const materialSrc = fs.existsSync(MATERIAL_SRC) ? fs.readFileSync(MATERIAL_SRC, 'utf8') : '';
  const timedSrc = fs.existsSync(TIMED_SRC) ? fs.readFileSync(TIMED_SRC, 'utf8') : '';
  const citySrc = fs.existsSync(CITY_SRC) ? fs.readFileSync(CITY_SRC, 'utf8') : '';

  // ===== 1. 解析时代 =====
  const ages = [];
  const ageRe = /(\w+Age)\s*=\s*\{\s*idx:\s*(\d+)\s*,[^}]*?from:\s*(\d+)\s*,[^}]*?to:\s*(\d+)\s*,/g;
  let am;
  while ((am = ageRe.exec(techSrc)) !== null) {
    ages.push({ id: am[1], idx: parseInt(am[2]) });
  }
  const ageIdxById = Object.fromEntries(ages.map((a) => [a.id, a.idx]));
  // column -> ageIdx
  const colToAgeIdx = {};
  const colAgeRe = /(\w+Age)\s*=\s*\{\s*idx:\s*(\d+)\s*,[^}]*?from:\s*(\d+)\s*,[^}]*?to:\s*(\d+)\s*,/g;
  let cma;
  while ((cma = colAgeRe.exec(techSrc)) !== null) {
    for (let c = parseInt(cma[3]); c <= parseInt(cma[4]); c++) {
      colToAgeIdx[c] = parseInt(cma[2]);
    }
  }

  // ===== 2. 解析科技 =====
  const techBlocks = extractObjectBlocks(techSrc).filter(({ name }) => name !== 'TechAgeDefinitions');
  const techDef = {}; // tech -> { column, ageIdx, unlockBuilding, revealDeposit }
  for (const { name, body } of techBlocks) {
    const colMatch = body.match(/column:\s*(\d+)/);
    const column = colMatch ? parseInt(colMatch[1]) : -1;
    techDef[name] = {
      column,
      ageIdx: column >= 0 ? colToAgeIdx[column] : -1,
      unlockBuilding: extractStringArray(body, 'unlockBuilding'),
      revealDeposit: extractStringArray(body, 'revealDeposit'),
    };
  }

  // ===== 3. 建筑解锁科技反查（getBuildingUnlockTechSlow） =====
  const buildingTech = {}; // building -> tech
  for (const [tech, def] of Object.entries(techDef)) {
    for (const b of def.unlockBuilding) {
      if (!buildingTech[b]) buildingTech[b] = tech;
    }
  }
  // 城市 uniqueBuildings
  if (citySrc) {
    for (const { name, body } of extractObjectBlocks(citySrc)) {
      const ub = body.match(/uniqueBuildings:\s*\{([^}]*)\}/);
      if (ub) {
        for (const [, b, t] of ub[1].matchAll(/([A-Za-z_$][\w$]*)\s*:\s*"([A-Za-z_$][\w$]*)"/g)) {
          if (!buildingTech[b]) buildingTech[b] = t;
        }
      }
    }
  }
  // TimedBuildingUnlock
  if (timedSrc) {
    const entries = [...timedSrc.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*\{\s*tech\s*:\s*"([A-Za-z_$][\w$]*)"/g)];
    for (const [, b, t] of entries) {
      if (!buildingTech[b]) buildingTech[b] = t;
    }
  }

  // ===== 4. 解析建筑 =====
  const buildingDefs = {}; // building -> { input, output, tech }
  for (const { name, body } of extractObjectBlocks(buildingSrc)) {
    const inputMatch = body.match(/input:\s*\{([^}]*)\}/);
    const outputMatch = body.match(/output:\s*\{([^}]*)\}/);
    buildingDefs[name] = {
      input: inputMatch ? extractNumberMap(inputMatch[1]) : {},
      output: outputMatch ? extractNumberMap(outputMatch[1]) : {},
      tech: buildingTech[name] || null,
    };
  }

  // ===== 5. IsDeposit / NoPrice =====
  const isDeposit = {};
  const noPrice = {};
  if (materialSrc) {
    const depMatch = materialSrc.match(/IsDeposit\s*=\s*\{([^}]*)\}/);
    if (depMatch) {
      // IsDeposit 内为简写键名（如 Water, Iron,），匹配行首缩进的标识符
      for (const [, k] of depMatch[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*,/gm)) {
        isDeposit[k] = true;
      }
    }
    const npMatch = materialSrc.match(/NoPrice\s*=\s*\{([^}]*)\}/);
    if (npMatch) {
      for (const [, k] of npMatch[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*,/gm)) {
        noPrice[k] = true;
      }
    }
  }

  // ===== 6. 价格与 tier 计算（复现 calculateTierAndPrice） =====
  const MaterialPrice = {};
  const MaterialTier = {};

  // 6.1 Deposit 资源
  for (const deposit of Object.keys(isDeposit)) {
    // 找到揭示该 deposit 的科技
    let depTech = null;
    for (const [tech, def] of Object.entries(techDef)) {
      if (def.revealDeposit.includes(deposit)) { depTech = tech; break; }
    }
    if (depTech) {
      const d = techDef[depTech];
      MaterialTier[deposit] = 1;
      MaterialPrice[deposit] = Math.round(d.column + Math.pow(d.ageIdx, 2));
    }
  }

  // 6.2 无 input 建筑产出
  for (const [b, def] of Object.entries(buildingDefs)) {
    if (Object.keys(def.input).length === 0) {
      for (const res of Object.keys(def.output)) {
        if (!MaterialTier[res]) MaterialTier[res] = 1;
        if (!MaterialPrice[res]) {
          if (def.tech) {
            MaterialPrice[res] = 1 + techDef[def.tech].column;
          } else {
            MaterialPrice[res] = 1;
          }
        }
      }
    }
  }

  // 6.3 加工资源迭代（依赖 tier）
  const recipes = Object.entries(buildingDefs)
    .filter(([, def]) => Object.keys(def.input).length > 0 || Object.keys(def.output).length > 0)
    .map(([building, def]) => ({ building, input: def.input, output: def.output }));

  let iteration = 0;
  while (iteration < 5000) {
    iteration++;
    let progress = false;
    for (const { building, input, output } of recipes) {
      let maxInputTier = 0;
      let inputValue = 0;
      const inputs = Object.keys(input);
      const allHasTier = inputs.every((r) => {
        const tier = MaterialTier[r];
        const price = MaterialPrice[r];
        if (tier && tier > maxInputTier) maxInputTier = tier;
        if (price) inputValue += price * (input[r] ?? 0);
        return tier && price;
      });
      if (!allHasTier) continue;

      const targetTier = maxInputTier + 1;
      const outputs = Object.keys(output);
      let allOutputAmount = 0;
      let notPricedValue = 0;
      for (const res of outputs) {
        if (res === 'Science') {
          notPricedValue += output[res] * SCIENCE_VALUE;
          continue;
        }
        if (!MaterialTier[res] || targetTier < MaterialTier[res]) {
          MaterialTier[res] = targetTier;
          progress = true;
        }
        allOutputAmount += output[res];
      }

      // multiplier = 1.5 + 0.25 * 输入种类数
      const multiplier = 1.5 + 0.25 * inputs.length;
      for (const res of outputs) {
        if (res === 'Science') continue;
        const price = Math.round(
          (multiplier * inputValue - notPricedValue) / allOutputAmount
        );
        if (!Number.isFinite(price)) continue;
        if (!MaterialPrice[res]) {
          MaterialPrice[res] = price;
          progress = true;
        } else if (price > MaterialPrice[res]) {
          MaterialPrice[res] = price;
          progress = true;
        }
      }
    }
    if (!progress) break;
  }

  // 6.4 Koti 固定
  MaterialPrice.Koti = KOTI_PRICE;
  MaterialTier.Koti = 8;

  // 6.5 NoPrice 资源：从结果中排除
  for (const k of Object.keys(noPrice)) {
    delete MaterialPrice[k];
    delete MaterialTier[k];
  }

  // 6.6 特殊别名/补充项（游戏内存在但不在标准生产链）
  MaterialPrice.Television = MaterialPrice.TV ?? 409900; // TV 别名

  // ===== 7. 输出 =====
  const sorted = {};
  for (const [k, v] of Object.entries(MaterialPrice).sort((a, b) => a[0].localeCompare(b[0]))) {
    sorted[k] = v;
  }

  const json = JSON.stringify(sorted, null, 4) + '\n';
  fs.writeFileSync(OUT, json, 'utf8');
  console.log(`✅ 已生成: ${OUT} (${Object.keys(sorted).length} 个材料)`);
}

main();
