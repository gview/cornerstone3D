import React from 'react';
import { SeriesInfo } from './SeriesPanel';

interface AdvancedSeriesSelectorProps {
  seriesList: SeriesInfo[];
  selectedSeriesUID: string | null;
  onSeriesChange: (seriesUID: string) => void;
  viewportLabel: string;
  currentImageIndex?: number;
  totalImages?: number;
}

const AdvancedSeriesSelector: React.FC<AdvancedSeriesSelectorProps> = ({
  seriesList,
  selectedSeriesUID,
  onSeriesChange,
  viewportLabel,
  currentImageIndex = 0,
  totalImages = 0,
}) => {
  if (seriesList.length === 0) {
    return null;
  }

  const selectedSeries = seriesList.find(s => s.seriesInstanceUID === selectedSeriesUID);

  return (
    <div className="advanced-series-selector">
      <div className="selector-header">
        <span className="viewport-label">{viewportLabel}</span>
        {selectedSeries && (
          <span className="image-counter">
            {currentImageIndex + 1} / {totalImages}
          </span>
        )}
      </div>
      <select
        value={selectedSeriesUID || ''}
        onChange={(e) => e.target.value && onSeriesChange(e.target.value)}
        className="series-select"
        title="选择要显示的序列"
      >
        <option value="" disabled>
          选择序列...
        </option>
        {seriesList.map((series) => (
          <option
            key={series.seriesInstanceUID}
            value={series.seriesInstanceUID}
          >
            {series.seriesDescription || `Series ${series.seriesNumber}`}
            ({series.imageCount} images)
          </option>
        ))}
      </select>
      {selectedSeries && (
        <div className="series-info">
          <span className="series-description">
            {selectedSeries.seriesDescription || '无描述'}
          </span>
          <span className="series-modality">{selectedSeries.modality}</span>
        </div>
      )}

      <style>{`
        .advanced-series-selector {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.85);
          border-radius: 4px;
          padding: 6px 8px;
          z-index: 20;
          backdrop-filter: blur(4px);
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .viewport-label {
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
        }

        .image-counter {
          font-size: 10px;
          color: #858585;
        }

        .series-select {
          width: 100%;
          background: #2d2d30;
          border: 1px solid #3e3e42;
          border-radius: 3px;
          color: #cccccc;
          font-size: 11px;
          padding: 4px 6px;
          cursor: pointer;
          outline: none;
        }

        .series-select:hover {
          border-color: #007acc;
        }

        .series-select:focus {
          border-color: #007acc;
        }

        .series-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #3e3e42;
        }

        .series-description {
          font-size: 10px;
          color: #cccccc;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .series-modality {
          font-size: 9px;
          color: #858585;
          margin-left: 6px;
        }
      `}</style>
    </div>
  );
};

export default AdvancedSeriesSelector;
