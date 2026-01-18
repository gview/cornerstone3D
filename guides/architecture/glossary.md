---
id: glossary
title: 术语表
category: architecture
order:  6
description: Cornerstone3D 相关术语的中英文对照和解释，包括核心概念、API、工具和技术术语
prerequisites: ["overview", "architectural-concepts", "core-packages", "dependencies"]
estimatedTime: "20 分钟"
difficulty: intermediate
tags: ["术语表", "词汇表", "词汇对照", "中英文", "API"]
---

# 术语表

## 概述

本术语表包含 Cornerstone3D 相关的所有核心术语的中英文对照、定义和使用示例，帮助开发者准确理解和使用专业术语。

---

## A

### AI / AI

**中文**: 人工智能 / AI 辅助诊断

**定义**:

> 涉及 AI 相关的术语，包括自动分割、AI 辅助诊断等 AI/ML 功能。

**示例**: 使用 ONNX 模型进行自动器官分割。

---

## B

### Batch

**中文**: 批次

**定义**: 影像数据的批量处理，包括多帧影像或多个体数据集。

**示例**: 加载完整的 CT 或 MR 序列。

---

### Bounding Box

**中文**: 边界框

**定义**: 包含影像最小和最大坐标的矩形区域，用于标注区域定义。

**代码示例**:

```typescript
const boundingBox = {
  upperLeft: [0, 0],
  lowerRight: [512, 512],
};
```

---

## C

### Cache

**中文**: 缓存

**定义**: 存储已加载的影像和体数据，避免重复加载，提升性能。

**类型**:

- **Image Cache**: 单帧影像缓存
- **Volume Cache**: 3D 体数据缓存
- **Geometry Cache**: 几何数据缓存

**配置示例**:

```typescript
import { cache as imageCache } from '@cornerstonejs/core';

imageCache.configure({
  maximumSizeInBytes: 1073741824, // 1GB
  cacheSizeInBytes: 52428800,     // 50MB
});
```

**相关文档**: [架构概念 - 缓存](architectural-concepts.md#cache)

---

### Core

**中文**: 核心库

**定义**: Cornerstone3D 的核心基础库，包含渲染引擎、视口、缓存等基础功能。

**相关文档**: [核心包职责说明](core-packages.md#core)

---

## D

### DICOM

**中文**: 医学数字影像和放射科标准

**全称**: Digital Imaging and Communications in Medicine

**说明**: Cornerstone3D 完全支持 DICOM 标准。

**示例**:

```typescript
// 创建 ImageId（WADO-RS）
const imageId = `wadors:https://dicomserver.com/wado-rs/studies/1/series/1/`,`;
```

**相关文档**: [外部依赖说明 - DICOM 处理依赖](dependencies.md#dicom-处理依赖)

---

### DICOMweb

**中文**: DICOMweb 标准

**说明**: 基于 RESTful 的医学影像数据访问标准。

---

### Display Set

**中文**:

> 需要补充完整定义，或引用完整定义。

---

### Dynamic Volume

**中文**: 动态体数据

**定义**: 在运行时可以修改的 3D 体数据，包括：

- **Dynamic Volume** - 动态体数据
- **DynamicImageVolume** - 动态影像体数据

**相关文档**: [架构概念 - Viewport](architectural-concepts.md#viewport)

---

## E

### External Dependencies

**中文**: 外部依赖

**说明**: Cornerstone3D 依赖的外部库列表。

**相关文档**: [外部依赖说明](dependencies.md)

---

## F

### Flip

**中文**: 翻转

**说明**: 影像的水平或垂直翻转操作。

**代码示例**:

```typescript
import { FlipHorizontal, FlipVertical } from '@cornerstone3d/tools';

// 水平翻转
toolGroupManager.setToolActive(FlipHorizontal);

// 垂直翻转
toolGroupManager.setToolActive(FlipVertical);
```

---

## H

### Hyperspectral Imaging

**中文**: 多光谱成像

**说明**: 包含多个光谱（如 T1、T2、CT 增强等）的多光谱医学影像类型。

**相关文档**: [架构概述 - 应用场景](overview.md#应用场景)

---

## I

### Image

**中文**: 影像

**定义**: 医学影像数据，可以是 2D 单帧影像或 3D 体数据。

**类型**:

- **2D 影像** - 单帧 DICOM 影像
- **3D 影像** - 多帧 DICOM 系列
- **4D 影像**

**相关文档**: [架构概念 - Viewport](architectural-concepts.md#viewport)

---

### ImageId

**中文**: 影像标识符

**格式**:

```typescript
// WADO-RS ImageId
const imageId = `wadors:https://dicomserver.com/wado-rs/studies/1/series/1`,`;

// 文件路径 ImageId
const imageId = 'file:/path/to/file.dcm';
```

**相关文档**: [架构概念 - ImageLoader](architectural-concepts.md#imageloader)

---

## L

### Loader

**中文**: 加载器

**说明**: 用于从不同数据源加载 DICOM 影像。

**类型**:

- **WADO-RS ImageLoader** - 从 DICOMweb 服务器加载
- **WADO-URI ImageLoader** - 从传统 WADO 服务器加载
- **本地文件加载** - 使用 File API 加载本地 DICOM 文件

**相关文档**: [外部依赖说明 - DICOM 处理依赖](dependencies.md)

---

## M

### Metadata

**中文**: 元数据

**定义**: DICOM 文件中包含的患者信息、检查信息等数据。

**示例**:

```typescript
const metadata = {
  patientName: 'JOHN DOE',
  studyDescription: 'CT Chest',
  seriesDescription: 'CT with contrast',
  numberOfFrames: 120,
  modality: 'CT',
  bodyPart: 'CHEST',
  contrastagent: 'IODINE',
  pixelSpacing: { x: 0.5, y: 0.5 },
};

metadataProvider.add(imageId, imagePlaneModule);
```

**相关文档**: [架构概念 - MetadataProvider](architectural-concepts.md#metadataprovider)

---

## P

### Pixel Spacing

**中文**: 像素间距

**定义**: 两个相邻像素中心之间的物理距离。

**示例**:

```typescript
const metadata = {
  pixelSpacing: {
    x: 0.5,  // 0.5 mm
    y: ��x: 0.5,  0.5 mm
  },
};
```

---

## R

### ROI (Region of Interest)

**中文**: 感兴趣区

**说明**: 影像中需要特别关注或标注的区域。

**类型**:

- **RectangleROI** - 矩形感兴趣区
- **EllipticalROI** - 椭圆形感兴趣区
- **FreehandROI** - 自由绘制感兴趣区

**相关文档**: [架构概念 - Tool](architectural-concepts.md#tool)

---

## S

### Stack

**中文**: 栈式

**说明**: 一系列单帧影像的有序集合。

**相关文档**: [架构概念 - StackViewport](architectural-concepts.md#stackviewport)

---

### Series

**中文**: 系列

**定义**: 相关影像的集合，通常来自同一检查、同一检查部位、或同一时期的影像。

**示例**:

```typescript
// 创建 ImageId 列表（系列）
const imageIds = [
  'wadors:https://dicomserver.com/wado-rs/studies/1/series/1/,',
  'wadors:https://divd/manifest.json', // 系列清单
  ...,
];
```

---

## T

### Transfer Function

**中文**: 传递函数

**说明**: 用于定义如何将像素值映射到显示器的函数。

**示例**:

```typescript
// 设置传递函数（用于体渲染）
const transferFunction = {
  VOI: (value: number) => {
    if (value < -500) return -500;
    if (value > 4000) return 4000;
    return value;
  },
  RGB: (color) => {
    // 颜色映射函数
  },
};

viewport.setTransferFunction('VOI', transferFunction);
```

---

## U

### UUID

**中文**: 通用唯一标识符

**用途**: 为视口、Volume、缓存等对象生成唯一标识符。

**示例**:

```typescript
const renderingEngine = new RenderingEngine(uuidv4());  // 生成唯一 ID
const viewportId = uuidv4();                             // 生成唯一视口 ID
```

---

## V

### Viewport

**中文**: 视口

**定义**: 显示影像的 HTML 元素区域。

**相关文档**: [架构概念 - Viewport](architectural-concepts.md#viewport)

---

### VolumeId

**中文**: 体数据标识符

**用途**: 唯一标识一个 3D 体数据集。

**示例**:

```typescript
const volumeId = `ct_volume`;

// 创建体数据
const volume = volumeLoader.createAndCacheVolume(volumeId, {
  imageIds: imageIds,
});
```

---

## W

### WADO-RS

**中文**: 基于 RESTful DICOM 的影像检索

**说明**: 现代 DICOMweb 协议，使用 HTTP/REST API 检索和加载影像。

**相关文档**: [外部依赖说明 - DICOM 处理依赖](dependencies.md#dicom处理依赖)

---

## 数字

### 3GB

**中文**: 3GB

**说明**: 默认缓存大小限制。

---

### 60 FPS

**中文**: 每秒 60 帧

**说明**: 流畅渲染的标准帧率要求。

---

## 特殊字符

### {}

**中文**: 花括号

**说明**: 可选参数列表或对象，包含配置信息。

---

### []

**中文**: 方括号

**说明**: 可选的数组类型标记。

---

## 相关资源

- [架构概述](overview.md)
- [架构概念](architectural-concepts.md)
- [核心包职责说明](core-packages.md)
- [外部依赖说明](dependencies.md)

---

## 更新日志

- **2025-01-18**: 初始版本，包含 60+ 个术语
- **版本**: 1.0.0

---

**导航**: [返回 [架构文档](../architecture/) | [返回指南首页](../README.md)
