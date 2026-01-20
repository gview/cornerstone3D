# 工具栏重构方案

## 问题分析

当前工具栏存在以下问题：
1. **按钮过多**：工具栏包含约 30+ 个按钮/控件，横向排列导致空间紧张
2. **分组不清晰**：虽然有分组，但所有功能都平铺在工具栏上
3. **视觉混乱**：过多的按钮让用户难以快速找到需要的功能
4. **空间浪费**：每个组都有独立的标签，占用额外空间

## 当前工具栏结构

```
[文件操作组]
  - 加载 DICOM (主按钮)
  - 图像数量显示
  - 序列面板切换
  - 测量面板切换

[工具组]
  - 十字线工具
  - 显示/隐藏十字线
  - 窗宽窗位工具
  - 长度测量工具
  - 角度测量工具
  - 双向测量工具
  - 探针工具
  - 矩形 ROI 工具
  - 椭圆 ROI 工具
  - 删除选中测量

[模式组]
  - 工具模式下拉选择框

[旋转组]
  - 向左旋转
  - 向右旋转
  - 向上旋转
  - 向下旋转
  - 重置旋转

[层厚组]
  - 层厚滑块
  - 层厚数值显示

[投影组]
  - 投影模式下拉框 (MIP/MinIP/平均)

[比例尺组]
  - 显示/隐藏比例尺
  - 比例尺位置下拉框
```

## 重构方案

### 方案一：折叠式面板（推荐）

将工具栏简化为快速访问栏，详细功能通过可折叠面板展开。

#### 1. 主工具栏（简化版）

只保留最常用的功能，其他功能放入下拉面板：

```
[文件]
  📁 加载 DICOM | 📚 序列 | 📏 测量

[工具]
  🎯 十字线 | 🎨 窗宽窗位 | 📏 测量工具 ▼

[视图]
  🔄 旋转 | 📐 层厚 | 📏 比例尺

[设置]
  ⚙️
```

#### 2. 测量工具面板（下拉）

点击"测量工具"按钮展开，包含：
- 十字线工具
- 显示/隐藏十字线
- 窗宽窗位工具
- 长度测量
- 角度测量
- 双向测量
- 探针工具
- 矩形 ROI
- 椭圆 ROI
- 删除选中
- 工具模式选择

#### 3. 视图控制面板（下拉）

包含：
- 旋转控制（4个方向 + 重置）
- 层厚控制（滑块 + 数值）
- 投影模式（MIP/MinIP/平均）
- 比例尺控制（显示/隐藏 + 位置）

### 方案二：侧边栏模式

将工具栏移到侧边，采用垂直布局。

```
┌─────────────┐
│  [文件]     │
│  📁         │
│  📚         │
│  📏         │
├─────────────┤
│  [工具]     │
│  🎯         │
│  🎨         │
│  📏         │
│  📐         │
│  ✛         │
│  🔍         │
│  ⬜         │
│  ⭕         │
│  🗑️         │
├─────────────┤
│  [视图]     │
│  🔄         │
│  📐         │
│  📏         │
└─────────────┘
```

### 方案三：Tab 面板模式

在顶部保留快速访问栏，下方通过 Tab 切换不同功能面板。

```
快速访问栏: 📁 加载 | 🎯 十字线 | 🎨 窗宽窗位 | 📏 测量 | 🔄 旋转 | ⚙️ 设置

Tab 面板区域:
┌─────────────────────────────────────────────────────┐
│ [测量工具] [视图控制] [显示设置]                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  当前选中的 Tab 对应的功能按钮                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 推荐实施方案：方案一（折叠式面板）

### 实施步骤

#### 第一阶段：创建面板组件

1. **创建 ToolsPanel.tsx**
   - 包含所有测量工具按钮
   - 支持折叠/展开
   - 包含工具模式选择

2. **创建 ViewControlPanel.tsx**
   - 包含旋转控制
   - 包含层厚和投影模式控制
   - 包含比例尺控制

3. **创建 FilePanel.tsx** (可选)
   - 文件加载功能
   - 序列和测量面板切换

#### 第二阶段：简化工具栏

1. **修改 Toolbar.tsx**
   - 移除详细的工具按钮
   - 添加面板触发按钮
   - 保留常用功能的快捷按钮

2. **实现面板切换逻辑**
   - 点击按钮展开/折叠对应面板
   - 支持键盘快捷键
   - 点击外部区域自动折叠

#### 第三阶段：优化交互

1. **添加动画效果**
   - 面板展开/折叠过渡动画
   - 按钮悬停效果
   - 激活状态视觉反馈

2. **响应式设计**
   - 小屏幕下自动调整布局
   - 移动端适配

3. **可配置性**
   - 支持用户自定义常用工具
   - 保存面板展开/折叠状态

### 详细设计

#### 主工具栏布局

```tsx
<div className="toolbar-compact">
  {/* 文件操作 */}
  <ToolbarGroup label="文件">
    <IconButton icon="📁" onClick={onLoadFiles} tooltip="加载 DICOM" primary />
    <Badge count={imageCount} />
    <IconButton
      icon="📚"
      active={showSeriesPanel}
      onClick={onToggleSeriesPanel}
      tooltip="序列面板"
      badge={seriesCount}
    />
    <IconButton
      icon="📏"
      active={showAnnotationsPanel}
      onClick={onToggleAnnotationsPanel}
      tooltip="测量面板"
    />
  </ToolbarGroup>

  {/* 工具选择 - 使用弹出面板 */}
  <ToolbarGroup label="工具">
    <ToolButton
      tool="Crosshairs"
      active={activeTool === 'Crosshairs'}
      onClick={() => onToolChange('Crosshairs')}
    />
    <ToolButton
      tool="WindowLevel"
      active={activeTool === 'WindowLevel'}
      onClick={() => onToolChange('WindowLevel')}
    />
    <DropdownButton
      icon="📏"
      tooltip="更多测量工具"
      disabled={!hasVolume}
    >
      <ToolsPanel />
    </DropdownButton>
  </ToolbarGroup>

  {/* 视图控制 - 使用弹出面板 */}
  <ToolbarGroup label="视图">
    <QuickRotateButton onRotate={onRotate} />
    <DropdownButton icon="⚙️" tooltip="视图设置">
      <ViewControlPanel />
    </DropdownButton>
  </ToolbarGroup>
</div>
```

#### ToolsPanel 组件

```tsx
interface ToolsPanelProps {
  activeTool: string;
  toolModes: Record<string, string>;
  onToolChange: (tool: string) => void;
  onToolModeChange: (tool: string, mode: string) => void;
  onDeleteSelected: () => void;
  onToggleCrosshairs: () => void;
  showCrosshairs: boolean;
}

function ToolsPanel({
  activeTool,
  toolModes,
  onToolChange,
  onToolModeChange,
  onDeleteSelected,
  onToggleCrosshairs,
  showCrosshairs
}: ToolsPanelProps) {
  const tools = [
    { name: 'Crosshairs', icon: '🎯', label: '十字线' },
    { name: 'WindowLevel', icon: '🎨', label: '窗宽窗位' },
    { name: 'Length', icon: '📏', label: '长度' },
    { name: 'Angle', icon: '📐', label: '角度' },
    { name: 'Bidirectional', icon: '✛', label: '双向' },
    { name: 'Probe', icon: '🔍', label: '探针' },
    { name: 'RectangleROI', icon: '⬜', label: '矩形 ROI' },
    { name: 'EllipticalROI', icon: '⭕', label: '椭圆 ROI' },
  ];

  return (
    <div className="tools-panel">
      <div className="panel-section">
        <h4>测量工具</h4>
        <ToolGrid>
          {tools.map(tool => (
            <ToolButton
              key={tool.name}
              tool={tool.name}
              icon={tool.icon}
              label={tool.label}
              active={activeTool === tool.name}
              onClick={() => onToolChange(tool.name)}
            />
          ))}
        </ToolGrid>
      </div>

      <div className="panel-section">
        <h4>十字线设置</h4>
        <Toggle
          checked={showCrosshairs}
          onChange={onToggleCrosshairs}
          label="显示十字线"
        />
      </div>

      <div className="panel-section">
        <h4>工具模式</h4>
        <ModeSelector
          currentMode={toolModes[activeTool]}
          onChange={(mode) => onToolModeChange(activeTool, mode)}
        />
      </div>

      <div className="panel-section">
        <Button danger onClick={onDeleteSelected}>
          🗑️ 删除选中测量
        </Button>
      </div>
    </div>
  );
}
```

#### ViewControlPanel 组件

```tsx
interface ViewControlPanelProps {
  onRotate: (angle: number, axis: 'x' | 'y' | 'z') => void;
  onResetRotation: () => void;
  slabThickness: number;
  onSlabThicknessChange: (value: number) => void;
  slabMode: 'max' | 'min' | 'avg';
  onSlabModeChange: (mode: 'max' | 'min' | 'avg') => void;
  showScale: boolean;
  scaleLocation: 'top' | 'bottom' | 'left' | 'right';
  onToggleScale: () => void;
  onScaleLocationChange: (location: 'top' | 'bottom' | 'left' | 'right') => void;
}

function ViewControlPanel(props: ViewControlPanelProps) {
  return (
    <div className="view-control-panel">
      {/* 旋转控制 */}
      <div className="panel-section">
        <h4>旋转控制</h4>
        <RotationGrid>
          <Button onClick={() => props.onRotate(15, 'x')}>↑ 向上</Button>
          <Button onClick={() => props.onRotate(-15, 'x')}>↓ 向下</Button>
          <Button onClick={() => props.onRotate(15, 'z')}>↺ 向左</Button>
          <Button onClick={() => props.onRotate(-15, 'z')}>↻ 向右</Button>
          <Button onClick={props.onResetRotation}>🔄 重置</Button>
        </RotationGrid>
      </div>

      {/* 层厚控制 */}
      <div className="panel-section">
        <h4>层厚设置</h4>
        <SliderWithInput
          min={1}
          max={20}
          value={props.slabThickness}
          onChange={props.onSlabThicknessChange}
        />
      </div>

      {/* 投影模式 */}
      <div className="panel-section">
        <h4>投影模式</h4>
        <Select value={props.slabMode} onChange={props.onSlabModeChange}>
          <option value="max">MIP (最大密度投影)</option>
          <option value="min">MinIP (最小密度投影)</option>
          <option value="avg">平均投影</option>
        </Select>
      </div>

      {/* 比例尺设置 */}
      <div className="panel-section">
        <h4>比例尺</h4>
        <Toggle
          checked={props.showScale}
          onChange={props.onToggleScale}
          label="显示比例尺"
        />
        {props.showScale && (
          <Select
            value={props.scaleLocation}
            onChange={props.onScaleLocationChange}
          >
            <option value="top">上</option>
            <option value="bottom">下</option>
            <option value="left">左</option>
            <option value="right">右</option>
          </Select>
        )}
      </div>
    </div>
  );
}
```

### 样式设计

```css
/* 简化的工具栏 */
.toolbar-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  height: 48px;
}

/* 工具组 */
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 12px;
  border-right: 1px solid #3e3e42;
}

.toolbar-group:last-child {
  border-right: none;
}

/* 图标按钮 */
.icon-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3c3c3c;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #4a4a4a;
  border-color: #007acc;
}

.icon-button.active {
  background: #007acc;
  border-color: #007acc;
}

/* 下拉面板 */
.dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  min-width: 320px;
  padding: 16px;
  z-index: 1000;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 工具网格 */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px 0;
}

/* 面板区域 */
.panel-section {
  margin-bottom: 16px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.panel-section h4 {
  font-size: 12px;
  color: #858585;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

## 优势分析

### 方案一的优势

1. **空间优化**：将 30+ 个按钮减少到 10-15 个
2. **逻辑清晰**：相关功能组织在一起，易于理解
3. **灵活性高**：支持快速访问和详细功能两种模式
4. **学习成本低**：常用功能一目了然，高级功能按需展开
5. **渐进式增强**：可以从简单开始，逐步添加更多功能

### 与其他方案的对比

| 特性 | 方案一（折叠面板） | 方案二（侧边栏） | 方案三（Tab面板） |
|------|-------------------|-----------------|------------------|
| 空间效率 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 操作便捷性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 学习曲线 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 功能扩展性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 实现复杂度 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

## 实施建议

### 最小可行产品（MVP）

第一阶段实现最小功能：
1. 创建 ToolsPanel 组件
2. 创建 ViewControlPanel 组件
3. 简化主工具栏，只保留 3-4 个常用按钮
4. 实现基本的点击展开/折叠功能

### 迭代优化

在 MVP 基础上逐步添加：
1. 键盘快捷键支持
2. 动画效果
3. 可配置性
4. 响应式设计
5. 主题定制

### 用户测试建议

1. 收集用户最常用的工具
2. 将最常用工具放在主工具栏
3. 观察用户使用面板的频率
4. 根据反馈调整面板布局

## 技术要点

### 1. 组件状态管理

```tsx
// 使用 useState 管理面板状态
const [activePanel, setActivePanel] = useState<string | null>(null);

// 点击外部区域关闭面板
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
      setActivePanel(null);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### 2. Portal 渲染

使用 React Portal 确保面板正确渲染：

```tsx
import { createPortal } from 'react-dom';

function DropdownPanel({ children, isOpen }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="dropdown-panel">{children}</div>,
    document.body
  );
}
```

### 3. 性能优化

```tsx
// 使用 React.memo 避免不必要的重渲染
const ToolsPanel = React.memo<ToolsPanelProps>((props) => {
  // 组件实现
});

// 使用 useCallback 缓存事件处理函数
const handleToolChange = useCallback((tool: string) => {
  // 处理逻辑
}, [依赖项]);
```

## 总结

推荐采用**方案一（折叠式面板）**，因为它：
- 最大化利用空间
- 保持良好的用户体验
- 易于实现和维护
- 支持未来功能扩展

实施时建议采用渐进式开发策略，先实现 MVP，再根据用户反馈逐步优化。
