# Cornerstone3D 视口布局切换指南

本文档详细介绍 Cornerstone3D 中不同视口布局的切换实现，包括：
- Volume 与 Stack View 的相互切换
- 多视口显示同一数据
- 多视口显示不同数据

参考实现：[E:\zaicode\Viewers](https://github.com/OHIF/Viewers)

---

## 目录

1. [核心概念](#核心概念)
2. [视口类型系统](#视口类型系统)
3. [布局管理架构](#布局管理架构)
4. [Volume/Stack 切换](#volumestack-切换)
5. [多视口显示同一数据](#多视口显示同一数据)
6. [多视口显示不同数据](#多视口显示不同数据)
7. [实战代码示例](#实战代码示例)

---

## 核心概念

### 视口（Viewport）

视口是 Cornerstone3D 中显示医学图像的容器。每个视口具有：
- **viewportId**: 唯一标识符
- **viewportType**: 视口类型（stack/volume/volume3d）
- **displaySetInstanceUIDs**: 显示的数据集 ID 列表
- **viewportOptions**: 渲染选项

### 布局（Layout）

布局定义了视口的排列方式：
- **grid**: 网格布局（行列）
- **layoutType**: 布局类型
- **layoutOptions**: 自定义位置选项

### 挂载协议（Hanging Protocol）

挂载协议是预定义的视口配置模板：
- 定义视口数量和排列
- 指定每个视口的数据源规则
- 设置同步组关系

---

## 视口类型系统

### 支持的视口类型

```typescript
import { Enums } from '@cornerstonejs/core';

// 视口类型枚举
enum ViewportType {
  STACK = 'stack',              // 2D 切片视图
  ORTHOGRAPHIC = 'volume',      // 3D 体数据正交视图（轴向、冠状、矢状）
  VOLUME_3D = 'volume3d',       // 3D 渲染视图（VR）
  VIDEO = 'video',              // 视频流
  WHOLESLIDE = 'wholeslide'     // 全景切片
}
```

### 视口类型判断逻辑

```typescript
// 判断 DisplaySet 应该使用的视口类型
function getViewportTypeForDisplaySet(displaySet: DisplaySet): ViewportType {
  // 1. 检查是否可重建为 3D volume
  if (displaySet.isDynamicVolume && displaySet.isReconstructable) {
    return Enums.ViewportType.ORTHOGRAPHIC;
  }

  // 2. 检查是否有 volume ID
  if (displaySet.metadata?.volumeId) {
    return Enums.ViewportType.ORTHOGRAPHIC;
  }

  // 3. 默认为 stack 视图
  return Enums.ViewportType.STACK;
}
```

---

## 布局管理架构

### ViewportGridService

ViewportGridService 是管理视口网格的核心服务：

```typescript
interface ViewportGridState {
  activeViewportId: string | null;
  layout: {
    numRows: number;
    numCols: number;
    layoutType: 'grid';
  };
  isHangingProtocolLayout: boolean;
  viewports: Map<string, GridViewport>;
}

interface GridViewport {
  viewportId: string;
  displaySetInstanceUIDs: string[];  // 关键：每个视口独立的数据列表
  viewportOptions: ViewportOptions;
  displaySetOptions: DisplaySetOptions[];
  x: number;        // 左侧位置（0-1）
  y: number;        // 顶部位置（0-1）
  width: number;    // 宽度（0-1）
  height: number;   // 高度（0-1）
}
```

### HangingProtocolService

HangingProtocolService 管理挂载协议的匹配和应用：

```typescript
interface Protocol {
  id: string;
  name: string;
  stages: ProtocolStage[];
  displaySetSelectors: Record<string, DisplaySetSelector>;
  defaultViewport?: Viewport;
}

interface ProtocolStage {
  id: string;
  name: string;
  viewportStructure: {
    layoutType: 'grid';
    properties: {
      rows: number;
      columns: number;
      layoutOptions?: LayoutOptions[];
    };
  };
  viewports: Viewport[];
}
```

---

## Volume/Stack 切换

### 场景说明

- **Stack View**: 逐帧显示 2D 切片，适合 CR、DR、非重建的 CT/MR 系列
- **Volume View**: 从 3D 体数据中提取正交切面，适合可重建的 CT/MR 系列

### 切换实现

#### 1. 动态检测数据类型

```typescript
// 检测 DisplaySet 是否支持 volume 视图
function isVolumeCapable(displaySet: DisplaySet): boolean {
  return displaySet.isReconstructable === true &&
         displaySet.images?.length > 1 &&
         displaySet.metadata?.Modality !== 'CR' &&
         displaySet.metadata?.Modality !== 'DR' &&
         displaySet.metadata?.Modality !== 'XA';
}
```

#### 2. 设置视口数据时的类型转换

```typescript
// CornerstoneViewportService.ts 中的关键方法
async function setViewportData(
  viewportId: string,
  displaySets: DisplaySet[],
  viewportOptions?: ViewportOptions
): Promise<void> {
  // 1. 确定视口类型
  let viewportType = viewportOptions?.viewportType;

  if (!viewportType) {
    const hasReconstructable = displaySets.some(ds => ds.isReconstructable);
    viewportType = hasReconstructable
      ? Enums.ViewportType.ORTHOGRAPHIC
      : Enums.ViewportType.STACK;
  }

  // 2. 根据类型调用不同的设置方法
  if (viewportType === Enums.ViewportType.STACK) {
    await this._setStackViewport(viewportId, displaySets, viewportOptions);
  } else {
    await this._setVolumeViewport(viewportId, displaySets, viewportOptions);
  }
}
```

#### 3. Stack → Volume 切换示例

```typescript
// 从 stack 切换到 volume 视图
async function switchStackToVolume(viewportId: string): Promise<void> {
  const viewport = viewportGridService.getViewportState(viewportId);
  const displaySetUIDs = viewport.displaySetInstanceUIDs;
  const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);

  // 检查是否支持 volume
  if (!displaySet.isReconstructable) {
    console.warn('DisplaySet is not reconstructable');
    return;
  }

  // 更新视口为 volume 类型
  await viewportGridService.setDisplaySetsForViewports([{
    viewportId,
    displaySetInstanceUIDs: displaySetUIDs,
    viewportOptions: {
      viewportId,
      viewportType: Enums.ViewportType.ORTHOGRAPHIC,
      orientation: Enums.OrientationAxis.AXIAL,
    }
  }]);
}
```

#### 4. Volume → Stack 切换示例

```typescript
// 从 volume 切换到 stack 视图
async function switchVolumeToStack(viewportId: string): Promise<void> {
  const viewport = viewportGridService.getViewportState(viewportId);

  // 更新视口为 stack 类型
  await viewportGridService.setDisplaySetsForViewports([{
    viewportId,
    displaySetInstanceUIDs: viewport.displaySetInstanceUIDs,
    viewportOptions: {
      viewportId,
      viewportType: Enums.ViewportType.STACK,
    }
  }]);
}
```

---

## 多视口显示同一数据

### 场景说明

在 MPR（多平面重建）应用中，需要在多个视口中显示同一个 Volume 数据的不同切面：
- 轴向切面（Axial）
- 冠状切面（Coronal）
- 矢状切面（Sagittal）

### 实现方法：挂载协议

#### 1. 定义 MPR 挂载协议

```typescript
// mpr.ts - 挂载协议定义
import { Types } from '@ohif/core';

// 同步组定义 - 确保多视口同步
export const VOI_SYNC_GROUP = {
  type: 'voi',
  id: 'mpr',
  source: true,
  target: true,
  options: {
    syncColormap: true,  // 同步窗宽窗位和颜色映射
  },
};

export const CAMERA_SYNC_GROUP = {
  type: 'camera',
  id: 'mpr',
  source: true,
  target: true,
  options: {
    syncCenter: true,    // 同步视口中心点
  },
};

// MPR 协议
export const mprProtocol: Types.HangingProtocol.Protocol = {
  id: 'mpr',
  name: 'MPR 1x3',
  locked: false,
  isPreset: true,

  // 定义数据选择器
  displaySetSelectors: {
    // 使用相同的选择器 ID，确保多视口使用同一数据
    activeDisplaySet: {
      seriesMatchingRules: [
        {
          weight: 1,
          attribute: 'isReconstructable',
          constraint: {
            equals: { value: true }
          },
          required: true,
        },
      ],
    },
  },

  stages: [
    {
      name: 'MPR 1x3',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 3,
          // 自定义布局选项（可选）
          layoutOptions: [
            { x: 0, y: 0, width: 1/3, height: 1 },  // 左侧视口
            { x: 1/3, y: 0, width: 1/3, height: 1 }, // 中间视口
            { x: 2/3, y: 0, width: 1/3, height: 1 }, // 右侧视口
          ],
        },
      },

      // 定义三个视口
      viewports: [
        {
          viewportOptions: {
            viewportId: 'mpr-axial',
            viewportType: 'volume',
            orientation: 'axial',
            toolGroupId: 'mpr',
            syncGroups: [VOI_SYNC_GROUP, CAMERA_SYNC_GROUP],
          },
          displaySets: [
            {
              id: 'activeDisplaySet',  // 引用相同的选择器
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'mpr-sagittal',
            viewportType: 'volume',
            orientation: 'sagittal',
            toolGroupId: 'mpr',
            syncGroups: [VOI_SYNC_GROUP, CAMERA_SYNC_GROUP],
          },
          displaySets: [
            {
              id: 'activeDisplaySet',  // 引用相同的选择器
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'mpr-coronal',
            viewportType: 'volume',
            orientation: 'coronal',
            toolGroupId: 'mpr',
            syncGroups: [VOI_SYNC_GROUP, CAMERA_SYNC_GROUP],
          },
          displaySets: [
            {
              id: 'activeDisplaySet',  // 引用相同的选择器
            },
          ],
        },
      ],
    },
  ],
};
```

#### 2. 注册挂载协议

```typescript
// 在扩展初始化时注册协议
import { HangingProtocolService } from '@ohif/core';

export default function initExtension({ servicesManager, commandsManager }) {
  const { hangingProtocolService } = servicesManager.services;

  // 注册 MPR 协议
  hangingProtocolService.addProtocol('mpr', mprProtocol);

  // 也可以注册为协议生成器（动态生成协议）
  hangingProtocolService.addProtocol('mpr-dynamic', ({
    servicesManager,
    commandsManager
  }) => {
    // 根据运行时条件动态生成协议
    return {
      id: 'mpr-dynamic',
      name: 'Dynamic MPR',
      stages: [/* ... */],
    };
  });
}
```

#### 3. 应用挂载协议

```typescript
// 应用 MPR 协议
function applyMPRProtocol(): void {
  commandsManager.run({
    commandName: 'setHangingProtocol',
    commandOptions: {
      protocolId: 'mpr',
    },
  });
}

// 或者直接调用服务
async function applyProtocolDirectly(): Promise<void> {
  const studies = studyService.getStudies();
  const displaySets = displaySetService.getActiveDisplaySets();

  await hangingProtocolService.run({
    studies,
    displaySets,
    activeStudy: studies[0],
  }, 'mpr');
}
```

#### 4. 关键实现细节

**displaySetSelector 的作用**：
- 定义匹配规则（seriesMatchingRules）
- 返回匹配的 DisplaySet
- 多个视口引用同一个 selector ID 时，会使用相同的数据

**同步组的作用**：
- `VOI_SYNC_GROUP`: 同步窗宽窗位调整
- `CAMERA_SYNC_GROUP`: 同步相机移动和缩放
- `HYDRATE_SEG_SYNC_GROUP`: 同步分割渲染

**orientation 参数**：
- `axial`: 轴向切面（从上到下）
- `sagittal`: 矢状切面（从左到右）
- `coronal`: 冠状切面（从前到后）

---

## 多视口显示不同数据

### 场景说明

在不同视口中显示不同的医学图像系列，例如：
- 左侧视口：CT 图像
- 右侧视口：MRI 图像
- 第三个视口：PET 图像

### 实现方法：为视口设置独立的 DisplaySet

#### 1. 为视口设置不同的数据

```typescript
// 方式一：直接设置单个视口的数据
function setViewportData(viewportId: string, displaySetUID: string): void {
  viewportGridService.setDisplaySetsForViewports([{
    viewportId,
    displaySetInstanceUIDs: [displaySetUID],
    viewportOptions: {
      viewportId,
      viewportType: Enums.ViewportType.STACK,
    }
  }]);
}

// 方式二：批量设置多个视口的数据
function setMultipleViewportsData(): void {
  viewportGridService.setDisplaySetsForViewports([
    {
      viewportId: 'viewport-1',
      displaySetInstanceUIDs: ['ct-display-set-uid'],
      viewportOptions: {
        viewportId: 'viewport-1',
        viewportType: Enums.ViewportType.ORTHOGRAPHIC,
        orientation: Enums.OrientationAxis.AXIAL,
      }
    },
    {
      viewportId: 'viewport-2',
      displaySetInstanceUIDs: ['mr-display-set-uid'],
      viewportOptions: {
        viewportId: 'viewport-2',
        viewportType: Enums.ViewportType.ORTHOGRAPHIC,
        orientation: Enums.OrientationAxis.AXIAL,
      }
    },
    {
      viewportId: 'viewport-3',
      displaySetInstanceUIDs: ['pet-display-set-uid'],
      viewportOptions: {
        viewportId: 'viewport-3',
        viewportType: Enums.ViewportType.STACK,
      }
    },
  ]);
}
```

#### 2. 挂载协议中定义多个数据源

```typescript
// 定义多数据源的挂载协议
export const multiDataSourceProtocol: Types.HangingProtocol.Protocol = {
  id: 'multi-data-source',
  name: 'Multi-Data Source Layout',

  // 定义多个不同的数据选择器
  displaySetSelectors: {
    ctSeries: {
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: { equals: { value: 'CT' } },
          required: true,
        },
      ],
    },
    mrSeries: {
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: { equals: { value: 'MR' } },
          required: true,
        },
      ],
    },
    petSeries: {
      seriesMatchingRules: [
        {
          attribute: 'Modality',
          constraint: { equals: { value: 'PT' } },
          required: true,
        },
      ],
    },
  },

  stages: [
    {
      name: 'Multi-Modality 1x3',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 3,
        },
      },
      viewports: [
        {
          viewportOptions: {
            viewportId: 'ct-viewport',
            viewportType: 'volume',
            orientation: 'axial',
          },
          displaySets: [{ id: 'ctSeries' }],  // 引用不同的选择器
        },
        {
          viewportOptions: {
            viewportId: 'mr-viewport',
            viewportType: 'volume',
            orientation: 'axial',
          },
          displaySets: [{ id: 'mrSeries' }],  // 引用不同的选择器
        },
        {
          viewportOptions: {
            viewportId: 'pet-viewport',
            viewportType: 'volume',
            orientation: 'axial',
          },
          displaySets: [{ id: 'petSeries' }],  // 引用不同的选择器
        },
      ],
    },
  ],
};
```

#### 3. 融合视图（Fusion View）

在同一视口中显示多个数据源（例如 PET-CT 融合）：

```typescript
export const petCtFusionProtocol: Types.HangingProtocol.Protocol = {
  id: 'pet-ct-fusion',
  name: 'PET-CT Fusion',

  displaySetSelectors: {
    ctSeries: {
      seriesMatchingRules: [
        { attribute: 'Modality', constraint: { equals: { value: 'CT' } } },
      ],
    },
    petSeries: {
      seriesMatchingRules: [
        { attribute: 'Modality', constraint: { equals: { value: 'PT' } } },
      ],
    },
  },

  stages: [
    {
      name: 'Fusion View',
      viewportStructure: {
        layoutType: 'grid',
        properties: { rows: 1, columns: 1 },
      },
      viewports: [
        {
          viewportOptions: {
            viewportId: 'fusion-viewport',
            viewportType: 'volume',
            orientation: 'axial',
          },
          // 关键：使用多个 displaySet 实现融合
          displaySets: [
            { id: 'ctSeries' },
            { id: 'petSeries' },
          ],
        },
      ],
    },
  ],
};
```

#### 4. 拖放实现不同数据加载

```typescript
// 拖放处理函数
function handleDropOnViewport(
  viewportId: string,
  displaySetInstanceUID: string
): void {
  const { viewportGridService, hangingProtocolService } = servicesManager.services;
  const state = viewportGridService.getState();

  // 检查是否是挂载协议布局
  const isHPLayout = state.isHangingProtocolLayout;

  // 获取需要更新的视口列表（协议可能要求同步更新）
  const viewportsToUpdate = hangingProtocolService.getViewportsRequireUpdate(
    viewportId,
    displaySetInstanceUID,
    isHPLayout
  );

  // 批量更新视口数据
  viewportGridService.setDisplaySetsForViewports(
    viewportsToUpdate.map(update => ({
      viewportId: update.viewportId,
      displaySetInstanceUIDs: update.displaySetInstanceUIDs,
      viewportOptions: update.viewportOptions,
      displaySetOptions: update.displaySetOptions,
    }))
  );
}
```

---

## 实战代码示例

### 完整的视口布局切换组件

```typescript
import React, { useCallback } from 'react';
import { useViewportGrid, useHangingProtocols } from '@ohif/react-core';
import { Enums } from '@cornerstonejs/core';

/**
 * 视口布局切换组件
 */
export function ViewportLayoutSwitcher() {
  const [{ layout, viewports }, viewportGridApi] = useViewportGrid();
  const { activeProtocolId, setProtocol } = useHangingProtocols();

  /**
   * 切换到网格布局
   */
  const switchToGridLayout = useCallback((rows: number, cols: number) => {
    viewportGridApi.setLayout({
      layoutType: 'grid',
      numRows: rows,
      numCols: cols,
      findOrCreateViewport: (position, positionId, options) => {
        // 查找现有视口或创建新视口
        const existingViewport = Array.from(viewports.values()).find(
          vp => vp.positionId === positionId
        );

        return existingViewport || {
          viewportOptions: { viewportId: `viewport-${Date.now()}` },
          displaySetInstanceUIDs: [],
          displaySetOptions: [{}],
        };
      },
      isHangingProtocolLayout: false,
    });
  }, [viewportGridApi, viewports]);

  /**
   * 切换到 MPR 协议
   */
  const switchToMPR = useCallback(() => {
    setProtocol('mpr');
  }, [setProtocol]);

  /**
   * 切换视口的 volume/stack 类型
   */
  const switchViewportType = useCallback((viewportId: string) => {
    const viewport = viewports.get(viewportId);
    if (!viewport) return;

    const displaySetUIDs = viewport.displaySetInstanceUIDs;
    if (displaySetUIDs.length === 0) return;

    // 检查当前类型
    const currentType = viewport.viewportOptions.viewportType;
    const newType = currentType === Enums.ViewportType.STACK
      ? Enums.ViewportType.ORTHOGRAPHIC
      : Enums.ViewportType.STACK;

    // 更新视口类型
    viewportGridApi.setDisplaySetsForViewports([{
      viewportId,
      displaySetInstanceUIDs: displaySetUIDs,
      viewportOptions: {
        viewportId,
        viewportType: newType,
        orientation: Enums.OrientationAxis.AXIAL,
      },
    }]);
  }, [viewportGridApi, viewports]);

  /**
   * 在不同视口中加载不同数据
   */
  const loadDifferentData = useCallback((
    viewportId1: string,
    displaySetUID1: string,
    viewportId2: string,
    displaySetUID2: string
  ) => {
    viewportGridApi.setDisplaySetsForViewports([
      {
        viewportId: viewportId1,
        displaySetInstanceUIDs: [displaySetUID1],
        viewportOptions: { viewportId: viewportId1 },
      },
      {
        viewportId: viewportId2,
        displaySetInstanceUIDs: [displaySetUID2],
        viewportOptions: { viewportId: viewportId2 },
      },
    ]);
  }, [viewportGridApi]);

  return (
    <div className="layout-controls">
      <button onClick={() => switchToGridLayout(1, 1)}>
        1x1 Layout
      </button>
      <button onClick={() => switchToGridLayout(1, 2)}>
        1x2 Layout
      </button>
      <button onClick={() => switchToGridLayout(2, 2)}>
        2x2 Layout
      </button>
      <button onClick={switchToMPR}>
        MPR Protocol
      </button>
    </div>
  );
}
```

### 自定义挂载协议示例

```typescript
import { Types } from '@ohif/core';

/**
 * 创建自定义挂载协议
 */
export function createCustomProtocol(
  protocolId: string,
  config: {
    name: string;
    rows: number;
    columns: number;
    viewports: Array<{
      viewportId: string;
      viewportType: 'stack' | 'volume';
      orientation?: 'axial' | 'sagittal' | 'coronal';
      displaySetSelectorId: string;
    }>;
    displaySetSelectors: Record<string, Types.HangingProtocol.SeriesMatchingRules[]>;
  }
): Types.HangingProtocol.Protocol {
  return {
    id: protocolId,
    name: config.name,
    isPreset: true,
    displaySetSelectors: Object.entries(config.displaySetSelectors).reduce(
      (acc, [id, rules]) => ({
        ...acc,
        [id]: { seriesMatchingRules: rules },
      }),
      {}
    ),
    stages: [
      {
        name: `${config.name} Stage`,
        viewportStructure: {
          layoutType: 'grid',
          properties: {
            rows: config.rows,
            columns: config.columns,
          },
        },
        viewports: config.viewports.map(vp => ({
          viewportOptions: {
            viewportId: vp.viewportId,
            viewportType: vp.viewportType,
            orientation: vp.orientation,
          },
          displaySets: [{ id: vp.displaySetSelectorId }],
        })),
      },
    ],
  };
}

// 使用示例
const customProtocol = createCustomProtocol('my-layout', {
  name: 'My Custom Layout',
  rows: 2,
  columns: 2,
  viewports: [
    {
      viewportId: 'vp-1',
      viewportType: 'volume',
      orientation: 'axial',
      displaySetSelectorId: 'axialSeries',
    },
    {
      viewportId: 'vp-2',
      viewportType: 'volume',
      orientation: 'sagittal',
      displaySetSelectorId: 'axialSeries',
    },
    {
      viewportId: 'vp-3',
      viewportType: 'volume',
      orientation: 'coronal',
      displaySetSelectorId: 'axialSeries',
    },
    {
      viewportId: 'vp-4',
      viewportType: 'stack',
      displaySetSelectorId: 'secondarySeries',
    },
  ],
  displaySetSelectors: {
    axialSeries: [
      { attribute: 'isReconstructable', constraint: { equals: { value: true } } },
    ],
    secondarySeries: [
      { attribute: 'Modality', constraint: { equals: { value: 'CR' } } },
    ],
  },
});
```

### 视口数据同步监听

```typescript
import { useEffect } from 'react';
import { ViewportGridService } from '@ohif/core';

/**
 * 监听视口数据变化
 */
export function useViewportDataSync() {
  useEffect(() => {
    const unsubscribe = ViewportGridService.EVENTS.EVENTS.subscribe(
      ViewportGridService.EVENTS.DISPLAY_SETS_CHANGED,
      ({ viewports }) => {
        // 处理视口数据变化
        viewports.forEach(({ viewportId, displaySetInstanceUIDs }) => {
          console.log(`Viewport ${viewportId} data changed:`, displaySetInstanceUIDs);

          // 可以在这里添加自定义逻辑，例如：
          // - 更新 UI 状态
          // - 触发测量工具更新
          // - 同步到其他视口
        });
      }
    );

    return () => unsubscribe();
  }, []);
}
```

---

## 最佳实践

### 1. 选择合适的布局方式

**使用网格布局**：
- 需要灵活的行列配置
- 视口数量不固定
- 用户需要自定义布局

**使用挂载协议**：
- 固定的专业视图配置（如 MPR）
- 需要智能数据匹配
- 需要同步组功能

### 2. 性能优化

```typescript
// 避免频繁的视口更新
function debouncedViewportUpdate(
  viewportId: string,
  displaySetUIDs: string[]
) {
  // 使用防抖减少更新频率
  debounce(() => {
    viewportGridService.setDisplaySetsForViewports([{
      viewportId,
      displaySetInstanceUIDs: displaySetUIDs,
    }]);
  }, 300);
}

// 批量更新多个视口
function batchUpdateViewports(updates: Array<{
  viewportId: string;
  displaySetUIDs: string[];
}>) {
  // 使用 setDisplaySetsForViewports 而不是多次调用
  viewportGridService.setDisplaySetsForViewports(updates);
}
```

### 3. 错误处理

```typescript
async function safeSwitchLayout(viewportId: string, displaySetUID: string) {
  try {
    const displaySet = displaySetService.getDisplaySetByUID(displaySetUID);

    // 验证数据集
    if (!displaySet) {
      throw new Error(`DisplaySet ${displaySetUID} not found`);
    }

    // 检查视口类型兼容性
    if (displaySet.isReconstructable) {
      // 可以使用 volume 视图
      await switchToVolumeView(viewportId, displaySetUID);
    } else {
      // 必须使用 stack 视图
      await switchToStackView(viewportId, displaySetUID);
    }
  } catch (error) {
    console.error('Failed to switch layout:', error);
    // 显示用户友好的错误提示
    showNotification({
      title: 'Layout Switch Failed',
      message: error.message,
      type: 'error',
    });
  }
}
```

### 4. 状态管理

```typescript
// 保存当前视口状态
function saveViewportState(): ViewportLayoutState {
  const state = viewportGridService.getState();
  return {
    layout: state.layout,
    viewports: Array.from(state.viewports.entries()).map(([id, vp]) => ({
      viewportId: id,
      displaySetInstanceUIDs: vp.displaySetInstanceUIDs,
      viewportOptions: vp.viewportOptions,
    })),
    activeViewportId: state.activeViewportId,
  };
}

// 恢复视口状态
function restoreViewportState(savedState: ViewportLayoutState) {
  viewportGridService.setLayout({
    ...savedState.layout,
    findOrCreateViewport: /* ... */,
    isHangingProtocolLayout: false,
  });

  viewportGridService.setDisplaySetsForViewports(
    savedState.viewports.map(vp => ({
      viewportId: vp.viewportId,
      displaySetInstanceUIDs: vp.displaySetInstanceUIDs,
      viewportOptions: vp.viewportOptions,
    }))
  );

  viewportGridService.setActiveViewportId(savedState.activeViewportId);
}
```

---

## 常见问题

### Q1: 如何在 Volume 和 Stack 视图间切换？

**A**: 通过修改 `viewportOptions.viewportType` 属性：

```typescript
viewportGridService.setDisplaySetsForViewports([{
  viewportId,
  displaySetInstanceUIDs: [displaySetUID],
  viewportOptions: {
    viewportId,
    viewportType: isVolume ? 'volume' : 'stack',
  },
}]);
```

### Q2: MPR 三个视口如何显示同一数据？

**A**: 在挂载协议中，让多个视口的 `displaySets` 引用相同的 `displaySetSelector` ID：

```typescript
viewports: [
  {
    displaySets: [{ id: 'sameSelector' }],  // 相同 ID
    viewportOptions: { orientation: 'axial' }
  },
  {
    displaySets: [{ id: 'sameSelector' }],  // 相同 ID
    viewportOptions: { orientation: 'sagittal' }
  },
  {
    displaySets: [{ id: 'sameSelector' }],  // 相同 ID
    viewportOptions: { orientation: 'coronal' }
  },
]
```

### Q3: 如何在不同视口显示不同系列？

**A**: 使用不同的 `displaySetSelector` ID 或直接为视口设置不同的 `displaySetInstanceUIDs`：

```typescript
// 方法 1：使用不同的 selector
displaySetSelectors: {
  ctSeries: { /* CT 匹配规则 */ },
  mrSeries: { /* MR 匹配规则 */ },
}

// 方法 2：直接设置不同的 UIDs
viewportGridService.setDisplaySetsForViewports([
  { viewportId: 'vp1', displaySetInstanceUIDs: ['ct-uid'] },
  { viewportId: 'vp2', displaySetInstanceUIDs: ['mr-uid'] },
]);
```

### Q4: 挂载协议不生效怎么办？

**A**: 检查以下几点：
1. 协议是否已注册：`hangingProtocolService.addProtocol()`
2. 数据匹配规则是否正确
3. `isReconstructable` 属性是否正确设置
4. 控制台是否有匹配错误信息

### Q5: 视口同步不工作？

**A**: 确保：
1. 视口的 `syncGroups` 配置正确
2. 视口使用相同的 `toolGroupId`
3. 同步服务已初始化

---

## 参考资源

### 官方文档

- [Cornerstone3D Viewport Documentation](https://www.cornerstonejs.org/reference/current/viewport/viewport)
- [OHIF Viewers Architecture](https://docs.ohif.org/guides/developers/extensions)
- [Hanging Protocol Specification](https://docs.ohif.org/guides/developers/hanging-protocols)

### 关键源文件

参考实现位置：`E:\zaicode\Viewers`

- **视口网格管理**: `platform/ui-next/src/contextProviders/ViewportGridProvider.tsx`
- **挂载协议服务**: `platform/core/src/services/HangingProtocolService/HangingProtocolService.ts`
- **MPR 协议定义**: `extensions/cornerstone/src/hps/mpr.ts`
- **视口服务**: `extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts`
- **布局选择器**: `extensions/default/src/Toolbar/ToolbarLayoutSelector.tsx`

### 示例代码

- **MPR Viewer**: [guides/examples/mpr-viewer](./mpr-viewer/README.md)
- **Basic Viewer**: [guides/examples/basic-viewer](./basic-viewer/README.md)

---

## 更新日志

- **2025-01-21**: 初始版本，基于 Viewers 代码库分析
- 待更新...

---

**注意**: 本文档基于 Cornerstone3D 和 OHIF Viewers 的当前实现编写，具体 API 可能会随版本更新而变化，建议结合实际使用的版本进行调整。
