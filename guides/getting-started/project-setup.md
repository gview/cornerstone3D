---
id: project-setup
title: 项目初始化
category: getting-started
order: 1
description: 如何创建和初始化一个新的 Cornerstone3D 项目，包含依赖安装、基础配置和环境设置
prerequisites: []
estimatedTime: "10 分钟"
difficulty: beginner
tags: ["项目初始化", "环境配置", "依赖安装", "Vite", "React", "TypeScript"]
---

# 项目初始化

## 概述

本文档将指导您创建和初始化一个新的 Cornerstone3D 项目。我们将使用 Vite + React + TypeScript 作为主要技术栈，这是最常用和推荐的开发模式。

---

## 前置条件

### 环境要求

- ✅ **Node.js 20+** - [下载地址](https://nodejs.org/)
- ✅ **Yarn 1.22+** - [下载地址](https://yarnpkg.com/)
- ✅ **现代浏览器** - Chrome、Firefox、Safari、Edge 最新版本
- ✅ **WebGL 2.0** - 浏览器必须支持 WebGL 2.0
- ✅ **基础前端开发知识** - HTML、CSS、JavaScript/TypeScript
- ✅ **基础医学影像知识** - 了解 DICOM 基本概念

### 验证环境

```bash
# 检查 Node.js 版本
node --version

# 检查 Yarn 版本
yarn --version

# 验证 WebGL 支持
# 在浏览器控制台运行
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');
console.log('WebGL 2.0 支持:', gl !== null);
```

---

## 步骤 1: 创建新项目

### 1.1 使用 Vite 创建项目

```bash
# 创建新项目（推荐使用 Vite）
npm create vite@latest cornerstone3d-app -- --template react-ts
```

**选项说明**:
- `cornerstone3d-app` - 项目名称
- `--template react-ts` - React + TypeScript 模板
- `--` 后面可以添加更多选项

### 1.2 选择配置

创建过程中会提示选择配置项：

```bash
? Select a framework: React
? Select a variant: TypeScript
? 选择包管理器：Yarn
? 选择模板：React + TypeScript
```

---

## 步骤 2: 进入项目目录

```bash
cd cornerstone3d-app
```

---

## 步骤 3: 安装 Cornerstone3D 依赖

### 3.1 安装核心依赖

```bash
# 安装核心包
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader
```

**安装的包**:
- `@cornerstonejs/core` - 核心渲染引擎
- `@cornerstonejs/tools` - 交互工具库
- `@cornerstonejs/dicom-image-loader` - DICOM 影像加载器

### 3.2 安装附加依赖（可选）

```bash
# 安装其他有用的库
yarn add dicom-parser
yarn add @kitware/vtk.js
```

---

## 步骤 4: 配置项目

### 4.1 创建目录结构

```bash
# 创建源代码目录结构
mkdir -p src/cornerstone
mkdir -p src/components
mkdir - src/utils
mkdir - src/types
mkdir - src/styles
```

### 4.2 创建 vite.config.ts

**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cornerstonejs': path.resolve(__dirname, './src/cornerstone'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### 4.3 创建 tsconfig.json

**文件**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "jsx": "react",
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@cornerstonejs/*": ["./src/cornerstone/*"],
    }
  },
  "include": ["src", "src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 步骤 5: 创建 HTML 入口

**文件**: `index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cornerstone3D 影像浏览器</title>
    <style>
      /* 基础样式 */
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      #root {
        width: 100vw;
        height: 100vh;
      }
      .viewport {
        width: 512px;
        height: 512px;
        border: 1px solid black;
        margin: 20px;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <div id="viewport" class="viewport"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 步骤 6: 创建 React 组件

**文件**: `src/App.tsx`

```typescript
import { useEffect, useRef, useState } from 'react';
import { init as initCore } from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import { wadorsImageLoader } from '@cornerstonejs/dicom-image-loader';

function App() {
  const divRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initCornerstone3D = async () => {
      try {
        // 初始化核心库
        await initCore({
          core: {
            renderingEngineMode: 'contextPool',
          },
        });
        // 初始化工具库
        initTools();
        // 初始化 DICOM 影像加载器
        wadorsImageLoader.init();
        setIsInitialized(true);
        console.log('✅ Cornerstone3D 初始化成功！');
      } catch (error) {
        console.error('❌ 初始化失败:', error);
      }
    };

    initCornerstone3D();
  }, []);

  return (
    <div>
      <h1>Cornerstone3D 影像浏览器</h1>
      {isInitialized ? (
        <p>✅ 初始化完成</p>
      ) : (
        <p>⏳ 初始化中...</p>
      )}
    </div>
  );
}

export default App;
```
```

---

## 步骤 7: 初始化配置

**文件**: `src/cornerstone/init.ts`

```typescript
import {
  init as initCore,
  enums as Enums,
  IEventListener,
 }
import { init as initTools } from '@cornerstonejs/tools';

export async function initializeCornerstone3D(): Promise<void> {
  // 初始化核心库
  await initCore({
    core: {
      renderingEngineMode: Enums.RenderingEngineMode.CONTEXT_POOL,
      webGlContextCount: 7,
    },
  });

  // 初始化工具库
  initTools();
}

export default initializeCornerstone3D;
```

---

## 步骤 8: 运行项目

```bash
# 启动开发服务器
yarn dev
```

访问 `http://localhost:3000` 查看应用状态。

---

## 常见问题

### Q: 如何验证 Cornerstone3D 初始化成功？

**A**: 在浏览器控制台中查找：

```typescript
console.log('✅ Cornerstone3D 初始化成功！');
```

### Q: 如何修改端口？

**A**: 修改 `vite.config.ts` 中的 `server.port` 配置。

### Q: 支持其他框架吗？

**A**: 支持！在 [框架集成](framework-integration.md) 中查看 Vue 和 Angular 的配置。

---

## 相关资源

- [Cornerstone3D 官方文档](https://www.cornerstone3D.org/docs/)
- [快速入门 - 第一个影像查看器](first-viewer.md)
- [快速入门 - 基本交互](basic-interactions.md)
- [框架集成](framework-integration.md)

---

**下一步**: [Cornerstone3D 初始化](initialization.md)

---

**导航**: [返回快速入门](../getting-started/) | [返回指南首页](../README.md)
