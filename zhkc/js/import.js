// ============================================================
// import.js —— 管理后台的「模板导入」
//
// 每个能新增内容的地方都长一个「导入」按钮：先下载 CSV 模板，照着列填好，
// 再把文件拖回来（或直接粘贴）。导入前先预览前若干行，确认没填错列再写库。
//
// 所有列名和写入规则都来自 pb.js 里的 IMPORT_SPECS —— 这里不硬编码任何列，
// 所以模板改了、这边不会跟着烂掉。
// ============================================================
'use strict';

(function () {
    const SPECS = window.PB && window.PB.importSpecs;
    if (!SPECS) { console.warn('[import] window.PB.importSpecs 缺失，模板导入未启用'); return; }

    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // ----------------------------------------------------------------
    // CSV 解析：RFC4180。引号里的逗号和换行都算内容，双引号写成 "" 转义。
    // ----------------------------------------------------------------
    function parseCsv(text) {
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // Excel/WPS 存的 BOM
        const rows = [];
        let row = [], cell = '', inQ = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (inQ) {
                if (ch === '"') {
                    if (text[i + 1] === '"') { cell += '"'; i++; }
                    else inQ = false;
                } else cell += ch;
                continue;
            }
            if (ch === '"') { inQ = true; continue; }
            if (ch === ',') { row.push(cell); cell = ''; continue; }
            if (ch === '\r') { if (text[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = []; continue; }
            if (ch === '\n') { row.push(cell); cell = ''; rows.push(row); row = []; continue; }
            cell += ch;
        }
        if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
        // 丢掉整行为空的尾行（文件末尾多敲的那个回车）
        return rows.filter(r => r.some(c => String(c).trim() !== ''));
    }

    // 读文件。WPS / 老的 Excel 另存 CSV 默认是 GBK，直接按 UTF-8 解会满屏乱码，
    // 所以先严格试 UTF-8，失败再按 GBK 解一次。
    async function readFile(file) {
        const buf = await file.arrayBuffer();
        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(buf);
        } catch (e) {
            return new TextDecoder('gbk').decode(buf);
        }
    }

    // 下载模板。列名 + 两行示例，示例行是给人照着抄的，不是待导入数据 ——
    // 所以下载的模板文件里带示例是安全的：真正导入时老师会替换掉。
    function downloadTemplate(kind) {
        const s = SPECS[kind];
        if (!s) return;
        window.PB.downloadCsv(
            s.label + '导入模板.csv',
            s.headers,
            s.sample
        );
    }

    // ----------------------------------------------------------------
    // 导入弹窗
    // ----------------------------------------------------------------
    const PREVIEW_ROWS = 8;

    function openImport(kind) {
        const spec = SPECS[kind];
        if (!spec) return;
        const state = { headers: null, rows: null, fileName: '' };

        modal(`
            <h3>批量导入 · ${esc(spec.label)}</h3>
            <ol class="imp-steps">
                <li><b>下载模板</b>，按列填好；<b>上传模板文件</b>，或直接把内容粘到下面的框里。</li>
                <li>确认下面预览出来的列没有错位，再点<b>开始导入</b>。</li>
            </ol>
            <div class="imp-bars">
                <button class="mp-btn primary" id="impTpl">⬇ 下载${esc(spec.label)}模板</button>
                <button class="mp-btn" id="impPick">⬆ 上传模板文件</button>
                <input type="file" id="impFile" accept=".csv,text/csv,.txt" hidden>
                <button class="mp-btn" id="impDemo">填入示例数据</button>
            </div>
            <label class="f-label">或直接粘贴（支持从 Excel / WPS 整块复制）</label>
            <textarea id="impText" class="mp-textarea" rows="4" placeholder="第一行是列名，第二行起是数据"></textarea>
            ${kind === 'roster' ? `
            <label class="f-label">导入模式</label>
            <select id="impMode" class="mp-select" style="width:100%">
                <option value="append">追加：只补新增的学生，不动已有记录（默认）</option>
                <option value="replace">覆盖：先清空文件中涉及班级的原有名册，再写入</option>
            </select>` : ''}
            <div id="impPreview" class="imp-preview"><div class="empty-tip">还没有内容。先下载模板填好，再上传或粘贴。</div></div>
            <div id="impResult" class="imp-result"></div>
            <div class="acts">
                <button class="mp-btn" data-close>取消</button>
                <button class="mp-btn primary" id="impGo">开始导入</button>
            </div>`);
        $('#modalBox').classList.add('wide');

        const pick = $('#impFile');
        const preview = $('#impResult');

        $('#impTpl').addEventListener('click', () => downloadTemplate(kind));
        $('#impPick').addEventListener('click', () => pick.click());
        pick.addEventListener('change', async () => {
            const f = pick.files && pick.files[0];
            if (!f) return;
            state.fileName = f.name;
            $('#impText').value = '';
            load(await readFile(f));
        });
        $('#impDemo').addEventListener('click', () => {
            const s = SPECS[kind];
            $('#impText').value = [s.headers.join(',')].concat(s.sample.map(r => r.join(','))).join('\n');
            load($('#impText').value);
        });

        let debTimer;
        $('#impText').addEventListener('input', () => {
            clearTimeout(debTimer);
            debTimer = setTimeout(() => load($('#impText').value), 300);
        });

        function load(text) {
            const all = parseCsv(String(text || ''));
            if (all.length < 2) {
                state.headers = null; state.rows = [];
                $('#impPreview').innerHTML = '<div class="empty-tip">至少需要「一行列名 + 一行数据」。</div>';
                return;
            }
            state.headers = all[0];
            state.rows = all.slice(1);
            const show = state.rows.slice(0, PREVIEW_ROWS);
            $('#impPreview').innerHTML = `
                <div class="imp-pv-head">
                    识别到 <b>${state.rows.length}</b> 行数据${state.fileName ? ` · 来自 ${esc(state.fileName)}` : ''}
                </div>
                <div class="imp-pv-scroll"><table>
                    <thead><tr>${state.headers.map(h => `<th>${esc(h) || '<i style="color:var(--tx-faint)">（空列）</i>'}</th>`).join('')}</tr></thead>
                    <tbody>${show.map(r => `<tr>${state.headers.map((_, i) => `<td>${esc(r[i] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
                </table></div>
                ${state.rows.length > PREVIEW_ROWS ? `<div class="imp-pv-more">…另有 ${state.rows.length - PREVIEW_ROWS} 行未显示</div>` : ''}`;
        }

        $('#impGo').addEventListener('click', async () => {
            const btn = $('#impGo');
            if (!state.headers || !state.rows.length) return toast('请先上传文件或粘贴内容', true);
            const mode = kind === 'roster' ? $('#impMode').value : 'append';
            if (mode === 'replace' && !confirm(
                '覆盖模式会先删除文件中涉及班级的原有名册，再写入文件里的学生。\n'
                + '签到 / 答题历史不受影响，但原名册里的人会从名册上消失。确定继续？')) return;
            btn.disabled = true;
            btn.textContent = '导入中…';
            preview.innerHTML = '';
            const r = await api('/api/admin/import/' + kind, {
                method: 'POST',
                body: { headers: state.headers, rows: state.rows, mode },
            });
            btn.disabled = false;
            btn.textContent = '开始导入';
            if (!r.ok) { preview.innerHTML = `<div class="imp-err">导入失败：${esc(r.msg || '未知错误')}</div>`; return; }
            showResult(r);
            toast(`导入完成：新增 ${r.created} 条`);
            if (typeof window.__afterImport === 'function') window.__afterImport(kind, r);
        });

        function showResult(r) {
            const notes = (r.notes || []).map(n => `<li>${esc(n)}</li>`).join('');
            const errs = (r.errors || []).map(e => `<li>第 ${e.row} 行：${esc(e.msg)}</li>`).join('');
            preview.innerHTML = `
                <div class="imp-sum">
                    <span class="ok">新增 <b>${r.created}</b></span>
                    <span class="upd">更新 <b>${r.updated}</b></span>
                    <span class="skip">跳过 <b>${r.skipped}</b></span>
                    <span class="${r.errorCount ? 'bad' : 'skip'}">失败 <b>${r.errorCount || 0}</b></span>
                </div>
                ${!r.byName ? '<div class="imp-warn">列名没能和模板对上，本次按列的先后顺序读取，请务必核对下面的预览。</div>' : ''}
                ${notes ? `<ul class="imp-notes">${notes}</ul>` : ''}
                ${errs ? `<details class="imp-errs" open><summary>失败明细（${r.errorCount} 条${r.errorCount > (r.errors || []).length ? '，仅显示前 ' + r.errors.length + ' 条' : ''}）</summary><ul>${errs}</ul></details>` : ''}
                <button class="mp-btn sm" data-close>完成</button>`;
        }
    }

    // 各面板导入完之后的刷新动作。名字改成渲染函数，直接挂上去就行。
    window.__afterImport = function (kind) {
        if (kind === 'classes' || kind === 'roster') { renderClasses(); return; }
        if (kind === 'chapters') { chapterCache = []; renderChapters(); return; }
        if (kind === 'resources') { renderResources(); return; }
        if (kind === 'bank') { renderBank(); return; }
        if (kind === 'users') { renderUsers(); return; }
    };

    // 绑定所有 data-import 按钮
    function bind() {
        $$('[data-import]').forEach(b => {
            if (b._bound) return;
            b._bound = true;
            b.addEventListener('click', () => openImport(b.dataset.import));
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    // 页面切换面板后重新扫一遍（后台是单页多面板，初始 DOM 里按钮都在，
    // 这里再扫一次是为了保险，不重复绑定）
    window.addEventListener('hashchange', () => setTimeout(bind, 0));

    window.openImport = openImport;
    window.ImportUI = { parseCsv, readFile, downloadTemplate, openImport };
})();