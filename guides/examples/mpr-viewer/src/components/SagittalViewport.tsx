import React, { useEffect, useRef } from 'react';
import { getEnabledElement } from '@cornerstonejs/core';

/**
 * 矢状位（Sagittal）视图组件
 * 显示从左到右垂直于人体长轴的矢状切面
 */
interface SagittalViewportProps {
  viewportId?: string;
  renderingEngineId?: string;
}

export default function SagittalViewport({
  viewportId = 'SAGITTAL',
  renderingEngineId = 'mprEngine',
}: SagittalViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建 SVG 层用于绘制定位线
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('reference-lines-svg');
    containerRef.current.appendChild(svg);
    svgRef.current = svg;

    // 监听定位线更新事件
    const handleReferenceLinesUpdate = (event: any) => {
      const { activeViewportId } = event.detail;
      if (activeViewportId !== viewportId) {
        // 当前视图不是活动视图，更新定位线
        updateReferenceLines(activeViewportId);
      }
    };

    window.addEventListener('referenceLinesUpdate', handleReferenceLinesUpdate);

    return () => {
      window.removeEventListener('referenceLinesUpdate', handleReferenceLinesUpdate);
      if (svgRef.current && svgRef.current.parentNode) {
        svgRef.current.parentNode.removeChild(svgRef.current);
      }
    };
  }, [viewportId]);

  /**
   * 更新定位线
   */
  const updateReferenceLines = (activeViewportId: string) => {
    if (!svgRef.current) return;

    try {
      const enabledElement = getEnabledElement(activeViewportId);
      if (!enabledElement) return;

      const { viewport: activeViewport } = enabledElement;
      const currentEnabledElement = getEnabledElement(viewportId);

      if (!currentEnabledElement) return;

      const { viewport: currentViewport } = currentEnabledElement;

      // 获取活动视图的相机
      const camera = (activeViewport as any).getCamera();
      const focalPoint = camera.focalPoint;

      // 计算定位线位置
      const lines = calculateReferenceLines(focalPoint, currentViewport as any);

      // 绘制定位线
      drawReferenceLines(svgRef.current, lines);
    } catch (error) {
      console.error('Failed to update reference lines:', error);
    }
  };

  /**
   * 计算定位线位置
   */
  const calculateReferenceLines = (
    focalPoint: any,
    targetViewport: any
  ): Array<{ x1: number; y1: number; x2: number; y2: number }> => {
    const canvas = targetViewport.getCanvas();
    if (!canvas) return [];

    const width = canvas.width;
    const height = canvas.height;

    // 简化示例：假设定位线通过图像中心
    return [
      {
        x1: 0,
        y1: height / 2,
        x2: width,
        y2: height / 2,
      }, // 水平线
      {
        x1: width / 2,
        y1: 0,
        x2: width / 2,
        y2: height,
      }, // 垂直线
    ];
  };

  /**
   * 绘制定位线
   */
  const drawReferenceLines = (
    svg: SVGSVGElement,
    lines: Array<{ x1: number; y1: number; x2: number; y2: number }>
  ) => {
    while (svg.lastChild) {
      svg.removeChild(svg.lastChild);
    }

    lines.forEach((line) => {
      const lineElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      lineElement.setAttribute('x1', line.x1.toString());
      lineElement.setAttribute('y1', line.y1.toString());
      lineElement.setAttribute('x2', line.x2.toString());
      lineElement.setAttribute('y2', line.y2.toString());
      lineElement.classList.add('reference-line');
      svg.appendChild(lineElement);
    });
  };

  return (
    <div
      ref={containerRef}
      className="viewport-element"
      id={viewportId}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
