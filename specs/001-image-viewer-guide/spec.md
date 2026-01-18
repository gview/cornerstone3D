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

开发者需要在基础查看器之上添加高级功能，如标注工具、测量工具、分割功能等。

**Why this priority**: 高级功能是医疗影像应用的核心价值，但依赖基础功能的实现

**Independent Test**: 开发者能够按照指南集成至少一种高级功能（如 ROI 标注或测量工具）并在应用中正常使用

**Acceptance Scenarios**:

1. **Given** 基础查看器已搭建完成，**When** 按照工具集成指南操作，**Then** 能够成功添加并使用标注工具
2. **Given** 需要处理 3D 体数据，**When** 按照体渲染指南操作，**Then** 能够显示和交互 3D 体数据
3. **Given** 需要 AI 辅助功能，**When** 参考 AI 集成指南，**Then** 了解如何集成 AI 模型进行自动分割或检测

---

### Edge Cases

- 当 DICOM 影像数据损坏或格式不兼容时，如何优雅地处理错误？
- 当加载大型体数据（如 whole slide imaging）时，如何避免内存溢出？
- 当网络不稳定导致影像加载缓慢时，如何提供良好的用户体验？
- 当需要在同一页面显示多个视口时，如何确保性能不下降？
- 当浏览器不支持 WebGL 或 WebGL 版本过低时，如何降级处理？

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

#### 文档质量要求

- **FR-019**: 所有代码示例 MUST 使用中文注释和说明
- **FR-020**: 文档 MUST 使用中文编写，技术术语保留英文并提供中文解释
- **FR-021**: 每个步骤 MUST 清晰明确，避免歧义
- **FR-022**: 文档 MUST 包含目录结构和交叉引用，便于导航

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

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 开发者能够在 30 分钟内完成项目初始化并显示第一个 DICOM 影像
- **SC-002**: 90% 的开发者能够通过文档准确理解 Cornerstone3D 的核心架构概念
- **SC-003**: 按照指南操作的开发者能够在 2 小时内搭建一个功能完整的基础影像查看器
- **SC-004**: 85% 的开发者能够成功集成至少一种高级功能（标注、测量或 3D 渲染）
- **SC-005**: 文档覆盖所有核心包和主要功能，覆盖率不低于 95%
- **SC-006**: 提供的示例代码能够直接运行，无需修改或仅需最小修改
- **SC-007**: 开发者遇到问题时，能够在文档中找到相关的调试技巧或常见问题解决方案

## Assumptions

1. 目标开发者已经熟悉 JavaScript/TypeScript 和前端开发基础
2. 开发者对 DICOM 标准和医疗影像概念有基本了解
3. 开发环境已安装 Node.js 20+ 和 Yarn 1.22+
4. 目标浏览器支持 WebGL 2.0（Chrome、Firefox、Safari、Edge 最新版本）
5. 已有可访问的 DICOM 数据源（WADO-URI、WADO-RS 或本地文件）
6. 本指南专注于前端集成，不涉及 PACS 后端系统的搭建
7. 示例代码使用 TypeScript 编写，但提供 JavaScript 适配说明
8. 文档默认使用现代前端框架（React、Vue 或 Angular），但也提供原生 JavaScript 实现

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
