import React from 'react';

export interface ToolbarProps {
  // 文件操作
  onLoadFiles: () => void;
  imageCount: number;

  // 工具选择
  activeTool: string;
  toolModes: Record<string, string>;
  onToolChange: (toolName: string) => void;
  onToolModeChange: (toolName: string, mode: string) => void;
  onToggleCrosshairs: () => void;
  showCrosshairs: boolean;

  // 视图控制
  onRotate: (angle: number, axis: 'x' | 'y' | 'z') => void;
  onResetRotation: () => void;
  slabThickness: number;
  onSlabThicknessChange: (value: number) => void;
  slabMode: 'max' | 'min' | 'avg';
  onSlabModeChange: (mode: 'max' | 'min' | 'avg') => void;

  // 比例尺
  showScale: boolean;
  scaleLocation: 'top' | 'bottom' | 'left' | 'right';
  onToggleScale: () => void;
  onScaleLocationChange: (location: 'top' | 'bottom' | 'left' | 'right') => void;

  // 测量
  onDeleteSelected: () => void;

  // 序列面板
  seriesCount: number;
  showSeriesPanel: boolean;
  onToggleSeriesPanel: () => void;

  // 测量面板
  showAnnotationsPanel: boolean;
  onToggleAnnotationsPanel: () => void;

  // 通用状态
  hasVolume: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onLoadFiles,
  imageCount,
  activeTool,
  toolModes,
  onToolChange,
  onToolModeChange,
  onToggleCrosshairs,
  showCrosshairs,
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
  onDeleteSelected,
  seriesCount,
  showSeriesPanel,
  onToggleSeriesPanel,
  showAnnotationsPanel,
  onToggleAnnotationsPanel,
  hasVolume,
}) => {
  return (
    <div className="toolbar">
      {/* 文件操作组 */}
      <div className="toolbar-group">
        <label className="toolbar-label">文件</label>
        <button onClick={onLoadFiles} className="primary-button">
          📁 加载 DICOM
        </button>
        {imageCount > 0 && (
          <span className="info-text">{imageCount} 张</span>
        )}
        {seriesCount > 0 && (
          <button
            onClick={onToggleSeriesPanel}
            className={showSeriesPanel ? 'active-button' : ''}
            title={showSeriesPanel ? '隐藏序列面板' : '显示序列面板'}
          >
            📚 序列
          </button>
        )}
        {hasVolume && (
          <button
            onClick={onToggleAnnotationsPanel}
            className={showAnnotationsPanel ? 'active-button' : ''}
            title={showAnnotationsPanel ? '隐藏测量面板' : '显示测量面板'}
          >
            📏 测量
          </button>
        )}
      </div>

      {/* 工具选择组 */}
      <div className="toolbar-group">
        <label className="toolbar-label">工具</label>
        <button
          onClick={() => onToolChange('Crosshairs')}
          disabled={!hasVolume}
          className={activeTool === 'Crosshairs' ? 'active-button' : ''}
          title="十字线工具"
        >
          🎯
        </button>
        <button
          onClick={onToggleCrosshairs}
          disabled={!hasVolume}
          className={showCrosshairs ? 'active-button' : ''}
          title={showCrosshairs ? '隐藏十字线' : '显示十字线'}
        >
          {showCrosshairs ? '✓' : '✗'}
        </button>
        <button
          onClick={() => onToolChange('WindowLevel')}
          disabled={!hasVolume}
          className={activeTool === 'WindowLevel' ? 'active-button' : ''}
          title="窗宽窗位"
        >
          🎨
        </button>
        <button
          onClick={() => onToolChange('Length')}
          disabled={!hasVolume}
          className={activeTool === 'Length' ? 'active-button' : ''}
          title="长度测量"
        >
          📏
        </button>
        <button
          onClick={() => onToolChange('Angle')}
          disabled={!hasVolume}
          className={activeTool === 'Angle' ? 'active-button' : ''}
          title="角度测量"
        >
          📐
        </button>
        <button
          onClick={() => onToolChange('Bidirectional')}
          disabled={!hasVolume}
          className={activeTool === 'Bidirectional' ? 'active-button' : ''}
          title="双向测量"
        >
          📏
        </button>
        <button
          onClick={() => onToolChange('Probe')}
          disabled={!hasVolume}
          className={activeTool === 'Probe' ? 'active-button' : ''}
          title="探针"
        >
          🔍
        </button>
        <button
          onClick={() => onToolChange('RectangleROI')}
          disabled={!hasVolume}
          className={activeTool === 'RectangleROI' ? 'active-button' : ''}
          title="矩形ROI"
        >
          ⬜
        </button>
        <button
          onClick={() => onToolChange('EllipticalROI')}
          disabled={!hasVolume}
          className={activeTool === 'EllipticalROI' ? 'active-button' : ''}
          title="椭圆ROI"
        >
          ⭕
        </button>
        <button
          onClick={onDeleteSelected}
          disabled={!hasVolume}
          title="删除选中测量"
          className="danger-button"
        >
          🗑️
        </button>
      </div>

      {/* 工具模式选择 */}
      <div className="toolbar-group">
        <label className="toolbar-label">模式</label>
        <select
          value={toolModes[activeTool]}
          onChange={(e) => onToolModeChange(activeTool, e.target.value)}
          disabled={!hasVolume}
          className="toolbar-select"
        >
          <option value="Active">激活</option>
          <option value="Passive">被动</option>
          <option value="Enabled">启用</option>
          <option value="Disabled">禁用</option>
        </select>
      </div>

      {/* 视图旋转组 */}
      <div className="toolbar-group">
        <label className="toolbar-label">旋转</label>
        <button onClick={() => onRotate(15, 'z')} disabled={!hasVolume} title="向左旋转">
          ↺
        </button>
        <button onClick={() => onRotate(-15, 'z')} disabled={!hasVolume} title="向右旋转">
          ↻
        </button>
        <button onClick={() => onRotate(15, 'x')} disabled={!hasVolume} title="向上旋转">
          ↑
        </button>
        <button onClick={() => onRotate(-15, 'x')} disabled={!hasVolume} title="向下旋转">
          ↓
        </button>
        <button onClick={onResetRotation} disabled={!hasVolume} title="重置旋转">
          🔄
        </button>
      </div>

      {/* 层厚控制组 */}
      <div className="toolbar-group">
        <label className="toolbar-label">层厚</label>
        <input
          type="range"
          min="1"
          max="20"
          value={slabThickness}
          onChange={(e) => onSlabThicknessChange(Number(e.target.value))}
          disabled={!hasVolume}
          className="toolbar-slider"
        />
        <span className="value-text">{slabThickness}</span>
      </div>

      <div className="toolbar-group">
        <label className="toolbar-label">投影</label>
        <select
          value={slabMode}
          onChange={(e) => onSlabModeChange(e.target.value as 'max' | 'min' | 'avg')}
          disabled={!hasVolume}
          className="toolbar-select"
        >
          <option value="max">MIP</option>
          <option value="min">MinIP</option>
          <option value="avg">平均</option>
        </select>
      </div>

      {/* 比例尺控制组 */}
      <div className="toolbar-group">
        <label className="toolbar-label">比例尺</label>
        <button
          onClick={onToggleScale}
          disabled={!hasVolume}
          className={showScale ? 'active-button' : ''}
          title={showScale ? '隐藏比例尺' : '显示比例尺'}
        >
          📏
        </button>
        <select
          value={scaleLocation}
          onChange={(e) => onScaleLocationChange(e.target.value as any)}
          disabled={!hasVolume || !showScale}
          className="toolbar-select"
        >
          <option value="top">上</option>
          <option value="bottom">下</option>
          <option value="left">左</option>
          <option value="right">右</option>
        </select>
      </div>

      <style>{`
        .toolbar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 12px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          overflow-x: auto;
          flex-shrink: 0;
        }

        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-right: 16px;
          border-right: 1px solid #3e3e42;
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .toolbar-label {
          font-size: 11px;
          color: #858585;
          font-weight: 500;
          white-space: nowrap;
        }

        .toolbar button {
          min-width: 32px;
          height: 28px;
          padding: 4px 8px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #cccccc;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toolbar button:hover:not(:disabled) {
          background: #4a4a4a;
          border-color: #007acc;
        }

        .toolbar button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .toolbar button.active-button {
          background: #007acc;
          border-color: #007acc;
          color: #ffffff;
        }

        .toolbar button.primary-button {
          background: #007acc;
          border-color: #007acc;
          color: #ffffff;
        }

        .toolbar button.primary-button:hover:not(:disabled) {
          background: #1e8ad6;
        }

        .toolbar button.danger-button {
          background: #d73a49;
          border-color: #d73a49;
          color: #ffffff;
        }

        .toolbar button.danger-button:hover:not(:disabled) {
          background: #b52a2a;
        }

        .toolbar-select {
          height: 28px;
          padding: 4px 6px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #cccccc;
          font-size: 11px;
          cursor: pointer;
          min-width: 70px;
        }

        .toolbar-select:hover:not(:disabled) {
          border-color: #007acc;
        }

        .toolbar-select:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .toolbar-slider {
          width: 80px;
          height: 4px;
          cursor: pointer;
        }

        .info-text {
          font-size: 11px;
          color: #858585;
          white-space: nowrap;
        }

        .value-text {
          font-size: 11px;
          color: #cccccc;
          min-width: 20px;
          text-align: center;
        }

        /* 滚动条样式 */
        .toolbar::-webkit-scrollbar {
          height: 8px;
        }

        .toolbar::-webkit-scrollbar-track {
          background: #2d2d30;
        }

        .toolbar::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 4px;
        }

        .toolbar::-webkit-scrollbar-thumb:hover {
          background: #4e4e4e;
        }
      `}</style>
    </div>
  );
};

export default Toolbar;
