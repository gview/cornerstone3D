import { RenderingEngine, Enums, type IVolumeViewport } from '@cornerstonejs/core';
import {
  addTool,
  ToolGroupManager,
  PanTool,
  ZoomTool,
  WindowLevelTool,
  StackScrollTool,
  ToolGroup,
  Enums as ToolsEnums,
} from '@cornerstonejs/tools';

/**
 * 创建并配置 StackViewport
 *
 * @param renderingEngine - RenderingEngine 实例
 * @param element - DOM 元素
 * @returns Viewport ID
 *
 * @example
 * ```typescript
 * import { RenderingEngine } from '@cornerstonejs/core';
 *
 * const engine = new RenderingEngine('my-engine');
 * const viewportId = createViewport(engine, document.getElementById('viewport')!);
 * ```
 */
export function createViewport(
  renderingEngine: RenderingEngine,
  element: HTMLElement
): string {
  const viewportId = 'basic-viewer-viewport';

  // 定义视口输入参数
  const viewportInput = {
    viewportId,
    element,
    type: Enums.ViewportType.STACK, // 使用 STACK 类型的视口（2D 影像序列）
  };

  // 启用视口
  // enableElement() 会创建 WebGL 上下文并初始化视口
  renderingEngine.enableElement(viewportInput);

  console.log(`✅ Viewport "${viewportId}" 已创建`);

  return viewportId;
}

/**
 * 设置交互工具
 *
 * 这个函数执行以下操作：
 * 1. 添加工具到工具库
 * 2. 创建工具组
 * 3. 将工具添加到工具组
 * 4. 将视口添加到工具组
 * 5. 激活工具并配置鼠标绑定
 *
 * @param renderingEngine - RenderingEngine 实例
 * @param viewportId - Viewport ID
 *
 * @example
 * ```typescript
 * import { RenderingEngine } from '@cornerstonejs/core';
 *
 * const engine = new RenderingEngine('my-engine');
 * setupTools(engine, 'my-viewport');
 * ```
 */
export function setupTools(
  renderingEngine: RenderingEngine,
  viewportId: string = 'basic-viewer-viewport'
): void {
  // 1. 添加工具到工具库
  // addTool() 将工具类注册到 Cornerstone3D 的工具系统中
  // 注意：如果工具已经注册，addTool 会抛出警告，但不会中断执行
  try {
    addTool(PanTool);
    addTool(ZoomTool);
    addTool(WindowLevelTool);
    addTool(StackScrollTool);
  } catch (error) {
    // 工具已经注册，忽略错误
    console.debug('工具已经注册，跳过注册步骤');
  }

  // 2. 创建工具组
  // ToolGroup 用于管理一组工具和它们的激活状态
  const toolGroupId = 'basic-tool-group';
  let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

  if (!toolGroup) {
    toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
  }

  if (!toolGroup) {
    throw new Error(`无法创建工具组: ${toolGroupId}`);
  }

  // 3. 将工具添加到工具组
  // 检查工具是否已经在工具组中，避免重复添加
  const toolsToAdd = [
    PanTool.toolName,
    ZoomTool.toolName,
    WindowLevelTool.toolName,
    StackScrollTool.toolName,
  ];

  toolsToAdd.forEach((toolName) => {
    if (!toolGroup.hasTool(toolName)) {
      toolGroup.addTool(toolName);
    }
  });

  // 4. 将视口添加到工具组
  // 这样工具组中的工具就可以在这个视口上工作了
  // 检查视口是否已经添加到工具组
  const toolGroupViewportIds = toolGroup.getViewportIds();
  const viewportAlreadyAdded = toolGroupViewportIds.includes(viewportId);

  if (!viewportAlreadyAdded) {
    toolGroup.addViewport(viewportId, renderingEngine.id);
  }

  // 5. 激活工具并配置鼠标绑定
  // 鼠标按钮绑定：
  // - Primary: 左键
  // - Auxiliary: 中键
  // - Secondary: 右键

  // 窗宽窗位工具：左键拖拽
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
  });

  // 平移工具：中键拖拽
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Auxiliary }],
  });

  // 缩放工具：右键拖拽
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: ToolsEnums.MouseBindings.Secondary }],
  });

  // 滚动工具：使用滚轮换层
  // StackScrollTool 需要明确配置滚轮绑定才能响应滚轮事件
  // 这是关键配置 - MouseBindings.Wheel 是必需的！
  toolGroup.setToolActive(StackScrollTool.toolName, {
    bindings: [
      {
        mouseButton: ToolsEnums.MouseBindings.Wheel,
      },
    ],
  });

  console.log('✅ 交互工具已设置完成');
  console.log('💡 提示：');
  console.log('  - 鼠标滚轮：在影像层之间切换（换层）');
  console.log('  - 左键拖拽：调整窗宽窗位');
  console.log('  - 中键拖拽：平移影像');
  console.log('  - 右键拖拽：缩放影像');

  // 调试：输出工具组信息
  console.log('🔧 工具组配置：');
  console.log('  - 工具组ID:', toolGroup.id);
  console.log('  - 视口列表:', toolGroup.getViewportIds());
}

/**
 * 加载 DICOM 影像到视口
 *
 * @param renderingEngine - RenderingEngine 实例
 * @param viewportId - Viewport ID
 * @param imageIds - Image ID 列表
 * @param currentIndex - 当前显示的影像索引（默认为 0）
 *
 * @example
 * ```typescript
 * const imageIds = [
 *   'wadors:https://example.com/image1.dcm',
 *   'wadors:https://example.com/image2.dcm',
 * ];
 * await loadImage(renderingEngine, 'my-viewport', imageIds, 0);
 * ```
 */
export async function loadImage(
  renderingEngine: RenderingEngine,
  viewportId: string,
  imageIds: string[],
  currentIndex: number = 0
): Promise<void> {
  // 获取 Viewport 实例
  const viewport = renderingEngine.getStackViewport(viewportId);

  if (!viewport) {
    throw new Error(`Viewport "${viewportId}" 未找到`);
  }

  // 设置影像栈
  // setStack() 会：
  // 1. 缓存影像元数据
  // 2. 预加载第一张影像
  // 3. 设置当前影像索引
  await viewport.setStack(imageIds, currentIndex);

  // 渲染视口
  // render() 会触发影像的重新渲染
  viewport.render();

  console.log(`✅ 影像加载成功：共 ${imageIds.length} 张`);
  console.log(`📊 当前影像索引：${currentIndex} / ${imageIds.length - 1}`);
}

/**
 * 销毁视口
 *
 * @param renderingEngine - RenderingEngine 实例
 * @param viewportId - Viewport ID
 *
 * @example
 * ```typescript
 * destroyViewport(renderingEngine, 'my-viewport');
 * ```
 */
export function destroyViewport(
  renderingEngine: RenderingEngine,
  viewportId: string
): void {
  try {
    // 获取 Viewport 实例
    const viewport = renderingEngine.getStackViewport(viewportId);

    if (viewport) {
      // 清理视口资源
      // 这会释放 WebGL 相关的资源
      // 注意：通常不需要手动调用，RenderingEngine.destroy() 会自动清理所有视口
      console.log(`✅ Viewport "${viewportId}" 已销毁`);
    }
  } catch (error) {
    console.error(`❌ 销毁 Viewport "${viewportId}" 失败:`, error);
  }
}

/**
 * 导出工具组管理相关的类型
 */
export type { ToolGroup } from '@cornerstonejs/tools';
