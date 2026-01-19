import { useEffect, useRef } from 'react';
import { IViewport } from '@cornerstonejs/core/types';
import { calculateReferenceLines, drawReferenceLines } from '../utils/referenceLineCalculation';

interface ReferenceLinesProps {
  viewport: IViewport;
  activeViewports: IViewport[];
  color?: string;
}

/**
 * ReferenceLines 组件 - MPR 定位线显示
 *
 * 功能：
 * - 在 SVG 层上绘制定位线
 * - 显示当前活动视图在其他视图中的位置
 * - 支持自定义颜色
 */
export function ReferenceLines({
  viewport,
  activeViewports,
  color = 'cyan'
}: ReferenceLinesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    // 创建 SVG 层
    const svg = svgRef.current;
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '10';

    // 更新定位线
    const updateLines = () => {
      if (!svgRef.current) return;

      // 计算所有活动视图在当前视图中的定位线
      const allLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

      activeViewports.forEach(activeViewport => {
        // 如果活动视图不是当前视图，计算定位线
        if (activeViewport.id !== viewport.id) {
          const lines = calculateReferenceLines(activeViewport, viewport);
          allLines.push(...lines);
        }
      });

      // 绘制定位线
      drawReferenceLines(svgRef.current, allLines, color);
    };

    // 初始更新
    updateLines();

    // 监听视口渲染事件以更新定位线
    const element = viewport.element;
    const handleRender = () => {
      updateLines();
    };

    element.addEventListener('IMAGE_RENDERED', handleRender);

    return () => {
      element.removeEventListener('IMAGE_RENDERED', handleRender);
    };
  }, [viewport, activeViewports, color]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}

export default ReferenceLines;
