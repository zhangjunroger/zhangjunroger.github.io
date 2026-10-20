<script>
	import tailwindConfig from '../../../tailwind.config';
	import resolveConfig from 'tailwindcss/resolveConfig';
	import Katex from '~/utils/Katex.svelte';
</script>

<div id="description">
	<div class="article-section" data-click="article-intro">
		<h1>什么是 Transformer?</h1>

		<p>
			Transformer 是一种从根本上改变了人工智能研究范式的神经网络架构。它由开创性论文
			<a
				href="https://dl.acm.org/doi/10.5555/3295222.3295349"
				title="ACM Digital Library"
				target="_blank">《Attention is All You Need》</a
			>
			于 2017 年首次提出,此后成为深度学习模型的主流架构,支撑着 OpenAI 的
			<strong>GPT</strong>、Meta 的 <strong>Llama</strong> 与 Google 的
			<strong>Gemini</strong> 等文本生成模型。在文本之外,Transformer 还被广泛应用于
			<a
				href="https://huggingface.co/learn/audio-course/en/chapter3/introduction"
				title="Hugging Face"
				target="_blank">音频生成</a
			>、
			<a
				href="https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/vision-transformers-for-image-classification"
				title="Hugging Face"
				target="_blank">图像识别</a
			>、
			<a href="https://elifesciences.org/articles/82819" title="eLife"
				>蛋白质结构预测</a
			>,乃至
			<a
				href="https://www.deeplearning.ai/the-batch/reinforcement-learning-plus-transformers-equals-efficiency/"
				title="Deep Learning AI"
				target="_blank">博弈决策</a
			>等领域,充分展现了其跨领域的通用性。
		</p>
		<p>
			从根本上说,文本生成式 Transformer 模型遵循<strong>下一词元预测</strong>的工作原理:给定用户输入的文本提示(prompt),模型需要回答——在这段输入之后,<em>最可能出现的下一个词元(一个词或词的一部分)是什么?</em>Transformer 的核心创新与强大之处在于其自注意力机制,使模型能够处理整个序列,并比以往的架构更有效地捕捉长程依赖关系。
		</p>
		<p>
			GPT-2 系列模型是文本生成式 Transformer 的典型代表。Transformer
			Explainer 基于
			<a href="https://huggingface.co/openai-community/gpt2" title="Hugging Face" target="_blank"
				>GPT-2</a
			>
			(小号版本)模型运行,该模型拥有 1.24 亿个参数。它虽然不是最新、最强大的
			Transformer 模型,但其架构组件和原理与当前最先进的模型一脉相承,因而是理解
			Transformer 基础知识的理想起点。
		</p>
	</div>

	<div class="article-section" data-click="article-overview">
		<h1>Transformer 架构</h1>

		<p>
			每一个文本生成式 Transformer 都包含以下<strong>三个关键组件</strong>:
		</p>
		<ol>
			<li>
				<strong class="bold-purple">嵌入(Embedding)</strong>:将文本输入划分为称为词元(token)的较小单元,可以是完整的词,也可以是子词。这些词元随后被转换为数值向量,即嵌入向量,用于刻画词的语义信息。
			</li>
			<li>
				<strong class="bold-purple">Transformer 模块</strong>是模型的基础构件,负责处理和变换输入数据。每个模块包含:
				<ul class="">
					<li>
						<strong>注意力机制</strong>,Transformer 模块的核心组件。它使不同词元之间能够相互"交流",捕捉上下文信息以及词与词之间的关系。
					</li>
					<li>
						<strong>MLP(多层感知机)层</strong>,一个对每个词元独立运算的前馈网络。注意力层的作用是在词元之间传递信息,而 MLP 的作用则是精炼每个词元自身的表示。
					</li>
				</ul>
			</li>
			<li>
				<strong class="bold-purple">输出概率</strong>:最后的线性层与 softmax 层将处理后的嵌入转换为概率分布,使模型能够对序列中的下一个词元作出预测。
			</li>
		</ol>
	</div>

	<div class="article-section" id="embedding" data-click="article-embedding">
		<h2>嵌入(Embedding)</h2>
		<p>
			假设您想使用 Transformer 模型生成文本,并输入了这样的提示:<code
				>“Data visualization empowers users to”</code
			>。这段输入需要先被转换为模型能够理解和处理的格式,这正是嵌入发挥作用的地方:它将文本变换为模型可以运算的数值表示。要将一段提示转换为嵌入,我们需要依次完成:1)对输入进行词元化;2)获取词元嵌入;3)加入位置信息;最后 4)将词元嵌入与位置编码相加,得到最终嵌入。下面我们逐步考察其中的每一个环节。
		</p>
		<div class="figure">
			<img src="./article_assets/embedding.png" width="65%" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">1</span>。嵌入层的展开视图,展示输入提示如何被转换为向量表示。该过程包括
			<span class="fig-numbering">(1)</span> 词元化、(2) 词元嵌入、(3) 位置编码,以及 (4) 最终嵌入。
		</div>
		<div class="article-subsection">
			<h3>第 1 步:词元化(Tokenization)</h3>
			<p>
				词元化是将输入文本切分为更小、更易于处理的单元(即词元)的过程。这些词元可以是一个完整的词,也可以是子词。<code>"Data"</code> 和
				<code>"visualization"</code> 各自对应一个独立的词元,而单词 <code>"empowers"</code>
				则被切分为两个词元。完整的词元词表在训练模型之前就已确定:GPT-2 的词表包含
				<code>50,257</code> 个不同的词元。将输入文本切分为带有唯一 ID 的词元之后,我们就可以通过嵌入获取它们的向量表示。
			</p>
		</div>
		<div class="article-subsection" id="article-token-embedding">
			<h3>第 2 步:词元嵌入(Token Embedding)</h3>
			<p>
				GPT-2(小号版本)将词表中的每个词元表示为一个 768 维向量;向量的维度取决于具体的模型。这些嵌入向量存储在一个形状为
				<code>(50,257, 768)</code> 的矩阵中,包含约 3900 万个参数!借助这一规模庞大的矩阵,模型能够为每个词元赋予语义——在训练中,用法或语义相近的词元在高维空间中彼此靠近,而语义无关的词元则相距较远。
			</p>
		</div>
		<div class="article-subsection" id="article-positional-embedding">
			<h3>第 3 步:位置编码(Positional Encoding)</h3>
			<p>
				嵌入层还会对每个词元在输入提示中的位置信息进行编码。不同模型采用的位置编码方法各不相同。GPT-2
				从零开始训练自己的位置编码矩阵,并将其直接整合进训练过程之中。
			</p>
		</div>
		<div class="article-subsection">
			<h3>第 4 步:最终嵌入(Final Embedding)</h3>
			<p>
				最后,我们将词元嵌入与位置编码相加,得到最终的嵌入表示。这一融合表示既刻画了词元的语义信息,也保留了其在输入序列中的位置信息。
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-transformer-block">
		<h2>Transformer 模块</h2>

		<p>
			Transformer 处理流程的核心在于 Transformer 模块,它由多头自注意力与多层感知机(MLP)层构成。大多数模型由多个这样的模块按顺序堆叠而成。词元的表示从第一个模块到最后一个模块逐层演化,使模型能够对每个词元建立越来越深入的理解。这种分层设计使模型能够构建对输入的高阶抽象表示。我们所考察的
			GPT-2(小号版本)模型由 <code>12</code> 个这样的模块组成。
		</p>
	</div>

	<div class="article-section" id="self-attention" data-click="article-attention">
		<h3>多头自注意力(Multi-Head Self-Attention)</h3>
		<p>
			自注意力机制使模型能够捕捉序列中词元之间的关系,使每个词元的表示都受到其他词元的影响。多个注意力头让模型可以从不同角度考察这些关系;例如,某个头可能关注短距离的句法关联,而另一个头则追踪更宏观的语义语境。下面我们将逐步剖析多头自注意力的计算过程。
		</p>
		<div class="article-subsection-l2">
			<h4>第 1 步:查询、键、值矩阵</h4>

			<div class="figure pt-10">
				<img src="./article_assets/QKV.png" width="80%" />
				<div class="text-xs">
					<Katex
						displayMode
						math={`
		QKV_{ij} = ( \\sum_{d=1}^{768} \\text{Embedding}_{i,d} \\cdot \\text{Weights}_{d,j}) + \\text{Bias}_j
		`}
					/>
				</div>
			</div>
			<div class="figure-caption">
				图 <span class="attention">2</span>。由原始嵌入计算查询(Query)、键(Key)、值(Value)矩阵。
			</div>

			<p>
				每个词元的嵌入向量会被变换为三个向量:
				<span class="q-color">查询(Query,Q)</span>、
				<span class="k-color">键(Key,K)</span>与
				<span class="v-color">值(Value,V)</span>。这三个向量是通过将输入嵌入矩阵与学习得到的
				<span class="q-color">Q</span>、<span class="k-color">K</span>、<span class="v-color">V</span>
				权重矩阵相乘而得到的。为了帮助建立对这些矩阵的直观理解,可以借助"网络搜索"这个类比:
			</p>
			<ul>
				<li>
					<strong class="q-color font-medium">查询(Query,Q)</strong>
					相当于您在搜索引擎输入框中键入的检索文本,代表当前想要"进一步了解信息"的那个词元。
				</li>
				<li>
					<strong class="k-color font-medium">键(Key,K)</strong>
					相当于搜索结果中每个网页的标题,代表查询可能关注到的候选词元。
				</li>
				<li>
					<strong class="v-color font-medium">值(Value,V)</strong>
					相当于网页呈现的实际内容。当检索词(Query)与相关结果(Key)匹配之后,我们希望获取的正是最相关页面的内容(Value)。
				</li>
			</ul>
			<p>
				借助这些 QKV 数值,模型可以计算注意力分数,从而决定在生成预测时每个词元所应获得的关注程度。
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>第 2 步:多头切分</h4>
			<p>
				<span class="q-color">查询</span>、<span class="k-color">键</span>与
				<span class="v-color">值</span>
				向量会被切分到多个注意力头中——GPT-2(小号版本)切分为
				<code>12</code> 个头。每个头独立处理嵌入向量中的一段子向量,捕捉不同的句法与语义关系。这种设计使模型能够并行学习多样化的语言特征,增强其表示能力。
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>第 3 步:带掩码的自注意力</h4>
			<p>
				在每个注意力头中,我们执行带掩码的自注意力计算。该机制让模型在聚焦输入相关部分的同时,无法访问未来的词元,从而支持序列的自回归生成。
			</p>

			<div class="figure">
				<img src="./article_assets/attention.png" width="80%" align="middle" />
			</div>
			<div class="figure-caption">
				图 <span class="attention">3</span>。利用查询、键、值矩阵计算带掩码的自注意力。
			</div>

			<ul>
				<li>
					<strong>点积</strong>:<span class="q-color">查询</span>与
					<span class="k-color">键</span>
					矩阵的点积决定<strong>注意力分数</strong>,得到一个方阵,反映所有输入词元之间的关系。
				</li>
				<li>
					<strong>缩放 · 掩码</strong>:对注意力分数进行缩放,并在注意力矩阵的上三角施加掩码,以阻止模型访问未来的词元——这些位置被设为负无穷。模型必须学会在不"偷看"未来的前提下预测下一个词元。
				</li>
				<li>
					<strong>Softmax · Dropout</strong>:掩码与缩放之后,注意力分数经 softmax
					运算转换为概率,并可选择性使用 dropout 进行正则化。矩阵每行之和为 1,表示其左侧每个词元对当前词元的相关程度。
				</li>
			</ul>
		</div>
		<div class="article-subsection-l2">
			<h4>第 4 步:输出与拼接</h4>
			<p>
				模型将带掩码的自注意力分数与
				<span class="v-color">值(Value)</span>矩阵相乘,得到自注意力机制的
				<span class="purple-color">最终输出</span>。GPT-2 拥有
				<code>12</code> 个自注意力头,各自捕捉词元之间不同的关系。这些头的输出先被拼接,再经过一个线性投影。
			</p>
		</div>
	</div>

	<div class="article-section" id="article-activation" data-click="article-mlp">
		<h3>MLP:多层感知机(Multi-Layer Perceptron)</h3>

		<div class="figure">
			<img src="./article_assets/mlp.png" width="70%" align="middle" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">4</span>。利用 MLP 层将自注意力的表示投影到更高维空间,以增强模型的表示能力。
		</div>

		<p>
			当多头自注意力捕捉了输入词元之间的多种关系之后,其拼接后的输出会经过多层感知机(MLP)层,以进一步增强模型的表示能力。MLP
			模块由两个线性变换构成,中间夹着一个
			<a
				href="https://en.wikipedia.org/wiki/Rectified_linear_unit#Gaussian_error_linear_unit_(GELU)"
				>GELU</a
			> 激活函数。
		</p>
		<p>
			第一个线性变换将输入的维度从 <code>768</code> 扩展到四倍的
			<code>3072</code>。这一升维步骤使模型能够将词元表示投影到更高维的空间中,在其中捕捉原维度下不可见的、更丰富也更复杂的模式。
		</p>
		<p>
			第二个线性变换随后将维度压缩回原始大小 <code>768</code>。这一降维步骤在保留升维阶段引入的有用非线性变换的同时,将表示恢复到便于处理的规模。
		</p>
		<p>
			与在词元之间融合信息的自注意力机制不同,MLP 对各词元独立处理,只是把每个词元的表示从一个空间映射到另一个空间,并由此提升模型的整体容量。
		</p>
	</div>

	<div class="article-section" id="article-prob" data-click="article-prob">
		<h2>输出概率</h2>
		<p>
			输入经过所有 Transformer 模块处理后,输出会被送入最后的线性层,为词元预测做好准备。该层将最终表示投影到
			<code>50,257</code>
			维的空间中,词表中的每个词元都对应其中一个数值,称为
			<code>logit</code>。由于任何词元都可能成为下一个词,这一过程实际上让我们可以按“作为下一个词的可能性”对这些词元进行排序。随后我们应用
			softmax 函数,将 logits 转换为总和为 1 的概率分布,从而可以依据可能性对下一个词元进行采样。
		</p>

		<div class="figure py-5">
			<img src="./article_assets/softmax.png" width="70%" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">5</span>。词表中的每个词元都依据模型输出的 logits
			获得一个概率。这些概率决定了每个词元作为序列中下一个词的可能性。
		</div>

		<p id="article-temperature" data-click="article-temperature">
			最后一步是从该分布中采样生成下一个词元。在这一过程中,<code>温度(temperature)</code>
			超参数起着关键作用。从数学上看,这是一个非常简单的操作:将模型输出的 logits 直接除以
			<code>温度</code>:
		</p>

		<ul>
			<li>
				<code>temperature = 1</code>:logits 除以 1 不会改变 softmax 的输出。
			</li>
			<li>
				<code>temperature &lt; 1</code>:较低的温度会锐化概率分布,使模型更加自信、更具确定性,产生更可预测的输出。
			</li>
			<li>
				<code>temperature &gt; 1</code>:较高的温度会软化概率分布,为生成文本引入更多随机性——也就是一些人所称的模型<strong>“创造性”</strong>。
			</li>
		</ul>

		<p id="article-sampling" data-click="article-sampling">
			此外,采样过程还可以借助 <code>top-k</code> 与
			<code>top-p</code> 参数作进一步控制:
		</p>
		<ul>
			<li>
				<code>top-k 采样</code>:将候选词元限制为概率最高的前 k 个,过滤掉可能性较低的选项。
			</li>
			<li>
				<code>top-p 采样</code>:考虑累计概率超过阈值 p 的最小词元集合,在保证只保留高概率词元的同时兼顾多样性。
			</li>
		</ul>
		<p>
			通过调节 <code>温度</code>、<code>top-k</code> 与 <code>top-p</code>,您可以在确定性与多样性之间取得平衡,按需定制模型的行为。
		</p>
	</div>

	<div class="article-section" data-click="article-advanced-features">
		<h2>辅助架构特性</h2>

		<p>
			除了核心组件之外,Transformer 模型还包含若干提升性能的辅助架构特性。它们对模型的整体性能十分重要,但对理解架构核心概念而言并非关键。层归一化、Dropout
			与残差连接是 Transformer 模型中的关键组件,在训练阶段尤为如此:层归一化能够稳定训练过程、加快模型收敛;Dropout
			通过随机失活神经元来防止过拟合;残差连接则让梯度得以直接流经网络,有效缓解梯度消失问题。
		</p>
		<div class="article-subsection" id="article-ln">
			<h3>层归一化(Layer Normalization)</h3>

			<p>
				层归一化有助于稳定训练过程并改善收敛。其做法是对各特征维度上的输入进行归一化,保证激活值的均值和方差保持一致。这种归一化能够缓解内部协变量偏移相关问题,使模型更有效地学习,并降低对初始权重的敏感度。层归一化在每个
				Transformer 模块中使用两次:一次在自注意力机制之前,一次在 MLP 层之前。
			</p>
		</div>
		<div class="article-subsection" id="article-dropout">
			<h3>Dropout(随机失活)</h3>

			<p>
				Dropout 是一种用于防止神经网络过拟合的正则化技术:在训练时随机将一部分模型权重置零。这促使模型学习更鲁棒的特征,降低对特定神经元的依赖,帮助网络更好地泛化到未见过的数据。在模型推理阶段,Dropout
				处于关闭状态。这实质上相当于使用训练得到的多个子网络的集成,从而带来更好的模型性能。
			</p>
		</div>
		<div class="article-subsection" id="article-residual">
			<h3>残差连接(Residual Connection)</h3>

			<p>
				残差连接最早在 2015 年的 ResNet 模型中提出。这一架构创新使极深神经网络的训练成为可能,深刻影响了深度学习的发展。本质上,残差连接是绕过一层或多层的"捷径",将一层的输入直接加到该层的输出上。这有助于缓解梯度消失问题,使彼此堆叠的多个
				Transformer 模块组成的深层网络更易训练。在 GPT-2
				中,每个 Transformer 模块内部使用两次残差连接:分别位于 MLP
				之前与之后,确保梯度更顺畅地流动,让靠近输入的各层在反向传播中获得充分的更新。
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-interactive-features">
		<h1>交互功能</h1>
		<p>
			Transformer Explainer 以交互式探索为设计目标,让您可以亲手体验 Transformer
			的内部工作机制。以下是您可以尝试的部分交互功能:
		</p>

		<ul>
			<li>
				<strong>输入您自己的文本序列</strong
				>,观察模型如何处理文本并预测下一个词。您可以探索注意力权重、中间计算过程,并查看最终输出概率是如何得出的。
			</li>
			<li>
				<strong>使用温度(Temperature)滑块</strong
				>,控制模型预测的随机性。通过改变温度取值,体验模型输出如何在严谨确定与丰富创造之间变化。
			</li>
			<li>
				<strong>选择 top-k 与 top-p 采样方法</strong
				>,调节推理阶段的采样行为。尝试不同的取值,观察概率分布如何变化并影响模型的预测。
			</li>
			<li>
				<strong>与注意力矩阵交互</strong
				>,查看模型如何关注输入序列中的不同词元。将鼠标悬停在词元上可高亮其注意力权重,探索模型如何捕捉上下文与词间关系。
			</li>
		</ul>
	</div>

	<div class="article-section" data-click="article-video">
		<h2>视频教程</h2>
		<div class="video-container">
			<iframe
				src="https://www.youtube.com/embed/ECR4oAwocjs"
				title="Transformer Explainer 视频教程(YouTube)"
				loading="lazy"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			>
			</iframe>
		</div>
	</div>

	<div class="article-section" data-click="article-implementation">
		<h2>Transformer Explainer 的技术实现</h2>
		<p>
			Transformer Explainer 内置了一个直接在浏览器中实时运行的 GPT-2(小号版本)模型。该模型源自 Andrej
			Karpathy 的
			<a href="https://github.com/karpathy/nanoGPT" title="Github" target="_blank"
				>nanoGPT 项目</a
			>中 GPT 的 PyTorch 实现,并被转换为
			<a href="https://onnxruntime.ai/" title="ONNX" target="_blank">ONNX Runtime</a>
			格式,从而可以在浏览器中流畅运行。界面基于 JavaScript 构建,使用
			<a href="https://kit.svelte.dev/" title="Svelte" target="_blank">Svelte</a>
			作为前端框架,并借助
			<a href="https://d3js.org/" title="D3" target="_blank">D3.js</a>
			创建动态可视化。页面中的数值会随用户输入实时更新。
		</p>
	</div>

	<div class="article-section" data-click="article-credit">
		<h2>Transformer Explainer 的开发团队</h2>
		<p>
			Transformer Explainer 由以下人员创建:

			<a href="https://aereeeee.github.io/" target="_blank">Aeree Cho</a>,
			<a href="https://www.linkedin.com/in/chaeyeonggracekim/" target="_blank">Grace C. Kim</a>,
			<a href="https://alexkarpekov.com/" target="_blank">Alexander Karpekov</a>,
			<a href="https://alechelbling.com/" target="_blank">Alec Helbling</a>,
			<a href="https://zijie.wang/" target="_blank">Jay Wang</a>,
			<a href="https://seongmin.xyz/" target="_blank">Seongmin Lee</a>,
			<a href="https://bhoov.com/" target="_blank">Benjamin Hoover</a> 与
			<a href="https://poloclub.github.io/polochau/" target="_blank">Polo Chau</a>

			,来自佐治亚理工学院(Georgia Institute of Technology)。
		</p>
		<p class="localization-note">
			<strong>汉化说明</strong>:本站汉化自上述佐治亚理工学院的开源项目
			<a
				href="https://github.com/poloclub/transformer-explainer"
				target="_blank"
				title="GitHub"
				>Transformer Explainer</a
			>——界面、交互式教程与教学文章均已译为标准中文学术表达,供《神经网络与深度学习》课程教学使用。
		</p>
	</div>
</div>

<style lang="scss">
	a {
		color: theme('colors.blue.500');

		&:hover {
			color: theme('colors.blue.700');
		}
	}

	.bold-purple {
		color: theme('colors.purple.700');
		font-weight: bold;
	}

	.localization-note {
		margin-top: 1.2rem;
		padding: 0.8rem 1rem;
		border-left: 3px solid theme('colors.purple.300');
		background: theme('colors.purple.50');
		border-radius: 0.4rem;
	}

	code {
		color: theme('colors.gray.500');
		background-color: theme('colors.gray.50');
		font-family: theme('fontFamily.mono');
	}

	.q-color {
		color: theme('colors.blue.400');
	}

	.k-color {
		color: theme('colors.red.400');
	}

	.v-color {
		color: theme('colors.green.400');
	}

	.purple-color {
		color: theme('colors.purple.500');
	}

	.article-section {
		padding-bottom: 2rem;
	}
	.architecture-section {
		padding-top: 1rem;
	}
	.video-container {
		position: relative;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		max-width: 100%;
		background: #000;
	}

	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	#description {
		padding-bottom: 3rem;
		margin-left: auto;
		margin-right: auto;
		max-width: 78ch;
	}

	#description h1 {
		color: theme('colors.purple.700');
		font-size: 2.2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h2 {
		// color: #444;
		color: theme('colors.purple.700');
		font-size: 2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h3 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description h4 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description p {
		margin: 1rem 0;
	}

	#description p img {
		vertical-align: middle;
	}

	#description .figure-caption {
		font-size: 0.8rem;
		margin-top: 0.5rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	#description ol {
		margin-left: 3rem;
		list-style-type: decimal;
	}

	#description li {
		margin: 0.6rem 0;
	}

	#description p,
	#description div,
	#description li {
		color: theme('colors.gray.600');
		line-height: 1.6;
	}

	#description small {
		font-size: 0.8rem;
	}

	#description ol li img {
		vertical-align: middle;
	}

	#description .video-link {
		color: theme('colors.blue.600');
		cursor: pointer;
		font-weight: normal;
		text-decoration: none;
	}

	#description ul {
		list-style-type: disc;
		margin-left: 2.5rem;
		margin-bottom: 1rem;
	}

	#description a:hover,
	#description .video-link:hover {
		text-decoration: underline;
	}

	.figure,
	.video {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
