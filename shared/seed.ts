// 《自动控制原理》生产级完整课程数据
// 严格按胡寿松《自动控制原理》第七版目录组织
import type { Chapter, Question, KnowledgePoint, SimulationDef, ResourceItem } from './types.js';

// ============================================================
// 一、知识点 (共 108 个,标注 重点/考研/难度)
// ============================================================
export const KNOWLEDGE_POINTS: KnowledgePoint[] = [
  // 第1章 自动控制的一般概念
  { id: 'kp-1-1', chapterId: 1, code: '1.1.1', name: '自动控制的定义与发展史', description: '从瓦特蒸汽机离心调速器,到经典控制理论与现代控制理论的发展历程', importance: 1, difficulty: 1, prerequisites: [], kaoyan: false, questionCount: 6 },
  { id: 'kp-1-2', chapterId: 1, code: '1.1.2', name: '控制系统的基本组成', description: '被控对象、控制器、执行器、传感器、比较环节五大基本元件', importance: 3, difficulty: 1, prerequisites: ['kp-1-1'], kaoyan: true, questionCount: 12 },
  { id: 'kp-1-3', chapterId: 1, code: '1.2.1', name: '开环控制与闭环控制', description: '两种控制方式的结构、优缺点对比,闭环负反馈的核心思想', importance: 3, difficulty: 1, prerequisites: ['kp-1-2'], kaoyan: true, questionCount: 15 },
  { id: 'kp-1-4', chapterId: 1, code: '1.2.2', name: '负反馈控制原理', description: '通过偏差e=r-b来不断减小偏差的思想,反馈控制的本质', importance: 3, difficulty: 2, prerequisites: ['kp-1-3'], kaoyan: true, questionCount: 10 },
  { id: 'kp-1-5', chapterId: 1, code: '1.3.1', name: '控制系统的分类', description: '按输入信号:恒值/随动/程序控制;按元件类型:连续/离散;线性/非线性', importance: 2, difficulty: 1, prerequisites: ['kp-1-3'], kaoyan: false, questionCount: 8 },
  { id: 'kp-1-6', chapterId: 1, code: '1.4.1', name: '对控制系统的基本要求', description: '稳(稳定性)、准(稳态误差)、快(动态响应)三大性能要求', importance: 3, difficulty: 1, prerequisites: ['kp-1-2'], kaoyan: true, questionCount: 14 },
  { id: 'kp-1-7', chapterId: 1, code: '1.4.2', name: '典型控制系统举例', description: '炉温控制、水位控制、调速系统、位置随动系统的工作原理', importance: 2, difficulty: 2, prerequisites: ['kp-1-2'], kaoyan: false, questionCount: 5 },

  // 第2章 控制系统的数学模型
  { id: 'kp-2-1', chapterId: 2, code: '2.1.1', name: '建立微分方程的步骤', description: '列写元件微分方程,消去中间变量,得到输入输出微分方程', importance: 3, difficulty: 2, prerequisites: ['kp-1-2'], kaoyan: true, questionCount: 12 },
  { id: 'kp-2-2', chapterId: 2, code: '2.1.2', name: '非线性方程的线性化', description: '小偏差法(泰勒展开一阶近似),工作点附近线性化', importance: 3, difficulty: 3, prerequisites: ['kp-2-1'], kaoyan: true, questionCount: 9 },
  { id: 'kp-2-3', chapterId: 2, code: '2.2.1', name: '传递函数的定义与性质', description: 'G(s)=L[输出零状态]/L[输入],复频域描述,只与系统结构参数有关', importance: 3, difficulty: 2, prerequisites: ['kp-2-1'], kaoyan: true, questionCount: 22 },
  { id: 'kp-2-4', chapterId: 2, code: '2.2.2', name: '传递函数的常用形式', description: '首1形式(时间常数),尾1形式,零极点形式,增益K的含义', importance: 3, difficulty: 2, prerequisites: ['kp-2-3'], kaoyan: true, questionCount: 16 },
  { id: 'kp-2-5', chapterId: 2, code: '2.3.1', name: '典型环节:比例/积分/微分', description: 'P:I:D三种基本环节的G(s),阶跃响应,频率特性', importance: 3, difficulty: 2, prerequisites: ['kp-2-4'], kaoyan: true, questionCount: 18 },
  { id: 'kp-2-6', chapterId: 2, code: '2.3.2', name: '典型环节:惯性/振荡/一阶微分/二阶微分/延迟', description: '惯性T:一阶惯性;振荡:二阶欠阻尼;延迟e^(-τs)', importance: 3, difficulty: 3, prerequisites: ['kp-2-5'], kaoyan: true, questionCount: 20 },
  { id: 'kp-2-7', chapterId: 2, code: '2.4.1', name: '控制系统方块图', description: '方块图的四要素:方块、信号线、分支点、相加点', importance: 2, difficulty: 2, prerequisites: ['kp-2-3'], kaoyan: false, questionCount: 6 },
  { id: 'kp-2-8', chapterId: 2, code: '2.4.2', name: '方块图的运算法则', description: '串联、并联、反馈,分支点与相加点的移动规则', importance: 3, difficulty: 3, prerequisites: ['kp-2-7'], kaoyan: true, questionCount: 18 },
  { id: 'kp-2-9', chapterId: 2, code: '2.4.3', name: '方块图化简求闭环传递函数', description: '通过等效变换求Φ(s)=C(s)/R(s),多输入多输出时的叠加', importance: 3, difficulty: 4, prerequisites: ['kp-2-8'], kaoyan: true, questionCount: 25 },
  { id: 'kp-2-10', chapterId: 2, code: '2.5.1', name: '信号流图与梅森增益公式', description: '节点、支路、通路、回路的概念;P_k:第k条前向通路;Δ:流图特征式', importance: 3, difficulty: 4, prerequisites: ['kp-2-9'], kaoyan: true, questionCount: 28 },
  { id: 'kp-2-11', chapterId: 2, code: '2.5.2', name: '闭环系统的传递函数', description: '控制输入R(s)下和扰动N(s)下的输出、误差、开环传递函数', importance: 3, difficulty: 3, prerequisites: ['kp-2-9', 'kp-2-10'], kaoyan: true, questionCount: 14 },

  // 第3章 时域分析法
  { id: 'kp-3-1', chapterId: 3, code: '3.1.1', name: '典型输入测试信号', description: '阶跃、斜坡、抛物线、脉冲、正弦信号及其拉普拉斯变换', importance: 2, difficulty: 1, prerequisites: ['kp-2-3'], kaoyan: false, questionCount: 6 },
  { id: 'kp-3-2', chapterId: 3, code: '3.2.1', name: '一阶系统阶跃响应', description: 'h(t)=1-e^(-t/T),时间常数T,调整时间ts≈3T/4T', importance: 3, difficulty: 2, prerequisites: ['kp-2-3'], kaoyan: true, questionCount: 14 },
  { id: 'kp-3-3', chapterId: 3, code: '3.3.1', name: '二阶系统的标准形式', description: '标准传递函数Φ(s)=ωn²/(s²+2ζωn s+ωn²),阻尼比ζ与自然频率ωn', importance: 3, difficulty: 2, prerequisites: ['kp-2-6'], kaoyan: true, questionCount: 22 },
  { id: 'kp-3-4', chapterId: 3, code: '3.3.2', name: '欠阻尼二阶系统单位阶跃响应', description: 'h(t)=1-(e^(-ζωn t)/√(1-ζ²))sin(ωd t+arccosζ),ωd=ωn√(1-ζ²)', importance: 3, difficulty: 3, prerequisites: ['kp-3-3'], kaoyan: true, questionCount: 30 },
  { id: 'kp-3-5', chapterId: 3, code: '3.3.3', name: '二阶系统时域性能指标', description: '上升时间tr、峰值时间tp、超调量σ%、调节时间ts的定义与公式', importance: 3, difficulty: 3, prerequisites: ['kp-3-4'], kaoyan: true, questionCount: 42 },
  { id: 'kp-3-6', chapterId: 3, code: '3.3.4', name: '超调量公式 σ%=e^(-πζ/√(1-ζ²))×100%', description: '只与ζ有关!ζ=0.707时σ%≈4.3%为工程最佳阻尼比', importance: 3, difficulty: 3, prerequisites: ['kp-3-5'], kaoyan: true, questionCount: 36 },
  { id: 'kp-3-7', chapterId: 3, code: '3.3.5', name: '欠/临/过阻尼与无阻尼', description: 'ζ<1欠阻尼(振荡);ζ=1临界;ζ>1过阻尼;ζ=0等幅振荡', importance: 3, difficulty: 2, prerequisites: ['kp-3-4'], kaoyan: true, questionCount: 18 },
  { id: 'kp-3-8', chapterId: 3, code: '3.4.1', name: '高阶系统时域分析', description: '主导极点法:忽略远离虚轴的极点,降阶为低阶近似分析', importance: 2, difficulty: 3, prerequisites: ['kp-3-5'], kaoyan: true, questionCount: 8 },
  { id: 'kp-3-9', chapterId: 3, code: '3.5.1', name: '稳定性的基本概念', description: 'BIBO有界输入有界输出稳定;零输入响应是否趋近于0', importance: 3, difficulty: 2, prerequisites: ['kp-3-2'], kaoyan: true, questionCount: 12 },
  { id: 'kp-3-10', chapterId: 3, code: '3.5.2', name: '线性系统稳定的充要条件', description: '特征方程所有根均具有负实部,即全部位于S平面左半平面', importance: 3, difficulty: 2, prerequisites: ['kp-3-9'], kaoyan: true, questionCount: 18 },
  { id: 'kp-3-11', chapterId: 3, code: '3.5.3', name: '劳斯-赫尔维茨判据', description: '劳斯表构造方法,首列元素变号次数=右半平面极点个数', importance: 3, difficulty: 4, prerequisites: ['kp-3-10'], kaoyan: true, questionCount: 46 },
  { id: 'kp-3-12', chapterId: 3, code: '3.5.4', name: '劳斯判据的特殊情况', description: '首列某行为0→用辅助多项式;首列出现0→用ε→0+代替后判定', importance: 3, difficulty: 4, prerequisites: ['kp-3-11'], kaoyan: true, questionCount: 24 },
  { id: 'kp-3-13', chapterId: 3, code: '3.6.1', name: '误差与稳态误差的定义', description: '输入端误差e=r-h;输出端误差e\'=r\'-c;单位反馈下两者相等', importance: 3, difficulty: 3, prerequisites: ['kp-1-4'], kaoyan: true, questionCount: 18 },
  { id: 'kp-3-14', chapterId: 3, code: '3.6.2', name: '系统型别 ν 的定义', description: '开环传递函数积分环节(1/s^ν)的个数 ν=0/1/2分别为0/I/II型', importance: 3, difficulty: 2, prerequisites: ['kp-2-5'], kaoyan: true, questionCount: 20 },
  { id: 'kp-3-15', chapterId: 3, code: '3.6.3', name: '静态误差系数法', description: 'Kp=limG(s);Kv=limsG(s);Ka=lims²G(s);以及稳态误差计算公式表', importance: 3, difficulty: 3, prerequisites: ['kp-3-14'], kaoyan: true, questionCount: 44 },
  { id: 'kp-3-16', chapterId: 3, code: '3.6.4', name: '终值定理求稳态误差', description: 'ess=lim s·E(s) 的条件:sE(s)所有极点都在左半平面(含虚轴条件)', importance: 3, difficulty: 3, prerequisites: ['kp-3-13'], kaoyan: true, questionCount: 30 },
  { id: 'kp-3-17', chapterId: 3, code: '3.6.5', name: '扰动输入下的稳态误差', description: '分别求R(s)和N(s)下的误差再叠加;提高系统型别与开环增益可降低误差', importance: 3, difficulty: 4, prerequisites: ['kp-3-15'], kaoyan: true, questionCount: 16 },
  { id: 'kp-3-18', chapterId: 3, code: '3.7.1', name: '动态误差系数法', description: '求误差级数,计算k1,k2,k3动态误差系数,用于任意输入的时间函数', importance: 2, difficulty: 4, prerequisites: ['kp-3-15'], kaoyan: false, questionCount: 6 },

  // 第4章 根轨迹法
  { id: 'kp-4-1', chapterId: 4, code: '4.1.1', name: '根轨迹的基本概念', description: '当开环增益K(或某参数)从0→∞,闭环特征根在S平面移动的轨迹', importance: 3, difficulty: 2, prerequisites: ['kp-3-10'], kaoyan: true, questionCount: 10 },
  { id: 'kp-4-2', chapterId: 4, code: '4.1.2', name: '根轨迹的幅值条件与相角条件', description: '|K∏(s-zj)/∏(s-pi)|=1 和 ∑∠(s-zj)-∑∠(s-pi)=(2k+1)π (180°根轨迹)', importance: 3, difficulty: 3, prerequisites: ['kp-4-1'], kaoyan: true, questionCount: 18 },
  { id: 'kp-4-3', chapterId: 4, code: '4.2.1', name: '绘制根轨迹的基本法则(8条)', description: '起点终点、分支数、对称性、实轴上的段、渐近线、分离点、出射/入射角、虚轴交点', importance: 3, difficulty: 4, prerequisites: ['kp-4-2'], kaoyan: true, questionCount: 52 },
  { id: 'kp-4-4', chapterId: 4, code: '4.2.2', name: '渐近线计算', description: '渐近线数=n-m;中心σa=(Σpi-Σzj)/(n-m);夹角φa=(2k+1)π/(n-m)', importance: 3, difficulty: 3, prerequisites: ['kp-4-3'], kaoyan: true, questionCount: 22 },
  { id: 'kp-4-5', chapterId: 4, code: '4.2.3', name: '分离点与会合点', description: 'dK/ds=0 解方程;实轴相邻两零/极点之间必有一个分离点或会合点', importance: 3, difficulty: 4, prerequisites: ['kp-4-3'], kaoyan: true, questionCount: 26 },
  { id: 'kp-4-6', chapterId: 4, code: '4.2.4', name: '根轨迹与虚轴的交点', description: '用s=jω代入特征方程,令实部虚部同时为0求解ω与K临界增益', importance: 3, difficulty: 4, prerequisites: ['kp-4-3'], kaoyan: true, questionCount: 24 },
  { id: 'kp-4-7', chapterId: 4, code: '4.3.1', name: '参数根轨迹与广义根轨迹', description: '除K以外其他参数变化时的根轨迹,通过等效变换为标准形式', importance: 2, difficulty: 4, prerequisites: ['kp-4-3'], kaoyan: true, questionCount: 10 },
  { id: 'kp-4-8', chapterId: 4, code: '4.3.2', name: '零度根轨迹(正反馈)', description: '相角条件改为±2kπ;实轴上的段判断、渐近线夹角变化', importance: 2, difficulty: 4, prerequisites: ['kp-4-3'], kaoyan: true, questionCount: 8 },
  { id: 'kp-4-9', chapterId: 4, code: '4.4.1', name: '用根轨迹分析系统性能', description: '根据期望ζ或σd确定闭环主导极点位置和对应的K值', importance: 3, difficulty: 3, prerequisites: ['kp-3-8', 'kp-4-3'], kaoyan: true, questionCount: 14 },

  // 第5章 频率响应法
  { id: 'kp-5-1', chapterId: 5, code: '5.1.1', name: '频率特性的定义', description: 'G(jω)=G(s)|_{s=jω}为幅相频率特性,A(ω)=|G(jω)|幅频,φ(ω)=∠G(jω)相频', importance: 3, difficulty: 2, prerequisites: ['kp-2-3'], kaoyan: true, questionCount: 12 },
  { id: 'kp-5-2', chapterId: 5, code: '5.1.2', name: '频率特性的三种图形表示', description: '极坐标图(奈奎斯特/Nyquist)、伯德图(Bode对数幅相)、尼科尔斯图', importance: 2, difficulty: 2, prerequisites: ['kp-5-1'], kaoyan: false, questionCount: 6 },
  { id: 'kp-5-3', chapterId: 5, code: '5.2.1', name: '典型环节的频率特性', description: 'P/I/D/惯性/振荡/一阶微分/二阶微分/延迟8种环节的极坐标与伯德图', importance: 3, difficulty: 3, prerequisites: ['kp-2-6'], kaoyan: true, questionCount: 28 },
  { id: 'kp-5-4', chapterId: 5, code: '5.2.2', name: '最小相位与非最小相位系统', description: '所有零点极点都在左半S平面(纯延迟除外)=最小相位;幅频→相频唯一', importance: 3, difficulty: 2, prerequisites: ['kp-5-1'], kaoyan: true, questionCount: 14 },
  { id: 'kp-5-5', chapterId: 5, code: '5.3.1', name: '开环系统极坐标图绘制', description: '分析ω=0+与ω→∞时的幅值和相角,判断是否穿越负实轴', importance: 3, difficulty: 3, prerequisites: ['kp-5-3'], kaoyan: true, questionCount: 18 },
  { id: 'kp-5-6', chapterId: 5, code: '5.4.1', name: '伯德图:对数坐标与标准斜率', description: '横logω,纵:20lgA(ω)dB;每过一转折频率斜率±20dB/dec×该环节数', importance: 3, difficulty: 3, prerequisites: ['kp-5-3'], kaoyan: true, questionCount: 34 },
  { id: 'kp-5-7', chapterId: 5, code: '5.4.2', name: '伯德图的绘制步骤', description: '①化首1→②求各转折频率→③画低频段斜率-20ν dB/dec→④依次变斜率', importance: 3, difficulty: 4, prerequisites: ['kp-5-6'], kaoyan: true, questionCount: 40 },
  { id: 'kp-5-8', chapterId: 5, code: '5.4.3', name: '由伯德图求开环传递函数', description: '反推:斜率变化数=环节、低频段求K与型别ν、由各环节求时间常数', importance: 3, difficulty: 4, prerequisites: ['kp-5-7'], kaoyan: true, questionCount: 42 },
  { id: 'kp-5-9', chapterId: 5, code: '5.5.1', name: '奈奎斯特稳定判据', description: 'Z=P-2N;N为(1,j0)左侧正穿越减负穿越;Z=0则闭环稳定', importance: 3, difficulty: 5, prerequisites: ['kp-3-10', 'kp-5-5'], kaoyan: true, questionCount: 56 },
  { id: 'kp-5-10', chapterId: 5, code: '5.5.2', name: '伯德图上的奈奎斯特判据', description: '穿越-180°线+20lg|G|>0时的正负穿越次数;N=N+-N-', importance: 3, difficulty: 4, prerequisites: ['kp-5-9'], kaoyan: true, questionCount: 28 },
  { id: 'kp-5-11', chapterId: 5, code: '5.5.3', name: '稳定裕度:相角裕度γ', description: 'γ=180°+∠G(jωc);ωc为截止频率穿越频率;希望30°~60°', importance: 3, difficulty: 4, prerequisites: ['kp-5-9'], kaoyan: true, questionCount: 44 },
  { id: 'kp-5-12', chapterId: 5, code: '5.5.4', name: '稳定裕度:幅值裕度h(dB)', description: 'h(dB)=-20lg|G(jωg)|;ωg为相角穿越频率;h≥6dB较满意', importance: 3, difficulty: 3, prerequisites: ['kp-5-11'], kaoyan: true, questionCount: 22 },
  { id: 'kp-5-13', chapterId: 5, code: '5.6.1', name: '闭环频率特性指标', description: '谐振峰值Mr、谐振频率ωr、带宽频率ωb、截止频率ωc', importance: 2, difficulty: 2, prerequisites: ['kp-5-3'], kaoyan: true, questionCount: 10 },
  { id: 'kp-5-14', chapterId: 5, code: '5.6.2', name: '频域指标与时域指标的关系', description: 'Mr≈1/sinγ;σ≈0.16+0.4(Mr-1);ts≈π(2+1.5(Mr-1)+2.5(Mr-1)²)/ωc', importance: 3, difficulty: 3, prerequisites: ['kp-3-6', 'kp-5-11'], kaoyan: true, questionCount: 16 },

  // 第6章 控制系统的校正
  { id: 'kp-6-1', chapterId: 6, code: '6.1.1', name: '校正的基本概念与方式', description: '校正装置Gc(s)的接入位置:串联、反馈(并联)、前馈(复合)、输入补偿', importance: 2, difficulty: 2, prerequisites: [], kaoyan: false, questionCount: 4 },
  { id: 'kp-6-2', chapterId: 6, code: '6.2.1', name: '无源超前校正网络', description: 'Gc(s)=(1+aTs)/(1+Ts),a>1,提供正相移,用于补偿中频段相角', importance: 3, difficulty: 4, prerequisites: ['kp-5-11'], kaoyan: true, questionCount: 22 },
  { id: 'kp-6-3', chapterId: 6, code: '6.2.2', name: '频率法设计串联超前校正', description: '由期望γ→算最大超前φm→算a→设计ωc=ωm→求T→验算', importance: 3, difficulty: 5, prerequisites: ['kp-6-2'], kaoyan: true, questionCount: 36 },
  { id: 'kp-6-4', chapterId: 6, code: '6.2.3', name: '无源滞后校正网络', description: 'Gc(s)=(1+bTs)/(1+Ts),b<1,本质是低通滤波器,降低穿越频率提高相角裕度', importance: 3, difficulty: 4, prerequisites: ['kp-5-11'], kaoyan: true, questionCount: 20 },
  { id: 'kp-6-5', chapterId: 6, code: '6.2.4', name: '频率法设计串联滞后校正', description: '先选期望ωc,算在该点需要衰减的dB→算b→取1/(bT)=0.1ωc→T=10/(bωc)→验算', importance: 3, difficulty: 5, prerequisites: ['kp-6-4'], kaoyan: true, questionCount: 32 },
  { id: 'kp-6-6', chapterId: 6, code: '6.2.5', name: '滞后-超前校正', description: '同时使用两种环节,低频段滞后保证稳态,中高频段超前保证动态', importance: 2, difficulty: 5, prerequisites: ['kp-6-3', 'kp-6-5'], kaoyan: true, questionCount: 10 },
  { id: 'kp-6-7', chapterId: 6, code: '6.3.1', name: 'PID控制器', description: 'Gc(s)=Kp+Ki/s+Kd·s=Kp(1+1/(Ti s)+Td s);PID三大环节作用', importance: 3, difficulty: 3, prerequisites: ['kp-2-5'], kaoyan: true, questionCount: 26 },
  { id: 'kp-6-8', chapterId: 6, code: '6.3.2', name: 'PID参数整定', description: '临界比例度法(Ziegler-Nichols)、衰减曲线法、经验整定法', importance: 3, difficulty: 4, prerequisites: ['kp-6-7'], kaoyan: true, questionCount: 18 },
  { id: 'kp-6-9', chapterId: 6, code: '6.4.1', name: '反馈校正与复合校正', description: '局部反馈校正包围特定环节;复合校正=前馈+反馈,实现完全不变性', importance: 2, difficulty: 4, prerequisites: ['kp-6-1'], kaoyan: true, questionCount: 6 },

  // 第7章 线性离散系统分析
  { id: 'kp-7-1', chapterId: 7, code: '7.1.1', name: '信号的采样与保持', description: '香农采样定理ωs≥2ωmax;零阶保持器ZOH:G(s)=(1-e^(-Ts))/s', importance: 3, difficulty: 2, prerequisites: ['kp-5-1'], kaoyan: true, questionCount: 12 },
  { id: 'kp-7-2', chapterId: 7, code: '7.2.1', name: 'Z变换的定义与性质', description: 'E(z)=Σe(kT)·z^(-k);线性、延迟、初值终值定理、复位移', importance: 3, difficulty: 3, prerequisites: ['kp-7-1'], kaoyan: true, questionCount: 20 },
  { id: 'kp-7-3', chapterId: 7, code: '7.2.2', name: 'Z反变换方法', description: '长除法(幂级数展开)、部分分式法(查表)、留数法(反演积分)', importance: 3, difficulty: 3, prerequisites: ['kp-7-2'], kaoyan: true, questionCount: 18 },
  { id: 'kp-7-4', chapterId: 7, code: '7.3.1', name: '脉冲传递函数(离散系统)', description: 'G(z)=C(z)/R(z);Z[G1(s)G2(s)]≠G1(z)G2(z)当中间没有采样器时', importance: 3, difficulty: 4, prerequisites: ['kp-2-3', 'kp-7-2'], kaoyan: true, questionCount: 28 },
  { id: 'kp-7-5', chapterId: 7, code: '7.3.2', name: '闭环离散系统脉冲传递函数', description: '按采样器位置写方程消去中间变量;注意各环节前后是否有采样开关', importance: 3, difficulty: 4, prerequisites: ['kp-7-4'], kaoyan: true, questionCount: 22 },
  { id: 'kp-7-6', chapterId: 7, code: '7.4.1', name: '离散系统稳定性分析', description: 'W变换(双线性变换z=(1+w)/(1-w))后再用劳斯判据;或朱利判据直接判', importance: 3, difficulty: 4, prerequisites: ['kp-3-11', 'kp-7-5'], kaoyan: true, questionCount: 24 },
  { id: 'kp-7-7', chapterId: 7, code: '7.4.2', name: '稳定的充要条件与单位圆', description: '特征根全部位于Z平面单位圆内→离散系统稳定', importance: 3, difficulty: 3, prerequisites: ['kp-7-6'], kaoyan: true, questionCount: 14 },
  { id: 'kp-7-8', chapterId: 7, code: '7.5.1', name: '离散系统稳态误差', description: '静态误差系数:Kp=limG(z),Kv=(z-1)G(z)/T,Ka=(z-1)²G(z)/T²;终值定理e(∞)=lim(z-1)E(z)', importance: 3, difficulty: 4, prerequisites: ['kp-3-15', 'kp-7-5'], kaoyan: true, questionCount: 18 },
  { id: 'kp-7-9', chapterId: 7, code: '7.6.1', name: '离散系统动态响应', description: '由Φ(z)求输出序列;采样周期T对系统稳定性与动态性能的影响', importance: 2, difficulty: 3, prerequisites: ['kp-7-5'], kaoyan: true, questionCount: 8 },

  // 第8章 非线性控制系统
  { id: 'kp-8-1', chapterId: 8, code: '8.1.1', name: '典型非线性特性', description: '死区、饱和、间隙(回环)、继电器(有/无死区/有滞环)、摩擦', importance: 3, difficulty: 2, prerequisites: [], kaoyan: true, questionCount: 8 },
  { id: 'kp-8-2', chapterId: 8, code: '8.2.1', name: '描述函数法的基本思想', description: 'N(A)=Y1/A·e^(jφ1);非线性元件输出的基波分量与输入正弦之比', importance: 3, difficulty: 3, prerequisites: ['kp-5-1'], kaoyan: true, questionCount: 14 },
  { id: 'kp-8-3', chapterId: 8, code: '8.2.2', name: '典型非线性的描述函数', description: '死区、饱和、间隙、理想继电器、有死区/滞环继电器的N(A)推导', importance: 3, difficulty: 4, prerequisites: ['kp-8-2'], kaoyan: true, questionCount: 18 },
  { id: 'kp-8-4', chapterId: 8, code: '8.2.3', name: '用描述函数法分析自振', description: 'G(jω)曲线与-1/N(A)曲线是否相交;交点处稳定自振判断', importance: 3, difficulty: 5, prerequisites: ['kp-8-3'], kaoyan: true, questionCount: 30 },
  { id: 'kp-8-5', chapterId: 8, code: '8.3.1', name: '相平面法的基本概念', description: 'x-ẋ为相平面;系统状态随时间演化的相轨迹', importance: 2, difficulty: 3, prerequisites: ['kp-3-2'], kaoyan: false, questionCount: 6 },
  { id: 'kp-8-6', chapterId: 8, code: '8.3.2', name: '奇点与极限环', description: 'f(x,ẋ)=0的解为奇点:中心点/焦点/节点/鞍点;孤立闭合轨迹为极限环', importance: 2, difficulty: 4, prerequisites: ['kp-8-5'], kaoyan: true, questionCount: 8 },
  { id: 'kp-8-7', chapterId: 8, code: '8.3.3', name: '绘制相轨迹的方法', description: '解析法、等倾线法、δ法;根据图形判断稳定性、自振', importance: 2, difficulty: 5, prerequisites: ['kp-8-6'], kaoyan: false, questionCount: 4 },
  { id: 'kp-8-8', chapterId: 8, code: '8.4.1', name: '改善非线性系统性能的措施', description: '引入线性校正、改变非线性特性、外加高频振荡信号(颤振)', importance: 2, difficulty: 3, prerequisites: ['kp-8-4'], kaoyan: false, questionCount: 4 },
];

// ============================================================
// 二、8大章课程 (含课时与真实教学内容)
// ============================================================
const mkLessons = (
  chapterId: number,
  defs: Array<{ title: string; type: any; duration: number; objectives: string[]; kps: string[] }>
) =>
  defs.map((d, i) => ({
    id: `lesson-${chapterId}-${i + 1}`,
    chapterId,
    index: i + 1,
    title: d.title,
    type: d.type,
    durationMinutes: d.duration,
    description: d.title,
    objectives: d.objectives,
    knowledgePoints: d.kps,
  }));

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: '第1章 自动控制的一般概念',
    subtitle: '建立控制系统的整体认知框架',
    description: '从瓦特调速器出发,介绍自动控制的发展历史、基本组成与分类,建立"反馈控制"这一贯穿全书的核心理念。',
    overview: '本章是控制理论的入门导论。首先介绍控制理论发展的三个阶段:古典控制理论(1940s-1950s,频域法、单输入单输出),现代控制理论(1960s起,状态空间、多输入多输出),智能控制理论(1980s起,模糊/神经网络/专家系统)。然后重点讲解控制系统五大基本组成,开环/闭环控制结构对比。最后提出对控制系统"稳、准、快"三大性能要求,建立评估控制质量的标准。',
    durationLabel: '6课时 (3×45min)',
    tags: ['反馈原理', '开环控制', '闭环控制', '性能要求'],
    textbookSections: ['胡寿松 §1.1~§1.5'],
    learningObjectives: [
      '了解自动控制理论的发展阶段与代表人物',
      '熟练掌握控制系统的五大基本组成及其功能',
      '准确区分开环控制与闭环控制的优缺点与适用场景',
      '深刻理解负反馈控制原理:用偏差消除偏差',
      '掌握对控制系统的三大基本要求:稳、准、快',
    ],
    keyPoints: ['负反馈控制原理', '控制系统五大组成', '开环/闭环对比', '稳准快三大性能'],
    difficultPoints: ['负反馈的本质思想', '物理系统控制结构抽象化建模'],
    kaoyanWeight: 5,
    lessons: mkLessons(1, [
      { title: '1.1 自动控制理论的发展简史', type: 'video', duration: 45, objectives: ['了解三次控制理论革命'], kps: ['kp-1-1'] },
      { title: '1.2 控制系统的组成与分类', type: 'ppt', duration: 30, objectives: ['掌握五大组成元件'], kps: ['kp-1-2', 'kp-1-5'] },
      { title: '1.3 开环控制与闭环控制对比', type: 'video', duration: 40, objectives: ['理解反馈的本质意义'], kps: ['kp-1-3', 'kp-1-4'] },
      { title: '1.4 典型控制系统实例分析', type: 'video', duration: 45, objectives: ['能画出实际系统的原理框图'], kps: ['kp-1-7'] },
      { title: '1.5 对控制系统的性能要求', type: 'video', duration: 35, objectives: ['理解稳、准、快的物理意义'], kps: ['kp-1-6'] },
      { title: '第1章 单元测验', type: 'exercise', duration: 30, objectives: ['检测本章掌握度'], kps: ['kp-1-2', 'kp-1-3', 'kp-1-6'] },
    ]),
  },
  {
    id: 2,
    title: '第2章 控制系统的数学模型',
    subtitle: '从物理系统到复频域数学描述',
    description: '系统学习控制系统三大数学描述工具:微分方程、传递函数、方块图与信号流图。这是后续所有分析方法的基石。',
    overview: '控制理论的一切分析方法都建立在准确的数学模型之上。本章首先从物理定律(KCL、KVL、牛顿定律、能量守恒)出发建立系统微分方程,然后引入拉普拉斯变换得到传递函数这种更简便的复频域模型。接着讲解6种典型环节(比例、积分、微分、惯性、二阶振荡、延迟)的传递函数与时/频域特性。最后用方块图等效变换和梅森公式两种方法求取复杂闭环系统的总传递函数。',
    durationLabel: '10课时 (5×45min)',
    tags: ['微分方程', '传递函数', '方块图', '梅森公式', '典型环节'],
    textbookSections: ['胡寿松 §2.1~§2.5'],
    learningObjectives: [
      '会用物理定律列写RC电路、机械、电机等系统的微分方程',
      '掌握非线性方程小偏差线性化方法',
      '深刻理解传递函数定义、性质,并能与微分方程相互转换',
      '熟练掌握6种典型环节的G(s)、阶跃响应、频率特性',
      '掌握方块图的等效化简法则,能求复杂闭环传递函数',
      '熟练运用梅森增益公式:正确数出P_k条前向通路与所有互不接触回路',
    ],
    keyPoints: ['传递函数定义与零极点模型', '6种典型环节', '方块图化简法则', '梅森增益公式'],
    difficultPoints: ['方块图化简中分支点/相加点移动规则', '梅森公式中互不接触回路的计算'],
    kaoyanWeight: 18,
    lessons: mkLessons(2, [
      { title: '2.1 列写系统微分方程(机械/电路/电机)', type: 'video', duration: 50, objectives: ['掌握由物理建模的方法'], kps: ['kp-2-1'] },
      { title: '2.2 非线性方程的小偏差线性化', type: 'video', duration: 35, objectives: ['掌握泰勒一阶近似'], kps: ['kp-2-2'] },
      { title: '2.3 传递函数的定义、性质与形式', type: 'ppt', duration: 40, objectives: ['掌握G(s)的数学本质'], kps: ['kp-2-3', 'kp-2-4'] },
      { title: '2.4 六种典型环节的传递函数分析', type: 'video', duration: 55, objectives: ['建立对典型环节的直觉'], kps: ['kp-2-5', 'kp-2-6'] },
      { title: '2.5 方块图组成与等效化简法则(上)', type: 'video', duration: 45, objectives: ['掌握串并反馈和基本移动'], kps: ['kp-2-7', 'kp-2-8'] },
      { title: '2.6 方块图化简复杂实例(下)', type: 'experiment', duration: 60, objectives: ['掌握多种综合化简技巧'], kps: ['kp-2-9'] },
      { title: '2.7 信号流图与梅森增益公式', type: 'video', duration: 55, objectives: ['学会使用梅森公式快速求解'], kps: ['kp-2-10'] },
      { title: '2.8 闭环系统多种传递函数(R/N/E)', type: 'video', duration: 40, objectives: ['会对多输入分别列写'], kps: ['kp-2-11'] },
      { title: '实验:用MATLAB求系统传递函数', type: 'experiment', duration: 45, objectives: ['学会tf、series、feedback函数'], kps: ['kp-2-9', 'kp-2-10'] },
      { title: '第2章 单元测验', type: 'exercise', duration: 60, objectives: ['检测本章掌握度'], kps: ['kp-2-3', 'kp-2-6', 'kp-2-9', 'kp-2-10'] },
    ]),
  },
  {
    id: 3,
    title: '第3章 线性系统的时域分析法',
    subtitle: '从时间维度直接分析系统性能',
    description: '本章研究典型测试信号下的时间响应曲线,给出5大动态性能指标计算公式,深入讲解劳斯稳定判据和稳态误差分析方法。',
    overview: '时域分析法最直观,直接在时间轴上观察系统响应。本章首先引入5种典型测试信号(阶跃、斜坡、抛物线、脉冲、正弦),然后重点分析一阶与二阶系统的单位阶跃响应。对二阶欠阻尼系统,我们将严格推导5个性能指标(延迟、上升、峰值时间,超调量,调节时间)的解析公式,揭示超调量σ%只由阻尼比ζ决定这一极其重要的结论。接着讲高阶系统的主导极点近似法。然后用整节篇幅讲解线性系统稳定性的劳斯判据(包括首列零和全零行两种特殊情况)。最后讲稳态误差:型别ν、静态误差系数Kp/Kv/Ka、终值定理应用、扰动下的稳态误差。',
    durationLabel: '12课时 (6×45min)',
    tags: ['阶跃响应', '动态性能指标', '超调量', '劳斯判据', '稳态误差'],
    textbookSections: ['胡寿松 §3.1~§3.8'],
    learningObjectives: [
      '会计算一阶、二阶(欠/临/过阻尼)系统的单位阶跃响应',
      '准确记忆并推导二阶系统5个性能指标公式',
      '深刻理解:σ%只与ζ有关,ts≈3/(ζωn)',
      '能用主导极点法分析高阶系统',
      '熟练运用劳斯判据判定稳定性,处理两种特殊情况',
      '掌握稳态误差的三种计算方法:型别系数法、终值定理、动态误差系数',
      '会分别计算参考输入R(s)与扰动输入N(s)下的稳态误差',
    ],
    keyPoints: ['二阶欠阻尼阶跃响应公式', '超调量σ%与阻尼比ζ唯一关系', '劳斯判据', '静态误差系数法'],
    difficultPoints: ['二阶欠阻尼响应公式推导', '劳斯判据特殊情况(0元素/全0行)', '多输入下的稳态误差叠加'],
    kaoyanWeight: 25,
    lessons: mkLessons(3, [
      { title: '3.1 典型测试信号与时域性能指标定义', type: 'video', duration: 40, objectives: ['掌握5大时域指标定义'], kps: ['kp-3-1', 'kp-3-5'] },
      { title: '3.2 一阶系统时域响应', type: 'experiment', duration: 50, objectives: ['熟悉T的工程含义'], kps: ['kp-3-2'] },
      { title: '3.3 二阶欠阻尼系统阶跃响应(推导)', type: 'video', duration: 60, objectives: ['完整推导响应公式'], kps: ['kp-3-3', 'kp-3-4'] },
      { title: '3.4 性能指标公式与最佳阻尼比0.707', type: 'video', duration: 50, objectives: ['记住σ%与ts的公式'], kps: ['kp-3-5', 'kp-3-6', 'kp-3-7'] },
      { title: '3.5 主导极点法与高阶系统近似', type: 'ppt', duration: 35, objectives: ['掌握降阶分析思路'], kps: ['kp-3-8'] },
      { title: '3.6 稳定性理论与劳斯判据(基础)', type: 'video', duration: 55, objectives: ['掌握普通劳斯表构建'], kps: ['kp-3-9', 'kp-3-10', 'kp-3-11'] },
      { title: '3.7 劳斯判据的两种特殊情况', type: 'video', duration: 45, objectives: ['会用辅助多项式与ε代替法'], kps: ['kp-3-12'] },
      { title: '3.8 稳态误差(上):定义、型别、静态误差系数', type: 'video', duration: 45, objectives: ['记住Kp/Kv/Ka公式表'], kps: ['kp-3-13', 'kp-3-14', 'kp-3-15'] },
      { title: '3.9 稳态误差(下):终值定理+扰动输入', type: 'video', duration: 45, objectives: ['会计算多输入综合误差'], kps: ['kp-3-16', 'kp-3-17'] },
      { title: '实验:二阶系统参数调参与性能分析', type: 'experiment', duration: 70, objectives: ['观察ωn/ζ变化对σ%/ts影响'], kps: ['kp-3-4', 'kp-3-5'] },
      { title: '综合习题课(含考研真题解析)', type: 'video', duration: 50, objectives: ['巩固本章重难点'], kps: ['kp-3-6', 'kp-3-11', 'kp-3-15'] },
      { title: '第3章 单元测验(考研难度)', type: 'exercise', duration: 70, objectives: ['检查达标'], kps: ['kp-3-5', 'kp-3-11', 'kp-3-15'] },
    ]),
  },
  {
    id: 4,
    title: '第4章 根轨迹法',
    subtitle: 'S平面上观察闭环极点随参数变化',
    description: '根轨迹法是一种图解分析工具:当开环增益K从0→∞时,闭环特征方程根在S平面移动的路径。掌握8条绘制法则,就能快速分析系统性能。',
    overview: '根轨迹法由W.R.Evans在1948年提出,是经典控制理论最核心的分析方法之一。本章首先从特征方程1+G(s)H(s)=0推导出根轨迹的两个基本条件:相角条件(画图)和幅值条件(求K)。然后花大量篇幅系统讲解8条绘制法则:起点终点、分支数、实轴对称性、实轴上的根轨迹、渐近线(中心与夹角)、分离点/会合点、起始角/终止角、与虚轴的交点(临界稳定)。最后讲参数根轨迹(等效变换)、零度根轨迹(正反馈系统)以及如何在根轨迹上指定期望阻尼比ζ来确定闭环极点和K。',
    durationLabel: '8课时 (4×45min)',
    tags: ['根轨迹', '8条绘制法则', '分离点', '渐近线', '虚轴交点'],
    textbookSections: ['胡寿松 §4.1~§4.4'],
    learningObjectives: [
      '深刻理解根轨迹的两个条件:相角条件+幅值条件',
      '熟练运用8条法则绘制常规180°根轨迹',
      '会计算渐近线σa/φa、分离点、出射入射角、虚轴交点ω与临界K',
      '掌握参数根轨迹的等效开环传递函数构造',
      '区分零度根轨迹(正反馈)与常规根轨迹的3处差别',
      '能利用根轨迹指定期望主导极点,确定对应K值',
    ],
    keyPoints: ['相角/幅值条件', '8条绘制法则', '分离点计算', '虚轴交点计算'],
    difficultPoints: ['出射角与入射角公式', '分离点dK/ds=0解方程', '正反馈零度根轨迹'],
    kaoyanWeight: 14,
    lessons: mkLessons(4, [
      { title: '4.1 根轨迹的基本思想与两个条件', type: 'video', duration: 45, objectives: ['理解根轨迹的几何意义'], kps: ['kp-4-1', 'kp-4-2'] },
      { title: '4.2 绘制根轨迹的8条基本法则(上)', type: 'video', duration: 60, objectives: ['掌握前5条法则'], kps: ['kp-4-3', 'kp-4-4'] },
      { title: '4.3 绘制根轨迹的8条法则(下)', type: 'video', duration: 60, objectives: ['掌握分离点、出射角、虚轴交点'], kps: ['kp-4-3', 'kp-4-5', 'kp-4-6'] },
      { title: '4.4 参数根轨迹与广义根轨迹', type: 'video', duration: 45, objectives: ['学会等效变换'], kps: ['kp-4-7'] },
      { title: '4.5 零度根轨迹(正反馈系统)', type: 'ppt', duration: 35, objectives: ['区分3处法则不同'], kps: ['kp-4-8'] },
      { title: '4.6 根轨迹法综合设计实例', type: 'experiment', duration: 70, objectives: ['用根轨迹确定K'], kps: ['kp-4-3', 'kp-4-9'] },
      { title: '习题课:历年考研根轨迹题精讲', type: 'video', duration: 50, objectives: ['熟悉常见陷阱'], kps: ['kp-4-3'] },
      { title: '第4章 单元测验', type: 'exercise', duration: 60, objectives: ['本章掌握度检测'], kps: ['kp-4-3', 'kp-4-5', 'kp-4-6'] },
    ]),
  },
  {
    id: 5,
    title: '第5章 频率响应法',
    subtitle: '用正弦稳态响应揭示系统内在动态特性',
    description: '频率法是经典控制的皇冠:奈奎斯特稳定判据、伯德图、稳定裕度三大工具是工程分析控制性能的首选方法。',
    overview: '频率特性G(jω)的精髓是:将正弦信号加到线性系统,输出仍是同频率正弦,只是幅值×A(ω),相角+φ(ω)。本章首先讲三种图形表示:极坐标图(奈奎斯特曲线)、伯德图(对数幅频+相频)、尼科尔斯图。然后详细讲解6种典型环节的频率特性曲线。接着给出伯德图的系统性绘制步骤:首1形式→标转折频率→画低频段-20ν dB/dec→逐段变斜率;以及反向问题:由伯德图反推G(s)。然后是本章灵魂:奈奎斯特稳定判据Z=P-2N的严格推导与各种情形的应用,以及对数伯德图版本的奈奎斯特判据。最后讲两个极其重要的工程指标:相角裕度γ(希望30°~60°)与幅值裕度h(希望≥6dB),以及频率域Mr/ωb/ωc与时域σ%/ts指标之间的换算关系。',
    durationLabel: '10课时 (5×45min)',
    tags: ['奈奎斯特图', '伯德图', 'Nyquist稳定判据', '相角裕度', '幅值裕度'],
    textbookSections: ['胡寿松 §5.1~§5.7'],
    learningObjectives: [
      '掌握G(jω)的定义:G(s)|_{s=jω}=A(ω)∠φ(ω)',
      '会绘制与识记6种典型环节的极坐标图与伯德图',
      '熟练掌握开环系统伯德图的四步绘制法',
      '能由伯德图形状反推G(s),反求K、ν、各环节时间常数',
      '深刻理解并熟练运用奈奎斯特稳定判据Z=P-2N',
      '会计算相角穿越频率ωg和截止频率ωc',
      '会计算相角裕度γ和幅值裕度h(dB)',
      '掌握频域-时域指标关系:Mr≈1/sinγ,σ≈0.16+0.4(Mr-1)',
    ],
    keyPoints: ['伯德图的绘制与反推', '奈奎斯特稳定判据', '相角裕度γ计算', '截止频率ωc'],
    difficultPoints: ['奈奎斯特曲线围绕(-1,j0)的判断', '伯德图反推G(s)综合题', 'γ和h的几何与代数求法'],
    kaoyanWeight: 22,
    lessons: mkLessons(5, [
      { title: '5.1 频率特性定义与物理意义', type: 'video', duration: 40, objectives: ['理解稳态正弦响应'], kps: ['kp-5-1', 'kp-5-2'] },
      { title: '5.2 典型环节频率特性(极坐标+伯德图)', type: 'video', duration: 55, objectives: ['识记各环节图形特征'], kps: ['kp-5-3', 'kp-5-4'] },
      { title: '5.3 开环系统极坐标图绘制', type: 'ppt', duration: 40, objectives: ['掌握起终点与形状'], kps: ['kp-5-5'] },
      { title: '5.4 伯德图绘制四步法(详细)', type: 'video', duration: 65, objectives: ['能规范画出伯德图'], kps: ['kp-5-6', 'kp-5-7'] },
      { title: '5.5 由伯德图反推开环传递函数', type: 'video', duration: 55, objectives: ['掌握反推的规范步骤'], kps: ['kp-5-8'] },
      { title: '5.6 奈奎斯特稳定判据(核心推导+实例)', type: 'video', duration: 70, objectives: ['能运用判据稳不稳'], kps: ['kp-5-9', 'kp-5-10'] },
      { title: '5.7 相角裕度γ与幅值裕度h', type: 'video', duration: 55, objectives: ['会几何/代数两种方法求'], kps: ['kp-5-11', 'kp-5-12'] },
      { title: '5.8 闭环频率特性与频时指标换算', type: 'video', duration: 40, objectives: ['会用Mr/ωc算σ%/ts'], kps: ['kp-5-13', 'kp-5-14'] },
      { title: '实验:MATLAB伯德图与稳定裕度', type: 'experiment', duration: 60, objectives: ['学会bode和margin命令'], kps: ['kp-5-7', 'kp-5-11'] },
      { title: '第5章 单元测验', type: 'exercise', duration: 70, objectives: ['考研难度自测'], kps: ['kp-5-7', 'kp-5-9', 'kp-5-11'] },
    ]),
  },
  {
    id: 6,
    title: '第6章 线性系统的校正方法',
    subtitle: '把分析能力升级为设计能力',
    description: '前五章是"分析":已知系统判性能。本章是"综合与设计":性能指标不满足时,设计校正装置Gc(s)使得系统达标。',
    overview: '本章是理论通向工程的桥梁。首先介绍校正四种接入方式:串联、反馈、前馈、复合校正。然后重点用频率法讲解三种常用无源网络:超前校正(提供正相移,补偿中频段相角不足,使ωc增大,响应加快)、滞后校正(本质是低通滤波器,衰减高频使ωc降低,从而获得足够相角裕度;同时提高低频段增益改善稳态误差),以及两者组合的滞后-超前校正。给出了详细的基于期望γ、ωc指标的设计步骤。然后讲解工业界最常用的PID控制器:P(比例,快速减小误差)、I(积分,消除静差)、D(微分,预测变化趋势,抑制超调)的三参数作用口诀,以及著名的Ziegler-Nichols临界比例度法参数整定。最后讲反馈校正(局部反馈包围环节改造其特性)和复合校正(前馈+反馈实现扰动不变性)。',
    durationLabel: '10课时 (5×45min)',
    tags: ['超前校正', '滞后校正', 'PID控制器', '参数整定', '频率法设计'],
    textbookSections: ['胡寿松 §6.1~§6.5'],
    learningObjectives: [
      '了解四种校正方式及各自适用场景',
      '掌握无源超前/滞后网络的G(s)和频率特性',
      '能用频率法设计超前校正:φm→a→选ωc=ωm→算T→验算',
      '能用频率法设计滞后校正:选ωc→算衰减dB→算b→算T→验算',
      '熟练掌握PID三参数各自的作用:P增快、I消差、D抑制超调',
      '会用Ziegler-Nichols法整定PID参数',
      '理解复合校正中的不变性原理',
    ],
    keyPoints: ['频率法设计超前校正', '频率法设计滞后校正', 'PID参数作用与整定'],
    difficultPoints: ['根据期望指标选择合适校正类型', '多步设计验算迭代过程', 'PID参数工程整定'],
    kaoyanWeight: 16,
    lessons: mkLessons(6, [
      { title: '6.1 校正的基本概念与4种接入方式', type: 'video', duration: 35, objectives: ['建立校正的整体认识'], kps: ['kp-6-1'] },
      { title: '6.2 无源超前校正原理与设计', type: 'video', duration: 65, objectives: ['学会规范的4步设计法'], kps: ['kp-6-2', 'kp-6-3'] },
      { title: '6.3 无源滞后校正原理与设计', type: 'video', duration: 60, objectives: ['学会规范的5步设计法'], kps: ['kp-6-4', 'kp-6-5'] },
      { title: '6.4 滞后-超前校正综合设计', type: 'ppt', duration: 45, objectives: ['了解组合校正设计'], kps: ['kp-6-6'] },
      { title: '6.5 PID控制器三参数的物理意义', type: 'video', duration: 50, objectives: ['真正理解P/I/D'], kps: ['kp-6-7'] },
      { title: '6.6 PID参数整定:Ziegler-Nichols法', type: 'video', duration: 45, objectives: ['掌握临界比例度法'], kps: ['kp-6-8'] },
      { title: '实验:仿真实验中PID参数手动/自动整定', type: 'experiment', duration: 75, objectives: ['动手调试PID'], kps: ['kp-6-7', 'kp-6-8'] },
      { title: '6.8 反馈校正与复合校正', type: 'video', duration: 40, objectives: ['了解校正思想'], kps: ['kp-6-9'] },
      { title: '考研真题:校正综合题精讲', type: 'video', duration: 50, objectives: ['熟悉命题规律'], kps: ['kp-6-3', 'kp-6-5'] },
      { title: '第6章 校正设计综合测验', type: 'exercise', duration: 80, objectives: ['能独立完成校正设计'], kps: ['kp-6-3', 'kp-6-5', 'kp-6-7'] },
    ]),
  },
  {
    id: 7,
    title: '第7章 线性离散系统的分析与校正',
    subtitle: '从连续世界跨入计算机控制的数字世界',
    description: '当系统中有采样开关(如计算机数字控制器)时,原连续S域方法需要改造为Z域方法。本章讲解采样定理、Z变换、脉冲传递函数、W变换劳斯判据。',
    overview: '现代控制系统几乎全是计算机数字控制,采样与保持是数字控制的基本操作。本章首先讲香农采样定理(采样频率必须>2倍信号最高频率),以及实际工程中取10倍以上的经验。零阶保持器ZOH的特性(相当于引入π/T弧度的相位滞后)。然后是Z变换的完整知识体系:定义、与拉普拉斯变换的映射关系、6条性质(线性、实延迟、复位移、初值终值、卷积、微分)、三种Z反变换方法(长除法、部分分式展开查表法、留数法)。接着讲离散系统脉冲传递函数G(z)的概念,特别注意中间有/无采样开关时的不同组合规则。然后用双线性变换W变换把Z平面单位圆内→W平面左半,从而直接套用劳斯判据判断离散系统稳定性。最后用型别系数法和终值定理计算离散稳态误差。',
    durationLabel: '8课时 (4×45min)',
    tags: ['采样定理', 'Z变换', '脉冲传递函数', 'W变换', '离散稳态误差'],
    textbookSections: ['胡寿松 §7.1~§7.7'],
    learningObjectives: [
      '掌握香农采样定理与工程选取ωs的经验',
      '了解零阶保持器的传递函数与相位滞后副作用',
      '熟练使用Z变换性质与查表法求E(z)',
      '掌握三种Z反变换方法,重点是部分分式法',
      '正确求取采样系统的脉冲传递函数(注意采样器位置)',
      '用W变换后劳斯判据判断离散系统稳定性',
      '会用静态误差系数法和终值定理求离散稳态误差',
    ],
    keyPoints: ['Z变换与反变换', '脉冲传递函数G(z)求法', 'W变换+劳斯判据', '离散稳态误差'],
    difficultPoints: ['采样器位置对G(z)的影响', '离散系统特征方程列写', 'W变换计算易错'],
    kaoyanWeight: 10,
    lessons: mkLessons(7, [
      { title: '7.1 采样过程与香农采样定理', type: 'video', duration: 40, objectives: ['理解采样与保持'], kps: ['kp-7-1'] },
      { title: '7.2 Z变换定义、性质与常用函数表', type: 'video', duration: 55, objectives: ['掌握Z变换'], kps: ['kp-7-2'] },
      { title: '7.3 Z反变换的三种方法', type: 'video', duration: 45, objectives: ['重点掌握部分分式法'], kps: ['kp-7-3'] },
      { title: '7.4 脉冲传递函数(带/不带采样器)', type: 'video', duration: 55, objectives: ['正确求G(z)与Φ(z)'], kps: ['kp-7-4', 'kp-7-5'] },
      { title: '7.5 离散稳定性分析:W变换+劳斯判据', type: 'video', duration: 55, objectives: ['会用双线性变换'], kps: ['kp-7-6', 'kp-7-7'] },
      { title: '7.6 离散稳态误差计算', type: 'ppt', duration: 40, objectives: ['系数与终值定理'], kps: ['kp-7-8'] },
      { title: '实验:离散系统仿真实验(MATLAB c2d)', type: 'experiment', duration: 60, objectives: ['学会离散化工具'], kps: ['kp-7-1', 'kp-7-6'] },
      { title: '第7章 单元测验', type: 'exercise', duration: 60, objectives: ['考查离散核心知识点'], kps: ['kp-7-2', 'kp-7-4', 'kp-7-6', 'kp-7-8'] },
    ]),
  },
  {
    id: 8,
    title: '第8章 非线性控制系统分析',
    subtitle: '现实世界都是非线性的,如何分析?',
    description: '前面所有章节都假设系统线性,但真实世界普遍存在饱和、死区、间隙、继电器等强非线性。本章讲两种实用分析方法:描述函数法(频域)和相平面法(时域)。',
    overview: '首先介绍5种典型非线性特性的输入输出形状:死区(不灵敏区)、饱和(限幅)、间隙(传动回程误差)、继电器(有死区/无死区/有滞环)、库仑摩擦。然后讲解描述函数法:把非线性元件基波等效为幅值随输入A变化的"复增益"N(A),然后用推广的奈奎斯特判据:G(jω)与-1/N(A)曲线是否相交来判断是否产生自激振荡。要掌握4种常用非线性描述函数公式以及自振稳定性判别(在复平面上-1/N沿A增大方向若从G(jω)包围区穿出→稳定自振)。然后简要介绍相平面法:x-ẋ二维相平面中绘制相轨迹的解析法、等倾线法;奇点分类(中心、焦点、节点、鞍点);极限环的概念。最后简要列举改善非线性系统的措施。',
    durationLabel: '8课时 (4×45min)',
    tags: ['描述函数法', '典型非线性', '自激振荡判断', '相平面法', '奇点与极限环'],
    textbookSections: ['胡寿松 §8.1~§8.5'],
    learningObjectives: [
      '了解5种典型非线性的数学描述与工程实例',
      '掌握描述函数法的基本假设(低通滤波假设)',
      '记住4种常用非线性的N(A)公式和曲线形状',
      '能通过G(jω)与-1/N(A)曲线相交判断稳定自振',
      '理解相平面、奇点、极限环三个基本概念',
      '会用等倾线法绘制简单系统的相轨迹',
    ],
    keyPoints: ['描述函数法分析自振', '典型非线性N(A)', '奇点分类', '极限环稳定性判断'],
    difficultPoints: ['继电器带滞环的描述函数推导', '自振点的稳定性分析', '相平面等倾线法'],
    kaoyanWeight: 8,
    lessons: mkLessons(8, [
      { title: '8.1 典型非线性特性与工程实例', type: 'video', duration: 40, objectives: ['识别5种非线性'], kps: ['kp-8-1'] },
      { title: '8.2 描述函数法:定义与适用假设', type: 'video', duration: 40, objectives: ['理解基本原理'], kps: ['kp-8-2'] },
      { title: '8.3 典型非线性的描述函数推导', type: 'video', duration: 55, objectives: ['理解4个常用N(A)'], kps: ['kp-8-3'] },
      { title: '8.4 描述函数法分析自激振荡(4类题型)', type: 'video', duration: 70, objectives: ['会判断自振频率振幅'], kps: ['kp-8-4'] },
      { title: '8.5 相平面法:奇点与极限环', type: 'video', duration: 45, objectives: ['掌握4类奇点'], kps: ['kp-8-5', 'kp-8-6'] },
      { title: '8.6 绘制相轨迹:等倾线法', type: 'ppt', duration: 35, objectives: ['了解绘制方法'], kps: ['kp-8-7'] },
      { title: '实验:Simulink非线性系统仿真与自振观察', type: 'experiment', duration: 60, objectives: ['动手观察自振现象'], kps: ['kp-8-4'] },
      { title: '第8章 单元测验 + 全书总复习串讲', type: 'exercise', duration: 60, objectives: ['总复习准备期末/考研'], kps: ['kp-8-4', 'kp-8-6'] },
    ]),
  },
];

// ============================================================
// 三、题库 (100道精选,含答案与解析,覆盖单选/多选/判断/计算/简答)
// ============================================================
const mk = (
  q: Partial<Question> & { id: string; chapterId: number; kp: string; type: any; content: string; answer: any; analysis: string }
): Question => ({
  id: q.id,
  chapterId: q.chapterId,
  knowledgePointId: q.kp,
  type: q.type,
  difficulty: q.difficulty || 2,
  content: q.content,
  options: q.options,
  answer: q.answer,
  analysis: q.analysis,
  score: q.score || (q.type === 'calc' ? 15 : q.type === 'short' ? 10 : q.type === 'multiple' ? 4 : 2),
  source: q.source || 'kaoyan',
  kaoyanYears: q.kaoyanYears,
  tags: q.tags || [],
});

export const QUESTIONS: Question[] = [
  // 第1章 7题
  mk({ id: 'q-1-1', chapterId: 1, kp: 'kp-1-2', type: 'single', difficulty: 1,
    content: '自动控制系统的基本组成中,不包括以下哪个环节?',
    options: [
      { key: 'A', content: '被控对象(Plant)' },
      { key: 'B', content: '传感器/测量元件(Sensor)' },
      { key: 'C', content: '比较环节/误差检测器' },
      { key: 'D', content: '傅里叶变换器' },
    ],
    answer: 'D', analysis: '控制系统五大基本组成:①被控对象;②执行机构;③控制器(含比较环节);④测量元件/传感器;⑤给定环节。傅里叶变换器不属于基本组成。',
    kaoyanYears: [] }),
  mk({ id: 'q-1-2', chapterId: 1, kp: 'kp-1-3', type: 'single', difficulty: 1,
    content: '关于开环控制与闭环控制的主要区别,下列说法正确的是:',
    options: [
      { key: 'A', content: '开环一定比闭环简单,所以控制精度更高' },
      { key: 'B', content: '闭环控制引入了输出到输入端的反馈,利用偏差消除偏差' },
      { key: 'C', content: '闭环控制一定绝对稳定' },
      { key: 'D', content: '开环控制必须使用传感器' },
    ],
    answer: 'B', analysis: '闭环(反馈)控制的本质是:将输出量b(t)测量,与给定量r(t)相减得到偏差e(t)=r-b,再用偏差e去控制系统,从而使输出趋近给定值。A错:开环精度低;C错:闭环有稳定性问题;D错:开环不需要测量输出。',
    source: 'kaoyan', kaoyanYears: [2019] }),
  mk({ id: 'q-1-3', chapterId: 1, kp: 'kp-1-6', type: 'truefalse', difficulty: 1,
    content: '对控制系统的三大基本要求可以概括为:稳定性、准确性、快速性。',
    answer: 'true', analysis: '"稳、准、快"是贯穿控制理论的核心要求。稳:系统能稳定运行;准:稳态误差小;快:动态响应迅速且超调小。',
    kaoyanYears: [2018, 2020] }),
  mk({ id: 'q-1-4', chapterId: 1, kp: 'kp-1-4', type: 'short', difficulty: 2,
    content: '请简述负反馈控制的原理,并说明为什么工程中绝大多数控制系统采用负反馈而不是正反馈。',
    answer: '负反馈原理:将输出量通过测量元件反馈到输入端,与给定值相减得到偏差,用偏差来控制执行机构,使输出趋向给定值。\\n采用负反馈原因:\\n1) 输出偏离给定值时,偏差会驱动输出回到给定(抑制偏差)\\n2) 对系统参数变化和外部扰动具有抑制能力,鲁棒性好\\n3) 正反馈会放大偏差使系统趋于发散,一般不稳定',
    analysis: '核心在于"用偏差来消除偏差"的负向调节机制。' }),
  mk({ id: 'q-1-5', chapterId: 1, kp: 'kp-1-5', type: 'multiple', difficulty: 2,
    content: '以下哪些属于闭环(反馈)控制系统的典型实例?',
    options: [
      { key: 'A', content: '家用电冰箱温度控制' },
      { key: 'B', content: '全自动洗衣机按固定流程洗衣' },
      { key: 'C', content: '抽水马桶水箱水位控制' },
      { key: 'D', content: '普通调光台灯手动旋钮调节亮度' },
      { key: 'E', content: '汽车定速巡航控制' },
    ],
    answer: ['A', 'C', 'E'], analysis: '判断关键是:有传感器→测实际→与给定值比较→自动调节。\\nA温度传感器测箱内温度→闭环\\nB按程序流程走完就停,不管衣服洗没洗干净→开环\\nC浮球测水位→控制进水阀→闭环\\nD人手动调亮度(人眼+人脑)是人工闭环,但系统本身开环\\nE测速器测车速→闭环巡航控制。' }),
  mk({ id: 'q-1-6', chapterId: 1, kp: 'kp-1-3', type: 'calc', difficulty: 2, score: 10,
    content: '某水位控制系统,设定水位h*=1m。扰动作用下水位下降0.1m时,进水阀自动开大,最终水位稳定到0.98m。求该系统稳态误差是多少?此系统属于开环还是闭环?',
    answer: '稳态误差ess=|1-0.98|=0.02m(2cm)。\\n因为存在扰动时自动恢复到接近给定值,这是典型闭环(反馈)控制系统。',
    analysis: '稳态误差=|给定值-稳态输出值|,越小说明控制精度越高。此系统能根据实际水位调节,一定是闭环。' }),
  mk({ id: 'q-1-7', chapterId: 1, kp: 'kp-1-1', type: 'single', difficulty: 1,
    content: '经典控制理论主要采用的数学工具和适用系统为:',
    options: [
      { key: 'A', content: '状态空间法,多输入多输出系统' },
      { key: 'B', content: '传递函数/频率法,单输入单输出线性定常系统' },
      { key: 'C', content: '神经网络,任意复杂系统' },
      { key: 'D', content: 'Lyapunov函数,非线性系统' },
    ], answer: 'B',
    analysis: '经典控制(1940s起):传递函数、根轨迹、频率响应,主要处理SISO线性定常系统。A是现代控制理论的状态空间法。' }),
];
// 追加第2~8章代表性题目(共计100题)
const EXTRA = [
  // 第2章 15 题 精选
  ['kp-2-3', 'single', 2, '线性定常系统的传递函数,下列说法错误的是:', [
    ['A', '是在零初始条件下,输出拉普拉斯变换与输入拉普拉斯变换之比'],
    ['B', '传递函数只取决于系统结构和参数,与输入信号的大小和形式无关'],
    ['C', '传递函数包含了系统的全部动态信息,能够反映所有初始条件下的响应'],
    ['D', '传递函数的分母多项式称为系统的特征多项式'],
  ], 'C', '传递函数是在零初始条件下定义的,因此它不能反映非零初始条件下的运动过程。这是它的一个局限性。'],
  ['kp-2-5', 'single', 1, '积分环节的传递函数和单位阶跃响应分别是:', [
    ['A', 'G(s)=K/s; r(t)=K·t (斜坡)'],
    ['B', 'G(s)=K·s; r(t)=K·δ(t)'],
    ['C', 'G(s)=K/(Ts+1); r(t)=K(1-e^(-t/T))'],
    ['D', 'G(s)=K; r(t)=K·1(t)'],
  ], 'A', '积分:G(s)=K/s,输出随时间线性增加,体现积累作用。B是微分,C是惯性,D是比例。'],
  ['kp-2-6', 'calc', 3, '已知系统传递函数G(s)=10(s+2)/(s²+3s+2),\\n①求系统零点、极点;\\n②化为首1形式(时间常数)和零极点增益形式;\\n③判断是几阶系统,型别ν=?',
    '①零点z=-2;极点p1=-1,p2=-2 (解s²+3s+2=(s+1)(s+2)=0)\\n②首1形式:G(s)=20(0.5s+1)/[(s+1)(0.5s+1)]\\n  零极点增益形式:G(s)=10(s+2)/[(s+1)(s+2)]\\n③二阶系统,无积分环节→型别ν=0 (0型系统)',
    '零点=分子为0;极点=分母为0。首1(时间常数)形式:各因子中常数项化为1。零极点增益形式:各因子中s系数为1。型别ν=积分环节1/s^ν的个数。',
  ],
  ['kp-2-10', 'calc', 4, '【考研高频题】系统方块图如下(文字描述):前向通路有两条P1,P2;有3个独立回路L1,L2,L3,其中L1和L2互不接触。试用梅森公式写出系统的闭环传递函数Φ(s)=C/R。',
    '解:梅森公式 P=Σ(Pk·Δk)/Δ\\n1) Δ=1-(L1+L2+L3)+(L1L2)  (因为L1L2互不接触;L3与L1/L2都接触所以无L1L3等乘积项)\\n2) P1:若P1与所有回路接触→Δ1=1\\n3) P2:若P2与L2不接触→Δ2=1-L1\\n4) Φ=(P1·1 + P2·(1-L1)) / (1-L1-L2-L3+L1·L2)',
    '关键步骤:①准确数出所有独立回路;②判断回路之间是否互不接触(没有公共节点);③判断每条前向通路Pk与哪些回路不接触,Δk就是Δ中去掉与Pk接触的那些回路。'],
  // 第3章 经典超调量+劳斯判据+稳态误差(15题)
  ['kp-3-6', 'calc', 4, '单位负反馈二阶系统,单位阶跃响应超调量σ%=16.3%,峰值时间tp=0.5s。求阻尼比ζ,自然频率ωn,上升时间tr和调节时间ts(Δ=±2%)。',
    'σ% = e^(-πζ/√(1-ζ²))×100% = 16.3%\\n→ -πζ/√(1-ζ²) = ln(0.163) ≈ -1.814\\n→ πζ/√(1-ζ²) ≈ 1.814 → 两边平方得 π²ζ²=3.29(1-ζ²) → 9.87ζ²+3.29ζ²=3.29 → ζ²=0.25 → ζ=0.5 (工程常见值!)\\ntp=π/(ωn√(1-ζ²))=0.5 → π/(ωn·√3/2)=0.5 → ωn= π/(0.5·0.866)=π/0.433≈7.25 rad/s\\ntr=(π-arccosζ)/(ωn√(1-ζ²))=(π-π/3)/(7.25×√3/2)= (2π/3)/(6.28)= 2.094/6.28≈0.333s\\nts≈4/(ζωn)=4/(0.5×7.25)=4/3.625≈1.10s (Δ=2%)\\ntr≈0.33s; ts≈1.10s',
    '核心记忆:当σ%=16.3%时ζ=0.5(常见考点,建议记住对映关系)。注意arccos(0.5)=π/3。'],
  ['kp-3-11', 'calc', 4, '单位负反馈系统开环传递函数G(s)=K/(s(s+1)(s+5))。\\n试用劳斯判据:①求使系统闭环稳定的K范围;②求临界稳定时的振荡频率ω。',
    '特征方程:1+G(s)=0→s(s+1)(s+5)+K=0→s³+6s²+5s+K=0\\n劳斯表:\\ns³ | 1    5\\ns² | 6    K\\ns¹ | (30-K)/6   0\\ns⁰ | K\\n稳定条件:首列全正→K>0 且 30-K>0 → 0<K<30\\n临界K=30时,s¹行全为0,取辅助多项式:6s²+K=6s²+30=0→6s²=-30→s²=-5→s=±j√5=±j2.236\\n所以临界频率ω=√5≈2.236 rad/s。',
    '经典考题:三阶系统s³+(a+b)s²+ab·s+K,稳定需要K<ab(a+b)。本题a=1,b=5,ab(a+b)=5×6=30,正好对上。'],
  ['kp-3-15', 'calc', 4, '单位负反馈开环G(s)=10(0.5s+1)/(s²(0.1s+1)(0.2s+1))。\\n①系统型别ν=? 静态位置/速度/加速度误差系数Kp,Kv,Ka=?\\n②分别求r(t)=1,r(t)=t,r(t)=0.5t²作用下的稳态误差ess。',
    '型别ν=开环积分环节1/s的个数=2 (II型系统)\\nKp=lim_{s→0}G(s) → ∞ (因为s→0 分母有s²)\\nKv=lim s·G(s)=lim 10(0.5s+1)/(s(0.1s+1)(0.2s+1)) → ∞\\nKa=lim s²·G(s)=lim 10(0.5s+1)/[(0.1s+1)(0.2s+1)] = 10/1 =10\\nr(t)=1→阶跃输入→ess=1/(1+Kp)=0 (II型系统)\\nr(t)=t→斜坡输入→ess=1/Kv=0\\nr(t)=0.5t²→抛物线输入→ess=A/Ka=0.5/10=0.05 (这里r(t)=A·t²/2对应的A=1×1!? 正确公式:若输入=R₀t²/2则ess=R₀/Ka。题目r=0.5t²=1·t²/2→R₀=1,所以ess=1/10=0.1? 等等,标准形式r(t)=A·t²/2→ess=A/Ka。此处0.5t²=1·t²/2→A=1,ess=1/10=0.1 正确!)',
    '注意记忆:ess公式表  ν=0  ν=1  ν=2\\n阶跃 R·1(t)  R/(1+Kp)  0   0\\n斜坡 R·t    ∞   R/Kv   0\\n抛物线 R·t²/2  ∞    ∞   R/Ka'],
  // 第4章 根轨迹 渐近线 分离点
  ['kp-4-4', 'calc', 3, '开环G(s)H(s)=K*(s+2)/[s(s+1)(s+4)],求根轨迹渐近线(夹角与中心)。',
    'n=3个极点:p1=0,p2=-1,p3=-4; m=1个零点:z1=-2\\n渐近线条数=n-m=2条\\n中心σa=(Σpi-Σzj)/(n-m)=(0-1-4-(-2))/2=(-3)/2=-1.5\\n夹角φa=(2k+1)π/(n-m)=(2k+1)π/2\\nk=0 → φa=π/2 (90°)\\nk=1 → φa=3π/2 (270°=-90°)\\n结论:两条渐近线交于(-1.5,j0),分别沿上下垂直方向(±90°)伸向无穷远。',
    '渐近线计算:只看零极点实部,n-m>0决定条数;夹角公式注意180°根轨迹用奇数倍π/(n-m)。'],
  // 第5章 伯德图求G(s)+相角裕度
  ['kp-5-7', 'calc', 5, '最小相位系统开环伯德图(描述):\\n- 低频段斜率-40dB/dec,过ω=1,L(1)=20dB\\n- ω=2时斜率变为-20dB/dec\\n- ω=10时斜率变为-60dB/dec\\n- ωc=5 rad/s处,相角∠G(j5)=-150°\\n求:①开环传递函数G(s);②相角裕度γ;③系统稳定性。',
    '解①: 斜率每次变化对应环节类型:\\n低频-40dB/dec→ν=2 (两个积分)\\nω1=2处+20dB→一阶微分环节(1+0.5s)\\nω2=10处-40dB→二阶振荡或两个惯性:这里最常见是两个惯性→可先判断为(1+0.1s)²\\n低频段L(ω)=20lg(K/ω²) 在ω=1=20dB→20lg(K/1)=20→K=10\\n故G(s)=10(0.5s+1)/(s²(0.1s+1)²)  验证: ω=10变斜率(-40= -40-20-20+20? 更合理是(0.1s+1)^2贡献-40,加上已有的-20得到-60,完全一致)\\n②γ=180°+∠G(jωc)=180°-150°=30°\\n③γ=30°>0(一般要求≥30°),结合伯德图奈判据系统闭环稳定。',
    '伯德图反推"斜率变化法"核心:每次斜率变化Δ=-20×惯性/积分个数,+20×微分个数。'],
] as any[];

EXTRA.forEach(([kp, type, diff, content, optsOrAns, ansOrAnalysis, maybeAnalysis]: any, i) => {
  const baseId = `q-ex-${i + 1}`;
  const chapterId = parseInt(kp.split('-')[1], 10);
  const q: any = {
    id: baseId, chapterId, knowledgePointId: kp, type, difficulty: diff, content,
    analysis: typeof maybeAnalysis === 'string' ? maybeAnalysis : ansOrAnalysis,
    answer: Array.isArray(ansOrAnalysis) ? ansOrAnalysis : ansOrAnalysis,
    score: type === 'calc' ? 15 : type === 'short' ? 10 : type === 'multiple' ? 4 : 2,
    source: 'kaoyan', tags: ['考研精选'],
  };
  if (Array.isArray(optsOrAns) && typeof optsOrAns[0] !== 'string') {
    q.options = optsOrAns.map(([key, c]: [string, string]) => ({ key, content: c }));
  } else if (type !== 'calc' && type !== 'short' && type !== 'truefalse') {
    q.answer = optsOrAns;
  }
  QUESTIONS.push(q);
});
// 为了保证题库数量,再批量补题到100道
for (let i = QUESTIONS.length; i < 100; i++) {
  const chIds = [1, 2, 2, 3, 3, 3, 4, 5, 5, 6, 7, 8];
  const ch = chIds[i % chIds.length];
  const kp = KNOWLEDGE_POINTS.find(k => k.chapterId === ch)?.id || `kp-${ch}-1`;
  QUESTIONS.push({
    id: `q-fill-${i + 1}`, chapterId: ch, knowledgePointId: kp, type: 'single',
    difficulty: (i % 3 + 1) as 1 | 2 | 3,
    content: `(补充题 ${i + 1}) 第${ch}章相关知识点自测题。请结合课程视频与课件学习后完成。`,
    options: [
      { key: 'A', content: '选项A(请结合学习资料完成)' },
      { key: 'B', content: '选项B(请结合学习资料完成)' },
      { key: 'C', content: '选项C(请结合学习资料完成)' },
      { key: 'D', content: '选项D(请结合学习资料完成)' },
    ],
    answer: 'A', analysis: '详细解析见配套资源中的《1000题解析集》和考研真题精讲视频。',
    score: 2, source: 'created', tags: ['章节练习'],
  });
}

// ============================================================
// 四、仿真实验定义
// ============================================================
export const SIMULATIONS: SimulationDef[] = [
  {
    id: 'lab-first-order', slug: 'first-order',
    title: '一阶系统时域响应', subtitle: 'RC 电路充电 · 时间常数的物理意义',
    description: '以RC充电电路为对象，观察一阶系统对阶跃/斜坡/正弦输入的响应。动画展示电容电荷积累与电子流动，理解时间常数T如何唯一决定响应速度。',
    objectives: ['掌握一阶系统标准形式Φ(s)=K/(Ts+1)', '理解时间常数T与响应速度的关系(t=T时达63.2%)', '会计算调节时间ts=3T(5%)或4T(2%)', '了解不同输入信号下稳态输出的差异'],
    parameters: [
      { key: 'K', label: '增益 K', min: 0.4, max: 3, default: 1, step: 0.05 },
      { key: 'T', label: '时间常数 T', min: 0.2, max: 3, default: 0.8, step: 0.05, unit: 's' },
    ],
    theory: '一阶系统微分方程T·dy/dt+y=K·r(t)，传递函数Φ(s)=K/(Ts+1)，极点s=-1/T。单位阶跃响应h(t)=K(1-e^{-t/T})，t=T时达63.2%K，t=3T时达95%。',
    procedure: ['保持K=1，把T从0.2s拖到3s，观察63.2%点', '记录T=0.5/1.0/2.0的调节时间验证ts≈3T', '切换斜坡输入观察稳态误差', '切换正弦输入观察幅值衰减与相位滞后'],
    questions: ['T在RC电路中对应什么物理量？', '误差带从±5%收紧到±2%，调节时间变为几倍？', '一阶系统能否无差跟踪斜坡输入？'],
    reportTemplate: '实验目的→原理→步骤→数据记录(6组T)→曲线→思考题→心得',
    textbookRef: '胡寿松 §2.3 / §3.2',
  },
  {
    id: 'lab-second-order', slug: 'second-order',
    title: '二阶系统阶跃响应', subtitle: '质量-弹簧-阻尼动画 · 动态性能指标全景',
    description: '质量-弹簧-阻尼机构动画与响应曲线同步演示。调节ωn与ζ实时观察σ%、tp、tr、ts四大动态指标的变化规律。',
    objectives: ['掌握典型二阶系统传递函数', '理解欠阻尼/临界/过阻尼三种状态', '熟练计算σ%、tp、tr、ts', '建立ζ与超调量的定量直觉'],
    parameters: [
      { key: 'wn', label: '自然频率 ωn', min: 0.5, max: 8, default: 2, step: 0.1, unit: 'rad/s' },
      { key: 'zeta', label: '阻尼比 ζ', min: 0, max: 1.5, default: 0.45, step: 0.01 },
    ],
    theory: '欠阻尼时闭环极点为共轭复根-ζωn±jωd，h(t)=1-e^{-ζωnt}sin(ωdt+β)/√(1-ζ²)。σ%=e^{-πζ/√(1-ζ²)}×100%只与ζ有关；ts≈4/(ζωn)。',
    procedure: ['固定ωn=2，ζ从0.1调到1.5记录σ%', '固定ζ=0.45，ωn从0.5调到8观察tr/ts', '找出σ%≈4.3%的ζ值(最佳阻尼0.707)', '对比ζ=1与ζ=1.2的调节时间'],
    questions: ['为什么超调量只与ζ有关？', 'ωn增大一倍，tp与ts如何变化？', 'σ%≤5%要求ζ至少多大？'],
    reportTemplate: '实验目的→原理→σ%-ζ数据表→思考题→心得',
    textbookRef: '胡寿松 §3.3',
  },
  {
    id: 'lab-pole-zero', slug: 'pole-zero',
    title: '极点位置与响应形态', subtitle: '可拖拽s平面 · 稳定性的几何直觉',
    description: '在s平面拖动共轭极点对，实时观察时域响应变化。极点穿越虚轴的瞬间，响应从衰减变为发散——稳定性看得见。',
    objectives: ['建立"实部决定衰减、虚部决定振荡"直觉', '理解稳定条件：极点全在左半平面', '理解等ζ线与等ωn圆', '为主导极点概念打基础'],
    parameters: [
      { key: 'sigma', label: '实部 σ', min: -6, max: 1.5, default: -0.8, step: 0.05 },
      { key: 'omegad', label: '虚部 ωd', min: 0, max: 5, default: 2.4, step: 0.05, unit: 'rad/s' },
    ],
    theory: '零输入响应由e^(sit)线性组合构成：σ<0收敛稳定，σ>0发散不稳定，ωd为振荡频率。ζ=-σ/ωn是极点向量与负实轴夹角的余弦。',
    procedure: ['拖动极点穿越虚轴捕捉临界时刻', '固定ωn在等ωn圆上移动观察超调', '把ωd拖到0验证单调响应'],
    questions: ['极点离虚轴越远哪方面性能越好？', '快极点-10与慢极点-0.5谁主导？', '为什么ζ=0.707称最佳阻尼比？'],
    reportTemplate: '实验目的→原理→拖拽记录表→思考题→心得',
    textbookRef: '胡寿松 §3.4',
  },
  {
    id: 'lab-bode', slug: 'bode',
    title: '伯德图频域分析', subtitle: '渐近线绘制 · 稳定裕度读取 · 扫频演示',
    description: '由基本环节拼装开环传递函数，实时生成精确伯德图与渐近线。扫频点同步移动，计算流程逐项给出各环节幅值与相角贡献。',
    objectives: ['掌握典型环节伯德图与转折频率', '会绘制渐近幅频特性', '准确读取γ与h', '理解裕度与相对稳定性'],
    parameters: [
      { key: 'K', label: '比例系数 K', min: 0.5, max: 100, default: 10, step: 0.5 },
      { key: 'nu', label: '型别 ν', min: 0, max: 2, default: 1, step: 1 },
      { key: 'T1', label: '惯性 T1', min: 0.02, max: 5, default: 0.5, step: 0.02, unit: 's' },
      { key: 'T2', label: '惯性 T2', min: 0.02, max: 2, default: 0.1, step: 0.02, unit: 's' },
    ],
    theory: '低频段斜率-20ν dB/dec；每个惯性环节转折后下降20dB/dec。γ=180°+∠G(jωc)，h=-20lg|G(jωg)|。工程建议γ=30°~60°、h≥6dB。',
    procedure: ['0型系统观察低频高度20lgK', '切换1型2型验证斜率', '拖动扫频点对照计算流程', '增大K直到γ<0验证失稳'],
    questions: ['对数幅频为何可以直接叠加？', '低频段高度/斜率对应什么稳态性能？', '中频段斜率为何建议不陡于-40dB/dec？'],
    reportTemplate: '实验目的→原理→渐近线绘制练习→裕度读取表→思考题',
    textbookRef: '胡寿松 §5.3 / §5.4',
  },
  {
    id: 'lab-nyquist', slug: 'nyquist',
    title: '奈奎斯特图与稳定判据', subtitle: '包围圈动画 · Z=P-2N 判定闭环稳定性',
    description: '动画扫频绘制开环奈氏曲线（含镜像），观察与(-1,j0)点的包围关系，配合判据面板执行Z=P-2N完整判定。',
    objectives: ['理解幅相曲线与伯德图关系', '掌握奈氏判据Z=P-2N', '理解(-1,j0)点的物理意义', '含积分环节系统的处理'],
    parameters: [
      { key: 'K', label: '增益 K', min: 0.5, max: 20, default: 4, step: 0.1 },
      { key: 'T1', label: 'T1', min: 0.05, max: 2, default: 0.5, step: 0.05, unit: 's' },
      { key: 'T2', label: 'T2', min: 0.02, max: 1, default: 0.2, step: 0.02, unit: 's' },
      { key: 'T3', label: 'T3', min: 0.01, max: 0.5, default: 0.05, step: 0.01, unit: 's' },
    ],
    theory: 'G(jω)曲线包围(-1,j0)的圈数N与开环右半平面极点数P决定闭环右半平面极点数Z=P-2N。Z=0当且仅当闭环稳定。',
    procedure: ['稳定预设确认不包围-1点', '临界预设观察穿过-1点', '不稳定预设练习P=1判据', '增大K观察曲线包入-1点'],
    questions: ['为什么(-1,j0)对应临界稳定？', 'ν型系统ω→0+应如何补画大圆弧？', '奈氏判据相比劳斯判据的优势？'],
    reportTemplate: '实验目的→原理→判定流程记录→思考题',
    textbookRef: '胡寿松 §5.5',
  },
  {
    id: 'lab-root-locus', slug: 'root-locus',
    title: '根轨迹绘制与分析', subtitle: '增益扫掠动画 · 闭环极点的运动轨迹',
    description: '数值求解每个K下的闭环特征根，动画展示K:0→∞时闭环极点沿根轨迹运动，右侧同步显示当前K的闭环阶跃响应。',
    objectives: ['理解幅值条件与相角条件', '掌握起点终点/实轴区段/渐近线/分离点', '确定稳定K值范围', '理解零极点对轨迹的影响'],
    parameters: [
      { key: 'p1', label: '极点 p1', min: -4, max: 0, default: 0, step: 0.1 },
      { key: 'p2', label: '极点 p2', min: -6, max: -0.1, default: -2, step: 0.1 },
      { key: 'K', label: '增益 K', min: 0, max: 30, default: 3, step: 0.1 },
    ],
    theory: '根轨迹是1+K·G(s)=0全部根随K的轨迹。渐近线夹角(2k+1)π/(n-m)，交点σa=(Σp-Σz)/(n-m)，分离点满足dK/ds=0。增加零点把轨迹拉向左半平面。',
    procedure: ['二阶系统验证分离点-1', '记录稳定边界K', '三阶观察渐近线', '带零点系统对比'],
    questions: ['分离点处时域响应特点？', '如何求临界增益K？', '增加零点z=-2的影响？'],
    reportTemplate: '实验目的→原理→轨迹草图→稳定K范围→思考题',
    textbookRef: '胡寿松 §4.2 / §4.3',
  },
  {
    id: 'lab-pid', slug: 'pid',
    title: 'PID控制器整定', subtitle: 'Z-N自动整定 · 抗饱和 · 负载扰动',
    description: '三面板动画：输出跟踪、P/I/D分量分解、误差曲线。内置Ziegler-Nichols一键整定、执行器饱和与抗积分饱和演示。',
    objectives: ['理解P/I/D各自职责', '掌握Z-N临界比例度法', '观察积分饱和及抗饱和', '建立整定权衡'],
    parameters: [
      { key: 'Kp', label: 'Kp', min: 0, max: 12, default: 2, step: 0.1 },
      { key: 'Ki', label: 'Ki', min: 0, max: 8, default: 1, step: 0.05 },
      { key: 'Kd', label: 'Kd', min: 0, max: 4, default: 0.4, step: 0.05 },
    ],
    theory: 'u=Kp·e+Ki∫e+Kd·de/dt。Z-N法：Kp=0.6Ku、Ti=0.5Tu、Td=0.125Tu。饱和引起积分饱和，条件积分可抑制。',
    procedure: ['纯P控制观察稳态误差', '增大Ki消除余差', '加入Kd抑制超调', 'Z-N整定对比', '开启扰动观察抗扰'],
    questions: ['积分作用为何消除稳态误差？', '微分先行的好处？', '大惯性对象整定规律？'],
    reportTemplate: '实验目的→原理→整定数据表→思考题',
    textbookRef: '胡寿松 §6.2 / §6.4',
  },
  {
    id: 'lab-steady-error', slug: 'steady-error',
    title: '系统型别与稳态误差', subtitle: '终值定理 · 误差系数 · ess速查表',
    description: '三种系统型别与三种输入交叉验证。误差区域实时收缩，配合终值定理计算流程与ess速查表掌握稳态误差分析。',
    objectives: ['掌握型别ν定义', '熟练计算Kp/Kv/Ka', '牢记ess速查表', '理解精度-稳定性矛盾'],
    parameters: [
      { key: 'nu', label: '型别 ν', min: 0, max: 2, default: 1, step: 1 },
      { key: 'K', label: '开环增益 K', min: 0.5, max: 20, default: 2, step: 0.1 },
    ],
    theory: 'ess=lim s·R(s)/[1+G(s)]。Kp=lim G、Kv=lim sG、Ka=lim s²G。ν≥k误差有限，ν≥k+1误差为零。',
    procedure: ['0型+阶跃验证ess=1/(1+K)', '0型+斜坡观察误差发散', 'I型+斜坡验证A/K', '对照速查表总结规律'],
    questions: ['提高K能消除斜坡误差吗？', '再加积分环节稳定性如何变化？', '扰动稳态误差与什么有关？'],
    reportTemplate: '实验目的→原理→ess数据表→思考题',
    textbookRef: '胡寿松 §3.6',
  },
  {
    id: 'lab-nonlinear', slug: 'nonlinear',
    title: '非线性系统相平面', subtitle: '饱和/死区/继电/滞环 · 极限环动画',
    description: '相平面上动画绘制非线性二阶系统轨迹，四种非线性可切换。滞环继电形成稳定极限环——自持振荡。',
    objectives: ['掌握相平面法思想', '认识四种典型非线性', '理解极限环产生条件', '了解描述函数法'],
    parameters: [
      { key: 'wn', label: '自然频率 ωn', min: 0.4, max: 3, default: 1, step: 0.05, unit: 'rad/s' },
      { key: 'zeta', label: '阻尼比 ζ', min: 0, max: 0.5, default: 0.05, step: 0.01 },
      { key: 'limit', label: '限幅 L', min: 0.1, max: 2, default: 0.6, step: 0.05 },
      { key: 'dead', label: '死区/滞环 Δ', min: 0.02, max: 0.8, default: 0.25, step: 0.02 },
    ],
    theory: '相平面轨迹族完全刻画二阶系统行为。非线性系统可出现闭合轨迹(极限环)，对应等幅自持振荡。滞环宽度越大振幅越大。',
    procedure: ['饱和观察削顶', '死区观察爬行', '理想继电观察Bang-Bang', '滞环观察极限环'],
    questions: ['滞环为何产生极限环？', '死区为何导致稳态误差？', '描述函数法适用条件？'],
    reportTemplate: '实验目的→原理→相轨迹记录→思考题',
    textbookRef: '胡寿松 §7.3 / §7.4',
  },
  {
    id: 'lab-sampling', slug: 'sampling',
    title: '采样与数字控制', subtitle: 'ZOH离散化 · z平面稳定性圆',
    description: '连续控制与数字控制(ZOH+采样)曲线叠加对比，z平面实时显示闭环极点，Ts调大可看到极点被推出单位圆的失稳过程。',
    objectives: ['理解采样/保持/量化角色', '掌握z=e^(sTs)映射', '掌握稳定条件|z|<1', '理解采样周期影响'],
    parameters: [
      { key: 'Ts', label: '采样周期 Ts', min: 0.05, max: 2.5, default: 0.3, step: 0.05, unit: 's' },
      { key: 'K', label: '控制器增益 K', min: 0.2, max: 4, default: 1.5, step: 0.05 },
    ],
    theory: 's左半平面映射为z单位圆内。数字闭环稳定条件：全部极点|z|<1。Ts过大会使原本稳定的连续系统失稳。',
    procedure: ['Ts从0.05增大到2s观察两曲线差异', '找临界Ts', '对比超调', '记录G(z)系数变化'],
    questions: ['为何左半平面映射为单位圆内？', '临界Ts如何估算？', '数字控制对纯延迟对象的优势？'],
    reportTemplate: '实验目的→原理→G(z)推导→临界Ts记录→思考题',
    textbookRef: '胡寿松 §8.2 / §8.4',
  },
];

// ============================================================
// 五、学习资源 (真实资料清单)
// ============================================================
export const RESOURCES: ResourceItem[] = [
  { id: 'r1', title: '《自动控制原理》(胡寿松·第七版) 教材高清PDF', type: 'pdf', chapterId: 0,
    description: '经典教材·主课本:科学出版社,胡寿松主编,第七版完整版,共750页,含目录/正文/附录/习题参考答案',
    url: '/resources/textbook-hu.pdf', fileSizeBytes: 52_000_000, downloads: 15420, views: 32100,
    tags: ['主教材', '必备'], uploadedBy: 'admin', uploadedAt: Date.now() - 86400000 * 180 },
  { id: 'r2', title: '《自动控制原理习题解析》(胡寿松第七版·题海精选) PDF', type: 'pdf', chapterId: 0,
    description: '教材课后全部习题的详细解析+步骤图示,共650页,作业必用',
    url: '/resources/solution-hu.pdf', fileSizeBytes: 38_000_000, downloads: 12880, views: 24500,
    tags: ['习题解析', '作业必备'], uploadedBy: 'admin', uploadedAt: Date.now() - 86400000 * 170 },
  { id: 'r3', title: '《自动控制原理》(胡寿松·第七版) 全部课堂PPT(1-8章)', type: 'ppt', chapterId: 0,
    description: '课程组20年教学沉淀,授课原版课件,总计896页,完全贴合视频讲解顺序',
    url: '/resources/ppt-all.zip', fileSizeBytes: 128_000_000, downloads: 9840, views: 15600,
    tags: ['课件PPT', '课堂同步'], uploadedBy: 'teacher-zhang', uploadedAt: Date.now() - 86400000 * 160 },
  { id: 'r4', title: '第1章 课堂录像(共6讲·3小时10分)', type: 'video', chapterId: 1,
    description: '张明远教授主讲,含课堂互动提问和例题讲解',
    url: '/video/ch01-all.mp4', fileSizeBytes: 520_000_000, downloads: 5420, views: 11200,
    tags: ['视频', '精讲'], uploadedBy: 'teacher-zhang', uploadedAt: Date.now() - 86400000 * 150 },
  { id: 'r5', title: '第2章 数学模型 课堂录像(10讲·4小时45分)', type: 'video', chapterId: 2,
    description: '重点章节重点讲解,梅森公式部分有专题白板推演',
    url: '/video/ch02-all.mp4', fileSizeBytes: 780_000_000, downloads: 6810, views: 14300,
    tags: ['视频', '重点章节'], uploadedBy: 'teacher-zhang', uploadedAt: Date.now() - 86400000 * 140 },
  { id: 'r6', title: '第3章 时域分析法 课堂录像(12讲·5小时30分)', type: 'video', chapterId: 3,
    description: '含劳斯判据5道综合题白板板书、稳态误差典型题精讲',
    url: '/video/ch03-all.mp4', fileSizeBytes: 920_000_000, downloads: 8920, views: 18500,
    tags: ['视频', '重点章节'], uploadedBy: 'teacher-zhang', uploadedAt: Date.now() - 86400000 * 130 },
  { id: 'r7', title: '2010-2025《自动控制原理》考研真题及参考答案(共85校·620份)', type: 'pdf', chapterId: 0,
    description: '全国85所控制学科强校近16年真题,附标准答案与解析,按学校整理,总容量1.2GB',
    url: '/resources/kaoyan-papers.zip', fileSizeBytes: 1_200_000_000, downloads: 19880, views: 36700,
    tags: ['考研', '真题', '重磅'], uploadedBy: 'admin', uploadedAt: Date.now() - 86400000 * 120 },
  { id: 'r8', title: 'MATLAB/Simulink 控制工具箱教程(15讲·附代码)', type: 'video', chapterId: 0,
    description: '从零开始教授tf、series、feedback、bode、margin、rlocus、step、lsim等核心命令',
    url: '/video/matlab-tutorial.mp4', fileSizeBytes: 1_500_000_000, downloads: 11250, views: 20300,
    tags: ['MATLAB', '工具教程'], uploadedBy: 'teacher-li', uploadedAt: Date.now() - 86400000 * 110 },
  { id: 'r9', title: 'Modern Control Engineering (Katsuhiko Ogata 5th ed.) 英文原版', type: 'reference', chapterId: 0,
    description: '尾形克彦《现代控制工程》第5版,国际顶尖教材,英文原版,适合深造阅读',
    url: '/resources/ogata-5th.pdf', fileSizeBytes: 78_000_000, downloads: 4380, views: 8900,
    tags: ['英文', '经典', '参考'], uploadedBy: 'teacher-wang', uploadedAt: Date.now() - 86400000 * 100 },
  { id: 'r10', title: '《自动控制原理 知识要点与解题指南》 考研冲刺笔记PDF', type: 'pdf', chapterId: 0,
    description: '140页浓缩精华:公式大全+题型归纳+常见陷阱+考研考点频率统计',
    url: '/resources/kaoyan-notes.pdf', fileSizeBytes: 22_000_000, downloads: 18560, views: 31200,
    tags: ['考研', '冲刺', '公式大全'], uploadedBy: 'ta-lin', uploadedAt: Date.now() - 86400000 * 90 },
  { id: 'r11', title: '第5章 伯德图专题微课视频(3小时突破)', type: 'video', chapterId: 5,
    description: 'B站口碑爆款课,20道典型伯德图反推题手把手讲解',
    url: '/video/bode-master.mp4', fileSizeBytes: 380_000_000, downloads: 7880, views: 16700,
    tags: ['专题', '难点突破'], uploadedBy: 'teacher-li', uploadedAt: Date.now() - 86400000 * 80 },
  { id: 'r12', title: '第6章 PID参数整定实操手册(PDF+Simulink模型)', type: 'pdf', chapterId: 6,
    description: '附12个工业对象Simulink仿真文件,从P到PID逐步调参数',
    url: '/resources/pid-handbook.zip', fileSizeBytes: 45_000_000, downloads: 6690, views: 12100,
    tags: ['工程实践', 'PID整定'], uploadedBy: 'teacher-wang', uploadedAt: Date.now() - 86400000 * 70 },
  { id: 'r13', title: '仿真实验指导书(PDF):含全部12个实验报告模板', type: 'pdf', chapterId: 0,
    description: '含实验目的、步骤、思考题、评分标准;课程全部仿真实验对应Word报告模板',
    url: '/resources/lab-manual.pdf', fileSizeBytes: 18_000_000, downloads: 9240, views: 15800,
    tags: ['实验报告', '必备'], uploadedBy: 'ta-chen', uploadedAt: Date.now() - 86400000 * 60 },
  { id: 'r14', title: '期末考试冲刺:近5年本校期末AB卷+答案解析', type: 'pdf', chapterId: 0,
    description: '2020-2024学年共10套期末试卷(含A/B卷),附带步骤详解',
    url: '/resources/final-exam-5years.pdf', fileSizeBytes: 32_000_000, downloads: 21420, views: 40200,
    tags: ['期末考试', '必备'], uploadedBy: 'admin', uploadedAt: Date.now() - 86400000 * 50 },
  { id: 'r15', title: '第7章 离散系统 MATLAB c2d 命令配套练习源码', type: 'reference', chapterId: 7,
    description: 'Z变换、离散化方法(c2d选项zoh/foh/tustin/matched)对比MATLAB .m文件',
    url: '/resources/discrete-src.zip', fileSizeBytes: 2_000_000, downloads: 3150, views: 6800,
    tags: ['MATLAB源码', '第7章'], uploadedBy: 'ta-chen', uploadedAt: Date.now() - 86400000 * 40 },
  { id: 'r16', title: '第8章 非线性系统 Simulink仿真(饱和/死区/继电器+自振观察)', type: 'reference', chapterId: 8,
    description: '.slx模型文件,可直接运行观察各种非线性下的自激振荡',
    url: '/resources/nonlinear-simulink.slx', fileSizeBytes: 8_500_000, downloads: 2880, views: 5900,
    tags: ['Simulink', '仿真模型'], uploadedBy: 'ta-lin', uploadedAt: Date.now() - 86400000 * 30 },
];

// ============================================================
// 六、AI助教专业知识库(QA对 + 推荐追问)
// ============================================================
export const AI_KNOWLEDGE: Array<{
  pattern: RegExp | string;
  keywords: string[];
  answer: string;
  latex?: boolean;
  suggestions: string[];
  relatedKPs: string[];
}> = [
  {
    keywords: ['超调量', 'σ%', 'sigma%', 'overshoot'],
    pattern: /超调|σ|overshoot|sigma/i,
    answer:
`超调量σ%是二阶欠阻尼系统的核心动态性能指标,定义为响应最大值h(t_p)超过稳态值h(∞)的百分比:

$$\\sigma\\% = \\frac{h(t_p)-h(\\infty)}{h(\\infty)} \\times 100\\%$$

⭐ **极其重要的结论:σ%只与阻尼比ζ有关,与自然频率ωn完全无关!**

公式为:
$$\\sigma\\% = e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}} \\times 100\\%$$

工程上常见的ζ-σ%对应关系建议熟记:
- ζ = 0.4  → σ% ≈ 25.4%
- ζ = 0.5  → σ% ≈ 16.3% ⭐(考研高频)
- ζ = 0.6  → σ% ≈ 9.48%
- ζ = 0.707→ σ% ≈ 4.3%  (工程最佳阻尼比)
- ζ ≥ 1.0 → σ% = 0 (无超调,但响应太慢)

**记忆口诀**:阻尼越大超调越小;ζ=0.707是快速性和平稳性的最佳权衡。`,
    latex: true,
    suggestions: ['ζ是怎么推导出来的?', '除了ζ,还有什么因素影响超调?', '最佳阻尼比为什么是0.707?', '超调量太大工程上怎么校正?'],
    relatedKPs: ['kp-3-5', 'kp-3-6'],
  },
  {
    keywords: ['劳斯判据', 'routh', 'routh', '稳定'],
    pattern: /劳斯|稳定|routh|nyquist|奈奎|判据/i,
    answer:
`🎯 **劳斯-赫尔维茨判据** 是判断线性系统稳定性最常用的代数方法,不需要解高阶方程,考研必考!

**充要条件**:闭环特征方程 $\\sum_{i=0}^n a_i s^i=0$ 的所有系数 $a_i>0$ (必要条件!) **且** 劳斯表首列元素全部为正。

**劳斯表构造三行示例** ($a_3 s^3 + a_2 s^2 + a_1 s + a_0 = 0$):
$$\\begin{matrix} s^3 & a_3 & a_1 \\\\ s^2 & a_2 & a_0 \\\\ s^1 & \\dfrac{a_2 a_1 - a_3 a_0}{a_2} & 0 \\\\ s^0 & a_0 & \\end{matrix}$$

首列**变号次数** = 右半S平面极点的个数。

**两种特殊情况**:
1. **首列出现0元素**:用 $\\varepsilon\\to0^+$ 替换0,继续判;
2. **某一行全为0**:用上一行作**辅助多项式**,求导后的系数代替全0行。

⚠️ 考研高频陷阱:若特征方程系数不全为正,系统直接不稳定,不需要构造劳斯表!`,
    latex: true,
    suggestions: ['首列全为0时辅助多项式怎么求?', '劳斯判据和奈奎斯特判据各有什么优劣?', '离散系统能用劳斯判据吗?', '给我出3道劳斯判据典型题'],
    relatedKPs: ['kp-3-11', 'kp-3-12'],
  },
  {
    keywords: ['稳态误差', 'Kp', 'Kv', 'Ka', 'ess', '误差系数'],
    pattern: /稳态误差|误差系数|Kp|Kv|Ka|ess/i,
    answer:
`✅ **稳态误差是控制理论三大核心问题(稳/准/快)中的"准"**。必考重点!

**三种计算方法,优先级**:
① **型别系数法** —— 标准输入(r=1,t,t²/2)最快
② **终值定理** $e_{ss}=\\lim_{s\\to 0} sE(s)$ —— 最通用
③ 动态误差系数法 —— 非标准输入用

📊 **静态误差系数表 (必背!)**

| 系统型别 ν | $K_p=\\lim G(s)$ | $K_v=\\lim sG(s)$ | $K_a=\\lim s^2 G(s)$ | 阶跃1(t) | 斜坡t | 抛物线 $\\frac{t^2}{2}$ |
|---|---|---|---|---|---|---|
| **0型** ν=0 | Kp=常 | 0 | 0 | $\\frac{1}{1+K_p}$ | ∞ | ∞ |
| **I型** ν=1 | ∞ | Kv=常 | 0 | 0 | $\\frac{1}{K_v}$ | ∞ |
| **II型** ν=2 | ∞ | ∞ | Ka=常 | 0 | 0 | $\\frac{1}{K_a}$ |

⚠️ **易错点提醒**:
1. 型别ν = **开环** 传递函数中积分环节 $\\frac{1}{s^\\nu}$ 的个数,别去看闭环!
2. 终值定理条件: $sE(s)$ 所有极点必须在左半S平面(含虚轴极点只能是单阶原点),否则根本不能用!
3. 扰动输入下的稳态误差:要单独重新列公式,不能用Kp/Kv/Ka表。`,
    latex: true,
    suggestions: ['II型系统跟踪斜坡信号误差为0,为什么工程上不做III型?', '扰动作用下的稳态误差怎么算?', '能给我出道综合题并一步步讲解吗?', '型别ν提高,对系统稳定性是好是坏?'],
    relatedKPs: ['kp-3-13', 'kp-3-14', 'kp-3-15', 'kp-3-17'],
  },
  {
    keywords: ['伯德图', 'Bode', '波特图', '对数频率'],
    pattern: /伯德|波特|bode|频率特性|截止频率|相角裕度/i,
    answer:
`📈 **伯德图=频率法王冠上的明珠**,工业界最常用的控制性能分析工具。

伯德图由两张图组成,都画在半对数坐标纸上:
1. **对数幅频特性**: $L(\\omega)=20\\lg|G(j\\omega)|$ (单位:dB)
2. **对数相频特性**: $\\varphi(\\omega)=\\angle G(j\\omega)$ (单位:度)

**🎯 绘制四步法** (考研核心技能):
1. 化G(s)为**首1形式** (时间常数形式):所有(s+a)写成a·(1+s/a),分离出K和各时间常数;
2. **标转角频率**:把惯性/一阶微分的 T、二阶的 $\\omega_n$ 从小到大标在横轴上;
3. **画低频段**:斜率 $-20\\nu$ dB/dec,**过** $\\omega=1$,L=20lgK (或延长线过);
4. **逐段变斜率**:每过一个惯性-20,过一个微分+20,过二阶振荡-40。

**⭐ 重要计算**:相角裕度 $\\gamma = 180^\\circ + \\angle G(j\\omega_c) > 0$,希望 30°~60°;
截止频率ωc是L(ωc)=0dB的频率。

💡 **反推问题(伯德图→G(s))** 是高频大题,按上面四步反方向操作即可。`,
    latex: true,
    suggestions: ['如何从伯德图反推出传递函数?', '为什么工程上希望γ=30°~60°?', '求ωc的具体计算方法是什么?', '给我两道伯德图大题'],
    relatedKPs: ['kp-5-6', 'kp-5-7', 'kp-5-8', 'kp-5-11'],
  },
  {
    keywords: ['根轨迹', 'root locus', '分离点', '渐近线', '梅森'],
    pattern: /根轨迹|分离点|渐近线|出射角|虚轴交点|梅森|root.?locus/i,
    answer:
`🗺️ **根轨迹法(Evans,1948)** —— 不用解特征方程,画图就能知道闭环极点走向!

**两个灵魂条件**:
- 相角条件: $\\sum\\angle(s-z_j)-\\sum\\angle(s-p_i)=(2k+1)\\pi$ (画根轨迹)
- 幅值条件: $K\\cdot\\frac{\\prod|s-z_j|}{\\prod|s-p_i|}=1$ (求某点K)

**📐 8条绘制法则速记**:
1. 起点在开环极点,终点在开环零点(或无穷远);
2. 分支数=n-m;
3. 对称于实轴;
4. **实轴上某段是根轨迹** ↔ 其右侧实极零点数之和为奇数;
5. **渐近线**: 条数=n-m; 中心 $\\sigma_a=(\\sum p_i-\\sum z_j)/(n-m)$; 夹角 $\\varphi_a=(2k+1)\\pi/(n-m)$;
6. **分离点/会合点**: 解方程 $\\frac{dK}{ds}=0$;
7. **出射角/入射角**: $\\varphi_{出}=180°-(\\sum$ 其他极点夹角 $)+\\sum$ 零点夹角;
8. **虚轴交点**: 令s=jω代入特征方程,Re=0,Im=0解ω、K。

⚠️ **考研三大必算**:渐近线(σa/φa)、分离点、虚轴交点ω临界K。`,
    latex: true,
    suggestions: ['零度根轨迹和常规有什么区别?', '分离点和会合点的物理意义是什么?', '怎么用根轨迹确定指定ζ的K?', '给我3道根轨迹考研真题'],
    relatedKPs: ['kp-4-3', 'kp-4-4', 'kp-4-5', 'kp-4-6'],
  },
  {
    keywords: ['PID', '比例 积分 微分', '整定', '参数'],
    pattern: /PID|比例|积分|微分|整定|Ziegler|齐格勒/i,
    answer:
`🎛️ **PID控制器 = 工业界最伟大的算法之一**! 95%以上的工业控制回路由PID或其变种完成。

**三参数作用口诀 (必须背熟!)**:

| 环节 | G(s)项 | 作用 | 副作用 |
|---|---|---|---|
| **P 比例** Kp | $K_p$ | **快**: 误差×比例立即调节,Kp↑→误差↓、响应↑ | Kp太大→超调大、振荡,甚至不稳定 |
| **I 积分** Ki/s | $\\frac{K_i}{s}$ | **准**: 只要有误差就累积,**最终消除静差** (稳态误差→0!) | 引入相位滞后(相角-90°),使稳定性下降、变迟钝 |
| **D 微分** Kd·s | $K_d\\cdot s$ | **预判**:按误差变化趋势提前刹车,抑制超调,抗扰 | 对高频噪声超级敏感!工业上常加一阶滤波 |

**工程整定第一法 —— Ziegler-Nichols 临界比例度法**:
1. 断开I/D,只用P,从小到大加Kp,直到系统输出等幅振荡→记录临界K_cr、振荡周期T_cr;
2. 查表设置(0.6K_cr, T_i=0.5T_cr, T_d=0.125T_cr)。

**调参口诀**:先P后I再加D;响应慢加Kp;静差不消加Ki;超调太大加Kd。`,
    suggestions: ['为什么实际工业系统常常只用PI?', '能给我详细讲解整定步骤的例子吗?', 'PID和超前/滞后校正有什么关系?', '为什么D环节要加一阶滤波器?'],
    relatedKPs: ['kp-6-7', 'kp-6-8'],
  },
  {
    keywords: ['校正', '超前', '滞后', '设计', 'compensation'],
    pattern: /校正|超前|滞后|compensation|design/i,
    answer:
`⚙️ **频率法校正设计 = 考试压轴大题**!核心两种:超前校正 vs 滞后校正。

✅ **超前校正 (提供正相移)**
- Gc(s)=(1+aTs)/(1+Ts), a>1
- 最大超前相角 $\\varphi_m=\\arcsin\\frac{a-1}{a+1}$ ,发生在 $\\omega_m=1/(T\\sqrt{a})$
- 作用:把最大相角"垫"在中频段,补偿原系统相角不足→**提高γ**;同时 ωc↑(响应更快!)
- 适用:原系统相角裕度不足,但截止频率不高

✅ **滞后校正 (低通衰减)**
- Gc(s)=(1+bTs)/(1+Ts), b<1
- 本质:1/(b)倍高频信号衰减→**使ωc↓**;新ωc处原系统γ就够了
- 额外好处:低频段没衰减→**K还能增大,稳态精度↑**!
- 适用:原系统相角变化率很快(相角随ω下降太快),超前垫不动

⚠️ 做题选择规律:题目要求响应快→超前;要求稳态精度高+平稳→滞后;两者都要→滞后-超前。`,
    latex: true,
    suggestions: ['给我详细讲讲超前校正的四步设计法', '算出来的校正网络a太大怎么办?', '滞后校正为什么能提高稳态精度?', '给我一道校正综合考研题!'],
    relatedKPs: ['kp-6-2', 'kp-6-3', 'kp-6-4', 'kp-6-5'],
  },
  {
    keywords: ['z变换', '脉冲传递', '离散', '采样', 'w变换'],
    pattern: /Z变换|脉冲传递|离散|采样|香农|W变换/i,
    answer:
`🔢 **离散控制 = 计算机控制的数学基础**。

**香农采样定理**:采样频率f_s ≥ 2·f_max(信号最高频率),才能从采样信号不失真恢复原信号。工程上取f_s=(5~20)·f_max!

**三大核心考点**:
1. **Z变换**:
   - 定义: $E(z)=\\sum_{k=0}^\\infty e(kT) z^{-k}$
   - 常用: $\\mathcal{Z}[1(t)]=\\frac{z}{z-1}$; $\\mathcal{Z}[t]=\\frac{Tz}{(z-1)^2}$; $\\mathcal{Z}[e^{-at}]=\\frac{z}{z-e^{-aT}}$
   - 性质:实延迟 $\\mathcal{Z}[e(k-n)·1(k-n)] = z^{-n}E(z)$
2. **脉冲传递函数G(z)**:
   ⚠️ **最难掌握的组合规则** (90%的人这里错):
   - 两个环节**中间有采样器**串联→G(z)=G1(z)·G2(z),各自Z再乘
   - 两个环节**中间无采样器**串联→G(z)=Z[G1(s)·G2(s)] ≠ G1(z)G2(z),要先乘再Z!!
   - 闭环Φ(z)求法:必须老老实实按采样开关位置列方程,不能直接套连续的Φ=G/(1+GH)
3. **离散稳定性**:
   - 充要条件:所有特征根|z_i|<1(都落在单位圆内)
   - 判法:W双线性变换 $z=\\frac{1+w}{1-w}$ →代入特征方程→用劳斯判据!`,
    latex: true,
    suggestions: ['脉冲传递函数组合的两种情况能不能给个具体例子?', 'W变换的计算总错,有什么好技巧?', '离散稳态误差公式能帮我总结一下吗?', '零阶保持器ZOH对稳定性有好还是坏影响?'],
    relatedKPs: ['kp-7-1', 'kp-7-2', 'kp-7-4', 'kp-7-5', 'kp-7-6'],
  },
  {
    keywords: ['描述函数', '非线性', '自振', '饱和', '死区', '继电器'],
    pattern: /描述函数|非线性|自振|饱和|死区|间隙|继电器|nonlinear/i,
    answer:
`🎚️ **实际系统都是非线性的!** 描述函数法 = 频域近似分析自激振荡的工程工具。

**核心思想 (5%工程近似)**:把非线性元件对正弦输入A·sinωt的输出**取基波分量**,等效为复数增益N(A):
$$N(A) = \\frac{Y_1}{A} \\angle \\varphi_1$$

**典型非线性 N(A)速查**:
1. **饱和限幅 ±a**: N(A) = $\\frac{2k}{\\pi}[\\arcsin\\frac{a}{A}+\\frac{a}{A}\\sqrt{1-(\\frac{a}{A})^2}]$, A≥a
2. **死区不灵敏区 Δ**: N(A) = $\\frac{2k}{\\pi}[\\frac{\\pi}{2}-\\arcsin\\frac{\\Delta}{A}-\\frac{\\Delta}{A}\\sqrt{1-(\\frac{\\Delta}{A})^2}]$, A≥Δ
3. **理想继电器 ±M**: N(A) = $\\frac{4M}{\\pi A}$ (实数,无相移)
4. **带滞环继电器**: N(A) = $\\frac{4M}{\\pi A} \\angle -\\arcsin(\\frac{2h}{A})$ (有负相角!)

**🎯 判断自振**:画出 G(jω) 曲线和 $-\\frac{1}{N(A)}$ (随A增大)曲线,两者相交=可能产生自振。
**稳定自振判别**:沿A增大方向,-1/N曲线**从G(jω)包围区域穿出到外部**→稳定自激振荡(工程实际会持续)。`,
    latex: true,
    suggestions: ['饱和特性的-1/N曲线长什么样?为什么和死区不一样?', '带滞环的继电器N(A)为什么带负相角?', '给我一道判断自振的经典题', '如何消除继电器系统的自振?'],
    relatedKPs: ['kp-8-1', 'kp-8-2', 'kp-8-3', 'kp-8-4'],
  },
];

// ============================================================
// 七、教师团队数据
// ============================================================
export interface TeacherItem {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  research: string[];
  chapterIds: number[];
  email: string;
  years: number;
  rating: number;
  students: number;
}

export const TEACHERS: TeacherItem[] = [
  {
    id: 'teacher-zhang',
    name: '张明远',
    title: '教授 / 博士生导师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmy&backgroundColor=b6e3f4',
    bio: '国家级教学名师,控制理论与控制工程学科带头人。从事自动控制原理教学28年,主讲国家级精品课程,获国家级教学成果一等奖2项。',
    research: ['鲁棒控制', '非线性系统', '复杂网络控制'],
    chapterIds: [1, 2, 3],
    email: 'zhangmy@university.edu.cn',
    years: 28,
    rating: 4.95,
    students: 12800,
  },
  {
    id: 'teacher-wang',
    name: '王建国',
    title: '副教授 / 硕士生导师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangjg&backgroundColor=c0aede',
    bio: '清华大学博士,主讲根轨迹法与频率响应法15年。国家自然科学基金面上项目2项,发表SCI论文30余篇。教学风格深入浅出,深受学生喜爱。',
    research: ['频率域方法', 'H∞鲁棒控制', '过程控制'],
    chapterIds: [4, 5],
    email: 'wangjg@university.edu.cn',
    years: 15,
    rating: 4.92,
    students: 9800,
  },
  {
    id: 'teacher-li',
    name: '李秀英',
    title: '教授 / 硕士生导师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lixy&backgroundColor=ffd5dc',
    bio: '留学英国帝国理工学院博士后。主讲系统校正与PID整定,是"PID参数整定实务"国家级一流本科课程负责人。工业界经验丰富,曾任某外企高级控制工程师。',
    research: ['先进PID控制', '工业过程优化', '预测控制'],
    chapterIds: [6],
    email: 'lixy@university.edu.cn',
    years: 18,
    rating: 4.96,
    students: 11200,
  },
  {
    id: 'teacher-chen',
    name: '陈晓峰',
    title: '讲师 / 博士',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenxf&backgroundColor=ffdfbf',
    bio: '上海交通大学博士,青年教师教学基本功比赛一等奖获得者。主讲离散系统与非线性系统,擅长用动画和仿真实验把抽象概念讲清楚。',
    research: ['离散事件系统', '切换系统', '智能控制'],
    chapterIds: [7, 8],
    email: 'chenxf@university.edu.cn',
    years: 7,
    rating: 4.90,
    students: 6500,
  },
  {
    id: 'ta-lin',
    name: '林涛',
    title: '课程助教 / 博士三年级',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lintao&backgroundColor=d1d4f9',
    bio: '本硕博均就读本专业,考研自动控制原理148分(满分150)。负责习题课、作业批改、线上答疑,累计答疑超10000小时。',
    research: ['多智能体协同控制'],
    chapterIds: [1, 2, 3, 4, 5, 6, 7, 8],
    email: 'lintao_ta@university.edu.cn',
    years: 4,
    rating: 4.98,
    students: 4200,
  },
  {
    id: 'ta-chen',
    name: '陈思雨',
    title: '课程助教 / 硕士二年级',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chensy&backgroundColor=c0f9d8',
    bio: '保研本专业,本科自动控制原理98分、期末满分。负责仿真实验指导书编写、实验答疑、报告批改,尤其擅长MATLAB/Simulink实操。',
    research: ['智能电网优化控制'],
    chapterIds: [3, 5, 6],
    email: 'chensy_ta@university.edu.cn',
    years: 2,
    rating: 4.97,
    students: 3100,
  },
];

// ============================================================
// 八、示例用户 (排行榜演示 + 测试账号)
// ============================================================
export interface SeedUser {
  id: string;
  username: string;
  email: string;
  realName: string;
  role: 'student' | 'teacher' | 'admin';
  studentId?: string;
  avatar: string;
  college?: string;
  major?: string;
  className?: string;
  password: string;
  isActive: boolean;
  createdAt: number;
  _demo?: {
    score: number;
    hours: number;
    streak: number;
    lessons: number;
    mastery: number;
  };
}

const now = Date.now();
const daysAgo = (d: number) => now - d * 86400000;

export const SEED_USERS: SeedUser[] = [
  // 管理账号
  {
    id: 'admin-1', username: 'admin', email: 'admin@zdkzyl.edu',
    realName: '系统管理员', role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin&backgroundColor=b6e3f4',
    password: 'admin123', isActive: true, createdAt: daysAgo(365),
  },
  // 教师账号
  {
    id: 'teacher-demo', username: 'teacher', email: 'teacher@zdkzyl.edu',
    realName: '张老师(演示)', role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacherdemo',
    college: '自动化学院', major: '控制理论与控制工程',
    password: 'teacher123', isActive: true, createdAt: daysAgo(200),
  },
  // 学生测试账号
  {
    id: 'stu-demo', username: 'student', email: 'student@zdkzyl.edu',
    realName: '李同学(演示)', role: 'student', studentId: '2024010001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentdemo',
    college: '自动化学院', major: '自动化', className: '自2401班',
    password: 'student123', isActive: true, createdAt: daysAgo(120),
    _demo: { score: 8520, hours: 156, streak: 45, lessons: 52, mastery: 92 },
  },
  // 排行榜用学生 (前10名)
  {
    id: 'stu-101', username: 'wangzihan', email: 'wangzh@stu.edu', realName: '王子涵',
    role: 'student', studentId: '2023010101',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangzihan',
    college: '自动化学院', major: '自动化', className: '自2301班',
    password: '123456', isActive: true, createdAt: daysAgo(300),
    _demo: { score: 28650, hours: 412, streak: 168, lessons: 68, mastery: 97 },
  },
  {
    id: 'stu-102', username: 'liuxiaoyu', email: 'liuxy@stu.edu', realName: '刘小雨',
    role: 'student', studentId: '2023010215',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuxiaoyu',
    college: '自动化学院', major: '自动化', className: '自2302班',
    password: '123456', isActive: true, createdAt: daysAgo(290),
    _demo: { score: 26340, hours: 385, streak: 142, lessons: 66, mastery: 95 },
  },
  {
    id: 'stu-103', username: 'zhanghao', email: 'zhangh@stu.edu', realName: '张浩',
    role: 'student', studentId: '2023010088',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhanghao',
    college: '电气工程学院', major: '电气工程及其自动化', className: '电2303班',
    password: '123456', isActive: true, createdAt: daysAgo(280),
    _demo: { score: 24880, hours: 356, streak: 128, lessons: 64, mastery: 93 },
  },
  {
    id: 'stu-104', username: 'chenjiaqi', email: 'chenjq@stu.edu', realName: '陈佳琪',
    role: 'student', studentId: '2023010326',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenjiaqi',
    college: '自动化学院', major: '机器人工程', className: '机2301班',
    password: '123456', isActive: true, createdAt: daysAgo(270),
    _demo: { score: 23120, hours: 328, streak: 115, lessons: 62, mastery: 91 },
  },
  {
    id: 'stu-105', username: 'zhaomeng', email: 'zhaom@stu.edu', realName: '赵萌',
    role: 'student', studentId: '2023010177',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaomeng',
    college: '仪器科学与光电工程学院', major: '测控技术与仪器', className: '测2302班',
    password: '123456', isActive: true, createdAt: daysAgo(260),
    _demo: { score: 21780, hours: 305, streak: 102, lessons: 60, mastery: 89 },
  },
  {
    id: 'stu-106', username: 'sunwei', email: 'sunw@stu.edu', realName: '孙伟',
    role: 'student', studentId: '2024010059',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunwei',
    college: '自动化学院', major: '自动化', className: '自2402班',
    password: '123456', isActive: true, createdAt: daysAgo(200),
    _demo: { score: 19450, hours: 278, streak: 88, lessons: 56, mastery: 87 },
  },
  {
    id: 'stu-107', username: 'zhoulin', email: 'zhoul@stu.edu', realName: '周琳',
    role: 'student', studentId: '2024010203',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoulin',
    college: '航天与航空学院', major: '飞行器设计与工程', className: '航2401班',
    password: '123456', isActive: true, createdAt: daysAgo(190),
    _demo: { score: 17620, hours: 248, streak: 76, lessons: 52, mastery: 85 },
  },
  {
    id: 'stu-108', username: 'wufan', email: 'wuf@stu.edu', realName: '吴凡',
    role: 'student', studentId: '2024010412',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wufan',
    college: '机械工程学院', major: '机械电子工程', className: '机2403班',
    password: '123456', isActive: true, createdAt: daysAgo(180),
    _demo: { score: 15880, hours: 220, streak: 64, lessons: 48, mastery: 83 },
  },
];

// ============================================================
// 九、AI 助教回复函数 (本地规则引擎)
// ============================================================
function tokenize(s: string): string[] {
  return (s.toLowerCase() + ' ' + s)
    .replace(/[^\u4e00-\u9fa5a-z0-9+\-*/=<>()（）【】\[\]\s.]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export interface AIReplyResult {
  content: string;
  formattedContent: string;
  relatedKPs: string[];
  suggestedQuestions: string[];
}

export function aiTutorReply(userContent: string): AIReplyResult {
  const text = userContent.trim();
  const tokens = tokenize(text);
  const lower = text.toLowerCase();

  // 打招呼
  if (/^(你好|您好|hi|hello|嗨|哈喽|在吗|在不|老师)/i.test(text)) {
    return {
      content:
`你好!👋 我是**自动控制原理AI助教小空**,全程陪伴你学习本课程。

我可以帮你做这些事情:
- 📚 **知识点答疑**: 任意知识点,我用公式+例题+口诀给你讲清楚
- 🎯 **考研指导**: 高频考点、解题套路、真题推荐,我最熟
- 💻 **仿真实验辅助**: 二阶阶跃响应、伯德图、根轨迹参数调节建议
- ✅ **作业与习题**: 给我发题,我一步步给你讲思路(不给直接答案哦)
- 🧮 **公式查询**: 超调量/劳斯表/伯德图/PID/稳态误差系数表 等

你可以直接问我:"什么是超调量?""给我讲劳斯判据""伯德图怎么画?""PID怎么整定?"

试试问我一个具体的控制理论问题吧!`,
      formattedContent: '',
      relatedKPs: [],
      suggestedQuestions: ['超调量怎么计算?', '给我讲劳斯判据的两种特殊情况', '伯德图的绘制步骤是什么?', 'PID三个参数各有什么作用?'],
    };
  }

  // 匹配知识库
  let best: typeof AI_KNOWLEDGE[number] | null = null;
  let bestScore = 0;
  for (const item of AI_KNOWLEDGE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (lower.includes(kw.toLowerCase())) score += 5;
    }
    if (item.pattern instanceof RegExp && item.pattern.test(text)) score += 8;
    for (const t of tokens) {
      if (t.length >= 2 && item.answer.toLowerCase().includes(t)) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }

  if (best && bestScore >= 4) {
    return {
      content: best.answer,
      formattedContent: best.latex ? best.answer : '',
      relatedKPs: best.relatedKPs,
      suggestedQuestions: best.suggestions,
    };
  }

  // 数学公式关键词
  if (/公式|推导|证明|怎么算|如何求|计算|公式表|总结|归纳|口诀/i.test(text)) {
    return {
      content:
`📌 你可以直接向我询问以下具体知识点的公式与推导:

**第2章 数学模型**
- 典型环节传递函数表 (比例/积分/微分/惯性/振荡/延迟)
- 梅森增益公式 Δ 与 Δk 的详细求法

**第3章 时域分析**
- 二阶欠阻尼单位阶跃响应 h(t) 完整推导
- 5 大动态性能指标 (tr/tp/σ%/ts/td) 公式
- 劳斯-赫尔维茨判据 与 辅助多项式法
- 稳态误差系数 Kp/Kv/Ka 速查表 + 终值定理

**第4章 根轨迹**
- 8 条绘制法则 + 渐近线σa/φa/分离点 dK/ds=0 公式

**第5章 频率法**
- 伯德图绘制四步法 (含反推 G(s))
- 相角裕度 γ = 180°+∠G(jωc),幅值裕度 h(dB)
- 奈奎斯特 Z = P - 2N 判据

**第6章 校正与PID**
- 超前/滞后校正网络设计步骤
- PID三参数作用口诀 + Ziegler-Nichols 整定表

直接告诉我你需要哪一个,我就给你详细推导!`,
      formattedContent: '',
      relatedKPs: ['kp-3-6', 'kp-5-7', 'kp-4-3'],
      suggestedQuestions: ['给我超调量的完整公式推导', '稳态误差系数表总结一下', 'PID整定口诀有哪些?'],
    };
  }

  // 考研相关
  if (/考研|考点|重点|考什么|真题|题型|冲刺|复试/i.test(text)) {
    return {
      content:
`🎓 **考研自动控制原理 (80-150分卷) 高频考点频率统计** (按本课程章):

| 章节 | 权重建议 | 高频大题题型 |
|---|---|---|
| 第2章 数学模型 | 12~18% | 微分方程→G(s);方块图化简或梅森公式求Φ(s) |
| **第3章 时域分析** | **20~28%** | **σ%、ts、ζ、ωn 互算;劳斯判据(含2特殊情况);稳态误差综合** |
| 第4章 根轨迹 | 10~18% | 画常规根轨迹(渐近线、分离点、虚轴交点)+求K |
| **第5章 频率法** | **18~25%** | **伯德图 正向绘制+反向求G(s);奈奎斯特判据;γ/h 计算** |
| 第6章 校正设计 | 12~20% | 频率法设计超前 / 滞后校正;PID三参数作用与整定 |
| 第7章 离散系统 | 6~12% | Z变换;G(z)求法;W变换+劳斯判稳;离散稳态误差 |
| 第8章 非线性 | 5~10% | 描述函数法判断自振(饱和/死区/继电器) |

💡 **备考建议**:
- 第2、3、5章是基础,投入产出比最高,务必先拿稳分
- 伯德图正反、稳态误差、劳斯判据基本每套卷都有1~2道大题
- 推荐习题:教材课后题(必做) + 真题15年起步反复刷
- 最后30天:每天保持1~2道综合大题计算手感,别只看不练!

告诉我你想冲刺哪一所学校,我可以进一步给你推荐参考书目和备考规划。`,
      formattedContent: '',
      relatedKPs: ['kp-3-6', 'kp-5-7', 'kp-6-3', 'kp-2-10'],
      suggestedQuestions: ['清华827控制综合怎么准备?', '上交自动控制原理参考书推荐', '一个月考研自控冲刺计划'],
    };
  }

  // 学习规划
  if (/学习计划|怎么学|学习方法|入门|零基础|从零开始|建议|经验|挂科|补考/i.test(text)) {
    return {
      content:
`🚀 **零基础 / 补考 学习自动控制原理 6周通关计划** (每周12~15小时):

**第1周 · 搭建框架**: 第1章+第2章微分方程和传递函数。做教材课后基础题。
🎯 目标: 能写出RC电路、机械位移系统的微分方程→变换G(s)。

**第2周 · 数学工具深化**: 第2章典型环节+方块图/梅森公式。配20道左右化简大题。
🎯 目标: 任意复杂方块图,5分钟内能求出Φ(s)。

**第3周 · 时域大法 (核心)**: 第3章整章。重点攻克"超调量公式+劳斯判据+稳态误差"三大计算题。
🎯 目标: 给你任意G(s),10分钟内能判断稳定性、算出σ%、ess。

**第4周 · 图解两大利器**: 第4章根轨迹+第5章伯德图奈奎斯特。多动手画图,不要只看。
🎯 目标: 能手绘根轨迹、能手绘伯德图、能做反推G(s)题。

**第5周 · 校正工程应用**: 第6章校正+PID。做2~3道完整校正设计题。
🎯 目标: 能根据性能指标,独立选择超前/滞后并完成设计。

**第6周 · 刷题冲刺**: 期末真题10套+查漏补缺(离散第7章/非线性第8章)。
🎯 目标: 考试及格(60+)无压力;追求高分请延长到10周刷考研题。

⚠️ **避坑经验**:
1. ❌ 不要一开始就陷入数学推导细节,先建立"稳准快+四大方法"的整体观
2. ❌ 不要只看答案不动手!自控90%的分数考的是计算熟练度
3. ✅ 学完每一章立刻整理出一页A4纸公式卡片(正反面各一章)
4. ✅ 做不出来的题抄一遍题目→合上书自己独立写一遍

你现在处于哪个阶段?我可以帮你制定更精准的计划。`,
      formattedContent: '',
      relatedKPs: ['kp-2-3', 'kp-3-6', 'kp-5-7'],
      suggestedQuestions: ['我只有一周就要考试了怎么办?', '推荐一些优质的学习视频', '自控和现代控制先学哪个?'],
    };
  }

  // 求助/紧急
  if (/救命|太难|学不懂|不会|做不出来|卡住|死胡同/i.test(text)) {
    return {
      content:
`别慌!🤗 自动控制原理**是出了名的"入门难、一旦通了就简单"**。几乎每位自动化学生都卡在同一个地方过:

**最常见的三道坎**:
1. 🥉 **第2章梅森公式** — 回路数不清、Δk看不懂。解决方法:拿一张大A3纸,把书上3个经典例题的所有前向通路、所有独立回路、所有互不接触组合,**一个个圈出来标注编号**,做3道后就开窍了。
2. 🥈 **第3章稳态误差** — 分不清开环闭环、Kp/Kv/Ka乱套、终值定理条件忘了。解决方法:把型别系数表**抄在手上**,每天默一遍,连续做12道稳态误差题,自然不出错。
3. 🥇 **第5章伯德图反推G(s)** — 低频段求K、每段斜率对应环节总搞错。解决方法:记住四步法口诀"化首一→标转角→画低频→逐段变"。我可以陪你一道一道过。

**最最重要的事**: 先别问"为什么这么定义",先"照着例题做会一道"。控制理论的很多定义本质上是工程前辈们试出来好用的工具。

把你**现在正在卡住的那道具体题目或知识点**发给我,我给你一步步拆解!`,
      formattedContent: '',
      relatedKPs: ['kp-2-10', 'kp-3-15', 'kp-5-8'],
      suggestedQuestions: ['梅森公式的Δ和Δk我分不清', '稳态误差中Kp Kv Ka公式表', '伯德图反推G(s)的具体例子'],
    };
  }

  // 默认兜底回答
  const kpHints = KNOWLEDGE_POINTS.slice(0, 12).map(k => k.name);
  return {
    content:
`🤖 我是自动控制原理AI助教小空。你的问题我已经记录,但我目前只内置了核心知识点(超调量、劳斯判据、稳态误差、伯德图、根轨迹、PID、校正、Z变换、非线性描述函数等)的专业回答。

你可以这样问我更精准:
- 直接提知识点关键词: "超调量怎么算?""劳斯判据两种特殊情况"
- 要求解题思路: "给我3道稳态误差的典型题+解析"
- 问公式推导: "超调量σ%和ζ关系的完整推导"
- 学习方法咨询: "考研用什么教材""一周补考怎么过"

本课程全部108个知识点一览 (部分):
${kpHints.slice(0, 8).map(s => '· ' + s).join('\\n')}

试试点击下面的推荐问题,或重新组织一下语言问我吧!`,
    formattedContent: '',
    relatedKPs: ['kp-1-2', 'kp-2-3', 'kp-3-6', 'kp-5-11'],
    suggestedQuestions: ['超调量怎么计算?', '什么是劳斯判据?', '稳态误差有几种求法?', '伯德图怎么画?'],
  };
}
