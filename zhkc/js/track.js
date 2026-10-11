// ============================================================
// track.js —— 学习行为埋点 → 服务器
//   · 包装 analytics.js 的 trackEvent，本地留档的同时批量上报 SQLite
//   · 身份：localStorage zhkc_identity（签到/登录时写入）
//   · 无服务器（file:// 直开）时自动静默
// ============================================================
(function () {
    if (location.protocol === 'file:') return;

    const ID_KEY = 'zhkc_identity';
    function identity() {
        try { return JSON.parse(localStorage.getItem(ID_KEY)) || {}; }
        catch (e) { return {}; }
    }
    window.setZhkcIdentity = function (name, className) {
        try { localStorage.setItem(ID_KEY, JSON.stringify({ name: name || '', className: className || '' })); } catch (e) {}
    };
    window.getZhkcIdentity = identity;

    let queue = [];
    let timer = null;

    window.serverTrack = function (module, action, extra, ts) {
        const id = identity();
        queue.push({
            module, action,
            extra: typeof extra === 'object' ? JSON.stringify(extra) : (extra || ''),
            t: ts || Date.now(),
            name: id.name || '', className: id.className || '',
            route: location.pathname.split('/').pop() || 'index.html'
        });
        if (queue.length >= 10) flush();
        else if (!timer) timer = setTimeout(flush, 4000);
    };

    function flush() {
        if (timer) { clearTimeout(timer); timer = null; }
        if (!queue.length) return;
        const batch = queue;
        queue = [];
        // 交给 js/pb.js 汇总上报：它自带 20 条/3 秒的攒批与页面关闭前的兜底 flush，
        // 比这里各页面各写一遍 fetch + sendBeacon 可靠（关页瞬间的 beacon 请求
        // 在新的数据通道里没有对应实现，队列会丢）
        batch.forEach(it => { if (it && it.module) window.PB.track(it); });
        window.PB.flushTrack();
    }
    window.addEventListener('pagehide', function () {
        if (!queue.length) return;
        try {
            queue.forEach(it => { if (it && it.module) window.PB.track(it); });
            window.PB.flushTrack();
            queue = [];
        } catch (e) {}
    });

    // 包装本地 trackEvent（analytics.js 已定义）
    function wrap() {
        const orig = window.trackEvent;
        window.trackEvent = function (module, action, extra) {
            try { orig && orig(module, action, extra); } catch (e) {}
            window.serverTrack(module, action, extra);
        };
    }
    if (window.trackEvent) wrap();
    else {
        const t0 = Date.now();
        const iv = setInterval(() => {
            if (window.trackEvent) { wrap(); clearInterval(iv); }
            else if (Date.now() - t0 > 5000) clearInterval(iv);
        }, 200);
    }

    // 页面访问
    const page = location.pathname.split('/').pop() || 'index.html';
    const chMatch = page.match(/^chapter(\d+)\.html$/);
    if (chMatch) {
        window.serverTrack('课程章节', '访问第' + chMatch[1] + '章', '');
    } else if (page === 'index.html' || page === '') {
        window.serverTrack('首页', '打开首页', '');
    } else if (page === 'student.html' || page === 'admin.html') {
        // 后台类页面不记为学习行为
    } else {
        window.serverTrack('网站', '打开页面', page);
    }
})();
