---
id: overview
title: Cornerstone3D 概述
category: architecture
order: 1
description: 什么是 Cornerstone3D？核心特性、应用场景和设计理念
prerequisites: []
estimatedTime: "15 分钟"
difficulty: beginner
tags: ["概述", "架构", "简介", "Cornerstone3D"]
---

# Cornerstone3D 概述

## 什么是 Cornerstone3D？

Cornerstone3D 是一个现代化的、基于 Web 标准的医学影像渲染框架，专为构建高性能的 DICOM（Digital Imaging and Communications in Medicine）应用而设计。它是 Cornerstone.js 的下一版本，充分利用现代 Web 技术提供卓越的性能和开发体验。

### 核心定位

Cornerstone3D 是一个**开源的、模块化的 JavaScript 工具包集合**，让开发者能够快速构建专业的医学影像应用，如：

- 🖼️ **DICOM 查看器** - 查看、浏览和分析医学影像
- 📊 **诊断工作站** - 放射科、病理科等临床应用
- 🤖 **AI 辅助诊断** - 集成机器学习模型进行自动分割和检测
- 📈 **科研平台** - 医学影像研究和分析

---

## 核心特性

### 1. 高性能渲染

Cornerstone3D 利用现代 WebGL 技术实现高性能影像渲染：

- **WebGL 加速**：充分利用 GPU 进行影像渲染，实现 60 FPS 流畅显示
- **WebAssembly 支持**：使用 Wasm 实现快速影像解压缩（JPEG、JPEG 2000、JPEG LS 等）
- **优化算法**：针对医学影像特点优化的渲染算法
- **多视口支持**：同时渲染多个视口，满足复杂读片需求

**架构图**:

```mermaid
flowchart TD
    Browser[浏览器应用]

    Browser --> Core[@cornerstonejs/core]
    Browser --> Tools[@cornerstonejs/tools]
    Browser --> Loader[@cornerstonejs/dicom-image-loader]
    Browser --> AI[@cornerstonejs/ai]

    Core --> WebGL[WebGL 2.0]
    Loader --> MetadataProvider[元数据提供器]
    Tools --> Interaction[用户交互工具]

    Core --> Cache[缓存系统]
    Core --> Viewport[视口系统]
    AI --> Model[AI 模型]
```

### 2. 模块化架构

### 2. 模块化架构

Cornerstone3D 采用 Monorepo 架构，提供多个独立的包：

- **@cornerstonejs/core** - 核心渲染引擎
- **@cornerstonejs/tools** - 交互工具库
- **@cornerstonejs/dicom-image-loader** - DICOM 影像加载器
- **@cornerstonejs/adapters** - 适配器库
- **@cornerstonejs/ai** - AI/ML 集成库

这种模块化设计允许开发者：
- ✅ 按需引入功能，减少包体积
- ✅ 独立升级各个包
- � 灵活组合不同功能

### 3. 标准兼容

Cornerstone3D 严格遵循医学影像标准：

- **DICOM 标准** - 完整支持 DICOM 标准规范
- **DICOMweb** - 原生支持 WADO-RS 和 WADO-URI 协议
- **互操作性** - 与 PACS、VNA 等系统无缝集成

### 4. 框架无关

Cornerstone3D 不绑定特定的前端框架：

- ✅ 支持 React、Vue、Angular 等现代框架
- ✅ 支持原生 JavaScript 应用
- ✅ 提供清晰的 TypeScript API
- ✅ 类型安全，编译时检查

### 5. 丰富的工具生态

内置丰富的交互工具，满足临床需求：

- **标注工具** - RectangleROI、EllipticalROI、FreehandROI 等
- **测量工具** - 长度、角度、面积、体积测量
- **操作工具** - 缩放、平移、旋转、窗宽窗位调整
- **高级功能** - 融合、分割、AI 辅助诊断

---

## 应用场景

### 1. 临床诊断

#### 放射科读片工作站

- **多序列对比** - 同屏对比不同时期的影像
- **多平面重建** - 轴位、冠状位、矢状位同步显示
- **标注和测量** - 病灶标注、距离和角度测量
- **窗宽窗位** - 一键切换不同组织窗宽窗位

#### 典型功能：

```typescript
// 多视口同步显示
const synchronizer = createViewportSynchronizer([
  viewport1,  // 轴位
  viewport2,  // 冠状位
  viewport3   // 矢状位
]);

synchronizer.syncViewports();
```

### 2. AI 辅助诊断

#### 自动分割和检测

- **器官分割** - 自动分割肝脏、肺、肾脏等器官
- **病灶检测** - AI 模型自动检测可疑病灶
- **测量辅助** - 自动测量病灶大小和特征

```typescript
// AI 辅助分割
const segmentation = await aiSegmenter.segment(imageId, 'liver');
viewport.addSegmentation(segmentation);
```

### 3. 医学教育

#### 教学和培训

- **病例库** - 收集和整理教学病例
- **标注练习** - 交互式标注训练
- **考试系统** - 基于影像的在线考试

### 4. 科研平台

#### 医学影像研究

- **批量处理** - 批量加载和分析影像
- **数据导出** - 导出标注和测量数据
- **算法验证** - 验证新算法和模型

---

## 技术栈

### 核心技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **TypeScript** | 5.5+ | 类型安全开发 |
| **WebGL** | 2.0 | GPU 加速渲染 |
| **WebAssembly** | - | 快速解压缩 |
| **VTK.js** | 34.15+ | 3D 体渲染 |
| **DICOM Parser** | 1.8+ | DICOM 文件解析 |

### 依赖库

- **@kitware/vtk.js** - 3D 可视化库
- **dicom-parser** - DICOM 解析
- **gl-matrix** - 矩阵运算
- **comlink** - Web Worker 通信
- **onnxruntime-web** - AI 模型推理

---

## 设计理念

### 1. 性能优先

- **60 FPS 渲染** - 保持流畅的用户体验
- **内存优化** - 智能缓存管理，避免内存溢出
- **懒加载** - 按需加载影像数据
- **并行处理** - Web Worker 处理计算密集型任务

### 2. 开发体验

- **类型安全** - 完整的 TypeScript 类型定义
- **API 清晰** - 直观易用的 API 设计
- **文档完善** - 详细的文档和示例
- **调试友好** - 丰富的调试工具

### 3. 可扩展性

- **插件化** - 支持自定义工具和加载器
- **适配器模式** - 轻松集成现有系统
- **事件驱动** - 灵活的事件系统
- **状态管理** - 完善的状态管理机制

### 4. 社区驱动

- **开源** - MIT 许可证，可自由使用和修改
- **社区参与** - 欢迎贡献和反馈
- **持续迭代** - 定期更新和新功能
- **专业支持** - OHIF 基金会支持

---

## 与 Cornerstone.js 的区别

| 特性 | Cornerstone.js | Cornerstone3D |
|------|---------------|---------------|
| **架构** | 单体应用 | 模块化 Monorepo |
| **渲染引擎** | 有限选项 | 灵活的渲染引擎模式 |
| **类型支持** | 部分 JavaScript | 完整 TypeScript |
| **工具系统** | 集成 | 独立包，更灵活 |
| **性能** | 较好 | 显著提升（WebGL 2.0） |
| **维护状态** | 维护模式 | 活跃开发 |

---

## 典型应用案例

### OHIF Viewer

[OHIF Viewer](https://ohif.org/) 是基于 Cornerstone 构建的开源医学影像查看器，支持：

- ✅ 多模态影像查看（CT、MRI、PET、超声等）
- ✅ 高级标注和测量工具
- ✅ 挂件架构，可扩展功能
- ✅ 国际标准兼容（DICOMweb、IHE）

### 商业 PACS 客户端

许多商业 PACS 厂商使用 Cornerstone3D 构建其 Web 客户端：

- 🏥 **企业级应用** - 稳定可靠的商业产品
- 🔧 **定制功能** - 根据医院需求定制
- 🌍 **全球化** - 支持多语言和本地化
- 📱 **移动端** - 支持平板和移动设备

---

## 性能指标

### 渲染性能

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **帧率** | ≥ 60 FPS | 流畅的用户体验 |
| **首屏加载** | < 3 秒 | 关键功能首屏时间 |
| **交互响应** | < 100ms | 用户操作响应时间 |
| **内存占用** | < 200MB/视口 | 单个视口内存占用 |

### 并发能力

- **支持视口数**: 10+ 个并发视口
- **加载数据**: 支持 GB 级影像数据加载
- **用户并发**: 支持 100+ 并发用户

---

## 学习路径

### 推荐学习顺序

1. **架构概述**（本文档）← 您在这里
2. [Monorepo 结构详解](monorepo-structure.md) - 了解项目组织
3. [核心包职责说明](core-packages.md) - 理解各个包的功能
4. [架构概念](architectural-concepts.md) - 掌握核心概念
5. [外部依赖说明](dependencies.md) - 了解技术栈

### 预计学习时间

| 阶段 | 时间 | 说明 |
|------|------|------|
| 架构文档阅读 | 2-3 小时 | 阅读 5 篇架构文档 |
| 实践练习 | 1-2 小时 | 通过示例巩固理解 |
| **总计** | **3-5 小时** | 完成架构理解 |

---

## 下一步

完成架构概述学习后，建议继续：

### 深入学习架构

- 📖 [Monorepo 结构详解](monorepo-structure.md) - 了解项目组织
- 📖 [核心包职责说明](core-packages.md) - 理解各个包的功能
- 📖 [架构概念](architectural-concepts.md) - 掌握核心概念

### 开始实践

- 🚀 [快速入门 - 项目初始化](../getting-started/project-setup.md) - 搭建第一个项目
- 🚀 [快速入门 - 第一个影像查看器](../getting-started/first-viewer.md) - 实践基础功能

### 探索高级功能

- 🔧 [高级功能 - 标注工具](../advanced/annotations.md) - 学习标注工具
- 🔧 [高级功能 - 3D 体渲染](../advanced/volume-rendering.md) - 探索 3D 渲染

---

## 总结

Cornerstone3D 是一个强大、现代的医学影像渲染框架，具有以下核心优势：

✅ **高性能** - WebGL 加速，60 FPS 流畅渲染
✅ **模块化** - 按需引入，灵活组合
✅ **标准兼容** - 遵循 DICOM 和 DICOMweb 标准
✅ **类型安全** - 完整的 TypeScript 支持
✅ **框架无关** - 支持所有现代前端框架
✅ **社区驱动** - 开源、活跃的社区支持

通过理解 Cornerstone3D 的架构和设计理念，您将能够构建出专业、高效的医学影像应用。

---

**准备好了吗？继续探索 Cornerstone3D 的架构细节吧！** 🚀

- 新手？从这里开始：[Monorepo 结构详解](monorepo-structure.md)
- 想快速上手？跳到：[快速入门](../getting-started/project-setup.md)
- 遇到问题？查看：[故障排查](../troubleshooting/common-errors.md)
