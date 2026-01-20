# MPR Viewer 四角信息无延迟更新完整指南

## 目录

1. [概述](#概述)
2. [四角信息组成](#四角信息组成)
3. [核心技术](#核心技术)
4. [图像位置计算详解](#图像位置计算详解)
5. [事件系统详解](#事件系统详解)
6. [完整实现代码](#完整实现代码)
7. [最佳实践](#最佳实践)

---

## 概述

本文档详细说明如何在 MPR Viewer 中实现视口四角信息的无延迟实时更新，包括：

- **左上角**：方位标签 + 患者信息
- **右上角**：序列描述 + 模态
- **左下角**：当前切片位置（图像索引/总切片数）
- **右下角**：窗宽/窗位

### 关键特性

✅ **零延迟** - 使用 Cornerstone3D 事件系统，实时响应
✅ **精确计算** - 支持任意旋转和斜向视图
✅ **自动优化** - 内置防重复机制，避免无效更新
✅ **与 OHIF 一致** - 使用与 OHIF 相同的实现方式

---

## 四角信息组成

### 左上角（Top-Left）

**内容：**
- 方位选择器（Axial / Sagittal / Coronal）
- 患者姓名

**特点：**
- 交互式下拉菜单，可切换视口方位
- 支持禁用状态（如 3D 视图）

### 右上角（Top-Right）

**内容：**
- 模态标签（CT / MR / PT 等）
- 序列描述（Series Description）

**数据来源：**
```typescript
const { modality, seriesDescription } = metadata;
```

### 左下角（Bottom-Left）

**内容：**
- 当前切片索引（从 1 开始）
- 总切片数
- 格式：`12 / 256`

**计算复杂度：** ⭐⭐⭐⭐⭐
- 需要处理任意旋转
- 需要处理斜向视图
- 需要处理 crossline 旋转

### 右下角（Bottom-Right）

**内容：**
- 窗宽（Window Width）
- 窗位（Window Center）
- 格式：
  ```
  W: 400
  L: 40
  ```

**更新频率：** 高（用户拖拽时实时更新）

---

## 核心技术

### 1. Cornerstone3D 事件系统

使用官方内置事件，而非 DOM 事件或定时器。

| 事件名 | 用途 | 携带数据 |
|--------|------|----------|
| `VOLUME_NEW_IMAGE` | 切片索引变化 | `{ imageIndex, numberOfSlices }` |
| `VOI_MODIFIED` | 窗宽窗位变化 | `{ range: { lower, upper } }` |
| `CAMERA_MODIFIED` | 相机参数变化 | `{ previousCamera, camera }` |

### 2. 图像切片数据计算工具

核心函数：`getImageSliceDataForVolumeViewport`

**位置：**
```typescript
import { getImageSliceDataForVolumeViewport } from '@cornerstonejs/core/utilities';
```

**返回值：**
```typescript
interface ImageSliceData {
  imageIndex: number;      // 当前切片索引（从 0 开始）
  numberOfSlices: number;  // 总切片数
}
```

### 3. 辅助工具函数

```typescript
// 1. 获取切片范围（处理旋转）
import getSliceRange from '@cornerstonejs/core/utilities/getSliceRange';

// 2. 获取法线方向间距（处理斜向视图）
import getSpacingInNormalDirection from '@cornerstonejs/core/utilities/getSpacingInNormalDirection';

// 3. 获取目标体积和间距
import getTargetVolumeAndSpacingInNormalDir from '@cornerstonejs/core/utilities/getTargetVolumeAndSpacingInNormalDir';
```

---

## 图像位置计算详解

### 问题背景

计算体积视口中的当前切片位置是一个复杂问题，因为：

1. **相机可以任意旋转** - 视口方向不局限于标准正交方向
2. **支持斜向视图** - 视口可以与体积轴成任意角度
3. **支持 Crossline 旋转** - 可以绕任意轴旋转
4. **多体积融合** - 需要选择主体积进行计算

### 简单方法（仅适用于标准正交视图）

```typescript
// ❌ 只能处理 Axial、Sagittal、Coronal 标准方向
const camera = viewport.getCamera();
const { dimensions, spacing, origin } = volume;

switch (orientation) {
  case 'AXIAL':
    totalSlices = dimensions[2];
    currentIndex = Math.round((camera.focalPoint[2] - origin[2]) / spacing[2]);
    break;
  case 'SAGITTAL':
    totalSlices = dimensions[0];
    currentIndex = Math.round((camera.focalPoint[0] - origin[0]) / spacing[0]);
    break;
  case 'CORONAL':
    totalSlices = dimensions[1];
    currentIndex = Math.round((camera.focalPoint[1] - origin[1]) / spacing[1]);
    break;
}
```

**局限性：**
- ❌ 无法处理旋转
- ❌ 无法处理斜向视图
- ❌ 假设视口轴与体积轴对齐

### 正确方法（适用于所有场景）

#### 步骤 1：获取相机和体积数据

```typescript
const camera = viewport.getCamera();
const { viewPlaneNormal, focalPoint } = camera;
```

#### 步骤 2：计算法线方向的间距

```typescript
import getSpacingInNormalDirection from '@cornerstonejs/core/utilities/getSpacingInNormalDirection';

const spacingInNormalDirection = getSpacingInNormalDirection(
  imageVolume,
  viewPlaneNormal
);
```

**算法详解：**

```typescript
function getSpacingInNormalDirection(
  imageVolume: IImageVolume,
  viewPlaneNormal: Point3
): number {
  const { direction, spacing } = imageVolume;

  // 1. 获取 IJK 方向向量（体积的方向矩阵）
  const iVector = direction.slice(0, 3);  // X 轴方向
  const jVector = direction.slice(3, 6);  // Y 轴方向
  const kVector = direction.slice(6, 9);  // Z 轴方向

  // 2. 计算每个轴与法线的点积（投影）
  const dotProducts = [
    vec3.dot(iVector, viewPlaneNormal),
    vec3.dot(jVector, viewPlaneNormal),
    vec3.dot(kVector, viewPlaneNormal),
  ];

  // 3. 将间距投影到法线方向
  const projectedSpacing = vec3.create();
  vec3.set(
    projectedSpacing,
    dotProducts[0] * spacing[0],
    dotProducts[1] * spacing[1],
    dotProducts[2] * spacing[2]
  );

  // 4. 计算投影向量的长度（即有效间距）
  return vec3.length(projectedSpacing);
}
```

**为什么这样做？**
- 对于标准方向，直接返回对应轴的间距
- 对于斜向视图，返回投影后的有效间距
- 这样无论视口如何旋转，都能得到正确的间距

#### 步骤 3：计算切片范围

```typescript
import getSliceRange from '@cornerstonejs/core/utilities/getSliceRange';

const sliceRange = getSliceRange(volumeActor, viewPlaneNormal, focalPoint);
// { min: -100, max: 100, current: 0 }
```

**算法详解：**

```typescript
function getSliceRange(
  volumeActor: VolumeActor,
  viewPlaneNormal: Point3,
  focalPoint: Point3
): ActorSliceRange {
  const imageData = volumeActor.getMapper().getInputData();
  const direction = imageData.getDirection();

  // 1. 获取体积的 8 个角点
  let corners;
  if (isOrthonormal(direction)) {
    // 正交方向：快速路径
    corners = getVolumeActorCorners(volumeActor);
  } else {
    // 非正交方向：使用索引到世界坐标转换
    const [dx, dy, dz] = imageData.getDimensions();
    const cornersIdx = [
      [0, 0, 0],
      [dx - 1, 0, 0],
      [0, dy - 1, 0],
      [dx - 1, dy - 1, 0],
      [0, 0, dz - 1],
      [dx - 1, 0, dz - 1],
      [0, dy - 1, dz - 1],
      [dx - 1, dy - 1, dz - 1],
    ];
    corners = cornersIdx.map((it) => imageData.indexToWorld(it));
  }

  // 2. 创建从法线方向到 +X 轴的旋转矩阵
  const transform = vtkMatrixBuilder
    .buildFromDegree()
    .identity()
    .rotateFromDirections(viewPlaneNormal, [1, 0, 0]);

  // 3. 变换所有角点到法线方向的坐标系
  corners.forEach((pt) => transform.apply(pt));

  // 4. 找到 X 轴方向的最小/最大值（即切片范围）
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < 8; i++) {
    const x = corners[i][0];
    if (x > maxX) maxX = x;
    if (x < minX) minX = x;
  }

  // 5. 将焦点位置也变换到这个坐标系
  const transformedFocalPoint = [...focalPoint];
  transform.apply(transformedFocalPoint);
  const currentSlice = transformedFocalPoint[0];

  return {
    min: minX,
    max: maxX,
    current: currentSlice,
  };
}
```

**为什么这样做？**
- 通过旋转将 3D 问题简化为 1D
- 切片范围就是体积在法线方向的投影范围
- 当前切片就是焦点在法线方向的位置

#### 步骤 4：计算切片索引和总数

```typescript
const { min, max, current } = sliceRange;

// 1. 计算总切片数
const numberOfSlices = Math.round((max - min) / spacingInNormalDirection) + 1;

// 2. 计算当前切片索引
let imageIndex = ((current - min) / (max - min)) * numberOfSlices;
imageIndex = Math.floor(imageIndex);

// 3. 限制在有效范围内
imageIndex = Math.max(0, Math.min(imageIndex, numberOfSlices - 1));

return { imageIndex, numberOfSlices };
```

### 完整计算流程图

```
┌─────────────────────────────────────────┐
│  1. 获取相机和体积数据                    │
│     - camera.focalPoint                 │
│     - camera.viewPlaneNormal            │
│     - volume.direction                  │
│     - volume.spacing                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. 计算法线方向间距                      │
│     getSpacingInNormalDirection()       │
│     - 投影体积间距到法线方向             │
│     - 处理任意旋转角度                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. 计算切片范围                          │
│     getSliceRange()                     │
│     - 获取体积 8 个角点                  │
│     - 旋转到法线方向                     │
│     - 找到最小/最大位置                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. 计算切片索引和总数                    │
│     - numberOfSlices = (max-min)/spacing│
│     - imageIndex = (current-min)/(max-min) │
│     - 限制在有效范围                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. 返回结果                              │
│     { imageIndex, numberOfSlices }       │
└─────────────────────────────────────────┘
```

---

## 事件系统详解

### 传统方法的问题

```typescript
// ❌ 方法 1：定时轮询
setInterval(() => {
  const sliceData = getImageSliceDataForVolumeViewport(viewport);
  updateUI(sliceData);
}, 100);

// ❌ 方法 2：DOM 事件监听 + 防抖
element.addEventListener('wheel', () => {
  setTimeout(() => {
    const sliceData = getImageSliceDataForVolumeViewport(viewport);
    updateUI(sliceData);
  }, 50);
});
```

**问题：**
- 有延迟（50-100ms）
- 可能产生无效更新
- 需要手动优化
- 与官方实现不一致

### Cornerstone3D 事件系统

#### 架构设计

```
┌─────────────────┐
│  用户操作        │
│  (滚动、拖拽)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cornerstone3D  │
│  内部处理        │
│  - 更新相机      │
│  - 计算新索引    │
│  - 触发事件      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  事件分发        │
│  VOLUME_NEW_    │
│  IMAGE          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  你的应用        │
│  监听事件        │
│  更新 UI         │
└─────────────────┘
```

#### 核心分发器

**位置：** `packages/core/src/RenderingEngine/helpers/volumeNewImageEventDispatcher.ts`

**工作流程：**

```typescript
// 1. 监听相机变化事件
function volumeNewImageEventDispatcher(cameraEvent) {
  const { viewportId, renderingEngineId } = cameraEvent.detail;
  const viewport = getRenderingEngine(renderingEngineId).getViewport(viewportId);

  // 2. 获取当前切片数据
  const sliceData = getImageSliceDataForVolumeViewport(viewport);
  const { numberOfSlices, imageIndex } = sliceData;

  // 3. 检查是否真的改变了（防重复）
  if (state[viewport.id] === imageIndex) {
    return; // 没有改变，不触发事件
  }

  // 4. 记录新索引
  state[viewport.id] = imageIndex;

  // 5. 触发 VOLUME_NEW_IMAGE 事件
  triggerEvent(viewport.element, Events.VOLUME_NEW_IMAGE, {
    imageIndex,
    numberOfSlices,
    viewportId,
    renderingEngineId,
  });
}
```

**关键优化点：**
1. **防重复触发** - 只在索引真正改变时触发
2. **自动计算** - 使用官方工具函数计算
3. **携带数据** - 事件中包含计算结果，无需重复计算
4. **零延迟** - 数据变化时立即触发

### 事件监听实现

#### 切片索引监听

```typescript
import { Enums } from '@cornerstonejs/core';

useEffect(() => {
  const viewportIds = ['AXIAL', 'SAGITTAL', 'CORONAL'];
  const handlers = [];

  viewportIds.forEach((viewportId) => {
    const viewport = renderingEngine.getViewport(viewportId);
    if (!viewport || !viewport.element) return;

    const element = viewport.element;

    // 定义事件处理器
    const handleVolumeNewImage = (event) => {
      const { imageIndex, numberOfSlices } = event.detail;

      // 直接使用事件中的数据，无需重新计算
      setCurrentImageIndices((prev) => ({
        ...prev,
        [viewportId]: imageIndex,
      }));

      setTotalSlicesForViewports((prev) => ({
        ...prev,
        [viewportId]: numberOfSlices,
      }));
    };

    // 添加事件监听
    element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handleVolumeNewImage);
    handlers.push({ element, handler: handleVolumeNewImage });
  });

  // 清理函数
  return () => {
    handlers.forEach(({ element, handler }) => {
      element.removeEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
    });
  };
}, [renderingEngine, volume]);
```

#### 窗宽窗位监听

```typescript
useEffect(() => {
  const viewportIds = ['AXIAL', 'SAGITTAL', 'CORONAL'];
  const handlers = [];

  viewportIds.forEach((viewportId) => {
    const viewport = renderingEngine.getViewport(viewportId);
    if (!viewport || !viewport.element) return;

    const element = viewport.element;

    // 定义事件处理器
    const handleVOIModified = (event) => {
      const { range } = event.detail;

      if (!range) return;

      // 将 range 转换为窗宽窗位
      const width = range.upper - range.lower;
      const center = (range.upper + range.lower) / 2;

      // 直接使用事件中的数据
      setWindowLevels((prev) => ({
        ...prev,
        [viewportId]: { center, width },
      }));
    };

    // 添加事件监听
    element.addEventListener(Enums.Events.VOI_MODIFIED, handleVOIModified);
    handlers.push({ element, handler: handleVOIModified });
  });

  // 清理函数
  return () => {
    handlers.forEach(({ element, handler }) => {
      element.removeEventListener(Enums.Events.VOI_MODIFIED, handler);
    });
  };
}, [renderingEngine, volume]);
```

---

## 完整实现代码

### 1. 状态管理

```typescript
// 切片索引状态
const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({
  AXIAL: 0,
  SAGITTAL: 0,
  CORONAL: 0,
});

// 总切片数状态
const [totalSlicesForViewports, setTotalSlicesForViewports] = useState<Record<string, number>>({
  AXIAL: 0,
  SAGITTAL: 0,
  CORONAL: 0,
});

// 窗宽窗位状态
const [windowLevels, setWindowLevels] = useState<Record<string, { center: number; width: number }>>({
  AXIAL: { center: 40, width: 400 },
  SAGITTAL: { center: 40, width: 400 },
  CORONAL: { center: 40, width: 400 },
});

// 方位状态
const [viewportOrientations, setViewportOrientations] = useState<Record<string, Enums.OrientationAxis>>({
  AXIAL: Enums.OrientationAxis.AXIAL,
  SAGITTAL: Enums.OrientationAxis.SAGITTAL,
  CORONAL: Enums.OrientationAxis.CORONAL,
});
```

### 2. 切片索引更新（零延迟）

```typescript
import { Enums } from '@cornerstonejs/core';

// 监听 VOLUME_NEW_IMAGE 事件
useEffect(() => {
  if (!renderingEngine || !volume) return;

  const viewportIds = ['AXIAL', 'SAGITTAL', 'CORONAL'];
  const handlers: Array<{ element: HTMLElement; handler: (event: any) => void }> = [];

  // 处理 VOLUME_NEW_IMAGE 事件
  const handleVolumeNewImage = (viewportId: string) => (event: any) => {
    const { imageIndex, numberOfSlices } = event.detail;

    // 直接从事件中获取，无需重新计算
    setCurrentImageIndices((prev) => {
      if (prev[viewportId] !== imageIndex) {
        return {
          ...prev,
          [viewportId]: imageIndex,
        };
      }
      return prev;
    });

    setTotalSlicesForViewports((prev) => {
      if (prev[viewportId] !== numberOfSlices) {
        return {
          ...prev,
          [viewportId]: numberOfSlices,
        };
      }
      return prev;
    });
  };

  // 为每个视口添加事件监听
  viewportIds.forEach((viewportId) => {
    const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
    if (!viewport || !viewport.element) return;

    const element = viewport.element;
    const handler = handleVolumeNewImage(viewportId);

    // 监听 VOLUME_NEW_IMAGE 事件
    element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);

    handlers.push({ element, handler });
  });

  // 初始化时获取一次
  viewportIds.forEach((viewportId) => {
    try {
      const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
      if (!viewport) return;

      const sliceData = getImageSliceDataForVolumeViewport(viewport);
      if (!sliceData) return;

      const { imageIndex, numberOfSlices } = sliceData;

      setCurrentImageIndices((prev) => ({
        ...prev,
        [viewportId]: imageIndex,
      }));

      setTotalSlicesForViewports((prev) => ({
        ...prev,
        [viewportId]: numberOfSlices,
      }));
    } catch (error) {
      console.warn(`Failed to initialize slice data for ${viewportId}:`, error);
    }
  });

  // 清理函数
  return () => {
    handlers.forEach(({ element, handler }) => {
      element.removeEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
    });
  };
}, [renderingEngine, volume]);
```

### 3. 窗宽窗位更新（零延迟）

```typescript
// 监听 VOI_MODIFIED 事件
useEffect(() => {
  if (!renderingEngine || !volume) return;

  const viewportIds = ['AXIAL', 'SAGITTAL', 'CORONAL'];
  const handlers: Array<{ element: HTMLElement; handler: (event: any) => void }> = [];

  // 处理 VOI_MODIFIED 事件
  const handleVOIModified = (viewportId: string) => (event: any) => {
    const { range } = event.detail;

    if (!range) return;

    // 将 range 转换为窗宽窗位
    const width = range.upper - range.lower;
    const center = (range.upper + range.lower) / 2;

    // 直接从事件中获取，无需重新查询
    setWindowLevels((prev) => {
      const current = prev[viewportId];
      if (current.center !== center || current.width !== width) {
        return {
          ...prev,
          [viewportId]: { center, width },
        };
      }
      return prev;
    });
  };

  // 为每个视口添加事件监听
  viewportIds.forEach((viewportId) => {
    const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
    if (!viewport || !viewport.element) return;

    const element = viewport.element;
    const handler = handleVOIModified(viewportId);

    // 监听 VOI_MODIFIED 事件
    element.addEventListener(Enums.Events.VOI_MODIFIED, handler);

    handlers.push({ element, handler });
  });

  // 初始化时获取一次
  viewportIds.forEach((viewportId) => {
    try {
      const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
      if (!viewport) return;

      const properties = viewport.getProperties();

      if (properties.voiRange) {
        const width = properties.voiRange.upper - properties.voiRange.lower;
        const center = (properties.voiRange.upper + properties.voiRange.lower) / 2;

        setWindowLevels((prev) => ({
          ...prev,
          [viewportId]: { center, width },
        }));
      }
    } catch (error) {
      console.warn(`Failed to initialize window level for ${viewportId}:`, error);
    }
  });

  // 清理函数
  return () => {
    handlers.forEach(({ element, handler }) => {
      element.removeEventListener(Enums.Events.VOI_MODIFIED, handler);
    });
  };
}, [renderingEngine, volume]);
```

### 4. ViewportOverlay 组件

```tsx
interface ViewportOverlayProps {
  viewportId: string;
  viewportLabel?: string;
  imageIds?: string[];
  currentImageIndex?: number;
  totalSlices?: number;
  seriesDescription?: string;
  modality?: string;
  patientName?: string;
  windowCenter?: number;
  windowWidth?: number;
  currentOrientation?: Enums.OrientationAxis | string;
  onOrientationChange?: (viewportId: string, orientation: Enums.OrientationAxis) => void;
  orientationEnabled?: boolean;
}

const ViewportOverlay: React.FC<ViewportOverlayProps> = ({
  viewportId,
  viewportLabel,
  currentImageIndex = 0,
  totalSlices = 0,
  seriesDescription = '',
  modality = 'CT',
  patientName = '',
  windowCenter = 40,
  windowWidth = 400,
  currentOrientation,
  onOrientationChange,
  orientationEnabled = true,
}) => {
  return (
    <>
      {/* 左上角 - 方位和患者信息 */}
      <div className="overlay-top-left">
        {onOrientationChange ? (
          <OrientationSelector
            viewportId={viewportId}
            currentOrientation={currentOrientation || viewportLabel || ''}
            onOrientationChange={onOrientationChange}
            disabled={!orientationEnabled}
          />
        ) : viewportLabel ? (
          <div className="viewport-name">{viewportLabel}</div>
        ) : null}
        {patientName && <div className="patient-info">{patientName}</div>}
      </div>

      {/* 右上角 - 序列信息 */}
      <div className="overlay-top-right">
        {modality && <div className="modality-badge">{modality}</div>}
        {seriesDescription && (
          <div className="series-description" title={seriesDescription}>
            {seriesDescription}
          </div>
        )}
      </div>

      {/* 左下角 - 图像索引 */}
      <div className="overlay-bottom-left">
        {totalSlices > 0 && (
          <div className="image-index">
            {currentImageIndex + 1} / {totalSlices}
          </div>
        )}
      </div>

      {/* 右下角 - 窗宽窗位 */}
      <div className="overlay-bottom-right">
        <div className="window-level-container">
          <div className="window-level-item">
            <span className="window-level-label">W:</span>
            <span className="window-level-value">{windowWidth.toFixed(0)}</span>
          </div>
          <div className="window-level-item">
            <span className="window-level-label">L:</span>
            <span className="window-level-value">{windowCenter.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <style>{`
        /* 覆盖层基础样式 */
        .overlay-top-left,
        .overlay-top-right,
        .overlay-bottom-left,
        .overlay-bottom-right {
          position: absolute;
          z-index: 100;
          pointer-events: none;
        }

        .overlay-top-left {
          top: 8px;
          left: 8px;
        }

        .overlay-top-right {
          top: 8px;
          right: 8px;
        }

        .overlay-bottom-left {
          bottom: 8px;
          left: 8px;
        }

        .overlay-bottom-right {
          bottom: 8px;
          right: 8px;
        }

        /* 图像索引 */
        .image-index {
          font-size: 12px;
          color: #cccccc;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 3px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        /* 窗宽窗位 */
        .window-level-container {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }

        .window-level-item {
          font-size: 11px;
          color: #cccccc;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .window-level-label {
          font-weight: 600;
          color: #aaaaaa;
        }

        .window-level-value {
          color: #ffffff;
          min-width: 40px;
          text-align: right;
        }
      `}</style>
    </>
  );
};
```

### 5. 在 MPRViewer 中使用

```tsx
<div className="viewport-grid">
  {/* Axial 视口 */}
  <div className="viewport-container">
    <div id="axialViewport" className="viewport-element" />
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
  </div>

  {/* Sagittal 视口 */}
  <div className="viewport-container">
    <div id="sagittalViewport" className="viewport-element" />
    <ViewportOverlay
      viewportId="SAGITTAL"
      viewportLabel="Sagittal"
      currentImageIndex={currentImageIndices.SAGITTAL}
      totalSlices={totalSlicesForViewports.SAGITTAL}
      windowCenter={windowLevels.SAGITTAL.center}
      windowWidth={windowLevels.SAGITTAL.width}
      currentOrientation={viewportOrientations.SAGITTAL}
      onOrientationChange={handleOrientationChange}
      orientationEnabled={true}
    />
  </div>

  {/* Coronal 视口 */}
  <div className="viewport-container">
    <div id="coronalViewport" className="viewport-element" />
    <ViewportOverlay
      viewportId="CORONAL"
      viewportLabel="Coronal"
      currentImageIndex={currentImageIndices.CORONAL}
      totalSlices={totalSlicesForViewports.CORONAL}
      windowCenter={windowLevels.CORONAL.center}
      windowWidth={windowLevels.CORONAL.width}
      currentOrientation={viewportOrientations.CORONAL}
      onOrientationChange={handleOrientationChange}
      orientationEnabled={true}
    />
  </div>
</div>
```

---

## 最佳实践

### 1. 事件监听

✅ **推荐：** 使用 Cornerstone3D 内置事件
```typescript
element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
element.addEventListener(Enums.Events.VOI_MODIFIED, handler);
```

❌ **不推荐：** 使用 DOM 事件
```typescript
element.addEventListener('wheel', handler);
element.addEventListener('mousemove', handler);
```

### 2. 数据获取

✅ **推荐：** 从事件中获取数据
```typescript
const handleVolumeNewImage = (event) => {
  const { imageIndex, numberOfSlices } = event.detail;
  // 直接使用
};
```

❌ **不推荐：** 在事件中重新计算
```typescript
const handleVolumeNewImage = (event) => {
  const sliceData = getImageSliceDataForVolumeViewport(viewport);
  // 重复计算
};
```

### 3. 状态更新

✅ **推荐：** 条件更新，避免无效渲染
```typescript
setCurrentImageIndices((prev) => {
  if (prev[viewportId] !== imageIndex) {
    return { ...prev, [viewportId]: imageIndex };
  }
  return prev;
});
```

❌ **不推荐：** 无条件更新
```typescript
setCurrentImageIndices((prev) => ({
  ...prev,
  [viewportId]: imageIndex,
}));
```

### 4. 资源清理

✅ **推荐：** 在 useEffect 返回函数中清理
```typescript
useEffect(() => {
  const handlers = [];

  // 添加监听
  element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
  handlers.push({ element, handler });

  // 清理
  return () => {
    handlers.forEach(({ element, handler }) => {
      element.removeEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
    });
  };
}, [dependencies]);
```

❌ **不推荐：** 不清理或清理不完整
```typescript
useEffect(() => {
  element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
  // 没有清理
}, [dependencies]);
```

### 5. 初始化

✅ **推荐：** 事件监听后立即初始化
```typescript
useEffect(() => {
  // 1. 添加事件监听
  element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);

  // 2. 初始化时获取一次
  const sliceData = getImageSliceDataForVolumeViewport(viewport);
  setCurrentImageIndices({ [viewportId]: sliceData.imageIndex });

  // 3. 清理
  return () => {
    element.removeEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
  };
}, [dependencies]);
```

❌ **不推荐：** 只依赖事件，不初始化
```typescript
useEffect(() => {
  element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
  // 没有初始化，等待第一次事件触发
  return () => {
    element.removeEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
  };
}, [dependencies]);
```

### 6. 错误处理

✅ **推荐：** 捕获并记录错误
```typescript
try {
  const viewport = renderingEngine.getViewport(viewportId);
  const sliceData = getImageSliceDataForVolumeViewport(viewport);
  // 更新状态
} catch (error) {
  console.warn(`Failed to update slice data for ${viewportId}:`, error);
}
```

❌ **不推荐：** 忽略错误或让错误传播
```typescript
const viewport = renderingEngine.getViewport(viewportId);
const sliceData = getImageSliceDataForVolumeViewport(viewport);
// 可能抛出异常
```

---

## 总结

### 关键要点

1. **使用官方工具函数** - `getImageSliceDataForVolumeViewport`
2. **监听内置事件** - `VOLUME_NEW_IMAGE`, `VOI_MODIFIED`
3. **避免重复计算** - 直接从事件中获取数据
4. **正确清理资源** - 在 useEffect 返回函数中移除监听
5. **初始化数据** - 添加监听后立即获取初始值

### 性能优势

| 方法 | 延迟 | 计算次数 | 精确度 |
|------|------|----------|--------|
| 定时轮询 | 100ms | 10次/秒 | 低 |
| DOM事件+防抖 | 50ms | 变化时 | 中 |
| **事件系统** | **0ms** | **变化时** | **高** |

### 参考资源

- **Cornerstone3D 源码：**
  - `packages/core/src/utilities/getImageSliceDataForVolumeViewport.ts`
  - `packages/core/src/utilities/getSliceRange.ts`
  - `packages/core/src/utilities/getSpacingInNormalDirection.ts`
  - `packages/core/src/RenderingEngine/helpers/volumeNewImageEventDispatcher.ts`

- **OHIF 实现：**
  - `extensions/cornerstone/src/Viewport/Overlays/ViewportImageScrollbar.tsx`
  - `extensions/cornerstone/src/Viewport/Overlays/CustomizableViewportOverlay.tsx`

- **本文档示例：**
  - `guides/examples/mpr-viewer/src/MPRViewer.tsx`
  - `guides/examples/mpr-viewer/src/components/ViewportOverlay.tsx`
