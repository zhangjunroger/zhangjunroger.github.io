// ============================================================
// live.js —— 扫码签到 & 实时答题大屏
//   依赖：js/qrcode.min.js（已内置）；可配合 server.js 使用
//   无服务器时（file:// 直开）提供演示模式，一键模拟全班签到答题
//   词云为自研 Canvas 螺旋布局，无外部依赖
// ============================================================

// ============================================================
// 词云引擎：阿基米德螺旋碰撞布局
//   drawWordCloud(canvas, items, opts)
//   items: [{ text, weight, color }]  weight 越大字号越大
// ============================================================
function drawWordCloud(canvas, items, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!items || !items.length) {
        ctx.fillStyle = 'rgba(148,163,184,0.5)';
        ctx.font = '13px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opts.emptyText || '暂无数据', W / 2, H / 2);
        return;
    }
    const wMax = Math.max(...items.map(i => i.weight), 1);
    const wMin = Math.min(...items.map(i => i.weight), 0);
    const sizeMin = opts.sizeMin || 13, sizeMax = opts.sizeMax || 34;
    const fSize = it => {
        if (wMax === wMin) return (sizeMin + sizeMax) / 2;
        return sizeMin + (it.weight - wMin) / (wMax - wMin) * (sizeMax - sizeMin);
    };
    // 按权重降序放置
    const sorted = items.slice().sort((a, b) => b.weight - a.weight);
    // 占用网格（碰撞检测）
    const cell = 4;
    const gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
    const grid = new Uint8Array(gw * gh);
    const occupied = (x, y, w, h) => {
        const x0 = Math.max(0, (x - w / 2) / cell | 0), x1 = Math.min(gw - 1, (x + w / 2) / cell | 0);
        const y0 = Math.max(0, (y - h / 2) / cell | 0), y1 = Math.min(gh - 1, (y + h / 2) / cell | 0);
        for (let gy = y0; gy <= y1; gy++)
            for (let gx = x0; gx <= x1; gx++)
                if (grid[gy * gw + gx]) return true;
        return false;
    };
    const mark = (x, y, w, h) => {
        const x0 = Math.max(0, (x - w / 2) / cell | 0), x1 = Math.min(gw - 1, (x + w / 2) / cell | 0);
        const y0 = Math.max(0, (y - h / 2) / cell | 0), y1 = Math.min(gh - 1, (y + h / 2) / cell | 0);
        for (let gy = y0; gy <= y1; gy++)
            for (let gx = x0; gx <= x1; gx++)
                grid[gy * gw + gx] = 1;
    };
    const placed = [];
    for (const it of sorted) {
        const fs = fSize(it);
        ctx.font = '600 ' + fs + 'px "Microsoft YaHei", sans-serif';
        const tw = ctx.measureText(it.text).width;
        const th = fs * 1.15;
        // 螺旋放置
        let x = W / 2, y = H / 2, ang = Math.random() * Math.PI * 2, rad = 0, ok = false;
        for (let step = 0; step < 500; step++) {
            rad += 3.2;
            ang += 0.55;
            x = W / 2 + Math.cos(ang) * rad * 1.35;
            y = H / 2 + Math.sin(ang) * rad * 0.75;
            if (x - tw / 2 < 4 || x + tw / 2 > W - 4 || y - th / 2 < 4 || y + th / 2 > H - 4) continue;
            if (!occupied(x, y, tw, th)) { ok = true; break; }
        }
        if (!ok) continue;
        mark(x, y, tw, th);
        placed.push({ it, x, y, fs, tw, th });
    }
    for (const p of placed) {
        ctx.font = '600 ' + p.fs + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.it.color || '#a5b4fc';
        ctx.fillText(p.it.text, p.x, p.y);
    }
}

// ============================================================
// 扫码签到 & 实时答题 主模块
// ============================================================
function initLiveRoom() {
    const root = document.getElementById('tool-live');
    if (!root) return;

    const $ = id => document.getElementById(id);
    const clsInput  = $('lvClass');
    const statusEl  = $('lvStatus');
    const qrBox     = $('lvQRBox');
    const linkEl    = $('lvLink');
    const copyBtn   = $('lvCopyLink');
    const syncBtn   = $('lvSyncRoster');
    const resetBtn  = $('lvReset');
    const wallEl    = $('lvSignedWall');
    const signedCountEl = $('lvSignedCount');
    const absentCv  = $('lvAbsentCloud');
    const pushSel   = $('lvPushChapter');
    const pushBtn   = $('lvPush');
    const closeQBtn = $('lvCloseQ');
    const curQEl    = $('lvCurQ');
    const ansCv     = $('lvAnswerCloud');
    const ansBarsEl = $('lvAnswerBars');
    const ansStatEl = $('lvAnswerStats');
    const demoBtn   = $('lvDemo');
    const signedCloudCv = $('lvSignedCloud');

    let state = { roster: [], signed: {}, current: null, answers: {} };
    let pollId = null;
    let online = false;

    const PALETTE = ['#a5b4fc', '#f9a8d4', '#86efac', '#fcd34d', '#93c5fd', '#c4b5fd', '#fda4af'];

    function clsName() { return clsInput.value.trim() || '默认班级'; }

    function saveLocal() {
        toolsLS('live_' + clsName(), { state, at: Date.now() });
    }

    // ---------- 服务器探测 & 轮询 ----------
    async function probe() {
        // file:// 直开时无服务器可探测，直接进入演示模式（避免 fetch CORS 报错）
        if (!location.protocol.startsWith('http')) {
            online = false;
            statusEl.innerHTML = '<span style="color:#fbbf24">● 演示模式</span>　未检测到服务器 —— 运行 <code style="color:#c4b5fd">node server.js</code> 后刷新即可开启真实扫码';
            linkEl.textContent = '（演示模式）';
            qrBox.innerHTML = '<div style="color:#64748b;font-size:13px;padding:30px 10px;text-align:center">启动 server.js 后<br>此处显示签到二维码</div>';
            demoBtn.style.display = '';
            return;
        }
        try {
            const r = await fetch('/api/info', { cache: 'no-store' });
            const info = await r.json();
            online = true;
            statusEl.innerHTML = '<span style="color:#4ade80">● 已连接本地服务器</span>　扫描右侧二维码签到';
            // 用第一个局域网 IP 生成二维码
            const ip = (info.ips && info.ips[0]) || location.hostname;
            const url = 'http://' + ip + ':' + info.port + '/signin.html?class=' + encodeURIComponent(clsName());
            linkEl.textContent = url;
            renderQR(url);
            demoBtn.style.display = 'none';
        } catch (e) {
            online = false;
            statusEl.innerHTML = '<span style="color:#fbbf24">● 演示模式</span>　未检测到服务器 —— 运行 <code style="color:#c4b5fd">node server.js</code> 后刷新即可开启真实扫码';
            linkEl.textContent = '（演示模式）';
            qrBox.innerHTML = '<div style="color:#64748b;font-size:13px;padding:30px 10px;text-align:center">启动 server.js 后<br>此处显示签到二维码</div>';
            demoBtn.style.display = '';
        }
    }

    function renderQR(text) {
        qrBox.innerHTML = '';
        try {
            const qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
            const svg = qrBox.querySelector('svg');
            if (svg) { svg.style.width = '190px'; svg.style.height = '190px'; svg.style.background = '#fff'; svg.style.borderRadius = '10px'; svg.style.padding = '8px'; }
        } catch (e) {
            qrBox.textContent = '二维码生成失败';
        }
    }

    async function poll() {
        if (!online) return;
        try {
            const r = await fetch('/api/state?class=' + encodeURIComponent(clsName()), { cache: 'no-store' });
            state = await r.json();
            renderAll();
        } catch (e) { /* 服务器短暂不可达 */ }
    }

    // ---------- 渲染 ----------
    function renderAll() {
        const signedNames = Object.keys(state.signed);
        const roster = state.roster || [];
        const absent = roster.length ? roster.filter(n => !state.signed[n]) : [];
        signedCountEl.textContent = signedNames.length + ' / ' + (roster.length || signedNames.length || 0)
            + (roster.length ? ' （名单 ' + roster.length + ' 人）' : ' （未同步名单）');

        // 已签到墙
        wallEl.innerHTML = '';
        if (!signedNames.length) {
            wallEl.innerHTML = '<div class="tool-hint">等待学生扫码签到…</div>';
        } else {
            signedNames.forEach((n, i) => {
                const chip = document.createElement('span');
                chip.className = 'lv-chip';
                chip.style.animationDelay = (i % 8) * 0.05 + 's';
                chip.textContent = n + (state.signed[n].guest ? ' ⚲' : '');
                chip.title = '签到时间 ' + state.signed[n].time + (state.signed[n].guest ? ' · 名单外嘉宾' : '');
                wallEl.appendChild(chip);
            });
        }

        // 词云①：未签到名单（红系）
        drawWordCloud(absentCv,
            absent.map((n, i) => ({ text: n, weight: 1, color: i % 2 ? '#fda4af' : '#f87171' })),
            { emptyText: '🎉 全员到齐！' });

        // 词云②：已签到名单（等权，展示规模）
        drawWordCloud(signedCloudCv,
            signedNames.map(n => ({ text: n, weight: 1, color: PALETTE[Math.floor(Math.random() * PALETTE.length)] })),
            { emptyText: '暂无签到', sizeMax: 26 });

        // 答题统计
        renderAnswers();
        saveLocal();
    }

    function renderAnswers() {
        const cur = state.current;
        if (!cur) {
            curQEl.textContent = '尚未推送题目。选择章节后点击「推送题目到学生手机」。';
            ansBarsEl.innerHTML = '';
            ansStatEl.textContent = '';
            drawWordCloud(ansCv, [], { emptyText: '推送题目后显示答题词云' });
            return;
        }
        curQEl.textContent = cur.text;
        const votes = (state.answers && state.answers[cur.id]) || {};
        const names = Object.keys(votes);
        let html = '';
        if (cur.options) {
            const counts = cur.options.map((_, i) => names.filter(n => votes[n].choice === i).length);
            const total = names.length || 1;
            cur.options.forEach((opt, i) => {
                const pct = Math.round(counts[i] / total * 100);
                const isAns = i === cur.answer;
                html += '<div class="lv-bar-row">'
                    + '<span class="lv-bar-label' + (isAns ? ' right' : '') + '">' + String.fromCharCode(65 + i) + '. ' + opt.slice(0, 14) + (isAns ? ' ✓' : '') + '</span>'
                    + '<div class="lv-bar-track"><div class="lv-bar-fill" style="width:' + pct + '%"></div></div>'
                    + '<span class="lv-bar-num">' + counts[i] + '人 ' + pct + '%</span></div>';
            });
            ansBarsEl.innerHTML = html;
            const correctN = cur.answer >= 0 ? names.filter(n => votes[n].correct).length : 0;
            ansStatEl.textContent = '已答 ' + names.length + ' 人'
                + (cur.answer >= 0 ? ' · 正确 ' + correctN + ' 人（' + Math.round(correctN / (names.length || 1) * 100) + '% 正确率）' : '');
            // 词云：选项字母按票数加权
            drawWordCloud(ansCv,
                cur.options.map((opt, i) => ({
                    text: String.fromCharCode(65 + i) + ' ' + opt.slice(0, 6),
                    weight: counts[i],
                    color: i === cur.answer ? '#4ade80' : (counts[i] === Math.max(...counts) ? '#f87171' : '#94a3b8')
                })).filter(x => x.weight > 0),
                { emptyText: '等待学生作答…', sizeMin: 14, sizeMax: 40 });
        } else {
            ansBarsEl.innerHTML = '';
            ansStatEl.textContent = '已答 ' + names.length + ' 人';
            drawWordCloud(ansCv, names.map(n => ({ text: n, weight: 1, color: '#93c5fd' })), { emptyText: '等待学生作答…' });
        }
    }

    // ---------- 操作 ----------
    syncBtn.addEventListener('click', async () => {
        if (!online) { syncBtn.textContent = '演示模式无需同步'; setTimeout(() => syncBtn.textContent = '② 同步点名名单到服务器', 1500); return; }
        const roster = toolsGetRoster();
        const r = await fetch('/api/roster', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class: clsName(), roster })
        });
        const res = await r.json();
        syncBtn.textContent = '✓ 已同步 ' + res.count + ' 人';
        setTimeout(() => syncBtn.textContent = '② 同步点名名单到服务器', 2000);
        poll();
    });

    pushBtn.addEventListener('click', async () => {
        const ch = parseInt(pushSel.value);
        const pool = ch === 0 ? QUIZ_BANK : QUIZ_BANK.filter(x => x.ch === ch);
        const q = pool[Math.floor(Math.random() * pool.length)];
        if (!q) return;
        if (!online) {
            // 演示模式：本地直接构造
            state.current = { id: 'demo' + Date.now(), text: q.q, options: q.o, answer: q.a, ch: q.ch };
            state.answers[state.current.id] = {};
            renderAll();
            pushBtn.textContent = '✓ 已推送（演示）';
            setTimeout(() => pushBtn.textContent = '③ 推送题目到学生手机', 1800);
            return;
        }
        await fetch('/api/push', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class: clsName(), text: q.q, options: q.o, answer: q.a, ch: q.ch })
        });
        pushBtn.textContent = '✓ 已推送';
        setTimeout(() => pushBtn.textContent = '③ 推送题目到学生手机', 1800);
        poll();
    });

    closeQBtn.addEventListener('click', async () => {
        if (!online) { state.current = null; renderAll(); return; }
        await fetch('/api/closeQuestion', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class: clsName() })
        });
        poll();
    });

    resetBtn.addEventListener('click', async () => {
        if (!confirm('确定清空本班级的签到与答题记录？')) return;
        if (!online) { state.signed = {}; state.current = null; state.answers = {}; renderAll(); return; }
        await fetch('/api/reset', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class: clsName() })
        });
        poll();
    });

    copyBtn.addEventListener('click', () => {
        const t = linkEl.textContent;
        if (t.startsWith('http')) {
            navigator.clipboard && navigator.clipboard.writeText(t);
            copyBtn.textContent = '✓ 已复制';
            setTimeout(() => copyBtn.textContent = '复制链接', 1500);
        }
    });

    clsInput.addEventListener('change', () => { probe(); poll(); });

    // ---------- 演示模拟 ----------
    demoBtn.addEventListener('click', () => {
        const roster = toolsGetRoster();
        if (!roster.length) { statusEl.innerHTML = '<span style="color:#f87171">请先在「智能点名」载入名单</span>'; return; }
        const arriveN = Math.floor(roster.length * (0.6 + Math.random() * 0.3));
        const shuffled = toolsShuffle(roster);
        state.roster = roster;
        state.signed = {};
        shuffled.slice(0, arriveN).forEach((n, i) => {
            state.signed[n] = { time: new Date(Date.now() - i * 3000).toTimeString().slice(0, 8), guest: false };
        });
        // 模拟推送一题与作答
        const q = QUIZ_BANK[Math.floor(Math.random() * QUIZ_BANK.length)];
        state.current = { id: 'demo' + Date.now(), text: q.q, options: q.o, answer: q.a, ch: q.ch };
        state.answers[state.current.id] = {};
        state.signed && Object.keys(state.signed).forEach(n => {
            if (Math.random() < 0.85) {
                let c = Math.floor(Math.random() * q.o.length);
                if (Math.random() < 0.6) c = q.a;
                state.answers[state.current.id][n] = {
                    choice: c, choiceText: q.o[c],
                    correct: c === q.a, time: ''
                };
            }
        });
        renderAll();
    });

    // ---------- 启动 ----------
    probe();
    renderAll();
    clearInterval(pollId);
    pollId = setInterval(poll, 2000);
}

// ============================================================
// Initialize（追加到 tools.js 已有的 DOMContentLoaded 之后也可独立执行）
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiveRoom);
} else {
    initLiveRoom();
}
