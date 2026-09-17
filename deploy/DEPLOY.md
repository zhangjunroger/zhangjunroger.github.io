# 《自动控制原理》智慧课程 — 服务器部署指南

本部署包为「前端 + 后端 + 本地 SQLite 数据库」的完整生产版本，适合部署到自己的服务器（Linux VPS / 校内服务器均可），**所有数据（用户、课堂互动、答题记录等）都保存在本地文件 `data/app.db` 中**，备份迁移只需复制该文件。

## 目录结构

```
zdkzyl-server/
├── package.json              # 仅后端依赖（首次部署 npm install 用）
├── deploy.sh                 # 一键部署/启动脚本
├── .env.production.example   # 环境变量模板（复制为 .env 使用）
├── dist/                     # 前端静态文件（nginx 或后端均可托管）
├── dist-server/              # 后端编译产物（Node.js 运行）
├── data/                     # SQLite 数据库目录（运行时自动创建）
└── deploy/
    ├── nginx.conf.example    # nginx 反向代理配置示例
    ├── zdkzyl.service        # systemd 开机自启服务
    ├── Dockerfile            # Docker 方式部署
    └── docker-compose.yml
```

## 环境要求

- Node.js **18 / 20 / 22 LTS**（不建议 23+，better-sqlite3 可能无预编译包）
- Linux 服务器开放端口：`80`（nginx）或 `4000`（直连后端）

## 方式一：常规部署（推荐）

```bash
# 1. 上传部署包到服务器并解压
scp zdkzyl-server.tar.gz user@服务器IP:/opt/
ssh user@服务器IP
cd /opt && tar -xzf zdkzyl-server.tar.gz && mv zdkzyl-server zdkzyl && cd zdkzyl

# 2. 一键安装依赖并启动（脚本会自动：装依赖 → 复制 .env → 初始化数据库 → 前台启动）
chmod +x deploy.sh && ./deploy.sh
# 出现 [DB:SQLite] initialized at .../data/app.db 即启动成功

# 3. 用 systemd 设为开机自启（推荐，替换第 2 步的前台启动）
sudo cp deploy/zdkzyl.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now zdkzyl
sudo systemctl status zdkzyl   # 确认 active (running)
```

此时直接访问 `http://服务器IP:4000` 即可使用完整功能。

## 方式二：Docker 部署

```bash
cd zdkzyl
cp deploy/.env.production.example .env    # 修改 JWT_SECRET 等
docker compose up -d --build
docker compose logs -f                    # 查看启动日志
```

数据库通过 volume `./data` 持久化到宿主机。

## nginx 反向代理（可选，用 80 端口或绑定域名）

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/conf.d/zdkzyl.conf
# 编辑 server_name 为你的域名/IP，root 指向实际 dist 目录
sudo nginx -t && sudo systemctl reload nginx
```

配置好后访问 `http://你的域名/` 即可，`/api` 自动转发到后端 4000 端口。

## 必改配置（.env）

| 变量 | 说明 |
|---|---|
| `JWT_SECRET` | **必须改成随机长字符串**（登录令牌签名密钥） |
| `ALLOWED_ORIGINS` | 加上课页访问地址，如 `http://服务器IP:4000` 或 `http://你的域名` |
| `PORT` | 后端端口，默认 4000 |

## 默认账号（首次启动自动初始化，请立即改密码）

- 管理员：`admin`
- 教师：`teacher`
- 学生示例：`student` 及若干演示学生账号

## 数据备份与迁移

所有业务数据在本地数据库文件中：

```bash
# 备份（WAL 模式，建议先 checkpoint）
sqlite3 data/app.db "PRAGMA wal_checkpoint(TRUNCATE);"
tar -czf backup-$(date +%F).tar.gz data/

# 迁移到新服务器：直接把 data/ 目录整个复制过去即可
```

## 常见问题

- **better-sqlite3 安装失败**：预编译二进制下载失败时会尝试源码编译，需要 `sudo apt-get install -y python3 make g++` 后重新 `npm rebuild better-sqlite3`。
- **学生扫码后打不开页面**：确认服务器防火墙/安全组已放行端口；二维码地址基于访问地址自动生成（`/api/server-info`），也可在教师端手动改写。
- **本地开发**：`npm run dev:fullstack`（前端 5173 + 后端 4000）。
- **GitHub Pages 演示站**：本仓库 main 分支 `/zdkzyl/` 为纯前端静态演示版（实验平台全部可用；扫码互动需按本指南部署后端）。
