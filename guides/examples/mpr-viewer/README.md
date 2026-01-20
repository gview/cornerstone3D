# MPR Viewer 示例项目

**完整的多平面重建（MPR）查看器实现，支持三视图联动、定位线、层厚调节、旋转和测量功能**

## 功能特性

✅ **三视图联动**: 横断位（Axial）、冠状位（Coronal）、矢状位（Sagittal）自动同步
✅ **定位线显示**: 实时显示当前切片在其他视图中的位置
✅ **四角信息**: 零延迟显示方位、患者信息、切片位置、窗宽窗位
✅ **方位切换**: 交互式方位选择器，支持任意方向切换
✅ **层厚调节**: 支持 MIP、MinIP、Average 等投影模式
✅ **斜位 MPR**: 支持任意角度旋转重建
✅ **测量工具**: 长度、角度、双向、ROI 标注（矩形、椭圆、圆形等）
✅ **测量面板**: 实时显示所有测量，支持显示/隐藏、删除单个或批量操作
✅ **序列管理**: 支持多序列加载，序列缩略图展示，双击切换序列
✅ **工具模式**: 支持激活、被动、启用、禁用四种工具模式
✅ **比例尺**: 可显示/隐藏，支持四个方位切换
✅ **性能优化**: 共享 Volume 数据，使用 Cornerstone3D 事件系统，零延迟更新，60fps 流畅渲染

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **医学影像**: Cornerstone3D (core, tools, dicom-image-loader)
- **矩阵运算**: gl-matrix
- **样式**: CSS Modules

## 项目结构

```text
src/
├── components/           # React 组件
│   ├── AxialViewport.tsx        # 横断位视图
│   ├── SagittalViewport.tsx     # 矢状位视图
│   ├── CoronalViewport.tsx      # 冠状位视图
│   ├── ReferenceLines.tsx       # 定位线组件
│   └── AnnotationsPanel.tsx     # 测量面板组件
├── hooks/                # 自定义 Hooks
│   ├── useMPRSynchronization.ts # 联动同步 Hook
│   ├── useSlabThickness.ts      # 层厚调节 Hook
│   └── useObliqueRotation.ts    # 斜位旋转 Hook
├── utils/                # 工具函数
│   ├── coordinateTransform.ts   # 坐标转换
│   └── referenceLineCalculation.ts # 定位线计算
├── cornerstone/          # Cornerstone3D 配置
│   └── init.ts                  # 初始化逻辑
├── types/                # TypeScript 类型定义
│   └── index.d.ts
├── MPRViewer.tsx         # 主组件
└── main.tsx              # 应用入口
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 打开浏览器

访问 `http://localhost:5173` 查看 MPR 查看器

### 4. 加载示例数据

项目包含示例 DICOM 数据加载功能。要使用自己的数据：

1. 准备 CT 或 MRI DICOM 系列文件
2. 修改 `src/main.tsx` 中的 `imageIds` 配置
3. 刷新浏览器

## 核心功能实现

### 三视图创建

```typescript
const viewportInputs = [
  {
    viewportId: 'AXIAL',
    element: document.getElementById('axialViewport'),
    type: ViewportType.ORTHOGRAPHIC,
    defaultView: ViewportInputType.AXIAL,
  },
  {
    viewportId: 'SAGITTAL',
    element: document.getElementById('sagittalViewport'),
    type: ViewportType.ORTHOGRAPHIC,
    defaultView: ViewportInputType.SAGITTAL,
  },
  {
    viewportId: 'CORONAL',
    element: document.getElementById('coronalViewport'),
    type: ViewportType.ORTHOGRAPHIC,
    defaultView: ViewportInputType.CORONAL,
  },
];
```

### 联动导航

使用 `useMPRSynchronization` Hook 自动同步视图：

```typescript
const { setupLinkedNavigation, cleanup } = useMPRSynchronization({
  viewportIds: ['AXIAL', 'SAGITTAL', 'CORONAL'],
  renderingEngineId: 'mprEngine',
});

// 自动处理相机变化事件和视图同步
setupLinkedNavigation();
```

### 定位线绘制

使用 SVG 叠加层实时绘制定位线：

```typescript
function calculateReferenceLines(
  activeViewport: IViewport,
  targetViewport: IViewport
): { x1, y1, x2, y2 }[] {
  // 将活动视图的相机位置转换为目标视图的图像坐标
  // 返回线条坐标数组
}

function drawReferenceLines(
  svg: SVGElement,
  lines: { x1, y1, x2, y2 }[]
) {
  // 在 SVG 层上绘制线条
}
```

### 层厚调节

支持三种投影模式：

```typescript
import { SlabMode } from '@cornerstone3D/core';

// 设置 5mm 最大强度投影
viewport.setProperties({
  slabThickness: 5,
  slabMode: SlabMode.MAX, // MIP | MinIP | Average
});
```

### 斜位旋转

使用 gl-matrix 实现相机旋转：

```typescript
import { mat4 } from 'gl-matrix';

function rotateViewport(
  viewportId: string,
  angle: number,    // 旋转角度（度）
  axis: vec3        // 旋转轴 [x, y, z]
) {
  const camera = viewport.getCamera();
  const rotationMatrix = mat4.create();

  mat4.rotate(rotationMatrix, rotationMatrix, angleInRadians, axis);
  mat4.multiply(camera.viewMatrix, rotationMatrix, camera.viewMatrix);

  viewport.setCamera(camera);
  viewport.render();
}
```

### 四角信息显示

使用 `ViewportOverlay` 组件在视口四角显示关键信息：

```typescript
import ViewportOverlay from './components/ViewportOverlay';

<ViewportOverlay
  viewportId="AXIAL"
  viewportLabel="Axial"
  currentImageIndex={currentImageIndices.AXIAL}
  totalSlices={totalSlicesForViewports.AXIAL}
  windowCenter={windowLevels.AXIAL.center}
  windowWidth={windowLevels.AXIAL.width}
  currentOrientation={viewportOrientations.AXIAL}
  onOrientationChange={handleOrientationChange}
  orientationEnabled={true}
/>
```

**显示内容**：
- **左上角**：交互式方位选择器（Axial/Sagittal/Coronal）+ 患者信息
- **右上角**：序列描述 + 模态标签
- **左下角**：当前切片位置（索引/总数）
- **右下角**：窗宽/窗位（两行显示）

**关键特性**：
- ✅ **零延迟更新**：使用 Cornerstone3D 事件系统（VOLUME_NEW_IMAGE、VOI_MODIFIED）
- ✅ **支持任意旋转**：使用 `getImageSliceDataForVolumeViewport` 计算切片索引
- ✅ **交互式方位切换**：点击方位标签可切换视图方向
- ✅ **实时窗宽窗位**：拖拽调整窗宽窗位时实时显示

详细实现请参考：
- 📖 [四角信息更新指南](./VIEWPORT_OVERLAY_GUIDE.md) - 完整的实现指南

### 测量面板

使用 `AnnotationsPanel` 组件实时显示和管理所有测量：

```typescript
import AnnotationsPanel from './components/AnnotationsPanel';

<AnnotationsPanel
  renderingEngine={renderingEngine}
  viewportIds={['AXIAL', 'SAGITTAL', 'CORONAL']}
  onClose={() => setShowAnnotationsPanel(false)}
  isCollapsed={isAnnotationsPanelCollapsed}
  onToggleCollapse={() => setIsAnnotationsPanelCollapsed(!isAnnotationsPanelCollapsed)}
  panelPosition="right"
  onPanelPositionChange={handleAnnotationsPanelPositionChange}
/>
```

**功能特性**：
- 实时显示所有测量（长度、角度、ROI 等）
- 点击测量项或点击 🎯 按钮，三视图自动跳转到该测量所在的切片
- 点击眼睛图标 👁️ 可切换单个测量的显示/隐藏状态
- 批量显示/隐藏所有测量
- 删除单个或所有测量
- 过滤非测量工具（Crosshairs、ScaleOverlay）
- 使用 `eventTarget` 监听标注变化事件（ANNOTATION_ADDED/REMOVED/MODIFIED）
- 紧凑的单行显示，节省空间，可显示更多测量项

**测量面板布局**：
- **右侧模式**（默认）：测量面板独立显示在右侧
- **左侧模式**：拖拽面板到左侧后，与序列面板垂直排列
  - 序列面板在上
  - 测量面板在下
  - 两个面板可独立收缩/展开
- **拖拽切换**：按住面板标题栏拖动可切换位置
  - 向右拖动超过 100px → 移动到右侧
  - 向左拖动超过 100px → 移动到左侧

**面板控制**：
- **收缩/展开**：点击 ▶/◀ 按钮收缩或展开面板
  - 收缩时仅显示 40px 宽度
  - 展开时显示 320px 宽度
- **关闭面板**：点击 ✕ 按钮关闭面板
- **工具栏控制**：通过顶部工具栏的"📏 测量"按钮切换面板显示/隐藏

**显示优化**：
- 单行紧凑设计，每个测量项约 32px 高度
- 移除重复的工具类型显示，只保留测量名称
- 眼睛图标既是状态指示器又是切换按钮
- 支持左右两种位置的滚动显示

### 序列管理

支持多序列加载和管理，方便在不同序列之间切换：

```typescript
import SeriesPanel, { SeriesInfo } from './components/SeriesPanel';

// 序列信息会自动从 DICOM 文件中提取
<SeriesPanel
  seriesList={seriesList}
  currentSeriesUID={currentSeriesUID}
  onLoadSeries={handleLoadSeries}
  onClose={() => setShowSeriesPanel(false)}
/>
```

**功能特性**：
- **自动提取序列信息**：从 DICOM 文件中自动解析序列号、序列描述、模态等信息
- **序列缩略图**：显示模态类型的彩色缩略图（CT、MR、US 等有不同颜色）
- **双击切换**：双击序列卡片即可切换到该序列
- **当前序列标识**：正在显示的序列会显示 "✓ 当前" 标识
- **序列统计**：显示每个序列包含的图像帧数

**使用场景**：
- 加载包含多个序列的 DICOM 数据集（如 CT 平扫 + 增强）
- 快速在不同序列之间切换对比
- 查看同一患者的不同检查序列

**颜色标识**：
- **CT** (蓝色): CT 序列
- **MR** (青色): MRI 序列
- **US** (橙色): 超声序列
- **XR** (紫色): X 射线序列
- **PT** (粉色): PET 序列

### 工具模式切换

支持四种工具模式：

```typescript
import { ToolModes } from '@cornerstonejs/tools';

// Active - 可绘制新标注
toolGroup.setToolActive('Length', {
  bindings: [{ mouseButton: MouseBindings.Primary }]
});

// Passive - 可交互但不可绘制
toolGroup.setToolPassive('Length');

// Enabled - 仅显示，不可交互
toolGroup.setToolEnabled('Length');

// Disabled - 隐藏标注
toolGroup.setToolDisabled('Length');
```

**模式说明**：
- **激活 (Active)**: 可以绘制新测量，已有测量可交互
- **被动 (Passive)**: 不能绘制新测量，已有测量可交互
- **启用 (Enabled)**: 已有测量仅显示，不可交互
- **禁用 (Disabled)**: 隐藏所有测量

## 性能优化

### 1. 数据共享

三个视口共享同一个 Volume 对象，减少 60%+ 内存占用：

```typescript
// ✅ 正确：共享 volumeId
axialViewport.setVolumes([{ volumeId }]);
sagittalViewport.setVolumes([{ volumeId }]);
coronalViewport.setVolumes([{ volumeId }]);
```

### 2. 渲染批处理

使用 `requestAnimationFrame` 批量更新：

```typescript
let renderScheduled = false;

function scheduleRender() {
  if (!renderScheduled) {
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderingEngine.renderAllViewports();
      renderScheduled = false;
    });
  }
}
```

### 3. SVG 缓存

缓存 SVG 元素，仅更新坐标：

```typescript
const svgLineElements = new Map<string, SVGLineElement>();

function updateLinePosition(id: string, x1, y1, x2, y2) {
  const line = svgLineElements.get(id);
  if (line) {
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
  }
}
```

## 可用脚本

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行类型检查
npm run type-check

# 代码格式化
npm run format

# 代码检查
npm run lint
```

## 相关文档

- 📖 [MPR 实现指南](../../advanced/mpr-viewer.md) - 完整的 MPR 实现教程
- 📖 [多视口同步指南](../../advanced/multi-viewport.md) - 多视口联动原理
- 📖 [体渲染指南](../../advanced/volume-rendering.md) - 3D 体数据渲染
- 📖 [测量工具指南](../../advanced/measurements.md) - 标注和测量工具
- 📖 [切片索引计算详解](./SLICE_INDEX_CALCULATION.md) - 图像位置计算原理和 OHIF 实现参考
- 📖 [四角信息更新指南](./VIEWPORT_OVERLAY_GUIDE.md) - 视口覆盖层无延迟更新完整指南

## 故障排查

### 四角信息不更新

**问题**: 滚动切片或调整窗宽窗位时，四角信息显示的值没有实时更新

**解决方案**: 确保使用 Cornerstone3D 的事件系统而不是 DOM 事件：

```typescript
// ❌ 错误：使用 DOM 事件 + 防抖（有延迟）
element.addEventListener('wheel', handleMouseEvent);
setTimeout(() => updateUI(), 50);

// ✅ 正确：使用 Cornerstone3D 事件（零延迟）
import { Enums } from '@cornerstonejs/core';

// 切片索引更新
element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, (event) => {
  const { imageIndex, numberOfSlices } = event.detail;
  setCurrentImageIndex(imageIndex);
  setTotalSlices(numberOfSlices);
});

// 窗宽窗位更新
element.addEventListener(Enums.Events.VOI_MODIFIED, (event) => {
  const { range } = event.detail;
  const width = range.upper - range.lower;
  const center = (range.upper + range.lower) / 2;
  setWindowLevel({ center, width });
});
```

### 方位选择器无法点击

**问题**: 视口左上角的方位标签无法点击切换

**解决方案**: 确保覆盖层元素启用 `pointer-events`：

```css
/* ❌ 错误：继承父级的 pointer-events: none */
.overlay-top-left {
  pointer-events: none;
}

/* ✅ 正确：为交互元素单独设置 */
.overlay-top-left {
  pointer-events: none;
}

.orientation-selector {
  pointer-events: auto !important; /* 关键 */
}
```

### 切片索引计算错误

**问题**: 在旋转视图或斜向视图时，切片索引显示不正确

**原因**: 使用简单的轴映射方法只能处理标准正交视图

**解决方案**: 使用 Cornerstone3D 的 `getImageSliceDataForVolumeViewport` 工具函数：

```typescript
// ❌ 错误：简单轴映射（不支持旋转）
switch (orientation) {
  case 'AXIAL':
    currentIndex = Math.round((camera.focalPoint[2] - origin[2]) / spacing[2]);
    break;
}

// ✅ 正确：使用官方工具函数（支持所有场景）
import { getImageSliceDataForVolumeViewport } from '@cornerstonejs/core/utilities';

const sliceData = getImageSliceDataForVolumeViewport(viewport);
const { imageIndex, numberOfSlices } = sliceData;
```

详细说明请参考：
- 📖 [切片索引计算详解](./SLICE_INDEX_CALCULATION.md)
- 📖 [四角信息更新指南](./VIEWPORT_OVERLAY_GUIDE.md)

### 测量面板不显示新测量

**问题**: 绘制新测量后，测量面板没有实时更新

**解决方案**: 确保使用 `eventTarget` 而不是 `document` 来监听事件：

```typescript
// ❌ 错误：使用 document
document.addEventListener(Enums.Events.ANNOTATION_ADDED, handler);

// ✅ 正确：使用 eventTarget
import { eventTarget } from '@cornerstonejs/core';
eventTarget.addEventListener(Enums.Events.ANNOTATION_ADDED, handler);
```

### 测量面板显示过多项

**问题**: Crosshairs 和 ScaleOverlay 也显示在测量面板中

**解决方案**: 过滤非测量工具：

```typescript
const measurementAnnotations = allAnnotations.filter(
  (ann) =>
    ann.metadata.toolName !== 'Crosshairs' &&
    ann.metadata.toolName !== 'ScaleOverlay'
);
```

### 序列面板不显示

**问题**: 加载 DICOM 文件后，序列面板没有自动显示

**检查**:
1. 确认加载的 DICOM 文件包含完整的序列信息元数据
2. 检查浏览器控制台是否有序列提取相关的错误日志
3. 手动点击工具栏的 "📚 序列" 按钮显示序列面板

### 切换序列失败

**问题**: 双击序列卡片后，视图没有更新

**解决方案**:
1. 确保渲染引擎已正确初始化
2. 检查序列的 imageIds 是否有效
3. 查看控制台是否有错误信息

### 工具模式切换不生效

**问题**: 切换工具模式后，测量仍然可以交互

**检查**:
1. 确认工具组正确配置：`toolGroup.setToolActive(toolName, options)`
2. 检查是否有多个工具组冲突
3. 确认视图已添加到工具组：`toolGroup.addViewport(viewportId, renderingEngineId)`

### 定位线不显示

检查：
1. SVG 层是否正确创建和添加到 DOM
2. 坐标转换是否正确
3. SVG 的 `z-index` 是否足够高

### 视图不同步

检查：
1. 视口是否添加到同步组
2. 相机变化事件是否正确监听
3. `focalPoint` 是否实际改变

### 性能问题

优化：
1. 确保 Volume 数据共享
2. 使用 `requestAnimationFrame` 批量更新
3. 启用流式加载减少初始加载时间
4. 使用 `useCallback` 优化事件处理器，避免不必要的重新渲染

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

---

**相关示例**:
- [基础查看器](../basic-viewer/) - 单视口基础影像查看器
- [高级查看器](../advanced-viewer/) - 带标注和测量工具的查看器
