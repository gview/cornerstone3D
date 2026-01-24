# 更新日志

## 2025-01-24 - 单序列MPR切换到双序列MPR功能 + 修复序列切换问题

### 新功能

#### 1. 单序列MPR → 双序列MPR智能切换
**功能描述**：当用户从单序列MPR布局切换到双序列MPR布局时，系统会智能地保留当前显示的序列作为第一个序列，并自动加载第二个序列。

**实现细节**：
- 当前volume（`volumeId`）自动成为双序列布局的序列1（第一行3个视口）
- 从已加载的序列列表中查找第二个序列（不是当前序列的序列）
- 自动创建并缓存第二个序列的volume（`secondaryVolumeId`）
- 使用 `dynamicViewportManager` 动态创建6个视口（2行3列）
- 为两个序列创建独立的工具组（`mpr-seq1` 和 `mpr-seq2`）

**代码位置**：
- 文件：`src/MPRViewer.tsx`
- 函数：`handleLayoutChange`
- 行号：1952-2015

**文档**：详见 [DUAL_TO_MPR_SWITCH.md](./DUAL_TO_MPR_SWITCH.md)

### Bug修复

#### 1. 修复单序列MPR布局下序列切换失败问题
**问题描述**：在单序列MPR布局下，双击序列面板中的序列切换时，报错 `Viewport with Id AXIAL does not exist`

**原因**：代码使用硬编码的静态视口ID（`['AXIAL', 'SAGITTAL', 'CORONAL']`），而实际渲染引擎中的视口ID来自 `viewportIds` 状态

**修复方案**：
- 使用实际的视口ID（从 `viewportIds` 状态获取）
- 添加后备方案：如果 `viewportIds` 为空，使用静态ID
- 在所有视口操作中使用动态ID（setVolumesForViewports、窗宽窗位设置、视口渲染）

**代码位置**：
- 文件：`src/MPRViewer.tsx`
- 函数：`handleLoadSeries`
- 行号：998-1000（添加targetViewportIds逻辑）

**修复前**：
```typescript
await setVolumesForViewports(
  renderingEngine,
  [{ volumeId }],
  ['AXIAL', 'SAGITTAL', 'CORONAL']  // 硬编码ID
);
```

**修复后**：
```typescript
const targetViewportIds = viewportIds.length > 0 ? viewportIds : ['AXIAL', 'SAGITTAL', 'CORONAL'];
await setVolumesForViewports(
  renderingEngine,
  [{ volumeId }],
  targetViewportIds  // 使用实际ID
);
```

### 文档更新

#### 1. 更新 DUAL_TO_MPR_SWITCH.md
- 重构文档结构，增加"功能概述"部分
- 新增"功能1：单序列MPR → 双序列MPR"完整说明
- 保留原有的"功能2：双序列MPR → 标准MPR"说明
- 更新测试要点，区分两个功能的测试场景
- 标记已完成的改进方向

### 使用场景

#### 场景1：对比两个不同协议的序列
1. 用户加载了多个序列（如BONE、STD、LUNG等）
2. 当前显示的是BONE序列的单序列MPR
3. 用户切换到双序列MPR布局
4. **结果**：
   - 第一行显示BONE序列（序列1）
   - 第二行显示STD序列（序列2）
   - 可以对比两个不同协议的影像

#### 场景2：对比不同时期的序列
1. 用户加载了同一患者的不同时期检查
2. 当前显示的是近期检查的单序列MPR
3. 用户切换到双序列MPR布局
4. **结果**：
   - 第一行显示近期检查（序列1）
   - 第二行显示历史检查（序列2）
   - 可以对比病情进展

### 测试建议

#### 功能1测试（单序列 → 双序列）
1. **序列保留**：验证当前序列成为序列1（第一行）
2. **第二序列加载**：验证第二个序列正确加载并显示在序列2（第二行）
3. **序列对比**：验证可以同时查看和对比两个序列
4. **独立操作**：验证两个序列可以独立进行测量、窗宽窗位调整等操作

#### Bug修复验证
1. 在单序列MPR布局下加载多个序列
2. 双击序列面板中的不同序列
3. 验证序列切换正常，无报错
4. 验证窗宽窗位正确应用
5. 验证三个方向视口都正常显示

### 技术亮点

1. **智能序列选择**：自动从已加载序列中选择第二个序列，避免重复加载
2. **Volume缓存机制**：使用 `volumeLoader.createAndCacheVolume()` 提高性能
3. **向后兼容**：保留静态ID作为后备方案，确保兼容性
4. **详细日志**：添加清晰的日志输出，便于调试和用户理解

### 相关文件

- `src/MPRViewer.tsx` - 主要功能实现
- `DUAL_TO_MPR_SWITCH.md` - 功能文档
- `UPDATE_LOG.md` - 本更新日志

### 已知限制

- 需要至少加载2个序列才能切换到双序列MPR布局
- 第二个序列自动选择（不支持手动选择）
- 切换后会清除双序列的位置同步器

### 未来改进方向

1. 保存双序列布局时的视图状态（相机位置、当前切片等）
2. 支持更多协议布局的双序列版本
3. 支持在双序列布局下手动选择要显示的两个序列
