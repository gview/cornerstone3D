import { useState, useCallback, useEffect } from 'react';
import { Enums } from '@cornerstonejs/core';
import type { RenderingEngine } from '@cornerstonejs/core/types';

/**
 * MPR 层厚调节 Hook
 * 管理视口的层厚和投影模式设置
 */
interface UseSlabThicknessOptions {
  viewportIds: string[];
  renderingEngine: RenderingEngine | null;
}

type SlabMode = 'max' | 'min' | 'avg';

export function useSlabThickness(options: UseSlabThicknessOptions) {
  const { viewportIds, renderingEngine } = options;

  const [slabThickness, setSlabThicknessState] = useState(1);
  const [slabMode, setSlabModeState] = useState<SlabMode>('max');

  /**
   * 设置层厚
   * @param thickness 层厚值（切片数或毫米数）
   */
  const setSlabThickness = useCallback(
    (thickness: number) => {
      if (!renderingEngine) return;

      const viewports = renderingEngine.getViewports();
      viewports.forEach((viewport) => {
        try {
          // 设置层厚
          (viewport as any).setProperties({
            slabThickness: thickness,
            slabMode: convertSlabMode(slabMode),
          });
          viewport.render();
        } catch (error) {
          console.error('Failed to set slab thickness:', error);
        }
      });

      setSlabThicknessState(thickness);
    },
    [renderingEngine, slabMode]
  );

  /**
   * 设置投影模式
   * @param mode 投影模式 ('max' | 'min' | 'avg')
   */
  const setSlabMode = useCallback(
    (mode: SlabMode) => {
      if (!renderingEngine) return;

      const viewports = renderingEngine.getViewports();
      viewports.forEach((viewport) => {
        try {
          // 设置投影模式
          (viewport as any).setProperties({
            slabThickness: slabThickness,
            slabMode: convertSlabMode(mode),
          });
          viewport.render();
        } catch (error) {
          console.error('Failed to set slab mode:', error);
        }
      });

      setSlabModeState(mode);
    },
    [renderingEngine, slabThickness]
  );

  /**
   * 转换投影模式字符串为 Cornerstone3D 枚举值
   */
  const convertSlabMode = (mode: SlabMode): Enums.SlabMode => {
    switch (mode) {
      case 'max':
        return Enums.SlabMode.MAX;
      case 'min':
        return Enums.SlabMode.MIN;
      case 'avg':
        return Enums.SlabMode.AVERAGE;
      default:
        return Enums.SlabMode.MAX;
    }
  };

  /**
   * 重置层厚设置
   */
  const reset = useCallback(() => {
    setSlabThickness(1);
    setSlabMode('max');
  }, []);

  return {
    slabThickness,
    setSlabThickness,
    slabMode,
    setSlabMode,
    reset,
  };
}
