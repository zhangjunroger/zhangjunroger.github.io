// ============================================================
// server.js —— 智慧课程本地服务器（零依赖，Node 自带 http 模块）
//   启动：  node server.js   （默认端口 3000，可用 PORT 环境变量覆盖）
//   功能：
//     1. 静态托管课程网站（index.html 等）
//     2. 学生扫码签到 / 答题 API（手机浏览器直接访问）
//     3. 数据持久化到本地数据库文件 data/classroom.json
//     4. 大屏（教师端）每 2 秒轮询 /api/state 实时刷新
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DB_DIR, 'classroom.json');

// ---------- 本地数据库 ----------
let db = { classes: {} };

function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('[db] 读取失败，使用空数据库:', e.message);
    }
}

let saveTimer = null;
function saveDB() {
    // 防抖写盘：500ms 内的多次写入合并
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        try {
            if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
            const tmp = DB_FILE + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(db, null, 1));
            fs.renameSync(tmp, DB_FILE);      // 原子替换
        } catch (e) {
            console.error('[db] 写入失败:', e.message);
        }
    }, 400);
}

function getClass(name) {
    if (!db.classes[name]) {
        db.classes[name] = {
            roster: [],
            signed: {},          // name -> { sid, time, ua }
            current: null,       // 当前推送的题目 { id, text, options[], answer, ch }
            answers: {},         // qid -> { name -> { choice, choiceText, time, correct } }
            history: []          // 已结束的题目统计
        };
    }
    return db.classes[name];
}

// ---------- 工具 ----------
function sendJSON(res, code, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(body);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
            if (data.length > 1e6) { reject(new Error('body too large')); req.destroy(); }
        });
        req.on('end', () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch (e) { resolve({}); }
        });
        req.on('error', reject);
    });
}

function publicIPs() {
    const out = [];
    const ifs = os.networkInterfaces();
    for (const name of Object.keys(ifs)) {
        for (const it of ifs[name] || []) {
            if (it.family === 'IPv4' && !it.internal) out.push(it.address);
        }
    }
    return out;
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

function serveStatic(req, res, pathname) {
    let rel = decodeURIComponent(pathname);
    if (rel === '/') rel = '/index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        res.end(buf);
    });
}

// ---------- API 路由 ----------
async function handleAPI(req, res, url) {
    const route = url.pathname;
    const q = url.searchParams;

    if (req.method === 'GET' && route === '/api/info') {
        return sendJSON(res, 200, { ips: publicIPs(), port: PORT, name: os.hostname() });
    }

    const cls = getClass(q.get('class') || (req._body && req._body.class) || '默认班级');

    if (req.method === 'POST') {
        const body = await readBody(req);
        const c = getClass(body.class || '默认班级');

        if (route === '/api/roster') {
            c.roster = Array.isArray(body.roster) ? body.roster : [];
            saveDB();
            return sendJSON(res, 200, { ok: true, count: c.roster.length });
        }

        if (route === '/api/signin') {
            const name = (body.name || '').trim();
            if (!name) return sendJSON(res, 400, { ok: false, msg: '请填写姓名' });
            const known = c.roster.length === 0 || c.roster.includes(name);
            const dup = c.signed[name];
            c.signed[name] = {
                sid: (body.sid || '').trim(),
                time: new Date().toTimeString().slice(0, 8),
                ua: (req.headers['user-agent'] || '').slice(0, 80),
                guest: !known && c.roster.length > 0
            };
            saveDB();
            return sendJSON(res, 200, {
                ok: true, dup: !!dup,
                msg: dup ? '你已经签到过了' : '签到成功！',
                hasQuestion: !!c.current
            });
        }

        if (route === '/api/answer') {
            const name = (body.name || '').trim();
            const qid = body.qid;
            if (!name || !qid || !c.current || qid !== c.current.id) {
                return sendJSON(res, 400, { ok: false, msg: '当前没有进行中的答题' });
            }
            if (!c.answers[qid]) c.answers[qid] = {};
            const choice = parseInt(body.choice);
            c.answers[qid][name] = {
                choice,
                choiceText: c.current.options ? c.current.options[choice] : String(body.choice),
                time: new Date().toTimeString().slice(0, 8),
                correct: c.current.answer >= 0 ? choice === c.current.answer : null
            };
            saveDB();
            return sendJSON(res, 200, { ok: true, msg: '已提交' });
        }

        if (route === '/api/push') {
            c.current = {
                id: 'q' + Date.now(),
                text: body.text || '',
                options: body.options || null,
                answer: typeof body.answer === 'number' ? body.answer : -1,
                ch: body.ch || 0,
                pushedAt: new Date().toISOString()
            };
            if (!c.answers[c.current.id]) c.answers[c.current.id] = {};
            saveDB();
            return sendJSON(res, 200, { ok: true, id: c.current.id });
        }

        if (route === '/api/closeQuestion') {
            if (c.current) {
                c.history.push({
                    q: c.current,
                    answers: c.answers[c.current.id] || {}
                });
                c.current = null;
                saveDB();
            }
            return sendJSON(res, 200, { ok: true });
        }

        if (route === '/api/reset') {
            const fresh = getClass(body.class || '默认班级');
            fresh.signed = {};
            fresh.current = null;
            fresh.answers = {};
            fresh.history = [];
            saveDB();
            return sendJSON(res, 200, { ok: true });
        }

        return sendJSON(res, 404, { ok: false, msg: 'unknown api' });
    }

    // GET /api/state
    if (route === '/api/state') {
        return sendJSON(res, 200, {
            ok: true,
            roster: cls.roster,
            signed: cls.signed,
            current: cls.current,
            answers: cls.answers,
            history: cls.history
        });
    }

    return sendJSON(res, 404, { ok: false });
}

// ---------- 服务器 ----------
loadDB();

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
        if (url.pathname.startsWith('/api/')) {
            await handleAPI(req, res, url);
        } else {
            serveStatic(req, res, url.pathname);
        }
    } catch (e) {
        sendJSON(res, 500, { ok: false, msg: e.message });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    const ips = publicIPs();
    console.log('==============================================');
    console.log('  《神经网络与深度学习》智慧课程本地服务器已启动');
    console.log('  教师端(本机):    http://localhost:' + PORT);
    ips.forEach(ip => console.log('  学生扫码访问:    http://' + ip + ':' + PORT + '/signin.html'));
    console.log('  本地数据库:      data/classroom.json');
    console.log('  按 Ctrl+C 停止');
    console.log('==============================================');
});
