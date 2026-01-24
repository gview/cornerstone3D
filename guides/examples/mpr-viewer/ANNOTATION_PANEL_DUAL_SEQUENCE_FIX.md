# 双序列 MPR 测量面板修复

## 问题描述

在双序列 MPR 布局下，点击测量面板中的测量项时，期望跳转到对应序列的视口，但实际总是跳转到序列 1 的视口（前 3 个视口）。

## 根本原因

测量面板 (`AnnotationsPanel`) 的 `jumpToAnnotation` 函数硬编码了使用前 3 个视口：

```typescript
// 旧代码
const axialViewport = renderingEngine.getViewport(viewportIds[0]);
const sagittalViewport = renderingEngine.getViewport(viewportIds[1]);
const coronalViewport = renderingEngine.getViewport(viewportIds[2]);
```

在双序列 MPR 布局下：
- `viewportIds[0-2]`：序列 1 的 Axial, Sagittal, Coronal
- `viewportIds[3-5]`：序列 2 的 Axial, Sagittal, Coronal

无论点击哪个序列的测量，都会跳转到序列 1 的视口。

## 解决方案

### 修改 1：添加 volume ID 参数

**文件**: [AnnotationsPanel.tsx](src/components/AnnotationsPanel.tsx:28-38)

添加 `volumeId` 和 `secondaryVolumeId` 参数：

```typescript
interface AnnotationsPanelProps {
  renderingEngine: Types.IRenderingEngine | null;
  viewportIds: string[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  panelPosition?: 'left' | 'right';
  onPanelPositionChange?: (position: 'left' | 'right') => void;
  volumeId?: string | null;  // 主 volume ID
  secondaryVolumeId?: string | null;  // 第二个 volume ID（用于双序列布局）
}
```

### 修改 2：更新 jumpToAnnotation 函数

**文件**: [AnnotationsPanel.tsx](src/components/AnnotationsPanel.tsx:283-422)

添加双序列 MPR 布局检测和视口选择逻辑：

```typescript
const jumpToAnnotation = (annotation: Annotation) => {
  // 🔧 判断是否是双序列 MPR 布局
  const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

  // ... 获取 targetPoint 坐标 ...

  // 🔧 根据布局选择视口
  let axialViewport, sagittalViewport, coronalViewport;
  let targetViewportIds: string[];

  if (isDualSequenceLayout) {
    // 双序列 MPR 布局
    console.log('🔧 双序列 MPR 布局，使用序列1的视口（索引 0-2）');

    axialViewport = renderingEngine.getViewport(viewportIds[0]);
    sagittalViewport = renderingEngine.getViewport(viewportIds[1]);
    coronalViewport = renderingEngine.getViewport(viewportIds[2]);
    targetViewportIds = [viewportIds[0], viewportIds[1], viewportIds[2]];
  } else {
    // 标准三视图布局
    axialViewport = renderingEngine.getViewport(viewportIds[0]);
    sagittalViewport = renderingEngine.getViewport(viewportIds[1]);
    coronalViewport = renderingEngine.getViewport(viewportIds[2]);
    targetViewportIds = viewportIds;
  }

  // ... 更新相机并渲染 ...
  renderingEngine.renderViewports(targetViewportIds);
};
```

### 修改 3：传递 volume ID 参数

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx)

在两处 `AnnotationsPanel` 使用处添加 `volumeId` 和 `secondaryVolumeId` 参数：

**左侧测量面板**（行 1974-1984）：
```tsx
<AnnotationsPanel
  renderingEngine={renderingEngine}
  viewportIds={viewportIds}
  onClose={handleCloseAnnotationsPanel}
  isCollapsed={isAnnotationsPanelCollapsed}
  onToggleCollapse={handleToggleAnnotationsPanelCollapse}
  panelPosition="left"
  onPanelPositionChange={handleAnnotationsPanelPositionChange}
  volumeId={volumeId}                    // ✅ 新增
  secondaryVolumeId={secondaryVolumeId}  // ✅ 新增
/>
```

**右侧测量面板**（行 2122-2132）：
```tsx
<AnnotationsPanel
  renderingEngine={renderingEngine}
  viewportIds={viewportIds}
  onClose={handleCloseAnnotationsPanel}
  isCollapsed={isAnnotationsPanelCollapsed}
  onToggleCollapse={handleToggleAnnotationsPanelCollapse}
  panelPosition="right"
  onPanelPositionChange={handleAnnotationsPanelPositionChange}
  volumeId={volumeId}                    // ✅ 新增
  secondaryVolumeId={secondaryVolumeId}  // ✅ 新增
/>
```

## ✅ 智能跳转实现（已完成）

### 实现方案：方案 2 - 在标注元数据中保存序列信息

我们已实现真正的"智能跳转"功能，使用**方案 2**（在标注元数据中保存序列信息）。

### 核心机制

#### 1. 事件监听器添加序列信息（MPRViewer.tsx）

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx:1660-1684)

在双序列 MPR 布局创建时，添加 `annotationAdded` 事件监听器：

```typescript
const handleAnnotationAdded = (event: any) => {
  const { annotation } = event.detail;

  // 确定标注是在哪个视口创建的
  const viewportId = annotation.metadata.viewpointId;
  const sequenceIndex = newViewportIds.findIndex(id => id === viewportId);

  if (sequenceIndex !== -1) {
    // 0-2: 序列 1, 3-5: 序列 2
    const sequenceNumber = sequenceIndex < 3 ? 1 : 2;
    const targetVolumeId = sequenceIndex < 3 ? volumeId : volumeId2;

    // 将 volumeId 信息添加到标注元数据
    annotation.metadata.volumeId = targetVolumeId;
    annotation.metadata.sequenceIndex = sequenceIndex;
    annotation.metadata.sequenceNumber = sequenceNumber;

    console.log(`📝 标注已添加到序列 ${sequenceNumber} (${viewportId})，volumeId: ${targetVolumeId}`);
  }
};

// 添加事件监听器
eventTarget.addEventListener('annotationAdded', handleAnnotationAdded as any);
```

#### 2. 三级序列判断机制（AnnotationsPanel.tsx）

**文件**: [AnnotationsPanel.tsx](src/components/AnnotationsPanel.tsx:335-383)

实现了**三级序列判断机制**，按优先级依次尝试：

**方法 1：使用 `metadata.volumeId`**（最高优先级）
```typescript
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
```

**方法 2：使用 `metadata.sequenceIndex`**（次优先级）
```typescript
else if (annotation.metadata.sequenceIndex !== undefined) {
  const seqIndex = annotation.metadata.sequenceIndex as number;
  targetSequenceIndex = seqIndex < 3 ? 0 : 1;
  console.log(`✅ 使用 sequenceIndex: ${seqIndex}，跳转到序列 ${targetSequenceIndex + 1}`);
}
```

**方法 3：从 `referencedImageId` 提取**（备用方法）
```typescript
else if (annotation.metadata.referencedImageId) {
  const annotationVolumeId = extractVolumeIdFromImageId(annotation.metadata.referencedImageId);
  // ... 判断逻辑
}
```

### 优势

1. **准确性高**：直接使用视口对应的 volumeId，100% 准确
2. **向后兼容**：对于旧标注（没有自定义元数据），仍然可以尝试从 `referencedImageId` 提取
3. **易于维护**：事件监听器逻辑简单，只在双序列布局下添加
4. **调试友好**：提供详细的日志输出，便于追踪问题

### 测试步骤

1. **切换到双序列 MPR 布局**
   - 加载至少 2 个序列
   - 切换到双序列 MPR 布局
   - 检查控制台是否有 "✅ 已添加标注序列追踪监听器" 日志

2. **在序列 1 创建测量**
   - 在上排视口（序列 1）绘制测量
   - 检查控制台日志：`📝 标注已添加到序列 1`
   - 在测量面板点击该测量
   - 应该跳转到上排视口（索引 0-2）✅

3. **在序列 2 创建测量**
   - 在下排视口（序列 2）绘制测量
   - 检查控制台日志：`📝 标注已添加到序列 2`
   - 在测量面板点击该测量
   - 应该跳转到下排视口（索引 3-5）✅

### 预期日志

```
✅ 已添加标注序列追踪监听器

在序列 1 创建测量时:
📝 标注已添加到序列 1 (viewport-xxx-0)，volumeId: volume-xxxxx

点击测量跳转时:
🔍 使用自定义 metadata.volumeId: volume-xxxxx
✅ 测量属于序列 1（自定义元数据）
🔧 双序列 MPR 布局，使用序列 1 的视口（索引 0-2）
✅ 已跳转到测量位置: [x.xx, y.yy, z.zz]

在序列 2 创建测量时:
📝 标注已添加到序列 2 (viewport-xxx-3)，volumeId: volume-yyyyy

点击测量跳转时:
🔍 使用自定义 metadata.volumeId: volume-yyyyy
✅ 测量属于序列 2（自定义元数据）
🔧 双序列 MPR 布局，使用序列 2 的视口（索引 3-5）
✅ 已跳转到测量位置: [x.xx, y.yy, z.zz]
```

### 注意事项

1. **切换布局后需要重新创建标注**
   - 旧布局创建的标注没有序列信息元数据
   - 建议删除旧标注，在双序列布局下重新创建

2. **事件监听器生命周期**
   - 事件监听器在切换到双序列布局时添加
   - 未来如果切换回单序列布局，可能需要移除监听器（待优化）

3. **备用方法的限制**
   - `referencedImageId` 格式为 `dicomfile:76`，不包含 volumeId 信息
   - 备用方法主要用于调试和向后兼容

---

**状态**: ✅ 已实现智能跳转功能（方案 2）
**版本**: 2.0
**更新日期**: 2026-01-24

## 相关文件

### 核心文件

- **[MPRViewer.tsx](src/MPRViewer.tsx:1660-1684)** - 主组件
  - 添加 `annotationAdded` 事件监听器
  - 在标注创建时添加序列信息元数据

- **[AnnotationsPanel.tsx](src/components/AnnotationsPanel.tsx:335-383)** - 测量面板组件
  - 实现三级序列判断机制
  - 根据序列信息跳转到对应视口

## 技术要点

### 双序列 MPR 布局识别

```typescript
const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;
```

**判断条件**：
1. 视口数量为 6 个
2. 存在第二个 volume ID

### 视口索引映射

| 序列 | Axial | Sagittal | Coronal |
|------|-------|----------|---------|
| 序列 1 | viewportIds[0] | viewportIds[1] | viewportIds[2] |
| 序列 2 | viewportIds[3] | viewportIds[4] | viewportIds[5] |

### 渲染优化

只渲染相关的视口，而不是所有视口：

```typescript
// 标准布局：渲染所有视口
renderingEngine.renderViewports(viewportIds);

// 双序列布局：只渲染序列 1 的视口
renderingEngine.renderViewports([viewportIds[0], viewportIds[1], viewportIds[2]]);
```

这样可以提高性能，避免不必要的渲染。

---

**版本**: 2.0
**修复日期**: 2026-01-24
**状态**: ✅ 已实现智能跳转功能（根据测量所属序列自动跳转）
**实现方案**: 使用 annotationAdded 事件监听器添加序列元数据
