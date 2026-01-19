import React, { useEffect, useRef, useState } from 'react';
import { RenderingEngine, Enums, volumeLoader } from '@cornerstonejs/core';
import AxialViewport from './components/AxialViewport';
import SagittalViewport from './components/SagittalViewport';
import CoronalViewport from './components/CoronalViewport';
import { useMPRSynchronization } from './hooks/useMPRSynchronization';
import { useSlabThickness } from './hooks/useSlabThickness';
import { useObliqueRotation } from './hooks/useObliqueRotation';
import { initCornerstone } from './cornerstone/init';
import type { IVolume } from '@cornerstonejs/core/types';

// MPR 查看器主组件
function MPRViewer() {
  const axialRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);

  const [renderingEngine, setRenderingEngine] = useState<RenderingEngine | null>(null);
  const [volume, setVolume] = useState<IVolume | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 使用联动同步 Hook
  const { setupLinkedNavigation, cleanup: cleanupSync } = useMPRSynchronization({
    viewportIds: ['AXIAL', 'SAGITTAL', 'CORONAL'],
    renderingEngineId: 'mprEngine',
  });

  // 使用层厚调节 Hook
  const { slabThickness, setSlabThickness, slabMode, setSlabMode } = useSlabThickness({
    viewportIds: ['AXIAL', 'SAGITTAL', 'CORONAL'],
    renderingEngine,
  });

  // 使用斜位旋转 Hook
  const { rotateViewport, resetRotation } = useObliqueRotation({
    viewportIds: ['AXIAL', 'SAGITTAL', 'CORONAL'],
    renderingEngine,
  });

  // 初始化 Cornerstone3D 和加载 Volume 数据
  useEffect(() => {
    const initializeMPR = async () => {
      try {
        setIsLoading(true);

        // 初始化 Cornerstone3D
        await initCornerstone();

        // 准备图像 ID 列表（这里使用示例数据）
        // 实际应用中，你应该从 DICOM 服务器或本地文件加载
        const imageIds = createExampleImageIds();

        // 创建并缓存 Volume
        const volumeId = await volumeLoader.createAndCacheVolume(imageIds, {
          name: 'CT Volume',
          orientation: 'axial',
        });

        // 获取 Volume 实例
        const volumeInstance = (await import('@cornerstonejs/core')).cache.getVolume(volumeId);
        setVolume(volumeInstance!);

        // 创建渲染引擎
        const engine = new RenderingEngine('mprEngine');
        setRenderingEngine(engine);

        // 启用视口
        const viewportInputs = [
          {
            viewportId: 'AXIAL',
            element: axialRef.current!,
            type: Enums.ViewportType.ORTHOGRAPHIC,
            defaultView: Enums.ViewportInputType.AXIAL,
          },
          {
            viewportId: 'SAGITTAL',
            element: sagittalRef.current!,
            type: Enums.ViewportType.ORTHOGRAPHIC,
            defaultView: Enums.ViewportInputType.SAGITTAL,
          },
          {
            viewportId: 'CORONAL',
            element: coronalRef.current!,
            type: Enums.ViewportType.ORTHOGRAPHIC,
            defaultView: Enums.ViewportInputType.CORONAL,
          },
        ];

        engine.enableElements(viewportInputs);

        // 为每个视口设置 volume
        const viewports = engine.getViewports();
        for (const viewport of viewports) {
          viewport.setVolumes([{ volumeId }]);
        }

        // 渲染所有视口
        engine.renderAllViewports();

        // 设置联动导航
        setupLinkedNavigation();

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MPR viewer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMPR();

    // 清理函数
    return () => {
      if (renderingEngine) {
        renderingEngine.destroy();
      }
      cleanupSync();
    };
  }, []);

  // 创建示例图像 ID 列表
  // 注意：这是示例代码，实际应用中应该从真实的数据源加载
  const createExampleImageIds = (): string[] => {
    // 这里返回空数组作为示例
    // 实际应用中，你应该从以下来源加载：
    // 1. DICOMweb 服务器 (WADO-RS)
    // 2. 本地 DICOM 文件
    // 3. PACS 服务器
    return [];

    // 示例：从 DICOMweb 服务器加载
    // return Array.from({ length: 100 }, (_, i) =>
    //   `wadors:https://your-dicom-server.com/wado-rs/studies/1.2.840.113619.2.55.3/series/1.2.840.113619.2.55.3.1/instances/${i}`
    // );
  };

  // 处理层厚变化
  const handleSlabThicknessChange = (value: number) => {
    setSlabThickness(value);
  };

  // 处理投影模式变化
  const handleSlabModeChange = (mode: 'max' | 'min' | 'avg') => {
    setSlabMode(mode);
  };

  // 处理旋转
  const handleRotate = (angle: number, axis: 'x' | 'y' | 'z') => {
    rotateViewport('AXIAL', angle, axis);
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">正在加载 MPR 数据...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mpr-container">
      {/* 工具栏 */}
      <div className="mpr-toolbar">
        <button onClick={() => handleRotate(15, 'z')}>向左旋转 15°</button>
        <button onClick={() => handleRotate(-15, 'z')}>向右旋转 15°</button>
        <button onClick={() => handleRotate(15, 'x')}>向上旋转 15°</button>
        <button onClick={() => handleRotate(-15, 'x')}>向下旋转 15°</button>
        <button onClick={resetRotation}>重置旋转</button>
      </div>

      {/* 三个视口 */}
      <div className="mpr-viewports">
        <div className="viewport-container">
          <div className="viewport-label">横断位 (Axial)</div>
          <div
            ref={axialRef}
            className="viewport-element"
            id="axialViewport"
          />
        </div>

        <div className="viewport-container">
          <div className="viewport-label">矢状位 (Sagittal)</div>
          <div
            ref={sagittalRef}
            className="viewport-element"
            id="sagittalViewport"
          />
        </div>

        <div className="viewport-container">
          <div className="viewport-label">冠状位 (Coronal)</div>
          <div
            ref={coronalRef}
            className="viewport-element"
            id="coronalViewport"
          />
        </div>
      </div>

      {/* 控制面板 */}
      <div className="control-panel">
        <div className="control-group">
          <label>层厚 (mm):</label>
          <input
            type="range"
            min="1"
            max="20"
            value={slabThickness}
            onChange={(e) => handleSlabThicknessChange(Number(e.target.value))}
          />
          <span>{slabThickness}</span>
        </div>

        <div className="control-group">
          <label>投影模式:</label>
          <select
            value={slabMode}
            onChange={(e) => handleSlabModeChange(e.target.value as 'max' | 'min' | 'avg')}
          >
            <option value="max">最大强度投影 (MIP)</option>
            <option value="min">最小强度投影 (MinIP)</option>
            <option value="avg">平均投影</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default MPRViewer;
