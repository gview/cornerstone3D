# 工具栏动态图标更新

## 更新内容

### 1. 动态工具图标

现在工具栏会根据当前选中的工具动态显示图标：

**快速访问工具（十字线、窗宽窗位）：**
- 工具栏显示固定图标
- 下拉按钮显示 "📏" 图标

**其他测量工具（长度、角度、ROI 等）：**
- 工具栏显示一个独立的当前工具图标按钮（激活状态）
- 下拉按钮也显示当前工具的图标

### 2. 工具面板自动关闭

- 从工具面板选择工具后，面板会自动关闭
- 工具栏更新为当前选中的工具图标
- 不需要手动关闭面板，体验更流畅

### 3. 受控下拉面板

- `DropdownButton` 组件现在支持受控模式
- 可以通过 `isOpen`、`onOpen`、`onClose` 属性控制面板状态
- 工具选择后会自动关闭面板

## 技术实现

### 工具图标映射

```tsx
const toolIcons: Record<string, string> = {
  Crosshairs: '🎯',
  WindowLevel: '🎨',
  Length: '📏',
  Angle: '📐',
  Bidirectional: '✛',
  Probe: '🔍',
  RectangleROI: '⬜',
  EllipticalROI: '⭕',
};

const toolLabels: Record<string, string> = {
  Crosshairs: '十字线',
  WindowLevel: '窗宽窗位',
  Length: '长度测量',
  Angle: '角度测量',
  Bidirectional: '双向测量',
  Probe: '探针',
  RectangleROI: '矩形 ROI',
  EllipticalROI: '椭圆 ROI',
};
```

### 工具切换自动关闭面板

```tsx
// 包装工具切换函数，选中后关闭面板
const handleToolChange = (toolName: string) => {
  onToolChange(toolName);
  setToolsPanelOpen(false);
};
```

### 受控下拉面板

```tsx
<DropdownButton
  icon={isQuickAccessTool ? '📏' : currentToolIcon}
  tooltip={isQuickAccessTool ? '更多测量工具' : `切换工具 (当前: ${currentToolLabel})`}
  disabled={!hasVolume}
  active={!isQuickAccessTool}
  isOpen={toolsPanelOpen}
  onOpen={() => setToolsPanelOpen(true)}
  onClose={() => setToolsPanelOpen(false)}
>
  <ToolsPanel
    activeTool={activeTool}
    toolModes={toolModes}
    onToolChange={handleToolChange}  // 使用包装后的函数
    ...
  />
</DropdownButton>
```

## 用户体验改进

### 改进前
1. 点击工具面板选择工具
2. 工具面板保持打开
3. 需要手动关闭面板或点击外部区域
4. 工具栏图标始终是 "📏"

### 改进后
1. 点击工具面板选择工具
2. 工具面板自动关闭 ✨
3. 工具栏显示当前选中的工具图标 ✨
4. 下拉按钮也显示当前工具图标 ✨
5. 鼠标悬停显示当前工具名称 ✨

## 代码变更

### Toolbar.tsx
- 添加工具图标和标签映射
- 添加受控面板状态管理
- 添加 `handleToolChange` 包装函数
- 根据工具类型动态显示图标

### DropdownButton.tsx
- 添加 `isOpen` 属性支持受控模式
- 同时支持受控和非受控模式
- 保持向后兼容性

### MPRViewer.tsx
- 移除 `imageCount` 属性（不再需要显示图像数量）

## 示例场景

### 场景 1：选择长度测量工具

1. 点击工具栏的 "📏 更多测量工具" 按钮
2. 工具面板展开
3. 点击 "📏 长度测量" 工具
4. 工具面板自动关闭
5. 工具栏显示：
   - 一个 "📏" 图标按钮（激活状态，提示 "当前工具: 长度测量"）
   - 下拉按钮也显示 "📏" 图标（提示 "切换工具 (当前: 长度测量)"）

### 场景 2：切换到十字线工具

1. 点击工具栏的下拉按钮（当前显示 "📏"）
2. 工具面板展开
3. 点击 "🎯 十字线" 工具
4. 工具面板自动关闭
5. 工具栏显示：
   - 快速访问区域显示 "🎯" 和 "🎨" 按钮
   - 下拉按钮恢复显示 "📏" 图标

## 优势

1. **更直观**：用户一眼就能看到当前正在使用什么工具
2. **更快速**：不需要手动关闭面板，选择后自动关闭
3. **更简洁**：移除了冗余的图像数量显示
4. **更智能**：工具图标和提示信息动态更新

## 兼容性

- ✅ 完全向后兼容
- ✅ DropdownButton 支持受控和非受控两种模式
- ✅ 不影响现有的视图控制下拉面板
- ✅ 不影响其他组件
