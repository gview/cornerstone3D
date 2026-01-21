import React from 'react';

export interface ToolsPanelProps {
  activeTool: string;
  toolModes: Record<string, string>;
  onToolModeChange: (tool: string, mode: string) => void;
  onDeleteSelected: () => void;
  hasVolume: boolean;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeTool,
  toolModes,
  onToolModeChange,
  onDeleteSelected,
  hasVolume,
}) => {
  const modes = [
    { value: 'Active', label: '激活' },
    { value: 'Passive', label: '被动' },
    { value: 'Enabled', label: '启用' },
    { value: 'Disabled', label: '禁用' },
  ];

  return (
    <div className="tools-panel">
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
            当前: {activeTool}
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
