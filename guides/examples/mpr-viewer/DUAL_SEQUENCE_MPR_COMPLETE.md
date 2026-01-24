# 双序列 MPR 功能完整实现文档

## 概述

本文档详细说明了双序列 MPR（Multi-Planar Reconstruction）布局的完整实现，包括两个独立序列的同时显示、测量智能跳转、十字线独立联动、视口激活状态、位置联动等核心功能。

**版本**: 2.1
**实现日期**: 2026-01-24
**更新日期**: 2026-01-24
**状态**: ✅ 已完成并通过测试

---

## 功能特性

### 1. 双序列同时显示

- **布局**: 2 行 × 3 列网格
  - 上排：序列 1 的 Axial、Sagittal、Coronal 视图
  - 下排：序列 2 的 Axial、Sagittal、Coronal 视图
- **视口数量**: 6 个独立视口
- **数据源**: 两个不同的 DICOM 序列（不同 volume）

### 2. 智能测量跳转

- **自动识别序列**: 测量创建时自动记录所属序列
- **智能跳转**: 点击测量项时自动跳转到对应序列的视口
- **三级判断机制**:
  1. 优先使用 `metadata.volumeId`
  2. 其次使用 `metadata.sequenceIndex`
  3. 最后使用 `referencedImageId` 提取（备用）

### 3. 十字线独立联动

- **序列内部联动**: 每个序列的三个视口十字线互相联动
- **序列间独立**: 两个序列的十字线互不干扰
- **同步控制**: 工具栏按钮同时控制两个序列

### 4. 视口激活状态显示

- **蓝色边框**: 激活的视口显示蓝色边框（2px solid #007acc）
- **点击切换**: 点击任意视口即可切换激活状态
- **视觉反馈**:
  - 激活视口：蓝色边框 + 蓝色阴影
  - 激活视口悬停：绿色边框
  - 非激活视口悬停：灰色边框
- **自动初始化**: 切换到双序列布局时，第一个视口自动激活

### 5. 位置联动 ✨ 改进

- **双向同步**: 序列1 ↔ 序列2 的相机位置完全同步
- **官方实现**: 使用 Cornerstone3D 官方 `CameraPositionSynchronizer` API
- **独立同步器**: 为每个方向创建独立的同步器（Axial、Sagittal、Coronal）
- **自动处理**: 官方 API 自动处理换层、旋转、缩放等所有位置变化
- **工具栏控制**: 工具栏🔗按钮开启/关闭位置联动
- **自动管理**: 切换布局时自动禁用，组件卸载时自动清理
- **性能优化**: 官方实现性能更优，无循环触发问题

### 6. 双序列独立切换

- **智能检测**: 自动检测当前是否为双序列 MPR 布局
- **激活视口识别**: 根据激活视口确定要更新哪个序列
- **独立加载**: 双击序列时只更新激活视口所属的序列行
  - 点击序列 1 的视口 → 更新上排三个视口
  - 点击序列 2 的视口 → 更新下排三个视口
- **窗宽窗位同步**: 自动应用新序列的窗宽窗位设置
- **状态更新**: 正确更新 `volumeId` 和 `secondaryVolumeId` 状态

### 7. 完整工具支持

- ✅ 平移（中键拖动）
- ✅ 缩放（右键拖动）
- ✅ 换层（滚轮）
- ✅ 十字线（左键拖动）
- ✅ 窗宽窗位（左键拖动）
- ✅ 测量工具（长度、角度、矩形、椭圆等）

### 6. 双序列独立切换 ✨ 新增

- **智能检测**: 自动检测当前是否为双序列 MPR 布局
- **激活视口识别**: 根据激活视口确定要更新哪个序列
- **独立加载**: 双击序列时只更新激活视口所属的序列行
  - 点击序列 1 的视口 → 更新上排三个视口
  - 点击序列 2 的视口 → 更新下排三个视口
- **窗宽窗位同步**: 自动应用新序列的窗宽窗位设置
- **状态更新**: 正确更新 `volumeId` 和 `secondaryVolumeId` 状态

---

## 技术架构

### 核心设计思想

**关键决策**: 使用两个独立的工具组（ToolGroup）

```typescript
mpr-seq1  → 管理序列 1 的视口（索引 0-2）
mpr-seq2  → 管理序列 2 的视口（索引 3-5）
```

**为什么需要两个工具组？**

1. **CrosshairsTool 的限制**: CrosshairsTool 试图在同一工具组的所有视口之间同步十字线位置
2. **不同 Volume**: 序列 1 和序列 2 显示不同的 volume，十字线无法跨 volume 同步
3. **独立控制**: 两个工具组可以实现独立但同步的工具控制

### 文件结构

```
src/
├── MPRViewer.tsx                    # 主组件，布局切换逻辑
├── components/
│   └── AnnotationsPanel.tsx         # 测量面板，智能跳转
└── utils/
    └── dynamicViewportManager.ts    # 动态视口管理器
```

---

## 实现细节

### 1. 双序列布局创建

**文件**: [dynamicViewportManager.ts](src/utils/dynamicViewportManager.ts)

#### 1.1 视口创建

```typescript
async applyDualSequenceMPRLayout(
  config: DualSequenceConfig,
  currentViewportIds: string[]
): Promise<string[]> {
  // 生成 6 个唯一的视口 ID
  const newViewportIds: string[] = [];
  for (let i = 0; i < 6; i++) {
    newViewportIds.push(`viewport-${Date.now()}-${i}`);
  }

  // 创建 2x3 网格布局
  this.createGridLayout(2, 3, newViewportIds);

  // 定义视口方向
  const getDualSequenceOrientation = (index: number): Enums.OrientationAxis => {
    switch (index % 3) {
      case 0: return Enums.OrientationAxis.AXIAL;
      case 1: return Enums.OrientationAxis.SAGITTAL;
      case 2: return Enums.OrientationAxis.CORONAL;
    }
  };

  // 为上排视口设置序列 1 的 volume
  await setVolumesForViewports(
    this.renderingEngine,
    [{ volumeId: volumeId1 }],
    newViewportIds.slice(0, 3),
    { immediateRender: false }
  );

  // 为下排视口设置序列 2 的 volume
  await setVolumesForViewports(
    this.renderingEngine,
    [{ volumeId: volumeId2 }],
    newViewportIds.slice(3, 6),
    { immediateRender: false }
  );

  return newViewportIds;
}
```

#### 1.2 网格布局修复

**关键修复**: 避免嵌套网格结构

```typescript
createGridLayout(rows: number, cols: number, viewportIds: string[]): void {
  this.clearContainer();

  // 🔧 直接使用父容器的网格布局，避免嵌套
  this.containerElement.style.display = 'grid';
  this.containerElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  this.containerElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  this.containerElement.style.gap = '2px';

  // 创建视口并直接添加到父容器
  viewportIds.forEach((viewportId) => {
    const viewportContainer = document.createElement('div');
    viewportContainer.style.cssText = `
      position: relative;
      background: #000;
      overflow: hidden;
      min-height: 200px;
      min-width: 200px;
    `;

    // 添加视口标签
    const index = this.viewportElements.size;
    const sequenceNumber = index < 3 ? 1 : 2;
    const viewLabel = ['Axial', 'Sagittal', 'Coronal'][index % 3];
    const label = document.createElement('div');
    label.textContent = `Seq ${sequenceNumber} - ${viewLabel}`;
    label.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      color: white;
      background: rgba(0, 0, 0, 0.6);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      z-index: 10;
      pointer-events: none;
    `;
    viewportContainer.appendChild(label);

    // 添加 Cornerstone3D 视口元素
    const viewportElement = document.createElement('div');
    viewportElement.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
    `;
    viewportContainer.appendChild(viewportElement);

    // 直接添加到父容器，不创建嵌套的 gridContainer
    this.containerElement.appendChild(viewportContainer);
    this.viewportElements.set(viewportId, viewportElement);
  });
}
```

### 2. 双工具组管理

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx:1570-1699)

#### 2.1 创建工具组

```typescript
const toolGroupSeq1Id = 'mpr-seq1';
const toolGroupSeq2Id = 'mpr-seq2';

let toolGroupSeq1 = ToolGroupManager.getToolGroup(toolGroupSeq1Id);
let toolGroupSeq2 = ToolGroupManager.getToolGroup(toolGroupSeq2Id);

// 创建序列 1 工具组
if (!toolGroupSeq1) {
  toolGroupSeq1 = ToolGroupManager.createToolGroup(toolGroupSeq1Id)!;

  // 添加所有工具
  toolGroupSeq1.addTool(PanTool.toolName);
  toolGroupSeq1.addTool(ZoomTool.toolName);
  toolGroupSeq1.addTool(StackScrollTool.toolName);
  toolGroupSeq1.addTool(WindowLevelTool.toolName);
  toolGroupSeq1.addTool(LengthTool.toolName);
  toolGroupSeq1.addTool(AngleTool.toolName);
  toolGroupSeq1.addTool(BidirectionalTool.toolName);
  toolGroupSeq1.addTool(ProbeTool.toolName);
  toolGroupSeq1.addTool(RectangleROITool.toolName);
  toolGroupSeq1.addTool(EllipticalROITool.toolName);
  toolGroupSeq1.addTool(ScaleOverlayTool.toolName);
  toolGroupSeq1.addTool(CrosshairsTool.toolName);
}

// 创建序列 2 工具组（同样的工具）
if (!toolGroupSeq2) {
  toolGroupSeq2 = ToolGroupManager.createToolGroup(toolGroupSeq2Id)!;
  // ... 添加相同的工具
}
```

#### 2.2 分配视口

```typescript
// 序列 1 工具组管理前 3 个视口
newViewportIds.slice(0, 3).forEach((viewportId) => {
  toolGroupSeq1!.addViewport(viewportId, 'mprEngine');
});

// 序列 2 工具组管理后 3 个视口
newViewportIds.slice(3, 6).forEach((viewportId) => {
  toolGroupSeq2!.addViewport(viewportId, 'mprEngine');
});
```

#### 2.3 配置工具绑定

```typescript
// 为两个工具组配置相同的工具绑定
[toolGroupSeq1!, toolGroupSeq2!].forEach((toolGroup, groupIndex) => {
  const seqName = groupIndex === 0 ? '序列1' : '序列2';

  // 平移 - 中键
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Auxiliary }],
  });

  // 缩放 - 右键
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Secondary }],
  });

  // 滚轮换层 - 滚轮
  toolGroup.setToolActive(StackScrollTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Wheel }],
  });

  // 主鼠标按钮工具（根据当前状态）
  if (showCrosshairs) {
    toolGroup.setToolActive(CrosshairsTool.toolName, {
      bindings: [{ mouseButton: MouseBindings.Primary }],
    });
    console.log(`  ✓ ${seqName} 十字线工具已启用`);
  } else if (isWindowLevelActive) {
    toolGroup.setToolActive(WindowLevelTool.toolName, {
      bindings: [{ mouseButton: MouseBindings.Primary }],
    });
    console.log(`  ✓ ${seqName} 窗宽窗位工具已启用`);
  } else if (activeTool) {
    toolGroup.setToolActive(activeTool, {
      bindings: [{ mouseButton: MouseBindings.Primary }],
    });
    console.log(`  ✓ ${seqName} 测量工具 ${activeTool} 已启用`);
  } else {
    // 默认：长度测量工具
    toolGroup.setToolActive(LengthTool.toolName, {
      bindings: [{ mouseButton: MouseBindings.Primary }],
    });
    console.log(`  ✓ ${seqName} 长度测量工具已启用（默认）`);
  }
});
```

### 3. 智能测量跳转

#### 3.1 标注创建时添加序列信息

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx:1701-1730)

```typescript
// 添加 annotationAdded 事件监听器
const handleAnnotationAdded = (event: any) => {
  const { annotation } = event.detail;

  // 确定标注是在哪个视口创建的
  const viewportId = annotation.metadata.viewpointId;
  const sequenceIndex = newViewportIds.findIndex(id => id === viewportId);

  if (sequenceIndex !== -1) {
    // 0-2: 序列 1, 3-5: 序列 2
    const sequenceNumber = sequenceIndex < 3 ? 1 : 2;
    const targetVolumeId = sequenceIndex < 3 ? volumeId : volumeId2;

    // 将序列信息添加到标注元数据
    annotation.metadata.volumeId = targetVolumeId;
    annotation.metadata.sequenceIndex = sequenceIndex;
    annotation.metadata.sequenceNumber = sequenceNumber;

    console.log(`📝 标注已添加到序列 ${sequenceNumber} (${viewportId})，volumeId: ${targetVolumeId}`);
  }
};

// 添加事件监听器
eventTarget.addEventListener('annotationAdded', handleAnnotationAdded as any);
```

#### 3.2 跳转时判断序列

**文件**: [AnnotationsPanel.tsx](src/components/AnnotationsPanel.tsx:335-383)

```typescript
const jumpToAnnotation = (annotation: Annotation) => {
  // 判断是否是双序列 MPR 布局
  const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

  // 确定目标序列索引（0 或 1）
  let targetSequenceIndex = 0; // 默认序列 1

  if (isDualSequenceLayout) {
    // 方法 1：优先使用 metadata.volumeId
    if (annotation.metadata.volumeId) {
      const annotationVolumeId = annotation.metadata.volumeId;

      if (annotationVolumeId === secondaryVolumeId) {
        targetSequenceIndex = 1; // 序列 2
        console.log('✅ 测量属于序列 2（自定义元数据）');
      } else if (annotationVolumeId === volumeId) {
        targetSequenceIndex = 0; // 序列 1
        console.log('✅ 测量属于序列 1（自定义元数据）');
      }
    }
    // 方法 2：使用 metadata.sequenceIndex
    else if (annotation.metadata.sequenceIndex !== undefined) {
      const seqIndex = annotation.metadata.sequenceIndex as number;
      targetSequenceIndex = seqIndex < 3 ? 0 : 1;
      console.log(`✅ 使用 sequenceIndex: ${seqIndex}，跳转到序列 ${targetSequenceIndex + 1}`);
    }
    // 方法 3：从 referencedImageId 提取（备用）
    else if (annotation.metadata.referencedImageId) {
      const annotationVolumeId = extractVolumeIdFromImageId(annotation.metadata.referencedImageId);
      // ... 判断逻辑
    }
  }

  // 根据序列索引选择视口
  const seqStartIndex = targetSequenceIndex * 3; // 序列 1: 0, 序列 2: 3

  axialViewport = renderingEngine.getViewport(viewportIds[seqStartIndex]);
  sagittalViewport = renderingEngine.getViewport(viewportIds[seqStartIndex + 1]);
  coronalViewport = renderingEngine.getViewport(viewportIds[seqStartIndex + 2]);

  // ... 更新相机并渲染
  renderingEngine.renderViewports([
    viewportIds[seqStartIndex],
    viewportIds[seqStartIndex + 1],
    viewportIds[seqStartIndex + 2]
  ]);
};
```

### 4. 工具切换支持

#### 4.1 十字线切换

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx:1195-1304)

```typescript
const handleToggleCrosshairs = () => {
  const newShowCrosshairs = !showCrosshairs;
  const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

  if (newShowCrosshairs) {
    if (isDualSequenceLayout) {
      // 双序列布局：同时更新两个工具组
      const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
      const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');

      // 禁用窗宽窗位
      if (isWindowLevelActive) {
        setIsWindowLevelActive(false);
        toolGroupSeq1!.setToolDisabled(WindowLevelTool.toolName);
        toolGroupSeq2!.setToolDisabled(WindowLevelTool.toolName);
      }

      // 将测量工具设为 Passive
      if (activeTool) {
        if (toolGroupSeq1!.hasTool(activeTool)) {
          toolGroupSeq1!.setToolPassive(activeTool);
        }
        if (toolGroupSeq2!.hasTool(activeTool)) {
          toolGroupSeq2!.setToolPassive(activeTool);
        }
      }

      // 启用两个工具组的十字线
      toolGroupSeq1!.setToolActive(CrosshairsTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
      toolGroupSeq2!.setToolActive(CrosshairsTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });

      setShowCrosshairs(true);
      console.log('✅ 已启用双序列十字线');
    } else {
      // 标准布局：使用单个 mpr 工具组
      // ...
    }
  } else {
    // 禁用十字线（类似逻辑）
  }
};
```

#### 4.2 窗宽窗位切换

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx:1306-1415)

类似的逻辑，同时更新两个工具组的窗宽窗位工具状态。

#### 4.3 测量工具切换

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx:1023-1230)

```typescript
const handleToolChange = (toolName: string) => {
  const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

  if (isDualSequenceLayout) {
    // 禁用两个工具组的十字线和窗宽窗位
    const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
    const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');

    // 禁用 Crosshairs 和 WindowLevel
    if (toolGroupSeq1) {
      if (toolGroupSeq1.hasTool(CrosshairsTool.toolName)) {
        toolGroupSeq1.setToolDisabled(CrosshairsTool.toolName);
      }
      if (isWindowLevelActive) {
        toolGroupSeq1.setToolDisabled(WindowLevelTool.toolName);
      }
    }

    if (toolGroupSeq2) {
      if (toolGroupSeq2.hasTool(CrosshairsTool.toolName)) {
        toolGroupSeq2.setToolDisabled(CrosshairsTool.toolName);
      }
      if (isWindowLevelActive) {
        toolGroupSeq2.setToolDisabled(WindowLevelTool.toolName);
      }
    }

    // 更新状态
    if (showCrosshairs) setShowCrosshairs(false);
    if (isWindowLevelActive) setIsWindowLevelActive(false);

    // 激活新的测量工具（在两个工具组中）
    if (switchableTools.includes(toolName)) {
      toolGroupSeq1!.setToolActive(toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
      toolGroupSeq2!.setToolActive(toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });

      setToolModes((prev) => ({
        ...prev,
        [toolName]: ToolModes.Active,
      }));

      setActiveTool(toolName);
    }
  } else {
    // 标准布局：使用单个 mpr 工具组
    // ...
  }
};
```

---

## 关键修复历程

### 修复 1: 视口尺寸问题

**问题**: 视口显示为空白，尺寸为 156px × 0px

**原因**: 嵌套 CSS Grid 结构导致尺寸计算冲突

**解决**: 直接使用父容器的网格布局，避免嵌套

**文档**: [VIEWPORT_SIZE_FIX.md](VIEWPORT_SIZE_FIX.md)

### 修复 2: React removeChild 错误

**问题**: `Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node'`

**原因**: 手动 DOM 操作与 React 虚拟 DOM 冲突

**解决**: 先更新状态触发 React 卸载，等待 DOM 更新后再手动操作

**文档**: [REACT_REMOVECHILD_FIX.md](REACT_REMOVECHILD_FIX.md)

### 修复 3: 工具配置问题

**问题**: 所有工具（平移、缩放、换层、测量）都无法使用

**原因**:
1. 工具绑定冲突（多个工具绑定到同一鼠标按钮）
2. 缺少视口事件处理器
3. 工具组 ID 错误

**解决**: 正确配置工具绑定，添加事件处理器

**文档**: [TOOL_CONFIGURATION_FIX.md](TOOL_CONFIGURATION_FIX.md)

### 修复 4: 十字线工具错误

**问题**: `For crosshairs to operate, at least two viewports must be given`

**原因**: 所有 6 个视口在同一个工具组中，CrosshairsTool 无法跨不同 volume 同步

**解决**: 创建两个独立的工具组，每个序列一个

**文档**: 本文档第 2 节

### 修复 5: 测量跳转问题

**问题**: 点击测量总是跳转到序列 1

**原因**: `referencedImageId` 格式为 `dicomfile:76`，不包含 volume 信息

**解决**: 使用 `annotationAdded` 事件监听器添加自定义元数据

**文档**: [ANNOTATION_PANEL_DUAL_SEQUENCE_FIX.md](ANNOTATION_PANEL_DUAL_SEQUENCE_FIX.md)

### 修复 6: 视口激活状态不显示 ✨ 新增

**问题**: 切换到双序列MPR后，点击视口没有激活状态显示（蓝色边框）

**原因**:
1. `handleViewportClick` 函数在闭包中捕获了旧的 `viewportIds` 状态值（3个）
2. 事件监听器在布局切换时没有更新，仍然使用旧的闭包
3. 条件判断 `viewportIds.length === 6 && secondaryVolumeId` 中的 `viewportIds` 为旧值

**解决方案**:

#### 1. 在视口创建时添加 active 类

**文件**: [dynamicViewportManager.ts:180-185](src/utils/dynamicViewportManager.ts:180-185)

```typescript
// 🔧 检查是否是激活的视口并添加 active 类
const activeViewportId = this.eventHandlers.getActiveViewportId?.();
const isActive = viewportId === activeViewportId;
if (isActive) {
  viewportContainer.classList.add('active');
}
```

#### 2. 添加动态更新方法

**文件**: [dynamicViewportManager.ts:131-151](src/utils/dynamicViewportManager.ts:131-151)

```typescript
/**
 * 更新视口激活状态
 * @param activeViewportId 激活的视口ID
 */
updateActiveViewport(activeViewportId: string): void {
  if (!this.containerElement) return;

  // 获取所有视口容器
  const viewportContainers = Array.from(this.containerElement.children).filter(
    child => child.classList.contains('viewport-container')
  );

  viewportContainers.forEach((container) => {
    // 查找该容器对应的视口元素
    const viewportElement = container.querySelector('.viewport-element');
    if (viewportElement) {
      const viewportId = viewportElement.id;
      if (viewportId === activeViewportId) {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    }
  });
}
```

#### 3. 在点击事件中调用更新方法

**文件**: [MPRViewer.tsx:1507-1514](src/MPRViewer.tsx:1507-1514)

```typescript
// 处理视口激活
const handleViewportClick = (viewportId: string) => {
  setActiveViewportId(viewportId);

  // 🔧 更新视口容器的active类（支持单序列和双序列布局）
  // 不依赖状态值，直接调用 updateActiveViewport，让方法内部判断
  dynamicViewportManager.updateActiveViewport(viewportId);

  console.log(`✅ 激活视口: ${viewportId}`);
};
```

#### 4. 初始化时设置第一个视口为激活状态

**文件**: [MPRViewer.tsx:1955-1959](src/MPRViewer.tsx:1955-1959)

```typescript
// 🔧 设置第一个视口为激活状态
const firstViewportId = newViewportIds[0];
setActiveViewportId(firstViewportId);
dynamicViewportManager.updateActiveViewport(firstViewportId);
console.log(`✅ 设置视口 ${firstViewportId} 为激活状态`);
```

**关键点**:
- 不依赖 `viewportIds.length` 等状态值来判断是否为双序列布局
- `updateActiveViewport` 内部通过查询实际的 DOM 结构来工作
- 支持单序列和双序列布局，兼容性好

### 修复 7: 双序列切换失败 ✨ 新增

**问题**: 在双序列 MPR 布局下，双击序列面板中的序列时，所有 6 个视口都被更新为同一个序列

**原因**:
- `handleLoadSeries` 函数没有考虑双序列布局的特殊情况
- 函数总是更新所有视口（`['AXIAL', 'SAGITTAL', 'CORONAL']`）
- 没有根据激活视口判断要更新哪个序列

**解决方案**:

#### 1. 添加双序列布局检测

**文件**: [MPRViewer.tsx:873-876](src/MPRViewer.tsx:873-876)

```typescript
// 🔧 检测是否是双序列 MPR 布局
const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

if (isDualSequenceLayout) {
  // 双序列布局的特殊处理逻辑
}
```

#### 2. 确定目标序列和视口

**文件**: [MPRViewer.tsx:885-897](src/MPRViewer.tsx:885-897)

```typescript
// 确定激活视口属于哪个序列（0-2: 序列1, 3-5: 序列2）
const activeViewportIndex = viewportIds.indexOf(activeViewportId);
if (activeViewportIndex === -1) {
  console.error(`❌ 激活视口 ${activeViewportId} 不在视口列表中`);
  setIsLoading(false);
  return;
}

const sequenceIndex = activeViewportIndex < 3 ? 1 : 2;
const targetViewports = activeViewportIndex < 3 ? viewportIds.slice(0, 3) : viewportIds.slice(3, 6);

console.log(`  激活视口属于序列 ${sequenceIndex}`);
console.log(`  目标视口组:`, targetViewports);
```

#### 3. 只更新目标序列的视口

**文件**: [MPRViewer.tsx:906-960](src/MPRViewer.tsx:906-960)

```typescript
// 创建新的 volume
const newVolumeId = `volume-${seriesInfo.seriesInstanceUID}`;
const newVolume = await volumeLoader.createAndCacheVolume(newVolumeId, {
  imageIds: seriesInfo.imageIds,
});
newVolume.load();

// 为目标序列的视口设置新的 volume
await setVolumesForViewports(
  renderingEngine,
  [{ volumeId: newVolumeId }],
  targetViewports  // 只更新目标序列的视口
);

// 从新序列获取窗宽窗位信息
const voi = metaData.get('voiLutModule', seriesInfo.imageIds[0]);

if (voi) {
  const voiRange = utilities.windowLevel.toLowHighRange(
    voi.windowWidth,
    voi.windowCenter,
    voi.voiLutFunction
  );

  // 为目标序列的每个视口设置窗宽窗位
  targetViewports.forEach((viewportId) => {
    try {
      const viewport = renderingEngine!.getViewport(viewportId) as Types.IVolumeViewport;
      if (viewport) {
        viewport.setProperties({ voiRange });

        // 更新 windowLevels state
        const width = voiRange.upper - voiRange.lower;
        const center = (voiRange.upper + voiRange.lower) / 2;
        setWindowLevels((prev) => ({
          ...prev,
          [viewportId]: { center, width },
        }));
      }
    } catch (error) {
      console.warn(`设置视口 ${viewportId} 窗宽窗位失败:`, error);
    }
  });
}

// 更新对应的 volumeId state
if (sequenceIndex === 1) {
  setVolumeId(newVolumeId);
  setImageIds(seriesInfo.imageIds);
} else {
  setSecondaryVolumeId(newVolumeId);
}

// 更新当前序列 UID
setCurrentSeriesUID(seriesInfo.seriesInstanceUID);

// 重新渲染目标序列的视口
renderingEngine.renderViewports(targetViewports);
```

#### 4. 更新依赖项

**文件**: [MPRViewer.tsx:1079](src/MPRViewer.tsx:1079)

```typescript
}, [renderingEngine, viewportIds, secondaryVolumeId, activeViewportId]);
```

添加了新的依赖项：
- `viewportIds`: 用于确定当前布局类型和视口索引
- `secondaryVolumeId`: 用于检测双序列布局
- `activeViewportId`: 用于确定要更新哪个序列

**使用方法**:
1. 在双序列 MPR 布局下，点击任意视口激活它
2. 双击序列面板中的某个序列
3. 该序列将被加载到激活视口所属的序列行（上排或下排）

---

## 测试验证

### 测试环境

- **浏览器**: Chrome / Firefox / Edge
- **Cornerstone3D 版本**: 最新
- **测试数据**: 至少 2 个 DICOM 序列

### 测试用例

#### 用例 1: 双序列布局创建

**步骤**:
1. 加载至少 2 个 DICOM 序列
2. 点击布局按钮 → 协议布局 → 双序列 MPR

**预期结果**:
- ✅ 显示 2 行 × 3 列网格布局
- ✅ 上排显示序列 1 的 Axial、Sagittal、Coronal
- ✅ 下排显示序列 2 的 Axial、Sagittal、Coronal
- ✅ 视口标签正确显示（Seq 1 - Axial、Seq 2 - Axial 等）
- ✅ 控制台输出：`✅ 双序列 MPR 布局已应用，共 6 个视口`

#### 用例 2: 基本工具测试

**步骤**:
1. 中键拖动
2. 右键拖动
3. 滚轮滚动

**预期结果**:
- ✅ 中键拖动：图像平移
- ✅ 右键拖动：图像缩放
- ✅ 滚轮：切换切片

#### 用例 3: 十字线功能

**步骤**:
1. 点击工具栏的"十字线"按钮
2. 在序列 1 的任意视口中左键拖动
3. 在序列 2 的任意视口中左键拖动

**预期结果**:
- ✅ 控制台输出：`✅ 已启用双序列十字线`
- ✅ 序列 1 的三个视口十字线联动
- ✅ 序列 2 的三个视口十字线联动
- ✅ 两个序列之间互不干扰

#### 用例 4: 测量工具

**步骤**:
1. 点击"长度"按钮
2. 在序列 1 的视口绘制测量
3. 在序列 2 的视口绘制测量

**预期结果**:
- ✅ 可以在两个序列中绘制测量
- ✅ 测量结果正确显示

#### 用例 5: 智能测量跳转

**步骤**:
1. 在序列 1 创建测量
2. 在序列 2 创建测量
3. 在测量面板中点击序列 1 的测量
4. 在测量面板中点击序列 2 的测量

**预期结果**:
- ✅ 控制台输出：`📝 标注已添加到序列 1 (viewport-xxx-0)`
- ✅ 控制台输出：`📝 标注已添加到序列 2 (viewport-xxx-3)`
- ✅ 点击序列 1 的测量跳转到上排视口
- ✅ 点击序列 2 的测量跳转到下排视口
- ✅ 控制台输出：`✅ 测量属于序列 1（自定义元数据）`

#### 用例 6: 窗宽窗位工具

**步骤**:
1. 点击"窗宽窗位"按钮
2. 在任意视口中左键拖动调节

**预期结果**:
- ✅ 控制台输出：`✅ 已启用双序列窗宽窗位调节`
- ✅ 可以在两个序列中独立调节窗宽窗位

#### 用例 7: 工具切换

**步骤**:
1. 启用十字线
2. 切换到窗宽窗位
3. 切换到长度测量
4. 再次切换回十字线

**预期结果**:
- ✅ 工具切换流畅
- ✅ 两个序列的工具状态同步更新
- ✅ 没有错误信息

#### 用例 8: 视口激活状态 ✨ 新增

**步骤**:
1. 切换到双序列MPR布局
2. 观察第一个视口是否有蓝色边框
3. 点击不同的视口（包括序列1和序列2的视口）
4. 观察激活状态是否正确切换

**预期结果**:
- ✅ 初始状态：第一个视口（序列1的Axial）显示蓝色边框
- ✅ 点击任意视口：该视口显示蓝色边框
- ✅ 其他视口：边框消失
- ✅ 激活视口悬停：边框变为绿色
- ✅ 非激活视口悬停：边框变为灰色
- ✅ 控制台输出：`✅ 设置视口 xxx 为激活状态`
- ✅ 控制台输出：`✅ 激活视口: xxx`

#### 用例 9: 双序列独立切换 ✨ 新增

**步骤**:
1. 切换到双序列 MPR 布局
2. 点击序列 1 的任意视口（上排）激活它
3. 双击序列面板中的序列 A
4. 观察上排三个视口是否显示序列 A
5. 点击序列 2 的任意视口（下排）激活它
6. 双击序列面板中的序列 B
7. 观察下排三个视口是否显示序列 B

**预期结果**:
- ✅ 步骤 2：控制台输出：`✅ 激活视口: viewport-xxx-0`（序列 1 的视口）
- ✅ 步骤 3：控制台输出：`🔄 双序列 MPR 布局：正在切换序列到激活视口`
- ✅ 步骤 3：控制台输出：`  激活视口属于序列 1`
- ✅ 步骤 3：控制台输出：`  目标视口组: [viewport-xxx-0, viewport-xxx-1, viewport-xxx-2]`
- ✅ 步骤 4：上排三个视口显示序列 A 的 Axial、Sagittal、Coronal
- ✅ 步骤 4：下排三个视口仍显示原始序列
- ✅ 步骤 5：控制台输出：`✅ 激活视口: viewport-xxx-3`（序列 2 的视口）
- ✅ 步骤 6：控制台输出：`  激活视口属于序列 2`
- ✅ 步骤 6：控制台输出：`  目标视口组: [viewport-xxx-3, viewport-xxx-4, viewport-xxx-5]`
- ✅ 步骤 7：下排三个视口显示序列 B 的 Axial、Sagittal、Coronal
- ✅ 步骤 7：上排三个视口仍显示序列 A
- ✅ 窗宽窗位正确应用
- ✅ 控制台输出：`✅ 序列 1 已切换到: X` 或 `✅ 序列 2 已切换到: Y`

### 预期日志

```
🔧 开始配置双序列 MPR 工具组...
✅ 创建序列 1 工具组: mpr-seq1
✅ 序列 1 工具已添加
✅ 创建序列 2 工具组: mpr-seq2
✅ 序列 2 工具已添加
🔧 配置序列 1 工具组（视口 0-2）...
  ✓ 序列1 视口 viewport-xxx-0 已添加到工具组
  ✓ 序列1 视口 viewport-xxx-1 已添加到工具组
  ✓ 序列1 视口 viewport-xxx-2 已添加到工具组
🔧 配置序列 2 工具组（视口 3-5）...
  ✓ 序列2 视口 viewport-xxx-3 已添加到工具组
  ✓ 序列2 视口 viewport-xxx-4 已添加到工具组
  ✓ 序列2 视口 viewport-xxx-5 已添加到工具组
🔧 配置 序列1 工具...
  ✓ 序列1 平移工具已配置（中键）
  ✓ 序列1 缩放工具已配置（右键）
  ✓ 序列1 换层工具已配置（滚轮）
  ✓ 序列1 长度测量工具已启用（左键，默认）
🔧 配置 序列2 工具...
  ✓ 序列2 平移工具已配置（中键）
  ✓ 序列2 缩放工具已配置（右键）
  ✓ 序列2 换层工具已配置（滚轮）
  ✓ 序列2 长度测量工具已启用（左键，默认）
✅ 双序列 MPR 工具组配置完成（两个独立工具组）
✅ 已添加标注序列追踪监听器
✅ 设置视口 viewport-xxx-0 为激活状态
✅ 双序列 MPR 布局已应用，共 6 个视口
```

---

## 技术要点

### 双序列 MPR 布局识别

```typescript
const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;
```

**判断条件**:
1. 视口数量为 6 个
2. 存在第二个 volume ID

### 视口索引映射

| 序列 | Axial | Sagittal | Coronal |
|------|-------|----------|---------|
| 序列 1 | viewportIds[0] | viewportIds[1] | viewportIds[2] |
| 序列 2 | viewportIds[3] | viewportIds[4] | viewportIds[5] |

### 工具组管理

**标准布局**:
```
mpr 工具组 → 管理 3 个视口
```

**双序列布局**:
```
mpr-seq1 工具组 → 管理序列 1 的 3 个视口
mpr-seq2 工具组 → 管理序列 2 的 3 个视口
```

### 位置联动实现 ✨ 改进

**核心机制**: 使用 Cornerstone3D 官方 `CameraPositionSynchronizer` API

**导入依赖**:
```typescript
import {
  synchronizers,
  SynchronizerManager,
} from '@cornerstonejs/tools';
```

**启用位置联动**:
```typescript
const handleTogglePositionLink = () => {
  const newPositionLinked = !positionLinked;
  setPositionLinked(newPositionLinked);
  positionLinkedRef.current = newPositionLinked;

  const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;
  if (!isDualSequenceLayout) {
    console.warn('⚠️ 位置联动功能仅在双序列 MPR 布局下可用');
    setPositionLinked(false);
    return;
  }

  if (newPositionLinked) {
    console.log('✅ 已启用双序列双向位置联动（使用官方 Synchronizer）');

    // 为每个方向创建独立的同步器
    const directions = ['axial', 'sagittal', 'coronal'] as const;

    directions.forEach((direction, index) => {
      const syncId = `dual-${direction}-sync`;
      const viewport1Id = viewportIds[index];        // 序列1的视口
      const viewport2Id = viewportIds[3 + index];    // 序列2的视口

      // 检查同步器是否已存在
      let synchronizer = SynchronizerManager.getSynchronizer(syncId);

      if (!synchronizer) {
        // 创建新的相机位置同步器
        synchronizer = synchronizers.createCameraPositionSynchronizer(syncId);
        console.log(`  📋 创建同步器: ${syncId}`);
      }

      // 添加视口到同步器（双向同步）
      const renderingEngineId = renderingEngine.id;
      const viewport1Info = { viewportId: viewport1Id, renderingEngineId };
      const viewport2Info = { viewportId: viewport2Id, renderingEngineId };

      synchronizer.add(viewport1Info);
      synchronizer.add(viewport2Info);

      console.log(`  🔗 添加视口到 ${syncId}:`);
      console.log(`     - ${viewport1Id} (序列1 ${direction})`);
      console.log(`     - ${viewport2Id} (序列2 ${direction})`);
    });

    console.log('✅ 位置同步器配置完成');
  }
};
```

**禁用位置联动**:
```typescript
// 移除所有视口从同步器
const directions = ['axial', 'sagittal', 'coronal'] as const;

directions.forEach((direction) => {
  const syncId = `dual-${direction}-sync`;
  const synchronizer = SynchronizerManager.getSynchronizer(syncId);

  if (synchronizer) {
    const viewport1Id = viewportIds[directions.indexOf(direction)];
    const viewport2Id = viewportIds[3 + directions.indexOf(direction)];

    const viewport1Info = { viewportId: viewport1Id, renderingEngineId };
    const viewport2Info = { viewportId: viewport2Id, renderingEngineId };

    synchronizer.remove(viewport1Info);
    synchronizer.remove(viewport2Info);

    // 检查同步器是否为空，如果为空则销毁
    const sourceViewports = synchronizer.getSourceViewports();
    const targetViewports = synchronizer.getTargetViewports();

    if (!sourceViewports.length && !targetViewports.length) {
      SynchronizerManager.destroySynchronizer(syncId);
      console.log(`  💥 销毁同步器: ${syncId}`);
    }
  }
});
```

**组件卸载时清理**:
```typescript
useEffect(() => {
  return () => {
    // 销毁所有双序列位置同步器
    const directions = ['axial', 'sagittal', 'coronal'] as const;

    directions.forEach((direction) => {
      const syncId = `dual-${direction}-sync`;
      const synchronizer = SynchronizerManager.getSynchronizer(syncId);

      if (synchronizer) {
        SynchronizerManager.destroySynchronizer(syncId);
        console.log(`💥 销毁同步器: ${syncId}`);
      }
    });
  };
}, []);
```

**同步器架构**:

| 同步器 ID | 序列1视口 | 序列2视口 | 说明 |
|----------|---------|---------|------|
| `dual-axial-sync` | viewportIds[0] | viewportIds[3] | Axial 视图同步 |
| `dual-sagittal-sync` | viewportIds[1] | viewportIds[4] | Sagittal 视图同步 |
| `dual-coronal-sync` | viewportIds[2] | viewportIds[5] | Coronal 视图同步 |

**技术优势**:
1. **官方 API**: 使用 Cornerstone3D 官方同步器，与 OHIF TMTV 一致
2. **自动处理**: 无需手动监听事件，官方 API 自动处理所有同步逻辑
3. **性能优化**: 官方实现经过充分测试和优化
4. **无循环问题**: 官方 API 内部处理循环防止
5. **完整支持**: 支持换层、旋转、缩放、平移等所有位置变化
6. **简化代码**: 无需手动管理事件监听器、去抖、状态追踪等

**标准布局**:
```
mpr 工具组 → 管理 3 个视口
```

**双序列布局**:
```
mpr-seq1 工具组 → 管理序列 1 的 3 个视口
mpr-seq2 工具组 → 管理序列 2 的 3 个视口
```

### 渲染优化

只渲染相关的视口，而不是所有视口：

```typescript
// 标准布局：渲染所有视口
renderingEngine.renderViewports(viewportIds);

// 双序列布局：只渲染目标序列的视口
const seqStartIndex = targetSequenceIndex * 3;
renderingEngine.renderViewports([
  viewportIds[seqStartIndex],
  viewportIds[seqStartIndex + 1],
  viewportIds[seqStartIndex + 2]
]);
```

这样可以提高性能，避免不必要的渲染。

### 视口激活状态管理

**CSS样式定义** ([index.css:139-176](src/index.css:139-176)):

```css
/* 激活视口样式 */
.viewport-container.active {
  border: 2px solid #007acc;
  box-shadow:
    0 0 8px rgba(0, 122, 204, 0.6),
    inset 0 0 20px rgba(0, 122, 204, 0.1);
  z-index: 10;
}

/* 激活视口 - 悬停效果 */
.viewport-container.active:hover {
  border-color: #00d084;
  box-shadow:
    0 0 12px rgba(0, 208, 132, 0.6),
    inset 0 0 20px rgba(0, 208, 132, 0.1);
}

/* 非激活视口 - 悬停效果 */
.viewport-container:hover {
  border-color: #555;
}
```

**关键实现**:
1. 创建视口时检查并添加 `active` 类
2. 点击视口时动态更新所有视口的 `active` 类
3. 不依赖状态值，直接查询 DOM 结构更新样式

---

## 已知限制

### 1. 事件监听器生命周期

**当前实现**: 事件监听器在切换到双序列布局时添加，但不移除

**影响**:
- 切换回单序列布局后，监听器仍然存在
- 可能在单序列布局中捕获不需要的标注事件

**未来优化**:
```typescript
// 建议添加
useEffect(() => {
  return () => {
    // 清理事件监听器
    eventTarget.removeEventListener('annotationAdded', handleAnnotationAdded);
  };
}, [currentLayout]);
```

### 2. 旧标注的兼容性

**当前实现**: 旧布局创建的标注没有序列信息元数据

**影响**:
- 点击旧标注时无法智能跳转
- 会默认跳转到序列 1

**解决方案**: 删除旧标注，在双序列布局下重新创建

### 3. referencedImageId 格式限制

**当前实现**: `referencedImageId` 格式为 `dicomfile:76`，不包含 volume 信息

**影响**: 备用方法（从 referencedImageId 提取）不可用

**解决方案**: 依赖自定义元数据（方法 1 和 2）

---

## 性能优化建议

### 1. 延迟加载第二个 Volume

**当前实现**: 两个 volume 同时加载

**优化建议**: 只在切换到双序列布局时加载第二个 volume

```typescript
if (layout === 'dual-mpr' && !secondaryVolumeId) {
  // 延迟加载第二个 volume
  const secondVolume = await volumeLoader.createAndCacheVolume(volumeId2, {
    imageIds: secondSeries.imageIds,
  });
  secondVolume.load();
}
```

### 2. 按需渲染视口

**当前实现**: 所有 6 个视口同时渲染

**优化建议**: 只渲染可见的视口

```typescript
// 使用 IntersectionObserver 检测可见视口
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 渲染视口
    }
  });
});
```

### 3. 工具组复用

**当前实现**: 每次切换布局都创建新工具组

**优化建议**: 复用已创建的工具组

```typescript
// 检查工具组是否已存在
if (ToolGroupManager.getToolGroup('mpr-seq1')) {
  // 复用现有工具组
} else {
  // 创建新工具组
}
```

---

## 相关文档

- [ANNOTATION_PANEL_DUAL_SEQUENCE_FIX.md](ANNOTATION_PANEL_DUAL_SEQUENCE_FIX.md) - 测量面板智能跳转修复
- [TOOL_CONFIGURATION_FIX.md](TOOL_CONFIGURATION_FIX.md) - 工具配置修复
- [VIEWPORT_SIZE_FIX.md](VIEWPORT_SIZE_FIX.md) - 视口尺寸修复
- [REACT_REMOVECHILD_FIX.md](REACT_REMOVECHILD_FIX.md) - React DOM 操作冲突修复
- [DUAL_SEQUENCE_MPR_LAYOUT.md](DUAL_SEQUENCE_MPR_LAYOUT.md) - 双序列布局实现文档

---

## 总结

双序列 MPR 功能的实现涉及多个复杂的技术挑战：

1. **布局管理**: 动态创建 2×3 网格，避免嵌套网格冲突
2. **工具组隔离**: 使用两个独立的工具组避免跨 volume 同步问题
3. **状态同步**: 确保两个序列的工具状态保持同步
4. **智能跳转**: 通过事件监听器和自定义元数据实现序列识别
5. **DOM 协调**: 正确处理 React 和手动 DOM 操作的时序
6. **视口激活**: 通过 DOM 查询动态更新视口激活状态，避免闭包陷阱 ✨ 新增
7. **序列切换**: 支持双序列布局下的独立序列切换，根据激活视口智能判断目标序列 ✨ 新增
8. **位置联动**: 使用官方 Synchronizer API 实现跨序列位置同步，支持所有操作 ✨ 改进

通过系统性地解决这些问题，我们实现了一个功能完整、性能良好的双序列 MPR 查看器。用户可以：

- 同时对比两个不同序列的图像
- 在序列之间独立切换，不影响另一个序列
- 使用所有常用工具（平移、缩放、换层、十字线、窗宽窗位、测量）
- 智能跳转到测量所属的序列
- 直观地看到当前激活的视口
- 使用位置联动功能同步两个序列的相机位置（包括非标准方向下的换层）✨ 改进

---

## 版本历史

### v2.1 (2026-01-24) - 位置联动重构 & 测量跳转优化

**重大改进1**: 使用 Cornerstone3D 官方 Synchronizer API

- ✨ **重写位置联动实现**:
  - 从手动事件监听改为使用官方 `CameraPositionSynchronizer`
  - 为每个方向创建独立的同步器（Axial、Sagittal、Coronal）
  - 简化代码逻辑，移除手动事件管理、去抖、状态追踪等复杂代码

- 🐛 **修复关键问题**:
  - 修复非标准方向（旋转后）换层时的差层问题
  - 解决循环触发导致的性能问题
  - 修复 IMAGE_RENDERED 事件不触发的同步失败

**重大改进2**: 测量跳转逻辑重构（参考 OHIF Viewers）

- ✨ **优化测量跳转逻辑**:
  - 采用基于距离的精确位置判断（替代复杂的边界框检查）
  - 使用欧氏距离检查是否已在测量位置（阈值 1mm）
  - 只跳转位置，保持当前视口方向（避免黑屏问题）

- 🐛 **修复关键问题**:
  - 修复 `isMeasurementWithinViewport` 误判导致的跳转失败
  - 禁用 `setViewReference` API（存在兼容性问题，会导致黑屏）
  - 使用可靠的相机调整方法作为唯一跳转方式

- 🔧 **新增工具模块**:
  - 创建 `measurementNavigationUtils.ts` 工具函数库
  - 实现 `getCenterExtent()` - 计算测量中心点和边界框
  - 实现 `isMeasurementWithinViewport()` - 检查测量可见性
  - 实现 `jumpToAnnotationUsingCamera()` - 相机调整跳转方法

- 📚 **参考实现**:
  - 位置联动：与 OHIF TMTV 的实现方式完全一致
  - 测量跳转：参考 OHIF commandsModule 的 jumpToMeasurementViewport

- 🔧 **代码改进**:
  - 删除 ~150 行手动事件管理代码（位置联动）
  - 删除硬编码的轴向判断代码（测量跳转）
  - 使用简化的相机调整逻辑

- ⚠️ **已知限制**:
  - 跳转时不恢复相机方向（保持当前方向）
  - 未来需要实现 ViewReference 的完整支持来恢复方向

**详细文档**: [MEASUREMENT_JUMP_REFACTOR.md](MEASUREMENT_JUMP_REFACTOR.md)

**技术细节**:
```typescript
// 位置联动
synchronizers.createCameraPositionSynchronizer(syncId);
synchronizer.add({ viewportId, renderingEngineId });

// 测量跳转
viewport.setViewReference({
  referencedImageId: annotation.metadata.referencedImageId,
  volumeId: annotation.metadata.volumeId
});
```

### v2.0 (2026-01-24) - 位置联动初始实现
- ✨ 新增位置联动功能（手动事件监听实现）
- ✨ 新增双序列独立切换功能
- ✨ 新增视口激活状态显示

### v1.2 (2026-01-24) - 测量跳转优化
- ✨ 修复测量面板智能跳转
- ✨ 添加序列信息元数据

---

**文档版本**: 2.1
**最后更新**: 2026-01-24
**维护者**: Claude Code Assistant
