# Transformer Explainer(中文版)GitHub Pages 部署指南

本文档提供将本项目部署到 GitHub Pages 的完整步骤。项目已内置两条部署路径:

- **方式一(推荐):GitHub Actions 自动部署**——推送代码后自动构建发布,无需本地构建;
- **方式二:手动部署**——本地构建后用 `gh-pages` 工具推送,适合网络不稳定或需要精细控制的场景。

部署完成后,学生只需访问站点 URL 即可使用,无需安装任何环境。

---

## 目录

1. [部署前须知:两种 GitHub Pages 的区别](#1-部署前须知两种-github-pages-的区别)
2. [环境准备](#2-环境准备)
3. [本地构建与验证(可选但建议)](#3-本地构建与验证)
4. [方式一:GitHub Actions 自动部署(推荐)](#4-方式一github-actions-自动部署推荐)
5. [方式二:手动部署(gh-pages)](#5-方式二手动部署gh-pages)
6. [部署后检查清单](#6-部署后检查清单)
7. [常见问题排查](#7-常见问题排查)
8. [项目结构与配置说明](#8-项目结构与配置说明)

---

## 1. 部署前须知:两种 GitHub Pages 的区别

GitHub Pages 有两种站点形式,这决定了构建时是否需要设置 `BASE_PATH`:

| 站点形式 | 仓库名 | 访问地址 | BASE_PATH |
| --- | --- | --- | --- |
| **项目主页** | 任意名称,如 `transformer-explainer` | `https://<用户名>.github.io/transformer-explainer/` | `/<仓库名>`(必须设置) |
| **用户主页** | `<用户名>.github.io` | `https://<用户名>.github.io/` | 留空(不设置) |

本项目的 `svelte.config.js` 通过读取环境变量 `BASE_PATH` 来配置站点的基础路径:

```js
const basePath = process.env.BASE_PATH ?? '';
// ...
paths: {
    base: basePath
}
```

- **若不设置 `BASE_PATH`,构建产物默认部署在域名根路径**(适合用户主页);
- **项目主页必须设置 `BASE_PATH=/<仓库名>`**,否则页面会白屏(资源 404)。

本文档提供的 GitHub Actions 工作流(方式一)会**自动判断并设置** `BASE_PATH`,无需手工干预。

---

## 2. 环境准备

### 2.1 必备软件

| 软件 | 版本要求 | 检查命令 | 下载地址 |
| --- | --- | --- | --- |
| Node.js | ≥ 20 | `node --version` | https://nodejs.org/ |
| npm | ≥ 10(随 Node 20+ 附带) | `npm --version` | 随 Node.js 安装 |
| Git | 任意较新版本 | `git --version` | https://git-scm.com/ |

### 2.2 GitHub 账号

需要一个 GitHub 账号(https://github.com),并确保完成:

- SSH 密钥配置,或使用 HTTPS + 个人访问令牌(Personal Access Token);
- 仓库的写入权限。

### 2.3 获取完整项目文件

> **重要提示**:本项目内置一个在浏览器中实时运行的 GPT-2 模型,模型文件位于
> `static/model-v2/` 目录,共 **63 个分片**(gpt2.onnx.part0 ~ part62,每个约 10MB,合计约 630MB)。
> 该目录的文件**必须完整**,否则学生只能使用内置示例,无法用自己的文本做实验。
> 若您的副本中该目录不完整,可从原版仓库补齐:
> https://github.com/poloclub/transformer-explainer/tree/main/static/model-v2
>
> 由于 GitHub 对单文件有 100MB 限制,模型被切分为 63 个约 10MB 的分片,浏览器加载后再合并——这是刻意设计,勿改动分片逻辑(`src/utils/fetchChunks.js`)。
>
> **零外部依赖说明**:除模型外,GPT-2 分词器(`static/hf/`)与 ONNX 运行时 wasm 文件
> (`static/ort/`,约 61MB)也已一并内置,页面运行**不再请求 huggingface.co、jsdelivr
> 等外部 CDN**。原版从 HuggingFace 加载分词器,在无法访问该域名的网络环境(如校园机房)
> 中页面会一直转圈无法显示,本版本已通过本地化彻底解决。

---

## 3. 本地构建与验证

建议先在本地确认项目能正常构建,再进行部署。

### 3.1 安装依赖

```bash
cd transformer-explainer
npm install
```

> 若提示 peer dependencies 冲突,请确认项目根目录 `.npmrc` 中包含 `legacy-peer-deps=true`
> (本项目已配置)。若使用手动安装,可执行 `npm install --legacy-peer-deps`。

### 3.2 开发模式运行

```bash
npm run dev
```

浏览器访问 http://localhost:5173,确认界面为中文且各交互功能正常。

### 3.3 生产构建

**部署到项目主页(仓库名不是 `<用户名>.github.io`)时:**

```bash
# Linux / macOS / Git Bash
BASE_PATH=/transformer-explainer npm run build

# Windows CMD
set BASE_PATH=/transformer-explainer && npm run build

# Windows PowerShell
$env:BASE_PATH="/transformer-explainer"; npm run build
```

> 请把 `transformer-explainer` 替换为您的实际仓库名,注意以 `/` 开头。

**部署到用户主页(`<用户名>.github.io` 仓库)时:**

```bash
npm run build
```

构建产物输出在 `build/` 目录。

### 3.4 本地预览构建产物

```bash
npm run preview
```

按提示访问 http://localhost:4173 检查生产版本。**注意**:预览时 `BASE_PATH` 必须与最终部署路径一致,否则资源会 404。

---

## 4. 方式一:GitHub Actions 自动部署(推荐)

项目已内置工作流文件 `.github/workflows/deploy.yml`,推送到 `main` 分支即可自动构建并发布。该工作流会:

1. 安装 Node.js 20 与全部依赖;
2. **自动判断站点类型并设置 `BASE_PATH`**(仓库名以 `.github.io` 结尾则为空,否则为 `/<仓库名>`);
3. 构建并发布到 GitHub Pages。

### 步骤 1:在 GitHub 上创建仓库

1. 登录 GitHub,点击右上角 **+** → **New repository**;
2. 填写仓库名(例如 `transformer-explainer`);
3. 可见性选择 **Public**(GitHub Pages 对免费账号仅支持公开仓库);
4. **不要**勾选"Initialize this repository with a README"(避免与本地历史冲突);
5. 点击 **Create repository**。

### 步骤 2:初始化并推送代码

在本项目根目录执行(假设远程仓库名为 `transformer-explainer`,请替换为您的实际用户名/仓库名):

```bash
cd transformer-explainer

git init
git add .
git commit -m "中文版 Transformer Explainer:完整翻译与 GitHub Pages 部署配置"
git branch -M main
git remote add origin https://github.com/<您的用户名>/transformer-explainer.git
git push -u origin main
```

> 模型分片及内置运行时资源合计约 700MB,首次推送耗时较长,请保持网络稳定。
> 若推送因体积超限失败,可改用 SSH 协议,或参考第 7 节的 Git LFS 说明(不推荐,GitHub LFS 免费额度只有 1GB 流量/月,而本站设计要求模型分片直接走 Pages 静态服务)。

### 步骤 3:启用 GitHub Pages(关键)

1. 进入仓库页面,点击 **Settings** → 左侧 **Pages**;
2. 在 **Build and deployment** 的 **Source** 中选择 **GitHub Actions**(不是 "Deploy from a branch");
3. 保存。

### 步骤 4:触发部署

- 推送代码后,工作流自动运行。也可手动触发:点击仓库顶部 **Actions** 标签 → 左侧选择 **Deploy to GitHub Pages** → 右侧 **Run workflow**。
- 等待工作流运行完毕(绿色 ✓),通常需要 3–8 分钟(含依赖安装与 630MB 静态资源发布)。

### 步骤 5:访问站点

浏览器打开:

```
https://<您的用户名>.github.io/transformer-explainer/
```

首次打开时,浏览器需要下载约 600MB 的 GPT-2 模型(会缓存在浏览器 IndexedDB 中,之后访问不再重复下载)。加载完成前,页面可用内置示例演示。

---

## 5. 方式二:手动部署(gh-pages)

适合无法使用 Actions 的场景。此方式将 `build/` 目录推送到 `gh-pages` 分支,再由 GitHub Pages 托管。

### 步骤 1:设置 Pages 来源

进入仓库 **Settings** → **Pages** → **Source** 选择 **Deploy from a branch** →
**Branch** 选择 `gh-pages`、目录 `/(root)` → 保存。

### 步骤 2:本地构建(注意 BASE_PATH)

```bash
# 项目主页(大多数情况)
BASE_PATH=/transformer-explainer npm run build

# 用户主页仓库(<用户名>.github.io)则直接:
npm run build
```

### 步骤 3:发布到 gh-pages 分支

```bash
npm run deploy
```

该脚本实际执行 `gh-pages -d build --nojekyll`:
- `-d build`:发布 `build/` 目录内容;
- `--nojekyll`:跳过 Jekyll 处理(GitHub Pages 默认运行 Jekyll,会忽略以下划线开头的文件,而本项目产物 `_app/` 目录必须保留)。

首次执行会要求输入 GitHub 凭据(建议使用 Personal Access Token 作为密码)。

### 步骤 4:验证

等待 1–3 分钟后访问 `https://<您的用户名>.github.io/<仓库名>/`。

> **注意**:每次更新代码后,需要重复"构建 → `npm run deploy`"两步。

---

## 6. 部署后检查清单

部署完成后,请逐项确认:

- [ ] 页面标题显示"Transformer Explainer:Transformer 大语言模型可视化解析";
- [ ] 顶栏"示例"下拉可选 5 个示例,点击"生成"按钮能预测下一个词;
- [ ] 点击"嵌入(Embedding)""概率"等标题可展开对应区域;
- [ ] 右下角书本图标打开的**交互式教程**为中文,共 20 页,可正常翻页;
- [ ] 悬浮提示(如"向量(768)""词元 ID")为中文;
- [ ] 页面滚动到下方,教学文章(《什么是 Transformer?》起)为中文;
- [ ] 等待模型加载完成(顶栏出现提示消失后),自定义输入英文文本后点击"生成"能正常预测(示例输入为英文属于正常现象,见第 7 节);
- [ ] 若部署在项目主页,直接访问根域名会 404——必须带仓库名子路径访问。

---

## 7. 常见问题排查

### Q1 页面白屏 / 样式与脚本加载失败(404)

**原因**:部署在项目主页但未设置 `BASE_PATH`。
**解决**:确认构建时设置了 `BASE_PATH=/<仓库名>`;使用方式一时工作流会自动处理。检查 `build/index.html` 中资源引用是否以 `/<仓库名>/` 开头。

### Q2 页面一直转圈 / 可视化不显示

**根因**:页面需要先加载 GPT-2 分词器才能显示可视化,原版从 `huggingface.co`
拉取该文件;在无法访问 HuggingFace 的网络环境(中国大陆常见)中,该请求被卡死,
页面就会一直转圈。
**本版本已彻底修复**:分词器已内置在 `static/hf/`,ONNX 运行时 wasm 已内置在
`static/ort/`,运行时不请求任何外部 CDN。若部署后仍长时间转圈,请:

- 确认这两个目录已随代码完整推送(合计约 70MB,共 8 个文件);
- 打开浏览器开发者工具 → Network,查看是否有请求长时间处于 pending 状态;
- 查看浏览器 Console 是否有报错,常见为部署路径与 `BASE_PATH` 不匹配导致的资源 404。

### Q2b 模型一直加载不出来

- 确认 `static/model-v2/` 中 63 个分片**全部**已推送(在 GitHub 仓库网页上核对文件数量);
- 打开浏览器开发者工具 → Network,查看 `gpt2.onnx.partN` 请求是否 404;
- 模型约 600MB,首次加载依赖网络带宽;加载完成后会缓存(浏览器 IndexedDB),刷新不再重复下载;
- 模型未加载完成时,仍可使用 5 个内置示例进行教学演示。

### Q3 示例输入是英文,能改成中文吗?输入中文会怎样?

**不能,且程序已主动拦截**。本工具内置的 GPT-2 是英文(字节级 BPE)模型:一个汉字由 3
个 UTF-8 字节构成,会被切成不完整的字节片段,词元与预测结果会显示为乱码。因此输入框检测到中文输入时会提示"GPT-2 为英文模型,请输入英文文本"并停用"生成"按钮,引导学生改用英文。界面、教程与文章均为中文,不影响学生理解原理;若需真正支持中文,须更换底层模型与分词器,工程量较大。

### Q4 推送提示文件过大(超过 100MB)

GitHub 限制单文件 ≤ 100MB。本项目所有文件(含模型分片)均约 10MB/个,正常不会触发。若您自行加入了大文件,请拆分或移除。

### Q4b 站点总体积超过 1GB 时,页面打不开/一直 404

**GitHub Pages 限制发布后的站点总体积约 1GB,超限会导致部署失败**(旧版本内容继续在线,新内容永不发布,且 GitHub 只会通过邮件/通知提示)。本工具的模型分片共约 630MB,若您的主页仓库本身已有数百 MB 内容,**不要把模型放进 Pages 仓库**。本项目已内置解决方案:页面加载模型时会先探测站点内是否自带 `model-v2` 分片,没有则自动改从 jsDelivr CDN(`cdn.jsdelivr.net/gh/poloclub/transformer-explainer@...`)加载完全相同的分片。若您有独立服务器/域名,也可自行托管模型并在 `+page.svelte` 中修改 `MODEL_CDN_BASE`。

> 采用"部署到个人主页子文件夹"方案时,推荐**不上传 `static/model-v2/`**,保持站点体积在限制内;分词器与 ONNX 运行时(约 90MB)保留在站点内即可。

### Q5 npm install 报 peer dependencies 冲突(ERESOLVE)

项目 `.npmrc` 已配置 `legacy-peer-deps=true`。若仍报错,执行:

```bash
npm install --legacy-peer-deps
```

### Q6 Actions 工作流失败

- 进入仓库 **Actions** 标签查看失败日志;
- 常见原因:**Settings → Pages → Source 未选择 "GitHub Actions"**(会报无权限创建 deployment);
- 免费账号要求仓库为 **Public**;
- 若因网络代理导致本地构建失败(如 `unable to verify the first certificate`),建议直接使用方式一在线上构建。

### Q7 想修改站点内容后重新发布

- 方式一:修改代码 → `git add . && git commit -m "..." && git push`,自动重新部署;
- 方式二:重新执行"构建 + `npm run deploy`"。

### Q7b 改了代码,但本地预览看到的还是旧页面?

**`npm run preview` 只在启动时读取一次 `build/` 目录,之后重新 `npm run build` 不会自动生效**——必须
停止预览(Ctrl+C)再重新 `npm run preview`,并在浏览器中用 `Ctrl + F5` 强制刷新。日常改代码调试请直接用
`npm run dev`(改动即时生效);`preview` 仅用于发布前检查生产构建。

另:本项目顶栏 Logo 使用 Google 字体 Jersey 10 的请求已移除(国内无法访问会拖慢加载并使标签页
一直转圈),Logo 自动回退系统字体,属正常现象。

### Q8 学生访问速度慢

GitHub Pages 在中国大陆的访问速度不稳定。可选方案:
- 使用 CDN(如 Cloudflare)代理自定义域名;
- 或将站点镜像部署到校内服务器/Gitee Pages 等,`BASE_PATH` 按对应路径调整。

---

## 8. 项目结构与配置说明

与本部署直接相关的文件:

```
transformer-explainer/
├── .github/workflows/
│   ├── deploy.yml            # GitHub Pages 自动部署工作流(方式一)
│   └── sync.yml              # 与上游原版仓库同步(可按需删除)
├── static/
│   ├── model-v2/             # GPT-2 ONNX 模型 63 个分片(约 630MB)
│   ├── hf/                   # GPT-2 分词器(本地化,替代 HuggingFace CDN)
│   └── ort/                  # ONNX 运行时 wasm 文件(本地化,替代 jsdelivr CDN)
├── src/
│   ├── app.html              # 页面标题与 SEO 元信息(中文)
│   ├── components/
│   │   ├── article/Article.svelte     # 下方教学长文(中文)
│   │   ├── Popovers/                 # 各类权重/公式提示框(中文)
│   │   ├── textbook/                 # 交互式教程卡片与导航(中文)
│   │   └── ...                       # 可视化组件(中文)
│   ├── routes/                # 页面入口(+page.svelte 中配置了资源本地化)
│   └── utils/textbookPages.ts # 交互式教程 20 页内容(中文)
├── svelte.config.js          # SvelteKit 配置:adapter-static + BASE_PATH 环境变量
├── vite.config.ts             # Vite 6 构建配置(sass 全局变量注入)
├── tailwind.config.js        # Tailwind CSS 配置
├── package.json               # npm run deploy = gh-pages -d build --nojekyll
└── .npmrc                     # legacy-peer-deps=true
```

**翻译范围说明**:界面文本、20 页交互式教程、全部悬浮提示框、教学长文、页面标题与
SEO 元信息、README 均已转换为标准中文学术表达;技术缩写(Q/K/V、Softmax、Top-k、
Top-p、GELU、Logits、MLP、Dropout 等)按学术惯例保留英文,并在首次出现处附中文译名。
