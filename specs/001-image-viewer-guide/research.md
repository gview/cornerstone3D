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

## 参考资源

- **Cornerstone3D 官方文档**: https://www.cornerstonejs.org/
- **Cornerstone3D GitHub**: https://github.com/cornerstonejs/cornerstone3D
- **DICOM 标准**: https://www.dicomstandard.org/
- **React 文档**: https://react.dev/
- **TypeScript 文档**: https://www.typescriptlang.org/docs/
- **Vite 文档**: https://vitejs.dev/
- **医学影像开源项目**: OHIF Viewer, MedDream
