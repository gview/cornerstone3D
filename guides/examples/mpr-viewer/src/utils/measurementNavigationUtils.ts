/**
 * 测量导航工具函数
 * 参考 OHIF Viewers 的实现方式,使用 Cornerstone3D 官方 API
 * 处理测量跳转,支持旋转后的视口方向
 */

import { vec3 } from 'gl-matrix';
import type { Types } from '@cornerstonejs/core';

/**
 * 测量点的接口定义
 */
interface MeasurementPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * 测量数据接口
 */
interface MeasurementData {
  points?: number[][];
  handles?: {
    start?: MeasurementPoint;
    end?: MeasurementPoint;
    points?: Array<MeasurementPoint | number[]>;
  };
}

/**
 * 边界框接口
 */
interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
}

/**
 * 中心和边界框结果
 */
interface CenterExtentResult {
  center: [number, number, number];
  extent: BoundingBox;
}

/**
 * 计算测量的中心点和边界框
 * 参考 OHIF 的 getCenterExtent 实现
 *
 * @param measurement - 测量对象
 * @returns 包含中心点和边界框的对象
 */
export function getCenterExtent(measurement: MeasurementData): CenterExtentResult {
  // 从测量中提取点数组
  const points = extractPointsFromMeasurement(measurement);

  if (!points || points.length === 0) {
    // 返回默认值
    const defaultCenter: [number, number, number] = [0, 0, 0];
    const defaultExtent: BoundingBox = {
      min: [0, 0, 0],
      max: [0, 0, 0],
    };
    return { center: defaultCenter, extent: defaultExtent };
  }

  // 初始化最小和最大值
  const min: [number, number, number] = [...points[0]] as [number, number, number];
  const max: [number, number, number] = [...points[0]] as [number, number, number];

  // 找到边界框
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    for (let j = 0; j < 3; j++) {
      min[j] = Math.min(min[j], point[j]);
      max[j] = Math.max(max[j], point[j]);
    }
  }

  // 计算中心点
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];

  return {
    center,
    extent: { min, max },
  };
}

/**
 * 从测量对象中提取点数组
 *
 * @param measurement - 测量对象
 * @returns 点数组
 */
function extractPointsFromMeasurement(measurement: MeasurementData): number[][] {
  const points: number[][] = [];

  // 情况1: 直接的 points 数组
  if (measurement.points && Array.isArray(measurement.points)) {
    return measurement.points;
  }

  // 情况2: 从 data.handles 中提取 (Cornerstone3D 标注结构)
  const handles = (measurement as any).data?.handles;

  if (handles) {
    console.log('🔍 提取测量点 - Handles 结构:', JSON.stringify(handles, null, 2));
    console.log('🔍 Handles keys:', Object.keys(handles));

    // 线段类工具 (Length, Angle, Bidirectional)
    if (handles.start && handles.end) {
      const startPoint = [handles.start.x, handles.start.y, handles.start.z];
      const endPoint = [handles.end.x, handles.end.y, handles.end.z];
      points.push(startPoint);
      points.push(endPoint);
      console.log('✅ 提取到线段点:', startPoint, endPoint);
    }
    // 单点工具 (Probe)
    else if (handles.start) {
      const startPoint = [handles.start.x, handles.start.y, handles.start.z];
      points.push(startPoint);
      console.log('✅ 提取到单点:', startPoint);
    }
    // 点数组工具 (ROI 工具 - RectangleROI, EllipticalROI)
    else if (handles.points && Array.isArray(handles.points)) {
      handles.points.forEach((point) => {
        if (Array.isArray(point) && point.length >= 3) {
          // 数组格式 [x, y, z]
          points.push(point as number[]);
        }
      });
      console.log(`✅ 提取到 ${points.length} 个ROI点`);
    }
  }

  console.log('🔍 最终提取的点数组:', points);
  return points;
}

/**
 * 检查测量是否在视口可见范围内
 * 参考 OHIF 的 isMeasurementWithinViewport 实现
 *
 * @param viewport - 视口对象
 * @param measurement - 测量对象
 * @returns 如果测量在视口范围内返回 true
 */
export function isMeasurementWithinViewport(
  viewport: Types.IVolumeViewport,
  measurement: MeasurementData
): boolean {
  const camera = viewport.getCamera();
  const { focalPoint, parallelScale } = camera;

  // 获取测量的边界框
  const { extent } = getCenterExtent(measurement);
  const { min, max } = extent;

  // 检查整个边界框是否在视口范围内
  for (let i = 0; i < 3; i++) {
    const minDistance = Math.abs(min[i] - focalPoint[i]);
    const maxDistance = Math.abs(max[i] - focalPoint[i]);

    // 如果最小或最大点在视口范围外,返回 false
    if (minDistance > parallelScale || maxDistance > parallelScale) {
      return false;
    }
  }

  return true;
}

/**
 * 尝试使用 setViewReference 跳转到测量位置
 * 注意: 这需要完整的 ViewReference 元数据,否则会失败
 *
 * @param viewport - 目标视口
 * @param annotation - 标注对象
 * @returns 如果成功返回 true,否则返回 false
 */
export function tryJumpToAnnotationUsingViewReference(
  viewport: Types.IVolumeViewport,
  annotation: any
): boolean {
  // 暂时禁用 setViewReference，因为存在兼容性问题
  // 直接返回 false 让调用者使用相机调整
  return false;
}

/**
 * 使用手动相机控制跳转到测量位置
 * 作为 setViewReference 的回退方案
 * 参考 OHIF 的相机调整逻辑
 *
 * @param viewport - 目标视口
 * @param annotation - 标注对象
 */
export function jumpToAnnotationUsingCamera(
  viewport: Types.IVolumeViewport,
  annotation: any
): void {
  try {
    // 计算测量的中心点
    const { center, extent } = getCenterExtent(annotation);

    // 检查中心点是否有效（不为 [0, 0, 0]）
    const isInvalidCenter = center[0] === 0 && center[1] === 0 && center[2] === 0;
    if (isInvalidCenter) {
      console.warn('⚠️ 无法提取有效的测量坐标，跳转取消');
      console.warn('💡 这可能是由于标注数据结构不兼容');
      return;
    }

    // 获取当前相机
    const camera = viewport.getCamera();
    const { focalPoint: cameraFocalPoint, position: cameraPosition } = camera;

    // 计算当前焦点到测量中心的距离
    const distanceToFocalPoint = vec3.dist(cameraFocalPoint, center);

    // 如果测量中心与当前焦点非常接近(小于1mm)，则认为已经在正确位置
    if (distanceToFocalPoint < 1.0) {
      console.log(`✅ 测量已在视口焦点范围内 (距离: ${distanceToFocalPoint.toFixed(2)}mm)`);
      return;
    }

    // 计算新的相机位置
    // 保持相机到焦点的距离不变,只移动焦点到测量中心
    const position = vec3.sub(vec3.create(), cameraPosition, cameraFocalPoint);
    vec3.add(position, position, center);

    // 应用新的相机（只更新位置，保持当前方向）
    viewport.setCamera({
      focalPoint: center as Types.Point3,
      position: position as any,
    });

    // 如果测量太大,缩小视图
    const measurementSize = vec3.dist(extent.min, extent.max);
    if (measurementSize > camera.parallelScale) {
      const scaleFactor = measurementSize / camera.parallelScale;
      viewport.setZoom(viewport.getZoom() / scaleFactor);
    }

    viewport.render();

    console.log(`✅ 已跳转到测量位置: [${center[0].toFixed(2)}, ${center[1].toFixed(2)}, ${center[2].toFixed(2)}]`);
  } catch (error) {
    console.error('❌ 相机跳转失败:', error);
  }
}

/**
 * 为多个视口跳转到测量位置 (MPR 视图)
 *
 * @param renderingEngine - 渲染引擎
 * @param viewportIds - 视口 ID 数组
 * @param annotation - 标注对象
 */
export function jumpToAnnotationInMPRViewports(
  renderingEngine: Types.IRenderingEngine,
  viewportIds: string[],
  annotation: any
): void {
  try {
    const { center } = getCenterExtent(annotation);

    // 为每个视口应用跳转
    viewportIds.forEach((viewportId) => {
      const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
      if (!viewport) {
        console.warn(`⚠️ 无法获取视口: ${viewportId}`);
        return;
      }

      // 尝试使用 setViewReference
      try {
        jumpToAnnotationUsingViewReference(viewport, annotation);
      } catch (error) {
        console.warn(`⚠️ setViewReference 失败,使用相机调整: ${viewportId}`);
        jumpToAnnotationUsingCamera(viewport, annotation);
      }
    });

    // 渲染所有视口
    renderingEngine.renderViewports(viewportIds);

    console.log(`✅ 已在 ${viewportIds.length} 个视口中跳转到测量位置`);
  } catch (error) {
    console.error('❌ MPR 视口跳转失败:', error);
  }
}
