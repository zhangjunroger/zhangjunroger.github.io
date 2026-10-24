// ============================================================
// pb.js —— PocketBase 数据层
//
//   背景：这套系统原先是 Node + node:sqlite 自己写的一套 /api/*，
//   换 PocketBase 之后服务端整套 API 没有了，页面一个改不动就没意义。
//   所以这里在浏览器侧重建同名同形状的接口：api('/api/xxx')
//   内部改成直接调 PocketBase 的集合接口，返回结构逐字段对齐旧版。
//   于是 admin.js / live.js / signin.html 这些渲染代码一行都不用动，
//   而真正的鉴权与越权拦截落在 PocketBase 的集合规则上（scripts/pb-setup.js）。
//
//   用法：任何页面在业务脚本之前先引 <script src="/js/pb.js"></script>
//
//   注意：本文件整体包在 IIFE 里，只往 window 上挂 PB 和 api 两个出口。
//   页面里 admin.js / student.js 都各自有一个顶层 let ME，如果这里也用
//   顶层 let ME，浏览器会让整个 admin.js 直接语法错误、白屏。
// ============================================================
(function () {
'use strict';

// ---------- 配置 ----------
// 站点由 PocketBase 自身托管时，前后端同源，用相对路径即可；
// 若前端另部署（如放到 Nginx/静态托管），在引入本脚本前设 window.PB_BASE 即可。
const PB_BASE = (typeof window !== 'undefined' && window.PB_BASE) || '';
// 学号 → 邮箱的补域后缀。必须和 scripts/pb-setup.js 里的
// STUDENT_MAIL_DOMAIN 一致，否则建的号登不上。
const STU_DOMAIN = (typeof window !== 'undefined' && window.PB_STUDENT_DOMAIN) || 'stu.zhkc.cn';
// PocketBase v0.40 没有 username 字段，只认 email，所以学号统一补成 邮箱。
const mailOf = id => (String(id).includes('@') ? String(id) : `${id}@${STU_DOMAIN}`);
// PocketBase 只把 email 返给"记录本人"和超管，教职工 token 拿到的记录里
// email 是空的。所以用户名必须单独存一份（users.username），
// 不能再靠 idOfMail(email) 反推 —— 反推出来全是空串，"按学号搜人"和
// "这个账号是不是已经存在"（按 email 过滤）会双双失效。
// 老记录可能还没补上 username，这时才退回反推。
const idOfMail = mail => String(mail || '').split('@')[0];

// 密码下限。PocketBase auth 集合强制 ≥8 位，填 6 位不会报"密码太短"，
// 而是整条记录创建失败、只回一句 "Failed to create record." —— 从页面上完全
// 看不出是密码的问题。所以这里跟着服务端对齐，省得"一键生成学生账号"和
// 账号导入在后台静默地一个都建不出来。
const PWD_MIN = 8;
const PWD_DEFAULT = 'zhkc1234';
// 由学号推出一个稳定的初始密码：取末 8 位，不够就在**前面**补 0，保证一定够长。
// 前面补而不是后面补，是为了让 20250101 这种正好 8 位的学号原样保留，
// 5 位的学号变成 00090001 —— 学生猜密码时看学号尾部就对得上。
// 学号里没有数字（有人把姓名直接当学号填了）时返回 null，交给调用方兜底。
const pwdFromSid = sid => {
    const s = String(sid || '').replace(/\D/g, '');
    if (!s) return null;
    return (s.length > PWD_MIN ? s.slice(-PWD_MIN) : s.padStart(PWD_MIN, '0'));
};

const TOKEN_KEY = 'zhkc.token';
const USER_KEY = 'zhkc.user';

// ---------- 会话 ----------
let TOKEN = (() => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } })();
let ME = (() => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; } })();

function saveSession(token, user) {
    TOKEN = token || '';
    ME = user || null;
    try {
        if (TOKEN) localStorage.setItem(TOKEN_KEY, TOKEN); else localStorage.removeItem(TOKEN_KEY);
        if (ME) localStorage.setItem(USER_KEY, JSON.stringify(ME)); else localStorage.removeItem(USER_KEY);
    } catch (e) { /* 隐私模式下 localStorage 不可写，退化成内存态 */ }
}
const isStaff = () => !!(ME && (ME.role === 'admin' || ME.role === 'teacher'));

// ---------- 底层请求 ----------
// PocketBase 拒绝时不回 403 而是回 200 + 空列表（规则把记录全过滤掉了），
// 所以"没权限"和"确实没数据"在 HTTP 层面分不开，得靠业务判断。
async function pbFetch(method, path, body) {
    const opt = { method, headers: {} };
    if (TOKEN) opt.headers.Authorization = TOKEN;
    if (body !== undefined) {
        opt.headers['Content-Type'] = 'application/json';
        opt.body = JSON.stringify(body);
    }
    const r = await fetch(PB_BASE + path, opt);
    const text = await r.text();
    let j = null;
    try { j = text ? JSON.parse(text) : null; } catch (e) { j = { message: text }; }
    if (!r.ok) {
        const err = new Error((j && (j.message || (j.data && Object.values(j.data)[0] && Object.values(j.data)[0].message))) || ('HTTP ' + r.status));
        err.status = r.status;
        err.data = j && j.data;
        throw err;
    }
    return j;
}

// filter 里的字符串要自己转义：PocketBase 用双引号包字符串，
// 姓名里出现 " 或 \ 会直接把整条查询语法搞坏（中文姓名不会有，但备注里有）。
const q = v => '"' + String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

// 列表。PocketBase 默认单页 30 条，events 这类表很容易超，
// 必须翻页取全，否则统计和导出都会少数据。
async function listAll(coll, opts = {}) {
    const out = [];
    let page = 1;
    for (;;) {
        const p = new URLSearchParams();
        p.set('page', page);
        p.set('perPage', 200);
        if (opts.filter) p.set('filter', opts.filter);
        if (opts.sort) p.set('sort', opts.sort);
        if (opts.fields) p.set('fields', opts.fields);
        const j = await pbFetch('GET', `/api/collections/${coll}/records?` + p.toString());
        const items = (j && j.items) || [];
        out.push(...items);
        if (page >= (j && j.totalPages) || !items.length) break;
        page++;
        if (page > 200) break;   // 兜底，别把浏览器卡死
    }
    return out;
}
const first = async (coll, filter, sort) =>
    (await listAll(coll, { filter, sort, perPage: 1 }))[0] || null;

const create = (coll, body) => pbFetch('POST', `/api/collections/${coll}/records`, body);
const update = (coll, id, body) => pbFetch('PATCH', `/api/collections/${coll}/records/${id}`, body);
const remove = (coll, id) => pbFetch('DELETE', `/api/collections/${coll}/records/${id}`);

// 唯一索引冲突时 PocketBase 返回 400，并在 data 里指明是哪一列撞了。
// 匿名写入的接口（签到、答题）只能靠这个判断"已经写过了"——
// 这两张表的读取是限教职工的，匿名页面根本查不到自己刚才那条。
const dupCodes = new Set(['validation_not_unique', 'validation_missing_rel_record']);
const isDupErr = (e) => {
  const d = e && e.data;
  if (!d) return false;
  return Object.values(d).some(v => v && dupCodes.has(v.code));
};

// 客户端算出来的记录 id（15 位小写字母数字，和 PocketBase 的主键格式一致）。
// answers 用它当主键：改了答案就是往同一个 id 上覆盖，而不是追加一条。
// 唯一索引还兜一层，保证同一个人同一题只有一行。
function detId(...parts) {
  const s = parts.map(x => String(x == null ? '' : x)).join('');
  // FNV-1a 32 位 ×2 轮，拼够 15 位
  let out = '';
  let h = 0x811c9dc5;
  for (let round = 0; round < 2 && out.length < 15; round++) {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i) + round * 7;
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
      out += h.toString(36);
      if (out.length >= 15) break;
    }
  }
  return (out + '000000000000000').slice(0, 15);
}

// ---------- 时间小工具 ----------
const todayStr = (t) => {
    const d = t == null ? new Date() : new Date(t);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
function timeOf(v) {
    const d = new Date(v);
    if (isNaN(d)) return String(v || '');
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
const daysAgo = n => {
    const d = new Date();
    d.setDate(d.getDate() - n + 1);
    return todayStr(d);
};

// PocketBase 存回来的 date 是 "2026-09-19 00:21:18.520Z"，
// Safari 不认这种带空格的格式，统一洗成标准 ISO
const isoOf = v => {
    if (!v) return '';
    const s = String(v).replace(' ', 'T');
    const d = new Date(s);
    return isNaN(d) ? String(v) : d.toISOString();
};

// ---------- 用户字段映射 ----------
// PocketBase 的 users 记录：{id, email, displayName, role, className, ...}
// 旧接口给的是 {id, username, display_name, class_name, created_at, last_login_at}
// 管理端表格直接吃旧字段名，所以映射成旧形状，别去改 admin.js
function userOut(r) {
    if (!r) return null;
    return {
        id: r.id,
        // username 字段是权威来源；老记录没补上时才退回从 email 反推
        username: r.username || idOfMail(r.email),
        email: r.email,
        display_name: r.displayName || '',
        displayName: r.displayName || '',
        role: r.role || 'student',
        class_name: r.className || '',
        className: r.className || '',
        disabled: !!r.disabled,
        note: r.note || '',
        created_at: isoOf(r.created),
        last_login_at: isoOf(r.lastLoginAt) || null,
    };
}
// authWithPassword / 注册 / 改密的返回体是 record 本身，也统一成这个形状
function userSelf(r) {
    return {
        id: r.id, username: r.username || idOfMail(r.email), displayName: r.displayName || '',
        role: r.role || 'student', className: r.className || '', lastLoginAt: isoOf(r.lastLoginAt) || null,
    };
}

// ============================================================
// 认证
// ============================================================
async function apiLogin(username, password) {
    let j;
    try {
        j = await pbFetch('POST', '/api/collections/users/auth-with-password', {
            identity: mailOf(username), password,
        });
    } catch (e) {
        return { ok: false, msg: '用户名或密码错误' };
    }
    if (j && j.record && j.record.disabled) {
        return { ok: false, msg: '账号已停用，请联系教师' };
    }
    const u = userSelf(j.record);
    // 顺手补上服务端维护的字段，方便前端立刻拿到 className
    try {
        const full = await pbFetch('GET', `/api/collections/users/records/${j.record.id}`);
        Object.assign(u, userSelf(full));
    } catch (e) { /* 读不到就按返回的算，不影响登录 */ }
    saveSession(j.token, u);
    return { ok: true, user: u };
}

async function apiRegister(b) {
    const username = String(b.username || '').trim();
    const displayName = String(b.displayName || '').trim();
    const password = String(b.password || '');
    const className = String(b.className || '').trim();
    if (!/^[A-Za-z0-9_]{4,20}$/.test(username)) {
        return { ok: false, msg: '学号/用户名需为 4~20 位字母、数字或下划线' };
    }
    if (!displayName || displayName.length > 20) return { ok: false, msg: '请填写真实姓名（20 字以内）' };
    if (password.length < PWD_MIN) return { ok: false, msg: `密码至少 ${PWD_MIN} 位` };

    // 注册页能选班级，先确保班级存在（students 建班权限是公开的）
    if (className) {
        const exist = await first('classes', `name = ${q(className)}`);
        if (!exist) { try { await create('classes', { name: className }); } catch (e) { /* 并发时重复建，不影响 */ } }
    }
    try {
        const rec = await create('users', {
            email: mailOf(username), username,
            password, passwordConfirm: password,
            displayName, role: 'student', className,
        });
        const j = await pbFetch('POST', '/api/collections/users/auth-with-password', {
            identity: mailOf(username), password,
        });
        const u = userSelf(j.record || rec);
        saveSession(j.token, u);
        // 注册本身也算一次学习行为
        track({ module: '账号', action: '学生注册', name: displayName, className, route: 'register' });
        return { ok: true, user: u };
    } catch (e) {
        const msg = /already exists|unique|already been taken/i.test(e.message) ? '该学号/用户名已被注册' : (e.message || '注册失败');
        return { ok: false, msg };
    }
}

function apiLogout() {
    saveSession('', null);
    return { ok: true };
}

async function apiMe() {
    // PocketBase 没有"当前用户"端点，但 auth 集合允许本人读自己，
    // 所以按缓存里的 id 取一次：改昵称/换班级后刷新即可生效，
    // 取不到（token 失效）就清掉会话按未登录处理。
    if (!TOKEN || !ME) return { ok: true, user: null };
    try {
        const rec = await pbFetch('GET', `/api/collections/users/records/${ME.id}`);
        const u = userSelf(rec);
        saveSession(TOKEN, u);
        return { ok: true, user: u };
    } catch (e) {
        if (e.status === 401 || e.status === 403) {
            saveSession('', null);
            // 缓存的会话实际已失效：首页章节卡刚才按旧身份回填过，撤回成"未开始"
            refreshChapterProgress();
        }
        return { ok: true, user: ME };
    }
}

async function apiChangePassword(oldPassword, newPassword) {
    if (!ME) return { ok: false, msg: '未登录' };
    if (!newPassword || String(newPassword).length < PWD_MIN) return { ok: false, msg: `新密码至少 ${PWD_MIN} 位` };
    try {
        // PocketBase 改密码必须在 PATCH 里带 oldPassword 让服务端验证。
        // 实测：只带 password/passwordConfirm 会被 400 拒绝，报
        // oldPassword validation_required。以前这里用旧密码重新登录一次
        // 代替验证，PATCH 本身不带 oldPassword —— 结果修改永远失败，
        // 还被 400 兜底误报成"原密码错误"。
        await pbFetch('PATCH', `/api/collections/users/records/${ME.id}`, {
            oldPassword, password: newPassword, passwordConfirm: newPassword,
        });
        // PocketBase 在改密成功的那一刻作废当前令牌（实测：带着旧令牌再发
        // 任何请求都是 404 "The requested resource wasn't found"）。本地会话
        // 不清掉的话，界面还停在"已登录"，后续操作全部 404 —— 用户会以为
        // 是改密码把账号弄坏了。清掉并让调用方引导重新登录。
        saveSession('', null);
        return { ok: true, relogin: true };
    } catch (e) {
        if (e.status === 404) return { ok: false, msg: '登录状态已失效，请刷新页面重新登录后再修改密码' };
        const bad = e.data && e.data.oldPassword;
        if (bad) return { ok: false, msg: bad.code === 'validation_required' ? '请填写原密码' : '原密码错误' };
        return { ok: false, msg: e.message || '修改失败' };
    }
}

// ---------- 行为埋点（供 track.js 调用） ----------
let trackQueue = [], trackTimer = null;
function track(item) {
    if (!item || !item.module) return;
    // 已登录就绑定到真实身份，防止客户端随便填别人的名字
    trackQueue.push(Object.assign({}, item, {
        name: ME ? (ME.displayName || '') : (item.name || ''),
        className: ME ? (ME.className || '') : (item.className || ''),
    }));
    if (trackQueue.length >= 20) return flushTrack();
    clearTimeout(trackTimer);
    trackTimer = setTimeout(flushTrack, 3000);
}
async function flushTrack() {
    clearTimeout(trackTimer);
    const batch = trackQueue.splice(0, 100);
    if (!batch.length) return;
    const day = todayStr();
    try {
        // events 的 createRule 是开放的（学生端也在写），一条一条建
        for (const it of batch) {
            await create('events', {
                ts: Number(it.t) || Date.now(), day,
                name: String(it.name || '').slice(0, 30),
                className: String(it.className || '').slice(0, 50),
                module: String(it.module || '').slice(0, 60),
                action: String(it.action || '').slice(0, 60),
                extra: String(it.extra || '').slice(0, 500),
                route: String(it.route || '').slice(0, 120),
                ip: '',
            });
        }
    } catch (e) { /* 埋点失败不该打断课堂，静默丢弃 */ }
}

// ============================================================
// 课堂互动
// ============================================================
async function rosterNames(clsName) {
    const rows = await listAll('roster', { filter: `className = ${q(clsName)}`, sort: 'name' });
    return rows.map(r => r.name);
}

async function apiState(clsName) {
    clsName = clsName || '默认班级';
    const [lv, roster, signs, qs, ans] = await Promise.all([
        first('live_state', `className = ${q(clsName)}`),
        listAll('roster', { filter: `className = ${q(clsName)}`, sort: 'name' }),
        listAll('signins', { filter: `className = ${q(clsName)} && day = ${q(todayStr())}`, sort: 'signedAt' }),
        listAll('questions', { filter: `className = ${q(clsName)}`, sort: 'pushedAt' }),
        listAll('answers', { filter: `className = ${q(clsName)}` }),
    ]);
    const resetAt = lv && lv.resetAt ? isoOf(lv.resetAt) : '';
    const signed = {};
    for (const s of signs) {
        signed[s.name] = { sid: s.sid || '', time: timeOf(s.signedAt), ua: s.ua || '', guest: !!s.guest };
    }
    const ansByQ = {};
    for (const a of ans) (ansByQ[a.qid] = ansByQ[a.qid] || []).push(a);
    const answers = {}, history = [];
    for (const qu of qs) {
        // 复位时间之后的题目才算本轮；复位之前的历史只在 closed 时进 history
        if (resetAt && qu.pushedAt && isoOf(qu.pushedAt) < resetAt && !qu.closedAt) continue;
        const amap = {};
        for (const a of (ansByQ[qu.qid] || [])) {
            amap[a.name] = {
                choice: a.choice, choiceText: a.choiceText,
                time: timeOf(a.answeredAt), correct: a.correct === null || a.correct === undefined ? null : !!a.correct,
            };
        }
        answers[qu.qid] = amap;
        if (qu.closedAt) {
            history.push({
                q: {
                    id: qu.qid, text: qu.text, options: qu.options || null,
                    answer: qu.answer, ch: qu.chapter, pushedAt: isoOf(qu.pushedAt),
                },
                answers: amap,
            });
        }
    }
    return {
        ok: true,
        roster: roster.map(r => r.name),
        signed, current: (lv && lv.currentJson) || null,
        answers, history,
    };
}

async function apiSignin(body, ua) {
    const clsName = String(body.class || '默认班级');
    const name = String(body.name || '').trim();
    if (!name) return { ok: false, msg: '请填写姓名' };
    const names = await rosterNames(clsName);
    const known = names.length === 0 || names.includes(name);

    // 重复签到不做"先查后写"：signins 的读取限教职工，而签到页是匿名的，
    // 查了也只能拿到空数组，dup 永远是 false。改成直接写，让
    // idx_signins_once 这个唯一索引在数据库里把第二条挡回去。
    let dup = false;
    try {
        await create('signins', {
            className: clsName, name, sid: String(body.sid || '').trim(),
            ua: String(ua || '').slice(0, 80), guest: !known && names.length > 0,
            day: todayStr(), signedAt: new Date().toISOString(),
        });
    } catch (e) {
        if (isDupErr(e)) dup = true;
        else return { ok: false, msg: '签到失败，请重试' };
    }
    if (!dup) {
        try {
            await create('events', {
                ts: Date.now(), day: todayStr(), name, className: clsName,
                module: '课堂互动', action: '扫码签到', extra: '', route: '', ip: '',
            });
        } catch (e) { /* 埋点失败不影响签到 */ }
    }
    const st = await apiState(clsName);
    return { ok: true, dup, msg: dup ? '你已经签到过了' : '签到成功！', hasQuestion: !!st.current };
}

async function apiAnswer(body) {
    const clsName = String(body.class || '默认班级');
    const name = String(body.name || '').trim();
    const qid = body.qid;
    const lv = await first('live_state', `className = ${q(clsName)}`);
    const cur = lv && lv.currentJson;
    if (!name || !qid || !cur || qid !== cur.id) return { ok: false, msg: '当前没有进行中的答题' };
    const choice = parseInt(body.choice);
    const correct = cur.answer >= 0 ? (choice === cur.answer ? 1 : 0) : null;
    const rec = {
        qid, className: clsName, name, choice,
        choiceText: cur.options ? cur.options[choice] : String(body.choice),
        correct, answeredAt: new Date().toISOString(),
    };
    // 记录 id 由 qid+班级+姓名算出来，不随机。这样"改答案"是往同一个 id 上覆盖，
    // 不需要先查出旧记录 —— answers 的读取限教职工，匿名学生查不到自己那条，
    // 照旧写法只能无脑 append，统计会把一次作答数成两次。
    const id = detId('ans', qid, clsName, name);
    try {
        try {
            await create('answers', { ...rec, id });
        } catch (e) {
            if (!isDupErr(e) && e.status !== 400) throw e;
            await update('answers', id, rec);
        }
    } catch (e) {
        return { ok: false, msg: '提交失败，请重试' };
    }
    try {
        await create('events', {
            ts: Date.now(), day: todayStr(), name, className: clsName,
            module: '课堂互动', action: '实时答题', extra: String(cur.text || '').slice(0, 30), route: '', ip: '',
        });
    } catch (e) { /* 埋点失败不影响作答 */ }
    return { ok: true, msg: '已提交' };
}

async function ensureLive(clsName) {
    let lv = await first('live_state', `className = ${q(clsName)}`);
    if (!lv) {
        lv = await create('live_state', { className: clsName, currentJson: null, resetAt: new Date().toISOString() });
    }
    return lv;
}

async function apiPush(body) {
    const clsName = String(body.class || '默认班级');
    const qu = {
        id: 'q' + Date.now(),
        text: body.text || '',
        options: body.options || null,
        answer: typeof body.answer === 'number' ? body.answer : -1,
        ch: body.ch || 0,
    };
    const now = new Date().toISOString();
    const lv = await ensureLive(clsName);
    // 同题号先删后建：PocketBase 没有 SQLite 的 INSERT OR REPLACE
    const old = await first('questions', `qid = ${q(qu.id)} && className = ${q(clsName)}`);
    if (old) await remove('questions', old.id);
    await create('questions', {
        qid: qu.id, className: clsName, text: qu.text, options: qu.options,
        answer: qu.answer, chapter: qu.ch, pushedAt: now, closedAt: '',
    });
    await update('live_state', lv.id, { currentJson: Object.assign({}, qu, { pushedAt: now }) });
    return { ok: true, id: qu.id };
}

async function apiCloseQuestion(clsName) {
    clsName = clsName || '默认班级';
    const lv = await first('live_state', `className = ${q(clsName)}`);
    if (!lv || !lv.currentJson) return { ok: true };
    const cur = lv.currentJson;
    const qu = await first('questions', `qid = ${q(cur.id)} && className = ${q(clsName)}`);
    if (qu) await update('questions', qu.id, { closedAt: new Date().toISOString() });
    await update('live_state', lv.id, { currentJson: null });
    return { ok: true };
}

async function apiReset(clsName) {
    clsName = clsName || '默认班级';
    const lv = await ensureLive(clsName);
    await update('live_state', lv.id, { currentJson: null, resetAt: new Date().toISOString() });
    return { ok: true };
}

async function apiRoster(body) {
    const clsName = String(body.className || body.class || '').trim();
    if (!clsName) return { ok: false, msg: '缺少班级名' };
    const list = Array.isArray(body.roster || body.students) ? (body.roster || body.students) : [];
    const rows = list.map(it => {
        let name, sid;
        if (typeof it === 'string') { name = it.trim(); sid = ''; }
        else { name = String(it.name || '').trim(); sid = String(it.sid || '').trim(); }
        // 防"学号,姓名"写反：姓名一栏是纯数字（学号的长相）而学号一栏
        // 是文字，就是写反了 —— 自动换回来。以前没有这道判断，老师把
        // 名册整批存反后，课堂点名/签到满屏学号。
        if (/^\d{4,}$/.test(name) && sid && !/^\d+$/.test(sid)) { const t = name; name = sid; sid = t; }
        return { name, sid };
    }).filter(s => s.name);
    const old = await listAll('roster', { filter: `className = ${q(clsName)}` });
    for (const r of old) await remove('roster', r.id);
    for (const r of rows) await create('roster', { className: clsName, name: r.name, sid: r.sid || '' });
    if (!old.length && !rows.length) { /* 都没有就不建班 */ }
    return { ok: true, count: list.length };
}

async function apiStateDates(clsName) {
    const rows = await listAll('signins', { filter: clsName ? `className = ${q(clsName)}` : '', fields: 'day' });
    return { ok: true, days: [...new Set(rows.map(r => r.day))].sort().reverse().slice(0, 60) };
}

// ============================================================
// 管理端
// ============================================================
async function classesWithCount() {
    const [cs, ros, us] = await Promise.all([
        listAll('classes', { sort: 'created' }),
        listAll('roster', { fields: 'className' }),
        listAll('users', { fields: 'className,role' }),
    ]);
    return cs.map(c => Object.assign({}, c, {
        roster_count: ros.filter(r => r.className === c.name).length,
        account_count: us.filter(u => u.className === c.name && u.role === 'student').length,
        created_at: isoOf(c.created),
    }));
}

async function apiOverview() {
    const day = todayStr();
    const [signs, users, classes, ros, chaps, ress, qs, bank, ans, evs, sets] = await Promise.all([
        listAll('signins', { filter: `day = ${q(day)}`, fields: 'name' }),
        listAll('users', { fields: 'role' }),
        listAll('classes', { fields: 'id' }),
        listAll('roster', { fields: 'id' }),
        listAll('chapters', { fields: 'id' }),
        listAll('resources', { fields: 'id' }),
        listAll('questions', { fields: 'id' }),
        listAll('question_bank', { fields: 'id' }),
        listAll('answers', { fields: 'correct' }),
        listAll('events', { sort: '-ts' }),
        listAll('settings'),
    ]);
    const graded = ans.filter(a => a.correct !== null && a.correct !== undefined);
    const ok = graded.filter(a => a.correct).length;
    const sm = Object.fromEntries(sets.map(s => [s.key, s.value]));
    return {
        ok: true,
        today: { signins: signs.length, students: new Set(signs.map(s => s.name)).size },
        counts: {
            users: users.length,
            students: users.filter(u => u.role === 'student').length,
            classes: classes.length, roster: ros.length, chapters: chaps.length,
            resources: ress.length, questions: qs.length, bank: bank.length,
            answers: ans.length, events: evs.length,
        },
        recent: evs.slice(0, 12).map(e => ({
            ts: e.ts, name: e.name, class_name: e.className, module: e.module,
            action: e.action, extra: e.extra,
        })),
        accuracy: graded.length ? Math.round(ok / graded.length * 1000) / 10 : null,
        course: {
            name: sm.course_name, code: sm.course_code, semester: sm.semester, school: sm.school,
        },
    };
}

async function apiUsers(query) {
    const role = query.role || '', qq = query.q || '', cls = query.class || '';
    let rows = await listAll('users', { sort: 'role,className,email' });
    rows = rows.map(userOut);
    if (role) rows = rows.filter(u => u.role === role);
    if (cls) rows = rows.filter(u => u.class_name === cls);
    if (qq) rows = rows.filter(u => u.username.includes(qq) || u.display_name.includes(qq));
    return { ok: true, users: rows };
}

async function apiUserCreate(body) {
    const { username, password, displayName, role, className, note } = body;
    if (!username || !password) return { ok: false, msg: '用户名与密码必填' };
    // PocketBase 对密码长度的校验只会回一句 "Failed to create record."，
    // 先自己拦一道，把真实原因告诉老师
    if (String(password).length < PWD_MIN) return { ok: false, msg: `密码至少 ${PWD_MIN} 位` };
    if (!['admin', 'teacher', 'student'].includes(role)) return { ok: false, msg: '角色不合法' };
    try {
        const rec = await create('users', {
            email: mailOf(username), username,
            password, passwordConfirm: password,
            displayName: displayName || username, role, className: className || '', note: note || '',
        });
        return { ok: true, user: userOut(rec) };
    } catch (e) {
        return { ok: false, msg: /already exists|unique|already been taken/i.test(e.message) ? '用户名已存在' : (e.message || '创建失败') };
    }
}

async function apiUserUpdate(id, body) {
    const patch = {};
    if (body.displayName !== undefined) patch.displayName = body.displayName;
    if (body.role !== undefined) patch.role = body.role;
    if (body.className !== undefined) patch.className = body.className;
    if (body.note !== undefined) patch.note = body.note;
    if (body.disabled !== undefined) patch.disabled = !!body.disabled;
    if (body.password) { patch.password = body.password; patch.passwordConfirm = body.password; }
    try {
        const rec = await update('users', id, patch);
        return { ok: true, user: userOut(rec) };
    } catch (e) {
        return { ok: false, msg: e.status === 404 ? '用户不存在' : (e.message || '更新失败') };
    }
}

async function apiUserDelete(id) {
    if (ME && ME.id === id) return { ok: false, msg: '不能删除当前登录账号' };
    try { await remove('users', id); return { ok: true }; }
    catch (e) { return { ok: false, msg: e.status === 404 ? '用户不存在' : '删除失败' }; }
}

async function apiGenStudents(body) {
    const clsName = body.className || '';
    const rows = await listAll('roster', { filter: `className = ${q(clsName)}` });
    let created = 0, skipped = 0;
    const errors = [];
    for (const r of rows) {
        const sid = r.sid || r.name;
        // 判重按 username 查，不按 email —— 教职工 token 读不到 email，
        // 按 email 过滤会永远查不到，于是重复生成时撞唯一索引。
        const exist = await first('users', `username = ${q(String(sid))}`, 'id');
        if (exist) { skipped++; continue; }
        try {
            const pwd = body.defaultPassword || pwdFromSid(r.sid || r.name) || PWD_DEFAULT;
            await create('users', {
                email: mailOf(sid), username: String(sid),
                password: pwd, passwordConfirm: pwd,
                displayName: r.name, role: 'student', className: clsName,
            });
            created++;
        } catch (e) {
            // 这里原来直接算成"已跳过"，把真实错误吞了：密码不合规、用户名撞车
            // 全都表现为"已生成 0 个"，老师完全看不出出了什么事。单独计失败。
            errors.push({ name: r.name, sid: String(sid), msg: e.message || '创建失败' });
        }
    }
    return { ok: true, created, skipped, errorCount: errors.length, errors: errors.slice(0, 50) };
}

// 学生综合报表：签名天数 / 答题正确率 / 活跃度
async function studentReport(clsName) {
    const [ros, signs, anss, evs] = await Promise.all([
        listAll('roster', { filter: clsName ? `className = ${q(clsName)}` : '' }),
        listAll('signins', { filter: clsName ? `className = ${q(clsName)}` : '' }),
        listAll('answers', { filter: clsName ? `className = ${q(clsName)}` : '' }),
        listAll('events', { filter: clsName ? `className = ${q(clsName)}` : '', fields: 'name,ts' }),
    ]);
    const names = new Set([...ros.map(r => r.name), ...signs.map(s => s.name), ...anss.map(a => a.name)]);
    const score = n => {
        const ss = signs.filter(s => s.name === n);
        const aa = anss.filter(a => a.name === n);
        const ee = evs.filter(e => e.name === n);
        const total = aa.length;
        const right = aa.filter(a => a.correct === true || a.correct === 1).length;
        return {
            name: n,
            sid: (ros.find(r => r.name === n) || {}).sid || '',
            inRoster: ros.some(r => r.name === n),
            signDays: new Set(ss.map(s => s.day)).size,
            lastSign: ss.length ? ss.map(s => s.signedAt).sort().pop() : '',
            totalAnswers: total, rightAnswers: right,
            accuracy: total ? Math.round(right / total * 1000) / 10 : null,
            activity: ee.length,
            lastActive: ee.length ? new Date(Math.max.apply(null, ee.map(e => Number(e.ts) || 0))).toISOString() : '',
        };
    };
    const out = [...names].map(score);
    const w = r => (r.signDays * 40 + (r.accuracy || 0) + Math.min(r.activity, 40));
    out.sort((a, b) => w(b) - w(a));
    return out;
}

async function apiSigninTrend(days) {
    days = Math.min(Number(days) || 30, 120);
    const from = daysAgo(days);
    const rows = await listAll('signins', { filter: `day >= ${q(from)}`, fields: 'day,name' });
    const map = new Map();
    for (const r of rows) {
        const e = map.get(r.day) || { day: r.day, n: 0, students: new Set() };
        e.n++; e.students.add(r.name); map.set(r.day, e);
    }
    const days_ = [...map.keys()].sort();
    return {
        ok: true, days: days_,
        counts: days_.map(d => map.get(d).n),
        students: days_.map(d => map.get(d).students.size),
    };
}

async function apiQuizAnalysis(clsName) {
    const qs = await listAll('questions', {
        filter: (clsName ? `className = ${q(clsName)} && ` : '') + 'closedAt != ""',
        sort: '-pushedAt',
    });
    const anss = await listAll('answers', { filter: clsName ? `className = ${q(clsName)}` : '' });
    return {
        ok: true,
        questions: qs.map(qu => {
            const mine = anss.filter(a => a.qid === qu.qid && a.className === qu.className);
            const right = mine.filter(a => a.correct === true || a.correct === 1).length;
            return Object.assign({}, qu, {
                pushed_at: isoOf(qu.pushedAt), closed_at: isoOf(qu.closedAt),
                total: mine.length, right_cnt: right,
                accuracy: mine.length ? Math.round(right / mine.length * 1000) / 10 : null,
            });
        }).slice(0, 200),
    };
}

async function apiModules(days) {
    days = Math.min(Number(days) || 14, 90);
    const from = daysAgo(days);
    const rows = await listAll('events', { filter: `day >= ${q(from)}`, fields: 'module,action,day' });
    const byMod = new Map(), byAct = new Map(), byDay = new Map();
    for (const e of rows) {
        byMod.set(e.module, (byMod.get(e.module) || 0) + 1);
        const k = e.module + '\u0000' + e.action;
        byAct.set(k, (byAct.get(k) || 0) + 1);
        byDay.set(e.day, (byDay.get(e.day) || 0) + 1);
    }
    const modules = [...byMod].map(([module, n]) => ({ module, n })).sort((a, b) => b.n - a.n).slice(0, 30);
    const trend = [...byDay].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([day, n]) => ({ day, n }));
    const actions = [...byAct].map(([k, n]) => {
        const [module, action] = k.split('\u0000');
        return { module, action, n };
    }).sort((a, b) => b.n - a.n).slice(0, 50);
    return { ok: true, modules, trend, actions };
}

async function apiStudentDetail(query) {
    const name = query.name || '', clsName = query.class || '';
    // 按人过滤。class 为空时不加班级条件（= 看这个人全部记录）
    const F = `${q(name)} && (${clsName ? `className = ${q(clsName)}` : 'true = true'})`;
    const [sg, an, qs, ev] = await Promise.all([
        listAll('signins', { filter: F, sort: '-day' }),
        listAll('answers', { filter: F, sort: '-answeredAt' }),
        listAll('questions', { fields: 'qid,className,text,chapter' }),
        listAll('events', { filter: `name = ${q(name)}` }),
    ]);
    const qMap = new Map();
    for (const qu of qs) qMap.set(qu.qid + '\u0000' + qu.className, qu);
    const signs = sg.slice(0, 90).map(s => ({ day: s.day, signed_at: isoOf(s.signedAt) }));
    const answers = an.slice(0, 200).map(a => {
        const qu = qMap.get(a.qid + '\u0000' + a.className) || {};
        return {
            qid: a.qid, choice_text: a.choiceText, correct: a.correct,
            answered_at: isoOf(a.answeredAt), text: qu.text || '', chapter: qu.chapter || 0,
        };
    });
    const byChapter = [];
    for (const a of an) {
        const qu = qMap.get(a.qid + '\u0000' + a.className);
        if (!qu || a.correct === null || a.correct === undefined) continue;
        let e = byChapter.find(c => c.chapter === qu.chapter);
        if (!e) { e = { chapter: qu.chapter, total: 0, ok: 0 }; byChapter.push(e); }
        e.total++;
        if (a.correct === true || a.correct === 1) e.ok++;
    }
    byChapter.sort((a, b) => a.chapter - b.chapter);
    const byMA = new Map();
    for (const e of ev) {
        const k = e.module + '\u0000' + e.action;
        byMA.set(k, (byMA.get(k) || 0) + 1);
    }
    const events = [...byMA].map(([k, n]) => {
        const [module, action] = k.split('\u0000');
        return { module, action, n };
    }).sort((a, b) => b.n - a.n).slice(0, 20);
    const byDay = new Map();
    for (const e of ev) byDay.set(e.day, (byDay.get(e.day) || 0) + 1);
    const evTrend = [...byDay].map(([day, n]) => ({ day, n })).sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 30);
    return { ok: true, signs, answers, byChapter, events, evTrend };
}

async function apiStudentMe() {
    if (!ME) return { ok: false, msg: '未登录' };
    const name = ME.displayName || '', clsName = ME.className || '';
    // 这里原来漏了 "name =" ，拼出来是个光秃秃的字符串字面量，
    // PocketBase 直接判成语法错误返回 400，整个学情页就停在登录态。
    // 集合规则本身已经按 displayName+className 收口过了，这个 filter 只是精确匹配一下。
    const F = clsName ? `name = ${q(name)} && className = ${q(clsName)}` : `name = ${q(name)}`;
    const [sg, an, qs, ev] = await Promise.all([
        listAll('signins', { filter: F }),
        listAll('answers', { filter: F, sort: '-answeredAt' }),
        listAll('questions', { fields: 'qid,className,text,chapter' }),
        listAll('events', { filter: `name = ${q(name)}`, sort: '-ts' }),
    ]);
    const qMap = new Map();
    for (const qu of qs) qMap.set(qu.qid + '\u0000' + qu.className, qu);
    const total = an.length, right = an.filter(a => a.correct === true || a.correct === 1).length;
    const byChapter = [];
    for (const a of an) {
        const qu = qMap.get(a.qid + '\u0000' + a.className);
        if (!qu || a.correct === null || a.correct === undefined) continue;
        let e = byChapter.find(c => c.chapter === qu.chapter);
        if (!e) { e = { chapter: qu.chapter, total: 0, ok: 0 }; byChapter.push(e); }
        e.total++; if (a.correct === true || a.correct === 1) e.ok++;
    }
    byChapter.sort((a, b) => a.chapter - b.chapter);
    const byDay = new Map();
    for (const e of ev) byDay.set(e.day, (byDay.get(e.day) || 0) + 1);
    const evTrend = [...byDay].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([day, n]) => ({ day, n })).slice(0, 30);
    const byMod = new Map();
    for (const e of ev) byMod.set(e.module, (byMod.get(e.module) || 0) + 1);
    const modules = [...byMod].map(([module, n]) => ({ module, n })).sort((a, b) => b.n - a.n).slice(0, 10);
    const recentAns = an.slice(0, 20).map(a => {
        const qu = qMap.get(a.qid + '\u0000' + a.className) || {};
        return {
            choice_text: a.choiceText, correct: a.correct, answered_at: isoOf(a.answeredAt),
            text: qu.text || '', chapter: qu.chapter || 0,
        };
    });
    const recentEv = ev.slice(0, 20).map(e => ({
        ts: e.ts, module: e.module, action: e.action, extra: e.extra,
    }));
    // 访问过哪些章节（首页章节卡的真实进度用）：埋点口径是
    // module=课程章节 / action=访问第N章（track.js）
    const visitedChapters = [...new Set(ev
        .filter(e => e.module === '课程章节')
        .map(e => { const m = String(e.action || '').match(/访问第(\d+)章/); return m ? Number(m[1]) : 0; })
        .filter(Boolean))];
    return {
        ok: true,
        profile: {
            username: ME.username, name, className: clsName, role: ME.role,
            lastLoginAt: isoOf(ME.lastLoginAt) || null,
        },
        stats: {
            signDays: new Set(sg.map(s => s.day)).size,
            lastSign: sg.length ? sg.map(s => s.signedAt).sort().pop() : '',
            answers: total, rightAnswers: right,
            accuracy: total ? Math.round(right / total * 1000) / 10 : null,
        },
        byChapter, visitedChapters, evTrend, modules, recentAns, recentEv,
    };
}

// ---------- 课堂工具用：管理端班级名列表 ----------
// classes 集合匿名可读（签到页/课堂大屏要在未登录时渲染班级）。
// 按创建时间倒序：课堂工具"当前班级不存在时自动切换"要选老师最近建的班。
async function loadClassNames() {
    if (typeof location !== 'undefined' && !location.protocol.startsWith('http')) return [];
    try {
        const rows = await listAll('classes', { sort: '-created', fields: 'name' });
        return rows.map(r => r.name).filter(Boolean);
    } catch (e) { return []; }
}

// ---------- 课堂工具共用的班级选择器 ----------
// 把一个 <select> 变成"管理端班级选择器"：选项=管理端班级（新→旧），
// 智能点名/大屏/随机分组共用 zhkc_tool_class 记忆（换工具不换班），
// 上次班级已被删除时自动切到最新建的班级，change 时自动记住并回调。
async function setupClassSelect(sel, onChange) {
    if (!sel) return '';
    let names = [];
    if (typeof location !== 'undefined' && location.protocol.startsWith('http')) {
        try { names = await loadClassNames() || []; } catch (e) {}
    }
    if (!names.length) names = ['示例班级'];   // 离线/无班级：保留演示选项
    sel.innerHTML = '';
    names.forEach(n => sel.appendChild(new Option(n, n)));
    let saved = '';
    try { saved = localStorage.getItem('zhkc_tool_class') || ''; } catch (e) {}
    let wanted = saved || '示例班级';
    if (!names.includes(wanted)) wanted = names[0];
    sel.value = wanted;
    sel.addEventListener('change', () => {
        try { localStorage.setItem('zhkc_tool_class', sel.value.trim()); } catch (e) {}
        onChange && onChange();
    });
    return wanted;
}

// ---------- 首页章节卡的真实学习进度 ----------
// 卡片里原来写死着 75%/50% 的装饰数字，新注册的账号一节课没上
// 也"已有进度"。现在改成三档真实口径，与学情中心同源：
//   未开始 0%   —— 该章无任何学习记录
//   已浏览 50%  —— 本人埋点里有该章访问记录
//   已作答 100% —— 该章有过课堂作答
// 未登录一律"未开始"。index.html 每张卡带 data-chapter，这里按序号回填。
async function refreshChapterProgress() {
    const cards = document.querySelectorAll('.chapter-progress[data-chapter]');
    if (!cards.length) return;
    const set = (el, pct, label) => {
        const fill = el.querySelector('.progress-fill');
        const lbl = el.querySelector('.progress-label');
        if (fill) { fill.dataset.width = pct + '%'; fill.style.width = pct + '%'; }
        if (lbl) lbl.textContent = label;
    };
    let byChapter = [], visited = [];
    if (ME) {
        try {
            const me = await apiStudentMe();
            if (me.ok) { byChapter = me.byChapter || []; visited = me.visitedChapters || []; }
        } catch (e) { /* 拉不到就全部显示未开始 */ }
    }
    cards.forEach(el => {
        const ch = Number(el.dataset.chapter) || 0;
        const answered = byChapter.some(c => c.chapter === ch && c.total > 0);
        const seen = visited.includes(ch);
        if (answered) set(el, 100, '已作答');
        else if (seen) set(el, 50, '已浏览');
        else set(el, 0, '未开始');
    });
}

// ---------- 课程内容 / 资源 / 题库 的通用增删改 ----------
// chapters、resources 的 idx/sort 是前端自己给的序号，PocketBase 的 id 是随机串，
// 所以额外用 idx 当业务主键回查，避免前端存 PocketBase 的 id 又改不了 idx。
async function upsertByIdx(coll, body, keyField, orderField) {
    const patch = {
        title: body.title, subtitle: body.subtitle || '', hours: body.hours || '',
        summary: body.summary || '', url: body.url || '',
        status: body.status || '已发布', updatedAt: new Date().toISOString(),
    };
    if (keyField === 'idx') patch.idx = Number(body.idx) || 0;
    if (body.id) {
        // 前端可能传旧的数字 id，也可能已经是 PocketBase 的 id，两种都试
        try { await update(coll, body.id, patch); return { ok: true, action: 'updated' }; } catch (e) { /* 落到下面按业务键找 */ }
    }
    const old = await first(coll, `${keyField} = ${Number(body[keyField]) || 0}`);
    if (old) { await update(coll, old.id, patch); return { ok: true, action: 'updated' }; }
    await create(coll, patch);
    return { ok: true, action: 'created' };
}

async function apiChapters() {
    const rows = await listAll('chapters', { sort: 'idx' });
    return {
        ok: true,
        chapters: rows.map((c, i) => Object.assign({}, c, { id: c.idx, updated_at: isoOf(c.updatedAt) })),
    };
}
async function apiResources() {
    const rows = await listAll('resources', { sort: 'sort,created' });
    return {
        ok: true,
        resources: rows.map((r, i) => Object.assign({}, r, { id: r.id, sort: r.sort || 0 })),
    };
}
async function apiBank(query) {
    const ch = Number(query.chapter) || 0;
    const rows = await listAll('question_bank', { filter: ch ? `chapter = ${ch}` : '', sort: 'chapter,created' });
    return { ok: true, questions: rows };
}

// ============================================================
// 模板导入
// ============================================================
// 每种"可以新增的内容"在这里登记一份定义：表头顺序、示例行、怎么把一行
// 单元格变成一条记录、怎么落库。下载模板和实际写库共用这同一份，避免模板
// 列名和写库字段各写一遍之后对不上 —— 那种 bug 平时看不出来，等真去导入时
// 才发现整列是空的。
//
// 表头里的 * 只是给人看的提示，导入时按"去掉星号后的列名"匹配，删掉星号
// 不影响；用户调整了列顺序也能对上。

// 表头归一化：去空格、去必填星号、去掉括号里的说明。
// （角色（admin/teacher）这类括号注释不该参与匹配，否则模板改了说明就匹配不上）
function normHead(h) {
    return String(h == null ? '' : h)
        .replace(/[　\s]/g, '')
        .replace(/\*+$/, '')
        .replace(/[（(][^）)]*[）)]/g, '')
        .trim();
}

const DIFFICULTIES = ['简单', '中等', '困难'];
// 难度归一化。这里特意把「易 / 难」也认了：后台那个下拉框一直写的是「易/中等/难」，
// 而 PocketBase 的 schema 只认「简单/中等/困难」，老师手边旧的题目文档里多半
// 也是前一种写法。模板导入不该因为一个词就整行失败。
function normDifficulty(v) {
    const s = String(v == null ? '' : v).replace(/[　\s]/g, '');
    if (!s) return '中等';
    if (/^(易|简单|1)$/.test(s)) return '简单';
    if (/^(中等|一般|2)$/.test(s)) return '中等';
    if (/^(难|困难|3)$/.test(s)) return '困难';
    return null;
}

function normRole(v) {
    const s = String(v == null ? '' : v).replace(/[　\s]/g, '').toLowerCase();
    if (!s) return 'student';
    if (/^(管理员|admin|超管|superuser|root)$/.test(s)) return 'admin';
    if (/^(教师|老师|teacher|讲师)$/.test(s)) return 'teacher';
    if (/^(学生|student|学员)$/.test(s)) return 'student';
    return null;
}

// 正确答案支持 A/B/C/D，也支持直接写 1/2/3/4。
function normAnswer(v, n) {
    const s = String(v == null ? '' : v).replace(/[　\s]/g, '').toUpperCase();
    if (!s) return null;
    if (/^[A-Z]$/.test(s)) {
        const i = s.charCodeAt(0) - 65;
        return i >= 0 && i < n ? i : null;
    }
    const i = Number(s);
    return (Number.isInteger(i) && i >= 1 && i <= n) ? i - 1 : null;
}

const IMPORT_SPECS = {
    classes: {
        label: '班级',
        headers: ['班级名称*', '班主任'],
        sample: [
            ['2025级神经网络与深度学习1班', '张老师'],
            ['2025级神经网络与深度学习2班', '李老师'],
        ],
        notes: [
            '班级名称必填。同名班级已存在时不会重复建，而是更新它的班主任。',
            '也可以直接在这里把班级建出来，之后再去「班级与名册」导入学生名单。',
        ],
        async apply(row) {
            const name = String(row[0] || '').trim();
            const advisor = String(row[1] || '').trim();
            if (!name) return { err: '班级名称不能为空' };
            const old = await first('classes', `name = ${q(name)}`);
            if (old) {
                if (advisor && old.advisor !== advisor) await update('classes', old.id, { advisor });
                return { r: 'updated' };
            }
            await create('classes', { name, advisor });
            return { r: 'created' };
        },
    },

    roster: {
        label: '班级名册',
        headers: ['班级名称*', '姓名*', '学号'],
        sample: [
            ['2025级神经网络与深度学习1班', '张三', '20250101'],
            ['2025级神经网络与深度学习1班', '李四', '20250102'],
        ],
        notes: [
            '姓名必填。同一班里同名学生只留一条，原先没填学号的会被补上。',
            '名册里出现的班级如果还不存在，会自动建出来。',
            '导入模式选「覆盖」会先清空该班原有名册再写入；默认是「追加」。',
            '导入完可以点「一键生成学生账号」批量开账号。',
        ],
        async apply(row, mode, ctx) {
            const clsName = String(row[0] || '').trim();
            let name = String(row[1] || '').trim();
            let sid = String(row[2] || '').trim();
            if (!clsName) return { err: '班级名称不能为空' };
            if (!name) return { err: '姓名不能为空' };
            // 防"学号,姓名"两列写反：姓名列是纯数字、学号列是文字时自动换回
            if (/^\d{4,}$/.test(name) && sid && !/^\d+$/.test(sid)) { const t = name; name = sid; sid = t; }

            // 名册引用的班级顺手建出来，否则这批学生挂不到任何班级上，
            // 后面扫码签到按班级匹配时会对不上。
            if (!ctx.classSet.has(clsName)) {
                await create('classes', { name: clsName, advisor: '' });
                ctx.classSet.add(clsName);
                ctx.notes.push(`自动创建班级「${clsName}」`);
            }

            const old = await first('roster', `className = ${q(clsName)} && name = ${q(name)}`);
            if (old) {
                if (sid && !old.sid) await update('roster', old.id, { sid });
                return { r: 'skipped' };
            }
            await create('roster', { className: clsName, name, sid });
            return { r: 'created' };
        },
    },

    chapters: {
        label: '课程章节',
        headers: ['章节序号*', '章节标题*', '副标题', '学时', '摘要', '页面地址', '状态'],
        sample: [
            ['1', '神经网络与深度学习概述', '从生物学到计算机科学', '2', '课程整体脉络与学习方法', 'chapters/chapter1.html', '已发布'],
            ['2', '逻辑回归与分类', '从线性模型到决策边界', '4', '单层神经网络的数学基础', 'chapters/chapter2.html', '备课中'],
        ],
        notes: [
            '章节序号是业务主键：同一个序号已存在会被更新，不会重复建章节。',
            '状态只能填：已发布 / 备课中 / 归档。',
            '章节的写权限只有管理员有；教师账号导入会返回 403。',
        ],
        async apply(row) {
            const idxRaw = String(row[0] || '').trim();
            const idx = Number(idxRaw);
            if (!idxRaw || !Number.isFinite(idx)) return { err: `章节序号「${idxRaw}」必须是数字` };
            const title = String(row[1] || '').trim();
            if (!title) return { err: '章节标题不能为空' };
            const status = String(row[6] || '').trim() || '已发布';
            if (!['已发布', '备课中', '归档'].includes(status)) {
                return { err: `状态「${status}」不合法，只能填 已发布 / 备课中 / 归档` };
            }
            const res = await upsertByIdx('chapters', {
                idx, title,
                subtitle: String(row[2] || '').trim(),
                hours: String(row[3] || '').trim(),
                summary: String(row[4] || '').trim(),
                url: String(row[5] || '').trim(),
                status,
            }, 'idx');
            return { r: res.action === 'updated' ? 'updated' : 'created' };
        },
    },

    resources: {
        label: '学习资源',
        headers: ['分类*', '资源标题*', '链接', '备注', '排序'],
        sample: [
            ['教材', '《神经网络与深度学习》', 'https://example.com/book', '中科院自动化所组译', '1'],
            ['工具', 'TensorFlow Playground', 'https://playground.tensorflow.org', '课堂演示用', '2'],
        ],
        notes: [
            '分类 + 标题完全相同的视为同一条，会更新链接和备注，不会重复添加。',
            '排序留空按 0 处理，数字越小越靠前。',
        ],
        async apply(row) {
            const category = String(row[0] || '').trim();
            const title = String(row[1] || '').trim();
            if (!category) return { err: '分类不能为空' };
            if (!title) return { err: '资源标题不能为空' };
            const patch = {
                category, title,
                url: String(row[2] || '').trim(),
                note: String(row[3] || '').trim(),
                sort: Number(String(row[4] || '').trim()) || 0,
            };
            const old = await first('resources', `category = ${q(category)} && title = ${q(title)}`);
            if (old) { await update('resources', old.id, patch); return { r: 'updated' }; }
            await create('resources', patch);
            return { r: 'created' };
        },
    },

    bank: {
        label: '互动题库题目',
        headers: ['章节序号', '题目*', '选项A*', '选项B*', '选项C', '选项D', '正确答案*', '难度', '解析'],
        sample: [
            ['1', '下列哪个不是常见的激活函数？', 'ReLU', 'Sigmoid', 'Tanh', 'Softmax', 'D', '简单', 'Softmax 属于输出层归一化函数。'],
            ['2', '梯度消失通常出现在哪种网络结构中？', '浅层网络', '深层网络', '单神经元', '全连接单层', 'B', '中等', '层数越深，反向传播的连乘项越容易衰减到 0。'],
        ],
        notes: [
            '选项 A、B 必填；正确答案填 A/B/C/D，也可以填 1/2/3/4。',
            '难度填 简单 / 中等 / 困难；也兼容「易 / 难」这种旧写法。',
            '题干完全相同的题目会被跳过，不会重复入库 —— 已有的题目可能带着老师改过的解析。',
        ],
        async apply(row) {
            const text = String(row[1] || '').trim();
            if (!text) return { err: '题目不能为空' };
            // 选项是 2~5 列（0 章节、1 题干），答案是第 6 列
            const opts = [2, 3, 4, 5].map(i => String(row[i] || '').trim());
            while (opts.length > 2 && opts[opts.length - 1] === '') opts.pop();
            if (opts.length < 2 || opts.some(o => !o)) return { err: '至少要填两个选项，且不能有空选项' };

            const answer = normAnswer(row[6], opts.length);
            if (answer === null) return { err: `正确答案「${String(row[6] || '').trim()}」不合法，填 A/B/C/D 或 1-${opts.length}` };

            const diff = normDifficulty(row[7]);
            if (diff === null) return { err: `难度「${String(row[7] || '').trim()}」不合法，只能填 ${DIFFICULTIES.join(' / ')}` };

            const old = await first('question_bank', `text = ${q(text)}`);
            if (old) return { r: 'skipped' };

            await create('question_bank', {
                chapter: Number(String(row[0] || '').trim()) || 0,
                text, options: opts, answer, difficulty: diff,
                analysis: String(row[8] || '').trim(),
            });
            return { r: 'created' };
        },
    },

    users: {
        label: '账号',
        headers: ['用户名*', '姓名*', '初始密码', '角色', '班级', '备注'],
        sample: [
            ['teacher2', '王老师', 'Abcd1234', '教师', '', '备课组'],
            ['20250103', '赵六', '', '学生', '2025级神经网络与深度学习1班', ''],
        ],
        notes: [
            '用户名是登录账号；填纯数字时会自动当成学号处理（与「一键生成学生账号」规则一致）。',
            `初始密码至少 ${PWD_MIN} 位，留空默认 ${PWD_DEFAULT}；导入后请提醒学生尽快自行修改。`,
            '角色填 管理员 / 教师 / 学生，也可以填 admin / teacher / student；留空按学生处理。',
            '已存在的用户名会被跳过，不会覆盖原有账号的密码或角色。',
        ],
        async apply(row) {
            const username = String(row[0] || '').trim();
            const disp = String(row[1] || '').trim();
            if (!username) return { err: '用户名不能为空' };
            if (!disp) return { err: '姓名不能为空' };

            const role = normRole(row[3]);
            if (role === null) return { err: `角色「${String(row[3] || '').trim()}」不合法，只能填 管理员 / 教师 / 学生` };

            // 判重按 username 查。按 email 查是查不到的：教职工 token 读不到 email，
            // 结果就是"已存在"永远判否，重复导入直接撞唯一索引，报一句
            // "Failed to create record."。
            if (await first('users', `username = ${q(username)}`, 'id')) return { r: 'skipped' };

            // 密码在这里就拦一道。放给服务端的话，回的是一句没头没尾的
            // "Failed to create record."，老师根本看不出是自己密码写短了。
            const pwdRaw = String(row[2] || '').trim();
            if (pwdRaw && pwdRaw.length < PWD_MIN) return { err: `初始密码只有 ${pwdRaw.length} 位，至少要 ${PWD_MIN} 位` };
            const pwd = pwdRaw || PWD_DEFAULT;
            await create('users', {
                email: mailOf(username), username,
                password: pwd, passwordConfirm: pwd,
                displayName: disp, role,
                className: String(row[4] || '').trim(),
                note: String(row[5] || '').trim(),
            });
            return { r: 'created' };
        },
    },
};

// 列对齐：优先按列名匹配（用户调过列顺序、删掉可选项也能对上），
// 一个都对不上时退回按列顺序。
//
// 但有个坑：只匹配上 1 列不代表这份表是对的 —— 比如「账号」模板 6 列，
// 文件里只有一个"用户名"，按名字能对上 1 列，剩下的全部读成空，
// 最后每行都报"姓名不能为空"，老师完全看不出是自己下了个残缺的表。
// 所以只要**带星号的必填列**没被匹配上，且文件列数又不够按位置兜底，
// 就直接在开头拦下来，明确让他去下模板。
function mapColumns(specHeaders, fileHeaders) {
    const want = specHeaders.map(normHead);
    const got = (fileHeaders || []).map(normHead);
    const map = new Array(want.length).fill(-1);
    want.forEach((w, i) => {
        const at = got.indexOf(w);
        if (at >= 0) map[i] = at;
    });

    const missingRequired = specHeaders.filter((h, i) => /\*$/.test(String(h)) && map[i] < 0)
        .map(h => String(h).replace(/\*$/, ''));
    if (!missingRequired.length) return { map, byName: true };
    if (got.length >= want.length) {
        // 列数够但名字对不上（老师自己整理过一份表）：按位置读
        for (let i = 0; i < want.length; i++) map[i] = i;
        return { map, byName: false };
    }
    return { map, byName: false, tooFew: true, missingRequired };
}

async function apiImport(kind, body) {
    const spec = IMPORT_SPECS[kind];
    if (!spec) return { ok: false, msg: '不支持的导入类型：' + kind, _status: 404 };

    // 章节的写权限只给管理员（PocketBase 那边就是这么配的）。教师点进来会撞
    // 403，回一句没头没尾的 "Failed to create record."，这里先把话说清楚。
    if (kind === 'chapters' && !(ME && ME.role === 'admin')) {
        return { ok: false, msg: '章节的写权限只开放给管理员。请改用管理员账号登录后再导入。' };
    }

    const headers = Array.isArray(body.headers) ? body.headers : [];
    const rows = (Array.isArray(body.rows) ? body.rows : [])
        .filter(r => Array.isArray(r) && r.some(c => String(c == null ? '' : c).trim() !== ''));
    if (!rows.length) return { ok: false, msg: '没有可导入的数据行（整份文件都是空的）' };

    const { map, byName, tooFew, missingRequired } = mapColumns(spec.headers, headers);
    if (tooFew) {
        return {
            ok: false,
            msg: `模板对不上：这份文件缺必填列「${(missingRequired || []).join('、')}」。` +
                 `「${spec.label}」模板需要 ${spec.headers.length} 列（${spec.headers.join('、')}），` +
                 `文件只有 ${headers.length} 列。请先下载模板再填写。`,
        };
    }

    const mode = body.mode === 'replace' ? 'replace' : 'append';
    const ctx = {
        classSet: new Set((await listAll('classes', { fields: 'name' })).map(c => c.name)),
        notes: [],
    };

    // 覆盖模式：先把这次涉及到的班级名册清空，再逐行写入
    if (mode === 'replace') {
        const wanted = [...new Set(rows.map(r => String(r[map[0]] || '').trim()).filter(Boolean))];
        for (const cn of wanted) {
            const old = await listAll('roster', { filter: `className = ${q(cn)}`, fields: 'id' });
            for (const o of old) await remove('roster', o.id);
            ctx.notes.push(`已清空「${cn}」原有 ${old.length} 人名册`);
        }
    }

    let created = 0, updated = 0, skipped = 0;
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
        const src = rows[i];
        const vals = new Array(spec.headers.length).fill('');
        for (let c = 0; c < spec.headers.length; c++) {
            const at = map[c];
            if (at >= 0 && at < src.length) vals[c] = src[at] == null ? '' : src[at];
        }
        try {
            const out = await spec.apply(vals, mode, ctx);
            if (out && out.err) errors.push({ row: i + 1, msg: out.err });
            else if (out.r === 'created') created++;
            else if (out.r === 'updated') updated++;
            else skipped++;
        } catch (e) {
            errors.push({ row: i + 1, msg: e.message || '写入失败' });
        }
    }

    return {
        ok: true, kind, label: spec.label,
        total: rows.length, created, updated, skipped,
        byName,
        notes: ctx.notes,
        // 只回前 50 条，全量回给浏览器没意义，页面也显示不下
        errors: errors.slice(0, 50),
        errorCount: errors.length,
    };
}

// 模板元信息：给前端的「下载模板」和「填写说明」用
function importTemplates() {
    const out = {};
    for (const k of Object.keys(IMPORT_SPECS)) {
        const s = IMPORT_SPECS[k];
        out[k] = { label: s.label, headers: s.headers, sample: s.sample, notes: s.notes || [] };
    }
    return out;
}

// ---------- CSV 导出 ----------
// 浏览器端拼 CSV 再触发下载，服务端不再需要这个接口
function downloadCsv(filename, headers, rows) {
    const cell = v => {
        const s = v === null || v === undefined ? '' : String(v);
        return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = ['﻿' + headers.map(cell).join(',')];
    for (const r of rows) lines.push(r.map(cell).join(','));
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return { ok: true };
}

async function apiExport(kind, query) {
    const clsName = query.class || '';
    const FC = clsName ? `className = ${q(clsName)}` : '';
    if (kind === 'users') {
        const rows = (await apiUsers({})).users;
        downloadCsv('账号列表.csv', ['用户名', '姓名', '角色', '班级', '状态', '创建时间', '最近登录'],
            rows.map(u => [u.username, u.display_name, u.role, u.class_name, u.disabled ? '停用' : '正常', u.created_at, u.last_login_at || '']));
        return { ok: true };
    }
    if (kind === 'signins') {
        const rows = (await listAll('signins', { filter: FC, sort: '-signedAt' }))
            .map(r => [r.className, r.name, r.sid, r.day, isoOf(r.signedAt), r.guest ? '校外/未在名册' : '']);
        downloadCsv('签到记录.csv', ['班级', '姓名', '学号', '日期', '签到时间', '备注'], rows);
        return { ok: true };
    }
    if (kind === 'answers') {
        const an = await listAll('answers', { filter: FC, sort: '-answeredAt' });
        const qs = await listAll('questions', { fields: 'qid,className,text,chapter' });
        const qm = new Map(qs.map(x => [x.qid + '\u0000' + x.className, x]));
        downloadCsv('答题明细.csv', ['班级', '姓名', '章节', '题目', '作答', '结果', '时间'],
            an.map(a => {
                const qu = qm.get(a.qid + '\u0000' + a.className) || {};
                return [a.className, a.name, '第' + (qu.chapter || 0) + '章', qu.text || '',
                    a.choiceText, a.correct === null || a.correct === undefined ? '' : (a.correct ? '正确' : '错误'), isoOf(a.answeredAt)];
            }));
        return { ok: true };
    }
    if (kind === 'students') {
        const rows = await studentReport(clsName);
        downloadCsv('学生学情报表.csv', ['班级', '姓名', '学号', '签到天数', '答题数', '答对数', '正确率', '活跃次数', '最近签到', '最近活跃'],
            rows.map(r => [clsName, r.name, r.sid, r.signDays, r.totalAnswers, r.rightAnswers,
                r.accuracy === null ? '' : r.accuracy + '%', r.activity, isoOf(r.lastSign), r.lastActive]));
        return { ok: true };
    }
    if (kind === 'events') {
        const rows = (await listAll('events', { sort: '-ts' }))
            .slice(0, 20000)
            .map(r => [r.day, r.name, r.className, r.module, r.action, r.extra, r.route]);
        downloadCsv('学习行为日志.csv', ['日期', '姓名', '班级', '模块', '行为', '详情', '页面'], rows);
        return { ok: true };
    }
    if (kind === 'questions') {
        const qs = await listAll('questions', { sort: '-pushedAt' });
        const an = await listAll('answers', {});
        downloadCsv('课堂题目与统计.csv', ['班级', '章节', '题目', '选项', '正确答案', '推送时间', '结束时间', '作答人数', '答对人数'],
            qs.map(qu => {
                const mine = an.filter(a => a.qid === qu.qid && a.className === qu.className);
                const opts = Array.isArray(qu.options) ? qu.options : [];
                return [qu.className, '第' + (qu.chapter || 0) + '章', qu.text, opts.join(' / '),
                    qu.answer >= 0 && opts[qu.answer] ? opts[qu.answer] : '',
                    isoOf(qu.pushedAt), isoOf(qu.closedAt),
                    mine.length, mine.filter(a => a.correct).length];
            }));
        return { ok: true };
    }
    return { ok: false, msg: '未知导出类型' };
}

// ---------- 系统信息 ----------
// 原来是读服务器上 data/zhkc.db 的体积；现在是浏览器，没法读 PocketBase 的数据目录，
// 只能报一个"不可知"。页面上显示成 '?' 即可，不影响任何功能。
async function apiSysinfo() {
    return { ok: true, dbMB: null, node: 'PocketBase', uptime: Math.round(performance.now() / 1000) };
}

// ---------- 设置 ----------
async function apiSettings() {
    const rows = await listAll('settings');
    const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return {
        ok: true,
        settings: {
            course_name: m.course_name, course_code: m.course_code,
            semester: m.semester, school: m.school,
            default_class: m.default_class || '默认班级',
            // 扫码页要用的对外地址。静态托管拿不到服务器网卡 IP，
            // 所以让老师在设置里手填公网/局域网地址
            lan_base: m.lan_base || '',
        },
    };
}
async function apiSettingsSave(body) {
    for (const k of ['course_name', 'course_code', 'semester', 'school', 'default_class', 'lan_base']) {
        if (body[k] === undefined) continue;
        const old = await first('settings', `key = ${q(k)}`);
        if (old) await update('settings', old.id, { value: String(body[k]) });
        else await create('settings', { key: k, value: String(body[k]) });
    }
    return { ok: true };
}

// ============================================================
// 路由：把旧的 /api/* 调用翻译成上面的实现
// ============================================================
function parseQuery(path) {
    const i = path.indexOf('?');
    if (i < 0) return [path, {}];
    const qs = {};
    for (const [k, v] of new URLSearchParams(path.slice(i + 1))) qs[k] = v;
    return [path.slice(0, i), qs];
}

async function api(path, opts = {}) {
    const [route, query] = parseQuery(path);
    const body = opts.body || {};
    const M = opts.method || 'GET';
    try {
        // ---- 认证 ----
        if (route === '/api/auth/login' && M === 'POST') return await apiLogin(body.username, body.password);
        if (route === '/api/auth/register' && M === 'POST') return await apiRegister(body);
        if (route === '/api/auth/logout') return apiLogout();
        if (route === '/api/auth/me') return await apiMe();
        if (route === '/api/auth/password' && M === 'POST') return await apiChangePassword(body.oldPassword, body.newPassword);
        if (route === '/api/auth/classes') {
            const cs = await listAll('classes', { sort: 'created' });
            return { ok: true, classes: cs.map(c => c.name) };
        }

        // ---- 公开数据 ----
        if (route === '/api/public/chapters') {
            const rows = (await listAll('chapters', { sort: 'idx' })).filter(c => c.status === '已发布');
            return { ok: true, chapters: rows.map(c => Object.assign({}, c, { id: c.idx, updated_at: isoOf(c.updatedAt) })) };
        }
        if (route === '/api/public/resources') return await apiResources();
        if (route === '/api/public/settings') {
            const m = Object.fromEntries((await listAll('settings')).map(r => [r.key, r.value]));
            return {
                ok: true,
                courseName: m.course_name || '神经网络与深度学习',
                courseCode: m.course_code || '', semester: m.semester || '', school: m.school || '',
                lanBase: m.lan_base || '',
            };
        }
        if (route === '/api/track' && M === 'POST') {
            const items = Array.isArray(body.batch) ? body.batch.slice(0, 100) : [body];
            for (const it of items) track(it);
            return { ok: true, n: items.length };
        }
        if (route === '/api/info') {
            // 静态托管下没有服务端可探测。对外地址改由设置里的 lan_base 决定，
            // 没配就退回当前站点地址，至少二维码指向的是一个真能打开的页面。
            const m = Object.fromEntries((await listAll('settings')).map(r => [r.key, r.value]));
            const port = location.port || (location.protocol === 'https:' ? '443' : '8093');
            return { ok: true, ips: [], port, name: '', lanBase: m.lan_base || '' };
        }

        // ---- 课堂 ----
        if (route === '/api/state') return await apiState(query.class);
        if (route === '/api/state-dates') return await apiStateDates(query.class);
        if (route === '/api/roster' && M === 'POST') return await apiRoster(body);
        if (route === '/api/signin' && M === 'POST') return await apiSignin(body, navigator.userAgent);
        if (route === '/api/answer' && M === 'POST') return await apiAnswer(body);
        if (route === '/api/push' && M === 'POST') return await apiPush(body);
        if (route === '/api/closeQuestion' && M === 'POST') return await apiCloseQuestion(body.class);
        if (route === '/api/reset' && M === 'POST') return await apiReset(body.class);

        // ---- 学生 ----
        if (route === '/api/student/me') return await apiStudentMe();

        // ---- 管理端 ----
        if (route === '/api/admin/overview') {
            if (!isStaff()) return { ok: false, msg: '无权访问' };
            return await apiOverview();
        }
        if (route === '/api/admin/users' && M === 'GET') return await apiUsers(query);
        if (route === '/api/admin/users' && M === 'POST') return await apiUserCreate(body);
        if (route === '/api/admin/users/gen-students' && M === 'POST') return await apiGenStudents(body);
        let m = route.match(/^\/api\/admin\/users\/([^/]+)$/);
        if (m) {
            if (M === 'DELETE') return await apiUserDelete(m[1]);
            if (M === 'PUT' || M === 'PATCH') return await apiUserUpdate(m[1], body);
        }
        if (route === '/api/admin/classes' && M === 'GET') return { ok: true, classes: await classesWithCount() };
        if (route === '/api/admin/classes' && M === 'POST') {
            const name = String(body.name || '').trim();
            if (!name) return { ok: false, msg: '班级名必填' };
            try { await create('classes', { name, advisor: body.advisor || '' }); return { ok: true }; }
            catch (e) { return { ok: false, msg: /unique|already/i.test(e.message) ? '班级已存在' : '创建失败' }; }
        }
        m = route.match(/^\/api\/admin\/classes\/([^/]+)$/);
        if (m && (M === 'PUT' || M === 'PATCH')) {
            const c = await first('classes', `id = ${q(m[1])}`);
            if (!c) return { ok: false, msg: '班级不存在' };
            await update('classes', c.id, { name: body.name, advisor: body.advisor || '' });
            return { ok: true };
        }
        if (m && M === 'DELETE') {
            const c = await first('classes', `id = ${q(m[1])}`);
            if (c) {
                for (const r of await listAll('roster', { filter: `className = ${q(c.name)}` })) await remove('roster', r.id);
                await remove('classes', c.id);
            }
            return { ok: true };
        }
        if (route === '/api/admin/roster' && M === 'GET') {
            const clsName = query.class || body.className || body.class || '';
            const rows = await listAll('roster', { filter: `className = ${q(clsName)}`, sort: 'name' });
            return { ok: true, roster: rows.map(r => ({ name: r.name, sid: r.sid || '' })) };
        }
        if (route === '/api/admin/roster' && M === 'POST') return await apiRoster(body);
        if (route === '/api/admin/chapters' && M === 'GET') return await apiChapters();
        if (route === '/api/admin/chapters' && M === 'POST') {
            if (!body.title) return { ok: false, msg: '标题必填' };
            return await upsertByIdx('chapters', body, 'idx');
        }
        m = route.match(/^\/api\/admin\/chapters\/([^/]+)$/);
        if (m && (M === 'PUT' || M === 'PATCH')) return await upsertByIdx('chapters', Object.assign({}, body, { idx: body.idx != null ? body.idx : m[1] }), 'idx');
        if (m && M === 'DELETE') {
            const c = await first('chapters', `idx = ${Number(m[1]) || 0}`);
            if (c) await remove('chapters', c.id);
            return { ok: true };
        }
        if (route === '/api/admin/resources' && M === 'GET') return await apiResources();
        if (route === '/api/admin/resources' && M === 'POST') {
            if (!body.title) return { ok: false, msg: '标题必填' };
            const patch = {
                category: body.category || '其他', title: body.title, url: body.url || '',
                note: body.note || '', sort: Number(body.sort) || 0,
            };
            if (body.id) { try { await update('resources', body.id, patch); return { ok: true }; } catch (e) { /* 落到新建 */ } }
            await create('resources', patch);
            return { ok: true };
        }
        m = route.match(/^\/api\/admin\/resources\/([^/]+)$/);
        if (m && (M === 'PUT' || M === 'PATCH')) {
            const patch = {
                category: body.category || '其他', title: body.title, url: body.url || '',
                note: body.note || '', sort: Number(body.sort) || 0,
            };
            try { await update('resources', m[1], patch); }
            catch (e) {
                const old = await first('resources', `id = ${q(m[1])}`);
                if (old) await update('resources', old.id, patch);
            }
            return { ok: true };
        }
        if (m && M === 'DELETE') {
            try { await remove('resources', m[1]); } catch (e) { /* 已经没了也算删成功 */ }
            return { ok: true };
        }
        if (route === '/api/admin/bank' && M === 'GET') return await apiBank(query);
        if (route === '/api/admin/bank' && M === 'POST') {
            if (!body.text || !Array.isArray(body.options) || body.options.length < 2) {
                return { ok: false, msg: '题干与选项(≥2)必填' };
            }
            const patch = {
                chapter: Number(body.chapter) || 0, text: body.text, options: body.options,
                answer: body.answer ?? 0, analysis: body.analysis || '', difficulty: body.difficulty || '中等',
            };
            if (body.id) { try { await update('question_bank', body.id, patch); return { ok: true }; } catch (e) { /* 新建 */ } }
            await create('question_bank', patch);
            return { ok: true };
        }
        m = route.match(/^\/api\/admin\/bank\/([^/]+)$/);
        if (m && (M === 'PUT' || M === 'PATCH')) {
            const patch = {
                chapter: Number(body.chapter) || 0, text: body.text, options: body.options || [],
                answer: body.answer ?? 0, analysis: body.analysis || '', difficulty: body.difficulty || '中等',
            };
            try { await update('question_bank', m[1], patch); }
            catch (e) {
                const old = await first('question_bank', `id = ${q(m[1])}`);
                if (old) await update('question_bank', old.id, patch);
            }
            return { ok: true };
        }
        if (m && M === 'DELETE') {
            try { await remove('question_bank', m[1]); } catch (e) { /* 已经没了 */ }
            return { ok: true };
        }
        if (route === '/api/admin/analysis/students') return { ok: true, report: await studentReport(query.class || '') };
        if (route === '/api/admin/analysis/signin-trend') return await apiSigninTrend(query.days);
        if (route === '/api/admin/analysis/quiz') return await apiQuizAnalysis(query.class || '');
        if (route === '/api/admin/analysis/modules') return await apiModules(query.days);
        if (route === '/api/admin/analysis/student-detail') return await apiStudentDetail(query);
        m = route.match(/^\/api\/admin\/export\/([^/]+)$/);
        if (m) return await apiExport(m[1], query);
        if (route === '/api/admin/import/templates') return { ok: true, templates: importTemplates() };
        m = route.match(/^\/api\/admin\/import\/([^/]+)$/);
        if (m && M === 'POST') {
            if (!isStaff()) return { ok: false, msg: '只有教师或管理员可以批量导入' };
            return await apiImport(m[1], body);
        }
        if (route === '/api/admin/sysinfo') return await apiSysinfo();
        if (route === '/api/admin/settings' && M === 'GET') return await apiSettings();
        if (route === '/api/admin/settings' && (M === 'PUT' || M === 'PATCH')) return await apiSettingsSave(body);

        return { ok: false, msg: 'unknown api: ' + route, _status: 404 };
    } catch (e) {
        // 401/403 一律按"未登录/无权"处理，页面据此跳登录页
        const status = e.status === 400 ? 403 : (e.status || 500);
        return { ok: false, msg: e.message || '请求失败', _status: status };
    }
}

// ============================================================
// 对外暴露
// ============================================================
if (typeof window !== 'undefined') {
    window.PB = {
        base: PB_BASE, mailOf, listAll, first, create, update, remove,
        track, flushTrack, api, isStaff,
        // 模板导入：IMPORT_SPECS 是唯一样板来源，import.js 的下载模板和预览
        // 都从这里取，写库和列名不可能对不上
        importSpecs: IMPORT_SPECS, templates: importTemplates,
        downloadCsv, DIFFICULTIES, PWD_MIN,
        refreshChapterProgress, loadClassNames, setupClassSelect,
        get user() { return ME; },
        get token() { return TOKEN; },
        session: saveSession,
    };
    // 首页章节卡的进度也可以直接 window.refreshChapterProgress() 调
    window.refreshChapterProgress = refreshChapterProgress;
    // 页面里三个文件各自定义了一个同名 api()，加载顺序上 pb.js 在最前，
    // 这里只挂 window.api（auth-ui 的局部 api 是闭包内的，不受影响）
    if (!window.__pbOwnApi) window.api = api;

    // 首页章节卡：脚本在 body 末尾加载，卡片已就位，直接回填一次。
    // 登录/登出后的刷新由 auth-ui.js 在 afterAuth / doLogout 里调上面这个函数。
    if (document.querySelector('.chapter-progress[data-chapter]')) {
        refreshChapterProgress();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, listAll, first, create, update, remove, mailOf, track, flushTrack };
}

})();