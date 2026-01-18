# Cornerstone3D 基础影像查看器示例

一个简单的 DICOM 影像查看器示例，展示了如何使用 Cornerstone3D 构建基础的医学影像应用。

## 简介

本示例是一个最小化的 Cornerstone3D 应用，演示了以下核心功能：

- ✅ Cornerstone3D 初始化
- ✅ StackViewport（堆栈视口）创建
- ✅ DICOM 影像加载和显示
- ✅ 基本交互工具（缩放、平移、窗宽窗位、滚动）
- ✅ 响应式布局

本示例适合 Cornerstone3D 初学者，涵盖了构建医学影像应用的基础知识。

## 功能特性

### 核心 Cornerstone3D 功能

- **RenderingEngine**: 管理 WebGL 上下文和视口生命周期
- **StackViewport**: 显示 2D DICOM 影像序列
- **工具系统**: 集成基本交互工具
- **DICOM 加载**: 使用 wado-rs 协议加载 DICOM 影像

### 交互工具

| 工具 | 鼠标操作 | 功能描述 |
|------|---------|----------|
| 窗宽窗位 | 左键拖拽 | 调整影像的窗宽和窗位 |
| 平移 | 中键拖拽 | 移动影像位置 |
| 缩放 | 右键拖拽 | 放大或缩小影像 |
| 换层 | 滚轮 | 在影像序列中滚动 |

## 技术栈

- **框架**: React 19.2+
- **构建工具**: Vite 7.3+
- **语言**: TypeScript 5.9+
- **样式**: CSS Modules
- **Cornerstone3D 包**:
  - `@cornerstonejs/core`: 核心渲染引擎
  - `@cornerstonejs/tools`: 交互工具系统
  - `@cornerstonejs/dicom-image-loader`: DICOM 影像加载器

## 运行步骤

### 前置条件

确保已安装 Node.js 20+ 和 Yarn 1.22+：

```bash
node --version  # 应该是 v20 或更高
yarn --version  # 应该是 1.22 或更高
```

### 1. 安装依赖

```bash
yarn install
```

### 2. 启动开发服务器

```bash
yarn dev
```

### 3. 在浏览器中打开

开发服务器启动后，在浏览器中访问：

```
http://localhost:5173
```

### 4. 加载 DICOM 影像

本示例提供两种加载 DICOM 影像的方式：

#### 方式 1: 使用示例数据（推荐）

点击页面上的"加载示例影像"按钮，将从公开的 DICOM 服务器加载示例影像。

#### 方式 2: 上传本地文件

点击"选择本地 DICOM 文件"按钮，选择本地的一个或多个 DICOM 文件（.dcm）。

## 预期结果

成功运行后，您应该看到：

1. **应用界面**:
   - 顶部：标题和控制按钮
   - 中央：影像显示区域（带边框的矩形）
   - 底部：状态信息和操作提示

2. **影像显示**:
   - DICOM 影像在视口中正确渲染
   - 影像清晰可见，默认显示合适的窗宽窗位

3. **交互功能**:
   - 左键拖拽可以调整窗宽窗位
   - 中键拖拽可以平移影像
   - 右键拖拽或滚轮可以缩放影像
   - 滚轮可以在影像序列中滚动（如果有多个影像）

4. **控制台输出**:
   - 看到 "✅ Cornerstone3D 初始化成功！" 消息
   - 看到 "✅ 影像加载完成：" 消息
   - 没有错误或警告信息

## 代码结构

```
basic-viewer/
├── public/                 # 静态资源
├── src/
│   ├── main.tsx           # 应用入口，初始化 Cornerstone3D
│   ├── App.tsx            # 主组件，包含视口和 UI
│   ├── cornerstone/       # Cornerstone3D 相关代码
│   │   ├── init.ts        # Cornerstone3D 初始化逻辑
│   │   └── viewport.ts    # 视口创建和管理
│   └── types/             # TypeScript 类型定义
│       └── index.d.ts
├── index.html             # HTML 入口
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
├── package.json           # 依赖和脚本
└── README.md              # 本文件
```

### 主要文件说明

#### `src/main.tsx`

应用入口，负责：
- 导入必要的样式
- 初始化 Cornerstone3D 核心库
- 初始化工具系统
- 注册 DICOM 影像加载器
- 渲染 React 应用

#### `src/App.tsx`

主组件，负责：
- 创建视口容器 DOM 元素
- 管理应用状态（影像加载、错误等）
- 渲染 UI（标题、按钮、状态信息）
- 处理用户交互（加载影像、文件上传）

#### `src/cornerstone/init.ts`

Cornerstone3D 初始化模块，提供：
- `initializeCornerstone()`: 初始化核心库和工具
- 导出初始化状态和错误处理

#### `src/cornerstone/viewport.ts`

视口管理模块，提供：
- `createViewport()`: 创建和配置 StackViewport
- `setupTools()`: 设置交互工具
- `loadImage()`: 加载 DICOM 影像
- `destroyViewport()`: 清理视口资源

## 学习要点

通过本示例，您将学习到：

### 1. Cornerstone3D 初始化流程

```typescript
// 1. 初始化核心库
await init({ renderingEngineMode: 'contextPool' });

// 2. 初始化工具系统
initTools();

// 3. 注册 DICOM 加载器
initDICOMLoader();
```

**关键点**: 必须在使用任何 Cornerstone3D API 之前完成初始化。

### 2. RenderingEngine 和 Viewport 的关系

```typescript
// 1. 创建 RenderingEngine
const renderingEngine = new RenderingEngine('my-engine');

// 2. 启用 Viewport
renderingEngine.enableElement({
  viewportId: 'my-viewport',
  element: divElement,
  type: ViewportType.STACK,
});

// 3. 获取 Viewport 实例
const viewport = renderingEngine.getStackViewport('my-viewport');
```

**关键点**: RenderingEngine 是顶层管理者，Viewport 是实际的渲染容器。

### 3. 工具系统的使用

```typescript
// 1. 添加工具到工具库
addTool(PanTool);
addTool(ZoomTool);
addTool(WindowLevelTool);

// 2. 创建工具组
const toolGroup = ToolGroupManager.createToolGroup('myToolGroup');

// 3. 添加工具到工具组
toolGroup.addTool(PanTool.toolName);

// 4. 将视口添加到工具组
toolGroup.addViewport('my-viewport', 'my-engine');

// 5. 激活工具并配置鼠标绑定
toolGroup.setToolActive(PanTool.toolName, {
  bindings: [{ mouseButton: MouseBindings.Auxiliary }],
});
```

**关键点**: 工具必须添加到 ToolGroup 并与视口关联才能工作。

### 4. ⚠️ 重要：换层功能的滚轮绑定

**关键配置**：
```typescript
// ✅ 正确 - 必须明确配置 Wheel 绑定
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [
    {
      mouseButton: ToolsEnums.MouseBindings.Wheel, // 这是必需的！
    },
  ],
});

// ❌ 错误 - 缺少滚轮绑定，滚轮无法工作
toolGroup.setToolActive(StackScrollTool.toolName);
```

**为什么需要明确配置？**

与其他工具不同，`StackScrollTool` 需要明确绑定到 `MouseBindings.Wheel` 才能响应滚轮事件。这是 Cornerstone3D 工具系统的设计要求。

**验证配置成功**：
- ✅ 滚轮可以在影像层之间切换
- ✅ 控制台显示 "交互工具已设置完成"
- ✅ 没有警告或错误信息

### 5. DICOM 影像的加载

```typescript
// ImageId 格式：wadors:{URL}
const imageId = 'wadors:https://example.com/wado-rs/studies/...';

// 设置影像栈
viewport.setStack([imageId], 0);

// 渲染视口
viewport.render();
```

**关键点**: ImageId 是影像的唯一标识，不同的加载协议有不同的格式。

### 5. 资源清理

```typescript
// 在组件卸载时清理资源
return () => {
  renderingEngine.destroy();
};
```

**关键点**: 必须在适当时机清理资源，避免内存泄漏。

## 常见问题

### Q: 影像无法显示？

**可能原因**:
1. RenderingEngine 未正确创建
2. Viewport 未启用
3. ImageId 格式错误
4. 网络请求失败（CORS、服务器不可达）

**解决方案**:
1. 检查浏览器控制台错误信息
2. 确认 DICOM 服务器可访问
3. 验证 ImageId 格式正确
4. 查看 [故障排查文档](../../troubleshooting/common-errors.md)

### Q: 交互工具不工作？

**可能原因**:
1. 工具未添加到工具库
2. 工具未添加到 ToolGroup
3. 工具未设置为 Active
4. 视口未添加到 ToolGroup
5. 鼠标绑定未配置

**解决方案**:
1. 确认 `addTool()` 已调用
2. 确认工具已添加到 ToolGroup
3. 确认 `setToolActive()` 已调用，并且包含了正确的绑定配置
4. 确认视口已添加到 ToolGroup
5. **特别对于换层功能**：必须配置 `MouseBindings.Wheel` 绑定

### Q: 滚轮无法切换影像层？

**这是最常见的问题！**

**错误原因**：
```typescript
// ❌ 错误配置 - 缺少滚轮绑定
toolGroup.setToolActive(StackScrollTool.toolName);
```

**正确配置**：
```typescript
// ✅ 正确配置 - 必须包含 Wheel 绑定
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [
    {
      mouseButton: ToolsEnums.MouseBindings.Wheel,
    },
  ],
});
```

**验证步骤**：
1. 打开浏览器控制台
2. 检查是否有 "交互工具已设置完成" 消息
3. 确认没有错误或警告信息
4. 在有多张影像的情况下测试滚轮功能

**参考**：
- 查看 [基本交互文档](../../getting-started/basic-interactions.md) 了解工具系统详解
- 查看 [viewport.ts](src/cornerstone/viewport.ts) 查看完整的工具配置示例

### Q: TypeScript 类型错误？

**可能原因**:
1. 类型定义文件缺失
2. @types 包未安装
3. tsconfig.json 配置不正确

**解决方案**:
1. 运行 `yarn install` 确保所有依赖已安装
2. 检查 `src/types/index.d.ts` 文件
3. 运行 `yarn type-check` 检查类型错误

**解决方案**:
1. 修改 `vite.config.ts` 中的端口配置
2. 删除 `node_modules` 和 `yarn.lock`，重新运行 `yarn install`
3. 确认 Node.js 版本为 20 或更高

### Q: 滚轮无法切换影像层？

**这是最常见的问题！**

请查看：[常见陷阱和解决方案](../../troubleshooting/common-pitfalls.md) 了解详情。

**快速修复**：
```typescript
// ❌ 错误配置
toolGroup.setToolActive(StackScrollTool.toolName);

// ✅ 正确配置
toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [
    {
      mouseButton: ToolsEnums.MouseBindings.Wheel,
    },
  ],
});
```

**其他常见陷阱**：
- 工具名称错误：使用 `StackScrollTool` 而不是 `StackScrollMouseWheelTool`
- 枚举导入错误：使用 `ToolsEnums.MouseBindings` 而不是 `Enums.Events.MouseBindings`
- 视口未添加到工具组

**学习建议**：
- 阅读 [基本交互文档](../../getting-started/basic-interactions.md)
- 查看 [viewport.ts](src/cornerstone/viewport.ts) 完整的配置示例

## 扩展建议

完成本示例后，您可以尝试以下扩展：

### 1. 添加更多工具

- **测量工具**: 距离、角度、面积测量
- **标注工具**: ROI 标注、箭头标注
- **裁剪工具**: 矩形裁剪、多边形裁剪

**参考**: [高级功能 - 标注工具](../../advanced/annotations.md)

### 2. 支持多种影像类型

- **VolumeViewport**: 3D 体渲染
- **多视口同步**: 同时显示多个影像
- **融合显示**: PET-CT 融合等

**参考**: [高级功能 - 3D 体渲染](../../advanced/volume-rendering.md)

### 3. 优化性能

- **缓存配置**: 优化 imageCache、volumeCache
- **懒加载**: 按需加载影像数据
- **Web Worker**: 在 Worker 中处理计算密集型任务

**参考**: [高级功能 - 性能优化](../../advanced/performance-optimization.md)

### 4. 添加 UI 控件

- **工具栏**: 切换工具、调整参数
- **影像列表**: 显示当前加载的影像
- **窗宽窗位预设**: 快速切换不同的窗宽窗位

**参考**: [框架集成指南 - React](../../getting-started/framework-integration.md#react-集成)

## 相关资源

### 官方文档

- [Cornerstone3D 官方网站](https://www.cornerstonejs.org/)
- [API 文档](https://www.cornerstonejs.org/docs/api)
- [GitHub 仓库](https://github.com/cornerstonejs/cornerstone3D)

### 指南文档

- [项目初始化](../../getting-started/project-setup.md)
- [Cornerstone3D 初始化](../../getting-started/initialization.md)
- [第一个影像查看器](../../getting-started/first-viewer.md)
- [基本交互](../../getting-started/basic-interactions.md)

### 示例项目

- [Cornerstone3D 官方示例](https://github.com/cornerstonejs/cornerstone3D/tree/main/examples)
- [OHIF Viewer](https://github.com/OHIF/OHIF-Viewers)

## 贡献指南

欢迎贡献您的改进建议和代码！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/my-improvement`
3. 提交更改：`git commit -m 'feat: 添加 XYZ 功能'`
4. 推送到分支：`git push origin feature/my-improvement`
5. 创建 Pull Request

请确保：
- 代码通过 TypeScript 类型检查
- 代码符合 Prettier 格式规范
- 添加了必要的注释和文档

## 许可证

本示例代码遵循与 Cornerstone3D 主项目相同的许可证。

---

**准备好了吗？开始探索 Cornerstone3D 的世界吧！** 🚀

**推荐学习路径**:
1. 运行本示例 → 理解基础流程
2. 阅读 [第一个影像查看器](../../getting-started/first-viewer.md) → 深入理解概念
3. 阅读 [基本交互](../../getting-started/basic-interactions.md) → 学习工具系统
4. 尝试 [高级查看器示例](../advanced-viewer/) → 探索高级功能
