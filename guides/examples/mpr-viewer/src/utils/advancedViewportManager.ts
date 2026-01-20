import { RenderingEngine, Types, Enums } from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';

export interface AdvancedViewportConfig {
  viewportId: string;
  element: HTMLElement;
  seriesUID: string | null;
  imageIds: string[];
  currentImageIndex: number;
  viewportType: 'stack' | 'volume';
  renderingEngine?: RenderingEngine;
}

export class AdvancedViewportManager {
  private viewports: Map<string, AdvancedViewportConfig> = new Map();
  private renderingEngineId = 'advancedViewportsEngine';
  private renderingEngine: RenderingEngine | null = null;

  /**
   * 初始化 Advanced 布局的渲染引擎
   */
  initializeRenderingEngine(): RenderingEngine {
    if (this.renderingEngine) {
      return this.renderingEngine;
    }

    const renderingEngine = new RenderingEngine(this.renderingEngineId);
    this.renderingEngine = renderingEngine;
    return renderingEngine;
  }

  /**
   * 创建或更新 Stack Viewport
   */
  createOrUpdateStackViewport(
    viewportId: string,
    element: HTMLElement,
    imageIds: string[]
  ): void {
    if (!this.renderingEngine) {
      this.renderingEngine = this.initializeRenderingEngine();
    }

    const viewportInput: Types.PublicViewportInput = {
      viewportId,
      element,
      type: Enums.ViewportType.STACK,
      defaultOptions: {
        // Stack Viewport 不使用 background 配置
        // 背景色通过 CSS 设置
      },
    };

    // 启用视口
    this.renderingEngine.enableElement(viewportInput);

    // 获取视口并设置图像
    const viewport = this.renderingEngine.getViewport(viewportId) as Types.IStackViewport;

    if (imageIds.length > 0) {
      viewport.setStack(imageIds, 0);
      this.renderingEngine.renderViewports([viewportId]);
    }

    // 保存配置
    this.viewports.set(viewportId, {
      viewportId,
      element,
      seriesUID: null,
      imageIds,
      currentImageIndex: 0,
      viewportType: 'stack',
      renderingEngine: this.renderingEngine,
    });

    console.log(`✅ 创建 Stack Viewport: ${viewportId}, 图像数: ${imageIds.length}`);
  }

  /**
   * 销毁指定视口
   */
  destroyViewport(viewportId: string): void {
    const config = this.viewports.get(viewportId);
    if (!config) {
      return;
    }

    if (this.renderingEngine) {
      try {
        this.renderingEngine.disableElement(viewportId);
      } catch (error) {
        console.warn(`⚠️ 禁用视口失败: ${viewportId}`, error);
      }
    }

    this.viewports.delete(viewportId);
    console.log(`✅ 销毁视口: ${viewportId}`);
  }

  /**
   * 销毁所有视口
   */
  destroyAllViewports(): void {
    this.viewports.forEach((_, viewportId) => {
      this.destroyViewport(viewportId);
    });

    if (this.renderingEngine) {
      try {
        this.renderingEngine.destroy();
        this.renderingEngine = null;
      } catch (error) {
        console.warn('⚠️ 销毁渲染引擎失败', error);
      }
    }
  }

  /**
   * 更新视口的图像序列
   */
  updateViewportStack(viewportId: string, imageIds: string[]): void {
    const config = this.viewports.get(viewportId);
    if (!config || !this.renderingEngine) {
      console.warn(`⚠️ 视口不存在或渲染引擎未初始化: ${viewportId}`);
      return;
    }

    const viewport = this.renderingEngine.getViewport(viewportId) as Types.IStackViewport;

    if (imageIds.length > 0) {
      viewport.setStack(imageIds, 0);
      config.imageIds = imageIds;
      config.currentImageIndex = 0;

      this.renderingEngine.renderViewports([viewportId]);
      console.log(`✅ 更新视口 ${viewportId} 的图像序列, 图像数: ${imageIds.length}`);
    }
  }

  /**
   * 设置视口的当前图像索引
   */
  setViewportImageIndex(viewportId: string, imageIndex: number): void {
    const config = this.viewports.get(viewportId);
    if (!config || !this.renderingEngine) {
      return;
    }

    const viewport = this.renderingEngine.getViewport(viewportId) as Types.IStackViewport;

    if (imageIndex >= 0 && imageIndex < config.imageIds.length) {
      viewport.setCurrentImageIndex(imageIndex);
      config.currentImageIndex = imageIndex;
      this.renderingEngine.renderViewports([viewportId]);
    }
  }

  /**
   * 获取视口配置
   */
  getViewportConfig(viewportId: string): AdvancedViewportConfig | undefined {
    return this.viewports.get(viewportId);
  }

  /**
   * 获取所有视口配置
   */
  getAllViewportConfigs(): Map<string, AdvancedViewportConfig> {
    return this.viewports;
  }

  /**
   * 获取渲染引擎
   */
  getRenderingEngine(): RenderingEngine | null {
    return this.renderingEngine;
  }

  /**
   * 调整视口大小
   */
  resizeViewports(viewportIds?: string[]): void {
    if (!this.renderingEngine) {
      return;
    }

    const idsToResize = viewportIds || Array.from(this.viewports.keys());
    this.renderingEngine.resize(true, false);
    this.renderingEngine.renderViewports(idsToResize);
  }
}

// 单例实例
let advancedViewportManagerInstance: AdvancedViewportManager | null = null;

export function getAdvancedViewportManager(): AdvancedViewportManager {
  if (!advancedViewportManagerInstance) {
    advancedViewportManagerInstance = new AdvancedViewportManager();
  }
  return advancedViewportManagerInstance;
}

export function destroyAdvancedViewportManager(): void {
  if (advancedViewportManagerInstance) {
    advancedViewportManagerInstance.destroyAllViewports();
    advancedViewportManagerInstance = null;
  }
}
