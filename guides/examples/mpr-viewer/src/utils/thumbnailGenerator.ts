import { RenderingEngine, Enums, imageLoader } from '@cornerstonejs/core';
import { initCornerstone } from '../cornerstone/init';

let thumbnailEngine: RenderingEngine | null = null;

/**
 * 为序列的第一张图像生成缩略图
 * @param imageIds - 序列的 imageId 列表
 * @param width - 缩略图宽度
 * @param height - 缩略图高度
 * @returns Promise<string> - 返回 data URL
 */
export async function generateThumbnail(
  imageIds: string[],
  width: number = 80,
  height: number = 80
): Promise<string | null> {
  if (!imageIds || imageIds.length === 0) {
    return null;
  }

  try {
    // 确保 cornerstone 已初始化
    await initCornerstone();

    // 创建一个离屏容器用于渲染缩略图
    const container = document.createElement('div');
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    // 创建或复用渲染引擎
    if (!thumbnailEngine) {
      thumbnailEngine = new RenderingEngine('thumbnail-engine');
    }

    // 使用序列的第一张图像
    const imageId = imageIds[Math.floor(imageIds.length / 2)]; // 使用中间帧

    // 启用视口
    const viewportId = `thumbnail-${Date.now()}`;
    const viewportInput = {
      viewportId,
      element: container,
      type: Enums.ViewportType.STACK,
      defaultOptions: {
        background: [0, 0, 0] as any,
      },
    };

    thumbnailEngine.setViewports([viewportInput]);

    // 获取视口并设置图像
    const viewport = thumbnailEngine.getViewport(viewportId);
    if (!viewport) {
      throw new Error('无法创建缩略图视口');
    }

    // 设置 stack 图像
    await (viewport as any).setStack([imageId], 0);

    // 等待渲染完成
    thumbnailEngine.render();

    // 等待一帧确保渲染完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 获取 canvas 并转换为 data URL
    const canvas = container.querySelector('canvas');
    if (!canvas) {
      throw new Error('无法获取 canvas');
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

    // 清理
    document.body.removeChild(container);

    return dataUrl;
  } catch (error) {
    console.error('生成缩略图失败:', error);
    return null;
  }
}

/**
 * 批量生成多个序列的缩略图
 * @param seriesList - 序列列表
 * @returns Promise<void>
 */
export async function generateThumbnailsForSeries(
  seriesList: any[]
): Promise<void> {
  console.log(`🎨 开始生成 ${seriesList.length} 个序列的缩略图...`);

  for (const series of seriesList) {
    if (!series.thumbnail && series.imageIds && series.imageIds.length > 0) {
      console.log(`📸 生成序列缩略图: ${series.seriesDescription}`);
      const thumbnail = await generateThumbnail(series.imageIds);
      if (thumbnail) {
        series.thumbnail = thumbnail;
      }
    }
  }

  console.log('✅ 所有缩略图生成完成');
}

/**
 * 清理缩略图渲染引擎
 */
export function cleanupThumbnailEngine(): void {
  if (thumbnailEngine) {
    thumbnailEngine.destroy();
    thumbnailEngine = null;
  }
}
