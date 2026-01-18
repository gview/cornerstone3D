/**
 * Cornerstone3D 相关类型定义
 *
 * 这个文件包含了 Cornerstone3D 相关的 TypeScript 类型定义
 * 用于提供类型安全性和更好的开发体验
 */

/**
 * Viewport 类型
 */
export type ViewportType = 'stack' | 'volume' | 'video';

/**
 * Image ID 格式
 * Cornerstone3D 使用特定的格式来标识影像
 */
export type ImageId =
  | `wadors:${string}` // WADO-RS 协议
  | `wado:${string}` // WADO-URI 协议
  | `imageLoader:${string}` // 自定义加载器
  | `imageid:${string}` // 通用格式
  | string; // 其他格式

/**
 * Image ID 列表
 */
export type ImageIdList = readonly ImageId[];

/**
 * 视口状态
 */
export interface ViewportStatus {
  /** 视口是否已初始化 */
  initialized: boolean;
  /** 当前影像索引 */
  currentIndex: number;
  /** 影像总数 */
  totalImages: number;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 工具配置
 */
export interface ToolConfig {
  /** 工具名称 */
  toolName: string;
  /** 是否激活 */
  active: boolean;
  /** 鼠标按钮绑定 */
  bindings?: Array<{
    mouseButton: number;
  }>;
}

/**
 * 渲染引擎配置
 */
export interface RenderingEngineConfig {
  /** 渲染引擎 ID */
  id: string;
  /** 渲染引擎模式 */
  mode: 'contextPool' | 'sharedContext';
}

/**
 * Viewport 输入参数
 */
export interface ViewportInput {
  /** Viewport ID */
  viewportId: string;
  /** DOM 元素 */
  element: HTMLElement;
  /** Viewport 类型 */
  type: ViewportType;
  /** 默认背景颜色 */
  backgroundColor?: string;
}

/**
 * 影像加载选项
 */
export interface ImageLoadOptions {
  /** 是否缓存影像 */
  cache?: boolean;
  /** 是否预加载 */
  preload?: boolean;
  /** 进度回调 */
  onProgress?: (progress: number) => void;
  /** 完成回调 */
  onComplete?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * Cornerstone3D 初始化选项
 */
export interface CornerstoneInitOptions {
  /** 渲染引擎模式 */
  renderingEngineMode?: 'contextPool' | 'sharedContext';
  /** 最大 Web Workers 数量 */
  maxWebWorkers?: number;
  /** 是否启动 Web Workers */
  startWebWorkers?: boolean;
}

/**
 * 工具组配置
 */
export interface ToolGroupConfig {
  /** 工具组 ID */
  toolGroupId: string;
  /** 工具配置列表 */
  tools: ToolConfig[];
  /** 关联的 Viewport ID */
  viewportId: string;
  /** 关联的 RenderingEngine ID */
  renderingEngineId: string;
}

/**
 * 窗宽窗位范围
 */
export interface VOIRange {
  /** 下限（窗位 - 窗宽/2） */
  lower: number;
  /** 上限（窗位 + 窗宽/2） */
  upper: number;
}

/**
 * 视口属性
 */
export interface ViewportProperties {
  /** 窗宽窗位范围 */
  voiRange?: VOIRange;
  /** 缩放比例 */
  scale?: number;
  /** 平移偏移 */
  translation?: {
    x: number;
    y: number;
  };
  /** 旋转角度（度） */
  rotation?: number;
  /** 是否翻转 */
  flip?: boolean;
  /** 是否水平翻转 */
  hflip?: boolean;
}

/**
 * DICOM 元数据
 */
export interface DICOMMetadata {
  /** Study Instance UID */
  studyInstanceUID: string;
  /** Series Instance UID */
  seriesInstanceUID: string;
  /** SOP Instance UID */
  sopInstanceUID: string;
  /** 模块 */
  modality: string;
  /** 患者ID */
  patientId: string;
  /** 患者姓名 */
  patientName: string;
  /** 检查日期 */
  studyDate: string;
  /** 序列日期 */
  seriesDate: string;
  /** 实例号 */
  instanceNumber: string;
  /** 序列号 */
  seriesNumber: string;
}

/**
 * 从 @cornerstonejs/core 导入的类型
 */
export type {
  RenderingEngine,
  Types as CoreTypes,
  Enums as CoreEnums,
} from '@cornerstonejs/core';

/**
 * 从 @cornerstonejs/tools 导入的类型
 */
export type {
  ToolGroup,
  Types as ToolsTypes,
  Enums as ToolsEnums,
} from '@cornerstonejs/tools';

/**
 * IVolumeViewport 接口
 * 用于 VolumeViewport 的类型定义
 */
export interface IVolumeViewport {
  /** Viewport ID */
  id: string;
  /** Viewport 类型 */
  type: 'volume';
  /** 渲染方法 */
  render: () => void;
  /** 设置属性 */
  setProperties: (properties: ViewportProperties) => void;
  /** 获取属性 */
  getProperties: () => ViewportProperties;
  /** 销毁方法 */
  destroy: () => void;
}

/**
 * IStackViewport 接口
 * 用于 StackViewport 的类型定义
 */
export interface IStackViewport {
  /** Viewport ID */
  id: string;
  /** Viewport 类型 */
  type: 'stack';
  /** 渲染方法 */
  render: () => void;
  /** 设置影像栈 */
  setStack: (
    imageIds: ImageIdList,
    currentIndex?: number
  ) => Promise<void>;
  /** 滚动影像 */
  scroll: (indexDelta: number) => void;
  /** 跳转到指定索引 */
  gotoImageIndex: (index: number) => void;
  /** 设置属性 */
  setProperties: (properties: ViewportProperties) => void;
  /** 获取属性 */
  getProperties: () => ViewportProperties;
  /** 销毁方法 */
  destroy: () => void;
}

/**
 * 事件类型
 */
export type CornerstoneEventType =
  | 'IMAGE_LOADED'
  | 'IMAGE_LOAD_FAILED'
  | 'IMAGE_RENDERED'
  | 'VIEWPORT_RENDERED'
  | 'TOOL_ACTIVATED'
  | 'TOOL_DEACTIVATED';

/**
 * 事件监听器类型
 */
export type EventListener = (event: CustomEvent) => void;
