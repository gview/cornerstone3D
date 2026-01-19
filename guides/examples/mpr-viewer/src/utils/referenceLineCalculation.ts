import { IViewport, Types } from '@cornerstonejs/core';
import { worldToScreen } from './coordinateTransform';

/**
 * 定位线计算工具函数
 *
 * 提供 MPR 视图间定位线的计算和绘制功能
 */

/**
 * 定位线坐标接口
 */
export interface ReferenceLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}

/**
 * 计算定位线位置
 *
 * 根据活动视图的相机位置，计算在其他视图中应该绘制的定位线
 *
 * @param activeViewport - 活动视图（用户正在交互的视图）
 * @param targetViewport - 目标视图（需要绘制定位线的视图）
 * @returns 定位线坐标数组
 */
export function calculateReferenceLines(
  activeViewport: IViewport,
  targetViewport: IViewport
): ReferenceLine[] {
  // 获取活动视图的相机
  const activeCamera = activeViewport.getCamera();
  const { focalPoint, viewMatrix } = activeCamera;

  // 获取目标视图的 canvas 尺寸
  const targetCanvas = targetViewport.getCanvas();
  if (!targetCanvas) {
    return [];
  }

  // 根据目标视图的类型，计算不同的定位线
  const lines: ReferenceLine[] = [];

  // 情况 1: 横断位到冠状位/矢状位的定位线
  if (isAxialViewport(activeViewport)) {
    if (isCoronalViewport(targetViewport)) {
      // 横断位到冠状位：显示水平线（表示当前横断位切片）
      const line = calculateAxialToCoronalLine(
        focalPoint,
        targetViewport,
        targetCanvas
      );
      if (line) lines.push(line);
    } else if (isSagittalViewport(targetViewport)) {
      // 横断位到矢状位：显示垂直线（表示当前横断位切片）
      const line = calculateAxialToSagittalLine(
        focalPoint,
        targetViewport,
        targetCanvas
      );
      if (line) lines.push(line);
    }
  }

  // 情况 2: 冠状位到横断位/矢状位的定位线
  else if (isCoronalViewport(activeViewport)) {
    if (isAxialViewport(targetViewport)) {
      // 冠状位到横断位：显示水平线
      const line = calculateCoronalToAxialLine(
        focalPoint,
        targetViewport,
        targetCanvas
      );
      if (line) lines.push(line);
    } else if (isSagittalViewport(targetViewport)) {
      // 冠状位到矢状位：显示垂直线
      const line = calculateCoronalToSagittalLine(
        focalPoint,
        targetViewport,
        targetCanvas
      );
      if (line) lines.push(line);
    }
  }

  // 情况 3: 矢状位到横断位/冠状位的定位线
  else if (isSagittalViewport(activeViewport)) {
    if (isAxialViewport(targetViewport)) {
      // 矢状位到横断位：显示垂直线
      const line = calculateSagittalToAxialLine(
        focalPoint,
        targetViewport,
        targetCanvas
      );
      if (line) lines.push(line);
    } else if (isCoronalViewport(targetViewport)) {
      // 矢状位到冠状位：显示垂直线
      const line = calculateSagittalToCoronalLine(
        focalPoint,
        targetViewport,
        targetCanvas
      );
      if (line) lines.push(line);
    }
  }

  return lines;
}

/**
 * 横断位到冠状位的定位线
 */
function calculateAxialToCoronalLine(
  focalPoint: Types.Point3,
  targetViewport: IViewport,
  canvas: HTMLCanvasElement
): ReferenceLine | null {
  // 在冠状位视图中，横断位切片显示为水平线
  // 使用 focalPoint.z 作为 Y 坐标

  const startPoint = { x: 0, y: focalPoint.z, z: focalPoint.y };
  const endPoint = { x: canvas.width, y: focalPoint.z, z: focalPoint.y };

  const screenStart = worldToScreen(startPoint, targetViewport);
  const screenEnd = worldToScreen(endPoint, targetViewport);

  return {
    x1: screenStart.x,
    y1: screenStart.y,
    x2: screenEnd.x,
    y2: screenEnd.y,
    color: 'cyan',
    strokeWidth: 2,
    opacity: 0.8,
  };
}

/**
 * 横断位到矢状位的定位线
 */
function calculateAxialToSagittalLine(
  focalPoint: Types.Point3,
  targetViewport: IViewport,
  canvas: HTMLCanvasElement
): ReferenceLine | null {
  // 在矢状位视图中，横断位切片显示为水平线
  const startPoint = { x: focalPoint.y, y: 0, z: focalPoint.z };
  const endPoint = { x: focalPoint.y, y: canvas.height, z: focalPoint.z };

  const screenStart = worldToScreen(startPoint, targetViewport);
  const screenEnd = worldToScreen(endPoint, targetViewport);

  return {
    x1: screenStart.x,
    y1: screenStart.y,
    x2: screenEnd.x,
    y2: screenEnd.y,
    color: 'cyan',
    strokeWidth: 2,
    opacity: 0.8,
  };
}

/**
 * 冠状位到横断位的定位线
 */
function calculateCoronalToAxialLine(
  focalPoint: Types.Point3,
  targetViewport: IViewport,
  canvas: HTMLCanvasElement
): ReferenceLine | null {
  // 在横断位视图中，冠状位切片显示为垂直线
  const startPoint = { x: 0, y: focalPoint.y, z: focalPoint.z };
  const endPoint = { x: canvas.width, y: focalPoint.y, z: focalPoint.z };

  const screenStart = worldToScreen(startPoint, targetViewport);
  const screenEnd = worldToScreen(endPoint, targetViewport);

  return {
    x1: screenStart.x,
    y1: screenStart.y,
    x2: screenEnd.x,
    y2: screenEnd.y,
    color: 'yellow',
    strokeWidth: 2,
    opacity: 0.8,
  };
}

/**
 * 冠状位到矢状位的定位线
 */
function calculateCoronalToSagittalLine(
  focalPoint: Types.Point3,
  targetViewport: IViewport,
  canvas: HTMLCanvasElement
): ReferenceLine | null {
  // 在矢状位视图中，冠状位切片显示为水平线
  const startPoint = { x: focalPoint.x, y: 0, z: focalPoint.z };
  const endPoint = { x: focalPoint.x, y: canvas.height, z: focalPoint.z };

  const screenStart = worldToScreen(startPoint, targetViewport);
  const screenEnd = worldToScreen(endPoint, targetViewport);

  return {
    x1: screenStart.x,
    y1: screenStart.y,
    x2: screenEnd.x,
    y2: screenEnd.y,
    color: 'yellow',
    strokeWidth: 2,
    opacity: 0.8,
  };
}

/**
 * 矢状位到横断位的定位线
 */
function calculateSagittalToAxialLine(
  focalPoint: Types.Point3,
  targetViewport: IViewport,
  canvas: HTMLCanvasElement
): ReferenceLine | null {
  // 在横断位视图中，矢状位切片显示为垂直线
  const startPoint = { x: focalPoint.x, y: 0, z: focalPoint.z };
  const endPoint = { x: focalPoint.x, y: canvas.height, z: focalPoint.z };

  const screenStart = worldToScreen(startPoint, targetViewport);
  const screenEnd = worldToScreen(endPoint, targetViewport);

  return {
    x1: screenStart.x,
    y1: screenStart.y,
    x2: screenEnd.x,
    y2: screenEnd.y,
    color: 'green',
    strokeWidth: 2,
    opacity: 0.8,
  };
}

/**
 * 矢状位到冠状位的定位线
 */
function calculateSagittalToCoronalLine(
  focalPoint: Types.Point3,
  targetViewport: IViewport,
  canvas: HTMLCanvasElement
): ReferenceLine | null {
  // 在冠状位视图中，矢状位切片显示为垂直线
  const startPoint = { x: 0, y: focalPoint.x, z: focalPoint.z };
  const endPoint = { x: canvas.width, y: focalPoint.x, z: focalPoint.z };

  const screenStart = worldToScreen(startPoint, targetViewport);
  const screenEnd = worldToScreen(endPoint, targetViewport);

  return {
    x1: screenStart.x,
    y1: screenStart.y,
    x2: screenEnd.x,
    y2: screenEnd.y,
    color: 'green',
    strokeWidth: 2,
    opacity: 0.8,
  };
}

/**
 * 在 SVG 层上绘制定位线
 *
 * @param svg - SVG 元素
 * @param lines - 定位线坐标数组
 * @param defaultColor - 默认颜色（如果线条没有指定颜色）
 */
export function drawReferenceLines(
  svg: SVGSVGElement,
  lines: ReferenceLine[],
  defaultColor: string = 'cyan'
): void {
  // 清空现有线条
  while (svg.lastChild) {
    svg.removeChild(svg.lastChild);
  }

  // 创建新线条
  lines.forEach((line, index) => {
    const lineElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );

    lineElement.setAttribute('x1', line.x1.toString());
    lineElement.setAttribute('y1', line.y1.toString());
    lineElement.setAttribute('x2', line.x2.toString());
    lineElement.setAttribute('y2', line.y2.toString());
    lineElement.setAttribute('stroke', line.color || defaultColor);
    lineElement.setAttribute(
      'stroke-width',
      (line.strokeWidth || 2).toString()
    );
    lineElement.setAttribute('opacity', (line.opacity || 0.8).toString());

    // 添加虚线效果以提高可见性
    lineElement.setAttribute('stroke-dasharray', '5,5');

    svg.appendChild(lineElement);
  });
}

/**
 * 辅助函数：判断视口是否为横断位
 */
function isAxialViewport(viewport: IViewport): boolean {
  const camera = viewport.getCamera();
  // 简化判断：检查相机的上向量
  // 实际实现应该检查 viewMatrix 或元数据
  return viewport.id.toUpperCase().includes('AXIAL');
}

/**
 * 辅助函数：判断视口是否为冠状位
 */
function isCoronalViewport(viewport: IViewport): boolean {
  return viewport.id.toUpperCase().includes('CORONAL');
}

/**
 * 辅助函数：判断视口是否为矢状位
 */
function isSagittalViewport(viewport: IViewport): boolean {
  return viewport.id.toUpperCase().includes('SAGITTAL');
}

/**
 * 清除所有定位线
 *
 * @param svg - SVG 元素
 */
export function clearReferenceLines(svg: SVGSVGElement): void {
  while (svg.lastChild) {
    svg.removeChild(svg.lastChild);
  }
}

/**
 * 创建 SVG 元素缓存
 *
 * 用于优化性能，避免重复创建和销毁 SVG 元素
 */
export class SVGLayerCache {
  private cache = new Map<string, SVGLineElement>();

  /**
   * 获取或创建线条元素
   */
  getOrCreateLine(
    svg: SVGSVGElement,
    id: string
  ): SVGLineElement {
    if (!this.cache.has(id)) {
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      svg.appendChild(line);
      this.cache.set(id, line);
    }
    return this.cache.get(id)!;
  }

  /**
   * 更新线条位置
   */
  updateLine(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    const line = this.cache.get(id);
    if (line) {
      line.setAttribute('x1', x1.toString());
      line.setAttribute('y1', y1.toString());
      line.setAttribute('x2', x2.toString());
      line.setAttribute('y2', y2.toString());
    }
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }
}
