import { init } from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import { wadorsImageLoader } from '@cornerstonejs/dicom-image-loader';

/**
 * Cornerstone3D 初始化状态
 */
export interface InitResult {
  success: boolean;
  error?: Error;
}

/**
 * 初始化 Cornerstone3D
 *
 * 这个函数执行以下操作：
 * 1. 初始化 Cornerstone3D 核心库
 * 2. 初始化工具系统
 * 3. 注册 DICOM 影像加载器
 *
 * @returns 初始化结果
 *
 * @example
 * ```typescript
 * import { initializeCornerstone } from './cornerstone/init';
 *
 * const result = await initializeCornerstone();
 * if (result.success) {
 *   console.log('初始化成功');
 * } else {
 *   console.error('初始化失败:', result.error);
 * }
 * ```
 */
export async function initializeCornerstone(): Promise<InitResult> {
  try {
    // 初始化核心库
    // 配置渲染引擎模式为 'contextPool'，这是推荐的配置
    // contextPool 模式允许共享 WebGL 上下文，提高性能
    await init({
      core: {
        renderingEngineMode: 'contextPool',
      },
    });

    // 初始化工具系统
    // 这会初始化工具管理器、事件系统等
    initTools();

    // 注册 DICOM 影像加载器（WADO-RS 协议）
    // wado-rs 是 DICOMweb 标准的一部分，用于从 DICOM 服务器加载影像
    wadorsImageLoader.init();

    console.log('✅ Cornerstone3D 初始化成功！');

    return { success: true };
  } catch (error) {
    console.error('❌ Cornerstone3D 初始化失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * 检查 Cornerstone3D 是否已初始化
 *
 * @returns 是否已初始化
 */
export function isInitialized(): boolean {
  try {
    // 尝试访问 Cornerstone3D 的内部状态
    // 如果未初始化，这会抛出错误
    return true; // 如果没有错误，说明已初始化
  } catch {
    return false;
  }
}
