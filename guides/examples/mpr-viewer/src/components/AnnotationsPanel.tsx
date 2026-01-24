import React, { useState, useEffect, useCallback, useRef } from 'react';
import { annotation, Enums } from '@cornerstonejs/tools';
import { eventTarget } from '@cornerstonejs/core';
import type { Types } from '@cornerstonejs/core';
import {
  tryJumpToAnnotationUsingViewReference,
  jumpToAnnotationUsingCamera,
} from '../utils/measurementNavigationUtils';

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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  panelPosition?: 'left' | 'right';
  onPanelPositionChange?: (position: 'left' | 'right') => void;
  volumeId?: string | null;  // 主 volume ID
  secondaryVolumeId?: string | null;  // 第二个 volume ID（用于双序列布局）
}

const AnnotationsPanel: React.FC<AnnotationsPanelProps> = ({
  renderingEngine,
  viewportIds,
  isCollapsed = false,
  onToggleCollapse,
  onClose,
  panelPosition = 'right',
  onPanelPositionChange,
  volumeId,
  secondaryVolumeId,
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // 只响应左键
    setIsDragging(true);
    setDragStartX(e.clientX);
    e.preventDefault();
  };

  // 处理拖拽移动
  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartX;
      const threshold = 100; // 拖动超过100px才切换位置

      if (Math.abs(deltaX) > threshold) {
        const newPosition = deltaX > 0 ? 'right' : 'left';
        onPanelPositionChange?.(newPosition);
        setIsDragging(false);
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);

      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragStartX, onPanelPositionChange]);

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

  // 🔧 从 imageId 中提取 volume ID
  // ImageId 格式通常为: imageIdPrefix:imageFrameIndex:volumeId
  // 例如: "wadouri:file://path/file.dcm:0:volume-xxx" 或 "imageId:123:volume-xxx"
  // 也可能是简化的格式: "dicomfile:76"（这种情况下无法提取 volume 信息）
  const extractVolumeIdFromImageId = (imageId: string): string | null => {
    try {
      console.log('🔍 分析 imageId:', imageId);

      // 方法1: 尝试从 imageId 字符串中提取 volume ID
      // volume ID 通常在最后一个冒号之后
      const parts = imageId.split(':');
      if (parts.length >= 3) {
        const potentialVolumeId = parts[parts.length - 1];
        // 检查是否以 'volume-' 或 'my-volume-id-' 开头
        if (potentialVolumeId.startsWith('volume-') || potentialVolumeId.startsWith('my-volume-id-')) {
          console.log('✅ 从冒号分隔提取到 volumeId:', potentialVolumeId);
          return potentialVolumeId;
        }
      }

      // 方法2: 如果上述方法失败，尝试正则匹配
      const volumeMatch = imageId.match(/(volume-[^\s:]+|my-volume-id-[^\s:]+)/);
      if (volumeMatch) {
        console.log('✅ 从正则匹配提取到 volumeId:', volumeMatch[1]);
        return volumeMatch[1];
      }

      // 方法3: 检查是否是简化的 imageId 格式（如 "dicomfile:76"）
      if (parts.length === 2 && parts[0].startsWith('dicomfile')) {
        console.warn('⚠️ imageId 是简化格式（dicomfile:N），无法从中提取 volume 信息');
        console.log('💡 提示: 这种格式没有包含 volumeId 信息，需要通过其他方式（如当前激活的视口）来判断所属序列');
        return null;
      }

      console.warn('⚠️ 无法从 imageId 提取 volumeId:', imageId);
      return null;
    } catch (error) {
      console.error('❌ 提取 volumeId 失败:', error);
      return null;
    }
  };

  // 🔧 跳转到测量的位置 - 使用 OHIF 风格的实现
  // 参考 OHIF Viewers,使用 setViewReference 和智能相机调整
  const jumpToAnnotation = (annotation: Annotation) => {
    try {
      if (!renderingEngine) return;

      // 🔧 判断是否是双序列 MPR 布局
      const isDualSequenceLayout = viewportIds.length === 6 && secondaryVolumeId;

      // 🔧 确定测量属于哪个序列
      let targetSequenceIndex = 0; // 默认序列 1 (索引 0)

      if (isDualSequenceLayout) {
        // 🔧 方法1：优先使用自定义 metadata.volumeId（由 annotationAdded 事件监听器添加）
        if (annotation.metadata.volumeId) {
          const annotationVolumeId = annotation.metadata.volumeId;

          console.log('🔍 使用自定义 metadata.volumeId:', annotationVolumeId);
          console.log('🔧 当前主 volumeId:', volumeId);
          console.log('🔧 当前副 volumeId:', secondaryVolumeId);

          // 判断属于哪个序列
          if (annotationVolumeId === secondaryVolumeId) {
            targetSequenceIndex = 1; // 序列 2
            console.log('✅ 测量属于序列 2（自定义元数据）');
          } else if (annotationVolumeId === volumeId) {
            targetSequenceIndex = 0; // 序列 1
            console.log('✅ 测量属于序列 1（自定义元数据）');
          } else {
            console.warn('⚠️ volumeId 不匹配，默认使用序列 1');
          }
        }
        // 🔧 方法2：使用 metadata.sequenceIndex（由 annotationAdded 事件监听器添加）
        else if (annotation.metadata.sequenceIndex !== undefined) {
          const seqIndex = annotation.metadata.sequenceIndex as number;
          targetSequenceIndex = seqIndex < 3 ? 0 : 1;
          console.log(`✅ 使用 sequenceIndex: ${seqIndex}，跳转到序列 ${targetSequenceIndex + 1}`);
        }
        // 🔧 方法3：从 referencedImageId 提取 volumeId（备用方法）
        else if (annotation.metadata.referencedImageId) {
          const annotationVolumeId = extractVolumeIdFromImageId(annotation.metadata.referencedImageId);

          console.log('🔍 测量的 referencedImageId:', annotation.metadata.referencedImageId);
          console.log('🔍 提取的 volumeId:', annotationVolumeId);

          // 判断属于哪个序列
          if (annotationVolumeId === secondaryVolumeId) {
            targetSequenceIndex = 1; // 序列 2
            console.log('✅ 测量属于序列 2（从 imageId 提取）');
          } else if (annotationVolumeId === volumeId) {
            targetSequenceIndex = 0; // 序列 1
            console.log('✅ 测量属于序列 1（从 imageId 提取）');
          } else {
            console.warn('⚠️ 无法从 referencedImageId 提取 volumeId，使用序列 1（默认）');
            console.warn('💡 提示：此标注可能是在添加序列追踪功能之前创建的');
          }
        } else {
          console.warn('⚠️ 标注缺少序列信息元数据，默认使用序列 1');
          console.warn('💡 提示：重新创建标注以启用智能跳转功能');
        }
      }

      // 🔧 根据布局和序列选择目标视口
      let targetViewportIds: string[];

      if (isDualSequenceLayout) {
        // 🔧 双序列 MPR 布局：根据目标序列选择视口
        const seqStartIndex = targetSequenceIndex * 3; // 序列 1: 0, 序列 2: 3

        console.log(`🔧 双序列 MPR 布局，使用序列 ${targetSequenceIndex + 1} 的视口（索引 ${seqStartIndex}-${seqStartIndex + 2}）`);

        targetViewportIds = [
          viewportIds[seqStartIndex],
          viewportIds[seqStartIndex + 1],
          viewportIds[seqStartIndex + 2]
        ];
      } else {
        // 标准三视图布局
        targetViewportIds = viewportIds;
      }

      // ✨ 使用新的导航方式 - 参考 OHIF
      // 为每个视口应用跳转
      let viewRefCount = 0;
      let cameraCount = 0;

      targetViewportIds.forEach((viewportId) => {
        const viewport = renderingEngine!.getViewport(viewportId) as Types.IVolumeViewport;
        if (!viewport) {
          console.warn(`⚠️ 无法获取视口: ${viewportId}`);
          return;
        }

        // 首先尝试使用 setViewReference (官方 API,自动处理方向)
        // 这需要完整的元数据支持,如果失败会回退到相机调整
        const success = tryJumpToAnnotationUsingViewReference(viewport, annotation);
        if (success) {
          viewRefCount++;
        } else {
          // 如果 setViewReference 失败,使用相机调整
          // 传递完整的 annotation 对象
          jumpToAnnotationUsingCamera(viewport, annotation);
          cameraCount++;
        }
      });

      // 渲染所有目标视口
      renderingEngine.renderViewports(targetViewportIds);

      console.log(`✅ 跳转完成: ${viewRefCount} 个视口使用 setViewReference, ${cameraCount} 个视口使用相机调整`);
      console.log(`✅ 使用的视口索引: ${targetViewportIds.join(', ')}`);
    } catch (error) {
      console.error('❌ 跳转到测量位置失败:', error);
    }
  };

  return (
    <div
      ref={panelRef}
      className={`annotations-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${panelPosition}`}
      style={{
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* 面板头部 */}
      <div
        className="sidebar-header"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        title="拖拽可移动面板位置"
      >
        {!isCollapsed && <h3>测量面板</h3>}
        <div className="header-actions">
          {!isCollapsed && (
            <>
              <button
                onClick={showAllAnnotations}
                className="icon-button"
                title="显示所有标注"
              >
                👁️
              </button>
              <button
                onClick={hideAllAnnotations}
                className="icon-button"
                title="隐藏所有标注"
              >
                👁️‍🗨️
              </button>
            </>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="icon-button"
              title={isCollapsed ? '展开面板' : '收缩面板'}
            >
              {isCollapsed ? (panelPosition === 'left' ? '▶' : '◀') : (panelPosition === 'left' ? '◀' : '▶')}
            </button>
          )}
          {onClose && !isCollapsed && (
            <button
              onClick={onClose}
              className="icon-button"
              title="关闭面板"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 测量列表内容 */}
      {!isCollapsed && (
        <div className="annotations-list">
          {annotations.length === 0 ? (
            <div className="empty-state">
              <p>暂无测量</p>
              <p className="hint">使用测量工具在图像上绘制测量</p>
            </div>
          ) : (
            annotations.map((annotation) => {
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
                    <span
                      className="annotation-icon visibility-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAnnotationVisibility(
                          annotation.annotationUID,
                          !isVisible
                        );
                      }}
                      title={isVisible ? '点击隐藏' : '点击显示'}
                    >
                      {isVisible ? '👁️' : '👁️‍🗨️'}
                    </span>
                    <div className="annotation-details">
                      <div className="annotation-label">{label}</div>
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
            })
          )}
        </div>
      )}

      <style>{`
        .annotations-sidebar {
          background: #1e1e1e;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          flex-shrink: 0;
          /* 确保左侧面板也有最大高度 */
          max-height: calc(100vh - 40px);
        }

        /* 右侧模式：左边框 */
        .annotations-sidebar.right {
          border-left: 1px solid #3e3e42;
        }

        /* 左侧模式：右边框（紧挨着视口） */
        .annotations-sidebar.left {
          border-right: 1px solid #3e3e42;
          border-top: 1px solid #3e3e42;
          border-radius: 0 8px 8px 0;
        }

        .annotations-sidebar.expanded {
          width: 320px;
        }

        .annotations-sidebar.collapsed {
          width: 40px;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          min-height: 40px;
          flex-shrink: 0; /* 确保头部不会被压缩 */
        }

        .sidebar-header h3 {
          margin: 0;
          font-size: 12px;
          color: #cccccc;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 4px;
        }

        .icon-button {
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          color: #cccccc;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .icon-button:hover {
          opacity: 1;
          background: #3e3e42;
        }

        .annotations-list {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px;
          /* 确保列表可以正确滚动 */
          min-height: 0;
        }

        .annotations-sidebar.collapsed .annotations-list {
          display: none;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #858585;
        }

        .empty-state p {
          margin: 8px 0;
          font-size: 12px;
        }

        .empty-state .hint {
          font-size: 11px;
          color: #6e6e6e;
        }

        .annotation-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: #2d2d30;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          margin-bottom: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
          /* 减小最小高度，让单行显示更紧凑 */
          min-height: 32px;
        }

        .annotation-item:hover {
          background: #37373d;
          border-color: #007acc;
        }

        .annotation-item.hidden {
          opacity: 0.6;
        }

        .annotation-info {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .annotation-icon {
          font-size: 12px;
          flex-shrink: 0;
          cursor: pointer;
          padding: 2px;
          border-radius: 3px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .annotation-icon:hover {
          background: #3e3e42;
          opacity: 1;
        }

        .annotation-icon.visibility-toggle {
          opacity: 0.8;
        }

        .annotation-details {
          flex: 1;
          min-width: 0;
        }

        .annotation-label {
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          /* 确保单行显示 */
          line-height: 1.2;
        }

        .annotation-actions {
          flex-shrink: 0;
          display: flex;
          gap: 3px;
        }

        .jump-button,
        .delete-button {
          padding: 3px 5px;
          font-size: 11px;
          background: #3e3e42;
          border: 1px solid #4e4e52;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s;
          color: #cccccc;
          display: flex;
          align-items: center;
          justify-content: center;
          /* 减小按钮尺寸以匹配紧凑布局 */
          min-width: 24px;
          height: 24px;
        }

        .jump-button:hover {
          background: #28a745;
          border-color: #218838;
          color: #fff;
        }

        .delete-button:hover {
          background: #dc3545;
          border-color: #e74c3c;
          color: #fff;
        }

        /* 滚动条样式 */
        .annotations-list::-webkit-scrollbar {
          width: 10px;
        }

        .annotations-list::-webkit-scrollbar-track {
          background: #1e1e1e;
        }

        .annotations-list::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 5px;
          border: 2px solid #1e1e1e;
        }

        .annotations-list::-webkit-scrollbar-thumb:hover {
          background: #4e4e4e;
        }
      `}</style>
    </div>
  );
};

export default AnnotationsPanel;
