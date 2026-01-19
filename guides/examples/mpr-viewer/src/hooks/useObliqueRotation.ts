import { useCallback } from 'react';
import { mat4, vec3 } from 'gl-matrix';
import type { RenderingEngine } from '@cornerstonejs/core/types';
import type { IViewport } from '@cornerstonejs/core/types';

/**
 * MPR 斜位旋转 Hook
 * 处理视口的相机旋转，实现斜位 MPR
 */
interface UseObliqueRotationOptions {
  viewportIds: string[];
  renderingEngine: RenderingEngine | null;
}

export function useObliqueRotation(options: UseObliqueRotationOptions) {
  const { viewportIds, renderingEngine } = options;

  /**
   * 旋转视口
   * @param viewportId 要旋转的视口 ID
   * @param angle 旋转角度（度）
   * @param axis 旋转轴 ('x' | 'y' | 'z')
   */
  const rotateViewport = useCallback(
    (viewportId: string, angle: number, axis: 'x' | 'y' | 'z') => {
      if (!renderingEngine) return;

      const viewport = renderingEngine.getViewport(viewportId) as IViewport;
      if (!viewport) {
        console.error(`Viewport ${viewportId} not found`);
        return;
      }

      try {
        // 获取当前相机
        const camera = viewport.getCamera();

        // 创建旋转矩阵
        const rotationMatrix = mat4.create();
        const angleInRadians = (angle * Math.PI) / 180;
        const rotationAxis = getRotationAxis(axis);

        // 应用旋转（围绕给定轴）
        mat4.rotate(rotationMatrix, rotationMatrix, angleInRadians, rotationAxis);

        // 应用到相机视图矩阵
        const newViewMatrix = mat4.create();
        mat4.multiply(newViewMatrix, rotationMatrix, camera.viewMatrix);
        camera.viewMatrix = newViewMatrix;

        // 更新相机
        viewport.setCamera(camera);
        viewport.render();

        // 触发定位线更新
        const event = new CustomEvent('referenceLinesUpdate', {
          detail: { activeViewportId: viewportId },
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Failed to rotate viewport:', error);
      }
    },
    [renderingEngine]
  );

  /**
   * 获取旋转轴向量
   */
  const getRotationAxis = (axis: 'x' | 'y' | 'z'): vec3 => {
    switch (axis) {
      case 'x':
        return [1, 0, 0];
      case 'y':
        return [0, 1, 0];
      case 'z':
        return [0, 0, 1];
      default:
        return [0, 0, 1];
    }
  };

  /**
   * 重置所有视口的旋转
   */
  const resetRotation = useCallback(() => {
    if (!renderingEngine) return;

    viewportIds.forEach((viewportId) => {
      const viewport = renderingEngine.getViewport(viewportId) as IViewport;
      if (!viewport) return;

      try {
        // 重置相机到默认方向
        const camera = viewport.getCamera();

        // 重置视图矩阵为单位矩阵（或其他适当的默认值）
        mat4.identity(camera.viewMatrix);

        viewport.setCamera(camera);
        viewport.render();
      } catch (error) {
        console.error('Failed to reset viewport rotation:', error);
      }
    });

    // 触发定位线更新
    const event = new CustomEvent('referenceLinesUpdate', {
      detail: { activeViewportId: viewportIds[0] },
    });
    window.dispatchEvent(event);
  }, [renderingEngine, viewportIds]);

  /**
   * 批量旋转多个视口
   */
  const rotateAllViewports = useCallback(
    (angle: number, axis: 'x' | 'y' | 'z') => {
      viewportIds.forEach((viewportId) => {
        rotateViewport(viewportId, angle, axis);
      });
    },
    [viewportIds, rotateViewport]
  );

  return {
    rotateViewport,
    rotateAllViewports,
    resetRotation,
  };
}
