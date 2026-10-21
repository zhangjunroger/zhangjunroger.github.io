// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * GitHub Pages 部署说明:
 * - 部署到"用户主页"仓库(即名为 <用户名>.github.io 的仓库,URL 为 https://<用户名>.github.io/):
 *   无需设置 BASE_PATH(默认为空字符串即可)。
 * - 部署到"项目主页"(URL 为 https://<用户名>.github.io/<仓库名>/):
 *   构建前设置环境变量 BASE_PATH 为仓库名,以下写法均可:
 *     BASE_PATH=transformer-explainer npm run build   # 推荐,任何终端都适用
 *     BASE_PATH=/transformer-explainer npm run build  # CMD/PowerShell/Linux 可用
 *   注意:Git Bash / MSYS 终端会把以 "/" 开头的变量值自动转换为 Windows 路径,
 *   因此在这些终端中请使用不带斜杠的写法。
 */
let basePath = process.env.BASE_PATH ?? '';
if (basePath && !basePath.startsWith('/')) basePath = '/' + basePath; // 兼容不带斜杠的写法
if (basePath.endsWith('/')) basePath = basePath.slice(0, -1); // SvelteKit 要求不以 "/" 结尾

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			strict: false // Ignore errors about dynamic routes
		}),
		prerender: {
			// List the specific routes to prerender
			entries: ['/' /* other routes if needed */]
		},
		alias: {
			'~': './src'
		},
		paths: {
			base: basePath
		}
	}
};

export default config;
