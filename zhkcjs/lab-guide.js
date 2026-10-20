// ============================================================
// lab-guide.js —— 实验平台「分步操作引导 + 操作-可视化联动」系统
//   · 每个实验注入一张引导卡片：操作步骤 → 点击高亮对应控件与画布区域
//   · 步骤说明「操作什么 / 在画面哪里观察 / 得出什么结论」
//   · 联动：操作任意控件时，其影响的可视化区域闪烁提示（affect 映射）
//   · 画布区域用 DOM 覆盖框标注（随画布缩放自适应），不干扰绘制
//   依赖：index.html 实验区 DOM；analytics.js（trackEvent）
// ============================================================
window.LabGuide = (function () {
    'use strict';

    // ============================================================
    // 17 个实验的引导配置
    //   regions: 画布像素坐标区域（与 draw 代码坐标一致），r 指向其键名
    //   affect : 控件 id → 受影响区域键名（操作时闪烁）
    //   steps  : t=目标控件 id；r=重点观察区域；ops/obs/con=三类标注
    // ============================================================
    const LABS = {
        // ---------- 实验 1 激活函数 ----------
        'lab-act': {
            canvas: 'activationCanvas',
            regions: {
                curve: { x: 50, y: 30, w: 420, h: 316, label: 'f(x) 曲线 / 导数曲线' }
            },
            affect: {
                activationSelect: 'curve', scaleSlider: 'curve', biasSlider: 'curve', showDerivative: 'curve'
            },
            steps: [
                { t: 'activationSelect', r: 'curve', title: '切换激活函数',
                  desc: '在下拉框中依次选择 Sigmoid → ReLU → GELU，观察蓝色函数曲线的整体形状变化：S 形曲线、单侧抑制、平滑非线性各不相同。',
                  ops: '激活函数下拉框', obs: ['函数曲线整体形状', '下方公式面板同步更新'], con: '不同激活函数 = 不同的非线性"开关特性"。' },
                { t: 'scaleSlider', r: 'curve', title: '拖动权重 w（0.1 → 3）',
                  desc: 'w 放大输入 w·x+b：曲线在水平方向被压缩（过渡更陡），导数曲线峰值按 w 倍抬高。注意观察黄色导数峰值的变化，以及右侧输入 x 与输出 y=f(wx+b) 波形的变化。',
                  ops: '权重 w 滑块', obs: ['曲线变陡/变缓', '导数峰值 = w × max f′'], con: '该层梯度的最大可能值随 w 增大——影响整层回传梯度。' },
                { t: 'biasSlider', r: 'curve', title: '拖动偏置 b（-5 → 5）',
                  desc: 'b 使曲线整体左右平移：激活"提前"或"延迟"发生，函数形状不变。',
                  ops: '偏置 b 滑块', obs: ['曲线整体水平平移', '导数曲线随之平移'], con: '偏置只平移激活时机，不改变函数形状。' },
                { t: 'showDerivative', r: 'curve', title: '开/关导数曲线',
                  desc: '取消勾选再勾选「显示导数曲线」。Sigmoid 的导数峰值只有 0.25，两端趋近 0。',
                  ops: '显示导数复选框', obs: ['黄色虚线导数曲线出现/消失', 'Sigmoid 导数峰值 0.25'], con: '导数 < 1 连乘是深层梯度消失的根源（见实验十一）。' },
                { t: 'featureDisplay', title: '阅读函数特性说明',
                  desc: '左下信息面板同步显示当前函数的表达式、导数与特性总结，切换函数时自动更新。',
                  ops: '信息面板（自动）', obs: ['函数表达式 / 导数表达式 / 特性'], con: '隐藏层首选 ReLU 家族，二分类输出层用 Sigmoid。' }
            ]
        },

        // ---------- 实验 2 梯度下降 ----------
        'lab-gd': {
            canvas: 'gdCanvas',
            regions: {
                surface: { x: 40, y: 24, w: 420, h: 316, label: '损失曲面 + 小球 + 切线' },
                chart:   { x: 40, y: 348, w: 420, h: 116, label: '损失-步数曲线' }
            },
            affect: {
                lrSlider: 'surface', momentumSlider: 'surface', initPosSlider: 'surface',
                gdPlayBtn: 'surface', gdResetBtn: 'surface'
            },
            steps: [
                { t: 'lrSlider', r: 'surface', title: '设置学习率 η',
                  desc: '先保持默认 0.05。η 是每步沿负梯度方向走多远的"步长"，直接决定收敛速度与稳定性。',
                  ops: '学习率 η 滑块', obs: ['小球单步位移 = η × 梯度'], con: 'η 过小收敛慢，过大来回震荡甚至发散。' },
                { t: 'initPosSlider', r: 'surface', title: '改变初始位置 θ₀',
                  desc: '把初始位置从 -3.0 拖到 +3.0 再开始，观察小球落入哪个"山谷"。非凸曲面上不同初值 → 不同局部极小。',
                  ops: '初始位置滑块', obs: ['小球起点移动', '最终停在不同谷底'], con: '初始化决定优化起点，深度学习中影响最终解。' },
                { t: 'gdPlayBtn', r: 'chart', title: '点击「开始」训练',
                  desc: '小球沿切线方向滚动，下方"损失-步数曲线"每步新增一个下降点，同步读取步数与当前损失。',
                  ops: '开始按钮', obs: ['小球轨迹与切线箭头', '下方损失曲线下降'], con: '梯度下降 = 反复"沿最陡方向小步走"。' },
                { t: 'momentumSlider', r: 'surface', title: '加入动量 μ = 0.9 重新训练',
                  desc: '重置后将动量调到 0.9 再开始：动量累积历史梯度，小球获得"惯性"，能冲过小坑、在平坦区加速。',
                  ops: '动量系数滑块 + 开始', obs: ['轨迹更平滑、越过浅坑', '损失曲线前期下降更快'], con: '动量 = 一步走"历史梯度的加权和"。' },
                { t: 'lrSlider', r: 'surface', title: '压力测试：η 调到 0.5',
                  desc: '把学习率拉到最大并开始：观察小球在谷壁间大幅震荡甚至飞出——这就是"学习率过大发散"。',
                  ops: '学习率调至 0.5 + 开始', obs: ['来回震荡 / 发散', '损失曲线不降反升'], con: '训练发散的第一排查项就是学习率。' }
            ]
        },

        // ---------- 实验 3 感知机 ----------
        'lab-perceptron': {
            canvas: 'perceptronCanvas',
            regions: {
                plane: { x: 36, y: 26, w: 428, h: 330, label: '散点 + 决策边界' }
            },
            affect: {
                classABtn: 'plane', classBBtn: 'plane', perceptronLrSlider: 'plane',
                perceptronTrainBtn: 'plane', perceptronClearBtn: 'plane'
            },
            steps: [
                { t: 'classABtn', r: 'plane', title: '选中「类别 A」并点击画布添加点',
                  desc: '点击按钮选中类别 A（蓝色），然后在画布左下区域点 5~8 下，每点一次添加一个 A 类样本。',
                  ops: '类别 A 按钮 + 画布点击', obs: ['画布出现蓝色样本点'], con: '监督学习的第一步是准备带标签数据。' },
                { t: 'classBBtn', r: 'plane', title: '切换「类别 B」在另一侧添加点',
                  desc: '选中类别 B（粉色），在右上区域点 5~8 下，让两类大致可分。',
                  ops: '类别 B 按钮 + 画布点击', obs: ['粉色样本点出现在另一侧'], con: '两类在空间中的分布决定"可分性"。' },
                { t: 'perceptronTrainBtn', r: 'plane', title: '点击「训练」',
                  desc: '感知机对每个误分类点执行 w ← w + η·y·x，直线决策边界随之旋转平移，直到分开两类。',
                  ops: '训练按钮', obs: ['直线边界转动调整', '训练准确率上升至 100%'], con: '线性可分时感知机收敛定理保证有限步收敛。' },
                { t: 'perceptronLrSlider', r: 'plane', title: '调大学习率再训练',
                  desc: '把 η 从 0.01 调到 0.1，清空重画同样的点再训练：边界调整"步子更大"，可能来回摆动。',
                  ops: '学习率滑块 + 清空 + 重试', obs: ['边界调整幅度变大'], con: '学习率影响收敛过程的稳定性。' },
                { t: 'perceptronClearBtn', r: 'plane', title: '挑战 XOR 分布',
                  desc: '清空后按 XOR 布局添加点（左上/右下 = A，右上/左下 = B）再训练：准确率卡在 50% 附近，直线永远分不开。',
                  ops: '清空按钮 + 按 XOR 布局加点', obs: ['准确率 ~50%', '边界怎么转都分不开'], con: '单层感知机解决不了 XOR → 需要多层网络（下一实验）。' }
            ]
        },

        // ---------- 实验 4 前向传播 ----------
        'lab-nn': {
            canvas: 'nnCanvas',
            regions: {
                net: { x: 24, y: 40, w: 472, h: 350, label: '网络结构图（激活值着色）' }
            },
            affect: {
                input1Slider: 'net', input2Slider: 'net', nnActivation: 'net',
                nnNeuronCount: 'net', nnNeuronCount2: 'net', nnBiasRange: 'net', nnResetBtn: 'net'
            },
            steps: [
                { t: 'input1Slider', r: 'net', title: '拖动输入 x₁',
                  desc: 'x₁ 从 -2 拖到 2：网络图中输入节点数值变化，连线粗细/明暗随权重×输入变化，整网激活逐层"接力"更新。',
                  ops: '输入 x₁ 滑块', obs: ['输入节点颜色变化', '隐藏层节点激活值明暗'], con: '输入改变 → 前向传播逐层重算 z 和 h。' },
                { t: 'nnActivation', r: 'net', title: '切换隐藏层激活函数',
                  desc: '在 Tanh / Sigmoid / ReLU 间切换：节点取值范围与明暗分布立刻不同（Tanh ∈ (-1,1)，ReLU 单侧抑制）。',
                  ops: '激活函数下拉框', obs: ['节点明暗分布改变', '输出值范围改变'], con: '激活函数决定每层输出的"形态"。' },
                { t: 'nnNeuronCount', r: 'net', title: '调整隐藏层神经元数量',
                  desc: '把隐藏层 1 从 2 调到 6：网络图第一列节点增减，信息面板显示的 h¹、z¹ 向量维度同步变化。',
                  ops: '隐藏层1神经元滑块', obs: ['第一层节点数变化', 'h¹ 向量长度变化'], con: 'W¹ 形状 = 本层神经元数 × 上层神经元数。' },
                { t: 'nnResetBtn', r: 'net', title: '重新随机初始化权重',
                  desc: '点击「随机权重」换一组初始化：同样的输入，输出预测不同——训练就是不断修正这些权重。',
                  ops: '随机权重按钮', obs: ['连线粗细变化', '输出层预测值变化'], con: '参数初始化影响初始预测与训练难度。' },
                { t: 'nnOutput', r: 'net', title: '读输出与预测类别',
                  desc: '右下信息面板列出 z¹/h¹、z²/h² 与输出 o：这就是前向传播的完整中间量，反向传播要复用它们。',
                  ops: '信息面板（自动）', obs: ['逐层激活值/预激活数值'], con: '缓存 z、h 是反向传播高效计算的关键。' }
            ]
        },

        // ---------- 实验 5 反向传播 ----------
        'lab-bp': {
            canvas: 'bpCanvas',
            regions: {
                net:   { x: 10, y: 60, w: 470, h: 560, label: '双层网络 + 梯度回流箭头' },
                loss:  { x: 505, y: 16, w: 325, h: 300, label: '损失 L 曲线' },
                pred:  { x: 505, y: 330, w: 325, h: 290, label: '输出 y 逼近目标 y*' }
            },
            affect: {
                bpLrSlider: 'net', bpTargetSlider: 'pred', bpW1Slider: 'net', bpB1Slider: 'net',
                bpW2Slider: 'net', bpB2Slider: 'net', bpTrainBtn: 'net', bpTrain50Btn: 'net', bpResetBtn: 'net'
            },
            steps: [
                { t: 'bpTargetSlider', r: 'pred', title: '设定目标值 y*',
                  desc: '右侧下方图中黄色虚线即目标 y*（默认 1.0）。训练目标 = 让输出 y 逼近它。',
                  ops: '目标 y* 滑块', obs: ['右下图中目标虚线移动'], con: '损失 L = ½(y − y*)² 度量差距。' },
                { t: 'bpTrainBtn', r: 'net', title: '「训练一步」：读梯度回流',
                  desc: '点一次训练：红色梯度箭头从损失出发 ∂L/∂y → ∂L/∂w₂、∂L/∂b₂ → 经 h₁ 回传到 ∂L/∂w₁、∂L/∂b₁，全部数值标注在图上。',
                  ops: '训练一步按钮', obs: ['各段偏导数值', '参数 (w,b) 同步更新', '损失曲线下降一格'], con: '链式法则：每层梯度 = 上游梯度 × 权重 × 激活导数。' },
                { t: 'bpW2Slider', r: 'net', title: '把 w₂ 调小到 0.5 再训练一步',
                  desc: 'w₂ 是梯度回传到隐藏层的"通道增益"：w₂ 变小后，∂L/∂w₁、∂L/∂b₁ 的数值显著变小。',
                  ops: '权重 w₂ 滑块 + 训练一步', obs: ['隐藏层梯度数值衰减'], con: '权重小 → 回传梯度小，这就是梯度消失的机制。' },
                { t: 'bpTrain50Btn', r: 'loss', title: '「训练 50 步」看收敛',
                  desc: '连续训练 50 步：右上损失曲线快速下降，右下 y 曲线贴向目标虚线。',
                  ops: '训练 50 步按钮', obs: ['损失曲线下降', 'y 曲线逼近 y*'], con: '梯度方向正确时，迭代就是收敛过程。' },
                { t: 'bpLrSlider', r: 'loss', title: '学习率对比',
                  desc: '重置后把 η 从 0.5 改为 0.05 再训练 50 步：下降明显变慢。η 过大时损失可能震荡。',
                  ops: '学习率滑块 + 重置 + 训练', obs: ['损失下降速度差异'], con: '学习率决定"每步走多远"。' }
            ]
        },

        // ---------- 实验 6 CNN ----------
        'lab-cnn': {
            canvas: 'cnnCanvas',
            regions: {
                input:  { x: 16, y: 56, w: 316, h: 316, label: '输入图像 + 扫描窗口' },
                output: { x: 545, y: 56, w: 305, h: 316, label: '输出特征图' }
            },
            affect: {
                cnnInputSelect: 'input', cnnKernelSelect: 'output', cnnKernelSize: 'output',
                cnnStrideSlider: 'output', cnnPadSelect: 'output', cnnPlayBtn: 'input', cnnResetBtn: 'input'
            },
            steps: [
                { t: 'cnnInputSelect', r: 'input', title: '选择输入图像',
                  desc: '切换棋盘格 / 数字"5" / 十字等输入：左侧 10×10 灰度图随之改变。',
                  ops: '输入图像下拉框', obs: ['左侧输入矩阵内容'], con: '卷积核提取的是"局部模式"，输入决定有哪些模式。' },
                { t: 'cnnKernelSelect', r: 'output', title: '选择卷积核',
                  desc: '切换 Sobel-X / Sobel-Y / 高斯模糊 / 锐化等：同一输入，右侧特征图完全不同——核就是"特征探测器"。',
                  ops: '卷积核类型下拉框', obs: ['右侧特征图响应区域变化', '核数值矩阵同步显示'], con: '不同核提取不同方向的边缘/纹理。' },
                { t: 'cnnPlayBtn', r: 'input', title: '「动画扫描」逐格卷积',
                  desc: '动画中黄色 3×3 窗口逐格滑动：窗口内元素与核对应相乘求和，得到特征图一个输出值。',
                  ops: '动画扫描按钮', obs: ['滑动窗口位置', '输出特征图逐格点亮'], con: '权值共享：同一个核扫过整张图。' },
                { t: 'cnnStrideSlider', r: 'output', title: '调步长 stride = 2',
                  desc: 'stride 从 1 调到 2：窗口每次跳 2 格，特征图尺寸缩小约一半，信息面板公式同步给出尺寸计算。',
                  ops: '步长滑块', obs: ['特征图尺寸变化', '输出尺寸公式'], con: '输出尺寸 = ⌊(N + 2p − K)/s⌋ + 1。' },
                { t: 'cnnPadSelect', r: 'output', title: '切换 valid / same 填充',
                  desc: 'padding 从 same 改 valid（或调整后观察）：不补边时输出缩小，补 1 圈可保持尺寸。',
                  ops: 'Padding 下拉框', obs: ['特征图尺寸变化'], con: 'padding 控制输出空间尺寸与边缘信息保留。' }
            ]
        },

        // ---------- 实验 7 RNN/LSTM ----------
        'lab-rnn': {
            canvas: 'rnnCanvas',
            regions: {
                unroll: { x: 16, y: 16, w: 808, h: 236, label: '时间步展开图' },
                loss:   { x: 16, y: 268, w: 396, h: 214, label: '训练 Loss 曲线' },
                pred:   { x: 428, y: 268, w: 396, h: 150, label: '预测 vs 真值' },
                gates:  { x: 428, y: 424, w: 396, h: 62, label: 'LSTM 门控状态' }
            },
            affect: {
                rnnTypeSelect: 'unroll', rnnHiddenSlider: 'unroll', rnnLrSlider: 'loss',
                rnnSeqSlider: 'unroll', rnnTrainBtn: 'loss', rnnTrain50Btn: 'loss',
                rnnAutoBtn: 'loss', rnnResetBtn: 'unroll'
            },
            steps: [
                { t: 'rnnTypeSelect', r: 'unroll', title: '选择网络结构',
                  desc: '在 Vanilla RNN / LSTM / GRU 间切换：上方展开图与下方门控条形图区域随之变化。',
                  ops: '网络类型下拉框', obs: ['展开图单元结构', '门控状态显示（仅 LSTM）'], con: '门控机制给网络加了"读/写/忘"三个阀门。' },
                { t: 'rnnTrainBtn', r: 'loss', title: '「训练 1 步」并观察',
                  desc: '每点一次：BPTT 沿时间展开回传，Loss 曲线新增一点，下方预测曲线逐渐贴合正弦真值。',
                  ops: '训练 1 步按钮', obs: ['Loss 下降', '预测曲线逼近真值'], con: 'RNN 沿时间共享同一组权重。' },
                { t: 'rnnAutoBtn', r: 'loss', title: '「持续训练」对比收敛速度',
                  desc: '开启持续训练跑到 Loss 平缓：记录 LSTM 大约多少步收敛，再重置换 Vanilla RNN 对比。',
                  ops: '持续训练按钮', obs: ['两类网络的 Loss 曲线下降速度'], con: '长序列上 LSTM/GRU 收敛明显更快。' },
                { t: 'rnnSeqSlider', r: 'unroll', title: '加长序列到 40 步',
                  desc: '序列长度从 20 调到 40（需重置训练）：展开图时间步增多，Vanilla RNN 的 Loss 更难下降——梯度连乘衰减。',
                  ops: '序列长度滑块 + 重置训练', obs: ['展开图变长', 'RNN 收敛变慢'], con: '长程依赖是 Vanilla RNN 的痛点。' },
                { t: 'rnnGates', r: 'gates', title: '读取门控状态',
                  desc: 'LSTM 模式下，底部条形图显示最后时间步遗忘门 f、输入门 i、输出门 o、候选记忆 c̃ 各维取值。',
                  ops: '信息面板（自动）', obs: ['f/i/o/c̃ 条形图数值'], con: 'f≈1 表示"保留旧记忆"，i≈1 表示"写入新记忆"。' }
            ]
        },

        // ---------- 实验 8 注意力 ----------
        'lab-attn': {
            canvas: 'attnCanvas',
            regions: {
                qkv:  { x: 60, y: 0, w: 760, h: 215, label: 'X → Q/K/V 投影' },
                heat: { x: 60, y: 215, w: 760, h: 235, label: '注意力热力图 A' },
                out:  { x: 60, y: 450, w: 760, h: 205, label: '加权输出 O' },
                mh:   { x: 40, y: 655, w: 780, h: 280, label: '多头注意力' },
                pe:   { x: 40, y: 935, w: 780, h: 120, label: '位置编码波形' }
            },
            affect: {
                attnInputSelect: 'qkv', attnHeadSlider: 'mh', attnScaleSlider: 'heat',
                attnQuerySelect: 'heat', attnShowPE: 'pe'
            },
            steps: [
                { t: 'attnInputSelect', r: 'qkv', title: '选择输入句子',
                  desc: '切换句子后：顶部词序列、词嵌入 X 与 Q/K/V 投影矩阵全部重新计算。',
                  ops: '输入句子下拉框', obs: ['词列表与矩阵维度变化'], con: '自注意力的 Q、K、V 都是 X 的线性变换。' },
                { t: 'attnQuerySelect', r: 'heat', title: '选择 Query 词',
                  desc: '热力图中黄色框选中的"行"就是当前 Query：该行颜色越亮的词，获得越多注意力（行和 = 1）。',
                  ops: 'Query 词下拉框', obs: ['热力图高亮行', '行内权重分布'], con: '每个位置都在"查询"所有位置。' },
                { t: 'attnScaleSlider', r: 'heat', title: '调节温度 √d_k',
                  desc: '缩放从 2.0 调到 0.5：点积不除大数 → Softmax 饱和，热力图接近"独热"；调大则分布更平缓。',
                  ops: '温度缩放滑块', obs: ['热力图对比度变化', '最大注意力权重数值'], con: '除以 √d_k 防止梯度消失，是稳定训练的关键细节。' },
                { t: 'attnHeadSlider', r: 'mh', title: '调整注意力头数',
                  desc: '头数从 1 调到 8：Step 6 区域出现多个独立热力图——每个头在自己的子空间学不同的关系模式。',
                  ops: '注意力头数滑块', obs: ['多头热力图数量与差异'], con: '多头 = 并行的多组 Q/K/V 投影。' },
                { t: 'attnShowPE', r: 'pe', title: '开/关位置编码波形',
                  desc: '关闭再打开：底部 sin/cos 波形消失/出现。没有位置编码，注意力对词序完全"失明"。',
                  ops: '显示位置编码复选框', obs: ['底部 PE 波形'], con: 'PE 用不同频率的三角函数注入位置信息。' }
            ]
        },

        // ---------- 实验 9 正则化 ----------
        'lab-reg': {
            canvas: 'regCanvas',
            regions: {
                maps: { x: 30, y: 40, w: 520, h: 380, label: '三个网络的决策边界' },
                acc:  { x: 570, y: 40, w: 250, h: 380, label: '训练/验证准确率' }
            },
            affect: {
                regDropSlider: 'maps', regL2Slider: 'maps', regEpochSlider: 'acc',
                regDataSelect: 'maps', regTrainBtn: 'maps', regAutoBtn: 'maps', regResetBtn: 'maps'
            },
            steps: [
                { t: 'regDataSelect', r: 'maps', title: '选择数据集',
                  desc: '切换月牙 / 同心圆 / XOR 数据：三个网络（无正则 / Dropout / L2）用完全相同的初始化各自训练。',
                  ops: '数据集下拉框', obs: ['三张散点图更新'], con: '控制变量对比：只有正则化手段不同。' },
                { t: 'regTrainBtn', r: 'acc', title: '「训练」N 个 epoch',
                  desc: '点训练（或持续训练）：右侧训练/验证准确率曲线更新。重点看两条曲线的"开口"——gap 大 = 过拟合。',
                  ops: '训练按钮', obs: ['无正则网络 train acc ≫ val acc'], con: '过拟合 = 记住了训练集噪声。' },
                { t: 'regDropSlider', r: 'maps', title: '调节 Dropout 率 p',
                  desc: 'p 从 0.3 调到 0.6：中间网络边界更平滑但训练准确率下降——随机失活强迫网络不依赖个别神经元。',
                  ops: 'Dropout 率滑块 + 训练', obs: ['中间图边界形状', 'train/val gap 变小'], con: 'Dropout 是"集成"思想的隐式实现。' },
                { t: 'regL2Slider', r: 'maps', title: '调节 L2 系数 λ',
                  desc: 'λ 从 0.01 调到 0.1：右侧网络权重被压小，边界曲率变缓——L2 用惩罚项约束模型复杂度。',
                  ops: 'L2 系数滑块 + 训练', obs: ['右图边界更平滑'], con: 'L = L_data + λ‖W‖²，λ 是复杂度"价格"。' },
                { t: 'regResetBtn', r: 'maps', title: '换数据集重复对比',
                  desc: '切到 XOR（噪声更大）重复训练：正则化的收益在噪声大的数据上更明显。',
                  ops: '重置 + 切换数据集 + 训练', obs: ['三种设置 val acc 差距'], con: '正则化是精度与泛化的权衡，不是越强越好。' }
            ]
        },

        // ---------- 实验 10 Softmax ----------
        'lab-softmax': {
            canvas: 'smCanvas',
            regions: {
                map:  { x: 46, y: 24, w: 348, h: 312, label: '决策区域 + 数据点' },
                bars: { x: 440, y: 62, w: 170, h: 252, label: '测试点 Softmax 概率' },
                loss: { x: 660, y: 62, w: 155, h: 312, label: '交叉熵损失曲线' }
            },
            affect: {
                smDataSelect: 'map', smHiddenSlider: 'map', smLrSlider: 'loss',
                smTrainBtn: 'loss', smAutoBtn: 'loss', smResetBtn: 'map'
            },
            steps: [
                { t: 'smDataSelect', r: 'map', title: '选择数据集',
                  desc: '三簇高斯团最简单，三螺旋臂最难：观察无训练时决策区域（浅色背景）的初始混乱状态。',
                  ops: '数据集下拉框', obs: ['三类数据点分布', '初始决策区域'], con: 'Softmax 输出三类概率，配合交叉熵训练。' },
                { t: 'smTrainBtn', r: 'loss', title: '「训练 50 步」',
                  desc: '训练后左侧决策区域按三类着色清晰分开，右侧交叉熵损失曲线下降，中间条形图显示固定测试点 (0.8, 0.6) 的三类概率。',
                  ops: '训练 50 步按钮', obs: ['决策区域分化', 'p₁ p₂ p₃ 条形高度', '损失下降'], con: '最大 logit 对应最高概率。' },
                { t: 'smHiddenSlider', r: 'map', title: '调整隐藏层宽度',
                  desc: '神经元从 8 到 32：宽度决定决策边界的"弯曲能力"。螺旋数据需要更宽的层。',
                  ops: '隐藏层大小滑块 + 重置训练', obs: ['边界弯曲程度变化'], con: '模型容量与数据复杂度要匹配。' },
                { t: 'smAutoBtn', r: 'loss', title: '「持续训练」观察收敛与准确率',
                  desc: '开启后信息面板实时显示训练/验证准确率：训练 acc 继续涨而验证 acc 停滞 = 过拟合苗头。',
                  ops: '持续训练按钮', obs: ['训练/验证准确率对比'], con: '验证集表现才是真实水平。' },
                { t: 'fxSoftmaxSteps', title: '观看「分步计算演示」',
                  desc: '画布下方的伴侣动画逐步点亮 logits → 取指数 → 归一化 → 交叉熵的完整计算链，每步公式与数值同步。',
                  ops: '伴侣动画（自动播放）', obs: ['四步计算列逐个点亮', '底部当前步骤算式'], con: 'Softmax + 交叉熵的梯度恰为 (p − y)。' }
            ]
        },

        // ---------- 实验 11 梯度消失/爆炸 ----------
        'lab-vanish': {
            canvas: 'vdCanvas',
            regions: {
                curve: { x: 56, y: 40, w: 660, h: 300, label: '各层梯度范数（对数）' },
                inset: { x: 736, y: 10, w: 90, h: 70, label: '前向激活值' }
            },
            affect: {
                vdActSelect: 'curve', vdDepthSlider: 'curve', vdStdSlider: 'curve',
                vdInitSelect: 'curve', vdResetBtn: 'curve'
            },
            steps: [
                { t: 'vdActSelect', r: 'curve', title: '保持 Sigmoid，观察基线',
                  desc: '20 层、σ_W=0.5 时曲线从输出层到输入层"悬崖式"下跌：第 1 层梯度比输出层小许多个数量级。',
                  ops: '激活函数下拉框', obs: ['左侧红色"梯度消失区"'], con: 'Sigmoid 导数 ≤ 0.25，逐层连乘快速衰减。' },
                { t: 'vdStdSlider', r: 'curve', title: '调大 σ_W 到 2.0',
                  desc: '权重标准差增大：曲线先整体抬高，越过临界点后深层梯度反而爆炸（超过 1e3 进入红色上区）。',
                  ops: 'σ_W 滑块', obs: ['消失 ↔ 爆炸翻转点'], con: '消失与爆炸是同一连乘机制的两种结局。' },
                { t: 'vdActSelect', r: 'curve', title: '切换 ReLU 再看',
                  desc: '激活换成 ReLU（正区导数恒为 1）：只要 σ_W 合适，梯度在各层基本保持稳定。',
                  ops: '激活函数下拉框', obs: ['梯度曲线接近平坦'], con: 'ReLU 是缓解梯度消失的第一手段。' },
                { t: 'vdInitSelect', r: 'curve', title: '应用 Xavier / He 初始化',
                  desc: '初始化方案切换为 Xavier（配 Tanh）或 He（配 ReLU）：曲线自动回到"健康区间"，这就是标准初始化的意义。',
                  ops: '初始化方案下拉框', obs: ['曲线稳定在 1e0 附近'], con: '初始化维持每层方差不变。' },
                { t: 'vdDepthSlider', r: 'curve', title: '加深到 40 层',
                  desc: '层数从 20 调到 40：即使配置正确，曲线也变得更"抖"——深度越大越依赖 BatchNorm/残差等手段。',
                  ops: '层数滑块', obs: ['曲线波动加剧'], con: '深网络训练是系统工程：初始化 + 归一化 + 残差。' }
            ]
        },

        // ---------- 实验 12 优化器 ----------
        'lab-optim': {
            canvas: 'opCanvas',
            regions: {
                contour: { x: 42, y: 32, w: 408, h: 372, label: '等高线 + 四条轨迹' },
                curves:  { x: 500, y: 72, w: 310, h: 312, label: '损失下降曲线' }
            },
            affect: {
                opLrSlider: 'contour', opLossSelect: 'contour',
                opStepBtn: 'contour', opRunBtn: 'contour', opResetBtn: 'contour'
            },
            steps: [
                { t: 'opLossSelect', r: 'contour', title: '选择损失曲面',
                  desc: 'Rosenbrock 山谷的谷底是弧形"峡谷"：梯度几乎垂直于谷底方向，最能放大各优化器的差异。',
                  ops: '损失曲面下拉框', obs: ['背景等高线形状'], con: '曲面几何决定优化的难度。' },
                { t: 'opStepBtn', r: 'contour', title: '「单步」观察四个方向',
                  desc: '每点一次单步：四色小球从同一起点各走一步，轨迹末端箭头 = 各自的负梯度方向（SGD 的方向最"原始"）。',
                  ops: '单步按钮', obs: ['四条轨迹的分歧'], con: '同一梯度，不同更新规则 → 不同路径。' },
                { t: 'opRunBtn', r: 'curves', title: '「竞速 200 步」',
                  desc: '开跑后看两处：左侧轨迹形态（谁震荡、谁走直线），右侧损失曲线（谁先降下来）。',
                  ops: '竞速 200 步按钮', obs: ['SGD 锯齿状震荡', 'Adam/RMSProp 走位更直'], con: '自适应方法对各维度缩放步长。' },
                { t: 'opLrSlider', r: 'contour', title: '调学习率再来一轮',
                  desc: '重置后把 η 调大一倍再竞速：Momentum 震荡加剧，Adam 因自适应缩放更鲁棒。',
                  ops: '学习率滑块 + 重置 + 竞速', obs: ['轨迹震荡程度变化'], con: '没有全能冠军：SGD+动量泛化常更好。' },
                { t: 'opLossSelect', r: 'contour', title: '换鞍面 / 多峰曲面',
                  desc: '切到 Saddle：SGD 容易沿鞍面溜走，Momentum 冲得快；多峰曲面则考验谁跳出局部极小。',
                  ops: '损失曲面下拉框 + 重置', obs: ['不同曲面上的收敛差异'], con: '优化器选择要与问题特性匹配。' }
            ]
        },

        // ---------- 实验 13 学习率调度 ----------
        'lab-scheduler': {
            canvas: 'schCanvas',
            regions: {
                lr:  { x: 52, y: 30, w: 752, h: 158, label: '学习率 η 曲线' },
                loss:{ x: 52, y: 246, w: 752, h: 176, label: '各策略训练损失' }
            },
            affect: {
                schSelect: 'lr', schLr0Slider: 'lr', schEpochSlider: 'loss',
                schTrainBtn: 'loss', schAutoBtn: 'loss', schResetBtn: 'loss'
            },
            steps: [
                { t: 'schSelect', r: 'lr', title: '勾选参与比较的调度策略',
                  desc: '按住 Ctrl 可多选/取消：上图画出每个策略的 η 随 epoch 变化（Step 阶梯 / Cosine 余弦 / Exp 指数 / Constant 直线）。',
                  ops: '策略多选框', obs: ['上方学习率曲线增减'], con: '调度器 = 预设的"先大后小"学习率剧本。' },
                { t: 'schLr0Slider', r: 'lr', title: '设置初始学习率 η₀',
                  desc: 'η₀ 从 0.3 拉到 1.0：所有曲线整体上移。太大的 η₀ 会让 Constant 策略训练震荡（看下方损失）。',
                  ops: '初始学习率滑块', obs: ['曲线整体高度', 'Constant 策略损失震荡'], con: '调度的前提是"起点够大、后期够小"。' },
                { t: 'schTrainBtn', r: 'loss', title: '「训练 1 轮」逐步推进',
                  desc: '每轮 = N 个梯度步：下方损失图每个策略新增一个点，各策略用同一初始化、只差学习率剧本。',
                  ops: '训练 1 轮按钮', obs: ['各色损失曲线对比'], con: '公平对比 = 相同网络/数据/初始化。' },
                { t: 'schAutoBtn', r: 'loss', title: '「持续训练」跑完 40 epoch',
                  desc: 'Cosine 后期下降最平滑；Step 在衰减点出现"台阶式"跳水；Exp 后期学习率过小近似冻结。',
                  ops: '持续训练按钮', obs: ['三种衰减形态的损失差异'], con: 'Cosine + warmup 是现代默认配置。' },
                { t: 'schEpochSlider', r: 'loss', title: '调整每轮步数',
                  desc: '每轮步数改变"1 epoch"的颗粒度：步数多 → 曲线更平滑，训练更接近连续过程。',
                  ops: '每轮步数滑块', obs: ['损失曲线平滑度'], con: '调度以 epoch 为节拍，与 batch 步数共同决定节奏。' }
            ]
        },

        // ---------- 实验 14 Playground ----------
        'lab-playground': {
            canvas: 'pgCanvas',
            regions: {
                map:  { x: 46, y: 28, w: 338, h: 328, label: '决策边界（悬停可探针）' },
                net:  { x: 434, y: 28, w: 180, h: 328, label: '网络结构（激活点亮）' },
                loss: { x: 668, y: 68, w: 150, h: 312, label: '训练损失' }
            },
            affect: {
                pgDataSelect: 'map', pgH1Slider: 'net', pgH2Slider: 'net', pgActSelect: 'net',
                pgLrSlider: 'loss', pgAutoBtn: 'loss', pgStepBtn: 'loss', pgResetBtn: 'map'
            },
            steps: [
                { t: 'pgDataSelect', r: 'map', title: '选择数据集并观察初始边界',
                  desc: '同心圆只需一个"环形"特征，螺旋最难：训练前边界是随机的浅色纹理。',
                  ops: '数据集下拉框', obs: ['数据分布形态'], con: '数据几何复杂度决定所需网络容量。' },
                { t: 'pgStepBtn', r: 'loss', title: '「单步」理解一次梯度更新',
                  desc: '每点一次：全数据集一次前向+反向+更新，损失曲线右移一点，边界缓慢"生长"。',
                  ops: '单步按钮', obs: ['损失点', '边界微调', '结构图激活明暗'], con: '训练 = 重复"前向→反向→更新"。' },
                { t: 'pgAutoBtn', r: 'loss', title: '「开始训练」看边界演化',
                  desc: '持续训练时边界逐渐贴合数据：同心圆先"挖洞"，螺旋从中心向外"缠绕"生长。',
                  ops: '开始训练按钮', obs: ['边界动画', '损失下降', '验证准确率'], con: '神经网络的决策边界是逐学习步塑形的。' },
                { t: 'pgH1Slider', r: 'net', title: '调整隐藏层 1 宽度（重置训练）',
                  desc: '1 个神经元只能画一条线（欠拟合），6~8 个足以包住同心圆：中间网络图节点数实时变化。',
                  ops: '隐藏层1滑块 + 重新训练', obs: ['结构图第一层节点', '拟合能力差异'], con: '神经元数 = 该层能"折叠"空间的次数。' },
                { t: 'pgH2Slider', r: 'net', title: '加第二隐藏层挑战螺旋',
                  desc: '隐藏层 2 从 0 调到 4 再训练螺旋：两层网络把"线特征"组合成"面特征"，明显更高效。',
                  ops: '隐藏层2滑块 + 重新训练', obs: ['结构图多一列', '螺旋拟合更快'], con: '深度 = 层级化特征复用，比单层堆宽更高效。' },
                { t: 'pgCanvas', r: 'map', title: '鼠标悬停决策区域（探针）',
                  desc: '把鼠标移入左侧图：十字线读出该点坐标与网络输出的 P(y=1)，同时中间网络图点亮各神经元的激活强度。',
                  ops: '鼠标悬停', obs: ['十字线读数框', '隐层节点点亮'], con: '可视化"网络的视角"：同一点在各层的表示。' }
            ]
        },

        // ---------- 实验 15 自编码器 ----------
        'lab-ae': {
            canvas: 'aeCanvas',
            regions: {
                io:   { x: 40, y: 34, w: 660, h: 302, label: '原始流形 → 重构' },
                lat:  { x: 40, y: 366, w: 312, h: 240, label: '隐空间表示' },
                loss: { x: 400, y: 386, w: 410, h: 222, label: '重构损失曲线' }
            },
            affect: {
                aeBottleSlider: 'lat', aeLrSlider: 'loss', aeNoiseSlider: 'io',
                aeAutoBtn: 'loss', aeResetBtn: 'io'
            },
            steps: [
                { t: 'aeBottleSlider', r: 'lat', title: '设置瓶颈维度（默认 1）',
                  desc: '2 → 1 → 2 的"沙漏"结构：左下图显示全部数据被压缩到一条一维隐变量直方图上。',
                  ops: '瓶颈维度滑块', obs: ['隐空间直方图', '信息面板压缩率'], con: '瓶颈 = 强迫网络只保留最本质的结构。' },
                { t: 'aeAutoBtn', r: 'loss', title: '「持续训练」观察重构',
                  desc: '训练中右上重构图（粉色点）逐渐贴合左侧原始瑞士卷（蓝色轮廓线），损失曲线同步下降。',
                  ops: '持续训练按钮', obs: ['重构点云收敛到流形上', 'MSE 下降'], con: '自编码器 = 无监督学习"恒等映射"。' },
                { t: 'aeNoiseSlider', r: 'io', title: '加入输入噪声（去噪 AE）',
                  desc: 'σ 调到 0.2 后重置再训练：网络输入带噪点，训练目标仍是干净流形——它学会"去噪"，表示更鲁棒。',
                  ops: '输入噪声滑块 + 重置训练', obs: ['输入点变散', '重构仍贴合干净曲线'], con: '去噪自编码器学到的特征更本质。' },
                { t: 'aeBottleSlider', r: 'lat', title: '瓶颈升到 2~4 维',
                  desc: '瓶颈 = 2 时左下出现二维隐空间散点：流形被"摊开"成更均匀的分布，重构误差显著下降。',
                  ops: '瓶颈维度滑块 + 重新训练', obs: ['隐空间散点形态', '损失更低'], con: '容量越大重构越好，但"压缩"的意义随之减弱。' },
                { t: 'aeRatio', title: '读压缩率与损失',
                  desc: '信息面板显示网络结构与压缩率（2→1→2 即 2×）：重构误差不可能为 0，因为流形自身有折叠。',
                  ops: '信息面板（自动）', obs: ['压缩率与 MSE 数值'], con: '降维的本质：找到数据真正的自由度。' }
            ]
        },

        // ---------- 实验 16 GAN ----------
        'lab-gan': {
            canvas: 'ganCanvas',
            regions: {
                dist: { x: 52, y: 40, w: 736, h: 182, label: '真实分布 vs 生成分布' },
                dline:{ x: 52, y: 272, w: 400, h: 162, label: '判别器输出 D(x)' },
                loss: { x: 500, y: 272, w: 288, h: 162, label: 'L_D / L_G 损失曲线' }
            },
            affect: {
                ganSpeedSlider: 'dist', ganAutoBtn: 'dist', ganResetBtn: 'dist'
            },
            steps: [
                { t: 'ganResetBtn', r: 'dist', title: '重置观察初始状态',
                  desc: '训练前粉色生成直方图集中在小范围，蓝色真实分布是双峰：两者差距 = G 要学习的目标。',
                  ops: '重置按钮', obs: ['蓝（真实）双峰 vs 粉（生成）窄峰'], con: 'G 从随机噪声 z 出发"造假"，D 负责"打假"。' },
                { t: 'ganAutoBtn', r: 'dist', title: '「开始对抗」',
                  desc: '训练中粉色直方图逐渐分裂并移向两个蓝峰；右下 D(x) 曲线被压向中间 0.5 虚线 = D 越来越"分不清"。',
                  ops: '开始对抗按钮', obs: ['粉色分布贴向蓝色', 'D(x) 曲线趋平'], con: '纳什均衡：p_G = p_data，D(x) ≡ 0.5。' },
                { t: 'ganStats', r: 'loss', title: '读 L_D / L_G 博弈',
                  desc: '损失曲线上橙色（D）与粉色（G）此消彼长。理论上均衡时 L_D = ln2 ≈ 0.693——观察它是否围绕 0.693 波动。',
                  ops: '信息面板（自动）', obs: ['两条损失曲线纠缠'], con: 'GAN 训练不是"越小越好"，而是找平衡。' },
                { t: 'ganSpeedSlider', r: 'dist', title: '调节训练速度',
                  desc: '步/帧从 1 调到 30：加速观察长期行为——生成分布宽度 σ 会先 collapse 后恢复（方差正则在兜底）。',
                  ops: '训练速度滑块', obs: ['生成 σ 数值变化', '「已覆盖双峰」提示'], con: '模式塌缩是 GAN 的经典失败模式。' },
                { t: 'ganStd', title: '判断生成质量',
                  desc: '面板同时显示生成样本的均值 μ 与标准差 σ：μ≈0 且 σ 覆盖双峰间距时显示「✓ 已覆盖双峰」。',
                  ops: '信息面板（自动）', obs: ['μ / σ 数值'], con: '分布层面的拟合 = 生成模型的核心指标。' }
            ]
        },

        // ---------- 实验 17 扩散模型 ----------
        'lab-diffusion': {
            canvas: 'dfCanvas',
            regions: {
                state: { x: 56, y: 34, w: 388, h: 372, label: '当前样本状态' },
                snaps: { x: 496, y: 64, w: 320, h: 220, label: '前向快照 x₀→x_T' },
                bar:   { x: 56, y: 428, w: 388, h: 40, label: '加噪进度条' }
            },
            affect: {
                dfTSlider: 'snaps', dfFwdBtn: 'state', dfRevBtn: 'state', dfResetBtn: 'state'
            },
            steps: [
                { t: 'dfTSlider', r: 'snaps', title: '设置扩散总步数 T',
                  desc: 'T 越大，右侧快照条越细密：每步只加一点点噪声（β 调度），这是反向网络"学得动"的前提。',
                  ops: '扩散步数 T 滑块', obs: ['快照条数量与密度'], con: '小步慢化让每步去噪都是"小修复"。' },
                { t: 'dfFwdBtn', r: 'state', title: '「正向加噪」：数据溶解为噪声',
                  desc: '左侧同心圆结构随 t 增大逐渐松散，颜色趋白；底部进度条向"纯噪声 x_T"推进，面板显示信号保留系数 ᾱ_t 递减。',
                  ops: '正向加噪按钮', obs: ['点云散开', 'ᾱ_t ↓ 1−ᾱ_t ↑'], con: '前向是固定公式：x_t = √ᾱ_t·x₀ + √(1−ᾱ_t)·ε。' },
                { t: 'dfRevBtn', r: 'state', title: '「反向去噪」：从噪声生成数据',
                  desc: '样本从纯噪声逐步"浮现"回同心圆结构——每一步网络预测噪声并扣除一点，这就是生成式采样的过程。',
                  ops: '反向去噪按钮', obs: ['结构逐渐重现', '进度条退回 x₀'], con: '生成 = 学会"倒放"扩散过程。' },
                { t: 'dfAlpha', r: 'bar', title: '对照 ᾱ_t 与进度条',
                  desc: 'ᾱ_t 从 1 → 0 单调递减：它是"还剩多少信号"的度量。反向时按 ᾱ 的倒数关系逐步还原。',
                  ops: '信息面板（自动）', obs: ['ᾱ_t 数值', '进度条位置'], con: 'β 调度决定噪声增长速度，影响生成质量。' },
                { t: 'dfResetBtn', r: 'state', title: '换一组初始样本重复',
                  desc: '重置后重新走一遍前向→反向：生成结果每次略有不同——扩散模型从随机性中"雕刻"出分布。',
                  ops: '重置按钮', obs: ['两次生成结果的差异'], con: '生成模型 = 从噪声分布到数据分布的映射。' }
            ]
        }
    };

    // ---------------- 实现 ----------------
    const state = {};   // labId -> {panel, steps, idx, done:Set, overlay, cfg}

    function $(id) { return document.getElementById(id); }

    function buildPanel(labId, cfg) {
        const host = $(labId);
        if (!host) return;
        const guide = document.createElement('div');
        guide.className = 'lab-guide';
        guide.innerHTML =
            '<div class="lg-head"><span class="lg-emoji">🧭</span><span class="lg-title">分步操作引导 · ' +
            '跟着步骤做，每一步都指出「操作哪里 → 看画面哪里」</span>' +
            '<span class="lg-progress"><span class="lg-progress-text">0 / ' + cfg.steps.length + '</span>' +
            '<span class="lg-progress-track"><span class="lg-progress-fill"></span></span></span>' +
            '<span class="lg-caret">▾</span></div>' +
            '<div class="lg-body"><div class="lg-steps"></div>' +
            '<div class="lg-foot">' +
            '<button class="lg-btn" data-act="prev">← 上一步</button>' +
            '<button class="lg-btn primary" data-act="next">下一步 →</button>' +
            '<button class="lg-btn" data-act="reset">重来</button>' +
            '<span class="lg-position"></span></div></div>';
        host.insertBefore(guide, host.firstChild);

        const stepsBox = guide.querySelector('.lg-steps');
        cfg.steps.forEach((st, i) => {
            const d = document.createElement('div');
            d.className = 'lg-step';
            d.innerHTML =
                '<span class="lg-step-num">' + (i + 1) + '</span>' +
                '<div class="lg-step-content"><div class="lg-step-title">' + st.title + '</div>' +
                '<div class="lg-step-desc">' + st.desc + '</div>' +
                '<div class="lg-step-meta">' +
                (st.ops ? '<span class="lg-chip operate">🖱 操作：' + st.ops + '</span>' : '') +
                (st.obs && st.obs.length ? '<span class="lg-chip observe">👀 观察：' + st.obs.join(' · ') + '</span>' : '') +
                (st.con ? '<span class="lg-chip conclusion">💡 结论：' + st.con + '</span>' : '') +
                '</div></div>';
            d.addEventListener('click', () => activate(labId, i));
            stepsBox.appendChild(d);
        });

        guide.querySelector('.lg-head').addEventListener('click', (ev) => {
            if (ev.target.closest('.lg-progress')) return;
            guide.classList.toggle('open');
            if (guide.classList.contains('open')) placeOverlay(labId);
            else hideOverlay(labId);
        });
        guide.querySelector('[data-act="prev"]').addEventListener('click', () => activate(labId, Math.max(0, state[labId].idx - 1)));
        guide.querySelector('[data-act="next"]').addEventListener('click', () => {
            const s = state[labId];
            if (s.idx < cfg.steps.length - 1) activate(labId, s.idx + 1);
        });
        guide.querySelector('[data-act="reset"]').addEventListener('click', () => activate(labId, 0, true));

        state[labId] = { panel: guide, cfg, idx: -1, done: new Set(), overlay: null };
    }

    function buildOverlay(labId, cfg) {
        const canvas = $(cfg.canvas);
        if (!canvas) return;
        const wrapper = canvas.closest('.lab-canvas-wrapper');
        if (!wrapper) return;
        const ov = document.createElement('div');
        ov.className = 'lg-region-overlay';
        ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
        wrapper.appendChild(ov);
        state[labId].overlay = ov;
        state[labId].wrapper = wrapper;
        state[labId].canvas = canvas;
        // 画布尺寸变化时重算
        if (window.ResizeObserver) {
            new ResizeObserver(() => placeOverlay(labId)).observe(canvas);
        }
        window.addEventListener('resize', () => placeOverlay(labId));
    }

    function placeOverlay(labId) {
        const s = state[labId];
        if (!s || !s.overlay || !s.cfg || !s.activeRegion) return;
        const canvas = s.canvas;
        if (!canvas.clientWidth) return;
        const scaleX = canvas.clientWidth / canvas.width;
        const scaleY = canvas.clientHeight / canvas.height;
        const offX = canvas.offsetLeft, offY = canvas.offsetTop;
        const r = s.cfg.regions[s.activeRegion];
        s.overlay.innerHTML = '';
        if (!r) return;
        const box = document.createElement('div');
        box.style.cssText =
            'position:absolute;border:2px dashed rgba(37,99,235,0.65);border-radius:10px;' +
            'background:rgba(37,99,235,0.06);' +
            'left:' + (offX + r.x * scaleX) + 'px;top:' + (offY + r.y * scaleY) + 'px;' +
            'width:' + (r.w * scaleX) + 'px;height:' + (r.h * scaleY) + 'px;';
        const tag = document.createElement('div');
        tag.style.cssText =
            'position:absolute;left:6px;top:6px;padding:2px 10px;border-radius:999px;' +
            'background:rgba(37,99,235,0.92);color:#fff;font-size:12px;font-weight:600;white-space:nowrap;';
        tag.textContent = '👀 ' + (r.label || '');
        box.appendChild(tag);
        s.overlay.appendChild(box);
    }

    function hideOverlay(labId) {
        const s = state[labId];
        if (s && s.overlay) { s.overlay.style.display = 'none'; }
    }

    function clearHighlight(labId) {
        const s = state[labId];
        if (!s) return;
        if (s.hlTarget) { s.hlTarget.classList.remove('lg-hl-target'); s.hlTarget = null; }
        if (s.hlCanvas) { s.hlCanvas.classList.remove('lg-hl-canvas'); s.hlCanvas = null; }
        hideOverlay(labId);
    }

    function activate(labId, idx, force) {
        const s = state[labId];
        if (!s) return;
        const cfg = s.cfg;
        clearHighlight(labId);
        s.idx = idx;
        const st = cfg.steps[idx];
        s.activeRegion = st && st.r ? st.r : null;

        s.panel.classList.add('open');
        s.panel.querySelectorAll('.lg-step').forEach((d, i) => {
            d.classList.toggle('active', i === idx);
            d.classList.toggle('done', s.done.has(i) && i !== idx);
        });
        if (force) s.done.clear();
        if (idx > 0) s.done.add(idx - 1);
        // 完成态：最后一步被推进时记为已完成
        if (idx === cfg.steps.length - 1) s.done.add(idx);

        // 进度
        s.panel.querySelector('.lg-progress-text').textContent = s.done.size + ' / ' + cfg.steps.length;
        s.panel.querySelector('.lg-progress-fill').style.width = (s.done.size / cfg.steps.length * 100) + '%';
        s.panel.querySelector('[data-act="prev"]').disabled = idx === 0;
        s.panel.querySelector('.lg-position').textContent = '步骤 ' + (idx + 1) + ' / ' + cfg.steps.length;

        // 控件高亮
        if (st && st.t) {
            const el = $(st.t);
            if (el) {
                const cg = el.closest('.control-group') || el;
                cg.classList.add('lg-hl-target');
                s.hlTarget = cg;
            }
        }
        // 画布区域高亮
        if (s.activeRegion && cfg.regions && cfg.regions[s.activeRegion]) {
            if (s.hlCanvas == null && s.wrapper) {
                s.wrapper.classList.add('lg-hl-canvas');
                s.hlCanvas = s.wrapper;
            }
            s.overlay.style.display = 'block';
            placeOverlay(labId);
        }
        if (window.trackEvent) window.trackEvent('实验引导', '步骤', (labId.replace('lab-', '')) + ' #' + (idx + 1));
    }

    // 操作联动：操作控件 → 对应可视化区域闪烁
    function bindAffect() {
        const flash = (labId, region) => {
            const s = state[labId];
            if (!s || !s.overlay || !s.cfg.regions[region]) return;
            // 面板未打开时只闪烁控件指向，不打扰
            const prevActive = s.activeRegion;
            const prevDisplay = s.overlay.style.display;
            s.activeRegion = region;
            s.overlay.style.display = 'block';
            placeOverlay(labId);
            s.overlay.classList.add('lg-hl-canvas');
            setTimeout(() => {
                s.overlay.classList.remove('lg-hl-canvas');
                s.activeRegion = prevActive;
                s.overlay.style.display = (s.idx >= 0 && prevDisplay === 'block' && prevActive) ? 'block' : 'none';
                placeOverlay(labId);
            }, 1400);
        };
        document.addEventListener('input', (ev) => {
            const id = ev.target.id;
            if (!id) return;
            for (const labId in LABS) {
                const region = LABS[labId].affect && LABS[labId].affect[id];
                if (region && state[labId]) {
                    flash(labId, region);
                    // 若该控件正是当前步骤目标，自动标记完成
                    const s = state[labId];
                    const st = s.cfg.steps[s.idx];
                    if (st && st.t === id && s.idx < s.cfg.steps.length - 1) {
                        s.done.add(s.idx);
                        activate(labId, s.idx + 1);
                    }
                }
            }
        }, true);
    }

    function init() {
        for (const labId in LABS) {
            buildPanel(labId, LABS[labId]);
            if (state[labId]) buildOverlay(labId, LABS[labId]);
        }
        bindAffect();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    return { activate };
})();
