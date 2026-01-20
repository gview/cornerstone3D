# 实现计划：Cornerstone3D 影像浏览器开发指南（含 MPR 高级用例）

**分支**: `001-image-viewer-guide` | **日期**: 2026-01-19 | **规格**: [spec.md](spec.md)
**输入**: 来自 `/specs/001-image-viewer-guide/spec.md` 的功能规格说明

**注意**: 本文档由 `/speckit.plan` 命令生成。参见 `.specify/templates/commands/plan.md` 了解执行工作流。

## 摘要

本功能为 Cornerstone3D 项目创建全面的中文开发指南，帮助开发者从零开始构建医疗影像浏览器应用，包括基础功能和高级 MPR（多平面重建）功能。

**核心需求**：
1. **架构文档**：清晰说明 Cornerstone3D 的 monorepo 结构、核心包职责和架构概念
2. **开发步骤指南**：提供从项目初始化到基础查看器搭建的完整步骤
3. **高级功能集成指南**：包括标注工具、测量工具、AI 集成
4. **MPR 实现指南**（新增）：详细说明如何实现完整的 MPR 查看器

**技术方法**：
- 基于现有的 Cornerstone3D 源代码进行架构分析和文档整理
- 创建可运行的示例代码，涵盖从基础到高级的所有功能
- 提供中文文档和代码注释，降低中文开发者学习门槛
- 使用 TypeScript 编写示例，提供 JavaScript 适配说明

## Technical Context

**语言/版本**: TypeScript 5.5+
**主要依赖**:
- `@cornerstonejs/core`: 核心渲染引擎和视口管理
- `@cornerstonejs/tools`: 交互工具库（标注、测量、分割）
- `@cornerstonejs/dicom-image-loader`: DICOM 影像加载器
- `@cornerstonejs/adapters`: 适配器库
- `@cornerstonejs/ai`: AI/ML 集成库
- VTK.js: 3D 体数据渲染
- dicom-parser: DICOM 文件解析
- gl-matrix: 矩阵运算

**存储**: N/A（客户端应用，数据来源于 DICOM 文件或 PACS 服务器）
**测试**:
- Jest: Node.js 单元测试
- Karma: 浏览器单元测试
- Playwright: E2E 测试

**目标平台**: 现代 Web 浏览器（Chrome、Firefox、Safari、Edge 最新版本），支持 WebGL 2.0
**项目类型**: 文档 + 示例代码（Guides + Examples）
**性能目标**:
- 影像渲染帧率: ≥60 FPS
- 首屏加载时间: ≤3 秒
- MPR 切片导航响应: ≤100ms
- MPR 数据集加载: 标准 CT (512x512x300) 保持 60fps

**约束**:
- 所有文档必须使用中文编写（技术术语保留英文）
- 代码示例必须有完整的中文注释
- 类型覆盖率必须达到 100%
- 单个视口内存占用 ≤200MB
- 支持 10+ 并发视口

**范围/规模**:
- 文档章节: 8-10 个主要章节
- 示例代码: 5-7 个完整可运行示例
- 覆盖包数量: 5+ 核心包
- API 文档覆盖: ≥95%

## Constitution Check

*质量门控：Phase 0 研究前必须通过。Phase 1 设计后重新检查。*

### 原则合规性检查

✅ **I. 中文优先**
- 所有文档使用中文编写
- 代码注释使用中文
- 技术术语保留英文并提供中文解释

✅ **II. 模块化架构**
- 文档按包和功能模块组织
- 每个包的职责清晰说明
- 依赖关系单向流动说明

✅ **III. 类型安全**
- 示例代码使用 TypeScript strict 模式
- 提供完整的类型定义示例
- 所有公共 API 都有类型文档

✅ **IV. 测试覆盖**
- 提供测试指南和最佳实践
- 示例代码包含测试用例
- 关键用户流程有 E2E 测试示例

✅ **V. 性能优先**
- 文档包含性能优化建议
- MPR 实现考虑 60fps 目标
- 提供缓存、懒加载等优化策略

✅ **VI. 文档质量**
- 所有公共 API 有 JSDoc/TSDoc 注释
- 提供详细的使用指南
- 包含可运行的示例代码

### 技术标准合规性

✅ **语言与框架**: TypeScript 5.5+, Node.js 20+, 现代浏览器
✅ **代码规范**: Prettier, oxlint, Conventional Commits
✅ **性能标准**:
  - 渲染帧率: ≥60 FPS ✓
  - 首屏加载: ≤3 秒 ✓
  - 内存占用: ≤200MB ✓
  - 并发支持: ≥10 视口 ✓

**结论**: 所有宪章要求已满足，可以继续 Phase 0。

## Project Structure

### Documentation（本功能）

```text
specs/001-image-viewer-guide/
├── plan.md              # 本文件（/speckit.plan 命令输出）
├── research.md          # Phase 0 输出（技术调研和决策）
├── data-model.md        # Phase 1 输出（核心实体和数据流）
├── quickstart.md        # Phase 1 输出（快速入门指南）
├── contracts/           # Phase 1 输出（API 契约和接口定义）
└── tasks.md             # Phase 2 输出（/speckit.tasks 命令生成）
```

### Source Code（仓库根目录）

```text
# Cornerstone3D 使用 monorepo 结构
packages/
├── core/                    # 核心渲染引擎、视口管理、缓存
│   ├── src/
│   │   ├── renderingEngine/
│   │   ├── viewport/
│   │   ├── cache/
│   │   └── enums/
│   └── types/
├── tools/                   # 交互工具库
│   ├── src/
│   │   ├── annotation/      # 标注工具（RectangleROI, EllipticalROI）
│   │   ├── measurement/     # 测量工具（长度、角度）
│   │   ├── manipulation/    # 交互工具（缩放、平移、窗宽窗位）
│   │   └── segmentation/    # 分割工具
│   └── types/
├── dicomImageLoader/        # DICOM 影像加载器
│   ├── src/
│   │   ├── loaders/
│   │   ├── cache/
│   │   └── metadata/
│   └── types/
├── adapters/                # 适配器库
│   └── src/
├── ai/                      # AI/ML 集成库
│   └── src/
│       ├── models/
│       └── inference/
└── ...

# 文档输出目录
guides/
├── architecture/            # 架构文档
│   ├── monorepo-structure.md
│   ├── core-packages.md
│   └── concepts.md
├── getting-started/         # 入门指南
│   ├── project-setup.md
│   ├── initialization.md
│   └── basic-viewer.md
├── advanced/                # 高级功能指南
│   ├── annotations.md
│   ├── measurements.md
│   ├── volume-rendering.md
│   ├── ai-integration.md
│   └── mpr-viewer.md        # MPR 实现指南
├── troubleshooting/         # 故障排除
│   └── common-pitfalls.md
└── examples/                # 示例代码
    ├── basic-viewer/        # 基础查看器示例
    ├── advanced-viewer/     # 高级功能示例
    └── mpr-viewer/          # MPR 查看器示例
```

**结构决策**:
1. 使用 **monorepo 结构**：文档与源代码分离，位于 `guides/` 和 `guides/examples/` 目录
2. 文档按 **功能模块组织**：架构 → 入门 → 高级 → 故障排除，符合学习曲线
3. 示例代码 **独立运行**：每个示例都是完整可运行的项目，便于学习和测试
4. 支持 **渐进式学习**：从基础到高级（MPR），开发者可以按需选择

## Complexity Tracking

> **仅在 Constitution Check 有必须论证的违规时填写**

本功能无违规项，无需填写。

## Phase 0: 研究与技术调研

### 研究任务

1. **Cornerstone3D 架构分析**
   - 任务：分析 monorepo 结构、包依赖关系、核心架构模式
   - 输出：架构概念、包职责图、依赖关系图

2. **Viewport 类型和使用场景**
   - 任务：研究 StackViewport、VolumeViewport、VolumeViewport3D 的区别和适用场景
   - 输出：Viewport 选择指南、配置示例

3. **ImageLoader 机制**
   - 任务：研究影像加载流程、缓存机制、元数据提供
   - 输出：数据流图、加载流程图

4. **工具系统架构**
   - 任务：研究工具注册、状态管理、事件系统
   - 输出：工具集成指南、自定义工具开发

5. **MPR 实现技术调研**
   - 任务：研究如何在 Cornerstone3D 中实现 MPR 功能
     - 三个正交视图的创建和配置
     - 定位线的绘制和更新机制
     - 联动导航的实现方式
     - 层厚调节的实现方法
     - 斜位 MPR 的配置
   - 输出：MPR 技术方案、实现步骤、性能优化建议

6. **性能优化最佳实践**
   - 任务：研究缓存配置、懒加载、Web Worker 使用
   - 输出：性能优化清单、基准测试方法

### 输出文件

**Phase 0 输出**: `research.md` - 包含所有技术决策和最佳实践

### 关键技术决策

#### MPR 实现技术栈
- **视图创建**: 使用 `ViewportType.ORTHOGRAPHIC` 和 `ViewportInputType` (AXIAL/SAGITTAL/CORONAL)
- **数据共享**: 三个视口共享同一个 Volume 对象，通过 `volumeId` 引用
- **定位线渲染**: 使用 SVG 叠加层实时绘制，坐标转换使用 `camera.position` 和 `focalPoint`
- **联动同步**: 监听 `EVENTS.CAMERA_MODIFIED` 事件，更新其他视图的相机位置
- **层厚调节**: 使用 `viewport.setProperties({ slabThickness, slabMode })`

#### 测量面板实现（新增）
- **组件架构**: `AnnotationsPanel` React 组件，接收 `renderingEngine` 和 `viewportIds` props
- **事件监听**: 使用 `eventTarget.addEventListener` 监听 `ANNOTATION_ADDED/REMOVED/MODIFIED` 事件
  - ⚠️ 关键：必须使用 `eventTarget` 而不是 `document`
- **状态管理**: 使用 React `useState` 存储测量列表，`useCallback` 优化函数引用
- **过滤逻辑**: 排除 `Crosshairs` 和 `ScaleOverlay` 工具，只显示真正的测量工具
- **可见性控制**: 使用 `annotation.visibility.setAnnotationVisibility()`
- **删除功能**: 使用 `annotation.state.removeAnnotation()`

#### 工具模式实现（新增）
- **模式类型**: `ToolModes.Active` | `ToolModes.Passive` | `ToolModes.Enabled` | `ToolModes.Disabled`
- **状态管理**: 使用 React `useState` 维护每个工具的当前模式
- **单一 Active 约束**: 切换到 Active 模式时，将其他 Active 工具设为 Passive，保留其他状态
- **动态切换**: 使用 `toolGroup[\`setTool${mode}\`]` 动态调用方法
- **UI 反馈**: 下拉选择器显示当前工具模式，工具栏显示激活状态

#### 比例尺集成（新增）
- **工具**: `ScaleOverlayTool` 提供比例尺显示
- **位置控制**: `viewport.setProperties({ scaleLocation: 'top' | 'bottom' | 'left' | 'right' })`
- **显示控制**: 通过 `ToolGroupManager` 的工具模式控制（Enabled/Disabled）
- **全局同步**: 比例尺设置应用到所有三个视口

#### 序列面板实现（新增）
- **组件架构**: `SeriesPanel` React 组件，显示所有加载的 DICOM 序列
- **数据结构**: `SeriesInfo` 接口包含序列实例 UID、序列号、序列描述、模态、图像数量等
- **按检查分组**: `StudyInfo` 接口将序列按检查（Study）分组，包含患者信息和检查日期
- **缩略图显示**: 根据模态类型（CT/MR/US/XR/PT）使用不同颜色的默认缩略图
- **序列切换**: 双击序列卡片触发 `onLoadSeries` 回调，主应用更新 `imageIds` 并重新加载体积
- **状态管理**: 使用 `isCollapsed` 控制面板展开/收缩，节省屏幕空间

#### 视口四角信息显示（新增）
- **组件架构**: `ViewportOverlay` React 组件，为每个视口添加信息叠加层
- **信息类型**: 左上（视图名称）、右上（切片号/总切片数）、左下（坐标值）、右下（窗宽/窗位）
- **坐标转换**: 从相机 `focalPoint` 获取 DICOM 患者坐标系坐标
- **实时更新**: 监听 `EVENTS.CAMERA_MODIFIED` 事件，实时更新叠加层信息
- **布局定位**: 使用绝对定位将信息放置在视口的四个角落

#### 可拖拽面板实现（新增）
- **拖拽逻辑**: 使用 `onMouseDown`、`mousemove` 和 `mouseup` 事件实现面板拖拽
- **位置状态**: 使用 `useState` 存储面板位置 `{ x, y }` 和 `isDragging` 状态
- **边界限制**: 限制拖拽范围在窗口内，避免面板超出可视区域
- **自动嵌入**: 检测面板与左边缘的距离（≤ 50px），自动切换到嵌入模式
- **布局自适应**: 嵌入模式下，主应用调整布局，为面板预留空间

## Phase 1: 设计与契约

### 数据模型设计

从功能规格中提取核心实体，创建 `data-model.md`：

**核心实体**：
- ImageId, ImageIds, VolumeId
- Viewport, RenderingEngine, ImageLoader
- Tool, Annotation, Measurement
- **MPR 专用**：MPR Viewport, Reference Line, Crosshair, Slab Thickness, Reconstruction Plane

**关系图**：
- RenderingEngine → Viewport (1:N)
- Viewport → Volume/Image (1:1)
- Tool → Viewport (N:1)
- MPR Viewport 之间的同步关系

### API 契约

生成 `contracts/` 目录，包含：
- **core-api.md**: 核心包 API（RenderingEngine, Viewport, Cache）
- **tools-api.md**: 工具包 API（标注、测量工具）
- **loader-api.md**: ImageLoader API（影像加载、元数据）
- **mpr-api.md**: MPR 专用 API（视图创建、同步、定位线）
- **measurement-panel-api.md**: 测量面板 API（AnnotationsPanel、事件监听、状态管理）
- **tool-modes-api.md**: 工具模式 API（Active/Passive/Enabled/Disabled、ToolGroup）

### 快速入门指南

创建 `quickstart.md`，包含：
- 5 分钟快速体验
- 30 分钟基础查看器搭建
- 2 小时完整功能集成

### Agent 上下文更新

运行：
```bash
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

更新 `.claude` 或相关 agent 上下文文件，添加新技术栈信息。

## Phase 2: 任务分解

**注意**: 本阶段由 `/speckit.tasks` 命令执行，不在 `/speckit.plan` 中创建。

任务将包括：
1. 架构文档编写任务
2. 入门指南编写任务
3. 高级功能指南编写任务
4. **MPR 实现指南编写任务**（新增）
5. **测量面板和工具模式实现任务**（新增）
6. 示例代码创建任务
7. 测试和验证任务
8. 文档审查和优化任务

## 下一步行动

1. ✅ **完成**: 宪章检查通过
2. **当前**: 执行 Phase 0 研究任务
3. **下一步**: 生成 `research.md` 文档
4. **后续**: Phase 1 设计（数据模型、API 契约、快速入门）
5. **最后**: Phase 2 任务分解（使用 `/speckit.tasks` 命令）

---

**文档状态**: Draft | **最后更新**: 2026-01-19
