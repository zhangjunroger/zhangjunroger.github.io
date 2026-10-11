// ============================================================
// student.js —— 学生学情中心
// ============================================================
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let ME = null;
const charts = {};

// 见 admin.js 里的同名函数：请求交给 js/pb.js，这里不做别的加工
async function api(path, opts = {}) {
    return await window.PB.api(path, opts);
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
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function chart(name, domId, option, isEmpty, emptyTip) {
    const dom = $(domId);
    if (!dom) return null;
    let tip = dom.parentElement.querySelector('.empty-tip');
    if (isEmpty) {
        const old = charts[name];
        if (old && !old.isDisposed()) old.dispose();
        charts[name] = null;
        if (!tip) { tip = document.createElement('div'); tip.className = 'empty-tip'; dom.parentElement.appendChild(tip); }
        tip.textContent = emptyTip || '暂无数据';
        dom.style.display = 'none';
        return null;
    }
    dom.style.display = '';
    if (tip) tip.remove();
    let c = charts[name];
    if (!c || c.getDom() !== dom || c.isDisposed()) {
        if (c && !c.isDisposed()) c.dispose();
        c = echarts.init(dom); charts[name] = c;
    }
    window.addEventListener('resize', () => c.resize());
    c.setOption(option, true);
    return c;
}
const AXIS = {
    axisLine: { lineStyle: { color: 'rgba(148,163,184,.25)' } },
    axisLabel: { color: '#94a3b8', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(148,163,184,.12)' } }
};
const PALETTE = ['#38bdf8', '#2563eb', '#818cf8', '#a78bfa', '#2dd4bf', '#34d399'];

/* ---- 登录 ---- */
$('#lgBtn').addEventListener('click', doLogin);
$('#lgPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
async function doLogin() {
    const username = $('#lgUser').value.trim();
    const password = $('#lgPass').value;
    if (!username || !password) { $('#lgMsg').textContent = '请输入学号与密码'; return; }
    $('#lgBtn').disabled = true;
    const r = await api('/api/auth/login', { method: 'POST', body: { username, password } });
    $('#lgBtn').disabled = false;
    if (r.ok) {
        ME = r.user;
        try { localStorage.setItem('zhkc_identity', JSON.stringify({ name: ME.displayName, className: ME.className })); } catch (e) {}
        $('#lgMsg').textContent = '';
        showMain();
    } else $('#lgMsg').textContent = r.msg || '登录失败';
}

async function boot() {
    const me = await api('/api/auth/me');
    if (me.ok && me.user) { ME = me.user; showMain(); }
    else { $('#loginView').style.display = 'flex'; $('#lgUser').focus(); }
}

function showMain() {
    $('#loginView').style.display = 'none';
    $('#mainView').style.display = 'flex';
    $('#meInfo').innerHTML = `<span class="mp-tag green">学生</span> <b style="color:var(--tx)">${esc(ME.displayName)}</b><br>
        <span style="font-size:11px">${esc(ME.className || '未分班')}</span>`;
    renderMe();
}
$('#logoutBtn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    location.reload();
});

/* ---- 侧栏 ---- */
$$('.mp-item').forEach(it => it.addEventListener('click', () => {
    $$('.mp-item').forEach(i => i.classList.toggle('active', i === it));
    $$('.mp-page').forEach(p => p.classList.toggle('active', p.dataset.page === it.dataset.page));
    if (it.dataset.page === 'answers') renderAnswers();
    if (it.dataset.page === 'resources') renderResources();
}));

/* ---- 学习画像 ---- */
async function renderMe() {
    const r = await api('/api/student/me');
    if (!r.ok) { if (r._status === 401) location.reload(); return; }
    $('#hiLine').textContent = '你好，' + r.profile.name;
    $('#hiSub').textContent = `${r.profile.className || '未分班'} · 上次登录 ${fmtTime(r.profile.lastLoginAt)}`;
    const s = r.stats;
    $('#meKpis').innerHTML = `
        ${kpi('签到天数', s.signDays + ' 天', s.lastSign ? '最近 ' + fmtTime(s.lastSign) : '尚未签到')}
        ${kpi('课堂答题', s.answers + ' 题', `答对 ${s.rightAnswers} 题`)}
        ${kpi('答题正确率', s.accuracy === null ? '—' : s.accuracy + '%', s.answers ? '持续加油！' : '暂无作答')}
        ${kpi('覆盖章节', r.byChapter.length + ' 章', '已参与互动章节')}`;
    function kpi(l, n, sub) {
        return `<div class="mp-card kpi"><div class="k-label">${l}</div><div class="k-num">${n}</div><div class="k-sub">${esc(sub)}</div></div>`;
    }

    chart('meCh', '#meChChart', {
        color: PALETTE,
        tooltip: { trigger: 'axis' },
        legend: { textStyle: { color: '#94a3b8' }, top: 0 },
        grid: { left: 40, right: 16, top: 32, bottom: 26 },
        xAxis: { type: 'category', data: r.byChapter.map(x => '第' + x.chapter + '章'), ...AXIS },
        yAxis: { type: 'value', ...AXIS },
        series: [
            { name: '作答', type: 'bar', data: r.byChapter.map(x => x.total), barMaxWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] } },
            { name: '答对', type: 'bar', data: r.byChapter.map(x => x.ok), barMaxWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0] } }
        ]
    }, !r.byChapter.length, '暂无课堂作答记录，等待老师推送题目吧');

    chart('meEv', '#meEvChart', {
        color: PALETTE,
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 16, top: 20, bottom: 26 },
        xAxis: { type: 'category', data: r.evTrend.map(x => x.day), ...AXIS },
        yAxis: { type: 'value', ...AXIS },
        series: [{ type: 'line', smooth: true, data: r.evTrend.map(x => x.n), areaStyle: { opacity: .18 }, symbolSize: 5 }]
    }, !r.evTrend.length, '暂无学习行为记录，去课程主页看看吧');

    chart('meMod', '#meModChart', {
        color: PALETTE,
        tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 次（{d}%）' },
        legend: { type: 'scroll', textStyle: { color: '#94a3b8' }, bottom: 0 },
        series: [{
            type: 'pie', radius: ['40%', '66%'], center: ['50%', '44%'],
            data: r.modules.map(m => ({ name: m.module, value: m.n })),
            label: { color: '#94a3b8', fontSize: 11 },
            itemStyle: { borderColor: '#0d1628', borderWidth: 2 }
        }]
    }, !r.modules.length, '暂无学习模块数据');
}
$('#meRefresh').addEventListener('click', renderMe);

/* ---- 我的作答 ---- */
async function renderAnswers() {
    const r = await api('/api/student/me');
    if (!r.ok) return;
    $('#ansTable').innerHTML = `
        <thead><tr><th>章节</th><th>题目</th><th>我的作答</th><th>判定</th><th>时间</th></tr></thead>
        <tbody>${r.recentAns.map(a => `
            <tr>
                <td><span class="mp-tag cyan">第${a.chapter || '?'}章</span></td>
                <td style="max-width:420px;">${esc(a.text || a.qid)}</td>
                <td>${esc(a.choice_text || '—')}</td>
                <td>${a.correct === null ? '—' : a.correct ? '<span class="mp-tag green">正确</span>' : '<span class="mp-tag red">错误</span>'}</td>
                <td style="color:var(--tx-faint);font-size:12px;">${fmtTime(a.answered_at)}</td>
            </tr>`).join('') || '<tr><td colspan="5" class="empty-tip">暂无作答记录，等待老师推送题目吧</td></tr>'}</tbody>`;
}

/* ---- 学习资源 ---- */
async function renderResources() {
    const r = await api('/api/public/resources');
    if (!r.ok) return;
    $('#resTable').innerHTML = `
        <thead><tr><th>分类</th><th>标题</th><th>说明</th><th>链接</th></tr></thead>
        <tbody>${r.resources.map(x => `
            <tr>
                <td><span class="mp-tag violet">${esc(x.category)}</span></td>
                <td><b style="color:var(--tx-strong)">${esc(x.title)}</b></td>
                <td style="color:var(--tx-dim);font-size:12.5px;">${esc(x.note)}</td>
                <td><a href="${esc(x.url)}" target="_blank" style="color:var(--c-cyan);font-size:12.5px;">打开 ↗</a></td>
            </tr>`).join('')}</tbody>`;
}

/* ---- 改密 ---- */
$('#pwSave').addEventListener('click', async () => {
    if ($('#pwNew').value !== $('#pwNew2').value) return toast('两次新密码不一致', true);
    const r = await api('/api/auth/password', { method: 'POST', body: { oldPassword: $('#pwOld').value, newPassword: $('#pwNew').value } });
    if (r.ok) { toast('密码已修改'); $('#pwOld').value = $('#pwNew').value = $('#pwNew2').value = ''; }
    else toast(r.msg || '修改失败', true);
});

boot();
