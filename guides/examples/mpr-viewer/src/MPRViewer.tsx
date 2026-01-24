import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RenderingEngine, Enums, volumeLoader, Types, setVolumesForViewports, utilities, metaData } from '@cornerstonejs/core';
import { getImageSliceDataForVolumeViewport } from '@cornerstonejs/core/utilities';
import {
  ToolGroupManager,
  addTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
  CrosshairsTool,
  WindowLevelTool,
  LengthTool,
  AngleTool,
  BidirectionalTool,
  ProbeTool,
  RectangleROITool,
  EllipticalROITool,
  ScaleOverlayTool,
  Enums as csToolsEnums,
} from '@cornerstonejs/tools';
import { wadouri } from '@cornerstonejs/dicom-image-loader';
import { annotation } from '@cornerstonejs/tools';
import { eventTarget } from '@cornerstonejs/core';

const { selection } = annotation;
import { useSlabThickness } from './hooks/useSlabThickness';
import { useObliqueRotation } from './hooks/useObliqueRotation';
import { initCornerstone } from './cornerstone/init';
import AnnotationsPanel from './components/AnnotationsPanel';
import SeriesPanel, { SeriesInfo } from './components/SeriesPanel';
import Toolbar from './components/Toolbar';
import ViewportOverlay from './components/ViewportOverlay';
import { generateThumbnailsForSeries } from './utils/thumbnailGenerator';
import { dynamicViewportManager, DualSequenceConfig } from './utils/dynamicViewportManager';
import type { IVolume } from '@cornerstonejs/core/types';
import type { ViewportLayout } from './components/panels';

const { MouseBindings, ToolModes } = csToolsEnums;

// 辅助函数：根据布局类型获取网格列定义
const getGridTemplateColumns = (layout: ViewportLayout): string => {
  const match = layout.match(/grid-(\d+)x(\d+)/);
  if (match) {
    const cols = parseInt(match[2]);  // 第二个数字是列数
    return Array(cols).fill('1fr').join(' ');
  }
  // 特殊布局：grid-1-2 (左边大视口，右边上下两个小视口)
  if (layout === 'grid-1-2') {
    return '2fr 1fr'; // 左侧占 2/3，右侧占 1/3
  }
  return '1fr 1fr'; // 默认 2 列
};

// 辅助函数：根据布局类型获取网格行定义
const getGridTemplateRows = (layout: ViewportLayout): string => {
  const match = layout.match(/grid-(\d+)x(\d+)/);
  if (match) {
    const rows = parseInt(match[1]);  // 第一个数字是行数
    return Array(rows).fill('1fr').join(' ');
  }
  // 特殊布局：grid-1-2 (左边大视口，右边上下两个小视口)
  if (layout === 'grid-1-2') {
    return '1fr 1fr'; // 右侧分为上下两行
  }
  return '1fr 1fr'; // 默认 2 行
};

// 辅助函数：根据布局类型计算视口数量
const getViewportCountFromLayout = (layout: ViewportLayout): number => {
  const match = layout.match(/grid-(\d+)x(\d+)/);
  if (match) {
    const rows = parseInt(match[1]);
    const cols = parseInt(match[2]);
    return rows * cols;
  }
  // 特殊布局：grid-1-2 (3个视口)
  if (layout === 'grid-1-2') {
    return 3;
  }
  // 对于协议布局，返回默认值（根据需要调整）
  return 3; // 默认 MPR 三视图
};

// MPR 查看器主组件
function MPRViewer() {
  const axialRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportsGridRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [renderingEngine, setRenderingEngine] = useState<RenderingEngine | null>(null);
  const [volume, setVolume] = useState<IVolume | null>(null);
  const [volumeId, setVolumeId] = useState<string | null>(null); // 当前 volume ID
  const [secondaryVolumeId, setSecondaryVolumeId] = useState<string | null>(null); // 第二个 volume ID（用于双序列布局）
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>(WindowLevelTool.toolName);
  const [isWindowLevelActive, setIsWindowLevelActive] = useState<boolean>(true);
  const [showScale, setShowScale] = useState<boolean>(true);
  const [scaleLocation, setScaleLocation] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(false);
  const [showSeriesPanel, setShowSeriesPanel] = useState<boolean>(false);
  const [isSeriesPanelCollapsed, setIsSeriesPanelCollapsed] = useState<boolean>(false);
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState<boolean>(false);
  const [isAnnotationsPanelCollapsed, setIsAnnotationsPanelCollapsed] = useState<boolean>(false);
  const [annotationsPanelPosition, setAnnotationsPanelPosition] = useState<'left' | 'right'>('right');
  const [seriesList, setSeriesList] = useState<SeriesInfo[]>([]);
  const [currentSeriesUID, setCurrentSeriesUID] = useState<string | null>(null);

  // 视口布局状态
  const [currentLayout, setCurrentLayout] = useState<ViewportLayout>('grid-1x3');

  // 动态视口 ID 列表（初始为3视口MPR布局）
  const [viewportIds, setViewportIds] = useState<string[]>(['AXIAL', 'SAGITTAL', 'CORONAL']);

  // 激活视口状态
  const [activeViewportId, setActiveViewportId] = useState<string>('AXIAL');

  // 放大模式状态
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [maximizedViewportId, setMaximizedViewportId] = useState<string | null>(null);
  const [layoutBeforeMaximize, setLayoutBeforeMaximize] = useState<ViewportLayout>('grid-1x3');

  // 当前图像索引状态（用于每个视口）
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({
    AXIAL: 0,
    SAGITTAL: 0,
    CORONAL: 0,
  });

  // 总切片数状态（用于每个视口）
  const [totalSlicesForViewports, setTotalSlicesForViewports] = useState<Record<string, number>>({
    AXIAL: 0,
    SAGITTAL: 0,
    CORONAL: 0,
  });

  // 当前方位状态（用于每个视口）
  const [viewportOrientations, setViewportOrientations] = useState<Record<string, Enums.OrientationAxis>>({
    AXIAL: Enums.OrientationAxis.AXIAL,
    SAGITTAL: Enums.OrientationAxis.SAGITTAL,
    CORONAL: Enums.OrientationAxis.CORONAL,
  });

  // 当前窗宽窗位状态（用于显示）
  const [windowLevels, setWindowLevels] = useState<Record<string, { center: number; width: number }>>({
    AXIAL: { center: 40, width: 400 },
    SAGITTAL: { center: 40, width: 400 },
    CORONAL: { center: 40, width: 400 },
  });

  // 工具模式状态：记录每个工具的当前模式
  const [toolModes, setToolModes] = useState<Record<string, string>>({
    Crosshairs: ToolModes.Disabled,
    WindowLevel: ToolModes.Active,
    Length: ToolModes.Passive,
    Angle: ToolModes.Passive,
    Bidirectional: ToolModes.Passive,
    Probe: ToolModes.Passive,
    RectangleROI: ToolModes.Passive,
    EllipticalROI: ToolModes.Passive,
  });

  // 使用层厚调节 Hook
  const { slabThickness, setSlabThickness, slabMode, setSlabMode } = useSlabThickness({
    viewportIds,
    renderingEngine,
  });

  // 使用斜位旋转 Hook
  const { rotateViewport, resetRotation } = useObliqueRotation({
    viewportIds,
    renderingEngine,
  });

  // 初始化 Cornerstone3D
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        // 初始化 Cornerstone3D
        await initCornerstone();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Cornerstone3D:', error);
        setError('初始化失败，请刷新页面重试');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // 设置 ResizeObserver 监听视口大小变化
  useEffect(() => {
    if (!renderingEngine || !viewportsGridRef.current) {
      return;
    }

    let resizeTimeout: NodeJS.Timeout | null = null;

    const resizeHandler = () => {
      if (resizeTimeout) {
        return;
      }

      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;

        if (renderingEngine) {
          // 获取当前视口的显示状态
          const viewports = renderingEngine.getViewports();
          const presentations = viewports.map((viewport) =>
            (viewport as Types.IVolumeViewport).getViewPresentation()
          );

          // 调用 resize 方法调整渲染引擎
          renderingEngine.resize(true, false);

          // 恢复视口的显示状态
          viewports.forEach((viewport, idx) => {
            (viewport as Types.IVolumeViewport).setViewPresentation(presentations[idx]);
          });

          console.log('✅ 视口大小已调整');
        }
      }, 100);
    };

    // 创建 ResizeObserver
    const resizeObserver = new ResizeObserver(resizeHandler);
    resizeObserverRef.current = resizeObserver;

    // 监听视口容器
    resizeObserver.observe(viewportsGridRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [renderingEngine]);

  // 监听视口窗宽窗位变化 - 使用 Cornerstone3D 事件系统（无延迟）
  useEffect(() => {
    if (!renderingEngine || !volume) return;

    const handlers: Array<{ element: HTMLElement; handler: (event: any) => void }> = [];

    // 处理 VOI_MODIFIED 事件
    const handleVOIModified = (viewportId: string) => (event: any) => {
      const { range } = event.detail;

      if (!range) return;

      // 将 range 转换为窗宽窗位
      const width = range.upper - range.lower;
      const center = (range.upper + range.lower) / 2;

      // 直接从事件中获取窗宽窗位，无需重新查询
      setWindowLevels((prev) => {
        const current = prev[viewportId];
        if (current?.center !== center || current?.width !== width) {
          return {
            ...prev,
            [viewportId]: { center, width },
          };
        }
        return prev;
      });
    };

    // 为每个视口添加事件监听（使用动态 viewportIds）
    viewportIds.forEach((viewportId) => {
      const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
      if (!viewport || !viewport.element) return;

      const element = viewport.element;
      const handler = handleVOIModified(viewportId);

      // 监听 VOI_MODIFIED 事件 - 这是 Cornerstone3D 内置的事件
      // 当窗宽窗位改变时会自动触发，携带 range 信息
      element.addEventListener(Enums.Events.VOI_MODIFIED, handler);

      handlers.push({ element, handler });
    });

    // 初始化时获取一次
    viewportIds.forEach((viewportId) => {
      try {
        const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
        if (!viewport) return;

        const properties = viewport.getProperties();

        if (properties.voiRange) {
          const width = properties.voiRange.upper - properties.voiRange.lower;
          const center = (properties.voiRange.upper + properties.voiRange.lower) / 2;

          setWindowLevels((prev) => ({
            ...prev,
            [viewportId]: { center, width },
          }));
        }
      } catch (error) {
        // 忽略错误
      }
    });

    return () => {
      // 清理事件监听器
      handlers.forEach(({ element, handler }) => {
        element.removeEventListener(Enums.Events.VOI_MODIFIED, handler);
      });
    };
  }, [renderingEngine, volume, viewportIds]);

  // 监听视口切片位置变化 - 使用 Cornerstone3D 事件系统（无延迟）
  useEffect(() => {
    if (!renderingEngine || !volume) return;

    const handlers: Array<{ element: HTMLElement; handler: (event: any) => void }> = [];

    // 处理 VOLUME_NEW_IMAGE 事件
    const handleVolumeNewImage = (viewportId: string) => (event: any) => {
      const { imageIndex, numberOfSlices } = event.detail;

      // 直接从事件中获取索引和总数，无需重新计算
      setCurrentImageIndices((prev) => {
        if (prev[viewportId] !== imageIndex) {
          return {
            ...prev,
            [viewportId]: imageIndex,
          };
        }
        return prev;
      });

      setTotalSlicesForViewports((prev) => {
        if (prev[viewportId] !== numberOfSlices) {
          return {
            ...prev,
            [viewportId]: numberOfSlices,
          };
        }
        return prev;
      });
    };

    // 为每个视口添加事件监听（使用动态 viewportIds）
    viewportIds.forEach((viewportId) => {
      const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
      if (!viewport || !viewport.element) return;

      const element = viewport.element;
      const handler = handleVolumeNewImage(viewportId);

      // 监听 VOLUME_NEW_IMAGE 事件 - 这是 Cornerstone3D 内置的事件
      // 当相机焦点位置改变时会自动触发，携带 imageIndex 和 numberOfSlices
      element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);

      handlers.push({ element, handler });
    });

    // 初始化时获取一次
    viewportIds.forEach((viewportId) => {
      try {
        const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
        if (!viewport) return;

        const sliceData = getImageSliceDataForVolumeViewport(viewport);
        if (!sliceData) return;

        const { imageIndex, numberOfSlices } = sliceData;

        setCurrentImageIndices((prev) => ({
          ...prev,
          [viewportId]: imageIndex,
        }));

        setTotalSlicesForViewports((prev) => ({
          ...prev,
          [viewportId]: numberOfSlices,
        }));
      } catch (error) {
        // 忽略错误
      }
    });

    return () => {
      // 清理事件监听器
      handlers.forEach(({ element, handler }) => {
        element.removeEventListener(Enums.Events.VOLUME_NEW_IMAGE, handler);
      });
    };
  }, [renderingEngine, volume, viewportIds]);

  // 更新动态视口的信息覆盖层
  useEffect(() => {
    // 只在动态布局时执行
    if (currentLayout === 'grid-1x3' && viewportIds[0] === 'AXIAL') {
      return; // 使用静态结构，不需要更新
    }

    viewportIds.forEach((viewportId) => {
      const infoOverlay = document.getElementById(`${viewportId}-info`);
      if (!infoOverlay) return;

      const imageIndex = currentImageIndices[viewportId] ?? 0;
      const totalSlices = totalSlicesForViewports[viewportId] ?? 0;
      const windowCenter = windowLevels[viewportId]?.center ?? 40;
      const windowWidth = windowLevels[viewportId]?.width ?? 400;

      const imageInfo = infoOverlay.querySelector('.image-info');
      const windowInfo = infoOverlay.querySelector('.window-info');

      if (imageInfo) {
        imageInfo.textContent = `Image: ${imageIndex + 1} / ${totalSlices}`;
      }
      if (windowInfo) {
        windowInfo.textContent = `W/L: ${windowCenter.toFixed(0)} / ${windowWidth.toFixed(0)}`;
      }
    });
  }, [currentLayout, viewportIds, currentImageIndices, totalSlicesForViewports, windowLevels]);

  // 加载本地 DICOM 文件并创建 Volume
  const loadLocalFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log(`正在加载 ${files.length} 个 DICOM 文件...`);

      // 使用 wadouri.fileManager 添加文件并获取 ImageId
      const newImageIds: string[] = [];
      for (const file of files) {
        const imageId = wadouri.fileManager.add(file);
        newImageIds.push(imageId);
      }

      setImageIds(newImageIds);
      console.log(`✅ 成功加载 ${newImageIds.length} 张 DICOM 文件`);

      // 预加载所有图像的元数据
      console.log('⏳ 正在预加载 DICOM 元数据...');
      await Promise.all(
        newImageIds.map(async (imageId) => {
          await new Promise<void>((resolve, reject) => {
            const imageLoadObject = wadouri.loadImage(imageId);
            imageLoadObject.promise
              .then(() => resolve())
              .catch((err) => {
                console.error(`❌ 加载失败: ${imageId}`, err);
                reject(err);
              });
          });
        })
      );
      console.log('✅ 所有 DICOM 元数据加载完成');

      // 提取序列信息并添加到列表
      const seriesInfoMap = new Map<string, SeriesInfo>();

      for (const imageId of newImageIds) {
        try {
          const seriesModule = metaData.get('seriesModule', imageId);
          const generalSeriesModule = metaData.get('generalSeriesModule', imageId);
          const generalStudyModule = metaData.get('generalStudyModule', imageId);
          const patientModule = metaData.get('patientModule', imageId);


          // 尝试多种方式获取序列信息
          if (generalSeriesModule) {
            // generalSeriesModule 通常包含大部分序列信息
            const seriesInstanceUID = generalSeriesModule.seriesInstanceUID ||
                                     (seriesModule && seriesModule.seriesInstanceUID) ||
                                     `series-${generalSeriesModule.seriesNumber || 1}-${generalSeriesModule.modality || 'UN'}`;

            if (!seriesInfoMap.has(seriesInstanceUID)) {
              seriesInfoMap.set(seriesInstanceUID, {
                seriesInstanceUID,
                seriesNumber: generalSeriesModule.seriesNumber || 0,
                seriesDescription: generalSeriesModule.seriesDescription || '未命名序列',
                modality: generalSeriesModule.modality || 'UN',
                numberOfImages: 1,
                imageIds: [imageId],
                StudyInstanceUID: seriesModule?.StudyInstanceUID || generalSeriesModule.studyInstanceUID,
                // 添加检查信息
                studyDescription: generalStudyModule?.studyDescription,
                studyDate: generalStudyModule?.studyDate,
                studyTime: generalStudyModule?.studyTime,
                // 添加患者信息
                patientName: patientModule?.patientName?.Alphabetic || patientModule?.patientName,
                patientId: patientModule?.patientId,
              });
              console.log(`  ✅ 新序列: ${generalSeriesModule.seriesNumber} - ${generalSeriesModule.seriesDescription}`);
            } else {
              const seriesInfo = seriesInfoMap.get(seriesInstanceUID)!;
              seriesInfo.imageIds.push(imageId);
              seriesInfo.numberOfImages = seriesInfo.imageIds.length;
            }
          } else {
            // 如果标准元数据获取失败，使用一个通用的 fallback 序列
            console.warn(`⚠️ 标准序列元数据获取失败，使用通用序列`);

            // 使用时间戳创建唯一的 UID，确保每次加载都有新的序列
            const fallbackSeriesUID = `fallback-series-${Date.now()}`;

            if (!seriesInfoMap.has(fallbackSeriesUID)) {
              seriesInfoMap.set(fallbackSeriesUID, {
                seriesInstanceUID: fallbackSeriesUID,
                seriesNumber: seriesInfoMap.size + 1, // 使用当前序列数量作为序列号
                seriesDescription: `DICOM Series ${seriesInfoMap.size + 1}`,
                modality: 'CT',
                numberOfImages: 1,
                imageIds: [imageId],
                // 添加检查和患者信息
                studyDescription: generalStudyModule?.studyDescription,
                studyDate: generalStudyModule?.studyDate,
                studyTime: generalStudyModule?.studyTime,
                patientName: patientModule?.patientName?.Alphabetic || patientModule?.patientName,
                patientId: patientModule?.patientId,
              });
              console.log(`  ✅ 创建通用序列: ${fallbackSeriesUID}`);
            } else {
              const seriesInfo = seriesInfoMap.get(fallbackSeriesUID)!;
              seriesInfo.imageIds.push(imageId);
              seriesInfo.numberOfImages = seriesInfo.imageIds.length;
              console.log(`  ➕ 添加到通用序列 (${seriesInfo.numberOfImages} 张图像)`);
            }
          }
        } catch (error) {
          console.warn(`无法提取 ${imageId} 的序列信息:`, error);
        }
      }

      console.log(`📊 总共提取 ${seriesInfoMap.size} 个序列`);

      // 将新的序列添加到列表中
      const newSeriesList = Array.from(seriesInfoMap.values());

      // 生成缩略图
      console.log('🎨 开始生成序列缩略图...');
      await generateThumbnailsForSeries(newSeriesList);
      console.log('✅ 序列缩略图生成完成');

      setSeriesList((prev) => {
        // 合并序列列表，避免重复
        const existingUIDs = new Set(prev.map(s => s.seriesInstanceUID));
        const uniqueNewSeries = newSeriesList.filter(s => !existingUIDs.has(s.seriesInstanceUID));
        const updatedList = [...prev, ...uniqueNewSeries];

        console.log(`📝 序列列表更新: ${prev.length} -> ${updatedList.length}`);

        return updatedList;
      });

      // 显示序列面板
      setShowSeriesPanel(true);

      // 创建体积数据
      const volumeId = `my-volume-id-${Date.now()}`;
      console.log('📦 正在创建体积数据...');

      const volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds: newImageIds,
      });

      // 关键步骤:调用 volume.load() 开始加载体积数据
      volume.load();
      console.log('✅ 开始加载体积数据...');

      // 合并状态更新
      setVolume(volume);
      setVolumeId(volumeId); // 保存 volume ID
      if (newSeriesList.length > 0) {
        setCurrentSeriesUID(newSeriesList[0].seriesInstanceUID);
      }

      // 等待 DOM 更新，确保视口元素已渲染
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证 DOM 元素是否存在
      if (!axialRef.current || !sagittalRef.current || !coronalRef.current) {
        console.error('DOM elements not ready:', {
          axial: !!axialRef.current,
          sagittal: !!sagittalRef.current,
          coronal: !!coronalRef.current,
        });
        throw new Error('视口 DOM 元素未就绪，请重试');
      }

      console.log('✅ DOM 元素验证通过');

      // 创建渲染引擎
      const engine = new RenderingEngine('mprEngine');
      setRenderingEngine(engine);

      // 启用视口
      const viewportInputs = [
        {
          viewportId: 'AXIAL',
          element: axialRef.current,
          type: Enums.ViewportType.ORTHOGRAPHIC,
          defaultOptions: {
            orientation: Enums.OrientationAxis.AXIAL,
            background: [0, 0, 0] as Types.Point3,
          },
        },
        {
          viewportId: 'SAGITTAL',
          element: sagittalRef.current,
          type: Enums.ViewportType.ORTHOGRAPHIC,
          defaultOptions: {
            orientation: Enums.OrientationAxis.SAGITTAL,
            background: [0, 0, 0] as Types.Point3,
          },
        },
        {
          viewportId: 'CORONAL',
          element: coronalRef.current,
          type: Enums.ViewportType.ORTHOGRAPHIC,
          defaultOptions: {
            orientation: Enums.OrientationAxis.CORONAL,
            background: [0, 0, 0] as Types.Point3,
          },
        },
      ];

      engine.setViewports(viewportInputs);

      // 单独获取每个视口并设置参数
      const axialViewport = engine.getViewport('AXIAL');
      const sagittalViewport = engine.getViewport('SAGITTAL');
      const coronalViewport = engine.getViewport('CORONAL');

      if (!axialViewport || !sagittalViewport || !coronalViewport) {
        throw new Error('视口初始化失败，无法获取视口对象');
      }

      // 为每个视口设置 volume,使用官方推荐的 setVolumesForViewports 方法
      await setVolumesForViewports(
        engine,
        [{ volumeId }],
        ['AXIAL', 'SAGITTAL', 'CORONAL']
      ).then(() => {
        // 从第一张图像的元数据中获取窗宽窗位信息
        const voi = metaData.get('voiLutModule', newImageIds[0]);
        if (voi) {
          const voiRange = utilities.windowLevel.toLowHighRange(
            voi.windowWidth,
            voi.windowCenter,
            voi.voiLUTFunction
          );

          // 为每个视口设置窗宽窗位
          ['AXIAL', 'SAGITTAL', 'CORONAL'].forEach((viewportId) => {
            const viewport = engine.getViewport(viewportId) as Types.IVolumeViewport;
            viewport.setProperties({ voiRange });
          });
        } else {
          // 如果元数据中没有窗宽窗位信息,使用默认值
          const viewportProperties = {
            voiRange: {
              upper: 240,  // 窗位 + 窗宽/2
              lower: -160, // 窗位 - 窗宽/2
            },
          };

          ['AXIAL', 'SAGITTAL', 'CORONAL'].forEach((viewportId) => {
            const viewport = engine.getViewport(viewportId) as Types.IVolumeViewport;
            viewport.setProperties(viewportProperties);
          });
        }

        // 渲染所有视口
        engine.render();
        console.log('✅ 体积数据和窗宽窗位设置完成');
      });

      // 注册工具(只在工具组中不存在时才添加)
      // 注意: PanTool, ZoomTool, StackScrollTool 已在 initCornerstone 中全局注册
      // CrosshairsTool 需要单独注册
      try {
        addTool(CrosshairsTool);
        addTool(WindowLevelTool);
        addTool(LengthTool);
        addTool(AngleTool);
        addTool(BidirectionalTool);
        addTool(ProbeTool);
        addTool(RectangleROITool);
        addTool(EllipticalROITool);
        addTool(ScaleOverlayTool);
      } catch (error) {
        // 工具已经注册,忽略错误
        console.log('ℹ️ 工具已经注册');
      }

      // 创建两个工具组: 'default' 用于单视口, 'mpr' 用于多视口MPR
      const defaultToolGroupId = 'default';
      const mprToolGroupId = 'mpr';

      // 创建或获取 'default' 工具组 (单视口使用,无 Crosshairs)
      let defaultToolGroup = ToolGroupManager.getToolGroup(defaultToolGroupId);
      if (!defaultToolGroup) {
        try {
          defaultToolGroup = ToolGroupManager.createToolGroup(defaultToolGroupId);
          console.log('✅ 创建 default 工具组 (单视口模式)');
        } catch (error) {
          console.warn('⚠️ 创建 default 工具组失败:', error);
        }
      }

      // 创建或获取 'mpr' 工具组 (多视口MPR使用,有 Crosshairs)
      let mprToolGroup = ToolGroupManager.getToolGroup(mprToolGroupId);
      if (!mprToolGroup) {
        try {
          mprToolGroup = ToolGroupManager.createToolGroup(mprToolGroupId);
          console.log('✅ 创建 mpr 工具组 (多视口MPR模式)');
        } catch (error) {
          console.warn('⚠️ 创建 mpr 工具组失败:', error);
        }
      }

      if (!defaultToolGroup || !mprToolGroup) {
        console.error('❌ 无法创建或获取工具组');
        return;
      }

      // 为两个工具组添加相同的工具
      [defaultToolGroup, mprToolGroup].forEach((toolGroup) => {
        try {
          toolGroup.addTool(PanTool.toolName);
          toolGroup.addTool(ZoomTool.toolName, {
            minZoomScale: 0.001,
            maxZoomScale: 4000,
          });
          toolGroup.addTool(StackScrollTool.toolName);
          toolGroup.addTool(WindowLevelTool.toolName);
          toolGroup.addTool(LengthTool.toolName);
          toolGroup.addTool(AngleTool.toolName);
          toolGroup.addTool(BidirectionalTool.toolName);
          toolGroup.addTool(ProbeTool.toolName);
          toolGroup.addTool(RectangleROITool.toolName);
          toolGroup.addTool(EllipticalROITool.toolName);
          toolGroup.addTool(ScaleOverlayTool.toolName, {
            configuration: {
              scaleLocation: scaleLocation,
            },
          });

          // 只为 mpr 工具组添加 Crosshairs 工具
          if (toolGroup.id === mprToolGroupId) {
            toolGroup.addTool(CrosshairsTool.toolName);
          }
        } catch (error) {
          // 工具已添加,忽略
        }
      });

      // 当前是3视口MPR布局,使用 mpr 工具组
      const activeToolGroupId = mprToolGroupId;

      // 将视口添加到 mpr 工具组
      ['AXIAL', 'SAGITTAL', 'CORONAL'].forEach((viewportId) => {
        mprToolGroup.addViewport(viewportId, 'mprEngine');
      });

      // 设置平移工具 - 中键
      mprToolGroup.setToolActive(PanTool.toolName, {
        bindings: [
          { mouseButton: MouseBindings.Auxiliary },
        ],
      });

      // 设置缩放工具 - 右键
      mprToolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [
          { mouseButton: MouseBindings.Secondary },
        ],
      });

      // 设置滚轮换层工具 - 滚轮
      mprToolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [
          { mouseButton: MouseBindings.Wheel },
        ],
      });

      // 设置 Crosshairs 工具 - 左键,仅用于MPR三个视口的联动
      // 根据 showCrosshairs 状态决定是否启用十字线
      console.log('🔧 工具组初始化 - 当前状态:', {
        showCrosshairs,
        isWindowLevelActive,
        activeTool,
      });

      if (showCrosshairs) {
        mprToolGroup.setToolActive(CrosshairsTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        console.log('✅ 已激活十字线工具');
      } else {
        mprToolGroup.setToolDisabled(CrosshairsTool.toolName);
        console.log('✅ 已禁用十字线工具');
      }

      // 设置窗宽窗位工具 - 根据 isWindowLevelActive 状态决定是否启用
      if (isWindowLevelActive) {
        mprToolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        console.log('✅ 已激活窗宽窗位工具');
      } else {
        mprToolGroup.setToolDisabled(WindowLevelTool.toolName);
        // 如果窗宽窗位未激活，则激活第一个测量工具
        mprToolGroup.setToolActive(LengthTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        console.log('✅ 已激活长度测量工具');
      }

      // 启用比例尺工具
      if (showScale) {
        mprToolGroup.setToolEnabled(ScaleOverlayTool.toolName);
      } else {
        mprToolGroup.setToolDisabled(ScaleOverlayTool.toolName);
      }

      console.log('✅ 工具组配置完成');

      // 注意: CrosshairsTool 会自动处理三个视口之间的联动,不需要手动设置同步
      // setupLinkedNavigation 已被 CrosshairsTool 替代

      console.log('✅ MPR 查看器初始化完成');
      console.log(`📊 体积尺寸: ${volume.dimensions}`);
      console.log(`📊 间距: ${volume.spacing}`);
      console.log(`📊 原点: ${volume.origin}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('❌ 加载 DICOM 文件失败:', err);
      setError(`加载失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    await loadLocalFiles(files);
  };

  // 处理加载序列
  const handleLoadSeries = useCallback(async (seriesInfo: SeriesInfo) => {
    if (!renderingEngine) {
      console.warn('渲染引擎未初始化');
      return;
    }

    // 🔧 检测是否是双序列 MPR 布局
    const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

    if (isDualSequenceLayout) {
      // 🔧 双序列 MPR 布局下的特殊处理
      console.log(`🔄 双序列 MPR 布局：正在切换序列到激活视口`);
      console.log(`  激活视口: ${activeViewportId}`);
      console.log(`  目标序列: ${seriesInfo.seriesNumber} - ${seriesInfo.seriesDescription}`);

      try {
        setIsLoading(true);

        // 确定激活视口属于哪个序列（0-2: 序列1, 3-5: 序列2）
        const activeViewportIndex = viewportIds.indexOf(activeViewportId);
        if (activeViewportIndex === -1) {
          console.error(`❌ 激活视口 ${activeViewportId} 不在视口列表中`);
          setIsLoading(false);
          return;
        }

        const sequenceIndex = activeViewportIndex < 3 ? 1 : 2;
        const targetViewports = activeViewportIndex < 3 ? viewportIds.slice(0, 3) : viewportIds.slice(3, 6);

        console.log(`  激活视口属于序列 ${sequenceIndex}`);
        console.log(`  目标视口组:`, targetViewports);

        // 创建新的 volume
        const newVolumeId = `volume-${seriesInfo.seriesInstanceUID}`;
        const newVolume = await volumeLoader.createAndCacheVolume(newVolumeId, {
          imageIds: seriesInfo.imageIds,
        });
        newVolume.load();

        // 为目标序列的视口设置新的 volume
        await setVolumesForViewports(
          renderingEngine,
          [{ volumeId: newVolumeId }],
          targetViewports
        );

        // 从新序列获取窗宽窗位信息
        const voi = metaData.get('voiLutModule', seriesInfo.imageIds[0]);

        if (voi) {
          const voiRange = utilities.windowLevel.toLowHighRange(
            voi.windowWidth,
            voi.windowCenter,
            voi.voiLutFunction
          );

          // 为目标序列的每个视口设置窗宽窗位
          targetViewports.forEach((viewportId) => {
            try {
              const viewport = renderingEngine!.getViewport(viewportId) as Types.IVolumeViewport;
              if (viewport) {
                viewport.setProperties({ voiRange });

                // 更新 windowLevels state
                const width = voiRange.upper - voiRange.lower;
                const center = (voiRange.upper + voiRange.lower) / 2;
                setWindowLevels((prev) => ({
                  ...prev,
                  [viewportId]: { center, width },
                }));
              }
            } catch (error) {
              console.warn(`设置视口 ${viewportId} 窗宽窗位失败:`, error);
            }
          });

          console.log(`✅ 序列 ${sequenceIndex} 已应用新窗宽窗位: W=${voi.windowWidth} L=${voi.windowCenter}`);
        }

        // 更新对应的 volumeId state
        if (sequenceIndex === 1) {
          setVolumeId(newVolumeId);
          setImageIds(seriesInfo.imageIds);
        } else {
          setSecondaryVolumeId(newVolumeId);
        }

        // 更新当前序列 UID
        setCurrentSeriesUID(seriesInfo.seriesInstanceUID);

        // 重新渲染目标序列的视口
        renderingEngine.renderViewports(targetViewports);

        console.log(`✅ 序列 ${sequenceIndex} 已切换到: ${seriesInfo.seriesNumber}`);
      } catch (error) {
        console.error('❌ 双序列切换失败:', error);
        setError(`切换序列失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setIsLoading(false);
      }

      return;
    }

    // 🔧 标准布局下的原始逻辑
    try {
      setIsLoading(true);
      console.log(`🔄 正在切换到序列 ${seriesInfo.seriesNumber}: ${seriesInfo.seriesDescription}`);

      // 获取工具组，暂时禁用十字线工具以避免重复的重置操作
      const toolGroup = ToolGroupManager.getToolGroup('mpr');
      // 检查十字线工具是否处于激活状态
      const crosshairsTool = toolGroup?.getToolInstance(CrosshairsTool.toolName);
      const crosshairsWasActive = crosshairsTool?.active === true;

      // 如果十字线工具处于激活状态，暂时禁用它
      if (toolGroup && crosshairsWasActive) {
        try {
          toolGroup.setToolDisabled('Crosshairs');
        } catch (error) {
          // 忽略错误
        }
      }

      // 使用序列的 imageIds 创建新的体积数据
      const volumeId = `volume-${seriesInfo.seriesInstanceUID}`;
      const newVolume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds: seriesInfo.imageIds,
      });

      newVolume.load();

      // 先更新状态
      setImageIds(seriesInfo.imageIds);
      setVolume(newVolume as IVolume);
      setVolumeId(volumeId); // 保存新的 volume ID
      setCurrentSeriesUID(seriesInfo.seriesInstanceUID);

      // 为所有视口设置新的 volume
      await setVolumesForViewports(
        renderingEngine,
        [{ volumeId }],
        ['AXIAL', 'SAGITTAL', 'CORONAL']
      );

      // 从新序列的第一张图像元数据中获取窗宽窗位信息并应用
      const { metaData, utilities } = await import('@cornerstonejs/core');
      const voi = metaData.get('voiLutModule', seriesInfo.imageIds[0]);

      if (voi) {
        const voiRange = utilities.windowLevel.toLowHighRange(
          voi.windowWidth,
          voi.windowCenter,
          voi.voiLUTFunction
        );

        // 为每个视口设置窗宽窗位
        const newWindowLevels: Record<string, { center: number; width: number }> = {};
        ['AXIAL', 'SAGITTAL', 'CORONAL'].forEach((viewportId) => {
          const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
          if (viewport) {
            viewport.setProperties({ voiRange });

            // 计算并存储窗宽窗位值用于显示
            const width = voiRange.upper - voiRange.lower;
            const center = (voiRange.upper + voiRange.lower) / 2;
            newWindowLevels[viewportId] = { center, width };
          }
        });

        // 更新 windowLevels state 以保持显示一致性
        setWindowLevels(newWindowLevels);

        console.log(`✅ 已应用新序列窗宽窗位: W=${voi.windowWidth} L=${voi.windowCenter}`);
      } else {
        // 如果元数据中没有窗宽窗位信息，使用默认值
        const defaultVoiRange = { lower: -200, upper: 200 };
        const newWindowLevels: Record<string, { center: number; width: number }> = {};

        ['AXIAL', 'SAGITTAL', 'CORONAL'].forEach((viewportId) => {
          const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
          if (viewport) {
            viewport.setProperties({ voiRange: defaultVoiRange });
            newWindowLevels[viewportId] = { center: 0, width: 400 };
          }
        });

        setWindowLevels(newWindowLevels);
        console.log('⚠️ 新序列元数据中无窗宽窗位信息，使用默认值');
      }

      // 重新启用十字线工具（如果之前是激活的）
      if (toolGroup && crosshairsWasActive) {
        try {
          toolGroup.setToolActive('Crosshairs', {
            bindings: [{ mouseButton: MouseBindings.Primary }],
          });
        } catch (error) {
          // 忽略错误
        }
      }

      // 重新渲染所有视口
      renderingEngine.renderViewports(['AXIAL', 'SAGITTAL', 'CORONAL']);

      console.log(`✅ 已切换到序列 ${seriesInfo.seriesNumber}`);
    } catch (error) {
      console.error('❌ 切换序列失败:', error);
      setError(`切换序列失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  }, [renderingEngine, viewportIds, secondaryVolumeId, activeViewportId]);

  // 处理层厚变化
  const handleSlabThicknessChange = (value: number) => {
    setSlabThickness(value);
  };

  // 稳定的回调函数 - 用于 SeriesPanel
  const handleCloseSeriesPanel = useCallback(() => {
    setShowSeriesPanel(false);
  }, []);

  const handleToggleSeriesPanelCollapse = useCallback(() => {
    setIsSeriesPanelCollapsed(prev => !prev);
  }, []);

  const handleCloseAnnotationsPanel = useCallback(() => {
    setShowAnnotationsPanel(false);
  }, []);

  const handleToggleAnnotationsPanelCollapse = useCallback(() => {
    setIsAnnotationsPanelCollapsed(prev => !prev);
  }, []);

  const handleToggleSeriesPanel = useCallback(() => {
    setShowSeriesPanel(prev => !prev);
  }, []);

  const handleToggleAnnotationsPanel = useCallback(() => {
    setShowAnnotationsPanel(prev => !prev);
  }, []);

  // 处理投影模式变化
  const handleSlabModeChange = (mode: 'max' | 'min' | 'avg') => {
    setSlabMode(mode);
  };

  // 处理旋转
  const handleRotate = (angle: number, axis: 'x' | 'y' | 'z') => {
    rotateViewport('AXIAL', angle, axis);
  };

  // 处理工具切换
  const handleToolChange = (toolName: string) => {
    if (!renderingEngine) return;

    // 🔧 检查是否是双序列 MPR 布局
    const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;
    const hasMultipleViewports = viewportIds.length > 1;

    // 如果要启用测量工具，需要先禁用十字线和窗宽窗位
    if (toolName !== 'Crosshairs' && toolName !== 'WindowLevel') {
      if (isDualSequenceLayout) {
        // 双序列布局：禁用两个工具组的十字线和窗宽窗位
        const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
        const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');

        if (toolGroupSeq1) {
          if (toolGroupSeq1.hasTool(CrosshairsTool.toolName)) {
            toolGroupSeq1.setToolDisabled(CrosshairsTool.toolName);
          }
          if (isWindowLevelActive) {
            toolGroupSeq1.setToolDisabled(WindowLevelTool.toolName);
          }
        }

        if (toolGroupSeq2) {
          if (toolGroupSeq2.hasTool(CrosshairsTool.toolName)) {
            toolGroupSeq2.setToolDisabled(CrosshairsTool.toolName);
          }
          if (isWindowLevelActive) {
            toolGroupSeq2.setToolDisabled(WindowLevelTool.toolName);
          }
        }

        if (showCrosshairs) {
          setShowCrosshairs(false);
        }
        if (isWindowLevelActive) {
          setIsWindowLevelActive(false);
        }
      } else {
        // 标准布局
        const toolGroupId = hasMultipleViewports ? 'mpr' : 'default';
        const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

        if (!toolGroup) {
          console.error(`❌ 无法获取工具组: ${toolGroupId}`);
          return;
        }

        if (toolGroup.hasTool(CrosshairsTool.toolName)) {
          toolGroup.setToolDisabled(CrosshairsTool.toolName);
          if (showCrosshairs) {
            setShowCrosshairs(false);
          }
        }

        if (isWindowLevelActive) {
          setIsWindowLevelActive(false);
          toolGroup.setToolDisabled(WindowLevelTool.toolName);
        }
      }
    }

    // 如果尝试在单视口模式下激活十字线工具，自动切换到窗宽窗位工具
    if (toolName === CrosshairsTool.toolName && !hasMultipleViewports) {
      console.warn('⚠️ 单视口模式下不支持十字线工具，自动切换到窗宽窗位工具');

      setToolModes((prev) => ({
        ...prev,
        [WindowLevelTool.toolName]: ToolModes.Active,
      }));

      setActiveTool(WindowLevelTool.toolName);
      return;
    }

    // 定义所有可以切换的工具
    const switchableTools = [
      CrosshairsTool.toolName,
      WindowLevelTool.toolName,
      LengthTool.toolName,
      AngleTool.toolName,
      BidirectionalTool.toolName,
      ProbeTool.toolName,
      RectangleROITool.toolName,
      EllipticalROITool.toolName,
    ];

    // 🔧 将其他 Active 的工具改为 Passive
    // 需要更新所有相关的工具组
    const allToolGroups = [];

    // 添加 default 工具组
    const defaultToolGroup = ToolGroupManager.getToolGroup('default');
    if (defaultToolGroup) allToolGroups.push(defaultToolGroup);

    // 添加 mpr 工具组（标准布局）
    const mprToolGroup = ToolGroupManager.getToolGroup('mpr');
    if (mprToolGroup) allToolGroups.push(mprToolGroup);

    // 添加双序列工具组
    if (isDualSequenceLayout) {
      const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
      const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');
      if (toolGroupSeq1) allToolGroups.push(toolGroupSeq1);
      if (toolGroupSeq2) allToolGroups.push(toolGroupSeq2);
    }

    // 更新所有工具组的状态
    allToolGroups.forEach((tg) => {
      switchableTools.forEach((t) => {
        if (t !== toolName && toolModes[t] === ToolModes.Active) {
          try {
            if (tg.hasTool(t)) {
              tg.setToolPassive(t);
            }
          } catch (error) {
            // 工具可能未添加到此 toolGroup,忽略
          }
        }
      });
    });

    // 更新状态
    switchableTools.forEach((t) => {
      if (t !== toolName && toolModes[t] === ToolModes.Active) {
        setToolModes((prev) => ({
          ...prev,
          [t]: ToolModes.Passive,
        }));
      }
    });

    // 🔧 激活选中的工具
    if (isDualSequenceLayout) {
      // 双序列布局：同时激活两个工具组
      const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
      const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');

      if (!toolGroupSeq1 || !toolGroupSeq2) {
        console.error('❌ 无法获取双序列工具组');
        return;
      }

      if (switchableTools.includes(toolName)) {
        toolGroupSeq1.setToolActive(toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        toolGroupSeq2.setToolActive(toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        setToolModes((prev) => ({
          ...prev,
          [toolName]: ToolModes.Active,
        }));

        setActiveTool(toolName);
      } else {
        // 默认激活 Length 工具
        toolGroupSeq1.setToolActive(LengthTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        toolGroupSeq2.setToolActive(LengthTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        setToolModes((prev) => ({
          ...prev,
          [LengthTool.toolName]: ToolModes.Active,
        }));

        setActiveTool(LengthTool.toolName);
      }
    } else {
      // 标准布局
      const toolGroupId = hasMultipleViewports ? 'mpr' : 'default';
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

      if (!toolGroup) {
        console.error(`❌ 无法获取工具组: ${toolGroupId}`);
        return;
      }

      if (switchableTools.includes(toolName)) {
        toolGroup.setToolActive(toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        setToolModes((prev) => ({
          ...prev,
          [toolName]: ToolModes.Active,
        }));

        setActiveTool(toolName);
      } else {
        toolGroup.setToolActive(LengthTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        setToolModes((prev) => ({
          ...prev,
          [LengthTool.toolName]: ToolModes.Active,
        }));

        setActiveTool(LengthTool.toolName);
      }
    }
  };

  // 处理比例尺显示/隐藏
  const handleToggleScale = () => {
    const newShowScale = !showScale;
    setShowScale(newShowScale);

    const toolGroupId = 'mprToolGroup';
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    if (!toolGroup) {
      console.error('❌ 无法获取工具组');
      return;
    }

    if (newShowScale) {
      toolGroup.setToolEnabled(ScaleOverlayTool.toolName);
      console.log('✅ 已启用比例尺');
    } else {
      toolGroup.setToolDisabled(ScaleOverlayTool.toolName);
      console.log('✅ 已禁用比例尺');
    }
  };

  // 处理比例尺位置切换
  const handleScaleLocationChange = (location: 'top' | 'bottom' | 'left' | 'right') => {
    setScaleLocation(location);

    const toolGroupId = 'mprToolGroup';
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    if (!toolGroup) {
      console.error('❌ 无法获取工具组');
      return;
    }

    // 更新比例尺位置配置
    toolGroup.setToolConfiguration(
      ScaleOverlayTool.toolName,
      {
        scaleLocation: location,
      },
      true // overwrite
    );

    // 如果比例尺当前未显示，则启用它
    if (!showScale) {
      setShowScale(true);
      toolGroup.setToolEnabled(ScaleOverlayTool.toolName);
    }

    console.log(`✅ 比例尺位置已设置为: ${location}`);
  };

  // 处理十字线显示/隐藏
  const handleToggleCrosshairs = () => {
    const newShowCrosshairs = !showCrosshairs;

    // 🔧 检查是否是双序列 MPR 布局
    const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

    if (newShowCrosshairs) {
      // 检查是否支持十字线(需要多视口)
      if (viewportIds.length <= 1) {
        console.warn('⚠️ 单视口模式下不支持十字线工具');
        return;
      }

      if (isDualSequenceLayout) {
        // 🔧 双序列布局：需要同时更新两个工具组
        const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
        const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');

        if (!toolGroupSeq1 || !toolGroupSeq2) {
          console.error('❌ 无法获取双序列工具组');
          return;
        }

        // 禁用窗宽窗位工具
        if (isWindowLevelActive) {
          setIsWindowLevelActive(false);
          toolGroupSeq1.setToolDisabled(WindowLevelTool.toolName);
          toolGroupSeq2.setToolDisabled(WindowLevelTool.toolName);
        }

        // 将当前测量工具设为 Passive
        if (activeTool) {
          if (toolGroupSeq1.hasTool(activeTool)) {
            toolGroupSeq1.setToolPassive(activeTool);
          }
          if (toolGroupSeq2.hasTool(activeTool)) {
            toolGroupSeq2.setToolPassive(activeTool);
          }
        }

        // 启用两个工具组的十字线
        toolGroupSeq1.setToolActive(CrosshairsTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        toolGroupSeq2.setToolActive(CrosshairsTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        setShowCrosshairs(true);
        console.log('✅ 已启用双序列十字线');
      } else {
        // 标准布局：使用单个 mpr 工具组
        const toolGroupId = 'mpr';
        const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

        if (!toolGroup) {
          console.error(`❌ 无法获取工具组: ${toolGroupId}`);
          return;
        }

        // 禁用窗宽窗位工具
        if (isWindowLevelActive) {
          setIsWindowLevelActive(false);
          toolGroup.setToolDisabled(WindowLevelTool.toolName);
        }

        // 将当前测量工具设为 Passive
        if (activeTool && toolGroup.hasTool(activeTool)) {
          toolGroup.setToolPassive(activeTool);
        }

        // 启用十字线工具
        toolGroup.setToolActive(CrosshairsTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        setShowCrosshairs(true);
        console.log('✅ 已启用十字线');
      }
    } else {
      // 禁用十字线
      if (isDualSequenceLayout) {
        const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
        const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');

        if (toolGroupSeq1) {
          toolGroupSeq1.setToolDisabled(CrosshairsTool.toolName);
        }
        if (toolGroupSeq2) {
          toolGroupSeq2.setToolDisabled(CrosshairsTool.toolName);
        }

        setShowCrosshairs(false);
        console.log('✅ 已禁用双序列十字线');
      } else {
        const toolGroupId = 'mpr';
        const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

        if (!toolGroup) {
          console.error(`❌ 无法获取工具组: ${toolGroupId}`);
          return;
        }

        toolGroup.setToolDisabled(CrosshairsTool.toolName);
        setShowCrosshairs(false);
        console.log('✅ 已禁用十字线');
      }
    }
  };

  // 处理窗宽窗位调节切换
  const handleToggleWindowLevel = () => {
    const newIsActive = !isWindowLevelActive;

    // 🔧 检查是否是双序列 MPR 布局
    const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

    if (newIsActive) {
      if (isDualSequenceLayout) {
        // 🔧 双序列布局：需要同时更新两个工具组
        const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
        const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');

        if (!toolGroupSeq1 || !toolGroupSeq2) {
          console.error('❌ 无法获取双序列工具组');
          return;
        }

        // 禁用十字线
        if (showCrosshairs) {
          setShowCrosshairs(false);
          if (toolGroupSeq1.hasTool(CrosshairsTool.toolName)) {
            toolGroupSeq1.setToolDisabled(CrosshairsTool.toolName);
          }
          if (toolGroupSeq2.hasTool(CrosshairsTool.toolName)) {
            toolGroupSeq2.setToolDisabled(CrosshairsTool.toolName);
          }
        }

        // 将当前测量工具设为 Passive
        if (activeTool) {
          if (toolGroupSeq1.hasTool(activeTool)) {
            toolGroupSeq1.setToolPassive(activeTool);
          }
          if (toolGroupSeq2.hasTool(activeTool)) {
            toolGroupSeq2.setToolPassive(activeTool);
          }
        }

        // 启用两个工具组的窗宽窗位
        toolGroupSeq1.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        toolGroupSeq2.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        setIsWindowLevelActive(true);
        console.log('✅ 已启用双序列窗宽窗位调节');
      } else {
        // 标准布局：使用单个 mpr 工具组
        const toolGroupId = 'mpr';
        const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

        if (!toolGroup) {
          console.error(`❌ 无法获取工具组: ${toolGroupId}`);
          return;
        }

        // 禁用十字线
        if (showCrosshairs) {
          setShowCrosshairs(false);
          if (toolGroup.hasTool(CrosshairsTool.toolName)) {
            toolGroup.setToolDisabled(CrosshairsTool.toolName);
          }
        }

        // 将当前测量工具设为 Passive
        if (activeTool && toolGroup.hasTool(activeTool)) {
          toolGroup.setToolPassive(activeTool);
        }

        // 启用窗宽窗位工具
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });

        setIsWindowLevelActive(true);
        console.log('✅ 已启用窗宽窗位调节');
      }
    } else {
      // 禁用窗宽窗位
      if (isDualSequenceLayout) {
        const toolGroupSeq1 = ToolGroupManager.getToolGroup('mpr-seq1');
        const toolGroupSeq2 = ToolGroupManager.getToolGroup('mpr-seq2');

        if (toolGroupSeq1) {
          toolGroupSeq1.setToolDisabled(WindowLevelTool.toolName);
        }
        if (toolGroupSeq2) {
          toolGroupSeq2.setToolDisabled(WindowLevelTool.toolName);
        }

        setIsWindowLevelActive(false);
        console.log('✅ 已禁用双序列窗宽窗位调节');
      } else {
        const toolGroupId = 'mpr';
        const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

        if (!toolGroup) {
          console.error(`❌ 无法获取工具组: ${toolGroupId}`);
          return;
        }

        toolGroup.setToolDisabled(WindowLevelTool.toolName);
        setIsWindowLevelActive(false);
        console.log('✅ 已禁用窗宽窗位调节');
      }
    }
  };

  // 处理视口激活
  const handleViewportClick = (viewportId: string) => {
    setActiveViewportId(viewportId);

    // 🔧 更新视口容器的active类（支持单序列和双序列布局）
    dynamicViewportManager.updateActiveViewport(viewportId);

    console.log(`✅ 激活视口: ${viewportId}`);
  };

  // 处理视口双击 - 放大/还原
  const handleViewportDoubleClick = (viewportId: string) => {
    if (!renderingEngine) return;

    if (isMaximized && maximizedViewportId === viewportId) {
      // 当前视口已放大，还原到原始布局
      console.log(`🔄 还原视口: ${viewportId}`);

      // 恢复原始布局
      setCurrentLayout(layoutBeforeMaximize);
      setIsMaximized(false);
      setMaximizedViewportId(null);

      // 等待 DOM 更新后重置所有视口并强制渲染
      setTimeout(() => {
        // 首先调用 resize 让渲染引擎重新计算所有视口
        renderingEngine!.resize(true, true);

        // 然后重置所有视口的相机
        viewportIds.forEach((vpId) => {
          try {
            const viewport = renderingEngine!.getViewport(vpId) as Types.IVolumeViewport;
            if (viewport) {
              viewport.resetCamera();
            }
          } catch (error) {
            console.warn(`⚠️ 重置视口 ${vpId} 失败:`, error);
          }
        });

        // 再次 resize 确保视口大小正确
        renderingEngine!.resize(true, true);

        // 渲染所有视口
        renderingEngine!.renderViewports(viewportIds);

        console.log(`✅ 已还原到布局: ${layoutBeforeMaximize}`);
      }, 300);
    } else if (!isMaximized) {
      // 没有视口被放大，放大当前视口
      console.log(`🔍 放大视口: ${viewportId}`);

      // 保存当前布局
      setLayoutBeforeMaximize(currentLayout);
      setIsMaximized(true);
      setMaximizedViewportId(viewportId);

      // 切换到单视口布局
      setCurrentLayout('grid-1x1');

      // 等待 DOM 更新后重置放大视口
      setTimeout(() => {
        // 先调用 resize
        renderingEngine!.resize(true, true);

        // 重置相机以适应新的单视口布局
        try {
          const viewport = renderingEngine!.getViewport(viewportId) as Types.IVolumeViewport;
          if (viewport) {
            viewport.resetCamera();
          }
        } catch (error) {
          console.warn(`⚠️ 重置视口 ${viewportId} 失败:`, error);
        }

        // 再次 resize 确保视口大小正确
        renderingEngine!.resize(true, true);

        // 渲染所有视口（隐藏的视口不会被实际渲染）
        // 这比只渲染一个视口更安全，避免其他视口状态丢失
        renderingEngine!.renderViewports(viewportIds);

        console.log(`✅ 视口 ${viewportId} 已放大`);
      }, 300);
    }
  };

  // 处理删除选中的测量
  const handleDeleteSelected = () => {
    try {
      // 获取所有选中的标注
      const selectedAnnotations = selection.getAnnotationsSelected();

      if (selectedAnnotations.length === 0) {
        console.log('ℹ️ 没有选中的测量');
        alert('请先选择要删除的测量（点击测量标注以选中）');
        return;
      }

      // 删除所有选中的标注
      selectedAnnotations.forEach((annotationUID) => {
        annotation.state.removeAnnotation(annotationUID);
      });

      // 重新渲染所有视口以更新显示
      if (renderingEngine) {
        renderingEngine.render();
      }

      console.log(`✅ 已删除 ${selectedAnnotations.length} 个测量`);
    } catch (error) {
      console.error('❌ 删除测量失败:', error);
      alert('删除测量失败，请重试');
    }
  };

  // 处理工具模式切换
  const handleToolModeChange = (toolName: string, newMode: string) => {
    if (!renderingEngine) return;

    // 根据视口数量选择合适的 toolGroup
    const hasMultipleViewports = viewportIds.length > 1;
    const toolGroupId = hasMultipleViewports ? 'mpr' : 'default';
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    if (!toolGroup) {
      console.error(`❌ 无法获取工具组: ${toolGroupId}`);
      return;
    }

    // 定义所有可以切换的工具
    const switchableTools = [
      CrosshairsTool.toolName,
      WindowLevelTool.toolName,
      LengthTool.toolName,
      AngleTool.toolName,
      BidirectionalTool.toolName,
      ProbeTool.toolName,
      RectangleROITool.toolName,
      EllipticalROITool.toolName,
    ];

    // 根据模式调用相应的方法
    const modeMethod = `setTool${newMode}` as keyof typeof toolGroup;

    if (newMode === ToolModes.Active) {
      // 如果切换到 Active 模式，只将其他 Active 的工具改为 Passive，保留其他工具的状态
      // 需要同时更新两个 toolGroup
      const defaultToolGroup = ToolGroupManager.getToolGroup('default');
      const mprToolGroup = ToolGroupManager.getToolGroup('mpr');

      [defaultToolGroup, mprToolGroup].forEach((tg) => {
        if (!tg) return;
        switchableTools.forEach((t) => {
          if (t !== toolName && toolModes[t] === ToolModes.Active) {
            try {
              tg.setToolPassive(t);
            } catch (error) {
              // 工具可能未添加到此 toolGroup,忽略
            }
          }
        });
      });

      // 更新状态
      switchableTools.forEach((t) => {
        if (t !== toolName && toolModes[t] === ToolModes.Active) {
          setToolModes((prev) => ({
            ...prev,
            [t]: ToolModes.Passive,
          }));
        }
      });

      // 然后激活当前工具
      toolGroup.setToolActive(toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
      setActiveTool(toolName);
    } else {
      // 对于其他模式，直接调用对应的设置方法
      (toolGroup[modeMethod] as (toolName: string) => void)(toolName);
    }

    // 更新工具模式状态
    setToolModes((prev) => ({
      ...prev,
      [toolName]: newMode,
    }));

    console.log(`✅ ${toolName} 工具模式已设置为: ${newMode}`);
  };

  // 处理测量面板位置变化（左/右切换）
  const handleAnnotationsPanelPositionChange = (position: 'left' | 'right') => {
    setAnnotationsPanelPosition(position);
    console.log(`✅ 测量面板已移动到${position === 'left' ? '左侧' : '右侧'}`);
  };

  // 处理布局切换
  const handleLayoutChange = async (layout: ViewportLayout) => {
    console.log('🔄 布局切换请求:', layout);

    if (!renderingEngine || !volume || !volumeId) {
      console.warn('无法切换布局: 渲染引擎或体积数据未初始化');
      return;
    }

    // 处理双序列 MPR 布局
    if (layout === 'dual-mpr') {
      console.log('🔄 切换到双序列 MPR 布局');

      // 检查是否有足够的序列
      if (seriesList.length < 2) {
        alert('双序列 MPR 布局需要至少加载 2 个序列。当前只有 ' + seriesList.length + ' 个序列。');
        return;
      }

      try {
        // 🔧 关键修复：先更新布局状态，让 React 卸载静态组件
        // 这样可以避免 React removeChild 错误
        const currentViewportIds = viewportIds;

        // 先设置 layout 为临时值，触发 React 卸载静态 JSX
        setCurrentLayout('dual-mpr' as any);
        setViewportIds([]);

        // 等待 React 完成卸载
        await new Promise(resolve => setTimeout(resolve, 50));

        // 初始化视口管理器，传递事件处理器
        dynamicViewportManager.initialize(renderingEngine, viewportsGridRef.current!, {
          onViewportClick: handleViewportClick,
          onViewportDoubleClick: handleViewportDoubleClick,
          getActiveViewportId: () => activeViewportId,
        });

        // 获取第二个序列的 volume ID
        const secondSeries = seriesList.find(s => s.seriesInstanceUID !== currentSeriesUID);
        if (!secondSeries) {
          alert('无法找到第二个序列');
          return;
        }

        // 创建或获取第二个序列的 volume
        let volumeId2 = secondaryVolumeId;
        if (!volumeId2) {
          volumeId2 = `volume-${secondSeries.seriesInstanceUID}`;
          const secondVolume = await volumeLoader.createAndCacheVolume(volumeId2, {
            imageIds: secondSeries.imageIds,
          });
          secondVolume.load();
          setSecondaryVolumeId(volumeId2);
        }

        // 应用双序列 MPR 布局
        const dualConfig: DualSequenceConfig = {
          volumeId1: volumeId,
          volumeId2: volumeId2,
        };

        const newViewportIds = await dynamicViewportManager.applyDualSequenceMPRLayout(
          dualConfig,
          currentViewportIds
        );

        // 更新 viewportIds 状态
        setViewportIds(newViewportIds);

        // 更新视口相关状态
        const newIndexMap: Record<string, number> = {};
        const newTotalMap: Record<string, number> = {};
        const newOrientationMap: Record<string, Enums.OrientationAxis> = {};
        const newWindowLevelMap: Record<string, { center: number; width: number }> = {};

        const orientations = [Enums.OrientationAxis.AXIAL, Enums.OrientationAxis.SAGITTAL, Enums.OrientationAxis.CORONAL];

        newViewportIds.forEach((viewportId, index) => {
          newIndexMap[viewportId] = 0;
          newTotalMap[viewportId] = 100; // 临时值，会动态更新
          newOrientationMap[viewportId] = orientations[index % 3];
          newWindowLevelMap[viewportId] = { center: 40, width: 400 };
        });

        setCurrentImageIndices(newIndexMap);
        setTotalSlicesForViewports(newTotalMap);
        setViewportOrientations(newOrientationMap);
        setWindowLevels(newWindowLevelMap);

        // 🔧 双序列布局需要两个独立的工具组，每个序列一个
        // 这样十字线可以在每个序列内部独立联动
        console.log('🔧 开始配置双序列 MPR 工具组...');

        const toolGroupSeq1Id = 'mpr-seq1';
        const toolGroupSeq2Id = 'mpr-seq2';

        let toolGroupSeq1 = ToolGroupManager.getToolGroup(toolGroupSeq1Id);
        let toolGroupSeq2 = ToolGroupManager.getToolGroup(toolGroupSeq2Id);

        // 如果工具组不存在，创建它们
        if (!toolGroupSeq1) {
          toolGroupSeq1 = ToolGroupManager.createToolGroup(toolGroupSeq1Id)!;
          console.log('✅ 创建序列 1 工具组:', toolGroupSeq1Id);

          // 添加工具到序列 1 工具组
          try {
            toolGroupSeq1.addTool(PanTool.toolName);
            toolGroupSeq1.addTool(ZoomTool.toolName);
            toolGroupSeq1.addTool(StackScrollTool.toolName);
            toolGroupSeq1.addTool(WindowLevelTool.toolName);
            toolGroupSeq1.addTool(LengthTool.toolName);
            toolGroupSeq1.addTool(AngleTool.toolName);
            toolGroupSeq1.addTool(BidirectionalTool.toolName);
            toolGroupSeq1.addTool(ProbeTool.toolName);
            toolGroupSeq1.addTool(RectangleROITool.toolName);
            toolGroupSeq1.addTool(EllipticalROITool.toolName);
            toolGroupSeq1.addTool(ScaleOverlayTool.toolName);
            toolGroupSeq1.addTool(CrosshairsTool.toolName);
            console.log('✅ 序列 1 工具已添加');
          } catch (error) {
            // 工具已添加，忽略
          }
        }

        if (!toolGroupSeq2) {
          toolGroupSeq2 = ToolGroupManager.createToolGroup(toolGroupSeq2Id)!;
          console.log('✅ 创建序列 2 工具组:', toolGroupSeq2Id);

          // 添加工具到序列 2 工具组
          try {
            toolGroupSeq2.addTool(PanTool.toolName);
            toolGroupSeq2.addTool(ZoomTool.toolName);
            toolGroupSeq2.addTool(StackScrollTool.toolName);
            toolGroupSeq2.addTool(WindowLevelTool.toolName);
            toolGroupSeq2.addTool(LengthTool.toolName);
            toolGroupSeq2.addTool(AngleTool.toolName);
            toolGroupSeq2.addTool(BidirectionalTool.toolName);
            toolGroupSeq2.addTool(ProbeTool.toolName);
            toolGroupSeq2.addTool(RectangleROITool.toolName);
            toolGroupSeq2.addTool(EllipticalROITool.toolName);
            toolGroupSeq2.addTool(ScaleOverlayTool.toolName);
            toolGroupSeq2.addTool(CrosshairsTool.toolName);
            console.log('✅ 序列 2 工具已添加');
          } catch (error) {
            // 工具已添加，忽略
          }
        }

        // 配置序列 1 工具组（视口 0-2）
        console.log('🔧 配置序列 1 工具组（视口 0-2）...');
        newViewportIds.slice(0, 3).forEach((viewportId) => {
          try {
            toolGroupSeq1!.addViewport(viewportId, 'mprEngine');
            console.log(`  ✓ 序列1 视口 ${viewportId} 已添加到工具组`);
          } catch (error) {
            console.warn(`添加视口 ${viewportId} 到序列1工具组失败:`, error);
          }
        });

        // 配置序列 2 工具组（视口 3-5）
        console.log('🔧 配置序列 2 工具组（视口 3-5）...');
        newViewportIds.slice(3, 6).forEach((viewportId) => {
          try {
            toolGroupSeq2!.addViewport(viewportId, 'mprEngine');
            console.log(`  ✓ 序列2 视口 ${viewportId} 已添加到工具组`);
          } catch (error) {
            console.warn(`添加视口 ${viewportId} 到序列2工具组失败:`, error);
          }
        });

        // 为两个工具组配置基本工具
        [toolGroupSeq1!, toolGroupSeq2!].forEach((toolGroup, groupIndex) => {
          const seqName = groupIndex === 0 ? '序列1' : '序列2';
          console.log(`🔧 配置 ${seqName} 工具...`);

          // 平移 - 中键
          toolGroup.setToolActive(PanTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Auxiliary }],
          });

          // 缩放 - 右键
          toolGroup.setToolActive(ZoomTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Secondary }],
          });

          // 滚轮换层 - 滚轮
          toolGroup.setToolActive(StackScrollTool.toolName, {
            bindings: [{ mouseButton: MouseBindings.Wheel }],
          });

          // 🔧 配置主鼠标按钮工具（根据当前状态）
          if (showCrosshairs) {
            // 十字线工具
            toolGroup.setToolActive(CrosshairsTool.toolName, {
              bindings: [{ mouseButton: MouseBindings.Primary }],
            });
            console.log(`  ✓ ${seqName} 十字线工具已启用`);
          } else if (isWindowLevelActive) {
            // 窗宽窗位工具
            toolGroup.setToolActive(WindowLevelTool.toolName, {
              bindings: [{ mouseButton: MouseBindings.Primary }],
            });
            console.log(`  ✓ ${seqName} 窗宽窗位工具已启用`);
          } else if (activeTool) {
            // 测量工具
            toolGroup.setToolActive(activeTool, {
              bindings: [{ mouseButton: MouseBindings.Primary }],
            });
            console.log(`  ✓ ${seqName} 测量工具 ${activeTool} 已启用`);
          } else {
            // 默认：长度测量工具
            toolGroup.setToolActive(LengthTool.toolName, {
              bindings: [{ mouseButton: MouseBindings.Primary }],
            });
            console.log(`  ✓ ${seqName} 长度测量工具已启用（默认）`);
          }
        });

        console.log('✅ 双序列 MPR 工具组配置完成（两个独立工具组）');

        // 🔧 添加标注事件监听器，在双序列布局下记录标注所属序列
        const handleAnnotationAdded = (event: any) => {
          const { annotation } = event.detail;

          // 确定标注是在哪个视口创建的
          const viewportId = annotation.metadata.viewpointId;
          const sequenceIndex = newViewportIds.findIndex(id => id === viewportId);

          if (sequenceIndex !== -1) {
            // 0-2: 序列 1, 3-5: 序列 2
            const sequenceNumber = sequenceIndex < 3 ? 1 : 2;
            const targetVolumeId = sequenceIndex < 3 ? volumeId : volumeId2;

            // 将 volumeId 信息添加到标注元数据
            annotation.metadata.volumeId = targetVolumeId;
            annotation.metadata.sequenceIndex = sequenceIndex;
            annotation.metadata.sequenceNumber = sequenceNumber;

            console.log(`📝 标注已添加到序列 ${sequenceNumber} (${viewportId})，volumeId: ${targetVolumeId}`);
          }
        };

        // 添加事件监听器
        eventTarget.addEventListener('annotationAdded', handleAnnotationAdded as any);
        console.log('✅ 已添加标注序列追踪监听器');

        // 🔧 设置第一个视口为激活状态
        const firstViewportId = newViewportIds[0];
        setActiveViewportId(firstViewportId);
        dynamicViewportManager.updateActiveViewport(firstViewportId);
        console.log(`✅ 设置视口 ${firstViewportId} 为激活状态`);

        console.log(`✅ 双序列 MPR 布局已应用，共 ${newViewportIds.length} 个视口`);
        return;
      } catch (error) {
        console.error('❌ 应用双序列 MPR 布局失败:', error);
        alert(`双序列 MPR 布局切换失败: ${error}`);
        return;
      }
    }

    // 处理其他协议布局（暂时映射到标准三视图）
    if (
      layout === 'mpr' ||
      layout === '3d-four-up' ||
      layout === '3d-main' ||
      layout === 'axial-primary' ||
      layout === '3d-only' ||
      layout === '3d-primary' ||
      layout === 'frame-view' ||
      layout === 'advanced'
    ) {
      // 这些协议布局暂时映射到标准的 1×3 MPR 布局
      console.log(`🔄 协议布局 "${layout}" 暂时映射到标准 MPR 布局`);

      // 显示提示信息
      const layoutNames: Record<string, string> = {
        'mpr': 'MPR 三视图',
        '3d-four-up': '3D 四视图',
        '3d-main': '3D 主视图',
        'axial-primary': '轴位主视图',
        '3d-only': '仅 3D',
        '3d-primary': '3D 为主',
        'frame-view': '帧视图',
        'advanced': '高级视图',
      };

      const layoutName = layoutNames[layout] || layout;
      console.log(`ℹ️ "${layoutName}" 协议布局暂时使用标准三视图显示`);
      // 可以选择显示用户提示：
      // alert(`"${layoutName}" 协议布局功能正在开发中，暂时使用标准 MPR 三视图显示。`);
    }

    // 处理其他布局（原始逻辑）
    // 计算新布局的视口数量
    const newViewportCount = getViewportCountFromLayout(layout);

    // 如果新布局视口数量小于3，且当前十字线处于激活状态，则需要禁用十字线
    if (newViewportCount < 3 && showCrosshairs) {
      console.log('⚠️ 布局切换到少于3个视口模式，先激活窗宽窗位，再禁用十字线工具');

      // 获取工具组
      const toolGroupId = 'mpr';
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

      if (toolGroup) {
        // 1. 先激活窗宽窗位工具
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        setIsWindowLevelActive(true);
        console.log('✅ 已激活窗宽窗位工具');

        // 2. 将当前测量工具设为 Passive（可见但不可编辑）
        if (activeTool && toolGroup.hasTool(activeTool)) {
          toolGroup.setToolPassive(activeTool);
        }

        // 3. 然后禁用十字线工具
        toolGroup.setToolDisabled(CrosshairsTool.toolName);
        setShowCrosshairs(false);
        console.log('✅ 已禁用十字线工具');
      } else {
        // 如果无法获取工具组，至少更新状态
        setShowCrosshairs(false);
      }
    }

    // 简化版本：只更新布局状态，让CSS样式自动调整
    // 注意：当前实现只支持3视口布局（grid-1x3, grid-3x1），其他布局可能显示不正确
    setCurrentLayout(layout);

    // 等待 DOM 更新和 CSS 样式生效
    // 然后触发 resize 事件，让 Cornerstone3D 重新计算视口大小比例
    setTimeout(() => {
      if (renderingEngine && viewportsGridRef.current) {
        // 使用 resize(true, true) 来强制视口重新计算大小
        // 参数1: immediate - 立即执行
        // 参数2: forceResize - 强制触发 resize 事件
        renderingEngine.resize(true, true);

        // 重置所有视口的缩放和位置，使图像适应视口
        viewportIds.forEach((viewportId) => {
          try {
            const viewport = renderingEngine!.getViewport(viewportId) as Types.IVolumeViewport;
            if (!viewport) return;

            // 重置相机以适应窗口
            viewport.resetCamera();
            console.log(`✅ 视口 ${viewportId} 已重置相机，图像已适应窗口`);
          } catch (error) {
            console.warn(`⚠️ 重置视口 ${viewportId} 失败:`, error);
          }
        });

        // 重新渲染所有视口
        renderingEngine.renderViewports(viewportIds);

        console.log(`✅ 布局已切换到: ${layout}，视口已重新计算大小并重置相机`);
      }
    }, 150); // 增加延迟确保 DOM 更新完成
  };

  // 计算视口的总切片数 - 现在使用动态计算的总切片数
  // 该函数已被 getImageSliceDataForVolumeViewport 替代
  // 保留此函数作为后备
  const getTotalSlices = (viewportId: string): number => {
    // 优先使用动态计算的总切片数
    if (totalSlicesForViewports[viewportId] > 0) {
      return totalSlicesForViewports[viewportId];
    }

    // 后备方案：根据体积尺寸和方位计算
    if (!volume) return 0;

    const { dimensions } = volume;
    const orientation = viewportOrientations[viewportId];

    switch (orientation) {
      case Enums.OrientationAxis.AXIAL:
        return dimensions[2];
      case Enums.OrientationAxis.SAGITTAL:
        return dimensions[0];
      case Enums.OrientationAxis.CORONAL:
        return dimensions[1];
      default:
        return 0;
    }
  };

  // 处理视口方位切换
  const handleOrientationChange = async (viewportId: string, newOrientation: Enums.OrientationAxis) => {
    if (!renderingEngine || !volume) {
      console.warn('渲染引擎或体积数据未初始化');
      return;
    }

    try {
      console.log(`🔄 切换视口 ${viewportId} 到方位: ${newOrientation}`);

      // 获取视口
      const viewport = renderingEngine.getViewport(viewportId) as Types.IVolumeViewport;
      if (!viewport) {
        console.error(`❌ 无法获取视口 ${viewportId}`);
        return;
      }

      // 获取当前相机状态
      const camera = viewport.getCamera();
      if (!camera.position || !camera.focalPoint) {
        console.error('❌ 相机状态无效');
        return;
      }

      // 根据方位设置相机的 viewPlaneNormal 和 viewUp
      let viewPlaneNormal: Types.Point3;
      let viewUp: Types.Point3;

      switch (newOrientation) {
        case Enums.OrientationAxis.AXIAL:
          // 横断位：从上往下看
          viewPlaneNormal = [0, 0, 1] as Types.Point3;
          viewUp = [0, 1, 0] as Types.Point3;
          break;
        case Enums.OrientationAxis.SAGITTAL:
          // 矢状位：从侧面看
          viewPlaneNormal = [1, 0, 0] as Types.Point3;
          viewUp = [0, 0, 1] as Types.Point3;
          break;
        case Enums.OrientationAxis.CORONAL:
          // 冠状位：从前往后看
          viewPlaneNormal = [0, 1, 0] as Types.Point3;
          viewUp = [0, 0, 1] as Types.Point3;
          break;
        default:
          console.warn(`未知方位: ${newOrientation}`);
          return;
      }

      // 计算体积中心
      const { dimensions, spacing, origin } = volume;
      const center = [
        origin[0] + (dimensions[0] * spacing[0]) / 2,
        origin[1] + (dimensions[1] * spacing[1]) / 2,
        origin[2] + (dimensions[2] * spacing[2]) / 2,
      ] as Types.Point3;

      // 计算当前相机到焦点的距离
      const distance = Math.sqrt(
        Math.pow(camera.position[0] - camera.focalPoint[0], 2) +
        Math.pow(camera.position[1] - camera.focalPoint[1], 2) +
        Math.pow(camera.position[2] - camera.focalPoint[2], 2)
      );

      // 设置新的相机方向和位置
      viewport.setCamera({
        viewPlaneNormal,
        viewUp,
        focalPoint: center,
        position: [
          center[0] + viewPlaneNormal[0] * distance,
          center[1] + viewPlaneNormal[1] * distance,
          center[2] + viewPlaneNormal[2] * distance,
        ] as Types.Point3,
      });

      // 更新状态
      setViewportOrientations((prev) => ({
        ...prev,
        [viewportId]: newOrientation,
      }));

      // 重新渲染视口
      renderingEngine.renderViewports([viewportId]);

      console.log(`✅ 视口 ${viewportId} 方位已切换到: ${newOrientation}`);
    } catch (error) {
      console.error('❌ 切换视口方位失败:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="loading-overlay">
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">正在初始化 Cornerstone3D...</div>
        </div>
      </div>
    );
  }

  if (isLoading && !volume) {
    return (
      <div className="loading-overlay">
        <div>
          <div className="loading-spinner"></div>
          <div className="loading-text">正在加载 DICOM 文件...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mpr-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".dcm,application/dicom"
        onChange={handleFileSelect}
        disabled={isLoading}
        multiple
        style={{ display: 'none' }}
      />

      {/* 顶部工具栏 */}
      <Toolbar
        onLoadFiles={() => fileInputRef.current?.click()}
        currentLayout={currentLayout}
        onLayoutChange={handleLayoutChange}
        activeTool={activeTool}
        toolModes={toolModes}
        onToolChange={handleToolChange}
        onToolModeChange={handleToolModeChange}
        onToggleCrosshairs={handleToggleCrosshairs}
        showCrosshairs={showCrosshairs}
        viewportCount={getViewportCountFromLayout(currentLayout)}
        onToggleWindowLevel={handleToggleWindowLevel}
        isWindowLevelActive={isWindowLevelActive}
        onRotate={handleRotate}
        onResetRotation={resetRotation}
        slabThickness={slabThickness}
        onSlabThicknessChange={handleSlabThicknessChange}
        slabMode={slabMode}
        onSlabModeChange={handleSlabModeChange}
        showScale={showScale}
        scaleLocation={scaleLocation}
        onToggleScale={handleToggleScale}
        onScaleLocationChange={handleScaleLocationChange}
        onDeleteSelected={handleDeleteSelected}
        seriesCount={seriesList.length}
        showSeriesPanel={showSeriesPanel}
        onToggleSeriesPanel={handleToggleSeriesPanel}
        showAnnotationsPanel={showAnnotationsPanel}
        onToggleAnnotationsPanel={handleToggleAnnotationsPanel}
        hasVolume={!!volume}
      />

      {/* 主内容区域 */}
      <div className="mpr-main">
        {/* 左侧面板区域（序列面板 + 测量面板） */}
        {annotationsPanelPosition === 'left' && (showSeriesPanel || showAnnotationsPanel) && (
          <div className="left-panels-container">
            {/* 左侧序列面板 */}
            {showSeriesPanel && seriesList.length > 0 && (
              <SeriesPanel
                seriesList={seriesList}
                currentSeriesUID={currentSeriesUID}
                onLoadSeries={handleLoadSeries}
                onClose={handleCloseSeriesPanel}
                isCollapsed={isSeriesPanelCollapsed}
                onToggleCollapse={handleToggleSeriesPanelCollapse}
              />
            )}

            {/* 左侧测量面板 */}
            {showAnnotationsPanel && (
              <AnnotationsPanel
                renderingEngine={renderingEngine}
                viewportIds={viewportIds}
                onClose={handleCloseAnnotationsPanel}
                isCollapsed={isAnnotationsPanelCollapsed}
                onToggleCollapse={handleToggleAnnotationsPanelCollapse}
                panelPosition="left"
                onPanelPositionChange={handleAnnotationsPanelPositionChange}
                volumeId={volumeId}
                secondaryVolumeId={secondaryVolumeId}
              />
            )}
          </div>
        )}

        {/* 右侧独立序列面板（仅在测量面板在右侧时显示） */}
        {annotationsPanelPosition === 'right' && showSeriesPanel && seriesList.length > 0 && (
          <SeriesPanel
            seriesList={seriesList}
            currentSeriesUID={currentSeriesUID}
            onLoadSeries={handleLoadSeries}
            onClose={handleCloseSeriesPanel}
            isCollapsed={isSeriesPanelCollapsed}
            onToggleCollapse={handleToggleSeriesPanelCollapse}
          />
        )}

        {/* 视口区域 */}
        <div className="viewport-area">
          {error && (
            <div className="error-message">
              ❌ {error}
              <button onClick={() => setError(null)} className="close-button">✕</button>
            </div>
          )}

          <div
            ref={viewportsGridRef}
            className="mpr-viewports"
            style={{
              gridTemplateColumns: getGridTemplateColumns(currentLayout),
              gridTemplateRows: getGridTemplateRows(currentLayout),
              gridTemplateAreas: currentLayout === 'grid-1-2' ? '"main top" "main bottom"' : undefined,
            }}
          >
            {/* 静态初始结构 - 只在初始布局（grid-1x3）时渲染 */}
            {currentLayout === 'grid-1x3' && viewportIds[0] === 'AXIAL' ? (
            <>
            <div
              className={`viewport-container${activeViewportId === 'AXIAL' ? ' active' : ''}${isMaximized && maximizedViewportId === 'AXIAL' ? ' maximized' : ''}${isMaximized && maximizedViewportId !== 'AXIAL' ? ' viewport-container-hidden' : ''}${currentLayout === 'grid-1-2' ? ' grid-1-2-main' : ''}`}
              onClick={() => handleViewportClick('AXIAL')}
              onDoubleClick={() => handleViewportDoubleClick('AXIAL')}
              style={currentLayout === 'grid-1-2' ? { gridArea: 'main' } : undefined}
            >
              <div className="viewport-label">Axial</div>
              <div
                ref={axialRef}
                className="viewport-element"
                id="axialViewport"
              />
              <ViewportOverlay
                viewportId="AXIAL"
                currentOrientation={viewportOrientations.AXIAL}
                onOrientationChange={handleOrientationChange}
                orientationEnabled={!!volume}
                imageIds={imageIds}
                currentImageIndex={currentImageIndices.AXIAL || 0}
                totalSlices={getTotalSlices('AXIAL')}
                seriesDescription={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.seriesDescription}
                modality={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.modality}
                patientName={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.patientName}
                windowCenter={windowLevels.AXIAL?.center || 40}
                windowWidth={windowLevels.AXIAL?.width || 400}
                isActive={activeViewportId === 'AXIAL'}
              />
            </div>

            <div
              className={`viewport-container${activeViewportId === 'SAGITTAL' ? ' active' : ''}${isMaximized && maximizedViewportId === 'SAGITTAL' ? ' maximized' : ''}${isMaximized && maximizedViewportId !== 'SAGITTAL' ? ' viewport-container-hidden' : ''}${currentLayout === 'grid-1-2' ? ' grid-1-2-top' : ''}`}
              onClick={() => handleViewportClick('SAGITTAL')}
              onDoubleClick={() => handleViewportDoubleClick('SAGITTAL')}
              style={currentLayout === 'grid-1-2' ? { gridArea: 'top' } : undefined}
            >
              <div className="viewport-label">Sagittal</div>
              <div
                ref={sagittalRef}
                className="viewport-element"
                id="sagittalViewport"
              />
              <ViewportOverlay
                viewportId="SAGITTAL"
                currentOrientation={viewportOrientations.SAGITTAL}
                onOrientationChange={handleOrientationChange}
                orientationEnabled={!!volume}
                imageIds={imageIds}
                currentImageIndex={currentImageIndices.SAGITTAL || 0}
                totalSlices={getTotalSlices('SAGITTAL')}
                seriesDescription={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.seriesDescription}
                modality={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.modality}
                patientName={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.patientName}
                windowCenter={windowLevels.SAGITTAL?.center || 40}
                windowWidth={windowLevels.SAGITTAL?.width || 400}
                isActive={activeViewportId === 'SAGITTAL'}
              />
            </div>

            <div
              className={`viewport-container${activeViewportId === 'CORONAL' ? ' active' : ''}${isMaximized && maximizedViewportId === 'CORONAL' ? ' maximized' : ''}${isMaximized && maximizedViewportId !== 'CORONAL' ? ' viewport-container-hidden' : ''}${currentLayout === 'grid-1-2' ? ' grid-1-2-bottom' : ''}`}
              onClick={() => handleViewportClick('CORONAL')}
              onDoubleClick={() => handleViewportDoubleClick('CORONAL')}
              style={currentLayout === 'grid-1-2' ? { gridArea: 'bottom' } : undefined}
            >
              <div className="viewport-label">Coronal</div>
              <div
                ref={coronalRef}
                className="viewport-element"
                id="coronalViewport"
              />
              <ViewportOverlay
                viewportId="CORONAL"
                currentOrientation={viewportOrientations.CORONAL}
                onOrientationChange={handleOrientationChange}
                orientationEnabled={!!volume}
                imageIds={imageIds}
                currentImageIndex={currentImageIndices.CORONAL || 0}
                totalSlices={getTotalSlices('CORONAL')}
                seriesDescription={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.seriesDescription}
                modality={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.modality}
                patientName={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.patientName}
                windowCenter={windowLevels.CORONAL?.center || 40}
                windowWidth={windowLevels.CORONAL?.width || 400}
                isActive={activeViewportId === 'CORONAL'}
              />
            </div>
            </>
            ) : null}
          </div>

          {/* 体积信息 */}
          {volume && (
            <div className="volume-info">
              📊 {volume.dimensions.join(' × ')}
            </div>
          )}
        </div>

        {/* 右侧测量面板（仅在面板位置为 right 时显示） */}
        {annotationsPanelPosition === 'right' && showAnnotationsPanel && (
          <AnnotationsPanel
            renderingEngine={renderingEngine}
            viewportIds={viewportIds}
            onClose={handleCloseAnnotationsPanel}
            isCollapsed={isAnnotationsPanelCollapsed}
            onToggleCollapse={handleToggleAnnotationsPanelCollapse}
            panelPosition="right"
            onPanelPositionChange={handleAnnotationsPanelPositionChange}
            volumeId={volumeId}
            secondaryVolumeId={secondaryVolumeId}
          />
        )}
      </div>
    </div>
  );
}

export default MPRViewer;
