import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// 导入 Cornerstone3D 核心库
import { init } from '@cornerstonejs/core';
import { init as initTools } from '@cornerstonejs/tools';
import { init as initDICOMLoader } from '@cornerstonejs/dicom-image-loader';

/**
 * 初始化 Cornerstone3D
 *
 * 这个函数执行以下操作：
 * 1. 初始化 Cornerstone3D 核心库
 * 2. 初始化工具系统
 * 3. 注册 DICOM 影像加载器
 *
 * 必须在使用任何 Cornerstone3D API 之前完成初始化。
 */
async function initializeCornerstone() {
  try {
    // 初始化核心库
    // 配置渲染引擎模式为 'contextPool'，这是推荐的配置
    await init({
      core: {
        renderingEngineMode: 'contextPool', // 使用 WebGL 上下文池模式
      },
    });

    // 初始化工具系统
    initTools();

    // 注册 DICOM 影像加载器（WADO-RS 协议）
    initDICOMLoader();

    console.log('✅ Cornerstone3D 初始化成功！');
  } catch (error) {
    console.error('❌ Cornerstone3D 初始化失败:', error);
    throw error; // 重新抛出错误，让调用者处理
  }
}

/**
 * 应用启动函数
 */
async function bootstrap() {
  try {
    // 初始化 Cornerstone3D
    await initializeCornerstone();

    // 创建 React 根容器并渲染应用
    const container = document.getElementById('root');
    if (!container) {
      throw new Error('未找到 root 元素');
    }

    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('应用启动失败:', error);
    // 在页面上显示错误信息（仅用于开发环境）
    if (import.meta.env.DEV) {
      const container = document.getElementById('root');
      if (container) {
        container.innerHTML = `
          <div style="padding: 20px; color: white;">
            <h1>❌ 应用启动失败</h1>
            <p>错误信息: ${error instanceof Error ? error.message : String(error)}</p>
            <p>请检查浏览器控制台获取详细信息。</p>
          </div>
        `;
      }
    }
  }
}

// 启动应用
bootstrap();
