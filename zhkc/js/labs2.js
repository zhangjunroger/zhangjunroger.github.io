// ============================================================
// labs2.js —— 在线实验平台扩展实验 10 ~ 17
// 沈阳工业大学人工智能学院《神经网络与深度学习》智慧课程
// 依赖：index.html 中对应的 DOM 元素；MathJax 由 script.js 提供 typesetMath
// ============================================================

// ---------- 通用小工具 ----------
function labs2Randn() {
    // Box-Muller 标准正态
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function labs2Softmax(arr) {
    const m = Math.max(...arr);
    const exps = arr.map(v => Math.exp(v - m));
    const s = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / s);
}

function labs2Sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x)))); }

function labs2FormatMat(k, fmt) {
    // 将矩阵渲染为带括号的小文本，用于信息面板
    let s = '[';
    for (let i = 0; i < k.length; i++) {
        s += (i ? '  [' : '[') + k[i].map(fmt).join(', ') + (i === k.length - 1 ? ']' : '');
    }
    return s + ']';
}

// ============================================================
// 实验 10：Softmax 多分类器
// ============================================================
function initSoftmaxLab() {
    const canvas = document.getElementById('smCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dataSel  = document.getElementById('smDataSelect');
    const hidSld   = document.getElementById('smHiddenSlider');
    const hidVal   = document.getElementById('smHiddenValue');
    const lrSld    = document.getElementById('smLrSlider');
    const lrVal    = document.getElementById('smLrValue');
    const trainBtn = document.getElementById('smTrainBtn');
    const autoBtn  = document.getElementById('smAutoBtn');
    const resetBtn = document.getElementById('smResetBtn');
    const lossEl   = document.getElementById('smLoss');
    const accEl    = document.getElementById('smAcc');
    const probsEl  = document.getElementById('smProbs');

    const COLORS = ['#6366f1', '#ec4899', '#22c55e'];

    let H = 24, W1, b1, W2, b2, dataTrain, dataVal, steps = 0, lossHist = [];
    let animId = null, autoTimer = null;

    function makeNet() {
        W1 = Array.from({length: H}, () => [labs2Randn() * 0.5, labs2Randn() * 0.5]);
        b1 = Array(H).fill(0);
        W2 = Array.from({length: 3}, () => Array.from({length: H}, () => labs2Randn() * 0.5));
        b2 = [0, 0, 0];
    }

    function genData(type) {
        const train = [], val = [];
        const n = 60;
        for (let i = 0; i < n; i++) {
            const cls = i % 3;
            let x;
            if (type === 'blob3') {
                const cx = [[-1.2, 1.0], [1.3, 0.9], [0.0, -1.4]][cls];
                x = [cx[0] + labs2Randn() * 0.55, cx[1] + labs2Randn() * 0.55];
            } else if (type === 'spiral3') {
                // t 控制半径与角度（单臂螺旋），三臂相位差 2π/3
                const t = ((i / 3) | 0) / 20 * 3.2 + 0.35;
                const r = 0.25 + 1.5 * t / 3.55;
                const a = t * 2 + cls * (Math.PI * 2 / 3);
                x = [r * Math.cos(a) + labs2Randn() * 0.05, r * Math.sin(a) + labs2Randn() * 0.05];
            } else { // rings3
                const r = 0.45 + cls * 0.75 + labs2Randn() * 0.14;
                const a = Math.random() * Math.PI * 2;
                x = [r * Math.cos(a), r * Math.sin(a)];
            }
            (i % 5 === 0 ? val : train).push({ x, y: cls });
        }
        return { train, val };
    }

    function forward(x) {
        const z1 = [], h = [];
        for (let i = 0; i < H; i++) {
            const z = W1[i][0] * x[0] + W1[i][1] * x[1] + b1[i];
            z1.push(z); h.push(Math.tanh(z));
        }
        const z2 = [];
        for (let k = 0; k < 3; k++) {
            let z = b2[k];
            for (let i = 0; i < H; i++) z += W2[k][i] * h[i];
            z2.push(z);
        }
        const p = labs2Softmax(z2);
        return { z1, h, z2, p };
    }

    function trainStep(lr) {
        let totalLoss = 0;
        const gW1 = Array.from({length: H}, () => [0, 0]);
        const gb1 = Array(H).fill(0);
        const gW2 = Array.from({length: 3}, () => Array(H).fill(0));
        const gb2 = [0, 0, 0];
        for (const {x, y} of dataTrain) {
            const { h, p } = forward(x);
            totalLoss += -Math.log(Math.max(p[y], 1e-12));
            const dz2 = p.slice();
            dz2[y] -= 1;
            for (let k = 0; k < 3; k++) {
                gb2[k] += dz2[k];
                for (let i = 0; i < H; i++) gW2[k][i] += dz2[k] * h[i];
            }
            for (let i = 0; i < H; i++) {
                let dz1 = 0;
                for (let k = 0; k < 3; k++) dz1 += dz2[k] * W2[k][i];
                dz1 *= (1 - h[i] * h[i]);
                gW1[i][0] += dz1 * x[0]; gW1[i][1] += dz1 * x[1]; gb1[i] += dz1;
            }
        }
        const n = dataTrain.length;
        for (let i = 0; i < H; i++) {
            W1[i][0] -= lr * gW1[i][0] / n; W1[i][1] -= lr * gW1[i][1] / n; b1[i] -= lr * gb1[i] / n;
        }
        for (let k = 0; k < 3; k++) {
            for (let i = 0; i < H; i++) W2[k][i] -= lr * gW2[k][i] / n;
            b2[k] -= lr * gb2[k] / n;
        }
        return totalLoss / n;
    }

    function accuracy(data) {
        let c = 0;
        for (const {x, y} of data) {
            const p = forward(x).p;
            if (p.indexOf(Math.max(...p)) === y) c++;
        }
        return c / data.length;
    }

    function draw() {
        const W = canvas.width, Hc = canvas.height;
        ctx.clearRect(0, 0, W, Hc);

        // ---- 左：决策区域 + 数据点 ----
        const px0 = 50, py0 = 30, pw = 340, ph = 300;
        const xMin = -2.6, xMax = 2.6, yMin = -2.6, yMax = 2.6;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('决策区域与数据点', px0 + pw / 2, py0 - 6);
        const res = 44, cw = pw / res, ch = ph / res;
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const dx = xMin + (xMax - xMin) * (j + 0.5) / res;
                const dy = yMin + (yMax - yMin) * (res - 1 - i + 0.5) / res;
                const p = forward([dx, dy]).p;
                const c = COLORS[p.indexOf(Math.max(...p))];
                // 把 hex 变 rgba
                const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
                const conf = (Math.max(...p) - 1 / 3) / (2 / 3);
                ctx.fillStyle = `rgba(${r},${g},${b},${0.08 + conf * 0.38})`;
                ctx.fillRect(px0 + j * cw, py0 + i * ch, cw + 0.5, ch + 0.5);
            }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeRect(px0, py0, pw, ph);
        for (const {x, y} of dataTrain) {
            const sx = px0 + (x[0] - xMin) / (xMax - xMin) * pw;
            const sy = py0 + (1 - (x[1] - yMin) / (yMax - yMin)) * ph;
            ctx.fillStyle = COLORS[y];
            ctx.beginPath(); ctx.arc(sx, sy, 3.2, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.7; ctx.stroke();
        }
        // 坐标轴标签
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('$x_1$ →', px0 + pw / 2, py0 + ph + 14);
        ctx.save();
        ctx.translate(px0 - 12, py0 + ph / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('$x_2$ →', 0, 0);
        ctx.restore();

        // ---- 中：当前测试点概率条形图 ----
        const bx0 = px0 + pw + 50, bw = 160, bh = 240, by0 = py0 + 40;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('测试点 Softmax 概率', bx0 + bw / 2, by0 - 8);
        const testX = [0.8, 0.6];
        const pTest = forward(testX).p;
        for (let k = 0; k < 3; k++) {
            const barH = pTest[k] * bh;
            const c = COLORS[k];
            const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
            const bx = bx0 + k * (bw / 3 + 8);
            ctx.fillRect(bx, by0 + bh - barH, bw / 3, barH);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '11px Consolas, monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText('p' + (k + 1) + '=' + pTest[k].toFixed(2), bx + bw / 6, by0 + bh - barH - 3);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(bx0, by0, bw, bh);
        // 画出测试点位置
        const tx = px0 + (testX[0] - xMin) / (xMax - xMin) * pw;
        const ty = py0 + (1 - (testX[1] - yMin) / (yMax - yMin)) * ph;
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fbbf24'; ctx.font = '10px "Microsoft YaHei"';
        ctx.textAlign = 'left';
        ctx.fillText('测试点', tx + 9, ty + 3);

        // ---- 右：损失曲线 ----
        const cx0 = bx0 + bw + 50, cw2 = W - cx0 - 40, ch2 = 300, cy0 = py0 + 40;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(cx0, cy0, cw2, ch2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('交叉熵损失曲线', cx0, cy0 - 8);
        if (lossHist.length > 1) {
            const maxL = Math.max(...lossHist);
            ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < lossHist.length; i++) {
                const x = cx0 + i / (lossHist.length - 1) * cw2;
                const y = cy0 + ch2 - (lossHist[i] / maxL) * (ch2 - 10);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = '11px "Microsoft YaHei"';
            ctx.textAlign = 'center';
            ctx.fillText('点击「训练」开始', cx0 + cw2 / 2, cy0 + ch2 / 2);
        }

        // ---- 信息面板 ----
        const curLoss = lossHist.length ? lossHist[lossHist.length - 1] : null;
        lossEl.textContent = curLoss != null ? curLoss.toFixed(4) : '--';
        accEl.textContent = `训练 ${(accuracy(dataTrain) * 100).toFixed(1)}%  /  验证 ${(accuracy(dataVal) * 100).toFixed(1)}%`;
        probsEl.textContent = pTest.map((v, i) => `p${i + 1}=${v.toFixed(3)}`).join('  ');
        hidVal.textContent = H;
        lrVal.textContent = parseFloat(lrSld.value).toFixed(2);
    }

    function doTrainSteps(nSteps) {
        const lr = parseFloat(lrSld.value);
        for (let i = 0; i < nSteps; i++) lossHist.push(trainStep(lr));
        steps += nSteps;
        if (lossHist.length > 400) lossHist = lossHist.slice(-400);
        draw();
    }

    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶ 持续训练'; }
    }

    function resetAll() {
        stopAuto();
        if (animId) cancelAnimationFrame(animId);
        H = parseInt(hidSld.value);
        makeNet();
        const d = genData(dataSel.value);
        dataTrain = d.train; dataVal = d.val;
        steps = 0; lossHist = [];
        draw();
    }

    trainBtn.addEventListener('click', () => doTrainSteps(50));
    autoBtn.addEventListener('click', () => {
        if (autoTimer) { stopAuto(); return; }
        autoBtn.textContent = '⏸ 停止';
        autoTimer = setInterval(() => doTrainSteps(12), 50);
    });
    resetBtn.addEventListener('click', resetAll);
    hidSld.addEventListener('input', resetAll);
    dataSel.addEventListener('change', resetAll);
    lrSld.addEventListener('input', draw);

    resetAll();
}

// ============================================================
// 教学动画 1：激活函数「切线扫描 + 波形穿透」伴侣动画
//   左：函数曲线上一枚光点沿 x 轴匀速扫描，切线随导数摆动，
//       切线斜率实时标注 —— 直观呈现"导数 = 切线斜率"
//   右：s·x+b 波形穿过激活函数，输出波形实时绘制，
//       展示"非线性变换如何扭曲信号"
// ============================================================
function initActivationFX() {
    const cv = ensureCompanion('fxActivation', '动画演示：切线斜率扫描（左） · 信号波形穿透（右）', 1000, 320);
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const actCanvas = document.getElementById('activationCanvas');
    if (!actCanvas) return;
    const scaleSld = document.getElementById('scaleSlider');
    const biasSld  = document.getElementById('biasSlider');
    const actSel   = document.getElementById('activationSelect');

    const fns = {
        sigmoid:  { f: x => 1/(1+Math.exp(-x)),            d: x => { const s=1/(1+Math.exp(-x)); return s*(1-s); } },
        tanh:     { f: x => Math.tanh(x),                   d: x => 1-Math.tanh(x)**2 },
        relu:     { f: x => Math.max(0,x),                  d: x => x>0?1:0 },
        leakyrelu:{ f: x => x>0?x:0.01*x,                   d: x => x>0?1:0.01 },
        elu:      { f: x => x>0?x:Math.exp(x)-1,            d: x => x>0?1:Math.exp(x) },
        softplus: { f: x => Math.log(1+Math.exp(x)),        d: x => 1/(1+Math.exp(-x)) },
        swish:    { f: x => x/(1+Math.exp(-x)),             d: x => { const s=1/(1+Math.exp(-x)); return s+x*s*(1-s); } },
        gelu:     { f: x => 0.5*x*(1+Math.tanh(Math.sqrt(2/Math.PI)*(x+0.044715*x**3))),
                    d: x => { const c=0.7978845608*(x+0.044715*x**3); const t=Math.tanh(c);
                              return 0.5*(1+t)+0.5*x*(1-t*t)*0.7978845608*(1+3*0.044715*x*x); } },
        mish:     { f: x => x*Math.tanh(Math.log(1+Math.exp(x))),
                    d: x => { const sp=Math.log(1+Math.exp(x)); const t=Math.tanh(sp);
                              return t + x*(1-t*t)*1/(1+Math.exp(-x)); } }
    };
    const RANGES = {
        sigmoid:{y0:-0.3,y1:1.3}, tanh:{y0:-1.4,y1:1.4}, relu:{y0:-0.8,y1:7.5},
        leakyrelu:{y0:-0.8,y1:7.5}, elu:{y0:-1.6,y1:7.5}, softplus:{y0:-0.8,y1:7.5},
        swish:{y0:-1.2,y1:7.5}, gelu:{y0:-1.2,y1:7.5}, mish:{y0:-1.2,y1:7.5}
    };

    let t = -6, playing = true, animId = null;
    let wavePhase = 0;

    function draw() {
        const W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);
        const name = actSel.value;
        const fn = fns[name] || fns.sigmoid;
        const rg = RANGES[name] || RANGES.sigmoid;
        const a = parseFloat(scaleSld.value), b = parseFloat(biasSld.value);

        // ---------- 左半：切线扫描 ----------
        const L = { x0: 70, y0: 30, w: 400, h: 240 };
        const X = x => L.x0 + (x + 6) / 12 * L.w;
        const Y = y => L.y0 + (1 - (y - rg.y0) / (rg.y1 - rg.y0)) * L.h;

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L.x0, Y(0)); ctx.lineTo(L.x0 + L.w, Y(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X(0), L.y0); ctx.lineTo(X(0), L.y0 + L.h); ctx.stroke();
        fxLabel(ctx, 'f(x) 与切线', L.x0 + L.w / 2, L.y0 - 14, 'rgba(255,255,255,0.75)', 'bold 13px "Microsoft YaHei"', 'center');

        ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = -6; x <= 6; x += 0.05) {
            const px = X(x), py = Y(fn.f(a * x + b));
            x === -6 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        const x = t, yv = fn.f(a * x + b), dv = a * fn.d(a * x + b);
        const px = X(x), py = Y(yv);
        const tl = 90;
        // 切线：斜率换算为像素比例
        const slopePx = dv * (L.w / 12) / (L.h / (rg.y1 - rg.y0));
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - tl / 2, py - slopePx * tl / 2);
        ctx.lineTo(px + tl / 2, py + slopePx * tl / 2);
        ctx.stroke();

        const glow = ctx.createRadialGradient(px, py, 0, px, py, 16);
        glow.addColorStop(0, 'rgba(236,72,153,0.5)'); glow.addColorStop(1, 'rgba(236,72,153,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ec4899';
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

        fxLabel(ctx, 'x = ' + x.toFixed(2), px, L.y0 + L.h + 16, 'rgba(255,255,255,0.55)', '11px Consolas', 'center');
        fxLabel(ctx, "f'(x) = " + dv.toFixed(3), Math.min(px + 12, L.x0 + L.w - 110), py - 16, '#fbbf24', 'bold 12px Consolas');

        // ---------- 右半：波形穿透 ----------
        const R = { x0: 560, y0: 30, w: 400, h: 240 };
        const RX = i => R.x0 + i / 240 * R.w;
        const RYf = y => R.y0 + (1 - (y - rg.y0) / (rg.y1 - rg.y0)) * R.h;

        fxLabel(ctx, '输入波形 s·x+b → f(·) 输出', R.x0 + R.w / 2, R.y0 - 14, 'rgba(255,255,255,0.75)', 'bold 13px "Microsoft YaHei"', 'center');
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.moveTo(R.x0, RYf(0)); ctx.lineTo(R.x0 + R.w, RYf(0)); ctx.stroke();

        const N = 240;
        ctx.strokeStyle = 'rgba(148,163,184,0.55)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
            const xin = -3 + 6 * i / N;
            const yin = a * Math.sin(xin * 2 + wavePhase) + b;
            const py = RYf(Math.max(rg.y0, Math.min(rg.y1, yin)));
            i === 0 ? ctx.moveTo(RX(i), py) : ctx.lineTo(RX(i), py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
            const xin = -3 + 6 * i / N;
            const yin = a * Math.sin(xin * 2 + wavePhase) + b;
            const py = RYf(fn.f(yin));
            i === 0 ? ctx.moveTo(RX(i), py) : ctx.lineTo(RX(i), py);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(148,163,184,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(R.x0 + 6, R.y0 + R.h + 14); ctx.lineTo(R.x0 + 30, R.y0 + R.h + 14); ctx.stroke();
        ctx.setLineDash([]);
        fxLabel(ctx, '输入', R.x0 + 36, R.y0 + R.h + 14, '#94a3b8', '11px "Microsoft YaHei"');
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(R.x0 + 90, R.y0 + R.h + 14); ctx.lineTo(R.x0 + 114, R.y0 + R.h + 14); ctx.stroke();
        fxLabel(ctx, '输出', R.x0 + 120, R.y0 + R.h + 14, '#94a3b8', '11px "Microsoft YaHei"');

        wavePhase += 0.02;
        t += 0.035;
        if (t > 6) t = -6;
        if (playing) animId = requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { playing = false; if (animId) cancelAnimationFrame(animId); }
        else if (!playing) { playing = true; animId = requestAnimationFrame(draw); }
    });

    draw();
}

// ============================================================
// 教学动画 2：CNN 特征提取流水线 Conv → ReLU → MaxPool
//   6×6 输入 → 3×3 卷积(步幅1) → 4×4 ReLU → 2×2 MaxPool(窗口2)
//   光标沿三个阶段依次点亮计算路径，右侧实时显示每步数值来源
// ============================================================
function initCNNPipelineFX() {
    const cv = ensureCompanion('fxCNNPipeline', '动画演示：Conv → ReLU → MaxPool 完整计算流水线', 1000, 340);
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const cnnCanvas = document.getElementById('cnnCanvas');
    if (!cnnCanvas) return;

    // 固定演示数据
    const IMG = [
        [0.1, 0.1, 0.9, 0.1, 0.1, 0.1],
        [0.1, 0.9, 0.9, 0.9, 0.1, 0.1],
        [0.1, 0.9, 0.1, 0.9, 0.1, 0.1],
        [0.1, 0.9, 0.1, 0.9, 0.1, 0.1],
        [0.1, 0.9, 0.9, 0.9, 0.1, 0.1],
        [0.1, 0.1, 0.9, 0.1, 0.1, 0.1]
    ];
    const K = [
        [1, 0, -1],
        [1, 0, -1],
        [1, 0, -1]
    ];
    // 卷积
    const conv = [];
    for (let i = 0; i < 4; i++) {
        const row = [];
        for (let j = 0; j < 4; j++) {
            let sum = 0;
            for (let m = 0; m < 3; m++) for (let n = 0; n < 3; n++)
                sum += IMG[i + m][j + n] * K[m][n];
            row.push(sum);
        }
        conv.push(row);
    }
    const relu = conv.map(r => r.map(v => Math.max(0, v)));
    const pool = [];
    for (let i = 0; i < 2; i++) {
        const row = [];
        for (let j = 0; j < 2; j++)
            row.push(Math.max(relu[i*2][j*2], relu[i*2][j*2+1], relu[i*2+1][j*2], relu[i*2+1][j*2+1]));
        pool.push(row);
    }

    // 总步数：卷积 16 步 + ReLU 16 步 + 池化 4 步 = 36
    const TOTAL = 36;
    let step = 0, playing = true, animId = null, frame = 0;

    function stageOf(st) {
        if (st < 16) return { name: 'conv', idx: st };
        if (st < 32) return { name: 'relu', idx: st - 16 };
        return { name: 'pool', idx: st - 32 };
    }

    function drawMat(x0, y0, cell, data, title, colors, hiIdx, fmt, dimOthers) {
        const rows = data.length, cols = data[0].length;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 13px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(title, x0 + cols * cell / 2, y0 - 8);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const v = data[i][j];
                const flat = i * cols + j;
                const isHi = hiIdx === flat;
                let color = colors.pos, alpha = 0.1 + Math.min(1, Math.abs(v)) * 0.7;
                if (v < 0) { color = colors.neg; }
                if (isHi) { alpha = 1; }
                else if (dimOthers && hiIdx >= 0) alpha *= 0.35;
                ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
                ctx.fillRect(x0 + j * cell, y0 + i * cell, cell - 1, cell - 1);
                ctx.strokeStyle = isHi ? '#fbbf24' : 'rgba(255,255,255,0.1)';
                ctx.lineWidth = isHi ? 2.5 : 1;
                ctx.strokeRect(x0 + j * cell, y0 + i * cell, cell - 1, cell - 1);
                ctx.fillStyle = isHi ? '#fff' : 'rgba(226,232,240,0.85)';
                ctx.font = (cell >= 34 ? 12 : 10) + 'px Consolas';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(fmt(v), x0 + j * cell + cell / 2, y0 + i * cell + cell / 2);
            }
        }
        return { x: x0, y: y0, cell, rows, cols };
    }

    function draw() {
        const W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);
        const st = stageOf(Math.floor(step) % TOTAL);
        const loop = Math.floor(step / TOTAL);

        const cellI = 40, cellC = 40, cellP = 52;
        const ix = 60, iy = 70;
        const cx = ix + 6 * cellI + 70, cy = iy;
        const px = cx + 4 * cellC + 80, py = iy;

        // 阶段进度条
        const prog = (Math.floor(step) % TOTAL) / TOTAL;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(60, H - 30, W - 120, 6);
        const pg = ctx.createLinearGradient(60, 0, W - 60, 0);
        pg.addColorStop(0, '#6366f1'); pg.addColorStop(0.5, '#8b5cf6'); pg.addColorStop(1, '#ec4899');
        ctx.fillStyle = pg;
        ctx.fillRect(60, H - 30, (W - 120) * prog, 6);
        fxLabel(ctx, '第 ' + (loop + 1) + ' 轮 · ' + (st.name === 'conv' ? '① 卷积' : st.name === 'relu' ? '② ReLU 激活' : '③ 最大池化'),
            60, H - 14, '#c4b5fd', '12px "Microsoft YaHei"');

        // ① 输入（卷积阶段高亮 3×3 窗口）
        let convHi = -1, winIdx = -1;
        if (st.name === 'conv') {
            convHi = st.idx;
            const oi = (st.idx / 4) | 0, oj = st.idx % 4;
            winIdx = oi * 6 + oj;
        }
        const imgRect = drawMat(ix, iy, cellI, IMG, '输入 6×6', { pos: '99,102,241', neg: '236,72,153' }, -1, v => v.toFixed(1));
        // 卷积窗口
        if (winIdx >= 0) {
            const oi = (winIdx / 6) | 0, oj = winIdx % 6;
            ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
            ctx.strokeRect(imgRect.x + oj * cellI - 1, imgRect.y + oi * cellI - 1, 3 * cellI + 1, 3 * cellI + 1);
        }

        // ② 卷积结果 / ReLU 输入
        const convShow = st.name === 'relu' ? relu : conv;
        let convHiIdx = -1;
        if (st.name === 'conv') convHiIdx = st.idx;
        if (st.name === 'relu') convHiIdx = st.idx;
        drawMat(cx, cy, cellC, convShow, st.name === 'relu' ? 'ReLU 输出 4×4' : '卷积输出 4×4',
            { pos: '139,92,246', neg: '236,72,153' }, convHiIdx,
            v => (Math.abs(v) < 0.05 ? '0' : v.toFixed(1)), st.name === 'relu');

        // 卷积阶段：画核与数值来源
        if (st.name === 'conv') {
            const oi = (st.idx / 4) | 0, oj = st.idx % 4;
            // 汇总算式
            let expr = '';
            for (let m = 0; m < 3; m++) for (let n = 0; n < 3; n++) {
                expr += (m || n ? '+' : '') + IMG[oi + m][oj + n].toFixed(1) + '×' + K[m][n];
            }
            fxLabel(ctx, '= ' + conv[oi][oj].toFixed(1), cx + 8, cy + 4 * cellC + 22, '#fbbf24', '13px Consolas');
            ctx.fillStyle = 'rgba(251,191,36,0.9)';
            ctx.font = '11px Consolas';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(expr.slice(0, 46), cx + 8, cy + 4 * cellC + 42);
            ctx.fillText(expr.slice(46), cx + 8, cy + 4 * cellC + 58);
        }
        if (st.name === 'relu') {
            const oi = (st.idx / 4) | 0, oj = st.idx % 4;
            const v = conv[oi][oj];
            fxLabel(ctx, 'max(0, ' + v.toFixed(1) + ') = ' + Math.max(0, v).toFixed(1),
                cx + 8, cy + 4 * cellC + 30, '#22c55e', 'bold 13px Consolas');
        }

        // ③ 池化输出
        let poolHi = -1;
        if (st.name === 'pool') poolHi = st.idx;
        drawMat(px, py, cellP, pool, 'MaxPool 输出 2×2', { pos: '34,197,94', neg: '236,72,153' }, poolHi, v => v.toFixed(1));
        if (st.name === 'pool') {
            const pi = (st.idx / 2) | 0, pj = st.idx % 2;
            // 高亮池化窗口（在 ReLU 图上）
            ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
            ctx.strokeRect(cx + pj * 2 * cellC - 1, cy + pi * 2 * cellC - 1, 2 * cellC + 1, 2 * cellC + 1);
            fxLabel(ctx, 'max(2×2 窗口) = ' + pool[pi][pj].toFixed(1),
                px + 8, py + 2 * cellP + 26, '#22c55e', 'bold 13px Consolas');
        }

        // 阶段箭头
        fxArrow(ctx, ix + 6 * cellI + 8, iy + 3 * cellI, cx - 8, iy + 2 * cellC, 'rgba(139,92,246,0.5)', 2);
        fxArrow(ctx, cx + 4 * cellC + 8, iy + 2 * cellC, px - 8, iy + cellP, 'rgba(34,197,94,0.5)', 2);

        frame++;
        if (frame % 3 === 0) step += 1;      // 每 3 帧走一步，节奏适合讲解
        if (playing) animId = requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { playing = false; if (animId) cancelAnimationFrame(animId); }
        else if (!playing) { playing = true; animId = requestAnimationFrame(draw); }
    });

    draw();
}

// ============================================================
// 教学动画 3：Softmax 分步计算演示（标准数学排版）
//   变量斜体 Times New Roman、真正的上标/下标基线偏移、
//   中文黑体 + 数学衬线体混排；光标逐格点亮计算步骤
// ============================================================
function initSoftmaxStepsFX() {
    const cv = ensureCompanion('fxSoftmaxSteps', '分步计算演示：logits → 指数 → Softmax 归一化 → 交叉熵', 1000, 260);
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const GOLD_TXT = '#fbbf24';
    const smCanvas = document.getElementById('smCanvas');
    if (!smCanvas) return;

    // 固定演示 logits（对应三类）
    const Z = [2.0, 1.0, 0.3];
    const COLORS = ['99,102,241', '236,72,153', '34,197,94'];
    const STEPS = 4;
    const TICKS_PER_STEP = 90;

    let tick = 0, playing = true, animId = null;

    const mMax = Math.max(...Z);
    const exps = Z.map(vv => Math.exp(vv - mMax));
    const sum = exps.reduce((a, b) => a + b, 0);
    const ps = exps.map(vv => vv / sum);
    const loss = -Math.log(ps[1]);

    // ---- 数学排版工具（变量斜体 Times，上下标基线偏移） ----
    const SERIF = "'Times New Roman', Georgia, serif";
    function buildFont(st, sz, it) {
        const fam = (st === 'zh') ? '"Microsoft YaHei", sans-serif' : SERIF;
        const ital = (st === 'v' || ((st === 'sup' || st === 'sub') && it)) ? 'italic ' : '';
        return ital + sz + 'px ' + fam;
    }
    function mathW(segs, sc) {
        let w = 0;
        for (const sg of segs) {
            ctx.font = buildFont(sg.st, sg.sz * sc, sg.it);
            w += ctx.measureText(sg.t).width;
        }
        return w;
    }
    // segs: [{t, st, sz, c, it}]  st: zh 中文 | num 正体 | v 斜体变量 | sup 上标 | sub 下标
    function drawMath(segs, x, y, align, maxW, baseC) {
        let sc = 1;
        if (maxW) {
            const w1 = mathW(segs, 1);
            if (w1 > maxW) sc = maxW / w1;
        }
        const w = mathW(segs, sc);
        let cx = (align === 'center') ? x - w / 2 : x;
        for (const sg of segs) {
            const sz = sg.sz * sc;
            ctx.font = buildFont(sg.st, sz, sg.it);
            ctx.fillStyle = sg.c || baseC || '#e2e8f0';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            let dy = 0;
            if (sg.st === 'sup') dy = -sz * 0.45;
            if (sg.st === 'sub') dy = sz * 0.28;
            ctx.fillText(sg.t, cx, y + dy);
            cx += ctx.measureText(sg.t).width;
        }
        return w;
    }
    const vseg = (t, sz, c, it = true) => ({ t, st: 'v', sz, c, it });
    const nseg = (t, sz, c) => ({ t, st: 'num', sz, c });
    const zhseg = (t, sz, c) => ({ t, st: 'zh', sz, c });
    const supseg = (t, sz, c, it = true) => ({ t, st: 'sup', sz, c, it });
    const subseg = (t, sz, c, it = true) => ({ t, st: 'sub', sz, c, it });
    const minus = t => String(t).replace(/-/g, '\u2212');

    function stepOf(t) { return Math.floor(t / TICKS_PER_STEP) % STEPS; }
    function fracOf(t) { return (t % TICKS_PER_STEP) / TICKS_PER_STEP; }

    function cellAlpha(stepIdx, k, frac) {
        const reveal = frac * 3;
        return k < reveal ? 1 : (k < reveal + 1 ? (reveal - k) : 0.12);
    }

    function drawCol(x0, y0, cw, chh, titleSegs, values, fmt, stepIdx, activeStep, colors) {
        drawMath(titleSegs, x0 + cw / 2, y0 - 12, 'center', cw + 70);
        for (let k = 0; k < 3; k++) {
            let alpha = 0.12;
            if (activeStep === stepIdx) alpha = Math.max(0.12, cellAlpha(stepIdx, k, fracOf(tick)) * 0.9);
            else if (activeStep > stepIdx) alpha = 0.75;
            const c = colors ? colors[k] : '139,92,246';
            ctx.fillStyle = 'rgba(' + c + ',' + alpha + ')';
            ctx.fillRect(x0, y0 + k * chh, cw, chh - 3);
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x0, y0 + k * chh, cw, chh - 3);
            if (alpha > 0.3) {
                ctx.fillStyle = '#fff';
                ctx.font = '600 15px ' + SERIF;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(fmt(values[k]), x0 + cw / 2, y0 + k * chh + chh / 2 - 1.5);
            }
        }
    }

    function draw() {
        const W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);
        const sp = stepOf(tick);

        const cw = 120, chh = 44, y0 = 62;
        const x1 = 70, x2 = x1 + cw + 90, x3 = x2 + cw + 90, x4 = x3 + cw + 90;

        drawCol(x1, y0, cw, chh,
            [zhseg('① logits ', 13), vseg('z', 15)],
            Z, x => x.toFixed(2), 0, sp, COLORS);
        drawCol(x2, y0, cw, chh,
            [zhseg('② 指数化 ', 13), vseg('e', 15), supseg('z', 14)],
            exps, x => x.toFixed(3), 1, sp, COLORS);
        drawCol(x3, y0, cw, chh,
            [zhseg('③ Softmax 归一化 ', 13), vseg('p', 15)],
            ps, x => x.toFixed(3), 2, sp, COLORS);

        // ④ 交叉熵
        drawMath([zhseg('④ 交叉熵 ', 13), vseg('L', 15)], x4 + cw / 2, y0 - 12, 'center', cw + 40);
        const lAlpha = sp === 3 ? 0.3 + 0.6 * fracOf(tick) : (sp > 3 ? 0.9 : 0.12);
        ctx.fillStyle = 'rgba(251,191,36,' + lAlpha + ')';
        ctx.fillRect(x4, y0, cw, 3 * chh - 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(x4, y0, cw, 3 * chh - 3);
        if (lAlpha > 0.4) {
            ctx.fillStyle = '#0f172a';
            ctx.font = '600 22px ' + SERIF;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(loss.toFixed(4), x4 + cw / 2, y0 + 1.5 * chh);
        }

        // 连接箭头
        fxArrow(ctx, x1 + cw + 8, y0 + 1.5 * chh, x2 - 8, y0 + 1.5 * chh, 'rgba(139,92,246,0.45)', 2);
        fxArrow(ctx, x2 + cw + 8, y0 + 1.5 * chh, x3 - 8, y0 + 1.5 * chh, 'rgba(139,92,246,0.45)', 2);
        fxArrow(ctx, x3 + cw + 8, y0 + 1.5 * chh, x4 - 8, y0 + 1.5 * chh, 'rgba(139,92,246,0.45)', 2);

        // 底部算式（标准数学排版，超宽自动缩小）
        ctx.fillStyle = 'rgba(251,191,36,0.12)';
        ctx.fillRect(60, H - 44, W - 120, 32);
        const prefix = '当前步骤 ' + (sp + 1) + '/4:';
        ctx.fillStyle = GOLD_TXT;
        ctx.font = '600 13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(prefix, 76, H - 22);
        const pw = ctx.measureText(prefix).width;

        const eSeg = (zk, val) => [vseg('e', 15), supseg(minus(zk), 13, undefined, false), nseg(' = ' + val, 15)];
        const msgs = [
            [zhseg('原始输出 logits（未归一化的打分）', 14)],
            [
                zhseg('对每个得分取指数 '), vseg('e', 15), supseg('z', 14),
                zhseg('（先减最大值 '), nseg(mMax.toFixed(1), 15), zhseg('）防溢出：  '),
                ...eSeg(minus((Z[0] - mMax).toFixed(1)), exps[0].toFixed(2)), nseg(',  ', 15),
                ...eSeg(minus((Z[1] - mMax).toFixed(1)), exps[1].toFixed(2)), nseg(',  ', 15),
                ...eSeg(minus((Z[2] - mMax).toFixed(1)), exps[2].toFixed(2))
            ],
            [
                zhseg('归一化：  '), vseg('p', 15), subseg('k', 14),
                nseg(' = ', 15), vseg('e', 15), subseg('k', 14),
                nseg(' ÷ ' + sum.toFixed(3), 15), nseg('   →   ', 15),
                vseg('p', 15), nseg(' = [' + ps.map(x => x.toFixed(3)).join(', ') + ']', 15)
            ],
            [
                zhseg('交叉熵（真实类 = 第 2 类）：  '), vseg('L', 15),
                nseg(' = −ln(', 15), vseg('p', 15), subseg('2', 14, undefined, false),
                nseg(') = −ln(' + ps[1].toFixed(3) + ') = ' + loss.toFixed(4), 15)
            ]
        ];
        drawMath(msgs[sp], 76 + pw + 14, H - 22, 'left', W - 120 - pw - 46);

        tick++;
        if (playing) animId = requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { playing = false; if (animId) cancelAnimationFrame(animId); }
        else if (!playing) { playing = true; animId = requestAnimationFrame(draw); }
    });

    draw();
}

// ============================================================
// 实验 11：梯度消失与梯度爆炸
// ============================================================
function initVanishingLab() {
    const canvas = document.getElementById('vdCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const actSel   = document.getElementById('vdActSelect');
    const depthSld = document.getElementById('vdDepthSlider');
    const depthVal = document.getElementById('vdDepthValue');
    const stdSld   = document.getElementById('vdStdSlider');
    const stdVal   = document.getElementById('vdStdValue');
    const initSel  = document.getElementById('vdInitSelect');
    const resetBtn = document.getElementById('vdResetBtn');
    const gradTop  = document.getElementById('vdGradTop');
    const gradBot  = document.getElementById('vdGradBottom');
    const ratioEl  = document.getElementById('vdRatio');
    const diagEl   = document.getElementById('vdDiag');

    let weights = [], depth = 20;

    function initWeights() {
        depth = parseInt(depthSld.value);
        weights = [];
        const act = actSel.value, mode = initSel.value;
        for (let l = 0; l < depth; l++) {
            let std;
            if (mode === 'xavier')      std = Math.sqrt(1 / 1);            // 输入维度=1
            else if (mode === 'he')     std = Math.sqrt(2 / 1);
            else std = parseFloat(stdSld.value);
            weights.push(labs2Randn() * std);
        }
        computeAndDraw();
    }

    function actF(x, act) {
        if (act === 'sigmoid') return labs2Sigmoid(x);
        if (act === 'tanh') return Math.tanh(x);
        return Math.max(0, x);
    }
    function actD(y, act) {
        if (act === 'sigmoid') return y * (1 - y);
        if (act === 'tanh') return 1 - y * y;
        return y > 0 ? 1 : 0;
    }

    // 前向并保存激活，再反向计算每层梯度范数
    function computeGrads() {
        const act = actSel.value;
        let a = 1.0;                       // 输入标量
        const acts = [a];
        for (let l = 0; l < depth; l++) {
            const z = weights[l] * a;
            a = actF(z, act);
            acts.push(a);
        }
        // 输出 L = 0.5 (a_L - 1)^2
        let g = acts[depth] - 1;           // dL/da_L
        const grads = new Array(depth + 1).fill(0);
        grads[depth] = Math.abs(g);
        for (let l = depth; l >= 1; l--) {
            g = g * actD(acts[l], act) * weights[l - 1];   // 回传到 z_{l-1}
            grads[l - 1] = Math.abs(g);
        }
        return { acts, grads };
    }

    function computeAndDraw() {
        const { acts, grads } = computeGrads();
        const W = canvas.width, Hc = canvas.height;
        ctx.clearRect(0, 0, W, Hc);

        const px0 = 60, py0 = 46, pw = W - 100, ph = Hc - 110;
        const maxG = Math.max(...grads, 1e-6);
        const logMax = Math.log10(maxG), logMin = Math.log10(1e-8);
        const yOf = g => {
            const lg = Math.log10(Math.max(g, 1e-8));
            return py0 + ph - (lg - logMin) / (logMax - logMin + 1e-9) * ph;
        };

        // 网格线（10^n）
        ctx.font = '10px Consolas, monospace';
        for (let e = Math.ceil(logMin); e <= Math.floor(logMax); e++) {
            const y = py0 + ph - (e - logMin) / (logMax - logMin + 1e-9) * ph;
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.beginPath(); ctx.moveTo(px0, y); ctx.lineTo(px0 + pw, y); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText('1e' + e, px0 - 6, y);
        }

        // 梯度范数曲线
        ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let l = 0; l <= depth; l++) {
            const x = px0 + l / depth * pw;
            const y = yOf(grads[l]);
            l === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        // 数据点
        for (let l = 0; l <= depth; l++) {
            const x = px0 + l / depth * pw;
            const y = yOf(grads[l]);
            const danger = grads[l] < 1e-4 || grads[l] > 1e3;
            ctx.fillStyle = danger ? '#ef4444' : '#8b5cf6';
            ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }

        // 危险区域提示
        ctx.fillStyle = 'rgba(239,68,68,0.10)';
        ctx.fillRect(px0, py0, pw, yOf(1e-4) - py0);
        ctx.fillStyle = 'rgba(239,68,68,0.55)';
        ctx.font = '10px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('⟵ 梯度消失区 (<1e-4)', px0 + 6, py0 + 4);
        const yTop = yOf(1e3);
        if (yTop > py0) {
            ctx.fillStyle = 'rgba(239,68,68,0.10)';
            ctx.fillRect(px0, yTop, pw, py0 + ph - yTop);
            ctx.fillStyle = 'rgba(239,68,68,0.55)';
            ctx.fillText('⟶ 梯度爆炸区 (>1e3)', px0 + 6, Math.max(yTop + 4, py0 + 4));
        }

        // 轴
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(px0, py0, pw, ph);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '11px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('层编号 (1 = 输入层附近 → ' + depth + ' = 输出层附近)', px0 + pw / 2, py0 + ph + 10);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 13px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('各层梯度范数 |∂L/∂z| (对数刻度)', px0 + pw / 2, py0 - 10);

        // 激活值曲线（右上小图）
        const ix0 = W - 240, iy0 = py0 - 30, iw = 170, ih = 60;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('前向激活值', ix0, iy0 - 2);
        ctx.strokeStyle = 'rgba(34,197,94,0.8)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        let minA = Math.min(...acts), maxA = Math.max(...acts);
        if (maxA - minA < 1e-6) { maxA += 0.5; minA -= 0.5; }
        for (let l = 0; l <= depth; l++) {
            const x = ix0 + l / depth * iw;
            const y = iy0 + ih - (acts[l] - minA) / (maxA - minA) * ih;
            l === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 信息面板
        const gTop = grads[depth], gBot = grads[0];
        gradTop.textContent = gTop.toExponential(2);
        gradBot.textContent = gBot.toExponential(2);
        const ratio = gBot / Math.max(gTop, 1e-12);
        ratioEl.textContent = ratio.toExponential(2);
        let diag;
        if (gBot < 1e-4) diag = '⚠ 梯度消失：靠近输入的层几乎学不到东西。可尝试 ReLU / He 初始化 / 残差连接 / BatchNorm';
        else if (gBot > 1e3) diag = '⚠ 梯度爆炸：梯度逐层放大导致训练发散。可尝试梯度裁剪 / 降低学习率 / 正交初始化';
        else diag = '✓ 梯度流动健康，各层都能获得有效梯度';
        diagEl.textContent = diag;
        depthVal.textContent = depth;
        stdVal.textContent = parseFloat(stdSld.value).toFixed(2);
    }

    [actSel, depthSld, stdSld, initSel].forEach(el => el.addEventListener('input', computeAndDraw));
    resetBtn.addEventListener('click', initWeights);

    initWeights();
}

// ============================================================
// 实验 12：优化器对比大赛
// ============================================================
function initOptimizerLab() {
    const canvas = document.getElementById('opCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const lrSld    = document.getElementById('opLrSlider');
    const lrVal    = document.getElementById('opLrValue');
    const lossSel  = document.getElementById('opLossSelect');
    const stepBtn  = document.getElementById('opStepBtn');
    const runBtn   = document.getElementById('opRunBtn');
    const resetBtn = document.getElementById('opResetBtn');
    const statsEl  = document.getElementById('opStats');
    const stepEl   = document.getElementById('opStepCount');

    const OPTS = [
        { name: 'SGD',      color: '#ef4444' },
        { name: 'Momentum', color: '#f59e0b' },
        { name: 'RMSProp',  color: '#22c55e' },
        { name: 'Adam',     color: '#3b82f6' }
    ];

    function lossFn(type, x, y) {
        if (type === 'rosenbrock') return (1 - x) ** 2 + 8 * (y - x * x) ** 2;
        if (type === 'saddle') return 0.6 * x * x - 0.6 * y * y + 0.15 * x ** 4 + 0.15 * y ** 4 + 0.5;
        return 0.35 * (x * x + y * y) + 1.2 * Math.sin(2.2 * x) * Math.cos(2.2 * y) + 1.6;
    }
    function gradFn(type, x, y) {
        if (type === 'rosenbrock')
            return [-2 * (1 - x) - 32 * x * (y - x * x), 16 * (y - x * x)];
        if (type === 'saddle')
            return [1.2 * x + 0.6 * x ** 3, -1.2 * y + 0.6 * y ** 3];
        return [0.7 * x + 2.64 * Math.cos(2.2 * x) * Math.cos(2.2 * y),
                0.7 * y - 2.64 * Math.sin(2.2 * x) * Math.sin(2.2 * y)];
    }

    let paths, states, stepCount, running = false;
    // 教学动画数据出口：负梯度方向 + 单步位移
    window.__opFXState = { dirs: [[1,0],[1,0],[1,0],[1,0]], speeds: [0,0,0,0] };

    function resetAll() {
        paths = OPTS.map(() => [[-1.6, 1.8]]);
        states = OPTS.map(() => ({ m: [0, 0], v: [0, 0] }));
        stepCount = 0;
        draw();
    }

    function stepOnce() {
        const type = lossSel.value, lr = parseFloat(lrSld.value);
        for (let k = 0; k < OPTS.length; k++) {
            const p = paths[k][paths[k].length - 1];
            const prev = [p[0], p[1]];
            const g = gradFn(type, p[0], p[1]);
            const st = states[k];
            if (k === 0) {           // SGD
                p[0] -= lr * g[0]; p[1] -= lr * g[1];
            } else if (k === 1) {    // Momentum
                st.m[0] = 0.9 * st.m[0] + g[0]; st.m[1] = 0.9 * st.m[1] + g[1];
                p[0] -= lr * st.m[0]; p[1] -= lr * st.m[1];
            } else if (k === 2) {    // RMSProp
                st.v[0] = 0.9 * st.v[0] + 0.1 * g[0] * g[0];
                st.v[1] = 0.9 * st.v[1] + 0.1 * g[1] * g[1];
                p[0] -= lr * g[0] / (Math.sqrt(st.v[0]) + 1e-8);
                p[1] -= lr * g[1] / (Math.sqrt(st.v[1]) + 1e-8);
            } else {                 // Adam
                st.m[0] = 0.9 * st.m[0] + 0.1 * g[0]; st.m[1] = 0.9 * st.m[1] + 0.1 * g[1];
                st.v[0] = 0.999 * st.v[0] + 0.001 * g[0] * g[0];
                st.v[1] = 0.999 * st.v[1] + 0.001 * g[1] * g[1];
                const t = stepCount + 1;
                const mh0 = st.m[0] / (1 - Math.pow(0.9, t)), mh1 = st.m[1] / (1 - Math.pow(0.9, t));
                const vh0 = st.v[0] / (1 - Math.pow(0.999, t)), vh1 = st.v[1] / (1 - Math.pow(0.999, t));
                p[0] -= lr * mh0 / (Math.sqrt(vh0) + 1e-8);
                p[1] -= lr * mh1 / (Math.sqrt(vh1) + 1e-8);
            }
            p[0] = Math.max(-2.4, Math.min(2.4, p[0]));
            p[1] = Math.max(-2.0, Math.min(2.0, p[1]));
            paths[k].push([p[0], p[1]]);
            // 记录负梯度方向与本步位移（教学动画用）
            const gn = Math.hypot(g[0], g[1]) || 1;
            window.__opFXState.dirs[k] = [-g[0] / gn, -g[1] / gn];
            window.__opFXState.speeds[k] = Math.hypot(paths[k][paths[k].length - 1][0] - prev[0], paths[k][paths[k].length - 1][1] - prev[1]);
        }
        stepCount++;
        draw();
    }

    function draw() {
        const W = canvas.width, Hc = canvas.height;
        ctx.clearRect(0, 0, W, Hc);
        const type = lossSel.value;

        // ---- 左：等高线 + 轨迹 ----
        const px0 = 46, py0 = 40, pw = 400, ph = 360;
        const xMin = -2.4, xMax = 2.4, yMin = -2.0, yMax = 2.0;
        const res = 80;
        const vals = [];
        for (let i = 0; i <= res; i++) {
            for (let j = 0; j <= res; j++) {
                const x = xMin + (xMax - xMin) * j / res;
                const y = yMin + (yMax - yMin) * (res - i) / res;
                vals.push(lossFn(type, x, y));
            }
        }
        vals.sort((a, b) => a - b);
        const lo = vals[Math.floor(vals.length * 0.04)];
        const hi = vals[Math.floor(vals.length * 0.90)];
        const cell = pw / res;
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const x = xMin + (xMax - xMin) * (j + 0.5) / res;
                const y = yMin + (yMax - yMin) * (res - 1 - i + 0.5) / res;
                let v = (lossFn(type, x, y) - lo) / Math.max(hi - lo, 1e-9);
                v = Math.max(0, Math.min(1, v));
                // 深蓝→青→黄 热度
                const r = Math.floor(30 + 225 * v);
                const g = Math.floor(60 + 100 * (1 - Math.abs(v - 0.5) * 2) + 60 * v);
                const b = Math.floor(200 - 160 * v);
                ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
                ctx.fillRect(px0 + j * cell, py0 + i * cell, cell + 0.5, cell + 0.5);
            }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(px0, py0, pw, ph);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 13px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('损失等高线与四条优化轨迹', px0 + pw / 2, py0 - 8);

        // 轨迹
        for (let k = 0; k < OPTS.length; k++) {
            ctx.strokeStyle = OPTS[k].color; ctx.lineWidth = 2;
            ctx.beginPath();
            const path = paths[k];
            for (let i = 0; i < path.length; i++) {
                const x = px0 + (path[i][0] - xMin) / (xMax - xMin) * pw;
                const y = py0 + (1 - (path[i][1] - yMin) / (yMax - yMin)) * ph;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            // 当前位置
            const cur = path[path.length - 1];
            const x = px0 + (cur[0] - xMin) / (xMax - xMin) * pw;
            const y = py0 + (1 - (cur[1] - yMin) / (yMax - yMin)) * ph;
            ctx.fillStyle = OPTS[k].color;
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
        }
        // 起点
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px0 + (-1.6 - xMin) / (xMax - xMin) * pw, py0 + (1 - (1.8 - yMin) / (yMax - yMin)) * ph, 4, 0, Math.PI * 2);
        ctx.fill();

        // ---- 右：loss 下降曲线 ----
        const cx0 = px0 + pw + 55, cw2 = W - cx0 - 36, ch2 = 300, cy0 = py0 + 40;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(cx0, cy0, cw2, ch2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('损失下降曲线', cx0, cy0 - 8);
        // 图例
        ctx.font = '11px "Microsoft YaHei"';
        let lx = cx0;
        for (const o of OPTS) {
            ctx.fillStyle = o.color;
            ctx.fillRect(lx, cy0 + 8, 10, 10);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(o.name, lx + 14, cy0 + 18);
            lx += ctx.measureText(o.name).width + 40;
        }
        const maxLen = Math.max(...paths.map(p => p.length));
        if (maxLen > 2) {
            let vMax = 0.01;
            for (const path of paths) {
                for (const pt of path) vMax = Math.max(vMax, lossFn(type, pt[0], pt[1]));
            }
            for (let k = 0; k < OPTS.length; k++) {
                ctx.strokeStyle = OPTS[k].color; ctx.lineWidth = 1.8;
                ctx.beginPath();
                const path = paths[k];
                for (let i = 0; i < path.length; i++) {
                    const v = lossFn(type, path[i][0], path[i][1]);
                    const x = cx0 + i / (maxLen - 1) * cw2;
                    const y = cy0 + ch2 - Math.min(v / vMax, 1) * (ch2 - 8);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }

        // 信息面板
        const parts = [];
        for (let k = 0; k < OPTS.length; k++) {
            const cur = paths[k][paths[k].length - 1];
            parts.push(OPTS[k].name + ' ' + lossFn(type, cur[0], cur[1]).toFixed(3));
        }
        statsEl.textContent = parts.join('   |   ');
        stepEl.textContent = stepCount;
        lrVal.textContent = parseFloat(lrSld.value).toFixed(3);
    }

    stepBtn.addEventListener('click', () => { if (!running) stepOnce(); });
    runBtn.addEventListener('click', () => {
        if (running) return;
        running = true;
        let c = 0;
        const timer = setInterval(() => {
            stepOnce();
            if (++c >= 200) { clearInterval(timer); running = false; }
        }, 16);
    });
    resetBtn.addEventListener('click', resetAll);
    lossSel.addEventListener('change', resetAll);
    lrSld.addEventListener('input', draw);

    resetAll();
}

// ============================================================
// 实验 13：学习率调度器
// ============================================================
function initSchedulerLab() {
    const canvas = document.getElementById('schCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const schSel   = document.getElementById('schSelect');
    const lr0Sld   = document.getElementById('schLr0Slider');
    const lr0Val   = document.getElementById('schLr0Value');
    const epSld    = document.getElementById('schEpochSlider');
    const epVal    = document.getElementById('schEpochValue');
    const trainBtn = document.getElementById('schTrainBtn');
    const autoBtn  = document.getElementById('schAutoBtn');
    const resetBtn = document.getElementById('schResetBtn');
    const statsEl  = document.getElementById('schStats');

    const STRATS = [
        { key: 'constant', name: 'Constant', color: '#94a3b8' },
        { key: 'step',     name: 'StepLR',   color: '#f59e0b' },
        { key: 'cosine',   name: 'Cosine',   color: '#3b82f6' },
        { key: 'exp',      name: 'Exp',      color: '#ec4899' }
    ];

    // 任务：2→8→1 tanh 网络拟合 1D 函数 y = sin(2x)+0.5x
    const TDATA = [];
    for (let i = 0; i < 30; i++) {
        const x = -3 + 6 * i / 29;
        TDATA.push([x, Math.sin(2 * x) + 0.5 * x]);
    }

    let nets, lossHists, epoch = 0, autoTimer = null;

    function makeNet() {
        // 每个策略独立网络（相同初始化）
        const W1 = [], b1 = [], W2 = [], b2 = [];
        for (let i = 0; i < 8; i++) {
            W1.push([labs2Randn() * 0.7, labs2Randn() * 0.7]);
            b1.push(0);
        }
        for (let i = 0; i < 8; i++) { W2.push(labs2Randn() * 0.7); }
        return { W1, b1, W2, b2: 0 };
    }
    function cloneNet(n) {
        return {
            W1: n.W1.map(r => r.slice()), b1: n.b1.slice(),
            W2: n.W2.slice(), b2: n.b2
        };
    }

    function fwd(net, x) {
        const h = [];
        for (let i = 0; i < 8; i++) h.push(Math.tanh(net.W1[i][0] * x + net.b1[i]));
        let y = net.b2;
        for (let i = 0; i < 8; i++) y += net.W2[i] * h[i];
        return { h, y };
    }

    function trainStep(net, lr) {
        let loss = 0;
        const gW1 = Array.from({length: 8}, () => [0, 0]);
        const gb1 = Array(8).fill(0);
        const gW2 = Array(8).fill(0);
        let gb2 = 0;
        for (const [x, t] of TDATA) {
            const { h, y } = fwd(net, x);
            const e = y - t;
            loss += 0.5 * e * e;
            gb2 += e;
            for (let i = 0; i < 8; i++) {
                gW2[i] += e * h[i];
                const dz = e * net.W2[i] * (1 - h[i] * h[i]);
                gW1[i][0] += dz * x; gb1[i] += dz;
            }
        }
        const n = TDATA.length;
        for (let i = 0; i < 8; i++) {
            net.W1[i][0] -= lr * gW1[i][0] / n; net.b1[i] -= lr * gb1[i] / n;
            net.W2[i] -= lr * gW2[i] / n;
        }
        net.b2 -= lr * gb2 / n;
        return loss / n;
    }

    function lrAt(strategy, e, lr0) {
        const warm = Math.max(e, 1);              // 从第 1 轮开始
        switch (strategy) {
            case 'constant': return lr0;
            case 'step':     return lr0 * Math.pow(0.5, Math.floor(e / 5));
            case 'cosine':   return lr0 * 0.5 * (1 + Math.cos(Math.PI * Math.min(e / 40, 1)));
            case 'exp':      return lr0 * Math.pow(0.93, e);
        }
        return lr0;
    }

    function resetAll() {
        stopAuto();
        const base = makeNet();
        nets = {}; lossHists = {}; epoch = 0;
        for (const s of STRATS) {
            nets[s.key] = cloneNet(base);
            lossHists[s.key] = [];
        }
        draw();
    }

    function trainEpoch() {
        const lr0 = parseFloat(lr0Sld.value);
        const nSteps = parseInt(epSld.value);
        const active = [...schSel.selectedOptions].map(o => o.value);
        for (const s of STRATS) {
            if (!active.includes(s.key)) continue;
            const lr = lrAt(s.key, epoch, lr0);
            let last = null;
            for (let i = 0; i < nSteps; i++) last = trainStep(nets[s.key], lr);
            lossHists[s.key].push(last);
        }
        epoch++;
        draw();
    }

    function draw() {
        const W = canvas.width, Hc = canvas.height;
        ctx.clearRect(0, 0, W, Hc);
        const lr0 = parseFloat(lr0Sld.value);
        const active = [...schSel.selectedOptions].map(o => o.value);

        // ---- 上：学习率曲线 ----
        const lx0 = 56, ly0 = 36, lw = W - 96, lh = 150;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(lx0, ly0, lw, lh);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('学习率 η 随 epoch 变化', lx0, ly0 - 6);
        const maxE = Math.max(epoch, 40);
        for (const s of STRATS) {
            if (!active.includes(s.key)) continue;
            ctx.strokeStyle = s.color; ctx.lineWidth = 2;
            ctx.beginPath();
            for (let e = 0; e <= Math.max(epoch, 1); e++) {
                const x = lx0 + e / maxE * lw;
                const y = ly0 + lh - lrAt(s.key, e, lr0) / (lr0 * 1.05) * (lh - 10);
                e === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        // 图例
        let gx = lx0 + 6;
        ctx.font = '11px "Microsoft YaHei"';
        for (const s of STRATS) {
            const on = active.includes(s.key);
            ctx.fillStyle = on ? s.color : 'rgba(148,163,184,0.3)';
            ctx.fillRect(gx, ly0 + 6, 10, 10);
            ctx.fillStyle = on ? '#cbd5e1' : 'rgba(148,163,184,0.4)';
            ctx.fillText(s.name, gx + 14, ly0 + 16);
            gx += ctx.measureText(s.name).width + 46;
        }

        // ---- 下：训练损失曲线 ----
        const cx0 = 56, cy0 = ly0 + lh + 60, cw2 = W - 96, ch2 = Hc - cy0 - 44;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(cx0, cy0, cw2, ch2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('训练损失随 epoch 变化', cx0, cy0 - 6);
        let vMax = 0.05;
        for (const s of STRATS) for (const v of lossHists[s.key]) vMax = Math.max(vMax, v);
        for (const s of STRATS) {
            const arr = lossHists[s.key];
            if (arr.length < 2) continue;
            ctx.strokeStyle = s.color; ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < arr.length; i++) {
                const x = cx0 + i / Math.max(arr.length - 1, 1) * cw2;
                const y = cy0 + ch2 - (arr[i] / vMax) * (ch2 - 10);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        if (epoch === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = '11px "Microsoft YaHei"';
            ctx.textAlign = 'center';
            ctx.fillText('点击「训练 1 轮」或「持续训练」', cx0 + cw2 / 2, cy0 + ch2 / 2);
        }

        // 信息面板
        const parts = STRATS.filter(s => active.includes(s.key)).map(s => {
            const arr = lossHists[s.key];
            return s.name + ' ' + (arr.length ? arr[arr.length - 1].toFixed(4) : '--');
        });
        statsEl.textContent = `epoch ${epoch}    ${parts.join('   |   ')}`;
        lr0Val.textContent = lr0.toFixed(2);
        epVal.textContent = parseInt(epSld.value);
    }

    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶ 持续训练'; }
    }

    trainBtn.addEventListener('click', trainEpoch);
    autoBtn.addEventListener('click', () => {
        if (autoTimer) { stopAuto(); return; }
        autoBtn.textContent = '⏸ 停止';
        autoTimer = setInterval(trainEpoch, 200);
    });
    resetBtn.addEventListener('click', resetAll);
    lr0Sld.addEventListener('input', draw);
    epSld.addEventListener('input', draw);
    schSel.addEventListener('change', draw);

    resetAll();
}

// ============================================================
// 实验 14：神经网络 Playground
// ============================================================
function initPlaygroundLab() {
    const canvas = document.getElementById('pgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dataSel = document.getElementById('pgDataSelect');
    const h1Sld   = document.getElementById('pgH1Slider');
    const h1Val   = document.getElementById('pgH1Value');
    const h2Sld   = document.getElementById('pgH2Slider');
    const h2Val   = document.getElementById('pgH2Value');
    const actSel  = document.getElementById('pgActSelect');
    const lrSld   = document.getElementById('pgLrSlider');
    const lrVal   = document.getElementById('pgLrValue');
    const autoBtn = document.getElementById('pgAutoBtn');
    const stepBtn = document.getElementById('pgStepBtn');
    const resetBtn = document.getElementById('pgResetBtn');
    const statsEl = document.getElementById('pgStats');
    const accEl   = document.getElementById('pgAcc');
    const archEl  = document.getElementById('pgArch');

    let net, dataTrain, dataVal, steps = 0, lossHist = [];
    let autoTimer = null;

    function act(x) {
        const a = actSel.value;
        if (a === 'tanh') return Math.tanh(x);
        if (a === 'sigmoid') return labs2Sigmoid(x);
        return Math.max(0, x);
    }
    function actD(y) {
        const a = actSel.value;
        if (a === 'tanh') return 1 - y * y;
        if (a === 'sigmoid') return y * (1 - y);
        return y > 0 ? 1 : 0;
    }

    function genData(type) {
        const train = [], val = [];
        const n = 80;
        for (let i = 0; i < n; i++) {
            let x, y;
            if (type === 'circle') {
                const ang = Math.random() * Math.PI * 2;
                const inner = Math.random() < 0.5;
                const r = inner ? Math.random() * 0.9 : 1.7 + Math.random() * 0.5;
                x = [r * Math.cos(ang), r * Math.sin(ang)];
                y = inner ? 0 : 1;
            } else if (type === 'xor') {
                x = [(Math.random() - 0.5) * 4.4, (Math.random() - 0.5) * 4.4];
                y = x[0] * x[1] > 0 ? 1 : 0;
            } else if (type === 'spiral') {
                const cls = i % 2;
                const t = ((i / 2) | 0) / 40 * 4 + 0.4;
                const a = t + cls * Math.PI;
                const r = 0.2 + t * 0.55;
                x = [r * Math.cos(a) + labs2Randn() * 0.09, r * Math.sin(a) + labs2Randn() * 0.09];
                y = cls;
            } else { // moon
                const cls = i < n / 2 ? 0 : 1;
                const t = (i % (n / 2)) / (n / 2) * Math.PI;
                const r = 1 + (Math.random() - 0.5) * 0.3;
                x = cls === 0 ? [r * Math.cos(t) - 0.5, r * Math.sin(t) - 0.3]
                              : [0.5 + r * Math.cos(t + Math.PI), r * Math.sin(t + Math.PI) + 0.3];
                y = cls;
            }
            (i % 4 === 0 ? val : train).push({ x, y });
        }
        return { train, val };
    }

    function buildNet() {
        const h1 = parseInt(h1Sld.value), h2 = parseInt(h2Sld.value);
        const W1 = Array.from({length: h1}, () => [labs2Randn() * 0.8, labs2Randn() * 0.8]);
        const b1 = Array(h1).fill(0);
        let W2 = null, b2 = null, W3 = null, b3 = 0;
        if (h2 > 0) {
            W2 = Array.from({length: h2}, () => Array.from({length: h1}, () => labs2Randn() * 0.8));
            b2 = Array(h2).fill(0);
            W3 = Array(h2).fill(0).map(() => labs2Randn() * 0.8);
        } else {
            W3 = Array(h1).fill(0).map(() => labs2Randn() * 0.8);
        }
        return { h1, h2, W1, b1, W2, b2, W3, b3 };
    }

    function forward(x) {
        const z1 = [], h1 = [];
        for (let i = 0; i < net.h1; i++) {
            const z = net.W1[i][0] * x[0] + net.W1[i][1] * x[1] + net.b1[i];
            z1.push(z); h1.push(act(z));
        }
        let out;
        if (net.h2 > 0) {
            const h2 = [];
            for (let j = 0; j < net.h2; j++) {
                let z = net.b2[j];
                for (let i = 0; i < net.h1; i++) z += net.W2[j][i] * h1[i];
                h2.push(act(z));
            }
            let o = net.b3;
            for (let j = 0; j < net.h2; j++) o += net.W3[j] * h2[j];
            out = { h1, h2, o };
        } else {
            let o = net.b3;
            for (let i = 0; i < net.h1; i++) o += net.W3[i] * h1[i];
            out = { h1, h2: [], o };
        }
        out.p = labs2Sigmoid(out.o);
        return out;
    }

    function trainStep() {
        const lr = parseFloat(lrSld.value);
        // 梯度累积
        const gW1 = Array.from({length: net.h1}, () => [0, 0]);
        const gb1 = Array(net.h1).fill(0);
        const gW3 = Array(net.h2 > 0 ? net.h2 : net.h1).fill(0);
        let gb3 = 0;
        let gW2 = null, gb2 = null;
        if (net.h2 > 0) {
            gW2 = Array.from({length: net.h2}, () => Array(net.h1).fill(0));
            gb2 = Array(net.h2).fill(0);
        }
        let loss = 0;
        for (const { x, y } of dataTrain) {
            const f = forward(x);
            const e = f.p - y;
            loss += -(y * Math.log(Math.max(f.p, 1e-12)) + (1 - y) * Math.log(Math.max(1 - f.p, 1e-12)));
            const lastAct = net.h2 > 0 ? f.h2 : f.h1;
            for (let j = 0; j < lastAct.length; j++) gW3[j] += e * lastAct[j];
            gb3 += e;
            if (net.h2 > 0) {
                for (let j = 0; j < net.h2; j++) {
                    const dj = e * net.W3[j] * actD(f.h2[j]);
                    gb2[j] += dj;
                    for (let i = 0; i < net.h1; i++) gW2[j][i] += dj * f.h1[i];
                    for (let i = 0; i < net.h1; i++) {
                        const di = dj * net.W2[j][i] * actD(f.h1[i]);
                        gW1[i][0] += di * x[0]; gW1[i][1] += di * x[1]; gb1[i] += di;
                    }
                }
            } else {
                for (let i = 0; i < net.h1; i++) {
                    const di = e * net.W3[i] * actD(f.h1[i]);
                    gW1[i][0] += di * x[0]; gW1[i][1] += di * x[1]; gb1[i] += di;
                }
            }
        }
        const n = dataTrain.length;
        const upd = (w, g) => { for (let i = 0; i < w.length; i++) w[i] -= lr * g[i] / n; };
        for (let i = 0; i < net.h1; i++) {
            net.W1[i][0] -= lr * gW1[i][0] / n; net.W1[i][1] -= lr * gW1[i][1] / n; net.b1[i] -= lr * gb1[i] / n;
        }
        if (net.h2 > 0) {
            for (let j = 0; j < net.h2; j++) {
                for (let i = 0; i < net.h1; i++) net.W2[j][i] -= lr * gW2[j][i] / n;
                net.b2[j] -= lr * gb2[j] / n;
            }
        }
        upd(net.W3, gW3); net.b3 -= lr * gb3 / n;
        steps++;
        lossHist.push(loss / n);
        if (lossHist.length > 300) lossHist.shift();
    }

    function accuracy(data) {
        let c = 0;
        for (const { x, y } of data) if ((forward(x).p >= 0.5 ? 1 : 0) === y) c++;
        return c / data.length;
    }

    // ===== 教学交互：悬停十字线 + 神经元激活点亮 =====
    let hover = null;   // { dx, dy } 数据坐标

    function drawHover() {
        if (!hover) return;
        const px0 = 50, py0 = 34, pw = 330, ph = 320;
        const xMin = -2.8, xMax = 2.8, yMin = -2.6, yMax = 2.6;
        const sx = px0 + (hover.dx - xMin) / (xMax - xMin) * pw;
        const sy = py0 + (1 - (hover.dy - yMin) / (yMax - yMin)) * ph;
        // 十字线
        ctx.strokeStyle = 'rgba(251,191,36,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(px0, sy); ctx.lineTo(px0 + pw, sy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx, py0); ctx.lineTo(sx, py0 + ph); ctx.stroke();
        ctx.setLineDash([]);
        // 十字光标
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.stroke();
        // 读数框
        const f = forward([hover.dx, hover.dy]);
        const txt = `x=(${hover.dx.toFixed(2)}, ${hover.dy.toFixed(2)})  P(y=1)=${f.p.toFixed(3)}`;
        ctx.font = '12px Consolas';
        const tw = ctx.measureText(txt).width + 16;
        const bx = Math.min(sx + 12, px0 + pw - tw), by = Math.max(sy - 34, py0 + 4);
        ctx.fillStyle = 'rgba(15,23,42,0.92)';
        ctx.strokeStyle = 'rgba(251,191,36,0.4)';
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, tw, 24);
        ctx.strokeRect(bx, by, tw, 24);
        ctx.fillStyle = '#fde68a';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, bx + 8, by + 12);
    }

    function redrawWithHover() {
        draw();
        drawHover();
    }

    function draw() {
        const W = canvas.width, Hc = canvas.height;
        ctx.clearRect(0, 0, W, Hc);

        // ---- 左：决策边界 ----
        const px0 = 50, py0 = 34, pw = 330, ph = 320;
        const xMin = -2.8, xMax = 2.8, yMin = -2.6, yMax = 2.6;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 13px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('决策边界', px0 + pw / 2, py0 - 6);
        const res = 40, cw = pw / res, ch = ph / res;
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const dx = xMin + (xMax - xMin) * (j + 0.5) / res;
                const dy = yMin + (yMax - yMin) * (res - 1 - i + 0.5) / res;
                const p = forward([dx, dy]).p;
                ctx.fillStyle = p > 0.5
                    ? `rgba(99,102,241,${(p - 0.5) * 1.1})`
                    : `rgba(236,72,153,${(0.5 - p) * 1.1})`;
                ctx.fillRect(px0 + j * cw, py0 + i * ch, cw + 0.5, ch + 0.5);
            }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeRect(px0, py0, pw, ph);
        for (const { x, y } of dataTrain) {
            const sx = px0 + (x[0] - xMin) / (xMax - xMin) * pw;
            const sy = py0 + (1 - (x[1] - yMin) / (yMax - yMin)) * ph;
            ctx.fillStyle = y === 1 ? '#6366f1' : '#ec4899';
            ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.7; ctx.stroke();
        }

        // ---- 中：网络结构图 ----
        const nx0 = px0 + pw + 55, nw = 170;
        const layers = [2, net.h1];
        if (net.h2 > 0) layers.push(net.h2);
        layers.push(1);
        const colGap = nw / (layers.length - 1);
        const nMax = Math.max(...layers);
        const nodeR = Math.min(11, 150 / nMax - 2);
        const pos = layers.map((n, li) => {
            const cx = nx0 + li * colGap;
            const cy0 = py0 + ph / 2 - (n - 1) * (nodeR * 2 + 8) / 2;
            return Array.from({length: n}, (_, i) => [cx, cy0 + i * (nodeR * 2 + 8)]);
        });
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('网络结构', nx0 + nw / 2, py0 - 6);
        // 连线
        for (let li = 0; li < pos.length - 1; li++) {
            for (const a of pos[li]) for (const b of pos[li + 1]) {
                ctx.strokeStyle = 'rgba(148,163,184,0.18)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
            }
        }
        // 节点（隐层亮度 = 对当前悬停点/默认点的激活强度）
        const probePt = hover ? [hover.dx, hover.dy] : [0.9, 0.9];
        const probe = forward(probePt);
        const layerNames = ['输入', '隐藏1', '隐藏2', '输出'];
        for (let li = 0; li < pos.length; li++) {
            for (let ni = 0; ni < pos[li].length; ni++) {
                const [x, y] = pos[li][ni];
                let alpha = 0.85;
                if (li === 1) alpha = 0.25 + Math.abs(probe.h1[ni]) * 0.65;
                else if (li === 2 && net.h2 > 0) alpha = 0.25 + Math.abs(probe.h2[ni]) * 0.65;
                const col = li === 0 ? '99,102,241'
                    : li === pos.length - 1 ? '236,72,153' : '139,92,246';
                ctx.fillStyle = `rgba(${col},${alpha})`;
                ctx.beginPath(); ctx.arc(x, y, nodeR, 0, Math.PI * 2); ctx.fill();
                if ((li === 1 || (li === 2 && net.h2 > 0)) && alpha > 0.55) {
                    ctx.strokeStyle = 'rgba(251,191,36,0.7)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(x, y, nodeR + 3, 0, Math.PI * 2); ctx.stroke();
                }
            }
            ctx.fillStyle = 'rgba(148,163,184,0.6)';
            ctx.font = '10px "Microsoft YaHei"';
            const nm = layers.length === 3 ? ['输入', '隐藏', '输出'][li] : layerNames[li];
            ctx.fillText(nm, pos[li][0][0], py0 + ph + 14);
        }

        // ---- 右：损失曲线 ----
        const cx0 = nx0 + nw + 55, cw2 = W - cx0 - 36, ch2 = 300, cy0 = py0 + 40;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(cx0, cy0, cw2, ch2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('训练损失', cx0, cy0 - 8);
        if (lossHist.length > 1) {
            const maxL = Math.max(...lossHist);
            ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < lossHist.length; i++) {
                const x = cx0 + i / (lossHist.length - 1) * cw2;
                const y = cy0 + ch2 - (lossHist[i] / maxL) * (ch2 - 10);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = '11px "Microsoft YaHei"';
            ctx.textAlign = 'center';
            ctx.fillText('点击「开始训练」', cx0 + cw2 / 2, cy0 + ch2 / 2);
        }

        // 信息面板
        statsEl.textContent = steps + ' / ' + (lossHist.length ? lossHist[lossHist.length - 1].toFixed(4) : '--');
        accEl.textContent = (accuracy(dataVal) * 100).toFixed(1) + '%';
        archEl.textContent = `2 → ${net.h1}` + (net.h2 > 0 ? ` → ${net.h2}` : '') + ' → 1';
        h1Val.textContent = net.h1;
        h2Val.textContent = net.h2;
        lrVal.textContent = parseFloat(lrSld.value).toFixed(2);
    }

    function resetAll() {
        stopAuto();
        net = buildNet();
        const d = genData(dataSel.value);
        dataTrain = d.train; dataVal = d.val;
        steps = 0; lossHist = [];
        draw();
    }

    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶ 开始训练'; }
    }

    autoBtn.addEventListener('click', () => {
        if (autoTimer) { stopAuto(); return; }
        autoBtn.textContent = '⏸ 暂停';
        autoTimer = setInterval(() => { trainStep(); draw(); if (hover) drawHover(); }, 40);
    });

    // 悬停交互
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX, my = (e.clientY - rect.top) * scaleY;
        const px0 = 50, py0 = 34, pw = 330, ph = 320;
        if (mx >= px0 && mx <= px0 + pw && my >= py0 && my <= py0 + ph) {
            const xMin = -2.8, xMax = 2.8, yMin = -2.6, yMax = 2.6;
            hover = {
                dx: xMin + (mx - px0) / pw * (xMax - xMin),
                dy: yMin + (1 - (my - py0) / ph) * (yMax - yMin)
            };
            redrawWithHover();
        } else if (hover) {
            hover = null;
            draw();
        }
    });
    canvas.addEventListener('mouseleave', () => { hover = null; draw(); });
    stepBtn.addEventListener('click', () => { trainStep(); draw(); });
    resetBtn.addEventListener('click', resetAll);
    dataSel.addEventListener('change', resetAll);
    [h1Sld, h2Sld, actSel].forEach(el => el.addEventListener('input', resetAll));
    lrSld.addEventListener('input', draw);

    resetAll();
}

// ============================================================
// 实验 15：自编码器与数据降维
// ============================================================
function initAutoencoderLab() {
    const canvas = document.getElementById('aeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const botSld   = document.getElementById('aeBottleSlider');
    const botVal   = document.getElementById('aeBottleValue');
    const lrSld    = document.getElementById('aeLrSlider');
    const lrVal    = document.getElementById('aeLrValue');
    const noiseSld = document.getElementById('aeNoiseSlider');
    const noiseVal = document.getElementById('aeNoiseValue');
    const autoBtn  = document.getElementById('aeAutoBtn');
    const resetBtn = document.getElementById('aeResetBtn');
    const lossEl   = document.getElementById('aeLoss');
    const stepEl   = document.getElementById('aeStep');
    const ratioEl  = document.getElementById('aeRatio');

    // 瑞士卷 1D 流形嵌入 2D：t ∈ [-3,3]，x=(t·cos1.2t, t·sin1.2t)+噪
    function genSwissRoll(n) {
        const pts = [];
        for (let i = 0; i < n; i++) {
            const t = -3 + 6 * Math.random();
            pts.push([t * Math.cos(1.2 * t) / 2.5, t * Math.sin(1.2 * t) / 2.5]);
        }
        return pts;
    }

    let bot = 1, Wenc, benc, Wdec, bdec, data, steps = 0, lossHist = [];
    let autoTimer = null;

    function buildNet() {
        bot = parseInt(botSld.value);
        Wenc = Array.from({length: bot}, () => [labs2Randn(), labs2Randn()]);
        benc = Array(bot).fill(0);
        Wdec = Array.from({length: 2}, () => Array.from({length: bot}, () => labs2Randn() * 1.2));
        bdec = [0, 0];
    }

    function encode(x) {
        return Wenc.map((w, i) => Math.tanh(w[0] * x[0] + w[1] * x[1] + benc[i]));
    }
    function decode(h) {
        return [0, 1].map(o => {
            let z = bdec[o];
            for (let i = 0; i < bot; i++) z += Wdec[o][i] * h[i];
            return Math.tanh(z) * 1.6;
        });
    }

    function trainStep() {
        const lr = parseFloat(lrSld.value);
        const noise = parseFloat(noiseSld.value);
        const gWe = Array.from({length: bot}, () => [0, 0]);
        const gbe = Array(bot).fill(0);
        const gWd = Array.from({length: 2}, () => Array(bot).fill(0));
        const gbd = [0, 0];
        let loss = 0;
        for (const x of data) {
            const xn = noise > 0 ? [x[0] + labs2Randn() * noise, x[1] + labs2Randn() * noise] : x;
            const h = encode(xn);
            const rec = decode(h);
            const e = [rec[0] - x[0], rec[1] - x[1]];
            loss += 0.5 * (e[0] ** 2 + e[1] ** 2);
            // 反向（tanh 链）：dL/dh = Σ_o e_o · 1.6 · (1 - tanh²(z_o))
            const dh = Array(bot).fill(0);
            for (let o = 0; o < 2; o++) {
                const pre = bdec[o];
                let z = pre;
                for (let i = 0; i < bot; i++) z += Wdec[o][i] * h[i];
                const dtanh = 1 - Math.tanh(z) ** 2;
                const doo = e[o] * 1.6 * dtanh;       // dL/dz_out
                gbd[o] += doo;
                for (let i = 0; i < bot; i++) {
                    gWd[o][i] += doo * h[i];
                    dh[i] += doo * Wdec[o][i];
                }
            }
            for (let i = 0; i < bot; i++) {
                const dz = dh[i] * (1 - h[i] ** 2);
                gWe[i][0] += dz * xn[0]; gWe[i][1] += dz * xn[1]; gbe[i] += dz;
            }
        }
        const n = data.length;
        for (let i = 0; i < bot; i++) {
            Wenc[i][0] -= lr * gWe[i][0] / n; Wenc[i][1] -= lr * gWe[i][1] / n; benc[i] -= lr * gbe[i] / n;
        }
        for (let o = 0; o < 2; o++) {
            for (let i = 0; i < bot; i++) Wdec[o][i] -= lr * gWd[o][i] / n;
            bdec[o] -= lr * gbd[o] / n;
        }
        steps++;
        lossHist.push(loss / n);
        if (lossHist.length > 300) lossHist.shift();
    }

    function draw() {
        const W = canvas.width, Hc = canvas.height;
        ctx.clearRect(0, 0, W, Hc);
        const xMin = -1.7, xMax = 1.7, yMin = -1.7, yMax = 1.7;

        // ---- 左：原始 + 重构 ----
        const p1x = 46, p1y = 40, pw = 300, ph = 290;
        const toS = (x, y, x0, y0, w, h) => [x0 + (x - xMin) / (xMax - xMin) * w, y0 + (1 - (y - yMin) / (yMax - yMin)) * h];
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('原始流形 (瑞士卷)', p1x + pw / 2, p1y - 6);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(p1x, p1y, pw, ph);
        for (const x of data) {
            const [sx, sy] = toS(x[0], x[1], p1x, p1y, pw, ph);
            ctx.fillStyle = '#6366f1';
            ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
        }

        const p2x = p1x + pw + 60;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('自编码器重构', p2x + pw / 2, p1y - 6);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(p2x, p1y, pw, ph);
        for (const x of data) {
            const r = decode(encode(x));
            const [sx, sy] = toS(r[0], r[1], p2x, p1y, pw, ph);
            ctx.fillStyle = '#ec4899';
            ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        // 原始轮廓参照（淡）
        ctx.strokeStyle = 'rgba(99,102,241,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const t = -3 + 6 * i / 100;
            const x = t * Math.cos(1.2 * t) / 2.5, y = t * Math.sin(1.2 * t) / 2.5;
            const [sx, sy] = toS(x, y, p2x, p1y, pw, ph);
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // ---- 下：隐空间表示（第二行左） ----
        const hx0 = 46, hw = 300, hy0 = 372;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(bot === 1 ? '隐空间 (1维瓶颈)' : `隐空间 (${bot}维，展示前2维)`, hx0 + hw / 2, hy0 - 6);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeRect(hx0, hy0 + 20, hw, 44);
        // 1D 直方图
        const hvals = data.map(x => encode(x)[0]);
        const bins = new Array(24).fill(0);
        for (const v of hvals) {
            const bi = Math.min(23, Math.max(0, Math.floor((v + 1) / 2 * 24)));
            bins[bi]++;
        }
        const maxB = Math.max(...bins, 1);
        for (let i = 0; i < 24; i++) {
            const bh = bins[i] / maxB * 40;
            ctx.fillStyle = 'rgba(139,92,246,0.8)';
            ctx.fillRect(hx0 + 2 + i * (hw - 4) / 24, hy0 + 62 - bh, (hw - 4) / 24 - 1, bh);
        }
        ctx.fillStyle = 'rgba(148,163,184,0.6)';
        ctx.font = '10px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.fillText(bot === 1 ? '全部数据被压缩到一条隐变量上' : '隐变量维度 1 的分布直方图', hx0 + hw / 2, hy0 + 80);
        // bot>1：二维隐空间散点
        if (bot > 1) {
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.strokeRect(hx0, hy0 + 96, hw, 150);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '10px "Microsoft YaHei"';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('维度2', hx0 - 34, hy0 + 96 + 75);
            for (const x of data) {
                const h = encode(x);
                const sx = hx0 + (h[0] + 1) / 2 * hw;
                const sy = hy0 + 96 + 150 - (h[1] + 1) / 2 * 150;
                ctx.fillStyle = '#8b5cf6';
                ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
            }
        }

        // ---- 下：损失曲线（第二行右） ----
        const cx0 = 406, cw2 = W - cx0 - 46, cy0 = hy0 + 20, ch2 = 214;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(cx0, cy0, cw2, ch2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('重构损失 (MSE) 随训练步数下降', cx0, cy0 - 8);
        if (lossHist.length > 1) {
            const maxL = Math.max(...lossHist);
            ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < lossHist.length; i++) {
                const x = cx0 + i / (lossHist.length - 1) * cw2;
                const y = cy0 + ch2 - (lossHist[i] / maxL) * (ch2 - 10);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 信息面板
        lossEl.textContent = lossHist.length ? lossHist[lossHist.length - 1].toFixed(5) : '--';
        stepEl.textContent = steps;
        ratioEl.textContent = `2 → ${bot} → 2   (压缩率 ${(2 / bot).toFixed(1)}×)`;
        botVal.textContent = bot;
        lrVal.textContent = parseFloat(lrSld.value).toFixed(3);
        noiseVal.textContent = parseFloat(noiseSld.value).toFixed(2);
    }

    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶ 持续训练'; }
    }

    autoBtn.addEventListener('click', () => {
        if (autoTimer) { stopAuto(); return; }
        autoBtn.textContent = '⏸ 停止';
        autoTimer = setInterval(() => {
            for (let i = 0; i < 3; i++) trainStep();
            draw();
        }, 50);
    });
    resetBtn.addEventListener('click', () => { stopAuto(); buildNet(); data = genSwissRoll(120); steps = 0; lossHist = []; draw(); });
    botSld.addEventListener('input', () => { stopAuto(); buildNet(); steps = 0; lossHist = []; draw(); });
    lrSld.addEventListener('input', draw);
    noiseSld.addEventListener('input', draw);

    buildNet();
    data = genSwissRoll(120);
    draw();
}

// ============================================================
// 实验 16：GAN 对抗训练（1D 双峰分布）
// ============================================================
function initGANLab() {
    const canvas = document.getElementById('ganCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const speedSld = document.getElementById('ganSpeedSlider');
    const speedVal = document.getElementById('ganSpeedValue');
    const autoBtn  = document.getElementById('ganAutoBtn');
    const resetBtn = document.getElementById('ganResetBtn');
    const statsEl  = document.getElementById('ganStats');
    const stdEl    = document.getElementById('ganStd');

    // G: 1→h→1（z~N(0,1) 映射到样本）；D: 1→h→1 sigmoid
    const HN = 16;
    let G, D, stepCount = 0, autoTimer = null;
    let dLossHist = [], gLossHist = [];
    let fakeSamples = [];

    function makeG() {
        // G 无输出偏置：强迫生成分布由 z 的两支 (z>0 / z<0) 形成，避免偏置单向漂移
        return {
            W1: Array.from({length: HN}, () => labs2Randn() * 0.5),
            W2: Array.from({length: HN}, () => labs2Randn() * 0.5)
        };
    }
    function makeD() {
        return {
            W1: Array.from({length: HN}, () => labs2Randn() * 0.3),
            b1: Array(HN).fill(0),
            W2: Array.from({length: HN}, () => labs2Randn() * 0.3),
            b2: 0
        };
    }

    function gFwd(z) {
        const h = G.W1.map(w => Math.tanh(w * z));
        let y = 0;
        for (let i = 0; i < HN; i++) y += G.W2[i] * h[i];
        // 硬限幅到 [-2.2, 2.2]：clip 处梯度仍为 1，生成器不会被"钳死"在饱和区
        const yc = Math.max(-2.2, Math.min(2.2, y));
        return { h, y: yc };
    }
    function dFwd(x) {
        const h = D.W1.map((w, i) => Math.tanh(w * x + D.b1[i]));
        let y = D.b2;
        for (let i = 0; i < HN; i++) y += D.W2[i] * h[i];
        return { h, p: labs2Sigmoid(y) };
    }

    function realSample() {
        // 双峰：-1.3 或 +1.3
        const peak = Math.random() < 0.5 ? -1.1 : 1.1;
        return peak + labs2Randn() * 0.22;
    }

    function trainStep() {
        const lr = 0.05;
        const bs = 48;
        // ---- 训练 D ----
        let dLoss = 0;
        const gW1 = Array(HN).fill(0), gb1 = Array(HN).fill(0), gW2 = Array(HN).fill(0);
        let gb2 = 0;
        const gHists = [];
        for (let i = 0; i < bs; i++) {
            const xr = realSample();
            const z = labs2Randn();
            const g = gFwd(z);
            const xf = g.y;
            gHists.push({ z, g });
            for (const [x, label] of [[xr, 1], [xf, 0]]) {
                const d = dFwd(x);
                const dp = d.p - label;         // BCE 梯度
                dLoss += -(label * Math.log(Math.max(d.p, 1e-12)) + (1 - label) * Math.log(Math.max(1 - d.p, 1e-12)));
                gb2 += dp;
                for (let j = 0; j < HN; j++) {
                    gW2[j] += dp * d.h[j];
                    const dh = dp * D.W2[j] * (1 - d.h[j] ** 2);
                    gW1[j] += dh * x; gb1[j] += dh;
                }
            }
        }
        for (let j = 0; j < HN; j++) {
            D.W1[j] -= lr * gW1[j] / (2 * bs); D.b1[j] -= lr * gb1[j] / (2 * bs);
            D.W2[j] -= lr * gW2[j] / (2 * bs);
        }
        D.b2 -= lr * gb2 / (2 * bs);

        // ---- 训练 G ----
        let gLoss = 0;
        const gW1g = Array(HN).fill(0), gW2g = Array(HN).fill(0);
        const zs = [], gs = [];
        for (let i = 0; i < bs; i++) {
            const z = labs2Randn();
            const g = gFwd(z);
            zs.push(z); gs.push(g);
            gLoss += -Math.log(Math.max(dFwd(g.y).p, 1e-12));
        }
        const yMean = gs.reduce((a, g) => a + g.y, 0) / bs;
        for (let i = 0; i < bs; i++) {
            const z = zs[i], g = gs[i];
            const d = dFwd(g.y);
            const dp = d.p - 1 - 0.3 * 2 * (g.y - yMean) / bs;   // 对抗梯度 + 方差正则(防模式塌缩)
            for (let j = 0; j < HN; j++) {
                gW2g[j] += dp * g.h[j];
                const dh = dp * G.W2[j] * (1 - g.h[j] ** 2) * z;
                gW1g[j] += dh;
            }
        }
        for (let j = 0; j < HN; j++) {
            G.W1[j] -= lr * gW1g[j] / bs;
            G.W2[j] -= lr * gW2g[j] / bs;
        }

        stepCount++;
        dLossHist.push(dLoss / (2 * bs));
        gLossHist.push(gLoss / bs);
        if (dLossHist.length > 200) { dLossHist.shift(); gLossHist.shift(); }
        return [dLoss / (2 * bs), gLoss / bs];
    }

    function draw(lastLoss) {
        const W = canvas.width, Hc = canvas.height;
        ctx.clearRect(0, 0, W, Hc);
        const xMin = -3, xMax = 3;

        // ---- 上：分布对比 ----
        const px0 = 56, py0 = 46, pw = W - 112, ph = 170;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(px0, py0, pw, ph);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 13px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('真实分布 (蓝) vs 生成分布 (粉)', px0 + pw / 2, py0 - 8);

        const toX = x => px0 + (x - xMin) / (xMax - xMin) * pw;
        const baseY = py0 + ph - 20;
        // 真实分布直方图
        const bins = new Array(40).fill(0);
        for (let i = 0; i < 400; i++) {
            const x = realSample();
            const bi = Math.min(39, Math.max(0, Math.floor((x - xMin) / (xMax - xMin) * 40)));
            bins[bi]++;
        }
        const maxB = Math.max(...bins);
        for (let i = 0; i < 40; i++) {
            const bh = bins[i] / maxB * (ph - 40);
            ctx.fillStyle = 'rgba(59,130,246,0.35)';
            ctx.fillRect(px0 + i * pw / 40 + 1, baseY - bh, pw / 40 - 2, bh);
        }
        // 生成样本直方图（缓存）
        if (stepCount % 5 === 0 || fakeSamples.length === 0) {
            fakeSamples = [];
            for (let i = 0; i < 400; i++) fakeSamples.push(gFwd(labs2Randn()).y);
        }
        const binsF = new Array(40).fill(0);
        for (const x of fakeSamples) {
            const bi = Math.min(39, Math.max(0, Math.floor((x - xMin) / (xMax - xMin) * 40)));
            binsF[bi]++;
        }
        const maxF = Math.max(...binsF, 1);
        for (let i = 0; i < 40; i++) {
            const bh = binsF[i] / maxF * (ph - 40);
            ctx.fillStyle = 'rgba(236,72,153,0.6)';
            ctx.fillRect(px0 + i * pw / 40 + 1, baseY - bh, pw / 40 - 2, bh);
        }
        // 底部散点
        for (const x of fakeSamples.slice(0, 120)) {
            ctx.fillStyle = 'rgba(236,72,153,0.5)';
            ctx.beginPath(); ctx.arc(toX(x), baseY + 10, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        // x 轴
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px Consolas';
        for (const v of [-2, -1, 0, 1, 2]) {
            ctx.textAlign = 'center';
            ctx.fillText(v, toX(v), py0 + ph - 4);
        }

        // ---- 下左：D 的判别曲线 D(x) ----
        const dx0 = 56, dw2 = (W - 130) * 0.55, dh2 = 150, dy0 = py0 + ph + 50;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(dx0, dy0, dw2, dh2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('判别器输出 D(x)（1=真 0=假）', dx0, dy0 - 6);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
            const x = xMin + (xMax - xMin) * i / 120;
            const y = dy0 + dh2 - dFwd(x).p * dh2;
            i === 0 ? ctx.moveTo(toX(x), y) : ctx.lineTo(toX(x), y);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(dx0, dy0 + dh2 / 2); ctx.lineTo(dx0 + dw2, dy0 + dh2 / 2); ctx.stroke();
        ctx.setLineDash([]);

        // ---- 下右：损失曲线 ----
        const cx0 = dx0 + dw2 + 45, cw2 = W - cx0 - 36;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(cx0, dy0, cw2, dh2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('损失曲线（橙=D  粉=G）', cx0, dy0 - 6);
        const maxL = Math.max(...dLossHist, ...gLossHist, 0.1);
        const drawCurve = (arr, color) => {
            ctx.strokeStyle = color; ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let i = 0; i < arr.length; i++) {
                const x = cx0 + i / Math.max(arr.length - 1, 1) * cw2;
                const y = dy0 + dh2 - (arr[i] / maxL) * (dh2 - 10);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        };
        drawCurve(dLossHist, '#f59e0b');
        drawCurve(gLossHist, '#ec4899');

        // 信息面板
        const lastD = dLossHist.length ? dLossHist[dLossHist.length - 1] : null;
        const lastG = gLossHist.length ? gLossHist[gLossHist.length - 1] : null;
        statsEl.textContent = (lastD != null ? `L_D=${lastD.toFixed(3)}  L_G=${lastG.toFixed(3)}` : '--') + `   step ${stepCount}`;
        const mean = fakeSamples.reduce((a, b) => a + b, 0) / fakeSamples.length;
        const std = Math.sqrt(fakeSamples.reduce((a, b) => a + (b - mean) ** 2, 0) / fakeSamples.length);
        stdEl.textContent = 'μ=' + mean.toFixed(2) + '  σ=' + std.toFixed(2) + (Math.abs(mean) < 0.3 && std > 0.7 ? '  ✓ 已覆盖双峰' : '');
        speedVal.textContent = parseInt(speedSld.value);
    }

    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶ 开始对抗'; }
    }

    autoBtn.addEventListener('click', () => {
        if (autoTimer) { stopAuto(); return; }
        autoBtn.textContent = '⏸ 停止';
        autoTimer = setInterval(() => {
            const n = parseInt(speedSld.value);
            let last = null;
            for (let i = 0; i < n; i++) last = trainStep();
            draw(last);
        }, 50);
    });
    resetBtn.addEventListener('click', () => {
        stopAuto();
        G = makeG(); D = makeD();
        stepCount = 0; dLossHist = []; gLossHist = []; fakeSamples = [];
        draw();
    });
    speedSld.addEventListener('input', draw);

    G = makeG(); D = makeD();
    draw();
}

// ============================================================
// 实验 17：扩散模型去噪演示
// ============================================================
function initDiffusionLab() {
    const canvas = document.getElementById('dfCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const tSld    = document.getElementById('dfTSlider');
    const tVal    = document.getElementById('dfTValue');
    const fwdBtn  = document.getElementById('dfFwdBtn');
    const revBtn  = document.getElementById('dfRevBtn');
    const resetBtn = document.getElementById('dfResetBtn');
    const stepEl  = document.getElementById('dfStep');
    const alphaEl = document.getElementById('dfAlpha');

    // 目标分布：2D 双月牙 / 同心圆
    let T = 30, points, t = 0, animId = null, mode = null;  // mode: 'fwd' | 'rev'

    function genTargets() {
        const pts = [];
        for (let i = 0; i < 60; i++) {
            // 同心圆 + 中心团混合
            if (i < 25) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 0.55;
                pts.push([r * Math.cos(a), r * Math.sin(a)]);
            } else {
                const a = Math.random() * Math.PI * 2;
                const r = 1.3 + Math.random() * 0.35;
                pts.push([r * Math.cos(a), r * Math.sin(a)]);
            }
        }
        return pts;
    }

    function alphaBar(tt) {
        // 线性 beta 调度 0.002→0.035，返回单步 beta
        const b0 = 0.002, b1 = 0.035;
        return b0 + (b1 - b0) * tt / T;
    }
    function alphaBarAcc(tt) {
        const b0 = 0.002, b1 = 0.035;
        let ab = 1;
        for (let s = 1; s <= tt; s++) {
            const beta = b0 + (b1 - b0) * s / T;
            ab *= (1 - beta);
        }
        return ab;
    }

    function resetAll() {
        T = parseInt(tSld.value);
        points = genTargets().map(p => ({ x0: p.slice(), x: p.slice() }));
        t = 0; mode = null;
        if (animId) cancelAnimationFrame(animId);
        draw();
    }

    function draw() {
        const W = canvas.width, Hc = canvas.height;
        ctx.clearRect(0, 0, W, Hc);
        const lim = 2.6;
        const px0 = 60, py0 = 40, pw = 380, ph = 360;
        const toS = (x, y) => [px0 + (x + lim) / (2 * lim) * pw, py0 + (1 - (y + lim) / (2 * lim)) * ph];

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 13px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(mode === 'rev' ? `反向去噪: t=${t} → 0` : mode === 'fwd' ? `正向加噪: t=${t}` : `当前 t = ${t} / ${T}`, px0 + pw / 2, py0 - 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeRect(px0, py0, pw, ph);
        // 背景网格
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        for (let i = 1; i < 6; i++) {
            ctx.beginPath(); ctx.moveTo(px0 + pw * i / 6, py0); ctx.lineTo(px0 + pw * i / 6, py0 + ph); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(px0, py0 + ph * i / 6); ctx.lineTo(px0 + pw, py0 + ph * i / 6); ctx.stroke();
        }
        const ab = alphaBarAcc(t);
        const noise = 1 - ab;
        for (const p of points) {
            const [sx, sy] = toS(p.x[0], p.x[1]);
            ctx.fillStyle = `rgba(${Math.floor(99 + 137 * noise)},${Math.floor(102 + (236 - 102) * noise * 0.5)},249,${0.35 + 0.6 * ab})`;
            ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
        }
        // 中心参考圆
        ctx.strokeStyle = 'rgba(148,163,184,0.2)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(...toS(0, 0), 0.55 / (2 * lim) * pw, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        // ---- 右：去噪轨迹预览（一条样本的 t 扫描） ----
        const rx0 = px0 + pw + 55, rw = W - rx0 - 40;
        // 每个时间步一个小快照
        const snaps = Math.min(8, T);
        const cw = rw / snaps, chh = 90;
        const x0ref = points[0].x0;
        for (let s = 0; s < snaps; s++) {
            const tt = Math.round(T * (s + 1) / snaps);
            const ab2 = alphaBarAcc(tt);
            const sx0 = rx0 + s * cw, sy0 = py0 + 30 + (s % 2) * 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeRect(sx0, sy0, cw - 6, chh);
            // 画若干点
            for (let i = 0; i < 25; i++) {
                const p = points[i % points.length].x0;
                const xa = Math.sqrt(ab2) * p[0] + Math.sqrt(1 - ab2) * labs2Randn();
                const ya = Math.sqrt(ab2) * p[1] + Math.sqrt(1 - ab2) * labs2Randn();
                const px2 = sx0 + (xa + lim) / (2 * lim) * (cw - 6);
                const py2 = sy0 + (1 - (ya + lim) / (2 * lim)) * chh;
                ctx.fillStyle = `rgba(${Math.floor(99 + 137 * (1 - ab2))},${Math.floor(102 + 60 * ab2)},249,0.8)`;
                ctx.beginPath(); ctx.arc(px2, py2, 1.6, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '9px Consolas';
            ctx.textAlign = 'center';
            ctx.fillText('t=' + tt, sx0 + (cw - 6) / 2, sy0 + chh + 10);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = 'bold 12px "Microsoft YaHei"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('前向扩散快照 x₀ → x_T', rx0 + rw / 2, py0 + 20);

        // 底部进度条
        const by = py0 + ph + 30;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(px0, by, pw, 8);
        const frac = t / T;
        const grad = mode === 'rev' ? 'rgba(236,72,153,0.8)' : 'rgba(99,102,241,0.8)';
        ctx.fillStyle = grad;
        ctx.fillRect(px0, by, pw * frac, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px "Microsoft YaHei"';
        ctx.textAlign = 'left';
        ctx.fillText('纯数据 x₀', px0, by + 22);
        ctx.textAlign = 'right';
        ctx.fillText('纯噪声 x_T', px0 + pw, by + 22);

        // 信息面板
        stepEl.textContent = `${t} / ${T}`;
        alphaEl.textContent = alphaBarAcc(t).toFixed(4);
        tVal.textContent = T;
    }

    function animateForward() {
        mode = 'fwd';
        if (animId) cancelAnimationFrame(animId);
        function step() {
            if (t >= T) { mode = null; draw(); return; }
            t++;
            // 真实加噪：x_t = sqrt(ab)*x0 + sqrt(1-ab)*ε
            const ab = alphaBarAcc(t);
            for (const p of points) {
                p.x[0] = Math.sqrt(ab) * p.x0[0] + Math.sqrt(1 - ab) * labs2Randn();
                p.x[1] = Math.sqrt(ab) * p.x0[1] + Math.sqrt(1 - ab) * labs2Randn();
            }
            draw();
            animId = requestAnimationFrame(step);
        }
        animId = requestAnimationFrame(step);
    }

    function animateReverse() {
        // 若当前不在 t=T，先跳到 T
        if (t < T) {
            const ab = alphaBarAcc(T);
            for (const p of points) {
                p.x[0] = Math.sqrt(ab) * p.x0[0] + Math.sqrt(1 - ab) * labs2Randn();
                p.x[1] = Math.sqrt(ab) * p.x0[1] + Math.sqrt(1 - ab) * labs2Randn();
            }
            t = T;
        }
        mode = 'rev';
        if (animId) cancelAnimationFrame(animId);
        // 简易去噪模型：向 x0 方向插值 + 逐渐减小噪声（演示性质）
        const Ttotal = T;
        function step() {
            if (t <= 0) { mode = null; draw(); return; }
            t--;
            const ab = alphaBarAcc(t);
            for (const p of points) {
                // 演示式去噪：把当前样本往"最近的目标样本"方向拉，同时按 ab 缩放噪声
                let best = null, bd = 1e9;
                for (const q of points) {
                    const d = (p.x[0] - q.x0[0]) ** 2 + (p.x[1] - q.x0[1]) ** 2;
                    if (d < bd) { bd = d; best = q; }
                }
                const pull = 0.15;
                p.x[0] = (1 - pull) * p.x[0] + pull * (Math.sqrt(ab) * best.x0[0] + Math.sqrt(1 - ab) * labs2Randn() * 0.2);
                p.x[1] = (1 - pull) * p.x[1] + pull * (Math.sqrt(ab) * best.x0[1] + Math.sqrt(1 - ab) * labs2Randn() * 0.2);
            }
            draw();
            animId = requestAnimationFrame(step);
        }
        animId = requestAnimationFrame(step);
    }

    fwdBtn.addEventListener('click', animateForward);
    revBtn.addEventListener('click', animateReverse);
    resetBtn.addEventListener('click', resetAll);
    tSld.addEventListener('input', resetAll);

    resetAll();
}

// ============================================================
// 教学增强 A：全屏演示模式（所有实验画布通用）
//   - 每个 .lab-canvas-wrapper 注入右上角按钮
//   - 点击后 canvas 移入全屏遮罩，Esc/点击遮罩关闭，关闭时归还原位
// ============================================================
function initLabFullscreen() {
    const wrappers = document.querySelectorAll('.lab-canvas-wrapper');
    let overlay = null;

    function closeOverlay() {
        if (!overlay) return;
        const canvas = overlay.querySelector('canvas');
        const home = overlay._home;
        if (canvas && home) home.appendChild(canvas);
        overlay.remove();
        overlay = null;
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
    }
    function onKey(e) { if (e.key === 'Escape') closeOverlay(); }

    wrappers.forEach(wrap => {
        const canvas = wrap.querySelector('canvas');
        if (!canvas) return;
        const btn = document.createElement('button');
        btn.className = 'lab-fullscreen-btn';
        btn.type = 'button';
        btn.textContent = '⛶ 全屏演示';
        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (overlay) return;
            overlay = document.createElement('div');
            overlay.className = 'lab-overlay';
            overlay.innerHTML = '<div class="lab-overlay-inner"></div>'
                + '<div class="lab-overlay-tip">Esc 或点击空白处退出全屏 · 适合课堂投影</div>';
            overlay.querySelector('.lab-overlay-inner').appendChild(canvas);
            overlay._home = wrap;
            overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', onKey);
        });
        wrap.appendChild(btn);
    });
}

// ============================================================
// 教学增强 B：伴侣动画画布
//   ensureCompanion(canvasId, caption) 在所属 lab-demo 底部
//   横向插入一个全宽画布（class lab-companion），返回其 ctx。
// ============================================================
// fx 画布 id → 所属主实验画布 id 的映射
const FX_HOST_MAP = {
    fxActivation: 'activationCanvas',
    fxCNNPipeline: 'cnnCanvas',
    fxSoftmaxSteps: 'smCanvas',
    fxVanishParticles: 'vdCanvas',
    fxOptimizer: 'opCanvas'
};

function ensureCompanion(canvasId, caption, width, height) {
    let cv = document.getElementById(canvasId);
    if (cv) return cv;
    const src = document.getElementById(FX_HOST_MAP[canvasId] || canvasId.replace(/^fx/, ''));
    if (!src) return null;
    const demo = src.closest('.lab-demo');
    if (!demo) return null;
    cv = document.createElement('canvas');
    cv.id = canvasId;
    cv.width = width || 1000;
    cv.height = height || 300;
    const cap = document.createElement('div');
    cap.className = 'lab-companion-cap';
    cap.textContent = caption;
    const wrap = document.createElement('div');
    wrap.className = 'lab-canvas-wrapper lab-companion';
    wrap.appendChild(cap);
    wrap.appendChild(cv);
    demo.appendChild(wrap);
    return cv;
}

// ============================================================
// 教学增强 C：画布上常用的绘制小工具
// ============================================================
function fxArrow(ctx, x1, y1, x2, y2, color, width) {
    const head = 7;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
    ctx.closePath(); ctx.fill();
}

function fxLabel(ctx, text, x, y, color, font, align) {
    ctx.fillStyle = color || 'rgba(255,255,255,0.7)';
    ctx.font = font || '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

// ============================================================
// 教学动画 4：梯度消失/爆炸「粒子回流」动画
//   在实验十一画布下方：网络层从左(输入)到右(输出)排列成节点链，
//   梯度粒子从输出端出发向左回流，粒子亮度/大小按该层梯度范数衰减，
//   直观展示"梯度逐层缩放"的物理图像
// ============================================================
function initVanishParticlesFX() {
    const cv = ensureCompanion('fxVanishParticles', '动画演示：梯度粒子从输出层向输入层回流（亮度=梯度强度）', 1000, 240);
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const vdCanvas = document.getElementById('vdCanvas');
    if (!vdCanvas) return;
    const depthSld = document.getElementById('vdDepthSlider');
    const stdSld   = document.getElementById('vdStdSlider');
    const actSel   = document.getElementById('vdActSelect');
    const initSel  = document.getElementById('vdInitSelect');

    function actD(y, act) {
        if (act === 'sigmoid') return y * (1 - y);
        if (act === 'tanh') return 1 - y * y;
        return y > 0 ? 1 : 0;
    }

    // 计算每层梯度缩放因子（复用主实验逻辑的简化版）
    function layerFactors() {
        const depth = parseInt(depthSld.value);
        const act = actSel.value, mode = initSel.value;
        const factors = [];
        let a = 0.6;   // 典型激活值
        for (let l = 0; l < depth; l++) {
            let std;
            if (mode === 'xavier') std = Math.sqrt(1);
            else if (mode === 'he') std = Math.sqrt(2);
            else std = parseFloat(stdSld.value);
            const w = Math.abs(std) * 1.0;     // 用 |σ_W| 代表该层权重平均强度
            const d = Math.max(0.01, Math.abs(actD(a, act)));
            factors.push(w * d);
            // 更新 a 的近似值
            a = act === 'relu' ? Math.min(1, a * w) : Math.tanh(w * a);
        }
        return factors;
    }

    let particles = [];
    let playing = true, animId = null, spawnTick = 0;

    function layout() {
        const depth = parseInt(depthSld.value);
        const nodes = [];
        const x0 = 80, x1 = cv.width - 80, y = cv.height / 2 - 10;
        for (let l = 0; l <= depth; l++) {
            nodes.push({ x: x0 + (x1 - x0) * l / depth, y, layer: l });
        }
        return nodes;
    }

    function draw() {
        const W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);
        const depth = parseInt(depthSld.value);
        const factors = layerFactors();
        const nodes = layout();

        // 层节点链
        ctx.font = '11px Consolas';
        for (let l = 0; l <= depth; l++) {
            const n = nodes[l];
            const isOut = l === depth;
            ctx.fillStyle = isOut ? '#ec4899' : (l === 0 ? '#22c55e' : 'rgba(99,102,241,0.85)');
            ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, Math.PI * 2); ctx.fill();
            if (l % Math.ceil(depth / 8) === 0 || isOut || l === 0) {
                fxLabel(ctx, isOut ? '输出' : (l === 0 ? '输入' : 'L' + l), n.x, n.y + 22, 'rgba(255,255,255,0.45)', '10px "Microsoft YaHei"', 'center');
            }
            // 层间连线（透明度 = 该层因子）
            if (l > 0) {
                const f = Math.min(1, factors[l - 1]);
                ctx.strokeStyle = 'rgba(148,163,184,' + (0.1 + f * 0.4) + ')';
                ctx.lineWidth = 1 + f * 2;
                ctx.beginPath(); ctx.moveTo(nodes[l - 1].x + 8, n.y); ctx.lineTo(n.x - 8, n.y); ctx.stroke();
            }
        }

        // 粒子（从输出向输入移动）
        spawnTick++;
        if (spawnTick % 14 === 0) {
            particles.push({ x: nodes[depth].x, v: -1.6, size: 6, layer: depth });
        }
        particles = particles.filter(p => p.x > nodes[0].x - 20);
        for (const p of particles) {
            // 当前所处层区间
            const segW = (nodes[depth].x - nodes[0].x) / depth;
            let seg = Math.min(depth - 1, Math.max(0, Math.floor((nodes[depth].x - p.x) / segW)));
            const f = Math.min(2.5, factors[seg] || 1);
            // 粒子经过层间时按该层因子缩放亮度
            p.size = Math.max(1.5, Math.min(9, p.size * (0.94 + 0.06 * Math.min(2, f))));
            const bright = Math.min(1, 0.15 + p.size / 9);
            p.x += p.v;
            const grad = ctx.createRadialGradient(p.x, nodes[0].y, 0, p.x, nodes[0].y, p.size * 3);
            const col = f > 1.15 ? '236,72,153' : (f < 0.85 ? '148,163,184' : '251,191,36');
            grad.addColorStop(0, 'rgba(' + col + ',' + bright + ')');
            grad.addColorStop(1, 'rgba(' + col + ',0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(p.x, nodes[0].y, p.size * 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(' + col + ',' + Math.min(1, bright + 0.2) + ')';
            ctx.beginPath(); ctx.arc(p.x, nodes[0].y, p.size, 0, Math.PI * 2); ctx.fill();
        }

        // 图例
        const ly = H - 26;
        const legs = [['148,163,184', '梯度消失（因子<1）'], ['251,191,36', '正常流动'], ['236,72,153', '梯度爆炸（因子>1）']];
        let lx = 80;
        for (const [c, t] of legs) {
            ctx.fillStyle = 'rgba(' + c + ',0.9)';
            ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
            fxLabel(ctx, t, lx + 12, ly, '#94a3b8', '11px "Microsoft YaHei"');
            lx += 200;
        }
        // 当前平均因子提示
        const avg = factors.reduce((a, b) => a + b, 0) / factors.length;
        fxLabel(ctx, '层平均缩放因子 ≈ ' + avg.toFixed(3) + (avg < 0.9 ? ' → 梯度消失' : avg > 1.1 ? ' → 梯度爆炸' : ' → 健康流动'),
            W - 80, ly, avg < 0.9 ? '#94a3b8' : avg > 1.1 ? '#ec4899' : '#fbbf24', 'bold 12px "Microsoft YaHei"', 'right');

        if (playing) animId = requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { playing = false; if (animId) cancelAnimationFrame(animId); }
        else if (!playing) { playing = true; animId = requestAnimationFrame(draw); }
    });

    draw();
}

// ============================================================
// 教学动画 5：优化器竞速「梯度方向箭头 + 速度表」
//   竞速时在每个优化器当前位置画负梯度方向箭头，
//   右侧面板显示四个优化器的"速度"（位移模长）实时条形图
// ============================================================
function initOptimizerFX() {
    const cv = ensureCompanion('fxOptimizer', '动画演示：各优化器当前负梯度方向与步长（速度）对比', 1000, 220);
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const opCanvas = document.getElementById('opCanvas');
    if (!opCanvas) return;

    // 读取主实验状态（通过全局 window._optimizerFXState 同步）
    let speeds = [0, 0, 0, 0];
    const NAMES = ['SGD', 'Momentum', 'RMSProp', 'Adam'];
    const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];
    let playing = true, animId = null;

    // 钩住主实验：包装 draw 不可行（闭包私有），改为定时读取 window.__opSpeeds
    function draw() {
        const W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);
        const st = window.__opFXState;
        if (st && st.dirs) {
            speeds = st.speeds;
            // 四个方向罗盘
            const cx = 110, cy = H / 2 - 6, R = 70;
            // 圆环
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2); ctx.stroke();
            fxLabel(ctx, '负梯度方向', cx, cy + R + 22, 'rgba(255,255,255,0.5)', '11px "Microsoft YaHei"', 'center');
            // 四支箭头（略微错开角度避免完全重叠）
            for (let k = 0; k < 4; k++) {
                const [gx, gy] = st.dirs[k];
                const norm = Math.hypot(gx, gy) || 1;
                const len = Math.min(R - 6, norm * 18);
                const off = (k - 1.5) * 0.06;   // 微小角偏移
                const ca = Math.cos(off), sa = Math.sin(off);
                const dx = (gx / norm) * ca - (gy / norm) * sa;
                const dy = (gx / norm) * sa + (gy / norm) * ca;
                fxArrow(ctx, cx, cy, cx + dx * len, cy - dy * len, COLORS[k], 2.5);
            }
            // 速度条形图
            const bx = 260, bw = W - bx - 70, bh = 30, gap = 12;
            const maxS = Math.max(...speeds, 0.05);
            for (let k = 0; k < 4; k++) {
                const y = 24 + k * (bh + gap);
                fxLabel(ctx, NAMES[k], bx - 10, y + bh / 2, COLORS[k], 'bold 12px "Microsoft YaHei"', 'right');
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.fillRect(bx, y, bw, bh);
                ctx.fillStyle = COLORS[k];
                ctx.fillRect(bx, y, bw * Math.min(1, speeds[k] / maxS), bh);
                fxLabel(ctx, speeds[k].toFixed(4), bx + bw + 8, y + bh / 2, '#94a3b8', '11px Consolas');
            }
            fxLabel(ctx, '单步位移 |Δθ|（速度）', bx + bw / 2, 8, 'rgba(255,255,255,0.6)', '12px "Microsoft YaHei"', 'center');
        } else {
            fxLabel(ctx, '点击上方「▶ 竞速 200 步」查看方向与速度对比', W / 2, H / 2, 'rgba(255,255,255,0.4)', '13px "Microsoft YaHei"', 'center');
        }
        if (playing) animId = requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { playing = false; if (animId) cancelAnimationFrame(animId); }
        else if (!playing) { playing = true; animId = requestAnimationFrame(draw); }
    });

    draw();
}

// ============================================================
// 实验目录筛选 + 平滑滚动
// ============================================================
function initLabIndex() {
    const indexEl = document.getElementById('labIndex');
    if (!indexEl) return;

    const filterBtns = indexEl.querySelectorAll('.lab-filter-btn');
    const cards = indexEl.querySelectorAll('.lab-index-card');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            cards.forEach(c => {
                c.style.display = (f === 'all' || c.dataset.cat === f) ? '' : 'none';
            });
        });
    });

    // 卡片点击平滑滚动（考虑固定导航高度）
    cards.forEach(c => {
        c.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(c.getAttribute('href'));
            if (target) {
                const y = target.getBoundingClientRect().top + window.pageYOffset - 90;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });
}

// ============================================================
// Initialize all
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initLabFullscreen();
    initActivationFX();
    initCNNPipelineFX();
    initSoftmaxStepsFX();
    initVanishParticlesFX();
    initOptimizerFX();
    initSoftmaxLab();
    initVanishingLab();
    initOptimizerLab();
    initSchedulerLab();
    initPlaygroundLab();
    initAutoencoderLab();
    initGANLab();
    initDiffusionLab();
    initLabIndex();
});
