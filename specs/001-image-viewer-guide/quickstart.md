# Quickstart: Cornerstone3D 影像浏览器开发指南

**Feature**: 001-image-viewer-guide
**Date**: 2025-01-18
**Status**: Phase 1 - Design Complete

## 快速开始指南

欢迎来到 Cornerstone3D 影像浏览器开发指南！本指南将帮助您快速了解如何使用 Cornerstone3D 构建专业的医学影像应用。

---

## 预备知识

在开始之前，请确保您具备以下知识：

- ✅ 熟悉 JavaScript/TypeScript 基础
- ✅ 了解现代前端框架（React、Vue 或 Angular）
- ✅ 对 DICOM 标准和医学影像有基本了解
- ✅ 已安装 Node.js 20+ 和 Yarn 1.22+

如果以上条件不满足，建议先学习相关基础知识后再继续。

---

## 5 分钟快速上手（React + Vite）

让我们用最短的时间创建一个简单的 DICOM 影像查看器！

### 步骤 1: 创建项目（1 分钟）

```bash
# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest my-cornerstone-app -- --template react-ts
cd my-cornerstone-app

# 安装依赖
yarn install
```

### 步骤 2: 安装 Cornerstone3D（1 分钟）

```bash
# 安装 Cornerstone3D 核心包
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader

# 安装必要的依赖
yarn add dicom-parser
yarn add -D @originjs/vite-plugin-commonjs
```

### 步骤 3: 配置 Vite（30 秒）

**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig({
  plugins: [
    react(),
    viteCommonjs(), // 用于 dicom-parser 的 CommonJS 支持
  ],
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: ['dicom-parser'],
  },
  worker: {
    format: 'es',
  },
});
```

### 步骤 4: 初始化 Cornerstone3D（1 分钟）

**文件**: `src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// 导入 Cornerstone3D
import { init } from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import { init as initDICOMLoader } from '@cornerstonejs/dicom-image-loader';

// 初始化 Cornerstone3D
async function initializeCornerstone() {
  try {
    // 初始化核心库
    await init({
      core: {
        renderingEngineMode: 'contextPool',
      },
    });

    // 初始化工具库
    initTools();

    // 注册 DICOM 影像加载器
    initDICOMLoader();

    console.log('✅ Cornerstone3D 初始化成功！');
  } catch (error) {
    console.error('❌ Cornerstone3D 初始化失败:', error);
  }
}

// 在应用启动时初始化
initializeCornerstone().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
```

### 步骤 5: 创建查看器组件（1 分钟）

**文件**: `src/App.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { RenderingEngine, Enums } from '@cornerstonejs/core';

function App() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;

    // 创建渲染引擎
    const renderingEngine = new RenderingEngine('my-rendering-engine');

    // 启用视口
    const viewportInput = {
      viewportId: 'my-viewport',
      element: divRef.current,
      type: Enums.ViewportType.STACK,
    };

    renderingEngine.enableElement(viewportInput);

    // 清理函数
    return () => {
      renderingEngine.destroy();
    };
  }, []);

  return (
    <div>
      <h1>我的第一个 Cornerstone3D 应用</h1>
      <div
        ref={divRef}
        style={{ width: '512px', height: '512px', border: '1px solid black' }}
      />
    </div>
  );
}

export default App;
```

### 步骤 6: 运行应用（30 秒）

```bash
# 启动开发服务器
yarn dev
```

打开浏览器访问 `http://localhost:5173`，您将看到第一个 Cornerstone3D 视口！

---

## 其他框架快速开始

### Vue 3 + Vite

```bash
# 创建 Vue 3 项目
npm create vite@latest my-cornerstone-vue -- --template vue-ts
cd my-cornerstone-vue

# 安装依赖
yarn install
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader
yarn add -D @originjs/vite-plugin-commonjs

# 配置 vite.config.ts（与 React 相同）
# 创建组件 src/components/CornerstoneViewer.vue
```

**详细信息**: 查看 [框架集成指南 - Vue](../getting-started/framework-integration.md#vue-3-集成)

### Angular

```bash
# 创建 Angular 项目
ng new my-cornerstone-angular --routing
cd my-cornerstone-angular

# 安装依赖
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader

# 创建组件 ng generate component cornerstone-viewer
```

**详细信息**: 查看 [框架集成指南 - Angular](../getting-started/framework-integration.md#angular-集成)

### Next.js

```bash
# 创建 Next.js 项目
npx create-next-app@latest my-cornerstone-nextjs --typescript
cd my-cornerstone-nextjs

# 安装依赖
yarn add @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader

# 配置 next.config.js
# 创建客户端组件（'use client'）
```

**详细信息**: 查看 [框架集成指南 - Next.js](../getting-started/framework-integration.md#方案-2-nextjs-集成)

---

## 快速示例集合

### 示例 1: 加载并显示 DICOM 影像

```typescript
import { RenderingEngine, Enums } from '@cornerstonejs/core';

// 创建渲染引擎
const renderingEngine = new RenderingEngine('my-engine');

// 启用视口
const viewportInput = {
  viewportId: 'my-viewport',
  element: document.getElementById('viewport')!,
  type: Enums.ViewportType.STACK,
};
renderingEngine.enableElement(viewportInput);

// 设置影像栈
const imageIds = [
  'wadors:https://dicomserver.com/wado-rs/studies/1.2.3/series/4.5.6/instances/7.8.9',
];

const viewport = renderingEngine.getStackViewport('my-viewport');
viewport.setStack(imageIds, 0); // 0 是当前影像索引
viewport.render();
```

### 示例 2: 添加基本交互工具

```typescript
import {
  addTool,
  ToolGroupManager,
  PanTool,
  ZoomTool,
  WindowLevelTool,
  StackScrollMouseWheelTool,
} from '@cornerstonejs/tools';
import { Enums } from '@cornerstonejs/core';

// 添加工具到库
addTool(PanTool);
addTool(ZoomTool);
addTool(WindowLevelTool);
addTool(StackScrollMouseWheelTool);

// 创建工具组
const toolGroup = ToolGroupManager.createToolGroup('myToolGroup');

// 添加工具到工具组
toolGroup.addTool(PanTool.toolName);
toolGroup.addTool(ZoomTool.toolName);
toolGroup.addTool(WindowLevelTool.toolName);
toolGroup.addTool(StackScrollMouseWheelTool.toolName);

// 将视口添加到工具组
toolGroup.addViewport('my-viewport', 'my-engine');

// 激活工具并配置鼠标绑定
toolGroup.setToolActive(WindowLevelTool.toolName, {
  bindings: [{ mouseButton: Enums.Events.MouseBindings.Primary }], // 左键
});
toolGroup.setToolActive(PanTool.toolName, {
  bindings: [{ mouseButton: Enums.Events.MouseBindings.Auxiliary }], // 中键
});
toolGroup.setToolActive(ZoomTool.toolName, {
  bindings: [{ mouseButton: Enums.Events.MouseBindings.Secondary }], // 右键
});
toolGroup.setToolActive(StackScrollMouseWheelTool.toolName); // 滚轮
```

### 示例 3: 从本地文件加载 DICOM

```typescript
// HTML: 添加文件选择器
<input type="file" accept=".dcm" onChange={handleFileSelect} multiple />

// TypeScript: 处理文件选择
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files) return;

  // 创建 ImageId 列表
  const imageIds = Array.from(files).map((file) => {
    return `imageLoader:file:${file.name}`;
  });

  // 显示影像
  const viewport = renderingEngine.getStackViewport('my-viewport');
  viewport.setStack(imageIds, 0);
  viewport.render();
};
```

### 示例 4: 监听影像加载事件

```typescript
import { eventTarget, Enums } from '@cornerstonejs/core';

// 监听影像加载完成事件
eventTarget.addEventListener(Enums.Events.IMAGE_LOADED, (event) => {
  console.log('✅ 影像加载完成:', event.detail.imageId);
});

// 监听影像加载失败事件
eventTarget.addEventListener(Enums.Events.IMAGE_LOAD_FAILED, (event) => {
  console.error('❌ 影像加载失败:', event.detail.error);
});
```

### 示例 5: 切换影像和调整窗宽窗位

```typescript
// 切换到下一张影像
viewport.scroll(1);

// 切换到上一张影像
viewport.scroll(-1);

// 跳转到指定索引
viewport.gotoImageIndex(5);

// 调整窗宽窗位
viewport.setProperties({
  voiRange: {
    lower: 40,   // 窗位
    upper: 400,  // 窗宽
  },
});
viewport.render();
```

---

## 学习路线图

### 🎯 新手入门（1-2 天）

1. ✅ **5 分钟快速上手** - 创建第一个应用
2. 📖 [项目初始化](../getting-started/project-setup.md) - 完整的项目设置
3. 🚀 [Cornerstone3D 初始化](../getting-started/initialization.md) - 深入理解初始化流程

### 🏗️ 基础构建（3-5 天）

4. 🖼️ [第一个影像查看器](../getting-started/first-viewer.md) - 创建完整查看器
5. 🔧 [基本交互](../getting-started/basic-interactions.md) - 添加缩放、平移、窗宽窗位
6. 🎨 [框架集成](../getting-started/framework-integration.md) - React/Vue/Angular 集成

### 📊 进阶功能（1-2 周）

7. 🏗️ [架构理解](../architecture/overview.md) - 理解 Cornerstone3D 架构
8. 📝 [标注工具](../advanced/annotations.md) - 添加 ROI 标注
9. 📏 [测量工具](../advanced/measurements.md) - 距离、角度测量
10. 🎯 [3D 体渲染](../advanced/volume-rendering.md) - 3D 可视化

### 🚀 高级应用（2-4 周）

11. 🔗 [多视口同步](../advanced/multi-viewport.md) - 多视口联动
12. ⚡ [性能优化](../advanced/performance-optimization.md) - 优化应用性能
13. 🤖 [AI 集成](../advanced/ai-integration.md) - 集成 AI 模型
14. 🛠️ [自定义工具](../advanced/custom-tools.md) - 开发自定义工具

---

## 常见问题速查

### Q: Cornerstone3D 初始化失败？

**检查清单**:
- ✅ 浏览器支持 WebGL 2.0
- ✅ 已安装所有依赖
- ✅ Vite/Webpack 配置正确
- ✅ 查看浏览器控制台错误信息

**解决方案**: [故障排查 - 初始化错误](../troubleshooting/common-errors.md)

### Q: 影像无法显示？

**检查清单**:
- ✅ RenderingEngine 已创建
- ✅ Viewport 已启用
- ✅ ImageId 格式正确
- ✅ 元数据已缓存

**解决方案**: [第一个影像查看器 - 常见问题](../getting-started/first-viewer.md)

### Q: 交互工具不工作？

**检查清单**:
- ✅ 工具已添加到工具库
- ✅ 工具已添加到 ToolGroup
- ✅ 工具已设置为 Active
- ✅ 视口已添加到 ToolGroup
- ✅ 鼠标绑定已配置

**解决方案**: [基本交互 - 常见问题](../getting-started/basic-interactions.md)

### Q: 框架集成问题？

**React**: [框架集成 - React](../getting-started/framework-integration.md#react-集成)
**Vue**: [框架集成 - Vue](../getting-started/framework-integration.md#vue-3-集成)
**Angular**: [框架集成 - Angular](../getting-started/framework-integration.md#angular-集成)

---

## 实用资源

### 📚 官方文档

- [Cornerstone3D 官方网站](https://www.cornerstonejs.org/)
- [API 文档](https://www.cornerstonejs.org/docs/api)
- [GitHub 仓库](https://github.com/cornerstonejs/cornerstone3D)

### 💻 示例项目

- [React + Vite 示例](https://github.com/cornerstonejs/vite-react-cornerstone3d)
- [Vue + Vite 示例](https://github.com/cornerstonejs/vue-cornerstone3d)
- [Angular 示例](https://github.com/cornerstonejs/angular-cornerstone3d)
- [Next.js 示例](https://github.com/cornerstonejs/nextjs-cornerstone3d)

### 🆘 获取帮助

- 📖 [故障排查文档](../troubleshooting/common-errors.md)
- 🔍 [GitHub Issues](https://github.com/cornerstonejs/cornerstone3D/issues)
- 💬 [OHIF 社区论坛](https://community.ohif.org/)

### 📖 相关指南

- 📖 [完整指南目录](../README.md)
- 🏗️ [架构文档](../architecture/overview.md)
- 🚀 [快速入门目录](../getting-started/)

---

## 贡献指南

欢迎贡献您的知识和经验！

1. Fork 本仓库
2. 创建您的特性分支：`git checkout -b feature/my-improvement`
3. 提交您的更改：`git commit -m 'docs: 添加性能优化技巧'`
4. 推送到分支：`git push origin feature/my-improvement`
5. 创建 Pull Request

请确保您的贡献符合项目规范和质量标准。

---

**准备好了吗？开始您的 Cornerstone3D 之旅吧！** 🚀

**推荐起点**: [5 分钟快速上手](#5-分钟快速上手react--vite) → [第一个影像查看器](../getting-started/first-viewer.md) → [基本交互](../getting-started/basic-interactions.md)
