# 增强型布局面板使用指南

## 概述

增强型布局面板（`EnhancedLayoutPanel`）是 MPR Viewer 的核心布局管理组件,提供了两种布局模式:
- **网格布局**: 自定义行列排列的通用视口布局
- **协议布局**: 预定义的专业医学图像视图配置

## 组件特性

### ✨ 主要特性

1. **双模式切换**
   - Tab 切换设计,快速在网格布局和协议布局间切换
   - 自动检测当前布局类型并切换到对应 Tab

2. **网格布局 (9种)**
   - 1×1 单视图
   - 1×2 / 2×1 双视图
   - 2×2 四视图
   - 3×1 / 1×3 三视图
   - 3×2 / 2×3 六视图
   - 3×3 九视图

3. **协议布局 (8种)**
   - MPR 三视图 (标准 MPR)
   - 3D 四视图
   - 3D 主视图
   - 轴位主视图
   - 仅 3D
   - 3D 为主
   - 帧视图
   - 高级视图

4. **UI/UX 优化**
   - 响应式设计,适配不同屏幕尺寸
   - 平滑动画过渡
   - 清晰的选中状态指示
   - 图标 + 文字双重标识
   - 悬停效果增强交互体验

---

## 安装与导入

```tsx
import EnhancedLayoutPanel, { ViewportLayout } from './components/panels/EnhancedLayoutPanel';
```

---

## 基础用法

### 1. 简单集成

```tsx
import React, { useState } from 'react';
import EnhancedLayoutPanel from './components/panels/EnhancedLayoutPanel';

function App() {
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<ViewportLayout>('grid-1x1');

  const handleLayoutChange = (layout: ViewportLayout) => {
    setCurrentLayout(layout);
    console.log('布局切换到:', layout);
  };

  return (
    <div>
      {/* 触发按钮 */}
      <button onClick={() => setIsLayoutOpen(true)}>
        打开布局面板
      </button>

      {/* 布局面板 */}
      <EnhancedLayoutPanel
        isOpen={isLayoutOpen}
        onClose={() => setIsLayoutOpen(false)}
        currentLayout={currentLayout}
        onLayoutChange={handleLayoutChange}
      />
    </div>
  );
}
```

### 2. 与工具栏集成

```tsx
import React, { useState } from 'react';
import { IconButton } from './components/common';
import EnhancedLayoutPanel from './components/panels/EnhancedLayoutPanel';

function Toolbar() {
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<ViewportLayout>('grid-1x1');

  return (
    <div className="toolbar">
      {/* 布局切换按钮 */}
      <IconButton
        icon="▦"
        onClick={() => setLayoutPanelOpen(true)}
        tooltip="切换视口布局"
        active={layoutPanelOpen}
      />

      {/* 布局面板 */}
      <EnhancedLayoutPanel
        isOpen={layoutPanelOpen}
        onClose={() => setLayoutPanelOpen(false)}
        currentLayout={currentLayout}
        onLayoutChange={(layout) => {
          setCurrentLayout(layout);
          // 触发布局切换逻辑
          applyViewportLayout(layout);
        }}
      />
    </div>
  );
}
```

---

## 布局类型详解

### 网格布局类型

网格布局使用 `grid-{rows}x{cols}` 命名规范:

```typescript
type GridLayout =
  | 'grid-1x1'  // 1行1列
  | 'grid-1x2'  // 1行2列
  | 'grid-2x1'  // 2行1列
  | 'grid-2x2'  // 2行2列
  | 'grid-3x1'  // 3行1列
  | 'grid-1x3'  // 1行3列
  | 'grid-3x2'  // 3行2列
  | 'grid-2x3'  // 2行3列
  | 'grid-3x3'; // 3行3列
```

**特点**:
- 灵活的行列配置
- 适合需要自定义视口数量的场景
- 视口平均分配空间
- 支持不同的数据显示需求

### 协议布局类型

协议布局是预定义的专业医学图像视图配置:

```typescript
type ProtocolLayout =
  | 'mpr'           // MPR 三视图 (轴向、冠状、矢状)
  | 'advanced'      // 高级自定义视图
  | '3d-four-up'    // 3D 四视图
  | '3d-main'       // 3D 主视图
  | 'axial-primary' // 轴位主视图
  | '3d-only'       // 仅 3D 视图
  | '3d-primary'    // 3D 为主视图
  | 'frame-view';   // 帧视图
```

**特点**:
- 基于医学影像工作流优化
- 内置视口同步配置
- 预定义的视口方向和显示选项
- 适合专业的医学影像诊断

---

## 高级用法

### 1. 与 Cornerstone3D 集成

```tsx
import { ViewportGridService } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';

function MPRViewer() {
  const [currentLayout, setCurrentLayout] = useState<ViewportLayout>('grid-1x1');
  const viewportGridService = servicesManager.services.ViewportGridService;

  const handleLayoutChange = async (layout: ViewportLayout) => {
    setCurrentLayout(layout);

    // 网格布局处理
    if (layout.startsWith('grid-')) {
      const [, rows, cols] = layout.split('-')[1].split('x').map(Number);
      await viewportGridService.setLayout({
        layoutType: 'grid',
        numRows: rows,
        numCols: cols,
        findOrCreateViewport: /* ... */,
        isHangingProtocolLayout: false,
      });
    }
    // 协议布局处理
    else {
      const protocolId = layout;
      await hangingProtocolService.setProtocol(protocolId);
    }
  };

  return (
    <EnhancedLayoutPanel
      isOpen={layoutOpen}
      onClose={() => setLayoutOpen(false)}
      currentLayout={currentLayout}
      onLayoutChange={handleLayoutChange}
    />
  );
}
```

### 2. 自定义布局配置

```tsx
// 扩展布局选项
const customGridLayouts: GridLayoutOption[] = [
  ...gridLayouts,
  {
    id: 'grid-4x4',
    name: '4×4 十六视图',
    icon: '⊞',
    rows: 4,
    cols: 4,
    category: 'Grid',
  },
];

const customProtocolLayouts: ProtocolLayoutOption[] = [
  ...protocolLayouts,
  {
    id: 'pet-ct-fusion',
    name: 'PET-CT 融合',
    icon: '⚛',
    description: 'PET 与 CT 融合视图',
    category: 'Protocol',
  },
];
```

### 3. 布局状态持久化

```tsx
import { useEffect } from 'react';

function PersistentLayoutPanel() {
  const [currentLayout, setCurrentLayout] = useState<ViewportLayout>(() => {
    // 从 localStorage 恢复上次布局
    const saved = localStorage.getItem('viewport-layout');
    return saved ? JSON.parse(saved) : 'grid-1x1';
  });

  useEffect(() => {
    // 保存布局到 localStorage
    localStorage.setItem('viewport-layout', JSON.stringify(currentLayout));
  }, [currentLayout]);

  const handleLayoutChange = (layout: ViewportLayout) => {
    setCurrentLayout(layout);
    // 应用布局...
  };

  return (
    <EnhancedLayoutPanel
      isOpen={isOpen}
      onClose={onClose}
      currentLayout={currentLayout}
      onLayoutChange={handleLayoutChange}
    />
  );
}
```

---

## API 参考

### Props

| 属性 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `isOpen` | `boolean` | ✅ | 控制面板显示/隐藏 |
| `onClose` | `() => void` | ✅ | 关闭面板的回调函数 |
| `currentLayout` | `ViewportLayout` | ✅ | 当前激活的布局类型 |
| `onLayoutChange` | `(layout: ViewportLayout) => void` | ✅ | 布局切换的回调函数 |

### ViewportLayout 类型

```typescript
type ViewportLayout =
  // 网格布局
  | 'grid-1x1' | 'grid-1x2' | 'grid-2x1' | 'grid-2x2'
  | 'grid-3x1' | 'grid-1x3' | 'grid-3x2' | 'grid-2x3' | 'grid-3x3'
  // 协议布局
  | 'mpr' | 'advanced' | '3d-four-up' | '3d-main'
  | 'axial-primary' | '3d-only' | '3d-primary' | 'frame-view';
```

---

## 样式定制

### CSS 变量

组件使用内联样式定义,但可以通过修改源代码中的颜色值来自定义主题:

```css
/* 主题色 */
--primary-color: #007acc;
--bg-primary: #1e1e1e;
--bg-secondary: #2d2d30;
--bg-tertiary: #3c3c3c;
--border-color: #3e3e42;
--text-primary: #cccccc;
--text-secondary: #858585;
```

### 自定义样式

如果需要覆盖默认样式,可以通过创建一个样式包装器:

```tsx
const CustomLayoutPanel = ({ customStyles, ...props }) => {
  return (
    <div style={customStyles}>
      <EnhancedLayoutPanel {...props} />
    </div>
  );
};
```

---

## 最佳实践

### 1. 布局选择策略

**使用网格布局的场景**:
- 需要灵活的视口数量配置
- 不同视口显示不同的数据系列
- 用户需要自定义工作空间
- 对比多个病例或时间点

**使用协议布局的场景**:
- 标准的医学影像诊断流程
- 需要视口间同步（如 MPR 十字线）
- 特定的影像学检查类型（如 PET-CT）
- 需要预定义的专业视图配置

### 2. 性能优化

```tsx
// 使用 React.memo 避免不必要的重渲染
const MemoizedLayoutPanel = React.memo(EnhancedLayoutPanel);

// 使用 useCallback 缓存回调函数
const handleLayoutChange = useCallback((layout: ViewportLayout) => {
  setCurrentLayout(layout);
  applyLayout(layout);
}, [/* 依赖项 */]);

// 防抖处理快速切换
import { debounce } from 'lodash';

const debouncedLayoutChange = debounce(
  (layout: ViewportLayout) => {
    applyLayout(layout);
  },
  300
);
```

### 3. 错误处理

```tsx
const handleLayoutChange = (layout: ViewportLayout) => {
  try {
    // 验证布局切换条件
    if (layout.startsWith('grid-') && !hasEnoughViewports(layout)) {
      throw new Error('当前数据不足以填充所有视口');
    }

    // 应用布局
    applyLayout(layout);
    setCurrentLayout(layout);
  } catch (error) {
    console.error('布局切换失败:', error);
    // 显示错误提示
    showNotification({
      type: 'error',
      message: `无法切换到 ${layout} 布局: ${error.message}`,
    });
  }
};
```

---

## 故障排查

### 常见问题

**Q1: 布局面板显示位置不对?**
A: 确保父容器有 `position: relative` 或使用固定定位。

**Q2: Tab 切换不工作?**
A: 检查 `activeTab` 状态是否正确初始化和更新。

**Q3: 布局切换后视口显示异常?**
A: 确保布局切换前有足够的 DisplaySet 数据,并正确实现了 `findOrCreateViewport` 函数。

**Q4: 样式冲突?**
A: 由于使用了内联样式,通常不会冲突。如果仍有问题,检查是否有全局样式覆盖。

---

## 示例代码

完整示例请参考:
- [MPRViewer.tsx](../src/MPRViewer.tsx) - 主应用组件
- [Toolbar.tsx](../src/components/Toolbar.tsx) - 工具栏集成
- [LayoutPanel Demo](../examples/layout-panel-demo.tsx) - 独立演示

---

## 更新日志

- **v1.0.0** (2025-01-21)
  - 初始版本
  - 支持网格布局和协议布局
  - Tab 切换功能
  - 响应式设计
  - 动画效果

---

## 相关资源

- [Cornerstone3D 视口布局文档](../VIEWPORT_LAYOUT_SWITCHING.md)
- [OHIF Hanging Protocol 指南](https://docs.ohif.org/guides/developers/hanging-protocols)
- [Cornerstone3D 官方文档](https://www.cornerstonejs.org/)
