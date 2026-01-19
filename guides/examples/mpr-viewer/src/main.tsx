import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './MPRViewer';

// 初始化 Cornerstone3D
import { initCornerstone } from './cornerstone/init';

// 应用启动时初始化，等待初始化完成后再渲染 App
initCornerstone().then(() => {
  console.log('✅ Cornerstone3D 初始化成功，正在渲染应用...');

  // 初始化成功后渲染 App
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}).catch((error) => {
  console.error('❌ Cornerstone3D 初始化失败:', error);

  // 初始化失败时显示错误信息
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>初始化失败</h1>
        <p>Cornerstone3D 初始化失败，请刷新页面重试。</p>
        <pre>{error.toString()}</pre>
      </div>
    </StrictMode>
  );
});
