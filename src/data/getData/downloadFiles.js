// src/data/getData/index.js
import https from 'https';
import http from 'http';
import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const github_url = "https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main";

const FILES = [
    {
        url: 'src/scripts/Version.json',
        output: '../version.json',
        raw: true
    },
    {
        url: 'shared/definitions/BuildingDefinitions.ts',
        output: './.temp/BuildingDefinitions.js'
    },
    {
        url: 'shared/definitions/TechDefinitions.ts',
        output: './.temp/TechDefinitions.js'
    },
    {
        url: 'shared/definitions/TimedBuildingUnlock.ts',
        output: './.temp/TimedBuildingUnlock.js'
    },
    {
        url: 'shared/definitions/CityDefinitions.ts',
        output: './.temp/CityDefinitions.js'
    },
    {
        url: 'shared/definitions/MaterialDefinitions.ts',
        output: './.temp/MaterialDefinitions.js'
    },
    {
        url: 'shared/definitions/UpgradeDefinitions.ts',
        output: './.temp/UpgradeDefinitions.js'
    },
    {
        url: 'shared/languages/zh-CN.ts',
        output: './.temp/languages-zh-CN.js'
    },
    {
        url: 'shared/languages/en.ts',
        output: './.temp/languages-en.js'
    },
];

// 下载配置
const CONFIG = {
    timeout: 30000, // 超时时间（毫秒）
    retries: 5, // 重试次数
    retryDelay: 2000, // 重试延迟（毫秒）
};

// ============ 代理支持（浏览器能访问但 Node 不能时，多半是系统代理） ============

// 规范化代理字符串 -> { host, port }
function normalizeProxy(proxyStr) {
    let s = proxyStr.trim();
    if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
    const u = new URL(s);
    return { host: u.hostname, port: parseInt(u.port, 10) || 80 };
}

// 获取代理：优先环境变量，其次 Windows 系统代理（浏览器正在用的）
function getSystemProxy() {
    const envProxy =
        process.env.HTTPS_PROXY || process.env.https_proxy ||
        process.env.HTTP_PROXY || process.env.http_proxy ||
        process.env.ALL_PROXY || process.env.all_proxy;
    if (envProxy) return normalizeProxy(envProxy);

    if (process.platform === 'win32') {
        try {
            const out = execSync(
                'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable & reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer',
                { encoding: 'utf8' }
            );
            const enable = /ProxyEnable\s+REG_DWORD\s+0x([0-9a-f]+)/i.exec(out);
            const server = /ProxyServer\s+REG_SZ\s+(\S+)/i.exec(out);
            if (enable && parseInt(enable[1], 16) === 1 && server && server[1]) {
                return normalizeProxy(server[1]);
            }
        } catch (e) {
            // 读取注册表失败则当作无代理
        }
    }
    return null;
}

// 通过 HTTP CONNECT 隧道经代理发起 GET 请求（纯 Node 内置模块，无需额外依赖）
function tunnelGet(url, proxy, callback) {
    const u = new URL(url);
    const host = u.hostname;
    const port = u.port || 443;

    const connectReq = http.request({
        host: proxy.host,
        port: proxy.port,
        method: 'CONNECT',
        path: `${host}:${port}`,
        headers: { Host: `${host}:${port}`, 'User-Agent': 'Mozilla/5.0' },
    });
    connectReq.on('connect', (res, socket) => {
        if (res.statusCode !== 200) {
            socket.destroy();
            callback(new Error(`代理 CONNECT 失败: ${res.statusCode}`));
            return;
        }
        const tlsSocket = tls.connect({ socket, servername: host });
        tlsSocket.on('secureConnect', () => {
            const pathAndQuery = u.pathname + u.search;
            tlsSocket.write(
                `GET ${pathAndQuery} HTTP/1.1\r\n` +
                `Host: ${host}\r\n` +
                `User-Agent: Mozilla/5.0\r\n` +
                `Accept: */*\r\n` +
                `Connection: close\r\n\r\n`
            );
            const chunks = [];
            tlsSocket.on('data', (c) => { chunks.push(c); });
            tlsSocket.on('end', () => {
                // 先收集所有 Buffer 分片，最后一次性解码，避免 UTF-8 多字节字符
                // 被 TCP 拆到两个分片之间时损坏成 �
                const raw = Buffer.concat(chunks).toString('utf8');
                const idx = raw.indexOf('\r\n\r\n');
                if (idx < 0) { callback(new Error('响应头不完整')); return; }
                const head = raw.slice(0, idx);
                const statusCode = parseInt(head.split('\r\n')[0].split(' ')[1], 10);
                const headers = {};
                for (const line of head.split('\r\n').slice(1)) {
                    const ci = line.indexOf(':');
                    if (ci > 0) headers[line.slice(0, ci).trim().toLowerCase()] = line.slice(ci + 1).trim();
                }
                callback(null, { statusCode, headers, body: raw.slice(idx + 4) });
            });
            tlsSocket.on('error', (e) => callback(e));
        });
        tlsSocket.on('error', (e) => callback(e));
    });
    connectReq.on('error', (e) => callback(e));
    connectReq.end();
}

// 发起请求（支持代理与重定向），resolve 响应体文本
function rawRequest(url, proxy, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            reject(new Error('重定向次数过多'));
            return;
        }
        const timeout = setTimeout(() => reject(new Error('下载超时')), CONFIG.timeout);
        const onDone = (err, res) => {
            clearTimeout(timeout);
            if (err) { reject(err); return; }
            const { statusCode, headers, body } = res;
            if (statusCode >= 300 && statusCode < 400 && headers.location) {
                const next = new URL(headers.location, url).toString();
                console.log(`  ↪ 重定向到: ${next}`);
                rawRequest(next, proxy, redirectCount + 1).then(resolve, reject);
                return;
            }
            if (statusCode !== 200) {
                reject(new Error(`HTTP ${statusCode}`));
                return;
            }
            resolve(body);
        };

        if (proxy) {
            tunnelGet(url, proxy, onDone);
        } else {
            https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                // 先收集所有 Buffer 分片，最后一次性解码，避免 UTF-8 多字节字符损坏成 �
                const chunks = [];
                res.on('data', (c) => { chunks.push(c); });
                res.on('end', () => onDone(null, { statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
                res.on('error', onDone);
            }).on('error', onDone);
        }
    });
}

// 下载单个文件（带重试，自动走系统代理）
function downloadFile(url, retries = CONFIG.retries) {
    const proxy = getSystemProxy();
    if (proxy) {
        console.log(`  🌐 检测到系统代理: ${proxy.host}:${proxy.port}，将经代理下载`);
    }

    return new Promise((resolve, reject) => {
        const attemptDownload = async (attempt) => {
            console.log(`  尝试 ${attempt}/${retries}...`);
            try {
                const data = await rawRequest(url, proxy);
                resolve(data);
            } catch (error) {
                if (attempt < retries) {
                    console.log(`  ⚠️ 下载失败: ${error.message}`);
                    console.log(`  ⏳ 等待 ${CONFIG.retryDelay}ms 后重试...`);
                    await sleep(CONFIG.retryDelay);
                    await attemptDownload(attempt + 1);
                } else {
                    reject(error);
                }
            }
        };

        attemptDownload(1).catch(reject);
    });
}

// ============ 工具函数 ============

// 延迟函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

// 保存文件（直接覆盖，不保留备份）
function saveFile(content, outputPath) {
    // 确保输出目录（如 ./.temp）存在
    const fileDir = path.dirname(path.join(__dirname, outputPath));
    fs.mkdirSync(fileDir, { recursive: true });

    const fullPath = path.join(__dirname, outputPath);

    // 直接覆盖写入
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

// 比较远程与本地版本号。Version.json 当前使用 build 字段，保留
// version 字段兼容其他版本格式。
function isSameVersion(remoteContent) {
    const versionPath = path.join(__dirname, '../version.json');
    try {
        const remoteVersion = JSON.parse(remoteContent);
        const localVersion = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        const remoteNumber = remoteVersion.build ?? remoteVersion.version;
        const localNumber = localVersion.build ?? localVersion.version;
        return remoteNumber !== undefined && localNumber !== undefined && remoteNumber === localNumber;
    } catch (e) {
        return false;
    }
}

// ============ 主流程 ============

// 在 version.json 中记录本次同步执行的时间戳
function stampSyncTime() {
    const versionPath = path.join(__dirname, '../version.json');
    const timestamp = new Date().toISOString();
    try {
        const data = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        data.sync_data = timestamp;
        fs.writeFileSync(versionPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log(`  🕒 已写入同步时间：${timestamp}`);
    } catch (e) {
        console.log(`  ⚠️ 写入同步时间失败: ${e.message}`);
    }
}

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
        const fullUrl = github_url + "/" + file.url;
        console.log(`  📡 ${fullUrl}`);

        try {
            // 下载
            const tsContent = await downloadFile(fullUrl);
            console.log(`  ✅ 下载完成 (${(tsContent.length / 1024).toFixed(2)} KB)`);

            // 版本未变化时不覆盖 version.json，也不执行后续下载和同步时间更新。
            if (file.raw && isSameVersion(tsContent)) {
                console.log('  ℹ️ 远程版本与本地版本一致，无需同步。');
                return;
            }

            // 转换（raw 文件本身即为 JSON，跳过 ts->js 转换，仅格式化）
            let jsContent;
            if (file.raw) {
                jsContent = JSON.stringify(JSON.parse(tsContent), null, 2) + '\n';
            } else {
                console.log('  🔄 转换中...');
                jsContent = tsToJs(tsContent);
            }

            // 保存（直接覆盖）
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

    // ============ 记录同步时间 ============
    stampSyncTime();

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
