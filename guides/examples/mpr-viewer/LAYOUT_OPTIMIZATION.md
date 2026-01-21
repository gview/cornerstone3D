# 布局切换优化文档

本文档记录了 MPR Viewer 布局切换功能的优化和修复过程。

---

## 问题概述

在布局切换（横向/纵向）时存在以下问题：

1. **布局命名混淆**: `getGridTemplateColumns` 和 `getGridTemplateRows` 函数的行列取值错误
2. **视口显示不完整**: 纵向布局（3x1）中第三个视口被裁剪
3. **图像未自动适应**: 布局切换后图像缩放和位置未重置

---

## 修复内容

### 1. 修正网格行列解析逻辑

**文件**: [MPRViewer.tsx:39-57](MPRViewer.tsx#L39-L57)

**问题**:
```typescript
// ❌ 错误的实现（行列取反）
const getGridTemplateColumns = (layout: ViewportLayout): string => {
  const match = layout.match(/grid-(\d+)x(\d+)/);
  if (match) {
    const cols = parseInt(match[1]);  // 错误：取了第一个数字（应该是行数）
    return Array(cols).fill('1fr').join(' ');
  }
  return '1fr 1fr';
};

const getGridTemplateRows = (layout: ViewportLayout): string => {
  const match = layout.match(/grid-(\d+)x(\d+)/);
  if (match) {
    const rows = parseInt(match[2]);  // 错误：取了第二个数字（应该是列数）
    return Array(rows).fill('1fr').join(' ');
  }
  return '1fr 1fr';
};
```

**修复**:
```typescript
// ✅ 正确的实现
const getGridTemplateColumns = (layout: ViewportLayout): string => {
  const match = layout.match(/grid-(\d+)x(\d+)/);
  if (match) {
    const cols = parseInt(match[2]);  // 第二个数字是列数
    return Array(cols).fill('1fr').join(' ');
  }
  return '1fr 1fr';
};

const getGridTemplateRows = (layout: ViewportLayout): string => {
  const match = layout.match(/grid-(\d+)x(\d+)/);
  if (match) {
    const rows = parseInt(match[1]);  // 第一个数字是行数
    return Array(rows).fill('1fr').join(' ');
  }
  return '1fr 1fr';
};
```

**命名约定**: `grid-rows×cols`（行×列）
- `grid-3x1` = 3行 × 1列 = 纵向布局
- `grid-1x3` = 1行 × 3列 = 横向布局

---

### 2. 移除视口固定最小高度

**文件**: [index.css:125-171](index.css#L125-L171)

**问题**: 视口容器设置了 `min-height: 300px`，导致纵向布局时视口显示不完整。

**修复**:

```css
/* .viewport-container 样式 */
.viewport-container {
  position: relative;
  background-color: #000;
  border: 1px solid #333;
  overflow: hidden;
  /* 让网格布局自动决定尺寸，移除固定最小高度 */
  min-height: 0;  /* ✅ 从 300px 改为 0 */
  width: 100%;
  height: 100%;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

/* .viewport-element 样式 */
.viewport-element {
  width: 100%;
  height: 100%;
  min-height: 0;  /* ✅ 从 200px 改为 0 */
  position: relative;
  display: block;
}
```

**效果**:
- 视口容器完全由 CSS 网格布局控制
- 纵向和横向布局都能正确显示所有视口
- 视口自动平均分配可用空间

---

### 3. 布局切换后自动重置相机

**文件**: [MPRViewer.tsx:1231-1271](MPRViewer.tsx#L1231-L1271)

**新增功能**: 布局切换时自动调用 `resetCamera()` 重置视口缩放和位置。

```typescript
const handleLayoutChange = async (layout: ViewportLayout) => {
  if (!renderingEngine || !volume) {
    console.warn('无法切换布局: 渲染引擎或体积数据未初始化');
    return;
  }

  setCurrentLayout(layout);

  setTimeout(() => {
    if (renderingEngine && viewportsGridRef.current) {
      // 1. 重新计算视口大小
      renderingEngine.resize(true, true);

      // 2. 重置所有视口的缩放和位置，使图像适应视口
      viewportIds.forEach((viewportId) => {
        try {
          const viewport = renderingEngine!.getViewport(viewportId) as Types.IVolumeViewport;
          if (!viewport) return;

          // 重置相机以适应窗口
          viewport.resetCamera();
          console.log(`✅ 视口 ${viewportId} 已重置相机，图像已适应窗口`);
        } catch (error) {
          console.warn(`⚠️ 重置视口 ${viewportId} 失败:`, error);
        }
      });

      // 3. 重新渲染所有视口
      renderingEngine.renderViewports(viewportIds);

      console.log(`✅ 布局已切换到: ${layout}，视口已重新计算大小并重置相机`);
    }
  }, 150);
};
```

**工作原理**:
- `viewport.resetCamera()` 是 Cornerstone3D 提供的方法
- 自动计算合适的缩放比例，使整个体积数据适应视口
- 将相机位置设置到体积中心
- 重置相机的视图方向到默认状态

---

## 技术细节

### CSS Grid 布局动态切换

```typescript
// 动态设置网格行列
<div
  ref={viewportsGridRef}
  className="mpr-viewports"
  style={{
    gridTemplateColumns: getGridTemplateColumns(currentLayout),
    gridTemplateRows: getGridTemplateRows(currentLayout),
  }}
>
  {/* 视口内容 */}
</div>
```

### 视口容器布局

```css
.viewport-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-width: 0;
  height: 100%;
}

.mpr-viewports {
  flex: 1;
  display: grid;
  gap: 2px;
  background-color: #000;
  padding: 2px;
  overflow: hidden;
}
```

---

## 测试验证

### 测试场景

1. **横向布局 (grid-1x3)**
   - 三个视口水平排列
   - 每个视口高度占满可用空间
   - 图像自动适应视口大小

2. **纵向布局 (grid-3x1)**
   - 三个视口垂直排列
   - 每个视口宽度占满可用空间
   - 所有视口完整显示，无裁剪
   - 图像自动适应视口大小

3. **布局切换**
   - 从横向切换到纵向
   - 从纵向切换到横向
   - 切换后图像自动 fit to window

### 验证要点

- ✅ 布局命名与实际显示一致
- ✅ 所有视口完整显示，无裁剪
- ✅ 图像自动适应视口大小
- ✅ 切换过程流畅，无闪烁

---

## 相关文件

- **主组件**: `src/MPRViewer.tsx`
- **样式文件**: `src/index.css`
- **布局面板**: `src/components/panels/EnhancedLayoutPanel.tsx`

---

## 参考资料

- [CSS Grid Layout - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Cornerstone3D Viewport API](https://www.cornerstonejs.org/reference/current/viewport/viewport)
- [VIEWPORT_LAYOUT_SWITCHING.md](VIEWPORT_LAYOUT_SWITCHING.md) - 视口布局切换详细指南

---

**更新日期**: 2025-01-21
**维护者**: Claude Code
