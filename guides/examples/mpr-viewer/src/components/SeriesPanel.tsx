import React, { useState, useRef, useEffect } from 'react';
import { Enums, metaData } from '@cornerstonejs/core';
import type { Types } from '@cornerstonejs/core';

export interface SeriesInfo {
  seriesInstanceUID: string;
  seriesNumber: number;
  seriesDescription: string;
  modality: string;
  numberOfImages: number;
  imageIds: string[];
  thumbnail?: string; // 缩略图数据 URL
  StudyInstanceUID?: string;
  // 检查信息
  studyDescription?: string;
  studyDate?: string;
  studyTime?: string;
  patientName?: string;
  patientId?: string;
  [key: string]: any;
}

export interface StudyInfo {
  studyInstanceUID: string;
  studyDescription?: string;
  studyDate?: string;
  studyTime?: string;
  patientName?: string;
  patientId?: string;
  series: SeriesInfo[];
}

interface SeriesPanelProps {
  seriesList: SeriesInfo[];
  studyList?: StudyInfo[];
  currentSeriesUID: string | null;
  onLoadSeries: (seriesInfo: SeriesInfo) => void;
  onClose?: () => void;
  onPositionChange?: (docked: boolean) => void;
}

const SeriesPanel: React.FC<SeriesPanelProps> = ({
  seriesList,
  studyList,
  currentSeriesUID,
  onLoadSeries,
  onClose,
  onPositionChange,
}) => {
  // Debug logging
  console.log('🎨 SeriesPanel 组件渲染:', {
    seriesListLength: seriesList.length,
    currentSeriesUID,
    hasOnLoadSeries: !!onLoadSeries,
    hasOnClose: !!onClose
  });

  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 20, y: 80 }); // 默认在右上方
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDocked, setIsDocked] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 检测是否应该切换到嵌入模式（右边缘）
  useEffect(() => {
    const dockThreshold = 50; // 距离右边50px时自动嵌入
    const windowWidth = window.innerWidth;

    if (windowWidth - position.x <= dockThreshold && !isDocked) {
      setIsDocked(true);
      onPositionChange?.(true);
    } else if (windowWidth - position.x > dockThreshold && isDocked) {
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
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 限制在窗口范围内
      const maxX = window.innerWidth - 320;
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

  // 处理双击序列
  const handleDoubleClick = (seriesInfo: SeriesInfo) => {
    onLoadSeries(seriesInfo);
  };

  // 获取默认缩略图样式
  const getThumbnailStyle = (seriesInfo: SeriesInfo) => {
    if (seriesInfo.thumbnail) {
      return { backgroundImage: `url(${seriesInfo.thumbnail})` };
    }

    // 根据模态使用不同的默认颜色
    const modalityColors: Record<string, string> = {
      CT: '#4A90E2',
      MR: '#50E3C2',
      US: '#F5A623',
      XR: '#9013FE',
      PT: '#E056FD',
      default: '#666',
    };

    const bgColor = modalityColors[seriesInfo.modality] || modalityColors.default;
    return { backgroundColor: bgColor };
  };

  // 格式化日期
  const formatDate = (dateStr?: string | any) => {
    if (!dateStr) return '';

    // 如果是字符串，尝试格式化
    if (typeof dateStr === 'string') {
      // DICOM 日期格式：YYYYMMDD
      if (dateStr.length >= 8) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    }

    // 如果是 Date 对象
    if (dateStr instanceof Date) {
      const year = dateStr.getFullYear();
      const month = String(dateStr.getMonth() + 1).padStart(2, '0');
      const day = String(dateStr.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 其他情况，尝试转换为字符串
    return String(dateStr);
  };

  // 将序列列表按检查分组
  const groupSeriesByStudy = (): StudyInfo[] => {
    if (studyList && studyList.length > 0) {
      return studyList;
    }

    // 如果没有提供 studyList，从 seriesList 中提取
    const studyMap = new Map<string, StudyInfo>();

    seriesList.forEach((series) => {
      const studyUID = series.StudyInstanceUID || 'default-study';

      if (!studyMap.has(studyUID)) {
        studyMap.set(studyUID, {
          studyInstanceUID: studyUID,
          studyDescription: series.studyDescription,
          studyDate: series.studyDate,
          studyTime: series.studyTime,
          patientName: series.patientName,
          patientId: series.patientId,
          series: [],
        });
      }

      studyMap.get(studyUID)!.series.push(series);
    });

    return Array.from(studyMap.values());
  };

  const studies = groupSeriesByStudy();

  return (
    <>
      <div
        ref={panelRef}
        className={`series-panel ${isDocked ? 'docked' : 'floating'}`}
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
          <h3>图像序列</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="close-button"
              title="关闭面板"
            >
              ✕
            </button>
          )}
        </div>

        <div className="series-list">
          {seriesList.length === 0 ? (
              <div className="empty-state">
                <p>暂无序列</p>
                <p className="hint">点击上方 "📁 加载 DICOM 文件" 添加序列</p>
              </div>
            ) : (
              studies.map((study) => (
                <div key={study.studyInstanceUID} className="study-group">
                  {/* 检查信息头 */}
                  <div className="study-header">
                    <div className="study-info">
                      <div className="patient-info">
                        {study.patientName && (
                          <span className="patient-name">{study.patientName}</span>
                        )}
                        {study.patientId && (
                          <span className="patient-id">ID: {study.patientId}</span>
                        )}
                      </div>
                      <div className="study-details">
                        {study.studyDescription && (
                          <div className="study-description" title={study.studyDescription}>
                            {study.studyDescription}
                          </div>
                        )}
                        {study.studyDate && (
                          <span className="study-date">{formatDate(study.studyDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 序列列表 */}
                  <div className="study-series-list">
                    {study.series.map((series) => (
                      <div
                        key={series.seriesInstanceUID}
                        className={`series-item-compact ${
                          currentSeriesUID === series.seriesInstanceUID ? 'active' : ''
                        } ${hoveredSeries === series.seriesInstanceUID ? 'hovered' : ''}`}
                        onClick={() => handleDoubleClick(series)}
                        onMouseEnter={() => setHoveredSeries(series.seriesInstanceUID)}
                        onMouseLeave={() => setHoveredSeries(null)}
                        title={`${series.seriesDescription || '未命名序列'} - ${series.numberOfImages} 帧`}
                      >
                        {/* 缩略图 */}
                        <div
                          className="series-thumbnail-compact"
                          style={getThumbnailStyle(series)}
                        >
                          {!series.thumbnail && (
                            <span className="modality-label-compact">{series.modality}</span>
                          )}
                        </div>

                        {/* 序列信息 */}
                        <div className="series-info-compact">
                          <div className="series-row">
                            <span className="series-number">#{series.seriesNumber}</span>
                            <span className="series-modality">{series.modality}</span>
                            <span className="series-images">{series.numberOfImages} 帧</span>
                          </div>
                          <div className="series-desc" title={series.seriesDescription}>
                            {series.seriesDescription || '未命名序列'}
                          </div>
                        </div>

                        {/* 当前指示器 */}
                        {currentSeriesUID === series.seriesInstanceUID && (
                          <div className="current-indicator-compact">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
        </div>

        <div className="series-footer">
          <small>点击序列加载图像</small>
        </div>
      </div>

      <style>{`
        .series-panel {
          width: 360px;
          max-height: calc(100vh - 100px);
          background: #1e1e1e;
          border: 1px solid #3e3e42;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .series-panel.floating {
          position: fixed;
          z-index: 9999;
        }

        .series-panel.docked {
          position: relative;
          z-index: 1;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          user-select: none;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 13px;
          color: #cccccc;
          font-weight: 500;
          pointer-events: none;
        }

        .panel-header .close-button {
          background: none;
          border: none;
          color: #cccccc;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
          transition: opacity 0.2s;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .panel-header .close-button:hover {
          opacity: 1;
          background: #3e3e42;
          border-radius: 4px;
        }

        .series-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        /* 检查分组 */
        .study-group {
          margin-bottom: 8px;
        }

        .study-header {
          background: #252526;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          padding: 6px 8px;
          margin-bottom: 4px;
        }

        .study-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .patient-name {
          color: #ffffff;
          font-weight: 500;
        }

        .patient-id {
          color: #858585;
          font-size: 11px;
        }

        .study-details {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .study-description {
          color: #cccccc;
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .study-date {
          color: #858585;
          font-size: 10px;
          flex-shrink: 0;
        }

        /* 序列列表 */
        .study-series-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 8px;
        }

        .series-item-compact {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          background: #2d2d30;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }

        .series-item-compact:hover {
          background: #37373d;
          border-color: #007acc;
        }

        .series-item-compact.active {
          background: #264f78;
          border-color: #007acc;
        }

        .series-thumbnail-compact {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          border: 1px solid #3e3e42;
        }

        .modality-label-compact {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          opacity: 0.9;
        }

        .series-info-compact {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .series-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }

        .series-number {
          color: #007acc;
          font-weight: 500;
          flex-shrink: 0;
        }

        .series-modality {
          background: #007acc;
          color: #fff;
          padding: 1px 4px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: 500;
          flex-shrink: 0;
        }

        .series-images {
          color: #858585;
          flex-shrink: 0;
        }

        .series-desc {
          font-size: 11px;
          color: #cccccc;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .current-indicator-compact {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #28a745;
          color: #fff;
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 2px;
          font-weight: 500;
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

        .series-footer {
          padding: 8px 12px;
          background: #2d2d30;
          border-top: 1px solid #3e3e42;
          text-align: center;
        }

        .series-footer small {
          color: #858585;
          font-size: 10px;
        }

        /* 滚动条样式 */
        .series-list::-webkit-scrollbar {
          width: 10px;
        }

        .series-list::-webkit-scrollbar-track {
          background: #1e1e1e;
        }

        .series-list::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 5px;
          border: 2px solid #1e1e1e;
        }

        .series-list::-webkit-scrollbar-thumb:hover {
          background: #4e4e4e;
        }
      `}</style>
    </>
  );
};

export default SeriesPanel;
