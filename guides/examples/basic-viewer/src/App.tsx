import { useState, useEffect, useRef } from 'react';
import { RenderingEngine } from '@cornerstonejs/core';
import { wadouri } from '@cornerstonejs/dicom-image-loader';
import { createViewport, setupTools } from './cornerstone/viewport';

/**
 * Cornerstone3D 基础影像查看器组件
 *
 * 这个组件展示了如何：
 * 1. 创建 RenderingEngine 和 Viewport
 * 2. 设置交互工具
 * 3. 加载和显示 DICOM 影像
 * 4. 处理用户交互
 */
function App() {
  // 视口容器引用
  const viewportRef = useRef<HTMLDivElement>(null);

  // RenderingEngine 引用
  const renderingEngineRef = useRef<RenderingEngine | null>(null);

  // 应用状态
  const [status, setStatus] = useState<string>('等待加载影像...');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [totalImages, setTotalImages] = useState<number>(0);

  /**
   * 初始化视口
   *
   * 在组件挂载时创建 RenderingEngine 和 Viewport
   */
  useEffect(() => {
    if (!viewportRef.current) {
      return;
    }

    let engine: RenderingEngine | null = null;

    try {
      // 创建 RenderingEngine
      // RenderingEngine 是 Cornerstone3D 的核心组件，管理 WebGL 上下文和视口生命周期
      engine = new RenderingEngine('basic-viewer-engine');
      renderingEngineRef.current = engine;

      // 创建并配置 Viewport
      // Viewport 是实际渲染影像的容器
      createViewport(engine, viewportRef.current);

      // 设置交互工具
      setupTools(engine);

      console.log('✅ 视口初始化成功');
      setStatus('视口已就绪，请加载影像');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '未知错误';
      console.error('❌ 视口初始化失败:', err);
      setError(`视口初始化失败: ${errorMessage}`);
    }

    // 清理函数：组件卸载时销毁 RenderingEngine
    return () => {
      if (engine) {
        engine.destroy();
        console.log('✅ RenderingEngine 已销毁');
      }
    };
  }, []); // 只在组件挂载时执行一次

  /**
   * 加载示例影像
   *
   * 从公开的 DICOM 服务器加载示例影像数据
   */
  const loadSampleImages = async () => {
    if (!renderingEngineRef.current) {
      setError('RenderingEngine 未初始化');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('正在加载影像...');

    try {
      // 示例影像 ID 列表
      // 这些是 Cornerstone3D 官方提供的公开示例影像
      const imageIds: string[] = [
        'wadors:https://d3t6nzgql5x55.cloudfront.net/example_images/1/CT Chest_j2k/1.000000-CTImages 602/00001.dcm',
        'wadors:https://d3t6nzgql5x55.cloudfront.net/example_images/1/CT Chest_j2k/1.000000-CTImages 602/00002.dcm',
        'wadors:https://d3t6nzgql5x55.cloudfront.net/example_images/1/CT Chest_j2k/1.000000-CTImages 602/00003.dcm',
      ];

      // 获取 Viewport 实例
      const viewport = renderingEngineRef.current.getStackViewport(
        'basic-viewer-viewport'
      );

      if (!viewport) {
        throw new Error('Viewport 未找到');
      }

      // 设置影像栈
      // setStack() 方法将影像 ID 列表设置到视口中
      await viewport.setStack(imageIds, 0); // 0 表示显示第一张影像

      // 更新影像总数和当前索引
      setTotalImages(imageIds.length);
      setCurrentImageIndex(0);

      // 渲染视口
      viewport.render();

      setStatus(
        `✅ 影像加载成功！当前显示第 1 张，共 ${imageIds.length} 张`
      );
      console.log('✅ 影像加载成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('❌ 影像加载失败:', err);
      setError(`影像加载失败: ${errorMessage}`);
      setStatus('影像加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理本地文件选择
   *
   * 允许用户上传本地的 DICOM 文件
   */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!renderingEngineRef.current) {
      setError('RenderingEngine 未初始化');
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus(`正在加载 ${files.length} 个本地文件...`);

    try {
      // 使用 wadouri.fileManager 添加文件并获取 ImageId
      const imageIds: string[] = [];
      for (const file of files) {
        const imageId = wadouri.fileManager.add(file);
        imageIds.push(imageId);
      }

      // 获取 Viewport 实例
      const viewport = renderingEngineRef.current.getStackViewport(
        'basic-viewer-viewport'
      );

      if (!viewport) {
        throw new Error('Viewport 未找到');
      }

      // 设置影像栈
      await viewport.setStack(imageIds, 0);

      // 更新影像总数和当前索引
      setTotalImages(imageIds.length);
      setCurrentImageIndex(0);

      // 渲染视口
      viewport.render();

      setStatus(`✅ 影像加载成功！共 ${imageIds.length} 张`);
      console.log('✅ 本地文件加载成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('❌ 本地文件加载失败:', err);
      setError(`本地文件加载失败: ${errorMessage}`);
      setStatus('文件加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <header style={styles.header}>
        <h1 style={styles.title}>Cornerstone3D 基础影像查看器</h1>
        <p style={styles.subtitle}>一个简单的 DICOM 影像查看器示例</p>
      </header>

      {/* 控制栏 */}
      <div style={styles.controls}>
        <button
          onClick={loadSampleImages}
          disabled={isLoading}
          style={styles.button}
        >
          {isLoading ? '加载中...' : '加载示例影像'}
        </button>

        {/* 换层按钮 - 用于测试 */}
        {totalImages > 1 && (
          <>
            <button
              onClick={async () => {
                if (renderingEngineRef.current && currentImageIndex > 0) {
                  const viewport = renderingEngineRef.current.getStackViewport(
                    'basic-viewer-viewport'
                  );
                  if (viewport) {
                    await viewport.setImageIdIndex(currentImageIndex - 1);
                    setCurrentImageIndex(currentImageIndex - 1);
                  }
                }
              }}
              disabled={currentImageIndex === 0}
              style={styles.button}
            >
              上一层
            </button>

            <button
              onClick={async () => {
                if (renderingEngineRef.current && currentImageIndex < totalImages - 1) {
                  const viewport = renderingEngineRef.current.getStackViewport(
                    'basic-viewer-viewport'
                  );
                  if (viewport) {
                    await viewport.setImageIdIndex(currentImageIndex + 1);
                    setCurrentImageIndex(currentImageIndex + 1);
                  }
                }
              }}
              disabled={currentImageIndex === totalImages - 1}
              style={styles.button}
            >
              下一层
            </button>
          </>
        )}

        <label htmlFor="file-input" style={styles.label}>
          <span
            style={{
              ...styles.button,
              display: 'inline-block',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            选择本地 DICOM 文件
          </span>
          <input
            id="file-input"
            type="file"
            accept=".dcm,application/dicom"
            multiple
            onChange={handleFileSelect}
            disabled={isLoading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* 视口容器 */}
      <div style={styles.viewportContainer}>
        <div
          ref={viewportRef}
          style={styles.viewport}
          className="no-select"
          data-viewport-id="basic-viewer-viewport"
        />
      </div>

      {/* 状态栏 */}
      <div style={styles.statusBar}>
        <span style={styles.status}>{status}</span>
        {totalImages > 0 && (
          <span style={styles.imageInfo}>
            影像：{currentImageIndex + 1} / {totalImages}
          </span>
        )}
        {error && <span style={styles.error}>❌ {error}</span>}
      </div>

      {/* 操作提示 */}
      <div style={styles.instructions}>
        <p>
          <strong>操作提示：</strong>
          左键拖拽调整窗宽窗位 | 中键拖拽平移 | 右键拖拽缩放 | 滚轮换层
        </p>
      </div>
    </div>
  );
}

// 样式定义
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    color: '#888',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  label: {
    margin: 0,
  },
  viewportContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    overflow: 'auto',
  },
  viewport: {
    width: '512px',
    height: '512px',
    backgroundColor: '#000000',
    border: '2px solid #333',
    borderRadius: '4px',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #333',
    fontSize: '12px',
  },
  status: {
    color: '#00ff00',
  },
  imageInfo: {
    color: '#00aaff',
    fontWeight: 'bold',
  },
  error: {
    color: '#ff0000',
  },
  instructions: {
    padding: '10px 20px',
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #333',
    fontSize: '12px',
    color: '#888',
    textAlign: 'center' as const,
  },
};

export default App;
