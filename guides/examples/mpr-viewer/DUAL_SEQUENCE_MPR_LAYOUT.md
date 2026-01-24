# 双序列 MPR 布局 (Dual-Sequence MPR Layout)

本文档详细说明了 MPR Viewer 中的 **双序列 MPR 布局** 功能。

---

## 功能概述

**双序列 MPR 布局** 是一种特殊的对比布局，包含：
- **第一行**：三个视口显示序列 1 的 MPR 视图（Axial, Sagittal, Coronal）
- **第二行**：三个视口显示序列 2 的 MPR 视图（Axial, Sagittal, Coronal）

**布局标识**: `dual-mpr`
**视口数量**: 6
**十字线支持**: ✅ 支持（每组 3 个视口独立同步）
**对比模式**: ✅ 支持两序列对比

---

## 布局结构

```
┌──────────┬──────────┬──────────┐
│ Seq 1    │ Seq 1    │ Seq 1    │
│ Axial    │ Sagittal │ Coronal  │
├──────────┼──────────┼──────────┤
│ Seq 2    │ Seq 2    │ Seq 2    │
│ Axial    │ Sagittal │ Coronal  │
└──────────┴──────────┴──────────┘
```

### 网格配置

```css
grid-template-columns: 1fr 1fr 1fr;  /* 3 列均等分布 */
grid-template-rows: 1fr 1fr;          /* 2 行均等分布 */
```

### 视口分配

| 行 | 视口索引 | 方向 | 序列 | 标签 |
|----|---------|------|------|------|
| 1 | 0 | Axial | 序列 1 | Seq 1 - Axial |
| 1 | 1 | Sagittal | 序列 1 | Seq 1 - Sagittal |
| 1 | 2 | Coronal | 序列 1 | Seq 1 - Coronal |
| 2 | 3 | Axial | 序列 2 | Seq 2 - Axial |
| 2 | 4 | Sagittal | 序列 2 | Seq 2 - Sagittal |
| 2 | 5 | Coronal | 序列 2 | Seq 2 - Coronal |

---

## 使用场景

### 适用场景

1. **治疗前/后对比**
   - 同一患者的不同时间点扫描
   - 评估治疗效果
   - 病变进展对比

2. **不同序列对比**
   - T1 加权 vs T2 加权（MRI）
   - 动脉期 vs 静脉期（CT 增强）
   - 平扫 vs 增强（CT）

3. **双能量 CT**
   - 不同能量图像对比
   - 虚拟平扫 vs 真实平扫

4. **多模态对比**
   - CT vs MRI 融合
   - PET-CT 对比

### 与标准六视图的对比

| 特性 | 标准六视图 (2×3) | 双序列 MPR (dual-mpr) |
|------|-----------------|----------------------|
| 视口数量 | 6 | 6 |
| 数据源 | 单序列 | 双序列 |
| 布局结构 | 2×3 网格 | 2×3 网格 |
| 视口方向 | 可自定义 | 固定 MPR |
| 对比功能 | ❌ | ✅ |
| 序行独立 | ❌ | ✅ |

---

## 技术实现

### 1. 类型定义

```typescript
export type ViewportLayout =
  | 'grid-1x1'
  | 'grid-1x2'
  // ... 其他布局
  | 'dual-mpr'  // ← 新增布局
  | 'mpr'
  // ... 其他布局
```

### 2. 双序列配置接口

```typescript
export interface DualSequenceConfig {
  volumeId1: string;  // 第一序列的 volume ID
  volumeId2: string;  // 第二序列的 volume ID
}
```

### 3. 布局面板配置

```typescript
const dualSequenceLayouts: ProtocolLayoutOption[] = [
  {
    id: 'dual-mpr',
    name: '双序列 MPR',
    icon: '🔷🔷',
    description: '两行三视图，每行显示不同序列的 MPR',
    category: 'Protocol',
  },
];
```

### 4. 核心实现方法

```typescript
async applyDualSequenceMPRLayout(
  config: DualSequenceConfig,
  currentViewportIds: string[]
): Promise<string[]> {
  // 1. 生成 6 个视口 ID
  const newViewportIds = [
    'viewport-xxx-0', // Seq 1 - Axial
    'viewport-xxx-1', // Seq 1 - Sagittal
    'viewport-xxx-2', // Seq 1 - Coronal
    'viewport-xxx-3', // Seq 2 - Axial
    'viewport-xxx-4', // Seq 2 - Sagittal
    'viewport-xxx-5', // Seq 2 - Coronal
  ];

  // 2. 保存当前视口状态
  this.saveViewportStates(currentViewportIds);

  // 3. 创建 2×3 网格布局
  this.createGridLayout(2, 3, newViewportIds);

  // 4. 禁用旧视口
  currentViewportIds.forEach(viewportId => {
    this.renderingEngine.disableViewport(viewportId);
  });

  // 5. 设置视口方向（MPR: Axial, Sagittal, Coronal）
  const viewportInputs = newViewportIds.map((viewportId, index) => ({
    viewportId,
    element: this.viewportElements.get(viewportId),
    type: Enums.ViewportType.ORTHOGRAPHIC,
    defaultOptions: {
      orientation: this.getDualSequenceOrientation(index),
      background: [0, 0, 0],
    },
  }));

  // 6. 创建视口
  this.renderingEngine.setViewports(viewportInputs);

  // 7. 为第一行设置序列 1 的数据
  await setVolumesForViewports(
    this.renderingEngine,
    [{ volumeId: volumeId1 }],
    newViewportIds.slice(0, 3)
  );

  // 8. 为第二行设置序列 2 的数据
  await setVolumesForViewports(
    this.renderingEngine,
    [{ volumeId: volumeId2 }],
    newViewportIds.slice(3, 6)
  );

  // 9. 恢复视口状态并渲染
  this.restoreViewportStates(newViewportIds);
  this.renderingEngine.renderViewports(newViewportIds);

  return newViewportIds;
}
```

### 5. 方向映射

```typescript
const getDualSequenceOrientation = (index: number): Enums.OrientationAxis => {
  switch (index % 3) {
    case 0: return Enums.OrientationAxis.AXIAL;      // 索引 0, 3
    case 1: return Enums.OrientationAxis.SAGITTAL;  // 索引 1, 4
    case 2: return Enums.OrientationAxis.CORONAL;   // 索引 2, 5
    default: return Enums.OrientationAxis.AXIAL;
  }
};
```

### 6. 视口标签生成

```typescript
private getViewportLabel(viewportId: string, index: number, rows: number, cols: number): string {
  // 双序列 MPR 布局特殊处理 (2行3列)
  if (rows === 2 && cols === 3) {
    const sequenceNum = index < 3 ? 'Seq 1' : 'Seq 2';
    const orientation = ['Axial', 'Sagittal', 'Coronal'][index % 3];
    return `${sequenceNum} - ${orientation}`;
  }

  // 其他布局的标签逻辑...
}
```

---

## 使用方法

### 前提条件

1. **加载至少 2 个序列**
   - 使用文件选择器加载 DICOM 文件
   - 系统会自动识别并分组序列
   - 在序列面板中可以看到可用的序列列表

2. **切换到双序列布局**
   - 点击工具栏的布局按钮
   - 在"协议布局"标签中选择"双序列 MPR"
   - 系统自动应用布局

### 操作流程

```
1. 加载 DICOM 文件
   ↓
2. 系统识别并分组序列
   ↓
3. 确认至少有 2 个序列可用
   ↓
4. 打开布局面板
   ↓
5. 选择"双序列 MPR"
   ↓
6. 系统自动应用布局
   ├─ 第一行显示序列 1 的 MPR
   └─ 第二行显示序列 2 的 MPR
```

### 视口交互

- **单击**: 激活视口（绿色边框高亮）
- **双击**: 放大视口到全屏
- **拖拽**: 在同一序列的三个视口间同步移动
- **滚轮**: 切换当前视口的切片

**注意**: 十字线同步在每组序列内部独立工作：
- 序列 1 的三个视口之间同步
- 序列 2 的三个视口之间同步
- 但序列 1 和序列 2 之间不同步

---

## 设计考虑

### 为什么使用 2×3 网格？

1. **直观对比**: 同一方向的两序列图像垂直对齐，便于对比
2. **空间利用**: 充分利用屏幕空间，6 个视口均等分布
3. **一致性**: 与标准 MPR 布局保持一致的视图排列

### 视口顺序设计

```
序列 1: Axial | Sagittal | Coronal
序列 2: Axial | Sagittal | Coronal
```

**优点**:
- 垂直对齐便于对比同一方向
- 从左到右符合 MPR 阅读习惯
- 标签清晰标识序列来源

### 序列分配策略

**当前实现** (简化版本):
- 序列 1: 当前加载的主序列
- 序列 2: 序列面板中的第一个可用序列
- 如果只有一个序列，两行显示相同序列

**未来改进**:
- 允许用户选择哪两个序列进行对比
- 支持序列快速切换（点击序列即可替换）
- 支持序列收藏和常用对比组合

---

## 未来改进方向

### 1. 序列选择增强

```typescript
interface DualSequenceSelector {
  sequence1: SeriesInfo;  // 用户选择序列 1
  sequence2: SeriesInfo;  // 用户选择序列 2
}
```

- 添加序列选择对话框
- 支持下拉菜单快速切换
- 记住用户常用的序列组合

### 2. 同步对比模式

```typescript
interface SyncMode {
  enabled: boolean;
  syncSlice: boolean;      // 同步切片索引
  syncZoom: boolean;       // 同步缩放级别
  syncPan: boolean;        // 同步平移位置
}
```

- 可选的两序列间同步
- 同步切片位置
- 同步缩放和平移

### 3. 融合模式

```typescript
interface FusionMode {
  enabled: boolean;
  opacity: number;         // 融合透明度 (0-1)
  colormap: string;        // 颜色映射
}
```

- 序列图像融合显示
- 可调节融合比例
- 支持伪彩显示

### 4. 测量对比

```typescript
interface MeasurementComparison {
  measurementsSeq1: Measurement[];
  measurementsSeq2: Measurement[];
  comparison: MeasurementDiff[];
}
```

- 两序列间的测量对比
- 自动计算测量差异
- 显示变化趋势

### 5. 布局变体

```typescript
type DualSequenceLayoutVariant =
  | 'dual-mpr-side-by-side'   // 左右对比
  | 'dual-mpr-top-bottom'     // 上下对比
  | 'dual-mpr-fusion'         // 融合模式
  | 'dual-mpr-diff';          // 差值模式
```

- 提供多种对比布局
- 支持差值图像显示
- 支持动态切换

---

## 常见问题 (FAQ)

### Q1: 双序列布局需要两个序列吗？

**A**: 是的。如果只有一个序列，系统会在两行中都显示相同序列。

### Q2: 可以同时显示 3 个或更多序列吗？

**A**: 当前版本只支持 2 个序列的对比。未来版本可能会支持更多序列。

### Q3: 双序列布局支持十字线吗？

**A**: ✅ 支持。但十字线同步在每组序列内部独立工作，不会跨序列同步。

### Q4: 如何切换显示的序列？

**A**:
1. 当前版本：需要先切换主序列，再重新应用双序列布局
2. 未来版本：将提供快捷序列选择器

### Q5: 双序列布局可以进行测量吗？

**A**: ✅ 可以。所有 6 个视口都支持完整的测量功能。两序列间的测量可以独立进行。

### Q6: 双序列布局的性能如何？

**A**:
- 6 个视口同时渲染会增加 GPU 负载
- 建议在硬件较好的设备上使用
- 可以通过降低切片厚度来提升性能

### Q7: 可以导出双序列对比图像吗？

**A**:
- 当前版本：可以单独导出每个视口的图像
- 未来版本：将支持导出组合对比图

---

## 相关文件

### 核心实现文件

- **类型定义**: `src/components/panels/EnhancedLayoutPanel.tsx`
  - ViewportLayout 类型
  - 双序列布局配置

- **布局管理器**: `src/utils/dynamicViewportManager.ts`
  - applyDualSequenceMPRLayout 方法
  - 视口标签生成
  - 双序列方向映射

- **主组件**: `src/MPRViewer.tsx`
  - 布局切换逻辑
  - 序列管理
  - 视口状态管理

### 相关文档

- [GRID_1-2_LAYOUT.md](GRID_1-2_LAYOUT.md) - 1|2 主副视图布局
- [LAYOUT_IMPLEMENTATION_SUMMARY.md](LAYOUT_IMPLEMENTATION_SUMMARY.md) - 布局实现总结
- [CROSSHAIR_TOOL_LIMITATIONS.md](CROSSHAIR_TOOL_LIMITATIONS.md) - 十字线工具限制

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 1.0 | 2026-01-24 | 初始版本，实现双序列 MPR 布局 |

---

## 技术支持

如有问题或建议，请联系开发团队或提交 Issue。

---

**文档版本**: 1.0
**最后更新**: 2026-01-24
**维护者**: Claude Code
**布局标识**: `dual-mpr`
**图标**: 🔷🔷
