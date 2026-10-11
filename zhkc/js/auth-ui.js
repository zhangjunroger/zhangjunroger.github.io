// ============================================================
// auth-ui.js —— 全站共享「学生登录 / 注册」组件
//   · 自动接管导航栏 .nav-user 区域：未登录显示「登录 / 注册」，
//     已登录显示头像 + 姓名 + 下拉菜单（学情中心 / 退出）
//   · 弹窗含 登录 / 注册 双 Tab；注册成功自动登录
//   · 登录后同步 localStorage 身份（zhkc_identity），学习行为即刻绑定账号
//   依赖：track.js（setZhkcIdentity）、服务器 /api/auth/*
// ============================================================
(function () {
    'use strict';

    let me = null;          // 当前登录用户
    let classList = [];     // 可选班级

    // ---------- 小工具 ----------
    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // 委托给 js/pb.js（window.PB.api）。签名保持老样子：只传 path 就是 GET，
    // 传了 body 就是 POST，省得下面十几处调用点跟着改。
    async function api(path, body) {
        return await window.PB.api(path, body ? { method: 'POST', body } : {});
    }

    // ---------- 导航栏渲染 ----------
    function renderNav() {
        const host = document.getElementById('navUser') || document.querySelector('.nav-user');
        if (!host) return;
        host.innerHTML = '';
        host.classList.add('auth-nav-user');
        if (me) {
            const initial = (me.displayName || '学').trim().charAt(0).toUpperCase();
            host.innerHTML =
                '<div class="user-avatar">' + esc(initial) + '</div>' +
                '<span class="user-name">' + esc(me.displayName) +
                (me.className ? '<em class="user-cls">' + esc(me.className) + '</em>' : '') + '</span>' +
                '<span class="nav-caret">▾</span>';
            // 用根绝对路径：这个脚本同时挂在根目录和 chapters/ 下的页面上，
            // 写 "admin.html" 在章节页会解析成 /chapters/admin.html → 404 空白页。
            const menu = el('div', 'auth-dropdown',
                '<a class="auth-dd-item" href="/student.html">📊 我的学情中心</a>' +
                (me.role === 'admin' || me.role === 'teacher'
                    ? '<a class="auth-dd-item" href="/admin.html">⚙ 管理后台</a>' : '') +
                '<button class="auth-dd-item" data-act="pwd">🔑 修改密码</button>' +
                '<button class="auth-dd-item danger" data-act="logout">⏻ 退出登录</button>');
            menu.style.display = 'none';
            host.appendChild(menu);
            host.classList.add('auth-has-menu');
            host.addEventListener('click', (ev) => {
                const act = ev.target.closest('[data-act]');
                if (act) {
                    ev.stopPropagation();
                    if (act.dataset.act === 'logout') doLogout();
                    else if (act.dataset.act === 'pwd') openModal('pwd');
                    menu.style.display = 'none';
                    return;
                }
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            });
            document.addEventListener('click', () => { menu.style.display = 'none'; }, { once: true });
        } else {
            host.innerHTML = '<button class="auth-login-btn" id="authLoginBtn">登录 / 注册</button>';
            host.addEventListener('click', (ev) => {
                if (ev.target.closest('#authLoginBtn')) openModal('login');
            });
        }
    }

    async function doLogout() {
        await api('/api/auth/logout', {});
        try { localStorage.setItem('zhkc_identity', JSON.stringify({ name: '', className: '' })); } catch (e) {}
        location.reload();
    }

    // ---------- 弹窗 ----------
    let mask = null;
    function ensureModal() {
        if (mask) return;
        mask = el('div', 'auth-mask');
        mask.innerHTML =
            '<div class="auth-modal" role="dialog" aria-modal="true">' +
            '  <button class="auth-close" title="关闭">×</button>' +
            '  <div class="auth-brand"><div class="auth-logo">🎓</div><div><b>神经网络与深度学习</b><span>智慧课程学习账号</span></div></div>' +
            '  <div class="auth-tabs"><button class="auth-tab active" data-tab="login">登 录</button><button class="auth-tab" data-tab="reg">注册新账号</button></div>' +
            '  <form class="auth-form" id="authFormLogin">' +
            '    <label>学号 / 用户名<input name="username" autocomplete="username" placeholder="教师开通的学号或注册用户名"></label>' +
            '    <label>密码<input name="password" type="password" autocomplete="current-password" placeholder="请输入密码"></label>' +
            '    <div class="auth-err" id="authErrLogin"></div>' +
            '    <button class="auth-submit" type="submit">登 录</button>' +
            '    <p class="auth-tip">登录后，你的学习行为、实验操作与课堂答题将计入个人学情档案</p>' +
            '  </form>' +
            '  <form class="auth-form" id="authFormReg" style="display:none">' +
            '    <label>真实姓名<input name="displayName" maxlength="20" placeholder="用于签到与学情展示"></label>' +
            '    <label>学号 / 用户名<input name="username" autocomplete="username" placeholder="4~20 位字母、数字或下划线"></label>' +
            '    <label>设置密码<input name="password" type="password" autocomplete="new-password" placeholder="至少 8 位"></label>' +
            '    <label>确认密码<input name="password2" type="password" autocomplete="new-password" placeholder="再次输入密码"></label>' +
            '    <label>所在班级<select name="className"><option value="">未分配班级</option></select></label>' +
            '    <div class="auth-err" id="authErrReg"></div>' +
            '    <button class="auth-submit" type="submit">注册并登录</button>' +
            '    <p class="auth-tip">注册后可直接进入「学情中心」查看个人学习画像</p>' +
            '  </form>' +
            '  <form class="auth-form" id="authFormPwd" style="display:none">' +
            '    <label>原密码<input name="oldPassword" type="password" autocomplete="current-password"></label>' +
            '    <label>新密码（至少 8 位）<input name="newPassword" type="password" autocomplete="new-password"></label>' +
            '    <div class="auth-err" id="authErrPwd"></div>' +
            '    <button class="auth-submit" type="submit">确认修改</button>' +
            '  </form>' +
            '</div>';
        document.body.appendChild(mask);

        mask.addEventListener('click', (ev) => {
            if (ev.target === mask) closeModal();
            if (ev.target.closest('.auth-close')) closeModal();
        });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeModal(); });

        // Tab 切换
        mask.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
        function switchTab(name) {
            mask.querySelectorAll('.auth-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === name));
            document.getElementById('authFormLogin').style.display = name === 'login' ? '' : 'none';
            document.getElementById('authFormReg').style.display = name === 'reg' ? '' : 'none';
            document.getElementById('authFormPwd').style.display = 'none';
        }
        mask._switchTab = switchTab;

        // 登录
        document.getElementById('authFormLogin').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const errEl = document.getElementById('authErrLogin');
            errEl.textContent = '';
            const r = await api('/api/auth/login', {
                username: fd.get('username'), password: fd.get('password')
            });
            if (!r.ok) { errEl.textContent = r.msg || '登录失败'; return; }
            afterAuth(r.user, '登录');
        });

        // 注册
        document.getElementById('authFormReg').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const errEl = document.getElementById('authErrReg');
            errEl.textContent = '';
            if (fd.get('password') !== fd.get('password2')) { errEl.textContent = '两次输入的密码不一致'; return; }
            const r = await api('/api/auth/register', {
                displayName: fd.get('displayName'), username: fd.get('username'),
                password: fd.get('password'), className: fd.get('className')
            });
            if (!r.ok) { errEl.textContent = r.msg || '注册失败'; return; }
            afterAuth(r.user, '注册');
        });

        // 修改密码
        document.getElementById('authFormPwd').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const errEl = document.getElementById('authErrPwd');
            errEl.textContent = '';
            const r = await api('/api/auth/password', {
                oldPassword: fd.get('oldPassword'), newPassword: fd.get('newPassword')
            });
            if (!r.ok) { errEl.textContent = r.msg || '修改失败'; return; }
            errEl.textContent = '';
            ev.target.reset();
            alert('密码修改成功');
            closeModal();
        });
    }

    function afterAuth(user, verb) {
        me = user;
        try {
            window.setZhkcIdentity(user.displayName, user.className || '');
        } catch (e) {}
        if (window.serverTrack) window.serverTrack('账号', verb + '成功', user.username);
        if (window.trackEvent) window.trackEvent('账号', verb + '成功');
        closeModal();
        renderNav();
    }

    function openModal(tab) {
        ensureModal();
        mask.classList.add('show');
        mask._switchTab(tab === 'reg' || tab === 'pwd' ? tab : 'login');
        if (tab === 'pwd') {
            mask.querySelectorAll('.auth-tab').forEach(x => x.classList.remove('active'));
            document.getElementById('authFormLogin').style.display = 'none';
            document.getElementById('authFormReg').style.display = 'none';
            document.getElementById('authFormPwd').style.display = '';
        }
        const first = mask.querySelector(tab === 'reg' ? '#authFormReg input' : '#authFormLogin input');
        setTimeout(() => first && first.focus(), 60);
    }
    function closeModal() { if (mask) mask.classList.remove('show'); }

    // ---------- 初始化 ----------
    async function init() {
        // 已有本地身份也先渲染，避免闪烁
        renderNav();
        try {
            const r = await api('/api/auth/me');
            if (r.ok && r.user) {
                me = r.user;
                // 同步本地埋点身份（服务器端也会强制绑定，双保险）
                try { window.setZhkcIdentity(me.displayName, me.className || ''); } catch (e) {}
                renderNav();
            }
        } catch (e) { /* file:// 直开或服务器未启动 */ }
        // 预取班级列表（注册用）
        try {
            const r = await api('/api/auth/classes');
            if (r.ok && Array.isArray(r.classes)) {
                classList = r.classes;
                const sel = document.querySelector('#authFormReg select[name="className"]');
                if (sel) {
                    classList.forEach(c => {
                        const o = document.createElement('option');
                        o.value = c; o.textContent = c;
                        sel.appendChild(o);
                    });
                }
            }
        } catch (e) {}
    }

    window.zhkcAuth = { openModal, get user() { return me; } };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
