import { useRef, useCallback } from 'react';
import { RenderingEngine, Enums, getEnabledElement } from '@cornerstonejs/core';
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
   * 设置联动导航
   * 监听每个视口的相机变化事件，同步到其他视口
   */
  const setupLinkedNavigation = useCallback(() => {
    const renderingEngine = getEnabledElement(renderingEngineId) as RenderingEngine;
    if (!renderingEngine) {
      console.error('Rendering engine not found');
      return;
    }

    viewportIds.forEach((viewportId) => {
      const enabledElement = getEnabledElement(viewportId);
      if (!enabledElement) return;

      const { viewport } = enabledElement;

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
          syncToOtherViewports(renderingEngine, viewportId, currentFocalPoint);

          // 更新定位线（定位线组件会监听相机变化事件）
          updateReferenceLines(viewportId);

          // 保存当前焦点位置
          previousFocalPoints.current[viewportId] = { ...currentFocalPoint };
        }
      };

      // 添加事件监听器
      enabledElement.addEventListener(Enums.Events.CAMERA_MODIFIED, cameraModifiedHandler);
      eventListeners.current.push({
        element: enabledElement,
        handler: cameraModifiedHandler,
      });
    });
  }, [viewportIds, renderingEngineId]);

  /**
   * 同步到其他视口
   */
  const syncToOtherViewports = useCallback(
    (renderingEngine: RenderingEngine, sourceViewportId: string, focalPoint: any) => {
      const viewports = renderingEngine.getViewports();

      viewports.forEach((viewport) => {
        if ((viewport as any).id !== sourceViewportId) {
          const camera = (viewport as IViewport).getCamera();
          camera.focalPoint = focalPoint;
          (viewport as IViewport).setCamera(camera);
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
