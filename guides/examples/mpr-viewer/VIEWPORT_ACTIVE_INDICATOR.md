# 视口激活提示功能实现方案

## 概述

视口激活提示功能为 MPR Viewer 提供了清晰的视觉反馈，帮助用户识别当前正在操作的视口。当用户点击或与视口交互时，激活的视口会显示明显的高亮效果。

**实现时间**: 2025-01-21
**版本**: v1.0.0
**状态**: ✅ 已完成

---

## 功能特性

### 核心功能

- ✅ **激活视口边框高亮** - 2px 蓝色边框 + 外发光效果
- ✅ **视口名称标签高亮** - 渐变背景 + 阴影效果
- ✅ **平滑过渡动画** - 0.2s ease-in-out 过渡
- ✅ **悬停效果** - 激活/非激活视口不同的悬停反馈
- ✅ **信息覆盖层高亮** - 所有覆盖元素统一高亮主题

### 视觉效果

| 状态 | 边框 | 背景效果 | 信息标签 | 光晕效果 |
|------|------|----------|----------|----------|
| **激活** | 2px 蓝色 (#007acc) | 内嵌微光 | 蓝绿渐变高亮 | 蓝色外发光 |
| **悬停** | 2px 绿色 (#00d084) | 绿色内嵌 | 绿色高亮 | 绿色外发光 |
| **非激活** | 1px 灰色 (#333) | 无 | 普通显示 | 无 |

---

## 技术实现

### 1. 状态管理

**文件**: [MPRViewer.tsx:73](src/MPRViewer.tsx#L73)

```typescript
// 激活视口状态
const [activeViewportId, setActiveViewportId] = useState<string>('AXIAL');
```

- **状态变量**: `activeViewportId` - 存储当前激活的视口 ID
- **初始值**: `'AXIAL'` - 默认激活第一个视口
- **更新方式**: 通过 `setActiveViewportId` 函数更新

### 2. 事件处理

**文件**: [MPRViewer.tsx:1002-1005](src/MPRViewer.tsx#L1002-L1005)

```typescript
// 处理视口激活
const handleViewportClick = (viewportId: string) => {
  setActiveViewportId(viewportId);
  console.log(`✅ 激活视口: ${viewportId}`);
};
```

- **触发方式**: 点击视口容器
- **功能**: 更新激活状态 + 控制台日志
- **扩展性**: 可在此添加其他激活相关逻辑（如工具聚焦、状态持久化等）

### 3. 动态类名绑定

**文件**: [MPRViewer.tsx:1457-1526](src/MPRViewer.tsx#L1457-L1526)

```typescript
<div
  className={`viewport-container${activeViewportId === 'AXIAL' ? ' active' : ''}`}
  onClick={() => handleViewportClick('AXIAL')}
>
  {/* 视口内容 */}
</div>
```

**实现要点**:
- 使用模板动态生成 className
- 条件判断是否添加 `active` 类
- 每个视口独立绑定点击事件
- 传递 `isActive` 属性给 ViewportOverlay 组件

### 4. CSS 样式实现

**文件**: [index.css:126-159](src/index.css#L126-L159)

#### 4.1 基础容器样式

```css
.viewport-container {
  position: relative;
  background-color: #000;
  border: 1px solid #333;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}
```

**关键属性**:
- `transition: all 0.2s ease-in-out` - 平滑过渡动画
- `cursor: pointer` - 鼠标指针提示可点击

#### 4.2 激活状态样式

```css
.viewport-container.active {
  border: 2px solid #007acc;
  box-shadow:
    0 0 8px rgba(0, 122, 204, 0.6),
    inset 0 0 20px rgba(0, 122, 204, 0.1);
  z-index: 10;
}
```

**视觉效果**:
- **边框**: 2px 蓝色实线 (#007acc)
- **外发光**: `box-shadow` 第一层，8px 扩散半径
- **内嵌微光**: `box-shadow` 第二层，inset 效果
- **层级**: `z-index: 10` 确保在最上层

#### 4.3 悬停效果

```css
/* 激活视口悬停 - 绿色 */
.viewport-container.active:hover {
  border-color: #00d084;
  box-shadow:
    0 0 12px rgba(0, 208, 132, 0.6),
    inset 0 0 20px rgba(0, 208, 132, 0.1);
}

/* 非激活视口悬停 - 灰色 */
.viewport-container:hover {
  border-color: #555;
}
```

### 5. ViewportOverlay 组件增强

**文件**: [ViewportOverlay.tsx:21-39,220-265](src/components/ViewportOverlay.tsx)

#### 5.1 Props 接口扩展

```typescript
export interface ViewportOverlayProps {
  // ... 其他属性
  // 激活状态
  isActive?: boolean;
}
```

#### 5.2 激活状态样式注入

**实现方式**: 使用模板字符串动态生成样式

```typescript
/* 激活状态高亮样式 */
${isActive ? `
  /* 视口名称/方位选择器高亮 */
  .viewport-name,
  .orientation-selector {
    background: linear-gradient(135deg, #007acc 0%, #005a9e 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
    transition: all 0.2s ease-in-out !important;
  }

  /* 模态标签高亮 */
  .modality-badge {
    background: linear-gradient(135deg, #00d084 0%, #00a86b 100%) !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
  }

  /* 序列描述、患者信息、图像索引高亮 */
  .series-description,
  .patient-info,
  .image-index {
    background-color: rgba(0, 122, 204, 0.4) !important;
    color: #ffffff !important;
  }

  /* 窗宽窗位高亮 */
  .window-level-item {
    background-color: rgba(0, 122, 204, 0.4) !important;
    color: #ffffff !important;
  }

  .window-level-value {
    color: #00d084 !important;
    font-weight: 600 !important;
  }
` : ''}
```

**高亮元素**:
1. 视口名称/方位选择器 - 蓝色渐变
2. 模态标签 - 绿色渐变
3. 序列描述、患者信息、图像索引 - 蓝色半透明背景
4. 窗宽窗位数值 - 绿色高亮 + 加粗

---

## 设计规范

### 颜色主题

| 用途 | 颜色值 | CSS 变量建议 | 说明 |
|------|--------|-------------|------|
| **主激活色** | `#007acc` | `--color-primary` | 蓝色，用于边框和主高亮 |
| **次激活色** | `#00d084` | `--color-secondary` | 绿色，用于悬停和数值高亮 |
| **渐变起点** | `#007acc` | - | 蓝色渐变起始 |
| **渐变终点** | `#005a9e` | - | 蓝色渐变结束 |
| **绿色渐变起点** | `#00d084` | - | 绿色渐变起始 |
| **绿色渐变终点** | `#00a86b` | - | 绿色渐变结束 |
| **边框默认** | `#333` | `--border-default` | 灰色边框 |
| **边框悬停** | `#555` | `--border-hover` | 浅灰色边框 |

### 动画参数

| 参数 | 值 | 说明 |
|------|-----|------|
| **过渡时长** | `0.2s` | 快速响应，不影响性能 |
| **缓动函数** | `ease-in-out` | 平滑的加速减速 |
| **外发光半径** | `8px` | 激活状态 |
| **悬停光晕半径** | `12px` | 悬停状态 |
| **内嵌深度** | `20px` | inset 阴影深度 |

### 尺寸规范

| 元素 | 尺寸 | 单位 |
|------|------|------|
| **激活边框** | 2 | px |
| **默认边框** | 1 | px |
| **阴影扩散** | 8/12 | px |
| **圆角** | 3 | px |

---

## 使用示例

### 基础用法

```tsx
import React, { useState } from 'react';
import MPRViewer from './MPRViewer';

function App() {
  return (
    <div className="app">
      <MPRViewer />
    </div>
  );
}
```

### 自定义激活逻辑

```typescript
// 在 MPRViewer.tsx 中扩展 handleViewportClick
const handleViewportClick = (viewportId: string) => {
  setActiveViewportId(viewportId);

  // 添加自定义逻辑
  if (renderingEngine) {
    const viewport = renderingEngine.getViewport(viewportId);
    if (viewport) {
      // 聚焦视口
      viewport.resetCamera();

      // 更新工具状态
      updateToolsForViewport(viewportId);
    }
  }

  // 持久化到 localStorage
  localStorage.setItem('lastActiveViewport', viewportId);

  console.log(`✅ 激活视口: ${viewportId}`);
};
```

### 键盘快捷键支持

```typescript
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    // 数字键 1-3 快速切换视口
    const keyMap: Record<string, string> = {
      '1': 'AXIAL',
      '2': 'SAGITTAL',
      '3': 'CORONAL',
    };

    if (keyMap[event.key]) {
      handleViewportClick(keyMap[event.key]);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 扩展功能建议

### 1. 状态持久化

```typescript
// 从 localStorage 恢复上次激活的视口
const [activeViewportId, setActiveViewportId] = useState(() => {
  return localStorage.getItem('lastActiveViewport') || 'AXIAL';
});

// 保存激活状态
useEffect(() => {
  localStorage.setItem('lastActiveViewport', activeViewportId);
}, [activeViewportId]);
```

### 2. 角标指示器

在激活视口的四角添加 L 型标识：

```css
.viewport-container.active::before,
.viewport-container.active::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #007acc;
  border-style: solid;
}

.viewport-container.active::before {
  top: 0;
  left: 0;
  border-width: 3px 0 0 3px;
}

.viewport-container.active::after {
  top: 0;
  right: 0;
  border-width: 3px 3px 0 0;
}
```

### 3. 激活徽章

在视口右上角显示 "ACTIVE" 徽章：

```tsx
{activeViewportId === viewportId && (
  <div className="viewport-active-badge">ACTIVE</div>
)}
```

```css
.viewport-active-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
}
```

### 4. 脉冲动画

初次激活时的脉冲效果：

```css
@keyframes viewport-pulse {
  0%, 100% {
    box-shadow:
      0 0 8px rgba(0, 122, 204, 0.6),
      inset 0 0 20px rgba(0, 122, 204, 0.1);
  }
  50% {
    box-shadow:
      0 0 16px rgba(0, 122, 204, 0.9),
      inset 0 0 30px rgba(0, 122, 204, 0.2);
  }
}

.viewport-container.active.pulse {
  animation: viewport-pulse 0.6s ease-in-out;
}
```

### 5. 工具栏指示器

在工具栏显示当前激活的视口：

```tsx
<div className="active-viewport-indicator">
  <span>激活视口:</span>
  <strong>{activeViewportId}</strong>
</div>
```

---

## 测试清单

### 功能测试

- [ ] 点击视口 A，验证边框变为蓝色高亮
- [ ] 点击视口 B，验证视口 A 高亮消失，视口 B 高亮显示
- [ ] 悬停激活视口，验证边框变为绿色
- [ ] 悬停非激活视口，验证边框变为灰色
- [ ] 验证所有信息标签正确高亮
- [ ] 验证过渡动画流畅（无卡顿）

### 兼容性测试

- [ ] Chrome / Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] 移动端浏览器

### 性能测试

- [ ] 快速切换视口，验证无延迟
- [ ] 同时加载多个视口，验证动画流畅
- [ ] 长时间使用，验证无内存泄漏

---

## 已知问题

### 无

目前未发现已知问题。

---

## 未来改进

1. **自动激活** - 鼠标进入视口时自动激活
2. **触摸支持** - 移动端触摸激活
3. **可配置主题** - 用户自定义颜色主题
4. **动画配置** - 可调节动画速度和效果
5. **多选支持** - 同时激活多个视口进行对比

---

## 相关文件

| 文件 | 说明 |
|------|------|
| [MPRViewer.tsx](src/MPRViewer.tsx) | 主组件，状态管理和事件处理 |
| [ViewportOverlay.tsx](src/components/ViewportOverlay.tsx) | 视口覆盖层组件，高亮样式 |
| [index.css](src/index.css) | 全局样式，视口容器样式 |
| [LAYOUT_PANEL_GUIDE.md](LAYOUT_PANEL_GUIDE.md) | 布局面板使用指南 |

---

## 参考资料

- [Cornerstone3D 官方文档](https://www.cornerstonejs.org/)
- [React 状态管理最佳实践](https://react.dev/learn/managing-state)
- [CSS Transitions 动画指南](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions)

---

**文档版本**: 1.0.0
**最后更新**: 2025-01-21
**维护者**: Claude Code
