# CivIdle Tool

CivIdle（放置文明）游戏工具集。

## 本地运行

```bash
git clone https://github.com/wcze/CividleTool
cd CividleTool
npm install
npm run dev
```

浏览器打开 <http://localhost:5173>。


## 同步游戏数据

数据（建筑、科技、文明、市集、价格等）来源于 CivIdle GitHub 官方仓库，运行 `npm run sync-data` 即可同步最新数据。

默认数据源为 `main` 分支，如需更换，修改 `src/data/getData/downloadFiles.js` 中的 `github_url`。

``` javascript
const github_url = "https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main";
```

---

# CivIdle Tool

A tool suite for the game CivIdle.

## Getting Started

```bash
git clone https://github.com/wcze/CividleTool
cd CividleTool
npm install
npm run dev
```

Open <http://localhost:5173> in your browser.

## Syncing Game Data

The data (buildings, techs, civilizations, market, prices, etc.) comes from the CivIdle GitHub repository. Run `npm run sync-data` to sync the latest data.

The default source is the `main` branch. To change it, edit `github_url` in `src/data/getData/downloadFiles.js`:

```javascript
const github_url = "https://raw.githubusercontent.com/fishpondstudio/CivIdle/refs/heads/main";
```