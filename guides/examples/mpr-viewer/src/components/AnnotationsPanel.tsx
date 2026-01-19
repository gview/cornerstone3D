import React, { useState, useEffect, useCallback, useRef } from 'react';
import { annotation, Enums } from '@cornerstonejs/tools';
import { eventTarget } from '@cornerstonejs/core';
import type { Types } from '@cornerstonejs/core';

const { visibility, state } = annotation;

interface Annotation {
  annotationUID: string;
  metadata: {
    toolName: string;
    label?: string;
    referencedImageId?: string;
    [key: string]: any;
  };
  data: {
    label?: string;
    handles?: {
      points?: Array<{ x: number; y: number; z: number }>;
      start?: { x: number; y: number; z: number };
      end?: { x: number; y: number; z: number };
      [key: string]: any;
    };
    [key: string]: any;
  };
}

interface AnnotationsPanelProps {
  renderingEngine: Types.IRenderingEngine | null;
  viewportIds: string[];
  onPositionChange?: (isDocked: boolean) => void;
}

const AnnotationsPanel: React.FC<AnnotationsPanelProps> = ({
  renderingEngine,
  viewportIds,
  onPositionChange,
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDocked, setIsDocked] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 检测是否应该切换到嵌入模式
  useEffect(() => {
    const dockThreshold = 50; // 距离左边50px时自动嵌入

    if (position.x <= dockThreshold && !isDocked) {
      setIsDocked(true);
      onPositionChange?.(true);
    } else if (position.x > dockThreshold && isDocked) {
      setIsDocked(false);
      onPositionChange?.(false);
    }
  }, [position.x, isDocked, onPositionChange]);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 只响应左键
    if (e.button !== 0) return;

    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);

    // 如果当前是嵌入模式，拖拽时切换到浮动模式
    if (isDocked) {
      setIsDocked(false);
      onPositionChange?.(false);
    }
  };

  // 处理拖拽移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 限制在窗口范围内
      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 100;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // 刷新标注列表
  const refreshAnnotations = useCallback(() => {
    try {
      const allAnnotations = state.getAllAnnotations() as Annotation[];

      // 过滤掉非测量工具（Crosshairs 和 ScaleOverlay）
      const measurementAnnotations = allAnnotations.filter(
        (ann) =>
          ann.metadata.toolName !== 'Crosshairs' &&
          ann.metadata.toolName !== 'ScaleOverlay'
      );

      setAnnotations(measurementAnnotations);
    } catch (error) {
      console.error('❌ 获取标注列表失败:', error);
    }
  }, []);

  // 监听标注变化
  useEffect(() => {
    if (!renderingEngine) return;

    // 初始加载
    refreshAnnotations();

    // 监听标注状态变化事件
    const handleAnnotationChange = () => {
      refreshAnnotations();
    };

    // 添加事件监听器到 eventTarget（Cornerstone3D 的事件系统）
    // 使用 Enums.Events 中的事件常量
    eventTarget.addEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationChange);
    eventTarget.addEventListener(Enums.Events.ANNOTATION_REMOVED, handleAnnotationChange);
    eventTarget.addEventListener(Enums.Events.ANNOTATION_MODIFIED, handleAnnotationChange);

    return () => {
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationChange);
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_REMOVED, handleAnnotationChange);
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_MODIFIED, handleAnnotationChange);
    };
  }, [renderingEngine, refreshAnnotations]);

  // 删除单个标注
  const deleteAnnotation = (annotationUID: string) => {
    try {
      // 删除标注
      state.removeAnnotation(annotationUID);

      // 重新渲染视口
      if (renderingEngine) {
        renderingEngine.renderViewports(viewportIds);
      }

      // 从列表中移除
      setAnnotations((prev) => prev.filter((ann) => ann.annotationUID !== annotationUID));

      console.log(`✅ 已删除测量 ${annotationUID.slice(0, 8)}...`);
    } catch (error) {
      console.error('❌ 删除标注失败:', error);
      alert('删除测量失败，请重试');
    }
  };

  // 切换标注可见性
  const toggleAnnotationVisibility = (annotationUID: string, isVisible: boolean) => {
    try {
      visibility.setAnnotationVisibility(annotationUID, isVisible);

      // 重新渲染视口
      if (renderingEngine) {
        renderingEngine.renderViewports(viewportIds);
      }

      // 强制刷新组件状态以更新UI
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.annotationUID === annotationUID
            ? { ...ann } // 触发重新渲染
            : ann
        )
      );

      console.log(`✅ 标注 ${annotationUID.slice(0, 8)}... 可见性: ${isVisible}`);
    } catch (error) {
      console.error('❌ 切换标注可见性失败:', error);
    }
  };

  // 显示所有标注
  const showAllAnnotations = () => {
    try {
      const allAnnotations = state.getAllAnnotations() as Annotation[];

      // 过滤出测量工具，忽略 Crosshairs 和 ScaleOverlay
      const measurementAnnotations = allAnnotations.filter(
        (ann) =>
          ann.metadata.toolName !== 'Crosshairs' &&
          ann.metadata.toolName !== 'ScaleOverlay'
      );

      // 逐个设置可见性
      measurementAnnotations.forEach((ann) => {
        try {
          visibility.setAnnotationVisibility(ann.annotationUID, true);
        } catch (error) {
          // 忽略单个标注的错误
          console.warn(`无法显示标注 ${ann.annotationUID.slice(0, 8)}...`);
        }
      });

      // 重新渲染视口
      if (renderingEngine) {
        renderingEngine.renderViewports(viewportIds);
      }

      // 强制刷新组件状态
      setAnnotations((prev) => [...prev]);

      console.log(`✅ 已显示 ${measurementAnnotations.length} 个测量`);
    } catch (error) {
      console.error('❌ 显示所有标注失败:', error);
    }
  };

  // 隐藏所有标注
  const hideAllAnnotations = () => {
    try {
      const allAnnotations = state.getAllAnnotations() as Annotation[];

      // 过滤出测量工具，忽略 Crosshairs 和 ScaleOverlay
      const measurementAnnotations = allAnnotations.filter(
        (ann) =>
          ann.metadata.toolName !== 'Crosshairs' &&
          ann.metadata.toolName !== 'ScaleOverlay'
      );

      // 逐个设置可见性
      measurementAnnotations.forEach((ann) => {
        try {
          visibility.setAnnotationVisibility(ann.annotationUID, false);
        } catch (error) {
          // 忽略单个标注的错误
          console.warn(`无法隐藏标注 ${ann.annotationUID.slice(0, 8)}...`);
        }
      });

      // 重新渲染视口
      if (renderingEngine) {
        renderingEngine.renderViewports(viewportIds);
      }

      // 强制刷新组件状态
      setAnnotations((prev) => [...prev]);

      console.log(`✅ 已隐藏 ${measurementAnnotations.length} 个测量`);
    } catch (error) {
      console.error('❌ 隐藏所有标注失败:', error);
    }
  };

  // 获取工具显示名称
  const getToolDisplayName = (toolName: string): string => {
    const toolNames: Record<string, string> = {
      Length: '长度',
      Angle: '角度',
      Bidirectional: '双向',
      Probe: '探针',
      RectangleROI: '矩形ROI',
      EllipticalROI: '椭圆ROI',
      ArrowAnnotate: '箭头',
      CircleROI: '圆形ROI',
      PlanarFreehandROI: '自由手绘ROI',
      SplineROI: '样条ROI',
    };
    return toolNames[toolName] || toolName;
  };

  // 获取标注的可见性状态
  const getAnnotationVisibility = (annotationUID: string): boolean => {
    try {
      const isVisible = visibility.isAnnotationVisible(annotationUID);
      return isVisible ?? true;
    } catch {
      return true;
    }
  };

  // 跳转到测量的位置
  const jumpToAnnotation = (annotation: Annotation) => {
    try {
      if (!renderingEngine) return;

      // 从测量数据中获取空间坐标
      let targetPoint: { x: number; y: number; z: number } | undefined;

      // 尝试从 handles 中获取坐标
      if (annotation.data.handles) {
        const { handles } = annotation.data;

        // 调试：输出工具类型和 handles 结构
        console.log('🔍 测量工具:', annotation.metadata.toolName);
        console.log('🔍 Handles 结构:', JSON.stringify(handles, null, 2));

        // 对于线段工具（如长度、角度）- 使用 start 点
        if (handles.start && typeof handles.start.x === 'number') {
          targetPoint = handles.start;
        }
        // 对于点数组和 ROI 工具
        else if (handles.points && Array.isArray(handles.points) && handles.points.length > 0) {
          const firstPoint = handles.points[0];

          // 检查是对象格式 {x, y, z} 还是数组格式 [x, y, z]
          if (firstPoint && typeof firstPoint === 'object') {
            if (typeof firstPoint.x === 'number') {
              // 对象格式 - 点工具（如探针）
              targetPoint = firstPoint;
            } else if (Array.isArray(firstPoint) && firstPoint.length >= 3) {
              // 数组格式 - ROI 工具（矩形、椭圆）
              // 计算所有顶点的中心点
              let sumX = 0, sumY = 0, sumZ = 0;
              handles.points.forEach((point: any) => {
                if (Array.isArray(point) && point.length >= 3) {
                  sumX += point[0];
                  sumY += point[1];
                  sumZ += point[2];
                }
              });

              const count = handles.points.length;
              targetPoint = {
                x: sumX / count,
                y: sumY / count,
                z: sumZ / count
              };

              console.log(`✅ ROI 中心点: [${targetPoint.x.toFixed(2)}, ${targetPoint.y.toFixed(2)}, ${targetPoint.z.toFixed(2)}]`);
            }
          }
        }
      }

      if (!targetPoint || typeof targetPoint.x !== 'number' || isNaN(targetPoint.x)) {
        console.warn('⚠️ 无法获取测量的空间坐标');
        return;
      }

      // 获取三个视口的相机
      const axialViewport = renderingEngine.getViewport(viewportIds[0]) as Types.IVolumeViewport;
      const sagittalViewport = renderingEngine.getViewport(viewportIds[1]) as Types.IVolumeViewport;
      const coronalViewport = renderingEngine.getViewport(viewportIds[2]) as Types.IVolumeViewport;

      if (!axialViewport || !sagittalViewport || !coronalViewport) {
        console.warn('⚠️ 无法获取视口');
        return;
      }

      // 获取当前相机
      const axialCamera = axialViewport.getCamera();
      const sagittalCamera = sagittalViewport.getCamera();
      const coronalCamera = coronalViewport.getCamera();

      // 检查相机对象的有效性
      if (!axialCamera.position || !axialCamera.focalPoint ||
          !sagittalCamera.position || !sagittalCamera.focalPoint ||
          !coronalCamera.position || !coronalCamera.focalPoint) {
        console.warn('⚠️ 相机数据无效');
        return;
      }

      // 只更新每个视口对应轴的 focalPoint，保持相机位置不变
      // 这样可以保持缩放和平移，只改变切片位置

      // Axial 视口（横断位）：只更新 z 轴（切片层）
      axialCamera.focalPoint = [
        axialCamera.focalPoint[0],
        axialCamera.focalPoint[1],
        targetPoint.z
      ] as Types.Point3;

      // Sagittal 视口（矢状位）：只更新 x 轴（切片层）
      sagittalCamera.focalPoint = [
        targetPoint.x,
        sagittalCamera.focalPoint[1],
        sagittalCamera.focalPoint[2]
      ] as Types.Point3;

      // Coronal 视口（冠状位）：只更新 y 轴（切片层）
      coronalCamera.focalPoint = [
        coronalCamera.focalPoint[0],
        targetPoint.y,
        coronalCamera.focalPoint[2]
      ] as Types.Point3;

      // 应用相机并重新渲染
      axialViewport.setCamera(axialCamera);
      sagittalViewport.setCamera(sagittalCamera);
      coronalViewport.setCamera(coronalCamera);

      renderingEngine.renderViewports(viewportIds);

      const xStr = (targetPoint.x ?? 0).toFixed(2);
      const yStr = (targetPoint.y ?? 0).toFixed(2);
      const zStr = (targetPoint.z ?? 0).toFixed(2);
      console.log(`✅ 已跳转到测量位置: [${xStr}, ${yStr}, ${zStr}]`);
    } catch (error) {
      console.error('❌ 跳转到测量位置失败:', error);
    }
  };

  return (
    <div
      ref={panelRef}
      className={`annotations-panel ${isDocked ? 'docked' : 'floating'}`}
      style={!isDocked ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      } : undefined}
    >
      <div
        className="panel-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <h3>测量面板</h3>
        <div className="header-actions">
          <button
            onClick={showAllAnnotations}
            className="small-button"
            title="显示所有标注"
          >
            👁️ 全显
          </button>
          <button
            onClick={hideAllAnnotations}
            className="small-button"
            title="隐藏所有标注"
          >
            👁️‍🗨️ 全隐
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="small-button"
            title={isCollapsed ? '展开面板' : '折叠面板'}
          >
            {isCollapsed ? '📂' : '📁'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="panel-content">
          {annotations.length === 0 ? (
            <div className="empty-state">
              <p>暂无测量</p>
              <p className="hint">使用测量工具在图像上绘制测量</p>
            </div>
          ) : (
            <div className="annotations-list">
              {annotations.map((annotation) => {
                const isVisible = getAnnotationVisibility(annotation.annotationUID);
                const toolName = annotation.metadata.toolName || 'Unknown';
                const label =
                  annotation.data.label ||
                  annotation.metadata.label ||
                  `${getToolDisplayName(toolName)} #${annotation.annotationUID.slice(0, 4)}`;

                return (
                  <div
                    key={annotation.annotationUID}
                    className={`annotation-item ${isVisible ? 'visible' : 'hidden'}`}
                    onClick={() => jumpToAnnotation(annotation)}
                    style={{ cursor: 'pointer' }}
                    title="点击跳转到此测量位置"
                  >
                    <div className="annotation-info">
                      <span className="annotation-icon">
                        {isVisible ? '👁️' : '👁️‍🗨️'}
                      </span>
                      <div className="annotation-details">
                        <div className="annotation-label">{label}</div>
                        <div className="annotation-type">
                          {getToolDisplayName(toolName)}
                        </div>
                      </div>
                    </div>
                    <div className="annotation-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpToAnnotation(annotation);
                        }}
                        className="jump-button"
                        title="跳转到此测量"
                      >
                        🎯
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAnnotationVisibility(
                            annotation.annotationUID,
                            !isVisible
                          );
                        }}
                        className="visibility-toggle"
                        title={isVisible ? '隐藏' : '显示'}
                      >
                        {isVisible ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAnnotation(annotation.annotationUID);
                        }}
                        className="delete-button"
                        title="删除此测量"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        .annotations-panel {
          width: 300px;
          max-height: calc(100vh - 40px);
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .annotations-panel.floating {
          position: fixed;
          z-index: 1000;
        }

        .annotations-panel.docked {
          position: relative;
          z-index: 1;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #333;
          border-bottom: 1px solid #444;
          user-select: none;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 16px;
          color: #fff;
          font-weight: 600;
          pointer-events: none;
        }

        .header-actions {
          display: flex;
          gap: 4px;
        }

        .small-button {
          padding: 4px 8px;
          font-size: 12px;
          background: #444;
          border: 1px solid #555;
          color: #fff;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .small-button:hover {
          background: #555;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 24px 12px;
          color: #888;
        }

        .empty-state .hint {
          font-size: 12px;
          margin-top: 8px;
        }

        .annotations-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .annotation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .annotation-item:hover {
          background: #383838;
          border-color: #555;
        }

        .annotation-item.hidden {
          opacity: 0.6;
        }

        .annotation-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .annotation-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .annotation-details {
          flex: 1;
          min-width: 0;
        }

        .annotation-label {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .annotation-type {
          font-size: 11px;
          color: #888;
          margin-top: 2px;
        }

        .annotation-actions {
          flex-shrink: 0;
          display: flex;
          gap: 6px;
        }

        .jump-button {
          padding: 6px 10px;
          font-size: 14px;
          background: #28a745;
          border: 1px solid #218838;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          color: #fff;
        }

        .jump-button:hover {
          background: #218838;
          border-color: #1e7e34;
        }

        .visibility-toggle {
          padding: 6px 10px;
          font-size: 14px;
          background: #444;
          border: 1px solid #555;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .visibility-toggle:hover {
          background: #555;
          border-color: #666;
        }

        .delete-button {
          padding: 6px 10px;
          font-size: 14px;
          background: #dc3545;
          border: 1px solid #e74c3c;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          color: #fff;
        }

        .delete-button:hover {
          background: #e74c3c;
          border-color: #ff6b6b;
        }

        /* 滚动条样式 */
        .panel-content::-webkit-scrollbar {
          width: 6px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: #2a2a2a;
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 3px;
        }

        .panel-content::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
      `}</style>
    </div>
  );
};

export default AnnotationsPanel;
