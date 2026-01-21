# 双击视口放大/还原功能

本文档详细说明了 MPR Viewer 的双击视口放大/还原功能。

---

## 功能概述

用户可以**双击任意视口**来：
- 🔍 **放大**：将当前视口放大占满整个视口区域，隐藏其他视口
- 🔄 **还原**：再次双击已放大的视口，恢复到之前的布局

---

## 使用方法

### 放大视口

1. 在多视口布局下（如 1×3 或 3×1），**双击**任意一个视口
2. 该视口会放大占满整个视口区域
3. 其他视口会被隐藏
4. 放大的视口会有特殊的绿色边框高亮显示

### 还原视口

1. 在放大模式下，**双击**当前放大的视口
2. 视口会恢复到之前的布局（如 1×3 或 3×1）
3. 所有视口重新显示
4. 视口会自动适应新的布局大小

---

## 技术实现

### 状态管理

```typescript
// 放大模式状态
const [isMaximized, setIsMaximized] = useState<boolean>(false);
const [maximizedViewportId, setMaximizedViewportId] = useState<string | null>(null);
const [layoutBeforeMaximize, setLayoutBeforeMaximize] = useState<ViewportLayout>('grid-1x3');
```

**状态说明**:
- `isMaximized`: 是否处于放大模式
- `maximizedViewportId`: 当前放大的视口ID（如 'AXIAL', 'SAGITTAL', 'CORONAL'）
- `layoutBeforeMaximize`: 放大前的布局类型（用于还原）

### 双击处理逻辑

```typescript
const handleViewportDoubleClick = (viewportId: string) => {
  if (!renderingEngine) return;

  if (isMaximized && maximizedViewportId === viewportId) {
    // 还原视口
    console.log(`🔄 还原视口: ${viewportId}`);

    // 恢复原始布局
    setCurrentLayout(layoutBeforeMaximize);
    setIsMaximized(false);
    setMaximizedViewportId(null);

    // 等待 DOM 更新后重置所有视口
    setTimeout(() => {
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

      if (renderingEngine) {
        renderingEngine.resize(true, true);
        renderingEngine.renderViewports(viewportIds);
      }

      console.log(`✅ 已还原到布局: ${layoutBeforeMaximize}`);
    }, 150);
  } else if (!isMaximized) {
    // 放大视口
    console.log(`🔍 放大视口: ${viewportId}`);

    // 保存当前布局
    setLayoutBeforeMaximize(currentLayout);
    setIsMaximized(true);
    setMaximizedViewportId(viewportId);

    // 切换到单视口布局
    setCurrentLayout('grid-1x1');

    // 等待 DOM 更新后重置放大视口
    setTimeout(() => {
      try {
        const viewport = renderingEngine!.getViewport(viewportId) as Types.IVolumeViewport;
        if (viewport) {
          viewport.resetCamera();
        }
      } catch (error) {
        console.warn(`⚠️ 重置视口 ${viewportId} 失败:`, error);
      }

      if (renderingEngine) {
        renderingEngine.resize(true, true);
        renderingEngine.renderViewports([viewportId]);
      }

      console.log(`✅ 视口 ${viewportId} 已放大`);
    }, 150);
  }
};
```

### 视口渲染逻辑

每个视口容器添加了：
- **双击事件处理器**: `onDoubleClick={() => handleViewportDoubleClick(viewportId)}`
- **显示控制**: 通过 `style={{ display: isMaximized && maximizedViewportId !== viewportId ? 'none' : 'block' }}` 控制其他视口的显示/隐藏
- **放大样式**: 添加 `maximized` CSS 类来标识放大状态

```typescript
<div
  className={`viewport-container${activeViewportId === 'AXIAL' ? ' active' : ''}${isMaximized && maximizedViewportId === 'AXIAL' ? ' maximized' : ''}`}
  style={{ display: isMaximized && maximizedViewportId !== 'AXIAL' ? 'none' : 'block' }}
  onClick={() => handleViewportClick('AXIAL')}
  onDoubleClick={() => handleViewportDoubleClick('AXIAL')}
>
  {/* 视口内容 */}
</div>
```

### CSS 样式

```css
/* 放大视口样式 */
.viewport-container.maximized {
  border: 3px solid #00d084;
  box-shadow:
    0 0 16px rgba(0, 208, 132, 0.8),
    inset 0 0 30px rgba(0, 208, 132, 0.15);
  z-index: 20;
}
```

---

## 用户体验优化

### 视觉反馈

1. **放大状态标识**:
   - 绿色边框（#00d084）
   - 更强的阴影效果
   - 更高的 z-index 层级

2. **布局过渡**:
   - 使用 150ms 延迟确保 DOM 更新完成
   - 自动调用 `resetCamera()` 重置图像大小
   - 平滑的过渡动画

### 错误处理

- 检查 `renderingEngine` 是否存在
- Try-catch 包裹视口操作
- 控制台输出详细的操作日志

---

## 限制与注意事项

1. **单击 vs 双击**:
   - 单击：激活视口（设置 `activeViewportId`）
   - 双击：放大/还原视口
   - 两个操作互不干扰

2. **放大模式下的行为**:
   - 只有当前放大的视口可以双击还原
   - 双击其他（隐藏的）视口不会触发操作
   - 必须先还原才能放大其他视口

3. **布局切换**:
   - 放大时会保存当前布局（`layoutBeforeMaximize`）
   - 还原时恢复到原始布局
   - 如果在放大模式下切换布局，会自动还原

---

## 未来改进方向

1. **键盘快捷键**:
   - ESC 键快速还原
   - Space 键切换放大/还原

2. **拖拽调整**:
   - 拖拽视口边缘调整大小
   - 自定义视口布局

3. **多级放大**:
   - 支持部分放大（如 2/3 屏幕）
   - 支持并排比较模式

---

## 相关文件

- **主组件**: `src/MPRViewer.tsx`
- **样式文件**: `src/index.css`
- **相关文档**:
  - [LAYOUT_OPTIMIZATION.md](LAYOUT_OPTIMIZATION.md)
  - [VIEWPORT_LAYOUT_SWITCHING.md](VIEWPORT_LAYOUT_SWITCHING.md)

---

**实现日期**: 2025-01-21
**维护者**: Claude Code
