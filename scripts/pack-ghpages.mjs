// 打包 GitHub Pages 静态版所需文件
// dist-ghpages/index.html → 404.html（SPA 回退），并生成 .nojekyll
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('dist-ghpages');
if (!fs.existsSync(path.join(dir, 'index.html'))) {
  console.error('dist-ghpages/index.html 不存在，请先运行 npm run build:static');
  process.exit(1);
}
fs.copyFileSync(path.join(dir, 'index.html'), path.join(dir, '404.html'));
fs.writeFileSync(path.join(dir, '.nojekyll'), '');
console.log('✅ 已生成 dist-ghpages/404.html（SPA 回退）与 .nojekyll');
