import { init as cornerstoneInit } from '@cornerstonejs/core';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';

/**
 * 初始化 Cornerstone3D
 * 配置核心库和 DICOM Image Loader
 */
export async function initCornerstone(): Promise<void> {
  try {
    // 初始化 Cornerstone 核心
    cornerstoneInit();

    // 配置 DICOM Image Loader
    dicomImageLoader.web.cornerstone = cornerstoneInit;

    // 配置元数据提供器（可选）
    // 如果需要自定义元数据提供器，可以在这里配置

    console.log('Cornerstone3D initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Cornerstone3D:', error);
    throw error;
  }
}

/**
 * 配置 DICOMweb 服务器
 * @param baseUrl DICOMweb 服务器基础 URL
 */
export function configureDICOMweb(baseUrl: string): void {
  // 配置 WADO-RS loader
  dicomImageLoader.web.configuration.setWebConfiguration({
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
