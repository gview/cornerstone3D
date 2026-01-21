# 双击视口放大功能修复文档

本文档详细记录了双击视口放大/还原功能的实现过程以及遇到的问题和解决方案。

---

## 问题描述

### 初始需求
实现双击视口放大/还原功能：
- 双击任意视口，将其放大占满整个视口区域
- 再次双击放大的视口，恢复到原始布局

### 遇到的问题

1. **"Viewport is too small 0 0" 错误**
   - 使用 `display: none` 隐藏视口后，视口尺寸变为 0×0
   - `renderingEngine.resize()` 仍然处理隐藏的视口，触发错误

2. **ScaleOverlayTool NaN 错误**
   - 缩放比例工具在 0×0 尺寸的视口上计算，产生 NaN 值
   - 导致 SVG transform 属性错误

3. **图像缩放比例不正确**
   - 放大和还原后，图像没有正确适应视口大小

---

## 解决方案

### 1. 使用 CSS 类移出视口而不是隐藏

**问题代码**:
```tsx
// ❌ 使用 display: none 会导致视口尺寸为 0
<div
  className={`viewport-container...`}
  style={{ display: isMaximized && maximizedViewportId !== 'AXIAL' ? 'none' : 'block' }}
  onClick={() => handleViewportClick('AXIAL')}
  onDoubleClick={() => handleViewportDoubleClick('AXIAL')}
>
```

**修复代码**:
```tsx
// ✅ 使用 CSS 类将视口移出屏幕
<div
  className={`viewport-container${activeViewportId === 'AXIAL' ? ' active' : ''}${isMaximized && maximizedViewportId === 'AXIAL' ? ' maximized' : ''}${isMaximized && maximizedViewportId !== 'AXIAL' ? ' viewport-container-hidden' : ''}`}
  onClick={() => handleViewportClick('AXIAL')}
  onDoubleClick={() => handleViewportDoubleClick('AXIAL')}
>
```

**CSS 样式**:
```css
/* 放大模式下隐藏其他视口 - 使用绝对定位移出视口 */
.viewport-container-hidden {
  position: fixed !important;
  left: -9999px !important;
  top: -9999px !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
```

**优势**:
- 视口被移到屏幕外，但仍然保持有效尺寸
- `renderingEngine.resize()` 不会报错
- `ScaleOverlayTool` 可以正常计算
- 不会触发 "Viewport is too small" 错误

### 2. 双击处理逻辑

**完整实现**:
```typescript
const handleViewportDoubleClick = (viewportId: string) => {
  if (!renderingEngine) return;

  if (isMaximized && maximizedViewportId === viewportId) {
    // 当前视口已放大，还原到原始布局
    console.log(`🔄 还原视口: ${viewportId}`);

    // 恢复原始布局
    setCurrentLayout(layoutBeforeMaximize);
    setIsMaximized(false);
    setMaximizedViewportId(null);

    // 等待 DOM 更新后重置所有视口并强制渲染
    setTimeout(() => {
      // 首先调用 resize 让渲染引擎重新计算所有视口
      renderingEngine!.resize(true, true);

      // 然后重置所有视口的相机
      viewportIds.forEach((vpId) => {
        try {
          const viewport = renderingEngine!.getViewport(vpId) as Types.IVolumeViewport;
          if (viewport) {
            viewport.resetCamera();
          }
        } catch (error) {
          console.warn(`⚠️ 重置视口 ${vpId} 失败:`, error);
        }
      });

      // 再次 resize 确保视口大小正确
      renderingEngine!.resize(true, true);

      // 渲染所有视口
      renderingEngine!.renderViewports(viewportIds);

      console.log(`✅ 已还原到布局: ${layoutBeforeMaximize}`);
    }, 300);
  } else if (!isMaximized) {
    // 没有视口被放大，放大当前视口
    console.log(`🔍 放大视口: ${viewportId}`);

    // 保存当前布局
    setLayoutBeforeMaximize(currentLayout);
    setIsMaximized(true);
    setMaximizedViewportId(viewportId);

    // 切换到单视口布局
    setCurrentLayout('grid-1x1');

    // 等待 DOM 更新后重置放大视口
    setTimeout(() => {
      // 先调用 resize
      renderingEngine!.resize(true, true);

      // 重置相机以适应新的单视口布局
      try {
        const viewport = renderingEngine!.getViewport(viewportId) as Types.IVolumeViewport;
        if (viewport) {
          viewport.resetCamera();
        }
      } catch (error) {
        console.warn(`⚠️ 重置视口 ${viewportId} 失败:`, error);
      }

      // 再次 resize 确保视口大小正确
      renderingEngine!.resize(true, true);

      // 渲染所有视口（隐藏的视口不会被实际渲染）
      renderingEngine!.renderViewports(viewportIds);

      console.log(`✅ 视口 ${viewportId} 已放大`);
    }, 300);
  }
};
```

**关键点**:
1. **双次 resize**: 在 `resetCamera()` 前后各调用一次 `resize()`，确保视口尺寸正确
2. **延迟处理**: 使用 300ms 延迟确保 DOM 更新和 CSS 样式生效
3. **渲染所有视口**: 调用 `renderViewports(viewportIds)` 而不是只渲染一个视口，避免状态丢失
4. **状态管理**: 正确保存和恢复原始布局状态

---

## 技术细节

### 为什么不能使用 display: none？

1. **尺寸问题**:
   - `display: none` 的元素在 DOM 中不占空间
   - `element.clientWidth` 和 `element.clientHeight` 返回 0
   - Cornerstone3D 的 `resize()` 方法会检查视口尺寸，太小则报错

2. **WebGL 上下文**:
   - 视口的 WebGL 上下文与 DOM 元素尺寸绑定
   - 0×0 尺寸会导致渲染错误

3. **工具计算错误**:
   - `ScaleOverlayTool` 等工具依赖视口尺寸计算比例
   - 0 尺寸导致除以 0 或 NaN 值

### 为什么 position: fixed + left: -9999px 有效？

1. **保持尺寸**:
   - 元素仍然存在于 DOM 中
   - 保持原有的宽度和高度
   - `clientWidth` 和 `clientHeight` 返回有效值

2. **视觉隐藏**:
   - 移到屏幕外，用户看不到
   - `visibility: hidden` 确保不响应鼠标事件
   - `pointer-events: none` 禁用交互

3. **渲染引擎兼容**:
   - Cornerstone3D 可以正常获取视口尺寸
   - `resize()` 方法不会报错
   - WebGL 上下文保持有效

---

## 参考资源

- [Cornerstone3D GitHub](https://github.com/cornerstonejs/cornerstone3D)
- [Cornerstone.js Examples](https://cornerstonejs.org/docs/examples/)
- [OHIF Viewers Issue #2266](https://github.com/OHIF/Viewers/issues/2266) - 双击视口放大功能讨论

---

## 相关文件

- **主组件**: [src/MPRViewer.tsx](src/MPRViewer.tsx)
- **样式文件**: [src/index.css](src/index.css)
- **功能文档**: [VIEWPORT_DOUBLE_CLICK_FEATURE.md](VIEWPORT_DOUBLE_CLICK_FEATURE.md)
- **布局优化**: [LAYOUT_OPTIMIZATION.md](LAYOUT_OPTIMIZATION.md)

---

**创建日期**: 2025-01-21
**维护者**: Claude Code
**状态**: ✅ 已完成
