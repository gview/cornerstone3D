import { IViewport, Types } from '@cornerstonejs/core';
import { vec3, mat4 } from 'gl-matrix';

/**
 * 坐标转换工具函数
 *
 * 提供 MPR 视图间的坐标转换功能
 */

/**
 * 将图像坐标转换为世界坐标
 *
 * @param imagePoint - 图像坐标 { x, y, z }
 * @param viewport - 视口对象
 * @returns 世界坐标 { x, y, z }
 */
export function imageToWorld(
  imagePoint: Types.Point3,
  viewport: IViewport
): Types.Point3 {
  const { imageData } = viewport.getImageData();
  const { dimensions, spacing, origin } = imageData.metadata;

  return {
    x: origin[0] + imagePoint.x * spacing[0],
    y: origin[1] + imagePoint.y * spacing[1],
    z: origin[2] + imagePoint.z * spacing[2],
  };
}

/**
 * 将世界坐标转换为图像坐标
 *
 * @param worldPoint - 世界坐标 { x, y, z }
 * @param viewport - 视口对象
 * @returns 图像坐标 { x, y, z }
 */
export function worldToImage(
  worldPoint: Types.Point3,
  viewport: IViewport
): Types.Point3 {
  const { imageData } = viewport.getImageData();
  const { dimensions, spacing, origin } = imageData.metadata;

  return {
    x: (worldPoint.x - origin[0]) / spacing[0],
    y: (worldPoint.y - origin[1]) / spacing[1],
    z: (worldPoint.z - origin[2]) / spacing[2],
  };
}

/**
 * 将世界坐标转换为屏幕坐标
 *
 * @param worldPoint - 世界坐标 { x, y, z }
 * @param viewport - 视口对象
 * @returns 屏幕坐标 { x, y }
 */
export function worldToScreen(
  worldPoint: Types.Point3,
  viewport: IViewport
): Types.Point2 {
  const camera = viewport.getCamera();
  const { viewMatrix, projectionMatrix } = camera;

  // 将世界坐标转换为相机坐标
  const viewPosition = vec3.create();
  vec3.transformMat4(viewPosition, [worldPoint.x, worldPoint.y, worldPoint.z], viewMatrix);

  // 将相机坐标转换为裁剪空间坐标
  const clipPosition = vec3.create();
  vec3.transformMat4(clipPosition, viewPosition, projectionMatrix);

  // 将裁剪空间坐标转换为屏幕坐标
  const canvas = viewport.getCanvas();
  const x = (clipPosition[0] + 1) * (canvas.width / 2);
  const y = (1 - clipPosition[1]) * (canvas.height / 2);

  return { x, y };
}

/**
 * 将屏幕坐标转换为世界坐标
 *
 * @param screenPoint - 屏幕坐标 { x, y }
 * @param viewport - 视口对象
 * @param depth - 深度值（默认使用相机焦点）
 * @returns 世界坐标 { x, y, z }
 */
export function screenToWorld(
  screenPoint: Types.Point2,
  viewport: IViewport,
  depth?: number
): Types.Point3 {
  const camera = viewport.getCamera();
  const canvas = viewport.getCanvas();

  // 将屏幕坐标转换为裁剪空间坐标
  const clipX = (screenPoint.x / canvas.width) * 2 - 1;
  const clipY = 1 - (screenPoint.y / canvas.height) * 2;

  // 如果没有提供深度，使用相机焦点
  const z = depth ?? camera.focalPoint.z;

  // 将裁剪空间坐标转换为世界坐标
  const inverseViewMatrix = mat4.create();
  const inverseProjectionMatrix = mat4.create();

  mat4.invert(inverseViewMatrix, camera.viewMatrix);
  mat4.invert(inverseProjectionMatrix, camera.projectionMatrix);

  // 转换过程
  const clipPosition = vec3.fromValues(clipX, clipY, z);
  const viewPosition = vec3.create();
  const worldPosition = vec3.create();

  vec3.transformMat4(viewPosition, clipPosition, inverseProjectionMatrix);
  vec3.transformMat4(worldPosition, viewPosition, inverseViewMatrix);

  return {
    x: worldPosition[0],
    y: worldPosition[1],
    z: worldPosition[2],
  };
}

/**
 * 将图像坐标转换为屏幕坐标
 *
 * @param imagePoint - 图像坐标 { x, y, z }
 * @param viewport - 视口对象
 * @returns 屏幕坐标 { x, y }
 */
export function imageToScreen(
  imagePoint: Types.Point3,
  viewport: IViewport
): Types.Point2 {
  const worldPoint = imageToWorld(imagePoint, viewport);
  return worldToScreen(worldPoint, viewport);
}

/**
 * 将屏幕坐标转换为图像坐标
 *
 * @param screenPoint - 屏幕坐标 { x, y }
 * @param viewport - 视口对象
 * @param sliceIndex - 切片索引（默认使用当前切片）
 * @returns 图像坐标 { x, y, z }
 */
export function screenToImage(
  screenPoint: Types.Point2,
  viewport: IViewport,
  sliceIndex?: number
): Types.Point3 {
  const camera = viewport.getCamera();
  const z = sliceIndex ?? camera.focalPoint.z;

  const worldPoint = screenToWorld(screenPoint, viewport, z);
  return worldToImage(worldPoint, viewport);
}

/**
 * 计算两点之间的 3D 欧几里得距离
 *
 * @param point1 - 第一个点
 * @param point2 - 第二个点
 * @returns 距离（单位：毫米）
 */
export function calculateDistance3D(
  point1: Types.Point3,
  point2: Types.Point3
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = point2.z - point1.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 旋转点围绕轴旋转指定角度
 *
 * @param point - 要旋转的点
 * @param axis - 旋转轴 { x, y, z }
 * @param angle - 旋转角度（弧度）
 * @returns 旋转后的点
 */
export function rotatePointAroundAxis(
  point: Types.Point3,
  axis: Types.Point3,
  angle: number
): Types.Point3 {
  const rotationMatrix = mat4.create();
  const axisNormalized = vec3.fromValues(axis.x, axis.y, axis.z);

  // 归一化轴
  vec3.normalize(axisNormalized, axisNormalized);

  // 创建旋转矩阵
  mat4.rotate(rotationMatrix, rotationMatrix, angle, axisNormalized);

  // 应用旋转
  const rotated = vec3.create();
  vec3.transformMat4(rotated, [point.x, point.y, point.z], rotationMatrix);

  return {
    x: rotated[0],
    y: rotated[1],
    z: rotated[2],
  };
}

/**
 * 验证坐标是否在有效范围内
 *
 * @param imagePoint - 图像坐标
 * @param viewport - 视口对象
 * @returns 是否在有效范围内
 */
export function isCoordinateValid(
  imagePoint: Types.Point3,
  viewport: IViewport
): boolean {
  const { imageData } = viewport.getImageData();
  const { dimensions } = imageData.metadata;

  return (
    imagePoint.x >= 0 &&
    imagePoint.x < dimensions[0] &&
    imagePoint.y >= 0 &&
    imagePoint.y < dimensions[1] &&
    imagePoint.z >= 0 &&
    imagePoint.z < dimensions[2]
  );
}

/**
 * 限制坐标在有效范围内
 *
 * @param imagePoint - 图像坐标
 * @param viewport - 视口对象
 * @returns 限制后的图像坐标
 */
export function clampCoordinate(
  imagePoint: Types.Point3,
  viewport: IViewport
): Types.Point3 {
  const { imageData } = viewport.getImageData();
  const { dimensions } = imageData.metadata;

  return {
    x: Math.max(0, Math.min(dimensions[0] - 1, imagePoint.x)),
    y: Math.max(0, Math.min(dimensions[1] - 1, imagePoint.y)),
    z: Math.max(0, Math.min(dimensions[2] - 1, imagePoint.z)),
  };
}
