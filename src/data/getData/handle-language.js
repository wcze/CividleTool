// src/data/getData/handle-language.js
// 处理脚本：把 .temp 下下载的 languages-zh-CN.js / languages-en.js
// 生成 src/i18n/data/zh.js / en.js（键按字母排序，并补上 export default）
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输入 / 输出路径
const SRC = {
  zh: path.join(__dirname, '.temp', 'languages-zh-CN.js'),
  en: path.join(__dirname, '.temp', 'languages-en.js'),
};
const OUT = {
  zh: path.join(__dirname, '..', '..', 'i18n', 'data', 'zh.js'),
  en: path.join(__dirname, '..', '..', 'i18n', 'data', 'en.js'),
};
const VAR_NAME = { zh: 'ZH_CN', en: 'EN' };

// 提取并解析对象字面量：const ZH_CN = { ... };
function parseObject(content) {
  const m = content.match(/const\s+(ZH_CN|EN)\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!m) throw new Error('未找到语言对象字面量');
  // 下载文件是可信的本地数据，使用 eval 解析为对象
  return eval(`(${m[2]})`);
}

// 序列化为目标格式（键按字母排序，值用 JSON 字符串转义）
function serialize(obj, varName) {
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  const lines = keys.map((k) => `   ${k}: ${JSON.stringify(obj[k])},`);
  return `const ${varName} = {\n${lines.join('\n')}\n};\nexport default ${varName};\n`;
}

function process(lang) {
  const content = fs.readFileSync(SRC[lang], 'utf8');
  const obj = parseObject(content);
  const out = serialize(obj, VAR_NAME[lang]);
  fs.mkdirSync(path.dirname(OUT[lang]), { recursive: true });
  fs.writeFileSync(OUT[lang], out, 'utf8');
  console.log(`✅ 已生成 ${path.relative(__dirname, OUT[lang])} (${Object.keys(obj).length} 条, ${(out.length / 1024).toFixed(2)} KB)`);
}

process('zh');
process('en');
console.log('🎉 语言数据处理完成');
