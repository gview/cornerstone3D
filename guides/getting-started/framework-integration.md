---
id: framework-integration
title: 框架集成
category: getting-started
order: 5
description: 如何在 React、Vue、Angular 等主流前端框架中集成和使用 Cornerstone3D
prerequisites: ["project-setup", "initialization"]
estimatedTime: "20 分钟"
difficulty: intermediate
tags: ["React", "Vue", "Angular", "Next.js", "Vite", "Webpack", "框架集成"]
---

# 框架集成

## 概述

Cornerstone3D 是框架无关的（framework-agnostic），可以与任何现代前端框架集成。本文档将详细介绍如何在以下框架中使用 Cornerstone3D：

- **React** (包括 Vite 和 Next.js)
- **Vue** (Vue 3 + Vite)
- **Angular** (Angular 15+)

我们还将提供构建工具（Vite、Webpack）的配置示例。

---

## 前置条件

在开始之前，请确保您已经：

- ✅ 完成了 [项目初始化](project-setup.md)
- ✅ 完成了 [Cornerstone3D 初始化](initialization.md)
- ✅ 熟悉至少一个前端框架的基础知识

---

## 框架支持对比

| 框架 | 支持状态 | 推荐度 | 构建工具 | 复杂度 |
|------|---------|--------|----------|--------|
| React + Vite | ✅ 完全支持 | ⭐⭐⭐⭐⭐ | Vite | 低 |
| Next.js | ✅ 完全支持 | ⭐⭐⭐⭐⭐ | Webpack/Turbopack | 中 |
| Vue 3 + Vite | ✅ 完全支持 | ⭐⭐⭐⭐⭐ | Vite | 低 |
| Angular | ✅ 完全支持 | ⭐⭐⭐⭐ | CLI/Webpack | 中 |
| Svelte | ✅ 社区支持 | ⭐⭐⭐ | Vite | 低 |

---

## React 集成

### 方案 1: React + Vite（推荐）

#### 创建项目

```bash
# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest my-cornerstone-app -- --template react-ts
cd my-cornerstone-app

# 安装依赖
yarn install

# 安装 Cornerstone3D
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader
```

#### 配置 vite.config.ts

**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig({
  plugins: [
    react(),
    // 用于 dicom-parser 的 CommonJS 支持
    viteCommonjs(),
  ],
  // 优化依赖配置
  optimizeDeps: {
    exclude: [
      '@cornerstonejs/dicom-image-loader',
    ],
    include: [
      'dicom-parser',
    ],
  },
  // Web Worker 配置
  worker: {
    format: 'es',
  },
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
  },
});
```

**安装额外的依赖**:

```bash
yarn add -D @originjs/vite-plugin-commonjs
```

#### 创建 React 组件

**文件**: `src/components/CornerstoneViewer.tsx`

```typescript
import { useEffect, useRef, useState } from 'react';
import { RenderingEngine, Enums } from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import { initDICOMLoader } from '@cornerstonejs/dicom-image-loader';
import {
  addTool,
  ToolGroupManager,
  PanTool,
  ZoomTool,
  WindowLevelTool,
  StackScrollTool,
} from '@cornerstonejs/tools';

interface CornerstoneViewerProps {
  imageIds: string[];
  viewportId?: string;
  renderingEngineId?: string;
}

export function CornerstoneViewer({
  imageIds,
  viewportId = 'my-viewport',
  renderingEngineId = 'my-rendering-engine',
}: CornerstoneViewerProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const renderingEngineRef = useRef<any>(null);
  const toolGroupIdRef = useRef<string>('');

  useEffect(() => {
    if (!divRef.current || imageIds.length === 0) {
      return;
    }

    let renderingEngine: any = null;

    const initialize = async () => {
      try {
        // 1. 初始化工具库
        initTools();

        // 2. 初始化 DICOM 加载器
        initDICOMLoader.init();

        // 3. 添加工具
        addTool(PanTool);
        addTool(ZoomTool);
        addTool(WindowLevelTool);
        addTool(StackScrollTool);

        // 4. 创建渲染引擎
        renderingEngine = new RenderingEngine(renderingEngineId);
        renderingEngineRef.current = renderingEngine;

        // 5. 启用视口
        const viewportInput = {
          viewportId: viewportId,
          element: divRef.current!,
          type: Enums.ViewportType.STACK,
        };
        renderingEngine.enableElement(viewportInput);

        // 6. 设置工具组
        const toolGroupId = 'myToolGroup';
        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
        toolGroupIdRef.current = toolGroupId;

        toolGroup.addTool(PanTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);
        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.addTool(StackScrollTool.toolName);

        toolGroup.addViewport(viewportId, renderingEngineId);

        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: Enums.Events.MouseBindings.Primary }],
        });
        toolGroup.setToolActive(PanTool.toolName, {
          bindings: [{ mouseButton: Enums.Events.MouseBindings.Auxiliary }],
        });
        toolGroup.setToolActive(ZoomTool.toolName, {
          bindings: [{ mouseButton: Enums.Events.MouseBindings.Secondary }],
        });
        toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [
          {
            mouseButton: CsEnums.Events.MouseBindings.Wheel,
          },
        ],
      });

        // 7. 设置影像栈
        const viewport = renderingEngine.getStackViewport(viewportId);
        viewport.setStack(imageIds, 0);
        viewport.render();

        setIsInitialized(true);
      } catch (error) {
        console.error('初始化失败:', error);
      }
    };

    initialize();

    // 清理函数
    return () => {
      if (toolGroupIdRef.current) {
        ToolGroupManager.destroyToolGroup(toolGroupIdRef.current);
      }
      if (renderingEngine && !renderingEngine.hasBeenDestroyed) {
        renderingEngine.destroy();
      }
    };
  }, [imageIds, viewportId, renderingEngineId]);

  return (
    <div>
      <div
        ref={divRef}
        style={{
          width: '512px',
          height: '512px',
          border: '1px solid black',
          backgroundColor: 'black',
        }}
      />
      {!isInitialized && <p>⏳ 正在初始化...</p>}
    </div>
  );
}
```

#### 在 App 中使用

**文件**: `src/App.tsx`

```typescript
import { CornerstoneViewer } from './components/CornerstoneViewer';

function App() {
  // 示例 ImageId 列表
  const imageIds = [
    'wadors:https://dicomserver.com/wado-rs/studies/1.2.3/series/4.5.6/instances/7.8.9',
  ];

  return (
    <div>
      <h1>Cornerstone3D React Viewer</h1>
      <CornerstoneViewer imageIds={imageIds} />
    </div>
  );
}

export default App;
```

---

### 方案 2: Next.js 集成

#### 创建项目

```bash
# 创建 Next.js 项目
npx create-next-app@latest my-cornerstone-nextjs --typescript

# 进入项目目录
cd my-cornerstone-nextjs

# 安装 Cornerstone3D
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader
```

#### 配置 next.config.js

**文件**: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // 解析 fs 模块（某些依赖需要）
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
  // 启用 SWC 转译
  transpilePackages: ['@cornerstonejs'],
};

module.exports = nextConfig;
```

#### 创建客户端组件

**文件**: `src/components/CornerstoneViewer.tsx`

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
// ... 其余代码与 React + Vite 示例相同

export function CornerstoneViewer({ imageIds }: { imageIds: string[] }) {
  // ... 完全相同的实现
}
```

> **💡 提示**: Next.js 13+ 使用 App Router，必须在组件顶部添加 `'use client'` 指令。

#### 在页面中使用

**文件**: `src/app/page.tsx`

```typescript
import { CornerstoneViewer } from '@/components/CornerstoneViewer';

export default function Home() {
  const imageIds = [
    'wadors:https://dicomserver.com/wado-rs/studies/1.2.3/series/4.5.6/instances/7.8.9',
  ];

  return (
    <main>
      <h1>Cornerstone3D Next.js Viewer</h1>
      <CornerstoneViewer imageIds={imageIds} />
    </main>
  );
}
```

---

## Vue 3 集成

### 创建项目

```bash
# 使用 Vite 创建 Vue 3 + TypeScript 项目
npm create vite@latest my-cornerstone-vue -- --template vue-ts
cd my-cornerstone-vue

# 安装依赖
yarn install

# 安装 Cornerstone3D
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader

# 安装 Vite CommonJS 插件
yarn add -D @originjs/vite-plugin-commonjs
```

### 配置 vite.config.ts

**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig({
  plugins: [
    vue(),
    viteCommonjs(),
  ],
  optimizeDeps: {
    exclude: [
      '@cornerstonejs/dicom-image-loader',
    ],
    include: [
      'dicom-parser',
    ],
  },
  worker: {
    format: 'es',
  },
});
```

### 创建 Vue 组件

**文件**: `src/components/CornerstoneViewer.vue`

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RenderingEngine, Enums } from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import { initDICOMLoader } from '@cornerstonejs/dicom-image-loader';
import {
  addTool,
  ToolGroupManager,
  PanTool,
  ZoomTool,
  WindowLevelTool,
  StackScrollTool,
} from '@cornerstonejs/tools';

// Props
interface Props {
  imageIds: string[];
  viewportId?: string;
  renderingEngineId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  viewportId: 'my-viewport',
  renderingEngineId: 'my-rendering-engine',
});

// Refs
const viewportElement = ref<HTMLDivElement | null>(null);
const isInitialized = ref(false);

// 实例引用
let renderingEngine: any = null;
let toolGroupId = '';

// 初始化
onMounted(async () => {
  if (!viewportElement.value || props.imageIds.length === 0) {
    return;
  }

  try {
    // 1. 初始化工具库
    initTools();

    // 2. 初始化 DICOM 加载器
    initDICOMLoader.init();

    // 3. 添加工具
    addTool(PanTool);
    addTool(ZoomTool);
    addTool(WindowLevelTool);
    addTool(StackScrollTool);

    // 4. 创建渲染引擎
    renderingEngine = new RenderingEngine(props.renderingEngineId);

    // 5. 启用视口
    const viewportInput = {
      viewportId: props.viewportId,
      element: viewportElement.value!,
      type: Enums.ViewportType.STACK,
    };
    renderingEngine.enableElement(viewportInput);

    // 6. 设置工具组
    toolGroupId = 'myToolGroup';
    const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

    toolGroup.addTool(PanTool.toolName);
    toolGroup.addTool(ZoomTool.toolName);
    toolGroup.addTool(WindowLevelTool.toolName);
    toolGroup.addTool(StackScrollTool.toolName);

    toolGroup.addViewport(props.viewportId, props.renderingEngineId);

    toolGroup.setToolActive(WindowLevelTool.toolName, {
      bindings: [{ mouseButton: Enums.Events.MouseBindings.Primary }],
    });
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: Enums.Events.MouseBindings.Auxiliary }],
    });
    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: Enums.Events.MouseBindings.Secondary }],
    });
    toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [
          {
            mouseButton: CsEnums.Events.MouseBindings.Wheel,
          },
        ],
      });

    // 7. 设置影像栈
    const viewport = renderingEngine.getStackViewport(props.viewportId);
    viewport.setStack(props.imageIds, 0);
    viewport.render();

    isInitialized.value = true;
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

// 清理
onUnmounted(() => {
  if (toolGroupId) {
    ToolGroupManager.destroyToolGroup(toolGroupId);
  }
  if (renderingEngine && !renderingEngine.hasBeenDestroyed) {
    renderingEngine.destroy();
  }
});
</script>

<template>
  <div>
    <div
      ref="viewportElement"
      class="viewport"
    />
    <p v-if="!isInitialized">⏳ 正在初始化...</p>
  </div>
</template>

<style scoped>
.viewport {
  width: 512px;
  height: 512px;
  border: 1px solid black;
  background-color: black;
}
</style>
```

### 在 App 中使用

**文件**: `src/App.vue`

```vue
<script setup lang="ts">
import CornerstoneViewer from './components/CornerstoneViewer.vue';

const imageIds = [
  'wadors:https://dicomserver.com/wado-rs/studies/1.2.3/series/4.5.6/instances/7.8.9',
];
</script>

<template>
  <h1>Cornerstone3D Vue Viewer</h1>
  <CornerstoneViewer :image-ids="imageIds" />
</template>
```

---

## Angular 集成

### 创建项目

```bash
# 创建 Angular 项目
ng new my-cornerstone-angular --routing --style=css

# 进入项目目录
cd my-cornerstone-angular

# 安装 Cornerstone3D
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader
```

### 配置 angular.json

Angular CLI 会自动处理大部分配置。但需要确保正确的 polyfills：

**文件**: `src/polyfills.ts`

```typescript
/**
 * Cornerstone3D 所需的 polyfills
 */

// Zone.js polyfill（Angular 需要）
import 'zone.js';
```

### 创建 Angular 组件

**文件**: `src/app/cornerstone-viewer/cornerstone-viewer.component.ts`

```typescript
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Input,
} from '@angular/core';
import { RenderingEngine, Enums } from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import { initDICOMLoader } from '@cornerstonejs/dicom-image-loader';
import {
  addTool,
  ToolGroupManager,
  PanTool,
  ZoomTool,
  WindowLevelTool,
  StackScrollTool,
} from '@cornerstonejs/tools';

@Component({
  selector: 'app-cornerstone-viewer',
  template: `
    <div>
      <div #viewportElement class="viewport"></div>
      <p *ngIf="!isInitialized">⏳ 正在初始化...</p>
    </div>
  `,
  styles: [
    `
      .viewport {
        width: 512px;
        height: 512px;
        border: 1px solid black;
        background-color: black;
      }
    `,
  ],
})
export class CornerstoneViewerComponent implements OnInit, OnDestroy {
  @Input() imageIds: string[] = [];
  @Input() viewportId = 'my-viewport';
  @Input() renderingEngineId = 'my-rendering-engine';

  @ViewChild('viewportElement', { static: true })
  viewportElement!: ElementRef<HTMLDivElement>;

  isInitialized = false;
  private renderingEngine: any = null;
  private toolGroupId = '';

  async ngOnInit(): Promise<void> {
    if (!this.viewportElement || this.imageIds.length === 0) {
      return;
    }

    try {
      // 1. 初始化工具库
      initTools();

      // 2. 初始化 DICOM 加载器
      initDICOMLoader.init();

      // 3. 添加工具
      addTool(PanTool);
      addTool(ZoomTool);
      addTool(WindowLevelTool);
      addTool(StackScrollTool);

      // 4. 创建渲染引擎
      this.renderingEngine = new RenderingEngine(this.renderingEngineId);

      // 5. 启用视口
      const viewportInput = {
        viewportId: this.viewportId,
        element: this.viewportElement.nativeElement,
        type: Enums.ViewportType.STACK,
      };
      this.renderingEngine.enableElement(viewportInput);

      // 6. 设置工具组
      this.toolGroupId = 'myToolGroup';
      const toolGroup = ToolGroupManager.createToolGroup(this.toolGroupId);

      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);
      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(StackScrollTool.toolName);

      toolGroup.addViewport(this.viewportId, this.renderingEngineId);

      toolGroup.setToolActive(WindowLevelTool.toolName, {
        bindings: [{ mouseButton: Enums.Events.MouseBindings.Primary }],
      });
      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [{ mouseButton: Enums.Events.MouseBindings.Auxiliary }],
      });
      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [{ mouseButton: Enums.Events.MouseBindings.Secondary }],
      });
      toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [
          {
            mouseButton: CsEnums.Events.MouseBindings.Wheel,
          },
        ],
      });

      // 7. 设置影像栈
      const viewport = this.renderingEngine.getStackViewport(this.viewportId);
      viewport.setStack(this.imageIds, 0);
      viewport.render();

      this.isInitialized = true;
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.toolGroupId) {
      ToolGroupManager.destroyToolGroup(this.toolGroupId);
    }
    if (this.renderingEngine && !this.renderingEngine.hasBeenDestroyed) {
      this.renderingEngine.destroy();
    }
  }
}
```

### 在 App 中使用

**文件**: `src/app/app.component.ts`

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h1>Cornerstone3D Angular Viewer</h1>
    <app-cornerstone-viewer [imageIds]="imageIds" />
  `,
})
export class AppComponent {
  imageIds = [
    'wadors:https://dicomserver.com/wado-rs/studies/1.2.3/series/4.5.6/instances/7.8.9',
  ];
}
```

---

## 高级配置

### PolySeg 支持

如果需要使用多态分割（Polymorphic Segmentation）功能：

#### 安装依赖

```bash
yarn add @cornerstonejs/polymorphic-segmentation
```

#### 初始化配置

```typescript
import * as polySeg from '@cornerstonejs/polymorphic-segmentation';
import { init } from '@cornerstonejs/tools';

init({
  addons: {
    polySeg,
  },
});
```

#### Vite 配置更新

```typescript
export default defineConfig({
  assetsInclude: ['**/*.wasm'],
  plugins: [
    react(),
    viteCommonjs(),
  ],
  optimizeDeps: {
    exclude: [
      '@cornerstonejs/dicom-image-loader',
      '@cornerstonejs/polymorphic-segmentation',
    ],
    include: ['dicom-parser'],
  },
  worker: {
    format: 'es',
  },
});
```

### Labelmap 插值支持

如果需要使用标签映射插值功能：

#### 安装依赖

```bash
yarn add @cornerstonejs/labelmap-interpolation
```

#### Vite 配置更新

```typescript
export default defineConfig({
  assetsInclude: ['**/*.wasm'],
  plugins: [
    react(),
    viteCommonjs(),
  ],
  optimizeDeps: {
    exclude: [
      '@cornerstonejs/dicom-image-loader',
      '@cornerstonejs/polymorphic-segmentation',
      '@cornerstonejs/labelmap-interpolation',
    ],
    include: ['dicom-parser'],
  },
  worker: {
    format: 'es',
  },
});
```

---

## 常见问题

### Q: Vite 开发模式下出现模块加载错误？

**A**: 确保 `vite.config.ts` 中正确配置了 `optimizeDeps`：

```typescript
optimizeDeps: {
  exclude: ['@cornerstonejs/dicom-image-loader'],
  include: ['dicom-parser'],
}
```

### Q: Next.js 中出现 "fs module not found" 错误？

**A**: 在 `next.config.js` 中添加 fallback 配置：

```javascript
webpack: (config) => {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
  };
  return config;
}
```

### Q: Angular 中组件不更新？

**A**: 确保在 `ngOnDestroy` 中正确清理资源，并使用 Change Detection 策略：

```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(private cdr: ChangeDetectorRef) {}

// 在需要时手动触发更新
this.cdr.detectChanges();
```

### Q: Vue 3 中出现响应式问题？

**A**: 使用 `shallowRef` 或 `markRaw` 避免深度响应式：

```typescript
import { shallowRef, markRaw } from 'vue';

const renderingEngine = shallowRef(null);

// 或
const viewport = markRaw(renderingEngine.getViewport('id'));
```

---

## 最佳实践

### 1. 组件封装

将 Cornerstone3D 逻辑封装在独立的组件中，便于复用：

```typescript
// ✅ 好的做法：封装在独立组件
<CornerstoneViewer imageIds={imageIds} />

// ❌ 不好的做法：直接在主组件中实现所有逻辑
```

### 2. 资源清理

始终在组件卸载时清理资源：

```typescript
// React
useEffect(() => {
  // 初始化...
  return () => {
    // 清理...
    renderingEngine.destroy();
  };
}, []);

// Vue
onUnmounted(() => {
  renderingEngine.destroy();
});

// Angular
ngOnDestroy() {
  renderingEngine.destroy();
}
```

### 3. 错误边界

在 React 中使用 Error Boundary 捕获错误：

```typescript
class CornerstoneErrorBoundary extends React.Component {
  // 实现 error boundary...
}

<CornerstoneErrorBoundary>
  <CornerstoneViewer imageIds={imageIds} />
</CornerstoneErrorBoundary>
```

### 4. 性能优化

- 使用 `React.memo`、`Vue computed`、`Angular pure pipes` 优化渲染
- 避免在渲染循环中创建新对象
- 使用 `useCallback`、`computed` 缓存计算结果

---

## 相关资源

- [项目初始化](project-setup.md)
- [Cornerstone3D 初始化](initialization.md)
- [第一个影像查看器](first-viewer.md)
- [基本交互](basic-interactions.md)

### 官方示例

- [React + Vite 示例](https://github.com/cornerstonejs/vite-react-cornerstone3d)
- [Vue + Vite 示例](https://github.com/cornerstonejs/vue-cornerstone3d)
- [Angular 示例](https://github.com/cornerstonejs/angular-cornerstone3d)
- [Next.js 示例](https://github.com/cornerstonejs/nextjs-cornerstone3d)

---

**导航**: [返回快速入门](../getting-started/) | [返回指南首页](../README.md)
