# 工具栏重构 - 分离按钮实现

## 概述

本文档记录了 MPR Viewer 工具栏的重构工作，主要包括：
1. **分离按钮组件（SplitButton）**：主按钮 + 下拉菜单的组合按钮
2. **工具互斥逻辑**：十字线、窗宽窗位、测量工具互斥激活
3. **默认状态优化**：默认激活窗宽窗位工具

## 组件架构

### 1. SplitButton 组件

**文件位置**: `src/components/common/SplitButton.tsx`

**功能特性**：
- 主按钮：显示当前选中的测量工具图标，点击直接激活该工具
- 下拉按钮：点击展开测量工具菜单
- 下拉菜单：使用 Portal 渲染到 body，避免被父容器 overflow 裁剪
- 点击外部自动关闭菜单

**关键实现**：
```tsx
// Portal 渲染菜单，避免 overflow 裁剪
{isOpen && createPortal(
  <div ref={menuRef} className="split-button-menu" style={menuPosition}>
    {menuItems.map(item => (
      <button key={item.id} onClick={() => handleMenuClick(item)}>
        {item.label}
      </button>
    ))}
  </div>,
  document.body
)}
```

**Props 定义**：
```tsx
export interface SplitButtonProps {
  icon: string;           // 主按钮图标
  tooltip: string;        // 主按钮提示文本
  active?: boolean;       // 主按钮是否激活
  disabled?: boolean;     // 是否禁用
  onPrimaryClick: () => void;  // 主按钮点击回调
  menuItems: Array<{      // 下拉菜单项列表
    id: string;
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }>;
  isOpen?: boolean;       // 下拉菜单是否打开
  onToggleMenu: (open: boolean) => void;  // 菜单打开/关闭回调
}
```

### 2. 工具栏布局

**文件位置**: `src/components/Toolbar.tsx`

**工具栏分组**：

1. **文件操作组**
   - 📁 加载 DICOM 文件
   - 📚 序列面板
   - 📏 测量面板

2. **布局切换组**
   - ↕️ 布局切换按钮（下拉菜单）
   - 🔄 重置布局

3. **十字线和窗宽窗位控制组**
   - 🎯 十字线按钮（独立按钮）
   - 🎨 窗宽窗位按钮（独立按钮）

4. **测量工具组**
   - 📏 分离按钮（主按钮显示当前测量工具，下拉菜单显示所有测量工具）

5. **工具设置组**
   - ⚙️ 工具设置面板（工具模式、删除测量）

6. **视图控制组**
   - ↻ 旋转控制
   - 🔄 重置旋转
   - ⚙️ 视图设置面板

### 3. 工具互斥逻辑

**文件位置**: `src/MPRViewer.tsx`

**状态管理**：
```tsx
// 当前激活的工具名称
const [activeTool, setActiveTool] = useState<string>(WindowLevelTool.toolName);

// 工具模式状态：记录每个工具的当前模式
const [toolModes, setToolModes] = useState<Record<string, string>>({
  Crosshairs: ToolModes.Disabled,   // 默认禁用
  WindowLevel: ToolModes.Active,     // 默认激活
  Length: ToolModes.Passive,
  Angle: ToolModes.Passive,
  // ... 其他测量工具
});

// 十字线显示状态
const [showCrosshairs, setShowCrosshairs] = useState<boolean>(false);

// 窗宽窗位激活状态
const [isWindowLevelActive, setIsWindowLevelActive] = useState<boolean>(true);
```

**工具切换逻辑**：
```tsx
const handleToolChange = (toolName: string) => {
  // 如果要启用测量工具，需要先禁用十字线和窗宽窗位
  if (toolName !== 'Crosshairs' && toolName !== 'WindowLevel') {
    // 禁用十字线
    if (toolGroup.hasTool(CrosshairsTool.toolName)) {
      toolGroup.setToolDisabled(CrosshairsTool.toolName);
      if (showCrosshairs) {
        setShowCrosshairs(false);
      }
    }

    // 禁用窗宽窗位
    if (isWindowLevelActive) {
      setIsWindowLevelActive(false);
      toolGroup.setToolDisabled(WindowLevelTool.toolName);
    }
  }

  // 激活选中的工具
  toolGroup.setToolActive(toolName, {
    bindings: [{ mouseButton: MouseBindings.Primary }],
  });

  setActiveTool(toolName);
};
```

**工具激活状态判断**：
```tsx
// 测量工具的激活状态
const activeMeasurementTool = React.useMemo(() => {
  // 只有当没有激活十字线或窗宽窗位时，才显示测量工具为激活
  if (showCrosshairs || isWindowLevelActive) {
    return {
      ...measurementMenuItems[0],
      active: false,  // 不显示为激活状态
    };
  }
  return measurementMenuItems.find(item => item.active) || measurementMenuItems[0];
}, [measurementMenuItems, showCrosshairs, isWindowLevelActive]);

// 测量菜单项的激活状态
const measurementMenuItems = React.useMemo(() => {
  return allTools.map(tool => ({
    ...tool,
    active: activeTool === tool.name && !showCrosshairs && !isWindowLevelActive,
  }));
}, [activeTool, showCrosshairs, isWindowLevelActive]);
```

## CSS 样式

### SplitButton 样式

**文件位置**: `src/components/common/SplitButton.css`

**关键样式**：
```css
.split-button-container {
  display: flex;
  align-items: center;
  gap: 0;
}

.split-button-primary {
  border-radius: 6px 0 0 6px;
  width: 36px;
  height: 36px;
}

.split-button-dropdown {
  border-radius: 0 6px 6px 0;
  border-left: none;
}

.split-button-menu {
  position: fixed;
  z-index: 9999;  /* 确保菜单显示在最上层 */
  min-width: 180px;
  max-height: 300px;
  overflow-y: auto;
}
```

### IconButton 点击反馈

**文件位置**: `src/components/common/IconButton.css`

**立即视觉反馈**：
```css
.icon-button:active:not(:disabled) {
  transform: scale(0.95);
  background: #2a2a2a;
}
```

## 关键问题解决

### 问题 1: 下拉菜单被工具栏 overflow 裁剪

**问题描述**：
工具栏使用了 `overflow-x: auto`，导致下拉菜单被裁剪。

**解决方案**：
使用 React Portal 将菜单渲染到 document.body：
```tsx
{isOpen && createPortal(
  <div ref={menuRef} className="split-button-menu" style={menuPosition}>
    {/* 菜单项 */}
  </div>,
  document.body
)}
```

### 问题 2: 点击菜单项后菜单不关闭

**问题描述**：
点击菜单项时，点击外部事件监听器先触发，导致菜单关闭，onClick 无法执行。

**解决方案**：
添加 menuRef 来追踪菜单元素：
```tsx
const menuRef = useRef<HTMLDivElement>(null);

const handleClickOutside = (event: MouseEvent) => {
  const clickedInsideButton = containerRef.current?.contains(event.target as Node);
  const clickedInsideMenu = menuRef.current?.contains(event.target as Node);

  if (isOpen && !clickedInsideButton && !clickedInsideMenu) {
    onToggleMenu(false);
  }
};
```

### 问题 3: 按钮点击状态延迟更新

**问题描述**：
点击按钮后，状态更新有延迟，需要鼠标移开才显示激活状态。

**解决方案**：
添加 CSS :active 伪类提供立即视觉反馈：
```css
.icon-button:active:not(:disabled) {
  transform: scale(0.95);
  background: #2a2a2a;
}
```

### 问题 4: 工具状态初始化不一致

**问题描述**：
`toolModes` 初始状态与实际工具激活状态不一致，导致意外行为。

**解决方案**：
确保初始状态与默认工具一致：
```tsx
const [toolModes, setToolModes] = useState<Record<string, string>>({
  Crosshairs: ToolModes.Disabled,   // 与 showCrosshairs: false 一致
  WindowLevel: ToolModes.Active,     // 与 isWindowLevelActive: true 一致
  Length: ToolModes.Passive,
  // ... 其他工具
});
```

## 使用示例

### 使用 SplitButton 组件

```tsx
import SplitButton from './components/common/SplitButton';

const menuItems = [
  { id: 'Length', icon: '📏', label: '长度测量', active: false, onClick: () => {} },
  { id: 'Angle', icon: '📐', label: '角度测量', active: false, onClick: () => {} },
];

<SplitButton
  icon="📏"
  tooltip="长度测量"
  active={false}
  disabled={false}
  onPrimaryClick={() => console.log('主按钮点击')}
  menuItems={menuItems}
  isOpen={false}
  onToggleMenu={(open) => console.log('菜单状态:', open)}
/>
```

## 总结

本次重构实现了：

1. ✅ 创建了通用的 SplitButton 组件，支持主按钮 + 下拉菜单
2. ✅ 实现了十字线、窗宽窗位、测量工具的互斥逻辑
3. ✅ 优化了默认状态，默认激活窗宽窗位工具
4. ✅ 解决了下拉菜单被裁剪、点击状态延迟等问题
5. ✅ 使用 Portal 渲染菜单，避免 overflow 裁剪
6. ✅ 添加了立即视觉反馈，提升用户体验

## 相关文档

- [工具栏优化指南](TOOLBAR_OPTIMIZATION.md)
- [工具栏重构总结](TOOLBAR_REFACTOR_SUMMARY.md)
- [工具栏动态图标更新](TOOLBAR_DYNAMIC_ICON_UPDATE.md)
- [工具组架构修复](TOOLGROUP_ARCHITECTURE_FIX.md)
