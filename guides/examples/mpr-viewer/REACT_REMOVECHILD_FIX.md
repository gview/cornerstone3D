# React removeChild 错误修复

## 问题描述

从 `grid-1x3` 布局切换到 `dual-mpr` 布局时，出现以下错误：

```
Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node':
The node to be removed is not a child of this node.
```

## 根本原因

### 问题流程

1. **初始状态**: 使用 `grid-1x3` 布局，MPRViewer 渲染静态 JSX 视口组件：
   ```tsx
   {currentLayout === 'grid-1x3' && viewportIds[0] === 'AXIAL' ? (
     <>
       <div ref={axialRef} ...>      // React 管理的 DOM
       <div ref={sagittalRef} ...>   // React 管理的 DOM
       <div ref={coronalRef} ...>    // React 管理的 DOM
     </>
   ) : null}
   ```

2. **切换布局**: 调用 `handleLayoutChange('dual-mpr')`

3. **旧代码流程**：
   ```typescript
   // 1. 先调用 applyDualSequenceMPRLayout
   const newViewportIds = await dynamicViewportManager.applyDualSequenceMPRLayout(...);
   //    → 内部调用 clearContainer()
   //    → 手动移除所有 DOM 节点（包括 React 管理的节点）

   // 2. 然后更新状态
   setCurrentLayout('dual-mpr');
   setViewportIds(newViewportIds);
   //    → React 检测到 currentLayout 变化
   //    → 条件 currentLayout === 'grid-1x3' 变成 false
   //    → React 尝试卸载静态 JSX 组件
   //    → ❌ 但这些节点已经被手动移除了！
   //    → 抛出 removeChild 错误
   ```

4. **React vs 手动 DOM 操作冲突**：
   - React 虚拟 DOM 认为这些节点还存在
   - 但实际上已经被 `clearContainer()` 手动移除
   - React 尝试卸载时找不到节点 → 错误

## 解决方案

### 核心思路

**让 React 先完成卸载，再进行手动 DOM 操作**

### 修改内容

**文件**: [MPRViewer.tsx](src/MPRViewer.tsx:1488-1543)

**关键修改**：
```typescript
// 处理双序列 MPR 布局
if (layout === 'dual-mpr') {
  // 1. 保存当前视口 IDs（在状态更新前）
  const currentViewportIds = viewportIds;

  // 2. 🔧 先更新布局状态，触发 React 卸载
  setCurrentLayout('dual-mpr' as any);
  setViewportIds([]);

  // 3. 🔧 等待 React 完成卸载（50ms 足够 React 完成一个渲染周期）
  await new Promise(resolve => setTimeout(resolve, 50));

  // 4. 现在 React 已经卸载了静态组件，容器是空的
  //    可以安全地进行手动 DOM 操作
  dynamicViewportManager.initialize(renderingEngine, viewportsGridRef.current!);

  // ... 创建第二个序列的 volume ...

  // 5. 应用双序列 MPR 布局（现在容器已经清空）
  const newViewportIds = await dynamicViewportManager.applyDualSequenceMPRLayout(
    dualConfig,
    currentViewportIds
  );

  // 6. 更新 viewportIds 状态
  setViewportIds(newViewportIds);

  // ... 后续工具配置等 ...
}
```

### 时序对比

#### 旧代码（有问题）
```
t=0ms:  applyDualSequenceMPRLayout() 开始
t=10ms: clearContainer() 手动移除所有 DOM ❌
t=20ms: setCurrentLayout('dual-mpr')
t=25ms: React 尝试卸载 → 错误！节点已被移除
```

#### 新代码（已修复）
```
t=0ms:  setCurrentLayout('dual-mpr')
t=5ms:  React 卸载静态 JSX ✅
t=10ms: setViewportIds([])
t=15ms: React 重新渲染（容器现在是空的）✅
t=60ms: applyDualSequenceMPRLayout() 开始（等待 50ms 后）
t=70ms: clearContainer() 清空容器（已经是空的，安全）
t=80ms: 创建新的动态视口 ✅
```

## 为什么 50ms 延迟足够？

React 的状态更新和渲染是异步的：
1. `setState()` 调用不会立即更新 DOM
2. React 会批处理状态更新
3. 在下一个事件循环中执行实际的 DOM 更新

`await new Promise(resolve => setTimeout(resolve, 50))` 确保：
- 至少经过一个完整的 JavaScript 事件循环
- React 有足够时间完成卸载和重新渲染
- DOM 状态已经稳定

## 相关代码位置

- **MPRViewer.tsx:1488-1543** - 布局切换逻辑（已修改）
- **dynamicViewportManager.ts:120-136** - clearContainer 方法
- **MPRViewer.tsx:1950-2160** - 静态视口 JSX（条件渲染）

## 其他布局也需要修复吗？

理论上，任何从静态布局（`grid-1x3`）切换到动态布局的情况都可能遇到这个问题。

**当前受影响的布局**：
- ✅ `dual-mpr`（已修复）
- ⚠️ 其他协议布局（`mpr`, `3d-four-up` 等）也映射到动态布局
- ⚠️ 网格布局（`grid-1x2`, `grid-2x2` 等）可能也需要修复

**建议**：统一所有动态布局的切换流程，遵循相同的模式：
1. 先更新状态触发 React 卸载
2. 等待 DOM 更新完成
3. 再进行手动 DOM 操作

## 测试验证

### 测试步骤
1. **刷新页面**
2. **加载 DICOM 文件**（至少 2 个序列）
3. **切换到双序列 MPR 布局**
4. **检查控制台**：
   - ✅ 不应该有 `removeChild` 错误
   - ✅ 应该有 "🔄 切换到双序列 MPR 布局" 日志
   - ✅ 应该有 "✅ 双序列 MPR 布局已应用" 日志

### 预期结果
- ✅ 没有红色的错误信息
- ✅ 视口正常显示（242px × 403px）
- ✅ 6 个视口都显示医学图像
- ✅ 两行三列布局正确

## 技术要点

### React 和手动 DOM 操作的协调

**原则**：
- 如果一个 DOM 节点由 React 管理，不要手动移除它
- 如果需要手动操作 DOM，先让 React 卸载相关组件
- 使用条件渲染（`{condition ? <Component /> : null}`）来控制 React 组件的生命周期

**常见陷阱**：
```tsx
// ❌ 错误：手动移除 React 管理的节点
useEffect(() => {
  containerRef.current.removeChild(someNode); // 错误！
}, []);

// ✅ 正确：让 React 通过条件渲染来卸载
const [isVisible, setIsVisible] = useState(true);
return isVisible ? <Component /> : null;
```

### 异步状态更新的时序

```typescript
// ❌ 错误：期望状态立即更新
setState(newValue);
someManualOperation(); // 状态可能还没更新！

// ✅ 正确：等待状态更新完成
setState(newValue);
await new Promise(resolve => setTimeout(resolve, 0));
someManualOperation(); // 状态已更新
```

## 总结

这个问题是 **React 虚拟 DOM 和手动 DOM 操作冲突** 的典型案例。解决方法是：
1. **协调生命周期**：让 React 先完成卸载
2. **异步等待**：给 React 足够的时间
3. **明确职责**：React 管理的节点 vs 手动管理的节点

修复后，双序列 MPR 布局切换应该流畅无错误。

---

**版本**: 1.0
**修复日期**: 2026-01-24
**状态**: ✅ 已修复，待测试验证
