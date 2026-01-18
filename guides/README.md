# Cornerstone3D 影像浏览器开发指南

欢迎来到 Cornerstone3D 开发指南！本指南将帮助您快速掌握 Cornerstone3D 框架，并基于此构建专业的医学影像应用。

## 📚 指南概述

本指南采用**分层递进式**结构，从概念到实践，由浅入深地引导开发者学习 Cornerstone3D。

### 适合谁？

- ✅ 熟悉 JavaScript/TypeScript 的前端开发者
- ✅ 需要构建医学影像应用的开发者
- ✅ 希望理解 Cornerstone3D 架构的工程师
- ✅ 医疗影像领域的开发者和技术负责人

### 前置知识

在开始之前，建议您具备：

- JavaScript/TypeScript 基础
- 现代 Web 开发经验（React、Vue 或 Angular）
- DICOM 标准和医学影像的基本了解
- Node.js 20+ 和 Yarn 1.22+ 环境

---

## 🗺️ 学习路径

### 推荐学习顺序

1. **架构理解** → 了解 Cornerstone3D 的整体架构和设计理念
2. **快速入门** → 搭建第一个影像查看器，掌握基础操作
3. **高级功能** → 学习标注、测量、3D 渲染等高级功能
4. **实践示例** → 通过完整示例项目巩固知识

### 时间估算

| 阶段 | 预计时间 | 说明 |
|------|----------|------|
| 架构理解 | 2-3 小时 | 阅读 5 篇架构文档 |
| 快速入门 | 3-4 小时 | 完成 4 个实践步骤 |
| 高级功能 | 8-12 小时 | 学习 6 个高级主题 |
| 实践示例 | 4-6 小时 | 运行和修改示例项目 |
| **总计** | **17-25 小时** | 从零到独立开发 |

---

## 📖 文档导航

### 1. 架构文档

了解 Cornerstone3D 的核心架构和设计理念。

- [**Cornerstone3D 概述**](architecture/overview.md) - 什么是 Cornerstone3D？
- [**Monorepo 结构详解**](architecture/monorepo-structure.md) - 项目组织方式
- [**核心包职责说明**](architecture/core-packages.md) - 各个包的功能
- [**架构概念**](architecture/architectural-concepts.md) - RenderingEngine、Viewport、ImageLoader 等
- [**外部依赖说明**](architecture/dependencies.md) - VTK.js、dicom-parser 等
- [**术语表**](architecture/glossary.md) - 中英文术语对照

### 2. 快速入门

跟随步骤指南，快速搭建您的第一个影像查看器。

- [**项目初始化**](getting-started/project-setup.md) - 创建新项目
- [**Cornerstone3D 初始化**](getting-started/initialization.md) - 配置和初始化
- [**第一个影像查看器**](getting-started/first-viewer.md) - 加载和显示 DICOM 影像
- [**基本交互**](getting-started/basic-interactions.md) - 缩放、平移、窗宽窗位
- [**框架集成**](getting-started/framework-integration.md) - React、Vue、Angular 集成

### 3. 高级指南

学习高级功能，构建专业级的医学影像应用。

- [**标注工具**](advanced/annotations.md) - RectangleROI、EllipticalROI 等
- [**测量工具**](advanced/measurements.md) - 距离、角度、面积测量
- [**3D 体渲染**](advanced/volume-rendering.md) - VolumeViewport 和体渲染
- [**多视口同步**](advanced/multi-viewport.md) - 视口联动和同步
- [**性能优化**](advanced/performance-optimization.md) - 缓存、懒加载、Web Worker
- [**AI 集成**](advanced/ai-integration.md) - ONNX 模型推理
- [**自定义工具**](advanced/custom-tools.md) - 开发自定义工具
- [**高级加载器**](advanced/advanced-loaders.md) - 自定义 ImageLoader

### 4. 完整示例

参考完整的示例项目，快速开始您的开发。

- [**基础查看器示例**](examples/basic-viewer/) - 简单的 DICOM 查看器
- [**高级查看器示例**](examples/advanced-viewer/) - 功能完整的应用

### 5. 故障排查

遇到问题？在这里查找解决方案。

- [**常见错误**](troubleshooting/common-errors.md) - 错误代码和解决方案
- [**调试技巧**](troubleshooting/debugging-tips.md) - 调试方法和工具
- [**常见问题**](troubleshooting/faq.md) - FAQ 和解答

---

## 🚀 快速开始

### 5 分钟上手

```bash
# 1. 创建项目
npm create vite@latest my-cornerstone-app -- --template react-ts
cd my-cornerstone-app

# 2. 安装依赖
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader

# 3. 初始化 Cornerstone3D
# (详见 [初始化指南](getting-started/initialization.md)）

# 4. 运行应用
yarn dev
```

详细步骤请参考 [快速入门](getting-started/) 章节。

---

## 💡 核心概念

### RenderingEngine（渲染引擎）

管理 WebGL 上下文和视口生命周期的核心组件。

```typescript
import { RenderingEngine } from '@cornerstonejs/core';

const renderingEngine = new RenderingEngine('my-engine');
```

### Viewport（视口）

用于显示影像的画布区域，分为多种类型：

- **StackViewport**: 2D 栈式视口（单帧影像）
- **VolumeViewport**: 3D 体视口（体数据渲染）
- **VolumeViewport3D**: 增强的 3D 体视口

### ImageLoader（影像加载器）

负责从不同数据源加载影像数据：

- **WADO-RS**: 从 DICOMweb 服务器加载
- **WADO-URI**: 传统 WADO 协议
- **本地文件**: 使用 File API 加载

### Tool（工具）

提供用户交互功能：

- 标注工具（RectangleROI、EllipticalROI）
- 测量工具（长度、角度、面积）
- 操作工具（缩放、平移、窗宽窗位）

---

## 📦 核心包

Cornerstone3D 采用模块化架构，核心包包括：

| 包名 | 功能 | 文档 |
|------|------|------|
| `@cornerstonejs/core` | 核心渲染引擎、视口管理、缓存系统 | [文档](https://www.cornerstonejs.org/api/core/) |
| `@cornerstonejs/tools` | 交互工具、标注、测量 | [文档](https://www.cornerstonejs.org/api/tools/) |
| `@cornerstonejs/dicom-image-loader` | DICOM 影像加载器 | [文档](https://www.cornerstonejs.org/api/dicomImageLoader/) |
| `@cornerstonejs/adapters` | 适配器、格式转换 | [文档](https://www.cornerstonejs.org/api/adapters/) |
| `@cornerstonejs/ai` | AI/ML 集成、ONNX 推理 | [文档](https://www.cornerstonejs.org/api/ai/) |

---

## 🎯 学习目标

完成本指南后，您将能够：

- ✅ 理解 Cornerstone3D 的架构和核心概念
- ✅ 独立搭建 DICOM 影像查看器
- ✅ 集成标注和测量工具
- ✅ 实现 3D 体渲染
- ✅ 优化应用性能
- ✅ 集成 AI 模型进行自动分割
- ✅ 处理常见错误和问题

---

## 🤝 贡献指南

欢迎贡献您的知识和经验！

1. Fork 本仓库
2. 创建您的特性分支：`git checkout -b feature/my-improvement`
3. 提交您的更改：`git commit -m 'docs: 添加性能优化技巧'`
4. 推送到分支：`git push origin feature/my-improvement`
5. 创建 Pull Request

请确保您的贡献符合以下标准：

- 所有文档使用中文编写
- 代码示例包含中文注释
- 遵循文档质量检查清单
- 通过 Prettier 格式化

详见 [贡献指南](CONTRIBUTING.md)。

---

## 📚 相关资源

### 官方资源

- [Cornerstone3D 官方网站](https://www.cornerstonejs.org/)
- [Cornerstone3D GitHub](https://github.com/cornerstonejs/cornerstone3D)
- [Cornerstone3D API 文档](https://www.cornerstonejs.org/api/)
- [Cornerstone3D 示例](https://www.cornerstonejs.org/docs/examples/)

### 社区

- [OHIF 社区论坛](https://community.ohif.org/)
- [GitHub Issues](https://github.com/cornerstonejs/cornerstone3D/issues)
- [GitHub Discussions](https://github.com/cornerstonejs/cornerstone3D/discussions)

### 参考资源

- [DICOM 标准](https://www.dicomstandard.org/)
- [DICOMweb 标准](https://www.dicomstandard.org/dicomweb/)
- [医学影像基础](https://www.dicomstandard.org/education/)

---

## 📝 文档版本

- **版本**: 1.0.0
- **最后更新**: 2025-01-18
- **Cornerstone3D 版本**: 基于 Cornerstone3D 最新版本

---

## 🙏 致谢

感谢 Cornerstone3D 社区的所有贡献者，特别是 OHIF 团队的持续支持和维护。

---

**准备好了吗？开始您的 Cornerstone3D 学习之旅吧！** 🚀

- 新手？从 [架构概述](architecture/overview.md) 开始
- 想快速上手？跳到 [快速入门](getting-started/)
- 遇到问题？查看 [故障排查](troubleshooting/)
