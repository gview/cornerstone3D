import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './MPRViewer';
import './index.css';

// 初始化 Cornerstone3D
import { init as cornerstoneInit } from '@cornerstonejs/core';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';

// 初始化 Cornerstone 核心
cornerstoneInit();

// 配置 DICOM Image Loader
dicomImageLoader.web.cornerstone = cornerstoneInit;

// 配置元数据提供器（可选）
// 这里可以根据需要添加自定义元数据提供器

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
