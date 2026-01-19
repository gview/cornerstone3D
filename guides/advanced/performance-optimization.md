# 性能优化指南

**目标**: 学习如何优化 Cornerstone3D 应用的性能

**预计时间**: 60 分钟

**难度**: 高级

**前置要求**:
- [x] 已完成 [第一个影像查看器](../getting-started/first-viewer.md)
- [x] 已完成 [基本交互](../getting-started/basic-interactions.md)
- [x] 了解浏览器性能优化基础

---

## 概述

医学影像应用通常需要处理大型数据集和高分辨率影像，性能优化至关重要。本指南将帮助你优化 Cornerstone3D 应用的性能，确保流畅的用户体验。

**性能目标**:
- 🎯 **首屏加载时间**: < 2 秒
- 🎯 **影像加载时间**: < 500 ms/张
- 🎯 **交互响应时间**: < 16 ms（60 FPS）
- 🎯 **内存占用**: < 1 GB（10 张 CT 影像）

**优化维度**:
- 📦 **缓存优化**: imageCache、volumeCache 配置
- ⚡ **懒加载**: 按需加载影像数据
- 🧵 **Web Worker**: 将计算密集型任务移至后台线程
- 💾 **内存管理**: 及时清理资源，避免内存泄漏
- 🎨 **渲染优化**: 减少 re-render，使用 requestAnimationFrame
- 🌐 **网络优化**: 批量查询、分页加载、压缩传输

---

## 性能分析工具

### 1.1 浏览器开发者工具

```typescript
// 使用 Performance API 测量性能
performance.mark('image-load-start');

await viewport.setStack(imageIds, 0);

performance.mark('image-load-end');
performance.measure('image-load', 'image-load-start', 'image-load-end');

const measure = performance.getEntriesByName('image-load')[0];
console.log(`影像加载耗时: ${measure.duration.toFixed(2)} ms`);
```

### 1.2 Cornerstone3D 性能监控

```typescript
import { eventTarget, Enums } from '@cornerstonejs/core';

// 监听影像加载事件
eventTarget.addEventListener(Enums.Events.IMAGE_LOADED, (event) => {
  const { imageId, imageLoadObject } = event.detail;

  console.log('✅ 影像加载完成:', imageId);
  console.log('加载时间:', imageLoadObject.timeStamp, 'ms');
});

// 监听影像加载失败事件
eventTarget.addEventListener(Enums.Events.IMAGE_LOAD_FAILED, (event) => {
  console.error('❌ 影像加载失败:', event.detail.imageId);
});
```

### 1.3 内存监控

```typescript
// 使用 Performance API 监控内存
if (performance.memory) {
  console.log('已使用内存:', (performance.memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
  console.log('内存限制:', (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2), 'MB');
}
```

---

## 2. 缓存优化

### 2.1 配置 Image Cache

影像缓存是性能优化的关键。合理配置缓存可以显著提高影像加载速度。

```typescript
import { init } from '@cornerstonejs/core';

// 初始化时配置缓存
await init({
  cache: {
    // 最大缓存影像数量
    maximumSizeInBytes: 1024 * 1024 * 1024, // 1 GB

    // 单个影像的最大缓存大小（超过则不缓存）
    imageLoadCache: {
      maxCacheSize: 200, // 最多缓存 200 张影像
    },

    // 缓存淘汰策略
    cachePrevention: {
      enabled: false, // 禁用缓存预防（默认启用）
    },
  },
});
```

### 2.2 配置 Volume Cache

对于 3D 体渲染，配置体积缓存：

```typescript
import { init } from '@cornerstonejs/core';

await init({
  cache: {
    // 体积缓存配置
    volumeCache: {
      // 最大缓存体积数量
      maximumSizeInBytes: 1024 * 1024 * 1024, // 1 GB

      // 单个体积的最大缓存大小
      maxCacheSize: 10, // 最多缓存 10 个体积
    },
  },
});
```

### 2.3 缓存预热

```typescript
// 预加载即将查看的影像
const preloadImages = async (imageIds: string[]) => {
  for (const imageId of imageIds) {
    try {
      await imageLoader.loadImage(imageId);
      console.log('✅ 预加载成功:', imageId);
    } catch (error) {
      console.error('❌ 预加载失败:', imageId, error);
    }
  }
};

// 预加载前 10 张影像
preloadImages(imageIds.slice(0, 10));
```

---

## 3. 懒加载策略

### 3.1 按需加载影像

不要一次性加载所有影像，而是按需加载：

```typescript
// 只加载当前影像和前后各 2 张
const loadImagesAroundIndex = async (currentIndex: number) => {
  const start = Math.max(0, currentIndex - 2);
  const end = Math.min(imageIds.length, currentIndex + 3);

  const imagesToLoad = imageIds.slice(start, end);

  for (const imageId of imagesToLoad) {
    try {
      await imageLoader.loadImage(imageId);
    } catch (error) {
      console.error('加载失败:', imageId, error);
    }
  }
};

// 监听切片滚动事件
eventTarget.addEventListener(Enums.Events.STACK_SCROLL, async (event) => {
  const { imageIdIndex } = event.detail;
  await loadImagesAroundIndex(imageIdIndex);
});
```

### 3.2 视口懒加载

```typescript
// 使用 Intersection Observer 检测视口可见性
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // 视口可见，加载影像
      const viewportId = entry.target.id;
      const viewport = renderingEngine.getViewport(viewportId);
      viewport.render();
    } else {
      // 视口不可见，释放资源
      const viewportId = entry.target.id;
      const viewport = renderingEngine.getViewport(viewportId);
      // 可选：释放影像缓存
    }
  });
});

// 观察视口元素
observer.observe(document.getElementById('viewport-1')!);
```

---

## 4. Web Worker

### 4.1 使用 Web Worker 处理计算密集型任务

```typescript
// worker.js - Web Worker 文件
self.addEventListener('message', async (event) => {
  const { imageIds } = event.data;

  // 在 Worker 中加载影像
  const results = [];
  for (const imageId of imageIds) {
    const image = await loadImage(imageId);
    results.push(image);
  }

  // 将结果发送回主线程
  self.postMessage({ results });
});

// 主线程中使用 Worker
const worker = new Worker('worker.js');

worker.postMessage({ imageIds: imageIds.slice(0, 10) });

worker.addEventListener('message', (event) => {
  const { results } = event.data;
  console.log('Worker 加载完成:', results.length, '张影像');
});
```

### 4.2 在 Worker 中进行影像处理

```typescript
// worker.js
self.addEventListener('message', async (event) => {
  const { operation, imageData } = event.data;

  let result;

  switch (operation) {
    case 'window-level':
      // 在 Worker 中调整窗宽窗位
      result = applyWindowLevel(imageData, event.detail.windowLevel);
      break;

    case 'filter':
      // 在 Worker 中应用滤镜
      result = applyFilter(imageData, event.detail.filterType);
      break;

    default:
      result = imageData;
  }

  self.postMessage({ result });
});
```

---

## 5. 内存管理

### 5.1 及时清理资源

```typescript
// 销毁视口时清理资源
const cleanup = () => {
  // 销毁渲染引擎
  renderingEngine.destroy();

  // 清除影像缓存
  imageCache.purgeCache();

  // 清除体积缓存
  volumeCache.purgeCache();

  // 移除事件监听器
  eventTarget.removeEventListener(Enums.Events.IMAGE_LOADED, handleImageLoaded);
};

// 在组件卸载时清理
useEffect(() => {
  return () => {
    cleanup();
  };
}, []);
```

### 5.2 避免内存泄漏

```typescript
// ❌ 错误：未清理事件监听器
eventTarget.addEventListener(Enums.Events.IMAGE_LOADED, (event) => {
  console.log('影像加载完成:', event.detail.imageId);
});

// ✅ 正确：保存监听器引用并在清理时移除
const handleImageLoaded = (event: any) => {
  console.log('影像加载完成:', event.detail.imageId);
};

eventTarget.addEventListener(Enums.Events.IMAGE_LOADED, handleImageLoaded);

// 清理时移除
eventTarget.removeEventListener(Enums.Events.IMAGE_LOADED, handleImageLoaded);
```

### 5.3 限制缓存大小

```typescript
// 定期检查内存使用情况
setInterval(() => {
  if (performance.memory) {
    const usedMemory = performance.memory.usedJSHeapSize;
    const memoryLimit = performance.memory.jsHeapSizeLimit;
    const usagePercent = (usedMemory / memoryLimit) * 100;

    if (usagePercent > 80) {
      console.warn('⚠️ 内存使用超过 80%，清理缓存');
      imageCache.purgeCache();
    }
  }
}, 30000); // 每 30 秒检查一次
```

---

## 6. 渲染优化

### 6.1 使用 requestAnimationFrame

```typescript
// ✅ 使用 requestAnimationFrame 进行渲染
const renderViewport = () => {
  viewport.render();
  requestAnimationFrame(renderViewport);
};

// ❌ 避免使用 setInterval 进行渲染
setInterval(() => {
  viewport.render();
}, 16); // 不推荐
```

### 6.2 减少 re-render

```typescript
// React 中使用 useMemo 和 useCallback 减少重新渲染
const MyComponent = ({ imageIds }) => {
  // 缓存计算结果
  const processedImageIds = useMemo(() => {
    return imageIds.map(processImageId);
  }, [imageIds]);

  // 缓存回调函数
  const handleImageLoaded = useCallback((event) => {
    console.log('影像加载完成:', event.detail.imageId);
  }, []);

  useEffect(() => {
    eventTarget.addEventListener(Enums.Events.IMAGE_LOADED, handleImageLoaded);

    return () => {
      eventTarget.removeEventListener(Enums.Events.IMAGE_LOADED, handleImageLoaded);
    };
  }, [handleImageLoaded]);

  return <div>{/* ... */}</div>;
};
```

### 6.3 降低渲染质量以提高性能

```typescript
// 降低渲染质量
const viewport = renderingEngine.getViewport('my-viewport') as Types.IVolumeViewport;

await viewport.setProperties({
  // 降低渲染分辨率
  displaySetOptions: {
    lowResRendering: true, // 使用低分辨率渲染
  },
});

viewport.render();
```

---

## 7. 网络优化

### 7.1 使用 DICOMweb 批量查询

```typescript
// 使用 DICOMweb 的批量查询 API
const fetchSeriesMetadata = async (studyInstanceUID: string) => {
  const url = `${DICOMwebBaseUrl}/studies/${studyInstanceUID}/series`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/dicom+json',
    },
  });

  const series = await response.json();
  return series;
};
```

### 7.2 分页加载

```typescript
// 分页加载影像
const loadImagesInPages = async (imageIds: string[], pageSize: number = 10) => {
  for (let i = 0; i < imageIds.length; i += pageSize) {
    const page = imageIds.slice(i, i + pageSize);

    // 加载当前页
    await Promise.all(page.map(async (imageId) => {
      await imageLoader.loadImage(imageId);
    }));

    console.log(`已加载 ${Math.min(i + pageSize, imageIds.length)} / ${imageIds.length} 张影像`);
  }
};

// 使用分页加载
loadImagesInPages(imageIds, 10);
```

### 7.3 使用压缩传输

```typescript
// 启用 gzip 压缩
const fetchWithCompression = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
    },
  });

  return response.json();
};
```

---

## 8. 性能监控面板

创建一个实时性能监控面板：

```typescript
import React, { useState, useEffect } from 'react';

const PerformanceMonitor = () => {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);
  const [imageCacheSize, setImageCacheSize] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const updateFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(updateFPS);
    };

    updateFPS();

    // 监控内存使用
    const memoryInterval = setInterval(() => {
      if (performance.memory) {
        setMemory(Math.round(performance.memory.usedJSHeapSize / 1048576));
      }
    }, 1000);

    // 监控影像缓存
    const cacheInterval = setInterval(() => {
      const cacheSize = imageCache.getCacheInfo().size;
      setImageCacheSize(cacheSize);
    }, 1000);

    return () => {
      clearInterval(memoryInterval);
      clearInterval(cacheInterval);
    };
  }, []);

  return (
    <div style={{ padding: '16px', border: '1px solid #ccc' }}>
      <h3>性能监控</h3>

      <div>
        <p>FPS: {fps}</p>
        <p>内存: {memory} MB</p>
        <p>影像缓存: {imageCacheSize} 张</p>
      </div>

      <div>
        <button onClick={() => imageCache.purgeCache()}>
          清除影像缓存
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
```

---

## 9. 常见性能问题

### Q1: 影像加载很慢？

**可能原因**:
- 网络带宽不足
- DICOM 服务器响应慢
- 未使用缓存

**解决方案**:
- ✅ 使用 imageCache 预加载影像
- ✅ 使用 CDN 加速
- ✅ 压缩 DICOM 数据传输

### Q2: 应用卡顿？

**可能原因**:
- 内存泄漏
- 渲染频率过高
- 未使用 Web Worker

**解决方案**:
- ✅ 检查并修复内存泄漏
- ✅ 使用 requestAnimationFrame 控制渲染频率
- ✅ 将计算密集型任务移至 Web Worker

### Q3: 内存占用过高？

**可能原因**:
- 缓存配置过大
- 未及时清理资源
- 内存泄漏

**解决方案**:
- ✅ 降低 imageCache 大小
- ✅ 及时清理不需要的影像
- ✅ 定期调用 imageCache.purgeCache()

---

## 10. 性能优化检查清单

在部署应用前，确保完成以下优化：

### 缓存优化
- [ ] 配置了合理的 imageCache 大小
- [ ] 配置了合理的 volumeCache 大小
- [ ] 实现了缓存预热机制
- [ ] 实现了缓存清理机制

### 加载优化
- [ ] 实现了按需加载
- [ ] 实现了懒加载
- [ ] 实现了分页加载
- [ ] 使用了 DICOMweb 批量查询

### 渲染优化
- [ ] 使用了 requestAnimationFrame
- [ ] 减少了不必要的 re-render
- [ ] 降低了渲染质量（如需要）

### 内存优化
- [ ] 及时清理了事件监听器
- [ ] 及时清理了视口资源
- [ ] 定期清理了缓存
- [ ] 使用了 Web Worker 处理计算密集型任务

### 网络优化
- [ ] 使用了压缩传输
- [ ] 实现了分页加载
- [ ] 使用了 CDN（如适用）

---

## 11. 下一步

- 🔗 [多视口同步](./multi-viewport.md) - 优化多视口性能
- 🤖 [AI 集成](./ai-integration.md) - 优化 AI 模型推理性能
- 🛠️ [自定义工具](./custom-tools.md) - 优化工具性能

---

## 相关资源

- 📚 [官方文档 - Performance](https://www.cornerstonejs.org/docs/concepts/performance)
- 📊 [Chrome DevTools - Performance](https://developer.chrome.com/docs/devtools/performance/)
- 💻 [示例项目 - 性能优化](../examples/advanced-viewer/)

---

**需要帮助？** 查看 [故障排查文档](../troubleshooting/common-errors.md)
