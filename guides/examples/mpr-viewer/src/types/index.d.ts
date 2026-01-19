/**
 * MPR Viewer 全局类型定义
 */

/**
 * MPR 视图类型
 */
export type MPRViewType = 'AXIAL' | 'SAGITTAL' | 'CORONAL';

/**
 * 层厚投影模式
 */
export type SlabModeType = 'max' | 'min' | 'avg';

/**
 * 旋转轴
 */
export type RotationAxis = 'x' | 'y' | 'z';

/**
 * 定位线坐标
 */
export interface ReferenceLineCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * MPR 视口配置
 */
export interface MPRViewportConfig {
  viewportId: string;
  element: HTMLElement;
  type: any;
  defaultView: any;
}

/**
 * MPR 同步上下文
 */
export interface MPRSyncContext {
  viewportIds: string[];
  renderingEngineId: string;
  syncEnabled: boolean;
}

/**
 * 定位线更新事件详情
 */
export interface ReferenceLinesUpdateEventDetail {
  activeViewportId: string;
}

/**
 * Window 对象扩展
 */
declare global {
  interface WindowEventMap {
    referenceLinesUpdate: CustomEvent<ReferenceLinesUpdateEventDetail>;
  }
}

/**
 * Cornerstone3D 相关类型（如果需要）
 */
export {};
