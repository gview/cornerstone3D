# MPR Viewer 切片索引计算实现

## 概述

本文档说明了 MPR Viewer 中如何正确计算和显示切片索引（当前切片位置/总切片数），特别是处理复杂场景如视图旋转、斜向视图（oblique views）等。

## 问题背景

最初的实现使用简单的轴映射方法来计算切片索引：

```typescript
// 旧实现 - 只适用于标准正交视图
switch (currentOrientation) {
  case Enums.OrientationAxis.AXIAL:
    totalSlices = dimensions[2];
    currentIndex = Math.round((camera.focalPoint[2] - origin[2]) / spacing[2]);
    break;
  case Enums.OrientationAxis.SAGITTAL:
    totalSlices = dimensions[0];
    currentIndex = Math.round((camera.focalPoint[0] - origin[0]) / spacing[0]);
    break;
  case Enums.OrientationAxis.CORONAL:
    totalSlices = dimensions[1];
    currentIndex = Math.round((camera.focalPoint[1] - origin[1]) / spacing[1]);
    break;
}
```

这种方法的局限性：
1. ❌ 无法处理旋转后的视图
2. ❌ 无法处理斜向视图（oblique views）
3. ❌ Crossline 旋转后计算错误
4. ❌ 假设视图轴始终与体积轴对齐

## 解决方案

参考 OHIF 的实现，使用 Cornerstone3D 提供的 `getImageSliceDataForVolumeViewport` 工具函数。

### 核心工具函数

#### 1. `getImageSliceDataForVolumeViewport`

位于：`packages/core/src/utilities/getImageSliceDataForVolumeViewport.ts`

这是主要的计算函数，返回 `{ imageIndex, numberOfSlices }`。

**工作原理：**
```typescript
function getImageSliceDataForVolumeViewport(
  viewport: IVolumeViewport
): ImageSliceData {
  const camera = viewport.getCamera();

  // 1. 获取法线方向的间距
  const { spacingInNormalDirection, imageVolume } =
    getTargetVolumeAndSpacingInNormalDir(viewport, camera);

  // 2. 获取切片范围
  const sliceRange = getSliceRange(volumeActor, viewPlaneNormal, focalPoint);
  const { min, max, current } = sliceRange;

  // 3. 计算总切片数
  const numberOfSlices = Math.round((max - min) / spacingInNormalDirection) + 1;

  // 4. 计算当前索引
  let imageIndex = ((current - min) / (max - min)) * numberOfSlices;
  imageIndex = Math.floor(imageIndex);

  // 5. 限制在有效范围内
  imageIndex = Math.max(0, Math.min(imageIndex, numberOfSlices - 1));

  return { numberOfSlices, imageIndex };
}
```

#### 2. `getSliceRange`

位于：`packages/core/src/utilities/getSliceRange.ts`

计算体积在法线方向的切片范围。

**关键特性：**
- 处理正交和非正交方向矩阵
- 使用体积的8个角点计算范围
- 将角点变换到法线方向的坐标系
- 支持任意旋转角度

```typescript
export default function getSliceRange(
  volumeActor: VolumeActor,
  viewPlaneNormal: Point3,
  focalPoint: Point3
): ActorSliceRange {
  const imageData = volumeActor.getMapper().getInputData();
  const direction = imageData.getDirection();

  // 对于正交方向矩阵，使用快速路径
  if (isOrthonormal(direction)) {
    corners = getVolumeActorCorners(volumeActor);
  } else {
    // 对于非正交矩阵，使用索引到世界坐标转换
    corners = cornersIdx.map((it) => imageData.indexToWorld(it));
  }

  // 创建从法线方向到 +X 的旋转矩阵
  const transform = vtkMatrixBuilder
    .buildFromDegree()
    .identity()
    .rotateFromDirections(viewPlaneNormal, [1, 0, 0]);

  // 变换所有角点
  corners.forEach((pt) => transform.apply(pt));

  // 找到 X 轴方向的最小/最大值
  return { min: minX, max: maxX, current: currentSlice };
}
```

#### 3. `getSpacingInNormalDirection`

位于：`packages/core/src/utilities/getSpacingInNormalDirection.ts`

计算体积在任意法线方向的有效间距。

**关键算法：**
```typescript
export default function getSpacingInNormalDirection(
  imageVolume: IImageVolume,
  viewPlaneNormal: Point3
): number {
  const { direction, spacing } = imageVolume;

  // 获取 IJK 方向向量
  const iVector = direction.slice(0, 3) as Point3;
  const jVector = direction.slice(3, 6) as Point3;
  const kVector = direction.slice(6, 9) as Point3;

  // 计算法线与每个方向向量的点积
  const dotProducts = [
    vec3.dot(iVector, viewPlaneNormal),
    vec3.dot(jVector, viewPlaneNormal),
    vec3.dot(kVector, viewPlaneNormal),
  ];

  // 投影间距向量
  const projectedSpacing = vec3.create();
  vec3.set(
    projectedSpacing,
    dotProducts[0] * spacing[0],
    dotProducts[1] * spacing[1],
    dotProducts[2] * spacing[2]
  );

  // 返回投影向量的长度
  return vec3.length(projectedSpacing);
}
```

## 实现细节

### MPRViewer.tsx 中的实现

```typescript
import { getImageSliceDataForVolumeViewport } from '@cornerstonejs/core/utilities';

// 状态管理
const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({
  AXIAL: 0,
  SAGITTAL: 0,
  CORONAL: 0,
});

const [totalSlicesForViewports, setTotalSlicesForViewports] = useState<Record<string, number>>({
  AXIAL: 0,
  SAGITTAL: 0,
  CORONAL: 0,
});

// 监听视口切片位置变化
useEffect(() => {
  if (!renderingEngine || !volume) return;

  const viewportIds = ['AXIAL', 'SAGITTAL', 'CORONAL'];

  const handleSliceUpdate = () => {
    viewportIds.forEach((viewportId) => {
      try {
        const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
        if (!viewport) return;

        // 使用 Cornerstone3D 的工具函数
        const sliceData = getImageSliceDataForVolumeViewport(viewport);

        if (!sliceData) return;

        const { imageIndex, numberOfSlices } = sliceData;

        // 更新状态
        setCurrentImageIndices((prev) => ({
          ...prev,
          [viewportId]: imageIndex,
        }));

        setTotalSlicesForViewports((prev) => ({
          ...prev,
          [viewportId]: numberOfSlices,
        }));
      } catch (error) {
        // 忽略错误
      }
    });
  };

  // 监听鼠标事件
  viewportElements.forEach(element => {
    element.addEventListener('wheel', handleMouseEvent);
    element.addEventListener('mousemove', handleMouseEvent);
  });

  // 初始化
  handleSliceUpdate();
}, [renderingEngine, volume, viewportOrientations]);
```

### ViewportOverlay 显示

```tsx
<ViewportOverlay
  viewportId="AXIAL"
  viewportLabel="Axial"
  currentImageIndex={currentImageIndices.AXIAL}
  totalSlices={totalSlicesForViewports.AXIAL}
  // ... 其他属性
/>
```

显示格式：`{currentImageIndex + 1} / {totalSlices}`

## 支持的复杂场景

### 1. 标准正交视图
- ✅ 横断位（Axial）
- ✅ 矢状位（Sagittal）
- ✅ 冠状位（Coronal）

### 2. 旋转视图
- ✅ Crossline 旋转
- ✅ 任意角度旋转
- ✅ 相机任意方向

### 3. 斜向视图（Oblique Views）
- ✅ 非正交方向矩阵
- ✅ 任意视角

### 4. 多体积融合
- ✅ 支持多个体积叠加
- ✅ 自动选择最佳分辨率体积

## 性能优化 - 使用 Cornerstone3D 事件系统

### 旧实现的问题
```typescript
// ❌ 使用鼠标事件 + 防抖 = 50ms 延迟
const handleMouseEvent = () => {
  handleSliceUpdate();
};

element.addEventListener('wheel', handleMouseEvent);
element.addEventListener('mousemove', handleMouseEvent);

setTimeout(() => {
  // 计算和更新
}, 50); // 50ms 防抖
```

### 新实现 - 零延迟
```typescript
// ✅ 使用 Cornerstone3D 内置事件系统 = 实时更新

// 1. 切片索引 - 监听 VOLUME_NEW_IMAGE 事件
element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);

// 2. 窗宽窗位 - 监听 VOI_MODIFIED 事件
element.addEventListener(Enums.Events.VOI_MODIFIED, handler);
```

### 事件系统优势

1. **零延迟**：事件在数据变化时立即触发，无需防抖
2. **精确触发**：只在值真正改变时触发，避免无效更新
3. **内置优化**：Cornerstone3D 已经内置了防重复机制
4. **官方支持**：与 OHIF 和官方示例保持一致

### 相关事件

| 事件名 | 触发时机 | 携带数据 |
|--------|---------|---------|
| `VOLUME_NEW_IMAGE` | 相机焦点位置改变 | `imageIndex`, `numberOfSlices` |
| `VOI_MODIFIED` | 窗宽窗位改变 | `range: { lower, upper }` |
| `CAMERA_MODIFIED` | 相机参数改变 | `previousCamera`, `camera` |
| `IMAGE_RENDERED` | 图像渲染完成 | `viewportId` |

### 事件分发机制

Cornerstone3D 内置了 `volumeNewImageEventDispatcher`：
- 监听 `CAMERA_MODIFIED` 事件
- 自动计算新的 `imageIndex`
- 只在索引真正改变时触发 `VOLUME_NEW_IMAGE` 事件
- 避免重复计算和无效更新

参考：`packages/core/src/RenderingEngine/helpers/volumeNewImageEventDispatcher.ts`

## 测试建议

测试以下场景：

1. **基本功能**
   - ✅ 滚动切片时索引正确更新
   - ✅ 总切片数显示正确
   - ✅ 切换方位时索引重新计算

2. **旋转场景**
   - ⚠️ 使用 Crosshair 工具旋转视图
   - ⚠️ 切换方位后检查索引
   - ⚠️ 多次旋转后检查索引

3. **边界情况**
   - ⚠️ 第一张切片（索引 0）
   - ⚠️ 最后一张切片（索引 numberOfSlices - 1）
   - ⚠️ 快速滚动

4. **多体积**
   - ⚠️ 加载多个序列
   - ⚠️ 切换序列
   - ⚠️ 融合显示

## 参考

- **OHIF 实现**：`E:\zaicode\Viewers\extensions\cornerstone\src\Viewport\Overlays\CustomizableViewportOverlay.tsx`
- **Cornerstone3D 工具函数**：
  - `getImageSliceDataForVolumeViewport`
  - `getSliceRange`
  - `getSpacingInNormalDirection`
  - `getTargetVolumeAndSpacingInNormalDir`

## 总结

通过使用 Cornerstone3D 提供的专业工具函数，MPR Viewer 现在能够：

1. ✅ **正确处理任意旋转** - 不限于标准正交视图
2. ✅ **支持复杂变换** - 包括斜向视图和 Crossline 旋转
3. ✅ **自动适应体积** - 处理不同方向和间距的体积
4. ✅ **提供准确索引** - 基于真实的相机位置和体积几何
5. ✅ **与 OHIF 一致** - 使用与 OHIF 相同的计算方法

这确保了在所有使用场景下都能准确显示切片位置，为用户提供可靠的位置信息。
