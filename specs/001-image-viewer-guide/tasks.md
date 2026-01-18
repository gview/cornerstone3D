# Tasks: Cornerstone3D 影像浏览器开发指南

**Input**: Design documents from `/specs/001-image-viewer-guide/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: 本功能为文档项目，不涉及代码测试。所有文档必须通过质量检查清单验证。

**Organization**: 任务按用户故事分组，每个故事可以独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属的用户故事（US1、US2、US3）
- 必须包含精确的文件路径

## Path Conventions

- **文档项目**: `guides/` 在项目根目录
- 所有路径使用绝对路径或从项目根目录的相对路径

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和基础结构搭建

- [x] T001 创建 guides/ 目录结构在项目根目录
- [x] T002 创建 guides/README.md 作为指南总入口和导航
- [x] T003 [P] 创建 guides/architecture/ 目录
- [x] T004 [P] 创建 guides/getting-started/ 目录
- [x] T005 [P] 创建 guides/advanced/ 目录
- [x] T006 [P] 创建 guides/examples/ 目录
- [x] T007 [P] 创建 guides/troubleshooting/ 目录
- [x] T008 更新根目录 README.md，添加指南链接

---

## Phase 2: Foundational (阻塞性前置条件)

**Purpose**: 所有用户故事的文档模板和样式指南

**⚠️ CRITICAL**: 此阶段必须在任何用户故事之前完成

- [x] T009 创建文档模板文件在 guides/.templates/document-template.md
- [x] T010 [P] 创建 frontmatter 模板在 guides/.templates/frontmatter-template.md
- [x] T011 [P] 创建代码块模板在 guides/.templates/code-block-template.md
- [x] T012 [P] 创建图表模板在 guides/.templates/diagram-template.md
- [x] T013 创建文档质量检查清单在 guides/.templates/quality-checklist.md
- [x] T014 [P] 配置 Prettier 用于文档格式化
- [x] T015 [P] 配置 Mermaid.js 用于图表渲染

**Checkpoint**: 基础设施就绪 - 用户故事文档编写可以并行开始

---

## Phase 3: User Story 1 - 项目架构理解 (Priority: P1) 🎯 MVP

**Goal**: 提供完整的 Cornerstone3D 架构文档，帮助开发者理解项目结构、核心包职责和架构概念

**Independent Test**: 开发者阅读架构文档后，能够准确回答关于 monorepo 结构、核心包职责、Viewport 类型、ImageLoader 选择等问题

### Implementation for User Story 1

- [x] T016 [P] [US1] 创建架构概述文档在 guides/architecture/overview.md
- [x] T017 [P] [US1] 创建 monorepo 结构详解在 guides/architecture/monorepo-structure.md
- [x] T018 [P] [US1] 创建核心包职责说明在 guides/architecture/core-packages.md
- [x] T019 [US1] 创建架构概念文档在 guides/architecture/architectural-concepts.md
- [x] T020 [P] [US1] 创建外部依赖说明在 guides/architecture/dependencies.md
- [x] T021 [US1] 创建术语表在 guides/architecture/glossary.md
- [x] T022 [US1] 添加架构图表在相关文档中（使用 Mermaid）

**Checkpoint**: 架构文档完成，开发者可以理解 Cornerstone3D 的整体结构

---

## Phase 4: User Story 2 - 基础影像查看器搭建 (Priority: P2)

**Goal**: 提供清晰的步骤指南，帮助开发者搭建基础 DICOM 影像查看器

**Independent Test**: 开发者按照指南操作后，能够成功运行一个显示 DICOM 影像的 Web 应用

### Implementation for User Story 2

- [x] T023 [P] [US2] 创建项目初始化指南在 guides/getting-started/project-setup.md
- [x] T024 [P] [US2] 创建 Cornerstone3D 初始化指南在 guides/getting-started/initialization.md
- [x] T025 [US2] 创建第一个影像查看器指南在 guides/getting-started/first-viewer.md
- [x] T026 [US2] 创建基本交互指南在 guides/getting-started/basic-interactions.md
- [x] T027 [P] [US2] 创建框架集成指南（React、Vue、Angular）在 guides/getting-started/framework-integration.md
- [x] T028 [US2] 更新 quickstart.md，添加更多快速开始示例

### Example Project for User Story 2

- [x] T029 [US2] 创建基础查看器示例项目在 guides/examples/basic-viewer/
- [x] T030 [P] [US2] 创建 basic-viewer 的 README.md
- [x] T031 [P] [US2] 创建 basic-viewer 的 package.json
- [x] T032 [P] [US2] 创建 basic-viewer 的 vite.config.ts
- [x] T033 [P] [US2] 创建 basic-viewer 的 tsconfig.json
- [x] T034 [P] [US2] 创建 basic-viewer 的 index.html
- [x] T035 [P] [US2] 创建 basic-viewer 的 src/main.tsx
- [x] T036 [P] [US2] 创建 basic-viewer 的 src/App.tsx
- [x] T037 [P] [US2] 创建 basic-viewer 的 src/cornerstone/init.ts
- [x] T038 [P] [US2] 创建 basic-viewer 的 src/cornerstone/viewport.ts
- [x] T039 [P] [US2] 创建 basic-viewer 的 src/types/index.d.ts

**Checkpoint**: 基础查看器指南和示例完成，开发者可以快速上手

---

## Phase 5: User Story 3 - 高级功能集成 (Priority: P3)

**Goal**: 提供高级功能的集成指南，帮助开发者添加标注、测量、3D 渲染、AI 等功能

**Independent Test**: 开发者能够按照指南集成至少一种高级功能（如 ROI 标注或测量工具）并在应用中正常使用

### Implementation for User Story 3

- [ ] T040 [P] [US3] 创建标注工具指南在 guides/advanced/annotations.md
- [ ] T041 [P] [US3] 创建测量工具指南在 guides/advanced/measurements.md
- [ ] T042 [P] [US3] 创建 3D 体渲染指南在 guides/advanced/volume-rendering.md
- [ ] T043 [P] [US3] 创建多视口同步指南在 guides/advanced/multi-viewport.md
- [ ] T044 [US3] 创建性能优化指南在 guides/advanced/performance-optimization.md
- [ ] T045 [P] [US3] 创建 AI 集成指南在 guides/advanced/ai-integration.md
- [ ] T046 [P] [US3] 创建自定义工具指南在 guides/advanced/custom-tools.md
- [ ] T047 [P] [US3] 创建高级加载器指南在 guides/advanced/advanced-loaders.md

### Example Project for User Story 3

- [ ] T048 [US3] 创建高级查看器示例项目在 guides/examples/advanced-viewer/
- [ ] T049 [P] [US3] 创建 advanced-viewer 的 README.md
- [ ] T050 [P] [US3] 创建 advanced-viewer 的 package.json
- [ ] T051 [P] [US3] 创建 advanced-viewer 的 vite.config.ts
- [ ] T052 [P] [US3] 创建 advanced-viewer 的 tsconfig.json
- [ ] T053 [P] [US3] 创建 advanced-viewer 的 index.html
- [ ] T054 [P] [US3] 创建 advanced-viewer 的 src/main.tsx
- [ ] T055 [P] [US3] 创建 advanced-viewer 的 src/App.tsx
- [ ] T056 [P] [US3] 创建 advanced-viewer 的 src/cornerstone/init.ts
- [ ] T057 [P] [US3] 创建 advanced-viewer 的 src/cornerstone/viewport.ts
- [ ] T058 [P] [US3] 创建 advanced-viewer 的 src/cornerstone/tools.ts
- [ ] T059 [P] [US3] 创建 advanced-viewer 的 src/types/index.d.ts

**Checkpoint**: 高级功能指南和示例完成，开发者可以集成高级功能

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 故障排查、文档完善和质量保证

- [x] T060 [P] 创建常见错误文档在 guides/troubleshooting/common-errors.md
- [x] T061 [P] 创建调试技巧文档在 guides/troubleshooting/debugging-tips.md
- [x] T062 [P] 创建常见问题文档在 guides/troubleshooting/faq.md
- [x] T063 [P] 创建常见陷阱文档在 guides/troubleshooting/common-pitfalls.md
- [ ] T063 [P] 更新所有文档的交叉引用和链接
- [ ] T064 [P] 添加目录（TOC）到所有主要文档
- [ ] T065 [P] 添加代码高亮到所有代码块
- [ ] T066 [P] 添加 Mermaid 图表到架构文档
- [ ] T067 [P] 验证所有代码示例可以通过类型检查
- [ ] T068 [P] 验证所有链接有效
- [ ] T069 运行文档质量检查清单，确保所有文档符合标准
- [ ] T070 创建贡献指南在 guides/CONTRIBUTING.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - 阻塞所有用户故事
- **User Stories (Phase 3-5)**: 依赖 Foundational 完成
  - User Stories 可以并行进行（如果有足够的人力）
  - 或按优先级顺序执行（P1 → P2 → P3）
- **Polish (Phase 6)**: 依赖所有期望的用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational 完成后开始 - 无其他故事依赖
- **User Story 2 (P2)**: 可在 Foundational 完成后开始 - 建议先完成 US1（架构理解有助于编写指南）
- **User Story 3 (P3)**: 可在 Foundational 完成后开始 - 依赖 US2（基础功能是高级功能的前提）

### Within Each User Story

- 文档可以按任意顺序编写
- 示例项目必须在相关文档之后编写
- 故障排查文档应在所有用户故事完成后编写

### Parallel Opportunities

- Setup 阶段所有标记 [P] 的任务可以并行
- Foundational 阶段所有标记 [P] 的任务可以并行
- 同一用户故事内标记 [P] 的文档编写任务可以并行
- 同一示例项目内标记 [P] 的文件创建任务可以并行
- 不同用户故事可以由不同团队成员并行工作
- Polish 阶段所有标记 [P] 的任务可以并行

---

## Parallel Example: User Story 1

```bash
# 并行启动所有架构文档编写任务：
Task: "创建架构概述文档在 guides/architecture/overview.md"
Task: "创建 monorepo 结构详解在 guides/architecture/monorepo-structure.md"
Task: "创建核心包职责说明在 guides/architecture/core-packages.md"

# 这些文档互不依赖，可以同时编写
```

---

## Parallel Example: User Story 2 示例项目

```bash
# 并行创建所有配置文件：
Task: "创建 basic-viewer 的 README.md"
Task: "创建 basic-viewer 的 package.json"
Task: "创建 basic-viewer 的 vite.config.ts"
Task: "创建 basic-viewer 的 tsconfig.json"
Task: "创建 basic-viewer 的 index.html"

# 这些文件创建完成后，再创建源代码文件
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational
3. 完成 Phase 3: User Story 1（架构文档）
4. **STOP and VALIDATE**: 验证架构文档的准确性和完整性
5. 发布架构文档作为 MVP

### Incremental Delivery

1. 完成 Setup + Foundational → 基础设施就绪
2. 添加 User Story 1 → 验证架构理解 → 发布/演示（MVP！）
3. 添加 User Story 2 → 验证基础查看器 → 发布/演示
4. 添加 User Story 3 → 验证高级功能 → 发布/演示
5. 完成 Polish → 完整的指南库

### Parallel Team Strategy

With multiple writers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Writer A: User Story 1（架构文档）
   - Writer B: User Story 2（快速入门）
   - Writer C: User Story 3（高级指南）
3. Stories complete and integrate independently

---

## Notes

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签 = 将任务映射到特定用户故事，便于追踪
- 每个用户故事应独立可完成和测试
- 完成每个任务或逻辑组后提交
- 在任何 checkpoint 停止以独立验证故事
- 避免：模糊任务、同文件冲突、破坏故事独立性的跨故事依赖

---

## Task Breakdown Summary

| Phase | Description | Task Count | Parallel Opportunities |
|-------|-------------|------------|----------------------|
| Phase 1 | Setup | 8 | 5 parallel (T003-T007) |
| Phase 2 | Foundational | 7 | 3 parallel (T010-T012, T014-T015) |
| Phase 3 | User Story 1 - 架构理解 | 7 | 4 parallel (T016-T020) |
| Phase 4 | User Story 2 - 基础查看器 | 17 | 8 parallel (T023-T024, T027, T030-T039) |
| Phase 5 | User Story 3 - 高级功能 | 20 | 10 parallel (T040-T047, T049-T058) |
| Phase 6 | Polish | 11 | 8 parallel (T060-T068) |
| **Total** | | **70** | **38 parallel opportunities** |

---

## Estimated Timeline

| Phase | Estimated Time | Prerequisites |
|-------|----------------|---------------|
| Phase 1: Setup | 1-2 hours | None |
| Phase 2: Foundational | 2-3 hours | Phase 1 |
| Phase 3: User Story 1 | 8-12 hours | Phase 2 |
| Phase 4: User Story 2 | 12-16 hours | Phase 2 + US1 (recommended) |
| Phase 5: User Story 3 | 16-20 hours | Phase 2 + US2 (required) |
| Phase 6: Polish | 4-6 hours | All desired stories |
| **Total (Serial)** | **43-59 hours** | |
| **Total (Parallel, 3 writers)** | **15-25 hours** | |

---

## Quality Gates

每个阶段完成后必须通过以下质量门控：

### Phase 1 & 2 Gates
- [ ] 所有目录已创建
- [ ] 所有模板文件已创建
- [ ] Prettier 和 Mermaid.js 已配置

### User Story Gates
- [ ] 所有文档已创建并通过质量检查清单
- [ ] 所有代码示例包含中文注释
- [ ] 所有链接有效
- [ ] TypeScript 代码通过类型检查
- [ ] 示例项目可以运行

### Final Gates
- [ ] 所有文档通过质量检查清单
- [ ] 所有交叉引用有效
- [ ] 所有图表正确渲染
- [ ] 文档覆盖率 ≥ 95%
