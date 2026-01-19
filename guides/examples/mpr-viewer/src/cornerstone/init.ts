import { init as initCore, cache } from '@cornerstonejs/core';
import {
  init as initTools,
  addTool,
  ToolGroupManager,
} from '@cornerstonejs/tools';
import {
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
} from '@cornerstonejs/tools';
import { init as initDICOMLoader } from '@cornerstonejs/dicom-image-loader';

// 标记是否已经初始化,避免重复初始化
let isInitialized = false;

/**
 * 初始化 Cornerstone3D
 * 配置核心库、工具库和 DICOM Image Loader
 */
export async function initCornerstone(): Promise<boolean> {
  // 如果已经初始化,直接返回
  if (isInitialized) {
    console.log('ℹ️ Cornerstone3D 已经初始化,跳过重复初始化');
    return true;
  }

  try {
    // 初始化核心库
    await initCore();
    console.log('✅ Cornerstone Core 初始化成功');

    // 初始化工具库
    initTools();
    console.log('✅ Cornerstone Tools 初始化成功');

    // 注册 DICOM 影像加载器
    // wado-rs 是 DICOMweb 标准的一部分，也支持本地文件加载
    // initDICOMLoader() 会自动注册元数据提供者
    initDICOMLoader();
    console.log('✅ DICOM Image Loader 初始化成功');

    // 添加基本工具
    addTool(WindowLevelTool);
    addTool(PanTool);
    addTool(ZoomTool);
    addTool(StackScrollTool);
    console.log('✅ 基本工具已添加');

    // 标记为已初始化
    isInitialized = true;

    return true;
  } catch (error) {
    console.error('❌ Cornerstone3D 初始化失败:', error);
    throw error;
  }
}

/**
 * 清理资源
 */
export const cleanup = () => {
  // 清除影像缓存
  cache.purgeCache();
  console.log('✅ 资源已清理');
};

/**
 * 配置 DICOMweb 服务器
 * @param baseUrl DICOMweb 服务器基础 URL
 */
export async function configureDICOMweb(baseUrl: string): Promise<void> {
  // 配置 WADO-RS loader
  const { webConfiguration } = await import('@cornerstonejs/dicom-image-loader');
  webConfiguration.setWebConfiguration({
    baseUrl,
  });

  console.log('DICOMweb configured:', baseUrl);
}

/**
 * 配置本地文件加载
 */
export function configureLocalFileLoader(): void {
  // 本地文件加载不需要额外配置
  // 文件通过 File API 加载后，转换为 wadouri: 格式的 ImageId

  console.log('Local file loader configured');
}
