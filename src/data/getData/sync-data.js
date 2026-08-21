// src/data/getData/sync-data.js
// 一键同步脚本：下载 -> 计算价格 -> 生成建筑数据 -> 生成城市数据 -> 清理临时文件
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '.temp');

// 依次执行的脚本（相对本文件）
const STEPS = ['downloadFiles.js', 'handle-prices.js', 'handle-buildings.js', 'handle-civilization.js'];

function runScript(script) {
  const scriptPath = path.join(__dirname, script);
  console.log(`\n===== ▶ 执行 ${script} =====`);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: __dirname,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`❌ ${script} 执行失败 (退出码 ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✅ ${script} 执行完成\n`);
}

function cleanTemp() {
  if (!fs.existsSync(TEMP_DIR)) {
    console.log('ℹ️  .temp 目录不存在，无需清理');
    return;
  }
  const files = fs.readdirSync(TEMP_DIR);
  for (const file of files) {
    const full = path.join(TEMP_DIR, file);
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`🗑️  已删除: ${file}`);
  }
  console.log(`✅ 临时文件清理完成 (共 ${files.length} 项)\n`);
}

function checkTempFiles() {
  if (!fs.existsSync(TEMP_DIR)) return 0;
  return fs.readdirSync(TEMP_DIR).filter((f) => f.endsWith('.js')).length;
}

function main() {
  console.log('🚀 开始同步数据...');
  console.log('='.repeat(50));

  // 1. 下载源文件
  runScript('downloadFiles.js');

  // 2. 下载后检查 .temp 是否有可用的源文件，避免后续脚本缺文件
  const tempCount = checkTempFiles();
  if (tempCount === 0) {
    console.error('❌ .temp 目录没有可用的源文件，下载可能失败，终止同步。');
    console.error('   请检查网络后重试，或确认 .temp 目录下有已下载的文件。');
    process.exit(1);
  }
  if (tempCount < 5) {
    console.warn(`⚠️  .temp 目录仅 ${tempCount} 个源文件，可能部分下载失败，将继续使用已有文件。`);
  }

  // 3. 依次执行计算脚本
  runScript('handle-prices.js');
  runScript('handle-buildings.js');
  runScript('handle-civilization.js');

  // 4. 清理临时文件
  cleanTemp();

  console.log('='.repeat(50));
  console.log('🎉 数据同步完成！');
}

main();
