import React, { useState } from 'react';
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
  [key: string]: any;
}

interface SeriesPanelProps {
  seriesList: SeriesInfo[];
  currentSeriesUID: string | null;
  onLoadSeries: (seriesInfo: SeriesInfo) => void;
  onClose?: () => void;
}

const SeriesPanel: React.FC<SeriesPanelProps> = ({
  seriesList,
  currentSeriesUID,
  onLoadSeries,
  onClose,
}) => {
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

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

  return (
    <>
      <div className="series-panel">
        <div className="series-header">
          <h3>序列列表</h3>
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
            seriesList.map((series) => (
              <div
                key={series.seriesInstanceUID}
                className={`series-item ${
                  currentSeriesUID === series.seriesInstanceUID ? 'active' : ''
                } ${hoveredSeries === series.seriesInstanceUID ? 'hovered' : ''}`}
                onDoubleClick={() => handleDoubleClick(series)}
                onMouseEnter={() => setHoveredSeries(series.seriesInstanceUID)}
                onMouseLeave={() => setHoveredSeries(null)}
                title="双击加载此序列"
              >
                <div
                  className="series-thumbnail"
                  style={getThumbnailStyle(series)}
                >
                  {!series.thumbnail && (
                    <span className="modality-label">{series.modality}</span>
                  )}
                </div>

                <div className="series-info">
                  <div className="series-number">
                    序列 {series.seriesNumber}
                  </div>
                  <div className="series-description" title={series.seriesDescription}>
                    {series.seriesDescription || '未命名序列'}
                  </div>
                  <div className="series-details">
                    <span className="modality-badge">{series.modality}</span>
                    <span className="image-count">
                      {series.numberOfImages} 帧
                    </span>
                  </div>
                  {currentSeriesUID === series.seriesInstanceUID && (
                    <div className="current-indicator">✓ 当前</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="series-footer">
          <small>双击缩略图切换序列</small>
        </div>
      </div>

      <style>{`
        .series-panel {
          position: fixed;
          right: 20px;
          top: 80px;
          width: 320px;
          max-height: calc(100vh - 100px);
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          z-index: 999;
        }

        .series-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #333;
          border-bottom: 1px solid #444;
        }

        .series-header h3 {
          margin: 0;
          font-size: 16px;
          color: #fff;
          font-weight: 600;
        }

        .series-header .close-button {
          background: none;
          border: none;
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .series-header .close-button:hover {
          opacity: 1;
        }

        .series-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .series-item {
          display: flex;
          gap: 12px;
          padding: 10px;
          margin-bottom: 8px;
          background: #333;
          border: 1px solid #444;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .series-item:hover {
          background: #3a3a3a;
          border-color: #555;
        }

        .series-item.active {
          border-color: #007acc;
          background: #2a3a4a;
        }

        .series-thumbnail {
          width: 80px;
          height: 80px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .modality-label {
          font-size: 24px;
          font-weight: bold;
          color: #fff;
          opacity: 0.8;
        }

        .series-info {
          flex: 1;
          min-width: 0;
          position: relative;
        }

        .series-number {
          font-size: 13px;
          font-weight: 600;
          color: #007acc;
          margin-bottom: 4px;
        }

        .series-description {
          font-size: 14px;
          color: #fff;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .series-details {
          display: flex;
          gap: 8px;
          font-size: 12px;
        }

        .modality-badge {
          background: #007acc;
          color: #fff;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        .image-count {
          color: #888;
        }

        .current-indicator {
          position: absolute;
          top: 0;
          right: 0;
          background: #28a745;
          color: #fff;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #888;
        }

        .empty-state p {
          margin: 8px 0;
        }

        .empty-state .hint {
          font-size: 12px;
          color: #666;
        }

        .series-footer {
          padding: 10px 16px;
          background: #333;
          border-top: 1px solid #444;
          text-align: center;
        }

        .series-footer small {
          color: #888;
          font-size: 11px;
        }

        /* 滚动条样式 */
        .series-list::-webkit-scrollbar {
          width: 6px;
        }

        .series-list::-webkit-scrollbar-track {
          background: #2a2a2a;
        }

        .series-list::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 3px;
        }

        .series-list::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
      `}</style>
    </>
  );
};

export default SeriesPanel;
