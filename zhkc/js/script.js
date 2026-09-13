// ============================================================
// MathJax LaTeX 辅助函数
// ============================================================
function typesetMath(elements) {
    if (window.MathJax && MathJax.typesetPromise && MathJax.typesetClear) {
        try {
            MathJax.typesetClear(elements);
        } catch(e) {}
        MathJax.typesetPromise(elements).catch(() => {});
    }
}

// ============================================================
// Neural Network Background Animation
// ============================================================
function initNeuralCanvas() {
    const canvas = document.getElementById('neuralCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let nodes = [];
    let mouseX = -1000;
    let mouseY = -1000;
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initNodes();
    }
    
    function initNodes() {
        nodes = [];
        const nodeCount = Math.floor((width * height) / 25000);
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 2 + 1
            });
        }
    }
    
    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            node.x += node.vx;
            node.y += node.vy;
            
            if (node.x < 0 || node.x > width) node.vx *= -1;
            if (node.y < 0 || node.y > height) node.vy *= -1;
            
            const dx = node.x - mouseX;
            const dy = node.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                node.x += (dx / dist) * 0.8;
                node.y += (dy / dist) * 0.8;
            }
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
            ctx.fill();
        }
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 140) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 140) * 0.25})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(draw);
    }
    
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });
    
    resize();
    draw();
}

// ============================================================
// Number Counter Animation
// ============================================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-num');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const duration = 2000;
                const start = performance.now();
                
                function update(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(target * eased);
                    if (progress < 1) requestAnimationFrame(update);
                }
                requestAnimationFrame(update);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(c => observer.observe(c));
}

// ============================================================
// Scroll Reveal
// ============================================================
function initScrollReveal() {
    const elements = document.querySelectorAll('.feature-card, .chapter-card, .resource-item, .lab-card, .reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
    elements.forEach(el => observer.observe(el));
}

// ============================================================
// Nav Active
// ============================================================
function initNavActive() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    function update() {
        const scrollY = window.scrollY + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', update);
    update();
}

// ============================================================
// Progress Bars
// ============================================================
function initProgressBars() {
    const bars = document.querySelectorAll('.progress-fill');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.style.width = el.dataset.width;
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    bars.forEach(b => observer.observe(b));
}

// ============================================================
// 实验1: 激活函数可视化 (增强版 - LaTeX公式 + 更多函数)
// ============================================================
function initActivationDemo() {
    const canvas = document.getElementById('activationCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const select = document.getElementById('activationSelect');
    const scaleSlider = document.getElementById('scaleSlider');
    const biasSlider = document.getElementById('biasSlider');
    const scaleValue = document.getElementById('scaleValue');
    const biasValue = document.getElementById('biasValue');
    const formulaDisplay = document.getElementById('formulaDisplay');
    const derivFormulaDisplay = document.getElementById('derivFormulaDisplay');
    const featureDisplay = document.getElementById('featureDisplay');
    const showDerivative = document.getElementById('showDerivative');
    
    const alpha_elu = 1.0;
    const functions = {
        sigmoid: {
            func: (x) => 1 / (1 + Math.exp(-x)),
            deriv: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); },
            formula: 'f(x) = \\frac{1}{1 + e^{-x}}',
            derivFormula: "f'(x) = f(x) \\cdot (1 - f(x))",
            feature: 'S形曲线，输出范围(0,1)，常用于二分类输出层。缺点：两端梯度趋零(梯度消失)，输出非零中心',
            yMin: -0.3, yMax: 1.3,
            equalAspect: false,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) = \\frac{1}{1 + e^{-(${arg})}}`,
            paramDeriv: (a, b, arg) => `f'(x) = ${a.toFixed(1)} \\cdot f(x) \\cdot (1 - f(x))`
        },
        tanh: {
            func: (x) => Math.tanh(x),
            deriv: (x) => { const t = Math.tanh(x); return 1 - t * t; },
            formula: 'f(x) = \\tanh(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}',
            derivFormula: "f'(x) = 1 - f(x)^2",
            feature: '双曲正切，输出范围(-1,1)，以零为中心，收敛速度快于Sigmoid。仍有梯度消失问题',
            yMin: -1.3, yMax: 1.3,
            equalAspect: false,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) = \\tanh(${arg})`,
            paramDeriv: (a, b, arg) => `f'(x) = ${a.toFixed(1)} \\cdot [1 - f(x)^2]`
        },
        relu: {
            func: (x) => Math.max(0, x),
            deriv: (x) => x > 0 ? 1 : 0,
            formula: 'f(x) = \\max(0,\\, x)',
            derivFormula: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\leq 0 \\end{cases}",
            feature: '线性整流单元，计算高效，缓解梯度消失。缺点：负半轴"死亡"，输出非零中心',
            yMin: -0.8, yMax: 7.5,
            equalAspect: true,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) = \\max(0,\\, ${arg})`,
            paramDeriv: (a, b, arg) => `f'(x) = \\begin{cases} ${a.toFixed(1)} & ${arg} > 0 \\\\ 0 & ${arg} \\leq 0 \\end{cases}`
        },
        leakyrelu: {
            func: (x) => x > 0 ? x : 0.01 * x,
            deriv: (x) => x > 0 ? 1 : 0.01,
            formula: 'f(x) = \\begin{cases} x & x > 0 \\\\ 0.01x & x \\leq 0 \\end{cases}',
            derivFormula: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ 0.01 & x \\leq 0 \\end{cases}",
            feature: '带泄漏的ReLU，负区间保留小梯度，避免神经元"死亡"问题',
            yMin: -0.8, yMax: 7.5,
            equalAspect: true,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) = \\begin{cases} ${arg} & ${arg} > 0 \\\\ 0.01 \\cdot (${arg}) & ${arg} \\leq 0 \\end{cases}`,
            paramDeriv: (a, b, arg) => `f'(x) = \\begin{cases} ${a.toFixed(1)} & ${arg} > 0 \\\\ 0.01 \\cdot ${a.toFixed(1)} & ${arg} \\leq 0 \\end{cases}`
        },
        elu: {
            func: (x) => x > 0 ? x : alpha_elu * (Math.exp(x) - 1),
            deriv: (x) => x > 0 ? 1 : alpha_elu * Math.exp(x),
            formula: 'f(x) = \\begin{cases} x & x > 0 \\\\ \\alpha(e^x - 1) & x \\leq 0 \\end{cases} \\quad (\\alpha{=}1.0)',
            derivFormula: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ \\alpha e^x & x \\leq 0 \\end{cases}",
            feature: '指数线性单元，负区间输出趋近-α，零中心化，平滑过渡。计算量略高于ReLU',
            yMin: -1.5, yMax: 7.5,
            equalAspect: true,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) = \\begin{cases} ${arg} & ${arg} > 0 \\\\ \\alpha(e^{${arg}} - 1) & ${arg} \\leq 0 \\end{cases}`,
            paramDeriv: (a, b, arg) => `f'(x) = \\begin{cases} ${a.toFixed(1)} & ${arg} > 0 \\\\ \\alpha e^{${arg}} \\cdot ${a.toFixed(1)} & ${arg} \\leq 0 \\end{cases}`
        },
        softplus: {
            func: (x) => Math.log(1 + Math.exp(x)),
            deriv: (x) => 1 / (1 + Math.exp(-x)),
            formula: 'f(x) = \\ln(1 + e^x)',
            derivFormula: "f'(x) = \\sigma(x) = \\frac{1}{1 + e^{-x}}",
            feature: 'ReLU的平滑近似，处处可导，导数恰好是Sigmoid。输出恒正，计算量较大',
            yMin: -0.8, yMax: 7.5,
            equalAspect: true,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) = \\ln(1 + e^{${arg}})`,
            paramDeriv: (a, b, arg) => `f'(x) = ${a.toFixed(1)} \\cdot \\sigma(${arg})`
        },
        swish: {
            func: (x) => x * (1 / (1 + Math.exp(-x))),
            deriv: (x) => {
                const sig = 1 / (1 + Math.exp(-x));
                return sig + x * sig * (1 - sig);
            },
            formula: 'f(x) = x \\cdot \\sigma(x) \\quad \\text{(SiLU)}',
            derivFormula: "f'(x) = \\sigma(x) + x \\cdot \\sigma(x)(1 - \\sigma(x))",
            feature: 'Swish/SiLU函数，自门控机制，兼具ReLU的稀疏性和Sigmoid的平滑性。GPT-4等大模型常用',
            yMin: -0.6, yMax: 7.5,
            equalAspect: true,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) = (${arg}) \\cdot \\sigma(${arg})`,
            paramDeriv: (a, b, arg) => `f'(x) = ${a.toFixed(1)} \\cdot [\\sigma(${arg}) + (${arg}) \\cdot \\sigma(${arg})(1 - \\sigma(${arg}))]`
        },
        gelu: {
            func: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x))),
            deriv: (x) => {
                const sqrt2pi = Math.sqrt(2 / Math.PI);
                const inner = sqrt2pi * (x + 0.044715 * x * x * x);
                const t = Math.tanh(inner);
                const sech2 = 1 - t * t;
                const dinner = sqrt2pi * (1 + 3 * 0.044715 * x * x);
                return 0.5 * (1 + t) + 0.5 * x * sech2 * dinner;
            },
            formula: 'f(x) \\approx \\tfrac{1}{2}\\,x\\!\\left(1 + \\tanh\\!\\left(\\sqrt{\\tfrac{2}{\\pi}}\\,(x + 0.044715\\,x^3)\\right)\\right)',
            derivFormula: "f'(x) \\approx \\tfrac{1}{2}(1\\!+\\!\\tanh(\\cdot)) + \\tfrac{1}{2}\\,x\\,\\mathrm{sech}^2(\\cdot)\\,\\frac{d}{dx}(\\cdot)",
            feature: '高斯误差线性单元，BERT/GPT系列模型核心激活函数。按输入大小概率性"门控"',
            yMin: -0.6, yMax: 7.5,
            equalAspect: true,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) \\approx \\tfrac{1}{2}(${arg})\\!\\left(1 + \\tanh\\!\\left(\\sqrt{\\tfrac{2}{\\pi}}\\,((${arg}) + 0.044715(${arg})^3)\\right)\\right)`,
            paramDeriv: (a, b, arg) => `f'(x) \\approx ${a.toFixed(1)} \\cdot [\\tfrac{1}{2}(1\\!+\\!\\tanh(\\cdot)) + \\tfrac{1}{2}(${arg})\\,\\mathrm{sech}^2(\\cdot)\\,\\frac{d}{dx}(\\cdot)]`
        },
        mish: {
            func: (x) => x * Math.tanh(Math.log(1 + Math.exp(x))),
            deriv: (x) => {
                const sp = Math.log(1 + Math.exp(x));
                const th = Math.tanh(sp);
                const sech2 = 1 - th * th;
                const sig = 1 / (1 + Math.exp(-x));
                return th + x * sech2 * sig;
            },
            formula: 'f(x) = x \\cdot \\tanh(\\ln(1 + e^x))',
            derivFormula: "f'(x) = \\tanh(\\mathrm{softplus}) + x \\cdot \\mathrm{sech}^2(\\mathrm{softplus}) \\cdot \\sigma(x)",
            feature: 'Mish函数，Swish变体，平滑非单调，下界有界上界无界。YOLOv4等模型验证其有效性',
            yMin: -0.6, yMax: 7.5,
            equalAspect: true,
            argPattern: (a, b) => {
                const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toFixed(1));
                const bStr = b > 0 ? ` + ${b.toFixed(1)}` : (b < 0 ? ` - ${Math.abs(b).toFixed(1)}` : '');
                return `${aStr}x${bStr}`;
            },
            paramFormula: (a, b, arg) => `f(x) = (${arg}) \\cdot \\tanh(\\ln(1 + e^{${arg}}))`,
            paramDeriv: (a, b, arg) => `f'(x) \\approx ${a.toFixed(1)} \\cdot [\\tanh(\\mathrm{softplus}) + (${arg}) \\cdot \\mathrm{sech}^2(\\mathrm{softplus}) \\cdot \\sigma(${arg})]`
        }
    };
    
    // 更新公式显示（LaTeX渲染，带缩放α和偏置b参数）
    function updateFormulas() {
        const fn = functions[select.value];
        if (!fn) return;
        const alpha = parseFloat(scaleSlider.value);
        const beta = parseFloat(biasSlider.value);
        const arg = fn.argPattern ? fn.argPattern(alpha, beta) : fn.argPattern || 'x';
        const safeArg = arg || `${alpha.toFixed(1)}x`;

        if (formulaDisplay) {
            let text;
            if ((Math.abs(alpha - 1) < 1e-6) && (Math.abs(beta) < 1e-6)) {
                text = fn.formula;
            } else {
                text = fn.paramFormula ? fn.paramFormula(alpha, beta, safeArg) : fn.formula;
            }
            formulaDisplay.innerHTML = '$' + text + '$';
        }
        if (derivFormulaDisplay) {
            let text;
            if ((Math.abs(alpha - 1) < 1e-6) && (Math.abs(beta) < 1e-6)) {
                text = fn.derivFormula;
            } else {
                text = fn.paramDeriv ? fn.paramDeriv(alpha, beta, safeArg) : fn.derivFormula;
            }
            derivFormulaDisplay.innerHTML = '$' + text + '$';
        }
        if (featureDisplay) {
            featureDisplay.textContent = fn.feature;
        }
        typesetMath([formulaDisplay, derivFormulaDisplay]);
    }
    
    function draw() {
        const type = select.value;
        const scale = parseFloat(scaleSlider.value);
        const bias = parseFloat(biasSlider.value);
        const fn = functions[type];
        const showDeriv = showDerivative && showDerivative.checked;
        
        const W = canvas.width;
        const H = canvas.height;
        const padding = 50;
        const plotW = W - padding * 2;
        const plotH = H - padding * 2;
        
        ctx.clearRect(0, 0, W, H);
        
        const xRange = 10;
        const yMinRaw = fn.yMin;
        const yMaxRaw = fn.yMax;
        const sampleSteps = 200;
        let actualYMin = Infinity, actualYMax = -Infinity;
        for (let i = 0; i <= sampleSteps; i++) {
            const sx = -xRange + (2 * xRange * i / sampleSteps);
            const tx = sx * scale + bias;
            const sy = fn.func(tx);
            if (sy < actualYMin) actualYMin = sy;
            if (sy > actualYMax) actualYMax = sy;
        }
        const yMin = Math.min(yMinRaw, actualYMin);
        const yMax = Math.max(yMaxRaw, actualYMax, 0.1);
        const yRange = yMax - yMin;
        
        // 根据函数决定是否强制x/y轴等比例：Sigmoid/Tanh类输出有界，自适应更美观；ReLU等线性段需等比例
        let offsetX, offsetY, unit;
        let useEqualAspect = fn.equalAspect === true;
        let effectivePlotW, effectivePlotH;
        if (useEqualAspect) {
            const xUnit = plotW / (2 * xRange);
            const yUnit = plotH / yRange;
            unit = Math.min(xUnit, yUnit);
            effectivePlotW = unit * 2 * xRange;
            effectivePlotH = unit * yRange;
            offsetX = padding + (plotW - effectivePlotW) / 2;
            offsetY = H - padding - (plotH - effectivePlotH) / 2;
        } else {
            // 非等比例：填满整个绘图区域，Sigmoid/Tanh更饱满
            effectivePlotW = plotW;
            effectivePlotH = plotH;
            offsetX = padding;
            offsetY = H - padding;
            // 用 xUnit 和 yUnit 单独缩放
        }
        function toScreenX(val) {
            if (useEqualAspect) return offsetX + (val + xRange) * unit;
            return offsetX + ((val + xRange) / (2 * xRange)) * effectivePlotW;
        }
        function toScreenY(val) {
            if (useEqualAspect) return offsetY - (val - yMin) * unit;
            return offsetY - ((val - yMin) / yRange) * effectivePlotH;
        }
        
        // 网格线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        for (let i = -xRange; i <= xRange; i += 1) {
            const x = toScreenX(i);
            ctx.beginPath();
            ctx.moveTo(x, offsetY - effectivePlotH);
            ctx.lineTo(x, offsetY);
            ctx.stroke();
        }
        // y轴网格（自动间隔，根据范围自适应）
        let yStep;
        if (yRange <= 2) yStep = 0.5;
        else if (yRange <= 4) yStep = 1;
        else if (yRange <= 10) yStep = 2;
        else if (yRange <= 25) yStep = 5;
        else yStep = 10;
        for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
            const y = toScreenY(v);
            ctx.beginPath();
            ctx.moveTo(offsetX, y);
            ctx.lineTo(offsetX + effectivePlotW, y);
            ctx.stroke();
        }
        
        // 坐标轴
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        if (yMin <= 0 && yMax >= 0) {
            const zeroY = toScreenY(0);
            ctx.beginPath();
            ctx.moveTo(offsetX, zeroY);
            ctx.lineTo(offsetX + effectivePlotW, zeroY);
            ctx.stroke();
        }
        const zeroX = toScreenX(0);
        ctx.beginPath();
        ctx.moveTo(zeroX, offsetY - effectivePlotH);
        ctx.lineTo(zeroX, offsetY);
        ctx.stroke();
        
        // y=1参考线（对sigmoid等有用）
        if (yMin <= 1 && yMax >= 1) {
            const oneY = toScreenY(1);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(offsetX, oneY);
            ctx.lineTo(offsetX + effectivePlotW, oneY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 导数曲线（先画，在底层）
        if (showDeriv) {
            const derivGradient = ctx.createLinearGradient(0, 0, W, 0);
            derivGradient.addColorStop(0, 'rgba(251, 146, 60, 0.6)');
            derivGradient.addColorStop(1, 'rgba(245, 158, 11, 0.6)');
            
            ctx.strokeStyle = derivGradient;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.beginPath();
            
            const steps = 300;
            for (let i = 0; i <= steps; i++) {
                const xVal = -xRange + (2 * xRange * i / steps);
                const transformedX = xVal * scale + bias;
                const yVal = fn.deriv(transformedX);
                
                const x = toScreenX(xVal);
                const y = toScreenY(yVal);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 主函数曲线
        const gradient = ctx.createLinearGradient(0, 0, W, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const steps = 300;
        for (let i = 0; i <= steps; i++) {
            const xVal = -xRange + (2 * xRange * i / steps);
            const transformedX = xVal * scale + bias;
            const yVal = fn.func(transformedX);
            
            const x = toScreenX(xVal);
            const y = toScreenY(yVal);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // 坐标轴标签
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = -xRange; i <= xRange; i += 2) {
            const x = toScreenX(i);
            const zeroY = (yMin <= 0 && yMax >= 0) ? toScreenY(0) : offsetY;
            ctx.fillText(i.toString(), x, zeroY + 6);
        }
        // y轴刻度
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
            const y = toScreenY(v);
            ctx.fillText(v % 1 === 0 ? v.toString() : v.toFixed(1), offsetX - 8, y);
        }
        
        // 图例 - Canvas画线条+背景框，文字标签使用overlay的LaTeX渲染（美观不重合）
        const actOverlay = document.getElementById('actFormulaOverlay');
        // 图例位置：画布左上角安全区内(4,4)，在padding内不会与曲线重叠
        const legendW = 120;
        const legendH = showDeriv ? 50 : 28;
        const legendX = 4;
        const legendY = 4;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.fillRect(legendX, legendY, legendW, legendH);
        ctx.strokeRect(legendX, legendY, legendW, legendH);

        // f(x) 颜色线（画在图例框内左侧）
        ctx.strokeStyle = 'rgba(99, 102, 241, 1.0)';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(legendX + 10, legendY + 14);
        ctx.lineTo(legendX + 40, legendY + 14);
        ctx.stroke();

        // f'(x) 颜色线
        if (showDeriv) {
            ctx.strokeStyle = 'rgba(251, 146, 60, 1.0)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(legendX + 10, legendY + 36);
            ctx.lineTo(legendX + 40, legendY + 36);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 使用LaTeX overlay渲染函数/导数符号（更美观），放在线条右侧
        if (actOverlay) {
            // wrapper内的坐标：overlay覆盖整个wrapper，需要考虑canvas相对wrapper的偏移
            const canvasRect = canvas.getBoundingClientRect();
            const wrapper = actOverlay.parentElement;
            const wrapperRect = wrapper.getBoundingClientRect();
            const canvasOffsetX = canvasRect.left - wrapperRect.left;
            const canvasOffsetY = canvasRect.top - wrapperRect.top;

            const labelLeft = canvasOffsetX + legendX + 48;
            const top1 = canvasOffsetY + legendY + 5;
            const top2 = canvasOffsetY + legendY + 27;

            const parts = [];
            parts.push('<span style="position:absolute;left:' + labelLeft + 'px;top:' + top1 +
                'px;color:rgba(99,102,241,0.95);font-size:13px;font-weight:bold;line-height:1;">$f(x)$</span>');
            if (showDeriv) {
                parts.push('<span style="position:absolute;left:' + labelLeft + 'px;top:' + top2 +
                    'px;color:rgba(251,146,60,0.98);font-size:13px;font-weight:bold;line-height:1;">$f\'(x)$</span>');
            }
            actOverlay.innerHTML = parts.join('');
            typesetMath([actOverlay]);
        }
        
        // 更新滑块值
        scaleValue.textContent = scale.toFixed(1);
        biasValue.textContent = bias.toFixed(1);
    }
    
    select.addEventListener('change', () => {
        draw();
        updateFormulas();
    });
    scaleSlider.addEventListener('input', () => { draw(); updateFormulas(); });
    biasSlider.addEventListener('input', () => { draw(); updateFormulas(); });
    if (showDerivative) showDerivative.addEventListener('change', draw);
    
    draw();
    updateFormulas();
}

// ============================================================
// 实验2: 梯度下降优化过程
// ============================================================
function initGradientDescent() {
    const canvas = document.getElementById('gdCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const lrSlider = document.getElementById('lrSlider');
    const momentumSlider = document.getElementById('momentumSlider');
    const initPosSlider = document.getElementById('initPosSlider');
    const lrValue = document.getElementById('lrValue');
    const momentumValue = document.getElementById('momentumValue');
    const initPosValue = document.getElementById('initPosValue');
    const stepCountEl = document.getElementById('gdStepCount');
    const lossEl = document.getElementById('gdLossValue');
    const optNameEl = document.getElementById('gdOptimizerName');
    const resetBtn = document.getElementById('gdResetBtn');
    const playBtn = document.getElementById('gdPlayBtn');
    
    function loss(x) { return 0.3*x*x*x*x - 0.5*x*x*x + 0.2*x*x + x; }
    function grad(x) { return 1.2*x*x*x - 1.5*x*x + 0.4*x + 1; }
    
    let theta = -3;
    let velocity = 0;
    let stepCount = 0;
    let trail = [];
    let playing = false;
    let animId = null;
    
    function getPlotBounds() {
        const xMin = -4, xMax = 4;
        let yMin = Infinity, yMax = -Infinity;
        for (let x = xMin; x <= xMax; x += 0.05) {
            const y = loss(x);
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
        }
        yMin -= 1; yMax += 1;
        return { xMin, xMax, yMin, yMax };
    }
    
    function draw() {
        const W = canvas.width, H = canvas.height;
        const padding = 40;
        const { xMin, xMax, yMin, yMax } = getPlotBounds();
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;
        
        ctx.clearRect(0, 0, W, H);
        
        // 损失曲线
        const gradient = ctx.createLinearGradient(0, padding, 0, H - padding);
        gradient.addColorStop(0, 'rgba(139,92,246,0.5)');
        gradient.addColorStop(1, 'rgba(139,92,246,0.12)');
        
        ctx.beginPath();
        const steps = 200;
        for (let i = 0; i <= steps; i++) {
            const xVal = xMin + (xRange * i / steps);
            const yVal = loss(xVal);
            const px = padding + ((xVal - xMin) / xRange) * (W - padding * 2);
            const py = padding + ((yMax - yVal) / yRange) * (H - padding * 2);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.lineTo(W - padding, H - padding);
        ctx.lineTo(padding, H - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // 轨迹
        if (trail.length > 1) {
            ctx.strokeStyle = 'rgba(99,102,241,0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < trail.length; i++) {
                const px = padding + ((trail[i].theta - xMin) / xRange) * (W - padding * 2);
                const py = padding + ((yMax - trail[i].loss) / yRange) * (H - padding * 2);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
        
        // 小球
        const curLoss = loss(theta);
        const bx = padding + ((theta - xMin) / xRange) * (W - padding * 2);
        const by = padding + ((yMax - curLoss) / yRange) * (H - padding * 2);
        
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 30);
        glow.addColorStop(0, 'rgba(236,72,153,0.4)');
        glow.addColorStop(1, 'rgba(236,72,153,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bx, by, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // ===== 教学增强 ①：当前点切线（斜率 = 导数）=====
        const g = grad(theta);
        const tl = 110;
        const dxLoss = 0.5;   // 切线在损失坐标下横跨的 x 宽度
        const pxA = bx - tl / 2;
        const pxB = bx + tl / 2;
        const slopePx = (loss(theta + dxLoss) - loss(theta - dxLoss)) / (2 * dxLoss) / yRange * (H - padding * 2);
        ctx.strokeStyle = 'rgba(251,191,36,0.9)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pxA, by - slopePx * tl / 2);
        ctx.lineTo(pxB, by + slopePx * tl / 2);
        ctx.stroke();
        // 切线读数
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const lblX = Math.min(pxB + 8, W - 92);
        ctx.fillText("∇L=" + g.toFixed(2), lblX, by - 14);

        // ===== 教学增强 ②：负梯度方向箭头（沿曲线切线下坡方向）=====
        const dir = -Math.sign(g);
        const arrLen = Math.min(46, 14 + Math.abs(g) * 10);
        const midX = bx + dir * arrLen * 0.5 * (2 / (1 + Math.abs(slopePx) * 0.02));
        const midY = padding + ((yMax - loss(theta + dir * arrLen * 0.5 * xRange / (W - padding * 2))) / yRange) * (H - padding * 2);
        ctx.strokeStyle = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx + dir * 12, by - 20);
        ctx.lineTo(bx + dir * (12 + arrLen), by - 20);
        ctx.stroke();
        // 箭头头
        ctx.beginPath();
        ctx.moveTo(bx + dir * (12 + arrLen), by - 20);
        ctx.lineTo(bx + dir * (4 + arrLen), by - 25);
        ctx.lineTo(bx + dir * (4 + arrLen), by - 15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 11px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.fillText('-∇L 方向', bx + dir * (12 + arrLen * 0.6), by - 34);

        // 坐标轴标签
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        for (let x = -3; x <= 3; x += 1) {
            const px = padding + ((x - xMin) / xRange) * (W - padding * 2);
            ctx.fillText(x.toString(), px, padding + (H - padding * 2) + 14);
        }
        
        // ===== 教学增强 ③：损失-步数曲线（右下角内嵌）=====
        const chartH = 108;
        const chartY = H - padding - chartH;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, chartY, W - padding * 2, chartH);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px "Microsoft YaHei"';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('损失 L 随步数下降', padding + 6, chartY - 3);
        if (trail.length > 1) {
            const maxL = Math.max(...trail.map(p => Math.abs(p.loss)), 0.1);
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < trail.length; i++) {
                const px = padding + i / Math.max(trail.length - 1, 1) * (W - padding * 2);
                const py = chartY + chartH - Math.min(1, Math.abs(trail[i].loss) / maxL) * (chartH - 8) - 4;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
            // 最新点
            const lastPx = padding + (trail.length - 1) / Math.max(trail.length - 1, 1) * (W - padding * 2);
            const lastPy = chartY + chartH - Math.min(1, Math.abs(trail[trail.length - 1].loss) / maxL) * (chartH - 8) - 4;
            ctx.fillStyle = '#ec4899';
            ctx.beginPath(); ctx.arc(lastPx, lastPy, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        
        stepCountEl.textContent = stepCount;
        lossEl.textContent = curLoss.toFixed(4);
        lrValue.textContent = parseFloat(lrSlider.value).toFixed(3);
        momentumValue.textContent = parseFloat(momentumSlider.value).toFixed(2);
        initPosValue.textContent = parseFloat(initPosSlider.value).toFixed(1);
        optNameEl.textContent = parseFloat(momentumSlider.value) > 0 ? 'SGD+Momentum' : 'SGD';
    }
    
    function step() {
        const lr = parseFloat(lrSlider.value);
        const momentum = parseFloat(momentumSlider.value);
        const g = grad(theta);
        velocity = momentum * velocity - lr * g;
        theta += velocity;
        stepCount++;
        trail.push({ theta: theta, loss: loss(theta) });
        if (trail.length > 200) trail.shift();
        
        if (Math.abs(g) < 1e-4 && stepCount > 10) {
            playing = false;
            playBtn.textContent = '开始';
            return;
        }
        if (stepCount > 500) {
            playing = false;
            playBtn.textContent = '开始';
            return;
        }
        
        draw();
        if (playing) animId = requestAnimationFrame(step);
    }
    
    function reset() {
        if (animId) cancelAnimationFrame(animId);
        playing = false;
        playBtn.textContent = '开始';
        theta = parseFloat(initPosSlider.value);
        velocity = 0;
        stepCount = 0;
        trail = [{ theta: theta, loss: loss(theta) }];
        draw();
    }
    
    playBtn.addEventListener('click', () => {
        if (playing) {
            playing = false;
            playBtn.textContent = '继续';
            if (animId) cancelAnimationFrame(animId);
        } else {
            playing = true;
            playBtn.textContent = '暂停';
            step();
        }
    });
    resetBtn.addEventListener('click', reset);
    lrSlider.addEventListener('input', () => { draw(); });
    momentumSlider.addEventListener('input', () => { draw(); });
    initPosSlider.addEventListener('input', reset);
    
    reset();
}

// ============================================================
// 实验3: 感知机二分类器 (修复类别B按钮)
// ============================================================
function initPerceptron() {
    const canvas = document.getElementById('perceptronCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const lrSlider = document.getElementById('perceptronLrSlider');
    const lrValueEl = document.getElementById('perceptronLrValue');
    const pointCountEl = document.getElementById('perceptronPointCount');
    const accuracyEl = document.getElementById('perceptronAccuracy');
    const boundaryEl = document.getElementById('perceptronBoundary');
    const classABtn = document.getElementById('classABtn');
    const classBBtn = document.getElementById('classBBtn');
    const trainBtn = document.getElementById('perceptronTrainBtn');
    const clearBtn = document.getElementById('perceptronClearBtn');
    
    let currentClass = 1;
    let points = [];
    let weights = [0, 0, 0];
    
    function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
    
    function predict(x, y) {
        const z = weights[0] + weights[1] * x + weights[2] * y;
        return sigmoid(z) >= 0.5 ? 1 : -1;
    }
    
    function toCanvasCoords(x, y) {
        const W = canvas.width, H = canvas.height;
        const scale = W / 6;
        return [W/2 + x * scale, H/2 - y * scale];
    }
    
    function toDataCoords(px, py) {
        const W = canvas.width, H = canvas.height;
        const scale = W / 6;
        return [(px - W/2) / scale, (H/2 - py) / scale];
    }
    
    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        
        const step = 4;
        for (let px = 0; px < W; px += step) {
            for (let py = 0; py < H; py += step) {
                const [x, y] = toDataCoords(px, py);
                const z = weights[0] + weights[1] * x + weights[2] * y;
                const c = sigmoid(z);
                if (c > 0.5) {
                    ctx.fillStyle = `rgba(99,102,241,${(c-0.5)*0.3})`;
                } else {
                    ctx.fillStyle = `rgba(236,72,153,${(0.5-c)*0.3})`;
                }
                ctx.fillRect(px, py, step, step);
            }
        }
        
        if (Math.abs(weights[2]) > 0.001) {
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            const x1 = -3, x2 = 3;
            const y1 = -(weights[0] + weights[1] * x1) / weights[2];
            const y2 = -(weights[0] + weights[1] * x2) / weights[2];
            const [px1, py1] = toCanvasCoords(x1, y1);
            const [px2, py2] = toCanvasCoords(x2, y2);
            ctx.moveTo(px1, py1);
            ctx.lineTo(px2, py2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            boundaryEl.innerHTML = `$${weights[1].toFixed(2)}x + ${weights[2].toFixed(2)}y + ${weights[0].toFixed(2)} = 0$`;
            typesetMath([boundaryEl]);
        }
        
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, H/2); ctx.lineTo(W, H/2);
        ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H);
        ctx.stroke();
        
        points.forEach(p => {
            const [px, py] = toCanvasCoords(p.x, p.y);
            ctx.beginPath();
            ctx.arc(px, py, 7, 0, Math.PI * 2);
            ctx.fillStyle = p.label === 1 ? '#6366f1' : '#ec4899';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(currentClass === 1 ? '当前: 类别A' : '当前: 类别B', 10, 20);
        
        pointCountEl.textContent = points.length;
        lrValueEl.textContent = parseFloat(lrSlider.value).toFixed(3);
        
        if (points.length > 0) {
            let correct = 0;
            points.forEach(p => { if (predict(p.x, p.y) === p.label) correct++; });
            accuracyEl.textContent = `${Math.round(correct / points.length * 100)}%`;
        }
    }
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const px = (e.clientX - rect.left) * canvas.width / canvas.clientWidth;
        const py = (e.clientY - rect.top) * canvas.height / canvas.clientHeight;
        const [x, y] = toDataCoords(px, py);
        points.push({ x, y, label: currentClass });
        draw();
    });
    
    function updateClassButtons() {
        if (currentClass === 1) {
            classABtn.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)';
            classABtn.style.color = 'white';
            classABtn.style.borderColor = 'transparent';
            classBBtn.style.background = 'rgba(255,255,255,0.05)';
            classBBtn.style.color = '#e2e8f0';
            classBBtn.style.borderColor = 'rgba(255,255,255,0.15)';
        } else {
            classBBtn.style.background = 'linear-gradient(135deg,#ec4899,#f43f5e)';
            classBBtn.style.color = 'white';
            classBBtn.style.borderColor = 'transparent';
            classABtn.style.background = 'rgba(255,255,255,0.05)';
            classABtn.style.color = '#e2e8f0';
            classABtn.style.borderColor = 'rgba(255,255,255,0.15)';
        }
    }
    
    classABtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentClass = 1;
        updateClassButtons();
        draw();
    });
    
    classBBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentClass = -1;
        updateClassButtons();
        draw();
    });
    
    updateClassButtons();
    
    trainBtn.addEventListener('click', () => {
        if (points.length === 0) return;
        const lr = parseFloat(lrSlider.value);
        for (let epoch = 0; epoch < 100; epoch++) {
            for (const p of points) {
                const z = weights[0] + weights[1] * p.x + weights[2] * p.y;
                const pred = sigmoid(z);
                const target = p.label === 1 ? 1 : 0;
                const error = pred - target;
                weights[0] -= lr * error * 1;
                weights[1] -= lr * error * p.x;
                weights[2] -= lr * error * p.y;
            }
        }
        draw();
    });
    
    clearBtn.addEventListener('click', () => {
        points = [];
        weights = [0, 0, 0];
        accuracyEl.textContent = '--';
        boundaryEl.textContent = '--';
        draw();
    });
    
    lrSlider.addEventListener('input', draw);
    draw();
}

// ============================================================
// 实验4: 神经网络前向传播 (增强版 - 修复布局 + LaTeX公式)
// ============================================================
function initNeuralNetworkViz() {
    const canvas = document.getElementById('nnCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const input1Slider = document.getElementById('input1Slider');
    const input2Slider = document.getElementById('input2Slider');
    const biasRangeSlider = document.getElementById('nnBiasRange');
    const biasRangeValueEl = document.getElementById('nnBiasRangeValue');
    const input1ValueEl = document.getElementById('input1Value');
    const input2ValueEl = document.getElementById('input2Value');
    const hiddenEl = document.getElementById('nnHiddenActivations');
    const preActEl = document.getElementById('nnHiddenPreActivations');
    const hidden2El = document.getElementById('nnHidden2Activations');
    const preAct2El = document.getElementById('nnHidden2PreActivations');
    const outputEl = document.getElementById('nnOutput');
    const predEl = document.getElementById('nnPrediction');
    const resetBtn = document.getElementById('nnResetBtn');
    const activationSelect = document.getElementById('nnActivation');
    const neuronCountSlider = document.getElementById('nnNeuronCount');
    const neuronCountValueEl = document.getElementById('nnNeuronCountValue');
    const neuronCount2Slider = document.getElementById('nnNeuronCount2');
    const neuronCount2ValueEl = document.getElementById('nnNeuronCount2Value');
    
    const activations = {
        sigmoid: { fn: (x) => 1/(1+Math.exp(-Math.max(-500,Math.min(500,x)))), name: '\\sigma', latex: '\\sigma' },
        tanh:    { fn: (x) => Math.tanh(x), name: 'tanh', latex: '\\tanh' },
        relu:    { fn: (x) => Math.max(0, x), name: 'ReLU', latex: '\\mathrm{ReLU}' }
    };
    
    let W1, b1, W2, b2, W3, b3;
    
    function randomWeights() {
        const n1 = parseInt(neuronCountSlider.value);
        const n2 = parseInt(neuronCount2Slider.value);
        const biasRange = parseFloat(biasRangeSlider.value);
        const s1 = Math.sqrt(2/2);
        W1 = Array.from({length: n1}, () => [(Math.random()-0.5)*2*s1, (Math.random()-0.5)*2*s1]);
        b1 = Array.from({length: n1}, () => (Math.random()-0.5)*2*biasRange);

        const s2 = Math.sqrt(2/n1);
        W2 = Array.from({length: n2}, () => Array.from({length: n1}, () => (Math.random()-0.5)*2*s2));
        b2 = Array.from({length: n2}, () => (Math.random()-0.5)*2*biasRange);

        const s3 = Math.sqrt(2/n2);
        W3 = Array.from({length: 2}, () => Array.from({length: n2}, () => (Math.random()-0.5)*2*s3));
        b3 = [(Math.random()-0.5)*2*biasRange, (Math.random()-0.5)*2*biasRange];
    }
    
    function forward(x1, x2) {
        const act = activations[activationSelect.value].fn;
        
        const z1 = [], h1 = [];
        for (let i = 0; i < W1.length; i++) {
            const z = W1[i][0] * x1 + W1[i][1] * x2 + b1[i];
            z1.push(z);
            h1.push(act(z));
        }
        
        const z2 = [], h2 = [];
        for (let i = 0; i < W2.length; i++) {
            let z = b2[i];
            for (let j = 0; j < h1.length; j++) {
                z += W2[i][j] * h1[j];
            }
            z2.push(z);
            h2.push(act(z));
        }
        
        const z3 = [], o = [];
        for (let i = 0; i < 2; i++) {
            let z = b3[i];
            for (let j = 0; j < h2.length; j++) {
                z += W3[i][j] * h2[j];
            }
            z3.push(z);
            o.push(act(z));
        }
        
        return { z1, h1, z2, h2, z3, o };
    }
    
    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const x1 = parseFloat(input1Slider.value);
        const x2 = parseFloat(input2Slider.value);
        const n1 = parseInt(neuronCountSlider.value);
        const n2 = parseInt(neuronCount2Slider.value);
        const result = forward(x1, x2);

        // 布局参数 - 上方留出公式空间，下方留出层标签空间
        const topMargin = 70;
        const bottomMargin = 70;
        const usableH = H - topMargin - bottomMargin;

        const layerX = [60, 185, 335, 465];
        // Unicode下标字符映射
        const sub = ['₀','₁','₂','₃','₄','₅','₆'];
        const layers = [
            { x: layerX[0], values: [x1, x2], labels: ['x₁', 'x₂'], color: '#6366f1' },
            { x: layerX[1], values: result.h1, zValues: result.z1, labels: Array.from({length: n1}, (_,i) => `h₁${sub[i+1]}`), color: '#8b5cf6' },
            { x: layerX[2], values: result.h2, zValues: result.z2, labels: Array.from({length: n2}, (_,i) => `h₂${sub[i+1]}`), color: '#a855f7' },
            { x: layerX[3], values: result.o, zValues: result.z3, labels: ['o₁', 'o₂'], color: '#ec4899' }
        ];
        
        function getNodeY(nodeIdx, total) {
            if (total <= 1) return topMargin + usableH / 2;
            const spacing = usableH / (total - 1);
            return topMargin + nodeIdx * spacing;
        }
        
        const maxDisplay = 6;
        
        // 连线 - 加粗
        const weightSets = [W1, W2, W3];
        for (let l = 0; l < 3; l++) {
            const srcLayer = layers[l];
            const dstLayer = layers[l + 1];
            const wSet = weightSets[l];
            const srcN = Math.min(srcLayer.values.length, maxDisplay);
            const dstN = Math.min(dstLayer.values.length, maxDisplay);
            
            for (let j = 0; j < dstN; j++) {
                for (let i = 0; i < srcN; i++) {
                    let w;
                    if (l === 0) w = wSet[j] ? wSet[j][i] : 0;
                    else w = wSet[j] ? wSet[j][i] : 0;

                    const y1 = getNodeY(i, srcLayer.values.length);
                    const y2 = getNodeY(j, dstLayer.values.length);

                    const alpha = Math.min(0.85, Math.abs(w) * 0.5 + 0.15);
                    ctx.strokeStyle = w > 0 ? `rgba(99,102,241,${alpha})` : `rgba(236,72,153,${alpha})`;
                    ctx.lineWidth = Math.max(2, Math.min(5, Math.abs(w) * 2.5));
                    ctx.beginPath();
                    ctx.moveTo(srcLayer.x, y1);
                    ctx.lineTo(dstLayer.x, y2);
                    ctx.stroke();
                }
            }

            // 在每对节点的连线中点显示权重标签
            for (let j = 0; j < dstN; j++) {
                for (let i = 0; i < srcN; i++) {
                    let w;
                    if (l === 0) w = wSet[j] ? wSet[j][i] : 0;
                    else w = wSet[j] ? wSet[j][i] : 0;

                    const y1 = getNodeY(i, srcLayer.values.length);
                    const y2 = getNodeY(j, dstLayer.values.length);
                    // 沿连线方向偏移到中点附近，避免多个标签重叠
                    const t = 0.5;
                    const mx = srcLayer.x + (dstLayer.x - srcLayer.x) * t;
                    const my = y1 + (y2 - y1) * t;

                    // 权重文本
                    const txt = (w >= 0 ? '+' : '') + w.toFixed(2);
                    ctx.font = 'bold 9px Consolas, monospace';
                    const tw = ctx.measureText(txt).width;
                    // 半透明背景框
                    ctx.fillStyle = 'rgba(15,23,42,0.9)';
                    ctx.fillRect(mx - tw/2 - 3, my - 6, tw + 6, 12);
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(mx - tw/2 - 3, my - 6, tw + 6, 12);
                    // 文本颜色根据权重符号
                    ctx.fillStyle = w >= 0 ? 'rgba(186,194,255,0.95)' : 'rgba(255,178,214,0.95)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(txt, mx, my);
                }
            }
        }

        // 节点
        for (let l = 0; l < layers.length; l++) {
            const layer = layers[l];
            const displayN = Math.min(layer.values.length, maxDisplay);
            
            for (let ni = 0; ni < displayN; ni++) {
                const y = getNodeY(ni, layer.values.length);
                const val = layer.values[ni];
                const r = 20;
                
                // 光晕
                const intensity = Math.min(1, Math.abs(val));
                const glow = ctx.createRadialGradient(layer.x, y, 0, layer.x, y, r * 2.5);
                const colorMap = {
                    '#6366f1': '99,102,241',
                    '#8b5cf6': '139,92,246',
                    '#a855f7': '168,85,247',
                    '#ec4899': '236,72,153'
                };
                glow.addColorStop(0, `rgba(${colorMap[layer.color]},${intensity * 0.3})`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(layer.x, y, r * 2.5, 0, Math.PI * 2);
                ctx.fill();
                
                // 节点圆
                ctx.beginPath();
                ctx.arc(layer.x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
                ctx.fill();
                ctx.strokeStyle = layer.color;
                ctx.lineWidth = 2.5;
                ctx.stroke();
                
                // 值
                ctx.fillStyle = '#e2e8f0';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(val.toFixed(2), layer.x, y);
                
                // 标签 - 放在节点上方
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(layer.labels[ni], layer.x, y - r - 12);
            }
            
            if (layer.values.length > maxDisplay) {
                const lastY = getNodeY(displayN - 1, layer.values.length);
                ctx.fillStyle = '#64748b';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('...', layer.x, lastY + 25);
            }
        }
        
        // 层标签 - 放在底部预留区域，加大字体（紧贴底部）
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('输入层', layerX[0], H - bottomMargin + 50);
        ctx.fillText('隐藏层1', layerX[1], H - bottomMargin + 50);
        ctx.fillText('隐藏层2', layerX[2], H - bottomMargin + 50);
        ctx.fillText('输出层', layerX[3], H - bottomMargin + 50);
        
        // 激活函数标注 - 不再在Canvas上画文字，改用LaTeX覆盖层
        const actLatex = activations[activationSelect.value].latex;
        
        // 更新 LaTeX 公式覆盖层
        const overlay = document.getElementById('nnFormulaOverlay');
        if (overlay) {
            overlay.innerHTML = '$$\\mathbf{z} = \\mathbf{W}\\mathbf{x} + \\mathbf{b}, \\quad \\mathbf{h} = ' + actLatex + '(\\mathbf{z})$$';
            typesetMath([overlay]);
        }
        
        // 更新信息
        input1ValueEl.textContent = x1.toFixed(1);
        input2ValueEl.textContent = x2.toFixed(1);
        biasRangeValueEl.textContent = parseFloat(biasRangeSlider.value).toFixed(1);
        neuronCountValueEl.textContent = n1;
        neuronCount2ValueEl.textContent = n2;
        hiddenEl.textContent = result.h1.map(v => v.toFixed(3)).join(', ');
        preActEl.textContent = result.z1.map(v => v.toFixed(3)).join(', ');
        hidden2El.textContent = result.h2.map(v => v.toFixed(3)).join(', ');
        preAct2El.textContent = result.z2.map(v => v.toFixed(3)).join(', ');
        outputEl.textContent = `(${result.o[0].toFixed(3)}, ${result.o[1].toFixed(3)})`;
        predEl.textContent = result.o[0] > result.o[1] ? '类别 A' : '类别 B';
    }

    input1Slider.addEventListener('input', draw);
    input2Slider.addEventListener('input', draw);
    biasRangeSlider.addEventListener('input', draw);
    activationSelect.addEventListener('change', draw);
    neuronCountSlider.addEventListener('input', () => { randomWeights(); draw(); });
    neuronCount2Slider.addEventListener('input', () => { randomWeights(); draw(); });
    resetBtn.addEventListener('click', () => { randomWeights(); draw(); });
    
    randomWeights();
    draw();
}

// ============================================================
// 实验5: 反向传播梯度流动（双层网络：x → h₁(σ) → y(σ) → Loss）
// ============================================================
function initBackpropagation() {
    const canvas = document.getElementById('bpCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const lrSlider   = document.getElementById('bpLrSlider');
    const lrValueEl  = document.getElementById('bpLrValue');
    const targetSlider  = document.getElementById('bpTargetSlider');
    const targetValueEl = document.getElementById('bpTargetValue');
    const w1Slider  = document.getElementById('bpW1Slider');
    const w1ValueEl = document.getElementById('bpW1Value');
    const b1Slider  = document.getElementById('bpB1Slider');
    const b1ValueEl = document.getElementById('bpB1Value');
    const w2Slider  = document.getElementById('bpW2Slider');
    const w2ValueEl = document.getElementById('bpW2Value');
    const b2Slider  = document.getElementById('bpB2Slider');
    const b2ValueEl = document.getElementById('bpB2Value');
    
    const trainBtn   = document.getElementById('bpTrainBtn');
    const train50Btn = document.getElementById('bpTrain50Btn');
    const resetBtn   = document.getElementById('bpResetBtn');
    
    const lossEl     = document.getElementById('bpLossValue');
    const gradYEl    = document.getElementById('bpGradYValue');
    const gradOutEl  = document.getElementById('bpGradOutValue');
    const gradHidEl  = document.getElementById('bpGradHidValue');
    const weightEl   = document.getElementById('bpWeightValue');
    const stepCountEl = document.getElementById('bpStepCount');
    
    const x_input = 1.0;
    let stepCount = 0;
    let lossHistory = [];
    let isProgrammaticChange = false;
    let w1, b1, w2, b2;
    
    function syncParamsFromSliders() {
        w1 = parseFloat(w1Slider.value);
        b1 = parseFloat(b1Slider.value);
        w2 = parseFloat(w2Slider.value);
        b2 = parseFloat(b2Slider.value);
    }
    function syncSlidersFromParams() {
        const restore = isProgrammaticChange;
        isProgrammaticChange = true;
        w1Slider.value = w1.toFixed(4);
        b1Slider.value = b1.toFixed(4);
        w2Slider.value = w2.toFixed(4);
        b2Slider.value = b2.toFixed(4);
        isProgrammaticChange = restore;
    }
    
    function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
    
    function computeState() {
        const target = parseFloat(targetSlider.value);
        const z1 = w1 * x_input + b1;
        const h1 = sigmoid(z1);
        const z2 = w2 * h1 + b2;
        const y  = sigmoid(z2);
        const loss = 0.5 * (y - target) * (y - target);
        
        // 反向传播
        const dLdy   = y - target;
        const dydz2  = y * (1 - y);
        const dLdz2  = dLdy * dydz2;
        const dLdw2  = dLdz2 * h1;
        const dLdb2  = dLdz2;
        const dz2dh1 = w2;
        const dLdh1  = dLdz2 * dz2dh1;
        const dh1dz1 = h1 * (1 - h1);
        const dLdz1  = dLdh1 * dh1dz1;
        const dLdw1  = dLdz1 * x_input;
        const dLdb1  = dLdz1;
        
        return {
            w1, b1, w2, b2, target,
            z1, h1, z2, y, loss,
            dLdy, dydz2, dLdz2,
            dLdw2, dLdb2, dz2dh1,
            dLdh1, dh1dz1, dLdz1,
            dLdw1, dLdb1
        };
    }
    
    function drawNode(cx, cy, r, color, value, label, labelYoffset = -34, valueFont, labelFont) {
        // 光晕
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
        glow.addColorStop(0, color + '40');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
        ctx.fill();
        // 节点
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15,23,42,0.95)';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // 值
        ctx.fillStyle = '#e2e8f0';
        ctx.font = valueFont || 'bold 13px "Cambria Math", "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, cx, cy);
        // 标签（公式用斜体衬线）
        ctx.fillStyle = '#cbd5e1';
        ctx.font = labelFont || 'italic bold 13px "Cambria Math", "Times New Roman", serif';
        ctx.fillText(label, cx, cy + labelYoffset);
    }
    
    function drawArrow(x0, y0, x1, y1, color, width) {
        // 通用箭头：从 (x0,y0) 画线段到 (x1,y1)，并在末端 (x1,y1) 画朝向目标方向的三角
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        // 计算箭头朝向（从 (x0,y0) → (x1,y1) 的方向向量）
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len;
        const ny = dy / len;
        const size = Math.max(6, width * 1.6);
        // 垂直于箭头方向的单位向量
        const px = -ny;
        const py = nx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - nx * size + px * size * 0.5, y1 - ny * size + py * size * 0.5);
        ctx.lineTo(x1 - nx * size - px * size * 0.5, y1 - ny * size - py * size * 0.5);
        ctx.closePath();
        ctx.fill();
    }
    
    function draw() {
        const W = canvas.width;   // 840
        const H = canvas.height;  // 640
        ctx.clearRect(0, 0, W, H);

        const s = computeState();
        const lr = parseFloat(lrSlider.value);

        // ========== 字体体系：5 类字形各管各的（LaTeX 严格分工） ==========
        //  所有 upright 字体【显式】加 normal 关键字，防止从上下文继承 italic 状态
        const MF = `"Cambria Math", "Times New Roman", Georgia, serif`;
        const CF = `"Microsoft YaHei", "PingFang SC", sans-serif`;
        // 类别：V 变量(italic) / D 微分∂(upright) / O 算子= / +(upright) / S 下标 ₁₂(upright) / N 数字(upright) / C 中文
        // 连线权重 14px 组 (w₁, w₂)
        const F14V = `italic bold 14px ${MF}`;      // 变量字母 italic
        const F14D = `normal bold 14px ${MF}`;      // ∂, /, =  upright（显式 normal）
        const F14S = `normal bold 14px ${MF}`;      // 下标 ₁ ₂ upright（显式 normal）
        const F14N = `normal bold 14px ${MF}`;      // 数值 upright（显式 normal）
        // 偏置/预激活 14px 组 (b₁, z₁)
        const F14BV = F14V; const F14BD = F14D; const F14BS = F14S; const F14BN = F14N;
        // 梯度 13px 组 (∂L/∂y, ∂L/∂w₁)
        const F13V = `italic bold 13px ${MF}`;
        const F13D = `normal bold 13px ${MF}`;      // ∂ upright（显式 normal）
        const F13S = `normal bold 13px ${MF}`;      // 下标 ₁₂ upright（显式 normal）
        const F13O = `normal bold 13px ${MF}`;      // /, =  upright（显式 normal）
        const F13N = `normal bold 13px ${MF}`;      // 数值 upright（显式 normal）
        // 节点标签 13px 组
        const F13V_NL = `italic bold 13px ${MF}`;
        const F13D_NL = `normal bold 13px ${MF}`;
        const F13S_NL = `normal bold 13px ${MF}`;
        const F13N_NL = `normal bold 13px ${MF}`;
        // 节点内部值 / Loss
        const F13N_NV = `normal bold 13px ${MF}`;
        const F12N_LV = `normal bold 12px ${MF}`;
        const F12C_LT = `normal bold 12px ${CF}`;
        // 中文辅助
        const F12C_GT = `normal bold 12px ${CF}`;   // 梯度分组标题
        const F13C_LY = `normal bold 13px ${CF}`;   // 层标题
        const F15C_TA = `normal bold 15px ${CF}`;   // 「目标」
        const F16V_TA = `italic bold 16px ${MF}`;   // y* 斜体
        const F16D_TA = `normal bold 16px ${MF}`;   // =, 数值 正体（显式 normal）
        const F16S_TA = `normal bold 16px ${MF}`;   // y* 里的 * 或下标（显式 normal）
        // 右侧曲线
        const F14C_RT = `normal 14px ${CF}`;
        const F13V_RL = `italic bold 13px ${MF}`;
        const F13D_RL = `normal bold 13px ${MF}`;   // y* 里的 * 正体，= 正体（显式 normal）
        const F13S_RL = `normal bold 13px ${MF}`;   // 下标（显式 normal）
        const F13N_RL = `normal bold 13px ${MF}`;   // 数值（显式 normal）
        const F13C_RL = `normal 13px ${CF}`;

        // ========== 坐标体系 ==========
        const splitX    = 490;
        const NX = { x: 90, h1: 250, y: 410, loss: 410 };
        const NY = { main: 236, loss: 570 };
        const MAIN_R = 30;
        const LOSS_R = 28;
        const NODE_TOP = NY.main - MAIN_R;
        const NODE_BOT = NY.main + MAIN_R;
        const LOSS_TOP = NY.loss - LOSS_R;
        const LOSS_BOT = NY.loss + LOSS_R;

        // ---------- 段渲染器：segments 数组按顺序画，自动累加宽度 ----------
        // 每个 segment: { text, font, color }
        const segmentsWidth = (segs) => {
            let w = 0;
            for (const sg of segs) { ctx.font = sg.font; w += ctx.measureText(sg.text).width; }
            return w;
        };
        const renderSegsLeft = (segs, x, y, baseline='top') => {
            ctx.textAlign = 'left';
            ctx.textBaseline = baseline;
            let cx = x;
            for (const sg of segs) {
                ctx.font = sg.font;
                ctx.fillStyle = sg.color;
                ctx.fillText(sg.text, cx, y);
                cx += ctx.measureText(sg.text).width;
            }
            return cx - x;   // 返回总宽
        };
        const renderSegsCenter = (segs, cx, y, baseline='bottom', yOffset=0) => {
            const totalW = segmentsWidth(segs);
            const sx = cx - totalW / 2;
            const py = y + yOffset;
            return renderSegsLeft(segs, sx, py, baseline);
        };
        // 快捷：给「带下标变量 + 等号」 输出 segments（例：w₁ = 、b₂ = 、z₁ = ）
        const subEqSegs = (varCh, subCh, colVar, colSub, colEq, fV, fS, fD) => [
            { text: varCh,              font: fV, color: colVar },
            { text: String.fromCharCode(0x2080 + parseInt(subCh, 10)), font: fS, color: colSub },
            { text: ' = ',              font: fD, color: colEq }
        ];
        // 快捷：给「∂L/∂X 下标 + =」输出 segments（例：∂L/∂z₂ = ）
        const dLdSegs = (varCh, subCh, colVar, colSub) => {
            const subs = subCh ? [ { text: String.fromCharCode(0x2080 + parseInt(subCh, 10)), font: F13S, color: colSub } ] : [];
            return [
                { text: '∂', font: F13D, color: colVar },
                { text: 'L', font: F13V, color: colVar },
                { text: '/', font: F13O, color: colVar },
                { text: '∂', font: F13D, color: colVar },
                { text: varCh, font: F13V, color: colVar },
                ...subs,
                { text: ' = ', font: F13O, color: colVar }
            ];
        };
        const colGold   = 'rgba(251,191,36,0.99)';
        const colOrange = 'rgba(251,146,60,0.96)';
        const colBias   = 'rgba(245,158,11,0.98)';
        const colZ      = 'rgba(100,116,139,0.96)';
        const colIndigo = 'rgba(99,102,241,0.98)';
        const colPurple = 'rgba(168,85,247,0.98)';
        const colSlate  = '#cbd5e1';
        const colGray   = 'rgba(148,163,184,0.92)';

        // ==================== 1. 顶部独立区 ====================
        // (1a) 目标  y* = 1.00  |  5 段：中文 → y(italic) → *(upright) →  = (upright) → 数值(upright)
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(251,191,36,0.98)';
        ctx.font = F15C_TA;
        ctx.textAlign = 'left';
        ctx.fillText('目标', 24, 22);
        // 后续 y* = 1.00 分 5 段
        const targetSegs = [
            { text: 'y',    font: F16V_TA, color: 'rgba(251,191,36,0.98)' },
            { text: '*',    font: F16S_TA, color: 'rgba(251,191,36,0.98)' },
            { text: ' = ',  font: F16D_TA, color: 'rgba(251,191,36,0.98)' },
            { text: s.target.toFixed(2), font: F16D_TA, color: 'rgba(251,191,36,0.98)' }
        ];
        renderSegsLeft(targetSegs, 24 + 44, 20, 'top');

        // (1b) 层标题：输入层/隐藏层/输出层 y=64（中文，保持雅黑 bold）
        ctx.fillStyle = 'rgba(148,163,184,0.94)';
        ctx.font = F13C_LY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('输入层', NX.x,  64);
        ctx.fillText('隐藏层', NX.h1, 64);
        ctx.fillText('输出层', NX.y,  64);

        // ==================== 2. ∂L/∂z₂ 反向箭头 y=122（文本离箭头再 +4px，共 14px 间距） ====================
        const AXh1yY = 122;
        const colw2 = `rgba(251,146,60,${Math.min(0.96, Math.abs(s.dLdz2) * 4 + 0.32)})`;
        drawArrow(NX.y - MAIN_R - 8, AXh1yY, NX.h1 + MAIN_R + 8, AXh1yY, colw2,
            Math.max(1.9, Math.min(4.6, Math.abs(s.dLdz2) * 3.9)));
        // ∂L/∂z₂ = -0.0312 : ∂D / LV / /O / ∂D / zV + ₂S / =O  → NUM 13N
        const dz2Segs = [
            ...dLdSegs('z', '2', colGold, colGold),
            { text: s.dLdz2.toFixed(4), font: F13N, color: colGold }
        ];
        renderSegsCenter(dz2Segs, (NX.y + NX.h1) / 2, AXh1yY, 'top', 14);   // 文本离箭头 14px（原10）

        // ==================== 3. 节点上方公式标签 y=182 ====================
        const NODE_LABEL_Y = NY.main - 54;
        // x = 1.0: x(V) + =(D) + 1.0(N)
        const xLabelSegs = [
            { text: 'x',     font: F13V_NL, color: colSlate },
            { text: ' = ',   font: F13D_NL, color: colSlate },
            { text: x_input.toFixed(1), font: F13N_NL, color: colSlate }
        ];
        renderSegsCenter(xLabelSegs, NX.x, NODE_LABEL_Y, 'bottom');
        // h₁ = σ(z₁) : h(V) + ₁(S) + =(D) + σ(D) + (() + z(V) + ₁(S) + ))
        const h1LabelSegs = [
            { text: 'h',     font: F13V_NL, color: colSlate },
            { text: '₁',     font: F13S_NL, color: colSlate },
            { text: ' = σ(', font: F13D_NL, color: colSlate },
            { text: 'z',     font: F13V_NL, color: colSlate },
            { text: '₁)',    font: F13S_NL, color: colSlate }  // 「)」跟 ₁ 一组 upright 没问题
        ];
        renderSegsCenter(h1LabelSegs, NX.h1, NODE_LABEL_Y, 'bottom');
        // y = σ(z₂)
        const yLabelSegs = [
            { text: 'y',     font: F13V_NL, color: colSlate },
            { text: ' = σ(', font: F13D_NL, color: colSlate },
            { text: 'z',     font: F13V_NL, color: colSlate },
            { text: '₂)',    font: F13S_NL, color: colSlate }
        ];
        renderSegsCenter(yLabelSegs, NX.y, NODE_LABEL_Y, 'bottom');
        // Loss 中文标签
        ctx.font = F12C_LT;
        ctx.fillStyle = '#fda4af';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('损失函数', NX.loss, NY.loss - LOSS_R - 10);

        // ==================== 4. 连线 + 权重 w₁, w₂ 连线上方 y=200 ====================
        // x → h1
        ctx.strokeStyle = 'rgba(99,102,241,0.78)';
        ctx.lineWidth = Math.max(2.6, Math.min(6.5, Math.abs(s.w1) * 1.7));
        ctx.beginPath();
        ctx.moveTo(NX.x + MAIN_R, NY.main);
        ctx.lineTo(NX.h1 - MAIN_R, NY.main);
        ctx.stroke();
        const w1Segs = [
            ...subEqSegs('w', '1', colIndigo, colIndigo, colIndigo, F14V, F14S, F14D),
            { text: s.w1.toFixed(2), font: F14N, color: colIndigo }
        ];
        renderSegsCenter(w1Segs, (NX.x + NX.h1) / 2, NODE_TOP, 'bottom', -6);

        // h1 → y
        ctx.strokeStyle = 'rgba(168,85,247,0.78)';
        ctx.lineWidth = Math.max(2.6, Math.min(6.5, Math.abs(s.w2) * 1.7));
        ctx.beginPath();
        ctx.moveTo(NX.h1 + MAIN_R, NY.main);
        ctx.lineTo(NX.y - MAIN_R, NY.main);
        ctx.stroke();
        const w2Segs = [
            ...subEqSegs('w', '2', colPurple, colPurple, colPurple, F14V, F14S, F14D),
            { text: s.w2.toFixed(2), font: F14N, color: colPurple }
        ];
        renderSegsCenter(w2Segs, (NX.h1 + NX.y) / 2, NODE_TOP, 'bottom', -6);

        // y → Loss（虚线 X=410）
        ctx.strokeStyle = 'rgba(236,72,153,0.52)';
        ctx.lineWidth = 1.9;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(NX.y, NODE_BOT);
        ctx.lineTo(NX.loss, LOSS_TOP);
        ctx.stroke();
        ctx.setLineDash([]);

        // ==================== 5. 节点（内部值 upright 数字） ====================
        drawNode(NX.x,   NY.main, MAIN_R, '#6366f1', x_input.toFixed(1), '', -54, F13N_NV, F13V_NL);
        drawNode(NX.h1,  NY.main, MAIN_R, '#8b5cf6', s.h1.toFixed(3),    '', -54, F13N_NV, F13V_NL);
        drawNode(NX.y,   NY.main, MAIN_R, '#a855f7', s.y.toFixed(3),     '', -54, F13N_NV, F13V_NL);
        drawNode(NX.loss, NY.loss, LOSS_R, '#ec4899', `L=${s.loss.toFixed(3)}`, '', -10, F12N_LV, F12C_LT);

        // ==================== 6. 节点下方属性区：b 行 y=296, z 行 y=326 =======================================
        const BIAS_ROW_Y = NODE_BOT + 30;
        const Z_ROW_Y    = NODE_BOT + 60;
        // h1: 中心 250 → 属性起点 178
        const h1AttrX = NX.h1 - 72;
        const b1Segs = [
            ...subEqSegs('b', '1', colBias, colBias, colBias, F14BV, F14BS, F14BD),
            { text: s.b1.toFixed(2), font: F14BN, color: colBias }
        ];
        renderSegsLeft(b1Segs, h1AttrX, BIAS_ROW_Y, 'top');
        const z1Segs = [
            ...subEqSegs('z', '1', colZ, colZ, colZ, F14BV, F14BS, F14BD),
            { text: s.z1.toFixed(2), font: F14BN, color: colZ }
        ];
        renderSegsLeft(z1Segs, h1AttrX, Z_ROW_Y, 'top');
        // y: 中心 410 → 起点 310（尾端 ≤ 406，避开虚线）
        const yAttrX = NX.y - 100;
        const b2Segs = [
            ...subEqSegs('b', '2', colBias, colBias, colBias, F14BV, F14BS, F14BD),
            { text: s.b2.toFixed(2), font: F14BN, color: colBias }
        ];
        renderSegsLeft(b2Segs, yAttrX, BIAS_ROW_Y, 'top');
        const z2Segs = [
            ...subEqSegs('z', '2', colZ, colZ, colZ, F14BV, F14BS, F14BD),
            { text: s.z2.toFixed(2), font: F14BN, color: colZ }
        ];
        renderSegsLeft(z2Segs, yAttrX, Z_ROW_Y, 'top');

        // ==================== 7. 梯度流动下半（所有间距 +12px） =======================================
        // (7a) ∂L/∂z₁ 反向箭头 y = Z_ROW_Y + 42 = 368（文本离箭头再 +4px，共 14px 间距）
        const AXxh1Y = Z_ROW_Y + 42;
        const colw1 = `rgba(251,146,60,${Math.min(0.96, Math.abs(s.dLdz1) * 4 + 0.32)})`;
        drawArrow(NX.h1 - MAIN_R - 8, AXxh1Y, NX.x + MAIN_R + 8, AXxh1Y, colw1,
            Math.max(1.9, Math.min(4.6, Math.abs(s.dLdz1) * 3.9)));
        const dz1Segs = [
            ...dLdSegs('z', '1', colOrange, colOrange),
            { text: s.dLdz1.toFixed(4), font: F13N, color: colOrange }
        ];
        renderSegsCenter(dz1Segs, (NX.h1 + NX.x) / 2, AXxh1Y, 'top', 14);  // 文本离箭头 14px（原10）

        const GRAD_GAP = 32;  // 梯度行间距再 +4（原 28→32）
        // (7b) 输出层参数梯度  outGradY = AXxh1Y + 84（原 68 + 16，再下推 16px）
        const outGradX = NX.h1 - 108;
        const outGradY = AXxh1Y + 84;
        ctx.fillStyle = colGray;
        ctx.font = F12C_GT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('→ 输出层参数梯度（接 z₂）', outGradX, outGradY - 24);
        const dw2Segs = [
            ...dLdSegs('w', '2', colOrange, colOrange),
            { text: s.dLdw2.toFixed(4), font: F13N, color: colOrange }
        ];
        renderSegsLeft(dw2Segs, outGradX, outGradY, 'top');
        const db2Segs = [
            ...dLdSegs('b', '2', colGold, colGold),
            { text: s.dLdb2.toFixed(4), font: F13N, color: colGold }
        ];
        renderSegsLeft(db2Segs, outGradX, outGradY + GRAD_GAP, 'top');

        // (7c) 隐藏层参数梯度  hidGradY = outGradY + GRAD_GAP + 80（原 +64 + 16，再下推 16px）
        const hidGradX = NX.x - 30;
        const hidGradY = outGradY + GRAD_GAP + 80;
        ctx.fillStyle = colGray;
        ctx.font = F12C_GT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('→ 隐藏层参数梯度（误差由 w₂ 传递）', hidGradX, hidGradY - 24);
        const dw1Segs = [
            ...dLdSegs('w', '1', colOrange, colOrange),
            { text: s.dLdw1.toFixed(4), font: F13N, color: colOrange }
        ];
        renderSegsLeft(dw1Segs, hidGradX, hidGradY, 'top');
        const db1Segs = [
            ...dLdSegs('b', '1', colGold, colGold),
            { text: s.dLdb1.toFixed(4), font: F13N, color: colGold }
        ];
        renderSegsLeft(db1Segs, hidGradX, hidGradY + GRAD_GAP, 'top');

        // (7d) ∂L/∂y 竖线  X = NX.y + 64 = 474（原 +48 + 16，再往虚线反方向推 16，虚线在 410，间距 64px）
        const AXyRight = NX.y + 64;
        drawArrow(AXyRight, LOSS_TOP, AXyRight, NODE_BOT, 'rgba(251,146,60,0.94)',
            Math.max(1.9, Math.min(4.6, Math.abs(s.dLdy) * 3.9)));
        // 文字在箭头 LEFT（与竖线间距 18px，原 10 + 8，避免 ∂L/∂ 前缀与竖线/虚线重叠）
        const dLdySegs = [
            ...dLdSegs('y', null, colGold, colGold),
            { text: s.dLdy.toFixed(3), font: F13N, color: colGold }
        ];
        const dLdyW = segmentsWidth(dLdySegs);
        renderSegsLeft(dLdySegs, AXyRight - 18 - dLdyW, (LOSS_TOP + NODE_BOT) / 2, 'middle');

        // ==================== 8. 右侧独立曲线区（splitX=490） ====================
        const curveLeft  = splitX + 24;
        const curveRight = W - 22;
        const curveW     = curveRight - curveLeft;
        // (8a) 上半损失 y=20~308
        const lossTop = 20;
        const lossBottom = H / 2 - 12;
        const lossH = lossBottom - lossTop;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(curveLeft, lossTop, curveW, lossH);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = F14C_RT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('损失 L 随训练步数下降', (curveLeft + curveRight) / 2, lossTop - 4);
        if (lossHistory.length > 1) {
            const maxL = Math.max(...lossHistory, 0.08);
            ctx.strokeStyle = 'rgba(236,72,153,0.94)';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            for (let i = 0; i < lossHistory.length; i++) {
                const px = curveLeft + (i / Math.max(lossHistory.length - 1, 1)) * curveW;
                const py = lossBottom - (lossHistory[i] / maxL) * lossH;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
        // (8b) 下半 y 逼近 y*  y=332~620
        const predTop = H / 2 + 12;
        const predBottom = H - 20;
        const predH = predBottom - predTop;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(curveLeft, predTop, curveW, predH);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = F14C_RT;
        ctx.textBaseline = 'bottom';
        ctx.fillText(`输出 y 逼近目标 y*`, (curveLeft + curveRight) / 2, predTop - 4);

        // y* 虚线 + 标签：y(V) + *(S/D) + =(D) + 数值(N) + 「  ← 目标」(C)
        const yStarPY = predBottom - s.target * predH;
        ctx.strokeStyle = 'rgba(251,191,36,0.76)';
        ctx.lineWidth = 1.9;
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.moveTo(curveLeft, yStarPY);
        ctx.lineTo(curveRight, yStarPY);
        ctx.stroke();
        ctx.setLineDash([]);
        const yStarBase = s.target < 0.5 ? 'bottom' : 'top';
        const yStarLabelY = s.target < 0.5 ? (yStarPY - 8) : (yStarPY + 8);
        const yStarSegs = [
            { text: 'y',   font: F13V_RL, color: 'rgba(251,191,36,0.99)' },
            { text: '*',   font: F13S_RL, color: 'rgba(251,191,36,0.99)' },
            { text: ' = ', font: F13D_RL, color: 'rgba(251,191,36,0.99)' },
            { text: s.target.toFixed(2), font: F13N_RL, color: 'rgba(251,191,36,0.99)' }
        ];
        const ysW = renderSegsLeft(yStarSegs, curveLeft + 10, yStarLabelY, yStarBase);
        ctx.font = F13C_RL;
        ctx.fillStyle = 'rgba(226,232,240,0.8)';
        ctx.textAlign = 'left';
        ctx.textBaseline = yStarBase;
        ctx.fillText('  ← 目标', curveLeft + 10 + ysW, yStarLabelY);

        // 当前 y 点 + 标签（标签两行排版，避免超出画布右缘）
        const yCurX = curveLeft + curveW * 0.70;
        const yCurPY = predBottom - Math.max(0, Math.min(1, s.y)) * predH;
        ctx.beginPath();
        ctx.arc(yCurX, yCurPY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168,85,247,0.96)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 智能定位
        let yCurLabelY, yCurBaseline;
        const forceBelow = (yCurPY - predTop) < (predH * 0.30);
        if (forceBelow || (Math.abs(s.y - s.target) <= 0.12 && s.y <= s.target)) {
            yCurLabelY = yCurPY + 22;  yCurBaseline = 'top';
        } else if (Math.abs(s.y - s.target) > 0.12) {
            yCurLabelY = yCurPY;       yCurBaseline = 'middle';
        } else {
            yCurLabelY = yCurPY - 22;  yCurBaseline = 'bottom';
        }
        const labelTopY = (yCurBaseline === 'top') ? yCurLabelY
            : (yCurBaseline === 'middle') ? yCurLabelY - 9 : yCurLabelY - 18;
        if (labelTopY < predTop + 28) {
            yCurLabelY = yCurPY + 24;
            yCurBaseline = 'top';
        }
        // y(V) + =(D) + 数值(N) + 「（当前预测）」(C)
        const yCurSegs = [
            { text: 'y',   font: F13V_RL, color: 'rgba(226,232,240,0.97)' },
            { text: ' = ', font: F13D_RL, color: 'rgba(226,232,240,0.97)' },
            { text: s.y.toFixed(2), font: F13N_RL, color: 'rgba(226,232,240,0.97)' }
        ];
        renderSegsLeft(yCurSegs, yCurX + 12, yCurLabelY, yCurBaseline);
        // 说明文字另起一行（画布右缘内收）
        ctx.font = F13C_RL;
        ctx.fillStyle = 'rgba(203,213,225,0.82)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('（当前预测）', yCurX + 12, labelTopY + 18);

        // ==================== 信息面板 ====================
        lrValueEl.textContent = lr.toFixed(2);
        targetValueEl.textContent = s.target.toFixed(2);
        w1ValueEl.textContent = s.w1.toFixed(2);
        b1ValueEl.textContent = s.b1.toFixed(2);
        w2ValueEl.textContent = s.w2.toFixed(2);
        b2ValueEl.textContent = s.b2.toFixed(2);
        lossEl.textContent = s.loss.toFixed(6);
        gradYEl.textContent = s.dLdy.toFixed(5);
        gradOutEl.textContent = `w₂: ${s.dLdw2.toFixed(4)}  /  b₂: ${s.dLdb2.toFixed(4)}`;
        gradHidEl.textContent = `w₁: ${s.dLdw1.toFixed(4)}  /  b₁: ${s.dLdb1.toFixed(4)}`;
        weightEl.textContent = `(w₁=${s.w1.toFixed(2)}, b₁=${s.b1.toFixed(2)}, w₂=${s.w2.toFixed(2)}, b₂=${s.b2.toFixed(2)})`;
        stepCountEl.textContent = stepCount;

        // ==================== 底部公式 overlay ====================
        const overlay = document.getElementById('bpFormulaOverlay');
        if (overlay) {
            overlay.innerHTML =
                '<div style="margin-bottom:4px;"><b>① 前向传播：</b>' +
                '$z_1=w_1 x + b_1=' + s.w1.toFixed(2) + '\\times' + x_input.toFixed(1) + (s.b1>=0?'+':'') + s.b1.toFixed(2) + '=' + s.z1.toFixed(3) +
                '$, $h_1=\\sigma(z_1)=' + s.h1.toFixed(3) + '$；' +
                '$z_2=w_2 h_1 + b_2=' + s.w2.toFixed(2) + '\\times' + s.h1.toFixed(2) + (s.b2>=0?'+':'') + s.b2.toFixed(2) + '=' + s.z2.toFixed(3) +
                '$, $y=\\sigma(z_2)=' + s.y.toFixed(3) + '$</div>' +
                '<div style="margin-bottom:4px;"><b>② 反向传播（输出层 → 隐藏层）：</b>' +
                '$\\frac{\\partial L}{\\partial y}=y-y^*=' + s.dLdy.toFixed(3) + '$, ' +
                '$\\frac{\\partial L}{\\partial z_2}=\\frac{\\partial L}{\\partial y}\\cdot\\sigma\'(z_2)=' + s.dLdy.toFixed(3) + '\\times' + s.dydz2.toFixed(3) + '=' + s.dLdz2.toFixed(4) + '$, ' +
                '$\\frac{\\partial L}{\\partial w_2}=\\frac{\\partial L}{\\partial z_2}\\cdot h_1=' + s.dLdw2.toFixed(4) + '$, ' +
                '$\\frac{\\partial L}{\\partial b_2}=\\frac{\\partial L}{\\partial z_2}=' + s.dLdb2.toFixed(4) + '$</div>' +
                '<div style="margin-bottom:4px;"><b>③ 反向传播（隐藏层 → 输入层，关键：跨层传递误差）：</b>' +
                '$\\frac{\\partial L}{\\partial h_1}=\\frac{\\partial L}{\\partial z_2}\\cdot w_2=' + s.dLdz2.toFixed(4) + '\\times' + s.w2.toFixed(2) + '=' + s.dLdh1.toFixed(4) + '$, ' +
                '$\\frac{\\partial L}{\\partial z_1}=\\frac{\\partial L}{\\partial h_1}\\cdot\\sigma\'(z_1)=' + s.dLdh1.toFixed(4) + '\\times' + s.dh1dz1.toFixed(3) + '=' + s.dLdz1.toFixed(4) + '$, ' +
                '$\\frac{\\partial L}{\\partial w_1}=\\frac{\\partial L}{\\partial z_1}\\cdot x=' + s.dLdw1.toFixed(4) + '$, ' +
                '$\\frac{\\partial L}{\\partial b_1}=\\frac{\\partial L}{\\partial z_1}=' + s.dLdb1.toFixed(4) + '$</div>' +
                '<div style="margin-top:4px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08);"><b>④ 参数更新（SGD，完整展开梯度项）：</b>' +
                '$\\displaystyle w_1 \\leftarrow w_1 - \\eta \\cdot \\frac{\\partial L}{\\partial w_1} = ' + s.w1.toFixed(2) + ' - ' + lr.toFixed(2) + ' \\times ' + s.dLdw1.toFixed(4) + '$，&nbsp;&nbsp;' +
                '$\\displaystyle b_1 \\leftarrow b_1 - \\eta \\cdot \\frac{\\partial L}{\\partial b_1} = ' + s.b1.toFixed(2) + ' - ' + lr.toFixed(2) + ' \\times ' + s.dLdb1.toFixed(4) + '$，<br>' +
                '$\\displaystyle w_2 \\leftarrow w_2 - \\eta \\cdot \\frac{\\partial L}{\\partial w_2} = ' + s.w2.toFixed(2) + ' - ' + lr.toFixed(2) + ' \\times ' + s.dLdw2.toFixed(4) + '$，&nbsp;&nbsp;' +
                '$\\displaystyle b_2 \\leftarrow b_2 - \\eta \\cdot \\frac{\\partial L}{\\partial b_2} = ' + s.b2.toFixed(2) + ' - ' + lr.toFixed(2) + ' \\times ' + s.dLdb2.toFixed(4) + '$</div>';
            typesetMath([overlay]);
        }
    }
    
    function trainStep() {
        const lr = parseFloat(lrSlider.value);
        const s = computeState();
        // 直接更新本地变量（主状态），同步到滑块仅做显示（受标志位保护，不触发清空历史）
        w1 -= lr * s.dLdw1;
        b1 -= lr * s.dLdb1;
        w2 -= lr * s.dLdw2;
        b2 -= lr * s.dLdb2;
        syncSlidersFromParams();
        stepCount++;
        lossHistory.push(s.loss);
        if (lossHistory.length > 300) lossHistory.shift();
    }
    
    trainBtn.addEventListener('click', () => { trainStep(); draw(); });
    train50Btn.addEventListener('click', () => {
        for (let i = 0; i < 50; i++) trainStep();
        draw();
    });
    
    resetBtn.addEventListener('click', () => {
        // 直接重置到初始默认值
        w1 = 1.5; b1 = 0.0; w2 = 2.0; b2 = 0.0;
        syncSlidersFromParams();
        stepCount = 0;
        lossHistory = [];
        const s = computeState();
        lossHistory.push(s.loss);
        draw();
    });
    
    lrSlider.addEventListener('input', draw);
    targetSlider.addEventListener('input', () => {
        if (isProgrammaticChange) { draw(); return; }
        stepCount = 0; lossHistory = [];
        const s = computeState(); lossHistory.push(s.loss); draw();
    });
    w1Slider.addEventListener('input', () => {
        if (isProgrammaticChange) { draw(); return; }
        syncParamsFromSliders();
        stepCount = 0; lossHistory = [];
        const s = computeState(); lossHistory.push(s.loss); draw();
    });
    b1Slider.addEventListener('input', () => {
        if (isProgrammaticChange) { draw(); return; }
        syncParamsFromSliders();
        stepCount = 0; lossHistory = [];
        const s = computeState(); lossHistory.push(s.loss); draw();
    });
    w2Slider.addEventListener('input', () => {
        if (isProgrammaticChange) { draw(); return; }
        syncParamsFromSliders();
        stepCount = 0; lossHistory = [];
        const s = computeState(); lossHistory.push(s.loss); draw();
    });
    b2Slider.addEventListener('input', () => {
        if (isProgrammaticChange) { draw(); return; }
        syncParamsFromSliders();
        stepCount = 0; lossHistory = [];
        const s = computeState(); lossHistory.push(s.loss); draw();
    });
    
    syncParamsFromSliders();
    const initS = computeState();
    lossHistory.push(initS.loss);
    draw();
}

// ============================================================
// 实验6: CNN 卷积神经网络可视化
// ============================================================
function initCNN() {
    const canvas = document.getElementById('cnnCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const inputSel    = document.getElementById('cnnInputSelect');
    const kernelSel   = document.getElementById('cnnKernelSelect');
    const kernelSizeS = document.getElementById('cnnKernelSize');
    const strideSld   = document.getElementById('cnnStrideSlider');
    const strideVal   = document.getElementById('cnnStrideValue');
    const padSel      = document.getElementById('cnnPadSelect');
    const playBtn     = document.getElementById('cnnPlayBtn');
    const resetBtn    = document.getElementById('cnnResetBtn');
    const kernelDisp  = document.getElementById('cnnKernelDisplay');
    const outSizeEl   = document.getElementById('cnnOutputSize');
    const kernelInfoLbl = document.getElementById('cnnKernelLabel');

    const N = 10;                   // 输入图像尺寸 N×N
    const kernelNames = {
        edge:    'Laplacian 边缘检测',
        sobelX:  'Sobel-X (垂直边缘)',
        sobelY:  'Sobel-Y (水平边缘)',
        blur:    '高斯模糊 (归一化)',
        sharpen: '锐化核',
        emboss:  '浮雕核'
    };

    // 根据类型 + 尺寸 K（奇数）生成 K×K 卷积核
    function makeKernel(type, K) {
        const half = (K - 1) / 2;
        const sigma = Math.max(0.6, K / 5.5);       // 高斯 sigma 随 K 自适应
        const k = Array.from({length: K}, () => Array(K).fill(0));
        let sum = 0;
        for (let i = 0; i < K; i++) {
            for (let j = 0; j < K; j++) {
                const x = j - half, y = i - half;
                switch (type) {
                    case 'blur': {
                        const v = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
                        k[i][j] = v; sum += v;
                        break;
                    }
                    case 'edge': {
                        // Laplacian of Gaussian 近似
                        const r2 = x * x + y * y;
                        const s2 = sigma * sigma;
                        const v = (r2 - 2 * s2) / (s2 * s2) * Math.exp(-r2 / (2 * s2));
                        k[i][j] = v;
                        break;
                    }
                    case 'sobelX': {
                        if (K === 3) {
                            k[i][j] = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]][i][j];
                        } else if (K === 5) {
                            k[i][j] = [[-1,-2,0,2,1],[-4,-8,0,8,4],[-6,-12,0,12,6],[-4,-8,0,8,4],[-1,-2,0,2,1]][i][j];
                        } else {
                            const d = x * x + y * y + 0.2;
                            k[i][j] = -x / d * (half + 1);
                        }
                        break;
                    }
                    case 'sobelY': {
                        if (K === 3) {
                            k[i][j] = [[-1,-2,-1],[0,0,0],[1,2,1]][i][j];
                        } else if (K === 5) {
                            k[i][j] = [[-1,-4,-6,-4,-1],[-2,-8,-12,-8,-2],[0,0,0,0,0],[2,8,12,8,2],[1,4,6,4,1]][i][j];
                        } else {
                            const d = x * x + y * y + 0.2;
                            k[i][j] = -y / d * (half + 1);
                        }
                        break;
                    }
                    case 'sharpen': {
                        // 1 在中心，周围 -1/8
                        k[i][j] = (i === half && j === half) ? 2 : (-1 / (K * K - 1));
                        break;
                    }
                    case 'emboss': {
                        // 从左上到右下的差值
                        k[i][j] = (x === 0 && y === 0) ? 1 : (x + y < 0 ? -1 : (x + y > 0 ? 1 : 0));
                        break;
                    }
                }
            }
        }
        // 对 blur 归一化，对 edge/sharpen 让中心为正
        if (type === 'blur' && sum > 0) {
            for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) k[i][j] /= sum;
        }
        return k;
    }

    // 生成输入图像
    function genInput(type) {
        const img = Array.from({length: N}, () => Array(N).fill(0));
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                let v = 0;
                switch (type) {
                    case 'checker':  v = ((i + j) % 2 === 0) ? 0.9 : 0.1; break;
                    case 'gradient': v = j / (N - 1); break;
                    case 'digit5': {
                        const d5 = [
                            [0,0,1,1,1,1,1,0,0,0],
                            [0,1,1,1,1,1,1,0,0,0],
                            [0,1,1,0,0,0,0,0,0,0],
                            [0,1,1,0,0,0,0,0,0,0],
                            [0,1,1,1,1,1,0,0,0,0],
                            [0,0,0,0,0,1,1,0,0,0],
                            [0,0,0,0,0,1,1,0,0,0],
                            [0,0,0,0,0,1,1,1,0,0],
                            [0,1,1,1,1,1,1,0,0,0],
                            [0,1,1,1,1,1,0,0,0,0]
                        ];
                        v = d5[i][j];
                        break;
                    }
                    case 'cross':  v = (i === Math.floor(N/2) || j === Math.floor(N/2)) ? 0.9 : 0.1; break;
                    case 'diag':   v = ((i + j) % 3 === 0) ? 0.9 : 0.1; break;
                    case 'random': v = Math.random(); break;
                }
                img[i][j] = v;
            }
        }
        return img;
    }

    // 卷积运算（支持任意 K×K 核）
    function conv2d(img, kernel, stride, pad) {
        const K = kernel.length;
        const padded = pad > 0
            ? Array.from({length: N + 2*pad}, (_, i) =>
                Array.from({length: N + 2*pad}, (_, j) => {
                    const r = i - pad, c = j - pad;
                    return (r >= 0 && r < N && c >= 0 && c < N) ? img[r][c] : 0;
                }))
            : img;
        const outN = Math.floor((padded.length - K) / stride) + 1;
        const out = Array.from({length: Math.max(1, outN)}, () => Array(Math.max(1, outN)).fill(0));
        const O = out.length;
        for (let i = 0; i < O; i++) {
            for (let j = 0; j < O; j++) {
                let sum = 0;
                for (let m = 0; m < K; m++) {
                    for (let n = 0; n < K; n++) {
                        sum += padded[i*stride + m][j*stride + n] * kernel[m][n];
                    }
                }
                out[i][j] = sum;
            }
        }
        return out;
    }

    // 绘制矩阵
    function drawMatrix(data, x0, y0, cellSize, label, color, valueFmt) {
        const rows = data.length;
        const cols = data[0].length;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, x0 + cols * cellSize / 2, y0 - 6);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const v = data[i][j];
                const alpha = Math.max(0, Math.min(1, Math.abs(v)));
                ctx.fillStyle = v >= 0
                    ? `rgba(99,102,241,${alpha * 0.85 + 0.05})`
                    : `rgba(236,72,153,${alpha * 0.85 + 0.05})`;
                ctx.fillRect(x0 + j * cellSize, y0 + i * cellSize, cellSize - 1, cellSize - 1);
                ctx.strokeStyle = 'rgba(255,255,255,0.12)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x0 + j * cellSize, y0 + i * cellSize, cellSize - 1, cellSize - 1);
                if (cellSize >= 24) {
                    ctx.fillStyle = '#e2e8f0';
                    ctx.font = `${Math.max(9, Math.floor(cellSize * 0.4))}px Consolas, monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(valueFmt ? valueFmt(v) : v.toFixed(2),
                        x0 + j * cellSize + cellSize/2 - 0.5,
                        y0 + i * cellSize + cellSize/2);
                }
            }
        }
        return { x: x0, y: y0, w: cols * cellSize, h: rows * cellSize, cellSize };
    }

    // 高亮扫描窗口（在输入图上）
    function drawScanWindow(imgRect, kernel, outPos, stride, pad) {
        const K = kernel.length;
        const { x: ix, y: iy, cellSize } = imgRect;
        const oi = outPos.i, oj = outPos.j;
        const sx = ix + (oj * stride - pad) * cellSize;
        const sy = iy + (oi * stride - pad) * cellSize;
        ctx.strokeStyle = 'rgba(251,191,36,0.95)';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx, sy, K * cellSize - 1, K * cellSize - 1);
        return { sx, sy, w: K * cellSize };
    }

    let scanPos = null;
    let animId = null;
    let playing = false;

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, W, H);

        const img      = genInput(inputSel.value);
        const K        = parseInt(kernelSizeS.value);
        const knName   = kernelNames[kernelSel.value];
        const kernel   = makeKernel(kernelSel.value, K);
        const stride   = parseInt(strideSld.value);
        const pad      = parseInt(padSel.value);
        const out      = conv2d(img, kernel, stride, pad);
        const outN     = out.length;

        // 单元大小：K=3 → cellK=34；K=5 → 26；K=7 → 20
        const cellIn  = 30;
        const cellK   = K === 3 ? 34 : (K === 5 ? 26 : 20);
        const cellOut = 30;

        // 动态布局（画布 860 × 480）：输入图固定左侧，特征图固定右侧，卷积核在两者间居中
        const inX  = 38,   inY  = 74;
        const inRight  = inX + N * cellIn;                          // 输入图右边界 = 338
        const outRight = W - 26;                                    // 特征图右边界 = 834（留 26px 边距）
        const outW     = outN * cellOut;
        const oX   = outRight - outW;                               // 特征图左边界（随 outN 自适应）
        const oY   = inY;
        // 卷积核在 inRight 与 oX 之间居中，并强制至少 30px 间距
        const gapBoth = Math.max(30, (oX - inRight - K * cellK) / 2);
        const kX   = inRight + gapBoth;
        const kY   = inY + Math.floor((N * cellIn - K * cellK) / 2);

        const inRect  = drawMatrix(img,    inX, inY, cellIn,  `输入图像 I (${N}×${N})`,          '#6366f1', v => v.toFixed(1));
        drawMatrix(kernel, kX,  kY, cellK, `卷积核 K (${K}×${K})`,                           '#8b5cf6', v => (Math.abs(v) < 0.005 ? '0' : v.toFixed(2)));
        drawMatrix(out,    oX,  oY, cellOut, `特征图 I*K (${outN}×${outN})`,                   '#ec4899', v => (Math.abs(v) < 0.005 ? '0' : v.toFixed(2)));

        // I → K → O 大弧线
        ctx.strokeStyle = 'rgba(139,92,246,0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(inX + 10 * cellIn, inY + 10 * cellIn / 2);
        ctx.quadraticCurveTo((inX + 10*cellIn + kX) / 2, inY + 10*cellIn + 30,
                             kX, kY + K * cellK / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(kX + K * cellK, kY + K * cellK / 2);
        ctx.quadraticCurveTo((kX + K*cellK + oX) / 2, oY + outN * cellOut + 30,
                             oX, oY + outN * cellOut / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 扫描窗口高亮
        if (scanPos && scanPos.i < outN && scanPos.j < outN) {
            const sw = drawScanWindow(inRect, kernel, scanPos, stride, pad);
            const ohi = scanPos.i, ohj = scanPos.j;
            ctx.strokeStyle = 'rgba(251,191,36,0.95)';
            ctx.lineWidth = 3;
            ctx.strokeRect(oX + ohj * cellOut, oY + ohi * cellOut, cellOut - 1, cellOut - 1);
            ctx.strokeStyle = 'rgba(251,191,36,0.45)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(sw.sx + sw.w, sw.sy + sw.w / 2);
            ctx.lineTo(oX + ohj * cellOut, oY + ohi * cellOut + cellOut / 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 底部三行说明
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#94a3b8';
        const bottomY = H - 102;
        ctx.fillText(`当前核: ${knName} (${K}×${K})`,                                         40, bottomY);
        ctx.fillText(`stride = ${stride},  padding = ${pad}`,                                 40, bottomY + 22);
        ctx.fillText(`输出尺寸: ((${N} + 2×${pad} - ${K}) / ${stride}) + 1 = ${outN}`,        40, bottomY + 44);

        // ==== 信息面板文字同步 ====
        strideVal.textContent = stride;
        let kStr = '';
        for (let i = 0; i < K; i++) {
            kStr += kernel[i].map(v => (Math.abs(v) < 0.005 ? '  0.00' : v.toFixed(2).padStart(6))).join('  ') + '<br>';
        }
        kernelDisp.innerHTML = `<span style="font-family:Consolas,monospace;color:#cbd5e1;">${kStr}</span>`;
        if (kernelInfoLbl) kernelInfoLbl.textContent = `卷积核 K (${K}×${K})`;
        outSizeEl.textContent = `${outN} × ${outN}`;
    }

    function playScan() {
        if (playing) return;
        playing = true;
        playBtn.textContent = '⏸ 暂停';
        const stride = parseInt(strideSld.value);
        const pad = parseInt(padSel.value);
        const K = parseInt(kernelSizeS.value);
        const out = conv2d(genInput(inputSel.value), makeKernel(kernelSel.value, K), stride, pad);
        const outN = out.length;
        let idx = 0;
        function step() {
            if (!playing) return;
            const i = Math.floor(idx / outN);
            const j = idx % outN;
            scanPos = { i, j };
            draw();
            idx++;
            if (idx >= outN * outN) {
                playing = false;
                playBtn.textContent = '▶ 动画扫描';
                animId = setTimeout(() => { scanPos = null; draw(); }, 800);
                return;
            }
            animId = setTimeout(step, 220);
        }
        step();
    }
    function pauseScan() {
        playing = false;
        playBtn.textContent = '▶ 动画扫描';
        if (animId) { clearTimeout(animId); animId = null; }
    }

    playBtn.addEventListener('click', () => { if (playing) pauseScan(); else playScan(); });
    resetBtn.addEventListener('click', () => { pauseScan(); scanPos = null; draw(); });
    [inputSel, kernelSel, kernelSizeS, padSel].forEach(el => {
        el.addEventListener('change', () => { pauseScan(); scanPos = null; draw(); });
    });
    strideSld.addEventListener('input', () => { pauseScan(); scanPos = null; draw(); });

    draw();
}

// ============================================================
// 实验7: RNN / LSTM / GRU 序列建模
// ============================================================
function initRNN() {
    const canvas = document.getElementById('rnnCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const typeSel  = document.getElementById('rnnTypeSelect');
    const hidSld   = document.getElementById('rnnHiddenSlider');
    const hidVal   = document.getElementById('rnnHiddenValue');
    const lrSld    = document.getElementById('rnnLrSlider');
    const lrVal    = document.getElementById('rnnLrValue');
    const seqSld   = document.getElementById('rnnSeqSlider');
    const seqVal   = document.getElementById('rnnSeqValue');
    const trainBtn = document.getElementById('rnnTrainBtn');
    const tr50Btn  = document.getElementById('rnnTrain50Btn');
    const autoBtn  = document.getElementById('rnnAutoBtn');
    const resetBtn = document.getElementById('rnnResetBtn');
    const statsEl  = document.getElementById('rnnStats');
    const gatesEl  = document.getElementById('rnnGates');

    let H = 8;
    let netType = 'lstm';
    let W_xh, W_hh, b_h, W_hy, b_y;
    // LSTM 额外参数
    let Wf, Wi, Wo, Wc, Uf, Ui, Uo, Uc, bf, bi, bo, bc;
    // GRU 额外参数
    let Wz, Wr, Uz, Ur, bz, br;

    function randn() { return (Math.random() * 2 - 1) * 0.5; }
    function reset() {
        H = parseInt(hidSld.value);
        netType = typeSel.value;
        W_xh = Array.from({length: H}, () => randn());
        W_hh = Array.from({length: H}, () => Array.from({length: H}, () => randn()));
        b_h  = Array.from({length: H}, () => randn() * 0.1);
        W_hy = Array.from({length: H}, () => randn());
        b_y  = randn() * 0.1;
        if (netType === 'lstm') {
            Wf = Array.from({length: H}, () => randn()); Uf = Array.from({length: H}, () => Array.from({length: H}, () => randn())); bf = Array.from({length: H}, () => randn() * 0.1);
            Wi = Array.from({length: H}, () => randn()); Ui = Array.from({length: H}, () => Array.from({length: H}, () => randn())); bi = Array.from({length: H}, () => randn() * 0.1);
            Wo = Array.from({length: H}, () => randn()); Uo = Array.from({length: H}, () => Array.from({length: H}, () => randn())); bo = Array.from({length: H}, () => randn() * 0.1);
            Wc = Array.from({length: H}, () => randn()); Uc = Array.from({length: H}, () => Array.from({length: H}, () => randn())); bc = Array.from({length: H}, () => randn() * 0.1);
        } else if (netType === 'gru') {
            Wz = Array.from({length: H}, () => randn()); Uz = Array.from({length: H}, () => Array.from({length: H}, () => randn())); bz = Array.from({length: H}, () => randn() * 0.1);
            Wr = Array.from({length: H}, () => randn()); Ur = Array.from({length: H}, () => Array.from({length: H}, () => randn())); br = Array.from({length: H}, () => randn() * 0.1);
        }
        stepCount = 0;
        lossHistory = [];
        lastGates = null;
    }

    function sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, x)))); }

    // 前向：输入 xs 数组，返回 { hs, ys, gates }
    function forward(xs) {
        const T = xs.length;
        const hs = [];           // 每个时间步的隐状态
        const ys = [];           // 每个时间步的输出
        const gateLog = [];      // LSTM 门状态记录
        let h = Array(H).fill(0);
        let c = Array(H).fill(0);  // cell state (LSTM)
        for (let t = 0; t < T; t++) {
            const x = xs[t];
            const hNew = Array(H).fill(0);
            let gates = {};
            if (netType === 'rnn') {
                for (let i = 0; i < H; i++) {
                    let z = W_xh[i] * x + b_h[i];
                    for (let j = 0; j < H; j++) z += W_hh[i][j] * h[j];
                    hNew[i] = Math.tanh(z);
                }
            } else if (netType === 'lstm') {
                const f = Array(H), inp = Array(H), o = Array(H), cTilde = Array(H);
                for (let i = 0; i < H; i++) {
                    let zf = Wf[i] * x + bf[i]; for (let j = 0; j < H; j++) zf += Uf[i][j] * h[j];
                    f[i] = sigmoid(zf);
                    let zi = Wi[i] * x + bi[i]; for (let j = 0; j < H; j++) zi += Ui[i][j] * h[j];
                    inp[i] = sigmoid(zi);
                    let zo = Wo[i] * x + bo[i]; for (let j = 0; j < H; j++) zo += Uo[i][j] * h[j];
                    o[i] = sigmoid(zo);
                    let zc = Wc[i] * x + bc[i]; for (let j = 0; j < H; j++) zc += Uc[i][j] * h[j];
                    cTilde[i] = Math.tanh(zc);
                    c[i] = f[i] * c[i] + inp[i] * cTilde[i];
                    hNew[i] = o[i] * Math.tanh(c[i]);
                }
                gates = { f: f.slice(), i: inp.slice(), o: o.slice(), cTilde: cTilde.slice(), c: c.slice() };
            } else if (netType === 'gru') {
                const z = Array(H), r = Array(H);
                for (let i = 0; i < H; i++) {
                    let zz = Wz[i] * x + bz[i]; for (let j = 0; j < H; j++) zz += Uz[i][j] * h[j];
                    z[i] = sigmoid(zz);
                    let zr = Wr[i] * x + br[i]; for (let j = 0; j < H; j++) zr += Ur[i][j] * h[j];
                    r[i] = sigmoid(zr);
                    let zh = W_xh[i] * x + b_h[i];
                    for (let j = 0; j < H; j++) zh += W_hh[i][j] * (r[j] * h[j]);
                    const hc = Math.tanh(zh);
                    hNew[i] = (1 - z[i]) * h[i] + z[i] * hc;
                }
                gates = { z: z.slice(), r: r.slice() };
            }
            hs.push(hNew.slice());
            // 输出层 y = W_hy · h + b_y
            let y = b_y;
            for (let i = 0; i < H; i++) y += W_hy[i] * hNew[i];
            ys.push(y);
            gateLog.push(gates);
            h = hNew;
        }
        return { hs, ys, gates: gateLog };
    }

    // 简单 BPTT（仅优化最后一步输出，降低复杂度，便于演示）
    function trainStep(lr) {
        const seq = genSeq();
        const { hs, ys } = forward(seq.xs);
        const T = seq.xs.length;
        // loss = 0.5 * sum (y_t - target_t)^2
        let loss = 0;
        const dy = [];
        for (let t = 0; t < T; t++) {
            const e = ys[t] - seq.ys[t];
            loss += 0.5 * e * e;
            dy.push(e);
        }
        // 简化梯度：仅对输出层 W_hy, b_y 做梯度下降，并对 W_xh 做近似更新
        const gWhy = Array(H).fill(0);
        let gBy = 0;
        for (let t = 0; t < T; t++) {
            gBy += dy[t];
            for (let i = 0; i < H; i++) gWhy[i] += dy[t] * hs[t][i];
        }
        for (let i = 0; i < H; i++) W_hy[i] -= lr * gWhy[i] / T;
        b_y -= lr * gBy / T;
        // 隐状态对 W_xh 的近似梯度（仅取最后一步）
        const lastH = hs[T - 1];
        const lastDy = dy[T - 1];
        for (let i = 0; i < H; i++) {
            const dhRaw = lastDy * W_hy[i] * (1 - lastH[i] * lastH[i]);
            W_xh[i] -= lr * dhRaw * seq.xs[T - 1] / T;
        }
        return loss / T;
    }

    // 生成正弦波序列
    function genSeq() {
        const T = parseInt(seqSld.value);
        const xs = [], ys = [];
        for (let t = 0; t < T; t++) {
            xs.push(Math.sin(t * 0.3));
            ys.push(Math.sin((t + 1) * 0.3));   // 预测下一步
        }
        return { xs, ys };
    }

    let stepCount = 0;
    let lossHistory = [];
    let lastGates = null;

    function draw() {
        const W = canvas.width, H_canvas = canvas.height;
        ctx.clearRect(0, 0, W, H_canvas);
        const seq = genSeq();
        const { hs, ys, gates } = forward(seq.xs);
        lastGates = gates;
        const T = seq.xs.length;

        // ===== 上半：时间步展开图 =====
        const unrollTop = 30, unrollBot = 220;
        const cellR = 22;
        const stepW = (W - 80) / T;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`时间步展开 (T=${T}, ${netType.toUpperCase()}, H=${H})`, 30, 8);

        // h 节点 + x 输入 + y 输出
        for (let t = 0; t < T; t++) {
            const cx = 40 + stepW * (t + 0.5);
            const cy = (unrollTop + unrollBot) / 2;
            // 横向 h_{t-1} → h_t 连线
            if (t > 0) {
                const px = 40 + stepW * (t - 0.5);
                ctx.strokeStyle = 'rgba(168,85,247,0.55)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(px + cellR, cy);
                ctx.lineTo(cx - cellR, cy);
                ctx.stroke();
            }
            // x_t 输入（从下方进入）
            const xcy = cy + 60;
            ctx.strokeStyle = 'rgba(99,102,241,0.6)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(cx, xcy);
            ctx.lineTo(cx, cy + cellR);
            ctx.stroke();
            ctx.fillStyle = 'rgba(99,102,241,0.18)';
            ctx.beginPath(); ctx.arc(cx, xcy, 13, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '11px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seq.xs[t].toFixed(2), cx, xcy);

            // y_t 输出（从上方出）
            const ycy = cy - 60;
            ctx.strokeStyle = 'rgba(236,72,153,0.6)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(cx, cy - cellR);
            ctx.lineTo(cx, ycy);
            ctx.stroke();
            // 真值与预测
            ctx.fillStyle = 'rgba(251,191,36,0.9)';
            ctx.beginPath(); ctx.arc(cx - 8, ycy, 4, 0, Math.PI * 2); ctx.fill();   // 真值
            ctx.fillStyle = 'rgba(236,72,153,0.95)';
            ctx.beginPath(); ctx.arc(cx + 8, ycy, 4, 0, Math.PI * 2); ctx.fill();   // 预测
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Consolas, monospace';
            ctx.fillText(`${ys[t].toFixed(2)}`, cx, ycy - 12);

            // h_t 节点
            const hIntensity = Math.min(1, Math.abs(hs[t][0]));
            ctx.fillStyle = `rgba(168,85,247,${0.25 + hIntensity * 0.4})`;
            ctx.beginPath(); ctx.arc(cx, cy, cellR, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 11px Consolas, monospace';
            ctx.fillText(`h${t}`, cx, cy);

            // 时间步标签
            ctx.fillStyle = '#64748b';
            ctx.font = '10px "Microsoft YaHei", sans-serif';
            ctx.fillText(`t=${t}`, cx, unrollBot + 4);
        }
        // 图例
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(251,191,36,0.9)';
        ctx.beginPath(); ctx.arc(30, unrollBot + 28, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.fillText('真值', 40, unrollBot + 24);
        ctx.fillStyle = 'rgba(236,72,153,0.95)';
        ctx.beginPath(); ctx.arc(85, unrollBot + 28, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.fillText('预测', 95, unrollBot + 24);

        // ===== 下半左：训练 loss 曲线 =====
        const lossX = 30, lossY = 280, lossW = 400, lossH = 200;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(lossX, lossY, lossW, lossH);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('训练 Loss 曲线', lossX, lossY - 4);
        if (lossHistory.length > 1) {
            const maxL = Math.max(...lossHistory, 0.05);
            ctx.strokeStyle = 'rgba(236,72,153,0.95)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < lossHistory.length; i++) {
                const px = lossX + (i / Math.max(lossHistory.length - 1, 1)) * lossW;
                const py = lossY + lossH - (lossHistory[i] / maxL) * lossH;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        // ===== 下半右：预测 vs 真值曲线 =====
        const predX = 460, predY = 280, predW = 360, predH = 200;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(predX, predY, predW, predH);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('预测 vs 真值', predX, predY - 4);
        // 真值
        ctx.strokeStyle = 'rgba(251,191,36,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let t = 0; t < T; t++) {
            const px = predX + (t / (T - 1)) * predW;
            const py = predY + predH - (seq.ys[t] + 1) / 2 * predH;
            if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // 预测
        ctx.strokeStyle = 'rgba(236,72,153,0.95)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        for (let t = 0; t < T; t++) {
            const px = predX + (t / (T - 1)) * predW;
            const py = predY + predH - (ys[t] + 1) / 2 * predH;
            if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // ===== LSTM 门控条形图（仅 lstm 显示） =====
        if (netType === 'lstm' && lastGates && lastGates.length > 0) {
            const lastG = lastGates[lastGates.length - 1];
            const barX = 30, barY = lossY + lossH + 20;
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '11px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('LSTM 门控状态 (最后时间步)', barX, barY);
            const labels = ['f (遗忘门)', 'i (输入门)', 'o (输出门)', 'c̃ (候选)'];
            const colors = ['#ef4444', '#22c55e', '#3b82f6', '#a855f7'];
            const arrs = [lastG.f, lastG.i, lastG.o, lastG.cTilde];
            const barW = 4, gap = 8;
            for (let g = 0; g < 4; g++) {
                const gx = barX + g * 210;
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(labels[g], gx, barY + 14);
                for (let i = 0; i < H; i++) {
                    const v = arrs[g][i];
                    const h = Math.abs(v) * 22;
                    ctx.fillStyle = colors[g];
                    ctx.fillRect(gx + i * (barW + gap), barY + 40 - h, barW, h);
                }
            }
            gatesEl.innerHTML = `f=[${lastG.f.slice(0,4).map(v=>v.toFixed(2)).join(', ')}...], i=[${lastG.i.slice(0,4).map(v=>v.toFixed(2)).join(', ')}...]`;
        } else if (netType === 'gru' && lastGates && lastGates.length > 0) {
            const lastG = lastGates[lastGates.length - 1];
            gatesEl.innerHTML = `z=[${lastG.z.slice(0,4).map(v=>v.toFixed(2)).join(', ')}...], r=[${lastG.r.slice(0,4).map(v=>v.toFixed(2)).join(', ')}...]`;
        } else {
            gatesEl.innerHTML = 'RNN 无门控结构';
        }

        // 信息面板
        hidVal.textContent = H;
        lrVal.textContent = parseFloat(lrSld.value).toFixed(3);
        seqVal.textContent = T;
        const curLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : null;
        statsEl.textContent = `${stepCount}  /  ${curLoss !== null ? curLoss.toFixed(5) : '--'}`;
        // 公式（完整版，符号间加空格）
        const formulaEl = document.getElementById('rnnFormula');
        if (netType === 'rnn') {
            formulaEl.innerHTML = '$$ h_t = \\tanh(W_{hh}\\, h_{t-1} + W_{xh}\\, x_t + b_h), \\quad y_t = W_{hy}\\, h_t + b_y $$';
        } else if (netType === 'lstm') {
            formulaEl.innerHTML = '$$ \\begin{aligned} f_t &= \\sigma(W_f\\, x_t + U_f\\, h_{t-1} + b_f), \\; i_t = \\sigma(W_i\\, x_t + U_i\\, h_{t-1} + b_i) \\\\ \\tilde{c}_t &= \\tanh(W_c\\, x_t + U_c\\, h_{t-1} + b_c), \\; o_t = \\sigma(W_o\\, x_t + U_o\\, h_{t-1} + b_o) \\\\ c_t &= f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t, \\; h_t = o_t \\odot \\tanh(c_t) \\end{aligned} $$';
        } else {
            formulaEl.innerHTML = '$$ \\begin{aligned} z_t &= \\sigma(W_z\\, x_t + U_z\\, h_{t-1} + b_z), \\; r_t = \\sigma(W_r\\, x_t + U_r\\, h_{t-1} + b_r) \\\\ \\tilde{h}_t &= \\tanh(W_h\\, x_t + U_h\\, (r_t \\odot h_{t-1}) + b_h) \\\\ h_t &= (1 - z_t) \\odot h_{t-1} + z_t \\odot \\tilde{h}_t \\end{aligned} $$';
        }
        if (window.MathJax) typesetMath([formulaEl]);
    }

    let autoTimer = null;
    function startAuto() {
        if (autoTimer) return;
        autoBtn.textContent = '⏸ 停止';
        const lr = parseFloat(lrSld.value);
        autoTimer = setInterval(() => {
            const l = trainStep(lr);
            lossHistory.push(l);
            if (lossHistory.length > 200) lossHistory.shift();
            stepCount++;
            draw();
        }, 120);
    }
    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        autoBtn.textContent = '▶ 持续训练';
    }

    function train(n) {
        const lr = parseFloat(lrSld.value);
        for (let i = 0; i < n; i++) {
            const l = trainStep(lr);
            lossHistory.push(l);
            if (lossHistory.length > 200) lossHistory.shift();
            stepCount++;
        }
        draw();
    }

    trainBtn.addEventListener('click', () => train(1));
    tr50Btn.addEventListener('click', () => train(50));
    autoBtn.addEventListener('click', () => { if (autoTimer) stopAuto(); else startAuto(); });
    resetBtn.addEventListener('click', () => { stopAuto(); reset(); draw(); });
    typeSel.addEventListener('change', () => { stopAuto(); reset(); draw(); });
    hidSld.addEventListener('input', () => { stopAuto(); reset(); draw(); });
    lrSld.addEventListener('input', draw);
    seqSld.addEventListener('input', draw);

    reset();
    draw();
}

// ============================================================
// 实验8: 注意力机制与 Transformer
// ============================================================
function initAttention() {
    const canvas = document.getElementById('attnCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const inputSel = document.getElementById('attnInputSelect');
    const headSld  = document.getElementById('attnHeadSlider');
    const headVal  = document.getElementById('attnHeadValue');
    const scaleSld = document.getElementById('attnScaleSlider');
    const scaleVal = document.getElementById('attnScaleValue');
    const querySel = document.getElementById('attnQuerySelect');
    const peChk    = document.getElementById('attnShowPE');
    const statsEl  = document.getElementById('attnStats');
    const maxEl    = document.getElementById('attnMax');

    const sentences = {
        cat:  ['The', 'cat', 'sat', 'on', 'the', 'mat'],
        bird: ['A', 'bird', 'flies', 'in', 'the', 'sky'],
        fish: ['Fish', 'swim', 'in', 'deep', 'blue', 'water']
    };

    const dModel = 8;   // 固定 d_model=8，可视化时只显示前 4 维

    // 词嵌入（哈希 + 位置编码）
    function embed(tokens) {
        return tokens.map((w, pos) => {
            const v = Array(dModel).fill(0);
            let hash = 0;
            for (let i = 0; i < w.length; i++) hash = (hash * 31 + w.charCodeAt(i)) | 0;
            for (let i = 0; i < dModel; i++) {
                v[i] = Math.sin((hash + i * 17) * 0.1) * 0.5 + Math.cos((hash + i * 23) * 0.07) * 0.3;
            }
            for (let i = 0; i < dModel; i++) {
                const angle = pos / Math.pow(10000, i / dModel);
                v[i] += (i % 2 === 0) ? Math.sin(angle) : Math.cos(angle);
            }
            return v;
        });
    }

    function softmax(arr) {
        const m = Math.max(...arr);
        const ex = arr.map(x => Math.exp(x - m));
        const s = ex.reduce((a, b) => a + b, 0);
        return ex.map(e => e / s);
    }

    function matMulVec(M, v) {
        return M.map(row => row.reduce((s, m, i) => s + m * v[i], 0));
    }

    // v^T · M（v 长度 = M 行数），输出长度 = M 列数
    function matMulVecT(M, v) {
        const n = M[0].length, m = M.length;
        const out = Array(n).fill(0);
        for (let r = 0; r < m; r++) {
            const vr = v[r];
            if (vr === 0) continue;
            for (let c = 0; c < n; c++) out[c] += M[r][c] * vr;
        }
        return out;
    }

    // 生成投影矩阵 W (dModel × dK)，基于种子的可重复伪随机
    function makeProj(h, seed, dK) {
        const W = [];
        for (let r = 0; r < dModel; r++) {
            const row = [];
            for (let c = 0; c < dK; c++) {
                row.push(Math.sin((h + seed) * (r + 1) * (c + 2) * 0.31) * 0.5);
            }
            W.push(row);
        }
        return W;
    }

    // 单头完整计算：返回 { Q, K, V, S, A, O }
    function singleHeadAttn(emb, h, dK, scale) {
        const T = emb.length;
        const WQ = makeProj(h, 1, dK);
        const WK = makeProj(h, 2, dK);
        const WV = makeProj(h, 3, dK);
        const Q = emb.map(e => matMulVecT(WQ, e));   // (dModel×dK)^T·x → dK 维
        const K = emb.map(e => matMulVecT(WK, e));
        const V = emb.map(e => matMulVecT(WV, e));
        // S = Q K^T / scale
        const S = [];
        for (let i = 0; i < T; i++) {
            const row = [];
            for (let j = 0; j < T; j++) {
                let s = 0;
                for (let k = 0; k < dK; k++) s += Q[i][k] * K[j][k];
                row.push(s / scale);
            }
            S.push(row);
        }
        // A = softmax(S)
        const A = S.map(row => softmax(row));
        // O = A V
        const O = [];
        for (let i = 0; i < T; i++) {
            const o = Array(dK).fill(0);
            for (let j = 0; j < T; j++) {
                for (let k = 0; k < dK; k++) o[k] += A[i][j] * V[j][k];
            }
            O.push(o);
        }
        return { Q, K, V, S, A, O };
    }

    // 通用矩阵绘制（支持正负值双色、标签、高亮行列）
    function drawMat(mat, x0, y0, cell, rowLabels, colLabels, title, opts = {}) {
        const rows = mat.length;
        const cols = mat[0].length;
        const { posColor = [99,102,241], negColor = [236,72,153],
                showVal = true, highlightRow = -1, highlightCol = -1,
                valFmt = v => v.toFixed(2), valThreshold = 36 } = opts;
        // 标题
        if (title) {
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(title, x0 + cols * cell / 2, y0 - 9);
        }
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const v = mat[i][j];
                const abs = Math.min(1, Math.abs(v));
                const c = v >= 0 ? posColor : negColor;
                ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${abs * 0.85 + 0.05})`;
                ctx.fillRect(x0 + j * cell, y0 + i * cell, cell - 1, cell - 1);
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x0 + j * cell, y0 + i * cell, cell - 1, cell - 1);
                if (showVal && cell >= valThreshold) {
                    ctx.fillStyle = abs > 0.55 ? '#0f172a' : '#e2e8f0';
                    ctx.font = `${Math.max(9, Math.floor(cell * 0.34))}px Consolas, monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(valFmt(v), x0 + j * cell + cell/2, y0 + i * cell + cell/2);
                }
            }
        }
        // 高亮行/列
        if (highlightRow >= 0 && highlightRow < rows) {
            ctx.strokeStyle = 'rgba(251,191,36,0.95)';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(x0 - 1, y0 + highlightRow * cell - 1, cols * cell + 1, cell + 1);
        }
        if (highlightCol >= 0 && highlightCol < cols) {
            ctx.strokeStyle = 'rgba(251,191,36,0.95)';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(x0 + highlightCol * cell - 1, y0 - 1, cell + 1, rows * cell + 1);
        }
        // 行标签
        if (rowLabels) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Consolas, monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < rows; i++) {
                ctx.fillText(rowLabels[i], x0 - 4, y0 + i * cell + cell / 2);
            }
        }
        // 列标签
        if (colLabels) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            for (let j = 0; j < cols; j++) {
                ctx.fillText(colLabels[j], x0 + j * cell + cell / 2, y0 + rows * cell + 4);
            }
        }
    }

    // 绘制箭头 + 标注
    function drawArrow(x1, y1, x2, y2, label) {
        ctx.strokeStyle = 'rgba(139,92,246,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        if (label) {
            ctx.fillStyle = 'rgba(168,85,247,0.9)';
            ctx.font = 'bold 10px Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 8);
        }
    }

    function draw() {
        const W = canvas.width;

        const tokens = sentences[inputSel.value];
        const T = tokens.length;
        const emb = embed(tokens);
        const nHead = parseInt(headSld.value);
        const scale = parseFloat(scaleSld.value);
        const dK = Math.max(1, Math.floor(dModel / nHead));
        const queryIdx = parseInt(querySel.value);
        const qi = Math.min(queryIdx, T - 1);

        // Head 0 完整计算
        const h0 = singleHeadAttn(emb, 0, dK, scale);

        // 多头注意力（仅注意力矩阵）
        const allHeads = [];
        for (let h = 0; h < nHead; h++) {
            allHeads.push(singleHeadAttn(emb, h, dK, scale));
        }

        // ===== 垂直布局：光标式排布，段间预留列标签空间，杜绝重叠 =====
        const showPE = peChk.checked;
        const xCell = 22, xCols = 4;      // X 只显示前 4 维
        const sCell = 34, oCell = 24, mhCell = 18;
        const perRow = nHead <= 4 ? nHead : 4;   // 多头一行最多 4 个
        const mhRows = Math.ceil(nHead / perRow);
        const COL_LABEL = 22;                     // 列标签预留高度
        const GAP = 14;

        const xY = 52;                            // Step1-2 矩阵顶部
        const s4Title = xY + T * xCell + COL_LABEL + GAP;
        const sY  = s4Title + 44;
        const o5Title = sY + T * sCell + COL_LABEL + GAP;
        const oY  = o5Title + 44;
        const mhTitle = oY + T * oCell + COL_LABEL + GAP;
        const mhRow0 = mhTitle + 44;
        const mhRowH = T * mhCell + COL_LABEL + 16;   // 矩阵高 + 列标签 + 行距
        const mhBlockEnd = mhRow0 + mhRows * mhRowH;
        let peTitle = 0, peY0 = 0;
        let totalH = mhBlockEnd + 10;
        if (showPE) {
            peTitle = mhBlockEnd + GAP;
            peY0 = peTitle + 34;
            totalH = peY0 + 78 + 14;
        }
        canvas.height = totalH;                   // 画布高度随内容自适应（外层可滚动）
        ctx.clearRect(0, 0, W, canvas.height);

        // ===== Step 1+2: 词嵌入 X → Q, K, V 投影 =====
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Step 1-2: 词嵌入 X 与线性投影 Q / K / V', 30, 10);

        const xX = 80;
        // X 矩阵 (T × 4)
        const xMat = emb.map(row => row.slice(0, xCols));
        drawMat(xMat, xX, xY, xCell, tokens, ['d₀','d₁','d₂','d₃'],
            'X 词嵌入 (显示前4维)',
            { posColor: [34,197,94], negColor: [239,68,68], valFmt: v => v.toFixed(1), valThreshold: 24 });

        // 箭头 X → Q/K/V
        const qkvX = xX + xCols * xCell + 80;
        drawArrow(xX + xCols * xCell, xY + T * xCell / 2, qkvX, xY + T * xCell / 2, '×W');

        // Q, K, V 三个矩阵并排（间距保证标题互不重叠）
        const qkvCell = 18, qkvCols = dK;
        const qkvW = qkvCols * qkvCell;
        const qkvSpacing = Math.max(qkvW + 36, 96);
        const qkvLabels = Array.from({length: dK}, (_, i) => `k${i}`);
        drawMat(h0.Q, qkvX,                    xY, qkvCell, tokens, qkvLabels, 'Q = XW_Q', { posColor: [99,102,241], negColor: [239,68,68], valThreshold: 24, valFmt: v => v.toFixed(1) });
        drawMat(h0.K, qkvX + qkvSpacing,       xY, qkvCell, tokens, qkvLabels, 'K = XW_K', { posColor: [168,85,247], negColor: [239,68,68], valThreshold: 24, valFmt: v => v.toFixed(1) });
        drawMat(h0.V, qkvX + 2 * qkvSpacing,   xY, qkvCell, tokens, qkvLabels, 'V = XW_V', { posColor: [236,72,153], negColor: [239,68,68], valThreshold: 24, valFmt: v => v.toFixed(1) });

        // ===== Step 3+4: S = QK^T/√d_k → A = softmax(S) =====
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Step 3-4: 注意力分数 S = QK^T / √d_k  →  A = softmax(S)', 30, s4Title);

        const sX = 80;
        // S 矩阵 (T × T)，含正负值
        drawMat(h0.S, sX, sY, sCell, tokens, tokens,
            'S = QK^T / √d_k  (注意力分数, 可为负)',
            { posColor: [99,102,241], negColor: [236,72,153], highlightRow: qi, valThreshold: 30 });

        // 箭头 S → A
        const aX = sX + T * sCell + 60;
        drawArrow(sX + T * sCell, sY + T * sCell / 2, aX, sY + T * sCell / 2, 'softmax');

        // A 矩阵 (T × T)
        drawMat(h0.A, aX, sY, sCell, tokens, tokens,
            'A = softmax(S)  (注意力权重, 行和=1)',
            { posColor: [99,102,241], negColor: [236,72,153], highlightRow: qi, valThreshold: 30 });

        // 颜色条
        const legX = aX + T * sCell + 24, legY = sY, legW = 14, legH = T * sCell;
        const grad = ctx.createLinearGradient(0, legY + legH, 0, legY);
        grad.addColorStop(0, 'rgba(99,102,241,0.05)');
        grad.addColorStop(1, 'rgba(99,102,241,0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(legX, legY, legW, legH);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(legX, legY, legW, legH);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('1.0', legX + legW + 3, legY);
        ctx.fillText('0.5', legX + legW + 3, legY + legH / 2);
        ctx.fillText('0.0', legX + legW + 3, legY + legH);

        // ===== Step 5: O = AV =====
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Step 5: 加权输出 O = A · V  (每个查询词的注意力加权表示)', 30, o5Title);

        const oX = 80;
        drawMat(h0.O, oX, oY, oCell, tokens, qkvLabels,
            `O = A·V  (${T}×${dK}, Head #0 输出)`,
            { posColor: [34,197,94], negColor: [239,68,68], highlightRow: qi, valThreshold: 26, valFmt: v => v.toFixed(2) });

        // ===== Step 6: 多头注意力 =====
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Step 6: 多头注意力并行 (heads=${nHead}, d_k=${dK}, 每头独立 W_Q/W_K/W_V${mhRows > 1 ? ', 分两行显示' : ''})`, 30, mhTitle);
        const mhSpacing = T * mhCell + 44;
        for (let h = 0; h < nHead; h++) {
            const row = Math.floor(h / perRow);
            const col = h % perRow;
            const hx = 70 + col * mhSpacing;
            const hy = mhRow0 + row * mhRowH;
            drawMat(allHeads[h].A, hx, hy, mhCell, tokens, null,
                `Head ${h}`, { posColor: [168,85,247], negColor: [236,72,153], highlightRow: qi, valThreshold: 999 });
        }

        // ===== Step 7: 位置编码 =====
        if (showPE) {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Step 7: 位置编码 Positional Encoding  (PE(pos, 2i) = sin(pos/10000^{2i/d}),  PE(pos, 2i+1) = cos(...))', 30, peTitle);

            const peX0 = 50, peW = W - 250, peH = 78;
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1;
            ctx.strokeRect(peX0, peY0, peW, peH);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.moveTo(peX0, peY0 + peH / 2);
            ctx.lineTo(peX0 + peW, peY0 + peH / 2);
            ctx.stroke();
            const dims = [0, 1, 2, 3];
            const peColors = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b'];
            for (let d = 0; d < dims.length; d++) {
                const dim = dims[d];
                ctx.strokeStyle = peColors[d];
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                for (let pos = 0; pos <= 50; pos++) {
                    const angle = pos / Math.pow(10000, dim / dModel);
                    const v = (dim % 2 === 0) ? Math.sin(angle) : Math.cos(angle);
                    const px = peX0 + (pos / 50) * peW;
                    const py = peY0 + peH / 2 - v * peH / 2 * 0.85;
                    if (pos === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }
            ctx.font = '10px Consolas, monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            for (let d = 0; d < dims.length; d++) {
                ctx.fillStyle = peColors[d];
                ctx.fillText(`dim ${dims[d]} (${dims[d] % 2 === 0 ? 'sin' : 'cos'})`,
                    peX0 + peW + 8, peY0 + 14 + d * 16);
            }
        }

        // ===== 信息面板 =====
        headVal.textContent = nHead;
        scaleVal.textContent = scale.toFixed(1);
        statsEl.textContent = `T=${T}  /  heads=${nHead}  /  d_k=${dK}`;
        const qAttn = h0.A[qi];
        const maxIdx = qAttn.indexOf(Math.max(...qAttn));
        maxEl.textContent = `"${tokens[qi]}" → "${tokens[maxIdx]}"  (w=${qAttn[maxIdx].toFixed(3)})`;
    }

    [inputSel, querySel].forEach(el => el.addEventListener('change', draw));
    [headSld, scaleSld].forEach(el => el.addEventListener('input', draw));
    peChk.addEventListener('change', draw);
    draw();
}

// ============================================================
// 实验9: Dropout / L2 正则化对比
// ============================================================
function initRegularization() {
    const canvas = document.getElementById('regCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dropSld  = document.getElementById('regDropSlider');
    const dropVal  = document.getElementById('regDropValue');
    const l2Sld    = document.getElementById('regL2Slider');
    const l2Val    = document.getElementById('regL2Value');
    const epochSld = document.getElementById('regEpochSlider');
    const epochVal = document.getElementById('regEpochValue');
    const dataSel  = document.getElementById('regDataSelect');
    const trainBtn = document.getElementById('regTrainBtn');
    const autoBtn  = document.getElementById('regAutoBtn');
    const resetBtn = document.getElementById('regResetBtn');
    const noneStat = document.getElementById('regNoneStat');
    const dropStat = document.getElementById('regDropStat');
    const l2Stat   = document.getElementById('regL2Stat');

    // 简单的两层 MLP，2 输入 → 8 隐 → 1 输出
    function makeNet() {
        const rng = () => (Math.random() * 2 - 1) * 0.8;
        return {
            W1: Array.from({length: 8}, () => [rng(), rng()]),
            b1: Array.from({length: 8}, () => rng() * 0.1),
            W2: Array.from({length: 8}, () => rng()),
            b2: rng() * 0.1
        };
    }
    function sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, x)))); }
    function forward(net, x, dropoutP, train) {
        const h = [];
        const mask = [];
        for (let i = 0; i < 8; i++) {
            let z = net.b1[i] + net.W1[i][0] * x[0] + net.W1[i][1] * x[1];
            const keep = train ? (Math.random() > dropoutP) : true;
            mask.push(keep ? 1 : 0);
            const scale = train ? (1 / Math.max(0.001, 1 - dropoutP)) : 1;
            h.push(keep ? sigmoid(z) * scale : 0);
        }
        let z = net.b2;
        for (let i = 0; i < 8; i++) z += net.W2[i] * h[i];
        return { y: sigmoid(z), h, mask };
    }
    function trainStep(net, data, lr, dropoutP, l2) {
        let totalLoss = 0;
        const gW1 = Array.from({length: 8}, () => [0, 0]);
        const gb1 = Array(8).fill(0);
        const gW2 = Array(8).fill(0);
        let gb2 = 0;
        for (const {x, y: target} of data) {
            const { y, h, mask } = forward(net, x, dropoutP, true);
            const dy = y - target;
            totalLoss += 0.5 * dy * dy;
            // 反向传播
            for (let i = 0; i < 8; i++) {
                gW2[i] += dy * h[i] * mask[i];
                const dh = dy * net.W2[i] * h[i] * (1 - h[i]) * mask[i];
                gb1[i] += dh;
                gW1[i][0] += dh * x[0];
                gW1[i][1] += dh * x[1];
            }
            gb2 += dy;
        }
        // 更新 + L2
        const n = data.length;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 2; j++) {
                net.W1[i][j] -= lr * (gW1[i][j] / n + l2 * net.W1[i][j]);
            }
            net.b1[i] -= lr * gb1[i] / n;
            net.W2[i] -= lr * (gW2[i] / n + l2 * net.W2[i]);
        }
        net.b2 -= lr * gb2 / n;
        return totalLoss / n;
    }
    function accuracy(net, data, dropoutP) {
        let correct = 0;
        for (const {x, y} of data) {
            const pred = forward(net, x, dropoutP, false).y;
            if ((pred >= 0.5 ? 1 : 0) === y) correct++;
        }
        return correct / data.length;
    }

    // 数据集生成
    function genData(type) {
        const train = [], val = [];
        const n = 60;
        for (let i = 0; i < n; i++) {
            let x, y;
            if (type === 'moon') {
                const cls = i < n / 2 ? 0 : 1;
                const t = (i % (n/2)) / (n/2) * Math.PI;
                const r = 1 + (Math.random() - 0.5) * 0.3;
                x = cls === 0 ? [r * Math.cos(t), r * Math.sin(t)] : [1 + r * Math.cos(t + Math.PI), r * Math.sin(t + Math.PI) - 0.5];
                y = cls;
            } else if (type === 'circle') {
                const ang = Math.random() * Math.PI * 2;
                const inner = Math.random() < 0.5;
                const r = inner ? Math.random() * 0.8 : 1.5 + Math.random() * 0.6;
                x = [r * Math.cos(ang), r * Math.sin(ang)];
                y = inner ? 0 : 1;
            } else {  // xor
                x = [(Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4];
                y = (x[0] * x[1] > 0) ? 1 : 0;
            }
            (i % 5 === 0 ? val : train).push({ x, y });
        }
        return { train, val };
    }

    let netNone, netDrop, netL2;
    let lossNone = [], lossDrop = [], lossL2 = [];
    let epoch = 0;
    let dataTrain, dataVal;
    let animId = null;

    function resetAll() {
        netNone = makeNet();
        netDrop = makeNet();
        netL2 = makeNet();
        lossNone = []; lossDrop = []; lossL2 = [];
        epoch = 0;
        const d = genData(dataSel.value);
        dataTrain = d.train; dataVal = d.val;
        draw();
    }

    function drawDecisionBoundary(net, x0, y0, w, h, title, dropoutP) {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0, y0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(title, x0 + w / 2, y0 - 4);
        const res = 16;
        const cellW = w / res, cellH = h / res;
        const xMin = -2, xMax = 3, yMin = -2, yMax = 2;
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const dx = xMin + (xMax - xMin) * (j + 0.5) / res;
                const dy = yMin + (yMax - yMin) * (res - 1 - i + 0.5) / res;
                const p = forward(net, [dx, dy], dropoutP, false).y;
                ctx.fillStyle = p > 0.5
                    ? `rgba(99,102,241,${(p - 0.5) * 1.4})`
                    : `rgba(236,72,153,${(0.5 - p) * 1.4})`;
                ctx.fillRect(x0 + j * cellW, y0 + i * cellH, cellW + 0.5, cellH + 0.5);
            }
        }
        // 数据点
        for (const {x, y} of dataTrain) {
            const px = x0 + (x[0] - xMin) / (xMax - xMin) * w;
            const py = y0 + (1 - (x[1] - yMin) / (yMax - yMin)) * h;
            ctx.fillStyle = y === 1 ? '#6366f1' : '#ec4899';
            ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.stroke();
        }
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const dropP = parseFloat(dropSld.value);
        const l2 = parseFloat(l2Sld.value);

        // 三个决策边界并排
        const bdY = 30, bdH = 180, bdW = 250, gap = 20;
        drawDecisionBoundary(netNone, 30,                  bdY, bdW, bdH, '① 无正则化', 0);
        drawDecisionBoundary(netDrop, 30 + bdW + gap,      bdY, bdW, bdH, `② Dropout (p=${dropP.toFixed(2)})`, dropP);
        drawDecisionBoundary(netL2,   30 + 2*(bdW + gap),  bdY, bdW, bdH, `③ L2 (λ=${l2.toFixed(3)})`, 0);

        // 训练 loss 对比曲线
        const lcY = 250, lcH = 150, lcW = W - 60;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeRect(30, lcY, lcW, lcH);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('训练 Loss 对比', 30, lcY - 4);
        const allLoss = [...lossNone, ...lossDrop, ...lossL2];
        if (allLoss.length > 0) {
            const maxL = Math.max(...allLoss, 0.05);
            const drawCurve = (arr, color, dash) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash(dash);
                ctx.beginPath();
                for (let i = 0; i < arr.length; i++) {
                    const px = 30 + (i / Math.max(arr.length - 1, 1)) * lcW;
                    const py = lcY + lcH - (arr[i] / maxL) * lcH;
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            };
            drawCurve(lossNone, '#ef4444', []);       // 红色实线
            drawCurve(lossDrop, '#22c55e', [5, 3]);   // 绿色虚线
            drawCurve(lossL2, '#3b82f6', [2, 2]);     // 蓝色点线
        }
        // 图例
        const legY = lcY + lcH + 10;
        const legs = [['#ef4444', '无正则', []], ['#22c55e', 'Dropout', [5,3]], ['#3b82f6', 'L2', [2,2]]];
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < legs.length; i++) {
            const lx = 30 + i * 130;
            ctx.strokeStyle = legs[i][0]; ctx.lineWidth = 2; ctx.setLineDash(legs[i][2]);
            ctx.beginPath(); ctx.moveTo(lx, legY); ctx.lineTo(lx + 24, legY); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(legs[i][1], lx + 30, legY);
        }

        // 信息面板
        dropVal.textContent = dropP.toFixed(2);
        l2Val.textContent = l2.toFixed(3);
        epochVal.textContent = parseInt(epochSld.value);
        if (dataTrain) {
            const trN = accuracy(netNone, dataTrain, 0);
            const vaN = accuracy(netNone, dataVal, 0);
            const trD = accuracy(netDrop, dataTrain, 0);
            const vaD = accuracy(netDrop, dataVal, 0);
            const trL = accuracy(netL2, dataTrain, 0);
            const vaL = accuracy(netL2, dataVal, 0);
            noneStat.textContent = `训练 ${trN.toFixed(2)} / 验证 ${vaN.toFixed(2)}  (gap ${(trN - vaN).toFixed(2)})`;
            dropStat.textContent = `训练 ${trD.toFixed(2)} / 验证 ${vaD.toFixed(2)}  (gap ${(trD - vaD).toFixed(2)})`;
            l2Stat.textContent   = `训练 ${trL.toFixed(2)} / 验证 ${vaL.toFixed(2)}  (gap ${(trL - vaL).toFixed(2)})`;
        }
    }

    function train() {
        if (animId) return;
        const totalEpochs = parseInt(epochSld.value);
        const lr = 0.3;
        const dropP = parseFloat(dropSld.value);
        const l2 = parseFloat(l2Sld.value);
        let count = 0;
        function step() {
            if (count >= totalEpochs) {
                animId = null;
                draw();
                return;
            }
            const l1 = trainStep(netNone, dataTrain, lr, 0, 0);
            const l2v = trainStep(netDrop, dataTrain, lr, dropP, 0);
            const l3 = trainStep(netL2,   dataTrain, lr, 0, l2);
            lossNone.push(l1); lossDrop.push(l2v); lossL2.push(l3);
            if (lossNone.length > 100) { lossNone.shift(); lossDrop.shift(); lossL2.shift(); }
            epoch++; count++;
            draw();
            animId = requestAnimationFrame(step);
        }
        step();
    }

    let autoTimer = null;
    function startAuto() {
        if (autoTimer) return;
        autoBtn.textContent = '⏸ 停止';
        const lr = 0.3;
        autoTimer = setInterval(() => {
            const dropP = parseFloat(dropSld.value);
            const l2 = parseFloat(l2Sld.value);
            const l1 = trainStep(netNone, dataTrain, lr, 0, 0);
            const l2v = trainStep(netDrop, dataTrain, lr, dropP, 0);
            const l3 = trainStep(netL2,   dataTrain, lr, 0, l2);
            lossNone.push(l1); lossDrop.push(l2v); lossL2.push(l3);
            if (lossNone.length > 100) { lossNone.shift(); lossDrop.shift(); lossL2.shift(); }
            epoch++;
            draw();
        }, 100);
    }
    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        autoBtn.textContent = '▶ 持续训练';
    }

    trainBtn.addEventListener('click', train);
    autoBtn.addEventListener('click', () => { if (autoTimer) stopAuto(); else startAuto(); });
    resetBtn.addEventListener('click', () => {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        stopAuto();
        resetAll();
    });
    dropSld.addEventListener('input', draw);
    l2Sld.addEventListener('input', draw);
    dataSel.addEventListener('change', () => { stopAuto(); resetAll(); });

    resetAll();
}

// ============================================================
// Initialize all
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initNeuralCanvas();
    initCounters();
    initScrollReveal();
    initActivationDemo();
    initNavActive();
    initProgressBars();
    initGradientDescent();
    initPerceptron();
    initNeuralNetworkViz();
    initBackpropagation();
    initCNN();
    initRNN();
    initAttention();
    initRegularization();
});
