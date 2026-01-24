# 序列切换窗宽窗位修复

本文档详细说明了序列切换时窗宽窗位处理的问题及其修复方案。

---

## 问题描述

### 原始问题

在切换不同序列时，视口四角显示的窗宽窗位与实际应用的窗宽窗位不一致。

### 复现步骤

1. 加载序列 A（例如：BONE 5mm），默认窗宽窗位为 40/400
2. 手动调整窗宽窗位为 50/500
3. 切换到序列 B（例如：STD 5mm），默认窗宽窗位为 30/300
4. **问题**：视口四角仍显示 "W: 500 L: 50"，但实际应用的是 "W: 300 L: 30"

---

## 根本原因

### 1. 状态同步缺失

**窗宽窗位有两个不同的来源**：

#### 来源 1: Cornerstone3D 视口属性
```typescript
viewport.getProperties().voiRange  // 实际应用的窗宽窗位
```
- 由 Cornerstone3D 内部管理
- 通过 `viewport.setProperties({ voiRange })` 设置
- **这是实际显示图像时使用的值**

#### 来源 2: React State
```typescript
windowLevels[viewportId]  // 用于 UI 显示的值
```
- 存储在 React state 中
- 传递给 ViewportOverlay 组件显示
- **这是视口四角显示的值**

### 2. 序列切换时的状态不同步

在原始的 `handleLoadSeries` 函数中：

```typescript
// ✅ 设置了视口的实际窗宽窗位
await setVolumesForViewports(renderingEngine, [{ volumeId }], viewportIds);

// ❌ 但没有更新 windowLevels state
// 导致 UI 显示的值与实际应用的值不一致
```

### 3. 事件监听器不会自动触发

`handleVOIModified` 事件监听器只在**用户手动调整**窗宽窗位时触发：

```typescript
const handleVOIModified = (viewportId: string) => (event: any) => {
  // 只在用户手动调整时触发
  // 代码调用 viewport.setProperties() 不会触发此事件
  setWindowLevels(...);
};
```

---

## 修复方案

### 实施的修复

在 `handleLoadSeries` 函数中添加窗宽窗位的读取和应用逻辑：

```typescript
// 从新序列的第一张图像元数据中获取窗宽窗位信息并应用
const { metaData, utilities } = await import('@cornerstonejs/core');
const voi = metaData.get('voiLutModule', seriesInfo.imageIds[0]);

if (voi) {
  const voiRange = utilities.windowLevel.toLowHighRange(
    voi.windowWidth,
    voi.windowCenter,
    voi.voiLUTFunction
  );

  // 为每个视口设置窗宽窗位
  const newWindowLevels: Record<string, { center: number; width: number }> = {};
  ['AXIAL', 'SAGITTAL', 'CORONAL'].forEach((viewportId) => {
    const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
    if (viewport) {
      // ✅ 设置视口的实际窗宽窗位
      viewport.setProperties({ voiRange });

      // ✅ 同时更新 windowLevels state 用于 UI 显示
      const width = voiRange.upper - voiRange.lower;
      const center = (voiRange.upper + voiRange.lower) / 2;
      newWindowLevels[viewportId] = { center, width };
    }
  });

  // ✅ 更新 state 以保持显示一致性
  setWindowLevels(newWindowLevels);

  console.log(`✅ 已应用新序列窗宽窗位: W=${voi.windowWidth} L=${voi.windowCenter}`);
} else {
  // 如果元数据中没有窗宽窗位信息，使用默认值
  const defaultVoiRange = { lower: -200, upper: 200 };
  const newWindowLevels: Record<string, { center: number; width: number }> = {};

  ['AXIAL', 'SAGITTAL', 'CORONAL'].forEach((viewportId) => {
    const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
    if (viewport) {
      viewport.setProperties({ voiRange: defaultVoiRange });
      newWindowLevels[viewportId] = { center: 0, width: 400 };
    }
  });

  setWindowLevels(newWindowLevels);
  console.log('⚠️ 新序列元数据中无窗宽窗位信息，使用默认值');
}
```

### 修复要点

1. **从 DICOM 元数据读取窗宽窗位**
   - 使用 `metaData.get('voiLutModule', imageId)` 获取
   - 包含 `windowWidth` 和 `windowCenter` 属性

2. **转换为 voiRange 格式**
   - 使用 `utilities.windowLevel.toLowHighRange()` 转换
   - 返回 `{ lower, upper }` 格式

3. **同时更新两处**
   - ✅ `viewport.setProperties({ voiRange })` - 实际应用
   - ✅ `setWindowLevels(newWindowLevels)` - UI 显示

4. **处理缺失情况**
   - 如果元数据中没有窗宽窗位信息
   - 使用默认值 `{ lower: -200, upper: 200 }`

---

## 验证修复

### 测试场景

#### 场景 1: 正常序列切换
1. 加载序列 A（BONE 5mm），默认窗宽窗位 40/400
2. 手动调整为 50/500
3. 切换到序列 B（STD 5mm），默认窗宽窗位 30/300
4. **验证**：视口四角显示 "W: 300 L: 30" ✅

#### 场景 2: 无窗宽窗位元数据
1. 加载有窗宽窗位元数据的序列
2. 手动调整窗宽窗位
3. 切换到**无**窗宽窗位元数据的序列
4. **验证**：使用默认值 -200/200，显示 "W: 400 L: 0" ✅

#### 场景 3: 连续切换多个序列
1. 在序列 A、B、C 之间连续切换
2. 每个序列有不同的默认窗宽窗位
3. **验证**：每次切换后显示都正确 ✅

### 控制台日志

修复后，切换序列时会输出以下日志：

**有元数据**：
```
✅ 已应用新序列窗宽窗位: W=400 L=40
```

**无元数据**：
```
⚠️ 新序列元数据中无窗宽窗位信息，使用默认值
```

---

## 技术细节

### DICOM 元数据结构

窗宽窗位信息存储在 DICOM 标签中：

| 标签 | 属性 | 说明 |
|------|------|------|
| (0028,1050) | windowCenter | 窗位（中心值） |
| (0028,1051) | windowWidth | 窗宽 |
| (0028,1056) | voiLUTFunction | VOI LUT 函数（LINEAR/SEGMENTED） |

### voiRange 格式

Cornerstone3D 使用 `{ lower, upper }` 格式：

```typescript
// DICOM 格式
{ windowCenter: 40, windowWidth: 400 }

// 转换为 voiRange
{
  lower: -160,  // 40 - 400/2
  upper: 240    // 40 + 400/2
}

// 反向计算
width = upper - lower        // 240 - (-160) = 400
center = (upper + lower) / 2 // (240 + (-160)) / 2 = 40
```

### 转换函数

```typescript
utilities.windowLevel.toLowHighRange(
  windowWidth,   // 400
  windowCenter,  // 40
  voiLUTFunction // 'LINEAR' | 'SEGMENTED' | undefined
)

// 返回
{ lower: -160, upper: 240 }
```

---

## 相关文件

### 修改的文件

- **src/MPRViewer.tsx**
  - `handleLoadSeries` 函数（第 908-952 行）
  - 添加窗宽窗位读取和应用逻辑

### 相关函数

- `handleVOIModified` - 处理用户手动调整窗宽窗位
- `loadLocalFiles` - 初始加载文件时设置窗宽窗位
- `setWindowLevels` - 更新窗宽窗位 state

---

## 最佳实践

### 1. 同步更新原则

当通过代码设置视口属性时，必须同步更新 React state：

```typescript
// ❌ 错误：只更新视口属性
viewport.setProperties({ voiRange });

// ✅ 正确：同时更新 state
viewport.setProperties({ voiRange });
setWindowLevels({ [viewportId]: { center, width } });
```

### 2. 从元数据读取配置

优先使用 DICOM 元数据中的默认值：

```typescript
// ✅ 优先使用元数据
const voi = metaData.get('voiLutModule', imageId);
if (voi?.windowCenter && voi?.windowWidth) {
  // 使用元数据中的值
}

// ❌ 不要硬编码默认值
// const defaultWindowLevel = { center: 40, width: 400 };
```

### 3. 处理边界情况

考虑元数据可能缺失的情况：

```typescript
if (voi) {
  // 使用元数据中的值
} else {
  // 使用合理的默认值
  console.warn('⚠️ 元数据中无窗宽窗位信息，使用默认值');
}
```

---

## 常见问题 (FAQ)

### Q1: 为什么需要同时更新两处？

**A**: 因为架构设计的原因：
- Cornerstone3D 使用内部状态管理视口属性
- React 使用 state 管理 UI 显示
- 两者需要手动同步

### Q2: 为什么不在事件监听器中处理？

**A**: `VOI_MODIFIED` 事件只在**用户交互**时触发，代码调用 `setProperties()` 不会触发该事件。

### Q3: 如果序列切换失败怎么办？

**A**: `handleLoadSeries` 有 try-catch 错误处理：
```typescript
try {
  // 切换序列逻辑
} catch (error) {
  console.error('❌ 切换序列失败:', error);
  setError(`切换序列失败: ${error.message}`);
} finally {
  setIsLoading(false);
}
```

### Q4: 这个修复会影响性能吗？

**A**: 不会。只增加了：
- 一次元数据读取（快速）
- 三个视口的属性设置（原有逻辑）
- 一次 state 更新（轻量级）

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 1.0 | 2025-01-24 | 初始版本，修复序列切换窗宽窗位不同步问题 |

---

**文档版本**: 1.0
**最后更新**: 2025-01-24
**维护者**: Claude Code
**相关问题**: 序列切换、窗宽窗位显示不一致
