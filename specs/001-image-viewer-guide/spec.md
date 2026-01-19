# Feature Specification: Cornerstone3D 影像浏览器开发指南

**Feature Branch**: `001-image-viewer-guide`
**Created**: 2025-01-18
**Status**: Draft
**Input**: User description: "分析当前项目，整理当前项目架构，基于当前项目开发影像浏览器项目的步骤"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 项目架构理解 (Priority: P1)

开发者需要全面了解 Cornerstone3D 项目的整体架构、核心包的职责以及它们之间的关系，以便基于此构建影像浏览器应用。

**Why this priority**: 这是开发影像浏览器的基础前提，不理解架构就无法正确使用 Cornerstone3D 的各项功能

**Independent Test**: 通过阅读架构文档，开发者能够准确回答以下问题：
- 核心包（core）和工具包（tools）的区别是什么？
- 哪些包负责影像加载，哪些负责交互工具？
- Viewport 的类型和用途有哪些？
- 如何选择合适的 ImageLoader？

**Acceptance Scenarios**:

1. **Given** 开发者刚接触 Cornerstone3D 项目，**When** 阅读架构文档，**Then** 能够理解 monorepo 结构和各个包的职责
2. **Given** 开发者需要选择渲染模式，**When** 查看架构文档，**Then** 能够理解 StackViewport 和 VolumeViewport 的适用场景
3. **Given** 开发者需要集成 DICOM 加载功能，**When** 阅读架构说明，**Then** 知道应该使用 dicomImageLoader 包

---

### User Story 2 - 基础影像查看器搭建 (Priority: P2)

开发者需要按照清晰的步骤指南，搭建一个能够加载和显示 DICOM 影像的基础查看器应用。

**Why this priority**: 这是最常见的使用场景，提供清晰的步骤可以大幅降低开发门槛

**Independent Test**: 开发者按照步骤指南操作后，能够成功运行一个显示 DICOM 影像的 Web 应用

**Acceptance Scenarios**:

1. **Given** 开发者有一个全新的项目环境，**When** 按照步骤指南操作，**Then** 能够完成项目初始化和依赖安装
2. **Given** 项目已初始化，**When** 执行初始化和配置代码，**Then** Cornerstone3D 能够成功初始化
3. **Given** 已有 DICOM 影像数据源，**When** 按照加载步骤操作，**Then** 影像能够正确显示在视口中
4. **Given** 影像已显示，**When** 测试基本交互（缩放、平移、窗宽窗位调整），**Then** 这些功能能够正常工作

---

### User Story 3 - 高级功能集成 (Priority: P3)

开发者需要在基础查看器之上添加高级功能，如标注工具、测量工具、分割功能、MPR 多平面重建等。

**Why this priority**: 高级功能是医疗影像应用的核心价值，但依赖基础功能的实现

**Independent Test**: 开发者能够按照指南集成至少一种高级功能（如 ROI 标注、测量工具或 MPR）并在应用中正常使用

**Acceptance Scenarios**:

1. **Given** 基础查看器已搭建完成，**When** 按照工具集成指南操作，**Then** 能够成功添加并使用标注工具
2. **Given** 需要处理 3D 体数据，**When** 按照体渲染指南操作，**Then** 能够显示和交互 3D 体数据
3. **Given** 需要 AI 辅助功能，**When** 参考 AI 集成指南，**Then** 了解如何集成 AI 模型进行自动分割或检测
4. **Given** 需要实现 MPR（多平面重建）功能，**When** 参考 MPR 实现指南，**Then** 能够创建横断位、冠状位、矢状位三视图联动的查看器，包含定位线、可调节层厚、旋转和测量功能

---

### User Story 4 - MPR 多平面重建实现（高级用例） (Priority: P3)

医疗影像应用开发者需要实现 MPR（Multi-Planar Reconstruction，多平面重建）查看器，以同时显示 3D 影像数据的横断位、冠状位和矢状位三个正交平面。MPR 查看器需要支持视图间联动、定位线显示、层厚调节、斜位旋转和测量工具等高级功能。

**Why this priority**: MPR 是放射科诊断和手术规划的关键工具，能够帮助医生从多个角度全面观察解剖结构，是医疗影像应用的重要高级功能

**Independent Test**: 开发者按照指南能够实现一个完整的 MPR 查看器，包含三视图联动、定位线、可调节层厚、旋转和测量功能，并能正确加载和显示 CT/MRI 3D 数据集

**Acceptance Scenarios**:

1. **Given** 开发者已完成基础查看器搭建，**When** 按照 MPR 实现指南操作，**Then** 能够创建三个正交视图（横断位、冠状位、矢状位）并正确显示 3D 影像数据
2. **Given** MPR 三个视图已创建，**When** 用户在任一视图中导航切片，**Then** 其他两个视图显示定位线并实时更新位置信息
3. **Given** MPR 查看器已实现，**When** 用户点击任一视图中的解剖位置，**Then** 所有视图自动定位到相同的空间坐标（联动导航）
4. **Given** MPR 查看器运行中，**When** 用户调节层厚参数，**Then** 视图显示相应厚度的板层（Slab）投影
5. **Given** MPR 查看器已实现，**When** 用户对视图应用旋转，**Then** 视图显示斜位平面且定位线正确更新
6. **Given** MPR 查看器运行中，**When** 用户在任一视图放置测量工具（长度、角度、ROI），**Then** 测量结果显示准确的物理单位（mm、度）并实时更新
7. **Given** MPR 查看器已添加测量，**When** 用户打开测量面板，**Then** 所有测量以列表形式显示，并支持单独或批量显示/隐藏、删除操作
8. **Given** MPR 查看器运行中，**When** 用户切换工具模式（Active/Passive/Enabled/Disabled），**Then** 工具行为立即响应（可绘制/可交互/仅显示/隐藏）
9. **Given** MPR 查看器运行中，**When** 用户切换比例尺位置或显示状态，**Then** 比例尺立即更新显示
10. **Given** 3D 数据集已加载，**When** 用户调整窗宽窗位，**Then** 调整可以应用到单个视图或所有视图

---

### Edge Cases

- 当 DICOM 影像数据损坏或格式不兼容时，如何优雅地处理错误？
- 当加载大型体数据（如 whole slide imaging）时，如何避免内存溢出？
- 当网络不稳定导致影像加载缓慢时，如何提供良好的用户体验？
- 当需要在同一页面显示多个视口时，如何确保性能不下降？
- 当浏览器不支持 WebGL 或 WebGL 版本过低时，如何降级处理？
- 当实现 MPR 时，3D 数据集缺失方向元数据或切片间距不一致，如何处理？
- 当 MPR 数据集包含超过 1000 个切片时，如何保持导航流畅性？
- 当用户在 MPR 视图中导航超出数据边界时，如何优雅地限制并提示？

## Requirements *(mandatory)*

### Functional Requirements

#### 架构文档要求

- **FR-001**: 文档 MUST 清晰描述 Cornerstone3D 的 monorepo 结构和包组织方式
- **FR-002**: 文档 MUST 详细说明核心包（core、tools、dicomImageLoader、adapters、ai）的职责和功能
- **FR-003**: 文档 MUST 解释核心架构概念：RenderingEngine、Viewport、ImageLoader、Cache、MetadataProvider
- **FR-004**: 文档 MUST 说明不同 Viewport 类型（Stack、Volume、3D）的使用场景和区别
- **FR-005**: 文档 MUST 列出关键外部依赖及其用途（VTK.js、dicom-parser、gl-matrix 等）

#### 开发步骤指南要求

- **FR-006**: 指南 MUST 提供完整的项目初始化步骤，包括依赖安装和基础配置
- **FR-007**: 指南 MUST 包含 Cornerstone3D 初始化的代码示例和配置说明
- **FR-008**: 指南 MUST 说明如何创建和配置 RenderingEngine
- **FR-009**: 指南 MUST 详细描述如何创建和启用 Viewport
- **FR-010**: 指南 MUST 提供影像加载的完整流程，包括元数据缓存和影像数据加载
- **FR-011**: 指南 MUST 包含常用交互工具（缩放、平移、窗宽窗位）的集成步骤
- **FR-012**: 指南 MUST 提供可运行的完整示例代码

#### 高级功能指南要求

- **FR-013**: 指南 MUST 说明如何集成和配置标注工具（RectangleROI、EllipticalROI 等）
- **FR-014**: 指南 MUST 解释工具状态管理和事件系统
- **FR-015**: 指南 MUST 提供体数据加载和体渲染的配置步骤
- **FR-016**: 指南 MUST 说明如何实现多视口同步和联动
- **FR-017**: 指南 MUST 包含性能优化建议（缓存配置、懒加载、Web Worker 使用等）
- **FR-018**: 指南 MUST 提供常见问题的解决方案和调试技巧

#### MPR 多平面重建指南要求

- **FR-019**: 指南 MUST 详细说明如何创建三个正交视图（横断位、冠状位、矢状位）的 VolumeViewport
- **FR-020**: 指南 MUST 解释如何实现跨视口同步，包括定位线（Reference Lines）的绘制和更新
- **FR-021**: 指南 MUST 说明如何实现联动导航，即在一个视图中定位时其他视图自动更新
- **FR-022**: 指南 MUST 提供层厚（Slab Thickness）调节的实现方法，包括平均投影、最大/最小强度投影
- **FR-023**: 指南 MUST 解释如何实现斜位 MPR，包括旋转平面的配置和定位线更新
- **FR-024**: 指南 MUST 说明如何在 MPR 视图中集成测量工具（长度、角度、双向、ROI）
- **FR-025**: 指南 MUST 说明如何实现测量面板，包括实时显示、显示/隐藏切换、删除功能
- **FR-026**: 指南 MUST 说明如何实现工具模式切换（Active、Passive、Enabled、Disabled）和状态管理
- **FR-027**: 指南 MUST 说明如何使用 Cornerstone3D 事件系统（eventTarget）监听标注变化
- **FR-028**: 指南 MUST 提供完整的 MPR 查看器示例代码，包含所有核心功能
- **FR-029**: 指南 MUST 说明如何处理 MPR 边缘情况（元数据缺失、大数据集性能、越界导航等）
- **FR-030**: 指南 MUST 提供 MPR 性能优化建议（视图更新频率、定位线渲染优化等）
- **FR-031**: 指南 MUST 说明如何集成比例尺工具并控制其显示和位置

#### 文档质量要求

- **FR-032**: 所有代码示例 MUST 使用中文注释和说明
- **FR-033**: 文档 MUST 使用中文编写，技术术语保留英文并提供中文解释
- **FR-034**: 每个步骤 MUST 清晰明确，避免歧义
- **FR-035**: 文档 MUST 包含目录结构和交叉引用，便于导航

### Key Entities

#### 核心包（Core Packages）

- **@cornerstonejs/core**: Cornerstone3D 的核心库，包含渲染引擎、视口管理、缓存系统、元数据提供器等核心功能
- **@cornerstonejs/tools**: 提供交互工具库，包括标注、测量、分割、显示工具等
- **@cornerstonejs/dicom-image-loader**: DICOM 影像加载器，支持 WADO-URI、WADO-RS 协议
- **@cornerstonejs/adapters**: 适配器库，用于与旧版 Cornerstone.js 兼容和格式转换
- **@cornerstonejs/ai**: AI/ML 集成库，支持 ONNX 模型推理和 AI 工具

#### 架构概念（Architectural Concepts）

- **RenderingEngine**: 渲染引擎，管理 WebGL 上下文和视口生命周期
- **Viewport**: 视口，用于显示影像的画布区域，分为 StackViewport（2D）、VolumeViewport（3D）、VolumeViewport3D 等类型
- **ImageLoader**: 影像加载器，负责从不同数据源加载影像数据
- **Cache**: 缓存系统，管理已加载的影像、体数据和几何数据的内存缓存
- **MetadataProvider**: 元数据提供器，存储和提供 DICOM 元数据信息
- **Tool**: 工具，提供用户交互功能（标注、测量、窗宽窗位调整等）

#### 数据流实体（Data Flow Entities）

- **ImageId**: 影像标识符，唯一标识一个影像实例
- **ImageIds**: 影像 ID 列表，用于定义 Stack 或 Volume
- **VolumeId**: 体数据标识符，唯一标识一个 3D 体数据
- **ViewportInput**: 视口输入配置，定义视口的类型、ID 和 DOM 元素
- **RenderingEngineConfig**: 渲染引擎配置，包含渲染模式、WebGL 上下文数量等参数

#### MPR 专用实体（MPR-Specific Entities）

- **MPR Viewport**: MPR 视口，三个 VolumeViewport 实例，分别显示横断位、冠状位、矢状位
- **Reference Line（定位线）**: 视觉叠加线，显示当前活动视图在其他视图中的位置
- **Crosshair（十字线）**: 三个正交平面的交点标记，指示当前查看的空间坐标
- **Slab Thickness（层厚）**: 板层厚度设置，控制多少相邻切片被投影显示（1 = 单切片，>1 = 厚板层）
- **Reconstruction Plane（重建平面）**: 定义 2D 切片的几何方向和位置，包括斜位平面的旋转角度
- **Viewport Camera**: 视口相机，定义视角、方向和投影方式，用于实现 MPR 旋转

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 开发者能够在 30 分钟内完成项目初始化并显示第一个 DICOM 影像
- **SC-002**: 90% 的开发者能够通过文档准确理解 Cornerstone3D 的核心架构概念
- **SC-003**: 按照指南操作的开发者能够在 2 小时内搭建一个功能完整的基础影像查看器
- **SC-004**: 85% 的开发者能够成功集成至少一种高级功能（标注、测量或 3D 渲染）
- **SC-005**: 70% 的开发者能够按照 MPR 指南实现完整的三视图联动查看器，包含定位线和基本测量功能
- **SC-006**: MPR 示例代码能够加载标准 CT 数据集（512x512x300 切片）并保持流畅的导航性能（60fps）
- **SC-007**: 文档覆盖所有核心包和主要功能（包括 MPR），覆盖率不低于 95%
- **SC-008**: 提供的示例代码能够直接运行，无需修改或仅需最小修改
- **SC-009**: 开发者遇到问题时，能够在文档中找到相关的调试技巧或常见问题解决方案

## Assumptions

1. 目标开发者已经熟悉 JavaScript/TypeScript 和前端开发基础
2. 开发者对 DICOM 标准和医疗影像概念有基本了解
3. 开发环境已安装 Node.js 20+ 和 Yarn 1.22+
4. 目标浏览器支持 WebGL 2.0（Chrome、Firefox、Safari、Edge 最新版本）
5. 已有可访问的 DICOM 数据源（WADO-URI、WADO-RS 或本地文件）
6. 本指南专注于前端集成，不涉及 PACS 后端系统的搭建
7. 示例代码使用 TypeScript 编写，但提供 JavaScript 适配说明
8. 文档默认使用现代前端框架（React、Vue 或 Angular），但也提供原生 JavaScript 实现
9. MPR 实现假设 3D 数据集包含完整的方向元数据和一致的切片间距
10. MPR 性能基准基于标准临床工作站配置（现代 GPU、8GB+ 内存）

## Out of Scope

- DICOM 标准的详细说明和教程
- PACS/VNA 后端系统的搭建和配置
- 医疗影像业务逻辑和工作流程设计
- 法规合规性（如 HIPAA、FDA 认证等）的详细指导
- 性能基准测试和压力测试方法
- 移动端和嵌入式设备的特殊适配
- 与第三方医学影像系统的深度集成
- 自定义 Codec 和 ImageLoader 的开发
- WebGL 着色器和底层渲染优化
- MPR 高级功能的完整实现（仅提供基础指南和示例代码）：
  - 曲面平面重组（Curved Planar Reformating，CPR）
  - 4D 数据支持（时间序列数据、灌注研究）
  - 多数据集融合（PET-CT、多模态融合）
  - 电影模式播放
- 体绘制（Volume Rendering，VR）的详细实现（仅提供基本配置）
