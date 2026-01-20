import React from 'react';
import { Enums } from '@cornerstonejs/core';

export interface ViewportOverlayProps {
  viewportId: string;
  viewportLabel?: string;
  imageIds?: string[];
  currentImageIndex?: number;
  seriesDescription?: string;
  modality?: string;
  patientName?: string;
  windowCenter?: number;
  windowWidth?: number;
}

const ViewportOverlay: React.FC<ViewportOverlayProps> = ({
  viewportId,
  viewportLabel,
  imageIds = [],
  currentImageIndex = 0,
  seriesDescription = '',
  modality = 'CT',
  patientName = '',
  windowCenter = 40,
  windowWidth = 400,
}) => {
  // 格式化窗宽窗位
  const formatWindowLevel = (center: number, width: number) => {
    return `W/L: ${width} / ${center}`;
  };

  return (
    <>
      {/* 左上角 - 视口标签和患者信息 */}
      <div className="overlay-top-left">
        {viewportLabel && <div className="viewport-name">{viewportLabel}</div>}
        {patientName && <div className="patient-info">{patientName}</div>}
      </div>

      {/* 右上角 - 序列描述和模态 */}
      <div className="overlay-top-right">
        {modality && <div className="modality-badge">{modality}</div>}
        {seriesDescription && (
          <div className="series-description" title={seriesDescription}>
            {seriesDescription}
          </div>
        )}
      </div>

      {/* 左下角 - 图像索引 */}
      <div className="overlay-bottom-left">
        {imageIds.length > 0 && (
          <div className="image-index">
            {currentImageIndex + 1} / {imageIds.length}
          </div>
        )}
      </div>

      {/* 右下角 - 窗宽窗位 */}
      <div className="overlay-bottom-right">
        <div className="window-level">
          {formatWindowLevel(windowCenter, windowWidth)}
        </div>
      </div>

      <style>{`
        /* 通用覆盖层样式 */
        .overlay-top-left,
        .overlay-top-right,
        .overlay-bottom-left,
        .overlay-bottom-right {
          position: absolute;
          z-index: 100;
          pointer-events: none;
        }

        .overlay-top-left {
          top: 8px;
          left: 8px;
          text-align: left;
        }

        .overlay-top-right {
          top: 8px;
          right: 8px;
          text-align: right;
        }

        .overlay-bottom-left {
          bottom: 8px;
          left: 8px;
          text-align: left;
        }

        .overlay-bottom-right {
          bottom: 8px;
          right: 8px;
          text-align: right;
        }

        /* 视口名称 */
        .viewport-name {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 3px 6px;
          border-radius: 3px;
          margin-bottom: 2px;
        }

        /* 患者信息 */
        .patient-info {
          font-size: 11px;
          color: #cccccc;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 2px 6px;
          border-radius: 3px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* 模态标签 */
        .modality-badge {
          display: inline-block;
          background-color: #007acc;
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 6px;
          border-radius: 3px;
          margin-bottom: 2px;
        }

        /* 序列描述 */
        .series-description {
          font-size: 11px;
          color: #cccccc;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 2px 6px;
          border-radius: 3px;
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* 图像索引 */
        .image-index {
          font-size: 12px;
          color: #cccccc;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 3px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        /* 窗宽窗位 */
        .window-level {
          font-size: 11px;
          color: #cccccc;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }
      `}</style>
    </>
  );
};

export default ViewportOverlay;
