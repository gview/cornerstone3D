import React from 'react';

export interface ViewControlPanelProps {
  onRotate: (angle: number, axis: 'x' | 'y' | 'z') => void;
  onResetRotation: () => void;
  slabThickness: number;
  onSlabThicknessChange: (value: number) => void;
  slabMode: 'max' | 'min' | 'avg';
  onSlabModeChange: (mode: 'max' | 'min' | 'avg') => void;
  showScale: boolean;
  scaleLocation: 'top' | 'bottom' | 'left' | 'right';
  onToggleScale: () => void;
  onScaleLocationChange: (location: 'top' | 'bottom' | 'left' | 'right') => void;
  hasVolume: boolean;
}

const ViewControlPanel: React.FC<ViewControlPanelProps> = ({
  onRotate,
  onResetRotation,
  slabThickness,
  onSlabThicknessChange,
  slabMode,
  onSlabModeChange,
  showScale,
  scaleLocation,
  onToggleScale,
  onScaleLocationChange,
  hasVolume,
}) => {
  const rotationButtons = [
    { icon: '↑', label: '向上', angle: 15, axis: 'x' as const },
    { icon: '↓', label: '向下', angle: -15, axis: 'x' as const },
    { icon: '↺', label: '向左', angle: 15, axis: 'z' as const },
    { icon: '↻', label: '向右', angle: -15, axis: 'z' as const },
  ];

  const slabModes = [
    { value: 'max', label: 'MIP (最大密度投影)' },
    { value: 'min', label: 'MinIP (最小密度投影)' },
    { value: 'avg', label: '平均投影' },
  ] as const;

  const scaleLocations = [
    { value: 'top', label: '上' },
    { value: 'bottom', label: '下' },
    { value: 'left', label: '左' },
    { value: 'right', label: '右' },
  ] as const;

  return (
    <div className="view-control-panel">
      {/* 旋转控制 */}
      <div className="panel-section">
        <h4 className="panel-title">旋转控制</h4>
        <div className="rotation-grid">
          {rotationButtons.map((btn) => (
            <button
              key={`${btn.axis}-${btn.angle}`}
              className="rotation-button"
              onClick={() => onRotate(btn.angle, btn.axis)}
              disabled={!hasVolume}
              title={btn.label}
            >
              <span className="rotation-icon">{btn.icon}</span>
              <span className="rotation-label">{btn.label}</span>
            </button>
          ))}
          <button
            className="rotation-button reset-button"
            onClick={onResetRotation}
            disabled={!hasVolume}
            title="重置旋转"
          >
            <span className="rotation-icon">🔄</span>
            <span className="rotation-label">重置</span>
          </button>
        </div>
      </div>

      {/* 层厚控制 */}
      <div className="panel-section">
        <h4 className="panel-title">层厚设置</h4>
        <div className="slab-control">
          <input
            type="range"
            min="1"
            max="20"
            value={slabThickness}
            onChange={(e) => onSlabThicknessChange(Number(e.target.value))}
            disabled={!hasVolume}
            className="slab-slider"
          />
          <div className="slab-value">
            <span className="value-number">{slabThickness}</span>
            <span className="value-unit">mm</span>
          </div>
        </div>
      </div>

      {/* 投影模式 */}
      <div className="panel-section">
        <h4 className="panel-title">投影模式</h4>
        <select
          value={slabMode}
          onChange={(e) => onSlabModeChange(e.target.value as 'max' | 'min' | 'avg')}
          disabled={!hasVolume}
          className="panel-select"
        >
          {slabModes.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      {/* 比例尺设置 */}
      <div className="panel-section">
        <h4 className="panel-title">比例尺</h4>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showScale}
            onChange={onToggleScale}
            disabled={!hasVolume}
          />
          <span>显示比例尺</span>
          {showScale && <span className="toggle-status">✓</span>}
        </label>
        {showScale && (
          <select
            value={scaleLocation}
            onChange={(e) => onScaleLocationChange(e.target.value as any)}
            disabled={!hasVolume}
            className="panel-select"
          >
            {scaleLocations.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <style>{`
        .view-control-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .panel-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .panel-title {
          margin: 0;
          font-size: 11px;
          color: #858585;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rotation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .rotation-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 10px 8px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rotation-button:hover:not(:disabled) {
          background: #4a4a4a;
          border-color: #007acc;
        }

        .rotation-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .rotation-button.reset-button {
          grid-column: 1 / -1;
          flex-direction: row;
          padding: 8px 12px;
        }

        .rotation-icon {
          font-size: 18px;
          line-height: 1;
        }

        .rotation-label {
          font-size: 11px;
          color: #cccccc;
        }

        .slab-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 6px;
        }

        .slab-slider {
          width: 100%;
          height: 4px;
          cursor: pointer;
        }

        .slab-value {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
        }

        .value-number {
          font-size: 18px;
          font-weight: 600;
          color: #007acc;
        }

        .value-unit {
          font-size: 12px;
          color: #858585;
        }

        .panel-select {
          width: 100%;
          padding: 8px 12px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 6px;
          color: #cccccc;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .panel-select:hover:not(:disabled) {
          border-color: #007acc;
        }

        .panel-select:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .toggle-label:hover {
          background: #4a4a4a;
          border-color: #007acc;
        }

        .toggle-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .toggle-label span:not(.toggle-status) {
          flex: 1;
          font-size: 13px;
          color: #cccccc;
        }

        .toggle-status {
          color: #007acc;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ViewControlPanel;
