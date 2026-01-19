# MPR（多平面重建）实现指南

**相关文档**: [多视口同步](./multi-viewport.md) | [体渲染](./volume-rendering.md) | [测量工具](./measurements.md)
**高级用例**: 实现完整的 MPR 查看器，支持三视图联动、定位线、层厚调节、旋转和测量

---

## 概述

### 什么是 MPR？

MPR（Multi-Planar Reconstruction，多平面重建）是一种医学影像显示技术，它从 3D 体数据（如 CT 或 MRI）中生成三个正交的 2D 切面视图：

- **横断位（Axial）**: 从上到下垂直于人体长轴的横切面
- **冠状位（Coronal）**: 从前到后垂直于人体长轴的冠状切面
- **矢状位（Sagittal）: 从左到右垂直于人体长轴的矢状切面

### 应用场景

MPR 在放射科诊断中具有重要价值：

1. **多角度观察**: 医生可以从三个正交平面同时观察解剖结构，更全面地理解病变的空间关系
2. **手术规划**: 外科医生可以在 MPR 视图上测量距离和角度，用于手术路径规划
3. **病灶定位**: 通过三个视图的交叉定位，精确确定病灶在 3D 空间中的位置
4. **结构跟踪**: 沿着血管、神经或气管等结构在各平面中追踪其走向

### 技术要求

实现 MPR 功能需要满足以下技术要求：

1. **3D 体数据**: 需要完整的 CT 或 MRI volume 数据，包含切片方向和间距信息
2. **性能要求**: 标准 CT 数据集（512x512x300 切片）应保持 60fps 渲染性能
3. **内存管理**: 三个视口共享同一个 volume 数据，避免重复加载
4. **响应性**: 切片导航响应时间 < 100ms，定位线实时更新
5. **兼容性**: 支持主流浏览器的 WebGL 2.0

---

## 准备工作

### 1. Volume 数据加载

MPR 需要加载 3D 体数据。Cornerstone3D 提供了 `volumeLoader` 来处理这个任务。

#### 加载 Volume 数据

```typescript
import { volumeLoader } from '@cornerstonejs/core';

// 准备图像 ID 列表
const imageIds = [
  'wadouri:example.com/ct/axial/001.dcm',
  'wadouri:example.com/ct/axial/002.dcm',
  // ... 更多切片
];

// 创建并缓存 Volume
const volumeId = await volumeLoader.createAndCacheVolume(imageIds, {
  name: 'CT Volume',
  orientation: 'axial',
  spacing: { x: 0.5, y: 0.5, z: 1.0 }, // 间距信息
});

console.log('Volume loaded:', volumeId);
```

#### 验证 Volume 数据

```typescript
import { cache } from '@cornerstone/core';

// 检查 Volume 是否已缓存
const volume = cache.getVolume(volumeId);
if (!volume) {
  console.error('Volume not found in cache');
}
```

### 2. Viewport 配置

MPR 需要三个 VolumeViewport，每个显示一个正交平面。

#### 定义 Viewport 输入

```typescript
import {
  RenderingEngine,
  ViewportInput,
  ViewportType,
  ViewportInputType
} from '@cornerstone3D/core';

// 定义三个视口输入
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

#### 创建 RenderingEngine

```typescript
const renderingEngineId = 'mprEngine';
const renderingEngine = new RenderingEngine(renderingEngineId);

// 设置视口
renderingEngine.setViewports(viewportInputs);

// 启用渲染引擎
renderingEngine.enableElement(document.getElementById('axialViewport'));
renderingEngine.enableElement(document.getElementById('sagittalViewport'));
renderingEngine.enableElement(document.getElementById('coronalViewport'));
```

#### 设置 Volume 到 Viewport

```typescript
const axialViewport = renderingEngine.getViewport('AXIAL');
const sagittalViewport = renderingEngine.getViewport('SAGITTAL');
const coronalViewport = renderingEngine.getViewport('CORONAL');

// 为每个视口设置 volume
axialViewport.setVolumes([{ volumeId }]);
sagittalViewport.setVolumes([{ volumeId }]);
coronalViewport.setVolumes([{ volumeId }]);

// 渲染所有视口
axialViewport.render();
sagittalViewport.render();
coronalViewport.render();
```

---

## 基础实现：三个正交视图的创建

### 步骤 1: 创建 HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>MPR Viewer</title>
  <style>
    body { margin: 0; padding: 0; display: flex; }
    #mpr-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      width: 100vw;
      height: 100vh;
    }
    .viewport {
      border: 1px solid #ccc;
      position: relative;
    }
  </style>
</head>
<body>
  <div id="mpr-container">
    <div id="axialViewport" class="viewport"></div>
    <div id="sagittalViewport" class="viewport"></div>
    <div id="coronalViewport" class="viewport"></div>
  </div>
</body>
</html>
```

### 步骤 2: 初始化 Cornerstone3D

```typescript
import * as cornerstone from '@cornerstonejs/core';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';

// 初始化 Cornerstone3D
cornerstone.init();

// 配置 DICOM Image Loader
dicomImageLoader.web.cornerstone = cornerstone;

// 配置元数据提供器（如果使用 WADO-RS）
```

### 步骤 3: 加载并显示 Volume

```typescript
async function loadMPRVolume() {
  // 1. 准备图像 ID
  const imageIds = createImageIds();

  // 2. 创建 volume
  const volumeId = await volumeLoader.createAndCacheVolume(imageIds, {
    name: 'CT Volume',
    orientation: 'axial',
  });

  // 3. 创建 RenderingEngine
  const renderingEngine = new RenderingEngine('mprEngine');
  renderingEngine.setViewports(viewportInputs);

  // 4. 启用视口
  viewportInputs.forEach(input => {
    renderingEngine.enableElement(input.element);
  });

  // 5. 设置 volume 到视口
  const viewports = renderingEngine.getViewports();
  viewports.forEach(viewport => {
    viewport.setVolumes([{ volumeId }]);
  });

  // 6. 渲染
  renderingEngine.renderAllViewports();
}

loadMPRVolume().catch(console.error);
```

---

## 定位线：绘制和更新机制

定位线（Reference Lines）是 MPR 的关键功能，它显示了当前活动视图在其他两个视图中的位置，帮助用户理解空间关系。

### 定位线实现原理

```
当用户在横断位视图导航到切片 N 时：
- 横断位视图：显示切片 N
- 冠状位视图：显示一条垂直线，指示切片 N 的位置
- 矢状位视图：显示一条水平线，指示切片 N 的位置
```

### 坐标转换流程

定位线的绘制需要进行坐标转换：

```
1. 获取活动视图的相机位置
2. 将相机位置转换为世界坐标
3. 将世界坐标转换为其他视图的图像坐标
4. 将图像坐标转换为屏幕坐标
5. 在 SVG 层上绘制线条
```

### 实现定位线组件

#### 创建 SVG 叠加层

```typescript
// 在组件挂载时创建 SVG 层
function createSVGLayer(element: HTMLElement): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  element.appendChild(svg);
  return svg;
}
```

#### 计算定位线位置

```typescript
import { getEnabledElementById } from '@cornerstonejs/core';

function calculateReferenceLines(
  activeViewport: IViewport,
  targetViewport: IViewport
): { x1, y1, x2, y2 }[] {
  // 获取活动视图的相机
  const camera = activeViewport.getCamera();
  const { focalPoint, viewMatrix } = camera;

  // 获取目标视图的相机和 canvas 尺寸
  const targetCamera = targetViewport.getCamera();
  const canvas = targetViewport.getCanvas();

  // 将世界坐标转换为目标视图的图像坐标
  const { imageData } = targetViewport.getImageData();
  const { dimensions } = imageData;
  const { rows, cols } = dimensions;

  // 计算参考线在目标视图中的位置
  // 这里简化处理，实际需要完整的坐标转换
  const x = focalPoint.x; // 简化示例
  const y = focalPoint.y;

  // 返回线条坐标
  return [
    { x1: 0, y1: y, x2: canvas.width, y2: y }, // 水平线
    { x1: x, y1: 0, x2: x, y2: canvas.height },  // 垂直线
  ];
}
```

#### 绘制定位线

```typescript
function drawReferenceLines(
  svg: SVGElement,
  lines: { x1, y1, x2, y2 }[],
  color: string = 'yellow'
) {
  // 清空现有线条
  while (svg.lastChild) {
    svg.removeChild(svg.lastChild);
  }

  // 创建新线条
  lines.forEach((line, index) => {
    const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineElement.setAttribute('x1', line.x1.toString());
    lineElement.setAttribute('y1', line.y1.toString());
    lineElement.setAttribute('x2', line.x2.toString());
    lineElement.setAttribute('y2', line.y2.toString());
    lineElement.setAttribute('stroke', color);
    lineElement.setAttribute('stroke-width', '2');
    lineElement.setAttribute('opacity', '0.8');
    svg.appendChild(lineElement);
  });
}
```

#### 更新定位线

```typescript
function updateReferenceLines(activeViewportId: string) {
  const renderingEngine = getEnabledElementById('mprEngine') as RenderingEngine;
  const allViewports = renderingEngine.getViewports();

  // 找到活动视图
  const activeViewport = allViewports.find(
    vp => vp.id === activeViewportId
  );

  if (!activeViewport) return;

  // 对其他每个视图更新定位线
  allViewports.forEach(viewport => {
    if (viewport.id !== activeViewportId) {
      const svg = getSVGLayer(viewport.element);
      const lines = calculateReferenceLines(activeViewport, viewport);
      drawReferenceLines(svg, lines, 'cyan');
    }
  });
}

// 监听视图变化事件
const element = getEnabledElementById(activeViewportId);
element.addEventListener(EVENTS.IMAGE_RENDERED, () => {
  updateReferenceLines(activeViewportId);
});
```

---

## 联动导航：视图间同步的实现

联动导航是指在一个视图中定位时，其他视图自动更新到相同的空间位置，这是 MPR 的核心功能之一。

### 实现原理

1. 监听活动视图的相机变化事件
2. 提取相机位置（focalPoint）
3. 更新其他视图的相机到相同的空间位置
4. 更新定位线

### 代码实现

```typescript
import { EVENTS } from '@cornerstone3D/core';

// 存储相机变化
let previousFocalPoint = null;

function setupLinkedNavigation(viewportIds: string[]) {
  const renderingEngine = getEnabledElementById('mprEngine') as RenderingEngine;

  viewportIds.forEach(viewportId => {
    const element = getEnabledElementById(viewportId);
    const viewport = renderingEngine.getViewport(viewportId);

    // 监听相机变化
    element.addEventListener(EVENTS.CAMERA_MODIFIED, () => {
      const camera = viewport.getCamera();
      const currentFocalPoint = camera.focalPoint;

      // 仅在焦点位置实际改变时同步
      if (!previousFocalPoint ||
          previousFocalPoint.x !== currentFocalPoint.x ||
          previousFocalPoint.y !== currentFocalPoint.y ||
          previousFocalPoint.z !== currentFocalPoint.z) {

        // 同步到其他视图
        syncToOtherViewports(renderingEngine, viewportId, currentFocalPoint);

        // 更新定位线
        updateReferenceLines(viewportId);

        previousFocalPoint = { ...currentFocalPoint };
      }
    });
  });
}

function syncToOtherViewports(
  renderingEngine: RenderingEngine,
  sourceViewportId: string,
  focalPoint: Point3
) {
  const viewports = renderingEngine.getViewports();

  viewports.forEach(viewport => {
    if (viewport.id !== sourceViewportId) {
      // 更新相机位置
      const camera = viewport.getCamera();
      camera.focalPoint = focalPoint;
      viewport.setCamera(camera);
      viewport.render();
    }
  });
}
```

### 双向联动导航

除了单向同步，也可以实现双向联动：

```typescript
// 启用双向联动
let enableBidirectionalSync = true;

function enableBidirectionalSync(viewportIds: string[]) {
  setupLinkedNavigation(viewportIds);

  // 添加鼠标点击事件监听器
  viewportIds.forEach(viewportId => {
    const element = getEnabledElementById(viewportId);
    const viewport = renderingEngine.getViewport(viewportId);

    element.addEventListener(EVENTS.MOUSE_CLICK, (evt) => {
      if (!enableBidirectionalSync) return;

      // 获取点击位置的图像坐标
      const { imagePoint } = evt.detail;

      // 将图像坐标转换为世界坐标
      const worldPoint = imageToWorld(imagePoint, viewport);

      // 更新所有视图到相同位置
      syncAllViewportsToPosition(renderingEngine, worldPoint);

      // 更新定位线
      viewportIds.forEach(id => updateReferenceLines(id));
    });
  });
}

function imageToWorld(imagePoint: Point2, viewport: IViewport): Point3 {
  // 实现图像坐标到世界坐标的转换
  // 这里需要考虑视图方向和像素间距
  return { x: 0, y: 0, z: 0 }; // 简化示例
}

function syncAllViewportsToPosition(
  renderingEngine: RenderingEngine,
  worldPoint: Point3
) {
  const viewports = renderingEngine.getViewports();

  viewports.forEach(viewport => {
    const camera = viewport.getCamera();
    camera.focalPoint = worldPoint;
    viewport.setCamera(camera);
    viewport.render();
  });
}
```

---

## 高级功能

### 1. 层厚（Slab Thickness）调节

层厚功能允许用户查看多个相邻切片的合成投影，提供更好的可视化效果。

#### 层厚模式说明

| 模式 | 说明 | 适用场景 | 伪代码示例 |
|------|------|----------|--------------|
| **单切片 (Slab Mode = 1)** | 显示单个切片 | 基础查看，高清晰度 | `slabThickness: 1` |
| **最大强度投影 (MIP)** | 显示该层内最大像素值 | 血管成像、CT 血管造影 | `slabMode: SlabMode.MAX` |
| **最小强度投影 (MinIP)** | 显示该层内最小像素值 | 气管显示、肺部成像 | `slabMode: SlabMode.MIN` |
| **平均投影 (Average)** | 显示该层内像素平均值 | 噪声降低、平滑显示 | `slabMode: SlabMode.AVERAGE` |

#### 实现层厚调节

```typescript
import { SlabMode } from '@cornerstone3D/core';

function setSlabThickness(
  viewportId: string,
  thickness: number, // 层厚，例如 5 表示 5 个切片
  slabMode: SlabMode
) {
  const renderingEngine = getEnabledElementById('mprEngine') as RenderingEngine;
  const viewport = renderingEngine.getViewport(viewportId);

  // 设置层厚和投影模式
  viewport.setProperties({
    slabThickness: thickness,
    slabMode: slabMode,
  });

  // 重新渲染
  viewport.render();
}

// 示例：设置 5mm 最大强度投影
setSlabThickness('AXIAL', 5, SlabMode.MAX);
```

#### 层厚 UI 控制示例

```typescript
// React 组件示例
function SlabThicknessControl() {
  const [thickness, setThickness] = useState(1);
  const [slabMode, setSlabMode] = useState(SlabMode.MAX);

  const handleThicknessChange = (event: React.ChangeEvent) => {
    const newThickness = parseInt(event.target.value);
    setThickness(newThickness);
    setSlabThickness('AXIAL', newThickness, slabMode);
  };

  const handleSlabModeChange = (mode: SlabMode) => {
    setSlabMode(mode);
    setSlabThickness('AXIAL', thickness, mode);
  };

  return (
    <div>
      <label>
        层厚 (切片数):
        <input
          type="range"
          min="1"
          max="20"
          value={thickness}
          onChange={handleThicknessChange}
        />
        <span>{thickness}</span>
      </label>
      <label>
        投影模式:
        <select value={slabMode} onChange={(e) => handleSlabModeChange(e.target.value as SlabMode)}>
          <option value={SlabMode.MAX}>最大强度投影 (MIP)</option>
          <option value={SlabMode.MIN}>最小强度投影 (MinIP)</option>
          <option value={SlabMode.AVERAGE}>平均投影</option>
        </select>
      </label>
    </div>
  );
}
```

### 2. 斜位 MPR 实现

斜位 MPR 允许用户旋转重建平面，以任意角度观察解剖结构。

#### 旋转原理

使用 gl-matrix 库修改相机的方向矩阵，实现视图旋转：

```typescript
import { mat4, vec3 } from 'gl-matrix';

function rotateViewport(
  viewportId: string,
  angle: number,    // 旋转角度（度）
  axis: vec3        // 旋转轴 [x, y, z]
) {
  const renderingEngine = getEnabledElementById('mprEngine') as RenderingEngine;
  const viewport = renderingEngine.getViewport(viewportId);

  // 获取当前相机
  const camera = viewport.getCamera();

  // 创建旋转矩阵
  const rotationMatrix = mat4.create();
  const angleInRadians = (angle * Math.PI) / 180;

  // 应用旋转（围绕给定轴）
  mat4.rotate(rotationMatrix, rotationMatrix, angleInRadians, axis);

  // 应用到相机视图矩阵
  mat4.multiply(camera.viewMatrix, rotationMatrix, camera.viewMatrix);

  // 更新相机
  viewport.setCamera(camera);
  viewport.render();

  // 更新定位线（斜位视图的定位线需要相应调整）
  updateReferenceLines(viewportId);
}

// 示例：围绕 Z 轴旋转 30 度
rotateViewport('AXIAL', 30, [0, 0, 1]);
```

#### 旋转轴说明

| 旋转轴 | 说明 | 应用场景 |
|--------|------|----------|
| **X 轴** | 围绕 X 轴旋转 | 横断位斜切 |
| **Y 轴** | 围绕 Y 轴旋转 | 冠状位/矢状位斜切 |
| **Z 轴** | 围绕 Z 轴旋转 | 平面内旋转 |

### 3. 测量工具集成

MPR 视图中的测量工具使用 `@cornerstonejs/tools` 提供的标准测量工具。

#### 添加长度测量工具

```typescript
import { LengthTool } from '@cornerstonejs/tools';
import { ToolGroupManager } from '@cornerstonejs/tools';

// 创建工具组
const toolGroupId = 'mprTools';
const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

// 添加长度测量工具
toolGroup.addTool(LengthTool.toolName);
toolGroup.setToolActive(LengthTool.toolName, {
  bindings: [
    { mouseButton: MouseBindings.Primary } // 左键
  ],
});

// 添加到视口
const viewportIds = ['AXIAL', 'SAGITTAL', 'CORONAL'];
viewportIds.forEach(viewportId => {
  toolGroup.addViewport(viewportId, 'mprEngine');
});
```

#### 测量工具的 MPR 特性

在 MPR 视图中使用测量工具时需要注意：

1. **跨视图测量**：测量可以在任意视图上进行，系统会自动处理坐标转换
2. **3D 距离**：测量结果会根据图像元数据计算真实世界的距离
3. **测量同步**：如果用户在视口 A 放置了测量，其他视图也会显示该测量

#### 测量工具在 MPR 中的应用场景

```typescript
// 在 React 组件中激活测量工具
function MPRViewerWithMeasurements() {
  const [activeTool, setActiveTool] = useState('Length');

  const handleToolActivation = (toolName: string) => {
    setActiveTool(toolName);

    const toolGroup = ToolGroupManager.getToolGroup('mprTools');
    if (toolGroup) {
      toolGroup.setToolActive(toolName);
    }
  };

  return (
    <div>
      <button onClick={() => handleToolActivation('Length')}>
        长度测量
      </button>
      <button onClick={() => handleToolActivation('Angle')}>
        角度测量
      </button>
      <button onClick={() => handleToolActivation('RectangleROI')}>
        ROI 标注
      </button>
    </div>
  );
}
```

---

## 性能优化策略

MPR 需要处理大型 3D 数据集，性能优化至关重要。

### 1. 数据共享

**策略**: 三个视口共享同一个 Volume 对象

**实现**:
```typescript
// ✅ 正确：三个视口使用同一个 volumeId
axialViewport.setVolumes([{ volumeId }]);
sagittalViewport.setVolumes([{ volumeId }]);
coronalViewport.setVolumes([{ volumeId }]);

// ❌ 错误：为每个视口创建独立的 volume
const volume1 = await volumeLoader.createAndCacheVolume(imageIds1);
const volume2 = await volumeLoader.createAndCacheVolume(imageIds2);
const volume3 = await volumeLoader.createAndCacheVolume(imageIds3);
```

**效果**: 减少内存占用 60%+

### 2. 渲染优化

**策略**: 使用 `requestAnimationFrame` 批量更新，减少渲染次数

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

// 在相机变化时调用
camera.focalPoint = newPosition;
scheduleRender(); // 批量更新，而非立即渲染
```

### 3. 定位线缓存优化

**策略**: 缓存 SVG 元素，仅更新坐标属性

```typescript
// 创建 SVG 元素池
const svgLineElements = new Map<string, SVGLineElement>();

function getOrCreateLineElement(
  svg: SVGElement,
  id: string
): SVGLineElement {
  if (!svgLineElements.has(id)) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    svg.appendChild(line);
    svgLineElements.set(id, line);
  }
  return svgLineElements.get(id);
}

// 更新线条时仅修改属性
function updateLinePosition(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const line = svgLineElements.get(id);
  if (line) {
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
  }
}
```

### 4. 懒加载策略

**策略**: 按需加载 Volume 切片，减少初始加载时间

```typescript
// 创建 Volume 时启用流式加载
const volumeId = await volumeLoader.createAndCacheVolume(imageIds, {
  streaming: true,  // 启用流式加载
  cacheSize: 1024 * 1024 * 1024,  // 1GB 缓存
});
```

### 5. Web Worker 优化

**策略**: 将坐标计算等计算密集型任务移至 Worker

```typescript
// 在 Worker 中进行坐标转换
const worker = new Worker('coordinate-transform.worker.js');

worker.postMessage({
  viewportId: 'AXIAL',
  focalPoint: camera.focalPoint,
  targetViewportId: 'SAGITTAL',
});

worker.onmessage = (e) => {
  const { referenceLines } = e.data;
  drawReferenceLines(referenceLines);
};
```

---

## 边缘情况处理和常见问题

### 1. 缺失方向元数据

**问题**: DICOM 数据缺少方向信息，导致视图无法正确显示

**解决方案**:
```typescript
// 检查方向元数据
const { orientation } = metadata.get(imageId, 'orientation');
if (!orientation || orientation.startsWith('Orient')) {
  // 使用默认轴向方向
  console.warn('Missing orientation metadata, assuming axial orientation');
  orientation = '1\\0\\0\\1';  // 标准轴向
}
```

### 2. 切片间距不一致

**问题**: Volume 的切片间距不均匀，导致测量不准确

**解决方案**:
```typescript
// 使用平均间距
const { spacing } = volume.metadata;
const averageSpacing = (spacing.x + spacing.y + spacing.z) / 3;

// 使用插值处理
const interpolatedSpacing = calculateInterpolatedSpacing(volume.metadata);
```

### 3. 大数据集性能问题

**问题**: 数据集超过 1000 个切片时，导航变得缓慢

**解决方案**:
- 使用虚拟化技术，仅加载可见范围的切片
- 实现切片预加载和缓存策略
- 降低渲染分辨率在导航期间

```typescript
// 实现虚拟化切片导航
const visibleRange = {
  start: Math.max(0, currentSlice - 10),
  end: Math.min(totalSlices, currentSlice + 10)
};

// 仅预加载可见范围的切片
preloadSliceRange(visibleRange);
```

### 4. 越出边界导航

**问题**: 用户导航到第一张或最后一张切片之外

**解决方案**:
```typescript
function navigateToSlice(sliceIndex: number) {
  const maxSlice = totalSlices - 1;
  const clampedSlice = Math.max(0, Math.min(maxSlice, sliceIndex));

  if (clampedSlice !== sliceIndex) {
    // 提供视觉反馈
    showToast(`切片范围: 0 - ${maxSlice}`);
    return;
  }

  // 执行导航
  currentSlice = clampedSlice;
  updateSliceDisplay();
}
```

### 5. WebGL 不支持

**问题**: 浏览器不支持 WebGL 2.0

**解决方案**:
```typescript
// 检测 WebGL 支持
function checkWebGLSupport() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');

  if (!gl) {
    showError('您的浏览器不支持 WebGL，无法显示 MPR 视图');
    return false;
  }

  return true;
}

// 降级处理
if (!checkWebGLSupport()) {
  // 显示错误消息
  document.getElementById('error-container').innerHTML = `
    <div class="error">
      您的浏览器不支持 WebGL 2.0。
      请使用最新版本的 Chrome、Firefox、Safari 或 Edge。
    </div>
  `;
}
```

### 6. 定位线计算不准确

**问题**: 定位线位置与实际切片位置不匹配

**解决方案**:
- 验证 DICOM 元数据的正确性
- 使用精确的坐标转换函数
- 添加调试模式显示实际坐标值

```typescript
// 添加调试信息
function debugReferenceLines(
  activeViewport: IViewport,
  targetViewport: IViewport
) {
  console.log('Active camera:', activeViewport.getCamera());
  console.log('Target camera:', targetViewport.getCamera());

  const lines = calculateReferenceLines(activeViewport, targetViewport);
  console.log('Reference lines:', lines);
}
```

---

## 常见问题

### Q1: 为什么我的 MPR 视图显示方向错误？

**A**: 检查以下几点：
1. DICOM 元数据是否包含正确的方向信息
2. Viewport 的 `defaultView` 是否设置正确（AXIAL/SAGITTAL/CORONAL）
3. ImageLoader 是否正确解析了方向标签

```typescript
// 验证方向信息
const imageOrientation = metadata.get(imageId, 'imageOrientation');
console.log('Image orientation:', imageOrientation);

// 使用正确的默认视图
const correctDefaultView = getDefaultViewForOrientation(imageOrientation);
```

### Q2: 定位线为什么没有显示？

**A**: 检查：
1. SVG 层是否正确创建和添加到 DOM
2. 坐标转换是否正确
3. 线条坐标是否在画布范围内
4. SVG 的 `z-index` 是否足够高以显示在图像上方

```typescript
// 调试 SVG 显示
svg.style.zIndex = '10';
svg.style.background = 'rgba(255, 0, 0, 0.3)'; // 半透明红色背景用于调试
```

### Q3: MPR 视图性能如何优化？

**A**: 参见"性能优化策略"章节，主要优化方法：
- 共享 Volume 对象
- 使用 `requestAnimationFrame` 批量更新
- 缓存 SVG 元素
- 按需加载切片
- 降低渲染分辨率在导航期间

### Q4: 如何在 MPR 中实现 4D 数据支持？

**A**: 4D 数据（时间序列）支持不在基础 MPR 范围内，建议：
- 使用时间滑块选择不同的时间点
- 为每个时间点创建独立的 volume
- 切换时间点时更新所有视图的 volume

```typescript
// 伪代码示例
const timeVolumes = await loadTimeVolumes(imageIdsByTime);
currentTimeIndex = 0;

function switchTimePoint(timeIndex) {
  currentTimeIndex = timeIndex;
  const volumeId = timeVolumes[timeIndex];

  viewports.forEach(vp => {
    vp.setVolumes([{ volumeId }]);
    vp.render();
  });
}
```

### Q5: MPR 能用于超声图像吗？

**A**: 可以，但需要注意：
- 超声数据通常是 2D 的，无法进行真正的多平面重建
- 如果有 3D 超声数据（如 3D/4D 超声），可以应用 MPR 技术
- 可能需要特殊的图像处理和插值算法

---

## 相关资源

### 内部文档

- [多视口同步指南](./multi-viewport.md)
- [体渲染指南](./volume-rendering.md)
- [测量工具指南](./measurements.md)
- [性能优化指南](./performance-optimization.md)

### 外部资源

- **gl-matrix 文档**: https://glmatrix.net/docs/
- **医学影像 MPR 论文**: Multi-Planar Reconstruction in Medical Imaging
- **OHIF Viewer MPR 实现**: https://github.com/OHIF/ohif-viewer

### 示例代码

完整的 MPR 示例项目请参考：[../examples/mpr-viewer/](../examples/mpr-viewer/)
