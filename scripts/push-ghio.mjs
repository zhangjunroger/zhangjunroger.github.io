// 通过 GitHub Git Data API 上传静态站点（绕开 git 大传输在弱网下 SSL 中断的问题）
// 用法: node scripts/push-ghio.mjs
// 流程: 读 ref → 逐文件上传 blob（可重试）→ 建 tree → 建 commit → 更新 main
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'zhangjunroger/zhangjunroger.github.io';
const SRC_DIR = path.resolve('dist-ghpages');
const ROOT_404 = path.resolve('scripts/ghio-404.html');
const API = `https://api.github.com/repos/${REPO}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getToken() {
  const out = execSync('git credential fill', {
    input: 'protocol=https\nhost=github.com\n',
    encoding: 'utf8',
  });
  const m = out.match(/^password=(.*)$/m);
  if (!m) throw new Error('未找到 GitHub 凭据');
  return m[1].trim();
}

async function api(url, opts = {}, retries = 6) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, opts);
      if (res.status >= 500 || res.status === 429) {
        console.log(`  .. ${res.status}，第 ${i + 1} 次重试`);
        await sleep(2500 * (i + 1));
        continue;
      }
      const j = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(j).slice(0, 300)}`);
      return j;
    } catch (e) {
      if (String(e.message).startsWith('HTTP')) throw e;
      if (i === retries) throw e;
      console.log(`  .. 网络错误（${String(e.message).slice(0, 60)}），第 ${i + 1} 次重试`);
      await sleep(2500 * (i + 1));
    }
  }
}

// 收集要上传的文件: dist-ghpages/** → zdkzyl/**，外加根目录 404.html
function collectFiles() {
  const files = [];
  const walk = (dir, prefix) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full, rel);
      else if (!/\.(map|gz|br)$/.test(name) && rel !== '404.html') {
        files.push({ path: `zdkzyl/${rel}`, full, size: st.size });
      }
    }
  };
  walk(SRC_DIR, '');
  files.push({ path: '404.html', full: ROOT_404, size: fs.statSync(ROOT_404).size });
  return files;
}

async function main() {
  const token = getToken();
  const H = { Authorization: `token ${token}`, 'Content-Type': 'application/json' };

  console.log('1/5 读取远端 main 最新提交…');
  const ref = await api(`${API}/git/ref/heads/main`, { headers: H });
  const baseCommitSha = ref.object.sha;
  const baseCommit = await api(`${API}/git/commits/${baseCommitSha}`, { headers: H });
  const baseTreeSha = baseCommit.tree.sha;
  console.log(`   base commit=${baseCommitSha.slice(0, 8)} tree=${baseTreeSha.slice(0, 8)}`);

  const files = collectFiles();
  console.log(`2/5 上传 ${files.length} 个文件 blob（共 ${(files.reduce((s, f) => s + f.size, 0) / 1048576).toFixed(1)} MB）…`);
  const entries = [];
  for (const [i, f] of files.entries()) {
    const content = fs.readFileSync(f.full).toString('base64');
    const blob = await api(`${API}/git/blobs`, {
      method: 'POST', headers: H, body: JSON.stringify({ content, encoding: 'base64' }),
    });
    entries.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    process.stdout.write(`   [${i + 1}/${files.length}] ${f.path}\n`);
  }

  console.log('3/5 创建 tree…');
  const tree = await api(`${API}/git/trees`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: entries }),
  });
  console.log(`   tree=${tree.sha.slice(0, 8)}`);

  console.log('4/5 创建 commit…');
  const commit = await api(`${API}/git/commits`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      message: '新增《自动控制原理》智慧课程新版站点（/zdkzyl/）：在线实验平台 + 静态演示版',
      tree: tree.sha,
      parents: [baseCommitSha],
    }),
  });
  console.log(`   commit=${commit.sha.slice(0, 8)}`);

  console.log('5/5 更新 main 分支…');
  await api(`${API}/git/refs/heads/main`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  console.log('✅ 完成！站点地址: https://zhangjunroger.github.io/zdkzyl/');
}

main().catch((e) => { console.error('❌ 失败:', e.message); process.exit(1); });
