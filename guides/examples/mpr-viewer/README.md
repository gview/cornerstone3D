# MPR Viewer 示例项目

**完整的多平面重建（MPR）查看器实现，支持三视图联动、定位线、层厚调节、旋转和测量功能**

## 功能特性

✅ **三视图联动**: 横断位（Axial）、冠状位（Coronal）、矢状位（Sagittal）自动同步
✅ **定位线显示**: 实时显示当前切片在其他视图中的位置
✅ **层厚调节**: 支持 MIP、MinIP、Average 等投影模式
✅ **斜位 MPR**: 支持任意角度旋转重建
✅ **测量工具**: 长度、角度、ROI 标注
✅ **性能优化**: 共享 Volume 数据，60fps 流畅渲染

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
│   └── ReferenceLines.tsx       # 定位线组件
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

## 故障排查

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

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

---

**相关示例**:
- [基础查看器](../basic-viewer/) - 单视口基础影像查看器
- [高级查看器](../advanced-viewer/) - 带标注和测量工具的查看器
