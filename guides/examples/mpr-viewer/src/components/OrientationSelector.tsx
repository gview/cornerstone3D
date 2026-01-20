import React, { useState, useRef, useEffect } from 'react';
import { Enums } from '@cornerstonejs/core';

/**
 * 方位选择器组件
 * 允许用户切换视口的显示方位
 */
export interface OrientationSelectorProps {
  viewportId: string;
  currentOrientation: string;
  onOrientationChange: (viewportId: string, newOrientation: Enums.OrientationAxis) => void;
  disabled?: boolean;
}

// 可用的方位选项
const ORIENTATION_OPTIONS = [
  { value: Enums.OrientationAxis.AXIAL, label: '横断位', shortLabel: 'Axial' },
  { value: Enums.OrientationAxis.SAGITTAL, label: '矢状位', shortLabel: 'Sagittal' },
  { value: Enums.OrientationAxis.CORONAL, label: '冠状位', shortLabel: 'Coronal' },
];

const OrientationSelector: React.FC<OrientationSelectorProps> = ({
  viewportId,
  currentOrientation,
  onOrientationChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 获取当前方位的显示信息
  const getCurrentOrientationInfo = () => {
    return ORIENTATION_OPTIONS.find(opt => opt.value === currentOrientation) || ORIENTATION_OPTIONS[0];
  };

  // 处理方位选择
  const handleSelectOrientation = (orientation: Enums.OrientationAxis) => {
    onOrientationChange(viewportId, orientation);
    setIsOpen(false);
  };

  const currentInfo = getCurrentOrientationInfo();

  return (
    <div
      ref={dropdownRef}
      className={`orientation-selector ${disabled ? 'disabled' : ''}`}
    >
      {/* 方位标签（可点击） */}
      <div
        className="orientation-label"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span className="orientation-text">{currentInfo.shortLabel}</span>
      </div>

      {/* 下拉菜单 */}
      {isOpen && !disabled && (
        <div className="orientation-dropdown">
          {ORIENTATION_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`orientation-option ${
                option.value === currentOrientation ? 'active' : ''
              }`}
              onClick={() => handleSelectOrientation(option.value)}
            >
              <span className="option-label">{option.label}</span>
              <span className="option-short-label">{option.shortLabel}</span>
              {option.value === currentOrientation && (
                <span className="option-check">✓</span>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .orientation-selector {
          position: relative;
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          /* 允许交互 */
          pointer-events: auto !important;
        }

        .orientation-selector.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .orientation-label {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #64b5f6;
          background-color: rgba(0, 0, 0, 0.6);
          padding: 3px 8px;
          border-radius: 3px;
          user-select: none;
          transition: all 0.2s;
          /* 确保标签本身也可以接收事件 */
          pointer-events: auto !important;
          /* 添加下划线 */
          text-decoration: underline;
          text-decoration-color: #64b5f6;
        }

        .orientation-label:hover {
          color: #90caf9;
          background-color: rgba(0, 0, 0, 0.8);
          text-decoration-color: #90caf9;
        }

        .orientation-text {
          min-width: 60px;
        }

        .orientation-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          background-color: rgba(40, 40, 40, 0.95);
          border: 1px solid #555;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          min-width: 150px;
          z-index: 1000;
          overflow: hidden;
          /* 确保下拉菜单可以接收事件 */
          pointer-events: auto !important;
        }

        .orientation-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          color: #ffffff;
          cursor: pointer;
          transition: background-color 0.2s;
          border-bottom: 1px solid #444;
          /* 确保选项可以接收事件 */
          pointer-events: auto !important;
        }

        .orientation-option:last-child {
          border-bottom: none;
        }

        .orientation-option:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .orientation-option.active {
          background-color: rgba(0, 122, 204, 0.3);
        }

        .option-label {
          font-size: 13px;
        }

        .option-short-label {
          font-size: 11px;
          color: #888;
          margin-right: 8px;
        }

        .option-check {
          color: #007acc;
          font-size: 14px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default OrientationSelector;
