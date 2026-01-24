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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SeriesPanel: React.FC<SeriesPanelProps> = ({
  seriesList,
  studyList,
  currentSeriesUID,
  onLoadSeries,
  onClose,
  onPositionChange,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  const [collapsedStudies, setCollapsedStudies] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  // 处理双击序列
  const handleDoubleClick = (seriesInfo: SeriesInfo) => {
    onLoadSeries(seriesInfo);
  };

  // 切换检查的收起/展开状态
  const handleToggleStudy = (studyInstanceUID: string) => {
    setCollapsedStudies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studyInstanceUID)) {
        newSet.delete(studyInstanceUID);
      } else {
        newSet.add(studyInstanceUID);
      }
      return newSet;
    });
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
        className={`series-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}
      >
        {/* 面板头部 */}
        <div className="sidebar-header">
          {!isCollapsed && <h3>图像序列</h3>}
          <div className="header-actions">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="icon-button"
                title={isCollapsed ? '展开面板' : '收缩面板'}
              >
                {isCollapsed ? '▶' : '◀'}
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

        {/* 序列列表内容 */}
        {!isCollapsed && (
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
                      <button
                        className="study-collapse-button"
                        onClick={() => handleToggleStudy(study.studyInstanceUID)}
                        title={collapsedStudies.has(study.studyInstanceUID) ? '展开序列' : '收起序列'}
                      >
                        {collapsedStudies.has(study.studyInstanceUID) ? '▶' : '▼'}
                      </button>
                    </div>

                    {/* 序列列表 */}
                    <div className={`study-series-list ${collapsedStudies.has(study.studyInstanceUID) ? 'collapsed' : ''}`}>
                      {!collapsedStudies.has(study.studyInstanceUID) && study.series.map((series) => (
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
              )}
          </div>
        )}
      </div>

      <style>{`
        .series-sidebar {
          background: #1e1e1e;
          border-right: 1px solid #3e3e42;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          flex-shrink: 0;
          height: 100%;
          overflow: hidden;
        }

        .series-sidebar.expanded {
          width: 320px;
        }

        .series-sidebar.collapsed {
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

        .series-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
          min-height: 0;
        }

        .series-sidebar.collapsed .series-list {
          display: none;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .study-collapse-button {
          background: none;
          border: none;
          color: #cccccc;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
          opacity: 0.7;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .study-collapse-button:hover {
          opacity: 1;
          background: #3e3e42;
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
          transition: all 0.3s ease;
        }

        .study-series-list.collapsed {
          display: none;
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

// 使用 React.memo 优化性能，避免不必要的重新渲染
export default React.memo(SeriesPanel);
