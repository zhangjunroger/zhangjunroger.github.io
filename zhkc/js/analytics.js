// ============================================================
// analytics.js —— 全站使用数据埋点与可视化
//   · 自动记录：实验平台 17 个实验的交互、课堂工具 8 个模块的使用
//   · 存储：localStorage（key: zhkc_analytics），上限 5000 条 FIFO
//   · 可视化：「使用统计」Tab —— 仪表卡片 / 模块柱状图 / 14天活跃折线 /
//     明细表 / 最近动态 / 学习档案 / 导出 JSON
// ============================================================

// ---------- 埋点核心 ----------
(function () {
    const KEY = 'zhkc_analytics';
    const CAP = 5000;

    window.trackEvent = function (module, action, extra) {
        try {
            const raw = localStorage.getItem(KEY);
            const arr = raw ? JSON.parse(raw) : [];
            arr.push({ t: Date.now(), m: module, a: action, x: extra || null });
            while (arr.length > CAP) arr.shift();
            localStorage.setItem(KEY, JSON.stringify(arr));
            // 统计页可见时实时刷新
            if (window._statsVisible && typeof window.renderStatsDashboard === 'function') {
                clearTimeout(window._statsDirty);
                window._statsDirty = setTimeout(() => window.renderStatsDashboard(), 400);
            }
        } catch (e) { /* 存储满等异常忽略 */ }
    };

    window.getAnalytics = function () {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || [];
        } catch (e) { return []; }
    };

    window.clearAnalytics = function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
    };

    // 页面访问
    window.trackEvent('网站', '打开页面');
})();

// ---------- 按钮/控件 → 模块映射（自动埋点，无需改各模块内部代码） ----------
(function () {
    const MAP = {
        // ---- 实验平台 ----
        activationSelect: ['实验1 激活函数', '切换函数'],
        scaleSlider: ['实验1 激活函数', '调参数'],
        gdPlayBtn: ['实验2 梯度下降', '开始训练'],
        gdResetBtn: ['实验2 梯度下降', '重置'],
        perceptronTrainBtn: ['实验3 感知机', '训练'],
        perceptronClearBtn: ['实验3 感知机', '清空'],
        nnResetBtn: ['实验4 前向传播', '随机权重'],
        bpTrainBtn: ['实验5 反向传播', '训练一步'],
        bpTrain50Btn: ['实验5 反向传播', '训练50步'],
        bpResetBtn: ['实验5 反向传播', '重置'],
        cnnPlayBtn: ['实验6 CNN', '扫描动画'],
        rnnTrainBtn: ['实验7 RNN/LSTM', '训练1步'],
        rnnTrain50Btn: ['实验7 RNN/LSTM', '训练50步'],
        rnnAutoBtn: ['实验7 RNN/LSTM', '持续训练'],
        attnQuerySelect: ['实验8 注意力', '切换Query'],
        attnHeadSlider: ['实验8 注意力', '调头数'],
        regTrainBtn: ['实验9 正则化', '训练'],
        regAutoBtn: ['实验9 正则化', '持续训练'],
        smTrainBtn: ['实验10 Softmax', '训练'],
        smAutoBtn: ['实验10 Softmax', '持续训练'],
        vdResetBtn: ['实验11 梯度消失', '重新初始化'],
        vdActSelect: ['实验11 梯度消失', '切换激活'],
        vdInitSelect: ['实验11 梯度消失', '切换初始化'],
        opRunBtn: ['实验12 优化器', '竞速'],
        opStepBtn: ['实验12 优化器', '单步'],
        schTrainBtn: ['实验13 调度器', '训练'],
        schAutoBtn: ['实验13 调度器', '持续训练'],
        pgAutoBtn: ['实验14 Playground', '开始训练'],
        pgStepBtn: ['实验14 Playground', '单步'],
        aeAutoBtn: ['实验15 自编码器', '持续训练'],
        aeNoiseSlider: ['实验15 自编码器', '调噪声'],
        ganAutoBtn: ['实验16 GAN', '开始对抗'],
        dfFwdBtn: ['实验17 扩散模型', '正向加噪'],
        dfRevBtn: ['实验17 扩散模型', '反向去噪'],
        // ---- 课堂工具 ----
        rcStart: ['智能点名', '点名'],
        rcSave: ['智能点名', '保存名单'],
        rcLoadSample: ['智能点名', '载入示例'],
        rcResetHist: ['智能点名', '清空记录'],
        aqDraw: ['随机提问', '抽取问题'],
        aqAnother: ['随机提问', '换一题'],
        aqGood: ['随机提问', '评优秀'],
        aqBad: ['随机提问', '评待加强'],
        qzStart: ['随堂测验', '开始测验'],
        flShuffle: ['概念闪卡', '洗牌'],
        flKnow: ['概念闪卡', '认识'],
        flUnknow: ['概念闪卡', '不认识'],
        timerStart: ['课堂计时', '开始/暂停'],
        timerSet: ['课堂计时', '自定义设定'],
        gGo: ['随机分组', '开始分组'],
        gShuffle: ['随机分组', '重新打乱'],
        nExport: ['学习笔记', '导出TXT'],
        lvSyncRoster: ['扫码签到', '同步名单'],
        lvPush: ['扫码签到', '推送题目'],
        lvCloseQ: ['扫码签到', '结束本题'],
        lvReset: ['扫码签到', '清空记录'],
        lvDemo: ['扫码签到', '演示模拟']
    };

    const SELECT_MAP = {
        activationSelect: 1, attnQuerySelect: 1, vdActSelect: 1, vdInitSelect: 1
    };

    document.addEventListener('click', e => {
        const el = e.target.closest('button, input[type="checkbox"]');
        if (!el || !el.id) return;
        const hit = MAP[el.id];
        if (hit) window.trackEvent(hit[0], hit[1]);
    }, true);

    document.addEventListener('change', e => {
        const el = e.target;
        if (!el.id) return;
        const hit = MAP[el.id];
        if (hit && (el.tagName === 'SELECT' || SELECT_MAP[el.id])) {
            window.trackEvent(hit[0], hit[1], el.tagName === 'SELECT' ? el.value : null);
        }
    }, true);
})();

// ============================================================
// 统计聚合
// ============================================================
function statsModuleSummary(events) {
    const map = {};
    for (const ev of events) {
        if (!map[ev.m]) map[ev.m] = { count: 0, last: 0 };
        map[ev.m].count++;
        map[ev.m].last = Math.max(map[ev.m].last, ev.t);
    }
    return Object.entries(map)
        .map(([m, v]) => ({ module: m, count: v.count, last: v.last }))
        .sort((a, b) => b.count - a.count);
}

function statsDaily(events, days) {
    const out = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
        const label = (d.getMonth() + 1) + '/' + d.getDate();
        const count = events.filter(ev => ev.t >= d.getTime() && ev.t < next.getTime()).length;
        out.push({ label, count });
    }
    return out;
}

function statsLearnArchive() {
    // 从各模块的既有存储汇总学习档案
    const archive = [];
    try {
        // 测验最佳成绩
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('zhkc_quiz_best_ch')) {
                const v = JSON.parse(localStorage.getItem(k));
                archive.push({ icon: '📝', name: '随堂测验 · 第' + k.replace('zhkc_quiz_best_ch', '') + '章最佳', value: v.score + '/' + v.total + ' 分' });
            }
        }
        // 提问统计
        const aq = toolsLS && toolsLS('askq_stats');
        if (aq) archive.push({ icon: '🎲', name: '随机提问累计', value: (aq.good + aq.bad) + ' 次（优秀 ' + aq.good + '）' });
        // 点名记录
        let rollN = 0, classes = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('zhkc_rc_') && k.endsWith('_hist')) {
                const v = JSON.parse(localStorage.getItem(k));
                if (Array.isArray(v)) { rollN += v.length; classes++; }
            }
        }
        if (rollN) archive.push({ icon: '🙋', name: '点名记录', value: rollN + ' 条（' + classes + ' 个班级）' });
        // 笔记字数
        let noteChars = 0, noteChs = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('zhkc_notes_ch')) {
                const v = JSON.parse(localStorage.getItem(k));
                if (v) { noteChars += v.length; noteChs++; }
            }
        }
        if (noteChars) archive.push({ icon: '📒', name: '学习笔记', value: noteChs + ' 章 · 共 ' + noteChars + ' 字' });
        // 扫码签到数据（服务器模式时读最近一份本地缓存）
        const live = toolsLS && Object.keys(localStorage).filter(k => k.startsWith('zhkc_live_')).length;
        if (live) archive.push({ icon: '📲', name: '扫码签到会话缓存', value: live + ' 个班级' });
    } catch (e) {}
    return archive;
}

// ============================================================
// 可视化：使用统计仪表盘
// ============================================================
function renderStatsDashboard() {
    const panel = document.getElementById('tool-stats');
    if (!panel || !panel.classList.contains('active')) return;
    window._statsVisible = true;

    const events = getAnalytics();
    const summary = statsModuleSummary(events);
    const daily = statsDaily(events, 14);

    // ---- 仪表卡片 ----
    const labEvents = events.filter(e => e.m.startsWith('实验')).length;
    const toolEvents = events.filter(e => !e.m.startsWith('实验') && e.m !== '网站').length;
    const daySet = new Set(events.map(e => new Date(e.t).toDateString()));
    const cards = [
        ['📊', '总使用记录', events.length + ' 条'],
        ['🧪', '实验操作', labEvents + ' 次'],
        ['🛠', '工具使用', toolEvents + ' 次'],
        ['📅', '活跃天数', daySet.size + ' 天']
    ];
    const cardsEl = document.getElementById('stCards');
    cardsEl.innerHTML = cards.map(c =>
        '<div class="stat-card"><div class="stat-icon">' + c[0] + '</div>'
        + '<div class="stat-num">' + c[2] + '</div><div class="stat-label">' + c[1] + '</div></div>'
    ).join('');

    // ---- 模块柱状图 ----
    drawStatsBars(document.getElementById('stBars'), summary.slice(0, 14));

    // ---- 14 天活跃折线 ----
    drawStatsLine(document.getElementById('stLine'), daily);

    // ---- 明细表 ----
    const tbl = document.getElementById('stTable');
    tbl.innerHTML = '<tr><th>模块</th><th>使用次数</th><th>最近使用</th></tr>'
        + summary.map(s => {
            const d = new Date(s.last);
            const t = d.toDateString() === new Date().toDateString()
                ? '今天 ' + d.toTimeString().slice(0, 5)
                : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.toTimeString().slice(0, 5);
            return '<tr><td>' + s.module + '</td><td>' + s.count + '</td><td>' + t + '</td></tr>';
        }).join('') || '<tr><td colspan="3" class="tool-hint">暂无数据</td></tr>';

    // ---- 最近动态 ----
    const feed = document.getElementById('stFeed');
    feed.innerHTML = events.slice(-18).reverse().map(ev => {
        const d = new Date(ev.t);
        return '<div class="feed-item"><span class="feed-time">'
            + d.toTimeString().slice(0, 8) + '</span><span class="feed-mod">' + ev.m
            + '</span><span class="feed-act">' + ev.a + '</span></div>';
    }).join('') || '<div class="tool-hint">暂无动态</div>';

    // ---- 学习档案 ----
    const arch = statsLearnArchive();
    document.getElementById('stArchive').innerHTML = arch.length
        ? arch.map(a => '<div class="archive-card"><span>' + a.icon + ' ' + a.name + '</span><b>' + a.value + '</b></div>').join('')
        : '<div class="tool-hint">暂无学习档案，去实验平台和课堂工具里转转吧</div>';
}

// 横向柱状图
function drawStatsBars(canvas, data) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!data.length) {
        ctx.fillStyle = 'rgba(148,163,184,0.5)';
        ctx.font = '13px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.fillText('暂无使用数据，去实验平台操作一下吧', W / 2, H / 2);
        return;
    }
    const max = Math.max(...data.map(d => d.count));
    const rowH = Math.min(26, (H - 10) / data.length);
    const labelW = 110, valueW = 44;
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#14b8a6', '#f43f5e'];
    data.forEach((d, i) => {
        const y = 5 + i * rowH;
        ctx.fillStyle = 'rgba(226,232,240,0.8)';
        ctx.font = '11.5px "Microsoft YaHei"';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(d.module.length > 9 ? d.module.slice(0, 9) : d.module, labelW - 8, y + rowH / 2);
        const bw = Math.max(3, (d.count / max) * (W - labelW - valueW));
        const grad = ctx.createLinearGradient(labelW, 0, labelW + bw, 0);
        grad.addColorStop(0, COLORS[i % COLORS.length]);
        grad.addColorStop(1, COLORS[(i + 3) % COLORS.length]);
        ctx.fillStyle = grad;
        // 圆角条
        const r = Math.min(6, bw / 2, rowH * 0.32);
        const bh = rowH * 0.62, by = y + (rowH - bh) / 2;
        ctx.beginPath();
        ctx.moveTo(labelW + r, by);
        ctx.arcTo(labelW + bw, by, labelW + bw, by + bh / 2, r);
        ctx.arcTo(labelW + bw, by + bh, labelW + r, by + bh, r);
        if (bw > r * 2) { ctx.arcTo(labelW, by + bh, labelW, by, r); ctx.arcTo(labelW, by, labelW + bw, by, r); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(148,163,184,0.9)';
        ctx.font = '11px Consolas';
        ctx.textAlign = 'left';
        ctx.fillText(d.count, labelW + bw + 8, y + rowH / 2);
    });
}

// 折线图（带面积渐变）
function drawStatsLine(canvas, data) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const padL = 34, padR = 14, padT = 20, padB = 26;
    const iw = W - padL - padR, ih = H - padT - padB;
    const max = Math.max(...data.map(d => d.count), 4);
    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
        const y = padT + ih * g / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.5)';
        ctx.font = '10px Consolas';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(max * (4 - g) / 4), padL - 6, y);
    }
    // 折线
    const X = i => padL + i / (data.length - 1) * iw;
    const Y = v => padT + ih - v / max * ih;
    const grad = ctx.createLinearGradient(0, padT, 0, padT + ih);
    grad.addColorStop(0, 'rgba(139,92,246,0.35)');
    grad.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.beginPath();
    data.forEach((d, i) => i === 0 ? ctx.moveTo(X(i), Y(d.count)) : ctx.lineTo(X(i), Y(d.count)));
    ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.lineTo(X(data.length - 1), padT + ih);
    ctx.lineTo(X(0), padT + ih);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    // 点与标签
    data.forEach((d, i) => {
        ctx.fillStyle = d.count ? '#c4b5fd' : 'rgba(148,163,184,0.4)';
        ctx.beginPath(); ctx.arc(X(i), Y(d.count), 3, 0, Math.PI * 2); ctx.fill();
        if (i % 2 === 0 || data.length <= 8) {
            ctx.fillStyle = 'rgba(148,163,184,0.6)';
            ctx.font = '10px "Microsoft YaHei"';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(d.label, X(i), padT + ih + 6);
        }
    });
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 12px "Microsoft YaHei"';
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('近 14 天使用活跃度', padL, padT - 6);
}

// ---------- 导出 / 清空 ----------
function exportAnalytics() {
    const data = {
        exportedAt: new Date().toISOString(),
        summary: statsModuleSummary(getAnalytics()),
        archive: statsLearnArchive(),
        events: getAnalytics()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '使用统计_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
    // Tab 切换联动（tools.js 的 initToolsTabs 处理切换，这里监听 stats 可见性）
    document.querySelectorAll('.tool-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tool !== 'stats') {
                window._statsVisible = false;
            } else {
                setTimeout(renderStatsDashboard, 60);
            }
        });
    });
    const exportBtn = document.getElementById('stExport');
    if (exportBtn) exportBtn.addEventListener('click', exportAnalytics);
    const clearBtn = document.getElementById('stClear');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (confirm('确定清空全部使用统计数据？（学习档案不受影响）')) {
            clearAnalytics();
            window.trackEvent('网站', '清空统计数据');
            renderStatsDashboard();
        }
    });
});
