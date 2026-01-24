# 1|2 主副视图布局

本文档详细说明了 MPR Viewer 中的 **1|2 主副视图布局** 功能。

---

## 功能概述

**1|2 主副视图布局** 是一种特殊的非对称布局，包含：
- **左侧**：一个主视口（占据较大空间，约 2/3 宽度）
- **右侧**：两个副视口（上下排列，各占约 1/3 宽度）

**布局标识**: `grid-1-2`
**视口数量**: 3
**十字线支持**: ✅ 支持（3 个视口）

---

## 布局结构

```
┌─────────────────────────────────┬──────────────┐
│                                 │              │
│                                 │   副视口 1   │
│           主视口                 │   (Sagittal) │
│         (Axial)                  │              │
│                                 ├──────────────┤
│                                 │              │
│                                 │   副视口 2   │
│                                 │  (Coronal)   │
└─────────────────────────────────┴──────────────┘
```

### 网格配置

```css
grid-template-columns: 2fr 1fr;  /* 左侧 2/3，右侧 1/3 */
grid-template-rows: 1fr 1fr;      /* 右侧分为上下两行 */
grid-template-areas:
  "main top"
  "main bottom";
```

### 视口分配

| 区域 | 视口 ID | 说明 |
|------|---------|------|
| `main` | AXIAL | 左侧主视口，跨越两行 |
| `top` | SAGITTAL | 右上副视口 |
| `bottom` | CORONAL | 右下副视口 |

---

## 使用场景

### 适用场景

1. **主视图详细观察**
   - 需要重点关注某个平面（如轴位）
   - 同时参考其他正交平面的位置信息

2. **教学演示**
   - 主视口用于详细讲解
   - 副视口提供解剖位置参考

3. **诊断报告**
   - 主视口显示主要发现
   - 副视口显示定位信息

4. **手术规划**
   - 主视口显示手术路径平面
   - 副视口显示周围解剖结构

### 与标准三视图的对比

| 特性 | 标准三视图 (1×3) | 主副视图 (1|2) |
|------|-----------------|----------------|
| 视口大小 | 均等分布 | 非对称分布 |
| 主视口占比 | 33% | 67% |
| 副视口占比 | 33% × 2 | 17% × 2 |
| 适用场景 | 综合观察 | 重点观察 |
| 十字线 | ✅ 支持 | ✅ 支持 |

---

## 技术实现

### 1. 类型定义

```typescript
export type ViewportLayout =
  | 'grid-1x1'
  | 'grid-1x2'
  | 'grid-2x1'
  | 'grid-2x2'
  | 'grid-3x1'
  | 'grid-1x3'
  | 'grid-3x2'
  | 'grid-2x3'
  | 'grid-3x3'
  | 'grid-1-2'  // ← 新增布局
  | 'mpr'
  | 'advanced'
  // ... 其他布局
```

### 2. 网格配置函数

```typescript
// 列配置：左侧 2/3，右侧 1/3
const getGridTemplateColumns = (layout: ViewportLayout): string => {
  // ... 其他布局
  if (layout === 'grid-1-2') {
    return '2fr 1fr';
  }
  return '1fr 1fr';
};

// 行配置：右侧分为上下两行
const getGridTemplateRows = (layout: ViewportLayout): string => {
  // ... 其他布局
  if (layout === 'grid-1-2') {
    return '1fr 1fr';
  }
  return '1fr 1fr';
};

// 视口数量计算
const getViewportCountFromLayout = (layout: ViewportLayout): number => {
  // ... 其他布局
  if (layout === 'grid-1-2') {
    return 3;
  }
  return 3;
};
```

### 3. 网格区域配置

```tsx
// 网格容器
<div
  className="mpr-viewports"
  style={{
    gridTemplateColumns: getGridTemplateColumns(currentLayout),
    gridTemplateRows: getGridTemplateRows(currentLayout),
    gridTemplateAreas: currentLayout === 'grid-1-2'
      ? '"main top" "main bottom"'
      : undefined,
  }}
>
  {/* 主视口 - 跨越两行 */}
  <div
    className="viewport-container grid-1-2-main"
    style={{ gridArea: 'main' }}
  >
    {/* AXIAL 视口内容 */}
  </div>

  {/* 右上副视口 */}
  <div
    className="viewport-container grid-1-2-top"
    style={{ gridArea: 'top' }}
  >
    {/* SAGITTAL 视口内容 */}
  </div>

  {/* 右下副视口 */}
  <div
    className="viewport-container grid-1-2-bottom"
    style={{ gridArea: 'bottom' }}
  >
    {/* CORONAL 视口内容 */}
  </div>
</div>
```

### 4. UI 面板配置

```typescript
const gridLayouts: GridLayoutOption[] = [
  // ... 其他布局
  {
    id: 'grid-1-2',
    name: '1|2 主副视图',
    icon: '▰',
    rows: 2,
    cols: 2,
    category: 'Grid'
  },
  // ... 其他布局
];
```

---

## 用户体验

### 激活布局

1. 点击工具栏的 **布局切换按钮**
2. 在布局面板中选择 **"1|2 主副视图"**
3. 视口自动重新排列为左大右小的布局

### 布局特点

1. **主视口突出**
   - 左侧视口占据更大空间
   - 适合详细观察和操作

2. **副视口参考**
   - 右侧两个小视口提供定位信息
   - 不占用过多屏幕空间

3. **十字线同步**
   - 三个视口之间的十字线仍然同步
   - 点击任意视口都会更新其他视口的位置

### 视口交互

- **单击**: 激活视口（绿色边框高亮）
- **双击**: 放大视口到全屏
- **拖拽**: 在所有视口中同步移动
- **滚轮**: 切换当前视口的切片

---

## 设计考虑

### 为什么使用 `grid-template-areas`?

传统的 `grid-row` 和 `grid-column` 也可以实现类似布局，但 `grid-template-areas` 提供了：

1. **可读性更好**: 区域名称直观反映布局结构
2. **维护性更强**: 修改布局时只需调整 areas 字符串
3. **扩展性好**: 未来可以轻松添加更多特殊布局

### 比例选择：2fr 1fr

选择 2:1 的比例基于以下考虑：

1. **黄金分割近似**: 接近 1.618 的黄金比例
2. **实用性**: 主视口足够大，副视口不会太小
3. **屏幕适应性**: 适合大多数显示器尺寸

### 视口分配：AXIAL 为主视口

默认将 AXIAL（轴位）作为主视口的原因：

1. **最常用**: 轴位是最常观察的平面
2. **习惯性**: 符合放射科医生的工作习惯
3. **可定制**: 未来可以添加设置让用户选择主视口

---

## 未来改进方向

### 1. 可配置主视口

允许用户选择哪个视口作为主视口：
- AXIAL（轴位）- 默认
- SAGITTAL（矢状位）
- CORONAL（冠状位）

### 2. 可调整比例

提供滑块让用户调整主副视口的比例：
- 3:1（主视口更大）
- 2:1（默认）
- 3:2（相对均衡）

### 3. 交换布局

提供镜像版本：
- `grid-1-2`: 左主右副（当前实现）
- `grid-2-1`: 右主左副（未来添加）

### 4. 动态切换

支持在不同布局间快速切换主视口：
- 键盘快捷键（如 Shift+M）
- 右键菜单选项

---

## 常见问题 (FAQ)

### Q1: 可以将其他视口作为主视口吗？

**A**: 当前版本主视口固定为 AXIAL。未来版本将支持自定义主视口。

### Q2: 1|2 布局支持十字线吗？

**A**: ✅ 支持。因为该布局有 3 个视口，满足十字线的最小要求。

### Q3: 可以在 1|2 布局中使用测量工具吗？

**A**: ✅ 可以。所有视口都支持完整的测量功能。

### Q4: 1|2 布局与 `axial-primary` 协议布局有什么区别？

**A**:
- `grid-1-2`: 网格布局，灵活的尺寸比例（2:1）
- `axial-primary`: 协议布局，固定的尺寸和样式

### Q5: 如何快速切换回标准三视图？

**A**: 点击布局面板中的 "1×3 横向" 或使用快捷键（如果已配置）。

---

## 相关文件

### 核心实现文件

- **类型定义**: `src/components/panels/EnhancedLayoutPanel.tsx`
  - ViewportLayout 类型
  - 网格布局配置

- **主组件**: `src/MPRViewer.tsx`
  - 网格配置函数
  - 视口渲染逻辑
  - grid-template-areas 配置

### 相关文档

- [CROSSHAIR_TOOL_LIMITATIONS.md](CROSSHAIR_TOOL_LIMITATIONS.md) - 十字线工具限制
- [VIEWPORT_DOUBLE_CLICK_FEATURE.md](VIEWPORT_DOUBLE_CLICK_FEATURE.md) - 双击放大功能
- [LAYOUT_IMPLEMENTATION_SUMMARY.md](LAYOUT_IMPLEMENTATION_SUMMARY.md) - 布局实现总结

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 1.0 | 2025-01-24 | 初始版本，实现 1\|2 主副视图布局 |

---

**文档版本**: 1.0
**最后更新**: 2025-01-24
**维护者**: Claude Code
**布局标识**: `grid-1-2`
**图标**: ▰
