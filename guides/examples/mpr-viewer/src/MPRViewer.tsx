import React, { useEffect, useRef, useState } from 'react';
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

const { selection } = annotation;
import { useSlabThickness } from './hooks/useSlabThickness';
import { useObliqueRotation } from './hooks/useObliqueRotation';
import { initCornerstone } from './cornerstone/init';
import AnnotationsPanel from './components/AnnotationsPanel';
import SeriesPanel, { SeriesInfo } from './components/SeriesPanel';
import Toolbar from './components/Toolbar';
import ViewportOverlay from './components/ViewportOverlay';
import { generateThumbnailsForSeries } from './utils/thumbnailGenerator';
import type { IVolume } from '@cornerstonejs/core/types';
import type { ViewportLayout } from './components/panels';

const { MouseBindings, ToolModes } = csToolsEnums;

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>('Crosshairs');
  const [showScale, setShowScale] = useState<boolean>(true);
  const [scaleLocation, setScaleLocation] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);
  const [showSeriesPanel, setShowSeriesPanel] = useState<boolean>(false);
  const [isSeriesPanelCollapsed, setIsSeriesPanelCollapsed] = useState<boolean>(false);
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState<boolean>(false);
  const [isAnnotationsPanelCollapsed, setIsAnnotationsPanelCollapsed] = useState<boolean>(false);
  const [annotationsPanelPosition, setAnnotationsPanelPosition] = useState<'left' | 'right'>('right');
  const [seriesList, setSeriesList] = useState<SeriesInfo[]>([]);
  const [currentSeriesUID, setCurrentSeriesUID] = useState<string | null>(null);

  // 视口布局状态
  const [currentLayout, setCurrentLayout] = useState<ViewportLayout>('grid-1x3');

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
    Crosshairs: ToolModes.Active,
    WindowLevel: ToolModes.Passive,
    Length: ToolModes.Passive,
    Angle: ToolModes.Passive,
    Bidirectional: ToolModes.Passive,
    Probe: ToolModes.Passive,
    RectangleROI: ToolModes.Passive,
    EllipticalROI: ToolModes.Passive,
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

  // 调试：监控序列面板状态变化
  useEffect(() => {
    console.log('🔍 序列面板状态更新:', {
      showSeriesPanel,
      seriesListLength: seriesList.length,
      currentSeriesUID
    });
  }, [showSeriesPanel, seriesList.length, currentSeriesUID]);

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

    const viewportIds = ['AXIAL', 'SAGITTAL', 'CORONAL'];
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
        if (current.center !== center || current.width !== width) {
          return {
            ...prev,
            [viewportId]: { center, width },
          };
        }
        return prev;
      });
    };

    // 为每个视口添加事件监听
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
  }, [renderingEngine, volume]);

  // 监听视口切片位置变化 - 使用 Cornerstone3D 事件系统（无延迟）
  useEffect(() => {
    if (!renderingEngine || !volume) return;

    const viewportIds = ['AXIAL', 'SAGITTAL', 'CORONAL'];
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

    // 为每个视口添加事件监听
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
  }, [renderingEngine, volume]);

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

          console.log(`📋 ImageID: ${imageId.slice(0, 20)}...`);
          console.log('  seriesModule:', seriesModule);
          console.log('  generalSeriesModule:', generalSeriesModule);
          console.log('  generalStudyModule:', generalStudyModule);
          console.log('  patientModule:', patientModule);

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
      console.log('📋 序列详情:');
      seriesInfoMap.forEach((info, uid) => {
        console.log(`  - ${info.seriesDescription} (${info.modality}): ${info.numberOfImages} 张图像`);
      });

      // 将新的序列添加到列表中
      const newSeriesList = Array.from(seriesInfoMap.values());
      console.log(`📦 准备添加 ${newSeriesList.length} 个序列到列表`);

      // 生成缩略图
      console.log('🎨 开始生成序列缩略图...');
      await generateThumbnailsForSeries(newSeriesList);
      console.log('✅ 序列缩略图生成完成');
      console.log('  序列详情:', newSeriesList.map(s => ({
        uid: s.seriesInstanceUID.slice(0, 8) + '...',
        number: s.seriesNumber,
        description: s.seriesDescription,
        modality: s.modality,
        images: s.numberOfImages
      })));

      setSeriesList((prev) => {
        console.log('🔄 当前序列列表:', prev.map(s => ({
          uid: s.seriesInstanceUID.slice(0, 8) + '...',
          description: s.seriesDescription
        })));

        // 合并序列列表，避免重复
        const existingUIDs = new Set(prev.map(s => s.seriesInstanceUID));
        console.log('🔍 已存在的序列 UIDs:', Array.from(existingUIDs).map(uid => uid.slice(0, 8) + '...'));

        const uniqueNewSeries = newSeriesList.filter(s => {
          const isNew = !existingUIDs.has(s.seriesInstanceUID);
          console.log(`  检查序列 ${s.seriesDescription} (${s.seriesInstanceUID.slice(0, 8)}...): ${isNew ? '新序列 ✅' : '已存在 ❌'}`);
          return isNew;
        });

        const updatedList = [...prev, ...uniqueNewSeries];
        console.log(`📝 序列列表更新: ${prev.length} -> ${updatedList.length}`);

        // 延迟设置 showSeriesPanel，确保 setSeriesList 已经完成
        setTimeout(() => {
          setShowSeriesPanel(true);
          console.log(`✅ 已显示序列面板，共 ${updatedList.length} 个序列`);
          console.log(`🔍 当前状态: showSeriesPanel=true, seriesList.length=${updatedList.length}`);
        }, 100);

        return updatedList;
      });

      // 创建体积数据
      const volumeId = `my-volume-id-${Date.now()}`;
      console.log('📦 正在创建体积数据...');

      const volume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds: newImageIds,
      });

      // 关键步骤:调用 volume.load() 开始加载体积数据
      volume.load();
      console.log('✅ 开始加载体积数据...');

      setVolume(volume);

      // 设置当前加载的序列
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

      // 创建工具组
      const toolGroupId = 'mprToolGroup';
      let toolGroup;
      try {
        toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
      } catch (error) {
        console.log('⚠️ 工具组已存在，复用现有工具组');
        toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      }

      if (!toolGroup) {
        console.error('❌ 无法创建或获取工具组');
        return;
      }

      // 添加工具到工具组
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName, {
        minZoomScale: 0.001,
        maxZoomScale: 4000,
      });
      toolGroup.addTool(StackScrollTool.toolName);
      toolGroup.addTool(CrosshairsTool.toolName);
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

      // 将工具组应用到视口（必须在设置工具活动状态之前）
      toolGroup.addViewport('AXIAL', 'mprEngine');
      toolGroup.addViewport('SAGITTAL', 'mprEngine');
      toolGroup.addViewport('CORONAL', 'mprEngine');

      // 设置平移工具 - 中键
      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [
          { mouseButton: MouseBindings.Auxiliary },
        ],
      });

      // 设置缩放工具 - 右键
      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [
          { mouseButton: MouseBindings.Secondary },
        ],
      });

      // 设置滚轮换层工具 - 滚轮
      toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [
          { mouseButton: MouseBindings.Wheel },
        ],
      });

      // 设置 Crosshairs 工具 - 左键,用于MPR三个视口的联动
      toolGroup.setToolActive(CrosshairsTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });

      // 启用比例尺工具
      if (showScale) {
        toolGroup.setToolEnabled(ScaleOverlayTool.toolName);
      } else {
        toolGroup.setToolDisabled(ScaleOverlayTool.toolName);
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
  const handleLoadSeries = async (seriesInfo: SeriesInfo) => {
    if (!renderingEngine) {
      console.warn('渲染引擎未初始化');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`🔄 正在切换到序列 ${seriesInfo.seriesNumber}: ${seriesInfo.seriesDescription}`);

      // 使用序列的 imageIds 创建新的体积数据
      const volumeId = `volume-${seriesInfo.seriesInstanceUID}`;
      const newVolume = await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds: seriesInfo.imageIds,
      });

      newVolume.load();

      // 为所有视口设置新的 volume
      await setVolumesForViewports(
        renderingEngine,
        [{ volumeId }],
        ['AXIAL', 'SAGITTAL', 'CORONAL']
      );

      // 更新当前序列
      setCurrentSeriesUID(seriesInfo.seriesInstanceUID);
      setImageIds(seriesInfo.imageIds);
      setVolume(newVolume as IVolume); // 类型转换以避免 TypeScript 错误

      // 重新渲染所有视口
      renderingEngine.renderViewports(['AXIAL', 'SAGITTAL', 'CORONAL']);

      console.log(`✅ 已切换到序列 ${seriesInfo.seriesNumber}`);
    } catch (error) {
      console.error('❌ 切换序列失败:', error);
      setError(`切换序列失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
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

  // 处理工具切换
  const handleToolChange = (toolName: string) => {
    if (!renderingEngine) return;

    const toolGroupId = 'mprToolGroup';
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    if (!toolGroup) {
      console.error('❌ 无法获取工具组');
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

    // 只将其他 Active 的工具改为 Passive，保留其他工具的状态
    switchableTools.forEach((t) => {
      if (t !== toolName && toolModes[t] === ToolModes.Active) {
        toolGroup.setToolPassive(t);
        // 更新状态
        setToolModes((prev) => ({
          ...prev,
          [t]: ToolModes.Passive,
        }));
      }
    });

    // 激活选中的工具
    if (switchableTools.includes(toolName)) {
      toolGroup.setToolActive(toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });

      // 更新该工具的模式状态为 Active
      setToolModes((prev) => ({
        ...prev,
        [toolName]: ToolModes.Active,
      }));

      setActiveTool(toolName);
      console.log(`✅ 已激活工具: ${toolName}`);
    } else {
      // 如果不是已知工具，默认激活 Crosshairs
      toolGroup.setToolActive(CrosshairsTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });

      setToolModes((prev) => ({
        ...prev,
        [CrosshairsTool.toolName]: ToolModes.Active,
      }));

      setActiveTool(CrosshairsTool.toolName);
      console.log('✅ 已切换到默认工具（十字线）');
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
    setShowCrosshairs(newShowCrosshairs);

    const toolGroupId = 'mprToolGroup';
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    if (!toolGroup) {
      console.error('❌ 无法获取工具组');
      return;
    }

    if (newShowCrosshairs) {
      // 启用十字线工具（设置为 active 模式）
      toolGroup.setToolActive(CrosshairsTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
      setActiveTool(CrosshairsTool.toolName);
      console.log('✅ 已启用十字线');
    } else {
      // 完全禁用十字线工具
      toolGroup.setToolDisabled(CrosshairsTool.toolName);

      // 如果当前激活的是十字线工具，则切换到窗宽窗位工具
      if (activeTool === CrosshairsTool.toolName) {
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
        setActiveTool(WindowLevelTool.toolName);
        console.log('✅ 已禁用十字线并切换到窗宽窗位工具');
      } else {
        console.log('✅ 已禁用十字线');
      }
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

    const toolGroupId = 'mprToolGroup';
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    if (!toolGroup) {
      console.error('❌ 无法获取工具组');
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
      switchableTools.forEach((t) => {
        if (t !== toolName && toolModes[t] === ToolModes.Active) {
          toolGroup.setToolPassive(t);
          // 更新状态
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
  const handleLayoutChange = (layout: ViewportLayout) => {
    console.log(`🔄 切换布局到: ${layout}`);

    // 网格布局处理 (暂时只记录日志，实际实现需要更多代码)
    if (layout.startsWith('grid-')) {
      const [, rows, cols] = layout.split('-')[1].split('x').map(Number);
      console.log(`  网格布局: ${rows}行 x ${cols}列`);
      // TODO: 实现网格布局切换逻辑
    } else {
      console.log(`  协议布局: ${layout}`);
      // TODO: 实现协议布局切换逻辑
    }

    setCurrentLayout(layout);
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
        onToggleSeriesPanel={() => setShowSeriesPanel(!showSeriesPanel)}
        showAnnotationsPanel={showAnnotationsPanel}
        onToggleAnnotationsPanel={() => setShowAnnotationsPanel(!showAnnotationsPanel)}
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
                onClose={() => setShowSeriesPanel(false)}
                isCollapsed={isSeriesPanelCollapsed}
                onToggleCollapse={() => setIsSeriesPanelCollapsed(!isSeriesPanelCollapsed)}
              />
            )}

            {/* 左侧测量面板 */}
            {showAnnotationsPanel && (
              <AnnotationsPanel
                renderingEngine={renderingEngine}
                viewportIds={['AXIAL', 'SAGITTAL', 'CORONAL']}
                onClose={() => setShowAnnotationsPanel(false)}
                isCollapsed={isAnnotationsPanelCollapsed}
                onToggleCollapse={() => setIsAnnotationsPanelCollapsed(!isAnnotationsPanelCollapsed)}
                panelPosition="left"
                onPanelPositionChange={handleAnnotationsPanelPositionChange}
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
            onClose={() => setShowSeriesPanel(false)}
            isCollapsed={isSeriesPanelCollapsed}
            onToggleCollapse={() => setIsSeriesPanelCollapsed(!isSeriesPanelCollapsed)}
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

          <div ref={viewportsGridRef} className="mpr-viewports">
            <div className="viewport-container">
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
                currentImageIndex={currentImageIndices.AXIAL}
                totalSlices={getTotalSlices('AXIAL')}
                seriesDescription={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.seriesDescription}
                modality={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.modality}
                patientName={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.patientName}
                windowCenter={windowLevels.AXIAL.center}
                windowWidth={windowLevels.AXIAL.width}
              />
            </div>

            <div className="viewport-container">
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
                currentImageIndex={currentImageIndices.SAGITTAL}
                totalSlices={getTotalSlices('SAGITTAL')}
                seriesDescription={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.seriesDescription}
                modality={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.modality}
                patientName={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.patientName}
                windowCenter={windowLevels.SAGITTAL.center}
                windowWidth={windowLevels.SAGITTAL.width}
              />
            </div>

            <div className="viewport-container">
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
                currentImageIndex={currentImageIndices.CORONAL}
                totalSlices={getTotalSlices('CORONAL')}
                seriesDescription={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.seriesDescription}
                modality={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.modality}
                patientName={seriesList.find(s => s.seriesInstanceUID === currentSeriesUID)?.patientName}
                windowCenter={windowLevels.CORONAL.center}
                windowWidth={windowLevels.CORONAL.width}
              />
            </div>
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
            viewportIds={['AXIAL', 'SAGITTAL', 'CORONAL']}
            onClose={() => setShowAnnotationsPanel(false)}
            isCollapsed={isAnnotationsPanelCollapsed}
            onToggleCollapse={() => setIsAnnotationsPanelCollapsed(!isAnnotationsPanelCollapsed)}
            panelPosition="right"
            onPanelPositionChange={handleAnnotationsPanelPositionChange}
          />
        )}
      </div>
    </div>
  );
}

export default MPRViewer;
