# 双序列 MPR 视口尺寸修复

## 问题诊断

### 原始问题
双序列 MPR 布局创建 6 个视口后，所有视口显示为空白/黑色，没有渲染医学图像。

### 控制台错误日志
```
dynamicViewportManager.ts:458  Viewport is too small 156 0
```

视口尺寸只有 156px × 0px，太小无法渲染。

### 根本原因分析

**问题**：嵌套网格布局导致尺寸计算冲突

在 `createGridLayout` 方法中：
1. 创建了新的 `gridContainer` div，包含 CSS Grid 样式
2. 将 `gridContainer` 添加到 `viewportsGridRef.current`
3. 但是 `viewportsGridRef.current` 本身已经有 CSS Grid 样式

这导致了**嵌套网格**问题：
```
viewportsGridRef (父容器，已有 grid 样式)
  └── gridContainer (新创建的，也有 grid 样式) ❌ 冲突！
        └── viewport-container (实际视口容器)
              └── viewport-element (Cornerstone3D 渲染元素)
```

父容器和子容器的网格样式冲突，导致尺寸计算错误，视口无法获得正确的高度。

### 代码位置

**MPRViewer.tsx** 中的父容器样式：
```tsx
<div
  ref={viewportsGridRef}
  className="mpr-viewports"
  style={{
    gridTemplateColumns: getGridTemplateColumns(currentLayout),
    gridTemplateRows: getGridTemplateRows(currentLayout),
    gridTemplateAreas: currentLayout === 'grid-1-2' ? '"main top" "main bottom"' : undefined,
  }}
>
```

**dynamicViewportManager.ts** 中的旧实现：
```typescript
// 创建网格容器
const gridContainer = document.createElement('div');
gridContainer.style.cssText = `
  display: grid;
  grid-template-columns: repeat(${cols}, 1fr);
  grid-template-rows: repeat(${rows}, 1fr);
  // ...
`;

// 添加到容器
this.containerElement.appendChild(gridContainer); // ❌ 嵌套网格！
```

## 解决方案

### 核心思路
**直接使用父容器的网格布局，而不是创建嵌套的网格容器**

### 修改内容

#### 1. 修改 `createGridLayout` 方法

**文件**: [dynamicViewportManager.ts](src/utils/dynamicViewportManager.ts)

**关键修改**：
```typescript
createGridLayout(rows: number, cols: number, viewportIds: string[]): void {
  // 清空现有视口
  this.clearContainer();

  // 🔧 关键修复：直接设置父容器的网格样式
  this.containerElement.style.display = 'grid';
  this.containerElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  this.containerElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  this.containerElement.style.gap = '2px';

  // 创建视口元素
  viewportIds.forEach((viewportId, index) => {
    const viewportContainer = document.createElement('div');
    // ... 设置样式 ...

    // 🔧 直接添加到父容器，而不是创建嵌套的 gridContainer
    this.containerElement.appendChild(viewportContainer);

    this.viewportElements.set(viewportId, viewportElement);
  });
}
```

**新的结构**：
```
viewportsGridRef (父容器，直接设置 grid 样式) ✅
  ├── viewport-container (视口 1)
  ├── viewport-container (视口 2)
  ├── viewport-container (视口 3)
  └── ... (其他视口)
```

#### 2. 更新 `clearContainer` 方法

**修改**：正确清理视口容器元素
```typescript
clearContainer(): void {
  if (!this.containerElement) return;

  // 移除所有视口容器元素
  const viewportContainers = Array.from(this.containerElement.children).filter(
    child => child.classList.contains('viewport-container')
  );

  viewportContainers.forEach((container) => {
    if (container.parentNode === this.containerElement) {
      this.containerElement!.removeChild(container);
    }
  });

  this.viewportElements.clear();
}
```

#### 3. 添加调试日志

添加了详细的调试日志来跟踪视口尺寸：
```typescript
console.log('🔧 设置父容器网格样式:', {
  rows,
  cols,
  gridTemplateColumns: this.containerElement.style.gridTemplateColumns,
  gridTemplateRows: this.containerElement.style.gridTemplateRows,
});

requestAnimationFrame(() => {
  console.log('🔧 布局完成后检查视口尺寸:');
  viewportIds.forEach((viewportId) => {
    const element = this.viewportElements.get(viewportId);
    if (element) {
      console.log(`  ${viewportId}:`, {
        width: element.offsetWidth,
        height: element.offsetHeight,
        parentWidth: element.parentElement?.offsetWidth,
        parentHeight: element.parentElement?.offsetHeight,
      });
    }
  });
});
```

#### 4. 添加最小尺寸约束

为视口容器添加最小尺寸，防止视口过小：
```typescript
viewportContainer.style.cssText = `
  position: relative;
  background: #000;
  overflow: hidden;
  min-height: 200px;  // 🔧 添加最小高度
  min-width: 200px;   // 🔧 添加最小宽度
`;
```

## 预期效果

修复后，视口应该：
1. ✅ 获得正确的宽度和高度（不再出现 156px × 0px）
2. ✅ 正常渲染医学图像
3. ✅ 显示两个序列的 MPR 视图
4. ✅ 视口布局为 2 行 3 列网格

## 测试验证

### 测试步骤

1. **刷新页面**（确保加载最新代码）
2. **加载 DICOM 文件**（至少 2 个序列）
3. **打开控制台**（F12）
4. **点击布局按钮**（▦ 图标）
5. **切换到"协议布局" Tab**
6. **点击"双序列 MPR"**

### 预期日志输出

```
🔧 设置父容器网格样式: {rows: 2, cols: 3, ...}
  ✓ 视口容器 viewport-xxx-0 已添加到父容器，尺寸: {offsetWidth: 400, offsetHeight: 300}
  ✓ 视口容器 viewport-xxx-1 已添加到父容器，尺寸: {offsetWidth: 400, offsetHeight: 300}
  ...
✓ 所有视口容器已添加，父容器子元素数量: 6
🔧 布局完成后检查视口尺寸:
  viewport-xxx-0: {width: 400, height: 300, parentWidth: 1200, parentHeight: 600}
  viewport-xxx-1: {width: 400, height: 300, parentWidth: 1200, parentHeight: 600}
  ...
✓ 视口已设置到渲染引擎
✓ 序列1数据已设置
✓ 序列2数据已设置
✓ 视口已渲染
```

### 成功标志

- ✅ 视口尺寸合理（宽度和高度都 > 200px）
- ✅ 6 个视口都显示医学图像
- ✅ 第一行显示序列 1 的 Axial、Sagittal、Coronal
- ✅ 第二行显示序列 2 的 Axial、Sagittal、Coronal
- ✅ 视口标签正确显示（Seq 1 - Axial、Seq 2 - Axial 等）

## 相关文件

- **[dynamicViewportManager.ts](src/utils/dynamicViewportManager.ts)** - 动态视口管理器（已修改）
- **[MPRViewer.tsx](src/MPRViewer.tsx)** - 主组件（父容器）
- **[EnhancedLayoutPanel.tsx](src/components/panels/EnhancedLayoutPanel.tsx)** - 布局面板 UI

## 技术要点

### CSS Grid 布局冲突

当两个容器都设置了 `display: grid` 时，嵌套结构会导致：
- 尺寸计算复杂化
- 父容器的网格规则可能覆盖子容器
- 子容器可能无法获得正确的空间分配

### 解决方案原则

1. **避免嵌套网格**：只在一个层级设置网格布局
2. **直接操作父容器**：动态设置父容器的网格样式
3. **简化 DOM 结构**：视口容器直接作为父容器的子元素

### 视口尺寸要求

Cornerstone3D 视口需要：
- **最小宽度**：建议至少 200px
- **最小高度**：建议至少 200px
- **非零尺寸**：width 和 height 都必须 > 0

## 后续优化

如果还有问题，可以尝试：
1. 增加 DOM 更新等待时间（从 100ms 增加到 200ms）
2. 使用 `ResizeObserver` 监听父容器尺寸变化
3. 在视口创建后强制触发 `resize` 事件
4. 检查父容器的实际可用空间

---

**版本**: 1.0
**修复日期**: 2026-01-24
**状态**: ✅ 已修复，待测试验证
