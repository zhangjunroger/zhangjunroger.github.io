// ============================================================
// admin.js —— 智慧课程管理后台
//   登录鉴权 → 侧栏路由 → 各模块（总览/学情/班级/内容/资源/题库/
//   账号/导出/设置），ECharts 可视化，CSV 与 PNG 导出
// ============================================================
'use strict';

/* ---------------- 基础工具 ---------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let ME = null;
const charts = {};          // name → echarts 实例（供 PNG 导出）
let classListCache = [];    // [{name, roster_count...}]

// 请求统一交给 js/pb.js —— 它把旧 /api/* 翻译成 PocketBase 集合调用，
// 返回结构与旧服务端逐字段一致，管理端这边的解析代码一行不用改。
// 这里只保留管理端特有的两件事：报错弹提示、会话失效时刷新回到登录态。
async function api(path, opts = {}) {
    const j = await window.PB.api(path, opts);
    if (j._status === 401 || j._status === 403) {
        if (j && j.msg) toast(j.msg, true);
        if (j._status === 401 && ME) { location.reload(); }
    }
    return j;
}

function toast(msg, isErr) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('error', !!isErr);
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('show'), 2600);
}

function fmtTime(s) {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d)) return s;
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function chart(name, domId, option) {
    const dom = $(domId);
    if (!dom) return null;
    let c = charts[name];
    if (!c) { c = echarts.init(dom, null, { renderer: 'canvas' }); charts[name] = c; }
    else if (c.getDom() !== dom) { c.dispose(); c = echarts.init(dom); charts[name] = c; }
    window.addEventListener('resize', () => c.resize());
    c.setOption(option, true);
    return c;
}

const AXIS = {
    axisLine: { lineStyle: { color: 'rgba(148,163,184,.25)' } },
    axisLabel: { color: '#64748b', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(148,163,184,.12)' } }
};
const PALETTE = ['#38bdf8', '#2563eb', '#818cf8', '#a78bfa', '#2dd4bf', '#34d399', '#fbbf24', '#f472b6'];

/* ---------------- 弹窗 ---------------- */
function modal(html) {
    $('#modalBox').innerHTML = html;
    $('#modalMask').classList.add('show');
}
function closeModal() { $('#modalMask').classList.remove('show'); $('#modalBox').classList.remove('wide'); }
window.addEventListener('click', e => {
    if (e.target === $('#modalMask')) closeModal();
    if (e.target.dataset && e.target.dataset.close !== undefined) closeModal();
});

/* ---------------- 登录 / 会话 ---------------- */
async function boot() {
    const me = await api('/api/auth/me');
    if (me.ok && me.user) {
        ME = me.user;
        showMain();
    } else {
        $('#loginView').style.display = 'flex';
        $('#lgUser').focus();
    }
}
$('#lgBtn').addEventListener('click', doLogin);
$('#lgPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
$('#lgUser').addEventListener('keydown', e => { if (e.key === 'Enter') $('#lgPass').focus(); });

async function doLogin() {
    const username = $('#lgUser').value.trim();
    const password = $('#lgPass').value;
    if (!username || !password) { $('#lgMsg').textContent = '请输入账号与密码'; return; }
    $('#lgBtn').disabled = true;
    const r = await api('/api/auth/login', { method: 'POST', body: { username, password } });
    $('#lgBtn').disabled = false;
    if (r.ok) {
        ME = r.user;
        $('#lgMsg').textContent = '';
        try { localStorage.setItem('zhkc_identity', JSON.stringify({ name: ME.displayName, className: ME.className })); } catch (e) {}
        showMain();
    } else {
        $('#lgMsg').textContent = r.msg || '登录失败';
    }
}

function showMain() {
    $('#loginView').style.display = 'none';
    $('#mainView').style.display = 'flex';
    const roleTag = ME.role === 'admin' ? '<span class="mp-tag cyan">管理员</span>'
        : ME.role === 'teacher' ? '<span class="mp-tag violet">教师</span>'
        : '<span class="mp-tag green">学生</span>';
    $('#meInfo').innerHTML = `${roleTag} <b style="color:var(--tx)">${esc(ME.displayName)}</b><br><span style="font-size:11px">${esc(ME.username)}</span>`;
    if (ME.role !== 'admin') {
        // 教师隐藏敏感页
        $$('.mp-item').forEach(it => { if (it.dataset.page === 'users') it.style.display = 'none'; });
    }
    loadClasses().then(() => { renderOverview(); });
}

$('#logoutBtn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    location.reload();
});

/* ---------------- 侧栏路由 ---------------- */
$$('.mp-item').forEach(it => it.addEventListener('click', () => go(it.dataset.page)));
function go(page) {
    $$('.mp-item').forEach(i => i.classList.toggle('active', i.dataset.page === page));
    $$('.mp-page').forEach(p => p.classList.toggle('active', p.dataset.page === page));
    ({
        overview: renderOverview,
        analysis: renderAnalysis,
        classes: renderClasses,
        chapters: renderChapters,
        resources: renderResources,
        bank: renderBank,
        users: renderUsers,
        export: renderExport,
        settings: renderSettings
    })[page]?.();
    if (window.innerWidth <= 960) $('#mpSide').classList.remove('open');
}

/* ---------------- 班级选择器通用 ---------------- */
async function loadClasses() {
    const r = await api('/api/admin/classes');
    if (!r.ok) return [];
    classListCache = r.classes;
    const options = r.classes.map(c => `<option value="${esc(c.name)}">${esc(c.name)}（${c.roster_count}人）</option>`).join('');
    const opts0 = '<option value="">全部班级</option>' + options;
    for (const id of ['#anClass', '#usClass', '#expClass', '#lvClass']) {
        const el = $(id);
        if (!el) continue;
        const cur = el.value;
        el.innerHTML = (id === '#anClass' || id === '#lvClass' ? '<option value="">请选择班级</option>' : opts0) + options;
        if (cur) el.value = cur;
    }
    return r.classes;
}

/* ================= 总览 ================= */
async function renderOverview() {
    const r = await api('/api/admin/overview');
    if (!r.ok) return;
    const c = r.counts;
    $('#ovCourseLine').textContent = `${r.course.name || ''} · ${r.course.semester || ''} · ${r.course.school || ''}`;
    const kpis = [
        ['今日签到人次', r.today.signins, `今日 ${r.today.students} 人`],
        ['注册账号', c.users, `学生 ${c.students} · 班级 ${c.classes}`],
        ['名册学生', c.roster, `互动班级 ${c.classes}`],
        ['课堂累计答题', c.answers, r.accuracy !== null && r.accuracy !== undefined ? `总正确率 ${r.accuracy}%` : '暂无数据'],
        ['学习行为记录', c.events, '埋点累计'],
        ['章节内容', c.chapters, `资源 ${c.resources} 条`],
        ['课堂题目', c.questions, `题库 ${c.bank} 题`]
    ];
    $('#ovKpis').innerHTML = kpis.map(k => `
        <div class="mp-card kpi">
            <div class="k-label">${k[0]}</div>
            <div class="k-num">${k[1]}</div>
            <div class="k-sub">${esc(k[2])}</div>
        </div>`).join('');

    const [sign, mods] = await Promise.all([api('/api/admin/analysis/signin-trend?days=30'), api('/api/admin/analysis/modules?days=14')]);

    chart('signTrend', '#ovSignChart', {
        color: PALETTE,
        tooltip: { trigger: 'axis' },
        legend: { textStyle: { color: '#64748b' }, top: 0 },
        grid: { left: 40, right: 20, top: 34, bottom: 26 },
        xAxis: { type: 'category', data: sign.days, ...AXIS },
        yAxis: { type: 'value', ...AXIS },
        series: [
            { name: '签到人次', type: 'line', smooth: true, data: sign.counts, areaStyle: { opacity: .18 }, symbolSize: 5 },
            { name: '签到人数', type: 'line', smooth: true, data: sign.students, areaStyle: { opacity: .1 }, symbolSize: 5 }
        ]
    });

    chart('modDist', '#ovModChart', {
        color: PALETTE,
        tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 次（{d}%）' },
        legend: { type: 'scroll', textStyle: { color: '#64748b' }, bottom: 0 },
        series: [{
            type: 'pie', radius: ['42%', '68%'], center: ['50%', '44%'],
            data: mods.modules.slice(0, 8).map(m => ({ name: m.module, value: m.n })),
            label: { color: '#64748b', fontSize: 11 },
            itemStyle: { borderColor: '#0d1628', borderWidth: 2 }
        }]
    });

    chart('actTrend', '#ovTrendChart', {
        color: PALETTE,
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 30, bottom: 26 },
        xAxis: { type: 'category', data: mods.trend.map(t => t.day), ...AXIS },
        yAxis: { type: 'value', ...AXIS },
        series: [{ name: '行为次数', type: 'bar', data: mods.trend.map(t => t.n), barMaxWidth: 26, itemStyle: { borderRadius: [5, 5, 0, 0] } }]
    });

    $('#ovFeed').innerHTML = r.recent.length ? r.recent.map(e => `
        <div style="display:flex;justify-content:space-between;gap:8px;padding:7px 2px;border-bottom:1px solid var(--line);font-size:12.5px;">
            <span style="color:var(--tx-dim)"><span class="mp-tag cyan" style="margin-right:6px;">${esc(e.module)}</span>${esc(e.action)}${e.name ? ' · <b style="color:var(--tx)">' + esc(e.name) + '</b>' : ''}</span>
            <span style="color:var(--tx-faint);white-space:nowrap;">${new Date(e.ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>`).join('') : '<div class="empty-tip">暂无动态，等待学生学习产生数据…</div>';
}
$('#ovRefresh').addEventListener('click', renderOverview);

/* ================= 学情分析 ================= */
let anReport = [];
async function renderAnalysis() {
    const cls = $('#anClass').value;
    if (!cls) { $('#anTable').innerHTML = ''; $('#anTopChart')?.clear?.(); return; }
    const [rep, quiz] = await Promise.all([
        api('/api/admin/analysis/students?class=' + encodeURIComponent(cls)),
        api('/api/admin/analysis/quiz?class=' + encodeURIComponent(cls))
    ]);
    if (!rep.ok) return;
    anReport = rep.report;
    drawReportCharts(rep.report);
    renderAnTable(rep.report);
    drawQuizChart(quiz.questions || []);
}

function drawReportCharts(rep) {
    const top = rep.slice(0, 12);
    chart('anTop', '#anTopChart', {
        color: PALETTE,
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            formatter: ps => {
                const name = ps[0].name;
                const s = rep.find(x => x.name === name);
                return `<b>${esc(name)}</b><br>签到 ${s.signDays} 天 · 答题 ${s.totalAnswers} · 正确率 ${s.accuracy ?? '—'}%`;
            }
        },
        legend: { textStyle: { color: '#64748b' }, top: 0 },
        grid: { left: 70, right: 50, top: 30, bottom: 24 },
        yAxis: { type: 'category', data: top.map(t => t.name).reverse(), ...AXIS, inverse: false },
        xAxis: { type: 'value', ...AXIS },
        series: [
            { name: '签到天数', type: 'bar', stack: 'a', data: top.map(t => t.signDays).reverse(), itemStyle: { borderRadius: [0, 0, 0, 0] } },
            { name: '答题数', type: 'bar', stack: 'a', data: top.map(t => t.totalAnswers).reverse() }
        ]
    });

    const buckets = { '90-100': 0, '70-89': 0, '50-69': 0, '0-49': 0, '未答题': 0 };
    for (const s of rep) {
        if (s.accuracy === null) buckets['未答题']++;
        else if (s.accuracy >= 90) buckets['90-100']++;
        else if (s.accuracy >= 70) buckets['70-89']++;
        else if (s.accuracy >= 50) buckets['50-69']++;
        else buckets['0-49']++;
    }
    chart('anDist', '#anDistChart', {
        color: ['#34d399', '#38bdf8', '#fbbf24', '#f87171', '#475569'],
        tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 人（{d}%）' },
        series: [{
            type: 'pie', radius: ['45%', '72%'], center: ['50%', '50%'],
            data: Object.entries(buckets).map(([name, value]) => ({ name, value })),
            label: { color: '#64748b', formatter: '{b}\n{c} 人' },
            itemStyle: { borderColor: '#0d1628', borderWidth: 2 }
        }]
    });
}

function renderAnTable(rep) {
    const rows = rep.map((s, i) => `
        <tr data-name="${esc(s.name)}" style="cursor:pointer;">
            <td style="color:var(--tx-faint)">${i + 1}</td>
            <td><b style="color:var(--tx-strong)">${esc(s.name)}</b>${s.inRoster ? '' : ' <span class="mp-tag amber">非名册</span>'}</td>
            <td>${esc(s.sid || '—')}</td>
            <td>${s.signDays} 天</td>
            <td>${s.totalAnswers}</td>
            <td>${s.rightAnswers}</td>
            <td>${s.accuracy === null ? '—' : `<span class="mp-tag ${s.accuracy >= 80 ? 'green' : s.accuracy >= 60 ? 'cyan' : 'red'}">${s.accuracy}%</span>`}</td>
            <td>${s.activity}</td>
            <td style="color:var(--tx-faint)">${fmtTime(s.lastSign)}</td>
        </tr>`).join('');
    $('#anTable').innerHTML = `
        <thead><tr><th>#</th><th>姓名</th><th>学号</th><th>签到</th><th>答题</th><th>答对</th><th>正确率</th><th>活跃</th><th>最近签到</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="9" class="empty-tip">该班级暂无学情数据</td></tr>'}</tbody>`;
    $$('#anTable tbody tr[data-name]').forEach(tr =>
        tr.addEventListener('click', () => showStudentDetail(tr.dataset.name)));
}

async function showStudentDetail(name) {
    const cls = $('#anClass').value;
    const r = await api(`/api/admin/analysis/student-detail?name=${encodeURIComponent(name)}&class=${encodeURIComponent(cls)}`);
    if (!r.ok) return;
    const card = $('#anDetailCard');
    card.style.display = 'block';
    $('#anDetailTitle').textContent = '个人画像 · ' + name;
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    chart('stChapter', '#anChapterChart', {
        color: PALETTE,
        tooltip: { trigger: 'axis' },
        legend: { textStyle: { color: '#64748b' }, top: 0 },
        grid: { left: 40, right: 16, top: 30, bottom: 26 },
        xAxis: { type: 'category', data: r.byChapter.map(x => '第' + (x.chapter || '?') + '章'), ...AXIS },
        yAxis: { type: 'value', max: v => Math.max(4, v), ...AXIS },
        series: [
            { name: '作答', type: 'bar', data: r.byChapter.map(x => x.total), barMaxWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] } },
            { name: '答对', type: 'bar', data: r.byChapter.map(x => x.ok), barMaxWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] } }
        ]
    });

    chart('stEv', '#anEvChart', {
        color: PALETTE,
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 16, top: 20, bottom: 26 },
        xAxis: { type: 'category', data: r.evTrend.map(x => x.day), ...AXIS },
        yAxis: { type: 'value', ...AXIS },
        series: [{ type: 'line', smooth: true, data: r.evTrend.map(x => x.n), areaStyle: { opacity: .16 }, symbolSize: 5 }]
    });

    $('#anSignList').innerHTML = r.signs.length
        ? r.signs.slice(0, 12).map(s => `<div style="padding:5px 0;border-bottom:1px solid var(--line);font-size:12.5px;color:var(--tx-dim);display:flex;justify-content:space-between;"><span>${esc(s.day)}</span><span style="color:var(--tx-faint)">${s.signed_at.slice(11, 19)}</span></div>`).join('')
        : '<div class="empty-tip">暂无签到记录</div>';

    $('#anAnsList').innerHTML = r.answers.length
        ? r.answers.slice(0, 8).map(a => `
            <div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:12.5px;">
                <div style="display:flex;justify-content:space-between;gap:6px;">
                    <span style="color:var(--tx-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc((a.text || a.qid).slice(0, 26))}</span>
                    <span class="mp-tag ${a.correct === null ? '' : a.correct ? 'green' : 'red'}">${a.correct === null ? '未判' : a.correct ? '✓' : '✗'}</span>
                </div>
                <div style="color:var(--tx-faint);font-size:11.5px;margin-top:2px;">作答：${esc(a.choice_text || '—')} · ${fmtTime(a.answered_at)}</div>
            </div>`).join('')
        : '<div class="empty-tip">暂无作答记录</div>';
}

function drawQuizChart(questions) {
    const list = questions.filter(q => q.total > 0).slice(0, 25);
    if (!list.length) { $('#anQuizChart').innerHTML = '<div class="empty-tip">暂无已结束的课堂题目</div>'; return; }
    $('#anQuizChart').innerHTML = '';
    chart('anQuiz', '#anQuizChart', {
        color: PALETTE,
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            formatter: ps => {
                const q = list[ps[0].dataIndex];
                return `<b>${esc(q.text.slice(0, 40))}</b><br>章节：第${q.chapter || '?'}章<br>作答 ${q.total} · 答对 ${q.right_cnt} · 正确率 ${q.accuracy}%`;
            }
        },
        grid: { left: 60, right: 20, top: 30, bottom: 60 },
        xAxis: { type: 'category', data: list.map((q, i) => 'Q' + (i + 1)), ...AXIS, axisLabel: { rotate: 0, color: '#64748b' } },
        yAxis: { type: 'value', max: 100, ...AXIS },
        visualMap: {
            show: false, min: 0, max: 100,
            inRange: { color: ['#f87171', '#fbbf24', '#34d399'] }
        },
        series: [{
            type: 'bar', data: list.map(q => q.accuracy),
            barMaxWidth: 22, itemStyle: { borderRadius: [5, 5, 0, 0] }
        }]
    });
}
$('#anRefresh').addEventListener('click', renderAnalysis);
$('#anClass').addEventListener('change', renderAnalysis);

/* ================= 班级与名册 ================= */
async function renderClasses() {
    await loadClasses();
    $('#clsCards').innerHTML = classListCache.map(c => `
        <div class="mp-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:16px;font-weight:700;color:var(--tx-strong);">${esc(c.name)}</div>
                    <div style="font-size:12px;color:var(--tx-faint);margin-top:4px;">指导教师：${esc(c.advisor || '—')}</div>
                </div>
                <span class="mp-tag cyan">${c.roster_count} 人</span>
            </div>
            <div style="font-size:12px;color:var(--tx-faint);margin:10px 0;">学生账号：${c.account_count} · 建班于 ${fmtTime(c.created_at).slice(0, 10)}</div>
            <div class="f-row" style="margin:0;">
                <button class="mp-btn sm" data-roster="${esc(c.name)}">✏️ 名册</button>
                <button class="mp-btn sm" data-edit-cls="${c.id}" data-name="${esc(c.name)}" data-advisor="${esc(c.advisor)}">改名</button>
                <button class="mp-btn sm danger" data-del-cls="${c.id}" data-name="${esc(c.name)}">删除</button>
            </div>
        </div>`).join('') || '<div class="empty-tip">还没有班级，点击右上角新建</div>';

    $$('#clsCards [data-roster]').forEach(b => b.addEventListener('click', () => openRoster(b.dataset.roster)));
    $$('#clsCards [data-edit-cls]').forEach(b => b.addEventListener('click', () => {
        modal(`
            <h3>编辑班级</h3>
            <label class="f-label">班级名称</label><input id="mClsName" class="mp-input" style="width:100%" value="${esc(b.dataset.name)}">
            <label class="f-label">指导教师</label><input id="mClsAdv" class="mp-input" style="width:100%" value="${esc(b.dataset.advisor)}">
            <div class="acts"><button class="mp-btn" data-close>取消</button><button class="mp-btn primary" id="mClsSave">保存</button></div>`);
        $('#mClsSave').addEventListener('click', async () => {
            const r = await api('/api/admin/classes/' + b.dataset.editCls, { method: 'PUT', body: { name: $('#mClsName').value.trim(), advisor: $('#mClsAdv').value.trim() } });
            if (r.ok) { toast('已保存'); closeModal(); renderClasses(); }
        });
    }));
    $$('#clsCards [data-del-cls]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm(`确定删除班级「${b.dataset.name}」？名册将一并删除（签到/答题历史保留）。`)) return;
        const r = await api('/api/admin/classes/' + b.dataset.delCls, { method: 'DELETE' });
        if (r.ok) { toast('已删除'); renderClasses(); }
    }));

    renderLivePanel();
}

$('#clsAddBtn').addEventListener('click', () => {
    modal(`
        <h3>新建班级</h3>
        <label class="f-label">班级名称</label><input id="mClsName" class="mp-input" style="width:100%" placeholder="如：智能2401">
        <label class="f-label">指导教师</label><input id="mClsAdv" class="mp-input" style="width:100%">
        <div class="acts"><button class="mp-btn" data-close>取消</button><button class="mp-btn primary" id="mClsSave">创建</button></div>`);
    $('#mClsSave').addEventListener('click', async () => {
        const name = $('#mClsName').value.trim();
        if (!name) return toast('请填写班级名称', true);
        const r = await api('/api/admin/classes', { method: 'POST', body: { name, advisor: $('#mClsAdv').value.trim() } });
        if (r.ok) { toast('已创建'); closeModal(); renderClasses(); }
    });
});

async function openRoster(clsName) {
    $('#rosterCard').hidden = false;
    $('#rosterCard').dataset.cls = clsName;
    $('#rosterClassName').textContent = clsName;
    const r = await api('/api/admin/roster?class=' + encodeURIComponent(clsName));
    if (r.ok) {
        $('#rosterText').value = r.roster.map(s => s.sid ? `${s.name},${s.sid}` : s.name).join('\n');
    }
    $('#rosterCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$('#rosterReload').addEventListener('click', () => {
    const cls = $('#rosterCard').dataset.cls;
    if (cls) openRoster(cls);
});
$('#rosterSave').addEventListener('click', async () => {
    const cls = $('#rosterCard').dataset.cls;
    if (!cls) return;
    const students = $('#rosterText').value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
        const m = line.match(/^(.+?)[,，\s]+(\S+)$/);
        return m ? { name: m[1].trim(), sid: m[2].trim() } : { name: line };
    });
    const r = await api('/api/admin/roster', { method: 'POST', body: { className: cls, students } });
    if (r.ok) { toast(`名册已保存（${students.length} 人）`); renderClasses(); }
});
$('#rosterGenAccounts').addEventListener('click', async () => {
    const cls = $('#rosterCard').dataset.cls;
    if (!cls) return;
    if (!confirm(`为班级「${cls}」名册中每位学生生成账号？\n用户名=学号（无学号用姓名），初始密码=学号后 8 位（学号不足 8 位前面补 0；学号里没有数字时统一用 zhkc1234）。已有账号自动跳过。`)) return;
    const r = await api('/api/admin/users/gen-students', { method: 'POST', body: { className: cls } });
    if (r.ok) toast(`已生成 ${r.created} 个账号，跳过 ${r.skipped} 个`);
});

/* --- 课堂实况 --- */
async function renderLivePanel() {
    const cls = $('#lvClass').value || classListCache[0]?.name;
    if (cls) $('#lvClass').value = cls;
    if (!cls) { $('#lvInfo').innerHTML = '<div class="empty-tip">请先创建班级</div>'; return; }
    const st = await api('/api/state?class=' + encodeURIComponent(cls));
    if (!st.ok) return;
    const rosterN = st.roster.length || classListCache.find(c => c.name === cls)?.roster_count || 0;
    const signedN = Object.keys(st.signed).length;
    const guestN = Object.values(st.signed).filter(s => s.guest).length;
    const cur = st.current;
    const ansN = cur ? Object.keys(st.answers[cur.id] || {}).length : 0;
    $('#lvInfo').innerHTML = `
        <div class="mp-grid cols-4" style="margin-top:10px;">
            <div class="mp-card kpi"><div class="k-label">今日已签</div><div class="k-num">${signedN}</div><div class="k-sub">名册 ${rosterN} 人 · 访客 ${guestN}</div></div>
            <div class="mp-card kpi"><div class="k-label">进行中题目</div><div class="k-num" style="font-size:20px;">${cur ? '进行中' : '无'}</div><div class="k-sub">${cur ? esc(cur.text.slice(0, 18)) + ` · 已收 ${ansN} 份` : '大屏空闲'}</div></div>
            <div class="mp-card kpi"><div class="k-label">本场已结束题目</div><div class="k-num">${st.history.length}</div><div class="k-sub">清课后归档</div></div>
            <div class="mp-card kpi"><div class="k-label">操作</div>
                <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                    <a class="mp-btn sm" href="index.html#tools" target="_blank">打开大屏</a>
                    <a class="mp-btn sm" href="signin.html?class=${encodeURIComponent(cls)}" target="_blank">签到页</a>
                </div>
            </div>
        </div>`;
}
$('#lvRefresh').addEventListener('click', renderLivePanel);
$('#lvClass').addEventListener('change', renderLivePanel);
$('#lvReset').addEventListener('click', async () => {
    const cls = $('#lvClass').value;
    if (!cls) return;
    if (!confirm(`确认清空「${cls}」当前课堂场次？（本场答题将归档为历史）`)) return;
    const r = await api('/api/reset', { method: 'POST', body: { class: cls } });
    if (r.ok) { toast('已清课'); renderLivePanel(); }
});

/* ================= 课程内容 ================= */
let chapterCache = [];
async function renderChapters() {
    const r = await api('/api/admin/chapters');
    if (!r.ok) return;
    chapterCache = r.chapters;
    $('#chTable').innerHTML = `
        <thead><tr><th>#</th><th>章节</th><th>副标题</th><th>学时</th><th>页面</th><th>状态</th><th>更新</th><th>操作</th></tr></thead>
        <tbody>${r.chapters.map(c => `
            <tr>
                <td style="color:var(--tx-faint)">${c.idx}</td>
                <td><b style="color:var(--tx-strong)">${esc(c.title)}</b><div style="font-size:11.5px;color:var(--tx-faint);max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(c.summary)}</div></td>
                <td style="color:var(--tx-dim);font-size:12px;">${esc(c.subtitle)}</td>
                <td>${esc(c.hours || '—')}</td>
                <td style="font-size:12px;">${esc(c.url || '—')}</td>
                <td><span class="mp-tag ${c.status === '已发布' ? 'green' : 'amber'}">${esc(c.status)}</span></td>
                <td style="color:var(--tx-faint);font-size:12px;">${fmtTime(c.updated_at)}</td>
                <td><button class="mp-btn sm" data-ed="${c.id}">编辑</button> <button class="mp-btn sm danger" data-de="${c.id}">删</button></td>
            </tr>`).join('')}</tbody>`;
    $$('#chTable [data-ed]').forEach(b => b.addEventListener('click', () => chapterModal(r.chapters.find(c => c.id == b.dataset.ed))));
    $$('#chTable [data-de]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('确定删除该章节记录？')) return;
        const rr = await api('/api/admin/chapters/' + b.dataset.de, { method: 'DELETE' });
        if (rr.ok) { toast('已删除'); renderChapters(); }
    }));
}
function chapterModal(c) {
    c = c || {};
    modal(`
        <h3>${c.id ? '编辑章节' : '新增章节'}</h3>
        <div class="row2">
            <div><label class="f-label">序号</label><input id="mChIdx" class="mp-input" style="width:100%" type="number" value="${c.idx || 1}"></div>
            <div><label class="f-label">学时</label><input id="mChHours" class="mp-input" style="width:100%" value="${esc(c.hours || '')}"></div>
        </div>
        <label class="f-label">标题</label><input id="mChTitle" class="mp-input" style="width:100%" value="${esc(c.title || '')}">
        <label class="f-label">副标题</label><input id="mChSub" class="mp-input" style="width:100%" value="${esc(c.subtitle || '')}">
        <label class="f-label">简介</label><textarea id="mChSum" class="mp-textarea" rows="3">${esc(c.summary || '')}</textarea>
        <div class="row2">
            <div><label class="f-label">页面地址</label><input id="mChUrl" class="mp-input" style="width:100%" value="${esc(c.url || '')}" placeholder="chapters/chapter1.html"></div>
            <div><label class="f-label">状态</label>
                <select id="mChStatus" class="mp-select" style="width:100%">
                    ${['已发布', '备课中', '归档'].map(s => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select></div>
        </div>
        <div class="acts"><button class="mp-btn" data-close>取消</button><button class="mp-btn primary" id="mChSave">保存</button></div>`);
    $('#mChSave').addEventListener('click', async () => {
        const body = {
            id: c.id, idx: Number($('#mChIdx').value || 0), title: $('#mChTitle').value.trim(),
            subtitle: $('#mChSub').value.trim(), summary: $('#mChSum').value.trim(),
            hours: $('#mChHours').value.trim(), url: $('#mChUrl').value.trim(), status: $('#mChStatus').value
        };
        if (!body.title) return toast('标题必填', true);
        const r = await api('/api/admin/chapters', { method: 'POST', body });
        if (r.ok) { toast('已保存'); closeModal(); renderChapters(); }
    });
}
$('#chAddBtn').addEventListener('click', () => chapterModal(null));

/* ================= 学习资源 ================= */
async function renderResources() {
    const r = await api('/api/admin/resources');
    if (!r.ok) return;
    $('#resTable').innerHTML = `
        <thead><tr><th>分类</th><th>标题</th><th>链接</th><th>说明</th><th>操作</th></tr></thead>
        <tbody>${r.resources.map(x => `
            <tr>
                <td><span class="mp-tag violet">${esc(x.category)}</span></td>
                <td><b style="color:var(--tx-strong)">${esc(x.title)}</b></td>
                <td style="font-size:12px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a href="${esc(x.url)}" target="_blank" style="color:var(--c-cyan)">${esc(x.url)}</a></td>
                <td style="color:var(--tx-dim);font-size:12px;">${esc(x.note)}</td>
                <td><button class="mp-btn sm" data-ed="${x.id}">编辑</button> <button class="mp-btn sm danger" data-de="${x.id}">删</button></td>
            </tr>`).join('')}</tbody>`;
    $$('#resTable [data-ed]').forEach(b => b.addEventListener('click', () => resModal(r.resources.find(x => x.id == b.dataset.ed))));
    $$('#resTable [data-de]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('确定删除该资源？')) return;
        const rr = await api('/api/admin/resources/' + b.dataset.de, { method: 'DELETE' });
        if (rr.ok) { toast('已删除'); renderResources(); }
    }));
}
function resModal(x) {
    x = x || {};
    modal(`
        <h3>${x.id ? '编辑资源' : '新增资源'}</h3>
        <label class="f-label">分类（推荐教材 / 在线课程 / 实战平台 / 论文资源…）</label>
        <input id="mResCat" class="mp-input" style="width:100%" value="${esc(x.category || '')}">
        <label class="f-label">标题</label><input id="mResTitle" class="mp-input" style="width:100%" value="${esc(x.title || '')}">
        <label class="f-label">链接</label><input id="mResUrl" class="mp-input" style="width:100%" value="${esc(x.url || '')}">
        <label class="f-label">说明</label><input id="mResNote" class="mp-input" style="width:100%" value="${esc(x.note || '')}">
        <div class="acts"><button class="mp-btn" data-close>取消</button><button class="mp-btn primary" id="mResSave">保存</button></div>`);
    $('#mResSave').addEventListener('click', async () => {
        const body = { id: x.id, category: $('#mResCat').value.trim() || '其他', title: $('#mResTitle').value.trim(), url: $('#mResUrl').value.trim(), note: $('#mResNote').value.trim() };
        if (!body.title) return toast('标题必填', true);
        const r = await api('/api/admin/resources', { method: 'POST', body });
        if (r.ok) { toast('已保存'); closeModal(); renderResources(); }
    });
}
$('#resAddBtn').addEventListener('click', () => resModal(null));

/* ================= 题库 ================= */
let bankCache = [];
async function renderBank() {
    await loadChaptersOptions();
    const ch = Number($('#bankChapter').value || 0);
    const r = await api('/api/admin/bank?chapter=' + ch);
    if (!r.ok) return;
    bankCache = r.questions;
    $('#bkTable').innerHTML = `
        <thead><tr><th>章节</th><th>题干</th><th>选项</th><th>答案</th><th>难度</th><th>操作</th></tr></thead>
        <tbody>${r.questions.map(q => {
            const opts = JSON.parse(q.options || '[]');
            return `
            <tr>
                <td><span class="mp-tag cyan">第${q.chapter || '?'}章</span></td>
                <td style="max-width:320px;"><b style="color:var(--tx-strong)">${esc(q.text)}</b>${q.analysis ? `<div style="font-size:11.5px;color:var(--tx-faint);margin-top:3px;">解析：${esc(q.analysis.slice(0, 50))}</div>` : ''}</td>
                <td style="font-size:12px;color:var(--tx-dim);max-width:260px;">${opts.map((o, i) => `<div>${'ABCD'[i] || i}. ${esc(o)}</div>`).join('')}</td>
                <td><span class="mp-tag green">${'ABCD'[q.answer] ?? q.answer}</span></td>
                <td>${esc(q.difficulty)}</td>
                <td>
                    <button class="mp-btn sm primary" data-push="${q.id}">▶ 推送课堂</button>
                    <button class="mp-btn sm" data-ed="${q.id}">编辑</button>
                    <button class="mp-btn sm danger" data-de="${q.id}">删</button>
                </td>
            </tr>`;
        }).join('') || '<tr><td colspan="6" class="empty-tip">暂无题目</td></tr>'}</tbody>`;
    $$('#bkTable [data-ed]').forEach(b => b.addEventListener('click', () => bankModal(bankCache.find(q => q.id == b.dataset.ed))));
    $$('#bkTable [data-de]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('确定删除该题目？')) return;
        const rr = await api('/api/admin/bank/' + b.dataset.de, { method: 'DELETE' });
        if (rr.ok) { toast('已删除'); renderBank(); }
    }));
    $$('#bkTable [data-push]').forEach(b => b.addEventListener('click', () => pushModal(bankCache.find(q => q.id == b.dataset.push))));
}
async function loadChaptersOptions() {
    if ($('#bankChapter').options.length > 1) return;
    const r = await api('/api/admin/chapters');
    if (r.ok) {
        $('#bankChapter').innerHTML = '<option value="0">全部章节</option>' +
            r.chapters.map(c => `<option value="${c.idx}">第${c.idx}章 ${esc(c.title)}</option>`).join('');
    }
}
$('#bankChapter').addEventListener('change', renderBank);

function bankModal(q) {
    q = q || {};
    const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '["","","",""]');
    modal(`
        <h3>${q.id ? '编辑题目' : '新增题目'}</h3>
        <label class="f-label">章节</label>
        <select id="mBkCh" class="mp-select" style="width:100%">${chapterCache.length ? chapterCache.map(c => `<option value="${c.idx}" ${q.chapter == c.idx ? 'selected' : ''}>第${c.idx}章 ${esc(c.title)}</option>`).join('') : '<option value="0">通用</option>'}</select>
        <label class="f-label">题干</label><textarea id="mBkText" class="mp-textarea" rows="2">${esc(q.text || '')}</textarea>
        ${[0, 1, 2, 3].map(i => `<label class="f-label">${'ABCD'[i]}${i > 1 ? '（可留空）' : ''}</label>
            <input id="mBkOpt${i}" class="mp-input" style="width:100%" value="${esc(opts[i] || '')}">`).join('')}
        <div class="row2" style="margin-top:10px;">
            <div><label class="f-label">正确答案</label>
                <select id="mBkAns" class="mp-select" style="width:100%">${[0, 1, 2, 3].map(i => `<option value="${i}" ${q.answer === i ? 'selected' : ''}>${'ABCD'[i]}</option>`).join('')}</select></div>
            <div><label class="f-label">难度</label>
                <select id="mBkDiff" class="mp-select" style="width:100%">${(window.PB?.DIFFICULTIES || ['简单', '中等', '困难']).map(d => `<option ${q.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
        </div>
        <label class="f-label">解析</label><textarea id="mBkAnalysis" class="mp-textarea" rows="2">${esc(q.analysis || '')}</textarea>
        <div class="acts"><button class="mp-btn" data-close>取消</button><button class="mp-btn primary" id="mBkSave">保存</button></div>`);
    $('#mBkSave').addEventListener('click', async () => {
        const options = [0, 1, 2, 3].map(i => $('#mBkOpt' + i).value.trim()).filter(Boolean);
        const body = {
            id: q.id, chapter: Number($('#mBkCh').value || 0), text: $('#mBkText').value.trim(),
            options, answer: Number($('#mBkAns').value), difficulty: $('#mBkDiff').value,
            analysis: $('#mBkAnalysis').value.trim()
        };
        if (!body.text || options.length < 2) return toast('题干与选项（≥2）必填', true);
        if (body.answer >= options.length) return toast('正确答案超出选项范围', true);
        const r = await api('/api/admin/bank', { method: 'POST', body });
        if (r.ok) { toast('已保存'); closeModal(); renderBank(); }
    });
}
$('#bkAddBtn').addEventListener('click', () => bankModal(null));

function pushModal(q) {
    const opts = JSON.parse(q.options || '[]');
    modal(`
        <h3>推送到课堂</h3>
        <p style="color:var(--tx-dim);font-size:13px;">${esc(q.text)}</p>
        <label class="f-label">目标班级</label>
        <select id="mPushCls" class="mp-select" style="width:100%">${classListCache.map(c => `<option ${$('#lvClass').value === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('') || '<option>默认班级</option>'}</select>
        <div class="acts"><button class="mp-btn" data-close>取消</button><button class="mp-btn primary" id="mPushGo">▶ 立即推送</button></div>`);
    $('#mPushGo').addEventListener('click', async () => {
        const cls = $('#mPushCls').value;
        const r = await api('/api/push', {
            method: 'POST',
            body: { class: cls, text: q.text, options: opts, answer: q.answer, ch: q.chapter }
        });
        if (r.ok) { toast('已推送到「' + cls + '」课堂'); closeModal(); }
    });
}

/* ================= 账号管理 ================= */
async function renderUsers() {
    const r = await api(`/api/admin/users?role=${$('#usRole').value}&q=${encodeURIComponent($('#usQ').value.trim())}&class=${encodeURIComponent($('#usClass').value)}`);
    if (!r.ok) return;
    const roleTag = { admin: 'cyan', teacher: 'violet', student: 'green' };
    const roleName = { admin: '管理员', teacher: '教师', student: '学生' };
    $('#usTable').innerHTML = `
        <thead><tr><th>用户名</th><th>姓名</th><th>角色</th><th>班级</th><th>状态</th><th>最近登录</th><th>操作</th></tr></thead>
        <tbody>${r.users.map(u => `
            <tr>
                <td><span style="font-family:'JetBrains Mono',monospace;">${esc(u.username)}</span></td>
                <td><b style="color:var(--tx-strong)">${esc(u.display_name)}</b></td>
                <td><span class="mp-tag ${roleTag[u.role]}">${roleName[u.role]}</span></td>
                <td>${esc(u.class_name || '—')}</td>
                <td>${u.disabled ? '<span class="mp-tag red">停用</span>' : '<span class="mp-tag green">正常</span>'}</td>
                <td style="color:var(--tx-faint);font-size:12px;">${fmtTime(u.last_login_at)}</td>
                <td>
                    <button class="mp-btn sm" data-ed="${u.id}">编辑</button>
                    <button class="mp-btn sm" data-pw="${u.id}" data-name="${esc(u.display_name)}">重置密码</button>
                    ${u.disabled ? `<button class="mp-btn sm" data-en="${u.id}">启用</button>` : `<button class="mp-btn sm" data-dis="${u.id}">停用</button>`}
                    <button class="mp-btn sm danger" data-de="${u.id}">删</button>
                </td>
            </tr>`).join('') || '<tr><td colspan="7" class="empty-tip">无匹配账号</td></tr>'}</tbody>`;
    $$('#usTable [data-ed]').forEach(b => b.addEventListener('click', () => userModal(r.users.find(u => u.id == b.dataset.ed))));
    $$('#usTable [data-pw]').forEach(b => b.addEventListener('click', () => {
        const uid = b.dataset.pw;
        modal(`
            <h3>重置密码 · ${esc(b.dataset.name)}</h3>
            <label class="f-label">新密码（≥6 位）</label><input id="mPw" class="mp-input" style="width:100%">
            <div class="acts"><button class="mp-btn" data-close>取消</button><button class="mp-btn primary" id="mPwSave">确认重置</button></div>`);
        $('#mPwSave').addEventListener('click', async () => {
            const p = $('#mPw').value;
            if (p.length < 8) return toast('至少 8 位', true);
            const rr = await api('/api/admin/users/' + uid, { method: 'PUT', body: { password: p } });
            if (rr.ok) { toast('密码已重置'); closeModal(); }
        });
    }));
    $$('#usTable [data-dis]').forEach(b => b.addEventListener('click', async () => {
        const rr = await api('/api/admin/users/' + b.dataset.dis, { method: 'PUT', body: { disabled: true } });
        if (rr.ok) { toast('已停用'); renderUsers(); }
    }));
    $$('#usTable [data-en]').forEach(b => b.addEventListener('click', async () => {
        const rr = await api('/api/admin/users/' + b.dataset.en, { method: 'PUT', body: { disabled: false } });
        if (rr.ok) { toast('已启用'); renderUsers(); }
    }));
    $$('#usTable [data-de]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('确定删除该账号？')) return;
        const rr = await api('/api/admin/users/' + b.dataset.de, { method: 'DELETE' });
        if (rr.ok) { toast('已删除'); renderUsers(); }
        else if (rr.msg) toast(rr.msg, true);
    }));
}
function userModal(u) {
    u = u || {};
    modal(`
        <h3>${u.id ? '编辑账号' : '新建账号'}</h3>
        ${u.id ? '' : `
        <div class="row2">
            <div><label class="f-label">用户名</label><input id="mUsName" class="mp-input" style="width:100%"></div>
            <div><label class="f-label">初始密码</label><input id="mUsPass" class="mp-input" style="width:100%"></div>
        </div>`}
        <label class="f-label">姓名</label><input id="mUsDisp" class="mp-input" style="width:100%" value="${esc(u.display_name || '')}">
        <div class="row2">
            <div><label class="f-label">角色</label>
                <select id="mUsRole" class="mp-select" style="width:100%">
                    ${['student', 'teacher', 'admin'].map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${{ student: '学生', teacher: '教师', admin: '管理员' }[r]}</option>`).join('')}
                </select></div>
            <div><label class="f-label">班级</label>
                <select id="mUsCls" class="mp-select" style="width:100%">
                    <option value="">（无）</option>
                    ${classListCache.map(c => `<option ${u.class_name === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
                </select></div>
        </div>
        <label class="f-label">备注</label><input id="mUsNote" class="mp-input" style="width:100%" value="${esc(u.note || '')}">
        <div class="acts"><button class="mp-btn" data-close>取消</button><button class="mp-btn primary" id="mUsSave">保存</button></div>`);
    $('#mUsSave').addEventListener('click', async () => {
        if (u.id) {
            const r = await api('/api/admin/users/' + u.id, {
                method: 'PUT',
                body: { displayName: $('#mUsDisp').value.trim(), role: $('#mUsRole').value, className: $('#mUsCls').value, note: $('#mUsNote').value.trim() }
            });
            if (r.ok) { toast('已保存'); closeModal(); renderUsers(); }
        } else {
            const body = {
                username: $('#mUsName').value.trim(), password: $('#mUsPass').value,
                displayName: $('#mUsDisp').value.trim() || $('#mUsName').value.trim(),
                role: $('#mUsRole').value, className: $('#mUsCls').value, note: $('#mUsNote').value.trim()
            };
            if (!body.username || !body.password) return toast('用户名与密码必填', true);
            const r = await api('/api/admin/users', { method: 'POST', body });
            if (r.ok) { toast('已创建'); closeModal(); renderUsers(); }
            else toast(r.msg || '创建失败', true);
        }
    });
}
$('#usAddBtn').addEventListener('click', () => userModal(null));
$('#usRole').addEventListener('change', renderUsers);
$('#usQ').addEventListener('input', debounce(renderUsers, 400));
$('#usClass').addEventListener('change', renderUsers);
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* ================= 数据导出 ================= */
const EXPORTS = [
    ['students', '学生学情报表', '按学生汇总：签到天数、答题数、正确率、活跃度', 'xlsx'],
    ['signins', '签到记录', '全部历史签到明细（含访客标记）', 'xlsx'],
    ['answers', '答题明细', '每道题的每人作答与判定结果', 'xlsx'],
    ['questions', '课堂题目与统计', '推送题目 + 作答人数 + 答对人数', 'xlsx'],
    ['events', '学习行为日志', '浏览、实验、测验等全量行为埋点', 'xlsx'],
    ['users', '账号列表', '全部账号与角色、最近登录', 'lock']
];
function renderExport() {
    const cls = $('#expClass').value;
    $('#expCards').innerHTML = EXPORTS.map(e => `
        <div class="mp-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">${e[1]}</h3>
                <span class="mp-tag ${e[3] === 'lock' ? 'amber' : 'cyan'}">CSV</span>
            </div>
            <p style="color:var(--tx-faint);font-size:12.5px;margin:8px 0 14px;">${e[2]}</p>
            <button class="mp-btn primary" data-exp="${e[0]}">⬇ 导出 CSV</button>
        </div>`).join('');
    // 导出不是普通链接：PB.api 是把旧 /api/* 翻成 PocketBase 集合调用的一层，
    // 直接写 <a href="/api/admin/export/..."> 会打到不存在的路由上（404），
    // CSV 是浏览器本地拼出来的，本来也没有一个可导航的地址。
    $$('#expCards [data-exp]').forEach(b => b.addEventListener('click', async () => {
        const r = await api('/api/admin/export/' + b.dataset.exp + '?class=' + encodeURIComponent(cls));
        if (r.ok) toast('已开始下载');
        else toast(r.msg || '导出失败', true);
    }));
    const chartDefs = [
        ['signTrend', '签到趋势图'], ['modDist', '学习行为分布'], ['actTrend', '活跃度趋势'],
        ['anTop', '学生综合表现'], ['anDist', '正确率分布'], ['anQuiz', '课堂题目正确率'],
        ['stChapter', '个人章节作答'], ['stEv', '个人活跃趋势']
    ];
    $('#expCharts').innerHTML = chartDefs.map(c =>
        `<button class="mp-btn" data-chart="${c[0]}">🖼 ${c[1]}</button>`).join('');
    $$('#expCharts [data-chart]').forEach(b => b.addEventListener('click', () => {
        const c = charts[b.dataset.chart];
        if (!c || c.isDisposed?.()) return toast('该图表尚未渲染，请先在总览/学情页打开', true);
        const a = document.createElement('a');
        a.href = c.getDataURL({ pixelRatio: 2, backgroundColor: '#0a1120' });
        a.download = b.textContent.replace('🖼 ', '') + '.png';
        a.click();
        toast('图表已导出 PNG');
    }));
}
$('#expClass').addEventListener('change', renderExport);

/* ================= 设置 ================= */
async function renderSettings() {
    const r = await api('/api/admin/settings');
    if (r.ok) {
        $('#setCourseName').value = r.settings.course_name || '';
        $('#setCourseCode').value = r.settings.course_code || '';
        $('#setSemester').value = r.settings.semester || '';
        $('#setSchool').value = r.settings.school || '';
        $('#setDefaultClass').value = r.settings.default_class || '';
    }
    const ov = await api('/api/admin/overview');
    if (ov.ok) {
        $('#sysInfo').innerHTML = `
            数据库：<span style="font-family:monospace;color:var(--c-cyan)">PocketBase（内置 SQLite）</span><br>
            数据目录：<span style="font-family:monospace;color:var(--c-cyan)">pocketbase/pb_data/</span><br>
            数据库大小：${await dbSize()}<br>
            累计数据：签到 ${ov.counts.answers + ov.today.signins > 0 ? '' : ''}${ov.today.signins} 今日 · 答题 ${ov.counts.answers} 条 · 行为 ${ov.counts.events} 条<br>
            服务器时间：${new Date().toLocaleString('zh-CN')}`;
    }
}
async function dbSize() {
    // 必须走 window.PB.api 的兼容层。原来这里是裸 fetch('/api/admin/sysinfo')，
    // 那是旧 Node 服务端的路由，PocketBase 上根本没有这个地址，永远 404，
    // 数据库大小这一栏常年显示 '?'，看上去像坏了。
    // 而 PocketBase 的数据目录在服务器上，浏览器读不到它的体积，只能如实说未知。
    const r = await window.PB.api('/api/admin/sysinfo');
    if (r.ok && r.dbMB != null) return `约 ${r.dbMB} MB`;
    return '未知（数据目录在服务器上，浏览器无法读取）';
}
$('#setSave').addEventListener('click', async () => {
    const r = await api('/api/admin/settings', {
        method: 'PUT',
        body: {
            course_name: $('#setCourseName').value.trim(),
            course_code: $('#setCourseCode').value.trim(),
            semester: $('#setSemester').value.trim(),
            school: $('#setSchool').value.trim(),
            default_class: $('#setDefaultClass').value.trim()
        }
    });
    if (r.ok) toast('设置已保存');
});
$('#pwSave').addEventListener('click', async () => {
    if ($('#pwNew').value !== $('#pwNew2').value) return toast('两次新密码不一致', true);
    const r = await api('/api/auth/password', {
        method: 'POST',
        body: { oldPassword: $('#pwOld').value, newPassword: $('#pwNew').value }
    });
    if (r.ok) {
        // 改密成功后 PocketBase 已作废本会话（pb.js 侧也清了本地会话），
        // 必须引导重新登录，否则接下来的每个请求都是 404。
        toast('密码已修改，请用新密码重新登录');
        setTimeout(() => location.reload(), 1200);
        return;
    }
    toast(r.msg || '修改失败', true);
});

/* ---------------- 启动 ---------------- */
boot();
