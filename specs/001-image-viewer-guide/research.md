# Research: Cornerstone3D 影像浏览器开发指南

**Feature**: 001-image-viewer-guide
**Date**: 2025-01-18
**Status**: Phase 0 - Research Complete

## 研究概述

本研究旨在为 Cornerstone3D 影像浏览器开发指南确定最佳实践、技术选择和文档结构。基于对现有 Cornerstone3D 架构的深入分析，我们将创建一套完整的中文开发指南，帮助开发者快速上手并构建专业的医学影像应用。

---

## 研究主题 1: 文档结构最佳实践

### 决策

采用**分层递进式文档结构**，从概念到实践，由浅入深地引导开发者。

### 理由

1. **认知负荷理论**: 学习新框架时，开发者首先需要理解整体架构（"为什么"），然后学习基本操作（"怎么做"），最后深入高级功能（"还能做什么"）
2. **用户故事对齐**: 文档结构直接对应 spec.md 中的三个用户故事：
   - User Story 1 (P1): 项目架构理解 → 架构文档
   - User Story 2 (P2): 基础影像查看器搭建 → 快速入门
   - User Story 3 (P3): 高级功能集成 → 高级指南
3. **行业最佳实践**: 参考 React、Vue、Angular 等主流框架的文档结构，均采用概念+指南+API 的分层模式

### 考虑的替代方案

| 方案 | 描述 | 优点 | 缺点 | 决策 |
|------|------|------|------|------|
| 分层递进式 | 概念 → 快速开始 → 高级 → API | 学习曲线平滑，适合新手 | 需要多次跳转 | ✅ **采用** |
| 功能分类式 | 按功能模块组织（渲染、工具、加载等） | 信息集中，便于查阅 | 新手容易迷失 | ❌ 拒绝 |
| 任务导向式 | 按具体任务组织（"如何加载 DICOM"、"如何添加标注"） | 实用性强 | 缺乏系统性的架构理解 | ❌ 拒绝 |

### 最终文档结构

```text
guides/
├── README.md                           # 指南总入口和导航
├── architecture/                       # 架构文档（User Story 1）
│   ├── overview.md                     # Cornerstone3D 概述
│   ├── monorepo-structure.md           # Monorepo 结构详解
│   ├── core-packages.md                # 核心包职责说明
│   ├── architectural-concepts.md       # 架构概念（RenderingEngine、Viewport 等）
│   └── dependencies.md                 # 外部依赖说明
├── getting-started/                    # 快速入门（User Story 2）
│   ├── project-setup.md                # 项目初始化
│   ├── initialization.md               # Cornerstone3D 初始化
│   ├── first-viewer.md                 # 第一个影像查看器
│   └── basic-interactions.md           # 基本交互（缩放、平移、窗宽窗位）
├── advanced/                           # 高级指南（User Story 3）
│   ├── annotations.md                  # 标注工具
│   ├── measurements.md                 # 测量工具
│   ├── volume-rendering.md             # 3D 体渲染
│   ├── multi-viewport.md               # 多视口同步
│   ├── performance-optimization.md     # 性能优化
│   └── ai-integration.md               # AI 集成
├── examples/                           # 完整示例
│   ├── basic-viewer/                   # 基础查看器示例
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── src/
│   │   └── public/
│   └── advanced-viewer/                # 高级查看器示例
│       ├── README.md
│       ├── package.json
│       ├── src/
│       └── public/
└── troubleshooting/                    # 故障排查
    ├── common-errors.md                # 常见错误及解决方案
    └── debugging-tips.md               # 调试技巧
```

---

## 研究主题 2: 文档存储位置

### 决策

在**项目根目录创建 `guides/` 目录**，而不是集成到现有的 `packages/docs/` 中。

### 理由

1. **模块化原则**: 符合宪章 II 的模块化架构要求，指南作为独立模块存在
2. **维护便利性**: 与现有文档系统分离，避免干扰 API 文档的自动生成流程
3. **版本控制独立性**: 指南可以独立版本控制和发布
4. **清晰性**: 开发者能够明确区分"API 参考文档"（packages/docs）和"开发教程指南"（guides/）

### 考虑的替代方案

| 位置 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| `guides/`（根目录） | 独立、清晰、易维护 | 增加根目录层级 | ✅ **采用** |
| `packages/docs/docs/guides/` | 与现有文档系统集成 | 可能干扰 API 文档生成，路径过长 | ❌ 拒绝 |
| 独立仓库 | 完全独立，可独立发布 | 违反模块化原则，增加维护成本 | ❌ 拒绝（宪章 II） |

### 实现细节

- 在根目录创建 `guides/` 目录
- 更新根目录 `README.md`，添加指南链接
- 在 `packages/docs/docs/` 中添加交叉引用，链接到指南

---

## 研究主题 3: 代码示例框架选择

### 决策

使用 **Vite + React + TypeScript** 作为主要示例框架，同时提供**原生 JavaScript** 版本。

### 理由

1. **市场调研**: 2024年 JavaScript 框架使用率统计显示 React 占比约 40%，是最流行的前端框架
2. **Cornerstone3D 示例**: 现有 Cornerstone3D 官方示例主要使用 React，保持一致性
3. **开发体验**: Vite 提供极快的开发服务器启动和 HMR，符合性能目标（< 30 秒显示第一个影像）
4. **TypeScript 支持**: 符合宪章 III 的类型安全原则
5. **灵活性**: 提供 JavaScript 版本确保不使用框架的开发者也能受益

### 考虑的替代方案

| 框架 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| Vite + React + TypeScript | 快速、流行、类型安全 | 需要 Node.js 环境 | ✅ **主要示例** |
| Vite + Vue + TypeScript | 简单易学、中文文档好 | Cornerstone3D 官方支持少 | ⚠️ 未来考虑 |
| 原生 JavaScript | 无框架依赖、通用性强 | 代码冗长、类型安全差 | ✅ **辅助示例** |
| Web Components | 框架无关、标准化 | 复杂度高、社区小 | ❌ 拒绝 |

### 代码示例策略

- **主要示例**: 使用 Vite + React + TypeScript，展示最佳实践
- **最小示例**: 提供原生 JavaScript 版本，降低入门门槛
- **框架适配**: 提供 Vue 和 Angular 的关键代码片段，但不提供完整示例

---

## 研究主题 4: DICOM 数据源策略

### 决策

使用**多个公开的 DICOM 测试数据集**作为示例数据源，支持多种加载方式。

### 理由

1. **可访问性**: 公开数据集确保所有开发者都能运行示例，无需配置本地 PACS
2. **多样性**: 支持不同的 DICOM 加载方式（WADO-RS、本地文件、WADO-URI）
3. **真实性**: 使用真实医学影像数据，而非模拟数据，确保示例的实用性

### 推荐的数据源

| 数据源 | 类型 | 描述 | 用途 |
|--------|------|------|------|
| **Cornerstone Sample Data** | WADO-RS | 官方提供的公开 DICOM 服务器 | 主要示例 |
| **TCIA** | WADO-RS | 癌症影像档案馆（The Cancer Imaging Archive） | 高级示例、真实场景 |
| **本地 DICOM 文件** | File API | 开发者本地 DICOM 文件 | 离线场景、文件加载示例 |

### 数据加载方式

指南将涵盖以下加载方式：

1. **WADO-RS（推荐）**: 从 DICOMweb 服务器加载
2. **本地文件**: 使用 File API 加载本地 DICOM 文件
3. **WADO-URI**: 传统 WADO 协议（向后兼容）

---

## 研究主题 5: 文档格式和工具

### 决策

使用 **Markdown** 编写文档，配合 **代码高亮**、**Mermaid 图表** 和 **图片**。

### 理由

1. **通用性**: Markdown 是最轻量级、最广泛支持的文档格式
2. **GitHub 友好**: 直接在 GitHub 上渲染，便于预览和贡献
3. **工具支持**: 丰富的 Markdown 工具生态（代码高亮、图表生成、静态站点生成）
4. **版本控制**: 纯文本格式，Git 友好，易于 diff 和 merge

### 使用的工具和扩展

| 工具 | 用途 | 配置 |
|------|------|------|
| **Marked** 或 **markdown-it** | Markdown 解析 | 支持代码高亮、表格、任务列表 |
| **Mermaid.js** | 架构图、流程图 | 渲染架构概念图、数据流图 |
| **Prism.js** 或 **Shiki** | 代码高亮 | TypeScript、JavaScript 语法高亮 |
| **VitePress** 或 **Docusaurus** | 静态站点生成（可选） | 未来考虑，用于生成独立的文档站点 |

### 文档编写规范

遵循以下规范以确保文档质量：

1. **中文优先**: 所有文档使用中文编写（宪章 I）
2. **技术术语**: 英文术语首次出现时提供中文解释，后续可直接使用英文
3. **代码注释**: 所有代码示例包含中文注释，解释关键步骤
4. **结构清晰**: 使用清晰的标题层级、列表和表格
5. **交叉引用**: 使用相对链接链接到相关文档

---

## 研究主题 6: 示例代码组织

### 决策

每个示例作为**独立的子目录**，包含完整的可运行项目。

### 理由

1. **自包含**: 每个示例都可以独立运行和测试
2. **清晰性**: 开发者能够清楚看到示例的完整结构
3. **可复制性**: 开发者可以直接复制示例目录作为项目起点

### 示例目录结构

```text
guides/examples/basic-viewer/
├── README.md           # 示例说明、运行步骤、预期结果
├── package.json        # 依赖和脚本
├── vite.config.ts      # Vite 配置
├── tsconfig.json       # TypeScript 配置
├── index.html          # HTML 入口
├── src/
│   ├── main.tsx        # 应用入口
│   ├── App.tsx         # 主组件
│   ├── cornerstone/    # Cornerstone3D 初始化和配置
│   │   ├── init.ts
│   │   ├── viewport.ts
│   │   └── tools.ts
│   └── types/          # 类型定义
│       └── index.d.ts
└── public/
    └── dicom/          # 示例 DICOM 文件（可选，小文件）
```

### 示例命名规范

- `basic-viewer`: 基础影像查看器（单个 StackViewport）
- `volume-viewer`: 3D 体渲染查看器（VolumeViewport）
- `annotation-tools`: 标注工具示例
- `multi-viewport`: 多视口联动示例
- `ai-segmentation`: AI 辅助分割示例

---

## 研究主题 7: 性能优化策略

### 决策

在文档中包含**专门的性能优化章节**，涵盖缓存、懒加载、Web Worker 等。

### 理由

1. **宪章要求**: 符合宪章 V 的性能优先原则
2. **用户需求**: 医学影像应用通常处理大型数据集，性能至关重要
3. **最佳实践**: 传递正确的性能优化理念和实践

### 性能优化主题

| 主题 | 关键点 | 对应的宪章原则 |
|------|--------|----------------|
| **缓存配置** | imageCache、volumeCache 的大小和策略 | V. 性能优先 |
| **懒加载** | 按需加载影像数据，避免一次性加载过多 | V. 性能优先 |
| **Web Worker** | 使用 Web Worker 处理计算密集型任务 | V. 性能优先 |
| **内存管理** | 及时清理资源，避免内存泄漏 | V. 性能优先 |
| **渲染优化** | 减少 re-render，使用 requestAnimationFrame | V. 性能优先 |
| **网络优化** | 使用 DICOMweb 的批量查询、分页加载 | V. 性能优先 |

---

## 研究主题 8: 文档质量保证

### 决策

建立**文档质量检查清单**，确保所有文档符合标准。

### 理由

1. **宪章要求**: 符合宪章 VI 的文档质量原则
2. **用户价值**: 高质量文档提升学习体验和开发效率
3. **可维护性**: 明确的质量标准便于长期维护

### 文档质量检查清单

每份文档在发布前必须通过以下检查：

- [ ] 中文编写，语言流畅、专业
- [ ] 技术术语首次出现时提供中文解释
- [ ] 代码示例包含完整的中文注释
- [ ] 代码示例可以直接运行或仅需最小修改
- [ ] 包含目录结构和交叉引用
- [ ] 包含预期结果和验证步骤
- [ ] 包含常见错误和解决方案
- [ ] 链接有效，无死链
- [ ] 代码格式化，符合 Prettier 规范
- [ ] TypeScript 代码通过类型检查

---

## 研究主题 9: 文档发布和分发

### 决策

文档存储在 GitHub 仓库中，通过以下方式分发：

1. **GitHub 上直接阅读**: 开发者可以直接在 GitHub 上浏览文档
2. **Cornerstone3D 官方网站**: 考虑未来将指南集成到官方网站（cornerstonejs.org）
3. **npm 包**: 考虑将指南作为独立的 npm 包发布，便于离线阅读

### 理由

1. **简单性**: GitHub 是最直接的分发方式，无需额外基础设施
2. **可访问性**: 任何有网络的人都可以访问
3. **版本控制**: 文档版本与应用版本同步
4. **灵活性**: 未来可以轻松添加其他分发方式

---

## 研究主题 10: 文档维护策略

### 决策

建立**文档维护流程**，确保文档与代码同步更新。

### 理由

1. **宪章要求**: 符合宪章 VI 的"文档同步"原则
2. **准确性**: 文档必须准确反映当前的 API 和最佳实践
3. **可持续性**: 明确的维护流程确保文档长期有效

### 维护流程

1. **代码变更时**:
   - 如果 API 变更影响示例代码，同步更新文档
   - 在 PR 描述中说明是否需要文档更新

2. **定期审查**:
   - 每季度审查一次文档，检查准确性
   - 根据用户反馈更新文档

3. **版本管理**:
   - 文档版本与 Cornerstone3D 版本同步
   - 重大版本更新时，更新文档中的版本号和兼容性说明

---

## 研究总结

### 关键决策

1. **文档结构**: 分层递进式（架构 → 快速开始 → 高级）
2. **存储位置**: 根目录 `guides/`
3. **示例框架**: Vite + React + TypeScript（主要）+ 原生 JavaScript（辅助）
4. **数据源**: 公开 DICOM 数据集（Cornerstone Sample Data、TCIA）
5. **文档格式**: Markdown + 代码高亮 + Mermaid 图表
6. **示例组织**: 独立的可运行项目
7. **性能优化**: 专门的性能优化章节
8. **质量保证**: 文档质量检查清单
9. **分发方式**: GitHub + 官方网站（未来）+ npm（未来）
10. **维护流程**: 代码变更时同步更新，定期审查

### 下一步

Phase 0 研究已完成，所有技术决策已确定。下一步是 Phase 1：设计和契约，包括：

1. **data-model.md**: 定义文档的数据模型（章节、段落、代码块）
2. **contracts/**: 定义文档结构契约（YAML 格式）
3. **quickstart.md**: 创建快速开始指南，帮助开发者快速上手

---

---

## 研究主题 11: MPR（多平面重建）实现方案

### 决策

使用 **Cornerstone3D 的 VolumeViewport + 自定义定位线** 实现 MPR 功能，作为高级用例添加到开发指南中。

### 理由

1. **临床需求**: MPR 是放射科诊断的标准工具，允许从三个正交平面观察解剖结构
2. **技术可行性**: Cornerstone3D 的 VolumeViewport 完全支持 MPR 所需的功能
3. **教育价值**: MPR 实现展示了 Cornerstone3D 的高级能力，提升指南的完整性
4. **用户反馈**: 开发者社区对 MPR 实现有强烈需求

### MPR 核心功能分解

| 功能 | 技术方案 | 复杂度 |
|------|----------|--------|
| **三个正交视图** | 三个 VolumeViewport，分别设置为 AXIAL、SAGITTAL、CORONAL | 中等 |
| **定位线绘制** | SVG 叠加层，基于当前相机位置计算交叉线 | 高 |
| **联动导航** | 事件监听 + 相机同步更新 | 中等 |
| **层厚调节** | Viewport.setProperties({ slabThickness, slabMode }) | 低 |
| **斜位 MPR** | 修改相机方向矩阵（gl-matrix） | 高 |
| **测量工具** | 使用 @cornerstonejs/tools 的测量工具 | 低 |

### 技术决策细节

#### 11.1 Viewport 选择

**决策**: 使用 VolumeViewport（而非 StackViewport）

**理由**:
- VolumeViewport 原生支持体数据和切面显示
- 性能更好（共享体数据缓存）
- 支持动态切面和相机旋转
- 适合大型 3D 数据集（512x512x300+ 切片）

**代码结构**:
```typescript
const viewportInputs = [
  { viewportId: 'AXIAL', element: axialElement, type: ViewportType.ORTHOGRAPHIC, defaultView: ViewportInputType.AXIAL },
  { viewportId: 'SAGITTAL', element: sagittalElement, type: ViewportType.ORTHOGRAPHIC, defaultView: ViewportInputType.SAGITTAL },
  { viewportId: 'CORONAL', element: coronalElement, type: ViewportType.ORTHOGRAPHIC, defaultView: ViewportInputType.CORONAL }
];
```

#### 11.2 定位线实现方案

**决策**: 使用 SVG 叠加层绘制定位线

**技术细节**:
1. **坐标转换流程**:
   ```
   世界坐标 → 图像坐标 → 屏幕坐标 → SVG 坐标
   ```

2. **更新触发时机**:
   - 监听 `IMAGE_RENDERED` 事件
   - 监听相机变化事件
   - 监听切片导航事件

3. **性能优化**:
   - 使用 `requestAnimationFrame` 批量更新
   - 缓存坐标转换结果
   - 仅在必要时重绘 SVG

**实现示例**:
```typescript
function updateReferenceLines(activeViewport: IViewport, otherViewports: IViewport[]) {
  const camera = activeViewport.getCamera();
  const focalPoint = camera.focalPoint;

  otherViewports.forEach(viewport => {
    const svgLayer = getSvgLayer(viewport.element);
    const linePoints = calculateReferenceLinePoints(focalPoint, viewport);
    drawSvgLines(svgLayer, linePoints);
  });
}
```

#### 11.3 联动导航实现

**决策**: 使用事件驱动的视图同步机制

**工作流程**:
1. 用户在视口 A 中点击/拖动
2. 触发 `IMAGE_RENDERED` 事件
3. 提取视口 A 的相机位置
4. 计算视口 B 和 C 应该显示的切片
5. 更新视口 B 和 C 的相机
6. 触发定位线更新

**代码示例**:
```typescript
axialElement.addEventListener(EVENTS.IMAGE_RENDERED, () => {
  const camera = axialViewport.getCamera();
  const { focalPoint } = camera;

  // 同步到冠状位和矢状位
  coronalViewport.setCamera({ focalPoint });
  sagittalViewport.setCamera({ focalPoint });

  // 更新定位线
  updateReferenceLines(axialViewport, [coronalViewport, sagittalViewport]);
});
```

#### 11.4 层厚调节

**决策**: 使用 VolumeViewport 内置的 Slab Thickness 功能

**支持的投影模式**:
| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `SlabMode.MAX` | 最大强度投影（MIP） | 血管成像、CT 血管造影 |
| `SlabMode.MIN` | 最小强度投影（MinIP） | 气管显示、肺部成像 |
| `SlabMode.AVERAGE` | 平均投影 | 噪声降低、平滑显示 |

**实现代码**:
```typescript
// 设置层厚为 5mm
viewport.setProperties({
  slabThickness: 5,
  slabMode: SlabMode.MAX
});
```

#### 11.5 斜位 MPR

**决策**: 使用 gl-matrix 库修改相机方向

**实现步骤**:
1. 获取当前相机的 viewMatrix
2. 创建旋转矩阵
3. 应用旋转到 viewMatrix
4. 更新相机

**代码示例**:
```typescript
import { mat4 } from 'gl-matrix';

function rotateViewport(viewport: IViewport, angle: number, axis: vec3) {
  const camera = viewport.getCamera();
  const rotationMatrix = mat4.create();
  mat4.rotate(rotationMatrix, rotationMatrix, angle, axis);

  mat4.multiply(camera.viewMatrix, rotationMatrix, camera.viewMatrix);
  viewport.setCamera(camera);
}
```

### MPR 性能优化策略

| 优化点 | 方法 | 预期效果 |
|--------|------|----------|
| **数据共享** | 三个视口共享同一个 Volume 对象 | 减少内存占用 60%+ |
| **渲染优化** | 使用 `requestAnimationFrame` 批量更新 | 提升帧率到 60fps |
| **定位线缓存** | 缓存 SVG 元素，仅更新坐标 | 减少重绘开销 40% |
| **懒加载** | 按需加载 Volume 切片 | 减少初始加载时间 50% |
| **Web Worker** | 在 Worker 中进行坐标计算 | 避免阻塞主线程 |

### MPR 边缘情况处理

| 边缘情况 | 处理方案 |
|----------|----------|
| **缺失方向元数据** | 假设标准轴向方向，提供警告 |
| **切片间距不一致** | 使用平均间距或插值处理 |
| **大数据集（1000+ 切片）** | 使用分块加载和虚拟化 |
| **超出边界导航** | 限制切片索引范围，提供视觉反馈 |
| **WebGL 不支持** | 降级到 StackViewport 或显示错误消息 |

### MPR 示例代码结构

```text
guides/examples/mpr-viewer/
├── README.md                    # MPR 示例说明
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── MPRViewer.tsx            # 主组件，管理三个视口
│   ├── components/
│   │   ├── AxialViewport.tsx    # 横断位视图组件
│   │   ├── SagittalViewport.tsx # 矢状位视图组件
│   │   ├── CoronalViewport.tsx  # 冠状位视图组件
│   │   └── ReferenceLines.tsx   # 定位线组件
│   ├── hooks/
│   │   ├── useMPRSynchronization.ts  # 联动同步 Hook
│   │   ├── useSlabThickness.ts       # 层厚调节 Hook
│   │   └── useObliqueRotation.ts     # 斜位旋转 Hook
│   └── utils/
│       ├── coordinateTransform.ts    # 坐标转换工具
│       └── referenceLineCalculation.ts # 定位线计算
└── public/
    └── dicom/                    # 示例 DICOM 数据
```

### MPR 文档章节结构

在 `guides/advanced/mpr-viewer.md` 中包含以下内容：

1. **概述**: MPR 的概念、应用场景、技术要求
2. **准备工作**: Volume 数据加载、Viewport 配置
3. **基础实现**: 三个正交视图的创建和显示
4. **定位线**: 定位线的绘制和更新机制
5. **联动导航**: 视图间同步的实现方法
6. **高级功能**:
   - 层厚调节
   - 斜位 MPR
   - 测量工具集成
   - 窗宽窗位同步
7. **性能优化**: 针对 MPR 的优化策略
8. **常见问题**: 边缘情况处理、调试技巧

### 验收标准

MPR 功能应满足以下标准：

1. **性能**: 标准 CT 数据集（512x512x300）保持 60fps
2. **准确性**: 定位线位置误差 < 2mm
3. **响应性**: 切片导航响应时间 < 100ms
4. **兼容性**: 支持主流浏览器的 WebGL 2.0
5. **完整性**: 包含所有核心功能（三视图、定位线、联动、测量）

---

## 参考资源

- **Cornerstone3D 官方文档**: https://www.cornerstonejs.org/
- **Cornerstone3D GitHub**: https://github.com/cornerstonejs/cornerstone3D
- **DICOM 标准**: https://www.dicomstandard.org/
- **React 文档**: https://react.dev/
- **TypeScript 文档**: https://www.typescriptlang.org/docs/
- **Vite 文档**: https://vitejs.dev/
- **医学影像开源项目**: OHIF Viewer, MedDream
- **gl-matrix 文档**: https://glmatrix.net/docs/
- **医学影像 MPR 论文**: Multi-Planar Reconstruction in Medical Imaging
