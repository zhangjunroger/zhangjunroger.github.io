// ============================================================
// tools.js —— 课堂智慧工具箱
//   智能点名 / 随机提问 / 随堂测验 / 概念闪卡 / 课堂计时 / 随机分组 / 学习笔记
//   全部数据持久化到 localStorage，无需后端
// ============================================================

// ---------- 内置题库：随机提问（按章节） ----------
const ASK_BANK = [
    { ch: 1, q: '为什么神经网络需要非线性激活函数？如果全部去掉会变成什么？' },
    { ch: 1, q: '比较 Sigmoid 和 ReLU 的优缺点，各自适合什么场景？' },
    { ch: 1, q: '什么是梯度消失？它和激活函数有什么关系？' },
    { ch: 1, q: 'Leaky ReLU 是如何缓解"死亡 ReLU"问题的？' },
    { ch: 1, q: 'GELU、Swish 这类平滑激活函数相比 ReLU 有什么优势？' },
    { ch: 2, q: '请写出 sigmoid(z) 对 z 的导数，并说明它的最大值是多少。' },
    { ch: 2, q: '反向传播中"链式法则"是如何体现的？请用两层网络举例说明。' },
    { ch: 2, q: '交叉熵损失相比均方误差，在分类任务中有什么优势？' },
    { ch: 2, q: '什么是万能近似定理？它为什么不能否定深度网络的价值？' },
    { ch: 2, q: '如果把所有参数初始化为 0，网络训练会发生什么？为什么？' },
    { ch: 3, q: '比较 SGD、Momentum、Adam 的更新规则和适用场景。' },
    { ch: 3, q: 'Batch Normalization 为什么能加速训练？推理阶段 BN 如何工作？' },
    { ch: 3, q: 'Dropout 在训练和推理两个阶段的行为有什么不同？' },
    { ch: 3, q: 'L1 和 L2 正则化分别会产生什么效果？' },
    { ch: 3, q: '学习率过大和过小分别出现什么现象？该如何诊断和调整？' },
    { ch: 4, q: '卷积层的"局部连接"和"权值共享"分别带来什么好处？' },
    { ch: 4, q: '输入 32×32，卷积核 5×5，padding=2，stride=1，输出特征图多大？' },
    { ch: 4, q: '池化层有哪些作用？MaxPooling 和 AveragePooling 有何区别？' },
    { ch: 4, q: 'ResNet 的残差连接为什么能让上百层网络正常训练？' },
    { ch: 4, q: '什么是感受野？两层 3×3 卷积叠加后的感受野是多大？' },
    { ch: 5, q: 'RNN 为什么会出现梯度爆炸和梯度消失？如何缓解？' },
    { ch: 5, q: 'LSTM 的遗忘门、输入门、输出门各自的作用是什么？' },
    { ch: 5, q: 'GRU 与 LSTM 有什么区别？谁的参数更少？' },
    { ch: 5, q: '什么是 Truncated BPTT？为什么训练 RNN 需要它？' },
    { ch: 5, q: '双向 RNN 为什么不适合做语言模型？' },
    { ch: 6, q: 'Self-Attention 的时间和空间复杂度是多少？瓶颈在哪里？' },
    { ch: 6, q: '注意力机制为什么需要位置编码？正弦位置编码有什么优点？' },
    { ch: 6, q: '多头注意力中"多头"的意义是什么？' },
    { ch: 6, q: 'Transformer 的 Encoder 自注意力与 Decoder 交叉注意力有何不同？' },
    { ch: 6, q: 'BERT 和 GPT 的预训练目标有什么本质区别？' },
    { ch: 7, q: '写出 GAN 的目标函数。达到纳什均衡时判别器输出是多少？' },
    { ch: 7, q: '什么是模式塌缩（Mode Collapse）？有哪些缓解方法？' },
    { ch: 7, q: 'VAE 的损失函数由哪两部分组成？各起什么作用？' },
    { ch: 7, q: '简述扩散模型的前向过程和反向过程。' },
    { ch: 7, q: '为什么扩散模型比 GAN 训练更稳定？' },
    { ch: 8, q: '迁移学习中"冻结底层、微调顶层"的原理是什么？' },
    { ch: 8, q: '列举至少三种图像数据增强方法，并解释为什么有效。' },
    { ch: 8, q: '什么样的场景适合零样本/少样本学习？' },
    { ch: 8, q: '模型压缩有哪些常用手段？' },
    { ch: 8, q: '评价一个分类模型，除了 accuracy 还应关注哪些指标？为什么？' }
];

// ---------- 内置题库：随堂测验选择题 ----------
const QUIZ_BANK = [
    { ch: 1, q: '以下哪种激活函数在负区间的导数恒为一个小常数（如 0.01）？',
      o: ['Sigmoid', 'ReLU', 'Leaky ReLU', 'Tanh'], a: 2,
      e: 'Leaky ReLU 负区间输出 0.01x，导数恒为 0.01，避免神经元死亡。' },
    { ch: 1, q: 'Sigmoid 函数导数的最大值是？',
      o: ['1', '0.5', '0.25', '0.1'], a: 2,
      e: 'σ\'(x)=σ(1−σ)，在 x=0 处取最大值 0.25。多层连乘极易导致梯度消失。' },
    { ch: 1, q: '如果去掉神经网络中所有激活函数，深度为 L 的网络等价于？',
      o: ['更深的非线性网络', '单层线性变换', '决策树', '无法训练'], a: 1,
      e: '线性变换的复合仍是线性变换，多层等价于一层。' },
    { ch: 2, q: '反向传播算法本质上是利用什么法则高效计算梯度？',
      o: ['贝叶斯法则', '链式法则', '大数定律', '中心极限定理'], a: 1,
      e: '反向传播 = 链式法则 + 动态规划复用中间结果，一次反向遍历得到全部参数梯度。' },
    { ch: 2, q: '二分类输出层最常用的激活函数和损失组合是？',
      o: ['Softmax + MSE', 'Sigmoid + 交叉熵', 'ReLU + Hinge', 'Tanh + MAE'], a: 1,
      e: 'Sigmoid 输出 (0,1) 概率，配交叉熵时梯度恰为 (预测−真值)，训练稳定。' },
    { ch: 2, q: '一个 2→4→1 的全连接网络（含偏置）共有多少个可训练参数？',
      o: ['13', '15', '17', '9'], a: 2,
      e: '第一层 2×4+4=12，第二层 4×1+1=5，合计 12+5=17 个。' },
    { ch: 3, q: 'Adam 优化器结合了哪两种机制？',
      o: ['动量 + 自适应学习率', '正则化 + 动量', '梯度裁剪 + 退火', 'Warmup + 早停'], a: 0,
      e: 'Adam = Momentum（一阶矩）+ RMSProp（二阶矩自适应步长）+ 偏差修正。' },
    { ch: 3, q: 'Dropout 推理（测试）时的正确做法是？',
      o: ['继续随机失活', '关闭 Dropout，输出按 1/(1-p) 缩放（或训练时已用 inverted dropout）', '把失活神经元置 1', '重新训练网络'], a: 1,
      e: '推理时关闭 Dropout；inverted dropout 在训练时已除以 (1-p)，推理无需再缩放。' },
    { ch: 3, q: 'Batch Normalization 对每个 mini-batch 做什么归一化？',
      o: ['按整个数据集统计量', '按 batch 内每维特征的均值方差', '按样本范数', '按通道像素值'], a: 1,
      e: 'BN 对 batch 内每一维特征（通道）做标准化，再用可学习的 γ、β 还原表达能力。' },
    { ch: 3, q: '训练 loss 持续下降但验证 loss 开始上升，这是？',
      o: ['欠拟合', '过拟合', '梯度爆炸', '正常收敛'], a: 1,
      e: '典型过拟合信号：模型记住了训练集噪声。可用正则化/早停/数据增强缓解。' },
    { ch: 4, q: '输入 28×28、卷积核 3×3、stride=1、padding=0，输出特征图尺寸是？',
      o: ['28×28', '26×26', '25×25', '14×14'], a: 1,
      e: '(28−3)/1+1=26。' },
    { ch: 4, q: 'ResNet 残差块学习的是？',
      o: ['完整映射 H(x)', '残差映射 F(x)=H(x)−x', '恒等映射', '池化结果'], a: 1,
      e: '学习残差让网络只需拟合"增量"，恒等捷径保证梯度至少可以原样回传。' },
    { ch: 4, q: '与三层 3×3 卷积感受野相同的单层卷积核是？',
      o: ['5×5', '7×7', '9×9', '11×11'], a: 1,
      e: '每叠一层 3×3 感受野 +2，三层后 7×7；但参数量 3×(9C²) 远小于 49C²，且多了两层非线性。' },
    { ch: 5, q: 'LSTM 中决定"从细胞状态丢弃哪些信息"的是？',
      o: ['输入门', '遗忘门', '输出门', '候选记忆'], a: 1,
      e: '遗忘门 f_t=σ(W_f[h_{t-1},x_t]) 控制 c_{t-1} 中各维信息保留比例。' },
    { ch: 5, q: 'RNN 反向传播的名称是？',
      o: ['BPTT（沿时间反向传播）', 'SGD', 'Adam', 'BP-Free'], a: 0,
      e: 'Backpropagation Through Time：沿时间步展开后按普通 BP 回传。' },
    { ch: 6, q: 'Self-Attention 中，注意力权重由哪两个矩阵运算后经 Softmax 得到？',
      o: ['Q 与 V', 'Q 与 K', 'K 与 V', 'X 与 X'], a: 1,
      e: 'softmax(QKᵀ/√d_k) 得到权重，再对 V 加权求和。Q 查询、K 键、V 值。' },
    { ch: 6, q: '注意力打分除以 √d_k 的目的是？',
      o: ['加速计算', '防止点积过大导致 softmax 饱和', '增加非线性', '减少参数'], a: 1,
      e: '维度大时点积方差大，softmax 趋向 one-hot、梯度趋零；缩放保持梯度健康。' },
    { ch: 6, q: 'Transformer 相对 RNN 的最大优势是？',
      o: ['参数更少', '训练时可完全并行', '不需要数据', '只能处理文本'], a: 1,
      e: '自注意力一步连接所有位置，摆脱了 RNN 的时序依赖，可大规模并行训练。' },
    { ch: 7, q: 'GAN 训练达到理想均衡时，判别器 D(x) 输出？',
      o: ['恒为 0', '恒为 1', '恒为 0.5', '随机震荡'], a: 2,
      e: '生成分布=真实分布时 D 无法区分真假，输出恒 0.5，此时 L_D=ln2。' },
    { ch: 7, q: '扩散模型反向过程学习的是？',
      o: ['直接生成原始图像的网络', '每一步去噪的转移（或预测噪声 ε）', '分类边界', '编码器均值方差'], a: 1,
      e: '反向过程训练网络从 x_t 预测 x_{t-1}（等价预测所加噪声），迭代去噪生成样本。' }
];

// ---------- 内置卡组：概念闪卡 ----------
const FLASH_DECK = [
    { ch: 1, f: '感知机 (Perceptron)', b: '最早的人工神经元模型：y = sign(wᵀx + b)。线性可分数据必收敛（感知机收敛定理），但无法解决 XOR。' },
    { ch: 1, f: '激活函数的作用', b: '引入非线性。没有激活函数，多层网络等价于单层线性变换。' },
    { ch: 1, f: 'Sigmoid', b: 'σ(x)=1/(1+e⁻ˣ)，输出 (0,1)。缺点：两端梯度趋零（梯度消失）、输出非零中心。' },
    { ch: 1, f: 'ReLU', b: 'f(x)=max(0,x)。计算高效、正区间梯度恒 1，缓解梯度消失；缺点是神经元可能"死亡"。' },
    { ch: 2, f: '前向传播', b: 'zˡ=Wˡhˡ⁻¹+bˡ，hˡ=φ(zˡ)。逐层线性变换+非线性激活，得到预测输出。' },
    { ch: 2, f: '反向传播', b: '利用链式法则从输出向输入逐层回传梯度：∂L/∂wˡ = 上游梯度 × Wˡ⁺¹ × φ\'(zˡ)。' },
    { ch: 2, f: '交叉熵损失', b: 'L=−Σ yₖ ln pₖ。与 Softmax 配套时梯度恰为 p−y，训练高效且不易陷平坦区。' },
    { ch: 2, f: '万能近似定理', b: '单隐层足够宽即可近似任意连续函数——但宽度需求指数级，深度才是高效的关键。' },
    { ch: 3, f: 'Momentum 动量', b: 'v=μv−η∇L，θ+=v。累积历史梯度形成惯性，冲过小坑、抑制震荡。' },
    { ch: 3, f: 'Adam', b: '一阶矩（动量）+二阶矩（自适应步长）+偏差修正，深度学习默认优化器。' },
    { ch: 3, f: 'Batch Normalization', b: '对 batch 内每维特征标准化后用 γ、β 仿射变换。稳定分布、加速收敛、轻微正则化。' },
    { ch: 3, f: 'Dropout', b: '训练时以概率 p 随机失活神经元，强迫冗余表达；推理时关闭。经典正则化手段。' },
    { ch: 3, f: 'L2 正则化 (Weight Decay)', b: '损失加 λ‖W‖²，约束权重幅值使函数更平滑，缓解过拟合。' },
    { ch: 3, f: 'Xavier / He 初始化', b: '保持前向方差不变的权重初始化。Xavier 配 tanh，He 配 ReLU，防止梯度消失/爆炸。' },
    { ch: 4, f: '权值共享', b: '同一卷积核滑过整幅图，参数量与图像大小无关——CNN 参数远小于全连接的核心原因。' },
    { ch: 4, f: '感受野', b: '某层输出上的一个点对应输入图上的区域。叠两层 3×3 卷积感受野 5×5，参数更省、非线性更多。' },
    { ch: 4, f: 'Max Pooling', b: '窗口内取最大值下采样。提供平移不变性、减少计算量；无可学习参数。' },
    { ch: 4, f: '残差连接 (ResNet)', b: '输出 = F(x)+x。让梯度经恒等捷径直接回传，使百层、千层网络可训练。' },
    { ch: 5, f: 'RNN 隐状态', b: 'h_t=tanh(W_hh·h_{t-1}+W_xh·x_t)。在时间步之间传递记忆，权重沿时间共享。' },
    { ch: 5, f: 'LSTM 门控机制', b: '遗忘门控制丢弃、输入门控制写入、输出门控制读出；细胞状态 c_t 是信息高速公路。' },
    { ch: 5, f: 'GRU', b: '把 LSTM 三门简化为更新门+重置门两门，参数更少，效果常常相当。' },
    { ch: 6, f: 'Self-Attention', b: 'softmax(QKᵀ/√d_k)V：每个位置直接与所有位置建立关系，一步全局依赖、可完全并行。' },
    { ch: 6, f: '多头注意力', b: '并行 h 组独立的 QKV 投影再拼接，让不同子空间学习不同类型的关系。' },
    { ch: 6, f: '位置编码', b: '注意力本身无序，需要注入位置信息。正弦编码可外推到训练未见长度。' },
    { ch: 7, f: 'GAN', b: '生成器与判别器极小极大博弈。均衡时生成分布=真实分布，D 输出恒 0.5。' },
    { ch: 7, f: '模式塌缩', b: '生成器只输出少数几种样本骗过判别器。缓解： minibatch 判别、方差正则、WGAN 等。' },
    { ch: 7, f: '自编码器', b: '编码-重构的自监督网络。瓶颈层迫使模型学习数据的低维流形表示。' },
    { ch: 7, f: '扩散模型', b: '前向逐步加噪至纯噪声（有闭式解），反向学习逐步去噪。Stable Diffusion 的核心原理。' }
];

// ============================================================
// 工具函数
// ============================================================
function toolsLS(key, val) {
    try {
        if (val === undefined) {
            const v = localStorage.getItem('zhkc_' + key);
            return v ? JSON.parse(v) : null;
        }
        localStorage.setItem('zhkc_' + key, JSON.stringify(val));
    } catch (e) { return null; }
}

function toolsShuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function toolsGetRoster() {
    const clsInput = document.getElementById('rcClassName');
    const key = 'rc_' + (clsInput ? (clsInput.value.trim() || 'default') : 'default');
    const saved = toolsLS(key);
    if (saved && saved.roster && saved.roster.length) return saved.roster;
    const ta = document.getElementById('rcRoster');
    if (ta) {
        const names = ta.value.split(String.fromCharCode(10)).map(x => x.trim()).filter(Boolean);
        if (names.length) return names;
    }
    return [];
}

// ============================================================
// 模块 1：智能点名
// ============================================================
function initRollCall() {
    const clsInput  = document.getElementById('rcClassName');
    const rosterTa  = document.getElementById('rcRoster');
    const saveBtn   = document.getElementById('rcSave');
    const countEl   = document.getElementById('rcCount');
    const slotEl    = document.getElementById('rcSlot');
    const startBtn  = document.getElementById('rcStart');
    const resultEl  = document.getElementById('rcResult');
    const histEl    = document.getElementById('rcHistory');
    const statsEl   = document.getElementById('rcStats');
    const noRepeat  = document.getElementById('rcNoRepeat');
    const sampleBtn = document.getElementById('rcLoadSample');
    const resetBtn  = document.getElementById('rcResetHist');
    if (!slotEl) return;

    const SAMPLE = ['王子涵','李思远','张雨欣','陈嘉豪','刘一诺','赵梓萱','孙浩然','周诗琪',
        '吴宇轩','郑晓彤','冯天佑','陈雨桐','蒋子墨','韩梦瑶','杨紫涵','李嘉懿',
        '朱泓睿','秦诗涵','许志远','何欣怡','吕明轩','施静姝','张启铭','孔令仪',
        '曹俊熙','严语嫣','华子豪','金雨薇','魏晨曦','陶思成','姜睿哲','戚晓萌',
        '谢承宇','邹婉婷','喻明哲','柏静怡'];

    let rolling = false;
    let rollTimer = null;

    function clsKey() { return 'rc_' + (clsInput.value.trim() || 'default'); }

    function getRoster() {
        return rosterTa.value.split('\n').map(s => s.trim()).filter(Boolean);
    }

    function refreshCount() {
        const n = getRoster().length;
        countEl.textContent = n ? `共 ${n} 名学生` : '名单为空';
    }

    function loadClass() {
        const data = toolsLS(clsKey());
        rosterTa.value = data && data.roster ? data.roster.join('\n') : SAMPLE.join('\n');
        refreshCount();
        renderHistory();
    }

    function getHistory() { return toolsLS(clsKey() + '_hist') || []; }

    function renderHistory() {
        const hist = getHistory();
        histEl.innerHTML = hist.length ? '' : '<li class="tool-hint" style="cursor:default">暂无记录，点击「开始点名」</li>';
        hist.forEach((h, idx) => {
            const li = document.createElement('li');
            if (h.absent) li.className = 'absent';
            li.innerHTML = `<span class="rc-n">${idx + 1}.</span><span>${h.name}</span>`
                + (h.absent ? '<span class="rc-x">缺勤</span>' : '')
                + `<span class="rc-time">${h.time}</span>`;
            li.title = '点击切换 出勤/缺勤';
            li.addEventListener('click', () => {
                const arr = getHistory();
                arr[idx].absent = !arr[idx].absent;
                toolsLS(clsKey() + '_hist', arr);
                renderHistory();
            });
            histEl.appendChild(li);
        });
        // 统计
        if (hist.length) {
            const absent = hist.filter(h => h.absent).length;
            const uniq = new Set(hist.map(h => h.name)).size;
            statsEl.textContent = `已点名 ${hist.length} 次 · 覆盖 ${uniq} 人 · 缺勤 ${absent} 人`;
        } else {
            statsEl.textContent = '';
        }
    }

    function pickRandom() {
        let pool = getRoster();
        if (!pool.length) return null;
        if (noRepeat.checked) {
            const called = new Set(getHistory().map(h => h.name));
            const remain = pool.filter(n => !called.has(n));
            if (remain.length) pool = remain;
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function stopRoll(showLucky) {
        rolling = false;
        clearInterval(rollTimer);
        rollTimer = null;
        slotEl.classList.remove('rolling');
        const name = pickRandom();
        if (!name) {
            slotEl.textContent = '名单为空';
            slotEl.classList.remove('lucky');
            return;
        }
        slotEl.textContent = name;
        if (showLucky !== false) {
            slotEl.classList.add('lucky');
            resultEl.textContent = '🎉 请 ' + name + ' 同学回答问题';
            const hist = getHistory();
            const now = new Date();
            hist.unshift({
                name,
                time: now.toTimeString().slice(0, 8),
                absent: false
            });
            toolsLS(clsKey() + '_hist', hist);
            renderHistory();
        }
    }

    startBtn.addEventListener('click', () => {
        if (!getRoster().length) { slotEl.textContent = '请先保存名单'; return; }
        if (rolling) {
            stopRoll(true);
            startBtn.textContent = '▶ 开始点名';
            return;
        }
        slotEl.classList.remove('lucky');
        slotEl.classList.add('rolling');
        startBtn.textContent = '⏸ 停止';
        resultEl.textContent = '';
        rolling = true;
        let speed = 45;
        const names = getRoster();
        rollTimer = setInterval(() => {
            slotEl.textContent = names[Math.floor(Math.random() * names.length)];
        }, speed);
        // 自动减速停止：2.2s 后自动停
        clearTimeout(stopRoll._t);
        stopRoll._t = setTimeout(() => {
            if (rolling) {
                stopRoll(true);
                startBtn.textContent = '▶ 开始点名';
            }
        }, 2200);
    });

    saveBtn.addEventListener('click', () => {
        toolsLS(clsKey(), { roster: getRoster() });
        refreshCount();
        countEl.textContent += ' ✓ 已保存';
        setTimeout(refreshCount, 1500);
    });

    sampleBtn.addEventListener('click', () => {
        rosterTa.value = SAMPLE.join('\n');
        refreshCount();
    });

    resetBtn.addEventListener('click', () => {
        toolsLS(clsKey() + '_hist', []);
        renderHistory();
        slotEl.classList.remove('lucky');
        slotEl.textContent = '准备就绪';
        resultEl.textContent = '';
    });

    clsInput.addEventListener('change', loadClass);
    rosterTa.addEventListener('input', refreshCount);
    loadClass();
}

// ============================================================
// 模块 2：随机提问
// ============================================================
function initAskQuestion() {
    const chSel    = document.getElementById('aqChapter');
    const linkRoll = document.getElementById('aqLinkRoll');
    const drawBtn  = document.getElementById('aqDraw');
    const anotherBtn = document.getElementById('aqAnother');
    const chTag    = document.getElementById('aqChapterTag');
    const stuBadge = document.getElementById('aqStudentBadge');
    const qEl      = document.getElementById('aqQuestion');
    const statsEl  = document.getElementById('aqStats');
    const goodBtn  = document.getElementById('aqGood');
    const badBtn   = document.getElementById('aqBad');
    if (!qEl) return;

    let asked = toolsLS('askq_stats') || { good: 0, bad: 0 };
    let curQ = null;

    function statsText() {
        return `累计提问 ${asked.good + asked.bad} 次 · 优秀 ${asked.good} · 待加强 ${asked.bad}`;
    }

    function draw() {
        const ch = parseInt(chSel.value);
        const pool = ch === 0 ? ASK_BANK : ASK_BANK.filter(x => x.ch === ch);
        if (!pool.length) return;
        curQ = pool[Math.floor(Math.random() * pool.length)];
        chTag.textContent = '第 ' + curQ.ch + ' 章';
        chTag.style.display = '';
        qEl.textContent = curQ.q;
        // 联动学生
        if (linkRoll.checked) {
            const roster = toolsGetRoster();
            if (roster.length) {
                const stu = roster[Math.floor(Math.random() * roster.length)];
                stuBadge.textContent = '🙋 ' + stu;
                stuBadge.style.display = '';
            } else {
                stuBadge.textContent = '（无名单，仅抽题）';
                stuBadge.style.display = '';
            }
        } else {
            stuBadge.style.display = 'none';
        }
    }

    function mark(type) {
        if (!curQ) return;
        asked[type]++;
        toolsLS('askq_stats', asked);
        statsEl.textContent = statsText();
        qEl.textContent += type === 'good' ? '   ✓' : '   ✗';
    }

    drawBtn.addEventListener('click', draw);
    anotherBtn.addEventListener('click', draw);
    goodBtn.addEventListener('click', () => mark('good'));
    badBtn.addEventListener('click', () => mark('bad'));
    statsEl.textContent = statsText();
}

// ============================================================
// 模块 3：随堂测验
// ============================================================
function initQuiz() {
    const setupEl  = document.getElementById('quizSetup');
    const runEl    = document.getElementById('quizRun');
    const resultEl = document.getElementById('quizResult');
    const chSel    = document.getElementById('qzChapter');
    const cntSel   = document.getElementById('qzCount');
    const timeSel  = document.getElementById('qzTime');
    const startBtn = document.getElementById('qzStart');
    const progEl   = document.getElementById('qzProgress');
    const timerEl  = document.getElementById('qzTimer');
    const barEl    = document.getElementById('qzBarFill');
    const qEl      = document.getElementById('qzQuestion');
    const optEl    = document.getElementById('qzOptions');
    const expEl    = document.getElementById('qzExplain');
    const nextBtn  = document.getElementById('qzNext');
    const scoreEl  = document.getElementById('qzScore');
    const reviewEl = document.getElementById('qzReview');
    const restartBtn = document.getElementById('qzRestart');
    const bestEl   = document.getElementById('qzBest');
    if (!qEl) return;

    let questions = [], idx = 0, correct = 0, records = [];
    let timeLeft = 0, timerId = null;

    function bestKey() { return 'quiz_best_ch' + chSel.value; }
    function showBest() {
        const b = toolsLS(bestKey());
        bestEl.textContent = b ? `本章节最佳成绩：${b.score}/${b.total}` : '';
    }

    function startQuiz() {
        const ch = parseInt(chSel.value);
        let pool = ch === 0 ? QUIZ_BANK : QUIZ_BANK.filter(x => x.ch === ch);
        if (pool.length < 2) { bestEl.textContent = '该章节题库题目不足，请选择其他章节'; return; }
        const n = Math.min(parseInt(cntSel.value), pool.length);
        questions = toolsShuffle(pool).slice(0, n);
        idx = 0; correct = 0; records = [];
        setupEl.style.display = 'none';
        resultEl.style.display = 'none';
        runEl.style.display = '';
        showQuestion();
    }

    function showQuestion() {
        const q = questions[idx];
        progEl.textContent = `第 ${idx + 1} / ${questions.length} 题 · 已答对 ${correct}`;
        barEl.style.width = (idx / questions.length * 100) + '%';
        qEl.textContent = q.q;
        expEl.textContent = '';
        nextBtn.style.display = 'none';
        optEl.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];
        q.o.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = letters[i] + '. ' + opt;
            btn.addEventListener('click', () => answer(i, btn));
            optEl.appendChild(btn);
        });
        // 计时
        clearInterval(timerId);
        const limit = parseInt(timeSel.value);
        if (limit > 0) {
            timeLeft = limit;
            timerEl.textContent = '⏱ ' + timeLeft + 's';
            timerId = setInterval(() => {
                timeLeft--;
                timerEl.textContent = '⏱ ' + timeLeft + 's';
                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    answer(-1, null);   // 超时
                }
            }, 1000);
        } else {
            timerEl.textContent = '⏱ 不限时';
        }
    }

    function answer(pick, btn) {
        clearInterval(timerId);
        const q = questions[idx];
        const ok = pick === q.a;
        if (ok) correct++;
        records.push({ q: q.q, ok, right: q.o[q.a], pick: pick >= 0 ? q.o[pick] : '（超时未答）', e: q.e });
        [...optEl.children].forEach((b, i) => {
            b.disabled = true;
            if (i === q.a) b.classList.add('correct');
            else if (b === btn) b.classList.add('wrong');
        });
        if (pick === -1) optEl.querySelectorAll('.quiz-option')[q.a].classList.add('correct');
        expEl.innerHTML = (ok ? '<strong style="color:#86efac">✓ 回答正确！</strong> ' : '<strong style="color:#fca5a5">✗ 回答错误。</strong> ') + q.e;
        nextBtn.style.display = '';
        nextBtn.textContent = idx === questions.length - 1 ? '查看成绩 →' : '下一题 →';
    }

    function nextQuestion() {
        idx++;
        if (idx >= questions.length) showResult();
        else showQuestion();
    }

    function showResult() {
        runEl.style.display = 'none';
        resultEl.style.display = '';
        scoreEl.textContent = `${correct} / ${questions.length}  （${Math.round(correct / questions.length * 100)} 分）`;
        window.trackEvent && trackEvent('随堂测验', '完成测验', correct + '/' + questions.length);
        // 记录最佳
        const prev = toolsLS(bestKey());
        if (!prev || correct > prev.score) {
            toolsLS(bestKey(), { score: correct, total: questions.length });
        }
        reviewEl.innerHTML = records.map((r, i) =>
            `<div class="quiz-review-item ${r.ok ? 'ok' : 'bad'}">`
            + `${r.ok ? '✓' : '✗'} 第${i + 1}题：${r.q}`
            + (r.ok ? '' : `<br>你的答案：${r.pick} · 正确答案：${r.right}`)
            + `<br><span style="color:#64748b">${r.e}</span></div>`
        ).join('');
        showBest();
    }

    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', () => {
        resultEl.style.display = 'none';
        setupEl.style.display = '';
        showBest();
    });
    chSel.addEventListener('change', showBest);
    showBest();
}

// ============================================================
// 模块 4：概念闪卡
// ============================================================
function initFlashcards() {
    const chSel    = document.getElementById('flChapter');
    const shuffleBtn = document.getElementById('flShuffle');
    const counterEl  = document.getElementById('flCounter');
    const cardEl   = document.getElementById('flashCard');
    const frontEl  = document.getElementById('flashFront');
    const backEl   = document.getElementById('flashBack');
    const prevBtn  = document.getElementById('flPrev');
    const nextBtn  = document.getElementById('flNext');
    const knowBtn  = document.getElementById('flKnow');
    const unknowBtn = document.getElementById('flUnknow');
    const statsEl  = document.getElementById('flStats');
    if (!cardEl) return;

    let deck = [], idx = 0, stats = { know: 0, unknow: 0 };

    function buildDeck() {
        const ch = parseInt(chSel.value);
        deck = toolsShuffle(ch === 0 ? FLASH_DECK : FLASH_DECK.filter(c => c.ch === ch));
        idx = 0;
        render();
    }

    function render() {
        if (!deck.length) return;
        const c = deck[idx];
        cardEl.classList.remove('flipped');
        // 等翻回正面再换内容
        setTimeout(() => {
            frontEl.innerHTML = c.f + `<span class="flash-tag">第${c.ch}章</span>`;
            backEl.innerHTML = c.b + `<span class="flash-tag">第${c.ch}章</span>`;
        }, cardEl.classList.contains('flipped') ? 260 : 0);
        counterEl.textContent = `${idx + 1} / ${deck.length}`;
        statsEl.textContent = `本次复习：认识 ${stats.know} · 不认识 ${stats.unknow}`;
    }

    cardEl.addEventListener('click', () => cardEl.classList.toggle('flipped'));
    prevBtn.addEventListener('click', () => { idx = (idx - 1 + deck.length) % deck.length; render(); });
    nextBtn.addEventListener('click', () => { idx = (idx + 1) % deck.length; render(); });
    shuffleBtn.addEventListener('click', buildDeck);
    knowBtn.addEventListener('click', () => { stats.know++; idx = (idx + 1) % deck.length; render(); });
    unknowBtn.addEventListener('click', () => { stats.unknow++; idx = (idx + 1) % deck.length; render(); });
    chSel.addEventListener('change', buildDeck);
    buildDeck();
}

// ============================================================
// 模块 5：课堂计时
// ============================================================
function initTimer() {
    const ringEl   = document.getElementById('timerRing');
    const timeEl   = document.getElementById('timerTime');
    const subEl    = document.getElementById('timerSub');
    const startBtn = document.getElementById('timerStart');
    const resetBtn = document.getElementById('timerReset');
    const setBtn   = document.getElementById('timerSet');
    const customEl = document.getElementById('timerCustom');
    if (!ringEl) return;

    let total = 300, remain = 300;
    let running = false, timerId = null;

    function fmt(s) {
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }

    function render() {
        timeEl.textContent = fmt(remain);
        const pct = total > 0 ? remain / total * 100 : 100;
        ringEl.style.setProperty('--p', pct);
        ringEl.classList.toggle('urgent', running && pct <= 20);
        document.title = running ? '⏳ ' + fmt(remain) + ' - NN&DL' : '神经网络与深度学习 - 智慧课程系统';
    }

    function beep() {
        try {
            const actx = new (window.AudioContext || window.webkitAudioContext)();
            [0, 0.35, 0.7].forEach(delay => {
                const o = actx.createOscillator();
                const g = actx.createGain();
                o.connect(g); g.connect(actx.destination);
                o.frequency.value = 880; o.type = 'sine';
                g.gain.setValueAtTime(0.3, actx.currentTime + delay);
                g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + delay + 0.28);
                o.start(actx.currentTime + delay);
                o.stop(actx.currentTime + delay + 0.3);
            });
        } catch (e) {}
    }

    function tick() {
        remain--;
        if (remain <= 0) {
            remain = 0;
            render();
            stop();
            subEl.textContent = '⏰ 时间到！';
            window.trackEvent && trackEvent('课堂计时', '计时结束', fmt(total));
            beep();
            return;
        }
        render();
    }

    function start() {
        if (running) {
            stop();
            subEl.textContent = '已暂停';
            startBtn.textContent = '▶ 继续';
            return;
        }
        if (remain <= 0) { remain = total; }
        running = true;
        startBtn.textContent = '⏸ 暂停';
        subEl.textContent = '计时中…';
        timerId = setInterval(tick, 1000);
    }

    function stop() {
        running = false;
        clearInterval(timerId);
        timerId = null;
        if (subEl.textContent !== '⏰ 时间到！') subEl.textContent = '已暂停';
        startBtn.textContent = '▶ 开始';
    }

    function setMinutes(m) {
        stop();
        total = Math.round(m * 60);
        remain = total;
        subEl.textContent = '练习计时';
        render();
    }

    startBtn.addEventListener('click', start);
    resetBtn.addEventListener('click', () => { setMinutes(total / 60); });
    setBtn.addEventListener('click', () => {
        const v = parseFloat(customEl.value);
        if (v > 0 && v <= 90) setMinutes(v);
    });
    document.querySelectorAll('.timer-preset').forEach(b => {
        b.addEventListener('click', () => setMinutes(parseInt(b.dataset.min)));
    });
    render();
}

// ============================================================
// 模块 6：随机分组
// ============================================================
function initGroupSplit() {
    const rosterTa = document.getElementById('gRoster');
    const modeSel  = document.getElementById('gMode');
    const numEl    = document.getElementById('gNum');
    const goBtn    = document.getElementById('gGo');
    const shuffleBtn = document.getElementById('gShuffle');
    const outEl    = document.getElementById('gResults');
    if (!outEl) return;

    const COLORS = [
        ['rgba(99,102,241,0.14)', '#a5b4fc'], ['rgba(236,72,153,0.12)', '#f9a8d4'],
        ['rgba(34,197,94,0.12)', '#86efac'], ['rgba(245,158,11,0.12)', '#fcd34d'],
        ['rgba(59,130,246,0.14)', '#93c5fd'], ['rgba(139,92,246,0.14)', '#c4b5fd']
    ];

    function rosterPool() {
        let names = rosterTa.value.split('\n').map(s => s.trim()).filter(Boolean);
        if (!names.length) names = toolsGetRoster();
        return names;
    }

    function split() {
        const names = rosterPool();
        if (!names.length) {
            outEl.innerHTML = '<div class="tool-hint">名单为空，请先粘贴学生姓名或保存点名名单</div>';
            return;
        }
        const shuffled = toolsShuffle(names);
        const mode = modeSel.value;
        const num = Math.max(2, parseInt(numEl.value) || 4);
        let groupCount, groups = [];
        if (mode === 'count') {
            groupCount = Math.min(num, names.length);
        } else {
            groupCount = Math.ceil(names.length / num);
        }
        for (let i = 0; i < groupCount; i++) groups.push([]);
        shuffled.forEach((n, i) => groups[i % groupCount].push(n));

        outEl.innerHTML = '';
        groups.forEach((g, i) => {
            const [bg, border] = COLORS[i % COLORS.length];
            const card = document.createElement('div');
            card.className = 'g-card';
            card.style.background = bg;
            card.style.borderColor = border;
            card.innerHTML = `<h5 style="color:${border}">第 ${i + 1} 组（${g.length}人）</h5>`
                + '<ul>' + g.map(n => '<li>' + n + '</li>').join('') + '</ul>';
            outEl.appendChild(card);
        });
    }

    goBtn.addEventListener('click', split);
    shuffleBtn.addEventListener('click', split);
}

// ============================================================
// 模块 7：学习笔记
// ============================================================
function initNotes() {
    const chSel  = document.getElementById('nChapter');
    const textEl = document.getElementById('nText');
    const statusEl = document.getElementById('nStatus');
    const exportBtn = document.getElementById('nExport');
    const charsEl = document.getElementById('nChars');
    if (!textEl) return;

    let saveTimer = null;

    function key() { return 'notes_ch' + chSel.value; }

    function load() {
        textEl.value = toolsLS(key()) || '';
        updateChars();
        statusEl.textContent = '';
    }

    function updateChars() {
        const n = textEl.value.length;
        charsEl.textContent = n ? n + ' 字' : '';
    }

    textEl.addEventListener('input', () => {
        updateChars();
        statusEl.textContent = '编辑中…';
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            toolsLS(key(), textEl.value);
            const now = new Date();
            statusEl.textContent = '✓ 已自动保存 ' + now.toTimeString().slice(0, 8);
        }, 800);
    });

    chSel.addEventListener('change', load);

    exportBtn.addEventListener('click', () => {
        const content = '《神经网络与深度学习》学习笔记\n'
            + '章节：' + chSel.options[chSel.selectedIndex].text + '\n'
            + '导出时间：' + new Date().toLocaleString() + '\n'
            + '----------------------------------------\n\n' + textEl.value;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '笔记_第' + chSel.value + '章.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    load();
}

// ============================================================
// 工具箱标签切换
// ============================================================
function initToolsTabs() {
    const tabs = document.querySelectorAll('.tool-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById('tool-' + tab.dataset.tool);
            if (panel) panel.classList.add('active');
        });
    });
}

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initToolsTabs();
    initRollCall();
    initAskQuestion();
    initQuiz();
    initFlashcards();
    initTimer();
    initGroupSplit();
    initNotes();
});
