import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
	plugins: [sveltekit()],
	css: {
		preprocessorOptions: {
			scss: {
				// 向每个 SCSS 编译单元注入全局变量(z-index 等),供所有组件的 <style> 使用。
				// 使用 @use ... as * 代替 @import(Dart Sass 3.0 将移除 @import,会产生弃用警告)。
				// Vite 6 中 additionalData 的导入按被处理文件所在目录解析,
				// 因此通过 loadPaths 将项目根目录加入搜索路径。
				additionalData: `@use 'src/styles/variables.scss' as *;`,
				loadPaths: [path.resolve(process.cwd(), 'src'), process.cwd()]
			}
		}
	},
	server: {
		fs: {
			// Allow serving files from one level up to the project root
			allow: ['..']
		}
	}
});
