// 打包服务器部署包 → release/zdkzyl-server.tar.gz
// 内容: dist(前端) + dist-server(后端) + server-only package.json + deploy 脚本
// 用法: npm run deploy:prepare && node scripts/pack-release.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 后端运行时依赖子集（dist-server 编译产物实际 import 的包）
const SERVER_DEPS = [
  'bcryptjs', 'better-sqlite3', 'compression', 'cors', 'dotenv',
  'express', 'helmet', 'jsonwebtoken', 'nanoid', 'zod',
];
const serverPkg = {
  name: 'zdkzyl-server',
  version: rootPkg.version || '1.0.0',
  private: true,
  type: 'module',
  dependencies: Object.fromEntries(
    SERVER_DEPS.filter((d) => (rootPkg.dependencies || {})[d]).map((d) => [d, rootPkg.dependencies[d]])
  ),
  engines: { node: '>=18 <23' },
};

const stage = 'release/_stage';
fs.rmSync('release', { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(serverPkg, null, 2) + '\n');
fs.cpSync('dist', path.join(stage, 'dist'), { recursive: true });
fs.cpSync('dist-server', path.join(stage, 'dist-server'), { recursive: true });
fs.cpSync('deploy', path.join(stage, 'deploy'), { recursive: true });

// 去掉 sourcemaps 与预压缩文件，减小包体
const stripWalk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) stripWalk(full);
    else if (/\.(map|gz|br)$/.test(name)) fs.rmSync(full);
  }
};
stripWalk(path.join(stage, 'dist'));

execSync('tar -czf ../zdkzyl-server.tar.gz .', { cwd: stage, stdio: 'inherit' });
fs.rmSync(stage, { recursive: true, force: true });

const size = (fs.statSync(path.join('release', 'zdkzyl-server.tar.gz')).size / 1048576).toFixed(1);
console.log(`✅ 已生成 release/zdkzyl-server.tar.gz（${size} MB）`);
console.log('   上传到服务器后: tar -xzf zdkzyl-server.tar.gz && chmod +x deploy.sh && ./deploy.sh');
