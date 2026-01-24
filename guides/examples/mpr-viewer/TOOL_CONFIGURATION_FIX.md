# 双序列 MPR 工具配置修复

## 问题描述

双序列 MPR 布局创建后，视口可以正常显示图像，但是以下功能都无法使用：
- ❌ 平移（中键拖动）
- ❌ 缩放（右键拖动）
- ❌ 换层（滚轮）
- ❌ 测量（左键绘制）
- ❌ 十字线（左键拖动）
- ❌ 窗宽窗位调节

## 根本原因

### 问题 1：工具绑定冲突

**旧代码**（MPRViewer.tsx:1588-1595）：
```typescript
// ❌ 错误：StackScrollTool 和 CrosshairsTool 都绑定到主鼠标按钮
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [{ mouseButton: MouseBindings.Primary }],  // 左键
});

toolGroup.setToolActive(CrosshairsTool.toolName, {
  bindings: [{ mouseButton: MouseBindings.Primary }],  // 左键！冲突！
});
```

**结果**：后绑定的工具覆盖前面的工具，导致只有十字线生效，其他工具都无法使用。

### 问题 2：缺少事件处理器

动态创建的视口容器没有添加点击和双击事件处理器，导致：
- 无法通过点击激活视口
- 无法通过双击放大/还原视口
- 视口状态无法更新

### 问题 3：工具状态未正确同步

双序列布局的工具配置没有考虑当前的应用状态：
- `showCrosshairs` - 是否显示十字线
- `isWindowLevelActive` - 是否启用窗宽窗位工具
- `activeTool` - 当前激活的测量工具

## 解决方案

### 修复 1：正确的工具绑定配置

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx:1581-1618)

**关键修改**：
```typescript
// 🔧 配置基本工具（为每个视口配置）
// 平移 - 中键/Auxiliary
toolGroup.setToolActive(PanTool.toolName, {
  bindings: [{ mouseButton: MouseBindings.Auxiliary }],
});

// 缩放 - 右键/Secondary
toolGroup.setToolActive(ZoomTool.toolName, {
  bindings: [{ mouseButton: MouseBindings.Secondary }],
});

// 滚轮换层 - 滚轮（不是左键！）
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [{ mouseButton: MouseBindings.Wheel }],  // ✅ 滚轮
});

// 🔧 配置主鼠标按钮工具（根据当前状态选择一个）
if (showCrosshairs) {
  // 十字线工具
  toolGroup.setToolActive(CrosshairsTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Primary }],
  });
} else if (isWindowLevelActive) {
  // 窗宽窗位工具
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Primary }],
  });
} else if (activeTool) {
  // 测量工具
  toolGroup.setToolActive(activeTool, {
    bindings: [{ mouseButton: MouseBindings.Primary }],
  });
} else {
  // 默认：长度测量工具
  toolGroup.setToolActive(LengthTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Primary }],
  });
}
```

**工具绑定对照表**：

| 工具 | 鼠标操作 | 绑定 | 说明 |
|------|---------|------|------|
| 平移 (Pan) | 中键拖动 | `MouseBindings.Auxiliary` | 移动视口中的图像 |
| 缩放 (Zoom) | 右键拖动 | `MouseBindings.Secondary` | 放大/缩小图像 |
| 换层 (StackScroll) | 滚轮 | `MouseBindings.Wheel` | 切换切片 |
| 十字线 (Crosshairs) | 左键拖动 | `MouseBindings.Primary` | MPR 联动定位 |
| 窗宽窗位 (WindowLevel) | 左键拖动 | `MouseBindings.Primary` | 调节亮度/对比度 |
| 测量 (Length/Angle) | 左键绘制 | `MouseBindings.Primary` | 测量长度/角度 |

### 修复 2：添加视口事件处理器

**文件 1**: [dynamicViewportManager.ts](src/utils/dynamicViewportManager.ts:23-27)

添加事件处理器接口：
```typescript
export interface ViewportEventHandlers {
  onViewportClick?: (viewportId: string) => void;
  onViewportDoubleClick?: (viewportId: string) => void;
  getActiveViewportId?: () => string;
}
```

**文件 1**: [dynamicViewportManager.ts](src/utils/dynamicViewportManager.ts:42-48)

修改 `initialize` 方法，接受事件处理器：
```typescript
initialize(
  renderingEngine: RenderingEngine,
  containerElement: HTMLElement,
  eventHandlers?: ViewportEventHandlers
): void {
  this.renderingEngine = renderingEngine;
  this.containerElement = containerElement;
  if (eventHandlers) {
    this.eventHandlers = eventHandlers;
  }
}
```

**文件 1**: [dynamicViewportManager.ts](src/utils/dynamicViewportManager.ts:241-257)

在 `createGridLayout` 中添加事件监听器：
```typescript
// 🔧 添加点击事件处理器
viewportContainer.addEventListener('click', (e) => {
  e.stopPropagation();
  if (this.eventHandlers.onViewportClick) {
    this.eventHandlers.onViewportClick(viewportId);
  }
});

// 🔧 添加双击事件处理器
viewportContainer.addEventListener('dblclick', (e) => {
  e.stopPropagation();
  if (this.eventHandlers.onViewportDoubleClick) {
    this.eventHandlers.onViewportDoubleClick(viewportId);
  }
});
```

**文件 2**: [MPRViewer.tsx](src/MPRViewer.tsx:1511-1515)

传递事件处理器：
```typescript
dynamicViewportManager.initialize(renderingEngine, viewportsGridRef.current!, {
  onViewportClick: handleViewportClick,
  onViewportDoubleClick: handleViewportDoubleClick,
  getActiveViewportId: () => activeViewportId,
});
```

### 修复 3：激活状态的视觉反馈

**文件**: [dynamicViewportManager.ts](src/utils/dynamicViewportManager.ts:180-191)

```typescript
// 🔧 检查是否是激活的视口
const activeViewportId = this.eventHandlers.getActiveViewportId?.();
const isActive = viewportId === activeViewportId;

viewportContainer.style.cssText = `
  position: relative;
  background: #000;
  overflow: hidden;
  min-height: 200px;
  min-width: 200px;
  ${isActive ? 'outline: 2px solid #007acc; outline-offset: -2px;' : ''}
`;
```

激活的视口会显示蓝色边框。

## 预期效果

修复后，双序列 MPR 布局应该支持：

### 基本操作
- ✅ **左键拖动**：根据当前工具执行操作
  - 默认：长度测量
  - 十字线模式：十字线定位
  - 窗宽窗位模式：调节亮度/对比度
- ✅ **中键拖动**：平移图像
- ✅ **右键拖动**：缩放图像
- ✅ **滚轮**：切换切片（换层）

### 视口交互
- ✅ **单击视口**：激活该视口（显示蓝色边框）
- ✅ **双击视口**：放大/还原该视口

### 工具栏按钮
- ✅ **十字线**：启用后，左键拖动显示十字线
- ✅ **窗宽窗位**：启用后，左键拖动调节亮度/对比度
- ✅ **测量工具**：长度、角度、矩形、椭圆等
- ✅ **其他工具**：探针、放大镜等

## 测试验证

### 测试步骤

1. **切换到双序列 MPR 布局**
   - 加载至少 2 个序列
   - 点击布局按钮 → 协议布局 → 双序列 MPR

2. **测试基本工具**
   - 中键拖动：图像应该平移
   - 右键拖动：图像应该缩放
   - 滚轮：应该切换切片

3. **测试视口激活**
   - 点击不同视口
   - 应该看到蓝色边框切换到被点击的视口
   - 工具栏应该显示当前激活的视口信息

4. **测试工具切换**
   - 点击"十字线"按钮
   - 左键拖动应该显示十字线
   - 6 个视口应该联动

5. **测试测量工具**
   - 点击"长度"按钮
   - 左键拖动应该绘制测量线
   - 测量结果应该显示

### 预期控制台日志

```
✅ 视口 viewport-xxx-0 工具配置完成
✅ 视口 viewport-xxx-1 工具配置完成
...
✅ 双序列 MPR 工具组配置完成
✅ 双序列 MPR 布局已应用，共 6 个视口
```

点击视口时：
```
✅ 激活视口: viewport-xxx-2
```

## 技术要点

### Cornerstone3D 工具绑定规则

1. **每个鼠标按钮只能绑定一个工具**
   - 主按钮（左键）只能在十字线、窗宽窗位、测量工具中选择一个
   - 中键、右键、滚轮可以分别绑定不同工具

2. **工具绑定是全局的**
   - 通过 ToolGroup 绑定到多个视口
   - 一次配置影响所有视口

3. **工具切换需要先禁用再启用**
   ```typescript
   toolGroup.setToolDisabled(OldTool.toolName);
   toolGroup.setToolActive(NewTool.toolName, {
     bindings: [{ mouseButton: MouseBindings.Primary }],
   });
   ```

### 事件处理最佳实践

1. **使用事件委托**
   - 在视口容器级别监听事件
   - 通过闭包传递 viewportId

2. **阻止事件冒泡**
   ```typescript
   e.stopPropagation();  // 防止触发父容器的事件
   ```

3. **分离关注点**
   - `dynamicViewportManager` 负责创建 DOM
   - `MPRViewer` 负责业务逻辑
   - 通过回调函数解耦

## 相关文件

- **[MPRViewer.tsx](src/MPRViewer.tsx)** - 主组件，工具配置逻辑
- **[dynamicViewportManager.ts](src/utils/dynamicViewportManager.ts)** - 动态视口管理器
- **[DUAL_SEQUENCE_MPR_LAYOUT.md](DUAL_SEQUENCE_MPR_LAYOUT.md)** - 双序列布局实现文档

## 后续优化

1. **工具状态持久化**
   - 保存用户的工具选择
   - 切换布局时恢复工具状态

2. **工具栏状态同步**
   - 确保工具栏按钮状态与实际工具状态一致
   - 添加视觉反馈显示当前激活的工具

3. **性能优化**
   - 避免重复配置工具
   - 只在必要时更新工具绑定

---

**版本**: 1.0
**修复日期**: 2026-01-24
**状态**: ✅ 已修复，待测试验证
