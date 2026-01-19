import { useState, useCallback } from 'react';
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
   * 转换投影模式字符串为 Cornerstone3D 枚举值
   */
  const convertSlabMode = (mode: SlabMode): string => {
    switch (mode) {
      case 'max':
        return 'max';
      case 'min':
        return 'min';
      case 'avg':
        return 'avg';
      default:
        return 'max';
    }
  };

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
   * 重置层厚设置
   */
  const reset = useCallback(() => {
    setSlabThickness(1);
    setSlabMode('max');
  }, [setSlabThickness, setSlabMode]);

  return {
    slabThickness,
    setSlabThickness,
    slabMode,
    setSlabMode,
    reset,
  };
}
