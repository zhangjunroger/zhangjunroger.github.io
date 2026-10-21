// ============================================================
// math-render.js —— LaTeX 公式本地渲染（KaTeX，离线可用）
//   · 全站统一入口，替代旧 MathJax CDN 方案
//   · 页面加载完成后自动扫描 body 渲染 $...$ / $$...$$ / \(...\) / \[...\]
//   · window.typesetMath(elements) 供各实验在动态更新公式后调用
//   · MutationObserver 监听动态插入/修改的 DOM，自动补渲染
//   依赖：js/vendor/katex/{katex.min.js, auto-render.min.js, katex.min.css, fonts/}
// ============================================================
(function () {
    'use strict';
    if (!window.katex || !window.renderMathInElement) {
        console.error('[math] KaTeX 未加载，公式将保持源码显示');
        return;
    }

    const DELIMITERS = [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }
    ];

    const OPTIONS = {
        delimiters: DELIMITERS,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
        ignoredClasses: ['katex', 'no-math'],
        throwOnError: false,
        strict: false,
        trust: false,
        macros: {
            '\\R': '\\mathbb{R}',
            '\\E': '\\mathbb{E}'
        }
    };

    // 对单个容器做公式渲染（幂等：已渲染的 .katex 内容会被跳过）
    function renderIn(el) {
        if (!el || el.nodeType !== 1) return;
        if (el.closest('.katex')) return;
        try { window.renderMathInElement(el, OPTIONS); }
        catch (e) { /* 单元素失败不影响其他 */ }
    }

    // —— 全站统一 API：动态更新公式后调用 ——
    window.typesetMath = function (elements) {
        const list = elements ? (Array.isArray(elements) ? elements : [elements]) : [document.body];
        for (const el of list) renderIn(el);
    };

    // 首次全页渲染
    function renderAll() {
        try {
            window.renderMathInElement(document.body, OPTIONS);
        } catch (e) { console.error('[math] 首次渲染失败', e); }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderAll);
    } else {
        renderAll();
    }

    // —— 动态内容监听：实验更新 DOM 后自动补渲染 ——
    let pending = new Set();
    let timer = null;
    function schedule(node) {
        if (node.nodeType !== 1 && node.nodeType !== 3) return;
        const el = node.nodeType === 1 ? node : node.parentElement;
        if (!el || !el.isConnected) return;
        if (el.closest('.katex')) return;
        const text = el.textContent || '';
        if (text.indexOf('$') === -1 && text.indexOf('\\(') === -1 && text.indexOf('\\[') === -1) return;
        pending.add(el);
        if (!timer) timer = setTimeout(flush, 120);
    }
    function flush() {
        timer = null;
        const list = pending;
        pending = new Set();
        for (const el of list) {
            // 渲染到尽量小的容器：若元素本身不含定界符但子元素含，逐子处理
            renderIn(el);
        }
    }
    const mo = new MutationObserver((muts) => {
        for (const m of muts) {
            if (m.type === 'childList') {
                m.addedNodes.forEach(schedule);
                if (m.target && m.target.nodeType === 1) schedule(m.target);
            } else if (m.type === 'characterData') {
                schedule(m.target);
            }
        }
    });
    function startObserver() {
        mo.observe(document.body, { childList: true, characterData: true, subtree: true });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }
})();
