import React, { useEffect, useRef, useState } from 'react';
import { RenderingEngine, Enums, volumeLoader, Types, setVolumesForViewports, utilities, metaData } from '@cornerstonejs/core';
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
import { state, annotation } from '@cornerstonejs/tools';

const { selection } = annotation;
import { useSlabThickness } from './hooks/useSlabThickness';
import { useObliqueRotation } from './hooks/useObliqueRotation';
import { initCornerstone } from './cornerstone/init';
import AnnotationsPanel from './components/AnnotationsPanel';
import type { IVolume } from '@cornerstonejs/core/types';

const { MouseBindings, KeyboardBindings, ToolModes } = csToolsEnums;

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
      {/* 工具栏 */}
      <div className="mpr-toolbar">
        <div className="toolbar-group">
          <label className="toolbar-label">文件操作:</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".dcm,application/dicom"
            onChange={handleFileSelect}
            disabled={isLoading}
            multiple
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="primary-button"
          >
            📁 加载 DICOM 文件
          </button>
          {imageIds.length > 0 && (
            <span className="info-text">
              已加载 {imageIds.length} 张文件
            </span>
          )}
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">视图旋转:</label>
          <button onClick={() => handleRotate(15, 'z')} disabled={!volume}>
            ↺ 向左 15°
          </button>
          <button onClick={() => handleRotate(-15, 'z')} disabled={!volume}>
            向右 15° ↻
          </button>
          <button onClick={() => handleRotate(15, 'x')} disabled={!volume}>
            ↑ 向上 15°
          </button>
          <button onClick={() => handleRotate(-15, 'x')} disabled={!volume}>
            向下 15° ↓
          </button>
          <button onClick={resetRotation} disabled={!volume}>
            🔄 重置
          </button>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">工具选择:</label>

          {/* 基础工具组 */}
          <button
            onClick={() => handleToolChange(CrosshairsTool.toolName)}
            disabled={!volume}
            className={activeTool === CrosshairsTool.toolName ? 'active-button' : ''}
            title="十字线工具 - 联动三个视口"
          >
            🎯 十字线
          </button>
          <button
            onClick={handleToggleCrosshairs}
            disabled={!volume}
            className={showCrosshairs ? 'active-button' : ''}
            title={showCrosshairs ? '隐藏十字线' : '显示十字线'}
          >
            {showCrosshairs ? '✓ 显示' : '✗ 隐藏'}
          </button>
          <button
            onClick={() => handleToolChange(WindowLevelTool.toolName)}
            disabled={!volume}
            className={activeTool === WindowLevelTool.toolName ? 'active-button' : ''}
            title="窗宽窗位 - 调整影像对比度"
          >
            🎨 窗宽窗位
          </button>

          {/* 测量工具组 */}
          <button
            onClick={() => handleToolChange(LengthTool.toolName)}
            disabled={!volume}
            className={activeTool === LengthTool.toolName ? 'active-button' : ''}
            title="长度测量 - 测量两点间距离"
          >
            📏 长度
          </button>
          <button
            onClick={() => handleToolChange(AngleTool.toolName)}
            disabled={!volume}
            className={activeTool === AngleTool.toolName ? 'active-button' : ''}
            title="角度测量 - 测量三条线角度"
          >
            📐 角度
          </button>
          <button
            onClick={() => handleToolChange(BidirectionalTool.toolName)}
            disabled={!volume}
            className={activeTool === BidirectionalTool.toolName ? 'active-button' : ''}
            title="双向测量 - 测量长轴和短轴"
          >
            📏 双向
          </button>
          <button
            onClick={() => handleToolChange(ProbeTool.toolName)}
            disabled={!volume}
            className={activeTool === ProbeTool.toolName ? 'active-button' : ''}
            title="探针工具 - 查看点位信息"
          >
            🔍 探针
          </button>

          {/* ROI工具组 */}
          <button
            onClick={() => handleToolChange(RectangleROITool.toolName)}
            disabled={!volume}
            className={activeTool === RectangleROITool.toolName ? 'active-button' : ''}
            title="矩形ROI - 绘制矩形感兴趣区域"
          >
            ⬜ 矩形ROI
          </button>
          <button
            onClick={() => handleToolChange(EllipticalROITool.toolName)}
            disabled={!volume}
            className={activeTool === EllipticalROITool.toolName ? 'active-button' : ''}
            title="椭圆ROI - 绘制椭圆感兴趣区域"
          >
            ⭕ 椭圆ROI
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!volume}
            title="删除选中的测量（先点击测量以选中，然后点击此按钮删除）"
            style={{ backgroundColor: '#dc3545' }}
          >
            🗑️ 删除选中
          </button>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">工具模式:</label>

          {/* 工具模式选择器 - 只为当前激活的工具显示 */}
          <select
            value={toolModes[activeTool]}
            onChange={(e) => handleToolModeChange(activeTool, e.target.value)}
            disabled={!volume}
            title="选择当前工具的模式"
            style={{ padding: '4px', fontSize: '12px', minWidth: '100px' }}
          >
            <option value={ToolModes.Active}>激活 - 可绘制</option>
            <option value={ToolModes.Passive}>被动 - 可交互</option>
            <option value={ToolModes.Enabled}>启用 - 仅显示</option>
            <option value={ToolModes.Disabled}>禁用 - 隐藏</option>
          </select>

          <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>
            当前工具: {activeTool}
          </span>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">比例尺:</label>
          <button
            onClick={handleToggleScale}
            disabled={!volume}
            className={showScale ? 'active-button' : ''}
            title={showScale ? '隐藏比例尺' : '显示比例尺'}
          >
            {showScale ? '📏 显示' : '📏 隐藏'}
          </button>
          <select
            value={scaleLocation}
            onChange={(e) => handleScaleLocationChange(e.target.value as 'top' | 'bottom' | 'left' | 'right')}
            disabled={!volume || !showScale}
            title="选择比例尺位置"
          >
            <option value="top">顶部</option>
            <option value="bottom">底部</option>
            <option value="left">左侧</option>
            <option value="right">右侧</option>
          </select>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
            <button onClick={() => setError(null)} className="close-button">✕</button>
          </div>
        )}
      </div>

      {/* 三个视口 */}
      <div ref={viewportsGridRef} className="mpr-viewports">
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
            disabled={!volume}
          />
          <span>{slabThickness}</span>
        </div>

        <div className="control-group">
          <label>投影模式:</label>
          <select
            value={slabMode}
            onChange={(e) => handleSlabModeChange(e.target.value as 'max' | 'min' | 'avg')}
            disabled={!volume}
          >
            <option value="max">最大强度投影 (MIP)</option>
            <option value="min">最小强度投影 (MinIP)</option>
            <option value="avg">平均投影</option>
          </select>
        </div>

        {volume && (
          <div className="info-text">
            📊 体积尺寸: {volume.dimensions.join(' × ')}
          </div>
        )}
      </div>

      {/* 测量面板 */}
      <AnnotationsPanel
        renderingEngine={renderingEngine}
        viewportIds={['AXIAL', 'SAGITTAL', 'CORONAL']}
      />
    </div>
  );
}

export default MPRViewer;
