import { useRef, useCallback } from 'react';
import { RenderingEngine, Enums } from '@cornerstonejs/core';
import type { IViewport } from '@cornerstonejs/core/types';

/**
 * MPR 联动同步 Hook
 * 处理三个视口之间的相机位置同步和定位线更新
 */
interface UseMPRSynchronizationOptions {
  viewportIds: string[];
  renderingEngineId: string;
}

export function useMPRSynchronization(options: UseMPRSynchronizationOptions) {
  const { viewportIds, renderingEngineId } = options;
  const previousFocalPoints = useRef<Record<string, any>>({});
  const eventListeners = useRef<Array<{ element: any; handler: any }>>([]);

  /**
   * 同步到其他视口
   * 使用 suppressEvents 防止触发 CAMERA_MODIFIED 事件,避免无限循环
   */
  const syncToOtherViewports = useCallback(
    (renderingEngine: RenderingEngine, sourceViewportId: string, focalPoint: any) => {
      const viewports = renderingEngine.getViewports();

      viewports.forEach((viewport) => {
        if ((viewport as any).id !== sourceViewportId) {
          const camera = (viewport as IViewport).getCamera();
          camera.focalPoint = focalPoint;
          // 使用 suppressEvents 选项防止触发事件,避免无限循环
          (viewport as IViewport).setCamera(camera, { suppressEvents: true });
          viewport.render();
        }
      });
    },
    []
  );

  /**
   * 更新定位线
   * 触发自定义事件，通知 ReferenceLines 组件更新
   */
  const updateReferenceLines = useCallback((activeViewportId: string) => {
    // 触发自定义事件，ReferenceLines 组件会监听此事件
    const event = new CustomEvent('referenceLinesUpdate', {
      detail: { activeViewportId },
    });
    window.dispatchEvent(event);
  }, []);

  /**
   * 设置联动导航
   * 监听每个视口的相机变化事件，同步到其他视口
   */
  const setupLinkedNavigation = useCallback((renderingEngine?: RenderingEngine) => {
    // 如果没有传入 renderingEngine，尝试获取它
    let engine = renderingEngine;

    // 等待一小段时间确保视口已完全初始化
    setTimeout(() => {
      if (!engine) {
        console.warn('⚠️ RenderingEngine 未传入，跳过联动导航设置');
        return;
      }

      viewportIds.forEach((viewportId) => {
        try {
          const viewport = engine.getViewport(viewportId);
          if (!viewport) {
            console.warn(`⚠️ 无法获取视口: ${viewportId}`);
            return;
          }

          // 监听相机变化事件
          const cameraModifiedHandler = () => {
            const camera = (viewport as IViewport).getCamera();
            const currentFocalPoint = camera.focalPoint;
            const previousFocalPoint = previousFocalPoints.current[viewportId];

            // 检查焦点位置是否实际改变
            if (
              !previousFocalPoint ||
              previousFocalPoint.x !== currentFocalPoint.x ||
              previousFocalPoint.y !== currentFocalPoint.y ||
              previousFocalPoint.z !== currentFocalPoint.z
            ) {
              // 同步到其他视口
              syncToOtherViewports(engine, viewportId, currentFocalPoint);

              // 更新定位线（定位线组件会监听相机变化事件）
              updateReferenceLines(viewportId);

              // 保存当前焦点位置
              previousFocalPoints.current[viewportId] = { ...currentFocalPoint };
            }
          };

          // 添加事件监听器到视口元素
          const element = (viewport as any).element;
          if (element) {
            element.addEventListener(Enums.Events.CAMERA_MODIFIED, cameraModifiedHandler);
            eventListeners.current.push({
              element,
              handler: cameraModifiedHandler,
            });
            console.log(`✅ 已为视口 ${viewportId} 设置联动导航`);
          }
        } catch (error) {
          console.error(`❌ 设置视口 ${viewportId} 联动导航失败:`, error);
        }
      });
    }, 100);
  }, [viewportIds, renderingEngineId, syncToOtherViewports, updateReferenceLines]);

  /**
   * 清理事件监听器
   */
  const cleanup = useCallback(() => {
    eventListeners.current.forEach(({ element, handler }) => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, handler);
    });
    eventListeners.current = [];
  }, []);

  return {
    setupLinkedNavigation,
    cleanup,
  };
}
