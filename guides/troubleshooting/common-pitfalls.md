# 常见陷阱和解决方案

**Based on**: 实际调试经验总结
**Last Updated**: 2025-01-18
**Difficulty**: ⭐⭐⭐ (这些错误容易犯且难以排查)

本文档总结了在 Cornerstone3D 开发过程中最容易犯的错误，以及如何避免它们。

---

## 🎯 概述

在开发 Cornerstone3D 应用时，有一些 API 变更和配置细节容易被忽略，导致功能不正常但错误信息不明确。本文档旨在帮助开发者避免这些常见陷阱。

---

## 陷阱 1: StackScrollTool 的滚轮绑定 ⭐⭐⭐

### 错误现象

```typescript
// ❌ 错误配置 - 滚轮无法换层
toolGroup.setToolActive(StackScrollTool.toolName);
```

**症状**：
- 滚轮滚动没有任何反应
- 其他工具（缩放、平移）正常工作
- 没有错误提示

### 正确配置

```typescript
// ✅ 正确配置 - 必须包含 Wheel 绑定
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [
    {
      mouseButton: ToolsEnums.MouseBindings.Wheel,
    },
  ],
});
```

### 为什么会这样？

**设计原因**：
1. Cornerstone3D 的工具系统要求明确指定工具响应哪些输入事件
2. `StackScrollTool` 通过 `mouseWheelCallback` 处理滚轮事件
3. 但工具系统需要知道将滚轮事件路由到哪个工具

**类比**：
- 其他工具（如 PanTool、ZoomTool）通过鼠标按钮触发，所以必须绑定到特定的鼠标按钮（Primary、Secondary、Auxiliary）
- `StackScrollTool` 通过滚轮触发，所以必须绑定到 `MouseBindings.Wheel`
- 这保持了工具配置的一致性和可预测性

### 验证方法

```typescript
// 添加调试信息
console.log('🔧 工具组配置：');
console.log('  - 工具组ID:', toolGroup.id);
console.log('  - 视口列表:', toolGroup.getViewportIds());
```

**预期结果**：
- 滚轮可以切换影像层
- 控制台显示 "交互工具已设置完成"
- 没有警告或错误信息

### 相关文档

- [基本交互 - StackScrollTool 滚轮绑定](../getting-started/basic-interactions.md#-重要-stackscrolltool-的滚轮绑定)
- [基础查看器 README - 滚轮换层常见问题](../examples/basic-viewer/README.md#-q-滚轮无法切换影像层)

---

## 陷阱 2: DICOM 加载器初始化 API 变更 ⭐⭐

### 错误现象

```typescript
// ❌ 旧版本 API（已弃用）
import { wadorsImageLoader } from '@cornerstonejs/dicom-image-loader';
wadorsImageLoader.init();
```

**症状**：
- 编译错误：`does not provide an export named 'wadorsImageLoader'`

### 正确配置

```typescript
// ✅ 新版本 API
import { init as initDICOMLoader } from '@cornerstonejs/dicom-image-loader';
initDICOMLoader();
```

### API 变更对比

| 旧 API | 新 API | 说明 |
|-------|--------|------|
| `wadorsImageLoader.init()` | `initDICOMLoader()` | 简化为 `init` 函数 |
| 需要命名空间导入 | 直接导入 `init` 函数 | 更简洁，避免命名空间污染 |

### 验证方法

```typescript
// 添加调试信息
console.log('✅ Cornerstone3D 初始化成功！');
```

**预期结果**：
- 启动应用后立即看到 "✅ Cornerstone3D 初始化成功！"
- 没有初始化相关的错误

### 相关文档

- [快速开始 - 初始化部分](../specs/001-image-viewer-guide/quickstart.md#步骤-4-初始化-cornerstone3d)

---

## 陷阱 3: 工具名称变更 ⭐⭐

### 错误现象

```typescript
// ❌ 旧版本工具名称（已不存在）
import { StackScrollMouseWheelTool } from '@cornerstonejs/tools';
addTool(StackScrollMouseWheelTool);
```

**症状**：
- 编译错误：`does not provide an export named 'StackScrollMouseWheelTool'`

### 正确配置

```typescript
// ✅ 新版本工具名称
import { StackScrollTool } from '@cornerstonejs/tools';
addTool(StackScrollTool);
```

### 工具名称变更对比

| 旧名称（错误） | 新名称（正确） | 类型 |
|-------------|--------------|------|
| `StackScrollMouseWheelTool` | `StackScrollTool` | 滚动工具 |
| `wadorsImageLoader` | `init` | DICOM 加载器 |

### 为什么这样改名？

**设计原因**：
1. **简化命名**：移除冗余的 "MouseWheel" 后缀
2. **一致性**：所有工具都以简单名称命名（PanTool、ZoomTool、StackScrollTool）
3. **向后兼容**：这是重命名，不是移除功能

### 验证方法

```typescript
import { StackScrollTool } from '@cornerstonejs/tools';
console.log('StackScrollTool.toolName'); // 应该输出: StackScroll

// 验证工具是否正确注册
import { ToolGroupManager } from '@cornerstonejs/tools';
const toolGroup = ToolGroupManager.getToolGroup('myToolGroup');
console.log(toolGroup.hasTool('StackScroll')); // 应该输出: true
```

---

## 陷阱 4: MouseBindings 枚举导入 ⭐⭐

### 错误现象

```typescript
// ❌ 错误导入
import { Enums } from '@cornerstonejs/core';

// 使用时出错
bindings: [{ mouseButton: Enums.Events.MouseBindings.Primary }] // undefined
```

**症状**：
- 运行时错误：`Cannot read properties of undefined (reading 'Primary')`
- 其他鼠标绑定不工作

### 正确配置

```typescript
// ✅ 正确导入 - 从 tools 导入 Enums 并重命名
import { Enums as ToolsEnums } from '@cornerstonejs/tools';

// 使用时
bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }]
```

### 为什么会这样？

**模块组织**：
- `@cornerstonejs/core` 的 `Enums` 不包含 `MouseBindings`
- `MouseBindings` 在 `@cornerstonejs/tools` 的 `Enums` 中
- 两个包都有 `Enums` 枚举，但包含不同的内容

### 枚举对比

| 枚举 | 位置 | 包含内容 |
|------|------|---------|
| `Enums.Events` (core) | `@cornerstonesource/core` | `ViewportType`, `Events` 等 |
| `Enums` (tools) | `@cornerstonejs/tools` | `MouseBindings`, `KeyboardBindings`, `ToolModes` 等 |

### 验证方法

```typescript
import { Enums as CoreEnums } from '@cornerstonejs/core';
import { Enums as ToolsEnums } from '@cornerstonejs/tools';

console.log('Core Enums:', CoreEnums.ViewportType);
console.log('Tools Enums:', ToolsEnums.MouseBindings);
```

**预期结果**：
- `Core Enums.STACK` 应该输出 `STACK`
- `ToolsEnums.MouseBindings.Wheel` 应该输出 `524288` (0x80000)

---

## 陷阱 5: ImageId 格式错误 ⭐

### 错误现象

```typescript
// ❌ 错误的 ImageId 格式
const imageId = 'imageLoader:file:image.dcm';
viewport.setStack([imageId], 0);
```

**症状**：
- 错误：`No image loader found for scheme 'imageLoader'`
- 影像无法显示

### 正确配置

#### 远程影像（WADO-RS）

```typescript
// ✅ 正确的 WADO-RS ImageId 格式
const imageId = 'wadors:https://example.com/wado-rs/studies/...';
viewport.setStack([imageId], 0);
```

#### 本地文件

```typescript
// ✅ 正确的本地文件 ImageId 格式
import { wadouri } from '@cornerstone3D/dicom-image-loader';

// 添加文件到文件管理器并获取 ImageId
const imageId = wadouri.fileManager.add(file);
viewport.setStack([imageId], 0);
```

### ImageId 格式说明

| 协议 | ImageId 前缀 | 示例 |
|------|------------|------|
| WADO-RS | `wadors:` | `wadors:https://.../image.dcm` |
| WADO-URI | `wadouri:` | `wadouri:file:image.dcm` (不推荐) |
| 本地文件 | `wadouri:file:` | 通过 `wadouri.fileManager.add(file)` 生成 |

### 验证方法

```typescript
// 检查 ImageId 是否有效
console.log('ImageId:', imageId);

// 检查视口状态
const viewport = renderingEngine.getStackViewport('my-viewport');
console.log('Viewport exists:', !!viewport);
console.log('Current image:', viewport.getCurrentImageId());
```

---

## 陷阱 6: 视口方法名变更 ⭐

### 错误现象

```typescript
// ❌ 旧版本方法名（已移除）
viewport.setImageIndex(1);
```

**症状**：
- 运行时错误：`viewport.setImageIndex is not a function`
- 无法通过编程方式切换影像层

### 正确配置

```typescript
// ✅ 新版本方法名
await viewport.setImageIdIndex(1);
```

### 方法变更对比

| 旧方法 | 新方法 | 说明 |
|--------|--------|------|
| `setImageIndex(index)` | `setImageIdIndex(index)` | 更准确的命名 |
| `getCurrentImageId()` | `getCurrentImageId()` | 保持不变 |

### 验证方法

```typescript
// 检查方法是否存在
console.log('setImageIdIndex' in viewport); // 应该输出: true
console.log('setImageIndex' in viewport);  // 应该输出: false
```

---

## 陷阱 7: 鼠标按钮枚举值错误 ⭐

### 错误现象

```typescript
// ❌ 错误 - 使用数字
bindings: [{ mouseButton: 1 }] // Primary
bindings: [{ mouseButton: 2 }] // Secondary
```

**症状**：
- 滚轮不能换层
- 鼠标绑定不工作
- 没有错误提示

### 正确配置

```typescript
// ✅ 正确 - 使用枚举
import { Enums as ToolsEnums } from '@cornerstonejs/tools';

bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }]   // 左键
bindings: [{ mouseButton: ToolsEnums.MouseBindings.Secondary }] // 右键
bindings: [{ mouseButton: ToolsEnums.MouseBindings.Auxiliary }] // 中键
bindings: [{ mouseButton: ToolsEnums.MouseBindings.Wheel }]     // 滚轮
```

### 枚举值对照表

| 枚举值 | 数值 | 说明 |
|--------|------|------|
| `MouseBindings.Primary` | 1 | 左键 |
| `MouseBindings.Secondary` | 2 | 右键 |
| `MouseBindings.Auxiliary` | 4 | 中键 |
| `MouseBindings.Wheel` | 524288 (0x80000) | 滚轮 |

**为什么使用枚举？**

1. **可读性**：`MouseBindings.Wheel` 比数字 `524288` 清晰得多
2. **类型安全**：TypeScript 会检查枚举的有效性
3. **自文档化**：代码本身说明了意图

---

## 陷阱 8: 重复工具注册 ⭐

### 错误现象

```typescript
// React StrictMode 导致的双重执行
useEffect(() => {
  addTool(PanTool);
  addTool(ZoomTool);
  // ...
}, []);
```

**症状**：
- 控制台警告：`'Pan' is already registered for ToolGroup basic-tool-group.`
- 虽然不影响功能，但会在控制台显示警告

### 正确配置

```typescript
// ✅ 添加 try-catch 来处理重复注册
try {
  addTool(PanTool);
  addTool(ZoomTool);
  addTool(WindowLevelTool);
  addTool(StackScrollTool);
} catch (error) {
  // 工具已经注册，忽略错误
  console.debug('工具已经注册，跳过注册步骤');
}
```

### 替代方案：检查工具是否已添加

```typescript
// ✅ 先检查再添加
const toolsToAdd = [
  PanTool.toolName,
  ZoomTool.toolName,
  WindowLevelTool.toolName,
  StackScrollTool.toolName,
];

toolsToAdd.forEach((toolName) => {
  if (!toolGroup.hasTool(toolName)) {
    toolGroup.addTool(toolName);
  }
});
```

---

## 陷阱 9: 视口未添加到 ToolGroup ⭐⭐

### 错误现象

```typescript
// ✅ 工具已添加到工具组
toolGroup.setToolActive(PanTool.toolName, {
  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
});

// ❌ 但视口未添加到工具组
// renderingEngine.enableElement(viewportInput);
// 没有调用 toolGroup.addViewport()
```

**症状**：
- 控制台没有错误
- 但工具不工作
- 影像可以显示，但无法交互

### 正确配置

```typescript
// 确保添加视口到工具组
toolGroup.addViewport(viewportId, renderingEngine.id);
```

### 为什么需要添加视口？

**设计原因**：
- 工具组可以管理多个视口
- 视口必须显式地添加到工具组
- 这样可以实现多视口同步等高级功能

---

## 陷阱 10: 滚轮工具与其他工具冲突 ⭐

### 错误现象

```typescript
// ⚠️ 注意：滚轮工具与其他工具可能存在冲突
toolGroup.setToolActive(ZoomTool.toolName, {
  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Secondary }],
});
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Wheel }],
});
```

**症状**：
- 滚轮换层功能不工作
- 缩放也不正常

### 解决方案：使用不同的绑定

```typescript
// ✅ 正确配置 - 每个工具绑定到不同的输入
// 左键：窗宽窗位
toolGroup.setToolActive(WindowLevelTool.toolName, {
  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
});

// 中键：平移
toolGroup.setToolActive(PanTool.toolName, {
  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Auxiliary }],
});

// 右键：缩放
toolGroup.setToolActive(ZoomTool.toolName, {
  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Secondary }],
});

// 滚轮：换层
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [
    {
      mouseButton: ToolsEnums.MouseBindings.Wheel,
    },
  ],
});
```

**为什么这样设计？**

1. **每个工具应该有自己的专属输入通道**
2. **避免冲突**：不同的工具不应该绑定到同一个输入
3. **用户体验**：让用户可以同时使用多个工具

---

## 📋 快速检查清单

在调试交互功能时，请按以下步骤逐一检查：

### 1. 工具注册检查

- [ ] 确认 `addTool()` 已调用
- [ ] 确认使用正确的工具名称（如 `StackScrollTool`，而不是 `StackScrollMouseWheelTool`）
- [ ] 确认没有重复注册警告

### 2. 工具组检查

- [ ] 确认工具已添加到 ToolGroup
- [ ] 确认视口已添加到 ToolGroup
- [ ] 确认工具组已获取

### 3. 工具激活检查

- [ ] 确认 `setToolActive()` 已调用
- [ ] 确认包含正确的绑定配置
- [ ] 对于 `StackScrollTool`，必须包含 `MouseBindings.Wheel` 绑定

### 4. 事件绑定检查

- [ ] 确认使用了正确的枚举来源（`ToolsEnums` vs `CoreEnums`）
- [ ] 确认鼠标按钮值正确（Primary=1, Secondary=2, Auxiliary=4, Wheel=524288）

### 5. 实际测试检查

- [ ] 在有多张影像的情况下测试滚轮
- [ ] 测试所有鼠标按钮（左、中、右键、滚轮）
- [ ] 查看控制台是否有警告或错误

---

## 🔍 故障排查流程

当遇到交互功能不正常时，按以下顺序排查：

```mermaid
flowchart TD
    A[交互功能不正常] --> B{是否有错误信息?}
    B -->|有| C[根据错误信息修复]
    B -->|无| D{滚轮不工作?}

    D -->|是| E{检查 Wheel 绑定}
    D -->|否| F{检查工具激活状态}

    E --> F{检查绑定配置}

    F --> G{工具已激活?}
    F -->|否| H{检查工具注册}

    H --> I{检查工具是否已注册}
    H -->|是| J{检查视口关联}
    H -->|否| K[执行 addTool()]

    I -->|否| J[执行 addTool()]
    J -->|否| L[检查工具是否在工具组中]

    L -->|否| M[执行 addTool()]
    L -->|是| N[检查视口关联]

    N -->|否| O[执行 addViewport()]
    N -->|isToolGroup.getViewportIds().includes(viewportId)]

    O -->|否| P[执行 addViewport()]
    N -->|isToolGroup.getViewportIds().includes(viewportId)

    P -->|否| Q[检查是否已经有其他工具占用此绑定]
    Q -->|是| R[修改工具绑定配置]

    R --> S[修改绑定配置并重新测试]
```

---

## 🎓 学习建议

为了避免这些陷阱，建议：

1. **阅读最新文档**：Cornerstone3D 的 API 经常更新
2. **参考官方示例**：`packages/tools/examples/` 中的示例是最新的
3. **使用 TypeScript**：类型检查可以在编译时发现错误
4. **添加调试信息**：在关键步骤添加 console.log
5. **查看类型定义**：`.d.ts` 文件是最准确的 API 文档

---

## 📚 相关文档

- [基本交互 - 工具系统详解](../getting-started/basic-interactions.md)
- [基础查看器 README - 常见问题](../examples/basic-viewer/README.md#常见问题)
- [故障排查 - 常见错误](../troubleshooting/common-errors.md)

---

**记住**：这些错误虽然常见，但只要按照正确的文档操作，完全可以避免！
