import { get } from 'svelte/store';
import {
	expandedBlock,
	weightPopover,
	isBoundingBoxActive,
	textbookCurrentPageId,
	isExpandOrCollapseRunning,
	isFetchingModel,
	userId
} from '~/store';
import {
	highlightElements,
	removeHighlightFromElements,
	applyTransformerBoundingHeight,
	resetElementsHeight,
	highlightAttentionPath,
	removeAttentionPathHighlight,
	removeFingerFromElements
} from '~/utils/textbook';
import { drawResidualLine } from './animation';

export interface TextbookPage {
	id: string;
	title: string;
	content?: string;
	component?: any;
	timeoutId?: number;
	on: () => void;
	out: () => void;
	complete?: () => void;
}

const { drawLine, removeLine } = drawResidualLine();

export const textPages: TextbookPage[] = [
	{
		id: 'what-is-transformer',
		title: '什么是 Transformer?',
		content: `<p><strong>Transformer</strong> 是现代人工智能的核心架构,支撑着 ChatGPT、Gemini 等大模型。该架构于 2017 年提出,彻底变革了人工智能处理信息的方式。无论是基于海量数据集的训练,还是生成输出的推理,使用的都是同一套架构。本工具采用 GPT-2(小号版本)——它虽比新模型简单,却是学习 Transformer 基本原理的理想选择。</p>
	`,
		on: () => {},
		out: () => {}
	},
	{
		id: 'how-transformers-work',
		title: 'Transformer 如何工作?',
		content: `<p>Transformer 并非魔法——它通过不断追问下面这个问题,一步一步地生成文本:</p>
	<blockquote class="question">
		"在这段输入之后,最可能出现的下一个词是什么?"
	</blockquote>
	<p>下面我们来观察一个训练好的模型如何生成文本。您可以输入自己的文本,或选用一个示例,然后点击<strong>生成</strong>按钮查看效果。若模型尚未加载完成,可先试用其他<strong>示例</strong>。</p>`,
		on: () => {
			highlightElements(['.input-form']);
			if (get(isFetchingModel)) {
				highlightElements(['.input-form .select-button']);
			} else {
				highlightElements(['.input-form .generate-button']);
			}
		},
		out: () => {
			removeHighlightFromElements([
				'.input-form',
				'.input-form .select-button',
				'.input-form .generate-button'
			]);
		},
		complete: () => {
			removeFingerFromElements(['.input-form .select-button', '.input-form .generate-button']);
			if (get(textbookCurrentPageId) === 'how-transformers-work') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'how-transformers-work'
				});
			}
		}
	},
	{
		id: 'transformer-architecture',
		title: 'Transformer 的整体架构',
		content:
			'<p>Transformer 由三个主要部分组成:</p><div class="numbered-list"><div class="numbered-item"><span class="number-circle">1</span><div class="item-content"><strong>嵌入(Embedding)</strong>将文本转换为数值表示。</div></div><div class="numbered-item"><span class="number-circle">2</span><div class="item-content"><strong>Transformer 模块</strong>通过自注意力机制混合信息,再由 MLP 进一步精炼表示。</div></div><div class="numbered-item"><span class="number-circle">3</span><div class="item-content"><strong>概率</strong>决定每个候选词元作为下一个词元的可能性。</div></div></div>',
		on: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			highlightElements(selectors);
			applyTransformerBoundingHeight(['.softmax-bounding', '.embedding-bounding']);
		},
		out: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			removeHighlightFromElements(selectors);
			resetElementsHeight(['.softmax-bounding', '.embedding-bounding']);
		}
	},
	{
		id: 'embedding',
		title: '嵌入(Embedding)',
		content: `<p>Transformer 在处理文本之前,会先把文本切分为小的单元,并将每个单元表示为一个数字列表(即向量)。这一过程称为<strong>嵌入(Embedding)</strong>。该术语既可指这一转换过程,也可指所得到的向量。</p><p>在本工具中,每个向量显示为一个矩形条,将鼠标悬停其上可查看其维度。</p>`,
		on: () => {
			highlightElements(['.step.embedding .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.embedding .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.embedding .title']);
			if (get(textbookCurrentPageId) === 'embedding') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'embedding'
				});
			}
		}
	},
	{
		id: 'token-embedding',
		title: '词元嵌入',
		content: `<p><strong>词元化(Tokenization)</strong>将输入文本切分为词元(Token)——即词或词的一部分这样的小单元。GPT-2(小号版本)的词表包含 50,257 个词元,每个词元都有唯一的编号(ID)。</p><p>在<strong>词元嵌入</strong>步骤中,每个词元都会从一张大型查找表中匹配到一个 768 维的向量。这些向量在训练过程中学习得到,用以最佳地表示每个词元的语义。</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'positional-encoding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'positional-encoding',
		title: '位置编码',
		content: `<p>语序在语言中至关重要。<strong>位置编码</strong>为每个词元提供其在序列中位置的信息。</p><p>GPT-2 的做法是将学习得到的位置嵌入与词元嵌入相加;而较新的模型可能采用其他方法,例如 RoPE(旋转位置编码),通过对特定向量进行旋转来编码位置。这些方法的目标都是帮助模型理解文本中的顺序关系。</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'token-embedding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'blocks',
		title: '层层堆叠的 Transformer 模块',
		content: `<p><strong>Transformer 模块</strong>是模型中进行处理的基本单元,由两部分组成:</p><ul><li><strong>多头自注意力</strong>——让不同词元之间交换信息</li><li><strong>MLP(多层感知机)</strong>——精炼每个词元的表示细节</li></ul><p>模型将许多模块堆叠在一起,使词元的表示在逐层传递中不断丰富。GPT-2(小号版本)共有 12 个这样的模块。</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements([
						'.transformer-bounding',
						'.step.transformer-blocks .guide',
						'.attention > .title',
						'.mlp > .title'
					]);
					highlightElements(['.transformer-bounding-title'], 'textbook-button-highlight');
					isBoundingBoxActive.set(true);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.transformer-bounding',
				'.step.transformer-blocks .guide',
				'.attention > .title',
				'.mlp > .title'
			]);
			removeHighlightFromElements(['.transformer-bounding-title'], 'textbook-button-highlight');
			isBoundingBoxActive.set(false);
		},
		complete: () => {
			removeFingerFromElements(['.transformer-bounding-title']);
			if (get(textbookCurrentPageId) === 'blocks') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'blocks'
				});
			}
		}
	},
	{
		id: 'self-attention',
		title: '多头自注意力',
		content:
			'<p><strong>自注意力(Self-Attention)</strong>使模型能够判断输入中哪些部分与当前词元最相关,从而捕捉语义及词与词之间的关系——即使是相距很远的词也不例外。</p><p>在<strong>多头(multi-head)</strong>形式下,模型并行运行多组注意力过程,每组关注文本中不同的模式。</p>',
		on: () => {
			highlightElements(['.step.attention']);
		},
		out: () => {
			removeHighlightFromElements(['.step.attention']);
		}
	},
	{
		id: 'qkv',
		title: '查询、键、值',
		content: `
		<p>为了执行自注意力计算,每个词元的嵌入会被变换为
	  <span class="highlight">三个新的嵌入</span>——
	  <span class="blue">查询(Query)</span>、
	  <span class="red">键(Key)</span>与
	  <span class="green">值(Value)</span>。
  该变换通过对每个词元嵌入施加不同的权重和偏置来实现。这些参数(权重与偏置)在训练过程中被优化。</p>

	<p>生成之后,<span class="blue">查询(Query)</span>与<span class="red">键(Key)</span>进行比较以度量相关程度,再用这一相关程度对<span class="green">值(Value)</span>进行加权。</p>
	`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.step.qkv .qkv-column']);
			if (get(textbookCurrentPageId) === 'qkv') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'qkv'
				});
			}
		}
	},

	{
		id: 'multi-head',
		title: '多头机制',
		content:
			'<p>在生成 <span class="blue">Q</span>、<span class="red">K</span>、<span class="green">V</span> 三种嵌入之后,模型将它们切分到若干个<strong>注意力头(head)</strong>中(GPT-2 小号版本为 12 个头)。每个头拥有自己较小规模的 <span class="blue">Q</span>/<span class="red">K</span>/<span class="green">V</span>,分别关注文本中不同的模式——例如语法结构、语义或长距离关联。</p><p>多个注意力头使模型能够并行学习多种类型的关系,从而获得更丰富的理解能力。</p>',
		on: () => {
			highlightAttentionPath();
			highlightElements(['.multi-head .head-title']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.multi-head .head-title']);
		},
		complete: () => {
			removeFingerFromElements(['.multi-head .head-title']);
			if (get(textbookCurrentPageId) === 'multi-head') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'multi-head'
				});
			}
		}
	},
	{
		id: 'masked-self-attention',
		title: '带掩码的自注意力',
		content: `<p>在每个注意力头内部,模型决定每个词元对其他词元的关注程度:</p><ul><li><strong>点积</strong>——将<span class="blue">查询(Query)</span>与<span class="red">键(Key)</span>向量中对应位置的数字相乘并求和,得到<span class="purple">注意力分数</span>。</li><li><strong>掩码(Mask)</strong>——遮住未来的词元,防止模型"偷看"后文。</li><li><strong>Softmax</strong>——将分数转换为概率,每行之和为 1,表示对前文各词元的关注程度。</li></ul>`,
		on: () => {
			highlightAttentionPath();
			highlightElements(['.attention-matrix.attention-result']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.attention-matrix.attention-result']);
			expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.attention-matrix.attention-result']);
			if (get(textbookCurrentPageId) === 'masked-self-attention') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'masked-self-attention'
				});
			}
		}
	},
	{
		id: 'output-concatenation',
		title: '注意力输出与拼接',
		content:
			'<p>每个头将其<span class="purple">注意力分数</span>与<span class="green">值(Value)</span>嵌入相乘,<span class="highlight">得到该头的注意力输出</span>——即每个词元在综合考虑上下文之后得到的精炼表示。</p><p>GPT-2(小号版本)共有 12 个这样的输出,它们被拼接成一个与原始维度相同的向量(768 维)。</p>',
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.attention .column.out']);
			if (get(textbookCurrentPageId) === 'output-concatenation') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-concatenation'
				});
			}
		}
	},
	{
		id: 'mlp',
		title: 'MLP(多层感知机)',
		content:
			'<p>注意力输出随后经过<strong>MLP(多层感知机)</strong>,以进一步精炼词元的表示。线性层利用学习到的权重与偏置改变嵌入的数值和维度;随后,非线性激活函数决定每个数值的通过程度。</p><p>激活函数有多种类型,GPT-2 采用<strong>GELU</strong>:它让较小的数值部分通过、较大的数值完全通过,有助于同时捕捉细微与显著的规律。</p>',
		on: () => {
			highlightElements(['.step.mlp', '.operation-col.activation']);
		},
		out: () => {
			removeHighlightFromElements(['.step.mlp', '.operation-col.activation']);
		}
	},

	{
		id: 'output-logit',
		title: '输出 Logit',
		content: `<p>经过全部 Transformer 模块后,最后一个词元的输出嵌入(已融合前面所有词元的上下文信息)会在最后一个线性层中与学习到的权重相乘。</p><p>由此得到 <strong>logits</strong>:共 50,257 个数值——对应 GPT-2 词表中的每个词元——表示每个词元作为下一个词元出现的可能性。</p>`,
		on: () => {
			highlightElements(['g.path-group.softmax', '.column.final']);
		},
		out: () => {
			removeHighlightFromElements(['g.path-group.softmax', '.column.final']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.column.final']);
			if (get(textbookCurrentPageId) === 'output-logit') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-logit'
				});
			}
		}
	},
	{
		id: 'output-probabilities',
		title: '概率',
		content:
			'<p>Logits 只是原始分数。为了便于解读,我们将其转换为介于 0 到 1 之间、总和为 1 的<strong>概率</strong>,用以衡量每个词元作为下一个词出现的可能性。</p><p>我们并非总是选取概率最高的词元,而是可以采用不同的选择策略,在生成文本的严谨性与创造性之间取得平衡。</p>',
		on: () => {
			highlightElements(['.step.softmax .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.softmax .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.softmax .title']);
			if (get(textbookCurrentPageId) === 'output-probabilities') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-probabilities'
				});
			}
		}
	},
	{
		id: 'temperature',
		title: '温度',
		content:
			'<p><strong>温度(Temperature)</strong>的作用是在 logits 转换为概率之前对其进行缩放。<strong>较低的温度</strong>(如 0.2)会拉大 logits 之间的差距,使高分词元更受青睐,从而产生更<strong>可预测的选择</strong>;<strong>较高的温度</strong>(如 1.0 及以上)则会缩小差距,使原本概率较低的词元更具竞争力,从而产生更具<strong>创造性的输出</strong>。</p>',
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.scaled',
						'.title-box.scaled',
						'.content-box.scaled',
						'.temperature-input'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.scaled',
					'.title-box.scaled',
					'.content-box.scaled',
					'.temperature-input'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.scaled',
				'.title-box.scaled',
				'.temperature-input',
				'.content-box.scaled'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.temperature-input']);
			if (get(textbookCurrentPageId) === 'temperature') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'temperature'
				});
			}
		}
	},
	{
		id: 'sampling',
		title: '采样策略',
		content:
			'<p>最后,我们需要一种策略来选出下一个词元。策略有很多种,以下是常见的几种:贪心搜索直接选取概率最高的词元;<strong>Top-k</strong> 仅保留概率最高的 k 个词元;<strong>Top-p</strong> 则保留累计概率至少达到 p 的最小词元集合——二者都会尽早剔除可能性低的词元。</p><p>随后,softmax 将保留下来的 logits 转换为概率,并从允许的候选集合中随机选取一个词元。</p>',
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.sampling',
						'.title-box.sampling',
						'.sampling-input',
						'.content-box.sampling'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.sampling',
					'.title-box.sampling',
					'.sampling-input',
					'.content-box.sampling'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.sampling',
				'.title-box.sampling',
				'.sampling-input',
				'.content-box.sampling'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.sampling-input']);
			if (get(textbookCurrentPageId) === 'sampling') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'sampling'
				});
			}
		}
	},
	{
		id: 'residual',
		title: '残差连接',
		content: `<p>Transformer 还包含一些用于提升模型性能的辅助结构。例如,<strong>残差连接</strong>将一层的输入与其输出相加,防止信息在穿过许多模块后逐渐衰减。在 GPT-2 中,每个模块使用两次残差连接,以便有效地训练更深的堆叠结构。</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['.operation-col.residual', '.residual-start']);
					drawLine();
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['.operation-col.residual', '.residual-start']);
			removeLine();
		}
	},
	{
		id: 'layer-normalization',
		title: '层归一化',
		content: `<p><strong>层归一化(Layer Normalization)</strong>通过调整输入数值,使其均值和方差保持稳定,从而同时稳定训练与推理过程。这能降低模型对初始权重的敏感度,使其更有效地学习。在 GPT-2 中,层归一化分别应用于自注意力之前、MLP 之前,并在最终输出前再使用一次。</p>`,
		on: () => {
			highlightElements(['.operation-col.ln']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.ln']);
		}
	},
	{
		id: 'dropout',
		title: 'Dropout(随机失活)',
		content: `<p>在训练过程中,<strong>Dropout</strong>会随机断开部分数值之间的连接,以防止模型过拟合于特定模式,从而帮助其学习泛化能力更强的特征。GPT-2 使用了 Dropout,但较新的大语言模型通常会省略它——因为其训练数据规模巨大,过拟合问题并不突出。在推理阶段,Dropout 处于关闭状态。</p>`,
		on: () => {
			highlightElements(['.operation-col.dropout']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.dropout']);
		}
	}
	// {
	// 	id: 'final',
	// 	title: `Let's explore!`,
	// 	content: '',
	// 	on: () => {},
	// 	out: () => {}
	// }
];
