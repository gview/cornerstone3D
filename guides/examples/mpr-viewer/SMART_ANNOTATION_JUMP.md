# 双序列 MPR 智能测量跳转实现

## 功能描述

在双序列 MPR 布局下，点击测量面板中的测量项时，自动识别该测量属于哪个序列，并跳转到对应序列的视口。

## 实现原理

### 1. 从标注的 referencedImageId 提取 volume ID

**ImageId 格式**：
```
wadouri:file://path/file.dcm:0:volume-xxx
imageId:123:volume-xxx
```

**提取逻辑** ([AnnotationsPanel.tsx:285-310](src/components/AnnotationsPanel.tsx:285-310))：

```typescript
const extractVolumeIdFromImageId = (imageId: string): string | null => {
  // 方法1: 从最后一个冒号后提取
  const parts = imageId.split(':');
  if (parts.length >= 3) {
    const potentialVolumeId = parts[parts.length - 1];
    if (potentialVolumeId.startsWith('volume-') ||
        potentialVolumeId.startsWith('my-volume-id-')) {
      return potentialVolumeId;
    }
  }

  // 方法2: 正则匹配
  const volumeMatch = imageId.match(/(volume-[^\s:]+|my-volume-id-[^\s:]+)/);
  if (volumeMatch) {
    return volumeMatch[1];
  }

  return null;
};
```

### 2. 比对体积 ID 确定序列

**逻辑** ([AnnotationsPanel.tsx:320-342](src/components/AnnotationsPanel.tsx:320-342))：

```typescript
let targetSequenceIndex = 0; // 默认序列 1

if (isDualSequenceLayout && annotation.metadata.referencedImageId) {
  const annotationVolumeId = extractVolumeIdFromImageId(annotation.metadata.referencedImageId);

  // 判断属于哪个序列
  if (annotationVolumeId === secondaryVolumeId) {
    targetSequenceIndex = 1; // 序列 2
    console.log('✅ 测量属于序列 2');
  } else if (annotationVolumeId === volumeId) {
    targetSequenceIndex = 0; // 序列 1
    console.log('✅ 测量属于序列 1');
  } else {
    console.warn('⚠️ 无法确定测量所属序列，默认使用序列 1');
  }
}
```

### 3. 根据序列索引选择视口

**视口索引映射** ([AnnotationsPanel.tsx:402-422](src/components/AnnotationsPanel.tsx:402-422))：

```typescript
if (isDualSequenceLayout) {
  // 根据序列计算起始索引
  const seqStartIndex = targetSequenceIndex * 3; // 序列1: 0, 序列2: 3

  console.log(`🔧 双序列 MPR 布局，使用序列 ${targetSequenceIndex + 1} 的视口（索引 ${seqStartIndex}-${seqStartIndex + 2}）`);

  // 序列 1: 索引 0, 1, 2
  // 序列 2: 索引 3, 4, 5
  axialViewport = renderingEngine.getViewport(viewportIds[seqStartIndex]);
  sagittalViewport = renderingEngine.getViewport(viewportIds[seqStartIndex + 1]);
  coronalViewport = renderingEngine.getViewport(viewportIds[seqStartIndex + 2]);

  targetViewportIds = [
    viewportIds[seqStartIndex],
    viewportIds[seqStartIndex + 1],
    viewportIds[seqStartIndex + 2]
  ];
}
```

## 视口索引映射表

| 序列 | Axial | Sagittal | Coronal |
|------|-------|----------|---------|
| 序列 1 | viewportIds[0] | viewportIds[1] | viewportIds[2] |
| 序列 2 | viewportIds[3] | viewportIds[4] | viewportIds[5] |

## 测试验证

### 测试步骤

1. **切换到双序列 MPR 布局**
2. **在序列 1 的视口（上排）创建测量**
   - 在 Axial, Sagittal 或 Coronal 视口绘制测量
   - 打开测量面板，点击该测量
3. **在序列 2 的视口（下排）创建测量**
   - 在下排的任意视口绘制测量
   - 打开测量面板，点击该测量

### 预期日志

**序列 1 的测量**：
```
🔍 测量的 referencedImageId: wadouri:file://path:0:my-volume-id-xxx
🔍 提取的 volumeId: my-volume-id-xxx
🔧 当前主 volumeId: my-volume-id-xxx
🔧 当前副 volumeId: volume-yyy
✅ 测量属于序列 1
🔧 双序列 MPR 布局，使用序列 1 的视口（索引 0-2）
✅ 已跳转到测量位置: [x.xx, y.yy, z.zz]
✅ 使用的视口索引: viewport-xxx-0, viewport-xxx-1, viewport-xxx-2
```

**序列 2 的测量**：
```
🔍 测量的 referencedImageId: wadouri:file://path:0:volume-yyy
🔍 提取的 volumeId: volume-yyy
🔧 当前主 volumeId: my-volume-id-xxx
🔧 当前副 volumeId: volume-yyy
✅ 测量属于序列 2
🔧 双序列 MPR 布局，使用序列 2 的视口（索引 3-5）
✅ 已跳转到测量位置: [x.xx, y.yy, z.zz]
✅ 使用的视口索引: viewport-xxx-3, viewport-xxx-4, viewport-xxx-5
```

## 技术要点

### ImageId 结构分析

Cornerstone3D 的 ImageId 通常包含以下部分：
```
[prefix]:[data]:[frameIndex]:[volumeId]
```

**示例**：
- `wadouri:file://C:/data/file.dcm:0:volume-1.2.840.xxx`
- `imageId:123:volume-seriesInstanceUID`

**提取方法**：
1. 按冒号 `:` 分割
2. 取最后一部分
3. 检查是否以 `volume-` 或 `my-volume-id-` 开头

### 序列判断逻辑

```typescript
if (annotationVolumeId === secondaryVolumeId) {
  // 属于序列 2
} else if (annotationVolumeId === volumeId) {
  // 属于序列 1
} else {
  // 无法确定，默认序列 1
}
```

### 容错处理

1. **如果没有 referencedImageId**
   - 默认使用序列 1

2. **如果提取 volumeId 失败**
   - 输出警告日志
   - 默认使用序列 1

3. **如果 volumeId 不匹配**
   - 输出警告日志
   - 默认使用序列 1

## 调试技巧

### 查看标注的完整元数据

在控制台执行：
```javascript
const annotations = state.getAllAnnotations();
annotations.forEach(ann => {
  console.log('Annotation:', {
    toolName: ann.metadata.toolName,
    referencedImageId: ann.metadata.referencedImageId,
    annotationUID: ann.annotationUID,
  });
});
```

### 查看当前 volume IDs

在控制台执行：
```javascript
console.log('Volume ID:', volumeId);
console.log('Secondary Volume ID:', secondaryVolumeId);
```

## 性能优化

只渲染相关的视口，而不是所有 6 个视口：

```typescript
// 只渲染目标序列的 3 个视口
renderingEngine.renderViewports(targetViewportIds);
// 而不是 renderingEngine.renderViewports(viewportIds);
```

这样可以：
- 减少渲染时间
- 降低 GPU 负载
- 提高响应速度

## 已知限制

### 1. 依赖于 referencedImageId

如果标注对象中没有保存 `referencedImageId`，则无法判断所属序列。

### 2. ImageId 格式变化

如果 Cornerstone3D 的 ImageId 格式发生变化，需要更新 `extractVolumeIdFromImageId` 函数。

### 3. 跨序列测量

如果测量跨越两个序列（例如测量序列 1 上的点和序列 2 上的点），当前逻辑会根据第一个点的 imageId 来判断。

## 未来改进

### 方案 1：添加自定义元数据

在创建标注时添加序列信息：

```typescript
annotation.metadata.sequenceIndex = 0; // 或 1
annotation.metadata.sequenceVolumeId = volumeId;
```

### 方案 2：记录创建视口

记录测量是在哪个视口创建的：

```typescript
annotation.metadata.createdViewportId = currentViewportId;
annotation.metadata.createdSequenceIndex = sequenceIndex;
```

### 方案 3：使用测量空间坐标

根据测量的空间坐标和两个 volume 的空间范围来判断：

```typescript
const point = targetPoint;
if (isPointInVolume1(point)) {
  // 使用序列 1 的视口
} else if (isPointInVolume2(point)) {
  // 使用序列 2 的视口
}
```

## 相关文件

- **[AnnotationsPanel.tsx](src/components/AnnotationsPanel.tsx)**
  - 添加了 `extractVolumeIdFromImageId` 函数
  - 更新了 `jumpToAnnotation` 函数支持智能跳转
  - 添加了详细的调试日志

- **[MPRViewer.tsx](src/MPRViewer.tsx)**
  - 传递 `volumeId` 和 `secondaryVolumeId` 给 AnnotationsPanel

---

**版本**: 2.0 - 智能跳转实现
**实现日期**: 2026-01-24
**状态**: ✅ 已完成
