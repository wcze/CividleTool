// src/data/getData/index.js
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ 配置区域 ============
// 定义需要下载的文件列表
const FILES = [
    {
        url: 'https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main/shared/definitions/BuildingDefinitions.ts',
        output: './.temp/BuildingDefinitions.js'
    },
    {
        url: 'https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main/shared/definitions/TechDefinitions.ts',
        output: './.temp/TechDefinitions.js'
    },
    {
        url: 'https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main/shared/definitions/TimedBuildingUnlock.ts',
        output: './.temp/TimedBuildingUnlock.js'
    },
    {
        url: 'https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main/shared/definitions/CityDefinitions.ts',
        output: './.temp/CityDefinitions.js'
    }, 
    {
        url: 'https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main/shared/definitions/MaterialDefinitions.ts',
        output: './.temp/MaterialDefinitions.js'
    },
];

// 下载配置
const CONFIG = {
    timeout: 30000, // 超时时间（毫秒）
    retries: 3, // 重试次数
    retryDelay: 2000, // 重试延迟（毫秒）
};

// ============ 工具函数 ============

// 延迟函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 下载单个文件（带重试）
function downloadFile(url, retries = CONFIG.retries) {
    return new Promise((resolve, reject) => {
        const attemptDownload = (attempt) => {
            console.log(`  尝试 ${attempt}/${retries}...`);

            const timeout = setTimeout(() => {
                reject(new Error('下载超时'));
            }, CONFIG.timeout);

            https.get(url, (response) => {
                clearTimeout(timeout);

                // 处理重定向
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    console.log(`  ↪ 重定向到: ${redirectUrl}`);
                    https.get(redirectUrl, (redirectResponse) => {
                        if (redirectResponse.statusCode !== 200) {
                            reject(new Error(`重定向失败，状态码：${redirectResponse.statusCode}`));
                            return;
                        }
                        let data = '';
                        redirectResponse.on('data', (chunk) => { data += chunk; });
                        redirectResponse.on('end', () => { resolve(data); });
                        redirectResponse.on('error', reject);
                    }).on('error', reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }

                let data = '';
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => { resolve(data); });
                response.on('error', reject);
            }).on('error', reject);
        };

        // 执行下载，失败后重试
        const tryDownload = async (attempt) => {
            try {
                await attemptDownload(attempt);
            } catch (error) {
                if (attempt < retries) {
                    console.log(`  ⚠️ 下载失败: ${error.message}`);
                    console.log(`  ⏳ 等待 ${CONFIG.retryDelay}ms 后重试...`);
                    await sleep(CONFIG.retryDelay);
                    await tryDownload(attempt + 1);
                } else {
                    throw error;
                }
            }
        };

        tryDownload(1);
    });
}

// TypeScript转JavaScript
function tsToJs(tsContent) {
    let js = tsContent;

    // 1. 移除 export 关键字
    js = js.replace(/export\s+/g, '');

    // 2. 移除类型注解（: type）
    js = js.replace(/:\s*[A-Za-z_$][\w<>,\[\]\s|&]*?(?=\s*[={;,])/g, '');

    // 3. 移除 interface 定义
    js = js.replace(/interface\s+\w+\s*\{[^]*?\}\s*/g, '');

    // 4. 移除 type 定义
    js = js.replace(/type\s+\w+\s*=\s*[^;]*;\s*/g, '');

    // 5. 移除 readonly 关键字
    js = js.replace(/\breadonly\s+/g, '');

    // 6. 移除参数类型注解
    js = js.replace(/\(\s*([^)]*?)\s*\)\s*:\s*[A-Za-z_$][\w<>\[\]]*/g, (match, params) => {
        const cleanParams = params.replace(/:\s*[A-Za-z_$][\w<>\[\]\s,|&]*/g, '');
        return `(${cleanParams})`;
    });

    // 7. 移除 as 类型断言
    js = js.replace(/\s+as\s+[A-Za-z_$][\w<>\[\]]*/g, '');

    // 8. 清理多余的空行
    js = js.replace(/^\s*[\r\n]/gm, '');
    js = js.replace(/\n{3,}/g, '\n\n');

    return js;
}

// 保存文件（带备份）
function saveFile(content, outputPath) {
    // 确保输出目录（如 ./.temp）存在
    const fileDir = path.dirname(path.join(__dirname, outputPath));
    fs.mkdirSync(fileDir, { recursive: true });

    const fullPath = path.join(__dirname, outputPath);

    // 如果文件已存在，在同一目录下备份原文件
    if (fs.existsSync(fullPath)) {
        const backupName = `${path.basename(outputPath, '.js')}.backup.${Date.now()}.js`;
        const backupPath = path.join(fileDir, backupName);
        fs.copyFileSync(fullPath, backupPath);
        console.log(`  💾 已备份到：${path.relative(__dirname, backupPath)}`);
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ 已保存：${outputPath} (${(content.length / 1024).toFixed(2)} KB)`);
}

// 显示预览
function showPreview(content, filename) {
    const lines = content.split('\n');
    const previewLines = lines.slice(0, 10);

    console.log(`  📝 预览 (${filename}，共 ${lines.length} 行):`);
    console.log('  ' + '─'.repeat(50));
    previewLines.forEach((line, index) => {
        console.log(`  ${String(index + 1).padStart(3)} | ${line.substring(0, 60)}${line.length > 60 ? '...' : ''}`);
    });
    if (lines.length > 10) {
        console.log(`  ... (共 ${lines.length} 行)`);
    }
    console.log('  ' + '─'.repeat(50));
}

// ============ 主流程 ============

async function main() {
    const startTime = Date.now();

    console.log('🚀 开始批量下载 TypeScript 文件');
    console.log('='.repeat(60));
    console.log(`📦 共 ${FILES.length} 个文件待处理\n`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (let i = 0; i < FILES.length; i++) {
        const file = FILES[i];
        const index = i + 1;

        console.log(`[${index}/${FILES.length}] 处理: ${file.output}`);
        console.log(`  📡 ${file.url}`);

        try {
            // 下载
            const tsContent = await downloadFile(file.url);
            console.log(`  ✅ 下载完成 (${(tsContent.length / 1024).toFixed(2)} KB)`);

            // 转换
            console.log('  🔄 转换中...');
            const jsContent = tsToJs(tsContent);

            // 保存
            saveFile(jsContent, file.output);

            // 预览（可选，如果文件太多可以注释掉）
            if (FILES.length <= 3) {
                showPreview(jsContent, file.output);
            }

            successCount++;
            results.push({ file: file.output, status: '✅ 成功' });

        } catch (error) {
            console.log(`  ❌ 失败: ${error.message}`);
            failCount++;
            results.push({ file: file.output, status: `❌ 失败 (${error.message})` });
        }

        console.log(''); // 空行分隔
    }

    // ============ 输出汇总 ============
    console.log('='.repeat(60));
    console.log('📊 处理完成！汇总报告：');
    console.log(`  ✅ 成功：${successCount} 个`);
    console.log(`  ❌ 失败：${failCount} 个`);
    console.log(`  📁 输出目录：${__dirname}`);

    if (results.length > 0) {
        console.log('\n  详情：');
        results.forEach(r => {
            console.log(`    ${r.status} - ${r.file}`);
        });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️ 总耗时：${elapsed} 秒`);
    console.log('✨ 所有操作完成！');
}

// 执行
main();