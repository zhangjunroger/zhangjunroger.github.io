#!/usr/bin/env bash
# 《自动控制原理》智慧课程 — 服务器一键部署/启动脚本
# 用法: chmod +x deploy.sh && ./deploy.sh
set -e
cd "$(dirname "$0")"

echo "==> [1/4] 检查 Node.js（需要 >= 18）"
if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js。请先安装（Ubuntu/Debian 示例）:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi
NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 版本过低（$(node -v)），需要 >= 18，请升级后重试。"
  exit 1
fi
echo "    Node $(node -v) OK"

echo "==> [2/4] 安装后端依赖（better-sqlite3 会自动下载 Linux 预编译二进制）"
npm install --no-audit --no-fund --loglevel=error
if ! node -e "require('better-sqlite3')" >/dev/null 2>&1; then
  echo "    better-sqlite3 预编译不可用，尝试源码编译（需要 python3 make g++）"
  npm rebuild better-sqlite3 --loglevel=error
fi
echo "    依赖安装完成"

echo "==> [3/4] 准备环境变量与数据库"
if [ ! -f .env ]; then
  cp .env.production.example .env
  echo "    已从模板生成 .env —— 请务必修改其中的 JWT_SECRET！"
fi
mkdir -p data

echo "==> [4/4] 启动服务（前台运行，Ctrl+C 停止；生产建议用 deploy/zdkzyl.service 设为开机自启）"
NODE_ENV=production node dist-server/api/index.js
