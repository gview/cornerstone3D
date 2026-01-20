import React from 'react';

interface RotationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRotate: (angle: number, axis: 'x' | 'y' | 'z') => void;
  onResetRotation: () => void;
  disabled?: boolean;
}

const RotationPanel: React.FC<RotationPanelProps> = ({
  isOpen,
  onClose,
  onRotate,
  onResetRotation,
  disabled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="rotation-panel-overlay" onClick={onClose}>
      <div className="rotation-panel" onClick={(e) => e.stopPropagation()}>
        {/* 面板头部 */}
        <div className="rotation-panel-header">
          <h3>旋转控制</h3>
          <button
            onClick={onClose}
            className="close-button"
            title="关闭面板"
          >
            ✕
          </button>
        </div>

        {/* 旋转控制内容 */}
        <div className="rotation-panel-content">
          {/* Z轴旋转（左右旋转） */}
          <div className="rotation-section">
            <label className="rotation-label">水平旋转 (Z轴)</label>
            <div className="rotation-buttons">
              <button
                onClick={() => onRotate(15, 'z')}
                disabled={disabled}
                className="rotation-btn"
                title="向左旋转 15°"
              >
                ↺ 左转
              </button>
              <button
                onClick={() => onRotate(-15, 'z')}
                disabled={disabled}
                className="rotation-btn"
                title="向右旋转 15°"
              >
                ↻ 右转
              </button>
            </div>
          </div>

          {/* X轴旋转（上下旋转） */}
          <div className="rotation-section">
            <label className="rotation-label">垂直旋转 (X轴)</label>
            <div className="rotation-buttons">
              <button
                onClick={() => onRotate(15, 'x')}
                disabled={disabled}
                className="rotation-btn"
                title="向上旋转 15°"
              >
                ↑ 上转
              </button>
              <button
                onClick={() => onRotate(-15, 'x')}
                disabled={disabled}
                className="rotation-btn"
                title="向下旋转 15°"
              >
                ↓ 下转
              </button>
            </div>
          </div>

          {/* 重置按钮 */}
          <div className="rotation-section">
            <button
              onClick={onResetRotation}
              disabled={disabled}
              className="reset-btn"
              title="重置所有旋转角度"
            >
              🔄 重置旋转
            </button>
          </div>

          {/* 提示信息 */}
          <div className="rotation-hint">
            <p>💡 每次旋转 15°，可多次点击累积旋转角度</p>
          </div>
        </div>
      </div>

      <style>{`
        .rotation-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 10000;
          padding-top: 60px;
        }

        .rotation-panel {
          background: #1e1e1e;
          border: 1px solid #3e3e42;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          width: 90%;
          max-width: 350px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .rotation-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
        }

        .rotation-panel-header h3 {
          margin: 0;
          font-size: 14px;
          color: #cccccc;
          font-weight: 500;
        }

        .close-button {
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          color: #cccccc;
          font-size: 14px;
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

        .close-button:hover {
          opacity: 1;
          background: #3e3e42;
        }

        .rotation-panel-content {
          padding: 16px;
        }

        .rotation-section {
          margin-bottom: 16px;
        }

        .rotation-section:last-child {
          margin-bottom: 0;
        }

        .rotation-label {
          display: block;
          font-size: 12px;
          color: #858585;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .rotation-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .rotation-btn {
          padding: 10px 16px;
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
          gap: 4px;
        }

        .rotation-btn:hover:not(:disabled) {
          background: #4a4a4a;
          border-color: #007acc;
        }

        .rotation-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .reset-btn {
          width: 100%;
          padding: 10px 16px;
          background: #007acc;
          border: 1px solid #007acc;
          border-radius: 4px;
          color: #ffffff;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .reset-btn:hover:not(:disabled) {
          background: #1e8ad6;
        }

        .reset-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #3c3c3c;
          border-color: #3e3e42;
          color: #cccccc;
        }

        .rotation-hint {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #3e3e42;
        }

        .rotation-hint p {
          margin: 0;
          font-size: 11px;
          color: #858585;
          line-height: 1.4;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default RotationPanel;
