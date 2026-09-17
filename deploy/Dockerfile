# 《自动控制原理》智慧课程 — Docker 镜像（node:20-slim 自带 better-sqlite3 预编译支持）
FROM node:20-slim

WORKDIR /app

COPY package.json ./
COPY dist ./dist
COPY dist-server ./dist-server

RUN npm install --no-audit --no-fund --loglevel=error

ENV NODE_ENV=production \
    PORT=4000 \
    DATA_DIR=/app/data

EXPOSE 4000
VOLUME ["/app/data"]

CMD ["node", "dist-server/api/index.js"]
