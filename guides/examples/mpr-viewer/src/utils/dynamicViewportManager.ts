import { RenderingEngine, Enums, Types, setVolumesForViewports } from '@cornerstonejs/core';

export interface ViewportConfig {
  viewportId: string;
  element?: HTMLElement;
  type: Enums.ViewportType;
  orientation?: Enums.OrientationAxis;
  defaultOptions?: any;
}

export interface ViewportState {
  viewportId: string;
  camera?: any;
  voiRange?: { upper: number; lower: number };
  orientation?: Enums.OrientationAxis;
}

export interface DualSequenceConfig {
  volumeId1: string;
  volumeId2: string;
}

export interface ViewportEventHandlers {
  onViewportClick?: (viewportId: string) => void;
  onViewportDoubleClick?: (viewportId: string) => void;
  getActiveViewportId?: () => string;
}

/**
 * 动态视口管理器
 * 负责创建、销毁、管理视口
 */
class DynamicViewportManager {
  private renderingEngine: RenderingEngine | null = null;
  private containerElement: HTMLElement | null = null;
  private viewportElements: Map<string, HTMLElement> = new Map();
  private viewportStates: Map<string, ViewportState> = new Map();
  private eventHandlers: ViewportEventHandlers = {};

  /**
   * 初始化管理器
   */
  initialize(renderingEngine: RenderingEngine, containerElement: HTMLElement, eventHandlers?: ViewportEventHandlers): void {
    this.renderingEngine = renderingEngine;
    this.containerElement = containerElement;
    if (eventHandlers) {
      this.eventHandlers = eventHandlers;
    }
  }

  /**
   * 保存视口状态
   */
  saveViewportStates(viewportIds: string[]): void {
    if (!this.renderingEngine) return;

    viewportIds.forEach(viewportId => {
      try {
        const viewport = this.renderingEngine.getViewport(viewportId);
        if (viewport) {
          const camera = (viewport as Types.IVolumeViewport).getCamera();
          const properties = (viewport as Types.IVolumeViewport).getProperties();

          // 获取当前视口的方向
          const orientation = (viewport as Types.IVolumeViewport).getProperties().orientation;

          this.viewportStates.set(viewportId, {
            viewportId,
            camera: camera ? { ...camera } : undefined,
            voiRange: properties.voiRange,
            orientation: orientation as Enums.OrientationAxis,
          });
        }
      } catch (error) {
        console.warn(`Failed to save state for viewport ${viewportId}:`, error);
      }
    });
  }

  /**
   * 恢复视口状态
   */
  restoreViewportStates(viewportIds: string[]): void {
    if (!this.renderingEngine) return;

    viewportIds.forEach((viewportId, index) => {
      // 尝试从保存的状态中恢复，如果找不到则尝试从对应索引的旧视口恢复
      let state = this.viewportStates.get(viewportId);

      // 如果当前视口没有保存的状态，尝试从对应索引的旧视口获取
      if (!state) {
        const oldViewportIds = Array.from(this.viewportStates.keys());
        if (index < oldViewportIds.length) {
          state = this.viewportStates.get(oldViewportIds[index]);
        }
      }

      if (!state) return;

      try {
        const viewport = this.renderingEngine.getViewport(viewportId);
        if (!viewport) return;

        // 先设置方向（如果保存了的话）
        if (state.orientation) {
          try {
            (viewport as Types.IVolumeViewport).setProperties({ orientation: state.orientation });
          } catch (error) {
            // 某些视口可能不支持设置 orientation，忽略错误
          }
        }

        // 然后设置相机
        if (state.camera) {
          (viewport as Types.IVolumeViewport).setCamera(state.camera);
        }
        // 最后设置窗宽窗位
        if (state.voiRange) {
          (viewport as Types.IVolumeViewport).setProperties({ voiRange: state.voiRange });
        }
      } catch (error) {
        console.warn(`Failed to restore state for viewport ${viewportId}:`, error);
      }
    });
  }

  /**
   * 更新视口激活状态
   * @param activeViewportId 激活的视口ID
   */
  updateActiveViewport(activeViewportId: string): void {
    if (!this.containerElement) return;

    // 获取所有视口容器
    const viewportContainers = Array.from(this.containerElement.children).filter(
      child => child.classList.contains('viewport-container')
    );

    viewportContainers.forEach((container) => {
      // 查找该容器对应的视口元素
      const viewportElement = container.querySelector('.viewport-element');
      if (viewportElement) {
        const viewportId = viewportElement.id;
        if (viewportId === activeViewportId) {
          container.classList.add('active');
        } else {
          container.classList.remove('active');
        }
      }
    });
  }

  /**
   * 清空视口容器
   */
  clearContainer(): void {
    if (!this.containerElement) return;

    // 🔧 关键修复：移除所有视口容器元素（而不是 viewportElements 本身）
    // viewportElements 是 viewportContainer 内部的子元素
    const viewportContainers = Array.from(this.containerElement.children).filter(
      child => child.classList.contains('viewport-container')
    );

    viewportContainers.forEach((container) => {
      if (container.parentNode === this.containerElement) {
        this.containerElement!.removeChild(container);
      }
    });

    this.viewportElements.clear();
  }

  /**
   * 创建网格布局的视口 DOM
   */
  createGridLayout(rows: number, cols: number, viewportIds: string[]): void {
    if (!this.containerElement) {
      throw new Error('Container element not initialized');
    }

    // 清空现有视口
    this.clearContainer();

    // 🔧 关键修复：直接使用父容器的网格布局，而不是创建嵌套的网格容器
    // 设置父容器的网格样式
    this.containerElement.style.display = 'grid';
    this.containerElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.containerElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    this.containerElement.style.gap = '2px';
    this.containerElement.style.width = '100%';
    this.containerElement.style.height = '100%';

    console.log('🔧 设置父容器网格样式:', {
      rows,
      cols,
      gridTemplateColumns: this.containerElement.style.gridTemplateColumns,
      gridTemplateRows: this.containerElement.style.gridTemplateRows,
    });

    // 创建视口元素
    viewportIds.forEach((viewportId, index) => {
      const viewportContainer = document.createElement('div');
      viewportContainer.className = 'viewport-container';

      // 🔧 检查是否是激活的视口并添加 active 类
      const activeViewportId = this.eventHandlers.getActiveViewportId?.();
      const isActive = viewportId === activeViewportId;
      if (isActive) {
        viewportContainer.classList.add('active');
      }

      viewportContainer.style.cssText = `
        position: relative;
        background: #000;
        overflow: hidden;
        min-height: 200px;
        min-width: 200px;
      `;

      // 视口标签
      const label = document.createElement('div');
      label.className = 'viewport-label';
      label.textContent = this.getViewportLabel(viewportId, index, rows, cols);
      label.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10;
        pointer-events: none;
      `;

      // 视口元素
      const viewportElement = document.createElement('div');
      viewportElement.className = 'viewport-element';
      viewportElement.id = viewportId;
      viewportElement.style.cssText = `
        width: 100%;
        height: 100%;
      `;

      viewportContainer.appendChild(label);
      viewportContainer.appendChild(viewportElement);

      // 创建信息覆盖层容器
      const infoOverlay = document.createElement('div');
      infoOverlay.className = 'viewport-info-overlay';
      infoOverlay.style.cssText = `
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-family: monospace;
        z-index: 10;
        pointer-events: none;
        text-align: right;
      `;
      infoOverlay.id = `${viewportId}-info`;
      infoOverlay.innerHTML = `
        <div class="image-info">Image: 1 / 1</div>
        <div class="window-info">W/L: 40 / 400</div>
      `;

      viewportContainer.appendChild(infoOverlay);

      // 🔧 添加点击事件处理器
      viewportContainer.addEventListener('click', (e) => {
        // 防止事件冒泡到父容器
        e.stopPropagation();
        if (this.eventHandlers.onViewportClick) {
          this.eventHandlers.onViewportClick(viewportId);
        }
      });

      // 🔧 添加双击事件处理器
      viewportContainer.addEventListener('dblclick', (e) => {
        // 防止事件冒泡到父容器
        e.stopPropagation();
        if (this.eventHandlers.onViewportDoubleClick) {
          this.eventHandlers.onViewportDoubleClick(viewportId);
        }
      });

      // 🔧 关键修复：直接将视口容器添加到父容器，而不是创建嵌套的 gridContainer
      this.containerElement.appendChild(viewportContainer);

      // 保存引用
      this.viewportElements.set(viewportId, viewportElement);

      console.log(`  ✓ 视口容器 ${viewportId} 已添加到父容器，尺寸:`, {
        offsetWidth: viewportContainer.offsetWidth,
        offsetHeight: viewportContainer.offsetHeight,
      });
    });

    console.log('✓ 所有视口容器已添加，父容器子元素数量:', this.containerElement.children.length);

    // 等待一帧后检查尺寸
    requestAnimationFrame(() => {
      console.log('🔧 布局完成后检查视口尺寸:');
      viewportIds.forEach((viewportId) => {
        const element = this.viewportElements.get(viewportId);
        if (element) {
          console.log(`  ${viewportId}:`, {
            width: element.offsetWidth,
            height: element.offsetHeight,
            parentWidth: element.parentElement?.offsetWidth,
            parentHeight: element.parentElement?.offsetHeight,
          });
        }
      });
    });
  }

  /**
   * 获取视口标签
   */
  private getViewportLabel(viewportId: string, index: number, rows: number, _cols: number): string {
    // 双序列 MPR 布局特殊处理 (2行3列)
    if (rows === 2 && _cols === 3) {
      const sequenceNum = index < 3 ? 'Seq 1' : 'Seq 2';
      const orientation = ['Axial', 'Sagittal', 'Coronal'][index % 3];
      return `${sequenceNum} - ${orientation}`;
    }

    // 如果视口ID是已知的方位,返回方位名称
    const orientationMap: Record<string, string> = {
      AXIAL: 'Axial',
      SAGITTAL: 'Sagittal',
      CORONAL: 'Coronal',
    };

    if (orientationMap[viewportId]) {
      return orientationMap[viewportId];
    }

    // 否则返回序号
    return `Viewport ${index + 1}`;
  }

  /**
   * 应用网格布局
   */
  async applyGridLayout(
    rows: number,
    cols: number,
    volumeId: string,
    currentViewportIds: string[]
  ): Promise<string[]> {
    if (!this.renderingEngine) {
      throw new Error('Rendering engine not initialized');
    }

    // 生成新的视口 ID
    const newViewportIds: string[] = [];
    for (let i = 0; i < rows * cols; i++) {
      newViewportIds.push(`viewport-${Date.now()}-${i}`);
    }

    // 保存当前视口状态
    this.saveViewportStates(currentViewportIds);

    // 创建新的视口 DOM
    this.createGridLayout(rows, cols, newViewportIds);

    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 100));

    // 禁用旧视口
    currentViewportIds.forEach(viewportId => {
      try {
        const viewport = this.renderingEngine.getViewport(viewportId);
        if (viewport) {
          this.renderingEngine.disableViewport(viewportId);
        }
      } catch (error) {
        // 忽略错误
      }
    });

    // 定义不同视口索引对应的默认方向
    const getDefaultOrientation = (index: number): Enums.OrientationAxis => {
      switch (index % 3) {
        case 0: return Enums.OrientationAxis.AXIAL;
        case 1: return Enums.OrientationAxis.SAGITTAL;
        case 2: return Enums.OrientationAxis.CORONAL;
        default: return Enums.OrientationAxis.AXIAL;
      }
    };

    // 创建视口输入配置
    const viewportInputs = newViewportIds.map((viewportId, index) => {
      // 尝试保持原有视口的方向，否则使用默认方向
      let orientation = getDefaultOrientation(index);
      if (index < currentViewportIds.length) {
        const oldViewportId = currentViewportIds[index];
        const oldState = this.viewportStates.get(oldViewportId);
        if (oldState?.orientation) {
          orientation = oldState.orientation;
        }
      }

      return {
        viewportId,
        element: this.viewportElements.get(viewportId)!,
        type: Enums.ViewportType.ORTHOGRAPHIC,
        defaultOptions: {
          orientation,
          background: [0, 0, 0] as Types.Point3,
        },
      };
    });

    // 设置视口
    this.renderingEngine.setViewports(viewportInputs);

    // 🔧 关键修复: 等待视口完全初始化后再设置 volume
    // 这可以避免 WebGL shader 错误和 NaN 坐标问题
    await new Promise(resolve => setTimeout(resolve, 50));

    // 设置 volume 数据 (使用 immediateRender: false 避免过早渲染)
    await setVolumesForViewports(
      this.renderingEngine,
      [{ volumeId }],
      newViewportIds,
      { immediateRender: false }
    );

    // 恢复状态 (在 volume 设置后)
    this.restoreViewportStates(newViewportIds);

    // 等待相机初始化完成
    await new Promise(resolve => setTimeout(resolve, 50));

    // 渲染 (现在相机和 volume 都已就绪)
    this.renderingEngine.renderViewports(newViewportIds);

    return newViewportIds;
  }

  /**
   * 应用 MPR 协议布局 (三视图)
   */
  async applyMPRLayout(volumeId: string, currentViewportIds: string[]): Promise<string[]> {
    return this.applyGridLayout(1, 3, volumeId, currentViewportIds);
  }

  /**
   * 应用双序列 MPR 布局
   * 第一行：序列1的三个MPR视图（Axial, Sagittal, Coronal）
   * 第二行：序列2的三个MPR视图（Axial, Sagittal, Coronal）
   */
  async applyDualSequenceMPRLayout(
    config: DualSequenceConfig,
    currentViewportIds: string[]
  ): Promise<string[]> {
    console.log('🔧 开始应用双序列 MPR 布局');
    console.log('  volumeId1:', config.volumeId1);
    console.log('  volumeId2:', config.volumeId2);
    console.log('  当前视口 IDs:', currentViewportIds);

    if (!this.renderingEngine) {
      throw new Error('Rendering engine not initialized');
    }

    const { volumeId1, volumeId2 } = config;

    // 生成6个新的视口ID
    const newViewportIds: string[] = [];
    for (let i = 0; i < 6; i++) {
      newViewportIds.push(`viewport-${Date.now()}-${i}`);
    }

    console.log('  新视口 IDs:', newViewportIds);

    // 保存当前视口状态
    this.saveViewportStates(currentViewportIds);

    // 创建2行3列的网格布局
    this.createGridLayout(2, 3, newViewportIds);

    console.log('  ✓ 网格布局已创建');
    console.log('  容器元素数量:', this.containerElement?.children.length);

    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 100));

    // 禁用旧视口
    currentViewportIds.forEach(viewportId => {
      try {
        const viewport = this.renderingEngine.getViewport(viewportId);
        if (viewport) {
          this.renderingEngine.disableViewport(viewportId);
        }
      } catch (error) {
        // 忽略错误
      }
    });

    // 定义双序列MPR的方向配置
    // 第一行 (索引 0-2): 序列1 - Axial, Sagittal, Coronal
    // 第二行 (索引 3-5): 序列2 - Axial, Sagittal, Coronal
    const getDualSequenceOrientation = (index: number): Enums.OrientationAxis => {
      switch (index % 3) {
        case 0: return Enums.OrientationAxis.AXIAL;
        case 1: return Enums.OrientationAxis.SAGITTAL;
        case 2: return Enums.OrientationAxis.CORONAL;
        default: return Enums.OrientationAxis.AXIAL;
      }
    };

    // 创建视口输入配置
    const viewportInputs = newViewportIds.map((viewportId, index) => {
      const orientation = getDualSequenceOrientation(index);
      const element = this.viewportElements.get(viewportId);
      console.log(`  视口 ${viewportId}:`, {
        orientation,
        hasElement: !!element,
        elementId: element?.id
      });

      return {
        viewportId,
        element: element!,
        type: Enums.ViewportType.ORTHOGRAPHIC,
        defaultOptions: {
          orientation,
          background: [0, 0, 0] as Types.Point3,
        },
      };
    });

    // 设置视口
    this.renderingEngine.setViewports(viewportInputs);
    console.log('  ✓ 视口已设置到渲染引擎');

    // 等待视口完全初始化
    await new Promise(resolve => setTimeout(resolve, 50));

    // 为第一行视口设置序列1的数据
    const row1Viewports = newViewportIds.slice(0, 3);
    console.log('  设置序列1数据到视口:', row1Viewports, 'volumeId:', volumeId1);
    await setVolumesForViewports(
      this.renderingEngine,
      [{ volumeId: volumeId1 }],
      row1Viewports,
      { immediateRender: false }
    );
    console.log('  ✓ 序列1数据已设置');

    // 为第二行视口设置序列2的数据
    const row2Viewports = newViewportIds.slice(3, 6);
    console.log('  设置序列2数据到视口:', row2Viewports, 'volumeId:', volumeId2);
    await setVolumesForViewports(
      this.renderingEngine,
      [{ volumeId: volumeId2 }],
      row2Viewports,
      { immediateRender: false }
    );
    console.log('  ✓ 序列2数据已设置');

    // 恢复状态（在volume设置后）
    this.restoreViewportStates(newViewportIds);

    // 等待相机初始化完成
    await new Promise(resolve => setTimeout(resolve, 50));

    // 渲染所有视口
    console.log('  渲染所有视口...');
    this.renderingEngine.renderViewports(newViewportIds);
    console.log('  ✓ 视口已渲染');

    console.log('✅ 双序列 MPR 布局应用完成！');
    return newViewportIds;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.clearContainer();
    this.viewportElements.clear();
    this.viewportStates.clear();
    this.renderingEngine = null;
    this.containerElement = null;
  }
}

// 导出单例
export const dynamicViewportManager = new DynamicViewportManager();
