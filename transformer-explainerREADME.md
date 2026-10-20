# Transformer Explainer:文本生成模型的交互式学习工具(中文学术版)

Transformer Explainer 是一个交互式可视化教学工具,旨在帮助学习者理解 GPT 等 Transformer 架构模型的工作原理。它在浏览器中实时运行 GPT-2 模型,让您可以使用自己的文本进行实验,并实时观察 Transformer 的各个内部组件与运算如何协同预测下一个词元。

本仓库为面向中文学生的**中文学术化翻译版本**:界面、交互式教程、教学文章及全部提示信息均已转换为标准中文学术表达(核心术语遵循国内深度学习教材的通行译法,如"词元化""自注意力""层归一化""残差连接"等,并在首次出现时附英文原词)。

- 原版在线演示:http://poloclub.github.io/transformer-explainer
- 演示视频(YouTube):https://youtu.be/TFUc41G2ikY

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![arxiv badge](https://img.shields.io/badge/arXiv-2408.04619-red)](https://arxiv.org/abs/2408.04619)

<a href="https://youtu.be/TFUc41G2ikY" target="_blank"><img width="100%" src='https://github.com/user-attachments/assets/0a4d8888-6555-4df5-bc71-77f1299115c3'></a>

## 在线演示

原版演示:http://poloclub.github.io/transformer-explainer

## 研究论文

[**Transformer Explainer: Interactive Learning of Text-Generative Models**](https://arxiv.org/abs/2408.04619).
Aeree Cho, Grace C. Kim, Alexander Karpekov, Alec Helbling, Zijie J. Wang, Seongmin Lee, Benjamin Hoover, Duen Horng Chau.
_Poster, IEEE VIS 2024._

## 本地运行

#### 环境要求

- Node.js v20 或更高版本
- NPM v10 或更高版本

#### 步骤

```bash
git clone https://github.com/poloclub/transformer-explainer.git
cd transformer-explainer
npm install
npm run dev
```

然后在浏览器中访问 http://localhost:5173。

## 部署到 GitHub Pages

详见本仓库中的 [部署指南](./DEPLOYMENT.md),其中包含完整、可操作的中文部署步骤(含 GitHub Actions 自动部署与手动部署两种方式)。

## 致谢

Transformer Explainer 由佐治亚理工学院的 <a href="https://aereeeee.github.io/" target="_blank">Aeree Cho</a>、<a href="https://www.linkedin.com/in/chaeyeonggracekim/" target="_blank">Grace C. Kim</a>、<a href="https://alexkarpekov.com/" target="_blank">Alexander Karpekov</a>、<a href="https://alechelbling.com/" target="_blank">Alec Helbling</a>、<a href="https://zijie.wang/" target="_blank">Jay Wang</a>、<a href="https://seongmin.xyz/" target="_blank">Seongmin Lee</a>、<a href="https://bhoov.com/" target="_blank">Benjamin Hoover</a> 与 <a href="https://poloclub.github.io/polochau/" target="_blank">Polo Chau</a> 创建。

## 引用

```bibTeX
@article{cho2024transformer,
  title = {Transformer Explainer: Interactive Learning of Text-Generative Models},
  shorttitle = {Transformer Explainer},
  author = {Cho, Aeree and Kim, Grace C. and Karpekov, Alexander and Helbling, Alec and Wang, Zijie J. and Lee, Seongmin and Hoover, Benjamin and Chau, Duen Horng},
  journal={IEEE VIS Poster},
  year={2024}
}
```

## 许可证

本软件基于 [MIT License](https://github.com/poloclub/transformer-explainer/blob/main/LICENSE) 开源。

## 联系方式

如有任何问题,欢迎[提交 Issue](https://github.com/poloclub/transformer-explainer/issues/new/choose),或联系 [Aeree Cho](https://aereeeee.github.io/) 及上述其他贡献者。

## 更多 AI 可视化教学工具

- [**Diffusion Explainer**](https://poloclub.github.io/diffusion-explainer):了解 Stable Diffusion 如何将文本提示变换为图像
- [**CNN Explainer**](https://poloclub.github.io/cnn-explainer):卷积神经网络可视化
- [**GAN Lab**](https://poloclub.github.io/ganlab):在浏览器中交互式体验生成对抗网络
