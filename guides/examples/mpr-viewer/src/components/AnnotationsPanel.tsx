import React, { useState, useEffect, useCallback } from 'react';
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
}

const AnnotationsPanel: React.FC<AnnotationsPanelProps> = ({
  renderingEngine,
  viewportIds,
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      return visibility.isAnnotationVisible(annotationUID);
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

        // 对于点工具（如探针）
        if (handles.points && handles.points.length > 0) {
          targetPoint = handles.points[0];
        }
        // 对于线段工具（如长度、角度）
        else if (handles.start) {
          targetPoint = handles.start;
        }
      }

      if (!targetPoint) {
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

      // 更新 focalPoint 到测量的位置
      const newFocalPoint = [targetPoint.x, targetPoint.y, targetPoint.z] as Types.Point3;

      // 保持相机位置的其他参数，只更新 focalPoint
      axialCamera.focalPoint = newFocalPoint;
      sagittalCamera.focalPoint = newFocalPoint;
      coronalCamera.focalPoint = newFocalPoint;

      // 应用相机并重新渲染
      axialViewport.setCamera(axialCamera);
      sagittalViewport.setCamera(sagittalCamera);
      coronalViewport.setCamera(coronalCamera);

      renderingEngine.renderViewports(viewportIds);

      console.log(`✅ 已跳转到测量位置: [${targetPoint.x.toFixed(2)}, ${targetPoint.y.toFixed(2)}, ${targetPoint.z.toFixed(2)}]`);
    } catch (error) {
      console.error('❌ 跳转到测量位置失败:', error);
    }
  };

  return (
    <div className="annotations-panel">
      <div className="panel-header">
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
          position: fixed;
          top: 200px;
          right: 20px;
          width: 300px;
          max-height: calc(100vh - 220px);
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #333;
          border-bottom: 1px solid #444;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 16px;
          color: #fff;
          font-weight: 600;
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
