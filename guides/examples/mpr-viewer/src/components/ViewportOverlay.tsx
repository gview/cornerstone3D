import React from 'react';
import { Enums } from '@cornerstonejs/core';
import OrientationSelector, { OrientationSelectorProps } from './OrientationSelector';

export interface ViewportOverlayProps {
  viewportId: string;
  viewportLabel?: string;
  imageIds?: string[];
  currentImageIndex?: number;
  totalSlices?: number;
  seriesDescription?: string;
  modality?: string;
  patientName?: string;
  windowCenter?: number;
  windowWidth?: number;
  // 方位相关属性
  currentOrientation?: Enums.OrientationAxis | string;
  onOrientationChange?: OrientationSelectorProps['onOrientationChange'];
  orientationEnabled?: boolean;
  // 激活状态
  isActive?: boolean;
}

const ViewportOverlay: React.FC<ViewportOverlayProps> = ({
  viewportId,
  viewportLabel,
  imageIds = [],
  currentImageIndex = 0,
  totalSlices = 0,
  seriesDescription = '',
  modality = 'CT',
  patientName = '',
  windowCenter = 40,
  windowWidth = 400,
  currentOrientation,
  onOrientationChange,
  orientationEnabled = true,
  isActive = false,
}) => {
  // 格式化窗宽窗位 - 显示为两行
  const formatWindowLevel = (center: number, width: number) => {
    return { width, center };
  };

  return (
    <>
      {/* 左上角 - 视口标签和患者信息 */}
      <div className="overlay-top-left">
        {onOrientationChange ? (
          /* 使用方位选择器 */
          <OrientationSelector
            viewportId={viewportId}
            currentOrientation={currentOrientation || viewportLabel || ''}
            onOrientationChange={onOrientationChange}
            disabled={!orientationEnabled}
          />
        ) : viewportLabel ? (
          /* 使用静态标签 */
          <div className="viewport-name">{viewportLabel}</div>
        ) : null}
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
        {totalSlices > 0 && (
          <div className="image-index">
            {currentImageIndex + 1} / {totalSlices}
          </div>
        )}
      </div>

      {/* 右下角 - 窗宽窗位 */}
      <div className="overlay-bottom-right">
        <div className="window-level-container">
          <div className="window-level-item">
            <span className="window-level-label">W:</span>
            <span className="window-level-value">{formatWindowLevel(windowCenter, windowWidth).width}</span>
          </div>
          <div className="window-level-item">
            <span className="window-level-label">L:</span>
            <span className="window-level-value">{formatWindowLevel(windowCenter, windowWidth).center}</span>
          </div>
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
        .window-level-container {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }

        .window-level-item {
          font-size: 11px;
          color: #cccccc;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .window-level-label {
          font-weight: 600;
          color: #aaaaaa;
        }

        .window-level-value {
          color: #ffffff;
          min-width: 40px;
          text-align: right;
        }

        /* 激活状态高亮样式 */
        ${isActive ? `
          /* 视口名称/方位选择器高亮 */
          .viewport-name,
          .orientation-selector {
            background: linear-gradient(135deg, #007acc 0%, #005a9e 100%) !important;
            color: #ffffff !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
            transition: all 0.2s ease-in-out !important;
          }

          /* 模态标签高亮 */
          .modality-badge {
            background: linear-gradient(135deg, #00d084 0%, #00a86b 100%) !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
          }

          /* 序列描述高亮 */
          .series-description {
            background-color: rgba(0, 122, 204, 0.4) !important;
            color: #ffffff !important;
          }

          /* 患者信息高亮 */
          .patient-info {
            background-color: rgba(0, 122, 204, 0.3) !important;
            color: #ffffff !important;
          }

          /* 图像索引高亮 */
          .image-index {
            background-color: rgba(0, 122, 204, 0.4) !important;
            color: #ffffff !important;
            font-weight: 600 !important;
          }

          /* 窗宽窗位高亮 */
          .window-level-item {
            background-color: rgba(0, 122, 204, 0.4) !important;
            color: #ffffff !important;
          }

          .window-level-value {
            color: #00d084 !important;
            font-weight: 600 !important;
          }
        ` : ''}
      `}</style>
    </>
  );
};

export default ViewportOverlay;
