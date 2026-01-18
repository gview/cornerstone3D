---
id: dependencies
title: 外部依赖说明
category: architecture
order: 5
description: 了解 Cornerstone3D 的外部依赖、技术栈和版本要求
prerequisites: ["overview", "architectural-concepts"]
estimatedTime: "15 分钟"
difficulty: intermediate
tags: ["依赖", "技术栈", "版本要求", "第三方库"]
---

# 外部依赖说明

## 概述

Cornerstone3D 依赖于多个外部库来实现其功能。本文档详细列出所有关键的外部依赖，包括技术栈、版本要求、用途和使用示例。

---

## 核心技术栈

### 主要技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **TypeScript** | 5.5+ | 类型安全开发 | 所有代码必须使用 TypeScript 编写 |
| **WebGL** | 2.0+ | GPU 加速渲染 | 必须支持 WebGL 2.0 的浏览器 |
| **WebAssembly** | 基础版 | 快速解压缩 | 用于影像解压缩和计算密集型任务 |
| **Yarn** | 1.22+ | 包管理器 | 使用 Yarn Workspaces 管理 Monorepo |

---

## 核心依赖库

### 1. VTK.js

**版本**: 34.15.1

**用途**: 3D 可视化和体渲染

**功能**:
- 3D 体渲染引擎
- 渲染管线
- 支持多种渲染模式（MPR、VR、CT）

**使用场景**: 体渲染、3D 重建、高级可视化

**GitHub**: [VTK.js GitHub](https://github.com/kitware/vtk.js)

---

### 2. dicom-parser

**版本**: 1.8.21

**用途**: DICOM 文件解析

**功能**:
- 解析 DICOM 文件格式
- 提供元数据接口

**使用场景**: 所有 DICOM 影像都需要先解析

**NPM**: [dicom-parser NPM](https://www.npmjs.com/package/dicom-parser)

---

### 3. gl-matrix

**版本**: 3.4.3

**用途**: 矩阵运算

**功能**:
- 3D 矩阵运算
- 向量运算
- 坐标变换

**使用场景**: 视口变换、影像配准、姿态调整

**NPM**: [gl-matrix NPM](https://www.npmjs.com/package/gl-matrix)

---

### 4. comlink

**版本**: 4.4.2

**用途**: Web Worker 通信

**功能**:
- Web Worker 内部通信
- RPC 机制

**使用场景**: 影像解压缩、后台计算

**NPM**: [comlink NPM](https://www.npmjs.com/package/comlink)

---

### 5. pako

**版本**: 最新版本

**用途**: Zlib 解压缩（用于 JPEG 压缩）

**功能**-**: GZIP 解压缩（用于部分 DICOM 文件）

---

## DICOM 处理依赖

### 1. dcmjs

**版本**: 0.45.0

**用途**: DICOM JSON 标准支持

**功能**:
- DICOM 到 JSON 的转换
- 标准化元数据模型

**GitHub**: [dcmjs GitHub](https://github.com/dcmjs/dcmjs)

---

### 2. Codec 库

Cornerstone3D 使用多个 Codec 库处理不同的压缩格式：

#### JPEG Codec

- **@cornerstonejs/codec-charls** - JPEG-LS 压缩
- **@cornerstonejs/codec-libjpeg-turbo-8bit** - JPEG 8-bit 压缩
- **@cornerstonejs/codec-openjpeg** - JPEG 2000 压缩
- **@cornerstonejs/codec-openjph** - JPEG 2020+ 压缩

#### WebAssembly Codec

- **@cornerstonejs/codec-wado-rs** - WADO-RS 流式加载

---

## 开发依赖

### 1. 构建工具

#### Webpack 5

**版本**: 5.81.0

**用途**: 打包和构建工具

**使用**: 打包和发布各个包

#### Rollup

**版本**: 3.29.5

**用途**: 打包核心库和工具

---

### 2. 测试框架

#### Karma

**用途**: 浏览器单元测试

**用途**: 浏览器环境测试

#### Playwright

**版本**: 1.56.1

**用途**: 端到端测试

---

### 3. 类型检查

#### TypeScript 5.5+ - 类型检查

**用途**: 编译时类型检查

```bash
tsc --noEmit
```

---

## 运行时环境

### 浏览器支持

**必须支持 WebGL 2.0**:

- ✅ Chrome 88+
- ✅ Firefox 78+
- ✅ Safari 11+ (macOS Big Sur+)
- ✅ **不支持 IE11 以下**

### Node.js 环境

**必须版本**:

- **Node.js** 20+
- **Yarn** 1.22+

---

## 版本要求

### 依赖版本控制策略

Cornerstone3D 使用语义化版本控制：

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 新增功能，兼容现有 API
- **PATCH**: Bug 修复、文档更新

---

## 版本兼容性

### 依赖版本兼容性矩阵

| 依赖包 | 版本要求 | 向后兼容性 |
|---------|----------|-------------|
| **@cornerstonejs/core** | >= 1.0.0 | ⚠️ 破坏性 API 变更时会更新 MAJOR 版本 |
| **@cornerstonejs/tools** | >= 1.0.0 | ⚠️ 需要与 core 包版本兼容 |
| **@cornerstonejs/dicom-image-loader** | >= 1. 版本号与 core 保持同步 | ⚠️ 需要与 core 包版本同步 |
| **@cornerstonejs/adapters** | >= 1.0.0 | 需要与 tools 包版本兼容 |
| **@cornerstonejs/ai** | >= 1.0.0 | 需要与 core 和 tools 包版本兼容 |

---

## 安装和使用

### 基础安装

```bash
# 安装核心包
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader
```

### AI 功能安装

```bash
# 添加 AI 功能
yarn add @cornerstonejs/ai
```

### 开发依赖

```bash
# 安装开发依赖
yarn add -D typescript @types/node @types/react

# 安装开发工具
yarn add -D webpack vite jest
```

---

## 最佳实践

### 1. 版本锁定

使用 package.json 锁定版本：

```json
{
  "dependencies": {
    "@cornerstonejs/core": "^1.0.0",
    "@cornerstonejs/tools": "^1.0.0",
    "@cornerstonejs/dicom-image-loader": "^1.0.0"
  }
}
```

### 2. 按需引入

```typescript
// 只导入需要的功能
import { RenderingEngine } from '@cornerstonejs/core';
import { ZoomTool } from '@cornerstonejs/tools';
```

### 3. 版本升级策略

```bash
# 检查可更新包
yarn upgrade
yarn upgrade @cornerstonejs/core

# 更新所有包
yarn upgrade
```

---

## 常见问题

### Q: 如何查看已安装的版本？

**A**:

```bash
yarn list --pattern @cornerstonejs/*
```

### Q: 依赖冲突怎么办？

**A**:

```bash
# 清理缓存
yarn clean

# 刷新依赖
yarn install
```

### Q: TypeScript 版本冲突？

**A**: 确保 tsconfig.json 中 TypeScript 版本与项目要求一致（5.5+）

---

## 相关资源

- [架构概述](overview.md)
- [架构概念](architectural-concepts.md)
- [核心包职责说明](core-packages.md)
- [术语表](glossary.md)

---

**下一步**: 了解 [术语表](glossary.md) 或返回 [架构首页](../architecture/)
