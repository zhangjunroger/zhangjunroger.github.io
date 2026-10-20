<script>
	import katex from 'katex';
	// 直接使用本地 npm 包内的 KaTeX 样式(与 JS 版本一致,由 Vite 打包含字体文件),
	// 不再从 jsdelivr CDN 加载,避免受限网络下阻塞页面渲染。
	import 'katex/dist/katex.min.css';

	export let math;
	export let displayMode = false;
	export let style;

	const options = {
		displayMode,
		throwOnError: false,
		style
	};

	$: katexString = katex.renderToString(math, options);
</script>

{@html katexString}
