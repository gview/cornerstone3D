import React from 'react';

export interface ToolsPanelProps {
  activeTool: string;
  toolModes: Record<string, string>;
  onToolChange: (tool: string) => void;
  onToolModeChange: (tool: string, mode: string) => void;
  onDeleteSelected: () => void;
  onToggleCrosshairs: () => void;
  showCrosshairs: boolean;
  hasVolume: boolean;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeTool,
  toolModes,
  onToolChange,
  onToolModeChange,
  onDeleteSelected,
  onToggleCrosshairs,
  showCrosshairs,
  hasVolume,
}) => {
  const tools = [
    { name: 'Crosshairs', icon: '🎯', label: '十字线' },
    { name: 'WindowLevel', icon: '🎨', label: '窗宽窗位' },
    { name: 'Length', icon: '📏', label: '长度测量' },
    { name: 'Angle', icon: '📐', label: '角度测量' },
    { name: 'Bidirectional', icon: '✛', label: '双向测量' },
    { name: 'Probe', icon: '🔍', label: '探针' },
    { name: 'RectangleROI', icon: '⬜', label: '矩形 ROI' },
    { name: 'EllipticalROI', icon: '⭕', label: '椭圆 ROI' },
  ];

  const modes = [
    { value: 'Active', label: '激活' },
    { value: 'Passive', label: '被动' },
    { value: 'Enabled', label: '启用' },
    { value: 'Disabled', label: '禁用' },
  ];

  return (
    <div className="tools-panel">
      {/* 测量工具网格 */}
      <div className="panel-section">
        <h4 className="panel-title">测量工具</h4>
        <div className="tool-grid">
          {tools.map((tool) => (
            <button
              key={tool.name}
              className={`tool-grid-button ${activeTool === tool.name ? 'active' : ''}`}
              onClick={() => onToolChange(tool.name)}
              disabled={!hasVolume}
              title={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 十字线设置 */}
      <div className="panel-section">
        <h4 className="panel-title">十字线设置</h4>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showCrosshairs}
            onChange={onToggleCrosshairs}
            disabled={!hasVolume}
          />
          <span>显示十字线</span>
          {showCrosshairs && <span className="toggle-status">✓</span>}
        </label>
      </div>

      {/* 工具模式 */}
      <div className="panel-section">
        <h4 className="panel-title">工具模式</h4>
        <div className="mode-selector">
          <select
            value={toolModes[activeTool]}
            onChange={(e) => onToolModeChange(activeTool, e.target.value)}
            disabled={!hasVolume}
            className="mode-select"
          >
            {modes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
          <span className="current-tool">
            当前: {tools.find(t => t.name === activeTool)?.label || activeTool}
          </span>
        </div>
      </div>

      {/* 删除测量 */}
      <div className="panel-section">
        <button
          className="delete-button"
          onClick={onDeleteSelected}
          disabled={!hasVolume}
        >
          <span className="icon">🗑️</span>
          <span>删除选中测量</span>
        </button>
      </div>

      <style>{`
        .tools-panel {
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

        .tool-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .tool-grid-button {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 4px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tool-grid-button:hover:not(:disabled) {
          background: #4a4a4a;
          border-color: #007acc;
        }

        .tool-grid-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tool-grid-button.active {
          background: #007acc;
          border-color: #007acc;
          color: #ffffff;
        }

        .tool-icon {
          font-size: 20px;
          line-height: 1;
        }

        .tool-label {
          font-size: 10px;
          color: #cccccc;
          text-align: center;
          line-height: 1.2;
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

        .mode-selector {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mode-select {
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

        .mode-select:hover:not(:disabled) {
          border-color: #007acc;
        }

        .mode-select:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .current-tool {
          font-size: 11px;
          color: #858585;
          padding: 0 4px;
        }

        .delete-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          background: #d73a49;
          border: 1px solid #d73a49;
          border-radius: 6px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delete-button:hover:not(:disabled) {
          background: #b52a2a;
          border-color: #b52a2a;
        }

        .delete-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .delete-button .icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default ToolsPanel;
